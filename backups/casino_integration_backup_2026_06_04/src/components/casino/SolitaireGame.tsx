"use client";
import React, { useState, useEffect, useRef } from "react";
import { useApp } from "../../context/AppContext";
import LionMascot from "../ui/LionMascot";
import { motion, AnimatePresence } from "framer-motion";
import { Coins, ShieldAlert, RotateCw, Play, CheckCircle } from "lucide-react";

interface Card {
  suit: "H" | "D" | "C" | "S"; // Hearts, Diamonds, Clubs, Spades
  value: number; // 1 (Ace) to 13 (King)
  label: string;
}

const SUITS = [
  { key: "H", symbol: "♥", color: "#EF4444", name: "Corazones" },
  { key: "D", symbol: "♦", color: "#EF4444", name: "Diamantes" },
  { key: "C", symbol: "♣", color: "#FFFFFF", name: "Tréboles" },
  { key: "S", symbol: "♠", color: "#FFFFFF", name: "Picas" }
];

export default function SolitaireGame() {
  const { language, c8lCoins, placeCasinoBet, awardCasinoWin, showNotification, user } = useApp();

  const [betAmount, setBetAmount] = useState<number>(50);
  const [isPlaying, setIsPlaying] = useState(false);
  const [deck, setDeck] = useState<Card[]>([]);
  const [currentCard, setCurrentCard] = useState<Card | null>(null);
  const [foundations, setFoundations] = useState<Record<string, number>>({
    H: 0, // Last placed value (starts at 0, next is 1 = Ace)
    D: 0,
    C: 0,
    S: 0
  });
  
  const [score, setScore] = useState(0);
  const [cheated, setCheated] = useState(false);
  const [mascotState, setMascotState] = useState<"idle" | "dance" | "win" | "sad">("idle");

  // Latency tracking for Anti-cheat
  const clickTimestampsRef = useRef<number[]>([]);
  const inputLatencyThreshold = 180; // ms minimum average to flag bots

  // Initialize and Shuffle Deck using Fisher-Yates
  const createShuffledDeck = (): Card[] => {
    const newDeck: Card[] = [];
    const suitKeys: ("H" | "D" | "C" | "S")[] = ["H", "D", "C", "S"];
    
    suitKeys.forEach(suit => {
      for (let val = 1; val <= 13; val++) {
        let label = val.toString();
        if (val === 1) label = "A";
        else if (val === 11) label = "J";
        else if (val === 12) label = "Q";
        else if (val === 13) label = "K";
 
        newDeck.push({ suit, value: val, label });
      }
    });

    // Fisher-Yates Shuffle
    for (let i = newDeck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = newDeck[i];
      newDeck[i] = newDeck[j];
      newDeck[j] = temp;
    }

    return newDeck;
  };

  const handleStartGame = async () => {
    if (c8lCoins < betAmount) {
      showNotification(
        language === "es" ? "Monedas C8L insuficientes para iniciar el solitario." : "Insufficient C8L Coins to start solitaire.",
        "error"
      );
      return;
    }

    const success = await placeCasinoBet(betAmount);
    if (!success) return;
    setCheated(false);
    clickTimestampsRef.current = [];

    const shuffled = createShuffledDeck();
    const firstCard = shuffled.pop() || null;

    setDeck(shuffled);
    setCurrentCard(firstCard);
    setFoundations({ H: 0, D: 0, C: 0, S: 0 });
    setScore(0);
    setIsPlaying(true);
    setMascotState("idle");
    
    showNotification(
      language === "es" ? "Partida iniciada. ¡Organiza las cartas en orden ascendente (A a K)!" : "Match started. Sort cards in ascending order (A to K)!",
      "success"
    );

    // Log activity
    import("../../utils/analytics").then(({ logActivity }) => {
      if (user) {
        logActivity(
          user.uid,
          user.email || "",
          user.displayName || "Streamer",
          "casino_solitaire",
          `Apostó ${betAmount} al iniciar una partida de Solitario Royal.`
        );
      }
    }).catch(() => {});
  };

  const trackInputLatency = (): boolean => {
    const now = Date.now();
    const times = clickTimestampsRef.current;
    times.push(now);

    // Only analyze when we have at least 4 intervals (5 clicks)
    if (times.length >= 5) {
      // Calculate intervals
      const intervals: number[] = [];
      for (let i = 1; i < times.length; i++) {
        intervals.push(times[i] - times[i - 1]);
      }

      // Check average latency
      const sum = intervals.reduce((acc, curr) => acc + curr, 0);
      const avg = sum / intervals.length;

      // Check variance (bots have perfect static latency intervals e.g. exactly 100ms with 0ms variance)
      const variance = intervals.reduce((acc, curr) => acc + Math.pow(curr - avg, 2), 0) / intervals.length;

      // Bot rules: 
      // 1. Clicks too fast (avg < 180ms)
      // 2. Latency variance is near zero (perfect click intervals < 5ms variance) indicating automated bot execution
      if (avg < inputLatencyThreshold || (variance < 10 && avg < 300)) {
        setCheated(true);
        setIsPlaying(false);
        setMascotState("sad");
        showNotification(
          language === "es" 
            ? "⚠️ ANTITRAMPAS: Latencia de entrada no humana detectada. Partida anulada." 
            : "⚠️ ANTI-CHEAT: Non-human input latency detected. Match voided.",
          "error"
        );

        // Log cheating activity
        import("../../utils/analytics").then(({ logActivity }) => {
          if (user) {
            logActivity(
              user.uid,
              user.email || "",
              user.displayName || "Streamer",
              "solitaire_anti_cheat",
              `Flagged for cheating in Solitaire (Avg latency: ${avg.toFixed(1)}ms, Variance: ${variance.toFixed(1)})`
            );
          }
        }).catch(() => {});

        return true;
      }

      // Keep array size capped
      if (times.length > 8) {
        times.shift();
      }
    }
    return false;
  };

  const handlePlaceInFoundation = async (suitKey: string) => {
    if (!isPlaying || !currentCard || cheated) return;

    // Run security anti-cheat check
    const isBot = trackInputLatency();
    if (isBot) return;

    const expectedValue = foundations[suitKey] + 1;

    // Check if correct suit and correct sequential value
    if (currentCard.suit === suitKey && currentCard.value === expectedValue) {
      // Correct placement!
      const updatedFoundations = { ...foundations, [suitKey]: expectedValue };
      setFoundations(updatedFoundations);
      
      // Earn C8L Coins directly per card sorted (e.g. 10 coins)
      await awardCasinoWin(10);
      setScore(prev => prev + 1);
      setMascotState("dance");

      // Draw next card
      const remainingDeck = [...deck];
      const nextCard = remainingDeck.pop() || null;
      setDeck(remainingDeck);
      setCurrentCard(nextCard);

      // Check for win condition (Sorted all 52 cards)
      const allDone = Object.values(updatedFoundations).every(val => val === 13);
      if (allDone || nextCard === null) {
        setIsPlaying(false);
        const jackpotReward = betAmount * 10;
        await awardCasinoWin(jackpotReward);
        setMascotState("win");
        showNotification(
          language === "es" 
            ? `🏆 ¡JACKPOT SOLITARIO! Completaste el juego. Recompensa: +${jackpotReward} Monedas C8L.` 
            : `🏆 SOLITAIRE JACKPOT! You cleared the board. Reward: +${jackpotReward} C8L Coins.`,
          "success"
        );

        // Log win activity
        import("../../utils/analytics").then(({ logActivity }) => {
          if (user) {
            logActivity(
              user.uid,
              user.email || "",
              user.displayName || "Streamer",
              "solitaire_win",
              `Completed Solitaire sorting deck! Jackpot payout: ${jackpotReward}`
            );
          }
        }).catch(() => {});
      }
    } else {
      // Incorrect sort!
      setMascotState("sad");
      showNotification(
        language === "es" 
          ? `Movimiento inválido. El mazo ${suitKey} requiere un ${expectedValue === 1 ? "As (A)" : expectedValue}.`
          : `Invalid move. Foundation ${suitKey} expects a ${expectedValue === 1 ? "Ace (A)" : expectedValue}.`,
        "error"
      );

      // Card goes to bottom of deck if incorrect placement (penalty)
      const updatedDeck = [currentCard, ...deck];
      // Draw next card
      const remainingDeck = [...updatedDeck];
      const nextCard = remainingDeck.pop() || null;
      setDeck(remainingDeck);
      setCurrentCard(nextCard);
    }
  };

  const getSuitSymbol = (suitKey: string) => {
    return SUITS.find(s => s.key === suitKey)?.symbol || "";
  };

  const getSuitColor = (suitKey: string) => {
    return SUITS.find(s => s.key === suitKey)?.color || "";
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center max-w-5xl mx-auto">
      
      {/* Visual board */}
      <div className="lg:col-span-7 flex flex-col gap-6">
        
        {/* Foundations (Mazos base) */}
        <div className="grid grid-cols-4 gap-4">
          {SUITS.map((suit) => {
            const val = foundations[suit.key];
            const displayLabel = val === 0 ? "" : val === 1 ? "A" : val === 11 ? "J" : val === 12 ? "Q" : val === 13 ? "K" : val.toString();

            return (
              <button
                key={suit.key}
                disabled={!isPlaying}
                onClick={() => handlePlaceInFoundation(suit.key)}
                className={`aspect-[2/3] rounded-xl border flex flex-col justify-between p-3 relative transition-all duration-300 cursor-pointer ${
                  isPlaying 
                    ? "hover:border-[var(--color-gold)] hover:scale-105 active:scale-95 bg-black/40 border-white/10" 
                    : "bg-white/[0.01] border-white/5 cursor-not-allowed"
                }`}
              >
                <div className="flex justify-between items-start text-xs font-bold w-full">
                  <span style={{ color: suit.color }}>{suit.symbol}</span>
                  <span className="text-zinc-500 font-mono text-[9px] uppercase tracking-wider">{suit.name.substring(0, 3)}</span>
                </div>

                <div className="text-center font-heading font-black text-2xl" style={{ color: suit.color }}>
                  {val > 0 ? `${displayLabel}${suit.symbol}` : suit.symbol}
                </div>

                <div className="text-[9px] font-mono text-zinc-600 text-center w-full uppercase">
                  {val === 13 ? "Completo" : `Prox: ${val === 0 ? "A" : val === 12 ? "K" : val + 1}`}
                </div>
              </button>
            );
          })}
        </div>

        {/* Play piles / Current dealt card */}
        <div className="flex justify-center items-center gap-12 py-8 bg-[#0a0a0c] border border-white/5 rounded-3xl relative overflow-hidden box-glow-neon">
          
          {/* Deck pile */}
          <div className="flex flex-col items-center gap-2">
            <div className={`w-20 aspect-[2/3] rounded-xl border flex items-center justify-center relative ${
              deck.length > 0 ? "bg-gradient-to-br from-[var(--color-gold)] to-[#9A7B1C] border-[var(--color-gold)] box-glow-gold" : "bg-zinc-950 border-zinc-800 border-dashed"
            }`}>
              {deck.length > 0 ? (
                <div className="text-black font-heading font-black text-base uppercase select-none">C8L</div>
              ) : (
                <span className="text-zinc-600 text-xs">Vacio</span>
              )}
            </div>
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">{deck.length} cartas</span>
          </div>

          {/* Current Card */}
          <div className="flex flex-col items-center gap-2">
            <AnimatePresence mode="wait">
              {currentCard ? (
                <motion.div
                  key={`${currentCard.suit}-${currentCard.value}`}
                  initial={{ opacity: 0, scale: 0.8, x: -30 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.8, x: 30 }}
                  className="w-20 aspect-[2/3] rounded-xl border border-white/20 bg-zinc-900 flex flex-col justify-between p-3 relative box-glow-neon"
                >
                  <div className="text-xs font-bold" style={{ color: getSuitColor(currentCard.suit) }}>
                    {currentCard.label}
                  </div>
                  <div className="text-center font-heading font-black text-3xl" style={{ color: getSuitColor(currentCard.suit) }}>
                    {getSuitSymbol(currentCard.suit)}
                  </div>
                  <div className="text-right text-xs font-bold" style={{ color: getSuitColor(currentCard.suit) }}>
                    {currentCard.label}
                  </div>
                </motion.div>
              ) : (
                <div className="w-20 aspect-[2/3] rounded-xl border border-zinc-800 border-dashed flex items-center justify-center">
                  <span className="text-zinc-600 text-[10px]">Sin Carta</span>
                </div>
              )}
            </AnimatePresence>
            <span className="text-[10px] font-mono text-[var(--color-gold)] uppercase tracking-widest font-bold">Activa</span>
          </div>
        </div>

      </div>

      {/* Controller & Mascot */}
      <div className="lg:col-span-5 glass-panel p-8 rounded-3xl bg-black/50 border-white/5 flex flex-col justify-between h-full text-left">
        
        <div className="flex flex-col gap-6">
          <div className="border-b border-white/5 pb-4 mb-2 flex justify-between items-center">
            <div>
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block">Klondike Engine v2.0</span>
              <h3 className="font-heading font-black text-2xl text-[var(--color-gold)] uppercase tracking-wider">
                Solitario Royal
              </h3>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black border border-[var(--color-gold)]/30 text-xs font-mono text-[var(--color-gold)]">
              <Coins size={14} />
              <span>{c8lCoins} Coins</span>
            </div>
          </div>

          {/* Mascot feedback */}
          <div className="flex justify-center h-[120px] items-end">
            <LionMascot state={mascotState} size={110} />
          </div>

          {/* Bet size */}
          {!isPlaying && (
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                {language === "es" ? "Monedas a Apostar" : "Coins to Bet"}
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[10, 50, 100, 200].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setBetAmount(amt)}
                    className={`py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                      betAmount === amt
                        ? "bg-[var(--color-gold)] text-black box-glow-gold"
                        : "bg-white/5 border border-white/10 text-zinc-400 hover:text-white"
                    }`}
                  >
                    {amt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Metrics */}
          {isPlaying && (
            <div className="grid grid-cols-2 gap-4 text-center font-mono">
              <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl">
                <span className="text-[9px] text-zinc-500 block uppercase">Cartas Ordenadas</span>
                <strong className="text-xl text-[var(--color-gold)] font-bold">{score} / 52</strong>
              </div>
              <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl">
                <span className="text-[9px] text-zinc-500 block uppercase">Monedas Ganadas</span>
                <strong className="text-xl text-emerald-400 font-bold">+{score * 10} CC</strong>
              </div>
            </div>
          )}

          {/* Security anti cheat badge */}
          <div className="bg-red-500/5 border border-red-500/15 rounded-xl p-4 flex gap-3 items-start">
            <ShieldAlert className="text-red-500 flex-shrink-0 mt-0.5" size={16} />
            <div className="text-[10px] leading-relaxed text-zinc-500">
              <strong className="text-red-400 font-semibold block uppercase tracking-wider mb-1">Mecanismo Anti-Fraude Activo</strong>
              {language === "es"
                ? "Este juego registra los intervalos de latencia de entrada. Clicks instantáneos o patrones de automatización perfectos anularán los pagos y bloquearán el juego."
                : "This game monitors input latency variance. Instant click intervals or automated bot scripts will void payouts and lock the system."}
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="border-t border-white/5 pt-6 mt-8">
          {isPlaying ? (
            <div className="bg-zinc-900 border border-white/5 p-4 rounded-xl text-center text-xs font-semibold text-zinc-400 uppercase font-mono tracking-wider">
              🎮 Partida en curso
            </div>
          ) : (
            <button
              onClick={handleStartGame}
              className="w-full py-4 bg-[var(--color-gold)] text-black font-heading font-black text-xs uppercase tracking-widest rounded-xl hover:bg-[var(--color-gold-light)] transition-colors box-glow-gold cursor-pointer flex items-center justify-center gap-2"
            >
              <Play size={14} />
              <span>{language === "es" ? "APOSTAR E INICIAR" : "BET & START"}</span>
            </button>
          )}
        </div>

      </div>

    </div>
  );
}
