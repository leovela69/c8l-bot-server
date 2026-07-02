"use client";
import React, { useState, useEffect, useRef } from "react";
import { useApp } from "../../context/AppContext";
import LionMascot from "../ui/LionMascot";
import { motion, AnimatePresence } from "framer-motion";
import { Coins, Play, Trophy, AlertTriangle } from "lucide-react";

interface Car {
  id: number;
  name: string;
  color: string;
  angle: number; // 0 to 2*PI per lap
  speed: number; // base speed
  multiplier: number; // speed modifier (drops during skidding)
  skiddingFrames: number; // countdown for skidding recovery
  laps: number; // lap counter (wins at 3)
  finished: boolean;
  finishTime?: number;
}

const CARS_CONFIG = [
  { id: 1, name: "C8L Racing Gold", color: "#D4AF37", speed: 0.024 },
  { id: 2, name: "Ferrari Team Red", color: "#EF4444", speed: 0.023 },
  { id: 3, name: "Cyber Mercedes", color: "#10B981", speed: 0.022 },
  { id: 4, name: "Red Bull Hype", color: "#3B82F6", speed: 0.025 },
  { id: 5, name: "Aston Neon", color: "#84CC16", speed: 0.021 },
  { id: 6, name: "Alpine Alpine", color: "#EC4899", speed: 0.020 }
];

