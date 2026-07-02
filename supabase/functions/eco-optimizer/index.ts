// supabase/functions/eco-optimizer/index.ts
import { createClient } from '@supabase/supabase-js';

Deno.serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!
  );

  // 1. Obtener métricas de la última semana
  const { data: tx } = await supabase
    .from('gift_transactions')
    .select('coins_spent, stars_generated, created_at')
    .gte('created_at', new Date(Date.now() - 7 * 86400000).toISOString());

  if (!tx || tx.length === 0) return new Response('No data', { status: 200 });

  // 2. Calcular inflación de estrellas vs demanda de regalos
  const totalCoinsSpent = tx.reduce((acc, t) => acc + (t.coins_spent || 0), 0);
  const totalStarsGenerated = tx.reduce((acc, t) => acc + (t.stars_generated || 0), 0);
  const ratio = totalCoinsSpent > 0 ? totalStarsGenerated / totalCoinsSpent : 0; // debería ser ~0.5

  // 3. Ajustar recomendaciones si ratio se desvía >10%
  if (ratio > 0.55) {
    // Las estrellas están sobrevaloradas → sugerir bajar recompensas de misiones
    await supabase.from('recommendations').insert({
      type: 'economy',
      message: `⚠️ Ratio estrellas/coins = ${ratio.toFixed(3)}. Considera reducir recompensas diarias un 5%.`,
      created_at: new Date(),
    });
  }

  // 4. Registrar métrica
  await supabase.from('economy_metrics').insert({
    week_start: new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0],
    total_coins_spent: totalCoinsSpent,
    total_stars_generated: totalStarsGenerated,
    ratio,
  });

  return new Response('OK', { status: 200 });
});