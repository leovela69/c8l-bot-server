"use client";
import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import { motion } from "framer-motion";

export default function Contact() {
  const { t, language, showNotification } = useApp();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name && email && message) {
      showNotification(
        language === "es"
          ? `¡Mensaje enviado con éxito! Gracias ${name}, nos pondremos en contacto pronto.`
          : `Message sent successfully! Thank you ${name}, we will contact you soon.`,
        "success"
      );
      setName("");
      setEmail("");
      setMessage("");
    } else {
      showNotification(
        language === "es" ? "Por favor completa todos los campos." : "Please fill in all fields.",
        "error"
      );
    }
  };

  return (
    <section id="contact" className="py-24 text-white relative overflow-hidden bg-black">
      {/* Background Concert Image with blur & mask */}
      <div className="absolute inset-0 z-0 opacity-15 filter blur-[2px]">
        <img 
          src="https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=1000" 
          alt="Concert Background" 
          className="w-full h-full object-cover"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=1000";
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black"></div>
      </div>

      <div className="container mx-auto px-6 max-w-4xl relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="font-heading font-black text-4xl md:text-5xl uppercase mb-4">
            {t("contact-title")}
          </h2>
          <p className="text-zinc-400 font-light max-w-xl mx-auto">
            {t("contact-desc")}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="glass-panel p-8 md:p-12 rounded-3xl box-glow-gold bg-black/50 max-w-2xl mx-auto"
        >
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">
                  {language === "es" ? "Nombre Completo" : "Full Name"}
                </label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={language === "es" ? "Tu nombre" : "Your name"}
                  required 
                  className="w-full p-4 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:border-[var(--color-gold)] transition-colors text-sm"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">
                  {language === "es" ? "Correo Electrónico" : "Email Address"}
                </label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@correo.com" 
                  required 
                  className="w-full p-4 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:border-[var(--color-gold)] transition-colors text-sm"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">
                {language === "es" ? "Mensaje" : "Message"}
              </label>
              <textarea 
                rows={5} 
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={language === "es" ? "Cuéntanos sobre tu proyecto, objetivos y plazos..." : "Tell us about your project, goals, and timeline..."}
                required 
                className="w-full p-4 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:border-[var(--color-gold)] transition-colors text-sm resize-none"
              />
            </div>

            <button 
              type="submit"
              className="py-4 px-8 font-heading font-black text-xs uppercase tracking-widest text-black bg-[var(--color-gold)] rounded-xl hover:bg-[var(--color-gold-light)] transition-colors box-glow-gold self-center mt-4"
            >
              {language === "es" ? "Enviar Mensaje" : "Send Message"}
            </button>
          </form>
        </motion.div>
      </div>
    </section>
  );
}
