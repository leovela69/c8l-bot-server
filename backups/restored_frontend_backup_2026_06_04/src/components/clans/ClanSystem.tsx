// components/clans/ClanSystem.tsx
'use client';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, Users, Trophy, MessageCircle, Gift, Crown, 
  Star, Zap, Flame, Diamond, Sword, Target, Heart,
  Send, Plus, Settings, LogOut, Check, X, Clock,
  Medal, Award, TrendingUp, Calendar, Music, Mic
} from 'lucide-react';

interface Clan {
  id: string;
  name: string;
  tag: string;
  emblem: string;
  level: number;
  members: ClanMember[];
  totalPoints: number;
  rank: number;
  wins: number;
  losses: number;
  createdAt: Date;
  motto: string;
  requiredLevel: number;
  isOpen: boolean;
}

interface ClanMember {
  id: string;
  name: string;
  avatar: string;
  role: 'leader' | 'co_leader' | 'elite' | 'member' | 'recruit';
  joinDate: Date;
  totalPoints: number;
  weeklyPoints: number;
  giftsSent: number;
  lastActive: Date;
  isOnline: boolean;
}

interface ClanMessage {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  message: string;
  timestamp: Date;
  isPinned: boolean;
}

interface ClanTournament {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  participants: string[];
  winner?: string;
  prize: number;
  status: 'upcoming' | 'active' | 'completed';
}

interface ClanSystemProps {
  currentUserId: string;
  currentUserName: string;
  currentUserAvatar: string;
  currentUserLevel: number;
  onSendGift: (toUserId: string, giftType: string) => void;
  onJoinClan: (clanId: string) => void;
  onCreateClan: (clanName: string, clanTag: string, emblem: string) => void;
}

// Datos de ejemplo (en producción vienen de Supabase)
const MOCK_CLANS: Clan[] = [
  {
    id: '1',
    name: 'Los Inmortales',
    tag: 'L.I.',
    emblem: '👑',
    level: 15,
    members: [],
    totalPoints: 125000,
    rank: 1,
    wins: 128,
    losses: 42,
    createdAt: new Date(2024, 0, 1),
    motto: '¡La gloria es para siempre!',
    requiredLevel: 10,
    isOpen: true,
  },
  {
    id: '2',
    name: 'Ritmo Salvaje',
    tag: 'R.S.',
    emblem: '⚡',
    level: 12,
    members: [],
    totalPoints: 98700,
    rank: 2,
    wins: 98,
    losses: 35,
    createdAt: new Date(2024, 1, 15),
    motto: 'Más rápido, más fuerte',
    requiredLevel: 8,
    isOpen: true,
  },
  {
    id: '3',
    name: 'Melodías Eternas',
    tag: 'M.E.',
    emblem: '🎵',
    level: 10,
    members: [],
    totalPoints: 78400,
    rank: 3,
    wins: 76,
    losses: 28,
    createdAt: new Date(2024, 2, 10),
    motto: 'La música nos une',
    requiredLevel: 5,
    isOpen: true,
  },
];

const getMockClanMembers = (
  currentUserId: string,
  currentUserName: string,
  currentUserAvatar: string
): Record<string, ClanMember[]> => ({
  '1': [
    { id: '1', name: 'Leo Vela', avatar: '🦁', role: 'leader', joinDate: new Date(2024, 0, 1), totalPoints: 45000, weeklyPoints: 3200, giftsSent: 89, lastActive: new Date(), isOnline: true },
    { id: '2', name: 'Dj_Rayo', avatar: '⚡', role: 'co_leader', joinDate: new Date(2024, 0, 5), totalPoints: 32000, weeklyPoints: 2800, giftsSent: 56, lastActive: new Date(), isOnline: true },
    { id: '3', name: 'Reina_Melody', avatar: '👑', role: 'elite', joinDate: new Date(2024, 0, 10), totalPoints: 28000, weeklyPoints: 2100, giftsSent: 45, lastActive: new Date(), isOnline: false },
    { id: currentUserId, name: currentUserName, avatar: currentUserAvatar, role: 'member', joinDate: new Date(), totalPoints: 5000, weeklyPoints: 800, giftsSent: 12, lastActive: new Date(), isOnline: true },
  ],
});

