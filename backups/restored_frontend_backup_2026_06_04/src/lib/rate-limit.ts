// lib/rate-limit.ts
import { supabase } from './supabase/client';

export async function checkAndIncrementLimit(userId: string, limitType: 'video' | 'music'): Promise<{ allowed: boolean; remaining: number }> {
  const today = new Date().toISOString().split('T')[0];
  // Obtener registro actual
  let { data: usage } = await supabase
    .from('user_usage_limits')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (!usage || usage.last_reset_date !== today) {
    // Resetear límites diarios
    const resetData = { daily_video_generations: 0, monthly_ai_music_generations: usage?.monthly_ai_music_generations || 0, last_reset_date: today };
    await supabase.from('user_usage_limits').upsert({ user_id: userId, ...resetData });
    usage = resetData;
  }

  const limit = limitType === 'video' ? 5 : 50; // valores por defecto, se pueden configurar en system_config
  const current = limitType === 'video' ? usage.daily_video_generations : usage.monthly_ai_music_generations;

  if (current >= limit) return { allowed: false, remaining: 0 };

  // Incrementar
  const updateField = limitType === 'video' ? 'daily_video_generations' : 'monthly_ai_music_generations';
  await supabase
    .from('user_usage_limits')
    .update({ [updateField]: current + 1 })
    .eq('user_id', userId);

  return { allowed: true, remaining: limit - (current + 1) };
}