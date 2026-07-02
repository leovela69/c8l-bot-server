"use client";
import React, { useState, useEffect } from "react";
import { useApp } from "../../context/AppContext";
import { motion } from "framer-motion";
import trendData from "../../data/market_trend.json";

export default function AdsSection() {
  const { t, language } = useApp();
  const [trend, setTrend] = useState(trendData);

  useEffect(() => {
    setTrend(trendData);
  }, []);

  return (
    <section id="ads" className="py-24 text-white relative bg-black/40">
      <div className="container mx-auto px-6 max-w-6xl animate-fade">
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center font-heading font-black text-4xl md:text-5xl uppercase mb-4"
        >
          C8L Agency & Staff
        </motion.h2>
        <p className="text-center text-zinc-400 font-light text-sm mb-12 max-w-md mx-auto">
          {language === "es" 
            ? "Conoce a los creadores de campañas de impacto bajo la dirección de Leo Vela" 
            : "Meet the creators of impact campaigns under the direction of Leo Vela"}
        </p>
        
        {/* Daily Trend Ticker */}
        {trend && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="glass-panel max-w-3xl mx-auto p-4 px-8 rounded-full text-center border-[var(--color-gold)]/20 bg-[var(--color-gold)]/5 font-semibold text-sm mb-16 box-glow-gold flex flex-col sm:flex-row items-center justify-center gap-2"
          >
            <span className="text-[10px] font-bold text-[var(--color-gold)] tracking-widest uppercase flex-shrink-0">
              ★ {language === "es" ? "TENDENCIA RECIENTE" : "RECENT TREND"}:
            </span>
            <span className="text-zinc-200">
              {trend.tagline}
            </span>
          </motion.div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {/* Leo Vela Producer Card */}
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="glass-panel p-10 rounded-3xl flex flex-col justify-between items-start relative group overflow-hidden hover:border-[var(--color-gold)]/30 duration-300"
          >
            <div className="absolute top-0 right-0 w-48 h-48 bg-[var(--color-gold)]/5 blur-[50px] rounded-full pointer-events-none group-hover:bg-[var(--color-gold)]/10 transition-colors"></div>
            
            <div className="relative z-10 w-full">
              <div className="w-14 h-14 rounded-full overflow-hidden border border-[var(--color-gold)]/30 bg-black flex items-center justify-center p-1.5 mb-8 animate-spin-slow">
                <img src="/assets/c8l_logo_blue_chrome.png" className="w-full h-full object-contain" alt="C8L" />
              </div>
              <h3 className="font-heading font-black text-2xl text-[var(--color-gold)] mb-4">
                {language === "es" ? "Leo Vela - Dirección de Producción" : "Leo Vela - Production Direction"}
              </h3>
              <p className="text-zinc-400 text-sm leading-relaxed mb-8">
                {language === "es" 
                  ? "Identidad musical de alta gama, spots estratégicos y lanzamientos artísticos globales. Leo Vela lidera la dirección de sonido y branding sonoro de C8L Agency para posicionar marcas en los top charts."
                  : "High-end musical identity, strategic spots and global artistic launches. Leo Vela leads sound direction and audio branding at C8L Agency to place brands on the top charts."}
              </p>
            </div>
            
            <a 
              href="#contact" 
              className="px-6 py-3 font-heading font-bold text-xs uppercase bg-[var(--color-gold)] text-black rounded-lg hover:bg-[var(--color-gold-light)] transition-colors box-glow-gold relative z-10"
            >
              {language === "es" ? "Contratar Producción" : "Hire Production"}
            </a>
          </motion.div>

          {/* Staff & Talents Card */}
          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="glass-panel p-10 rounded-3xl flex flex-col justify-between items-start relative group overflow-hidden hover:border-[var(--color-gold)]/30 duration-300"
          >
            <div className="absolute top-0 right-0 w-48 h-48 bg-purple-500/5 blur-[50px] rounded-full pointer-events-none group-hover:bg-purple-500/10 transition-colors"></div>

            <div className="relative z-10 w-full">
              <div className="w-14 h-14 rounded-full overflow-hidden border border-purple-500/30 bg-black flex items-center justify-center p-1.5 mb-8 animate-pulse">
                <img 
                  src="/assets/c8l_logo_purple_3d.png" 
                  className="w-full h-full object-contain" 
                  alt="C8L" 
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = "/assets/c8l_logo_blue_chrome.png";
                  }} 
                />
              </div>
              <h3 className="font-heading font-black text-2xl text-[var(--color-gold)] mb-4">
                C8L Staff & Talents
              </h3>
              <p className="text-zinc-400 text-sm leading-relaxed mb-8">
                {language === "es" 
                  ? "Acceso directo a nuestra cartera selecta de artistas y creadores, representados de manera exclusiva por Sherlyn (Recursos Humanos) y proyectados digitalmente por Yusleny (Marketing)."
                  : "Direct access to our select roster of artists and creators, represented exclusively by Sherlyn (Human Resources) and digitally projected by Yusleny (Marketing)."}
              </p>
            </div>

            <a 
              href="#contact" 
              className="px-6 py-3 font-heading font-bold text-xs uppercase bg-transparent text-white border border-white/15 rounded-lg hover:bg-white/5 transition-colors relative z-10"
            >
              {language === "es" ? "Ver Dossier de Talentos" : "View Talent Dossier"}
            </a>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
