'use client'

export default function LegalFooter({ onOpenModal }: { onOpenModal: () => void }) {
  return (
    <footer className="bg-c8l-black border-t border-c8l-gold/20 py-12 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-3 gap-8 mb-8">
          <div>
            <h3 className="text-2xl font-outfit font-bold text-c8l-gold mb-3">C8L Agency</h3>
            <p className="text-gray-500 text-sm">Corazones Locos Family. Entretenimiento, musica y comunidad.</p>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wider">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li><button onClick={onOpenModal} className="text-gray-400 hover:text-c8l-gold transition-colors">Normas de la Comunidad</button></li>
              <li><button onClick={onOpenModal} className="text-gray-400 hover:text-c8l-gold transition-colors">Politica de Privacidad</button></li>
              <li><button onClick={onOpenModal} className="text-gray-400 hover:text-c8l-gold transition-colors">Terminos de Servicio</button></li>
              <li><button onClick={onOpenModal} className="text-gray-400 hover:text-c8l-gold transition-colors">Sistema de Sanciones</button></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wider">Contacto</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>legal@c8l.agency</li>
              <li>moderacion@c8l.agency</li>
              <li>soporte@c8l.agency</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-gray-600">&copy; 2026 C8L Agency. Todos los derechos reservados.</p>
          <div className="text-xs text-gray-600">Art. 6.1.f) RGPD | LO 3/2018 | AEPD: www.aepd.es</div>
        </div>
        <div className="mt-4 glass rounded-lg p-3 text-center">
          <p className="text-xs text-gray-500">🛡️ C8L Agency cumple RGPD y LOPD-GDD. Derechos: legal@c8l.agency</p>
        </div>
      </div>
    </footer>
  )
}
