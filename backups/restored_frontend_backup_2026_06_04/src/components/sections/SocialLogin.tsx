"use client";
import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import { auth } from "../../firebase";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword 
} from "firebase/auth";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

export default function SocialLogin() {
  const { t, language, user, loginWithGoogle, loginWithMockUser, logout, showNotification } = useApp();
  const [tab, setTab] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      showNotification(
        language === "es" ? "Por favor ingresa todos los campos." : "Please enter all fields.",
        "error"
      );
      return;
    }

    if (password.length < 6) {
      showNotification(
        language === "es" ? "La contraseña debe tener al menos 6 caracteres." : "Password must be at least 6 characters.",
        "error"
      );
      return;
    }

    setLoading(true);
    try {
      if (tab === "login") {
        await signInWithEmailAndPassword(auth, email, password);
        showNotification(
          language === "es" ? "Sesión iniciada con éxito." : "Logged in successfully.",
          "success"
        );
      } else {
        if (typeof window !== "undefined") {
          sessionStorage.setItem("c8l_is_signup", "true");
        }
        await createUserWithEmailAndPassword(auth, email, password);
        showNotification(
          language === "es" ? "Registro exitoso. ¡Bienvenido!" : "Registration successful. Welcome!",
          "success"
        );
      }
      setEmail("");
      setPassword("");
    } catch (error: any) {
      console.error(error);
      if (error.code === "auth/user-not-found" || error.code === "auth/wrong-password" || error.code === "auth/invalid-credential") {
        showNotification(
          language === "es" ? "Credenciales incorrectas o usuario no encontrado." : "Incorrect credentials or user not found.",
          "error"
        );
      } else if (error.code === "auth/email-already-in-use") {
        showNotification(
          language === "es" ? "Este correo ya está registrado." : "This email is already in use.",
          "error"
        );
      } else {
        showNotification(error.message, "error");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="social-login" className="py-24 text-white relative bg-[#020202]">
      <div className="container mx-auto px-6 max-w-xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="font-heading font-black text-3xl md:text-4xl uppercase mb-4">
            {t("social-login-title")}
          </h2>
          <p className="text-zinc-500 font-light text-sm max-w-sm mx-auto">
            {t("social-login-desc")}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="glass-panel p-8 rounded-3xl box-glow-gold bg-black/40 border-[var(--color-gold)]/20"
        >
          <AnimatePresence mode="wait">
            {user ? (
              <motion.div 
                key="logged-in"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="text-center"
              >
                <div className="w-16 h-16 rounded-full overflow-hidden border border-[var(--color-gold)]/30 mx-auto mb-6 bg-black flex items-center justify-center p-1.5 box-glow-gold animate-pulse">
                  <img src="/assets/c8l_logo_blue_chrome.png" className="w-full h-full object-contain" alt="C8L" />
                </div>
                <h3 className="font-heading font-black text-xl text-[var(--color-gold)] mb-2 uppercase">
                  {language === "es" ? "¡Sesión Activa!" : "Active Session!"}
                </h3>
                <p className="text-zinc-300 font-mono text-sm mb-8 break-all">{user.email}</p>
                
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Link 
                    href="/community" 
                    className="px-6 py-3 font-heading font-bold text-xs uppercase text-black bg-[var(--color-gold)] rounded-xl hover:bg-[var(--color-gold-light)] transition-colors box-glow-gold text-center"
                  >
                    {language === "es" ? "Estudio VIP" : "VIP Community"}
                  </Link>
                  <Link 
                    href="/streamer/profile-services" 
                    className="px-6 py-3 font-heading font-bold text-xs uppercase text-white bg-zinc-900 border border-zinc-700/50 rounded-xl hover:bg-zinc-800 transition-colors text-center"
                  >
                    {language === "es" ? "C8L Perfil" : "C8L Profile"}
                  </Link>
                  <button 
                    onClick={logout}
                    className="px-6 py-3 font-heading font-bold text-xs uppercase text-white bg-red-950/40 border border-red-500/25 rounded-xl hover:bg-red-950/70 transition-colors cursor-pointer"
                  >
                    {language === "es" ? "Cerrar Sesión" : "Logout"}
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="logged-out"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="w-14 h-14 rounded-full overflow-hidden border border-white/10 mx-auto mb-6 bg-black flex items-center justify-center p-1.5 box-glow-gold">
                  <img src="/assets/c8l_logo_blue_chrome.png" className="w-full h-full object-contain" alt="C8L" />
                </div>

                {/* Google SSO Button */}
                <button 
                  type="button"
                  onClick={loginWithGoogle}
                  className="w-full flex items-center justify-center gap-3 px-6 py-3.5 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-sans text-xs font-semibold rounded-xl transition-all cursor-pointer mb-3"
                >
                  <img src="https://www.google.com/favicon.ico" alt="G" className="w-4 h-4" />
                  {language === "es" ? "Iniciar Sesión con Google" : "Sign in with Google"}
                </button>

                {/* Quick VIP Login Button */}
                <button 
                  type="button"
                  onClick={loginWithMockUser}
                  className="w-full flex items-center justify-center gap-3 px-6 py-3.5 bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 text-[var(--color-gold)] font-sans text-xs font-bold rounded-xl transition-all cursor-pointer mb-6 box-glow-gold"
                >
                  <span>✨</span>
                  {language === "es" ? "Acceso Rápido VIP (Sin Cuenta)" : "Quick VIP Access (No Account)"}
                </button>

                <div className="flex items-center gap-4 mb-6 text-zinc-600 text-[10px] font-bold tracking-widest text-center">
                  <div className="flex-grow h-px bg-white/5"></div>
                  <span>{language === "es" ? "O USA TU CORREO" : "OR USE YOUR EMAIL"}</span>
                  <div className="flex-grow h-px bg-white/5"></div>
                </div>

                {/* Tabs */}
                <div className="flex justify-center gap-6 mb-6 border-b border-white/5 pb-2">
                  <button 
                    onClick={() => setTab("login")}
                    className={`font-heading font-bold text-xs uppercase tracking-wider pb-2 border-b-2 transition-all cursor-pointer ${
                      tab === "login" ? "text-[var(--color-gold)] border-[var(--color-gold)]" : "text-zinc-500 border-transparent hover:text-zinc-300"
                    }`}
                  >
                    {language === "es" ? "Ingresar" : "Login"}
                  </button>
                  <button 
                    onClick={() => setTab("register")}
                    className={`font-heading font-bold text-xs uppercase tracking-wider pb-2 border-b-2 transition-all cursor-pointer ${
                      tab === "register" ? "text-[var(--color-gold)] border-[var(--color-gold)]" : "text-zinc-500 border-transparent hover:text-zinc-300"
                    }`}
                  >
                    {language === "es" ? "Registrarse" : "Sign Up"}
                  </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-left">
                  <div>
                    <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">
                      {language === "es" ? "Correo Electrónico" : "Email Address"}
                    </label>
                    <input 
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="nombre@correo.com"
                      className="w-full p-3.5 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:border-[var(--color-gold)] transition-colors text-sm font-sans"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">
                      {language === "es" ? "Contraseña" : "Password"}
                    </label>
                    <input 
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={language === "es" ? "Tu contraseña (mín. 6 caracteres)" : "Your password (min. 6 chars)"}
                      className="w-full p-3.5 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:border-[var(--color-gold)] transition-colors text-sm font-sans"
                    />
                  </div>

                  <button 
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 mt-2 font-heading font-bold text-xs uppercase tracking-widest text-black bg-[var(--color-gold)] rounded-xl hover:bg-[var(--color-gold-light)] transition-colors box-glow-gold disabled:opacity-50"
                  >
                    {loading ? "..." : (tab === "login" ? (language === "es" ? "Ingresar" : "Login") : (language === "es" ? "Registrarse" : "Sign Up"))}
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
}
