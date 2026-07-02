'use client';
import { useState, useEffect } from 'react';
import { Play, Music, Plus, Trash2, SkipForward } from 'lucide-react';
import { useApp } from '@/context/AppContext';

interface QueueItem {
  id: string;
  room_id: string;
  user_id: string;
  song_title: string;
  song_url: string;
  position: number;
  status: 'pending' | 'playing' | 'done';
  created_at: string;
  user?: {
    name: string;
    avatar: string;
  };
}

interface SongQueueProps {
  roomId: string;
  isOwner: boolean;
  onNextSong?: (song: QueueItem | null) => void;
  onQueueChanged?: () => void;
}

const POPULAR_KARAOKE_SONGS = [
  { title: 'Bohemian Rhapsody - Queen', url: '/tracks/bohemian.mp3' },
  { title: 'Despacito - Luis Fonsi', url: '/tracks/despacito.mp3' },
  { title: 'Shape of You - Ed Sheeran', url: '/tracks/shape.mp3' },
  { title: 'Hotel California - Eagles', url: '/tracks/hotel.mp3' },
  { title: 'Creep - Radiohead', url: '/tracks/creep.mp3' },
  { title: 'Billie Jean - Michael Jackson', url: '/tracks/billie.mp3' },
];

export function SongQueue({ roomId, isOwner, onNextSong, onQueueChanged }: SongQueueProps) {
  const { user, showNotification } = useApp();
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [customTitle, setCustomTitle] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchQueue = async () => {
    try {
      const { supabase } = await import('@/lib/supabase/client');
      const { data, error } = await supabase
        .from('room_queue')
        .select('*, user:users!user_id(name, avatar)')
        .eq('room_id', roomId)
        .in('status', ['pending', 'playing'])
        .order('position', { ascending: true })
        .order('created_at', { ascending: true });

      if (error) throw error;
      setQueue(data || []);

      // Notify parent of the current playing song if it's there
      if (onNextSong) {
        const playing = data?.find((s) => s.status === 'playing') || null;
        onNextSong(playing);
      }
    } catch (e: any) {
      console.error('Error fetching song queue:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();

    // Subscribe to realtime queue changes
    let subscription: any;
    (async () => {
      const { supabase } = await import('@/lib/supabase/client');
      subscription = supabase
        .channel(`room_queue_room_${roomId}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'room_queue', filter: `room_id=eq.${roomId}` }, () => {
          fetchQueue();
          if (onQueueChanged) onQueueChanged();
        })
        .subscribe();
    })();

    return () => {
      if (subscription) subscription.unsubscribe();
    };
  }, [roomId]);

  const handleAddSong = async (title: string, url: string = '') => {
    if (!user) {
      showNotification('Debes iniciar sesión para pedir canción', 'error');
      return;
    }

    try {
      const { supabase } = await import('@/lib/supabase/client');
      
      // Calculate position
      const nextPosition = queue.length > 0 ? queue[queue.length - 1].position + 1 : 1;

      const { error } = await supabase
        .from('room_queue')
        .insert({
          room_id: roomId,
          user_id: user.uid,
          song_title: title,
          song_url: url || '/tracks/demo.mp3',
          position: nextPosition,
          status: 'pending'
        });

      if (error) throw error;
      showNotification(`Añadida: ${title} a la cola`, 'success');
      setCustomTitle('');
      fetchQueue();
      if (onQueueChanged) onQueueChanged();
    } catch (e: any) {
      console.error('Error adding song:', e);
      showNotification('Error al agregar canción', 'error');
    }
  };

  const handleRemoveSong = async (songId: string, title: string) => {
    try {
      const { supabase } = await import('@/lib/supabase/client');
      const { error } = await supabase
        .from('room_queue')
        .delete()
        .eq('id', songId);

      if (error) throw error;
      showNotification(`Eliminada: ${title}`, 'info');
      fetchQueue();
      if (onQueueChanged) onQueueChanged();
    } catch (e: any) {
      console.error('Error removing song:', e);
    }
  };

  const handleAdvanceSong = async () => {
    if (queue.length === 0) return;

    try {
      const { supabase } = await import('@/lib/supabase/client');
      const currentPlaying = queue.find((s) => s.status === 'playing');
      const nextPending = queue.find((s) => s.status === 'pending');

      // 1. Mark current playing as done
      if (currentPlaying) {
        await supabase
          .from('room_queue')
          .update({ status: 'done' })
          .eq('id', currentPlaying.id);
      }

      // 2. Mark next pending as playing
      if (nextPending) {
        await supabase
          .from('room_queue')
          .update({ status: 'playing' })
          .eq('id', nextPending.id);

        // Mark user as singing in seats
        await supabase
          .from('room_seats')
          .update({ is_singing: true })
          .eq('room_id', roomId)
          .eq('user_id', nextPending.user_id);
          
        // Mute others singing
        await supabase
          .from('room_seats')
          .update({ is_singing: false })
          .eq('room_id', roomId)
          .not('user_id', 'eq', nextPending.user_id);

        showNotification(`Siguiente canción: ${nextPending.song_title}`, 'success');
      } else {
        // No pending songs, free everyone from singing status
        await supabase
          .from('room_seats')
          .update({ is_singing: false })
          .eq('room_id', roomId);
          
        showNotification('Fin de la cola de reproducción', 'info');
      }

      fetchQueue();
      if (onQueueChanged) onQueueChanged();
    } catch (e: any) {
      console.error('Error advancing song queue:', e);
    }
  };

  const activePlaying = queue.find((s) => s.status === 'playing');
  const pendingSongs = queue.filter((s) => s.status === 'pending');

  return (
    <div className="bg-black/60 border-2 border-gray-800 rounded-xl p-4 flex flex-col h-full">
      <h3 className="text-sm font-black text-[#D4AF37] mb-3 flex items-center gap-1.5 font-mono uppercase tracking-wider">
        <Music size={16} /> COLA DE TURNOS
      </h3>

      {/* Control panel for Owner/Singer */}
      {isOwner && queue.length > 0 && (
        <button
          onClick={handleAdvanceSong}
          className="mb-4 w-full py-2 bg-gradient-to-r from-purple-700 to-[#FF0055] hover:from-purple-600 hover:to-[#FF0055]/80 text-white font-black text-xs border border-purple-500 rounded flex items-center justify-center gap-1.5 cursor-pointer shadow-[0_0_10px_rgba(255,0,85,0.3)] transition-all"
        >
          <SkipForward size={14} /> SIGUIENTE CANCIÓN
        </button>
      )}

      {/* Playing Now */}
      <div className="mb-4">
        <span className="text-[10px] text-gray-500 font-mono block mb-1.5">🎵 CANTANDO AHORA</span>
        {activePlaying ? (
          <div className="bg-gradient-to-r from-purple-950/40 to-[#FF0055]/10 border border-[#FF0055]/30 p-3 rounded-lg flex justify-between items-center animate-pulse">
            <div>
              <div className="font-bold text-white text-xs leading-tight">{activePlaying.song_title}</div>
              <div className="text-[9px] text-[#00F3FF] mt-1">Por: {activePlaying.user?.name || 'Vocalista'}</div>
            </div>
            <span className="text-xl">🎤</span>
          </div>
        ) : (
          <div className="bg-gray-950/80 border border-gray-900 text-center py-4 rounded-lg text-xs text-gray-500">
            Escenario disponible. ¡Pide tu turno!
          </div>
        )}
      </div>

      {/* Queue List */}
      <div className="flex-1 overflow-y-auto max-h-48 mb-4 space-y-2 pr-1">
        <span className="text-[10px] text-gray-500 font-mono block">📋 SIGUIENTES PRESENTACIONES ({pendingSongs.length})</span>
        
        {loading ? (
          <div className="text-[10px] text-gray-500 text-center py-4">Cargando cola...</div>
        ) : pendingSongs.length === 0 ? (
          <div className="text-[10px] text-gray-600 text-center py-4 italic">No hay canciones en espera</div>
        ) : (
          pendingSongs.map((song) => {
            const isMine = user?.uid === song.user_id;
            return (
              <div
                key={song.id}
                className="bg-gray-900/60 hover:bg-gray-900 border border-gray-800 p-2 rounded flex justify-between items-center text-xs transition-colors"
              >
                <div className="truncate flex-1 mr-2">
                  <div className="font-semibold text-white truncate">{song.song_title}</div>
                  <div className="text-[9px] text-gray-500 truncate">Sillón por: {song.user?.name || 'Cantante'}</div>
                </div>
                
                {/* Delete button (owner or self) */}
                {(isOwner || isMine) && (
                  <button
                    onClick={() => handleRemoveSong(song.id, song.song_title)}
                    className="p-1 text-gray-500 hover:text-red-400 transition-colors cursor-pointer"
                    title="Eliminar de la cola"
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Request Song form */}
      <div className="border-t border-gray-900 pt-3 mt-auto">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (customTitle.trim()) handleAddSong(customTitle.trim());
          }}
          className="flex gap-1.5 mb-3"
        >
          <input
            type="text"
            placeholder="Pedir otra canción..."
            value={customTitle}
            onChange={(e) => setCustomTitle(e.target.value)}
            className="flex-1 bg-black border border-gray-800 focus:border-[#D4AF37] text-white rounded p-1.5 text-[10px] focus:outline-none"
          />
          <button
            type="submit"
            disabled={!customTitle.trim()}
            className="p-1.5 bg-[#D4AF37] hover:bg-black text-black hover:text-[#D4AF37] border border-black hover:border-[#D4AF37] rounded transition-colors disabled:opacity-40 cursor-pointer"
          >
            <Plus size={14} />
          </button>
        </form>

        {/* Quick Suggestions */}
        <div className="space-y-1">
          <span className="text-[9px] text-gray-500 font-mono block">⚡ SUGERENCIAS RÁPIDAS</span>
          <div className="grid grid-cols-2 gap-1 max-h-24 overflow-y-auto pr-1">
            {POPULAR_KARAOKE_SONGS.map((song) => (
              <button
                key={song.title}
                type="button"
                onClick={() => handleAddSong(song.title, song.url)}
                className="text-left bg-gray-950 hover:bg-[#D4AF37]/10 border border-gray-900 hover:border-[#D4AF37] p-1 rounded text-[9px] text-gray-400 hover:text-white truncate cursor-pointer transition-all"
              >
                {song.title.split(' - ')[0]}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
