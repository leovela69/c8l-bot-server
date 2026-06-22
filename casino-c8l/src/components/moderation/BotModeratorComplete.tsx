'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';

const INFRACTION_TYPES = {
  spam: { label: '📢 Spam', severity: 'leve', days: 3, description: 'Publicidad no autorizada o mensajes repetitivos' },
  spam_malicious: { label: '📢 Enlaces Maliciosos', severity: 'media', days: 7, description: 'Enlaces sospechosos o maliciosos' },
  offensive_language: { label: '💬 Lenguaje Ofensivo', severity: 'leve', days: 3, description: 'Uso de insultos o lenguaje inapropiado' },
  hate_speech: { label: '💬 Discurso de Odio', severity: 'grave', days: 30, description: 'Discurso que promueve odio hacia grupos' },
  incitement_violence: { label: '💀 Incitación a la Violencia', severity: 'critica', days: 0, description: 'Incitación a actos violentos', permanent: true },
  harassment_verbal: { label: '🚫 Acoso Verbal', severity: 'media', days: 7, description: 'Insultos reiterados y descalificaciones' },
  harassment_sexual: { label: '🚫 Acoso Sexual', severity: 'grave', days: 30, description: 'Comentarios sexuales no deseados' },
  harassment_psychological: { label: '🚫 Acoso Psicológico', severity: 'grave', days: 30, description: 'Manipulación y hostigamiento' },
  harassment_mob: { label: '🚫 Acoso Colectivo', severity: 'critica', days: 0, description: 'Acoso grupal o manada', permanent: true },
  death_threat: { label: '⚠️ Amenaza de Muerte', severity: 'critica', days: 0, description: 'Amenaza de muerte explícita', permanent: true },
  physical_threat: { label: '⚠️ Amenaza Daño Físico', severity: 'grave', days: 30, description: 'Amenaza de daño físico no letal' },
  violence_apology: { label: '💀 Apología Violencia', severity: 'grave', days: 30, description: 'Defensa de actos violentos' },
  violence_explicit: { label: '💀 Contenido Violento', severity: 'critica', days: 0, description: 'Contenido violento gráfico', permanent: true },
  impersonation: { label: '🎭 Suplantación', severity: 'critica', days: 0, description: 'Hacerse pasar por otro usuario', permanent: true },
  impersonation_streamer: { label: '🎭 Suplantación Streamer', severity: 'critica', days: 0, description: 'Hacerse pasar por streamer', permanent: true },
  fraud: { label: '💰 Estafa', severity: 'critica', days: 0, description: 'Estafa o engaño a usuarios', permanent: true },
  game_manipulation: { label: '💰 Manipulación Juegos', severity: 'grave', days: 30, description: 'Trampas en juegos' },
  privacy_violation: { label: '⚖️ Violación Privacidad', severity: 'grave', days: 30, description: 'Publicación info privada' },
  personal_data_leak: { label: '⚖️ Difusión Datos', severity: 'critica', days: 0, description: 'Publicar datos personales', permanent: true },
  copyright: { label: '⚖️ Derechos Autor', severity: 'media', days: 7, description: 'Contenido con derechos sin permiso' },
  toxic_behavior: { label: '👥 Comportamiento Tóxico', severity: 'media', days: 7, description: 'Comportamiento tóxico recurrente' },
  community_sabotage: { label: '👥 Sabotaje', severity: 'grave', days: 30, description: 'Acciones que dañan la comunidad' },
  hate_incitement: { label: '👥 Incitación Odio', severity: 'critica', days: 0, description: 'Incitación al odio', permanent: true },
};

