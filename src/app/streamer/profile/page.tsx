"use client";
import React, { useState, useEffect } from "react";
import { useApp } from "../../../context/AppContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { 
  ArrowLeft, Disc, Save, Globe, 
  Link as LinkIcon, Layers, Send, User, Wallet, Sparkles, ExternalLink
} from "lucide-react";
import LionMascot from "../../../components/ui/LionMascot";
import { registerOrUpdateUser } from "../../../utils/analytics";

const YoutubeIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-youtube">
    <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />
    <polygon points="10 15 15 12 10 9" />
  </svg>
);

const TwitchIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-twitch">
    <path d="M21 2H3v16h5v4l4-4h5l4-4V2zm-10 9H9V6h2v5zm4 0h-2V6h2v5z" />
  </svg>
);

export default function StreamerProfilePage() {
  const { 
    language, user, loading, showNotification,
    c8lCoins, c8lDiamonds, loginWithMockUser, bizcoinBalance
  } = useApp();
  const router = useRouter();
 
  // Profile configuration states
  const [alias, setAlias] = useState("");
  const [platform, setPlatform] = useState("Twitch");
  const [bannerPreset, setBannerPreset] = useState("cyberpunk");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [tiktokUrl, setTiktokUrl] = useState("");
  const [twitchUrl, setTwitchUrl] = useState("");
  const [kickUrl, setKickUrl] = useState("");
 
  const [saving, setSaving] = useState(false);
  const [mascotState, setMascotState] = useState<"idle" | "dance" | "win" | "sad" | "celebrate">("idle");
  const [connectionCount, setConnectionCount] = useState(1);
  const [subscription, setSubscription] = useState("free");

  // Load current user profile details
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
      const uid = user.uid;
      const getStorageKey = (key: string) => `c8l_${uid}_${key}`;

      const storedAlias = localStorage.getItem(getStorageKey("alias"));
      if (storedAlias !== null) {
        setAlias(storedAlias);
      } else {
        setAlias(user.displayName || user.email?.split("@")[0] || "Leo Vela");
      }

      const storedBanner = localStorage.getItem(getStorageKey("bannerPreset"));
      if (storedBanner !== null) {
        setBannerPreset(storedBanner);
      } else {
        setBannerPreset("cyberpunk");
      }

      const count = localStorage.getItem(getStorageKey("connection_count")) || localStorage.getItem("c8l_connection_count");
      if (count) setConnectionCount(parseInt(count, 10));
      const sub = localStorage.getItem(getStorageKey("subscription")) || localStorage.getItem("c8l_subscription");
      if (sub) setSubscription(sub);

      // Social URLs
      setYoutubeUrl(localStorage.getItem(getStorageKey("url_youtube")) || (uid === "leo_vela39_uid" ? "https://youtube.com/@CorazoneLocos" : ""));
      setTiktokUrl(localStorage.getItem(getStorageKey("url_tiktok")) || (uid === "leo_vela39_uid" ? "https://tiktok.com/@leo_vela39" : ""));
      setTwitchUrl(localStorage.getItem(getStorageKey("url_twitch")) || "");
      setKickUrl(localStorage.getItem(getStorageKey("url_kick")) || "");
    }
  }, [user, loading, language, showNotification]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    setMascotState("sad");

    try {
      const uid = user.uid;
      const getStorageKey = (key: string) => `c8l_${uid}_${key}`;

      // Save details to database
      await registerOrUpdateUser(user.uid, user.email || "", alias, platform, subscription as any);
      
      // Save profile details to local storage
      localStorage.setItem(getStorageKey("alias"), alias);
      localStorage.setItem(getStorageKey("bannerPreset"), bannerPreset);
      localStorage.setItem(getStorageKey("connection_count"), String(connectionCount));
      localStorage.setItem(getStorageKey("subscription"), subscription);

      // Save social links in local storage
      localStorage.setItem(getStorageKey("url_youtube"), youtubeUrl);
      localStorage.setItem(getStorageKey("url_tiktok"), tiktokUrl);
      localStorage.setItem(getStorageKey("url_twitch"), twitchUrl);
      localStorage.setItem(getStorageKey("url_kick"), kickUrl);

      setMascotState("win");
      showNotification(
        language === "es" ? "¡Perfil de Streamer guardado correctamente!" : "Streamer profile saved successfully!",
        "success"
      );

      // Log activity
      const { logActivity } = await import("../../../utils/analytics");
      await logActivity(
        user.uid,
        user.email || "",
        alias,
        "profile_update",
        `Actualizó su tarjeta de identidad y enlaces de Link-in-Bio.`
      );
    } catch (err: any) {
      console.error(err);
      showNotification(err.message || "Error saving profile", "error");
    } finally {
      setSaving(false);
      setTimeout(() => setMascotState("idle"), 3000);
    }
  };

  const getRankName = () => {
    if (subscription === "agency") return language === "es" ? "Streamer VIP Agencia" : "Agency VIP Streamer";
    if (subscription === "premium") return language === "es" ? "Streamer Platino" : "Platinum Streamer";
    if (subscription === "basic") return language === "es" ? "Streamer Oro" : "Gold Streamer";
    return language === "es" ? "Streamer Bronce" : "Bronze Streamer";
  };

  const getRankBadgeColor = () => {
    if (subscription === "agency") return "bg-amber-500/10 text-amber-400 border-amber-500/30";
    if (subscription === "premium") return "bg-cyan-500/10 text-cyan-400 border-cyan-500/30";
    if (subscription === "basic") return "bg-purple-500/10 text-purple-400 border-purple-500/30";
    return "bg-zinc-800 text-zinc-400 border-zinc-700/30";
  };

  const getBannerClass = () => {
    switch (bannerPreset) {
      case "cyberpunk":
        return "bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600";
      case "gold":
        return "bg-gradient-to-r from-[#FFF3D4] via-[#D4AF37] to-[#806010]";
      case "neon":
        return "bg-gradient-to-r from-emerald-500 via-cyan-500 to-indigo-500";
      default:
        return "bg-zinc-900";
    }
  };

  const getPanelStyleClass = () => {
    switch (bannerPreset) {
      case "gold":
        return "c8l-cyber-panel-gold";
      case "neon":
        return "c8l-cyber-panel";
      default:
        return "c8l-cyber-panel-red";
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white font-mono">
        <Disc className="animate-spin text-[var(--color-gold)] mr-3" size={24} />
        <span>Cargando configurador...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white relative font-mono pt-32 pb-24 overflow-hidden bg-gradient-to-br from-[#0c0507] via-[#050505] to-[#120409] c8l-scanlines">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/black-thread.png')] opacity-10 pointer-events-none"></div>

      <div className="container mx-auto px-6 max-w-6xl relative z-10">
        
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-12 border-b-3 border-black pb-6">
          <Link 
            href="/community" 
            className="flex items-center gap-2 text-sm text-zinc-400 hover:text-[var(--color-gold)] transition-colors"
          >
            <ArrowLeft size={16} />
            <span>Volver a la Comunidad</span>
          </Link>

          <div className="flex bg-black border-3 border-black p-1 font-heading text-xs tracking-wider rounded-none shadow-[2px_2px_0px_#00F3FF]">
            <Link 
              href="/streamer/profile" 
              className="px-4 py-2 bg-[var(--color-gold)] text-black font-black transition-all flex items-center gap-1.5"
            >
              <User size={13} />
              <span>Link-in-Bio</span>
            </Link>
            <Link 
              href="/streamer/profile-services" 
              className="px-4 py-2 text-zinc-400 hover:text-white transition-all flex items-center gap-1.5"
            >
              <Layers size={13} />
              <span>Perfil Servicios</span>
            </Link>
            <Link 
              href="/streamer/multipost" 
              className="px-4 py-2 text-zinc-400 hover:text-white transition-all flex items-center gap-1.5"
            >
              <Send size={13} />
              <span>Multipost</span>
            </Link>
            <Link 
              href="/streamer" 
              className="px-4 py-2 text-zinc-400 hover:text-white transition-all flex items-center gap-1.5"
            >
              <Wallet size={13} />
              <span>Finanzas BI</span>
            </Link>
          </div>

          <span className="text-zinc-500 font-mono text-[10px] uppercase">Configuración de Identidad Digital C8L</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* Left Panel: Configuration Form */}
          <div className="lg:col-span-6 c8l-cyber-panel p-8 flex flex-col justify-between h-full">
            <form onSubmit={handleSaveProfile} className="space-y-5 text-left">
              <h3 className="font-heading font-black text-xl text-[var(--color-gold)] uppercase tracking-wider border-b-3 border-black pb-4 mb-2">
                Tarjeta de Identidad C8L
              </h3>

              {/* Alias */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                  {language === "es" ? "Alias / Nombre Artístico" : "Artist Alias"}
                </label>
                <input
                  type="text"
                  required
                  value={alias}
                  onChange={(e) => setAlias(e.target.value)}
                  placeholder="e.g. Leo Vela"
                  className="w-full p-3.5 c8l-cyber-input text-xs font-semibold"
                />
              </div>

              {/* Platform & Banner presets */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                    {language === "es" ? "Plataforma Principal" : "Primary Platform"}
                  </label>
                  <select
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value)}
                    className="w-full p-3.5 c8l-cyber-input text-xs appearance-none cursor-pointer"
                  >
                    <option value="Twitch" className="bg-black">Twitch</option>
                    <option value="YouTube" className="bg-black">YouTube</option>
                    <option value="TikTok" className="bg-black">TikTok</option>
                    <option value="Kick" className="bg-black">Kick</option>
                  </select>
                </div>
                
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                    {language === "es" ? "Estilo de Portada" : "Banner Style"}
                  </label>
                  <select
                    value={bannerPreset}
                    onChange={(e) => setBannerPreset(e.target.value)}
                    className="w-full p-3.5 c8l-cyber-input text-xs appearance-none cursor-pointer"
                  >
                    <option value="cyberpunk" className="bg-black">Cyberpunk Aurora</option>
                    <option value="gold" className="bg-black">Golden Luxury</option>
                    <option value="neon" className="bg-black">Neon Emerald</option>
                  </select>
                </div>
              </div>

              {/* Link-in-Bio URLs */}
              <div className="space-y-3.5 pt-2">
                <h4 className="text-[10px] font-bold text-[var(--color-gold)] uppercase tracking-widest flex items-center gap-1.5">
                  <LinkIcon size={12} />
                  <span>{language === "es" ? "Enlaces Flotantes (Link-in-Bio)" : "Link-in-Bio Settings"}</span>
                </h4>

                <div className="flex flex-col gap-2">
                  <span className="text-[9px] text-zinc-500 uppercase font-mono">YouTube URL</span>
                  <input
                    type="url"
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                    placeholder="https://youtube.com/..."
                    className="w-full p-3 c8l-cyber-input text-[11px]"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <span className="text-[9px] text-zinc-500 uppercase font-mono">TikTok URL</span>
                  <input
                    type="url"
                    value={tiktokUrl}
                    onChange={(e) => setTiktokUrl(e.target.value)}
                    placeholder="https://tiktok.com/..."
                    className="w-full p-3 c8l-cyber-input text-[11px]"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <span className="text-[9px] text-zinc-500 uppercase font-mono">Twitch URL</span>
                  <input
                    type="url"
                    value={twitchUrl}
                    onChange={(e) => setTwitchUrl(e.target.value)}
                    placeholder="https://twitch.tv/..."
                    className="w-full p-3 c8l-cyber-input text-[11px]"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <span className="text-[9px] text-zinc-500 uppercase font-mono">Kick URL</span>
                  <input
                    type="url"
                    value={kickUrl}
                    onChange={(e) => setKickUrl(e.target.value)}
                    placeholder="https://kick.com/..."
                    className="w-full p-3 c8l-cyber-input text-[11px]"
                  />
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full py-4 c8l-cyber-button-gold text-xs flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Save size={14} />
                  <span>{saving ? "Guardando..." : "Guardar Cambios"}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Right Panel: Live Card Preview */}
          <div className="lg:col-span-6 flex flex-col items-center justify-center">
            <motion.div
              layout
              className={`w-full max-w-sm overflow-hidden relative flex flex-col group ${getPanelStyleClass()}`}
            >
              {/* Header Cover Banner */}
              <div className={`h-32 w-full relative transition-all duration-500 overflow-hidden ${getBannerClass()}`}>
                <div className="absolute inset-0 bg-black/20 backdrop-blur-[1px]"></div>
                {/* Scanline pattern for arcade look */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px] pointer-events-none"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-[1.5s] ease-in-out"></div>
              </div>

              {/* Profile layout content */}
              <div className="p-8 flex flex-col items-center relative pt-0 bg-[#0d0d0e]">
                
                {/* Chibi mascot avatar floating offset */}
                <div className="w-28 h-28 rounded-full border-4 border-[#000000] bg-zinc-950 flex items-center justify-center relative -mt-14 z-10 shadow-[0_0_15px_rgba(212,175,55,0.4)]">
                  <div className="absolute inset-0 bg-radial-gradient-gold opacity-10"></div>
                  <LionMascot state={mascotState} size={90} className="mt-[-8px]" />
                </div>

                {/* Nickname & Platform badge */}
                <h4 className="font-heading font-black text-2xl text-white uppercase tracking-wide mt-4">
                  {alias || "Streamer"}
                </h4>
                
                <span className={`mt-2 px-3 py-1 rounded-none text-[9px] font-mono font-bold uppercase border-2 border-black ${getRankBadgeColor()}`}>
                  {getRankName()}
                </span>

                {/* Connection info */}
                <div className="flex gap-6 items-center justify-center mt-6 text-[10px] font-mono text-zinc-500 uppercase tracking-widest border-t-2 border-b-2 border-black py-3 w-full">
                  <span>Plataforma: <strong className="text-zinc-300 font-bold">{platform}</strong></span>
                  <span>Sesiones: <strong className="text-zinc-300 font-bold">{connectionCount}</strong></span>
                </div>

                {/* Floating links-in-bio grid buttons */}
                <div className="flex gap-4 justify-center mt-8 w-full">
                  {[
                    { url: youtubeUrl, icon: <YoutubeIcon />, color: "hover:bg-red-600 hover:text-white hover:border-red-500" },
                    { url: tiktokUrl, icon: <span>🎵</span>, color: "hover:bg-black hover:text-white hover:border-zinc-700" },
                    { url: twitchUrl, icon: <TwitchIcon />, color: "hover:bg-purple-600 hover:text-white hover:border-purple-500" },
                    { url: kickUrl, icon: <Globe size={16} />, color: "hover:bg-emerald-600 hover:text-black hover:border-emerald-500" }
                  ].map((link, idx) => {
                    const hasUrl = link.url.trim() !== "";
                    return (
                      <a
                        key={idx}
                        href={hasUrl ? link.url : "#"}
                        target={hasUrl ? "_blank" : undefined}
                        rel={hasUrl ? "noreferrer" : undefined}
                        className={`w-10 h-10 border-2 border-black flex items-center justify-center text-zinc-400 bg-[#151517] transition-all duration-300 ${
                          hasUrl 
                            ? `${link.color} cursor-pointer scale-100 hover:scale-110 active:scale-95 shadow-[2px_2px_0px_#000]` 
                            : "opacity-25 border-dashed cursor-not-allowed pointer-events-none"
                        }`}
                      >
                        {link.icon}
                      </a>
                    );
                  })}
                </div>

                {/* Public Link button */}
                <div className="mt-8 w-full border-t border-black pt-6">
                  <Link 
                    href={`/p?uid=${user.uid}`}
                    target="_blank"
                    className="w-full py-2.5 c8l-cyber-button text-[10px] flex items-center justify-center gap-1.5"
                  >
                    <ExternalLink size={12} />
                    <span>Ver Link-in-Bio Público</span>
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* SIMPLIFIED FINANCIAL STATUS CARD */}
        <div className="mt-12 text-left">
          <div className="c8l-cyber-panel p-8 bg-gradient-to-br from-zinc-950 to-zinc-900 relative overflow-hidden">
            {/* Themed background accents */}
            <div className="absolute right-0 top-0 w-32 h-32 bg-[#D4AF37] opacity-[0.03] blur-3xl pointer-events-none" />
            <div className="absolute left-1/3 bottom-0 w-48 h-48 bg-[#00F3FF] opacity-[0.03] blur-3xl pointer-events-none" />

            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-6">
              <div>
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest font-extrabold flex items-center gap-1">
                  <Sparkles size={12} className="text-[var(--color-gold)] animate-pulse" />
                  <span>Estado Financiero de Creador C8L</span>
                </span>
                <h3 className="font-heading font-black text-2xl text-[var(--color-gold)] uppercase tracking-wider mt-2.5">
                  Centro de Control de Ingresos de la Agencia
                </h3>
                <p className="text-[11px] text-zinc-400 leading-relaxed mt-2 max-w-2xl font-sans">
                  Monetiza tus contenidos, gestiona tus diamantes acumulados por regalos en vivo, recarga monedas de patrocinio y audita el ledger inalterable de transacciones de Stripe. Todo centralizado desde el Hub de Servicios.
                </p>
              </div>

              {/* Quick Balances & Redirection */}
              <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center shrink-0">
                <div className="p-4 border-2 border-black bg-black/60 shadow-[3px_3px_0px_#000] flex flex-col justify-center min-w-[140px]">
                  <span className="text-[8px] font-bold text-zinc-500 uppercase">Espectador Coins</span>
                  <strong className="text-lg text-amber-400 font-mono mt-1">{c8lCoins.toLocaleString()} 🪙</strong>
                </div>

                <div className="p-4 border-2 border-black bg-black/60 shadow-[3px_3px_0px_#000] flex flex-col justify-center min-w-[140px]">
                  <span className="text-[8px] font-bold text-zinc-500 uppercase">Creador Diamonds</span>
                  <strong className="text-lg text-cyan-400 font-mono mt-1">{c8lDiamonds.toLocaleString()} 💎</strong>
                </div>

                <div className="p-4 border-2 border-black bg-black/60 shadow-[3px_3px_0px_#000] flex flex-col justify-center min-w-[140px] border-purple-500/20">
                  <span className="text-[8px] font-bold text-purple-400 uppercase">C8L Bizcoin (BZCN)</span>
                  <strong className="text-lg text-purple-400 font-mono mt-1">{bizcoinBalance.toLocaleString()} 🔮</strong>
                </div>

                <button
                  onClick={() => router.push("/streamer/profile-services?tab=wallet")}
                  className="px-6 py-4 c8l-cyber-button text-xs flex items-center gap-2 self-stretch"
                >
                  <Wallet size={14} />
                  <span>Gestionar Fondos</span>
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
