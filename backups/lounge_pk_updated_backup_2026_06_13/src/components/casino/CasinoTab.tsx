// components/casino/CasinoTab.tsx
import { useState } from 'react';
import { RouletteWheel } from './RouletteWheel';
import { OlympusSlots } from './OlympusSlots';

interface CasinoTabProps {
  userCoins: number;
  setUserCoins: React.Dispatch<React.SetStateAction<number>>;
}

export function CasinoTab({ userCoins, setUserCoins }: CasinoTabProps) {
  const [activeGame, setActiveGame] = useState<'roulette' | 'slots'>('roulette');
  const [lastWin, setLastWin] = useState<{ amount: number; game: string } | null>(null);
  
  return (
    <div className="space-y-4">
      
      {/* Selector de juego */}
      <div className="flex gap-2 border-b-2 border-black pb-2">
        <button
          onClick={() => setActiveGame('roulette')}
          className={`px-6 py-2 font-heading font-black text-lg transition-all ${
            activeGame === 'roulette'
              ? 'bg-[#D4AF37] text-black border-2 border-black shadow-[2px_2px_0px_#000]'
              : 'bg-black text-[#D4AF37] border-2 border-[#D4AF37] hover:bg-[#D4AF37]/20'
          }`}
        >
          🎡 RULETA
        </button>
        <button
          onClick={() => setActiveGame('slots')}
          className={`px-6 py-2 font-heading font-black text-lg transition-all ${
            activeGame === 'slots'
              ? 'bg-[#D4AF37] text-black border-2 border-black shadow-[2px_2px_0px_#000]'
              : 'bg-black text-[#D4AF37] border-2 border-[#D4AF37] hover:bg-[#D4AF37]/20'
          }`}
        >
          🎰 SLOTS OLIMPO
        </button>
      </div>
      
      {/* Notificación de última victoria */}
      {lastWin && (
        <div className="bg-gradient-to-r from-[#D4AF37]/20 to-transparent p-3 border-l-4 border-[#D4AF37] animate-pulse">
          <span className="text-sm">
            🎉 ¡Última victoria: <span className="font-bold text-[#D4AF37]">{lastWin.amount} COINS</span> en {lastWin.game}! 🎉
          </span>
        </div>
      )}
      
      {/* Juego activo */}
      {activeGame === 'roulette' && (
        <RouletteWheel
          userCoins={userCoins}
          setUserCoins={setUserCoins}
          onWin={(amount) => setLastWin({ amount, game: 'RULETA' })}
        />
      )}
      
      {activeGame === 'slots' && (
        <OlympusSlots
          userCoins={userCoins}
          setUserCoins={setUserCoins}
          onWin={(amount, god) => setLastWin({ amount, game: `SLOTS (${god})` })}
        />
      )}
      
    </div>
  );
}