// components/recorder/VideoRecorder.tsx
'use client';
import { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export function VideoRecorder() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    // Iniciar la cámara al cargar el componente
    startCamera();
    return () => {
      // Limpiar al desmontar: detener pistas de la cámara
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      drawCanvas(); // Llamamos a la función para dibujar en el canvas
    } catch (err) {
      console.error("Error al acceder a la cámara:", err);
    }
  };

  const drawCanvas = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    // Ajustar tamaño del canvas al del vídeo
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const draw = () => {
      if (!ctx || !video) return;
      // Limpiar canvas y dibujar el fotograma actual del vídeo
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      // ¡Aquí empieza la magia de los efectos!
      // Podemos añadir filtros, texto o gráficos directamente en el canvas.
      // Por ejemplo, un texto simple en el centro:
      ctx.font = "Bold 40px 'Space Grotesk'";
      ctx.fillStyle = "#D4AF37";
      ctx.shadowBlur = 10;
      ctx.shadowColor = "black";
      ctx.fillText("C8L LIVE", 50, 100);
      // Un emoji de micrófono en la esquina
      ctx.font = "50px Arial";
      ctx.fillStyle = "white";
      ctx.fillText("🎤", canvas.width - 80, 80);
      // Llamamos a la siguiente animación
      requestAnimationFrame(draw);
    };
    draw();
  };

  const startRecording = () => {
    if (!canvasRef.current) return;
    // Capturamos el stream del canvas, que ya tiene los efectos aplicados
    const canvasStream = canvasRef.current.captureStream(30); // 30 fps
    // También capturamos el audio del micrófono por separado
    if (!streamRef.current) return;
    const audioTrack = streamRef.current.getAudioTracks()[0];
    if (audioTrack) {
      canvasStream.addTrack(audioTrack);
    }

    mediaRecorderRef.current = new MediaRecorder(canvasStream, { mimeType: 'video/webm' });
    mediaRecorderRef.current.ondataavailable = (event) => {
      if (event.data.size > 0) {
        setRecordedChunks(prev => [...prev, event.data]);
      }
    };
    mediaRecorderRef.current.start();
    setIsRecording(true);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const downloadVideo = () => {
    if (recordedChunks.length === 0) return;
    const blob = new Blob(recordedChunks, { type: 'video/webm' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'c8l-recording.webm';
    a.click();
    URL.revokeObjectURL(url);
    setRecordedChunks([]);
  };

  return (
    <div className="p-4 bg-black border-2 border-[#D4AF37] rounded-lg">
      <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden">
        {/* El video oculto sirve como fuente para el canvas */}
        <video ref={videoRef} autoPlay muted playsInline className="hidden" />
        {/* El canvas es lo que el usuario ve y lo que se graba */}
        <canvas ref={canvasRef} className="w-full h-full object-cover" />
        {isRecording && (
          <div className="absolute top-2 right-2 bg-red-600 text-white text-xs px-2 py-1 rounded-full animate-pulse">
            🔴 GRABANDO
          </div>
        )}
      </div>
      <div className="flex justify-center gap-4 mt-4">
        <button
          onClick={startRecording}
          disabled={isRecording}
          className="px-4 py-2 bg-[#D4AF37] text-black font-black rounded disabled:opacity-50"
        >
          Comenzar Grabación
        </button>
        <button
          onClick={stopRecording}
          disabled={!isRecording}
          className="px-4 py-2 bg-red-600 text-white font-black rounded disabled:opacity-50"
        >
          Detener
        </button>
        <button
          onClick={downloadVideo}
          disabled={recordedChunks.length === 0}
          className="px-4 py-2 bg-[#00F3FF] text-black font-black rounded disabled:opacity-50"
        >
          Descargar Vídeo
        </button>
      </div>
    </div>
  );
}