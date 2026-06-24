'use client'

import { useState } from 'react'
import Link from 'next/link'
import { VIDEOS, CATEGORIES, CREATORS } from '@/lib/videos/data'

// ==================== COMPONENTS ====================

function TopNav() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#0D0D0D] border-b border-gray-800">
      <div className="flex items-center justify-between px-4 h-14">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-c8l-gold to-c8l-purple flex items-center justify-center">
            <span className="text-sm font-bold">C8L</span>
          </div>
          <div className="hidden md:block">
            <h1 className="text-sm font-outfit font-bold text-white leading-tight">C8L Corazones Locos</h1>
            <p className="text-[10px] text-gray-500 leading-tight">Agency</p>
          </div>
        </div>

        {/* Nav Center */}
        <nav className="hidden lg:flex items-center gap-1">
          <NavLink href="/" icon="📺" label="C8L TV" active />
          <NavLink href="/karaoke" icon="🎵" label="SALAS" />
          <NavLink href="/streaming" icon="🎧" label="STREAMING" />
          <NavLink href="/monetizacion" icon="💰" label="MONETIZACIÓN" />
          <NavLink href="/bandos" icon="👥" label="COMUNIDAD" />
          <NavLink href="/registro" icon="👤" label="PERFIL" />
          <NavLink href="/studio" icon="🤖" label="ESTUDIO IA" />
        </nav>

        {/* Right */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1 bg-gray-800/60 rounded-full px-3 py-1">
            <span className="text-c8l-gold text-xs">●</span>
            <span className="text-xs font-bold text-white">9999</span>
          </div>
          <div className="hidden sm:flex items-center gap-1 bg-gradient-to-r from-red-600 to-orange-500 rounded px-2 py-0.5">
            <span className="text-[10px] font-bold text-white">Reset</span>
            <span className="text-[8px] text-white/80">Gold</span>
          </div>
          <div className="flex items-center gap-0.5 text-[10px]">
            <span className="px-1.5 py-0.5 rounded bg-gray-700 text-gray-300">EN</span>
            <span className="px-1.5 py-0.5 rounded bg-c8l-cyan/20 text-c8l-cyan font-bold">ES</span>
          </div>
          <button className="text-[10px] border border-gray-600 rounded px-2 py-1 text-gray-300 hover:text-white hover:border-gray-400 transition">
            CERRAR SESIÓN
          </button>
        </div>
      </div>
    </header>
  )
}

function NavLink({ href, icon, label, active }: { href: string; icon: string; label: string; active?: boolean }) {
  return (
    <Link href={href} className={`flex flex-col items-center px-3 py-1 rounded-lg transition text-[10px] ${
      active ? 'text-c8l-cyan' : 'text-gray-400 hover:text-white'
    }`}>
      <span className="text-base">{icon}</span>
      <span className="font-medium mt-0.5">{label}</span>
    </Link>
  )
}

function NavItem({ icon, label, active }: { icon: string; label: string; active?: boolean }) {
  return (
    <button className={`flex flex-col items-center px-3 py-1 rounded-lg transition text-[10px] ${
      active ? 'text-c8l-cyan' : 'text-gray-400 hover:text-white'
    }`}>
      <span className="text-base">{icon}</span>
      <span className="font-medium mt-0.5">{label}</span>
    </button>
  )
}

function Sidebar() {
  return (
    <aside className="fixed left-0 top-14 bottom-0 w-48 bg-[#0D0D0D] border-r border-gray-800/50 overflow-y-auto z-40 hidden lg:block">
      <div className="p-3 space-y-1">
        <SidebarItem icon="🏠" label="INICIO" active />
        <SidebarItem icon="🧭" label="EXPLORAR" />
        <SidebarItem icon="📂" label="SUSCRIPCIONES" />
        
        <div className="border-t border-gray-800 my-3" />
        
        <div className="px-2 py-1">
          <span className="text-[10px] text-gray-600 uppercase tracking-wider">Teca</span>
        </div>
        <SidebarItem icon="📚" label="BIBLIOTECA" />
        <SidebarItem icon="🕐" label="HISTORIAL" />
        <SidebarItem icon="🎬" label="MIS VIDEOS" />
        <SidebarItem icon="⏰" label="VER MÁS TARDE" />
        <SidebarItem icon="❤️" label="VIDEOS GUSTADOS" />

        <div className="border-t border-gray-800 my-3" />
        
        <div className="px-2 py-1">
          <span className="text-[10px] text-gray-600 uppercase tracking-wider">Suscripciones</span>
        </div>
        {CREATORS.map((c, i) => (
          <div key={i} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-800/50 cursor-pointer transition">
            <span className="text-sm">{c.emoji}</span>
            <span className="text-xs text-gray-300">{c.name}</span>
            <span className="ml-auto w-1.5 h-1.5 rounded-full bg-green-500" />
          </div>
        ))}

      </div>
    </aside>
  )
}

