'use client';
import { useState, useEffect } from 'react';
import { Award, Sword, DollarSign, CheckCircle2 } from 'lucide-react';
import { useApp } from '@/context/AppContext';

interface Task {
  id: string;
  title: string;
  description: string;
  xp_reward: number;
  coin_reward: number;
  required_type: string;
  required_amount: number;
  progress: number;
  is_completed: boolean;
  completed_at: string | null;
}

interface TaskBoardProps {
  factionId: string;
  onRewardClaimed?: () => void;
}

const DEFAULT_SUGGESTED_TASKS = [
  { title: 'Cantar covers en grupo 🎤', description: 'Grabar covers de duetos o grupales en las salas de karaoke.', xp: 300, coins: 50 },
  { title: 'Aportar Coins al Cofre 💰', description: 'Donar C8L Coins para cooperar con el crecimiento de nivel del Bando.', xp: 400, coins: 100 },
  { title: 'Ganar batallas en Lounge ⚔️', description: 'Vence a oponentes en duelos de canto o PK showdowns.', xp: 500, coins: 150 },
  { title: 'Mantener la sala llena 👥', description: 'Consigue que el lounge alcance al menos 10 usuarios simultáneos.', xp: 600, coins: 200 }
];

export function TaskBoard({ factionId, onRewardClaimed }: TaskBoardProps) {
  const { user, showNotification } = useApp();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [claimingId, setClaimingId] = useState<string | null>(null);

  const fetchTasks = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/factions/tasks?factionId=${factionId}&userId=${user.uid}`);
      const data = await res.json();
      if (data.success) {
        setTasks(data.tasks || []);
      }
    } catch (e) {
      console.error('Error fetching tasks:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.uid) {
      fetchTasks();
    }
  }, [factionId, user?.uid]);

  const handleClaimReward = async (taskId: string) => {
    if (!user) return;

    try {
      setClaimingId(taskId);
      const res = await fetch('/api/factions/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId, userId: user.uid })
      });

      const data = await res.json();
      if (data.success) {
        showNotification(`Recompensa reclamada: +${data.coin_reward} Coins!`, 'success');
        if (data.level_up) {
          showNotification(`🎉 ¡Tu Bando ha subido al Nivel ${data.new_level}!`, 'success');
        }
        
        // Refresh
        fetchTasks();
        if (onRewardClaimed) onRewardClaimed();
      } else {
        showNotification(data.error || 'Error al reclamar recompensa', 'error');
      }
    } catch (e) {
      console.error('Error claiming task:', e);
      showNotification('Error de conexión', 'error');
    } finally {
      setClaimingId(null);
    }
  };

  return (
    <div className="bg-black/60 border-2 border-gray-800 rounded-xl p-5">
      <h3 className="text-sm font-black text-[#D4AF37] mb-4 flex items-center gap-1.5 font-mono uppercase tracking-wider">
        <Award size={16} /> LOGROS Y TAREAS DIARIAS
      </h3>

      {loading ? (
        <div className="text-center py-10 text-gray-500 font-mono text-xs">Cargando tablero...</div>
      ) : tasks.length === 0 ? (
        <div className="text-center py-10 bg-black/40 border border-gray-800 rounded-lg">
          <p className="text-xs text-gray-500 mb-4 italic">No hay tareas creadas en este momento</p>
          <div className="max-w-md mx-auto text-left space-y-3 p-3 border-2 border-dashed border-gray-800 rounded">
            <span className="text-[10px] text-gray-400 font-mono block">💡 MISIONES COOPERATIVAS TÍPICAS:</span>
            {DEFAULT_SUGGESTED_TASKS.map((t, i) => (
              <div key={i} className="text-[10px] text-gray-400 flex justify-between leading-snug">
                <span>{t.title}</span>
                <span className="text-[#D4AF37] font-bold">+{t.coins} C / +{t.xp} XP</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {tasks.map((task) => {
            const pct = Math.min(100, Math.round((task.progress / task.required_amount) * 100));
            const isFinished = task.progress >= task.required_amount;
            
            return (
              <div
                key={task.id}
                className={`p-4 border-2 rounded-lg transition-colors ${
                  task.is_completed
                    ? 'bg-black/40 border-green-950 text-gray-500'
                    : isFinished
                    ? 'bg-purple-950/15 border-purple-500/50 text-white shadow-[0_0_10px_rgba(138,43,226,0.1)]'
                    : 'bg-gray-900/60 border-gray-900 text-white'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-bold text-sm leading-snug">{task.title}</h4>
                    <p className="text-[10px] text-gray-400 mt-1">{task.description}</p>
                  </div>
                  
                  {task.is_completed ? (
                    <span className="text-green-500 flex items-center gap-1 text-[10px] font-mono font-bold">
                      <CheckCircle2 size={12} /> RECLAMADO
                    </span>
                  ) : isFinished ? (
                    <button
                      onClick={() => handleClaimReward(task.id)}
                      disabled={claimingId === task.id}
                      className="px-3 py-1.5 bg-gradient-to-r from-purple-700 to-[#FF0055] hover:from-purple-600 hover:to-[#FF0055]/80 text-white text-[10px] font-black border border-purple-500 rounded cursor-pointer transition-all shadow-[0_0_10px_rgba(255,0,85,0.3)]"
                    >
                      {claimingId === task.id ? 'RECLAMANDO...' : 'RECLAMAR'}
                    </button>
                  ) : (
                    <span className="text-gray-500 text-[10px] font-mono">
                      Progreso: {task.progress} / {task.required_amount}
                    </span>
                  )}
                </div>

                {/* Progress bar */}
                {!task.is_completed && (
                  <div className="space-y-1 mt-3">
                    <div className="h-2 bg-gray-950 border border-gray-800 rounded-full p-0.5 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#00F3FF] to-purple-600 rounded-full transition-all duration-300"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[8px] text-gray-500 font-mono">
                      <span>0%</span>
                      <span>{pct}% COMPLETADO</span>
                      <span>100%</span>
                    </div>
                  </div>
                )}

                {/* Rewards footer details */}
                <div className="flex gap-4 text-[9px] text-gray-500 font-mono font-bold mt-2 pt-2 border-t border-gray-950">
                  <span className="flex items-center gap-0.5"><DollarSign size={10} className="text-[#D4AF37]" /> RECOMPENSA: {task.coin_reward} Coins</span>
                  <span className="flex items-center gap-0.5"><Sword size={10} className="text-purple-400" /> BANDO XP: +{task.xp_reward} XP</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
