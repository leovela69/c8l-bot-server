"use client";

import { useGameStore } from "@/store/game-store";
import { formatBalance, isBankrupt, canClaimDailyBonus } from "@/lib/economy";

const CHIP_VALUES = [50, 100, 500, 1000, 5000];
const CHIP_COLORS: Record<number, string> = {
  50: "bg-blue-600 border-blue-400",
  100: "bg-green-600 border-green-400",
  500: "bg-red-600 border-red-400",
  1000: "bg-purple-600 border-purple-400",
  5000: "bg-yellow-600 border-yellow-400",
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

  return (
    <div className="w-full">
      {/* Chip selector */}
      <div className="flex items-center justify-center gap-2 mb-3">
        {CHIP_VALUES.map((value) => (
          <button
            key={value}
            onClick={() => setChipValue(value)}
            className={`chip w-11 h-11 flex items-center justify-center
                       text-white font-bold text-[10px] font-game border-2
                       ${CHIP_COLORS[value]}
                       ${selectedChipValue === value
                         ? "ring-2 ring-casino-goldLight ring-offset-2 ring-offset-black scale-110"
                         : "opacity-70"
                       }`}
          >
            {value >= 1000 ? `${value / 1000}K` : value}
          </button>
        ))}
      </div>

      {/* Main control area */}
      <div className="flex items-center justify-between gap-3 bg-casino-carbon/80 rounded-xl p-3 gold-border">
        {/* Balance */}
        <div className="flex flex-col items-center min-w-[100px]">
          <span className="text-gray-400 font-game text-[8px] uppercase">Saldo</span>
          <span className="text-casino-goldLight font-game text-lg font-bold">
            {formatBalance(player.balance)}
          </span>
        </div>

        {/* Total bet */}
        <div className="flex flex-col items-center min-w-[100px]">
          <span className="text-gray-400 font-game text-[8px] uppercase">Apuesta Total</span>
          <span className="text-white font-game text-lg font-bold">
            {formatBalance(totalBet)}
          </span>
        </div>

        {/* Spin button */}
        <button
          onClick={spin}
          disabled={!canSpin()}
          className={`px-8 py-3 rounded-full font-game text-lg font-bold uppercase
                     transition-all duration-200
                     ${canSpin()
                       ? "bg-gradient-to-b from-green-500 to-green-700 text-white btn-glow"
                       : "bg-gray-700 text-gray-500 cursor-not-allowed"
                     }`}
        >
          {phase === "spinning" ? "..." : "GIRAR"}
        </button>

        {/* Repeat & Favorite */}
        <div className="flex gap-2">
          <button
            onClick={repeatLastBets}
            disabled={phase !== "betting" || !lastResult}
            className="flex items-center gap-1 px-3 py-2 rounded-lg
                       bg-casino-carbon border border-casino-gold/30
                       text-casino-gold font-game text-[10px] uppercase
                       hover:border-casino-gold/60 transition-colors
                       disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
            </svg>
            Repetir
          </button>

          <button
            onClick={clearBets}
            disabled={phase !== "betting" || currentBets.length === 0}
            className="flex items-center gap-1 px-3 py-2 rounded-lg
                       bg-casino-carbon border border-red-900/30
                       text-red-400 font-game text-[10px] uppercase
                       hover:border-red-700/60 transition-colors
                       disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            Borrar
          </button>
        </div>
      </div>

      {/* Bankruptcy / Bonus panel */}
      {(bankrupt || canBonus) && (
        <div className="mt-2 flex items-center justify-center gap-3">
          {bankrupt && (
            <button
              onClick={claimBankruptcyRecovery}
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-amber-600 to-amber-800
                         text-white font-game text-xs uppercase
                         hover:from-amber-500 hover:to-amber-700 transition-all"
            >
              Reclamar Recuperacion
            </button>
          )}
          {canBonus && (
            <button
              onClick={claimBonus}
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-green-600 to-green-800
                         text-white font-game text-xs uppercase
                         hover:from-green-500 hover:to-green-700 transition-all"
            >
              Bono Diario +25K
            </button>
          )}
        </div>
      )}
    </div>
  );
}
