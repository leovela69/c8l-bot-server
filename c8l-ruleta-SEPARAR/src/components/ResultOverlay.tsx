"use client";

import { useGameStore } from "@/store/game-store";
import { formatBalance } from "@/lib/economy";
import { getNumberColor } from "@/lib/roulette-engine";

export default function ResultOverlay() {
  const { phase, lastResult } = useGameStore();

  if (phase !== "result" || !lastResult) return null;

  const isWin = lastResult.totalWin > 0;
  const color = getNumberColor(lastResult.number);

  const colorClass =
    color === "red" ? "text-red-500" : color === "green" ? "text-green-500" : "text-white";

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      {/* Result card */}
      <div
        className={`relative glass-panel p-6 flex flex-col items-center gap-3
                    animate-bounce-in ${isWin ? "border-green-500/60" : "border-red-500/30"}`}
        style={{
          animation: "fadeInScale 0.4s ease-out",
        }}
      >
        {/* Number */}
        <div
          className={`w-20 h-20 rounded-full flex items-center justify-center
                     text-3xl font-bold font-numbers border-2 border-casino-gold/60
                     ${color === "red" ? "bg-red-700" : color === "green" ? "bg-green-700" : "bg-gray-900"}`}
        >
          <span className="text-white">{lastResult.number}</span>
        </div>

        {/* Win/Lose text */}
        {isWin ? (
          <div className="text-center">
            <p className="text-green-400 font-game text-lg uppercase">Ganaste!</p>
            <p className="text-casino-goldLight font-game text-2xl font-bold">
              +{formatBalance(lastResult.totalWin)}
            </p>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-red-400 font-game text-lg uppercase">Sin Suerte</p>
            <p className="text-gray-400 font-game text-sm">Intenta de nuevo</p>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes fadeInScale {
          from {
            opacity: 0;
            transform: scale(0.8);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
}
