// components/ads/AdManager.tsx (versión completa)
import { useState, useEffect } from 'react';
import { AdCarousel } from './AdCarousel';
import { RechargePanel } from './RechargePanel';
import { SidebarBanners } from './SidebarBanners';
import { PopupOffer } from './PopupOffer';
import { FloatingCoinButton } from './FloatingCoinButton';
import { supabase } from '@/lib/supabase/client';
import { RECHARGE_PACKAGES } from './RechargePanel';

interface AdManagerProps {
  userCoins: number;
  setUserCoins: (coins: number) => void;
  userId: string;
  userName?: string;
}

const DEFAULT_CAMPAIGNS = [
  {
    id: 'raid_campaign',
    title: '⚔️ RAID DEL TITÁN ⚔️',
    description: 'El Rey del Ruido ha aparecido. ¡Únete a la batalla y gana premios épicos!',
    gameId: 'raid',
    buttonText: 'UNIRSE A LA RAID',
    backgroundColor: '#1a0a0a',
    coins: 50
  },
  {
    id: 'slots_campaign',
    title: '🎰 SLOTS DEL OLIMPO 🎰',
    description: 'Consigue la bendición de los dioses. Jackpot progresivo de 69,420 COINS',
    gameId: 'slots',
    buttonText: 'GIRAR AHORA',
    backgroundColor: '#0d0d0e',
    coins: 25
  },
  {
    id: 'roulette_campaign',
    title: '🎡 RULETA C8L 🎡',
    description: 'Apuesta al rojo, negro o número exacto. ¡Multiplica tus coins!',
    gameId: 'roulette',
    buttonText: 'APOSTAR',
    backgroundColor: '#0a1a1a',
    coins: 25
  },
  {
    id: 'clans_campaign',
    title: '🏰 GUERRA DE CLANES 🏰',
    description: 'Forma tu clan, recluta miembros y domina el ranking semanal',
    gameId: 'clans',
    buttonText: 'CREAR CLAN',
    backgroundColor: '#1a0a2a',
    coins: 100
  }
];

