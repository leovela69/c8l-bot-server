'use client';
import { motion, AnimatePresence } from 'framer-motion';

interface LegalModalProps { isOpen: boolean; onClose: () => void; }

export function LegalModal({ isOpen, onClose }: LegalModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
          className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4 overflow-y-auto"
          onClick={onClose}>
          <motion.div initial={{scale:0.9,y:20}} animate={{scale:1,y:0}} exit={{scale:0.9,y:20}}
            className="bg-gradient-to-br from-gray-900 to-black border-4 border-c8l-gold max-w-4xl w-full max-h-[90vh] overflow-y-auto rounded-2xl shadow-[0_0_50px_rgba(212,175,55,0.2)]"
            onClick={(e)=>e.stopPropagation()}>
            {/* Header sticky */}
            <div className="sticky top-0 bg-gray-900/95 backdrop-blur z-10 p-4 border-b border-gray-800 flex justify-between items-center">
              <h2 className="text-2xl font-black text-c8l-gold flex items-center gap-2">🛡️ Normas y Protección de Datos</h2>
              <button onClick={onClose} className="w-10 h-10 rounded-full bg-black/50 border border-gray-700 text-gray-400 hover:text-white hover:border-c8l-gold transition flex items-center justify-center">✕</button>
            </div>

            <div className="p-6 space-y-8">
              {/* 1. Empresa */}
              <div className="bg-black/30 p-4 rounded-lg border border-gray-800">
                <h3 className="text-lg font-bold text-c8l-gold mb-3">🏢 Identificación de la Empresa</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                  <div className="flex justify-between border-b border-gray-800/50 py-1"><span className="text-gray-400">Razón Social:</span><span className="text-white font-medium">C8L Agency (Corazones Locos Family)</span></div>
                  <div className="flex justify-between border-b border-gray-800/50 py-1"><span className="text-gray-400">Representante:</span><span className="text-white font-medium">Leo Vela</span></div>
                  <div className="flex justify-between border-b border-gray-800/50 py-1"><span className="text-gray-400">CIF/NIF:</span><span className="text-white font-medium">[Pendiente]</span></div>
                  <div className="flex justify-between border-b border-gray-800/50 py-1"><span className="text-gray-400">Email legal:</span><a href="mailto:legal@c8l.agency" className="text-c8l-gold hover:underline">legal@c8l.agency</a></div>
                  <div className="flex justify-between border-b border-gray-800/50 py-1"><span className="text-gray-400">Teléfono:</span><span className="text-white font-medium">[+34 900 000 000]</span></div>
                  <div className="flex justify-between border-b border-gray-800/50 py-1"><span className="text-gray-400">Web:</span><a href="https://c8l.agency" className="text-c8l-gold hover:underline">https://c8l.agency</a></div>
                </div>
              </div>


              {/* 2. Bot Oficial */}
              <div className="bg-gradient-to-r from-c8l-gold/10 to-purple-600/10 p-4 rounded-lg border-2 border-c8l-gold">
                <h3 className="text-lg font-bold text-c8l-gold mb-3">🤖 Bot Oficial C8L Guardian</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                  <div className="flex justify-between border-b border-gray-800/50 py-1"><span className="text-gray-400">Nombre:</span><span className="text-white font-medium">C8L Guardian</span></div>
                  <div className="flex justify-between border-b border-gray-800/50 py-1"><span className="text-gray-400">ID Oficial:</span><span className="text-c8l-gold font-mono text-xs">@C8L_Guardian_Bot</span></div>
                  <div className="flex justify-between border-b border-gray-800/50 py-1"><span className="text-gray-400">Función:</span><span className="text-white font-medium">Moderación Automática</span></div>
                  <div className="flex justify-between border-b border-gray-800/50 py-1"><span className="text-gray-400">Autoridad:</span><span className="text-green-400 font-medium">✅ Oficial</span></div>
                  <div className="flex justify-between border-b border-gray-800/50 py-1 col-span-2"><span className="text-gray-400">Sujeto a:</span><span className="text-c8l-gold font-medium">Protección de Datos y Normas de la Comunidad</span></div>
                </div>
              </div>

              {/* 3. Protección de Datos */}
              <div className="bg-black/30 p-4 rounded-lg border border-purple-600/30">
                <h3 className="text-lg font-bold text-purple-400 mb-3">🔒 Protección de Datos</h3>
                <div className="space-y-2 text-sm text-gray-300">
                  <p>✅ <span className="font-bold text-white">RGPD / LOPD:</span> Cumplimos con el Reglamento General de Protección de Datos (UE) 2016/679 y la Ley Orgánica 3/2018.</p>
                  <p>✅ <span className="font-bold text-white">Derechos:</span> Acceso, rectificación, cancelación, oposición, limitación del tratamiento y portabilidad.</p>
                  <p>✅ <span className="font-bold text-white">Responsable:</span> C8L Agency (Corazones Locos Family).</p>
                  <p>✅ <span className="font-bold text-white">Finalidad:</span> Gestión de usuarios, moderación, mejora de servicios y comunicación.</p>
                  <p>✅ <span className="font-bold text-white">Conservación:</span> Datos conservados el tiempo necesario para cumplir las finalidades.</p>
                  <p>✅ <span className="font-bold text-white">Seguridad:</span> Medidas técnicas y organizativas para garantizar la seguridad.</p>
                </div>
              </div>

              {/* 4. Normas Comunidad */}
              <div className="bg-black/30 p-4 rounded-lg border border-c8l-gold/30">
                <h3 className="text-lg font-bold text-c8l-gold mb-3">👥 Normas de la Comunidad</h3>
                <div className="space-y-3 text-sm">
                  <div className="bg-red-600/10 border-l-4 border-red-600 p-3 rounded-r-lg">
                    <div className="font-bold text-red-400">🚨 ZONA PROHIBIDA (Bloqueo Permanente)</div>
                    <div className="text-gray-300 text-xs grid grid-cols-2 gap-1 mt-1"><span>• Amenazas de muerte</span><span>• Incitación a la violencia</span><span>• Acoso colectivo</span><span>• Contenido violento explícito</span><span>• Suplantación</span><span>• Estafas</span></div>
                  </div>
                  <div className="bg-orange-600/10 border-l-4 border-orange-600 p-3 rounded-r-lg">
                    <div className="font-bold text-orange-400">🔶 GRAVES (30 días)</div>
                    <div className="text-gray-300 text-xs grid grid-cols-2 gap-1 mt-1"><span>• Discurso de odio</span><span>• Amenazas físicas</span><span>• Acoso sexual/psicológico</span><span>• Apología violencia</span></div>
                  </div>
                  <div className="bg-yellow-600/10 border-l-4 border-yellow-600 p-3 rounded-r-lg">
                    <div className="font-bold text-yellow-400">🟡 MEDIAS (7 días)</div>
                    <div className="text-gray-300 text-xs grid grid-cols-2 gap-1 mt-1"><span>• Enlaces maliciosos</span><span>• Acoso verbal</span><span>• Contenido inapropiado</span><span>• Comportamiento tóxico</span></div>
                  </div>
                  <div className="bg-blue-600/10 border-l-4 border-blue-600 p-3 rounded-r-lg">
                    <div className="font-bold text-blue-400">🔵 LEVES (3 días)</div>
                    <div className="text-gray-300 text-xs grid grid-cols-2 gap-1 mt-1"><span>• Spam</span><span>• Lenguaje ofensivo</span><span>• Comportamiento disruptivo</span><span>• Primera advertencia</span></div>
                  </div>
                </div>
              </div>

              {/* 5. Contacto */}
              <div className="bg-black/30 p-4 rounded-lg border border-gray-800">
                <h3 className="text-lg font-bold text-c8l-gold mb-3">📧 Contacto</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                  <div className="bg-black/50 p-3 rounded-lg border border-gray-700 text-center"><div className="text-xl mb-1">📧</div><div className="font-bold text-white text-xs">LEGAL</div><a href="mailto:legal@c8l.agency" className="text-c8l-gold hover:underline text-xs">legal@c8l.agency</a></div>
                  <div className="bg-black/50 p-3 rounded-lg border border-gray-700 text-center"><div className="text-xl mb-1">🛡️</div><div className="font-bold text-white text-xs">MODERACIÓN</div><a href="mailto:moderacion@c8l.agency" className="text-purple-400 hover:underline text-xs">moderacion@c8l.agency</a></div>
                  <div className="bg-black/50 p-3 rounded-lg border border-gray-700 text-center"><div className="text-xl mb-1">💬</div><div className="font-bold text-white text-xs">SOPORTE</div><a href="mailto:soporte@c8l.agency" className="text-blue-400 hover:underline text-xs">soporte@c8l.agency</a></div>
                </div>
              </div>

              {/* Botón aceptar */}
              <div className="flex justify-center pt-4 border-t border-gray-800">
                <button onClick={onClose} className="px-8 py-3 bg-gradient-to-r from-c8l-gold to-c8l-pink text-black font-bold rounded-lg hover:scale-105 transition shadow-lg">✅ He leído y acepto las normas</button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
