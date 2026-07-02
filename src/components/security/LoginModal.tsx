'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Zap, LogIn, Shield } from 'lucide-react';
import { useApp } from '@/context/AppContext';

interface LoginModalProps {
  onClose: () => void;
}

export function LoginModal({ onClose }: LoginModalProps) {
  const { loginWithGoogle, loginWithMockUser } = useApp();
  const [loadingGoogle, setLoadingGoogle] = useState(false);

  const handleGoogle = async () => {
    setLoadingGoogle(true);
    onClose();
    await loginWithGoogle();
    setLoadingGoogle(false);
  };

  const handleVIP = () => {
    loginWithMockUser();
    onClose();
  };

  return (
    <AnimatePresence>
      <motion.div
        key="login-modal-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        className="fixed inset-0 z-[8800] flex items-center justify-center p-4"
        style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)' }}
        onClick={onClose}
      >
        <motion.div
          key="login-modal-card"
          initial={{ scale: 0.92, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.92, opacity: 0, y: 20 }}
          transition={{ type: 'spring', stiffness: 280, damping: 26 }}
          className="relative w-full max-w-sm z-10"
          onClick={e => e.stopPropagation()}
          style={{
            background: 'linear-gradient(160deg, #0d0d0e 55%, #050c10 100%)',
            border: '1.5px solid rgba(0,243,255,0.2)',
            borderRadius: '18px',
            boxShadow: '0 0 60px rgba(0,243,255,0.08), 0 30px 60px rgba(0,0,0,0.8)',
            overflow: 'hidden'
          }}
        >
          {/* Top accent */}
          <div style={{
            height: '2px',
            background: 'linear-gradient(90deg, transparent, #00F3FF, #D4AF37, transparent)'
          }} />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-3.5 right-3.5 w-7 h-7 flex items-center justify-center rounded-full text-zinc-500 hover:text-white hover:bg-white/10 transition-all cursor-pointer z-10"
          >
            <X size={14} />
          </button>

          <div className="p-6 pt-7">
            {/* Header */}
            <div className="text-center mb-6">
              <div
                className="inline-flex items-center justify-center w-12 h-12 rounded-full mb-3"
                style={{
                  background: 'radial-gradient(circle, rgba(212,175,55,0.12) 0%, transparent 100%)',
                  border: '1.5px solid rgba(212,175,55,0.3)'
                }}
              >
                <Shield size={22} color="#D4AF37" strokeWidth={1.5} />
              </div>

              <h2
                className="text-lg font-black uppercase tracking-wider text-white"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                Acceder a{' '}
                <span style={{ color: '#D4AF37' }}>C8L Agency</span>
              </h2>
              <p className="text-zinc-500 text-xs mt-1">
                Elige tu método de acceso
              </p>
            </div>

            {/* Divider */}
            <div className="h-px bg-gradient-to-r from-transparent via-white/8 to-transparent mb-5" />

            {/* Buttons */}
            <div className="space-y-3">
              {/* Google */}
              <motion.button
                id="login-modal-google-btn"
                onClick={handleGoogle}
                disabled={loadingGoogle}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                className="w-full py-3 px-4 flex items-center justify-center gap-3 font-bold text-sm cursor-pointer rounded-xl transition-all"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1.5px solid rgba(0,243,255,0.25)',
                  color: 'white',
                  fontFamily: 'var(--font-heading)'
                }}
              >
                {loadingGoogle ? (
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4" />
                    <path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                )}
                Entrar con Google
              </motion.button>

              {/* VIP Quick Access */}
              <motion.button
                id="login-modal-vip-btn"
                onClick={handleVIP}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                className="w-full py-3 px-4 flex items-center justify-center gap-2.5 font-black text-sm cursor-pointer rounded-xl uppercase"
                style={{
                  fontFamily: 'var(--font-heading)',
                  background: 'linear-gradient(90deg, #D4AF37, #F0CF65)',
                  color: '#000',
                  letterSpacing: '0.08em',
                  boxShadow: '0 4px 15px rgba(212,175,55,0.25)'
                }}
              >
                <Zap size={15} />
                Acceso VIP Rápido
              </motion.button>

              {/* Cancel */}
              <button
                onClick={onClose}
                className="w-full py-2 text-xs text-zinc-600 hover:text-zinc-400 transition-colors cursor-pointer font-mono"
              >
                Cancelar
              </button>
            </div>

            {/* Legal */}
            <p className="text-[10px] text-zinc-700 text-center mt-4 font-mono leading-relaxed">
              Al acceder aceptas los{' '}
              <a href="/terms" className="text-zinc-600 underline hover:text-zinc-400">
                Términos de C8L Agency
              </a>
              . +18 · Juega responsablemente.
            </p>
          </div>

          {/* Bottom accent */}
          <div style={{
            height: '2px',
            background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.25), transparent)'
          }} />
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
