"use client";
import React, { useState, useEffect, useRef } from "react";
import { useApp } from "../../context/AppContext";
import LionMascot from "../ui/LionMascot";
import { motion, AnimatePresence } from "framer-motion";
import { Coins, Play, RefreshCw, Trophy, HelpCircle, ArrowLeft } from "lucide-react";

interface BingoCell {
  val: number | "FREE";
  marked: boolean;
}

function generateBingoCard(): BingoCell[][] {
  const card: BingoCell[][] = Array(5).fill(null).map(() => Array(5).fill(null) as any);
  
  // Column B (1-15), I (16-30), N (31-45), G (46-60), O (61-75)
  const ranges = [
    { min: 1, max: 15 },
    { min: 16, max: 30 },
    { min: 31, max: 45 },
    { min: 46, max: 60 },
    { min: 61, max: 75 }
  ];

  for (let col = 0; col < 5; col++) {
    const numbers: number[] = [];
    const { min, max } = ranges[col];
    while (numbers.length < 5) {
      const num = Math.floor(Math.random() * (max - min + 1)) + min;
      if (!numbers.includes(num)) numbers.push(num);
    }
    numbers.sort((a, b) => a - b);
    for (let row = 0; row < 5; row++) {
      if (col === 2 && row === 2) {
        card[row][col] = { val: "FREE", marked: true };
      } else {
        card[row][col] = { val: numbers[row], marked: false };
      }
    }
  }
  return card;
}

