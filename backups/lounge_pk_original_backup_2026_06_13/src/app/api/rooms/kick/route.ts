export const dynamic = 'force-static';
import { supabase } from '@/lib/supabase/client';

export async function POST(req: Request) {
  try {
    const { roomId, ownerId, targetUserId, action } = await req.json(); // action: 'seat' | 'room'

    if (!roomId || !ownerId || !targetUserId || !action) {
      return Response.json({ error: 'Parámetros incompletos' }, { status: 400 });
    }

    // 1. Verify ownership
    const { data: room, error: roomError } = await supabase
      .from('rooms')
      .select('*')
      .eq('id', roomId)
      .single();

    if (roomError || !room) {
      return Response.json({ error: 'Sala no encontrada' }, { status: 404 });
    }

    if (room.owner_id !== ownerId) {
      return Response.json({ error: 'No autorizado. Solo el propietario de la sala puede realizar esta acción' }, { status: 403 });
    }

    // 2. Perform the kick action
    if (action === 'seat' || action === 'room') {
      // Free the seat
      await supabase
        .from('room_seats')
        .delete()
        .eq('room_id', roomId)
        .eq('user_id', targetUserId);
    }

    if (action === 'room') {
      // Remove any invitation or reject it so they can't re-enter if private
      await supabase
        .from('room_invitations')
        .delete()
        .eq('room_id', roomId)
        .eq('user_id', targetUserId);
    }

    return Response.json({ success: true, targetUserId, action });
  } catch (err: any) {
    console.error('Error in room kick API:', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
