// components/social/MiniGamePanel.tsx
import { useState } from 'react';
import { Dice6, Coins, Trophy, Zap } from 'lucide-react';

export function MiniGamePanel() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-t border-gray-800 pt-3">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full text-left text-sm font-mono text-[#D4AF37] flex items-center justify-between"
      >
        <span>🎲 JUEGOS RÁPIDOS</span>
        <span>{isOpen ? '▲' : '▼'}</span>
      </button>
      
      {isOpen && (
        <div className="mt-2 grid grid-cols-2 gap-2">
          <button className="bg-black p-2 rounded text-center hover:bg-gray-900 transition-all text-xs">
            <Dice6 size={16} className="mx-auto mb-1" />
            Ruleta
          </button>
          <button className="bg-black p-2 rounded text-center hover:bg-gray-900 transition-all text-xs">
            <Coins size={16} className="mx-auto mb-1" />
            Slots
          </button>
          <button className="bg-black p-2 rounded text-center hover:bg-gray-900 transition-all text-xs">
            <Trophy size={16} className="mx-auto mb-1" />
            Ranking
          </button>
          <button className="bg-black p-2 rounded text-center hover:bg-gray-900 transition-all text-xs">
            <Zap size={16} className="mx-auto mb-1" />
            Retar
          </button>
        </div>
      )}
    </div>
  );
}