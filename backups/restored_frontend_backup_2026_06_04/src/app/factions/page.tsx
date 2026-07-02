'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, Users, TrendingUp, Gift, MessageCircle, Crown, Star, 
  Zap, Sword, Award, Plus, LogOut, ArrowRight, DollarSign 
} from 'lucide-react';
import { useApp } from '@/context/AppContext';

interface FactionMember {
  id: string;
  name: string;
  role: 'warlord' | 'captain' | 'member';
  avatar: string;
  level: number;
  contribution: number;
}

interface FactionMission {
  id: string;
  title: string;
  progress: number;
  target: number;
  rewardXP: number;
  rewardCoins: number;
}

interface Faction {
  id: string;
  name: string;
  emblem: string;
  level: number;
  xp: number;
  xpToNext: number;
  description: string;
  color: string;
  members: FactionMember[];
  missions: FactionMission[];
}

const DEFAULT_FACTIONS: Faction[] = [
  {
    id: 'f_1',
    name: 'GUERREROS DEL RITMO',
    emblem: '⚔️',
    level: 12,
    xp: 3400,
    xpToNext: 5000,
    description: 'La vanguardia de la música y el freestyle. Ritmos duros y líricas afiladas.',
    color: '#FF0055',
    members: [
      { id: 'm_1', name: 'Leo Vela', role: 'warlord', avatar: '🦁', level: 42, contribution: 500 },
      { id: 'm_2', name: 'Dj Rayo', role: 'captain', avatar: '⚡', level: 35, contribution: 320 },
      { id: 'm_3', name: 'Reina Melody', role: 'member', avatar: '👑', level: 28, contribution: 180 },
      { id: 'm_4', name: 'Beat Master', role: 'member', avatar: '🎧', level: 20, contribution: 90 }
    ],
    missions: [
      { id: 'mis_1', title: 'Grabar covers en grupo', progress: 3, target: 5, rewardXP: 400, rewardCoins: 100 },
      { id: 'mis_2', title: 'Aportar Coins al cofre bando', progress: 650, target: 1000, rewardXP: 600, rewardCoins: 150 },
      { id: 'mis_3', title: 'Ganar batallas en el Lounge', progress: 1, target: 3, rewardXP: 300, rewardCoins: 80 }
    ]
  },
  {
    id: 'f_2',
    name: 'DEFENSORES DE LA ARMONÍA',
    emblem: '🛡️',
    level: 10,
    xp: 1200,
    xpToNext: 4000,
    description: 'Buscamos la perfección vocal y las melodías más puras del multiverso.',
    color: '#00F3FF',
    members: [
      { id: 'm_5', name: 'Vocal Queen', role: 'warlord', avatar: '🦄', level: 40, contribution: 450 },
      { id: 'm_6', name: 'Aria Silver', role: 'captain', avatar: '✨', level: 31, contribution: 290 },
      { id: 'm_7', name: 'Soprano King', role: 'member', avatar: '🎤', level: 25, contribution: 150 }
    ],
    missions: [
      { id: 'mis_4', title: 'Completar 10 prácticas en lounge', progress: 7, target: 10, rewardXP: 500, rewardCoins: 120 },
      { id: 'mis_5', title: 'Enviar 50 regalos entre miembros', progress: 34, target: 50, rewardXP: 800, rewardCoins: 200 }
    ]
  },
  {
    id: 'f_3',
    name: 'EL CLAN DEL ECO',
    emblem: '🏰',
    level: 8,
    xp: 1500,
    xpToNext: 3000,
    description: 'Dominamos los efectos acústicos y reverberaciones digitales. El futuro está en los bytes.',
    color: '#9B59B6',
    members: [
      { id: 'm_8', name: 'Echo Lord', role: 'warlord', avatar: '👽', level: 38, contribution: 400 },
      { id: 'm_9', name: 'Delay Queen', role: 'captain', avatar: '🌀', level: 30, contribution: 210 }
    ],
    missions: [
      { id: 'mis_6', title: 'Superar puntuación 95 en Karaoke', progress: 1, target: 2, rewardXP: 450, rewardCoins: 90 },
      { id: 'mis_7', title: 'Mantener sala llena 30 minutos', progress: 15, target: 30, rewardXP: 700, rewardCoins: 180 }
    ]
  }
];

