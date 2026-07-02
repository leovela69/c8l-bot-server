// components/live/LiveBattleOverlay.tsx
'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown, Gift, Timer } from 'lucide-react';
import { getSocket } from '@/lib/socket';

interface Participant {
  id: string;
  name: string;
  avatar: string;
  color: 'yellow' | 'black';
}

interface BattleOverlayProps {
  liveStreamId: string;
  participant1: Participant;
  participant2: Participant;
  endsAt: Date;
  onBattleEnd?: (winnerId: string | null) => void;
}

export function LiveBattleOverlay({ liveStreamId, participant1, participant2, endsAt, onBattleEnd }: BattleOverlayProps) {
  const [score1, setScore1] = useState(0);
  const [score2, setScore2] = useState(0);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [winner, setWinner] = useState<string | null>(null);
  const [ended, setEnded] = useState(false);

  // Suscripción WebSocket para actualizaciones de puntuación y fin de batalla
  useEffect(() => {
    const socket = getSocket(); // tu función para obtener socket.io
    socket.emit('join-live', liveStreamId);

    socket.on('battle-score-update', (data: { score1: number; score2: number }) => {
      setScore1(data.score1);
      setScore2(data.score2);
    });

    socket.on('battle-ended', (data: { winnerId: string | null }) => {
      setWinner(data.winnerId);
      setEnded(true);
      onBattleEnd?.(data.winnerId);
    });

    return () => {
      socket.off('battle-score-update');
      socket.off('battle-ended');
    };
  }, [liveStreamId]);

  // Temporizador
  useEffect(() => {
    const updateTimer = () => {
      const now = new Date().getTime();
      const end = endsAt.getTime();
      const remaining = Math.max(0, Math.floor((end - now) / 1000));
      setTimeLeft(remaining);
      if (remaining === 0 && !ended) {
        // La batalla debería terminar automáticamente; el backend emitirá battle-ended
      }
    };
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [endsAt, ended]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const totalScore = score1 + score2;
  const percent1 = totalScore === 0 ? 50 : (score1 / totalScore) * 100;
  const percent2 = 100 - percent1;

  if (ended) {
    return (
      <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-20">
        <div className="text-center p-6 bg-black border-4 border-[#D4AF37] rounded-xl">
          <Crown size={48} className="text-[#D4AF37] mx-auto mb-4" />
          <h3 className="text-2xl font-black text-white mb-2">
            {winner ? (winner === participant1.id ? participant1.name : participant2.name) : 'Empate'}
          </h3>
          <p className="text-gray-400">{winner ? '¡Ganó la batalla!' : 'Nadie ganó esta vez'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 z-10 flex flex-col justify-between pointer-events-none">
      {/* Cabecera con temporizador */}
      <div className="flex justify-center pt-4">
        <div className="bg-black/80 border-2 border-[#D4AF37] rounded-full px-6 py-2 text-white font-mono text-2xl flex items-center gap-2">
          <Timer size={20} className="text-[#D4AF37]" />
          {formatTime(timeLeft)}
        </div>
      </div>

      {/* Barras de progreso enfrentadas */}
      <div className="relative w-full h-20 md:h-24">
        <div className="absolute inset-0 flex">
          {/* Lado amarillo */}
          <motion.div
            className="h-full bg-yellow-500 flex flex-col justify-center items-center text-black font-black"
            style={{ width: `${percent1}%` }}
            animate={{ width: `${percent1}%` }}
            transition={{ duration: 0.2 }}
          >
            <div className="text-lg md:text-2xl">{score1}</div>
            <div className="text-xs md:text-sm">{participant1.name}</div>
          </motion.div>
          {/* Lado negro */}
          <motion.div
            className="h-full bg-black flex flex-col justify-center items-center text-white font-black"
            style={{ width: `${percent2}%` }}
            animate={{ width: `${percent2}%` }}
            transition={{ duration: 0.2 }}
          >
            <div className="text-lg md:text-2xl">{score2}</div>
            <div className="text-xs md:text-sm">{participant2.name}</div>
          </motion.div>
        </div>
        {/* Línea divisoria central */}
        <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-white shadow-lg transform -translate-x-1/2" />
      </div>

      {/* Indicadores de líder (opcional) */}
      {score1 > score2 && (
        <div className="absolute top-1/3 left-4 transform -translate-y-1/2 bg-yellow-500 text-black px-3 py-1 rounded-full text-sm font-black animate-pulse">
          👑 Líder
        </div>
      )}
      {score2 > score1 && (
        <div className="absolute top-1/3 right-4 transform -translate-y-1/2 bg-black text-white px-3 py-1 rounded-full text-sm font-black animate-pulse">
          👑 Líder
        </div>
      )}
    </div>
  );
}