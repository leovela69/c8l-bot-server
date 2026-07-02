// app/feed/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home, Compass, Tv, Library, History, PlaySquare, Clock, ThumbsUp, 
  Search, Mic, ChevronDown, Flame, Music2, Gamepad2, Radio, 
  Newspaper, Trophy, Lightbulb, Plus, MoreVertical, Menu
} from 'lucide-react';
import { VideoCard } from '@/components/feed/VideoCard';
import { supabase } from '@/lib/supabase/client';
import { useApp } from '@/context/AppContext';

const CATEGORIES = [
  "Todos", "Música C8L", "Freestyle", "Beats", "En Vivo", 
  "Dembow", "Clases de DAW", "Salsa", "Trap", "Mixes", "Comunidad"
];

const MOCK_VIDEOS = [
  {
    id: "mock-1",
    title: "Leo Vela - Tan Solo Tú (Official Video) [C8L Records]",
    thumbnail_url: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=640",
    duration: 215,
    views: 12450,
    likes: 890,
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    is_live: false,
    user: {
      id: "leo_vela_uid",
      name: "Leo Vela 🦁",
      avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=150"
    }
  },
  {
    id: "mock-2",
    title: "DJ Rayo - Cyberpunk Beats Mix 2026 (Live set from Lounge #829)",
    thumbnail_url: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=640",
    duration: 3600,
    views: 8920,
    likes: 540,
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    is_live: false,
    user: {
      id: "dj_rayo_uid",
      name: "DJ Rayo ⚡",
      avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?q=80&w=150"
    }
  },
  {
    id: "mock-3",
    title: "Reina Melody - Dembow Espacial Duet Challenge! (Cover)",
    thumbnail_url: "https://images.unsplash.com/photo-1516280440614-37939bbacd6a?q=80&w=640",
    duration: 185,
    views: 24500,
    likes: 1820,
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    is_live: false,
    user: {
      id: "reina_melody_uid",
      name: "Reina Melody 👑",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=150"
    }
  },
  {
    id: "mock-4",
    title: "C8L TV Live: La Batalla PK Suprema (Leo Vela vs El Retador)",
    thumbnail_url: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?q=80&w=640",
    duration: 0,
    views: 1040,
    likes: 310,
    created_at: new Date().toISOString(),
    is_live: true,
    user: {
      id: "leo_vela_uid",
      name: "Leo Vela 🦁",
      avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=150"
    }
  },
  {
    id: "mock-5",
    title: "BeatMaster - How to use Web Audio DAW inside C8L Studio [Tutorial]",
    thumbnail_url: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?q=80&w=640",
    duration: 824,
    views: 3410,
    likes: 290,
    created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    is_live: false,
    user: {
      id: "beatmaster_uid",
      name: "BeatMaster 🎧",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=150"
    }
  },
  {
    id: "mock-6",
    title: "Zen Noise - Satori Protocol Ambient Loop [Relaxing Chill]",
    thumbnail_url: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?q=80&w=640",
    duration: 1200,
    views: 5900,
    likes: 410,
    created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    is_live: false,
    user: {
      id: "zen_noise_uid",
      name: "Zen Noise 🧘",
      avatar: "https://images.unsplash.com/photo-1628157582853-a796fa650a6a?q=80&w=150"
    }
  },
  {
    id: "mock-7",
    title: "Leo Vela - Ritmo Cuántico (Live from Lounge #10)",
    thumbnail_url: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=640",
    duration: 310,
    views: 4500,
    likes: 380,
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    is_live: false,
    user: {
      id: "leo_vela_uid",
      name: "Leo Vela 🦁",
      avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=150"
    }
  },
  {
    id: "mock-8",
    title: "DJ Rayo - Ziria Coins Electro Beatmix",
    thumbnail_url: "https://images.unsplash.com/photo-1487180142328-054b783fc471?q=80&w=640",
    duration: 1800,
    views: 7300,
    likes: 620,
    created_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    is_live: false,
    user: {
      id: "dj_rayo_uid",
      name: "DJ Rayo ⚡",
      avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?q=80&w=150"
    }
  },
  {
    id: "mock-9",
    title: "Sirenas del Delta - Canto de Sirena (Acapella Cover)",
    thumbnail_url: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=640",
    duration: 195,
    views: 12000,
    likes: 950,
    created_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    is_live: false,
    user: {
      id: "reina_melody_uid",
      name: "Reina Melody 👑",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=150"
    }
  },
  {
    id: "mock-10",
    title: "Quantum Lounge Jam - Freestyle Session feat. CyberLeo",
    thumbnail_url: "https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?q=80&w=640",
    duration: 480,
    views: 2900,
    likes: 195,
    created_at: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
    is_live: false,
    user: {
      id: "leo_vela_uid",
      name: "Leo Vela 🦁",
      avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=150"
    }
  },
  {
    id: "mock-11",
    title: "Ziria - Neón y Fuego (Official Lyric Video)",
    thumbnail_url: "https://images.unsplash.com/photo-1506157786151-b8491531f063?q=80&w=640",
    duration: 240,
    views: 18500,
    likes: 1420,
    created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    is_live: false,
    user: {
      id: "reina_melody_uid",
      name: "Reina Melody 👑",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=150"
    }
  },
  {
    id: "mock-12",
    title: "Leo Vela - Electro-Dembow Masterclass [C8L Studio]",
    thumbnail_url: "https://images.unsplash.com/photo-1598653222000-6b7b7a552625?q=80&w=640",
    duration: 1450,
    views: 9300,
    likes: 810,
    created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    is_live: false,
    user: {
      id: "leo_vela_uid",
      name: "Leo Vela 🦁",
      avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=150"
    }
  },
  {
    id: "mock-13",
    title: "La Resistencia Faction - Himno Oficial (Industrial Mix)",
    thumbnail_url: "https://images.unsplash.com/photo-1485579149621-3123dd979885?q=80&w=640",
    duration: 320,
    views: 3100,
    likes: 240,
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    is_live: false,
    user: {
      id: "beatmaster_uid",
      name: "BeatMaster 🎧",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=150"
    }
  },
  {
    id: "mock-14",
    title: "Cyberpunk Lofi Sessions - Ambient Beats to Study/Code",
    thumbnail_url: "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?q=80&w=640",
    duration: 7200,
    views: 14500,
    likes: 1100,
    created_at: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000).toISOString(),
    is_live: false,
    user: {
      id: "zen_noise_uid",
      name: "Zen Noise 🧘",
      avatar: "https://images.unsplash.com/photo-1628157582853-a796fa650a6a?q=80&w=150"
    }
  },
  {
    id: "mock-15",
    title: "Reina Melody - Salsa Cuántica (C8L Lounge Sessions)",
    thumbnail_url: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?q=80&w=640",
    duration: 280,
    views: 6400,
    likes: 510,
    created_at: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
    is_live: false,
    user: {
      id: "reina_melody_uid",
      name: "Reina Melody 👑",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=150"
    }
  },
  {
    id: "mock-16",
    title: "DAW Tutorial - Sintesis granular con Web Audio API",
    thumbnail_url: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?q=80&w=640",
    duration: 950,
    views: 4200,
    likes: 310,
    created_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    is_live: false,
    user: {
      id: "beatmaster_uid",
      name: "BeatMaster 🎧",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=150"
    }
  }
];