const MOCK_CLAN_MESSAGES: Record<string, ClanMessage[]> = {
  '1': [
    { id: '1', userId: '1', userName: 'Leo Vela', userAvatar: '🦁', message: '¡Bienvenidos al clan! Esta semana vamos por el torneo', timestamp: new Date(Date.now() - 3600000), isPinned: true },
    { id: '2', userId: '2', userName: 'Dj_Rayo', userAvatar: '⚡', message: '¿Alguien para practicar duetos?', timestamp: new Date(Date.now() - 1800000), isPinned: false },
    { id: '3', userId: '3', userName: 'Reina_Melody', userAvatar: '👑', message: 'Yo me apunto para más tarde', timestamp: new Date(Date.now() - 900000), isPinned: false },
  ],
};

const CLAN_TOURNAMENTS: ClanTournament[] = [
  { id: '1', name: 'Torneo de Primavera', startDate: new Date(2024, 5, 1), endDate: new Date(2024, 5, 7), participants: ['1', '2', '3'], prize: 10000, status: 'completed', winner: '1' },
  { id: '2', name: 'Copa C8L', startDate: new Date(2024, 5, 15), endDate: new Date(2024, 5, 21), participants: ['1', '2'], prize: 15000, status: 'active' },
];

export function ClanSystem({ 
  currentUserId, 
  currentUserName, 
  currentUserAvatar, 
  currentUserLevel,
  onSendGift,
  onJoinClan,
  onCreateClan
}: ClanSystemProps) {
  const [myClan, setMyClan] = useState<Clan | null>(null);
  const [clans, setClans] = useState<Clan[]>(MOCK_CLANS);
  const [members, setMembers] = useState<ClanMember[]>([]);
  const [messages, setMessages] = useState<ClanMessage[]>([]);
  const [tournaments, setTournaments] = useState<ClanTournament[]>(CLAN_TOURNAMENTS);
  const [activeTab, setActiveTab] = useState<'home' | 'members' | 'chat' | 'tournaments' | 'ranking'>('home');
  const [newMessage, setNewMessage] = useState('');
  const [showCreateClan, setShowCreateClan] = useState(false);
  const [newClanName, setNewClanName] = useState('');
  const [newClanTag, setNewClanTag] = useState('');
  const [selectedEmblem, setSelectedEmblem] = useState('🏆');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const emblems = ['🏆', '👑', '⚡', '🎵', '🎤', '🔥', '💎', '⭐', '🛡️', '⚔️'];
  
  useEffect(() => {
    // Cargar clan del usuario si existe
    const userClan = clans.find(c => c.members.some(m => m.id === currentUserId));
    if (userClan) {
      setMyClan(userClan);
      setMembers(getMockClanMembers(currentUserId, currentUserName, currentUserAvatar)[userClan.id] || []);
      setMessages(MOCK_CLAN_MESSAGES[userClan.id] || []);
    }
  }, [currentUserId, currentUserName, currentUserAvatar, clans]);
  
  const sendMessage = () => {
    if (!newMessage.trim() || !myClan) return;
    
    const message: ClanMessage = {
      id: Date.now().toString(),
      userId: currentUserId,
      userName: currentUserName,
      userAvatar: currentUserAvatar,
      message: newMessage,
      timestamp: new Date(),
      isPinned: false,
    };
    
    setMessages(prev => [...prev, message]);
    setNewMessage('');
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };
  
  const getRoleColor = (role: string) => {
    switch(role) {
      case 'leader': return 'text-[#D4AF37]';
      case 'co_leader': return 'text-[#00F3FF]';
      case 'elite': return 'text-purple-400';
      default: return 'text-gray-400';
    }
  };
  
  const getRoleIcon = (role: string) => {
    switch(role) {
      case 'leader': return '👑';
      case 'co_leader': return '⭐';
      case 'elite': return '💎';
      default: return '👤';
    }
  };
  
  const totalWeeklyPoints = members.reduce((acc, m) => acc + m.weeklyPoints, 0);
  
  return (
    <div className="bg-black border-4 border-[#D4AF37] h-full flex flex-col">
      
      {!myClan ? (
        // No estás en ningún clan
        <div className="p-6 text-center">
          <div className="text-6xl mb-4">🏰</div>
          <h3 className="text-xl font-black text-[#D4AF37] mb-2">ÚNETE A UN CLAN</h3>
          <p className="text-gray-400 text-sm mb-6">Forma parte de una hermandad, participa en torneos exclusivos y gana recompensas épicas</p>
          
          <button
            onClick={() => setShowCreateClan(true)}
            className="w-full py-3 bg-[#D4AF37] text-black font-black mb-4 border-2 border-black"
          >
            ✨ CREAR CLAN (1000 COINS)
          </button>
          
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {clans.map(clan => (
              <div key={clan.id} className="bg-gray-900 p-4 rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-3xl">{clan.emblem}</span>
                    <div>
                      <div className="font-bold text-white">{clan.name}</div>
                      <div className="text-xs text-gray-500">[{clan.tag}]</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-[#D4AF37]">Nv. {clan.level}</div>
                    <div className="text-xs text-gray-500">#{clan.rank} global</div>
                  </div>
                </div>
                
                <div className="text-xs text-gray-400 mb-3">{clan.motto}</div>
                
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2 text-xs">
                    <Users size={12} />
                    <span>{clan.members.length} miembros</span>
                    <Trophy size={12} className="ml-2" />
                    <span>{clan.wins}V</span>
                  </div>
                  {currentUserLevel >= clan.requiredLevel ? (
                    <button
                      onClick={() => {
                        onJoinClan(clan.id);
                        setMyClan(clan);
                      }}
                      className="px-4 py-1 bg-[#00F3FF] text-black text-xs font-bold rounded"
                    >
                      UNIRSE
                    </button>
                  ) : (
                    <div className="text-xs text-gray-500">Requiere nivel {clan.requiredLevel}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        // Vista del clan
        <>
          {/* Header del clan */}
          <div className="bg-gradient-to-r from-[#D4AF37]/20 to-transparent p-4 border-b border-gray-800">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="text-5xl">{myClan.emblem}</div>
                <div>
                  <h2 className="text-2xl font-black text-white">{myClan.name}</h2>
                  <p className="text-xs text-gray-400">[{myClan.tag}] • Nivel {myClan.level}</p>
                  <p className="text-sm text-[#D4AF37] mt-1">{myClan.motto}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-black text-[#D4AF37]">#{myClan.rank}</div>
                <div className="text-xs text-gray-500">Ranking global</div>
              </div>
            </div>
            
            {/* Stats rápidas */}
            <div className="grid grid-cols-3 gap-3 mt-4">
              <div className="bg-black/50 p-2 rounded text-center">
                <div className="text-lg font-black text-[#D4AF37]">{members.length}</div>
                <div className="text-[10px] text-gray-500">Miembros</div>
              </div>
              <div className="bg-black/50 p-2 rounded text-center">
                <div className="text-lg font-black text-[#D4AF37]">{myClan.wins}</div>
                <div className="text-[10px] text-gray-500">Victorias</div>
              </div>
              <div className="bg-black/50 p-2 rounded text-center">
                <div className="text-lg font-black text-[#D4AF37]">{totalWeeklyPoints}</div>
                <div className="text-[10px] text-gray-500">Pts/semana</div>
              </div>
            </div>
          </div>
          
          {/* Tabs */}
          <div className="flex border-b border-gray-800">
            {[
              { id: 'home', label: 'INICIO', icon: <Shield size={14} /> },
              { id: 'members', label: 'MIEMBROS', icon: <Users size={14} /> },
              { id: 'chat', label: 'CHAT', icon: <MessageCircle size={14} /> },
              { id: 'tournaments', label: 'TORNEOS', icon: <Trophy size={14} /> },
              { id: 'ranking', label: 'RANKING', icon: <Medal size={14} /> },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 py-2 text-xs font-black flex items-center justify-center gap-1 transition-all ${
                  activeTab === tab.id
                    ? 'bg-[#D4AF37] text-black'
                    : 'text-gray-500 hover:text-[#D4AF37]'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
          
          {/* Contenido de tabs */}
          <div className="flex-1 overflow-y-auto p-4">
            
            {/* Tab Home */}
            {activeTab === 'home' && (
              <div className="space-y-4">
                <div className="bg-gray-900 p-3 rounded-lg">
                  <h4 className="text-[#D4AF37] font-black text-sm mb-2 flex items-center gap-2">
                    <Trophy size={14} /> EVENTO ACTIVO
                  </h4>
                  {tournaments.find(t => t.status === 'active') ? (
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-bold text-white">{tournaments.find(t => t.status === 'active')?.name}</div>
                        <div className="text-xs text-gray-400">Premio: {tournaments.find(t => t.status === 'active')?.prize} coins</div>
                      </div>
                      <button className="px-3 py-1 bg-[#D4AF37] text-black text-xs font-bold rounded">
                        PARTICIPAR
                      </button>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-400">No hay eventos activos actualmente</div>
                  )}
                </div>
                
                <div className="bg-gray-900 p-3 rounded-lg">
                  <h4 className="text-[#D4AF37] font-black text-sm mb-2 flex items-center gap-2">
                    <Target size={14} /> MISIÓN DEL CLAN
                  </h4>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Alcanzar 10,000 puntos semanales</span>
                    <span className="text-[#D4AF37]">{totalWeeklyPoints}/10000</span>
                  </div>
                  <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-[#00F3FF] to-[#D4AF37]" style={{ width: `${(totalWeeklyPoints / 10000) * 100}%` }} />
                  </div>
                  <div className="text-xs text-gray-500 mt-2">Recompensa: 2000 coins para el clan</div>
                </div>
                
                <div className="bg-gray-900 p-3 rounded-lg">
                  <h4 className="text-[#D4AF37] font-black text-sm mb-2 flex items-center gap-2">
                    <Star size={14} /> MIEMBRO DESTACADO
                  </h4>
                  {members.sort((a, b) => b.weeklyPoints - a.weeklyPoints)[0] && (
                    <div className="flex items-center gap-3">
                      <div className="text-3xl">{members[0].avatar}</div>
                      <div>
                        <div className="font-bold text-white">{members[0].name}</div>
                        <div className="text-xs text-[#D4AF37]">{members[0].weeklyPoints} pts esta semana</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Tab Miembros */}
            {activeTab === 'members' && (
              <div className="space-y-2">
                {members.map(member => (
                  <div key={member.id} className="bg-gray-900 p-3 rounded-lg flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="text-3xl">{member.avatar}</div>
                        {member.isOnline && (
                          <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 bg-green-500 rounded-full" />
                        )}
                      </div>
                      <div>
                        <div className="font-bold text-white flex items-center gap-1">
                          {member.name}
                          <span className={`text-sm ${getRoleColor(member.role)}`}>{getRoleIcon(member.role)}</span>
                        </div>
                        <div className="flex gap-3 text-xs text-gray-500">
                          <span>📅 {member.joinDate.toLocaleDateString()}</span>
                          <span>🎁 {member.giftsSent}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-[#D4AF37]">{member.weeklyPoints} pts</div>
                      <div className="text-xs text-gray-500">esta semana</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* Tab Chat */}
            {activeTab === 'chat' && (
              <div className="flex flex-col h-full">
                <div className="flex-1 space-y-2 mb-4 max-h-96 overflow-y-auto">
                  {messages.map(msg => (
                    <div key={msg.id} className={`flex gap-2 ${msg.userId === currentUserId ? 'flex-row-reverse' : ''}`}>
                      <div className="text-2xl">{msg.userAvatar}</div>
                      <div className={`max-w-[80%] ${msg.userId === currentUserId ? 'bg-[#D4AF37]/20' : 'bg-gray-900'} p-2 rounded-lg`}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-sm">{msg.userName}</span>
                          <span className="text-[10px] text-gray-500">{msg.timestamp.toLocaleTimeString()}</span>
                        </div>
                        <p className="text-sm">{msg.message}</p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
                
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="Escribe un mensaje..."
                    className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white"
                  />
                  <button onClick={sendMessage} className="px-4 py-2 bg-[#D4AF37] text-black font-black rounded">
                    <Send size={16} />
                  </button>
                </div>
              </div>
            )}
            
            {/* Tab Torneos */}
            {activeTab === 'tournaments' && (
              <div className="space-y-3">
                {tournaments.map(t => (
                  <div key={t.id} className={`bg-gray-900 p-3 rounded-lg ${t.status === 'active' ? 'border-l-4 border-[#D4AF37]' : ''}`}>
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="font-bold text-white">{t.name}</div>
                        <div className="text-xs text-gray-500">{t.startDate.toLocaleDateString()} - {t.endDate.toLocaleDateString()}</div>
                      </div>
                      <div className={`px-2 py-1 text-xs rounded ${
                        t.status === 'active' ? 'bg-green-600' : 
                        t.status === 'completed' ? 'bg-gray-600' : 'bg-[#D4AF37]'
                      } text-white`}>
                        {t.status === 'active' ? 'EN CURSO' : t.status === 'completed' ? 'FINALIZADO' : 'PRÓXIMO'}
                      </div>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>🏆 Premio: {t.prize} coins</span>
                      <span>👥 {t.participants.length} clanes</span>
                    </div>
                    {t.status === 'active' && (
                      <button className="w-full mt-3 py-2 bg-[#D4AF37] text-black font-black text-sm rounded">
                        PARTICIPAR
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
            
            {/* Tab Ranking */}
            {activeTab === 'ranking' && (
              <div className="space-y-2">
                {members.sort((a, b) => b.totalPoints - a.totalPoints).map((member, idx) => (
                  <div key={member.id} className="bg-gray-900 p-3 rounded-lg flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <span className="w-8 text-center font-black text-[#D4AF37]">
                        {idx === 0 ? '👑' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx+1}°`}
                      </span>
                      <div className="text-2xl">{member.avatar}</div>
                      <div className="font-bold text-white">{member.name}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-[#D4AF37]">{member.totalPoints.toLocaleString()}</div>
                      <div className="text-xs text-gray-500">pts totales</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
          </div>
        </>
      )}
      
      {/* Modal crear clan */}
      <AnimatePresence>
        {showCreateClan && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
            onClick={() => setShowCreateClan(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 30 }}
              className="bg-gray-900 border-4 border-[#D4AF37] max-w-md w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-black text-[#D4AF37] mb-4">CREAR CLAN</h3>
              
              <div className="mb-4">
                <div className="text-sm text-gray-400 mb-2">Emblema</div>
                <div className="grid grid-cols-5 gap-2">
                  {emblems.map(em => (
                    <button
                      key={em}
                      onClick={() => setSelectedEmblem(em)}
                      className={`text-3xl p-2 border-2 rounded transition-all ${
                        selectedEmblem === em ? 'border-[#D4AF37] bg-[#D4AF37]/20' : 'border-gray-700'
                      }`}
                    >
                      {em}
                    </button>
                  ))}
                </div>
              </div>
              
              <input
                type="text"
                placeholder="Nombre del clan"
                value={newClanName}
                onChange={(e) => setNewClanName(e.target.value)}
                className="w-full bg-black border-2 border-gray-700 p-3 text-white mb-3"
                maxLength={20}
              />
              
              <input
                type="text"
                placeholder="Tag (3-5 caracteres)"
                value={newClanTag}
                onChange={(e) => setNewClanTag(e.target.value.toUpperCase())}
                className="w-full bg-black border-2 border-gray-700 p-3 text-white mb-4"
                maxLength={5}
              />
              
              <div className="flex gap-3">
                <button
                  onClick={() => onCreateClan(newClanName, newClanTag, selectedEmblem)}
                  className="flex-1 py-3 bg-[#D4AF37] text-black font-black"
                  disabled={!newClanName || !newClanTag}
                >
                  CREAR (1000 COINS)
                </button>
                <button
                  onClick={() => setShowCreateClan(false)}
                  className="flex-1 py-3 bg-gray-800 text-white font-black"
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