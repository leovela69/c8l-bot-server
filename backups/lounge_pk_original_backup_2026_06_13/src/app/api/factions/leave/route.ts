export const dynamic = 'force-static';
import { supabase } from '@/lib/supabase/client';

export async function POST(req: Request) {
  try {
    const { factionId, userId } = await req.json();

    if (!factionId || !userId) {
      return Response.json({ error: 'ID de bando y ID de usuario son requeridos' }, { status: 400 });
    }

    const isMock = !process.env.NEXT_PUBLIC_SUPABASE_URL || 
                   process.env.NEXT_PUBLIC_SUPABASE_URL.includes('tu_url') || 
                   !process.env.NEXT_PUBLIC_SUPABASE_URL.startsWith('http');

    // Check if member is active
    let memberRecord: any = null;

    if (!isMock) {
      const { data: member } = await supabase
        .from('faction_members')
        .select('*')
        .eq('faction_id', factionId)
        .eq('user_id', userId)
        .single();
      memberRecord = member;
    } else {
      memberRecord = { status: 'active' };
    }

    if (!memberRecord) {
      return Response.json({ error: 'No eres miembro de este bando' }, { status: 404 });
    }

    // Delete membership

    const { error } = await supabase
      .from('faction_members')
      .delete()
      .eq('faction_id', factionId)
      .eq('user_id', userId);

    if (error) throw error;

    // Decrement member count if member was active
    if (memberRecord && memberRecord.status === 'active') {
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

    return Response.json({ success: true });
  } catch (err: any) {
    console.error('Error leaving faction:', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
