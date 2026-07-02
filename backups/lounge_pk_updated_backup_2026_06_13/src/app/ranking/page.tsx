// app/ranking/page.tsx
'use client';
import { useState } from 'react';
import { LiveRanking } from '@/components/ranking/LiveRanking';

export default function RankingPage() {
  const [region, setRegion] = useState<'latam' | 'spain'>('latam');

  return (
    <div className="min-h-screen bg-black pt-28 md:pt-32 pb-24 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-black text-[#D4AF37]">🏆 Ranking de Streamers</h1>
          <div className="flex gap-2">
            <button
              onClick={() => setRegion('latam')}
              className={`px-4 py-2 font-bold rounded ${region === 'latam' ? 'bg-[#D4AF37] text-black' : 'bg-gray-800 text-white'}`}
            >
              🌎 LATAM + España
            </button>
            <button
              onClick={() => setRegion('spain')}
              className={`px-4 py-2 font-bold rounded ${region === 'spain' ? 'bg-[#D4AF37] text-black' : 'bg-gray-800 text-white'}`}
            >
              🇪🇸 Solo España
            </button>
          </div>
        </div>
        <LiveRanking region={region} />
      </div>
    </div>
  );
}