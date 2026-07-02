// app/profile/[id]/ProfileClient.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Award, 
  MessageSquare,
  Coins, Gem, Gift
} from 'lucide-react';
import { FaInstagram, FaYoutube, FaTwitch } from 'react-icons/fa';
import LionMascot from '@/components/ui/LionMascot';

interface ProfileData {
  name: string;
  avatar: string;
  roles: string[];
  bio: string;
  followers: number;
  following: number;
  level: number;
  xp: number;
  coins: number;
  diamonds: number;
  faction: string;
  factionEmblem: string;
  clan: string;
  clanTag: string;
  contact: {
    whatsapp?: string;
    instagram?: string;
    youtube?: string;
    twitch?: string;
  };
}

const MOCK_PROFILES: Record<string, ProfileData> = {
  leo_vela_uid: {
    name: "Leo Vela 🦁",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=150",
    roles: ["Vocalist", "Producer"],
    bio: "Cantautor cuántico y fundador de C8L Records. Creador de dembow espacial y ritmos híbridos del futuro.",
    followers: 12400,
    following: 280,
    level: 15,
    xp: 4500,
    coins: 5200,
    diamonds: 480,
    faction: "La Resistencia",
    factionEmblem: "⚔️",
    clan: "Cyber Heartbeat",
    clanTag: "C8L",
    contact: {
      whatsapp: "https://wa.me/34600000000",
      instagram: "https://instagram.com/leovela",
      youtube: "https://youtube.com/c/leovela"
    }
  },
  dj_rayo_uid: {
    name: "DJ Rayo ⚡",
    avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?q=80&w=150",
    roles: ["DJ", "Producer"],
    bio: "Especialista en synthwave y cyberpunk techno. Sonidos oscuros y bajos potentes directos del Lounge #829.",
    followers: 8900,
    following: 420,
    level: 12,
    xp: 2300,
    coins: 3400,
    diamonds: 120,
    faction: "Ziria Coins",
    factionEmblem: "🪙",
    clan: "Pulse Kings",
    clanTag: "PLS",
    contact: {
      instagram: "https://instagram.com/djrayo",
      twitch: "https://twitch.tv/djrayo"
    }
  },
  reina_melody_uid: {
    name: "Reina Melody 👑",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=150",
    roles: ["Vocalist"],
    bio: "La voz dorada del dembow y salsa cuántica. Si te gusta cantar, ¡haz un Duet Challenge conmigo!",
    followers: 24500,
    following: 110,
    level: 20,
    xp: 8900,
    coins: 14800,
    diamonds: 2300,
    faction: "La Resistencia",
    factionEmblem: "⚔️",
    clan: "Vocal Divas",
    clanTag: "DIV",
    contact: {
      whatsapp: "https://wa.me/34611111111",
      instagram: "https://instagram.com/reinamelody",
      youtube: "https://youtube.com/c/reinamelody"
    }
  },
  beatmaster_uid: {
    name: "BeatMaster 🎧",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=150",
    roles: ["Producer", "DJ"],
    bio: "Productor de beats analógicos e instrumentales de trap. Tutoriales de DAW semanales en el estudio.",
    followers: 6700,
    following: 340,
    level: 8,
    xp: 950,
    coins: 1200,
    diamonds: 45,
    faction: "La Resistencia",
    factionEmblem: "⚔️",
    clan: "Beat Club",
    clanTag: "BTC",
    contact: {
      youtube: "https://youtube.com/c/beatmaster",
      instagram: "https://instagram.com/beatmaster"
    }
  },
  zen_noise_uid: {
    name: "Zen Noise 🧘",
    avatar: "https://images.unsplash.com/photo-1628157582853-a796fa650a6a?q=80&w=150",
    roles: ["Producer"],
    bio: "Sonidos lofi, ambient loops y frecuencias binaurales para relajación cuántica y meditación de código.",
    followers: 5200,
    following: 80,
    level: 7,
    xp: 680,
    coins: 850,
    diamonds: 10,
    faction: "Neutral",
    factionEmblem: "☯️",
    clan: "Quiet Beats",
    clanTag: "QBT",
    contact: {
      twitch: "https://twitch.tv/zennoise",
      instagram: "https://instagram.com/zennoise"
    }
  }
};

