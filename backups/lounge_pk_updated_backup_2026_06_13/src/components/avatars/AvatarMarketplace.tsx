// components/avatars/AvatarMarketplace.tsx
'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShoppingCart, Star, Crown, Diamond, Sparkles, 
  Users, TrendingUp, Clock, Filter, Search, 
  Check, X, Gift, Award, Flame, Zap
} from 'lucide-react';

interface Avatar {
  id: string;
  name: string;
  emoji: string;
  category: 'free' | 'common' | 'rare' | 'epic' | 'legendary';
  price: number;
  priceType: 'coins' | 'diamonds';
  rarity: number;
  popularity: number;
  unlockCondition?: {
    type: 'level' | 'wins' | 'covers' | 'achievement';
    value: number;
  };
  isLimited?: boolean;
  expiresAt?: Date;
  season?: string;
  tags: string[];
  description: string;
}

interface UserAvatar {
  id: string;
  avatarId: string;
  acquiredAt: Date;
  isEquipped: boolean;
}

interface AvatarMarketplaceProps {
  currentUserId: string;
  userCoins: number;
  userDiamonds: number;
  userLevel: number;
  userWins: number;
  userCovers: number;
  onPurchase: (avatar: Avatar, price: number, priceType: string) => void;
  onEquip: (avatarId: string) => void;
}

