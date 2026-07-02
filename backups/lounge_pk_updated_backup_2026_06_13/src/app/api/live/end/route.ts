export const dynamic = 'force-static';
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export async function POST(req: NextRequest) {
  const { streamId, userId } = await req.json();

  await supabase
    .from('live_streams')
    .update({ status: 'ended', ended_at: new Date() })
    .eq('id', streamId)
    .eq('user_id', userId); // solo el dueño puede finalizar

  return NextResponse.json({ success: true });
}