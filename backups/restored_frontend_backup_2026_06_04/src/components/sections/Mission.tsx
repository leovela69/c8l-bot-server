"use client";
import { motion } from "framer-motion";
import { ShieldCheck, Target, Zap } from "lucide-react";
import { useApp } from "../../context/AppContext";

export default function Mission() {
  const { t } = useApp();

  const pillars = [
    {
      title: t("mission-pillar-1-title"),
      description: t("mission-pillar-1-desc"),
      icon: <Target size={40} className="text-[var(--color-gold)]" />,
      delay: 0.2
    },
    {
      title: t("mission-pillar-2-title"),
      description: t("mission-pillar-2-desc"),
      icon: <ShieldCheck size={40} className="text-[var(--color-neon-blue)]" />,
      delay: 0.4
    },
    {
      title: t("mission-pillar-3-title"),
      description: t("mission-pillar-3-desc"),
      icon: <Zap size={40} className="text-[var(--color-gold)]" />,
      delay: 0.6
    }
  ];

  return (
    <section id="mission" className="py-32 relative text-white">
      {/* Decorative gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[var(--color-gold)]/5 to-transparent z-0 pointer-events-none"></div>

      <div className="container mx-auto px-6 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <span className="text-[var(--color-neon-blue)] uppercase tracking-widest text-sm font-bold block mb-4">{t("mission-pillars-title")}</span>
          <h2 className="text-4xl md:text-5xl font-heading font-black uppercase">
            Corazones <span className="text-[var(--color-gold)]">Locos</span>
          </h2>
          <div className="h-1 w-24 bg-gradient-to-r from-[var(--color-gold)] to-[var(--color-neon-blue)] mx-auto mt-6 rounded-full"></div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {pillars.map((pillar, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.8, delay: pillar.delay }}
              className="glass-panel p-10 rounded-2xl flex flex-col items-center text-center group hover:-translate-y-2 transition-transform duration-300"
            >
              <div className="mb-6 p-4 rounded-full bg-black/50 border border-white/5 relative">
                <div className="absolute inset-0 bg-[var(--color-gold)]/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                {pillar.icon}
              </div>
              <h3 className="text-2xl font-bold font-heading uppercase text-white mb-4">{pillar.title}</h3>
              <p className="text-zinc-400 leading-relaxed">
                {pillar.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
