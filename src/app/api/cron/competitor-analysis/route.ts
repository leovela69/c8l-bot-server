// app/api/cron/competitor-analysis/route.ts
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export const dynamic = 'force-static';
export const maxDuration = 300; // 5 minutos para scraping

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return hash.toString(16);
}

export async function GET(req: Request) {
  // Verificar secret key para evitar ejecución pública
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Lista de competidores (ejemplo)
  const competitors = [
    { name: 'StarMaker', url: 'https://www.starmaker.com/features' },
    { name: 'TikTok', url: 'https://www.tiktok.com/live/gifts' },
    // ... más
  ];

  const changes = [];

  for (const comp of competitors) {
    try {
      const response = await fetch(comp.url);
      const html = await response.text();
      // Guardar versión en Supabase
      const { data: existing } = await supabase
        .from('competitor_snapshots')
        .select('content_hash')
        .eq('competitor', comp.name)
        .order('captured_at', { ascending: false })
        .limit(1);

      const hash = simpleHash(html);
      if (!existing || existing[0]?.content_hash !== hash) {
        // Hay cambios
        changes.push({
          competitor: comp.name,
          changed_at: new Date(),
        });
        await supabase.from('competitor_snapshots').insert({
          competitor: comp.name,
          content_html: html.substring(0, 5000), // solo un fragmento
          content_hash: hash,
          captured_at: new Date(),
        });
      }
    } catch (err) {
      console.error(`Error scraping ${comp.name}:`, err);
    }
  }

  if (changes.length > 0) {
    // Enviar resumen a un canal de Slack o Discord
    await fetch(process.env.DISCORD_WEBHOOK_URL!, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: `🔍 **Cambios detectados en competidores**:\n${changes.map(c => `- ${c.competitor} (${c.changed_at.toISOString()})`).join('\n')}`,
      }),
    });
  }

  return NextResponse.json({ changes });
}