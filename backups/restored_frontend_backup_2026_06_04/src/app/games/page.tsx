// app/games/page.tsx (final)
'use client';
import { GamesLobby } from '../../components/games/GamesLobby';
import { AdManager } from '../../components/ads/AdManager';
import { useApp } from '../../context/AppContext';

export default function GamesPage() {
  const { user, c8lCoins, setC8lCoins } = useApp();
  
  return (
    <div className="min-h-screen bg-black">
      
      {/* Header con AdManager (banners + todo el sistema publicitario) */}
      <div className="sticky top-0 z-30 bg-black/95 backdrop-blur-sm border-b-4 border-[#D4AF37] p-4">
        <AdManager
          userCoins={c8lCoins}
          setUserCoins={setC8lCoins}
          userId={user?.uid || 'anonymous'}
          userName={user?.displayName || 'Guest'}
        />
      </div>
      
      {/* Lobby de juegos */}
      <div className="pt-6">
        <GamesLobby
          userCoins={c8lCoins}
          setUserCoins={setC8lCoins}
          userId={user?.uid || 'anonymous'}
          userName={user?.displayName || 'Guest'}
        />
      </div>
      
    </div>
  );
}