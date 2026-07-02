"use client";
import React, { useState, useEffect, useRef } from "react";
import { useApp } from "../../context/AppContext";
import LionMascot from "../ui/LionMascot";
import { motion } from "framer-motion";
import { Coins, Play, HelpCircle, Trophy } from "lucide-react";

interface Horse {
  id: number;
  name: string;
  color: string;
  odds: number; // calculated odds
  betVolume: number; // simulated other bets
  progress: number; // 0 to 100
  finished: boolean;
  baseWeight: number;
  finishTime?: number;
}

const INITIAL_HORSES = [
  { id: 1, name: "Leo Vela Express", color: "#EF4444", baseWeight: 1.1 },
  { id: 2, name: "Corazones Locos", color: "#F59E0B", baseWeight: 1.2 },
  { id: 3, name: "Madrid Hype", color: "#10B981", baseWeight: 1.0 },
  { id: 4, name: "Astro Vela", color: "#3B82F6", baseWeight: 1.05 },
  { id: 5, name: "Dembow Rider", color: "#EC4899", baseWeight: 1.15 },
  { id: 6, name: "Quantum Cyber", color: "#8B5CF6", baseWeight: 0.95 },
  { id: 7, name: "Ibiza Groove", color: "#06B6D4", baseWeight: 1.0 },
  { id: 8, name: "Vela Gold", color: "#D4AF37", baseWeight: 1.25 }
];

const getPlatformIcon = (platform: string) => {
  switch (platform) {
    case "youtube":
      return "🔴";
    case "twitch":
      return "🟣";
    case "tiktok":
      return "⚫";
    case "starmaker":
      return "⭐";
    case "kips":
      return "🔵";
    default:
      return "✨";
  }
};

