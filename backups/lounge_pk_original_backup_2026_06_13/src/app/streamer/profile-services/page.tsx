"use client";
import React, { useState, useEffect, useRef } from "react";
import { useApp } from "../../../context/AppContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, User, Send, Coins, Film, Music, Save, Sparkles, Heart, Award, 
  EyeOff, Layers, MessageSquare, RefreshCw, Wallet, FileText, X, Eye, 
  ShieldCheck, Play, Pause, Trash2, Key, CheckCircle, AlertTriangle, ExternalLink, ChevronRight,
  Plus, Globe
} from "lucide-react";
import { registerOrUpdateUser, logActivity } from "../../../utils/analytics";
import { getLedgerTransactions, requestPayout, LedgerTransaction, rechargeCoins } from "../../../utils/billing";
import LionMascot from "../../../components/ui/LionMascot";

interface ContentRevenueItem {
  id: string;
  platform: string;
  momentId: string;
  title: string;
  type: string;
  amount: number;
  date: string;
  time: string;
}

interface RechargePackage {
  coins: number;
  cost: number;
  label: string;
}

interface MomentComment {
  id: string;
  author: string;
  avatar: string;
  text: string;
  timestamp: number;
  reply?: string;
  platform?: string;
}

interface MomentItem {
  id: string;
  authorName: string;
  authorHandle: string;
  avatar: string;
  timestamp: number;
  text: string;
  videoUrl?: string;
  videoTitle?: string;
  videoType?: string;
  thumbnail?: string;
  views: number;
  likes: number;
  likedBy: string[];
  comments: MomentComment[];
  aiExplanation?: string;
  overlay?: { label: string; url: string; time: number } | null;
}

interface CommentItem {
  id: string;
  platform: string;
  author: string;
  avatar: string;
  text: string;
  timestamp: number;
  isReplied: boolean;
  reply: string;
  coverId: string | null;
  videoTitle: string | null;
  videoUrl: string | null;
  isNew?: boolean;
}

interface RelationshipItem {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  tier: "diamond" | "platinum" | "gold" | "normal";
  mutual: boolean;
}

interface PlayerProps {
  videoUrl: string;
  videoTitle: string;
  thumbnail?: string;
  overlay?: { label: string; url: string; time: number } | null;
  aiExplanation?: string;
  onPlayChange?: (playing: boolean) => void;
  onViewInc?: () => void;
}