const MOCK_VIDEOS = [
  {
    id: "mock-1",
    title: "Leo Vela - Tan Solo Tú (Official Video) [C8L Records]",
    thumbnail_url: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=640",
    duration: 215,
    views: 12450,
    likes: 890,
    user_id: "leo_vela_uid"
  },
  {
    id: "mock-2",
    title: "DJ Rayo - Cyberpunk Beats Mix 2026 (Live set from Lounge #829)",
    thumbnail_url: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=640",
    duration: 3600,
    views: 8920,
    likes: 540,
    user_id: "dj_rayo_uid"
  },
  {
    id: "mock-3",
    title: "Reina Melody - Dembow Espacial Duet Challenge! (Cover)",
    thumbnail_url: "https://images.unsplash.com/photo-1516280440614-37939bbacd6a?q=80&w=640",
    duration: 185,
    views: 24500,
    likes: 1820,
    user_id: "reina_melody_uid"
  },
  {
    id: "mock-4",
    title: "C8L TV Live: La Batalla PK Suprema (Leo Vela vs El Retador)",
    thumbnail_url: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?q=80&w=640",
    duration: 0,
    views: 1040,
    likes: 310,
    user_id: "leo_vela_uid",
    is_live: true
  },
  {
    id: "mock-5",
    title: "BeatMaster - How to use Web Audio DAW inside C8L Studio [Tutorial]",
    thumbnail_url: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?q=80&w=640",
    duration: 824,
    views: 3410,
    likes: 290,
    user_id: "beatmaster_uid"
  },
  {
    id: "mock-6",
    title: "Zen Noise - Satori Protocol Ambient Loop [Relaxing Chill]",
    thumbnail_url: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?q=80&w=640",
    duration: 1200,
    views: 5900,
    likes: 410,
    user_id: "zen_noise_uid"
  },
  {
    id: "mock-7",
    title: "Leo Vela - Ritmo Cuántico (Live from Lounge #10)",
    thumbnail_url: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=640",
    duration: 310,
    views: 4500,
    likes: 380,
    user_id: "leo_vela_uid"
  },
  {
    id: "mock-8",
    title: "DJ Rayo - Ziria Coins Electro Beatmix",
    thumbnail_url: "https://images.unsplash.com/photo-1487180142328-054b783fc471?q=80&w=640",
    duration: 1800,
    views: 7300,
    likes: 620,
    user_id: "dj_rayo_uid"
  },
  {
    id: "mock-9",
    title: "Sirenas del Delta - Canto de Sirena (Acapella Cover)",
    thumbnail_url: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=640",
    duration: 195,
    views: 12000,
    likes: 950,
    user_id: "reina_melody_uid"
  },
  {
    id: "mock-11",
    title: "Ziria - Neón y Fuego (Official Lyric Video)",
    thumbnail_url: "https://images.unsplash.com/photo-1506157786151-b8491531f063?q=80&w=640",
    duration: 240,
    views: 18500,
    likes: 1420,
    user_id: "reina_melody_uid"
  },
  {
    id: "mock-12",
    title: "Leo Vela - Electro-Dembow Masterclass [C8L Studio]",
    thumbnail_url: "https://images.unsplash.com/photo-1598653222000-6b7b7a552625?q=80&w=640",
    duration: 1450,
    views: 9300,
    likes: 810,
    user_id: "leo_vela_uid"
  }
];

const BACKPACK_GIFTS = [
  { id: "cookie", name: "Galleta Mágica", emoji: "🍪", cost: 10, xp: 5 },
  { id: "coffee", name: "Café C8L", emoji: "☕", cost: 20, xp: 12 },
  { id: "bear", name: "Osito C8L", emoji: "🧸", cost: 50, xp: 35 },
  { id: "star", name: "Estrella Apoyo", emoji: "⭐", cost: 100, xp: 80 },
  { id: "unicorn", name: "Unicornio", emoji: "🦄", cost: 500, xp: 450 }
];

