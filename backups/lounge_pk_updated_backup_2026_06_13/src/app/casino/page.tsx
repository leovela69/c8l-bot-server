"use client";
import React, { useState, useEffect } from "react";
import { useApp } from "../../context/AppContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, Coins, Dices, RefreshCw, X, ShoppingBag, 
  CreditCard, Flame
} from "lucide-react";

import RouletteGame from "../../components/casino/RouletteGame";
import SolitaireGame from "../../components/casino/SolitaireGame";
import DerbyGame from "../../components/casino/DerbyGame";
import FormulaGame from "../../components/casino/FormulaGame";
import { C8LQuantumSlot } from "../../components/games/slots/C8LQuantumSlot";
import { SirenasSlot } from "../../components/games/slots/SirenasSlot";
import { ZiriaCoinsSlot } from "../../components/games/slots/ZiriaCoinsSlot";
import AmbientPlayer from "../../components/audio/AmbientPlayer";

type GameTab = "salaQuantum" | "roulette" | "solitaire" | "derby" | "f1" | "quantumSlot" | "sirenasSlot" | "ziriaSlot";

export default function CasinoPage() {
  const { language, user, loading, c8lCoins, setC8lCoins, addCCoins, showNotification, loginWithMockUser } = useApp();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<GameTab>("salaQuantum");
  const [showRefillModal, setShowRefillModal] = useState(false);
  const [refillLoading, setRefillLoading] = useState(false);
  const [selectedPack, setSelectedPack] = useState<{ name: string; amount: number; price: number } | null>(null);
  // Progressive Jackpot states
  const [jackpot, setJackpot] = useState(124500);
  const [shakeTrigger, setShakeTrigger] = useState(false);

  useEffect(() => {
    const handleShake = () => {
      setShakeTrigger(true);
      setTimeout(() => setShakeTrigger(false), 600);
    };
    window.addEventListener('c8l-screen-shake', handleShake);
    return () => window.removeEventListener('c8l-screen-shake', handleShake);
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("c8l_jackpot");
    let currentJackpot = saved ? parseInt(saved, 10) : 124500;
    setJackpot(currentJackpot);

    // Passive ticker: increments by 1-3 coins every 3 seconds
    const interval = setInterval(() => {
      currentJackpot += Math.floor(Math.random() * 2) + 1;
      localStorage.setItem("c8l_jackpot", currentJackpot.toString());
      setJackpot(currentJackpot);
    }, 3000);

    // Listener for casino bets
    const handleBetAccumulation = (e: Event) => {
      const customEvent = e as CustomEvent<{ bet: number }>;
      const bet = customEvent.detail?.bet || 15;
      const increment = Math.max(1, Math.floor(bet * 0.05));
      currentJackpot += increment;
      localStorage.setItem("c8l_jackpot", currentJackpot.toString());
      setJackpot(currentJackpot);
    };

    // Listener for jackpot won
    const handleJackpotWon = (e: Event) => {
      const customEvent = e as CustomEvent<{ amount: number }>;
      const amount = customEvent.detail?.amount || 0;
      currentJackpot -= amount;
      localStorage.setItem("c8l_jackpot", currentJackpot.toString());
      setJackpot(currentJackpot);
    };

    window.addEventListener('c8l-jackpot-bet', handleBetAccumulation);
    window.addEventListener('c8l-jackpot-won', handleJackpotWon);

    return () => {
      clearInterval(interval);
      window.removeEventListener('c8l-jackpot-bet', handleBetAccumulation);
      window.removeEventListener('c8l-jackpot-won', handleJackpotWon);
    };
  }, []);

  // Gates access for logged in users
  useEffect(() => {
    if (!loading && !user) {
      showNotification(
        language === "es" ? "Iniciando demostración VIP en Casino..." : "Starting VIP demo in Casino...",
        "info"
      );
      loginWithMockUser();
    }
  }, [user, loading, loginWithMockUser, language, showNotification]);

  const handleRefillCoins = (pack: { name: string; amount: number; price: number }) => {
    setSelectedPack(pack);
    setRefillLoading(true);
    
    // Simulate Stripe payment gateway latency
    setTimeout(() => {
      addCCoins(pack.amount);
      setRefillLoading(false);
      setShowRefillModal(false);
      showNotification(
        language === "es"
          ? `¡Recarga de C8L Coins completada! +${pack.amount} monedas añadidas mediante pasarela.`
          : `Refill successful! +${pack.amount} C8L Coins added via payment gateway.`,
        "success"
      );
    }, 2000);
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white font-sans">
        <div className="w-10 h-10 rounded-full border-t-2 border-[var(--color-gold)] animate-spin mx-auto mb-4"></div>
      </div>
    );
  }

  const COIN_PACKS = [
    { name: "Pack Básico", amount: 200, price: 2.99 },
    { name: "Pack Streamer Hype", amount: 1000, price: 9.99 },
    { name: "Jackpot Whale Pack", amount: 5000, price: 39.99 }
  ];

  return (
    <div className={`min-h-screen text-white relative font-sans pt-32 pb-24 overflow-hidden bg-gradient-to-br from-[#0c0507] via-[#050505] to-[#120409] transition-transform duration-75 ${shakeTrigger ? "animate-camera-shake" : ""}`}>
      {shakeTrigger && (
        <div className="fixed inset-0 pointer-events-none z-[160] animate-anime-flash" />
      )}
      {shakeTrigger && (
        <div className="fixed inset-0 pointer-events-none z-[155] anime-speed-lines" />
      )}
      <div className="digital-grid-animated" />
      <div className="hologram-scanline" />
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/black-thread.png')] opacity-10 pointer-events-none"></div>

      <div className="container mx-auto px-6 max-w-6xl relative z-10">
        
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-12 border-b border-white/5 pb-6">
          <Link 
            href="/community" 
            className="flex items-center gap-2 text-sm text-zinc-400 hover:text-[var(--color-gold)] transition-colors"
          >
            <ArrowLeft size={16} />
            <span>Volver a la Comunidad</span>
          </Link>
          
          {/* Game Selector Tab */}
          <div className="flex bg-black border border-white/10 rounded-full p-1 font-heading text-xs tracking-wider overflow-x-auto no-scrollbar max-w-full">
            {[
              { id: "salaQuantum", label: language === "es" ? "🕹️ Sala Principal" : "🕹️ Main Room" },
              { id: "roulette", label: language === "es" ? "🎰 Ruleta" : "🎰 Roulette" },
              { id: "quantumSlot", label: language === "es" ? "⚛️ Quantum Slot" : "⚛️ Quantum Slot" },
              { id: "sirenasSlot", label: language === "es" ? "🧜‍♀️ Sirenas Slot" : "🧜‍♀️ Sirenas Slot" },
              { id: "ziriaSlot", label: language === "es" ? "🪙 Ziria Slot" : "🪙 Ziria Slot" },
              { id: "solitaire", label: language === "es" ? "🃏 Solitario" : "🃏 Solitaire" },
              { id: "derby", label: language === "es" ? "🐎 Derby Hype" : "🐎 Derby Hype" },
              { id: "f1", label: language === "es" ? "🏎️ Micro F1" : "🏎️ Micro F1" }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as GameTab)}
                className={`px-4 py-2 rounded-full transition-all cursor-pointer ${
                  activeTab === tab.id ? "bg-[var(--color-gold)] text-black font-bold" : "text-zinc-400 hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Coins balance and refill button */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-black/60 border border-[var(--color-gold)]/30 text-sm font-mono text-[var(--color-gold)] box-glow-gold">
              <Coins size={16} />
              <span className="font-bold">{c8lCoins} Coins</span>
            </div>
            <button
              onClick={() => setShowRefillModal(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-full text-xs font-bold uppercase transition-colors flex items-center gap-1.5 cursor-pointer box-glow-neon text-black"
            >
              <ShoppingBag size={12} />
              <span>{language === "es" ? "Comprar Coins" : "Buy Coins"}</span>
            </button>
          </div>
        </div>

        {/* Title Section */}
        <div className="text-center mb-10">
          <span className="text-[10px] font-mono text-[var(--color-gold)] uppercase tracking-widest font-bold block mb-1">
            C8L Social Platform Casino
          </span>
          <h1 className="font-heading font-black text-4xl md:text-5xl uppercase tracking-tight text-white">
            El Casino Quantum
          </h1>
          <p className="text-zinc-500 text-xs mt-2 max-w-md mx-auto mb-6">
            Aposta tus C8L Coins en nuestros algoritmos certificados y disfruta del verdadero azar de marketing interactivo.
          </p>

          {/* Glowing Progressive Jackpot Ticker */}
          <div className="bg-[#0c0507]/80 backdrop-blur-md border-2 border-[#FF0055]/40 shadow-[0_0_20px_rgba(255,0,85,0.25)] hover:border-[#00F3FF]/60 hover:shadow-[0_0_30px_rgba(0,243,255,0.35)] p-5 text-center max-w-md mx-auto mb-6 transition-all duration-300 rounded-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,_rgba(255,0,85,0.05)_50%)] bg-[size:100%_4px] pointer-events-none" />
            <span className="text-[9px] font-mono text-[#FF0055] text-glow-neon uppercase tracking-widest font-black block mb-1">
              🔥 POZO ACUMULADO JACKPOT QUANTUM 🔥
            </span>
            <strong className="text-3xl font-mono text-[#D4AF37] tracking-wider text-glow-gold animate-pulse block my-1">
              {jackpot.toLocaleString()} C8L COINS
            </strong>
            <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest mt-1 block">
              Acumulación de apuestas activa en vivo • RTP certificado
            </span>
          </div>
        </div>

        {/* ACTIVE GAME RENDER ARENA */}
        <div className={`relative w-full ${
          activeTab === "salaQuantum" 
            ? "p-0 min-h-[500px]" 
            : "bg-black/20 border border-white/5 rounded-3xl p-4 sm:p-8 min-h-[500px] flex items-center justify-center box-glow-neon"
        }`}>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="w-full"
            >
              {activeTab === "salaQuantum" && (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 w-full items-start">
                  <div className="border-2 border-[#D4AF37]/30 bg-[#0d0d0e]/85 backdrop-blur-md p-6 rounded-2xl relative overflow-hidden shadow-[0_0_30px_rgba(212,175,55,0.2)] hover:border-[#D4AF37]/60 hover:shadow-[0_0_35px_rgba(212,175,55,0.35)] transition-all duration-300 c8l-scanlines">
                    <div className="absolute top-3 right-3 flex gap-1.5 z-20">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#D4AF37] animate-pulse shadow-[0_0_8px_#D4AF37]"></span>
                      <span className="text-[9px] font-mono text-[#D4AF37] uppercase tracking-wider font-bold">CABINET A: RULETA</span>
                    </div>
                    <RouletteGame compact={true} />
                  </div>
                  <C8LQuantumSlot userCoins={c8lCoins} setUserCoins={setC8lCoins} />
                </div>
              )}
              {activeTab === "roulette" && <RouletteGame />}
              {activeTab === "quantumSlot" && (
                <C8LQuantumSlot userCoins={c8lCoins} setUserCoins={setC8lCoins} />
              )}
              {activeTab === "sirenasSlot" && (
                <SirenasSlot userCoins={c8lCoins} setUserCoins={setC8lCoins} />
              )}
              {activeTab === "ziriaSlot" && (
                <ZiriaCoinsSlot userCoins={c8lCoins} setUserCoins={setC8lCoins} />
              )}
              {activeTab === "solitaire" && <SolitaireGame />}
              {activeTab === "derby" && <DerbyGame />}
              {activeTab === "f1" && <FormulaGame />}
            </motion.div>
          </AnimatePresence>
        </div>

      </div>

      {/* Ambient Music Player */}
      <AmbientPlayer />

      {/* Recarga Coins Modal (Stripe mockups) */}
      <AnimatePresence>
        {showRefillModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[120] flex items-center justify-center bg-black/90 backdrop-blur-md p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="relative w-full max-w-md glass-panel p-8 rounded-3xl border border-[var(--color-gold)]/30 box-glow-gold bg-[#0A0A0C]"
            >
              <button
                onClick={() => setShowRefillModal(false)}
                disabled={refillLoading}
                className="absolute top-4 right-4 text-zinc-400 hover:text-white transition cursor-pointer"
              >
                <X size={20} />
              </button>

              <div className="w-12 h-12 rounded-full bg-[var(--color-gold)]/10 border border-[var(--color-gold)]/30 flex items-center justify-center text-[var(--color-gold)] mx-auto mb-6 text-2xl">
                <Coins />
              </div>

              <h3 className="font-heading font-black text-2xl text-center uppercase text-white mb-2 tracking-wider">
                Recargar C8L Coins
              </h3>
              <p className="text-zinc-500 text-xs text-center mb-6">
                Compra paquetes de monedas virtuales procesadas de manera segura. El 97.3% se devuelve en premios y el streamer recibe una comisión directa de las salas.
              </p>

              {refillLoading ? (
                <div className="text-center py-12">
                  <div className="w-10 h-10 rounded-full border-t-2 border-[var(--color-gold)] animate-spin mx-auto mb-4"></div>
                  <p className="text-zinc-400 font-mono text-xs uppercase tracking-widest animate-pulse">Conectando con Stripe Gateway...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {COIN_PACKS.map((pack) => (
                    <button
                      key={pack.name}
                      onClick={() => handleRefillCoins(pack)}
                      className="w-full p-4 rounded-2xl bg-white/[0.01] hover:bg-[var(--color-gold)]/5 border border-white/10 hover:border-[var(--color-gold)]/50 transition-all flex items-center justify-between text-left cursor-pointer group"
                    >
                      <div>
                        <strong className="text-xs text-white block group-hover:text-[var(--color-gold)] transition-colors">{pack.name}</strong>
                        <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mt-0.5 inline-block">+{pack.amount} C8L Coins</span>
                      </div>
                      <span className="text-xs font-mono font-bold text-emerald-400 group-hover:scale-105 transition-transform flex items-center gap-1">
                        <CreditCard size={12} />
                        €{pack.price}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              <p className="text-[9px] text-zinc-600 text-center mt-6 uppercase font-mono tracking-wider">
                🔒 PAGO PROTEGIDO POR STRIPE Y PAYPAL
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
