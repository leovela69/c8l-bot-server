"use client";
import React, { useState, useEffect, useRef } from "react";
import { useApp } from "../../context/AppContext";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Coins, Play, RefreshCw,
  Mic, MicOff, Volume2, VolumeX, ShieldAlert, Sparkles, Shuffle, DollarSign,
  MessageSquare, History, X
} from "lucide-react";
import { evaluateBestHand } from "../../lib/poker/handEvaluator";

// Seat percentage coordinates relative to .table-area (matches felt oval shape)
const SEATS = [
  { top: 14, left: 25 },  // 0: Akira (Top-Left)
  { top: 8, left: 50 },   // 1: Kukis (Top-Center)
  { top: 14, left: 75 },  // 2: Yusleny (Top-Right)
  { top: 50, left: 92 },  // 3: Gema (Right)
  { top: 82, left: 72 },  // 4: HUMAN / YOU (Bottom-Right)
  { top: 88, left: 50 },  // 5: Lyz (Bottom-Center)
  { top: 82, left: 28 },  // 6: Artemiss (Bottom-Left)
  { top: 50, left: 8 },   // 7: Alexa (Left)
  { top: 28, left: 10 }   // 8: Casti (Upper-Left)
];

// Bet chip positions (near the table edge, between seat and center)
const BET_POS = [
  { top: 22, left: 32 }, { top: 18, left: 50 }, { top: 22, left: 68 },
  { top: 42, left: 82 }, { top: 72, left: 68 }, { top: 75, left: 50 },
  { top: 72, left: 32 }, { top: 42, left: 18 }, { top: 28, left: 20 }
];

const HUMAN_SEAT_INDEX = 4;