export function BotModeratorComplete() {
  const [activeSanctions, setActiveSanctions] = useState([]);
  const [pendingInfractions, setPendingInfractions] = useState([]);
  const [moderationLogs, setModerationLogs] = useState([]);
  const [showSanctionModal, setShowSanctionModal] = useState(false);
  const [selectedInfraction, setSelectedInfraction] = useState(null);
  const [stats, setStats] = useState({
    total_infractions: 47, active_blocks: 12, permanent_blocks: 3,
    appeals_pending: 2, resolved_today: 8, auto_blocked: 34
  });


  useEffect(() => { loadAll(); startAutoDetection(); }, []);

  const loadAll = () => {
    setActiveSanctions([
      { id: '1', user: { name: 'UsuarioToxico', avatar: '👤' }, type: 'harassment_verbal', days: 7, end_date: new Date(Date.now()+5*24*60*60*1000), severity: 'media', is_permanent: false },
      { id: '2', user: { name: 'Spammer999', avatar: '🤖' }, type: 'spam', days: 3, end_date: new Date(Date.now()+1*24*60*60*1000), severity: 'leve', is_permanent: false },
    ]);
    setPendingInfractions([
      { id: '1', user_name: 'HaterPro', user_avatar: '😈', type: 'hate_speech', severity: 'grave', description: 'Discurso de odio en chat', sanction_days: 30, is_permanent: false, context: { location: 'Sala Principal', timestamp: new Date().toISOString(), message: 'Mensaje ofensivo' } },
      { id: '2', user_name: 'TrollMaster', user_avatar: '🎭', type: 'impersonation', severity: 'critica', description: 'Suplantación de streamer', sanction_days: 0, is_permanent: true, context: { location: 'Perfil', timestamp: new Date().toISOString(), message: 'Perfil falso Leo Vela' } },
    ]);
    setModerationLogs([
      { action: '🔴 Bloqueo 30d a HaterPro', time: 'Hace 2m', details: 'Discurso de odio' },
      { action: '🔴 Bloqueo permanente a TrollMaster', time: 'Hace 15m', details: 'Suplantación' },
      { action: '🟡 Advertencia a Spammer999', time: 'Hace 1h', details: 'Spam en chat' },
    ]);
  };

  const startAutoDetection = () => {
    setInterval(() => {
      if (Math.random() > 0.85) {
        const types = Object.keys(INFRACTION_TYPES);
        const type = types[Math.floor(Math.random() * types.length)];
        autoDetect(type);
      }
    }, 15000);
  };

  const autoDetect = (type) => {
    const inf = INFRACTION_TYPES[type];
    if (!inf) return;
    const newInf = {
      id: Date.now().toString(), user_name: 'User_' + Math.floor(Math.random()*1000),
      user_avatar: ['👤','😈','🤖','🎭','💀'][Math.floor(Math.random()*5)],
      type, severity: inf.severity, description: inf.description,
      sanction_days: inf.days, is_permanent: inf.permanent || false,
      context: { location: ['Chat','Sala','Casino','Cover'][Math.floor(Math.random()*4)], timestamp: new Date().toISOString(), message: 'Auto-detectado: ' + inf.label }
    };
    applyAutoSanction(newInf);
  };

  const applyAutoSanction = (infraction) => {
    const type = INFRACTION_TYPES[infraction.type];
    setActiveSanctions(prev => [...prev, {
      id: infraction.id, user: { name: infraction.user_name, avatar: infraction.user_avatar },
      type: infraction.type, days: infraction.sanction_days,
      end_date: infraction.is_permanent ? null : new Date(Date.now()+infraction.sanction_days*24*60*60*1000),
      severity: infraction.severity, is_permanent: infraction.is_permanent
    }]);
    setModerationLogs(prev => [{ action: `🔴 Auto-bloqueo: ${infraction.user_name} - ${type?.label}`, time: 'Ahora', details: type?.description }, ...prev]);
    setStats(prev => ({ ...prev, total_infractions: prev.total_infractions+1, active_blocks: prev.active_blocks+1, auto_blocked: prev.auto_blocked+1, ...(infraction.is_permanent?{permanent_blocks:prev.permanent_blocks+1}:{}) }));
  };

  const applyManualSanction = (infraction) => {
    applyAutoSanction(infraction);
    setPendingInfractions(prev => prev.filter(p => p.id !== infraction.id));
    setShowSanctionModal(false);
  };

  const getSeverityColor = (s) => ({ leve:'bg-blue-500 text-white', media:'bg-yellow-500 text-black', grave:'bg-orange-600 text-white', critica:'bg-red-700 text-white' }[s] || 'bg-gray-500');
  const getSeverityIcon = (s) => ({ leve:'🔵', media:'🟡', grave:'🟠', critica:'🔴' }[s] || '⚪');
  const getDaysLabel = (d, perm) => perm ? '🔒 PERMANENTE' : d===3?'3 días':d===7?'7 días':d===30?'30 días':`${d} días`;


  return (
    <div className="bg-gradient-to-br from-black to-purple-900/20 p-6 rounded-2xl border-2 border-c8l-gold shadow-[0_0_30px_rgba(212,175,55,0.3)]">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <div className="relative"><div className="text-4xl">🛡️</div><div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" /></div>
          <div>
            <h2 className="text-2xl font-black text-c8l-gold flex items-center gap-2">Guardián de la Comunidad<span className="text-xs bg-c8l-gold text-black px-2 py-0.5 rounded-full">AUTORIDAD OFICIAL</span></h2>
            <p className="text-sm text-gray-400">Moderación automática + humana • Bloqueos: 3/7/30 días + Permanente</p>
          </div>
        </div>
        <div className="flex items-center gap-2"><div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" /><span className="text-xs text-gray-400">Activo 24/7</span></div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-6">
        <div className="bg-black/40 p-3 rounded-lg border border-gray-800 text-center"><div className="text-2xl font-bold text-c8l-gold">{stats.total_infractions}</div><div className="text-xs text-gray-400">Total</div></div>
        <div className="bg-black/40 p-3 rounded-lg border border-red-600/30 text-center"><div className="text-2xl font-bold text-red-500">{stats.active_blocks}</div><div className="text-xs text-gray-400">Activos</div></div>
        <div className="bg-black/40 p-3 rounded-lg border border-purple-600/30 text-center"><div className="text-2xl font-bold text-purple-400">{stats.permanent_blocks}</div><div className="text-xs text-gray-400">Permanentes</div></div>
        <div className="bg-black/40 p-3 rounded-lg border border-yellow-600/30 text-center"><div className="text-2xl font-bold text-yellow-500">{stats.appeals_pending}</div><div className="text-xs text-gray-400">Apelaciones</div></div>
        <div className="bg-black/40 p-3 rounded-lg border border-green-600/30 text-center"><div className="text-2xl font-bold text-green-500">{stats.resolved_today}</div><div className="text-xs text-gray-400">Hoy</div></div>
        <div className="bg-black/40 p-3 rounded-lg border border-blue-600/30 text-center"><div className="text-2xl font-bold text-blue-400">{stats.auto_blocked}</div><div className="text-xs text-gray-400">Auto</div></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bloqueos activos */}
        <div className="bg-black/40 p-4 rounded-lg border border-gray-800">
          <h3 className="text-sm font-bold text-c8l-gold mb-3">🔒 Bloqueos Activos ({activeSanctions.length})</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {activeSanctions.map((s)=>{const t=INFRACTION_TYPES[s.type];return(
              <div key={s.id} className="flex items-center justify-between p-2 bg-black/30 rounded border border-gray-800">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">{s.user?.avatar||'👤'}</div>
                  <div><div className="font-bold text-white text-sm">{s.user?.name}</div><div className="flex items-center gap-2 text-xs"><span className={`px-1.5 py-0.5 rounded text-[10px] ${getSeverityColor(s.severity)}`}>{getSeverityIcon(s.severity)} {s.severity}</span><span className="text-gray-400">{t?.label}</span></div></div>
                </div>
                <div className="text-right"><div className="text-xs font-bold text-c8l-gold">{getDaysLabel(s.days, s.is_permanent)}</div>{s.end_date&&<div className="text-[10px] text-gray-500">hasta {new Date(s.end_date).toLocaleDateString()}</div>}</div>
              </div>
            );})}
            {activeSanctions.length===0&&<div className="text-center text-gray-500 py-4 text-sm">Sin bloqueos</div>}
          </div>
        </div>

        {/* Pendientes */}
        <div className="bg-black/40 p-4 rounded-lg border border-gray-800">
          <h3 className="text-sm font-bold text-yellow-400 mb-3">⚠️ Pendientes ({pendingInfractions.length})</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {pendingInfractions.map((inf)=>{const t=INFRACTION_TYPES[inf.type];return(
              <div key={inf.id} className="flex items-center justify-between p-2 bg-black/30 rounded border border-gray-800">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">{inf.user_avatar||'👤'}</div>
                  <div><div className="font-bold text-white text-sm">{inf.user_name}</div><div className="flex items-center gap-2 text-xs"><span className={`px-1.5 py-0.5 rounded text-[10px] ${getSeverityColor(inf.severity)}`}>{getSeverityIcon(inf.severity)} {inf.severity}</span><span className="text-gray-400">{t?.label}</span></div></div>
                </div>
                <button onClick={()=>{setSelectedInfraction(inf);setShowSanctionModal(true);}} className="px-3 py-1 bg-c8l-gold/20 hover:bg-c8l-gold/40 rounded text-c8l-gold text-xs font-bold transition">Revisar</button>
              </div>
            );})}
            {pendingInfractions.length===0&&<div className="text-center text-gray-500 py-4 text-sm">Sin pendientes</div>}
          </div>
        </div>
      </div>

      {/* Logs */}
      <div className="mt-6 bg-black/30 p-3 rounded-lg border border-gray-800">
        <h4 className="text-xs font-bold text-gray-400 mb-2">📋 Registro del Guardián</h4>
        <div className="space-y-1 max-h-32 overflow-y-auto">
          {moderationLogs.slice(0,8).map((log,i)=>(<div key={i} className="flex justify-between text-xs text-gray-500 border-b border-gray-800 pb-1"><span>{log.action}</span><span>{log.time}</span></div>))}
        </div>
      </div>


      {/* Modal de sanción */}
      <AnimatePresence>
        {showSanctionModal && selectedInfraction && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
            <motion.div initial={{scale:0.9}} animate={{scale:1}} exit={{scale:0.9}} className="bg-gray-900 border-4 border-c8l-gold p-6 rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-c8l-gold">⚖️ Revisión de Infracción</h3>
                <button onClick={()=>setShowSanctionModal(false)} className="text-gray-400 hover:text-white">✕</button>
              </div>
              <div className="space-y-4">
                <div className="bg-black/30 p-3 rounded-lg border border-gray-800">
                  <div className="flex items-center gap-3"><div className="text-3xl">{selectedInfraction.user_avatar}</div><div><div className="font-bold text-white">{selectedInfraction.user_name}</div></div></div>
                </div>
                <div className="bg-black/30 p-3 rounded-lg border border-gray-800">
                  <div className="text-sm text-gray-400">Infracción</div>
                  <div className="font-bold text-white">{INFRACTION_TYPES[selectedInfraction.type]?.label}</div>
                  <div className="text-sm text-gray-300 mt-1">{selectedInfraction.description}</div>
                </div>
                <div className="bg-black/30 p-3 rounded-lg border border-gray-800">
                  <div className="text-sm text-gray-400">Contexto</div>
                  <div className="text-sm text-gray-300">📍 {selectedInfraction.context?.location} • 🕐 {new Date(selectedInfraction.context?.timestamp).toLocaleString()}</div>
                  {selectedInfraction.context?.message && <div className="mt-1 p-2 bg-black/50 rounded text-xs text-gray-400">"{selectedInfraction.context.message}"</div>}
                </div>
                <div className="bg-black/30 p-3 rounded-lg border border-gray-800">
                  <div className="text-sm text-gray-400">Gravedad</div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`px-2 py-0.5 rounded text-xs ${getSeverityColor(selectedInfraction.severity)}`}>{getSeverityIcon(selectedInfraction.severity)} {selectedInfraction.severity.toUpperCase()}</span>
                    {selectedInfraction.is_permanent && <span className="bg-red-900 text-white px-2 py-0.5 rounded-full text-xs">🚨 PERMANENTE</span>}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={()=>applyManualSanction(selectedInfraction)} className="flex-1 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition">
                    {selectedInfraction.is_permanent ? '🔒 Bloquear Permanente' : `🔴 Bloquear ${getDaysLabel(selectedInfraction.sanction_days, false)}`}
                  </button>
                  <button onClick={()=>{setPendingInfractions(prev=>prev.filter(p=>p.id!==selectedInfraction.id));setShowSanctionModal(false);}} className="px-4 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition">✅ Descartar</button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
