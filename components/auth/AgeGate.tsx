'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/lib/auth/context'
import Logo from '@/components/ui/Logo'

export default function AgeGate() {
  const { verifyAge } = useAuth()
  const [step, setStep] = useState<'age' | 'login' | 'denied'>('age')
  const [day, setDay] = useState('')
  const [month, setMonth] = useState('')
  const [year, setYear] = useState('')
  const [error, setError] = useState('')

  const handleVerifyAge = () => {
    setError('')
    
    const d = parseInt(day)
    const m = parseInt(month)
    const y = parseInt(year)

    if (!d || !m || !y) {
      setError('Completa todos los campos')
      return
    }

    if (d < 1 || d > 31 || m < 1 || m > 12 || y < 1900 || y > 2025) {
      setError('Fecha de nacimiento inválida')
      return
    }

    const birthDate = new Date(y, m - 1, d)
    
    if (isNaN(birthDate.getTime())) {
      setError('Fecha inválida')
      return
    }

    // Calculate age
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }

    if (age < 18) {
      setStep('denied')
      return
    }

    // Age verified! Show login step
    setStep('login')
  }

  const handleSocialLogin = (provider: string) => {
    // Mark age as verified and proceed
    const d = parseInt(day)
    const m = parseInt(month)
    const y = parseInt(year)
    verifyAge(new Date(y, m - 1, d))
    
    // In a real app, this would redirect to OAuth
    // For now we just pass through
    console.log(`Login with ${provider}`)
  }

  const handleSkipLogin = () => {
    const d = parseInt(day)
    const m = parseInt(month)
    const y = parseInt(year)
    verifyAge(new Date(y, m - 1, d))
  }

  // STEP: DENIED
  if (step === 'denied') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0A0A0A] p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass rounded-2xl p-8 max-w-md w-full text-center border border-red-500/50"
        >
          <div className="text-6xl mb-6">🚫</div>
          <h1 className="text-2xl font-outfit font-bold text-red-400 mb-4">Acceso Denegado</h1>
          <p className="text-gray-400 mb-6">
            Debes ser mayor de 18 años para acceder a C8L Agency.
          </p>
          <div className="bg-red-900/20 border border-red-800/50 rounded-xl p-4">
            <p className="text-xs text-red-300">
              ⚠️ C8L Agency cumple con la legislación vigente de protección de menores
              (RGPD / LO 3/2018). Este intento ha sido registrado.
            </p>
          </div>
        </motion.div>
      </div>
    )
  }

  // STEP: LOGIN (after age verified)
  if (step === 'login') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0A0A0A] p-6 relative overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-c8l-purple/8 via-transparent to-transparent" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-c8l-gold/5 rounded-full blur-3xl" />
          <div className="absolute top-1/3 left-1/4 w-64 h-64 bg-c8l-pink/5 rounded-full blur-3xl" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-8 max-w-md w-full relative z-10"
        >
          {/* Logo */}
          <div className="text-center mb-6">
            <Logo size="xl" className="justify-center mb-4" />
            <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/30 rounded-full px-3 py-1 mb-3">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-[10px] text-green-400 font-bold">EDAD VERIFICADA ✓</span>
            </div>
            <h1 className="text-2xl font-outfit font-bold text-white">¡Bienvenido a C8L!</h1>
            <p className="text-sm text-gray-400 mt-1">Elige cómo quieres entrar</p>
          </div>

          {/* Social Login Buttons */}
          <div className="space-y-2.5">
            {/* Google */}
            <button
              onClick={() => handleSocialLogin('google')}
              className="w-full flex items-center gap-3 py-3.5 px-4 bg-white hover:bg-gray-100 text-gray-900 font-medium rounded-xl transition-all hover:scale-[1.01] active:scale-[0.99]"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span className="text-sm">Continuar con Google</span>
            </button>

            {/* Facebook */}
            <button
              onClick={() => handleSocialLogin('facebook')}
              className="w-full flex items-center gap-3 py-3.5 px-4 bg-[#1877F2] hover:bg-[#166FE5] text-white font-medium rounded-xl transition-all hover:scale-[1.01] active:scale-[0.99]"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              <span className="text-sm">Continuar con Facebook</span>
            </button>

            {/* Instagram */}
            <button
              onClick={() => handleSocialLogin('instagram')}
              className="w-full flex items-center gap-3 py-3.5 px-4 bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#F77737] hover:opacity-90 text-white font-medium rounded-xl transition-all hover:scale-[1.01] active:scale-[0.99]"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
              </svg>
              <span className="text-sm">Continuar con Instagram</span>
            </button>

            {/* TikTok */}
            <button
              onClick={() => handleSocialLogin('tiktok')}
              className="w-full flex items-center gap-3 py-3.5 px-4 bg-black hover:bg-gray-900 text-white font-medium rounded-xl transition-all hover:scale-[1.01] active:scale-[0.99] border border-gray-700"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.88 2.89 2.89 0 01-2.88-2.88 2.89 2.89 0 012.88-2.88c.28 0 .54.04.79.1V9.4a6.33 6.33 0 00-.79-.05A6.34 6.34 0 003.15 15.7a6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.34-6.34V9.45a8.16 8.16 0 004.76 1.52v-3.4a4.85 4.85 0 01-1-.88z"/>
              </svg>
              <span className="text-sm">Continuar con TikTok</span>
            </button>

            {/* Discord */}
            <button
              onClick={() => handleSocialLogin('discord')}
              className="w-full flex items-center gap-3 py-3.5 px-4 bg-[#5865F2] hover:bg-[#4752C4] text-white font-medium rounded-xl transition-all hover:scale-[1.01] active:scale-[0.99]"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
              </svg>
              <span className="text-sm">Continuar con Discord</span>
            </button>

            {/* Apple */}
            <button
              onClick={() => handleSocialLogin('apple')}
              className="w-full flex items-center gap-3 py-3.5 px-4 bg-white hover:bg-gray-100 text-black font-medium rounded-xl transition-all hover:scale-[1.01] active:scale-[0.99]"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
              </svg>
              <span className="text-sm">Continuar con Apple</span>
            </button>
          </div>

          {/* Skip option */}
          <div className="mt-6 pt-4 border-t border-gray-800">
            <button
              onClick={handleSkipLogin}
              className="w-full py-3 text-gray-500 hover:text-white text-sm transition rounded-xl hover:bg-white/5"
            >
              Entrar sin cuenta →
            </button>
          </div>

          <p className="text-[10px] text-gray-600 text-center mt-4">
            Al registrarte aceptas los Términos de Servicio y la Política de Privacidad de C8L Agency.
          </p>
        </motion.div>
      </div>
    )
  }

  // STEP: AGE VERIFICATION (first screen)
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A0A0A] p-6 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-c8l-purple/8 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-c8l-gold/8 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="glass rounded-2xl p-8 max-w-md w-full text-center relative z-10"
      >
        {/* Logo */}
        <Logo size="xl" className="justify-center mb-6" />

        <h1 className="text-3xl font-outfit font-bold text-c8l-gold mb-2">Verificación de Edad</h1>
        <p className="text-sm text-gray-400 mb-2">
          C8L Agency es exclusiva para mayores de 18 años.
        </p>
        <p className="text-xs text-gray-500 mb-8">
          Introduce tu fecha de nacimiento para continuar.
        </p>

        {/* Date inputs */}
        <div className="flex gap-3 mb-6">
          <div className="flex-1">
            <label className="block text-[10px] text-gray-500 uppercase mb-1.5 text-left font-medium">Día</label>
            <input
              type="number"
              placeholder="DD"
              min="1"
              max="31"
              value={day}
              onChange={(e) => setDay(e.target.value)}
              className="w-full bg-gray-900/80 border border-gray-700 rounded-xl px-3 py-3.5 text-white text-center text-lg font-bold focus:border-c8l-gold focus:outline-none focus:ring-1 focus:ring-c8l-gold/50 transition"
            />
          </div>
          <div className="flex-1">
            <label className="block text-[10px] text-gray-500 uppercase mb-1.5 text-left font-medium">Mes</label>
            <input
              type="number"
              placeholder="MM"
              min="1"
              max="12"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="w-full bg-gray-900/80 border border-gray-700 rounded-xl px-3 py-3.5 text-white text-center text-lg font-bold focus:border-c8l-gold focus:outline-none focus:ring-1 focus:ring-c8l-gold/50 transition"
            />
          </div>
          <div className="flex-[1.3]">
            <label className="block text-[10px] text-gray-500 uppercase mb-1.5 text-left font-medium">Año</label>
            <input
              type="number"
              placeholder="AAAA"
              min="1900"
              max="2025"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="w-full bg-gray-900/80 border border-gray-700 rounded-xl px-3 py-3.5 text-white text-center text-lg font-bold focus:border-c8l-gold focus:outline-none focus:ring-1 focus:ring-c8l-gold/50 transition"
            />
          </div>
        </div>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-red-400 text-sm mb-4 bg-red-500/10 border border-red-500/30 rounded-lg py-2 px-3"
            >
              ❌ {error}
            </motion.p>
          )}
        </AnimatePresence>

        {/* Verify button */}
        <button
          onClick={handleVerifyAge}
          className="w-full py-4 bg-gradient-to-r from-c8l-purple to-c8l-gold rounded-xl font-bold text-lg hover:scale-[1.02] active:scale-[0.98] transition-transform shadow-lg shadow-c8l-purple/30"
        >
          🔓 Verificar Edad
        </button>

        {/* Legal */}
        <div className="mt-6 space-y-2">
          <p className="text-[10px] text-gray-600">
            Al verificar, aceptas los <span className="text-c8l-cyan cursor-pointer hover:underline">Términos de Servicio</span> y 
            la <span className="text-c8l-cyan cursor-pointer hover:underline">Política de Privacidad</span>.
          </p>
        </div>

        {/* +18 badge */}
        <div className="mt-5 inline-flex items-center gap-2 bg-red-900/20 border border-red-800/40 rounded-full px-4 py-2">
          <span className="text-lg">🔞</span>
          <span className="text-[10px] text-red-300 font-bold">SOLO MAYORES DE 18 AÑOS</span>
        </div>
      </motion.div>
    </div>
  )
}
