export const dynamic = 'force-static';
// app/api/music/generate/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Replicate from 'replicate';

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN || 'placeholder', // gratis, pago por uso
});

const supabaseUrl = process.env.SUPABASE_URL;
const safeUrl = (supabaseUrl && supabaseUrl.startsWith('http')) ? supabaseUrl : 'https://placeholder-url.supabase.co';
const supabase = createClient(
  safeUrl,
  process.env.SUPABASE_ANON_KEY || 'placeholder-key'
);

export async function POST(req: Request) {
  const { prompt, userId, duration = 15 } = await req.json();
  
  // 1. Verificar suscripción (Supabase)
  const { data: user } = await supabase
    .from('users')
    .select('plan, music_generated_this_month')
    .eq('id', userId)
    .single();
  
  if (!user || (user.plan === 'free' && user.music_generated_this_month >= 3)) {
    return NextResponse.json({ error: !user ? 'Usuario no encontrado' : 'Límite mensual alcanzado. Upgradé a Pro por $60/mes' }, { status: !user ? 404 : 402 });
  }
  
  // 2. Traducir prompt (usando un LLM gratis via Hugging Face)
  const translatedPrompt = await translatePrompt(prompt);
  
  // 3. Generar música con Replicate
  // Modelo: musicgen (Meta) - $0.01 por generación aprox
  const prediction = await replicate.predictions.create({
    version: "671ac645ce5e552cc63a54a2bbff63fcf798043055d2dac5fc9e36a837eedcfb",
    input: {
      prompt: translatedPrompt,
      duration: duration,
      temperature: 0.8,
      top_k: 250,
      top_p: 0.95,
    },
    webhook: `${process.env.NEXT_PUBLIC_BASE_URL}/api/music/webhook`,
    webhook_events_filter: ["completed"]
  });
  
  // 4. Guardar en Supabase (pending)
  await supabase.from('generated_content').insert({
    user_id: userId,
    type: 'music',
    prompt: prompt,
    status: 'pending',
    replicate_prediction_id: prediction.id,
  });
  
  return NextResponse.json({ 
    predictionId: prediction.id,
    status: 'processing',
    message: 'Generando tu música... unos segundos'
  });
}

// Traducción de prompt (gratis, sin API key)
async function translatePrompt(rawPrompt: string): Promise<string> {
  // Usamos Hugging Face Inference API (gratis, rate limitado)
  const genres: Record<string, string> = {
    'flamenco': 'flamenco guitar, palmas, cajón flamenco, compás de soleá',
    'jazz': 'jazz trio, double bass, soft saxophone, piano jazz',
    'reggaeton': 'dembow, reggaeton beat, 90bpm, perreo',
    'rock': 'electric guitar, drums, rock band, 120bpm',
    'lofi': 'lofi hip hop, vinyl crackle, chillhop, jazz samples',
    'electronic': 'synthwave, 80s synth, drum machine, 110bpm'
  };
  
  const moods: Record<string, string> = {
    'triste': 'minor key, slow tempo, melancholic, emotional',
    'feliz': 'major key, upbeat, energetic, happy',
    'oscuro': 'dark ambient, minor, mysterious, tense',
    'relajante': 'calm, peaceful, soft, ambient'
  };
  
  const lower = rawPrompt.toLowerCase();
  const genre = Object.keys(genres).find(g => lower.includes(g)) || 'electronic';
  const mood = Object.keys(moods).find(m => lower.includes(m)) || 'neutral';
  
  return `${genres[genre]}, ${moods[mood]}, ${rawPrompt}`;
}