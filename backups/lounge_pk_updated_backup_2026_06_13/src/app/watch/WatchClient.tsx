// app/watch/WatchClient.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Heart, Share2, Cpu, 
  Send, AlertTriangle 
} from 'lucide-react';
import LionMascot from '@/components/ui/LionMascot';
import { VideoPlayer } from '@/components/video/VideoPlayer';

interface Video {
  id: string;
  title: string;
  thumbnail_url: string;
  duration: number;
  views: number;
  likes: number;
  created_at: string;
  is_live?: boolean;
  video_url?: string;
  description?: string;
  user: {
    id: string;
    name: string;
    avatar: string;
  };
}

const MOCK_VIDEOS: Video[] = [
  {
    id: "mock-1",
    title: "Leo Vela - Tan Solo Tú (Official Video) [C8L Records]",
    thumbnail_url: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=640",
    video_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    description: "El videoclip oficial del nuevo sencillo cuántico de Leo Vela. Grabado en los estudios C8L de Madrid.",
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
    video_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    description: "Una sesión en vivo grabada directamente en la sala virtual lounge #829. Sonidos synthwave, techno e industrial.",
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
    video_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    description: "Aceptando el reto de dembow espacial. Voces modificadas con el ecualizador del Studio C8L.",
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
    video_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    description: "Retransmisión en directo del torneo PK de TikTok. Apoyos de diamantes y monedas activos en tiempo real.",
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
    video_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    description: "Manual detallado para componer y producir directamente con Web Audio en el Studio C8L.",
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
    video_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    description: "Una pista continua de sonido ambiental y lofi minimalista para tus sesiones de meditación cuántica.",
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
    video_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    description: "Actuación en directo desde la sala #10. Una fusión increíble de dembow espacial con sintetizadores modulares.",
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
    video_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    description: "Beatmix especial de electro y dubstep diseñado exclusivamente para la facción Ziria Coins.",
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
    video_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    description: "Una asombrosa versión acapella del tema clásico Canto de Sirena, grabada con acústica natural.",
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
    video_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    description: "Sesión improvisada de rap cuántico en el Lounge Virtual, con la participación especial de CyberLeo.",
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
    video_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    description: "Lyric video oficial del himno 'Neón y Fuego', representativo de la estética nocturna cyberpunk.",
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
    video_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    description: "Aprende el arte de componer dembow con elementos de música electrónica usando el estudio integrado C8L.",
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
    video_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    description: "Tema oficial de la facción La Resistencia. Compuesto con sintetizadores analógicos e instrumentos de metal distorsionados.",
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
    video_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    description: "Una sesión ininterrumpida de lofi ambient con toques futuristas. Ideal para la concentración y desarrollo de software.",
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
    video_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    description: "Fusión rítmica caribeña clásica con arpegios electrónicos digitales directos de la Lounge Session.",
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
    video_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    description: "Guía técnica para programadores y diseñadores sonoros interesados en sintetizadores interactivos directamente en el navegador.",
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
    video_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    description: "El videoclip oficial del nuevo sencillo cuántico de Leo Vela. Grabado en los estudios C8L de Madrid.",
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
    video_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    description: "Una sesión en vivo grabada directamente en la sala virtual lounge #22. Sonidos synthwave, techno e industrial.",
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
    video_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    description: "Aceptando el reto de salsa dembow del futuro. Voces modificadas con el ecualizador del Studio C8L.",
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
    video_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    description: "Manual detallado para componer y producir directamente con Web Audio en el Studio C8L y modular el oscilador.",
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
    video_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    description: "Una pista continua de sonido ambiental y lofi minimalista para tus sesiones de meditación cuántica y relajación.",
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
    video_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    description: "Tema oficial de la facción La Resistencia. Compuesto con sintetizadores analógicos e instrumentos de metal distorsionados.",
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
    video_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    description: "Retransmisión en directo del torneo PK de TikTok. Apoyos de diamantes y monedas activos en tiempo real.",
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
    video_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    description: "Lyric video oficial del himno 'Corazones Locos', representativo de la estética nocturna cyberpunk de Ziria.",
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
    video_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    description: "Sesión improvisada de rap cuántico en el Lounge Virtual, con la participación especial de CyberLeo.",
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
    video_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    description: "Fusión rítmica caribeña clásica con arpegios electrónicos digitales directos de la Lounge Session.",
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

function getYouTubeId(url: string) {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

export default function WatchClient({ id }: { id: string }) {
  const { language, showNotification, user } = useApp();
  const [video, setVideo] = useState<Video | null>(null);
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [commentInput, setCommentInput] = useState("");
  const [comments, setComments] = useState<{ author: string; text: string; date: string; isAiApproved: boolean }[]>([
    { author: "Hacker_C8L", text: "¡Tremendo el drop en el minuto 1:30!", date: "Hace 2 horas", isAiApproved: true },
    { author: "QuantumFan", text: "El videoclip tiene una estética premium total.", date: "Hace 5 horas", isAiApproved: true }
  ]);
  const [moderating, setModerating] = useState(false);
  const [activeTab, setActiveTab] = useState<"comments" | "details">("comments");
  const [mascotState, setMascotState] = useState<"idle" | "dance" | "win" | "sad" | "celebrate">("idle");
  const [moderationAlert, setModerationAlert] = useState<string | null>(null);

  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subsCount, setSubsCount] = useState(15245);

  useEffect(() => {
    // 1. Log playing video to History list in localStorage
    if (typeof window !== "undefined") {
      const history = JSON.parse(localStorage.getItem('c8l-tv-history') || '[]');
      const filteredHistory = history.filter((vId: string) => vId !== id);
      filteredHistory.push(id);
      localStorage.setItem('c8l-tv-history', JSON.stringify(filteredHistory.slice(-50))); // Keep last 50
    }

    // 2. Find video details
    let currentVideo = MOCK_VIDEOS.find(v => v.id === id);
    
    if (!currentVideo && typeof window !== "undefined") {
      const customVideos = JSON.parse(localStorage.getItem('c8l-tv-custom-videos') || '[]');
      currentVideo = customVideos.find((v: any) => v.id === id);
    }
    
    if (currentVideo) {
      setVideo(currentVideo);
      setupUploaderDetails(currentVideo.user.name);
      loadLikesAndComments(currentVideo);
    } else {
      // Look in search cache
      if (typeof window !== "undefined") {
        const cache = JSON.parse(localStorage.getItem('c8l-tv-search-cache') || '[]');
        const cachedVideo = cache.find((v: any) => v.id === id);
        if (cachedVideo) {
          setVideo(cachedVideo);
          setupUploaderDetails(cachedVideo.user.name);
          loadLikesAndComments(cachedVideo);
          return;
        }
      }

      // Resolve dynamically using YouTube oEmbed
      const rawYtId = id.startsWith("yt-") ? id.substring(3) : id;
      const oembedUrl = `https://noembed.com/embed?url=https://www.youtube.com/watch?v=${rawYtId}`;

      fetch(oembedUrl)
        .then(res => res.json())
        .then(data => {
          if (data && data.title) {
            const resolvedVideo: Video = {
              id: id,
              title: `[YouTube] ${data.title}`,
              thumbnail_url: data.thumbnail_url || `https://i.ytimg.com/vi/${rawYtId}/hqdefault.jpg`,
              duration: 180,
              views: 12450,
              likes: 890,
              created_at: new Date().toISOString(),
              video_url: `https://www.youtube.com/watch?v=${rawYtId}`,
              description: `Video de YouTube enlazado cargado por ${data.author_name || 'Uploader'}.`,
              user: {
                id: `yt_ch_${data.author_name || 'anon'}`,
                name: data.author_name || 'Uploader YouTube',
                avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=150'
              }
            };
            setVideo(resolvedVideo);
            setupUploaderDetails(resolvedVideo.user.name);
            loadLikesAndComments(resolvedVideo);
          } else {
            // Fallback to MOCK_VIDEOS[0]
            const fallbackVideo = MOCK_VIDEOS[0];
            setVideo(fallbackVideo);
            setupUploaderDetails(fallbackVideo.user.name);
            loadLikesAndComments(fallbackVideo);
          }
        })
        .catch(() => {
          // Fallback to MOCK_VIDEOS[0]
          const fallbackVideo = MOCK_VIDEOS[0];
          setVideo(fallbackVideo);
          setupUploaderDetails(fallbackVideo.user.name);
          loadLikesAndComments(fallbackVideo);
        });
    }

    function loadLikesAndComments(vid: Video) {
      if (typeof window !== "undefined") {
        const storedLikes = JSON.parse(localStorage.getItem(`c8l-tv-video-likes-${id}`) || '[]');
        const userUid = user?.uid || 'anonymous_spectator';
        setLiked(storedLikes.includes(userUid));
        setLikesCount(vid.likes + storedLikes.length);

        const storedComments = JSON.parse(localStorage.getItem(`c8l-tv-video-comments-${id}`) || '[]');
        if (storedComments.length > 0) {
          setComments(storedComments);
        } else {
          const defaultComments = [
            { author: "Hacker_C8L", text: "¡Tremendo el drop en el minuto 1:30!", date: "Hace 2 horas", isAiApproved: true },
            { author: "QuantumFan", text: "El videoclip tiene una estética premium total.", date: "Hace 5 horas", isAiApproved: true }
          ];
          localStorage.setItem(`c8l-tv-video-comments-${id}`, JSON.stringify(defaultComments));
          setComments(defaultComments);
        }
      }
    }

    function setupUploaderDetails(name: string) {
      if (typeof window !== "undefined") {
        const subs = JSON.parse(localStorage.getItem('c8l-tv-subs') || '[]');
        const cleanName = name.toLowerCase().replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, '').trim();
        const subscribed = subs.some((subName: string) => subName.toLowerCase().includes(cleanName));
        setIsSubscribed(subscribed);

        let baseCount = 15245;
        if (cleanName.includes("leo vela")) baseCount = 15245;
        else if (cleanName.includes("rayo")) baseCount = 8920;
        else if (cleanName.includes("melody")) baseCount = 24500;
        else if (cleanName.includes("beatmaster")) baseCount = 3410;
        else baseCount = 1200;

        setSubsCount(subscribed ? baseCount + 1 : baseCount);
      }
    }
  }, [id, user]);

  const handleSubscribe = () => {
    if (!video) return;
    if (typeof window !== "undefined") {
      const subs = JSON.parse(localStorage.getItem('c8l-tv-subs') || '[]');
      const nextSubs = [...subs];
      const cleanName = video.user.name.toLowerCase().replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, '').trim();
      const idx = nextSubs.findIndex((subName: string) => subName.toLowerCase().includes(cleanName));

      if (idx === -1) {
        nextSubs.push(video.user.name);
        setIsSubscribed(true);
        setSubsCount(prev => prev + 1);
        showNotification(language === "es" ? `Suscrito a ${video.user.name}` : `Subscribed to ${video.user.name}`, "success");
      } else {
        nextSubs.splice(idx, 1);
        setIsSubscribed(false);
        setSubsCount(prev => Math.max(0, prev - 1));
        showNotification(language === "es" ? `Suscripción cancelada` : `Unsubscribed`, "info");
      }
      localStorage.setItem('c8l-tv-subs', JSON.stringify(nextSubs));
    }
  };

  const handleLike = () => {
    if (liked) return;
    setLiked(true);
    setMascotState("celebrate");
    showNotification(language === "es" ? "¡Te gusta este video!" : "You liked this video!", "success");
    setTimeout(() => setMascotState("idle"), 2000);

    if (typeof window !== "undefined") {
      const storedLikes = JSON.parse(localStorage.getItem(`c8l-tv-video-likes-${id}`) || '[]');
      const userUid = user?.uid || 'anonymous_spectator';
      if (!storedLikes.includes(userUid)) {
        storedLikes.push(userUid);
        localStorage.setItem(`c8l-tv-video-likes-${id}`, JSON.stringify(storedLikes));
        setLikesCount(prev => prev + 1);
      }
    }
  };

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim()) return;

    setModerating(true);
    setMascotState("dance");
    setModerationAlert(null);

    setTimeout(() => {
      const isClean = !commentInput.toLowerCase().includes("tonto") && 
                      !commentInput.toLowerCase().includes("estúpido") && 
                      !commentInput.toLowerCase().includes("basura");

      if (isClean) {
        const newComment = { 
          author: user?.displayName || (language === "es" ? "Tú (Espectador)" : "You (Spectator)"), 
          text: commentInput, 
          date: language === "es" ? "Hace un momento" : "Just now", 
          isAiApproved: true 
        };

        if (typeof window !== "undefined") {
          const storedComments = JSON.parse(localStorage.getItem(`c8l-tv-video-comments-${id}`) || '[]');
          const updatedComments = [newComment, ...storedComments];
          localStorage.setItem(`c8l-tv-video-comments-${id}`, JSON.stringify(updatedComments));
          setComments(updatedComments);
        } else {
          setComments(prev => [newComment, ...prev]);
        }

        setCommentInput("");
        setMascotState("win");
        showNotification(language === "es" ? "🤖 [AI Moderator] Comentario aprobado y publicado." : "🤖 [AI Moderator] Comment approved and posted.", "success");
      } else {
        setMascotState("sad");
        setModerationAlert("Comentario retenido: El filtro de lenguaje de IA detectó términos potencialmente ofensivos.");
        showNotification(language === "es" ? "⚠️ Comentario bloqueado por IA" : "⚠️ Comment blocked by AI", "error");
      }
      setModerating(false);
      setTimeout(() => {
        setMascotState("idle");
        setModerationAlert(null);
      }, 4000);
    }, 1200);
  };

  if (!video) return null;

  const ytId = getYouTubeId(video.video_url || "") || (id.startsWith("yt-") ? id.substring(3) : id);

  return (
    <div className="min-h-screen bg-[#030303] text-white pt-28 pb-20 px-4 md:px-8 font-sans select-none relative overflow-hidden">
      <div className="digital-grid-animated" style={{ opacity: 0.12 }} />
      <div className="hologram-scanline" />
      <div className="max-w-7xl mx-auto flex flex-col lg:grid lg:grid-cols-12 gap-8 relative z-10">
        
        {/* LEFT COLUMN: Player & Info (8 columns) */}
        <main className="lg:col-span-8 space-y-6">
          <Link href="/feed" className="flex items-center gap-2 text-xs font-bold text-zinc-400 hover:text-white transition-colors pb-2 text-left">
            <ArrowLeft size={14} />
            <span>Volver a C8L TV Feed</span>
          </Link>

          {/* Video Player */}
          <div className="w-full bg-black border-3 border-black rounded-lg overflow-hidden relative aspect-video shadow-[5px_5px_0px_#00F3FF]">
            {video.video_url || ytId ? (
              <VideoPlayer 
                url={video.video_url || `https://www.youtube.com/watch?v=${ytId}`} 
                title={video.title} 
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-950 p-6">
                <span className="text-zinc-600 text-5xl mb-4">📺</span>
                <span className="text-sm font-mono text-zinc-400">Reproductor de Video Local C8L</span>
              </div>
            )}
          </div>

          {/* Video Metadata Header */}
          <div className="border-3 border-black bg-[#0d0d0e] p-6 shadow-[4px_4px_0px_#00F3FF]">
            <h1 className="font-heading font-black text-xl md:text-2xl text-white uppercase text-left">{video.title}</h1>
            
            <div className="flex flex-wrap justify-between items-center gap-4 mt-4 pt-4 border-t border-zinc-800">
              <div className="flex items-center gap-3">
                <img src={video.user.avatar} className="w-10 h-10 rounded-full border-2 border-[#D4AF37] object-cover" alt="avatar" />
                <div className="text-left">
                  <span className="text-sm font-bold block">{video.user.name}</span>
                  <span className="text-[10px] text-zinc-500 font-mono">
                    {subsCount.toLocaleString()} {language === "es" ? "Suscriptores" : "Subscribers"}
                  </span>
                </div>
                <button
                  onClick={handleSubscribe}
                  className={`ml-4 px-4 py-1.5 border-2 border-black rounded-[4px] font-heading font-black text-[10px] tracking-wider transition-all shadow-[2px_2px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] cursor-pointer ${
                    isSubscribed
                      ? 'bg-zinc-800 text-zinc-400 border-zinc-700'
                      : 'bg-gradient-to-r from-[#FF0055] to-[#8A2BE2] text-white hover:shadow-[3px_3px_0px_rgba(0,243,255,0.4)]'
                  }`}
                >
                  {isSubscribed 
                    ? (language === "es" ? "✓ SUSCRITO" : "✓ SUBSCRIBED") 
                    : (language === "es" ? "SUSCRIBIRSE" : "SUBSCRIBE")}
                </button>
              </div>

              <div className="flex items-center gap-3 font-mono text-xs">
                <span className="text-zinc-500">{video.views.toLocaleString()} vistas</span>
                
                <button 
                  onClick={handleLike}
                  className={`flex items-center gap-1 px-4 py-2 border-2 border-black rounded-[4px] font-heading font-black tracking-wider transition-all shadow-[2px_2px_0px_#000] cursor-pointer ${
                    liked 
                      ? 'bg-[#FF0055] text-white border-[#FF0055]' 
                      : 'bg-black text-zinc-400 hover:text-white hover:border-[#FF0055]'
                  }`}
                >
                  <Heart size={14} className={liked ? 'fill-white' : ''} />
                  <span>{likesCount}</span>
                </button>

                <button 
                  onClick={() => showNotification("¡Enlace copiado al portapapeles!", "success")}
                  className="flex items-center gap-1.5 px-4 py-2 border-2 border-black bg-black text-zinc-400 hover:text-white hover:border-[#00F3FF] rounded-[4px] font-heading font-black tracking-wider transition-all shadow-[2px_2px_0px_#000] cursor-pointer"
                  title="Compartir video"
                >
                  <Share2 size={14} />
                  <span>COMPARTIR</span>
                </button>
              </div>
            </div>

            <p className="text-xs text-zinc-400 mt-4 leading-relaxed font-sans font-medium text-left bg-black/40 p-4 border-2 border-black rounded-[4px] shadow-[2px_2px_0px_#000]">
              {video.description || "Sin descripción proporcionada."}
            </p>
          </div>

          {/* Interactive Comments Console */}
          <div className="border-3 border-black bg-[#0d0d0e] p-6 shadow-[4px_4px_0px_#FF0055]">
            <div className="flex border-b-2 border-black pb-3 mb-6 font-heading font-black text-sm uppercase tracking-wider gap-4">
              <button 
                onClick={() => setActiveTab("comments")} 
                className={`pb-1 cursor-pointer transition-all ${
                  activeTab === "comments" ? "text-[#FF0055] border-b-2 border-[#FF0055]" : "text-zinc-500 hover:text-white"
                }`}
              >
                💬 Comentarios ({comments.length})
              </button>
              <button 
                onClick={() => setActiveTab("details")} 
                className={`pb-1 cursor-pointer transition-all ${
                  activeTab === "details" ? "text-[#FF0055] border-b-2 border-[#FF0055]" : "text-zinc-500 hover:text-white"
                }`}
              >
                ⚙️ Telemetría de Video
              </button>
            </div>

            <AnimatePresence mode="wait">
              {activeTab === "comments" ? (
                <motion.div 
                  key="comments"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-6"
                >
                  {/* Write Comment Form */}
                  <form onSubmit={handleCommentSubmit} className="flex gap-3">
                    <input
                      type="text"
                      placeholder={language === "es" ? "Añadir un comentario público..." : "Add a public comment..."}
                      value={commentInput}
                      onChange={(e) => setCommentInput(e.target.value)}
                      disabled={moderating}
                      className="flex-grow bg-black border-3 border-black rounded-[4px] px-4 py-3 text-xs outline-none text-white font-mono focus:border-[#FF0055] transition-all"
                    />
                    <button
                      type="submit"
                      disabled={moderating || !commentInput.trim()}
                      className="px-6 bg-[#FF0055] hover:bg-[#CC0044] text-white border-2 border-black shadow-[2px_2px_0px_#000] rounded-[4px] font-heading font-black text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all disabled:opacity-40 cursor-pointer"
                    >
                      <Send size={12} />
                      <span>COMENTAR</span>
                    </button>
                  </form>

                  {/* Moderation Warning alert banner */}
                  {moderationAlert && (
                    <div className="bg-red-950/40 border-2 border-[#FF0055] p-3 text-[10px] text-[#FF0055] font-mono rounded-[4px] flex items-center gap-2">
                      <AlertTriangle size={14} className="shrink-0" />
                      <span>{moderationAlert}</span>
                    </div>
                  )}

                  {/* Comments list */}
                  <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2 no-scrollbar">
                    {comments.map((c, i) => (
                      <div key={i} className="bg-black/40 border border-zinc-800 p-3 rounded-[4px] flex gap-3 text-left">
                        <div className="w-8 h-8 rounded-full bg-zinc-900 flex items-center justify-center text-sm border border-zinc-700">👤</div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white font-mono">{c.author}</span>
                            <span className="text-[8px] text-zinc-600">{c.date}</span>
                          </div>
                          <p className="text-xs text-zinc-400 mt-1 font-sans font-medium">{c.text}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              ) : (
                <motion.div 
                  key="details"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="font-mono text-xs text-zinc-400 bg-black/60 p-4 border-2 border-zinc-900 rounded-[4px]"
                >
                  <div className="grid grid-cols-2 gap-y-2 border-b border-zinc-800 pb-3 mb-3 text-left">
                    <span className="text-zinc-600">VIDEO CODEC:</span> <span className="text-[#00F3FF] font-bold">H.264 / AVC</span>
                    <span className="text-zinc-600">ASPECT RATIO:</span> <span className="text-white">16:9 (1080p HD)</span>
                    <span className="text-zinc-600">STREAM RATE:</span> <span className="text-emerald-400">8000 KBPS FIXED</span>
                    <span className="text-zinc-600">CDN ROUTING:</span> <span className="text-white">OUTLET_NODE_MADRID_01</span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-zinc-500 text-left">
                    <Cpu size={12} className="text-[#FF0055]" />
                    <span>Algoritmos de monetización sincronizados con el Ledger de Coins C8L.</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>

        {/* RIGHT COLUMN: C8L TV Sidebar (4 columns) */}
        <aside className="lg:col-span-4 space-y-5">

          {/* Lion Mascot host widget */}
          <div className="border-[3px] border-black bg-[#0d0d0e] p-5 shadow-[4px_4px_0px_#D4AF37] flex flex-col items-center">
            <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest block mb-2 font-bold">📺 Mileoncito — C8L TV Host</span>
            <div className="w-full bg-[#151517] border-2 border-black p-2.5 rounded-[4px] text-[9px] text-zinc-300 font-sans font-semibold text-center mb-3">
              {moderating
                ? "🤖 [AI MODERATION] Analizando lingüística del comentario..."
                : "¡Disfruta del videoclip cuántico! Acaríciame si te gusta."}
            </div>
            <LionMascot state={mascotState} size={110} />
          </div>

          {/* Recommended Videos — C8L TV Sidebar */}
          <div className="border-[3px] border-black bg-[#0d0d0e] rounded-2xl overflow-hidden shadow-[4px_4px_0px_#FF0055]">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b-2 border-black bg-black/40">
              <h3 className="font-heading font-black text-sm text-white uppercase tracking-wider flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#FF0055] animate-pulse shadow-[0_0_6px_#FF0055]" />
                Vídeos Sugeridos
              </h3>
              <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest">
                {MOCK_VIDEOS.filter(v => v.id !== id).length} videos
              </span>
            </div>

            {/* Scrollable video list */}
            <div
              className="flex flex-col gap-0 divide-y divide-zinc-900/60 max-h-[640px] overflow-y-auto no-scrollbar"
            >
              {MOCK_VIDEOS.filter(v => v.id !== id).map((v, idx) => {
                const durationMin = v.duration > 0 ? Math.floor(v.duration / 60) : null;
                const durationSec = v.duration > 0 ? String(v.duration % 60).padStart(2, '0') : null;
                const durationLabel = durationMin !== null ? `${durationMin}:${durationSec}` : null;
                const viewsLabel = v.views >= 1000 ? `${(v.views / 1000).toFixed(1)}K` : String(v.views);

                return (
                  <Link key={v.id} href={`/watch?v=${v.id}`} className="block group">
                    <div className="flex gap-3 px-3 py-2.5 hover:bg-white/[0.03] transition-colors">
                      {/* Thumbnail */}
                      <div className="relative shrink-0 w-[100px] aspect-video rounded-[4px] overflow-hidden border border-zinc-800 group-hover:border-[#00F3FF] transition-colors bg-black">
                        <img
                          src={v.thumbnail_url}
                          className="w-full h-full object-cover"
                          alt={v.title}
                          loading="lazy"
                        />
                        {/* Duration / LIVE badge */}
                        <div className="absolute bottom-1 right-1">
                          {v.is_live ? (
                            <span className="bg-[#FF0055] text-white text-[8px] font-black px-1.5 py-0.5 rounded-sm uppercase tracking-wider shadow flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                              LIVE
                            </span>
                          ) : durationLabel ? (
                            <span className="bg-black/90 text-white text-[9px] font-mono px-1.5 py-0.5 rounded-sm">
                              {durationLabel}
                            </span>
                          ) : null}
                        </div>
                        {/* Rank badge */}
                        <div className="absolute top-1 left-1 w-4 h-4 rounded-sm bg-black/70 flex items-center justify-center text-[8px] font-black text-zinc-400">
                          {idx + 1}
                        </div>
                      </div>

                      {/* Meta */}
                      <div className="flex flex-col justify-center gap-0.5 min-w-0">
                        <h4 className="text-[11px] font-bold text-white line-clamp-2 leading-snug group-hover:text-[#00F3FF] transition-colors">
                          {v.title}
                        </h4>
                        <span className="text-[10px] text-zinc-500 font-mono truncate">{v.user.name}</span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[9px] text-zinc-600 font-mono">{viewsLabel} vistas</span>
                          {v.is_live && (
                            <span className="text-[9px] text-[#FF0055] font-bold uppercase tracking-wider">● En directo</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Footer */}
            <div className="px-4 py-2.5 border-t-2 border-black bg-black/30 text-center">
              <span className="text-[9px] font-mono text-zinc-600 uppercase tracking-wider">
                C8L TV · Contenido Cuántico
              </span>
            </div>
          </div>
        </aside>

      </div>
    </div>
  );
}
