'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';

interface Task {
  id: string; title: string; description: string;
  type: 'daily' | 'weekly' | 'special' | 'onboarding';
  category: string; required_action: string; required_count: number;
  reward_coins: number; reward_diamonds: number; reward_xp: number;
  progress: number; is_completed: boolean; is_claimed: boolean;
}

export function TaskDashboard({ userId }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'daily'|'weekly'|'special'>('daily');
  const [stats, setStats] = useState({ completed_today: 0, total_coins_earned: 0, total_xp_earned: 0, streak_days: 0 });

  useEffect(() => { loadTasks(); loadStats(); }, [userId, activeTab]);

  const loadTasks = async () => {
    const { data: tasksData } = await supabase.from('tv_tasks').select('*').eq('type', activeTab).eq('is_active', true);
    const { data: progressData } = await supabase.from('tv_user_tasks').select('*').eq('user_id', userId);
    const progressMap = {};
    progressData?.forEach(p => { progressMap[p.task_id] = p; });
    const tasksWithProgress = tasksData?.map(task => ({
      ...task, progress: progressMap[task.id]?.progress || 0,
      is_completed: progressMap[task.id]?.is_completed || false,
      is_claimed: progressMap[task.id]?.is_claimed || false,
    })) || [];
    setTasks(tasksWithProgress); setLoading(false);
  };

  const loadStats = async () => {
    const { data } = await supabase.from('tv_user_tasks').select('*').eq('user_id', userId).eq('is_completed', true);
    setStats({ completed_today: data?.filter(t=>t.is_claimed).length||0, total_coins_earned: 500, total_xp_earned: 1200, streak_days: 3 });
  };

  const claimReward = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task || !task.is_completed || task.is_claimed) return;
    await supabase.rpc('add_coins', { user_id: userId, amount: task.reward_coins });
    await supabase.rpc('add_diamonds', { user_id: userId, amount: task.reward_diamonds });
    await supabase.from('tv_user_tasks').update({ is_claimed: true, claimed_at: new Date() }).eq('user_id', userId).eq('task_id', taskId);
    loadTasks(); loadStats();
  };

  const getTaskIcon = (action: string) => {
    const icons = { upload_cover:'🎤', upload_video:'🎬', go_live:'🔴', duet:'🎵', like:'❤️', comment:'💬', views:'👁️' };
    return icons[action] || '📋';
  };


  if (loading) return <div className="text-center text-gray-400">Cargando tareas...</div>;

  return (
    <div className="bg-gradient-to-br from-black to-purple-900/20 p-6 rounded-2xl border-2 border-c8l-gold shadow-[0_0_30px_rgba(212,175,55,0.3)]">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-black text-c8l-gold">📋 TAREAS C8L TV</h2>
        <div className="flex gap-2">
          {(['daily','weekly','special'] as const).map(tab=>(
            <button key={tab} onClick={()=>setActiveTab(tab)} className={`px-4 py-2 rounded-lg font-bold transition ${activeTab===tab?'bg-c8l-gold text-black':'bg-gray-800 text-gray-400'}`}>
              {tab==='daily'?'📅 Diarias':tab==='weekly'?'📊 Semanales':'🎯 Especiales'}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-black/50 p-3 rounded-lg border border-c8l-gold/30 text-center">
          <div className="text-2xl font-bold text-c8l-gold">{stats.completed_today}</div>
          <div className="text-xs text-gray-400">Completadas hoy</div>
        </div>
        <div className="bg-black/50 p-3 rounded-lg border border-c8l-gold/30 text-center">
          <div className="text-2xl font-bold text-c8l-gold">{stats.total_coins_earned}</div>
          <div className="text-xs text-gray-400">🪙 Coins ganados</div>
        </div>
        <div className="bg-black/50 p-3 rounded-lg border border-c8l-gold/30 text-center">
          <div className="text-2xl font-bold text-purple-400">{stats.total_xp_earned}</div>
          <div className="text-xs text-gray-400">⭐ XP ganados</div>
        </div>
        <div className="bg-black/50 p-3 rounded-lg border border-c8l-gold/30 text-center">
          <div className="text-2xl font-bold text-orange-400">🔥 {stats.streak_days}</div>
          <div className="text-xs text-gray-400">Racha de días</div>
        </div>
      </div>
      <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
        {tasks.map((task) => (
          <motion.div key={task.id} initial={{opacity:0,y:10}} animate={{opacity:1,y:0}}
            className={`bg-black/40 p-4 rounded-lg border-l-4 ${task.category==='cover'?'border-c8l-gold':task.category==='video'?'border-c8l-pink':task.category==='live'?'border-c8l-purple':'border-blue-500'}`}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{getTaskIcon(task.required_action)}</span>
                  <h3 className="font-bold text-white">{task.title}</h3>
                </div>
                <p className="text-sm text-gray-400 mt-1">{task.description}</p>
                <div className="flex gap-4 mt-2 text-xs">
                  <span className="text-c8l-gold">+{task.reward_coins} 🪙</span>
                  <span className="text-purple-400">+{task.reward_diamonds} 💎</span>
                  <span className="text-blue-400">+{task.reward_xp} ⭐</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-500 mb-1">{task.progress}/{task.required_count}</div>
                <div className="w-20 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-c8l-gold to-c8l-pink transition-all" style={{width:`${Math.min(100,(task.progress/task.required_count)*100)}%`}} />
                </div>
                {task.is_completed && !task.is_claimed && (
                  <button onClick={()=>claimReward(task.id)} className="mt-2 px-3 py-1 bg-c8l-gold text-black text-xs font-bold rounded-lg hover:bg-c8l-gold/80 transition">Reclamar</button>
                )}
                {task.is_claimed && <div className="mt-2 text-xs text-green-500">✅ Reclamado</div>}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
      {tasks.length === 0 && <div className="text-center text-gray-400 py-8"><div className="text-4xl mb-2">🎯</div><p>No hay tareas disponibles</p></div>}
    </div>
  );
}
