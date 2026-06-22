'use client'
import { useState } from 'react'
export function AudioEffects({ onEffectChange }:{onEffectChange:(e:any)=>void}) {
  const [fx,setFx]=useState({reverb:{on:true,mix:30,room:'medium'},eq:{on:true,bass:2,mid:0,treble:-1},comp:{on:true,threshold:-20,ratio:4}})
  const u=(cat:string,key:string,val:any)=>{const n={...fx,[cat]:{...(fx as any)[cat],[key]:val}};setFx(n);onEffectChange(n)}
  const t=(cat:string)=>{const n={...fx,[cat]:{...(fx as any)[cat],on:!(fx as any)[cat].on}};setFx(n);onEffectChange(n)}
  return (
    <div className="bg-black/50 p-6 rounded-2xl border border-c8l-gold/30">
      <h3 className="text-xl font-bold text-c8l-gold mb-4">🔊 Efectos PRO</h3>
      <div className="space-y-3">
        <div className="bg-black/30 p-3 rounded-lg border border-gray-800"><div className="flex justify-between mb-2"><span className="text-sm text-gray-400">🎵 Reverb</span><button onClick={()=>t('reverb')} className={`px-3 py-1 text-xs font-bold rounded ${fx.reverb.on?'bg-c8l-gold text-black':'bg-gray-700 text-gray-400'}`}>{fx.reverb.on?'ON':'OFF'}</button></div>{fx.reverb.on&&<><div className="flex justify-between text-xs text-gray-400"><span>Mix</span><span className="text-c8l-gold">{fx.reverb.mix}%</span></div><input type="range" min={0} max={100} value={fx.reverb.mix} onChange={e=>u('reverb','mix',+e.target.value)} className="w-full h-1.5 bg-gray-700 rounded appearance-none accent-amber-500" /></>}</div>
        <div className="bg-black/30 p-3 rounded-lg border border-gray-800"><div className="flex justify-between mb-2"><span className="text-sm text-gray-400">🎚️ EQ</span><button onClick={()=>t('eq')} className={`px-3 py-1 text-xs font-bold rounded ${fx.eq.on?'bg-c8l-gold text-black':'bg-gray-700 text-gray-400'}`}>{fx.eq.on?'ON':'OFF'}</button></div>{fx.eq.on&&<div className="grid grid-cols-3 gap-2">{(['bass','mid','treble'] as const).map(b=><div key={b}><div className="flex justify-between text-xs text-gray-400"><span>{b}</span><span className="text-c8l-gold">{(fx.eq as any)[b]>0?'+':''}{(fx.eq as any)[b]}</span></div><input type="range" min={-12} max={12} value={(fx.eq as any)[b]} onChange={e=>u('eq',b,+e.target.value)} className="w-full h-1 bg-gray-700 rounded appearance-none accent-amber-500" /></div>)}</div>}</div>
        <div className="flex gap-2">{['Pop','Rock','Jazz','Bolero-House'].map(p=><button key={p} className={`flex-1 py-1.5 text-xs font-bold rounded ${p==='Bolero-House'?'bg-c8l-gold/20 text-c8l-gold border border-c8l-gold':'bg-gray-800 text-gray-400'}`}>{p}</button>)}</div>
      </div>
    </div>
  )
}
