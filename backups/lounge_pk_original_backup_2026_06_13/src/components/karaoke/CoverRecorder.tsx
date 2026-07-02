// components/karaoke/CoverRecorder.tsx
import { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Play, Square, Upload, Save } from 'lucide-react';

interface CoverRecorderProps {
  trackId: string;
  instrumentalUrl: string;
  onCoverUploaded: (coverUrl: string) => void;
}

export function CoverRecorder({ trackId, instrumentalUrl, onCoverUploaded }: CoverRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const instrumentalRef = useRef<HTMLAudioElement | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  
  // Inicializar AudioContext para capturar micrófono + mezclar con instrumental
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      audioContextRef.current = new AudioContext();
      const microphone = audioContextRef.current.createMediaStreamSource(stream);
      
      // Cargar instrumental
      const response = await fetch(instrumentalUrl);
      const instrumentalBuffer = await response.arrayBuffer();
      const audioBuffer = await audioContextRef.current.decodeAudioData(instrumentalBuffer);
      
      // Crear buffer source para el instrumental
      const instrumentalSource = audioContextRef.current.createBufferSource();
      instrumentalSource.buffer = audioBuffer;
      
      // Mezclar micrófono + instrumental
      const destination = audioContextRef.current.createMediaStreamDestination();
      microphone.connect(destination);
      instrumentalSource.connect(destination);
      
      // Grabar la mezcla
      mediaRecorderRef.current = new MediaRecorder(destination.stream);
      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/mpeg' });
        setAudioBlob(blob);
        chunksRef.current = [];
      };
      
      mediaRecorderRef.current.start();
      instrumentalSource.start();
      setIsRecording(true);
      
      // Timer
      const timer = setInterval(() => {
        setRecordingTime(t => t + 1);
      }, 1000);
      
      return () => clearInterval(timer);
    } catch (error) {
      console.error('Error al grabar:', error);
      alert('❌ Permite el acceso al micrófono para grabar');
    }
  };
  
  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    audioContextRef.current?.close();
    setIsRecording(false);
  };
  
  const uploadCover = async () => {
    if (!audioBlob) return;
    
    const formData = new FormData();
    formData.append('cover', audioBlob, `cover_${trackId}.mp3`);
    formData.append('trackId', trackId);
    
    const response = await fetch('/api/karaoke/upload-cover', {
      method: 'POST',
      body: formData
    });
    
    const data = await response.json();
    if (data.success) {
      alert('🎤 ¡Cover subido exitosamente!');
      onCoverUploaded(data.coverUrl);
    }
  };
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  return (
    <div className="border-4 border-[#D4AF37] bg-black p-6">
      <h3 className="text-xl font-black text-[#D4AF37] mb-4 flex items-center gap-2">
        <Mic /> GRABAR TU COVER
      </h3>
      
      {/* Reproductor del instrumental */}
      <div className="mb-4">
        <div className="text-sm text-gray-400 mb-2">Base instrumental:</div>
        <audio ref={instrumentalRef} src={instrumentalUrl} controls className="w-full" />
      </div>
      
      {/* Controles de grabación */}
      <div className="flex gap-3 mb-4">
        {!isRecording ? (
          <button
            onClick={startRecording}
            className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white font-black border-2 border-black hover:bg-red-700"
          >
            <Mic /> GRABAR
          </button>
        ) : (
          <button
            onClick={stopRecording}
            className="flex items-center gap-2 px-6 py-3 bg-gray-600 text-white font-black border-2 border-black"
          >
            <Square /> DETENER ({formatTime(recordingTime)})
          </button>
        )}
        
        {audioBlob && (
          <button
            onClick={uploadCover}
            className="flex items-center gap-2 px-6 py-3 bg-[#D4AF37] text-black font-black border-2 border-black"
          >
            <Upload /> SUBIR COVER
          </button>
        )}
      </div>
      
      {/* Vista previa del cover grabado */}
      {audioBlob && (
        <div className="mt-4 p-3 bg-gray-900 rounded">
          <div className="text-sm text-green-400 mb-2">✅ Cover listo para subir</div>
          <audio src={URL.createObjectURL(audioBlob)} controls className="w-full" />
        </div>
      )}
    </div>
  );
}