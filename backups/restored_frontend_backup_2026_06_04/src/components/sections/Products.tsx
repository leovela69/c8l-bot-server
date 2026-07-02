"use client";
import React from "react";
import { useApp } from "../../context/AppContext";
import { motion } from "framer-motion";

export default function Products() {
  const { t, language, showNotification } = useApp();

  const productsList = [
    {
      category: t("prod-cat-branding"),
      title: t("product-1-title"),
      desc: language === "es" 
        ? "Manual oficial de identidad corporativa de C8L Agency. Incluye logotipos vectoriales de alta resolución y recursos de marca."
        : "Official corporate identity manual of C8L Agency. Includes high-resolution vector logos and brand assets.",
      img: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=500",
      price: "€29.99",
      delay: 0.1
    },
    {
      category: t("prod-cat-web"),
      title: t("product-2-title"),
      desc: language === "es"
        ? "Plantilla web profesional responsive C8L. Diseño elegante con glassmorphism, optimizado para SEO y alta conversión."
        : "Professional responsive C8L web template. Elegant design with glassmorphism, optimized for SEO and high conversion.",
      img: "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?q=80&w=500",
      price: "€99.99",
      delay: 0.2
    },
    {
      category: t("prod-cat-app"),
      title: t("product-3-title"),
      desc: language === "es"
        ? "Interfaz de usuario (UI/UX) completa para iOS y Android. Incluye prototipo navegable y componentes Figma."
        : "Complete UI/UX design for iOS and Android. Includes navigable prototype and Figma assets.",
      img: "https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?q=80&w=500",
      price: "€149.99",
      delay: 0.3
    },
    {
      category: t("prod-cat-art"),
      title: t("product-4-title"),
      desc: language === "es"
        ? "Diseño promocional artístico para campañas de música, conciertos y eventos, adaptable a redes sociales."
        : "Promotional creative artwork for music campaigns, concerts and events, highly adaptable for social channels.",
      img: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=500",
      price: "€39.99",
      delay: 0.4
    }
  ];

  const handleBuyClick = () => {
    showNotification(
      language === "es" ? "¡Producto añadido al carrito!" : "Product added to cart!",
      "success"
    );
  };

  return (
    <section id="products" className="py-24 text-white relative bg-black/40">
      <div className="container mx-auto px-6 max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="font-heading font-black text-4xl md:text-5xl uppercase mb-4">
            {t("products-title")}
          </h2>
          <p className="text-zinc-400 font-light max-w-xl mx-auto">
            {language === "es" 
              ? "Adquiere nuestras plantillas y recursos de diseño con el ecosistema visual de C8L"
              : "Acquire our templates and design resources styling the visual ecosystem of C8L"}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {productsList.map((product, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: product.delay }}
              className="glass-panel p-6 rounded-2xl flex flex-col justify-between group hover:border-[var(--color-gold)]/40 transition-all duration-300"
            >
              <div>
                {/* Product Image Cover */}
                <div className="h-48 rounded-xl overflow-hidden bg-zinc-900 relative group-hover:scale-[1.02] transition-transform duration-300">
                  <img 
                    src={product.img} 
                    alt={product.title} 
                    className="w-full h-full object-cover filter contrast-[1.02] brightness-90 group-hover:scale-105 transition-transform duration-700"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = "https://images.unsplash.com/photo-1541701494587-cb58502866ab?q=80&w=500";
                    }}
                  />
                  <span className="absolute top-3 left-3 bg-[var(--color-gold)] text-black text-[9px] font-mono font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                    {product.category}
                  </span>
                  
                  {/* Pin Logo */}
                  <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black border border-[var(--color-gold)] flex items-center justify-center p-0.5 animate-spin-slow">
                    <img src="/assets/c8l_logo_blue_chrome.png" className="w-full h-full object-contain" alt="C8L Pin Logo" />
                  </div>
                </div>

                <h3 className="font-heading font-black text-lg mt-6 mb-2 text-white group-hover:text-[var(--color-gold)] transition-colors">
                  {product.title}
                </h3>
                <p className="text-zinc-400 text-xs leading-relaxed mb-6">
                  {product.desc}
                </p>
              </div>

              <div className="flex justify-between items-center mt-auto pt-4 border-t border-white/5">
                <span className="font-mono font-bold text-lg text-[var(--color-gold)]">
                  {product.price}
                </span>
                <button 
                  onClick={handleBuyClick}
                  className="px-4 py-2 font-heading font-bold text-xs uppercase text-black bg-[var(--color-gold)] rounded-md hover:bg-[var(--color-gold-light)] transition-colors box-glow-gold"
                >
                  {language === "es" ? "Comprar" : "Buy"}
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