export default function FactionsPage() {
  const { user, c8lCoins, deductCCoins, showNotification } = useApp();
  const [factions, setFactions] = useState<Faction[]>(DEFAULT_FACTIONS);
  const [joinedFactionId, setJoinedFactionId] = useState<string | null>(null);
  
  // Custom faction form state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newFactionName, setNewFactionName] = useState('');
  const [newFactionEmblem, setNewFactionEmblem] = useState('🛸');
  const [newFactionDesc, setNewFactionDesc] = useState('');
  const [newFactionColor, setNewFactionColor] = useState('#FFD700');

  // Private chat feed
  const [messages, setMessages] = useState<{ id: string; user: string; text: string; time: string; avatar: string }[]>([]);
  const [chatInput, setChatInput] = useState('');

  // Initial load
  useEffect(() => {
    // Factions state
    const savedFactions = localStorage.getItem('c8l_factions_list');
    if (savedFactions) {
      try {
        setFactions(JSON.parse(savedFactions));
      } catch (e) {}
    } else {
      localStorage.setItem('c8l_factions_list', JSON.stringify(DEFAULT_FACTIONS));
    }

    // Joined state
    const savedJoined = localStorage.getItem('c8l_joined_faction');
    if (savedJoined) {
      setJoinedFactionId(savedJoined);
    }
  }, []);

  // Update chat feed for the joined faction
  useEffect(() => {
    if (joinedFactionId) {
      const savedChat = localStorage.getItem(`c8l_faction_chat_${joinedFactionId}`);
      if (savedChat) {
        try {
          setMessages(JSON.parse(savedChat));
        } catch (e) {}
      } else {
        // Initial simulated messages
        const initial = [
          { id: '1', user: 'Dj Rayo', text: '¡Bienvenidos todos a las batallas de covers de esta semana! 🔥', time: '14:23', avatar: '⚡' },
          { id: '2', user: 'Reina Melody', text: '¿Quién se apunta a practicar karaoke hoy en la noche?', time: '15:10', avatar: '👑' },
        ];
        setMessages(initial);
        localStorage.setItem(`c8l_faction_chat_${joinedFactionId}`, JSON.stringify(initial));
      }
    }
  }, [joinedFactionId]);

  const activeFaction = factions.find(f => f.id === joinedFactionId);

  const handleJoin = (factionId: string) => {
    if (!user) {
      showNotification("Por favor, inicia sesión para unirte a un bando.", "error");
      return;
    }
    
    // Add current user to faction members list locally if not present
    const updated = factions.map(f => {
      if (f.id === factionId) {
        const memberExists = f.members.some(m => m.id === user.uid);
        if (!memberExists) {
          return {
            ...f,
            members: [
              ...f.members,
              { id: user.uid, name: user.displayName || 'Leo Vela', role: 'member' as const, avatar: '🎤', level: 1, contribution: 0 }
            ]
          };
        }
      }
      return f;
    });

    setFactions(updated);
    localStorage.setItem('c8l_factions_list', JSON.stringify(updated));
    setJoinedFactionId(factionId);
    localStorage.setItem('c8l_joined_faction', factionId);
    showNotification(`¡Te has unido con éxito al bando!`, "success");
  };

  const handleLeave = () => {
    if (!joinedFactionId || !user) return;
    
    // Remove user from the member list
    const updated = factions.map(f => {
      if (f.id === joinedFactionId) {
        return {
          ...f,
          members: f.members.filter(m => m.id !== user.uid)
        };
      }
      return f;
    });

    setFactions(updated);
    localStorage.setItem('c8l_factions_list', JSON.stringify(updated));
    setJoinedFactionId(null);
    localStorage.removeItem('c8l_joined_faction');
    showNotification("Has abandonado el bando.", "info");
  };

  const handleCreateFaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      showNotification("Inicia sesión primero.", "error");
      return;
    }
    if (!newFactionName || !newFactionDesc) {
      showNotification("Completa todos los campos.", "error");
      return;
    }

    const newFaction: Faction = {
      id: `f_custom_${Date.now()}`,
      name: newFactionName.toUpperCase(),
      emblem: newFactionEmblem,
      level: 1,
      xp: 0,
      xpToNext: 1000,
      description: newFactionDesc,
      color: newFactionColor,
      members: [
        { id: user.uid, name: user.displayName || 'Leo Vela', role: 'warlord', avatar: '👑', level: 5, contribution: 100 }
      ],
      missions: [
        { id: `mis_cust_1_${Date.now()}`, title: 'Aportar Coins al bando', progress: 0, target: 500, rewardXP: 300, rewardCoins: 50 },
        { id: `mis_cust_2_${Date.now()}`, title: 'Subir covers grupales', progress: 0, target: 3, rewardXP: 400, rewardCoins: 80 }
      ]
    };

    const updated = [...factions, newFaction];
    setFactions(updated);
    localStorage.setItem('c8l_factions_list', JSON.stringify(updated));
    
    setJoinedFactionId(newFaction.id);
    localStorage.setItem('c8l_joined_faction', newFaction.id);

    setShowCreateForm(false);
    setNewFactionName('');
    setNewFactionDesc('');
    showNotification(`¡Has fundado el bando ${newFaction.name}!`, "success");
  };

  // Donate coins to bando to gain faction XP
  const handleDonateCoins = (amount: number) => {
    if (!joinedFactionId || !activeFaction || !user) return;
    
    if (deductCCoins(amount)) {
      const addedXP = amount * 10; // 1 Coin = 10 Faction XP
      let nextXP = activeFaction.xp + addedXP;
      let currentLvl = activeFaction.level;
      let nextLvlXP = activeFaction.xpToNext;
      let levelUp = false;

      while (nextXP >= nextLvlXP && currentLvl < 20) {
        currentLvl += 1;
        nextXP = nextXP - nextLvlXP;
        nextLvlXP = currentLvl * 800; // progressive level cap
        levelUp = true;
      }

      const updated = factions.map(f => {
        if (f.id === joinedFactionId) {
          // Increment member's contribution
          const updatedMembers = f.members.map(m => {
            if (m.id === user.uid) {
              return { ...m, contribution: m.contribution + amount };
            }
            return m;
          });

          // Also increment missions donation if exists
          const updatedMissions = f.missions.map(m => {
            if (m.id.includes('mis_2') || m.id.includes('cust_1')) {
              return { ...m, progress: Math.min(m.target, m.progress + amount) };
            }
            return m;
          });

          return {
            ...f,
            level: currentLvl,
            xp: nextXP,
            xpToNext: nextLvlXP,
            members: updatedMembers,
            missions: updatedMissions
          };
        }
        return f;
      });

      setFactions(updated);
      localStorage.setItem('c8l_factions_list', JSON.stringify(updated));

      if (levelUp) {
        showNotification(`🎉 ¡Bando subió de nivel! ¡Ahora es Nivel ${currentLvl}!`, "success");
      } else {
        showNotification(`¡Donaste ${amount} Coins! Faction +${addedXP} XP.`, "success");
      }
    } else {
      showNotification("Coins insuficientes.", "error");
    }
  };

  const handlePostMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !joinedFactionId || !user) return;

    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newMsg = {
      id: Math.random().toString(),
      user: user.displayName || 'Leo Vela',
      text: chatInput,
      time,
      avatar: '🎤'
    };

    const updatedMsgs = [...messages, newMsg];
    setMessages(updatedMsgs);
    localStorage.setItem(`c8l_faction_chat_${joinedFactionId}`, JSON.stringify(updatedMsgs));
    setChatInput('');

    // Simulate member reply after a short delay
    setTimeout(() => {
      const responses = [
        "¡Excelente aporte!",
        "¡Qué bien!",
        "De acuerdo con eso.",
        "¡Vamos con todo por el top ranking de esta semana! 🔥",
        "¿Quién está libre para batallar ahora?"
      ];
      const randomUser = activeFaction?.members.find(m => m.id !== user.uid) || { name: 'Compañero', avatar: '👤' };
      const simulatedMsg = {
        id: Math.random().toString(),
        user: randomUser.name,
        text: responses[Math.floor(Math.random() * responses.length)],
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        avatar: randomUser.avatar
      };
      
      setMessages(prev => {
        const final = [...prev, simulatedMsg];
        localStorage.setItem(`c8l_faction_chat_${joinedFactionId}`, JSON.stringify(final));
        return final;
      });
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-black text-white pt-28 md:pt-32 pb-24 px-4 font-sans">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8 border-b-4 border-[#D4AF37] pb-4">
          <div>
            <h1 className="text-3xl font-black text-[#D4AF37] flex items-center gap-2">
              <Shield size={32} /> BANDOS DE BATALLA
            </h1>
            <p className="text-gray-400 text-sm mt-1">Unete a facciones musicales, dona coins para subir nivel y chatea en privado.</p>
          </div>
          {activeFaction && (
            <button 
              onClick={handleLeave}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600/20 border border-red-500/40 rounded text-red-400 hover:bg-red-600/30 text-xs font-black cursor-pointer"
            >
              <LogOut size={14} /> ABANDONAR BANDO
            </button>
          )}
        </div>

        {!joinedFactionId ? (
          <div>
            {/* Browser Mode */}
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">Explora bandos del multiverso</h2>
              <button 
                onClick={() => setShowCreateForm(true)}
                className="px-4 py-2 bg-gradient-to-r from-[#D4AF37] to-[#FFD700] text-black font-black text-sm rounded hover:scale-105 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Plus size={16} /> FUNDAR NUEVO BANDO
              </button>
            </div>

            {/* Grid of factions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {factions.map(fac => (
                <div 
                  key={fac.id} 
                  className="bg-gray-900/40 border-2 rounded-lg p-5 flex flex-col justify-between hover:border-gray-600 transition-all hover:bg-gray-900/60"
                  style={{ borderLeftWidth: '6px', borderLeftColor: fac.color }}
                >
                  <div>
                    <div className="flex justify-between items-start mb-3">
                      <span className="text-4xl">{fac.emblem}</span>
                      <span className="text-xs px-2 py-1 bg-black/60 border border-gray-800 text-gray-400 font-bold rounded-full">Nv. {fac.level}</span>
                    </div>
                    <h3 className="text-lg font-black text-white mb-2">{fac.name}</h3>
                    <p className="text-xs text-gray-400 mb-4 line-clamp-3 leading-relaxed">{fac.description}</p>
                    <div className="flex gap-4 text-[10px] text-gray-500 font-mono mb-4">
                      <span>👥 {fac.members.length} MIEMBROS</span>
                      <span>⭐ {fac.xp}/{fac.xpToNext} XP</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleJoin(fac.id)}
                    className="w-full py-2 bg-black hover:bg-white hover:text-black border border-gray-700 transition-all text-xs font-black rounded flex items-center justify-center gap-1 cursor-pointer"
                  >
                    UNIRSE <ArrowRight size={12} />
                  </button>
                </div>
              ))}
            </div>

            {/* Create Faction Modal */}
            <AnimatePresence>
              {showCreateForm && (
                <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
                  <motion.div 
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    className="bg-gray-900 border-4 border-[#D4AF37] w-full max-w-md p-6 rounded-lg"
                  >
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-black text-[#D4AF37]">FUNDAR NUEVO BANDO</h3>
                      <button onClick={() => setShowCreateForm(false)} className="text-gray-400 hover:text-white text-xl">✕</button>
                    </div>

                    <form onSubmit={handleCreateFaction} className="space-y-4">
                      <div>
                        <label className="block text-xs text-gray-400 font-bold mb-1">NOMBRE DEL BANDO</label>
                        <input 
                          type="text" 
                          required
                          value={newFactionName} 
                          onChange={(e) => setNewFactionName(e.target.value)}
                          placeholder="e.g. METALEROS ESPACIALES"
                          className="w-full bg-black border border-gray-800 p-2 text-sm text-white focus:outline-none focus:border-[#D4AF37]"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-gray-400 font-bold mb-1">EMBLEMA (EMOJI)</label>
                          <select 
                            value={newFactionEmblem} 
                            onChange={(e) => setNewFactionEmblem(e.target.value)}
                            className="w-full bg-black border border-gray-800 p-2 text-sm text-white focus:outline-none"
                          >
                            <option value="🛸">🛸 Ovni</option>
                            <option value="🎸">🎸 Guitarra</option>
                            <option value="⚡">⚡ Rayo</option>
                            <option value="🦁">🦁 León</option>
                            <option value="🔥">🔥 Fuego</option>
                            <option value="👾">👾 Monstruo</option>
                            <option value="👑">👑 Corona</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs text-gray-400 font-bold mb-1">COLOR DE NEÓN</label>
                          <select 
                            value={newFactionColor} 
                            onChange={(e) => setNewFactionColor(e.target.value)}
                            className="w-full bg-black border border-gray-800 p-2 text-sm text-white focus:outline-none"
                          >
                            <option value="#FFD700">Oro</option>
                            <option value="#FF0055">Rosa Neón</option>
                            <option value="#00F3FF">Cyan Neón</option>
                            <option value="#9B59B6">Morado</option>
                            <option value="#2ECC71">Verde</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 font-bold mb-1">DESCRIPCIÓN / FILOSOFÍA</label>
                        <textarea 
                          rows={3}
                          required
                          value={newFactionDesc}
                          onChange={(e) => setNewFactionDesc(e.target.value)}
                          placeholder="Describe la temática, objetivos y reglas de tu bando..."
                          className="w-full bg-black border border-gray-800 p-2 text-sm text-white focus:outline-none focus:border-[#D4AF37] resize-none"
                        />
                      </div>
                      <button 
                        type="submit"
                        className="w-full py-3 bg-[#D4AF37] text-black font-black text-sm hover:bg-[#FFD700] transition-colors cursor-pointer"
                      >
                        FUNDAR POR 0 COINS
                      </button>
                    </form>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>
          </div>
        ) : (
          <div>
            {/* Dashboard of the joined faction */}
            {activeFaction && (
              <div className="grid grid-cols-12 gap-6">
                
                {/* Left Side: Faction Emblem, Level Progress & Donations */}
                <div className="col-span-12 md:col-span-4 space-y-6">
                  <div 
                    className="bg-gray-900/30 border-2 rounded-lg p-6 text-center relative overflow-hidden"
                    style={{ borderTopWidth: '8px', borderTopColor: activeFaction.color }}
                  >
                    <div className="text-7xl mb-3">{activeFaction.emblem}</div>
                    <h2 className="text-2xl font-black text-white">{activeFaction.name}</h2>
                    <p className="text-xs text-gray-400 mt-2 italic">"{activeFaction.description}"</p>
                    
                    {/* Level */}
                    <div className="mt-6 p-3 bg-black/60 border border-gray-800 rounded-lg">
                      <div className="flex justify-between items-center mb-1 text-xs">
                        <span className="text-[#D4AF37] font-black flex items-center gap-1"><Sword size={12} /> NIVEL {activeFaction.level}/20</span>
                        <span className="text-gray-400">{activeFaction.xp} / {activeFaction.xpToNext} XP</span>
                      </div>
                      <div className="h-2 bg-gray-950 rounded-full overflow-hidden mb-1">
                        <div 
                          className="h-full transition-all duration-500" 
                          style={{ width: `${(activeFaction.xp / activeFaction.xpToNext) * 100}%`, backgroundColor: activeFaction.color }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Chest Donation Box */}
                  <div className="bg-gray-900/30 border-2 border-gray-800 rounded-lg p-5">
                    <h3 className="text-sm font-black text-[#D4AF37] mb-3 flex items-center gap-1.5"><DollarSign size={16} /> COFRE DEL BANDO</h3>
                    <p className="text-xs text-gray-400 mb-4 leading-relaxed">Dona coins del bando para ganar XP y subir de nivel cooperativo. 1 Coin = 10 XP.</p>
                    <div className="grid grid-cols-3 gap-2">
                      {[10, 50, 100].map(amount => (
                        <button 
                          key={amount}
                          onClick={() => handleDonateCoins(amount)}
                          className="py-2 bg-black hover:bg-[#D4AF37] hover:text-black border border-gray-800 hover:border-[#D4AF37] transition-all text-xs font-black rounded cursor-pointer"
                        >
                          +{amount} Coins
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Leaderboard Members */}
                  <div className="bg-gray-900/30 border-2 border-gray-800 rounded-lg p-5">
                    <h3 className="text-sm font-black text-[#D4AF37] mb-3 flex items-center gap-1.5"><Crown size={16} /> MIEMBROS DE HONOR</h3>
                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                      {activeFaction.members.sort((a,b) => b.contribution - a.contribution).map((member, idx) => (
                        <div key={member.id} className="bg-black/60 p-2.5 border border-gray-900 rounded flex justify-between items-center text-xs">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-gray-500 w-4">#{idx+1}</span>
                            <span className="text-lg">{member.avatar}</span>
                            <div>
                              <div className="font-bold text-white">{member.name}</div>
                              <div className="text-[10px] text-gray-500 capitalize">{member.role}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-[#D4AF37]">{member.contribution} C</div>
                            <div className="text-[9px] text-gray-500">Aportado</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right Side: Cooperative Missions & Private Chat */}
                <div className="col-span-12 md:col-span-8 space-y-6">
                  {/* Cooperative Missions */}
                  <div className="bg-gray-900/30 border-2 border-gray-800 rounded-lg p-5">
                    <h3 className="text-sm font-black text-[#D4AF37] mb-4 flex items-center gap-1.5"><Award size={16} /> MISIONES COOPERATIVAS</h3>
                    <div className="space-y-4">
                      {activeFaction.missions.map(mis => (
                        <div key={mis.id} className="bg-black/60 p-3.5 border border-gray-900 rounded-lg">
                          <div className="flex justify-between items-center mb-1.5 text-xs font-bold">
                            <span className="text-white">{mis.title}</span>
                            <span className="text-gray-400 font-mono">{mis.progress}/{mis.target}</span>
                          </div>
                          <div className="h-2 bg-gray-950 rounded-full overflow-hidden mb-2">
                            <div 
                              className="h-full bg-gradient-to-r from-green-500 to-emerald-400 transition-all duration-300"
                              style={{ width: `${Math.min(100, (mis.progress / mis.target) * 100)}%` }}
                            />
                          </div>
                          <div className="flex justify-between text-[10px] text-gray-500 font-bold">
                            <span>RECOMPENSA: +{mis.rewardXP} XP Bando</span>
                            <span className="text-[#D4AF37]">+{mis.rewardCoins} Coins por miembro</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Private Faction Chat */}
                  <div className="bg-gray-900/30 border-2 border-gray-800 rounded-lg p-5 flex flex-col h-[400px]">
                    <h3 className="text-sm font-black text-[#D4AF37] mb-3 flex items-center gap-1.5"><MessageCircle size={16} /> CHAT DE BANDO PRIVADO</h3>
                    
                    {/* Message Box */}
                    <div className="flex-1 bg-black/40 border border-gray-900 rounded-lg p-4 overflow-y-auto space-y-3 mb-3">
                      {messages.map(msg => (
                        <div key={msg.id} className="flex gap-2 items-start text-xs">
                          <span className="text-lg bg-gray-800 p-1 rounded-full shrink-0">{msg.avatar}</span>
                          <div className="bg-gray-900/80 p-2.5 rounded-lg border border-gray-850 flex-1">
                            <div className="flex justify-between items-center mb-1">
                              <span className="font-bold text-white">{msg.user}</span>
                              <span className="text-[9px] text-gray-600 font-mono">{msg.time}</span>
                            </div>
                            <p className="text-gray-300 leading-relaxed">{msg.text}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Chat Form */}
                    <form onSubmit={handlePostMessage} className="flex gap-2">
                      <input 
                        type="text"
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        placeholder="Escribe un mensaje para tu bando..."
                        className="flex-1 bg-black border border-gray-800 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                      />
                      <button 
                        type="submit"
                        className="px-4 py-2 bg-[#D4AF37] text-black font-black text-xs hover:bg-[#FFD700] transition-colors rounded cursor-pointer"
                      >
                        ENVIAR
                      </button>
                    </form>
                  </div>
                </div>

              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
