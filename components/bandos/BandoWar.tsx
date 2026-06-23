'use client'
import { useState, useEffect } from 'react'

export default function BandoWar() {
  const [timeLeft, setTimeLeft] = useState('12:34:56')
  const [score, setScore] = useState({ light: 120, dark: 95 })
  const [chat, setChat] = useState([
    { user: '@LunaC8L', msg: 'Buen movimiento, @CrazyRider!' },
    { user: '@Masters8L', msg: 'Ataca el flanco, estan debiles' },
    { user: '@C8L_Ceo', msg: 'Mantened la presion, vamos!' },
    { user: '@CrazyRider', msg: 'Caballo a f3, vamos!' },
  ])
  const [spectators, setSpectators] = useState(342)

  // Simular tablero con piezas = jugadores
  const board = [
    ['🗼','🏍️','🧠','🌙','👑','🎯','🛡️','🏰'],
    ['⭐','🌟','✨','💫','⚡','🔥','💀','🖤'],
    ['','','','','','','',''],
    ['','','','','','','',''],
    ['','','','','','','',''],
    ['','','','','','','',''],
    ['♟️','♟️','♟️','♟️','♟️','♟️','♟️','♟️'],
    ['♜','♞','♝','♛','♚','♝','♞','♜'],
  ]

  // Captured pieces
  const captured = {
    light: ['♟️', '♟️'],
    dark: ['⭐'],
  }

  return (
    <div className="space-y-6">
      {/* War Header */}
      <div className="glass rounded-2xl p-6 border-2 border-red-500/30 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-c8l-gold via-red-500 to-purple-500" />

        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-2xl border-2 border-c8l-gold">☀️</div>
            <div>
              <div className="font-bold text-c8l-gold">Corazones de Luz</div>
              <div className="text-xs text-gray-500">Blancas</div>
            </div>
          </div>

          <div className="text-center">
            <div className="text-3xl font-black">
              <span className="text-c8l-gold">{score.light}</span>
              <span className="text-gray-500 mx-2">-</span>
              <span className="text-purple-400">{score.dark}</span>
            </div>
            <div className="text-xs text-gray-500">⏳ {timeLeft} restante</div>
            <div className="flex items-center justify-center gap-2 mt-1">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <span className="text-[10px] text-red-400 font-bold">EN DIRECTO</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div>
              <div className="font-bold text-purple-400 text-right">Almas Locas</div>
              <div className="text-xs text-gray-500 text-right">Negras</div>
            </div>
            <div className="w-12 h-12 rounded-full bg-purple-900/30 flex items-center justify-center text-2xl border-2 border-purple-500">🌑</div>
          </div>
        </div>

        {/* Viewers */}
        <div className="flex justify-center gap-4 text-xs text-gray-500">
          <span>👁️ {spectators} espectadores</span>
          <span>💬 {chat.length} mensajes</span>
        </div>
      </div>

      {/* Tablero con piezas = jugadores */}
      <div className="glass rounded-2xl p-6">
        <h3 className="text-lg font-outfit font-bold text-center mb-4 text-c8l-gold">♟️ Tablero de Guerra</h3>
        <p className="text-xs text-gray-400 text-center mb-4">Cada pieza es un miembro del bando. Los avatares se mueven en tiempo real.</p>

        <div className="flex justify-center">
          <div className="grid grid-cols-8 gap-0.5 p-2 bg-black/50 rounded-xl border border-c8l-gold/20">
            {board.map((row, ri) => row.map((cell, ci) => {
              const isLight = (ri + ci) % 2 === 0
              return (
                <div key={`${ri}-${ci}`}
                  className={`w-12 h-12 flex items-center justify-center text-xl rounded-sm transition-all hover:scale-110 cursor-pointer ${
                    isLight ? 'bg-amber-100/10' : 'bg-amber-900/20'
                  } ${cell ? 'hover:bg-c8l-gold/20' : ''}`}>
                  {cell && (
                    <div className="relative group">
                      <span className="text-lg">{cell}</span>
                      {/* Tooltip con nombre */}
                      {ri < 2 && (
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/90 text-[8px] text-c8l-gold px-1.5 py-0.5 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition z-10">
                          {['@Veteran','@CrazyR','@Master','@Luna','@CEO','@Tactic','@Defend','@Tower'][ci]}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            }))}
          </div>
        </div>

        {/* Captured */}
        <div className="flex justify-between mt-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Capturadas:</span>
            {captured.light.map((p, i) => <span key={i} className="text-lg opacity-40">{p}</span>)}
          </div>
          <div className="flex items-center gap-2">
            {captured.dark.map((p, i) => <span key={i} className="text-lg opacity-40">{p}</span>)}
            <span className="text-xs text-gray-500">:Capturadas</span>
          </div>
        </div>
      </div>

      {/* Chat en vivo */}
      <div className="glass rounded-2xl p-6">
        <h3 className="text-sm font-bold text-gray-400 mb-3">💬 Chat del Bando (en vivo)</h3>
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {chat.map((c, i) => (
            <div key={i} className="flex gap-2 text-sm">
              <span className="text-c8l-gold font-bold text-xs">{c.user}:</span>
              <span className="text-gray-300">{c.msg}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 flex gap-2">
          <input placeholder="Escribe al bando..." className="flex-1 bg-black/50 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-c8l-gold" />
          <button className="px-4 py-2 bg-c8l-gold text-black font-bold rounded-lg text-sm">Enviar</button>
        </div>
      </div>

      {/* War rewards */}
      <div className="glass rounded-xl p-4">
        <h4 className="text-xs font-bold text-gray-400 mb-2">🏆 Recompensas de Guerra</h4>
        <div className="grid grid-cols-3 gap-3 text-center text-xs">
          <div className="bg-black/30 p-3 rounded-lg">
            <div className="text-c8l-gold font-bold mb-1">Bando Ganador</div>
            <div>2,000 C8L + Skin exclusiva</div>
          </div>
          <div className="bg-black/30 p-3 rounded-lg">
            <div className="text-purple-400 font-bold mb-1">MVP</div>
            <div>500 C8L + Titulo &quot;Legado&quot;</div>
          </div>
          <div className="bg-black/30 p-3 rounded-lg">
            <div className="text-gray-400 font-bold mb-1">Perdedor</div>
            <div>500 C8L (consuelo)</div>
          </div>
        </div>
      </div>
    </div>
  )
}
