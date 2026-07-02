"use client";
import React, { useState, useEffect, useRef } from "react";
import { useApp } from "../../context/AppContext";
import LionMascot from "../ui/LionMascot";
import { motion } from "framer-motion";
import { Coins, Play, Trophy, Bell } from "lucide-react";
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
    case "youtube": return "🔴";
    case "twitch": return "🟣";
    case "tiktok": return "⚫";
    case "starmaker": return "⭐";
    case "kips": return "🔵";
    default: return "✨";
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
  const [bellRinging, setBellRinging] = useState(false);

  const raceRef = useRef<boolean>(false);
  const animationFrameIdRef = useRef<number | null>(null);

  // Initialize horses and calculate dynamic odds using pool betting
  const initializeDerby = () => {
    const poolBets = INITIAL_HORSES.map(h => {
      const simulatedVolume = Math.floor(Math.random() * 2500) + 500;
      return { ...h, betVolume: simulatedVolume };
    });

    const totalPool = poolBets.reduce((acc, curr) => acc + curr.betVolume, 0);

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
    setBellRinging(false);
  };

  useEffect(() => {
    initializeDerby();
    return () => {
      if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current);
    };
  }, []);

  // Procedural Starting Bell & Gates open sounds
  const playStartingBell = () => {
    setBellRinging(true);
    // Double chime
    playTone(880.00, 'sine', 0.22, 0, 0.05); // A5
    playTone(1760.00, 'sine', 0.12, 0.02, 0.02);
    
    playTone(880.00, 'sine', 0.22, 0.15, 0.05);
    playTone(1760.00, 'sine', 0.12, 0.17, 0.02);
    
    // Gate clank sound
    playTone(160, 'sawtooth', 0.10, 0.24, 0.03);
    playTone(90, 'triangle', 0.18, 0.26, 0.05);

    setTimeout(() => {
      setBellRinging(false);
    }, 1500);
  };

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
    setMascotState("sad");
    
    playStartingBell();

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
          const luckFactor = Math.random() * 0.95 + 0.1;
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

          const sorted = [...finishedHorses].sort((a, b) => (a.finishTime || 99999) - (b.finishTime || 99999));
          const winningHorse = sorted[0];
          setWinner(winningHorse);

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

          import("../../utils/analytics").then(({ logActivity }) => {
            if (user) {
              logActivity(
                user.uid,
                user.email || "",
                user.displayName || "Streamer",
                "casino_derby",
                `Apostó ${betAmount} al ciber-jinete "${prevHorses.find(h => h.id === selectedHorseId)?.name}". Ganador: ${winningHorse.name} (${winningHorse.odds} odds). ${won ? `Ganó ${Math.floor(betAmount * winningHorse.odds)}` : "Perdió"}`
              );
            }
          }).catch(() => {});

          return updated;
        }

        // Procedural Galloping Audio Hum (Simulates galloping clip-clops)
        if (Math.floor(Date.now() / 150) % 2 === 0) {
          const leader = updated.reduce((max, h) => h.progress > max.progress ? h : max, updated[0]);
          if (leader) {
            playTone(45 + (leader.progress * 0.4), 'triangle', 0.04, 0, 0.01);
            playTone(85 + (leader.progress * 0.4), 'sine', 0.02, 0.03, 0.01);
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
        <div className="bg-[#050B07] border-[3px] border-emerald-950 rounded-3xl p-6 relative shadow-[6px_6px_0px_#00F3FF] flex flex-col gap-4 font-mono overflow-hidden min-h-[380px] justify-center border-t-emerald-800 border-l-emerald-800">
          <style>{`
            @keyframes grid-move {
              0% { background-position-x: 0px; }
              100% { background-position-x: -30px; }
            }
            .racetrack-grid-animated {
              background-image: linear-gradient(90deg, rgba(16, 185, 129, 0.08) 1px, transparent 1px),
                                linear-gradient(rgba(16, 185, 129, 0.03) 1px, transparent 1px);
              background-size: 30px 100%, 100% 40px;
              animation: grid-move 0.25s linear infinite;
            }
            @keyframes crowd-pulse {
              0% { transform: scaleY(0.4); }
              100% { transform: scaleY(1.3); }
            }
            @keyframes bell-ring {
              0% { transform: rotate(-12deg); }
              50% { transform: rotate(12deg); }
              100% { transform: rotate(-12deg); }
            }
            .bell-active {
              animation: bell-ring 0.3s ease-in-out infinite;
            }
          `}</style>
          
          <div 
            className="absolute inset-0 racetrack-grid-animated pointer-events-none z-0" 
            style={{ animationPlayState: isRacing ? 'running' : 'paused' }}
          />

          {/* Crowd Excitement telemetry */}
          <div className="bg-black/40 border border-emerald-900/30 rounded-xl p-3 flex flex-col gap-1.5 relative z-10 select-none">
            <div className="flex justify-between items-center text-[9px] text-zinc-400 font-bold uppercase tracking-wider">
              <span className="flex items-center gap-1">🔊 Telemetría de Gradas / Afición: 
                <span className={isRacing ? "text-red-400 animate-pulse font-black" : "text-zinc-500 font-normal"}>
                  {isRacing ? " GRITERÍO MÁXIMO" : " EN APUESTAS"}
                </span>
              </span>
              <span className="text-[#00E3FD] text-glow-neon flex items-center gap-1">
                <Bell size={10} className={bellRinging ? "bell-active text-[#D4AF37]" : ""} />
                CAMPANAS
              </span>
            </div>
            <div className="flex items-end gap-1 h-8">
              {Array.from({ length: 24 }).map((_, idx) => {
                const heightVal = isRacing ? `${Math.sin(idx * 0.4 + Date.now() / 120) * 12 + 18}px` : '4px';
                return (
                  <div 
                    key={idx}
                    className="flex-1 rounded-t bg-gradient-to-t from-emerald-950 via-[#00E3FD]/50 to-[#D4AF37] transition-all duration-300"
                    style={{
                      height: heightVal,
                      transformOrigin: 'bottom'
                    }}
                  />
                );
              })}
            </div>
          </div>

          <div className="flex justify-between items-center text-[10px] text-zinc-400 uppercase tracking-widest border-b border-emerald-900/30 pb-2 relative z-10 font-bold">
            <span>🏇 Compuertas y Jinetes</span>
            <span className="flex items-center gap-1 text-[#FF0055] text-glow-neon">🏁 META</span>
          </div>

          <div className="space-y-3 relative z-10 flex flex-col justify-between py-1">
            {/* Finish Line (glowing dashed line) */}
            <div className="absolute right-8 top-0 bottom-0 w-0.5 border-r-2 border-dashed border-[#FF0055]/50 z-0 shadow-[0_0_8px_#FF0055]" />

            {horses.map((horse) => {
              const isSelected = horse.id === selectedHorseId;
              const isWinner = winner && winner.id === horse.id;

              return (
                <div key={horse.id} className="flex flex-col gap-0.5 relative z-10">
                  <div className="flex justify-between items-center text-[9px] font-semibold text-zinc-400">
                    <span className="flex items-center gap-1 truncate max-w-[170px]">
                      <span className="text-[10px]">{getPlatformIcon("starmaker")}</span>
                      <span className={isSelected ? "text-[var(--color-gold)] font-bold text-glow-gold" : "text-zinc-300"}>
                        {horse.name}
                      </span>
                    </span>
                    <span className="text-zinc-500 font-mono">x{horse.odds}</span>
                  </div>

                  {/* Racing Lane Turf style */}
                  <div className="w-full h-7 bg-gradient-to-r from-emerald-950/40 via-emerald-900/20 to-emerald-950/40 rounded-lg border border-emerald-800/30 relative overflow-hidden flex items-center shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)]">
                    
                    {/* Gate Box */}
                    <div className={`w-8 h-full flex items-center justify-center font-mono text-[9px] font-bold border-r border-emerald-800/30 relative z-20 transition-all ${
                      isRacing ? "bg-emerald-500/10 text-emerald-400" : "bg-red-950/30 text-red-400"
                    }`}>
                      {horse.id}
                      {!isRacing && !raceFinished && (
                        <div className="absolute inset-0 bg-red-950/80 border-r border-red-500 flex items-center justify-center text-[7px] font-black text-red-200">
                          🔒
                        </div>
                      )}
                    </div>

                    {/* Turf Lane Divider Accent */}
                    <div className="absolute bottom-0 left-8 right-0 h-[1px] bg-emerald-500/10" />

                    {/* Light Wall Trail (Tron style) */}
                    <div 
                      className="absolute h-[1px] left-8 rounded-full"
                      style={{
                        width: `${horse.progress * 0.76}%`,
                        background: `linear-gradient(90deg, transparent, ${horse.color})`,
                        boxShadow: `0 0 8px 1px ${horse.color}`,
                        top: '50%',
                        transform: 'translateY(-50%)'
                      }}
                    />

                    {/* Horse Rider Node */}
                    <div 
                      className="absolute transition-all duration-100 ease-out flex items-center"
                      style={{
                        left: `calc(32px + ${horse.progress * 0.76}% - 12px)`,
                        top: '50%',
                        transform: 'translateY(-50%) scaleX(-1)', // Flip right
                        zIndex: 10
                      }}
                    >
                      <span 
                        className="text-base select-none" 
                        style={{ filter: `drop-shadow(0 0 6px ${horse.color})` }}
                      >
                        🏇
                      </span>
                      {isRacing && !horse.finished && (
                        <span className="text-[6px] animate-pulse ml-0.5" style={{ color: horse.color, transform: 'scaleX(-1)' }}>💨</span>
                      )}
                    </div>

                    {/* Winner badge */}
                    {isWinner && (
                      <span className="absolute right-12 text-[9px] text-emerald-400 font-black tracking-widest animate-bounce z-20">
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
      <div className="lg:col-span-5 border-[3px] border-emerald-950 bg-[#0d0d0e]/95 p-8 rounded-3xl shadow-[6px_6px_0px_#D4AF37] flex flex-col justify-between h-full text-left c8l-scanlines border-t-emerald-900 border-l-emerald-900">
        <div className="flex flex-col gap-6">
          
          <div className="border-b border-[#10b981]/20 pb-4 mb-2 flex justify-between items-center">
            <div>
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block font-bold">Quantum Hipódromo v1.2</span>
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
            <div className="bg-black border-[3px] border-emerald-950 p-4 rounded-2xl shadow-[4px_4px_0px_#D4AF37] font-mono text-[10px] space-y-2 mt-4 text-[#D4AF37] relative z-10 border-t-[#D4AF37] border-l-[#D4AF37] select-none">
              <div className="font-bold border-b border-[#D4AF37]/20 pb-1.5 uppercase tracking-wider">
                📋 PADDOCK: DATOS DEL CIBER-CABALLO
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
                    <div><span className="text-zinc-500">POTENCIA DE GALOPE:</span> <span className="text-white font-bold">{stats.speed} HP</span></div>
                    <div><span className="text-zinc-500">PESO HERRADURAS:</span> <span className="text-white font-bold">{stats.weight} kg</span></div>
                    <div><span className="text-zinc-500">ESTABILIDAD CASCOS:</span> <span className="text-white font-bold">{stats.stability}</span></div>
                    <div><span className="text-zinc-500">ESTILO DE TRAYECTO:</span> <span className="text-white font-bold">Turbo-Light Turf Gallop</span></div>
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
                  {language === "es" ? "Elige tu Ciber-Caballo" : "Choose Your Runner"}
                </label>
                <select
                  value={selectedHorseId}
                  onChange={(e) => setSelectedHorseId(Number(e.target.value))}
                  className="w-full p-3.5 bg-black border-[3px] border-emerald-950 rounded-xl text-white outline-none focus:border-[var(--color-gold)] transition text-xs appearance-none cursor-pointer font-mono font-bold"
                >
                  {horses.map((horse) => (
                    <option key={horse.id} value={horse.id} className="bg-black text-white">
                      {horse.id}: {horse.name} (x{horse.odds} cuota)
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Active Race Status */}
          {isRacing && (
            <div className="p-4 rounded-2xl bg-black border-[3px] border-[#00F3FF] shadow-[4px_4px_0px_#00F3FF] text-center font-mono">
              <span className="text-[10px] text-zinc-500 uppercase tracking-widest block animate-pulse">CARRERA EN CURSO</span>
              <strong className="text-sm text-[var(--color-gold)] block mt-1">APOSTADO: {betAmount} Coins</strong>
            </div>
          )}

          {/* Reset/Done view */}
          {raceFinished && winner && (
            <div className="p-4 rounded-2xl bg-black border-[3px] border-[#00FFCC] shadow-[4px_4px_0px_#00FFCC] text-center font-mono">
              <span className="text-[10px] text-zinc-500 uppercase tracking-widest block font-bold">GANADOR OFICIAL</span>
              <strong className="text-base text-emerald-400 block font-heading uppercase mt-1">🏆 {winner.name}</strong>
              <button
                onClick={initializeDerby}
                className="mt-3 text-xs font-bold text-[var(--color-gold)] underline hover:text-white block mx-auto cursor-pointer uppercase tracking-widest"
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
              🚥 Compitiendo en Hipódromo...
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
