'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Providers } from '../providers'
import { useAuth } from '@/lib/auth/context'
import AgeGate from '@/components/auth/AgeGate'
import AppShell from '@/components/layout/AppShell'

const SALAS = [
  { id: 1, name: 'Bolero-House Lounge', host: 'Leo Vela', emoji: '🧡', listeners: 47, status: 'live', genre: 'Bolero-House', color: 'from-purple-600 to-pink-600' },
  { id: 2, name: 'Acid Underground', host: 'DJ Rayo', emoji: '⚡', listeners: 32, status: 'live', genre: 'Acid House', color: 'from-green-600 to-emerald-600' },
  { id: 3, name: 'Vocal Sessions', host: 'Reina Melody', emoji: '👑', listeners: 68, status: 'live', genre: 'Pop/R&B', color: 'from-pink-600 to-red-600' },
  { id: 4, name: 'Beat Lab', host: 'BeatMaster', emoji: '🎧', listeners: 21, status: 'live', genre: 'Production', color: 'from-cyan-600 to-blue-600' },
  { id: 5, name: 'Freestyle Arena', host: 'MC Fuego', emoji: '🔥', listeners: 55, status: 'live', genre: 'Hip-Hop', color: 'from-orange-600 to-red-600' },
  { id: 6, name: 'Chill & Chat', host: 'C8L Bot', emoji: '🤖', listeners: 12, status: 'waiting', genre: 'Ambient', color: 'from-gray-600 to-gray-700' },
  { id: 7, name: 'Karaoke Night', host: 'Comunidad', emoji: '🎤', listeners: 0, status: 'scheduled', genre: 'Karaoke', color: 'from-yellow-600 to-orange-600' },
  { id: 8, name: 'Masterclass: Mix', host: 'DJ Rayo', emoji: '⚡', listeners: 0, status: 'scheduled', genre: 'Tutorial', color: 'from-indigo-600 to-purple-600' },
]

function SalasContent() {
  const { isAgeVerified, isLoading } = useAuth()
  const [filter, setFilter] = useState('todas')

  if (isLoading) return <div className="min-h-screen bg-[#0A0A0A]" />
  if (!isAgeVerified) return <AgeGate />

  const filteredSalas = filter === 'todas' ? SALAS : SALAS.filter(s => s.status === filter)

  return (
    <AppShell>
      <div className="p-4 md:p-6 pb-20 lg:pb-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-outfit font-bold text-white flex items-center gap-2">
            <span>🎵</span> Salas en Vivo
          </h1>
          <p className="text-sm text-gray-400 mt-1">Únete a una sala o crea la tuya propia</p>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6">
          {[
            { key: 'todas', label: 'Todas' },
            { key: 'live', label: '🔴 En Vivo' },
            { key: 'waiting', label: '⏳ Esperando' },
            { key: 'scheduled', label: '📅 Programadas' },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition border ${
                filter === f.key
                  ? 'bg-c8l-cyan text-black border-c8l-cyan'
                  : 'text-gray-400 border-gray-700 hover:border-gray-500'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Create Room Button */}
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          className="w-full mb-6 py-4 rounded-xl border-2 border-dashed border-c8l-purple/50 text-c8l-purple hover:bg-c8l-purple/10 transition flex items-center justify-center gap-2"
        >
          <span className="text-xl">+</span>
          <span className="font-bold text-sm">Crear Nueva Sala</span>
        </motion.button>

        {/* Salas Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSalas.map((sala, i) => (
            <motion.div
              key={sala.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass rounded-xl overflow-hidden hover:border-c8l-gold/30 transition cursor-pointer group"
            >
              {/* Color bar top */}
              <div className={`h-1 bg-gradient-to-r ${sala.color}`} />
              
              <div className="p-4">
                {/* Status badge */}
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    sala.status === 'live' ? 'bg-red-500/20 text-red-400' :
                    sala.status === 'waiting' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-gray-500/20 text-gray-400'
                  }`}>
                    {sala.status === 'live' ? '🔴 EN VIVO' : sala.status === 'waiting' ? '⏳ ESPERANDO' : '📅 PROGRAMADA'}
                  </span>
                  <span className="text-[10px] text-gray-500">{sala.genre}</span>
                </div>

                {/* Room name */}
                <h3 className="text-sm font-bold text-white mb-2 group-hover:text-c8l-cyan transition">{sala.name}</h3>

                {/* Host */}
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">{sala.emoji}</span>
                  <span className="text-xs text-gray-400">{sala.host}</span>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-800/50">
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-gray-500">👥</span>
                    <span className="text-xs text-gray-400">{sala.listeners} {sala.listeners === 1 ? 'oyente' : 'oyentes'}</span>
                  </div>
                  <button className={`text-xs font-bold px-3 py-1 rounded-full transition ${
                    sala.status === 'live'
                      ? 'bg-c8l-cyan text-black hover:bg-c8l-cyan/80'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}>
                    {sala.status === 'live' ? 'UNIRSE' : sala.status === 'waiting' ? 'ESPERAR' : 'RECORDAR'}
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Active listeners banner */}
        <div className="mt-8 glass rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
              <span className="text-lg">🎧</span>
            </div>
            <div>
              <p className="text-sm font-bold text-white">235 personas escuchando ahora</p>
              <p className="text-[10px] text-gray-500">En todas las salas activas de C8L</p>
            </div>
          </div>
          <div className="flex -space-x-2">
            {['🧡', '⚡', '👑', '🎧', '🔥'].map((e, i) => (
              <div key={i} className="w-7 h-7 rounded-full bg-gray-700 border-2 border-[#0A0A0A] flex items-center justify-center text-xs">
                {e}
              </div>
            ))}
            <div className="w-7 h-7 rounded-full bg-gray-700 border-2 border-[#0A0A0A] flex items-center justify-center text-[9px] text-gray-400">
              +230
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  )
}

export default function SalasPage() {
  return <Providers><SalasContent /></Providers>
}
