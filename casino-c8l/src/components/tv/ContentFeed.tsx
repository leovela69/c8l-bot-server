'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { motion } from 'framer-motion';

export function ContentFeed({ userId }) {
  const [content, setContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all'|'cover'|'video'|'live'>('all');
  const [sortBy, setSortBy] = useState<'recent'|'popular'|'trending'>('recent');

  useEffect(() => { loadContent(); }, [filter, sortBy]);

  const loadContent = async () => {
    setLoading(true);
    let query = supabase.from('tv_content').select('*, user:user_id(name, avatar)').eq('status', 'published');
    if (filter !== 'all') query = query.eq('type', filter);
    if (sortBy === 'recent') query = query.order('created_at', { ascending: false });
    else if (sortBy === 'popular') query = query.order('views', { ascending: false });
    else query = query.order('likes', { ascending: false });
    const { data } = await query.limit(20);
    setContent(data || []); setLoading(false);
  };

  const handleLike = async (contentId: string) => {
    const { data: existing } = await supabase.from('tv_interactions').select('id').eq('user_id', userId).eq('content_id', contentId).eq('type', 'like').single();
    if (existing) {
      await supabase.from('tv_interactions').delete().eq('id', existing.id);
    } else {
      await supabase.from('tv_interactions').insert({ user_id: userId, content_id: contentId, type: 'like' });
    }
    loadContent();
  };

  const formatViews = (n) => { if (n>=1000000) return (n/1000000).toFixed(1)+'M'; if (n>=1000) return (n/1000).toFixed(1)+'K'; return n.toString(); };
  const getTypeIcon = (t) => ({ cover:'🎤', video:'🎬', live:'🔴' }[t] || '📹');


  if (loading) return <div className="text-center text-gray-400 py-12">Cargando contenido...</div>;

  return (
    <div className="bg-gradient-to-br from-black to-purple-900/20 p-6 rounded-2xl border-2 border-c8l-gold shadow-[0_0_30px_rgba(212,175,55,0.3)]">
      <div className="flex flex-wrap gap-4 justify-between items-center mb-6">
        <h2 className="text-2xl font-black text-c8l-gold">📺 C8L TV</h2>
        <div className="flex gap-2">
          <select value={filter} onChange={e=>setFilter(e.target.value as any)} className="bg-black/50 border border-gray-700 rounded-lg px-3 py-1.5 text-white text-sm">
            <option value="all">Todos</option><option value="cover">🎤 Covers</option><option value="video">🎬 Videos</option><option value="live">🔴 Lives</option>
          </select>
          <select value={sortBy} onChange={e=>setSortBy(e.target.value as any)} className="bg-black/50 border border-gray-700 rounded-lg px-3 py-1.5 text-white text-sm">
            <option value="recent">Recientes</option><option value="popular">Populares</option><option value="trending">Tendencia</option>
          </select>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {content.map((item) => (
          <motion.div key={item.id} initial={{opacity:0,y:20}} animate={{opacity:1,y:0}}
            className="bg-black/40 rounded-lg overflow-hidden border border-gray-800 hover:border-c8l-gold transition-all cursor-pointer">
            <div className="relative aspect-video bg-gradient-to-br from-purple-900/30 to-black flex items-center justify-center">
              <div className="text-6xl">{getTypeIcon(item.type)}</div>
              {item.type==='live' && <div className="absolute top-2 left-2 bg-red-600 text-white text-xs px-2 py-0.5 rounded-full animate-pulse">EN VIVO</div>}
              {item.thumbnail_url && <img src={item.thumbnail_url} alt={item.title} className="absolute inset-0 w-full h-full object-cover" />}
              <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-0.5 rounded">👁️ {formatViews(item.views)}</div>
            </div>
            <div className="p-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl">{item.user?.avatar||'👤'}</span>
                <span className="text-sm text-gray-400">{item.user?.name||'Anónimo'}</span>
              </div>
              <h3 className="font-bold text-white line-clamp-1">{item.title}</h3>
              <div className="flex gap-3 mt-3 text-sm text-gray-400">
                <button onClick={(e)=>{e.stopPropagation();handleLike(item.id);}} className="flex items-center gap-1 hover:text-c8l-pink transition">❤️ {item.likes}</button>
                <span className="flex items-center gap-1">💬 {item.comments_count||0}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
      {content.length===0 && <div className="text-center text-gray-400 py-12"><div className="text-4xl mb-2">📺</div><p>No hay contenido aún. ¡Sé el primero!</p></div>}
    </div>
  );
}
