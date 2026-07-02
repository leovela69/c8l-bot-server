"use client";
import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import { motion } from "framer-motion";
import { Lock, CheckCircle2 } from "lucide-react";

interface RewardItem {
  id: string;
  nameEs: string;
  nameEn: string;
  descEs: string;
  descEn: string;
  cost: number;
  promoCode: string;
}

export default function VIPRewardsShop() {
  const { t, language, credits, deductCredits, showNotification, user } = useApp();
  const [unlockedCodes, setUnlockedCodes] = useState<Record<string, string>>({});

  const REWARDS: RewardItem[] = [
    {
      id: "master",
      nameEs: "Pase de Mastering IA Pro",
      nameEn: "Pro AI Mastering Token",
      descEs: "Procesa un track de audio completo en C8L AI Studio sin costes de sesión.",
      descEn: "Process an audio track in C8L AI Studio with no session costs.",
      cost: 15,
      promoCode: "C8L-AI-MASTER-VIP"
    },
    {
      id: "merch",
      nameEs: "15% de Descuento en Merch",
      nameEn: "15% Discount on Merch Store",
      descEs: "Cupón exclusivo para comprar camisetas y gorras oficiales en la tienda C8L.",
      descEn: "Exclusive promo code to use at checkout on official C8L apparel.",
      cost: 25,
      promoCode: "C8L-LOCOS-15"
    },
    {
      id: "consulting",
      nameEs: "Consultoría de Marketing 1v1",
      nameEn: "1v1 Marketing Consultation",
      descEs: "Reunión de 15 min con el equipo de booking y marketing digital de C8L.",
      descEn: "Book a 15-minute diagnostic session with C8L campaign managers.",
      cost: 50,
      promoCode: "C8L-MARKET-VIP-PRO"
    }
  ];

  const handlePurchase = (reward: RewardItem) => {
    if (unlockedCodes[reward.id]) {
      showNotification(
        language === "es" ? "Ya has desbloqueado este cupón." : "You have already unlocked this reward.",
        "info"
      );
      return;
    }

    const success = deductCredits(reward.cost);
    if (success) {
      setUnlockedCodes(prev => ({ ...prev, [reward.id]: reward.promoCode }));
      showNotification(
        language === "es"
          ? `¡Has desbloqueado: ${reward.nameEs}! Código generado.`
          : `Unlocked: ${reward.nameEn}! Promo code generated.`,
        "success"
      );

      if (user) {
        import("../../utils/analytics").then(({ logActivity }) => {
          logActivity(
            user.uid, 
            user.email || "", 
            user.displayName || (user.email ? user.email.split("@")[0] : ""), 
            "reward_redeem", 
            `Canjeó recompensa: "${language === "es" ? reward.nameEs : reward.nameEn}" por ${reward.cost} créditos. Código obtenido: ${reward.promoCode}`
          );
        }).catch(err => console.error("Error logging reward redemption:", err));
      }
    } else {
      showNotification(
        language === "es"
          ? `Créditos insuficientes. Juega en Arcade o inicia sesión para ganar más.`
          : `Insufficient credits. Play C8L Arcade or log in to earn credits.`,
        "error"
      );
    }
  };

  return (
    <section id="vip-rewards" className="py-16 text-white relative bg-zinc-950/40 border-t border-white/5 rounded-3xl mt-12 p-8">
      <div className="container mx-auto max-w-4xl relative z-10">
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10">
          <div>
            <h3 className="font-heading font-black text-2xl text-[var(--color-gold)] uppercase tracking-wider text-glow-gold">
              🎁 {language === "es" ? "VIP Rewards & Canjes" : "VIP Rewards Center"}
            </h3>
            <p className="text-zinc-500 text-xs mt-1 max-w-md">
              {language === "es"
                ? "Canjea los créditos acumulados en nuestras experiencias interactivas por recompensas reales de C8L."
                : "Exchange credits accumulated from our interactive experiences for tangible creative C8L rewards."}
            </p>
          </div>
          
          <div className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-black/60 border border-[var(--color-gold)]/40 text-sm font-mono text-[var(--color-gold)] box-glow-gold">
            <span>🪙</span>
            <span>{language === "es" ? "Tienes:" : "You have:"} <strong>{credits}</strong></span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {REWARDS.map((reward) => {
            const isUnlocked = !!unlockedCodes[reward.id];
            const canAfford = credits >= reward.cost;

            return (
              <div
                key={reward.id}
                className={`glass-panel p-6 rounded-2xl flex flex-col justify-between transition-all duration-300 ${
                  isUnlocked 
                    ? "border-emerald-500/30 bg-emerald-950/5" 
                    : "border-white/5 hover:border-[var(--color-gold)]/20"
                }`}
              >
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-xs font-mono font-bold text-[var(--color-gold)] bg-[var(--color-gold)]/10 px-2.5 py-1 rounded-full flex items-center gap-1">
                      🪙 {reward.cost}
                    </span>
                    {isUnlocked ? (
                      <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 size={12} /> {t("shop-unlocked")}
                      </span>
                    ) : !canAfford ? (
                      <span className="text-xs font-mono text-zinc-600 flex items-center gap-1">
                        <Lock size={10} /> {t("shop-locked")}
                      </span>
                    ) : null}
                  </div>

                  <h4 className="font-heading font-black text-base text-white mb-2 uppercase">
                    {language === "es" ? reward.nameEs : reward.nameEn}
                  </h4>
                  <p className="text-zinc-400 text-[11px] leading-relaxed mb-6">
                    {language === "es" ? reward.descEs : reward.descEn}
                  </p>
                </div>

                <div className="mt-auto">
                  {isUnlocked ? (
                    <div className="bg-black/60 border border-emerald-500/20 rounded-xl p-3 text-center">
                      <p className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest mb-1">
                        {language === "es" ? "CÓDIGO PROMO" : "PROMO CODE"}
                      </p>
                      <p className="text-xs font-mono font-bold text-emerald-400 select-all tracking-wider">
                        {unlockedCodes[reward.id]}
                      </p>
                    </div>
                  ) : (
                    <button
                      onClick={() => handlePurchase(reward)}
                      disabled={!canAfford}
                      className={`w-full py-3 font-heading font-bold text-[10px] tracking-widest uppercase rounded-xl transition-all cursor-pointer ${
                        canAfford
                          ? "bg-[var(--color-gold)] text-black hover:bg-[var(--color-gold-light)] box-glow-gold"
                          : "bg-zinc-900 text-zinc-600 border border-white/5 cursor-not-allowed opacity-50"
                      }`}
                    >
                      {language === "es" ? "CANJEAR RECOMPENSA" : "REDEEM REWARD"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
