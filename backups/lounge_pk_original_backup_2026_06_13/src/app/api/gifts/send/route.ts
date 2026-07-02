// app/api/gifts/send/route.ts
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { toUserId, targetId, giftId, coinCost, fromUserId } = body;
    
    // Support both formats: 'toUserId' (roadmap spec) or 'targetId' (existing helper spec)
    const recipientId = toUserId || targetId;
    const senderId = fromUserId || 'mock-user-id'; // Fallback if not logged in or in simulation mode
    
    if (!recipientId || !giftId || coinCost === undefined) {
      return NextResponse.json({ error: 'Faltan parámetros requeridos' }, { status: 400 });
    }

    // Determine if Supabase is connected to a real instance (not default placeholder)
    const isMockSupabase = !process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder') || process.env.NEXT_PUBLIC_SUPABASE_URL.includes('your-project-id');

    if (!isMockSupabase) {
      // Call Supabase process_gift function
      const { data, error } = await supabase.rpc('process_gift', {
        p_from_user: senderId,
        p_to_user: recipientId,
        p_gift_id: giftId,
        p_coin_cost: Number(coinCost)
      });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      return NextResponse.json({ success: true, ...data });
    } else {
      // Simulation mode: Simulate successful database update
      const starsGenerated = Math.floor(Number(coinCost) / 2);
      
      console.log(`[Simulation Mode] Transacción de Regalo registrada: De ${senderId} para ${recipientId}. Regalo: ${giftId}. Costo: ${coinCost} Coins. Estrellas generadas: ${starsGenerated}.`);
      
      return NextResponse.json({
        success: true,
        stars_given: starsGenerated,
        simulated: true,
        message: "Transacción simulada en local con éxito."
      });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
