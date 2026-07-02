"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Flame, Activity, Sliders, Shield, Volume2, ShieldAlert, Cpu, 
  Trophy, Swords, Zap, HelpCircle, Coins, RefreshCw, BarChart2, Play
} from "lucide-react";
import LionMascot from "./LionMascot";

interface Track {
  id: string;
  title: string;
  producer: string;
  genre: string;
  votes: number;
  waveform: number[];
  multiplier: number;
}

export default function CyberpunkDashboard() {
  // Demo state for the tracks in PK battles
  const [tracks, setTracks] = useState<Track[]>([
    {
      id: "track-1",
      title: "Bolero-House Cuántico",
      producer: "Leo Vela AI",
      genre: "Quantum House",
      votes: 1420,
      waveform: [40, 60, 45, 80, 95, 70, 50, 85, 90, 60, 40, 75, 80, 50, 30],
      multiplier: 1.5
    },
    {
      id: "track-2",
      title: "Cyber-Dembow Core",
      producer: "SubAgent Alpha",
      genre: "Reggaeton IA",
      votes: 1180,
      waveform: [30, 45, 70, 90, 80, 55, 65, 85, 75, 50, 60, 95, 85, 45, 20],
      multiplier: 2.0
    }
  ]);

  const [activeTab, setActiveTab] = useState<"deck" | "showdown" | "logs">("deck");
  const [selectedTrack, setSelectedTrack] = useState<string>("track-1");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processProgress, setProcessProgress] = useState<number>(0);
  const [logMessages, setLogMessages] = useState<string[]>([
    "[SYSTEM CORE]: Leo Vela AI mastering environment initiated.",
    "[BUFFER LOG]: Memory matrix sync completed. 0xCC45A",
    "[PK AGENT]: Showdown telemetry loaded. Monitoring active tracks."
  ]);
  const [userCoins, setUserCoins] = useState<number>(3420);
  const [userLevel, setUserLevel] = useState<number>(14);
  const [userXP, setUserXP] = useState<number>(750);
  const [mascotState, setMascotState] = useState<"idle" | "dance" | "win" | "sad" | "celebrate">("idle");

  // Track vote updates simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setTracks(prev => prev.map(track => {
        const increment = Math.floor(Math.random() * 5);
        return {
          ...track,
          votes: track.votes + increment
        };
      }));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleVote = (trackId: string) => {
    if (userCoins < 50) {
      addLog("[VAULT STATUS]: Insufficient C8L Coins for vote injection.");
      setMascotState("sad");
      setTimeout(() => setMascotState("idle"), 1500);
      return;
    }
    setUserCoins(prev => prev - 50);
    setTracks(prev => prev.map(t => {
      if (t.id === trackId) {
        return { ...t, votes: t.votes + 50 };
      }
      return t;
    }));
    addLog(`[PK VOTE]: Injected 50 votes to ${trackId === "track-1" ? "Bolero-House" : "Cyber-Dembow"}.`);
    setMascotState("win");
    setTimeout(() => setMascotState("idle"), 1500);
  };

  const startMastering = () => {
    if (isProcessing) return;
    setIsProcessing(true);
    setProcessProgress(0);
    setMascotState("dance");
    addLog("[MASTER DECK]: Audio upload detected. Commencing spectral alignment...");

    const interval = setInterval(() => {
      setProcessProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsProcessing(false);
          setMascotState("celebrate");
          addLog("[MASTER DECK]: Spectral alignment finalized. Audio tracks synced.");
          setTimeout(() => setMascotState("idle"), 2000);
          return 100;
        }
        return prev + 10;
      });
    }, 300);
  };

  const addLog = (msg: string) => {
    const time = new Date().toLocaleTimeString();
    setLogMessages(prev => [`[${time}] ${msg}`, ...prev.slice(0, 14)]);
  };

  const selectedTrackData = tracks.find(t => t.id === selectedTrack) || tracks[0];

  // Calculate battle ratios
  const totalVotes = tracks[0].votes + tracks[1].votes;
  const t1Ratio = Math.round((tracks[0].votes / totalVotes) * 100) || 50;
  const t2Ratio = 100 - t1Ratio;

  return (
    <div className="min-h-screen bg-[#000000] text-white p-6 font-sans relative overflow-hidden select-none">
      {/* Dynamic Scanline scan lines */}
      <div 
        className="absolute inset-0 pointer-events-none bg-[size:100%_4px,4px_100%] opacity-40 z-10"
        style={{
          backgroundImage: "linear-gradient(rgba(18,16,16,0) 50%, rgba(0,243,255,0.08) 50%), linear-gradient(90deg, rgba(0,243,255,0.01), rgba(0,243,255,0.01))"
        }}
      />

      <div className="max-w-7xl mx-auto flex flex-col gap-6 relative z-20">
        
        {/* ========================================================================= */}
        {/* HUD HEADER COCKPIT */}
        {/* ========================================================================= */}
        <header className="border-3 border-black bg-[#0d0d0e] p-4 flex flex-col md:flex-row justify-between items-center gap-4 shadow-[4px_4px_0px_#00F3FF]">
          
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full border-2 border-[#D4AF37] bg-black flex items-center justify-center overflow-hidden">
              <LionMascot state={mascotState} size={64} className="mt-[-2px]" />
            </div>
            <div>
              <h1 className="font-heading font-black text-xl tracking-wider text-[#00F3FF] uppercase">
                C8L MUSIC IA STUDIO
              </h1>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
                  BANDWIDTH STATUS: ACTIVE // NODE 0X554B
                </span>
              </div>
            </div>
          </div>

          {/* Gamer stats readout */}
          <div className="flex flex-wrap items-center gap-6 font-mono text-xs">
            
            {/* Level and XP Meter */}
            <div className="flex flex-col gap-1 w-44">
              <div className="flex justify-between text-[9px] text-zinc-500 uppercase tracking-widest">
                <span>LVL {userLevel} CREATOR</span>
                <span className="text-[#00F3FF]">{userXP}/1000 XP</span>
              </div>
              <div className="flex h-3 bg-black border-2 border-zinc-800 p-0.5 rounded-sm">
                <div 
                  className="bg-gradient-to-r from-[#FF0055] to-[#00F3FF] transition-all duration-300"
                  style={{ width: `${(userXP / 1000) * 100}%` }}
                />
              </div>
            </div>

            {/* Coins Vault */}
            <div className="border-2 border-black bg-black px-4 py-2 flex items-center gap-2 rounded-sm shadow-[2px_2px_0px_#D4AF37]">
              <Coins className="text-[#D4AF37] animate-spin" size={16} />
              <div>
                <span className="text-[9px] text-zinc-500 block uppercase leading-none">VAULT COINS</span>
                <span className="text-[#D4AF37] font-black text-sm">{userCoins} C8L</span>
              </div>
            </div>

            {/* Active PK Status */}
            <div className="bg-[#FF0055]/10 border-2 border-[#FF0055] px-4 py-2 flex items-center gap-2 rounded-sm animate-pulse">
              <Flame className="text-[#FF0055]" size={16} />
              <div>
                <span className="text-[9px] text-[#FF0055] block uppercase leading-none">PK STATE</span>
                <span className="text-white font-black text-xs">BATTLE OVERLOAD</span>
              </div>
            </div>

          </div>
        </header>

        {/* ========================================================================= */}
        {/* DASHBOARD GRID CONTENT */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* LEFT TELEMETRY NAV PANEL (4 Columns) */}
          <aside className="lg:col-span-4 flex flex-col gap-6">
            
            {/* HUD Navigation Switcher */}
            <div className="border-3 border-black bg-[#0d0d0e] p-4 shadow-[4px_4px_0px_#00F3FF]">
              <h2 className="text-xs font-mono font-black text-zinc-500 uppercase tracking-widest mb-3">
                // COMMAND CENTER SELECT
              </h2>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => { setActiveTab("deck"); setMascotState("idle"); }}
                  className={`w-full py-3 px-4 border-2 border-black font-heading font-black text-xs uppercase tracking-wider text-left transition-all flex items-center justify-between cursor-pointer ${
                    activeTab === "deck" 
                      ? "bg-[#00F3FF] text-black shadow-[2px_2px_0px_#FFFFFF] font-bold" 
                      : "bg-black text-zinc-400 hover:text-white hover:border-[#00F3FF]"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Sliders size={14} /> 1. MASTER DECK CONSOLE
                  </span>
                  {activeTab === "deck" && <span className="animate-ping">■</span>}
                </button>

                <button
                  onClick={() => { setActiveTab("showdown"); setMascotState("dance"); }}
                  className={`w-full py-3 px-4 border-2 border-black font-heading font-black text-xs uppercase tracking-wider text-left transition-all flex items-center justify-between cursor-pointer ${
                    activeTab === "showdown" 
                      ? "bg-[#FF0055] text-white shadow-[2px_2px_0px_#FFFFFF] font-bold" 
                      : "bg-black text-zinc-400 hover:text-white hover:border-[#FF0055]"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Swords size={14} /> 2. PK SHOWDOWN RING
                  </span>
                  {activeTab === "showdown" && <span className="animate-ping">■</span>}
                </button>

                <button
                  onClick={() => { setActiveTab("logs"); setMascotState("idle"); }}
                  className={`w-full py-3 px-4 border-2 border-black font-heading font-black text-xs uppercase tracking-wider text-left transition-all flex items-center justify-between cursor-pointer ${
                    activeTab === "logs" 
                      ? "bg-[#D4AF37] text-black shadow-[2px_2px_0px_#FFFFFF] font-bold" 
                      : "bg-black text-zinc-400 hover:text-white hover:border-[#D4AF37]"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Activity size={14} /> 3. LOG MATRIX STATES
                  </span>
                  {activeTab === "logs" && <span className="animate-ping">■</span>}
                </button>
              </div>
            </div>

            {/* Quick Track Selection & Telemetry */}
            <div className="border-3 border-black bg-[#0d0d0e] p-4 shadow-[4px_4px_0px_#00F3FF]">
              <h2 className="text-xs font-mono font-black text-zinc-500 uppercase tracking-widest mb-3">
                // TARGET ACTIVE TRACK
              </h2>
              <div className="flex flex-col gap-2">
                {tracks.map(t => (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTrack(t.id)}
                    className={`p-3 border-2 text-left transition-all rounded-sm flex justify-between items-center cursor-pointer ${
                      selectedTrack === t.id 
                        ? "border-[#00F3FF] bg-[#00F3FF]/5 shadow-[0_0_10px_rgba(0,243,255,0.2)]" 
                        : "border-zinc-800 bg-black hover:border-zinc-600"
                    }`}
                  >
                    <div>
                      <span className="text-xs font-bold block">{t.title}</span>
                      <span className="text-[9px] font-mono text-zinc-500 uppercase block mt-0.5">
                        Prod: {t.producer} // {t.genre}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-mono font-black text-[#D4AF37] block">
                        {t.votes} HP
                      </span>
                      <span className="text-[8px] bg-zinc-950 px-1 py-0.5 border border-zinc-800 text-zinc-400 rounded-sm font-mono mt-1 inline-block">
                        X{t.multiplier} MULTI
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Simulated System Status Telemetry */}
            <div className="border-3 border-black bg-[#0d0d0e] p-4 shadow-[4px_4px_0px_#FF0055] font-mono text-[10px]">
              <div className="flex justify-between border-b border-zinc-800 pb-2 mb-2 text-zinc-500">
                <span>TELEMETRY MODULE</span>
                <span className="text-[#FF0055] animate-pulse">// READY</span>
              </div>
              <div className="flex flex-col gap-1.5 text-zinc-400">
                <div className="flex justify-between">
                  <span>DSP BUFFER RATE:</span>
                  <span className="text-white font-bold">99.84%</span>
                </div>
                <div className="flex justify-between">
                  <span>PK MATCH RATIO:</span>
                  <span className="text-[#FF0055] font-bold">{t1Ratio}% VS {t2Ratio}%</span>
                </div>
                <div className="flex justify-between">
                  <span>VAULT LIMIT:</span>
                  <span className="text-[#D4AF37] font-bold">SECURED</span>
                </div>
                <div className="flex justify-between">
                  <span>AI SUB-CORE STATUS:</span>
                  <span className="text-emerald-500 font-bold">OK</span>
                </div>
              </div>
            </div>

          </aside>

          {/* MAIN CONSOLE AREA (8 Columns) */}
          <main className="lg:col-span-8 flex flex-col gap-6">

            <AnimatePresence mode="wait">
              
              {/* TAB 1: MASTERING CONSOLE DECK */}
              {activeTab === "deck" && (
                <motion.div
                  key="deck"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col gap-6"
                >
                  {/* Waveform visualizer panel */}
                  <div className="border-3 border-black bg-[#0d0d0e] p-6 rounded-lg shadow-[4px_4px_0px_#00F3FF] relative overflow-hidden">
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,_rgba(0,243,255,0.05)_50%)] bg-[size:100%_4px] pointer-events-none" />
                    
                    <div className="flex justify-between items-center border-b-2 border-black pb-3 mb-6 relative z-20">
                      <div className="flex items-center gap-2">
                        <Volume2 className="text-[#00F3FF]" size={18} />
                        <h3 className="font-heading font-black text-sm uppercase tracking-wider">
                          AI Spectral Frequencies: {selectedTrackData.title}
                        </h3>
                      </div>
                      <span className="text-[10px] font-mono bg-zinc-950 px-2 py-1 border border-zinc-800 text-zinc-500 rounded-sm">
                        AUDIO ENGINE VER. 4.2.1
                      </span>
                    </div>

                    {/* Interactive wave visual */}
                    <div className="relative z-10 flex items-end gap-2 h-44 justify-between select-none">
                      {selectedTrackData.waveform.map((val, idx) => (
                        <div key={idx} className="flex-grow h-full flex flex-col justify-end">
                          <div 
                            className="w-full border-2 border-black bg-[#00F3FF] hover:bg-[#FF0055] transition-all duration-200"
                            style={{ height: `${val}%` }}
                          />
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 flex justify-between border-t-2 border-black pt-3 font-mono text-[9px] text-zinc-500">
                      <span>AUDIO BUFFER: ACTIVE MASTERING NODE</span>
                      <span className="text-[#00F3FF]">INTELLIGENT EQUALIZER SYNTAX INJECTED</span>
                    </div>
                  </div>

                  {/* mastering deck action controller */}
                  <div className="border-3 border-black bg-[#0d0d0e] p-6 shadow-[4px_4px_0px_#D4AF37]">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                      <div>
                        <h4 className="font-heading font-black text-sm text-[#D4AF37] uppercase tracking-wider">
                          Ready to optimize spectral gain?
                        </h4>
                        <p className="text-xs text-zinc-400 mt-1 max-w-lg">
                          Clicking run initiates the C8L AI sub-agent mastering pipeline. It optimizes the track's spatial compression parameters, enhancing bass and high-shelf fidelity automatically.
                        </p>
                      </div>
                      
                      <div className="flex flex-col items-center gap-2 w-full md:w-auto">
                        <button
                          onClick={startMastering}
                          disabled={isProcessing}
                          className="w-full md:w-44 py-3 bg-[#D4AF37] text-black font-heading font-black text-xs uppercase tracking-wider border-2 border-black shadow-[2px_2px_0px_#FFFFFF] hover:bg-[#ffe066] transition disabled:opacity-40 flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <Play size={14} />
                          {isProcessing ? "PROCESSING..." : "RUN AI MASTER"}
                        </button>
                        {isProcessing && (
                          <span className="font-mono text-[10px] text-[#D4AF37] animate-pulse">
                            Progress: {processProgress}%
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Progress tracking linear */}
                    {isProcessing && (
                      <div className="w-full bg-black border-2 border-zinc-800 p-0.5 rounded-sm mt-4">
                        <div 
                          className="h-3 bg-[#D4AF37] transition-all duration-300"
                          style={{ width: `${processProgress}%` }}
                        />
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* TAB 2: PK SHOWDOWN RING */}
              {activeTab === "showdown" && (
                <motion.div
                  key="showdown"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col gap-6"
                >
                  {/* The PK Showdown Combat HUD */}
                  <div className="border-3 border-black bg-[#0d0d0e] p-6 shadow-[4px_4px_0px_#FF0055] relative overflow-hidden">
                    <div className="absolute top-2 right-2 bg-black border-2 border-[#FF0055] text-[#FF0055] text-[9px] px-2 py-0.5 font-mono uppercase tracking-widest animate-pulse">
                      [ ACTIVE SHOWDOWN ]
                    </div>

                    <h3 className="font-heading font-black text-sm text-[#FF0055] uppercase tracking-wider mb-6 flex items-center gap-2 border-b-2 border-black pb-3">
                      <Swords size={18} /> PK BATTLE RING INJECTOR
                    </h3>

                    {/* Fighter Portrait Dual Columns */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center relative z-10">
                      
                      {/* Fighter 1 (Left) */}
                      <div className="border-2 border-black bg-black p-4 shadow-[3px_3px_0px_#00F3FF] rounded-sm text-center relative">
                        <span className="absolute -top-3 left-4 bg-[#00F3FF] text-black text-[9px] font-mono px-2 py-0.5 uppercase font-bold border border-black">
                          CHALLENGER 1
                        </span>
                        <h4 className="font-heading font-black text-sm uppercase text-white mt-2">
                          {tracks[0].title}
                        </h4>
                        <span className="text-[10px] font-mono text-zinc-500 block uppercase mt-1">
                          PROD: {tracks[0].producer}
                        </span>
                        
                        <div className="my-4 font-mono font-black text-2xl text-[#00F3FF]">
                          {tracks[0].votes} HP
                        </div>
                        
                        <button
                          onClick={() => handleVote("track-1")}
                          className="w-full py-2 bg-[#00F3FF] text-black font-heading font-black text-xs uppercase tracking-wider border-2 border-black shadow-[2px_2px_0px_#FFFFFF] hover:bg-cyan-300 transition cursor-pointer"
                        >
                          VOTE +50 HP (-50 COINS)
                        </button>
                      </div>

                      {/* Fighter 2 (Right) */}
                      <div className="border-2 border-black bg-black p-4 shadow-[3px_3px_0px_#FF0055] rounded-sm text-center relative">
                        <span className="absolute -top-3 left-4 bg-[#FF0055] text-white text-[9px] font-mono px-2 py-0.5 uppercase font-bold border border-black">
                          CHALLENGER 2
                        </span>
                        <h4 className="font-heading font-black text-sm uppercase text-white mt-2">
                          {tracks[1].title}
                        </h4>
                        <span className="text-[10px] font-mono text-zinc-500 block uppercase mt-1">
                          PROD: {tracks[1].producer}
                        </span>
                        
                        <div className="my-4 font-mono font-black text-2xl text-[#FF0055]">
                          {tracks[1].votes} HP
                        </div>

                        <button
                          onClick={() => handleVote("track-2")}
                          className="w-full py-2 bg-[#FF0055] text-white font-heading font-black text-xs uppercase tracking-wider border-2 border-black shadow-[2px_2px_0px_#FFFFFF] hover:bg-rose-500 transition cursor-pointer"
                        >
                          VOTE +50 HP (-50 COINS)
                        </button>
                      </div>

                    </div>

                    {/* Shared Gamer HP Bar */}
                    <div className="mt-8">
                      <div className="flex justify-between font-mono text-[10px] text-zinc-500 uppercase tracking-widest mb-2">
                        <span>{tracks[0].title} ({t1Ratio}%)</span>
                        <span>{tracks[1].title} ({t2Ratio}%)</span>
                      </div>
                      
                      <div className="flex h-6 bg-black border-2 border-zinc-800 p-0.5 rounded-sm relative overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-cyan-400 to-[#00F3FF] transition-all duration-500"
                          style={{ width: `${t1Ratio}%` }}
                        />
                        <div 
                          className="h-full bg-gradient-to-r from-rose-500 to-[#FF0055] transition-all duration-500"
                          style={{ width: `${t2Ratio}%` }}
                        />
                      </div>
                    </div>

                    {/* Arena description */}
                    <div className="mt-6 border-t-2 border-black pt-4 font-mono text-[9px] text-zinc-500">
                      <span>ARENA STABILITY: LOADED (MULTIPLIERS APPLIED ON RESOLUTION)</span>
                    </div>

                  </div>
                </motion.div>
              )}

              {/* TAB 3: LOG CONSOLE STATES */}
              {activeTab === "logs" && (
                <motion.div
                  key="logs"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col gap-6"
                >
                  {/* Console Logs Panel */}
                  <div className="border-3 border-black bg-[#0d0d0e] p-6 shadow-[4px_4px_0px_#D4AF37] font-mono text-xs">
                    <h3 className="font-heading font-black text-sm text-[#D4AF37] uppercase tracking-wider mb-4 border-b-2 border-black pb-3 flex items-center gap-2">
                      <Activity size={16} /> SYSTEM TELEMETRY DUMP
                    </h3>
                    
                    <div className="bg-black border-2 border-zinc-900 rounded-sm p-4 h-72 overflow-y-auto flex flex-col gap-2 select-text selection:bg-[#D4AF37] selection:text-black">
                      {logMessages.map((log, idx) => (
                        <div key={idx} className="text-zinc-400 border-b border-zinc-950 pb-1.5 last:border-b-0 leading-relaxed">
                          <span className="text-[#00F3FF] mr-2">❯</span>
                          {log}
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 flex justify-between text-[10px] text-zinc-500">
                      <span>LOG LENGTH: {logMessages.length} / 15 CACHED</span>
                      <button 
                        onClick={() => {
                          setLogMessages(["[SYSTEM CLDR]: Logs purged and restarted."]);
                          addLog("[SYSTEM CORE]: Refreshed nodes.");
                        }}
                        className="hover:text-white transition flex items-center gap-1 cursor-pointer"
                      >
                        <RefreshCw size={10} /> CLEAR LOG BUFFER
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

            </AnimatePresence>

          </main>

        </div>

      </div>
    </div>
  );
}
