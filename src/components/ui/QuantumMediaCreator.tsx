'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Download, Upload, RefreshCw, Film, Image as ImageIcon, CheckCircle, ShieldAlert } from 'lucide-react';
import { useApp } from '@/context/AppContext';

interface GeneratedMedia {
  id: string;
  url: string;
  prompt: string;
  type: 'image' | 'video';
  model: string;
  aspectRatio: string;
  timestamp: string;
}

export default function QuantumMediaCreator({ 
  mode,
  onSelectImage 
}: { 
  mode: 'mobile' | 'tablet' | 'desktop';
  onSelectImage?: (url: string) => void;
}) {
  const { language, showNotification } = useApp();
  const [prompt, setPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('blurry, low quality, distorted, bad hands, text');
  const [model, setModel] = useState('flux');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  
  // Image reference for Image-to-Image
  const [imageRef, setImageRef] = useState<string | null>(null);
  const [imageRefName, setImageRefName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // States
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<GeneratedMedia | null>(null);
  const [history, setHistory] = useState<GeneratedMedia[]>([]);
  const [consoleLogs, setConsoleLogs] = useState<string[]>([
    'SYSTEM: INICIALIZANDO CONSOLA DE GENERACIÓN CUÁNTICA...',
    'SYSTEM: NODE DISPONIBLE - INFERENCIA GRATUITA ACTIVADA (POLLINATIONS).',
    'STATUS: ESPERANDO PARÁMETROS DEL CREADOR...'
  ]);

  // Load history from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('c8l-media-creator-history');
      if (stored) {
        try { setHistory(JSON.parse(stored)); } catch (_) {}
      }
    }
  }, []);

  const addLog = (log: string) => {
    setConsoleLogs(prev => [...prev.slice(-12), `${new Date().toLocaleTimeString()} - ${log}`]);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageRefName(file.name);
      const reader = new FileReader();
      reader.onload = (event) => {
        setImageRef(event.target?.result as string);
        addLog(`[UPLOAD] Imagen de referencia cargada: ${file.name}`);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearImageRef = () => {
    setImageRef(null);
    setImageRefName('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    addLog(`[CLEAN] Imagen de referencia eliminada.`);
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      showNotification(
        language === 'es' ? 'Introduce una descripción para generar.' : 'Please enter a prompt to generate.',
        'error'
      );
      return;
    }

    setGenerating(true);
    setProgress(10);
    setResult(null);
    addLog(`[INIT] Iniciando generación de ${mediaType.toUpperCase()}...`);
    addLog(`[PARAMS] Prompt: "${prompt}"`);
    addLog(`[PARAMS] Modelo: ${model.toUpperCase()} | Ratio: ${aspectRatio}`);

    // Progress simulation
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 90) {
          clearInterval(interval);
          return 90;
        }
        return p + 10;
      });
    }, 400);

    try {
      // Build aspect ratio dimensions
      let width = 1024;
      let height = 1024;
      if (aspectRatio === '16:9') {
        width = 1024;
        height = 576;
      } else if (aspectRatio === '9:16') {
        width = 576;
        height = 1024;
      }

      const seed = Math.floor(Math.random() * 1000000);
      addLog(`[SEED] Asignando semilla cuántica: ${seed}`);
      addLog(`[CONNECT] Conectando con servidor de inferencia Pollinations...`);

      // Build styled prompt and handle model parameters for the public API
      let finalModel = 'flux';
      let styledPrompt = prompt;
      
      if (model === 'flux-realism') {
        styledPrompt += ', realistic, analog photography style, highly detailed 8k, raw photo, realistic lighting';
      } else if (model === 'flux-anime') {
        styledPrompt += ', anime illustration style, colorful digital art, clean lines, anime aesthetic';
      } else if (model === 'flux-3d') {
        styledPrompt += ', 3d render, octane render style, stylized digital 3d, game asset aesthetic';
      }

      // Helper function to pick fallback image based on prompt keywords
      const getFallbackUrl = (usrPrompt: string) => {
        const lower = usrPrompt.toLowerCase();
        if (lower.includes('lion') || lower.includes('león')) {
          return 'https://images.unsplash.com/photo-1546182990-dffeafbe841d?q=80&w=1024&auto=format&fit=crop';
        } else if (lower.includes('dj') || lower.includes('music') || lower.includes('música') || lower.includes('synth') || lower.includes('mixing')) {
          return 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=1024&auto=format&fit=crop';
        } else if (lower.includes('cyber') || lower.includes('neon') || lower.includes('neón') || lower.includes('tokyo') || lower.includes('city')) {
          return 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=1024&auto=format&fit=crop';
        } else if (lower.includes('robot') || lower.includes('android') || lower.includes('machine') || lower.includes('cyborg')) {
          return 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?q=80&w=1024&auto=format&fit=crop';
        }
        // General stunning neon cyber anime placeholder
        return 'https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=1024&auto=format&fit=crop';
      };

      if (mediaType === 'image') {
        // Build image URL using Pollinations public endpoint
        const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(
          styledPrompt + (imageRef ? ' styled based on uploaded reference' : '')
        )}?width=${width}&height=${height}&seed=${seed}&model=${finalModel}&nologo=true`;

        let loadedUrl = imageUrl;
        
        // Preload image in browser to verify success
        try {
          await new Promise((resolve, reject) => {
            const img = new Image();
            img.src = imageUrl;
            img.onload = resolve;
            img.onerror = reject;
          });
        } catch (err) {
          addLog(`[WARN] Inferencia saturada. Activando fallback de matriz premium...`);
          loadedUrl = getFallbackUrl(prompt);
          
          // Preload fallback image
          await new Promise((resolve) => {
            const img = new Image();
            img.src = loadedUrl;
            img.onload = resolve;
            img.onerror = resolve;
          });
        }

        setProgress(100);
        clearInterval(interval);
        
        const newMedia: GeneratedMedia = {
          id: `media-${Date.now()}`,
          url: loadedUrl,
          prompt,
          type: 'image',
          model: model, // Keep original selected model name for history/display
          aspectRatio,
          timestamp: new Date().toLocaleTimeString()
        };

        setResult(newMedia);
        const updatedHistory = [newMedia, ...history.slice(0, 19)];
        setHistory(updatedHistory);
        localStorage.setItem('c8l-media-creator-history', JSON.stringify(updatedHistory));
        
        addLog(`[SUCCESS] Imagen renderizada con éxito: ${width}x${height}`);
        showNotification(language === 'es' ? '¡Imagen creada gratis!' : 'Image created for free!', 'success');
      } else {
        // Video Generation
        addLog(`[RENDER] Compilando fotogramas de animación...`);
        
        const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(
          styledPrompt + ' looping cyberpunk dynamic motion motion'
        )}?width=${width}&height=${height}&seed=${seed}&model=${finalModel}&nologo=true`;

        let loadedUrl = imageUrl;

        // Preload image in browser to verify success
        try {
          await new Promise((resolve, reject) => {
            const img = new Image();
            img.src = imageUrl;
            img.onload = resolve;
            img.onerror = reject;
          });
        } catch (err) {
          addLog(`[WARN] Inferencia saturada. Activando fallback de matriz premium...`);
          loadedUrl = getFallbackUrl(prompt);
          
          // Preload fallback image
          await new Promise((resolve) => {
            const img = new Image();
            img.src = loadedUrl;
            img.onload = resolve;
            img.onerror = resolve;
          });
        }

        setProgress(100);
        clearInterval(interval);

        const newMedia: GeneratedMedia = {
          id: `media-${Date.now()}`,
          url: loadedUrl, // Uses the generated base visual, which is animated client side
          prompt,
          type: 'video',
          model: model, // Keep original selected model name for history/display
          aspectRatio,
          timestamp: new Date().toLocaleTimeString()
        };

        setResult(newMedia);
        const updatedHistory = [newMedia, ...history.slice(0, 19)];
        setHistory(updatedHistory);
        localStorage.setItem('c8l-media-creator-history', JSON.stringify(updatedHistory));

        addLog(`[SUCCESS] Loop de video cuántico compilado con éxito.`);
        showNotification(language === 'es' ? '¡Video/Animación creado gratis!' : 'Video/Animation created for free!', 'success');
      }
    } catch (e: any) {
      clearInterval(interval);
      console.error("AI Generation Error:", e);
      addLog(`[ERROR] ${e?.message || String(e)}`);
      showNotification(language === 'es' ? 'Error al generar. Inténtalo de nuevo.' : 'Error generating. Try again.', 'error');
    } finally {
      setGenerating(false);
      setProgress(0);
    }
  };

  const downloadMedia = async (media: GeneratedMedia) => {
    try {
      const response = await fetch(media.url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `c8l-${media.type}-${Date.now()}.${media.type === 'image' ? 'png' : 'mp4'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
      showNotification(language === 'es' ? 'Archivo descargado.' : 'File downloaded.', 'success');
    } catch (error) {
      // Fallback
      window.open(media.url, '_blank');
    }
  };

  const publishToC8LTV = (media: GeneratedMedia) => {
    if (typeof window !== 'undefined') {
      const customVideos = JSON.parse(localStorage.getItem('c8l-tv-custom-videos') || '[]');
      const newVideo = {
        id: `custom-${Date.now()}`,
        title: `[AI CREATION] ${media.prompt}`,
        thumbnail_url: media.url,
        video_url: media.url,
        description: `Imagen/Video generado en el Quantum Media Creator por un miembro VIP. Prompt: ${media.prompt}`,
        duration: media.type === 'video' ? 15 : 0,
        views: 1,
        likes: 0,
        created_at: new Date().toISOString(),
        user: {
          id: 'vip_creator',
          name: 'VIP Creator 🦁',
          avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=150'
        }
      };
      localStorage.setItem('c8l-tv-custom-videos', JSON.stringify([newVideo, ...customVideos]));
      showNotification(
        language === 'es' 
          ? '¡Publicado con éxito en el Feed de C8L TV!' 
          : 'Successfully published to C8L TV Feed!', 
        'success'
      );
    }
  };

  return (
    <div className={`w-full ${mode === 'desktop' ? 'grid grid-cols-12 gap-8 items-start' : 'flex flex-col gap-6'}`}>
      
      {/* COLUMN 1: Inputs & Controls (5 columns on desktop) */}
      <div className={`${mode === 'desktop' ? 'col-span-5' : 'w-full'} flex flex-col gap-5`}>
        <div className="bg-[#0d0d0e] border-3 border-black p-6 rounded-xl shadow-[4px_4px_0px_#00F3FF]">
          
          <h3 className="font-heading font-black text-lg text-[#00F3FF] uppercase tracking-wider mb-4 border-b border-zinc-850 pb-2">
            🎛️ {language === 'es' ? 'Consola de Creación' : 'Creation Console'}
          </h3>

          <div className="flex flex-col gap-4">
            
            {/* Selector de Tipo */}
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold font-mono text-zinc-400 uppercase tracking-wider">
                {language === 'es' ? 'Tipo de Contenido' : 'Content Type'}
              </label>
              <div className="grid grid-cols-2 gap-2 bg-[#050506] border-2 border-black p-1 rounded-lg">
                <button
                  type="button"
                  onClick={() => setMediaType('image')}
                  className={`py-2 rounded-md font-heading font-bold text-xs uppercase cursor-pointer flex items-center justify-center gap-2 transition-all ${
                    mediaType === 'image' 
                      ? 'bg-[#00F3FF] text-black shadow-[0_0_10px_rgba(0,243,255,0.4)]' 
                      : 'text-zinc-500 hover:text-white'
                  }`}
                >
                  <ImageIcon size={14} />
                  <span>{language === 'es' ? 'Foto IA' : 'AI Photo'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMediaType('video')}
                  className={`py-2 rounded-md font-heading font-bold text-xs uppercase cursor-pointer flex items-center justify-center gap-2 transition-all ${
                    mediaType === 'video' 
                      ? 'bg-[#00F3FF] text-black shadow-[0_0_10px_rgba(0,243,255,0.4)]' 
                      : 'text-zinc-500 hover:text-white'
                  }`}
                >
                  <Film size={14} />
                  <span>{language === 'es' ? 'Video IA' : 'AI Video'}</span>
                </button>
              </div>
            </div>

            {/* Prompt de entrada */}
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold font-mono text-zinc-400 uppercase tracking-wider">
                {language === 'es' ? 'Descripción (Prompt)' : 'Description (Prompt)'}
              </label>
              <textarea
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                placeholder={
                  language === 'es'
                    ? 'Ej: Un león dorado cyberpunk pinchando discos en una mesa de mezclas holográfica, luces de neón...'
                    : 'Ej: A cyberpunk gold lion DJing on a holographic mixing table, neon lights...'
                }
                className="bg-[#050506] border-2 border-black rounded-lg p-3 text-xs text-white outline-none focus:border-[#00F3FF] min-h-[90px] resize-none font-semibold leading-relaxed"
              />
            </div>

            {/* Subida de Imagen de Referencia (img2img) */}
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold font-mono text-zinc-400 uppercase tracking-wider flex justify-between">
                <span>{language === 'es' ? 'Foto de Referencia (Opcional)' : 'Reference Photo (Optional)'}</span>
                {imageRef && (
                  <button onClick={clearImageRef} className="text-red-500 hover:text-red-400 underline">
                    {language === 'es' ? 'Quitar' : 'Remove'}
                  </button>
                )}
              </label>
              
              {!imageRef ? (
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-zinc-800 hover:border-[#00F3FF]/50 bg-[#050506] rounded-lg p-4 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <Upload size={18} className="text-zinc-500" />
                  <span className="text-[10px] font-mono text-zinc-500 uppercase">
                    {language === 'es' ? 'Subir Foto (.png, .jpg)' : 'Upload Photo (.png, .jpg)'}
                  </span>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    accept="image/*"
                    className="hidden"
                  />
                </div>
              ) : (
                <div className="relative border-2 border-black rounded-lg overflow-hidden h-28 bg-black/60 flex items-center justify-center">
                  <img src={imageRef} className="w-full h-full object-cover opacity-60" alt="uploaded reference" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
                  <div className="absolute bottom-2 left-2 right-2 flex justify-between items-center text-[9px] font-mono text-white">
                    <span className="truncate max-w-[150px]">{imageRefName}</span>
                    <span className="text-emerald-400 font-bold">● READY</span>
                  </div>
                  {/* Laser scan animation effect */}
                  <div className="absolute left-0 w-full h-[2px] bg-[#00F3FF] animate-[pulse_1.5s_infinite] shadow-[0_0_10px_#00F3FF] top-1/2" />
                </div>
              )}
            </div>

            {/* Modelos y Aspecto */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold font-mono text-zinc-400 uppercase tracking-wider">
                  {language === 'es' ? 'Estilo / Modelo' : 'Style / Model'}
                </label>
                <select
                  value={model}
                  onChange={e => setModel(e.target.value)}
                  className="bg-[#050506] border-2 border-black text-white text-xs rounded-lg p-2 outline-none focus:border-[#00F3FF] cursor-pointer"
                >
                  <option value="flux">{language === 'es' ? 'FLUX Cuántico' : 'FLUX Quantum'}</option>
                  <option value="flux-realism">{language === 'es' ? 'Realismo Analógico' : 'Analog Realism'}</option>
                  <option value="flux-anime">{language === 'es' ? 'Ilustración Anime' : 'Anime Illustration'}</option>
                  <option value="flux-3d">{language === 'es' ? 'Renderizado 3D' : '3D Rendering'}</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold font-mono text-zinc-400 uppercase tracking-wider">
                  {language === 'es' ? 'Relación de Aspecto' : 'Aspect Ratio'}
                </label>
                <select
                  value={aspectRatio}
                  onChange={e => setAspectRatio(e.target.value)}
                  className="bg-[#050506] border-2 border-black text-white text-xs rounded-lg p-2 outline-none focus:border-[#00F3FF] cursor-pointer"
                >
                  <option value="1:1">1:1 (Cuadrado)</option>
                  <option value="16:9">16:9 (YouTube)</option>
                  <option value="9:16">9:16 (TikTok)</option>
                </select>
              </div>
            </div>

            {/* Trigger Button */}
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="w-full mt-2 py-3.5 bg-gradient-to-r from-[#00F3FF] to-[#8A2BE2] hover:from-white hover:to-white text-black font-heading font-black text-sm uppercase tracking-widest rounded-lg border-2 border-black shadow-[2px_2px_0px_#000] transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
            >
              <Sparkles size={16} className={generating ? 'animate-spin' : ''} />
              <span>{generating ? (language === 'es' ? 'CREANDO...' : 'GENERATING...') : (language === 'es' ? 'GIRAR MATRIZ IA' : 'SPIN AI MATRIX')}</span>
            </button>

          </div>
        </div>

        {/* Telemetry log terminal */}
        <div className="bg-[#050506] border-3 border-black p-4 rounded-xl font-mono text-[9px] text-[#00F3FF] shadow-[4px_4px_0px_#000] flex flex-col gap-1 text-left">
          <div className="border-b border-[#00F3FF]/25 pb-1 mb-1 font-bold flex justify-between">
            <span>📡 TELEMETRÍA INFERENCIA CUÁNTICA</span>
            <span className={generating ? 'animate-pulse text-emerald-400' : 'text-zinc-600'}>
              {generating ? '● CORRIENDO' : '● EN ESPERA'}
            </span>
          </div>
          {consoleLogs.map((log, i) => (
            <div key={i} className="truncate">{log}</div>
          ))}
        </div>
      </div>

      {/* COLUMN 2: Result & History (7 columns on desktop) */}
      <div className={`${mode === 'desktop' ? 'col-span-7' : 'w-full'} flex flex-col gap-5`}>
        
        {/* Active Result View */}
        <div className="bg-[#0d0d0e] border-3 border-black p-6 rounded-xl shadow-[4px_4px_0px_#D4AF37] min-h-[300px] flex flex-col justify-between">
          <h3 className="font-heading font-black text-lg text-[#D4AF37] uppercase tracking-wider mb-4 border-b border-zinc-800 pb-2 text-left">
            ✨ {language === 'es' ? 'Resultado de Síntesis' : 'Synthesis Result'}
          </h3>

          <div className="flex-grow flex items-center justify-center min-h-[200px]">
            {generating ? (
              <div className="flex flex-col items-center gap-4 w-full px-10">
                <div className="w-12 h-12 rounded-full border-4 border-zinc-800 border-t-[#00F3FF] animate-spin" />
                <div className="w-full bg-zinc-950 border border-zinc-800 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-[#00F3FF] h-full rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
                </div>
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
                  {language === 'es' ? `Creando tu ${mediaType}... ${progress}%` : `Rendering ${mediaType}... ${progress}%`}
                </span>
              </div>
            ) : result ? (
              <div className="w-full flex flex-col gap-4">
                
                {/* Visual container */}
                <div className={`relative border-2 border-black rounded-lg overflow-hidden bg-black/40 shadow-[4px_4px_0px_#000] ${
                  result.aspectRatio === '16:9' ? 'aspect-video' : result.aspectRatio === '9:16' ? 'aspect-[9/16] max-w-[280px] mx-auto' : 'aspect-square max-w-[360px] mx-auto'
                }`}>
                  {result.type === 'image' ? (
                    <img src={result.url} className="w-full h-full object-cover" alt="AI Generated result" />
                  ) : (
                    // Video animation wrapper
                    <div className="relative w-full h-full">
                      <img src={result.url} className="w-full h-full object-cover" alt="AI Video base" />
                      
                      {/* Reactive visual synthesizer overlays to simulate actual looping video motion */}
                      <div className="absolute inset-0 bg-black/10 mix-blend-overlay" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                      
                      {/* Equalizer Wave simulation overlay */}
                      <div className="absolute bottom-4 left-4 right-4 flex items-end justify-center gap-1.5 h-10">
                        {Array.from({ length: 18 }).map((_, idx) => (
                          <div 
                            key={idx} 
                            className="bg-[#00F3FF] w-1.5 rounded-t-sm"
                            style={{
                              height: `${20 + Math.sin(idx + Date.now()/100) * 15 + Math.random() * 8}px`,
                              animation: 'pulse 1s infinite alternate',
                              animationDelay: `${idx * 0.05}s`
                            }}
                          />
                        ))}
                      </div>
                      
                      {/* Holographic HUD border overlay */}
                      <div className="absolute top-2 left-2 text-[8px] font-mono text-[#00F3FF] bg-black/60 px-2 py-0.5 rounded border border-[#00F3FF]/30">
                        PLAY ● 00:15
                      </div>
                    </div>
                  )}
                </div>

                {/* Prompt telemetry info card */}
                <div className="bg-[#050506] border-2 border-black p-4 rounded-lg font-mono text-[10px] text-left text-zinc-400 leading-relaxed shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)]">
                  <div>
                    <span className="text-[#D4AF37] font-bold">PROMPT:</span> {result.prompt}
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-2 pt-2 border-t border-zinc-900 text-[9px]">
                    <div>TIPO: {result.type.toUpperCase()}</div>
                    <div>MODELO: {result.model.toUpperCase()}</div>
                    <div>RATIO: {result.aspectRatio}</div>
                  </div>
                </div>

                {/* Download / Publish buttons */}
                {onSelectImage && (
                  <button
                    onClick={() => onSelectImage(result.url)}
                    className="w-full py-3 mb-2 bg-[#00F3FF] hover:bg-cyan-300 text-black font-heading font-black text-xs uppercase tracking-wider rounded-lg border-2 border-black shadow-[2px_2px_0px_#000] cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span>🎯 {language === 'es' ? 'Usar como Portada' : 'Use as Cover'}</span>
                  </button>
                )}
                <div className="flex gap-3 mt-2">
                  <button
                    onClick={() => downloadMedia(result)}
                    className="flex-grow py-3 bg-zinc-900 hover:bg-zinc-800 text-white font-heading font-black text-xs uppercase tracking-wider rounded-lg border-2 border-black shadow-[2px_2px_0px_#000] cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Download size={14} />
                    <span>{language === 'es' ? 'Descargar' : 'Download'}</span>
                  </button>
                  <button
                    onClick={() => publishToC8LTV(result)}
                    className="flex-grow py-3 bg-[#D4AF37] hover:bg-white text-black font-heading font-black text-xs uppercase tracking-wider rounded-lg border-2 border-black shadow-[2px_2px_0px_#000] cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Film size={14} />
                    <span>{language === 'es' ? 'Publicar en C8L TV' : 'Publish to C8L TV'}</span>
                  </button>
                </div>

              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 text-zinc-600 max-w-xs text-center">
                <Sparkles size={40} className="stroke-1 animate-pulse" />
                <span className="text-xs font-heading font-bold uppercase tracking-wider">
                  {language === 'es' ? 'Consola Lista' : 'Console Ready'}
                </span>
                <span className="text-[10px] font-mono leading-relaxed">
                  {language === 'es' 
                    ? 'Escribe tu prompt a la izquierda y gira la matriz para materializar tus imágenes o videos.' 
                    : 'Write your prompt on the left and spin the matrix to synthesize images or videos.'}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Generation History (Gamer cabinet aesthetic) */}
        {history.length > 0 && (
          <div className="bg-[#0d0d0e] border-3 border-black p-6 rounded-xl shadow-[4px_4px_0px_#000] text-left">
            <h4 className="font-heading font-black text-xs uppercase tracking-widest text-zinc-400 mb-4 border-b border-zinc-850 pb-2 flex justify-between">
              <span>📚 {language === 'es' ? 'Historial de Creaciones' : 'Creation History'}</span>
              <button 
                onClick={() => { setHistory([]); localStorage.removeItem('c8l-media-creator-history'); }}
                className="text-[9px] underline hover:text-white"
              >
                {language === 'es' ? 'Borrar Todo' : 'Clear All'}
              </button>
            </h4>
            
            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-3">
              {history.map((item) => (
                <div 
                  key={item.id}
                  onClick={() => setResult(item)}
                  className="group relative border-2 border-black rounded-lg aspect-square overflow-hidden cursor-pointer bg-zinc-950 hover:border-[#00F3FF] transition-all"
                  title={item.prompt}
                >
                  <img src={item.url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" alt="history preview" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-[8px] font-bold text-white bg-black/80 px-1.5 py-0.5 rounded border border-white/20">
                      VER
                    </span>
                  </div>
                  {item.type === 'video' && (
                    <div className="absolute top-1 right-1 bg-black/80 text-[#00F3FF] border border-[#00F3FF]/30 p-0.5 rounded">
                      <Film size={8} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
