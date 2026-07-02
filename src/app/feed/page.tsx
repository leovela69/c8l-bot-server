// app/feed/page.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home, Compass, Tv, Library, History, PlaySquare, Clock, ThumbsUp, 
  Search, Mic, ChevronDown, Flame, Music2, Gamepad2, Radio, 
  Newspaper, Trophy, Lightbulb, Plus, MoreVertical, Menu, Upload,
  Sliders, Sparkles, Film
} from 'lucide-react';
import { VideoCard } from '@/components/feed/VideoCard';
import { C8LTVLogo } from '@/components/ui/C8LTVLogo';
import QuantumMediaCreator from '@/components/ui/QuantumMediaCreator';
// SocialSimulator eliminado: videos de simulación se cargan automáticamente
import { supabase } from '@/lib/supabase/client';
import { useApp } from '@/context/AppContext';
import { useScrollReset } from '@/hooks/useScrollReset';

const CATEGORIES = [
  "Todas", "Música", "C8L Live", "Beat", "En Vivo", "Dom", "Bow", "Cluster", "Freestyle", "Beats", "Salsa", "Trap", "Mixes", "Comunidad"
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
    views: 1840,
    likes: 310,
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
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
  },
  {
    id: "mock-17",
    title: "Leo Vela - Fuego en el Alma (Official Video) [C8L Records]",
    thumbnail_url: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=640",
    duration: 240,
    views: 18500,
    likes: 1420,
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    is_live: false,
    user: {
      id: "leo_vela_uid",
      name: "Leo Vela 🦁",
      avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=150"
    }
  },
  {
    id: "mock-18",
    title: "DJ Rayo - Techno Industrial Sessions Lounge #22 [Beats]",
    thumbnail_url: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=640",
    duration: 3600,
    views: 8900,
    likes: 540,
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    is_live: false,
    user: {
      id: "dj_rayo_uid",
      name: "DJ Rayo ⚡",
      avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?q=80&w=150"
    }
  },
  {
    id: "mock-19",
    title: "Reina Melody - Salsa del Futuro (Dembow Mix) [C8L Live]",
    thumbnail_url: "https://images.unsplash.com/photo-1516280440614-37939bbacd6a?q=80&w=640",
    duration: 215,
    views: 15400,
    likes: 1200,
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    is_live: false,
    user: {
      id: "reina_melody_uid",
      name: "Reina Melody 👑",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=150"
    }
  },
  {
    id: "mock-20",
    title: "BeatMaster - Synth Wave Construction DAW Tutorial [Cluster]",
    thumbnail_url: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?q=80&w=640",
    duration: 1200,
    views: 3410,
    likes: 290,
    created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    is_live: false,
    user: {
      id: "beatmaster_uid",
      name: "BeatMaster 🎧",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=150"
    }
  },
  {
    id: "mock-21",
    title: "Zen Noise - Mind Waves (Satori Protocol Dom Loop) [Relaxing Lofi]",
    thumbnail_url: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?q=80&w=640",
    duration: 5400,
    views: 4200,
    likes: 310,
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    is_live: false,
    user: {
      id: "zen_noise_uid",
      name: "Zen Noise 🧘",
      avatar: "https://images.unsplash.com/photo-1628157582853-a796fa650a6a?q=80&w=150"
    }
  },
  {
    id: "mock-22",
    title: "La Resistencia Faction - Rebel Beat (Bow Mix) [Industrial Bass]",
    thumbnail_url: "https://images.unsplash.com/photo-1485579149621-3123dd979885?q=80&w=640",
    duration: 280,
    views: 6300,
    likes: 510,
    created_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    is_live: false,
    user: {
      id: "dj_rayo_uid",
      name: "DJ Rayo ⚡",
      avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?q=80&w=150"
    }
  },
  {
    id: "mock-23",
    title: "Leo Vela - Ritmo de la Noche [C8L TV Live Session]",
    thumbnail_url: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?q=80&w=640",
    duration: 0,
    views: 12450,
    likes: 890,
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    is_live: true,
    user: {
      id: "leo_vela_uid",
      name: "Leo Vela 🦁",
      avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=150"
    }
  },
  {
    id: "mock-24",
    title: "Ziria - Corazones Locos (Beat Remix) [Música C8L]",
    thumbnail_url: "https://images.unsplash.com/photo-1506157786151-b8491531f063?q=80&w=640",
    duration: 310,
    views: 24500,
    likes: 1820,
    created_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    is_live: false,
    user: {
      id: "reina_melody_uid",
      name: "Reina Melody 👑",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=150"
    }
  },
  {
    id: "mock-25",
    title: "CyberLeo - Freestyle Showdown PK Battle [C8L Live]",
    thumbnail_url: "https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?q=80&w=640",
    duration: 480,
    views: 7600,
    likes: 620,
    created_at: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
    is_live: false,
    user: {
      id: "leo_vela_uid",
      name: "Leo Vela 🦁",
      avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=150"
    }
  },
  {
    id: "mock-26",
    title: "Reina Melody - Salsa Espacial (Cover Version) [Salsa]",
    thumbnail_url: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?q=80&w=640",
    duration: 195,
    views: 12000,
    likes: 950,
    created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    is_live: false,
    user: {
      id: "reina_melody_uid",
      name: "Reina Melody 👑",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=150"
    }
  }
];

