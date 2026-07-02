'use client';

import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface SidebarBannersProps {
  onAdClick: (adId: string, gameId: string, rewardCoins: number) => void;
  isCollapsed: boolean;
  onToggle: () => void;
}

const SIDEBAR_ADS = [
  {
    id: 'sb_slots',
    title: '🎰 ORO DIVINO',
    subtitle: 'Slots Olimpo',
    gameId: 'slots',
    reward: 15,
    color: '#D4AF37',
  },
  {
    id: 'sb_raid',
    title: '👾 RAID BOSS',
    subtitle: 'Doble recompensa',
    gameId: 'raid',
    reward: 20,
    color: '#FF0055',
  },
  {
    id: 'sb_roulette',
    title: '🎡 CASINO C8L',
    subtitle: 'RTP 97.3%',
    gameId: 'roulette',
    reward: 10,
    color: '#00F3FF',
  }
];

export function SidebarBanners({ onAdClick, isCollapsed, onToggle }: SidebarBannersProps) {
  return (
    <aside
      className={`fixed left-0 top-24 bottom-0 z-20 bg-black/90 border-r-4 border-gray-800 transition-all duration-300 flex flex-col items-center py-4 ${
        isCollapsed ? 'w-16' : 'w-48'
      }`}
    >
      {/* Toggle button */}
      <button
        onClick={onToggle}
        className="absolute -right-5 top-4 bg-black border-2 border-gray-700 hover:border-[#D4AF37] text-white p-1 rounded-full z-30"
      >
        {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      <div className="w-full px-2 space-y-4 overflow-y-auto">
        {!isCollapsed && (
          <h4 className="text-center font-mono text-[10px] text-gray-500 tracking-widest uppercase">
            Sponsors
          </h4>
        )}
        
        {SIDEBAR_ADS.map((ad) => (
          <motion.div
            key={ad.id}
            whileHover={{ scale: 1.02 }}
            onClick={() => onAdClick(ad.id, ad.gameId, ad.reward)}
            className="border-2 border-dashed p-3 cursor-pointer text-center bg-black/55 transition-all hover:bg-gray-900 flex flex-col justify-center items-center"
            style={{ borderColor: ad.color }}
          >
            <div className="text-xl">
              {ad.gameId === 'slots' && '🎰'}
              {ad.gameId === 'raid' && '⚔️'}
              {ad.gameId === 'roulette' && '🎡'}
            </div>
            {!isCollapsed ? (
              <>
                <div className="text-xs font-black mt-1" style={{ color: ad.color }}>{ad.title}</div>
                <div className="text-[9px] text-gray-500 font-mono mt-0.5">{ad.subtitle}</div>
                <div className="text-[10px] text-green-500 font-bold mt-2">+{ad.reward} COINS</div>
              </>
            ) : (
              <div className="text-[9px] text-green-500 font-bold mt-1">+{ad.reward}</div>
            )}
          </motion.div>
        ))}
      </div>
    </aside>
  );
}
