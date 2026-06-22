'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';

export function UserBackpack({ userId, onSendGift }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showSendModal, setShowSendModal] = useState(false);
  const [friendList, setFriendList] = useState([]);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [giftMessage, setGiftMessage] = useState('');

  useEffect(() => { loadBackpack(); loadFriends(); }, [userId]);

  const loadBackpack = async () => {
    const { data } = await supabase.from('user_backpack')
      .select('quantity, item:item_id (id, name, description, emoji, rarity, value, faction_xp, friend_xp)')
      .eq('user_id', userId).gt('quantity', 0);
    setItems(data || []); setLoading(false);
  };

  const loadFriends = async () => {
    const { data } = await supabase.from('friends')
      .select('friend:friend_id(id, name, avatar)')
      .eq('user_id', userId).eq('status', 'accepted');
    setFriendList(data?.map(f => f.friend) || []);
  };

  const sendGift = async () => {
    if (!selectedItem || !selectedFriend) return;
    const itemId = selectedItem.item.id;
    await supabase.from('backpack_gifts_sent').insert({
      from_user_id: userId, to_user_id: selectedFriend.id, item_id: itemId, quantity: 1, message: giftMessage
    });
    await supabase.from('backpack_gifts_received').insert({
      user_id: selectedFriend.id, from_user_id: userId, item_id: itemId, quantity: 1, message: giftMessage
    });
    await supabase.rpc('decrease_backpack_item', { p_user_id: userId, p_item_id: itemId, p_quantity: 1 });
    await supabase.rpc('add_faction_xp_from_gift', {
      p_user_id: userId, p_friend_id: selectedFriend.id, p_xp: selectedItem.item.faction_xp
    });
    setShowSendModal(false); setSelectedItem(null); setSelectedFriend(null); setGiftMessage('');
    loadBackpack(); onSendGift?.(selectedItem.item, selectedFriend);
  };

  const getRarityColor = (r) => ({
    common: 'text-gray-400 border-gray-400', rare: 'text-blue-400 border-blue-400',
    epic: 'text-purple-400 border-purple-400', legendary: 'text-c8l-gold border-c8l-gold'
  }[r] || 'text-gray-400 border-gray-400');


  if (loading) return <div className="text-center text-gray-400">Cargando mochila...</div>;

  return (
    <div className="bg-gradient-to-br from-black to-purple-900/30 p-6 rounded-2xl border-2 border-c8l-gold shadow-[0_0_30px_rgba(212,175,55,0.3)]">
      <h2 className="text-2xl font-black text-c8l-gold mb-4 text-center">
        🎒 MOCHILA C8L <span className="text-sm text-gray-400">({items.reduce((acc, i) => acc + i.quantity, 0)} items)</span>
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
        {items.map((item) => (
          <motion.button key={item.item.id} whileHover={{ scale: 1.05 }}
            onClick={() => { setSelectedItem(item); setShowSendModal(true); }}
            className={`relative p-3 rounded-lg border-2 transition-all ${getRarityColor(item.item.rarity)}`}>
            <div className="text-3xl mb-1">{item.item.emoji}</div>
            <div className="text-xs font-bold text-white line-clamp-1">{item.item.name}</div>
            <div className="text-[10px] text-gray-400">x{item.quantity}</div>
            {item.item.rarity === 'legendary' && (
              <div className="absolute -top-2 -right-2 bg-c8l-gold text-black text-[8px] px-1 rounded-full font-bold animate-pulse">LEGEND</div>
            )}
          </motion.button>
        ))}
      </div>

      <AnimatePresence>
        {showSendModal && selectedItem && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 border-4 border-c8l-gold p-6 rounded-2xl max-w-md w-full">
              <h3 className="text-xl font-bold text-c8l-gold mb-4">
                {selectedItem.item.emoji} Enviar {selectedItem.item.name}
              </h3>
              <div className="mb-4">
                <label className="text-sm text-gray-400">¿A quién?</label>
                <select value={selectedFriend?.id || ''}
                  onChange={(e) => setSelectedFriend(friendList.find(f => f.id === e.target.value))}
                  className="w-full bg-black border border-gray-700 rounded-lg px-4 py-2 text-white">
                  <option value="">Selecciona un amigo...</option>
                  {friendList.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                </select>
              </div>
              <div className="mb-4">
                <label className="text-sm text-gray-400">Mensaje (opcional)</label>
                <input type="text" value={giftMessage} onChange={(e) => setGiftMessage(e.target.value)}
                  placeholder="¡Feliz cumpleaños!" className="w-full bg-black border border-gray-700 rounded-lg px-4 py-2 text-white" />
              </div>
              <div className="flex gap-2">
                <button onClick={sendGift} disabled={!selectedFriend}
                  className="flex-1 py-2 bg-c8l-gold text-black font-bold rounded-lg disabled:opacity-50">Enviar Regalo</button>
                <button onClick={() => setShowSendModal(false)}
                  className="px-4 py-2 bg-gray-700 text-white rounded-lg">Cancelar</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
