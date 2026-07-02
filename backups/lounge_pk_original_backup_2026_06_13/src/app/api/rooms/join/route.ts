export const dynamic = 'force-static';
import { supabase } from '@/lib/supabase/client';

export async function POST(req: Request) {
  try {
    const { roomId, userId } = await req.json();

    if (!roomId || !userId) {
      return Response.json({ error: 'ID de sala y ID de usuario son requeridos' }, { status: 400 });
    }

    // 1. Fetch Room Details
    const { data: room, error: roomError } = await supabase
      .from('rooms')
      .select('*')
      .eq('id', roomId)
      .single();

    if (roomError || !room) {
      // In case we are offline/mocking, simulate success locally for mock rooms
      console.warn('Room not found in DB, assuming offline mode and allowing join');
      return Response.json({ success: true, authorized: true });
    }

    // 2. Check if Room is closed
    if (!room.is_open && room.owner_id !== userId) {
      return Response.json({ error: 'La sala está cerrada al público por el propietario', authorized: false }, { status: 403 });
    }

    // 3. Check privacy permissions
    if (room.is_private && room.owner_id !== userId) {
      // Check if user has an accepted invitation
      const { data: invitation } = await supabase
        .from('room_invitations')
        .select('*')
        .eq('room_id', roomId)
        .eq('user_id', userId)
        .eq('status', 'accepted')
        .single();

      if (!invitation) {
        return Response.json({ error: 'Esta sala es privada y requiere una invitación aceptada', authorized: false }, { status: 403 });
      }
    }

    // 4. Fetch Seats count
    const { data: seats } = await supabase
      .from('room_seats')
      .select('id')
      .eq('room_id', roomId);

    const seatCount = seats ? seats.length : 0;
    if (seatCount >= room.max_seats) {
      return Response.json({ error: 'La sala ha alcanzado el límite máximo de butacas', authorized: false }, { status: 409 });
    }

    return Response.json({ success: true, authorized: true, room });
  } catch (err: any) {
    console.error('Error joining room:', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
