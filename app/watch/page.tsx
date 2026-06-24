'use client'

import { useState, useRef, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { VIDEOS, getVideoById, getRelatedVideos, VideoData, CommentData } from '@/lib/videos/data'

// ==================== WATCH PAGE (YouTube-style) ====================

function WatchContent() {
  const searchParams = useSearchParams()
  const videoId = searchParams.get('v') || 'v1'
  const video = getVideoById(videoId)
  const relatedVideos = getRelatedVideos(videoId)
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [liked, setLiked] = useState(false)
  const [disliked, setDisliked] = useState(false)
  const [subscribed, setSubscribed] = useState(false)
  const [showFullDescription, setShowFullDescription] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [comments, setComments] = useState<CommentData[]>(video?.comments || [])
  const [likeCount, setLikeCount] = useState(video?.likes || 0)
  const [saved, setSaved] = useState(false)
  const [showShareMenu, setShowShareMenu] = useState(false)
  const [theater, setTheater] = useState(false)

  useEffect(() => {
    if (video) {
      setComments(video.comments)
      setLikeCount(video.likes)
      setLiked(false)
      setDisliked(false)
      setShowFullDescription(false)
    }
  }, [video])

  if (!video) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="text-center">
          <span className="text-6xl mb-4 block">📺</span>
          <h1 className="text-2xl font-outfit font-bold text-white mb-2">Video no encontrado</h1>
          <p className="text-gray-400 mb-6">El video que buscas no existe o fue eliminado.</p>
          <Link href="/" className="px-6 py-3 bg-c8l-pink rounded-full text-sm font-bold hover:bg-c8l-pink/80 transition">
            Volver a C8L TV
          </Link>
        </div>
      </div>
    )
  }

  const handleLike = () => {
    if (liked) {
      setLiked(false)
      setLikeCount(prev => prev - 1)
    } else {
      setLiked(true)
      setDisliked(false)
      setLikeCount(prev => prev + 1)
    }
  }

  const handleDislike = () => {
    if (disliked) {
      setDisliked(false)
    } else {
      setDisliked(true)
      if (liked) {
        setLiked(false)
        setLikeCount(prev => prev - 1)
      }
    }
  }

  const handleComment = () => {
    if (!commentText.trim()) return
    const newComment: CommentData = {
      id: `c_new_${Date.now()}`,
      author: 'Tú',
      authorEmoji: '👤',
      text: commentText,
      likes: 0,
      timeAgo: 'ahora',
    }
    setComments([newComment, ...comments])
    setCommentText('')
  }

  const handleShare = (platform: string) => {
    setShowShareMenu(false)
    // En producción copiaría al clipboard o abriría la app
    alert(`Compartido en ${platform}! 🔗`)
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      {/* Top Navigation */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#0D0D0D] border-b border-gray-800">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-c8l-gold to-c8l-purple flex items-center justify-center">
                <span className="text-sm font-bold">C8L</span>
              </div>
              <div className="hidden md:block">
                <h1 className="text-sm font-outfit font-bold text-white leading-tight">C8L TV</h1>
                <p className="text-[10px] text-gray-500 leading-tight">Corazones Locos</p>
              </div>
            </Link>
          </div>

          {/* Search */}
          <div className="hidden md:flex flex-1 max-w-xl mx-8">
            <div className="flex-1 flex items-center bg-gray-800/60 rounded-full border border-gray-700 overflow-hidden">
              <input
                type="text"
                placeholder="Buscar en C8L TV..."
                className="flex-1 bg-transparent px-4 py-2 text-sm text-white placeholder-gray-500 outline-none"
              />
              <button className="px-4 text-gray-400 hover:text-white transition">🔍</button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-gray-800/60 rounded-full px-3 py-1">
              <span className="text-c8l-gold text-xs">●</span>
              <span className="text-xs font-bold text-white">9999</span>
            </div>
            <button className="text-[10px] border border-gray-600 rounded px-2 py-1 text-gray-300 hover:text-white hover:border-gray-400 transition">
              CERRAR SESIÓN
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className={`pt-14 ${theater ? '' : 'max-w-[1800px] mx-auto'}`}>
        <div className={`flex flex-col ${theater ? '' : 'lg:flex-row'} gap-6 p-4 lg:p-6`}>
          
          {/* Left: Video + Info */}
          <div className={`${theater ? 'w-full' : 'flex-1 lg:max-w-[calc(100%-380px)]'}`}>
            
            {/* Video Player */}
            <div className={`relative bg-black rounded-xl overflow-hidden ${theater ? 'aspect-video max-h-[80vh] mx-auto' : 'aspect-video'}`}>
              <video
                ref={videoRef}
                controls
                autoPlay
                playsInline
                className="w-full h-full object-contain"
                poster={video.thumbnail}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
              >
                <source src={video.videoUrl} type="video/mp4" />
              </video>
            </div>

            {/* Video Title */}
            <h1 className="text-lg md:text-xl font-outfit font-bold text-white mt-4 leading-tight">
              {video.title}
            </h1>

            {/* Video Meta + Actions */}
            <div className="flex flex-wrap items-center justify-between gap-4 mt-3 pb-4 border-b border-gray-800">
              {/* Views + Date */}
              <div className="text-sm text-gray-400">
                {video.views.toLocaleString()} visualizaciones • hace {video.daysAgo} {video.daysAgo === 1 ? 'día' : 'días'}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* Like/Dislike */}
                <div className="flex items-center bg-gray-800 rounded-full overflow-hidden">
                  <button
                    onClick={handleLike}
                    className={`flex items-center gap-1.5 px-4 py-2 text-sm transition ${
                      liked ? 'text-c8l-cyan' : 'text-gray-300 hover:text-white'
                    }`}
                  >
                    <span>{liked ? '👍' : '👍'}</span>
                    <span className="font-medium">{likeCount}</span>
                  </button>
                  <div className="w-px h-6 bg-gray-700" />
                  <button
                    onClick={handleDislike}
                    className={`flex items-center gap-1.5 px-4 py-2 text-sm transition ${
                      disliked ? 'text-red-400' : 'text-gray-300 hover:text-white'
                    }`}
                  >
                    <span>👎</span>
                  </button>
                </div>

                {/* Share */}
                <div className="relative">
                  <button
                    onClick={() => setShowShareMenu(!showShareMenu)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-gray-800 rounded-full text-sm text-gray-300 hover:text-white transition"
                  >
                    <span>↗️</span> <span>Compartir</span>
                  </button>
                  {showShareMenu && (
                    <div className="absolute top-full mt-2 right-0 bg-gray-900 border border-gray-700 rounded-xl p-3 z-50 w-48 shadow-xl">
                      <button onClick={() => handleShare('WhatsApp')} className="w-full text-left px-3 py-2 text-sm hover:bg-gray-800 rounded-lg transition">📱 WhatsApp</button>
                      <button onClick={() => handleShare('Twitter')} className="w-full text-left px-3 py-2 text-sm hover:bg-gray-800 rounded-lg transition">🐦 Twitter</button>
                      <button onClick={() => handleShare('Telegram')} className="w-full text-left px-3 py-2 text-sm hover:bg-gray-800 rounded-lg transition">✈️ Telegram</button>
                      <button onClick={() => handleShare('Copiar link')} className="w-full text-left px-3 py-2 text-sm hover:bg-gray-800 rounded-lg transition">🔗 Copiar link</button>
                    </div>
                  )}
                </div>

                {/* Save */}
                <button
                  onClick={() => setSaved(!saved)}
                  className={`flex items-center gap-1.5 px-4 py-2 bg-gray-800 rounded-full text-sm transition ${
                    saved ? 'text-c8l-gold' : 'text-gray-300 hover:text-white'
                  }`}
                >
                  <span>{saved ? '📌' : '💾'}</span> <span>{saved ? 'Guardado' : 'Guardar'}</span>
                </button>

                {/* Theater */}
                <button
                  onClick={() => setTheater(!theater)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-gray-800 rounded-full text-sm text-gray-300 hover:text-white transition"
                >
                  <span>🖥️</span> <span className="hidden sm:inline">{theater ? 'Normal' : 'Teatro'}</span>
                </button>

                {/* Duet Challenge */}
                <button className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-c8l-pink to-c8l-purple rounded-full text-sm font-bold text-white hover:opacity-90 transition">
                  <span>🎵</span> <span>Duet Challenge</span>
                </button>
              </div>
            </div>

            {/* Channel Info + Subscribe */}
            <div className="flex items-center justify-between gap-4 mt-4 pb-4 border-b border-gray-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-c8l-gold/50 to-c8l-purple/50 flex items-center justify-center text-lg">
                  {video.authorEmoji}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold text-white">{video.author}</span>
                    <span className="text-[10px] bg-gray-700 px-1.5 py-0.5 rounded text-gray-300">✓</span>
                  </div>
                  <span className="text-xs text-gray-500">{video.authorSubscribers} suscriptores</span>
                </div>
              </div>
              <button
                onClick={() => setSubscribed(!subscribed)}
                className={`px-5 py-2 rounded-full text-sm font-bold transition ${
                  subscribed
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-white text-black hover:bg-gray-200'
                }`}
              >
                {subscribed ? '✓ Suscrito' : 'Suscribirse'}
              </button>
            </div>

            {/* Description */}
            <div className="mt-4 bg-gray-800/40 rounded-xl p-4">
              <div className={`text-sm text-gray-300 whitespace-pre-line ${showFullDescription ? '' : 'line-clamp-3'}`}>
                {video.description}
              </div>
              <button
                onClick={() => setShowFullDescription(!showFullDescription)}
                className="text-xs font-bold text-gray-400 hover:text-white mt-2 transition"
              >
                {showFullDescription ? 'Mostrar menos' : 'Mostrar más...'}
              </button>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mt-3">
                {video.tags.map(tag => (
                  <span key={tag} className="text-xs bg-gray-700/50 text-c8l-cyan px-2 py-0.5 rounded-full">
                    #{tag.replace(/\s/g, '')}
                  </span>
                ))}
              </div>
            </div>

            {/* Comments Section */}
            <div className="mt-8">
              <h3 className="text-base font-bold mb-4">{comments.length} Comentarios</h3>
              
              {/* Comment Input */}
              <div className="flex gap-3 mb-6">
                <div className="w-9 h-9 rounded-full bg-gray-700 flex items-center justify-center text-sm flex-shrink-0">👤</div>
                <div className="flex-1">
                  <input
                    type="text"
                    value={commentText}
                    onChange={e => setCommentText(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleComment()}
                    placeholder="Añade un comentario..."
                    className="w-full bg-transparent border-b border-gray-700 pb-2 text-sm text-white placeholder-gray-500 outline-none focus:border-c8l-cyan transition"
                  />
                  {commentText && (
                    <div className="flex justify-end gap-2 mt-2">
                      <button onClick={() => setCommentText('')} className="px-4 py-1.5 text-sm text-gray-400 hover:text-white rounded-full transition">
                        Cancelar
                      </button>
                      <button onClick={handleComment} className="px-4 py-1.5 text-sm bg-c8l-cyan text-black font-bold rounded-full hover:bg-c8l-cyan/80 transition">
                        Comentar
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Comments List */}
              <div className="space-y-5">
                {comments.map(comment => (
                  <CommentComponent key={comment.id} comment={comment} />
                ))}
              </div>
            </div>
          </div>

          {/* Right Sidebar: Related Videos */}
          {!theater && (
            <aside className="w-full lg:w-[360px] flex-shrink-0">
              <h3 className="text-sm font-bold text-gray-400 uppercase mb-4">Videos Relacionados</h3>
              <div className="space-y-3">
                {relatedVideos.map(rv => (
                  <RelatedVideoCard key={rv.id} video={rv} />
                ))}
              </div>

              {/* Channel Videos */}
              <div className="mt-8 p-4 bg-gray-800/30 rounded-xl border border-gray-800">
                <h4 className="text-sm font-bold mb-3 flex items-center gap-2">
                  <span>{video.authorEmoji}</span> Más de {video.author}
                </h4>
                <div className="space-y-3">
                  {VIDEOS.filter(v => v.author === video.author && v.id !== video.id).slice(0, 3).map(rv => (
                    <RelatedVideoCard key={rv.id} video={rv} compact />
                  ))}
                </div>
              </div>
            </aside>
          )}
        </div>

        {/* Footer */}
        <footer className="border-t border-gray-800 mt-8 py-6 px-6 text-center">
          <p className="text-[10px] text-gray-600">© 2026 C.8.L. Agency (Corazones Locos Family). Todos los derechos reservados.</p>
        </footer>
      </main>
    </div>
  )
}

// ==================== SUB-COMPONENTS ====================

function CommentComponent({ comment }: { comment: CommentData }) {
  const [liked, setLiked] = useState(false)
  const [likes, setLikes] = useState(comment.likes)

  return (
    <div className="flex gap-3">
      <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-sm flex-shrink-0">
        {comment.authorEmoji}
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-white">@{comment.author}</span>
          <span className="text-[10px] text-gray-500">{comment.timeAgo}</span>
        </div>
        <p className="text-sm text-gray-300 mt-1">{comment.text}</p>
        <div className="flex items-center gap-4 mt-2">
          <button
            onClick={() => { setLiked(!liked); setLikes(liked ? likes - 1 : likes + 1) }}
            className={`flex items-center gap-1 text-xs transition ${liked ? 'text-c8l-cyan' : 'text-gray-500 hover:text-white'}`}
          >
            <span>👍</span> <span>{likes}</span>
          </button>
          <button className="text-xs text-gray-500 hover:text-white transition">👎</button>
          <button className="text-xs text-gray-500 hover:text-white transition">Responder</button>
        </div>
      </div>
    </div>
  )
}

function RelatedVideoCard({ video, compact }: { video: VideoData; compact?: boolean }) {
  return (
    <Link href={`/watch?v=${video.id}`} className="flex gap-3 group cursor-pointer">
      <div className={`relative rounded-lg overflow-hidden flex-shrink-0 ${compact ? 'w-28 h-16' : 'w-40 h-24'}`}>
        <img
          src={video.thumbnail}
          alt={video.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute bottom-1 right-1 bg-black/80 text-[9px] px-1 py-0.5 rounded text-white font-mono">
          {video.duration}
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-xs font-bold text-white leading-tight line-clamp-2 group-hover:text-c8l-cyan transition">
          {video.title}
        </h4>
        <p className="text-[10px] text-gray-500 mt-1">{video.author}</p>
        <p className="text-[10px] text-gray-500">
          {video.views.toLocaleString()} vistas • hace {video.daysAgo}d
        </p>
      </div>
    </Link>
  )
}

// ==================== EXPORT ====================

export default function WatchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">📺</div>
          <p className="text-gray-400 text-sm">Cargando video...</p>
        </div>
      </div>
    }>
      <WatchContent />
    </Suspense>
  )
}
