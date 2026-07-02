'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Backpack as BackpackIcon, Gift, Heart, Star, Coffee, Cookie, 
  Users, TrendingUp, Award, Sparkles, Flame
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

interface BackpackItem {
  id: string;
  name: string;
  description: string;
  emoji: string;
  category: string;
  quantity: number;
  xp: number;
  friendshipXp: number;
}

interface BackpackProps {
  userId: string;
  currentRoomId: string;
  currentFriendId?: string;
  currentCoverId?: string;
  onItemUsed: (itemId: string, targetType: string, xpGained: number) => void;
}

const ITEMS = [
  { id: 'cookie', name: 'Galleta Mágica', emoji: '🍪', category: 'food', xp: 5, friendshipXp: 3 },
  { id: 'coffee', name: 'Café C8L', emoji: '☕', category: 'food', xp: 10, friendshipXp: 5 },
  { id: 'pizza', name: 'Pizza Musical', emoji: '🍕', category: 'food', xp: 20, friendshipXp: 10 },
  { id: 'cake', name: 'Tarta', emoji: '🎂', category: 'food', xp: 50, friendshipXp: 25 },
  { id: 'balloon', name: 'Globo', emoji: '🎈', category: 'toy', xp: 8, friendshipXp: 4 },
  { id: 'teddy', name: 'Osito', emoji: '🧸', category: 'toy', xp: 15, friendshipXp: 8 },
  { id: 'confetti', name: 'Confeti', emoji: '🎊', category: 'toy', xp: 30, friendshipXp: 15 },
  { id: 'hug', name: 'Abrazo', emoji: '🤗', category: 'emotion', xp: 12, friendshipXp: 12 },
  { id: 'heart', name: 'Corazón C8L', emoji: '💖', category: 'emotion', xp: 25, friendshipXp: 25 },
  { id: 'star', name: 'Estrella', emoji: '⭐', category: 'emotion', xp: 40, friendshipXp: 20 },
];

