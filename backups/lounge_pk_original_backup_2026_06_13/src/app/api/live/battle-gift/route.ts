export const dynamic = 'force-static';
// app/api/live/battle-gift/route.ts
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export async function POST(req: Request) {
  const { liveStreamId, toUserId, giftCoinsValue } = await req.json();

  // Obtener estado actual de la batalla
  const { data: live, error } = await supabase
    .from('live_streams')
    .select('battle_mode, battle_participant1, battle_participant2, battle_score1, battle_score2, battle_ends_at')
    .eq('id', liveStreamId)
    .single();

  if (error || !live || !live.battle_mode) {
    return NextResponse.json({ error: 'No hay batalla activa' }, { status: 400 });
  }

  // Verificar si la batalla ya terminó
  if (new Date() > new Date(live.battle_ends_at)) {
    return NextResponse.json({ error: 'Batalla finalizada' }, { status: 400 });
  }

  let scoreField = '';
  if (toUserId === live.battle_participant1) scoreField = 'battle_score1';
  else if (toUserId === live.battle_participant2) scoreField = 'battle_score2';
  else return NextResponse.json({ error: 'Usuario no participa en esta batalla' }, { status: 400 });

  // Incrementar puntuación
  const { data: updated, error: updateError } = await supabase
    .from('live_streams')
    .update({ [scoreField]: supabase.rpc('increment', { x: giftCoinsValue }) })
    .eq('id', liveStreamId)
    .select('battle_score1, battle_score2')
    .single();

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  // Emitir actualización por WebSocket
  const { getSocket } = await import('@/lib/socket/server');
  const io = getSocket();
  io.to(`live:${liveStreamId}`).emit('battle-score-update', {
    score1: updated.battle_score1,
    score2: updated.battle_score2,
  });

  return NextResponse.json({ success: true, scores: { score1: updated.battle_score1, score2: updated.battle_score2 } });
}