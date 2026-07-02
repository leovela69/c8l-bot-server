// app/admin/agents/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { Play, Pause, RefreshCw, Activity } from 'lucide-react';

interface Agent {
  id: string;
  name: string;
  status: 'running' | 'stopped' | 'error';
  lastRun: Date;
  nextRun: Date;
  cron: string;
}

export default function AgentsControl() {
  const [agents, setAgents] = useState<Agent[]>([
    { id: 'monitor', name: 'Monitor de Salud', status: 'running', lastRun: new Date(), nextRun: new Date(Date.now() + 120000), cron: '*/2 * * * *' },
    { id: 'moderator', name: 'Moderador IA', status: 'running', lastRun: new Date(), nextRun: new Date(Date.now() + 30000), cron: 'continuo' },
    { id: 'economy', name: 'Estabilizador Económico', status: 'running', lastRun: new Date(), nextRun: new Date(Date.now() + 3600000), cron: '0 * * * *' },
    { id: 'competitor', name: 'Analizador de Competencia', status: 'stopped', lastRun: new Date(Date.now() - 86400000), nextRun: new Date(Date.now() + 3600000), cron: '0 3 * * *' },
  ]);

  const toggleAgent = (agentId: string) => {
    setAgents(prev => prev.map(a => 
      a.id === agentId ? { ...a, status: a.status === 'running' ? 'stopped' : 'running' } : a
    ));
  };

  const runNow = (agentId: string) => {
    alert(`Ejecutando ${agentId} manualmente... (simulado)`);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-black text-[#D4AF37]">Subagentes Autónomos</h1>
      <div className="space-y-3">
        {agents.map(agent => (
          <div key={agent.id} className="bg-gray-900 border border-gray-800 rounded-lg p-4 flex justify-between items-center">
            <div>
              <h3 className="text-white font-bold">{agent.name}</h3>
              <p className="text-xs text-gray-500">Cron: {agent.cron}</p>
              <p className="text-xs text-gray-500">Última ejecución: {agent.lastRun.toLocaleString()}</p>
              {agent.nextRun && <p className="text-xs text-gray-500">Próxima: {agent.nextRun.toLocaleString()}</p>}
            </div>
            <div className="flex gap-2">
              <span className={`px-2 py-1 rounded-full text-xs ${agent.status === 'running' ? 'bg-green-600' : 'bg-gray-600'}`}>
                {agent.status === 'running' ? 'Activo' : 'Detenido'}
              </span>
              <button onClick={() => runNow(agent.id)} className="p-2 bg-gray-800 rounded hover:bg-gray-700"><Play size={14} /></button>
              <button onClick={() => toggleAgent(agent.id)} className="p-2 bg-gray-800 rounded hover:bg-gray-700">
                {agent.status === 'running' ? <Pause size={14} /> : <RefreshCw size={14} />}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}