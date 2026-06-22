'use client';
import { useState, useRef } from 'react';
import { supabase } from '@/lib/supabase/client';
import { motion } from 'framer-motion';

export function ContentUploader({ userId, onUploadComplete }) {
  const [type, setType] = useState<'cover'|'video'|'live'>('cover');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [file, setFile] = useState<File|null>(null);
  const [thumbnail, setThumbnail] = useState<File|null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const thumbInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async () => {
    if (!file || !title.trim()) { setError('Completa título y selecciona archivo'); return; }
    setUploading(true); setProgress(0); setError('');
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/${Date.now()}.${fileExt}`;
      const { data: fileData, error: uploadError } = await supabase.storage.from('tv_content').upload(fileName, file);
      if (uploadError) throw uploadError;
      let thumbnailUrl = '';
      if (thumbnail) {
        const thumbName = `${userId}/${Date.now()}_thumb.${thumbnail.name.split('.').pop()}`;
        const { data: thumbData } = await supabase.storage.from('tv_thumbs').upload(thumbName, thumbnail);
        if (thumbData) { const { data: urlData } = supabase.storage.from('tv_thumbs').getPublicUrl(thumbName); thumbnailUrl = urlData.publicUrl; }
      }
      const { data: content, error: dbError } = await supabase.from('tv_content').insert({
        user_id: userId, type, title, description, url: fileData?.path || '',
        thumbnail_url: thumbnailUrl, tags: tags.split(',').map(t=>t.trim()).filter(Boolean), status: 'published'
      }).select().single();
      if (dbError) throw dbError;
      setProgress(100); onUploadComplete?.(content); resetForm();
    } catch (err) { setError('Error al subir. Intenta de nuevo.'); }
    finally { setUploading(false); }
  };

  const resetForm = () => { setTitle(''); setDescription(''); setTags(''); setFile(null); setThumbnail(null); setProgress(0); setError(''); };


  return (
    <div className="bg-gradient-to-br from-black to-purple-900/20 p-6 rounded-2xl border-2 border-c8l-gold shadow-[0_0_30px_rgba(212,175,55,0.3)]">
      <h2 className="text-2xl font-black text-c8l-gold mb-4">📤 Subir Contenido</h2>
      <div className="flex gap-2 mb-4">
        {[{id:'cover',label:'🎤 Cover'},{id:'video',label:'🎬 Video'},{id:'live',label:'🔴 Live'}].map(t=>(
          <button key={t.id} onClick={()=>setType(t.id as any)} className={`px-4 py-2 rounded-lg font-bold transition ${type===t.id?'bg-c8l-gold text-black':'bg-gray-800 text-gray-400'}`}>{t.label}</button>
        ))}
      </div>
      <div className="space-y-4">
        <div><label className="text-sm text-gray-400">Título *</label><input type="text" value={title} onChange={e=>setTitle(e.target.value)} placeholder="Ej: Mi cover de Bohemian Rhapsody" className="w-full bg-black/50 border border-gray-700 rounded-lg px-4 py-2 text-white" /></div>
        <div><label className="text-sm text-gray-400">Descripción</label><textarea value={description} onChange={e=>setDescription(e.target.value)} placeholder="Cuéntanos..." rows={3} className="w-full bg-black/50 border border-gray-700 rounded-lg px-4 py-2 text-white resize-none" /></div>
        <div><label className="text-sm text-gray-400">Tags (separados por comas)</label><input type="text" value={tags} onChange={e=>setTags(e.target.value)} placeholder="pop, cover, flamenco" className="w-full bg-black/50 border border-gray-700 rounded-lg px-4 py-2 text-white" /></div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="text-sm text-gray-400">Archivo *</label>
            <div className="border-2 border-dashed border-gray-700 rounded-lg p-4 text-center cursor-pointer hover:border-c8l-gold transition" onClick={()=>fileInputRef.current?.click()}>
              <input ref={fileInputRef} type="file" accept={type==='cover'?'audio/*':'video/*'} onChange={e=>setFile(e.target.files?.[0]||null)} className="hidden" />
              {file ? <div className="text-c8l-gold">{file.name}</div> : <div className="text-gray-500">{type==='cover'?'🎵 Selecciona audio':'🎬 Selecciona video'}</div>}
            </div>
          </div>
          <div><label className="text-sm text-gray-400">Miniatura</label>
            <div className="border-2 border-dashed border-gray-700 rounded-lg p-4 text-center cursor-pointer hover:border-c8l-gold transition" onClick={()=>thumbInputRef.current?.click()}>
              <input ref={thumbInputRef} type="file" accept="image/*" onChange={e=>setThumbnail(e.target.files?.[0]||null)} className="hidden" />
              {thumbnail ? <div className="text-c8l-gold">{thumbnail.name}</div> : <div className="text-gray-500">🖼️ Selecciona imagen</div>}
            </div>
          </div>
        </div>
        {error && <div className="bg-red-600/20 border border-red-600 p-2 rounded text-red-400 text-sm">{error}</div>}
        {uploading && (<div><div className="flex justify-between text-xs text-gray-400 mb-1"><span>Subiendo...</span><span>{progress}%</span></div><div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-c8l-gold to-c8l-pink transition-all" style={{width:`${progress}%`}} /></div></div>)}
        <button onClick={handleUpload} disabled={uploading||!file||!title.trim()} className="w-full py-3 bg-gradient-to-r from-c8l-purple to-c8l-pink rounded-xl font-bold text-white text-lg hover:scale-105 disabled:opacity-50 transition">{uploading?'⏳ Subiendo...':'📤 Subir a C8L TV'}</button>
      </div>
    </div>
  );
}
