// app/sitemap.ts
export const dynamic = 'force-static';
import { supabase } from '@/lib/supabase/client';

export default async function sitemap() {
  const baseUrl = 'https://c8l.com';

  // Obtener todas las URLs de covers públicos
  const { data: covers } = await supabase
    .from('karaoke_covers')
    .select('id, updated_at')
    .eq('status', 'published');

  const coverUrls = (covers || []).map(cover => ({
    url: `${baseUrl}/cover/${cover.id}`,
    lastModified: cover.updated_at,
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  // Añadir páginas estáticas
  const staticPages = ['', '/feed', '/ranking', '/lounge', '/pricing'].map(route => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily',
    priority: route === '' ? 1.0 : 0.8,
  }));

  return [...staticPages, ...coverUrls];
}