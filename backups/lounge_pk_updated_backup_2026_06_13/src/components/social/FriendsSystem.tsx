// components/social/FriendsSystem.tsx
'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, UserPlus, UserMinus, MessageCircle, Gift, Star, 
  Zap, Crown, Heart, Search, Filter, X, Check, Clock,
  Trophy, Music, Mic, Flame, Activity
} from 'lucide-react';

interface Friend {
  id: string;
  name: string;
  avatar: string;
  status: 'online' | 'in_party' | 'singing' | 'offline';
  currentActivity?: string;
  currentScore?: number;
  friendshipDays: number;
  totalGiftsSent: number;
  totalGiftsReceived: number;
  bestScore: number;
  badges: string[];
  lastActive: Date;
}

interface FriendRequest {
  id: string;
  fromUser: {
    id: string;
    name: string;
    avatar: string;
  };
  message?: string;
  sentAt: Date;
}

interface FriendsSystemProps {
  currentUserId: string;
  currentUserName: string;
  currentUserAvatar: string;
  onSendGift: (friendId: string, giftType: string) => void;
  onInviteToParty: (friendId: string) => void;
  onChallengeFriend: (friendId: string) => void;
}

// Datos de ejemplo (en producción vienen de Supabase + WebSocket)
const MOCK_FRIENDS: Friend[] = [
  {
    id: '1',
    name: 'Leo Vela',
    avatar: '🦁',
    status: 'singing',
    currentActivity: '🎤 Cantando Bohemian Rhapsody',
    currentScore: 94,
    friendshipDays: 125,
    totalGiftsSent: 45,
    totalGiftsReceived: 67,
    bestScore: 99,
    badges: ['🏆', '👑', '💎'],
    lastActive: new Date(),
  },
  {
    id: '2',
    name: 'Dj_Rayo',
    avatar: '⚡',
    status: 'online',
    currentActivity: '🎧 En la sala C8L',
    friendshipDays: 89,
    totalGiftsSent: 32,
    totalGiftsReceived: 28,
    bestScore: 96,
    badges: ['⚡', '⭐'],
    lastActive: new Date(),
  },
  {
    id: '3',
    name: 'Reina_Melody',
    avatar: '👑',
    status: 'in_party',
    currentActivity: '🎉 En Modo Fiesta',
    friendshipDays: 67,
    totalGiftsSent: 56,
    totalGiftsReceived: 89,
    bestScore: 98,
    badges: ['👑', '💎', '⭐'],
    lastActive: new Date(),
  },
  {
    id: '4',
    name: 'BeatMaster',
    avatar: '🎧',
    status: 'offline',
    friendshipDays: 34,
    totalGiftsSent: 12,
    totalGiftsReceived: 8,
    bestScore: 92,
    badges: ['⭐'],
    lastActive: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
  },
];

const MOCK_REQUESTS: FriendRequest[] = [
  {
    id: '1',
    fromUser: { id: '5', name: 'Sonic_Flow', avatar: '🎤' },
    message: '¡Hola! Me encantó tu último cover',
    sentAt: new Date(Date.now() - 30 * 60 * 1000),
  },
  {
    id: '2',
    fromUser: { id: '6', name: 'Melody_Star', avatar: '⭐' },
    sentAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
  },
];