function SidebarItem({ icon, label, active }: { icon: string; label: string; active?: boolean }) {
  return (
    <button className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition text-left ${
      active 
        ? 'bg-gradient-to-r from-c8l-pink/20 to-transparent text-c8l-pink border-l-2 border-c8l-pink' 
        : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'
    }`}>
      <span className="text-sm">{icon}</span>
      <span className="text-xs font-medium">{label}</span>
    </button>
  )
}

function SearchBar() {
  return (
    <div className="flex items-center gap-3 mb-6">
      <button className="text-gray-400 hover:text-white text-xl">☰</button>
      <div className="flex-1 flex items-center bg-gray-800/60 rounded-full border border-gray-700 overflow-hidden">
        <input
          type="text"
          placeholder="Buscar creadores o videos en C8L TV..."
          className="flex-1 bg-transparent px-4 py-2.5 text-sm text-white placeholder-gray-500 outline-none"
        />
        <button className="px-4 text-gray-400 hover:text-white transition">🔍</button>
      </div>
      <button className="text-gray-400 hover:text-white text-lg">🎙</button>
      <button className="bg-c8l-cyan text-black font-bold text-xs px-4 py-2.5 rounded-full hover:bg-c8l-cyan/80 transition">
        + SUBIR
      </button>
    </div>
  )
}

function CategoryPills({ selected, onSelect }: { selected: string; onSelect: (c: string) => void }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide">
      {CATEGORIES.map(cat => (
        <button
          key={cat}
          onClick={() => onSelect(cat)}
          className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition border ${
            selected === cat
              ? 'bg-white text-black border-white'
              : 'bg-transparent text-gray-300 border-gray-600 hover:border-gray-400 hover:text-white'
          }`}
        >
          {cat}
        </button>
      ))}
    </div>
  )
}

