// components/recorder/ARVideoRecorder.tsx
'use client';
import { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Mic, MicOff, StopCircle, Download, Upload, Sparkles, Filter, Users } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { FaceDetection } from '@mediapipe/face_detection';
import { Camera as CameraUtils } from '@mediapipe/camera_utils';

interface Effect {
  id: string;
  name: string;
  icon: string;
  type: string;
  settings: {
    image?: string;
    color?: string;
    shader?: string;
  };
}

// Efectos por género
const effectsByGender = {
  male: [
    { id: 'beard', name: 'Barba Cool', icon: '🧔', type: 'filter', settings: { image: '/effects/beard.png' } },
    { id: 'sunglasses', name: 'Lentes Ray-Ban', icon: '🕶️', type: 'overlay', settings: { image: '/effects/sunglasses.png' } },
    { id: 'cap', name: 'Gorra C8L', icon: '🧢', type: 'overlay', settings: { image: '/effects/cap.png' } },
  ],
  female: [
    { id: 'lipstick', name: 'Labios Brillantes', icon: '💄', type: 'filter', settings: { color: '#FF69B4' } },
    { id: 'crown', name: 'Corona de Princesa', icon: '👑', type: 'overlay', settings: { image: '/effects/crown.png' } },
    { id: 'earrings', name: 'Aros Brillantes', icon: '💎', type: 'overlay', settings: { image: '/effects/earrings.png' } },
  ],
  unisex: [
    { id: 'neon', name: 'Neon C8L', icon: '🌈', type: 'filter', settings: { shader: 'neon' } },
    { id: 'glasses', name: 'Gafas AR', icon: '👓', type: 'overlay', settings: { image: '/effects/ar_glasses.png' } },
  ]
};

interface ARVideoRecorderProps {
  userId: string;
  userGender?: 'male' | 'female' | 'unisex';
  onVideoSaved?: (videoUrl: string) => void;
}

