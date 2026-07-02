import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// POST /api/factions/manage-members
// Captain/admin: promote, demote, kick, approve pending
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

    const { factionId, targetUserId, action, newRole } = await req.json();
    // action: 'promote' | 'demote' | 'kick' | 'approve' | 'ban'

    if (!factionId || !targetUserId || !action) {
      return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 });
    }

    // Verify caller is captain or admin
    const { data: callerMember } = await supabase
      .from('faction_members')
      .select('role')
      .eq('faction_id', factionId)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (!callerMember || !['captain', 'vice_captain', 'admin'].includes(callerMember.role)) {
      return NextResponse.json({ error: 'Sin permisos de gestión' }, { status: 403 });
    }

    // Prevent acting on captain
    const { data: targetMember } = await supabase
      .from('faction_members')
      .select('role')
      .eq('faction_id', factionId)
      .eq('user_id', targetUserId)
      .single();

    if (!targetMember) {
      return NextResponse.json({ error: 'Miembro no encontrado' }, { status: 404 });
    }

    if (targetMember.role === 'captain' && callerMember.role !== 'captain') {
      return NextResponse.json({ error: 'No puedes gestionar al Capitán' }, { status: 403 });
    }

    switch (action) {
      case 'promote': {
        if (!newRole) return NextResponse.json({ error: 'Especifica el nuevo rol' }, { status: 400 });
        const roleHierarchy = ['member', 'admin', 'vice_captain', 'captain'];
        const callerIdx = roleHierarchy.indexOf(callerMember.role);
        const newRoleIdx = roleHierarchy.indexOf(newRole);
        if (newRoleIdx >= callerIdx) {
          return NextResponse.json({ error: 'No puedes asignar un rol igual o superior al tuyo' }, { status: 403 });
        }
        await supabase
          .from('faction_members')
          .update({ role: newRole })
          .eq('faction_id', factionId)
          .eq('user_id', targetUserId);
        return NextResponse.json({ success: true, message: `Rol actualizado a ${newRole}` });
      }

      case 'demote': {
        const demoteMap: Record<string, string> = {
          vice_captain: 'admin',
          admin: 'member',
          member: 'member',
        };
        const demotedRole = demoteMap[targetMember.role] ?? 'member';
        await supabase
          .from('faction_members')
          .update({ role: demotedRole })
          .eq('faction_id', factionId)
          .eq('user_id', targetUserId);
        return NextResponse.json({ success: true, message: `Descendido a ${demotedRole}` });
      }

      case 'kick': {
        await supabase
          .from('faction_members')
          .delete()
          .eq('faction_id', factionId)
          .eq('user_id', targetUserId);
        return NextResponse.json({ success: true, message: 'Miembro expulsado del Bando' });
      }

      case 'approve': {
        await supabase
          .from('faction_members')
          .update({ status: 'active' })
          .eq('faction_id', factionId)
          .eq('user_id', targetUserId)
          .eq('status', 'pending');
        return NextResponse.json({ success: true, message: 'Solicitud aprobada' });
      }

      case 'ban': {
        await supabase
          .from('faction_members')
          .update({ status: 'banned' })
          .eq('faction_id', factionId)
          .eq('user_id', targetUserId);
        return NextResponse.json({ success: true, message: 'Usuario baneado del Bando' });
      }

      default:
        return NextResponse.json({ error: 'Acción no válida' }, { status: 400 });
    }
  } catch (e) {
    console.error('[manage-members]', e);
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
