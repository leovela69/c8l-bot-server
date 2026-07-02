// supabase/functions/dynamic-missions/index.ts
import { createClient } from 'jsr:@supabase/supabase-js@2';

Deno.serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // 1. Query counts of activities in DB to diagnose low engagement
    const { count: commentsCount } = await supabase
      .from('video_comments')
      .select('*', { count: 'exact', head: true });

    const { count: giftsCount } = await supabase
      .from('gift_transactions')
      .select('*', { count: 'exact', head: true });

    const { count: videosCount } = await supabase
      .from('videos')
      .select('*', { count: 'exact', head: true });

    // 2. Formulate dynamic missions for categories that are lagging
    const newMissions = [];

    if ((commentsCount || 0) < 100) {
      newMissions.push({
        title: '💬 Crítico de Neón',
        description: 'Comenta 3 videos en el Feed para compartir tu feedback.',
        type: 'daily',
        required_value: 3,
        reward_coins: 30,
        reward_xp: 15,
        is_dynamic: true,
        engagement_score: 0.95
      });
    }

    if ((giftsCount || 0) < 50) {
      newMissions.push({
        title: '🎁 Patrocinador Cuántico',
        description: 'Envía 2 regalos en butacas dentro del Lounge a tus artistas favoritos.',
        type: 'daily',
        required_value: 2,
        reward_coins: 60,
        reward_xp: 35,
        is_dynamic: true,
        engagement_score: 0.9
      });
    }

    if ((videosCount || 0) < 15) {
      newMissions.push({
        title: '🎤 Artista del Mes',
        description: 'Graba y publica un dueto o cover en el Estudio de la Agencia.',
        type: 'weekly',
        required_value: 1,
        reward_coins: 200,
        reward_xp: 120,
        is_dynamic: true,
        engagement_score: 0.8
      });
    }

    let createdCount = 0;
    for (const mission of newMissions) {
      const { data: existing } = await supabase
        .from('missions')
        .select('id')
        .eq('title', mission.title)
        .maybeSingle();

      if (!existing) {
        await supabase.from('missions').insert(mission);
        createdCount++;
      }
    }

    return new Response(JSON.stringify({
      success: true,
      createdCount,
      totalConsidered: newMissions.length
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});
