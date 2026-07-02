"use client";

import { useGameStore } from "@/lib/roulette/game-store";
import { formatBalance, isBankrupt, canClaimDailyBonus } from "@/lib/roulette/economy";
import { audioEngine } from "@/lib/roulette/audio-engine";
import { useApp } from "../../../context/AppContext";

const CHIP_VALUES = [50, 100, 500, 1000, 5000];

const CHIP_COLORS: Record<number, { bg: string; border: string }> = {
  50: { bg: "bg-red-600", border: "border-red-300" },
  100: { bg: "bg-blue-600", border: "border-blue-300" },
  500: { bg: "bg-emerald-600", border: "border-emerald-300" },
  1000: { bg: "bg-purple-600", border: "border-purple-300" },
  5000: { bg: "bg-zinc-800", border: "border-amber-400" },
};

export default function ControlBar() {
  const {
    player,
    phase,
    selectedChipValue,
    currentBets,
    lastResult,
    spin,
    clearBets,
    repeatLastBets,
    setChipValue,
    canSpin,
    getTotalBetAmount,
    claimBonus,
    claimBankruptcyRecovery,
  } = useGameStore();

  const totalBet = getTotalBetAmount();
  const bankrupt = isBankrupt(player);
  const canBonus = canClaimDailyBonus(player);

  const { placeCasinoBet, showNotification, language, c8lCoins } = useApp();

  const handleSpin = async () => {
    audioEngine.init();
    const totalBet = getTotalBetAmount();

    if (c8lCoins < totalBet) {
      showNotification(
        language === "es" ? "Monedas C8L insuficientes para esta apuesta." : "Insufficient C8L Coins for this bet.",
        "error"
      );
      return;
    }

    const success = await placeCasinoBet(totalBet);
    if (success) {
      spin();
    }
  };

  // Styled round multi-colored casino chips
  const getChipStyle = (value: number) => {
    const isSelected = selectedChipValue === value;
    const colors = CHIP_COLORS[value] || { bg: "bg-teal-500", border: "border-teal-300" };
    return `chip w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-[10px] shadow-lg transition-all duration-200 cursor-pointer
            ${colors.bg} border-2 border-dashed ${colors.border}
            ${isSelected ? "ring-4 ring-amber-400 ring-offset-2 ring-offset-black scale-120 brightness-110 shadow-amber-500/25" : "opacity-60 hover:opacity-95 hover:scale-105"}`;
  };

  return (
    <div className="w-full">
      {/* Chip selector */}
      <div className="flex items-center justify-center gap-2 mb-3">
        {CHIP_VALUES.map((value) => (
          <button
            key={value}
            onClick={() => setChipValue(value)}
            className={getChipStyle(value)}
          >
            {value >= 1000 ? `${value / 1000}K` : value}
          </button>
        ))}
      </div>

      {/* Control strip */}
      <div className="flex items-center justify-between gap-3 bg-[#1a1a1a] rounded-lg p-3 border border-white/10">
        {/* Balance */}
        <div className="flex flex-col items-center min-w-[90px]">
          <span className="text-gray-500 text-[9px] font-mono uppercase">Balance</span>
          <span className="text-white font-mono text-base font-bold">
            {formatBalance(player.balance)}
          </span>
        </div>

        {/* Total bet */}
        <div className="flex flex-col items-center min-w-[70px]">
          <span className="text-gray-500 text-[9px] font-mono uppercase">Bet</span>
          <span className="text-teal-400 font-mono text-base font-bold">
            {formatBalance(totalBet)}
          </span>
        </div>

        {/* SPIN */}
        <button
          onClick={handleSpin}
          disabled={!canSpin()}
          className={`px-8 py-3 rounded-full font-bold text-lg uppercase transition-all
                     ${canSpin()
                       ? "bg-teal-500 text-white hover:bg-teal-400 active:scale-95 shadow-[0_0_15px_rgba(45,212,191,0.3)]"
                       : "bg-gray-800 text-gray-600 cursor-not-allowed"}`}
        >
          {phase === "spinning" ? "..." : phase === "result" ? "OK" : "SPIN"}
        </button>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={repeatLastBets}
            disabled={phase !== "betting" || !lastResult}
            className="px-3 py-2 rounded bg-[#2a2a2a] border border-white/10
                       text-white text-[10px] font-mono
                       hover:bg-[#333] transition-colors
                       disabled:opacity-20 disabled:cursor-not-allowed"
          >
            REPEAT
          </button>
          <button
            onClick={clearBets}
            disabled={phase !== "betting" || currentBets.length === 0}
            className="px-3 py-2 rounded bg-[#2a2a2a] border border-red-900/30
                       text-red-400 text-[10px] font-mono
                       hover:bg-[#333] transition-colors
                       disabled:opacity-20 disabled:cursor-not-allowed"
          >
            CLEAR
          </button>
        </div>
      </div>

      {/* Daily Bonus / Recovery buttons are hidden in real economy mode */}
    </div>
  );
}