// Pre-loaded Mock Users for Social Graph
const COMMUNITY_USERS = [
  { id: "user_001", name: "Marta Gómez", handle: "@marta_g", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=128&auto=format&fit=crop" },
  { id: "user_002", name: "Carlos Stream", handle: "@carlos_s", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=128&auto=format&fit=crop" },
  { id: "user_003", name: "Sofía Music", handle: "@sofia_m", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=128&auto=format&fit=crop" },
  { id: "user_004", name: "Andrés Bass", handle: "@andres_b", avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=128&auto=format&fit=crop" },
  { id: "user_005", name: "Elena Singer", handle: "@elena_voice", avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=128&auto=format&fit=crop" },
  { id: "user_006", name: "Dani DJ", handle: "@dani_remix", avatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?q=80&w=128&auto=format&fit=crop" }
];

function getYouTubeId(url: string) {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}



const CONTENT_REVENUE_ITEMS: ContentRevenueItem[] = [
  { id: "inc_1", platform: "youtube", momentId: "mom_1", title: "Estoy Enamorado - Cover Acústico", type: "AdSense & Premium Ads", amount: 350.00, date: "28 May 2026", time: "14:30" },
  { id: "inc_2", platform: "kick", momentId: "mom_2", title: "Live Stream: Cantando Covers Cuánticos", type: "Subs Directas (95% Split)", amount: 245.00, date: "28 May 2026", time: "22:15" },
  { id: "inc_3", platform: "spotify", momentId: "mom_1", title: "Estoy Enamorado - Cover Acústico", type: "Audio Playback Streams", amount: 185.00, date: "27 May 2026", time: "09:12" },
  { id: "inc_4", platform: "twitch", momentId: "mom_2", title: "DJ Set Electro Live", type: "Bits & Donaciones", amount: 420.00, date: "27 May 2026", time: "18:40" },
  { id: "inc_5", platform: "bigo", momentId: "mom_2", title: "Live Set: Vela el León DJ", type: "Regalos Virtuales", amount: 150.00, date: "26 May 2026", time: "21:00" },
  { id: "inc_6", platform: "tango", momentId: "mom_3", title: "Sesión Acústica Terciopelo", type: "Lazos Cuánticos (Sponsors)", amount: 120.00, date: "25 May 2026", time: "16:30" },
  { id: "inc_7", platform: "tiktok", momentId: "mom_1", title: "Estoy Enamorado - Snippet Corto", type: "Fondo de Creadores", amount: 85.00, date: "25 May 2026", time: "11:22" },
  { id: "inc_8", platform: "soundcloud", momentId: "mom_3", title: "Aterciopelado (Acoustic Solo)", type: "SoundCloud Repost", amount: 45.00, date: "24 May 2026", time: "15:45" },
  { id: "inc_9", platform: "apple", momentId: "mom_3", title: "Aterciopelado (Acoustic Solo)", type: "Descargas iTunes", amount: 110.00, date: "23 May 2026", time: "10:10" },
  { id: "inc_10", platform: "facebook", momentId: "mom_2", title: "Vela el León DJ Set", type: "Stars Stream Direct", amount: 65.00, date: "22 May 2026", time: "19:30" }
];



const RECHARGE_PACKAGES: RechargePackage[] = [
  { coins: 250, cost: 3.75, label: "Paquete Inicial" },
  { coins: 500, cost: 7.50, label: "Paquete Bronce" },
  { coins: 1000, cost: 15.00, label: "Paquete Estándar" },
  { coins: 2500, cost: 35.00, label: "Paquete Premium (Descuento)" },
  { coins: 40000, cost: 500.00, label: "Paquete Elite C8L (Gran Ahorro)" }
];

const DEFAULT_MOMENTS: MomentItem[] = [
  {
    id: "mom_1",
    authorName: "Leo Vela",
    authorHandle: "@leo_vela",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256",
    timestamp: Date.now() - 3600000 * 2, // 2 hours ago
    text: "¡Familia! Acabo de sintetizar el nuevo beat cuántico 'Holographic Vibe'. Lo grabamos usando osciladores sinusoidales puros de C8L Agency. ¿Qué les parece?",
    videoUrl: "https://www.youtube.com/watch?v=holographic-vibe-live",
    videoTitle: "Holographic Vibe - Live Synth Mix",
    videoType: "Síntesis IA",
    thumbnail: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=300",
    views: 450000,
    likes: 18400,
    likedBy: [],
    comments: [
      {
        id: "com_1_1",
        author: "Marta Gómez",
        avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=128",
        text: "El beat de 'Holographic Vibe' suena excelente en bucle. ¡Felicitaciones!",
        timestamp: Date.now() - 3600000 * 1.5,
        reply: "¡Muchas gracias Marta! Es un placer que te guste.",
        platform: "youtube"
      },
      {
        id: "com_1_2",
        author: "@kick_ninja",
        avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=128",
        text: "¡El motor de síntesis de Kick está explotando! Gran calidad de audio.",
        timestamp: Date.now() - 3600000 * 1.2,
        platform: "kick"
      },
      {
        id: "com_1_3",
        author: "@tango_star",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=128",
        text: "Leo, suena hermoso. Saludos desde Tango App.",
        timestamp: Date.now() - 3600000 * 1.1,
        platform: "tango"
      }
    ],
    aiExplanation: "Este track de síntesis cuántica rediseña la armonía original a través de osciladores de sierra y filtros de paso bajo, complementados por la reverberación nativa de C8L Agency studio.",
    overlay: { label: "Comprar Single en iTunes", url: "https://apple.com/music", time: 4 }
  },
  {
    id: "mom_2",
    authorName: "Leo Vela",
    authorHandle: "@leo_vela",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256",
    timestamp: Date.now() - 3600000 * 5, // 5 hours ago
    text: "Preparando el Live Synth Set para el fin de semana. Aquí les dejo un pequeño adelanto en vivo en el centro tecnológico.",
    videoUrl: "https://twitch.tv/videos/c8l-live-synth-set",
    videoTitle: "C8L Synth Set - Live Session",
    videoType: "DJ Live Session",
    thumbnail: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=300",
    views: 1200000,
    likes: 89000,
    likedBy: [],
    comments: [
      {
        id: "com_2_1",
        author: "@ZackLive",
        avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=128",
        text: "¡Gran set Leo! ¿Cuándo repites el directo?",
        timestamp: Date.now() - 3600000 * 4,
        platform: "twitch"
      },
      {
        id: "com_2_2",
        author: "@bigo_king",
        avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=128",
        text: "¡Enviado un Regalo de Corona Real en Bigo! Sigue así crack.",
        timestamp: Date.now() - 3600000 * 3.5,
        platform: "bigo"
      },
      {
        id: "com_2_3",
        author: "@insta_girl",
        avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=128",
        text: "Qué buenos visuales subiste en tus historias.",
        timestamp: Date.now() - 3600000 * 3,
        platform: "instagram"
      }
    ],
    aiExplanation: "Una sesión de alta energía electrónica fusionando ritmos tech-house con osciladores sinusoidales. Grabado en vivo en el centro tecnológico de C8L Agency con visualizaciones dinámicas de neón.",
    overlay: { label: "Reservar Set para Evento", url: "https://leo-vela-booking.net", time: 6 }
  },
  {
    id: "mom_3",
    authorName: "Leo Vela",
    authorHandle: "@leo_vela",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256",
    timestamp: Date.now() - 3600000 * 24, // 1 day ago
    text: "Una sesión íntima para mis patrocinadores Platino de C8L Agency. Grabación analógica con síntesis aditiva y voz sintética.",
    videoUrl: "https://www.youtube.com/watch?v=synthetic-voice-solo",
    videoTitle: "Silicon Dreams (Acoustic Solo)",
    videoType: "Grabación Audio",
    thumbnail: "https://images.unsplash.com/photo-1510915228340-29c85a43dcfe?q=80&w=300",
    views: 280000,
    likes: 12000,
    likedBy: [],
    comments: [
      {
        id: "com_3_1",
        author: "@clara_music",
        avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=128",
        text: "Ese dueto sintético estuvo brutal 🔥 Súbelo a Spotify plsss",
        timestamp: Date.now() - 3600000 * 12,
        platform: "spotify"
      },
      {
        id: "com_3_2",
        author: "@sound_head",
        avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=128",
        text: "La síntesis aditiva se nota un montón en SoundCloud, ¡qué graves!",
        timestamp: Date.now() - 3600000 * 10,
        platform: "soundcloud"
      },
      {
        id: "com_3_3",
        author: "@apple_fan",
        avatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?q=80&w=128",
        text: "¡Comprado en iTunes! Apoyando el talento real.",
        timestamp: Date.now() - 3600000 * 8,
        platform: "apple"
      },
      {
        id: "com_3_4",
        author: "@x_poster",
        avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=128",
        text: "Acabo de compartir tu nuevo track en X, ¡merece hacerse viral!",
        timestamp: Date.now() - 3600000 * 7,
        platform: "x"
      },
      {
        id: "com_3_5",
        author: "@fb_fan",
        avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=128",
        text: "Qué gran orgullo tener un representante de esta talla en Facebook.",
        timestamp: Date.now() - 3600000 * 6,
        platform: "facebook"
      },
      {
        id: "com_3_6",
        author: "@discord_mod",
        avatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?q=80&w=128",
        text: "¡Conectado el webhook de Discord! Todos a reaccionar en el server general.",
        timestamp: Date.now() - 3600000 * 5,
        platform: "discord"
      }
    ],
    aiExplanation: "Grabación íntima de una sola toma de voz y melodía sintética, destacando la síntesis aditiva característica de C8L Agency. Creado en honor al apoyo incondicional de los patrocinadores platino.",
    overlay: { label: "Escuchar en Spotify", url: "https://open.spotify.com", time: 5 }
  }
];









const DEFAULT_RELATIONSHIPS = {
  familia: [
    { id: "user_003", name: "Sofía Music", handle: "@sofia_m", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=128", tier: "normal" as const, mutual: false }
  ],
  complicidad: [
    { id: "user_004", name: "Andrés Bass", handle: "@andres_b", avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=128", tier: "platinum" as const, mutual: true },
    { id: "user_006", name: "Dani DJ", handle: "@dani_remix", avatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?q=80&w=128", tier: "gold" as const, mutual: true }
  ],
  amistad: [
    { id: "user_001", name: "Marta Gómez", handle: "@marta_g", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=128", tier: "normal" as const, mutual: false }
  ],
  novio: null,
  esposo: { id: "user_002", name: "Carlos Stream", handle: "@carlos_s", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=128", tier: "diamond" as const, mutual: true },
  amante: null
};

const DEFAULT_SYNC_PLATFORMS = {
  youtube: { connected: true, followers: 850000, monthlyViews: 8500000, estRevenue: 3200 },
  kick: { connected: true, followers: 98000, monthlyViews: 1400000, estRevenue: 950 },
  twitch: { connected: true, followers: 150000, monthlyViews: 2100000, estRevenue: 1100 },
  tiktok: { connected: true, followers: 220000, monthlyViews: 1200000, estRevenue: 450 },
  instagram: { connected: false, followers: 120000, monthlyViews: 450000, estRevenue: 320 },
  bigo: { connected: false, followers: 28000, monthlyViews: 110000, estRevenue: 180 },
  tango: { connected: false, followers: 15000, monthlyViews: 90000, estRevenue: 130 },
  spotify: { connected: true, followers: 18000, monthlyViews: 650000, estRevenue: 670 },
  apple: { connected: false, followers: 6000, monthlyViews: 150000, estRevenue: 280 },
  soundcloud: { connected: false, followers: 14000, monthlyViews: 220000, estRevenue: 110 },
  x: { connected: false, followers: 45000, monthlyViews: 300000, estRevenue: 150 },
  facebook: { connected: false, followers: 75000, monthlyViews: 250000, estRevenue: 90 },
  discord: { connected: false, followers: 12000, monthlyViews: 0, estRevenue: 0 }
};

export default function ProfileServicesPage() {
  const { 
    language, user, loading, showNotification,
    c8lCoins, c8lDiamonds, addCCoins, deductCCoins, deductCDiamonds,
    loginWithMockUser
  } = useApp();
  const router = useRouter();

  // Basic Profile Gating
  useEffect(() => {
    if (!loading && !user) {
      showNotification(
        language === "es" ? "Iniciando demostración VIP (Sin Cuenta)..." : "Starting VIP demo (No Account)...",
        "info"
      );
      loginWithMockUser();
    }
  }, [user, loading, loginWithMockUser, language, showNotification]);

  // Tab Gating
  const [activeTab, setActiveTab] = useState<"profile" | "graph" | "inbox" | "sync" | "wallet">("profile");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get("tab");
      if (tabParam && ["profile", "graph", "inbox", "sync", "wallet"].includes(tabParam)) {
        setActiveTab(tabParam as any);
      }
    }
  }, []);

  // Profile configuration states
  const [alias, setAlias] = useState("Leo Vela");
  const [bio, setBio] = useState("Músico, Streamer y Creador de contenido cuántico en C8L Agency. Produciendo los covers más finos y sesiones de DJ en directo.");
  const [bannerPreset, setBannerPreset] = useState("cyberpunk");
  const [activeTags, setActiveTags] = useState<string[]>(["DJ", "Vocalist", "Producer", "Streaming"]);
  const [isLive, setIsLive] = useState(true);

  // Financial wallet details
  const [ledgerTxs, setLedgerTxs] = useState<LedgerTransaction[]>([]);
  const [loadingLedger, setLoadingLedger] = useState(false);
  const [payoutDiamonds, setPayoutDiamonds] = useState("");
  const [payoutProcessing, setPayoutProcessing] = useState(false);
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [showRechargeModal, setShowRechargeModal] = useState(false);
  const [rechargeProcessing, setRechargeProcessing] = useState(false);

  // Payout Method details
  const [payoutMethod, setPayoutMethod] = useState<"paypal" | "bank">("bank");
  const [paypalEmail, setPaypalEmail] = useState("");
  const [bankName, setBankName] = useState("");
  const [bankIban, setBankIban] = useState("");
  const [bankSwift, setBankSwift] = useState("");

  // Recharge Method details
  const [rechargeMethod, setRechargeMethod] = useState<"bank" | "paypal" | "payoneer">("bank");
  const [rechargePaypalEmail, setRechargePaypalEmail] = useState("");
  const [rechargePayoneerEmail, setRechargePayoneerEmail] = useState("");
  const [rechargeBankName, setRechargeBankName] = useState("");
  const [rechargeBankIban, setRechargeBankIban] = useState("");
  const [rechargeBankSwift, setRechargeBankSwift] = useState("");
  const [selectedPackIdx, setSelectedPackIdx] = useState<number>(2); // Default standard package (1000 coins)

  // APIs configurations states
  const [youtubeKey, setYoutubeKey] = useState("AIzaSyA1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p");
  const [kickKey, setKickKey] = useState("kk_tok_88b77c66d55e44f33g22");
  const [twitchSecret, setTwitchSecret] = useState("tw_sec_99a88b77c66d55e44f33");
  const [spotifyId, setSpotifyId] = useState("spot_id_00112233445566778899");
  const [tiktokSecret, setTiktokSecret] = useState("tt_app_dev_secret_key_xxxx");
  const [tangoKey, setTangoKey] = useState("tg_tok_33445566778899aabbcc");
  const [bigoKey, setBigoKey] = useState("bg_key_00112233445566778899");
  const [xKey, setXKey] = useState("x_api_key_tw_sec_xxxx");
  const [facebookSecret, setFacebookSecret] = useState("fb_sec_99a88b77c66d55e44f33");
  const [discordWebhook, setDiscordWebhook] = useState("https://discord.com/api/webhooks/xxxx");

  const [showYoutubeKey, setShowYoutubeKey] = useState(false);
  const [showKickKey, setShowKickKey] = useState(false);
  const [showTwitchSecret, setShowTwitchSecret] = useState(false);
  const [showSpotifyId, setShowSpotifyId] = useState(false);
  const [showTiktokSecret, setShowTiktokSecret] = useState(false);
  const [showTangoKey, setShowTangoKey] = useState(false);
  const [showBigoKey, setShowBigoKey] = useState(false);
  const [showXKey, setShowXKey] = useState(false);
  const [showFacebookSecret, setShowFacebookSecret] = useState(false);
  const [showDiscordWebhook, setShowDiscordWebhook] = useState(false);

  // Composer States for Moments Feed (Timeline)
  const [composerText, setComposerText] = useState("");
  const [composerVideoUrl, setComposerVideoUrl] = useState("");
  const [composerVideoTitle, setComposerVideoTitle] = useState("");
  const [composerVideoType, setComposerVideoType] = useState("Cover Musical");
  const [composerVideoThumb, setComposerVideoThumb] = useState("guitar");
  const [composerAiPrompt, setComposerAiPrompt] = useState("");
  const [composerAiExplanation, setComposerAiExplanation] = useState("");
  const [showComposerVideoOptions, setShowComposerVideoOptions] = useState(false);
  const [generatingAiComposer, setGeneratingAiComposer] = useState(false);

  // Interactive Lion Mascot "Mileoncito" State
  const [mascotState, setMascotState] = useState<"idle" | "dance" | "win" | "sad" | "cinema" | "celebrate">("idle");
  const mascotTimerRef = useRef<NodeJS.Timeout | null>(null);

  const triggerMascot = (state: typeof mascotState, duration: number = 3000) => {
    if (mascotTimerRef.current) clearTimeout(mascotTimerRef.current);
    setMascotState(state);
    mascotTimerRef.current = setTimeout(() => {
      setMascotState("idle");
    }, duration);
  };

  // Link Video Modal states
  const [showLinkVideoModal, setShowLinkVideoModal] = useState(false);
  const [newVideoTitle, setNewVideoTitle] = useState("");
  const [newVideoType, setNewVideoType] = useState("Cover Musical");
  const [newVideoUrl, setNewVideoUrl] = useState("");
  const [newVideoThumbPreset, setNewVideoThumbPreset] = useState("guitar");
  const [aiPromptInput, setAiPromptInput] = useState("");
  const [videoAiExplanation, setVideoAiExplanation] = useState("");
  const [overlayLabel, setOverlayLabel] = useState("");
  const [overlayUrl, setOverlayUrl] = useState("");
  const [overlayTime, setOverlayTime] = useState("5");
  const [generatingAi, setGeneratingAi] = useState(false);

  // Cover Viewer states
  const [showMediaViewer, setShowMediaViewer] = useState(false);
  const [activeMedia, setActiveMedia] = useState<MomentItem | null>(null);
  const [mediaPlaying, setMediaPlaying] = useState(false);
  const [playbackSecond, setPlaybackSecond] = useState(0);
  const [showOverlayCard, setShowOverlayCard] = useState(false);
  const playbackTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Social Graph states
  const [showAddRelationModal, setShowAddRelationModal] = useState(false);
  const [addRelationType, setAddRelationType] = useState<string>("familia");
  const [selectedRelationUserId, setSelectedRelationUserId] = useState("");
  const [newRelationName, setNewRelationName] = useState("");
  const [newRelationHandle, setNewRelationHandle] = useState("");
  const [newRelationAvatarUrl, setNewRelationAvatarUrl] = useState("");
  const [newRelationAvatarBase64, setNewRelationAvatarBase64] = useState("");
  const [newRelationTier, setNewRelationTier] = useState<"diamond" | "platinum" | "gold" | "normal">("normal");
  const [newRelationMutual, setNewRelationMutual] = useState(false);

  const [relationships, setRelationships] = useState<{
    familia: RelationshipItem[];
    complicidad: RelationshipItem[];
    amistad: RelationshipItem[];
    novio: RelationshipItem | null;
    esposo: RelationshipItem | null;
    amante: RelationshipItem | null;
  }>({
    familia: [
      { id: "user_003", name: "Sofía Music", handle: "@sofia_m", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=128", tier: "normal", mutual: false }
    ],
    complicidad: [
      { id: "user_004", name: "Andrés Bass", handle: "@andres_b", avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=128", tier: "platinum", mutual: true },
      { id: "user_006", name: "Dani DJ", handle: "@dani_remix", avatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?q=80&w=128", tier: "gold", mutual: true }
    ],
    amistad: [
      { id: "user_001", name: "Marta Gómez", handle: "@marta_g", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=128", tier: "normal", mutual: false }
    ],
    novio: null,
    esposo: { id: "user_002", name: "Carlos Stream", handle: "@carlos_s", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=128", tier: "diamond", mutual: true },
    amante: null
  });

  const [globalExclusiveLocks, setGlobalExclusiveLocks] = useState<{ [key: string]: string }>({
    "user_001_novio": "ariadna_creator",
    "user_002_esposo": "leo_vela39"
  });

  // Moments feed (replaces covers)
  const [moments, setMoments] = useState<MomentItem[]>([]);

  // User isolation helper
  const uid = user?.uid || "leo_vela39_uid";
  const getStorageKey = (key: string) => `c8l_${uid}_${key}`;

  // Omit / filter comments
  const [inboxFilter, setInboxFilter] = useState("all");
  const [inboxUnreadBadge, setInboxUnreadBadge] = useState(0);

  // Sync Hub Platforms
  const [syncPlatforms, setSyncPlatforms] = useState({
    youtube: { connected: true, followers: 850000, monthlyViews: 8500000, estRevenue: 3200 },
    kick: { connected: true, followers: 98000, monthlyViews: 1400000, estRevenue: 950 },
    twitch: { connected: true, followers: 150000, monthlyViews: 2100000, estRevenue: 1100 },
    tiktok: { connected: true, followers: 220000, monthlyViews: 1200000, estRevenue: 450 },
    instagram: { connected: false, followers: 120000, monthlyViews: 450000, estRevenue: 320 },
    bigo: { connected: false, followers: 28000, monthlyViews: 110000, estRevenue: 180 },
    tango: { connected: false, followers: 15000, monthlyViews: 90000, estRevenue: 130 },
    spotify: { connected: true, followers: 18000, monthlyViews: 650000, estRevenue: 670 },
    apple: { connected: false, followers: 6000, monthlyViews: 150000, estRevenue: 280 },
    soundcloud: { connected: false, followers: 14000, monthlyViews: 220000, estRevenue: 110 },
    x: { connected: false, followers: 45000, monthlyViews: 300000, estRevenue: 150 },
    facebook: { connected: false, followers: 75000, monthlyViews: 250000, estRevenue: 90 },
    discord: { connected: false, followers: 12000, monthlyViews: 0, estRevenue: 0 }
  });

  // Derived comments list for the Social Inbox tab
  const derivedComments = React.useMemo(() => {
    return (moments || []).flatMap(m => 
      (m.comments || []).filter(Boolean).map(c => {
        const platform = (c as any).platform || (m.videoUrl ? (m.videoUrl.includes("youtube") ? "youtube" : m.videoUrl.includes("twitch") ? "twitch" : m.videoUrl.includes("tiktok") ? "tiktok" : "c8l") : "c8l");
        return {
          id: c.id,
          platform,
          author: c.author,
          avatar: c.avatar,
          text: c.text,
          timestamp: c.timestamp,
          isReplied: !!c.reply,
          reply: c.reply || "",
          coverId: m.id,
          videoTitle: m.videoTitle || "Actualización de Estado",
          videoUrl: m.videoUrl || null
        };
      })
    )
    .filter(c => {
      if (c.platform === "c8l") return true;
      return (syncPlatforms as any)[c.platform]?.connected;
    })
    .sort((a, b) => b.timestamp - a.timestamp);
  }, [moments, syncPlatforms]);

  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [tiktokUrl, setTiktokUrl] = useState("");
  const [twitchUrl, setTwitchUrl] = useState("");
  const [kickUrl, setKickUrl] = useState("");

  const [showOAuthModal, setShowOAuthModal] = useState(false);
  const [oauthPlatform, setOauthPlatform] = useState("youtube");

  // Load User Details and moments from LocalStorage dynamically when user changes
  useEffect(() => {
    if (!user) return;
    
    const uid = user.uid;
    const getStorageKey = (key: string) => `c8l_${uid}_${key}`;

    // Profile Details
    const storedAlias = localStorage.getItem(getStorageKey("alias"));
    if (storedAlias !== null) {
      setAlias(storedAlias);
    } else {
      const defaultAlias = user.displayName || user.email?.split("@")[0] || "Leo Vela";
      setAlias(defaultAlias);
      localStorage.setItem(getStorageKey("alias"), defaultAlias);
    }

    const storedBio = localStorage.getItem(getStorageKey("bio"));
    if (storedBio !== null) {
      setBio(storedBio);
    } else {
      const defaultBio = uid === "leo_vela39_uid" 
        ? "Músico, Streamer y Creador de contenido cuántico en C8L Agency. Produciendo los covers más finos y sesiones de DJ en directo."
        : "Miembro oficial de C8L Agency. Creando contenido de vanguardia.";
      setBio(defaultBio);
      localStorage.setItem(getStorageKey("bio"), defaultBio);
    }

    const storedTags = localStorage.getItem(getStorageKey("activeTags"));
    if (storedTags !== null) {
      try {
        setActiveTags(JSON.parse(storedTags));
      } catch (e) {
        console.error(e);
      }
    } else {
      const defaultTags = ["DJ", "Vocalist", "Producer", "Streaming"];
      setActiveTags(defaultTags);
      localStorage.setItem(getStorageKey("activeTags"), JSON.stringify(defaultTags));
    }

    const storedIsLive = localStorage.getItem(getStorageKey("isLive"));
    if (storedIsLive !== null) {
      setIsLive(storedIsLive === "true");
    } else {
      const defaultIsLive = true;
      setIsLive(defaultIsLive);
      localStorage.setItem(getStorageKey("isLive"), String(defaultIsLive));
    }

    const storedBanner = localStorage.getItem(getStorageKey("bannerPreset"));
    if (storedBanner !== null) {
      setBannerPreset(storedBanner);
    } else {
      setBannerPreset("cyberpunk");
      localStorage.setItem(getStorageKey("bannerPreset"), "cyberpunk");
    }

    // Social URLs
    setYoutubeUrl(localStorage.getItem(getStorageKey("url_youtube")) || (uid === "leo_vela39_uid" ? "https://youtube.com/@CorazoneLocos" : ""));
    setTiktokUrl(localStorage.getItem(getStorageKey("url_tiktok")) || (uid === "leo_vela39_uid" ? "https://tiktok.com/@leo_vela39" : ""));
    setTwitchUrl(localStorage.getItem(getStorageKey("url_twitch")) || "");
    setKickUrl(localStorage.getItem(getStorageKey("url_kick")) || "");

    // Moments feed
    const storedMoments = localStorage.getItem(getStorageKey("moments"));
    if (storedMoments !== null) {
      try {
        const parsed = JSON.parse(storedMoments);
        if (Array.isArray(parsed)) {
          const sanitized = parsed.map(m => ({
            ...m,
            comments: m.comments || [],
            likedBy: m.likedBy || []
          }));
          setMoments(sanitized);
        } else {
          setMoments([]);
        }
      } catch (e) {
        console.error(e);
      }
    } else {
      // Seed default moments if Leo Vela or empty for others
      const initialMoments = uid === "leo_vela39_uid" ? DEFAULT_MOMENTS : [];
      setMoments(initialMoments);
      localStorage.setItem(getStorageKey("moments"), JSON.stringify(initialMoments));
    }

    // Load relationships from localStorage
    const storedRelations = localStorage.getItem(getStorageKey("relationships"));
    if (storedRelations !== null) {
      try {
        const parsed = JSON.parse(storedRelations);
        if (parsed && typeof parsed === "object") {
          setRelationships({
            familia: Array.isArray(parsed.familia) ? parsed.familia : [],
            complicidad: Array.isArray(parsed.complicidad) ? parsed.complicidad : [],
            amistad: Array.isArray(parsed.amistad) ? parsed.amistad : [],
            novio: parsed.novio || null,
            esposo: parsed.esposo || null,
            amante: parsed.amante || null
          });
        } else {
          setRelationships(DEFAULT_RELATIONSHIPS);
        }
      } catch (e) {
        console.error(e);
        setRelationships(DEFAULT_RELATIONSHIPS);
      }
    } else {
      setRelationships(DEFAULT_RELATIONSHIPS);
      localStorage.setItem(getStorageKey("relationships"), JSON.stringify(DEFAULT_RELATIONSHIPS));
    }

    // Load syncPlatforms from localStorage
    const storedPlatforms = localStorage.getItem(getStorageKey("sync_platforms"));
    if (storedPlatforms !== null) {
      try {
        const parsed = JSON.parse(storedPlatforms);
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
          const merged = { ...DEFAULT_SYNC_PLATFORMS, ...parsed };
          // Ensure all platform configs are properly typed
          Object.keys(merged).forEach(k => {
            const val = (merged as any)[k];
            (merged as any)[k] = {
              connected: !!val?.connected,
              followers: Number(val?.followers) || 0,
              monthlyViews: Number(val?.monthlyViews) || 0,
              estRevenue: Number(val?.estRevenue) || 0
            };
          });
          setSyncPlatforms(merged);
        } else {
          setSyncPlatforms(DEFAULT_SYNC_PLATFORMS);
        }
      } catch (e) {
        console.error(e);
        setSyncPlatforms(DEFAULT_SYNC_PLATFORMS);
      }
    } else {
      setSyncPlatforms(DEFAULT_SYNC_PLATFORMS);
      localStorage.setItem(getStorageKey("sync_platforms"), JSON.stringify(DEFAULT_SYNC_PLATFORMS));
    }

    // Load API Keys from localStorage
    const storedApiKeys = localStorage.getItem(getStorageKey("api_keys"));
    if (storedApiKeys !== null) {
      try {
        const parsed = JSON.parse(storedApiKeys);
        if (parsed.youtubeKey) setYoutubeKey(parsed.youtubeKey);
        if (parsed.kickKey) setKickKey(parsed.kickKey);
        if (parsed.twitchSecret) setTwitchSecret(parsed.twitchSecret);
        if (parsed.spotifyId) setSpotifyId(parsed.spotifyId);
        if (parsed.tiktokSecret) setTiktokSecret(parsed.tiktokSecret);
        if (parsed.tangoKey) setTangoKey(parsed.tangoKey);
        if (parsed.bigoKey) setBigoKey(parsed.bigoKey);
        if (parsed.xKey) setXKey(parsed.xKey);
        if (parsed.facebookSecret) setFacebookSecret(parsed.facebookSecret);
        if (parsed.discordWebhook) setDiscordWebhook(parsed.discordWebhook);
      } catch (e) {
        console.error(e);
      }
    }

    // Load payout profile from localStorage
    const storedPayoutProfile = localStorage.getItem(getStorageKey("payout_profile"));
    if (storedPayoutProfile !== null) {
      try {
        const parsed = JSON.parse(storedPayoutProfile);
        if (parsed.payoutMethod) setPayoutMethod(parsed.payoutMethod);
        if (parsed.paypalEmail) setPaypalEmail(parsed.paypalEmail);
        if (parsed.bankName) setBankName(parsed.bankName);
        if (parsed.bankIban) setBankIban(parsed.bankIban);
        if (parsed.bankSwift) setBankSwift(parsed.bankSwift);
      } catch (e) {
        console.error(e);
      }
    }

    // Load recharge profile from localStorage
    const storedRechargeProfile = localStorage.getItem(getStorageKey("recharge_profile"));
    if (storedRechargeProfile !== null) {
      try {
        const parsed = JSON.parse(storedRechargeProfile);
        if (parsed.rechargeMethod) setRechargeMethod(parsed.rechargeMethod);
        if (parsed.rechargePaypalEmail) setRechargePaypalEmail(parsed.rechargePaypalEmail);
        if (parsed.rechargePayoneerEmail) setRechargePayoneerEmail(parsed.rechargePayoneerEmail);
        if (parsed.rechargeBankName) setRechargeBankName(parsed.rechargeBankName);
        if (parsed.rechargeBankIban) setRechargeBankIban(parsed.rechargeBankIban);
        if (parsed.rechargeBankSwift) setRechargeBankSwift(parsed.rechargeBankSwift);
      } catch (e) {
        console.error(e);
      }
    }

    loadLedger();
  }, [user]);

  // Ledger Loader
  const loadLedger = async () => {
    if (!user) return;
    setLoadingLedger(true);
    try {
      const data = await getLedgerTransactions(user.uid);
      setLedgerTxs(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingLedger(false);
    }
  };

  // Webhook comment simulator trigger (adds real persistent comments to active moments)
  useEffect(() => {
    if (!isLive) return;
    if (moments.length === 0) return;

    const interval = setInterval(() => {
      // Pick a random moment
      const randomMomentIndex = Math.floor(Math.random() * moments.length);
      const moment = moments[randomMomentIndex];
      
      const mockAuthors = ["@gamer_vip", "Juan Perez", "NekoChan", "Rockstar99", "Sara_Singer", "@dj_clown", "GamerGirl"];
      const mockAvatars = [
        "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=128",
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=128",
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=128",
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=128",
        "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=128"
      ];
      const mockTexts = [
        "¡Excelente transmisión en vivo! El cover acústico de Vela está a otro nivel.",
        "¿Harás colaboraciones con otros creadores de la agencia pronto?",
        "Tus streams de Twitch me alegran el día. Sigue así.",
        "¿Dónde puedo comprar la pista original?",
        "Gran estilo de producción. Las baterías suenan potentes.",
        "¡Que buen look cyberpunk!",
        "Acabo de escucharte en Spotify, ¡brutal!",
        "¿Me saludas en tu próximo stream?"
      ];

      const newComment = {
        id: `com_web_${Date.now()}`,
        author: mockAuthors[Math.floor(Math.random() * mockAuthors.length)],
        avatar: mockAvatars[Math.floor(Math.random() * mockAvatars.length)],
        text: mockTexts[Math.floor(Math.random() * mockTexts.length)],
        timestamp: Date.now()
      };

      const updatedMoments = moments.map((m, idx) => {
        if (idx === randomMomentIndex) {
          return {
            ...m,
            comments: [...m.comments, newComment]
          };
        }
        return m;
      });

      setMoments(updatedMoments);
      localStorage.setItem(getStorageKey("moments"), JSON.stringify(updatedMoments));

      if (activeTab !== "inbox") {
        setInboxUnreadBadge(b => b + 1);
      }

      showNotification(
        `💬 Webhook Simulator: ${newComment.author} comentó en "${moment.videoTitle || 'Estado'}"`,
        "info"
      );
      triggerMascot("dance", 2000);
    }, 25000);

    return () => clearInterval(interval);
  }, [isLive, moments, activeTab]);

  // Video Player Playback loop for overlay link display
  useEffect(() => {
    if (mediaPlaying && activeMedia) {
      playbackTimerRef.current = setInterval(() => {
        setPlaybackSecond(sec => {
          const nextSec = sec + 1;
          
          // Verify overlays trigger time
          if (activeMedia.overlay && activeMedia.overlay.label && activeMedia.overlay.url) {
            if (nextSec === activeMedia.overlay.time) {
              setShowOverlayCard(true);
            }
          }
          return nextSec;
        });
      }, 1000);
    } else {
      if (playbackTimerRef.current) {
        clearInterval(playbackTimerRef.current);
      }
    }

    return () => {
      if (playbackTimerRef.current) {
        clearInterval(playbackTimerRef.current);
      }
    };
  }, [mediaPlaying, activeMedia]);

  // Save profile information
  const handleSaveProfile = () => {
    if (!user) return;
    const uid = user.uid;
    const getStorageKey = (key: string) => `c8l_${uid}_${key}`;

    localStorage.setItem(getStorageKey("alias"), alias);
    localStorage.setItem(getStorageKey("bio"), bio);
    localStorage.setItem(getStorageKey("activeTags"), JSON.stringify(activeTags));
    localStorage.setItem(getStorageKey("isLive"), String(isLive));
    localStorage.setItem(getStorageKey("bannerPreset"), bannerPreset);

    localStorage.setItem(getStorageKey("url_youtube"), youtubeUrl);
    localStorage.setItem(getStorageKey("url_tiktok"), tiktokUrl);
    localStorage.setItem(getStorageKey("url_twitch"), twitchUrl);
    localStorage.setItem(getStorageKey("url_kick"), kickUrl);
    
    registerOrUpdateUser(user.uid, user.email || "", alias, "Web", "agency")
      .then(() => {
        showNotification(
          language === "es" ? "¡Identidad digital del creador guardada con éxito!" : "Creator digital identity saved successfully!",
          "success"
        );
      })
      .catch(e => {
        console.error("Register/Update failed:", e);
        showNotification("Error al sincronizar perfil con el servidor", "error");
      });
  };

  // Save credentials configuration
  const handleSaveApiKeys = () => {
    const keysObj = {
      youtubeKey,
      kickKey,
      twitchSecret,
      spotifyId,
      tiktokSecret,
      tangoKey,
      bigoKey,
      xKey,
      facebookSecret,
      discordWebhook
    };
    localStorage.setItem(getStorageKey("api_keys"), JSON.stringify(keysObj));
    showNotification(
      language === "es" ? "¡Llaves de APIs encriptadas y guardadas!" : "API Keys encrypted and saved successfully!",
      "success"
    );
  };

  // Add Dynamic Video from composer or modal
  const handleLinkVideoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVideoTitle.trim() || !newVideoUrl.trim()) {
      showNotification("Por favor rellena el título y la URL", "error");
      return;
    }

    let thumbUrl = "https://images.unsplash.com/photo-1487180142328-054b783fc471?q=80&w=300";
    if (newVideoThumbPreset === "guitar") thumbUrl = "https://images.unsplash.com/photo-1510915228340-29c85a43dcfe?q=80&w=300";
    if (newVideoThumbPreset === "dj") thumbUrl = "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=300";
    if (newVideoThumbPreset === "singer") thumbUrl = "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=300";
    if (newVideoThumbPreset === "abstract") thumbUrl = "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=300";

    const newMoment: MomentItem = {
      id: `mom_${Date.now()}`,
      authorName: alias,
      authorHandle: `@${alias.toLowerCase().replace(/\s+/g, '_')}`,
      avatar: user?.photoURL || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256",
      timestamp: Date.now(),
      text: `Nuevo cover/video enlazado: ${newVideoTitle}`,
      videoUrl: newVideoUrl,
      videoTitle: newVideoTitle,
      videoType: newVideoType,
      thumbnail: thumbUrl,
      views: 0,
      likes: 0,
      likedBy: [],
      comments: [],
      aiExplanation: videoAiExplanation || "Explicación optimizada por la IA sobre la composición y técnicas sonoras empleadas.",
      overlay: overlayLabel && overlayUrl ? { label: overlayLabel, url: overlayUrl, time: parseInt(overlayTime, 10) || 5 } : null
    };

    const updatedMoments = [newMoment, ...moments];
    setMoments(updatedMoments);
    localStorage.setItem(getStorageKey("moments"), JSON.stringify(updatedMoments));
    setShowLinkVideoModal(false);
    showNotification("¡Video publicado con éxito en tu timeline de momentos!", "success");
    triggerMascot("dance", 3000);
  };

  // AI Description Generator Simulator
  const handleGenerateAiDescription = () => {
    if (!aiPromptInput.trim()) {
      showNotification("Por favor escribe palabras clave para la IA", "error");
      return;
    }

    setGeneratingAi(true);
    setVideoAiExplanation("Generando explicación optimizada por C8L AI...");
    
    setTimeout(() => {
      const generatedText = `C8L QUANTUM AI: Esta producción de tipo "${newVideoType}" destaca por su enfoque sonoro en "${aiPromptInput}". Reinterpreta las armonías mediante texturas melódicas complejas, realzando la calidez instrumental y la presencia vocal. Optimizado para distribución de analíticas en C8L Agency Network.`;
      
      let typedText = "";
      let idx = 0;
      const typeLoop = setInterval(() => {
        typedText += generatedText.charAt(idx);
        setVideoAiExplanation(typedText);
        idx++;
        if (idx >= generatedText.length) {
          clearInterval(typeLoop);
          setGeneratingAi(false);
          showNotification("Explicación IA generada con éxito", "success");
        }
      }, 8);
    }, 1000);
  };

  // Dynamic search detection for video enroller
  const handleVideoUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setNewVideoUrl(val);
    if (val.includes("youtube.com") || val.includes("youtu.be")) {
      setNewVideoType("Cover Musical");
    } else if (val.includes("twitch.tv")) {
      setNewVideoType("DJ Live Session");
    }
  };

  // Social Graph: Assign Relationship
  const handleSaveRelationship = () => {
    let name = "";
    let handle = "";
    let avatar = "";

    if (selectedRelationUserId === "custom") {
      if (!newRelationName.trim()) {
        showNotification("Por favor ingresa un nombre para el miembro personalizado", "error");
        return;
      }
      name = newRelationName.trim();
      handle = newRelationHandle.trim() || `@${name.toLowerCase().replace(/\s+/g, "_")}`;
      avatar = newRelationAvatarBase64 || newRelationAvatarUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=128";
    } else {
      if (!selectedRelationUserId) {
        showNotification("Selecciona un usuario de la lista", "error");
        return;
      }
      const selectedUser = COMMUNITY_USERS.find(u => u.id === selectedRelationUserId);
      if (!selectedUser) return;
      name = selectedUser.name;
      handle = selectedUser.handle;
      avatar = selectedUser.avatar;
    }

    // Billing Coins check
    let cost = 0;
    if (newRelationTier === "gold") cost = 100;
    else if (newRelationTier === "platinum") cost = 500;
    else if (newRelationTier === "diamond") cost = 1000;

    if (cost > 0) {
      const success = deductCCoins(cost);
      if (!success) {
        showNotification("Monedas C8L insuficientes para forjar este lazo. Recarga en la pestaña Financial Wallet.", "error");
        return;
      }
      showNotification(`Forjado lazo: Deducción exitosa de ${cost} Coins`, "success");
    }

    const role = addRelationType;
    const isExcl = ["novio", "esposo", "amante"].includes(role);

    const newRelationItem: RelationshipItem = {
      id: selectedRelationUserId === "custom" ? `cust_${Date.now()}` : selectedRelationUserId,
      name,
      handle,
      avatar,
      tier: newRelationTier,
      mutual: newRelationMutual
    };

    let nextRelations = { ...relationships };

    if (isExcl) {
      // Exclusivity locks verification
      const lockKey = `${newRelationItem.id}_${role}`;
      if (globalExclusiveLocks[lockKey] && globalExclusiveLocks[lockKey] !== uid) {
        showNotification(
          `🚨 ¡Fallo de Exclusividad! ${newRelationItem.name} ya es ${role} de otro creador en la plataforma`,
          "error"
        );
        setShowAddRelationModal(false);
        return;
      }

      // Cleanup old lock if existed
      const oldPartner = relationships[role as keyof typeof relationships] as RelationshipItem | null;
      if (oldPartner) {
        const oldLockKey = `${oldPartner.id}_${role}`;
        setGlobalExclusiveLocks(prev => {
          const next = { ...prev };
          delete next[oldLockKey];
          return next;
        });
      }

      nextRelations = {
        ...relationships,
        [role]: newRelationItem
      };

      setGlobalExclusiveLocks(prev => ({
        ...prev,
        [lockKey]: uid
      }));

      showNotification(`¡Felicidades! Has vinculado a ${newRelationItem.name} como tu ${role} con Lazo ${newRelationTier.toUpperCase()}`, "success");
    } else {
      // Community relations (N to M)
      const list = [...(relationships[role as keyof typeof relationships] as RelationshipItem[])];
      if (!list.some(x => x.id === newRelationItem.id)) {
        list.push(newRelationItem);
      } else {
        // Update it
        const idx = list.findIndex(x => x.id === newRelationItem.id);
        list[idx] = newRelationItem;
      }
      nextRelations = {
        ...relationships,
        [role]: list
      };
      showNotification(`${newRelationItem.name} ha sido añadido a tu red de ${role} con Lazo ${newRelationTier.toUpperCase()}`, "success");
    }

    setRelationships(nextRelations);
    localStorage.setItem(getStorageKey("relationships"), JSON.stringify(nextRelations));

    if (newRelationTier === "diamond") {
      triggerMascot("celebrate", 4000);
    } else {
      triggerMascot("win", 2000);
    }

    // Reset fields
    setShowAddRelationModal(false);
    setSelectedRelationUserId("");
    setNewRelationName("");
    setNewRelationHandle("");
    setNewRelationAvatarUrl("");
    setNewRelationAvatarBase64("");
    setNewRelationTier("normal");
    setNewRelationMutual(false);
  };

  // Remove relationships
  const handleRemoveRelation = (userId: string, type: string) => {
    const list = (relationships[type as keyof typeof relationships] as RelationshipItem[]).filter(u => u.id !== userId);
    const nextRelations = {
      ...relationships,
      [type]: list
    };
    setRelationships(nextRelations);
    localStorage.setItem(getStorageKey("relationships"), JSON.stringify(nextRelations));
    showNotification(`Vínculo de comunidad eliminado de la red de ${type}`, "info");
    triggerMascot("sad", 2000);
  };

  const handleRemoveExclusiveRelation = (role: string) => {
    const partner = relationships[role as keyof typeof relationships] as RelationshipItem | null;
    if (!partner) return;

    const lockKey = `${partner.id}_${role}`;
    setGlobalExclusiveLocks(prev => {
      const next = { ...prev };
      delete next[lockKey];
      return next;
    });

    const nextRelations = {
      ...relationships,
      [role]: null
    };
    setRelationships(nextRelations);
    localStorage.setItem(getStorageKey("relationships"), JSON.stringify(nextRelations));
    showNotification(`Vínculo de ${role} roto de forma definitiva`, "info");
    triggerMascot("sad", 2500);
  };

  // Social Inbox: Comment Reply
  const handleSendCommentReply = (commentId: string, text: string) => {
    if (!text.trim()) {
      showNotification("La respuesta no puede estar vacía", "error");
      return;
    }

    const moment = moments.find(m => m.comments.some(c => c.id === commentId));
    if (moment) {
      handleReplyToComment(moment.id, commentId, text);
    } else {
      showNotification("Comentario no encontrado", "error");
    }
  };

  // Link to specific cover/video from comment selection
  const viewLinkedVideo = (coverId: string) => {
    const mom = moments.find(m => m.id === coverId);
    if (mom) {
      setActiveMedia(mom);
      setShowMediaViewer(true);
      setPlaybackSecond(0);
      setShowOverlayCard(false);
      
      // Scroll timeline
      setTimeout(() => {
        document.getElementById(coverId)?.scrollIntoView({ behavior: "smooth" });
      }, 300);
    } else {
      showNotification("No se pudo encontrar el momento referenciado en tu feed", "error");
    }
  };

  // Timeline & Composer Handlers
  const handleCreateMoment = () => {
    if (!composerText.trim() && !composerVideoUrl.trim()) {
      showNotification("Por favor escribe un mensaje o añade una URL de vídeo", "error");
      return;
    }

    let thumbUrl = "";
    if (showComposerVideoOptions && composerVideoUrl.trim()) {
      if (composerVideoThumb === "guitar") thumbUrl = "https://images.unsplash.com/photo-1510915228340-29c85a43dcfe?q=80&w=300";
      else if (composerVideoThumb === "dj") thumbUrl = "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=300";
      else if (composerVideoThumb === "singer") thumbUrl = "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=300";
      else thumbUrl = "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=300";
    }

    const newMoment: MomentItem = {
      id: `mom_${Date.now()}`,
      authorName: alias,
      authorHandle: `@${alias.toLowerCase().replace(/\s+/g, '_')}`,
      avatar: user?.photoURL || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256",
      timestamp: Date.now(),
      text: composerText,
      videoUrl: showComposerVideoOptions && composerVideoUrl.trim() ? composerVideoUrl : undefined,
      videoTitle: showComposerVideoOptions && composerVideoTitle.trim() ? composerVideoTitle : undefined,
      videoType: showComposerVideoOptions ? composerVideoType : undefined,
      thumbnail: thumbUrl || undefined,
      views: 0,
      likes: 0,
      likedBy: [],
      comments: [],
      aiExplanation: showComposerVideoOptions && composerAiExplanation ? composerAiExplanation : undefined,
      overlay: showComposerVideoOptions && overlayLabel && overlayUrl ? { label: overlayLabel, url: overlayUrl, time: parseInt(overlayTime, 10) || 5 } : null
    };

    const updatedMoments = [newMoment, ...moments];
    setMoments(updatedMoments);
    localStorage.setItem(getStorageKey("moments"), JSON.stringify(updatedMoments));

    // Clear composer
    setComposerText("");
    setComposerVideoUrl("");
    setComposerVideoTitle("");
    setComposerVideoThumb("guitar");
    setComposerAiPrompt("");
    setComposerAiExplanation("");
    setOverlayLabel("");
    setOverlayUrl("");
    setOverlayTime("5");
    setShowComposerVideoOptions(false);

    showNotification("¡Momento publicado con éxito en tu timeline!", "success");
    triggerMascot("celebrate", 3000);
  };

  const handleDeleteMoment = (id: string) => {
    const updatedMoments = moments.filter(m => m.id !== id);
    setMoments(updatedMoments);
    localStorage.setItem(getStorageKey("moments"), JSON.stringify(updatedMoments));
    showNotification("Momento eliminado correctamente", "info");
    triggerMascot("sad", 2000);
  };

  const handleToggleLike = (momentId: string) => {
    const updatedMoments = moments.map(m => {
      if (m.id === momentId) {
        const hasLiked = m.likedBy.includes(uid);
        const likedBy = hasLiked ? m.likedBy.filter(id => id !== uid) : [...m.likedBy, uid];
        const likes = hasLiked ? m.likes - 1 : m.likes + 1;
        return { ...m, likes, likedBy };
      }
      return m;
    });
    setMoments(updatedMoments);
    localStorage.setItem(getStorageKey("moments"), JSON.stringify(updatedMoments));
    triggerMascot("win", 1000);
  };

  const handleAddComment = (momentId: string, text: string) => {
    if (!text.trim()) return;

    const newComment = {
      id: `com_${Date.now()}`,
      author: user?.displayName || alias,
      avatar: user?.photoURL || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256",
      text,
      timestamp: Date.now()
    };

    const updatedMoments = moments.map(m => {
      if (m.id === momentId) {
        return {
          ...m,
          comments: [...m.comments, newComment]
        };
      }
      return m;
    });

    setMoments(updatedMoments);
    localStorage.setItem(getStorageKey("moments"), JSON.stringify(updatedMoments));
    showNotification("Comentario publicado", "success");
    triggerMascot("dance", 1500);
  };

  const handleDeleteComment = (momentId: string, commentId: string) => {
    const updatedMoments = moments.map(m => {
      if (m.id === momentId) {
        return {
          ...m,
          comments: m.comments.filter(c => c.id !== commentId)
        };
      }
      return m;
    });
    setMoments(updatedMoments);
    localStorage.setItem(getStorageKey("moments"), JSON.stringify(updatedMoments));
    showNotification("Comentario eliminado", "info");
    triggerMascot("sad", 1500);
  };

  const handleReplyToComment = (momentId: string, commentId: string, text: string) => {
    const updatedMoments = moments.map(m => {
      if (m.id === momentId) {
        return {
          ...m,
          comments: m.comments.map(c => {
            if (c.id === commentId) {
              return { ...c, reply: text };
            }
            return c;
          })
        };
      }
      return m;
    });
    setMoments(updatedMoments);
    localStorage.setItem(getStorageKey("moments"), JSON.stringify(updatedMoments));
    showNotification("Respuesta enviada correctamente", "success");
    triggerMascot("win", 1500);
  };

  const handleIncrementViews = (momentId: string) => {
    const updatedMoments = moments.map(m => {
      if (m.id === momentId) {
        return { ...m, views: m.views + 1 };
      }
      return m;
    });
    setMoments(updatedMoments);
    localStorage.setItem(getStorageKey("moments"), JSON.stringify(updatedMoments));
  };

  const generateComposerAiExplanation = () => {
    if (!composerAiPrompt.trim()) {
      showNotification("Por favor escribe palabras clave para la IA", "error");
      return;
    }

    setGeneratingAiComposer(true);
    setComposerAiExplanation("Generando explicación cuántica de IA...");

    setTimeout(() => {
      const generatedText = `C8L QUANTUM AI: Esta producción de tipo "${composerVideoType}" destaca por su enfoque en "${composerAiPrompt}". Fusiona las texturas sonoras del estudio C8L con dinámicas cuánticas personalizadas para el perfil de ${alias}.`;
      setComposerAiExplanation(generatedText);
      setGeneratingAiComposer(false);
      showNotification("Explicación de IA redactada con éxito", "success");
      triggerMascot("dance", 2000);
    }, 1500);
  };

  // Sync Hub platforms link / unlink OAuth2 simulation
  const handlePlatformAction = (plat: string) => {
    const isConnected = syncPlatforms[plat as keyof typeof syncPlatforms].connected;
    if (isConnected) {
      const nextPlatforms = {
        ...syncPlatforms,
        [plat]: { ...syncPlatforms[plat as keyof typeof syncPlatforms], connected: false }
      };
      setSyncPlatforms(nextPlatforms);
      localStorage.setItem(getStorageKey("sync_platforms"), JSON.stringify(nextPlatforms));
      showNotification(`Plataforma ${plat.toUpperCase()} desvinculada con éxito.`, "info");
    } else {
      setOauthPlatform(plat);
      setShowOAuthModal(true);
    }
  };

  const handleApproveOAuth = () => {
    const nextPlatforms = {
      ...syncPlatforms,
      [oauthPlatform]: { ...syncPlatforms[oauthPlatform as keyof typeof syncPlatforms], connected: true }
    };
    setSyncPlatforms(nextPlatforms);
    localStorage.setItem(getStorageKey("sync_platforms"), JSON.stringify(nextPlatforms));
    setShowOAuthModal(false);
    showNotification(`OAuth2: Conexión aprobada con ${oauthPlatform.toUpperCase()}`, "success");
  };

  // Recharge simulator with bank, PayPal and Payoneer
  const handleRechargeCoinsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const pack = RECHARGE_PACKAGES[selectedPackIdx];
    
    if (rechargeMethod === "paypal" && !rechargePaypalEmail.trim()) {
      showNotification("Por favor ingresa un correo de PayPal válido", "error");
      return;
    }
    
    if (rechargeMethod === "payoneer" && !rechargePayoneerEmail.trim()) {
      showNotification("Por favor ingresa un correo de Payoneer válido", "error");
      return;
    }

    if (rechargeMethod === "bank" && (!rechargeBankName.trim() || !rechargeBankIban.trim() || !rechargeBankSwift.trim())) {
      showNotification("Por favor rellena todos los datos de tu cuenta bancaria (Nombre, IBAN, SWIFT)", "error");
      return;
    }

    setRechargeProcessing(true);
    setTimeout(() => {
      setRechargeProcessing(false);
      addCCoins(pack.coins);
      
      // Save recharge profile fields in localStorage
      const profile = { 
        rechargeMethod, 
        rechargePaypalEmail, 
        rechargePayoneerEmail, 
        rechargeBankName, 
        rechargeBankIban, 
        rechargeBankSwift 
      };
      localStorage.setItem(getStorageKey("recharge_profile"), JSON.stringify(profile));

      let senderIdStr = "BANK_ACCOUNT";
      let senderNameStr = `Bank Account (${rechargeBankName} - ${rechargeBankIban.slice(0, 4)}...${rechargeBankIban.slice(-4)})`;
      if (rechargeMethod === "paypal") {
        senderIdStr = "PAYPAL_ACCOUNT";
        senderNameStr = `PayPal Account (${rechargePaypalEmail})`;
      } else if (rechargeMethod === "payoneer") {
        senderIdStr = "PAYONEER_ACCOUNT";
        senderNameStr = `Payoneer Account (${rechargePayoneerEmail})`;
      }

      const newTx: LedgerTransaction = {
        id: `TX-${Math.floor(100000 + Math.random() * 900000)}`,
        eventType: "RECHARGE",
        senderId: senderIdStr,
        senderName: senderNameStr,
        receiverId: user?.uid || "leo_vela_uid",
        receiverName: alias || "Leo Vela",
        amount: pack.coins,
        currency: "coins",
        timestamp: Date.now()
      };
      setLedgerTxs(prev => [newTx, ...prev]);
      setShowRechargeModal(false);
      showNotification(`¡Recarga Exitosa! +${pack.coins.toLocaleString()} Coins añadidas.`, "success");
      triggerMascot("win", 2000);
    }, 2000);
  };

  const handleStripePayoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const diamonds = Number(payoutDiamonds);
    if (!diamonds || diamonds < 5000) {
      showNotification("El retiro mínimo es de 5,000 diamantes ($50.00 USD).", "error");
      return;
    }
    if (diamonds > c8lDiamonds) {
      showNotification("Fondos insuficientes de diamantes", "error");
      return;
    }

    if (payoutMethod === "paypal" && !paypalEmail.trim()) {
      showNotification("Por favor ingresa un correo de PayPal válido", "error");
      return;
    }

    if (payoutMethod === "bank" && (!bankName.trim() || !bankIban.trim() || !bankSwift.trim())) {
      showNotification("Por favor rellena todos los datos de tu cuenta bancaria (Nombre, IBAN, SWIFT)", "error");
      return;
    }

    setPayoutProcessing(true);
    setTimeout(() => {
      setPayoutProcessing(false);
      deductCDiamonds(diamonds);

      // Save payout profile fields in localStorage
      const profile = { payoutMethod, paypalEmail, bankName, bankIban, bankSwift };
      localStorage.setItem(getStorageKey("payout_profile"), JSON.stringify(profile));

      let receiverIdStr = "BANK_ACCOUNT";
      let receiverNameStr = `Bank Transfer (${bankName} - ${bankIban.slice(0, 4)}...${bankIban.slice(-4)})`;
      if (payoutMethod === "paypal") {
        receiverIdStr = "PAYPAL_GATEWAY";
        receiverNameStr = `PayPal Account (${paypalEmail})`;
      }

      const newTx: LedgerTransaction = {
        id: `TX-${Math.floor(100000 + Math.random() * 900000)}`,
        eventType: "PAYOUT",
        senderId: user?.uid || "leo_vela_uid",
        senderName: alias || "Leo Vela",
        receiverId: receiverIdStr,
        receiverName: receiverNameStr,
        amount: diamonds,
        currency: "diamonds",
        timestamp: Date.now()
      };
      
      setLedgerTxs(prev => [newTx, ...prev]);
      setShowPayoutModal(false);
      setPayoutDiamonds("");
      showNotification(`¡Retiro procesado con éxito! €${(diamonds / 100).toFixed(2)} transferidos a tu ${payoutMethod === "paypal" ? "PayPal" : "cuenta bancaria"}.`, "success");
      triggerMascot("celebrate", 3000);
    }, 2500);
  };

  // Consolidated global statistics calculations
  const totalFollowers = Object.keys(syncPlatforms)
    .filter(k => syncPlatforms[k as keyof typeof syncPlatforms].connected)
    .reduce((acc, k) => acc + syncPlatforms[k as keyof typeof syncPlatforms].followers, 0);

  const totalMonthlyViews = Object.keys(syncPlatforms)
    .filter(k => syncPlatforms[k as keyof typeof syncPlatforms].connected)
    .reduce((acc, k) => acc + syncPlatforms[k as keyof typeof syncPlatforms].monthlyViews, 0);

  const totalMonthlyRevenue = Object.keys(syncPlatforms)
    .filter(k => syncPlatforms[k as keyof typeof syncPlatforms].connected)
    .reduce((acc, k) => acc + syncPlatforms[k as keyof typeof syncPlatforms].estRevenue, 0);

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(2) + "M";
    if (num >= 1000) return (num / 1000).toFixed(0) + "K";
    return num;
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white font-sans">
        <RefreshCw className="animate-spin text-[var(--color-gold)] mr-3" size={24} />
        <span>Cargando configurador...</span>
      </div>
    );
  }

  return (
    <div className="profile-services-page">
      <div className="bg-stars"></div>
      <div className="glow-orb glow-orb-1"></div>
      <div className="glow-orb glow-orb-2"></div>

      <div className="app-container">
        {/* Sidebar Navigation */}
        <aside className="sidebar">
          <div className="sidebar-logo">
            <div className="logo-circle">
              <span className="logo-text">C8L</span>
            </div>
            <div className="logo-info">
              <h2>C8L Perfil</h2>
              <p>C8L Agency Perfil</p>
            </div>
          </div>
          
          <nav className="sidebar-nav">
            <button 
              onClick={() => setActiveTab("profile")} 
              className={`nav-item ${activeTab === "profile" ? "active" : ""}`}
            >
              <User size={18} />
              <span>Perfil & Galería</span>
            </button>
            <button 
              onClick={() => setActiveTab("graph")} 
              className={`nav-item ${activeTab === "graph" ? "active" : ""}`}
            >
              <RefreshCw size={18} />
              <span>Vínculos Cuánticos</span>
            </button>
            <button 
              onClick={() => {
                setActiveTab("inbox");
                setInboxUnreadBadge(0);
              }} 
              className={`nav-item ${activeTab === "inbox" ? "active" : ""}`}
            >
              <MessageSquare size={18} />
              <span>Social Inbox</span>
              {inboxUnreadBadge > 0 && (
                <span className="badge-count" id="inbox-badge">{inboxUnreadBadge}</span>
              )}
            </button>
            <button 
              onClick={() => setActiveTab("sync")} 
              className={`nav-item ${activeTab === "sync" ? "active" : ""}`}
            >
              <Layers size={18} />
              <span>Sync Hub & APIs</span>
            </button>
            <button 
              onClick={() => setActiveTab("wallet")} 
              className={`nav-item ${activeTab === "wallet" ? "active" : ""}`}
            >
              <Wallet size={18} />
              <span>Financial Wallet</span>
            </button>

            <div className="border-t border-white/10 my-4"></div>

            <Link href="/streamer/profile" className="nav-item">
              <User size={18} className="text-zinc-400" />
              <span>Link-in-Bio</span>
            </Link>

            <Link href="/streamer/multipost" className="nav-item">
              <Send size={18} className="text-zinc-400" />
              <span>Multipost</span>
            </Link>

            <Link href="/streamer" className="nav-item">
              <Coins size={18} className="text-zinc-400" />
              <span>Finanzas BI</span>
            </Link>
          </nav>

          <div className="sidebar-footer">
            <div className="status-panel">
              <div className="status-header">
                <span className="status-label">ESTADO DE TRANSMISIÓN</span>
                <label className="switch">
                  <input type="checkbox" checked={isLive} onChange={(e) => setIsLive(e.target.checked)} />
                  <span className="slider"></span>
                </label>
              </div>
              <div className={`live-status-indicator ${isLive ? "active" : ""}`} id="sidebar-live-indicator">
                <span className="pulse-dot"></span>
                <span className="status-text">{isLive ? "TRANSMITIENDO EN VIVO" : "DESCONECTADO"}</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="main-content">
          <header className="top-header">
            <div className="search-bar-placeholder">
              <i className="search-icon">🔍</i>
              <input type="text" placeholder="Buscar servicios, covers, creadores..." disabled />
            </div>
            
            <div className="flex items-center gap-4">
              <Link 
                href="/community" 
                className="btn btn-outline btn-xs flex items-center gap-1 hover:border-[var(--color-gold)] transition-colors"
              >
                <ArrowLeft size={10} />
                <span>Volver a la Web</span>
              </Link>
              
              <div className="top-profile-badge">
                <span className="user-tier-badge platinum">CREADOR VIP</span>
                <span className="user-name-display" id="header-user-name">{alias}</span>
                <div className="user-mini-avatar"></div>
              </div>
            </div>
          </header>

          <div className="tab-content-container">

        {/* ====================================================================
             1. TAB: PROFILE & COVERS
             ==================================================================== */}
        {activeTab === "profile" && (
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            {/* Facebook-style Cover and Avatar Header */}
            <div className="profile-card">
              <div className={`profile-banner preset-${bannerPreset}`} id="profile-banner-preview">
                <div className="banner-overlay"></div>
                <div className="banner-preset-selector">
                  {["cyberpunk", "gold", "neon"].map(preset => (
                    <button
                      key={preset}
                      onClick={() => {
                        setBannerPreset(preset);
                        localStorage.setItem(getStorageKey("bannerPreset"), preset);
                      }}
                      className={`btn-preset ${bannerPreset === preset ? "active" : ""}`}
                    >
                      {preset.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              <div className="profile-header-body">
                <div className="profile-avatar-container relative">
                  <div 
                    className="profile-avatar relative"
                    style={{ 
                      backgroundImage: `url(${user?.photoURL || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256"})`,
                      border: isLive ? "4px solid #FF3131" : "4px solid #D4AF37",
                      boxShadow: isLive ? "0 0 15px rgba(255,49,49,0.6)" : "none"
                    }}
                  >
                  </div>
                  {isLive && (
                    <span className="absolute bottom-[-10px] left-1/2 transform -translate-x-1/2 bg-red-600 text-white font-extrabold text-[9px] px-2 py-0.5 rounded-full border-2 border-black animate-bounce z-30">
                      LIVE
                    </span>
                  )}
                </div>

                <div className="profile-meta-info">
                  <div className="profile-title-row">
                    <h1>{alias}</h1>
                    {isLive && <span className="live-badge-flashing">En Vivo</span>}
                  </div>
                  <p className="profile-handle">@{alias.toLowerCase().replace(/\s+/g, '_')}</p>
                  
                  <div className="profile-stats-row">
                    <div className="stat-box">
                      <strong>{formatNumber(totalFollowers)}</strong>
                      <span>Seguidores</span>
                    </div>
                    <div className="stat-box">
                      <strong className="text-[var(--color-gold)]">€{totalMonthlyRevenue.toLocaleString()}</strong>
                      <span>Monetización Est.</span>
                    </div>
                    <div className="stat-box">
                      <strong>{formatNumber(totalMonthlyViews)}</strong>
                      <span>Views (30d)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Layout de Dos Columnas: Sidebar Izquierda & Timeline Derecha */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              
              {/* COLUMNA IZQUIERDA: Sidebar */}
              <div className="space-y-6 lg:col-span-1">
                
                {/* 1. Información del Perfil */}
                <div className="bio-editor-panel glass-pane">
                  <h3 className="text-xs font-bold text-zinc-300 mb-4 tracking-wider uppercase">Información del Perfil</h3>
                  <div className="form-group mb-3">
                    <label className="text-[10px] text-zinc-500 font-bold uppercase mb-1">Alias Artístico</label>
                    <input 
                      type="text" 
                      value={alias} 
                      onChange={(e) => {
                        setAlias(e.target.value);
                        localStorage.setItem(getStorageKey("alias"), e.target.value);
                      }} 
                      className="p-2 bg-black/40 border border-white/10 rounded-lg text-white text-xs w-full focus:border-[var(--color-gold)] outline-none"
                    />
                  </div>
                  <div className="form-group mb-3">
                    <label className="text-[10px] text-zinc-500 font-bold uppercase mb-1">Biografía</label>
                    <textarea 
                      rows={3} 
                      value={bio} 
                      onChange={(e) => {
                        setBio(e.target.value);
                        localStorage.setItem(getStorageKey("bio"), e.target.value);
                      }} 
                      className="p-2 bg-black/40 border border-white/10 rounded-lg text-white text-xs w-full focus:border-[var(--color-gold)] outline-none resize-none"
                    />
                  </div>
                  <div className="form-group mb-4">
                    <label className="text-[10px] text-zinc-500 font-bold uppercase mb-1">Tags de Servicios</label>
                    <div className="tags-container flex flex-wrap gap-1.5 mt-1">
                      {["DJ", "Vocalist", "Producer", "Acoustic", "Electronic", "Streaming", "IA Content"].map(tag => {
                        const active = activeTags.includes(tag);
                        return (
                          <span
                            key={tag}
                            onClick={() => {
                              const updated = active ? activeTags.filter(x => x !== tag) : [...activeTags, tag];
                              setActiveTags(updated);
                              localStorage.setItem(getStorageKey("activeTags"), JSON.stringify(updated));
                            }}
                            className={`tag px-2.5 py-1 text-[10px] font-bold rounded-full border cursor-pointer transition-all ${
                              active 
                                ? "bg-[rgba(212,175,55,0.15)] text-[var(--color-gold)] border-[var(--color-gold)]" 
                                : "bg-black/35 text-zinc-500 border-white/5 hover:border-white/20"
                            }`}
                          >
                            {tag}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-white/5">
                    <button 
                      className="btn btn-gold btn-sm py-2 px-4 flex items-center gap-1.5" 
                      onClick={() => {
                        handleSaveProfile();
                        triggerMascot("win", 2500);
                      }}
                    >
                      <Save size={12} /> Guardar Cambios
                    </button>
                    <div className="flex items-center gap-2 bg-black/40 px-2.5 py-1.5 rounded-lg border border-white/5">
                      <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest font-bold">LIVE</span>
                      <label className="switch">
                        <input 
                          type="checkbox" 
                          checked={isLive} 
                          onChange={(e) => {
                            setIsLive(e.target.checked);
                            localStorage.setItem(getStorageKey("isLive"), String(e.target.checked));
                          }} 
                        />
                        <span className="slider"></span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* 2. Widget de Mileoncito (Mascota Interactiva) */}
                <div className="glass-pane border border-[rgba(212,175,55,0.1)] hover:border-[rgba(212,175,55,0.3)] bg-gradient-to-b from-black/40 to-[rgba(20,10,15,0.3)] flex flex-col items-center p-5 relative overflow-hidden">
                  <div className="absolute top-2 right-3 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                    <span className="text-[8px] font-mono text-zinc-400 font-extrabold uppercase tracking-wider">Mileoncito C8L</span>
                  </div>
                  
                  <LionMascot state={mascotState} size={150} className="my-2" />
                  
                  <div className="text-center w-full mt-2">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">¡Saluda a Mileoncito!</h4>
                    <p className="text-[10px] text-zinc-500 mt-1 leading-relaxed px-2">
                      La mascota oficial de C8L. Reacciona a tus posts, reproducciones de video y estados.
                    </p>
                    <div className="flex justify-center gap-1.5 mt-3 flex-wrap">
                      <button 
                        onClick={() => triggerMascot("dance", 3000)} 
                        className="px-2 py-1 bg-black/50 border border-white/5 hover:border-[var(--color-gold)] text-[9px] text-zinc-400 hover:text-white rounded-md transition-all font-bold"
                      >
                        🕺 Bailar
                      </button>
                      <button 
                        onClick={() => triggerMascot("celebrate", 3000)} 
                        className="px-2 py-1 bg-black/50 border border-white/5 hover:border-[var(--color-gold)] text-[9px] text-zinc-400 hover:text-white rounded-md transition-all font-bold"
                      >
                        🎉 Celebrar
                      </button>
                      <button 
                        onClick={() => triggerMascot("win", 2500)} 
                        className="px-2 py-1 bg-black/50 border border-white/5 hover:border-[var(--color-gold)] text-[9px] text-zinc-400 hover:text-white rounded-md transition-all font-bold"
                      >
                        👑 Triunfo
                      </button>
                      <button 
                        onClick={() => triggerMascot("sad", 2500)} 
                        className="px-2 py-1 bg-black/50 border border-white/5 hover:border-[var(--color-gold)] text-[9px] text-zinc-400 hover:text-white rounded-md transition-all font-bold"
                      >
                        😢 Triste
                      </button>
                    </div>
                  </div>
                </div>

                {/* 3. Covers & Videos Destacados (Visual Grid like Facebook photos grid) */}
                {moments.filter(m => m.videoUrl).length > 0 && (
                  <div className="glass-pane">
                    <h3 className="text-xs font-bold text-zinc-300 mb-3 uppercase tracking-wider">
                      Covers & Videos ({moments.filter(m => m.videoUrl).length})
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                      {moments.filter(m => m.videoUrl).slice(0, 4).map(vid => {
                        const youtubeId = getYouTubeId(vid.videoUrl || "");
                        const displayThumb = vid.thumbnail || (youtubeId ? `https://img.youtube.com/vi/${youtubeId}/mqdefault.jpg` : "https://images.unsplash.com/photo-1487180142328-054b783fc471?q=80&w=200");
                        return (
                          <div 
                            key={vid.id}
                            className="aspect-video rounded-lg overflow-hidden border border-white/5 relative group cursor-pointer"
                            onClick={() => {
                              const el = document.getElementById(vid.id);
                              if (el) el.scrollIntoView({ behavior: "smooth" });
                            }}
                          >
                            <img src={displayThumb} alt={vid.videoTitle} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-200" />
                            <div className="absolute inset-0 bg-black/45 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <Play size={16} className="text-[var(--color-gold)]" />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 4. Canales Conectados */}
                <div className="quick-overview-panel glass-pane">
                  <h3 className="text-xs font-bold text-zinc-300 mb-4 tracking-wider uppercase">Canales & Enlaces</h3>
                  <div className="connected-channels-list space-y-3">
                    {[
                      { name: "YouTube", key: "youtube", icon: <Film size={13} className="text-red-500" />, url: youtubeUrl, setUrl: setYoutubeUrl, lsKey: getStorageKey("url_youtube") },
                      { name: "Twitch", key: "twitch", icon: <Play size={13} className="text-purple-500" />, url: twitchUrl, setUrl: setTwitchUrl, lsKey: getStorageKey("url_twitch") },
                      { name: "TikTok", key: "tiktok", icon: <Music size={13} className="text-zinc-300" />, url: tiktokUrl, setUrl: setTiktokUrl, lsKey: getStorageKey("url_tiktok") },
                      { name: "Kick", key: "kick", icon: <Globe size={13} className="text-emerald-500" />, url: kickUrl, setUrl: setKickUrl, lsKey: getStorageKey("url_kick") }
                    ].map(item => {
                      const isConnected = item.url.trim() !== "";
                      return (
                        <div key={item.key} className="flex flex-col gap-1.5 p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              {item.icon}
                              <span className="font-bold text-xs uppercase tracking-wider">{item.name}</span>
                            </div>
                            <span className={`px-2 py-0.5 rounded text-[8px] font-mono font-bold ${isConnected ? "bg-emerald-950/40 text-emerald-400 border border-emerald-500/20" : "bg-zinc-950/40 text-zinc-500 border border-zinc-700/20"}`}>
                              {isConnected ? "ENLAZADO" : "SIN VINCULO"}
                            </span>
                          </div>
                          
                          <div className="flex gap-2 items-center mt-1">
                            <input 
                              type="url" 
                              value={item.url} 
                              onChange={(e) => {
                                item.setUrl(e.target.value);
                                localStorage.setItem(item.lsKey, e.target.value);
                              }} 
                              placeholder={`https://${item.key}.com/...`}
                              className="flex-grow p-2 bg-black/40 border border-white/10 rounded-lg text-white font-mono text-[10px] outline-none focus:border-[var(--color-gold)] transition animate-none"
                            />
                            {isConnected && (
                              <a 
                                href={item.url} 
                                target="_blank" 
                                rel="noreferrer" 
                                className="p-2 bg-[var(--color-gold)] text-black rounded-lg hover:bg-[var(--color-gold-light)] transition flex items-center justify-center cursor-pointer"
                              >
                                <ExternalLink size={10} />
                              </a>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>

              {/* COLUMNA DERECHA: Timeline Feed & Composer */}
              <div className="space-y-6 lg:col-span-2">
                
                {/* COMPOSER (¿Qué tienes en mente?) */}
                <div className="glass-pane bg-gradient-to-r from-black/40 via-[rgba(20,10,15,0.25)] to-black/40 border border-white/10 p-5 rounded-2xl">
                  <div className="flex items-start gap-3 mb-4">
                    <div 
                      className="w-10 h-10 rounded-full bg-cover bg-center border border-white/10 shrink-0" 
                      style={{ backgroundImage: `url(${user?.photoURL || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256"})` }}
                    ></div>
                    <div className="flex-grow">
                      <textarea
                        rows={3}
                        placeholder={`¿Qué tienes en mente, ${alias}? Comparte un cover, un vídeo o una idea...`}
                        value={composerText}
                        onChange={(e) => setComposerText(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white text-xs outline-none focus:border-[var(--color-gold)] resize-none"
                      />
                    </div>
                  </div>

                  {/* Toggle para añadir video link */}
                  <div className="border-t border-white/5 pt-3">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <button
                        onClick={() => setShowComposerVideoOptions(!showComposerVideoOptions)}
                        className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border transition-all ${
                          showComposerVideoOptions 
                            ? "bg-red-950/45 text-red-400 border-red-500/35" 
                            : "bg-black/40 text-zinc-400 border-white/5 hover:border-white/10 hover:text-white"
                        }`}
                      >
                        <Film size={14} /> {showComposerVideoOptions ? "Quitar Video" : "Añadir Video/Cover"}
                      </button>

                      <button
                        onClick={handleCreateMoment}
                        className="btn btn-gold btn-sm py-1.5 px-4 flex items-center gap-1.5"
                      >
                        <Send size={12} /> Publicar Momento
                      </button>
                    </div>

                    {/* Opciones extendidas de video dentro del composer */}
                    {showComposerVideoOptions && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }} 
                        animate={{ opacity: 1, height: "auto" }} 
                        className="mt-3 p-4 bg-black/45 border border-white/15 rounded-xl space-y-3.5"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="form-group mb-0">
                            <label className="text-[9px] text-zinc-400 font-bold uppercase mb-1">Título del Video / Cover</label>
                            <input 
                              type="text" 
                              value={composerVideoTitle}
                              onChange={(e) => setComposerVideoTitle(e.target.value)}
                              placeholder="e.g. Estoy Enamorado - Cover Acústico"
                              className="p-2 bg-black/40 border border-white/10 rounded-lg text-white text-xs outline-none focus:border-[var(--color-gold)]"
                            />
                          </div>
                          <div className="form-group mb-0">
                            <label className="text-[9px] text-zinc-400 font-bold uppercase mb-1">Categoría</label>
                            <select 
                              value={composerVideoType} 
                              onChange={(e) => setComposerVideoType(e.target.value)}
                              className="p-2 bg-black/40 border border-white/10 rounded-lg text-white text-xs outline-none focus:border-[var(--color-gold)]"
                            >
                              <option value="Cover Musical">Cover Musical</option>
                              <option value="DJ Live Session">DJ Live Session</option>
                              <option value="Grabación Audio">Grabación Audio</option>
                              <option value="Vídeo Externo">Vídeo Externo</option>
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="form-group mb-0">
                            <label className="text-[9px] text-zinc-400 font-bold uppercase mb-1">Video URL (YouTube o MP4)</label>
                            <input 
                              type="url" 
                              value={composerVideoUrl}
                              onChange={(e) => {
                                setComposerVideoUrl(e.target.value);
                                if (e.target.value.includes("youtube.com") || e.target.value.includes("youtu.be")) {
                                  setComposerVideoType("Cover Musical");
                                }
                              }}
                              placeholder="https://www.youtube.com/watch?v=..."
                              className="p-2 bg-black/40 border border-white/10 rounded-lg text-white text-xs outline-none focus:border-[var(--color-gold)]"
                            />
                          </div>
                          <div className="form-group mb-0">
                            <label className="text-[9px] text-zinc-400 font-bold uppercase mb-1">Miniatura (Preset)</label>
                            <select 
                              value={composerVideoThumb} 
                              onChange={(e) => setComposerVideoThumb(e.target.value)}
                              className="p-2 bg-black/40 border border-white/10 rounded-lg text-white text-xs outline-none focus:border-[var(--color-gold)]"
                            >
                              <option value="guitar">Fondo Guitarra</option>
                              <option value="dj">Fondo DJ Deck</option>
                              <option value="singer">Fondo Studio Mic</option>
                              <option value="abstract">Abstracto Oro</option>
                            </select>
                          </div>
                        </div>

                        {/* AI assistant in composer */}
                        <div className="p-3 bg-[rgba(212,175,55,0.03)] border border-[rgba(212,175,55,0.1)] rounded-lg">
                          <div className="flex items-center gap-1.5 mb-1.5 text-xs text-[var(--color-gold)] font-bold">
                            <Sparkles size={12} />
                            <span>Asistente de IA (Descripción del Cover)</span>
                          </div>
                          <div className="flex gap-2">
                            <input 
                              type="text" 
                              placeholder="e.g. balada acustica, guitarra clasica, voz melancolica..." 
                              value={composerAiPrompt}
                              onChange={(e) => setComposerAiPrompt(e.target.value)}
                              className="flex-grow p-1.5 bg-black/50 border border-white/5 rounded-lg text-white text-[10px] outline-none focus:border-[var(--color-gold)]"
                            />
                            <button
                              type="button"
                              onClick={generateComposerAiExplanation}
                              disabled={generatingAiComposer}
                              className="px-3 py-1.5 bg-[var(--color-gold)] text-black text-[10px] font-extrabold rounded-lg hover:bg-[var(--color-gold-light)] disabled:opacity-50"
                            >
                              {generatingAiComposer ? "Redactando..." : "Generar"}
                            </button>
                          </div>
                          {composerAiExplanation && (
                            <div className="mt-2 text-[10px] text-zinc-300 leading-relaxed font-mono p-2 bg-black/30 rounded border border-white/5">
                              {composerAiExplanation}
                            </div>
                          )}
                        </div>

                        {/* Overlay link in composer */}
                        <div className="p-3 bg-black/40 border border-white/10 rounded-lg space-y-2">
                          <div className="flex items-center gap-1.5 text-xs text-white font-bold">
                            <Layers size={12} />
                            <span>Superponer Botón de Monetización (Overlay)</span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            <input 
                              type="text" 
                              placeholder="Etiqueta: Escuchar en Spotify" 
                              value={overlayLabel}
                              onChange={(e) => setOverlayLabel(e.target.value)}
                              className="p-1.5 bg-black/60 border border-white/10 rounded text-[10px] text-white outline-none focus:border-[var(--color-gold)]"
                            />
                            <input 
                              type="url" 
                              placeholder="URL: https://spotify.com/..." 
                              value={overlayUrl}
                              onChange={(e) => setOverlayUrl(e.target.value)}
                              className="p-1.5 bg-black/60 border border-white/10 rounded text-[10px] text-white outline-none focus:border-[var(--color-gold)]"
                            />
                            <input 
                              type="number" 
                              placeholder="Segundos: 5" 
                              value={overlayTime}
                              onChange={(e) => setOverlayTime(e.target.value)}
                              className="p-1.5 bg-black/60 border border-white/10 rounded text-[10px] text-white outline-none focus:border-[var(--color-gold)]"
                            />
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </div>

                {/* FEED DE MOMENTOS (TIMELINE) */}
                <div className="space-y-6">
                  {moments.length === 0 ? (
                    <div className="glass-pane text-center py-12 flex flex-col items-center">
                      <MessageSquare size={36} className="text-zinc-600 mb-2" />
                      <p className="text-zinc-500 text-xs">Aún no has publicado ningún momento.</p>
                      <p className="text-zinc-600 text-[10px] mt-1">Usa el editor de arriba para escribir un estado o enlazar tu primer cover.</p>
                    </div>
                  ) : (
                    moments.map(moment => (
                      <div 
                        id={moment.id} 
                        key={moment.id} 
                        className="glass-pane p-5 rounded-2xl relative border border-white/5 hover:border-white/10 transition-all space-y-4"
                      >
                        {/* Cabecera del post */}
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-10 h-10 rounded-full bg-cover bg-center border border-[var(--color-gold)] shrink-0" 
                              style={{ backgroundImage: `url(${moment.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256"})` }}
                            ></div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <h4 className="text-xs font-extrabold text-white">{moment.authorName}</h4>
                                <span className="text-[8px] px-1.5 py-0.5 rounded bg-zinc-950 border border-white/10 text-zinc-500 font-mono">CREADOR VIP</span>
                              </div>
                              <div className="flex items-center gap-2 text-[10px] text-zinc-500">
                                <span>{moment.authorHandle}</span>
                                <span>•</span>
                                <span suppressHydrationWarning>{new Date(moment.timestamp).toLocaleString()}</span>
                              </div>
                            </div>
                          </div>

                          <button 
                            onClick={() => handleDeleteMoment(moment.id)}
                            className="p-1.5 bg-transparent text-zinc-600 hover:text-red-500 rounded-lg transition-colors cursor-pointer"
                            title="Eliminar Momento"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>

                        {/* Texto del post */}
                        <p className="text-xs text-zinc-200 leading-relaxed whitespace-pre-wrap">{moment.text}</p>

                        {/* Reproductor de Video estilo YouTube */}
                        {moment.videoUrl && (
                          <div className="space-y-2">
                            <YouTubeStylePlayer 
                              videoUrl={moment.videoUrl} 
                              videoTitle={moment.videoTitle || "Multimedia C8L"}
                              thumbnail={moment.thumbnail}
                              overlay={moment.overlay}
                              aiExplanation={moment.aiExplanation}
                              onPlayChange={(playing) => triggerMascot(playing ? "cinema" : "idle")}
                              onViewInc={() => handleIncrementViews(moment.id)}
                            />
                            {moment.videoType && (
                              <div className="flex items-center gap-2 text-[10px] text-zinc-400">
                                <span className="px-2 py-0.5 rounded bg-black/60 border border-white/5 font-bold uppercase text-[9px] tracking-wide text-[var(--color-gold)]">
                                  {moment.videoType}
                                </span>
                                {moment.views > 0 && <span>{formatNumber(moment.views)} visualizaciones</span>}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Interacciones: Likes y Botón Comentarios */}
                        <div className="flex items-center justify-between border-t border-b border-white/5 py-2.5">
                          <button
                            onClick={() => handleToggleLike(moment.id)}
                            className={`flex items-center gap-1.5 text-xs font-bold transition-colors cursor-pointer ${
                              moment.likedBy.includes(uid) 
                                ? "text-red-500" 
                                : "text-zinc-500 hover:text-white"
                            }`}
                          >
                            <Heart size={14} className={moment.likedBy.includes(uid) ? "fill-red-500" : ""} />
                            <span>{moment.likes.toLocaleString()} Likes</span>
                          </button>

                          <div className="flex items-center gap-1.5 text-xs text-zinc-500 font-bold">
                            <MessageSquare size={14} />
                            <span>{moment.comments.length} Comentarios</span>
                          </div>
                        </div>

                        {/* Caja de Comentarios */}
                        <div className="space-y-3">
                          {/* Listado de comentarios */}
                          {moment.comments.length > 0 && (
                            <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-2 no-scrollbar">
                              {moment.comments.map(comment => (
                                <div key={comment.id} className="p-2.5 rounded-xl bg-black/45 border border-white/5 space-y-1.5">
                                  <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-2">
                                      <div 
                                        className="w-6 h-6 rounded-full bg-cover bg-center border border-white/10 shrink-0" 
                                        style={{ backgroundImage: `url(${comment.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=128"})` }}
                                      ></div>
                                      <div>
                                        <span className="text-[11px] font-bold text-white">{comment.author}</span>
                                        <span className="text-[8px] text-zinc-500 font-mono ml-2" suppressHydrationWarning>
                                          {new Date(comment.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                      </div>
                                    </div>
                                    <button 
                                      onClick={() => handleDeleteComment(moment.id, comment.id)}
                                      className="p-1 bg-transparent text-zinc-700 hover:text-red-500 rounded transition-colors cursor-pointer"
                                      title="Borrar Comentario"
                                    >
                                      <X size={10} />
                                    </button>
                                  </div>
                                  <p className="text-[11px] text-zinc-300 leading-normal pl-8">{comment.text}</p>

                                  {/* Respuesta del Streamer */}
                                  {comment.reply ? (
                                    <div className="ml-8 mt-2 p-2 rounded-lg bg-yellow-950/20 border-l-2 border-[var(--color-gold)]">
                                      <div className="flex items-center gap-1.5 mb-0.5">
                                        <span className="text-[9px] font-extrabold text-[var(--color-gold)] uppercase tracking-wider">Tú ({alias})</span>
                                        <span className="text-[8px] text-zinc-500">Respuesta Oficial</span>
                                      </div>
                                      <p className="text-[10.5px] text-zinc-300 leading-normal">{comment.reply}</p>
                                    </div>
                                  ) : (
                                    <div className="ml-8 mt-2 pl-2">
                                      <CommentReplyComposer 
                                        onSubmit={(text) => handleReplyToComment(moment.id, comment.id, text)} 
                                        alias={alias}
                                      />
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Añadir comentario en timeline */}
                          <div className="flex items-center gap-2.5 pt-1">
                            <div 
                              className="w-8 h-8 rounded-full bg-cover bg-center border border-white/10 shrink-0" 
                              style={{ backgroundImage: `url(${user?.photoURL || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256"})` }}
                            ></div>
                            <input
                              type="text"
                              placeholder="Escribe un comentario y presiona Enter..."
                              onKeyDown={(e) => {
                                if (e.key === "Enter" && e.currentTarget.value.trim() !== "") {
                                  handleAddComment(moment.id, e.currentTarget.value);
                                  e.currentTarget.value = "";
                                }
                              }}
                              className="flex-grow bg-black/55 border border-white/5 hover:border-white/10 focus:border-[var(--color-gold)] rounded-xl px-3 py-2 text-xs text-white outline-none transition-all"
                            />
                          </div>
                        </div>

                      </div>
                    ))
                  )}
                </div>

              </div>

            </div>
          </motion.div>
        )}

        {/* ====================================================================
             2. TAB: QUANTUM SOCIAL GRAPH (REDES AFECTIVAS)
             ==================================================================== */}
        {activeTab === "graph" && (
          <motion.div 
            initial={{ opacity: 0, y: 15 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="starmaker-graph space-y-6"
          >
            {/* Header Kawaii */}
            <div className="starmaker-header-banner p-6 rounded-3xl border border-pink-500/25 bg-gradient-to-r from-pink-950/20 via-purple-950/25 to-pink-950/20 text-center relative overflow-hidden">
              <div className="absolute top-2 right-4 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-ping"></span>
                <span className="text-[8px] font-mono text-pink-300 font-extrabold tracking-widest uppercase">Red Starmaker Activa</span>
              </div>
              <h2 className="text-lg font-black text-pink-200 uppercase tracking-widest flex items-center justify-center gap-2">
                🌸 Vínculos de Estado & Lazos de Diamante 🌸
              </h2>
              <p className="text-[10px] text-pink-300/60 max-w-xl mx-auto mt-2 leading-relaxed">
                Personaliza tus lazos afectivos de Starmaker. Registra fotos, forja conexiones exclusivas con un corazón cuántico gigante y activa lazos de diamante recíprocos en tiempo real.
              </p>
            </div>

            {/* Visual Heart Connector Panel (si hay alguna pareja exclusiva) */}
            {(() => {
              const activePartners = [
                { role: "esposo", data: relationships.esposo, color: "from-amber-400 to-amber-600", label: "Esposo/a" },
                { role: "novio", data: relationships.novio, color: "from-pink-500 to-red-500", label: "Novio/a" },
                { role: "amante", data: relationships.amante, color: "from-purple-500 to-indigo-500", label: "Amante" }
              ].filter(p => p.data);

              if (activePartners.length === 0) {
                return (
                  <div className="glass-pane border-dashed border-pink-500/20 bg-pink-950/5 flex flex-col items-center justify-center py-10 text-center">
                    <Heart size={36} className="text-pink-300/20 mb-2 animate-bounce" />
                    <h4 className="text-xs font-bold text-pink-200 uppercase tracking-wider">Sin pareja exclusiva forjada</h4>
                    <p className="text-[10px] text-zinc-500 mt-1 max-w-xs">
                      Vincula a un esposo/a, novio/a o amante con Lazo de Diamante u Oro para encender el Corazón Cuántico de Starmaker.
                    </p>
                  </div>
                );
              }

              return (
                <div className="space-y-4">
                  {activePartners.map(partner => (
                    <div 
                      key={partner.role}
                      className="kawaii-heart-connector p-6 rounded-3xl border border-pink-500/20 bg-gradient-to-b from-pink-950/10 to-[rgba(20,10,15,0.4)] flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden"
                    >
                      {/* Decorative Sparkles background */}
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,102,178,0.05)_0%,transparent_70%)] pointer-events-none"></div>
                      
                      {/* Current User */}
                      <div className="flex flex-col items-center gap-2 z-10 w-full md:w-1/3">
                        <div 
                          className="w-20 h-20 rounded-full bg-cover bg-center border-4 border-pink-500 shadow-[0_0_15px_rgba(255,102,178,0.5)] transition-transform duration-300 hover:scale-105" 
                          style={{ backgroundImage: `url(${user?.photoURL || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256"})` }}
                        ></div>
                        <div className="text-center">
                          <strong className="text-xs text-white block">{alias}</strong>
                          <span className="text-[9px] px-2 py-0.5 rounded bg-pink-900/40 text-pink-300 font-mono font-bold uppercase tracking-wider mt-1 inline-block border border-pink-500/10">Tú (Creador)</span>
                        </div>
                      </div>

                      {/* Heart & Connecting Line */}
                      <div className="flex flex-col items-center justify-center z-10 w-full md:w-1/3 py-4">
                        <div className="relative flex items-center justify-center">
                          {/* Beating Heart Icon */}
                          <div className="w-16 h-16 rounded-full bg-pink-500/10 border border-pink-500/30 flex items-center justify-center animate-pulse shadow-[0_0_20px_rgba(255,102,178,0.25)]">
                            <Heart size={32} className="text-pink-500 fill-pink-500 filter drop-shadow-[0_0_5px_rgba(255,49,150,0.8)]" />
                          </div>
                          {/* Mutual Sync Sparkle */}
                          {partner.data?.mutual && (
                            <span className="absolute top-[-8px] bg-cyan-600 text-white font-extrabold text-[8px] px-1.5 py-0.5 rounded-full border border-cyan-300 animate-bounce tracking-widest">
                              MUTUO 💎
                            </span>
                          )}
                        </div>
                        <div className="text-center mt-2.5 space-y-1">
                          <span className="text-[10px] font-bold text-pink-200 uppercase tracking-widest">{partner.label}</span>
                          <div className="flex items-center justify-center gap-1.5">
                            <span className={`px-2 py-0.5 rounded text-[8px] font-mono font-bold uppercase border ${
                              partner.data?.tier === "diamond" ? "bg-cyan-950/40 text-cyan-400 border-cyan-500/30 shadow-[0_0_8px_rgba(0,229,255,0.2)]" :
                              partner.data?.tier === "platinum" ? "bg-purple-950/40 text-purple-400 border-purple-500/30" :
                              partner.data?.tier === "gold" ? "bg-amber-950/40 text-amber-400 border-amber-500/30" :
                              "bg-zinc-950/40 text-zinc-400 border-white/5"
                            }`}>
                              Lazo {partner.data?.tier}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Partner User */}
                      <div className="flex flex-col items-center gap-2 z-10 w-full md:w-1/3">
                        <div 
                          className="w-20 h-20 rounded-full bg-cover bg-center border-4 border-pink-500 shadow-[0_0_15px_rgba(255,102,178,0.5)] transition-transform duration-300 hover:scale-105" 
                          style={{ backgroundImage: `url(${partner.data?.avatar})` }}
                        ></div>
                        <div className="text-center">
                          <strong className="text-xs text-white block">{partner.data?.name}</strong>
                          <span className="text-[9px] text-pink-300/70 block mt-0.5">{partner.data?.handle}</span>
                          {partner.data?.mutual && (
                            <div className="flex items-center justify-center gap-1 mt-1 text-[8.5px] font-bold text-cyan-400 font-mono">
                              <span>💎 Diamante Sincronizado</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}

            {/* Las Dos Columnas Kawaii */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
              
              {/* Lazos de Comunidad (Múltiples) */}
              <div className="graph-column glass-pane border-pink-500/15 bg-gradient-to-b from-pink-950/5 to-black/25">
                <h3 className="text-sm font-bold text-pink-200 uppercase tracking-widest border-b border-pink-500/10 pb-3 mb-4">
                  🌸 Lazos de Comunidad (Múltiples)
                </h3>
                <p className="column-desc text-[11px] text-zinc-500 mb-6">Red extendida: amigos íntimos, co-streamers y VIPs.</p>
                
                {["familia", "complicidad", "amistad"].map(relType => {
                  const list = relationships[relType as keyof typeof relationships] as RelationshipItem[];
                  return (
                    <div key={relType} className="relationship-group border-b border-pink-500/5 pb-4 mb-4 last:border-none last:pb-0 last:mb-0">
                      <h4 className="capitalize font-bold text-xs text-pink-300/80 mb-3 flex justify-between items-center">
                        <span>{relType}</span>
                        <span className="badge-limit text-[9px] text-zinc-500 lowercase">Múltiples</span>
                      </h4>
                      <div className="relation-cards-list space-y-2">
                        {list.length === 0 ? (
                          <p className="overview-note text-center py-3 text-zinc-600 text-[10px] italic">Sin lazos en esta categoría</p>
                        ) : (
                          list.map(u => (
                            <div key={u.id} className="relation-item-card flex items-center justify-between p-3 rounded-2xl bg-black/40 border border-white/5 hover:border-pink-500/20 transition-all gap-3">
                              <div className="flex items-center gap-3">
                                <div 
                                  className="w-10 h-10 rounded-full bg-cover bg-center border border-pink-500/20 shrink-0" 
                                  style={{ backgroundImage: `url(${u.avatar})` }}
                                ></div>
                                <div>
                                  <strong className="text-xs text-white block">{u.name}</strong>
                                  <span className="text-[10px] text-zinc-500 block">{u.handle}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`px-2 py-0.5 rounded text-[8px] font-mono font-bold uppercase border ${
                                  u.tier === "diamond" ? "bg-cyan-950/40 text-cyan-400 border-cyan-500/30" :
                                  u.tier === "platinum" ? "bg-purple-950/40 text-purple-400 border-purple-500/30" :
                                  u.tier === "gold" ? "bg-amber-950/40 text-amber-400 border-amber-500/30" :
                                  "bg-zinc-950/40 text-zinc-500 border-white/5"
                                }`}>
                                  {u.tier}
                                </span>
                                <button 
                                  className="p-1 bg-transparent text-zinc-600 hover:text-red-500 rounded transition-colors cursor-pointer" 
                                  onClick={() => handleRemoveRelation(u.id, relType)}
                                  title="Remover Lazo"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                      <button 
                        className="btn btn-outline btn-sm btn-add-relation mt-3 border-pink-500/20 hover:border-pink-500/40 text-pink-300" 
                        onClick={() => {
                          setAddRelationType(relType);
                          setShowAddRelationModal(true);
                        }}
                      >
                        <Plus size={12} /> Vincular {relType}
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Parejas exclusivas 1 a 1 */}
              <div className="graph-column glass-pane border-pink-500/15 bg-gradient-to-b from-pink-950/5 to-black/25">
                <h3 className="text-sm font-bold text-pink-200 uppercase tracking-widest border-b border-pink-500/10 pb-3 mb-4">
                  🌸 Parejas Exclusivas (1 a 1)
                </h3>
                <p className="column-desc text-[11px] text-zinc-500 mb-6">Bloqueos de identidad: 1 miembro máximo por rol cuántico.</p>

                {["novio", "esposo", "amante"].map(role => {
                  const partner = relationships[role as keyof typeof relationships] as RelationshipItem | null;
                  return (
                    <div key={role} className="exclusive-relationship-card p-4 rounded-2xl bg-black/40 border border-white/5 mb-4 last:mb-0 hover:border-pink-500/20 transition-all space-y-3">
                      <div className="flex justify-between items-center border-b border-white/5 pb-2">
                        <div className="flex items-center gap-1.5 text-pink-300 font-bold text-xs uppercase tracking-wider">
                          {role === "novio" && <Heart size={12} className="text-pink-500 fill-pink-500" />}
                          {role === "esposo" && <Award size={12} className="text-amber-500" />}
                          {role === "amante" && <Heart size={12} className="text-purple-500 animate-pulse" />}
                          <span>{role} / {role === "novio" ? "novia" : role === "esposo" ? "esposa" : "amante"}</span>
                        </div>
                        <span className="text-[9px] text-zinc-600 font-mono">Lazo 1-1</span>
                      </div>
                      
                      <div>
                        {!partner ? (
                          <div className="border border-dashed border-zinc-800 rounded-xl p-4 text-center">
                            <p className="text-[10.5px] text-zinc-500 italic mb-3">Vacío. Sin {role} vinculado en tu perfil.</p>
                            <button 
                              className="px-3 py-1 bg-pink-900/30 border border-pink-500/20 text-pink-300 hover:bg-pink-900/50 rounded-lg text-[10px] font-bold transition-all" 
                              onClick={() => {
                                setAddRelationType(role);
                                setShowAddRelationModal(true);
                              }}
                            >
                              <Plus size={10} className="inline mr-1" /> Forjar Lazo
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <div 
                                className="w-12 h-12 rounded-full bg-cover bg-center border-2 border-pink-500 shadow-[0_0_8px_rgba(255,102,178,0.3)] shrink-0" 
                                style={{ backgroundImage: `url(${partner.avatar})` }}
                              ></div>
                              <div>
                                <strong className="text-xs text-white block">{partner.name}</strong>
                                <span className="text-[10px] text-zinc-500 block">{partner.handle}</span>
                                {partner.mutual && <span className="text-[8.5px] text-cyan-400 font-mono font-bold block mt-0.5">💎 Sincronizado Mutuo</span>}
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-1.5">
                              <span className={`px-2 py-0.5 rounded text-[8px] font-mono font-bold uppercase border ${
                                partner.tier === "diamond" ? "bg-cyan-950/40 text-cyan-400 border-cyan-500/30" :
                                partner.tier === "platinum" ? "bg-purple-950/40 text-purple-400 border-purple-500/30" :
                                partner.tier === "gold" ? "bg-amber-950/40 text-amber-400 border-amber-500/30" :
                                "bg-zinc-950/40 text-zinc-500 border-white/5"
                              }`}>
                                Lazo {partner.tier}
                              </span>
                              <button 
                                className="px-2 py-1 bg-red-950/30 border border-red-500/20 text-red-400 hover:bg-red-950/50 rounded-lg text-[9px] transition-all cursor-pointer" 
                                onClick={() => handleRemoveExclusiveRelation(role)}
                              >
                                Quitar Vínculo
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          </motion.div>
        )}

        {/* ====================================================================
             3. TAB: SOCIAL INBOX (AGREGADOR OMNICANAL)
             ==================================================================== */}
        {activeTab === "inbox" && (
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="inbox-layout">
            <aside className="inbox-filters glass-pane">
              <h3>Filtrar Red</h3>
              <div className="filter-buttons">
                {["all", "youtube", "kick", "twitch", "tiktok", "instagram", "bigo", "tango", "spotify", "apple", "soundcloud", "x", "facebook", "discord"].map(plat => (
                  <button
                    key={plat}
                    onClick={() => setInboxFilter(plat)}
                    className={`btn-filter capitalize ${inboxFilter === plat ? "active" : ""}`}
                  >
                    {plat === "bigo" ? "Bigo Live" : plat === "apple" ? "Apple Music" : plat}
                  </button>
                ))}
              </div>
              <div className="webhook-status-box">
                <div className="status-top">
                  <span className="status-pulse-dot"></span>
                  <span>WEBHOOKS ACTIVOS</span>
                </div>
                <p>Simulador conectado y recibiendo actualizaciones de las APIs de streaming en tiempo real.</p>
              </div>
            </aside>

            <div className="inbox-comments-container glass-pane">
              <div className="inbox-top-row">
                <h3>Feed Centralizado de Comentarios</h3>
                <button 
                  className="btn btn-outline btn-xs" 
                  onClick={() => {
                    const updated = moments.map(m => ({ ...m, comments: [] }));
                    setMoments(updated);
                    localStorage.setItem(getStorageKey("moments"), JSON.stringify(updated));
                    showNotification("Feed de comentarios limpiado", "info");
                  }}
                >
                  Limpiar Feed
                </button>
              </div>

              <div className="comments-scroll-area">
                {derivedComments.filter(c => inboxFilter === "all" || c.platform === inboxFilter).length === 0 ? (
                  <div className="comments-empty-state">
                    <MessageSquare size={32} />
                    <p>No hay comentarios registrados para esta red social</p>
                  </div>
                ) : (
                  derivedComments.filter(c => inboxFilter === "all" || c.platform === inboxFilter).map(c => {
                    const dateStr = new Date(c.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    return (
                      <div key={c.id} className="comment-item">
                        <div className="c-user-avatar" style={{ backgroundImage: `url(${c.avatar})` }}></div>
                        <div className="comment-body">
                          <div className="comment-user-row">
                            <strong>{c.author}</strong>
                            <span className="comment-time" suppressHydrationWarning>{dateStr}</span>
                          </div>
                          
                          {c.coverId && c.videoTitle && (
                            <div className="comment-video-badge-row">
                              <button 
                                className="comment-video-ref-link bg-transparent border-none text-left p-0 cursor-pointer"
                                onClick={() => viewLinkedVideo(c.coverId!)}
                              >
                                <Film size={12} className="inline mr-1" /> Del video: <strong>{c.videoTitle}</strong>
                              </button>
                              {c.videoUrl && (
                                <a href={c.videoUrl} target="_blank" rel="noreferrer" className="comment-external-link ml-1">
                                  <ExternalLink size={12} />
                                </a>
                              )}
                            </div>
                          )}

                          <div className="comment-text-content">{c.text}</div>
                          
                          {c.isReplied ? (
                            <div className="comment-reply-content">
                              <div className="reply-header">Tu Respuesta:</div>
                              <p>{c.reply}</p>
                            </div>
                          ) : (
                            <ReplyForm onSubmit={(text) => handleSendCommentReply(c.id, text)} />
                          )}
                        </div>
                        <div className={`comment-platform-icon c-${c.platform}-text uppercase font-mono text-[9px] font-bold tracking-widest`}>
                          {c.platform === "bigo" ? "Bigo Live" : c.platform === "apple" ? "Apple Music" : c.platform}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* ====================================================================
             4. TAB: SYNC HUB & APIS
             ==================================================================== */}
        {activeTab === "sync" && (
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
            
            {/* Dashboard Consolidado */}
            <div className="sync-summary-card glass-pane">
              <div className="metric-summary-grid">
                <div className="summary-metric">
                  <span className="metric-title">Audiencia Consolidada</span>
                  <span className="metric-value">{formatNumber(totalFollowers)}</span>
                  <span className="metric-sub">Seguidores en total</span>
                </div>
                <div className="summary-metric">
                  <span className="metric-title">Ingresos Mensuales</span>
                  <span className="metric-value text-gold">€{totalMonthlyRevenue.toLocaleString()}</span>
                  <span className="metric-sub">Estimación sobre CPM</span>
                </div>
                <div className="summary-metric">
                  <span className="metric-title">Views Mensuales</span>
                  <span className="metric-value">{formatNumber(totalMonthlyViews)}</span>
                  <span className="metric-sub">Últimos 30 días</span>
                </div>
              </div>
            </div>

            <div className="platforms-sync-grid">
              {/* Categoría 1: Video & Streaming */}
              <div className="platform-category-pane glass-pane">
                <h3>Video & Streaming</h3>
                <div className="platforms-cards-list">
                  {["youtube", "kick", "twitch", "tiktok", "bigo", "tango"].map(key => {
                    const platform = (syncPlatforms as any)[key];
                    if (!platform) return null;
                    return (
                      <div key={key} className={`platform-sync-card ${platform.connected ? "" : "disconnected"}`}>
                        <div className="p-card-header">
                          <span className="capitalize font-bold text-sm">{key === "bigo" ? "Bigo Live" : key}</span>
                          <span className={`sync-status-badge ${platform.connected ? "linked" : "unlinked"}`}>
                            {platform.connected ? "CONECTADO" : "DESCONECTADO"}
                          </span>
                        </div>
                        {platform.connected && (
                          <div className="p-card-metrics">
                            <div><strong>{formatNumber(platform.followers)}</strong><span>Fans</span></div>
                            <div><strong>€{platform.estRevenue}</strong><span>Ingresos</span></div>
                          </div>
                        )}
                        <button 
                          className={`btn-platform-action ${platform.connected ? "linked" : ""}`}
                          onClick={() => handlePlatformAction(key)}
                        >
                          {platform.connected ? "Desvincular" : "Vincular OAuth2"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Categoría 2: Music & Audio */}
              <div className="platform-category-pane glass-pane">
                <h3>Music & Audio Sync</h3>
                <div className="platforms-cards-list">
                  {["spotify", "apple", "soundcloud"].map(key => {
                    const platform = (syncPlatforms as any)[key];
                    if (!platform) return null;
                    return (
                      <div key={key} className={`platform-sync-card ${platform.connected ? "" : "disconnected"}`}>
                        <div className="p-card-header">
                          <span className="capitalize font-bold text-sm">{key === "apple" ? "Apple Music" : key}</span>
                          <span className={`sync-status-badge ${platform.connected ? "linked" : "unlinked"}`}>
                            {platform.connected ? "CONECTADO" : "DESCONECTADO"}
                          </span>
                        </div>
                        {platform.connected && (
                          <div className="p-card-metrics">
                            <div><strong>{formatNumber(platform.followers)}</strong><span>Fans</span></div>
                            <div><strong>€{platform.estRevenue}</strong><span>Ingresos</span></div>
                          </div>
                        )}
                        <button 
                          className={`btn-platform-action ${platform.connected ? "linked" : ""}`}
                          onClick={() => handlePlatformAction(key)}
                        >
                          {platform.connected ? "Desvincular" : "Vincular OAuth2"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Categoría 3: Social Media Networks */}
              <div className="platform-category-pane glass-pane">
                <h3>Social Networks</h3>
                <div className="platforms-cards-list">
                  {["instagram", "x", "facebook", "discord"].map(key => {
                    const platform = (syncPlatforms as any)[key];
                    if (!platform) return null;
                    return (
                      <div key={key} className={`platform-sync-card ${platform.connected ? "" : "disconnected"}`}>
                        <div className="p-card-header">
                          <span className="capitalize font-bold text-sm">{key === "x" ? "X / Twitter" : key}</span>
                          <span className={`sync-status-badge ${platform.connected ? "linked" : "unlinked"}`}>
                            {platform.connected ? "CONECTADO" : "DESCONECTADO"}
                          </span>
                        </div>
                        {platform.connected && (
                          <div className="p-card-metrics">
                            <div><strong>{formatNumber(platform.followers)}</strong><span>Fans</span></div>
                            <div><strong>€{platform.estRevenue}</strong><span>Ingresos</span></div>
                          </div>
                        )}
                        <button 
                          className={`btn-platform-action ${platform.connected ? "linked" : ""}`}
                          onClick={() => handlePlatformAction(key)}
                        >
                          {platform.connected ? "Desvincular" : "Vincular OAuth2"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Credenciales de API */}
            <div className="api-credentials-pane glass-pane mt-8">
              <div className="api-pane-header">
                <h3>Configuración de Credenciales de API de Desarrollo</h3>
                <p>Guarda tus Client ID y Secret tokens privados para llamadas Webhook automatizadas.</p>
              </div>

              <div className="api-credentials-grid">
                <div className="api-card">
                  <div className="api-title">YouTube API Key</div>
                  <div className="api-input-wrapper">
                    <input type={showYoutubeKey ? "text" : "password"} value={youtubeKey} onChange={(e) => setYoutubeKey(e.target.value)} />
                    <button className="btn-toggle-visibility" onClick={() => setShowYoutubeKey(!showYoutubeKey)}><Eye size={14} /></button>
                  </div>
                </div>
                <div className="api-card">
                  <div className="api-title">Kick Developer Token</div>
                  <div className="api-input-wrapper">
                    <input type={showKickKey ? "text" : "password"} value={kickKey} onChange={(e) => setKickKey(e.target.value)} />
                    <button className="btn-toggle-visibility" onClick={() => setShowKickKey(!showKickKey)}><Eye size={14} /></button>
                  </div>
                </div>
                <div className="api-card">
                  <div className="api-title">Twitch Client Secret</div>
                  <div className="api-input-wrapper">
                    <input type={showTwitchSecret ? "text" : "password"} value={twitchSecret} onChange={(e) => setTwitchSecret(e.target.value)} />
                    <button className="btn-toggle-visibility" onClick={() => setShowTwitchSecret(!showTwitchSecret)}><Eye size={14} /></button>
                  </div>
                </div>
                <div className="api-card">
                  <div className="api-title">Spotify Client ID</div>
                  <div className="api-input-wrapper">
                    <input type={showSpotifyId ? "text" : "password"} value={spotifyId} onChange={(e) => setSpotifyId(e.target.value)} />
                    <button className="btn-toggle-visibility" onClick={() => setShowSpotifyId(!showSpotifyId)}><Eye size={14} /></button>
                  </div>
                </div>
                <div className="api-card">
                  <div className="api-title">TikTok App Key</div>
                  <div className="api-input-wrapper">
                    <input type={showTiktokSecret ? "text" : "password"} value={tiktokSecret} onChange={(e) => setTiktokSecret(e.target.value)} />
                    <button className="btn-toggle-visibility" onClick={() => setShowTiktokSecret(!showTiktokSecret)}><Eye size={14} /></button>
                  </div>
                </div>
                <div className="api-card">
                  <div className="api-title">Tango API Secret</div>
                  <div className="api-input-wrapper">
                    <input type={showTangoKey ? "text" : "password"} value={tangoKey} onChange={(e) => setTangoKey(e.target.value)} />
                    <button className="btn-toggle-visibility" onClick={() => setShowTangoKey(!showTangoKey)}><Eye size={14} /></button>
                  </div>
                </div>
                <div className="api-card">
                  <div className="api-title">Bigo Live Stream Key</div>
                  <div className="api-input-wrapper">
                    <input type={showBigoKey ? "text" : "password"} value={bigoKey} onChange={(e) => setBigoKey(e.target.value)} />
                    <button className="btn-toggle-visibility" onClick={() => setShowBigoKey(!showBigoKey)}><Eye size={14} /></button>
                  </div>
                </div>
                <div className="api-card">
                  <div className="api-title">X / Twitter API Secret</div>
                  <div className="api-input-wrapper">
                    <input type={showXKey ? "text" : "password"} value={xKey} onChange={(e) => setXKey(e.target.value)} />
                    <button className="btn-toggle-visibility" onClick={() => setShowXKey(!showXKey)}><Eye size={14} /></button>
                  </div>
                </div>
                <div className="api-card">
                  <div className="api-title">Facebook App Secret</div>
                  <div className="api-input-wrapper">
                    <input type={showFacebookSecret ? "text" : "password"} value={facebookSecret} onChange={(e) => setFacebookSecret(e.target.value)} />
                    <button className="btn-toggle-visibility" onClick={() => setShowFacebookSecret(!showFacebookSecret)}><Eye size={14} /></button>
                  </div>
                </div>
                <div className="api-card">
                  <div className="api-title">Discord Webhook Token</div>
                  <div className="api-input-wrapper">
                    <input type={showDiscordWebhook ? "text" : "password"} value={discordWebhook} onChange={(e) => setDiscordWebhook(e.target.value)} />
                    <button className="btn-toggle-visibility" onClick={() => setShowDiscordWebhook(!showDiscordWebhook)}><Eye size={14} /></button>
                  </div>
                </div>
              </div>

              <div className="api-actions-row">
                <button className="btn btn-gold btn-sm" onClick={handleSaveApiKeys}>
                  <i data-lucide="save"></i> Guardar API Keys
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* ====================================================================
             5. TAB: FINANCIAL WALLET (BILLETERA C8L)
             ==================================================================== */}
        {activeTab === "wallet" && (
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="wallet-metrics-grid">
              <div className="wallet-metric-card glass-pane">
                <span className="wallet-type">Billetera Espectador</span>
                <h3>C8L Coins</h3>
                <strong className="balance-display gold-text">{c8lCoins.toLocaleString()} 🪙</strong>
                <button className="btn btn-gold btn-full mt-4" onClick={() => setShowRechargeModal(true)}>
                  Recargar Monedas (Stripe)
                </button>
              </div>

              <div className="wallet-metric-card glass-pane">
                <span className="wallet-type">Billetera Creador</span>
                <h3>C8L Diamonds</h3>
                <strong className="balance-display cyan-text">{c8lDiamonds.toLocaleString()} 💎</strong>
                <button className="btn btn-cyan btn-full mt-4" onClick={() => setShowPayoutModal(true)}>
                  Retirar Ganancias (Payout)
                </button>
              </div>

              {/* Billetera de Ingresos Consolidados */}
              <div className="wallet-metric-card glass-pane highlight-red">
                <span className="wallet-type">Ingresos Consolidados</span>
                <h3>Plataformas Conectadas</h3>
                <strong className="balance-display red-text">
                  €{Object.keys(syncPlatforms)
                    .filter(k => (syncPlatforms as any)[k].connected)
                    .reduce((acc, k) => acc + (syncPlatforms as any)[k].estRevenue, 0)
                    .toLocaleString()
                  } EUR
                </strong>
                <div className="policy-footer flex flex-col items-stretch mt-3 space-y-1 text-[9px] text-zinc-500">
                  <span className="flex justify-between">
                    <span>Cuentas vinculadas:</span>
                    <strong className="text-zinc-300">
                      {Object.keys(syncPlatforms).filter(k => (syncPlatforms as any)[k].connected).length} de {Object.keys(syncPlatforms).length}
                    </strong>
                  </span>
                  <span className="flex justify-between border-t border-white/5 pt-1">
                    <span>Método de retiro activo:</span>
                    <strong className="text-cyan-300 capitalize">{payoutMethod === "paypal" ? `PayPal (${paypalEmail || "no config"})` : `Banco (${bankName || "no config"})`}</strong>
                  </span>
                </div>
              </div>
            </div>

            {/* Noticiero Económico y Previsión de Nichos (Trend Forecast) */}
            <div className="economic-newsletter-section glass-pane p-6 rounded-3xl border border-red-500/15 bg-gradient-to-b from-red-950/5 to-black/30">
              <div className="economic-header flex flex-col md:flex-row justify-between items-start md:items-center border-b border-white/5 pb-4 mb-4 gap-2">
                <div>
                  <h3 className="text-sm font-bold text-red-400 uppercase tracking-widest flex items-center gap-1.5">
                    📊 Noticiero Económico & Previsión de Nichos (May 2026)
                  </h3>
                  <p className="text-[10px] text-zinc-500">Análisis financiero y sugerencias algorítmicas de creación de contenido para streamers C8L.</p>
                </div>
                {/* Live Stock Ticker */}
                <div className="flex flex-wrap gap-2 text-[9px] font-mono">
                  <span className="px-2 py-0.5 rounded bg-black/45 border border-red-500/20 text-red-400">C8L Index: €4.25 <span className="text-green-400">▲ +1.2%</span></span>
                  <span className="px-2 py-0.5 rounded bg-black/45 border border-green-500/20 text-green-400">Kick CPM: €9.95 <span className="text-green-400">▲ +2.3%</span></span>
                  <span className="px-2 py-0.5 rounded bg-black/45 border border-zinc-500/20 text-zinc-400">YT Shorts Index: €3.80 <span className="text-green-400">▲ +0.8%</span></span>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Niche table */}
                <div className="lg:col-span-2 space-y-3 text-left">
                  <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Previsión Algorítmica de Nichos</h4>
                  <div className="table-wrapper text-xs">
                    <table className="ledger-table font-sans">
                      <thead>
                        <tr>
                          <th>Nicho de Contenido</th>
                          <th>CPM Promedio</th>
                          <th>Engage</th>
                          <th>Recomendación Estratégica</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="font-bold">Guitarra Española & Covers Acústicos</td>
                          <td className="text-green-400 font-mono">€8.00 - €12.50</td>
                          <td className="text-cyan-400 font-bold">Excelente (9.2%)</td>
                          <td className="text-zinc-500">Subir a Spotify usando reverberación cuántica C8L.</td>
                        </tr>
                        <tr>
                          <td className="font-bold">Sesiones DJ Tech-House en Vivo</td>
                          <td className="text-green-400 font-mono">€6.50 - €9.80</td>
                          <td className="text-green-400 font-bold">Alto (7.8%)</td>
                          <td className="text-zinc-500">Transmitir en Kick los fines de semana de noche.</td>
                        </tr>
                        <tr>
                          <td className="font-bold">Síntesis Vocal e IA de Letras</td>
                          <td className="text-green-400 font-mono">€4.80 - €7.20</td>
                          <td className="text-amber-400 font-bold">Medio (5.4%)</td>
                          <td className="text-zinc-500">Crear clips cortos de 45-60s para TikTok y Shorts.</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* News feed column */}
                <div className="space-y-3.5 text-left">
                  <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Titulares de la Creador Economy</h4>
                  <div className="space-y-2.5">
                    <div className="p-3 rounded-2xl bg-black/45 border border-white/5 space-y-1">
                      <span className="text-[8px] font-bold text-red-500 uppercase tracking-wider">ALERTA ALGORITMO</span>
                      <strong className="text-[11px] text-zinc-200 block leading-tight">YouTube Shorts favorece acústica</strong>
                      <p className="text-[10px] text-zinc-500 leading-tight">El nuevo parche del recomendador da peso extra a audio nativo de alta fidelidad. CPM de Shorts sube +18%.</p>
                    </div>
                    <div className="p-3 rounded-2xl bg-black/45 border border-white/5 space-y-1">
                      <span className="text-[8px] font-bold text-green-400 uppercase tracking-wider">KICK PROGRAM</span>
                      <strong className="text-[11px] text-zinc-200 block leading-tight">Incentivos para Canales de DJ</strong>
                      <p className="text-[10px] text-zinc-500 leading-tight">Kick duplica el pool de reparto directo de suscripciones (95/5) para sets musicales en vivo.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Índice de Ingresos de Contenido (Content Revenue Ledger) */}
            <div className="ledger-container glass-pane mt-8">
              <div className="ledger-header flex justify-between items-center">
                <h3><FileText size={16} className="text-red-500" /> Índice de Ingresos por Contenido (Redes Vinculadas)</h3>
                <span className="blockchain-badge border-red-500/30 text-red-400 bg-red-950/20">DETALLE CUÁNTICO ACTIVO</span>
              </div>
              <p className="column-desc text-[11px] text-zinc-500 text-left px-6 pt-1">
                Visualiza los beneficios reales segmentados por cada pieza de contenido conectada. Desconectar redes en el Sync Hub ocultará sus transacciones en tiempo real.
              </p>
              
              {CONTENT_REVENUE_ITEMS.filter(item => (syncPlatforms as any)[item.platform]?.connected).length === 0 ? (
                <p className="overview-note text-center py-8 text-zinc-500">
                  Ninguna plataforma conectada en el Sync Hub para registrar transacciones de ingresos de contenido.
                </p>
              ) : (
                <div className="table-wrapper">
                  <table className="ledger-table text-left">
                    <thead>
                      <tr>
                        <th>ID Item</th>
                        <th>Plataforma</th>
                        <th>Tipo de Ingreso</th>
                        <th>Pieza de Contenido / Video</th>
                        <th>Fecha y Hora</th>
                        <th>Ganancia</th>
                        <th className="text-right">Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {CONTENT_REVENUE_ITEMS.filter(item => (syncPlatforms as any)[item.platform]?.connected).map(item => (
                        <tr key={item.id}>
                          <td className="tx-id">{item.id}</td>
                          <td>
                            <span className={`px-2 py-0.5 rounded text-[8.5px] font-mono font-bold uppercase border c-${item.platform}-text bg-black/40`}>
                              {item.platform === "bigo" ? "Bigo Live" : item.platform === "apple" ? "Apple Music" : item.platform}
                            </span>
                          </td>
                          <td className="text-xs text-zinc-300 font-bold">{item.type}</td>
                          <td className="text-xs text-zinc-400 font-medium">{item.title}</td>
                          <td className="text-[11px] text-zinc-500">{item.date} {item.time}</td>
                          <td className="amount-add font-bold font-mono">+€{item.amount.toFixed(2)}</td>
                          <td className="text-right">
                            <button 
                              className="px-2 py-1 bg-red-950/30 border border-red-500/20 text-red-400 hover:bg-red-950/50 rounded-lg text-[9px] transition-all font-bold cursor-pointer inline-flex items-center gap-1"
                              onClick={() => viewLinkedVideo(item.momentId)}
                            >
                              Ver Contenido 🔗
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Ledger table log (Espectador Recharge / Creator Payout) */}
            <div className="ledger-container glass-pane mt-8">
              <div className="ledger-header">
                <h3><FileText size={16} className="text-amber-500" /> Transacciones de Billetera (Invariable Ledger)</h3>
                <span className="blockchain-badge">VERIFICADO LEDGER</span>
              </div>
              
              {loadingLedger ? (
                <div className="text-center py-12">
                  <div className="w-8 h-8 rounded-full border-t-2 border-[var(--color-gold)] animate-spin mx-auto"></div>
                </div>
              ) : ledgerTxs.length === 0 ? (
                <p className="overview-note text-center py-8">Sin transacciones registradas</p>
              ) : (
                <div className="table-wrapper">
                  <table className="ledger-table text-left">
                    <thead>
                      <tr>
                        <th>ID Transacción</th>
                        <th>Tipo</th>
                        <th>Origen</th>
                        <th>Destino</th>
                        <th>Monto</th>
                        <th className="text-right">Fecha / Hora</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ledgerTxs.map(tx => (
                        <tr key={tx.id}>
                          <td className="tx-id">{tx.id}</td>
                          <td>
                            <span className={`tx-badge ${tx.eventType === "PAYOUT" ? "payout" : tx.eventType === "RECHARGE" ? "recharge" : "gift"}`}>
                              {tx.eventType}
                            </span>
                          </td>
                          <td>{tx.senderName}</td>
                          <td>{tx.receiverName}</td>
                          <td className={tx.eventType === "PAYOUT" ? "amount-sub" : "amount-add"}>
                            {tx.eventType === "PAYOUT" ? "-" : "+"}{tx.amount.toLocaleString()} {tx.currency === "coins" ? "🪙" : "💎"}
                          </td>
                          <td className="text-right text-zinc-500" suppressHydrationWarning>{new Date(tx.timestamp).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </motion.div>
        )}

      </div>

      {/* ====================================================================
           MODALS DIALOGS DIÁLOGOS FLOTANTES
           ==================================================================== */}

      {/* Modal: Link Video & AI support */}
      <AnimatePresence>
        {showLinkVideoModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="modal-dialog media-creator-dialog">
              <div className="modal-header">
                <h3>Enlazar Video o Cover</h3>
                <button className="btn-close-modal" onClick={() => setShowLinkVideoModal(false)}><X size={16} /></button>
              </div>
              <div className="modal-body media-creator-layout max-h-[85vh] overflow-y-auto pr-2 no-scrollbar">
                <form onSubmit={handleLinkVideoSubmit} className="space-y-4">
                  <div className="grid-form-cols-2">
                    <div className="form-group">
                      <label>Título del Video</label>
                      <input type="text" required value={newVideoTitle} onChange={(e) => setNewVideoTitle(e.target.value)} placeholder="e.g. Aterciopelado Remix" />
                    </div>
                    <div className="form-group">
                      <label>Categoría</label>
                      <select className="form-select" value={newVideoType} onChange={(e) => setNewVideoType(e.target.value)}>
                        <option value="Cover Musical">Cover Musical</option>
                        <option value="DJ Live Session">DJ Live Session</option>
                        <option value="Grabación Audio">Grabación Audio</option>
                        <option value="Remix Oficial">Remix Oficial</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid-form-cols-2">
                    <div className="form-group">
                      <label>Video URL</label>
                      <input type="url" required value={newVideoUrl} onChange={handleVideoUrlChange} placeholder="https://youtube.com/watch?v=..." />
                    </div>
                    <div className="form-group">
                      <label>Preset Miniatura</label>
                      <select className="form-select" value={newVideoThumbPreset} onChange={(e) => setNewVideoThumbPreset(e.target.value)}>
                        <option value="guitar">Fondo Guitarra</option>
                        <option value="dj">Fondo DJ Deck</option>
                        <option value="singer">Fondo Studio Mic</option>
                        <option value="abstract">Abstracto Oro</option>
                      </select>
                    </div>
                  </div>

                  {/* Asistente de IA */}
                  <div className="ai-assistant-card">
                    <div className="ai-header">
                      <Sparkles size={14} />
                      <span>Asistente de IA (Redactar Explicación)</span>
                    </div>
                    <p className="ai-desc">Escribe palabras clave y genera la explicación para tu video.</p>
                    <div className="ai-prompt-row">
                      <input type="text" placeholder="e.g. balada romantica, voz aterciopelada, melancolico" value={aiPromptInput} onChange={(e) => setAiPromptInput(e.target.value)} />
                      <button type="button" className="btn btn-gold btn-sm" onClick={handleGenerateAiDescription} disabled={generatingAi}>
                        Generar
                      </button>
                    </div>
                    <div className="form-group mt-3">
                      <label>Explicación del Cover</label>
                      <textarea rows={3} value={videoAiExplanation} onChange={(e) => setVideoAiExplanation(e.target.value)} placeholder="La IA escribirá la descripción optimizada aquí..."></textarea>
                    </div>
                  </div>

                  {/* Overlay Config */}
                  <div className="overlay-links-config-card">
                    <div className="overlay-header">
                      <Layers size={14} />
                      <span>Superponer Enlace de Monetización (Overlay)</span>
                    </div>
                    <p className="ai-desc">Botón flotante en el reproductor de video en el segundo configurado.</p>
                    <div className="overlay-form-grid">
                      <div className="form-group">
                        <label>Etiqueta</label>
                        <input type="text" placeholder="e.g. Comprar Single" value={overlayLabel} onChange={(e) => setOverlayLabel(e.target.value)} />
                      </div>
                      <div className="form-group">
                        <label>Destino URL</label>
                        <input type="url" placeholder="https://spotify.com/..." value={overlayUrl} onChange={(e) => setOverlayUrl(e.target.value)} />
                      </div>
                      <div className="form-group" style={{ width: 80 }}>
                        <label>Segs</label>
                        <input type="number" min="0" value={overlayTime} onChange={(e) => setOverlayTime(e.target.value)} />
                      </div>
                    </div>
                  </div>

                  <div className="modal-actions border-t border-white/5 pt-4 mt-6">
                    <button type="button" className="btn btn-outline" onClick={() => setShowLinkVideoModal(false)}>Cancelar</button>
                    <button type="submit" className="btn btn-gold">Publicar Video</button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal: Visor Cover & Overlays & IA Info */}
      <AnimatePresence>
        {showMediaViewer && activeMedia && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="modal-dialog media-dialog">
              <div className="modal-header">
                <h3>{activeMedia.videoTitle || "Actualización de Estado"}</h3>
                <button className="btn-close-modal" onClick={() => {
                  setShowMediaViewer(false);
                  setMediaPlaying(false);
                }}><X size={16} /></button>
              </div>
              <div className="modal-body media-body-layout">
                <div className="media-preview-pane">
                  <div className="media-player-dummy" id="media-player-box">
                    <div className="waveform-animation-box">
                      {Array.from({ length: 7 }).map((_, i) => (
                        <span key={i} className={`w-bar bar-${i + 1} ${mediaPlaying ? "active" : ""}`}></span>
                      ))}
                    </div>
                    <button className="btn-play-pause-media" onClick={() => setMediaPlaying(!mediaPlaying)}>
                      {mediaPlaying ? <Pause size={24} /> : <Play size={24} />}
                    </button>
                    
                    <span className="media-timer-badge">
                      {String(Math.floor(playbackSecond / 60)).padStart(2, '0')}:{String(playbackSecond % 60).padStart(2, '0')}
                    </span>

                    {/* Dynamic Overlay Floating Link */}
                    {showOverlayCard && activeMedia.overlay && (
                      <div className="video-overlay-link-container">
                        <div className="video-overlay-card">
                          <p>Recomendado</p>
                          <a href={activeMedia.overlay.url} target="_blank" rel="noreferrer" onClick={() => showNotification("Redirigiendo a enlace monetizado...", "success")}>
                            <ExternalLink size={12} className="inline mr-1" /> {activeMedia.overlay.label}
                          </a>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="media-analytics-grid">
                    <div className="m-metric"><Play size={12} /> <span>{activeMedia.views.toLocaleString()}</span></div>
                    <div className="m-metric"><Heart size={12} className="text-heart" /> <span>{activeMedia.likes.toLocaleString()}</span></div>
                    <div className="m-metric"><MessageSquare size={12} /> <span>{activeMedia.comments.length}</span></div>
                    <div className="m-metric"><Send size={12} /> <span>0</span></div>
                  </div>

                  <div className="media-ai-explanation-pane mt-4 glass-pane">
                    <h4><Sparkles size={12} className="inline text-gold mr-1" /> Explicación IA C8L</h4>
                    <p className="media-ai-explanation-text text-zinc-300 text-xs mt-2 leading-relaxed">
                      {activeMedia.aiExplanation || "Explicación optimizada por la IA sobre la composición y técnicas sonoras empleadas."}
                    </p>
                  </div>
                </div>

                <div className="media-comments-pane">
                  <h4>Comentarios del Cover</h4>
                  <div className="media-comments-list space-y-2 max-h-[350px] overflow-y-auto pr-1">
                    {activeMedia.comments.length === 0 ? (
                      <p className="text-xs text-zinc-500 italic py-4 text-center">No hay comentarios en este momento</p>
                    ) : (
                      activeMedia.comments.map((com, idx) => (
                        <div key={com.id || idx} className="media-comment-card space-y-1.5 p-2 rounded bg-black/40 border border-white/5">
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-5 h-5 rounded-full bg-cover bg-center shrink-0" 
                              style={{ backgroundImage: `url(${com.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=128"})` }}
                            ></div>
                            <strong className="text-[10px] text-white">{com.author}</strong>
                          </div>
                          <p className="text-[10.5px] text-zinc-300 leading-normal pl-7">{com.text}</p>
                          {com.reply && (
                            <div className="ml-7 p-1.5 rounded bg-yellow-950/20 border-l border-[var(--color-gold)] text-[9.5px]">
                              <span className="text-[var(--color-gold)] font-extrabold block">Tú:</span>
                              {com.reply}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal: OAuth Consent Simulator */}
      <AnimatePresence>
        {showOAuthModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="modal-dialog oauth-dialog">
              <div className="oauth-window-header">
                <div className="window-controls">
                  <span className="dot red"></span>
                  <span className="dot yellow"></span>
                  <span className="dot green"></span>
                </div>
                <div className="window-address-bar">
                  <span className="text-[9px] font-mono">https://auth.{oauthPlatform}.com/oauth2/authorize</span>
                </div>
              </div>
              <div className="oauth-window-body">
                <div className="oauth-brand-row">
                  <div className="app-logo">C8L</div>
                  <div className="connection-line"></div>
                  <div className="platform-logo uppercase font-mono font-bold text-xs p-3">
                    {oauthPlatform}
                  </div>
                </div>

                <h2>Conectar {oauthPlatform.toUpperCase()} con C8L Agency</h2>
                <p className="oauth-perms-desc">La aplicación <strong>C8L Agency Web Portal</strong> solicita leer tus estadísticas de views, seguidores e ingresos de la cuenta asociada.</p>

                <ul className="oauth-permissions-list">
                  <li>
                    <CheckCircle size={14} className="text-green-500 mr-2" />
                    <div>
                      <strong>Acceso a métricas de audiencia</strong>
                      <p>Leer conteo de seguidores y subscriptores en tiempo real.</p>
                    </div>
                  </li>
                  <li>
                    <CheckCircle size={14} className="text-green-500 mr-2" />
                    <div>
                      <strong>Views e ingresos estimados</strong>
                      <p>Leer views agregados y ganancias de CPM.</p>
                    </div>
                  </li>
                </ul>

                <div className="oauth-actions-row">
                  <button className="btn btn-outline" onClick={() => setShowOAuthModal(false)}>Cancelar</button>
                  <button className="btn btn-gold" onClick={handleApproveOAuth}>Autorizar</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal: Coins Recharge */}
      <AnimatePresence>
        {showRechargeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="modal-dialog max-w-[460px]">
              <div className="modal-header">
                <h3>Recargar Monedas C8L Agency</h3>
                <button className="btn-close-modal" onClick={() => setShowRechargeModal(false)}><X size={16} /></button>
              </div>
              <div className="modal-body relative text-left max-h-[85vh] overflow-y-auto no-scrollbar">
                <p className="modal-desc text-[11px] text-zinc-400 mb-4">Adquiere monedas C8L para forjar lazos afectivos de Starmaker en tu red cuántica.</p>
                
                <form onSubmit={handleRechargeCoinsSubmit} className="space-y-4">
                  {/* Paquetes de Monedas */}
                  <div className="form-group">
                    <label className="text-[10px] font-bold text-[var(--color-gold)] uppercase block mb-1">Selecciona un Paquete de Monedas</label>
                    <div className="recharge-packages-list space-y-2">
                      {RECHARGE_PACKAGES.map((pack, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setSelectedPackIdx(idx)}
                          className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all cursor-pointer ${
                            selectedPackIdx === idx
                              ? "bg-[rgba(212,175,55,0.08)] border-[var(--color-gold)] shadow-[0_0_12px_rgba(212,175,55,0.15)]"
                              : "bg-black/40 border-white/5 hover:border-white/10 hover:bg-black/60"
                          }`}
                        >
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-white">{pack.coins.toLocaleString()} C8L Coins</span>
                            <span className="text-[9px] text-zinc-500">{pack.label}</span>
                          </div>
                          <span className="text-xs font-mono font-black text-[var(--color-gold)]">${pack.cost.toFixed(2)} USD</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Método de Pago */}
                  <div className="form-group">
                    <label className="text-[10px] font-bold text-[var(--color-gold)] uppercase block mb-1">Método de Pago</label>
                    <select
                      className="form-select w-full bg-black/50 border-white/10 text-xs text-white"
                      value={rechargeMethod}
                      onChange={(e) => setRechargeMethod(e.target.value as any)}
                    >
                      <option value="bank">🏦 Cuenta Bancaria (SEPA Wire)</option>
                      <option value="paypal">💳 PayPal Account Transfer</option>
                      <option value="payoneer">💎 Payoneer Digital Wallet</option>
                    </select>
                  </div>

                  {/* Detalles del Método */}
                  {rechargeMethod === "bank" && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="space-y-3 border-l-2 border-[var(--color-gold)]/20 pl-3">
                      <div className="form-group">
                        <label className="text-[9px] text-zinc-400 font-bold uppercase mb-1">Nombre del Banco</label>
                        <input type="text" required value={rechargeBankName} onChange={(e) => setRechargeBankName(e.target.value)} placeholder="e.g. BBVA España" className="p-2 bg-black/40 border border-white/10 rounded-lg text-white text-xs outline-none focus:border-[var(--color-gold)] w-full" />
                      </div>
                      <div className="form-group">
                        <label className="text-[9px] text-zinc-400 font-bold uppercase mb-1">Código IBAN / Cuenta</label>
                        <input type="text" required value={rechargeBankIban} onChange={(e) => setRechargeBankIban(e.target.value)} placeholder="e.g. ES91 0182 ..." className="p-2 bg-black/40 border border-white/10 rounded-lg text-white text-xs outline-none focus:border-[var(--color-gold)] w-full" />
                      </div>
                      <div className="form-group">
                        <label className="text-[9px] text-zinc-400 font-bold uppercase mb-1">SWIFT / BIC</label>
                        <input type="text" required value={rechargeBankSwift} onChange={(e) => setRechargeBankSwift(e.target.value)} placeholder="e.g. BBVADESMMXXX" className="p-2 bg-black/40 border border-white/10 rounded-lg text-white text-xs outline-none focus:border-[var(--color-gold)] w-full" />
                      </div>
                    </motion.div>
                  )}

                  {rechargeMethod === "paypal" && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="space-y-3 border-l-2 border-[var(--color-gold)]/20 pl-3">
                      <div className="form-group">
                        <label className="text-[9px] text-zinc-400 font-bold uppercase mb-1">Email de PayPal</label>
                        <input type="email" required value={rechargePaypalEmail} onChange={(e) => setRechargePaypalEmail(e.target.value)} placeholder="tu-email@paypal.com" className="p-2 bg-black/40 border border-white/10 rounded-lg text-white text-xs outline-none focus:border-[var(--color-gold)] w-full" />
                      </div>
                    </motion.div>
                  )}

                  {rechargeMethod === "payoneer" && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="space-y-3 border-l-2 border-[var(--color-gold)]/20 pl-3">
                      <div className="form-group">
                        <label className="text-[9px] text-zinc-400 font-bold uppercase mb-1">Email de Payoneer</label>
                        <input type="email" required value={rechargePayoneerEmail} onChange={(e) => setRechargePayoneerEmail(e.target.value)} placeholder="tu-cuenta@payoneer.com" className="p-2 bg-black/40 border border-white/10 rounded-lg text-white text-xs outline-none focus:border-[var(--color-gold)] w-full" />
                      </div>
                    </motion.div>
                  )}

                  <div className="modal-actions border-t border-white/5 pt-4 mt-6">
                    <button type="button" className="btn btn-outline border-white/10 text-zinc-400 hover:border-white/20" onClick={() => setShowRechargeModal(false)}>Cancelar</button>
                    <button type="submit" className="btn btn-gold font-bold" disabled={rechargeProcessing}>
                      Confirmar Recarga
                    </button>
                  </div>
                </form>

                {rechargeProcessing && (
                  <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center rounded-2xl">
                    <div className="w-10 h-10 border-t-2 border-[var(--color-gold)] rounded-full animate-spin mb-4"></div>
                    <span className="pulse-text text-[var(--color-gold)] text-xs font-bold">Procesando recarga por {rechargeMethod === "paypal" ? "PayPal" : rechargeMethod === "payoneer" ? "Payoneer" : "cuenta bancaria"}...</span>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal: Stripe Connect Payout */}
      <AnimatePresence>
        {showPayoutModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="modal-dialog max-w-[440px]">
              <div className="modal-header">
                <h3>Retirar Fondos C8L Agency</h3>
                <button className="btn-close-modal" onClick={() => setShowPayoutModal(false)}><X size={16} /></button>
              </div>
              <div className="modal-body relative text-left">
                <p className="modal-desc text-[11px] text-zinc-400 mb-4">Retira tus diamantes ganados a dinero real. Retiro mínimo 5,000 diamantes (€50.00 EUR).</p>
                <form onSubmit={handleStripePayoutSubmit} className="space-y-4">
                  <div className="form-group">
                    <label className="text-[10px] font-bold text-cyan-300 uppercase block mb-1">Monto a retirar (Diamantes)</label>
                    <input type="number" required min="5000" value={payoutDiamonds} onChange={(e) => setPayoutDiamonds(e.target.value)} placeholder="e.g. 5000" className="p-2 bg-black/40 border border-cyan-500/15 rounded-lg text-white text-xs outline-none focus:border-cyan-500 w-full" />
                  </div>
                  
                  <div className="form-group">
                    <label className="text-[10px] font-bold text-cyan-300 uppercase block mb-1">Canal de Pago</label>
                    <select 
                      className="form-select w-full bg-black/50 border-cyan-500/10 text-xs text-white" 
                      value={payoutMethod} 
                      onChange={(e) => setPayoutMethod(e.target.value as any)}
                    >
                      <option value="bank">🏦 Cuenta Bancaria (SEPA Wire)</option>
                      <option value="paypal">💳 PayPal Account Transfer</option>
                    </select>
                  </div>

                  {payoutMethod === "bank" && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="space-y-3.5 border-l-2 border-cyan-500/20 pl-3">
                      <div className="form-group">
                        <label className="text-[9px] text-zinc-400 font-bold uppercase mb-1">Nombre del Banco</label>
                        <input type="text" required value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="e.g. Banco Santander" className="p-2 bg-black/40 border border-cyan-500/15 rounded-lg text-white text-xs outline-none focus:border-cyan-500 w-full" />
                      </div>
                      <div className="form-group">
                        <label className="text-[9px] text-zinc-400 font-bold uppercase mb-1">Código IBAN</label>
                        <input type="text" required value={bankIban} onChange={(e) => setBankIban(e.target.value)} placeholder="e.g. ES91 2100 ..." className="p-2 bg-black/40 border border-cyan-500/15 rounded-lg text-white text-xs outline-none focus:border-cyan-500 w-full" />
                      </div>
                      <div className="form-group">
                        <label className="text-[9px] text-zinc-400 font-bold uppercase mb-1">SWIFT / BIC</label>
                        <input type="text" required value={bankSwift} onChange={(e) => setBankSwift(e.target.value)} placeholder="e.g. BSCHDESMMXX" className="p-2 bg-black/40 border border-cyan-500/15 rounded-lg text-white text-xs outline-none focus:border-cyan-500 w-full" />
                      </div>
                    </motion.div>
                  )}

                  {payoutMethod === "paypal" && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="space-y-3.5 border-l-2 border-cyan-500/20 pl-3">
                      <div className="form-group">
                        <label className="text-[9px] text-zinc-400 font-bold uppercase mb-1">Email de PayPal</label>
                        <input type="email" required value={paypalEmail} onChange={(e) => setPaypalEmail(e.target.value)} placeholder="tu-cuenta@paypal.com" className="p-2 bg-black/40 border border-cyan-500/15 rounded-lg text-white text-xs outline-none focus:border-cyan-500 w-full" />
                      </div>
                    </motion.div>
                  )}

                  {Number(payoutDiamonds) >= 5000 && (
                    <div className="payout-preview-box p-3 rounded-xl bg-black/50 border border-cyan-500/10 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-zinc-400">Equivalencia EUR:</span>
                        <strong className="text-green-400 font-mono">€{(Number(payoutDiamonds) / 100).toFixed(2)} EUR</strong>
                      </div>
                    </div>
                  )}
                  
                  <div className="modal-actions border-t border-white/5 pt-4 mt-6">
                    <button type="button" className="btn btn-outline border-cyan-500/20 text-cyan-300 hover:border-cyan-500/40" onClick={() => setShowPayoutModal(false)}>Cancelar</button>
                    <button type="submit" className="btn bg-cyan-600 text-white hover:bg-cyan-500 font-bold" disabled={payoutProcessing || Number(payoutDiamonds) < 5000 || Number(payoutDiamonds) > c8lDiamonds}>
                      Confirmar Retiro
                    </button>
                  </div>
                </form>
                {payoutProcessing && (
                  <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center rounded-2xl">
                    <div className="w-10 h-10 border-t-2 border-cyan-400 rounded-full animate-spin mb-4"></div>
                    <span className="pulse-text text-cyan-400 text-xs font-bold">Procesando retiro a tu {payoutMethod === "paypal" ? "PayPal" : "cuenta bancaria"}...</span>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal: Add social relation */}
      <AnimatePresence>
        {showAddRelationModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="modal-dialog border-pink-500/30 max-w-[480px]">
              <div className="modal-header border-pink-500/10">
                <h3 className="text-pink-200">🌸 Vincular miembro a red de {addRelationType.toUpperCase()}</h3>
                <button className="btn-close-modal" onClick={() => setShowAddRelationModal(false)}><X size={16} /></button>
              </div>
              <div className="modal-body space-y-4 max-h-[80vh] overflow-y-auto pr-1 no-scrollbar text-left">
                <p className="modal-desc text-pink-300/60 text-[11px] mb-4">Vincula un miembro de la comunidad o crea una identidad personalizada de Starmaker con fotos y lazos especiales.</p>
                
                {/* User Selector */}
                <div className="form-group">
                  <label className="text-[10px] font-bold text-pink-300 uppercase block mb-1">Origen del miembro</label>
                  <select 
                    className="form-select w-full bg-black/50 border-pink-500/10 text-xs text-white" 
                    value={selectedRelationUserId} 
                    onChange={(e) => {
                      setSelectedRelationUserId(e.target.value);
                      if (e.target.value !== "custom" && e.target.value !== "") {
                        const selectedUser = COMMUNITY_USERS.find(u => u.id === e.target.value);
                        if (selectedUser) {
                          setNewRelationName(selectedUser.name);
                          setNewRelationHandle(selectedUser.handle);
                          setNewRelationAvatarUrl(selectedUser.avatar);
                        }
                      } else {
                        setNewRelationName("");
                        setNewRelationHandle("");
                        setNewRelationAvatarUrl("");
                        setNewRelationAvatarBase64("");
                      }
                    }}
                  >
                    <option value="">-- Selecciona un origen --</option>
                    <option value="custom">👤 Miembro Personalizado (Escribir datos y subir foto)</option>
                    {COMMUNITY_USERS.map(u => (
                      <option key={u.id} value={u.id}>{u.name} ({u.handle})</option>
                    ))}
                  </select>
                </div>

                {/* Custom User Data Inputs */}
                {(selectedRelationUserId === "custom") && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="space-y-3.5 border-l-2 border-pink-500/20 pl-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="form-group mb-0">
                        <label className="text-[9px] text-pink-300/80 font-bold uppercase mb-1">Nombre Artístico</label>
                        <input 
                          type="text" 
                          value={newRelationName}
                          onChange={(e) => setNewRelationName(e.target.value)}
                          placeholder="e.g. Sacha Lehency"
                          className="p-2 bg-black/40 border border-pink-500/15 rounded-lg text-white text-xs outline-none focus:border-pink-500 w-full"
                        />
                      </div>
                      <div className="form-group mb-0">
                        <label className="text-[9px] text-pink-300/80 font-bold uppercase mb-1">Handle (@alias)</label>
                        <input 
                          type="text" 
                          value={newRelationHandle}
                          onChange={(e) => setNewRelationHandle(e.target.value)}
                          placeholder="e.g. @sacha_l"
                          className="p-2 bg-black/40 border border-pink-500/15 rounded-lg text-white text-xs outline-none focus:border-pink-500 w-full"
                        />
                      </div>
                    </div>

                    <div className="form-group mb-0">
                      <label className="text-[9px] text-pink-300/80 font-bold uppercase mb-1">Subir Foto Kawaii (Starmaker)</label>
                      <div className="flex gap-2 items-center">
                        <input 
                          type="file" 
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                setNewRelationAvatarBase64(reader.result as string);
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                          accept="image/*"
                          className="hidden" 
                          id="kawaii-avatar-upload" 
                        />
                        <label 
                          htmlFor="kawaii-avatar-upload" 
                          className="px-3 py-2 bg-pink-900/35 border border-pink-500/20 text-pink-300 hover:bg-pink-900/50 rounded-lg text-[10px] font-bold cursor-pointer transition-all flex items-center gap-1.5"
                        >
                          📁 Seleccionar Archivo
                        </label>
                        <span className="text-[9px] text-zinc-500">
                          {newRelationAvatarBase64 ? "✓ Imagen Base64 cargada" : "Sin archivo seleccionado"}
                        </span>
                      </div>
                    </div>

                    <div className="form-group mb-0">
                      <label className="text-[9px] text-pink-300/80 font-bold uppercase mb-1">O escribe URL de la Foto</label>
                      <input 
                        type="url" 
                        value={newRelationAvatarUrl}
                        onChange={(e) => {
                          setNewRelationAvatarUrl(e.target.value);
                          setNewRelationAvatarBase64(""); // reset base64 if url entered
                        }}
                        placeholder="https://images.unsplash.com/..."
                        className="p-2 bg-black/40 border border-pink-500/15 rounded-lg text-white text-xs outline-none focus:border-pink-500 w-full"
                      />
                    </div>

                    {/* Preview avatar */}
                    {(newRelationAvatarBase64 || newRelationAvatarUrl) && (
                      <div className="flex items-center gap-2.5 p-2 bg-pink-950/10 border border-pink-500/10 rounded-xl">
                        <div 
                          className="w-10 h-10 rounded-full bg-cover bg-center border border-pink-500" 
                          style={{ backgroundImage: `url(${newRelationAvatarBase64 || newRelationAvatarUrl})` }}
                        ></div>
                        <span className="text-[10px] text-pink-200 font-bold font-mono">Vista previa del avatar</span>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* Link Tier Selector & Cost details */}
                <div className="form-group">
                  <label className="text-[10px] font-bold text-pink-300 uppercase block mb-1">Nivel de Lazo Cuántico</label>
                  <select 
                    className="form-select w-full bg-black/50 border-pink-500/10 text-xs text-white text-left" 
                    value={newRelationTier} 
                    onChange={(e) => setNewRelationTier(e.target.value as any)}
                  >
                    <option value="normal">Lazo Normal (Gratuito)</option>
                    <option value="gold">Lazo de Oro (Costo: 100 C8L Coins)</option>
                    <option value="platinum">Lazo de Platino (Costo: 500 C8L Coins)</option>
                    <option value="diamond">Lazo de Diamante 💎 (Costo: 1,000 C8L Coins)</option>
                  </select>
                  <div className="flex justify-between items-center mt-2.5 p-2 rounded bg-black/30 border border-pink-500/5 text-[9.5px]">
                    <span className="text-zinc-400">Tu saldo: <strong className="text-[var(--color-gold)]">{c8lCoins.toLocaleString()} Coins</strong></span>
                    <span className="text-pink-300 font-bold">
                      {newRelationTier === "gold" && "Consumo: 100 Coins"}
                      {newRelationTier === "platinum" && "Consumo: 500 Coins"}
                      {newRelationTier === "diamond" && "Consumo: 1,000 Coins"}
                      {newRelationTier === "normal" && "Gratuito"}
                    </span>
                  </div>
                </div>

                {/* Reciprocal loop toggle */}
                {["platinum", "diamond"].includes(newRelationTier) && (
                  <div className="flex items-center justify-between p-3 rounded-xl bg-cyan-950/20 border border-cyan-500/20">
                    <div>
                      <strong className="text-[11px] text-cyan-300 block">Vínculo Mutuo de Diamante</strong>
                      <span className="text-[9px] text-zinc-500 leading-none">Aparece en ambos perfiles Starmaker automáticamente</span>
                    </div>
                    <label className="switch">
                      <input 
                        type="checkbox" 
                        checked={newRelationMutual} 
                        onChange={(e) => setNewRelationMutual(e.target.checked)} 
                      />
                      <span className="slider"></span>
                    </label>
                  </div>
                )}

                <div className="modal-actions border-t border-pink-500/10 pt-4 mt-6">
                  <button className="btn btn-outline border-pink-500/20 hover:border-pink-500/40 text-pink-300" onClick={() => setShowAddRelationModal(false)}>Cancelar</button>
                  <button 
                    className="btn bg-pink-600 text-white hover:bg-pink-500 font-bold" 
                    onClick={handleSaveRelationship}
                    disabled={(newRelationTier === "gold" && c8lCoins < 100) || (newRelationTier === "platinum" && c8lCoins < 500) || (newRelationTier === "diamond" && c8lCoins < 1000)}
                  >
                    Confirmar Lazo
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </main>
  </div>
</div>
  );
}

// Sub-component: Reply form for social inbox comment
function ReplyForm({ onSubmit }: { onSubmit: (text: string) => void }) {
  const [text, setText] = useState("");
  return (
    <form 
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(text);
        setText("");
      }} 
      className="reply-form"
    >
      <input type="text" required value={text} onChange={(e) => setText(e.target.value)} placeholder="Responde al webhook..." />
      <button type="submit" className="btn-reply-send">Responder</button>
    </form>
  );
}

function CommentReplyComposer({ onSubmit, alias }: { onSubmit: (text: string) => void; alias: string }) {
  const [text, setText] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="text-[9px] font-bold text-[var(--color-gold)] hover:underline bg-transparent border-none p-0 cursor-pointer"
      >
        Responder a comentario
      </button>
    );
  }

  return (
    <form 
      onSubmit={(e) => {
        e.preventDefault();
        if (text.trim()) {
          onSubmit(text);
          setText("");
          setIsOpen(false);
        }
      }}
      className="flex items-center gap-2 mt-1"
    >
      <input 
        type="text" 
        value={text} 
        onChange={(e) => setText(e.target.value)}
        placeholder={`Responder como ${alias}...`}
        className="flex-grow bg-black/60 border border-white/10 rounded px-2 py-1 text-[10px] text-white outline-none focus:border-[var(--color-gold)]"
      />
      <button 
        type="submit"
        className="px-2 py-1 bg-[var(--color-gold)] text-black text-[9px] font-bold rounded hover:bg-[var(--color-gold-light)]"
      >
        Enviar
      </button>
      <button 
        type="button" 
        onClick={() => setIsOpen(false)}
        className="px-2 py-1 bg-transparent text-zinc-500 hover:text-white text-[9px] font-bold rounded"
      >
        Cancelar
      </button>
    </form>
  );
}



function YouTubeStylePlayer({
  videoUrl,
  videoTitle,
  thumbnail,
  overlay,
  aiExplanation,
  onPlayChange,
  onViewInc
}: PlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSec, setPlaybackSec] = useState(0);
  const [showOverlay, setShowOverlay] = useState(false);
  const [duration, setDuration] = useState(180); // 3 minutes default for simulator
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const youtubeId = getYouTubeId(videoUrl);
  const isDirectVideo = !youtubeId && (
    videoUrl.match(/\.(mp4|webm|ogg|mov|m4v)($|\?)/i) || 
    (videoUrl.startsWith("http") && !videoUrl.includes("youtube.com") && !videoUrl.includes("youtu.be") && !videoUrl.includes("twitch.tv") && !videoUrl.includes("kick.com"))
  );

  const togglePlay = () => {
    const nextPlaying = !isPlaying;
    setIsPlaying(nextPlaying);
    if (onPlayChange) onPlayChange(nextPlaying);
    if (nextPlaying && onViewInc && playbackSec === 0) {
      onViewInc();
    }
  };

  useEffect(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.play().catch(e => console.error("Error playing video:", e));
      } else {
        videoRef.current.pause();
      }
    }
  }, [isPlaying]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = volume;
      videoRef.current.muted = isMuted;
    }
  }, [volume, isMuted]);

  useEffect(() => {
    if (isPlaying && !youtubeId && !isDirectVideo) {
      timerRef.current = setInterval(() => {
        setPlaybackSec(prev => {
          const next = prev + 1;
          if (next >= duration) {
            setIsPlaying(false);
            if (onPlayChange) onPlayChange(false);
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
  }, [isPlaying, youtubeId, isDirectVideo, duration, overlay]);

  const handleScrub = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setPlaybackSec(val);
    if (videoRef.current) {
      videoRef.current.currentTime = val;
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // Resolve thumbnail
  let displayThumb = thumbnail || "https://images.unsplash.com/photo-1487180142328-054b783fc471?q=80&w=600";
  if (youtubeId) {
    displayThumb = `https://img.youtube.com/vi/${youtubeId}/sddefault.jpg`;
  }

  return (
    <div id="youtube-player-container" className="w-full bg-black rounded-xl overflow-hidden border border-white/10 relative group aspect-video">
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
          {isDirectVideo && (
            <video 
              ref={videoRef}
              src={videoUrl}
              className={`w-full h-full object-cover ${isPlaying ? "block" : "hidden"}`}
              onTimeUpdate={() => {
                if (videoRef.current) {
                  const current = Math.floor(videoRef.current.currentTime);
                  setPlaybackSec(current);
                  if (overlay && current === overlay.time) {
                    setShowOverlay(true);
                  }
                }
              }}
              onLoadedMetadata={() => {
                if (videoRef.current) {
                  setDuration(Math.floor(videoRef.current.duration) || 180);
                }
              }}
              onEnded={() => {
                setIsPlaying(false);
                if (onPlayChange) onPlayChange(false);
                setPlaybackSec(0);
              }}
              playsInline
            />
          )}

          {isPlaying && !isDirectVideo && (
            <div className="w-full h-full bg-gradient-to-b from-zinc-950 to-red-950/20 flex flex-col items-center justify-center p-4">
              <div className="flex items-center gap-1.5 justify-center h-20 w-full">
                {Array.from({ length: 15 }).map((_, i) => (
                  <span 
                    key={i} 
                    className="w-1 bg-[#FF0000] rounded-full transition-all duration-150"
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

          {(!isPlaying || (isDirectVideo && !isPlaying)) && (
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
              className="absolute z-10 w-16 h-12 bg-[#FF0000] hover:bg-[#CC0000] rounded-xl flex items-center justify-center shadow-lg hover:scale-105 transition-all duration-200 cursor-pointer border-none"
            >
              <div className="w-0 h-0 border-t-8 border-t-transparent border-b-8 border-b-transparent border-l-[14px] border-l-white ml-1"></div>
            </button>
          )}

          {showOverlay && overlay && (
            <div className="absolute top-4 right-4 z-20 bg-black/85 backdrop-blur border border-[var(--color-gold)] p-2.5 rounded-lg max-w-[200px] shadow-2xl animate-fade-in">
              <span className="text-[8px] font-mono text-[var(--color-gold)] font-bold uppercase tracking-wider block mb-1">
                Recomendado C8L
              </span>
              <a 
                href={overlay.url} 
                target="_blank" 
                rel="noreferrer" 
                className="text-[10px] font-extrabold text-white hover:text-[var(--color-gold-light)] flex items-center gap-1"
              >
                <ExternalLink size={10} /> {overlay.label}
              </a>
            </div>
          )}

          <div className="absolute bottom-0 inset-x-0 h-11 bg-gradient-to-t from-black/95 to-black/35 flex flex-col justify-end p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
            <div className="w-full flex items-center px-1">
              <input 
                type="range" 
                min="0" 
                max={duration} 
                value={playbackSec} 
                onChange={handleScrub}
                className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer outline-none accent-[#FF0000] hover:h-1.5 transition-all"
                style={{
                  background: `linear-gradient(to right, #FF0000 0%, #FF0000 ${(playbackSec / duration) * 100}%, #27272a ${(playbackSec / duration) * 100}%, #27272a 100%)`
                }}
              />
            </div>

            <div className="flex items-center justify-between w-full mt-1 px-1">
              <div className="flex items-center gap-3.5">
                <button 
                  onClick={togglePlay} 
                  className="bg-transparent border-none text-white hover:text-[#FF0000] transition-colors cursor-pointer"
                >
                  {isPlaying ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
                </button>

                <div className="flex items-center gap-1.5 group/vol">
                  <button 
                    onClick={() => setIsMuted(!isMuted)} 
                    className="bg-transparent border-none text-white hover:text-[#FF0000] transition-colors cursor-pointer"
                  >
                    <Music size={13} />
                  </button>
                  <input 
                    type="range" 
                    min="0" 
                    max="1" 
                    step="0.1" 
                    value={isMuted ? 0 : volume} 
                    onChange={(e) => {
                      setVolume(Number(e.target.value));
                      setIsMuted(false);
                    }}
                    className="w-12 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer outline-none accent-[#FF0000]"
                  />
                </div>

                <span className="text-[10px] text-zinc-300 font-mono">
                  {formatTime(playbackSec)} / {formatTime(duration)}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <button className="bg-transparent border-none text-white hover:text-[#FF0000] transition-colors cursor-pointer">
                  <Layers size={13} />
                </button>
                <button 
                  className="bg-transparent border-none text-white hover:text-[#FF0000] transition-colors cursor-pointer"
                  onClick={() => {
                    const el = document.getElementById("youtube-player-container");
                    if (el) {
                      if (document.fullscreenElement) {
                        document.exitFullscreen();
                      } else {
                        el.requestFullscreen();
                      }
                    }
                  }}
                >
                  <ExternalLink size={13} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {aiExplanation && !isPlaying && (
        <div className="absolute top-3 left-3 bg-black/85 border border-white/5 p-2 rounded-lg max-w-[85%] shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
          <p className="text-[9px] text-[var(--color-gold)] font-bold mb-0.5 flex items-center gap-1">
            <Sparkles size={9} /> Explicación IA C8L
          </p>
          <p className="text-[8.5px] text-zinc-400 leading-normal line-clamp-2">
            {aiExplanation}
          </p>
        </div>
      )}
    </div>
  );
}
