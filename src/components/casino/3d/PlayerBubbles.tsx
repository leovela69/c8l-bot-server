"use client";

import { useGameStore } from "@/lib/roulette/game-store";
import { useEffect, useState } from "react";

interface BubbleWithFade {
  id: string;
  playerId: string;
  playerName: string;
  playerAvatar: string;
  text: string;
  fading: boolean;
}

export default function PlayerBubbles() {
  const { playerBubbles, phase } = useGameStore();
  const [visibleBubbles, setVisibleBubbles] = useState<BubbleWithFade[]>([]);

  // Don't show bubbles during spinning
  const shouldShow = phase !== "spinning";

  useEffect(() => {
    if (!shouldShow) {
      setVisibleBubbles([]);
      return;
    }

    // Map current bubbles to visible ones with fade state
    setVisibleBubbles(
      playerBubbles.map((b) => ({
        ...b,
        fading: false,
      }))
    );

    // Start fade-out after 4.5 seconds (total life is 6s, fade for last 1.5s)
    const fadeTimers = playerBubbles.map((b) => {
      const age = Date.now() - b.timestamp;
      const remainingBeforeFade = Math.max(0, 4500 - age);
      return setTimeout(() => {
        setVisibleBubbles((prev) =>
          prev.map((vb) => (vb.id === b.id ? { ...vb, fading: true } : vb))
        );
      }, remainingBeforeFade);
    });

    return () => {
      fadeTimers.forEach(clearTimeout);
    };
  }, [playerBubbles, shouldShow]);

  if (!shouldShow || visibleBubbles.length === 0) return null;

  return (
    <div className="absolute inset-0 pointer-events-none z-40">
      {/* Position bubbles around the play area - spread across bottom area above PlayersBar */}
      {visibleBubbles.map((bubble, index) => {
        // Calculate position based on player index (spread horizontally)
        const totalBubbles = visibleBubbles.length;
        const spacing = Math.min(180, 600 / Math.max(totalBubbles, 1));
        const startX = 280 + index * spacing;
        const yPos = 75; // percentage from top (near bottom)

        return (
          <div
            key={bubble.id}
            className={`absolute transition-all duration-500 ease-out
              ${bubble.fading ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0"}`}
            style={{
              left: `${startX}px`,
              bottom: `${yPos}px`,
            }}
          >
            {/* Bubble container */}
            <div className="flex items-end gap-1.5 max-w-[200px]">
              {/* Avatar */}
              <div className="w-8 h-8 rounded-full bg-gray-800/90 border-2 border-white/20
                            flex items-center justify-center flex-shrink-0 overflow-hidden shadow-lg">
                {typeof bubble.playerAvatar === "string" && (bubble.playerAvatar.startsWith("http") || bubble.playerAvatar.startsWith("/")) ? (
                  <img src={bubble.playerAvatar} alt={bubble.playerName} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-base">{bubble.playerAvatar || "🎲"}</span>
                )}
              </div>

              {/* Speech bubble */}
              <div className="relative">
                {/* Triangle pointer */}
                <div className="absolute -bottom-1 left-3 w-3 h-3 bg-white/15 rotate-45
                              border-r border-b border-white/20" />

                {/* Message */}
                <div className="relative bg-white/15 backdrop-blur-md border border-white/20
                              rounded-xl rounded-bl-sm px-3 py-1.5 shadow-xl
                              shadow-black/30">
                  <p className="text-[9px] text-teal-300 font-mono font-bold mb-0.5 truncate max-w-[140px]">
                    {bubble.playerName}
                  </p>
                  <p className="text-white text-[11px] leading-tight break-words max-w-[160px]">
                    {bubble.text}
                  </p>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
