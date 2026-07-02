"use client";

import { useGameStore } from "@/lib/roulette/game-store";
import { formatBalance } from "@/lib/roulette/economy";

export default function ResultOverlay() {
  const { phase, lastResult } = useGameStore();

  if (phase !== "result" || !lastResult) return null;

  const isWin = lastResult.totalWin > 0;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none">
      <div className="absolute inset-0 bg-black/30" />

      <div
        className="relative flex flex-col items-center gap-3 p-6 rounded-xl bg-[#1a1a1a]/90 border border-white/10"
        style={{ animation: "popIn 0.3s ease-out" }}
      >
        {isWin ? (
          <>
            <p className="text-teal-400 font-mono text-sm uppercase tracking-wider">YOU WIN</p>
            <p className="text-white font-mono text-3xl font-bold">
              +{formatBalance(lastResult.totalWin)}
            </p>
          </>
        ) : (
          <>
            <p className="text-red-400 font-mono text-sm uppercase tracking-wider">NO LUCK</p>
            <p className="text-gray-500 font-mono text-xs">Try again</p>
          </>
        )}
      </div>

      <style jsx>{`
        @keyframes popIn {
          from { opacity: 0; transform: scale(0.8); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
