"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  Bet,
  SpinResult,
  spinWheel,
  evaluateAllBets,
  getNumberColor,
} from "@/lib/roulette-engine";
import {
  PlayerState,
  HistoryEntry,
  createNewPlayer,
  isBankrupt,
  canClaimDailyBonus,
  canClaimRecovery,
  claimDailyBonus,
  claimRecovery,
  ECONOMY_CONFIG,
} from "@/lib/economy";

export type GamePhase = "betting" | "spinning" | "result";

interface GameState {
  // Player state
  player: PlayerState;

  // Current game state
  phase: GamePhase;
  currentBets: Bet[];
  lastResult: SpinResult | null;
  selectedChipValue: number;

  // Actions
  placeBet: (bet: Bet) => boolean;
  removeBet: (index: number) => void;
  clearBets: () => void;
  spin: () => void;
  finishSpin: (result: SpinResult) => void;
  setChipValue: (value: number) => void;
  repeatLastBets: () => void;
  claimBonus: () => boolean;
  claimBankruptcyRecovery: () => boolean;
  resetGame: () => void;

  // Computed helpers
  getTotalBetAmount: () => number;
  canSpin: () => boolean;
}

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      player: createNewPlayer(),
      phase: "betting",
      currentBets: [],
      lastResult: null,
      selectedChipValue: 100,

      placeBet: (bet: Bet) => {
        const state = get();
        if (state.phase !== "betting") return false;

        const totalBets = state.getTotalBetAmount() + bet.amount;
        if (totalBets > state.player.balance) return false;
        if (bet.amount < ECONOMY_CONFIG.MIN_BET) return false;
        if (totalBets > ECONOMY_CONFIG.MAX_BET) return false;

        set({ currentBets: [...state.currentBets, bet] });
        return true;
      },

      removeBet: (index: number) => {
        const state = get();
        if (state.phase !== "betting") return;
        const newBets = [...state.currentBets];
        newBets.splice(index, 1);
        set({ currentBets: newBets });
      },

      clearBets: () => {
        const state = get();
        if (state.phase !== "betting") return;
        set({ currentBets: [] });
      },

      spin: () => {
        const state = get();
        if (!state.canSpin()) return;

        const totalBet = state.getTotalBetAmount();

        // Deduct bets from balance
        set({
          phase: "spinning",
          player: {
            ...state.player,
            balance: state.player.balance - totalBet,
            totalBet: state.player.totalBet + totalBet,
            spinsCount: state.player.spinsCount + 1,
          },
        });

        // The actual spin result will be computed after animation
        const result = spinWheel();
        const spinResult = evaluateAllBets(state.currentBets, result);

        // After a delay (animation), call finishSpin
        setTimeout(() => {
          get().finishSpin(spinResult);
        }, 4000); // 4 seconds for spin animation
      },

      finishSpin: (result: SpinResult) => {
        const state = get();
        const historyEntry: HistoryEntry = {
          number: result.number,
          color: result.color,
          timestamp: Date.now(),
        };

        const newHistory = [historyEntry, ...state.player.history].slice(0, 20);

        set({
          phase: "result",
          lastResult: result,
          player: {
            ...state.player,
            balance: state.player.balance + result.totalWin,
            totalWon: state.player.totalWon + result.totalWin,
            totalLost:
              result.totalWin === 0
                ? state.player.totalLost + state.getTotalBetAmount()
                : state.player.totalLost,
            history: newHistory,
          },
        });

        // Auto-transition back to betting after 3 seconds
        setTimeout(() => {
          set({ phase: "betting", currentBets: [] });
        }, 3000);
      },

      setChipValue: (value: number) => {
        set({ selectedChipValue: value });
      },

      repeatLastBets: () => {
        const state = get();
        if (state.phase !== "betting") return;
        if (!state.lastResult) return;

        const lastBets = state.lastResult.betsResults.map((r) => r.bet);
        const totalAmount = lastBets.reduce((sum, b) => sum + b.amount, 0);

        if (totalAmount <= state.player.balance) {
          set({ currentBets: lastBets });
        }
      },

      claimBonus: () => {
        const state = get();
        if (!canClaimDailyBonus(state.player)) return false;
        set({ player: claimDailyBonus(state.player) });
        return true;
      },

      claimBankruptcyRecovery: () => {
        const state = get();
        if (!canClaimRecovery(state.player)) return false;
        set({ player: claimRecovery(state.player) });
        return true;
      },

      resetGame: () => {
        set({
          player: createNewPlayer(),
          phase: "betting",
          currentBets: [],
          lastResult: null,
        });
      },

      getTotalBetAmount: () => {
        return get().currentBets.reduce((sum, bet) => sum + bet.amount, 0);
      },

      canSpin: () => {
        const state = get();
        return (
          state.phase === "betting" &&
          state.currentBets.length > 0 &&
          state.getTotalBetAmount() <= state.player.balance &&
          !isBankrupt(state.player)
        );
      },
    }),
    {
      name: "c8l-ruleta-state",
      partialize: (state) => ({
        player: state.player,
        lastResult: state.lastResult,
      }),
    }
  )
);
