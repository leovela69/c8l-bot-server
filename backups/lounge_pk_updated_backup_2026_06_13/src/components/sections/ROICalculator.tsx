"use client";
import React, { useState, useMemo } from "react";
import { useApp } from "../../context/AppContext";
import { motion } from "framer-motion";
import { TrendingUp, DollarSign, Users } from "lucide-react";

export default function ROICalculator() {
  const { t, language } = useApp();
  const [budget, setBudget] = useState(2500);
  const [targetAudience, setTargetAudience] = useState(150000);
  const [currentStreams, setCurrentStreams] = useState(50000);

  // Industry average streaming payout per stream (e.g. $0.004)
  const PAYOUT_PER_STREAM = 0.004;

  const calculations = useMemo(() => {
    // Estimations based on C8L's campaign efficiency
    const projectedNewStreams = budget * 8;
    const totalProjectedStreams = currentStreams + projectedNewStreams;
    
    // Revenue calculations
    const estimatedNewRevenue = projectedNewStreams * PAYOUT_PER_STREAM;
    const totalRevenue = totalProjectedStreams * PAYOUT_PER_STREAM;
    
    // ROI Calculation
    const netProfit = estimatedNewRevenue - budget;
    const roiPercentage = budget > 0 ? (netProfit / budget) * 100 : 0;
    
    // Social engagement lift projection
    const projectedNewFollowers = Math.round(projectedNewStreams * 0.05);

    return {
      projectedNewStreams,
      totalProjectedStreams,
      estimatedNewRevenue,
      totalRevenue,
      netProfit,
      roiPercentage,
      projectedNewFollowers,
    };
  }, [budget, currentStreams]);

  return (
    <section id="roi-calculator" className="py-24 text-white relative bg-black/50 overflow-hidden border-t border-white/5">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-[var(--color-neon-blue)]/5 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="container mx-auto px-6 max-w-5xl relative z-10">
        <div className="text-center mb-16">
          <span className="text-[10px] font-bold text-[var(--color-gold)] tracking-[3px] uppercase block mb-3">
            {language === "es" ? "PLANIFICADOR DE IMPACTO" : "IMPACT PLANNER"}
          </span>
          <h2 className="font-heading font-black text-4xl md:text-5xl uppercase mb-4 text-white">
            {language === "es" ? "Calculadora de ROI de Streaming" : "Streaming ROI & Projection Calculator"}
          </h2>
          <p className="text-zinc-500 max-w-xl mx-auto font-light text-sm">
            {language === "es"
              ? "Proyecta los retornos financieros y el crecimiento de fans de tus campañas con la infraestructura tecnológica de C8L."
              : "Project financial returns and fan growth of your campaigns using C8L's technological infrastructure."}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Controls Side */}
          <div className="lg:col-span-6 glass-panel p-8 rounded-3xl bg-black/60 border-white/5 flex flex-col justify-between">
            <h3 className="font-heading font-black text-lg text-white mb-6 uppercase tracking-wider">
              {language === "es" ? "Variables de Campaña" : "Campaign Inputs"}
            </h3>

            <div className="flex flex-col gap-8">
              {/* Variable 1: Budget */}
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="text-zinc-400 font-bold uppercase tracking-wider">
                    {language === "es" ? "Presupuesto de Marketing" : "Marketing Budget"}
                  </span>
                  <span className="text-[var(--color-gold)] font-bold text-sm">
                    €{budget.toLocaleString()}
                  </span>
                </div>
                <input
                  type="range"
                  min="500"
                  max="20000"
                  step="500"
                  value={budget}
                  onChange={(e) => setBudget(Number(e.target.value))}
                  className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-[var(--color-gold)] focus:outline-none"
                />
                <div className="flex justify-between text-[10px] text-zinc-600 font-mono">
                  <span>€500</span>
                  <span>€20,000</span>
                </div>
              </div>

              {/* Variable 2: Current streams */}
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="text-zinc-400 font-bold uppercase tracking-wider">
                    {language === "es" ? "Reproducciones Mensuales Actuales" : "Current Monthly Streams"}
                  </span>
                  <span className="text-[var(--color-neon-blue)] font-bold text-sm">
                    {currentStreams.toLocaleString()}
                  </span>
                </div>
                <input
                  type="range"
                  min="5000"
                  max="1000000"
                  step="5000"
                  value={currentStreams}
                  onChange={(e) => setCurrentStreams(Number(e.target.value))}
                  className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-[var(--color-neon-blue)] focus:outline-none"
                />
                <div className="flex justify-between text-[10px] text-zinc-600 font-mono">
                  <span>5,000</span>
                  <span>1,000,000</span>
                </div>
              </div>

              {/* Variable 3: Target audience size */}
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="text-zinc-400 font-bold uppercase tracking-wider">
                    {language === "es" ? "Audiencia Objetivo" : "Target Audience Size"}
                  </span>
                  <span className="text-white font-bold text-sm">
                    {targetAudience.toLocaleString()} fans
                  </span>
                </div>
                <input
                  type="range"
                  min="10000"
                  max="2000000"
                  step="10000"
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(Number(e.target.value))}
                  className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-white focus:outline-none"
                />
                <div className="flex justify-between text-[10px] text-zinc-600 font-mono">
                  <span>10,000</span>
                  <span>2,000,000</span>
                </div>
              </div>
            </div>

            <div className="border-t border-white/5 pt-6 mt-8 text-[10px] text-zinc-500 font-mono">
              * {language === "es" 
                  ? "Las proyecciones se basan en una tasa de reproducción por euro promedio de C8L Arcade y viralización en TikTok."
                  : "Projections are based on average stream-per-euro metrics from C8L Arcade and TikTok viral loops."}
            </div>
          </div>

          {/* Results Side */}
          <div className="lg:col-span-6 flex flex-col gap-6">
            <div className="glass-panel p-8 rounded-3xl bg-black/40 border-[var(--color-gold)]/20 flex flex-col justify-between flex-grow box-glow-gold">
              
              <div>
                <h3 className="font-heading font-black text-lg text-[var(--color-gold)] mb-8 uppercase tracking-wider text-glow-gold">
                  {language === "es" ? "Crecimiento Proyectado" : "Projected Campaign Lift"}
                </h3>

                <div className="grid grid-cols-2 gap-6 mb-8">
                  <div>
                    <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block mb-1">
                      {language === "es" ? "Nuevas Reproducciones" : "New Streams"}
                    </span>
                    <span className="text-2xl font-bold font-mono text-white">
                      +{calculations.projectedNewStreams.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block mb-1">
                      {language === "es" ? "Retorno Est. (Royalties)" : "Est. Royalty Return"}
                    </span>
                    <span className="text-2xl font-bold font-mono text-[var(--color-neon-blue)] text-glow-neon">
                      €{calculations.estimatedNewRevenue.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6 mb-8 border-t border-white/5 pt-6">
                  <div>
                    <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block mb-1">
                      {language === "es" ? "Nuevos Seguidores Est." : "Est. New Followers"}
                    </span>
                    <span className="text-2xl font-bold font-mono text-white">
                      +{calculations.projectedNewFollowers.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block mb-1">
                      {language === "es" ? "Rendimiento Neto ROI" : "Net Profit / ROI"}
                    </span>
                    <span className={`text-2xl font-bold font-mono ${calculations.netProfit >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {calculations.roiPercentage.toFixed(0)}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Progress visual indicator bar */}
              <div className="w-full bg-zinc-900 rounded-full h-3.5 overflow-hidden border border-white/5 relative p-0.5">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-[var(--color-neon-blue)] to-[var(--color-gold)]"
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, Math.max(10, (calculations.estimatedNewRevenue / budget) * 100))}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>

              <div className="mt-8 flex justify-between items-center">
                <div>
                  <p className="text-xs font-bold text-white uppercase font-heading">
                    {language === "es" ? "¿Listo para expandir tu marca?" : "Ready to scale your reach?"}
                  </p>
                  <p className="text-[10px] text-zinc-400 font-mono">
                    {language === "es" ? "Recibe un dossier completo sin costo." : "Get a customized strategy pitch."}
                  </p>
                </div>
                <a
                  href="#contact"
                  className="px-5 py-3 bg-[var(--color-gold)] text-black font-heading font-black text-[10px] uppercase rounded-xl hover:bg-[var(--color-gold-light)] transition-colors tracking-widest box-glow-gold"
                >
                  {language === "es" ? "SOLICITAR PROPUESTA" : "REQUEST STRATEGY"}
                </a>
              </div>

            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
