// components/onboarding/OnboardingWidget.tsx
'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { CheckCircle, Gift } from 'lucide-react';

interface OnboardingWidgetProps {
  userId: string;
}

interface OnboardingTask {
  id: string;
  title: string;
  completed: boolean;
}

export function OnboardingWidget({ userId }: OnboardingWidgetProps) {
  const [tasks, setTasks] = useState<OnboardingTask[]>([]);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    loadTasks();
  }, []);

  async function loadTasks() {
    const { data: tasksData } = await supabase.from('onboarding_tasks').select('*');
    const { data: userProgress } = await supabase
      .from('user_onboarding_progress')
      .select('task_id, completed')
      .eq('user_id', userId);
    
    const completedMap = new Map(userProgress?.map(p => [p.task_id, p.completed]));
    const tasksWithStatus = (tasksData || []).map(task => ({
      id: task.id,
      title: task.title || '',
      completed: completedMap.get(task.id) || false,
    }));
    setTasks(tasksWithStatus);
    const completedCount = tasksWithStatus.filter(t => t.completed).length;
    const progressVal = tasksWithStatus.length > 0 ? (completedCount / tasksWithStatus.length) * 100 : 0;
    setProgress(progressVal);
  }

  return (
    <div className="fixed bottom-6 left-6 z-40 bg-black/90 border-2 border-[#D4AF37] rounded-lg p-3 max-w-xs">
      <h4 className="text-[#D4AF37] font-black text-sm flex items-center gap-2">
        <Gift size={14} /> Misiones de bienvenida
      </h4>
      <div className="h-1.5 bg-gray-800 rounded-full my-2">
        <div className="h-full bg-[#D4AF37] rounded-full" style={{ width: `${progress}%` }} />
      </div>
      <div className="space-y-1 text-xs">
        {tasks.map(task => (
          <div key={task.id} className="flex justify-between items-center">
            <span className={task.completed ? 'line-through text-gray-500' : 'text-white'}>{task.title}</span>
            {task.completed && <CheckCircle size={12} className="text-green-500" />}
          </div>
        ))}
      </div>
    </div>
  );
}