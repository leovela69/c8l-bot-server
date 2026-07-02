"use client";
import React, { useRef, useState } from "react";
import { useApp } from "../../context/AppContext";
import { motion } from "framer-motion";
import { Volume2, VolumeX, Music } from "lucide-react";

import { TranslationKey } from "../../data/translations";

interface SoundItem {
  key: TranslationKey;
  url: string;
  emoji: string;
}

export default function Soundboard() {
  const { t, language, user } = useApp();
  const [ambientVolume, setAmbientVolume] = useState(0); // starts muted
  const [activePlayId, setActivePlayId] = useState<number | null>(null);
  
  const ambientAudioRef = useRef<HTMLAudioElement | null>(null);

  // High quality loopable MP3 links from SoundHelix
  const SOUNDS: SoundItem[] = [
    { key: "sound-neon-synth", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3", emoji: "🎹" },
    { key: "sound-house-beat", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3", emoji: "🥁" },
    { key: "sound-space-fx", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3", emoji: "✨" },
    { key: "sound-sub-drop", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3", emoji: "🔊" }
  ];

  const handleSoundboardTrigger = (index: number) => {
    setActivePlayId(index);
    const audio = new Audio(SOUNDS[index].url);
    audio.volume = 0.5;
    audio.play();

    // Reset indicator on ended
    audio.onended = () => {
      setActivePlayId(null);
    };
    
    // Auto reset indicator after 3 seconds for long loops
    setTimeout(() => {
      setActivePlayId(prev => prev === index ? null : prev);
    }, 3000);

    if (user) {
      import("../../utils/analytics").then(({ logActivity }) => {
        logActivity(
          user.uid,
          user.email || "",
          user.displayName || (user.email ? user.email.split("@")[0] : ""),
          "soundboard_play",
          `Activó sonido en la consola: "${t(SOUNDS[index].key)}" ${SOUNDS[index].emoji}`
        );
      }).catch(err => console.error("Error logging soundboard play:", err));
    }
  };

  const toggleAmbient = () => {
    if (!ambientAudioRef.current) {
      // Loopable background synth pad URL
      ambientAudioRef.current = new Audio("https://www.soundhelix.com/examples/mp3/SoundHelix-Song-16.mp3");
      ambientAudioRef.current.loop = true;
    }

    const wasMuted = ambientVolume === 0;

    if (ambientVolume > 0) {
      ambientAudioRef.current.pause();
      setAmbientVolume(0);
    } else {
      ambientAudioRef.current.volume = 0.25;
      ambientAudioRef.current.play().catch(e => console.log("Audio play blocked by browser. Click required first."));
      setAmbientVolume(25);
    }

    if (user) {
      import("../../utils/analytics").then(({ logActivity }) => {
        logActivity(
          user.uid,
          user.email || "",
          user.displayName || (user.email ? user.email.split("@")[0] : ""),
          "ambient_toggle",
          wasMuted ? "Activó atmósfera de sonido ambiente de fondo" : "Desactivó atmósfera de sonido ambiente de fondo"
        );
      }).catch(err => console.error("Error logging ambient toggle:", err));
    }
  };

  const handleAmbientVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setAmbientVolume(val);
    if (ambientAudioRef.current) {
      ambientAudioRef.current.volume = val / 100;
      if (val > 0 && ambientAudioRef.current.paused) {
        ambientAudioRef.current.play().catch(() => {});
      } else if (val === 0) {
        ambientAudioRef.current.pause();
      }
    }
  };

  return (
    <div className="glass-panel p-6 rounded-3xl bg-black/60 border border-white/5 flex flex-col gap-6 max-w-sm mx-auto shadow-2xl relative overflow-hidden box-glow-neon">
      <div className="flex justify-between items-center border-b border-white/5 pb-4">
        <div className="flex items-center gap-2">
          <Music className="text-[var(--color-neon-blue)] animate-pulse" size={18} />
          <h4 className="font-heading font-black text-xs uppercase tracking-wider text-white">
            {language === "es" ? "Consola de Sonido C8L" : "C8L Soundboard & Ambient"}
          </h4>
        </div>
        
        {/* Ambient Toggle button */}
        <button
          onClick={toggleAmbient}
          className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-400 hover:text-white transition cursor-pointer"
        >
          {ambientVolume > 0 ? <Volume2 size={14} className="text-[var(--color-neon-blue)]" /> : <VolumeX size={14} />}
        </button>
      </div>

      {/* Grid of triggerable sounds */}
      <div className="grid grid-cols-2 gap-4">
        {SOUNDS.map((sound, i) => (
          <button
            key={i}
            onClick={() => handleSoundboardTrigger(i)}
            className={`p-4 rounded-2xl border text-left transition-all duration-300 relative overflow-hidden flex flex-col justify-between h-24 cursor-pointer ${
              activePlayId === i
                ? "bg-[var(--color-neon-blue)]/10 border-[var(--color-neon-blue)] box-glow-neon"
                : "bg-white/5 border-white/10 hover:border-zinc-700"
            }`}
          >
            <span className="text-2xl">{sound.emoji}</span>
            <span className="text-[10px] font-heading font-black uppercase text-zinc-300 tracking-wider">
              {t(sound.key)}
            </span>

            {/* Glowing bar trigger animation */}
            {activePlayId === i && (
              <motion.div
                className="absolute bottom-0 left-0 right-0 h-1 bg-[var(--color-neon-blue)]"
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ duration: 3 }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Background Drone Ambient Control Slider */}
      <div className="flex flex-col gap-2 mt-2">
        <div className="flex justify-between items-center text-[9px] font-bold text-zinc-500 uppercase tracking-widest">
          <span>{language === "es" ? "Atmósfera de Fondo" : "Ambient Soundscape"}</span>
          <span>{ambientVolume}%</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px]">🔇</span>
          <input
            type="range"
            min="0"
            max="100"
            value={ambientVolume}
            onChange={handleAmbientVolumeChange}
            className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-[var(--color-neon-blue)] focus:outline-none"
          />
          <span className="text-[10px]">🔊</span>
        </div>
      </div>
    </div>
  );
}
