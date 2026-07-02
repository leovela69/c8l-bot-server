export const dynamic = 'force-static';
import { supabase } from '@/lib/supabase/client';

export async function POST(req: Request) {
  try {
    const { factionId, operatorId, targetUserId, action, newRole } = await req.json();

    if (!factionId || !operatorId || !targetUserId || !action) {
      return Response.json({ error: 'Parámetros incompletos' }, { status: 400 });
    }

    const isMock = !process.env.NEXT_PUBLIC_SUPABASE_URL || 
                   process.env.NEXT_PUBLIC_SUPABASE_URL.includes('tu_url') || 
                   !process.env.NEXT_PUBLIC_SUPABASE_URL.startsWith('http');

    // 1. Get operator's role
    const { data: operator } = await supabase
      .from('faction_members')
      .select('*')
      .eq('faction_id', factionId)
      .eq('user_id', operatorId)
      .eq('status', 'active')
      .single();

    let operatorRecord = operator;
    if (isMock) {
      operatorRecord = { role: 'captain', status: 'active' };
    } else if (!operatorRecord) {
      return Response.json({ error: 'No autorizado. Debes ser un miembro activo del bando' }, { status: 403 });
    }

    const isOperatorCaptain = operatorRecord.role === 'captain';
    const isOperatorVice = operatorRecord.role === 'vice-captain';
    const isOperatorAdmin = operatorRecord.role === 'admin';

    if (!isOperatorCaptain && !isOperatorVice && !isOperatorAdmin) {
      return Response.json({ error: 'No autorizado. Permiso denegado para soldados comunes' }, { status: 403 });
    }

    // 2. Perform actions
    if (action === 'accept-join') {
      const { data: updated, error } = isMock
        ? { data: null, error: null }
        : await supabase
            .from('faction_members')
            .update({ status: 'active' })
            .eq('faction_id', factionId)
            .eq('user_id', targetUserId)
            .select()
            .single();

      if (!isMock && error) throw error;

      let updatedRecord = updated;
      if (isMock) {
        updatedRecord = {
          faction_id: factionId,
          user_id: targetUserId,
          role: 'member',
          status: 'active'
        };
      }

      // Increment members count
      if (!isMock) {
        const { data: faction } = await supabase
          .from('factions')
          .select('member_count')
          .eq('id', factionId)
          .single();

        if (faction) {
          await supabase
            .from('factions')
            .update({ member_count: (faction.member_count || 0) + 1 })
            .eq('id', factionId);
        }
      }

      return Response.json({ success: true, member: updatedRecord });
    }

    if (action === 'reject-join') {
      if (!isMock) {
        await supabase
          .from('faction_members')
          .delete()
          .eq('faction_id', factionId)
          .eq('user_id', targetUserId)
          .eq('status', 'pending');
      }

      return Response.json({ success: true });
    }

    if (action === 'kick') {
      // Get target role to make sure operator has hierarchy
      const { data: target } = await supabase
        .from('faction_members')
        .select('*')
        .eq('faction_id', factionId)
        .eq('user_id', targetUserId)
        .single();

      let targetRecord = target;
      if (isMock) {
        targetRecord = { faction_id: factionId, user_id: targetUserId, role: 'member', status: 'active' };
      } else if (!targetRecord) {
        return Response.json({ error: 'Miembro no encontrado' }, { status: 444 });
      }

      // Verify hierarchy: Vice/Admin cannot kick Captain. Admin cannot kick Vice.
      if (targetRecord.role === 'captain') {
        return Response.json({ error: 'No se puede expulsar al Capitán' }, { status: 403 });
      }
      if ((isOperatorAdmin || isOperatorVice) && targetRecord.role === 'vice-captain' && !isOperatorCaptain) {
        return Response.json({ error: 'No tienes jerarquía suficiente para expulsar a este miembro' }, { status: 403 });
      }

      if (!isMock) {
        await supabase
          .from('faction_members')
          .delete()
          .eq('faction_id', factionId)
          .eq('user_id', targetUserId);

        // Decrement members count
        if (targetRecord.status === 'active') {
          const { data: faction } = await supabase
            .from('factions')
            .select('member_count')
            .eq('id', factionId)
            .single();

          if (faction) {
            await supabase
              .from('factions')
              .update({ member_count: Math.max(1, (faction.member_count || 1) - 1) })
              .eq('id', factionId);
          }
        }
      }

      return Response.json({ success: true });
    }

    if (action === 'role') {
      if (!isOperatorCaptain) {
        return Response.json({ error: 'Solo el Capitán puede cambiar los rangos de jerarquía' }, { status: 403 });
      }
      if (!newRole) return Response.json({ error: 'El nuevo rango es requerido' }, { status: 400 });

      const { data: updated, error } = isMock
        ? { data: null, error: null }
        : await supabase
            .from('faction_members')
            .update({ role: newRole })
            .eq('faction_id', factionId)
            .eq('user_id', targetUserId)
            .select()
            .single();

      if (!isMock && error) throw error;

      let updatedRecord = updated;
      if (isMock) {
        updatedRecord = {
          faction_id: factionId,
          user_id: targetUserId,
          role: newRole,
          status: 'active'
        };
      }

      return Response.json({ success: true, member: updatedRecord });
    }

    return Response.json({ error: 'Acción no válida' }, { status: 400 });
  } catch (err: any) {
    console.error('Error managing faction roles:', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
