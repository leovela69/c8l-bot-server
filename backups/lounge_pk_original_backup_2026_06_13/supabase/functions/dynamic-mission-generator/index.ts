// supabase/functions/dynamic-mission-generator/index.ts
import { createClient } from '@supabase/supabase-js';

Deno.serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!
  );

  // 1. Obtener estadísticas de comportamiento de usuarios en la última semana
  const { data: stats } = await supabase
    .from('user_actions')
    .select('action_type, count')
    .gte('created_at', new Date(Date.now() - 7 * 86400000).toISOString())
    .group('action_type');

  const actionCounts: Record<string, number> = {};
  stats?.forEach(s => { actionCounts[s.action_type] = s.count; });

  // 2. Identificar acciones con baja participación
  const lowEngagementActions = [];
  if ((actionCounts['share_cover'] || 0) < 50) lowEngagementActions.push('share_cover');
  if ((actionCounts['send_backpack_gift'] || 0) < 100) lowEngagementActions.push('send_backpack_gift');
  if ((actionCounts['duet'] || 0) < 20) lowEngagementActions.push('duet');

  // 3. Generar misiones dinámicas para incentivar esas acciones
  const newMissions = [];

  if (lowEngagementActions.includes('share_cover')) {
    newMissions.push({
      title: '🤝 Apoya a tu Bando',
      description: 'Comparte 2 covers de miembros de tu Bando',
      type: 'daily',
      required_value: 2,
      reward_coins: 40,
      reward_xp: 20,
      reward_item_id: (await supabase.from('backpack_items').select('id').eq('emoji', '🍪').single()).data?.id,
      is_dynamic: true,
      engagement_score: 0.8,
    });
  }

  if (lowEngagementActions.includes('send_backpack_gift')) {
    newMissions.push({
      title: '🎁 Regala emociones',
      description: 'Envía 5 regalos de mochila a miembros de tu Círculo',
      type: 'daily',
      required_value: 5,
      reward_coins: 60,
      reward_xp: 30,
      reward_item_id: (await supabase.from('backpack_items').select('id').eq('emoji', '☕').single()).data?.id,
      is_dynamic: true,
      engagement_score: 0.8,
    });
  }

  // 4. También generar misión semanal si hay poca actividad en duetos
  if (lowEngagementActions.includes('duet')) {
    newMissions.push({
      title: '🎤 Dueto con un amigo',
      description: 'Realiza 1 dueto con un amigo',
      type: 'weekly',
      required_value: 1,
      reward_coins: 150,
      reward_xp: 80,
      reward_item_id: (await supabase.from('backpack_items').select('id').eq('emoji', '🍕').single()).data?.id,
      is_dynamic: true,
      engagement_score: 0.7,
    });
  }

  // 5. Insertar nuevas misiones (si no existen ya similares)
  for (const mission of newMissions) {
    const { data: existing } = await supabase
      .from('missions')
      .select('id')
      .eq('title', mission.title)
      .eq('type', mission.type)
      .maybeSingle();

    if (!existing) {
      await supabase.from('missions').insert(mission);
      console.log(`✅ Misión dinámica creada: ${mission.title}`);
    }
  }

  // 6. Actualizar engagement_score de misiones existentes basado en rendimiento
  const { data: performances } = await supabase
    .from('mission_performance')
    .select('mission_id, completions, completions_expected, user_rating')
    .gte('date', new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0]);

  if (performances) {
    for (const perf of performances) {
      const completionRate = perf.completions_expected ? perf.completions / perf.completions_expected : 0;
      const newScore = (completionRate * 0.6) + ((perf.user_rating || 3) / 5 * 0.4);
      await supabase
        .from('missions')
        .update({ engagement_score: newScore })
        .eq('id', perf.mission_id);
    }
  }

  return new Response(JSON.stringify({ newMissionsCount: newMissions.length }), { status: 200 });
});