"use client";
import React, { useState, useRef, useEffect } from "react";
import { useApp } from "../../context/AppContext";
import LionMascot from "../ui/LionMascot";
import { motion } from "framer-motion";
import { Coins, Play, HelpCircle } from "lucide-react";
import { C8LRoulette } from "./C8LRoulette";
import { casinoSounds } from "../../lib/audio/casinoSounds";


const ROULETTE_NUMBERS = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10,
  5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26
];

const RED_NUMBERS = [
  1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36
];

interface RouletteGameProps {
  compact?: boolean;
}

export default function RouletteGame({ compact = false }: RouletteGameProps) {
  const { language, c8lCoins, placeCasinoBet, awardCasinoWin, showNotification, user } = useApp();
  
  const [betAmount, setBetAmount] = useState<number>(50);
  const [betType, setBetType] = useState<"number" | "red" | "black" | "even" | "odd">("number");
  const [selectedNumber, setSelectedNumber] = useState<number>(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [resultNumber, setResultNumber] = useState<number | null>(null);
  const [mascotState, setMascotState] = useState<"idle" | "dance" | "win" | "sad">("idle");
  const [winnings, setWinnings] = useState<number | null>(null);

  const [winningNumber, setWinningNumber] = useState<number | null>(null);

  // Lock scroll during spin
  useEffect(() => {
    const scrollContainer = document.querySelector('.scroll-container') || document.body;
    if (isSpinning) {
      (scrollContainer as HTMLElement).style.overflowY = 'hidden';
    } else {
      (scrollContainer as HTMLElement).style.overflowY = 'auto';
    }
    return () => {
      (scrollContainer as HTMLElement).style.overflowY = 'auto';
    };
  }, [isSpinning]);

  const handlePlay = async () => {
    if (isSpinning) return;

    if (c8lCoins < betAmount) {
      showNotification(
        language === "es" ? "Monedas C8L insuficientes para esta apuesta." : "Insufficient C8L Coins for this bet.",
        "error"
      );
      return;
    }

    // Deduct coins
    const success = await placeCasinoBet(betAmount);
    if (!success) return;

    // Dispatch bet event to increase progressive jackpot
    window.dispatchEvent(new CustomEvent('c8l-jackpot-bet', { detail: { bet: betAmount } }));

    // CSPRNG Random generator for Roulette (RTP 97.3%)
    const randomBuffer = new Uint32Array(1);
    window.crypto.getRandomValues(randomBuffer);
    const randomNumber = randomBuffer[0];
    const generatedWinningNumber = ROULETTE_NUMBERS[randomNumber % 37];

    setWinningNumber(generatedWinningNumber);
    setIsSpinning(true);
    setMascotState("sad"); // strategist looking
    setResultNumber(null);
    setWinnings(null);
  };

  const handleSpinEnd = async (winningNum: number) => {
    setResultNumber(winningNum);
    setIsSpinning(false);
    
    // Calculate win / loss
    let isWin = false;
    let multiplier = 0;

    if (betType === "number") {
      if (selectedNumber === winningNum) {
        isWin = true;
        multiplier = 36; // 35 to 1 payout + original bet return
      }
    } else if (betType === "red") {
      if (winningNum !== 0 && RED_NUMBERS.includes(winningNum)) {
        isWin = true;
        multiplier = 2; // 1 to 1 payout
      }
    } else if (betType === "black") {
      if (winningNum !== 0 && !RED_NUMBERS.includes(winningNum) && winningNum !== 0) {
        isWin = true;
        multiplier = 2;
      }
    } else if (betType === "even") {
      if (winningNum !== 0 && winningNum % 2 === 0) {
        isWin = true;
        multiplier = 2;
      }
    } else if (betType === "odd") {
      if (winningNum !== 0 && winningNum % 2 !== 0) {
        isWin = true;
        multiplier = 2;
      }
    }

    if (isWin) {
      let payout = betAmount * multiplier;

      // Progressive Jackpot award: if winning number is 0 and they bet on it
      if (betType === "number" && selectedNumber === 0 && winningNum === 0) {
        const currentJackpot = parseInt(localStorage.getItem("c8l_jackpot") || "124500", 10);
        const bonus = Math.floor(currentJackpot * 0.15); // 15% jackpot bonus
        payout += bonus;
        
        localStorage.setItem("c8l_jackpot", (currentJackpot - bonus).toString());
        window.dispatchEvent(new CustomEvent('c8l-jackpot-won', { detail: { amount: bonus } }));
        casinoSounds.playJackpotAlert();

        showNotification(
          language === "es"
            ? `🏆 ¡JACKPOT PROGRESIVO! Te llevas un bono de +${bonus} Coins por acertar el 0 dorado!`
            : `🏆 PROGRESSIVE JACKPOT! You won a bonus of +${bonus} Coins for hitting the Golden 0!`,
          "success"
        );
      }

      await awardCasinoWin(payout);
      setWinnings(payout);
      setMascotState("win");
      window.dispatchEvent(new Event('c8l-screen-shake'));
      showNotification(
        language === "es" 
          ? `¡Ganaste! +${payout} Monedas C8L (Número: ${winningNum})`
          : `You Win! +${payout} C8L Coins (Number: ${winningNum})`,
        "success"
      );
    } else {
      setWinnings(0);
      setMascotState("sad");
      showNotification(
        language === "es" 
          ? `Perdiste. El número ganador es ${winningNum}.` 
          : `Loss. The winning number is ${winningNum}.`,
        "error"
      );
    }

    // Log Casino activity
    import("../../utils/analytics").then(({ logActivity }) => {
      if (user) {
        logActivity(
          user.uid,
          user.email || "",
          user.displayName || "Streamer",
          "casino_roulette",
          `Apostó ${betAmount} a ${betType === "number" ? `Número ${selectedNumber}` : betType.toUpperCase()}. Resultado: ${winningNum}. ${isWin ? `Ganó ${betAmount * multiplier} monedas` : "Perdió"}`
        );
      }
    }).catch(() => {});
  };

  return (
    <div className={compact ? "flex flex-col gap-6 max-w-md mx-auto" : "grid grid-cols-1 lg:grid-cols-12 gap-8 items-center max-w-5xl mx-auto"}>
      
      {/* Visual Wheel & Mascot */}
      <div className={compact ? "w-full flex flex-col items-center gap-4" : "lg:col-span-6 flex flex-col items-center gap-6"}>
        
        {/* Mascot state reactive */}
        <div className={`flex justify-center relative items-end ${compact ? "h-[120px]" : "h-[160px]"}`}>
          <LionMascot state={mascotState} size={compact ? 110 : 150} />
          {winnings !== null && winnings > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 10, scale: 0.5 }}
              animate={{ opacity: 1, y: -40, scale: 1 }}
              className="absolute bg-emerald-500 text-black font-heading font-black px-4 py-1.5 rounded-full text-xs box-glow-neon"
            >
              +€{winnings} COINS!
            </motion.div>
          )}
        </div>

        {/* Roulette Wheel canvas */}
        <C8LRoulette
          isSpinning={isSpinning}
          winningNumber={winningNumber}
          onSpinEnd={handleSpinEnd}
        />
      </div>

      {/* Bets Console Panel */}
      <div className={compact 
        ? "w-full mt-4 border-t border-white/10 pt-6 flex flex-col justify-between text-left"
        : "lg:col-span-6 bg-[#0d0d0e]/85 backdrop-blur-md p-8 rounded-3xl border-2 border-[#8A2BE2]/40 shadow-[0_0_25px_rgba(138,43,226,0.25)] hover:border-[#8A2BE2]/70 hover:shadow-[0_0_35px_rgba(138,43,226,0.35)] transition-all duration-300 flex flex-col justify-between h-full text-left"
      }>
        <div className="flex flex-col gap-6">
          <div className="border-b border-white/10 pb-4 mb-2 flex justify-between items-center">
            <div>
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block">Quantum Engine v1.0</span>
              <h3 className="font-heading font-black text-2xl text-[#D4AF37] text-glow-gold uppercase tracking-wider">
                {language === "es" ? "La Ruleta de Vela" : "Vela's Roulette"}
              </h3>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 border-2 border-[#D4AF37]/50 text-xs font-mono text-[#D4AF37] shadow-[0_0_10px_rgba(212,175,55,0.3)] text-glow-gold">
              <Coins size={14} />
              <span className="font-bold">{c8lCoins} Coins</span>
            </div>
          </div>
 
           {/* Selector 1: Bet Amount */}
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
              {language === "es" ? "Cantidad a Apostar" : "Bet Amount (C8L Coins)"}
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[10, 50, 100, 250].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  disabled={isSpinning}
                  onClick={() => setBetAmount(amt)}
                  className={`py-2.5 rounded-lg text-xs font-mono font-bold transition-all duration-200 cursor-pointer ${
                    betAmount === amt
                      ? "bg-gradient-to-r from-[#D4AF37] to-[#FFD700] text-black border-2 border-[#D4AF37] shadow-[0_0_15px_rgba(212,175,55,0.4)] scale-[1.03]"
                      : "bg-black/60 border-2 border-white/5 text-zinc-500 hover:border-[#00F3FF]/50 hover:text-[#00F3FF] hover:shadow-[0_0_8px_rgba(0,243,255,0.2)]"
                  }`}
                >
                  {amt}
                </button>
              ))}
            </div>
          </div>

          {/* Selector 2: Bet Type */}
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
              {language === "es" ? "Tipo de Apuesta" : "Bet Type"}
            </label>
            <div className="grid grid-cols-5 gap-1.5 bg-black/40 p-1.5 rounded-lg border-2 border-[#8A2BE2]/20 text-[9px] uppercase font-heading tracking-wider shadow-[0_0_10px_rgba(138,43,226,0.1)]">
              {[
                { id: "number", label: language === "es" ? "Número" : "Number" },
                { id: "red", label: language === "es" ? "Rojo" : "Red" },
                { id: "black", label: language === "es" ? "Negro" : "Black" },
                { id: "even", label: language === "es" ? "Par" : "Even" },
                { id: "odd", label: language === "es" ? "Impar" : "Odd" }
              ].map((b) => (
                <button
                  key={b.id}
                  type="button"
                  disabled={isSpinning}
                  onClick={() => setBetType(b.id as any)}
                  className={`py-2 rounded text-center cursor-pointer transition-all duration-200 ${
                    betType === b.id
                      ? "bg-[#00F3FF] text-black border-2 border-[#00F3FF] shadow-[0_0_10px_rgba(0,243,255,0.5)] font-bold scale-[1.02]"
                      : "text-zinc-500 hover:text-white"
                  }`}
                >
                  {b.label}
                </button>
              ))}
            </div>
          </div>

          {/* Render selected numbers grid if bet type is "number" */}
          {betType === "number" && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="flex flex-col gap-2"
            >
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                {language === "es" ? "Elige un número (Pago 36x)" : "Choose a number (36x payout)"}
              </label>
              
              <div className="grid grid-cols-6 gap-1 bg-black/40 p-2 rounded-lg border-2 border-[#D4AF37]/20 max-h-[140px] overflow-y-auto pr-1 no-scrollbar font-mono text-[11px] font-bold shadow-[0_0_10px_rgba(212,175,55,0.05)]">
                {ROULETTE_NUMBERS.map((num) => (
                  <button
                    key={num}
                    type="button"
                    disabled={isSpinning}
                    onClick={() => setSelectedNumber(num)}
                    className={`py-1.5 rounded border-2 transition-all duration-200 cursor-pointer ${
                      selectedNumber === num
                        ? "border-[#D4AF37] bg-[#D4AF37] text-black shadow-[0_0_10px_#D4AF37]"
                        : num === 0
                        ? "border-[#D4AF37]/40 bg-[#D4AF37]/5 text-[#D4AF37] hover:border-[#D4AF37]/80 hover:shadow-[0_0_8px_rgba(212,175,55,0.3)]"
                        : RED_NUMBERS.includes(num)
                        ? "border-[#FF0055]/30 bg-[#FF0055]/5 text-[#FF0055] hover:border-[#FF0055]/70 hover:shadow-[0_0_8px_rgba(255,0,85,0.3)]"
                        : "border-[#8A2BE2]/30 bg-[#8A2BE2]/5 text-[#8A2BE2] hover:border-[#8A2BE2]/70 hover:shadow-[0_0_8px_rgba(138,43,226,0.3)]"
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Details message */}
          <div className="bg-black/40 border-2 border-[#8A2BE2]/20 rounded-lg p-4 text-[10px] leading-relaxed text-zinc-400 font-mono shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)]">
            {betType === "number" ? (
              <p>
                {language === "es" 
                  ? `Estás apostando ${betAmount} monedas al Número ${selectedNumber}. Si aciertas, te llevas ${betAmount * 36} monedas. RTP: 97.3%.`
                  : `You are betting ${betAmount} coins on Number ${selectedNumber}. If hit, you gain ${betAmount * 36} coins. RTP: 97.3%.`}
              </p>
            ) : (
              <p>
                {language === "es" 
                  ? `Estás apostando ${betAmount} monedas a color/paridad. Si el número ganador coincide (excepto el 0 Dorado), ganas el doble: ${betAmount * 2} monedas.`
                  : `You are betting ${betAmount} coins on color/parity. If matching winning number (except Golden 0), you gain double: ${betAmount * 2} coins.`}
              </p>
            )}
          </div>
        </div>

        {/* Spin trigger button */}
        <div className="border-t border-white/10 pt-6 mt-8">
          <button
            onClick={handlePlay}
            disabled={isSpinning}
            className="w-full py-4 bg-gradient-to-r from-[#D4AF37] to-[#FFD700] hover:from-[#FFD700] hover:to-white text-black font-heading font-black text-sm uppercase tracking-widest rounded border-2 border-[#D4AF37] shadow-[0_0_20px_rgba(212,175,55,0.4)] hover:shadow-[0_0_30px_rgba(212,175,55,0.7)] hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
          >
            <Play size={14} className={isSpinning ? "animate-spin" : ""} />
            <span>{isSpinning ? (language === "es" ? "GIRANDO..." : "SPINNING...") : (language === "es" ? "GIRAR RULETA" : "SPIN WHEEL")}</span>
          </button>
        </div>
      </div>

    </div>
  );
}
