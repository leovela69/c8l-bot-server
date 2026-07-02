// components/social/PartyMode.tsx
'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Users, Vote, Star, Crown, Gift, Mic, PartyPopper, Timer, Award, ThumbsUp, ThumbsDown, Check } from 'lucide-react';

interface Participant {
  id: string;
  name: string;
  avatar: string;
  score: number;
  votes: number;
  isEliminated: boolean;
  performance?: {
    song: string;
    score: number;
    feedback: string;
  };
}

interface PartyModeProps {
  participants: Participant[];
  currentUserId: string;
  onVote: (participantId: string) => void;
  onEndParty: (winner: Participant, rewards: Record<string, number>) => void;
  onClose: () => void;
}

export function PartyMode({ participants: initialParticipants, currentUserId, onVote, onEndParty, onClose }: PartyModeProps) {
  const [step, setStep] = useState<'waiting' | 'performing' | 'voting' | 'results'>('waiting');
  const [participants, setParticipants] = useState(initialParticipants);
  const [currentPerformer, setCurrentPerformer] = useState<Participant | null>(null);
  const [performerIndex, setPerformerIndex] = useState(0);
  const [votingTimeLeft, setVotingTimeLeft] = useState(30);
  const [round, setRound] = useState(1);
  const [hasVoted, setHasVoted] = useState(false);
  const [partyAnnouncements, setPartyAnnouncements] = useState<string[]>([]);
  
  const performers = participants.filter(p => !p.isEliminated);
  
  // Añadir anuncio
  const addAnnouncement = (message: string) => {
    setPartyAnnouncements(prev => [message, ...prev].slice(0, 5));
    setTimeout(() => setPartyAnnouncements(prev => prev.slice(0, -1)), 5000);
  };
  
  // Iniciar la fiesta
  const startParty = () => {
    setStep('performing');
    startPerformance();
    addAnnouncement('🎉 ¡LA FIESTA HA COMENZADO! 🎉');
  };
  
  // Iniciar performance de un participante
  const startPerformance = () => {
    if (performerIndex >= performers.length) {
      // Fin de la ronda, ir a votación final
      startFinalVoting();
      return;
    }
    
    const performer = performers[performerIndex];
    setCurrentPerformer(performer);
    addAnnouncement(`🎤 ¡Ahora le toca a ${performer.name}! 🎤`);
    
    // Simular performance (en producción, aquí iría la grabación real)
    setTimeout(() => {
      const performanceScore = Math.floor(Math.random() * 40) + 60; // 60-100
      const feedback = performanceScore >= 85 ? '🔥 ¡Increíble!' : performanceScore >= 70 ? '👍 Muy bien!' : '🎵 Sigue practicando';
      
      setParticipants(prev => prev.map(p => 
        p.id === performer.id 
          ? { ...p, performance: { song: 'Canción seleccionada', score: performanceScore, feedback } }
          : p
      ));
      
      addAnnouncement(`📊 ${performer.name} obtuvo ${performanceScore} puntos! ${feedback}`);
      setPerformerIndex(prev => prev + 1);
      startPerformance();
    }, 5000);
  };
  
  // Votación final (todos votan por el mejor)
  const startFinalVoting = () => {
    setStep('voting');
    setVotingTimeLeft(30);
    setHasVoted(false);
    addAnnouncement('🗳️ ¡RONDA DE VOTACIÓN! Vota por tu favorito 🗳️');
    
    const timer = setInterval(() => {
      setVotingTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          endVoting();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };
  
  const handleVote = (participantId: string) => {
    if (hasVoted) return;
    setHasVoted(true);
    onVote(participantId);
    
    setParticipants(prev => prev.map(p => 
      p.id === participantId ? { ...p, votes: p.votes + 1 } : p
    ));
    
    const votedUser = participants.find(p => p.id === participantId);
    addAnnouncement(`⭐ ¡${votedUser?.name} recibió un voto! ⭐`);
  };
  
  const endVoting = () => {
    // Calcular ganador
    const sorted = [...participants].sort((a, b) => (b.votes * 10 + (b.performance?.score || 0)) - (a.votes * 10 + (a.performance?.score || 0)));
    const winner = sorted[0];
    
    // Calcular recompensas
    const rewards: Record<string, number> = {};
    participants.forEach(p => {
      let reward = 20; // Participación base
      if (p.id === winner.id) reward = 500;
      else if (p.votes > 0) reward = 100 + p.votes * 10;
      rewards[p.id] = reward;
    });
    
    addAnnouncement(`🏆 ¡${winner.name} es el ganador de la fiesta! 🏆`);
    setStep('results');
    onEndParty(winner, rewards);
  };
  
  return (
    <div className="border-4 border-[#D4AF37] bg-gradient-to-b from-purple-900 to-black p-6">
      <h3 className="text-2xl font-black text-[#D4AF37] mb-4 flex items-center gap-2">
        <PartyPopper /> MODO FIESTA
      </h3>
      
      {/* Anuncios en vivo */}
      <div className="mb-4 space-y-1">
        {partyAnnouncements.map((ann, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-[#D4AF37]/10 border-l-4 border-[#D4AF37] p-2 text-xs text-[#D4AF37]"
          >
            {ann}
          </motion.div>
        ))}
      </div>
      
      <AnimatePresence mode="wait">
        {/* Esperando participantes */}
        {step === 'waiting' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
            <div className="text-6xl mb-4">🎉</div>
            <p className="text-gray-400 mb-6">Participantes en la fiesta: {participants.length}</p>
            <div className="flex justify-center gap-3 mb-8">
              {participants.map(p => (
                <div key={p.id} className="text-center">
                  <div className="text-3xl">{p.avatar}</div>
                  <div className="text-xs">{p.name}</div>
                </div>
              ))}
            </div>
            <button
              onClick={startParty}
              className="px-8 py-4 bg-[#D4AF37] text-black font-black text-lg border-2 border-black"
              disabled={participants.length < 2}
            >
              {participants.length < 2 ? 'ESPERANDO MÁS PARTICIPANTES...' : 'COMENZAR FIESTA'}
            </button>
          </motion.div>
        )}
        
        {/* Pantalla de votación */}
        {step === 'voting' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <Timer className="text-[#FF0055]" />
                <span className="text-2xl font-mono text-[#FF0055]">{votingTimeLeft}s</span>
              </div>
              <div className="text-sm text-gray-400">Ronda {round}</div>
              {hasVoted && <Check size={20} className="text-green-500" />}
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              {participants.filter(p => !p.isEliminated).map(p => (
                <motion.button
                  key={p.id}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => handleVote(p.id)}
                  disabled={hasVoted}
                  className="bg-gray-900 p-4 rounded-lg text-center hover:bg-gray-800 transition-all disabled:opacity-50"
                >
                  <div className="text-4xl mb-2">{p.avatar}</div>
                  <div className="font-bold text-white">{p.name}</div>
                  {p.performance && (
                    <>
                      <div className="text-sm text-[#D4AF37] mt-2">{p.performance.score} pts</div>
                      <div className="text-xs text-gray-500">{p.performance.feedback}</div>
                    </>
                  )}
                  <div className="mt-2 flex justify-center gap-1">
                    {[...Array(Math.floor(p.votes / 5))].map((_, i) => (
                      <Star key={i} size={12} className="text-[#D4AF37] fill-[#D4AF37]" />
                    ))}
                  </div>
                </motion.button>
              ))}
            </div>
            
            <div className="text-center text-sm text-gray-400">
              💡 Vota por el mejor performance de la noche
            </div>
          </motion.div>
        )}
        
        {/* Resultados finales */}
        {step === 'results' && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center py-8"
          >
            <div className="text-7xl mb-4">🏆</div>
            <h3 className="text-3xl font-black text-[#D4AF37] mb-2">¡GANADOR DE LA FIESTA!</h3>
            
            <div className="bg-gray-900 p-6 rounded-lg mb-6">
              {participants.sort((a, b) => (b.votes * 10 + (b.performance?.score || 0)) - (a.votes * 10 + (a.performance?.score || 0))).map((p, idx) => (
                <div key={p.id} className="flex justify-between items-center py-2 border-b border-gray-800 last:border-0">
                  <div className="flex items-center gap-3">
                    <span className="w-8 text-center">
                      {idx === 0 ? '👑' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx+1}°`}
                    </span>
                    <span className="text-2xl">{p.avatar}</span>
                    <span className="font-bold">{p.name}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-[#D4AF37]">{p.votes} votos</div>
                    <div className="text-xs text-gray-500">{p.performance?.score || 0} pts</div>
                  </div>
                </div>
              ))}
            </div>
            
            <button
              onClick={() => {
                const winner = participants.sort((a, b) => (b.votes * 10 + (b.performance?.score || 0)) - (a.votes * 10 + (a.performance?.score || 0)))[0];
                const rewards: Record<string, number> = {};
                participants.forEach(p => {
                  rewards[p.id] = p.id === winner.id ? 500 : p.votes > 0 ? 100 + p.votes * 10 : 20;
                });
                onEndParty(winner, rewards);
              }}
              className="px-8 py-3 bg-[#D4AF37] text-black font-black"
            >
              RECLAMAR RECOMPENSAS
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Panel de participantes */}
      <div className="mt-6 pt-4 border-t border-gray-800">
        <div className="text-xs text-gray-500 mb-2">🎤 PARTICIPANTES ({participants.length})</div>
        <div className="flex flex-wrap gap-2">
          {participants.map(p => (
            <div key={p.id} className="flex items-center gap-1 bg-gray-800 px-2 py-1 rounded-full text-xs">
              <span>{p.avatar}</span>
              <span>{p.name}</span>
              {p.votes > 0 && <span className="text-[#D4AF37]">⭐{p.votes}</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}