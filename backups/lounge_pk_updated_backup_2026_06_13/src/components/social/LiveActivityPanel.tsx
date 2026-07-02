// components/social/LiveActivityPanel.tsx
'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Trophy, Gift, Star, TrendingUp, Users, Crown, Activity } from 'lucide-react';

interface LiveActivity {
  id: string;
  userName: string;
  userAvatar: string;
  trackTitle: string;
  currentScore: number;
  streak: number;
  isLive: boolean;
  startedAt: Date;
}

interface RecentGift {
  id: string;
  from: string;
  to: string;
  gift: string;
  timestamp: Date;
}

interface LiveActivityPanelProps {
  onSendGift: (toUserId: string, giftType: string) => void;
  currentUserId: string;
}

export function LiveActivityPanel({ onSendGift, currentUserId }: LiveActivityPanelProps) {
  const [activeSingers, setActiveSingers] = useState<LiveActivity[]>([
    {
      id: '1',
      userName: 'Leo Vela',
      userAvatar: '🦁',
      trackTitle: 'Bohemian Rhapsody',
      currentScore: 87,
      streak: 12,
      isLive: true,
      startedAt: new Date()
    }
  ]);
  const [recentGifts, setRecentGifts] = useState<RecentGift[]>([
    { id: '1', from: 'Dj_Rayo', to: 'Leo Vela', gift: '🌹', timestamp: new Date() }
  ]);
  const [globalAnnouncements, setGlobalAnnouncements] = useState<string[]>([]);
  
  // Simular actualizaciones en tiempo real (WebSocket en producción)
  useEffect(() => {
    const interval = setInterval(() => {
      // Actualizar puntuaciones de los que están cantando
      setActiveSingers(prev => prev.map(singer => ({
        ...singer,
        currentScore: Math.min(100, singer.currentScore + Math.floor(Math.random() * 3) - 1),
        streak: singer.streak > 0 ? singer.streak + (Math.random() > 0.7 ? 1 : 0) : 0
      })));
    }, 3000);
    
    // Escuchar regalos enviados desde el lounge
    const handleGiftSent = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail && detail.from && detail.to && detail.gift) {
        setRecentGifts(prev => [
          {
            id: Math.random().toString(),
            from: detail.from,
            to: detail.to,
            gift: detail.gift,
            timestamp: new Date()
          },
          ...prev
        ]);
        
        // Generar anuncio especial para regalos grandes
        if (detail.isLarge) {
          setGlobalAnnouncements(prev => [
            ...prev,
            `🎁 ¡${detail.from} le envió ${detail.giftName} ${detail.gift} a ${detail.to}! 🎁`
          ]);
          setTimeout(() => setGlobalAnnouncements(prev => prev.slice(1)), 6000);
        }
      }
    };
    window.addEventListener('c8l-gift-sent', handleGiftSent);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('c8l-gift-sent', handleGiftSent);
    };
  }, []);
  
  // Anuncios cuando alguien alcanza puntuación alta
  useEffect(() => {
    const highScores = activeSingers.filter(s => s.currentScore >= 90);
    if (highScores.length > 0 && !globalAnnouncements.includes('90')) {
      setGlobalAnnouncements(prev => [...prev, `🏆 ¡${highScores[0].userName} alcanzó ${highScores[0].currentScore} puntos! 🏆`]);
      setTimeout(() => setGlobalAnnouncements(prev => prev.slice(1)), 5000);
    }
  }, [activeSingers]);
  
  return (
    <div className="border-4 border-[#D4AF37] bg-black p-4 h-full flex flex-col">
      <h3 className="text-lg font-black text-[#D4AF37] mb-3 flex items-center gap-2">
        <Activity size={18} /> ACTIVIDAD EN VIVO
      </h3>
      
      {/* Anuncios globales */}
      <div className="mb-4 space-y-1">
        {globalAnnouncements.map((ann, i) => (
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
      
      {/* Cantantes activos */}
      <div className="flex-1 mb-4">
        <div className="text-xs text-gray-500 mb-2">🎤 CANTANDO AHORA</div>
        <div className="space-y-3">
          {activeSingers.filter(s => s.isLive).map(singer => (
            <div key={singer.id} className="bg-gray-900 p-3 rounded-lg">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{singer.userAvatar}</span>
                  <div>
                    <div className="font-bold text-white text-sm">{singer.userName}</div>
                    <div className="text-xs text-gray-500">{singer.trackTitle}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-black text-[#D4AF37]">{singer.currentScore}</div>
                  <div className="text-[10px] text-green-400">🔥 {singer.streak}</div>
                </div>
              </div>
              
              {/* Barra de progreso */}
              <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden mb-2">
                <div 
                  className="h-full bg-gradient-to-r from-[#00F3FF] to-[#D4AF37] transition-all duration-300"
                  style={{ width: `${singer.currentScore}%` }}
                />
              </div>
              
              {/* Botón de regalo */}
              {singer.id !== currentUserId && (
                <button
                  onClick={() => onSendGift(singer.id, '🌹')}
                  className="w-full py-1 mt-2 bg-[#D4AF37]/20 text-[#D4AF37] text-xs font-bold rounded hover:bg-[#D4AF37]/40 transition-all flex items-center justify-center gap-1"
                >
                  <Gift size={12} /> REGALAR
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
      
      {/* Regalos recientes */}
      <div className="border-t border-gray-800 pt-3">
        <div className="text-xs text-gray-500 mb-2">🎁 REGALOS RECIENTES</div>
        <div className="space-y-1 max-h-32 overflow-y-auto">
          {recentGifts.map(gift => (
            <div key={gift.id} className="text-xs text-gray-400 flex justify-between">
              <span><span className="text-[#D4AF37]">{gift.from}</span> → {gift.to}</span>
              <span>{gift.gift}</span>
            </div>
          ))}
        </div>
      </div>
      
      {/* Resumen de la sala */}
      <div className="mt-3 pt-3 border-t border-gray-800 flex justify-between text-xs text-gray-500">
        <span>👥 {activeSingers.length} cantando</span>
        <span>🎤 {recentGifts.length} regalos/h</span>
      </div>
    </div>
  );
}