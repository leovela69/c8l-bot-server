'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sword, Users, Star, MessageSquare, Award, Settings, ShieldAlert, LogOut } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { MemberList } from './MemberList';
import { TaskBoard } from './TaskBoard';
import { FactionChat } from './FactionChat';
import { FactionSettings } from './FactionSettings';

interface Faction {
  id: string;
  name: string;
  description: string;
  level: number;
  xp: number;
  emblem_url: string;
  banner_url: string;
  created_by: string;
  member_count: number;
  color?: string;
}

interface FactionMember {
  id: string;
  name: string;
  avatar: string;
  role: string;
  status: string;
  xp_contributed: number;
}

interface FactionProfileProps {
  factionId: string;
}

type ProfileTab = 'feed' | 'members' | 'tasks' | 'chat' | 'settings';

export function FactionProfile({ factionId }: FactionProfileProps) {
  const { user, showNotification } = useApp();
  const router = useRouter();

  const [faction, setFaction] = useState<Faction | null>(null);
  const [members, setMembers] = useState<FactionMember[]>([]);
  const [userMemberRecord, setUserMemberRecord] = useState<FactionMember | null>(null);
  const [activeTab, setActiveTab] = useState<ProfileTab>('feed');
  const [loading, setLoading] = useState(true);

  // Feed simulation state
  const [feedPosts, setFeedPosts] = useState<{ id: string; user: string; text: string; time: string; avatar: string }[]>([]);
  const [newPostText, setNewPostText] = useState('');

  const fetchFactionData = async () => {
    try {
      const { supabase } = await import('@/lib/supabase/client');

      // 1. Get Faction details
      const { data: facData, error: facErr } = await supabase
        .from('factions')
        .select('*')
        .eq('id', factionId)
        .single();

      if (facErr || !facData) {
        // Fallback mock Faction
        console.warn('Faction not found in DB, generating mock Faction details');
        setFaction({
          id: factionId,
          name: 'GUERREROS DEL MULTIVERSO',
          description: 'Luchamos con melodías y freestyle galáctico.',
          level: 4,
          xp: 1500,
          banner_url: '',
          emblem_url: '⚔️',
          created_by: 'system',
          member_count: 3
        });
        setMembers([
          { id: user?.uid || '1', name: user?.displayName || 'Leo Vela', avatar: '🦁', role: 'captain', status: 'active', xp_contributed: 500 },
          { id: '2', name: 'Dj Rayo', avatar: '⚡', role: 'vice-captain', status: 'active', xp_contributed: 200 },
          { id: '3', name: 'Reina Melody', avatar: '👑', role: 'member', status: 'active', xp_contributed: 50 }
        ]);
        setLoading(false);
        return;
      }

      setFaction(facData);

      // 2. Fetch Members
      const { data: memData } = await supabase
        .from('faction_members')
        .select('*, user:users!user_id(name, avatar)')
        .eq('faction_id', factionId);

      const formattedMembers = (memData || []).map((m: any) => ({
        id: m.user_id,
        name: m.user?.name || 'Guerrero C8L',
        avatar: m.user?.avatar || '🎤',
        role: m.role,
        status: m.status,
        xp_contributed: m.xp_contributed
      }));

      setMembers(formattedMembers);

      // 3. Find current user's membership
      const userRecord = formattedMembers.find((m) => m.id === user?.uid);
      setUserMemberRecord(userRecord || null);

      setLoading(false);
    } catch (e) {
      console.error('Error fetching faction data:', e);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.uid) {
      fetchFactionData();
    }
  }, [factionId, user?.uid]);

  // Feed posts mock loader
  useEffect(() => {
    const mockPosts = [
      { id: '1', user: 'Dj Rayo', text: '¡Hoy a las 20:00 tendremos torneo de karaoke! Aporten covers para ganar XP corporativo 🔥🎤', time: 'hace 2 horas', avatar: '⚡' },
      { id: '2', user: 'Reina Melody', text: '¡Reclamé mi recompensa diaria de logro! Bando subió de nivel de XP! 🎉🏆', time: 'hace 5 horas', avatar: '👑' }
    ];
    setFeedPosts(mockPosts);
  }, []);

  const handleLeaveFaction = async () => {
    if (!user || !faction) return;
    
    try {
      const res = await fetch('/api/factions/leave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ factionId: faction.id, userId: user.uid })
      });

      const data = await res.json();
      if (data.success) {
        showNotification('Has abandonado el Bando', 'info');
        router.push('/factions');
      } else {
        showNotification(data.error || 'Error al abandonar el bando', 'error');
      }
    } catch (e) {
      console.error('Error leaving faction:', e);
    }
  };

  const handlePostFeed = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostText.trim() || !user) return;

    const newPost = {
      id: Math.random().toString(),
      user: user.displayName || 'Leo Vela',
      text: newPostText.trim(),
      time: 'Hace un momento',
      avatar: '🦁'
    };

    setFeedPosts((prev) => [newPost, ...prev]);
    setNewPostText('');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center font-mono text-gray-500">
        Cargando perfil del Bando...
      </div>
    );
  }

  if (!faction) return null;

  const userRole = userMemberRecord?.role || 'member';
  const isJoined = userMemberRecord?.status === 'active';
  const isOwner = userMemberRecord?.role === 'captain';
  const isOfficer = ['captain', 'vice-captain', 'admin'].includes(userRole);

  const activeMembers = members.filter((m) => m.status === 'active');
  const featuredMembers = [...activeMembers]
    .sort((a, b) => b.xp_contributed - a.xp_contributed)
    .slice(0, 5);

  const color = faction.color || '#D4AF37';
  const xpToNext = faction.level * 1000 + 1000;

  return (
    <div className="min-h-screen bg-black text-white pt-28 md:pt-32 pb-24 p-4 font-mono">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Faction Banner Header */}
        <div
          className="bg-gray-900/30 border-4 rounded-2xl p-6 relative overflow-hidden flex flex-col md:flex-row justify-between items-center gap-6 shadow-2xl"
          style={{ borderColor: color }}
        >
          {/* Neon Radial glow */}
          <div
            className="absolute -top-24 -left-24 w-64 h-64 rounded-full blur-[100px] opacity-20"
            style={{ backgroundColor: color }}
          />

          <div className="flex flex-col md:flex-row items-center gap-4 relative z-10 text-center md:text-left">
            <span className="text-6xl md:text-7xl filter drop-shadow-[0_0_15px_rgba(255,255,255,0.15)]">
              {faction.emblem_url || '🛡️'}
            </span>
            <div>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                <h2 className="text-2xl md:text-3xl font-black text-white tracking-wider uppercase font-mono">
                  {faction.name}
                </h2>
                <span className="bg-black/60 border border-gray-800 text-gray-400 text-[10px] font-mono px-2 py-0.5 rounded-full font-bold">
                  BANDO #{faction.id.substring(0, 6).toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-2 max-w-lg leading-relaxed italic">
                "{faction.description}"
              </p>
              
              {/* Featured Members Row */}
              <div className="mt-4 flex items-center justify-center md:justify-start gap-2">
                <span className="text-[9px] text-gray-500 font-mono uppercase mr-1">Guerreros Destacados:</span>
                <div className="flex -space-x-2">
                  {featuredMembers.map((m) => (
                    <span
                      key={m.id}
                      className="text-lg bg-gray-950 border border-gray-800 rounded-full w-8 h-8 flex items-center justify-center cursor-help"
                      title={`${m.name} (${m.role})`}
                    >
                      {m.avatar || '👤'}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center md:items-end gap-3 shrink-0 relative z-10 w-full md:w-auto border-t md:border-t-0 border-gray-800 pt-4 md:pt-0">
            {/* Level and member stats */}
            <div className="flex gap-4 text-xs font-mono text-center md:text-right">
              <div>
                <span className="text-[10px] text-gray-500 block uppercase">NIVEL</span>
                <span className="text-base font-black text-[#D4AF37] flex items-center justify-end gap-0.5">
                  <Sword size={14} /> {faction.level}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-gray-500 block uppercase">GUERREROS</span>
                <span className="text-base font-black text-[#00F3FF]">
                  {activeMembers.length} / {faction.level * 5 + 15}
                </span>
              </div>
            </div>

            {/* Level progress bar */}
            <div className="w-full md:w-48 bg-black/60 border border-gray-850 p-2 rounded-lg">
              <div className="flex justify-between text-[8px] text-gray-500 font-mono mb-1">
                <span>XP</span>
                <span>{faction.xp} / {xpToNext}</span>
              </div>
              <div className="h-2 bg-gray-950 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, (faction.xp / xpToNext) * 100)}%`, backgroundColor: color }}
                />
              </div>
            </div>

            {/* Actions: Leave Bando */}
            {isJoined && (
              <button
                onClick={handleLeaveFaction}
                className="w-full md:w-auto px-4 py-1.5 bg-red-900/30 hover:bg-red-800 border border-red-700 text-red-200 hover:text-white text-[10px] font-black rounded flex items-center justify-center gap-1 cursor-pointer transition-all uppercase"
              >
                <LogOut size={12} /> ABANDONAR BANDO
              </button>
            )}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 justify-center md:justify-start border-b border-gray-800 pb-2">
          {(['feed', 'members', 'tasks', 'chat', 'settings'] as ProfileTab[]).map((tab) => {
            if (tab === 'settings' && !isOfficer) return null;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 border-2 font-black text-xs transition-all uppercase cursor-pointer ${
                  activeTab === tab
                    ? 'bg-[#D4AF37] text-black border-black shadow-[3px_3px_0px_#00F3FF]'
                    : 'bg-black text-[#D4AF37] border-[#D4AF37] hover:bg-[#D4AF37]/10'
                }`}
              >
                {tab === 'feed'
                  ? '📢 FEED'
                  : tab === 'members'
                  ? '👥 MIEMBROS'
                  : tab === 'tasks'
                  ? '🏆 TAREAS'
                  : tab === 'chat'
                  ? '💬 CHAT'
                  : '⚙️ AJUSTES'}
              </button>
            );
          })}
        </div>

        {/* Tab Content Rendering */}
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12">
            {activeTab === 'feed' && (
              <div className="grid grid-cols-12 gap-6">
                {/* Left col: Create feed post (4 cols) */}
                <div className="col-span-12 md:col-span-4">
                  <div className="bg-black/60 border-2 border-gray-800 rounded-xl p-4 space-y-4">
                    <h3 className="text-xs font-black text-[#D4AF37] font-mono tracking-wider uppercase">
                      📢 PUBLICAR EN EL FEED
                    </h3>
                    <form onSubmit={handlePostFeed} className="space-y-3">
                      <textarea
                        rows={3}
                        placeholder="Comparte algo con tu bando..."
                        value={newPostText}
                        onChange={(e) => setNewPostText(e.target.value)}
                        required
                        className="w-full bg-black border border-gray-850 focus:border-[#D4AF37] text-white rounded p-2 text-xs focus:outline-none resize-none"
                      />
                      <button
                        type="submit"
                        disabled={!newPostText.trim()}
                        className="w-full py-2 bg-[#D4AF37] hover:bg-black text-black hover:text-[#D4AF37] border border-black hover:border-[#D4AF37] text-xs font-black transition-colors cursor-pointer"
                      >
                        PUBLICAR
                      </button>
                    </form>
                  </div>
                </div>

                {/* Right col: Feed list (8 cols) */}
                <div className="col-span-12 md:col-span-8">
                  <div className="bg-black/60 border-2 border-gray-800 rounded-xl p-4 space-y-4">
                    <h3 className="text-xs font-black text-[#00F3FF] font-mono tracking-wider uppercase">
                      📋 ÚLTIMAS PUBLICACIONES
                    </h3>
                    
                    <div className="space-y-3">
                      {feedPosts.map((post) => (
                        <div key={post.id} className="bg-gray-950/60 p-4 border border-gray-850 rounded-xl flex gap-3">
                          <span className="text-3xl bg-gray-900 p-2 rounded-full w-12 h-12 flex items-center justify-center shrink-0 border border-gray-850">
                            {post.avatar}
                          </span>
                          <div className="flex-1">
                            <div className="flex justify-between items-center mb-1 text-xs">
                              <span className="font-bold text-white">{post.user}</span>
                              <span className="text-[9px] text-gray-500 font-mono">{post.time}</span>
                            </div>
                            <p className="text-xs text-gray-300 leading-relaxed mt-1">
                              {post.text}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'members' && (
              <MemberList
                factionId={factionId}
                members={members}
                userRole={userRole}
                onMembersUpdated={fetchFactionData}
              />
            )}

            {activeTab === 'tasks' && (
              <TaskBoard
                factionId={factionId}
                onRewardClaimed={fetchFactionData}
              />
            )}

            {activeTab === 'chat' && (
              <FactionChat
                factionId={factionId}
                members={activeMembers}
                userRole={userRole}
              />
            )}

            {activeTab === 'settings' && isOfficer && (
              <FactionSettings
                faction={faction}
                onSettingsSaved={fetchFactionData}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
