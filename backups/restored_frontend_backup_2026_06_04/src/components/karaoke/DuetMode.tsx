// components/karaoke/DuetMode.tsx
'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Users, Handshake, Award, Star, Zap, UserPlus, UserMinus, Check, X } from 'lucide-react';
// @ts-ignore
import { PitchDetector } from 'pitchy';

interface DuetParticipant {
  id: string;
  name: string;
  avatar: string;
  isReady: boolean;
  currentScore: number;
  streak: number;
  parts: string[]; // 'verse', 'chorus', 'bridge'
  currentPart: string;
}

interface DuetModeProps {
  trackId: string;
  trackTitle: string;
  instrumentalUrl: string;
  currentUserId: string;
  currentUserName: string;
  availableUsers: Array<{ id: string; name: string; avatar: string }>;
  onComplete: (scores: { user1: number; user2: number }, rewards: { user1: number; user2: number }) => void;
  onClose: () => void;
}

export function DuetMode({ 
  trackId, 
  trackTitle, 
  instrumentalUrl, 
  currentUserId, 
  currentUserName,
  availableUsers,
  onComplete, 
  onClose 
}: DuetModeProps) {
  const [step, setStep] = useState<'invite' | 'ready' | 'singing' | 'results'>('invite');
  const [invitedUser, setInvitedUser] = useState<{ id: string; name: string; avatar: string } | null>(null);
  const [duetParticipants, setDuetParticipants] = useState<DuetParticipant[]>([
    {
      id: currentUserId,
      name: currentUserName,
      avatar: '🎤',
      isReady: false,
      currentScore: 0,
      streak: 0,
      parts: ['verse', 'chorus'],
      currentPart: 'verse'
    }
  ]);
  const [practiceTime, setPracticeTime] = useState(0);
  const [isActive, setIsActive] = useState(false);
  
  // Refs para audio
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number | null>(null);
  const instrumentalRef = useRef<HTMLAudioElement | null>(null);
  
  // Enviar invitación
  const sendInvitation = (user: { id: string; name: string; avatar: string }) => {
    setInvitedUser(user);
    setDuetParticipants(prev => [...prev, {
      id: user.id,
      name: user.name,
      avatar: user.avatar,
      isReady: false,
      currentScore: 0,
      streak: 0,
      parts: ['chorus', 'bridge'],
      currentPart: 'chorus'
    }]);
    // En producción, aquí iría WebSocket para notificar al invitado
    setTimeout(() => {
      // Simular que el invitado acepta
      setDuetParticipants(prev => prev.map(p => 
        p.id === user.id ? { ...p, isReady: true } : p
      ));
      setStep('ready');
    }, 2000);
  };
  
  // Iniciar dueto
  const startDuet = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 2048;
      
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      
      await audioContextRef.current.resume();
      
      setIsActive(true);
      instrumentalRef.current?.play();
      analyzePitch();
      
      const timer = setInterval(() => {
        setPracticeTime(prev => {
          if (prev >= 180) { // 3 minutos máximo
            clearInterval(timer);
            endDuet();
            return 180;
          }
          return prev + 1;
        });
      }, 1000);
      
      return () => clearInterval(timer);
    } catch (error) {
      console.error('Error al iniciar dueto:', error);
    }
  };
  
  // Análisis de pitch para dueto (cada uno con sus partes)
  const analyzePitch = useCallback(() => {
    if (!analyserRef.current || !isActive || !audioContextRef.current) return;
    
    const bufferSize = 2048;
    const buffer = new Float32Array(bufferSize);
    analyserRef.current.getFloatTimeDomainData(buffer);
    
    try {
      const pitchDetector = PitchDetector.forFloat32Array(audioContextRef.current.sampleRate);
      const [pitch, clarity] = pitchDetector.findPitch(buffer, audioContextRef.current.sampleRate);
      
      if (clarity > 0.6 && pitch > 80 && pitch < 800) {
        // Calcular precisión según la parte que le toca cantar
        const currentUser = duetParticipants.find(p => p.id === currentUserId);
        const targetNote = 261.63; // Nota base
        
        const centsDifference = Math.abs(1200 * Math.log2(pitch / targetNote));
        const pitchAccuracy = Math.max(0, Math.min(100, 100 - (centsDifference / 10)));
        
        // Calcular energía
        let sumSquares = 0;
        for (let i = 0; i < buffer.length; i++) {
          sumSquares += buffer[i] * buffer[i];
        }
        const rms = Math.sqrt(sumSquares / buffer.length);
        const energy = Math.min(100, Math.max(0, rms * 200));
        
        const totalScore = Math.round(pitchAccuracy * 0.6 + energy * 0.4);
        
        // Actualizar puntuación del usuario actual
        setDuetParticipants(prev => prev.map(p => 
          p.id === currentUserId 
            ? { 
                ...p, 
                currentScore: Math.min(100, totalScore),
                streak: pitchAccuracy > 70 ? p.streak + 1 : 0
              }
            : p
        ));
      }
    } catch (e) {}
    
    animationRef.current = requestAnimationFrame(analyzePitch);
  }, [isActive, duetParticipants, currentUserId]);
  
  // Finalizar dueto
  const endDuet = () => {
    setIsActive(false);
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    instrumentalRef.current?.pause();
    audioContextRef.current?.close();
    
    // Calcular recompensas
    const user1 = duetParticipants.find(p => p.id === currentUserId)!;
    const user2 = duetParticipants.find(p => p.id !== currentUserId);
    
    let reward1 = 0, reward2 = 0;
    if (user1.currentScore >= 85) reward1 = 300;
    else if (user1.currentScore >= 70) reward1 = 150;
    else if (user1.currentScore >= 60) reward1 = 50;
    else reward1 = 20;
    
    if (user2) {
      if (user2.currentScore >= 85) reward2 = 300;
      else if (user2.currentScore >= 70) reward2 = 150;
      else if (user2.currentScore >= 60) reward2 = 50;
      else reward2 = 20;
    }
    
    // Bonus de dueto (armonía)
    const harmonyBonus = Math.abs(user1.currentScore - (user2?.currentScore || 0)) < 15 ? 100 : 0;
    reward1 += harmonyBonus;
    if (user2) reward2 += harmonyBonus;
    
    setStep('results');
    onComplete(
      { user1: user1.currentScore, user2: user2?.currentScore || 0 },
      { user1: reward1, user2: reward2 }
    );
  };
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  return (
    <div className="border-4 border-[#D4AF37] bg-black p-6">
      <h3 className="text-xl font-black text-[#D4AF37] mb-4 flex items-center gap-2">
        <Handshake /> DUETO: {trackTitle}
      </h3>
      
      <AnimatePresence mode="wait">
        {/* Paso 1: Invitar */}
        {step === 'invite' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center py-8"
          >
            <div className="text-6xl mb-4">🎤🎤</div>
            <p className="text-gray-400 mb-6">Invita a alguien para cantar un dueto. ¡Armonía = más coins!</p>
            
            <div className="space-y-3 max-h-80 overflow-y-auto mb-6">
              {availableUsers.filter(u => u.id !== currentUserId).map(user => (
                <div key={user.id} className="bg-gray-900 p-3 rounded-lg flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{user.avatar}</span>
                    <span className="font-bold">{user.name}</span>
                  </div>
                  <button
                    onClick={() => sendInvitation(user)}
                    className="px-4 py-2 bg-[#D4AF37] text-black font-bold rounded hover:bg-[#FFD700]"
                  >
                    INVITAR
                  </button>
                </div>
              ))}
            </div>
            
            <button onClick={onClose} className="px-6 py-2 bg-gray-800 text-white rounded">
              CANCELAR
            </button>
          </motion.div>
        )}
        
        {/* Paso 2: Ready */}
        {step === 'ready' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center py-8"
          >
            <div className="flex justify-center gap-8 mb-6">
              {duetParticipants.map(p => (
                <div key={p.id} className="text-center">
                  <div className="text-4xl mb-2">{p.avatar}</div>
                  <div className="font-bold">{p.name}</div>
                  <div className="text-xs text-gray-500">{p.parts.join(' + ')}</div>
                  {p.isReady && <Check size={16} className="mx-auto mt-1 text-green-500" />}
                </div>
              ))}
            </div>
            
            <p className="text-gray-400 mb-6">¡Ambos están listos! Prepárense para cantar.</p>
            <p className="text-sm text-[#D4AF37] mb-6">🎵 {duetParticipants[0].name} canta la estrofa, {duetParticipants[1]?.name} canta el coro 🎵</p>
            
            <button
              onClick={startDuet}
              className="px-8 py-4 bg-[#D4AF37] text-black font-black text-lg border-2 border-black"
            >
              COMENZAR DUETO
            </button>
          </motion.div>
        )}
        
        {/* Paso 3: Cantando */}
        {step === 'singing' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="flex justify-between items-center mb-6">
              <div className="text-2xl font-mono text-[#D4AF37]">{formatTime(practiceTime)}</div>
              <div className="text-center text-green-400 animate-pulse">🎤 DUETO EN VIVO 🎤</div>
              <button onClick={endDuet} className="px-3 py-1 bg-red-600 text-white text-sm rounded">
                TERMINAR
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-6 mb-6">
              {duetParticipants.map(p => (
                <div key={p.id} className="bg-gray-900 p-4 rounded-lg text-center">
                  <div className="text-3xl mb-2">{p.avatar}</div>
                  <div className="font-bold text-white">{p.name}</div>
                  <div className="text-xs text-[#D4AF37] mb-2">🎵 {p.currentPart}</div>
                  <div className="text-3xl font-black text-[#D4AF37]">{p.currentScore}</div>
                  <div className="text-xs text-green-400">🔥 {p.streak}</div>
                  <div className="h-1.5 bg-gray-700 rounded-full mt-2 overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-[#00F3FF] to-[#D4AF37] transition-all"
                      style={{ width: `${p.currentScore}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            
            <audio ref={instrumentalRef} src={instrumentalUrl} controls className="w-full" />
            
            <div className="mt-4 text-center text-sm text-gray-400">
              💡 Consejo: La armonía entre ambos da bonus de 100 coins
            </div>
          </motion.div>
        )}
        
        {/* Paso 4: Resultados */}
        {step === 'results' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-8"
          >
            <div className="text-6xl mb-4">🏆</div>
            <h3 className="text-2xl font-black text-[#D4AF37] mb-4">¡DUETO COMPLETADO!</h3>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              {duetParticipants.map(p => {
                const reward = p.id === currentUserId 
                  ? (duetParticipants[0].currentScore >= 85 ? 300 : duetParticipants[0].currentScore >= 70 ? 150 : 50)
                  : (duetParticipants[1]?.currentScore >= 85 ? 300 : duetParticipants[1]?.currentScore >= 70 ? 150 : 50);
                const harmonyBonus = Math.abs(duetParticipants[0].currentScore - (duetParticipants[1]?.currentScore || 0)) < 15;
                
                return (
                  <div key={p.id} className="bg-gray-900 p-4 rounded-lg">
                    <div className="text-3xl mb-2">{p.avatar}</div>
                    <div className="font-bold">{p.name}</div>
                    <div className="text-2xl font-black text-[#D4AF37]">{p.currentScore}</div>
                    <div className="text-sm text-green-400">+{reward} coins</div>
                    {harmonyBonus && <div className="text-xs text-[#D4AF37] mt-1">🎵 Bonus armonía +50</div>}
                  </div>
                );
              })}
            </div>
            
            <button
              onClick={() => onComplete(
                { user1: duetParticipants[0].currentScore, user2: duetParticipants[1]?.currentScore || 0 },
                { user1: 0, user2: 0 }
              )}
              className="px-8 py-3 bg-[#D4AF37] text-black font-black"
            >
              VOLVER A LA SALA
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}