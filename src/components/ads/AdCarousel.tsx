// components/ads/AdCarousel.tsx
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { AdBanner } from './AdBanner';

interface AdCarouselProps {
  banners: Array<{
    id: string;
    title: string;
    description: string;
    gameId: string;
    buttonText: string;
    backgroundColor: string;
    coins: number;
  }>;
  onAdClick: (adId: string, gameId: string) => void;
  autoPlayInterval?: number;
}

export function AdCarousel({ banners, onAdClick, autoPlayInterval = 5000 }: AdCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % banners.length);
  }, [banners.length]);

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
  };

  // Auto-play
  useEffect(() => {
    if (!isAutoPlaying) return;
    const interval = setInterval(nextSlide, autoPlayInterval);
    return () => clearInterval(interval);
  }, [isAutoPlaying, nextSlide, autoPlayInterval]);

  const currentBanner = banners[currentIndex];

  return (
    <div className="relative group">
      
      {/* Botón anterior */}
      <button
        onClick={prevSlide}
        className="absolute left-2 top-1/2 transform -translate-y-1/2 z-10 bg-black/80 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <ChevronLeft size={24} className="text-white" />
      </button>
      
      {/* Banner actual */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.3 }}
        >
          <AdBanner
            id={currentBanner.id}
            title={currentBanner.title}
            description={currentBanner.description}
            gameId={currentBanner.gameId}
            buttonText={currentBanner.buttonText}
            backgroundColor={currentBanner.backgroundColor}
            coins={currentBanner.coins}
            onAdClick={onAdClick}
          />
        </motion.div>
      </AnimatePresence>
      
      {/* Botón siguiente */}
      <button
        onClick={nextSlide}
        className="absolute right-2 top-1/2 transform -translate-y-1/2 z-10 bg-black/80 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <ChevronRight size={24} className="text-white" />
      </button>
      
      {/* Indicadores de página */}
      <div className="flex justify-center gap-2 mt-4">
        {banners.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            className={`h-2 rounded-full transition-all ${
              idx === currentIndex ? 'w-8 bg-[#D4AF37]' : 'w-2 bg-gray-600'
            }`}
          />
        ))}
      </div>
      
    </div>
  );
}