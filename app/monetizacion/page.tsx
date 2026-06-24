'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Providers } from '../providers'
import { useAuth } from '@/lib/auth/context'
import AgeGate from '@/components/auth/AgeGate'
import AppShell from '@/components/layout/AppShell'

const PRODUCTS = [
  { id: 1, name: 'Beat Pack Vol. 1', desc: '10 beats Bolero-House originales', price: 500, icon: '🎵', category: 'beats' },
  { id: 2, name: 'Logo C8L Custom', desc: 'Logo personalizado con IA', price: 300, icon: '🎨', category: 'design' },
  { id: 3, name: 'VIP Membership', desc: 'Acceso total 30 días', price: 1000, icon: '👑', category: 'membership' },
  { id: 4, name: 'Skin Ajedrez Gold', desc: 'Tablero dorado exclusivo', price: 200, icon: '♟️', category: 'skins' },
  { id: 5, name: 'Masterclass Producción', desc: '3 horas con Leo Vela', price: 800, icon: '🎓', category: 'education' },
  { id: 6, name: 'Reset Gold Badge', desc: 'Badge exclusivo de fundador', price: 150, icon: '🏅', category: 'badges' },
  { id: 7, name: 'Sample Pack Organic', desc: '50 samples de naturaleza', price: 350, icon: '🌿', category: 'beats' },
  { id: 8, name: 'Bando War Shield', desc: 'Escudo protector para guerras', price: 100, icon: '🛡️', category: 'gaming' },
]

const COIN_PACKS = [
  { coins: 500, price: '€4.99', bonus: '', popular: false },
  { coins: 1200, price: '€9.99', bonus: '+200 bonus', popular: true },
  { coins: 3000, price: '€19.99', bonus: '+500 bonus', popular: false },
  { coins: 8000, price: '€49.99', bonus: '+2000 bonus', popular: false },
]

function MonetizacionContent() {
  const { isAgeVerified, isLoading } = useAuth()
  const [tab, setTab] = useState<'tienda' | 'coins'>('tienda')
  const [category, setCategory] = useState('todos')

  if (isLoading) return <div className="min-h-screen bg-[#0A0A0A]" />
  if (!isAgeVerified) return <AgeGate />

  const filteredProducts = category === 'todos' ? PRODUCTS : PRODUCTS.filter(p => p.category === category)

  return (
    <AppShell>
      <div className="p-4 md:p-6 pb-20 lg:pb-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-outfit font-bold text-white flex items-center gap-2">
              <span>💰</span> Monetización
            </h1>
            <p className="text-sm text-gray-400 mt-1">Tienda C8L y monedas virtuales</p>
          </div>
          <div className="flex items-center gap-2 bg-gray-800/60 rounded-full px-4 py-2">
            <span className="text-c8l-gold">⚡</span>
            <span className="text-sm font-bold">1,250</span>
            <span className="text-[10px] text-gray-500">C8L coins</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setTab('tienda')}
            className={`px-5 py-2 rounded-full text-sm font-bold transition ${
              tab === 'tienda' ? 'bg-c8l-gold text-black' : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            🛍️ Tienda
          </button>
          <button
            onClick={() => setTab('coins')}
            className={`px-5 py-2 rounded-full text-sm font-bold transition ${
              tab === 'coins' ? 'bg-c8l-gold text-black' : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            ⚡ Comprar Coins
          </button>
        </div>

        {tab === 'tienda' ? (
          <>
            {/* Category filter */}
            <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide mb-4">
              {['todos', 'beats', 'design', 'membership', 'skins', 'education', 'badges', 'gaming'].map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`px-3 py-1 rounded-full text-[11px] font-medium capitalize whitespace-nowrap transition border ${
                    category === cat ? 'bg-white text-black border-white' : 'text-gray-400 border-gray-700 hover:border-gray-500'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredProducts.map((product, i) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="glass rounded-xl p-4 hover:border-c8l-gold/30 transition group cursor-pointer"
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-c8l-gold/20 to-c8l-purple/20 flex items-center justify-center text-2xl mb-3 group-hover:scale-110 transition">
                    {product.icon}
                  </div>
                  <h3 className="text-sm font-bold text-white mb-1">{product.name}</h3>
                  <p className="text-[11px] text-gray-500 mb-3">{product.desc}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <span className="text-c8l-gold text-xs">⚡</span>
                      <span className="text-sm font-bold text-c8l-gold">{product.price}</span>
                    </div>
                    <button className="bg-c8l-purple text-white text-[10px] font-bold px-3 py-1.5 rounded-full hover:bg-c8l-purple/80 transition">
                      COMPRAR
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </>
        ) : (
          <>
            {/* Coin Packs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {COIN_PACKS.map((pack, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className={`relative rounded-xl p-5 text-center transition cursor-pointer hover:scale-[1.02] ${
                    pack.popular
                      ? 'bg-gradient-to-b from-c8l-gold/20 to-c8l-purple/20 border-2 border-c8l-gold'
                      : 'glass hover:border-c8l-gold/30'
                  }`}
                >
                  {pack.popular && (
                    <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-c8l-gold text-black text-[10px] font-bold px-3 py-0.5 rounded-full">
                      MÁS POPULAR
                    </span>
                  )}
                  <div className="text-3xl mb-2">⚡</div>
                  <p className="text-2xl font-outfit font-bold text-c8l-gold">{pack.coins.toLocaleString()}</p>
                  <p className="text-xs text-gray-400 mb-1">C8L Coins</p>
                  {pack.bonus && <p className="text-[10px] text-green-400 font-bold mb-2">{pack.bonus}</p>}
                  <button className={`w-full mt-3 py-2.5 rounded-xl font-bold text-sm transition ${
                    pack.popular
                      ? 'bg-c8l-gold text-black hover:bg-c8l-gold/90'
                      : 'bg-gray-700 text-white hover:bg-gray-600'
                  }`}>
                    {pack.price}
                  </button>
                </motion.div>
              ))}
            </div>

            {/* Info */}
            <div className="glass rounded-xl p-5">
              <h3 className="text-sm font-bold text-white mb-2">💡 ¿Cómo funcionan los C8L Coins?</h3>
              <ul className="space-y-2 text-xs text-gray-400">
                <li>⚡ Compra productos en la tienda: beats, skins, membresías</li>
                <li>🎮 Apuesta en el Casino y juegos de la plataforma</li>
                <li>🏆 Gana coins participando en torneos y retos</li>
                <li>💸 Los creadores reciben coins por sus contenidos</li>
                <li>🔄 Pronto: conversión a moneda real para creadores verificados</li>
              </ul>
            </div>
          </>
        )}
      </div>
    </AppShell>
  )
}

export default function MonetizacionPage() {
  return <Providers><MonetizacionContent /></Providers>
}
