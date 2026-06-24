'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Providers } from '../providers'
import { useAuth } from '@/lib/auth/context'
import AgeGate from '@/components/auth/AgeGate'
import AppShell from '@/components/layout/AppShell'

const ACHIEVEMENTS = [
  { id: 1, icon: '🎵', name: 'Primera Canción', desc: 'Subiste tu primer track', unlocked: true },
  { id: 2, icon: '🔥', name: 'En Llamas', desc: '100 likes en un video', unlocked: true },
  { id: 3, icon: '👑', name: 'Rey del Beat', desc: 'Gana 3 Duet Challenges', unlocked: true },
  { id: 4, icon: '🎰', name: 'Suertudo', desc: 'Gana jackpot en Casino', unlocked: false },
  { id: 5, icon: '♟️', name: 'Maestro Ajedrez', desc: 'ELO > 1500', unlocked: false },
  { id: 6, icon: '⚔️', name: 'Guerrero', desc: 'Gana 10 guerras de bando', unlocked: false },
]

const STATS = [
  { label: 'Videos', value: '24', icon: '📺' },
  { label: 'Seguidores', value: '1.2K', icon: '👥' },
  { label: 'Siguiendo', value: '48', icon: '➡️' },
  { label: 'C8L Coins', value: '1,250', icon: '⚡' },
  { label: 'XP Total', value: '8,450', icon: '✨' },
  { label: 'Nivel', value: '12', icon: '🏆' },
]

function PerfilContent() {
  const { isAgeVerified, isLoading, user } = useAuth()
  const [tab, setTab] = useState<'stats' | 'logros' | 'actividad'>('stats')

  if (isLoading) return <div className="min-h-screen bg-[#0A0A0A]" />
  if (!isAgeVerified) return <AgeGate />

  const userName = user?.name || 'Usuario C8L'
  const userEmail = user?.email || 'usuario@c8l.agency'

  return (
    <AppShell>
      <div className="p-4 md:p-6 pb-20 lg:pb-6">
        <div className="max-w-3xl mx-auto">
          {/* Profile Header */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-2xl overflow-hidden mb-6"
          >
            {/* Banner */}
            <div className="h-32 md:h-40 bg-gradient-to-r from-c8l-purple via-c8l-pink to-c8l-gold relative">
              <div className="absolute inset-0 bg-black/20" />
            </div>

            {/* Avatar & Info */}
            <div className="relative px-6 pb-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 -mt-12">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-c8l-gold to-c8l-purple flex items-center justify-center border-4 border-[#0A0A0A] shadow-xl">
                  {user?.avatar ? (
                    <img src={user.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <span className="text-3xl font-outfit font-black">{userName[0]}</span>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl font-outfit font-bold text-white">{userName}</h1>
                    <span className="text-c8l-cyan text-xs">✓</span>
                    <span className="text-[10px] bg-c8l-gold/20 text-c8l-gold px-2 py-0.5 rounded-full font-bold">LVL 12</span>
                  </div>
                  <p className="text-sm text-gray-400">{userEmail}</p>
                  <p className="text-xs text-gray-500 mt-1">Miembro desde Junio 2026 • Bando: Corazones de Fuego 🔥</p>
                </div>
                <button className="bg-gray-700 text-white text-xs font-bold px-4 py-2 rounded-full hover:bg-gray-600 transition">
                  ✏️ Editar Perfil
                </button>
              </div>
            </div>
          </motion.div>

          {/* XP Progress */}
          <div className="glass rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-400">Progreso al Nivel 13</span>
              <span className="text-xs text-c8l-gold font-bold">8,450 / 10,000 XP</span>
            </div>
            <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: '84.5%' }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className="h-full bg-gradient-to-r from-c8l-purple to-c8l-gold rounded-full"
              />
            </div>
            <p className="text-[10px] text-gray-600 mt-1">1,550 XP para subir de nivel</p>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6">
            {[
              { key: 'stats', label: '📊 Estadísticas' },
              { key: 'logros', label: '🏆 Logros' },
              { key: 'actividad', label: '📋 Actividad' },
            ].map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key as any)}
                className={`px-4 py-2 rounded-full text-xs font-bold transition ${
                  tab === t.key ? 'bg-c8l-cyan text-black' : 'bg-gray-800 text-gray-400 hover:text-white'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {tab === 'stats' && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {STATS.map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className="glass rounded-xl p-4 text-center"
                >
                  <span className="text-2xl">{stat.icon}</span>
                  <p className="text-lg font-outfit font-bold text-white mt-1">{stat.value}</p>
                  <p className="text-[10px] text-gray-500">{stat.label}</p>
                </motion.div>
              ))}
            </div>
          )}

          {tab === 'logros' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {ACHIEVEMENTS.map((ach, i) => (
                <motion.div
                  key={ach.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={`glass rounded-xl p-4 flex items-center gap-3 ${!ach.unlocked && 'opacity-50'}`}
                >
                  <div className={`w-11 h-11 rounded-full flex items-center justify-center text-xl ${
                    ach.unlocked ? 'bg-gradient-to-br from-c8l-gold/30 to-c8l-purple/30' : 'bg-gray-800'
                  }`}>
                    {ach.unlocked ? ach.icon : '🔒'}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-bold text-white">{ach.name}</h3>
                    <p className="text-[10px] text-gray-500">{ach.desc}</p>
                  </div>
                  {ach.unlocked && <span className="text-green-400 text-xs">✓</span>}
                </motion.div>
              ))}
            </div>
          )}

          {tab === 'actividad' && (
            <div className="space-y-3">
              {[
                { time: 'Hoy 14:30', action: 'Subiste un nuevo video: "Bolero-House Session Vol.4"', icon: '📺' },
                { time: 'Hoy 12:00', action: 'Ganaste 50 XP por completar un reto semanal', icon: '✨' },
                { time: 'Ayer 22:15', action: 'Ganaste una partida de ajedrez (ELO +12)', icon: '♟️' },
                { time: 'Ayer 18:00', action: 'Tu bando ganó la Guerra de las Notas', icon: '⚔️' },
                { time: 'Hace 2 días', action: 'Compraste "Beat Pack Vol.1" por 500 coins', icon: '🛍️' },
                { time: 'Hace 3 días', action: 'Alcanzaste el Nivel 12', icon: '🏆' },
              ].map((activity, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-3 glass rounded-xl p-3"
                >
                  <span className="text-lg">{activity.icon}</span>
                  <div className="flex-1">
                    <p className="text-xs text-white">{activity.action}</p>
                    <p className="text-[10px] text-gray-500">{activity.time}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  )
}

export default function PerfilPage() {
  return <Providers><PerfilContent /></Providers>
}
