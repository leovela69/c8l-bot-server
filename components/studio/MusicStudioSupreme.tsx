'use client'

import { useState, useRef } from 'react'

const GENRES = [
  { id: 'bolero-house', label: 'Bolero-House', bpm: 115, key: 'Am' },
  { id: 'jazz', label: 'Jazz', bpm: 90, key: 'Cm' },
  { id: 'flamenco', label: 'Flamenco', bpm: 120, key: 'Em' },
  { id: 'reggaeton', label: 'Reggaeton', bpm: 90, key: 'Dm' },
  { id: 'electronic', label: 'Electronica', bpm: 128, key: 'Fm' },
  { id: 'lofi', label: 'Lofi', bpm: 80, key: 'Am' },
  { id: 'rock', label: 'Rock', bpm: 140, key: 'Em' },
  { id: 'pop', label: 'Pop', bpm: 120, key: 'C' },
  { id: 'trap', label: 'Trap', bpm: 140, key: 'Cm' },
  { id: 'house', label: 'House', bpm: 124, key: 'Fm' },
  { id: 'techno', label: 'Techno', bpm: 135, key: 'Gm' },
  { id: 'classical', label: 'Clasica', bpm: 70, key: 'Am' },
]

const MOODS = [
  { id: 'feliz', label: 'Feliz', emoji: '😊' },
  { id: 'triste', label: 'Triste', emoji: '😢' },
  { id: 'energetico', label: 'Energetico', emoji: '⚡' },
  { id: 'relajado', label: 'Relajado', emoji: '😌' },
  { id: 'romantico', label: 'Romantico', emoji: '💕' },
  { id: 'oscuro', label: 'Oscuro', emoji: '🌙' },
  { id: 'epico', label: 'Epico', emoji: '⚔️' },
  { id: 'misterioso', label: 'Misterioso', emoji: '🔮' },
]

const INSTRUMENTS = ['ukulele','piano','guitar','drums','bass','synth','saxophone','violin','maracas','cajon','808','strings','brass','flute']

const REVERB_TYPES = ['none','small','medium','large','cathedral','spring','plate']
const DELAY_TYPES = ['none','analog','digital','pingpong']

type Tab = 'params' | 'effects' | 'visuals' | 'lyrics'

