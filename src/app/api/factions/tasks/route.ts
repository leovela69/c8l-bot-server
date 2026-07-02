export const dynamic = 'force-static';
import { supabase } from '@/lib/supabase/client';

// Get tasks and user progress
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const factionId = searchParams.get('factionId');
    const userId = searchParams.get('userId');

    if (!factionId || !userId) {
      // Safely return dummy array for Next.js build evaluation
      return Response.json({ success: true, tasks: [] });
    }

    const isMock = !process.env.NEXT_PUBLIC_SUPABASE_URL || 
                   process.env.NEXT_PUBLIC_SUPABASE_URL.includes('tu_url') || 
                   !process.env.NEXT_PUBLIC_SUPABASE_URL.startsWith('http');

    if (isMock) {
      const mockTasks = [
        {
          id: 'mock_task_1',
          faction_id: factionId,
          title: 'Cantar covers en grupo 🎤',
          description: 'Grabar covers de duetos o grupales en las salas de karaoke.',
          xp_reward: 300,
          coin_reward: 50,
          required_type: 'sing',
          required_amount: 3,
          progress: 3, // Complete so they can claim it!
          is_completed: false,
          completed_at: null
        },
        {
          id: 'mock_task_2',
          faction_id: factionId,
          title: 'Ganar batallas en Lounge ⚔️',
          description: 'Vence a oponentes en duelos de canto o PK showdowns.',
          xp_reward: 500,
          coin_reward: 150,
          required_type: 'win',
          required_amount: 5,
          progress: 2, // In progress
          is_completed: false,
          completed_at: null
        }
      ];
      return Response.json({ success: true, tasks: mockTasks });
    }

    // 1. Fetch active tasks for faction
    const { data: tasks, error: tasksError } = await supabase
      .from('faction_tasks')
      .select('*')
      .eq('faction_id', factionId)
      .eq('is_active', true);

    if (tasksError) throw tasksError;

    // 2. Fetch user's progress for these tasks
    const { data: progressList } = await supabase
      .from('faction_task_progress')
      .select('*')
      .eq('user_id', userId);

    const tasksWithProgress = (tasks || []).map((task) => {
      const progress = (progressList || []).find((p) => p.task_id === task.id);
      return {
        ...task,
        progress: progress ? progress.progress : 0,
        is_completed: progress ? progress.is_completed : false,
        completed_at: progress ? progress.completed_at : null
      };
    });

    return Response.json({ success: true, tasks: tasksWithProgress });
  } catch (err: any) {
    console.error('Error fetching faction tasks:', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}

// Claim task reward
export async function POST(req: Request) {
  try {
    const { taskId, userId } = await req.json();

    if (!taskId || !userId) {
      return Response.json({ error: 'ID de tarea y ID de usuario son requeridos' }, { status: 400 });
    }

    const isMock = !process.env.NEXT_PUBLIC_SUPABASE_URL || 
                   process.env.NEXT_PUBLIC_SUPABASE_URL.includes('tu_url') || 
                   !process.env.NEXT_PUBLIC_SUPABASE_URL.startsWith('http');

    if (isMock) {
      return Response.json({
        success: true,
        coin_reward: 50,
        xp_reward: 300,
        level_up: true,
        new_level: 5
      });
    }

    // 1. Fetch task and progress details
    const { data: task } = await supabase
      .from('faction_tasks')
      .select('*')
      .eq('id', taskId)
      .single();

    if (!task) return Response.json({ error: 'Tarea no encontrada' }, { status: 404 });

    const { data: progress } = await supabase
      .from('faction_task_progress')
      .select('*')
      .eq('task_id', taskId)
      .eq('user_id', userId)
      .single();

    if (!progress || progress.progress < task.required_amount) {
      return Response.json({ error: 'La tarea no ha sido completada o no tiene progreso registrado' }, { status: 400 });
    }

    if (progress.is_completed) {
      return Response.json({ error: 'Esta recompensa ya fue reclamada' }, { status: 409 });
    }

    // 2. Mark task as completed
    const { error: progressError } = await supabase
      .from('faction_task_progress')
      .update({
        is_completed: true,
        completed_at: new Date().toISOString()
      })
      .eq('id', progress.id);

    if (progressError) throw progressError;

    // 3. Award Coins to User
    const { data: userRecord } = await supabase
      .from('users')
      .select('coins')
      .eq('id', userId)
      .single();

    if (userRecord) {
      await supabase
        .from('users')
        .update({ coins: userRecord.coins + task.coin_reward })
        .eq('id', userId);
    }

    // 4. Award XP to Faction and Check Level-up
    const { data: faction } = await supabase
      .from('factions')
      .select('*')
      .eq('id', task.faction_id)
      .single();

    let levelUp = false;
    let newLevel = faction?.level || 1;
    let newXp = (faction?.xp || 0) + task.xp_reward;

    if (faction) {
      // Progressive level up check
      let xpToNext = 1000 + ((newLevel - 1) * 1500); // Level 1 is 1000, Lvl 2 is 2500, Lvl 3 is 4000...
      
      while (newXp >= xpToNext && newLevel < 20) {
        newLevel += 1;
        newXp -= xpToNext;
        xpToNext = 1000 + ((newLevel - 1) * 1500);
        levelUp = true;
      }

      await supabase
        .from('factions')
        .update({
          level: newLevel,
          xp: newXp,
          updated_at: new Date().toISOString()
        })
        .eq('id', task.faction_id);
    }

    return Response.json({
      success: true,
      coin_reward: task.coin_reward,
      xp_reward: task.xp_reward,
      level_up: levelUp,
      new_level: newLevel
    });
  } catch (err: any) {
    console.error('Error claiming task reward:', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
