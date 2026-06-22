'use client';
import { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { UnifiedGiftEffect } from './UnifiedGiftEffect';

export function GiftQueue({ gifts, onComplete }) {
  const [currentGift, setCurrentGift] = useState(null);
  const [queue, setQueue] = useState([]);

  useEffect(() => {
    if (gifts.length > 0) setQueue(prev => [...prev, ...gifts]);
  }, [gifts]);

  useEffect(() => {
    if (!currentGift && queue.length > 0) {
      setCurrentGift(queue[0]);
      setQueue(prev => prev.slice(1));
    }
  }, [currentGift, queue]);

  const handleComplete = () => {
    onComplete?.(currentGift?.id);
    setCurrentGift(null);
  };

  return (
    <AnimatePresence>
      {currentGift && (
        <UnifiedGiftEffect
          key={currentGift.id}
          gift={currentGift.gift}
          fromUser={currentGift.fromUser}
          toUser={currentGift.toUser}
          target={currentGift.target}
          targetTitle={currentGift.targetTitle}
          onComplete={handleComplete}
        />
      )}
    </AnimatePresence>
  );
}
