'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Providers } from '../providers'
import { useAuth } from '@/lib/auth/context'
import AgeGate from '@/components/auth/AgeGate'
import AppShell from '@/components/layout/AppShell'

const STREAMS = [
  { id: 1, title: 'Bolero-House Production Live', streamer: 'Leo Vela', emoji: '🧡', viewers: 142, thumbnail: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=600&h=340&fit=crop', category: 'Producción Musical', isLive: true },
  { id: 2, title: 'Acid House DJ Set — Saturday Night', streamer: 'DJ Rayo', emoji: '⚡', viewers: 89, thumbnail: 'https://images.unsplash.com/photo-1571330735066-03aaa9429d89?w=600&h=340&fit=crop', category: 'DJ Set', isLive: true },
  { id: 3, title: 'Vocal Recording Session', streamer: 'Reina Melody', emoji: '👑', viewers: 234, thumbnail: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&h=340&fit=crop', category: 'Vocals', isLive: true },
  { id: 4, title: 'Beat Making con Ableton', streamer: 'BeatMaster', emoji: '🎧', viewers: 67, thumbnail: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=600&h=340&fit=crop', category: 'Tutorial', isLive: true },
  { id: 5, title: 'Freestyle Battle Night', streamer: 'MC Fuego', emoji: '🔥', viewers: 0, thumbnail: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=600&h=340&fit=crop', category: 'Freestyle', isLive: false },
  { id: 6, title: 'C8L Radio — 24/7 Music', streamer: 'C8L Bot', emoji: '🤖', viewers: 456, thumbnail: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600&h=340&fit=crop', category: 'Radio', isLive: true },
]

function StreamingContent() {
  const { isAgeVerified, isLoading } = useAuth()
  const [selectedStream, setSelectedStream] = useState<typeof STREAMS[0] | null>(null)

  if (isLoading) return <div className="min-h-screen bg-[#0A0A0A]" />
  if (!isAgeVerified) return <AgeGate />

  const liveStreams = STREAMS.filter(s => s.isLive)
  const upcomingStreams = STREAMS.filter(s => !s.isLive)

  return (
    <AppShell>
      <div className="p-4 md:p-6 pb-20 lg:pb-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-outfit font-bold text-white flex items-center gap-2">
              <span>🎧</span> Streaming
            </h1>
            <p className="text-sm text-gray-400 mt-1">Streams en vivo y radio 24/7</p>
          </div>
          <button className="bg-gradient-to-r from-red-500 to-pink-500 text-white font-bold text-xs px-4 py-2.5 rounded-full hover:opacity-90 transition flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
            INICIAR STREAM
          </button>
        </div>

        {/* Featured Stream */}
        {liveStreams[0] && !selectedStream && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative rounded-2xl overflow-hidden mb-8 cursor-pointer group"
            onClick={() => setSelectedStream(liveStreams[0])}
          >
            <img
              src={liveStreams[0].thumbnail}
              alt={liveStreams[0].title}
              className="w-full h-64 md:h-80 object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
            <div className="absolute top-4 left-4 flex items-center gap-2">
              <span className="flex items-center gap-1 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                LIVE
              </span>
              <span className="bg-black/60 text-white text-[10px] px-2 py-0.5 rounded">
                👁 {liveStreams[0].viewers} viendo
              </span>
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <span className="text-[10px] text-c8l-cyan font-medium">{liveStreams[0].category}</span>
              <h2 className="text-xl md:text-2xl font-outfit font-bold text-white mt-1">{liveStreams[0].title}</h2>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-lg">{liveStreams[0].emoji}</span>
                <span className="text-sm text-gray-300">{liveStreams[0].streamer}</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Stream Player */}
        {selectedStream && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-8"
          >
            <div className="relative aspect-video bg-black rounded-2xl overflow-hidden border border-gray-800">
              <img
                src={selectedStream.thumbnail}
                alt={selectedStream.title}
                className="w-full h-full object-cover opacity-80"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur flex items-center justify-center mb-3 mx-auto">
                    <span className="text-3xl">▶</span>
                  </div>
                  <p className="text-sm text-gray-300">Reproduce el stream</p>
                </div>
              </div>
              <div className="absolute top-4 left-4 flex items-center gap-2">
                <span className="flex items-center gap-1 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  LIVE
                </span>
                <span className="bg-black/60 text-white text-[10px] px-2 py-0.5 rounded">
                  👁 {selectedStream.viewers}
                </span>
              </div>
              <button
                onClick={() => setSelectedStream(null)}
                className="absolute top-4 right-4 bg-black/60 text-white w-8 h-8 rounded-full flex items-center justify-center hover:bg-black/80 transition"
              >
                ✕
              </button>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold">{selectedStream.title}</h3>
                <p className="text-sm text-gray-400">{selectedStream.streamer} • {selectedStream.category}</p>
              </div>
              <div className="flex gap-2">
                <button className="bg-c8l-pink text-white text-xs font-bold px-4 py-2 rounded-full">❤️ Seguir</button>
                <button className="bg-gray-700 text-white text-xs px-4 py-2 rounded-full">💬 Chat</button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Live Streams Grid */}
        <div className="mb-8">
          <h2 className="text-lg font-outfit font-bold text-white flex items-center gap-2 mb-4">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            En Vivo Ahora
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {liveStreams.map((stream, i) => (
              <motion.div
                key={stream.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => setSelectedStream(stream)}
                className="group cursor-pointer"
              >
                <div className="relative aspect-video rounded-xl overflow-hidden border border-gray-800/50 group-hover:border-c8l-purple/50 transition mb-2">
                  <img src={stream.thumbnail} alt={stream.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition" />
                  <div className="absolute top-2 left-2 flex items-center gap-1.5">
                    <span className="flex items-center gap-1 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                      LIVE
                    </span>
                    <span className="bg-black/60 text-white text-[9px] px-1.5 py-0.5 rounded">
                      👁 {stream.viewers}
                    </span>
                  </div>
                </div>
                <h3 className="text-xs font-bold text-white group-hover:text-c8l-cyan transition line-clamp-2">{stream.title}</h3>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-xs">{stream.emoji}</span>
                  <span className="text-[11px] text-gray-400">{stream.streamer}</span>
                  <span className="text-[10px] text-gray-600 ml-auto">{stream.category}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Upcoming */}
        {upcomingStreams.length > 0 && (
          <div>
            <h2 className="text-lg font-outfit font-bold text-white flex items-center gap-2 mb-4">
              <span>📅</span> Próximamente
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {upcomingStreams.map(stream => (
                <div key={stream.id} className="glass rounded-xl p-4 flex items-center gap-4">
                  <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                    <img src={stream.thumbnail} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-bold text-white">{stream.title}</h3>
                    <p className="text-[11px] text-gray-400">{stream.streamer} • {stream.category}</p>
                    <p className="text-[10px] text-c8l-gold mt-1">📅 Programado para hoy 22:00</p>
                  </div>
                  <button className="bg-gray-700 text-xs px-3 py-1.5 rounded-full font-bold hover:bg-gray-600 transition">
                    🔔
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  )
}

export default function StreamingPage() {
  return <Providers><StreamingContent /></Providers>
}
