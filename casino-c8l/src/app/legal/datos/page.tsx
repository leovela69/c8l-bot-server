'use client';

export default function DataProtectionPage() {
  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-black text-purple-400 mb-8">🔒 Política de Protección de Datos</h1>
        <div className="space-y-6 text-sm text-gray-300">
          <section className="bg-black/30 p-6 rounded-lg border border-purple-600/30">
            <h2 className="text-lg font-bold text-purple-400 mb-3">1. Responsable del Tratamiento</h2>
            <p>C8L Agency (Corazones Locos Family), representada por Leo Vela.</p>
            <p className="mt-1">Email: <a href="mailto:legal@c8l.agency" className="text-c8l-gold">legal@c8l.agency</a></p>
          </section>
          <section className="bg-black/30 p-6 rounded-lg border border-purple-600/30">
            <h2 className="text-lg font-bold text-purple-400 mb-3">2. Datos que Recopilamos</h2>
            <ul className="list-disc list-inside space-y-1">
              <li>Datos de registro (nombre, email, avatar)</li>
              <li>Datos de uso (interacciones, juegos, contenido)</li>
              <li>Datos de moderación (infracciones, reportes)</li>
              <li>Datos técnicos (IP solo en bloqueos permanentes)</li>
            </ul>
          </section>
          <section className="bg-black/30 p-6 rounded-lg border border-purple-600/30">
            <h2 className="text-lg font-bold text-purple-400 mb-3">3. Finalidad del Tratamiento</h2>
            <ul className="list-disc list-inside space-y-1">
              <li>Gestión de cuentas de usuario</li>
              <li>Moderación y seguridad de la comunidad</li>
              <li>Mejora de servicios y experiencia</li>
              <li>Comunicaciones oficiales</li>
            </ul>
          </section>
          <section className="bg-black/30 p-6 rounded-lg border border-purple-600/30">
            <h2 className="text-lg font-bold text-purple-400 mb-3">4. Tus Derechos (ARCO+)</h2>
            <div className="grid grid-cols-2 gap-2">
              <div>✅ Acceso a tus datos</div>
              <div>✅ Rectificación de datos inexactos</div>
              <div>✅ Cancelación / Supresión</div>
              <div>✅ Oposición al tratamiento</div>
              <div>✅ Limitación del tratamiento</div>
              <div>✅ Portabilidad de datos</div>
            </div>
            <p className="mt-3">Para ejercer estos derechos: <a href="mailto:legal@c8l.agency" className="text-c8l-gold">legal@c8l.agency</a></p>
          </section>
          <section className="bg-black/30 p-6 rounded-lg border border-purple-600/30">
            <h2 className="text-lg font-bold text-purple-400 mb-3">5. Base Legal</h2>
            <ul className="list-disc list-inside space-y-1">
              <li>Reglamento General de Protección de Datos (UE) 2016/679</li>
              <li>Ley Orgánica 3/2018 de Protección de Datos Personales</li>
              <li>Ley 34/2002 de Servicios de la Sociedad de la Información</li>
            </ul>
          </section>
          <section className="bg-black/30 p-6 rounded-lg border border-purple-600/30">
            <h2 className="text-lg font-bold text-purple-400 mb-3">6. Bot C8L Guardian y Datos</h2>
            <p>El bot C8L Guardian procesa datos bajo las mismas normas RGPD/LOPD. Sus acciones son auditables y registradas. Todas las sanciones automáticas quedan registradas con fecha, motivo y duración.</p>
          </section>
        </div>
        <div className="mt-8 text-center text-xs text-gray-600">
          <p>Última actualización: 22 de junio de 2026</p>
        </div>
      </div>
    </div>
  );
}
