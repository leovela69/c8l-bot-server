'use client'

import { useState } from 'react'
import Link from 'next/link'
import LegalFooter from '@/components/legal/LegalFooter'

const GENRES = [
  { id: 'bolero-house', label: '🎵 Bolero-House', bpm: 115 },
  { id: 'jazz', label: '🎷 Jazz', bpm: 90 },
  { id: 'flamenco', label: '🎸 Flamenco', bpm: 120 },
  { id: 'reggaeton', label: '🎶 Reggaeton', bpm: 90 },
  { id: 'electronic', label: '🕺 Electronica', bpm: 128 },
  { id: 'lofi', label: '🎧 Lofi', bpm: 80 },
  { id: 'rock', label: '🎸 Rock', bpm: 140 },
  { id: 'pop', label: '🎤 Pop', bpm: 120 },
]

const MOODS = [
  { id: 'feliz', label: '😊 Feliz' },
  { id: 'triste', label: '😢 Triste' },
  { id: 'energetico', label: '⚡ Energetico' },
  { id: 'relajado', label: '😌 Relajado' },
  { id: 'romantico', label: '💕 Romantico' },
  { id: 'oscuro', label: '🌙 Oscuro' },
]

export default function StudioPage() {
  const [prompt, setPrompt] = useState('')
  const [genre, setGenre] = useState('bolero-house')
  const [mood, setMood] = useState('feliz')
  const [bpm, setBpm] = useState(115)
  const [reverb, setReverb] = useState(30)
  const [delay, setDelay] = useState(20)
  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [song, setSong] = useState<any>(null)
  const [isPlaying, setIsPlaying] = useState(false)

  const generate = () => {
    if (!prompt) return
    setIsGenerating(true)
    setProgress(0)
    setSong(null)

    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 100) { clearInterval(interval); return 100 }
        return p + Math.random() * 12
      })
    }, 400)

    setTimeout(() => {
      clearInterval(interval)
      setProgress(100)
      setIsGenerating(false)
      setSong({
        title: prompt.slice(0, 40) || 'Mi Cancion C8L',
        duration: '3:42',
        waveform: Array.from({ length: 60 }, () => Math.random()),
        lyrics: `[Verso 1]\nEn la era digital, tu voz me encontro\nEntre bytes y senales, el amor desperto\nUn ritmo que late como corazon binario\nBolero-House nocturno, amor extraordinario\n\n[Coro]\nAmor digital, latido cuantico\nBolero-House, ritmo fantastico\nTu y yo en la frecuencia perfecta\nC8L Agency, conexion directa\n\n[Verso 2]\nLas luces de neon iluminan tu cara\nEl beat sube y baja como ola que se aclara\nDiamantes en la pista de baile\nCorazones locos que nunca se callen`,
      })
    }, 5000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-c8l-black via-purple-950/20 to-c8l-black">
      <header className="glass border-b border-c8l-gold/20 p-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-2xl font-outfit font-bold text-c8l-gold">C8L</Link>
            <span className="text-gray-500">|</span>
            <h1 className="text-xl font-outfit font-semibold">🎵 Estudio</h1>
          </div>
          <div className="glass px-3 py-1.5 rounded-lg text-xs">
            💰 <span className="text-c8l-gold font-bold">50 Coins</span> por cancion
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6">
        <div className="text-center mb-8">
          <h2 className="text-4xl font-outfit font-bold neon-gold mb-2">🎵 Estudio C8L</h2>
          <p className="text-gray-400">Crea musica con IA. Describe tu cancion y deja que la magia ocurra.</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left: Controls */}
          <div className="lg:col-span-2 space-y-4">
            {/* Prompt */}
            <div className="glass rounded-xl p-4">
              <label className="text-sm text-gray-400 flex items-center gap-2 mb-2">
                ✨ Describe tu cancion
              </label>
              <textarea
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                placeholder="Ej: Una cancion de amor con ritmo Bolero-House, ukelele y voz suave..."
                className="w-full bg-black/50 border border-gray-700 rounded-lg p-3 text-white placeholder-gray-500 focus:outline-none focus:border-c8l-gold h-24 resize-none"
              />
              <div className="flex gap-2 mt-2 flex-wrap">
                {['amor', 'fiesta', 'nostalgia', 'energia', 'playa', 'noche'].map(tag => (
                  <button key={tag} onClick={() => setPrompt(p => p + ' ' + tag)}
                    className="px-2 py-1 bg-gray-800 text-xs text-gray-400 rounded hover:bg-c8l-gold/20 hover:text-c8l-gold transition">
                    #{tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Genre + Mood */}
            <div className="grid grid-cols-2 gap-4">
              <div className="glass rounded-xl p-4">
                <label className="text-xs text-gray-400 mb-2 block">🎵 Genero</label>
                <select value={genre} onChange={e => { setGenre(e.target.value); setBpm(GENRES.find(g => g.id === e.target.value)?.bpm || 115) }}
                  className="w-full bg-black border border-gray-700 rounded-lg p-2 text-white text-sm">
                  {GENRES.map(g => <option key={g.id} value={g.id}>{g.label}</option>)}
                </select>
              </div>
              <div className="glass rounded-xl p-4">
                <label className="text-xs text-gray-400 mb-2 block">😊 Mood</label>
                <select value={mood} onChange={e => setMood(e.target.value)}
                  className="w-full bg-black border border-gray-700 rounded-lg p-2 text-white text-sm">
                  {MOODS.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
                </select>
              </div>
            </div>

            {/* BPM Slider */}
            <div className="glass rounded-xl p-4">
              <div className="flex justify-between text-xs text-gray-400 mb-2">
                <span>🎚️ Tempo (BPM)</span>
                <span className="text-c8l-gold font-bold">{bpm}</span>
              </div>
              <input type="range" min={60} max={180} value={bpm}
                onChange={e => setBpm(Number(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-amber-500" />
            </div>

            {/* Effects (Advanced) */}
            <div className="glass rounded-xl p-4">
              <details>
                <summary className="text-sm text-gray-400 cursor-pointer hover:text-white">
                  🎛️ Efectos de Audio (Avanzado)
                </summary>
                <div className="mt-4 space-y-3">
                  <div>
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>Reverb</span><span className="text-c8l-gold">{reverb}%</span>
                    </div>
                    <input type="range" min={0} max={100} value={reverb}
                      onChange={e => setReverb(Number(e.target.value))}
                      className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500" />
                  </div>
                  <div>
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>Delay</span><span className="text-c8l-gold">{delay}%</span>
                    </div>
                    <input type="range" min={0} max={100} value={delay}
                      onChange={e => setDelay(Number(e.target.value))}
                      className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-500" />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div><div className="text-[10px] text-gray-500 mb-1">Graves</div>
                      <input type="range" min={-12} max={12} defaultValue={2} className="w-full h-1 bg-gray-700 rounded appearance-none" /></div>
                    <div><div className="text-[10px] text-gray-500 mb-1">Medios</div>
                      <input type="range" min={-12} max={12} defaultValue={0} className="w-full h-1 bg-gray-700 rounded appearance-none" /></div>
                    <div><div className="text-[10px] text-gray-500 mb-1">Agudos</div>
                      <input type="range" min={-12} max={12} defaultValue={-2} className="w-full h-1 bg-gray-700 rounded appearance-none" /></div>
                  </div>
                </div>
              </details>
            </div>
          </div>

          {/* Right: Result */}
          <div className="space-y-4">
            {/* Generate button */}
            <button onClick={generate} disabled={isGenerating || !prompt}
              className={`w-full py-4 rounded-xl font-outfit font-bold text-lg transition-all ${
                isGenerating ? 'bg-gray-700 text-gray-400' :
                'bg-gradient-to-r from-c8l-gold to-c8l-pink text-black hover:scale-105'
              }`}>
              {isGenerating ? `🌀 Generando... ${Math.min(99, Math.round(progress))}%` : '🎵 Generar Cancion'}
            </button>

            {isGenerating && (
              <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-c8l-gold to-c8l-pink transition-all" style={{ width: `${progress}%` }} />
              </div>
            )}

            {/* Song result */}
            {song && (
              <>
                <div className="glass rounded-xl p-4 border border-c8l-gold/30">
                  <div className="flex justify-between items-center mb-3">
                    <div>
                      <h3 className="font-bold">{song.title}</h3>
                      <p className="text-xs text-gray-500">{song.duration} • {GENRES.find(g => g.id === genre)?.label}</p>
                    </div>
                    <button onClick={() => setIsPlaying(!isPlaying)}
                      className="w-12 h-12 bg-c8l-gold/20 rounded-full flex items-center justify-center hover:bg-c8l-gold/40 transition text-xl">
                      {isPlaying ? '⏸' : '▶️'}
                    </button>
                  </div>

                  {/* Waveform */}
                  <div className="h-16 flex items-end gap-0.5 mb-3">
                    {song.waveform.map((v: number, i: number) => (
                      <div key={i}
                        className="flex-1 rounded-t bg-gradient-to-t from-c8l-gold to-c8l-pink transition-all"
                        style={{ height: `${v * 80 + 10}%`, opacity: isPlaying ? 0.6 + v * 0.4 : 0.4 }} />
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="grid grid-cols-3 gap-2">
                    <button className="py-2 bg-green-600/20 text-green-400 text-xs font-bold rounded hover:bg-green-600/30">
                      💾 Guardar
                    </button>
                    <button className="py-2 bg-blue-600/20 text-blue-400 text-xs font-bold rounded hover:bg-blue-600/30">
                      📥 Descargar
                    </button>
                    <button className="py-2 bg-purple-600/20 text-purple-400 text-xs font-bold rounded hover:bg-purple-600/30">
                      📺 Publicar
                    </button>
                  </div>
                </div>

                {/* Lyrics */}
                <div className="glass rounded-xl p-4">
                  <h4 className="text-xs font-bold text-gray-400 mb-2">📝 Letra generada</h4>
                  <pre className="text-sm text-gray-300 whitespace-pre-wrap font-mono leading-relaxed max-h-60 overflow-y-auto">
                    {song.lyrics}
                  </pre>
                </div>
              </>
            )}

            {/* History placeholder */}
            {!song && !isGenerating && (
              <div className="glass rounded-xl p-6 text-center">
                <div className="text-4xl mb-3">🎵</div>
                <p className="text-gray-500 text-sm">Tus canciones apareceran aqui</p>
              </div>
            )}
          </div>
        </div>
      </main>

      <LegalFooter onOpenModal={() => {}} />
    </div>
  )
}