const BOT_CONFIGS = [
  { id: 0, name: "Akira", emoji: "⚡", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150", style: "aggressive", raisePct: 0.60, foldPct: 0.10 },
  { id: 1, name: "Kukis", emoji: "🍪", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=150", style: "balanced", raisePct: 0.20, foldPct: 0.30 },
  { id: 2, name: "Yusleny", emoji: "💎", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=150", style: "tight", raisePct: 0.15, foldPct: 0.60 },
  { id: 3, name: "Gema", emoji: "💫", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=150", style: "aggro-loose", raisePct: 0.50, foldPct: 0.08 },
  { id: 4, name: "Tú", emoji: "🦁", avatar: "", style: "human", raisePct: 0, foldPct: 0 }, // Human Seat (will pull user photoURL/avatar)
  { id: 5, name: "Lyz", emoji: "🌸", avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=150", style: "tight-aggro", raisePct: 0.40, foldPct: 0.45 },
  { id: 6, name: "Artemiss", emoji: "🏹", avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=150", style: "tricky", raisePct: 0.30, foldPct: 0.25 },
  { id: 7, name: "Alexa", emoji: "🔮", avatar: "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?q=80&w=150", style: "passive", raisePct: 0.08, foldPct: 0.20 },
  { id: 8, name: "Casti", emoji: "🔥", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=150", style: "maniac", raisePct: 0.70, foldPct: 0.05 }
];

const PHRASES_WIN = ["¡Fácil!", "¡Soy el mejor!", "¡Gracias por las fichas!", "¡Ja ja ja!", "¡Así se juega!"];
const PHRASES_LOSE = ["Ugh...", "No puede ser", "La próxima será", "Mala suerte...", "¡Rayos!"];
const PHRASES_RAISE = ["¡Te voy a comer!", "¡Atrévete!", "Esto se pone bueno", "¡Vamos con todo!", "A ver si aguantas"];
const PHRASES_FOLD = ["Me rindo...", "Paso esta", "No vale la pena", "Mejor me salgo", "Uf, no gracias"];

interface Seat {
  id: number;
  name: string;
  emoji: string;
  avatar: string;
  style: string;
  raisePct: number;
  foldPct: number;
  chips: number;
  hand: string[];
  folded: boolean;
  allIn: boolean;
  currentBet: number;
  isHuman: boolean;
  evalResult: any;
  lastAction: string;
  speech: string;
  voiceActive: boolean;
  emotion: string;
}

interface ChatMessage {
  sender: string;
  text: string;
  isSystem: boolean;
}

interface HandHistory {
  round: number;
  winners: string;
  hand: string;
  pot: number;
}

interface AnimatedChip {
  id: number;
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  color: string;
}

const SUITS = ["♥️", "♦️", "♣️", "♠️"];
const RANKS = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];
const SHORT_DECK_RANKS = ["6", "7", "8", "9", "10", "J", "Q", "K", "A"];

export default function PokerGame() {
  const { language, c8lCoins, placeCasinoBet, awardCasinoWin, showNotification, user } = useApp();

  // Economic System & Variant Settings
  const [economyMode, setEconomyMode] = useState<"real" | "play">("real");
  const [variant, setVariant] = useState<"texas" | "omaha" | "shortdeck">("texas");
  const [format, setFormat] = useState<"cash" | "mtt" | "spin">("cash");
  const [isVerified, setIsVerified] = useState<boolean>(false);
  const [showVerifyModal, setShowVerifyModal] = useState<boolean>(false);
  const [playMoneyCoins, setPlayMoneyCoins] = useState<number>(10000);
  const [jackpot, setJackpot] = useState<number>(4833221);

  // Spin & Go multiplier state
  const [spinMultiplier, setSpinMultiplier] = useState<number>(2);
  const [isSpinAnimating, setIsSpinAnimating] = useState<boolean>(false);

  // Game Engine State
  const [seats, setSeats] = useState<Seat[]>([]);
  const [communityCards, setCommunityCards] = useState<string[]>([]);
  const [deck, setDeck] = useState<string[]>([]);
  const [pot, setPot] = useState<number>(0);
  const [currentBet, setCurrentBet] = useState<number>(0);
  const [phase, setPhase] = useState<"idle" | "spin_multiplier" | "preflop" | "flop" | "turn" | "river" | "showdown" | "ended">("idle");
  const [turnIdx, setTurnIdx] = useState<number>(-1);
  const [dealerIdx, setDealerIdx] = useState<number>(0);
  const [roundNum, setRoundNum] = useState<number>(0);
  const [firstAction, setFirstAction] = useState<boolean>(true);

  // Blinds Config
  const sbAmt = 25;
  const bbAmt = 50;

  // UI Panels
  const [raiseValue, setRaiseValue] = useState<number>(100);
  const [logs, setLogs] = useState<string[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [history, setHistory] = useState<HandHistory[]>([]);
  const [showChat, setShowChat] = useState<boolean>(false);
  const [showHistory, setShowHistory] = useState<boolean>(false);

  // Toggles and inputs
  const [musicActive, setMusicActive] = useState<boolean>(false);
  const [micActive, setMicActive] = useState<boolean>(false);
  const [speechTranscript, setSpeechTranscript] = useState<string>("");

  // Animated elements
  const [animatedChips, setAnimatedChips] = useState<AnimatedChip[]>([]);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const synthLoopRef = useRef<(() => void) | null>(null);

  // Audio Context initialization helper
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

  // Synthesizer Audio Generator
  const playTone = (freq: number, dur: number, type: OscillatorType = "sine", vol = 0.15) => {
    try {
      const ctx = getAudioCtx();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(vol, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + dur);
    } catch (e) {}
  };

  const sndDeal = () => {
    playTone(800, 0.08, "square", 0.08);
    setTimeout(() => playTone(1000, 0.06, "square", 0.06), 80);
  };
  const sndChip = () => {
    playTone(2000, 0.05, "sine", 0.1);
    setTimeout(() => playTone(2500, 0.04, "sine", 0.08), 50);
  };
  const sndFold = () => playTone(300, 0.15, "triangle", 0.08);
  const sndWin = () => {
    playTone(523, 0.15, "sine", 0.12);
    setTimeout(() => playTone(659, 0.15, "sine", 0.12), 150);
    setTimeout(() => playTone(784, 0.2, "sine", 0.12), 300);
  };
  const sndLose = () => playTone(200, 0.3, "sawtooth", 0.06);

  // Setup Initial Game Lobby
  const initSeats = (balanceReal: number, balancePlay: number) => {
    const isReal = economyMode === "real";
    const initialBalance = isReal ? balanceReal : balancePlay;

    const initialSeats = BOT_CONFIGS.map((bot, i) => {
      const isHuman = i === HUMAN_SEAT_INDEX;
      return {
        id: bot.id,
        name: isHuman ? (user?.displayName || "Tú") : bot.name,
        emoji: bot.emoji,
        avatar: isHuman ? (user?.photoURL || (user as any)?.avatar || "🦁") : bot.avatar,
        style: bot.style,
        raisePct: bot.raisePct,
        foldPct: bot.foldPct,
        chips: isHuman ? initialBalance : 10000,
        hand: [] as string[],
        folded: false,
        allIn: false,
        currentBet: 0,
        isHuman,
        evalResult: null,
        lastAction: "",
        speech: "",
        voiceActive: false,
        emotion: ""
      };
    });

    setSeats(initialSeats);
  };

  useEffect(() => {
    initSeats(c8lCoins, playMoneyCoins);
    addLog(language === "es" ? "♦️ Selecciona tu modo y pulsa REPARTIR para jugar." : "♦️ Select your mode and press DEAL to play.");
    addChatMessage("", language === "es" ? "Bienvenido a la mesa de póker C8L. Pulsa REPARTIR." : "Welcome to the C8L poker table. Press DEAL.", true);
  }, [economyMode, c8lCoins, playMoneyCoins]);

  // Logs and Chat helpers
  const addLog = (msg: string) => {
    setLogs(prev => [msg, ...prev].slice(0, 10));
  };

  const addChatMessage = (sender: string, text: string, isSystem = false) => {
    setChatMessages(prev => [...prev, { sender, text, isSystem }].slice(-50));
  };

  // Synthesizer Audio Background Theme Loop (High Tension Techno)
  useEffect(() => {
    if (!musicActive) {
      if (synthLoopRef.current) {
        synthLoopRef.current();
        synthLoopRef.current = null;
      }
      return;
    }

    const ctx = getAudioCtx();
    if (!ctx) return;

    let step = 0;
    const interval = setInterval(() => {
      try {
        if (ctx.state === "suspended") return;
        
        // Deep techno kick drum on beat 1 and 3
        if (step % 4 === 0) {
          const kick = ctx.createOscillator();
          const gain = ctx.createGain();
          kick.frequency.setValueAtTime(100, ctx.currentTime);
          kick.frequency.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
          gain.gain.setValueAtTime(0.1, ctx.currentTime);
          gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.35);
          kick.connect(gain);
          gain.connect(ctx.destination);
          kick.start();
          kick.stop(ctx.currentTime + 0.35);
        }

        // Bass synthesizer progression
        if (step % 8 === 0 || step % 8 === 4) {
          const bass = ctx.createOscillator();
          const gain = ctx.createGain();
          const filter = ctx.createBiquadFilter();
          
          bass.type = "sawtooth";
          const notes = [55, 65.4, 49, 43.6]; // A1, C2, G1, F1
          const freq = notes[Math.floor(step / 8) % notes.length];
          bass.frequency.setValueAtTime(freq, ctx.currentTime);
          
          filter.type = "lowpass";
          filter.frequency.setValueAtTime(200, ctx.currentTime);
          
          gain.gain.setValueAtTime(0.03, ctx.currentTime);
          gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 1.2);
          
          bass.connect(filter);
          filter.connect(gain);
          gain.connect(ctx.destination);
          bass.start();
          bass.stop(ctx.currentTime + 1.2);
        }

        step = (step + 1) % 32;
      } catch (e) {}
    }, 280);

    synthLoopRef.current = () => clearInterval(interval);

    return () => {
      if (synthLoopRef.current) {
        synthLoopRef.current();
      }
    };
  }, [musicActive]);

  // Web Speech API Voice Recognition
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    let recognition: any = null;
    if (micActive && phase !== "idle" && phase !== "ended" && turnIdx === HUMAN_SEAT_INDEX) {
      recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.lang = language === "es" ? "es-ES" : "en-US";

      recognition.onresult = (event: any) => {
        const text = event.results[event.results.length - 1][0].transcript.toLowerCase().trim();
        setSpeechTranscript(text);
        
        if (text.includes("check") || text.includes("paso")) {
          const toCall = currentBet - (seats[HUMAN_SEAT_INDEX]?.currentBet || 0);
          if (toCall === 0) playerCallOrCheck(0); // Represent Check
        } else if (text.includes("call") || text.includes("igualo") || text.includes("pago") || text.includes("igualar")) {
          const toCall = currentBet - (seats[HUMAN_SEAT_INDEX]?.currentBet || 0);
          if (toCall > 0) playerCallOrCheck(toCall);
        } else if (text.includes("fold") || text.includes("me retiro") || text.includes("retiro") || text.includes("no voy")) {
          playerFold();
        } else if (text.includes("all-in") || text.includes("all in") || text.includes("envite") || text.includes("todo")) {
          playerAllIn();
        }
      };

      recognition.start();
    }

    return () => {
      if (recognition) recognition.stop();
    };
  }, [micActive, turnIdx, phase, language, currentBet, seats]);

  // Animation helper
  const animateChipThrow = (fromIdx: number) => {
    sndChip();
    const newChip = {
      id: Math.random(),
      startX: SEATS[fromIdx].left,
      startY: SEATS[fromIdx].top,
      targetX: 50,
      targetY: 42,
      color: fromIdx === HUMAN_SEAT_INDEX ? "#C9A227" : "#00bcd4"
    };
    setAnimatedChips(prev => [...prev, newChip]);
    setTimeout(() => {
      setAnimatedChips(prev => prev.filter(c => c.id !== newChip.id));
    }, 700);
  };

  // Generate Rules-Compliant Deck
  const buildDeck = (): string[] => {
    const isShortDeck = variant === "shortdeck";
    const ranksToUse = isShortDeck ? SHORT_DECK_RANKS : RANKS;
    const newDeck: string[] = [];
    for (const suit of SUITS) {
      for (const rank of ranksToUse) {
        newDeck.push(rank + suit);
      }
    }
    // Fisher-Yates shuffle
    const shuffled = [...newDeck];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // Start round deal stakes
  const handleDeal = async () => {
    const isReal = economyMode === "real";
    
    if (isReal && !isVerified) {
      setShowVerifyModal(true);
      return;
    }

    const cost = format === "spin" ? 50 : 10;
    const userBalance = isReal ? c8lCoins : playMoneyCoins;
    
    if (userBalance < cost) {
      showNotification(
        language === "es" ? "Acceso denegado: Balance de Coins insuficiente." : "Access Denied: Insufficient Coins balance.",
        "error"
      );
      return;
    }

    // Deduct coins from balance
    if (isReal) {
      const success = await placeCasinoBet(cost);
      if (!success) return;
    } else {
      setPlayMoneyCoins(prev => prev - cost);
    }

    if (format === "spin") {
      setIsSpinAnimating(true);
      setPhase("spin_multiplier");
      playTone(400, 0.5, "square", 0.05);
      
      let rolls = 0;
      const mults = [2, 3, 5, 10, 50, 100, 1000];
      const spinInterval = setInterval(() => {
        const tempMult = mults[Math.floor(Math.random() * mults.length)];
        setSpinMultiplier(tempMult);
        playTone(600 + tempMult, 0.05, "sine", 0.03);
        rolls++;
        if (rolls > 12) {
          clearInterval(spinInterval);
          // multiplier weights (mostly 2x - 5x)
          const rand = Math.random();
          let finalMult = 2;
          if (rand > 0.98) finalMult = 1000;
          else if (rand > 0.95) finalMult = 100;
          else if (rand > 0.88) finalMult = 10;
          else if (rand > 0.70) finalMult = 5;
          else if (rand > 0.40) finalMult = 3;
          
          setSpinMultiplier(finalMult);
          setIsSpinAnimating(false);
          addLog(language === "es" ? `🌀 ¡Multiplicador Spin: ${finalMult}x! Bote: ${cost * 3 * finalMult} Coins.` : `🌀 Spin Multiplier: ${finalMult}x! Pot: ${cost * 3 * finalMult} Coins.`);
          startHand(finalMult);
        }
      }, 150);
    } else {
      startHand(1);
    }
  };

  const startHand = (multiplier = 1) => {
    sndDeal();
    const freshDeck = buildDeck();
    const nextRound = roundNum + 1;
    setRoundNum(nextRound);

    const holeCount = variant === "omaha" ? 4 : 2;
    let initialPot = 0;

    const initialSeats = seats.map((seat, i) => {
      // Deal cards
      const hand: string[] = [];
      for (let c = 0; c < holeCount; c++) {
        hand.push(freshDeck.pop()!);
      }

      // Blinds contribution
      let currentBetVal = 0;
      if (i === (dealerIdx + 1) % 9) {
        currentBetVal = Math.min(sbAmt, seat.chips);
      } else if (i === (dealerIdx + 2) % 9) {
        currentBetVal = Math.min(bbAmt, seat.chips);
      }

      initialPot += currentBetVal;
      if (currentBetVal > 0) {
        animateChipThrow(i);
      }

      return {
        ...seat,
        hand,
        folded: seat.chips <= 0,
        allIn: false,
        currentBet: currentBetVal,
        chips: seat.chips - currentBetVal,
        lastAction: currentBetVal === sbAmt ? "SB" : (currentBetVal === bbAmt ? "BB" : ""),
        speech: "",
        emotion: ""
      };
    });

    const cost = format === "spin" ? 50 : 10;
    const finalPot = format === "spin" ? cost * 3 * multiplier : initialPot;

    setDeck(freshDeck);
    setCommunityCards([]);
    setPot(finalPot);
    setCurrentBet(bbAmt);
    setFirstAction(true);
    setSeats(initialSeats);
    setPhase("preflop");

    const utgIdx = (dealerIdx + 3) % 9;
    setTurnIdx(utgIdx);
    addLog(language === "es" ? `🟢 Pre-flop (Ronda ${nextRound}). Variante: ${variant.toUpperCase()}` : `🟢 Pre-flop (Round ${nextRound}). Variant: ${variant.toUpperCase()}`);
    addChatMessage("", `--- RONDA ${nextRound} ---`, true);
  };

  // Turn Runner
  useEffect(() => {
    if (phase === "idle" || phase === "showdown" || phase === "ended" || turnIdx === -1) return;

    const currentSeat = seats[turnIdx];
    if (!currentSeat || currentSeat.folded || currentSeat.allIn || currentSeat.chips <= 0) {
      advanceTurn();
      return;
    }

    if (!currentSeat.isHuman) {
      // Bot Acts
      const botTimer = setTimeout(() => {
        runBotDecision(turnIdx);
      }, 1000);
      return () => clearTimeout(botTimer);
    }
  }, [turnIdx, phase]);

  const activeCount = (currentSeats = seats) => currentSeats.filter(p => !p.folded).length;

  const advanceTurn = (currentSeats = seats) => {
    if (activeCount(currentSeats) <= 1) {
      concludeHand(currentSeats);
      return;
    }

    let nextIdx = (turnIdx + 1) % 9;
    let attempts = 0;
    while ((currentSeats[nextIdx].folded || currentSeats[nextIdx].allIn || currentSeats[nextIdx].chips <= 0) && attempts < 9) {
      nextIdx = (nextIdx + 1) % 9;
      attempts++;
    }

    if (attempts >= 9) {
      progressStreet(currentSeats);
      return;
    }

    // Check if betting round is completed
    const playable = currentSeats.filter(p => !p.folded && !p.allIn && p.chips > 0);
    const matchedAll = playable.every(p => p.currentBet === currentBet);

    if (!firstAction && matchedAll) {
      progressStreet(currentSeats);
    } else {
      setFirstAction(false);
      setTurnIdx(nextIdx);
    }
  };

  // Bot Decision Logic
  const runBotDecision = (idx: number) => {
    const bot = seats[idx];
    const toCall = currentBet - bot.currentBet;
    const r = Math.random();
    
    // Simple strength evaluator
    const evalRes = evaluateBestHand([...bot.hand, ...communityCards], variant);
    const strength = evalRes.rankValue / 10.0; // 0.1 to 1.0

    let action: "fold" | "call" | "raise" = "call";
    if (strength < 0.25 && r < bot.foldPct && toCall > 0) {
      action = "fold";
    } else if (r > (1 - bot.raisePct) || strength > 0.55) {
      action = "raise";
    } else {
      action = "call";
    }

    const updatedSeats = [...seats];
    const target = updatedSeats[idx];

    if (action === "fold") {
      target.folded = true;
      target.lastAction = "FOLD";
      target.emotion = "😢";
      target.speech = randomPhrase(PHRASES_FOLD);
      sndFold();
      addLog(`🔴 ${target.name} se retira (Fold).`);
      addChatMessage(target.name, target.speech);
    } else if (action === "raise" && target.chips > toCall) {
      const raiseAmt = Math.min(bbAmt * (2 + Math.floor(Math.random() * 3)), target.chips - toCall);
      const totalCost = toCall + raiseAmt;

      target.chips -= totalCost;
      target.currentBet += totalCost;
      target.lastAction = `RAISE +${raiseAmt}`;
      target.speech = randomPhrase(PHRASES_RAISE);
      target.emotion = "😈";

      animateChipThrow(idx);
      setPot(prev => prev + totalCost);
      const newMaxBet = target.currentBet;
      setCurrentBet(newMaxBet);
      addLog(`🟡 ${target.name} sube la apuesta a ${newMaxBet}.`);
      addChatMessage(target.name, target.speech);
    } else {
      // Call or Check
      const callAmt = Math.min(toCall, target.chips);
      target.chips -= callAmt;
      target.currentBet += callAmt;
      target.lastAction = toCall > 0 ? "CALL" : "CHECK";
      target.emotion = toCall > 0 ? "😐" : "😊";
      
      if (callAmt > 0) {
        animateChipThrow(idx);
        setPot(prev => prev + callAmt);
        addLog(`🔵 ${target.name} iguala la apuesta (${callAmt}).`);
      } else {
        addLog(`⚪ ${target.name} pasa (Check).`);
      }
      if (target.chips === 0) target.allIn = true;
    }

    // trigger brief voice animation
    target.voiceActive = true;
    setTimeout(() => {
      setSeats(prev => prev.map(s => s.id === idx ? { ...s, voiceActive: false } : s));
    }, 1800);

    setSeats(updatedSeats);
    setFirstAction(false);
    advanceTurn(updatedSeats);
  };

  // Player action triggers
  const playerCallOrCheck = (toCall: number) => {
    const updatedSeats = [...seats];
    const me = updatedSeats[HUMAN_SEAT_INDEX];

    if (toCall > 0) {
      const actualCall = Math.min(toCall, me.chips);
      me.chips -= actualCall;
      me.currentBet += actualCall;
      me.lastAction = "CALL";
      me.emotion = "😐";
      animateChipThrow(HUMAN_SEAT_INDEX);
      setPot(prev => prev + actualCall);
      addLog(language === "es" ? `🔵 Igualas la apuesta (${actualCall} Coins).` : `🔵 You call (${actualCall} Coins).`);
    } else {
      me.lastAction = "CHECK";
      me.emotion = "😊";
      addLog(language === "es" ? "⚪ Pasas (Check)." : "⚪ You check.");
    }

    if (me.chips === 0) me.allIn = true;
    setSeats(updatedSeats);
    setFirstAction(false);
    advanceTurn(updatedSeats);
  };

  const playerRaise = () => {
    const toCall = currentBet - seats[HUMAN_SEAT_INDEX].currentBet;
    if (raiseValue > seats[HUMAN_SEAT_INDEX].chips - toCall) {
      showNotification(language === "es" ? "Balance de Coins insuficiente." : "Insufficient Coins balance.", "error");
      return;
    }

    const updatedSeats = [...seats];
    const me = updatedSeats[HUMAN_SEAT_INDEX];
    const totalCost = toCall + raiseValue;

    me.chips -= totalCost;
    me.currentBet += totalCost;
    me.lastAction = `RAISE +${raiseValue}`;
    me.emotion = "😎";

    animateChipThrow(HUMAN_SEAT_INDEX);
    setPot(prev => prev + totalCost);
    const newBet = me.currentBet;
    setCurrentBet(newBet);
    
    addLog(language === "es" ? `🟡 Subes la apuesta a ${newBet} Coins.` : `🟡 You raise the bet to ${newBet} Coins.`);
    if (me.chips === 0) me.allIn = true;

    setSeats(updatedSeats);
    setFirstAction(false);
    advanceTurn(updatedSeats);
  };

  const playerAllIn = () => {
    const updatedSeats = [...seats];
    const me = updatedSeats[HUMAN_SEAT_INDEX];
    const total = me.chips;

    me.currentBet += total;
    me.chips = 0;
    me.allIn = true;
    me.lastAction = "ALL-IN";
    me.emotion = "🔥";

    animateChipThrow(HUMAN_SEAT_INDEX);
    setPot(prev => prev + total);
    
    if (me.currentBet > currentBet) {
      setCurrentBet(me.currentBet);
    }
    
    addLog(language === "es" ? "🔥 ¡All-In colocado!" : "🔥 All-In placed!");
    setSeats(updatedSeats);
    setFirstAction(false);
    advanceTurn(updatedSeats);
  };

  const playerFold = () => {
    const updatedSeats = [...seats];
    const me = updatedSeats[HUMAN_SEAT_INDEX];
    me.folded = true;
    me.lastAction = "FOLD";
    me.emotion = "😢";
    sndFold();
    
    addLog(language === "es" ? "🔴 Te retiras de la mano." : "🔴 You fold.");
    setSeats(updatedSeats);
    setFirstAction(false);
    advanceTurn(updatedSeats);
  };

  // Progress to next street (Flop, Turn, River)
  const progressStreet = (currentSeats: Seat[]) => {
    // Reset round bets
    const resetSeats = currentSeats.map(s => ({ ...s, currentBet: 0, lastAction: "" }));
    setCurrentBet(0);
    setFirstAction(true);

    sndDeal();

    if (phase === "preflop") {
      const deckCopy = [...deck];
      deckCopy.pop(); // burn card
      const f1 = deckCopy.pop()!;
      const f2 = deckCopy.pop()!;
      const f3 = deckCopy.pop()!;
      setDeck(deckCopy);
      setCommunityCards([f1, f2, f3]);
      setPhase("flop");
      addLog(language === "es" ? `🟡 Flop: ${f1} ${f2} ${f3}` : `🟡 Flop: ${f1} ${f2} ${f3}`);
      addChatMessage("", "--- FLOP ---", true);
      setSeats(resetSeats);
      setTurnIdx((dealerIdx + 1) % 9);
    } else if (phase === "flop") {
      const deckCopy = [...deck];
      deckCopy.pop(); // burn
      const t1 = deckCopy.pop()!;
      setDeck(deckCopy);
      setCommunityCards(prev => [...prev, t1]);
      setPhase("turn");
      addLog(language === "es" ? `🟡 Turn: ${t1}` : `🟡 Turn: ${t1}`);
      addChatMessage("", "--- TURN ---", true);
      setSeats(resetSeats);
      setTurnIdx((dealerIdx + 1) % 9);
    } else if (phase === "turn") {
      const deckCopy = [...deck];
      deckCopy.pop(); // burn
      const r1 = deckCopy.pop()!;
      setDeck(deckCopy);
      setCommunityCards(prev => [...prev, r1]);
      setPhase("river");
      addLog(language === "es" ? `🟡 River: ${r1}` : `🟡 River: ${r1}`);
      addChatMessage("", "--- RIVER ---", true);
      setSeats(resetSeats);
      setTurnIdx((dealerIdx + 1) % 9);
    } else if (phase === "river") {
      performShowdown(resetSeats);
    }
  };

  // Showdown hand evaluations
  const performShowdown = async (showdownSeats: Seat[]) => {
    setPhase("showdown");
    setTurnIdx(-1);
    addLog(language === "es" ? "🎭 Showdown: ¡Se revelan las cartas!" : "🎭 Showdown: Cards revealed!");
    addChatMessage("", "--- SHOWDOWN ---", true);

    const contenders = showdownSeats.filter(p => !p.folded);
    
    // Evaluate hands using our handEvaluator
    const evaluatedContenders = contenders.map(p => {
      const evResult = evaluateBestHand([...p.hand, ...communityCards], variant);
      return {
        ...p,
        evalResult: evResult
      };
    });

    // Find winners
    let bestResult = evaluatedContenders[0].evalResult;
    let winnerIds = [evaluatedContenders[0].id];

    for (let i = 1; i < evaluatedContenders.length; i++) {
      const curResult = evaluatedContenders[i].evalResult;
      if (curResult.score > bestResult.score) {
        bestResult = curResult;
        winnerIds = [evaluatedContenders[i].id];
      } else if (curResult.score === bestResult.score) {
        winnerIds.push(evaluatedContenders[i].id);
      }
    }

    const share = Math.floor(pot / winnerIds.length);
    const winNames = winnerIds.map(wid => BOT_CONFIGS[wid].name).join(", ");

    const payoutSeats = showdownSeats.map(seat => {
      const isWinner = winnerIds.includes(seat.id);
      const ev = evaluatedContenders.find(c => c.id === seat.id)?.evalResult;
      
      if (isWinner) {
        return {
          ...seat,
          chips: seat.chips + share,
          lastAction: "WINNER",
          emotion: "🎉",
          speech: ev ? (language === "es" ? `¡Gano con ${ev.rankName}! (${ev.description})` : `I win with ${ev.rankName}! (${ev.description})`) : randomPhrase(PHRASES_WIN)
        };
      } else {
        return {
          ...seat,
          folded: seat.folded,
          emotion: seat.folded ? "" : "😢",
          speech: seat.folded ? "" : randomPhrase(PHRASES_LOSE)
        };
      }
    });

    setPot(0);
    setSeats(payoutSeats);
    setPhase("ended");

    // Award wins
    if (winnerIds.includes(HUMAN_SEAT_INDEX)) {
      sndWin();
      if (economyMode === "real") {
        await awardCasinoWin(share);
      } else {
        setPlayMoneyCoins(prev => prev + share);
      }
      addLog(language === "es" ? `🏆 ¡Felicidades! Ganaste ${share} Coins.` : `🏆 Congratulations! You won ${share} Coins.`);
      addChatMessage("Sistema", `Felicidades a Tú por ganar ${share} Coins.`, true);
    } else {
      sndLose();
      addLog(language === "es" ? `🔴 El bote es para: ${winNames} (+${share}).` : `🔴 The pot goes to: ${winNames} (+${share}).`);
      addChatMessage("Sistema", `El bote de ${share} es para ${winNames}.`, true);
    }

    // Accumulate Jackpot
    setJackpot(prev => prev + Math.floor(Math.random() * 45) + 12);

    // Save to history
    setHistory(prev => [
      {
        round: roundNum,
        winners: winNames,
        hand: bestResult.rankName,
        pot: share
      },
      ...prev
    ].slice(0, 20));

    // Auto trigger new round
    setTimeout(() => {
      setDealerIdx(prev => (prev + 1) % 9);
      setPhase("ended");
    }, 4500);
  };

  // Conclude hand when all fold except 1
  const concludeHand = async (concludeSeats: Seat[]) => {
    setPhase("ended");
    setTurnIdx(-1);
    const winner = concludeSeats.find(p => !p.folded);
    
    if (!winner) return;

    const payoutSeats = concludeSeats.map(seat => {
      if (seat.id === winner.id) {
        return {
          ...seat,
          chips: seat.chips + pot,
          lastAction: "WINNER",
          emotion: "🎉",
          speech: randomPhrase(PHRASES_WIN)
        };
      } else {
        return seat;
      }
    });

    setPot(0);
    setSeats(payoutSeats);

    if (winner.id === HUMAN_SEAT_INDEX) {
      sndWin();
      if (economyMode === "real") {
        await awardCasinoWin(pot);
      } else {
        setPlayMoneyCoins(prev => prev + pot);
      }
      addLog(language === "es" ? `🏆 Todos se retiraron. Te llevas el bote (${pot} Coins).` : `🏆 All folded. You win the pot (${pot} Coins).`);
    } else {
      sndLose();
      addLog(language === "es" ? `🔴 Todos se retiraron. El bote de ${pot} es para ${winner.name}.` : `🔴 All folded. Pot of ${pot} goes to ${winner.name}.`);
    }

    setHistory(prev => [
      {
        round: roundNum,
        winners: winner.name,
        hand: "Sin Showdown",
        pot
      },
      ...prev
    ].slice(0, 20));

    setTimeout(() => {
      setDealerIdx(prev => (prev + 1) % 9);
      setPhase("ended");
    }, 3500);
  };

  const startNewHand = () => {
    setPhase("idle");
    setCommunityCards([]);
    setCurrentBet(0);
    setTurnIdx(-1);
    initSeats(economyMode === "real" ? c8lCoins : playMoneyCoins, playMoneyCoins);
    addLog(language === "es" ? "🎴 Mesa lista. ¡Haz tu apuesta!" : "🎴 Table ready. Place your bet!");
  };

  const handleFreeRefill = () => {
    if (playMoneyCoins > 0) return;
    setPlayMoneyCoins(10000);
    setSeats(prev => prev.map(s => s.isHuman ? { ...s, chips: 10000 } : s));
    sndWin();
    showNotification(language === "es" ? "🎁 ¡Recarga de 10,000 Coins de cortesía!" : "🎁 Daily 10,000 Coins refill!", "success");
  };

  const handleVerifyAccount = () => {
    setIsVerified(true);
    setShowVerifyModal(false);
    showNotification(language === "es" ? "✅ Cuenta autorizada para Dinero Real." : "✅ Account authorized for Real Money.", "success");
  };

  const randomPhrase = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];

  return (
    <div className="flex flex-col items-center gap-6 max-w-6xl mx-auto w-full select-none text-[#f0e6d0]">
      <style dangerouslySetInnerHTML={{ __html: `
        .table-area {
          position: relative;
          width: 100%;
          height: 480px;
          margin: 0 auto;
        }
        .table-outer {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 76%;
          height: 80%;
          border-radius: 50%/44%;
          background: linear-gradient(180deg, #222 0%, #151515 30%, #0a0a0a 60%, #151515 100%);
          padding: 12px;
          box-shadow: 0 0 0 3px #333, 0 0 0 6px #1a1a1a, 0 0 40px rgba(0,188,212,0.25), 0 25px 80px rgba(0,0,0,0.9), inset 0 1px 3px rgba(255,255,255,0.08);
        }
        .table-felt {
          width: 100%;
          height: 100%;
          border-radius: 50%/44%;
          position: relative;
          overflow: hidden;
          background: radial-gradient(ellipse at 50% 30%, #1f7878 0%, #176565 20%, #115555 40%, #0c4545 60%, #083838 80%, #052d2d 100%);
          box-shadow: inset 0 0 40px rgba(0,0,0,0.4), inset 0 0 100px rgba(0,0,0,0.3);
        }
        .table-felt::before {
          content: '';
          position: absolute;
          top: 0;
          left: 20%;
          right: 20%;
          height: 40%;
          border-radius: 0 0 50% 50%;
          background: radial-gradient(ellipse at 50% 0%, rgba(0,220,220,0.08) 0%, transparent 70%);
          pointer-events: none;
        }
        .table-felt::after {
          content: '';
          position: absolute;
          top: 15%;
          left: 12%;
          right: 12%;
          bottom: 15%;
          border-radius: 50%/45%;
          border: 1.5px solid rgba(0,188,212,0.1);
          pointer-events: none;
        }
        .table-logo-decal {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          opacity: 0.08;
          pointer-events: none;
          width: 120px;
          height: 120px;
          object-fit: contain;
        }
        .seat {
          position: absolute;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
          transition: all 0.4s;
          z-index: 20;
        }
        .seat.folded {
          opacity: 0.35;
          filter: grayscale(0.7);
        }
        .seat.active-turn .seat-avatar-ring {
          box-shadow: 0 0 14px 4px #00F3FF, 0 0 28px 8px rgba(0,243,255,0.3);
          border-color: #00F3FF;
          animation: turnPulse 1.2s infinite;
        }
        .seat.active-turn .turn-indicator-label {
          display:block;
        }
        .seat.winner .seat-avatar-ring {
          box-shadow: 0 0 20px 8px #ffd700;
          animation: winPulse 0.8s infinite alternate;
        }
        @keyframes turnPulse {
          0% { box-shadow: 0 0 14px 4px #00F3FF, 0 0 28px 8px rgba(0,243,255,0.3) }
          50% { box-shadow: 0 0 20px 8px #00F3FF, 0 0 40px 12px rgba(0,243,255,0.5) }
          100% { box-shadow: 0 0 14px 4px #00F3FF, 0 0 28px 8px rgba(0,243,255,0.3) }
        }
        @keyframes winPulse {
          0% { box-shadow: 0 0 20px 6px #ffd700 }
          100% { box-shadow: 0 0 30px 12px #ffec80 }
        }
        .turn-indicator-label {
          display: none;
          position: absolute;
          bottom: -16px;
          left: 50%;
          transform: translateX(-50%);
          background: linear-gradient(135deg, #00F3FF, #0088cc);
          color: #000;
          font-size: 10px;
          font-family: monospace;
          font-weight: 900;
          padding: 1px 6px;
          border-radius: 6px;
          white-space: nowrap;
          animation: turnBlink 0.8s infinite alternate;
          letter-spacing: 0.5px;
          z-index: 30;
        }
        @keyframes turnBlink {
          0% { opacity: 1 }
          100% { opacity: 0.6 }
        }
        .seat-avatar-ring {
          width: 52px;
          height: 52px;
          border-radius: 50%;
          background: rgba(20, 15, 10, 0.95);
          border: 3px solid #444;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
          transition: all 0.3s;
        }
        .seat-avatar-ring.human-avatar {
          border-color: #C9A227;
          box-shadow: 0 0 8px rgba(201, 162, 39, 0.3);
        }
        .seat-avatar-ring img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 50%;
        }
        .seat-marker-badge {
          position: absolute;
          top: -4px;
          right: -4px;
          font-size: 7px;
          font-family: monospace;
          background: #C9A227;
          color: #000;
          border-radius: 50%;
          width: 16px;
          height: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 900;
          border: 1px solid #000;
          box-shadow: 0 2px 4px rgba(0,0,0,0.5);
          z-index: 25;
        }
        .seat-marker-badge.sb { background: #42a5f5; color: #fff }
        .seat-marker-badge.bb { background: #ef5350; color: #fff }
        .seat-name {
          font-size: 10px;
          background: rgba(0, 0, 0, 0.8);
          border-radius: 4px;
          padding: 1px 6px;
          border: 1px solid #222;
          white-space: nowrap;
          max-width: 80px;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .seat-cards {
          display: flex;
          gap: 2px;
          min-height: 40px;
          align-items: center;
          margin-top: 1px;
        }
        .seat-chips {
          font-size: 9px;
          color: #C9A227;
          font-weight: 700;
          font-family: monospace;
          text-shadow: 0 1px 2px rgba(0,0,0,0.9);
        }
        .seat-bet-disp {
          position: absolute;
          font-size: 9px;
          font-family: monospace;
          color: #fff;
          background: rgba(0, 0, 0, 0.85);
          border: 1.5px solid #C9A227;
          border-radius: 12px;
          padding: 2px 8px;
          white-space: nowrap;
          box-shadow: 0 3px 6px rgba(0,0,0,0.5);
          z-index: 10;
        }
        .seat-speech-bubble {
          position: absolute;
          top: -34px;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(0,0,0,0.92);
          border: 1px solid #777;
          border-radius: 8px;
          padding: 3px 8px;
          font-size: 8px;
          font-style: italic;
          white-space: nowrap;
          pointer-events: none;
          z-index: 40;
          box-shadow: 0 4px 10px rgba(0,0,0,0.4);
        }
        .seat-emotion-float {
          position: absolute;
          top: -15px;
          font-size: 16px;
          pointer-events: none;
          z-index: 45;
          animation: emoAnim 1.8s ease-out forwards;
        }
        @keyframes emoAnim {
          0% { transform: translateY(0); opacity: 1; scale: 1 }
          100% { transform: translateY(-24px); opacity: 0; scale: 0.7 }
        }
        .card {
          width: 26px;
          height: 38px;
          border-radius: 4px;
          position: relative;
          display: inline-flex;
          perspective: 600px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.4);
        }
        .card-inner {
          width: 100%;
          height: 100%;
          position: relative;
          transform-style: preserve-3d;
          transition: transform 0.4s;
        }
        .card.face-down .card-inner {
          transform: rotateY(180deg);
        }
        .card-face {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          backface-visibility: hidden;
          border-radius: 4px;
        }
        .card-front {
          background: linear-gradient(160deg, #fffef9 0%, #f5f0e6 50%, #ebe4d4 100%);
          border: 1px solid #aaa;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 2px 3px;
        }
        .card-front.red { color: #b71c1c }
        .card-front.black { color: #1a1a1a }
        .rank-top {
          font-size: 8px;
          font-weight: 900;
          line-height: 1.0;
          text-align: left;
        }
        .suit-center {
          align-self: center;
          font-size: 12px;
          font-weight: 900;
        }
        .rank-bot {
          font-size: 8px;
          font-weight: 900;
          line-height: 1.0;
          align-self: flex-end;
          text-align: right;
          transform: rotate(180deg);
        }
        .card-back-face {
          transform: rotateY(180deg);
          background: repeating-conic-gradient(#1a2744 0% 25%, #1e3050 25% 50%) 50%/4px 4px, linear-gradient(135deg, #162540 0%, #0d1a30 50%, #162540 100%);
          border: 1.5px solid #C9A227;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .card-back-face::before {
          content: '';
          position: absolute;
          top: 2px;
          left: 2px;
          right: 2px;
          bottom: 2px;
          border: 0.5px solid rgba(201, 162, 39, 0.4);
          border-radius: 1px;
        }
        .card-back-face .back-emblem {
          font-size: 9px;
          color: #C9A227;
        }
      ` }} />

      {/* ── TOP CONSOLE: Rules & Mode selectors ── */}
      <div className="w-full bg-[#0d0d0e] border-[3px] border-black p-4 rounded-3xl shadow-[5px_5px_0px_#000000] flex flex-wrap justify-between items-center gap-4 z-20 relative font-mono">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-black/60 rounded-xl border border-zinc-800">
            <Shuffle className="text-[#00F3FF]" size={18} />
          </div>
          <div>
            <span className="text-[9px] text-zinc-500 uppercase tracking-wider block font-mono">C8L VIP felt cabinet</span>
            <div className="flex items-center gap-2">
              <span className="font-heading font-black text-sm uppercase text-white">GRAVEDAD CERO PÓKER</span>
              <span className={`text-[8px] px-1.5 py-0.5 rounded font-mono font-bold ${economyMode === "real" ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" : "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"}`}>
                {economyMode === "real" ? "REAL COINS" : "PLAY MONEY"}
              </span>
            </div>
          </div>
        </div>

        {/* Currency Switch */}
        <div className="flex bg-black border-2 border-black rounded-xl p-1 gap-1 items-center">
          <button
            onClick={() => setEconomyMode("real")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold tracking-wider transition-all cursor-pointer ${
              economyMode === "real" 
                ? "bg-gradient-to-r from-amber-500 to-yellow-600 text-black shadow-md" 
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <DollarSign size={12} />
            <span>💵 REAL COINS</span>
          </button>
          <button
            onClick={() => setEconomyMode("play")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold tracking-wider transition-all cursor-pointer ${
              economyMode === "play" 
                ? "bg-[#00bcd4] text-black shadow-md" 
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <Coins size={12} />
            <span>🪙 JUGAR</span>
          </button>
        </div>

        {/* Option Variant Selectors */}
        <div className="flex items-center gap-2">
          <select 
            value={variant} 
            onChange={(e) => setVariant(e.target.value as any)}
            className="bg-black border border-zinc-800 text-zinc-300 rounded-xl px-3 py-1.5 text-xs font-mono font-bold focus:outline-none cursor-pointer"
          >
            <option value="texas">Texas Hold'em</option>
            <option value="omaha">Omaha PLO</option>
            <option value="shortdeck">Short Deck (6+)</option>
          </select>

          <select 
            value={format} 
            onChange={(e) => setFormat(e.target.value as any)}
            className="bg-black border border-zinc-800 text-zinc-300 rounded-xl px-3 py-1.5 text-xs font-mono font-bold focus:outline-none cursor-pointer"
          >
            <option value="cash">Mesa de Cash</option>
            <option value="mtt">Torneo MTT</option>
            <option value="spin">Spin & Go (Rápido)</option>
          </select>
        </div>

        {/* Toggles */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMusicActive(!musicActive)}
            className={`p-2 rounded-xl border-2 border-black shadow-[2px_2px_0px_#000000] cursor-pointer transition ${
              musicActive ? "bg-emerald-600 text-black" : "bg-black text-zinc-500"
            }`}
            title="Sintetizador de Tensión"
          >
            {musicActive ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>

          <button
            onClick={() => setMicActive(!micActive)}
            className={`p-2 rounded-xl border-2 border-black shadow-[2px_2px_0px_#000000] cursor-pointer transition ${
              micActive ? "bg-amber-500 text-black animate-pulse" : "bg-black text-zinc-500"
            }`}
            title="Comandos de Voz (Micrófono)"
          >
            {micActive ? <Mic size={16} /> : <MicOff size={16} />}
          </button>
        </div>
      </div>

      {/* ── MAIN TABLE FIELD ARENA ── */}
      <div className="w-full relative bg-[#09090c] border-[3px] border-zinc-900 rounded-3xl p-2 min-h-[500px] flex items-center justify-center overflow-hidden">
        
        {/* Splash Cover Art on idle */}
        {phase === "idle" && (
          <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-black/40">
            {/* Background image */}
            <img 
              src="/poker-cover.jpg" 
              alt="C8L Casinos Poker Cover" 
              className="absolute inset-0 w-full h-full object-cover opacity-60 z-0" 
            />
            {/* Vignette */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-black/95 z-0" />
            
            {/* Content */}
            <div className="relative z-10 flex flex-col items-center justify-center p-6 text-center max-w-sm">
              <span className="text-[10px] font-mono text-amber-400 font-bold tracking-[0.25em] uppercase mb-2 drop-shadow-md">
                🔥 VIP CABINET 🔥
              </span>
              <h2 className="font-heading font-black text-3xl text-white tracking-widest uppercase drop-shadow-[0_2px_6px_rgba(0,0,0,0.8)]">
                C8L PÓKER
              </h2>
              <p className="text-zinc-300 text-[10px] font-mono mt-2 mb-6 leading-relaxed max-w-xs drop-shadow-md">
                Mesa VIP de 9 jugadores. Físicas cuánticas de gravedad cero y Coins reales.
              </p>
              <button
                onClick={handleDeal}
                className="px-6 py-3 bg-gradient-to-r from-amber-400 to-yellow-500 hover:brightness-110 active:scale-95 text-black font-heading font-black text-xs uppercase tracking-widest rounded-2xl hover:scale-105 transition shadow-[0_0_15px_rgba(212,175,55,0.4)] border-2 border-black cursor-pointer flex items-center gap-2"
              >
                <Play size={10} fill="currentColor" />
                <span>{format === "spin" ? "ENTRAR (50 Coins)" : "ENTRAR (10 Coins)"}</span>
              </button>
            </div>
          </div>
        )}

        {/* Particle Canvas Trails */}
        <div className="table-area" id="tableArea">
          
          {/* Wood railing and felt */}
          <div className="table-outer">
            <div className="table-felt" id="felt">
              {/* Logo wings decal */}
              <div className="table-logo-decal flex flex-col items-center justify-center opacity-10 select-none">
                <span className="font-heading font-black text-xl text-[#00F3FF] tracking-widest">C8L</span>
                <span className="text-[6px] font-mono text-zinc-500 uppercase tracking-widest mt-1">AGENCY POKER v4</span>
              </div>

              {/* Pot chips display */}
              {pot > 0 && (
                <div className="pot-display text-glow-neon" id="potDisp">
                  🏆 BOTE: {pot.toLocaleString()}
                </div>
              )}

              {/* Community cards */}
              <div className="community" id="commCards">
                {communityCards.map((card, cidx) => {
                  const isRed = card.includes("♥️") || card.includes("♦️");
                  const colorClass = isRed ? "red" : "black";
                  const rank = card.replace(/[♥️♦️♣️♠️]/g, "");
                  const suitSym = card.slice(-2);
                  return (
                    <div key={cidx} className="card">
                      <div className="card-inner">
                        <div className={`card-face card-front ${colorClass}`}>
                          <span className="rank-top">{rank}<br/>{suitSym}</span>
                          <span className="suit-center">{rank}</span>
                          <span className="rank-bot">{rank}<br/>{suitSym}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Framer Motion Chip Throw Overlay */}
          <div className="absolute inset-0 pointer-events-none z-30">
            <AnimatePresence>
              {animatedChips.map(chip => (
                <motion.div
                  key={chip.id}
                  initial={{ x: `${chip.startX}%`, y: `${chip.startY}%`, scale: 0.3, rotate: 0 }}
                  animate={{ 
                    x: `${chip.targetX}%`, 
                    y: `${chip.targetY}%`, 
                    scale: [1, 1.4, 1],
                    rotate: 360 
                  }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.65, ease: "easeOut" }}
                  className="absolute w-5 h-5 rounded-full border border-white flex items-center justify-center text-[7px] font-black font-mono shadow-md"
                  style={{ 
                    backgroundColor: chip.color,
                    boxShadow: "inset 0 0 3px rgba(0,0,0,0.8)" 
                  }}
                >
                  C8L
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* 9 Seats layout */}
          {seats.map((seat, idx) => {
            const isTurn = turnIdx === idx;
            const isDealer = dealerIdx === idx;
            const isSmallBlind = (dealerIdx + 1) % 9 === idx;
            const isBigBlind = (dealerIdx + 2) % 9 === idx;

            return (
              <div 
                key={seat.id}
                id={`seat-${idx}`}
                className={`seat ${seat.folded ? "folded" : ""} ${isTurn && phase !== "idle" && phase !== "ended" ? "active-turn" : ""} ${seat.lastAction === "WINNER" ? "winner" : ""}`}
                style={{
                  top: `${SEATS[idx].top}%`,
                  left: `${SEATS[idx].left}%`,
                  transform: "translate(-50%, -50%)"
                }}
              >
                {/* Voice Status Indicator */}
                <div className="flex items-center gap-1 bg-black/80 px-1 py-0.5 rounded border border-zinc-900 text-[6px] text-zinc-500 scale-[0.8] mb-0.5 font-mono">
                  <span className={`w-1 h-1 rounded-full ${seat.voiceActive ? "bg-emerald-500 animate-ping" : "bg-zinc-700"}`} />
                  <span>VOZ {seat.voiceActive ? "ACTIVA" : "OK"}</span>
                </div>

                {/* Avatar with dynamic ring glow */}
                <div className={`seat-avatar-ring ${seat.isHuman ? "human-avatar" : ""}`}>
                  {seat.isHuman ? (
                    seat.avatar.startsWith("http") ? (
                      <img src={seat.avatar} alt="Perfil" />
                    ) : (
                      <div className="text-xl">{seat.avatar}</div>
                    )
                  ) : (
                    <img src={seat.avatar} alt={seat.name} />
                  )}

                  {/* Seat Blinds Markers */}
                  {isDealer && <span className="seat-marker-badge">D</span>}
                  {!isDealer && isSmallBlind && <span className="seat-marker-badge sb">SB</span>}
                  {!isDealer && isBigBlind && <span className="seat-marker-badge bb">BB</span>}
                </div>

                {/* turn indicator */}
                <div className="turn-indicator-label">▶ TURNO</div>

                {/* Info tags */}
                <div className="seat-name font-mono">{seat.name}</div>
                <div className="seat-chips">💰 {seat.chips.toLocaleString()}</div>

                {/* Render cards for this seat */}
                {!seat.folded && seat.hand.length > 0 && (
                  <div className="seat-cards">
                    {seat.hand.map((card, cidx) => {
                      const showFacedown = !seat.isHuman && phase !== "showdown";
                      const isRed = card.includes("♥️") || card.includes("♦️");
                      const colorClass = isRed ? "red" : "black";
                      const rank = card.replace(/[♥️♦️♣️♠️]/g, "");
                      const suitSym = card.slice(-2);

                      return (
                        <div key={cidx} className={`card ${showFacedown ? "face-down" : ""}`}>
                          <div className="card-inner">
                            <div className={`card-face card-front ${colorClass}`}>
                              <span className="rank-top">{rank}<br/>{suitSym}</span>
                              <span className="suit-center">{rank}</span>
                              <span className="rank-bot">{rank}<br/>{suitSym}</span>
                            </div>
                            <div className="card-face card-back-face">
                              <span className="back-emblem">♠</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Speech Bubble */}
                {seat.speech && (
                  <div className="seat-speech-bubble font-mono z-40">
                    {seat.speech}
                  </div>
                )}

                {/* Last Actions tags overlay */}
                {seat.lastAction && (
                  <div className="absolute -bottom-6 bg-black border border-zinc-800 px-1.5 py-0.5 rounded text-[8px] font-mono tracking-widest text-[#00F3FF] uppercase shadow-md z-30">
                    {seat.lastAction}
                  </div>
                )}

                {/* Floating emotions */}
                {seat.emotion && (
                  <div className="seat-emotion-float">
                    {seat.emotion}
                  </div>
                )}

                {/* Bet chips marker position */}
                {seat.currentBet > 0 && !seat.folded && (
                  <div 
                    className="seat-bet-disp font-mono"
                    style={{
                      position: "absolute",
                      top: `${BET_POS[idx].top - SEATS[idx].top}vh`,
                      left: `${BET_POS[idx].left - SEATS[idx].left}vw`
                    }}
                  >
                    🎰 {seat.currentBet}
                  </div>
                )}

              </div>
            );
          })}

        </div>

        {/* ── PANEL CHAT SIDEBAR (Toggleable) ── */}
        {showChat && (
          <div className="absolute top-0 right-0 w-64 h-full bg-[#0a080c]/95 border-l border-zinc-800 z-50 flex flex-col font-mono text-xs shadow-2xl">
            <div className="p-3 bg-black/60 border-b border-zinc-850 flex justify-between items-center">
              <span className="font-bold text-[#00F3FF] flex items-center gap-1.5">
                <MessageSquare size={14} /> CHAT DE MESA
              </span>
              <button onClick={() => setShowChat(false)} className="text-zinc-500 hover:text-white transition cursor-pointer">
                <X size={16} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
              {chatMessages.map((msg, midx) => (
                <div key={midx} className={`p-2 rounded-xl text-[10px] leading-relaxed border ${msg.isSystem ? "bg-zinc-950/80 border-zinc-850 text-zinc-500 italic" : "bg-black/50 border-zinc-900"}`}>
                  {!msg.isSystem && <strong className="text-[#C9A227] mr-1.5">{msg.sender}:</strong>}
                  <span>{msg.text}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── PANEL HISTORY SIDEBAR (Toggleable) ── */}
        {showHistory && (
          <div className="absolute top-0 right-0 w-64 h-full bg-[#0a080c]/95 border-l border-zinc-800 z-50 flex flex-col font-mono text-xs shadow-2xl">
            <div className="p-3 bg-black/60 border-b border-zinc-850 flex justify-between items-center">
              <span className="font-bold text-[#00F3FF] flex items-center gap-1.5">
                <History size={14} /> HISTORIAL MANOS
              </span>
              <button onClick={() => setShowHistory(false)} className="text-zinc-500 hover:text-white transition cursor-pointer">
                <X size={16} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
              {history.length === 0 ? (
                <p className="text-zinc-600 italic text-[10px] p-2 text-center">Aún no hay manos registradas.</p>
              ) : (
                history.map((hist, hidx) => (
                  <div key={hidx} className="p-2 border border-zinc-900 bg-black/50 rounded-xl text-[9px] flex flex-col gap-1">
                    <div className="flex justify-between font-bold text-zinc-500">
                      <span>Ronda #{hist.round}</span>
                      <span className="text-[#C9A227]">Bote: {hist.pot}</span>
                    </div>
                    <div className="text-white mt-0.5">🏆 {hist.winners}</div>
                    <div className="text-emerald-500 text-[8px] italic">{hist.hand}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Interactive icons on top edges of arena */}
        <button 
          onClick={() => { setShowChat(!showChat); setShowHistory(false); }}
          className="absolute top-4 right-14 p-2 bg-black/70 border border-zinc-800 rounded-full text-zinc-400 hover:text-white transition cursor-pointer z-40"
          title="Abrir Chat"
        >
          <MessageSquare size={16} />
        </button>

        <button 
          onClick={() => { setShowHistory(!showHistory); setShowChat(false); }}
          className="absolute top-4 right-4 p-2 bg-black/70 border border-zinc-800 rounded-full text-zinc-400 hover:text-white transition cursor-pointer z-40"
          title="Ver Historial"
        >
          <History size={16} />
        </button>

      </div>

      {/* ── BOTTOM CONSOLE CONTROLS PANEL ── */}
      <div className="w-full bg-[#0d0d0e] border-[3px] border-black p-5 rounded-3xl shadow-[5px_5px_0px_#000000] relative z-25 font-mono">
        
        {/* Verification banner under Real Money mode */}
        {economyMode === "real" && !isVerified && (
          <div className="mb-4 bg-amber-500/10 border border-amber-500/30 p-3 rounded-2xl flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs text-amber-300 font-mono">
              <ShieldAlert size={14} className="text-amber-500" />
              <span>El Modo Dinero Real requiere verificación KYC seguro de cuenta.</span>
            </div>
            <button
              onClick={() => setShowVerifyModal(true)}
              className="bg-amber-500 hover:bg-amber-400 text-black px-3.5 py-1.5 rounded-xl text-xs font-bold cursor-pointer shadow-[2px_2px_0px_#000000] border-2 border-black"
            >
              Verificar Cuenta
            </button>
          </div>
        )}

        {/* Transcript vocal recognition feed */}
        {micActive && speechTranscript && (
          <div className="mb-3 px-3 py-1 bg-black/60 border border-zinc-800 rounded-xl text-[9px] text-amber-400 font-mono flex items-center gap-2">
            <Mic size={10} className="animate-pulse" />
            <span>Voz detectada: <strong className="uppercase">{speechTranscript}</strong></span>
          </div>
        )}

        <div className="flex flex-col md:flex-row gap-5 items-center justify-between">
          
          {/* Round status info */}
          <div className="flex flex-col gap-1 items-start text-left">
            <span className="text-[8px] text-zinc-500 uppercase tracking-widest font-mono">INFORMACIÓN DE MESA</span>
            <div className="flex items-center gap-2 font-black text-xs uppercase text-white">
              <span>{phase === "idle" ? "En Espera" : `Etapa: ${phase.toUpperCase()}`}</span>
              <span className="text-zinc-500">|</span>
              <span>Ciega: {sbAmt}/{bbAmt}</span>
              {format === "spin" && (
                <span className="bg-amber-500/20 text-amber-300 text-[9px] px-2 py-0.5 rounded font-mono">
                  MULTIPLICADOR: {spinMultiplier}x
                </span>
              )}
            </div>
          </div>

          {/* Core Player Action Controls */}
          {phase === "idle" ? (
            <button
              onClick={handleDeal}
              className={`px-8 py-3.5 text-black font-black text-xs uppercase tracking-widest rounded-2xl hover:brightness-110 transition shadow-[4px_4px_0px_#000000] border-2 border-black cursor-pointer flex items-center gap-2 ${
                economyMode === "real" ? "bg-gradient-to-r from-amber-400 to-yellow-500" : "bg-[#00bcd4]"
              }`}
            >
              <Play size={12} />
              <span>{format === "spin" ? "Iniciar Spin & Go (50 Coins)" : "Pagar Ciega y Repartir (10 Coins)"}</span>
            </button>
          ) : (
            <div className="flex flex-wrap gap-3 items-center justify-center">
              {turnIdx === HUMAN_SEAT_INDEX ? (
                <>
                  <button
                    onClick={playerFold}
                    className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs uppercase rounded-xl border-2 border-black shadow-[3px_3px_0px_#000000] cursor-pointer"
                  >
                    Retirarse (Fold)
                  </button>

                  <button
                    onClick={() => {
                      const toCall = currentBet - (seats[HUMAN_SEAT_INDEX]?.currentBet || 0);
                      playerCallOrCheck(toCall);
                    }}
                    className="px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs uppercase rounded-xl border-2 border-black shadow-[3px_3px_0px_#000000] cursor-pointer"
                  >
                    {currentBet - (seats[HUMAN_SEAT_INDEX]?.currentBet || 0) > 0 
                      ? `Igualar (Call) ${currentBet - (seats[HUMAN_SEAT_INDEX]?.currentBet || 0)}` 
                      : "Pasar (Check)"}
                  </button>

                  <div className="flex items-center gap-2 bg-black border border-zinc-800 p-1.5 rounded-xl">
                    <input
                      type="range"
                      min={100}
                      max={1000}
                      step={50}
                      value={raiseValue}
                      onChange={(e) => setRaiseValue(Number(e.target.value))}
                      className={`accent-current w-20 ${economyMode === "real" ? "text-amber-500" : "text-cyan-500"}`}
                    />
                    <button
                      onClick={playerRaise}
                      className={`px-3 py-1.5 text-black font-black text-[10px] uppercase rounded-lg border-2 border-black shadow-[2px_2px_0px_#000000] cursor-pointer ${
                        economyMode === "real" ? "bg-amber-400" : "bg-cyan-400"
                      }`}
                    >
                      Subir (Raise) +{raiseValue}
                    </button>
                  </div>

                  <button
                    onClick={playerAllIn}
                    className="px-5 py-2.5 bg-gradient-to-r from-red-600 to-amber-600 text-white font-black text-xs uppercase rounded-xl border-2 border-black shadow-[3px_3px_0px_#000000] cursor-pointer"
                  >
                    All-In
                  </button>
                </>
              ) : (
                <div className="text-zinc-500 font-mono text-xs uppercase tracking-widest animate-pulse font-bold flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-zinc-700 animate-ping" />
                  <span>Esperando turnos de la mesa...</span>
                </div>
              )}
            </div>
          )}

          {/* Action reset / Daily free money */}
          <div className="flex gap-2">
            {phase === "ended" && (
              <button
                onClick={startNewHand}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-black font-black text-xs uppercase tracking-widest rounded-xl border-2 border-black shadow-[3px_3px_0px_#000000] cursor-pointer flex items-center gap-1.5"
              >
                <RefreshCw size={12} />
                <span>Siguiente Mano</span>
              </button>
            )}

            {economyMode === "play" && playMoneyCoins <= 0 && (
              <button
                onClick={handleFreeRefill}
                className="px-5 py-2.5 bg-cyan-500 text-black font-black text-xs uppercase tracking-widest rounded-xl border-2 border-black shadow-[3px_3px_0px_#000000] cursor-pointer flex items-center gap-1.5 box-glow-neon animate-pulse"
              >
                <Sparkles size={12} />
                <span>Cargar Fichas Gratis</span>
              </button>
            )}
          </div>

        </div>

      </div>

      {/* ── KYC SECURE VERIFICATION MODAL ── */}
      {showVerifyModal && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-6 z-[200]">
          <div className="bg-[#0d0d0e] border-[3px] border-[#D4AF37] p-6 rounded-3xl max-w-sm w-full shadow-[0_0_30px_rgba(212,175,55,0.3)] font-mono">
            <h3 className="font-black text-base text-white uppercase tracking-wider flex items-center gap-2">
              <ShieldAlert className="text-[#D4AF37]" />
              <span>Verificación KYC C8L Secure</span>
            </h3>
            <p className="text-zinc-400 text-xs mt-3 leading-relaxed">
              Para jugar en las mesas VIP de Dinero Real, el regulador de la agencia requiere activar tu identidad de juego KYC.
            </p>
            <div className="mt-5 flex flex-col gap-2">
              <button
                onClick={handleVerifyAccount}
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-black text-xs uppercase rounded-xl border-2 border-black cursor-pointer shadow-[2px_2px_0px_#000000]"
              >
                Autorizar Identidad Segura
              </button>
              <button
                onClick={() => setShowVerifyModal(false)}
                className="w-full py-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 font-bold text-xs uppercase rounded-xl border border-zinc-850 cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
