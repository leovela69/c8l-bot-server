"use client";
import React from "react";
import { useApp } from "../../context/AppContext";
import { Music, Gamepad2, BarChart3, ShoppingBag } from "lucide-react";
import { motion } from "framer-motion";

export default function Services() {
  const { t } = useApp();

  return (
    <section id="services" className="py-24 text-white relative bg-black/40">
      <div className="container mx-auto px-6 max-w-6xl">
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center font-heading font-black text-4xl md:text-5xl uppercase mb-16"
        >
          {t("services-title")}
        </motion.h2>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Dashboard Preview */}
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="lg:col-span-6"
          >
            <div className="glass-panel p-3 rounded-3xl box-glow-gold relative overflow-hidden group">
              <img 
                src="https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=1000" 
                alt="C8L Services Dashboard" 
                className="w-full h-auto rounded-2xl block object-cover filter contrast-[1.05] brightness-95 transition-transform duration-700 group-hover:scale-105"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1000";
                }}
              />
            </div>
          </motion.div>

          {/* Right Column: Services Cards List */}
          <div className="lg:col-span-6 flex flex-col gap-6">
            {/* Service 1 */}
            <motion.div 
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="glass-panel p-6 rounded-2xl flex gap-5 items-start cursor-pointer hover:border-[var(--color-gold)] transition-colors duration-300 group"
            >
              <div className="p-3 bg-[var(--color-gold)]/10 border border-[var(--color-gold)] rounded-full text-[var(--color-gold)] group-hover:scale-110 transition-transform flex-shrink-0">
                <Music size={22} />
              </div>
              <div>
                <h3 className="font-heading font-black text-xl mb-2 text-white group-hover:text-[var(--color-gold)] transition-colors">
                  {t("service-1-title")}
                </h3>
                <p className="text-zinc-400 text-sm leading-relaxed">
                  {t("service-1-desc")}
                </p>
              </div>
            </motion.div>

            {/* Service 2 */}
            <motion.div 
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="glass-panel p-6 rounded-2xl flex gap-5 items-start cursor-pointer hover:border-[var(--color-gold)] transition-colors duration-300 group"
            >
              <div className="p-3 bg-[var(--color-gold)]/10 border border-[var(--color-gold)] rounded-full text-[var(--color-gold)] group-hover:scale-110 transition-transform flex-shrink-0">
                <Gamepad2 size={22} />
              </div>
              <div>
                <h3 className="font-heading font-black text-xl mb-2 text-white group-hover:text-[var(--color-gold)] transition-colors">
                  {t("service-2-title")}
                </h3>
                <p className="text-zinc-400 text-sm leading-relaxed">
                  {t("service-2-desc")}
                </p>
              </div>
            </motion.div>

            {/* Service 3 */}
            <motion.div 
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="glass-panel p-6 rounded-2xl flex gap-5 items-start cursor-pointer hover:border-[var(--color-gold)] transition-colors duration-300 group"
            >
              <div className="p-3 bg-[var(--color-gold)]/10 border border-[var(--color-gold)] rounded-full text-[var(--color-gold)] group-hover:scale-110 transition-transform flex-shrink-0">
                <BarChart3 size={22} />
              </div>
              <div>
                <h3 className="font-heading font-black text-xl mb-2 text-white group-hover:text-[var(--color-gold)] transition-colors">
                  {t("service-3-title")}
                </h3>
                <p className="text-zinc-400 text-sm leading-relaxed">
                  {t("service-3-desc")}
                </p>
              </div>
            </motion.div>

            {/* Service 4 */}
            <motion.div 
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="glass-panel p-6 rounded-2xl flex gap-5 items-start cursor-pointer hover:border-[var(--color-gold)] transition-colors duration-300 group"
            >
              <div className="p-3 bg-[var(--color-gold)]/10 border border-[var(--color-gold)] rounded-full text-[var(--color-gold)] group-hover:scale-110 transition-transform flex-shrink-0">
                <ShoppingBag size={22} />
              </div>
              <div>
                <h3 className="font-heading font-black text-xl mb-2 text-white group-hover:text-[var(--color-gold)] transition-colors">
                  {t("service-4-title")}
                </h3>
                <p className="text-zinc-400 text-sm leading-relaxed">
                  {t("service-4-desc")}
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
