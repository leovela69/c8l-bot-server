"use client";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useApp } from "../../context/AppContext";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
}

import { useState } from "react";
import { auth } from "../../firebase";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { registerOrUpdateUser, logActivity } from "../../utils/analytics";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SignupModal({ isOpen, onClose }: ModalProps) {
  const { t, language, showNotification } = useApp();
  const [alias, setAlias] = useState("");
  const [email, setEmail] = useState("");
  const [platform, setPlatform] = useState("Twitch");
  const [vipCode, setVipCode] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAutoSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!alias || !email) {
      showNotification(
        language === "es" ? "Por favor completa el alias y correo electrónico." : "Please fill in alias and email address.",
        "error"
      );
      return;
    }

    setLoading(true);
    // Standard dummy password format derived from email to allow passwordless-like signup/login
    const password = "C8LPass@" + email.split("@")[0] + "2026!";

    try {
      let userCredential;
      let isNewUser = true;

      try {
        // Attempt to create the user account
        userCredential = await createUserWithEmailAndPassword(auth, email, password);
      } catch (err: any) {
        // If email already in use, automatically log them in
        if (err.code === "auth/email-already-in-use") {
          userCredential = await signInWithEmailAndPassword(auth, email, password);
          isNewUser = false;
        } else {
          throw err;
        }
      }

      const user = userCredential.user;
      
      // Check VIP invitation code
      const isVIP = vipCode.trim() === "C8L-STREAMER-VIP";
      const subscription = isVIP ? "agency" : "free";

      if (isVIP) {
        localStorage.setItem("c8l_subscription", "agency");
        localStorage.setItem("c8l_credits", "9999");
      }

      // Save user profile in Firestore (with LocalStorage fallback)
      await registerOrUpdateUser(user.uid, email, alias, platform, subscription);

      // Flag session as tracked to prevent double logging in auth listener
      if (typeof window !== "undefined") {
        sessionStorage.setItem("c8l_session_tracked", "true");
      }

      // Log activity
      await logActivity(
        user.uid, 
        email, 
        alias, 
        isNewUser ? "signup" : "login", 
        isVIP ? "Registro automático VIP (Modo Agencia Activado)" : "Registro automático estándar"
      );

      showNotification(
        isVIP 
          ? (language === "es" ? "¡Código VIP Aceptado! Modo Agencia activado con 9,999 créditos gratis." : "VIP Code Accepted! Agency Mode activated with 9,999 free credits.")
          : (language === "es" ? "¡Registro automático completado con éxito!" : "Automatic registration completed successfully!"),
        "success"
      );

      // Reset fields
      setAlias("");
      setEmail("");
      setVipCode("");
      onClose();
    } catch (err: any) {
      console.error(err);
      showNotification(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
        >
          <motion.div 
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="relative w-full max-w-md glass-panel p-8 rounded-3xl border border-[var(--color-gold)]/30 box-glow-gold"
          >
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white transition cursor-pointer"
            >
              <X size={24} />
            </button>

            <h2 className="text-3xl font-heading font-bold text-white mb-2">{t("modal-welcome")}</h2>
            <p className="text-sm text-zinc-400 mb-6 border-b border-white/10 pb-4">
              {t("modal-subtitle")}
            </p>

            <form className="space-y-4" onSubmit={handleAutoSignup}>
              <div>
                <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-1">{t("modal-alias")}</label>
                <input 
                  type="text" 
                  value={alias}
                  onChange={(e) => setAlias(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[var(--color-gold)] transition" 
                  placeholder={t("modal-alias-placeholder")} 
                  required
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-1">{t("modal-email")}</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[var(--color-gold)] transition" 
                  placeholder={t("modal-email-placeholder")} 
                  required
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-1">{t("modal-platform")}</label>
                <select 
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[var(--color-gold)] transition appearance-none"
                >
                  <option className="bg-black text-white">Twitch</option>
                  <option className="bg-black text-white">YouTube</option>
                  <option className="bg-black text-white">Kick</option>
                  <option className="bg-black text-white">{t("modal-platform-other")}</option>
                </select>
              </div>

              {/* VIP invite code entry */}
              <div>
                <label className="block text-xs uppercase tracking-widest text-[var(--color-gold)] mb-1">
                  {language === "es" ? "Código VIP (Opcional)" : "VIP Code (Optional)"}
                </label>
                <input 
                  type="text" 
                  value={vipCode}
                  onChange={(e) => setVipCode(e.target.value)}
                  className="w-full bg-white/5 border border-[var(--color-gold)]/30 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[var(--color-gold)] transition text-xs font-mono tracking-wider" 
                  placeholder="e.g. C8L-STREAMER-VIP" 
                />
              </div>

              <div className="pt-4">
                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full bg-[var(--color-gold)] text-black font-bold font-heading py-3 rounded-lg hover:bg-[var(--color-gold-light)] transition shadow-[0_0_15px_rgba(212,175,55,0.3)] disabled:opacity-50"
                >
                  {loading ? "..." : t("modal-submit")}
                </button>
              </div>
              <p className="text-[10px] text-zinc-600 text-center mt-4">
                {t("modal-footer")}
              </p>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