function VideoCardComponent({ video }: { video: typeof VIDEOS[0] }) {
  return (
    <div className="group">
      {/* Thumbnail - clickeable */}
      <Link href={`/watch?v=${video.id}`}>
        <div className="relative aspect-video rounded-xl overflow-hidden mb-3 border border-gray-800 group-hover:border-c8l-purple/50 transition cursor-pointer">
          <img
            src={video.thumbnail}
            alt={video.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {/* Duration badge */}
          <div className="absolute bottom-2 right-2 bg-black/80 text-[10px] px-1.5 py-0.5 rounded text-c8l-pink font-mono">
            {video.duration}
          </div>
          {/* Clock icon top-right */}
          <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
            <span className="text-[10px]">🕐</span>
          </div>
          {/* Play overlay */}
          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
              <span className="text-white text-xl ml-0.5">▶</span>
            </div>
          </div>
        </div>
      </Link>

      {/* Info */}
      <div className="px-1">
        <Link href={`/watch?v=${video.id}`}>
          <h3 className="text-xs font-bold text-white leading-tight mb-1 line-clamp-2 group-hover:text-c8l-cyan transition cursor-pointer">
            {video.title}
          </h3>
        </Link>
        <div className="flex items-center gap-1 mb-2">
          <span className="text-xs">{video.authorEmoji}</span>
          <span className="text-[11px] text-gray-400">{video.author}</span>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-gray-500 mb-3">
          <span>{video.views.toLocaleString()} VISTAS</span>
          <span>•</span>
          <span>HACE {video.daysAgo} DÍAS</span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 mb-2">
          <button className="flex items-center gap-1 text-[10px] text-gray-400 hover:text-white transition bg-gray-800/50 rounded-full px-2.5 py-1">
            <span>♡</span> <span>{video.likes}</span>
          </button>
          <Link href={`/watch?v=${video.id}`} className="flex items-center gap-1 text-[10px] text-gray-400 hover:text-white transition bg-gray-800/50 rounded-full px-2.5 py-1">
            <span>💬</span> <span>COMENTAR</span>
          </Link>
        </div>

        {/* Duet Challenge Button */}
        <button className="w-full py-2 rounded-lg bg-gradient-to-r from-c8l-pink to-c8l-pink/80 text-[10px] font-bold text-white hover:from-c8l-pink/90 hover:to-c8l-pink/70 transition uppercase tracking-wider">
          🎵 Duet Challenge
        </button>
      </div>
    </div>
  )
}

function Footer() {
  return (
    <>
      {/* Main Footer */}
      <footer className="border-t border-gray-800 mt-16 pt-12 pb-8 px-6">
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <h3 className="text-xl font-outfit font-bold text-c8l-gold mb-3">C.8.L. AGENCY</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              El Salto Cuántico en la Creación de Contenido. Únete a la Familia Corazones Locos y alcanza la soberanía del mercado con calidad y lealtad inigualables.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="text-sm font-bold text-white mb-3">NAVEGACIÓN</h4>
            <div className="space-y-2">
              <a href="#" className="block text-xs text-gray-400 hover:text-c8l-cyan transition">La Misión</a>
              <a href="#" className="block text-xs text-gray-400 hover:text-c8l-cyan transition">Inteligencia de Negocios</a>
              <a href="#" className="block text-xs text-gray-400 hover:text-c8l-cyan transition">Panel de Control</a>
            </div>
          </div>

          {/* Social */}
          <div>
            <h4 className="text-sm font-bold text-white mb-3">CONECTAR</h4>
            <div className="flex gap-3">
              <SocialIcon icon="🎮" />
              <SocialIcon icon="📺" />
              <SocialIcon icon="🐦" />
              <SocialIcon icon="📷" />
            </div>
          </div>
        </div>

        {/* Copyright line */}
        <div className="max-w-6xl mx-auto mt-8 pt-6 border-t border-gray-800 flex flex-wrap justify-between items-center gap-4">
          <span className="text-[10px] text-gray-600">
            © 2026 C.8.L. Agency (Corazones Locos Family). Todos los derechos reservados.
          </span>
          <div className="flex gap-4 text-[10px] text-gray-500">
            <a href="#" className="hover:text-c8l-cyan transition">Política de Privacidad (RGPD / LOPD)</a>
            <a href="#" className="hover:text-c8l-cyan transition">Términos de Servicio</a>
            <a href="#" className="hover:text-c8l-cyan transition">Configuración de Cookies</a>
          </div>
        </div>
      </footer>

      {/* Bottom Bar */}
      <div className="bg-[#0A0A0A] border-t border-gray-800 py-4">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex justify-center gap-6 text-[10px] text-gray-500 mb-4">
            <a href="#" className="hover:text-white transition">Términos de Uso</a>
            <a href="#" className="hover:text-white transition">Privacidad</a>
            <a href="#" className="hover:text-white transition">Cookies</a>
            <a href="#" className="hover:text-white transition">Contacto</a>
          </div>
          <div className="mx-auto max-w-lg bg-gradient-to-r from-red-900/30 to-orange-900/30 border border-red-800/50 rounded-xl p-4 text-center">
            <p className="text-xs font-bold text-red-400 mb-1">
              ⚠️ 🔞 PLATAFORMA EXCLUSIVA PARA MAYORES DE 18 AÑOS ⚠️
            </p>
            <p className="text-[10px] text-gray-400">
              C8L Agency no permite el acceso a menores de edad. La verificación de edad es obligatoria.<br />
              Reportaremos cualquier intento de acceso fraudulento a las autoridades competentes.
            </p>
          </div>
          <p className="text-center text-[10px] text-gray-600 mt-4">© 2026 C8L Agency - Todos los derechos reservados</p>
        </div>
      </div>
    </>
  )
}

function SocialIcon({ icon }: { icon: string }) {
  return (
    <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center hover:bg-c8l-purple/30 transition cursor-pointer">
      <span className="text-sm">{icon}</span>
    </div>
  )
}

// ==================== MAIN PAGE ====================

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState('Todas')
  const [ageVerified, setAgeVerified] = useState(false)

  if (!ageVerified) {
    return <AgeGate onVerify={() => setAgeVerified(true)} />
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <TopNav />
      <Sidebar />

      {/* Main Content */}
      <main className="lg:ml-48 pt-14">
        <div className="p-6">
          <SearchBar />
          <CategoryPills selected={selectedCategory} onSelect={setSelectedCategory} />

          {/* Section Title */}
          <div className="flex items-center justify-between mb-6 mt-4">
            <h2 className="text-lg font-outfit font-bold text-white flex items-center gap-2">
              <span>🐱</span> C8L TV RECOMIENDA
            </h2>
            <span className="text-[10px] text-gray-500 uppercase">{VIDEOS.length * 4 + 4} VIDEOS ENCONTRADOS</span>
          </div>

          {/* Video Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {VIDEOS.map(video => (
              <VideoCardComponent key={video.id} video={video} />
            ))}
          </div>
        </div>

        <Footer />
      </main>
    </div>
  )
}

function AgeGate({ onVerify }: { onVerify: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A0A0A] p-6">
      <div className="glass rounded-2xl p-8 max-w-md w-full text-center">
        <div className="text-6xl mb-6">🔞</div>
        <h1 className="text-3xl font-outfit font-bold text-c8l-gold mb-4">Verificación de Edad</h1>
        <p className="text-gray-400 mb-8">Esta plataforma contiene juegos de azar y contenido para mayores de 18 años.</p>
        <button onClick={onVerify}
          className="w-full py-4 bg-gradient-to-r from-c8l-purple to-c8l-gold rounded-xl font-bold text-lg hover:scale-105 transition-transform">
          Soy mayor de 18 años
        </button>
        <p className="text-xs text-gray-600 mt-4">Al continuar aceptas los Términos de Servicio. RGPD + LO 3/2018.</p>
      </div>
    </div>
  )
}