export function Backpack({ userId, currentRoomId, currentFriendId, currentCoverId, onItemUsed }: BackpackProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inventory, setInventory] = useState<BackpackItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<BackpackItem | null>(null);
  const [targetType, setTargetType] = useState<'room' | 'friend' | 'cover'>('room');
  const [roomLevel, setRoomLevel] = useState({ level: 1, xp: 0, xpToNext: 100 });
  const [friendshipLevel, setFriendshipLevel] = useState({ level: 1, xp: 0, xpToNext: 50 });
  
  // Cargar inventario del usuario
  useEffect(() => {
    loadInventory();
    loadRoomLevel();
    if (currentFriendId) loadFriendshipLevel();
  }, [userId, currentRoomId, currentFriendId]);
  
  const loadInventory = async () => {
    let stored = localStorage.getItem("c8l_backpack");
    let inv: BackpackItem[];
    if (stored) {
      try {
        inv = JSON.parse(stored);
      } catch (e) {
        inv = ITEMS.map(item => ({
          ...item,
          quantity: Math.floor(Math.random() * 5) + 2,
          description: `Un ${item.name.toLowerCase()} para compartir`,
        }));
      }
    } else {
      inv = ITEMS.map(item => ({
        ...item,
        quantity: Math.floor(Math.random() * 5) + 2,
        description: `Un ${item.name.toLowerCase()} para compartir`,
      }));
      localStorage.setItem("c8l_backpack", JSON.stringify(inv));
    }
    setInventory(inv);
  };
  
  const loadRoomLevel = async () => {
    // Local storage fallback by default
    const localKey = `c8l_room_level_${currentRoomId}`;
    let levelData = { level: 1, xp: 0 };
    const saved = localStorage.getItem(localKey);
    if (saved) {
      try {
        levelData = JSON.parse(saved);
      } catch (e) {}
    } else {
      localStorage.setItem(localKey, JSON.stringify(levelData));
    }

    try {
      const { data, error } = await supabase
        .from('room_levels')
        .select('level, xp')
        .eq('room_id', currentRoomId)
        .single();
      
      if (data && !error) {
        levelData = data;
        localStorage.setItem(localKey, JSON.stringify(data));
      }
    } catch (error) {
      console.warn('Supabase room level fetch failed, using local storage fallback:', error);
    }
    
    const xpToNext = 100 + ((levelData.level - 1) * 15);
    setRoomLevel({ level: levelData.level, xp: levelData.xp, xpToNext });
  };
  
  const loadFriendshipLevel = async () => {
    if (!currentFriendId) return;
    
    const localKey = `c8l_friendship_${userId}_${currentFriendId}`;
    let friendshipData = { level: 1, xp: 0 };
    const saved = localStorage.getItem(localKey);
    if (saved) {
      try {
        friendshipData = JSON.parse(saved);
      } catch (e) {}
    } else {
      localStorage.setItem(localKey, JSON.stringify(friendshipData));
    }

    try {
      const { data, error } = await supabase
        .from('friendship_levels')
        .select('level, xp')
        .eq('user1_id', Math.min(Number(userId) || 0, Number(currentFriendId) || 0).toString())
        .eq('user2_id', Math.max(Number(userId) || 0, Number(currentFriendId) || 0).toString())
        .single();
      
      if (data && !error) {
        friendshipData = data;
        localStorage.setItem(localKey, JSON.stringify(data));
      }
    } catch (error) {
      console.warn('Supabase friendship level fetch failed, using local storage fallback:', error);
    }
    
    const xpToNext = 50 + ((friendshipData.level - 1) * 25);
    setFriendshipLevel({ level: friendshipData.level, xp: friendshipData.xp, xpToNext });
  };
  
  const useItem = async (item: BackpackItem) => {
    if (item.quantity < 1) return;
    
    let success = false;
    let newLevel = 1;
    let levelUp = false;
    
    let endpoint = '';
    let body = {};
    
    if (targetType === 'room') {
      endpoint = '/api/backpack/use-on-room';
      body = { itemId: item.id, roomId: currentRoomId };
    } else if (targetType === 'friend' && currentFriendId) {
      endpoint = '/api/backpack/use-on-friend';
      body = { itemId: item.id, friendId: currentFriendId };
    } else if (targetType === 'cover' && currentCoverId) {
      endpoint = '/api/backpack/use-on-cover';
      body = { itemId: item.id, coverId: currentCoverId };
    }
    
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const result = await response.json();
      if (result.success) {
        success = true;
        newLevel = result.new_level;
        levelUp = !!result.level_up;
      }
    } catch (error) {
      console.warn('API backpack use failed, falling back to local simulation:', error);
      // Fallback local simulation
      success = true;
    }

    if (success) {
      // 1. Update local inventory state & localStorage
      const updatedInv = inventory.map(i => 
        i.id === item.id ? { ...i, quantity: i.quantity - 1 } : i
      );
      setInventory(updatedInv);
      localStorage.setItem("c8l_backpack", JSON.stringify(updatedInv));
      
      // 2. Update levels state & localStorage
      if (targetType === 'room') {
        const localKey = `c8l_room_level_${currentRoomId}`;
        let nextXp = roomLevel.xp + item.xp;
        let lvl = roomLevel.level;
        let xpToNext = roomLevel.xpToNext;
        
        if (nextXp >= xpToNext) {
          lvl += 1;
          nextXp = nextXp - xpToNext;
          levelUp = true;
          newLevel = lvl;
        }
        
        setRoomLevel({
          level: lvl,
          xp: nextXp,
          xpToNext: 100 + ((lvl - 1) * 15)
        });
        localStorage.setItem(localKey, JSON.stringify({ level: lvl, xp: nextXp }));
      } else if (targetType === 'friend' && currentFriendId) {
        const localKey = `c8l_friendship_${userId}_${currentFriendId}`;
        let nextXp = friendshipLevel.xp + item.friendshipXp;
        let lvl = friendshipLevel.level;
        let xpToNext = friendshipLevel.xpToNext;
        
        if (nextXp >= xpToNext) {
          lvl += 1;
          nextXp = nextXp - xpToNext;
          levelUp = true;
          newLevel = lvl;
        }
        
        setFriendshipLevel({
          level: lvl,
          xp: nextXp,
          xpToNext: 50 + ((lvl - 1) * 25)
        });
        localStorage.setItem(localKey, JSON.stringify({ level: lvl, xp: nextXp }));
      }
      
      onItemUsed(item.id, targetType, item.xp);
      setSelectedItem(null);
      
      if (levelUp) {
        triggerLevelUpEffect();
      }
    }
  };
  
  const triggerLevelUpEffect = () => {
    const event = new CustomEvent('level-up', { 
      detail: { roomId: currentRoomId, newLevel: roomLevel.level + 1 }
    });
    window.dispatchEvent(event);
  };
  
  const totalItems = inventory.reduce((sum, i) => sum + i.quantity, 0);
  
  return (
    <>
      {/* Botón de mochila */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 right-28 z-40 bg-purple-600 text-white p-3 rounded-full shadow-lg hover:scale-105 transition-all border-2 border-[#D4AF37] cursor-pointer"
      >
        <BackpackIcon size={24} />
        {totalItems > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {totalItems}
          </span>
        )}
      </button>
      
      {/* Modal de mochila */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4"
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 30 }}
              className="bg-gray-900 border-4 border-[#D4AF37] max-w-2xl w-full max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="sticky top-0 bg-gray-900 p-4 border-b border-gray-800 z-10">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-black text-[#D4AF37] flex items-center gap-2">
                    <BackpackIcon size={20} /> MI MOCHILA
                  </h3>
                  <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white cursor-pointer">
                    ✕
                  </button>
                </div>
                
                {/* Selector de destino */}
                <div className="flex gap-2 mt-3">
                  {[
                    { id: 'room', label: '🎤 Sala', icon: <Users size={14} /> },
                    { id: 'friend', label: '🤝 Amigo', icon: <Heart size={14} />, disabled: !currentFriendId },
                    { id: 'cover', label: '🎵 Cover', icon: <Star size={14} />, disabled: !currentCoverId },
                  ].map(t => (
                    <button
                      key={t.id}
                      onClick={() => setTargetType(t.id as any)}
                      disabled={t.disabled}
                      className={`flex-1 py-2 text-sm rounded flex items-center justify-center gap-1 transition-all cursor-pointer ${
                        targetType === t.id
                          ? 'bg-[#D4AF37] text-black font-bold'
                          : 'bg-gray-800 text-gray-400 disabled:opacity-50 disabled:cursor-not-allowed'
                      }`}
                    >
                      {t.icon}
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Niveles actuales */}
              <div className="p-4 border-b border-gray-800 bg-black/50">
                {targetType === 'room' && (
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-400">Nivel de Sala</span>
                      <span className="text-[#D4AF37] font-bold">Nv. {roomLevel.level}/99</span>
                    </div>
                    <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-[#00F3FF] to-[#D4AF37] transition-all"
                        style={{ width: `${Math.min(100, (roomLevel.xp / roomLevel.xpToNext) * 100)}%` }}
                      />
                    </div>
                    <div className="text-xs text-gray-500 mt-1">{roomLevel.xp}/{roomLevel.xpToNext} XP</div>
                  </div>
                )}
                {targetType === 'friend' && currentFriendId && (
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-400">Nivel de Amistad</span>
                      <span className="text-[#D4AF37] font-bold">Nv. {friendshipLevel.level}/10</span>
                    </div>
                    <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-pink-500 to-purple-500 transition-all"
                        style={{ width: `${Math.min(100, (friendshipLevel.xp / friendshipLevel.xpToNext) * 100)}%` }}
                      />
                    </div>
                    <div className="text-xs text-gray-500 mt-1">{friendshipLevel.xp}/{friendshipLevel.xpToNext} XP</div>
                  </div>
                )}
              </div>
              
              {/* Grid de items */}
              <div className="p-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {inventory.map(item => (
                    <motion.div
                      key={item.id}
                      whileHover={{ scale: 1.02 }}
                      onClick={() => item.quantity > 0 && setSelectedItem(item)}
                      className={`relative bg-black border-2 rounded-lg p-3 transition-all ${
                        item.quantity > 0 ? 'border-gray-700 hover:border-[#D4AF37] cursor-pointer' : 'border-gray-900 opacity-40 cursor-not-allowed'
                      }`}
                    >
                      <div className="text-center">
                        <div className="text-4xl mb-1">{item.emoji}</div>
                        <div className="font-bold text-white text-sm">{item.name}</div>
                        <div className="text-xs text-gray-500">x{item.quantity}</div>
                        <div className="text-[10px] text-[#D4AF37] mt-1 font-bold">
                          +{targetType === 'room' ? item.xp : item.friendshipXp} XP
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Modal de confirmación */}
      <AnimatePresence>
        {selectedItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 z-[60] flex items-center justify-center p-4"
            onClick={() => setSelectedItem(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 30 }}
              className="bg-gray-900 border-4 border-[#D4AF37] max-w-sm w-full p-6 text-center"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-6xl mb-3">{selectedItem.emoji}</div>
              <h3 className="text-xl font-black text-white mb-2">¿Usar {selectedItem.name}?</h3>
              <p className="text-sm text-gray-400 mb-4">{selectedItem.description}</p>
              
              <div className="bg-black p-3 rounded-lg mb-4">
                <div className="text-sm text-[#D4AF37] font-bold">
                  {targetType === 'room' && `🎤 +${selectedItem.xp} XP para la sala`}
                  {targetType === 'friend' && `🤝 +${selectedItem.friendshipXp} XP de Amistad`}
                  {targetType === 'cover' && `🎵 +${selectedItem.xp}% visibilidad para el cover`}
                </div>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => useItem(selectedItem)}
                  className="flex-1 py-3 bg-[#D4AF37] text-black font-black hover:bg-[#FFD700] transition-colors cursor-pointer"
                >
                  USAR
                </button>
                <button
                  onClick={() => setSelectedItem(null)}
                  className="flex-1 py-3 bg-gray-800 text-white font-black hover:bg-gray-700 transition-colors cursor-pointer"
                >
                  CANCELAR
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}