'use client'

import { useState } from 'react'
import Link from 'next/link'
import Logo from '@/components/ui/Logo'
import CreditsDisplay from '@/components/ui/CreditsDisplay'
import ChatWidget from '@/components/bot/ChatWidget'

// ============ DATOS DE PISTAS ============
const TRACKS = [
  { id: 1, title: 'Bolero de Silicio', author: '@c8l_creator', genre: 'BOLERO-HOUSE ESPACIAL', date: '2026-05-31', liked: true },
  { id: 2, title: 'Sable de Samurai', author: '@c8l_creator', genre: 'CYBER DUBSTEP', date: '2026-05-30', liked: false },
  { id: 3, title: 'Ciber-Charleston', author: '@c8l_creator', genre: 'ELECTRO SWING FUTURISTA', date: '2026-05-28', liked: false },
  { id: 4, title: 'Seda de Ibiza', author: '@c8l_creator', genre: 'DEEP HOUSE', date: '2026-05-25', liked: true },
]

const EMOTIONS = [
  { emoji: '😊', label: 'Alegre' },
  { emoji: '😢', label: 'Triste' },
  { emoji: '🤬', label: 'Agresivo' },
  { emoji: '⚡', label: 'Energico' },
  { emoji: '🥺', label: 'Melancolico' },
  { emoji: '🎭', label: 'Epico' },
  { emoji: '💕', label: 'Sensual' },
  { emoji: '👻', label: 'Misterioso' },
]

// ============ NAV ITEMS ============
const NAV_ITEMS = [
  { href: '/tv', icon: '📺', label: 'C8L TV' },
  { href: '/salas', icon: '🎵', label: 'SALAS' },
  { href: '/streaming', icon: '🎧', label: 'STREAMING' },
  { href: '/monetizacion', icon: '💰', label: 'MONETIZACION' },
  { href: '/comunidad', icon: '👥', label: 'COMUNIDAD' },
  { href: '/perfil', icon: '👤', label: 'PERFIL' },
  { href: '/studio', icon: '🤖', label: 'ESTUDIO IA' },
]

// ============ SIDEBAR ITEMS ============
const SIDEBAR_ITEMS = [
  { icon: '🧭', label: 'EXPLORAR', href: '/tv' },
  { icon: '➕', label: 'CREAR', href: '#', active: true },
  { icon: '📚', label: 'BIBLIOTECA', href: '/tv' },
  { icon: '💬', label: 'CREADOR IA', href: '/studio' },
  { icon: '👤', label: 'PERFIL VIP', href: '/perfil' },
]

