'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Users, Gift, LogOut, Shield, Settings, Send, Crown, Trophy, Volume2 } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { SeatManager } from './SeatManager';
import { SongQueue } from './SongQueue';
import { RoomSettingsModal } from '../rooms/RoomSettingsModal';
import { getSocket } from '@/lib/socket';
import confetti from 'canvas-confetti';

interface Room {
  id: string;
  name: string;
  is_private: boolean;
  owner_id: string;
  max_seats: number;
  current_seats: number;
  is_open: boolean;
}

interface UserSeat {
  id: string;
  name: string;
  avatar: string;
  seatNumber: number;
  is_singing: boolean;
  is_muted: boolean;
  badges?: string[];
}

interface ChatMessage {
  id: string;
  senderName: string;
  senderAvatar: string;
  text: string;
  isSystem?: boolean;
  isGift?: boolean;
}

const PREMIUM_GIFTS = [
  { id: 'gold_mic', name: 'Micrófono de Oro', emoji: '🎤', cost: 50, stars: 25 },
  { id: 'neon_rain', name: 'Lluvia de Neón', emoji: '⚡', cost: 100, stars: 50 },
  { id: 'quantum_phoenix', name: 'Fénix Quantum', emoji: '🦅', cost: 500, stars: 250 },
  { id: 'c8l_crown', name: 'Corona C8L', emoji: '👑', cost: 1000, stars: 500 },
];

