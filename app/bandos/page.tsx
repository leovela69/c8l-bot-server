'use client'
import { useState } from 'react'
import Link from 'next/link'
import LegalFooter from '@/components/legal/LegalFooter'
import BandoProfile from '@/components/bandos/BandoProfile'
import BandoWar from '@/components/bandos/BandoWar'
import BandoRanking from '@/components/bandos/BandoRanking'

type Tab = 'ranking' | 'mibando' | 'guerra' | 'crear'

export default function BandosPage() {
  const [tab, setTab] = useState<Tab>('ranking')
  const [myBando, setMyBando] = useState<string | null>('corazones-de-luz')

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-amber-950/10 to-black">
      <header className="glass border-b border-c8l-gold/20 p-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-2xl font-outfit font-bold text-c8l-gold">C8L</Link>
            <span className="text-gray-500">|</span>
            <h1 className="text-xl font-outfit font-semibold">⚔️ Sistema de Bandos</h1>
          </div>
          <div className="glass px-4 py-2 rounded-lg text-sm">
            🏴 <span className="text-c8l-gold font-bold">Corazones de Luz</span>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="max-w-6xl mx-auto px-6 pt-4">
        <div className="flex gap-2 border-b border-gray-800 pb-2 overflow-x-auto">
          {([
            ['ranking', '🏆 Ranking'],
            ['mibando', '🏴 Mi Bando'],
            ['guerra', '⚔️ Guerra'],
            ['crear', '➕ Crear Bando'],
          ] as [Tab, string][]).map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)}
              className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition ${
                tab === id ? 'bg-c8l-gold text-black' : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <main className="max-w-6xl mx-auto p-6">
        {tab === 'ranking' && <BandoRanking />}
        {tab === 'mibando' && <BandoProfile />}
        {tab === 'guerra' && <BandoWar />}
        {tab === 'crear' && <CrearBando />}
      </main>

      <LegalFooter onOpenModal={() => {}} />
    </div>
  )
}

function CrearBando() {
  const [name, setName] = useState('')
  const [color1, setColor1] = useState('#D4AF37')
  const [color2, setColor2] = useState('#FFFFFF')

  return (
    <div className="max-w-lg mx-auto">
      <div className="glass rounded-2xl p-8">
        <h2 className="text-2xl font-outfit font-bold text-c8l-gold mb-6 text-center">➕ Crear Bando</h2>
        <div className="space-y-4">
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Nombre del bando</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Ej: Corazones de Luz"
              className="w-full bg-black border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:border-c8l-gold" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Color primario</label>
              <input type="color" value={color1} onChange={e => setColor1(e.target.value)} className="w-full h-10 rounded cursor-pointer" />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Color secundario</label>
              <input type="color" value={color2} onChange={e => setColor2(e.target.value)} className="w-full h-10 rounded cursor-pointer" />
            </div>
          </div>
          <div className="glass rounded-xl p-4 text-center">
            <p className="text-sm text-gray-400">Coste de creacion</p>
            <p className="text-2xl font-bold text-c8l-gold">500 C8L Coins</p>
          </div>
          <button disabled={!name} className="w-full py-4 bg-gradient-to-r from-c8l-gold to-amber-500 text-black rounded-xl font-bold text-lg hover:scale-105 transition disabled:opacity-50">
            ⚔️ Fundar Bando
          </button>
        </div>
      </div>
    </div>
  )
}
