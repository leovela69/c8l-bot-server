'use client'
import Link from 'next/link'
import LegalFooter from '@/components/legal/LegalFooter'

export default function BandosPage() {
  const factions = [
    { name: 'Los Dorados', icon: '👑', members: 45, level: 8, power: 8750, color: 'from-yellow-600 to-amber-500' },
    { name: 'Sombras Neon', icon: '🌙', members: 38, level: 7, power: 7200, color: 'from-purple-600 to-indigo-600' },
    { name: 'Fuego Digital', icon: '🔥', members: 52, level: 9, power: 9100, color: 'from-red-600 to-orange-500' },
    { name: 'Cyber Wolves', icon: '🐺', members: 29, level: 6, power: 5800, color: 'from-cyan-600 to-blue-600' },
  ]
  const roles = ['👑 Lider','⚔️ Capitan','🛡️ Veterano','⚡ Soldado','🌱 Recluta']
  return (
    <div className="min-h-screen bg-gradient-to-b from-c8l-black via-amber-950/10 to-c8l-black">
      <header className="glass border-b border-c8l-gold/20 p-4">
        <div className="max-w-6xl mx-auto flex items-center gap-4">
          <Link href="/" className="text-2xl font-outfit font-bold text-c8l-gold">C8L</Link>
          <span className="text-gray-500">|</span>
          <h1 className="text-xl font-outfit font-semibold text-c8l-gold">⚔️ Bandos</h1>
        </div>
      </header>
      <main className="max-w-6xl mx-auto p-6">
        <div className="text-center mb-12"><h2 className="text-4xl font-outfit font-bold neon-gold mb-2">⚔️ Bandos</h2><p className="text-gray-400">Unete a una familia. Sube de nivel. Conquista.</p></div>
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {factions.map((f,i) => (
            <div key={f.name} className="glass rounded-2xl p-6 hover:scale-[1.02] transition cursor-pointer">
              <div className="flex items-center gap-4 mb-4">
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center text-2xl`}>{f.icon}</div>
                <div className="flex-1"><div className="flex items-center gap-2"><span className="text-xs text-gray-500">#{i+1}</span><h3 className="font-outfit font-bold text-lg">{f.name}</h3></div><p className="text-xs text-gray-500">Nivel {f.level} • {f.members} miembros</p></div>
                <div className="text-right"><div className="text-lg font-mono font-bold text-c8l-gold">{f.power.toLocaleString()}</div><div className="text-xs text-gray-500">Poder</div></div>
              </div>
              <div className="h-2 bg-gray-800 rounded-full overflow-hidden"><div className={`h-full rounded-full bg-gradient-to-r ${f.color}`} style={{width:`${f.power/100}%`}} /></div>
            </div>
          ))}
        </div>
        <div className="glass rounded-2xl p-8 text-center"><h3 className="text-2xl font-outfit font-bold text-c8l-gold mb-4">Jerarquia</h3><div className="flex flex-wrap justify-center gap-4">{roles.map(r => <div key={r} className="bg-black/30 rounded-xl px-4 py-2 text-sm">{r}</div>)}</div></div>
      </main>
      <LegalFooter onOpenModal={() => {}} />
    </div>
  )
}
