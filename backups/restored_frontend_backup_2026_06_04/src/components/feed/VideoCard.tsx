// components/feed/VideoCard.tsx
'use client';
import { useState } from 'react';
import { Heart, MessageCircle, Share2, MoreVertical, Mic } from 'lucide-react';
import Link from 'next/link';

interface VideoCardProps {
  video: {
    id: string;
    title: string;
    thumbnail_url: string;
    duration: number;
    views: number;
    likes: number;
    created_at: string;
    is_live?: boolean;
    user: {
      id: string;
      name: string;
      avatar: string;
    };
  };
}

function formatDuration(seconds: number): string {
  if (isNaN(seconds) || seconds === undefined) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function formatRelativeTime(dateString: string | Date): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'Hace un momento';
  if (diffMins < 60) return `Hace ${diffMins} min`;
  if (diffHours < 24) return `Hace ${diffHours} horas`;
  if (diffDays < 7) return `Hace ${diffDays} días`;
  return date.toLocaleDateString();
}

export function VideoCard({ video }: VideoCardProps) {
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(video.likes);

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (liked) return;
    setLiked(true);
    setLikesCount((prev: number) => prev + 1);
    try {
      await fetch('/api/videos/like', { method: 'POST', body: JSON.stringify({ videoId: video.id }) });
    } catch (err) {
      console.warn("API like error (fallback to local state):", err);
    }
  };

  return (
    <div className="bg-[#09090b] border-2 border-[#00F3FF] hover:border-[#FF69B4] shadow-[4px_4px_0px_#000000] hover:shadow-[6px_6px_0px_#000000] hover:-translate-x-1 hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between h-full group">
      <div>
        <Link href={`/watch/${video.id}`}>
          <div className="relative aspect-video bg-black overflow-hidden border-b-3 border-black">
            <img 
              src={video.thumbnail_url} 
              alt={video.title} 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
            />
            {video.is_live && (
              <span className="absolute top-2 left-2 bg-[#FF69B4] text-black border-2 border-black text-[9px] font-black px-2 py-0.5 uppercase tracking-wider animate-pulse shadow-[2px_2px_0px_#000]">
                🔴 EN VIVO
              </span>
            )}
            <span className="absolute bottom-2 right-2 bg-black border border-zinc-800 text-[10px] font-mono px-1 rounded text-white">
              {formatDuration(video.duration)}
            </span>
          </div>
        </Link>
        <div className="p-4 flex gap-3">
          <Link href={`/profile/${video.user.id}`}>
            <span className="text-xl bg-zinc-900 border-2 border-black w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-[2px_2px_0px_#000] hover:scale-105 active:scale-95 transition-all">
              {video.user.avatar.includes('http') ? (
                <img src={video.user.avatar} className="w-full h-full rounded-full object-cover" />
              ) : (
                video.user.avatar || '🎤'
              )}
            </span>
          </Link>
          <div className="flex-1 min-w-0">
            <Link href={`/watch/${video.id}`}>
              <h3 className="font-heading font-black text-sm text-white line-clamp-2 hover:text-[#00F3FF] transition-colors leading-tight mb-1 uppercase tracking-wide">
                {video.title}
              </h3>
            </Link>
            <Link href={`/profile/${video.user.id}`} className="text-xs font-semibold text-zinc-400 hover:text-[var(--color-gold)] transition-colors block">
              {video.user.name}
            </Link>
            <div className="text-[10px] font-mono text-zinc-500 flex gap-2 mt-1 uppercase tracking-wider">
              <span>{video.views.toLocaleString()} vistas</span>
              <span>•</span>
              <span>{formatRelativeTime(video.created_at)}</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Interactive Footer Actions */}
      <div className="px-4 pb-4 pt-1 flex flex-col gap-2 border-t border-zinc-900/50 mt-auto">
        <div className="flex items-center justify-between">
          <button 
            onClick={handleLike} 
            className={`flex items-center gap-1 px-2.5 py-1 rounded border-2 border-black text-xs font-bold uppercase transition-all shadow-[2px_2px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] ${
              liked 
                ? 'bg-[#FF69B4] text-black' 
                : 'bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
          >
            <Heart size={12} className={liked ? 'fill-black text-black' : ''} />
            <span>{likesCount}</span>
          </button>

          <Link href={`/watch/${video.id}`} className="flex items-center gap-1 px-2.5 py-1 rounded border-2 border-black bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800 text-xs font-bold uppercase transition-all shadow-[2px_2px_0px_#000] active:translate-x-[1px] active:translate-y-[1px]">
            <MessageCircle size={12} />
            <span>Comentar</span>
          </Link>
        </div>

        <Link 
          href={`/studio?duet=${video.id}`}
          className="w-full py-1.5 bg-[#FF69B4] hover:bg-[#FF69B4]/90 hover:shadow-[3px_3px_0px_#8A2BE2] text-black font-black uppercase text-[10px] tracking-widest border-2 border-black shadow-[2px_2px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] transition-all flex items-center justify-center gap-1.5"
        >
          🎙️ Duet Challenge
        </Link>
      </div>
    </div>
  );
}