// components/missions/MissionRating.tsx
'use client';
import { useState } from 'react';
import { Star } from 'lucide-react';

export function MissionRating({ missionId, onRated }: { missionId: string; onRated?: () => void }) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);

  const submitRating = async (value: number) => {
    setRating(value);
    await fetch('/api/missions/rate', {
      method: 'POST',
      body: JSON.stringify({ missionId, rating: value }),
    });
    onRated?.();
  };

  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          onClick={() => submitRating(star)}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(rating)}
          className="focus:outline-none"
        >
          <Star
            size={16}
            className={`${(hover || rating) >= star ? 'fill-[#D4AF37] text-[#D4AF37]' : 'text-gray-600'}`}
          />
        </button>
      ))}
    </div>
  );
}