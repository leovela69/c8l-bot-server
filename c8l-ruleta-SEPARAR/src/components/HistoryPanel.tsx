"use client";

import { useGameStore } from "@/store/game-store";
import { getNumberColor } from "@/lib/roulette-engine";

export default function HistoryPanel() {
  const { player } = useGameStore();

  const getColorClass = (color: string) => {
    switch (color) {
      case "red":
        return "bg-red-700 text-white";
      case "black":
        return "bg-gray-900 text-white";
      case "green":
        return "bg-green-700 text-white";
      default:
        return "bg-gray-600 text-white";
    }
  };

  return (
    <div className="glass-panel p-3 w-20 flex flex-col items-center">
      {/* Title */}
      <h3 className="text-casino-gold font-game text-[9px] text-center mb-2 uppercase tracking-wider leading-tight">
        Ultimos<br />Numeros
      </h3>

      {/* Number list */}
      <div className="flex flex-col gap-1.5 overflow-y-auto max-h-[260px] w-full">
        {player.history.length === 0 ? (
          <p className="text-gray-500 text-[8px] text-center font-game">
            Sin historial
          </p>
        ) : (
          player.history.slice(0, 10).map((entry, idx) => (
            <div
              key={idx}
              className={`w-full h-7 rounded flex items-center justify-center
                         font-bold text-sm font-numbers ${getColorClass(entry.color)}
                         border border-casino-gold/20`}
            >
              {entry.number}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
