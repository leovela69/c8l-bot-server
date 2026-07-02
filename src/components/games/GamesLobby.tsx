'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RaidBoss } from './RaidBoss';
import { OlympusSlots } from '../casino/OlympusSlots';
import { RouletteWheel } from '../casino/RouletteWheel';
import { ClanSystem } from './ClanSystem';
import { GlobalLeaderboard } from './GlobalLeaderboard';
import { supabase } from '@/lib/supabase/client';

interface GamesLobbyProps {
  userCoins: number;
  setUserCoins: React.Dispatch<React.SetStateAction<number>>;
  userId: string;
  userName: string;
}

const GAMES = [
  { 
    id: 'raid', 
    name: '⚔️ RAIDS C8L', 
    description: 'Enfréntate a jefes épicos con tu comunidad. ¡Entre más ataques, más recompensas!',
    icon: '👾',
    color: '#FF0055',
    players: '1,234 jugando',
    active: true
  },
  { 
    id: 'slots', 
    name: '🎰 OLIMPO C8L', 
    description: 'Slots de los dioses. Consigue multiplicadores y giros gratis.',
    icon: '⚡',
    color: '#D4AF37',
    players: '2,456 jugando',
    active: true
  },
  { 
    id: 'roulette', 
    name: '🎡 RULETA C8L', 
    description: 'Apuesta a números, colores o docenas. RTP 97.3%',
    icon: '🎲',
    color: '#00F3FF',
    players: '987 jugando',
    active: true
  },
  { 
    id: 'clans', 
    name: '🏰 CLANES', 
    description: 'Forma o únete a un clan. Enfréntate a otros clanes en batallas épicas.',
    icon: '⚔️',
    color: '#9B59B6',
    players: '567 jugando',
    active: true
  },
  { 
    id: 'leaderboard', 
    name: '🏆 RANKINGS', 
    description: 'Top jugadores, top clanes, récords históricos.',
    icon: '📊',
    color: '#D4AF37',
    players: '-',
    active: true
  },
  { 
    id: 'poker', 
    name: '🃠 PÓKER', 
    description: 'Próximamente: Texas Hold\'em contra tu comunidad.',
    icon: '🎴',
    color: '#666',
    players: 'Próximamente',
    active: false
  },
  { 
    id: 'trivia', 
    name: '🎤 TRIVIA', 
    description: 'Próximamente: Pon a prueba tus conocimientos musicales.',
    icon: '❓',
    color: '#666',
    players: 'Próximamente',
    active: false
  }
];

