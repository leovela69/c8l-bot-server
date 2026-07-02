"use client";
import { motion } from "framer-motion";
import { useApp } from "../../context/AppContext";
import { Activity, Users, DollarSign, TrendingUp, Cpu } from "lucide-react";

export default function DashboardDemo() {
  const { t, language } = useApp();

  const metrics = [
    { title: t("metric-viewers"), value: "24,592", change: "+14%", icon: <Users className="text-[var(--color-neon-blue)]" /> },
    { title: t("metric-engagement"), value: "8.4%", change: "+2.1%", icon: <Activity className="text-[#10b981]" /> },
    { title: t("metric-revenue"), value: "$12,450", change: "+18%", icon: <DollarSign className="text-[var(--color-gold)]" /> },
    { title: t("metric-match"), value: "98%", change: "+1%", icon: <Cpu className="text-[var(--color-neon-blue)]" /> },
  ];

  return (
    <section id="dashboard" className="py-24 relative overflow-hidden bg-[#020202]">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-[var(--color-neon-blue)]/5 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-heading font-black uppercase mb-4 text-white">
            {t("dash-terminal-2")} <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-neon-blue)] to-[var(--color-neon-blue-light)] drop-shadow-[0_0_15px_rgba(0,243,255,0.4)]">{t("dash-terminal-1")}</span>
          </h2>
          <p className="text-zinc-500 max-w-xl mx-auto">
            {t("dash-desc")}
          </p>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="max-w-5xl mx-auto glass-panel border border-[var(--color-neon-blue)]/30 rounded-3xl overflow-hidden box-glow-neon shadow-2xl"
        >
          {/* Dashboard Header Mock */}
          <div className="bg-black/80 px-6 py-4 flex items-center justify-between border-b border-[var(--color-panel-border)]">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-[var(--color-gold)] flex items-center justify-center font-heading font-bold text-black border-2 border-white/20">
                L
              </div>
              <div>
                <h4 className="text-white font-bold text-sm">LocoGamer_Live</h4>
                <p className="text-xs text-[#10b981] flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse"></span> {language === 'es' ? 'EN LÍNEA' : 'ONLINE'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase text-zinc-500 font-mono">{t("dash-status")}</span>
              <ShieldCheckIcon />
            </div>
          </div>

          {/* Dashboard Body Mock */}
          <div className="p-8 bg-black/40 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {metrics.map((m, i) => (
              <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-5 hover:bg-white/10 transition-colors">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2 bg-black/50 rounded-lg">{m.icon}</div>
                  <span className="text-xs font-bold text-[#10b981] bg-[#10b981]/10 px-2 py-1 rounded-full flex items-center gap-1">
                    <TrendingUp size={10} /> {m.change}
                  </span>
                </div>
                <h5 className="text-zinc-400 text-xs uppercase tracking-widest font-heading mb-1">{m.title}</h5>
                <p className="text-2xl font-bold font-mono text-white tracking-tight">{m.value}</p>
              </div>
            ))}
          </div>

          <div className="p-8 border-t border-[var(--color-panel-border)]">
            <div className="h-48 rounded-xl bg-gradient-to-r from-[var(--color-neon-blue)]/5 to-transparent border border-white/5 flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
              <p className="text-zinc-500 font-mono text-sm relative z-10 flex items-center gap-3">
                <Cpu className="text-[var(--color-neon-blue)]" /> {t("dash-telemetry")}
              </p>
            </div>
          </div>

        </motion.div>
      </div>
    </section>
  );
}

function ShieldCheckIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-neon-blue)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      <path d="m9 12 2 2 4-4"/>
    </svg>
  );
}
