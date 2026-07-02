// supabase/functions/economic-forecaster/index.ts
import { createClient } from '@supabase/supabase-js';

Deno.serve(async (req) => {
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!);

    // 1. Rastrear noticias externas desde una API de noticias
    const newsApiKey = Deno.env.get('NEWS_API_KEY');
    const response = await fetch(`https://newsapi.org/v2/everything?q=economía OR mercado&apiKey=${newsApiKey}`);
    const newsData = await response.json();

    // 2. Almacenar nuevas noticias
    if (newsData && newsData.articles) {
        for (const article of newsData.articles) {
            await supabase.from('economic_news').insert({
                title: article.title,
                source: article.source.name,
                published_at: article.publishedAt,
                content: article.description,
                processed: false
            });
        }
    }

    // 3. Procesar noticias pendientes con IA (por ejemplo, una Edge Function que llame a un modelo de ML)
    const { data: unprocessedNews } = await supabase
        .from('economic_news')
        .select('*')
        .eq('processed', false)
        .limit(10);

    if (unprocessedNews) {
        for (const news of unprocessedNews) {
            // Aquí se envía el texto de la noticia a un modelo de IA (p.ej., a través de la API de Replicate)
            // para obtener una puntuación de sentimiento y un nivel de impacto.
            const sentimentScore = await analyzeSentiment(news.content);
            const impactLevel = determineImpact(sentimentScore);

            await supabase
                .from('economic_news')
                .update({ sentiment_score: sentimentScore, impact_level: impactLevel, processed: true })
                .eq('id', news.id);
        }
    }

    // 4. Generar predicciones basadas en el sentimiento agregado
    const { data: avgSentiment } = await supabase
        .from('economic_news')
        .select('sentiment_score')
        .eq('processed', true);

    if (avgSentiment && avgSentiment.length > 0) {
        const sum = avgSentiment.reduce((acc, curr) => acc + (curr.sentiment_score || 0), 0);
        const avg = sum / avgSentiment.length;
        const predictedDemand = 1 + (avg * 0.5);
        await supabase.from('predictions').insert({
            event_type: 'bid_demand',
            predicted_value: predictedDemand,
            target_date: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
            confidence: 0.75
        });
    }

    return new Response(JSON.stringify({ message: 'Forecasting cycle completed' }), { status: 200 });
});

async function analyzeSentiment(content: string): Promise<number> {
    // Simulado
    return Math.random() * 2 - 1; // -1 to 1
}

function determineImpact(score: number): string {
    if (score > 0.4) return 'high_positive';
    if (score < -0.4) return 'high_negative';
    return 'medium';
}