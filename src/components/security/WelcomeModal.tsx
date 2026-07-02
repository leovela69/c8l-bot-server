'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { LogIn, Zap, Users, Star } from 'lucide-react';
import { useApp } from '@/context/AppContext';

interface WelcomeModalProps {
  onClose: () => void;
}

export function WelcomeModal({ onClose }: WelcomeModalProps) {
  const { loginWithGoogle, loginWithMockUser, language } = useApp();

  const handleGoogle = async () => {
    onClose();
    await loginWithGoogle();
  };

  const handleVIP = () => {
    loginWithMockUser();
    onClose();
  };

  const handleGuest = () => {
    onClose();
  };

  const features = [
    { icon: Star, text: '500 C8L Coins de bienvenida', color: '#D4AF37' },
    { icon: Zap, text: 'Casino Quantum + 3 Slots exclusivos', color: '#00F3FF' },
    { icon: Users, text: 'Sala Virtual + Battles PK en vivo', color: '#FF0055' },
  ];

  return (
    <AnimatePresence>
      <motion.div
        key="welcome-modal-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.35 }}
        className="fixed inset-0 z-[8900] flex items-center justify-center p-4"
        style={{ background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(8px)' }}
        onClick={handleGuest}
      >
        <motion.div
          key="welcome-modal-card"
          initial={{ scale: 0.90, opacity: 0, y: 40 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.90, opacity: 0, y: 40 }}
          transition={{ type: 'spring', stiffness: 250, damping: 24 }}
          className="relative w-full max-w-md z-10"
          onClick={e => e.stopPropagation()}
          style={{
            background: 'linear-gradient(155deg, #0d0d0e 50%, #050c10 100%)',
            border: '1px solid rgba(0,243,255,0.2)',
            borderRadius: '20px',
            boxShadow: '0 0 80px rgba(0,243,255,0.1), 0 0 40px rgba(0,0,0,0.8), inset 0 1px 0 rgba(0,243,255,0.08)',
            overflow: 'hidden'
          }}
        >
          {/* Top stripe */}
          <div style={{
            height: '3px',
            background: 'linear-gradient(90deg, transparent, #00F3FF, #D4AF37, #00F3FF, transparent)'
          }} />

          {/* Corner decorations */}
          <div className="absolute top-4 left-4 w-4 h-4 border-t border-l border-[#00F3FF]/30" />
          <div className="absolute top-4 right-4 w-4 h-4 border-t border-r border-[#00F3FF]/30" />

          <div className="p-7 pt-8">
            {/* Header */}
            <div className="text-center mb-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.15, type: 'spring', stiffness: 300 }}
                className="inline-flex items-center justify-center w-14 h-14 rounded-full mb-4"
                style={{
                  background: 'radial-gradient(circle, rgba(0,243,255,0.12) 0%, transparent 100%)',
                  border: '2px solid rgba(0,243,255,0.3)'
                }}
              >
                <span className="text-2xl">🎰</span>
              </motion.div>

              <span className="block text-[10px] font-mono uppercase tracking-[0.3em] text-[#00F3FF] mb-1"
                style={{ textShadow: '0 0 8px rgba(0,243,255,0.5)' }}>
                ✓ Verificación completada
              </span>

              <h2 className="text-xl font-black uppercase text-white tracking-wide"
                style={{ fontFamily: 'var(--font-heading)' }}>
                Bienvenido a{' '}
                <span style={{ color: '#D4AF37', textShadow: '0 0 15px rgba(212,175,55,0.4)' }}>
                  C8L Agency
                </span>
              </h2>
              <p className="text-zinc-500 text-xs mt-1.5">
                Elige cómo quieres acceder a la plataforma
              </p>
            </div>

            {/* Feature list */}
            <div className="mb-6 space-y-2">
              {features.map(({ icon: Icon, text, color }, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + i * 0.08 }}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg"
                  style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
                >
                  <Icon size={13} color={color} />
                  <span className="text-xs text-zinc-300">{text}</span>
                </motion.div>
              ))}
            </div>

            {/* Divider */}
            <div className="h-px bg-gradient-to-r from-transparent via-white/8 to-transparent mb-5" />

            {/* Auth buttons */}
            <div className="space-y-3">
              {/* Google Login */}
              <motion.button
                id="welcome-google-login-btn"
                onClick={handleGoogle}
                whileHover={{ scale: 1.02, boxShadow: '0 0 20px rgba(0,243,255,0.25)' }}
                whileTap={{ scale: 0.97 }}
                className="w-full py-3 px-4 flex items-center justify-center gap-2.5 font-bold text-sm cursor-pointer rounded-xl transition-all"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1.5px solid rgba(0,243,255,0.3)',
                  color: 'white',
                  fontFamily: 'var(--font-heading)',
                  letterSpacing: '0.05em'
                }}
              >
                {/* Google icon */}
                <svg width="16" height="16" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Entrar con Google
              </motion.button>

              {/* VIP Quick Access */}
              <motion.button
                id="welcome-vip-access-btn"
                onClick={handleVIP}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                className="w-full py-3 px-4 flex items-center justify-center gap-2.5 font-black text-sm cursor-pointer rounded-xl uppercase"
                style={{
                  fontFamily: 'var(--font-heading)',
                  background: 'linear-gradient(90deg, #D4AF37, #F0CF65)',
                  color: '#000',
                  border: 'none',
                  letterSpacing: '0.1em',
                  boxShadow: '0 4px 15px rgba(212,175,55,0.3)'
                }}
              >
                <Zap size={15} />
                Acceso VIP Rápido
              </motion.button>

              {/* Guest */}
              <button
                id="welcome-guest-btn"
                onClick={handleGuest}
                className="w-full py-2 text-xs text-zinc-600 hover:text-zinc-400 transition-colors cursor-pointer font-mono"
              >
                Continuar sin cuenta →
              </button>
            </div>

            {/* Legal */}
            <p className="text-[10px] text-zinc-700 text-center mt-4 font-mono leading-relaxed">
              Al acceder aceptas los{' '}
              <a href="/terms" className="text-zinc-600 underline hover:text-zinc-400 transition-colors">
                Términos de C8L Agency
              </a>
              . +18 · Juega responsablemente.
            </p>
          </div>

          {/* Bottom stripe */}
          <div style={{
            height: '2px',
            background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.3), transparent)'
          }} />
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
