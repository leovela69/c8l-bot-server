"use client";

import { ECONOMY_CONFIG } from "@/lib/economy";

export default function LimitsPanel() {
  return (
    <div className="glass-panel p-3 w-28 flex flex-col items-center justify-center">
      {/* Title */}
      <h3 className="text-casino-gold font-game text-[9px] text-center mb-3 uppercase tracking-wider">
        Apuestas
      </h3>

      {/* Min */}
      <div className="text-center mb-2">
        <span className="text-gray-400 font-game text-[8px] uppercase">Min</span>
        <p className="text-casino-goldLight font-game text-sm font-bold">
          {ECONOMY_CONFIG.MIN_BET.toLocaleString()}
        </p>
      </div>

      {/* Max */}
      <div className="text-center">
        <span className="text-gray-400 font-game text-[8px] uppercase">Max</span>
        <p className="text-casino-goldLight font-game text-sm font-bold">
          {ECONOMY_CONFIG.MAX_BET.toLocaleString()}
        </p>
      </div>
    </div>
  );
}
