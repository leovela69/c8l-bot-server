// components/live/LiveStreamPlayer.tsx
'use client';
import { useEffect, useRef } from 'react';
import { Room, RoomEvent } from 'livekit-client';

interface LiveStreamPlayerProps {
  streamName: string;
  token: string;
}

export function LiveStreamPlayer({ streamName, token }: LiveStreamPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const roomRef = useRef<Room | null>(null);

  useEffect(() => {
    const connect = async () => {
      const room = new Room();
      roomRef.current = room;
      await room.connect('wss://your-livekit-server.com', token);
      await room.localParticipant.setCameraEnabled(false);
      await room.localParticipant.setMicrophoneEnabled(false);
      room.on(RoomEvent.TrackSubscribed, (track: any, publication: any, participant: any) => {
        if (track.kind === 'video' && videoRef.current) {
          const mediaStream = new MediaStream();
          mediaStream.addTrack(track.mediaStreamTrack);
          videoRef.current.srcObject = mediaStream;
          videoRef.current.play();
        }
      });
    };
    connect();
    return () => { roomRef.current?.disconnect(); };
  }, [streamName, token]);

  return <video ref={videoRef} autoPlay muted className="w-full" />;
}