// components/tournament/WeeklyTournament.tsx
'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Calendar, Medal, Star, Crown, Users, TrendingUp, Clock, Award, Gift, Zap, Shield, Flame } from 'lucide-react';

interface TournamentParticipant {
  id: string;
  name: string;
  avatar: string;
  weeklyScore: number;
  wins: number;
  bestScore: number;
  partiesPlayed: number;
  rank: number;
  rewards: {
    coins: number;
    badge: string;
    title: string;
  };
}

interface TournamentWeek {
  id: number;
  startDate: Date;
  endDate: Date;
  status: 'upcoming' | 'active' | 'completed';
  participants: TournamentParticipant[];
  totalPrize: number;
  winner?: TournamentParticipant;
}

interface WeeklyTournamentProps {
  currentUserId: string;
  userPartyScores: Record<string, number>; // scores de cada fiesta del usuario
  onJoinTournament: (userId: string) => void;
  onClaimReward: (userId: string, weekId: number) => void;
}

export function WeeklyTournament({ currentUserId, userPartyScores, onJoinTournament, onClaimReward }: WeeklyTournamentProps) {
  const [currentWeek, setCurrentWeek] = useState<TournamentWeek>({
    id: 1,
    startDate: new Date(),
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    status: 'active',
    participants: [],
    totalPrize: 10000
  });
  const [pastWeeks, setPastWeeks] = useState<TournamentWeek[]>([
    {
      id: 0,
      startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      endDate: new Date(),
      status: 'completed',
      participants: [
        { id: '1', name: 'Leo Vela', avatar: '🦁', weeklyScore: 2850, wins: 3, bestScore: 98, partiesPlayed: 5, rank: 1, rewards: { coins: 5000, badge: '🏆', title: 'CAMPEÓN SEMANAL' } },
        { id: '2', name: 'Dj_Rayo', avatar: '⚡', weeklyScore: 2720, wins: 2, bestScore: 95, partiesPlayed: 5, rank: 2, rewards: { coins: 2500, badge: '🥈', title: 'SUBCAMPEÓN' } },
        { id: '3', name: 'Reina_Melody', avatar: '👑', weeklyScore: 2680, wins: 2, bestScore: 94, partiesPlayed: 5, rank: 3, rewards: { coins: 1000, badge: '🥉', title: 'TERCER LUGAR' } }
      ],
      totalPrize: 10000,
      winner: { id: '1', name: 'Leo Vela', avatar: '🦁', weeklyScore: 2850, wins: 3, bestScore: 98, partiesPlayed: 5, rank: 1, rewards: { coins: 5000, badge: '🏆', title: 'CAMPEÓN SEMANAL' } }
    }
  ]);
  const [userHasJoined, setUserHasJoined] = useState(false);
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [selectedTab, setSelectedTab] = useState<'current' | 'past'>('current');
  const [showRewards, setShowRewards] = useState(false);
  
  // Calcular tiempo restante
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const end = new Date(currentWeek.endDate).getTime();
      const distance = end - now;
      
      if (distance < 0) {
        clearInterval(timer);
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      } else {
        setTimeLeft({
          days: Math.floor(distance / (1000 * 60 * 60 * 24)),
          hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((distance % (1000 * 60)) / 1000)
        });
      }
    }, 1000);
    
    return () => clearInterval(timer);
  }, [currentWeek.endDate]);
  
  // Calcular puntuación semanal del usuario actual
  const userWeeklyScore = Object.values(userPartyScores).reduce((a, b) => a + b, 0);
  
  // Unirse al torneo
  const joinTournament = () => {
    setUserHasJoined(true);
    onJoinTournament(currentUserId);
  };
  
  // Simular participantes (en producción, vienen del backend)
  const rankedParticipants = [
    { id: '1', name: 'Leo Vela', avatar: '🦁', weeklyScore: 2850, wins: 3, bestScore: 98, partiesPlayed: 5, rank: 1, rewards: { coins: 5000, badge: '🏆', title: 'CAMPEÓN SEMANAL' } },
    { id: '2', name: 'Dj_Rayo', avatar: '⚡', weeklyScore: 2720, wins: 2, bestScore: 95, partiesPlayed: 5, rank: 2, rewards: { coins: 2500, badge: '🥈', title: 'SUBCAMPEÓN' } },
    { id: '3', name: 'Reina_Melody', avatar: '👑', weeklyScore: 2680, wins: 2, bestScore: 94, partiesPlayed: 5, rank: 3, rewards: { coins: 1000, badge: '🥉', title: 'TERCER LUGAR' } },
    { id: '4', name: 'BeatMaster', avatar: '🎧', weeklyScore: 2450, wins: 1, bestScore: 89, partiesPlayed: 5, rank: 4, rewards: { coins: 500, badge: '🎤', title: 'FINALISTA' } },
    { id: '5', name: 'Sonic_Flow', avatar: '🎤', weeklyScore: 2310, wins: 1, bestScore: 87, partiesPlayed: 5, rank: 5, rewards: { coins: 250, badge: '⭐', title: 'SEMIFINALISTA' } },
    { id: currentUserId, name: 'Tú', avatar: '🎭', weeklyScore: userWeeklyScore, wins: 1, bestScore: 82, partiesPlayed: 3, rank: 6, rewards: { coins: 100, badge: '🌱', title: 'PARTICIPANTE' } }
  ].sort((a, b) => b.weeklyScore - a.weeklyScore);
  
  // Calcular posición del usuario
  const userRank = rankedParticipants.findIndex(p => p.id === currentUserId) + 1;
  const userReward = rankedParticipants.find(p => p.id === currentUserId)?.rewards.coins || 0;
  
  return (
    <div className="border-4 border-[#D4AF37] bg-gradient-to-b from-gray-900 to-black p-6">
      
      {/* Header del Torneo */}
      <div className="text-center mb-6">
        <div className="flex justify-center gap-2 mb-2">
          <Trophy className="text-[#D4AF37]" size={32} />
          <span className="text-3xl font-black text-[#D4AF37]">TORNEO SEMANAL C8L</span>
          <Trophy className="text-[#D4AF37]" size={32} />
        </div>
        <div className="flex justify-center gap-4 text-sm text-gray-400">
          <div className="flex items-center gap-1"><Calendar size={14} /> Semana {currentWeek.id}</div>
          <div className="flex items-center gap-1"><Users size={14} /> {rankedParticipants.length} participantes</div>
          <div className="flex items-center gap-1"><Award size={14} /> {currentWeek.totalPrize.toLocaleString()} coins</div>
        </div>
      </div>
      
      {/* Timer */}
      <div className="bg-black border-2 border-[#D4AF37] p-4 mb-6 text-center">
        <div className="text-xs text-gray-400 mb-1">TIEMPO RESTANTE</div>
        <div className="flex justify-center gap-4 text-2xl font-mono font-black">
          <div><span className="text-[#D4AF37]">{timeLeft.days}</span> <span className="text-xs">días</span></div>
          <div><span className="text-[#D4AF37]">{timeLeft.hours}</span> <span className="text-xs">horas</span></div>
          <div><span className="text-[#D4AF37]">{timeLeft.minutes}</span> <span className="text-xs">min</span></div>
          <div><span className="text-[#D4AF37]">{timeLeft.seconds}</span> <span className="text-xs">seg</span></div>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setSelectedTab('current')}
          className={`flex-1 py-3 border-2 font-black transition-all ${
            selectedTab === 'current' 
              ? 'bg-[#D4AF37] text-black border-black' 
              : 'bg-black text-[#D4AF37] border-[#D4AF37]'
          }`}
        >
          🔴 CLASIFICACIÓN ACTUAL
        </button>
        <button
          onClick={() => setSelectedTab('past')}
          className={`flex-1 py-3 border-2 font-black transition-all ${
            selectedTab === 'past' 
              ? 'bg-[#D4AF37] text-black border-black' 
              : 'bg-black text-[#D4AF37] border-[#D4AF37]'
          }`}
        >
          🏆 CAMPEONES ANTERIORES
        </button>
      </div>
      
      <AnimatePresence mode="wait">
        {/* Clasificación Actual */}
        {selectedTab === 'current' && (
          <motion.div
            key="current"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            {/* Tu posición destacada */}
            <div className="bg-gradient-to-r from-[#D4AF37]/20 to-transparent border-l-4 border-[#D4AF37] p-4 mb-6">
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-xs text-gray-400">TU POSICIÓN</div>
                  <div className="text-3xl font-black text-[#D4AF37]">#{userRank}</div>
                  <div className="text-sm">{userWeeklyScore} puntos</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-400">RECOMPENSA ACTUAL</div>
                  <div className="text-xl font-black text-green-400">{userReward} COINS</div>
                  {!userHasJoined && (
                    <button
                      onClick={joinTournament}
                      className="mt-2 px-4 py-1 bg-[#00F3FF] text-black text-sm font-bold rounded"
                    >
                      UNIRSE AL TORNEO
                    </button>
                  )}
                </div>
              </div>
              
              {/* Barra de progreso al siguiente rango */}
              {userRank > 1 && (
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Distancia al #{userRank - 1}</span>
                    <span>{rankedParticipants[userRank - 2]?.weeklyScore - userWeeklyScore} puntos</span>
                  </div>
                  <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-[#00F3FF] to-[#D4AF37]"
                      style={{ width: `${(userWeeklyScore / (rankedParticipants[userRank - 2]?.weeklyScore || 1)) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
            
            {/* Tabla de clasificación */}
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {rankedParticipants.map((p, idx) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className={`flex items-center justify-between p-3 rounded-lg transition-all ${
                    p.id === currentUserId 
                      ? 'bg-[#D4AF37]/20 border border-[#D4AF37]' 
                      : 'bg-black/50 hover:bg-gray-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 text-center font-black text-xl">
                      {idx === 0 ? '👑' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx+1}°`}
                    </div>
                    <div className="text-2xl">{p.avatar}</div>
                    <div>
                      <div className="font-bold text-white">{p.name}</div>
                      <div className="flex gap-2 text-[10px] text-gray-500">
                        <span>🏆 {p.wins}</span>
                        <span>🎤 {p.partiesPlayed}</span>
                        <span>🎯 {p.bestScore}%</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-black text-[#D4AF37]">{p.weeklyScore}</div>
                    <div className="text-xs text-green-400">+{p.rewards.coins} coins</div>
                  </div>
                </motion.div>
              ))}
            </div>
            
            {/* Sistema de puntos */}
            <div className="mt-6 pt-4 border-t border-gray-800">
              <div className="text-xs text-gray-500 mb-2">📊 CÓMO SUMAR PUNTOS</div>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="bg-gray-900 p-2 rounded">
                  <span className="text-[#D4AF37]">+50</span> por participar
                </div>
                <div className="bg-gray-900 p-2 rounded">
                  <span className="text-[#D4AF37]">+100</span> por ganar fiesta
                </div>
                <div className="bg-gray-900 p-2 rounded">
                  <span className="text-[#D4AF37]">+200</span> por mejor puntuación
                </div>
              </div>
            </div>
          </motion.div>
        )}
        
        {/* Campeones Anteriores */}
        {selectedTab === 'past' && (
          <motion.div
            key="past"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {pastWeeks.map(week => (
              <div key={week.id} className="bg-black/50 p-4 rounded-lg border border-gray-800">
                <div className="flex justify-between items-center mb-3">
                  <div>
                    <div className="text-xs text-gray-500">Semana {week.id + 1}</div>
                    <div className="text-sm font-mono">
                      {week.startDate.toLocaleDateString()} - {week.endDate.toLocaleDateString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-500">Premio total</div>
                    <div className="text-[#D4AF37] font-bold">{week.totalPrize.toLocaleString()} coins</div>
                  </div>
                </div>
                
                {/* Podio */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {week.participants.slice(0, 3).map((p, idx) => (
                    <div key={p.id} className="text-center">
                      <div className="text-3xl mb-1">{p.avatar}</div>
                      <div className="font-bold text-sm">{p.name}</div>
                      <div className="text-xs text-[#D4AF37]">{p.rewards.badge} {p.rewards.title}</div>
                      <div className="text-xs text-green-400">+{p.rewards.coins} coins</div>
                    </div>
                  ))}
                </div>
                
                <button
                  onClick={() => {
                    if (week.winner?.id === currentUserId) {
                      onClaimReward(currentUserId, week.id);
                      setShowRewards(true);
                      setTimeout(() => setShowRewards(false), 3000);
                    }
                  }}
                  disabled={week.winner?.id !== currentUserId}
                  className="w-full py-2 bg-gray-800 text-gray-400 text-sm font-mono rounded disabled:opacity-50"
                >
                  {week.winner?.id === currentUserId ? 'RECLAMAR RECOMPENSA' : 'TORNEO FINALIZADO'}
                </button>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Modal de recompensa */}
      <AnimatePresence>
        {showRewards && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed inset-0 bg-black/90 flex items-center justify-center z-50"
          >
            <div className="bg-gradient-to-b from-[#D4AF37]/20 to-black border-4 border-[#D4AF37] p-8 text-center max-w-md">
              <div className="text-6xl mb-4">🏆</div>
              <h3 className="text-2xl font-black text-[#D4AF37] mb-2">¡RECOMPENSA RECLAMADA!</h3>
              <p className="text-gray-400 mb-4">Has recibido {userReward} coins por tu posición #{userRank}</p>
              <button
                onClick={() => setShowRewards(false)}
                className="px-6 py-2 bg-[#D4AF37] text-black font-black"
              >
                CERRAR
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
    </div>
  );
}