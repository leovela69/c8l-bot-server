'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';

const SEVERITY_CONFIG = {
  light: { label: '🔵 Leve', days: 3, color: 'bg-blue-600', examples: ['Spam', 'Lenguaje ofensivo'] },
  medium: { label: '🟡 Media', days: 7, color: 'bg-yellow-600', examples: ['Acoso leve', 'Contenido inapropiado'] },
  severe: { label: '🟠 Grave', days: 30, color: 'bg-orange-600', examples: ['Acoso grave', 'Amenazas', 'Violencia'] },
  critical: { label: '🔴 Crítica', days: null, color: 'bg-red-600', examples: ['Invasión de derechos', 'Delitos'] },
};

export function ModerationPanel({ isAdmin = false }) {
  const [infractions, setInfractions] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [reports, setReports] = useState([]);
  const [appeals, setAppeals] = useState([]);
  const [activeTab, setActiveTab] = useState('infractions');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ pending: 0, blocked: 0, appeals: 0 });

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    const [inf, blk, rep, app] = await Promise.all([
      supabase.from('moderation_infractions').select('*').order('created_at', { ascending: false }).limit(50),
      supabase.from('moderation_blocks').select('*').eq('is_active', true).order('created_at', { ascending: false }),
      supabase.from('moderation_reports').select('*').eq('status', 'pending').order('created_at', { ascending: false }),
      supabase.from('moderation_appeals').select('*').eq('status', 'pending').order('created_at', { ascending: false }),
    ]);
    setInfractions(inf.data || []);
    setBlocks(blk.data || []);
    setReports(rep.data || []);
    setAppeals(app.data || []);
    setStats({ pending: (rep.data||[]).length, blocked: (blk.data||[]).length, appeals: (app.data||[]).length });
    setLoading(false);
  };


  const confirmInfraction = async (id, severity) => {
    const config = SEVERITY_CONFIG[severity];
    const endsAt = config.days ? new Date(Date.now() + config.days * 24 * 60 * 60 * 1000) : null;
    const infraction = infractions.find(i => i.id === id);
    if (!infraction) return;

    await supabase.from('moderation_infractions').update({ status: 'confirmed', reviewed_at: new Date() }).eq('id', id);
    await supabase.from('moderation_blocks').insert({
      user_id: infraction.user_id, infraction_id: id,
      block_type: severity, reason: infraction.description || infraction.type,
      starts_at: new Date(), ends_at: endsAt, is_active: true
    });
    await supabase.from('moderation_history').insert({
      user_id: infraction.user_id, action: 'block',
      details: `Bloqueo ${severity}: ${config.days ? config.days + ' días' : 'permanente'}`
    });
    loadAll();
  };

  const dismissInfraction = async (id) => {
    await supabase.from('moderation_infractions').update({ status: 'dismissed', reviewed_at: new Date() }).eq('id', id);
    loadAll();
  };

  const liftBlock = async (blockId, userId, reason) => {
    await supabase.from('moderation_blocks').update({ is_active: false, lifted_at: new Date(), lift_reason: reason }).eq('id', blockId);
    await supabase.from('moderation_history').insert({ user_id: userId, action: 'unblock', details: reason });
    loadAll();
  };

  const handleAppeal = async (appealId, accepted, response) => {
    await supabase.from('moderation_appeals').update({ status: accepted ? 'accepted' : 'rejected', reviewed_at: new Date(), response }).eq('id', appealId);
    if (accepted) {
      const appeal = appeals.find(a => a.id === appealId);
      if (appeal) await liftBlock(appeal.block_id, appeal.user_id, 'Apelación aceptada: ' + response);
    }
    loadAll();
  };


  if (loading) return <div className="text-center text-gray-400 py-12">Cargando moderación...</div>;

  return (
    <div className="bg-gradient-to-br from-black to-red-900/10 p-6 rounded-2xl border-2 border-red-500/50 shadow-[0_0_30px_rgba(255,0,0,0.1)]">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-black text-red-400">⚖️ MODERACIÓN C8L</h2>
        <div className="flex gap-3">
          <div className="bg-yellow-600/20 text-yellow-400 px-3 py-1 rounded-full text-xs font-bold">{stats.pending} pendientes</div>
          <div className="bg-red-600/20 text-red-400 px-3 py-1 rounded-full text-xs font-bold">{stats.blocked} bloqueados</div>
          <div className="bg-blue-600/20 text-blue-400 px-3 py-1 rounded-full text-xs font-bold">{stats.appeals} apelaciones</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-800 pb-2 mb-4 flex-wrap">
        {[{id:'infractions',label:'🚨 Infracciones'},{id:'blocks',label:'🔒 Bloqueos'},{id:'reports',label:'📢 Reportes'},{id:'appeals',label:'🙏 Apelaciones'}].map(tab=>(
          <button key={tab.id} onClick={()=>setActiveTab(tab.id)} className={`px-4 py-2 rounded-lg font-bold transition text-sm ${activeTab===tab.id?'bg-red-600 text-white':'text-gray-400 hover:text-white'}`}>{tab.label}</button>
        ))}
      </div>

      {/* Guía de severidad */}
      <div className="grid grid-cols-4 gap-2 mb-6">
        {Object.entries(SEVERITY_CONFIG).map(([key, config]) => (
          <div key={key} className={`p-3 rounded-lg border border-gray-800 text-center`}>
            <div className="text-lg font-bold">{config.label}</div>
            <div className="text-xs text-gray-400">{config.days ? `${config.days} días` : 'Permanente'}</div>
            <div className="text-[10px] text-gray-500 mt-1">{config.examples[0]}</div>
          </div>
        ))}
      </div>

      {/* Infracciones */}
      {activeTab === 'infractions' && (
        <div className="space-y-3 max-h-[500px] overflow-y-auto">
          {infractions.filter(i=>i.status==='pending').map((inf) => (
            <motion.div key={inf.id} initial={{opacity:0,y:10}} animate={{opacity:1,y:0}}
              className="bg-black/40 p-4 rounded-lg border-l-4 border-red-500">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${SEVERITY_CONFIG[inf.severity]?.color} text-white`}>{inf.severity}</span>
                    <span className="text-white font-bold">{inf.type}</span>
                  </div>
                  <p className="text-sm text-gray-400 mt-1">{inf.description}</p>
                  <div className="text-xs text-gray-500 mt-1">Contexto: {inf.context} • {new Date(inf.created_at).toLocaleString()}</div>
                </div>
                <div className="flex gap-2">
                  <button onClick={()=>confirmInfraction(inf.id, inf.severity)} className="px-3 py-1 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700 transition">Confirmar</button>
                  <button onClick={()=>dismissInfraction(inf.id)} className="px-3 py-1 bg-gray-700 text-gray-300 rounded-lg text-xs font-bold hover:bg-gray-600 transition">Descartar</button>
                </div>
              </div>
            </motion.div>
          ))}
          {infractions.filter(i=>i.status==='pending').length === 0 && (
            <div className="text-center text-gray-500 py-8">✅ No hay infracciones pendientes</div>
          )}
        </div>
      )}

      {/* Bloqueos activos */}
      {activeTab === 'blocks' && (
        <div className="space-y-3 max-h-[500px] overflow-y-auto">
          {blocks.map((block) => (
            <div key={block.id} className="bg-black/40 p-4 rounded-lg border border-red-500/30">
              <div className="flex justify-between items-center">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${SEVERITY_CONFIG[block.block_type]?.color} text-white`}>{block.block_type}</span>
                    <span className="text-white text-sm">{block.reason}</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Desde: {new Date(block.starts_at).toLocaleDateString()} 
                    {block.ends_at ? ` → Hasta: ${new Date(block.ends_at).toLocaleDateString()}` : ' → PERMANENTE'}
                  </div>
                </div>
                <button onClick={()=>liftBlock(block.id, block.user_id, 'Levantado manualmente')} className="px-3 py-1 bg-green-600 text-white rounded-lg text-xs font-bold hover:bg-green-700 transition">Levantar</button>
              </div>
            </div>
          ))}
          {blocks.length === 0 && <div className="text-center text-gray-500 py-8">✅ No hay bloqueos activos</div>}
        </div>
      )}

      {/* Reportes */}
      {activeTab === 'reports' && (
        <div className="space-y-3 max-h-[500px] overflow-y-auto">
          {reports.map((report) => (
            <div key={report.id} className="bg-black/40 p-4 rounded-lg border border-yellow-500/30">
              <div className="font-bold text-white text-sm">{report.reason}</div>
              <p className="text-xs text-gray-400 mt-1">{report.description}</p>
              <div className="text-xs text-gray-500 mt-1">Contexto: {report.context} • {new Date(report.created_at).toLocaleString()}</div>
            </div>
          ))}
          {reports.length === 0 && <div className="text-center text-gray-500 py-8">✅ No hay reportes pendientes</div>}
        </div>
      )}

      {/* Apelaciones */}
      {activeTab === 'appeals' && (
        <div className="space-y-3 max-h-[500px] overflow-y-auto">
          {appeals.map((appeal) => (
            <div key={appeal.id} className="bg-black/40 p-4 rounded-lg border border-blue-500/30">
              <div className="font-bold text-white text-sm">Apelación</div>
              <p className="text-xs text-gray-400 mt-1">{appeal.reason}</p>
              <div className="flex gap-2 mt-3">
                <button onClick={()=>handleAppeal(appeal.id, true, 'Apelación aceptada')} className="px-3 py-1 bg-green-600 text-white rounded-lg text-xs font-bold">Aceptar</button>
                <button onClick={()=>handleAppeal(appeal.id, false, 'Apelación rechazada')} className="px-3 py-1 bg-red-600 text-white rounded-lg text-xs font-bold">Rechazar</button>
              </div>
            </div>
          ))}
          {appeals.length === 0 && <div className="text-center text-gray-500 py-8">✅ No hay apelaciones pendientes</div>}
        </div>
      )}
    </div>
  );
}
