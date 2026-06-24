'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import AppShell from '@/components/layout/AppShell'
import { VIDEOS, CATEGORIES, CREATORS } from '@/lib/videos/data'

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState('Todas')

  return (
    <AppShell>
      <div className="p-4 md:p-6 pb-20 lg:pb-6">
        {/* Search Bar */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 flex items-center bg-gray-800/60 rounded-full border border-gray-700/50 overflow-hidden group focus-within:border-c8l-cyan/50 transition">
            <input
              type="text"
              placeholder="Buscar en C8L TV..."
              className="flex-1 bg-transparent px-4 py-2.5 text-sm text-white placeholder-gray-500 outline-none"
            />
            <button className="px-4 text-gray-400 hover:text-white transition">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </div>
          <button className="bg-gradient-to-r from-c8l-pink to-c8l-purple text-white font-bold text-xs px-4 py-2.5 rounded-full hover:opacity-90 transition">
            + SUBIR
          </button>
        </div>

        {/* Category Pills */}
        <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition border ${
                selectedCategory === cat
                  ? 'bg-c8l-cyan text-black border-c8l-cyan font-bold'
                  : 'bg-transparent text-gray-300 border-gray-700 hover:border-gray-500 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Featured Banner */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative rounded-2xl overflow-hidden mb-8 border border-gray-800/50"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-c8l-purple/80 via-c8l-pink/40 to-transparent z-10" />
          <img
            src="https://images.unsplash.com/photo-1571330735066-03aaa9429d89?w=1200&h=400&fit=crop"
            alt="Featured"
            className="w-full h-48 md:h-56 object-cover"
          />
          <div className="absolute inset-0 z-20 flex items-center px-6 md:px-10">
            <div>
              <span className="inline-block px-2 py-0.5 bg-red-500 rounded text-[10px] font-bold mb-2">🔴 LIVE</span>
              <h2 className="text-xl md:text-3xl font-outfit font-bold mb-1">Bolero-House Session Vol. 4</h2>
              <p className="text-sm text-gray-200 mb-3">Leo Vela - Estreno mundial en C8L TV</p>
              <button className="bg-white text-black font-bold text-xs px-5 py-2 rounded-full hover:bg-gray-200 transition">
                ▶ Ver Ahora
              </button>
            </div>
          </div>
        </motion.div>

        {/* Section: Trending */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-outfit font-bold text-white flex items-center gap-2">
            <span>🔥</span> Tendencia en C8L
          </h2>
          <span className="text-[10px] text-gray-500">{VIDEOS.length} videos</span>
        </div>

        {/* Video Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 mb-12">
          {VIDEOS.map((video, i) => (
            <motion.div
              key={video.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="group"
            >
              <Link href={`/watch?v=${video.id}`}>
                <div className="relative aspect-video rounded-xl overflow-hidden mb-3 border border-gray-800/50 group-hover:border-c8l-purple/50 transition">
                  <img
                    src={video.thumbnail}
                    alt={video.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute bottom-2 right-2 bg-black/80 text-[10px] px-1.5 py-0.5 rounded text-white font-mono">
                    {video.duration}
                  </div>
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
                      <span className="text-white text-xl ml-0.5">▶</span>
                    </div>
                  </div>
                </div>
              </Link>
              <div className="px-1">
                <Link href={`/watch?v=${video.id}`}>
                  <h3 className="text-xs font-bold text-white leading-tight mb-1 line-clamp-2 group-hover:text-c8l-cyan transition">
                    {video.title}
                  </h3>
                </Link>
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-xs">{video.authorEmoji}</span>
                  <span className="text-[11px] text-gray-400">{video.author}</span>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-gray-500">
                  <span>{video.views.toLocaleString()} vistas</span>
                  <span>•</span>
                  <span>hace {video.daysAgo}d</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Creators Section */}
        <div className="mb-12">
          <h2 className="text-lg font-outfit font-bold text-white flex items-center gap-2 mb-4">
            <span>⭐</span> Creadores C8L
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {CREATORS.map((creator, i) => (
              <motion.div
                key={creator.name}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                className="glass rounded-xl p-4 text-center hover:border-c8l-gold/50 transition cursor-pointer group"
              >
                <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-gradient-to-br from-c8l-gold/30 to-c8l-purple/30 flex items-center justify-center text-2xl group-hover:scale-110 transition">
                  {creator.emoji}
                </div>
                <p className="text-xs font-bold text-white">{creator.name}</p>
                <p className="text-[10px] text-gray-500">{creator.subscribers} subs</p>
                {creator.verified && <span className="text-[10px] text-c8l-cyan">✓ Verificado</span>}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Quick Access Cards */}
        <div className="mb-12">
          <h2 className="text-lg font-outfit font-bold text-white flex items-center gap-2 mb-4">
            <span>🚀</span> Acceso Rapido
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <QuickCard href="/casino" icon="🎰" title="Casino" desc="Slots, Blackjack, Ruleta" color="from-purple-600 to-pink-600" />
            <QuickCard href="/studio" icon="🎹" title="Estudio IA" desc="Crea musica con IA" color="from-cyan-600 to-blue-600" />
            <QuickCard href="/streaming" icon="🎧" title="Streaming" desc="En vivo 24/7" color="from-red-600 to-orange-600" />
            <QuickCard href="/comunidad" icon="👥" title="Comunidad" desc="Posts y social" color="from-green-600 to-emerald-600" />
          </div>
        </div>

        {/* Footer */}
        <footer className="border-t border-gray-800/50 pt-8 pb-4">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <h3 className="text-sm font-outfit font-bold text-c8l-gold mb-2">C8L AGENCY</h3>
              <p className="text-[11px] text-gray-500 leading-relaxed">
                Plataforma de entretenimiento, musica y comunidad. El Salto Cuantico en la creacion de contenido.
              </p>
            </div>
            <div>
              <h4 className="text-xs font-bold text-white mb-2">ENLACES</h4>
              <div className="space-y-1">
                <a href="/legal" className="block text-[11px] text-gray-500 hover:text-c8l-cyan transition">Terminos y Condiciones</a>
                <a href="/legal" className="block text-[11px] text-gray-500 hover:text-c8l-cyan transition">Politica de Privacidad</a>
                <a href="/legal" className="block text-[11px] text-gray-500 hover:text-c8l-cyan transition">Cookies</a>
              </div>
            </div>
            <div>
              <h4 className="text-xs font-bold text-white mb-2">CONECTAR</h4>
              <div className="flex gap-2">
                <span className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center cursor-pointer hover:bg-c8l-purple/30 transition">🎮</span>
                <span className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center cursor-pointer hover:bg-c8l-purple/30 transition">📺</span>
                <span className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center cursor-pointer hover:bg-c8l-purple/30 transition">🐦</span>
                <span className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center cursor-pointer hover:bg-c8l-purple/30 transition">📷</span>
              </div>
            </div>
          </div>
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-red-900/20 border border-red-800/40 rounded-full px-4 py-1.5 mb-3">
              <span>🔞</span>
              <span className="text-[10px] text-red-300 font-bold">PLATAFORMA +18 ANOS</span>
            </div>
            <p className="text-[10px] text-gray-600">&copy; 2026 C8L Agency - Todos los derechos reservados</p>
          </div>
        </footer>
      </div>
    </AppShell>
  )
}

function QuickCard({ href, icon, title, desc, color }: { href: string; icon: string; title: string; desc: string; color: string }) {
  return (
    <Link href={href}>
      <div className={`bg-gradient-to-br ${color} rounded-xl p-4 hover:scale-[1.02] active:scale-[0.98] transition-transform cursor-pointer`}>
        <span className="text-2xl">{icon}</span>
        <h3 className="text-sm font-bold mt-2">{title}</h3>
        <p className="text-[10px] text-white/70">{desc}</p>
      </div>
    </Link>
  )
}
