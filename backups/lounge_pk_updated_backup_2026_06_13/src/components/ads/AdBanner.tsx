// components/ads/AdBanner.tsx
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

interface AdBannerProps {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  gameId: string;        // 'raid', 'slots', 'roulette', 'clans'
  buttonText: string;
  buttonColor?: string;
  backgroundColor?: string;
  coins?: number;        // Coins de recompensa por hacer clic
  onAdClick?: (adId: string, gameId: string) => void;
}

export function AdBanner({ 
  id, 
  title, 
  description, 
  imageUrl, 
  gameId, 
  buttonText, 
  buttonColor = '#D4AF37',
  backgroundColor = '#0d0d0e',
  coins = 0,
  onAdClick 
}: AdBannerProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [clicked, setClicked] = useState(false);

  const handleClick = () => {
    if (clicked) return;
    setClicked(true);
    onAdClick?.(id, gameId);
    
    // Redirigir al juego
    setTimeout(() => {
      window.location.href = `/games?game=${gameId}`;
    }, 300);
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -4 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="relative overflow-hidden cursor-pointer border-4 border-black shadow-[8px_8px_0px_#000] transition-all"
      style={{ backgroundColor }}
      onClick={handleClick}
    >
      {/* Efecto de brillo al hacer hover */}
      {isHovered && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
      )}
      
      <div className="p-6 flex flex-col md:flex-row items-center gap-6">
        
        {/* Icono o imagen del banner */}
        {imageUrl ? (
          <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-[#D4AF37]">
            <img src={imageUrl} alt={title} className="w-full h-full object-cover" />
          </div>
        ) : (
          <div className="w-32 h-32 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#FFD700] flex items-center justify-center text-5xl">
            {gameId === 'raid' && '⚔️'}
            {gameId === 'slots' && '🎰'}
            {gameId === 'roulette' && '🎡'}
            {gameId === 'clans' && '🏰'}
          </div>
        )}
        
        {/* Contenido */}
        <div className="flex-1 text-center md:text-left">
          <h3 className="text-2xl font-black text-white mb-2">{title}</h3>
          <p className="text-gray-400 mb-3">{description}</p>
          
          {coins > 0 && (
            <div className="inline-flex items-center gap-1 bg-black px-3 py-1 rounded-full mb-3">
              <span className="text-[#D4AF37] text-sm">🎁</span>
              <span className="text-[#D4AF37] text-sm font-bold">+{coins} COINS AL JUGAR</span>
            </div>
          )}
        </div>
        
        {/* Botón CTA */}
        <button
          className={`px-8 py-3 text-black font-black text-lg border-2 border-black shadow-[4px_4px_0px_#000] transition-all hover:scale-105 whitespace-nowrap`}
          style={{ backgroundColor: buttonColor }}
        >
          {buttonText} →
        </button>
        
      </div>
      
      {/* Ribbon de "HOT" o "NUEVO" */}
      {isHovered && (
        <div className="absolute top-4 right-4 bg-[#FF0055] text-white text-xs font-bold px-2 py-1 rotate-12">
          🔥 POPULAR
        </div>
      )}
    </motion.div>
  );
}