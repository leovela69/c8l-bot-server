"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  Bet,
  SpinResult,
  spinWheel,
  evaluateAllBets,
} from "@/lib/roulette/roulette-engine";
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
} from "@/lib/roulette/economy";
import {
  BotPlayer,
  ChatMessage,
  createBotPlayers,
  generateBotBets,
  getCrupierMessage,
  getCrupierResultMessage,
  getBotBettingMessage,
  getBotReactionMessage,
  createSystemMessage,
  createBotMessage,
  getNarrationMessage,
} from "@/lib/roulette/bot-crupier";
import { audioEngine } from "@/lib/roulette/audio-engine";

export type GamePhase = "betting" | "spinning" | "result";

// Burbuja flotante sobre un jugador
export interface PlayerBubble {
  id: string;
  playerId: string;
  playerName: string;
  playerAvatar: string;
  text: string;
  timestamp: number;
}

interface GameState {
  // Player state
  player: PlayerState;

  // Current game state
  phase: GamePhase;
  currentBets: Bet[];
  lastResult: SpinResult | null;
  selectedChipValue: number;

  // Chat & Bots
  chatMessages: ChatMessage[];
  botPlayers: BotPlayer[];
  initialized: boolean;

  // Chat UI state
  chatOpen: boolean;
  unreadCount: number;
  playerBubbles: PlayerBubble[];

  // Actions
  initGame: () => void;
  placeBet: (bet: Bet) => boolean;
  removeBet: (index: number) => void;
  clearBets: () => void;
  spin: () => void;
  spinComplete: () => void;
  setChipValue: (value: number) => void;
  repeatLastBets: () => void;
  claimBonus: () => boolean;
  claimBankruptcyRecovery: () => boolean;
  resetGame: () => void;
  addChatMessage: (msg: ChatMessage) => void;
  toggleChat: () => void;
  markChatRead: () => void;
  addPlayerBubble: (bubble: PlayerBubble) => void;
  removePlayerBubble: (id: string) => void;

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
      chatMessages: [],
      botPlayers: [],
      initialized: false,
      chatOpen: true,
      unreadCount: 0,
      playerBubbles: [],

      initGame: () => {
        const state = get();
        if (state.initialized) return;

        const bots = createBotPlayers(4);
        const welcomeMsg = createSystemMessage("Mesa abierta. Bienvenidos al C8L Casino.");
        const leonMsg = createBotMessage(bots[0], getCrupierMessage("welcome"));

        set({
          botPlayers: bots,
          chatMessages: [welcomeMsg, leonMsg],
          initialized: true,
        });
      },

      placeBet: (bet: Bet) => {
        const state = get();
        if (state.phase !== "betting") return false;

        const totalBets = state.getTotalBetAmount() + bet.amount;
        if (totalBets > state.player.balance) return false;
        if (bet.amount < ECONOMY_CONFIG.MIN_BET) return false;
        if (totalBets > ECONOMY_CONFIG.MAX_BET * 5) return false;

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

        audioEngine.init();

        const totalBet = state.getTotalBetAmount();

        // Bots place their bets
        const updatedBots = state.botPlayers.map(bot => ({
          ...bot,
          currentBets: generateBotBets(bot, [50, 100, 500, 1000]),
        }));

        // Bot betting messages
        const newMessages = [...state.chatMessages];
        const randomBot = updatedBots[Math.floor(Math.random() * updatedBots.length)];
        newMessages.push(createBotMessage(randomBot, getBotBettingMessage()));

        // Crupier announcement
        const leon = updatedBots.find(b => b.isHouse)!;
        newMessages.push(createBotMessage(leon, getCrupierMessage("spinning")));

        // Compute result now (animation will play, then spinComplete is called)
        const resultNumber = spinWheel();
        const spinResult = evaluateAllBets(state.currentBets, resultNumber);

        set({
          phase: "spinning",
          lastResult: spinResult,
          botPlayers: updatedBots,
          chatMessages: newMessages.slice(-50), // Keep last 50 messages
          player: {
            ...state.player,
            balance: state.player.balance - totalBet,
            totalBet: state.player.totalBet + totalBet,
            spinsCount: state.player.spinsCount + 1,
          },
        });
      },

