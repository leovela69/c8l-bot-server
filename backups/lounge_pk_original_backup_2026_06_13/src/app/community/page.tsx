"use client";
import React, { useState, useEffect, useRef, useMemo } from "react";
import { useApp } from "../../context/AppContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, Terminal, Cpu, Coins, Play, Square, Lock, Unlock, 
  Sliders, Volume2, Plus, Check, Flame, ShieldAlert, Radio, 
  TrendingUp, Send, X, Sparkles
} from "lucide-react";
import VIPRewardsShop from "../../components/ui/VIPRewardsShop";

// -------------------------------------------------------------
// Cyberpunk Decrypt Text Effect Component
// -------------------------------------------------------------
interface DecryptTextProps {
  text: string;
  className?: string;
  isUnlocked?: boolean;
}

const DecryptText: React.FC<DecryptTextProps> = ({ text, className = "", isUnlocked = true }) => {
  const [displayText, setDisplayText] = useState("");
  const chars = "0123456789ABCDEF@#$%&?[]{}<>";
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isUnlocked) {
      setDisplayText(
        text
          .split("")
          .map(() => chars[Math.floor(Math.random() * chars.length)])
          .join("")
      );
      return;
    }

    let iteration = 0;
    if (intervalRef.current) clearInterval(intervalRef.current);

    intervalRef.current = setInterval(() => {
      setDisplayText(
        text
          .split("")
          .map((char, index) => {
            if (char === " ") return " ";
            if (index < iteration) {
              return text[index];
            }
            return chars[Math.floor(Math.random() * chars.length)];
          })
          .join("")
      );

      if (iteration >= text.length) {
        if (intervalRef.current) clearInterval(intervalRef.current);
      }
      iteration += 1 / 2;
    }, 25);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [text, isUnlocked]);

  return <span className={`${className} font-mono`}>{displayText}</span>;
};

// -------------------------------------------------------------
// Local Bilingual Translations Dictionary
// -------------------------------------------------------------
const LOCAL_T = {
  es: {
    communitySection: "Consola de Comunidad Cyberpunk",
    tagline: "Explora la interactividad hacker de c.8.l. agency, sintoniza los algoritmos globales de ranking y colabora en los Hype Bounties.",
    c8lCoinsLabel: "Coins C8L",
    latencyLabel: "Latencia",
    repLabel: "Nivel Rep",
    tuningTitle: "📊 Sindicatos del Algoritmo",
    tuningSub: "Gobernanza por Staking",
    stakingLabel: "Cantidad Staking",
    likesWeight: "Peso de Likes",
    commentsWeight: "Peso de Comentarios",
    critiqueWeight: "Peso de Críticas (Propinas)",
    decayWeight: "Decaimiento Temporal",
    weightDesc: "*Los pesos del algoritmo reordenan la base de datos de tracks de forma global. Bloquear capital de staking en un sindicato incrementa su poder de decisión en el ciclo del leaderboard.",
    chatTitle: "📻 Sala de Crítica #829",
    bombLabel: "BOMBA LÓGICA T-MINUS:",
    chatPlaceholder: "Transmite crítica táctica en vivo...",
    decryptBtn: "DECRYPT ({cost} C8L)",
    securedData: "DATOS CIFRADOS",
    leaderboardTitle: "🏆 Leaderboard Global",
    leaderboardSub: "Tiempo Real",
    bountiesTitle: "🔥 Hype Bounties Activos",
    submitClaim: "Enviar Reclamación",
    pendingArtist: "ESPERANDO ARTISTA...",
    paidLabel: "PAGADO ✓",
    cyberModTitle: "🎛️ Sintetizador C8L Cyber-Mod",
    cyberModSub: "CADENA DE FX DE AUDIO CON WEB AUDIO API",
    playLoop: "Reproducir Sintetizador",
    stopLoop: "Detener Señal",
    filterCutoff: "CORTE DE FILTRO",
    resonance: "RESONANCIA (Q)",
    delayTime: "TIEMPO DE ECO",
    bitcrusher: "BITCRUSHER / DISTORSIÓN",
    pitchOctave: "OCTAVA / VELOCIDAD",
    secureBanner: "CYBER-CONSOLE SECURE GATEKEEPER ACTIVO // HASH HMAC DE SEGURIDAD EN RUTA EDGE DE BACKEND",
    insufficientCoins: "Monedas insuficientes. Necesitas {cost} monedas C8L.",
    claimSuccess: "¡Reclamación enviada! Esperando aprobación del artista...",
    claimApproved: "¡Bounty aprobado! Has ganado {reward} C8L Coins y +5 de Reputación.",
  },
  en: {
    communitySection: "Cyberpunk Community Console",
    tagline: "Explore c.8.l. agency hacker interactivity, tune the global ranking algorithms, and collaborate on Hype Bounties.",
    c8lCoinsLabel: "C8L Coins",
    latencyLabel: "Latency",
    repLabel: "Rep Level",
    tuningTitle: "📊 Algorithm Syndicates",
    tuningSub: "Staking Governance",
    stakingLabel: "Staking Amount",
    likesWeight: "Likes Weighting",
    commentsWeight: "Comments Weighting",
    critiqueWeight: "Critique Weighting (Tipping)",
    decayWeight: "Temporal Decay",
    weightDesc: "*Algorithm weights reorder track databases globally. Locking staking capital in a syndicate increases its decision-making power in the leaderboard cycle.",
    chatTitle: "📻 Critique Room #829",
    bombLabel: "LOGIC BOMB T-MINUS:",
    chatPlaceholder: "Transmit live tactical critique...",
    decryptBtn: "DECRYPT ({cost} C8L)",
    securedData: "ENCRYPTED DATA",
    leaderboardTitle: "🏆 Global Leaderboard",
    leaderboardSub: "Real-Time",
    bountiesTitle: "🔥 Active Hype Bounties",
    submitClaim: "Submit Claim",
    pendingArtist: "WAITING FOR ARTIST...",
    paidLabel: "PAID ✓",
    cyberModTitle: "🎛️ C8L Cyber-Mod Synthesizer",
    cyberModSub: "WEB AUDIO API REAL-TIME FX CHAIN NODES",
    playLoop: "Play Synth Loop",
    stopLoop: "Stop Signal",
    filterCutoff: "FILTER CUTOFF",
    resonance: "RESONANCE (Q)",
    delayTime: "DELAY TIME",
    bitcrusher: "BITCRUSHER / DISTORTION",
    pitchOctave: "PITCH OCTAVE",
    secureBanner: "CYBER-CONSOLE ENABLED // SECURE HMAC HASH ON BACKEND EDGE ROUTE",
    insufficientCoins: "Insufficient coins. You need {cost} C8L coins.",
    claimSuccess: "Claim submitted! Waiting for artist approval...",
    claimApproved: "Bounty approved! You won {reward} C8L Coins and +5 Reputation.",
  }
};

