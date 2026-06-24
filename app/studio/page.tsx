'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Providers } from '../providers'
import { useAuth } from '@/lib/auth/context'
import AgeGate from '@/components/auth/AgeGate'
import AppShell from '@/components/layout/AppShell'

const TOOLS = [
  { id: 'generator', icon: '🎵', name: 'Generador de Beats', desc: 'Crea beats originales con IA', status: 'ready' },
  { id: 'lyrics', icon: '✍️', name: 'Escritor de Letras', desc: 'Genera letras con IA en tu estilo', status: 'ready' },
  { id: 'mixer', icon: '🎛️', name: 'Auto-Mix', desc: 'Mezcla automática profesional', status: 'ready' },
  { id: 'mastering', icon: '💎', name: 'Mastering IA', desc: 'Masteriza tu track al instante', status: 'ready' },
  { id: 'vocals', icon: '🎤', name: 'Vocal Synth', desc: 'Genera voces con IA', status: 'beta' },
  { id: 'samples', icon: '🥁', name: 'Sample Finder', desc: 'Encuentra samples perfectos', status: 'ready' },
  { id: 'chords', icon: '🎹', name: 'Progresión de Acordes', desc: 'Sugiere progresiones', status: 'ready' },
  { id: 'stems', icon: '🔀', name: 'Separador de Stems', desc: 'Separa vocals, drums, bass', status: 'beta' },
]

const GENRES = ['Bolero-House', 'Deep House', 'Acid House', 'Lo-Fi', 'Trap', 'Reggaeton', 'Techno', 'Ambient', 'Bachata Fusion', 'Hip-Hop']
const MOODS = ['Energético', 'Melancólico', 'Romántico', 'Agresivo', 'Chill', 'Épico', 'Misterioso', 'Feliz']

