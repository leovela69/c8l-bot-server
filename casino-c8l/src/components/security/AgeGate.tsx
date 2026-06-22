'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface AgeGateProps { onVerified: () => void; }

export function AgeGate({ onVerified }: AgeGateProps) {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const verified = localStorage.getItem('c8l_age_verified');
    if (verified === 'true') { setShow(false); onVerified(); }
  }, []);

  const handleVerify = () => {
    localStorage.setItem('c8l_age_verified', 'true');
    setShow(false);
    onVerified();
  };

  if (!show) return null;

  return (
    <AnimatePresence>
      <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
        className="fixed inset-0 bg-black z-[100] flex items-center justify-center p-4">
        <motion.div initial={{scale:0.8}} animate={{scale:1}}
          className="bg-gray-900 border-4 border-c8l-gold rounded-2xl p-8 max-w-md w-full text-center shadow-[0_0_50px_rgba(212,175,55,0.3)]">
          <div className="text-6xl mb-4">🛡️</div>
          <h2 className="text-2xl font-black text-c8l-gold mb-2">VERIFICACIÓN DE EDAD</h2>
          <p className="text-gray-400 text-sm mb-6">
            Este sitio contiene juegos de azar virtuales y contenido para mayores de 18 años.
            Al continuar, confirmas que tienes al menos 18 años.
          </p>
          <div className="bg-black/50 p-3 rounded-lg border border-gray-800 mb-6 text-xs text-gray-500">
            <p>🤖 <span className="text-c8l-gold">C8L Guardian</span> modera esta plataforma</p>
            <p className="mt-1">📜 Al acceder aceptas las <span className="text-c8l-gold">Normas de la Comunidad</span></p>
          </div>
          <div className="flex gap-3">
            <button onClick={handleVerify}
              className="flex-1 py-3 bg-gradient-to-r from-c8l-gold to-c8l-pink text-black font-bold rounded-lg hover:scale-105 transition">
              ✅ Soy mayor de 18
            </button>
            <button onClick={() => window.location.href = 'https://google.com'}
              className="flex-1 py-3 bg-gray-800 text-gray-400 font-bold rounded-lg hover:bg-gray-700 transition">
              ❌ Soy menor
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