export function AdManager({ userCoins, setUserCoins, userId, userName }: AdManagerProps) {
  const [showRecharge, setShowRecharge] = useState(false);
  const [showPopupOffer, setShowPopupOffer] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [clickedAds, setClickedAds] = useState<Set<string>>(new Set());
  const [dailyClicks, setDailyClicks] = useState(0);
  const [lastPopupTime, setLastPopupTime] = useState<number>(0);

  // Cargar clics del día desde localStorage
  useEffect(() => {
    const today = new Date().toDateString();
    const saved = localStorage.getItem('c8l_ad_clicks');
    if (saved) {
      const { date, count, clickedIds } = JSON.parse(saved);
      if (date === today) {
        setDailyClicks(count);
        setClickedAds(new Set(clickedIds));
      }
    }

    // Mostrar pop-up de oferta cada 10 minutos (si no se ha mostrado en la sesión)
    const lastPopup = localStorage.getItem('c8l_last_popup');
    const now = Date.now();
    if (!lastPopup || now - parseInt(lastPopup) > 600000) { // 10 minutos
      const timer = setTimeout(() => {
        setShowPopupOffer(true);
        localStorage.setItem('c8l_last_popup', now.toString());
      }, 30000); // Mostrar después de 30 segundos en la página
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAdClick = async (adId: string, gameId: string, rewardCoins: number) => {
    if (dailyClicks >= 10) {
      alert('🎁 Llegaste al límite de bonos diarios. ¡Vuelve mañana!');
      return;
    }

    if (clickedAds.has(adId)) {
      alert('🎁 Ya reclamaste el bono de este banner. ¡Prueba otro!');
      return;
    }

    setUserCoins(userCoins + rewardCoins);
    setDailyClicks(prev => prev + 1);
    setClickedAds(prev => new Set([...prev, adId]));

    const today = new Date().toDateString();
    localStorage.setItem('c8l_ad_clicks', JSON.stringify({
      date: today,
      count: dailyClicks + 1,
      clickedIds: [...clickedAds, adId]
    }));

    try {
      await supabase.from('ad_clicks').insert({
        user_id: userId,
        user_name: userName,
        ad_id: adId,
        game_id: gameId,
        coins_rewarded: rewardCoins,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Error registrando clic:', error);
    }
  };

  const handlePopupAccept = async () => {
    const bonusCoins = 1000;
    setUserCoins(userCoins + bonusCoins);
    
    try {
      await supabase.from('ad_clicks').insert({
        user_id: userId,
        user_name: userName,
        ad_id: 'popup_special_offer',
        game_id: 'recharge',
        coins_rewarded: bonusCoins,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <>
      {/* Sidebar Banners (izquierda) */}
      <SidebarBanners
        onAdClick={handleAdClick}
        isCollapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Botón flotante de coins */}
      <FloatingCoinButton
        userCoins={userCoins}
        onClick={() => setShowRecharge(true)}
      />

      {/* Pop-up de oferta especial */}
      <PopupOffer
        isOpen={showPopupOffer}
        onClose={() => setShowPopupOffer(false)}
        onAccept={handlePopupAccept}
        offerData={{
          title: '🎁 ¡OFERTA DE BIENVENIDA! 🎁',
          description: 'Recarga por primera vez y duplica tus coins',
          coins: 5000,
          bonusCoins: 5000,
          price: 25,
          timerSeconds: 7200,
          icon: '🎁'
        }}
      />

      {/* Panel de recarga */}
      <RechargePanel
        userCoins={userCoins}
        onRecharge={async (packageId, amount) => {
          const packageData = RECHARGE_PACKAGES.find(p => p.id === packageId);
          if (packageData) {
            const totalCoins = packageData.coins + (packageData.bonusCoins || 0);
            setUserCoins(userCoins + totalCoins);
            
            await supabase.from('recharges').insert({
              user_id: userId,
              user_name: userName,
              package_id: packageId,
              amount_usd: amount,
              coins_received: totalCoins,
              timestamp: new Date()
            });
          }
        }}
        isOpen={showRecharge}
        onClose={() => setShowRecharge(false)}
      />

      {/* Carrusel de banners principales */}
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-sm font-mono text-[#D4AF37] uppercase tracking-wider flex items-center gap-2">
            <span>🔥</span> PROMOCIONES ACTIVAS
          </h3>
          <div className="text-xs text-gray-500 bg-black/50 px-3 py-1 rounded-full">
            🎁 Bono diario: {dailyClicks}/10 reclamados
          </div>
        </div>
        <AdCarousel
          banners={DEFAULT_CAMPAIGNS}
          onAdClick={(adId, gameId) => {
            const campaign = DEFAULT_CAMPAIGNS.find(c => c.id === adId);
            handleAdClick(adId, gameId, campaign?.coins || 10);
          }}
          autoPlayInterval={6000}
        />
      </div>

      {/* Enlaces rápidos (footer) */}
      <div className="grid grid-cols-4 gap-3 mt-6 max-w-5xl mx-auto">
        {DEFAULT_CAMPAIGNS.map(campaign => (
          <a
            key={campaign.id}
            href={`/games?game=${campaign.gameId}`}
            className="bg-black border-2 border-gray-800 p-3 text-center hover:border-[#D4AF37] hover:bg-[#D4AF37]/10 transition-all group"
          >
            <div className="text-2xl mb-1">
              {campaign.gameId === 'raid' && '⚔️'}
              {campaign.gameId === 'slots' && '🎰'}
              {campaign.gameId === 'roulette' && '🎡'}
              {campaign.gameId === 'clans' && '🏰'}
            </div>
            <div className="text-xs font-mono text-gray-400 group-hover:text-[#D4AF37] transition-colors">
              {campaign.buttonText.split(' ')[0]}
            </div>
            <div className="text-[10px] text-green-500 mt-1">+{campaign.coins}</div>
          </a>
        ))}
        <button
          onClick={() => setShowRecharge(true)}
          className="bg-[#D4AF37]/20 border-2 border-[#D4AF37] p-3 text-center hover:bg-[#D4AF37]/30 transition-all"
        >
          <div className="text-2xl mb-1">💰</div>
          <div className="text-xs font-mono text-[#D4AF37]">RECARGAR</div>
          <div className="text-[10px] text-green-500">BONUS</div>
        </button>
      </div>
    </>
  );
}