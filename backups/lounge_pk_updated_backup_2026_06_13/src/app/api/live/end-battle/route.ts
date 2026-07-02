export const dynamic = 'force-static';
// app/api/live/end-battle/route.ts
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export async function POST(req: Request) {
  const { liveStreamId } = await req.json();

  const { data: live, error } = await supabase
    .from('live_streams')
    .select('battle_participant1, battle_participant2, battle_score1, battle_score2, user_id')
    .eq('id', liveStreamId)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  let winnerId = null;
  if (live.battle_score1 > live.battle_score2) winnerId = live.battle_participant1;
  else if (live.battle_score2 > live.battle_score1) winnerId = live.battle_participant2;
  // empate: no hay ganador

  // Bonus para el ganador: 20% extra de las estrellas generadas durante la batalla (se puede implementar aparte)
  if (winnerId) {
    // Registrar bonus (ejemplo: añadir estrellas a la tabla creator_balances)
    // Sumamos el 20% del total de coins gastados en regalos (battle_score1 + battle_score2)
    const totalCoins = live.battle_score1 + live.battle_score2;
    const bonusStars = Math.floor(totalCoins * 0.2);
    await supabase.rpc('add_stars_to_creator', { user_id: winnerId, stars: bonusStars });
  }

  await supabase
    .from('live_streams')
    .update({ battle_mode: false, battle_winner: winnerId })
    .eq('id', liveStreamId);

  const { getSocket } = await import('@/lib/socket/server');
  const io = getSocket();
  io.to(`live:${liveStreamId}`).emit('battle-ended', { winnerId });

  return NextResponse.json({ success: true, winnerId });
}