export function GamesLobby({ userCoins, setUserCoins, userId, userName }: GamesLobbyProps) {
  const [selectedGame, setSelectedGame] = useState<string | null>(null);
  const [dailyBonus, setDailyBonus] = useState<{ claimed: boolean; amount: number }>({ claimed: false, amount: 100 });
  const [globalAnnouncement, setGlobalAnnouncement] = useState<string | null>(null);

  // Cargar bonus diario
  useEffect(() => {
    const lastClaim = localStorage.getItem('c8l_daily_bonus');
    const today = new Date().toDateString();
    if (lastClaim === today) {
      setDailyBonus(prev => ({ ...prev, claimed: true }));
    }
  }, []);

  const claimDailyBonus = () => {
    if (dailyBonus.claimed) return;
    
    setUserCoins(userCoins + dailyBonus.amount);
    setDailyBonus({ claimed: true, amount: dailyBonus.amount });
    localStorage.setItem('c8l_daily_bonus', new Date().toDateString());
    setGlobalAnnouncement(`🎁 ¡Reclamaste ${dailyBonus.amount} coins! Vuelve mañana por más.`);
    setTimeout(() => setGlobalAnnouncement(null), 3000);
  };

  // Renderizar juego seleccionado
  const renderGame = () => {
    switch(selectedGame) {
      case 'raid':
        return (
          <RaidBoss
            streamerId={userId}
            streamerName={userName}
            userCoins={userCoins}
            setUserCoins={setUserCoins}
            userName={userName}
            onGiftSent={(gift, damage, name) => {
              setGlobalAnnouncement(`⚡ ¡${name} atacó con ${gift} causando ${damage} de daño! ⚡`);
              setTimeout(() => setGlobalAnnouncement(null), 2000);
            }}
          />
        );
      case 'slots':
        return (
          <OlympusSlots
            userCoins={userCoins}
            setUserCoins={setUserCoins}
            onWin={(amount: number, god: string) => {
              setGlobalAnnouncement(`🎰 ¡${god} te bendijo! Ganaste ${amount} coins 🎰`);
              setTimeout(() => setGlobalAnnouncement(null), 3000);
            }}
          />
        );
      case 'roulette':
        return (
          <RouletteWheel
            userCoins={userCoins}
            setUserCoins={setUserCoins}
            onWin={(amount) => {
              setGlobalAnnouncement(`🎡 ¡La ruleta te sonríe! +${amount} coins 🎡`);
              setTimeout(() => setGlobalAnnouncement(null), 3000);
            }}
          />
        );
      case 'clans':
        return (
          <ClanSystem
            userId={userId}
            userName={userName}
            userCoins={userCoins}
            setUserCoins={setUserCoins}
            onClanBattleStart={(clanId) => {
              setGlobalAnnouncement(`⚔️ ¡Batalla de clanes iniciada! Representa a tu clan ⚔️`);
              setTimeout(() => setGlobalAnnouncement(null), 3000);
            }}
          />
        );
      case 'leaderboard':
        return <GlobalLeaderboard />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-6">
      
      {/* === ANUNCIO GLOBAL === */}
      <AnimatePresence>
        {globalAnnouncement && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 bg-[#D4AF37] text-black px-6 py-3 rounded-lg shadow-xl whitespace-nowrap font-bold"
          >
            {globalAnnouncement}
          </motion.div>
        )}
      </AnimatePresence>

      {/* === HEADER CON SALDO Y BONUS === */}
      <div className="flex justify-between items-center mb-8 p-4 border-4 border-[#D4AF37] bg-[#0d0d0e]">
        <div>
          <h1 className="text-3xl font-black text-[#D4AF37]">🏰 C8L GAMES</h1>
          <p className="text-xs text-gray-400">Juega, gana, compite y conquista</p>
        </div>
        
        <div className="flex gap-4 items-center">
          <div className="text-right">
            <div className="text-xs text-gray-400">TUS COINS</div>
            <div className="text-2xl font-black text-[#D4AF37]">{userCoins.toLocaleString()}</div>
          </div>
          
          <button
            onClick={claimDailyBonus}
            disabled={dailyBonus.claimed}
            className={`px-4 py-2 border-2 font-bold transition-all ${
              dailyBonus.claimed 
                ? 'bg-gray-800 text-gray-500 border-gray-700 cursor-not-allowed' 
                : 'bg-[#00F3FF] text-black border-black hover:bg-[#00F3FF]/80'
            }`}
          >
            {dailyBonus.claimed ? '✅ BONUS RECLAMADO' : `🎁 BONUS DIARIO (${dailyBonus.amount} COINS)`}
          </button>
        </div>
      </div>

      {/* Si hay juego seleccionado, mostrar el juego y botón de volver */}
      {selectedGame ? (
        <div>
          <button
            onClick={() => setSelectedGame(null)}
            className="mb-4 px-4 py-2 bg-gray-800 text-white font-mono text-sm hover:bg-gray-700 transition-all flex items-center gap-2"
          >
            ← VOLVER AL LOBBY
          </button>
          {renderGame()}
        </div>
      ) : (
        <>
          {/* === BANNER DESTACADO === */}
          <div className="relative mb-8 overflow-hidden border-4 border-[#D4AF37] bg-gradient-to-r from-[#FF0055] to-[#D4AF37] p-8">
            <div className="absolute inset-0 bg-opacity-10" />
            <div className="relative z-10">
              <div className="text-6xl mb-2">⚔️🔥🎰</div>
              <h2 className="text-3xl font-black text-white mb-2">¡RAID DEL TITÁN ACTIVA!</h2>
              <p className="text-white/90 mb-4">El Rey del Ruido ha aparecido. ¡Ataca con tus mejores regalos y gana recompensas épicas!</p>
              <button
                onClick={() => setSelectedGame('raid')}
                className="px-6 py-3 bg-black text-[#D4AF37] font-black hover:scale-105 transition-all"
              >
                ⚔️ UNIRSE A LA RAID ⚔️
              </button>
            </div>
          </div>

          {/* === GRID DE JUEGOS === */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {GAMES.map(game => (
              <motion.button
                key={game.id}
                onClick={() => game.active && setSelectedGame(game.id)}
                whileHover={{ scale: game.active ? 1.02 : 1 }}
                className={`relative p-6 border-4 text-left transition-all ${
                  game.active 
                    ? `bg-[#0d0d0e] hover:shadow-[8px_8px_0px_rgba(0,0,0,0.3)] cursor-pointer` 
                    : 'border-gray-800 bg-gray-900/50 cursor-not-allowed opacity-60'
                }`}
                style={{ borderColor: game.active ? game.color : '#333' }}
              >
                {!game.active && (
                  <div className="absolute top-2 right-2 bg-gray-800 text-gray-500 text-xs px-2 py-1 rounded">
                    PRÓXIMAMENTE
                  </div>
                )}
                <div className="text-4xl mb-4">{game.icon}</div>
                <h3 className="text-xl font-black mb-2" style={{ color: game.active ? game.color : '#666' }}>{game.name}</h3>
                <p className="text-xs text-gray-400 mb-4">{game.description}</p>
                <div className="text-xs font-bold text-gray-500">{game.players}</div>
              </motion.button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
