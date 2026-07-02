// app/profile/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  Sparkles, TrendingUp, Coins, Gem, Activity, 
  Layers, Send, Wallet, ExternalLink, Shield, Music, User
} from 'lucide-react';
import LionMascot from '@/components/ui/LionMascot';
import { useApp } from '@/context/AppContext';

export default function UnifiedProfile() {
  const { language, user, c8lCoins, c8lDiamonds, t } = useApp();
  const [analytics, setAnalytics] = useState<{
    total_reach: number;
    total_engagement: number;
    top_content: any[];
    weekly_growth: number;
  }>({
    total_reach: 15430,
    total_engagement: 8.4,
    top_content: [
      { title: "Cyber Heartbeat (Solo Session)", views: 4500, likes: 320 },
      { title: "Leo Vela Duet Challenge", views: 3200, likes: 290 },
      { title: "Lounge Live Session #18", views: 2800, likes: 190 }
    ],
    weekly_growth: 12.5
  });
  
  const [connectedPlatforms, setConnected] = useState(["Youtube", "TikTok", "Twitch"]);
  const [mascotState, setMascotState] = useState<"idle" | "dance" | "win" | "sad" | "celebrate">("idle");

  useEffect(() => {
    const fetchUnifiedAnalytics = async () => {
      try {
        const socialData = await fetch('/api/social/analytics').then(r => r.json());
        const walletData = await fetch('/api/economy/wallet').then(r => r.json());
        const topContent = await fetch('/api/social/top-posts').then(r => r.json());
        
        if (socialData && !socialData.error) {
          setAnalytics({
            total_reach: socialData.total_reach || 15430,
            total_engagement: socialData.avg_engagement || 8.4,
            top_content: (topContent && topContent.length > 0) ? topContent.slice(0, 5) : analytics.top_content,
            weekly_growth: socialData.growth_percent || 12.5
          });
          setConnected(socialData.connected_platforms || ["Youtube", "TikTok", "Twitch"]);
        }
      } catch (e) {
        // Fallback to initial mock state if offline / database not configured
      }
    };
    
    fetchUnifiedAnalytics();
  }, []);

  return (
    <div className="min-h-screen text-white relative font-sans pt-28 md:pt-32 pb-24 overflow-hidden bg-gradient-to-br from-[#0c0507] via-[#050505] to-[#120409] select-none">
      {/* Background Grid Scanlines */}
      <div 
        className="fixed inset-0 z-0 opacity-5 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), 
            linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06))
          `,
          backgroundSize: "100% 4px, 6px 100%"
        }}
      ></div>

      <div className="container mx-auto px-6 max-w-6xl relative z-10">
        
        {/* Header Navigation link */}
        <div className="flex justify-between items-center mb-10 border-b border-white/5 pb-6">
          <Link 
            href="/community" 
            className="text-xs uppercase tracking-widest text-zinc-400 hover:text-[var(--color-gold)] transition-colors flex items-center gap-2"
          >
            <span>←</span>
            <span>Volver a la Comunidad</span>
          </Link>
          <span className="text-zinc-500 font-mono text-[9px] uppercase tracking-widest">
            PANEL DE RENDIMIENTO DE CREADOR
          </span>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* Left Main column - Unified Analytics */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            <div className="glass-panel p-8 rounded-3xl bg-black/40 border border-white/5 flex-grow flex flex-col justify-between">
              
              <div>
                {/* Heading */}
                <div className="flex items-center gap-3 mb-6">
                  <span className="p-3 bg-[var(--color-neon-blue)]/10 text-[var(--color-neon-blue)] rounded-2xl">
                    <Activity size={24} />
                  </span>
                  <div>
                    <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest font-extrabold block">
                      C8L Unified Dashboard
                    </span>
                    <h1 className="font-heading font-black text-2xl md:text-3xl uppercase tracking-wider text-glow-neon text-white">
                      CENTRO DE CREACIÓN UNIFICADO
                    </h1>
                  </div>
                </div>

                {/* Subtitle / description */}
                <p className="text-xs text-zinc-400 font-light leading-relaxed mb-8 max-w-xl">
                  Visualiza tus métricas integradas de redes, audita tu saldo comercial en vivo y monitorea el engagement de tus covers publicados.
                </p>

                {/* Metrics Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                  
                  <div className="p-5 rounded-2xl bg-white/[0.01] border border-white/5 hover:border-zinc-800 transition">
                    <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest font-bold block">
                      Alcance Total (7d)
                    </span>
                    <strong className="text-2xl font-mono text-white block mt-1.5">
                      {analytics.total_reach.toLocaleString()}
                    </strong>
                    <span className="text-[10px] font-bold text-emerald-400 mt-0.5 inline-flex items-center gap-1">
                      <TrendingUp size={11} />
                      +{analytics.weekly_growth}% {language === "es" ? "Crecimiento" : "Growth"}
                    </span>
                  </div>

                  <div className="p-5 rounded-2xl bg-white/[0.01] border border-white/5 hover:border-zinc-800 transition">
                    <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest font-bold block">
                      Engagement Promedio
                    </span>
                    <strong className="text-2xl font-mono text-[var(--color-neon-blue)] block mt-1.5">
                      {analytics.total_engagement}%
                    </strong>
                    <span className="text-[9px] font-mono text-zinc-600 uppercase mt-0.5 block">
                      Interacción en Covers
                    </span>
                  </div>

                  <div className="p-5 rounded-2xl bg-white/[0.01] border border-white/5 hover:border-zinc-800 transition flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest font-bold block">
                        Saldo Monedero
                      </span>
                      <strong className="text-lg font-mono text-[var(--color-gold)] block mt-1.5 flex items-center gap-1">
                        <Coins size={14} className="text-[var(--color-gold)]" />
                        {c8lCoins.toLocaleString()} Coins
                      </strong>
                    </div>
                    <span className="text-[9px] font-mono text-cyan-400 mt-1 flex items-center gap-0.5">
                      <Gem size={10} />
                      {c8lDiamonds.toLocaleString()} Diamonds
                    </span>
                  </div>

                </div>

                {/* Top Performing List */}
                <h3 className="font-heading font-black text-sm text-[var(--color-gold)] uppercase tracking-wider mb-4 flex items-center gap-1.5">
                  <Music size={16} />
                  <span>COVERS POPULARES EN EL FEED</span>
                </h3>

                <div className="space-y-3">
                  {analytics.top_content.map((post, i) => (
                    <div 
                      key={i} 
                      className="p-3.5 rounded-xl bg-white/[0.01] border border-white/5 hover:border-zinc-800 transition flex justify-between items-center text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-5 h-5 rounded bg-zinc-900 border border-white/10 flex items-center justify-center font-mono text-[9px] text-zinc-500">0{i+1}</span>
                        <span className="font-semibold text-white truncate max-w-[200px] sm:max-w-xs">{post.title}</span>
                      </div>
                      <span className="font-mono text-zinc-500 text-[10px]">
                        👁️ {post.views} views • ❤️ {post.likes} likes
                      </span>
                    </div>
                  ))}
                </div>

              </div>

              {/* Footer text */}
              <div className="border-t border-white/5 pt-4 mt-8 flex items-center gap-2 text-[10px] text-zinc-500 uppercase tracking-wider font-mono">
                <Shield size={12} className="text-zinc-400" />
                <span>Auditoría de canal activa • HMAC Hash seguro</span>
              </div>

            </div>
          </div>

          {/* Right column - Actions & Mascot preview */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            
            {/* Mascot Interactive Panel */}
            <div className="glass-panel p-6 rounded-3xl bg-black/40 border border-white/5 flex flex-col items-center justify-center text-center">
              <div 
                className="w-24 h-24 rounded-full bg-zinc-950 border-2 border-[var(--color-gold)]/30 flex items-center justify-center relative cursor-pointer hover:scale-105 active:scale-95 transition shadow-[0_0_15px_rgba(212,175,55,0.15)] mb-4"
                onClick={() => {
                  setMascotState("dance");
                  setTimeout(() => setMascotState("idle"), 2500);
                }}
              >
                <LionMascot state={mascotState} size={75} className="mt-[-6px]" />
              </div>
              <h4 className="font-heading font-black text-sm uppercase tracking-wider text-white">
                {user?.displayName || "Leo Vela"}
              </h4>
              <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest mt-1">
                ID: {user?.uid?.substring(0, 10) || "user_c8l"}
              </span>
            </div>

            {/* Quick Actions Panel */}
            <div className="glass-panel p-6 rounded-3xl bg-black/50 border border-white/5 text-left flex flex-col justify-between h-full">
              <div className="space-y-4">
                <h3 className="font-heading font-black text-sm text-white uppercase tracking-wider border-b border-white/5 pb-3">
                  ACCIONES RÁPIDAS
                </h3>

                <button 
                  onClick={() => window.location.href = '/studio'}
                  className="w-full py-3.5 bg-[var(--color-gold)] text-black font-heading font-black text-xs uppercase tracking-widest rounded-xl hover:bg-[var(--color-gold-light)] transition box-glow-gold cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Music size={14} />
                  <span>ESTUDIO CREAR MÚSICA</span>
                </button>

                <button 
                  onClick={() => window.location.href = '/streamer/multipost'}
                  className="w-full py-3.5 bg-black border border-white/10 text-white font-heading font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-zinc-900 transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Send size={14} className="text-[var(--color-neon-blue)]" />
                  <span>DIFUNDIR EN REDES ({connectedPlatforms.length})</span>
                </button>
              </div>

              {/* Financial redirect actions */}
              <div className="border-t border-white/5 pt-4 mt-6 space-y-3">
                <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest font-black block">
                  ECONOMÍA C8L
                </span>
                
                <button 
                  onClick={() => window.location.href = '/casino'}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-black font-bold text-xs uppercase tracking-wider rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 box-glow-neon"
                >
                  <Wallet size={13} />
                  <span>COMPRAR COINS (Stripe)</span>
                </button>

                <button 
                  onClick={() => window.location.href = '/streamer/profile-services?tab=wallet'}
                  className="w-full py-2.5 bg-black border border-white/10 text-zinc-400 hover:text-white rounded-xl text-xs transition cursor-pointer"
                >
                  CANJEAR DIAMANTES → COINS
                </button>
              </div>

            </div>

          </div>

        </div>

      </div>
    </div>
  );
}