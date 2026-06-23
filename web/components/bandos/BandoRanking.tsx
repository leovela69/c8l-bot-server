'use client'

const BANDOS = [
  { rank: 1, name: 'Corazones de Luz', icon: '☀️', pts: 12450, wins: 234, members: '48/50', badge: '👑', color: 'border-c8l-gold' },
  { rank: 2, name: 'Almas Locas', icon: '🌑', pts: 11890, wins: 221, members: '50/50', badge: '🔥', color: 'border-purple-500' },
  { rank: 3, name: 'C8L Elite', icon: '⚡', pts: 10200, wins: 198, members: '45/50', badge: '⚡', color: 'border-cyan-500' },
  { rank: 4, name: 'Neon Wolves', icon: '🐺', pts: 8900, wins: 167, members: '40/50', badge: '🐺', color: 'border-blue-500' },
  { rank: 5, name: 'Fuego Digital', icon: '🔥', pts: 7500, wins: 145, members: '38/50', badge: '🔥', color: 'border-red-500' },
  { rank: 6, name: 'Shadow Kings', icon: '👤', pts: 6200, wins: 120, members: '35/50', badge: '🖤', color: 'border-gray-500' },
]

export default function BandoRanking() {
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-outfit font-bold neon-gold">🏆 Ranking Global de Bandos</h2>
        <p className="text-gray-400 text-sm mt-2">Clasificacion actualizada cada hora. Guerras los viernes.</p>
      </div>

      <div className="space-y-3">
        {BANDOS.map(b => (
          <div key={b.rank} className={`glass rounded-xl p-4 flex items-center gap-4 border ${b.color} hover:scale-[1.01] transition cursor-pointer`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-lg ${
              b.rank === 1 ? 'bg-c8l-gold text-black' : b.rank === 2 ? 'bg-gray-300 text-black' : b.rank === 3 ? 'bg-amber-700 text-white' : 'bg-gray-800 text-gray-400'
            }`}>
              #{b.rank}
            </div>
            <div className="text-3xl">{b.icon}</div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-outfit font-bold">{b.name}</h3>
                <span className="text-lg">{b.badge}</span>
              </div>
              <div className="flex gap-4 text-xs text-gray-500">
                <span>👥 {b.members}</span>
                <span>⚔️ {b.wins} victorias</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xl font-mono font-bold text-c8l-gold">{b.pts.toLocaleString()}</div>
              <div className="text-xs text-gray-500">puntos</div>
            </div>
          </div>
        ))}
      </div>

      {/* Info box */}
      <div className="glass rounded-xl p-4 text-center text-xs text-gray-500">
        <p>⚔️ Guerras de Bandos: Cada viernes. 48h de duracion.</p>
        <p>🏆 Ganador: 2,000 C8L + Skin exclusiva | MVP: 500 C8L + Titulo</p>
        <p>📊 Puntos: Victoria miembro +10 | Victoria bando +25 | Guerra +50/miembro</p>
      </div>
    </div>
  )
}
