// components/achievements/BadgeSystem.tsx
'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Star, Mic, Users, Gift, Crown, Flame, Diamond, Zap, Award, Music, Heart, Calendar, Target, TrendingUp } from 'lucide-react';

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  category: 'vocal' | 'social' | 'tournament' | 'special';
  requirement: string;
  requiredValue: number;
  currentValue: number;
  isEarned: boolean;
  earnedAt?: Date;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  rewardCoins?: number;
}

interface UserStats {
  totalCovers: number;
  totalVotes: number;
  totalGiftsSent: number;
  totalGiftsReceived: number;
  totalPartiesWon: number;
  bestScore: number;
  totalTournamentsWon: number;
  weeklyRank: number;
  consecutiveDays: number;
  friendsCount: number;
  legendaryCovers: number;
}

interface BadgeSystemProps {
  userId: string;
  userStats: UserStats;
  onClaimReward: (badgeId: string, rewardCoins: number) => void;
}

const BADGES: Omit<Badge, 'currentValue' | 'isEarned' | 'earnedAt'>[] = [
  // Vocales
  { id: 'first_cover', name: '🎤 PRIMER COVER', description: 'Sube tu primer cover', icon: <Mic size={20} />, color: '#00F3FF', category: 'vocal', requirement: 'Sube 1 cover', requiredValue: 1, rarity: 'common', rewardCoins: 50 },
  { id: 'cover_master', name: '🎵 MAESTRO DE COVERS', description: 'Sube 50 covers', icon: <Music size={20} />, color: '#D4AF37', category: 'vocal', requirement: 'Sube 50 covers', requiredValue: 50, rarity: 'epic', rewardCoins: 500 },
  { id: 'golden_voice', name: '🏆 VOZ DE ORO', description: 'Alcanza 95+ puntos en un cover', icon: <Crown size={20} />, color: '#D4AF37', category: 'vocal', requirement: 'Puntuación ≥ 95', requiredValue: 95, rarity: 'legendary', rewardCoins: 1000 },
  { id: 'perfect_pitch', name: '🎯 AFINACIÓN PERFECTA', description: 'Alcanza 100 puntos en un cover', icon: <Target size={20} />, color: '#FF0055', category: 'vocal', requirement: 'Puntuación = 100', requiredValue: 100, rarity: 'legendary', rewardCoins: 2000 },
  
  // Sociales
  { id: 'social_butterfly', name: '🦋 MARIPOSA SOCIAL', description: 'Recibe 100 votos en total', icon: <Heart size={20} />, color: '#FF69B4', category: 'social', requirement: '100 votos recibidos', requiredValue: 100, rarity: 'rare', rewardCoins: 100 },
  { id: 'gift_giver', name: '🎁 REY DE REGALOS', description: 'Envía 50 regalos', icon: <Gift size={20} />, color: '#9B59B6', category: 'social', requirement: '50 regalos enviados', requiredValue: 50, rarity: 'epic', rewardCoins: 300 },
  { id: 'popular', name: '⭐ POPULAR', description: 'Recibe 500 votos en total', icon: <Star size={20} />, color: '#D4AF37', category: 'social', requirement: '500 votos recibidos', requiredValue: 500, rarity: 'epic', rewardCoins: 500 },
  { id: 'legendary_gifter', name: '💎 LEYENDA DE REGALOS', description: 'Envía 500 regalos', icon: <Diamond size={20} />, color: '#D4AF37', category: 'social', requirement: '500 regalos enviados', requiredValue: 500, rarity: 'legendary', rewardCoins: 2000 },
  
  // Torneos
  { id: 'weekly_winner', name: '🏆 CAMPEÓN SEMANAL', description: 'Gana un torneo semanal', icon: <Trophy size={20} />, color: '#D4AF37', category: 'tournament', requirement: '1 victoria semanal', requiredValue: 1, rarity: 'epic', rewardCoins: 500 },
  { id: 'tournament_legend', name: '👑 LEYENDA DE TORNEOS', description: 'Gana 10 torneos semanales', icon: <Crown size={20} />, color: '#D4AF37', category: 'tournament', requirement: '10 victorias', requiredValue: 10, rarity: 'legendary', rewardCoins: 5000 },
  { id: 'party_king', name: '🎉 REY DE LA FIESTA', description: 'Gana 5 modos fiesta', icon: <Flame size={20} />, color: '#FF6600', category: 'tournament', requirement: '5 victorias en fiesta', requiredValue: 5, rarity: 'epic', rewardCoins: 300 },
  
  // Especiales
  { id: 'dedicated', name: '🔥 DEDICADO', description: 'Inicia sesión 30 días seguidos', icon: <Calendar size={20} />, color: '#FF0055', category: 'special', requirement: '30 días consecutivos', requiredValue: 30, rarity: 'epic', rewardCoins: 1000 },
  { id: 'rising_star', name: '⭐ ESTRELLA EN ASCENSO', description: 'Entra al top 10 semanal', icon: <TrendingUp size={20} />, color: '#00F3FF', category: 'special', requirement: 'Top 10 semanal', requiredValue: 10, rarity: 'rare', rewardCoins: 200 },
  { id: 'c8l_legend', name: '🌟 LEYENDA C8L', description: 'Completa todos los logros', icon: <Award size={20} />, color: '#D4AF37', category: 'special', requirement: 'Todos los logros', requiredValue: 20, rarity: 'legendary', rewardCoins: 10000 },
];

