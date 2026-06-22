'use client';
import Link from 'next/link';

export default function LegalPage() {
  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-black text-c8l-gold mb-8 text-center">📜 Centro Legal C8L Agency</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link href="/legal/datos" className="bg-black/40 p-6 rounded-xl border-2 border-purple-600/30 hover:border-purple-500 transition">
            <div className="text-3xl mb-2">🔒</div>
            <h2 className="text-xl font-bold text-purple-400">Protección de Datos</h2>
            <p className="text-sm text-gray-400 mt-2">RGPD / LOPD — Tus derechos y cómo protegemos tu información</p>
          </Link>
          <Link href="/legal/moderacion" className="bg-black/40 p-6 rounded-xl border-2 border-c8l-gold/30 hover:border-c8l-gold transition">
            <div className="text-3xl mb-2">⚖️</div>
            <h2 className="text-xl font-bold text-c8l-gold">Normas y Moderación</h2>
            <p className="text-sm text-gray-400 mt-2">Normas de la comunidad y sistema de sanciones</p>
          </Link>
          <div className="bg-black/40 p-6 rounded-xl border-2 border-gray-800">
            <div className="text-3xl mb-2">🏢</div>
            <h2 className="text-xl font-bold text-white">Empresa</h2>
            <div className="text-sm text-gray-400 mt-2 space-y-1">
              <p>C8L Agency (Corazones Locos Family)</p>
              <p>Representante: Leo Vela</p>
              <p>Email: legal@c8l.agency</p>
            </div>
          </div>
          <div className="bg-black/40 p-6 rounded-xl border-2 border-gray-800">
            <div className="text-3xl mb-2">🤖</div>
            <h2 className="text-xl font-bold text-white">Bot Oficial</h2>
            <div className="text-sm text-gray-400 mt-2 space-y-1">
              <p>C8L Guardian (@C8L_Guardian_Bot)</p>
              <p>Función: Moderación Automática</p>
              <p>Autoridad: ✅ Oficial</p>
            </div>
          </div>
        </div>
        <div className="mt-8 text-center text-xs text-gray-600">
          <p>© 2026 C8L Agency. Todos los derechos reservados.</p>
          <p className="mt-1">📧 legal@c8l.agency • moderacion@c8l.agency • soporte@c8l.agency</p>
        </div>
      </div>
    </div>
  );
}
