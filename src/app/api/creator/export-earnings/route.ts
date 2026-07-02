export const dynamic = 'force-static';
// app/api/creator/export-earnings/route.ts
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import { stringify } from 'csv-stringify/sync';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const userId = url.searchParams.get('userId');
  const { searchParams } = new URL(req.url);
  const fromDate = searchParams.get('from') || new Date(Date.now() - 30*86400000).toISOString().split('T')[0];
  const toDate = searchParams.get('to') || new Date().toISOString().split('T')[0];

  // Obtener transacciones de regalos recibidos
  const { data: gifts } = await supabase
    .from('gift_transactions')
    .select('created_at, gift_id, coins_spent, stars_generated')
    .eq('to_user_id', userId)
    .gte('created_at', fromDate)
    .lte('created_at', toDate);

  if (!gifts) return NextResponse.json({ error: 'No data' }, { status: 404 });

  const csvData = gifts.map(g => ({
    fecha: g.created_at,
    regalo: g.gift_id,
    coins_gastados: g.coins_spent,
    estrellas_recibidas: g.stars_generated,
  }));

  const csvString = stringify(csvData, { header: true });
  return new NextResponse(csvString, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="earnings_${fromDate}_${toDate}.csv"`,
    },
  });
}