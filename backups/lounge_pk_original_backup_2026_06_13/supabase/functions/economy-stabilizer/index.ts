// supabase/functions/economy-stabilizer/index.ts
import { createClient } from 'jsr:@supabase/supabase-js@2';

Deno.serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // 1. Fetch recent transactions
    const { data: tx } = await supabase
      .from('gift_transactions')
      .select('coins_spent, stars_generated, created_at')
      .gte('created_at', new Date(Date.now() - 7 * 86400000).toISOString());

    const totalCoinsSpent = tx?.reduce((acc, t) => acc + (t.coins_spent || 0), 0) || 0;
    const totalStarsGenerated = tx?.reduce((acc, t) => acc + (t.stars_generated || 0), 0) || 0;
    const ratio = totalCoinsSpent > 0 ? totalStarsGenerated / totalCoinsSpent : 0.5;

    // 2. Adjust daily mission reward base & other config variables
    let actionTaken = 'Ninguna - economía estable';
    let baseRewardAdjustment = 0;

    if (ratio > 0.55) {
      // Stars are generated too easily relative to coins. We should lower the daily base reward.
      baseRewardAdjustment = -5; // reduce base coins reward
      actionTaken = 'Reducción de base diaria de misiones por exceso de estrellas generadas.';
    } else if (ratio < 0.45 && totalCoinsSpent > 1000) {
      // Coins are very scarce or users are not earning enough. We should raise rewards.
      baseRewardAdjustment = 5;
      actionTaken = 'Aumento de base diaria de misiones para incentivar transacciones de regalos.';
    }

    if (baseRewardAdjustment !== 0) {
      const { data: config } = await supabase
        .from('system_config')
        .select('value')
        .eq('key', 'daily_mission_reward_base')
        .single();
      
      if (config) {
        const currentBase = Number(config.value) || 50;
        const newBase = Math.max(10, Math.min(200, currentBase + baseRewardAdjustment));
        
        await supabase
          .from('system_config')
          .update({ 
            value: JSON.stringify(newBase),
            updated_at: new Date().toISOString()
          })
          .eq('key', 'daily_mission_reward_base');
      }
    }

    // Write logs
    await supabase.from('admin_logs').insert({
      action: 'ECONOMY_STABILIZATION',
      target_type: 'system_config',
      target_id: 'daily_mission_reward_base',
      details: {
        totalCoinsSpent,
        totalStarsGenerated,
        ratio,
        baseRewardAdjustment,
        actionTaken
      }
    });

    return new Response(JSON.stringify({
      success: true,
      ratio,
      totalCoinsSpent,
      totalStarsGenerated,
      actionTaken
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
