// components/live/StudioLive.tsx
'use client';
import { useEffect, useRef, useState } from 'react';
import { Room, RoomEvent, VideoPresets, LocalVideoTrack, createLocalVideoTrack, createLocalAudioTrack } from 'livekit-client';
import { useApp } from '@/context/AppContext';

interface StudioLiveProps {
  streamId: string;
  token: string;
  onClose: () => void;
}

export function StudioLive({ streamId, token, onClose }: StudioLiveProps) {
  const roomRef = useRef<Room | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);
  const { user } = useApp();

  useEffect(() => {
    const connect = async () => {
      const room = new Room();
      roomRef.current = room;

      room.on(RoomEvent.ConnectionStateChanged, (state: any) => {
        console.log('Estado de conexión:', state);
        setIsConnected(state === 'connected');
      });

      room.on(RoomEvent.ParticipantConnected, () => {
        setViewerCount(room.remoteParticipants.size);
      });
      room.on(RoomEvent.ParticipantDisconnected, () => {
        setViewerCount(room.remoteParticipants.size);
      });

      await room.connect(process.env.NEXT_PUBLIC_LIVEKIT_URL!, token);
      
      // Publicar cámara y micrófono
      const tracks = await Promise.all([
        createLocalVideoTrack({ resolution: VideoPresets.h720.resolution }),
        createLocalAudioTrack()
      ]);
      await room.localParticipant.publishTrack(tracks[0]);
      await room.localParticipant.publishTrack(tracks[1]);
      
      if (videoRef.current) {
        videoRef.current.srcObject = new MediaStream([tracks[0].mediaStreamTrack]);
        videoRef.current.play();
      }
    };
    connect();

    return () => {
      roomRef.current?.disconnect();
    };
  }, [token]);

  const stopStream = async () => {
    await fetch('/api/live/end', {
      method: 'POST',
      body: JSON.stringify({ streamId, userId: user?.uid }),
    });
    roomRef.current?.disconnect();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      <div className="flex justify-between p-4 bg-gray-900">
        <h2 className="text-white font-bold">Transmitiendo en vivo</h2>
        <div className="flex gap-4">
          <span className="text-red-500 animate-pulse">🔴 {viewerCount} viendo</span>
          <button onClick={stopStream} className="bg-red-600 px-4 py-2 rounded">Finalizar transmisión</button>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center bg-black">
        <video ref={videoRef} autoPlay muted className="max-h-full w-auto" />
      </div>
      <div className="p-4 bg-gray-900">
        <p className="text-white">Consejo: puedes compartir la URL de tu live con tus seguidores.</p>
      </div>
    </div>
  );
}