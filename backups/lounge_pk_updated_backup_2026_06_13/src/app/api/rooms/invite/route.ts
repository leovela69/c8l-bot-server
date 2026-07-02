export const dynamic = 'force-static';
import { supabase } from '@/lib/supabase/client';

export async function POST(req: Request) {
  try {
    const { roomId, invitedByUserId, userId, email } = await req.json();

    if (!roomId || !invitedByUserId || (!userId && !email)) {
      return Response.json({ error: 'Parámetros incompletos' }, { status: 400 });
    }

    // 1. Verify that the inviter is the room owner
    const { data: room, error: roomError } = await supabase
      .from('rooms')
      .select('*')
      .eq('id', roomId)
      .single();

    if (roomError || !room) {
      return Response.json({ error: 'Sala no encontrada' }, { status: 404 });
    }

    if (room.owner_id !== invitedByUserId) {
      return Response.json({ error: 'No autorizado. Solo el propietario de la sala puede invitar usuarios' }, { status: 403 });
    }

    // 2. Resolve target user ID
    let targetUserId = userId;
    if (email && !targetUserId) {
      const { data: userRecord } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .single();

      if (!userRecord) {
        return Response.json({ error: 'Usuario no encontrado con el correo provisto' }, { status: 444 });
      }
      targetUserId = userRecord.id;
    }

    // Prevent self-invitation
    if (targetUserId === invitedByUserId) {
      return Response.json({ error: 'No te puedes invitar a ti mismo' }, { status: 400 });
    }

    // 3. Insert or update invitation
    const { data: invitation, error: inviteError } = await supabase
      .from('room_invitations')
      .upsert({
        room_id: roomId,
        user_id: targetUserId,
        invited_by_id: invitedByUserId,
        status: 'pending',
        created_at: new Date().toISOString()
      }, { onConflict: 'room_id,user_id' })
      .select()
      .single();

    if (inviteError) {
      throw inviteError;
    }

    return Response.json({ success: true, invitation });
  } catch (err: any) {
    console.error('Error in room invite API:', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
