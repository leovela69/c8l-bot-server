'use client'

import Link from 'next/link'
import LegalModal from '@/components/legal/LegalModal'
import LegalFooter from '@/components/legal/LegalFooter'
import { useState } from 'react'

export default function LegalPage() {
  const [showModal, setShowModal] = useState(true)
  return (
    <div className="min-h-screen bg-c8l-black">
      <header className="glass border-b border-c8l-gold/20 p-4">
        <div className="max-w-6xl mx-auto flex items-center gap-4">
          <Link href="/" className="text-2xl font-outfit font-bold text-c8l-gold">C8L</Link>
          <span className="text-gray-500">|</span>
          <h1 className="text-xl font-outfit font-semibold">⚖️ Informacion Legal</h1>
        </div>
      </header>
      {showModal && <LegalModal onClose={() => setShowModal(false)} />}
      {!showModal && (
        <main className="max-w-4xl mx-auto p-6 text-center mt-12">
          <button onClick={() => setShowModal(true)}
            className="px-8 py-4 bg-gradient-to-r from-c8l-gold to-c8l-purple rounded-xl font-bold text-lg hover:scale-105 transition">
            📜 Ver Informacion Legal Completa
          </button>
        </main>
      )}
      <LegalFooter onOpenModal={() => setShowModal(true)} />
    </div>
  )
}
