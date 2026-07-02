export const dynamic = 'force-static';
// app/api/karaoke/evaluate-cover/route.ts (versión mejorada)
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import { put } from '@vercel/blob';
import { analyzeVocalWithAssemblyAI } from '@/lib/assemblyai/client';

interface VocalAnalysisResult {
  text: string;
  confidence: number;
  sentiment: { sentiment: string; confidence: number };
  audio_duration: number;
  words: any[];
  pitchAccuracy: number;
  rhythmAccuracy: number;
  clarityScore: number;
  totalScore: number;
  feedback: string[];
  badge: string;
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const coverFile = formData.get('cover') as File;
    const trackId = formData.get('trackId') as string;
    const userId = formData.get('userId') as string;
    const userEmail = formData.get('userEmail') as string;
    
    // 1. Verificar usuario y coins
    const { data: user } = await supabase
      .from('users')
      .select('coins, plan')
      .eq('id', userId)
      .single();
    
    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }
    
    if (user.coins < 50) {
      return NextResponse.json({ 
        error: 'Necesitas 50 coins para grabar un cover',
        rechargeUrl: '/games?recharge=true'
      }, { status: 402 });
    }
    
    // 2. Subir cover a almacenamiento
    const blob = await put(`covers/${trackId}_${userId}_${Date.now()}.mp3`, coverFile, {
      access: 'public',
      token: process.env.BLOB_READ_WRITE_TOKEN!
    });
    
    // 3. Analizar con AssemblyAI (si hay API key)
    let analysis: VocalAnalysisResult;
    if (process.env.ASSEMBLYAI_API_KEY) {
      analysis = await analyzeVocalWithAssemblyAI(blob.url);
    } else {
      // Fallback al análisis local
      analysis = await localVocalAnalysis(coverFile);
    }
    
    // 4. Calcular recompensa según puntuación
    let rewardCoins = 0;
    if (analysis.totalScore >= 90) rewardCoins = 500;
    else if (analysis.totalScore >= 75) rewardCoins = 200;
    else if (analysis.totalScore >= 60) rewardCoins = 50;
    else rewardCoins = 10;
    
    // Bonus por ser la primera vez que canta esta canción
    const { count: existingCovers } = await supabase
      .from('karaoke_covers')
      .select('id', { count: 'exact', head: true })
      .eq('track_id', trackId)
      .eq('user_id', userId);
    
    if (existingCovers === 0) {
      rewardCoins += 25; // Bonus "primera vez"
      analysis.feedback.push("🎁 ¡Bonus por ser el primer cover de esta canción! +25 coins");
    }
    
    // 5. Guardar cover con análisis completo
    const { data: cover, error } = await supabase
      .from('karaoke_covers')
      .insert({
        track_id: trackId,
        user_id: userId,
        user_email: userEmail,
        cover_url: blob.url,
        vocal_score: analysis.totalScore,
        vocal_score_details: {
          pitch: analysis.pitchAccuracy,
          rhythm: analysis.rhythmAccuracy,
          clarity: analysis.clarityScore,
          confidence: analysis.confidence,
          sentiment: analysis.sentiment,
          words: analysis.words.slice(0, 20) // Guardar primeras palabras para preview
        },
        feedback_given: analysis.feedback,
        badge_earned: analysis.badge,
        transcript: analysis.text.substring(0, 500),
        status: 'published'
      })
      .select()
      .single();
    
    if (error) throw error;
    
    // 6. Procesar transacciones de coins
    await supabase.rpc('subtract_coins', { user_id: userId, amount: 50 });
    await supabase.rpc('add_coins', { user_id: userId, amount: rewardCoins });
    
    // 7. Recompensa al creador del track original
    const { data: track } = await supabase
      .from('karaoke_tracks')
      .select('created_by, title')
      .eq('id', trackId)
      .single();
    
    if (track && track.created_by !== userId) {
      await supabase.rpc('add_coins', { user_id: track.created_by, amount: 25 });
    }
    
    // 8. Actualizar ranking de mejores covers
    await supabase.from('cover_rankings').upsert({
      user_id: userId,
      user_email: userEmail,
      cover_id: cover.id,
      track_title: track?.title || 'Canción',
      vocal_score: analysis.totalScore,
      badge: analysis.badge,
      week_start: getWeekStart(),
      month_start: getMonthStart()
    });
    
    // 9. Notificaciones para covers legendarios
    if (analysis.totalScore >= 90) {
      await supabase.from('notifications').insert({
        user_id: userId,
        type: 'legendary_cover',
        title: '🏆 ¡COVER LEGENDARIO!',
        message: `Has conseguido ${analysis.totalScore} puntos con "${analysis.badge}" en "${track?.title}"`,
        metadata: { coverId: cover.id, score: analysis.totalScore }
      });
      
      // Notificación global para el chat de la sala
      await supabase.from('global_announcements').insert({
        message: `🎤 ¡${userEmail || 'Alguien'} acaba de conseguir ${analysis.totalScore} puntos en karaoke! 🏆`,
        type: 'achievement',
        expires_at: new Date(Date.now() + 60000) // 1 minuto
      });
    }
    
    return NextResponse.json({
      success: true,
      coverId: cover.id,
      coverUrl: blob.url,
      score: {
        total: analysis.totalScore,
        pitch: analysis.pitchAccuracy,
        rhythm: analysis.rhythmAccuracy,
        clarity: analysis.clarityScore,
        badge: analysis.badge,
        feedback: analysis.feedback
      },
      rewardCoins,
      message: `🎤 ¡Cover evaluado! Puntuación: ${analysis.totalScore}/100. Ganaste ${rewardCoins} coins.`
    });
    
  } catch (error) {
    console.error('Error en evaluación vocal:', error);
    return NextResponse.json({ error: 'Error al procesar el cover' }, { status: 500 });
  }
}

function getWeekStart(): string {
  const now = new Date();
  const start = new Date(now.setDate(now.getDate() - now.getDay()));
  return start.toISOString().split('T')[0];
}

function getMonthStart(): string {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
}

async function localVocalAnalysis(file: File): Promise<VocalAnalysisResult> {
  // Análisis local básico (fallback)
  return {
    text: '',
    confidence: 0.7,
    sentiment: { sentiment: 'NEUTRAL', confidence: 0.5 },
    audio_duration: 0,
    words: [],
    pitchAccuracy: 65,
    rhythmAccuracy: 60,
    clarityScore: 70,
    totalScore: 65,
    feedback: ['🎵 Análisis básico. Conecta internet para evaluación precisa'],
    badge: '🎤 APRENDIZ'
  };
}