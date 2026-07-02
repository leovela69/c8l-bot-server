// components/feed/SocialSimulator.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '@/context/AppContext';
import { Play, Activity, Sparkles, Heart, MessageSquare, Check, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface LogEntry {
  id: string;
  text: string;
  time: string;
  type: 'upload' | 'like' | 'comment' | 'system';
}

interface SocialSimulatorProps {
  onVideoUploaded: () => void;
}

// Constant configuration of the 10 simulation videos
const SIMULATION_VIDEOS = [
  {
    id: "sim-1",
    title: "Leo Vela - Ritmo de la Selva (Deep House Remix)",
    thumbnail_url: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?q=80&w=640",
    video_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    description: "Una mezcla profunda y tropical grabada en vivo en la cabina del Quantum Lounge.",
    duration: 280,
    views: 3120,
    likes: 12,
    created_at: new Date().toISOString(),
    is_live: false,
    user: {
      id: "leo_vela_uid",
      name: "Leo Vela 🦁",
      avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=150"
    },
    interactions: {
      likes: ["dj_rayo_uid", "reina_melody_uid"],
      comments: [
        { author: "DJ Rayo ⚡", avatar: "⚡", text: "¡El bajo en 808 te quedó increíble, Leo!", date: "Hace 1 minuto" },
        { author: "Reina Melody 👑", avatar: "👑", text: "¡Esa vocal de fondo es hipnótica!", date: "Hace 30 segundos" }
      ]
    }
  },
  {
    id: "sim-2",
    title: "DJ Rayo - Underground Acid Lounge Set",
    thumbnail_url: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=640",
    video_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    description: "Sonidos analógicos del sintetizador TB-303 directo al canal principal de la agencia.",
    duration: 3600,
    views: 4500,
    likes: 24,
    created_at: new Date().toISOString(),
    is_live: false,
    user: {
      id: "dj_rayo_uid",
      name: "DJ Rayo ⚡",
      avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?q=80&w=150"
    },
    interactions: {
      likes: ["beatmaster_uid", "leo_vela_uid"],
      comments: [
        { author: "BeatMaster 🎧", avatar: "🎧", text: "Las transiciones con el oscilador modular están brutales.", date: "Hace 1 minuto" },
        { author: "Leo Vela 🦁", avatar: "🦁", text: "¡Me diste ideas para el próximo PK battle!", date: "Hace 15 segundos" }
      ]
    }
  },
  {
    id: "sim-3",
    title: "Reina Melody - Bachata Cyberpunk (Live Cover)",
    thumbnail_url: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=640",
    video_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    description: "Fusionando ritmos latinos clásicos con efectos de modulación en C8L Studio.",
    duration: 210,
    views: 8900,
    likes: 85,
    created_at: new Date().toISOString(),
    is_live: false,
    user: {
      id: "reina_melody_uid",
      name: "Reina Melody 👑",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=150"
    },
    interactions: {
      likes: ["dj_rayo_uid", "beatmaster_uid"],
      comments: [
        { author: "DJ Rayo ⚡", avatar: "⚡", text: "Un ritmo espectacular. ¡Esencia pura de la agencia!", date: "Hace 2 minutos" },
        { author: "BeatMaster 🎧", avatar: "🎧", text: "El ecualizador del Studio IA le dio un brillo excelente a la voz.", date: "Hace 1 minuto" }
      ]
    }
  },
  {
    id: "sim-4",
    title: "BeatMaster - DAW Hacks: Creando melodías con IA",
    thumbnail_url: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?q=80&w=640",
    video_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    description: "Tutorial rápido sobre cómo usar el sintetizador MIDI integrado para acelerar tu producción de beats.",
    duration: 620,
    views: 1200,
    likes: 9,
    created_at: new Date().toISOString(),
    is_live: false,
    user: {
      id: "beatmaster_uid",
      name: "BeatMaster 🎧",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=150"
    },
    interactions: {
      likes: ["reina_melody_uid", "leo_vela_uid"],
      comments: [
        { author: "Reina Melody 👑", avatar: "👑", text: "Súper útil el tutorial, ya lo estoy aplicando.", date: "Hace 1 minuto" },
        { author: "Leo Vela 🦁", avatar: "🦁", text: "AntiGravity hace que la programación de sintes sea muy fácil de entender.", date: "Hace 10 segundos" }
      ]
    }
  },
  {
    id: "sim-5",
    title: "Leo Vela - Corazones de Neón (Acapella Synth)",
    thumbnail_url: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=640",
    video_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    description: "Voces limpias procesadas mediante un filtro especial vocoder en tiempo real.",
    duration: 195,
    views: 3100,
    likes: 42,
    created_at: new Date().toISOString(),
    is_live: false,
    user: {
      id: "leo_vela_uid",
      name: "Leo Vela 🦁",
      avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=150"
    },
    interactions: {
      likes: ["reina_melody_uid"],
      comments: [
        { author: "Reina Melody 👑", avatar: "👑", text: "Qué potencia vocal. El coro de sirena es de otro planeta.", date: "Hace 40 segundos" }
      ]
    }
  },
  {
    id: "sim-6",
    title: "DJ Rayo - Hardcore Beatmix #99",
    thumbnail_url: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=640",
    video_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    description: "150 BPM de puro techno de resistencia para reventar las salas virtuales de la agencia.",
    duration: 1200,
    views: 2400,
    likes: 18,
    created_at: new Date().toISOString(),
    is_live: false,
    user: {
      id: "dj_rayo_uid",
      name: "DJ Rayo ⚡",
      avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?q=80&w=150"
    },
    interactions: {
      likes: ["leo_vela_uid"],
      comments: [
        { author: "Leo Vela 🦁", avatar: "🦁", text: "Industrial puro. ¡Perfecto para entrenar en el casino!", date: "Hace 30 segundos" }
      ]
    }
  },
  {
    id: "sim-7",
    title: "Reina Melody - Techno Salsa Duet",
    thumbnail_url: "https://images.unsplash.com/photo-1516280440614-37939bbacd6a?q=80&w=640",
    video_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    description: "Una demostración experimental de fusión en vivo grabada directamente en el Lounge virtual de C8L.",
    duration: 245,
    views: 7300,
    likes: 67,
    created_at: new Date().toISOString(),
    is_live: false,
    user: {
      id: "reina_melody_uid",
      name: "Reina Melody 👑",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=150"
    },
    interactions: {
      likes: ["dj_rayo_uid"],
      comments: [
        { author: "DJ Rayo ⚡", avatar: "⚡", text: "Wow, nunca pensé que el techno y la salsa combinarían tan bien.", date: "Hace 1 minuto" }
      ]
    }
  },
  {
    id: "sim-8",
    title: "BeatMaster - Mastering Analógico vs Digital",
    thumbnail_url: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?q=80&w=640",
    video_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    description: "Analizando la calidez armónica de las válvulas frente a la precisión milimétrica del procesador DSP de IA.",
    duration: 890,
    views: 940,
    likes: 12,
    created_at: new Date().toISOString(),
    is_live: false,
    user: {
      id: "beatmaster_uid",
      name: "BeatMaster 🎧",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=150"
    },
    interactions: {
      likes: ["leo_vela_uid"],
      comments: [
        { author: "Leo Vela 🦁", avatar: "🦁", text: "Información oro para los que estamos produciendo en la agencia.", date: "Hace 1 minuto" }
      ]
    }
  },
  {
    id: "sim-9",
    title: "Leo Vela - PK Showdown: La Revancha de los Leones",
    thumbnail_url: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?q=80&w=640",
    video_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    description: "Los mejores momentos del torneo PK Battle de este fin de semana en las salas de streaming.",
    duration: 410,
    views: 6410,
    likes: 92,
    created_at: new Date().toISOString(),
    is_live: false,
    user: {
      id: "leo_vela_uid",
      name: "Leo Vela 🦁",
      avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=150"
    },
    interactions: {
      likes: ["reina_melody_uid"],
      comments: [
        { author: "Reina Melody 👑", avatar: "👑", text: "¡Estuvo cardíaco el final de la batalla!", date: "Hace 2 minutos" }
      ]
    }
  },
  {
    id: "sim-10",
    title: "DJ Rayo - Lofi Sunset Coding Mix",
    thumbnail_url: "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?q=80&w=640",
    video_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    description: "Una sesión relajante de ritmos lentos y nostálgicos para mantener el enfoque al escribir código.",
    duration: 7200,
    views: 8900,
    likes: 110,
    created_at: new Date().toISOString(),
    is_live: false,
    user: {
      id: "dj_rayo_uid",
      name: "DJ Rayo ⚡",
      avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?q=80&w=150"
    },
    interactions: {
      likes: ["beatmaster_uid"],
      comments: [
        { author: "BeatMaster 🎧", avatar: "🎧", text: "Perfecto para programar el ledger de la billetera.", date: "Hace 1 minuto" }
      ]
    }
  }
];

export function SocialSimulator({ onVideoUploaded }: SocialSimulatorProps) {
  const { language, showNotification } = useApp();
  const [isRunning, setIsRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const consoleEndRef = useRef<HTMLDivElement>(null);
  const simulationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-scroll logs terminal
  useEffect(() => {
    if (consoleEndRef.current) {
      consoleEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (simulationTimeoutRef.current) clearTimeout(simulationTimeoutRef.current);
    };
  }, []);

  const addLog = (text: string, type: 'upload' | 'like' | 'comment' | 'system') => {
    const time = new Date().toLocaleTimeString();
    const id = `${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    setLogs(prev => [...prev, { id, text, time, type }]);
  };

  const startSimulation = () => {
    if (isRunning) return;
    
    setIsRunning(true);
    setCurrentStep(0);
    setLogs([]);
    
    addLog("🤖 [Social Engine] Iniciando Motor de Simulación Cuántica...", "system");
    addLog("📊 [Social Engine] Preparando 10 cargas de video en lote...", "system");

    // Clean previous custom videos to start clean or preserve them.
    // We will overwrite previous simulation videos to prevent duplicates
    if (typeof window !== "undefined") {
      const customVideos = JSON.parse(localStorage.getItem('c8l-tv-custom-videos') || '[]');
      const filtered = customVideos.filter((v: any) => !v.id.startsWith("sim-"));
      localStorage.setItem('c8l-tv-custom-videos', JSON.stringify(filtered));
    }

    // Launch first video upload
    runSimulationStep(0);
  };

  const runSimulationStep = (step: number) => {
    if (step >= SIMULATION_VIDEOS.length) {
      setIsRunning(false);
      addLog("✅ [Social Engine] Simulación completada con éxito. 10 videos publicados y reaccionados.", "system");
      showNotification(
        language === "es" ? "🤖 Simulación Social completada con éxito" : "🤖 Social Simulation completed successfully",
        "success"
      );
      return;
    }

    setCurrentStep(step + 1);
    const video = SIMULATION_VIDEOS[step];
    
    // 1. Upload Video Action
    addLog(`🚀 [SUBIDA] ${video.user.name} publicó: "${video.title}"`, "upload");
    showNotification(
      language === "es" ? `🚀 ${video.user.name} subió un nuevo video` : `🚀 ${video.user.name} uploaded a video`,
      "info"
    );

    if (typeof window !== "undefined") {
      const customVideos = JSON.parse(localStorage.getItem('c8l-tv-custom-videos') || '[]');
      // Add custom video
      const newVideo = {
        id: video.id,
        title: video.title,
        thumbnail_url: video.thumbnail_url,
        duration: video.duration,
        views: video.views,
        likes: video.likes + video.interactions.likes.length,
        created_at: new Date().toISOString(),
        is_live: video.is_live,
        video_url: video.video_url,
        description: video.description,
        user: {
          id: video.user.id,
          name: video.user.name,
          avatar: video.user.avatar
        }
      };
      
      customVideos.push(newVideo);
      localStorage.setItem('c8l-tv-custom-videos', JSON.stringify(customVideos));
      
      // 2. Setup Likes in localStorage
      // We store the bots' likes as an array of UIDs
      localStorage.setItem(`c8l-tv-video-likes-${video.id}`, JSON.stringify(video.interactions.likes));

      // 3. Setup Comments in localStorage
      const initialComments = video.interactions.comments.map(c => ({
        author: c.author,
        avatar: c.avatar,
        text: c.text,
        date: c.date,
        isAiApproved: true
      }));
      localStorage.setItem(`c8l-tv-video-comments-${video.id}`, JSON.stringify(initialComments));
    }

    // Refresh the feed view immediately
    onVideoUploaded();

    // Trigger Reactions (Likes & Comments logs) after small delays
    simulationTimeoutRef.current = setTimeout(() => {
      // Log likes
      video.interactions.likes.forEach(likeUid => {
        const likerName = likeUid === "leo_vela_uid" ? "Leo Vela 🦁" :
                          likeUid === "dj_rayo_uid" ? "DJ Rayo ⚡" :
                          likeUid === "reina_melody_uid" ? "Reina Melody 👑" : "BeatMaster 🎧";
        addLog(`💖 [LIKE] A ${likerName} le gusta el video de ${video.user.name}`, "like");
      });

      // Log comments
      video.interactions.comments.forEach(comment => {
        addLog(`💬 [COMENTARIO] ${comment.author}: "${comment.text}"`, "comment");
      });

      // Schedule next video upload
      simulationTimeoutRef.current = setTimeout(() => {
        runSimulationStep(step + 1);
      }, 1500); // 1.5 seconds delay between steps
    }, 1000); // 1 second reaction delay
  };

  const clearSimulationData = () => {
    if (isRunning) return;
    if (typeof window !== "undefined") {
      const customVideos = JSON.parse(localStorage.getItem('c8l-tv-custom-videos') || '[]');
      const filtered = customVideos.filter((v: any) => !v.id.startsWith("sim-"));
      localStorage.setItem('c8l-tv-custom-videos', JSON.stringify(filtered));
      
      SIMULATION_VIDEOS.forEach(v => {
        localStorage.removeItem(`c8l-tv-video-likes-${v.id}`);
        localStorage.removeItem(`c8l-tv-video-comments-${v.id}`);
      });
      
      setLogs([]);
      onVideoUploaded();
      addLog("🗑️ [Social Engine] Datos de simulación social eliminados del almacenamiento local.", "system");
      showNotification(language === "es" ? "Datos del simulador borrados" : "Simulator data cleared", "info");
    }
  };

  return (
    <div className="border-3 border-black bg-[#0d0d0e] p-5 shadow-[4px_4px_0px_#D4AF37] max-w-full text-left relative overflow-hidden select-none">
      {/* Glow Scanline overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[size:100%_4px,6px_100%] pointer-events-none opacity-45"></div>

      <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <Activity size={18} className="text-[var(--color-gold)] animate-pulse" />
          <h3 className="font-heading font-black text-xs uppercase tracking-wider text-[var(--color-gold)]">
            C8L TV Social Simulator Engine
          </h3>
        </div>
        {isRunning && (
          <span className="flex items-center gap-1 px-2.5 py-0.5 border border-black bg-gradient-to-r from-red-600/20 to-pink-600/20 text-[9px] font-mono text-[#FF0055] animate-pulse rounded font-bold">
            <Sparkles size={8} />
            <span>Paso {currentStep}/10</span>
          </span>
        )}
      </div>

      <p className="text-[10px] text-zinc-400 font-sans font-medium leading-relaxed mb-4">
        Este simulador automatiza la interacción cruzada entre creadores de la agencia (likes, comentarios y carga de videos).
        Úsalo para verificar la interactividad en tiempo real de la plataforma.
      </p>

      {/* Terminal logs view */}
      <div className="w-full h-[180px] bg-black border-2 border-black rounded p-3 overflow-y-auto font-mono text-[9px] text-[#00F3FF] flex flex-col gap-1.5 shadow-[inner_0px_0px_10px_rgba(0,0,0,0.8)] no-scrollbar">
        {logs.length === 0 ? (
          <div className="text-zinc-600 h-full flex items-center justify-center italic text-center text-[10px]">
            [Motor inactivo. Haz clic en "Activar Simulación" para ver la actividad en vivo]
          </div>
        ) : (
          logs.map(log => (
            <div key={log.id} className="flex gap-2 leading-tight">
              <span className="text-zinc-600 shrink-0">[{log.time}]</span>
              <span className={`
                ${log.type === 'upload' ? 'text-[#00F3FF] font-bold' : ''}
                ${log.type === 'like' ? 'text-[#FF0055] font-semibold' : ''}
                ${log.type === 'comment' ? 'text-zinc-300 font-medium' : ''}
                ${log.type === 'system' ? 'text-[var(--color-gold)] font-bold' : ''}
              `}>
                {log.text}
              </span>
            </div>
          ))
        )}
        <div ref={consoleEndRef} />
      </div>

      {/* Action buttons */}
      <div className="flex gap-3 mt-4">
        <button
          onClick={startSimulation}
          disabled={isRunning}
          className="flex-grow flex items-center justify-center gap-1.5 py-3 bg-[var(--color-gold)] disabled:bg-zinc-800 text-black font-heading font-black text-[11px] uppercase tracking-wider border-2 border-black shadow-[3px_3px_0px_#000] hover:bg-yellow-400 transition-all cursor-pointer active:translate-x-[1px] active:translate-y-[1px]"
        >
          {isRunning ? (
            <>
              <RefreshCw size={12} className="animate-spin" />
              <span>Simulando Actividad...</span>
            </>
          ) : (
            <>
              <Play size={12} fill="currentColor" />
              <span>Activar Simulación Social</span>
            </>
          )}
        </button>

        <button
          onClick={clearSimulationData}
          disabled={isRunning}
          className="px-4 py-3 bg-zinc-900 border-2 border-black hover:border-red-600 hover:text-red-500 text-zinc-400 text-[10px] font-heading font-bold uppercase tracking-wider shadow-[3px_3px_0px_#000] transition active:translate-x-[1px] active:translate-y-[1px] cursor-pointer disabled:opacity-40"
          title="Borrar datos de simulación"
        >
          Borrar
        </button>
      </div>
    </div>
  );
}
