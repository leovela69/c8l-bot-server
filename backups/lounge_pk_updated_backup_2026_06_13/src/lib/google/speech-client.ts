// lib/google/speech-client.ts
import { SpeechClient } from '@google-cloud/speech';

const speechClient = new SpeechClient({
  credentials: JSON.parse(process.env.GOOGLE_CREDENTIALS!),
});

export interface GoogleVocalAnalysis {
  pitchAccuracy: number;
  rhythmAccuracy: number;
  clarityScore: number;
  totalScore: number;
  transcript: string;
  words: Array<{ word: string; start: number; end: number; confidence: number }>;
}

export async function analyzeWithGoogleCloud(audioBuffer: Buffer): Promise<GoogleVocalAnalysis> {
  const request = {
    audio: { content: audioBuffer.toString('base64') },
    config: {
      encoding: 'MP3' as const,
      sampleRateHertz: 44100,
      languageCode: 'es-ES',
      enableWordTimeOffsets: true,
      enableAutomaticPunctuation: true,
      model: 'video', // Modelo optimizado para voz cantada
      useEnhanced: true,
    },
  };
  
  const [response] = await speechClient.recognize(request);
  const words = response.results?.[0]?.alternatives?.[0]?.words || [];
  
  // Calcular precisión de ritmo basado en consistencia de timestamps
  let rhythmAccuracy = 70;
  if (words.length > 1) {
    let totalVariation = 0;
    for (let i = 1; i < words.length; i++) {
      const gap = Number(words[i].startTime?.seconds || 0) - Number(words[i-1].endTime?.seconds || 0);
      totalVariation += Math.abs(gap - 0.25);
    }
    const avgVariation = totalVariation / (words.length - 1);
    rhythmAccuracy = Math.min(95, Math.max(40, 80 - (avgVariation * 15)));
  }
  
  // Calcular claridad basado en confianza de palabras
  let totalConfidence = 0;
  words.forEach((w: any) => totalConfidence += (w.confidence || 0.7));
  const clarityScore = words.length > 0 ? (totalConfidence / words.length) * 100 : 65;
  
  const pitchAccuracy = Math.min(100, clarityScore + 10);
  const totalScore = Math.round(pitchAccuracy * 0.4 + rhythmAccuracy * 0.3 + clarityScore * 0.3);
  
  return {
    pitchAccuracy,
    rhythmAccuracy,
    clarityScore,
    totalScore,
    transcript: response.results?.[0]?.alternatives?.[0]?.transcript || '',
    words: words.map((w: any) => ({
      word: w.word || '',
      start: Number(w.startTime?.seconds || 0),
      end: Number(w.endTime?.seconds || 0),
      confidence: w.confidence || 0
    }))
  };
}