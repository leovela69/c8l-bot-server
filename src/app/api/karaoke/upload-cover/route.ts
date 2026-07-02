export const dynamic = 'force-static';
// app/api/karaoke/upload-cover/route.ts
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import { put } from '@vercel/blob';

export async function POST(req: Request) {
  const formData = await req.formData();
  const coverFile = formData.get('cover') as File;
  const trackId = formData.get('trackId') as string;
  const userId = req.headers.get('x-user-id') || 'anonymous';
  
  // 1. Subir el cover a Vercel Blob / Supabase Storage
  const blob = await put(`covers/${trackId}_${Date.now()}.mp3`, coverFile, {
    access: 'public',
    token: process.env.BLOB_READ_WRITE_TOKEN!
  });
  
  // 2. Obtener el track base para verificar que existe
  const { data: track } = await supabase
    .from('karaoke_tracks')
    .select('instrumental_url, title, created_by')
    .eq('id', trackId)
    .single();
  
  if (!track) {
    return NextResponse.json({ error: 'Track no encontrado' }, { status: 404 });
  }
  
  // 3. Guardar el cover en la base de datos
  const { data: cover, error } = await supabase
    .from('karaoke_covers')
    .insert({
      track_id: trackId,
      user_id: userId,
      cover_url: blob.url,
      status: 'published'
    })
    .select()
    .single();
  
  if (error) throw error;
  
  // 4. Actualizar contador de covers del track
  await supabase.rpc('increment_cover_count', { track_id: trackId });
  
  // 5. Dar recompensa al creador del track base (50% de lo que cuesta grabar)
  // Cada cover cuesta 50 coins para grabar, el creador recibe 25
  await supabase.rpc('add_coins', { 
    user_id: track.created_by, 
    amount: 25 
  });
  
  return NextResponse.json({
    success: true,
    coverId: cover.id,
    coverUrl: blob.url,
    message: '🎤 Cover subido exitosamente'
  });
}