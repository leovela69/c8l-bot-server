"use client";
import React, { useState, useEffect, useRef } from "react";
import { useApp } from "../../context/AppContext";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, Disc, Globe, Heart, Sparkles, Send, Coins, Layers, ExternalLink, Play
} from "lucide-react";
import LionMascot from "../../components/ui/LionMascot";
import { AVAILABLE_GIFTS, sendLiveGift } from "../../utils/billing";

// Helper to get YouTube ID
function getYouTubeId(url: string) {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

// Re-implement player for public view autonomy
interface PlayerProps {
  videoUrl: string;
  videoTitle?: string;
  thumbnail?: string;
  overlay?: { label: string; url: string; time: number } | null;
  aiExplanation?: string;
}

function PublicYouTubePlayer({
  videoUrl,
  videoTitle,
  thumbnail,
  overlay,
  aiExplanation
}: PlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSec, setPlaybackSec] = useState(0);
  const [showOverlay, setShowOverlay] = useState(false);
  const [duration] = useState(180);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const youtubeId = getYouTubeId(videoUrl);

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  useEffect(() => {
    if (isPlaying && !youtubeId) {
      timerRef.current = setInterval(() => {
        setPlaybackSec(prev => {
          const next = prev + 1;
          if (next >= duration) {
            setIsPlaying(false);
            clearInterval(timerRef.current!);
            return 0;
          }
          if (overlay && next === overlay.time) {
            setShowOverlay(true);
          }
          return next;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, youtubeId, duration, overlay]);

  let displayThumb = thumbnail || "https://images.unsplash.com/photo-1487180142328-054b783fc471?q=80&w=600";
  if (youtubeId) {
    displayThumb = `https://img.youtube.com/vi/${youtubeId}/sddefault.jpg`;
  }

  return (
    <div className="w-full bg-black border-3 border-black rounded-[4px] overflow-hidden relative group aspect-video shadow-[3px_3px_0px_#000]">
      {youtubeId && isPlaying ? (
        <iframe
          src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&controls=1&modestbranding=1&rel=0`}
          title={videoTitle}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full h-full"
        ></iframe>
      ) : (
        <div className="w-full h-full relative flex items-center justify-center">
          {isPlaying && (
            <div className="w-full h-full bg-gradient-to-b from-zinc-950 to-red-950/20 flex flex-col items-center justify-center p-4">
              <div className="flex items-center gap-1.5 justify-center h-20 w-full">
                {Array.from({ length: 15 }).map((_, i) => (
                  <span 
                    key={i} 
                    className="w-1 bg-[#FF0000] rounded-full"
                    style={{
                      height: `${20 + Math.sin(playbackSec * 2 + i) * 35 + Math.random() * 15}px`,
                      opacity: 0.4 + Math.random() * 0.6
                    }}
                  ></span>
                ))}
              </div>
              <span className="text-[10px] text-zinc-500 font-mono mt-4 uppercase tracking-widest">
                Reproduciendo Audio/Video Cuántico C8L
              </span>
            </div>
          )}

          {!isPlaying && (
            <div 
              className="absolute inset-0 bg-cover bg-center" 
              style={{ backgroundImage: `url(${displayThumb})` }}
            >
              <div className="absolute inset-0 bg-black/45"></div>
            </div>
          )}

          {!isPlaying && (
            <button 
              onClick={togglePlay}
              className="absolute z-10 w-16 h-12 bg-[#FF0055] hover:bg-[#CC0044] border-2 border-black rounded-[4px] flex items-center justify-center shadow-[3px_3px_0px_#000] hover:scale-105 transition-all duration-200 cursor-pointer"
            >
              <div className="w-0 h-0 border-t-8 border-t-transparent border-b-8 border-b-transparent border-l-[14px] border-l-white ml-1"></div>
            </button>
          )}

          {showOverlay && overlay && (
            <div className="absolute bottom-4 left-4 right-4 z-20 bg-zinc-950/95 border-2 border-black p-3 flex justify-between items-center shadow-[4px_4px_0px_#FF0055] animate-bounce">
              <div>
                <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-wider block">Promoción Creador</span>
                <span className="text-xs text-white font-bold">{overlay.label}</span>
              </div>
              <a 
                href={overlay.url} 
                target="_blank" 
                rel="noreferrer" 
                className="px-3 py-1 bg-[#00F3FF] text-black text-[10px] font-black uppercase border-2 border-black shadow-[2px_2px_0px_#000] hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all"
              >
                Ir
              </a>
            </div>
          )}
        </div>
      )}
      {aiExplanation && (
        <div className="absolute top-2 left-2 z-10">
          <span className="px-2 py-1 bg-black/80 border border-white/10 text-white font-mono text-[8px] rounded uppercase flex items-center gap-1">
            <Sparkles size={8} className="text-amber-400" />
            <span>IA Explicación</span>
          </span>
        </div>
      )}
    </div>
  );
}

// Main page component
export default function PublicProfilePage() {
  const { language, user, loading, showNotification, c8lCoins, deductCCoins, addCDiamonds } = useApp();
  const [uid, setUid] = useState("leo_vela39_uid");

  // Profile data states
  const [alias, setAlias] = useState("Leo Vela");
  const [bio, setBio] = useState("Músico, Streamer y Creador de contenido cuántico en C8L Agency.");
  const [bannerPreset, setBannerPreset] = useState("cyberpunk");
  const [activeTags, setActiveTags] = useState<string[]>(["DJ", "Vocalist", "Producer"]);
  const [isLive, setIsLive] = useState(true);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [tiktokUrl, setTiktokUrl] = useState("");
  const [twitchUrl, setTwitchUrl] = useState("");
  const [kickUrl, setKickUrl] = useState("");
  const [moments, setMoments] = useState<any[]>([]);

  // Mascot and tip jar states
  const [mascotState, setMascotState] = useState<"idle" | "dance" | "win" | "sad" | "celebrate">("idle");
  const [mascotBubble, setMascotBubble] = useState("¡Hola! Soy Mileoncito, la mascota C8L. ¡Hazme click para saludar!");
  const [customTipAmount, setCustomTipAmount] = useState("");
  const [tippingProcessing, setTippingProcessing] = useState(false);

  // Parse parameters from client search string safely
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const queryUid = params.get("uid");
      if (queryUid) {
        setUid(queryUid);
      }
    }
  }, []);

  // Fetch streamer data from localStorage dynamically
  useEffect(() => {
    const getStorageKey = (key: string) => `c8l_${uid}_${key}`;

    const storedAlias = localStorage.getItem(getStorageKey("alias"));
    if (storedAlias) setAlias(storedAlias);
    else if (uid === "leo_vela39_uid") setAlias("Leo Vela");

    const storedBio = localStorage.getItem(getStorageKey("bio"));
    if (storedBio) setBio(storedBio);
    else if (uid === "leo_vela39_uid") setBio("Músico, Streamer y Creador de contenido cuántico en C8L Agency. Produciendo los covers más finos y sesiones de DJ en directo.");

    const storedBanner = localStorage.getItem(getStorageKey("bannerPreset"));
    if (storedBanner) setBannerPreset(storedBanner);

    const storedTags = localStorage.getItem(getStorageKey("activeTags"));
    if (storedTags) {
      try {
        setActiveTags(JSON.parse(storedTags));
      } catch (e) {
        console.error(e);
      }
    }

    const storedIsLive = localStorage.getItem(getStorageKey("isLive"));
    if (storedIsLive) setIsLive(storedIsLive === "true");

    // URLs
    setYoutubeUrl(localStorage.getItem(getStorageKey("url_youtube")) || (uid === "leo_vela39_uid" ? "https://youtube.com/@CorazoneLocos" : ""));
    setTiktokUrl(localStorage.getItem(getStorageKey("url_tiktok")) || (uid === "leo_vela39_uid" ? "https://tiktok.com/@leo_vela39" : ""));
    setTwitchUrl(localStorage.getItem(getStorageKey("url_twitch")) || "");
    setKickUrl(localStorage.getItem(getStorageKey("url_kick")) || "");

    // Timeline Moments
    const storedMoments = localStorage.getItem(getStorageKey("moments"));
    if (storedMoments) {
      try {
        setMoments(JSON.parse(storedMoments));
      } catch (e) {
        console.error(e);
      }
    }
  }, [uid]);

  // Pet mascot action
  const handlePetMascot = () => {
    const states: ("dance" | "win" | "celebrate")[] = ["dance", "win", "celebrate"];
    const chosenState = states[Math.floor(Math.random() * states.length)];
    setMascotState(chosenState);

    const phrases = [
      "¡Grrraw! Eso se siente excelente. ¡Gracias por el cariño!",
      "¡Vamos con toda la energía cuántica hoy!",
      "¡C8L Agency manda en las PK Battles!",
      "¡Eres el mejor sponsor de la comunidad!",
      "¡Música, luces y beats al máximo de potencia!"
    ];
    setMascotBubble(phrases[Math.floor(Math.random() * phrases.length)]);

    setTimeout(() => {
      setMascotState("idle");
    }, 3000);
  };

  // Gift Tip submission handler
  const handleSendGiftTip = async (giftId: string) => {
    const gift = AVAILABLE_GIFTS.find(g => g.id === giftId);
    if (!gift) return;

    if (c8lCoins < gift.coinValue) {
      showNotification(
        language === "es" 
          ? "Monedas C8L insuficientes. Por favor, recarga en tu billetera de streamer." 
          : "Insufficient C8L Coins. Please recharge your wallet first.",
        "error"
      );
      setMascotState("sad");
      setMascotBubble("Oh, no tienes suficientes monedas... 😢");
      setTimeout(() => setMascotState("idle"), 3000);
      return;
    }

    setTippingProcessing(true);
    setMascotState("sad");
    setMascotBubble("Procesando tu regalo cuántico...");

    try {
      // Simulate endpoint post transaction
      await sendLiveGift(
        user?.uid || "anonymous_spectator",
        user?.displayName || "Espectador Cuántico",
        uid,
        alias,
        gift.id
      );

      // Deduct coins from global spectator context
      deductCCoins(gift.coinValue);
      // Credit diamonds to creator context if viewing self
      if (user?.uid === uid) {
        addCDiamonds(Math.floor(gift.coinValue * 0.5));
      }

      setMascotState("celebrate");
      setMascotBubble(`¡WOW! Enviaste un regalo: ${gift.icon} ${gift.name}. ¡Muchas gracias!`);
      showNotification(
        language === "es"
          ? `¡Has enviado un regalo de ${gift.coinValue} monedas con éxito!`
          : `Sent a gift of ${gift.coinValue} coins successfully!`,
        "success"
      );

      // Reload local moments list to show updated comments or transactions if stored in ledger
      const getStorageKey = (key: string) => `c8l_${uid}_${key}`;
      const storedMoments = localStorage.getItem(getStorageKey("moments"));
      if (storedMoments) {
        setMoments(JSON.parse(storedMoments));
      }
    } catch (e: any) {
      showNotification(e.message || "Error sending gift", "error");
    } finally {
      setTippingProcessing(false);
      setTimeout(() => {
        setMascotState("idle");
        setMascotBubble("¿Me envías otro regalo cuántico?");
      }, 4000);
    }
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

  const getRankBadgeColor = () => {
    if (uid === "leo_vela39_uid") return "bg-amber-500/10 text-amber-400 border-amber-500/30";
    return "bg-zinc-800 text-zinc-400 border-zinc-700/30";
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white font-mono">
        <Disc className="animate-spin text-[var(--color-gold)] mr-3" size={24} />
        <span>Cargando perfil público...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white relative font-mono pt-32 pb-24 overflow-hidden bg-gradient-to-br from-[#070305] via-[#020102] to-[#0d0d0e] c8l-scanlines">
      <div className="absolute inset-0 bg-stars opacity-10 pointer-events-none"></div>

      <div className="container mx-auto px-6 max-w-6xl relative z-10">
        
        {/* Navigation & Header */}
        <div className="flex justify-between items-center mb-10 border-b-3 border-black pb-6">
          <Link 
            href="/community" 
            className="flex items-center gap-2 text-xs font-bold text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={14} />
            <span>Volver a la Comunidad</span>
          </Link>
          <span className="text-zinc-500 font-mono text-[9px] uppercase tracking-wider">Identidad de Creador C8L</span>
        </div>

        {/* PROFILE PROFILE CONTAINER */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT COLUMN: Identity Card, Bio, Links */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Identity Card */}
            <div className="c8l-cyber-panel overflow-hidden relative">
              <div className={`h-24 w-full relative ${getBannerClass()}`}>
                {isLive && (
                  <span className="absolute top-3 left-3 bg-[#FF0055] text-white font-black text-[9px] px-2 py-0.5 border-2 border-black animate-pulse shadow-[1px_1px_0px_#000]">
                    LIVE NOW
                  </span>
                )}
              </div>
              <div className="p-6 relative pt-0 bg-[#0d0d0e] flex flex-col items-center text-center">
                <div className="w-24 h-24 rounded-full border-4 border-black bg-zinc-900 flex items-center justify-center relative -mt-12 z-10 shadow-[0_0_12px_rgba(212,175,55,0.3)]">
                  <div 
                    className="w-full h-full rounded-full bg-cover bg-center border-2 border-black"
                    style={{ backgroundImage: `url(${uid === "leo_vela39_uid" ? "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256" : "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=128"})` }}
                  ></div>
                </div>

                <h2 className="font-heading font-black text-2xl text-white mt-3 uppercase tracking-wide">{alias}</h2>
                <span className="text-[10px] text-zinc-500 font-bold block">@{alias.toLowerCase().replace(/\s+/g, "_")}</span>

                <span className={`mt-2.5 px-3 py-0.5 border-2 border-black text-[8px] font-bold uppercase tracking-wider ${getRankBadgeColor()}`}>
                  {uid === "leo_vela39_uid" ? "Creador VIP Agencia" : "Streamer C8L"}
                </span>

                <p className="text-zinc-400 text-xs mt-4 leading-relaxed px-2 font-sans font-medium text-left bg-black/40 p-3.5 border-2 border-black rounded-[4px] shadow-[2px_2px_0px_#000]">
                  {bio}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5 justify-center mt-4">
                  {activeTags.map(tag => (
                    <span key={tag} className="px-2 py-0.5 border border-zinc-800 bg-zinc-950 text-zinc-500 text-[9px] font-bold uppercase rounded-[4px]">
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Social icons links */}
                <div className="flex gap-3 justify-center mt-6 w-full pt-4 border-t border-black">
                  {[
                    { name: "YouTube", url: youtubeUrl, icon: "📺", color: "hover:bg-red-950 hover:text-red-400 hover:border-red-600" },
                    { name: "Twitch", url: twitchUrl, icon: "🎮", color: "hover:bg-purple-950 hover:text-purple-400 hover:border-purple-600" },
                    { name: "TikTok", url: tiktokUrl, icon: "🎵", color: "hover:bg-zinc-900 hover:text-white hover:border-zinc-500" },
                    { name: "Kick", url: kickUrl, icon: "🟢", color: "hover:bg-emerald-950 hover:text-emerald-400 hover:border-emerald-600" }
                  ].map((link, idx) => {
                    const hasUrl = link.url.trim() !== "";
                    if (!hasUrl) return null;
                    return (
                      <a
                        key={idx}
                        href={link.url}
                        target="_blank"
                        rel="noreferrer"
                        className={`w-10 h-10 border-2 border-black flex items-center justify-center text-zinc-400 bg-[#151517] transition-all duration-300 ${link.color} shadow-[2px_2px_0px_#000] hover:scale-110 active:scale-95`}
                        title={link.name}
                      >
                        <span className="text-lg">{link.icon}</span>
                      </a>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* MILEONCITO INTERACTIVE BOX */}
            <div className="c8l-cyber-panel p-5 bg-[#0d0d0e] flex flex-col items-center relative overflow-hidden">
              <div className="absolute top-2 right-3">
                <span className="text-[7px] font-mono text-zinc-500 font-extrabold uppercase tracking-widest bg-black px-1.5 py-0.5 border border-zinc-800">Mileoncito Pet System</span>
              </div>

              {/* Lion mascot speech bubble */}
              <div className="w-full bg-[#151517] border-2 border-black p-3 text-[10px] text-zinc-300 leading-normal rounded-[4px] relative mb-2 shadow-[2px_2px_0px_#000] text-center font-sans font-semibold">
                {mascotBubble}
                {/* bubble triangle pointing down */}
                <div className="w-0 h-0 border-t-8 border-t-[#151517] border-x-8 border-x-transparent absolute bottom-[-8px] left-1/2 transform -translate-x-1/2"></div>
              </div>

              <div 
                onClick={handlePetMascot}
                className="cursor-pointer hover:scale-105 active:scale-95 transition-transform my-3"
                title="¡Haz click para acariciar a Mileoncito!"
              >
                <LionMascot state={mascotState} size={140} />
              </div>

              <span className="text-[8px] text-zinc-500 uppercase tracking-widest font-extrabold animate-pulse">
                👉 HAZ CLICK EN MILEONCITO PARA ACARICIARLO
              </span>
            </div>

          </div>

          {/* RIGHT COLUMN: Moments Feed & Quantum Tip Jar */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* QUANTUM TIP JAR (BOTE DE PROPINAS) */}
            <div className="c8l-cyber-panel-gold p-6 bg-gradient-to-br from-[#0f0b03] via-[#050505] to-[#140e06] text-left">
              <h3 className="font-heading font-black text-lg text-[var(--color-gold)] uppercase tracking-wider border-b-2 border-black pb-3 mb-4 flex items-center gap-2">
                <Coins className="text-[var(--color-gold)]" />
                <span>Quantum Tip Jar</span>
              </h3>
              <p className="text-[10px] text-zinc-400 leading-relaxed font-sans font-semibold">
                Apoya al streamer enviándole regalos virtuales cuánticos directos. Tus C8L Coins del visor se descontarán y se convertirán al 50% en Diamantes para el streamer (infraestructura respaldada por AntiGravity).
              </p>

              {/* Viewer Coin balance status */}
              <div className="flex justify-between items-center bg-black/60 p-3 border-2 border-black rounded-[4px] my-4 shadow-[2px_2px_0px_#000]">
                <span className="text-[9px] font-bold text-zinc-500 uppercase">Tus Coins Disponibles:</span>
                <span className="font-mono text-sm text-amber-400 font-bold">{c8lCoins.toLocaleString()} 🪙</span>
              </div>

              {/* Gift grid layout selector */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-4">
                {AVAILABLE_GIFTS.map(gift => (
                  <button
                    key={gift.id}
                    disabled={tippingProcessing}
                    onClick={() => handleSendGiftTip(gift.id)}
                    className="p-3 border-2 border-black bg-[#151517] hover:border-[var(--color-gold)] hover:bg-[#1a150e] text-center transition-all duration-150 shadow-[2px_2px_0px_#000] hover:scale-105 active:scale-95 disabled:opacity-40 cursor-pointer flex flex-col items-center justify-between"
                  >
                    <span className="text-2xl block mb-1">{gift.icon}</span>
                    <span className="text-[9px] font-bold text-white block truncate w-full">{gift.nameEn}</span>
                    <span className="text-[8px] font-mono text-[var(--color-gold)] font-bold mt-1 bg-black px-1.5 rounded">{gift.coinValue} 🪙</span>
                  </button>
                ))}
              </div>

              {tippingProcessing && (
                <div className="mt-4 text-center text-[9px] font-mono text-[var(--color-gold)] uppercase tracking-widest animate-pulse">
                  Procesando transferencia segura en el ledger de la agencia...
                </div>
              )}
            </div>

            {/* STREAMER TIMELINE MOMENTS */}
            <div className="space-y-6">
              <h3 className="font-heading font-black text-xl text-white uppercase tracking-wider border-b-3 border-black pb-4 text-left">
                Timeline y Novedades
              </h3>

              {moments.length === 0 ? (
                <div className="c8l-cyber-panel text-center py-12 bg-[#0d0d0e]">
                  <Layers size={32} className="text-zinc-700 mx-auto mb-2" />
                  <p className="text-zinc-500 text-xs uppercase tracking-widest">Sin publicaciones activas</p>
                  <p className="text-zinc-600 text-[10px] mt-1 font-sans">El streamer aún no ha publicado momentos o covers en su timeline.</p>
                </div>
              ) : (
                moments.map(moment => (
                  <div key={moment.id} className="c8l-cyber-panel p-5 bg-[#0d0d0e] space-y-4 text-left">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-10 h-10 rounded-full bg-cover bg-center border-2 border-black shrink-0 shadow-[1px_1px_0px_#000]" 
                          style={{ backgroundImage: `url(${moment.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256"})` }}
                        ></div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h4 className="text-xs font-black text-white uppercase">{moment.authorName}</h4>
                            <span className="text-[8px] px-1.5 py-0.5 border border-black bg-zinc-950 text-zinc-500 font-mono">CREADOR VIP</span>
                          </div>
                          <span className="text-[9px] text-zinc-500 font-mono" suppressHydrationWarning>
                            {new Date(moment.timestamp).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-zinc-300 leading-relaxed whitespace-pre-wrap font-sans font-medium">
                      {moment.text}
                    </p>

                    {moment.videoUrl && (
                      <div className="space-y-2">
                        <PublicYouTubePlayer 
                          videoUrl={moment.videoUrl} 
                          videoTitle={moment.videoTitle || "Multimedia C8L"}
                          thumbnail={moment.thumbnail}
                          aiExplanation={moment.aiExplanation}
                        />
                        {moment.videoType && (
                          <div className="flex items-center gap-2 text-[9px] font-mono text-zinc-500">
                            <span className="px-2 py-0.5 border border-black bg-[#151517] text-[var(--color-gold)] font-bold uppercase rounded">
                              {moment.videoType}
                            </span>
                            {moment.views > 0 && <span>{moment.views.toLocaleString()} views</span>}
                          </div>
                        )}
                      </div>
                    )}

                    {moment.aiExplanation && (
                      <div className="p-3 border-2 border-black bg-[#151517] rounded-[4px] shadow-[2px_2px_0px_#000]">
                        <div className="flex items-center gap-1.5 text-[9px] font-bold text-amber-400 uppercase mb-1">
                          <Sparkles size={10} />
                          <span>C8L Music IA Studio Breakdown</span>
                        </div>
                        <p className="text-[10px] text-zinc-400 font-mono leading-relaxed">
                          {moment.aiExplanation}
                        </p>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