export function FriendsSystem({ 
  currentUserId, 
  currentUserName, 
  currentUserAvatar,
  onSendGift,
  onInviteToParty,
  onChallengeFriend
}: FriendsSystemProps) {
  const [friends, setFriends] = useState<Friend[]>(MOCK_FRIENDS);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>(MOCK_REQUESTS);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'online' | 'singing' | 'recent'>('all');
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [friendSearchTerm, setFriendSearchTerm] = useState('');
  const [onlineCount, setOnlineCount] = useState(0);
  
  // WebSocket para actualizaciones en tiempo real
  useEffect(() => {
    const updateOnlineCount = () => {
      const online = friends.filter(f => f.status !== 'offline').length;
      setOnlineCount(online);
    };
    updateOnlineCount();
    
    // Simular WebSocket para cambios de estado
    const interval = setInterval(() => {
      setFriends(prev => prev.map(friend => ({
        ...friend,
        status: Math.random() > 0.8 
          ? (['online', 'singing', 'in_party', 'offline'][Math.floor(Math.random() * 4)] as any)
          : friend.status
      })));
    }, 30000);
    
    return () => clearInterval(interval);
  }, [friends]);
  
  const filteredFriends = friends
    .filter(friend => {
      if (filter === 'online') return friend.status !== 'offline';
      if (filter === 'singing') return friend.status === 'singing';
      if (filter === 'recent') return friend.friendshipDays <= 30;
      return true;
    })
    .filter(friend => 
      friend.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  
  const getStatusColor = (status: string) => {
    switch(status) {
      case 'online': return 'bg-green-500';
      case 'singing': return 'bg-[#00F3FF]';
      case 'in_party': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };
  
  const getStatusText = (status: string) => {
    switch(status) {
      case 'online': return 'En línea';
      case 'singing': return 'Cantando';
      case 'in_party': return 'En fiesta';
      default: return 'Desconectado';
    }
  };
  
  const acceptRequest = (requestId: string) => {
    const request = friendRequests.find(r => r.id === requestId);
    if (request) {
      setFriends(prev => [...prev, {
        id: request.fromUser.id,
        name: request.fromUser.name,
        avatar: request.fromUser.avatar,
        status: 'online',
        friendshipDays: 0,
        totalGiftsSent: 0,
        totalGiftsReceived: 0,
        bestScore: 0,
        badges: [],
        lastActive: new Date(),
      }]);
      setFriendRequests(prev => prev.filter(r => r.id !== requestId));
    }
  };
  
  const declineRequest = (requestId: string) => {
    setFriendRequests(prev => prev.filter(r => r.id !== requestId));
  };
  
  const sendFriendRequest = (userName: string) => {
    // Simular envío (en producción, API call)
    alert(`✅ Solicitud enviada a ${userName}`);
    setShowAddFriend(false);
    setFriendSearchTerm('');
  };
  
  return (
    <div className="bg-black border-4 border-[#D4AF37] h-full flex flex-col">
      
      {/* Header */}
      <div className="p-4 border-b border-gray-800">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-black text-[#D4AF37] flex items-center gap-2">
            <Users size={18} /> AMIGOS
            <span className="text-sm text-gray-500">({friends.length})</span>
          </h3>
          <button
            onClick={() => setShowAddFriend(true)}
            className="px-3 py-1 bg-[#D4AF37] text-black text-sm font-black rounded flex items-center gap-1"
          >
            <UserPlus size={14} /> AÑADIR
          </button>
        </div>
        
        {/* Filtros rápidos */}
        <div className="flex gap-2 mb-3">
          {[
            { id: 'all', label: 'Todos', icon: <Users size={12} /> },
            { id: 'online', label: `En línea (${onlineCount})`, icon: <Activity size={12} /> },
            { id: 'singing', label: 'Cantando', icon: <Mic size={12} /> },
            { id: 'recent', label: 'Recientes', icon: <Clock size={12} /> },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id as any)}
              className={`px-2 py-1 text-xs rounded flex items-center gap-1 transition-all ${
                filter === f.id
                  ? 'bg-[#D4AF37] text-black'
                  : 'bg-gray-900 text-gray-400 hover:bg-gray-800'
              }`}
            >
              {f.icon}
              {f.label}
            </button>
          ))}
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Buscar amigo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-gray-900 border border-gray-700 rounded-lg py-1.5 pl-9 pr-3 text-sm text-white placeholder-gray-500"
          />
        </div>
      </div>
      
      {/* Friend Requests */}
      {friendRequests.length > 0 && (
        <div className="p-4 border-b border-gray-800">
          <div className="text-xs text-[#D4AF37] mb-2">SOLICITUDES PENDIENTES ({friendRequests.length})</div>
          {friendRequests.map(request => (
            <div key={request.id} className="bg-gray-900 p-2 rounded-lg mb-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{request.fromUser.avatar}</span>
                  <div>
                    <div className="font-bold text-sm">{request.fromUser.name}</div>
                    {request.message && (
                      <div className="text-xs text-gray-500">{request.message}</div>
                    )}
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => acceptRequest(request.id)}
                    className="p-1 bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    <Check size={14} />
                  </button>
                  <button
                    onClick={() => declineRequest(request.id)}
                    className="p-1 bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Lista de amigos */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {filteredFriends.map(friend => (
          <motion.div
            key={friend.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.02 }}
            onClick={() => setSelectedFriend(friend)}
            className="bg-gray-900/50 p-3 rounded-lg cursor-pointer hover:bg-gray-800 transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="text-3xl">{friend.avatar}</div>
                <div className={`absolute -bottom-1 -right-1 w-2.5 h-2.5 rounded-full ${getStatusColor(friend.status)} ring-1 ring-black`} />
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white">{friend.name}</span>
                  {friend.badges.slice(0, 2).map((badge, i) => (
                    <span key={i} className="text-xs">{badge}</span>
                  ))}
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className={`text-${getStatusColor(friend.status).replace('bg-', '')}`}>
                    {getStatusText(friend.status)}
                  </span>
                  {friend.currentActivity && (
                    <>
                      <span className="text-gray-600">•</span>
                      <span className="text-gray-500">{friend.currentActivity}</span>
                    </>
                  )}
                </div>
              </div>
              
              <div className="flex gap-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSendGift(friend.id, '🌹');
                  }}
                  className="p-1.5 bg-[#D4AF37]/20 rounded hover:bg-[#D4AF37]/40 transition-all"
                >
                  <Gift size={14} className="text-[#D4AF37]" />
                </button>
                {friend.status !== 'offline' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onInviteToParty(friend.id);
                    }}
                    className="p-1.5 bg-purple-600/20 rounded hover:bg-purple-600/40 transition-all"
                  >
                    <Users size={14} className="text-purple-400" />
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
      
      {/* Modal de detalles del amigo */}
      <AnimatePresence>
        {selectedFriend && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedFriend(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 30 }}
              className="bg-gradient-to-b from-gray-900 to-black border-4 border-[#D4AF37] max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 text-center border-b border-gray-800">
                <div className="text-6xl mb-2">{selectedFriend.avatar}</div>
                <h3 className="text-xl font-black text-white">{selectedFriend.name}</h3>
                <div className="flex justify-center gap-1 mt-1">
                  {selectedFriend.badges.map((badge, i) => (
                    <span key={i} className="text-lg">{badge}</span>
                  ))}
                </div>
                <div className={`inline-block px-3 py-1 rounded-full text-xs font-bold mt-2 ${getStatusColor(selectedFriend.status)} text-white`}>
                  {getStatusText(selectedFriend.status)}
                </div>
              </div>
              
              <div className="p-6 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-black/50 p-2 rounded text-center">
                    <div className="text-2xl font-black text-[#D4AF37]">{selectedFriend.bestScore}%</div>
                    <div className="text-xs text-gray-500">Mejor puntuación</div>
                  </div>
                  <div className="bg-black/50 p-2 rounded text-center">
                    <div className="text-2xl font-black text-[#D4AF37]">{selectedFriend.friendshipDays}</div>
                    <div className="text-xs text-gray-500">Días de amistad</div>
                  </div>
                  <div className="bg-black/50 p-2 rounded text-center">
                    <div className="text-2xl font-black text-green-400">{selectedFriend.totalGiftsReceived}</div>
                    <div className="text-xs text-gray-500">Regalos recibidos</div>
                  </div>
                  <div className="bg-black/50 p-2 rounded text-center">
                    <div className="text-2xl font-black text-[#D4AF37]">{selectedFriend.totalGiftsSent}</div>
                    <div className="text-xs text-gray-500">Regalos enviados</div>
                  </div>
                </div>
              </div>
              
              <div className="p-6 pt-0 flex gap-2">
                <button
                  onClick={() => {
                    onSendGift(selectedFriend.id, '🌹');
                    setSelectedFriend(null);
                  }}
                  className="flex-1 py-2 bg-[#D4AF37] text-black font-black text-sm flex items-center justify-center gap-1"
                >
                  <Gift size={14} /> ENVIAR REGALO
                </button>
                {selectedFriend.status !== 'offline' && (
                  <>
                    <button
                      onClick={() => {
                        onInviteToParty(selectedFriend.id);
                        setSelectedFriend(null);
                      }}
                      className="flex-1 py-2 bg-purple-600 text-white font-black text-sm flex items-center justify-center gap-1"
                    >
                      <Users size={14} /> INVITAR
                    </button>
                    <button
                      onClick={() => {
                        onChallengeFriend(selectedFriend.id);
                        setSelectedFriend(null);
                      }}
                      className="flex-1 py-2 bg-[#FF0055] text-white font-black text-sm flex items-center justify-center gap-1"
                    >
                      <Trophy size={14} /> DESAFIAR
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Modal de añadir amigo */}
      <AnimatePresence>
        {showAddFriend && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
            onClick={() => setShowAddFriend(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 30 }}
              className="bg-gray-900 border-4 border-[#D4AF37] max-w-md w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-black text-[#D4AF37] mb-4">AÑADIR AMIGO</h3>
              
              <input
                type="text"
                placeholder="Nombre de usuario o email"
                value={friendSearchTerm}
                onChange={(e) => setFriendSearchTerm(e.target.value)}
                className="w-full bg-black border-2 border-gray-700 p-3 text-white mb-4"
              />
              
              <div className="flex gap-3">
                <button
                  onClick={() => sendFriendRequest(friendSearchTerm)}
                  disabled={!friendSearchTerm.trim()}
                  className="flex-1 py-2 bg-[#D4AF37] text-black font-black disabled:opacity-50"
                >
                  ENVIAR SOLICITUD
                </button>
                <button
                  onClick={() => setShowAddFriend(false)}
                  className="flex-1 py-2 bg-gray-800 text-white font-black"
                >
                  CANCELAR
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
    </div>
  );
}