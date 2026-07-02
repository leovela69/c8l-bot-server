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
    const { userId, tableId, action, amount } = await req.json();
    
    // Validar acción según reglas del póker
    const gameState = await getGameState(tableId);
    
    if (action === 'raise' && amount > gameState.currentPlayerCoins) {
      return Response.json({ error: 'No tienes suficientes coins' }, { status: 400 });
    }
    
    // Registrar acción en Supabase
    await supabase.from('poker_actions').insert({
      table_id: tableId,
      user_id: userId,
      action,
      amount,
      timestamp: new Date()
    });
    
    // Si es fold, el jugador pierde su apuesta
    if (action === 'fold') {
      await supabase.rpc('transfer_coins', {
        from_user: userId,
        to_user: gameState.winnerId,
        amount: gameState.currentBet
      });
    }
    
    return Response.json({ success: true });
  } catch (error: any) {
    console.error('Error in poker action:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