export default function FormulaGame() {
  const { language, c8lCoins, placeCasinoBet, awardCasinoWin, showNotification, user } = useApp();

  const [betAmount, setBetAmount] = useState<number>(50);
  const [selectedCarId, setSelectedCarId] = useState<number>(1);
  const [cars, setCars] = useState<Car[]>([]);
  const [isRacing, setIsRacing] = useState(false);
  const [raceFinished, setRaceFinished] = useState(false);
  const [winner, setWinner] = useState<Car | null>(null);
  const [winnings, setWinnings] = useState<number | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [mascotState, setMascotState] = useState<"idle" | "dance" | "win" | "sad">("idle");

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const raceRef = useRef<boolean>(false);
  const animationFrameIdRef = useRef<number | null>(null);
  const carsStateRef = useRef<Car[]>([]);

  // Fixed odds
  const getOdds = (carId: number) => {
    switch (carId) {
      case 4: return 2.2; // Red Bull (fastest)
      case 1: return 2.8; // C8L
      case 2: return 3.5; // Ferrari
      case 3: return 4.0; // Mercedes
      case 5: return 5.5; // Aston
      case 6: return 7.0; // Alpine (slowest but highest payout)
      default: return 3.0;
    }
  };

  const initializeRace = () => {
    const initialized = CARS_CONFIG.map(c => ({
      ...c,
      angle: -Math.PI / 2 - (c.id * 0.05), // start slightly separated
      multiplier: 1.0,
      skiddingFrames: 0,
      laps: 0,
      finished: false
    })) as Car[];

    setCars(initialized);
    carsStateRef.current = initialized;
    setWinner(null);
    setRaceFinished(false);
    setWinnings(null);
    setLogs([language === "es" ? "🏁 Coches en la parrilla de salida." : "🏁 Cars aligned on grid."]);
    setMascotState("idle");

    setTimeout(() => drawTrack(), 100);
  };

  useEffect(() => {
    initializeRace();
    return () => {
      if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current);
    };
  }, []);

  // Draw track & cars on Canvas
  const drawTrack = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    const centerX = width / 2;
    const centerY = height / 2;
    const rx = width * 0.4; // oval horizontal radius
    const ry = height * 0.35; // oval vertical radius

    // 1. Draw Asphalt Oval Track
    ctx.beginPath();
    ctx.ellipse(centerX, centerY, rx + 16, ry + 16, 0, 0, Math.PI * 2);
    ctx.fillStyle = "#1A1A1E";
    ctx.fill();
    ctx.strokeStyle = "#2E2E38";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Inner field (green/cyber black area)
    ctx.beginPath();
    ctx.ellipse(centerX, centerY, rx - 16, ry - 16, 0, 0, Math.PI * 2);
    ctx.fillStyle = "#0A0A0C";
    ctx.fill();
    ctx.strokeStyle = "#2E2E38";
    ctx.lineWidth = 2;
    ctx.stroke();

    // 2. Draw Lane lines (dashed)
    ctx.beginPath();
    ctx.ellipse(centerX, centerY, rx, ry, 0, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(212,175,55,0.2)";
    ctx.setLineDash([8, 12]);
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.setLineDash([]); // Reset

    // 3. Draw Finish line (start line is at angle -PI/2 which is top vertical)
    ctx.beginPath();
    ctx.moveTo(centerX, centerY - ry - 16);
    ctx.lineTo(centerX, centerY - ry + 16);
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 4;
    ctx.stroke();

    // Draw checkered grid finish line
    ctx.beginPath();
    ctx.moveTo(centerX, centerY - ry - 16);
    ctx.lineTo(centerX, centerY - ry + 16);
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 4;
    ctx.setLineDash([4, 4]);
    ctx.stroke();
    ctx.setLineDash([]); // Reset

    // 4. Draw Cars
    const currentCars = carsStateRef.current;
    currentCars.forEach((car) => {
      // Calculate oval coordinates
      const x = centerX + rx * Math.cos(car.angle);
      const y = centerY + ry * Math.sin(car.angle);

      // Draw car body dot
      ctx.beginPath();
      ctx.arc(x, y, 7, 0, Math.PI * 2);
      ctx.fillStyle = car.color;
      ctx.fill();
      ctx.strokeStyle = "#FFFFFF";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Mini tail flare (F1 spoiler representation)
      ctx.beginPath();
      // angle perpendicular vector
      const px = x - 10 * Math.cos(car.angle + Math.PI / 12);
      const py = y - 10 * Math.sin(car.angle + Math.PI / 12);
      ctx.arc(px, py, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = "#FFFFFF";
      ctx.fill();

      // Smoke indicator if skidding
      if (car.skiddingFrames > 0) {
        ctx.beginPath();
        ctx.arc(x - 12 * Math.cos(car.angle), y - 12 * Math.sin(car.angle), 5, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255,255,255,0.4)";
        ctx.fill();
      }

      // Draw car number label
      ctx.fillStyle = "#000000";
      ctx.font = "bold 8px font-mono, Inter";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(car.id.toString(), x, y);
    });
  };

  const handleStartRace = async () => {
    if (isRacing) return;

    if (c8lCoins < betAmount) {
      showNotification(
        language === "es" ? "Monedas C8L insuficientes para apostar en la F1." : "Insufficient C8L Coins to bet on F1.",
        "error"
      );
      return;
    }

    const success = await placeCasinoBet(betAmount);
    if (!success) return;
    setIsRacing(true);
    raceRef.current = true;
    setMascotState("sad"); // estrategist face
    setLogs([language === "es" ? "🟢 Semáforo en VERDE: ¡ARRANCA LA CARRERA!" : "🟢 GREEN LIGHT: THE RACE IS ON!"]);

    // Reset cars
    const initialized = CARS_CONFIG.map(c => ({
      ...c,
      angle: -Math.PI / 2 - (c.id * 0.05),
      multiplier: 1.0,
      skiddingFrames: 0,
      laps: 0,
      finished: false
    })) as Car[];
    carsStateRef.current = initialized;
    setCars(initialized);

    const winningCars: Car[] = [];
    let startTimestamp = Date.now();

    const loop = async () => {
      if (!raceRef.current) return;

      let allFinished = true;
      const updated = carsStateRef.current.map(car => {
        if (car.finished) return car;

        allFinished = false;

        // Random Skidding Event Trigger (0.3% chance per frame)
        let multiplier = car.multiplier;
        let skiddingFrames = car.skiddingFrames;

        if (skiddingFrames > 0) {
          skiddingFrames--;
          if (skiddingFrames === 0) {
            multiplier = 1.0; // recovered
            setLogs(prev => [...prev, `${car.name} ${language === "es" ? "se recupera y vuelve a acelerar" : "recovers and speeds back up"}`].slice(-6));
          }
        } else if (Math.random() < 0.003) {
          // Skid trigger!
          skiddingFrames = 45; // skid for 45 frames
          multiplier = 0.25; // drop speed multiplier to 25%
          setMascotState("sad");
          setLogs(prev => [...prev, `🚨 ¡${car.name} ${language === "es" ? "ha DERRAPADO en la curva!" : "SKIDDED on the turn!"}`].slice(-6));
        }

        // Deterministic base step modified by multiplier
        const speedStep = car.speed * multiplier;
        let newAngle = car.angle + speedStep;

        // Lap completed check (every loop of 2*PI from -PI/2)
        const currentLapAngle = newAngle + Math.PI / 2;
        const targetLap = Math.floor(currentLapAngle / (Math.PI * 2));
        let laps = car.laps;

        if (targetLap > car.laps) {
          laps = targetLap;
          if (laps < 3) {
            setLogs(prev => [...prev, `🏁 ${car.name}: ${language === "es" ? "Vuelta" : "Lap"} ${laps} / 3`].slice(-6));
          }
        }

        const finished = laps >= 3;

        if (finished) {
          const time = Date.now() - startTimestamp;
          const completedCar = { ...car, angle: -Math.PI / 2, laps: 3, finished, finishTime: time };
          winningCars.push(completedCar);
          return completedCar;
        }

        return { ...car, angle: newAngle, multiplier, skiddingFrames, laps };
      });

      carsStateRef.current = updated;
      setCars(updated);
      drawTrack();

      // Check if race ends
      if (allFinished) {
        raceRef.current = false;
        setIsRacing(false);
        setRaceFinished(true);

        const sorted = [...winningCars].sort((a, b) => (a.finishTime || 999999) - (b.finishTime || 999999));
        const winningCar = sorted[0];
        setWinner(winningCar);

        const won = winningCar.id === selectedCarId;
        const odds = getOdds(winningCar.id);

        if (won) {
          const payout = Math.floor(betAmount * odds);
          await awardCasinoWin(payout);
          setWinnings(payout);
          setMascotState("win");
          showNotification(
            language === "es"
              ? `🏆 ¡Victoria! Tu escudería ${winningCar.name} ganó. Recompensa: +${payout} Coins.`
              : `🏆 Victory! Your team ${winningCar.name} won. Reward: +${payout} Coins.`,
            "success"
          );
        } else {
          setWinnings(0);
          setMascotState("sad");
          showNotification(
            language === "es"
              ? `Derrota. El coche ganador es ${winningCar.name}.`
              : `Loss. The winning car is ${winningCar.name}.`,
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
              "casino_f1",
              `Apostó ${betAmount} al Coche F1 "${CARS_CONFIG.find(c => c.id === selectedCarId)?.name}". Ganador: ${winningCar.name} (odds x${odds}). ${won ? `Ganó ${Math.floor(betAmount * odds)}` : "Perdió"}`
            );
          }
        }).catch(() => {});
        return;
      }

      if (raceRef.current) {
        animationFrameIdRef.current = requestAnimationFrame(loop);
      }
    };

    animationFrameIdRef.current = requestAnimationFrame(loop);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center max-w-5xl mx-auto">
      
      {/* Racing Track Canvas */}
      <div className="lg:col-span-7 flex flex-col gap-4">
        
        {/* Canvas Arena */}
        <div className="bg-[#08080a] border border-white/10 rounded-3xl p-6 relative box-glow-neon flex flex-col gap-2">
          <canvas
            ref={canvasRef}
            width={480}
            height={300}
            className="w-full block bg-[#0a0a0c] rounded-2xl aspect-[480/300]"
          />

          {/* Real-time Logs Box */}
          <div className="bg-black/80 border border-white/5 rounded-xl p-3.5 h-[80px] overflow-y-auto font-mono text-[9px] text-zinc-500 flex flex-col gap-1 text-left no-scrollbar">
            {logs.map((log, i) => (
              <p key={i} className={i === logs.length - 1 ? "text-[var(--color-gold)] font-bold" : ""}>
                ▶ {log}
              </p>
            ))}
          </div>
        </div>

      </div>

      {/* Bets Console Panel & Mascot */}
      <div className="lg:col-span-5 glass-panel p-8 rounded-3xl bg-black/50 border-white/5 flex flex-col justify-between h-full text-left">
        
        <div className="flex flex-col gap-6">
          <div className="border-b border-white/5 pb-4 mb-2 flex justify-between items-center">
            <div>
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block">Deterministic Physics v1.0</span>
              <h3 className="font-heading font-black text-2xl text-[var(--color-gold)] uppercase tracking-wider">
                Micro Racing F1
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

              {/* F1 Car Selector */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                  {language === "es" ? "Elige tu Escudería" : "Select Your F1 Team"}
                </label>
                <select
                  value={selectedCarId}
                  onChange={(e) => setSelectedCarId(Number(e.target.value))}
                  className="w-full p-3.5 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:border-[var(--color-gold)] transition text-xs appearance-none cursor-pointer"
                >
                  {CARS_CONFIG.map((car) => (
                    <option key={car.id} value={car.id} className="bg-black text-white">
                      {car.name} (x{getOdds(car.id)} cuota)
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Active Race Status */}
          {isRacing && (
            <div className="p-4 rounded-2xl bg-zinc-950 border border-white/5 text-center font-mono">
              <span className="text-[10px] text-zinc-500 uppercase tracking-widest block animate-pulse">Gran Premio en marcha (3 Vueltas)</span>
              <strong className="text-sm text-[var(--color-gold)] block mt-1">APOSTADO: {betAmount} Coins</strong>
            </div>
          )}

          {/* Winner details */}
          {raceFinished && winner && (
            <div className="p-4 rounded-2xl bg-zinc-950 border border-emerald-500/20 text-center">
              <span className="text-[10px] text-zinc-500 uppercase tracking-widest block">Primer puesto</span>
              <strong className="text-base text-emerald-400 block font-heading uppercase mt-1">🏆 {winner.name}</strong>
              <button
                onClick={initializeRace}
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
              <span>{language === "es" ? "APOSTAR E INICIAR GP" : "BET & START GRAND PRIX"}</span>
            </button>
          )}
          {isRacing && (
            <div className="w-full py-4 bg-zinc-900 border border-white/5 text-zinc-500 rounded-xl text-xs font-bold uppercase tracking-widest font-mono text-center">
              🚥 Compitiendo en Pista...
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
