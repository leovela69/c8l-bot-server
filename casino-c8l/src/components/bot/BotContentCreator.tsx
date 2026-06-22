'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';

export function BotContentCreator() {
  const [contentStats, setContentStats] = useState({
    covers: 0, videos: 0, lives: 0, interactions: 0
  });
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => { if (isActive) createContent(); }, 30000);
    return () => clearInterval(interval);
  }, [isActive]);

  const createContent = () => {
    const types = ['cover', 'video', 'live', 'comment', 'like'];
    const type = types[Math.floor(Math.random() * types.length)];
    const key = type === 'cover' ? 'covers' : type === 'video' ? 'videos' : type === 'live' ? 'lives' : 'interactions';
    setContentStats(prev => ({ ...prev, [key]: prev[key] + 1 }));
    supabase.from('bot_actions').insert({
      action_type: 'content_upload', target: type, result: 'success',
      details: { title: `Contenido auto ${Date.now()}`, type }
    });
  };


  return (
    <div className="bg-black/40 p-4 rounded-lg border border-gray-800">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <span className="text-2xl">📹</span>
          <div><h4 className="font-bold text-white">Bot Creador</h4><div className="text-xs text-gray-400">Generando contenido automáticamente</div></div>
        </div>
        <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
      </div>
      <div className="grid grid-cols-4 gap-2 mt-3 text-center text-xs">
        <div className="bg-black/30 p-2 rounded"><div className="text-c8l-gold font-bold">{contentStats.covers}</div><div className="text-gray-500">🎤 Covers</div></div>
        <div className="bg-black/30 p-2 rounded"><div className="text-c8l-gold font-bold">{contentStats.videos}</div><div className="text-gray-500">🎬 Videos</div></div>
        <div className="bg-black/30 p-2 rounded"><div className="text-red-400 font-bold">{contentStats.lives}</div><div className="text-gray-500">🔴 Lives</div></div>
        <div className="bg-black/30 p-2 rounded"><div className="text-purple-400 font-bold">{contentStats.interactions}</div><div className="text-gray-500">💬 Interacciones</div></div>
      </div>
    </div>
  );
}
