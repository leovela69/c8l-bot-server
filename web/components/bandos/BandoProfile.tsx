'use client'

const PIECES = [
  { piece: '👑', role: 'Rey', name: '@C8L_Ceo', elo: 2850, perm: 'Fundador' },
  { piece: '🌙', role: 'Reina', name: '@LunaC8L', elo: 2790, perm: 'Mano derecha' },
  { piece: '🧠', role: 'Alfil 1', name: '@Masters8L', elo: 2745, perm: 'Estratega Jefe' },
  { piece: '🎯', role: 'Alfil 2', name: '@TacticPro', elo: 2680, perm: 'Estratega' },
  { piece: '🏍️', role: 'Caballo 1', name: '@CrazyRider', elo: 2650, perm: 'Cmdte Ataque' },
  { piece: '🛡️', role: 'Caballo 2', name: '@Defensor', elo: 2600, perm: 'Cmdte Defensa' },
  { piece: '🏰', role: 'Torre 1', name: '@Veteran_01', elo: 2400, perm: 'Guardian Flanco' },
  { piece: '🗼', role: 'Torre 2', name: '@Loyal_One', elo: 2350, perm: 'Guardian Centro' },
  { piece: '⭐', role: 'Peon 1', name: '@FanC8L_01', elo: 1800, perm: 'Soldado' },
  { piece: '🌟', role: 'Peon 2', name: '@FanC8L_02', elo: 1750, perm: 'Soldado' },
  { piece: '✨', role: 'Peon 3', name: '@FanC8L_03', elo: 1700, perm: 'Soldado' },
  { piece: '💫', role: 'Peon 4', name: '@FanC8L_04', elo: 1680, perm: 'Soldado' },
]

const ACHIEVEMENTS = [
  { icon: '🏆', name: 'Invictos', desc: '5 guerras seguidas ganadas' },
  { icon: '👑', name: 'Rey de la Colina', desc: 'Top 1 global' },
  { icon: '🤝', name: 'Hermandad Dorada', desc: 'Todos con 50+ partidas' },
]

export default function BandoProfile() {
  return (
    <div className="space-y-6">
      {/* Header del bando */}
      <div className="glass rounded-2xl p-6 border border-c8l-gold/30">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-xl flex items-center justify-center text-4xl" style={{ background: 'linear-gradient(135deg, #D4AF37, #FFFFFF20)' }}>
              ☀️
            </div>
            <div>
              <h2 className="text-2xl font-outfit font-bold text-white">Corazones de Luz</h2>
              <p className="text-sm text-gray-400">👑 Fundador: @C8L_Ceo</p>
              <div className="flex gap-4 mt-2 text-xs text-gray-500">
                <span>🏅 12,450 pts</span>
                <span>📊 #1 Global</span>
                <span>👥 48/50</span>
                <span>⚔️ 234 victorias</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-400 mb-1">Colores</div>
            <div className="flex gap-1">
              <div className="w-6 h-6 rounded-full border border-gray-600" style={{ background: '#FFFFFF' }} />
              <div className="w-6 h-6 rounded-full border border-gray-600" style={{ background: '#D4AF37' }} />
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3 mt-6">
          <div className="bg-black/30 p-3 rounded-lg text-center">
            <div className="text-xl font-bold text-c8l-gold">234</div>
            <div className="text-[10px] text-gray-500">Victorias</div>
          </div>
          <div className="bg-black/30 p-3 rounded-lg text-center">
            <div className="text-xl font-bold text-red-400">45</div>
            <div className="text-[10px] text-gray-500">Derrotas</div>
          </div>
          <div className="bg-black/30 p-3 rounded-lg text-center">
            <div className="text-xl font-bold text-green-400">83%</div>
            <div className="text-[10px] text-gray-500">Win Rate</div>
          </div>
          <div className="bg-black/30 p-3 rounded-lg text-center">
            <div className="text-xl font-bold text-purple-400">5</div>
            <div className="text-[10px] text-gray-500">Racha</div>
          </div>
        </div>
      </div>

      {/* Piezas = Miembros */}
      <div className="glass rounded-2xl p-6">
        <h3 className="text-lg font-outfit font-bold text-c8l-gold mb-4">♟️ Piezas del Bando (Miembros Activos)</h3>
        <p className="text-xs text-gray-400 mb-4">Cada pieza es un jugador real. Tu avatar aparece en el tablero durante las guerras.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {PIECES.map((p, i) => (
            <div key={i} className={`flex items-center gap-3 p-3 rounded-lg border transition hover:scale-[1.02] cursor-pointer ${
              i < 2 ? 'bg-c8l-gold/10 border-c8l-gold/30' :
              i < 8 ? 'bg-purple-900/10 border-purple-500/20' :
              'bg-gray-900/50 border-gray-700'
            }`}>
              <div className="text-2xl w-10 text-center">{p.piece}</div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm">{p.name}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-800 text-gray-400">{p.role}</span>
                </div>
                <div className="text-[10px] text-gray-500">{p.perm} • ELO: {p.elo}</div>
              </div>
              <div className="text-xs text-c8l-gold font-mono">{p.elo}</div>
            </div>
          ))}
        </div>

        <p className="text-[10px] text-gray-600 mt-3 text-center">
          Los peones se rotan semanalmente segun actividad. Todos tienen oportunidad de ascender.
        </p>
      </div>

      {/* Logros */}
      <div className="glass rounded-2xl p-6">
        <h3 className="text-lg font-outfit font-bold text-c8l-gold mb-4">🏆 Logros del Bando</h3>
        <div className="grid grid-cols-3 gap-3">
          {ACHIEVEMENTS.map((a, i) => (
            <div key={i} className="bg-black/30 rounded-xl p-4 text-center border border-c8l-gold/20">
              <div className="text-3xl mb-2">{a.icon}</div>
              <div className="font-bold text-sm">{a.name}</div>
              <div className="text-[10px] text-gray-500">{a.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Proxima guerra */}
      <div className="glass rounded-2xl p-6 border border-red-500/20">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-red-400">⚔️ Proxima Guerra</h3>
            <p className="text-sm text-gray-400">vs &quot;Almas Locas&quot; — Viernes 20:00</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-white">3 dias</div>
            <div className="text-xs text-gray-500">para el combate</div>
          </div>
        </div>
      </div>
    </div>
  )
}
