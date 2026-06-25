'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import Logo from '@/components/ui/Logo'
import { VIDEOS, CATEGORIES, VideoData, getRelatedVideos } from '@/lib/videos/data'

// ============ SIDEBAR ITEMS ============
const SIDEBAR_ITEMS = [
  { icon: '🏠', label: 'Inicio', href: '/tv' },
  { icon: '🧭', label: 'Explorar', href: '/tv' },
  { icon: '🔔', label: 'Suscripciones', href: '/tv' },
  { icon: '📚', label: 'Biblioteca', href: '/tv' },
  { icon: '🕐', label: 'Historial', href: '/tv' },
  { icon: '🎬', label: 'Mis Videos', href: '/tv' },
  { icon: '⏰', label: 'Ver Más Tarde', href: '/tv' },
  { icon: '❤️', label: 'Videos Gustados', href: '/tv' },
]

export default function TVPage() {
  const [selectedVideo, setSelectedVideo] = useState<VideoData | null>(null)
  const [filter, setFilter] = useState('Todas')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [uploadModalOpen, setUploadModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [commentTab, setCommentTab] = useState<'comments' | 'telemetry'>('comments')
  const [dragOver, setDragOver] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)


  const filteredVideos = VIDEOS
    .filter(v => filter === 'Todas' || v.category === filter)
    .filter(v => searchQuery === '' || v.title.toLowerCase().includes(searchQuery.toLowerCase()))

  useEffect(() => {
    if (selectedVideo && videoRef.current) {
      videoRef.current.load()
      videoRef.current.play().catch(() => {})
    }
  }, [selectedVideo])

  const formatViews = (n: number) => {
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K'
    return n.toString()
  }

  // ============ UPLOAD MODAL ============
  const UploadModal = () => (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={() => setUploadModalOpen(false)}>
      <div className="bg-[#1a1a1a] border border-gray-700 rounded-2xl w-full max-w-2xl mx-4 p-0 overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <h2 className="text-lg font-bold text-white">Subir video a C8L TV</h2>
          <button onClick={() => setUploadModalOpen(false)} className="text-gray-400 hover:text-white text-xl">✕</button>
        </div>


        {/* Drag and Drop Area */}
        <div className="p-8">
          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => { e.preventDefault(); setDragOver(false) }}
            className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all ${
              dragOver ? 'border-cyan-400 bg-cyan-400/10' : 'border-gray-600 hover:border-gray-500'
            }`}
          >
            <div className="text-5xl mb-4">📁</div>
            <p className="text-white font-medium mb-2">Arrastra y suelta tu video aquí</p>
            <p className="text-gray-500 text-sm mb-6">Soporta .mp4, .mov, .avi — Máx 2GB</p>
            <button className="px-6 py-3 bg-cyan-500 hover:bg-cyan-600 text-black font-bold rounded-xl transition hover:scale-105">
              SELECCIONAR ARCHIVO
            </button>
          </div>

          {/* Metadata fields */}
          <div className="mt-6 space-y-4">
            <div>
              <label className="text-xs text-gray-400 uppercase tracking-wider mb-1 block">Título</label>
              <input type="text" placeholder="Nombre del video..." className="w-full bg-[#0d0d0d] border border-gray-700 rounded-xl px-4 py-3 text-white text-sm focus:border-cyan-500 outline-none transition" />
            </div>
            <div>
              <label className="text-xs text-gray-400 uppercase tracking-wider mb-1 block">Descripción</label>
              <textarea placeholder="Describe tu video..." className="w-full bg-[#0d0d0d] border border-gray-700 rounded-xl px-4 py-3 text-white text-sm focus:border-cyan-500 outline-none transition resize-none h-20" />
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="text-xs text-gray-400 uppercase tracking-wider mb-1 block">Categoría</label>
                <select className="w-full bg-[#0d0d0d] border border-gray-700 rounded-xl px-4 py-3 text-white text-sm focus:border-cyan-500 outline-none">
                  {CATEGORIES.filter(c => c !== 'Todas').map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="flex-1">
                <label className="text-xs text-gray-400 uppercase tracking-wider mb-1 block">Tags</label>
                <input type="text" placeholder="house, bolero, remix..." className="w-full bg-[#0d0d0d] border border-gray-700 rounded-xl px-4 py-3 text-white text-sm focus:border-cyan-500 outline-none transition" />
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-800">
          <button onClick={() => setUploadModalOpen(false)} className="px-5 py-2.5 text-gray-400 hover:text-white text-sm transition">Cancelar</button>
          <button className="px-6 py-2.5 bg-cyan-500 hover:bg-cyan-600 text-black font-bold text-sm rounded-xl transition">PUBLICAR</button>
        </div>
      </div>
    </div>
  )


  // ============ VIDEO PLAYER VIEW ============
  if (selectedVideo) {
    const related = getRelatedVideos(selectedVideo.id, 6)
    return (
      <div className="min-h-screen bg-[#0D0D0D] text-white">
        {/* Upload Modal */}
        {uploadModalOpen && <UploadModal />}

        {/* Header */}
        <header className="fixed top-0 left-0 right-0 z-50 bg-[#0D0D0D]/95 backdrop-blur-md border-b border-gray-800/50 h-14">
          <div className="flex items-center justify-between px-4 h-full">
            <div className="flex items-center gap-4">
              <button onClick={() => setSelectedVideo(null)} className="text-gray-400 hover:text-white transition">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              </button>
              <Link href="/tv" className="flex items-center gap-2">
                <Logo size="xs" />
                <span className="text-sm font-outfit font-bold text-white">C8L TV</span>
              </Link>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => setUploadModalOpen(true)} className="px-4 py-1.5 bg-cyan-500 hover:bg-cyan-600 text-black font-bold text-xs rounded-lg transition">+ SUBIR</button>
              <div className="flex items-center gap-1.5 bg-gray-800/60 rounded-full px-3 py-1.5">
                <span className="text-c8l-gold text-xs">🪙</span>
                <span className="text-xs font-bold">9999</span>
              </div>
            </div>
          </div>
        </header>


        {/* Player Layout */}
        <div className="pt-14 flex">
          {/* Main Player Area */}
          <div className="flex-1 max-w-[calc(100%-380px)] p-6">
            {/* Video Container 16:9 */}
            <div className="relative aspect-video bg-black rounded-xl overflow-hidden border border-gray-800">
              <video
                ref={videoRef}
                key={selectedVideo.id}
                controls
                autoPlay
                playsInline
                className="w-full h-full object-contain"
              >
                <source src={selectedVideo.videoUrl} type="video/mp4" />
              </video>
            </div>

            {/* Video Info */}
            <div className="mt-4">
              <h1 className="text-xl font-bold text-white">{selectedVideo.title}</h1>
              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-c8l-gold to-amber-700 flex items-center justify-center text-lg">
                    {selectedVideo.authorEmoji}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">{selectedVideo.author}</p>
                    <p className="text-[11px] text-gray-500">{selectedVideo.authorSubscribers} suscriptores</p>
                  </div>
                  <button className="ml-3 px-4 py-1.5 bg-white text-black text-xs font-bold rounded-full hover:bg-gray-200 transition">SUSCRIBIRSE</button>
                </div>
                <div className="flex items-center gap-2">
                  <button className="flex items-center gap-1.5 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-full text-sm transition">
                    <span>👍</span> <span>{selectedVideo.likes}</span>
                  </button>
                  <button className="flex items-center gap-1.5 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-full text-sm transition">
                    <span>👎</span> <span>{selectedVideo.dislikes}</span>
                  </button>
                  <button className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-full text-sm transition">↗️ Compartir</button>
                  <button className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-full text-sm transition">💾 Guardar</button>
                  <button className="px-4 py-2 bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 rounded-full text-sm font-bold transition">🎵 DUET CHALLENGE</button>
                </div>
              </div>
            </div>


            {/* Description Box */}
            <div className="mt-4 bg-[#1a1a1a] rounded-xl p-4">
              <div className="flex items-center gap-3 text-sm text-gray-400 mb-2">
                <span>{formatViews(selectedVideo.views)} visualizaciones</span>
                <span>hace {selectedVideo.daysAgo} {selectedVideo.daysAgo === 1 ? 'día' : 'días'}</span>
                {selectedVideo.tags.map(t => <span key={t} className="text-cyan-400">#{t.replace(/\s/g, '')}</span>)}
              </div>
              <p className="text-sm text-gray-300 whitespace-pre-line line-clamp-3">{selectedVideo.description}</p>
            </div>

            {/* Tabs: Comments / Telemetry */}
            <div className="mt-6">
              <div className="flex gap-6 border-b border-gray-800 mb-4">
                <button onClick={() => setCommentTab('comments')} className={`pb-3 text-sm font-bold transition border-b-2 ${commentTab === 'comments' ? 'text-white border-white' : 'text-gray-500 border-transparent'}`}>
                  💬 Comentarios ({selectedVideo.comments.length})
                </button>
                <button onClick={() => setCommentTab('telemetry')} className={`pb-3 text-sm font-bold transition border-b-2 ${commentTab === 'telemetry' ? 'text-white border-white' : 'text-gray-500 border-transparent'}`}>
                  📊 Telemetría de Video
                </button>
              </div>

              {commentTab === 'comments' ? (
                <div className="space-y-4">
                  {/* Add comment */}
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-c8l-gold/30 flex items-center justify-center text-xs">👤</div>
                    <input type="text" placeholder="Añadir un comentario..." className="flex-1 bg-transparent border-b border-gray-700 focus:border-cyan-500 outline-none text-sm text-white pb-2 transition" />
                  </div>
                  {/* Comments list */}
                  {selectedVideo.comments.map(c => (
                    <div key={c.id} className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-sm flex-shrink-0">{c.authorEmoji}</div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white">@{c.author}</span>
                          <span className="text-[10px] text-gray-600">{c.timeAgo}</span>
                        </div>
                        <p className="text-sm text-gray-300 mt-0.5">{c.text}</p>
                        <div className="flex items-center gap-4 mt-1.5">
                          <button className="text-[11px] text-gray-500 hover:text-white transition">👍 {c.likes}</button>
                          <button className="text-[11px] text-gray-500 hover:text-white transition">👎</button>
                          <button className="text-[11px] text-gray-500 hover:text-white transition">Responder</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[#1a1a1a] rounded-xl p-4">
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Retención promedio</p>
                    <p className="text-2xl font-bold text-cyan-400">78%</p>
                    <div className="h-1.5 bg-gray-800 rounded-full mt-2"><div className="h-full bg-cyan-500 rounded-full" style={{width:'78%'}}></div></div>
                  </div>
                  <div className="bg-[#1a1a1a] rounded-xl p-4">
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">CTR Thumbnail</p>
                    <p className="text-2xl font-bold text-green-400">12.4%</p>
                    <div className="h-1.5 bg-gray-800 rounded-full mt-2"><div className="h-full bg-green-500 rounded-full" style={{width:'62%'}}></div></div>
                  </div>
                  <div className="bg-[#1a1a1a] rounded-xl p-4">
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Tiempo medio</p>
                    <p className="text-2xl font-bold text-c8l-gold">3:22</p>
                  </div>
                  <div className="bg-[#1a1a1a] rounded-xl p-4">
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Engagement</p>
                    <p className="text-2xl font-bold text-pink-400">94%</p>
                    <div className="h-1.5 bg-gray-800 rounded-full mt-2"><div className="h-full bg-pink-500 rounded-full" style={{width:'94%'}}></div></div>
                  </div>
                </div>
              )}
            </div>
          </div>


          {/* Right Sidebar: Recommendations */}
          <aside className="hidden xl:block w-[380px] p-4 pt-6 overflow-y-auto max-h-[calc(100vh-56px)] border-l border-gray-800/50">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Videos Sugeridos</h3>
            <div className="space-y-3">
              {related.map(v => (
                <div key={v.id} onClick={() => setSelectedVideo(v)} className="flex gap-3 cursor-pointer group hover:bg-gray-800/30 rounded-lg p-1.5 transition">
                  <div className="relative w-40 h-[90px] rounded-lg overflow-hidden flex-shrink-0">
                    <img src={v.thumbnail} alt={v.title} className="w-full h-full object-cover group-hover:scale-105 transition" />
                    <span className="absolute bottom-1 right-1 bg-black/80 text-[10px] px-1.5 py-0.5 rounded font-mono">{v.duration}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-white line-clamp-2 group-hover:text-cyan-400 transition">{v.title}</h4>
                    <p className="text-[11px] text-gray-500 mt-1">{v.author}</p>
                    <p className="text-[11px] text-gray-600">{formatViews(v.views)} views · hace {v.daysAgo}d</p>
                  </div>
                </div>
              ))}
            </div>
          </aside>
        </div>

        {/* Bot IA Widget */}
        <button className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-gradient-to-br from-cyan-400 to-teal-600 flex items-center justify-center shadow-lg shadow-cyan-500/40 hover:scale-110 hover:shadow-cyan-400/60 transition-all z-50 border border-cyan-300/30">
          <span className="text-2xl">🤖</span>
        </button>
      </div>
    )
  }


  // ============ MAIN FEED VIEW ============
  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white">
      {/* Upload Modal */}
      {uploadModalOpen && <UploadModal />}

      {/* ============ HEADER ============ */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#0D0D0D]/95 backdrop-blur-md border-b border-gray-800/50 h-14">
        <div className="flex items-center justify-between px-4 h-full gap-4">
          {/* Left: Logo + Hamburger */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-gray-400 hover:text-white transition">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <Link href="/tv" className="flex items-center gap-2">
              <Logo size="sm" />
              <div className="hidden sm:block">
                <span className="text-sm font-outfit font-bold text-white">C8L TV</span>
              </div>
            </Link>
          </div>

          {/* Center: Search Bar */}
          <div className="flex-1 max-w-2xl">
            <div className="flex items-center">
              <div className="flex-1 flex items-center bg-[#121212] border border-gray-700 rounded-l-full px-4 py-2 focus-within:border-cyan-500 transition">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Buscar en C8L TV..."
                  className="flex-1 bg-transparent text-sm text-white outline-none placeholder-gray-500"
                />
              </div>
              <button className="px-5 py-2 bg-gray-800 border border-gray-700 border-l-0 rounded-r-full hover:bg-gray-700 transition">
                <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </button>
              <button className="ml-2 w-9 h-9 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center transition" title="Búsqueda por voz">
                <svg className="w-4 h-4 text-gray-300" fill="currentColor" viewBox="0 0 24 24"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.91-3c-.49 0-.9.36-.98.85C16.52 14.2 14.47 16 12 16s-4.52-1.8-4.93-4.15a.998.998 0 00-.98-.85c-.61 0-1.09.54-1 1.14.49 3 2.89 5.35 5.91 5.78V20c0 .55.45 1 1 1s1-.45 1-1v-2.08a6.993 6.993 0 005.91-5.78c.1-.6-.39-1.14-1-1.14z"/></svg>
              </button>
            </div>
          </div>

          {/* Right: Upload + Credits + Logout */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <button onClick={() => setUploadModalOpen(true)} className="hidden sm:flex items-center gap-1.5 px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs rounded-lg transition hover:scale-105 shadow-md shadow-cyan-500/30">
              <span className="text-sm">+</span> SUBIR
            </button>
            <div className="hidden sm:flex items-center gap-1.5 bg-gray-800/60 rounded-full px-3 py-1.5">
              <span className="text-c8l-gold text-xs">🪙</span>
              <span className="text-xs font-bold">9999</span>
            </div>
            <div className="hidden md:flex items-center gap-1 bg-gray-800/40 rounded-full px-2 py-1">
              <span className="text-[10px] bg-c8l-gold text-black px-1.5 py-0.5 rounded font-bold">ES</span>
            </div>
            <button className="text-[10px] border border-gray-600 rounded-lg px-3 py-1.5 text-gray-300 hover:text-white hover:border-gray-400 transition font-medium">
              CERRAR SESIÓN
            </button>
          </div>
        </div>
      </header>


      {/* ============ CATEGORY FILTERS ============ */}
      <div className="fixed top-14 left-0 right-0 z-40 bg-[#0D0D0D]/95 backdrop-blur-sm border-b border-gray-800/30 px-4 py-2">
        <div className={`flex gap-2 overflow-x-auto no-scrollbar transition-all ${sidebarOpen ? 'ml-52' : 'ml-0'}`}>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-4 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition flex-shrink-0 ${
                filter === cat
                  ? 'bg-white text-black font-bold'
                  : 'bg-[#272727] text-gray-300 hover:bg-[#3a3a3a]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* ============ SIDEBAR ============ */}
      <aside className={`fixed left-0 top-14 bottom-0 w-52 bg-[#0D0D0D] border-r border-gray-800/30 overflow-y-auto z-30 transition-transform duration-300 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } hidden lg:block`}>
        <nav className="p-3 pt-14 space-y-0.5">
          {SIDEBAR_ITEMS.map((item, i) => (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center gap-4 px-3 py-2.5 rounded-lg transition text-sm ${
                i === 0
                  ? 'bg-[#272727] text-white font-medium'
                  : 'text-gray-400 hover:bg-[#1a1a1a] hover:text-white'
              }`}
            >
              <span className="text-base">{item.icon}</span>
              <span className="text-xs">{item.label}</span>
            </Link>
          ))}
          <div className="border-t border-gray-800 my-3" />
          <div className="px-3 py-2">
            <p className="text-[10px] text-gray-600 uppercase tracking-wider mb-2">Suscripciones</p>
            <div className="space-y-1">
              <div className="flex items-center gap-3 py-1.5 text-sm text-gray-400 hover:text-white cursor-pointer transition">
                <span>🧡</span><span className="text-xs">Leo Vela</span>
              </div>
              <div className="flex items-center gap-3 py-1.5 text-sm text-gray-400 hover:text-white cursor-pointer transition">
                <span>⚡</span><span className="text-xs">DJ Rayo</span>
              </div>
              <div className="flex items-center gap-3 py-1.5 text-sm text-gray-400 hover:text-white cursor-pointer transition">
                <span>👑</span><span className="text-xs">Reina Melody</span>
              </div>
              <div className="flex items-center gap-3 py-1.5 text-sm text-gray-400 hover:text-white cursor-pointer transition">
                <span>🎧</span><span className="text-xs">BeatMaster</span>
              </div>
            </div>
          </div>
        </nav>
      </aside>


      {/* ============ MAIN CONTENT GRID ============ */}
      <main className={`pt-[104px] pb-8 transition-all duration-300 ${sidebarOpen ? 'lg:ml-52' : ''}`}>
        <div className="max-w-[1800px] mx-auto px-4 md:px-6">
          {/* Video Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredVideos.map(video => (
              <div
                key={video.id}
                onClick={() => setSelectedVideo(video)}
                className="cursor-pointer group"
              >
                {/* Thumbnail */}
                <div className="relative aspect-video rounded-xl overflow-hidden bg-gray-900">
                  <img
                    src={video.thumbnail}
                    alt={video.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {/* Duration Badge */}
                  <span className="absolute bottom-2 right-2 bg-black/90 text-[11px] px-1.5 py-0.5 rounded font-mono font-medium">
                    {video.duration}
                  </span>
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all" />
                </div>

                {/* Video Info */}
                <div className="flex gap-3 mt-3">
                  {/* Author avatar */}
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-c8l-gold/30 to-amber-900/30 flex items-center justify-center flex-shrink-0 border border-c8l-gold/30 text-sm">
                    {video.authorEmoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-white line-clamp-2 group-hover:text-cyan-400 transition leading-tight">
                      {video.title}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">{video.author}</p>
                    <p className="text-xs text-gray-600">
                      {formatViews(video.views)} views · hace {video.daysAgo} {video.daysAgo === 1 ? 'día' : 'días'}
                    </p>
                  </div>
                </div>

                {/* Quick actions on hover */}
                <div className="flex items-center gap-2 mt-2 opacity-0 group-hover:opacity-100 transition">
                  <button className="text-[10px] text-gray-500 hover:text-white px-2 py-1 bg-gray-800/50 rounded transition">👍 {video.likes}</button>
                  <button className="text-[10px] text-gray-500 hover:text-white px-2 py-1 bg-gray-800/50 rounded transition">💬 {video.comments.length}</button>
                  <button className="text-[10px] text-pink-400 hover:text-pink-300 px-2 py-1 bg-pink-500/10 rounded font-bold transition">🎵 DUET</button>
                </div>
              </div>
            ))}
          </div>

          {/* Empty state */}
          {filteredVideos.length === 0 && (
            <div className="text-center py-20">
              <p className="text-4xl mb-4">🔍</p>
              <p className="text-gray-400 text-lg">No se encontraron videos</p>
              <p className="text-gray-600 text-sm mt-1">Prueba con otra categoría o búsqueda</p>
            </div>
          )}
        </div>
      </main>

      {/* ============ BOT IA WIDGET ============ */}
      <button className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-gradient-to-br from-cyan-400 to-teal-600 flex items-center justify-center shadow-lg shadow-cyan-500/40 hover:scale-110 hover:shadow-cyan-400/60 transition-all z-50 border border-cyan-300/30">
        <span className="text-2xl">🤖</span>
      </button>
    </div>
  )
}
