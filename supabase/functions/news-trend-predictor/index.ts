// supabase/functions/news-trend-predictor/index.ts
import { createClient } from 'jsr:@supabase/supabase-js@2';

Deno.serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // 1. Fetch news articles or simulate scraping
    const newsApiKey = Deno.env.get('NEWS_API_KEY');
    let sentimentScore = 0; // -1 (negative) to 1 (positive)
    const keywordsFound = [];

    // Query headlines related to music industry, virtual entertainment, or crypto
    if (newsApiKey) {
      try {
        const res = await fetch(`https://newsapi.org/v2/everything?q=music+technology+OR+virtual+avatar&apiKey=${newsApiKey}`);
        if (res.ok) {
          const data = await res.json();
          const articles = data.articles?.slice(0, 5) || [];
          let combinedText = '';
          articles.forEach((a: any) => {
            combinedText += `${a.title} ${a.description} `;
          });

          // Simple keyword sentiment analyzer
          const positiveWords = ['growth', 'success', 'innovation', 'launch', 'popular', 'improved', 'hype', 'boom'];
          const negativeWords = ['decline', 'scam', 'drop', 'ban', 'failure', 'regulatory', 'investigation', 'crash'];

          positiveWords.forEach(w => {
            if (combinedText.toLowerCase().includes(w)) {
              sentimentScore += 0.2;
              keywordsFound.push(w);
            }
          });
          negativeWords.forEach(w => {
            if (combinedText.toLowerCase().includes(w)) {
              sentimentScore -= 0.2;
              keywordsFound.push(w);
            }
          });

          sentimentScore = Math.max(-1, Math.min(1, sentimentScore));
        }
      } catch (err) {
        console.error('Error fetching news for trends:', err);
      }
    }

    if (!newsApiKey || sentimentScore === 0) {
      // Mock sentiment score
      sentimentScore = Math.random() * 2 - 1; // random -1 to 1
    }

    // 2. Adjust shop multipliers based on sentiment
    // If positive sentiment, we increase event multipliers and decrease shop prices (sales!).
    // If negative sentiment, we increase store prices (inflation!) and reduce reward multipliers.
    let priceAdjustmentFactor = 1.0;
    let eventMultiplier = 1.0;
    let description = '';

    if (sentimentScore > 0.3) {
      priceAdjustmentFactor = 0.9; // 10% discount on avatars
      eventMultiplier = 1.5; // 1.5x rewards multiplier
      description = `Alta confianza en el mercado. Aplicado 10% de descuento en la tienda y multiplicador de recompensas 1.5x.`;
    } else if (sentimentScore < -0.3) {
      priceAdjustmentFactor = 1.15; // 15% inflation increase
      eventMultiplier = 0.8; // 0.8x rewards multiplier
      description = `Fricción económica detectada en noticias. Aumentado el costo de la tienda un 15% y reducido multiplicador a 0.8x.`;
    } else {
      description = `Sentimiento estable en el mercado. Precios y recompensas se mantienen en su valor base.`;
    }

    // Apply shop adjustments to avatars in the avatars table
    if (priceAdjustmentFactor !== 1.0) {
      const { data: avatars } = await supabase.from('avatars').select('id, price_coins');
      if (avatars) {
        for (const avatar of avatars) {
          const originalPriceCoins = avatar.price_coins || 0;
          if (originalPriceCoins > 0) {
            const newPrice = Math.round(originalPriceCoins * priceAdjustmentFactor);
            await supabase
              .from('avatars')
              .update({ price_coins: newPrice })
              .eq('id', avatar.id);
          }
        }
      }
    }

    // Apply special event multiplier
    await supabase.from('special_events').insert({
      name: 'Fluctuación Cuántica de Noticias',
      description,
      type: 'market_fluctuation',
      multiplier: eventMultiplier,
      is_active: true,
      start_date: new Date().toISOString(),
      end_date: new Date(Date.now() + 86400000).toISOString() // 24 hours
    });

    // Write admin log
    await supabase.from('admin_logs').insert({
      action: 'MARKET_TREND_ADJUSTMENT',
      target_type: 'shop_prices',
      target_id: 'all_avatars',
      details: {
        sentimentScore,
        priceAdjustmentFactor,
        eventMultiplier,
        description,
        keywordsFound
      }
    });

    return new Response(JSON.stringify({
      success: true,
      sentimentScore,
      priceAdjustmentFactor,
      eventMultiplier,
      statusMessage: description
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