export default function MusicStudioSupreme() {
  const [prompt, setPrompt] = useState('')
  const [genre, setGenre] = useState('bolero-house')
  const [bpm, setBpm] = useState(115)
  const [key, setKey] = useState('Am')
  const [mood, setMood] = useState('feliz')
  const [structure, setStructure] = useState('verse-chorus-verse-chorus-bridge-chorus')
  const [instruments, setInstruments] = useState(['ukulele','piano','maracas'])
  const [activeTab, setActiveTab] = useState<Tab>('params')

  // Effects
  const [reverb, setReverb] = useState('medium')
  const [reverbMix, setReverbMix] = useState(30)
  const [delay, setDelay] = useState('digital')
  const [delayMix, setDelayMix] = useState(20)
  const [eqBass, setEqBass] = useState(2)
  const [eqMid, setEqMid] = useState(0)
  const [eqTreble, setEqTreble] = useState(-2)
  const [compThreshold, setCompThreshold] = useState(-24)
  const [compRatio, setCompRatio] = useState(4)

  // State
  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [song, setSong] = useState<any>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [viewMode, setViewMode] = useState<'waveform'|'spectrogram'|'3d'>('waveform')

  const toggleInstrument = (inst: string) => {
    setInstruments(prev => prev.includes(inst) ? prev.filter(i => i !== inst) : [...prev, inst])
  }

  const generate = () => {
    if (!prompt || isGenerating) return
    setIsGenerating(true)
    setProgress(0)
    setSong(null)

    const interval = setInterval(() => {
      setProgress(p => { if (p >= 98) { clearInterval(interval); return 98 } return p + 2 })
    }, 100)

    setTimeout(() => {
      clearInterval(interval)
      setProgress(100)
      setIsGenerating(false)
      setSong({
        title: prompt.slice(0, 50),
        duration: '3:42',
        waveform: Array.from({ length: 100 }, () => Math.random()),
        spectrogram: Array.from({ length: 40 }, () => Array.from({ length: 20 }, () => Math.random())),
        particles: Array.from({ length: 50 }, () => ({ x: Math.random()*100, y: Math.random()*100, size: 4+Math.random()*12 })),
        lyrics: `[Verso 1]\nEn la era digital, tu voz me encontro\nEntre bytes y senales, el amor desperto\nUn ritmo que late como corazon binario\nBolero-House nocturno, amor extraordinario\n\n[Coro]\nAmor digital, latido cuantico\nNuestro ritmo es fantastico\nEn la frecuencia del corazon\nC8L Agency, perfecta conexion\n\n[Verso 2]\nLas luces de neon iluminan tu cara\nEl beat sube y baja como ola que se aclara\nDiamantes en la pista de baile\nCorazones locos que nunca se callen\n\n[Puente]\nSube el volumen, que esta noche es nuestra\nLa musica nos une, la IA nos orquesta\n\n[Coro Final]\nAmor digital, latido cuantico\nNuestro ritmo es fantastico\nC8L por siempre, la familia es real\nCorazones locos, conexion eternal`,
      })
    }, 5000)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-outfit font-black neon-gold">🎵 ESTUDIO SUPREMO C8L</h2>
          <p className="text-sm text-gray-500">Crea musica con IA — Mas parametros que Suno</p>
        </div>
        <div className="glass px-4 py-2 rounded-lg text-sm">
          💰 <span className="text-c8l-gold font-bold">50 Coins</span> / cancion
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-800 pb-2">
        {([['params','🎛️ Parametros'],['effects','🔊 Efectos'],['visuals','🎨 Visual'],['lyrics','📝 Letra']] as [Tab,string][]).map(([id, label]) => (
          <button key={id} onClick={() => setActiveTab(id)}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition ${activeTab === id ? 'bg-c8l-gold text-black' : 'text-gray-400 hover:text-white'}`}>
            {label}
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* LEFT: Controls */}
        <div className="lg:col-span-2 space-y-4">
          {activeTab === 'params' && <>
            {/* Prompt */}
            <div className="glass rounded-xl p-4">
              <div className="flex justify-between mb-2">
                <label className="text-sm text-gray-400">✨ Describe tu cancion</label>
                <button className="text-xs text-c8l-gold">🤖 Asistente IA</button>
              </div>
              <textarea value={prompt} onChange={e => setPrompt(e.target.value)}
                placeholder="Ej: Cancion de amor Bolero-House con ukelele, voz suave y ritmo nocturno..."
                className="w-full bg-black/50 border border-gray-700 rounded-lg p-3 text-white placeholder-gray-500 focus:outline-none focus:border-c8l-gold h-24 resize-none" />
              <div className="flex gap-2 mt-2 flex-wrap">
                {['amor','fiesta','nostalgia','energia','playa','noche','tristeza','libertad'].map(t => (
                  <button key={t} onClick={() => setPrompt(p => p + ' ' + t)}
                    className="px-2 py-1 bg-gray-800 text-xs text-gray-400 rounded hover:bg-c8l-gold/20 hover:text-c8l-gold transition">#{t}</button>
                ))}
              </div>
            </div>

            {/* Genre + Key */}
            <div className="grid grid-cols-3 gap-3">
              <div className="glass rounded-xl p-3">
                <label className="text-xs text-gray-400 block mb-1">🎵 Genero</label>
                <select value={genre} onChange={e => { setGenre(e.target.value); const g = GENRES.find(x=>x.id===e.target.value); if(g){setBpm(g.bpm);setKey(g.key)} }}
                  className="w-full bg-black border border-gray-700 rounded-lg p-2 text-white text-sm">
                  {GENRES.map(g => <option key={g.id} value={g.id}>{g.label}</option>)}
                </select>
              </div>
              <div className="glass rounded-xl p-3">
                <label className="text-xs text-gray-400 block mb-1">🎹 Tonalidad</label>
                <select value={key} onChange={e => setKey(e.target.value)}
                  className="w-full bg-black border border-gray-700 rounded-lg p-2 text-white text-sm">
                  {['C','Cm','D','Dm','E','Em','F','Fm','G','Gm','A','Am','B','Bm'].map(k => <option key={k} value={k}>{k}</option>)}
                </select>
              </div>
              <div className="glass rounded-xl p-3">
                <label className="text-xs text-gray-400 block mb-1">😊 Mood</label>
                <select value={mood} onChange={e => setMood(e.target.value)}
                  className="w-full bg-black border border-gray-700 rounded-lg p-2 text-white text-sm">
                  {MOODS.map(m => <option key={m.id} value={m.id}>{m.emoji} {m.label}</option>)}
                </select>
              </div>
            </div>

            {/* BPM + Structure */}
            <div className="grid grid-cols-2 gap-3">
              <div className="glass rounded-xl p-3">
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>🎚️ BPM</span><span className="text-c8l-gold font-bold">{bpm}</span>
                </div>
                <input type="range" min={60} max={180} value={bpm} onChange={e => setBpm(Number(e.target.value))}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-amber-500" />
              </div>
              <div className="glass rounded-xl p-3">
                <label className="text-xs text-gray-400 block mb-1">📝 Estructura</label>
                <select value={structure} onChange={e => setStructure(e.target.value)}
                  className="w-full bg-black border border-gray-700 rounded-lg p-2 text-white text-xs">
                  <option value="verse-chorus-verse-chorus-bridge-chorus">V-C-V-C-Puente-C</option>
                  <option value="verse-verse-chorus-verse-chorus">V-V-C-V-C</option>
                  <option value="intro-verse-chorus-verse-chorus-outro">Intro-V-C-V-C-Outro</option>
                </select>
              </div>
            </div>

            {/* Instruments */}
            <div className="glass rounded-xl p-4">
              <label className="text-xs text-gray-400 mb-2 block">🎸 Instrumentos</label>
              <div className="flex flex-wrap gap-2">
                {INSTRUMENTS.map(inst => (
                  <button key={inst} onClick={() => toggleInstrument(inst)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                      instruments.includes(inst) ? 'bg-c8l-gold text-black' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>
                    {inst}
                  </button>
                ))}
              </div>
            </div>
          </>}

          {activeTab === 'effects' && <>
            <div className="glass rounded-xl p-4 space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-400">🎵 Reverb</span>
                  <select value={reverb} onChange={e => setReverb(e.target.value)}
                    className="bg-black border border-gray-700 rounded px-2 py-1 text-xs text-white">
                    {REVERB_TYPES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mb-1"><span>Mix</span><span className="text-c8l-gold">{reverbMix}%</span></div>
                <input type="range" min={0} max={100} value={reverbMix} onChange={e => setReverbMix(Number(e.target.value))}
                  className="w-full h-2 bg-gray-700 rounded appearance-none cursor-pointer accent-purple-500" />
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-400">⏳ Delay</span>
                  <select value={delay} onChange={e => setDelay(e.target.value)}
                    className="bg-black border border-gray-700 rounded px-2 py-1 text-xs text-white">
                    {DELAY_TYPES.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mb-1"><span>Mix</span><span className="text-c8l-gold">{delayMix}%</span></div>
                <input type="range" min={0} max={100} value={delayMix} onChange={e => setDelayMix(Number(e.target.value))}
                  className="w-full h-2 bg-gray-700 rounded appearance-none cursor-pointer accent-cyan-500" />
              </div>
            </div>
            <div className="glass rounded-xl p-4">
              <label className="text-sm text-gray-400 mb-3 block">🎚️ Ecualizador 3 bandas</label>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <div className="flex justify-between text-xs text-gray-500"><span>Graves</span><span className="text-c8l-gold">{eqBass>0?'+':''}{eqBass}</span></div>
                  <input type="range" min={-12} max={12} value={eqBass} onChange={e => setEqBass(Number(e.target.value))} className="w-full h-1.5 bg-gray-700 rounded appearance-none accent-amber-500" />
                </div>
                <div>
                  <div className="flex justify-between text-xs text-gray-500"><span>Medios</span><span className="text-c8l-gold">{eqMid>0?'+':''}{eqMid}</span></div>
                  <input type="range" min={-12} max={12} value={eqMid} onChange={e => setEqMid(Number(e.target.value))} className="w-full h-1.5 bg-gray-700 rounded appearance-none accent-purple-500" />
                </div>
                <div>
                  <div className="flex justify-between text-xs text-gray-500"><span>Agudos</span><span className="text-c8l-gold">{eqTreble>0?'+':''}{eqTreble}</span></div>
                  <input type="range" min={-12} max={12} value={eqTreble} onChange={e => setEqTreble(Number(e.target.value))} className="w-full h-1.5 bg-gray-700 rounded appearance-none accent-cyan-500" />
                </div>
              </div>
            </div>
            <div className="glass rounded-xl p-4">
              <label className="text-sm text-gray-400 mb-3 block">📊 Compresor</label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex justify-between text-xs text-gray-500"><span>Umbral</span><span className="text-c8l-gold">{compThreshold}dB</span></div>
                  <input type="range" min={-40} max={0} value={compThreshold} onChange={e => setCompThreshold(Number(e.target.value))} className="w-full h-1.5 bg-gray-700 rounded appearance-none accent-red-500" />
                </div>
                <div>
                  <div className="flex justify-between text-xs text-gray-500"><span>Ratio</span><span className="text-c8l-gold">{compRatio}:1</span></div>
                  <input type="range" min={1} max={20} value={compRatio} onChange={e => setCompRatio(Number(e.target.value))} className="w-full h-1.5 bg-gray-700 rounded appearance-none accent-orange-500" />
                </div>
              </div>
            </div>
          </>}

          {activeTab === 'visuals' && <>
            <div className="glass rounded-xl p-4">
              <div className="flex gap-2 mb-4">
                {(['waveform','spectrogram','3d'] as const).map(m => (
                  <button key={m} onClick={() => setViewMode(m)}
                    className={`px-4 py-2 rounded-lg text-sm font-bold ${viewMode===m ? 'bg-c8l-gold text-black' : 'bg-gray-800 text-gray-400'}`}>
                    {m==='waveform'?'🌊 Onda':m==='spectrogram'?'🌈 Espectro':'🎨 3D'}
                  </button>
                ))}
              </div>
              <div className="bg-black/50 h-56 rounded-lg border border-gray-800 overflow-hidden relative">
                {song && viewMode === 'waveform' && (
                  <div className="absolute inset-0 flex items-end px-2 pb-2">
                    {song.waveform.map((v: number, i: number) => (
                      <div key={i} className="flex-1 mx-px rounded-t bg-gradient-to-t from-c8l-gold to-c8l-pink"
                        style={{ height: `${v*80+10}%`, opacity: isPlaying ? 0.6+v*0.4 : 0.4 }} />
                    ))}
                  </div>
                )}
                {song && viewMode === 'spectrogram' && (
                  <div className="absolute inset-0 grid grid-cols-[repeat(40,1fr)] p-1 gap-px">
                    {song.spectrogram.map((col: number[], ci: number) => (
                      <div key={ci} className="flex flex-col gap-px">
                        {col.map((v: number, ri: number) => (
                          <div key={ri} className="flex-1 rounded-sm" style={{ background: `hsl(${280-v*280}, 80%, ${30+v*40}%)` }} />
                        ))}
                      </div>
                    ))}
                  </div>
                )}
                {song && viewMode === '3d' && (
                  <div className="absolute inset-0">
                    {song.particles.map((p: any, i: number) => (
                      <div key={i} className="absolute rounded-full animate-pulse"
                        style={{ left:`${p.x}%`, top:`${p.y}%`, width:`${p.size}px`, height:`${p.size}px`,
                          background:`hsl(${p.x*3.6+50},80%,60%)`, opacity: isPlaying?0.8:0.3 }} />
                    ))}
                  </div>
                )}
                {!song && <div className="absolute inset-0 flex items-center justify-center text-gray-500 text-sm">Genera una cancion</div>}
              </div>
            </div>
          </>}

          {activeTab === 'lyrics' && <>
            <div className="glass rounded-xl p-4">
              <div className="flex justify-between items-center mb-3">
                <h4 className="text-sm font-bold text-c8l-gold">📝 Editor de Letra</h4>
                <div className="flex gap-2">
                  <button className="px-3 py-1 bg-c8l-gold/20 text-c8l-gold text-xs rounded">🤖 Generar IA</button>
                  <button className="px-3 py-1 bg-purple-600/20 text-purple-400 text-xs rounded"># Rimas</button>
                </div>
              </div>
              {song?.lyrics ? (
                <textarea value={song.lyrics} onChange={e => setSong({...song, lyrics: e.target.value})}
                  className="w-full bg-black/50 border border-gray-700 rounded-lg p-4 text-white font-mono text-sm min-h-[300px] resize-none leading-relaxed focus:outline-none focus:border-c8l-gold" />
              ) : (
                <div className="text-center text-gray-500 py-12">Genera una cancion para ver la letra</div>
              )}
              {song?.lyrics && (
                <div className="mt-3">
                  <p className="text-xs text-gray-500 mb-2">💡 Sugerencias de rimas:</p>
                  <div className="flex gap-2 flex-wrap">
                    {['amor','corazon','pasion','cancion','ilusion','emocion','noche','derroche'].map(w => (
                      <button key={w} className="px-2 py-1 bg-gray-800 text-xs text-gray-400 rounded hover:bg-c8l-gold/20 hover:text-c8l-gold transition">{w}</button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>}
        </div>

        {/* RIGHT: Result */}
        <div className="space-y-4">
          <button onClick={generate} disabled={isGenerating || !prompt}
            className={`w-full py-4 rounded-xl font-outfit font-bold text-lg transition-all ${
              isGenerating ? 'bg-gray-700 text-gray-400' : 'bg-gradient-to-r from-c8l-gold to-c8l-pink text-black hover:scale-105'}`}>
            {isGenerating ? `🌀 Generando... ${Math.min(99,Math.round(progress))}%` : '⚡ Generar Cancion Suprema'}
          </button>

          {isGenerating && <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-c8l-gold to-c8l-pink transition-all" style={{width:`${progress}%`}} />
          </div>}

          {song && (
            <div className="glass rounded-xl p-4 border border-c8l-gold/30">
              <div className="flex justify-between items-center mb-3">
                <div>
                  <h3 className="font-bold text-sm">{song.title}</h3>
                  <p className="text-xs text-gray-500">{song.duration} | {GENRES.find(g=>g.id===genre)?.label} | {bpm} BPM | {key}</p>
                </div>
                <button onClick={() => setIsPlaying(!isPlaying)}
                  className="w-12 h-12 bg-c8l-gold/20 rounded-full flex items-center justify-center hover:bg-c8l-gold/40 text-xl border border-c8l-gold/30">
                  {isPlaying ? '⏸' : '▶️'}
                </button>
              </div>
              <div className="h-12 flex items-end gap-px mb-3">
                {song.waveform.slice(0,80).map((v:number,i:number) => (
                  <div key={i} className="flex-1 rounded-t bg-gradient-to-t from-c8l-gold to-c8l-pink"
                    style={{height:`${v*80+10}%`, opacity:isPlaying?0.7+v*0.3:0.4}} />
                ))}
              </div>
              <div className="grid grid-cols-3 gap-2">
                <button className="py-2 bg-green-600/20 text-green-400 text-xs font-bold rounded hover:bg-green-600/30">💾 Guardar</button>
                <button className="py-2 bg-blue-600/20 text-blue-400 text-xs font-bold rounded hover:bg-blue-600/30">📥 Descargar</button>
                <button className="py-2 bg-purple-600/20 text-purple-400 text-xs font-bold rounded hover:bg-purple-600/30">📺 Publicar</button>
              </div>
              <div className="flex gap-2 mt-3">
                <button className="flex-1 py-1.5 bg-gray-800 text-gray-400 text-xs font-bold rounded hover:bg-c8l-gold/20 hover:text-c8l-gold">🔀 Remix</button>
                <button className="flex-1 py-1.5 bg-gray-800 text-gray-400 text-xs font-bold rounded hover:bg-purple-600/20 hover:text-purple-400">👥 Colaborar</button>
              </div>
            </div>
          )}

          {/* Ranking */}
          <div className="glass rounded-xl p-4">
            <h4 className="text-xs font-bold text-gray-400 mb-3">🏆 Ranking Estudio C8L</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span>🥇 Leo Vela</span><span className="text-c8l-gold">2,450 pts</span></div>
              <div className="flex justify-between"><span>🥈 DJ_Quantum</span><span className="text-gray-400">1,890 pts</span></div>
              <div className="flex justify-between"><span>🥉 NeonGirl</span><span className="text-gray-400">1,560 pts</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
