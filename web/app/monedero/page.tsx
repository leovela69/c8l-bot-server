'use client'
import Link from 'next/link'
import LegalFooter from '@/components/legal/LegalFooter'

export default function MonederoPage() {
  const transactions = [
    { type: '🎉', desc: 'Jackpot Slots x25', amount: 2500, date: '22/06/2026' },
    { type: '💸', desc: 'Regalo: Corona', amount: -500, date: '22/06/2026' },
    { type: '🎉', desc: 'Blackjack VIP', amount: 1000, date: '21/06/2026' },
    { type: '⭐', desc: 'Mision: Primer Live', amount: 200, date: '21/06/2026' },
    { type: '💸', desc: 'Apuesta Ruleta', amount: -250, date: '20/06/2026' },
  ]
  return (
    <div className="min-h-screen bg-gradient-to-b from-c8l-black via-amber-950/5 to-c8l-black">
      <header className="glass border-b border-c8l-gold/20 p-4">
        <div className="max-w-6xl mx-auto flex items-center gap-4">
          <Link href="/" className="text-2xl font-outfit font-bold text-c8l-gold">C8L</Link>
          <span className="text-gray-500">|</span>
          <h1 className="text-xl font-outfit font-semibold">💰 Monedero</h1>
        </div>
      </header>
      <main className="max-w-4xl mx-auto p-6">
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="glass rounded-xl p-6 text-center border border-c8l-gold/30"><div className="text-3xl mb-2">💰</div><div className="text-2xl font-mono font-bold text-c8l-gold">12,500</div><div className="text-xs text-gray-500">Coins C8L</div></div>
          <div className="glass rounded-xl p-6 text-center border border-c8l-purple/30"><div className="text-3xl mb-2">💎</div><div className="text-2xl font-mono font-bold text-c8l-purple">45</div><div className="text-xs text-gray-500">Diamantes</div></div>
          <div className="glass rounded-xl p-6 text-center border border-c8l-cyan/30"><div className="text-3xl mb-2">🎫</div><div className="text-2xl font-mono font-bold text-c8l-cyan">230</div><div className="text-xs text-gray-500">BID</div></div>
        </div>
        <div className="glass rounded-2xl p-6">
          <h3 className="font-outfit font-bold text-lg mb-4">Movimientos</h3>
          <div className="space-y-3">{transactions.map((t,i) => <div key={i} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0"><div className="flex items-center gap-3"><span className="text-xl">{t.type}</span><div><p className="text-sm font-medium">{t.desc}</p><p className="text-xs text-gray-500">{t.date}</p></div></div><span className={`font-mono font-bold ${t.amount>0?'text-green-400':'text-red-400'}`}>{t.amount>0?'+':''}{t.amount} C8L</span></div>)}</div>
        </div>
      </main>
      <LegalFooter onOpenModal={() => {}} />
    </div>
  )
}
