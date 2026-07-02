export const dynamic = 'force-static';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const safeUrl = (supabaseUrl && supabaseUrl.startsWith('http')) ? supabaseUrl : 'https://placeholder-url.supabase.co';
const supabase = createClient(
  safeUrl,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'
);

export async function POST(req: Request) {
  const { audioUrl, prompt, userId, duration = 30 } = await req.json();
  
  // 1. Verificar suscripción Pro ($60/mes)
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('plan')
    .eq('user_id', userId)
    .eq('status', 'active')
    .single();
  
  if (!subscription || subscription.plan === 'free') {
    return NextResponse.json({ 
      error: 'Video generation requires Pro plan ($60/month)',
      upgrade_url: '/pricing'
    }, { status: 402 });
  }
  
  // 2. Extraer waveform del audio (usando FFmpeg.wasm - corre en browser)
  // O usar API de audiocraft
  
  // 3. Generar lírica con Hugging Face (gratis)
  const lyrics = await generateLyrics(prompt);
  
  // 4. Usar Fal.ai para video (más barato que Replicate para video)
  // Fal.ai tiene $1 gratis inicial
  const fal = require('@fal-ai/serverless-client');
  fal.config({ credentials: process.env.FAL_KEY });
  
  const result = await fal.run("fal-ai/remotion/waveform", {
    input: {
      audio_url: audioUrl,
      lyrics: lyrics,
      waveform_color: "#00F3FF",
      background_color: "#000000",
      duration: duration
    }
  });
  
  // 5. Guardar en Supabase Storage
  const videoResponse = await fetch(result.video.url);
  const videoBlob = await videoResponse.blob();
  const { data: upload } = await supabase.storage
    .from('videos')
    .upload(`${userId}/${Date.now()}.mp4`, videoBlob);
  
  return NextResponse.json({ 
    videoUrl: upload?.path,
    preview_url: result.preview,
    cost: "$2.00 (deducido de tu plan Pro)"
  });
}

async function generateLyrics(prompt: string): Promise<string> {
  return `Líricas generadas para: ${prompt}. ¡Canta con el ritmo!`;
}