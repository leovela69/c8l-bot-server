// components/live/LivePlayer.tsx
'use client';
import { useEffect, useRef, useState } from 'react';
import { Room, RoomEvent } from 'livekit-client';
import { Heart, Gift, Send } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { sendGift } from '@/lib/gifts';

interface LivePlayerProps {
  streamId: string;
  token: string;
}

export function LivePlayer({ streamId, token }: LivePlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const roomRef = useRef<Room | null>(null);
  const [connected, setConnected] = useState(false);
  const [chatMessages, setChatMessages] = useState<string[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const { user, c8lCoins } = useApp();

  useEffect(() => {
    const connect = async () => {
      const room = new Room();
      roomRef.current = room;
      room.on(RoomEvent.TrackSubscribed, (track: any, publication: any, participant: any) => {
        if (track.kind === 'video' && videoRef.current) {
          const stream = new MediaStream();
          stream.addTrack(track.mediaStreamTrack);
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      });
      await room.connect(process.env.NEXT_PUBLIC_LIVEKIT_URL!, token);
      setConnected(true);
    };
    connect();
    return () => { roomRef.current?.disconnect(); };
  }, [token]);

  const handleSendGift = async (giftId: string, coinCost: number) => {
    const result = await sendGift(streamId, giftId, coinCost, 'live');
    if (result.success) {
      // mostrar animación de regalo en pantalla
    }
  };

  return (
    <div className="relative bg-black rounded-xl overflow-hidden">
      <video ref={videoRef} autoPlay className="w-full" />
      {connected && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
          <div className="flex gap-2 items-center">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Escribe un comentario..."
              className="flex-1 bg-white/10 rounded-full px-4 py-2 text-white"
            />
            <button className="p-2 bg-[#D4AF37] rounded-full">
              <Send size={18} className="text-black" />
            </button>
          </div>
          <div className="flex gap-2 mt-2">
            <button onClick={() => handleSendGift('rose', 50)} className="bg-white/10 p-2 rounded-full">🌹 50</button>
            <button onClick={() => handleSendGift('golden_mic', 500)} className="bg-white/10 p-2 rounded-full">🎤 500</button>
            <button onClick={() => handleSendGift('unicorn', 2000)} className="bg-white/10 p-2 rounded-full">🦄 2000</button>
          </div>
        </div>
      )}
    </div>
  );
}