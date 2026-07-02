"use client";
import React from "react";
import { useApp } from "../../context/AppContext";
import { motion } from "framer-motion";

export default function Team() {
  const { t, language } = useApp();

  const members = [
    {
      name: "Leo Vela",
      role: t("role-leo"),
      img: "/assets/team/leo_vela.jpg",
      delay: 0.1,
    },
    {
      name: "Kukis",
      role: t("role-kukis"),
      img: "/assets/team/kukis.jpg",
      delay: 0.2,
    },
    {
      name: "Sherlyn",
      role: t("role-sherlyn"),
      img: "/assets/team/sherlyn.jpg",
      delay: 0.3,
    },
    {
      name: "Yusleny",
      role: t("role-yusleny"),
      img: "/assets/team/yusleny.jpg",
      delay: 0.4,
    },
  ];

  return (
    <section id="team" className="py-24 text-white relative bg-black/30">
      <div className="container mx-auto px-6 max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="font-heading font-black text-4xl md:text-5xl uppercase mb-4">
            {t("team-title")}
          </h2>
          <p className="text-zinc-400 font-light max-w-xl mx-auto">
            {t("team-subtitle")}
          </p>
        </motion.div>

        {/* Corporate Team Stage Banner */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="glass-panel max-w-4xl mx-auto p-5 rounded-3xl box-glow-gold bg-black/40 text-center mb-20 overflow-hidden"
        >
          <img 
            src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=1000" 
            alt="C8L Agency Staff Stage" 
            className="w-full h-auto rounded-2xl block object-cover filter contrast-[1.02] brightness-95 mb-6"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = "https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=1000";
            }}
          />
          <span className="text-xs font-bold text-[var(--color-gold)] tracking-[3px] uppercase block mb-2">
            C8L Agency Corporate Staff
          </span>
          <h3 className="font-heading font-black text-xl md:text-2xl uppercase text-white mb-4">
            {language === "es" ? "C.8.L AGENCY: EL FUTURO DE LA MUSICA Y EL ENTRETENIMIENTO" : "C.8.L AGENCY: THE FUTURE OF MUSIC AND ENTERTAINMENT"}
          </h3>
          <p className="text-zinc-400 text-sm max-w-2xl mx-auto leading-relaxed">
            {language === "es" 
              ? "Nuestro equipo directivo fusiona la producción artística del más alto nivel con tecnologías emergentes de Inteligencia Artificial para potenciar marcas internacionales y creadores de contenido."
              : "Our management team fuses highest-level artistic production with emerging Artificial Intelligence technologies to boost international brands and content creators."}
          </p>
        </motion.div>

        {/* Members Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {members.map((member, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: member.delay }}
              className="glass-panel p-6 rounded-2xl text-center relative group hover:-translate-y-2 transition-all duration-300 hover:border-[var(--color-gold)]/40"
            >
              {/* Gold Pin Badge */}
              <div className="absolute top-4 right-4 w-7 h-7 rounded-full bg-black/60 border border-[var(--color-gold)] flex items-center justify-center p-0.5 animate-pulse">
                <img src="/assets/c8l_logo_blue_chrome.png" className="w-full h-full object-contain" alt="C8L Pin" />
              </div>

              {/* Avatar Photo */}
              <div className="w-32 h-32 rounded-full overflow-hidden border-2 border-[var(--color-gold)]/60 mx-auto mb-6 box-glow-gold relative group-hover:scale-105 transition-transform duration-300">
                <img 
                  src={member.img} 
                  alt={member.name} 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=500";
                  }}
                />
              </div>

              <h4 className="font-heading font-black text-xl text-white mb-2 uppercase">
                {member.name}
              </h4>
              <p className="text-zinc-500 text-xs font-mono uppercase tracking-wider">
                {member.role}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

