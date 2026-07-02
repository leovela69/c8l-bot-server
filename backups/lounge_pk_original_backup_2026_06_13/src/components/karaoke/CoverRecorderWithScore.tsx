// components/karaoke/CoverRecorderWithScore.tsx
'use client';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Play, Square, Upload, TrendingUp, Award, Star, Zap } from 'lucide-react';

interface ScoreDisplay {
  total: number;
  pitchAccuracy: number;
  rhythmAccuracy: number;
  stability: number;
  energy: number;
  feedback: string[];
  badge: string;
}

export function CoverRecorderWithScore({ trackId, instrumentalUrl, onCoverUploaded }: { 
  trackId: string; 
  instrumentalUrl: string; 
  onCoverUploaded: () => void;
}) {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [score, setScore] = useState<ScoreDisplay | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [realTimeVolume, setRealTimeVolume] = useState(0);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const instrumentalRef = useRef<HTMLAudioElement | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const animationRef = useRef<number | null>(null);
  
  // Visualización en tiempo real del volumen (micrófono)
  const updateVolume = () => {
    if (!analyserRef.current) return;
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteTimeDomainData(dataArray);
    let maxSample = 0;
    for (let i = 0; i < dataArray.length; i++) {
      const v = Math.abs((dataArray[i] - 128) / 128);
      if (v > maxSample) maxSample = v;
    }
    setRealTimeVolume(maxSample * 100);
    animationRef.current = requestAnimationFrame(updateVolume);
  };
  
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      const microphone = audioContextRef.current.createMediaStreamSource(stream);
      microphone.connect(analyserRef.current);
      
      // Cargar instrumental
      const response = await fetch(instrumentalUrl);
      const instrumentalBuffer = await response.arrayBuffer();
      const audioBuffer = await audioContextRef.current.decodeAudioData(instrumentalBuffer);
      const instrumentalSource = audioContextRef.current.createBufferSource();
      instrumentalSource.buffer = audioBuffer;
      
      const destination = audioContextRef.current.createMediaStreamDestination();
      microphone.connect(destination);
      instrumentalSource.connect(destination);
      
      mediaRecorderRef.current = new MediaRecorder(destination.stream);
      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/mpeg' });
        setAudioBlob(blob);
        chunksRef.current = [];
        if (animationRef.current) cancelAnimationFrame(animationRef.current);
        setRealTimeVolume(0);
      };
      
      mediaRecorderRef.current.start();
      instrumentalSource.start();
      setIsRecording(true);
      updateVolume();
      
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
    
    setIsUploading(true);
    const formData = new FormData();
    formData.append('cover', audioBlob, `cover_${trackId}.mp3`);
    formData.append('trackId', trackId);
    formData.append('userId', 'current-user-id'); // En producción, tomar del contexto
    
    try {
      const response = await fetch('/api/karaoke/evaluate-cover', {
        method: 'POST',
        body: formData
      });
      
      const data = await response.json();
      if (data.success) {
        setScore(data.score);
        alert(`🎤 ${data.message}`);
        setTimeout(() => onCoverUploaded(), 2000);
      } else {
        alert(data.error);
      }
    } catch (error) {
      alert('Error al subir el cover');
    } finally {
      setIsUploading(false);
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
        <Mic /> GRABAR Y EVALUAR TU VOZ
      </h3>
      
      {/* Visualizador de volumen en tiempo real */}
      <div className="mb-4">
        <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-[#00F3FF] to-[#D4AF37] transition-all duration-75"
            style={{ width: `${realTimeVolume}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-gray-500 mt-1">
          <span>🔇 Silencio</span>
          <span>🎤 Óptimo</span>
          <span>🔊 Fuerte</span>
        </div>
      </div>
      
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
            <Mic /> GRABAR (50 COINS)
          </button>
        ) : (
          <button
            onClick={stopRecording}
            className="flex items-center gap-2 px-6 py-3 bg-gray-600 text-white font-black border-2 border-black"
          >
            <Square /> DETENER ({formatTime(recordingTime)})
          </button>
        )}
        
        {audioBlob && !isRecording && (
          <button
            onClick={uploadCover}
            disabled={isUploading}
            className="flex items-center gap-2 px-6 py-3 bg-[#D4AF37] text-black font-black border-2 border-black disabled:opacity-50"
          >
            <Upload /> {isUploading ? 'EVALUANDO...' : 'SUBIR Y EVALUAR'}
          </button>
        )}
      </div>
      
      {/* Vista previa del cover grabado */}
      {audioBlob && (
        <div className="mt-4 p-3 bg-gray-900 rounded">
          <div className="text-sm text-green-400 mb-2">✅ Cover grabado. ¡Sube para obtener tu puntuación!</div>
          <audio src={URL.createObjectURL(audioBlob)} controls className="w-full" />
        </div>
      )}
      
      {/* Resultado de la evaluación */}
      <AnimatePresence>
        {score && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 border-2 border-[#D4AF37] bg-gradient-to-br from-gray-900 to-black p-4"
          >
            <div className="text-center mb-4">
              <div className="text-5xl font-black text-[#D4AF37]">{score.total}</div>
              <div className="text-sm text-gray-400">PUNTUACIÓN TOTAL / 100</div>
              <div className="mt-2 inline-block px-4 py-1 bg-[#D4AF37]/20 border border-[#D4AF37] rounded-full text-[#D4AF37] font-bold text-sm">
                {score.badge}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-black p-2 text-center">
                <div className="text-xs text-gray-500">🎯 Afinación</div>
                <div className="text-xl font-bold text-[#00F3FF]">{score.pitchAccuracy}%</div>
              </div>
              <div className="bg-black p-2 text-center">
                <div className="text-xs text-gray-500">🥁 Ritmo</div>
                <div className="text-xl font-bold text-[#D4AF37]">{score.rhythmAccuracy}%</div>
              </div>
              <div className="bg-black p-2 text-center">
                <div className="text-xs text-gray-500">🎤 Estabilidad</div>
                <div className="text-xl font-bold text-[#FF0055]">{score.stability}%</div>
              </div>
              <div className="bg-black p-2 text-center">
                <div className="text-xs text-gray-500">⚡ Energía</div>
                <div className="text-xl font-bold text-[#9B59B6]">{score.energy}%</div>
              </div>
            </div>
            
            <div className="space-y-1 mb-4">
              {score.feedback.map((fb, i) => (
                <div key={i} className="text-sm text-gray-300">• {fb}</div>
              ))}
            </div>
            
            <div className="text-center text-green-400 font-bold">
              🎁 Recompensa: {score.total >= 90 ? '500' : score.total >= 70 ? '200' : score.total >= 50 ? '50' : '10'} COINS
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}