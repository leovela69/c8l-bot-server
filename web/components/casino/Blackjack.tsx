'use client'
import { useState, useCallback } from 'react'

const SUITS = ['♠','♥','♦','♣']
const VALUES = ['A','2','3','4','5','6','7','8','9','10','J','Q','K']
interface Card { suit: string; value: string; hidden?: boolean }
interface Props { coins: number; onCoinsChange: (c: number) => void }

export default function Blackjack({ coins, onCoinsChange }: Props) {
  const [state, setState] = useState<'bet'|'play'|'done'>('bet')
  const [player, setPlayer] = useState<Card[]>([])
  const [dealer, setDealer] = useState<Card[]>([])
  const [bet, setBet] = useState(50)
  const [msg, setMsg] = useState('')
  const [win, setWin] = useState(0)

  const draw = (hidden=false): Card => ({ suit: SUITS[Math.floor(Math.random()*4)], value: VALUES[Math.floor(Math.random()*13)], hidden })
  const handValue = (hand: Card[]) => {
    let v=0, aces=0
    for (const c of hand) { if(c.hidden) continue; if(c.value==='A'){aces++;v+=11} else if(['K','Q','J'].includes(c.value))v+=10; else v+=parseInt(c.value) }
    while(v>21&&aces>0){v-=10;aces--}
    return v
  }

  const deal = useCallback(() => {
    if(coins<bet) return
    onCoinsChange(coins-bet); setWin(0); setMsg('')
    const p=[draw(),draw()], d=[draw(),draw(true)]
    setPlayer(p); setDealer(d); setState('play')
    if(handValue(p)===21) { d[1].hidden=false; setDealer([...d]); const w=Math.floor(bet*2.5); setWin(w); onCoinsChange(coins-bet+w); setMsg('🎉 BLACKJACK! x2.5'); setState('done') }
  }, [coins, bet, onCoinsChange])

  const hit = useCallback(() => {
    const h=[...player, draw()]; setPlayer(h)
    if(handValue(h)>21) { dealer[1].hidden=false; setDealer([...dealer]); setMsg('💥 Te pasaste!'); setState('done') }
  }, [player, dealer])

  const stand = useCallback(() => {
    const d=[...dealer]; d[1].hidden=false
    while(handValue(d)<17) d.push(draw())
    setDealer(d)
    const pv=handValue(player), dv=handValue(d)
    if(dv>21) { const w=bet*2; setWin(w); onCoinsChange(coins+w); setMsg(`🎉 Dealer se pasa! +${w}`) }
    else if(pv>dv) { const w=bet*2; setWin(w); onCoinsChange(coins+w); setMsg(`🎉 Ganaste! +${w}`) }
    else if(pv===dv) { onCoinsChange(coins+bet); setMsg('🤝 Empate') }
    else setMsg(`😔 Dealer gana (${dv} vs ${pv})`)
    setState('done')
  }, [dealer, player, bet, coins, onCoinsChange])

  const renderCard = (c: Card, i: number) => c.hidden
    ? <div key={i} className="w-14 h-20 rounded-lg bg-gradient-to-br from-c8l-purple to-c8l-gold flex items-center justify-center text-xl border border-gray-600">🂠</div>
    : <div key={i} className="w-14 h-20 rounded-lg bg-white flex flex-col items-center justify-center border shadow-lg">
        <span className={`text-sm font-bold ${c.suit==='♥'||c.suit==='♦'?'text-red-600':'text-black'}`}>{c.value}</span>
        <span className={`text-lg ${c.suit==='♥'||c.suit==='♦'?'text-red-600':'text-black'}`}>{c.suit}</span>
      </div>

  return (
    <div className="max-w-lg mx-auto">
      <h2 className="text-3xl font-outfit font-bold text-center mb-8 neon-gold">🃏 Blackjack VIP</h2>
      <div className="glass rounded-2xl p-8">
        {state==='bet' ? (
          <div className="text-center space-y-6">
            <p className="text-gray-400">Haz tu apuesta</p>
            <div className="flex items-center justify-center gap-4">
              <button onClick={() => setBet(Math.max(50,bet-50))} className="w-10 h-10 rounded-full bg-gray-800 font-bold">-</button>
              <div className="glass px-6 py-2 rounded-lg min-w-[120px]"><div className="text-xs text-gray-500">Apuesta</div><div className="text-xl font-mono font-bold text-c8l-gold">{bet} C8L</div></div>
              <button onClick={() => setBet(Math.min(coins,bet+50))} className="w-10 h-10 rounded-full bg-gray-800 font-bold">+</button>
            </div>
            <button onClick={deal} disabled={coins<bet} className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-500 rounded-xl font-bold text-xl hover:scale-105 transition">🃏 REPARTIR</button>
          </div>
        ) : (
          <div className="space-y-6">
            <div><div className="flex justify-between text-sm text-gray-400 mb-2"><span>Dealer</span><span className="font-mono text-c8l-cyan">{handValue(dealer)}</span></div><div className="flex gap-2 justify-center">{dealer.map(renderCard)}</div></div>
            <div className="border-t border-gray-700" />
            <div><div className="flex justify-between text-sm text-gray-400 mb-2"><span>Tu mano</span><span className="font-mono text-c8l-gold">{handValue(player)}</span></div><div className="flex gap-2 justify-center">{player.map(renderCard)}</div></div>
            {msg && <div className={`text-center font-bold text-lg ${win>0?'text-c8l-gold neon-gold':'text-gray-400'}`}>{msg}</div>}
            {state==='play' && <div className="flex gap-4"><button onClick={hit} className="flex-1 py-3 bg-blue-600 rounded-xl font-bold hover:bg-blue-500">👆 Pedir</button><button onClick={stand} className="flex-1 py-3 bg-red-600 rounded-xl font-bold hover:bg-red-500">✋ Plantarse</button></div>}
            {state==='done' && <button onClick={() => {setState('bet');setPlayer([]);setDealer([]);setMsg('')}} className="w-full py-3 bg-gradient-to-r from-c8l-purple to-c8l-gold rounded-xl font-bold hover:scale-105 transition">🔄 Nueva mano</button>}
          </div>
        )}
      </div>
    </div>
  )
}
