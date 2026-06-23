'use client'
import Link from 'next/link'
import LegalFooter from '@/components/legal/LegalFooter'

export default function LivesPage() {
  const streams = [
    { id: '1', user: 'DJ_Quantum', viewers: 234, title: 'Sesion Bolero-House', gifts: 45 },
    { id: '2', user: 'NeonGirl', viewers: 189, title: 'Karaoke + retos', gifts: 32 },
    { id: '3', user: 'C8L_Official', viewers: 567, title: 'Torneo Casino Final', gifts: 128 },
    { id: '4', user: 'LeoVela', viewers: 89, title: 'Produccion en directo', gifts: 18 },
  ]
  return (
    <div className="min-h-screen bg-gradient-to-b from-c8l-black via-cyan-950/10 to-c8l-black">
      <header className="glass border-b border-c8l-cyan/20 p-4">
        <div className="max-w-6xl mx-auto flex items-center gap-4">
          <Link href="/" className="text-2xl font-outfit font-bold text-c8l-gold">C8L</Link>
          <span className="text-gray-500">|</span>
          <h1 className="text-xl font-outfit font-semibold text-c8l-cyan">📺 Lives</h1>
        </div>
      </header>
      <main className="max-w-6xl mx-auto p-6">
        <div className="text-center mb-12"><h2 className="text-4xl font-outfit font-bold mb-2">📺 En Directo</h2><p className="text-gray-400">Streaming con regalos y ruleta interactiva.</p></div>
        <div className="grid md:grid-cols-2 gap-6">
          {streams.map(s => (
            <div key={s.id} className="glass rounded-2xl overflow-hidden group cursor-pointer hover:border-c8l-cyan/50 transition">
              <div className="relative h-48 bg-gradient-to-br from-c8l-purple/30 to-c8l-cyan/20 flex items-center justify-center">
                <span className="text-6xl group-hover:scale-110 transition">📺</span>
                <div className="absolute top-3 left-3 flex gap-2"><span className="bg-red-600 text-xs font-bold px-2 py-0.5 rounded animate-pulse">LIVE</span><span className="bg-black/50 text-xs px-2 py-0.5 rounded">👁 {s.viewers}</span></div>
                <div className="absolute top-3 right-3 bg-black/50 text-xs px-2 py-0.5 rounded text-c8l-gold">🎁 {s.gifts}</div>
              </div>
              <div className="p-4"><h3 className="font-semibold group-hover:text-c8l-cyan transition">{s.title}</h3><p className="text-sm text-gray-500">@{s.user}</p></div>
            </div>
          ))}
        </div>
      </main>
      <LegalFooter onOpenModal={() => {}} />
    </div>
  )
}
