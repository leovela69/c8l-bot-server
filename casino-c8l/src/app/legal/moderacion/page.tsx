'use client';

export default function ModerationPage() {
  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-black text-c8l-gold mb-8">⚖️ Política de Moderación</h1>
        <div className="space-y-6">
          <section className="bg-black/30 p-6 rounded-lg border border-c8l-gold/30">
            <h2 className="text-lg font-bold text-c8l-gold mb-3">Sistema de Sanciones</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-blue-600/10 p-3 rounded-lg border border-blue-600/30 text-center"><div className="text-2xl">🔵</div><div className="font-bold text-blue-400">3 Días</div><div className="text-[10px] text-gray-400">Leves</div></div>
              <div className="bg-yellow-600/10 p-3 rounded-lg border border-yellow-600/30 text-center"><div className="text-2xl">🟡</div><div className="font-bold text-yellow-400">7 Días</div><div className="text-[10px] text-gray-400">Medias</div></div>
              <div className="bg-orange-600/10 p-3 rounded-lg border border-orange-600/30 text-center"><div className="text-2xl">🟠</div><div className="font-bold text-orange-400">30 Días</div><div className="text-[10px] text-gray-400">Graves</div></div>
              <div className="bg-red-900/10 p-3 rounded-lg border border-red-900/30 text-center"><div className="text-2xl">🔴</div><div className="font-bold text-red-500">Permanente</div><div className="text-[10px] text-gray-400">Críticas</div></div>
            </div>
          </section>
          <section className="bg-black/30 p-6 rounded-lg border border-c8l-gold/30">
            <h2 className="text-lg font-bold text-c8l-gold mb-3">Infracciones Leves (🔵 3 días)</h2>
            <ul className="text-sm text-gray-300 list-disc list-inside space-y-1">
              <li>Spam publicitario</li><li>Lenguaje ofensivo leve</li><li>Comportamiento tóxico inicial</li><li>Uso indebido de la plataforma</li>
            </ul>
          </section>
          <section className="bg-black/30 p-6 rounded-lg border border-c8l-gold/30">
            <h2 className="text-lg font-bold text-c8l-gold mb-3">Infracciones Medias (🟡 7 días)</h2>
            <ul className="text-sm text-gray-300 list-disc list-inside space-y-1">
              <li>Enlaces maliciosos</li><li>Acoso verbal</li><li>Contenido inapropiado</li><li>Violación de copyright</li><li>Comportamiento tóxico recurrente</li>
            </ul>
          </section>
          <section className="bg-black/30 p-6 rounded-lg border border-c8l-gold/30">
            <h2 className="text-lg font-bold text-c8l-gold mb-3">Infracciones Graves (🟠 30 días)</h2>
            <ul className="text-sm text-gray-300 list-disc list-inside space-y-1">
              <li>Discurso de odio</li><li>Amenazas de daño físico</li><li>Acoso sexual/psicológico</li><li>Apología de la violencia</li><li>Violación de privacidad</li><li>Manipulación de juegos</li>
            </ul>
          </section>
          <section className="bg-black/30 p-6 rounded-lg border border-red-600/30">
            <h2 className="text-lg font-bold text-red-400 mb-3">Infracciones Críticas (🔴 Permanente)</h2>
            <ul className="text-sm text-gray-300 list-disc list-inside space-y-1">
              <li>Amenazas de muerte</li><li>Incitación a la violencia</li><li>Acoso colectivo</li><li>Contenido violento explícito</li><li>Suplantación de identidad</li><li>Estafa a usuarios</li><li>Difusión de datos personales</li>
            </ul>
          </section>
          <section className="bg-black/30 p-6 rounded-lg border border-c8l-gold/30">
            <h2 className="text-lg font-bold text-c8l-gold mb-3">Apelaciones</h2>
            <p className="text-sm text-gray-300">Si consideras que tu sanción es injusta, puedes apelar enviando un email a <a href="mailto:moderacion@c8l.agency" className="text-c8l-gold">moderacion@c8l.agency</a> indicando tu nombre de usuario, la fecha del bloqueo y el motivo de tu apelación. Las apelaciones se revisan en un plazo de 24-48 horas.</p>
          </section>
        </div>
        <div className="mt-8 text-center text-xs text-gray-600">
          <p>Última actualización: 22 de junio de 2026</p>
        </div>
      </div>
    </div>
  );
}
