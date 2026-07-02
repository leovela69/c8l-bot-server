"use client";
import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import DynamicLogoWebGL from "../ui/DynamicLogoWebGL";
import { Sparkles, Trophy, Crown, Flame } from "lucide-react";

export default function Pricing() {
  const { t, language, subscribeToPlan } = useApp();
  const router = useRouter();

  // Track hovered state for cards to speed up logo animation
  const [hoveredCard, setHoveredCard] = useState<"basic" | "premium" | "agency" | null>(null);

  const handleSubscribe = (plan: "basic" | "premium" | "agency") => {
    subscribeToPlan(plan);
    setTimeout(() => {
      const msg = language === "es" 
        ? "¿Quieres ir al área exclusiva de la Comunidad Corazones Locos?" 
        : "Would you like to visit the exclusive Corazones Locos Community hub?";
      if (confirm(msg)) {
        router.push("/community");
      }
    }, 1500);
  };

  return (
    <section id="pricing" className="py-24 text-white relative bg-black/30">
      <div className="container mx-auto px-6 max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="font-heading font-black text-4xl md:text-5xl uppercase mb-4 text-glow-gold">
            {t("pricing-title")}
          </h2>
          <p className="text-zinc-400 font-light max-w-xl mx-auto">
            {t("pricing-subtitle")}
          </p>
        </motion.div>

        {/* Hologram Graphic Board (Dynamic replacement) */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="glass-panel max-w-4xl mx-auto p-8 rounded-3xl border border-[var(--color-gold)]/30 box-glow-gold bg-black/70 text-center mb-20 overflow-hidden relative"
        >
          {/* Hologram background effects */}
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent pointer-events-none"></div>
          <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-400 via-yellow-600 to-black pointer-events-none"></div>
          
          {/* Scanline overlay */}
          <div 
            className="absolute inset-0 pointer-events-none opacity-20"
            style={{
              background: "linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06))",
              backgroundSize: "100% 4px, 6px 100%"
            }}
          />

          <div className="flex flex-col items-center justify-center relative z-10 py-6">
            <span className="text-[10px] font-mono text-[var(--color-gold)] uppercase tracking-[4px] font-black block mb-4 animate-pulse">
              🛸 C8L HOLOGRAM DE SUSCRIPCIONES MULTICAPA 🛸
            </span>
            
            {/* Massive central dynamic logo */}
            <div className="relative group cursor-pointer p-4">
              <div className="absolute inset-0 bg-[var(--color-gold)]/5 rounded-full filter blur-xl group-hover:bg-[var(--color-gold)]/10 transition-all duration-500"></div>
              <DynamicLogoWebGL hovered={true} size={220} />
            </div>

            <div className="max-w-md mt-6">
              <h4 className="font-heading font-black text-sm uppercase text-white tracking-widest mb-2">
                {language === "es" ? "DISEÑO VECTORIAL DE ALTA GAMA" : "HIGH-FIDELITY VECTOR DESIGN"}
              </h4>
              <p className="text-zinc-500 text-xs leading-relaxed">
                {language === "es"
                  ? "Visualiza los privilegios exclusivos de nuestra marca representados en el Escudo Dorado, las Alas del Ángel y el Latido de Corazones Locos."
                  : "Visualize the exclusive privileges of our brand represented in the Golden Shield, Angel Wings, and the Corazones Locos Heartbeat."}
              </p>
            </div>
          </div>
          
          {/* Holographic grid projector line */}
          <div className="h-0.5 w-[80%] mx-auto bg-gradient-to-r from-transparent via-[var(--color-gold)]/40 to-transparent animate-pulse mt-4"></div>
        </motion.div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          
          {/* Basic Plan (Suscripción Gratuita) */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            onMouseEnter={() => setHoveredCard("basic")}
            onMouseLeave={() => setHoveredCard(null)}
            className="glass-panel p-8 rounded-3xl flex flex-col justify-between text-center relative group hover:border-zinc-700/80 transition-all bg-black/40 hover:-translate-y-1.5"
          >
            <div>
              {/* Dynamic Logo integrated and connected to hover */}
              <div className="w-32 h-32 mx-auto mb-4 flex items-center justify-center relative">
                <DynamicLogoWebGL hovered={hoveredCard === "basic"} size={110} />
              </div>

              <div className="flex items-center justify-center gap-1.5 mb-2">
                <Flame className="text-zinc-400" size={16} />
                <h3 className="font-heading font-black text-2xl uppercase text-white">
                  {t("pricing-basic-title")}
                </h3>
              </div>

              <p className="text-zinc-500 text-xs leading-relaxed mb-6">
                {t("pricing-basic-desc")}
              </p>
              <div className="font-mono text-3xl font-bold text-white mb-8">
                €9.99<span className="text-xs text-zinc-500 font-sans font-normal">{t("prod-per-month")}</span>
              </div>
              
              <ul className="text-zinc-400 text-xs flex flex-col gap-4 mb-8 text-left max-w-xs mx-auto border-t border-white/5 pt-6">
                <li className="flex items-center gap-2">
                  <span className="text-[var(--color-gold)] font-bold">✓</span> {t("pricing-basic-feat1")}
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-[var(--color-gold)] font-bold">✓</span> {t("pricing-basic-feat2")}
                </li>
                <li className="flex items-center gap-2 opacity-35 line-through">
                  <span className="text-red-500 font-bold">✕</span> {language === "es" ? "Casino Premium & Eventos" : "Premium Casino & Events"}
                </li>
                <li className="flex items-center gap-2 opacity-35 line-through">
                  <span className="text-red-500 font-bold">✕</span> {language === "es" ? "Creación de Música IA" : "AI Music Studio"}
                </li>
              </ul>
            </div>
            
            <button 
              onClick={() => handleSubscribe("basic")}
              className="w-full py-3.5 font-heading font-bold text-xs uppercase bg-white/5 border border-white/10 text-white rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
            >
              {t("pricing-basic-btn")}
            </button>
          </motion.div>

          {/* Premium Plan (Suscripción Pago - Popular) */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            onMouseEnter={() => setHoveredCard("premium")}
            onMouseLeave={() => setHoveredCard(null)}
            className="glass-panel p-8 rounded-3xl flex flex-col justify-between text-center relative border-[var(--color-gold)]/40 box-glow-gold scale-[1.03] bg-black/60 group hover:-translate-y-1.5 transition-all"
          >
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[var(--color-gold)] text-black text-[9px] font-sans font-extrabold px-4 py-1.5 rounded-full uppercase tracking-[2px] shadow-lg z-20">
              {t("pricing-best-deal")}
            </div>

            <div>
              {/* Dynamic Logo integrated and connected to hover */}
              <div className="w-32 h-32 mx-auto mb-4 flex items-center justify-center relative">
                <DynamicLogoWebGL hovered={hoveredCard === "premium"} size={110} />
              </div>

              <div className="flex items-center justify-center gap-1.5 mb-2">
                <Trophy className="text-[var(--color-gold)]" size={16} />
                <h3 className="font-heading font-black text-2xl uppercase text-[var(--color-gold)]">
                  {t("pricing-premium-title")}
                </h3>
              </div>

              <p className="text-zinc-500 text-xs leading-relaxed mb-6">
                {t("pricing-premium-desc")}
              </p>
              <div className="font-mono text-3xl font-bold text-[var(--color-gold)] mb-8">
                €24.99<span className="text-xs text-zinc-500 font-sans font-normal">{t("prod-per-month")}</span>
              </div>

              <ul className="text-zinc-300 text-xs flex flex-col gap-4 mb-8 text-left max-w-xs mx-auto border-t border-[var(--color-gold)]/20 pt-6">
                <li className="flex items-center gap-2">
                  <span className="text-[var(--color-gold)] font-bold">✓</span> {t("pricing-premium-feat1")}
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-[var(--color-gold)] font-bold">✓</span> {t("pricing-premium-feat2")}
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-[var(--color-gold)] font-bold">✓</span> {t("pricing-premium-feat3")}
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-[var(--color-gold)] font-bold">✓</span> {t("pricing-premium-feat4")}
                </li>
              </ul>
            </div>

            <button 
              onClick={() => handleSubscribe("premium")}
              className="w-full py-3.5 font-heading font-bold text-xs uppercase bg-[var(--color-gold)] text-black rounded-xl hover:bg-[var(--color-gold-light)] transition-colors box-glow-gold cursor-pointer"
            >
              {t("pricing-premium-btn")}
            </button>
          </motion.div>

          {/* Agency VIP Plan (Suscripción Premium) */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            onMouseEnter={() => setHoveredCard("agency")}
            onMouseLeave={() => setHoveredCard(null)}
            className="glass-panel p-8 rounded-3xl flex flex-col justify-between text-center relative group hover:border-zinc-700/80 transition-all bg-black/40 hover:-translate-y-1.5"
          >
            <div>
              {/* Dynamic Logo integrated and connected to hover */}
              <div className="w-32 h-32 mx-auto mb-4 flex items-center justify-center relative">
                <DynamicLogoWebGL hovered={hoveredCard === "agency"} size={110} />
              </div>

              <div className="flex items-center justify-center gap-1.5 mb-2">
                <Crown className="text-cyan-400" size={16} />
                <h3 className="font-heading font-black text-2xl uppercase text-white">
                  {t("pricing-agency-title")}
                </h3>
              </div>

              <p className="text-zinc-500 text-xs leading-relaxed mb-6">
                {t("pricing-agency-desc")}
              </p>
              <div className="font-mono text-3xl font-bold text-white mb-8">
                €49.99<span className="text-xs text-zinc-500 font-sans font-normal">{t("prod-per-month")}</span>
              </div>

              <ul className="text-zinc-400 text-xs flex flex-col gap-4 mb-8 text-left max-w-xs mx-auto border-t border-white/5 pt-6">
                <li className="flex items-center gap-2">
                  <span className="text-[var(--color-gold)] font-bold">✓</span> {t("pricing-agency-feat1")}
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-[var(--color-gold)] font-bold">✓</span> {t("pricing-agency-feat2")}
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-[var(--color-gold)] font-bold">✓</span> {t("pricing-agency-feat3")}
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-[var(--color-gold)] font-bold">✓</span> {t("pricing-agency-feat4")}
                </li>
              </ul>
            </div>

            <button 
              onClick={() => handleSubscribe("agency")}
              className="w-full py-3.5 font-heading font-bold text-xs uppercase bg-white/5 border border-white/10 text-white rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
            >
              {t("pricing-agency-btn")}
            </button>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
