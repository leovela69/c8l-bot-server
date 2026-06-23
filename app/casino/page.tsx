'use client'
import { useState } from 'react'
import Link from 'next/link'
import LegalFooter from '@/components/legal/LegalFooter'
import SlotMachine from '@/components/casino/SlotMachine'
import Roulette from '@/components/casino/Roulette'
import Blackjack from '@/components/casino/Blackjack'

type Game = 'lobby' | 'slots' | 'roulette' | 'blackjack'

export default function CasinoPage() {
  const [game, setGame] = useState<Game>('lobby')
  const [coins, setCoins] = useState(1000)

  return (
    <div className="min-h-screen bg-gradient-to-b from-c8l-black via-purple-950/10 to-c8l-black">
      <header className="glass border-b border-c8l-gold/20 p-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-2xl font-outfit font-bold text-c8l-gold">C8L</Link>
            <span className="text-gray-500">|</span>
            <h1 className="text-xl font-outfit font-semibold">Casino Quantum</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="glass px-4 py-2 rounded-lg">💰 <span className="font-mono font-bold text-c8l-gold">{coins.toLocaleString()}</span> <span className="text-xs text-gray-500">C8L</span></div>
            {game !== 'lobby' && <button onClick={() => setGame('lobby')} className="text-sm text-gray-400 hover:text-white">← Lobby</button>}
          </div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto p-6">
        {game === 'lobby' && (
          <div>
            <div className="text-center mb-12">
              <h2 className="text-4xl font-outfit font-bold neon-gold mb-4">Casino Quantum</h2>
              <p className="text-gray-400">RTP certificado. Juega responsablemente.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { id: 'slots' as Game, name: 'C8L Quantum Slots', icon: '🎰', rtp: '97.3%', min: 10, color: 'from-purple-600 to-pink-600' },
                { id: 'roulette' as Game, name: 'Ruleta C8L', icon: '🎡', rtp: '97.3%', min: 25, color: 'from-red-600 to-yellow-600' },
                { id: 'blackjack' as Game, name: 'Blackjack VIP', icon: '🃏', rtp: '99.5%', min: 50, color: 'from-green-600 to-emerald-600' },
              ].map(g => (
                <button key={g.id} onClick={() => setGame(g.id)} className="casino-card glass rounded-2xl p-6 text-left group">
                  <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${g.color} flex items-center justify-center text-3xl mb-4 group-hover:scale-110 transition`}>{g.icon}</div>
                  <h3 className="text-xl font-outfit font-bold mb-2 group-hover:text-c8l-gold transition">{g.name}</h3>
                  <div className="flex justify-between text-xs"><span className="text-green-400">RTP: {g.rtp}</span><span className="text-gray-500">Min: {g.min} C8L</span></div>
                </button>
              ))}
            </div>
            <div className="mt-12 glass rounded-xl p-4 text-center text-xs text-gray-500">
              ⚠️ Juegos de entretenimiento. Coins C8L sin valor real. RNG certificado. jugarbien.es
            </div>
          </div>
        )}
        {game === 'slots' && <SlotMachine coins={coins} onCoinsChange={setCoins} />}
        {game === 'roulette' && <Roulette coins={coins} onCoinsChange={setCoins} />}
        {game === 'blackjack' && <Blackjack coins={coins} onCoinsChange={setCoins} />}
      </main>
      <LegalFooter onOpenModal={() => {}} />
    </div>
  )
}
