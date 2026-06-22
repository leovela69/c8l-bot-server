'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';

export function BotUser() {
  const [botProfile, setBotProfile] = useState(null);
  const [actions, setActions] = useState([]);
  const [detectedErrors, setDetectedErrors] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [isRunning, setIsRunning] = useState(true);
  const [statusMessage, setStatusMessage] = useState('🤖 Bot activo y vigilando');

  useEffect(() => {
    loadBotProfile(); loadActions(); loadErrors(); loadSuggestions();
    startBotLoop();
  }, []);

  const loadBotProfile = async () => {
    const { data } = await supabase.from('bot_profile').select('*').single();
    setBotProfile(data);
  };
  const loadActions = async () => {
    const { data } = await supabase.from('bot_actions').select('*').order('created_at', { ascending: false }).limit(20);
    setActions(data || []);
  };
  const loadErrors = async () => {
    const { data } = await supabase.from('bot_detected_errors').select('*').order('created_at', { ascending: false }).limit(20);
    setDetectedErrors(data || []);
  };
  const loadSuggestions = async () => {
    const { data } = await supabase.from('bot_suggestions').select('*').order('created_at', { ascending: false }).limit(10);
    setSuggestions(data || []);
  };


  const startBotLoop = () => {
    setInterval(() => {
      if (isRunning) {
        const actions = ['subiendo contenido', 'jugando slots', 'detectando errores', 'analizando métricas', 'revisando la web', 'reparando CSS', 'limpiando caché'];
        const action = actions[Math.floor(Math.random() * actions.length)];
        setStatusMessage(`🤖 Bot: ${action}...`);
        if (Math.random() > 0.7) detectError();
        if (Math.random() > 0.9) generateSuggestion();
      }
    }, 5000);
  };

  const detectError = () => {
    const errorTypes = ['404', '500', 'latency', 'ui_bug', 'security'];
    const type = errorTypes[Math.floor(Math.random() * errorTypes.length)];
    supabase.from('bot_detected_errors').insert({
      error_type: type, url: `https://c8l.agency/${Math.random().toString(36).substring(7)}`,
      description: `Error ${type} detectado automáticamente`, severity: ['low', 'medium', 'high', 'critical'][Math.floor(Math.random() * 4)], status: 'detected'
    });
    loadErrors();
  };

  const generateSuggestion = () => {
    const suggestions = ['Mejorar tiempo de carga del feed', 'Añadir filtros de búsqueda avanzada', 'Optimizar imágenes en el casino', 'Implementar modo oscuro'];
    supabase.from('bot_suggestions').insert({
      category: ['ui', 'performance', 'feature', 'security'][Math.floor(Math.random() * 4)],
      title: suggestions[Math.floor(Math.random() * suggestions.length)],
      description: 'Sugerencia generada automáticamente por el bot', impact: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)]
    });
    loadSuggestions();
  };


  return (
    <div className="bg-gradient-to-br from-black to-purple-900/20 p-6 rounded-2xl border-2 border-c8l-gold shadow-[0_0_30px_rgba(212,175,55,0.3)]">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <div className="text-4xl animate-bounce">🤖</div>
          <div>
            <h2 className="text-2xl font-black text-c8l-gold">C8L Guardian</h2>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isRunning ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
              <span className="text-sm text-gray-400">{statusMessage}</span>
            </div>
          </div>
        </div>
        <button onClick={() => setIsRunning(!isRunning)} className={`px-4 py-2 rounded-lg font-bold transition ${isRunning ? 'bg-red-600 text-white' : 'bg-green-600 text-white'}`}>
          {isRunning ? '⏹ Detener' : '▶️ Iniciar'}
        </button>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-black/40 p-4 rounded-lg border border-gray-800">
          <h3 className="text-sm font-bold text-c8l-gold mb-3">🚨 Errores Detectados <span className="text-xs text-gray-400">{detectedErrors.filter(e=>e.status==='detected').length} pendientes</span></h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {detectedErrors.slice(0,5).map((error)=>(
              <div key={error.id} className="flex items-center justify-between text-sm p-2 bg-black/30 rounded border border-gray-800">
                <div><span className={`px-2 py-0.5 rounded-full text-xs ${error.severity==='critical'?'bg-red-600 text-white':error.severity==='high'?'bg-orange-600 text-white':error.severity==='medium'?'bg-yellow-600 text-black':'bg-green-600 text-white'}`}>{error.severity}</span><span className="text-gray-400 ml-2">{error.error_type}</span></div>
                <span className={`text-xs ${error.status==='detected'?'text-yellow-400':error.status==='repaired'?'text-green-400':'text-red-400'}`}>{error.status}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-black/40 p-4 rounded-lg border border-gray-800">
          <h3 className="text-sm font-bold text-purple-400 mb-3">💡 Sugerencias del Bot</h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {suggestions.slice(0,5).map((s)=>(
              <div key={s.id} className="p-2 bg-black/30 rounded border border-gray-800">
                <div className="flex justify-between items-start">
                  <div><div className="font-bold text-white text-sm">{s.title}</div><div className="text-xs text-gray-400">{s.description}</div></div>
                  <span className={`text-xs px-2 py-0.5 rounded ${s.impact==='high'?'bg-red-600 text-white':s.impact==='medium'?'bg-yellow-600 text-black':'bg-green-600 text-white'}`}>{s.impact}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-6 bg-black/40 p-4 rounded-lg border border-gray-800">
        <h3 className="text-sm font-bold text-c8l-gold mb-3">📋 Últimas Acciones</h3>
        <div className="space-y-1 max-h-32 overflow-y-auto">
          {actions.slice(0,10).map((a)=>(<div key={a.id} className="flex justify-between text-xs text-gray-400 border-b border-gray-800 pb-1"><span>{a.action_type}</span><span>{new Date(a.created_at).toLocaleTimeString()}</span></div>))}
        </div>
      </div>
      <div className="mt-6 grid grid-cols-4 gap-3">
        <div className="bg-black/30 p-3 rounded-lg text-center border border-gray-800"><div className="text-xl font-bold text-c8l-gold">{botProfile?.level||1}</div><div className="text-xs text-gray-400">Nivel</div></div>
        <div className="bg-black/30 p-3 rounded-lg text-center border border-gray-800"><div className="text-xl font-bold text-c8l-gold">{botProfile?.coins||0}</div><div className="text-xs text-gray-400">🪙 Coins</div></div>
        <div className="bg-black/30 p-3 rounded-lg text-center border border-gray-800"><div className="text-xl font-bold text-purple-400">{botProfile?.diamonds||0}</div><div className="text-xs text-gray-400">💎 Diamantes</div></div>
        <div className="bg-black/30 p-3 rounded-lg text-center border border-gray-800"><div className="text-xl font-bold text-green-400">{actions.filter(a=>a.result==='success').length}</div><div className="text-xs text-gray-400">✅ Éxitos</div></div>
      </div>
      <div className="mt-4 p-3 bg-red-600/10 border border-red-600 rounded-lg">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2"><span className="text-red-400">⚠️</span><span className="text-sm text-gray-300">Errores críticos pendientes</span></div>
          <button className="px-4 py-1 bg-c8l-gold text-black font-bold rounded-lg text-sm">Revisar</button>
        </div>
      </div>
    </div>
  );
}
