'use client';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Gift, ShieldAlert, Lock } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { getSocket } from '@/lib/socket';
import confetti from 'canvas-confetti';

interface FactionMember {
  id: string;
  name: string;
  avatar: string;
  role: string;
}

interface Message {
  id: string;
  user_id: string;
  message: string;
  created_at: string;
  user?: {
    name: string;
    avatar: string;
    role?: string;
  };
  isGift?: boolean;
}

interface FactionChatProps {
  factionId: string;
  members: FactionMember[];
  userRole: string; // 'captain' | 'vice-captain' | 'admin' | 'member'
}

const PREMIUM_GIFTS = [
  { id: 'gold_mic', name: 'Micrófono de Oro', emoji: '🎤', cost: 50 },
  { id: 'neon_rain', name: 'Lluvia de Neón', emoji: '⚡', cost: 100 },
  { id: 'quantum_phoenix', name: 'Fénix Quantum', emoji: '🦅', cost: 500 },
  { id: 'c8l_crown', name: 'Corona C8L', emoji: '👑', cost: 1000 },
];

export function FactionChat({ factionId, members, userRole }: FactionChatProps) {
  const { user, c8lCoins, deductCCoins, showNotification } = useApp();
  const [activeChannelType, setActiveChannelType] = useState<'general' | 'admin'>('general');
  const [channels, setChannels] = useState<{ id: string; type: string }[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [giftingTarget, setGiftingTarget] = useState<FactionMember | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const isAdminOrOfficer = ['captain', 'vice-captain', 'admin'].includes(userRole);

  const fetchChannelsAndMessages = async () => {
    try {
      const { supabase } = await import('@/lib/supabase/client');
      
      // 1. Fetch Channels
      const { data: chanData, error: chanError } = await supabase
        .from('faction_channels')
        .select('*')
        .eq('faction_id', factionId);

      if (chanError) throw chanError;
      setChannels(chanData || []);

      const activeChan = (chanData || []).find((c) => c.channel_type === activeChannelType);
      if (!activeChan) return;

      // 2. Fetch Messages
      const { data: msgData, error: msgError } = await supabase
        .from('faction_messages')
        .select('*, user:users!user_id(name, avatar, role)')
        .eq('channel_id', activeChan.id)
        .order('created_at', { ascending: true });

      if (msgError) throw msgError;
      setMessages(msgData || []);
    } catch (e) {
      console.error('Error fetching faction chat:', e);
    }
  };

  useEffect(() => {
    fetchChannelsAndMessages();

    // Subscribe to realtime messages
    let subscription: any;
    (async () => {
      const { supabase } = await import('@/lib/supabase/client');
      subscription = supabase
        .channel(`faction_chat_channel_${factionId}_${activeChannelType}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'faction_messages' }, () => {
          fetchChannelsAndMessages();
        })
        .subscribe();
    })();

    return () => {
      if (subscription) subscription.unsubscribe();
    };
  }, [factionId, activeChannelType]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !user) return;

    try {
      const activeChan = channels.find((c) => c.type === activeChannelType);
      if (!activeChan) return;

      const { supabase } = await import('@/lib/supabase/client');
      const { error } = await supabase
        .from('faction_messages')
        .insert({
          channel_id: activeChan.id,
          user_id: user.uid,
          message: chatInput.trim()
        });

      if (error) throw error;
      setChatInput('');
      fetchChannelsAndMessages();
    } catch (e) {
      console.error('Error sending message:', e);
    }
  };

  // Chat inline gifting
  const handleSendGift = async (gift: typeof PREMIUM_GIFTS[0]) => {
    if (!user || !giftingTarget) return;

    if (deductCCoins(gift.cost)) {
      try {
        const { supabase } = await import('@/lib/supabase/client');
        
        // 1. Process Coins & Creator Stars via RPC
        await supabase.rpc('process_gift', {
          p_from_user: user.uid,
          p_to_user: giftingTarget.id,
          p_gift_id: gift.id,
          p_coin_cost: gift.cost
        });

        // 2. Insert chat notice
        const activeChan = channels.find((c) => c.type === 'general');
        if (activeChan) {
          const notice = `🎁 ¡Envió un ${gift.name} ${gift.emoji} a ${giftingTarget.name}! (+${gift.cost * 10} XP Bando)`;
          
          await supabase
            .from('faction_messages')
            .insert({
              channel_id: activeChan.id,
              user_id: user.uid,
              message: notice
            });
        }

        // 3. Add XP to Faction
        const { data: faction } = await supabase
          .from('factions')
          .select('level, xp')
          .eq('id', factionId)
          .single();

        if (faction) {
          const addedXp = gift.cost * 10;
          let newXp = (faction.xp || 0) + addedXp;
          let newLvl = faction.level || 1;
          let xpToNext = 1000 + ((newLvl - 1) * 1500);

          while (newXp >= xpToNext && newLvl < 20) {
            newLvl += 1;
            newXp -= xpToNext;
            xpToNext = 1000 + ((newLvl - 1) * 1500);
          }

          await supabase
            .from('factions')
            .update({ level: newLvl, xp: newXp })
            .eq('id', factionId);
        }

        // Emit WS gift notice
        getSocket().emit('gift-sent', {
          roomId: `faction_${factionId}`,
          from: user.displayName || 'Productor',
          to: giftingTarget.name,
          gift: gift.emoji,
          giftName: gift.name,
          isLarge: gift.cost >= 500
        });

        confetti({
          particleCount: 80,
          spread: 60,
          colors: ['#D4AF37', '#FF0055', '#8A2BE2'],
        });

        showNotification(`Enviado ${gift.name} a ${giftingTarget.name}`, 'success');
        setGiftingTarget(null);
        fetchChannelsAndMessages();
      } catch (err) {
        console.error('Error processing gift:', err);
      }
    } else {
      showNotification('Saldo de Coins insuficiente', 'error');
    }
  };

  return (
    <div className="bg-black/60 border-2 border-gray-800 rounded-xl p-4 flex flex-col h-[500px]">
      {/* Top Section: Member list for gifting */}
      <div className="border-b border-gray-900 pb-3 mb-3">
        <span className="text-[10px] text-gray-500 font-mono block mb-2 uppercase">🎁 REGALAR EN LÍNEA A MIEMBROS</span>
        <div className="flex gap-3 overflow-x-auto pb-1 max-w-full">
          {members.map((member) => (
            <button
              key={member.id}
              onClick={() => {
                if (member.id !== user?.uid) setGiftingTarget(member);
              }}
              disabled={member.id === user?.uid}
              className="flex flex-col items-center shrink-0 group disabled:opacity-50 cursor-pointer"
            >
              <div className="text-2xl p-1 bg-gray-950 border border-gray-800 rounded-full group-hover:border-[#FF0055] transition-all">
                {member.avatar || '👤'}
              </div>
              <span className="text-[8px] text-gray-400 group-hover:text-white truncate w-12 text-center mt-1">
                {member.name}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Tabs: General / Admin chat */}
      <div className="flex border-b border-gray-900 mb-3 text-xs font-black">
        <button
          onClick={() => setActiveChannelType('general')}
          className={`flex-1 py-2 text-center border-b-2 transition-all cursor-pointer ${
            activeChannelType === 'general'
              ? 'border-[#00F3FF] text-[#00F3FF] bg-[#00F3FF]/5'
              : 'border-transparent text-gray-500 hover:text-white'
          }`}
        >
          # CHAT GENERAL
        </button>

        <button
          onClick={() => {
            if (!isAdminOrOfficer) {
              showNotification('Solo Capitanes, Vice-Capitanes y Administradores tienen acceso a este canal', 'error');
              return;
            }
            setActiveChannelType('admin');
          }}
          className={`flex-1 py-2 text-center border-b-2 transition-all cursor-pointer flex items-center justify-center gap-1 ${
            activeChannelType === 'admin'
              ? 'border-[#FF0055] text-[#FF0055] bg-[#FF0055]/5'
              : 'border-transparent text-gray-500 hover:text-white'
          }`}
        >
          <Lock size={12} /> # CHAT DE OFICIALES
        </button>
      </div>

      {/* Messages Stream */}
      <div className="flex-1 bg-black/80 border border-gray-900 rounded-lg p-3 overflow-y-auto space-y-3 mb-3 text-xs">
        {messages.length === 0 ? (
          <p className="text-gray-600 text-center py-10 italic">No hay mensajes. Comienza la conversación en el bando.</p>
        ) : (
          messages.map((msg) => {
            const isGiftMsg = msg.message.includes('🎁');
            const displayRole = msg.user?.role === 'captain' 
              ? '👑 Capitán' 
              : msg.user?.role === 'vice-captain'
              ? '⭐ Vice-Capitán'
              : msg.user?.role === 'admin'
              ? '🛡️ Admin'
              : 'Soldado';
              
            return (
              <div key={msg.id} className="flex gap-2 items-start">
                <span className="text-xl bg-gray-900 p-1.5 rounded-full shrink-0">
                  {msg.user?.avatar || '👤'}
                </span>
                
                <div className={`p-2.5 rounded-lg border flex-1 ${
                  isGiftMsg 
                    ? 'bg-[#FF0055]/10 border-[#FF0055]/30' 
                    : msg.user_id === user?.uid 
                    ? 'bg-[#00F3FF]/5 border-[#00F3FF]/20'
                    : 'bg-gray-900/60 border-gray-800'
                }`}>
                  <div className="flex justify-between items-center mb-1 text-[10px]">
                    <span className="font-bold text-white">
                      {msg.user?.name || 'Guerrero'}{' '}
                      <span className="text-[8px] text-[#D4AF37] font-semibold">({displayRole})</span>
                    </span>
                    <span className="text-[8px] text-gray-600 font-mono">
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className={isGiftMsg ? 'text-[#FF0055] font-black' : 'text-gray-300'}>
                    {msg.message}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Chat input form */}
      <form onSubmit={handleSendMessage} className="flex gap-2">
        <input
          type="text"
          placeholder={`Escribe un mensaje para #${activeChannelType}...`}
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          className="flex-1 bg-black border border-gray-800 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
        />
        <button
          type="submit"
          disabled={!chatInput.trim()}
          className="px-4 py-2 bg-[#D4AF37] hover:bg-black text-black hover:text-[#D4AF37] font-black border border-black hover:border-[#D4AF37] text-xs transition-colors rounded cursor-pointer disabled:opacity-40"
        >
          ENVIAR
        </button>
      </form>

      {/* Inline Gifting Overlay */}
      <AnimatePresence>
        {giftingTarget && (
          <div className="fixed inset-0 bg-black/95 z-[60] flex items-center justify-center p-4">
            <div className="bg-gray-900 border-4 border-[#D4AF37] w-full max-w-sm rounded-lg overflow-hidden flex flex-col shadow-2xl">
              <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-black/40">
                <div>
                  <h3 className="text-lg font-black text-[#D4AF37] font-mono">ENVIAR REGALO SOCIAL</h3>
                  <p className="text-xs text-gray-400">Miembro: <span className="text-white font-bold">{giftingTarget.name}</span></p>
                </div>
                <button onClick={() => setGiftingTarget(null)} className="text-gray-400 hover:text-white text-xl cursor-pointer">✕</button>
              </div>

              <div className="p-4 grid grid-cols-2 gap-3 bg-black/20">
                {PREMIUM_GIFTS.map((gift) => (
                  <button
                    key={gift.id}
                    onClick={() => handleSendGift(gift)}
                    className="bg-black/60 border border-gray-800 hover:border-[#FF0055] p-3 rounded-lg flex flex-col items-center justify-center transition-all group hover:bg-[#FF0055]/5 cursor-pointer"
                  >
                    <span className="text-3xl mb-1 group-hover:scale-110 transition-transform">{gift.emoji}</span>
                    <span className="text-xs font-bold text-white mb-1">{gift.name}</span>
                    <span className="text-[10px] text-[#D4AF37] font-black">{gift.cost} Coins</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
