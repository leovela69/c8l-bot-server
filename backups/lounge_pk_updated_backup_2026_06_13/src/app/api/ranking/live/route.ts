export const dynamic = 'force-static';
// app/api/ranking/live/route.ts
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const region = searchParams.get('region') || 'latam'; // 'latam' o 'spain'
  const weekStart = searchParams.get('weekStart') || (() => {
    const now = new Date();
    const start = new Date(now.setDate(now.getDate() - now.getDay() + 1));
    return start.toISOString().split('T')[0];
  })();

  // Obtener ranking, ordenado por estrellas recibidas
  const { data, error } = await supabase
    .from('live_ranking')
    .select(`
      user_id,
      total_stars_received,
      total_gift_count,
      users (name, avatar)
    `)
    .eq('region', region)
    .eq('week_start', weekStart)
    .order('total_stars_received', { ascending: false })
    .limit(100);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Añadir posición manualmente
  const ranked = data.map((item, idx) => ({ rank: idx + 1, ...item }));

  return NextResponse.json({ ranking: ranked, weekStart });
}