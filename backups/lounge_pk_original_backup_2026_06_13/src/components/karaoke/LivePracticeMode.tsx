// components/karaoke/LivePracticeMode.tsx
'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Activity, Target, Volume2, Music, Zap, Award, TrendingUp, Star } from 'lucide-react';
// @ts-ignore
import { PitchDetector } from 'pitchy';

interface LiveScore {
  currentPitch: number;      // Hz actual
  targetPitch: number;       // Hz objetivo (según canción)
  pitchAccuracy: number;     // 0-100
  rhythmAccuracy: number;    // 0-100
  energy: number;            // 0-100
  totalScore: number;        // 0-100 acumulado
  streak: number;            // Notas correctas consecutivas
  bestStreak: number;
  feedback: string;
}

interface LivePracticeProps {
  trackId: string;
  instrumentalUrl: string;
  referenceMelody?: number[]; // Notas de referencia (opcional)
  onComplete: (finalScore: LiveScore, rewardCoins: number) => void;
}

export function LivePracticeMode({ trackId, instrumentalUrl, referenceMelody, onComplete }: LivePracticeProps) {
  const [isActive, setIsActive] = useState(false);
  const [isMicActive, setIsMicActive] = useState(false);
  const [liveScore, setLiveScore] = useState<LiveScore>({
    currentPitch: 0,
    targetPitch: 0,
    pitchAccuracy: 0,
    rhythmAccuracy: 0,
    energy: 0,
    totalScore: 0,
    streak: 0,
    bestStreak: 0,
    feedback: '🎤 ¡Canta para comenzar!'
  });
  const [practiceTime, setPracticeTime] = useState(0);
  const [showFeedback, setShowFeedback] = useState<string | null>(null);
  
  // Refs para audio
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const animationRef = useRef<number | null>(null);
  const instrumentalRef = useRef<HTMLAudioElement | null>(null);
  
  // Referencia de notas (simplificada - en producción vendría de la canción)
  const targetNotes = useRef<number[]>([
    261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88, 523.25, // Do a Do
    493.88, 440.00, 392.00, 349.23, 329.63, 293.66, 261.63 // Escala descendente
  ]);
  const currentNoteIndex = useRef(0);
  const lastNoteTime = useRef(Date.now());
  const rhythmWindowRef = useRef<number[]>([]);
  
  // Inicializar audio
  const initAudio = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 2048;
      
      sourceRef.current = audioContextRef.current.createMediaStreamSource(stream);
      sourceRef.current.connect(analyserRef.current);
      
      await audioContextRef.current.resume();
      return true;
    } catch (error) {
      console.error('Error al acceder al micrófono:', error);
      setLiveScore(prev => ({ ...prev, feedback: '❌ Permite el acceso al micrófono para practicar' }));
      return false;
    }
  };
  
  // Analizar pitch en tiempo real
  const analyzePitch = useCallback(() => {
    if (!analyserRef.current || !isMicActive || !audioContextRef.current) return;
    
    const bufferSize = 2048;
    const buffer = new Float32Array(bufferSize);
    analyserRef.current.getFloatTimeDomainData(buffer);
    
    try {
      const pitchDetector = PitchDetector.forFloat32Array(audioContextRef.current.sampleRate);
      const [pitch, clarity] = pitchDetector.findPitch(buffer, audioContextRef.current.sampleRate);
      
      if (clarity > 0.6 && pitch > 80 && pitch < 800) {
        // Calcular precisión de tono (qué tan cerca está de la nota objetivo)
        const targetNote = targetNotes.current[currentNoteIndex.current % targetNotes.current.length];
        const centsDifference = Math.abs(1200 * Math.log2(pitch / targetNote));
        const pitchAccuracy = Math.max(0, Math.min(100, 100 - (centsDifference / 10)));
        
        // Calcular ritmo (si acertó en el momento correcto)
        const now = Date.now();
        const timeSinceLastNote = (now - lastNoteTime.current) / 1000;
        let rhythmAccuracy = 70;
        let isNoteHit = false;
        
        if (pitchAccuracy > 70) {
          // Nota acertada - verificar timing
          const idealInterval = 0.5; // 0.5 segundos ideal entre notas
          const timingDeviation = Math.abs(timeSinceLastNote - idealInterval);
          rhythmAccuracy = Math.max(50, Math.min(100, 100 - (timingDeviation * 50)));
          
          if (rhythmAccuracy > 70) {
            isNoteHit = true;
            currentNoteIndex.current++;
            lastNoteTime.current = now;
            rhythmWindowRef.current.push(rhythmAccuracy);
            if (rhythmWindowRef.current.length > 10) rhythmWindowRef.current.shift();
          }
        }
        
        // Calcular energía (volumen)
        let sumSquares = 0;
        for (let i = 0; i < buffer.length; i++) {
          sumSquares += buffer[i] * buffer[i];
        }
        const rms = Math.sqrt(sumSquares / buffer.length);
        const energy = Math.min(100, Math.max(0, rms * 200));
        
        // Calcular racha
        let streak = liveScore.streak;
        if (isNoteHit && pitchAccuracy > 70 && rhythmAccuracy > 70) {
          streak++;
        } else if (pitchAccuracy < 50) {
          streak = 0;
        }
        
        // Calcular puntuación total (promedio de los últimos segundos)
        const avgRhythm = rhythmWindowRef.current.length > 0 
          ? rhythmWindowRef.current.reduce((a,b) => a+b, 0) / rhythmWindowRef.current.length 
          : 70;
        
        const totalScore = Math.round(
          pitchAccuracy * 0.4 +
          avgRhythm * 0.3 +
          energy * 0.2 +
          (streak / 20) * 10
        );
        
        // Generar feedback dinámico
        let feedback = '';
        if (pitchAccuracy > 85) feedback = '🎯 ¡Perfecto! Sigue así';
        else if (pitchAccuracy > 70) feedback = '👍 Muy bien, casi ahí';
        else if (pitchAccuracy > 50) feedback = '🎵 Acércate más a la nota';
        else feedback = '📢 Ajusta un poco el tono';
        
        if (streak > 0 && streak % 5 === 0) {
          feedback = `🔥 ¡${streak} notas seguidas! Vas excelente`;
          setShowFeedback(`🔥 RACHA DE ${streak}`);
          setTimeout(() => setShowFeedback(null), 1000);
        }
        
        setLiveScore(prev => ({
          currentPitch: Math.round(pitch),
          targetPitch: Math.round(targetNote),
          pitchAccuracy: Math.round(pitchAccuracy),
          rhythmAccuracy: Math.round(rhythmAccuracy),
          energy: Math.round(energy),
          totalScore: Math.min(100, Math.max(0, totalScore)),
          streak: streak,
          bestStreak: Math.max(prev.bestStreak, streak),
          feedback
        }));
      }
    } catch (e) {
      // Silenciar errores de detección
    }
    
    animationRef.current = requestAnimationFrame(analyzePitch);
  }, [isMicActive, liveScore.streak]);
  
  // Iniciar práctica
  const startPractice = async () => {
    const audioReady = await initAudio();
    if (!audioReady) return;
    
    setIsActive(true);
    setIsMicActive(true);
    instrumentalRef.current?.play();
    analyzePitch();
    
    // Timer de práctica (máximo 60 segundos para demo)
    const timer = setInterval(() => {
      setPracticeTime(prev => {
        if (prev >= 59) {
          clearInterval(timer);
          endPractice();
          return 60;
        }
        return prev + 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  };
  
  // Finalizar práctica
  const endPractice = () => {
    setIsActive(false);
    setIsMicActive(false);
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    instrumentalRef.current?.pause();
    audioContextRef.current?.close();
    
    // Calcular recompensa según puntuación final
    let rewardCoins = 0;
    let message = '';
    if (liveScore.totalScore >= 90) {
      rewardCoins = 300;
      message = '🏆 ¡LEYENDA! 300 coins';
    } else if (liveScore.totalScore >= 75) {
      rewardCoins = 150;
      message = '⭐ ¡ESTRELLA! 150 coins';
    } else if (liveScore.totalScore >= 60) {
      rewardCoins = 50;
      message = '🎤 ¡APRENDIZ! 50 coins';
    } else {
      rewardCoins = 10;
      message = '🌱 ¡SIGUE PRACTICANDO! 10 coins';
    }
    
    setLiveScore(prev => ({ ...prev, feedback: `🎉 Práctica completada. ${message}` }));
    onComplete(liveScore, rewardCoins);
  };
  
  const formatTime = (seconds: number) => {
    const secs = seconds % 60;
    return `${Math.floor(seconds / 60)}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Visualización de nota actual (pitch meter)
  const getPitchBarWidth = () => {
    if (!liveScore.currentPitch || !liveScore.targetPitch) return 50;
    const diff = Math.abs(liveScore.currentPitch - liveScore.targetPitch);
    const maxDiff = 100;
    return Math.max(5, Math.min(95, 50 + (1 - diff / maxDiff) * 45));
  };
  
  return (
    <div className="border-4 border-[#D4AF37] bg-black p-6">
      <h3 className="text-xl font-black text-[#D4AF37] mb-4 flex items-center gap-2">
        <Activity className="animate-pulse" /> MODO PRÁCTICA EN VIVO
      </h3>
      
      {!isActive ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🎤</div>
          <p className="text-gray-400 mb-6">Practica tu técnica vocal en tiempo real. Recibe feedback instantáneo y gana coins según tu puntuación.</p>
          <button
            onClick={startPractice}
            className="px-8 py-4 bg-[#D4AF37] text-black font-black text-lg border-2 border-black hover:bg-[#FFD700] transition-all"
          >
            COMENZAR PRÁCTICA (GRATIS)
          </button>
        </div>
      ) : (
        <>
          {/* Header con timer y puntuación */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <div className={`px-3 py-1 rounded-full ${isMicActive ? 'bg-green-500 animate-pulse' : 'bg-red-500'} text-white text-xs font-mono`}>
                {isMicActive ? '🎤 GRABANDO' : '⏸️ PAUSADO'}
              </div>
              <div className="text-2xl font-mono text-[#D4AF37]">{formatTime(practiceTime)}</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-black text-[#D4AF37]">{liveScore.totalScore}</div>
              <div className="text-[10px] text-gray-500">PUNTUACIÓN</div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-400">RACHA</div>
              <div className="text-2xl font-black text-[#00F3FF]">{liveScore.streak}</div>
              <div className="text-[10px] text-gray-500">mejor: {liveScore.bestStreak}</div>
            </div>
          </div>
          
          {/* Visualizador de tono (pitch meter) */}
          <div className="mb-6">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>🔻 Grave</span>
              <span>🎯 NOTA OBJETIVO</span>
              <span>🔺 Agudo</span>
            </div>
            <div className="relative h-8 bg-gray-800 rounded-full overflow-hidden">
              <div 
                className="absolute h-full bg-gradient-to-r from-[#00F3FF] via-[#D4AF37] to-[#FF0055] transition-all duration-75"
                style={{ width: `${getPitchBarWidth()}%`, left: `${getPitchBarWidth() - 5}%`, transform: 'translateX(-50%)' }}
              />
              <div 
                className="absolute top-0 w-1 h-full bg-white shadow-lg"
                style={{ left: '50%' }}
              />
            </div>
            <div className="flex justify-between text-xs mt-1">
              <span>{liveScore.currentPitch > 0 ? `${liveScore.currentPitch} Hz` : '—'}</span>
              <span className="text-[#D4AF37]">{liveScore.targetPitch > 0 ? `${liveScore.targetPitch} Hz` : 'Esperando...'}</span>
              <span>{liveScore.pitchAccuracy}% precisión</span>
            </div>
          </div>
          
          {/* Métricas en tiempo real */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-gray-900 p-3 text-center">
              <div className="text-xs text-gray-500">🎯 PRECISIÓN</div>
              <div className="text-2xl font-bold text-[#00F3FF]">{liveScore.pitchAccuracy}%</div>
              <div className="w-full bg-gray-700 h-1 mt-1 rounded-full overflow-hidden">
                <div className="h-full bg-[#00F3FF] transition-all duration-150" style={{ width: `${liveScore.pitchAccuracy}%` }} />
              </div>
            </div>
            <div className="bg-gray-900 p-3 text-center">
              <div className="text-xs text-gray-500">🥁 RITMO</div>
              <div className="text-2xl font-bold text-[#D4AF37]">{liveScore.rhythmAccuracy}%</div>
              <div className="w-full bg-gray-700 h-1 mt-1 rounded-full overflow-hidden">
                <div className="h-full bg-[#D4AF37] transition-all duration-150" style={{ width: `${liveScore.rhythmAccuracy}%` }} />
              </div>
            </div>
            <div className="bg-gray-900 p-3 text-center">
              <div className="text-xs text-gray-500">⚡ ENERGÍA</div>
              <div className="text-2xl font-bold text-[#FF0055]">{liveScore.energy}%</div>
              <div className="w-full bg-gray-700 h-1 mt-1 rounded-full overflow-hidden">
                <div className="h-full bg-[#FF0055] transition-all duration-150" style={{ width: `${liveScore.energy}%` }} />
              </div>
            </div>
          </div>
          
          {/* Feedback visual animado */}
          <AnimatePresence>
            {showFeedback && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black/90 border-2 border-[#D4AF37] px-6 py-3 rounded-lg z-10 whitespace-nowrap"
              >
                <span className="text-[#D4AF37] font-black">{showFeedback}</span>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Feedback de texto */}
          <div className="bg-black border border-gray-800 p-3 mb-4 text-center">
            <div className="text-sm text-[#D4AF37]">{liveScore.feedback}</div>
          </div>
          
          {/* Reproductor del instrumental */}
          <div className="mb-4">
            <div className="text-sm text-gray-400 mb-2">Base de karaoke:</div>
            <audio ref={instrumentalRef} src={instrumentalUrl} controls className="w-full" />
          </div>
          
          {/* Controles */}
          <div className="flex gap-3">
            <button
              onClick={endPractice}
              className="flex-1 py-3 bg-red-600 text-white font-black border-2 border-black hover:bg-red-700"
            >
              FINALIZAR PRÁCTICA
            </button>
          </div>
        </>
      )}
      
      {/* Leyenda de puntuaciones */}
      <div className="mt-6 pt-4 border-t border-gray-800">
        <div className="text-xs text-gray-500 mb-2">🎯 RANGOS DE PUNTUACIÓN</div>
        <div className="flex justify-between text-[10px]">
          <div><span className="text-[#D4AF37]">90-100</span> Leyenda</div>
          <div><span className="text-[#D4AF37]">75-89</span> Estrella</div>
          <div><span className="text-[#D4AF37]">60-74</span> Aprendiz</div>
          <div><span className="text-[#D4AF37]">0-59</span> Principiante</div>
        </div>
      </div>
    </div>
  );
}