export const dynamic = 'force-static';
// app/api/live/start/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import { AccessToken } from 'livekit-server-sdk';

export async function POST(req: NextRequest) {
  const { userId, title, description, thumbnailUrl } = await req.json();

  // Verificar que el usuario existe y puede hacer live (por ejemplo, nivel > 5)
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('level, coins, display_name, name')
    .eq('id', userId)
    .single();
  if (userError || !user || user.level < 5) {
    return NextResponse.json({ error: 'No tienes permiso para hacer lives (nivel mínimo 5)' }, { status: 403 });
  }

  // Crear o actualizar el stream en la BD
  const { data: stream, error } = await supabase
    .from('live_streams')
    .insert({
      user_id: userId,
      title,
      description,
      thumbnail_url: thumbnailUrl,
      status: 'live',
      started_at: new Date(),
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Generar token de LiveKit para este streamer (sala con el stream.id)
  const at = new AccessToken(process.env.LIVEKIT_API_KEY, process.env.LIVEKIT_API_SECRET, {
    identity: userId,
    name: user.display_name || user.name || 'Streamer',
    ttl: '6h',
  });
  at.addGrant({ roomJoin: true, room: stream.id, canPublish: true, canSubscribe: true });

  const token = await at.toJwt();

  return NextResponse.json({ stream, token });
}