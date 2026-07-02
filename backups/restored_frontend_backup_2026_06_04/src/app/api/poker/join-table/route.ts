export const dynamic = 'force-static';
import { supabase } from '@/lib/supabase/client';

async function getGameState(tableId: string) {
  // En producción, esto consultaría el estado de la partida en Redis o Cloudflare Workers Durable Objects.
  return {
    currentPlayerCoins: 1000,
    winnerId: 'system',
    currentBet: 50,
  };
}

export async function POST(req: Request) {
  try {
    const { userId, tableId, buyIn } = await req.json();
    
    // 1. Verificar saldo en Supabase
    const { data: wallet } = await supabase
      .from('wallets')
      .select('coins')
      .eq('user_id', userId)
      .single();
    
    if (!wallet || wallet.coins < buyIn) {
      return Response.json({ error: 'Coins insuficientes' }, { status: 402 });
    }
    
    // 2. Bloquear coins (reservar para la mesa)
    await supabase.rpc('reserve_coins', { user_id: userId, amount: buyIn });
    
    // 3. Unirse a la mesa (WebSocket via Cloudflare Workers)
    // Usamos try/catch en caso de que WebSocket falle en entorno de compilación Next.js
    try {
      const ws = new WebSocket('wss://poker-worker.c8l.workers.dev');
      ws.onopen = () => {
        ws.send(JSON.stringify({
          type: 'join',
          userId,
          tableId,
          buyIn
        }));
      };
    } catch (e) {
      console.warn('WebSocket connection skipped during SSR/build:', e);
    }
    
    return Response.json({ success: true, tableId });
  } catch (error: any) {
    console.error('Error joining table:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}