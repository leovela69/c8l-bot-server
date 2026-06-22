'use client'
import { useState } from 'react'
import Link from 'next/link'
import LegalFooter from '@/components/legal/LegalFooter'

export default function KaraokePage() {
  const [singing, setSinging] = useState(false)
  const [energy, setEnergy] = useState(0)
  const [pitch, setPitch] = useState(50)
  const [score, setScore] = useState(0)

  const songs = [
    { id: '1', title: 'Bolero de Noche', artist: 'C8L Agency', difficulty: 'Media' },
    { id: '2', title: 'Corazones Locos', artist: 'Leo Vela', difficulty: 'Facil' },
    { id: '3', title: 'Quantum Love', artist: 'C8L', difficulty: 'Dificil' },
    { id: '4', title: 'Noches de Neon', artist: 'C8L Agency', difficulty: 'Media' },
  ]

  const startSinging = () => {
    setSinging(true); setScore(0); setEnergy(0)
    const iv = setInterval(() => {
      setEnergy(p => Math.min(100, p + Math.random() * 15))
      setPitch(50 + (Math.random() - 0.5) * 40)
      setScore(p => p + Math.floor(Math.random() * 10))
    }, 500)
    setTimeout(() => { clearInterval(iv); setSinging(false) }, 10000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-c8l-black via-pink-950/10 to-c8l-black">
      <header className="glass border-b border-c8l-pink/20 p-4">
        <div className="max-w-6xl mx-auto flex items-center gap-4">
          <Link href="/" className="text-2xl font-outfit font-bold text-c8l-gold">C8L</Link>
          <span className="text-gray-500">|</span>
          <h1 className="text-xl font-outfit font-semibold text-c8l-pink">🎤 Karaoke</h1>
        </div>
      </header>
      <main className="max-w-4xl mx-auto p-6">
        {!singing ? (
          <div>
            <div className="text-center mb-8"><h2 className="text-4xl font-outfit font-bold mb-2">🎤 Sala de Canto</h2><p className="text-gray-400">Medidores de tono y energia en tiempo real.</p></div>
            <div className="space-y-3">
              {songs.map(s => (
                <button key={s.id} onClick={startSinging} className="w-full glass rounded-xl p-4 flex items-center justify-between hover:border-c8l-pink/50 transition group">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-c8l-pink to-c8l-purple flex items-center justify-center text-xl group-hover:scale-110 transition">🎵</div>
                    <div className="text-left"><h3 className="font-semibold">{s.title}</h3><p className="text-xs text-gray-500">{s.artist}</p></div>
                  </div>
                  <span className={`text-xs px-3 py-1 rounded-full ${s.difficulty==='Facil'?'bg-green-900/50 text-green-400':s.difficulty==='Media'?'bg-yellow-900/50 text-yellow-400':'bg-red-900/50 text-red-400'}`}>{s.difficulty}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="glass rounded-2xl p-8">
            <h3 className="text-2xl font-outfit font-bold text-center text-c8l-pink mb-8">🎤 Cantando...</h3>
            <div className="mb-6"><div className="flex justify-between text-xs text-gray-500 mb-1"><span>Tono</span><span>{Math.round(pitch)}%</span></div><div className="h-4 bg-gray-800 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-c8l-cyan to-c8l-purple rounded-full transition-all" style={{width:`${pitch}%`}} /></div></div>
            <div className="mb-6"><div className="flex justify-between text-xs text-gray-500 mb-1"><span>Energia</span><span>{Math.round(energy)}%</span></div><div className="h-4 bg-gray-800 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-c8l-pink to-c8l-gold rounded-full transition-all" style={{width:`${energy}%`}} /></div></div>
            <div className="text-center"><div className="text-5xl font-outfit font-bold text-c8l-gold neon-gold">{score}</div><p className="text-sm text-gray-500">Puntos</p></div>
            <div className="mt-8 flex justify-center gap-1">{Array.from({length:20}).map((_,i) => <div key={i} className="w-2 bg-gradient-to-t from-c8l-pink to-c8l-purple rounded-full" style={{height:`${20+Math.random()*40}px`}} />)}</div>
          </div>
        )}
      </main>
      <LegalFooter onOpenModal={() => {}} />
    </div>
  )
}
