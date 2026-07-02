// components/social/QuantumLounge.tsx
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Video, Users, Gift, Play, Music, LogIn, LogOut, Monitor } from 'lucide-react';
import { AvatarSeat } from './AvatarSeat';
import { StageKaraoke } from './StageKaraoke';
import { StageVideo } from './StageVideo';
import { MiniGamePanel } from './MiniGamePanel';
import { useApp } from '../../context/AppContext';

type LoungeMode = 'karaoke' | 'video';

interface UserInSeat {
  id: string;
  name: string;
  avatar: string;
  seatNumber: number;
  isOnStage: boolean;
  isSpeaking: boolean;
  giftsSent: number;
}

export function QuantumLounge() {
  const { user, c8lCoins } = useApp();
  const [mode, setMode] = useState<LoungeMode>('karaoke');
  const [usersInSeats, setUsersInSeats] = useState<UserInSeat[]>([
    { id: '1', name: 'Leo Vela', avatar: '🦁', seatNumber: 1, isOnStage: true, isSpeaking: false, giftsSent: 0 },
    { id: '2', name: 'Dj_Rayo', avatar: '⚡', seatNumber: 2, isOnStage: false, isSpeaking: false, giftsSent: 0 },
    { id: '3', name: 'Reina_Melody', avatar: '👑', seatNumber: 3, isOnStage: false, isSpeaking: false, giftsSent: 0 },
    { id: '4', name: 'BeatMaster', avatar: '🎧', seatNumber: 4, isOnStage: false, isSpeaking: false, giftsSent: 0 },
    { id: '5', name: 'Sonic_Flow', avatar: '🎤', seatNumber: 5, isOnStage: false, isSpeaking: false, giftsSent: 0 },
    { id: '6', name: 'Viewer_123', avatar: '👤', seatNumber: 6, isOnStage: false, isSpeaking: false, giftsSent: 0 }
  ]);
  const [isMicActive, setIsMicActive] = useState(false);
  const [currentSong, setCurrentSong] = useState<string | null>(null);
  const [lyrics, setLyrics] = useState<string>('');

  // Simular entrada/salida de usuarios
  const joinLounge = () => {
    const newUser = {
      id: user?.uid || Date.now().toString(),
      name: user?.displayName || 'Invitado',
      avatar: '🎭',
      seatNumber: usersInSeats.length + 1,
      isOnStage: false,
      isSpeaking: false,
      giftsSent: 0
    };
    setUsersInSeats(prev => [...prev, newUser]);
  };

  const leaveSeat = (userId: string) => {
    setUsersInSeats(prev => prev.filter(u => u.id !== userId));
  };

  const sendGiftToOnStage = (giftType: string, coinsCost: number) => {
    // Encontrar al que está en el escenario
    const onStage = usersInSeats.find(u => u.isOnStage);
    if (onStage) {
      // Actualizar gifts del usuario
      setUsersInSeats(prev => prev.map(u => 
        u.id === onStage.id 
          ? { ...u, giftsSent: u.giftsSent + 1 }
          : u
      ));
      // Mostrar animación de regalo
      alert(`🎁 ¡${user?.displayName || 'Alguien'} envió ${giftType} a ${onStage.name}!`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white p-4">
      
      {/* Header de la Sala */}
      <div className="flex justify-between items-center mb-6 border-b-4 border-[#D4AF37] pb-4">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-black text-[#D4AF37]">🎤 QUANTUM LOUNGE</h1>
          <div className="flex gap-2">
            <button
              onClick={() => setMode('karaoke')}
              className={`px-4 py-2 border-2 font-black transition-all ${
                mode === 'karaoke' 
                  ? 'bg-[#D4AF37] text-black border-black' 
                  : 'bg-black text-[#D4AF37] border-[#D4AF37]'
              }`}
            >
              <Music size={16} className="inline mr-2" /> KARAOKE
            </button>
            <button
              onClick={() => setMode('video')}
              className={`px-4 py-2 border-2 font-black transition-all ${
                mode === 'video' 
                  ? 'bg-[#D4AF37] text-black border-black' 
                  : 'bg-black text-[#D4AF37] border-[#D4AF37]'
              }`}
            >
              <Video size={16} className="inline mr-2" /> SALA DE VIDEO
            </button>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-400">👥 {usersInSeats.length}/12 en sala</span>
          <button onClick={joinLounge} className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700">
            + Unirse
          </button>
          <div className="bg-black border-2 border-[#D4AF37] px-3 py-1">
            <span className="text-[#D4AF37] font-bold">{c8lCoins} COINS</span>
          </div>
        </div>
      </div>

      {/* Grid Principal: Sillones (izquierda) + Escenario (derecha) */}
      <div className="grid grid-cols-12 gap-6">
        
        {/* Zona de Sillones (4 columnas) - Estilo teatro */}
        <div className="col-span-4 bg-black/40 border-2 border-gray-800 p-4 rounded-lg">
          <h2 className="text-xl font-black text-[#D4AF37] mb-4 flex items-center gap-2">
            <Users /> BUTACAS C8L
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {usersInSeats.map((seatUser) => (
              <AvatarSeat
                key={seatUser.id}
                seatNumber={seatUser.seatNumber}
                user={{
                  ...seatUser,
                  starsReceived: 0
                }}
                isCurrentUser={seatUser.id === user?.uid}
                onSit={() => {}}
                onLeave={() => leaveSeat(seatUser.id)}
                onSendGift={() => sendGiftToOnStage('🌹', 50)}
              />
            ))}
            {/* Sillones vacíos */}
            {Array.from({ length: Math.max(0, 12 - usersInSeats.length) }).map((_, i) => (
              <div key={`empty-${i}`} className="border-2 border-dashed border-gray-700 rounded-lg p-4 text-center text-gray-500 text-sm">
                🪑 Vacío
              </div>
            ))}
          </div>
          
          {/* Mini panel de juegos desde el sillón */}
          <div className="mt-6 pt-4 border-t border-gray-800">
            <MiniGamePanel />
          </div>
        </div>

        {/* Escenario / Pantalla Principal (8 columnas) */}
        <div className="col-span-8 bg-black border-4 border-[#D4AF37] rounded-lg overflow-hidden shadow-xl">
          {mode === 'karaoke' ? (
            <StageKaraoke
              currentSong={currentSong}
              lyrics={lyrics}
              isMicActive={isMicActive}
              onMicToggle={() => setIsMicActive(!isMicActive)}
              onSendGift={sendGiftToOnStage}
            />
          ) : (
            <StageVideo
              currentVideo={null}
              onPlayVideo={(url) => console.log('Reproduciendo:', url)}
            />
          )}
        </div>
      </div>
    </div>
  );
}