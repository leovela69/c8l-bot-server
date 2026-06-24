'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Providers } from '../providers'
import { useAuth } from '@/lib/auth/context'
import AgeGate from '@/components/auth/AgeGate'
import AppShell from '@/components/layout/AppShell'

const POSTS = [
  {
    id: 1, author: 'Leo Vela', emoji: '🧡', time: 'hace 2h', verified: true,
    content: '🔥 Nuevo Bolero-House Session Vol. 4 ya disponible en C8L TV. El drop del minuto 3:20 es BRUTAL. ¿Qué opinan? #BoleroHouse #C8L',
    image: 'https://images.unsplash.com/photo-1571330735066-03aaa9429d89?w=600&h=400&fit=crop',
    likes: 89, comments: 23, shares: 12
  },
  {
    id: 2, author: 'Reina Melody', emoji: '👑', time: 'hace 4h', verified: true,
    content: 'Grabando vocals para el próximo duet con @MCFuego 🎤✨ La fusión salsa + cyberpunk va a romper todo. Stay tuned familia!',
    image: null,
    likes: 134, comments: 45, shares: 8
  },
  {
    id: 3, author: 'DJ Rayo', emoji: '⚡', time: 'hace 6h', verified: true,
    content: '🎧 Nuevo set de 3 horas subido. Acid House puro, sin filtros, sin edición. El underground vive en C8L.',
    image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600&h=400&fit=crop',
    likes: 67, comments: 18, shares: 5
  },
  {
    id: 4, author: 'MC Fuego', emoji: '🔥', time: 'hace 8h', verified: false,
    content: '¿Quién se anima a un freestyle battle esta noche a las 22:00? 🔥🎤 Las Salas de C8L están listas. El que pierda paga 50 coins jaja',
    image: null,
    likes: 45, comments: 31, shares: 3
  },
  {
    id: 5, author: 'BeatMaster', emoji: '🎧', time: 'hace 12h', verified: true,
    content: '📚 Tutorial nuevo: "Cómo crear un beat de 0 a pro en 5 minutos con Ableton + IA del Estudio C8L". Link en mi perfil. Gratis para la comunidad.',
    image: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=600&h=400&fit=crop',
    likes: 112, comments: 56, shares: 28
  },
]

const TRENDING_TAGS = ['#BoleroHouse', '#C8LTV', '#FreestyleBattle', '#BeatMaking', '#DuetChallenge', '#NeonNights', '#ProducciónIA']

function ComunidadContent() {
  const { isAgeVerified, isLoading, user } = useAuth()
  const [newPost, setNewPost] = useState('')

  if (isLoading) return <div className="min-h-screen bg-[#0A0A0A]" />
  if (!isAgeVerified) return <AgeGate />

  return (
    <AppShell>
      <div className="p-4 md:p-6 pb-20 lg:pb-6">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-outfit font-bold text-white flex items-center gap-2">
              <span>👥</span> Comunidad
            </h1>
            <p className="text-sm text-gray-400 mt-1">Feed social de la familia C8L</p>
          </div>

          {/* Trending Tags */}
          <div className="flex gap-2 overflow-x-auto pb-3 mb-6 scrollbar-hide">
            {TRENDING_TAGS.map(tag => (
              <span key={tag} className="px-3 py-1 rounded-full text-[11px] bg-c8l-purple/20 text-c8l-purple border border-c8l-purple/30 whitespace-nowrap cursor-pointer hover:bg-c8l-purple/30 transition">
                {tag}
              </span>
            ))}
          </div>

          {/* Create Post */}
          <div className="glass rounded-xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-c8l-pink to-c8l-purple flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold">{user?.name?.[0] || '?'}</span>
              </div>
              <div className="flex-1">
                <textarea
                  placeholder="¿Qué estás creando hoy?"
                  value={newPost}
                  onChange={(e) => setNewPost(e.target.value)}
                  className="w-full bg-transparent text-sm text-white placeholder-gray-500 outline-none resize-none min-h-[60px]"
                />
                <div className="flex items-center justify-between pt-3 border-t border-gray-800/50">
                  <div className="flex gap-2">
                    <button className="text-xs text-gray-500 hover:text-white transition px-2 py-1 rounded hover:bg-gray-800">📷 Foto</button>
                    <button className="text-xs text-gray-500 hover:text-white transition px-2 py-1 rounded hover:bg-gray-800">🎵 Audio</button>
                    <button className="text-xs text-gray-500 hover:text-white transition px-2 py-1 rounded hover:bg-gray-800">📊 Encuesta</button>
                  </div>
                  <button className="bg-c8l-cyan text-black text-xs font-bold px-4 py-1.5 rounded-full hover:bg-c8l-cyan/80 transition">
                    Publicar
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Posts Feed */}
          <div className="space-y-4">
            {POSTS.map((post, i) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="glass rounded-xl p-4"
              >
                {/* Post Header */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gray-700 to-gray-600 flex items-center justify-center text-lg">
                    {post.emoji}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-bold text-white">{post.author}</span>
                      {post.verified && <span className="text-c8l-cyan text-[10px]">✓</span>}
                    </div>
                    <span className="text-[10px] text-gray-500">{post.time}</span>
                  </div>
                  <button className="text-gray-500 hover:text-white transition">⋯</button>
                </div>

                {/* Content */}
                <p className="text-sm text-gray-200 mb-3 leading-relaxed">{post.content}</p>

                {/* Image */}
                {post.image && (
                  <div className="rounded-xl overflow-hidden mb-3 border border-gray-800/50">
                    <img src={post.image} alt="" className="w-full h-48 object-cover" />
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-4 pt-3 border-t border-gray-800/50">
                  <button className="flex items-center gap-1.5 text-gray-400 hover:text-c8l-pink transition text-xs">
                    <span>♡</span> <span>{post.likes}</span>
                  </button>
                  <button className="flex items-center gap-1.5 text-gray-400 hover:text-c8l-cyan transition text-xs">
                    <span>💬</span> <span>{post.comments}</span>
                  </button>
                  <button className="flex items-center gap-1.5 text-gray-400 hover:text-green-400 transition text-xs">
                    <span>🔄</span> <span>{post.shares}</span>
                  </button>
                  <button className="ml-auto text-gray-400 hover:text-c8l-gold transition text-xs">
                    🔖
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  )
}

export default function ComunidadPage() {
  return <Providers><ComunidadContent /></Providers>
}
