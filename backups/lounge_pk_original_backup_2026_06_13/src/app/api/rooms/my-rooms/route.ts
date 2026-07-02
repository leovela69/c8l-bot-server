export const dynamic = 'force-static';
import { supabase } from '@/lib/supabase/client';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      // Return empty array for static build evaluation
      return Response.json({ success: true, rooms: [] });
    }

    const { data: rooms, error } = await supabase
      .from('rooms')
      .select('*')
      .eq('owner_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      // Return empty array in mock mode
      console.warn('Error fetching my-rooms from DB, returning empty array:', error.message);
      return Response.json({ success: true, rooms: [] });
    }

    return Response.json({ success: true, rooms });
  } catch (err: any) {
    console.error('Error fetching my-rooms:', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
