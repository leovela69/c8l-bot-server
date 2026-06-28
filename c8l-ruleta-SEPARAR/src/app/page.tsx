"use client";

import { useEffect, useState } from "react";
import RouletteWheel from "@/components/RouletteWheel";
import BettingTable from "@/components/BettingTable";
import HistoryPanel from "@/components/HistoryPanel";
import LimitsPanel from "@/components/LimitsPanel";
import ControlBar from "@/components/ControlBar";
import ResultOverlay from "@/components/ResultOverlay";
import { useGameStore } from "@/store/game-store";

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const { phase } = useGameStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-casino-gold font-game text-xl animate-pulse">
          Cargando Mesa...
        </div>
      </div>
    );
  }

  return (
    <main className="relative min-h-screen flex flex-col items-center justify-between py-4 px-4 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 felt-texture" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center w-full max-w-4xl gap-4">
        {/* Top section: Wheel + Side panels */}
        <div className="flex items-center justify-center gap-4 w-full">
          {/* History Panel (Left) */}
          <HistoryPanel />

          {/* Roulette Wheel (Center) */}
          <div className="flex-shrink-0">
            <RouletteWheel />
          </div>

          {/* Limits Panel (Right) */}
          <LimitsPanel />
        </div>

        {/* Betting Table */}
        <div className="w-full max-w-3xl">
          <BettingTable />
        </div>

        {/* Control Bar */}
        <div className="w-full max-w-3xl">
          <ControlBar />
        </div>
      </div>

      {/* Result Overlay */}
      <ResultOverlay />

      {/* Decorative corner ornaments */}
      <div className="fixed top-0 left-0 w-16 h-16 border-t-2 border-l-2 border-casino-gold/30 rounded-br-xl" />
      <div className="fixed top-0 right-0 w-16 h-16 border-t-2 border-r-2 border-casino-gold/30 rounded-bl-xl" />
      <div className="fixed bottom-0 left-0 w-16 h-16 border-b-2 border-l-2 border-casino-gold/30 rounded-tr-xl" />
      <div className="fixed bottom-0 right-0 w-16 h-16 border-b-2 border-r-2 border-casino-gold/30 rounded-tl-xl" />
    </main>
  );
}