export default function FeedPage() {
  useScrollReset();
  const { language, showNotification, user } = useApp();
  const [videos, setVideos] = useState<any[]>([]);
  
  // Upload modal states
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadUrl, setUploadUrl] = useState("");
  const [uploadThumb, setUploadThumb] = useState("");
  const [uploadDesc, setUploadDesc] = useState("");
  const [uploadDuration, setUploadDuration] = useState("180");
  const [uploadCategory, setUploadCategory] = useState("Comunidad");
  const [uploadLoading, setUploadLoading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingLocalFile, setUploadingLocalFile] = useState(false);
  const [localFileUploadedName, setLocalFileUploadedName] = useState("");

  // Creator Studio & Editing States
  const [showStudioModal, setShowStudioModal] = useState(false);
  const [showAiThumbGen, setShowAiThumbGen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<any | null>(null);
  const [isEditingAiThumb, setIsEditingAiThumb] = useState(false);
  
  // Edit Form States
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editThumb, setEditThumb] = useState("");
  const [editUrl, setEditUrl] = useState("");
  const [editDuration, setEditDuration] = useState("180");
  const [editIsPrivate, setEditIsPrivate] = useState(false);
  const [editCategory, setEditCategory] = useState("Comunidad");

  const handleLocalFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingLocalFile(true);
    setLocalFileUploadedName("");
    try {
      const fileExt = file.name.split('.').pop() || 'mp4';
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
      
      const { data, error } = await supabase.storage.from('videos').upload(fileName, file);
      if (error) throw error;

      const { data: publicUrlData } = supabase.storage.from('videos').getPublicUrl(fileName);
      const url = publicUrlData?.publicUrl || '';
      
      setUploadUrl(url);
      setLocalFileUploadedName(file.name);
      
      if (!uploadTitle.trim()) {
        const titleWithoutExt = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
        setUploadTitle(titleWithoutExt);
      }
      
      showNotification(language === "es" ? "¡Archivo subido y enlazado correctamente!" : "File uploaded and linked successfully!", "success");
    } catch (err: any) {
      console.error("Local file upload error:", err);
      showNotification(language === "es" ? `Error al subir archivo: ${err.message}` : `Upload failed: ${err.message}`, "error");
    } finally {
      setUploadingLocalFile(false);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadTitle.trim()) {
      showNotification(language === "es" ? "Por favor escribe un título." : "Please write a title.", "error");
      return;
    }
    if (!uploadUrl.trim() && !localFileUploadedName) {
      showNotification(language === "es" ? "Por favor sube un archivo local o escribe una URL." : "Please upload a file or write a URL.", "error");
      return;
    }
    
    setUploadLoading(true);
    try {
      const videoId = `custom-${Date.now()}`;
      const newVideo = {
        id: videoId,
        title: uploadTitle,
        thumbnail_url: uploadThumb || "https://images.unsplash.com/photo-1614680376593-902f74fa0d41?q=80&w=640",
        duration: parseInt(uploadDuration, 10) || 180,
        views: 0,
        likes: 0,
        created_at: new Date().toISOString(),
        is_live: false,
        video_url: uploadUrl,
        category: uploadCategory,
        description: uploadDesc,
        user: {
          id: (user as any)?.uid || (user as any)?.id || "mock-user-id",
          name: user?.displayName || (user as any)?.name || "Tú (Creador C8L)",
          avatar: user?.photoURL || (user as any)?.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=150"
        }
      };

      // Guardar localmente para evitar pérdidas de videos al refrescar la pantalla
      if (typeof window !== "undefined") {
        const customVideos = JSON.parse(localStorage.getItem('c8l-tv-custom-videos') || '[]');
        localStorage.setItem('c8l-tv-custom-videos', JSON.stringify([newVideo, ...customVideos]));
      }

      setVideos(prev => [newVideo, ...prev]);

      const { error } = await supabase.from('videos').insert({
        user_id: (user as any)?.uid || (user as any)?.id || null,
        title: uploadTitle,
        thumbnail_url: uploadThumb,
        duration: parseInt(uploadDuration, 10) || 180,
        video_url: uploadUrl,
        is_private: false,
        category: uploadCategory,
        description: uploadDesc
      });
      if (error) console.warn("Supabase insert error (falling back to memory):", error);
      
      showNotification(language === "es" ? "¡Video subido a C8L TV con éxito!" : "Video uploaded to C8L TV successfully!", "success");
      setShowUploadModal(false);
      setUploadTitle("");
      setUploadUrl("");
      setUploadThumb("");
      setUploadDesc("");
      setUploadCategory("Comunidad");
      setLocalFileUploadedName("");
    } catch (err) {
      console.error(err);
      showNotification("Error al procesar la subida.", "error");
    } finally {
      setUploadLoading(false);
    }
  };

  const startEditingVideo = (video: any) => {
    setEditingVideo(video);
    setEditTitle(video.title || "");
    setEditDesc(video.description || "");
    setEditThumb(video.thumbnail_url || "");
    setEditUrl(video.video_url || "");
    setEditDuration(String(video.duration || 180));
    setEditIsPrivate(video.is_private || false);
    setEditCategory(video.category || "Comunidad");
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVideo || !editTitle.trim()) {
      showNotification(language === "es" ? "Por favor escribe un título." : "Please write a title.", "error");
      return;
    }

    try {
      // 1. Actualizar estado en memoria
      setVideos(prev => prev.map(v => {
        if (v.id === editingVideo.id) {
          return {
            ...v,
            title: editTitle,
            description: editDesc,
            thumbnail_url: editThumb || "https://images.unsplash.com/photo-1614680376593-902f74fa0d41?q=80&w=640",
            video_url: editUrl,
            duration: parseInt(editDuration, 10) || 180,
            is_private: editIsPrivate,
            category: editCategory
          };
        }
        return v;
      }));

      // 2. Actualizar en localStorage
      if (typeof window !== "undefined") {
        const customVideos = JSON.parse(localStorage.getItem('c8l-tv-custom-videos') || '[]');
        const updated = customVideos.map((v: any) => {
          if (v.id === editingVideo.id) {
            return {
              ...v,
              title: editTitle,
              thumbnail_url: editThumb,
              video_url: editUrl,
              description: editDesc,
              duration: parseInt(editDuration, 10) || 180,
              is_private: editIsPrivate,
              category: editCategory
            };
          }
          return v;
        });
        localStorage.setItem('c8l-tv-custom-videos', JSON.stringify(updated));
      }

      // 3. Actualizar en la base de datos Supabase
      const isCustomOnly = String(editingVideo.id).startsWith("custom-") || String(editingVideo.id).startsWith("mock-") || String(editingVideo.id).startsWith("sim-");
      if (!isCustomOnly) {
        const { error } = await supabase
          .from('videos')
          .update({
            title: editTitle,
            thumbnail_url: editThumb,
            video_url: editUrl,
            duration: parseInt(editDuration, 10) || 180,
            is_private: editIsPrivate,
            category: editCategory,
            description: editDesc
          })
          .eq('id', editingVideo.id);
        if (error) console.warn("Supabase update error:", error);
      }

      showNotification(language === "es" ? "¡Video actualizado con éxito!" : "Video updated successfully!", "success");
      setEditingVideo(null);
    } catch (err) {
      console.error(err);
      showNotification("Error al actualizar el video.", "error");
    }
  };

  const handleDeleteVideo = async (videoId: string) => {
    if (!confirm(language === "es" ? "¿Estás seguro de que deseas eliminar este video permanentemente?" : "Are you sure you want to permanently delete this video?")) {
      return;
    }

    try {
      // 1. Quitar del estado
      setVideos(prev => prev.filter(v => v.id !== videoId));

      // 2. Eliminar del localStorage
      if (typeof window !== "undefined") {
        const customVideos = JSON.parse(localStorage.getItem('c8l-tv-custom-videos') || '[]');
        const updated = customVideos.filter((v: any) => v.id !== videoId);
        localStorage.setItem('c8l-tv-custom-videos', JSON.stringify(updated));
      }

      // 3. Eliminar de Supabase
      const isCustomOnly = String(videoId).startsWith("custom-") || String(videoId).startsWith("mock-") || String(videoId).startsWith("sim-");
      if (!isCustomOnly) {
        const { error } = await supabase
          .from('videos')
          .delete()
          .eq('id', videoId);
        if (error) console.warn("Supabase delete error:", error);
      }

      showNotification(language === "es" ? "¡Video eliminado con éxito!" : "Video deleted successfully!", "success");
    } catch (err) {
      console.error(err);
      showNotification("Error al eliminar el video.", "error");
    }
  };
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("Todas");
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<"home" | "explore" | "subscriptions" | "library" | "history" | "my_videos" | "watch_later" | "liked_videos">("home");
  const [ytVideos, setYtVideos] = useState<any[]>([]);
  const [isSearchingYt, setIsSearchingYt] = useState(false);
  const [subscribedChannels, setSubscribedChannels] = useState<string[]>([]);

  // Pagination states
  const PAGE_SIZE = 8;
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadMoreRef, setLoadMoreRef] = useState<HTMLDivElement | null>(null);

  // Load subscriptions on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const subs = JSON.parse(localStorage.getItem('c8l-tv-subs') || '[]');
      if (subs.length === 0) {
        const defaultSubs = ["Leo Vela 🦁", "DJ Rayo ⚡", "BeatMaster 🎧"];
        localStorage.setItem('c8l-tv-subs', JSON.stringify(defaultSubs));
        setSubscribedChannels(defaultSubs);
      } else {
        setSubscribedChannels(subs);
      }
    }
  }, [activeView]); // reload when switching views

  const handleSearchSubmit = async () => {
    if (!searchQuery.trim()) {
      setYtVideos([]);
      return;
    }
    setIsSearchingYt(true);
    
    // Simulate YouTube search load and generate results client-side
    setTimeout(() => {
      const topic = searchQuery.trim();
      const topicUpper = topic.toUpperCase();
      
      const generated = [
        {
          id: `yt-dQw4w9WgXcQ`,
          title: `[YouTube] Cyberpunk Lofi Beats - Coding Session Mix (${topicUpper})`,
          thumbnail_url: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?q=80&w=640',
          duration: 3600,
          views: 125000,
          likes: 9500,
          created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          is_live: false,
          video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          description: `Official Cyberpunk Lofi Beats session themed around ${topic}. Perfect for coding and studying.`,
          user: {
            id: 'yt_ch_cyberlofi',
            name: 'CyberLofi Production 🎧',
            avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150'
          }
        },
        {
          id: `yt-9G6l5BfA9Z0`,
          title: `[YouTube] Leo Vela Live Tribute DJ Set (${topic} special remix)`,
          thumbnail_url: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=640',
          duration: 1800,
          views: 45000,
          likes: 3800,
          created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          is_live: false,
          video_url: 'https://www.youtube.com/watch?v=9G6l5BfA9Z0',
          description: `Live electronic set from Madrid. Presenting exclusive edits of local beats and dembow.`,
          user: {
            id: 'yt_ch_djay',
            name: 'DJ Rayo Fans ⚡',
            avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=150'
          }
        },
        {
          id: `yt-y6120QOlsfU`,
          title: `[YouTube] HOW TO SYNTHESIZE AUDIO - React & Web Audio API Tutorial`,
          thumbnail_url: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?q=80&w=640',
          duration: 540,
          views: 8900,
          likes: 670,
          created_at: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
          is_live: false,
          video_url: 'https://www.youtube.com/watch?v=y6120QOlsfU',
          description: `Step-by-step developer tutorial showing how to build modular synthesizer plugins inside the browser.`,
          user: {
            id: 'yt_ch_devsynth',
            name: 'Code & Audio Labs 🎹',
            avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=150'
          }
        },
        {
          id: `yt-jNQXAC9IVRw`,
          title: `[YouTube] ${topicUpper} - Ultimate Gaming Soundtrack 2026`,
          thumbnail_url: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?q=80&w=640',
          duration: 2400,
          views: 762000,
          likes: 45000,
          created_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
          is_live: false,
          video_url: 'https://www.youtube.com/watch?v=jNQXAC9IVRw',
          description: `High energy background music for esports, competitive play, and synthwave projects.`,
          user: {
            id: 'yt_ch_gamebeats',
            name: 'Arcade Arena Beats 🕹️',
            avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=150'
          }
        }
      ];

      setYtVideos(generated);

      if (typeof window !== "undefined") {
        const localCache = JSON.parse(localStorage.getItem('c8l-tv-search-cache') || '[]');
        const mergedCache = [...generated, ...localCache].filter(
          (v: any, i: number, self: any[]) => self.findIndex(t => t.id === v.id) === i
        );
        localStorage.setItem('c8l-tv-search-cache', JSON.stringify(mergedCache.slice(0, 100)));
      }
      
      setActiveView("home"); // return to home feed to show search results
      setIsSearchingYt(false);
    }, 600);
  };

  const SIMULATION_VIDEOS_AUTO = [
    { id: "sim-1", title: "Leo Vela - Ritmo de la Selva (Deep House Remix)", thumbnail_url: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?q=80&w=640", duration: 280, views: 3120, likes: 14, created_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), is_live: false, user: { id: "leo_vela_uid", name: "Leo Vela 🦁", avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=150" } },
    { id: "sim-2", title: "DJ Rayo - Underground Acid Lounge Set", thumbnail_url: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=640", duration: 3600, views: 4500, likes: 26, created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), is_live: false, user: { id: "dj_rayo_uid", name: "DJ Rayo ⚡", avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?q=80&w=150" } },
    { id: "sim-3", title: "Reina Melody - Bachata Cyberpunk (Live Cover)", thumbnail_url: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=640", duration: 210, views: 8900, likes: 87, created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), is_live: false, user: { id: "reina_melody_uid", name: "Reina Melody 👑", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=150" } },
    { id: "sim-4", title: "BeatMaster - DAW Hacks: Creando melodías con IA", thumbnail_url: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?q=80&w=640", duration: 620, views: 1200, likes: 11, created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), is_live: false, user: { id: "beatmaster_uid", name: "BeatMaster 🎧", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=150" } },
    { id: "sim-5", title: "Leo Vela - Corazones de Neón (Acapella Synth)", thumbnail_url: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=640", duration: 195, views: 3100, likes: 43, created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), is_live: false, user: { id: "leo_vela_uid", name: "Leo Vela 🦁", avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=150" } },
    { id: "sim-6", title: "DJ Rayo - Hardcore Beatmix #99", thumbnail_url: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=640", duration: 1200, views: 2400, likes: 19, created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), is_live: false, user: { id: "dj_rayo_uid", name: "DJ Rayo ⚡", avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?q=80&w=150" } },
    { id: "sim-7", title: "Reina Melody - Techno Salsa Duet", thumbnail_url: "https://images.unsplash.com/photo-1516280440614-37939bbacd6a?q=80&w=640", duration: 245, views: 7300, likes: 68, created_at: new Date(Date.now() - 7 * 60 * 60 * 1000).toISOString(), is_live: false, user: { id: "reina_melody_uid", name: "Reina Melody 👑", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=150" } },
    { id: "sim-8", title: "BeatMaster - Mastering Analógico vs Digital", thumbnail_url: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?q=80&w=640", duration: 890, views: 940, likes: 13, created_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(), is_live: false, user: { id: "beatmaster_uid", name: "BeatMaster 🎧", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=150" } },
    { id: "sim-9", title: "Leo Vela - PK Showdown: La Revancha de los Leones", thumbnail_url: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?q=80&w=640", duration: 410, views: 6410, likes: 93, created_at: new Date(Date.now() - 9 * 60 * 60 * 1000).toISOString(), is_live: false, user: { id: "leo_vela_uid", name: "Leo Vela 🦁", avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=150" } },
    { id: "sim-10", title: "DJ Rayo - Lofi Sunset Coding Mix", thumbnail_url: "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?q=80&w=640", duration: 7200, views: 8900, likes: 112, created_at: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(), is_live: false, user: { id: "dj_rayo_uid", name: "DJ Rayo ⚡", avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?q=80&w=150" } },
  ];

  const loadVideos = async () => {
    try {
      setLoading(true);

      // Auto-inyectar videos de simulación en localStorage si no están ya
      if (typeof window !== "undefined") {
        const stored = JSON.parse(localStorage.getItem('c8l-tv-custom-videos') || '[]');
        const hasSimVideos = stored.some((v: any) => v.id?.startsWith('sim-'));
        if (!hasSimVideos) {
          const merged = [...SIMULATION_VIDEOS_AUTO, ...stored];
          localStorage.setItem('c8l-tv-custom-videos', JSON.stringify(merged));
        }
      }

      const { data } = await supabase
        .from('videos')
        .select('*, user:users(id, name, avatar)')
        .eq('is_private', false)
        .order('created_at', { ascending: false });
      
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

      let customVideos: any[] = [];
      if (typeof window !== "undefined") {
        customVideos = JSON.parse(localStorage.getItem('c8l-tv-custom-videos') || '[]');
      }

      const combined = [...customVideos, ...dbVideos].filter(
        (v, i, self) => self.findIndex(t => t.id === v.id) === i
      );

      setVideos(combined);
    } catch (e) {
      console.error("Error loading videos:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVideos();
  }, []);

  // Filter videos based on Search Query, Category, and Active View
  const getFilteredVideos = () => {
    let list = [...videos, ...MOCK_VIDEOS, ...ytVideos];

    // Unique items by ID
    list = list.filter((v, i, self) => self.findIndex(t => t.id === v.id) === i);

    // Filter by Search Query
    if (searchQuery.trim()) {
      list = list.filter(v => 
        v.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.user.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by Category
    if (activeCategory !== "Todas") {
      list = list.filter(video => {
        const titleLower = video.title.toLowerCase();
        
        if (activeCategory === "Música") {
          return titleLower.includes("records") || 
                 titleLower.includes("video") || 
                 titleLower.includes("cover") || 
                 titleLower.includes("song") ||
                 titleLower.includes("dembow") ||
                 titleLower.includes("canto") ||
                 titleLower.includes("neón y fuego") ||
                 titleLower.includes("salsa") ||
                 titleLower.includes("himno") ||
                 titleLower.includes("tú");
        }
        if (activeCategory === "C8L Live") {
          return video.is_live || titleLower.includes("live") || titleLower.includes("lounge");
        }
        if (activeCategory === "Beat") {
          return titleLower.includes("beat") || titleLower.includes("mix") || titleLower.includes("instrumental") || titleLower.includes("daw");
        }
        if (activeCategory === "En Vivo") {
          return video.is_live || titleLower.includes("live") || titleLower.includes("directo");
        }
        if (activeCategory === "Dom") {
          return titleLower.includes("zen") || titleLower.includes("ambient") || titleLower.includes("satori") || titleLower.includes("lofi") || titleLower.includes("relaxing") || titleLower.includes("dom");
        }
        if (activeCategory === "Bow") {
          return titleLower.includes("cuántico") || titleLower.includes("ritmo") || titleLower.includes("lounge #10") || titleLower.includes("bow");
        }
        if (activeCategory === "Cluster") {
          return titleLower.includes("daw") || titleLower.includes("tutorial") || titleLower.includes("masterclass") || titleLower.includes("sintesis") || titleLower.includes("cluster");
        }
        if (activeCategory === "Freestyle") {
          return titleLower.includes("freestyle");
        }
        if (activeCategory === "Beats") {
          return titleLower.includes("beats");
        }
        if (activeCategory === "Salsa") {
          return titleLower.includes("salsa");
        }
        if (activeCategory === "Trap") {
          return titleLower.includes("trap");
        }
        if (activeCategory === "Mixes") {
          return titleLower.includes("mix");
        }
        if (activeCategory === "Comunidad") {
          return !video.id.startsWith("mock-") && !video.id.startsWith("yt-");
        }
        return true;
      });
    }

    // Filter by Active View
    if (activeView === "subscriptions") {
      list = list.filter(v => {
        return subscribedChannels.some(subName => v.user.name.toLowerCase().includes(subName.toLowerCase().replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, '').trim()));
      });
    } else if (activeView === "history") {
      if (typeof window !== "undefined") {
        const historyIds = JSON.parse(localStorage.getItem('c8l-tv-history') || '[]');
        list = list.filter(v => historyIds.includes(v.id));
        list.sort((a, b) => historyIds.indexOf(b.id) - historyIds.indexOf(a.id));
      }
    } else if (activeView === "watch_later") {
      if (typeof window !== "undefined") {
        const watchLaterIds = JSON.parse(localStorage.getItem('c8l-tv-watch-later') || '[]');
        list = list.filter(v => watchLaterIds.includes(v.id));
      }
    } else if (activeView === "liked_videos") {
      if (typeof window !== "undefined") {
        const likedIds = JSON.parse(localStorage.getItem('c8l-tv-likes') || '[]');
        list = list.filter(v => likedIds.includes(v.id));
      }
    } else if (activeView === "my_videos") {
      const currentUserId = (user as any)?.uid || (user as any)?.id || "mock-user-id";
      list = list.filter(v => v.user.id === currentUserId || v.user.id === "mock-user-id" || v.user.id === "vip_creator");
    } else if (activeView === "explore") {
      list = list.filter(v => v.views > 6000);
      list.sort((a, b) => b.views - a.views);
    }

    return list;
  };

  const filteredVideos = getFilteredVideos();

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [searchQuery, activeCategory]);

  // Infinite scroll Intersection Observer
  useEffect(() => {
    if (!loadMoreRef || visibleCount >= filteredVideos.length) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !loadingMore) {
        setLoadingMore(true);
        setTimeout(() => {
          setVisibleCount(prev => prev + PAGE_SIZE);
          setLoadingMore(false);
        }, 800);
      }
    }, { threshold: 0.1 });
    observer.observe(loadMoreRef);
    return () => observer.disconnect();
  }, [loadMoreRef, visibleCount, filteredVideos.length, loadingMore]);

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
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSearchSubmit();
              }}
              className="w-full bg-transparent px-5 py-2.5 text-sm outline-none text-white placeholder-zinc-500"
            />
          </div>
          <button 
            onClick={handleSearchSubmit}
            className="px-6 py-2.5 bg-zinc-800 border-t border-b border-r border-white/10 rounded-r-full hover:bg-zinc-700 transition flex items-center justify-center text-zinc-400 hover:text-white min-w-[60px]"
            title="Buscar"
          >
            {isSearchingYt ? (
              <div className="w-4 h-4 border-2 border-t-transparent border-[var(--color-neon-cyan)] rounded-full animate-spin"></div>
            ) : (
              <Search size={18} />
            )}
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

        <button 
          onClick={() => setShowStudioModal(true)}
          className="px-4 py-2.5 bg-[#FF0055] hover:bg-pink-500 text-white text-xs font-heading font-black uppercase rounded-full tracking-wider transition flex items-center gap-1.5 cursor-pointer shadow-[2px_2px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] shrink-0"
          title="Estudio de Creador"
        >
          <Sliders size={14} />
          <span>Mi Estudio</span>
        </button>
      </div>

      <div className="flex flex-1 relative items-stretch">
        
        {/* Collapsible Left Navigation (YouTube Sidebar style) */}
        <aside className={`hidden md:flex flex-col bg-[#030303] border-r border-white/5 shrink-0 transition-all duration-300 ${
          sidebarExpanded ? 'w-64 px-4' : 'w-16 px-1'
        } py-4 gap-6 select-none overflow-y-auto no-scrollbar h-[calc(100vh-140px)] sticky top-36`}>
          
          {/* Main items */}
          <div className="flex flex-col gap-1">
            <button 
              onClick={() => setActiveView("home")}
              className={`flex items-center gap-4 px-3 py-2.5 rounded-xl text-left uppercase tracking-wider text-xs transition-all ${
                activeView === "home"
                  ? 'bg-gradient-to-r from-[#FF0055]/20 to-[#8A2BE2]/20 border-2 border-[#FF0055] text-white font-black shadow-[0_0_8px_rgba(255,0,85,0.4)]'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5 font-semibold'
              }`}
            >
              <Home size={18} className={activeView === "home" ? "text-[#FF0055]" : ""} />
              {sidebarExpanded && <span>Inicio</span>}
            </button>
            <button 
              onClick={() => { setActiveView("explore"); setActiveCategory("Todas"); }}
              className={`flex items-center gap-4 px-3 py-2.5 rounded-xl text-left uppercase tracking-wider text-xs transition-all ${
                activeView === "explore"
                  ? 'bg-gradient-to-r from-[#FF0055]/20 to-[#8A2BE2]/20 border-2 border-[#FF0055] text-white font-black shadow-[0_0_8px_rgba(255,0,85,0.4)]'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5 font-semibold'
              }`}
            >
              <Compass size={18} className={activeView === "explore" ? "text-[#FF0055]" : ""} />
              {sidebarExpanded && <span>Explorar</span>}
            </button>
            <button 
              onClick={() => setActiveView("subscriptions")}
              className={`flex items-center gap-4 px-3 py-2.5 rounded-xl text-left uppercase tracking-wider text-xs transition-all ${
                activeView === "subscriptions"
                  ? 'bg-gradient-to-r from-[#FF0055]/20 to-[#8A2BE2]/20 border-2 border-[#FF0055] text-white font-black shadow-[0_0_8px_rgba(255,0,85,0.4)]'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5 font-semibold'
              }`}
            >
              <Tv size={18} className={activeView === "subscriptions" ? "text-[#FF0055]" : ""} />
              {sidebarExpanded && <span>Suscripciones</span>}
            </button>
          </div>

          <div className="h-[1px] bg-white/5"></div>

          {/* Library Section */}
          <div className="flex flex-col gap-1">
            {sidebarExpanded && <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest font-black px-3 mb-2">Biblioteca</span>}
            <button 
              onClick={() => setActiveView("library")}
              className={`flex items-center gap-4 px-3 py-2.5 rounded-xl text-left uppercase tracking-wider text-xs transition-all ${
                activeView === "library"
                  ? 'bg-gradient-to-r from-[#FF0055]/20 to-[#8A2BE2]/20 border-2 border-[#FF0055] text-white font-black shadow-[0_0_8px_rgba(255,0,85,0.4)]'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5 font-semibold'
              }`}
            >
              <Library size={16} className={activeView === "library" ? "text-[#FF0055]" : ""} />
              {sidebarExpanded && <span>Biblioteca</span>}
            </button>
            <button 
              onClick={() => setActiveView("history")}
              className={`flex items-center gap-4 px-3 py-2.5 rounded-xl text-left uppercase tracking-wider text-xs transition-all ${
                activeView === "history"
                  ? 'bg-gradient-to-r from-[#FF0055]/20 to-[#8A2BE2]/20 border-2 border-[#FF0055] text-white font-black shadow-[0_0_8px_rgba(255,0,85,0.4)]'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5 font-semibold'
              }`}
            >
              <History size={16} className={activeView === "history" ? "text-[#FF0055]" : ""} />
              {sidebarExpanded && <span>Historial</span>}
            </button>
            <button 
              onClick={() => setActiveView("my_videos")}
              className={`flex items-center gap-4 px-3 py-2.5 rounded-xl text-left uppercase tracking-wider text-xs transition-all ${
                activeView === "my_videos"
                  ? 'bg-gradient-to-r from-[#FF0055]/20 to-[#8A2BE2]/20 border-2 border-[#FF0055] text-white font-black shadow-[0_0_8px_rgba(255,0,85,0.4)]'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5 font-semibold'
              }`}
            >
              <PlaySquare size={16} className={activeView === "my_videos" ? "text-[#FF0055]" : ""} />
              {sidebarExpanded && <span>Mis Videos</span>}
            </button>
            <button 
              onClick={() => setActiveView("watch_later")}
              className={`flex items-center gap-4 px-3 py-2.5 rounded-xl text-left uppercase tracking-wider text-xs transition-all ${
                activeView === "watch_later"
                  ? 'bg-gradient-to-r from-[#FF0055]/20 to-[#8A2BE2]/20 border-2 border-[#FF0055] text-white font-black shadow-[0_0_8px_rgba(255,0,85,0.4)]'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5 font-semibold'
              }`}
            >
              <Clock size={16} className={activeView === "watch_later" ? "text-[#FF0055]" : ""} />
              {sidebarExpanded && <span>Ver más tarde</span>}
            </button>
            <button 
              onClick={() => setActiveView("liked_videos")}
              className={`flex items-center gap-4 px-3 py-2.5 rounded-xl text-left uppercase tracking-wider text-xs transition-all ${
                activeView === "liked_videos"
                  ? 'bg-gradient-to-r from-[#FF0055]/20 to-[#8A2BE2]/20 border-2 border-[#FF0055] text-white font-black shadow-[0_0_8px_rgba(255,0,85,0.4)]'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5 font-semibold'
              }`}
            >
              <ThumbsUp size={16} className={activeView === "liked_videos" ? "text-[#FF0055]" : ""} />
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
                ]
                .filter(channel => subscribedChannels.some(subName => channel.name.toLowerCase().includes(subName.toLowerCase().replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, '').trim())))
                .map((channel, i) => (
                  <button 
                    key={i} 
                    onClick={() => {
                      setSearchQuery(channel.name);
                      setActiveView("home");
                      setTimeout(() => handleSearchSubmit(), 50);
                    }}
                    className="flex items-center justify-between px-3 py-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 font-semibold text-xs text-left transition cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-base bg-zinc-900 w-6 h-6 rounded-full flex items-center justify-center">{channel.avatar}</span>
                      <span>{channel.name}</span>
                    </div>
                    {channel.active && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>}
                  </button>
                ))}
                {subscribedChannels.length === 0 && (
                  <span className="text-[10px] text-zinc-650 px-3 italic">Sin suscripciones activas</span>
                )}
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
          
          {/* Social Simulator Engine removido: videos se cargan automáticamente al abrir el feed */}
          
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
              <C8LTVLogo size={24} />
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
          ) : activeView === "library" ? (
            <div className="space-y-10 text-left overflow-y-auto h-[calc(100vh-250px)] pr-2 no-scrollbar">
              {/* Historial Section */}
              <div>
                <h3 className="font-heading font-black text-sm uppercase tracking-wider text-[#FF0055] mb-4 border-b-2 border-black pb-1.5 flex items-center gap-2">
                  <History size={16} />
                  <span>📜 Historial de Reproducción</span>
                </h3>
                {filteredVideos.filter(v => {
                  const historyIds = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('c8l-tv-history') || '[]') : [];
                  return historyIds.includes(v.id);
                }).length === 0 ? (
                  <p className="text-xs text-zinc-550 italic px-2">Historial vacío. ¡Comienza a mirar videos!</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {filteredVideos.filter(v => {
                      const historyIds = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('c8l-tv-history') || '[]') : [];
                      return historyIds.includes(v.id);
                    }).slice(0, 4).map(video => (
                      <VideoCard key={`hist-${video.id}`} video={video} />
                    ))}
                  </div>
                )}
              </div>

              {/* Ver más tarde Section */}
              <div>
                <h3 className="font-heading font-black text-sm uppercase tracking-wider text-[#00F3FF] mb-4 border-b-2 border-black pb-1.5 flex items-center gap-2">
                  <Clock size={16} />
                  <span>⏰ Ver más tarde</span>
                </h3>
                {filteredVideos.filter(v => {
                  const wlIds = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('c8l-tv-watch-later') || '[]') : [];
                  return wlIds.includes(v.id);
                }).length === 0 ? (
                  <p className="text-xs text-zinc-555 italic px-2">Lista vacía. Añade videos para verlos después.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {filteredVideos.filter(v => {
                      const wlIds = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('c8l-tv-watch-later') || '[]') : [];
                      return wlIds.includes(v.id);
                    }).slice(0, 4).map(video => (
                      <VideoCard key={`wl-${video.id}`} video={video} />
                    ))}
                  </div>
                )}
              </div>

              {/* Likes Section */}
              <div>
                <h3 className="font-heading font-black text-sm uppercase tracking-wider text-[#FF0055] mb-4 border-b-2 border-black pb-1.5 flex items-center gap-2">
                  <ThumbsUp size={16} />
                  <span>💖 Videos que te gustan</span>
                </h3>
                {filteredVideos.filter(v => {
                  const likedIds = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('c8l-tv-likes') || '[]') : [];
                  return likedIds.includes(v.id);
                }).length === 0 ? (
                  <p className="text-xs text-zinc-550 italic px-2">No has dado like a ningún video todavía.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {filteredVideos.filter(v => {
                      const likedIds = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('c8l-tv-likes') || '[]') : [];
                      return likedIds.includes(v.id);
                    }).slice(0, 4).map(video => (
                      <VideoCard key={`like-${video.id}`} video={video} />
                    ))}
                  </div>
                )}
              </div>

              {/* Mis Videos Section */}
              <div>
                <h3 className="font-heading font-black text-sm uppercase tracking-wider text-[#D4AF37] mb-4 border-b-2 border-black pb-1.5 flex items-center gap-2">
                  <PlaySquare size={16} />
                  <span>📹 Mis Videos</span>
                </h3>
                {filteredVideos.filter(v => v.user.id === "mock-user-id").length === 0 ? (
                  <p className="text-xs text-zinc-550 italic px-2">No has subido ningún video.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {filteredVideos.filter(v => v.user.id === "mock-user-id").slice(0, 4).map(video => (
                      <VideoCard key={`my-${video.id}`} video={video} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : filteredVideos.length === 0 ? (
            <div className="flex-grow flex flex-col items-center justify-center py-24 text-center border border-dashed border-white/10 rounded-3xl bg-black/40">
              <C8LTVLogo size={60} className="mb-4" />
              <h3 className="font-heading font-black text-lg text-white uppercase">{language === "es" ? "No se encontraron videos" : "No videos found"}</h3>
              <p className="text-xs text-zinc-500 max-w-xs mt-1">
                {language === "es" ? "Intenta modificar tu consulta o escoge otra categoría de la barra superior." : "Try adjusting your search query or picking another category."}
              </p>
            </div>
          ) : (
            <>
              <div className="h-[calc(100vh-200px)] overflow-y-auto pr-2 scrollbar-thin">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredVideos.slice(0, visibleCount).map(video => (
                    <VideoCard key={video.id} video={video} />
                  ))}
                </div>
              </div>

              {/* Load More trigger element */}
              {visibleCount < filteredVideos.length && (
                <div 
                  ref={setLoadMoreRef} 
                  className="w-full flex justify-center py-12 mt-4"
                >
                  {loadingMore ? (
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-8 h-8 border-t-3 border-r-3 border-[#00F3FF] border-solid rounded-full animate-spin"></div>
                      <span className="text-zinc-500 font-mono text-[9px] uppercase tracking-widest font-black">
                        Cargando más contenido de C8L TV...
                      </span>
                    </div>
                  ) : (
                    <div className="h-6 w-6"></div>
                  )}
                </div>
              )}
            </>
          )}

        </main>
      </div>

      {/* Sticky Bottom Bar for Mobile Device viewports (YouTube Mobile clone style) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-zinc-950/95 backdrop-blur-md border-t border-white/10 flex justify-around py-3 text-[9px] text-zinc-400 font-bold uppercase tracking-widest shadow-[0_-5px_15px_rgba(0,0,0,0.8)]">
        <button 
          onClick={() => setActiveView("home")}
          className={`flex flex-col items-center gap-1 ${activeView === "home" ? "text-[#FF0055] font-black" : "text-zinc-400"}`}
        >
          <Home size={16} />
          <span>Inicio</span>
        </button>
        <button 
          onClick={() => { setActiveView("explore"); setActiveCategory("Todas"); }}
          className={`flex flex-col items-center gap-1 ${activeView === "explore" ? "text-[#FF0055] font-black" : "text-zinc-400"}`}
        >
          <Compass size={16} />
          <span>Explorar</span>
        </button>
        <button 
          onClick={() => setShowUploadModal(true)}
          className="flex flex-col items-center gap-0.5 text-zinc-300 hover:text-white transition"
        >
          <Plus size={20} className="border-2 border-white rounded-full p-0.5" />
          <span>Crear</span>
        </button>
        <button 
          onClick={() => setActiveView("subscriptions")}
          className={`flex flex-col items-center gap-1 ${activeView === "subscriptions" ? "text-[#FF0055] font-black" : "text-zinc-400"}`}
        >
          <Tv size={16} />
          <span>Suscritos</span>
        </button>
        <button 
          onClick={() => setActiveView("library")}
          className={`flex flex-col items-center gap-1 ${activeView === "library" ? "text-[#FF0055] font-black" : "text-zinc-400"}`}
        >
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

                {/* Local File Upload Widget */}
                <div className="border-2 border-dashed border-zinc-800 rounded-xl p-4 bg-black/60 flex flex-col items-center justify-center gap-2 text-center my-3">
                  <Upload className="text-[#00F3FF]" size={20} />
                  <span className="text-[10px] font-mono text-zinc-400 uppercase font-black">
                    📂 SUBIR ARCHIVO DIRECTO DESDE PC/MÓVIL
                  </span>
                  <p className="text-[9px] text-zinc-500 max-w-xs font-mono">
                    Selecciona cualquier video, audio o archivo multimedia de tu terminal (Android, iPhone, PC, etc.)
                  </p>
                  
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingLocalFile}
                    className="mt-1 px-4 py-1.5 bg-zinc-900 border border-zinc-700 hover:border-[#00F3FF]/40 text-white font-mono font-bold text-[10px] uppercase rounded-lg transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    {uploadingLocalFile ? "⏳ SUBIENDO ARCHIVO..." : "SELECCIONAR ARCHIVO"}
                  </button>
                  
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="*/*"
                    onChange={handleLocalFileChange}
                    className="hidden"
                  />

                  {localFileUploadedName && (
                    <div className="text-[9px] text-emerald-400 font-mono mt-1 flex items-center gap-1.5 animate-pulse">
                      <span>✅ listo: {localFileUploadedName}</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block mb-1">URL del Video (YouTube o MP4) (Opcional si subes archivo)</label>
                  <input
                    type="url"
                    value={uploadUrl}
                    onChange={(e) => setUploadUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="w-full bg-black border-2 border-black px-3 py-2 text-xs outline-none text-white focus:border-[#00F3FF] rounded"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block">Miniatura URL (Opcional)</label>
                    <button
                      type="button"
                      onClick={() => { setIsEditingAiThumb(false); setShowAiThumbGen(true); }}
                      className="text-[9px] font-mono text-[#00F3FF] hover:underline uppercase font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Sparkles size={10} />
                      <span>Diseñar con IA</span>
                    </button>
                  </div>
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
                    <select 
                      value={uploadCategory}
                      onChange={(e) => setUploadCategory(e.target.value)}
                      className="w-full bg-black border-2 border-black px-3 py-2 text-xs outline-none text-zinc-400 focus:border-[#00F3FF] rounded"
                    >
                      <option value="Música">Música</option>
                      <option value="Beat">Beat</option>
                      <option value="Freestyle">Freestyle</option>
                      <option value="Beats">Beats</option>
                      <option value="Comunidad">Comunidad</option>
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

      {/* Studio Modal */}
      <AnimatePresence>
        {showStudioModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[140] flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 overflow-y-auto"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="w-full max-w-4xl bg-[#0d0d0e] border-3 border-black p-6 rounded-xl shadow-[8px_8px_0px_#FF0055] overflow-y-auto max-h-[90vh]"
            >
              <div className="flex justify-between items-center border-b-2 border-black pb-3 mb-6">
                <div className="flex items-center gap-2">
                  <Sliders className="text-[#FF0055]" size={20} />
                  <h3 className="font-heading font-black text-xl text-white uppercase tracking-wider">
                    C8L TV — {language === "es" ? "Estudio de Creadores" : "Creator Studio"}
                  </h3>
                </div>
                <button 
                  onClick={() => setShowStudioModal(false)}
                  className="text-zinc-500 hover:text-white transition font-bold cursor-pointer"
                >
                  [CERRAR]
                </button>
              </div>

              {/* Stats Dashboard */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="p-4 bg-black/60 border border-zinc-800 rounded-xl text-center">
                  <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest block mb-1">Total Videos</span>
                  <strong className="text-2xl font-mono text-white">
                    {videos.filter(v => v.user.id === ((user as any)?.uid || (user as any)?.id || "mock-user-id") || v.user.id === "vip_creator" || String(v.id).startsWith("custom-")).length}
                  </strong>
                </div>
                <div className="p-4 bg-black/60 border border-zinc-800 rounded-xl text-center">
                  <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest block mb-1">Visualizaciones</span>
                  <strong className="text-2xl font-mono text-[#00F3FF]">
                    {videos.filter(v => v.user.id === ((user as any)?.uid || (user as any)?.id || "mock-user-id") || v.user.id === "vip_creator" || String(v.id).startsWith("custom-")).reduce((acc, v) => acc + (v.views || 0), 0)}
                  </strong>
                </div>
                <div className="p-4 bg-black/60 border border-zinc-800 rounded-xl text-center">
                  <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest block mb-1">Me Gusta</span>
                  <strong className="text-2xl font-mono text-[#FF0055]">
                    {videos.filter(v => v.user.id === ((user as any)?.uid || (user as any)?.id || "mock-user-id") || v.user.id === "vip_creator" || String(v.id).startsWith("custom-")).reduce((acc, v) => acc + (v.likes || 0), 0)}
                  </strong>
                </div>
              </div>

              {/* Video List */}
              <div className="border border-zinc-800 rounded-xl overflow-hidden bg-black/30">
                <div className="p-3 bg-zinc-950 font-mono text-[10px] text-zinc-400 font-bold uppercase tracking-wider border-b border-zinc-850 flex items-center justify-between">
                  <span>Listado de Contenido</span>
                  <button 
                    onClick={() => { setShowStudioModal(false); setShowUploadModal(true); }}
                    className="px-3 py-1 bg-[#00F3FF] text-black rounded font-heading font-black text-[9px] uppercase hover:bg-cyan-300 cursor-pointer"
                  >
                    + Nuevo Video
                  </button>
                </div>

                <div className="divide-y divide-zinc-900 max-h-[350px] overflow-y-auto">
                  {videos.filter(v => v.user.id === ((user as any)?.uid || (user as any)?.id || "mock-user-id") || v.user.id === "vip_creator" || String(v.id).startsWith("custom-")).length === 0 ? (
                    <div className="p-8 text-center text-zinc-500 font-mono text-xs">
                      No has subido ningún video todavía. ¡Comienza subiendo uno!
                    </div>
                  ) : (
                    videos.filter(v => v.user.id === ((user as any)?.uid || (user as any)?.id || "mock-user-id") || v.user.id === "vip_creator" || String(v.id).startsWith("custom-")).map(video => (
                      <div key={video.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-zinc-900/30 transition">
                        <div className="flex items-center gap-3">
                          <img 
                            src={video.thumbnail_url || "https://images.unsplash.com/photo-1614680376593-902f74fa0d41?q=80&w=640"} 
                            className="w-16 h-10 object-cover rounded border border-zinc-800" 
                            alt="thumb" 
                          />
                          <div>
                            <h4 className="font-heading font-black text-xs text-white uppercase tracking-wider line-clamp-1">{video.title}</h4>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[8px] font-mono px-1.5 py-0.5 bg-zinc-900 border border-zinc-800 rounded-full text-zinc-400 uppercase">
                                {video.category || "General"}
                              </span>
                              <span className={`text-[8px] font-mono px-1.5 py-0.5 border rounded-full uppercase ${
                                video.is_private ? "bg-red-950/40 border-red-900/50 text-red-400" : "bg-emerald-950/40 border-emerald-900/50 text-emerald-400"
                              }`}>
                                {video.is_private ? "Privado" : "Público"}
                              </span>
                              <span className="text-[8px] font-mono text-zinc-500">
                                {video.created_at ? new Date(video.created_at).toLocaleDateString() : ""}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 text-xs font-mono text-zinc-400">
                          <div className="text-center">
                            <span className="text-[8px] text-zinc-500 uppercase block">Vistas</span>
                            <span>{video.views || 0}</span>
                          </div>
                          <div className="text-center">
                            <span className="text-[8px] text-zinc-500 uppercase block">Likes</span>
                            <span>{video.likes || 0}</span>
                          </div>

                          <div className="flex items-center gap-2 ml-4">
                            <button
                              onClick={() => startEditingVideo(video)}
                              className="px-2.5 py-1 bg-zinc-900 border border-zinc-700 hover:border-[#00F3FF]/50 text-white rounded text-[10px] uppercase font-bold cursor-pointer transition"
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => handleDeleteVideo(video.id)}
                              className="px-2.5 py-1 bg-red-950/40 border border-red-900/50 hover:bg-red-900 hover:text-white text-red-400 rounded text-[10px] uppercase font-bold cursor-pointer transition"
                            >
                              Borrar
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Video Modal */}
      <AnimatePresence>
        {editingVideo && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[150] flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 overflow-y-auto"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="w-full max-w-lg bg-[#0d0d0e] border-3 border-black p-6 rounded-lg shadow-[6px_6px_0px_#00F3FF]"
            >
              <div className="flex justify-between items-center border-b-2 border-black pb-3 mb-6">
                <h3 className="font-heading font-black text-lg text-[#00F3FF] uppercase tracking-wider">Editar Video</h3>
                <button 
                  onClick={() => setEditingVideo(null)}
                  className="text-zinc-500 hover:text-white transition font-bold cursor-pointer"
                >
                  [CANCELAR]
                </button>
              </div>

              <form onSubmit={handleEditSubmit} className="space-y-4 text-left">
                <div>
                  <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block mb-1">Título del Video *</label>
                  <input
                    type="text"
                    required
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full bg-black border-2 border-black px-3 py-2 text-xs outline-none text-white focus:border-[#00F3FF] rounded"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block">Miniatura URL</label>
                    <button
                      type="button"
                      onClick={() => { setIsEditingAiThumb(true); setShowAiThumbGen(true); }}
                      className="text-[9px] font-mono text-[#00F3FF] hover:underline uppercase font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Sparkles size={10} />
                      <span>Diseñar con IA</span>
                    </button>
                  </div>
                  <input
                    type="url"
                    value={editThumb}
                    onChange={(e) => setEditThumb(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full bg-black border-2 border-black px-3 py-2 text-xs outline-none text-white focus:border-[#00F3FF] rounded"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block mb-1">URL del Video (MP4 o YouTube)</label>
                  <input
                    type="url"
                    value={editUrl}
                    onChange={(e) => setEditUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="w-full bg-black border-2 border-black px-3 py-2 text-xs outline-none text-white focus:border-[#00F3FF] rounded"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-1">
                    <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block mb-1">Duración (seg)</label>
                    <input
                      type="number"
                      value={editDuration}
                      onChange={(e) => setEditDuration(e.target.value)}
                      className="w-full bg-black border-2 border-black px-3 py-2 text-xs outline-none text-white focus:border-[#00F3FF] rounded"
                    />
                  </div>
                  <div className="col-span-1">
                    <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block mb-1">Categoría</label>
                    <select
                      value={editCategory}
                      onChange={(e) => setEditCategory(e.target.value)}
                      className="w-full bg-black border-2 border-black px-3 py-2 text-xs outline-none text-zinc-400 focus:border-[#00F3FF] rounded"
                    >
                      <option value="Música">Música</option>
                      <option value="Beat">Beat</option>
                      <option value="Freestyle">Freestyle</option>
                      <option value="Beats">Beats</option>
                      <option value="Comunidad">Comunidad</option>
                    </select>
                  </div>
                  <div className="col-span-1">
                    <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block mb-1">Privacidad</label>
                    <select
                      value={editIsPrivate ? "true" : "false"}
                      onChange={(e) => setEditIsPrivate(e.target.value === "true")}
                      className="w-full bg-black border-2 border-black px-3 py-2 text-xs outline-none text-zinc-400 focus:border-[#00F3FF] rounded"
                    >
                      <option value="false">Público</option>
                      <option value="true">Privado</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block mb-1">Descripción</label>
                  <textarea
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    rows={3}
                    className="w-full bg-black border-2 border-black px-3 py-2 text-xs outline-none text-white focus:border-[#00F3FF] rounded resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full mt-2 py-3 bg-[#00F3FF] text-black font-heading font-black text-sm border-2 border-black shadow-[3px_3px_0px_#000] hover:bg-cyan-300 transition-all cursor-pointer"
                >
                  💾 GUARDAR CAMBIOS
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* AI Thumbnail Generator Modal (QuantumMediaCreator Integration) */}
      <AnimatePresence>
        {showAiThumbGen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[160] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 overflow-y-auto"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="w-full max-w-4xl bg-[#09090a] border-3 border-black p-6 rounded-xl shadow-[8px_8px_0px_#00F3FF] overflow-y-auto max-h-[90vh]"
            >
              <div className="flex justify-between items-center border-b-2 border-black pb-3 mb-6">
                <div className="flex items-center gap-2">
                  <Sparkles className="text-[#00F3FF]" size={20} />
                  <h3 className="font-heading font-black text-lg text-white uppercase tracking-wider">
                    Diseñador de Portadas con IA
                  </h3>
                </div>
                <button 
                  onClick={() => setShowAiThumbGen(false)}
                  className="text-zinc-500 hover:text-white transition font-mono text-xs font-bold cursor-pointer"
                >
                  [CERRAR PORTADA]
                </button>
              </div>

              <QuantumMediaCreator 
                mode="desktop" 
                onSelectImage={(url) => {
                  if (isEditingAiThumb) {
                    setEditThumb(url);
                  } else {
                    setUploadThumb(url);
                  }
                  setShowAiThumbGen(false);
                  showNotification(language === "es" ? "¡Portada IA aplicada con éxito!" : "AI Cover applied successfully!", "success");
                }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}