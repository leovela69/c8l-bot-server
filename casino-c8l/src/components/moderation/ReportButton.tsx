'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';

const REPORT_REASONS = [
  { id: 'spam', label: '🔵 Spam / Publicidad', severity: 'light' },
  { id: 'offensive_language', label: '🔵 Lenguaje ofensivo', severity: 'light' },
  { id: 'harassment_light', label: '🟡 Acoso leve', severity: 'medium' },
  { id: 'inappropriate_content', label: '🟡 Contenido inapropiado', severity: 'medium' },
  { id: 'harassment_severe', label: '🟠 Acoso grave', severity: 'severe' },
  { id: 'threats', label: '🟠 Amenazas', severity: 'severe' },
  { id: 'violence', label: '🟠 Violencia', severity: 'severe' },
  { id: 'rights_violation', label: '🔴 Invasión de derechos', severity: 'critical' },
  { id: 'crime', label: '🔴 Actividad delictiva', severity: 'critical' },
];

export function ReportButton({ reportedUserId, userId, context = 'general' }) {
  const [showModal, setShowModal] = useState(false);
  const [selectedReason, setSelectedReason] = useState('');
  const [description, setDescription] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const submitReport = async () => {
    if (!selectedReason) return;
    await supabase.rpc('report_user', {
      p_reporter_id: userId,
      p_reported_user_id: reportedUserId,
      p_reason: selectedReason,
      p_description: description,
      p_context: context
    });
    setSubmitted(true);
    setTimeout(() => { setShowModal(false); setSubmitted(false); setSelectedReason(''); setDescription(''); }, 2000);
  };

  return (
    <>
      <button onClick={() => setShowModal(true)} className="text-gray-500 hover:text-red-400 transition text-xs">🚩 Reportar</button>
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
            className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
            <motion.div initial={{scale:0.9}} animate={{scale:1}} exit={{scale:0.9}}
              className="bg-gray-900 border-2 border-red-500/50 p-6 rounded-2xl max-w-md w-full">
              {submitted ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-2">✅</div>
                  <div className="text-white font-bold">Reporte enviado</div>
                  <div className="text-sm text-gray-400">Nuestro equipo lo revisará pronto</div>
                </div>
              ) : (
                <>
                  <h3 className="text-xl font-bold text-red-400 mb-4">🚩 Reportar Usuario</h3>
                  <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
                    {REPORT_REASONS.map(reason => (
                      <button key={reason.id} onClick={() => setSelectedReason(reason.id)}
                        className={`w-full text-left p-2 rounded-lg text-sm transition ${selectedReason === reason.id ? 'bg-red-600/20 border border-red-500 text-white' : 'bg-black/30 border border-gray-800 text-gray-400 hover:border-gray-600'}`}>
                        {reason.label}
                      </button>
                    ))}
                  </div>
                  <textarea value={description} onChange={e => setDescription(e.target.value)}
                    placeholder="Describe lo que pasó (opcional)..." rows={3}
                    className="w-full bg-black/50 border border-gray-700 rounded-lg px-4 py-2 text-white text-sm resize-none mb-4" />
                  <div className="flex gap-2">
                    <button onClick={submitReport} disabled={!selectedReason}
                      className="flex-1 py-2 bg-red-600 text-white font-bold rounded-lg disabled:opacity-50 hover:bg-red-700 transition">Enviar Reporte</button>
                    <button onClick={() => setShowModal(false)}
                      className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition">Cancelar</button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
