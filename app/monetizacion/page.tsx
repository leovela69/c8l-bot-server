'use client'

import { useState } from 'react'
import Link from 'next/link'
import LegalFooter from '@/components/legal/LegalFooter'

export default function MonetizacionPage() {
  const [tab, setTab] = useState<'roi' | 'ingresos' | 'planes' | 'afiliados'>('roi')

  return (
    <div className="min-h-screen bg-gradient-to-b from-c8l-black via-amber-950/10 to-c8l-black">
      <header className="glass border-b border-c8l-gold/20 p-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-2xl font-outfit font-bold text-c8l-gold">C8L</Link>
            <span className="text-gray-500">|</span>
            <h1 className="text-xl font-outfit font-semibold text-c8l-gold">💰 Monetización</h1>
          </div>
          <Link href="/" className="text-xs text-gray-400 hover:text-white transition">← Volver a C8L TV</Link>
        </div>
      </header>

      {/* Tabs */}
      <div className="max-w-6xl mx-auto px-6 pt-4">
        <div className="flex gap-2 border-b border-gray-800 pb-2 overflow-x-auto">
          {([
            ['roi', '📊 Calculadora ROI'],
            ['ingresos', '💵 Mis Ingresos'],
            ['planes', '⭐ Planes Creator'],
            ['afiliados', '🤝 Afiliados'],
          ] as [string, string][]).map(([id, label]) => (
            <button key={id} onClick={() => setTab(id as any)}
              className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition ${
                tab === id ? 'bg-c8l-gold text-black' : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <main className="max-w-6xl mx-auto p-6">
        {tab === 'roi' && <ROICalculator />}
        {tab === 'ingresos' && <MisIngresos />}
        {tab === 'planes' && <PlanesCreator />}
        {tab === 'afiliados' && <Afiliados />}
      </main>

      <LegalFooter onOpenModal={() => {}} />
    </div>
  )
}

function ROICalculator() {
  const [videos, setVideos] = useState(10)
  const [viewsPerVideo, setViewsPerVideo] = useState(1000)
  const [engagement, setEngagement] = useState(5)
  const [subscribers, setSubscribers] = useState(500)
  const [plan, setPlan] = useState<'free' | 'pro' | 'elite'>('free')

  const cpmRates = { free: 2.5, pro: 5.0, elite: 8.5 }
  const cpm = cpmRates[plan]

  const totalViews = videos * viewsPerVideo
  const monthlyAdRevenue = (totalViews / 1000) * cpm
  const tipsEstimate = totalViews * (engagement / 100) * 0.05
  const affiliateEstimate = subscribers * 0.02 * 15
  const totalMonthly = monthlyAdRevenue + tipsEstimate + affiliateEstimate
  const totalYearly = totalMonthly * 12

  return (
    <div>
      <div className="text-center mb-8">
        <h2 className="text-3xl font-outfit font-bold text-c8l-gold mb-2">📊 Calculadora ROI</h2>
        <p className="text-gray-400 text-sm">Estima tus ingresos potenciales en C8L Agency</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Controls */}
        <div className="space-y-5">
          <div className="glass rounded-xl p-5">
            <label className="text-sm text-gray-400 flex justify-between mb-2">
              <span>🎬 Videos por mes</span>
              <span className="text-c8l-gold font-bold">{videos}</span>
            </label>
            <input type="range" min={1} max={60} value={videos}
              onChange={e => setVideos(Number(e.target.value))}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-amber-500" />
          </div>

          <div className="glass rounded-xl p-5">
            <label className="text-sm text-gray-400 flex justify-between mb-2">
              <span>👁 Views promedio por video</span>
              <span className="text-c8l-gold font-bold">{viewsPerVideo.toLocaleString()}</span>
            </label>
            <input type="range" min={100} max={100000} step={100} value={viewsPerVideo}
              onChange={e => setViewsPerVideo(Number(e.target.value))}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-amber-500" />
          </div>

          <div className="glass rounded-xl p-5">
            <label className="text-sm text-gray-400 flex justify-between mb-2">
              <span>💬 Engagement rate (%)</span>
              <span className="text-c8l-gold font-bold">{engagement}%</span>
            </label>
            <input type="range" min={1} max={25} value={engagement}
              onChange={e => setEngagement(Number(e.target.value))}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500" />
          </div>

          <div className="glass rounded-xl p-5">
            <label className="text-sm text-gray-400 flex justify-between mb-2">
              <span>👥 Suscriptores</span>
              <span className="text-c8l-gold font-bold">{subscribers.toLocaleString()}</span>
            </label>
            <input type="range" min={50} max={50000} step={50} value={subscribers}
              onChange={e => setSubscribers(Number(e.target.value))}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-500" />
          </div>

          <div className="glass rounded-xl p-5">
            <label className="text-sm text-gray-400 mb-3 block">⭐ Tu plan</label>
            <div className="grid grid-cols-3 gap-2">
              {(['free', 'pro', 'elite'] as const).map(p => (
                <button key={p} onClick={() => setPlan(p)}
                  className={`py-2 rounded-lg text-xs font-bold transition ${
                    plan === p
                      ? 'bg-c8l-gold text-black'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}>
                  {p === 'free' ? 'Free' : p === 'pro' ? 'Pro' : 'Elite'}
                  <div className="text-[10px] mt-0.5 opacity-70">CPM ${cpmRates[p]}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="space-y-4">
          <div className="glass rounded-2xl p-6 border border-c8l-gold/30">
            <h3 className="text-lg font-bold text-center mb-6 text-c8l-gold">Estimación de Ingresos</h3>

            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-gray-800">
                <span className="text-sm text-gray-400">📺 Ingresos por Ads</span>
                <span className="text-lg font-bold text-green-400">${monthlyAdRevenue.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-gray-800">
                <span className="text-sm text-gray-400">🎁 Tips / Propinas</span>
                <span className="text-lg font-bold text-purple-400">${tipsEstimate.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-gray-800">
                <span className="text-sm text-gray-400">🤝 Programa Afiliados</span>
                <span className="text-lg font-bold text-cyan-400">${affiliateEstimate.toFixed(2)}</span>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-c8l-gold/30">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-bold">Total MENSUAL</span>
                <span className="text-2xl font-outfit font-black text-c8l-gold">${totalMonthly.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold">Total ANUAL</span>
                <span className="text-xl font-outfit font-bold text-green-400">${totalYearly.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="glass rounded-xl p-4">
            <h4 className="text-xs font-bold text-gray-400 mb-3">📊 Desglose</h4>
            <div className="space-y-2">
              <ProgressBar label="Ads" value={monthlyAdRevenue} max={totalMonthly} color="bg-green-500" />
              <ProgressBar label="Tips" value={tipsEstimate} max={totalMonthly} color="bg-purple-500" />
              <ProgressBar label="Afiliados" value={affiliateEstimate} max={totalMonthly} color="bg-cyan-500" />
            </div>
          </div>

          <div className="glass rounded-xl p-4 text-center">
            <p className="text-[10px] text-gray-500">
              * Estimaciones basadas en promedios del mercado. Los resultados reales pueden variar. 
              CPM depende de la region, nicho y calidad del contenido.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function ProgressBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0
  return (
    <div>
      <div className="flex justify-between text-[10px] text-gray-400 mb-1">
        <span>{label}</span>
        <span>{pct.toFixed(0)}%</span>
      </div>
      <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

function MisIngresos() {
  const history = [
    { month: 'Junio 2026', ads: 45.20, tips: 12.50, affiliate: 8.00, total: 65.70 },
    { month: 'Mayo 2026', ads: 38.90, tips: 9.30, affiliate: 5.50, total: 53.70 },
    { month: 'Abril 2026', ads: 22.10, tips: 6.80, affiliate: 3.20, total: 32.10 },
    { month: 'Marzo 2026', ads: 15.40, tips: 4.20, affiliate: 1.80, total: 21.40 },
  ]

  return (
    <div>
      <div className="text-center mb-8">
        <h2 className="text-3xl font-outfit font-bold text-c8l-gold mb-2">💵 Mis Ingresos</h2>
        <p className="text-gray-400 text-sm">Historial de ganancias en la plataforma</p>
      </div>

      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <div className="glass rounded-xl p-5 text-center border border-green-500/30">
          <div className="text-3xl font-outfit font-bold text-green-400">$65.70</div>
          <div className="text-xs text-gray-500 mt-1">Este mes</div>
        </div>
        <div className="glass rounded-xl p-5 text-center border border-c8l-gold/30">
          <div className="text-3xl font-outfit font-bold text-c8l-gold">$172.90</div>
          <div className="text-xs text-gray-500 mt-1">Total acumulado</div>
        </div>
        <div className="glass rounded-xl p-5 text-center border border-c8l-purple/30">
          <div className="text-3xl font-outfit font-bold text-c8l-purple">+23%</div>
          <div className="text-xs text-gray-500 mt-1">Crecimiento mensual</div>
        </div>
      </div>

      <div className="glass rounded-xl p-6">
        <h3 className="font-bold mb-4">Historial</h3>
        <div className="space-y-3">
          {history.map((h, i) => (
            <div key={i} className="flex items-center justify-between py-3 border-b border-gray-800 last:border-0">
              <span className="text-sm font-medium">{h.month}</span>
              <div className="flex items-center gap-4 text-xs">
                <span className="text-green-400">Ads: ${h.ads}</span>
                <span className="text-purple-400">Tips: ${h.tips}</span>
                <span className="text-cyan-400">Afil: ${h.affiliate}</span>
                <span className="font-bold text-c8l-gold text-sm">${h.total}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function PlanesCreator() {
  return (
    <div>
      <div className="text-center mb-8">
        <h2 className="text-3xl font-outfit font-bold text-c8l-gold mb-2">⭐ Planes Creator</h2>
        <p className="text-gray-400 text-sm">Elige tu plan y maximiza tus ganancias</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Free */}
        <div className="glass rounded-2xl p-6 border border-gray-700">
          <div className="text-center mb-6">
            <h3 className="text-xl font-bold">Free</h3>
            <div className="text-3xl font-outfit font-black text-white mt-2">$0<span className="text-sm text-gray-500">/mes</span></div>
          </div>
          <ul className="space-y-3 text-sm text-gray-400">
            <li>✅ Subir videos ilimitados</li>
            <li>✅ CPM base: $2.50</li>
            <li>✅ Monetización por tips</li>
            <li>✅ Perfil de creador</li>
            <li>❌ Sin analytics avanzados</li>
            <li>❌ Sin prioridad en algoritmo</li>
          </ul>
          <button className="w-full mt-6 py-3 border border-gray-600 rounded-xl text-sm font-bold text-gray-400 hover:border-white hover:text-white transition">
            Plan Actual
          </button>
        </div>

        {/* Pro */}
        <div className="glass rounded-2xl p-6 border border-c8l-purple/50 relative">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-c8l-purple px-3 py-0.5 rounded-full text-[10px] font-bold">
            POPULAR
          </div>
          <div className="text-center mb-6">
            <h3 className="text-xl font-bold text-c8l-purple">Pro</h3>
            <div className="text-3xl font-outfit font-black text-white mt-2">$9.99<span className="text-sm text-gray-500">/mes</span></div>
          </div>
          <ul className="space-y-3 text-sm text-gray-300">
            <li>✅ Todo de Free</li>
            <li>✅ CPM: $5.00 (x2)</li>
            <li>✅ Analytics avanzados</li>
            <li>✅ Prioridad en algoritmo</li>
            <li>✅ Badge verificado</li>
            <li>❌ Sin manager personal</li>
          </ul>
          <button className="w-full mt-6 py-3 bg-gradient-to-r from-c8l-purple to-c8l-pink rounded-xl text-sm font-bold text-white hover:scale-105 transition">
            Upgrade a Pro
          </button>
        </div>

        {/* Elite */}
        <div className="glass rounded-2xl p-6 border border-c8l-gold/50">
          <div className="text-center mb-6">
            <h3 className="text-xl font-bold text-c8l-gold">Elite</h3>
            <div className="text-3xl font-outfit font-black text-white mt-2">$29.99<span className="text-sm text-gray-500">/mes</span></div>
          </div>
          <ul className="space-y-3 text-sm text-gray-300">
            <li>✅ Todo de Pro</li>
            <li>✅ CPM: $8.50 (x3.4)</li>
            <li>✅ Manager personal</li>
            <li>✅ Colaboraciones VIP</li>
            <li>✅ Revenue share 80/20</li>
            <li>✅ Estudio C8L gratis</li>
          </ul>
          <button className="w-full mt-6 py-3 bg-gradient-to-r from-c8l-gold to-amber-500 rounded-xl text-sm font-bold text-black hover:scale-105 transition">
            Ir a Elite
          </button>
        </div>
      </div>
    </div>
  )
}

function Afiliados() {
  return (
    <div>
      <div className="text-center mb-8">
        <h2 className="text-3xl font-outfit font-bold text-c8l-gold mb-2">🤝 Programa de Afiliados</h2>
        <p className="text-gray-400 text-sm">Invita creadores y gana comisiones</p>
      </div>

      <div className="glass rounded-2xl p-8 max-w-lg mx-auto text-center mb-8">
        <h3 className="font-bold mb-4">Tu enlace de referido</h3>
        <div className="bg-black rounded-lg p-3 flex items-center gap-2">
          <code className="text-sm text-c8l-cyan flex-1 truncate">https://c8lagency.web.app/ref/leovela</code>
          <button className="px-3 py-1 bg-c8l-gold/20 text-c8l-gold text-xs font-bold rounded hover:bg-c8l-gold/30 transition">
            Copiar
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-3">Ganas 15% de las ganancias de cada creador que invites durante 12 meses</p>
      </div>

      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <div className="glass rounded-xl p-5 text-center">
          <div className="text-3xl font-bold text-c8l-gold">3</div>
          <div className="text-xs text-gray-500 mt-1">Referidos activos</div>
        </div>
        <div className="glass rounded-xl p-5 text-center">
          <div className="text-3xl font-bold text-green-400">$23.40</div>
          <div className="text-xs text-gray-500 mt-1">Comisiones este mes</div>
        </div>
        <div className="glass rounded-xl p-5 text-center">
          <div className="text-3xl font-bold text-c8l-purple">$89.20</div>
          <div className="text-xs text-gray-500 mt-1">Total acumulado</div>
        </div>
      </div>

      <div className="glass rounded-xl p-6">
        <h3 className="font-bold mb-4">Tus referidos</h3>
        <div className="space-y-3">
          {[
            { name: 'DJ_Rayo', since: 'Mayo 2026', earned: '$34.50', status: 'Activo' },
            { name: 'BeatMaker99', since: 'Abril 2026', earned: '$28.70', status: 'Activo' },
            { name: 'NeonGirl', since: 'Junio 2026', earned: '$26.00', status: 'Activo' },
          ].map((r, i) => (
            <div key={i} className="flex items-center justify-between py-3 border-b border-gray-800 last:border-0">
              <div>
                <span className="text-sm font-medium">@{r.name}</span>
                <span className="text-[10px] text-gray-500 ml-2">desde {r.since}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-green-400 font-bold">{r.earned}</span>
                <span className="text-[10px] bg-green-900/30 text-green-400 px-2 py-0.5 rounded-full">{r.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
