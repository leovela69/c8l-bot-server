export const dynamic = 'force-static';
import { supabase } from '@/lib/supabase/client';

// Get invitations for a user
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      // Return empty list during static evaluation
      return Response.json({ success: true, invitations: [] });
    }

    const { data: invitations, error } = await supabase
      .from('room_invitations')
      .select('*, room:rooms(*), invited_by:users!invited_by_id(name, avatar)')
      .eq('user_id', userId)
      .eq('status', 'pending');

    if (error) {
      console.warn('Error fetching invitations from DB, returning empty:', error.message);
      return Response.json({ success: true, invitations: [] });
    }

    return Response.json({ success: true, invitations });
  } catch (err: any) {
    console.error('Error in invitations GET API:', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}

// Update invitation status (Accept/Reject)
export async function POST(req: Request) {
  try {
    const { invitationId, status } = await req.json(); // status: 'accepted' or 'rejected'

    if (!invitationId || !status) {
      return Response.json({ error: 'ID de invitación y estado son requeridos' }, { status: 400 });
    }

    if (status !== 'accepted' && status !== 'rejected') {
      return Response.json({ error: 'Estado no válido' }, { status: 400 });
    }

    const { data: invitation, error } = await supabase
      .from('room_invitations')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', invitationId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return Response.json({ success: true, invitation });
  } catch (err: any) {
    console.error('Error updating invitation status:', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