export default function FeedPage() {
  const { language, showNotification } = useApp();
  const [videos, setVideos] = useState<any[]>([]);
  
  // Upload modal states
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadUrl, setUploadUrl] = useState("");
  const [uploadThumb, setUploadThumb] = useState("");
  const [uploadDesc, setUploadDesc] = useState("");
  const [uploadDuration, setUploadDuration] = useState("180");
  const [uploadLoading, setUploadLoading] = useState(false);

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadTitle.trim() || !uploadUrl.trim()) {
      showNotification(language === "es" ? "Por favor rellena los campos obligatorios." : "Please fill out required fields.", "error");
      return;
    }
    setUploadLoading(true);
    try {
      const newVideo = {
        id: `db-${Date.now()}`,
        title: uploadTitle,
        thumbnail_url: uploadThumb || "https://images.unsplash.com/photo-1614680376593-902f74fa0d41?q=80&w=640",
        duration: parseInt(uploadDuration, 10) || 180,
        views: 0,
        likes: 0,
        created_at: new Date().toISOString(),
        is_live: false,
        video_url: uploadUrl,
        user: {
          id: "mock-user-id",
          name: "Tú (Creador C8L)",
          avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=150"
        }
      };
      setVideos(prev => [newVideo, ...prev]);
      const { error } = await supabase.from('videos').insert({
        title: uploadTitle,
        thumbnail_url: uploadThumb,
        duration: parseInt(uploadDuration, 10) || 180,
        video_url: uploadUrl,
        is_private: false
      });
      if (error) console.warn("Supabase insert error (falling back to memory):", error);
      showNotification(language === "es" ? "¡Video subido a C8L TV con éxito!" : "Video uploaded to C8L TV successfully!", "success");
      setShowUploadModal(false);
      setUploadTitle("");
      setUploadUrl("");
      setUploadThumb("");
      setUploadDesc("");
    } catch (err) {
      console.error(err);
      showNotification("Error al procesar la subida.", "error");
    } finally {
      setUploadLoading(false);
    }
  };
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("Todos");
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadVideos() {
      try {
        setLoading(true);
        const { data } = await supabase
          .from('videos')
          .select('*, user:user_id(name, avatar)')
          .eq('is_private', false)
          .order('created_at', { ascending: false });
        
        // Map database records into expected shape
        const dbVideos = (data || []).map(v => ({
          id: v.id,
          title: v.title,
          thumbnail_url: v.thumbnail_url || 'https://images.unsplash.com/photo-1614680376593-902f74fa0d41?q=80&w=640',
          duration: v.duration || 0,
          views: v.views || 0,
          likes: v.likes || 0,
          created_at: v.created_at,
          is_live: v.is_live || false,
          user: {
            id: v.user?.id || 'anon',
            name: v.user?.name || 'Creador C8L',
            avatar: v.user?.avatar || '🎤'
          }
        }));

        setVideos(dbVideos);
      } catch (e) {
        console.error("Error loading videos:", e);
      } finally {
        setLoading(false);
      }
    }

    loadVideos();
  }, []);

  // Filter videos based on Search Query and Category
  const filteredVideos = [...videos, ...MOCK_VIDEOS].filter(video => {
    const matchesSearch = video.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          video.user.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = activeCategory === "Todos" || 
      (activeCategory === "Música C8L" && (video.title.toLowerCase().includes("records") || video.title.toLowerCase().includes("video"))) ||
      (activeCategory === "Freestyle" && video.title.toLowerCase().includes("freestyle")) ||
      (activeCategory === "Beats" && video.title.toLowerCase().includes("beats")) ||
      (activeCategory === "En Vivo" && video.is_live) ||
      (activeCategory === "Dembow" && video.title.toLowerCase().includes("dembow")) ||
      (activeCategory === "Clases de DAW" && video.title.toLowerCase().includes("daw")) ||
      (activeCategory === "Mixes" && video.title.toLowerCase().includes("mix")) ||
      (activeCategory === "Comunidad" && (video.id.startsWith("mock-") === false));

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-[#030303] text-white flex flex-col pt-24 pb-20 md:pb-10 font-sans select-none">
      {/* Top Search Area */}
      <div className="w-full bg-[#030303] border-b border-white/5 py-4 px-6 flex justify-center items-center gap-4 z-20">
        <button 
          onClick={() => setSidebarExpanded(!sidebarExpanded)} 
          className="hidden md:flex p-2 hover:bg-white/5 rounded-full text-zinc-400 hover:text-white transition"
          title="Colapsar Menú"
        >
          <Menu size={20} />
        </button>

        {/* Youtube-style Center Search Bar */}
        <div className="flex items-center w-full max-w-[600px]">
          <div className="flex flex-grow bg-[#121212] border border-white/10 rounded-l-full overflow-hidden focus-within:border-[var(--color-neon-blue)] focus-within:shadow-[0_0_10px_rgba(0,243,255,0.2)] transition-all">
            <input
              type="text"
              placeholder={language === "es" ? "Buscar creadores o videos en C8L TV..." : "Search C8L TV creators or videos..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent px-5 py-2.5 text-sm outline-none text-white placeholder-zinc-500"
            />
          </div>
          <button 
            className="px-6 py-2.5 bg-zinc-800 border-t border-b border-r border-white/10 rounded-r-full hover:bg-zinc-700 transition flex items-center justify-center text-zinc-400 hover:text-white"
            title="Buscar"
          >
            <Search size={18} />
          </button>
        </div>

        <button 
          className="p-3 bg-zinc-800/80 hover:bg-zinc-700 hover:shadow-[0_0_12px_rgba(212,175,55,0.3)] rounded-full text-zinc-300 hover:text-[var(--color-gold)] transition flex items-center justify-center cursor-pointer"
          title="Búsqueda por Voz"
        >
          <Mic size={16} />
        </button>

        <button 
          onClick={() => setShowUploadModal(true)}
          className="px-4 py-2.5 bg-[#00F3FF] hover:bg-cyan-300 text-black text-xs font-heading font-black uppercase rounded-full tracking-wider transition flex items-center gap-1.5 cursor-pointer shadow-[2px_2px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] shrink-0"
          title="Subir nuevo video"
        >
          <Plus size={14} />
          <span>Subir</span>
        </button>
      </div>

      <div className="flex flex-1 relative items-stretch">
        
        {/* Collapsible Left Navigation (YouTube Sidebar style) */}
        <aside className={`hidden md:flex flex-col bg-[#030303] border-r border-white/5 shrink-0 transition-all duration-300 ${
          sidebarExpanded ? 'w-64 px-4' : 'w-16 px-1'
        } py-4 gap-6 select-none overflow-y-auto no-scrollbar h-[calc(100vh-140px)] sticky top-36`}>
          
          {/* Main items */}
          <div className="flex flex-col gap-1">
            <button className="flex items-center gap-4 px-3 py-2.5 rounded-xl bg-white/5 text-white font-bold text-xs uppercase tracking-wider text-left">
              <Home size={18} className="text-[var(--color-neon-blue)]" />
              {sidebarExpanded && <span>Inicio</span>}
            </button>
            <button className="flex items-center gap-4 px-3 py-2.5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 font-semibold text-xs uppercase tracking-wider text-left transition">
              <Compass size={18} />
              {sidebarExpanded && <span>Explorar</span>}
            </button>
            <button className="flex items-center gap-4 px-3 py-2.5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 font-semibold text-xs uppercase tracking-wider text-left transition">
              <Tv size={18} />
              {sidebarExpanded && <span>Suscripciones</span>}
            </button>
          </div>

          <div className="h-[1px] bg-white/5"></div>

          {/* Library Section */}
          <div className="flex flex-col gap-1">
            {sidebarExpanded && <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest font-black px-3 mb-2">Biblioteca</span>}
            <button className="flex items-center gap-4 px-3 py-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 font-semibold text-xs text-left transition">
              <Library size={16} />
              {sidebarExpanded && <span>Biblioteca</span>}
            </button>
            <button className="flex items-center gap-4 px-3 py-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 font-semibold text-xs text-left transition">
              <History size={16} />
              {sidebarExpanded && <span>Historial</span>}
            </button>
            <button className="flex items-center gap-4 px-3 py-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 font-semibold text-xs text-left transition">
              <PlaySquare size={16} />
              {sidebarExpanded && <span>Mis Videos</span>}
            </button>
            <button className="flex items-center gap-4 px-3 py-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 font-semibold text-xs text-left transition">
              <Clock size={16} />
              {sidebarExpanded && <span>Ver más tarde</span>}
            </button>
            <button className="flex items-center gap-4 px-3 py-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 font-semibold text-xs text-left transition">
              <ThumbsUp size={16} />
              {sidebarExpanded && <span>Videos gustados</span>}
            </button>
          </div>

          {sidebarExpanded && (
            <>
              <div className="h-[1px] bg-white/5"></div>
              
              {/* Mock Channels Subscriptions */}
              <div className="flex flex-col gap-1 text-left">
                <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest font-black px-3 mb-2">Suscripciones</span>
                {[
                  { name: "Leo Vela 🦁", avatar: "🦁", active: true },
                  { name: "DJ Rayo ⚡", avatar: "⚡", active: true },
                  { name: "Reina Melody 👑", avatar: "👑", active: false },
                  { name: "BeatMaster 🎧", avatar: "🎧", active: true }
                ].map((channel, i) => (
                  <button key={i} className="flex items-center justify-between px-3 py-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 font-semibold text-xs text-left transition">
                    <div className="flex items-center gap-3">
                      <span className="text-base bg-zinc-900 w-6 h-6 rounded-full flex items-center justify-center">{channel.avatar}</span>
                      <span>{channel.name}</span>
                    </div>
                    {channel.active && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>}
                  </button>
                ))}
              </div>

              <div className="h-[1px] bg-white/5"></div>

              {/* Explore Section */}
              <div className="flex flex-col gap-1 text-left">
                <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest font-black px-3 mb-2">Explorar</span>
                <button className="flex items-center gap-3 px-3 py-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 text-xs transition"><Flame size={15} /> Tendencias</button>
                <button className="flex items-center gap-3 px-3 py-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 text-xs transition"><Music2 size={15} /> Música</button>
                <button className="flex items-center gap-3 px-3 py-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 text-xs transition"><Gamepad2 size={15} /> Videojuegos</button>
                <button className="flex items-center gap-3 px-3 py-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 text-xs transition"><Radio size={15} /> Directos</button>
                <button className="flex items-center gap-3 px-3 py-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 text-xs transition"><Newspaper size={15} /> Noticias</button>
                <button className="flex items-center gap-3 px-3 py-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 text-xs transition"><Trophy size={15} /> Deportes</button>
                <button className="flex items-center gap-3 px-3 py-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 text-xs transition"><Lightbulb size={15} /> Aprendizaje</button>
              </div>
            </>
          )}
        </aside>

        {/* Right Main Feed panel */}
        <main className="flex-grow px-6 py-6 overflow-x-hidden flex flex-col gap-6">
          
          {/* Categories Pill Horizontal Bar */}
          <div className="w-full overflow-x-auto no-scrollbar py-1">
            <div className="flex gap-2.5 whitespace-nowrap">
              {CATEGORIES.map(category => (
                <button
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  className={`px-4 py-2 rounded-full text-xs font-semibold tracking-wider transition cursor-pointer ${
                    activeCategory === category
                      ? 'bg-white text-black font-bold shadow-[0_0_12px_rgba(255,255,255,0.2)]'
                      : 'bg-zinc-900 border border-white/5 text-zinc-400 hover:bg-zinc-800 hover:text-white'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* Heading */}
          <div className="flex justify-between items-center mt-2 border-b border-white/5 pb-4">
            <h2 className="text-xl font-black font-heading uppercase tracking-wide flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[var(--color-neon-blue)] animate-pulse"></span>
              <span>C8L TV RECOMIENDA</span>
            </h2>
            <span className="text-zinc-500 font-mono text-[10px] uppercase">
              {filteredVideos.length} {language === "es" ? "Videos encontrados" : "Videos found"}
            </span>
          </div>

          {/* Main Grid View */}
          {loading ? (
            <div className="flex-grow flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-10 h-10 border-t-2 border-[var(--color-gold)] rounded-full animate-spin"></div>
              <span className="text-zinc-500 font-mono text-xs uppercase tracking-widest">Cargando grilla...</span>
            </div>
          ) : filteredVideos.length === 0 ? (
            <div className="flex-grow flex flex-col items-center justify-center py-24 text-center border border-dashed border-white/10 rounded-3xl bg-black/40">
              <span className="text-5xl mb-4">📺</span>
              <h3 className="font-heading font-black text-lg text-white uppercase">{language === "es" ? "No se encontraron videos" : "No videos found"}</h3>
              <p className="text-xs text-zinc-500 max-w-xs mt-1">
                {language === "es" ? "Intenta modificar tu consulta o escoge otra categoría de la barra superior." : "Try adjusting your search query or picking another category."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-5 gap-y-10">
              {filteredVideos.map(video => (
                <VideoCard key={video.id} video={video} />
              ))}
            </div>
          )}

        </main>
      </div>

      {/* Sticky Bottom Bar for Mobile Device viewports (YouTube Mobile clone style) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-zinc-950/95 backdrop-blur-md border-t border-white/10 flex justify-around py-3 text-[9px] text-zinc-400 font-bold uppercase tracking-widest shadow-[0_-5px_15px_rgba(0,0,0,0.8)]">
        <button className="flex flex-col items-center gap-1 text-[var(--color-neon-blue)]">
          <Home size={16} />
          <span>Inicio</span>
        </button>
        <button className="flex flex-col items-center gap-1 hover:text-white transition">
          <Compass size={16} />
          <span>Shorts</span>
        </button>
        <button className="flex flex-col items-center gap-0.5 text-zinc-300 hover:text-white transition">
          <Plus size={20} className="border-2 border-white rounded-full p-0.5" />
          <span>Crear</span>
        </button>
        <button className="flex flex-col items-center gap-1 hover:text-white transition">
          <Tv size={16} />
          <span>Suscritos</span>
        </button>
        <button className="flex flex-col items-center gap-1 hover:text-white transition">
          <Library size={16} />
          <span>Librería</span>
        </button>
      </nav>

      {/* Upload Video Modal */}
      <AnimatePresence>
        {showUploadModal && (
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
              className="w-full max-w-lg bg-[#0d0d0e] border-3 border-black p-6 rounded-lg shadow-[6px_6px_0px_#00F3FF]"
            >
              <div className="flex justify-between items-center border-b-2 border-black pb-3 mb-6">
                <h3 className="font-heading font-black text-lg text-[#00F3FF] uppercase tracking-wider">Subir Video a C8L TV</h3>
                <button 
                  onClick={() => setShowUploadModal(false)}
                  className="text-zinc-500 hover:text-white transition font-bold"
                >
                  [CERRAR]
                </button>
              </div>

              <form onSubmit={handleUploadSubmit} className="space-y-4 text-left">
                <div>
                  <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block mb-1">Título del Video *</label>
                  <input
                    type="text"
                    required
                    value={uploadTitle}
                    onChange={(e) => setUploadTitle(e.target.value)}
                    className="w-full bg-black border-2 border-black px-3 py-2 text-xs outline-none text-white focus:border-[#00F3FF] rounded"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block mb-1">URL del Video (YouTube o MP4) *</label>
                  <input
                    type="url"
                    required
                    value={uploadUrl}
                    onChange={(e) => setUploadUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="w-full bg-black border-2 border-black px-3 py-2 text-xs outline-none text-white focus:border-[#00F3FF] rounded"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block mb-1">Miniatura URL (Opcional)</label>
                  <input
                    type="url"
                    value={uploadThumb}
                    onChange={(e) => setUploadThumb(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full bg-black border-2 border-black px-3 py-2 text-xs outline-none text-white focus:border-[#00F3FF] rounded"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block mb-1">Duración (segundos)</label>
                    <input
                      type="number"
                      value={uploadDuration}
                      onChange={(e) => setUploadDuration(e.target.value)}
                      className="w-full bg-black border-2 border-black px-3 py-2 text-xs outline-none text-white focus:border-[#00F3FF] rounded"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block mb-1">Categoría</label>
                    <select className="w-full bg-black border-2 border-black px-3 py-2 text-xs outline-none text-zinc-400 focus:border-[#00F3FF] rounded">
                      <option>Música C8L</option>
                      <option>Freestyle</option>
                      <option>Beats</option>
                      <option>Comunidad</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block mb-1">Descripción</label>
                  <textarea
                    value={uploadDesc}
                    onChange={(e) => setUploadDesc(e.target.value)}
                    rows={3}
                    className="w-full bg-black border-2 border-black px-3 py-2 text-xs outline-none text-white focus:border-[#00F3FF] rounded resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={uploadLoading}
                  className="w-full mt-2 py-3 bg-[#00F3FF] text-black font-heading font-black text-sm border-2 border-black shadow-[3px_3px_0px_#000] disabled:opacity-50 hover:bg-cyan-300 transition-all cursor-pointer"
                >
                  {uploadLoading ? 'SUBIENDO ENLACE...' : '🚀 PUBLICAR VIDEO EN FEED'}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}