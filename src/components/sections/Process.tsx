"use client";
import React from "react";
import { useApp } from "../../context/AppContext";
import { motion } from "framer-motion";

export default function Process() {
  const { t } = useApp();

  const steps = [
    {
      num: "01",
      title: t("process-1-title"),
      desc: t("process-1-desc"),
      delay: 0.1,
    },
    {
      num: "02",
      title: t("process-2-title"),
      desc: t("process-2-desc"),
      delay: 0.2,
    },
    {
      num: "03",
      title: t("process-3-title"),
      desc: t("process-3-desc"),
      delay: 0.3,
    },
  ];

  return (
    <section id="process" className="py-24 text-white relative bg-[#020202]">
      {/* Decorative gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[var(--color-gold)]/5 to-transparent z-0 pointer-events-none"></div>

      <div className="container mx-auto px-6 max-w-6xl relative z-10">
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center font-heading font-black text-4xl md:text-5xl uppercase mb-20"
        >
          {t("process-title")}
        </motion.h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {steps.map((step, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 45 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.8, delay: step.delay }}
              className="text-center p-8 glass-panel rounded-2xl relative group hover:border-[var(--color-gold)]/40 transition-colors"
            >
              <div className="font-heading font-black text-5xl md:text-6xl text-[var(--color-gold)] mb-6 drop-shadow-[0_0_10px_rgba(212,175,55,0.3)] transition-transform duration-300 group-hover:scale-110">
                {step.num}
              </div>
              <h3 className="font-heading font-bold text-xl uppercase tracking-wider mb-4 text-white">
                {step.title}
              </h3>
              <p className="text-zinc-400 text-sm leading-relaxed max-w-xs mx-auto">
                {step.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