// -------------------------------------------------------------
// Interfaces
// -------------------------------------------------------------
interface Message {
  id: string;
  sender: string;
  content: string;
  encrypted: boolean;
  cost: number;
}

interface Track {
  id: string;
  title: string;
  artist: string;
  likes: number;
  comments: number;
  critiqueScore: number;
  ageHours: number;
}

interface Bounty {
  id: string;
  title: string;
  reward: number;
  tags: string[];
}

export default function CommunityPage() {
  const { language, user, c8lCoins, addCCoins, deductCCoins, credits, showNotification } = useApp();
  const router = useRouter();

  // --- 1. Sound Synthesis Engine (Web Audio API) ---
  const playSynthSound = (type: "click" | "success" | "sweep" | "laser") => {
    if (typeof window === "undefined") return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      const now = ctx.currentTime;
      
      if (type === "click") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.1);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
      } else if (type === "success") {
        osc.type = "triangle";
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.setValueAtTime(659.25, now + 0.08); // E5
        osc.frequency.setValueAtTime(783.99, now + 0.16); // G5
        osc.frequency.setValueAtTime(1046.50, now + 0.24); // C6
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
        osc.start(now);
        osc.stop(now + 0.4);
      } else if (type === "sweep") {
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(600, now + 0.35);
        gain.gain.setValueAtTime(0.03, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc.start(now);
        osc.stop(now + 0.35);
      } else if (type === "laser") {
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(900, now);
        osc.frequency.exponentialRampToValueAtTime(80, now + 0.2);
        gain.gain.setValueAtTime(0.07, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
      }
    } catch (e) {
      console.warn("Web Audio failed or blocked", e);
    }
  };

  // --- Economy & User Reputation ---
  const [reputation, setReputation] = useState<number>(12);
  const [isSynthPlaying, setIsSynthPlaying] = useState<boolean>(false);
  const [bountyStatus, setBountyStatus] = useState<Record<string, "idle" | "submitted" | "approved">>({});

  // --- Audio Context and Web Nodes ---
  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const filterRef = useRef<BiquadFilterNode | null>(null);
  const delayRef = useRef<DelayNode | null>(null);
  const delayGainRef = useRef<GainNode | null>(null);
  const distortionRef = useRef<WaveShaperNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameId = useRef<number | null>(null);

  // --- Cyber Mod FX Controls ---
  const [cutoff, setCutoff] = useState<number>(1200);
  const [resonance, setResonance] = useState<number>(5);
  const [delayTime, setDelayTime] = useState<number>(0.3);
  const [distortionAmount, setDistortionAmount] = useState<number>(10);
  const [speed, setSpeed] = useState<number>(1);

  // --- Tuning Syndicate ---
  const [syndicates, setSyndicates] = useState({
    Darksynth: { score: 45, color: "text-[#FF007F]", bg: "bg-[#FF007F]" },
    Cyberpunk: { score: 35, color: "text-[#39FF14]", bg: "bg-[#39FF14]" },
    LoFiNet: { score: 20, color: "text-[#00F0FF]", bg: "bg-[#00F0FF]" },
  });
  const [stakedSyndicate, setStakedSyndicate] = useState<string | null>(null);
  const [stakeAmount, setStakeAmount] = useState<number>(10);

  // --- Algorithmic Weights ---
  const [weights, setWeights] = useState({
    likes: 50,
    comments: 30,
    critique: 20,
    recency: 40,
  });

  // --- Live Critique Chat ---
  const [messages, setMessages] = useState<Message[]>([
    { id: "1", sender: "ghost_hacker_291", content: "Este bajo sintetizado necesita saturarse un 15% más en el puente.", encrypted: false, cost: 0 },
    { id: "2", sender: "netrunner_09", content: "El kick del track #1 satura de forma ideal el analizador CRT.", encrypted: false, cost: 0 },
    { id: "3", sender: "zero_day_critic", content: "CRÍTICA TÁCTICA: Estructura del arpegio es copiada de un synth clásico de los 80.", encrypted: true, cost: 0.1 },
    { id: "4", sender: "shadow_coder", content: "Vaporwave no está muerto, sólo se mudó a la red oscura de C8L.", encrypted: false, cost: 0 },
    { id: "5", sender: "neon_phantom", content: "FILTRACIÓN EXCLUSIVA: Presets del oscilador analógico revelados.", encrypted: true, cost: 0.2 },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [logicBombTime, setLogicBombTime] = useState(272); // 4:32 in seconds

  // --- Leaderboard & Bounties ---
  const [tracks, setTracks] = useState<Track[]>([
    { id: "1", title: "Cyber Heartbeat", artist: "Hacker-L", likes: 180, comments: 45, critiqueScore: 92, ageHours: 2 },
    { id: "2", title: "NeoTokyo Drift", artist: "Rebel-Grid", likes: 210, comments: 15, critiqueScore: 64, ageHours: 4 },
    { id: "3", title: "Satori Protocol", artist: "Zen_Noise", likes: 95, comments: 68, critiqueScore: 89, ageHours: 12 },
    { id: "4", title: "Cyber-Glitch Symphony", artist: "Vector_Zero", likes: 140, comments: 33, critiqueScore: 78, ageHours: 1 },
  ]);

  const bounties: Bounty[] = [
    { id: "b1", title: "Need Glitch Vocal (Saw Wave Filter)", reward: 120, tags: ["Vocal", "Bitcrusher"] },
    { id: "b2", title: "Industrial Bassline 90BPM", reward: 85, tags: ["Bass", "Analog"] },
    { id: "b3", title: "Cyber-Pad Atmospheric Synth", reward: 150, tags: ["Atmospheric", "Reverb"] },
  ];

  // Logic Bomb countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setLogicBombTime((prev) => {
        if (prev <= 1) {
          setMessages((msgs) => [
            { id: Date.now().toString(), sender: "system_daemon", content: "SALA DESTRUIDA. NUEVO CICLO INICIADO.", encrypted: false, cost: 0 },
            ...msgs.slice(0, 3),
          ]);
          return 300; // Reset to 5m
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // Score sorting logic
  const sortedTracks = useMemo(() => {
    return [...tracks].sort((a, b) => {
      const scoreA = 
        a.likes * (weights.likes / 100) + 
        a.comments * (weights.comments / 100) + 
        a.critiqueScore * (weights.critique / 100) - 
        a.ageHours * (weights.recency / 100);
      const scoreB = 
        b.likes * (weights.likes / 100) + 
        b.comments * (weights.comments / 100) + 
        b.critiqueScore * (weights.critique / 100) - 
        b.ageHours * (weights.recency / 100);
      return scoreB - scoreA;
    });
  }, [tracks, weights]);

  // --- FX Audio Context Node Generators ---
  const startAudio = () => {
    if (typeof window === "undefined") return;

    if (!audioCtxRef.current) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      audioCtxRef.current = new AudioCtx();
    }

    const ctx = audioCtxRef.current;
    if (ctx.state === "suspended") {
      ctx.resume();
    }

    const osc = ctx.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(65.41 * speed, ctx.currentTime);

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(cutoff, ctx.currentTime);
    filter.Q.setValueAtTime(resonance, ctx.currentTime);

    const delay = ctx.createDelay(1.0);
    delay.delayTime.setValueAtTime(delayTime, ctx.currentTime);

    const delayGain = ctx.createGain();
    delayGain.gain.setValueAtTime(0.4, ctx.currentTime);

    const dist = ctx.createWaveShaper();
    dist.curve = makeDistortionCurve(distortionAmount);
    dist.oversample = "4x";

    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;

    // Connections
    osc.connect(dist);
    dist.connect(filter);
    
    filter.connect(delay);
    delay.connect(delayGain);
    delayGain.connect(delay);
    delayGain.connect(filter);

    const finalGain = ctx.createGain();
    finalGain.gain.setValueAtTime(0.5, ctx.currentTime);
    
    filter.connect(finalGain);
    finalGain.connect(analyser);
    analyser.connect(ctx.destination);

    osc.start();

    oscillatorRef.current = osc;
    filterRef.current = filter;
    delayRef.current = delay;
    delayGainRef.current = delayGain;
    distortionRef.current = dist;
    analyserRef.current = analyser;

    setIsSynthPlaying(true);
    playSynthSound("success");
    drawWaveform();
  };

  const stopAudio = () => {
    if (oscillatorRef.current) {
      try {
        oscillatorRef.current.stop();
        oscillatorRef.current.disconnect();
      } catch (e) {}
    }
    setIsSynthPlaying(false);
    playSynthSound("click");
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
    }
  };

  function makeDistortionCurve(amount: number) {
    const k = typeof amount === "number" ? amount : 50;
    const n_samples = 44100;
    const curve = new Float32Array(n_samples);
    const deg = Math.PI / 180;
    for (let i = 0; i < n_samples; ++i) {
      const x = (i * 2) / n_samples - 1;
      curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
    }
    return curve;
  }

  // FX updates
  useEffect(() => {
    if (isSynthPlaying && filterRef.current && audioCtxRef.current) {
      filterRef.current.frequency.setValueAtTime(cutoff, audioCtxRef.current.currentTime);
    }
  }, [cutoff, isSynthPlaying]);

  useEffect(() => {
    if (isSynthPlaying && filterRef.current && audioCtxRef.current) {
      filterRef.current.Q.setValueAtTime(resonance, audioCtxRef.current.currentTime);
    }
  }, [resonance, isSynthPlaying]);

  useEffect(() => {
    if (isSynthPlaying && delayRef.current && audioCtxRef.current) {
      delayRef.current.delayTime.setValueAtTime(delayTime, audioCtxRef.current.currentTime);
    }
  }, [delayTime, isSynthPlaying]);

  useEffect(() => {
    if (isSynthPlaying && distortionRef.current) {
      distortionRef.current.curve = makeDistortionCurve(distortionAmount);
    }
  }, [distortionAmount, isSynthPlaying]);

  useEffect(() => {
    if (isSynthPlaying && oscillatorRef.current && audioCtxRef.current) {
      oscillatorRef.current.frequency.setValueAtTime(65.41 * speed, audioCtxRef.current.currentTime);
    }
  }, [speed, isSynthPlaying]);

  useEffect(() => {
    return () => {
      stopAudio();
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
      }
    };
  }, []);

  // CRT waveforms
  const drawWaveform = () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const bufferLength = analyserRef.current ? analyserRef.current.frequencyBinCount : 128;
    const dataArray = new Uint8Array(bufferLength);

    const render = () => {
      animationFrameId.current = requestAnimationFrame(render);

      if (analyserRef.current) {
        analyserRef.current.getByteTimeDomainData(dataArray);
      } else {
        for (let i = 0; i < bufferLength; i++) {
          dataArray[i] = 128 + Math.sin(i * 0.1 + Date.now() * 0.01) * 15 * Math.random();
        }
      }

      ctx.fillStyle = "rgba(5, 5, 8, 0.25)";
      ctx.fillRect(0, 0, width, height);

      // SCANLINES
      ctx.strokeStyle = "rgba(18, 18, 30, 0.5)";
      ctx.lineWidth = 1;
      for (let i = 0; i < height; i += 4) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(width, i);
        ctx.stroke();
      }

      ctx.lineWidth = 2;
      ctx.strokeStyle = "#39FF14"; // Phosphor matrix green
      ctx.shadowBlur = 8;
      ctx.shadowColor = "#39FF14";
      ctx.beginPath();

      const sliceWidth = width / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * height) / 2;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }

        x += sliceWidth;
      }

      ctx.lineTo(width, height / 2);
      ctx.stroke();
      ctx.shadowBlur = 0;
    };

    render();
  };

  useEffect(() => {
    if (!isSynthPlaying) {
      drawWaveform();
    }
  }, [isSynthPlaying]);

  // Actions connecting to real wallet (useApp Coins)
  const handleDecrypt = (id: string, cost: number) => {
    if (c8lCoins < cost) {
      showNotification(LOCAL_T[language].insufficientCoins.replace("{cost}", cost.toString()), "error");
      playSynthSound("click");
      return;
    }
    const success = deductCCoins(cost);
    if (success) {
      setMessages((prev) =>
        prev.map((msg) => (msg.id === id ? { ...msg, encrypted: false } : msg))
      );
      playSynthSound("success");
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const alias = `ghost_hacker_${Math.floor(100 + Math.random() * 900)}`;
    const newMsg: Message = {
      id: Date.now().toString(),
      sender: alias,
      content: chatInput,
      encrypted: false,
      cost: 0,
    };

    setMessages((prev) => [...prev, newMsg]);
    setChatInput("");
    playSynthSound("click");
  };

  const handleStake = (syndicateKey: string) => {
    if (c8lCoins < stakeAmount) {
      showNotification(LOCAL_T[language].insufficientCoins.replace("{cost}", stakeAmount.toString()), "error");
      playSynthSound("click");
      return;
    }
    const success = deductCCoins(stakeAmount);
    if (success) {
      setStakedSyndicate(syndicateKey);
      setSyndicates((prev) => {
        const key = syndicateKey as keyof typeof prev;
        const updated = { ...prev };
        updated[key].score = updated[key].score + Math.floor(stakeAmount / 10);
        return updated;
      });
      playSynthSound("laser");
      showNotification(language === "es" ? `¡Stake de ${stakeAmount} Coins completado!` : `Staked ${stakeAmount} Coins successfully!`, "success");
    }
  };

  const handleSubmitBounty = (bountyId: string, reward: number) => {
    setBountyStatus((prev) => ({ ...prev, [bountyId]: "submitted" }));
    playSynthSound("sweep");
    showNotification(LOCAL_T[language].claimSuccess, "info");

    setTimeout(() => {
      setBountyStatus((prev) => ({ ...prev, [bountyId]: "approved" }));
      addCCoins(reward);
      setReputation((prev) => prev + 5);
      playSynthSound("success");
      showNotification(LOCAL_T[language].claimApproved.replace("{reward}", reward.toString()), "success");
    }, 3500);
  };

  return (
    <div className="min-h-screen text-zinc-100 relative font-mono pt-32 pb-24 overflow-hidden bg-gradient-to-b from-[#080205] via-[#04040a] to-[#010103] select-none selection:bg-[#FF007F] selection:text-white">
      
      {/* Scanline CRT FX */}
      <div 
        className="fixed inset-0 z-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), 
            linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06))
          `,
          backgroundSize: "100% 4px, 6px 100%"
        }}
      ></div>

      {/* Glow Orbs */}
      <div className="absolute top-1/4 left-1/4 w-[350px] h-[350px] bg-[#ff0055] opacity-5 rounded-full blur-[120px] pointer-events-none animate-pulse"></div>
      <div className="absolute bottom-1/3 right-1/4 w-[450px] h-[450px] bg-[#00ffcc] opacity-5 rounded-full blur-[150px] pointer-events-none"></div>

      <div className="container mx-auto px-4 max-w-7xl relative z-10">
        
        {/* Navigation & Stats header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10 border-b border-[#00ffcc]/20 pb-6">
          <Link 
            href="/" 
            className="flex items-center gap-2 text-xs uppercase tracking-widest text-zinc-400 hover:text-[#00ffcc] transition-colors group"
            onClick={() => playSynthSound("click")}
          >
            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
            <span>Volver a la Home</span>
          </Link>
          
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2 bg-black/60 px-3 py-1.5 rounded-lg border border-[#eab308]/40 text-xs text-[#eab308] shadow-[0_0_10px_rgba(234,179,8,0.15)] font-sans">
              <Coins size={14} className="text-[#eab308]" />
              <span className="font-bold font-mono">{c8lCoins}</span>
              <span className="text-[9px] uppercase tracking-wider text-zinc-400">{LOCAL_T[language].c8lCoinsLabel}</span>
            </div>

            <div className="flex items-center gap-2 bg-[#12121E] px-3 py-1.5 rounded border border-[#2a2a3f] text-xs">
              <Cpu className="w-4 h-4 text-[#00F0FF]" />
              <span className="text-gray-400 text-[9px]">{LOCAL_T[language].latencyLabel.toUpperCase()}:</span>
              <span className="text-[#00F0FF] font-bold">24ms</span>
            </div>

            <div className="flex items-center gap-2 bg-[#12121E] px-3 py-1.5 rounded border border-[#2a2a3f] text-xs">
              <span className="text-gray-400 text-[9px]">{LOCAL_T[language].repLabel.toUpperCase()}:</span>
              <span className="text-[#39FF14] font-bold">Level {reputation}</span>
            </div>
          </div>
        </div>

        {/* 🎨 Anagram & CorazoneLocos Logo Banner */}
        <div className="flex flex-col items-center justify-center mb-10 text-center">
          <div className="text-[9px] text-zinc-500 font-mono tracking-[0.45em] uppercase mb-3.5 animate-pulse">
            [ C.8.L. // L.O.C.O.S. // F.A.M.I.L.Y. ]
          </div>
          
          <div className="flex items-center gap-4 bg-black/60 px-7 py-3.5 rounded-full border border-[#ff0055]/30 shadow-[0_0_20px_rgba(255,0,85,0.15)] backdrop-blur-md">
            <div className="w-10 h-10 rounded-full border border-[#ff0055] bg-black flex items-center justify-center overflow-hidden box-glow-cyber">
              <img 
                src="/logo.png" 
                alt="CorazoneLocos Logo" 
                className="w-full h-full object-cover" 
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = "https://images.unsplash.com/photo-1614680376593-902f74fa0d41?q=80&w=150";
                }}
              />
            </div>
            
            <div className="flex flex-col text-left">
              <span className="font-heading font-black text-lg uppercase tracking-[0.2em] text-[#ff0055] leading-none mb-1 text-glow-red">
                CorazoneLocos
              </span>
              <span className="text-[8px] uppercase tracking-widest text-[#00ffcc] font-mono leading-none">
                c.8.l. agency hub
              </span>
            </div>
          </div>
        </div>

        {/* Hero title */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00ffcc]/10 border border-[#00ffcc]/30 text-[10px] text-[#00ffcc] uppercase tracking-widest mb-4">
            <Sparkles size={10} className="animate-pulse" />
            <span>{LOCAL_T[language].communitySection}</span>
          </div>
          <p className="text-zinc-400 text-xs font-sans max-w-lg mx-auto leading-relaxed">
            {LOCAL_T[language].tagline}
          </p>
        </div>

        {/* 📊 GRID LAYOUT DE 3 COLUMNAS */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-12">
          
          {/* COL 1: TUNING SYNDICATE & WEIGHTS */}
          <section className="lg:col-span-4 border border-[#12121E] bg-black/60 backdrop-blur-md p-5 rounded-2xl flex flex-col justify-between shadow-[0_0_15px_rgba(0,240,255,0.03)]">
            <div>
              <h2 className="text-[#00F0FF] font-bold text-xs tracking-wider uppercase border-b border-white/10 pb-2.5 mb-4 flex items-center justify-between">
                <span>{LOCAL_T[language].tuningTitle}</span>
                <span className="text-[9px] text-zinc-500 font-normal">{LOCAL_T[language].tuningSub.toUpperCase()}</span>
              </h2>

              {/* Staking Pool selection */}
              <div className="space-y-3.5 mb-6">
                {Object.entries(syndicates).map(([name, data]) => (
                  <div key={name} className="bg-[#12121f]/60 p-3 rounded-xl border border-white/5">
                    <div className="flex justify-between items-center mb-1 text-xs">
                      <span className={`font-semibold ${data.color}`}>{name} Syndicate</span>
                      <span className="text-zinc-400">{data.score}% weight</span>
                    </div>
                    <div className="w-full bg-[#050508] h-2 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${data.bg} transition-all duration-500`}
                        style={{ width: `${data.score}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between items-center mt-2.5">
                      <span className="text-[9px] text-zinc-500">Staked in Pool</span>
                      <button 
                        onClick={() => handleStake(name)}
                        className={`text-[9px] px-2 py-0.5 rounded font-bold border transition-colors ${
                          stakedSyndicate === name 
                            ? "bg-[#39FF14]/10 text-[#39FF14] border-[#39FF14]" 
                            : "bg-transparent text-zinc-400 border-zinc-600 hover:border-[#FF007F] hover:text-[#FF007F]"
                        }`}
                      >
                        {stakedSyndicate === name ? "STAKED ✓" : `STAKE ${stakeAmount} C8L`}
                      </button>
                    </div>
                  </div>
                ))}
                
                <div className="flex justify-between items-center gap-2 px-1">
                  <span className="text-[9px] text-zinc-500 uppercase tracking-widest">{LOCAL_T[language].stakingLabel}:</span>
                  <input 
                    type="range" 
                    min="5" 
                    max="100" 
                    step="5" 
                    value={stakeAmount}
                    onChange={(e) => setStakeAmount(Number(e.target.value))}
                    className="w-1/2 accent-[#FF007F] h-1 bg-[#12121e]"
                  />
                  <span className="text-[10px] text-[#FF007F] font-bold">{stakeAmount} C8L</span>
                </div>
              </div>

              {/* Sliders de Peso del Algoritmo */}
              <div className="space-y-4">
                <h3 className="text-[#39FF14] text-[10px] font-bold uppercase tracking-wider mb-2 flex items-center gap-2">
                  <Sliders className="w-3.5 h-3.5" /> Algorithmic Rules weights
                </h3>

                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-[10px] text-zinc-400 mb-1">
                      <span>{LOCAL_T[language].likesWeight}</span>
                      <span className="text-[#00F0FF]">{weights.likes}%</span>
                    </div>
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      value={weights.likes} 
                      onChange={(e) => setWeights({ ...weights, likes: Number(e.target.value) })}
                      className="w-full accent-[#00F0FF] h-1 bg-zinc-800 rounded"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-[10px] text-zinc-400 mb-1">
                      <span>{LOCAL_T[language].commentsWeight}</span>
                      <span className="text-[#00F0FF]">{weights.comments}%</span>
                    </div>
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      value={weights.comments} 
                      onChange={(e) => setWeights({ ...weights, comments: Number(e.target.value) })}
                      className="w-full accent-[#00F0FF] h-1 bg-zinc-800 rounded"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-[10px] text-zinc-400 mb-1">
                      <span>{LOCAL_T[language].critiqueWeight}</span>
                      <span className="text-[#00F0FF]">{weights.critique}%</span>
                    </div>
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      value={weights.critique} 
                      onChange={(e) => setWeights({ ...weights, critique: Number(e.target.value) })}
                      className="w-full accent-[#00F0FF] h-1 bg-zinc-800 rounded"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-[10px] text-zinc-400 mb-1">
                      <span>{LOCAL_T[language].decayWeight}</span>
                      <span className="text-[#FF007F]">{weights.recency}%</span>
                    </div>
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      value={weights.recency} 
                      onChange={(e) => setWeights({ ...weights, recency: Number(e.target.value) })}
                      className="w-full accent-[#FF007F] h-1 bg-zinc-800 rounded"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-white/5">
              <div className="text-[9px] text-zinc-500 leading-normal">
                {LOCAL_T[language].weightDesc}
              </div>
            </div>
          </section>

          {/* COL 2: LIVE DECRYPTION CHAT (SALA DE CRÍTICAS EN VIVO) */}
          <section className="lg:col-span-5 border border-[#12121E] bg-black/60 backdrop-blur-md p-5 rounded-2xl flex flex-col justify-between shadow-[0_0_15px_rgba(255,0,127,0.03)]">
            <div className="flex flex-col h-full">
              <div className="flex justify-between items-center border-b border-white/5 pb-3 mb-3">
                <h2 className="text-[#FF007F] font-bold text-xs tracking-wider uppercase flex items-center gap-2">
                  <Radio className="w-4 h-4 animate-pulse text-[#FF007F]" />
                  <span>{LOCAL_T[language].chatTitle}</span>
                </h2>
                <div className="flex items-center gap-2 bg-[#FF007F]/10 border border-[#FF007F]/30 px-2 py-0.5 rounded">
                  <span className="text-[8px] text-[#FF007F] font-bold uppercase animate-pulse">{LOCAL_T[language].bombLabel}</span>
                  <span className="text-xs text-white font-mono font-bold">{formatTime(logicBombTime)}</span>
                </div>
              </div>

              {/* Chat log message feed */}
              <div className="flex-1 min-h-[300px] max-h-[350px] overflow-y-auto bg-black/50 p-4 border border-white/5 rounded-xl mb-3 space-y-3 custom-scrollbar">
                <AnimatePresence initial={false}>
                  {messages.map((msg) => (
                    <motion.div 
                      key={msg.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-xs border-b border-white/5 pb-2"
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[#00F0FF] font-semibold">{msg.sender}</span>
                        {msg.encrypted && (
                          <span className="text-[8px] bg-[#FF007F]/10 text-[#FF007F] border border-[#FF007F]/30 px-1.5 py-0.2 rounded font-bold uppercase">
                            {LOCAL_T[language].securedData}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between gap-3 bg-zinc-900/30 p-2 rounded-lg">
                        <div className="flex-1 break-words">
                          <DecryptText 
                            text={msg.content} 
                            isUnlocked={!msg.encrypted} 
                            className={msg.encrypted ? "text-zinc-600 line-through select-none" : "text-zinc-300"} 
                          />
                        </div>
                        
                        {msg.encrypted && (
                          <button 
                            onClick={() => handleDecrypt(msg.id, msg.cost)}
                            className="bg-[#FF007F] hover:bg-[#FF007F]/80 text-white font-bold text-[9px] px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 shadow-[0_0_8px_rgba(255,0,127,0.4)] cursor-pointer"
                          >
                            <Lock className="w-2.5 h-2.5" /> {LOCAL_T[language].decryptBtn.replace("{cost}", msg.cost.toString())}
                          </button>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {/* Chat Input form */}
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <input 
                  type="text" 
                  placeholder={LOCAL_T[language].chatPlaceholder}
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  className="flex-1 bg-black/50 border border-white/10 text-xs px-3 py-2.5 text-zinc-300 rounded-xl focus:outline-none focus:border-[#FF007F] transition-all font-mono"
                />
                <button 
                  type="submit" 
                  className="bg-zinc-900 hover:bg-[#FF007F] border border-zinc-700 hover:border-[#FF007F] text-zinc-400 hover:text-white px-3 rounded-xl transition-all duration-300 flex items-center justify-center cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          </section>

          {/* COL 3: LEADERBOARD & HYPE BOUNTIES */}
          <section className="lg:col-span-4 border border-[#12121E] bg-black/60 backdrop-blur-md p-5 rounded-2xl flex flex-col justify-between shadow-[0_0_15px_rgba(57,255,20,0.03)]">
            <div>
              <div className="border-b border-white/5 pb-2.5 mb-3 flex justify-between items-center">
                <h2 className="text-[#39FF14] font-bold text-xs tracking-wider uppercase flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  <span>{LOCAL_T[language].leaderboardTitle}</span>
                </h2>
                <span className="text-[9px] text-zinc-500 font-semibold uppercase">{LOCAL_T[language].leaderboardSub}</span>
              </div>

              {/* Scored global list */}
              <div className="space-y-2 mb-6">
                {sortedTracks.map((track, idx) => {
                  const score = (
                    track.likes * (weights.likes / 100) + 
                    track.comments * (weights.comments / 100) + 
                    track.critiqueScore * (weights.critique / 100) - 
                    track.ageHours * (weights.recency / 100)
                  ).toFixed(1);

                  return (
                    <motion.div 
                      key={track.id} 
                      layout
                      className="flex justify-between items-center bg-[#12121f]/50 p-2.5 rounded-xl border border-white/5 hover:border-[#39FF14]/50 transition-all duration-300"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-[#39FF14] text-xs font-bold w-4">#{idx + 1}</span>
                        <div>
                          <div className="text-xs text-zinc-200 font-bold max-w-[150px] truncate">{track.title}</div>
                          <div className="text-[10px] text-zinc-400">{track.artist}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-[#00F0FF] font-bold">{score}</div>
                        <div className="text-[9px] text-zinc-500 font-sans tracking-wider uppercase">Score</div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Active Hype Bounties */}
              <div>
                <h3 className="text-white text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-2 border-b border-white/5 pb-2">
                  <Flame className="w-3.5 h-3.5 text-[#FF007F]" /> <span>{LOCAL_T[language].bountiesTitle}</span>
                </h3>
                
                <div className="space-y-2">
                  {bounties.map((bounty) => {
                    const status = bountyStatus[bounty.id] || "idle";

                    return (
                      <div key={bounty.id} className="bg-[#12121f]/50 p-2.5 rounded-xl border border-white/5 text-xs flex justify-between items-center">
                        <div>
                          <div className="font-bold text-zinc-200">{bounty.title}</div>
                          <div className="flex gap-1 mt-1">
                            {bounty.tags.map((tag) => (
                              <span key={tag} className="text-[8px] bg-zinc-800 text-zinc-400 px-1 py-0.2 rounded font-sans uppercase">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="text-right flex flex-col items-end gap-1 font-sans">
                          <span className="text-[#FF007F] font-bold text-[10px]">{bounty.reward} C8L</span>
                          
                          {status === "idle" && (
                            <button 
                              onClick={() => handleSubmitBounty(bounty.id, bounty.reward)}
                              className="bg-transparent hover:bg-[#39FF14] text-[#39FF14] hover:text-black border border-[#39FF14] px-1.5 py-0.5 rounded text-[9px] font-bold transition-all cursor-pointer font-mono"
                            >
                              {LOCAL_T[language].submitClaim}
                            </button>
                          )}
                          
                          {status === "submitted" && (
                            <span className="text-[#00F0FF] text-[9px] font-bold animate-pulse font-mono">
                              {LOCAL_T[language].pendingArtist}
                            </span>
                          )}

                          {status === "approved" && (
                            <span className="text-[#39FF14] text-[9px] font-bold flex items-center gap-0.5 font-mono">
                              <Check className="w-3 h-3" /> {LOCAL_T[language].paidLabel}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>

        </div>

        {/* 🎛️ CYBER-MOD WEB AUDIO API CONTROLLER */}
        <footer className="border border-white/10 bg-black/60 backdrop-blur-md p-5 rounded-2xl mb-12 shadow-[0_0_15px_rgba(57,255,20,0.02)]">
          <div className="flex flex-col lg:flex-row items-center gap-6">
            
            {/* Waveform Oscilloscope Canvas */}
            <div className="relative w-full lg:w-1/3 bg-[#050508] border border-white/5 rounded-xl overflow-hidden h-[120px] flex items-center justify-center">
              <canvas 
                ref={canvasRef} 
                width={400} 
                height={120} 
                className="w-full h-full block"
              />
              <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-[#050508]/80 px-2 py-0.5 rounded border border-white/5">
                <div className={`h-1.5 w-1.5 rounded-full ${isSynthPlaying ? "bg-[#39FF14] animate-ping" : "bg-red-500"}`}></div>
                <span className="text-[8px] text-zinc-400 font-bold uppercase tracking-wider">
                  {isSynthPlaying ? "LIVE WAVEFORM ANALYZER" : "SYSTEM STANDBY SIGNAL"}
                </span>
              </div>
              
              <div className="pointer-events-none absolute inset-0 bg-scanlines opacity-10"></div>
            </div>

            {/* Synthesizer Web Audio Controller */}
            <div className="flex-1 w-full flex flex-col justify-between">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border-b border-white/5 pb-2.5 mb-3">
                <div>
                  <h3 className="text-[#00F0FF] text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                    <Volume2 className="w-4 h-4 text-[#00F0FF]" /> {LOCAL_T[language].cyberModTitle}
                  </h3>
                  <p className="text-[9px] text-zinc-500 font-sans tracking-wide">{LOCAL_T[language].cyberModSub}</p>
                </div>

                <div className="flex items-center gap-3">
                  {isSynthPlaying ? (
                    <button 
                      onClick={stopAudio}
                      className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-2 shadow-[0_0_10px_rgba(220,38,38,0.4)] transition-all uppercase cursor-pointer"
                    >
                      <Square className="w-4 h-4" /> {LOCAL_T[language].stopLoop}
                    </button>
                  ) : (
                    <button 
                      onClick={startAudio}
                      className="bg-[#39FF14] hover:bg-[#39FF14]/80 text-black font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-2 shadow-[0_0_15px_rgba(57,255,20,0.5)] transition-all uppercase cursor-pointer"
                    >
                      <Play className="w-4 h-4" /> {LOCAL_T[language].playLoop}
                    </button>
                  )}
                </div>
              </div>

              {/* Synthesizer parameters */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5 text-[9px] font-sans">
                
                <div className="bg-[#12121f]/50 p-2.5 rounded-xl border border-white/5">
                  <div className="flex justify-between text-zinc-400 mb-1">
                    <span>{LOCAL_T[language].filterCutoff}</span>
                    <span className="text-[#39FF14] font-bold font-mono">{cutoff}Hz</span>
                  </div>
                  <input 
                    type="range" min="150" max="5000" step="50" value={cutoff} 
                    onChange={(e) => setCutoff(Number(e.target.value))}
                    className="w-full accent-[#39FF14] h-1 bg-[#050508] rounded"
                  />
                  <span className="text-[8px] text-zinc-500 block mt-1 font-mono">BiquadLowpass</span>
                </div>

                <div className="bg-[#12121f]/50 p-2.5 rounded-xl border border-white/5">
                  <div className="flex justify-between text-zinc-400 mb-1">
                    <span>{LOCAL_T[language].resonance}</span>
                    <span className="text-[#39FF14] font-bold font-mono">{resonance}</span>
                  </div>
                  <input 
                    type="range" min="1" max="25" step="1" value={resonance} 
                    onChange={(e) => setResonance(Number(e.target.value))}
                    className="w-full accent-[#39FF14] h-1 bg-[#050508] rounded"
                  />
                  <span className="text-[8px] text-zinc-500 block mt-1 font-mono">FilterFeedback</span>
                </div>

                <div className="bg-[#12121f]/50 p-2.5 rounded-xl border border-white/5">
                  <div className="flex justify-between text-zinc-400 mb-1">
                    <span>{LOCAL_T[language].delayTime}</span>
                    <span className="text-[#00F0FF] font-bold font-mono">{delayTime}s</span>
                  </div>
                  <input 
                    type="range" min="0.05" max="0.8" step="0.05" value={delayTime} 
                    onChange={(e) => setDelayTime(Number(e.target.value))}
                    className="w-full accent-[#00F0FF] h-1 bg-[#050508] rounded"
                  />
                  <span className="text-[8px] text-zinc-500 block mt-1 font-mono">DelayNodeFeedback</span>
                </div>

                <div className="bg-[#12121f]/50 p-2.5 rounded-xl border border-white/5">
                  <div className="flex justify-between text-zinc-400 mb-1">
                    <span>{LOCAL_T[language].bitcrusher}</span>
                    <span className="text-[#FF007F] font-bold font-mono">{distortionAmount}</span>
                  </div>
                  <input 
                    type="range" min="0" max="150" step="5" value={distortionAmount} 
                    onChange={(e) => setDistortionAmount(Number(e.target.value))}
                    className="w-full accent-[#FF007F] h-1 bg-[#050508] rounded"
                  />
                  <span className="text-[8px] text-zinc-500 block mt-1 font-mono">WaveShaperDist</span>
                </div>

                <div className="bg-[#12121f]/50 p-2.5 rounded-xl border border-white/5">
                  <div className="flex justify-between text-zinc-400 mb-1">
                    <span>{LOCAL_T[language].pitchOctave}</span>
                    <span className="text-[#00F0FF] font-bold font-mono">x{speed.toFixed(1)}</span>
                  </div>
                  <input 
                    type="range" min="0.5" max="3.0" step="0.1" value={speed} 
                    onChange={(e) => setSpeed(Number(e.target.value))}
                    className="w-full accent-[#00F0FF] h-1 bg-[#050508] rounded"
                  />
                  <span className="text-[8px] text-zinc-500 block mt-1 font-mono">OscillatorBaseFreq</span>
                </div>

              </div>
            </div>
          </div>
        </footer>

        {/* Secure Banner */}
        <div className="flex items-center justify-between bg-red-950/20 border border-red-900/40 p-3 rounded-xl text-[9px] text-red-400 mb-20">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-[#FF007F] animate-pulse" />
            <span>{LOCAL_T[language].secureBanner}</span>
          </div>
          <span className="hidden sm:inline">USER PROTOCOL: RFC-5424 SECURE LOGGER</span>
        </div>

        {/* VIP Rewards Shop section (already integrated in footer of original page) */}
        <div className="mt-20">
          <VIPRewardsShop />
        </div>

      </div>

    </div>
  );
}
