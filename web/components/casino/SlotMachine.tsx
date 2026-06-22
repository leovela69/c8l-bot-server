'use client'
import { useState, useCallback } from 'react'

const SYMBOLS = ['🍒','🍋','🍊','🍇','💎','7️⃣','🔔','⭐','👑']
interface Props { coins: number; onCoinsChange: (c: number) => void }

export default function SlotMachine({ coins, onCoinsChange }: Props) {
  const [reels, setReels] = useState(['⭐','💎','🍒'])
  const [spinning, setSpinning] = useState(false)
  const [bet, setBet] = useState(10)
  const [msg, setMsg] = useState('')
  const [win, setWin] = useState(0)

  const spin = useCallback(() => {
    if (spinning || coins < bet) return
    setSpinning(true); onCoinsChange(coins - bet); setWin(0); setMsg('')
    let count = 0
    const iv = setInterval(() => {
      setReels([SYMBOLS[Math.floor(Math.random()*9)],SYMBOLS[Math.floor(Math.random()*9)],SYMBOLS[Math.floor(Math.random()*9)]])
      if (++count > 20) {
        clearInterval(iv); setSpinning(false)
        const r = [SYMBOLS[Math.floor(Math.random()*9)],SYMBOLS[Math.floor(Math.random()*9)],SYMBOLS[Math.floor(Math.random()*9)]]
        // RTP ~30% win rate
        const rand = Math.random()
        if (rand < 0.01) { r[0]=r[1]=r[2]='👑' }
        else if (rand < 0.05) { r[0]=r[1]=r[2]='💎' }
        else if (rand < 0.12) { r[0]=r[1]=r[2]=SYMBOLS[Math.floor(Math.random()*9)] }
        setReels(r)
        if (r[0]===r[1]&&r[1]===r[2]) {
          const mult = r[0]==='👑'?50:r[0]==='💎'?25:r[0]==='7️⃣'?15:5
          const w = bet*mult; setWin(w); onCoinsChange(coins-bet+w); setMsg(`🎉 x${mult} — +${w} C8L!`)
        }
      }
    }, 80)
  }, [spinning, coins, bet, onCoinsChange])

  return (
    <div className="max-w-lg mx-auto">
      <h2 className="text-3xl font-outfit font-bold text-center mb-8 neon-purple">🎰 C8L Quantum Slots</h2>
      <div className="glass rounded-2xl p-8 mb-6">
        <div className="flex justify-center gap-4 mb-6">
          {reels.map((s,i) => <div key={i} className={`w-24 h-24 bg-black/50 rounded-xl border-2 ${win>0?'border-c8l-gold animate-glow':'border-c8l-gold/30'} flex items-center justify-center text-5xl ${spinning?'animate-pulse':''}`}>{s}</div>)}
        </div>
        {msg && <div className={`text-center text-lg font-bold mb-4 ${win>0?'text-c8l-gold neon-gold':'text-gray-400'}`}>{msg}</div>}
        <div className="flex items-center justify-center gap-4 mb-6">
          <button onClick={() => setBet(Math.max(10,bet-10))} className="w-10 h-10 rounded-full bg-gray-800 font-bold" disabled={spinning}>-</button>
          <div className="glass px-6 py-2 rounded-lg text-center min-w-[120px]"><div className="text-xs text-gray-500">Apuesta</div><div className="text-xl font-mono font-bold text-c8l-gold">{bet} C8L</div></div>
          <button onClick={() => setBet(Math.min(coins,bet+10))} className="w-10 h-10 rounded-full bg-gray-800 font-bold" disabled={spinning}>+</button>
        </div>
        <button onClick={spin} disabled={spinning||coins<bet} className={`w-full py-4 rounded-xl font-bold text-xl transition-all ${spinning?'bg-gray-700 text-gray-400':'bg-gradient-to-r from-c8l-purple to-c8l-gold hover:scale-105 text-white'}`}>
          {spinning ? '⏳ Girando...' : '🎰 GIRAR'}
        </button>
      </div>
    </div>
  )
}
