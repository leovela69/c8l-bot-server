// components/games/FortuneWheel.tsx
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface FortuneWheelProps {
  contributions: number;
  onSpinComplete: (multiplier: number) => void;
}

export function FortuneWheel({ contributions, onSpinComplete }: FortuneWheelProps) {
  const [progress, setProgress] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [prize, setPrize] = useState<number | null>(null);
  
  const segments = [
    { label: 'x2', multiplier: 2, color: '#D4AF37' },
    { label: 'x3', multiplier: 3, color: '#00F3FF' },
    { label: 'x5', multiplier: 5, color: '#FF0055' },
    { label: 'x10', multiplier: 10, color: '#9B59B6' },
    { label: 'JACKPOT', multiplier: 100, color: '#FFD700' },
    { label: 'x2', multiplier: 2, color: '#D4AF37' }
  ];
  
  useEffect(() => {
    // Actualizar progreso basado en contribuciones
    const total = Math.min(contributions / 5000, 1);
    setProgress(total);
    
    if (total >= 1 && !isSpinning) {
      spinWheel();
    }
  }, [contributions]);
  
  const spinWheel = () => {
    setIsSpinning(true);
    const randomIndex = Math.floor(Math.random() * segments.length);
    const winMultiplier = segments[randomIndex].multiplier;
    
    setTimeout(() => {
      setPrize(winMultiplier);
      onSpinComplete(winMultiplier);
      setIsSpinning(false);
      
      // Resetear progreso después de 5 segundos
      setTimeout(() => {
        setPrize(null);
        setProgress(0);
      }, 5000);
    }, 3000);
  };
  
  return (
    <div className="border-4 border-black bg-black p-6 text-center">
      <h3 className="text-xl font-black text-[#D4AF37] mb-2">🎡 RUEDA DE LA FORTUNA</h3>
      <div className="text-sm text-gray-400 mb-4">
        Progreso: {Math.floor(progress * 100)}% ({contributions}/5000 coins donados)
      </div>
      
      {/* Barra de progreso */}
      <div className="h-4 bg-gray-800 rounded-full overflow-hidden mb-4">
        <motion.div 
          className="h-full bg-gradient-to-r from-[#D4AF37] to-[#FFD700]"
          initial={{ width: 0 }}
          animate={{ width: `${progress * 100}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>
      
      {/* Visual de la rueda */}
      <div className="relative w-48 h-48 mx-auto mb-4">
        <svg viewBox="0 0 200 200" className="w-full h-full">
          {segments.map((seg, i) => {
            const angle = (i * 60) - 90;
            return (
              <g key={i}>
                <path
                  d={`M 100 100 L ${100 + 80 * Math.cos(angle * Math.PI / 180)} ${100 + 80 * Math.sin(angle * Math.PI / 180)} A 80 80 0 0 1 ${100 + 80 * Math.cos((angle + 60) * Math.PI / 180)} ${100 + 80 * Math.sin((angle + 60) * Math.PI / 180)} Z`}
                  fill={seg.color}
                  stroke="black"
                  strokeWidth="2"
                />
                <text
                  x={100 + 50 * Math.cos((angle + 30) * Math.PI / 180)}
                  y={100 + 50 * Math.sin((angle + 30) * Math.PI / 180)}
                  textAnchor="middle"
                  fill="white"
                  fontSize="12"
                  fontWeight="bold"
                >
                  {seg.label}
                </text>
              </g>
            );
          })}
          <circle cx="100" cy="100" r="15" fill="black" stroke="#D4AF37" strokeWidth="3" />
        </svg>
      </div>
      
      {isSpinning && (
        <div className="text-[#00F3FF] animate-pulse">🎲 GIRANDO...</div>
      )}
      
      {prize && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="mt-4 p-3 bg-[#D4AF37]/20 border-2 border-[#D4AF37]"
        >
          <div className="text-2xl font-black text-[#D4AF37]">¡x{prize} MULTIPLICADOR!</div>
          <div className="text-sm">Todos los que contribuyeron reciben x{prize} sus regalos</div>
        </motion.div>
      )}
    </div>
  );
}