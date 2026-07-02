"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useApp } from "../../../context/AppContext";
import { useGameStore } from "@/lib/roulette/game-store";
import { createPlayerMessage } from "@/lib/roulette/bot-crupier";

// Emoji picker simple
const EMOJI_SETS = [
  ["🎰", "🎲", "💰", "🔥", "💎", "👑", "🍀", "⚡"],
  ["😂", "😎", "🤑", "😱", "🥳", "😤", "🙏", "💪"],
  ["❤️", "👍", "👎", "🎉", "💀", "🤡", "🫡", "🫠"],
];

export default function ChatPanel() {
  const { user, loginWithGoogle, logout } = useApp();
  const {
    chatMessages,
    addChatMessage,
    botPlayers,
    chatOpen,
    toggleChat,
    unreadCount,
    markChatRead,
  } = useGameStore();
  const [input, setInput] = useState("");
  const [showEmojis, setShowEmojis] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatMessages]);

  // Mark as read when panel opens
  useEffect(() => {
    if (chatOpen) {
      markChatRead();
    }
  }, [chatOpen, markChatRead]);

  const handleSend = useCallback(() => {
    if (!input.trim()) return;
    if (!user) return;
    const msg = {
      ...createPlayerMessage(input.trim()),
      sender: user.displayName || user.email?.split("@")[0] || "Jugador",
      senderAvatar: user.photoURL || (user as any).avatar || "",
    };
    addChatMessage(msg);
    setInput("");
    setShowEmojis(false);
  }, [input, user, addChatMessage]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSend();
  };

  const insertEmoji = (emoji: string) => {
    setInput(prev => prev + emoji);
  };

  // Play notification sound for bot messages when chat is closed
  useEffect(() => {
    if (!chatOpen && unreadCount > 0) {
      // Simple pop sound using Web Audio API
      try {
        const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        oscillator.frequency.value = 800;
        oscillator.type = "sine";
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
        oscillator.start(audioCtx.currentTime);
        oscillator.stop(audioCtx.currentTime + 0.3);
      } catch {
        // Audio not available
      }
    }
  }, [unreadCount, chatOpen]);

  // If chat is closed, show the toggle button only
  if (!chatOpen) {
    return (
      <button
        onClick={toggleChat}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-40
                   w-14 h-14 rounded-full bg-gradient-to-br from-teal-500 to-cyan-600
                   flex items-center justify-center shadow-lg shadow-teal-500/30
                   hover:scale-110 transition-all duration-200
                   border-2 border-teal-300/30 animate-pulse cursor-pointer"
        title="Abrir chat"
      >
        <span className="text-2xl">💬</span>
        {unreadCount > 0 && (
          <div className="absolute -top-1 -right-1 min-w-[20px] h-5 bg-red-500 rounded-full
                          flex items-center justify-center px-1 border-2 border-black
                          animate-bounce">
            <span className="text-white text-[9px] font-bold font-mono">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          </div>
        )}
      </button>
    );
  }

  return (
    <div className="flex flex-col h-full bg-black/80 backdrop-blur-md border-l border-white/10">
      {/* Header with close button */}
      <div className="p-3 border-b border-white/10 flex-shrink-0">
        <div className="flex items-center justify-between mb-2">
          <span className="text-white font-mono text-[10px] font-bold uppercase tracking-wider">
            💬 Chat
          </span>
          <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-1 bg-white/5 rounded-full px-2 py-0.5">
              <div className="w-1.5 h-1.5 bg-green-400 rounded-full" />
              <span className="text-gray-400 font-mono text-[8px]">
                {botPlayers.length + 1}
              </span>
            </div>
            <button
              onClick={toggleChat}
              className="w-5 h-5 rounded-full bg-white/10 hover:bg-red-500/30
                         flex items-center justify-center transition-colors group"
              title="Cerrar chat"
            >
              <span className="text-gray-400 group-hover:text-red-300 text-[10px] font-bold">✕</span>
            </button>
          </div>
        </div>

        {/* Online Players - smaller avatars in a single row */}
        <div className="flex items-center gap-1 overflow-x-auto">
          {/* Current user */}
          {/* Current user */}
          {user && (
            <div className="relative flex-shrink-0">
              <div className="w-7 h-7 rounded-full overflow-hidden border-2 border-teal-400 shadow-[0_0_4px_rgba(45,212,191,0.3)] bg-teal-600 flex items-center justify-center">
                {user.photoURL || (user as any).avatar ? (
                  <img
                    src={user.photoURL || (user as any).avatar || ""}
                    alt={user.displayName || "Tu"}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-teal-600 flex items-center justify-center text-white text-[10px] font-bold">
                    {(user.displayName || "T")[0]}
                  </div>
                )}
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-green-400 rounded-full border border-black" />
            </div>
          )}

          {/* Bot players */}
          {botPlayers.map((bot) => (
            <div key={bot.id} className="relative flex-shrink-0" title={bot.name}>
              <div className="w-7 h-7 rounded-full overflow-hidden border-2 border-gray-600 bg-gray-800 flex items-center justify-center">
                <span className="text-sm">{bot.avatar}</span>
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-green-400 rounded-full border border-black" />
            </div>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0">
        {chatMessages.map((msg) => (
          <div key={msg.id}>
            {msg.isSystem ? (
              <p className="text-gray-600 text-[10px] font-mono text-center py-1 px-2 bg-white/5 rounded-full">
                {msg.text}
              </p>
            ) : (
              <div className="flex gap-2 items-start">
                {/* Avatar */}
                <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0 border border-white/10 bg-gray-800 flex items-center justify-center">
                  {msg.senderAvatar && (msg.senderAvatar.startsWith("http") || msg.senderAvatar.startsWith("/")) ? (
                    <img
                      src={msg.senderAvatar}
                      alt={msg.sender}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                      <span className="text-sm">{msg.senderAvatar || "🎲"}</span>
                    </div>
                  )}
                </div>

                {/* Message content */}
                <div className="min-w-0 flex-1">
                  <span className={`text-[10px] font-mono font-bold block
                    ${msg.isBot ? "text-amber-400" : "text-teal-300"}`}>
                    {msg.sender}
                    {msg.sender === "Leon C8L" && (
                      <span className="ml-1.5 text-[7px] bg-amber-500/20 text-amber-300 px-1 py-0.5 rounded">
                        CASA
                      </span>
                    )}
                  </span>
                  <p className="text-gray-200 text-[11px] break-words leading-relaxed mt-0.5">
                    {msg.text}
                  </p>
                  <span className="text-gray-600 text-[8px] font-mono">
                    {new Date(msg.timestamp).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Input / Login area */}
      <div className="p-3 border-t border-white/10">
        {user ? (
          <div>
            {/* User info bar */}
            <div className="flex items-center gap-2 mb-2">
              <div className="w-5 h-5 rounded-full overflow-hidden border border-teal-400/50 bg-teal-700 flex items-center justify-center">
                {user.photoURL || (user as any).avatar ? (
                  <img
                    src={user.photoURL || (user as any).avatar || ""}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-teal-700 flex items-center justify-center text-[8px] text-white font-bold">
                    {(user.displayName || "T")[0]}
                  </div>
                )}
              </div>
              <span className="text-teal-300 text-[9px] font-mono flex-1 truncate">
                {user.displayName || user.email?.split("@")[0] || "Tu"}
              </span>
              <button
                onClick={() => logout()}
                className="text-gray-600 text-[8px] font-mono hover:text-red-400 transition-colors"
              >
                Salir
              </button>
            </div>

            {/* Emoji picker */}
            {showEmojis && (
              <div className="mb-2 bg-black/90 border border-white/10 rounded-lg p-2 space-y-1.5">
                {EMOJI_SETS.map((row, rowIdx) => (
                  <div key={rowIdx} className="flex gap-1">
                    {row.map((emoji, i) => (
                      <button
                        key={i}
                        onClick={() => insertEmoji(emoji)}
                        className="w-7 h-7 flex items-center justify-center rounded hover:bg-white/10 transition-colors text-base"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            )}

            {/* Chat input */}
            <div className="flex gap-1.5">
              <button
                onClick={() => setShowEmojis(!showEmojis)}
                className={`px-2 py-2 rounded-lg text-sm transition-colors
                  ${showEmojis ? "bg-teal-600/30 text-teal-300" : "bg-white/5 text-gray-400 hover:text-white"}`}
                title="Emojis"
              >
                😊
              </button>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Escribe un mensaje..."
                className="flex-1 bg-white/5 text-white text-xs px-3 py-2 rounded-lg
                           border border-white/10 focus:border-teal-500/50
                           focus:outline-none font-mono placeholder:text-gray-600"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim()}
                className="px-3 py-2 bg-teal-600 rounded-lg text-white text-xs font-mono font-bold
                           hover:bg-teal-500 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                ▶
              </button>
            </div>
          </div>
        ) : (
          /* Login prompt - visitors see read-only notice */
          <div className="space-y-2">
            <p className="text-gray-500 text-[10px] font-mono text-center">
              👁️ Modo espectador — Solo lectura
            </p>
            <button
              onClick={() => loginWithGoogle()}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl
                         bg-white/10 border border-white/20 hover:bg-white/15
                         transition-all group cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span className="text-white text-xs font-mono group-hover:text-teal-200 transition-colors">
                Entrar con Google para chatear
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
