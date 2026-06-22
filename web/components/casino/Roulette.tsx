'use client'
import { useState, useCallback } from 'react'

const RED = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]
type BetType = 'red'|'black'|'even'|'odd'|'low'|'high'|'number'
interface Props { coins: number; onCoinsChange: (c: number) => void }

export default function Roulette({ coins, onCoinsChange }: Props) {
  const [spinning, setSpinning] = useState(false)
  const [result, setResult] = useState<number|null>(null)
  const [bet, setBet] = useState(25)
  const [betType, setBetType] = useState<BetType>('red')
  const [betNum, setBetNum] = useState(7)
  const [msg, setMsg] = useState('')
  const [win, setWin] = useState(0)
  const [history, setHistory] = useState<number[]>([])

  const getColor = (n: number) => n===0?'bg-green-600':RED.includes(n)?'bg-red-600':'bg-gray-900'

  const spin = useCallback(() => {
    if (spinning || coins < bet) return
    setSpinning(true); onCoinsChange(coins-bet); setMsg(''); setWin(0)
    let count = 0
    const iv = setInterval(() => {
      setResult(Math.floor(Math.random()*37))
      if (++count > 30) {
        clearInterval(iv); setSpinning(false)
        const n = Math.floor(Math.random()*37)
        setResult(n); setHistory(h => [n,...h.slice(0,9)])
        let w = 0
        const isRed = RED.includes(n)
        if (betType==='red'&&isRed) w=bet*2
        else if (betType==='black'&&n!==0&&!isRed) w=bet*2
        else if (betType==='even'&&n!==0&&n%2===0) w=bet*2
        else if (betType==='odd'&&n%2===1) w=bet*2
        else if (betType==='low'&&n>=1&&n<=18) w=bet*2
        else if (betType==='high'&&n>=19) w=bet*2
        else if (betType==='number'&&n===betNum) w=bet*36
        if (w>0) { setWin(w); onCoinsChange(coins-bet+w); setMsg(`🎉 ${n}! +${w} C8L`) }
        else setMsg(`Numero: ${n}`)
      }
    }, 60)
  }, [spinning, coins, bet, betType, betNum, onCoinsChange])

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-3xl font-outfit font-bold text-center mb-8 neon-gold">🎡 Ruleta C8L</h2>
      <div className="glass rounded-2xl p-8 mb-6">
        <div className={`w-32 h-32 mx-auto rounded-full border-4 border-c8l-gold flex items-center justify-center mb-6 ${spinning?'roulette-spinning':''}`}>
          {result!==null ? <div className={`w-24 h-24 rounded-full ${getColor(result)} flex items-center justify-center`}><span className="text-3xl font-bold">{result}</span></div> : <span className="text-4xl">🎡</span>}
        </div>
        {msg && <div className={`text-center text-lg font-bold mb-4 ${win>0?'text-c8l-gold neon-gold':'text-gray-400'}`}>{msg}</div>}
        {history.length>0 && <div className="flex justify-center gap-1 mb-4">{history.map((n,i) => <div key={i} className={`w-7 h-7 rounded-full ${getColor(n)} flex items-center justify-center text-xs font-bold`}>{n}</div>)}</div>}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {([['red','🔴 Rojo'],['black','⚫ Negro'],['even','Par'],['odd','Impar'],['low','1-18'],['high','19-36']] as [BetType,string][]).map(([t,l]) => (
            <button key={t} onClick={() => setBetType(t)} disabled={spinning}
              className={`p-2 rounded-lg text-sm font-semibold ${betType===t?'bg-c8l-gold text-black':'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}>{l}<div className="text-xs opacity-70">x2</div></button>
          ))}
        </div>
        <div className="flex items-center justify-center gap-3 mb-4">
          <button onClick={() => setBetType('number')} className={`px-4 py-2 rounded-lg text-sm ${betType==='number'?'bg-c8l-purple text-white':'bg-gray-800 text-gray-300'}`}>Numero (x36)</button>
          {betType==='number' && <input type="number" min={0} max={36} value={betNum} onChange={e => setBetNum(Number(e.target.value))} className="w-16 bg-black border border-c8l-gold/30 rounded px-2 py-1 text-center" />}
        </div>
        <div className="flex items-center justify-center gap-4 mb-6">
          <button onClick={() => setBet(Math.max(25,bet-25))} className="w-10 h-10 rounded-full bg-gray-800 font-bold" disabled={spinning}>-</button>
          <div className="glass px-6 py-2 rounded-lg min-w-[120px] text-center"><div className="text-xs text-gray-500">Apuesta</div><div className="text-xl font-mono font-bold text-c8l-gold">{bet} C8L</div></div>
          <button onClick={() => setBet(Math.min(coins,bet+25))} className="w-10 h-10 rounded-full bg-gray-800 font-bold" disabled={spinning}>+</button>
        </div>
        <button onClick={spin} disabled={spinning||coins<bet} className={`w-full py-4 rounded-xl font-bold text-xl transition-all ${spinning?'bg-gray-700 text-gray-400':'bg-gradient-to-r from-red-600 to-c8l-gold hover:scale-105 text-white'}`}>
          {spinning ? '⏳ Girando...' : '🎡 GIRAR RULETA'}
        </button>
      </div>
    </div>
  )
}