export default function ProfileClient({ id }: { id: string }) {
  const { language, showNotification, deductCCoins } = useApp();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [videos, setVideos] = useState<any[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [mascotState, setMascotState] = useState<"idle" | "dance" | "win" | "sad" | "celebrate">("idle");
  const [showGiftModal, setShowGiftModal] = useState(false);
  const [sendingGiftId, setSendingGiftId] = useState<string | null>(null);

  useEffect(() => {
    const artistId = id || 'leo_vela_uid';
    const artistProfile = MOCK_PROFILES[artistId] || MOCK_PROFILES['leo_vela_uid'];
    setProfile(artistProfile);
    setFollowerCount(artistProfile.followers);

    // Filter videos by user
    const artistVideos = MOCK_VIDEOS.filter(v => v.user_id === artistId);
    setVideos(artistVideos);
  }, [id]);

  const handleFollowToggle = () => {
    setIsFollowing(prev => {
      const nextState = !prev;
      setFollowerCount(curr => nextState ? curr + 1 : curr - 1);
      setMascotState(nextState ? "celebrate" : "sad");
      showNotification(
        nextState 
          ? (language === "es" ? `¡Siguiendo a ${profile?.name}!` : `Following ${profile?.name}!`)
          : (language === "es" ? `Dejaste de seguir a ${profile?.name}` : `Unfollowed ${profile?.name}`),
        nextState ? "success" : "info"
      );
      setTimeout(() => setMascotState("idle"), 2000);
      return nextState;
    });
  };

  const handleSendGift = (gift: typeof BACKPACK_GIFTS[0]) => {
    setSendingGiftId(gift.id);
    setMascotState("dance");

    setTimeout(() => {
      const success = deductCCoins(gift.cost);
      if (success) {
        showNotification(
          language === "es" 
            ? `🎁 ¡Regalaste ${gift.emoji} ${gift.name} a ${profile?.name}! (+${gift.xp} Amistad)`
            : `🎁 Gifted ${gift.emoji} ${gift.name} to ${profile?.name}! (+${gift.xp} Friendship)`,
          "success"
        );
        setMascotState("win");
        setProfile(curr => {
          if (!curr) return null;
          return {
            ...curr,
            xp: curr.xp + gift.xp
          };
        });
      } else {
        showNotification(
          language === "es"
            ? "❌ Coins insuficientes en tu balance."
            : "❌ Insufficient Coins balance.",
          "error"
        );
        setMascotState("sad");
      }
      setSendingGiftId(null);
      setTimeout(() => setMascotState("idle"), 2000);
    }, 1000);
  };

  if (!profile) {
    return (
      <div className="min-h-screen bg-[#030303] text-white flex flex-col items-center justify-center pt-24">
        <div className="w-10 h-10 border-t-2 border-[var(--color-gold)] rounded-full animate-spin"></div>
        <span className="text-zinc-500 font-mono text-xs uppercase tracking-widest mt-4">Buscando perfil de artista...</span>
      </div>
    );
  }

  const liveVideo = videos.find(v => v.is_live);
  const regularVideos = videos.filter(v => !v.is_live);

  return (
    <div className="min-h-screen text-white relative font-sans pt-28 md:pt-32 pb-24 bg-gradient-to-br from-[#09050b] via-[#050505] to-[#0c0409] select-none">
      
      {/* Background Scanlines */}
      <div 
        className="fixed inset-0 z-0 opacity-5 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), 
            linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06))
          `,
          backgroundSize: "100% 4px, 6px 100%"
        }}
      ></div>

      <div className="container mx-auto px-6 max-w-6xl relative z-10">
        
        {/* Navigation Link */}
        <div className="flex justify-between items-center mb-10 border-b border-white/5 pb-6">
          <Link 
            href="/feed" 
            className="text-xs uppercase tracking-widest text-zinc-400 hover:text-[#00F3FF] transition-colors flex items-center gap-2"
          >
            <span>←</span>
            <span>Volver a C8L TV</span>
          </Link>
          <span className="text-zinc-500 font-mono text-[9px] uppercase tracking-widest">
            PERFIL PÚBLICO DEL ARTISTA
          </span>
        </div>

        {/* Profile Card & Stats Header */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch mb-10">
          
          {/* Left Column: Hero banner & Bio */}
          <div className="lg:col-span-8">
            <div className="bg-[#09090b] border-3 border-black shadow-[6px_6px_0px_#8A2BE2] p-8 flex flex-col md:flex-row gap-8 items-center md:items-start text-center md:text-left h-full">
              
              {/* Avatar Emoji / Image */}
              <div className="relative shrink-0">
                <div className="w-28 h-28 rounded-none border-3 border-black bg-zinc-950 flex items-center justify-center overflow-hidden shadow-[4px_4px_0px_#00F3FF]">
                  {profile.avatar.startsWith('http') ? (
                    <img src={profile.avatar} className="w-full h-full object-cover" alt={profile.name} />
                  ) : (
                    <span className="text-5xl">{profile.avatar || '🎤'}</span>
                  )}
                </div>
                {liveVideo && (
                  <span className="absolute -bottom-2 -right-2 bg-[#FF69B4] text-black border-2 border-black text-[8px] font-black px-1.5 py-0.5 uppercase tracking-wider animate-pulse shadow-[2px_2px_0px_#000]">
                    LIVE
                  </span>
                )}
              </div>

              {/* Artist Info */}
              <div className="flex-1 space-y-4">
                <div>
                  <h1 className="font-heading font-black text-3xl uppercase tracking-wider text-white">
                    {profile.name}
                  </h1>
                  
                  {/* Role Tags */}
                  <div className="flex flex-wrap gap-2 mt-2 justify-center md:justify-start">
                    {profile.roles.map(role => (
                      <span 
                        key={role} 
                        className="px-2.5 py-0.5 bg-[#8A2BE2] border-2 border-black font-black uppercase text-[9px] tracking-widest text-white shadow-[2px_2px_0px_#000]"
                      >
                        {role}
                      </span>
                    ))}
                    {profile.faction && (
                      <span className="px-2.5 py-0.5 bg-[#D4AF37] border-2 border-black font-black uppercase text-[9px] tracking-widest text-black shadow-[2px_2px_0px_#000] flex items-center gap-1">
                        <span>{profile.factionEmblem}</span>
                        <span>{profile.faction}</span>
                      </span>
                    )}
                    {profile.clan && (
                      <span className="px-2.5 py-0.5 bg-[#00F3FF] border-2 border-black font-black uppercase text-[9px] tracking-widest text-black shadow-[2px_2px_0px_#000]">
                        [{profile.clanTag}] {profile.clan}
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-xs text-zinc-400 font-medium leading-relaxed max-w-xl">
                  {profile.bio || "Este artista no ha completado su biografía."}
                </p>

                {/* Profile actions */}
                <div className="flex flex-wrap gap-3 pt-2 justify-center md:justify-start">
                  <button 
                    onClick={handleFollowToggle}
                    className={`px-5 py-2.5 border-2 border-black font-heading font-black text-xs uppercase tracking-widest transition-all shadow-[3px_3px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] cursor-pointer ${
                      isFollowing 
                        ? 'bg-zinc-800 text-zinc-400 hover:bg-red-950/30 hover:text-red-500' 
                        : 'bg-[#00F3FF] text-black hover:bg-cyan-300'
                    }`}
                  >
                    {isFollowing ? '✓ Siguiendo' : '＋ Seguir Artista'}
                  </button>

                  <button 
                    onClick={() => setShowGiftModal(true)}
                    className="px-5 py-2.5 bg-[#FF69B4] hover:bg-[#FF69B4]/90 text-black border-2 border-black font-heading font-black text-xs uppercase tracking-widest transition-all shadow-[3px_3px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] cursor-pointer flex items-center gap-1.5"
                  >
                    <Gift size={14} />
                    <span>Enviar Regalo</span>
                  </button>
                </div>
              </div>

            </div>
          </div>

          {/* Right Column: Statistics grid */}
          <div className="lg:col-span-4">
            <div className="bg-[#09090b] border-3 border-black shadow-[6px_6px_0px_#D4AF37] p-6 h-full flex flex-col justify-between">
              
              <div className="space-y-4">
                <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest font-black block border-b border-zinc-900 pb-2">
                  Estadísticas Cuánticas
                </span>

                {/* Level Badge */}
                <div className="flex items-center justify-between bg-zinc-950 border-2 border-black p-3.5 shadow-[2px_2px_0px_#000]">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 bg-[#D4AF37]/10 text-[#D4AF37] rounded border border-[#D4AF37]/20">
                      <Award size={16} />
                    </span>
                    <span className="text-xs font-bold uppercase tracking-wider">Nivel de Artista</span>
                  </div>
                  <strong className="text-lg font-mono text-[#D4AF37]">Lvl {profile.level}</strong>
                </div>

                {/* Follower Stats */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-zinc-950 border-2 border-black p-3 shadow-[2px_2px_0px_#000] text-center">
                    <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest block">Seguidores</span>
                    <strong className="text-base font-mono text-white block mt-1">{followerCount.toLocaleString()}</strong>
                  </div>
                  <div className="bg-zinc-950 border-2 border-black p-3 shadow-[2px_2px_0px_#000] text-center">
                    <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest block">Siguiendo</span>
                    <strong className="text-base font-mono text-white block mt-1">{profile.following.toLocaleString()}</strong>
                  </div>
                </div>

                {/* Balances */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-zinc-950 border-2 border-black p-3 shadow-[2px_2px_0px_#000] text-center">
                    <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest block flex items-center justify-center gap-0.5">
                      <Coins size={10} className="text-[#D4AF37]" /> Coins
                    </span>
                    <strong className="text-sm font-mono text-[#D4AF37] block mt-1">{profile.coins.toLocaleString()}</strong>
                  </div>
                  <div className="bg-zinc-950 border-2 border-black p-3 shadow-[2px_2px_0px_#000] text-center">
                    <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest block flex items-center justify-center gap-0.5">
                      <Gem size={10} className="text-cyan-400" /> Diamonds
                    </span>
                    <strong className="text-sm font-mono text-cyan-400 block mt-1">{profile.diamonds.toLocaleString()}</strong>
                  </div>
                </div>
              </div>

              {/* Artist Support Mascot react widget */}
              <div className="border-t border-zinc-900 pt-4 mt-6 flex items-center justify-between gap-4">
                <div className="text-left">
                  <span className="text-[8px] font-mono text-zinc-500 uppercase block font-bold">REACCIÓN MASCOTA</span>
                  <span className="text-[10px] text-zinc-400 leading-tight block mt-0.5">Leo reacciona a tus apoyos.</span>
                </div>
                <div className="w-14 h-14 bg-zinc-950 border-2 border-black shadow-[2px_2px_0px_#000] flex items-center justify-center overflow-hidden">
                  <LionMascot state={mascotState} size={45} className="mt-[-2px]" />
                </div>
              </div>

            </div>
          </div>

        </div>

        {/* Gallery / Tabs */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* Publications Gallery (8 columns) */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Header section with live badge option */}
            <div className="flex justify-between items-center border-b-3 border-black pb-3">
              <h3 className="font-heading font-black text-base uppercase tracking-wider flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-[#8A2BE2] rounded-full animate-ping"></span>
                <span>GALERÍA DE PUBLICACIONES</span>
              </h3>
              <span className="text-zinc-500 font-mono text-[10px]">
                {videos.length} videos publicados
              </span>
            </div>

            {/* Live stream highlighted preview */}
            {liveVideo && (
              <div className="bg-[#09090b] border-3 border-black p-4 shadow-[4px_4px_0px_#FF69B4] flex flex-col md:flex-row gap-5 items-stretch">
                <div className="relative aspect-video md:w-56 bg-black shrink-0 border-2 border-black overflow-hidden">
                  <img src={liveVideo.thumbnail_url} className="w-full h-full object-cover" alt="live" />
                  <span className="absolute top-2 left-2 bg-[#FF69B4] text-black border-2 border-black text-[9px] font-black px-1.5 py-0.5 uppercase tracking-wider animate-pulse">
                    🔴 EN VIVO
                  </span>
                </div>
                <div className="flex flex-col justify-between py-1 text-left">
                  <div>
                    <span className="text-[8px] font-mono text-[#FF69B4] uppercase tracking-widest font-black">TRANSMISIÓN ACTIVA</span>
                    <h4 className="font-heading font-black text-sm uppercase text-white mt-1 leading-snug">
                      {liveVideo.title}
                    </h4>
                    <p className="text-[11px] text-zinc-500 font-sans mt-2">
                      ¡El artista se encuentra transmitiendo en vivo en este momento! Ingresa a la sala para interactuar.
                    </p>
                  </div>
                  <Link 
                    href={`/watch/${liveVideo.id}`}
                    className="mt-4 px-4 py-2 bg-[#FF69B4] hover:bg-pink-400 text-black border-2 border-black font-heading font-black text-[10px] tracking-widest uppercase shadow-[2px_2px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] transition-all self-start"
                  >
                    Ingresar a Directo
                  </Link>
                </div>
              </div>
            )}

            {/* Regular publications grid */}
            {regularVideos.length === 0 ? (
              <div className="py-20 border-2 border-dashed border-zinc-800 text-center rounded">
                <span className="text-3xl">🎥</span>
                <h4 className="font-heading font-black text-sm text-zinc-500 uppercase mt-2">Sin videos regulares</h4>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {regularVideos.map(video => (
                  <div 
                    key={video.id} 
                    className="bg-[#0d0d0e] border-2 border-black shadow-[3px_3px_0px_#00F3FF] hover:shadow-[5px_5px_0px_#8A2BE2] transition-all flex flex-col justify-between text-left"
                  >
                    <Link href={`/watch/${video.id}`}>
                      <div className="aspect-video relative bg-black border-b-2 border-black overflow-hidden group">
                        <img 
                          src={video.thumbnail_url} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                          alt={video.title} 
                        />
                        <span className="absolute bottom-2 right-2 bg-black border border-zinc-800 text-[9px] font-mono px-1 rounded text-white">
                          {Math.floor(video.duration / 60)}:{(video.duration % 60).toString().padStart(2, '0')}
                        </span>
                      </div>
                    </Link>
                    <div className="p-4">
                      <Link href={`/watch/${video.id}`}>
                        <h4 className="font-heading font-black text-xs text-white uppercase line-clamp-2 hover:text-[#00F3FF] transition-colors leading-tight">
                          {video.title}
                        </h4>
                      </Link>
                      <div className="text-[9px] font-mono text-zinc-500 mt-2 flex gap-3 uppercase tracking-wider">
                        <span>👁️ {video.views.toLocaleString()} vistas</span>
                        <span>❤️ {video.likes} likes</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

          </div>

          {/* Social links & contact panel (4 columns) */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-[#09090b] border-3 border-black shadow-[6px_6px_0px_#8A2BE2] p-6 text-left">
              
              <h3 className="font-heading font-black text-sm text-white uppercase tracking-wider border-b-2 border-black pb-2 mb-4">
                ENLACES Y CONTACTO
              </h3>

              <div className="space-y-4">
                <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest font-black block">
                  Canales Oficiales
                </span>

                {profile.contact.whatsapp && (
                  <a 
                    href={profile.contact.whatsapp}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-black border-2 border-black font-bold text-xs uppercase tracking-wider rounded transition-all shadow-[2px_2px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <MessageSquare size={13} />
                    <span>WhatsApp Business</span>
                  </a>
                )}

                {profile.contact.instagram && (
                  <a 
                    href={profile.contact.instagram}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-2.5 bg-zinc-950 hover:bg-zinc-900 border-2 border-black text-[#FF69B4] font-bold text-xs uppercase tracking-wider rounded transition-all shadow-[2px_2px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <FaInstagram size={13} />
                    <span>Instagram</span>
                  </a>
                )}

                {profile.contact.youtube && (
                  <a 
                    href={profile.contact.youtube}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-2.5 bg-zinc-950 hover:bg-zinc-900 border-2 border-black text-red-500 font-bold text-xs uppercase tracking-wider rounded transition-all shadow-[2px_2px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <FaYoutube size={13} />
                    <span>YouTube Studio</span>
                  </a>
                )}

                {profile.contact.twitch && (
                  <a 
                    href={profile.contact.twitch}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-2.5 bg-zinc-950 hover:bg-zinc-900 border-2 border-black text-purple-500 font-bold text-xs uppercase tracking-wider rounded transition-all shadow-[2px_2px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <FaTwitch size={13} />
                    <span>Twitch Stream</span>
                  </a>
                )}
              </div>

              <div className="border-t border-zinc-900 pt-4 mt-6">
                <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest font-black block mb-3">
                  Verificación de Artista
                </span>
                <div className="bg-black/50 border border-zinc-800 p-3 rounded font-mono text-[9px] text-zinc-500 uppercase tracking-wide leading-relaxed">
                  🔐 ID VERIFICADO: SHA256-AUTHENTICATED<br />
                  🎖️ VERIFICACIÓN ACTIVA DESDE JUNIO 2026
                </div>
              </div>

            </div>
          </div>

        </div>

      </div>

      {/* Gift social backpack/shop modal overlay popup */}
      <AnimatePresence>
        {showGiftModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[150] flex items-center justify-center bg-black/85 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="w-full max-w-lg bg-[#0d0d0e] border-3 border-black p-6 shadow-[6px_6px_0px_#FF69B4] text-left"
            >
              <div className="flex justify-between items-center border-b-2 border-black pb-3 mb-6">
                <h3 className="font-heading font-black text-lg text-[#FF69B4] uppercase tracking-wider">
                  Enviar Regalo a {profile.name}
                </h3>
                <button 
                  onClick={() => setShowGiftModal(false)}
                  className="text-zinc-500 hover:text-white transition font-mono font-bold text-xs"
                >
                  [CERRAR]
                </button>
              </div>

              <p className="text-xs text-zinc-400 mb-6 leading-relaxed">
                Elige un regalo de tu mochila o tienda. Enviar regalos aumenta el XP del artista y fortalece la amistad.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-6 max-h-[300px] overflow-y-auto no-scrollbar pr-1">
                {BACKPACK_GIFTS.map(gift => (
                  <button
                    key={gift.id}
                    onClick={() => handleSendGift(gift)}
                    disabled={sendingGiftId !== null}
                    className="bg-black hover:bg-[#151517] disabled:opacity-50 border-2 border-black p-3 transition-all flex items-center justify-between text-left shadow-[2px_2px_0px_#000] hover:shadow-[3px_3px_0px_#FF69B4] active:translate-x-[1px] active:translate-y-[1px] cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-3xl bg-zinc-950 w-12 h-12 flex items-center justify-center border border-zinc-800 group-hover:border-[#FF69B4]">
                        {gift.emoji}
                      </span>
                      <div>
                        <span className="text-xs font-bold text-white block uppercase tracking-wide">{gift.name}</span>
                        <span className="text-[9px] font-mono text-zinc-500 uppercase mt-0.5 block">+{gift.xp} Amistad XP</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-[#D4AF37] font-black uppercase tracking-wider shrink-0 flex items-center gap-0.5">
                      <Coins size={10} />
                      {gift.cost}
                    </span>
                  </button>
                ))}
              </div>

              <div className="border-t border-zinc-900 pt-4 text-[10px] font-mono text-zinc-500 uppercase tracking-widest text-center">
                Saldo C8L: 1 Coin = 0.5 Estrellas para el creador
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
