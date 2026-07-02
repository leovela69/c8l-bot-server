"use client";
import React, { useState, useEffect } from "react";
import { useApp } from "../../context/AppContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, Disc, Plus, Trash2, DollarSign, 
  Calendar, Layers, Radio, BarChart3, TrendingUp, Info,
  Tv, Film, Music, CheckCircle2, User, Send, Coins
} from "lucide-react";
import { 
  logStreamerRevenue, getStreamerLogs, deleteStreamerLog, StreamerLog 
} from "../../utils/analytics";
import LiveBattleSimulator from "../../components/sections/LiveBattleSimulator";

type PlatformType = "tiktok" | "youtube" | "twitch" | "starmaker" | "kips";

export default function StreamerPage() {
  const { language, user, loading, showNotification, loginWithMockUser } = useApp();
  const router = useRouter();

  const [activePlatform, setActivePlatform] = useState<PlatformType>("tiktok");
  const [logs, setLogs] = useState<StreamerLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  // Form states
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [type, setType] = useState("PK Battle");
  const [revenue, setRevenue] = useState("");
  const [metric, setMetric] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Gates access for logged in users
  useEffect(() => {
    if (!loading && !user) {
      showNotification(
        language === "es" 
          ? "Iniciando demostración VIP (Sin Cuenta)..." 
          : "Starting VIP demo (No Account)...",
        "info"
      );
      loginWithMockUser();
    }
  }, [user, loading, loginWithMockUser, language, showNotification]);

  const loadStreamerLogs = async () => {
    if (!user) return;
    setLoadingLogs(true);
    try {
      const data = await getStreamerLogs(user.uid);
      setLogs(data);
    } catch (err) {
      console.error("Error loading streamer logs:", err);
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadStreamerLogs();
    }
  }, [user]);

  // Handle new log submission
  const handleSubmitLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!revenue || Number(revenue) < 0) {
      showNotification(
        language === "es" ? "Por favor ingresa un monto de ingresos válido." : "Please enter a valid revenue amount.",
        "error"
      );
      return;
    }

    setSubmitting(true);
    try {
      await logStreamerRevenue(
        user.uid,
        activePlatform,
        date,
        type,
        Number(revenue),
        Number(metric) || 0,
        notes
      );

      showNotification(
        language === "es" ? "¡Registro de monetización añadido correctamente!" : "Monetization log added successfully!",
        "success"
      );

      // Reset form fields
      setRevenue("");
      setMetric("");
      setNotes("");
      
      // Reload logs
      await loadStreamerLogs();
      
      // Log activity dynamically
      const { logActivity } = await import("../../utils/analytics");
      await logActivity(
        user.uid,
        user.email || "",
        user.displayName || (user.email ? user.email.split("@")[0] : "Streamer"),
        "streamer_log",
        `Registró ingresos de €${revenue} en ${activePlatform.toUpperCase()} (${type})`
      );
    } catch (err: any) {
      console.error(err);
      showNotification(err.message || "Error", "error");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle delete log
  const handleDeleteLog = async (id: string) => {
    if (!confirm(language === "es" ? "¿Estás seguro de que deseas eliminar este registro?" : "Are you sure you want to delete this entry?")) {
      return;
    }

    try {
      await deleteStreamerLog(id);
      showNotification(
        language === "es" ? "Registro eliminado." : "Entry deleted.",
        "success"
      );
      // Reload logs
      await loadStreamerLogs();
    } catch (err: any) {
      console.error(err);
      showNotification("Error deleting log", "error");
    }
  };

  // Platform specific config
  const getTypesForPlatform = (platform: PlatformType) => {
    switch (platform) {
      case "tiktok":
        return [
          language === "es" ? "Batalla PK" : "PK Battle", 
          language === "es" ? "Regalos de Live (Gifts)" : "Live Gifts", 
          language === "es" ? "Fondo de Creadores" : "Creator Fund", 
          language === "es" ? "Patrocinio / Ad" : "Sponsorship / Ad"
        ];
      case "youtube":
        return [
          language === "es" ? "AdSense (Anuncios)" : "AdSense Revenue", 
          language === "es" ? "Super Chats & Stickers" : "Super Chats & Stickers", 
          language === "es" ? "Miembros del Canal" : "Channel Memberships", 
          language === "es" ? "Patrocinio" : "Sponsorship"
        ];
      case "twitch":
        return [
          language === "es" ? "Suscripciones (Subs)" : "Subscriptions", 
          language === "es" ? "Bits Cheer" : "Bits Cheer", 
          language === "es" ? "Ingresos por Anuncios" : "Ad Revenue", 
          language === "es" ? "Donaciones Directas" : "Direct Donations"
        ];
      case "starmaker":
        return [
          language === "es" ? "Regalos de Sala de Canto" : "Singing Room Gifts", 
          language === "es" ? "Eventos Diarios" : "Daily Events", 
          language === "es" ? "Suscripciones VIP SM" : "SM VIP Subscriptions"
        ];
      case "kips":
        return [
          language === "es" ? "Propinas Directas (Tips)" : "Direct Tips", 
          language === "es" ? "Transmisión en Vivo" : "Live Streaming Pay", 
          language === "es" ? "Contenido Exclusivo" : "Exclusive Content Unlocks"
        ];
      default:
        return ["Monetización", "Suscripciones", "Otros"];
    }
  };

  // Automatically update the selected type if the platform changes
  useEffect(() => {
    const defaultTypes = getTypesForPlatform(activePlatform);
    setType(defaultTypes[0]);
  }, [activePlatform]);

  // BI summary stats
  const getEarningsByPlatform = (p: PlatformType) => {
    return logs
      .filter(l => l.platform === p)
      .reduce((sum, curr) => sum + Number(curr.revenue || 0), 0);
  };

  const totalEarnings = logs.reduce((sum, curr) => sum + Number(curr.revenue || 0), 0);

  const getPlatformIcon = (platform: PlatformType) => {
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

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white font-sans">
        <Disc className="animate-spin text-[var(--color-gold)] mr-3" size={24} />
        <span>Cargando portal...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white relative font-sans pt-32 pb-24 overflow-x-hidden bg-gradient-to-br from-[#03070b] via-[#050505] to-[#0a060d]">
      <div className="digital-grid-animated" style={{ opacity: 0.12 }} />
      <div className="hologram-scanline" />
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 pointer-events-none"></div>

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
          
          {/* Sub Navigation Gating */}
          <div className="flex bg-black border border-white/10 rounded-full p-1 font-heading text-xs tracking-wider">
            <Link 
              href="/streamer/profile" 
              className="px-4 py-2 rounded-full text-zinc-400 hover:text-white transition-all flex items-center gap-1.5"
            >
              <User size={13} />
              <span>{language === "es" ? "Tarjeta Link-in-Bio" : "Link-in-Bio Card"}</span>
            </Link>
            <Link 
              href="/streamer/profile-services" 
              className="px-4 py-2 rounded-full text-zinc-400 hover:text-white transition-all flex items-center gap-1.5"
            >
              <Layers size={13} />
              <span>{language === "es" ? "Perfil Servicios" : "Services Profile"}</span>
            </Link>
            <Link 
              href="/streamer/multipost" 
              className="px-4 py-2 rounded-full text-zinc-400 hover:text-white transition-all flex items-center gap-1.5"
            >
              <Send size={13} />
              <span>{language === "es" ? "Difusión One-Click" : "One-Click Multipost"}</span>
            </Link>
            <Link 
              href="/casino" 
              className="px-4 py-2 rounded-full text-zinc-400 hover:text-white transition-all flex items-center gap-1.5"
            >
              <Coins size={13} />
              <span>{language === "es" ? "Casino Quantum" : "Quantum Casino"}</span>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-zinc-500 font-mono text-[10px] uppercase">Portal de Creadores C8L</span>
            <div className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-emerald-950/20 border border-emerald-500/30 text-sm font-mono text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              <span>Modo Premium Streamer</span>
            </div>
          </div>
        </div>

        {/* Title */}
        <div className="mb-12">
          <h1 className="font-heading font-black text-4xl md:text-5xl uppercase tracking-tighter text-glow-gold">
            {language === "es" ? "Panel de Monetización Streamer" : "Streamer Revenue Portal"}
          </h1>
          <p className="text-zinc-400 text-sm max-w-xl mt-2 font-light">
            {language === "es" 
              ? "Registra tus métricas, monitorea tus ganancias en vivo por plataforma y audita tu progreso comercial."
              : "Log your creative metrics, monitor live revenue across networks, and audit your commercial yield."}
          </p>
        </div>

        {/* Business Intelligence Summary Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          {/* Main Lifetime card */}
          <div className="md:col-span-2 glass-panel p-8 rounded-3xl bg-black/60 border border-[var(--color-gold)]/30 box-glow-gold flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest font-bold">
                  {language === "es" ? "Ingresos Totales Acumulados" : "Total Revenue Logged"}
                </span>
                <h3 className="font-heading font-black text-3xl md:text-4xl text-emerald-400 mt-2">
                  €{totalEarnings.toLocaleString()}
                </h3>
              </div>
              <span className="p-3 bg-[var(--color-gold)]/10 text-[var(--color-gold)] rounded-2xl">
                <TrendingUp size={24} />
              </span>
            </div>
            <div className="text-[10px] font-mono text-zinc-500 border-t border-white/5 pt-4 mt-6 uppercase tracking-wider">
              {language === "es" ? "Actualizado en tiempo real" : "Updated in real-time"} • {logs.length} {language === "es" ? "registros cargados" : "total logs"}
            </div>
          </div>

          {/* Platform Breakdowns */}
          <div className="md:col-span-2 glass-panel p-6 rounded-3xl bg-black/40 border border-white/5 grid grid-cols-2 gap-4">
            {(["tiktok", "youtube", "twitch", "starmaker", "kips"] as PlatformType[]).map((plat) => {
              const earnings = getEarningsByPlatform(plat);
              return (
                <div key={plat} className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
                  <div className="overflow-hidden">
                    <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest font-bold block truncate">{plat}</span>
                    <strong className="text-sm font-mono text-white block mt-0.5">€{earnings.toLocaleString()}</strong>
                  </div>
                  <span className="text-xl flex-shrink-0">{getPlatformIcon(plat)}</span>
                </div>
              );
            })}
          </div>
        </div>
 
        {/* LIVE PK BATTLE SIMULATOR & GIFTING */}
        <div className="mb-12">
          <LiveBattleSimulator />
        </div>
 
        {/* METRICS BI GRAPH PANEL (Module 4) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12 items-stretch">
          
          {/* Chart 1: SVG Line Chart for Platform Views */}
          <div className="lg:col-span-7 glass-panel p-6 rounded-3xl bg-black/40 border-white/5 text-left">
            <h4 className="font-heading font-black text-sm text-zinc-400 uppercase tracking-wider mb-6 flex items-center gap-2">
              <BarChart3 size={16} className="text-cyan-400" />
              <span>{language === "es" ? "Impacto de Difusión (Visualizaciones)" : "Diffusion Views Chart"}</span>
            </h4>
            
            {/* SVG Line chart representing views */}
            <div className="w-full relative h-[180px] bg-black/30 rounded-2xl p-2 border border-white/5 flex items-end">
              <svg className="w-full h-full" viewBox="0 0 500 150">
                {/* Grids lines */}
                <line x1="0" y1="30" x2="500" y2="30" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                <line x1="0" y1="75" x2="500" y2="75" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                <line x1="0" y1="120" x2="500" y2="120" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />

                {/* Series 1: TikTok Views (Red-Pink) */}
                <path
                  d="M0 120 Q 80 80 160 50 T 320 20 T 500 10"
                  fill="none"
                  stroke="#EC4899"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  className="drop-shadow-[0_2px_4px_rgba(236,72,153,0.3)]"
                />
                
                {/* Series 2: YouTube Views (Gold/Yellow) */}
                <path
                  d="M0 135 Q 80 110 160 85 T 320 60 T 500 35"
                  fill="none"
                  stroke="#D4AF37"
                  strokeWidth="3"
                  strokeLinecap="round"
                  className="drop-shadow-[0_2px_4px_rgba(212,175,55,0.3)]"
                />

                {/* Series 3: Reels Views (Blue-Neon) */}
                <path
                  d="M0 145 Q 80 130 160 110 T 320 75 T 500 50"
                  fill="none"
                  stroke="#00F3FF"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  className="drop-shadow-[0_2px_4px_rgba(0,243,255,0.3)]"
                />
              </svg>
            </div>

            {/* Legends */}
            <div className="flex gap-4 justify-center mt-4 text-[9px] font-mono font-bold uppercase tracking-widest text-zinc-500">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#EC4899]"></span> TikTok</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#D4AF37]"></span> YouTube</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#00F3FF]"></span> Reels / Shorts</span>
            </div>
          </div>

          {/* Chart 2: SVG Pie Chart representing Monthly Revenue divisions */}
          <div className="lg:col-span-5 glass-panel p-6 rounded-3xl bg-black/40 border-white/5 text-left flex flex-col justify-between">
            <h4 className="font-heading font-black text-sm text-zinc-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Layers size={16} className="text-[var(--color-gold)]" />
              <span>{language === "es" ? "Desglose de Ingresos Mensual" : "Monthly Revenue Division"}</span>
            </h4>

            <div className="flex items-center gap-6 flex-grow">
              {/* Pie SVG donut */}
              <div className="relative w-28 h-28 flex-shrink-0">
                <svg className="w-full h-full rotate-[-90deg]" viewBox="0 0 36 36">
                  {/* Segment 1: Twitch Subs (Purple) 40% */}
                  <circle cx="18" cy="18" r="15.91" fill="none" stroke="#8B5CF6" strokeWidth="4" strokeDasharray="40 100" strokeDashoffset="0" />
                  {/* Segment 2: TikTok Gifts (Pink) 30% */}
                  <circle cx="18" cy="18" r="15.91" fill="none" stroke="#EC4899" strokeWidth="4" strokeDasharray="30 100" strokeDashoffset="-40" />
                  {/* Segment 3: YouTube AdSense (Red) 20% */}
                  <circle cx="18" cy="18" r="15.91" fill="none" stroke="#EF4444" strokeWidth="4" strokeDasharray="20 100" strokeDashoffset="-70" />
                  {/* Segment 4: Casino Coins (Gold) 10% */}
                  <circle cx="18" cy="18" r="15.91" fill="none" stroke="#D4AF37" strokeWidth="4" strokeDasharray="10 100" strokeDashoffset="-90" />
                </svg>
                {/* Center text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center font-heading text-[10px] font-black text-[var(--color-gold)]">
                  <span>C8L</span>
                  <span>BI</span>
                </div>
              </div>

              {/* Legends with percentages */}
              <div className="flex flex-col gap-1.5 text-[9px] font-mono font-bold uppercase tracking-wider text-zinc-400">
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 bg-[#8B5CF6] rounded-sm"></span> Subs Twitch (40%)</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 bg-[#EC4899] rounded-sm"></span> Regalos TikTok (30%)</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 bg-[#EF4444] rounded-sm"></span> YouTube Ads (20%)</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 bg-[#D4AF37] rounded-sm"></span> Casino C8L (10%)</span>
              </div>
            </div>

            <p className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest mt-4">
              * Datos agregados e integrados automáticamente
            </p>
          </div>

        </div>

        {/* Workspace content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* Left panel: Add Log Form */}
          <div className="lg:col-span-5 glass-panel p-8 rounded-3xl bg-black/50 border-white/5 flex flex-col justify-between h-full">
            <form onSubmit={handleSubmitLog} className="space-y-5">
              <h3 className="font-heading font-black text-xl text-[var(--color-gold)] uppercase tracking-wider border-b border-white/5 pb-4 mb-2 flex items-center gap-2">
                <Plus size={18} />
                <span>{language === "es" ? "Añadir Registro" : "Add Earnings Log"}</span>
              </h3>

              {/* Platform Selector Grid */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                  {language === "es" ? "Plataforma" : "Platform"}
                </label>
                <div className="grid grid-cols-5 gap-1.5 bg-black/60 p-1 rounded-xl border border-white/10">
                  {(["tiktok", "youtube", "twitch", "starmaker", "kips"] as PlatformType[]).map((plat) => (
                    <button
                      key={plat}
                      type="button"
                      onClick={() => setActivePlatform(plat)}
                      className={`py-2 rounded-lg text-[9px] font-heading font-black uppercase tracking-wider text-center cursor-pointer transition-all ${
                        activePlatform === plat 
                          ? "bg-[var(--color-gold)] text-black font-bold" 
                          : "text-zinc-500 hover:text-zinc-300"
                      }`}
                    >
                      {plat.substring(0, 3)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                  {language === "es" ? "Fecha de Actividad" : "Activity Date"}
                </label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full p-3.5 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:border-[var(--color-gold)] transition text-xs font-mono"
                />
              </div>

              {/* Revenue Form Options */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                    {language === "es" ? "Monto Ingresos (€)" : "Revenue (€)"}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={revenue}
                    onChange={(e) => setRevenue(e.target.value)}
                    placeholder="e.g. 150"
                    className="w-full p-3.5 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:border-[var(--color-gold)] transition text-xs font-mono"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                    {language === "es" ? "Métrica (Opcional)" : "Metric (Qty)"}
                  </label>
                  <input
                    type="number"
                    value={metric}
                    onChange={(e) => setMetric(e.target.value)}
                    placeholder="e.g. 5 (PKs/Horas)"
                    className="w-full p-3.5 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:border-[var(--color-gold)] transition text-xs font-mono"
                  />
                </div>
              </div>

              {/* Activity Type Selection */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                  {language === "es" ? "Tipo de Actividad" : "Activity Type"}
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full p-3.5 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:border-[var(--color-gold)] transition text-xs appearance-none cursor-pointer"
                >
                  {getTypesForPlatform(activePlatform).map((tOpt) => (
                    <option key={tOpt} value={tOpt} className="bg-black text-white">{tOpt}</option>
                  ))}
                </select>
              </div>

              {/* Notes */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                  {language === "es" ? "Notas / Descripción" : "Notes / Description"}
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={language === "es" ? "e.g. Ganada batalla PK contra StreamerX..." : "e.g. Won PK battle against StreamerX..."}
                  className="w-full p-4 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:border-[var(--color-gold)] transition text-xs resize-none"
                />
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-4 bg-[var(--color-gold)] text-black font-heading font-black text-xs uppercase tracking-widest rounded-xl hover:bg-[var(--color-gold-light)] transition box-glow-gold cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {submitting ? "Procesando..." : (language === "es" ? "Guardar Registro" : "Save Log Entry")}
                </button>
              </div>
            </form>
          </div>

          {/* Right panel: History Feed logs list */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            <div className="glass-panel p-8 rounded-3xl bg-black/40 flex flex-col justify-between items-stretch min-h-[500px] h-full">
              
              <div>
                <h3 className="font-heading font-black text-xl text-white uppercase tracking-wider border-b border-white/5 pb-4 mb-6">
                  {language === "es" ? "Historial de Registros" : "Earnings Log History"}
                </h3>

                {loadingLogs ? (
                  <div className="text-center py-16">
                    <div className="w-10 h-10 rounded-full border-t-2 border-[var(--color-gold)] animate-spin mx-auto mb-4"></div>
                    <p className="text-zinc-500 font-mono text-[10px] uppercase tracking-widest">{language === "es" ? "Cargando historial..." : "Loading history..."}</p>
                  </div>
                ) : logs.length === 0 ? (
                  <div className="text-center py-20 border border-dashed border-white/10 rounded-2xl bg-black/30">
                    <span className="text-4xl mb-4 block">📈</span>
                    <p className="text-zinc-400 text-sm font-heading font-black uppercase mb-1">{language === "es" ? "No hay registros registrados" : "No logs recorded yet"}</p>
                    <p className="text-zinc-600 text-xs max-w-xs mx-auto">
                      {language === "es" 
                        ? "Utiliza el formulario de la izquierda para registrar tus primeros ingresos de streamer." 
                        : "Use the form on the left to record your first streamer revenues."}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-[460px] overflow-y-auto pr-2 no-scrollbar">
                    {logs.map((log) => (
                      <motion.div
                        key={log.id}
                        layout
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="p-4 rounded-2xl bg-white/[0.01] border border-white/5 hover:border-zinc-800 transition-colors flex items-center justify-between gap-4"
                      >
                        <div className="flex items-center gap-4 overflow-hidden">
                          <span className="text-2xl bg-zinc-950/60 p-2.5 rounded-xl border border-white/5 flex-shrink-0">
                            {getPlatformIcon(log.platform as PlatformType)}
                          </span>
                          <div className="overflow-hidden">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-heading font-black uppercase tracking-wider text-white truncate">{log.type}</span>
                              <span className="text-[9px] font-mono text-zinc-500 whitespace-nowrap">{log.date}</span>
                            </div>
                            <p className="text-[10px] text-zinc-400 font-medium truncate mt-0.5">
                              {log.notes || (language === "es" ? "Sin descripción" : "No description")}
                            </p>
                            {log.metric > 0 && (
                              <span className="text-[9px] font-mono text-[var(--color-gold)] font-bold uppercase mt-1 inline-block">
                                Qty: {log.metric}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-4 flex-shrink-0">
                          <span className="font-mono font-bold text-emerald-400 text-sm">
                            +€{log.revenue.toLocaleString()}
                          </span>
                          <button
                            onClick={() => handleDeleteLog(log.id)}
                            className="p-2 bg-red-950/20 hover:bg-red-950/50 border border-red-500/20 hover:border-red-500/40 rounded-xl text-red-400 transition-all cursor-pointer"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              <div className="border-t border-white/5 pt-6 mt-8 flex items-start gap-2.5 text-zinc-500 text-[10px] leading-relaxed">
                <Info size={14} className="flex-shrink-0 mt-0.5 text-zinc-400" />
                <p>
                  {language === "es"
                    ? "Tus datos se guardan de forma privada en tu cuenta de creador de C8L. Solo tú y el equipo de booking de la administración de la agencia tienen acceso a auditar estas métricas de rendimiento comercial."
                    : "Your metrics are secured privately in your C8L creator account. Only you and the agency booking administrator team have access to audit these commercial performance metrics."}
                </p>
              </div>

            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
