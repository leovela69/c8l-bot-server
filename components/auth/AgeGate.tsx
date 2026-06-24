'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/lib/auth/context'

export default function AgeGate() {
  const { verifyAge } = useAuth()
  const [day, setDay] = useState('')
  const [month, setMonth] = useState('')
  const [year, setYear] = useState('')
  const [error, setError] = useState('')
  const [denied, setDenied] = useState(false)

  const handleVerify = () => {
    setError('')
    
    const d = parseInt(day)
    const m = parseInt(month)
    const y = parseInt(year)

    if (!d || !m || !y || d < 1 || d > 31 || m < 1 || m > 12 || y < 1900 || y > 2020) {
      setError('Introduce una fecha de nacimiento válida')
      return
    }

    const birthDate = new Date(y, m - 1, d)
    
    if (isNaN(birthDate.getTime())) {
      setError('Fecha inválida')
      return
    }

    const isVerified = verifyAge(birthDate)
    
    if (!isVerified) {
      setDenied(true)
    }
  }

  if (denied) {
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
            Debes ser mayor de 18 años para acceder a esta plataforma.
            Esta restricción cumple con la legislación vigente (RGPD / LO 3/2018).
          </p>
          <div className="bg-red-900/20 border border-red-800/50 rounded-xl p-4">
            <p className="text-xs text-red-300">
              ⚠️ Se ha registrado este intento de acceso. C8L Agency reporta cualquier 
              intento fraudulento de acceso por menores a las autoridades competentes.
            </p>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A0A0A] p-6 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-c8l-purple/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-c8l-gold/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="glass rounded-2xl p-8 max-w-md w-full text-center relative z-10"
      >
        {/* Logo */}
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-c8l-gold to-c8l-purple flex items-center justify-center shadow-lg shadow-c8l-purple/30">
          <span className="text-3xl font-outfit font-black text-white">C8L</span>
        </div>

        <h1 className="text-3xl font-outfit font-bold text-c8l-gold mb-2">Verificación de Edad</h1>
        <p className="text-sm text-gray-400 mb-8">
          C8L Agency es exclusiva para mayores de 18 años.<br/>
          Introduce tu fecha de nacimiento para continuar.
        </p>

        {/* Date inputs */}
        <div className="flex gap-3 mb-6">
          <div className="flex-1">
            <label className="block text-[10px] text-gray-500 uppercase mb-1 text-left">Día</label>
            <input
              type="number"
              placeholder="DD"
              min="1"
              max="31"
              value={day}
              onChange={(e) => setDay(e.target.value)}
              className="w-full bg-gray-900/80 border border-gray-700 rounded-xl px-4 py-3 text-white text-center text-lg font-bold focus:border-c8l-gold focus:outline-none transition"
            />
          </div>
          <div className="flex-1">
            <label className="block text-[10px] text-gray-500 uppercase mb-1 text-left">Mes</label>
            <input
              type="number"
              placeholder="MM"
              min="1"
              max="12"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="w-full bg-gray-900/80 border border-gray-700 rounded-xl px-4 py-3 text-white text-center text-lg font-bold focus:border-c8l-gold focus:outline-none transition"
            />
          </div>
          <div className="flex-1">
            <label className="block text-[10px] text-gray-500 uppercase mb-1 text-left">Año</label>
            <input
              type="number"
              placeholder="AAAA"
              min="1900"
              max="2020"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="w-full bg-gray-900/80 border border-gray-700 rounded-xl px-4 py-3 text-white text-center text-lg font-bold focus:border-c8l-gold focus:outline-none transition"
            />
          </div>
        </div>

        <AnimatePresence>
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-red-400 text-sm mb-4"
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>

        <button
          onClick={handleVerify}
          className="w-full py-4 bg-gradient-to-r from-c8l-purple to-c8l-gold rounded-xl font-bold text-lg hover:scale-[1.02] active:scale-[0.98] transition-transform shadow-lg shadow-c8l-purple/30"
        >
          🔓 Verificar y Entrar
        </button>

        {/* Legal notice */}
        <div className="mt-6 space-y-2">
          <p className="text-[10px] text-gray-600">
            Al verificar tu edad, aceptas los <span className="text-c8l-cyan cursor-pointer hover:underline">Términos de Servicio</span> y 
            la <span className="text-c8l-cyan cursor-pointer hover:underline">Política de Privacidad</span>.
          </p>
          <p className="text-[10px] text-gray-700">
            Cumplimos con RGPD (UE), LO 3/2018 (España) y la normativa de protección de menores.
          </p>
        </div>

        {/* +18 badge */}
        <div className="mt-6 inline-flex items-center gap-2 bg-red-900/30 border border-red-800/50 rounded-full px-4 py-2">
          <span className="text-lg">🔞</span>
          <span className="text-xs text-red-300 font-bold">SOLO +18 AÑOS</span>
        </div>
      </motion.div>
    </div>
  )
}
