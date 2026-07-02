export const dynamic = 'force-static';
// app/api/live/start-battle/route.ts
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export async function POST(req: Request) {
  const { liveStreamId, participant1Id, participant2Id, durationSeconds = 60 } = await req.json();

  // Verificar que el usuario que llama es el streamer de la sala
  const { data: live } = await supabase
    .from('live_streams')
    .select('user_id')
    .eq('id', liveStreamId)
    .single();

  if (!live) return NextResponse.json({ error: 'Live no encontrado' }, { status: 404 });
  // Aquí deberías validar la sesión del usuario (ej. con clerk)

  const now = new Date();
  const endsAt = new Date(now.getTime() + durationSeconds * 1000);

  const { error } = await supabase
    .from('live_streams')
    .update({
      battle_mode: true,
      battle_started_at: now,
      battle_ends_at: endsAt,
      battle_participant1: participant1Id,
      battle_participant2: participant2Id,
      battle_score1: 0,
      battle_score2: 0,
      battle_winner: null,
    })
    .eq('id', liveStreamId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Emitir evento por WebSocket a todos los espectadores
  const { getSocket } = await import('@/lib/socket/server');
  const io = getSocket();
  io.to(`live:${liveStreamId}`).emit('battle-started', {
    participant1: participant1Id,
    participant2: participant2Id,
    endsAt: endsAt.toISOString(),
  });

  return NextResponse.json({ success: true, endsAt });
}