function StudioContent() {
  const { isAgeVerified, isLoading } = useAuth()
  const [activeTool, setActiveTool] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)
  const [selectedGenre, setSelectedGenre] = useState('Bolero-House')
  const [selectedMood, setSelectedMood] = useState('Energético')
  const [bpm, setBpm] = useState(118)
  const [prompt, setPrompt] = useState('')
  const [generatedTrack, setGeneratedTrack] = useState<null | { name: string; duration: string; bpm: number }>(null)

  if (isLoading) return <div className="min-h-screen bg-[#0A0A0A]" />
  if (!isAgeVerified) return <AgeGate />

  const handleGenerate = () => {
    setGenerating(true)
    setTimeout(() => {
      setGenerating(false)
      setGeneratedTrack({
        name: `${selectedGenre} - ${selectedMood} (${bpm} BPM)`,
        duration: '3:45',
        bpm: bpm
      })
    }, 3000)
  }

  return (
    <AppShell>
      <div className="p-4 md:p-6 pb-20 lg:pb-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-outfit font-bold text-white flex items-center gap-2">
              <span>🤖</span> Estudio IA
            </h1>
            <p className="text-sm text-gray-400 mt-1">Crea música profesional con inteligencia artificial</p>
          </div>
          <div className="hidden sm:flex items-center gap-2 bg-green-500/10 border border-green-500/30 rounded-full px-3 py-1.5">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[10px] text-green-400 font-bold">IA ACTIVA</span>
          </div>
        </div>

        {/* Tools Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-8">
          {TOOLS.map((tool, i) => (
            <motion.button
              key={tool.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              onClick={() => setActiveTool(activeTool === tool.id ? null : tool.id)}
              className={`relative glass rounded-xl p-4 text-left transition hover:border-c8l-cyan/30 ${
                activeTool === tool.id ? 'border-c8l-cyan ring-1 ring-c8l-cyan/30' : ''
              }`}
            >
              {tool.status === 'beta' && (
                <span className="absolute top-2 right-2 text-[8px] bg-orange-500/20 text-orange-400 px-1.5 py-0.5 rounded-full font-bold">
                  BETA
                </span>
              )}
              <span className="text-2xl">{tool.icon}</span>
              <h3 className="text-xs font-bold text-white mt-2">{tool.name}</h3>
              <p className="text-[10px] text-gray-500 mt-0.5">{tool.desc}</p>
            </motion.button>
          ))}
        </div>

        {/* Main Generator Panel */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-6 mb-8"
        >
          <h2 className="text-lg font-outfit font-bold text-white mb-4 flex items-center gap-2">
            <span>🎵</span> Generador de Música IA
          </h2>

          {/* Genre Selection */}
          <div className="mb-4">
            <label className="text-xs text-gray-400 mb-2 block">Género</label>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {GENRES.map(genre => (
                <button
                  key={genre}
                  onClick={() => setSelectedGenre(genre)}
                  className={`px-3 py-1.5 rounded-full text-[11px] font-medium whitespace-nowrap transition border ${
                    selectedGenre === genre
                      ? 'bg-c8l-purple text-white border-c8l-purple'
                      : 'text-gray-400 border-gray-700 hover:border-gray-500'
                  }`}
                >
                  {genre}
                </button>
              ))}
            </div>
          </div>

          {/* Mood Selection */}
          <div className="mb-4">
            <label className="text-xs text-gray-400 mb-2 block">Mood / Ambiente</label>
            <div className="flex gap-2 flex-wrap">
              {MOODS.map(mood => (
                <button
                  key={mood}
                  onClick={() => setSelectedMood(mood)}
                  className={`px-3 py-1.5 rounded-full text-[11px] font-medium transition border ${
                    selectedMood === mood
                      ? 'bg-c8l-pink text-white border-c8l-pink'
                      : 'text-gray-400 border-gray-700 hover:border-gray-500'
                  }`}
                >
                  {mood}
                </button>
              ))}
            </div>
          </div>

          {/* BPM Slider */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-gray-400">BPM (Tempo)</label>
              <span className="text-xs text-c8l-cyan font-bold">{bpm} BPM</span>
            </div>
            <input
              type="range"
              min="60"
              max="180"
              value={bpm}
              onChange={(e) => setBpm(Number(e.target.value))}
              className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-c8l-cyan"
            />
            <div className="flex justify-between text-[9px] text-gray-600 mt-1">
              <span>60</span>
              <span>90</span>
              <span>120</span>
              <span>150</span>
              <span>180</span>
            </div>
          </div>

          {/* Custom Prompt */}
          <div className="mb-6">
            <label className="text-xs text-gray-400 mb-2 block">Descripción (opcional)</label>
            <textarea
              placeholder="Ej: Un beat con guitarra acústica de bolero, bajo profundo de house, y pad atmospheric..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full bg-gray-900/80 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 outline-none focus:border-c8l-cyan transition resize-none h-20"
            />
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="w-full py-4 bg-gradient-to-r from-c8l-purple via-c8l-pink to-c8l-gold rounded-xl font-bold text-lg hover:scale-[1.01] active:scale-[0.99] transition-transform disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {generating ? (
              <>
                <motion.span
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="inline-block"
                >
                  ⚙️
                </motion.span>
                Generando... (esto toma unos segundos)
              </>
            ) : (
              <>🚀 Generar Track con IA</>
            )}
          </button>
        </motion.div>

        {/* Generated Track Result */}
        <AnimatePresence>
          {generatedTrack && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20 }}
              className="glass rounded-2xl p-6 mb-8 border border-green-500/30"
            >
              <div className="flex items-center gap-2 mb-4">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-xs text-green-400 font-bold">TRACK GENERADO</span>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-c8l-purple to-c8l-gold flex items-center justify-center">
                  <span className="text-2xl">🎵</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-white">{generatedTrack.name}</h3>
                  <p className="text-[11px] text-gray-400">Duración: {generatedTrack.duration} • {generatedTrack.bpm} BPM</p>
                </div>
                <div className="flex gap-2">
                  <button className="bg-c8l-cyan text-black text-xs font-bold px-4 py-2 rounded-full">
                    ▶ Play
                  </button>
                  <button className="bg-gray-700 text-white text-xs px-3 py-2 rounded-full">
                    💾
                  </button>
                </div>
              </div>

              {/* Waveform placeholder */}
              <div className="mt-4 h-12 bg-gray-900/50 rounded-lg flex items-center justify-center overflow-hidden">
                <div className="flex items-end gap-0.5 h-8">
                  {Array.from({ length: 60 }, (_, i) => (
                    <motion.div
                      key={i}
                      initial={{ height: 4 }}
                      animate={{ height: Math.random() * 28 + 4 }}
                      transition={{ duration: 0.5, delay: i * 0.02 }}
                      className="w-1 bg-gradient-to-t from-c8l-purple to-c8l-cyan rounded-full"
                    />
                  ))}
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                <button className="flex-1 py-2 bg-gray-700 rounded-lg text-xs font-bold hover:bg-gray-600 transition">
                  📥 Descargar WAV
                </button>
                <button className="flex-1 py-2 bg-gray-700 rounded-lg text-xs font-bold hover:bg-gray-600 transition">
                  📤 Compartir
                </button>
                <button className="flex-1 py-2 bg-c8l-purple rounded-lg text-xs font-bold hover:bg-c8l-purple/80 transition">
                  🔄 Regenerar
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Recent Creations */}
        <div>
          <h2 className="text-lg font-outfit font-bold text-white flex items-center gap-2 mb-4">
            <span>📂</span> Tus Creaciones Recientes
          </h2>
          <div className="space-y-2">
            {[
              { name: 'Neon Bolero Mix', genre: 'Bolero-House', bpm: 115, date: 'Hoy 12:30' },
              { name: 'Acid Dreams', genre: 'Acid House', bpm: 130, date: 'Ayer 22:00' },
              { name: 'Sunset Vibes', genre: 'Deep House', bpm: 122, date: 'Hace 2 días' },
              { name: 'Urban Bachata', genre: 'Bachata Fusion', bpm: 100, date: 'Hace 3 días' },
            ].map((track, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="glass rounded-xl p-3 flex items-center gap-3 hover:border-c8l-purple/30 transition cursor-pointer"
              >
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-c8l-purple/30 to-c8l-pink/30 flex items-center justify-center">
                  <span>🎵</span>
                </div>
                <div className="flex-1">
                  <h4 className="text-xs font-bold text-white">{track.name}</h4>
                  <p className="text-[10px] text-gray-500">{track.genre} • {track.bpm} BPM</p>
                </div>
                <span className="text-[10px] text-gray-600">{track.date}</span>
                <button className="text-gray-400 hover:text-white transition">▶</button>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  )
}

export default function StudioPage() {
  return <Providers><StudioContent /></Providers>
}
