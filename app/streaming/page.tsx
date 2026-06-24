'use client'

import { useState } from 'react'
import Link from 'next/link'
import LegalFooter from '@/components/legal/LegalFooter'

const LIVE_STREAMS = [
  { id: '1', user: 'Leo Vela', emoji: '🧡', viewers: 342, title: 'Producción Bolero-House en VIVO', category: 'Música', gifts: 67, isLive: true },
  { id: '2', user: 'DJ Rayo', emoji: '⚡', viewers: 189, title: 'Acid Lounge Session — 3 horas non-stop', category: 'DJ Set', gifts: 45, isLive: true },
  { id: '3', user: 'Reina Melody', emoji: '👑', viewers: 567, title: 'Karaoke Party + Retos de la comunidad', category: 'Karaoke', gifts: 128, isLive: true },
  { id: '4', user: 'BeatMaster', emoji: '🎧', viewers: 98, title: 'Tutorial: Cómo hacer un beat en 10 min', category: 'Tutorial', gifts: 22, isLive: true },
]

const SCHEDULED = [
  { id: 's1', user: 'Leo Vela', emoji: '🧡', title: 'C8L Agency — Presentación Estudio Antigravity', time: '20:00', date: 'Hoy', category: 'Evento' },
  { id: 's2', user: 'C8L Official', emoji: '🏆', title: 'Torneo Casino Champions — Semifinal', time: '22:00', date: 'Hoy', category: 'Gaming' },
  { id: 's3', user: 'DJ Rayo', emoji: '⚡', title: 'Neon Nights Vol. 5 — Deep House Marathon', time: '00:00', date: 'Mañana', category: 'DJ Set' },
]

