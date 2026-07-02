export const dynamic = 'force-static';
// app/api/missions/complete/route.ts
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export async function POST(req: Request) {
  const { userId, missionId } = await req.json();

  // Registrar la finalización
  const { error: insertError } = await supabase
    .from('user_missions')
    .update({ is_completed: true, completed_at: new Date() })
    .eq('user_id', userId)
    .eq('mission_id', missionId);

  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });

  // Actualizar contador en mission_performance (para el agente)
  const today = new Date().toISOString().split('T')[0];
  await supabase
    .from('mission_performance')
    .upsert({
      mission_id: missionId,
      date: today,
      completions: supabase.rpc('increment', { x: 1 }),
    }, { onConflict: 'mission_id,date' });

  // Dar recompensas (coins, XP, items)
  const { data: mission } = await supabase
    .from('missions')
    .select('reward_coins, reward_xp, reward_item_id')
    .eq('id', missionId)
    .single();

  if (mission) {
    await supabase.rpc('add_coins', { user_id: userId, amount: mission.reward_coins });
    await supabase.rpc('add_xp', { user_id: userId, amount: mission.reward_xp });
    if (mission.reward_item_id) {
      await supabase.rpc('add_backpack_item', { user_id: userId, item_id: mission.reward_item_id, quantity: 1 });
    }
  }

  return NextResponse.json({ success: true });
}