export function RoomLobby({ roomId }: { roomId: string }) {
  const { user, c8lCoins, deductCCoins, showNotification } = useApp();
  const router = useRouter();

  // Core Room State
  const [room, setRoom] = useState<Room | null>(null);
  const [seats, setSeats] = useState<UserSeat[]>([]);
  const [activeSinger, setActiveSinger] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);

  // Settings & Gifting
  const [showSettings, setShowSettings] = useState(false);
  const [giftingTarget, setGiftingTarget] = useState<UserSeat | null>(null);
  const [giftingTargetSeatIndex, setGiftingTargetSeatIndex] = useState(-1);

  // Chat/Activity
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // Mic simulation
  const [isMicEnabled, setIsMicEnabled] = useState(false);
  const [vocalVolume, setVocalVolume] = useState(0);
  const volumeIntervalRef = useRef<any>(null);

  // Fetch Room metadata and initial seats
  const fetchRoomData = async () => {
    try {
      const { supabase } = await import('@/lib/supabase/client');
      
      // 1. Get Room
      const { data: roomData, error: roomErr } = await supabase
        .from('rooms')
        .select('*')
        .eq('id', roomId)
        .single();

      if (roomErr || !roomData) {
        // Fallback for mock rooms during development
        console.warn('Room not found in DB, generating mock room details');
        setRoom({
          id: roomId,
          name: 'Quantum Karaoke Live',
          is_private: false,
          owner_id: user?.uid || 'system',
          max_seats: 15,
          current_seats: 1,
          is_open: true
        });
        setLoading(false);
        return;
      }

      setRoom(roomData);

      // 2. Validate Access Permissions
      if (roomData.is_private && roomData.owner_id !== user?.uid) {
        const { data: invite } = await supabase
          .from('room_invitations')
          .select('*')
          .eq('room_id', roomId)
          .eq('user_id', user?.uid)
          .eq('status', 'accepted')
          .single();

        if (!invite) {
          setAccessDenied(true);
          setLoading(false);
          return;
        }
      }

      // 3. Fetch Seats
      const { data: seatsData } = await supabase
        .from('room_seats')
        .select('*, user:users!user_id(name, avatar, badges)');

      const formattedSeats = (seatsData || []).map((s: any) => ({
        id: s.user_id,
        name: s.user?.name || 'Vocalista C8L',
        avatar: s.user?.avatar || '🎤',
        seatNumber: s.seat_number,
        is_singing: s.is_singing,
        is_muted: s.is_muted,
        badges: s.user?.badges || []
      }));

      setSeats(formattedSeats);
      setLoading(false);
    } catch (e) {
      console.error('Error fetching room data:', e);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.uid) {
      fetchRoomData();
    }
  }, [roomId, user?.uid]);

  // WebSocket / Realtime setup
  useEffect(() => {
    if (!room || !user) return;

    // Join Socket Room
    const socket = getSocket();
    socket.emit('join-room', {
      roomId,
      user: {
        id: user.uid,
        name: user.displayName || 'Leo Vela',
        avatar: '🦁',
      }
    });

    // Listen to WS events
    socket.on('user-joined', (data: any) => {
      setChatMessages((prev) => [
        ...prev,
        {
          id: Math.random().toString(),
          senderName: 'SISTEMA',
          senderAvatar: '🤖',
          text: `👋 ${data.user?.name || 'Un usuario'} se unió al Lounge`,
          isSystem: true
        }
      ]);
    });

    socket.on('user-left', (data: any) => {
      setChatMessages((prev) => [
        ...prev,
        {
          id: Math.random().toString(),
          senderName: 'SISTEMA',
          senderAvatar: '🤖',
          text: `🚪 Un usuario dejó el Lounge`,
          isSystem: true
        }
      ]);
    });

    socket.on('gift-received', (data: any) => {
      triggerConfetti();
      setChatMessages((prev) => [
        ...prev,
        {
          id: Math.random().toString(),
          senderName: 'REGALO',
          senderAvatar: '🎁',
          text: `🎁 ¡${data.from} envió ${data.giftName} ${data.gift} a ${data.to}!`,
          isGift: true
        }
      ]);
    });

    socket.on('kicked-from-room', (data: any) => {
      if (data.targetUserId === user.uid) {
        showNotification('Has sido expulsado de la sala', 'error');
        router.push('/lounge');
      }
    });

    // Subscriptions to Supabase Realtime (Fallbacks)
    let seatSub: any;
    let giftSub: any;

    (async () => {
      const { supabase } = await import('@/lib/supabase/client');

      // Sync Seat states
      seatSub = supabase
        .channel(`room_seats_${roomId}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'room_seats', filter: `room_id=eq.${roomId}` }, () => {
          fetchRoomData();
        })
        .subscribe();

      // Sync Real-time Gifts / Confetti
      giftSub = supabase
        .channel(`room_gifts_${roomId}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'room_gifts', filter: `room_id=eq.${roomId}` }, async (payload) => {
          const newGift = payload.new;
          // Resolve usernames
          const { data: fromUser } = await supabase.from('users').select('name').eq('id', newGift.from_user_id).single();
          const { data: toUser } = await supabase.from('users').select('name').eq('id', newGift.to_user_id).single();
          
          const fromName = fromUser?.name || 'Productor';
          const toName = toUser?.name || 'Vocalista';

          triggerConfetti();
          setChatMessages((prev) => [
            ...prev,
            {
              id: newGift.id,
              senderName: 'REGALO',
              senderAvatar: '🎁',
              text: `🎁 ¡${fromName} envió ${newGift.gift_type} a ${toName}!`,
              isGift: true
            }
          ]);
        })
        .subscribe();
    })();

    return () => {
      socket.emit('leave-room', { roomId });
      socket.off('user-joined');
      socket.off('user-left');
      socket.off('gift-received');
      socket.off('kicked-from-room');
      if (seatSub) seatSub.unsubscribe();
      if (giftSub) giftSub.unsubscribe();
    };
  }, [room, user?.uid]);

  // Scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Trigger mic simulation
  useEffect(() => {
    if (isMicEnabled) {
      volumeIntervalRef.current = setInterval(() => {
        setVocalVolume(Math.floor(Math.random() * 60) + 20); // 20-80 range simulation
      }, 200);
    } else {
      if (volumeIntervalRef.current) clearInterval(volumeIntervalRef.current);
      setVocalVolume(0);
    }

    return () => {
      if (volumeIntervalRef.current) clearInterval(volumeIntervalRef.current);
    };
  }, [isMicEnabled]);

  const triggerConfetti = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#D4AF37', '#FF0055', '#00F3FF', '#8A2BE2'],
    });
  };

  // Seating actions
  const handleSit = async (seatNumber: number) => {
    if (!user) return;
    try {
      const { supabase } = await import('@/lib/supabase/client');

      // Leave any existing seat first
      await supabase
        .from('room_seats')
        .delete()
        .eq('room_id', roomId)
        .eq('user_id', user.uid);

      // Insert seat reservation
      const { error } = await supabase
        .from('room_seats')
        .insert({
          room_id: roomId,
          user_id: user.uid,
          seat_number: seatNumber,
          is_singing: false,
          is_muted: false
        });

      if (error) throw error;
      showNotification(`Te has sentado en la butaca ${seatNumber}`, 'success');
      fetchRoomData();
    } catch (e: any) {
      console.error('Error sitting down:', e);
      showNotification('Este sillón ya está ocupado', 'error');
    }
  };

  const handleLeaveSeat = async (seatNumber: number) => {
    if (!user) return;
    try {
      const { supabase } = await import('@/lib/supabase/client');
      await supabase
        .from('room_seats')
        .delete()
        .eq('room_id', roomId)
        .eq('user_id', user.uid);

      showNotification('Has dejado tu butaca', 'info');
      setIsMicEnabled(false);
      fetchRoomData();
    } catch (e: any) {
      console.error('Error leaving seat:', e);
    }
  };

  const handleToggleMute = async (seatNumber: number, currentMuted: boolean) => {
    try {
      const { supabase } = await import('@/lib/supabase/client');
      const targetSeat = seats.find((s) => s.seatNumber === seatNumber);
      if (!targetSeat) return;

      const { error } = await supabase
        .from('room_seats')
        .update({ is_muted: !currentMuted })
        .eq('room_id', roomId)
        .eq('user_id', targetSeat.id);

      if (error) throw error;
      
      if (targetSeat.id === user?.uid) {
        setIsMicEnabled(currentMuted); // If unmuting, enable simulated mic
      }

      fetchRoomData();
    } catch (e: any) {
      console.error('Error toggling mute:', e);
    }
  };

  const handleKickUser = async (targetUserId: string) => {
    try {
      const res = await fetch('/api/rooms/kick', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId,
          ownerId: user?.uid,
          targetUserId,
          action: 'seat'
        })
      });

      const data = await res.json();
      if (data.success) {
        showNotification('Usuario expulsado de la butaca', 'info');
        // Emit WebSocket notification
        getSocket().emit('kick-user', { roomId, targetUserId });
        fetchRoomData();
      } else {
        showNotification(data.error || 'Error al expulsar usuario', 'error');
      }
    } catch (e) {
      console.error('Error kicking user:', e);
    }
  };

  // Gifting implementation
  const handleSendGift = (gift: typeof PREMIUM_GIFTS[0]) => {
    if (!user || !giftingTarget) return;

    if (deductCCoins(gift.cost)) {
      // 1. Register in gift_transactions and process_gift RPC
      (async () => {
        try {
          const { supabase } = await import('@/lib/supabase/client');
          // Process gift via Database RPC
          await supabase.rpc('process_gift', {
            p_from_user: user.uid,
            p_to_user: giftingTarget.id,
            p_gift_id: gift.id,
            p_coin_cost: gift.cost
          });

          // Insert into room-specific gifts table
          await supabase.from('room_gifts').insert({
            room_id: roomId,
            from_user_id: user.uid,
            to_user_id: giftingTarget.id,
            gift_type: gift.emoji,
            coins_cost: gift.cost
          });

          // 2. Emit WebSocket event
          getSocket().emit('send-gift', {
            roomId,
            from: user.displayName || 'Productor',
            to: giftingTarget.name,
            gift: gift.emoji,
            giftName: gift.name,
            coinsCost: gift.cost
          });

          triggerConfetti();
          showNotification(`¡Enviado ${gift.name} a ${giftingTarget.name}!`, 'success');
          setGiftingTarget(null);
        } catch (e) {
          console.error('Error storing gift transaction:', e);
        }
      })();
    } else {
      showNotification('Saldo de Coins insuficiente', 'error');
    }
  };

  // Chat message sending
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    const messageObj: ChatMessage = {
      id: Math.random().toString(),
      senderName: user.displayName || 'Productor C8L',
      senderAvatar: '🦁',
      text: newMessage.trim()
    };

    // Emit via WebSocket
    getSocket().emit('chat-message', { roomId, message: messageObj });

    // Append locally
    setChatMessages((prev) => [...prev, messageObj]);
    setNewMessage('');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center font-mono text-gray-400">
        Conectando al Quantum Lounge...
      </div>
    );
  }

  if (accessDenied) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-center font-mono">
        <h2 className="text-2xl font-black text-[#FF0055] mb-2">🔒 ACCESO PRIVADO</h2>
        <p className="text-gray-400 max-w-sm mb-6">
          Esta sala es exclusiva y requiere invitación. Por favor solicita al propietario que te envíe un pase.
        </p>
        <button
          onClick={() => router.push('/lounge')}
          className="px-6 py-2 bg-gray-900 border border-gray-700 hover:border-[#D4AF37] text-white hover:text-[#D4AF37] rounded transition-all cursor-pointer"
        >
          VOLVER AL LOBBY
        </button>
      </div>
    );
  }

  const isOwner = user?.uid === room?.owner_id;
  const currentSeat = seats.find((s) => s.id === user?.uid);

  return (
    <div 
      className="min-h-screen text-white pt-28 md:pt-32 pb-24 p-4 relative bg-cover bg-center"
      style={{ backgroundImage: "url('/images/lounge_background.png')" }}
    >
      {/* Dark semi-transparent overlay for readability */}
      <div className="absolute inset-0 bg-black/85 backdrop-blur-sm z-0" />

      {/* Wrapper to overlay contents above background */}
      <div className="relative z-10 max-w-7xl mx-auto space-y-6">
        
        {/* Top Lounge Bar */}
      <div className="flex justify-between items-center mb-6 border-b-4 border-[#D4AF37] pb-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl sm:text-3xl font-black text-[#D4AF37] font-mono tracking-wider">
            🎤 {room?.name.toUpperCase()}
          </h1>
          <span className="bg-purple-950/80 border border-purple-500/50 text-[#00F3FF] text-[10px] font-mono font-bold px-2 py-0.5 rounded">
            LOUNGE #{roomId.substring(0, 6).toUpperCase()}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Owner options */}
          {isOwner && (
            <button
              onClick={() => setShowSettings(true)}
              className="p-2 bg-black hover:bg-[#D4AF37] border-2 border-gray-800 hover:border-black text-[#D4AF37] hover:text-black rounded transition-all cursor-pointer"
              title="Ajustes de Sala"
            >
              <Settings size={16} />
            </button>
          )}

          {/* User Coins info */}
          <div className="bg-black border-2 border-[#D4AF37] px-3 py-1 font-mono text-xs hidden sm:block">
            <span className="text-[#D4AF37] font-bold">{c8lCoins} COINS</span>
          </div>

          {/* Leave room */}
          <button
            onClick={() => router.push('/lounge')}
            className="px-4 py-1.5 bg-red-900/30 hover:bg-red-700/80 border border-red-800 text-red-200 hover:text-white text-xs font-black rounded flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <LogOut size={12} /> SALIR
          </button>
        </div>
      </div>

      {/* Main Grid: Seats (Left) + Stage (Center) + Queue/Chat (Right) */}
      <div className="grid grid-cols-12 gap-6 items-stretch">
        
        {/* Left Side: 15 Seats Map (4 cols) */}
        <div className="col-span-12 lg:col-span-4 flex flex-col justify-between">
          <SeatManager
            roomId={roomId}
            seats={seats}
            isOwner={isOwner}
            currentUserId={user?.uid}
            onSit={handleSit}
            onLeave={handleLeaveSeat}
            onToggleMute={handleToggleMute}
            onKick={handleKickUser}
            onSendGift={(target, index) => {
              setGiftingTarget(target);
              setGiftingTargetSeatIndex(index);
            }}
          />
        </div>

        {/* Center: Singing Stage (5 cols) */}
        <div className="col-span-12 md:col-span-7 lg:col-span-5 bg-black border-4 border-[#D4AF37] rounded-xl overflow-hidden shadow-2xl flex flex-col min-h-[480px]">
          {/* Stage Screen header */}
          <div className="bg-gradient-to-r from-purple-950 to-black p-3 border-b border-gray-800 flex justify-between items-center">
            <span className="text-xs font-black text-[#D4AF37] font-mono">🌟 ESCENARIO PRINCIPAL</span>
            {currentSeat && (
              <button
                onClick={() => setIsMicEnabled(!isMicEnabled)}
                disabled={currentSeat.is_muted}
                className={`px-3 py-1 text-[10px] font-black border rounded cursor-pointer transition-all flex items-center gap-1 ${
                  currentSeat.is_muted
                    ? 'bg-gray-800 border-gray-700 text-gray-500 cursor-not-allowed'
                    : isMicEnabled
                    ? 'bg-[#FF0055] border-black text-white font-bold animate-pulse'
                    : 'bg-[#00F3FF] border-black text-black font-bold'
                }`}
              >
                {isMicEnabled ? <MicOff size={10} /> : <Mic size={10} />}
                {currentSeat.is_muted ? 'MUTED' : isMicEnabled ? 'DESACTIVAR MIC' : 'ACTIVAR MIC'}
              </button>
            )}
          </div>

          {/* Singer & Lyrics area */}
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-950/20 via-black to-black relative">
            
            {/* Stage lights effects */}
            <div className="absolute top-0 left-1/4 w-32 h-64 bg-[#00F3FF]/10 blur-[60px] rounded-full" />
            <div className="absolute top-0 right-1/4 w-32 h-64 bg-[#FF0055]/10 blur-[60px] rounded-full" />

            {activeSinger ? (
              <div className="space-y-6 z-10 w-full">
                <div className="relative inline-block">
                  <span className="text-7xl block animate-bounce">🦁</span>
                  <div className="absolute -bottom-2 -right-2 bg-gradient-to-r from-[#00F3FF] to-purple-600 border border-black p-1 rounded-full">
                    <Mic size={14} className="text-white" />
                  </div>
                </div>

                <div>
                  <h3 className="text-2xl font-black text-white font-mono uppercase tracking-wider">
                    {activeSinger.song_title}
                  </h3>
                  <p className="text-xs text-[#00F3FF] font-semibold mt-1">
                    Cantando: {activeSinger.user?.name || 'Vocalista C8L'}
                  </p>
                </div>

                {/* Lyrics box */}
                <div className="bg-black/90 border-2 border-[#D4AF37] p-5 rounded-lg max-w-sm mx-auto shadow-inner">
                  <p className="text-xs text-gray-500 uppercase tracking-widest font-mono mb-2">Letra de Karaoke</p>
                  <p className="text-lg font-bold text-[#FF0055] leading-relaxed drop-shadow-[0_0_5px_rgba(255,0,85,0.5)]">
                    "Is this the real life? Is this just fantasy?"
                  </p>
                  <p className="text-sm text-gray-400 mt-2">
                    Caught in a landside, no escape from reality...
                  </p>
                </div>

                {/* Pitch Volume Visualizer */}
                {isMicEnabled && (
                  <div className="max-w-xs mx-auto space-y-1">
                    <div className="flex justify-between items-center text-[10px] text-gray-500 font-mono">
                      <span>🎤 AUDIO INPUT VOLUME</span>
                      <span>{vocalVolume}%</span>
                    </div>
                    <div className="h-3 bg-gray-900 border border-gray-800 rounded-full overflow-hidden flex items-center p-0.5">
                      <motion.div
                        className="h-full bg-gradient-to-r from-[#00F3FF] via-purple-500 to-[#FF0055] rounded-full"
                        style={{ width: `${vocalVolume}%` }}
                        animate={{ width: `${vocalVolume}%` }}
                        transition={{ duration: 0.1 }}
                      />
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center space-y-4 z-10">
                <span className="text-6xl block opacity-40">🎚️</span>
                <h3 className="text-lg font-black text-gray-400 font-mono uppercase">ESCENARIO EN SILENCIO</h3>
                <p className="text-xs text-gray-500 max-w-xs">
                  No hay nadie cantando en este momento. Selecciona una canción en el panel de turnos para subir.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Song Queue & Chat Stream (3 cols) */}
        <div className="col-span-12 md:col-span-5 lg:col-span-3 flex flex-col gap-6">
          
          {/* Song Queue */}
          <div className="flex-1 min-h-[250px]">
            <SongQueue
              roomId={roomId}
              isOwner={isOwner}
              onNextSong={(playingSong) => setActiveSinger(playingSong)}
            />
          </div>

          {/* Room chat */}
          <div className="bg-black/60 border-2 border-gray-800 rounded-xl p-4 flex flex-col h-72">
            <h3 className="text-xs font-black text-[#00F3FF] mb-2 flex items-center gap-1.5 font-mono uppercase tracking-wider">
              💬 CHAT DE SALA
            </h3>
            
            {/* Messages box */}
            <div className="flex-1 overflow-y-auto space-y-2 mb-3 pr-1 text-xs max-h-48">
              {chatMessages.length === 0 ? (
                <p className="text-[10px] text-gray-600 text-center py-6 italic">Comienza la conversación...</p>
              ) : (
                chatMessages.map((msg) => (
                  <div key={msg.id} className="leading-tight">
                    {msg.isSystem ? (
                      <span className="text-gray-500 font-semibold">{msg.text}</span>
                    ) : msg.isGift ? (
                      <span className="text-[#FF0055] font-black">{msg.text}</span>
                    ) : (
                      <span>
                        <span className="text-[#D4AF37] font-bold mr-1">{msg.senderName}:</span>
                        <span className="text-gray-200">{msg.text}</span>
                      </span>
                    )}
                  </div>
                ))
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Chat form */}
            <form onSubmit={handleSendMessage} className="flex gap-1 border-t border-gray-900 pt-3">
              <input
                type="text"
                placeholder="Escribe en el chat..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="flex-1 bg-black border border-gray-800 focus:border-[#00F3FF] text-white rounded p-1.5 text-[10px] focus:outline-none"
              />
              <button
                type="submit"
                disabled={!newMessage.trim()}
                className="p-1.5 bg-[#00F3FF] hover:bg-black text-black hover:text-[#00F3FF] border border-black hover:border-[#00F3FF] rounded transition-colors cursor-pointer disabled:opacity-40"
              >
                <Send size={12} />
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Gifting Modal */}
      <AnimatePresence>
        {giftingTarget && (
          <div className="fixed inset-0 bg-black/90 z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-900 border-4 border-[#D4AF37] w-full max-w-md rounded-lg overflow-hidden"
            >
              <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-black/40">
                <div>
                  <h3 className="text-lg font-black text-[#D4AF37] font-mono">REGALAR A SILLÓN {giftingTargetSeatIndex}</h3>
                  <p className="text-xs text-gray-400">Usuario: <span className="text-white font-bold">{giftingTarget.name}</span></p>
                </div>
                <button onClick={() => setGiftingTarget(null)} className="text-gray-400 hover:text-white text-xl cursor-pointer">✕</button>
              </div>

              <div className="p-4 grid grid-cols-2 gap-3 bg-black/20">
                {PREMIUM_GIFTS.map((gift) => (
                  <button
                    key={gift.id}
                    onClick={() => handleSendGift(gift)}
                    className="bg-black/60 border border-gray-800 hover:border-[#D4AF37] p-3 rounded-lg flex flex-col items-center justify-center transition-all group hover:bg-[#D4AF37]/5 cursor-pointer"
                  >
                    <span className="text-3xl mb-1 group-hover:scale-110 transition-transform">{gift.emoji}</span>
                    <span className="text-xs font-bold text-white mb-1">{gift.name}</span>
                    <span className="text-[10px] text-[#D4AF37] font-black">{gift.cost} Coins</span>
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Room Settings Modal */}
      {showSettings && room && (
        <RoomSettingsModal
          room={room}
          onClose={() => setShowSettings(false)}
          onRoomUpdated={fetchRoomData}
        />
      )}
      </div>
    </div>
  );
}
