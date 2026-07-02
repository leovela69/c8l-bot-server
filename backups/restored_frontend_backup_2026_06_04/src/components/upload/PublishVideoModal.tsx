// components/upload/PublishVideoModal.tsx
'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Video, X, Upload } from 'lucide-react';

export function PublishVideoModal({ audioUrl, coverImage, onClose }: { audioUrl: string; coverImage?: File; onClose: () => void }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handlePublish = async () => {
    if (!title.trim()) {
      setErrorMsg('El título es requerido');
      return;
    }
    setErrorMsg('');
    setIsUploading(true);
    try {
      // 1. Subir miniatura a Supabase Storage
      let thumbnailUrl = '';
      if (coverImage) {
        const fileExt = coverImage.name.split('.').pop() || 'jpg';
        const fileName = `${Date.now()}_thumbnail.${fileExt}`;
        const { data, error } = await supabase.storage.from('thumbnails').upload(fileName, coverImage);
        if (error) throw error;
        
        // Obtener la URL pública de la miniatura
        const { data: publicUrlData } = supabase.storage.from('thumbnails').getPublicUrl(fileName);
        thumbnailUrl = publicUrlData?.publicUrl || '';
      }

      // 2. Insertar registro en la tabla `videos`
      const { error: dbError } = await supabase.from('videos').insert({
        title: title.trim(),
        description: description.trim(),
        video_url: audioUrl,
        thumbnail_url: thumbnailUrl,
        created_at: new Date().toISOString(),
      });

      if (dbError) throw dbError;

      onClose();
    } catch (err: any) {
      console.error('Error publishing:', err);
      setErrorMsg(err.message || 'Error al publicar. Inténtalo de nuevo.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50 animate-fade-in backdrop-blur-sm">
      <div className="bg-black border-2 border-[#00F3FF] p-6 rounded shadow-[0_0_20px_rgba(0,243,255,0.2)] w-full max-w-md relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
          disabled={isUploading}
        >
          <X size={20} />
        </button>

        <div className="flex items-center gap-2 mb-6">
          <Video className="text-[#00F3FF]" size={24} />
          <h2 className="text-xl font-black text-[#00F3FF] tracking-wider">PUBLICAR REPRODUCCIÓN</h2>
        </div>

        {errorMsg && (
          <div className="bg-red-950/50 border border-red-500 text-red-200 text-xs p-3 rounded mb-4">
            {errorMsg}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-black text-gray-400 mb-1 tracking-widest">TÍTULO *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej. Mi primer cover de Cyberpunk"
              className="w-full bg-gray-900 border border-gray-800 p-2 text-white text-sm rounded focus:outline-none focus:border-[#00F3FF] placeholder-gray-600 transition-colors"
              disabled={isUploading}
            />
          </div>

          <div>
            <label className="block text-xs font-black text-gray-400 mb-1 tracking-widest">DESCRIPCIÓN</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Cuéntale a la comunidad sobre tu canción..."
              rows={3}
              className="w-full bg-gray-900 border border-gray-800 p-2 text-white text-sm rounded focus:outline-none focus:border-[#00F3FF] placeholder-gray-600 resize-none transition-colors"
              disabled={isUploading}
            />
          </div>

          {coverImage && (
            <div className="bg-gray-900/50 border border-gray-800 p-3 rounded flex items-center gap-3">
              <div className="w-12 h-12 bg-gray-800 rounded overflow-hidden flex items-center justify-center text-gray-500">
                <Upload size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-white truncate">{coverImage.name}</p>
                <p className="text-[10px] text-gray-500">Miniatura cargada</p>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-900">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-800 text-gray-400 hover:text-white text-xs font-bold rounded transition-colors"
              disabled={isUploading}
            >
              CANCELAR
            </button>
            <button
              onClick={handlePublish}
              disabled={isUploading || !title.trim()}
              className="px-5 py-2 bg-[#00F3FF] text-black font-black text-xs rounded hover:bg-[#00F3FF]/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed tracking-wider"
            >
              {isUploading ? 'PUBLICANDO...' : 'PUBLICAR AHORA'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}