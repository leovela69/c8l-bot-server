'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { LegalModal } from './LegalModal';

export function LegalFooter() {
  const [showLegalModal, setShowLegalModal] = useState(false);
  const [currentYear] = useState(new Date().getFullYear());

  return (
    <>
      <footer className="bg-gradient-to-b from-black to-gray-950 border-t-4 border-c8l-gold py-6 px-4 mt-12">
        <div className="max-w-7xl mx-auto">
          {/* AVISO DE MODERACIÓN */}
          <div className="bg-gradient-to-r from-red-600/20 via-purple-600/20 to-c8l-gold/20 border-2 border-c8l-gold rounded-xl p-4 mb-6 shadow-[0_0_30px_rgba(212,175,55,0.1)]">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <span className="text-3xl">🛡️</span>
                  <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-c8l-gold text-sm uppercase tracking-wider">🤖 MODERACIÓN AUTOMÁTICA ACTIVA</span>
                    <span className="bg-red-600 text-white text-[8px] px-2 py-0.5 rounded-full font-bold animate-pulse">🔴 EN VIVO</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-400 flex-wrap">
                    <span>C8L Guardian</span><span className="w-1 h-1 bg-gray-600 rounded-full" />
                    <span>Bot Oficial</span><span className="w-1 h-1 bg-gray-600 rounded-full" />
                    <span>Sujeto a Protección de Datos</span><span className="w-1 h-1 bg-gray-600 rounded-full" />
                    <span className="text-green-400">✅ Autorizado</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setShowLegalModal(true)}
                className="px-5 py-2.5 bg-gradient-to-r from-c8l-gold to-c8l-pink text-black font-bold rounded-lg text-sm hover:scale-105 transition flex items-center gap-2 shadow-lg">
                📜 Ver Normas y Protección de Datos
              </button>
            </div>
          </div>


          {/* RESUMEN DE SANCIONES */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <div className="bg-black/40 p-3 rounded-lg border border-blue-600/30 text-center hover:border-blue-500 transition">
              <div className="text-2xl mb-1">🔵</div><div className="text-xs font-bold text-blue-400">3 DÍAS</div><div className="text-[10px] text-gray-500">Infracciones Leves</div>
            </div>
            <div className="bg-black/40 p-3 rounded-lg border border-yellow-600/30 text-center hover:border-yellow-500 transition">
              <div className="text-2xl mb-1">🟡</div><div className="text-xs font-bold text-yellow-400">7 DÍAS</div><div className="text-[10px] text-gray-500">Infracciones Medias</div>
            </div>
            <div className="bg-black/40 p-3 rounded-lg border border-orange-600/30 text-center hover:border-orange-500 transition">
              <div className="text-2xl mb-1">🟠</div><div className="text-xs font-bold text-orange-400">30 DÍAS</div><div className="text-[10px] text-gray-500">Infracciones Graves</div>
            </div>
            <div className="bg-black/40 p-3 rounded-lg border border-red-900/30 text-center hover:border-red-700 transition">
              <div className="text-2xl mb-1">🔴</div><div className="text-xs font-bold text-red-500">PERMANENTE</div><div className="text-[10px] text-gray-500">Infracciones Críticas</div>
            </div>
          </div>

          {/* LINKS LEGALES */}
          <div className="flex flex-wrap justify-center gap-4 md:gap-6 text-xs text-gray-500 border-t border-gray-800 pt-4 mb-4">
            <button onClick={() => setShowLegalModal(true)} className="hover:text-c8l-gold transition flex items-center gap-1.5">⚖️ Normas de la Comunidad</button>
            <button onClick={() => setShowLegalModal(true)} className="hover:text-c8l-gold transition flex items-center gap-1.5">🛡️ Protección de Datos</button>
            <button onClick={() => setShowLegalModal(true)} className="hover:text-c8l-gold transition flex items-center gap-1.5">🚩 Política de Moderación</button>
            <button onClick={() => setShowLegalModal(true)} className="hover:text-c8l-gold transition flex items-center gap-1.5">🍪 Política de Cookies</button>
            <Link href="/legal" className="hover:text-c8l-gold transition flex items-center gap-1.5">📧 Contacto Legal</Link>
          </div>

          {/* DATOS EMPRESA + BOT */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-3 text-[10px] text-gray-600 border-t border-gray-800 pt-4">
            <div className="flex items-center gap-4 flex-wrap justify-center">
              <span>© {currentYear} C8L Agency (Corazones Locos Family)</span>
              <span className="hidden md:inline">|</span>
              <span className="flex items-center gap-1">🤖 C8L Guardian v2.0</span>
              <span className="hidden md:inline">|</span>
              <span className="text-gray-700">Todos los derechos reservados</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-gray-700">Sujeto a RGPD/LOPD</span>
              <span className="w-1 h-1 bg-gray-700 rounded-full" />
              <span className="text-green-500">✅ Protección de Datos</span>
            </div>
          </div>

          {/* CONTACTO LEGAL */}
          <div className="flex flex-wrap justify-center gap-4 text-[10px] text-gray-600 mt-2 pt-2 border-t border-gray-800/50">
            <a href="mailto:legal@c8l.agency" className="hover:text-c8l-gold transition">📧 legal@c8l.agency</a>
            <a href="mailto:moderacion@c8l.agency" className="hover:text-c8l-gold transition">🛡️ moderacion@c8l.agency</a>
            <a href="mailto:soporte@c8l.agency" className="hover:text-c8l-gold transition">💬 soporte@c8l.agency</a>
          </div>
        </div>
      </footer>
      <LegalModal isOpen={showLegalModal} onClose={() => setShowLegalModal(false)} />
    </>
  );
}
