"use client";
import { useEffect, useState } from "react";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import { motion } from "framer-motion";
import SignupModal from "../ui/SignupModal";
import { useApp } from "../../context/AppContext";

export default function Hero() {
  const { t, language } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [init, setInit] = useState(false);

  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadSlim(engine);
    }).then(() => {
      setInit(true);
    });
  }, []);

  return (
    <section className="relative w-full h-screen flex items-center justify-center overflow-hidden">
      {/* Background Particles */}
      {init && (
        <Particles
          id="tsparticles"
        options={{
          fullScreen: { enable: false },
          fpsLimit: 60,
          particles: {
            color: { value: ["#D4AF37", "#00F3FF"] },
            links: {
              color: "random",
              distance: 150,
              enable: true,
              opacity: 0.2,
              width: 1,
            },
            move: {
              enable: true,
              speed: 1,
              direction: "none",
              random: true,
              straight: false,
              outModes: { default: "bounce" },
            },
            number: {
              density: { enable: true, width: 800 },
              value: 60,
            },
            opacity: { value: 0.5 },
            shape: { type: "circle" },
            size: { value: { min: 1, max: 3 } },
          },
          detectRetina: true,
        }}
        className="absolute inset-0 z-0 opacity-50"
      />
      )}

      {/* Hero Content */}
      <div className="relative z-10 text-center px-4 max-w-5xl mx-auto">
        <motion.h1 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="font-heading font-black text-5xl md:text-7xl lg:text-8xl mb-6 uppercase tracking-tighter"
        >
          {language === 'es' ? (
            <>
              <span className="block text-white">El Salto <span className="text-glow-neon text-[var(--color-neon-blue)]">Cuántico</span></span>
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-gold)] to-[var(--color-gold-light)] drop-shadow-[0_0_15px_rgba(212,175,55,0.4)]">
                En la Creación de Contenido
              </span>
            </>
          ) : (
            <>
              <span className="block text-white">{t("hero-leap-title")} <span className="text-glow-neon text-[var(--color-neon-blue)]">{t("hero-quantum-title")}</span> Leap</span>
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-gold)] to-[var(--color-gold-light)] drop-shadow-[0_0_15px_rgba(212,175,55,0.4)]">
                {t("hero-content-creation")}
              </span>
            </>
          )}
        </motion.h1>
        
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="text-zinc-400 text-lg md:text-xl max-w-2xl mx-auto mb-10"
        >
          {t("hero-sub-text")}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.8 }}
        >
          <button 
            onClick={() => setIsModalOpen(true)}
            className="group relative inline-flex items-center justify-center px-8 py-4 font-bold text-black uppercase tracking-wider bg-[var(--color-gold)] border-2 border-[var(--color-gold)] overflow-hidden rounded-full box-glow-gold hover:text-[var(--color-gold)] transition-colors"
          >
            <span className="absolute inset-0 w-full h-full -mt-1 rounded-lg opacity-30 bg-gradient-to-b from-transparent via-transparent to-black"></span>
            <span className="absolute inset-0 w-full h-full transition-all duration-300 ease-out transform translate-x-full bg-black group-hover:translate-x-0"></span>
            <span className="relative z-10 font-heading">{t("hero-join-cta")}</span>
          </button>
        </motion.div>
      </div>

      <SignupModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </section>
  );
}
