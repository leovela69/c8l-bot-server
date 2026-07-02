export const dynamic = 'force-static';
import { supabase } from '@/lib/supabase/client';

export async function GET(req: Request) {
  try {
    const { data: rooms, error } = await supabase
      .from('rooms')
      .select('*, owner:users!owner_id(name, avatar)')
      .eq('is_private', false)
      .eq('is_open', true)
      .order('created_at', { ascending: false });

    if (error) {
      // Return empty array in mock mode or error
      console.warn('Error fetching public rooms from DB, returning empty array:', error.message);
      return Response.json({ success: true, rooms: [] });
    }

    return Response.json({ success: true, rooms });
  } catch (err: any) {
    console.error('Error fetching public rooms:', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
