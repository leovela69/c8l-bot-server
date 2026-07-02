"use client";

import { useGameStore } from "@/lib/roulette/game-store";

export default function HUD() {
  const { player, chatOpen } = useGameStore();

  // Calculate win rate
  const totalGames = player.spinsCount || 1;
  const winRate = player.totalWon > 0
    ? ((player.totalWon / (player.totalWon + player.totalLost)) * 100).toFixed(1)
    : "0.0";

  // Calculate session profit
  const profit = player.totalWon - player.totalLost;
  const profitK = (profit / 1000).toFixed(1);

  return (
    <div className={`absolute top-28 flex gap-2 z-30 transition-all duration-300
      ${chatOpen ? "right-[300px]" : "right-3"}`}>
      {/* Win rate */}
      <div className="bg-[#2a2a2a]/80 backdrop-blur-sm border border-white/20 rounded-md px-3 py-1.5 flex flex-col items-center min-w-[60px]">
        <span className="text-[8px] text-gray-500 font-mono uppercase">WIN%</span>
        <span className="text-red-500 font-mono font-bold text-sm">
          {winRate}
        </span>
      </div>

      {/* Profit */}
      <div className="bg-[#2a2a2a]/80 backdrop-blur-sm border border-white/20 rounded-md px-3 py-1.5 flex flex-col items-center min-w-[60px]">
        <span className="text-[8px] text-gray-500 font-mono uppercase">P&L</span>
        <span className={`font-mono font-bold text-sm ${profit >= 0 ? "text-white" : "text-red-500"}`}>
          {profitK}K
        </span>
      </div>

      {/* Spins */}
      <div className="bg-[#2a2a2a]/80 backdrop-blur-sm border border-white/20 rounded-md px-3 py-1.5 flex flex-col items-center min-w-[60px]">
        <span className="text-[8px] text-gray-500 font-mono uppercase">SPINS</span>
        <span className="text-white font-mono font-bold text-sm">
          {player.spinsCount}
        </span>
      </div>
    </div>
  );
}
