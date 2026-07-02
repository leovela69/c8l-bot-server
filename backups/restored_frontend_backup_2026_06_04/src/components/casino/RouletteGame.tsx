"use client";
import React, { useState, useRef, useEffect } from "react";
import { useApp } from "../../context/AppContext";
import LionMascot from "../ui/LionMascot";
import { motion } from "framer-motion";
import { Coins, Play, HelpCircle } from "lucide-react";

const ROULETTE_NUMBERS = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10,
  5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26
];

const RED_NUMBERS = [
  1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36
];

export default function RouletteGame() {
  const { language, c8lCoins, addCCoins, deductCCoins, showNotification, user } = useApp();
  
  const [betAmount, setBetAmount] = useState<number>(50);
  const [betType, setBetType] = useState<"number" | "red" | "black" | "even" | "odd">("number");
  const [selectedNumber, setSelectedNumber] = useState<number>(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [resultNumber, setResultNumber] = useState<number | null>(null);
  const [mascotState, setMascotState] = useState<"idle" | "dance" | "win" | "sad">("idle");
  const [winnings, setWinnings] = useState<number | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rotationRef = useRef(0);
  const spinSpeedRef = useRef(0);
  const isSpinningRef = useRef(false);

  // Colors
  const getColor = (num: number) => {
    if (num === 0) return "#D4AF37"; // Golden 0 C8L
    return RED_NUMBERS.includes(num) ? "#EF4444" : "#1A1A1A"; // Red or Black
  };

  // Draw Roulette Wheel on Canvas
  const drawWheel = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const size = canvas.width;
    const center = size / 2;
    const radius = center - 10;
    ctx.clearRect(0, 0, size, size);

    // Save context
    ctx.save();
    ctx.translate(center, center);
    ctx.rotate(rotationRef.current);

    const sliceAngle = (Math.PI * 2) / 37;

    for (let i = 0; i < 37; i++) {
      const num = ROULETTE_NUMBERS[i];
      const startAngle = i * sliceAngle - sliceAngle / 2;
      const endAngle = startAngle + sliceAngle;

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, radius, startAngle, endAngle);
      ctx.fillStyle = getColor(num);
      ctx.fill();
      
      // Border lines
      ctx.strokeStyle = "rgba(255,255,255,0.08)";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Draw text
      ctx.save();
      ctx.rotate(i * sliceAngle);
      ctx.textAlign = "right";
      ctx.textBaseline = "middle";
      ctx.fillStyle = num === 0 ? "#000000" : "#FFFFFF";
      ctx.font = "bold 13px font-mono, Inter";
      ctx.fillText(num.toString(), radius - 15, 0);
      ctx.restore();
    }

    // Outer gold border ring
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.strokeStyle = "#D4AF37";
    ctx.lineWidth = 4;
    ctx.stroke();

    // Center chrome badge
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.35, 0, Math.PI * 2);
    ctx.fillStyle = "#0A0A0C";
    ctx.fill();
    ctx.strokeStyle = "#D4AF37";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw C8L brand inside center
    ctx.fillStyle = "#D4AF37";
    ctx.font = "bold 12px font-heading";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("C8L", 0, 0);

    ctx.restore();

    // Draw fixed top pointer
    ctx.beginPath();
    ctx.moveTo(center, 4);
    ctx.lineTo(center - 10, 24);
    ctx.lineTo(center + 10, 24);
    ctx.closePath();
    ctx.fillStyle = "#D4AF37";
    ctx.fill();
    ctx.strokeStyle = "#FFFFFF";
    ctx.stroke();
  };

  useEffect(() => {
    drawWheel();
  }, []);

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

  // Spin animation loop
  const animateSpin = (targetNumber: number, onComplete: () => void) => {
    isSpinningRef.current = true;
    setIsSpinning(true);
    setMascotState("sad"); // estrategist looking
    setResultNumber(null);
    setWinnings(null);

    // Target angle calculation
    const numIdx = ROULETTE_NUMBERS.indexOf(targetNumber);
    const sliceAngle = (Math.PI * 2) / 37;
    // Align index at fixed top pointer (angle is -PI/2)
    const targetAngle = -Math.PI / 2 - (numIdx * sliceAngle);

    // Speed details
    let currentSpeed = 0.45 + Math.random() * 0.1;
    const deceleration = 0.0018 + Math.random() * 0.0004;

    const tick = () => {
      if (!isSpinningRef.current) return;

      rotationRef.current += currentSpeed;
      currentSpeed -= deceleration;

      if (currentSpeed <= 0) {
        // Snap directly to center of the target index
        rotationRef.current = targetAngle;
        drawWheel();
        isSpinningRef.current = false;
        setIsSpinning(false);
        onComplete();
      } else {
        // Normalize rotation to keep values small
        rotationRef.current = rotationRef.current % (Math.PI * 2);
        drawWheel();
        requestAnimationFrame(tick);
      }
    };

    tick();
  };

  const handlePlay = () => {
    if (isSpinning) return;

    if (c8lCoins < betAmount) {
      showNotification(
        language === "es" ? "Monedas C8L insuficientes para esta apuesta." : "Insufficient C8L Coins for this bet.",
        "error"
      );
      return;
    }

    // Deduct coins
    deductCCoins(betAmount);

    // Dispatch bet event to increase progressive jackpot
    window.dispatchEvent(new CustomEvent('c8l-jackpot-bet', { detail: { bet: betAmount } }));

    // CSPRNG Random generator for Roulette (RTP 97.3%)
    const randomBuffer = new Uint32Array(1);
    window.crypto.getRandomValues(randomBuffer);
    const randomNumber = randomBuffer[0];
    const winningNumber = ROULETTE_NUMBERS[randomNumber % 37];

    animateSpin(winningNumber, () => {
      setResultNumber(winningNumber);
      
      // Calculate win / loss
      let isWin = false;
      let multiplier = 0;

      if (betType === "number") {
        if (selectedNumber === winningNumber) {
          isWin = true;
          multiplier = 36; // 35 to 1 payout + original bet return
        }
      } else if (betType === "red") {
        if (winningNumber !== 0 && RED_NUMBERS.includes(winningNumber)) {
          isWin = true;
          multiplier = 2; // 1 to 1 payout
        }
      } else if (betType === "black") {
        if (winningNumber !== 0 && !RED_NUMBERS.includes(winningNumber) && winningNumber !== 0) {
          isWin = true;
          multiplier = 2;
        }
      } else if (betType === "even") {
        if (winningNumber !== 0 && winningNumber % 2 === 0) {
          isWin = true;
          multiplier = 2;
        }
      } else if (betType === "odd") {
        if (winningNumber !== 0 && winningNumber % 2 !== 0) {
          isWin = true;
          multiplier = 2;
        }
      }

      if (isWin) {
        let payout = betAmount * multiplier;

        // Progressive Jackpot award: if winning number is 0 and they bet on it
        if (betType === "number" && selectedNumber === 0 && winningNumber === 0) {
          const currentJackpot = parseInt(localStorage.getItem("c8l_jackpot") || "124500", 10);
          const bonus = Math.floor(currentJackpot * 0.15); // 15% jackpot bonus
          payout += bonus;
          
          localStorage.setItem("c8l_jackpot", (currentJackpot - bonus).toString());
          window.dispatchEvent(new CustomEvent('c8l-jackpot-won', { detail: { amount: bonus } }));

          showNotification(
            language === "es"
              ? `🏆 ¡JACKPOT PROGRESIVO! Te llevas un bono de +${bonus} Coins por acertar el 0 dorado!`
              : `🏆 PROGRESSIVE JACKPOT! You won a bonus of +${bonus} Coins for hitting the Golden 0!`,
            "success"
          );
        }

        addCCoins(payout);
        setWinnings(payout);
        setMascotState("win");
        showNotification(
          language === "es" 
            ? `¡Ganaste! +${payout} Monedas C8L (Número: ${winningNumber})`
            : `You Win! +${payout} C8L Coins (Number: ${winningNumber})`,
          "success"
        );
      } else {
        setWinnings(0);
        setMascotState("sad");
        showNotification(
          language === "es" 
            ? `Perdiste. El número ganador es ${winningNumber}.` 
            : `Loss. The winning number is ${winningNumber}.`,
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
            `Apostó ${betAmount} a ${betType === "number" ? `Número ${selectedNumber}` : betType.toUpperCase()}. Resultado: ${winningNumber}. ${isWin ? `Ganó ${betAmount * multiplier} monedas` : "Perdió"}`
          );
        }
      }).catch(() => {});
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center max-w-5xl mx-auto">
      
      {/* Visual Wheel & Mascot */}
      <div className="lg:col-span-6 flex flex-col items-center gap-6">
        
        {/* Mascot state reactive */}
        <div className="flex justify-center h-[160px] relative items-end">
          <LionMascot state={mascotState} size={150} />
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
        <div className="relative border-4 border-[var(--color-gold)]/40 p-4 rounded-full bg-black/60 box-glow-gold">
          <canvas
            ref={canvasRef}
            width={320}
            height={320}
            className="block aspect-square w-72 h-72 sm:w-80 sm:h-80"
          />
        </div>
      </div>

      {/* Bets Console Panel */}
      <div className="lg:col-span-6 glass-panel p-8 rounded-3xl bg-black/50 border-white/5 flex flex-col justify-between h-full text-left">
        <div className="flex flex-col gap-6">
          <div className="border-b border-white/5 pb-4 mb-2 flex justify-between items-center">
            <div>
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block">Quantum Engine v1.0</span>
              <h3 className="font-heading font-black text-2xl text-[var(--color-gold)] uppercase tracking-wider">
                {language === "es" ? "La Ruleta de Vela" : "Vela's Roulette"}
              </h3>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black border border-[var(--color-gold)]/30 text-xs font-mono text-[var(--color-gold)]">
              <Coins size={14} />
              <span>{c8lCoins} Coins</span>
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

          {/* Selector 2: Bet Type */}
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
              {language === "es" ? "Tipo de Apuesta" : "Bet Type"}
            </label>
            <div className="grid grid-cols-5 gap-1.5 bg-black/60 p-1 rounded-xl border border-white/10 text-[9px] uppercase font-heading tracking-wider">
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
                  className={`py-2 rounded-lg text-center cursor-pointer transition-all ${
                    betType === b.id
                      ? "bg-[var(--color-gold)] text-black font-bold"
                      : "text-zinc-500 hover:text-zinc-300"
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
              
              <div className="grid grid-cols-6 gap-1 bg-black/60 p-2 rounded-2xl border border-white/5 max-h-[140px] overflow-y-auto pr-1 no-scrollbar font-mono text-[11px] font-bold">
                {ROULETTE_NUMBERS.map((num) => (
                  <button
                    key={num}
                    type="button"
                    disabled={isSpinning}
                    onClick={() => setSelectedNumber(num)}
                    className={`py-1.5 rounded-lg border transition-colors cursor-pointer ${
                      selectedNumber === num
                        ? "border-[var(--color-gold)] bg-[var(--color-gold)] text-black"
                        : num === 0
                        ? "border-[var(--color-gold)]/40 bg-[var(--color-gold)]/10 text-[var(--color-gold)]"
                        : RED_NUMBERS.includes(num)
                        ? "border-red-500/20 bg-red-950/20 text-red-400"
                        : "border-zinc-800 bg-zinc-950 text-zinc-400"
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Details message */}
          <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 text-[10px] leading-relaxed text-zinc-500">
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
        <div className="border-t border-white/5 pt-6 mt-8">
          <button
            onClick={handlePlay}
            disabled={isSpinning}
            className="w-full py-4 bg-[var(--color-gold)] text-black font-heading font-black text-xs uppercase tracking-widest rounded-xl hover:bg-[var(--color-gold-light)] transition-colors box-glow-gold cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
          >
            <Play size={14} className={isSpinning ? "animate-spin" : ""} />
            <span>{isSpinning ? (language === "es" ? "GIRANDO..." : "SPINNING...") : (language === "es" ? "GIRAR RULETA" : "SPIN WHEEL")}</span>
          </button>
        </div>
      </div>

    </div>
  );
}