export default function DerbyGame() {
  const { language, c8lCoins, addCCoins, deductCCoins, showNotification, user } = useApp();

  const [betAmount, setBetAmount] = useState<number>(50);
  const [selectedHorseId, setSelectedHorseId] = useState<number>(1);
  const [horses, setHorses] = useState<Horse[]>([]);
  const [isRacing, setIsRacing] = useState(false);
  const [raceFinished, setRaceFinished] = useState(false);
  const [winner, setWinner] = useState<Horse | null>(null);
  const [winnings, setWinnings] = useState<number | null>(null);
  const [mascotState, setMascotState] = useState<"idle" | "dance" | "win" | "sad">("idle");

  const raceRef = useRef<boolean>(false);
  const animationFrameIdRef = useRef<number | null>(null);

  // Initialize horses and calculate dynamic odds using Simulated Mutuo (pool betting)
  const initializeDerby = () => {
    // Generate random simulated bet volumes for the other horses
    const poolBets = INITIAL_HORSES.map(h => {
      const simulatedVolume = Math.floor(Math.random() * 2500) + 500;
      return { ...h, betVolume: simulatedVolume };
    });

    // Total pool
    const totalPool = poolBets.reduce((acc, curr) => acc + curr.betVolume, 0);

    // Calculate odds (Pool / Horse Volume * (1 - House Edge of 2.7%))
    const calculated = poolBets.map(h => {
      const rawOdds = totalPool / h.betVolume;
      // Adjust odds with a multiplier to scale nicely and respect RTP limits (House edge 2.7%)
      const adjustedOdds = Math.max(1.5, Math.min(15, Number((rawOdds * 0.973).toFixed(2))));
      return {
        ...h,
        odds: adjustedOdds,
        progress: 0,
        finished: false
      } as Horse;
    });

    setHorses(calculated);
    setWinner(null);
    setRaceFinished(false);
    setWinnings(null);
    setMascotState("idle");
  };

  useEffect(() => {
    initializeDerby();
    return () => {
      if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current);
    };
  }, []);

  const handleStartRace = () => {
    if (isRacing) return;

    if (c8lCoins < betAmount) {
      showNotification(
        language === "es" ? "Monedas C8L insuficientes para apostar en el Derby." : "Insufficient C8L Coins to bet on the Derby.",
        "error"
      );
      return;
    }

    deductCCoins(betAmount);
    setIsRacing(true);
    raceRef.current = true;
    setMascotState("sad"); // estrategist face

    // Reset progress
    setHorses(prev => prev.map(h => ({ ...h, progress: 0, finished: false, finishTime: undefined })));

    let startTime = Date.now();
    const finishedHorses: Horse[] = [];

    const raceLoop = () => {
      if (!raceRef.current) return;

      setHorses(prevHorses => {
        let allFinished = true;
        const updated = prevHorses.map(h => {
          if (h.finished) return h;

          allFinished = false;

          // Brownian Motion speed calculation
          // Position_t = Position_t-1 + (BaseWeight * LuckFactor)
          const luckFactor = Math.random() * 0.95 + 0.1; // Random factor
          const speed = (h.baseWeight * luckFactor) * 0.95;
          const newProgress = Math.min(100, h.progress + speed);
          const finished = newProgress >= 100;

          if (finished) {
            const time = Date.now() - startTime;
            const completedHorse = { ...h, progress: 100, finished, finishTime: time };
            finishedHorses.push(completedHorse);
            return completedHorse;
          }

          return { ...h, progress: newProgress };
        });

        // Check if race ends
        if (allFinished) {
          raceRef.current = false;
          setIsRacing(false);
          setRaceFinished(true);

          // Find winner (shortest finish time)
          const sorted = [...finishedHorses].sort((a, b) => (a.finishTime || 99999) - (b.finishTime || 99999));
          const winningHorse = sorted[0];
          setWinner(winningHorse);

          // Payout check
          const won = winningHorse.id === selectedHorseId;
          if (won) {
            const payout = Math.floor(betAmount * winningHorse.odds);
            addCCoins(payout);
            setWinnings(payout);
            setMascotState("win");
            showNotification(
              language === "es"
                ? `🏆 ¡Victoria! ${winningHorse.name} ganó la carrera. Recompensa: +${payout} Monedas C8L.`
                : `🏆 Victory! ${winningHorse.name} won the race. Reward: +${payout} C8L Coins.`,
              "success"
            );
          } else {
            setWinnings(0);
            setMascotState("sad");
            showNotification(
              language === "es"
                ? `Derrota. El ganador es ${winningHorse.name}.`
                : `Loss. The winner is ${winningHorse.name}.`,
              "error"
            );
          }

          // Log activity
          import("../../utils/analytics").then(({ logActivity }) => {
            if (user) {
              logActivity(
                user.uid,
                user.email || "",
                user.displayName || "Streamer",
                "casino_derby",
                `Apostó ${betAmount} al caballo "${prevHorses.find(h => h.id === selectedHorseId)?.name}". Ganador: ${winningHorse.name} (${winningHorse.odds} odds). ${won ? `Ganó ${Math.floor(betAmount * winningHorse.odds)}` : "Perdió"}`
              );
            }
          }).catch(() => {});

          return updated;
        }

        return updated;
      });

      if (raceRef.current) {
        animationFrameIdRef.current = requestAnimationFrame(raceLoop);
      }
    };

    animationFrameIdRef.current = requestAnimationFrame(raceLoop);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center max-w-5xl mx-auto">
      
      {/* Racing Track (Visual progress bars) */}
      <div className="lg:col-span-7 flex flex-col gap-4">
        
        {/* Track Box */}
        <div className="bg-[#08080a] border border-white/10 rounded-3xl p-6 relative box-glow-neon flex flex-col gap-3 font-mono">
          <div className="flex justify-between items-center text-[10px] text-zinc-500 uppercase tracking-widest border-b border-white/5 pb-2">
            <span>Caballo / Streamer</span>
            <span className="flex items-center gap-1"><Trophy size={10} /> Finish Line</span>
          </div>

          <div className="space-y-3 relative">
            {/* Finish line line */}
            <div className="absolute right-10 top-0 bottom-0 w-1 border-r border-dashed border-red-500/40 z-0"></div>

            {horses.map((horse) => {
              const isSelected = horse.id === selectedHorseId;
              const isWinner = winner && winner.id === horse.id;

              return (
                <div key={horse.id} className="flex flex-col gap-1 relative z-10">
                  <div className="flex justify-between items-center text-[10px] font-semibold text-zinc-400">
                    <span className="flex items-center gap-1.5 truncate max-w-[150px]">
                      <span className="text-[12px]">{getPlatformIcon("tiktok" as any)}</span>
                      <span className={isSelected ? "text-[var(--color-gold)] font-bold" : ""}>{horse.name}</span>
                    </span>
                    <span className="text-zinc-600">x{horse.odds}</span>
                  </div>

                  <div className="w-full h-3.5 bg-black/60 rounded-full border border-white/5 relative overflow-hidden flex items-center">
                    {/* Runner Node */}
                    <motion.div
                      className="h-full rounded-full transition-all duration-100 ease-out relative"
                      style={{
                        width: `${horse.progress}%`,
                        backgroundColor: horse.color,
                        boxShadow: isSelected ? `0 0 10px ${horse.color}` : "none"
                      }}
                    >
                      {/* Micro Horse representation symbol */}
                      <span className="absolute right-1 top-[-2px] text-[10px]">🐎</span>
                    </motion.div>

                    {/* Winner badge */}
                    {isWinner && (
                      <span className="absolute right-2 text-[10px] text-emerald-400 animate-bounce">🏆 WIN!</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Controller console & Mascot */}
      <div className="lg:col-span-5 glass-panel p-8 rounded-3xl bg-black/50 border-white/5 flex flex-col justify-between h-full text-left">
        <div className="flex flex-col gap-6">
          
          <div className="border-b border-white/5 pb-4 mb-2 flex justify-between items-center">
            <div>
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block">Brownian Physics v1.0</span>
              <h3 className="font-heading font-black text-2xl text-[var(--color-gold)] uppercase tracking-wider">
                Virtual Derby
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
          {!isRacing && (
            <div className="flex flex-col gap-4">
              {/* Bet Amount */}
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

              {/* Horse Selector */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                  {language === "es" ? "Elige tu Caballo" : "Choose Your Runner"}
                </label>
                <select
                  value={selectedHorseId}
                  onChange={(e) => setSelectedHorseId(Number(e.target.value))}
                  className="w-full p-3.5 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:border-[var(--color-gold)] transition text-xs appearance-none cursor-pointer"
                >
                  {horses.map((horse) => (
                    <option key={horse.id} value={horse.id} className="bg-black text-white">
                      {horse.name} (x{horse.odds} cuota)
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Active Race Status */}
          {isRacing && (
            <div className="p-4 rounded-2xl bg-zinc-950 border border-white/5 text-center font-mono">
              <span className="text-[10px] text-zinc-500 uppercase tracking-widest block animate-pulse">Carrera en curso</span>
              <strong className="text-sm text-[var(--color-gold)] block mt-1">APOSTADO: {betAmount} Coins</strong>
            </div>
          )}

          {/* Reset/Done view */}
          {raceFinished && winner && (
            <div className="p-4 rounded-2xl bg-zinc-950 border border-emerald-500/20 text-center">
              <span className="text-[10px] text-zinc-500 uppercase tracking-widest block">Ganador Oficial</span>
              <strong className="text-base text-emerald-400 block font-heading uppercase mt-1">🏆 {winner.name}</strong>
              <button
                onClick={initializeDerby}
                className="mt-3 text-xs font-bold text-[var(--color-gold)] underline hover:text-white block mx-auto cursor-pointer"
              >
                Preparar siguiente carrera
              </button>
            </div>
          )}

        </div>

        {/* Action Button */}
        <div className="border-t border-white/5 pt-6 mt-8">
          {!isRacing && !raceFinished && (
            <button
              onClick={handleStartRace}
              className="w-full py-4 bg-[var(--color-gold)] text-black font-heading font-black text-xs uppercase tracking-widest rounded-xl hover:bg-[var(--color-gold-light)] transition-colors box-glow-gold cursor-pointer flex items-center justify-center gap-2"
            >
              <Play size={14} />
              <span>{language === "es" ? "APOSTAR E INICIAR DERBY" : "BET & START RACE"}</span>
            </button>
          )}
          {isRacing && (
            <div className="w-full py-4 bg-zinc-900 border border-white/5 text-zinc-500 rounded-xl text-xs font-bold uppercase tracking-widest font-mono text-center">
              🚧 Carrera en Progreso...
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