export default function BingoGame() {
  const { language, c8lCoins, placeCasinoBet, awardCasinoWin, showNotification, user } = useApp();

  const [card, setCard] = useState<BingoCell[][]>(generateBingoCard());
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Ball machine state
  const [ballsPool, setBallsPool] = useState<number[]>([]);
  const [drawnBalls, setDrawnBalls] = useState<number[]>([]);
  const [currentBall, setCurrentBall] = useState<number | null>(null);
  
  // Options
  const [autoMark, setAutoMark] = useState(true);
  
  // Mascot state
  const [mascotState, setMascotState] = useState<"idle" | "dance" | "win" | "sad">("idle");
  const [mascotSpeech, setMascotSpeech] = useState("");

  // Track wins to avoid double payouts
  const [wonLines, setWonLines] = useState<string[]>([]);
  const [wonBingo, setWonBingo] = useState(false);

  // Audio Context Ref
  const audioCtxRef = useRef<AudioContext | null>(null);
  const intervalRef = useRef<number | null>(null);

  const getAudioCtx = (): AudioContext | null => {
    if (typeof window === "undefined") return null;
    try {
      const Cls = window.AudioContext || (window as any).webkitAudioContext;
      if (!audioCtxRef.current) audioCtxRef.current = new Cls();
      if (audioCtxRef.current.state === "suspended") audioCtxRef.current.resume();
      return audioCtxRef.current;
    } catch (e) {
      return null;
    }
  };

  const playTone = (freq: number, type: OscillatorType, duration: number, delay = 0, vol = 0.05) => {
    try {
      const ctx = getAudioCtx();
      if (!ctx) return;
      setTimeout(() => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        gain.gain.setValueAtTime(vol, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + duration);
      }, delay * 1000);
    } catch (e) {}
  };

  const playDrawSound = () => {
    playTone(300, "sawtooth", 0.1, 0, 0.04);
    playTone(450, "sawtooth", 0.08, 0.04, 0.03);
    playTone(600, "sawtooth", 0.12, 0.08, 0.02);
  };

  const playMarkSound = () => {
    playTone(900, "sine", 0.08, 0, 0.05);
  };

  const playWinSound = () => {
    const scale = [523.25, 659.25, 783.99, 1046.50]; // C5-E5-G5-C6
    scale.forEach((freq, idx) => {
      playTone(freq, "sine", 0.25, idx * 0.08, 0.06);
    });
  };

  const getBallLetter = (num: number): string => {
    if (num <= 15) return "B";
    if (num <= 30) return "I";
    if (num <= 45) return "N";
    if (num <= 60) return "G";
    return "O";
  };

  const getBallColor = (num: number): string => {
    if (num <= 15) return "text-rose-500 border-rose-500 bg-rose-950/20";
    if (num <= 30) return "text-purple-400 border-purple-400 bg-purple-950/20";
    if (num <= 45) return "text-[#D4AF37] border-[#D4AF37] bg-yellow-950/20";
    if (num <= 60) return "text-[#00F3FF] border-[#00F3FF] bg-cyan-950/20";
    return "text-emerald-400 border-emerald-400 bg-emerald-950/20";
  };

  // Start new round
  const handleStartBingo = async () => {
    if (isPlaying) return;
    
    const cost = 15;
    if (c8lCoins < cost) {
      showNotification(
        language === "es" ? "Monedas insuficientes para comprar el cartón (15 Coins)." : "Insufficient coins to buy Bingo card (15 Coins).",
        "error"
      );
      return;
    }

    const success = await placeCasinoBet(cost);
    if (!success) return;

    // Reset game states
    const newCard = generateBingoCard();
    setCard(newCard);
    
    // Pool of 75 balls
    const pool = Array.from({ length: 75 }, (_, i) => i + 1);
    setBallsPool(pool);
    setDrawnBalls([]);
    setCurrentBall(null);
    setWonLines([]);
    setWonBingo(false);

    setIsPlaying(true);
    setMascotState("idle");
    setMascotSpeech(language === "es" ? "¡Gira la tómbola! Suerte con tus números." : "Spinning the drum! Good luck with your card.");
    addLog(language === "es" ? "🟢 Cartón de Bingo comprado. Iniciando tómbola..." : "🟢 Bingo card bought. Starting ball machine...");

    // Start drawing interval (every 4.5 seconds)
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = window.setInterval(() => {
      drawNextBall(pool, newCard);
    }, 4500);
  };

  const addLog = (msg: string) => {
    setLogs(prev => [msg, ...prev].slice(0, 10));
  };
  const [logs, setLogs] = useState<string[]>([]);

  // Draw next ball
  const drawNextBall = (currentPool: number[], currentCard: BingoCell[][]) => {
    if (currentPool.length === 0) {
      stopBingoGame();
      setMascotSpeech(language === "es" ? "¡Tómbola vacía!" : "All balls drawn!");
      return;
    }

    // Select random index from remaining pool
    const idx = Math.floor(Math.random() * currentPool.length);
    const ball = currentPool[idx];
    currentPool.splice(idx, 1);
    
    playDrawSound();
    setCurrentBall(ball);
    
    const letter = getBallLetter(ball);
    addLog(language === "es" ? `Bola extraída: ${letter}-${ball}` : `Ball drawn: ${letter}-${ball}`);

    setDrawnBalls(prev => [ball, ...prev]);

    // Handle auto mark
    if (autoMark) {
      markNumber(ball, currentCard);
    } else {
      setMascotSpeech(language === "es" ? `¡Salió el ${letter}-${ball}! Búscalo en tu cartón.` : `The ${letter}-${ball} is out! Check your card.`);
    }
  };

  // Mark number on the card
  const markNumber = (num: number, currentCard: BingoCell[][]) => {
    let found = false;
    const updatedCard = currentCard.map(row => 
      row.map(cell => {
        if (cell.val === num) {
          found = true;
          return { ...cell, marked: true };
        }
        return cell;
      })
    );

    if (found) {
      playMarkSound();
      setCard(updatedCard);
      checkPayouts(updatedCard);
    }
  };

  // Manual marking click
  const handleCellClick = (row: number, col: number) => {
    if (!isPlaying) return;
    if (autoMark) return; // handled automatically

    const cell = card[row][col];
    if (cell.marked || cell.val === "FREE") return;

    // Check if cell value was indeed drawn
    if (drawnBalls.includes(cell.val)) {
      markNumber(cell.val, card);
      showNotification(language === "es" ? `Marcado ${cell.val}!` : `Marked ${cell.val}!`, "success");
    } else {
      showNotification(
        language === "es" ? `Ese número no ha salido todavía.` : `This number has not been drawn yet.`,
        "error"
      );
      playTone(180, "sawtooth", 0.2, 0, 0.05); // Error buzzer
    }
  };

  // Verify winning conditions (Lines & Bingo)
  const checkPayouts = async (currentCard: BingoCell[][]) => {
    let newPayout = 0;
    const linesFound: string[] = [];

    // 1. Check Rows
    for (let r = 0; r < 5; r++) {
      if (currentCard[r].every(c => c.marked)) {
        linesFound.push(`row-${r}`);
      }
    }

    // 2. Check Cols
    for (let c = 0; c < 5; c++) {
      let colMarked = true;
      for (let r = 0; r < 5; r++) {
        if (!currentCard[r][c].marked) {
          colMarked = false;
          break;
        }
      }
      if (colMarked) {
        linesFound.push(`col-${c}`);
      }
    }

    // 3. Check Diagonals
    let diag1 = true;
    let diag2 = true;
    for (let i = 0; i < 5; i++) {
      if (!currentCard[i][i].marked) diag1 = false;
      if (!currentCard[i][4 - i].marked) diag2 = false;
    }
    if (diag1) linesFound.push("diag-1");
    if (diag2) linesFound.push("diag-2");

    // Evaluate new lines found
    const freshLines = linesFound.filter(l => !wonLines.includes(l));
    if (freshLines.length > 0) {
      const reward = freshLines.length * 50;
      await awardCasinoWin(reward);
      newPayout += reward;
      setWonLines(prev => [...prev, ...freshLines]);
      
      setMascotState("dance");
      setMascotSpeech(language === "es" ? "¡LÍNEA! Te llevas monedas de premio." : "LINE! Payout awarded.");
      addLog(language === "es" ? `🏆 ¡LÍNEA COMPLETADA! +${reward} Coins.` : `🏆 LINE COMPLETED! +${reward} Coins.`);
      playWinSound();
      window.dispatchEvent(new Event("c8l-screen-shake"));
    }

    // 4. Check Full House (Bingo)
    let fullHouse = true;
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        if (!currentCard[r][c].marked) {
          fullHouse = false;
          break;
        }
      }
    }

    if (fullHouse && !wonBingo) {
      setWonBingo(true);
      const reward = 500;
      await awardCasinoWin(reward);
      newPayout += reward;
      
      setMascotState("win");
      setMascotSpeech(language === "es" ? "¡¡BINGO!! ¡Has completado todo el cartón!" : "BINGO!! You cleared the full card!");
      addLog(language === "es" ? `🏆 ¡¡BINGO COBRADO!! +500 Coins.` : `🏆 BINGO CLAIMED!! +500 Coins.`);
      playWinSound();
      window.dispatchEvent(new Event("c8l-screen-shake"));

      // Stop game since card is complete
      stopBingoGame();
    }

    if (newPayout > 0) {
      logGameWin(newPayout);
    }
  };

  const stopBingoGame = () => {
    setIsPlaying(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const logGameWin = (amount: number) => {
    import("../../utils/analytics").then(({ logActivity }) => {
      if (user) {
        logActivity(
          user.uid,
          user.email || "",
          user.displayName || "Streamer",
          "casino_bingo",
          `Ganó ${amount} Coins en C8L Quantum Bingo.`
        );
      }
    }).catch(() => {});
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      audioCtxRef.current?.close().catch(() => {});
    };
  }, []);

  // Calculate marked cells out of 25 (including free center)
  const getMarkedCount = () => {
    let count = 0;
    card.forEach(r => r.forEach(c => {
      if (c.marked) count++;
    }));
    return count;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch max-w-5xl mx-auto font-mono text-left">
      
      {/* ── LEFT: Bingo Card 5x5 Grid ── */}
      <div className="lg:col-span-7 border-[3px] border-black bg-black rounded-3xl p-5 relative shadow-[6px_6px_0px_#00F3FF] flex flex-col gap-4 overflow-hidden c8l-scanlines">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,_rgba(0,243,255,0.02)_50%)] bg-[size:100%_4px] pointer-events-none" />
        
        {/* Card header */}
        <div className="flex justify-between items-center text-[10px] text-zinc-400 uppercase tracking-widest border-b border-white/10 pb-2 z-10 font-bold">
          <span>🎟️ C8L Quantum Bingo Card</span>
          <span>Marcados: <span className="text-[#00F3FF] font-black">{getMarkedCount()}/25</span></span>
        </div>

        {/* 5x5 Table Layout */}
        <div className="flex-1 flex flex-col gap-2 z-10">
          {/* Letters row */}
          <div className="grid grid-cols-5 gap-2 text-center font-display font-black text-2xl py-1">
            <span className="text-rose-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.4)]">B</span>
            <span className="text-purple-400 drop-shadow-[0_0_8px_rgba(168,85,247,0.4)]">I</span>
            <span className="text-[#D4AF37] drop-shadow-[0_0_8px_rgba(212,175,55,0.4)]">N</span>
            <span className="text-[#00F3FF] drop-shadow-[0_0_8px_rgba(0,243,255,0.4)]">G</span>
            <span className="text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.4)]">O</span>
          </div>

          {/* Grid Cells */}
          <div className="grid grid-cols-5 gap-2">
            {card.map((row, rIdx) => 
              row.map((cell, cIdx) => {
                const isFree = cell.val === "FREE";
                return (
                  <button
                    key={`${rIdx}-${cIdx}`}
                    onClick={() => handleCellClick(rIdx, cIdx)}
                    disabled={!isPlaying || cell.marked || isFree}
                    className={`aspect-square flex flex-col items-center justify-center border-2 border-zinc-800 rounded-xl transition-all font-bold text-xl cursor-pointer ${
                      cell.marked 
                        ? "bg-gradient-to-br from-purple-950/70 to-rose-950/70 border-purple-500 text-white shadow-[inset_0_0_12px_rgba(168,85,247,0.4)]" 
                        : "bg-zinc-900/90 text-zinc-300 hover:border-zinc-500 hover:text-white"
                    } relative overflow-hidden`}
                  >
                    {isFree ? (
                      <>
                        <span className="text-xs text-[#D4AF37] leading-none">★</span>
                        <span className="text-[8px] text-[#D4AF37] font-black uppercase mt-0.5">Free</span>
                      </>
                    ) : (
                      <span>{typeof cell.val === "number" && cell.val < 10 ? `0${cell.val}` : cell.val}</span>
                    )}

                    {/* Dot on marked */}
                    {cell.marked && !isFree && (
                      <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse shadow-[0_0_6px_#FF0055]" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Console logs */}
        <div className="bg-[#050506] border-3 border-black rounded-xl p-2 h-[60px] overflow-y-auto font-mono text-[9px] text-zinc-500 flex flex-col gap-1 text-left relative z-10 shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)]">
          {logs.map((log, i) => (
            <p key={i} className={i === 0 ? "text-[#00F3FF] font-bold" : ""}>
              ▶ {log}
            </p>
          ))}
        </div>

      </div>

      {/* ── RIGHT: Ball Machine & Bets Console ── */}
      <div className="lg:col-span-5 border-[3px] border-black bg-[#0d0d0e] p-6 rounded-3xl shadow-[6px_6px_0px_#D4AF37] flex flex-col justify-between h-full text-left c8l-scanlines relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,_rgba(212,175,55,0.02)_50%)] bg-[size:100%_4px] pointer-events-none" />

        <div className="relative z-10 flex flex-col gap-5">
          <div className="border-b border-white/5 pb-3 flex justify-between items-center">
            <div>
              <span className="text-[9px] text-zinc-500 uppercase tracking-widest block">75 Ball Machine</span>
              <h3 className="font-heading font-black text-lg text-[#D4AF37] uppercase">Quantum Bingo</h3>
            </div>
            <div className="flex items-center gap-1 px-3 py-1 bg-black border-2 border-black text-[10px] rounded-full text-[#D4AF37] shadow-[2.5px_2.5px_0px_#D4AF37] font-bold">
              <Coins size={12} />
              <span>{c8lCoins} Coins</span>
            </div>
          </div>

          {/* Ball Machine Display */}
          <div className="flex flex-col items-center py-2">
            <div className="relative w-24 h-24 flex items-center justify-center bg-zinc-950 rounded-full border-2 border-cyan-500/35 mb-4 shadow-[0_0_20px_rgba(0,243,255,0.1)]">
              {/* Spinning dashes */}
              {isPlaying && (
                <div className="absolute inset-[-4px] border-2 border-dashed border-cyan-400 rounded-full animate-spin" style={{ animationDuration: "12s" }} />
              )}
              {currentBall ? (
                <div className="text-center font-display font-black leading-none text-white">
                  <span className="block text-xs uppercase text-cyan-400">{getBallLetter(currentBall)}</span>
                  <span className="block text-4xl mt-0.5">{currentBall}</span>
                </div>
              ) : (
                <span className="text-[10px] text-zinc-600 uppercase tracking-widest text-center px-2">Offline</span>
              )}
            </div>

            {/* Recents list */}
            <div className="flex gap-1.5 h-7 items-center justify-center">
              {drawnBalls.slice(1, 6).map((b, idx) => (
                <div
                  key={"rec-" + idx}
                  className={`w-7 h-7 rounded-full border flex items-center justify-center font-mono text-[9px] font-black ${getBallColor(b)}`}
                >
                  {getBallLetter(b)}{b}
                </div>
              ))}
            </div>
          </div>

          {/* Interactive controls */}
          <div className="flex flex-col gap-3">
            {/* Auto mark toggle */}
            <label className="flex items-center gap-3 cursor-pointer p-3 bg-black/40 border border-zinc-800/80 rounded-xl hover:bg-black/60 transition">
              <input
                type="checkbox"
                checked={autoMark}
                onChange={e => setAutoMark(e.target.checked)}
                className="rounded border-zinc-800 bg-zinc-950 text-[#00F3FF] focus:ring-[#00F3FF] focus:ring-offset-black"
              />
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Marcado Automático</span>
            </label>

            {/* Start CTA */}
            {!isPlaying ? (
              <button
                onClick={handleStartBingo}
                className="w-full py-3.5 bg-gradient-to-r from-[#FF0055] to-[#D4AF37] text-black font-heading font-black text-xs uppercase tracking-widest rounded-xl hover:brightness-110 transition shadow-[3px_3px_0px_#000000] border-2 border-black cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Play size={12} />
                <span>Comprar Cartón (15 Coins)</span>
              </button>
            ) : (
              <button
                onClick={stopBingoGame}
                className="w-full py-3 bg-zinc-900 border-2 border-black text-zinc-500 rounded-xl text-xs font-black uppercase tracking-widest text-center cursor-pointer hover:text-white"
              >
                Detener Tómbola
              </button>
            )}
          </div>

          {/* Lion Mascot Speech */}
          <div className="bg-black/40 border border-zinc-800/50 rounded-xl p-2.5 flex items-center gap-3">
            <LionMascot state={mascotState} size={50} />
            <p className="flex-1 text-[9px] text-zinc-400 italic font-mono leading-relaxed">
              {mascotSpeech || (language === "es" ? "El león dice: 'Compra un cartón de bingo para entrar al sorteo...'" : "The lion says: 'Buy a card to enter the tómbola...'")}
            </p>
          </div>
        </div>

        {/* Bottom indicators */}
        <div className="border-t border-white/5 pt-3 mt-4 text-[9px] text-zinc-500 font-bold uppercase tracking-wider flex justify-between z-10 relative">
          <span>Ticket: #B{drawnBalls.length}</span>
          <span>Lines completed: {wonLines.length}</span>
        </div>
      </div>

    </div>
  );
}