export default function StreamingPage() {
  const [tab, setTab] = useState<'live' | 'scheduled' | 'mystream'>('live')

  return (
    <div className="min-h-screen bg-gradient-to-b from-c8l-black via-cyan-950/10 to-c8l-black">
      <header className="glass border-b border-c8l-cyan/20 p-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-2xl font-outfit font-bold text-c8l-gold">C8L</Link>
            <span className="text-gray-500">|</span>
            <h1 className="text-xl font-outfit font-semibold text-c8l-cyan">🎧 Streaming</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-red-600/20 rounded-full px-3 py-1">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-xs text-red-400 font-bold">{LIVE_STREAMS.length} EN VIVO</span>
            </div>
            <Link href="/" className="text-xs text-gray-400 hover:text-white transition">← Volver</Link>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="max-w-6xl mx-auto px-6 pt-4">
        <div className="flex gap-2 border-b border-gray-800 pb-2">
          {([
            ['live', '🔴 En Vivo'],
            ['scheduled', '📅 Programados'],
            ['mystream', '🎬 Mi Stream'],
          ] as [string, string][]).map(([id, label]) => (
            <button key={id} onClick={() => setTab(id as any)}
              className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition ${
                tab === id ? 'bg-c8l-cyan text-black' : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <main className="max-w-6xl mx-auto p-6">
        {tab === 'live' && <LiveStreams />}
        {tab === 'scheduled' && <ScheduledStreams />}
        {tab === 'mystream' && <MyStream />}
      </main>

      <LegalFooter onOpenModal={() => {}} />
    </div>
  )
}

function LiveStreams() {
  return (
    <div>
      <div className="text-center mb-8">
        <h2 className="text-3xl font-outfit font-bold mb-2">🔴 En Vivo Ahora</h2>
        <p className="text-gray-400 text-sm">Streams activos de la comunidad C8L</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {LIVE_STREAMS.map(stream => (
          <div key={stream.id} className="glass rounded-2xl overflow-hidden group cursor-pointer hover:border-c8l-cyan/50 transition">
            {/* Preview */}
            <div className="relative h-52 bg-gradient-to-br from-c8l-purple/30 to-c8l-cyan/20 flex items-center justify-center">
              <span className="text-7xl group-hover:scale-110 transition">{stream.emoji}</span>
              
              {/* Badges */}
              <div className="absolute top-3 left-3 flex gap-2">
                <span className="bg-red-600 text-xs font-bold px-2.5 py-1 rounded animate-pulse">🔴 LIVE</span>
                <span className="bg-black/60 text-xs px-2 py-1 rounded">👁 {stream.viewers}</span>
              </div>
              <div className="absolute top-3 right-3 bg-black/60 text-xs px-2 py-1 rounded text-c8l-gold">
                🎁 {stream.gifts}
              </div>
              <div className="absolute bottom-3 left-3 bg-black/60 text-[10px] px-2 py-1 rounded text-c8l-cyan">
                {stream.category}
              </div>

              {/* Play overlay */}
              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-red-600/80 flex items-center justify-center">
                  <span className="text-white text-2xl ml-1">▶</span>
                </div>
              </div>
            </div>
            
            {/* Info */}
            <div className="p-4">
              <h3 className="font-bold text-sm group-hover:text-c8l-cyan transition mb-1">{stream.title}</h3>
              <div className="flex items-center gap-2">
                <span className="text-sm">{stream.emoji}</span>
                <span className="text-xs text-gray-400">@{stream.user}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="px-4 pb-4 flex gap-2">
              <button className="flex-1 py-2 bg-red-600/20 text-red-400 text-xs font-bold rounded-lg hover:bg-red-600/30 transition">
                ▶ Ver Stream
              </button>
              <button className="px-4 py-2 bg-c8l-gold/20 text-c8l-gold text-xs font-bold rounded-lg hover:bg-c8l-gold/30 transition">
                🎁 Regalar
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function ScheduledStreams() {
  return (
    <div>
      <div className="text-center mb-8">
        <h2 className="text-3xl font-outfit font-bold mb-2">📅 Próximos Streams</h2>
        <p className="text-gray-400 text-sm">No te pierdas los eventos programados</p>
      </div>

      <div className="space-y-4">
        {SCHEDULED.map(stream => (
          <div key={stream.id} className="glass rounded-xl p-5 flex items-center justify-between hover:border-c8l-cyan/30 transition">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-c8l-purple/30 to-c8l-cyan/20 flex items-center justify-center text-2xl">
                {stream.emoji}
              </div>
              <div>
                <h3 className="font-bold text-sm">{stream.title}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-gray-400">@{stream.user}</span>
                  <span className="text-[10px] bg-gray-800 px-2 py-0.5 rounded text-c8l-cyan">{stream.category}</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-bold text-c8l-gold">{stream.time}</div>
              <div className="text-[10px] text-gray-500">{stream.date}</div>
              <button className="mt-2 px-3 py-1 bg-c8l-cyan/20 text-c8l-cyan text-[10px] font-bold rounded-full hover:bg-c8l-cyan/30 transition">
                🔔 Recordar
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function MyStream() {
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('Música')
  const [isStreaming, setIsStreaming] = useState(false)

  return (
    <div>
      <div className="text-center mb-8">
        <h2 className="text-3xl font-outfit font-bold mb-2">🎬 Iniciar Stream</h2>
        <p className="text-gray-400 text-sm">Transmite en vivo para la comunidad C8L</p>
      </div>

      {!isStreaming ? (
        <div className="max-w-lg mx-auto">
          <div className="glass rounded-2xl p-8 space-y-5">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Título del stream</label>
              <input value={title} onChange={e => setTitle(e.target.value)}
                placeholder="Ej: Producción en vivo — Bolero-House Session"
                className="w-full bg-black border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:border-c8l-cyan" />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Categoría</label>
              <select value={category} onChange={e => setCategory(e.target.value)}
                className="w-full bg-black border border-gray-700 rounded-lg p-3 text-white">
                <option>Música</option>
                <option>DJ Set</option>
                <option>Tutorial</option>
                <option>Gaming</option>
                <option>Karaoke</option>
                <option>Charla</option>
                <option>Evento</option>
              </select>
            </div>
            <div className="glass rounded-xl p-4 text-center">
              <p className="text-xs text-gray-400 mb-1">Tips que recibes:</p>
              <p className="text-xl font-bold text-c8l-gold">70% para ti / 30% plataforma</p>
            </div>
            <button
              onClick={() => setIsStreaming(true)}
              disabled={!title}
              className="w-full py-4 bg-gradient-to-r from-red-600 to-red-500 rounded-xl font-bold text-lg hover:scale-105 transition disabled:opacity-50 disabled:hover:scale-100">
              🔴 Iniciar Transmisión
            </button>
          </div>
        </div>
      ) : (
        <div className="max-w-2xl mx-auto">
          <div className="glass rounded-2xl overflow-hidden">
            {/* Fake stream preview */}
            <div className="relative aspect-video bg-gradient-to-br from-c8l-purple/30 to-c8l-cyan/20 flex items-center justify-center">
              <div className="text-center">
                <span className="text-6xl">📡</span>
                <p className="text-lg font-bold mt-4">EN VIVO</p>
                <p className="text-sm text-gray-400">{title}</p>
              </div>
              <div className="absolute top-3 left-3 flex gap-2">
                <span className="bg-red-600 text-xs font-bold px-2.5 py-1 rounded animate-pulse">🔴 LIVE</span>
                <span className="bg-black/60 text-xs px-2 py-1 rounded">👁 0</span>
              </div>
              <div className="absolute top-3 right-3 text-xs bg-black/60 px-2 py-1 rounded">
                00:00:00
              </div>
            </div>
            <div className="p-4 flex justify-between items-center">
              <div>
                <h3 className="font-bold">{title}</h3>
                <span className="text-xs text-gray-500">{category}</span>
              </div>
              <button
                onClick={() => setIsStreaming(false)}
                className="px-6 py-2 bg-red-600 rounded-lg text-sm font-bold hover:bg-red-700 transition">
                ⏹ Finalizar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
