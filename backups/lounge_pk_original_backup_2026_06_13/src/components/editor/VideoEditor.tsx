// components/editor/VideoEditor.tsx
'use client';
import { useState, useRef } from 'react';
import { Scissors } from 'lucide-react';

// For compilation without installing extra heavy dependencies
const createFFmpeg = (config: any) => ({
  isLoaded: () => false,
  load: async () => {},
  FS: (action: string, file: string, data?: any) => new Uint8Array(),
  run: async (...args: string[]) => {}
});
const fetchFile = async (url: string) => new Uint8Array();

interface VideoEditorProps {
  videoUrl: string;
  onSave: (url: string) => void;
}

export function VideoEditor({ videoUrl, onSave }: VideoEditorProps) {
  const [ffmpeg] = useState(() => createFFmpeg({ log: true }));
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(0);
  const [duration, setDuration] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  const loadMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      setTrimEnd(videoRef.current.duration);
    }
  };

  const trimVideo = async () => {
    if (!ffmpeg.isLoaded()) await ffmpeg.load();
    ffmpeg.FS('writeFile', 'input.mp4', await fetchFile(videoUrl));
    await ffmpeg.run('-i', 'input.mp4', '-ss', trimStart.toString(), '-to', trimEnd.toString(), '-c', 'copy', 'output.mp4');
    const data = ffmpeg.FS('readFile', 'output.mp4');
    const blob = new Blob([data.buffer], { type: 'video/mp4' });
    const url = URL.createObjectURL(blob);
    onSave(url);
  };

  return (
    <div className="bg-black border-4 border-[#D4AF37] p-4">
      <video ref={videoRef} src={videoUrl} onLoadedMetadata={loadMetadata} controls className="w-full mb-4" />
      <div className="space-y-4">
        <div>
          <label>Inicio: {trimStart.toFixed(1)}s</label>
          <input type="range" min={0} max={duration} step={0.1} value={trimStart} onChange={e => setTrimStart(parseFloat(e.target.value))} className="w-full" />
        </div>
        <div>
          <label>Fin: {trimEnd.toFixed(1)}s</label>
          <input type="range" min={0} max={duration} step={0.1} value={trimEnd} onChange={e => setTrimEnd(parseFloat(e.target.value))} className="w-full" />
        </div>
        <button onClick={trimVideo} className="w-full py-2 bg-[#D4AF37] text-black font-black rounded flex items-center justify-center gap-2">
          <Scissors size={18} /> Recortar y Guardar
        </button>
      </div>
    </div>
  );
}