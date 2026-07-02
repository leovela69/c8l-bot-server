'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, Trophy, Award, Coins, RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

interface Mission {
  id: string;
  title: string;
  description: string;
  target: number;
  current: number;
  rewardCoins: number;
  rewardXP: number;
  claimed: boolean;
  type: string;
}

interface DailyMissionsProps {
  userId?: string;
  userStats: {
    coversToday: number;
    giftsSentToday: number;
    practiceMinutesToday: number;
    partiesToday: number;
    friendsOnline: number;
    winStreak: number;
    totalCoins: number;
    level: number;
    xp: number;
    nextLevelXp: number;
  };
  onClaimReward?: (coins: number, xp: number) => void;
  onRefreshMissions?: () => void;
}

const DEFAULT_MISSIONS: Omit<Mission, 'current'>[] = [
  {
    id: 'm_cover',
    title: '🎤 Estrella de la Canción',
    description: 'Graba e introduce un cover en el feed social',
    target: 1,
    rewardCoins: 100,
    rewardXP: 150,
    claimed: false,
    type: 'cover'
  },
  {
    id: 'm_gift',
    title: '🎁 Amigo Generoso',
    description: 'Envía un regalo a otro usuario en butaca',
    target: 1,
    rewardCoins: 50,
    rewardXP: 80,
    claimed: false,
    type: 'gift'
  },
  {
    id: 'm_practice',
    title: '⏱️ Práctica Perfeccionista',
    description: 'Canta al menos 5 minutos en modo práctica',
    target: 5,
    rewardCoins: 75,
    rewardXP: 120,
    claimed: false,
    type: 'practice'
  },
  {
    id: 'm_party',
    title: '🎉 Rey de la Fiesta',
    description: 'Participa u organiza un Modo Fiesta',
    target: 1,
    rewardCoins: 150,
    rewardXP: 200,
    claimed: false,
    type: 'party'
  },
  {
    id: 'm_streak',
    title: '🔥 Racha Imparable',
    description: 'Consigue una racha de victorias de 3 juegos',
    target: 3,
    rewardCoins: 200,
    rewardXP: 300,
    claimed: false,
    type: 'streak'
  }
];

export function DailyMissions({ userId, userStats, onClaimReward, onRefreshMissions }: DailyMissionsProps) {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Initialize and load current progress
  useEffect(() => {
    const loadedMissions = DEFAULT_MISSIONS.map(m => {
      let current = 0;
      switch(m.type) {
        case 'cover': current = userStats.coversToday; break;
        case 'gift': current = userStats.giftsSentToday; break;
        case 'practice': current = userStats.practiceMinutesToday; break;
        case 'party': current = userStats.partiesToday; break;
        case 'streak': current = userStats.winStreak; break;
        default: current = 0;
      }
      
      // Load claimed state from local storage
      const claimedKey = `c8l_mission_claimed_${m.id}_${new Date().toDateString()}`;
      const isClaimed = typeof window !== 'undefined' ? localStorage.getItem(claimedKey) === 'true' : false;

      return {
        ...m,
        current: Math.min(current, m.target),
        claimed: isClaimed
      };
    });

    setMissions(loadedMissions);
  }, [userStats]);

  const handleClaim = async (missionId: string, coins: number, xp: number) => {
    try {
      // Sync with Supabase if userId is provided
      if (userId) {
        await supabase.from('user_mission_claims').insert({
          user_id: userId,
          mission_id: missionId,
          coins_reward: coins,
          xp_reward: xp,
          timestamp: new Date()
        });

        // Add coins to wallets in database
        await supabase.rpc('add_coins', { user_id: userId, amount: coins });
      }

      // Mark claimed locally
      const claimedKey = `c8l_mission_claimed_${missionId}_${new Date().toDateString()}`;
      localStorage.setItem(claimedKey, 'true');

      setMissions(prev => 
        prev.map(m => m.id === missionId ? { ...m, claimed: true } : m)
      );

      // Trigger reward callback
      onClaimReward?.(coins, xp);
      
      setNotification(`🏆 ¡Recompensa reclamada! +${coins} Coins y +${xp} XP`);
      setTimeout(() => setNotification(null), 3000);
    } catch (e) {
      console.error('Error claiming reward:', e);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      onRefreshMissions?.();
      setNotification('🔄 ¡Misiones actualizadas!');
      setTimeout(() => setNotification(null), 2000);
    }, 1000);
  };

  return (
    <div className="bg-[#0a0a0c] border-2 border-gray-800 p-4 rounded-lg relative overflow-hidden text-white">
      {/* Notification toast */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-2 left-1/2 transform -translate-x-1/2 z-50 bg-[#D4AF37] text-black px-4 py-2 rounded font-bold text-xs shadow-lg whitespace-nowrap"
          >
            {notification}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex justify-between items-center mb-4 border-b border-gray-800 pb-2">
        <h3 className="text-sm font-black text-[#D4AF37] flex items-center gap-1.5 uppercase tracking-wider">
          <Target size={16} /> Misiones Diarias
        </h3>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="p-1 hover:text-[#00F3FF] text-gray-500 transition-colors cursor-pointer"
          title="Actualizar"
        >
          <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
        {missions.map((mission) => {
          const isCompleted = mission.current >= mission.target;
          const progressPercent = (mission.current / mission.target) * 100;
          
          return (
            <div 
              key={mission.id}
              className={`p-3 border rounded-lg transition-all ${
                mission.claimed 
                  ? 'border-gray-900 bg-black/30 opacity-60' 
                  : isCompleted 
                    ? 'border-green-600/50 bg-green-950/10' 
                    : 'border-gray-800 bg-black/40'
              }`}
            >
              <div className="flex justify-between items-start gap-2">
                <div>
                  <h4 className={`text-xs font-bold ${isCompleted && !mission.claimed ? 'text-green-400' : 'text-gray-200'}`}>
                    {mission.title}
                  </h4>
                  <p className="text-[10px] text-gray-400 mt-0.5">{mission.description}</p>
                </div>
                
                {/* Reward pill */}
                <div className="flex flex-col items-end shrink-0">
                  <div className="text-[9px] font-bold text-[#D4AF37] flex items-center gap-0.5">
                    <Coins size={10} /> +{mission.rewardCoins}
                  </div>
                  <div className="text-[9px] font-bold text-[#00F3FF] mt-0.5">
                    🏆 +{mission.rewardXP} XP
                  </div>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mt-3">
                <div className="flex justify-between text-[9px] text-gray-500 mb-1">
                  <span>Progreso</span>
                  <span>{mission.current} / {mission.target}</span>
                </div>
                <div className="h-2 bg-gray-900 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-300 ${
                      isCompleted ? 'bg-green-500' : 'bg-[#00F3FF]'
                    }`}
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              {/* Claim button */}
              {isCompleted && !mission.claimed && (
                <button
                  onClick={() => handleClaim(mission.id, mission.rewardCoins, mission.rewardXP)}
                  className="mt-2.5 w-full py-1.5 bg-green-600 hover:bg-green-500 text-white text-[10px] font-black tracking-widest uppercase transition-all rounded shadow-md cursor-pointer"
                >
                  Reclamar Recompensa
                </button>
              )}

              {mission.claimed && (
                <div className="mt-2 text-center text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                  Reclamado ✓
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
