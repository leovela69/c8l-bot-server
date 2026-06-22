'use client'
import Link from 'next/link'
import LegalFooter from '@/components/legal/LegalFooter'

export default function TVPage() {
  const content = [
    { id: '1', type: '🎬', title: 'Produccion Bolero-House', author: 'LeoVela', likes: 234, views: 1200 },
    { id: '2', type: '🎤', title: 'Cover: La Bamba Remix', author: 'DJ_Quantum', likes: 189, views: 890 },
    { id: '3', type: '📚', title: 'Como ganar en Ruleta', author: 'ProGamer', likes: 567, views: 3400 },
    { id: '4', type: '🎵', title: 'Beat: Neon Nights', author: 'C8L_Beats', likes: 412, views: 2100 },
    { id: '5', type: '🎮', title: 'Jackpot x50!!', author: 'Lucky777', likes: 89, views: 670 },
    { id: '6', type: '📺', title: 'Replay: Torneo Final', author: 'C8L_Official', likes: 345, views: 4500 },
  ]
  const challenges = [
    { title: 'Mejor cover de la semana', reward: '500 C8L', deadline: '3 dias', participants: 12 },
    { title: 'Duelo: Mejor produccion', reward: '1000 C8L', deadline: '5 dias', participants: 8 },
    { title: 'Torneo Casino Champions', reward: '5000 C8L', deadline: '7 dias', participants: 32 },
  ]
  return (
    <div className="min-h-screen bg-gradient-to-b from-c8l-black via-purple-950/10 to-c8l-black">
      <header className="glass border-b border-c8l-purple/20 p-4">
        <div className="max-w-6xl mx-auto flex items-center gap-4">
          <Link href="/" className="text-2xl font-outfit font-bold text-c8l-gold">C8L</Link>
          <span className="text-gray-500">|</span>
          <h1 className="text-xl font-outfit font-semibold text-c8l-purple">📱 C8L TV</h1>
        </div>
      </header>
      <main className="max-w-6xl mx-auto p-6">
        <div className="text-center mb-12"><h2 className="text-4xl font-outfit font-bold neon-purple mb-2">📱 C8L TV</h2><p className="text-gray-400">Contenido, retos y duelos.</p></div>
        <div className="mb-12"><h3 className="text-xl font-semibold mb-4 text-c8l-gold">🏆 Retos Activos</h3><div className="grid md:grid-cols-3 gap-4">{challenges.map((c,i) => <div key={i} className="glass rounded-xl p-4 hover:border-c8l-gold/50 transition cursor-pointer"><h4 className="font-semibold mb-2">{c.title}</h4><div className="flex justify-between text-xs text-gray-500 mb-2"><span>⏰ {c.deadline}</span><span>👥 {c.participants}</span></div><div className="text-sm text-c8l-gold font-bold">🎁 {c.reward}</div></div>)}</div></div>
        <h3 className="text-xl font-semibold mb-4 text-c8l-purple">📺 Feed</h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">{content.map(c => <div key={c.id} className="glass rounded-xl overflow-hidden group cursor-pointer hover:border-c8l-purple/50 transition"><div className="h-32 bg-gradient-to-br from-c8l-purple/20 to-c8l-pink/10 flex items-center justify-center text-4xl group-hover:scale-110 transition">{c.type}</div><div className="p-4"><h4 className="font-semibold text-sm mb-1">{c.title}</h4><p className="text-xs text-gray-500 mb-2">@{c.author}</p><div className="flex gap-3 text-xs text-gray-500"><span>❤️ {c.likes}</span><span>👁 {c.views}</span></div></div></div>)}</div>
      </main>
      <LegalFooter onOpenModal={() => {}} />
    </div>
  )
}
