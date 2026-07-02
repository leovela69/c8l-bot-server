"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "../../context/AppContext";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { C8LTVLogo } from "../ui/C8LTVLogo";
import { LoginModal } from "../security/LoginModal";

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const { language, setLanguage, t, credits, user, logout, deviceFormat } = useApp();
  const pathname = usePathname();

  // Reset mobile menu on page transition
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (pathname === "/streamer/profile-services") {
    return null;
  }

  const isStudioPage = pathname === "/studio";

  if (isStudioPage) {
    return (
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? "glass-header py-3" : "bg-transparent py-5"
        }`}
      >
        <div className="container mx-auto px-6 grid grid-cols-3 items-center">
          {/* Left Column: Return to Agency Home */}
          <div className="flex items-center justify-start gap-4">
            <Link 
              href="/" 
              className="text-xs font-heading font-black uppercase tracking-widest text-zinc-400 hover:text-[var(--color-neon-blue)] transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span>←</span>
              <span className="hidden xs:inline">Volver</span>
            </Link>

            <button
              onClick={() => {
                localStorage.removeItem('age_verified');
                sessionStorage.removeItem('age_verified');
                window.location.reload();
              }}
              className="text-[9px] font-mono text-red-500 hover:text-white transition-colors cursor-pointer border border-red-500/20 px-2 py-0.5 rounded-full bg-red-500/5 hover:bg-red-500/20"
              title="Restablecer verificación de edad para pruebas"
            >
              Reset Edad
            </button>
          </div>

          {/* Center Column: Logo with Wings & Text centered */}
          <div className="flex items-center justify-center gap-3">
            <Link href="/studio" className="flex items-center gap-3.5 cursor-pointer">
              <div className="w-11 h-11 relative flex items-center justify-center rounded-full overflow-hidden bg-black/40 border border-[var(--color-gold)]/30 box-glow-gold">
                <img 
                  src="/assets/c8l_logo_gold_2d.png" 
                  alt="C8L Gold Wings Logo" 
                  className="w-full h-full object-contain p-1 z-10 filter drop-shadow-[0_0_8px_rgba(212,175,55,0.5)]" 
                />
              </div>
              <span className="font-heading font-black text-sm tracking-wider text-glow-gold uppercase sm:block hidden text-[var(--color-gold)]">
                C8L Corazones Locos Agency
              </span>
            </Link>
          </div>

          {/* Right Column: Actions (Credits, Language, Auth) */}
          <div className="flex items-center justify-end gap-3.5">
            {/* Credits Badge */}
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/60 border border-[var(--color-gold)]/30 text-xs font-mono text-[var(--color-gold)] box-glow-gold">
              <span>🪙</span>
              <span className="font-bold">{credits}</span>
            </div>

            {/* Language Switcher */}
            <div 
              className="flex items-center glass-panel rounded-full p-0.5 cursor-pointer" 
              onClick={() => setLanguage(language === "en" ? "es" : "en")}
            >
              <div className={`px-2 py-0.5 text-[8px] font-bold rounded-full transition-all ${language === "en" ? "bg-[var(--color-gold)] text-black" : "text-zinc-400"}`}>EN</div>
              <div className={`px-2 py-0.5 text-[8px] font-bold rounded-full transition-all ${language === "es" ? "bg-[var(--color-gold)] text-black" : "text-zinc-400"}`}>ES</div>
            </div>

            {/* Auth Button */}
            {user ? (
              <button 
                onClick={logout}
                className="text-[9px] uppercase tracking-wider font-bold text-zinc-400 hover:text-white transition-colors cursor-pointer border border-white/10 px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/10"
              >
                Salir
              </button>
            ) : (
              <button
                onClick={() => setShowLoginModal(true)}
                className="text-[9px] uppercase tracking-wider font-bold text-[var(--color-neon-blue)] hover:text-white transition-colors cursor-pointer border border-[var(--color-neon-blue)]/20 px-2.5 py-1 rounded-full bg-[var(--color-neon-blue)]/5 hover:bg-[var(--color-neon-blue)]/25 box-glow-neon"
              >
                Login
              </button>
            )}
          </div>
        </div>
      </header>
    );
  }

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-black/95 backdrop-blur-md border-b border-white/10 py-3" : "bg-black border-b border-white/5 py-5"
      }`}
    >
      <div className="container mx-auto px-6 flex items-center justify-between">
        {/* Logo Section */}
        <Link href="/" className="flex items-center gap-3 cursor-pointer">
          <div className="w-11 h-11 relative flex items-center justify-center rounded-full overflow-hidden bg-black/40 border border-[var(--color-gold)]/30 box-glow-gold">
            <img 
              src="/assets/c8l_logo_gold_2d.png" 
              alt="C8L Gold Wings Logo" 
              className="w-full h-full object-contain p-1 z-10 filter drop-shadow-[0_0_8px_rgba(212,175,55,0.5)]" 
            />
          </div>
          <span className="font-heading font-bold text-xl tracking-wider text-glow-gold hidden sm:block">
            C8L Corazones Locos Agency
          </span>
        </Link>

        {/* Navigation & Actions */}
        <div className="flex items-center gap-6">
          <nav className={`${
            deviceFormat === "phone" || deviceFormat === "tablet" 
              ? "hidden" 
              : "hidden lg:flex"
          } items-center gap-6 text-[9px] uppercase tracking-wider text-zinc-300`}>
            <Link href="/feed" className="flex flex-col items-center gap-0.5 hover:text-[var(--color-neon-blue)] transition-colors font-bold text-glow-neon text-center select-none">
              <C8LTVLogo size={20} className="mb-0.5" />
              <span className="leading-tight font-black">C8L<br />TV</span>
            </Link>
            <Link href="/lounge" className="flex flex-col items-center gap-0.5 hover:text-[var(--color-gold)] transition-colors font-bold text-glow-gold text-center select-none">
              <span className="text-sm leading-none">🎤</span>
              <span className="leading-tight font-black">Salas</span>
            </Link>
            <Link href="/live" className="flex flex-col items-center gap-0.5 hover:text-[var(--color-neon-blue)] transition-colors font-semibold text-center select-none">
              <span className="text-sm leading-none">🛰️</span>
              <span className="leading-tight font-semibold">Streaming</span>
            </Link>
            <Link href="/streamer" className="flex flex-col items-center gap-0.5 hover:text-[var(--color-gold)] transition-colors font-semibold text-center select-none">
              <span className="text-sm leading-none">💼</span>
              <span className="leading-tight font-semibold">Monetización</span>
            </Link>
            <Link href="/community" className="flex flex-col items-center gap-0.5 hover:text-white transition-colors text-center select-none">
              <span className="text-sm leading-none">👥</span>
              <span className="leading-tight">{t("nav-community")}</span>
            </Link>
            <Link href="/streamer/profile-services" className="flex flex-col items-center gap-0.5 hover:text-[var(--color-gold)] transition-colors text-center select-none">
              <span className="text-sm leading-none">👤</span>
              <span className="leading-tight">{t("nav-profile")}</span>
            </Link>
            <Link href="/studio" className="flex flex-col items-center gap-0.5 hover:text-[var(--color-neon-blue)] transition-colors text-center select-none">
              <span className="text-sm leading-none">🎹</span>
              <span className="leading-tight">
                {language === "es" ? (
                  <>Estudio<br />IA</>
                ) : (
                  <>AI<br />Studio</>
                )}
              </span>
            </Link>
          </nav>

          {/* Credits Badge */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 border border-[var(--color-gold)]/30 text-xs font-mono text-[var(--color-gold)] box-glow-gold">
            <span>🪙</span>
            <span className="font-bold">{credits}</span>
          </div>

          {/* Reset Edad button (Desarrollo) */}
          <button
            onClick={() => {
              localStorage.removeItem('age_verified');
              sessionStorage.removeItem('age_verified');
              window.location.reload();
            }}
            className="text-[9px] font-mono text-red-500 hover:text-white transition-colors cursor-pointer border border-red-500/25 px-2.5 py-1 rounded-full bg-red-500/5 hover:bg-red-500/20"
            title="Restablecer verificación de edad para pruebas"
          >
            Reset Edad
          </button>

          {/* Language Switcher */}
          <div 
            className="flex items-center glass-panel rounded-full p-1 cursor-pointer" 
            onClick={() => setLanguage(language === "en" ? "es" : "en")}
          >
            <motion.div 
              layout 
              className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full transition-colors ${
                language === "en" ? "bg-[var(--color-gold)] text-black" : "text-zinc-400"
              }`}
            >
              EN
            </motion.div>
            <motion.div 
              layout 
              className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full transition-colors ${
                language === "es" ? "bg-[var(--color-gold)] text-black" : "text-zinc-400"
              }`}
            >
              ES
            </motion.div>
          </div>

          {/* Auth Button */}
          {user ? (
            <button 
              onClick={logout}
              className="text-xs uppercase tracking-wider font-semibold text-zinc-400 hover:text-white transition-colors cursor-pointer border border-white/10 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10"
            >
              {t("nav-logout")}
            </button>
          ) : (
            <button
              onClick={() => setShowLoginModal(true)}
              className="text-xs uppercase tracking-wider font-semibold text-[var(--color-neon-blue)] hover:text-white transition-colors cursor-pointer border border-[var(--color-neon-blue)]/20 px-3 py-1.5 rounded-full bg-[var(--color-neon-blue)]/5 hover:bg-[var(--color-neon-blue)]/25 box-glow-neon"
            >
              {t("nav-login")}
            </button>
          )}

          {/* Mobile hamburger menu button */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className={`${
              deviceFormat === "phone" || deviceFormat === "tablet" 
                ? "flex" 
                : "lg:hidden"
            } p-2 text-zinc-400 hover:text-white transition-colors cursor-pointer flex items-center justify-center rounded-lg border border-white/10 bg-white/5 hover:bg-white/10`}
            aria-label="Menu"
          >
            {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className={`${
              deviceFormat === "phone" || deviceFormat === "tablet" 
                ? "" 
                : "lg:hidden"
            } w-full border-t border-white/5 bg-black/95 backdrop-blur-md overflow-hidden`}
          >
            <nav className="flex flex-col px-6 py-4 gap-4 text-xs font-bold uppercase tracking-widest text-zinc-300">
              <Link 
                href="/feed" 
                onClick={() => setMobileMenuOpen(false)}
                className="hover:text-[var(--color-neon-blue)] transition-colors py-2.5 border-b border-white/5 font-black text-glow-neon text-white flex items-center gap-2"
              >
                <C8LTVLogo size={18} />
                <span>C8L TV</span>
              </Link>
              <Link 
                href="/lounge" 
                onClick={() => setMobileMenuOpen(false)}
                className="hover:text-[var(--color-gold)] transition-colors py-2.5 border-b border-white/5 font-black text-glow-gold text-white"
              >
                🎤 {language === "es" ? "Salas" : "Salas (Lounge)"}
              </Link>
              <Link 
                href="/live" 
                onClick={() => setMobileMenuOpen(false)}
                className="hover:text-[var(--color-neon-blue)] transition-colors py-2.5 border-b border-white/5"
              >
                🛰️ Streaming
              </Link>
              <Link 
                href="/streamer" 
                onClick={() => setMobileMenuOpen(false)}
                className="hover:text-[var(--color-gold)] transition-colors py-2.5 border-b border-white/5"
              >
                💼 Monetización
              </Link>
              <Link 
                href="/community" 
                onClick={() => setMobileMenuOpen(false)}
                className="hover:text-white transition-colors py-2.5 border-b border-white/5"
              >
                👥 {t("nav-community")}
              </Link>
              <Link 
                href="/streamer/profile-services" 
                onClick={() => setMobileMenuOpen(false)}
                className="hover:text-[var(--color-gold)] transition-colors py-2.5 border-b border-white/5 font-semibold"
              >
                👤 {t("nav-profile")}
              </Link>
              <Link 
                href="/studio" 
                onClick={() => setMobileMenuOpen(false)}
                className="hover:text-[var(--color-neon-blue)] transition-colors py-2.5"
              >
                🎹 {t("nav-studio")}
              </Link>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Login Modal */}
      {showLoginModal && (
        <LoginModal onClose={() => setShowLoginModal(false)} />
      )}
    </header>
  );
}
