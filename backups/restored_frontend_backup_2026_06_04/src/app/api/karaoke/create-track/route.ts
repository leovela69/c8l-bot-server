export const dynamic = 'force-static';
// app/api/karaoke/create-track/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Replicate from 'replicate';

const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN || 'placeholder' });
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const safeUrl = (supabaseUrl && supabaseUrl.startsWith('http')) ? supabaseUrl : 'https://placeholder-url.supabase.co';
const supabase = createClient(
  safeUrl,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'
);

export async function POST(req: Request) {
  const { title, genre, mood, duration = 30, userId } = await req.json();
  
  // 1. Verificar coins del usuario (cuesta 100 coins generar una base)
  const { data: user } = await supabase
    .from('users')
    .select('coins')
    .eq('id', userId)
    .single();
  
  if (!user || user.coins < 100) {
    return NextResponse.json({ error: 'Necesitas 100 coins para crear una base de karaoke' }, { status: 402 });
  }
  
  // 2. Generar música instrumental con Replicate (sin voz)
  const prompt = `${genre} ${mood} instrumental, no vocals, karaoke version, professional quality`;
  
  const prediction = await replicate.predictions.create({
    version: "671ac645ce5e552cc63a54a2bbff63fcf798043055d2dac5fc9e36a837eedcfb",
    input: {
      prompt: prompt,
      duration: duration,
      temperature: 0.7,
      top_k: 250,
    },
    webhook: `${process.env.NEXT_PUBLIC_BASE_URL}/api/karaoke/track-webhook`,
  });
  
  // 3. Descontar coins y guardar track pendiente
  await supabase.rpc('subtract_coins', { user_id: userId, amount: 100 });
  
  const { data: track } = await supabase
    .from('karaoke_tracks')
    .insert({
      title: title,
      genre: genre,
      mood: mood,
      duration_seconds: duration,
      created_by: userId,
      instrumental_url: 'processing',
      status: 'pending'
    })
    .select()
    .single();
  
  return NextResponse.json({
    success: true,
    trackId: track?.id,
    message: '🎵 Base de karaoke en generación...'
  });
}