      spinComplete: () => {
        // Called by RouletteWheel3D when animation finishes
        const state = get();
        if (state.phase !== "spinning" || !state.lastResult) return;

        const result = state.lastResult;
        const historyEntry: HistoryEntry = {
          number: result.number,
          color: result.color,
          timestamp: Date.now(),
        };
        const newHistory = [historyEntry, ...state.player.history].slice(0, 20);

        // Chat messages for result
        const newMessages = [...state.chatMessages];
        const leon = state.botPlayers.find(b => b.isHouse)!;
        newMessages.push(createBotMessage(leon, getCrupierResultMessage(result.number)));

        // Narration of the play (bot explains what happened)
        const narration = getNarrationMessage(state.currentBets, result);
        if (narration) {
          newMessages.push(createBotMessage(leon, narration));
        }

        // Bot reactions
        state.botPlayers.forEach(bot => {
          if (!bot.isHouse && Math.random() > 0.5) {
            const botWon = bot.currentBets.some(b => b.numbers.includes(result.number));
            newMessages.push(createBotMessage(bot, getBotReactionMessage(botWon)));
          }
        });

        // Big win message
        if (result.totalWin > 5000) {
          newMessages.push(createSystemMessage(`🎉 GRAN GANANCIA: +${result.totalWin.toLocaleString()} fichas!`));
          audioEngine.playWin();
        } else if (result.totalWin > 0) {
          audioEngine.playWin();
        } else {
          audioEngine.playLose();
        }

        audioEngine.playCrupierChime();

        // Increment unread if chat is closed
        const unreadIncrement = state.chatOpen ? 0 : newMessages.length - state.chatMessages.length;

        set({
          phase: "result",
          chatMessages: newMessages.slice(-50),
          unreadCount: state.unreadCount + unreadIncrement,
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

        // Auto-transition back to betting (longer pause to appreciate result)
        setTimeout(() => {
          set({ phase: "betting", currentBets: [] });
        }, 5000);
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
        const leon = state.botPlayers.find(b => b.isHouse);
        if (leon) {
          set({
            chatMessages: [...state.chatMessages, createBotMessage(leon, "Bono diario reclamado. A jugar!")],
          });
        }
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
          chatMessages: [],
          initialized: false,
          chatOpen: true,
          unreadCount: 0,
          playerBubbles: [],
        });
      },

      addChatMessage: (msg: ChatMessage) => {
        const state = get();
        const newMessages = [...state.chatMessages, msg].slice(-50);
        const newUnread = state.chatOpen ? 0 : state.unreadCount + 1;
        set({ chatMessages: newMessages, unreadCount: newUnread });

        // If it's a player/bot message (not system), create a bubble
        if (!msg.isSystem && state.phase !== "spinning") {
          const bubble: PlayerBubble = {
            id: msg.id + "_bubble",
            playerId: msg.sender,
            playerName: msg.sender,
            playerAvatar: msg.senderAvatar,
            text: msg.text.length > 60 ? msg.text.substring(0, 57) + "..." : msg.text,
            timestamp: Date.now(),
          };
          const newBubbles = [...state.playerBubbles.filter(b => b.playerId !== msg.sender), bubble];
          set({ playerBubbles: newBubbles });

          // Auto-remove bubble after 6 seconds
          setTimeout(() => {
            const current = get();
            set({ playerBubbles: current.playerBubbles.filter(b => b.id !== bubble.id) });
          }, 6000);
        }
      },

      toggleChat: () => {
        const state = get();
        const newOpen = !state.chatOpen;
        set({ chatOpen: newOpen, unreadCount: newOpen ? 0 : state.unreadCount });
      },

      markChatRead: () => {
        set({ unreadCount: 0 });
      },

      addPlayerBubble: (bubble: PlayerBubble) => {
        const state = get();
        const newBubbles = [...state.playerBubbles.filter(b => b.playerId !== bubble.playerId), bubble];
        set({ playerBubbles: newBubbles });
      },

      removePlayerBubble: (id: string) => {
        const state = get();
        set({ playerBubbles: state.playerBubbles.filter(b => b.id !== id) });
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
      name: "c8l-ruleta-v3",
      partialize: (state) => ({
        player: state.player,
      }),
    }
  )
);