export function ARVideoRecorder({ userId, userGender = 'unisex', onVideoSaved }: ARVideoRecorderProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isMicActive, setIsMicActive] = useState(true);
  const [selectedEffect, setSelectedEffect] = useState<Effect | null>(null);
  const [showEffectsPanel, setShowEffectsPanel] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationRef = useRef<number | null>(null);
  const faceDetectionRef = useRef<any>(null);
  const facesRef = useRef<any[]>([]);

  // Inicializar MediaPipe Face Detection
  useEffect(() => {
    if (!isCameraActive) return;
    const faceDetection = new FaceDetection({
      locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_detection/${file}`
    });
    faceDetection.setOptions({
      model: 'short',
      minDetectionConfidence: 0.5
    });
    faceDetection.onResults(onFaceResults);
    faceDetectionRef.current = faceDetection;
    
    const camera = new CameraUtils(videoRef.current, {
      onFrame: async () => {
        if (videoRef.current && faceDetectionRef.current) {
          await faceDetectionRef.current.send({ image: videoRef.current });
        }
      },
      width: 640,
      height: 480
    });
    camera.start();
    return () => camera.stop();
  }, [isCameraActive]);

  const onFaceResults = (results: any) => {
    facesRef.current = results.detections || [];
    drawCanvasWithEffects();
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setIsCameraActive(true);
    } catch (err) {
      console.error(err);
      alert('No se pudo acceder a la cámara');
    }
  };

  const drawCanvasWithEffects = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Dibujar efectos según las caras detectadas
    if (selectedEffect && facesRef.current.length > 0) {
      facesRef.current.forEach(face => {
        const bbox = face.boundingBox;
        if (!bbox) return;
        const centerX = bbox.xCenter * canvas.width;
        const centerY = bbox.yCenter * canvas.height;
        const width = bbox.width * canvas.width;
        const height = bbox.height * canvas.height;
        
        if (selectedEffect.type === 'overlay' && selectedEffect.settings.image) {
          const img = new Image();
          img.src = selectedEffect.settings.image;
          // Escalar según tamaño de la cara
          const effectWidth = width * 1.2;
          const effectHeight = height * 0.8;
          ctx.drawImage(img, centerX - effectWidth/2, centerY - effectHeight/1.5, effectWidth, effectHeight);
        } else if (selectedEffect.type === 'filter' && selectedEffect.settings.color) {
          // Filtro de color en la región de la cara (ej. labios)
          ctx.fillStyle = selectedEffect.settings.color;
          ctx.globalAlpha = 0.6;
          ctx.fillRect(centerX - width/2, centerY - height/3, width, height/4);
          ctx.globalAlpha = 1;
        }
      });
    }
    
    animationRef.current = requestAnimationFrame(drawCanvasWithEffects);
  };

  const startRecording = () => {
    if (!canvasRef.current) return;
    const canvasStream = (canvasRef.current as any).captureStream(30);
    if (streamRef.current && isMicActive) {
      const audioTrack = streamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        canvasStream.addTrack(audioTrack);
      }
    }
    const mediaRecorder = new MediaRecorder(canvasStream);
    mediaRecorder.ondataavailable = (e: BlobEvent) => {
      if (e.data.size > 0) setRecordedChunks(prev => [...prev, e.data]);
    };
    mediaRecorderRef.current = mediaRecorder;
    mediaRecorder.start(1000);
    setIsRecording(true);
    const startTime = Date.now();
    const timer = setInterval(() => setRecordingTime(Math.floor((Date.now() - startTime)/1000)), 1000);
    return () => clearInterval(timer);
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  };

  const downloadVideo = () => {
    const blob = new Blob(recordedChunks, { type: 'video/webm' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `c8l_${Date.now()}.webm`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const uploadToSupabase = async () => {
    try {
      const blob = new Blob(recordedChunks, { type: 'video/webm' });
      const fileExt = 'webm';
      const fileName = `${userId}/${Date.now()}_video.${fileExt}`;
      const { data, error } = await supabase.storage.from('videos').upload(fileName, blob);
      if (error) throw error;
      
      const { data: publicUrlData } = supabase.storage.from('videos').getPublicUrl(fileName);
      const publicUrl = publicUrlData?.publicUrl || '';
      
      if (onVideoSaved) {
        onVideoSaved(publicUrl);
      }
      alert('¡Video subido con éxito!');
    } catch (err: any) {
      console.error(err);
      alert('Error al subir video: ' + err.message);
    }
  };

  const availableEffects = [...effectsByGender.unisex, ...(effectsByGender[userGender as keyof typeof effectsByGender] || [])];

  return (
    <div className="bg-black border-4 border-[#D4AF37] rounded-xl overflow-hidden">
      <div className="relative aspect-video bg-gray-900">
        <video ref={videoRef} autoPlay muted playsInline className="hidden" />
        <canvas ref={canvasRef} className="w-full h-full object-contain" />
        {isRecording && <div className="absolute top-2 right-2 bg-red-600 text-white px-2 py-1 rounded animate-pulse">🔴 {recordingTime}s</div>}
        <AnimatePresence>
          {showEffectsPanel && (
            <motion.div className="absolute bottom-20 left-0 right-0 bg-black/80 p-3 flex gap-2 overflow-x-auto">
              {availableEffects.map(effect => (
                <button key={effect.id} onClick={() => setSelectedEffect(effect)} className={`p-2 rounded ${selectedEffect?.id === effect.id ? 'bg-[#D4AF37] text-black' : 'bg-gray-800'}`}>
                  <span className="text-2xl">{effect.icon}</span>
                  <div className="text-xs">{effect.name}</div>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <div className="p-4 flex gap-2 justify-center">
        {!isCameraActive ? (
          <button onClick={startCamera} className="px-4 py-2 bg-[#00F3FF] text-black font-black rounded">Iniciar Cámara</button>
        ) : (
          <>
            <button onClick={startRecording} disabled={isRecording} className="px-4 py-2 bg-[#D4AF37] text-black rounded disabled:opacity-50">Grabar</button>
            <button onClick={stopRecording} disabled={!isRecording} className="px-4 py-2 bg-red-600 text-white rounded disabled:opacity-50">Detener</button>
            <button onClick={() => setShowEffectsPanel(!showEffectsPanel)} className="p-2 bg-purple-600 rounded"><Sparkles size={20} /></button>
            {recordedChunks.length > 0 && (
              <>
                <button onClick={downloadVideo} className="p-2 bg-gray-700 rounded"><Download size={20} /></button>
                <button onClick={uploadToSupabase} className="px-4 py-2 bg-green-600 rounded">Subir</button>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}