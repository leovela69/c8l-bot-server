// components/security/AgeGate.tsx
'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield } from 'lucide-react';

export function AgeGate({ onVerified }: { onVerified: () => void }) {
  const [show, setShow] = useState(true);
  const [birthDate, setBirthDate] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    // Verificar si ya se verificó en esta sesión
    const verified = sessionStorage.getItem('age_verified');
    if (verified === 'true') {
      setShow(false);
      onVerified();
    }
  }, [onVerified]);

  const verifyAge = () => {
    if (!birthDate) {
      setError('Por favor ingresa tu fecha de nacimiento');
      return;
    }
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) age--;
    if (age >= 18) {
      sessionStorage.setItem('age_verified', 'true');
      setShow(false);
      onVerified();
    } else {
      setError('Debes tener al menos 18 años para usar C8L Agency.');
    }
  };

  if (!show) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
      >
        <div className="bg-gray-900 border-4 border-[#D4AF37] p-6 text-center max-w-md w-full">
          <Shield size={48} className="mx-auto text-[#D4AF37] mb-4" />
          <h2 className="text-2xl font-black text-[#D4AF37]">Verificación de edad</h2>
          <p className="text-gray-400 my-4">Debes ser mayor de 18 años para acceder a C8L Agency.</p>
          <input
            type="date"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
            className="w-full bg-black border border-gray-700 p-2 text-white mb-4 rounded"
          />
          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
          <button
            onClick={verifyAge}
            className="bg-[#D4AF37] text-black px-6 py-2 font-black rounded w-full"
          >
            VERIFICAR Y ENTRAR
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}