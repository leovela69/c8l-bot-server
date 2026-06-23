'use client'

import { useState } from 'react'
import Link from 'next/link'
import LegalFooter from '@/components/legal/LegalFooter'
import LegalModal from '@/components/legal/LegalModal'

export default function Home() {
  const [showLegal, setShowLegal] = useState(false)
  const [ageVerified, setAgeVerified] = useState(false)

  if (!ageVerified) {
    return <AgeGate onVerify={() => setAgeVerified(true)} />
  }

  return (
    <main className="min-h-screen">
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-c8l-black via-purple-950/20 to-c8l-black" />
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-c8l-purple/10 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-c8l-gold/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
        </div>

        <div className="relative z-10 text-center px-6 max-w-5xl">
          <div className="mb-8 animate-glow inline-block p-6 rounded-full border border-c8l-gold/30">
            <h1 className="text-7xl md:text-9xl font-outfit font-black neon-gold">C8L</h1>
          </div>
          <p className="text-2xl md:text-4xl font-outfit font-light text-c8l-gold mb-4">Corazones Locos Family</p>
          <p className="text-lg text-gray-400 mb-12 max-w-2xl mx-auto">
            Entretenimiento, musica y comunidad. Casino, Karaoke, Estudio Musical, Lives, Bandos y mucho mas.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            <NavCard href="/casino" icon="🎰" title="Casino" subtitle="Juegos" color="purple" />
            <NavCard href="/studio" icon="🎵" title="Estudio" subtitle="Crea musica" color="gold" />
            <NavCard href="/karaoke" icon="🎤" title="Karaoke" subtitle="Canta" color="pink" />
            <NavCard href="/lives" icon="📺" title="Lives" subtitle="Directo" color="cyan" />
            <NavCard href="/bandos" icon="⚔️" title="Bandos" subtitle="Familias" color="gold" />
            <NavCard href="/tv" icon="📱" title="C8L TV" subtitle="Contenido" color="purple" />
            <NavCard href="/monedero" icon="💰" title="Monedero" subtitle="Wallet" color="gold" />
            <NavCard href="/legal" icon="⚖️" title="Legal" subtitle="Normas" color="cyan" />
          </div>

          <div className="mt-16 flex justify-center gap-8 md:gap-16">
            <Stat value="11" label="Agentes IA" />
            <Stat value="24/7" label="Online" />
            <Stat value="∞" label="Posibilidades" />
          </div>
        </div>
      </section>

      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-outfit font-bold text-center mb-16 neon-purple">El Ecosistema C8L</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard icon="🎵" title="Estudio Musical" description="Crea musica con IA. Elige genero, BPM, mood y efectos. Descarga o publica en C8L TV." />
            <FeatureCard icon="🎰" title="Casino Quantum" description="Ruleta, Slots, Blackjack. RTP certificado, animaciones y jackpots progresivos." />
            <FeatureCard icon="🤖" title="C8L Guardian" description="Bot de moderacion con IA. 4 niveles de sanciones y proteccion RGPD." />
            <FeatureCard icon="🎤" title="Sala de Canto" description="Karaoke con medidores de tono y energia. Compite y gana Coins." />
            <FeatureCard icon="⚔️" title="Bandos" description="Crea o unete a una familia. Misiones, batallas y jerarquia." />
            <FeatureCard icon="⚖️" title="Base Legal" description="Cumplimiento RGPD/LOPD. Proteccion de datos y derechos del usuario." />
          </div>
        </div>
      </section>

      <LegalFooter onOpenModal={() => setShowLegal(true)} />
      {showLegal && <LegalModal onClose={() => setShowLegal(false)} />}
    </main>
  )
}

function AgeGate({ onVerify }: { onVerify: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-c8l-black p-6">
      <div className="glass rounded-2xl p-8 max-w-md w-full text-center">
        <div className="text-6xl mb-6">🔞</div>
        <h1 className="text-3xl font-outfit font-bold text-c8l-gold mb-4">Verificacion de Edad</h1>
        <p className="text-gray-400 mb-8">Esta plataforma contiene juegos de azar y contenido para mayores de 18 anos.</p>
        <button onClick={onVerify}
          className="w-full py-4 bg-gradient-to-r from-c8l-purple to-c8l-gold rounded-xl font-bold text-lg hover:scale-105 transition-transform">
          Soy mayor de 18 anos
        </button>
        <p className="text-xs text-gray-600 mt-4">Al continuar aceptas los Terminos de Servicio. RGPD + LO 3/2018.</p>
      </div>
    </div>
  )
}

function NavCard({ href, icon, title, subtitle, color }: { href: string; icon: string; title: string; subtitle: string; color: string }) {
  const borders: Record<string, string> = {
    purple: 'border-c8l-purple/30 hover:border-c8l-purple',
    pink: 'border-c8l-pink/30 hover:border-c8l-pink',
    cyan: 'border-c8l-cyan/30 hover:border-c8l-cyan',
    gold: 'border-c8l-gold/30 hover:border-c8l-gold',
  }
  return (
    <Link href={href} className={`glass rounded-xl p-4 border ${borders[color]} transition-all hover:scale-105 hover:-translate-y-1`}>
      <div className="text-3xl mb-2">{icon}</div>
      <h3 className="font-outfit font-semibold">{title}</h3>
      <p className="text-xs text-gray-500">{subtitle}</p>
    </Link>
  )
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center">
      <div className="text-3xl font-outfit font-bold text-c8l-gold">{value}</div>
      <div className="text-sm text-gray-500">{label}</div>
    </div>
  )
}

function FeatureCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="glass rounded-xl p-6 hover:scale-105 transition-transform">
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-xl font-outfit font-semibold mb-2 text-c8l-gold">{title}</h3>
      <p className="text-gray-400 text-sm">{description}</p>
    </div>
  )
}
