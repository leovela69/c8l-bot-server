'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import Logo from '@/components/ui/Logo'
import CreditsDisplay from '@/components/ui/CreditsDisplay'

// ============ SUNO API CONFIG ============
const SUNO_API_BASE = process.env.NEXT_PUBLIC_SUNO_API_URL || 'https://economies-tube-angel-gentle.trycloudflare.com'

// ============ SIDEBAR ITEMS ============
const SIDEBAR_ITEMS = [
  { icon: '🏠', label: 'Inicio', href: '/' },
  { icon: '🔍', label: 'Explorar', href: '/tv' },
  { icon: '✨', label: 'Crear', href: '/studio', active: true },
  { icon: '🎹', label: 'Estudio', href: '/studio' },
  { icon: '📚', label: 'Biblioteca', href: '/studio' },
  { icon: '🎣', label: 'Ganchos', href: '/studio' },
  { icon: '🔔', label: 'Notificaciones', href: '/perfil' },
]


// ============ TRACK TYPE ============
interface Track {
  id: string | number
  title: string
  version: string
  style: string
  thumbnail: string
  playing: boolean
  audio_url?: string
  duration?: number
  lyrics?: string
}

// ============ INITIAL SAMPLE TRACKS ============
const SAMPLE_TRACKS: Track[] = [
  { id: 1, title: 'Basura Completa', version: 'v5.5', style: 'reggaeton de alta energia, reggae, fusion flam...', thumbnail: 'https://images.unsplash.com/photo-1571330735066-03aaa9429d89?w=400&h=400&fit=crop', playing: false },
  { id: 2, title: 'MENTIROSA - Leo Vela', version: 'v5.5', style: 'reggaeton flamenco, bolero house, 140 BPM, g...', thumbnail: 'https://images.unsplash.com/photo-1571266028243-e4733b0f0bb0?w=400&h=400&fit=crop', playing: false },
  { id: 3, title: 'Neon Bolero Mix', version: 'v5.5', style: 'bolero house, deep bass, neon vibes, 122 BPM...', thumbnail: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop', playing: false },
]


export default function StudioPage() {
  const [mode, setMode] = useState<'sencillo' | 'avanzado'>('avanzado')
  const [tab, setTab] = useState<'musica' | 'videoclip'>('musica')
  const [title, setTitle] = useState('MENTIROSA')
  const [lyrics, setLyrics] = useState('[Final Chorus]\n[Maximum Tribal-Gospel Groove, full explosion of electronic bass, scratching, and heavy beat]\n¡Mentirosa! ¡No eres víctima, eres mentirosa!\nTu boca me juraba, pero tus dedos te delataban,')
  const [styles, setStyles] = useState('high energy reggaeton reggae flamenco fusion, tribal rhythm, romantic acoustic ukulele strumming, elegant emotional piano chords, crisp flamenco DJ palmas, powerful gospel vocal harmonies in background, hip hop dj scratch effects')
  const [videoPrompt, setVideoPrompt] = useState('')
  const [videoStyle, setVideoStyle] = useState('cinematic')
  const [generating, setGenerating] = useState(false)
  const [genStatus, setGenStatus] = useState('')
  const [genError, setGenError] = useState('')
  const [tracks, setTracks] = useState<Track[]>(SAMPLE_TRACKS)
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // --- NEW: Advanced features state ---
  const [activePanel, setActivePanel] = useState<'create' | 'extend' | 'remix' | 'lyrics' | 'stems' | 'library'>('create')
  const [extendId, setExtendId] = useState('')
  const [extendAt, setExtendAt] = useState('')
  const [extendLyrics, setExtendLyrics] = useState('')
  const [remixId, setRemixId] = useState('')
  const [remixTags, setRemixTags] = useState('')
  const [lyricsPrompt, setLyricsPrompt] = useState('')
  const [generatedLyrics, setGeneratedLyrics] = useState('')
  const [stemsId, setStemsId] = useState('')
  const [libraryTracks, setLibraryTracks] = useState<Track[]>([])
  const [creditsInfo, setCreditsInfo] = useState<any>(null)
  const [model, setModel] = useState('chirp-v4')


  // --- Load credits on mount ---
  useEffect(() => {
    fetch(`${SUNO_API_BASE}/api/suno/credits`, { method: 'POST' })
      .then(r => r.json())
      .then(d => { if (d.success !== false) setCreditsInfo(d) })
      .catch(() => {})
  }, [])

  // --- Audio Player Logic ---
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime)
      if (audio.duration) setProgress((audio.currentTime / audio.duration) * 100)
    }
    const onLoadedMetadata = () => setDuration(audio.duration)
    const onEnded = () => { setIsPlaying(false); setProgress(0) }
    audio.addEventListener('timeupdate', onTimeUpdate)
    audio.addEventListener('loadedmetadata', onLoadedMetadata)
    audio.addEventListener('ended', onEnded)
    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate)
      audio.removeEventListener('loadedmetadata', onLoadedMetadata)
      audio.removeEventListener('ended', onEnded)
    }
  }, [currentTrack])

  const playTrack = (track: Track) => {
    if (!track.audio_url) return
    setCurrentTrack(track)
    setIsPlaying(true)
    setTimeout(() => {
      if (audioRef.current) {
        audioRef.current.src = track.audio_url!
        audioRef.current.play().catch(() => {})
      }
    }, 100)
  }

  const togglePlay = () => {
    if (!audioRef.current) return
    if (isPlaying) { audioRef.current.pause() } else { audioRef.current.play().catch(() => {}) }
    setIsPlaying(!isPlaying)
  }

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60)
    const s = Math.floor(secs % 60)
    return `${m}:${s.toString().padStart(2, '0')}`
  }


  // --- SUNO: Generate Music ---
  const handleCreate = async () => {
    setGenerating(true)
    setGenStatus('Enviando a Suno AI...')
    setGenError('')
    try {
      const isCustom = mode === 'avanzado'
      const body = isCustom
        ? { mode: 'custom', prompt: lyrics, title, tags: styles, instrumental: false }
        : { mode: 'simple', prompt: styles, instrumental: false }

      const response = await fetch(`${SUNO_API_BASE}/api/suno/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await response.json()
      if (!data.success) throw new Error(data.error || 'Error desconocido de Suno')

      setGenStatus(`✅ ${data.count} canciones generadas!`)
      const newTracks: Track[] = data.tracks.map((t: any) => ({
        id: t.id, title: t.title || title || 'C8L Creation', version: 'Suno',
        style: t.tags || styles.slice(0, 50) + '...', playing: false,
        thumbnail: t.image_url || t.image_large_url || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop',
        audio_url: t.audio_url, duration: t.duration, lyrics: t.lyrics,
      }))
      setTracks([...newTracks, ...tracks])
      if (newTracks[0]?.audio_url) playTrack(newTracks[0])
    } catch (err: any) {
      const msg = err.message || 'Error de conexion'
      setGenError(msg.includes('TOKEN_EXPIRED') || msg.includes('401') ? '⚠️ Cookie de Suno expirada. El bot la renovara automaticamente.' : msg)
      setGenStatus('')
    } finally {
      setGenerating(false)
      setTimeout(() => setGenStatus(''), 5000)
    }
  }

  // --- SUNO: Extend Track ---
  const handleExtend = async () => {
    if (!extendId) { setGenError('Selecciona un track para extender'); return }
    setGenerating(true)
    setGenStatus('Extendiendo track...')
    setGenError('')
    try {
      const response = await fetch(`${SUNO_API_BASE}/api/suno/extend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audio_id: extendId,
          prompt: extendLyrics,
          continue_at: extendAt ? parseFloat(extendAt) : null,
          tags: styles,
        }),
      })
      const data = await response.json()
      if (!data.success) throw new Error(data.error)
      setGenStatus(`✅ Extension creada! ${data.count} clips`)
      const newTracks: Track[] = data.tracks.map((t: any) => ({
        id: t.id, title: t.title || 'Extension', version: 'Ext',
        style: t.tags || '', playing: false, audio_url: t.audio_url,
        thumbnail: t.image_url || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop',
        duration: t.duration,
      }))
      setTracks([...newTracks, ...tracks])
      if (newTracks[0]?.audio_url) playTrack(newTracks[0])
    } catch (err: any) { setGenError(err.message); setGenStatus('') }
    finally { setGenerating(false); setTimeout(() => setGenStatus(''), 5000) }
  }

  // --- SUNO: Remix Track ---
  const handleRemix = async () => {
    if (!remixId) { setGenError('Selecciona un track para remix'); return }
    setGenerating(true)
    setGenStatus('Remixando...')
    setGenError('')
    try {
      const response = await fetch(`${SUNO_API_BASE}/api/suno/remix`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audio_id: remixId, tags: remixTags, prompt: '', title: '' }),
      })
      const data = await response.json()
      if (!data.success) throw new Error(data.error)
      setGenStatus(`✅ Remix creado! ${data.count} versiones`)
      const newTracks: Track[] = data.tracks.map((t: any) => ({
        id: t.id, title: t.title || 'Remix', version: 'Rmx',
        style: t.tags || remixTags, playing: false, audio_url: t.audio_url,
        thumbnail: t.image_url || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop',
        duration: t.duration,
      }))
      setTracks([...newTracks, ...tracks])
      if (newTracks[0]?.audio_url) playTrack(newTracks[0])
    } catch (err: any) { setGenError(err.message); setGenStatus('') }
    finally { setGenerating(false); setTimeout(() => setGenStatus(''), 5000) }
  }


  // --- SUNO: Generate Lyrics ---
  const handleLyrics = async () => {
    if (!lyricsPrompt) { setGenError('Escribe una descripcion para las letras'); return }
    setGenerating(true)
    setGenStatus('Generando letras con IA...')
    setGenError('')
    try {
      const response = await fetch(`${SUNO_API_BASE}/api/suno/lyrics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: lyricsPrompt }),
      })
      const data = await response.json()
      if (!data.success) throw new Error(data.error)
      setGeneratedLyrics(data.text || '')
      setGenStatus(`✅ Letras generadas: "${data.title}"`)
      // Auto-fill the lyrics field
      if (data.text) { setLyrics(data.text); setTitle(data.title || title) }
    } catch (err: any) { setGenError(err.message); setGenStatus('') }
    finally { setGenerating(false); setTimeout(() => setGenStatus(''), 5000) }
  }

  // --- SUNO: Get Stems ---
  const handleStems = async () => {
    if (!stemsId) { setGenError('Selecciona un track para separar'); return }
    setGenerating(true)
    setGenStatus('Separando vocals/instrumental...')
    setGenError('')
    try {
      const response = await fetch(`${SUNO_API_BASE}/api/suno/stems`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audio_id: stemsId }),
      })
      const data = await response.json()
      if (!data.success) throw new Error(data.error)
      setGenStatus(`✅ ${data.count} stems separados!`)
      const newTracks: Track[] = data.stems.map((t: any) => ({
        id: t.id, title: t.title || 'Stem', version: 'Stem',
        style: 'Vocal/Instrumental', playing: false, audio_url: t.audio_url,
        thumbnail: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop',
        duration: t.duration,
      }))
      setTracks([...newTracks, ...tracks])
    } catch (err: any) { setGenError(err.message); setGenStatus('') }
    finally { setGenerating(false); setTimeout(() => setGenStatus(''), 5000) }
  }

  // --- SUNO: Load Library ---
  const handleLoadLibrary = async () => {
    setGenerating(true)
    setGenStatus('Cargando biblioteca...')
    try {
      const response = await fetch(`${SUNO_API_BASE}/api/suno/feed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ page: 0, limit: 20 }),
      })
      const data = await response.json()
      if (!data.success) throw new Error(data.error)
      const libTracks: Track[] = data.tracks.map((t: any) => ({
        id: t.id, title: t.title || 'Track', version: t.model_name || 'Suno',
        style: t.tags || '', playing: false, audio_url: t.audio_url,
        thumbnail: t.image_url || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop',
        duration: t.duration, lyrics: t.lyrics,
      }))
      setLibraryTracks(libTracks)
      setGenStatus(`✅ ${libTracks.length} tracks cargados`)
    } catch (err: any) { setGenError(err.message); setGenStatus('') }
    finally { setGenerating(false); setTimeout(() => setGenStatus(''), 5000) }
  }

  const VIDEO_STYLES = [
    { id: 'cinematic', label: '🎬 Cinematico', desc: 'Estilo pelicula, dramatico' },
    { id: 'neon', label: '🌃 Neon City', desc: 'Cyberpunk, luces neon' },
    { id: 'nature', label: '🌿 Naturaleza', desc: 'Paisajes, organico' },
    { id: 'abstract', label: '🎨 Abstracto', desc: 'Formas, colores, arte' },
    { id: 'concert', label: '🎤 Concierto', desc: 'Live, escenario, publico' },
    { id: 'anime', label: '🎌 Anime', desc: 'Estilo japones animado' },
  ]

  // Helper: get tracks with audio for selectors
  const tracksWithAudio = tracks.filter(t => t.audio_url && typeof t.id === 'string')


  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex flex-col">
      {/* ============ TOP NAV ============ */}
      <div className="fixed top-0 left-0 right-0 z-[60] bg-gradient-to-r from-[#0D0D0D] via-[#111118] to-[#0D0D0D] border-b border-c8l-gold/20">
        <div className="flex items-center gap-1 px-4 py-2 overflow-x-auto no-scrollbar">
          <Link href="/" className="flex items-center gap-2 mr-3 flex-shrink-0">
            <Logo size="sm" />
            <span className="text-sm font-outfit font-bold text-white hidden sm:inline">C8L</span>
          </Link>
          <div className="w-px h-6 bg-gray-700 mr-2 flex-shrink-0" />
          <Link href="/" className="group flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-800/40 hover:bg-gray-700/60 border border-transparent hover:border-gray-600 transition-all">
            <span className="text-sm">🏠</span><span className="text-[10px] font-medium text-gray-400 group-hover:text-white hidden sm:inline">INICIO</span>
          </Link>
          <Link href="/tv" className="group flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-800/40 hover:bg-cyan-500/15 border border-transparent hover:border-cyan-500/40 transition-all">
            <span className="text-sm">📺</span><span className="text-[10px] font-medium text-gray-400 group-hover:text-cyan-400 hidden sm:inline">C8L TV</span>
          </Link>
          <Link href="/studio" className="group flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-teal-500/15 border border-teal-500/40 transition-all">
            <span className="text-sm">🤖</span><span className="text-[10px] font-bold text-teal-400 hidden sm:inline">ESTUDIO IA</span>
          </Link>
          <Link href="/streaming" className="group flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-800/40 hover:bg-green-500/15 border border-transparent hover:border-green-500/40 transition-all">
            <span className="text-sm">🎧</span><span className="text-[10px] font-medium text-gray-400 group-hover:text-green-300 hidden sm:inline">STREAMING</span>
          </Link>
          <Link href="/monetizacion" className="group flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-800/40 hover:bg-yellow-500/15 border border-transparent hover:border-yellow-500/40 transition-all">
            <span className="text-sm">💰</span><span className="text-[10px] font-medium text-gray-400 group-hover:text-yellow-300 hidden sm:inline">TIENDA</span>
          </Link>
          <Link href="/comunidad" className="group flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-800/40 hover:bg-blue-500/15 border border-transparent hover:border-blue-500/40 transition-all">
            <span className="text-sm">👥</span><span className="text-[10px] font-medium text-gray-400 group-hover:text-blue-300 hidden sm:inline">COMUNIDAD</span>
          </Link>
          <Link href="/casino" className="group flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-800/40 hover:bg-amber-500/15 border border-transparent hover:border-amber-500/40 transition-all">
            <span className="text-sm">🎰</span><span className="text-[10px] font-medium text-gray-400 group-hover:text-amber-300 hidden sm:inline">CASINO</span>
          </Link>
        </div>
      </div>


      {/* ============ MAIN LAYOUT ============ */}
      <div className="flex pt-[42px] flex-1">
        {/* ============ LEFT SIDEBAR ============ */}
        <aside className="hidden lg:flex flex-col w-44 fixed left-0 top-[42px] bottom-0 bg-[#0A0A0A] border-r border-gray-800/30 py-4 px-2">
          <div className="flex items-center gap-2 px-2 mb-4">
            <Logo size="xs" />
            <div>
              <p className="text-xs font-bold text-white">leovela888</p>
              <p className="text-[9px] text-c8l-gold">{creditsInfo?.credits_left ?? '365'} creditos</p>
            </div>
          </div>
          <nav className="space-y-0.5 flex-1">
            {SIDEBAR_ITEMS.map(item => (
              <Link key={item.label} href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition text-sm ${item.active ? 'bg-white/10 text-white font-bold' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                <span>{item.icon}</span><span className="text-xs">{item.label}</span>
              </Link>
            ))}
          </nav>
          <div className="mt-auto space-y-1 px-2 pt-4 border-t border-gray-800/50">
            <a className="block text-[10px] text-gray-600 hover:text-gray-400 cursor-pointer">Laboratorios</a>
            <a className="block text-[10px] text-gray-600 hover:text-gray-400 cursor-pointer">Terminos y politicas</a>
          </div>
        </aside>

        {/* ============ CENTER: CREATION PANEL ============ */}
        <div className="lg:ml-44 flex-1 flex flex-col lg:flex-row">
          <div className="w-full lg:w-[420px] xl:w-[480px] border-r border-gray-800/30 p-4 lg:p-6 pb-[100px] flex flex-col overflow-y-auto max-h-[calc(100vh-42px)]">

            {/* === FEATURE TABS (new) === */}
            <div className="flex items-center gap-1 mb-4 overflow-x-auto no-scrollbar pb-1">
              {[
                { key: 'create', icon: '✨', label: 'Crear' },
                { key: 'extend', icon: '➡️', label: 'Extender' },
                { key: 'remix', icon: '🔄', label: 'Remix' },
                { key: 'lyrics', icon: '📝', label: 'Letras IA' },
                { key: 'stems', icon: '🎛️', label: 'Stems' },
                { key: 'library', icon: '📚', label: 'Biblioteca' },
              ].map(f => (
                <button key={f.key} onClick={() => setActivePanel(f.key as any)}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-[10px] font-medium whitespace-nowrap transition ${activePanel === f.key ? 'bg-gradient-to-r from-orange-500/20 to-pink-500/20 border border-orange-500/50 text-orange-300' : 'bg-gray-800/40 border border-transparent text-gray-400 hover:text-white hover:border-gray-600'}`}>
                  <span>{f.icon}</span> {f.label}
                </button>
              ))}
            </div>


            {/* === CREATE PANEL (original design preserved) === */}
            {activePanel === 'create' && (
              <>
                {/* Mode toggle + Credits */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="flex bg-[#1a1a1a] rounded-lg p-0.5">
                      <button onClick={() => setTab('musica')} className={`px-4 py-1.5 rounded-md text-xs font-medium transition ${tab === 'musica' ? 'bg-white text-black' : 'text-gray-400 hover:text-white'}`}>
                        🎵 Musica
                      </button>
                      <button onClick={() => setTab('videoclip')} className={`px-4 py-1.5 rounded-md text-xs font-medium transition ${tab === 'videoclip' ? 'bg-white text-black' : 'text-gray-400 hover:text-white'}`}>
                        🎬 Videoclip
                      </button>
                    </div>
                  </div>
                  <CreditsDisplay />
                </div>

                {tab === 'musica' ? (
                  <>
                    {/* Sencillo / Avanzado toggle */}
                    <div className="flex items-center gap-0 mb-5 bg-[#1a1a1a] rounded-lg p-0.5 w-fit">
                      <button onClick={() => setMode('sencillo')} className={`px-4 py-1.5 rounded-md text-xs font-medium transition ${mode === 'sencillo' ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-white'}`}>Sencillo</button>
                      <button onClick={() => setMode('avanzado')} className={`px-4 py-1.5 rounded-md text-xs font-medium transition ${mode === 'avanzado' ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-white'}`}>Avanzado</button>
                    </div>

                    {/* Model selector */}
                    <div className="mb-4">
                      <label className="text-[10px] text-gray-500 uppercase mb-1 block">Modelo Suno</label>
                      <select value={model} onChange={e => setModel(e.target.value)}
                        className="bg-[#111] border border-gray-800 rounded-lg px-3 py-2 text-xs text-white outline-none w-full">
                        <option value="chirp-v4">Chirp v4 (Standard)</option>
                        <option value="chirp-v4-5">Chirp v4.5 (Enhanced)</option>
                        <option value="chirp-v5">Chirp v5 (Latest)</option>
                      </select>
                    </div>

                    {mode === 'avanzado' && (
                      <>
                        <div className="flex gap-3 mb-5">
                          <button className="px-4 py-2 bg-[#1a1a1a] border border-gray-700 rounded-lg text-xs text-gray-300 hover:border-gray-500 transition">+ Audio</button>
                          <button className="px-4 py-2 bg-[#1a1a1a] border border-gray-700 rounded-lg text-xs text-gray-300 hover:border-gray-500 transition">+ Voz <span className="ml-1 text-[8px] bg-pink-500 text-white px-1.5 py-0.5 rounded-full">Nuevo</span></button>
                          <button onClick={() => setActivePanel('lyrics')} className="px-4 py-2 bg-[#1a1a1a] border border-gray-700 rounded-lg text-xs text-gray-300 hover:border-orange-500/50 hover:text-orange-300 transition">+ Letras IA</button>
                        </div>

                        {/* TITULO */}
                        <div className="mb-5">
                          <h3 className="text-sm font-bold text-white flex items-center gap-1.5 mb-2"><span className="text-gray-400">▼</span> Titulo</h3>
                          <input value={title} onChange={e => setTitle(e.target.value)}
                            className="w-full bg-[#111] border border-gray-800 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 outline-none focus:border-c8l-gold/50 transition" placeholder="Nombre de tu cancion..." />
                        </div>

                        {/* LETRA */}
                        <div className="mb-5">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="text-sm font-bold text-white flex items-center gap-1.5"><span className="text-gray-400">▼</span> Letra</h3>
                            <div className="flex gap-1.5">
                              <button className="w-7 h-7 rounded-lg bg-[#1a1a1a] border border-gray-700 flex items-center justify-center text-gray-400 hover:text-white text-xs transition">↩</button>
                              <button className="w-7 h-7 rounded-lg bg-[#1a1a1a] border border-gray-700 flex items-center justify-center text-gray-400 hover:text-white text-xs transition">🔖</button>
                              <button className="w-7 h-7 rounded-lg bg-[#1a1a1a] border border-gray-700 flex items-center justify-center text-gray-400 hover:text-white text-xs transition">📋</button>
                            </div>
                          </div>
                          <textarea value={lyrics} onChange={e => setLyrics(e.target.value)}
                            className="w-full bg-[#111] border border-gray-800 rounded-xl px-4 py-3 text-sm text-gray-200 placeholder-gray-600 outline-none focus:border-orange-500/50 transition resize-none h-40 font-mono leading-relaxed" placeholder="Escribe tus letras aqui..." />
                          <div className="flex items-center gap-3 mt-2">
                            <div className="flex gap-1">{[...Array(8)].map((_, i) => (<div key={i} className="w-1 bg-gray-700 rounded-full" style={{ height: `${8 + Math.random() * 12}px` }} />))}</div>
                            <button className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-white text-xs shadow-lg shadow-orange-500/30">✕</button>
                            <div className="flex-1" />
                            <button className="text-gray-500 hover:text-white text-sm transition">↻</button>
                          </div>
                        </div>

                        {/* ESTILOS */}
                        <div className="mb-5">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="text-sm font-bold text-white flex items-center gap-1.5"><span className="text-gray-400">▼</span> Estilos</h3>
                            <div className="flex gap-1.5">
                              <button className="w-7 h-7 rounded-lg bg-[#1a1a1a] border border-gray-700 flex items-center justify-center text-gray-400 hover:text-white text-xs transition">↩</button>
                              <button className="w-7 h-7 rounded-lg bg-[#1a1a1a] border border-gray-700 flex items-center justify-center text-gray-400 hover:text-white text-xs transition">🔖</button>
                              <button className="w-7 h-7 rounded-lg bg-[#1a1a1a] border border-gray-700 flex items-center justify-center text-gray-400 hover:text-white text-xs transition">📋</button>
                            </div>
                          </div>
                          <textarea value={styles} onChange={e => setStyles(e.target.value)}
                            className="w-full bg-[#111] border border-gray-800 rounded-xl px-4 py-3 text-sm text-purple-300 placeholder-gray-600 outline-none focus:border-purple-500/50 transition resize-none h-32 font-mono leading-relaxed" placeholder="high energy reggaeton, bolero house, flamenco fusion..." />
                        </div>
                      </>
                    )}

                    {mode === 'sencillo' && (
                      <div className="mb-5">
                        <label className="text-xs text-gray-400 mb-2 block">Describe tu cancion</label>
                        <textarea value={styles} onChange={e => setStyles(e.target.value)} placeholder="Ej: Una cancion de reggaeton con fusion flamenco, energetica, para fiesta..."
                          className="w-full bg-[#111] border border-gray-800 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 outline-none focus:border-c8l-gold/50 transition resize-none h-32" />
                      </div>
                    )}

                    {/* STATUS / ERROR */}
                    {genStatus && (<div className="mb-3 px-4 py-2 bg-green-500/10 border border-green-500/30 rounded-xl text-xs text-green-400 text-center animate-pulse">{genStatus}</div>)}
                    {genError && (<div className="mb-3 px-4 py-2 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-400 text-center">{genError}</div>)}

                    {/* CREATE BUTTON */}
                    <div className="flex items-center gap-3 mt-auto pt-4">
                      <button className="w-12 h-12 rounded-xl bg-[#1a1a1a] border border-gray-700 flex items-center justify-center text-gray-400 hover:text-white transition text-lg">🗑️</button>
                      <button onClick={handleCreate} disabled={generating}
                        className="flex-1 py-4 bg-gradient-to-r from-orange-500 via-red-500 to-pink-600 rounded-xl font-bold text-base hover:scale-[1.01] active:scale-[0.99] transition-transform disabled:opacity-60 shadow-lg shadow-orange-500/20">
                        {generating ? '⏳ Generando en Suno...' : '✨ Crear con Suno AI'}
                      </button>
                    </div>
                  </>
                ) : (
                  /* ============ VIDEOCLIP TAB ============ */
                  <>
                    <div className="mb-5">
                      <label className="text-xs text-gray-400 mb-2 block uppercase tracking-wider">Cancion base</label>
                      <select className="w-full bg-[#111] border border-gray-800 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-purple-500/50 transition">
                        {tracks.map(t => (<option key={t.id} value={t.id}>{t.title} - {t.version}</option>))}
                      </select>
                    </div>
                    <div className="mb-5">
                      <label className="text-xs text-gray-400 mb-2 block uppercase tracking-wider">Estilo visual</label>
                      <div className="grid grid-cols-2 gap-2">
                        {VIDEO_STYLES.map(vs => (
                          <button key={vs.id} onClick={() => setVideoStyle(vs.id)}
                            className={`p-3 rounded-xl border text-left transition ${videoStyle === vs.id ? 'border-purple-500 bg-purple-500/10' : 'border-gray-800 bg-[#111] hover:border-gray-600'}`}>
                            <span className="text-lg">{vs.label.split(' ')[0]}</span>
                            <p className="text-[10px] text-gray-400 mt-1">{vs.desc}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="mb-5">
                      <label className="text-xs text-gray-400 mb-2 block uppercase tracking-wider">Descripcion del videoclip</label>
                      <textarea value={videoPrompt} onChange={e => setVideoPrompt(e.target.value)} placeholder="Ej: Un hombre caminando por calles de neon..."
                        className="w-full bg-[#111] border border-gray-800 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 outline-none focus:border-purple-500/50 transition resize-none h-28" />
                    </div>
                    <button onClick={() => { setGenerating(true); setTimeout(() => setGenerating(false), 4000) }} disabled={generating}
                      className="w-full py-4 bg-gradient-to-r from-purple-600 via-violet-600 to-fuchsia-600 rounded-xl font-bold text-base hover:scale-[1.01] active:scale-[0.99] transition-transform disabled:opacity-60 shadow-lg shadow-purple-500/20 mt-auto">
                      {generating ? '⏳ Generando videoclip...' : '🎬 Crear Videoclip'}
                    </button>
                  </>
                )}
              </>
            )}


            {/* === EXTEND PANEL === */}
            {activePanel === 'extend' && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-white">➡️ Extender Track</h3>
                <p className="text-[11px] text-gray-500">Continua una cancion desde un punto especifico. La IA mantiene el estilo y extiende la pieza.</p>

                <div>
                  <label className="text-[10px] text-gray-400 uppercase mb-1 block">Track a extender</label>
                  <select value={extendId} onChange={e => setExtendId(e.target.value)}
                    className="w-full bg-[#111] border border-gray-800 rounded-xl px-4 py-3 text-sm text-white outline-none">
                    <option value="">Selecciona un track...</option>
                    {tracksWithAudio.map(t => (<option key={t.id} value={t.id as string}>{t.title}</option>))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-gray-400 uppercase mb-1 block">Continuar desde (segundos)</label>
                  <input value={extendAt} onChange={e => setExtendAt(e.target.value)} type="number" placeholder="Ej: 30 (vacio = final)"
                    className="w-full bg-[#111] border border-gray-800 rounded-xl px-4 py-3 text-sm text-white outline-none" />
                </div>

                <div>
                  <label className="text-[10px] text-gray-400 uppercase mb-1 block">Letra para la extension (opcional)</label>
                  <textarea value={extendLyrics} onChange={e => setExtendLyrics(e.target.value)} placeholder="[Bridge]\nNuevas letras para la extension..."
                    className="w-full bg-[#111] border border-gray-800 rounded-xl px-4 py-3 text-sm text-gray-200 outline-none resize-none h-28 font-mono" />
                </div>

                {genStatus && (<div className="px-4 py-2 bg-green-500/10 border border-green-500/30 rounded-xl text-xs text-green-400 text-center animate-pulse">{genStatus}</div>)}
                {genError && (<div className="px-4 py-2 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-400 text-center">{genError}</div>)}

                <button onClick={handleExtend} disabled={generating}
                  className="w-full py-4 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl font-bold text-base hover:scale-[1.01] active:scale-[0.99] transition-transform disabled:opacity-60 shadow-lg shadow-blue-500/20">
                  {generating ? '⏳ Extendiendo...' : '➡️ Extender Track'}
                </button>
              </div>
            )}

            {/* === REMIX PANEL === */}
            {activePanel === 'remix' && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-white">🔄 Remix</h3>
                <p className="text-[11px] text-gray-500">Cambia el estilo de una cancion existente. Mantiene la melodia pero la transforma.</p>

                <div>
                  <label className="text-[10px] text-gray-400 uppercase mb-1 block">Track original</label>
                  <select value={remixId} onChange={e => setRemixId(e.target.value)}
                    className="w-full bg-[#111] border border-gray-800 rounded-xl px-4 py-3 text-sm text-white outline-none">
                    <option value="">Selecciona un track...</option>
                    {tracksWithAudio.map(t => (<option key={t.id} value={t.id as string}>{t.title}</option>))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-gray-400 uppercase mb-1 block">Nuevo estilo</label>
                  <textarea value={remixTags} onChange={e => setRemixTags(e.target.value)} placeholder="Ej: jazz lo-fi, chill beats, piano suave, 90 BPM"
                    className="w-full bg-[#111] border border-gray-800 rounded-xl px-4 py-3 text-sm text-purple-300 outline-none resize-none h-24 font-mono" />
                </div>

                {genStatus && (<div className="px-4 py-2 bg-green-500/10 border border-green-500/30 rounded-xl text-xs text-green-400 text-center animate-pulse">{genStatus}</div>)}
                {genError && (<div className="px-4 py-2 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-400 text-center">{genError}</div>)}

                <button onClick={handleRemix} disabled={generating}
                  className="w-full py-4 bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-xl font-bold text-base hover:scale-[1.01] active:scale-[0.99] transition-transform disabled:opacity-60 shadow-lg shadow-violet-500/20">
                  {generating ? '⏳ Remixando...' : '🔄 Crear Remix'}
                </button>
              </div>
            )}


            {/* === LYRICS AI PANEL === */}
            {activePanel === 'lyrics' && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-white">📝 Letras con IA</h3>
                <p className="text-[11px] text-gray-500">Genera letras completas con estructura (Verso, Coro, Bridge...) a partir de una descripcion. Luego usala para crear tu cancion.</p>

                <div>
                  <label className="text-[10px] text-gray-400 uppercase mb-1 block">Describe tu cancion</label>
                  <textarea value={lyricsPrompt} onChange={e => setLyricsPrompt(e.target.value)}
                    placeholder="Ej: Una cancion de reggaeton sobre una ex mentirosa que fingia ser victima, estilo urbano con toques flamencos..."
                    className="w-full bg-[#111] border border-gray-800 rounded-xl px-4 py-3 text-sm text-white outline-none resize-none h-24" />
                </div>

                {genStatus && (<div className="px-4 py-2 bg-green-500/10 border border-green-500/30 rounded-xl text-xs text-green-400 text-center animate-pulse">{genStatus}</div>)}
                {genError && (<div className="px-4 py-2 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-400 text-center">{genError}</div>)}

                <button onClick={handleLyrics} disabled={generating}
                  className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl font-bold text-sm hover:scale-[1.01] active:scale-[0.99] transition-transform disabled:opacity-60 shadow-lg shadow-amber-500/20">
                  {generating ? '⏳ Generando letras...' : '📝 Generar Letras con IA'}
                </button>

                {generatedLyrics && (
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-[10px] text-gray-400 uppercase">Letras generadas</label>
                      <button onClick={() => { setLyrics(generatedLyrics); setActivePanel('create'); setMode('avanzado') }}
                        className="text-[10px] bg-orange-500/20 text-orange-300 px-3 py-1 rounded-full hover:bg-orange-500/30 transition">
                        Usar en Crear →
                      </button>
                    </div>
                    <textarea value={generatedLyrics} onChange={e => setGeneratedLyrics(e.target.value)} readOnly
                      className="w-full bg-[#0d0d0d] border border-gray-800 rounded-xl px-4 py-3 text-xs text-green-300 outline-none resize-none h-60 font-mono leading-relaxed" />
                  </div>
                )}
              </div>
            )}

            {/* === STEMS PANEL === */}
            {activePanel === 'stems' && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-white">🎛️ Separacion de Stems</h3>
                <p className="text-[11px] text-gray-500">Separa una cancion en pistas de voz e instrumental. Util para karaoke, remixes, o produccion.</p>

                <div>
                  <label className="text-[10px] text-gray-400 uppercase mb-1 block">Track a separar</label>
                  <select value={stemsId} onChange={e => setStemsId(e.target.value)}
                    className="w-full bg-[#111] border border-gray-800 rounded-xl px-4 py-3 text-sm text-white outline-none">
                    <option value="">Selecciona un track...</option>
                    {tracksWithAudio.map(t => (<option key={t.id} value={t.id as string}>{t.title}</option>))}
                  </select>
                </div>

                {genStatus && (<div className="px-4 py-2 bg-green-500/10 border border-green-500/30 rounded-xl text-xs text-green-400 text-center animate-pulse">{genStatus}</div>)}
                {genError && (<div className="px-4 py-2 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-400 text-center">{genError}</div>)}

                <button onClick={handleStems} disabled={generating}
                  className="w-full py-4 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-xl font-bold text-base hover:scale-[1.01] active:scale-[0.99] transition-transform disabled:opacity-60 shadow-lg shadow-teal-500/20">
                  {generating ? '⏳ Separando...' : '🎛️ Separar Vocals/Instrumental'}
                </button>
              </div>
            )}

            {/* === LIBRARY PANEL === */}
            {activePanel === 'library' && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-white">📚 Mi Biblioteca Suno</h3>
                <p className="text-[11px] text-gray-500">Todas tus canciones generadas en Suno (rufinoleon30@gmail.com)</p>

                <button onClick={handleLoadLibrary} disabled={generating}
                  className="w-full py-3 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-xl font-bold text-sm hover:scale-[1.01] active:scale-[0.99] transition-transform disabled:opacity-60">
                  {generating ? '⏳ Cargando...' : '📚 Cargar Biblioteca'}
                </button>

                {genStatus && (<div className="px-4 py-2 bg-green-500/10 border border-green-500/30 rounded-xl text-xs text-green-400 text-center">{genStatus}</div>)}

                {libraryTracks.length > 0 && (
                  <div className="space-y-2 mt-4 max-h-[50vh] overflow-y-auto">
                    {libraryTracks.map(t => (
                      <div key={t.id} onClick={() => { if (t.audio_url) playTrack(t) }}
                        className="flex items-center gap-3 p-3 bg-[#111] border border-gray-800 rounded-xl hover:border-gray-600 transition cursor-pointer">
                        <img src={t.thumbnail} alt="" className="w-10 h-10 rounded-lg object-cover" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-white truncate">{t.title}</p>
                          <p className="text-[10px] text-gray-500 truncate">{t.style}</p>
                        </div>
                        {t.audio_url && <span className="text-green-400 text-xs">▶</span>}
                        <button onClick={e => { e.stopPropagation(); setExtendId(t.id as string); setActivePanel('extend') }}
                          className="text-[9px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded hover:bg-blue-500/30">Ext</button>
                        <button onClick={e => { e.stopPropagation(); setRemixId(t.id as string); setActivePanel('remix') }}
                          className="text-[9px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded hover:bg-purple-500/30">Rmx</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>


          {/* ============ RIGHT: WORKSPACE (Generated Tracks) ============ */}
          <div className="flex-1 p-4 lg:p-6 pb-[100px] overflow-y-auto max-h-[calc(100vh-42px)]">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-outfit font-bold text-white">Mi espacio de trabajo</h2>
              <div className="flex items-center gap-3">
                <div className="flex items-center bg-[#1a1a1a] border border-gray-800 rounded-lg px-3 py-1.5">
                  <svg className="w-4 h-4 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                  <input type="text" placeholder="Busqueda" className="bg-transparent text-xs text-white outline-none w-24" />
                </div>
                <button className="px-3 py-1.5 bg-[#1a1a1a] border border-gray-800 rounded-lg text-xs text-gray-400 hover:text-white transition">🔽 Mas recientes</button>
              </div>
            </div>

            {/* Tracks Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {tracks.map((track, i) => (
                <motion.div key={track.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  className="group rounded-xl overflow-hidden bg-[#111] border border-gray-800/50 hover:border-gray-600 transition cursor-pointer"
                  onClick={() => track.audio_url ? playTrack(track) : setCurrentTrack(track)}>
                  <div className="relative aspect-square overflow-hidden">
                    <img src={track.thumbnail} alt={track.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition shadow-xl">
                        <span className="text-black text-lg ml-0.5">▶</span>
                      </div>
                    </div>
                  </div>
                  <div className="p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-bold text-white truncate flex-1">{track.title}</h3>
                      <span className="text-[9px] bg-teal-500/20 text-teal-400 px-1.5 py-0.5 rounded font-bold flex-shrink-0">{track.version}</span>
                    </div>
                    <p className="text-[11px] text-gray-500 truncate">{track.style}</p>
                    <div className="flex items-center gap-2 mt-3">
                      <button onClick={e => { e.stopPropagation(); setExtendId(track.id as string); setActivePanel('extend') }}
                        className="px-3 py-1.5 bg-[#1a1a1a] border border-gray-700 rounded-lg text-[10px] text-gray-400 hover:text-blue-300 hover:border-blue-500/50 transition flex items-center gap-1">➡️ Extend</button>
                      <button onClick={e => { e.stopPropagation(); setRemixId(track.id as string); setActivePanel('remix') }}
                        className="px-3 py-1.5 bg-[#1a1a1a] border border-gray-700 rounded-lg text-[10px] text-gray-400 hover:text-purple-300 hover:border-purple-500/50 transition flex items-center gap-1">🔄 Remix</button>
                      <button onClick={e => { e.stopPropagation(); setStemsId(track.id as string); setActivePanel('stems') }}
                        className="text-gray-600 hover:text-teal-300 text-sm transition">🎛️</button>
                      <button className="text-gray-600 hover:text-white text-sm transition ml-auto">⋯</button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>


      {/* ============ HIDDEN AUDIO ELEMENT ============ */}
      <audio ref={audioRef} preload="auto" />

      {/* ============ BOTTOM PLAYER BAR ============ */}
      {currentTrack && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#0D0D0D]/98 backdrop-blur-md border-t border-gray-800/50 h-[72px]">
          <div className="flex items-center h-full px-4 gap-4">
            <div className="flex items-center gap-3 min-w-[200px]">
              <img src={currentTrack.thumbnail} alt="" className="w-10 h-10 rounded-lg object-cover" />
              <div>
                <p className="text-xs font-bold text-white truncate">{currentTrack.title}</p>
                <p className="text-[10px] text-gray-500">leovela888</p>
              </div>
            </div>
            <div className="flex-1 flex flex-col items-center gap-1">
              <div className="flex items-center gap-5">
                <button className="text-gray-400 hover:text-white transition">🔀</button>
                <button className="text-gray-400 hover:text-white transition text-lg">⏮</button>
                <button onClick={togglePlay} className="w-10 h-10 rounded-full bg-white flex items-center justify-center hover:scale-105 transition shadow-lg">
                  <span className="text-black text-sm">{isPlaying ? '⏸' : '▶'}</span>
                </button>
                <button className="text-gray-400 hover:text-white transition text-lg">⏭</button>
                <button className="text-gray-400 hover:text-white transition">🔁</button>
              </div>
              <div className="w-full max-w-lg flex items-center gap-2">
                <span className="text-[9px] text-gray-500 font-mono">{formatTime(currentTime)}</span>
                <div className="flex-1 h-1 bg-gray-800 rounded-full relative cursor-pointer group"
                  onClick={(e) => { if (!audioRef.current || !duration) return; const rect = e.currentTarget.getBoundingClientRect(); const pct = (e.clientX - rect.left) / rect.width; audioRef.current.currentTime = pct * duration }}>
                  <div className="h-full bg-white rounded-full" style={{ width: `${progress}%` }}></div>
                  <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 transition" style={{ left: `${progress}%` }}></div>
                </div>
                <span className="text-[9px] text-gray-500 font-mono">{formatTime(duration)}</span>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-3 min-w-[180px] justify-end">
              <button className="text-gray-400 hover:text-white text-sm transition">📋</button>
              <button className="text-gray-400 hover:text-white text-sm transition">👍</button>
              <button className="text-gray-400 hover:text-white text-sm transition">👎</button>
              {currentTrack.audio_url && (<a href={currentTrack.audio_url} download className="text-gray-400 hover:text-white text-sm transition">⬇️</a>)}
              <button className="text-gray-400 hover:text-white text-sm transition">↗️</button>
              <div className="flex items-center gap-1.5">
                <span className="text-gray-400 text-sm">🔊</span>
                <div className="w-16 h-1 bg-gray-800 rounded-full relative"><div className="h-full bg-white rounded-full" style={{ width: '70%' }}></div></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
