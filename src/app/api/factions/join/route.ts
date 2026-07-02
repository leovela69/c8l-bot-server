export const dynamic = 'force-static';
import { supabase } from '@/lib/supabase/client';

export async function POST(req: Request) {
  try {
    const { factionId, userId } = await req.json();

    if (!factionId || !userId) {
      return Response.json({ error: 'ID de bando y ID de usuario son requeridos' }, { status: 400 });
    }

    // 1. Verify that user is not already active in any faction
    const { data: existingActive } = await supabase
      .from('faction_members')
      .select('id, faction_id, factions(name)')
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle();

    if (existingActive) {
      // @ts-ignore
      const factionName = existingActive.factions?.name || 'otro bando';
      return Response.json({ error: `Ya eres miembro activo de: ${factionName}. Debes abandonarlo primero.` }, { status: 400 });
    }

    // 2. Submit joining request (status 'pending')
    const { data: member, error } = await supabase
      .from('faction_members')
      .insert({
        faction_id: factionId,
        user_id: userId,
        role: 'member',
        status: 'pending'
      })
      .select()
      .single();

    if (error) {
      // If invitation/request already exists, return message
      return Response.json({ error: 'Ya has solicitado unirte a este bando o ya eres parte de él' }, { status: 409 });
    }

    return Response.json({ success: true, member });
  } catch (err: any) {
    console.error('Error joining faction:', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
