"use client";

import React, { useEffect, useRef, useState } from "react";
import RouletteWheel3D from "./3d/RouletteWheel3D";
import BettingTable3D from "./3d/BettingTable3D";
import ControlBar from "./3d/ControlBar";
import ResultOverlay from "./3d/ResultOverlay";
import ChatPanel from "./3d/ChatPanel";
import HUD from "./3d/HUD";
import BotModerator from "./3d/BotModerator";
import PlayersBar from "./3d/PlayersBar";
import PlayerBubbles from "./3d/PlayerBubbles";
import CasinoBackground from "./3d/CasinoBackground";
import { useGameStore } from "@/lib/roulette/game-store";
import { useApp } from "../../context/AppContext";

interface RouletteGameProps {
  compact?: boolean;
}

export default function RouletteGame({ compact = false }: RouletteGameProps) {
  const { c8lCoins, awardCasinoWin, user, language } = useApp();
  const player = useGameStore((s) => s.player);
  const phase = useGameStore((s) => s.phase);
  const lastResult = useGameStore((s) => s.lastResult);
  const initGame = useGameStore((s) => s.initGame);
  const chatOpen = useGameStore((s) => s.chatOpen);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    initGame();
  }, [initGame]);

  // Sync Zustand store player balance with real c8lCoins wallet
  useEffect(() => {
    if (mounted) {
      useGameStore.setState({
        player: {
          ...player,
          balance: c8lCoins,
        },
      });
    }
  }, [c8lCoins, mounted]);

  // Pay out wins on spin completion exactly once
  const processedSpinRef = useRef<string | null>(null);
  useEffect(() => {
    if (phase === "result" && lastResult && mounted) {
      const spinId = `${lastResult.number}_${lastResult.totalWin}_${player.spinsCount}`;
      if (processedSpinRef.current !== spinId) {
        processedSpinRef.current = spinId;
        if (lastResult.totalWin > 0) {
          awardCasinoWin(lastResult.totalWin);
        }

        // Log roulette activity in Supabase
        import("../../utils/analytics")
          .then(({ logActivity }) => {
            if (user) {
              logActivity(
                user.uid,
                user.email || "",
                user.displayName || "Streamer",
                "casino_roulette_3d",
                language === "es"
                  ? `Apostó en la ruleta 3D C8L. Número ganador: ${lastResult.number}. Resultado: ${
                      lastResult.totalWin > 0 ? `Ganó ${lastResult.totalWin} coins` : "Perdió"
                    }`
                  : `Bet on C8L 3D Roulette. Winning number: ${lastResult.number}. Outcome: ${
                      lastResult.totalWin > 0 ? `Won ${lastResult.totalWin} coins` : "Lost"
                    }`
              );
            }
          })
          .catch((err) => console.error("Error logging roulette activity:", err));
      }
    }
  }, [phase, lastResult, player.spinsCount, user, awardCasinoWin, language, mounted]);

  if (!mounted) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-zinc-400">
        <div className="w-10 h-10 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mb-3" />
        <span>Cargando ruleta C8L...</span>
      </div>
    );
  }

  // COMPACT VIEW: Fits inside side tabs or smaller dashboards
  if (compact) {
    return (
      <div className="w-full max-w-4xl mx-auto p-4 bg-zinc-950/60 backdrop-blur-sm border border-white/5 rounded-2xl relative overflow-hidden flex flex-col md:flex-row items-center justify-center gap-6 shadow-2xl">
        <div className="flex flex-col gap-3 max-w-[420px] w-full">
          <BettingTable3D />
          <ControlBar />
        </div>
        <div className="scale-85 md:scale-95 origin-center">
          <RouletteWheel3D />
        </div>
        <ResultOverlay />
      </div>
    );
  }

  // FULL IMMERSIVE VIEW: Standard full-page canvas felt experience
  return (
    <div className="relative min-h-[660px] w-full flex overflow-hidden rounded-3xl border border-white/5 bg-[#030303] shadow-3xl text-left select-none font-sans">
      {/* Immersive Background */}
      <CasinoBackground />

      {/* Croupier assistant bot */}
      <BotModerator />

      {/* Statistics HUD */}
      <HUD />

      {/* Active players bottom list */}
      <PlayersBar />

      {/* Live speech bubbles */}
      <PlayerBubbles />

      {/* Main Felt Canvas */}
      <div
        className={`flex-grow flex items-center justify-center p-6 gap-6 transition-all duration-300 z-10
        ${chatOpen ? "pl-[100px] pr-4" : "pl-[190px] pr-6"}`}
      >
        <div className="relative rounded-2xl p-6 bg-black/45 backdrop-blur-md border-2 border-amber-500/50 shadow-[0_8px_32px_rgba(0,0,0,0.8),0_0_60px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,215,0,0.1)]">
          {/* Inner gold frame lines */}
          <div className="absolute inset-[6px] rounded-xl border border-amber-600/15 pointer-events-none" />
          <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-amber-500/30 rounded-tl-lg" />
          <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-amber-500/30 rounded-tr-lg" />
          <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-amber-500/30 rounded-bl-lg" />
          <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-amber-500/30 rounded-br-lg" />

          {/* felt contents */}
          <div className={`flex flex-col items-center gap-6 xl:gap-8 transition-all duration-300 origin-center
            ${chatOpen ? "2xl:flex-row scale-90" : "xl:flex-row scale-100"}`}>
            <div className="flex flex-col gap-3 max-w-[480px] w-full">
              <BettingTable3D />
              <ControlBar />
            </div>
            <div className="scale-90 origin-center">
              <RouletteWheel3D />
            </div>
          </div>
        </div>
      </div>

      {/* Right panel Croupier Chat */}
      {chatOpen ? (
        <div className="w-72 flex-shrink-0 h-full border-l border-white/10 z-20 transition-all duration-300">
          <ChatPanel />
        </div>
      ) : (
        <ChatPanel />
      )}

      {/* Floating win/lose results */}
      <ResultOverlay />
    </div>
  );
}
