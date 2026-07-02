'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react';

interface AgeGateProps {
  onVerified: () => void;
}

const CURRENT_YEAR = new Date().getFullYear();
const MIN_YEAR = CURRENT_YEAR - 100; // No se aceptan nacidos hace más de 100 años (anti-tramposos)
const MAX_YEAR = CURRENT_YEAR - 18;  // Solo mayores de 18 años admitidos

export function AgeGate({ onVerified }: AgeGateProps) {
  const [day, setDay] = useState<number | null>(null);
  const [month, setMonth] = useState<number | null>(null);
  const [year, setYear] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [denied, setDenied] = useState(false);

  const months = [
    'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
    'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
  ];

  const verifyAge = () => {
    setError('');
    if (!day || !month || !year) {
      setError('Por favor completa tu fecha de nacimiento.');
      return;
    }

    setVerifying(true);

    setTimeout(() => {
      const today = new Date();
      const birth = new Date(year, month - 1, day);
      let age = today.getFullYear() - birth.getFullYear();
      const mDiff = today.getMonth() - birth.getMonth();
      if (mDiff < 0 || (mDiff === 0 && today.getDate() < birth.getDate())) age--;

      // Regla C8L: Anti-tramposo de más de 200 años
      if (age > 200) {
        setVerifying(false);
        setError('¡No pongas más de 200 años, pilluelo! 🎭');
        return;
      }

      if (age >= 18) {
        try { sessionStorage.setItem('age_verified', 'true'); } catch (_) {}
        try { localStorage.setItem('age_verified', 'true'); } catch (_) {}
        onVerified();
      } else {
        setVerifying(false);
        setDenied(true);
      }
    }, 900);
  };

  // Stepper helper
  const changeDay = (d: number) => {
    const clamped = Math.max(1, Math.min(31, d));
    setDay(clamped);
    setError('');
  };
  const changeMonth = (m: number) => {
    const clamped = Math.max(1, Math.min(12, m));
    setMonth(clamped);
    setError('');
  };
  const changeYear = (y: number) => {
    // Clamp to valid C8L range: no older than 100 years, must be 18+
    const clamped = Math.max(MIN_YEAR, Math.min(MAX_YEAR, y));
    setYear(clamped);
    setError('');
  };

  // Build full year options list for screen-reader accessibility
  const yearOptions: number[] = [];
  for (let y = MAX_YEAR; y >= MIN_YEAR; y--) yearOptions.push(y);

  return (
    <AnimatePresence>
      <motion.div
        key="age-gate-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.4 }}
        className="fixed inset-0 z-[9000] flex items-center justify-center p-4"
        style={{ background: 'rgba(0,0,0,0.97)' }}
      >
        {/* Animated grid background */}
        <div className="digital-grid-animated" style={{ opacity: 0.4 }} />
        <div className="hologram-scanline" />

        {/* Radial glow behind card */}
        <div
          className="absolute w-[600px] h-[600px] rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(212,175,55,0.08) 0%, transparent 70%)',
            top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)'
          }}
        />

        <motion.div
          key="age-gate-card"
          initial={{ scale: 0.88, opacity: 0, y: 30 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.88, opacity: 0, y: 30 }}
          transition={{ type: 'spring', stiffness: 260, damping: 22 }}
          className="relative w-full max-w-md z-10 transition-all duration-300"
          style={{
            background: '#0d0d0e',
            border: '3px solid #000000',
            borderRadius: '12px',
            boxShadow: denied ? '6px 6px 0px #FF0055' : '6px 6px 0px #D4AF37',
            overflow: 'hidden'
          }}
        >
          {/* Top accent stripe */}
          <div style={{
            height: '3px',
            background: 'linear-gradient(90deg, transparent, #D4AF37, #00F3FF, #D4AF37, transparent)',
            opacity: 0.8
          }} />

          {/* Corner decorations */}
          <div className="absolute top-4 left-4 w-5 h-5 border-t-2 border-l-2 border-[#D4AF37]/40 rounded-tl-sm" />
          <div className="absolute top-4 right-4 w-5 h-5 border-t-2 border-r-2 border-[#D4AF37]/40 rounded-tr-sm" />
          <div className="absolute bottom-4 left-4 w-5 h-5 border-b-2 border-l-2 border-[#D4AF37]/40 rounded-bl-sm" />
          <div className="absolute bottom-4 right-4 w-5 h-5 border-b-2 border-r-2 border-[#D4AF37]/40 rounded-br-sm" />

          <div className="p-8 pt-10 pb-8">
            {/* Shield icon + logo */}
            <div className="flex flex-col items-center mb-6">
              <motion.div
                animate={{ boxShadow: ['0 0 15px rgba(212,175,55,0.3)', '0 0 30px rgba(212,175,55,0.6)', '0 0 15px rgba(212,175,55,0.3)'] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                style={{
                  background: 'radial-gradient(circle, rgba(212,175,55,0.15) 0%, rgba(212,175,55,0.05) 100%)',
                  border: '2px solid rgba(212,175,55,0.4)'
                }}
              >
                <Shield size={30} color="#D4AF37" strokeWidth={1.5} />
              </motion.div>

              <span
                className="text-[10px] font-mono uppercase tracking-[0.3em] font-bold mb-1"
                style={{ color: '#00F3FF', textShadow: '0 0 10px rgba(0,243,255,0.5)' }}
              >
                C8L AGENCY — ACCESO RESTRINGIDO
              </span>

              <h1
                className="text-2xl font-black uppercase tracking-wider text-center"
                style={{ fontFamily: 'var(--font-heading)', color: '#D4AF37', textShadow: '0 0 20px rgba(212,175,55,0.4)' }}
              >
                Verificación de Edad
              </h1>

              <p className="text-zinc-400 text-xs text-center mt-2 max-w-xs leading-relaxed">
                Este sitio contiene contenido para mayores de 18 años.
                Introduce tu fecha de nacimiento para continuar.
              </p>
            </div>

            {/* Divider */}
            <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mb-6" />

            {denied ? (
              // Access denied screen
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-4"
              >
                <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
                  style={{ background: 'rgba(255,0,85,0.1)', border: '2px solid rgba(255,0,85,0.4)' }}>
                  <AlertTriangle size={26} color="#FF0055" />
                </div>
                <h2 className="text-lg font-black uppercase text-white mb-2" style={{ fontFamily: 'var(--font-heading)' }}>
                  Acceso Denegado
                </h2>
                <p className="text-zinc-400 text-sm">
                  Debes tener al menos <span className="text-[#FF0055] font-bold">18 años</span> para acceder a C8L Agency.
                </p>
                <p className="text-zinc-600 text-xs mt-3">
                  Si crees que hay un error, verifica tu fecha de nacimiento.
                </p>
                <button
                  onClick={() => { setDenied(false); setDay(null); setMonth(null); setYear(null); }}
                  className="mt-5 text-xs font-mono text-[#00F3FF] underline underline-offset-2 cursor-pointer hover:text-white transition-colors"
                >
                  ← Volver a intentar
                </button>
              </motion.div>
            ) : (
              <>
                {/* Date Pickers */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  {/* Day */}
                  <div>
                    <label className="block text-[10px] font-mono uppercase tracking-widest text-zinc-500 mb-1.5 text-center">
                      Día
                    </label>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => changeDay((day ?? 1) - 1)}
                        className="flex-none w-7 h-9 flex items-center justify-center rounded text-zinc-400 hover:text-[#D4AF37] transition-colors cursor-pointer"
                        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                      >
                        <ChevronLeft size={12} />
                      </button>
                      <input
                        type="number"
                        min={1} max={31}
                        value={day ?? ''}
                        onChange={e => changeDay(parseInt(e.target.value) || 1)}
                        placeholder="DD"
                        className="flex-1 h-9 text-center text-sm font-mono font-bold text-white rounded outline-none"
                        style={{
                          background: 'rgba(212,175,55,0.05)',
                          border: `1px solid ${day ? 'rgba(212,175,55,0.5)' : 'rgba(255,255,255,0.1)'}`,
                          MozAppearance: 'textfield'
                        }}
                      />
                      <button
                        onClick={() => changeDay((day ?? 0) + 1)}
                        className="flex-none w-7 h-9 flex items-center justify-center rounded text-zinc-400 hover:text-[#D4AF37] transition-colors cursor-pointer"
                        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                      >
                        <ChevronRight size={12} />
                      </button>
                    </div>
                  </div>

                  {/* Month */}
                  <div>
                    <label className="block text-[10px] font-mono uppercase tracking-widest text-zinc-500 mb-1.5 text-center">
                      Mes
                    </label>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => changeMonth((month ?? 1) - 1)}
                        className="flex-none w-7 h-9 flex items-center justify-center rounded text-zinc-400 hover:text-[#D4AF37] transition-colors cursor-pointer"
                        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                      >
                        <ChevronLeft size={12} />
                      </button>
                      <div
                        className="flex-1 h-9 flex items-center justify-center text-sm font-mono font-bold text-white rounded"
                        style={{
                          background: 'rgba(212,175,55,0.05)',
                          border: `1px solid ${month ? 'rgba(212,175,55,0.5)' : 'rgba(255,255,255,0.1)'}`
                        }}
                      >
                        {month ? months[month - 1] : <span className="text-zinc-600">MM</span>}
                      </div>
                      <button
                        onClick={() => changeMonth((month ?? 0) + 1)}
                        className="flex-none w-7 h-9 flex items-center justify-center rounded text-zinc-400 hover:text-[#D4AF37] transition-colors cursor-pointer"
                        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                      >
                        <ChevronRight size={12} />
                      </button>
                    </div>
                  </div>

                  {/* Year */}
                  <div>
                    <label className="block text-[10px] font-mono uppercase tracking-widest text-zinc-500 mb-1.5 text-center">
                      Año
                    </label>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => changeYear((year ?? MAX_YEAR) - 1)}
                        disabled={(year ?? MAX_YEAR) <= MIN_YEAR}
                        className="flex-none w-7 h-9 flex items-center justify-center rounded text-zinc-400 hover:text-[#D4AF37] transition-colors cursor-pointer disabled:opacity-30"
                        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                      >
                        <ChevronLeft size={12} />
                      </button>
                      {/* Native select for accessibility + full year range without blocking */}
                      <select
                        value={year ?? ''}
                        onChange={e => changeYear(parseInt(e.target.value))}
                        className="flex-1 h-9 text-center text-xs font-mono font-bold text-white rounded outline-none cursor-pointer appearance-none"
                        style={{
                          background: 'rgba(212,175,55,0.05)',
                          border: `1px solid ${year ? 'rgba(212,175,55,0.5)' : 'rgba(255,255,255,0.1)'}`,
                        }}
                      >
                        <option value="" disabled>AAAA</option>
                        {yearOptions.map(y => (
                          <option key={y} value={y} style={{ background: '#0d0d0e', color: '#fff' }}>{y}</option>
                        ))}
                      </select>
                      <button
                        onClick={() => changeYear((year ?? MIN_YEAR) + 1)}
                        disabled={(year ?? MIN_YEAR) >= MAX_YEAR}
                        className="flex-none w-7 h-9 flex items-center justify-center rounded text-zinc-400 hover:text-[#D4AF37] transition-colors cursor-pointer disabled:opacity-30"
                        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                      >
                        <ChevronRight size={12} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Error message */}
                <AnimatePresence>
                  {error && (
                    <motion.p
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="text-xs text-center mb-3 font-mono"
                      style={{ color: '#FF0055' }}
                    >
                      ⚠ {error}
                    </motion.p>
                  )}
                </AnimatePresence>

                {/* Verify button */}
                <motion.button
                  id="age-gate-verify-btn"
                  onClick={verifyAge}
                  disabled={verifying}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  className="w-full py-3.5 font-black uppercase text-black cursor-pointer tracking-wider text-sm relative overflow-hidden"
                  style={{
                    fontFamily: 'var(--font-heading)',
                    background: verifying
                      ? 'rgba(212,175,55,0.5)'
                      : 'linear-gradient(90deg, #D4AF37, #F0CF65, #D4AF37)',
                    backgroundSize: '200% 100%',
                    border: '2px solid rgba(0,0,0,0.5)',
                    borderRadius: '10px',
                    boxShadow: verifying ? 'none' : '0 4px 20px rgba(212,175,55,0.35)',
                    letterSpacing: '0.15em'
                  }}
                >
                  {verifying ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      Verificando...
                    </span>
                  ) : (
                    '✓ Verificar y Entrar'
                  )}
                </motion.button>

                {/* Legal note */}
                <p className="text-[10px] text-zinc-600 text-center mt-4 leading-relaxed font-mono">
                  Al continuar, confirmas que tienes 18+ años y aceptas los{' '}
                  <a href="/terms" className="text-zinc-500 underline underline-offset-1 hover:text-zinc-300 transition-colors">
                    Términos de Uso
                  </a>
                  {' '}de C8L Agency.
                  <br />El juego puede crear dependencia. Juega responsablemente.
                </p>
              </>
            )}
          </div>

          {/* Bottom accent stripe */}
          <div style={{
            height: '2px',
            background: 'linear-gradient(90deg, transparent, rgba(0,243,255,0.4), transparent)'
          }} />
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}