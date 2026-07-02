export const dynamic = 'force-static';
// app/api/live/watch/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { AccessToken } from 'livekit-server-sdk';
import { supabase } from '@/lib/supabase/client';

export async function POST(req: NextRequest) {
  const { streamId, userId } = await req.json();

  // Verificar que el stream existe y está en vivo
  const { data: stream, error } = await supabase
    .from('live_streams')
    .select('status')
    .eq('id', streamId)
    .single();
  if (error || stream.status !== 'live') {
    return NextResponse.json({ error: 'Stream no disponible' }, { status: 404 });
  }

  // Generar token de espectador (solo puede suscribirse, no publicar)
  const at = new AccessToken(process.env.LIVEKIT_API_KEY, process.env.LIVEKIT_API_SECRET, {
    identity: userId,
    ttl: '2h',
  });
  at.addGrant({ roomJoin: true, room: streamId, canPublish: false, canSubscribe: true });

  const token = await at.toJwt();

  // Registrar visualización (para contador de espectadores)
  await supabase.from('live_viewers').upsert({ stream_id: streamId, user_id: userId, joined_at: new Date() });

  return NextResponse.json({ token, stream });
}