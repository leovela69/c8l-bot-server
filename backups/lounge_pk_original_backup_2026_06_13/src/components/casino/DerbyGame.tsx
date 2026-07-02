"use client";
import React, { useState, useEffect, useRef } from "react";
import { useApp } from "../../context/AppContext";
import LionMascot from "../ui/LionMascot";
import { motion } from "framer-motion";
import { Coins, Play, HelpCircle, Trophy } from "lucide-react";
import { casinoSounds, playTone } from "../../lib/audio/casinoSounds";

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
  const { language, c8lCoins, placeCasinoBet, awardCasinoWin, showNotification, user } = useApp();

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

  const handleStartRace = async () => {
    if (isRacing) return;

    if (c8lCoins < betAmount) {
      showNotification(
        language === "es" ? "Monedas C8L insuficientes para apostar en el Derby." : "Insufficient C8L Coins to bet on the Derby.",
        "error"
      );
      return;
    }

    const success = await placeCasinoBet(betAmount);
    if (!success) return;
    setIsRacing(true);
    raceRef.current = true;
    setMascotState("sad"); // estrategist face
    
    // Play chiptune starting horn fanfare
    playTone(392.00, 'sawtooth', 0.12, 0, 0.03); // G4
    playTone(392.00, 'sawtooth', 0.12, 0.15, 0.03); // G4
    playTone(523.25, 'sawtooth', 0.35, 0.3, 0.04); // C5

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
            awardCasinoWin(payout).then(() => {
              setWinnings(payout);
              setMascotState("win");
              casinoSounds.playWin();
              window.dispatchEvent(new Event('c8l-screen-shake'));
              showNotification(
                language === "es"
                  ? `🏆 ¡Victoria! ${winningHorse.name} ganó la carrera. Recompensa: +${payout} Monedas C8L.`
                  : `🏆 Victory! ${winningHorse.name} won the race. Reward: +${payout} C8L Coins.`,
                "success"
              );
            });
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
                `Apostó ${betAmount} al ciber-corredor "${prevHorses.find(h => h.id === selectedHorseId)?.name}". Ganador: ${winningHorse.name} (${winningHorse.odds} odds). ${won ? `Ganó ${Math.floor(betAmount * winningHorse.odds)}` : "Perdió"}`
              );
            }
          }).catch(() => {});

          return updated;
        }

        // Play procedural hoverbike engine hum periodically based on leader's position
        if (Math.floor(Date.now() / 160) % 2 === 0) {
          const leader = updated.reduce((max, h) => h.progress > max.progress ? h : max, updated[0]);
          if (leader) {
            playTone(70 + leader.progress * 1.3, 'sawtooth', 0.09, 0, 0.01);
          }
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
      
      {/* Racetrack Style Grid Container */}
      <div className="lg:col-span-7 flex flex-col gap-4">
        
        {/* Track Box with moving digital grid background */}
        <div className="bg-black border-[3px] border-black rounded-3xl p-6 relative shadow-[6px_6px_0px_#00F3FF] flex flex-col gap-4 font-mono overflow-hidden min-h-[350px] justify-center">
          <style>{`
            @keyframes grid-move {
              0% { background-position-x: 0px; }
              100% { background-position-x: -30px; }
            }
            .racetrack-grid-animated {
              background-image: linear-gradient(90deg, rgba(0, 243, 255, 0.08) 1px, transparent 1px),
                                linear-gradient(rgba(0, 243, 255, 0.03) 1px, transparent 1px);
              background-size: 30px 100%, 100% 40px;
              animation: grid-move 0.25s linear infinite;
            }
          `}</style>
          
          <div 
            className="absolute inset-0 racetrack-grid-animated pointer-events-none z-0" 
            style={{ animationPlayState: isRacing ? 'running' : 'paused' }}
          />

          <div className="flex justify-between items-center text-[10px] text-zinc-400 uppercase tracking-widest border-b border-white/10 pb-2 relative z-10 font-bold">
            <span>🏍️ Ciber-Corredor / Hype</span>
            <span className="flex items-center gap-1 text-[#FF0055] text-glow-neon">🏁 META</span>
          </div>

          <div className="space-y-4 relative z-10 flex flex-col justify-between py-2">
            {/* Finish Line (glowing dashed line) */}
            <div className="absolute right-8 top-0 bottom-0 w-0.5 border-r-2 border-dashed border-[#FF0055]/50 z-0 shadow-[0_0_8px_#FF0055]" />

            {horses.map((horse) => {
              const isSelected = horse.id === selectedHorseId;
              const isWinner = winner && winner.id === horse.id;

              return (
                <div key={horse.id} className="flex flex-col gap-1 relative z-10">
                  <div className="flex justify-between items-center text-[10px] font-semibold text-zinc-400">
                    <span className="flex items-center gap-1.5 truncate max-w-[170px]">
                      <span className="text-[11px]">{getPlatformIcon("starmaker")}</span>
                      <span className={isSelected ? "text-[var(--color-gold)] font-bold text-glow-gold" : "text-zinc-300"}>
                        {horse.name}
                      </span>
                    </span>
                    <span className="text-zinc-500 font-mono">x{horse.odds}</span>
                  </div>

                  {/* Racing Lane */}
                  <div className="w-full h-7 bg-black/80 rounded-lg border-2 border-black relative overflow-hidden flex items-center shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)]">
                    
                    {/* Light Wall Trail (Tron style) */}
                    <div 
                      className="absolute h-0.5 left-0 rounded-full"
                      style={{
                        width: `${horse.progress}%`,
                        background: `linear-gradient(90deg, transparent, ${horse.color})`,
                        boxShadow: `0 0 10px 1px ${horse.color}`,
                        top: '50%',
                        transform: 'translateY(-50%)'
                      }}
                    />

                    {/* Hoverbike Node */}
                    <div 
                      className="absolute transition-all duration-100 ease-out flex items-center"
                      style={{
                        left: `calc(${horse.progress}% - 22px)`,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        zIndex: 10
                      }}
                    >
                      <span 
                        className="text-base select-none" 
                        style={{ filter: `drop-shadow(0 0 6px ${horse.color})` }}
                      >
                        🏍️
                      </span>
                      <span className="text-[8px] animate-pulse ml-0.5" style={{ color: horse.color }}>🔥</span>
                    </div>

                    {/* Winner badge */}
                    {isWinner && (
                      <span className="absolute right-12 text-[10px] text-emerald-400 font-black tracking-widest animate-bounce z-20">
                        🏆 WINNER!
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Controller console & Mascot */}
      <div className="lg:col-span-5 border-[3px] border-black bg-[#0d0d0e]/95 p-8 rounded-3xl shadow-[6px_6px_0px_#D4AF37] flex flex-col justify-between h-full text-left c8l-scanlines">
        <div className="flex flex-col gap-6">
          
          <div className="border-b border-white/10 pb-4 mb-2 flex justify-between items-center">
            <div>
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block">Quantum Physics v1.1</span>
              <h3 className="font-heading font-black text-2xl text-[var(--color-gold)] text-glow-gold uppercase tracking-wider">
                Virtual Derby
              </h3>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black border-[3px] border-black text-xs font-mono text-[#D4AF37] shadow-[3px_3px_0px_#D4AF37] text-glow-gold">
              <Coins size={14} />
              <span className="font-bold">{c8lCoins} Coins</span>
            </div>
          </div>

          {/* Mascot feedback */}
          <div className="flex justify-center h-[120px] items-end">
            <LionMascot state={mascotState} size={110} />
          </div>

          {/* Selected Horse Stats Panel */}
          {!isRacing && !raceFinished && (
            <div className="bg-black border-[3px] border-black p-4 rounded-2xl shadow-[4px_4px_0px_#D4AF37] font-mono text-[10px] space-y-2 mt-4 text-[#D4AF37] relative z-10 border-t-[#D4AF37] border-l-[#D4AF37] select-none">
              <div className="font-bold border-b border-[#D4AF37]/20 pb-1.5 uppercase tracking-wider">
                📋 PADDOCK: DATOS DEL BI-CORREDOR
              </div>
              {(() => {
                const selectedHorse = horses.find(h => h.id === selectedHorseId);
                if (!selectedHorse) return null;
                const stats = {
                  speed: Math.round(selectedHorse.baseWeight * 125),
                  weight: Math.round((2.0 - selectedHorse.baseWeight) * 90),
                  stability: selectedHorse.odds < 3 ? "MÁXIMA" : selectedHorse.odds > 8 ? "VARIABLE" : "ESTABLE"
                };
                return (
                  <div className="space-y-1 text-left">
                    <div><span className="text-zinc-500">PROPULSIÓN:</span> <span className="text-white font-bold">{stats.speed} kW</span></div>
                    <div><span className="text-zinc-500">PESO CHASIS:</span> <span className="text-white font-bold">{stats.weight} kg</span></div>
                    <div><span className="text-zinc-500">ESTABILIDAD:</span> <span className="text-white font-bold">{stats.stability}</span></div>
                    <div><span className="text-zinc-500">ESTILO HYPE:</span> <span className="text-white font-bold">Turbo-Light Cycle Trail</span></div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Bet size */}
          {!isRacing && !raceFinished && (
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
                      className={`py-2 rounded-xl text-xs font-mono font-bold transition-all border-[3px] border-black cursor-pointer ${
                        betAmount === amt
                          ? "bg-[var(--color-gold)] text-black shadow-[3px_3px_0px_#D4AF37]"
                          : "bg-black text-zinc-400 hover:text-white"
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
                  {language === "es" ? "Elige tu Ciber-Corredor" : "Choose Your Runner"}
                </label>
                <select
                  value={selectedHorseId}
                  onChange={(e) => setSelectedHorseId(Number(e.target.value))}
                  className="w-full p-3.5 bg-black border-[3px] border-black rounded-xl text-white outline-none focus:border-[var(--color-gold)] transition text-xs appearance-none cursor-pointer font-mono font-bold"
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
            <div className="p-4 rounded-2xl bg-black border-[3px] border-black shadow-[4px_4px_0px_#00F3FF] text-center font-mono">
              <span className="text-[10px] text-zinc-500 uppercase tracking-widest block animate-pulse">Carrera en curso</span>
              <strong className="text-sm text-[var(--color-gold)] block mt-1">APOSTADO: {betAmount} Coins</strong>
            </div>
          )}

          {/* Reset/Done view */}
          {raceFinished && winner && (
            <div className="p-4 rounded-2xl bg-black border-[3px] border-black shadow-[4px_4px_0px_#00FFCC] text-center font-mono">
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
              className="w-full py-4 bg-[var(--color-gold)] text-black font-heading font-black text-xs uppercase tracking-widest rounded-xl hover:bg-[var(--color-gold-light)] border-[3px] border-black shadow-[4px_4px_0px_#00F3FF] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0px_#00F3FF] transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Play size={14} />
              <span>{language === "es" ? "APOSTAR E INICIAR DERBY" : "BET & START RACE"}</span>
            </button>
          )}
          {isRacing && (
            <div className="w-full py-4 bg-zinc-900 border-[3px] border-black text-zinc-500 rounded-xl text-xs font-bold uppercase tracking-widest font-mono text-center">
              🚥 Compitiendo en Pista...
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
