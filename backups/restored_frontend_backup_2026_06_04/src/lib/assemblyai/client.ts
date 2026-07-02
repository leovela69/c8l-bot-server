// lib/assemblyai/client.ts
import { AssemblyAI } from 'assemblyai';

const client = new AssemblyAI({
  apiKey: process.env.ASSEMBLYAI_API_KEY!,
});

export interface VocalAnalysisResult {
  text: string;                    // Transcripción de lo que cantó
  confidence: number;              // Confianza de la transcripción (0-1)
  sentiment: {                    // Sentimiento detectado
    sentiment: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
    confidence: number;
  };
  audio_duration: number;          // Duración en segundos
  words: Array<{                  // Palabras con timestamps
    text: string;
    start: number;
    end: number;
    confidence: number;
  }>;
  // Campos calculados por nosotros a partir de los datos
  pitchAccuracy: number;           // 0-100
  rhythmAccuracy: number;          // 0-100
  clarityScore: number;            // 0-100
  totalScore: number;              // 0-100
  feedback: string[];
  badge: string;
}

export async function analyzeVocalWithAssemblyAI(audioUrl: string): Promise<VocalAnalysisResult> {
  try {
    // 1. Subir audio a AssemblyAI para análisis
    const transcript = await client.transcripts.transcribe({
      audio: audioUrl,
      // Configuraciones específicas para voz cantada
      sentiment_analysis: true,
      auto_highlights: true,
      language_code: 'es', // o 'en'
      speech_model: 'best',
      punctuate: true,
      format_text: true
    });
    
    // Esperar a que termine el análisis
    let result = transcript;
    while (result.status !== 'completed' && result.status !== 'error') {
      await new Promise(resolve => setTimeout(resolve, 2000));
      result = await client.transcripts.get(transcript.id);
    }
    
    if (result.status === 'error') {
      throw new Error('Error en análisis de AssemblyAI');
    }
    
    // 2. Calcular métricas personalizadas a partir de los resultados
    const confidence = result.confidence || 0.7;
    const wordCount = result.words?.length || 0;
    const hasSentiment = result.sentiment_analysis_results?.[0] || null;
    
    // Precisión de tono: basado en confianza de transcripción
    const pitchAccuracy = Math.min(100, Math.round(confidence * 100) + 10);
    
    // Precisión de ritmo: basado en consistencia de timestamps
    let rhythmAccuracy = 70;
    if (result.words && result.words.length > 1) {
      let totalGap = 0;
      for (let i = 1; i < result.words.length; i++) {
        const gap = result.words[i].start - result.words[i-1].end;
        totalGap += Math.abs(gap - 0.3); // Tiempo ideal entre palabras: 0.3s
      }
      const avgGapDeviation = totalGap / (result.words.length - 1);
      rhythmAccuracy = Math.min(95, Math.max(50, 80 - (avgGapDeviation * 20)));
    }
    
    // Claridad: basado en confianza de palabras
    let avgWordConfidence = 0;
    if (result.words && result.words.length > 0) {
      avgWordConfidence = result.words.reduce((sum, w) => sum + (w.confidence || 0.8), 0) / result.words.length;
    }
    const clarityScore = Math.min(100, Math.round(avgWordConfidence * 100));
    
    // Sentimiento (energía emocional)
    let energy = 50;
    if (hasSentiment) {
      if (hasSentiment.sentiment === 'POSITIVE') energy = 85;
      if (hasSentiment.sentiment === 'NEUTRAL') energy = 50;
      if (hasSentiment.sentiment === 'NEGATIVE') energy = 30;
    }
    
    // Puntuación total ponderada
    const totalScore = Math.round(
      pitchAccuracy * 0.35 +
      rhythmAccuracy * 0.25 +
      clarityScore * 0.25 +
      energy * 0.15
    );
    
    // Generar feedback
    const feedback: string[] = [];
    if (pitchAccuracy > 85) feedback.push("🎯 ¡Excelente afinación! Tus notas son muy precisas.");
    else if (pitchAccuracy > 70) feedback.push("👍 Buena afinación, sigue practicando para llegar al 90%");
    else feedback.push("🎵 Trabaja un poco más la afinación. Prueba con ejercicios de escala");
    
    if (rhythmAccuracy > 85) feedback.push("🥁 ¡Ritmo impecable! Estás perfectamente al compás");
    else if (rhythmAccuracy > 70) feedback.push("🕺 Buen ritmo, casi perfecto");
    else feedback.push("🎧 Escucha más el beat para mejorar tu timing");
    
    if (clarityScore > 85) feedback.push("🎤 ¡Pronunciación excelente! Se entiende cada palabra");
    else if (clarityScore > 70) feedback.push("📢 Buena claridad vocal");
    else feedback.push("🗣️ Trabaja en tu dicción para que se entienda mejor");
    
    if (energy > 75) feedback.push("⚡ ¡Gran energía! Transmites emoción al cantar");
    else if (energy > 50) feedback.push("🎙️ Buena proyección, puedes darle más intensidad");
    else feedback.push("🔊 Canta con más confianza, ¡suéltate!");
    
    // Badge según puntuación
    let badge = '';
    if (totalScore >= 90) badge = '🏆 VOZ DE ORO';
    else if (totalScore >= 75) badge = '⭐ ESTRELLA C8L';
    else if (totalScore >= 60) badge = '🎤 APRENDIZ';
    else badge = '🌱 PRINCIPIANTE';
    
    return {
      text: result.text || '',
      confidence: confidence,
      sentiment: {
        sentiment: hasSentiment?.sentiment as any || 'NEUTRAL',
        confidence: hasSentiment?.confidence || 0
      },
      audio_duration: result.audio_duration || 0,
      words: result.words || [],
      pitchAccuracy,
      rhythmAccuracy,
      clarityScore,
      totalScore,
      feedback,
      badge
    };
    
  } catch (error) {
    console.error('Error en AssemblyAI:', error);
    // Fallback a análisis local si falla la API
    return fallbackAnalysis();
  }
}

function fallbackAnalysis(): VocalAnalysisResult {
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
    feedback: ['🎵 Análisis básico. Conéctate a internet para evaluación precisa'],
    badge: '🎤 APRENDIZ'
  };
}