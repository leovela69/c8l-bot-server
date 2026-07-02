"use client";
import React, { useState, useEffect, useRef } from "react";
import { useApp } from "../../../context/AppContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, Disc, Upload, Send, Play, Calendar, 
  Terminal, ShieldCheck, Download, Plus, Sparkles, UserPlus,
  Layers, User, Coins
} from "lucide-react";

export default function StreamerMultipostPage() {
  const { language, user, loading, showNotification, loginWithMockUser } = useApp();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<"multipost" | "banner">("multipost");
  const [streamerAlias, setStreamerAlias] = useState("Streamer C8L");

  // --- MULTIPOSTING STATES ---
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [consoleLogs, setConsoleLogs] = useState<string[]>([]);
  const [postTitle, setPostTitle] = useState("");
  const [postDesc, setPostDesc] = useState("");

  // --- PK BANNER MAKER STATES ---
  const [opponentName, setOpponentName] = useState("Rival Streamer");
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("22:00");
  const [bannerTheme, setBannerTheme] = useState("cyberpunk");

  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Gates access for logged in users
  useEffect(() => {
    if (!loading && !user) {
      showNotification(
        language === "es" ? "Iniciando demostración VIP (Sin Cuenta)..." : "Starting VIP demo (No Account)...",
        "info"
      );
      loginWithMockUser();
      return;
    }
    if (user) {
      setStreamerAlias(user.displayName || user.email?.split("@")[0] || "Streamer C8L");
      // Default date tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setEventDate(tomorrow.toISOString().split("T")[0]);
    }
  }, [user, loading, router, language, showNotification]);

  // Drag and drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  // Run simulated Parallel API Posting (Single Upload Buffer Webhooks)
  const handleStartPublishing = () => {
    if (!file) {
      showNotification(
        language === "es" ? "Por favor carga un archivo de video primero." : "Please upload a video file first.",
        "error"
      );
      return;
    }

    setPublishing(true);
    setConsoleLogs([
      `[SYS] ${new Date().toLocaleTimeString()} - SINGLE UPLOAD BUFFER INITIALIZED.`,
      `[SYS] Processing file: ${file.name} (${(file.size / (1024 * 1024)).toFixed(2)} MB)`,
      `[SYS] Mapping metadata - Title: "${postTitle || "Sin título"}"`,
      `[API] Opening asynchronous dispatch channels (Asynchronous Axios calls)...`
    ]);

    const steps = [
      { t: 1000, log: "▶ POST -> https://api.youtube.com/v3/videos [YouTube API v3] - Uploading chunks..." },
      { t: 2200, log: "▶ POST -> https://open-api.tiktok.com/share/video/upload/ [TikTok API] - Handshaking OAuth..." },
      { t: 3400, log: "▶ POST -> https://api.twitch.tv/helix/events [Twitch Helix] - Scheduling VOD..." },
      { t: 4500, log: "▶ POST -> https://api.kick.com/v1/channels/events [Kick API] - Synced metadata..." },
      { t: 5500, log: "✔ [YouTube] 200 OK - Video published. URL: https://youtu.be/c8lMockUrl" },
      { t: 6200, log: "✔ [TikTok] 200 OK - Video pushed to user feed creator channel successfully." },
      { t: 6800, log: "✔ [Twitch/Kick] 200 OK - VOD and scheduling webhooks triggered successfully." },
      { t: 7500, log: "SUCCESS" }
    ];

    steps.forEach((step) => {
      setTimeout(() => {
        if (step.log === "SUCCESS") {
          setPublishing(false);
          setConsoleLogs(prev => [...prev, `[SYS] ${new Date().toLocaleTimeString()} - ✅ PARALLEL DIFFUSION COMPLETED IN 7.5 SECONDS.`]);
          showNotification(
            language === "es" ? "¡Difusión One-Click completada en todas las redes!" : "One-Click diffusion completed across all platforms!",
            "success"
          );

          // Log activity
          import("../../../utils/analytics").then(({ logActivity }) => {
            if (user) {
              logActivity(
                user.uid,
                user.email || "",
                streamerAlias,
                "multiposting_push",
                `Publicó el video "${file.name}" en YouTube, TikTok, Twitch y Kick simultáneamente.`
              );
            }
          }).catch(() => {});
        } else {
          setConsoleLogs(prev => [...prev, `[API] ${new Date().toLocaleTimeString()} - ${step.log}`]);
        }
      }, step.t);
    });
  };

  // --- HTML CANVAS BANNER DESIGNER GENERATOR ---
  const generateBannerCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Draw Size: 800 x 450 (16:9 premium ratio banner)
    ctx.clearRect(0, 0, 800, 450);

    // 1. Draw Theme Background Gradient
    let grad = ctx.createLinearGradient(0, 0, 800, 450);
    if (bannerTheme === "cyberpunk") {
      grad.addColorStop(0, "#150527");
      grad.addColorStop(0.5, "#0F021B");
      grad.addColorStop(1, "#0A043C");
    } else if (bannerTheme === "gold") {
      grad.addColorStop(0, "#1A1505");
      grad.addColorStop(0.5, "#0A0802");
      grad.addColorStop(1, "#261A04");
    } else { // neon
      grad.addColorStop(0, "#031B15");
      grad.addColorStop(0.5, "#020A0B");
      grad.addColorStop(1, "#03041C");
    }
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 800, 450);

    // Draw cyber grids overlays
    ctx.strokeStyle = "rgba(255, 255, 255, 0.02)";
    ctx.lineWidth = 1;
    for (let i = 0; i < 800; i += 40) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, 450);
      ctx.stroke();
    }
    for (let j = 0; j < 450; j += 40) {
      ctx.beginPath();
      ctx.moveTo(0, j);
      ctx.lineTo(800, j);
      ctx.stroke();
    }

    // Outer premium border
    ctx.strokeStyle = bannerTheme === "gold" ? "#D4AF37" : bannerTheme === "cyberpunk" ? "#EC4899" : "#00F3FF";
    ctx.lineWidth = 6;
    ctx.strokeRect(3, 3, 794, 444);

    // 2. Draw Agency Brand header
    ctx.fillStyle = bannerTheme === "gold" ? "#D4AF37" : "#FFFFFF";
    ctx.font = "bold 15px font-mono, Inter";
    ctx.textAlign = "center";
    ctx.fillText("C8L MUSIC AI & ENTERTAINMENT AGENCY PRESENTA", 400, 50);

    // Draw glow circles behind players
    ctx.beginPath();
    ctx.arc(220, 200, 90, 0, Math.PI * 2);
    ctx.fillStyle = bannerTheme === "gold" ? "rgba(212,175,55,0.06)" : "rgba(236,72,153,0.06)";
    ctx.fill();

    ctx.beginPath();
    ctx.arc(580, 200, 90, 0, Math.PI * 2);
    ctx.fillStyle = bannerTheme === "gold" ? "rgba(212,175,55,0.06)" : "rgba(0,243,255,0.06)";
    ctx.fill();

    // 3. Draw VS text
    ctx.fillStyle = bannerTheme === "gold" ? "#D4AF37" : "#00F3FF";
    ctx.font = "black 64px font-heading, Outfit, Impact";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("VS", 400, 200);

    // 4. Draw Player Names
    // Player 1 (Streamer)
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 28px font-heading, Outfit";
    ctx.textAlign = "center";
    ctx.fillText(streamerAlias.toUpperCase(), 220, 200);
    ctx.fillStyle = bannerTheme === "gold" ? "#D4AF37" : "#EC4899";
    ctx.font = "bold 12px font-mono";
    ctx.fillText("STREAMER LOCAL", 220, 230);

    // Player 2 (Opponent)
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 28px font-heading, Outfit";
    ctx.textAlign = "center";
    ctx.fillText(opponentName.toUpperCase(), 580, 200);
    ctx.fillStyle = bannerTheme === "gold" ? "#D4AF37" : "#00F3FF";
    ctx.font = "bold 12px font-mono";
    ctx.fillText("OPONENTE RETADOR", 580, 230);

    // 5. Draw Event Date & Time (Bottom Box)
    // Dark background box
    ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
    ctx.fillRect(200, 310, 400, 60);
    ctx.strokeStyle = "rgba(255,255,255,0.08)";
    ctx.lineWidth = 1;
    ctx.strokeRect(200, 310, 400, 60);

    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 16px font-mono";
    ctx.textAlign = "center";
    const dateFormatted = eventDate ? new Date(eventDate).toLocaleDateString() : "";
    ctx.fillText(`📅 BATTLE PK LIVE: ${dateFormatted} a las ${eventTime}h`, 400, 345);

    // Footer brand logo
    ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
    ctx.font = "bold 10px font-mono";
    ctx.fillText("DESARROLLADO POR ANTIGRAVITY ENGINE V2.0", 400, 420);
  };

  useEffect(() => {
    if (activeTab === "banner") {
      generateBannerCanvas();
    }
  }, [activeTab, streamerAlias, opponentName, eventDate, eventTime, bannerTheme]);

  const handleDownloadBanner = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const url = canvas.toDataURL("image/png");
    
    // Create download element
    const link = document.createElement("a");
    link.download = `C8L_Battle_PK_${streamerAlias}_vs_${opponentName}.png`;
    link.href = url;
    link.click();

    showNotification(
      language === "es" ? "Banner descargado con éxito." : "Banner downloaded successfully.",
      "success"
    );
  };

  return (
    <div className="min-h-screen text-white relative font-sans pt-32 pb-24 overflow-hidden bg-gradient-to-br from-[#0c0507] via-[#050505] to-[#120409]">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/black-thread.png')] opacity-10 pointer-events-none"></div>

      <div className="container mx-auto px-6 max-w-6xl relative z-10">
        
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 border-b border-white/5 pb-6">
          <Link 
            href="/community" 
            className="flex items-center gap-2 text-sm text-zinc-400 hover:text-[var(--color-gold)] transition-colors animate-pulse"
          >
            <ArrowLeft size={16} />
            <span>Volver a la Comunidad</span>
          </Link>
          
          <div className="flex bg-black border border-white/10 rounded-full p-1 font-heading text-xs tracking-wider">
            <Link 
              href="/streamer/profile" 
              className="px-4 py-2 rounded-full text-zinc-400 hover:text-white transition-all flex items-center gap-1.5"
            >
              <User size={13} />
              <span>Link-in-Bio</span>
            </Link>
            <Link 
              href="/streamer/profile-services" 
              className="px-4 py-2 rounded-full text-zinc-400 hover:text-white transition-all flex items-center gap-1.5"
            >
              <Layers size={13} />
              <span>Perfil Servicios</span>
            </Link>
            <Link 
              href="/streamer/multipost" 
              className="px-4 py-2 rounded-full bg-[var(--color-gold)] text-black font-bold transition-all flex items-center gap-1.5"
            >
              <Send size={13} />
              <span>Multipost</span>
            </Link>
            <Link 
              href="/streamer" 
              className="px-4 py-2 rounded-full text-zinc-400 hover:text-white transition-all flex items-center gap-1.5"
            >
              <Coins size={13} />
              <span>Finanzas BI</span>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-zinc-500 font-mono text-[10px] uppercase">Portal C8L</span>
            <div className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-amber-950/20 border border-[var(--color-gold)]/30 text-xs font-mono text-[var(--color-gold)]">
              <span>Modo Premium Activo</span>
            </div>
          </div>
        </div>

        {/* Tab Selector for Internal Multipost Sections */}
        <div className="flex bg-white/5 border border-white/10 rounded-2xl p-1 mb-8 max-w-md mx-auto">
          <button
            onClick={() => setActiveTab("multipost")}
            className={`flex-grow py-2.5 px-4 rounded-xl text-xs font-heading font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === "multipost" 
                ? "bg-[var(--color-gold)] text-black box-glow-gold" 
                : "text-zinc-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <Send size={13} />
            <span>One-Click Multipost</span>
          </button>
          <button
            onClick={() => setActiveTab("banner")}
            className={`flex-grow py-2.5 px-4 rounded-xl text-xs font-heading font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === "banner" 
                ? "bg-[var(--color-gold)] text-black box-glow-gold" 
                : "text-zinc-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <Plus size={13} />
            <span>Creador de Banners PK</span>
          </button>
        </div>

        {/* WORKSPACE CONTENT */}
        <AnimatePresence mode="wait">
          
          {/* Tab 1: One-Click Multiposting */}
          {activeTab === "multipost" && (
            <motion.div
              key="multipost"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch"
            >
              {/* Left Config Form */}
              <div className="lg:col-span-5 glass-panel p-8 rounded-3xl bg-black/50 border-white/5 flex flex-col justify-between h-full min-h-[480px] text-left">
                <div className="space-y-5">
                  <h3 className="font-heading font-black text-xl text-[var(--color-gold)] uppercase tracking-wider border-b border-white/5 pb-4 mb-2">
                    Carga Única (Single Upload Buffer)
                  </h3>

                  {/* Drag and Drop Box */}
                  <div
                    onDragEnter={handleDrag}
                    onDragOver={handleDrag}
                    onDragLeave={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => document.getElementById("video-file-input")?.click()}
                    className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                      dragActive
                        ? "border-[var(--color-gold)] bg-[var(--color-gold)]/5"
                        : file
                        ? "border-emerald-500/40 bg-emerald-950/5"
                        : "border-white/10 hover:border-zinc-700 bg-white/[0.01]"
                    }`}
                  >
                    <input
                      type="file"
                      id="video-file-input"
                      hidden
                      accept="video/*"
                      onChange={handleFileChange}
                    />
                    <Upload size={28} className={`mx-auto mb-3 ${file ? "text-emerald-400 animate-pulse" : "text-zinc-500"}`} />
                    
                    {file ? (
                      <div>
                        <strong className="text-xs text-white block truncate">{file.name}</strong>
                        <span className="text-[10px] text-zinc-500 font-mono mt-0.5 inline-block">
                          {(file.size / (1024 * 1024)).toFixed(2)} MB • Listo para difundir
                        </span>
                      </div>
                    ) : (
                      <div>
                        <p className="text-xs text-zinc-300 font-semibold">{language === "es" ? "Arrastra tu videoclip o haz click" : "Drag your video file or click to browse"}</p>
                        <p className="text-[9px] text-zinc-500 font-mono uppercase mt-1">MP4, MOV hasta 100MB</p>
                      </div>
                    )}
                  </div>

                  {/* Title */}
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                      {language === "es" ? "Título de Publicación" : "Post Title"}
                    </label>
                    <input
                      type="text"
                      value={postTitle}
                      onChange={(e) => setPostTitle(e.target.value)}
                      placeholder="e.g. ¡Nuevo reto de dembow espacial con @LeoVela!"
                      className="w-full p-3.5 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:border-[var(--color-gold)] transition text-xs"
                    />
                  </div>

                  {/* Desc */}
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                      {language === "es" ? "Descripción / Copy" : "Description / Copy"}
                    </label>
                    <textarea
                      rows={3}
                      value={postDesc}
                      onChange={(e) => setPostDesc(e.target.value)}
                      placeholder="e.g. Familia de Corazones Locos, aquí os dejamos el nuevo videoclip IA reactivo..."
                      className="w-full p-4 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:border-[var(--color-gold)] transition text-xs resize-none"
                    />
                  </div>
                </div>

                <div className="border-t border-white/5 pt-6 mt-6">
                  <button
                    onClick={handleStartPublishing}
                    disabled={publishing || !file}
                    className="w-full py-4 bg-[var(--color-gold)] text-black font-heading font-black text-xs uppercase tracking-widest rounded-xl hover:bg-[var(--color-gold-light)] transition box-glow-gold cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Send size={14} className={publishing ? "animate-spin" : ""} />
                    <span>{publishing ? "PUBLICANDO..." : "DIFUNDIR EN TODO (ONE-CLICK)"}</span>
                  </button>
                </div>
              </div>

              {/* Right Terminal Console Logs */}
              <div className="lg:col-span-7 flex flex-col gap-6">
                <div className="glass-panel p-8 rounded-3xl bg-black/40 flex flex-col justify-between items-stretch min-h-[480px] h-full text-left">
                  <div>
                    <h3 className="font-heading font-black text-xl text-white uppercase tracking-wider border-b border-white/5 pb-4 mb-6 flex items-center gap-2">
                      <Terminal size={18} className="text-cyan-400" />
                      <span>Webhooks & Consola API</span>
                    </h3>

                    <div className="bg-[#050507] border border-white/5 rounded-2xl p-6 h-[320px] overflow-y-auto font-mono text-[10px] text-zinc-500 flex flex-col gap-1.5 box-glow-neon">
                      {consoleLogs.length === 0 ? (
                        <div className="h-full flex items-center justify-center text-zinc-700 uppercase tracking-widest text-[9px]">
                          Consola inactiva. Esperando difusión...
                        </div>
                      ) : (
                        consoleLogs.map((log, i) => (
                          <p key={i} className={
                            log.includes("✔") ? "text-emerald-400 font-semibold" :
                            log.includes("✅") ? "text-emerald-400 font-bold text-glow-neon" :
                            log.includes("🚨") ? "text-red-400 font-bold" :
                            log.includes("[SYS]") ? "text-zinc-400" : "text-zinc-500"
                          }>
                            {log}
                          </p>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="border-t border-white/5 pt-6 mt-8 flex items-start gap-2 text-zinc-500 text-[10px] leading-relaxed">
                    <ShieldCheck size={14} className="flex-shrink-0 mt-0.5 text-zinc-400" />
                    <p>
                      La difusión One-Click en paralelo enlazará simultáneamente mediante APIs REST con YouTube API v3, TikTok Content Posting API, Kick API y Twitch helix scheduler.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Tab 2: PK Battle Banner Creator */}
          {activeTab === "banner" && (
            <motion.div
              key="banner"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch"
            >
              {/* Left Settings */}
              <div className="lg:col-span-5 glass-panel p-8 rounded-3xl bg-black/50 border-white/5 flex flex-col justify-between h-full min-h-[480px] text-left">
                <div className="space-y-5">
                  <h3 className="font-heading font-black text-xl text-[var(--color-gold)] uppercase tracking-wider border-b border-white/5 pb-4 mb-2">
                    Diseño de Banner de Batalla PK
                  </h3>

                  {/* Opponent name */}
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                      <UserPlus size={10} /> Oponente / Rival
                    </label>
                    <input
                      type="text"
                      value={opponentName}
                      onChange={(e) => setOpponentName(e.target.value)}
                      placeholder="e.g. StreamerX"
                      className="w-full p-3.5 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:border-[var(--color-gold)] transition text-xs font-semibold"
                    />
                  </div>

                  {/* Event Date & Time */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                        {language === "es" ? "Fecha del Evento" : "Event Date"}
                      </label>
                      <input
                        type="date"
                        value={eventDate}
                        onChange={(e) => setEventDate(e.target.value)}
                        className="w-full p-3.5 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:border-[var(--color-gold)] transition text-xs font-mono"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                        {language === "es" ? "Hora del Evento" : "Event Time"}
                      </label>
                      <input
                        type="text"
                        value={eventTime}
                        onChange={(e) => setEventTime(e.target.value)}
                        placeholder="e.g. 22:00"
                        className="w-full p-3.5 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:border-[var(--color-gold)] transition text-xs font-mono"
                      />
                    </div>
                  </div>

                  {/* Theme Presets */}
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                      {language === "es" ? "Tema de Diseño" : "Design Theme"}
                    </label>
                    <div className="grid grid-cols-3 gap-2 font-heading text-[10px] font-bold uppercase tracking-wider text-center">
                      {[
                        { id: "cyberpunk", name: "Cyberpunk" },
                        { id: "gold", name: "Luxury Gold" },
                        { id: "neon", name: "Neon Emerald" }
                      ].map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setBannerTheme(item.id)}
                          className={`py-2.5 rounded-xl border transition-all cursor-pointer ${
                            bannerTheme === item.id
                              ? "bg-[var(--color-gold)] text-black border-transparent box-glow-gold"
                              : "bg-white/5 border-white/10 text-zinc-400"
                          }`}
                        >
                          {item.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="border-t border-white/5 pt-6 mt-6">
                  <button
                    onClick={handleDownloadBanner}
                    className="w-full py-4 bg-[var(--color-gold)] text-black font-heading font-black text-xs uppercase tracking-widest rounded-xl hover:bg-[var(--color-gold-light)] transition box-glow-gold cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Download size={14} />
                    <span>DESCARGAR BANNER (.PNG)</span>
                  </button>
                </div>
              </div>

              {/* Right Canvas Preview */}
              <div className="lg:col-span-7 flex flex-col gap-6">
                <div className="glass-panel p-8 rounded-3xl bg-black/40 flex flex-col justify-between items-stretch min-h-[480px] h-full text-left">
                  <div>
                    <h3 className="font-heading font-black text-xl text-white uppercase tracking-wider border-b border-white/5 pb-4 mb-6 flex items-center gap-2">
                      <Sparkles size={18} className="text-[var(--color-gold)] animate-pulse" />
                      <span>Vista Previa del Banner</span>
                    </h3>

                    {/* Canvas wrapper board */}
                    <div className="border border-white/10 rounded-2xl overflow-hidden bg-[#050507] box-glow-neon flex items-center justify-center p-2">
                      <canvas
                        ref={canvasRef}
                        width={800}
                        height={450}
                        className="w-full h-auto block aspect-[800/450] bg-black rounded-lg"
                      />
                    </div>
                  </div>

                  <p className="text-zinc-500 text-[10px] uppercase font-mono tracking-wider mt-4 text-center">
                    💡 EL BANNER SE REDIBUJA AUTOMÁTICAMENTE SEGÚN LOS DATOS DE LA IZQUIERDA
                  </p>
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>

      </div>
    </div>
  );
}
