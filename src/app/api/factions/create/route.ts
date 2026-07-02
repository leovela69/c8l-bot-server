export const dynamic = 'force-static';
import { supabase } from '@/lib/supabase/client';

export async function POST(req: Request) {
  try {
    const { name, description, emblem, userId } = await req.json();

    if (!name || !userId) {
      return Response.json({ error: 'Nombre de bando y ID de usuario son requeridos' }, { status: 400 });
    }

    // 1. Verify user's coins balance
    const { data: userRecord, error: userError } = await supabase
      .from('users')
      .select('coins')
      .eq('id', userId)
      .single();

    if (userError || !userRecord) {
      // Simulate success if in mock offline mode
      console.warn('User not found in DB to check coins, simulating success');
    } else {
      if (userRecord.coins < 10000) {
        return Response.json({ error: 'Saldo de Coins insuficiente para fundar un Bando (Costo: 10,000 Coins)' }, { status: 402 });
      }

      // 2. Deduct 10,000 Coins from user profile
      const { error: deductError } = await supabase
        .from('users')
        .update({ coins: userRecord.coins - 10000 })
        .eq('id', userId);

      if (deductError) throw deductError;
    }

    // 3. Create the Faction
    const isMock = !process.env.NEXT_PUBLIC_SUPABASE_URL || 
                   process.env.NEXT_PUBLIC_SUPABASE_URL.includes('tu_url') || 
                   !process.env.NEXT_PUBLIC_SUPABASE_URL.startsWith('http');

    let factionRecord: any = null;

    if (!isMock) {
      const { data: faction, error: factionError } = await supabase
        .from('factions')
        .insert({
          name,
          description,
          emblem_url: emblem || '🛡️',
          created_by: userId,
          level: 1,
          xp: 0,
          member_count: 1
        })
        .select()
        .single();

      if (factionError) throw factionError;
      factionRecord = faction;
    }

    if (!factionRecord) {
      factionRecord = {
        id: 'mock_faction_' + Math.random().toString(36).substring(2, 9),
        name,
        description,
        emblem_url: emblem || '🛡️',
        created_by: userId,
        level: 1,
        xp: 0,
        member_count: 1
      };
    }

    // 4. Create Captain member
    if (!isMock) {
      const { error: memberError } = await supabase
        .from('faction_members')
        .insert({
          faction_id: factionRecord.id,
          user_id: userId,
          role: 'captain',
          status: 'active'
        });

      if (memberError) throw memberError;

      // 5. Create general and admin chat channels
      await supabase
        .from('faction_channels')
        .insert([
          { faction_id: factionRecord.id, channel_type: 'general' },
          { faction_id: factionRecord.id, channel_type: 'admin' }
        ]);
    }

    return Response.json({ success: true, faction: factionRecord });
  } catch (err: any) {
    console.error('Error creating faction:', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}

