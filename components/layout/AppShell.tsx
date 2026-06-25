'use client'

import { useState, ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/lib/auth/context'

const NAV_ITEMS = [
  { href: '/', icon: '📺', label: 'C8L TV', emoji: '📺' },
  { href: '/salas', icon: '🎵', label: 'SALAS', emoji: '🎵' },
  { href: '/streaming', icon: '🎧', label: 'STREAMING', emoji: '🎧' },
  { href: '/monetizacion', icon: '💰', label: 'TIENDA', emoji: '💰' },
  { href: '/comunidad', icon: '👥', label: 'COMUNIDAD', emoji: '👥' },
  { href: '/perfil', icon: '👤', label: 'PERFIL', emoji: '👤' },
  { href: '/studio', icon: '🤖', label: 'ESTUDIO IA', emoji: '🤖' },
]

const SIDEBAR_SECTIONS = [
  {
    title: null,
    items: [
      { href: '/', icon: '🏠', label: 'INICIO' },
      { href: '/explorar', icon: '🧭', label: 'EXPLORAR' },
      { href: '/casino', icon: '🎰', label: 'CASINO' },
    ]
  },
  {
    title: 'Contenido',
    items: [
      { href: '/biblioteca', icon: '📚', label: 'BIBLIOTECA' },
      { href: '/historial', icon: '🕐', label: 'HISTORIAL' },
      { href: '/favoritos', icon: '❤️', label: 'FAVORITOS' },
    ]
  },
  {
    title: 'Gaming',
    items: [
      { href: '/ajedrez', icon: '♟️', label: 'AJEDREZ' },
      { href: '/bandos', icon: '⚔️', label: 'BANDOS' },
      { href: '/torneos', icon: '🏆', label: 'TORNEOS' },
    ]
  },
  {
    title: 'C8L Tools',
    items: [
      { href: '/studio', icon: '🎹', label: 'ESTUDIO IA' },
      { href: '/karaoke', icon: '🎤', label: 'KARAOKE' },
      { href: '/control', icon: '🎛️', label: 'CONTROL' },
    ]
  },
]

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      {/* TOP NAV */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#0D0D0D]/95 backdrop-blur-md border-b border-gray-800/50">
        <div className="flex items-center justify-between px-4 h-14">
          {/* Left: Menu + Logo */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-gray-400 hover:text-white transition hidden lg:block"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-gray-400 hover:text-white transition lg:hidden"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <Link href="/" className="flex items-center gap-2">
              <img src="/images/logo-c8l.png" alt="C8L" className="w-9 h-9 rounded-full object-cover border-2 border-c8l-gold/50 shadow-md shadow-c8l-gold/20" />
              <div className="hidden sm:block">
                <h1 className="text-xs font-outfit font-bold text-white leading-none">C8L AGENCY</h1>
                <p className="text-[9px] text-c8l-gold leading-none mt-0.5">Corazones Locos</p>
              </div>
            </Link>
          </div>

          {/* Center: Main Nav */}
          <nav className="hidden lg:flex items-center gap-0.5">
            {NAV_ITEMS.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center px-3 py-1.5 rounded-lg transition text-[10px] ${
                  pathname === item.href
                    ? 'text-c8l-cyan bg-c8l-cyan/10'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <span className="text-sm">{item.icon}</span>
                <span className="font-medium mt-0.5">{item.label}</span>
              </Link>
            ))}
          </nav>

          {/* Right: User area */}
          <div className="flex items-center gap-2">
            {/* Coins */}
            <div className="hidden sm:flex items-center gap-1.5 bg-gray-800/60 rounded-full px-3 py-1.5">
              <span className="text-c8l-gold text-xs">⚡</span>
              <span className="text-xs font-bold text-white">1,250</span>
              <span className="text-[9px] text-gray-500">C8L</span>
            </div>

            {/* Notifications */}
            <button className="relative text-gray-400 hover:text-white transition p-1.5">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-red-500 rounded-full text-[8px] flex items-center justify-center">3</span>
            </button>

            {/* User */}
            {user ? (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-c8l-pink to-c8l-purple flex items-center justify-center overflow-hidden">
                  {user.avatar ? (
                    <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xs font-bold">{user.name[0]}</span>
                  )}
                </div>
                <button onClick={logout} className="hidden md:block text-[10px] text-gray-500 hover:text-red-400 transition">
                  Salir
                </button>
              </div>
            ) : (
              <Link href="/login" className="text-xs bg-c8l-purple hover:bg-c8l-purple/80 px-3 py-1.5 rounded-lg font-bold transition">
                Entrar
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* SIDEBAR - Desktop */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside
            initial={{ x: -200, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -200, opacity: 0 }}
            transition={{ type: 'spring', damping: 25 }}
            className="fixed left-0 top-14 bottom-0 w-52 bg-[#0D0D0D]/98 backdrop-blur-md border-r border-gray-800/50 overflow-y-auto z-40 hidden lg:block"
          >
            <div className="p-3 space-y-1">
              {SIDEBAR_SECTIONS.map((section, si) => (
                <div key={si}>
                  {si > 0 && <div className="border-t border-gray-800/50 my-3" />}
                  {section.title && (
                    <div className="px-2 py-1.5">
                      <span className="text-[10px] text-gray-600 uppercase tracking-wider font-medium">{section.title}</span>
                    </div>
                  )}
                  {section.items.map(item => (
                    <Link
                      key={item.href + item.label}
                      href={item.href}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition text-left ${
                        pathname === item.href
                          ? 'bg-gradient-to-r from-c8l-cyan/20 to-transparent text-c8l-cyan border-l-2 border-c8l-cyan'
                          : 'text-gray-400 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <span className="text-sm">{item.icon}</span>
                      <span className="text-xs font-medium">{item.label}</span>
                    </Link>
                  ))}
                </div>
              ))}
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* MOBILE MENU */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/60 z-40 lg:hidden"
            />
            <motion.aside
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: 'spring', damping: 25 }}
              className="fixed left-0 top-0 bottom-0 w-64 bg-[#0D0D0D] border-r border-gray-800 overflow-y-auto z-50 lg:hidden"
            >
              <div className="p-4">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-800">
                  <img src="/images/logo-c8l.png" alt="C8L" className="w-11 h-11 rounded-full object-cover border-2 border-c8l-gold/50 shadow-md shadow-c8l-gold/20" />
                  <div>
                    <h2 className="text-sm font-outfit font-bold">C8L Agency</h2>
                    <p className="text-[10px] text-c8l-gold">Corazones Locos Family</p>
                  </div>
                </div>
                {NAV_ITEMS.map(item => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3 py-3 rounded-lg transition mb-1 ${
                      pathname === item.href
                        ? 'bg-c8l-cyan/10 text-c8l-cyan'
                        : 'text-gray-400 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <span className="text-lg">{item.icon}</span>
                    <span className="text-sm font-medium">{item.label}</span>
                  </Link>
                ))}
                <div className="border-t border-gray-800 my-4" />
                {SIDEBAR_SECTIONS.slice(1).map((section, si) => (
                  <div key={si} className="mb-4">
                    {section.title && (
                      <p className="text-[10px] text-gray-600 uppercase tracking-wider mb-2 px-3">{section.title}</p>
                    )}
                    {section.items.map(item => (
                      <Link
                        key={item.href + item.label}
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-400 hover:bg-white/5 hover:text-white transition"
                      >
                        <span className="text-sm">{item.icon}</span>
                        <span className="text-xs">{item.label}</span>
                      </Link>
                    ))}
                  </div>
                ))}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* MAIN CONTENT */}
      <main className={`pt-14 transition-all duration-300 ${sidebarOpen ? 'lg:ml-52' : ''}`}>
        {children}
      </main>

      {/* MOBILE BOTTOM NAV */}
      <nav className="fixed bottom-0 left-0 right-0 bg-[#0D0D0D]/95 backdrop-blur-md border-t border-gray-800/50 z-40 lg:hidden">
        <div className="flex items-center justify-around py-2">
          {NAV_ITEMS.slice(0, 5).map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center px-2 py-1 rounded-lg transition ${
                pathname === item.href ? 'text-c8l-cyan' : 'text-gray-500'
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span className="text-[8px] mt-0.5 font-medium">{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  )
}
