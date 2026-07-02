"use client";

import { useEffect, useState } from "react";
import { useGameStore } from "@/lib/roulette/game-store";
import { getRoomState, RemotePlayer } from "@/lib/roulette/multiplayer";
import { useApp } from "../../../context/AppContext";

export default function PlayersBar() {
  const { botPlayers, player } = useGameStore();
  const [remotePlayers, setRemotePlayers] = useState<RemotePlayer[]>([]);
  const { user } = useApp();

  useEffect(() => {
    const interval = setInterval(() => {
      const room = getRoomState();
      setRemotePlayers(room.players);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const allPlayers = [
    // Current player
    { 
      name: user?.displayName || "Tu", 
      avatar: user?.photoURL || (user as any)?.avatar || "🎲", 
      balance: player.balance, 
      isYou: true 
    },
    // Remote players from same room
    ...remotePlayers.map(p => ({ name: p.name, avatar: p.avatar, balance: p.balance, isYou: false })),
    // Bots
    ...botPlayers.map(b => ({ name: b.name, avatar: b.avatar, balance: b.balance, isYou: false })),
  ];

  return (
    <div className="absolute bottom-4 left-4 z-20 flex items-center gap-1">
      {/* Players count */}
      <div className="bg-black/70 border border-white/10 rounded-full px-2.5 py-1 flex items-center gap-1.5 mr-1">
        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
        <span className="text-white font-mono text-[10px] font-bold">{allPlayers.length}</span>
        <span className="text-gray-500 font-mono text-[9px]">en mesa</span>
      </div>

      {/* Player avatars */}
      <div className="flex -space-x-1.5">
        {allPlayers.slice(0, 8).map((p, i) => (
          <div
            key={i}
            className="relative group"
            title={`${p.name} - ${p.balance.toLocaleString()}`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center border-2 overflow-hidden text-sm
                ${p.isYou ? "border-teal-400 bg-teal-900/50" : "border-gray-600 bg-gray-900/80"}`}
            >
              {typeof p.avatar === "string" && (p.avatar.startsWith("http") || p.avatar.startsWith("/")) ? (
                <img src={p.avatar} alt={p.name} className="w-full h-full object-cover" />
              ) : (
                p.avatar
              )}
            </div>
            {/* Tooltip on hover */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block">
              <div className="bg-black/90 border border-white/10 rounded px-2 py-1 whitespace-nowrap">
                <p className="text-white text-[9px] font-mono font-bold">{p.name}</p>
                <p className="text-teal-400 text-[8px] font-mono">{p.balance.toLocaleString()}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
