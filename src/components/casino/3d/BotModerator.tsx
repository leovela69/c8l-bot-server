"use client";

import { useState, useEffect } from "react";
import { useGameStore } from "@/lib/roulette/game-store";

const GAME_TIPS = [
  "Apuesta en numeros externos (rojo/negro) para mas probabilidad de ganar.",
  "Las apuestas 'pleno' pagan 35:1 pero la probabilidad es baja.",
  "Gestiona tu saldo: no apuestes mas del 5% en un giro.",
  "Las docenas pagan 2:1 — buen equilibrio riesgo/recompensa.",
  "Puedes repetir la ultima apuesta con el boton REPEAT.",
  "Columna 2:1 — cubre 12 numeros de golpe.",
  "El 0 (verde) da ventaja a la casa. Evitalo si quieres ir seguro.",
  "Combina apuestas internas y externas para diversificar.",
];

const BOT_REACTIONS: Record<string, string[]> = {
  betting: [
    "Tomad vuestro tiempo... la ruleta no tiene prisa.",
    "Hagan sus apuestas, damas y caballeros.",
    "Confiad en vuestro instinto!",
  ],
  spinning: [
    "Rien ne va plus! No mas apuestas.",
    "La bola esta en juego... buena suerte!",
    "Vamos a ver que dice la rueda...",
  ],
  result: [
    "Resultado confirmado. Nueva ronda en breve.",
    "La suerte es caprichosa. Seguimos!",
  ],
};