const AVATARS: Avatar[] = [
  // Gratuitos
  { id: 'default_mic', name: 'Micrófono Clásico', emoji: '🎤', category: 'free', price: 0, priceType: 'coins', rarity: 0, popularity: 100, tags: ['clásico', 'música'], description: 'El micrófono de toda la vida' },
  { id: 'default_headphones', name: 'Audífonos DJ', emoji: '🎧', category: 'free', price: 0, priceType: 'coins', rarity: 0, popularity: 95, tags: ['dj', 'música'], description: 'Para los amantes del sonido' },
  { id: 'default_music', name: 'Nota Musical', emoji: '🎵', category: 'free', price: 0, priceType: 'coins', rarity: 0, popularity: 90, tags: ['música'], description: 'La esencia de la música' },
  
  // Comunes
  { id: 'lion', name: 'León Cantante', emoji: '🦁', category: 'common', price: 100, priceType: 'coins', rarity: 1, popularity: 85, tags: ['animal', 'fuerte'], description: 'Ruge como un león en el escenario' },
  { id: 'unicorn', name: 'Unicornio Musical', emoji: '🦄', category: 'common', price: 150, priceType: 'coins', rarity: 1, popularity: 80, tags: ['mágico', 'colorido'], description: 'Magia en cada nota' },
  { id: 'dragon', name: 'Dragón de Fuego', emoji: '🐉', category: 'common', price: 200, priceType: 'coins', rarity: 1, popularity: 75, tags: ['fuego', 'poder'], description: 'Quema el escenario con tu voz' },
  
  // Raros
  { id: 'golden_mic', name: 'Micrófono Dorado', emoji: '🎤✨', category: 'rare', price: 500, priceType: 'coins', rarity: 2, popularity: 70, tags: ['dorado', 'lujoso'], description: 'El lujo de cantar', unlockCondition: { type: 'level', value: 10 } },
  { id: 'dj_rayo', name: 'DJ Relámpago', emoji: '⚡', category: 'rare', price: 600, priceType: 'coins', rarity: 2, popularity: 68, tags: ['dj', 'rápido'], description: 'Electricidad en cada beat' },
  { id: 'crown_singer', name: 'Rey Cantante', emoji: '👑', category: 'rare', price: 800, priceType: 'coins', rarity: 2, popularity: 65, tags: ['rey', 'prestigio'], description: 'Canta como un rey' },
  
  // Épicos
  { id: 'legendary_lion', name: 'León Legendario', emoji: '🦁👑', category: 'epic', price: 2000, priceType: 'coins', rarity: 3, popularity: 60, tags: ['legendario', 'rey'], description: 'El rey indiscutible del escenario', unlockCondition: { type: 'wins', value: 50 } },
  { id: 'phoenix', name: 'Fénix Musical', emoji: '🐦‍🔥', category: 'epic', price: 2500, priceType: 'coins', rarity: 3, popularity: 55, tags: ['fuego', 'renacer'], description: 'Renace con cada canción' },
  { id: 'angel_voice', name: 'Voz de Ángel', emoji: '👼', category: 'epic', price: 3000, priceType: 'diamonds', rarity: 3, popularity: 58, tags: ['celestial', 'puro'], description: 'Una voz que viene del cielo' },
  
  // Legendarios
  { id: 'c8l_legend', name: 'Leyenda C8L', emoji: '🏆', category: 'legendary', price: 10000, priceType: 'diamonds', rarity: 4, popularity: 50, tags: ['legendario', 'exclusivo'], description: 'Solo para los más grandes', unlockCondition: { type: 'achievement', value: 1 } },
  { id: 'god_of_music', name: 'Dios de la Música', emoji: '🎵👑', category: 'legendary', price: 15000, priceType: 'diamonds', rarity: 4, popularity: 45, tags: ['dios', 'música'], description: 'La máxima expresión musical', unlockCondition: { type: 'covers', value: 100 } },
  { id: 'eternal_voice', name: 'Voz Eterna', emoji: '✨🎤', category: 'legendary', price: 20000, priceType: 'diamonds', rarity: 4, popularity: 40, tags: ['eterno', 'místico'], description: 'Una voz que trasciende el tiempo', isLimited: true, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
];

const CATEGORIES = [
  { id: 'all', name: 'Todos', icon: <Users size={14} /> },
  { id: 'free', name: 'Gratis', icon: <Gift size={14} /> },
  { id: 'common', name: 'Comunes', icon: <Star size={14} /> },
  { id: 'rare', name: 'Raros', icon: <Sparkles size={14} /> },
  { id: 'epic', name: 'Épicos', icon: <Crown size={14} /> },
  { id: 'legendary', name: 'Legendarios', icon: <Diamond size={14} /> },
];

const RARITY_COLORS = {
  free: 'text-gray-400 border-gray-600',
  common: 'text-blue-400 border-blue-600',
  rare: 'text-purple-400 border-purple-600',
  epic: 'text-orange-400 border-orange-600',
  legendary: 'text-[#D4AF37] border-[#D4AF37]',
};

const RARITY_BG = {
  free: 'bg-gray-900',
  common: 'bg-blue-900/20',
  rare: 'bg-purple-900/20',
  epic: 'bg-orange-900/20',
  legendary: 'bg-[#D4AF37]/10',
};

export function AvatarMarketplace({ 
  currentUserId, 
  userCoins, 
  userDiamonds, 
  userLevel, 
  userWins, 
  userCovers,
  onPurchase, 
  onEquip 
}: AvatarMarketplaceProps) {
  const [ownedAvatars, setOwnedAvatars] = useState<UserAvatar[]>([
    { id: '1', avatarId: 'default_mic', acquiredAt: new Date(), isEquipped: true },
    { id: '2', avatarId: 'default_headphones', acquiredAt: new Date(), isEquipped: false },
  ]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState<Avatar | null>(null);
  const [sortBy, setSortBy] = useState<'popularity' | 'price' | 'rarity'>('popularity');
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  
  const ownedIds = new Set(ownedAvatars.map(a => a.avatarId));
  const equippedId = ownedAvatars.find(a => a.isEquipped)?.avatarId;
  
  const canUnlock = (avatar: Avatar) => {
    if (avatar.unlockCondition) {
      switch(avatar.unlockCondition.type) {
        case 'level':
          return userLevel >= avatar.unlockCondition.value;
        case 'wins':
          return userWins >= avatar.unlockCondition.value;
        case 'covers':
          return userCovers >= avatar.unlockCondition.value;
        default:
          return true;
      }
    }
    return true;
  };
  
  const filteredAvatars = AVATARS
    .filter(avatar => {
      if (selectedCategory !== 'all' && avatar.category !== selectedCategory) return false;
      if (searchTerm && !avatar.name.toLowerCase().includes(searchTerm.toLowerCase()) && 
          !avatar.tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()))) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'popularity') return b.popularity - a.popularity;
      if (sortBy === 'rarity') return b.rarity - a.rarity;
      return a.price - b.price;
    });
  
  const handlePurchase = (avatar: Avatar) => {
    const price = avatar.price;
    const priceType = avatar.priceType;
    
    if (priceType === 'coins' && userCoins < price) {
      alert(`❌ Necesitas ${price} coins para comprar este avatar`);
      return;
    }
    if (priceType === 'diamonds' && userDiamonds < price) {
      alert(`❌ Necesitas ${price} diamantes para comprar este avatar`);
      return;
    }
    
    if (!canUnlock(avatar)) {
      alert(`❌ Necesitas nivel ${avatar.unlockCondition?.value} para desbloquear este avatar`);
      return;
    }
    
    onPurchase(avatar, price, priceType);
    setOwnedAvatars(prev => [...prev, {
      id: Date.now().toString(),
      avatarId: avatar.id,
      acquiredAt: new Date(),
      isEquipped: false
    }]);
    setShowPurchaseModal(false);
  };
  
  const handleEquip = (avatarId: string) => {
    setOwnedAvatars(prev => prev.map(a => ({
      ...a,
      isEquipped: a.avatarId === avatarId
    })));
    onEquip(avatarId);
  };
  
  const getRarityStars = (rarity: number) => {
    return '⭐'.repeat(rarity);
  };
  
  return (
    <div className="bg-black border-4 border-[#D4AF37] h-full flex flex-col">
      
      {/* Header */}
      <div className="p-4 border-b border-gray-800">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-black text-[#D4AF37] flex items-center gap-2">
            <ShoppingCart size={18} /> TIENDA DE AVATARES
          </h3>
          <div className="flex gap-2">
            <div className="bg-black border border-[#D4AF37] px-3 py-1 rounded-full text-sm">
              💰 {userCoins.toLocaleString()}
            </div>
            <div className="bg-black border border-[#D4AF37] px-3 py-1 rounded-full text-sm">
              💎 {userDiamonds.toLocaleString()}
            </div>
          </div>
        </div>
        
        {/* Search y filtros */}
        <div className="flex gap-2 mb-3">
          <div className="flex-1 relative">
            <Search size={14} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Buscar avatar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg py-1.5 pl-9 pr-3 text-sm text-white"
            />
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-gray-900 border border-gray-700 rounded-lg px-2 text-sm text-white"
          >
            <option value="popularity">Más populares</option>
            <option value="rarity">Más raros</option>
            <option value="price">Precio</option>
          </select>
        </div>
        
        {/* Categorías */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1 text-xs rounded-full flex items-center gap-1 whitespace-nowrap transition-all ${
                selectedCategory === cat.id
                  ? 'bg-[#D4AF37] text-black'
                  : 'bg-gray-900 text-gray-400 hover:bg-gray-800'
              }`}
            >
              {cat.icon}
              {cat.name}
            </button>
          ))}
        </div>
      </div>
      
      {/* Avatar equipado actualmente */}
      <div className="p-4 border-b border-gray-800 bg-gray-900/30">
        <div className="text-xs text-gray-500 mb-2">AVATAR EQUIPADO</div>
        <div className="flex items-center gap-3">
          <div className="text-5xl">
            {AVATARS.find(a => a.id === equippedId)?.emoji || '🎤'}
          </div>
          <div>
            <div className="font-bold text-white">{AVATARS.find(a => a.id === equippedId)?.name || 'Micrófono Clásico'}</div>
            <div className="text-xs text-gray-400">Equipado actualmente</div>
          </div>
        </div>
      </div>
      
      {/* Grid de avatares */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-2 gap-3">
          {filteredAvatars.map(avatar => {
            const isOwned = ownedIds.has(avatar.id);
            const isEquipped = equippedId === avatar.id;
            const canBuy = canUnlock(avatar);
            
            return (
              <motion.div
                key={avatar.id}
                whileHover={{ scale: 1.02 }}
                className={`relative border-2 rounded-lg p-3 transition-all ${RARITY_COLORS[avatar.category]} ${RARITY_BG[avatar.category]}`}
              >
                {avatar.isLimited && (
                  <div className="absolute -top-2 -right-2 bg-red-600 text-white text-[10px] px-2 py-0.5 rounded-full animate-pulse">
                    🔥 LIMITADO
                  </div>
                )}
                
                <div className="text-center">
                  <div className="text-5xl mb-2">{avatar.emoji}</div>
                  <div className="font-bold text-white text-sm">{avatar.name}</div>
                  <div className="text-[10px] text-gray-500 mt-1">{getRarityStars(avatar.rarity)}</div>
                  <div className="text-xs text-gray-400 mt-1 line-clamp-2">{avatar.description}</div>
                  
                  {avatar.unlockCondition && (
                    <div className="text-[10px] text-yellow-500 mt-1">
                      Requiere nivel {avatar.unlockCondition.value}
                    </div>
                  )}
                  
                  <div className="flex justify-center gap-2 mt-2">
                    {isOwned ? (
                      <button
                        onClick={() => handleEquip(avatar.id)}
                        className={`flex-1 py-1 text-xs font-black rounded transition-all ${
                          isEquipped
                            ? 'bg-green-600 text-white cursor-default'
                            : 'bg-[#D4AF37] text-black hover:bg-[#FFD700]'
                        }`}
                        disabled={isEquipped}
                      >
                        {isEquipped ? 'EQUIPADO' : 'EQUIPAR'}
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setSelectedAvatar(avatar);
                          setShowPurchaseModal(true);
                        }}
                        disabled={!canBuy}
                        className="flex-1 py-1 bg-[#D4AF37] text-black text-xs font-black rounded hover:bg-[#FFD700] disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {avatar.priceType === 'coins' ? '💰' : '💎'} {avatar.price}
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
      
      {/* Modal de compra */}
      <AnimatePresence>
        {showPurchaseModal && selectedAvatar && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4"
            onClick={() => setShowPurchaseModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 30 }}
              className="bg-gray-900 border-4 border-[#D4AF37] max-w-sm w-full p-6 text-center"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-7xl mb-4">{selectedAvatar.emoji}</div>
              <h3 className="text-xl font-black text-white mb-2">{selectedAvatar.name}</h3>
              <p className="text-sm text-gray-400 mb-4">{selectedAvatar.description}</p>
              
              <div className="bg-black p-3 rounded-lg mb-4">
                <div className="text-2xl font-black text-[#D4AF37]">
                  {selectedAvatar.priceType === 'coins' ? '💰' : '💎'} {selectedAvatar.price.toLocaleString()}
                </div>
                <div className="text-xs text-gray-500">
                  {selectedAvatar.priceType === 'coins' ? 'Coins' : 'Diamantes'}
                </div>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => handlePurchase(selectedAvatar)}
                  className="flex-1 py-3 bg-[#D4AF37] text-black font-black"
                >
                  COMPRAR
                </button>
                <button
                  onClick={() => setShowPurchaseModal(false)}
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