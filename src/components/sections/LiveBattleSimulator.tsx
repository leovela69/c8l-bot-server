"use client";
import React, { useState, useEffect, useRef } from "react";
import { useApp } from "../../context/AppContext";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Tv, Send, Coins, Users, Award, ShieldAlert, 
  Sparkles, CreditCard, Flame 
} from "lucide-react";
import LionMascot from "../ui/LionMascot";
import { sendLiveGift, rechargeCoins, AVAILABLE_GIFTS, GiftConfig } from "../../utils/billing";

interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  isGift?: boolean;
  giftIcon?: string;
  giftName?: string;
  isSystem?: boolean;
}

export default function LiveBattleSimulator() {
  const { language, user, c8lCoins, c8lDiamonds, addCCoins, addCDiamonds, deductCCoins, showNotification } = useApp();

  // PK Score states
  const [creatorScore, setCreatorScore] = useState(2500);
  const [opponentScore, setOpponentScore] = useState(3000);

  // Gifting & Mascot animations
  const [activeMascotState, setActiveMascotState] = useState<"idle" | "dance" | "win" | "sad" | "celebrate">("idle");
  const [activeGiftOverlay, setActiveGiftOverlay] = useState<{
    senderName: string;
    giftIcon: string;
    giftName: string;
    coinValue: number;
    category: string;
  } | null>(null);

  // Chat stream
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [typedMessage, setTypedMessage] = useState("");
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Recharges Modal
  const [showRechargeModal, setShowRechargeModal] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [selectedGateway, setSelectedGateway] = useState<"VISA_REDSYS" | "PAYPAL" | "PAYONEER" | "SEPA">("VISA_REDSYS");
  const [apiResponseLog, setApiResponseLog] = useState<string | null>(null);

  // PK Battle Timer
  const [timeLeft, setTimeLeft] = useState(180); // 3 minutes

  // Seats state for simulated PK spectators/participants
  const [pkSeats, setPkSeats] = useState<(any | null)[]>([
    // Row 1: Bando 1 (Ataque) - Seats 1 to 4
    { id: "s1", name: "Guerrero A", avatar: "🛡️", seatNumber: 1, is_singing: false, is_muted: false },
    { id: "s2", name: "Guerrero B", avatar: "⚔️", seatNumber: 2, is_singing: false, is_muted: false },
    { id: "s3", name: "Guerrero C", avatar: "🎤", seatNumber: 3, is_singing: false, is_muted: false },
    { id: "s4", name: "Guerrero D", avatar: "⚡", seatNumber: 4, is_singing: false, is_muted: false },
    
    // Row 2: Tareas y Apoyo - Seats 5 to 8
    { id: "s5", name: "Helper A", avatar: "🔧", seatNumber: 5, is_singing: false, is_muted: false },
    { id: "s6", name: "Helper B", avatar: "📦", seatNumber: 6, is_singing: false, is_muted: false },
    { id: "s7", name: "Staff A", avatar: "👮", seatNumber: 7, is_singing: false, is_muted: false },
    { id: "s8", name: "Staff B", avatar: "🚨", seatNumber: 8, is_singing: false, is_muted: false },
    
    // Row 3: Bando 2 (Defensa) - Seats 9 to 12
    { id: "s9", name: "Defensor A", avatar: "🛡️", seatNumber: 9, is_singing: false, is_muted: false },
    { id: "s10", name: "Defensor B", avatar: "🏰", seatNumber: 10, is_singing: false, is_muted: false },
    { id: "s11", name: "Defensor C", avatar: "🦄", seatNumber: 11, is_singing: false, is_muted: false },
    { id: "s12", name: "Defensor D", avatar: "🌀", seatNumber: 12, is_singing: false, is_muted: false },
    
    // Row 4: Mando VIP / Willy, Emanuel, Lyz - Seats 13 to 15
    { id: "s13", name: "Willy", avatar: "😎", seatNumber: 13, is_singing: false, is_muted: false },
    { id: "s14", name: "Emanuel", avatar: "👑", seatNumber: 14, is_singing: false, is_muted: false },
    { id: "s15", name: "Lyz", avatar: "💎", seatNumber: 15, is_singing: false, is_muted: false },
  ]);

  const handleSeatClick = (index: number) => {
    if (!user) return;
    const seatNumber = index + 1;
    const currentSeat = pkSeats[index];

    const updated = [...pkSeats];
    if (currentSeat) {
      if (currentSeat.id === user.uid) {
        // Leave seat
        updated[index] = null;
        showNotification(`Dejaste el sillón ${seatNumber}`, "info");
      } else {
        // Toggle mute of other user
        currentSeat.is_muted = !currentSeat.is_muted;
        showNotification(`${currentSeat.name} ha sido ${currentSeat.is_muted ? 'silenciado' : 'activado'}`, "info");
      }
    } else {
      // Sit down
      pkSeats.forEach((s, idx) => {
        if (s && s.id === user.uid) {
          updated[idx] = null;
        }
      });
      updated[index] = {
        id: user.uid,
        name: user.displayName || "Leo Vela",
        avatar: "🦁",
        seatNumber,
        is_singing: false,
        is_muted: false
      };
      showNotification(`Te sentaste en el sillón ${seatNumber}`, "success");
    }
    setPkSeats(updated);
  };

  const renderPkSeat = (index: number) => {
    const seat = pkSeats[index];
    const seatNumber = index + 1;
    const isCurrentUser = seat?.id === user?.uid;

    if (!seat) {
      return (
        <button
          key={`empty-${index}`}
          type="button"
          onClick={() => handleSeatClick(index)}
          className="bg-black/60 border border-dashed border-zinc-800 hover:border-amber-500/50 p-2.5 rounded-xl flex flex-col items-center justify-center min-h-[80px] transition-all group cursor-pointer"
        >
          <span className="text-lg opacity-40 group-hover:opacity-100 transition-opacity">🛋️</span>
          <span className="text-[8px] text-zinc-500 font-mono mt-1">Sillón {seatNumber}</span>
          <span className="text-[7px] text-zinc-650 font-bold uppercase mt-0.5">Vacío</span>
        </button>
      );
    }

    return (
      <div
        key={`seat-${index}`}
        onClick={() => handleSeatClick(index)}
        className={`p-2.5 rounded-xl border flex flex-col items-center justify-center min-h-[80px] relative transition-all cursor-pointer ${
          isCurrentUser
            ? "bg-amber-500/10 border-amber-500 shadow-[0_0_10px_rgba(212,175,55,0.2)]"
            : seat.is_muted
            ? "bg-red-950/10 border-red-900/50 text-zinc-400"
            : "bg-zinc-950/80 border-zinc-800"
        }`}
      >
        <span className="text-xl">{seat.avatar}</span>
        <span className="text-[9px] font-bold text-white mt-1 truncate w-14 text-center leading-none">
          {seat.name}
        </span>
        <span className="text-[7px] text-zinc-500 font-mono mt-0.5">
          Sillón {seatNumber}
        </span>
        {seat.is_muted && (
          <span className="absolute top-1 right-1 text-[7px] text-red-500 font-bold bg-red-950/50 px-1 py-0.5 rounded">
            MUTED
          </span>
        )}
      </div>
    );
  };

  // Opponent auto score increase simulator
  useEffect(() => {
    const interval = setInterval(() => {
      setOpponentScore(prev => prev + Math.floor(Math.random() * 80) + 10);
      
      // Fictional audience comments
      const viewerNames = ["GamerVIP", "LeoFan_99", "Marina_BCN", "Alex_Vela", "EstrellaDorada", "ToniMadrid"];
      const comments = [
        "¡Vamos Leo a ganar la PK!",
        "Qué nivel de transmisión de la agencia C8L",
        "Ese león de oro tiene que salir hoy",
        "¡Temazo de fondo!",
        "El split de la agencia va fino jaja",
        "¿Quién tira el disco de platino?"
      ];
      
      const newComment: ChatMessage = {
        id: Math.random().toString(),
        sender: viewerNames[Math.floor(Math.random() * viewerNames.length)],
        text: comments[Math.floor(Math.random() * comments.length)]
      };

      setChatMessages(prev => [...prev.slice(-30), newComment]);
    }, 4500);

    return () => clearInterval(interval);
  }, []);

  // Timer loop
  useEffect(() => {
    if (timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [timeLeft]);

  // Initial chat setup
  useEffect(() => {
    setChatMessages([
      { id: "sys1", sender: "SYSTEM", text: language === "es" ? "¡Bienvenido al canal Live PK de Leo Vela!" : "Welcome to Leo Vela's Live PK Channel!", isSystem: true },
      { id: "sys2", sender: "SYSTEM", text: language === "es" ? "Comisión de agencia del 50% activa. Las monedas ganadas recirculan como diamantes." : "Active 50% agency split. Coins earned circulate as diamonds.", isSystem: true },
      { id: "c1", sender: "LeoFan_99", text: "¡Leo Vela el mejor!" },
      { id: "c2", sender: "Marina_BCN", text: "Hola a todos, a por el león 🦁" }
    ]);
  }, [language]);

  // Scroll to bottom of chat without scrolling the parent window
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: "smooth"
      });
    }
  }, [chatMessages]);

  const handleSendTextMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!typedMessage.trim() || !user) return;

    const newMsg: ChatMessage = {
      id: Math.random().toString(),
      sender: user.displayName || user.email?.split("@")[0] || "Espectador",
      text: typedMessage
    };

    setChatMessages(prev => [...prev, newMsg]);
    setTypedMessage("");
  };

  // Gifting Trigger handler
  const handleSendGift = async (giftId: string) => {
    if (!user) {
      showNotification(
        language === "es" ? "Debes iniciar sesión para enviar regalos." : "You must log in to send gifts.",
        "error"
      );
      return;
    }

    const gift = AVAILABLE_GIFTS.find(g => g.id === giftId);
    if (!gift) return;

    try {
      const senderName = user.displayName || user.email?.split("@")[0] || "Anon";
      const result = await sendLiveGift(
        user.uid,
        senderName,
        "LEO_VELA_CREATOR_ID",
        "Leo Vela",
        giftId
      );

      if (result.success) {
        deductCCoins(gift.coinValue);
        const creatorSplitDiamonds = Math.floor(gift.coinValue * 0.5);
        addCDiamonds(creatorSplitDiamonds);

        // Update PK Score points
        setCreatorScore(prev => prev + gift.coinValue);

        // Add gift message to live chat feed
        const giftMsg: ChatMessage = {
          id: result.transactionId,
          sender: senderName,
          text: "",
          isGift: true,
          giftIcon: gift.icon,
          giftName: gift.name
        };
        setChatMessages(prev => [...prev, giftMsg]);

        // Trigger visual overlay and Mascot animation
        if (gift.category === "Epic" || gift.category === "Legendary") {
          setActiveGiftOverlay({
            senderName,
            giftIcon: gift.icon,
            giftName: gift.name,
            coinValue: gift.coinValue,
            category: gift.category
          });
          
          setActiveMascotState("celebrate");
          setTimeout(() => {
            setActiveMascotState("idle");
            setActiveGiftOverlay(null);
          }, 5000);
        } else {
          setActiveMascotState("dance");
          setTimeout(() => setActiveMascotState("idle"), 2500);
        }

        showNotification(
          language === "es"
            ? `¡Enviaste ${gift.name}! (${gift.coinValue} monedas C8L)`
            : `Sent ${gift.name}! (${gift.coinValue} C8L coins)`,
          "success"
        );
      }
    } catch (err: any) {
      console.error(err);
      if (err.message.includes("Error 402") || err.message.includes("Insufficient")) {
        showNotification(
          language === "es"
            ? "Saldo insuficiente de monedas C8L."
            : "Insufficient balance of C8L coins.",
          "error"
        );
        setShowRechargeModal(true);
      } else {
        showNotification(err.message || "Error", "error");
      }
    }
  };

  // Simulates Stripe Gateway Recharge checkout
  const handleCheckoutRecharge = async (amount: number, coins: number) => {
    if (!user) return;
    setProcessingPayment(true);
    setApiResponseLog(null);

    let route = "/payments/stripe/visa-mastercard";
    let desc = "Redsys Card";
    if (selectedGateway === "PAYONEER") {
      route = "/payments/payoneer/checkout";
      desc = "Payoneer API";
    } else if (selectedGateway === "PAYPAL") {
      route = "/payments/paypal/express";
      desc = "PayPal REST SDK";
    } else if (selectedGateway === "SEPA") {
      route = "/payments/bank-transfer/sepa";
      desc = "SEPA Instant IBAN";
    }

    try {
      await new Promise(resolve => setTimeout(resolve, 1200));
      const senderName = user.displayName || user.email?.split("@")[0] || "Anon";
      await rechargeCoins(user.uid, senderName, amount, coins, selectedGateway);
      addCCoins(coins);

      const mockResponse = {
        status: 200,
        statusText: "OK",
        endpoint: `POST ${route}`,
        headers: {
          "Content-Type": "application/json",
          "X-Signature-SHA256": Math.random().toString(36).substring(2, 15) + "c8lsecure"
        },
        payload: {
          success: true,
          gateway: selectedGateway,
          coinsCredited: coins,
          amountSpent: amount,
          currency: "EUR",
          user: user.uid,
          auditId: "TX_" + Math.random().toString(36).substring(2, 9).toUpperCase(),
          status: "SUCCESS_COMPLETED"
        }
      };
      setApiResponseLog(JSON.stringify(mockResponse, null, 2));

      const rechargeMsg: ChatMessage = {
        id: Math.random().toString(),
        sender: "SYSTEM",
        text: language === "es" 
          ? `🪙 Espectador ${senderName} recargó ${coins} Coins vía ${desc}.`
          : `🪙 Spectator ${senderName} recharged ${coins} Coins via ${desc}.`,
        isSystem: true
      };
      setChatMessages(prev => [...prev, rechargeMsg]);

      showNotification(
        language === "es"
          ? `¡Recarga de ${coins} monedas completada con éxito!`
          : `Recharge of ${coins} coins completed successfully!`,
        "success"
      );

      setTimeout(() => {
        setShowRechargeModal(false);
        setApiResponseLog(null);
      }, 3500);

    } catch (e: any) {
      showNotification("Error checkout: " + e.message, "error");
    } finally {
      setProcessingPayment(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const totalPK = creatorScore + opponentScore;
  const creatorPercent = totalPK > 0 ? (creatorScore / totalPK) * 100 : 50;

  return (
    <div 
      className="glass-panel p-6 rounded-3xl border-white/5 flex flex-col gap-6 text-left relative overflow-hidden box-glow-gold bg-cover bg-center"
      style={{ backgroundImage: "url('/images/pk_lounge_background.png')" }}
    >
      {/* Dark overlay for readability */}
      <div className="absolute inset-0 bg-black/85 backdrop-blur-[1px] z-0" />

      <div className="relative z-10 flex flex-col gap-6 w-full">
        {/* Real-time WebSockets / Gifting Overlay */}
        <AnimatePresence>
          {activeGiftOverlay && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: -50 }}
              className="absolute inset-x-6 top-20 z-50 p-6 bg-gradient-to-r from-purple-950/90 via-[#D4AF37]/90 to-pink-950/90 backdrop-blur-md rounded-2xl border border-[var(--color-gold)]/40 text-center flex flex-col items-center justify-center shadow-2xl"
            >
              <Sparkles className="text-[var(--color-gold)] animate-spin-slow mb-2" size={32} />
              <h4 className="font-heading font-black text-lg md:text-xl uppercase tracking-widest text-white text-glow-gold">
                🌟 {activeGiftOverlay.senderName} 🌟
              </h4>
              <p className="text-zinc-200 text-xs font-heading font-bold uppercase tracking-wider mt-1">
                {language === "es" ? "ENVIÓ UN REGALO" : "SENT A GIFT"} {activeGiftOverlay.category === "Legendary" ? "LEYENDA" : "ÉPICO"}
              </p>
              <div className="flex items-center gap-3 mt-3">
                <span className="text-5xl animate-bounce">{activeGiftOverlay.giftIcon}</span>
                <div className="text-left">
                  <span className="block font-heading font-black text-xl text-white uppercase">{activeGiftOverlay.giftName}</span>
                  <span className="block font-mono text-xs text-[var(--color-gold)]">💎 Split de Agencia: +{(activeGiftOverlay.coinValue * 0.5).toLocaleString()} Diamantes para Creador</span>
                </div>
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/5 to-transparent pointer-events-none animate-pulse"></div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/5 pb-4">
          <div>
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block font-bold">Live PK Battle Arena</span>
            <h3 className="font-heading font-black text-xl text-white uppercase tracking-wider mt-1 flex items-center gap-2">
              <Tv className="text-red-500 animate-pulse" size={18} />
              <span>Leo Vela Live Stream</span>
            </h3>
          </div>
          
          <div className="flex items-center gap-4 w-full md:w-auto justify-between">
            <div className="flex items-center gap-2 bg-red-950/30 border border-red-500/20 px-3.5 py-1.5 rounded-full">
              <Flame className="text-red-500 animate-bounce" size={14} />
              <span className="font-mono text-xs text-red-400 font-bold uppercase">{formatTime(timeLeft)}</span>
            </div>
            <button
              onClick={() => setShowRechargeModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/30 text-xs font-mono text-amber-400 hover:bg-amber-500/20 transition-all cursor-pointer box-glow-gold"
            >
              <Coins size={12} />
              <span>Recargar Monedas</span>
            </button>
          </div>
        </div>

        {/* PK Battle Score Bar */}
        <div className="w-full flex flex-col gap-1">
          <div className="flex justify-between items-center text-xs font-mono font-bold">
            <span className="text-cyan-400 uppercase">Leo Vela: {creatorScore.toLocaleString()} pts</span>
            <span className="text-red-400 uppercase">Streamer_X: {opponentScore.toLocaleString()} pts</span>
          </div>
          <div className="h-4 bg-zinc-900 rounded-full overflow-hidden flex border border-white/5">
            <motion.div 
              className="h-full bg-gradient-to-r from-cyan-600 to-cyan-400"
              style={{ width: `${creatorPercent}%` }}
              animate={{ width: `${creatorPercent}%` }}
              transition={{ duration: 0.5 }}
            />
            <div 
              className="h-full bg-gradient-to-r from-red-400 to-red-600"
              style={{ width: `${100 - creatorPercent}%` }}
            />
          </div>
        </div>

        {/* Grid: Video Split View & Live Chat Feed */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch w-full">
          
          {/* Left Column: Split Portals & 15 Seats */}
          <div className="lg:col-span-8 flex flex-col gap-6 w-full">
            
            {/* Split Video Player Screen (Leo vs Opponent) */}
            <div className="bg-[#0a0a0f] rounded-2xl overflow-hidden border border-white/5 relative min-h-[260px] flex flex-col sm:flex-row">
              {/* Stream 1: Leo Vela (Creator) */}
              <div className="flex-1 relative border-b sm:border-b-0 sm:border-r border-white/5 flex items-center justify-center bg-gradient-to-b from-purple-950/20 to-black min-h-[180px]">
                <div className="absolute inset-0 flex items-center justify-center z-10">
                  <LionMascot state={activeMascotState} size={150} />
                </div>
                <div className="absolute bottom-3 left-3 z-20 px-2 py-1 bg-black/60 backdrop-blur-sm rounded border border-white/5 text-[9px] font-mono text-zinc-300 uppercase">
                  🔵 LEO VELA
                </div>
              </div>

              {/* Stream 2: Opponent (Streamer_X) */}
              <div className="flex-1 relative flex items-center justify-center bg-gradient-to-b from-red-950/20 to-black min-h-[180px]">
                <div className="text-center z-10 flex flex-col items-center">
                  <span className="text-4xl filter saturate-50 animate-pulse">🦊</span>
                  <span className="text-zinc-500 font-heading font-black text-xs uppercase tracking-widest mt-2 block font-mono">Opponent Live</span>
                </div>
                <div className="absolute bottom-3 left-3 z-20 px-2 py-1 bg-black/60 backdrop-blur-sm rounded border border-white/5 text-[9px] font-mono text-zinc-300 uppercase">
                  🔴 STREAMER_X
                </div>
              </div>

              {/* PK Match Header Badge */}
              <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 bg-gradient-to-r from-cyan-600 via-purple-600 to-red-600 px-3 py-1 rounded-full text-[9px] font-heading font-black uppercase tracking-widest border border-white/10 shadow-lg">
                PK Battle Live
              </div>
            </div>

            {/* 15 Seats Arena Grid for PK Battles */}
            <div className="bg-black/75 border-2 border-white/5 rounded-2xl p-5 flex flex-col relative overflow-hidden shadow-2xl">
              <div className="absolute -top-12 -left-12 w-36 h-36 rounded-full bg-amber-500/5 blur-3xl pointer-events-none" />
              <div className="absolute -bottom-12 -right-12 w-36 h-36 rounded-full bg-cyan-500/5 blur-3xl pointer-events-none" />

              <h4 className="text-xs font-black text-[#D4AF37] mb-5 flex items-center justify-between font-mono uppercase tracking-widest border-b border-dashed border-zinc-800 pb-2.5 z-10">
                <span>🛋️ BUTACAS DE APOYO Y ATAQUE (15)</span>
                <span className="text-[9px] text-zinc-500 font-mono">
                  Ocupados: {pkSeats.filter(Boolean).length} / 15
                </span>
              </h4>

              <div className="space-y-6 z-10">
                {/* Row 1: Bando 1 (Ataque) */}
                <div className="bg-cyan-950/5 border border-cyan-500/25 rounded-xl p-4 relative">
                  <div className="absolute -top-2.5 left-3 bg-[#0a0a0f] border border-cyan-500 text-cyan-400 text-[8px] font-black font-mono px-2 py-0.5 rounded uppercase tracking-wider">
                    ⚔️ BANDO 1 (ATAQUE / Butacas 1-4)
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-1.5">
                    {[0, 1, 2, 3].map(renderPkSeat)}
                  </div>
                </div>

                {/* Row 2: Tareas y Apoyo */}
                <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-xl p-4 relative">
                  <div className="absolute -top-2.5 left-3 bg-[#0a0a0f] border border-zinc-700 text-zinc-400 text-[8px] font-black font-mono px-2 py-0.5 rounded uppercase tracking-wider">
                    ⚙️ TAREAS Y APOYO (Butacas 5-8)
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-1.5">
                    {[4, 5, 6, 7].map(renderPkSeat)}
                  </div>
                </div>

                {/* Row 3: Bando 2 (Defensa) */}
                <div className="bg-red-950/5 border border-red-500/25 rounded-xl p-4 relative">
                  <div className="absolute -top-2.5 left-3 bg-[#0a0a0f] border border-red-500 text-red-400 text-[8px] font-black font-mono px-2 py-0.5 rounded uppercase tracking-wider">
                    🛡️ BANDO 2 (DEFENSA / Butacas 9-12)
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-1.5">
                    {[8, 9, 10, 11].map(renderPkSeat)}
                  </div>
                </div>

                {/* Row 4: Mando VIP */}
                <div className="bg-amber-950/5 border border-[#D4AF37]/30 rounded-xl p-4 relative shadow-[0_0_10px_rgba(212,175,55,0.05)]">
                  <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-[#0a0a0f] border border-[#D4AF37] text-[#D4AF37] text-[8px] font-black font-mono px-3 py-0.5 rounded uppercase tracking-widest shadow-md">
                    👑 MANDO VIP / Willy, Emanuel, Lyz (Butacas 13-15)
                  </div>
                  <div className="grid grid-cols-3 gap-3 mt-2 max-w-sm mx-auto">
                    {[12, 13, 14].map(renderPkSeat)}
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: Live Chat Feed */}
          <div className="lg:col-span-4 bg-[#050508]/90 backdrop-blur-sm rounded-2xl border border-white/5 p-4 flex flex-col justify-between min-h-[350px]">
            <div ref={chatContainerRef} className="flex-grow overflow-y-auto max-h-[450px] pr-1 flex flex-col gap-2.5">
              {chatMessages.map((msg) => {
                if (msg.isSystem) {
                  return (
                    <p key={msg.id} className="text-[9px] font-mono text-zinc-500 bg-white/[0.01] p-1.5 rounded border border-white/5 italic">
                      {msg.text}
                    </p>
                  );
                }
                if (msg.isGift) {
                  return (
                    <div key={msg.id} className="text-[10px] bg-[var(--color-gold)]/10 border border-[var(--color-gold)]/20 p-2 rounded-xl flex items-center gap-2">
                      <span className="text-lg">{msg.giftIcon}</span>
                      <div>
                        <strong className="text-zinc-200">{msg.sender}</strong>
                        <span className="text-[var(--color-gold)] ml-1 font-bold">envió {msg.giftName}!</span>
                      </div>
                    </div>
                  );
                }
                return (
                  <div key={msg.id} className="text-[11px] leading-relaxed text-zinc-300">
                    <strong className="text-zinc-500 font-mono font-bold mr-1">{msg.sender}:</strong>
                    <span>{msg.text}</span>
                  </div>
                );
              })}
            </div>

            <form onSubmit={handleSendTextMessage} className="flex gap-2 border-t border-white/5 pt-3 mt-2">
              <input
                type="text"
                value={typedMessage}
                onChange={(e) => setTypedMessage(e.target.value)}
                placeholder={language === "es" ? "Escribe un comentario..." : "Send a comment..."}
                className="flex-grow bg-white/5 border border-white/10 rounded-xl px-3 py-2 outline-none focus:border-[var(--color-gold)] text-xs text-white"
              />
              <button
                type="submit"
                className="p-2.5 bg-[var(--color-gold)] text-black rounded-xl hover:bg-[var(--color-gold-light)] transition-colors cursor-pointer flex items-center justify-center"
              >
                <Send size={12} />
              </button>
            </form>
          </div>

        </div>

        {/* Gifting Bar Interface */}
        <div className="border-t border-white/5 pt-4 w-full">
          <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-4 flex items-center gap-2 font-mono">
            <span>🎁 Enviar Regalo al Streamer (Split de Retención 50/50)</span>
          </h4>
          
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5 w-full">
            {AVAILABLE_GIFTS.map((gift) => {
              const isAffordable = c8lCoins >= gift.coinValue;
              return (
                <button
                  key={gift.id}
                  type="button"
                  onClick={() => handleSendGift(gift.id)}
                  className={`p-3 rounded-2xl border bg-white/[0.01] hover:bg-white/[0.03] transition-all flex flex-col items-center justify-center text-center cursor-pointer relative group ${
                    isAffordable ? "border-white/5 hover:border-[var(--color-gold)]/40" : "border-dashed border-red-500/20 hover:border-red-500/40"
                  }`}
                >
                  <span className="text-3xl group-hover:scale-125 transition-transform duration-300">{gift.icon}</span>
                  <span className="text-[10px] font-heading font-black text-white mt-2 block truncate w-full">{language === "es" ? gift.name : gift.nameEn}</span>
                  <span className="text-[9px] font-mono text-[var(--color-gold)] font-bold mt-0.5">{gift.coinValue} Coins</span>
                  
                  {gift.category !== "Standard" && (
                    <span className={`absolute -top-2 -right-1 text-[7px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-black border ${
                      gift.category === "Legendary" ? "border-yellow-500/30 text-yellow-400" : "border-purple-500/30 text-purple-400"
                    }`}>
                      {gift.category}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Secure Checkout Modal */}
        <AnimatePresence>
          {showRechargeModal && (
            <div className="fixed inset-0 z-55 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm overflow-y-auto">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-xl bg-zinc-950 border border-[var(--color-gold)]/20 p-6 rounded-3xl text-left shadow-2xl relative my-8"
              >
                <h3 className="font-heading font-black text-xl text-white uppercase tracking-wider mb-2 flex items-center gap-2">
                  <CreditCard className="text-[var(--color-gold)] animate-pulse" size={22} />
                  <span>C8L Secure Checkout Router</span>
                </h3>
                <p className="text-zinc-400 text-xs mb-6">
                  {language === "es"
                    ? "Adquiere paquetes de monedas C8L de forma instantánea. Selecciona tu pasarela de cobro preferida."
                    : "Acquire C8L coin bundles instantly. Select your preferred checkout gateway."}
                </p>

                <div className="mb-6">
                  <span className="block text-[9px] font-mono text-zinc-500 uppercase tracking-widest font-black mb-2">
                    1. SELECCIONAR PASARELA DE PAGO (GATEWAY ROUTER)
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: "VISA_REDSYS", name: "Visa / Redsys", icon: "💳" },
                      { id: "PAYPAL", name: "PayPal REST", icon: "🅿️" },
                      { id: "PAYONEER", name: "Payoneer B2B", icon: "🌐" },
                      { id: "SEPA", name: "SEPA IBAN", icon: "🏦" }
                    ].map((gw) => (
                      <button
                        key={gw.id}
                        type="button"
                        disabled={processingPayment || apiResponseLog !== null}
                        onClick={() => setSelectedGateway(gw.id as any)}
                        className={`p-2.5 rounded-xl border text-center flex flex-col items-center justify-center cursor-pointer transition-all ${
                          selectedGateway === gw.id
                            ? "border-[var(--color-gold)] bg-[var(--color-gold)]/10 text-white font-bold box-glow-gold"
                            : "border-white/5 bg-white/[0.02] text-zinc-400 hover:text-white hover:bg-white/[0.04]"
                        } disabled:opacity-40`}
                      >
                        <span className="text-lg mb-1">{gw.icon}</span>
                        <span className="text-[9px] font-mono truncate w-full">{gw.name}</span>
                      </button>
                    ))}
                  </div>
                  
                  <div className="mt-3 bg-black/60 border border-white/5 px-3 py-2 rounded-xl flex items-center justify-between">
                    <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest font-black">ACTIVE ROUTE</span>
                    <span className="text-[10px] font-mono text-cyan-400 font-bold">
                      POST {selectedGateway === "PAYONEER" ? "/payments/payoneer/checkout" :
                            selectedGateway === "PAYPAL" ? "/payments/paypal/express" :
                            selectedGateway === "SEPA" ? "/payments/bank-transfer/sepa" :
                            "/payments/stripe/visa-mastercard"}
                    </span>
                  </div>
                </div>

                <div className="mb-6">
                  <span className="block text-[9px] font-mono text-zinc-500 uppercase tracking-widest font-black mb-2">
                    2. SELECCIONAR CANTIDAD DE MONEDAS
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { cost: 5, coins: 100, bonus: 10, label: "Paquete Starter" },
                      { cost: 20, coins: 500, bonus: 50, label: "Paquete Streamer Fan" },
                      { cost: 50, coins: 1500, bonus: 200, label: "Paquete Gold Fanatic" },
                      { cost: 100, coins: 4000, bonus: 600, label: "Paquete VIP Sponsor" }
                    ].map((pack, i) => (
                      <button
                        key={i}
                        type="button"
                        disabled={processingPayment || apiResponseLog !== null}
                        onClick={() => handleCheckoutRecharge(pack.cost, pack.coins + pack.bonus)}
                        className="p-3.5 rounded-2xl bg-white/5 border border-white/5 hover:border-[var(--color-gold)]/40 hover:bg-white/[0.08] transition-all flex justify-between items-center cursor-pointer text-left disabled:opacity-40 group"
                      >
                        <div>
                          <span className="block text-[8px] font-mono text-zinc-500 uppercase tracking-widest font-bold">{pack.label}</span>
                          <strong className="text-xs text-white font-mono">{pack.coins + pack.bonus} C8L Coins</strong>
                          {pack.bonus > 0 && <span className="text-[8px] text-emerald-400 font-mono font-bold ml-1">+{pack.bonus} Bonus</span>}
                        </div>
                        <span className="px-2.5 py-1.5 bg-[var(--color-gold)] text-black font-mono font-bold text-[10px] rounded-lg group-hover:scale-105 transition">
                          €{pack.cost}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {apiResponseLog && (
                  <div className="mb-6">
                    <span className="block text-[9px] font-mono text-zinc-500 uppercase tracking-widest font-black mb-1.5">
                      🖨️ HTTP SECURE GATEWAY RESPONSE LOG (WEBHOOK STREAMS)
                    </span>
                    <pre className="bg-black text-[9px] text-emerald-400 font-mono p-3 rounded-xl border border-emerald-500/20 max-h-[140px] overflow-y-auto no-scrollbar">
                      {apiResponseLog}
                    </pre>
                  </div>
                )}

                <div className="border-t border-white/5 pt-4 flex justify-end gap-2.5">
                  <button
                    type="button"
                    disabled={processingPayment}
                    onClick={() => { setShowRechargeModal(false); setApiResponseLog(null); }}
                    className="px-4 py-2 border border-white/10 hover:bg-white/5 text-xs font-bold uppercase rounded-xl transition cursor-pointer disabled:opacity-50"
                  >
                    {language === "es" ? "Cancelar" : "Cancel"}
                  </button>
                </div>

                {processingPayment && (
                  <div className="absolute inset-0 bg-black/85 backdrop-blur-[1px] flex flex-col items-center justify-center rounded-3xl z-40">
                    <div className="w-10 h-10 border-t-2 border-[var(--color-gold)] rounded-full animate-spin mb-3" />
                    <span className="text-xs font-mono text-[var(--color-gold)] uppercase tracking-widest animate-pulse">
                      POSTing to {selectedGateway === "PAYONEER" ? "Payoneer B2B API" :
                                   selectedGateway === "PAYPAL" ? "PayPal REST Endpoint" :
                                   selectedGateway === "SEPA" ? "SEPA Bank Router" :
                                   "Visa / Redsys Gateway"}...
                    </span>
                  </div>
                )}
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>

    </div>
  );
}
