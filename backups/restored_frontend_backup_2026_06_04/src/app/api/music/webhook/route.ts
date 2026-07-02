export const dynamic = 'force-static';
// app/api/music/webhook/route.ts (webhook de Replicate)
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { id, status, output, metrics } = body;
    
    if (status === 'succeeded') {
      const audioUrl = output.audio_out;
      
      // Actualizar el registro en Supabase
      const { data: generation, error: updateError } = await supabase
        .from('generated_music')
        .update({
          status: 'completed',
          output_url: audioUrl,
          duration_seconds: output.duration,
          completed_at: new Date(),
          metrics: metrics
        })
        .eq('replicate_prediction_id', id)
        .select()
        .single();
      
      if (updateError) throw updateError;
      
      // Incrementar contador mensual del usuario
      await supabase.rpc('increment_music_counter', { 
        user_id: generation.user_id 
      });
      
      // Crear notificación para el usuario
      await supabase.from('notifications').insert({
        user_id: generation.user_id,
        type: 'music_generated',
        title: '🎵 ¡Tu música está lista!',
        message: `Tu canción "${generation.prompt}" ya está disponible.`,
        metadata: { generationId: generation.id, audioUrl: audioUrl },
        created_at: new Date()
      });
      
    } else if (status === 'failed') {
      // Restituir los coins si falló la generación
      const { data: generation } = await supabase
        .from('generated_music')
        .select('user_id, coins_cost')
        .eq('replicate_prediction_id', id)
        .single();
      
      if (generation) {
        await supabase.rpc('add_coins', { 
          user_id: generation.user_id, 
          amount: generation.coins_cost 
        });
      }
      
      await supabase
        .from('generated_music')
        .update({ status: 'failed', error_message: body.error })
        .eq('replicate_prediction_id', id);
    }
    
    return NextResponse.json({ received: true });
    
  } catch (error) {
    console.error('Error en webhook:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}