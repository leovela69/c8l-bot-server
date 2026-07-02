'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, Mic, Video, Gift, Trophy, Star, Zap, 
  ChevronLeft, ChevronRight, Shield, ShoppingCart, Flag, Calendar, Target, 
  Backpack as BackpackIcon 
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { FriendsSystem } from '@/components/social/FriendsSystem';
import { FactionView } from '@/components/factions/FactionView';
import { Backpack } from '@/components/backpack/Backpack';
import { DailyMissions } from '@/components/missions/DailyMissions';
import { SpecialEvents } from '@/components/events/SpecialEvents';
import { ReportSystem } from '@/components/reports/ReportSystem';
import { AvatarMarketplace } from '@/components/avatars/AvatarMarketplace';
import { LivePracticeMode } from '@/components/karaoke/LivePracticeMode';
import { StageVideo } from '@/components/social/StageVideo';
import { AvatarSeat } from '@/components/social/AvatarSeat';
import { LiveActivityPanel } from '@/components/social/LiveActivityPanel';

type LoungeMode = 'karaoke' | 'video';

export default function QuantumLounge() {
  const { user, c8lCoins, setC8lCoins, deductCCoins, showNotification } = useApp();
  const [userLevel, setUserLevel] = useState(7);
  const [userXP, setUserXP] = useState(350);
  const [mode, setMode] = useState<LoungeMode>('karaoke');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showFriends, setShowFriends] = useState(false);
  const [showFaction, setShowFaction] = useState(false);
  const [showBackpack, setShowBackpack] = useState(false);
  const [showMissions, setShowMissions] = useState(false);
  const [showEvents, setShowEvents] = useState(false);
  const [showReports, setShowReports] = useState(false);
  const [showAvatarShop, setShowAvatarShop] = useState(false);
  const [showPractice, setShowPractice] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState<{ id: string; title: string; instrumental_url: string } | null>(null);

  // 8 seats: first 4 occupied, last 4 vacant
  const [seats, setSeats] = useState<(any | null)[]>([
    { id: '1', name: 'Leo Vela', avatar: '🦁', isOnStage: true, isSinging: false, isSpeaking: false, giftsSent: 0, badges: ['🏆'], starsReceived: 120 },
    { id: '2', name: 'Dj_Rayo', avatar: '⚡', isOnStage: false, isSinging: false, isSpeaking: false, giftsSent: 0, badges: [], starsReceived: 45 },
    { id: '3', name: 'Reina_Melody', avatar: '👑', isOnStage: false, isSinging: false, isSpeaking: false, giftsSent: 0, badges: [], starsReceived: 80 },
    { id: '4', name: 'BeatMaster', avatar: '🎧', isOnStage: false, isSinging: false, isSpeaking: false, giftsSent: 0, badges: [], starsReceived: 10 },
    null,
    null,
    null,
    null,
  ]);

  // Modal for gifting
  const [giftingTarget, setGiftingTarget] = useState<any | null>(null);
  const [giftingTargetSeatIndex, setGiftingTargetSeatIndex] = useState<number>(-1);
  const [giftTab, setGiftTab] = useState<'real' | 'backpack'>('real');
  const [backpackItems, setBackpackItems] = useState<any[]>([]);

  // Load backpack items when gifting modal opens
  useEffect(() => {
    if (giftingTarget) {
      const stored = localStorage.getItem("c8l_backpack");
      if (stored) {
        try {
          setBackpackItems(JSON.parse(stored));
        } catch (e) {
          setBackpackItems([]);
        }
      } else {
        setBackpackItems([]);
      }
    }
  }, [giftingTarget]);

  // Join a vacant seat
  const handleSit = (seatIndex: number) => {
    if (!user) {
      showNotification("Debes iniciar sesión para ocupar una butaca.", "error");
      return;
    }
    
    // Check if already in a seat
    const alreadySittingIndex = seats.findIndex(s => s?.id === user.uid);
    const updated = [...seats];
    
    if (alreadySittingIndex !== -1) {
      // Free the old seat
      updated[alreadySittingIndex] = null;
    }

    updated[seatIndex] = {
      id: user.uid,
      name: user.displayName || 'Leo Vela',
      avatar: '🎤',
      isOnStage: false,
      isSinging: false,
      isSpeaking: false,
      giftsSent: 0,
      badges: [],
      starsReceived: 0
    };

    setSeats(updated);
    showNotification(`Te has sentado en el Sillón ${seatIndex + 1}.`, "success");
  };

  const handleLeave = (seatIndex: number) => {
    const updated = [...seats];
    updated[seatIndex] = null;
    setSeats(updated);
    showNotification("Has dejado tu butaca.", "info");
  };

  // Real coin gifts config
  const REAL_GIFTS = [
    { id: 'gold_mic', name: 'Micrófono de Oro', emoji: '🎤', cost: 50, stars: 25 },
    { id: 'neon_rain', name: 'Lluvia de Neón', emoji: '⚡', cost: 100, stars: 50 },
    { id: 'quantum_phoenix', name: 'Fénix Quantum', emoji: '🦅', cost: 500, stars: 250 },
    { id: 'c8l_crown', name: 'Corona C8L', emoji: '👑', cost: 1000, stars: 500 },
  ];

  const handleSendRealGift = (gift: typeof REAL_GIFTS[0]) => {
    if (!user) {
      showNotification("Por favor inicia sesión.", "error");
      return;
    }
    
    if (deductCCoins(gift.cost)) {
      // Update target user's stars received
      const updatedSeats = [...seats];
      if (updatedSeats[giftingTargetSeatIndex]) {
        const currentStars = updatedSeats[giftingTargetSeatIndex].starsReceived || 0;
        updatedSeats[giftingTargetSeatIndex] = {
          ...updatedSeats[giftingTargetSeatIndex],
          starsReceived: currentStars + gift.stars
        };
        setSeats(updatedSeats);
      }

      // Dispatch event to show in Live Activity Panel
      const event = new CustomEvent('c8l-gift-sent', {
        detail: {
          from: user.displayName || 'Leo Vela',
          to: giftingTarget.name,
          gift: gift.emoji,
          giftName: gift.name,
          isLarge: gift.cost >= 500
        }
      });
      window.dispatchEvent(event);

      showNotification(`¡Enviado ${gift.name} a ${giftingTarget.name}! (+${gift.stars} Stars)`, "success");
      setGiftingTarget(null);
    } else {
      showNotification("Saldo de Coins insuficiente.", "error");
    }
  };

  const handleSendBackpackGift = (item: any) => {
    if (item.quantity <= 0) {
      showNotification("No tienes unidades de este objeto.", "error");
      return;
    }

    // Decrement item quantity
    const updatedBackpack = backpackItems.map(i => 
      i.id === item.id ? { ...i, quantity: i.quantity - 1 } : i
    );
    setBackpackItems(updatedBackpack);
    localStorage.setItem("c8l_backpack", JSON.stringify(updatedBackpack));

    // Increase Friendship Level locally
    const localKey = `c8l_friendship_${user?.uid}_${giftingTarget.id}`;
    let friendshipData = { level: 1, xp: 0 };
    const saved = localStorage.getItem(localKey);
    if (saved) {
      try {
        friendshipData = JSON.parse(saved);
      } catch (e) {}
    }
    let newXp = friendshipData.xp + item.friendshipXp;
    let lvl = friendshipData.level;
    let xpToNext = 50 + ((lvl - 1) * 25);
    if (newXp >= xpToNext) {
      lvl += 1;
      newXp = newXp - xpToNext;
      showNotification(`¡Tu nivel de amistad con ${giftingTarget.name} ha subido a Nv. ${lvl}!`, "success");
    }
    localStorage.setItem(localKey, JSON.stringify({ level: lvl, xp: newXp }));

    // Dispatch event to show in Live Activity Panel
    const event = new CustomEvent('c8l-gift-sent', {
      detail: {
        from: user?.displayName || 'Leo Vela',
        to: giftingTarget.name,
        gift: item.emoji,
        giftName: item.name,
        isLarge: false
      }
    });
    window.dispatchEvent(event);

    showNotification(`¡Enviaste ${item.name} a ${giftingTarget.name}! (+${item.friendshipXp} XP de Amistad)`, "success");
    setGiftingTarget(null);
  };

  const handleClaimReward = (coins: number, xp: number) => {
    setC8lCoins(prev => prev + coins);
    setUserXP(prev => {
      const nextXP = prev + xp;
      if (nextXP >= 1000) {
        setUserLevel(l => l + 1);
        return nextXP - 1000;
      }
      return nextXP;
    });
  };

  return (
    <div className="min-h-screen bg-black text-white pt-28 md:pt-32 pb-24 p-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 border-b-4 border-[#D4AF37] pb-4">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-black text-[#D4AF37]">🎤 QUANTUM LOUNGE</h1>
          <div className="flex gap-2">
            <button onClick={() => setMode('karaoke')} className={`px-4 py-2 border-2 font-black ${mode === 'karaoke' ? 'bg-[#D4AF37] text-black' : 'bg-black text-[#D4AF37]'}`}>
              <Mic className="inline mr-2" size={16} /> KARAOKE
            </button>
            <button onClick={() => setMode('video')} className={`px-4 py-2 border-2 font-black ${mode === 'video' ? 'bg-[#D4AF37] text-black' : 'bg-black text-[#D4AF37]'}`}>
              <Video className="inline mr-2" size={16} /> SALA DE VIDEO
            </button>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-black border-2 border-[#D4AF37] px-3 py-1"><span className="text-[#D4AF37] font-bold">{c8lCoins} COINS</span></div>
        </div>
      </div>

      {/* Barra de acciones rápidas */}
      <div className="flex flex-wrap gap-2 mb-4 justify-center">
        <button onClick={() => setShowFriends(true)} className="px-3 py-1 bg-[#00F3FF] text-black text-sm font-black rounded flex items-center gap-1 cursor-pointer"><Users size={14} /> AMIGOS</button>
        <button onClick={() => setShowFaction(true)} className="px-3 py-1 bg-[#D4AF37] text-black text-sm font-black rounded flex items-center gap-1 cursor-pointer"><Shield size={14} /> BANDO</button>
        <button onClick={() => setShowBackpack(true)} className="px-3 py-1 bg-purple-600 text-white text-sm font-black rounded flex items-center gap-1 cursor-pointer"><BackpackIcon size={14} /> MOCHILA</button>
        <button onClick={() => setShowMissions(true)} className="px-3 py-1 bg-[#D4AF37] text-black text-sm font-black rounded flex items-center gap-1 cursor-pointer"><Target size={14} /> MISIONES</button>
        <button onClick={() => setShowEvents(true)} className="px-3 py-1 bg-[#FF0055] text-white text-sm font-black rounded flex items-center gap-1 cursor-pointer"><Calendar size={14} /> EVENTOS</button>
        <button onClick={() => setShowAvatarShop(true)} className="px-3 py-1 bg-purple-600 text-white text-sm font-black rounded flex items-center gap-1 cursor-pointer"><ShoppingCart size={14} /> TIENDA</button>
        {user && (
          <button onClick={() => setShowReports(true)} className="px-3 py-1 bg-red-600 text-white text-sm font-black rounded flex items-center gap-1 cursor-pointer"><Flag size={14} /> REPORTES</button>
        )}
      </div>

      {/* Grid principal */}
      <div className="grid grid-cols-12 gap-4">
        {/* Sillones */}
        <div className={`${sidebarCollapsed ? 'col-span-1' : 'col-span-3'} transition-all duration-300`}>
          <div className="bg-black/40 border-2 border-gray-800 p-3 rounded-lg h-full">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-sm font-black text-[#D4AF37]"><Users size={14} className="inline mr-1" /> BUTACAS</h2>
              <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="text-gray-500 hover:text-white cursor-pointer">
                {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
              </button>
            </div>
            {!sidebarCollapsed ? (
              <div className="grid grid-cols-1 gap-2 max-h-[600px] overflow-y-auto">
                {seats.map((seatUser, index) => (
                  <AvatarSeat 
                    key={index} 
                    seatNumber={index + 1} 
                    user={seatUser} 
                    isCurrentUser={seatUser?.id === user?.uid} 
                    onSit={() => handleSit(index)} 
                    onLeave={() => handleLeave(index)} 
                    onSendGift={() => { setGiftingTarget(seatUser); setGiftingTargetSeatIndex(index); }} 
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-2 text-center">{seats.filter(Boolean).slice(0,5).map((u, i) => <div key={i} className="text-2xl">{u.avatar}</div>)}</div>
            )}
          </div>
        </div>

        {/* Escenario */}
        <div className={`${sidebarCollapsed ? 'col-span-8' : 'col-span-6'} transition-all duration-300`}>
          <div className="bg-black border-4 border-[#D4AF37] rounded-lg overflow-hidden shadow-xl min-h-[500px]">
            {showPractice && selectedTrack ? (
              <LivePracticeMode trackId={selectedTrack.id} instrumentalUrl={selectedTrack.instrumental_url} onComplete={() => setShowPractice(false)} />
            ) : mode === 'karaoke' ? (
              <div className="p-6 text-center">
                <div className="text-6xl mb-4">🎤</div>
                <h3 className="text-xl font-bold text-[#D4AF37] mb-2">KARAOKE C8L</h3>
                <p className="text-gray-400 mb-6">Selecciona una canción para empezar a cantar</p>
                <div className="grid grid-cols-2 gap-3 max-h-96 overflow-y-auto">
                  {['Bohemian Rhapsody', 'Despacito', 'Shape of You', 'Hotel California'].map(song => (
                    <button key={song} onClick={() => { setSelectedTrack({ id: song, title: song, instrumental_url: '/demo.mp3' }); setShowPractice(true); }} className="bg-gray-900 p-3 rounded-lg text-left hover:bg-gray-800 transition-all cursor-pointer">
                      <div className="font-bold text-white">{song}</div>
                      <div className="text-xs text-gray-500">🎤 +50 coins al completar</div>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <StageVideo currentVideo={null} onPlayVideo={(url) => console.log(url)} />
            )}
          </div>
        </div>

        {/* Panel de actividad en vivo */}
        <div className="col-span-3">
          <LiveActivityPanel onSendGift={(toUserId, giftType) => {
            const targetSeatIndex = seats.findIndex(s => s?.id === toUserId);
            if (targetSeatIndex !== -1) {
              setGiftingTarget(seats[targetSeatIndex]);
              setGiftingTargetSeatIndex(targetSeatIndex);
            }
          }} currentUserId={user?.uid || 'anon'} />
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
                  <h3 className="text-lg font-black text-[#D4AF37]">ENVIAR REGALO</h3>
                  <p className="text-xs text-gray-400">Destinatario: <span className="text-white font-bold">{giftingTarget.name}</span></p>
                </div>
                <button onClick={() => setGiftingTarget(null)} className="text-gray-400 hover:text-white text-xl">✕</button>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-gray-800">
                <button 
                  onClick={() => setGiftTab('real')} 
                  className={`flex-1 py-3 text-sm font-black transition-all ${giftTab === 'real' ? 'bg-[#D4AF37] text-black' : 'bg-black text-gray-400 hover:text-white'}`}
                >
                  Regalos Premium (Coins)
                </button>
                <button 
                  onClick={() => setGiftTab('backpack')} 
                  className={`flex-1 py-3 text-sm font-black transition-all ${giftTab === 'backpack' ? 'bg-purple-700 text-white' : 'bg-black text-gray-400 hover:text-white'}`}
                >
                  Mochila (Sociales)
                </button>
              </div>

              {/* Content */}
              <div className="p-4 max-h-[300px] overflow-y-auto bg-black/20">
                {giftTab === 'real' ? (
                  <div className="grid grid-cols-2 gap-3">
                    {REAL_GIFTS.map(gift => (
                      <button 
                        key={gift.id}
                        onClick={() => handleSendRealGift(gift)}
                        className="bg-black/60 border border-gray-800 hover:border-[#D4AF37] p-3 rounded-lg flex flex-col items-center justify-center transition-all group hover:bg-[#D4AF37]/5"
                      >
                        <span className="text-3xl mb-1 group-hover:scale-110 transition-transform">{gift.emoji}</span>
                        <span className="text-xs font-bold text-white mb-1">{gift.name}</span>
                        <span className="text-[10px] text-[#D4AF37] font-black">{gift.cost} Coins</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {backpackItems.length === 0 ? (
                      <div className="col-span-2 text-center text-xs text-gray-500 py-6">Mochila vacía. ¡Usa el botón de Mochila para llenarla!</div>
                    ) : (
                      backpackItems.map(item => (
                        <button 
                          key={item.id}
                          onClick={() => handleSendBackpackGift(item)}
                          disabled={item.quantity <= 0}
                          className={`bg-black/60 border p-3 rounded-lg flex flex-col items-center justify-center transition-all ${item.quantity > 0 ? 'border-gray-800 hover:border-purple-500 hover:bg-purple-950/20' : 'border-gray-900 opacity-40 cursor-not-allowed'}`}
                        >
                          <span className="text-3xl mb-1">{item.emoji}</span>
                          <span className="text-xs font-bold text-white mb-1 truncate w-full text-center">{item.name}</span>
                          <span className="text-[10px] text-gray-400 mb-1">x{item.quantity} disponibles</span>
                          <span className="text-[9px] text-purple-400 font-bold">+{item.friendshipXp} Amistad</span>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modales */}
      {showFriends && <Modal title="Amigos" onClose={() => setShowFriends(false)}><FriendsSystem currentUserId={user?.uid || ''} currentUserName={user?.displayName || 'Leo'} currentUserAvatar="🎤" onSendGift={()=>{}} onInviteToParty={()=>{}} onChallengeFriend={()=>{}} /></Modal>}
      {showFaction && <Modal title="Bando" onClose={() => setShowFaction(false)}><FactionView userId={user?.uid || ''} factionId="faction_1" onJoin={()=>{}} /></Modal>}
      {showBackpack && <Modal title="Mochila" onClose={() => setShowBackpack(false)}><Backpack userId={user?.uid || ''} currentRoomId="lounge_main" onItemUsed={()=>{}} /></Modal>}
      {showMissions && <Modal title="Misiones" onClose={() => setShowMissions(false)}><DailyMissions userId={user?.uid || ''} userStats={{coversToday:0,giftsSentToday:0,practiceMinutesToday:0,partiesToday:0,friendsOnline:0,winStreak:0,totalCoins:c8lCoins,level:userLevel,xp:userXP,nextLevelXp:1000}} onClaimReward={handleClaimReward} onRefreshMissions={()=>{}} /></Modal>}
      {showEvents && <Modal title="Eventos" onClose={() => setShowEvents(false)}><SpecialEvents userId={user?.uid || ''} userStats={{coversToday:0,giftsSentToday:0,practiceMinutesToday:0,partiesToday:0}} onClaimReward={()=>{}} /></Modal>}
      {showAvatarShop && <Modal title="Tienda de Avatares" onClose={() => setShowAvatarShop(false)}><AvatarMarketplace currentUserId={user?.uid || ''} userCoins={c8lCoins} userDiamonds={0} userLevel={userLevel} userWins={0} userCovers={0} onPurchase={()=>{}} onEquip={()=>{}} /></Modal>}
      {showReports && <Modal title="Centro de Reportes" onClose={() => setShowReports(false)}><ReportSystem currentUserId={user?.uid || 'anonymous'} currentUserRole="moderator" onReportSubmitted={()=>{}} onResolveReport={()=>{}} /></Modal>}
    </div>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 border-4 border-[#D4AF37] w-full max-w-md max-h-[80vh] overflow-y-auto rounded-lg">
        <div className="sticky top-0 bg-gray-900 p-4 border-b border-gray-800 flex justify-between items-center z-10">
          <h3 className="text-xl font-black text-[#D4AF37]">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl cursor-pointer">✕</button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}