export function BadgeSystem({ userId, userStats, onClaimReward }: BadgeSystemProps) {
  const [badges, setBadges] = useState<Badge[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showNotification, setShowNotification] = useState<{ badge: Badge; reward: number } | null>(null);
  
  useEffect(() => {
    // Calcular progreso de cada badge
    const updatedBadges = BADGES.map(badge => {
      let currentValue = 0;
      
      switch(badge.id) {
        case 'first_cover':
        case 'cover_master':
          currentValue = userStats.totalCovers;
          break;
        case 'golden_voice':
        case 'perfect_pitch':
          currentValue = userStats.bestScore;
          break;
        case 'social_butterfly':
        case 'popular':
          currentValue = userStats.totalVotes;
          break;
        case 'gift_giver':
        case 'legendary_gifter':
          currentValue = userStats.totalGiftsSent;
          break;
        case 'weekly_winner':
        case 'tournament_legend':
          currentValue = userStats.totalTournamentsWon;
          break;
        case 'party_king':
          currentValue = userStats.totalPartiesWon;
          break;
        case 'dedicated':
          currentValue = userStats.consecutiveDays;
          break;
        case 'rising_star':
          currentValue = userStats.weeklyRank <= 10 ? 1 : 0;
          break;
        case 'c8l_legend':
          const earnedCount = badges.filter(b => b.isEarned).length;
          currentValue = earnedCount;
          break;
        default:
          currentValue = 0;
      }
      
      const isEarned = currentValue >= badge.requiredValue;
      
      return {
        ...badge,
        currentValue,
        isEarned,
        earnedAt: isEarned ? new Date() : undefined,
      };
    });
    
    // Verificar nuevos logros
    updatedBadges.forEach(badge => {
      const previous = badges.find(b => b.id === badge.id);
      if (!previous?.isEarned && badge.isEarned) {
        setShowNotification({ badge, reward: badge.rewardCoins || 0 });
        onClaimReward(badge.id, badge.rewardCoins || 0);
        setTimeout(() => setShowNotification(null), 5000);
      }
    });
    
    setBadges(updatedBadges);
  }, [userStats]);
  
  const categories = [
    { id: 'all', name: 'TODAS', icon: <Award size={16} /> },
    { id: 'vocal', name: 'VOCALES', icon: <Mic size={16} /> },
    { id: 'social', name: 'SOCIALES', icon: <Users size={16} /> },
    { id: 'tournament', name: 'TORNEOS', icon: <Trophy size={16} /> },
    { id: 'special', name: 'ESPECIALES', icon: <Star size={16} /> },
  ];
  
  const filteredBadges = badges.filter(b => 
    selectedCategory === 'all' || b.category === selectedCategory
  );
  
  const getRarityColor = (rarity: string) => {
    switch(rarity) {
      case 'legendary': return 'from-[#D4AF37] to-[#FFD700]';
      case 'epic': return 'from-purple-600 to-pink-600';
      case 'rare': return 'from-[#00F3FF] to-blue-600';
      default: return 'from-gray-600 to-gray-800';
    }
  };
  
  const getRarityGlow = (rarity: string) => {
    switch(rarity) {
      case 'legendary': return 'shadow-[0_0_15px_rgba(212,175,55,0.5)]';
      case 'epic': return 'shadow-[0_0_15px_rgba(155,89,182,0.5)]';
      case 'rare': return 'shadow-[0_0_10px_rgba(0,243,255,0.3)]';
      default: return '';
    }
  };
  
  return (
    <div className="min-h-screen bg-black p-6">
      
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex justify-center gap-3 mb-3">
          <Award className="text-[#D4AF37]" size={48} />
          <span className="text-4xl font-black text-[#D4AF37]">SISTEMA DE LOGROS</span>
          <Trophy className="text-[#D4AF37]" size={48} />
        </div>
        <p className="text-gray-400">Completa desafíos, gana insignias y obtén recompensas exclusivas</p>
      </div>
      
      {/* Stats resumen */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto mb-8">
        <div className="bg-gradient-to-r from-[#D4AF37]/20 to-transparent p-3 rounded-lg border-l-4 border-[#D4AF37]">
          <div className="text-2xl font-black text-[#D4AF37]">{badges.filter(b => b.isEarned).length}</div>
          <div className="text-xs text-gray-400">Logros desbloqueados</div>
        </div>
        <div className="bg-gradient-to-r from-[#00F3FF]/20 to-transparent p-3 rounded-lg border-l-4 border-[#00F3FF]">
          <div className="text-2xl font-black text-[#00F3FF]">{userStats.totalCovers}</div>
          <div className="text-xs text-gray-400">Covers subidos</div>
        </div>
        <div className="bg-gradient-to-r from-[#FF0055]/20 to-transparent p-3 rounded-lg border-l-4 border-[#FF0055]">
          <div className="text-2xl font-black text-[#FF0055]">{userStats.totalVotes}</div>
          <div className="text-xs text-gray-400">Votos recibidos</div>
        </div>
        <div className="bg-gradient-to-r from-purple-600/20 to-transparent p-3 rounded-lg border-l-4 border-purple-600">
          <div className="text-2xl font-black text-purple-400">{userStats.totalTournamentsWon}</div>
          <div className="text-xs text-gray-400">Torneos ganados</div>
        </div>
      </div>
      
      {/* Categorías */}
      <div className="flex flex-wrap justify-center gap-2 mb-8">
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-4 py-2 border-2 font-black text-sm transition-all flex items-center gap-2 ${
              selectedCategory === cat.id
                ? 'bg-[#D4AF37] text-black border-black'
                : 'bg-black text-[#D4AF37] border-[#D4AF37] hover:bg-[#D4AF37]/10'
            }`}
          >
            {cat.icon}
            {cat.name}
          </button>
        ))}
      </div>
      
      {/* Grid de insignias */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-6xl mx-auto">
        {filteredBadges.map((badge) => (
          <motion.div
            key={badge.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`relative bg-black border-2 p-4 transition-all ${
              badge.isEarned 
                ? `border-[${badge.color}] ${getRarityGlow(badge.rarity)}` 
                : 'border-gray-800 opacity-70'
            }`}
          >
            {/* Rarity badge */}
            <div className={`absolute -top-2 -right-2 px-2 py-0.5 text-[9px] font-black rounded-full bg-gradient-to-r ${getRarityColor(badge.rarity)} text-black`}>
              {badge.rarity.toUpperCase()}
            </div>
            
            <div className="flex items-start gap-3">
              <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${getRarityColor(badge.rarity)} flex items-center justify-center text-white ${
                badge.isEarned ? 'animate-pulse' : 'grayscale'
              }`}>
                {badge.icon}
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-black text-white truncate">{badge.name}</h3>
                <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{badge.description}</p>
                
                {/* Progress bar */}
                <div className="mt-3">
                  <div className="flex justify-between text-[10px] text-gray-500 mb-1">
                    <span>Progreso: {badge.currentValue} / {badge.requiredValue}</span>
                    <span>{Math.min(100, Math.round((badge.currentValue / badge.requiredValue) * 100))}%</span>
                  </div>
                  <div className="w-full bg-gray-900 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className={`h-full bg-gradient-to-r ${getRarityColor(badge.rarity)}`}
                      style={{ width: `${Math.min(100, (badge.currentValue / badge.requiredValue) * 100)}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between mt-3 text-[10px]">
                  <span className="text-gray-500">{badge.requirement}</span>
                  {badge.rewardCoins && (
                    <span className="text-[#D4AF37] font-black">
                      +{badge.rewardCoins} COINS
                    </span>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
      
      {/* Notification overlay */}
      <AnimatePresence>
        {showNotification && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="fixed bottom-6 right-6 z-50 bg-black border-4 border-[#D4AF37] p-6 max-w-sm rounded shadow-[0_0_20px_rgba(212,175,55,0.4)]"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-[#D4AF37] flex items-center justify-center text-black">
                <Trophy size={24} />
              </div>
              <div>
                <h4 className="font-black text-[#D4AF37] text-sm">¡LOGRO DESBLOQUEADO!</h4>
                <p className="text-white text-xs font-bold mt-0.5">{showNotification.badge.name}</p>
                <p className="text-gray-400 text-[10px] mt-1">{showNotification.badge.description}</p>
                <p className="text-[#00F3FF] text-xs font-black mt-2">
                  +{showNotification.reward} COINS AÑADIDOS
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}