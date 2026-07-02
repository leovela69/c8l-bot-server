"use client";
import React from "react";
import { useApp } from "../../context/AppContext";
import Soundboard from "../ui/Soundboard";

export default function AudioConsoleSection() {
  const { language } = useApp();

  return (
    <section id="audio-console" className="py-24 text-white relative bg-[#020203] border-t border-white/5">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-[var(--color-gold)]/5 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="container mx-auto px-6 max-w-5xl relative z-10 flex flex-col md:flex-row gap-12 items-center justify-between">
        
        {/* Texts */}
        <div className="max-w-md text-left">
          <span className="text-[10px] font-bold text-[var(--color-gold)] tracking-[3px] uppercase block mb-3">
            {language === "es" ? "DISEÑO SONORO C8L" : "C8L SONIC BRANDING"}
          </span>
          <h2 className="font-heading font-black text-4xl uppercase mb-4 text-white leading-tight">
            {language === "es" ? "Prueba la Atmósfera C8L" : "Experience the C8L Soundscape"}
          </h2>
          <p className="text-zinc-500 font-light text-sm mb-6 leading-relaxed">
            {language === "es"
              ? "Experimenta con nuestra consola de sonido interactiva. Combina sintetizadores, bases de batería y atmósferas envolventes producidas por Leo Vela para sentir la energía de nuestro estudio."
              : "Experiment with our interactive audio deck. Trigger high-fidelity synths, drum pads, and ambient soundscapes designed by Leo Vela."}
          </p>
          <div className="flex gap-4 items-center">
            <span className="w-2.5 h-2.5 rounded-full bg-[var(--color-neon-blue)] animate-pulse"></span>
            <span className="text-xs font-mono text-zinc-400 uppercase tracking-widest">
              {language === "es" ? "Motor de Audio Web: Activo" : "Web Audio Engine: Active"}
            </span>
          </div>
        </div>

        {/* Soundboard Component */}
        <div className="w-full max-w-sm">
          <Soundboard />
        </div>

      </div>
    </section>
  );
}
