'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export function LegalFooter() {
  const [showLegalModal, setShowLegalModal] = useState(false);

  return (
    <footer className="bg-black border-t-4 border-c8l-gold py-6 px-4 mt-12">
      <div className="max-w-7xl mx-auto">
        {/* Aviso de Moderación */}
        <div className="bg-gradient-to-r from-red-600/10 to-purple-600/10 border-2 border-c8l-gold rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🛡️</span>
              <div>
                <div className="font-black text-c8l-gold text-sm uppercase tracking-wider">🤖 MODERACIÓN AUTOMÁTICA ACTIVA</div>
                <div className="text-xs text-gray-400">C8L Guardian • Bot Oficial • Sujeto a Protección de Datos</div>
              </div>
            </div>
            <button onClick={() => setShowLegalModal(true)}
              className="px-4 py-2 bg-c8l-gold/20 text-c8l-gold border border-c8l-gold rounded-lg text-sm font-bold hover:bg-c8l-gold/30 transition flex items-center gap-2">
              📜 Ver Normas y Protección de Datos
            </button>
          </div>
        </div>

        {/* Grid de Normas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-black/40 p-3 rounded-lg border border-gray-800 text-center">
            <div className="text-xl">🛡️</div>
            <div className="text-xs font-bold text-white mt-1">Bloqueos</div>
            <div className="text-[10px] text-gray-500">3/7/30 días • Permanente</div>
          </div>
          <div className="bg-black/40 p-3 rounded-lg border border-gray-800 text-center">
            <div className="text-xl">🔒</div>
            <div className="text-xs font-bold text-white mt-1">Protección de Datos</div>
            <div className="text-[10px] text-gray-500">RGPD / LOPD</div>
          </div>
          <div className="bg-black/40 p-3 rounded-lg border border-gray-800 text-center">
            <div className="text-xl">👥</div>
            <div className="text-xs font-bold text-white mt-1">Comunidad Segura</div>
            <div className="text-[10px] text-gray-500">Tolerancia Cero</div>
          </div>
          <div className="bg-black/40 p-3 rounded-lg border border-gray-800 text-center">
            <div className="text-xl">💖</div>
            <div className="text-xs font-bold text-white mt-1">Respeto</div>
            <div className="text-[10px] text-gray-500">Valor Fundamental</div>
          </div>
        </div>


        {/* Links legales */}
        <div className="flex flex-wrap justify-center gap-6 text-xs text-gray-500">
          <button onClick={() => setShowLegalModal(true)} className="hover:text-c8l-gold transition">⚖️ Normas de la Comunidad</button>
          <button onClick={() => setShowLegalModal(true)} className="hover:text-c8l-gold transition">🛡️ Protección de Datos</button>
          <button onClick={() => setShowLegalModal(true)} className="hover:text-c8l-gold transition">🚩 Política de Moderación</button>
          <button onClick={() => setShowLegalModal(true)} className="hover:text-c8l-gold transition">🍪 Política de Cookies</button>
        </div>

        {/* Copyright */}
        <div className="text-center text-[10px] text-gray-600 mt-4 border-t border-gray-800 pt-4">
          © 2026 C8L Agency (Corazones Locos Family). Todos los derechos reservados.
          <br />
          <span className="text-gray-700">🤖 C8L Guardian es un bot oficial de moderación sujeto a las normas de la plataforma y a la protección de datos.</span>
        </div>
      </div>

      {/* Modal Legal Completo */}
      <AnimatePresence>
        {showLegalModal && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
            className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4 overflow-y-auto"
            onClick={() => setShowLegalModal(false)}>
            <motion.div initial={{scale:0.9,y:20}} animate={{scale:1,y:0}} exit={{scale:0.9,y:20}}
              className="bg-gray-900 border-4 border-c8l-gold max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6 rounded-2xl"
              onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-black text-c8l-gold">🛡️ Normas y Protección de Datos</h2>
                <button onClick={() => setShowLegalModal(false)} className="text-gray-400 hover:text-white text-2xl">✕</button>
              </div>

              <div className="space-y-8">
                {/* 1. Empresa */}
                <div className="bg-black/30 p-4 rounded-lg border border-gray-800">
                  <h3 className="text-lg font-bold text-c8l-gold mb-2">🏢 Identificación de la Empresa</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="text-gray-400">Razón Social:</div><div className="text-white font-medium">C8L Agency (Corazones Locos Family)</div>
                    <div className="text-gray-400">Representante:</div><div className="text-white font-medium">Leo Vela</div>
                    <div className="text-gray-400">Email contacto:</div><div className="text-white font-medium">legal@c8l.agency</div>
                    <div className="text-gray-400">Web:</div><div className="text-white font-medium">https://c8l.agency</div>
                    <div className="text-gray-400">Bot Oficial:</div><div className="text-white font-medium">🤖 C8L Guardian <span className="text-xs text-c8l-gold">(Oficial)</span></div>
                  </div>
                </div>

                {/* 2. Protección de Datos */}
                <div className="bg-black/30 p-4 rounded-lg border border-purple-600/30">
                  <h3 className="text-lg font-bold text-purple-400 mb-2">🔒 Protección de Datos</h3>
                  <div className="space-y-2 text-sm text-gray-300">
                    <p>✅ <span className="font-bold text-white">RGPD / LOPD:</span> Cumplimos con el Reglamento General de Protección de Datos y la Ley Orgánica de Protección de Datos.</p>
                    <p>✅ <span className="font-bold text-white">Derechos del Usuario:</span> Acceso, rectificación, cancelación, oposición, limitación del tratamiento y portabilidad.</p>
                    <p>✅ <span className="font-bold text-white">Responsable del Tratamiento:</span> C8L Agency (Corazones Locos Family).</p>
                    <p>✅ <span className="font-bold text-white">Finalidad:</span> Gestión de usuarios, moderación, mejora de servicios y comunicación.</p>
                    <p>✅ <span className="font-bold text-white">Conservación:</span> Se conservarán durante el tiempo necesario para cumplir con las finalidades.</p>
                    <p>✅ <span className="font-bold text-white">Seguridad:</span> Medidas técnicas y organizativas para garantizar la seguridad de los datos.</p>
                  </div>
                </div>


                {/* 3. Normas de la Comunidad */}
                <div className="bg-black/30 p-4 rounded-lg border border-c8l-gold/30">
                  <h3 className="text-lg font-bold text-c8l-gold mb-2">👥 Normas de la Comunidad</h3>
                  <div className="space-y-3 text-sm">
                    <div className="bg-red-600/10 border-l-4 border-red-600 p-2">
                      <div className="font-bold text-red-400">🚨 ZONA PROHIBIDA (Bloqueo Permanente)</div>
                      <div className="text-gray-300 text-xs">• Amenazas de muerte • Incitación a la violencia • Acoso colectivo • Contenido violento explícito • Suplantación • Estafas</div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <div className="bg-orange-600/10 border-l-4 border-orange-600 p-2">
                        <div className="font-bold text-orange-400">🟠 Graves (30 días)</div>
                        <div className="text-gray-300 text-xs">• Discurso de odio • Amenazas físicas • Acoso sexual/psicológico • Apología violencia</div>
                      </div>
                      <div className="bg-yellow-600/10 border-l-4 border-yellow-600 p-2">
                        <div className="font-bold text-yellow-400">🟡 Medias (7 días)</div>
                        <div className="text-gray-300 text-xs">• Enlaces maliciosos • Acoso verbal • Contenido inapropiado • Comportamiento tóxico</div>
                      </div>
                    </div>
                    <div className="bg-blue-600/10 border-l-4 border-blue-600 p-2">
                      <div className="font-bold text-blue-400">🔵 Leves (3 días)</div>
                      <div className="text-gray-300 text-xs">• Spam • Lenguaje ofensivo • Comportamiento disruptivo leve</div>
                    </div>
                  </div>
                </div>

                {/* 4. Sistema de Sanciones */}
                <div className="bg-black/30 p-4 rounded-lg border border-gray-800">
                  <h3 className="text-lg font-bold text-c8l-gold mb-2">⚖️ Sistema de Sanciones</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-blue-600/10 p-3 rounded-lg border border-blue-600/30 text-center"><div className="text-2xl">🔵</div><div className="font-bold text-blue-400 text-sm">3 Días</div><div className="text-[10px] text-gray-400">Leves</div></div>
                    <div className="bg-yellow-600/10 p-3 rounded-lg border border-yellow-600/30 text-center"><div className="text-2xl">🟡</div><div className="font-bold text-yellow-400 text-sm">7 Días</div><div className="text-[10px] text-gray-400">Medias</div></div>
                    <div className="bg-orange-600/10 p-3 rounded-lg border border-orange-600/30 text-center"><div className="text-2xl">🟠</div><div className="font-bold text-orange-400 text-sm">30 Días</div><div className="text-[10px] text-gray-400">Graves</div></div>
                    <div className="bg-red-900/10 p-3 rounded-lg border border-red-900/30 text-center"><div className="text-2xl">🔴</div><div className="font-bold text-red-500 text-sm">Permanente</div><div className="text-[10px] text-gray-400">Críticas</div></div>
                  </div>
                </div>

                {/* 5. Bot Oficial */}
                <div className="bg-gradient-to-r from-c8l-gold/10 to-purple-600/10 p-4 rounded-lg border-2 border-c8l-gold">
                  <h3 className="text-lg font-bold text-c8l-gold mb-2">🤖 Bot Oficial C8L Guardian</h3>
                  <div className="text-sm text-gray-300 space-y-2">
                    <p>✅ <span className="font-bold text-white">Identificación:</span> C8L Guardian es el bot oficial de moderación de C8L Agency.</p>
                    <p>✅ <span className="font-bold text-white">Autoridad:</span> Tiene autoridad para aplicar sanciones según las normas establecidas.</p>
                    <p>✅ <span className="font-bold text-white">Transparencia:</span> Todas las acciones del bot son registradas y auditables.</p>
                    <p>✅ <span className="font-bold text-white">Apelaciones:</span> Los usuarios pueden apelar las sanciones a través del sistema oficial.</p>
                    <p>✅ <span className="font-bold text-white">Protección de Datos:</span> El bot actúa bajo la normativa RGPD/LOPD.</p>
                    <div className="flex items-center gap-2 mt-2 p-2 bg-black/50 rounded border border-c8l-gold">
                      <span className="text-xs text-c8l-gold font-mono">🤖 C8L Guardian v2.0 • Oficial • Sujeto a Protección de Datos</span>
                    </div>
                  </div>
                </div>

                {/* 6. Contacto */}
                <div className="bg-black/30 p-4 rounded-lg border border-gray-800">
                  <h3 className="text-lg font-bold text-c8l-gold mb-2">📧 Contacto</h3>
                  <div className="text-sm text-gray-300">
                    <p>📧 <span className="text-white font-medium">legal@c8l.agency</span> — Asuntos legales y protección de datos</p>
                    <p>📧 <span className="text-white font-medium">moderacion@c8l.agency</span> — Apelaciones y moderación</p>
                    <p>📧 <span className="text-white font-medium">soporte@c8l.agency</span> — Soporte técnico</p>
                  </div>
                </div>

                {/* Botón aceptar */}
                <div className="flex justify-center">
                  <button onClick={() => setShowLegalModal(false)}
                    className="px-8 py-3 bg-gradient-to-r from-c8l-gold to-c8l-pink text-black font-bold rounded-lg hover:scale-105 transition">
                    ✅ Acepto y he leído las normas
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </footer>
  );
}


        {/* Links legales */}
        <div className="flex flex-wrap justify-center gap-6 text-xs text-gray-500">
          <button onClick={() => setShowLegalModal(true)} className="hover:text-c8l-gold transition">⚖️ Normas</button>
          <button onClick={() => setShowLegalModal(true)} className="hover:text-c8l-gold transition">🛡️ Protección Datos</button>
          <button onClick={() => setShowLegalModal(true)} className="hover:text-c8l-gold transition">🚩 Moderación</button>
          <button onClick={() => setShowLegalModal(true)} className="hover:text-c8l-gold transition">🍪 Cookies</button>
        </div>
        <div className="text-center text-[10px] text-gray-600 mt-4 border-t border-gray-800 pt-4">
          © 2026 C8L Agency (Corazones Locos Family). Todos los derechos reservados.
          <br /><span className="text-gray-700">🤖 C8L Guardian — Bot oficial sujeto a Protección de Datos</span>
        </div>
      </div>

      {/* Modal Legal */}
      <AnimatePresence>
        {showLegalModal && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4" onClick={()=>setShowLegalModal(false)}>
            <motion.div initial={{scale:0.9}} animate={{scale:1}} exit={{scale:0.9}} className="bg-gray-900 border-4 border-c8l-gold max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6 rounded-2xl" onClick={e=>e.stopPropagation()}>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-black text-c8l-gold">🛡️ Normas y Protección de Datos</h2>
                <button onClick={()=>setShowLegalModal(false)} className="text-gray-400 hover:text-white text-2xl">✕</button>
              </div>
              <div className="space-y-6">
                <div className="bg-black/30 p-4 rounded-lg border border-gray-800">
                  <h3 className="text-lg font-bold text-c8l-gold mb-2">🏢 Empresa</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm"><div className="text-gray-400">Razón Social:</div><div className="text-white">C8L Agency (Corazones Locos Family)</div><div className="text-gray-400">Representante:</div><div className="text-white">Leo Vela</div><div className="text-gray-400">Email:</div><div className="text-white">legal@c8l.agency</div><div className="text-gray-400">Bot Oficial:</div><div className="text-white">🤖 C8L Guardian</div></div>
                </div>
                <div className="bg-black/30 p-4 rounded-lg border border-purple-600/30">
                  <h3 className="text-lg font-bold text-purple-400 mb-2">🔒 Protección de Datos (RGPD/LOPD)</h3>
                  <div className="text-sm text-gray-300 space-y-1">
                    <p>✅ Cumplimos RGPD y LOPD</p><p>✅ Derechos: Acceso, rectificación, cancelación, oposición, limitación, portabilidad</p><p>✅ Responsable: C8L Agency</p><p>✅ Finalidad: Gestión de usuarios, moderación, mejora de servicios</p><p>✅ Seguridad: Medidas técnicas y organizativas</p>
                  </div>
                </div>
                <div className="bg-black/30 p-4 rounded-lg border border-c8l-gold/30">
                  <h3 className="text-lg font-bold text-c8l-gold mb-2">⚖️ Sistema de Sanciones</h3>
                  <div className="grid grid-cols-4 gap-2">
                    <div className="bg-blue-600/10 p-2 rounded text-center"><div className="font-bold text-blue-400">🔵 3d</div><div className="text-[10px] text-gray-400">Leves</div></div>
                    <div className="bg-yellow-600/10 p-2 rounded text-center"><div className="font-bold text-yellow-400">🟡 7d</div><div className="text-[10px] text-gray-400">Medias</div></div>
                    <div className="bg-orange-600/10 p-2 rounded text-center"><div className="font-bold text-orange-400">🟠 30d</div><div className="text-[10px] text-gray-400">Graves</div></div>
                    <div className="bg-red-900/10 p-2 rounded text-center"><div className="font-bold text-red-500">🔴 ∞</div><div className="text-[10px] text-gray-400">Críticas</div></div>
                  </div>
                </div>
                <div className="bg-gradient-to-r from-c8l-gold/10 to-purple-600/10 p-4 rounded-lg border-2 border-c8l-gold">
                  <h3 className="text-lg font-bold text-c8l-gold mb-2">🤖 Bot Oficial</h3>
                  <div className="text-sm text-gray-300 space-y-1">
                    <p>✅ C8L Guardian es el bot oficial de moderación</p><p>✅ Autoridad para aplicar sanciones</p><p>✅ Acciones registradas y auditables</p><p>✅ Apelaciones disponibles</p><p>✅ Actúa bajo RGPD/LOPD</p>
                  </div>
                </div>
                <div className="bg-black/30 p-4 rounded-lg border border-gray-800">
                  <h3 className="text-lg font-bold text-c8l-gold mb-2">📧 Contacto</h3>
                  <div className="text-sm text-gray-300"><p>📧 legal@c8l.agency — Asuntos legales</p><p>📧 moderacion@c8l.agency — Apelaciones</p><p>📧 soporte@c8l.agency — Soporte técnico</p></div>
                </div>
                <div className="flex justify-center"><button onClick={()=>setShowLegalModal(false)} className="px-8 py-3 bg-gradient-to-r from-c8l-gold to-c8l-pink text-black font-bold rounded-lg hover:scale-105 transition">✅ Acepto y he leído las normas</button></div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </footer>
  );
}