export default function BotModerator() {
  const { phase } = useGameStore();
  const [currentTip, setCurrentTip] = useState(0);
  const [botMessage, setBotMessage] = useState("Bienvenido! Estoy aqui para ayudarte a jugar.");
  const [isTyping, setIsTyping] = useState(false);
  const [blink, setBlink] = useState(false);

  // Cycle tips
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTip(prev => (prev + 1) % GAME_TIPS.length);
    }, 12000);
    return () => clearInterval(interval);
  }, []);

  // Blink animation
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setBlink(true);
      setTimeout(() => setBlink(false), 200);
    }, 3500 + Math.random() * 2000);
    return () => clearInterval(blinkInterval);
  }, []);

  // React to game phases
  useEffect(() => {
    const reactions = BOT_REACTIONS[phase] || [];
    if (reactions.length > 0) {
      setIsTyping(true);
      setTimeout(() => {
        setBotMessage(reactions[Math.floor(Math.random() * reactions.length)]);
        setIsTyping(false);
      }, 1000);
    }
  }, [phase]);

  return (
    <div className="absolute top-28 left-4 z-30 flex items-start gap-2 max-w-[220px]">
      {/* Bot Avatar - Galactic Water Bubble Pixar/Disney style */}
      <div className="relative flex-shrink-0">
        {/* Outer glow */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            width: 64,
            height: 64,
            background: "radial-gradient(circle, rgba(100, 200, 255, 0.3) 0%, transparent 70%)",
            filter: "blur(8px)",
            transform: "scale(1.3)",
          }}
        />
        {/* Main bubble body */}
        <svg width="64" height="64" viewBox="0 0 100 100" className="relative">
          {/* Bubble body - translucent sphere */}
          <defs>
            <radialGradient id="bubbleBody" cx="40%" cy="35%" r="60%">
              <stop offset="0%" stopColor="rgba(180, 240, 255, 0.9)" />
              <stop offset="30%" stopColor="rgba(80, 180, 255, 0.7)" />
              <stop offset="60%" stopColor="rgba(40, 120, 220, 0.6)" />
              <stop offset="85%" stopColor="rgba(20, 60, 180, 0.5)" />
              <stop offset="100%" stopColor="rgba(10, 30, 120, 0.4)" />
            </radialGradient>
            <radialGradient id="bubbleHighlight" cx="30%" cy="25%" r="35%">
              <stop offset="0%" stopColor="rgba(255, 255, 255, 0.9)" />
              <stop offset="100%" stopColor="rgba(255, 255, 255, 0)" />
            </radialGradient>
            <radialGradient id="galaxyInner" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(150, 100, 255, 0.3)" />
              <stop offset="50%" stopColor="rgba(50, 150, 255, 0.1)" />
              <stop offset="100%" stopColor="rgba(0, 200, 255, 0.05)" />
            </radialGradient>
          </defs>

          {/* Shadow */}
          <ellipse cx="50" cy="92" rx="20" ry="5" fill="rgba(0,0,0,0.15)" />

          {/* Main sphere */}
          <circle cx="50" cy="48" r="38" fill="url(#bubbleBody)" />

          {/* Galaxy swirl inside */}
          <circle cx="50" cy="48" r="30" fill="url(#galaxyInner)" />

          {/* Tiny stars inside the bubble */}
          <circle cx="35" cy="55" r="1" fill="rgba(255,255,255,0.8)">
            <animate attributeName="opacity" values="0.3;1;0.3" dur="2s" repeatCount="indefinite" />
          </circle>
          <circle cx="60" cy="40" r="0.8" fill="rgba(200,220,255,0.9)">
            <animate attributeName="opacity" values="0.5;1;0.5" dur="1.5s" repeatCount="indefinite" />
          </circle>
          <circle cx="45" cy="62" r="0.6" fill="rgba(180,200,255,0.7)">
            <animate attributeName="opacity" values="0.4;1;0.4" dur="2.5s" repeatCount="indefinite" />
          </circle>
          <circle cx="55" cy="35" r="0.7" fill="rgba(255,255,255,0.6)">
            <animate attributeName="opacity" values="0.2;0.9;0.2" dur="3s" repeatCount="indefinite" />
          </circle>

          {/* Eyes - big expressive Pixar style */}
          {/* Left eye white */}
          <ellipse cx="40" cy="44" rx="9" ry={blink ? 1 : 10} fill="white"
            style={{ transition: "ry 0.1s ease" }} />
          {/* Left pupil */}
          {!blink && (
            <>
              <circle cx="41" cy="46" r="5" fill="#1a1a3a" />
              <circle cx="39" cy="44" r="2" fill="white" />
            </>
          )}

          {/* Right eye white */}
          <ellipse cx="60" cy="44" rx="9" ry={blink ? 1 : 10} fill="white"
            style={{ transition: "ry 0.1s ease" }} />
          {/* Right pupil */}
          {!blink && (
            <>
              <circle cx="61" cy="46" r="5" fill="#1a1a3a" />
              <circle cx="59" cy="44" r="2" fill="white" />
            </>
          )}

          {/* Cute smile */}
          <path d="M 40 58 Q 50 66 60 58" stroke="#1a1a5a" strokeWidth="2.5" fill="none" strokeLinecap="round" />

          {/* Main highlight (top-left shine) */}
          <circle cx="35" cy="30" r="12" fill="url(#bubbleHighlight)" />

          {/* Secondary smaller highlight */}
          <circle cx="62" cy="32" r="5" fill="rgba(255,255,255,0.4)" />

          {/* Outer bubble rim reflection */}
          <circle cx="50" cy="48" r="37" fill="none" stroke="rgba(180, 230, 255, 0.4)" strokeWidth="1.5" />

          {/* Floating animation wobble effect via subtle outline */}
          <circle cx="50" cy="48" r="38" fill="none" stroke="rgba(100, 200, 255, 0.2)" strokeWidth="0.5">
            <animate attributeName="r" values="37.5;38.5;37.5" dur="3s" repeatCount="indefinite" />
          </circle>
        </svg>

        {/* Online dot */}
        <div className="absolute -bottom-0.5 right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-black shadow-[0_0_6px_rgba(74,222,128,0.6)]" />
      </div>

      {/* Speech area */}
      <div className="flex flex-col gap-1.5 pt-1">
        {/* Name tag */}
        <div className="flex items-center gap-1.5">
          <span className="text-cyan-200 font-mono text-[11px] font-bold">Leon C8L</span>
          <span className="bg-cyan-500/20 text-cyan-300 text-[7px] font-mono px-1.5 py-0.5 rounded-full border border-cyan-500/30">
            MODERADOR
          </span>
        </div>

        {/* Speech bubble */}
        <div className="relative bg-white/10 backdrop-blur-md border border-cyan-300/20 rounded-xl rounded-tl-sm p-2.5 shadow-[0_0_15px_rgba(100,200,255,0.1)]">
          {isTyping ? (
            <div className="flex gap-1.5 items-center py-1 px-1">
              <span className="w-2 h-2 bg-cyan-300 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-2 h-2 bg-cyan-300 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-2 h-2 bg-cyan-300 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          ) : (
            <p className="text-cyan-50 text-[11px] leading-relaxed">
              {botMessage}
            </p>
          )}
        </div>

        {/* Tip */}
        <div className="flex items-start gap-1.5 opacity-70">
          <span className="text-[10px] mt-0.5">💡</span>
          <p className="text-cyan-200/60 text-[9px] leading-tight font-mono">
            {GAME_TIPS[currentTip]}
          </p>
        </div>
      </div>
    </div>
  );
}
