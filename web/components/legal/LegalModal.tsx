'use client'

import { useState } from 'react'

type Tab = 'normas' | 'privacidad' | 'sanciones' | 'terminos'

export default function LegalModal({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState<Tab>('normas')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="glass-dark rounded-2xl max-w-4xl w-full max-h-[85vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <h2 className="text-2xl font-outfit font-bold text-c8l-gold">Informacion Legal</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">&times;</button>
        </div>
        <div className="flex border-b border-gray-800 overflow-x-auto">
          {([['normas','Normas'],['sanciones','Sanciones'],['privacidad','Privacidad'],['terminos','Terminos']] as [Tab,string][]).map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)}
              className={`px-6 py-3 text-sm font-medium whitespace-nowrap ${tab === id ? 'text-c8l-gold border-b-2 border-c8l-gold' : 'text-gray-500 hover:text-gray-300'}`}>
              {label}
            </button>
          ))}
        </div>
        <div className="p-6 overflow-y-auto flex-1 text-sm text-gray-300 space-y-4">
          {tab === 'normas' && <>
            <h3 className="text-xl font-outfit font-bold text-white">Normas de la Comunidad C8L</h3>
            <p>1. <b>Respeto mutuo</b> — No acoso, insultos ni discriminacion.</p>
            <p>2. <b>Sin spam</b> — No contenido repetitivo ni publicidad no autorizada.</p>
            <p>3. <b>Contenido apropiado</b> — No material violento, sexual o ilegal.</p>
            <p>4. <b>Privacidad</b> — No compartir datos de otros sin consentimiento.</p>
            <p>5. <b>Juego responsable</b> — El casino es entretenimiento. jugarbien.es</p>
            <p>6. <b>Una cuenta</b> — No multicuentas ni suplantacion.</p>
            <p>7. <b>Colaboracion</b> — Reporta comportamientos inadecuados.</p>
          </>}
          {tab === 'sanciones' && <>
            <h3 className="text-xl font-outfit font-bold text-white">Sistema de Sanciones</h3>
            <div className="glass rounded-lg p-3 border-l-4 border-blue-500">🔵 <b>Leve (3 dias)</b> — Spam, lenguaje ofensivo leve. Art. 6.1.f RGPD. Apelacion: 48h.</div>
            <div className="glass rounded-lg p-3 border-l-4 border-yellow-500">🟡 <b>Media (7 dias)</b> — Acoso verbal, enlaces maliciosos. Art. 173.1 CP. Revision humana.</div>
            <div className="glass rounded-lg p-3 border-l-4 border-orange-500">🟠 <b>Grave (30 dias)</b> — Odio, amenazas, acoso sexual. Arts. 169, 510 CP. Revision obligatoria.</div>
            <div className="glass rounded-lg p-3 border-l-4 border-red-500">🔴 <b>Permanente</b> — Amenazas muerte, estafa, suplantacion. Sin apelacion.</div>
            <div className="mt-4 p-3 bg-c8l-gold/10 rounded-lg">
              <b>Derechos RGPD:</b> Acceso (Art.15), Rectificacion (Art.16), Supresion (Art.17), Oposicion (Art.21), Intervencion humana (Art.22). Reclamacion AEPD: www.aepd.es
            </div>
          </>}
          {tab === 'privacidad' && <>
            <h3 className="text-xl font-outfit font-bold text-white">Politica de Privacidad</h3>
            <p><b>Responsable:</b> C8L Agency (Corazones Locos Family). legal@c8l.agency</p>
            <p><b>Datos:</b> Username, email, actividad, transacciones internas.</p>
            <p><b>Base legal:</b> Art. 6.1.f RGPD (interes legitimo) + Art. 6.1.a (consentimiento).</p>
            <p><b>Finalidad:</b> Servicio, moderacion, prevencion fraude.</p>
            <p><b>Conservacion:</b> Mientras cuenta activa + 30 dias tras eliminacion.</p>
            <p><b>Derechos:</b> Acceso, rectificacion, supresion, oposicion, portabilidad.</p>
            <p><b>Reclamaciones:</b> AEPD (www.aepd.es).</p>
          </>}
          {tab === 'terminos' && <>
            <h3 className="text-xl font-outfit font-bold text-white">Terminos de Servicio</h3>
            <p><b>1. Aceptacion:</b> Al usar C8L, aceptas estos terminos.</p>
            <p><b>2. Edad:</b> Debes ser mayor de 18 anos.</p>
            <p><b>3. Cuenta:</b> Responsable de tu seguridad.</p>
            <p><b>4. Moneda virtual:</b> Coins, Diamantes y BID sin valor real.</p>
            <p><b>5. Casino:</b> Entretenimiento. RNG certificado. Juega responsablemente.</p>
            <p><b>6. Moderacion:</b> C8L se reserva derecho a moderar y sancionar.</p>
            <p><b>7. Propiedad:</b> Contenido propiedad de C8L Agency.</p>
            <p><b>8. Limitacion:</b> No responsable de perdidas por uso del casino virtual.</p>
          </>}
        </div>
      </div>
    </div>
  )
}
