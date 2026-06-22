'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';

export function FactionTasks({ factionId, userId }) {
  const [tasks, setTasks] = useState([]);
  const [progress, setProgress] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadTasks(); loadProgress(); }, [factionId]);

  const loadTasks = async () => {
    const { data } = await supabase.from('faction_tasks').select('*')
      .eq('faction_id', factionId).eq('is_active', true);
    setTasks(data || []);
  };

  const loadProgress = async () => {
    const { data } = await supabase.from('faction_task_progress').select('*').eq('user_id', userId);
    const progressMap = {};
    data?.forEach(p => { progressMap[p.task_id] = p; });
    setProgress(progressMap);
    setLoading(false);
  };

  const claimReward = async (taskId) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task || !progress[taskId]?.is_completed) return;
    await supabase.rpc('add_coins', { user_id: userId, amount: task.coin_reward });
    await supabase.rpc('add_diamonds', { user_id: userId, amount: task.diamond_reward });
    await supabase.from('faction_task_progress')
      .update({ is_completed: false }).eq('task_id', taskId).eq('user_id', userId);
    loadProgress();
  };


  return (
    <div className="bg-black/50 p-4 rounded-lg border border-c8l-gold/30">
      <h3 className="text-xl font-bold text-c8l-gold mb-4">📋 Tareas del Bando</h3>
      <div className="space-y-3">
        {tasks.map(task => {
          const prog = progress[task.id];
          const completed = prog?.is_completed;
          const currentProgress = prog?.progress || 0;
          const percentage = Math.min(100, (currentProgress / task.required_amount) * 100);
          return (
            <div key={task.id} className="bg-black/30 p-3 rounded-lg border border-gray-800">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-bold text-white">{task.title}</div>
                  <div className="text-sm text-gray-400">{task.description}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-c8l-gold">+{task.coin_reward} 🪙</div>
                  <div className="text-xs text-purple-400">+{task.diamond_reward} 💎</div>
                </div>
              </div>
              <div className="mt-2">
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>Progreso</span>
                  <span>{currentProgress}/{task.required_amount}</span>
                </div>
                <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-c8l-gold to-c8l-pink transition-all"
                    style={{ width: `${percentage}%` }} />
                </div>
              </div>
              {completed ? (
                <button onClick={() => claimReward(task.id)}
                  className="mt-2 w-full py-1 bg-c8l-gold text-black font-bold rounded-lg text-sm">
                  Reclamar Recompensa
                </button>
              ) : (
                <div className="mt-2 text-xs text-gray-500 text-center">Completa la tarea para reclamar</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