export default function Home() {
  const [mode, setMode] = useState<'simple' | 'personalizado'>('simple')
  const [prompt, setPrompt] = useState('')
  const [selectedEmotion, setSelectedEmotion] = useState<string | null>(null)
  const [voice, setVoice] = useState('Leo Vela (Voz Masculina Terciopelo)')
  const [trackTab, setTrackTab] = useState<'todos' | 'favoritos'>('todos')
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [volume, setVolume] = useState(80)

  const filteredTracks = trackTab === 'favoritos' ? TRACKS.filter(t => t.liked) : TRACKS

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col">
      {/* ============ TOP NAV ============ */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#0d0d0d]/95 backdrop-blur-md border-b border-red-900/30">
        <div className="flex items-center justify-between px-4 h-14">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <Logo size="sm" />
            <div className="hidden md:block">
              <h1 className="text-sm font-outfit font-bold text-white leading-none">C8L Corazones Locos</h1>
              <p className="text-[9px] text-c8l-gold leading-none mt-0.5">Agency</p>
            </div>
          </div>

          {/* Center Nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {NAV_ITEMS.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center px-3 py-1 rounded-lg text-[10px] text-gray-400 hover:text-white hover:bg-white/5 transition"
              >
                <span className="text-sm">{item.icon}</span>
                <span className="font-medium mt-0.5">{item.label}</span>
              </Link>
            ))}
          </nav>

          {/* Right */}
          <div className="flex items-center gap-3">
            <CreditsDisplay showLabel />
            <div className="hidden sm:flex items-center gap-1 bg-gray-800/40 rounded-full px-2 py-1">
              <span className="text-[10px] text-red-400 font-bold">Reset</span>
              <span className="text-[10px] bg-c8l-gold text-black px-1.5 py-0.5 rounded font-bold">ES</span>
            </div>
            <button className="text-[10px] border border-gray-600 rounded-lg px-3 py-1.5 text-gray-300 hover:text-white hover:border-gray-400 transition font-medium">
              CERRAR SESION
            </button>
          </div>
        </div>
      </header>

      {/* ============ MAIN LAYOUT ============ */}
      <div className="flex pt-14 flex-1">
        {/* ============ SIDEBAR ============ */}
        <aside className="hidden lg:flex flex-col w-48 fixed left-0 top-14 bottom-0 bg-[#0d0d0d] border-r border-red-900/20 p-4">
          {/* Sidebar Logo */}
          <div className="flex items-center gap-3 mb-6">
            <Logo size="sm" />
            <div>
              <p className="text-xs font-bold text-white">C.8.L.</p>
              <p className="text-[9px] text-c8l-gold font-medium">MUSIC AI</p>
            </div>
          </div>

          {/* Nav Items */}
          <nav className="space-y-1 flex-1">
            {SIDEBAR_ITEMS.map(item => (
              <Link
                key={item.label}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition text-sm ${
                  item.active
                    ? 'bg-red-600 text-white font-bold'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <span>{item.icon}</span>
                <span className="text-xs font-medium">{item.label}</span>
              </Link>
            ))}
          </nav>

          {/* Indicator online */}
          <div className="flex items-center gap-2 mt-4 mb-4">
            <span className="w-2 h-2 rounded-full bg-green-500"></span>
            <span className="text-[10px] text-gray-500">Online</span>
          </div>

          {/* Back */}
          <Link href="/" className="flex items-center gap-2 text-xs text-gray-500 hover:text-white transition mt-2">
            <span>←</span> VOLVER A INICIO
          </Link>

          {/* Credits VIP */}
          <div className="mt-4 bg-[#1a1a1a] border border-red-900/30 rounded-xl p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] text-gray-400 font-medium">MIS CRÉDITOS</span>
              <CreditsDisplay />
            </div>
            <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
              <div className="h-full bg-c8l-gold rounded-full transition-all" style={{ width: '75%' }}></div>
            </div>
            <p className="text-[8px] text-gray-600 mt-1.5">COMPLETA TAREAS PARA GANAR MÁS</p>
          </div>
        </aside>

        {/* ============ MAIN CONTENT ============ */}
        <main className="flex-1 lg:ml-48 pb-24">
          <div className="max-w-7xl mx-auto p-4 md:p-6">
            <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-6">

              {/* ===== LEFT: STUDIO ===== */}
              <div>
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h1 className="text-2xl md:text-3xl font-outfit font-black text-white tracking-tight">MESA DE CREACION CUANTICA</h1>
                    <p className="text-xs text-gray-500 mt-1 tracking-widest uppercase">Estado: Conectado a la Red Procedimental</p>
                  </div>
                  <div className="hidden md:flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                      <span className="text-[10px] text-gray-400 font-mono">AUDIO ENGINE: ONLINE</span>
                    </div>
                    <div className="text-[10px] text-gray-400 font-mono flex items-center gap-1">
                      CREDITOS: <span className="text-c8l-gold font-bold">9999</span> <span>⚙️</span>
                    </div>
                  </div>
                </div>

                {/* Studio Panel */}
                <div className="bg-[#111111] border border-red-900/20 rounded-2xl p-6">
                  {/* Mode Toggle */}
                  <div className="flex gap-0 mb-6">
                    <button
                      onClick={() => setMode('simple')}
                      className={`px-6 py-2.5 rounded-lg text-xs font-bold transition ${
                        mode === 'simple'
                          ? 'bg-white text-black'
                          : 'bg-transparent text-gray-400 hover:text-white'
                      }`}
                    >
                      MODO SIMPLE
                    </button>
                    <button
                      onClick={() => setMode('personalizado')}
                      className={`px-6 py-2.5 rounded-lg text-xs font-bold transition ${
                        mode === 'personalizado'
                          ? 'bg-white text-black'
                          : 'bg-transparent text-gray-400 hover:text-white'
                      }`}
                    >
                      MODO PERSONALIZADO
                    </button>
                  </div>

                  {/* Prompt */}
                  <div className="mb-6">
                    <label className="text-[10px] text-gray-400 uppercase tracking-wider font-medium mb-2 block">
                      Descripcion de la Cancion / Prompt Emocional
                    </label>
                    <textarea
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder="Ej: Un tema de Synthwave energetico a 120bpm con bajos de neon y ambiente espacial..."
                      className="w-full bg-[#1a1a1a] border border-gray-800 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 outline-none focus:border-red-500/50 transition resize-none h-24"
                    />
                  </div>

                  {/* Emotions */}
                  <div className="mb-6">
                    <label className="text-[10px] text-gray-400 uppercase tracking-wider font-medium mb-3 block">
                      Emocion Predominante
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {EMOTIONS.map(emotion => (
                        <button
                          key={emotion.label}
                          onClick={() => setSelectedEmotion(emotion.label)}
                          className={`flex flex-col items-center gap-1 py-3 px-2 rounded-xl transition border ${
                            selectedEmotion === emotion.label
                              ? 'border-red-500 bg-red-500/10'
                              : 'border-gray-800 bg-[#1a1a1a] hover:border-gray-600'
                          }`}
                        >
                          <span className="text-xl">{emotion.emoji}</span>
                          <span className="text-[10px] text-gray-400">{emotion.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Voice Selection */}
                  <div className="mb-6">
                    <label className="text-[10px] text-gray-400 uppercase tracking-wider font-medium mb-2 block">
                      Voz del Cantante (AI Voice)
                    </label>
                    <select
                      value={voice}
                      onChange={(e) => setVoice(e.target.value)}
                      className="w-full bg-[#1a1a1a] border border-gray-800 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-red-500/50 transition appearance-none cursor-pointer"
                    >
                      <option>Leo Vela (Voz Masculina Terciopelo)</option>
                      <option>Reina Melody (Voz Femenina Crystal)</option>
                      <option>MC Fuego (Voz Urbana Raw)</option>
                      <option>Sin voz (Instrumental)</option>
                    </select>
                  </div>

                  {/* Generate Button */}
                  <button className="w-full py-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-sm uppercase tracking-wider transition hover:scale-[1.01] active:scale-[0.99]">
                    GENERAR 2 CANCIONES (10 CRÉDITOS)
                  </button>

                  <p className="text-[10px] text-gray-600 text-center mt-3 uppercase tracking-wider">
                    {/* Credits info */}
                    Completa tareas diarias para ganar créditos gratis
                  </p>
                </div>
              </div>

              {/* ===== RIGHT: TRACK LIST ===== */}
              <div>
                {/* Tabs */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex gap-4">
                    <button
                      onClick={() => setTrackTab('todos')}
                      className={`text-sm font-bold pb-1 transition border-b-2 ${
                        trackTab === 'todos'
                          ? 'text-white border-white'
                          : 'text-gray-500 border-transparent hover:text-gray-300'
                      }`}
                    >
                      TODOS
                    </button>
                    <button
                      onClick={() => setTrackTab('favoritos')}
                      className={`text-sm font-bold pb-1 transition border-b-2 ${
                        trackTab === 'favoritos'
                          ? 'text-white border-white'
                          : 'text-gray-500 border-transparent hover:text-gray-300'
                      }`}
                    >
                      FAVORITOS
                    </button>
                  </div>
                  <span className="text-[10px] text-gray-500">{filteredTracks.length} PISTAS DE SESION</span>
                </div>

                {/* Track Cards */}
                <div className="space-y-3">
                  {filteredTracks.map(track => (
                    <div
                      key={track.id}
                      className="bg-[#111111] border border-gray-800/50 rounded-xl p-4 flex items-center gap-3 hover:border-red-900/30 transition cursor-pointer group"
                    >
                      {/* Avatar */}
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-c8l-gold/30 to-amber-900/30 flex items-center justify-center flex-shrink-0 border border-c8l-gold/30">
                        <span className="text-[10px] font-black text-c8l-gold">C8L</span>
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-bold text-c8l-gold">{track.title}</h3>
                        <p className="text-[10px] text-gray-500">
                          {track.author} · <span className="text-red-400">{track.genre}</span>
                        </p>
                      </div>

                      {/* Right */}
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <span className="text-[10px] text-gray-600">{track.date}</span>
                        <span className={`text-xs ${track.liked ? 'text-red-400' : 'text-gray-600'}`}>
                          {track.liked ? '❤️' : '🤍'}
                        </span>
                        <span className="text-gray-600 text-xs">⋮</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* C8L Badge */}
                <div className="flex justify-center mt-6">
                  <Logo size="xl" />
                </div>
              </div>
            </div>
          </div>

          {/* ============ FOOTER ============ */}
          <footer className="mt-16 border-t border-gray-800/50 px-6 pt-12 pb-8 max-w-7xl mx-auto">
            <div className="grid md:grid-cols-3 gap-8 mb-10">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <Logo size="md" />
                  <h3 className="text-lg font-outfit font-black text-c8l-gold">C.8.L. AGENCY</h3>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">
                  El Salto Cuantico en la Creacion de Contenido. Unete a la Familia Corazones Locos y alcanza la soberania del mercado con calidad y lealtad inigualables.
                </p>
              </div>
              <div>
                <h4 className="text-sm font-bold text-white mb-3 uppercase">Navegacion</h4>
                <div className="space-y-2">
                  <a href="#" className="block text-xs text-gray-500 hover:text-white transition">La Mision</a>
                  <a href="#" className="block text-xs text-gray-500 hover:text-white transition">Inteligencia de Negocios</a>
                  <a href="/control" className="block text-xs text-gray-500 hover:text-white transition">Panel de Control</a>
                </div>
              </div>
              <div>
                <h4 className="text-sm font-bold text-white mb-3 uppercase">Conectar</h4>
                <div className="flex gap-3">
                  <span className="w-9 h-9 rounded-full bg-gray-800 flex items-center justify-center cursor-pointer hover:bg-purple-900/30 transition text-sm">🎮</span>
                  <span className="w-9 h-9 rounded-full bg-gray-800 flex items-center justify-center cursor-pointer hover:bg-red-900/30 transition text-sm">📺</span>
                  <span className="w-9 h-9 rounded-full bg-gray-800 flex items-center justify-center cursor-pointer hover:bg-blue-900/30 transition text-sm">🐦</span>
                  <span className="w-9 h-9 rounded-full bg-gray-800 flex items-center justify-center cursor-pointer hover:bg-pink-900/30 transition text-sm">📷</span>
                </div>
              </div>
            </div>
            <div className="border-t border-gray-800/50 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
              <p className="text-[10px] text-gray-600">
                &copy; 2026 C.8.L. Agency (Corazones Locos Family). Todos los derechos reservados.
              </p>
              <div className="flex gap-4">
                <a href="/legal" className="text-[10px] text-gray-600 hover:text-white transition">Politica de Privacidad (RGPD / LOPD)</a>
                <a href="/legal" className="text-[10px] text-gray-600 hover:text-white transition">Terminos de Servicio</a>
                <a href="/legal" className="text-[10px] text-gray-600 hover:text-white transition">Configuracion de Cookies</a>
              </div>
            </div>
          </footer>
        </main>
      </div>

      {/* ============ AUDIO PLAYER (BOTTOM) ============ */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#0d0d0d]/98 backdrop-blur-md border-t border-red-900/20">
        <div className="flex items-center gap-4 px-4 h-16 max-w-7xl mx-auto">
          {/* Track info */}
          <div className="flex items-center gap-3 min-w-[200px]">
            <div className="w-8 h-8 rounded bg-gradient-to-br from-red-900/50 to-purple-900/50 flex items-center justify-center text-xs">
              🎵
            </div>
            <div>
              <p className="text-xs font-bold text-white truncate">Bolero de Silicio</p>
              <p className="text-[9px] text-gray-500">House Espacial</p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex-1 flex flex-col items-center gap-1">
            <div className="flex items-center gap-4">
              <button className="text-gray-400 hover:text-white transition text-lg">⏮</button>
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="w-9 h-9 rounded-full bg-white flex items-center justify-center hover:scale-105 transition"
              >
                <span className="text-black text-sm">{isPlaying ? '⏸' : '▶'}</span>
              </button>
              <button className="text-gray-400 hover:text-white transition text-lg">⏭</button>
            </div>
            {/* Progress bar */}
            <div className="w-full max-w-md flex items-center gap-2">
              <span className="text-[9px] text-gray-600 font-mono">0:00</span>
              <div className="flex-1 h-1 bg-gray-800 rounded-full relative cursor-pointer group">
                <div className="h-full bg-red-500 rounded-full" style={{ width: `${progress}%` }}></div>
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-red-500 rounded-full opacity-0 group-hover:opacity-100 transition"
                  style={{ left: `${progress}%` }}
                ></div>
              </div>
              <span className="text-[9px] text-gray-600 font-mono">1:00</span>
            </div>
          </div>

          {/* Volume */}
          <div className="hidden sm:flex items-center gap-2 min-w-[120px]">
            <span className="text-gray-400 text-xs">🔊</span>
            <div className="flex-1 h-1 bg-gray-800 rounded-full relative cursor-pointer">
              <div className="h-full bg-red-500 rounded-full" style={{ width: `${volume}%` }}></div>
              <div
                className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-red-500 rounded-full"
                style={{ left: `${volume}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* ============ WIDGET BOT IA ============ */}
      <ChatWidget />
    </div>
  )
}
