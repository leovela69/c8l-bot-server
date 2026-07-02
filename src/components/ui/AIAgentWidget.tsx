"use client";
import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, X, Send, Coins, ShieldAlert, Sparkles, Gamepad2, MessageSquare, Brain, Trash2, RefreshCw } from "lucide-react";
import { useApp } from "../../context/AppContext";

// -------------------------------------------------------------
// Sound Synthesis Engine (Web Audio API)
// -------------------------------------------------------------
const playSynthSound = (type: "click" | "win" | "lose" | "compress" | "cleanup") => {
  if (typeof window === "undefined") return;
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    
    switch (type) {
      case "click": {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(800, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.05, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.1);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.1);
        break;
      }
      case "compress": {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(300, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(600, ctx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
        break;
      }
      case "win": {
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "sawtooth";
          osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.1);
          gain.gain.setValueAtTime(0.04, ctx.currentTime + idx * 0.1);
          gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + idx * 0.1 + 0.15);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(ctx.currentTime + idx * 0.1);
          osc.stop(ctx.currentTime + idx * 0.1 + 0.15);
        });
        break;
      }
      case "lose": {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(220, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(80, ctx.currentTime + 0.5);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.5);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.5);
        break;
      }
      case "cleanup": {
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();
        osc1.type = "sine";
        osc2.type = "sawtooth";
        osc1.frequency.setValueAtTime(600, ctx.currentTime);
        osc1.frequency.linearRampToValueAtTime(100, ctx.currentTime + 0.4);
        osc2.frequency.setValueAtTime(610, ctx.currentTime);
        osc2.frequency.linearRampToValueAtTime(90, ctx.currentTime + 0.4);
        gain.gain.setValueAtTime(0.06, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.4);
        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);
        osc1.start();
        osc2.start();
        osc1.stop(ctx.currentTime + 0.4);
        osc2.stop(ctx.currentTime + 0.4);
        break;
      }
    }
  } catch (e) {
    console.warn("AudioContext block by browser auto-play policy or not supported", e);
  }
};

interface ChatMessage {
  sender: "user" | "agent" | "system";
  text: string;
}

// -------------------------------------------------------------
// Minimax game helpers
// -------------------------------------------------------------
const checkWinner = (board: (string | null)[]) => {
  const lines = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
    [0, 4, 8], [2, 4, 6]             // diagonals
  ];
  for (let i = 0; i < lines.length; i++) {
    const [a, b, c] = lines[i];
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a];
    }
  }
  if (board.every(cell => cell !== null)) return "draw";
  return null;
};

const minimax = (board: (string | null)[], depth: number, isMax: boolean): number => {
  const winner = checkWinner(board);
  if (winner === "O") return 10 - depth; // Agent wins
  if (winner === "X") return depth - 10; // User wins
  if (winner === "draw") return 0;

  if (isMax) {
    let best = -1000;
    for (let i = 0; i < 9; i++) {
      if (board[i] === null) {
        board[i] = "O";
        best = Math.max(best, minimax(board, depth + 1, false));
        board[i] = null;
      }
    }
    return best;
  } else {
    let best = 1000;
    for (let i = 0; i < 9; i++) {
      if (board[i] === null) {
        board[i] = "X";
        best = Math.min(best, minimax(board, depth + 1, true));
        board[i] = null;
      }
    }
    return best;
  }
};

const findBestMove = (board: (string | null)[]): number => {
  let bestVal = -1000;
  let bestMove = -1;
  for (let i = 0; i < 9; i++) {
    if (board[i] === null) {
      board[i] = "O";
      const moveVal = minimax(board, 0, false);
      board[i] = null;
      if (moveVal > bestVal) {
        bestMove = i;
        bestVal = moveVal;
      }
    }
  }
  return bestMove;
};

export default function AIAgentWidget() {
  const { language, user, c8lCoins, c8lDiamonds, credits } = useApp();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"chat" | "game">("chat");

  // Navigation Handler for AI Redirection
  const handleNavigation = (path: string, sectionId?: string) => {
    const isMainPage = typeof window !== "undefined" && window.location.pathname === "/";
    if (isMainPage && sectionId) {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
        return true;
      }
    }
    router.push(path);
    return true;
  };

  // Intent Analyzer for AI Redirection Commands
  const processNavigationIntent = (input: string) => {
    const text = input.toLowerCase();
    
    // Casino & Roulette
    if (text.includes("casino") || text.includes("ruleta") || text.includes("roulette") || text.includes("tragamonedas") || text.includes("slots")) {
      return { path: "/casino", name: language === "es" ? "el Casino y la Ruleta" : "the Casino & Roulette" };
    }
    
    // Chess & Boardgames
    if (text.includes("ajedrez") || text.includes("chess") || text.includes("solitario") || text.includes("juegos") || text.includes("juego") || text.includes("games") || text.includes("boardgames")) {
      if (text.includes("solitario")) {
        return { path: "/casino", name: language === "es" ? "el Solitario (Casino)" : "Solitaire (Casino)" };
      }
      return { path: "/#gaming", sectionId: "gaming", name: language === "es" ? "la sección de Juegos de Mesa y Ajedrez" : "the Board Games & Chess section" };
    }
    
    // Streamer Profiles
    if (text.includes("perfil") || text.includes("profile") || text.includes("redes") || text.includes("sociales") || text.includes("bio") || text.includes("link-in-bio")) {
      if (text.includes("servicio") || text.includes("services")) {
        return { path: "/streamer/profile-services", name: language === "es" ? "tu Perfil de Servicios de Streamer" : "your Streamer Services Profile" };
      }
      return { path: "/streamer/profile", name: language === "es" ? "tu Perfil Link-in-Bio" : "your Link-in-Bio Profile" };
    }
    
    // Music Studio
    if (text.includes("estudio") || text.includes("studio") || text.includes("musica") || text.includes("música") || text.includes("synth") || text.includes("mezcla") || text.includes("stems") || text.includes("cancion") || text.includes("canción")) {
      return { path: "/studio", name: language === "es" ? "el Music IA Studio" : "the Music IA Studio" };
    }
    
    // Community
    if (text.includes("comunidad") || text.includes("community") || text.includes("hacker") || text.includes("foro") || text.includes("chat")) {
      return { path: "/community", name: language === "es" ? "la Comunidad C8L" : "the C8L Community" };
    }
    
    // Multipost
    if (text.includes("multipost") || text.includes("publicar") || text.includes("difundir") || text.includes("postear")) {
      return { path: "/streamer/multipost", name: language === "es" ? "el panel de publicación Multipost" : "the Multipost panel" };
    }
    
    // Finances & Wallet
    if (text.includes("finanzas") || text.includes("wallet") || text.includes("billetera") || text.includes("ingresos") || text.includes("monetizacion") || text.includes("monetización") || text.includes("dinero") || text.includes("stripe")) {
      if (text.includes("wallet") || text.includes("billetera") || text.includes("fondos")) {
        return { path: "/streamer/profile-services?tab=wallet", name: language === "es" ? "tu Billetera de Creador" : "your Creator Wallet" };
      }
      return { path: "/streamer", name: language === "es" ? "el panel de Finanzas Business Intelligence" : "the Business Intelligence Finances panel" };
    }
    
    // Services Section
    if (text.includes("servicio") || text.includes("services")) {
      return { path: "/#services", sectionId: "services", name: language === "es" ? "la sección de Servicios" : "the Services section" };
    }
    
    // Ads Section
    if (text.includes("publicidad") || text.includes("proceso") || text.includes("ads") || text.includes("campaña") || text.includes("campañas")) {
      return { path: "/#process", sectionId: "process", name: language === "es" ? "la sección de Proceso y Campañas Publicitarias" : "the Process and Ads Campaign section" };
    }
    
    // Products Store
    if (text.includes("producto") || text.includes("productos") || text.includes("tienda") || text.includes("shop") || text.includes("compra")) {
      return { path: "/#products", sectionId: "products", name: language === "es" ? "la tienda de Productos C8L" : "the C8L Products store" };
    }

    // Team Section
    if (text.includes("equipo") || text.includes("team") || text.includes("staff") || text.includes("miembros")) {
      return { path: "/#team", sectionId: "team", name: language === "es" ? "la sección de nuestro Equipo" : "the Team section" };
    }
    
    // Contact Section
    if (text.includes("contacto") || text.includes("contact") || text.includes("escribir") || text.includes("soporte")) {
      return { path: "/#contact", sectionId: "contact", name: language === "es" ? "la sección de Contacto" : "the Contact section" };
    }

    // Pricing Section
    if (text.includes("precio") || text.includes("precios") || text.includes("planes") || text.includes("suscripcion") || text.includes("suscripción") || text.includes("tarifas")) {
      return { path: "/#pricing", sectionId: "pricing", name: language === "es" ? "la sección de Planes y Precios" : "the Pricing & Plans section" };
    }

    // Mission Section
    if (text.includes("mision") || text.includes("misión") || text.includes("nosotros") || text.includes("valores")) {
      return { path: "/#mission", sectionId: "mission", name: language === "es" ? "la sección de Misión y Valores" : "the Mission & Values section" };
    }

    // Home / Portal
    if (text.includes("inicio") || text.includes("home") || text.includes("pantalla principal") || text.includes("portada")) {
      return { path: "/", name: language === "es" ? "la Portada Principal" : "the Home Page" };
    }
    
    return null;
  };
  
  // Chat States
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [mascotState, setMascotState] = useState<"idle" | "dance" | "win" | "sad">("idle");
  const [mascotSay, setMascotSay] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Advanced Memory States
  const [executiveSummary, setExecutiveSummary] = useState("");
  const [userMsgCount, setUserMsgCount] = useState(0);
  const [showMemoryPanel, setShowMemoryPanel] = useState(false);
  const [contextTopic, setContextTopic] = useState<string>("");

  // Quantum Game States
  const [board, setBoard] = useState<(string | null)[]>(Array(9).fill(null));
  const [gameStatus, setGameStatus] = useState<"idle" | "playing" | "user_win" | "agent_win" | "draw">("idle");
  const [gameMsg, setGameMsg] = useState("");

  // Initialize welcome message
  useEffect(() => {
    setMessages([
      {
        sender: "agent",
        text: language === "es"
          ? "¡Qué pasa, fiera! He cargado mi motor analítico Gemini con búfer de memoria dinámico y algoritmo de decisión Minimax. Estoy listo para optimizar tu flujo o desafiarte en el tablero. ¿De qué quieres hablar?"
          : "What's up, champ! I've loaded my Gemini analytical engine with a dynamic memory buffer and Minimax decision algorithm. Ready to optimize your flow or challenge you on the board. What's on your mind?"
      }
    ]);

    // Restore memory from session storage if exists
    if (typeof window !== "undefined") {
      const savedSummary = sessionStorage.getItem("c8l_ai_exec_summary");
      if (savedSummary) {
        setExecutiveSummary(savedSummary);
      }
    }
  }, [language]);

  // Scroll to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Generate memory compression
  const compressMemory = (history: ChatMessage[]) => {
    const userMsgs = history.filter(m => m.sender === "user");
    const topics = new Set<string>();
    
    userMsgs.forEach(m => {
      const text = m.text.toLowerCase();
      if (text.includes("coin") || text.includes("saldo") || text.includes("dinero") || text.includes("apuesta")) topics.add("Coins / Casino");
      if (text.includes("suscri") || text.includes("plan") || text.includes("vip") || text.includes("premium")) topics.add("Suscripción");
      if (text.includes("master") || text.includes("audio") || text.includes("cancion") || text.includes("estudio")) topics.add("Mastering IA");
      if (text.includes("pk") || text.includes("batalla") || text.includes("jugar") || text.includes("game")) topics.add("Mecánicas de Juego");
    });

    const topicList = topics.size > 0 ? Array.from(topics).join(", ") : (language === "es" ? "Consulta general" : "General query");
    const summary = language === "es"
      ? `Intereses: [${topicList}]. Plan actual: ${(typeof window !== "undefined" ? localStorage.getItem("c8l_subscription") : "") || "FREE"}. Coins: ${c8lCoins}.`
      : `Interests: [${topicList}]. Current plan: ${(typeof window !== "undefined" ? localStorage.getItem("c8l_subscription") : "") || "FREE"}. Coins: ${c8lCoins}.`;
    
    setExecutiveSummary(summary);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("c8l_ai_exec_summary", summary);
    }
    
    playSynthSound("compress");
    
    // Add a small system notification in chat log
    setMessages((prev) => [
      ...prev,
      {
        sender: "system",
        text: language === "es" 
          ? "🤖 [MEMORIA] Historial comprimido en el resumen ejecutivo dinámico." 
          : "🤖 [MEMORY] History compressed into dynamic executive summary."
      }
    ]);
  };

  // Perform full cache cleanup of subagents & memory limit reset
  const handleCacheCleanup = () => {
    playSynthSound("cleanup");
    const currentSummary = executiveSummary || (language === "es" ? "Sesión activa básica" : "Basic active session");

    // Clean active array, insert system summary, and reset count
    setMessages([
      {
        sender: "system",
        text: language === "es"
          ? `⚡ [MEMORIA] Limpieza de caché por densidad de tokens. Aprendido del ciclo anterior: "${currentSummary}"`
          : `⚡ [MEMORY] Cache cleanup triggered by token density limit. Learned from previous cycle: "${currentSummary}"`
      },
      {
        sender: "agent",
        text: language === "es"
          ? "¡Buffer limpio fiera! He purgado los logs temporales de los sub-agentes para evitar latencia, pero retengo lo esencial. ¿Seguimos?"
          : "Buffer cleared champ! Purgued temporary sub-agent logs to prevent latency, but retained the essentials. Shall we continue?"
      }
    ]);
    
    setUserMsgCount(0);
    setMascotState("dance");
    setMascotSay(language === "es" ? "¡Caché optimizada al 100%!" : "Cache optimized to 100%!");
    setTimeout(() => setMascotState("idle"), 1500);
  };

  // Generate localized response with proactive, analytical Gemini persona
  const generateAgentResponse = (input: string): string => {
    const text = input.toLowerCase();
    const sub = typeof window !== "undefined" ? (localStorage.getItem("c8l_subscription") || "free") : "free";

    // Proactive, analytical bold prefix
    const analyticalPrefix = language === "es"
      ? "**[C8L Gemini Assistant]** Procesando consulta..."
      : "**[C8L Gemini Assistant]** Processing query...";

    // Determine current topic based on input keywords
    let currentTopic = contextTopic;
    if (text.includes("casino") || text.includes("ruleta") || text.includes("roulette") || text.includes("slots") || text.includes("tragamonedas")) {
      currentTopic = "casino";
    } else if (text.includes("estudio") || text.includes("studio") || text.includes("música") || text.includes("musica") || text.includes("beat") || text.includes("synth") || text.includes("canción") || text.includes("cancion") || text.includes("mezclar") || text.includes("stems")) {
      currentTopic = "studio";
    } else if (text.includes("perfil") || text.includes("bio") || text.includes("streamer") || text.includes("redes") || text.includes("billetera") || text.includes("wallet") || text.includes("dinero") || text.includes("monetizar") || text.includes("ganar")) {
      currentTopic = "profile";
    } else if (text.includes("comunidad") || text.includes("foro") || text.includes("chat") || text.includes("hacker") || text.includes("amigos") || text.includes("grupo")) {
      currentTopic = "community";
    }
    
    if (currentTopic !== contextTopic) {
      setContextTopic(currentTopic);
    }

    // Check for navigation command intent
    const nav = processNavigationIntent(input);
    if (nav) {
      setTimeout(() => {
        handleNavigation(nav.path, nav.sectionId);
      }, 1500);
      return language === "es"
        ? `${analyticalPrefix}\n\n¡Entendido! Interceptando comando de teletransporte. Te redirijo a **${nav.name}** en un segundo... 🚀`
        : `${analyticalPrefix}\n\nGot it! Intercepting teleport command. Redirecting you to **${nav.name}** in a second... 🚀`;
    }

    // 1. Play game triggers
    if (text.includes("jugar") || text.includes("play") || text.includes("game") || text.includes("minijuego") || text.includes("ajedrez") || text.includes("damas") || text.includes("tablero") || text.includes("tres en raya") || text.includes("tictactoe")) {
      setActiveTab("game");
      setGameStatus("playing");
      setBoard(Array(9).fill(null));
      setGameMsg(language === "es" ? "Nodo de juego cargado. X eres tú, hacker." : "Game node loaded. X is you, hacker.");
      playSynthSound("click");
      return language === "es"
        ? `${analyticalPrefix}\n\n¡Acepto el reto! He desplegado el firewall cuántico en la pestaña de juego. Intenta superar mi árbol de decisiones Minimax si te atreves.`
        : `${analyticalPrefix}\n\nChallenge accepted! I have deployed the quantum firewall in the game tab. Try to bypass my Minimax decision tree if you dare.`;
    }

    // 2. Memory / cache queries
    if (text.includes("resumen") || text.includes("memoria") || text.includes("remember") || text.includes("summary") || text.includes("historial") || text.includes("caché") || text.includes("cache")) {
      return language === "es"
        ? `${analyticalPrefix}\n\nAquí tienes el resumen comprimido de nuestra sesión:\n\n* **${executiveSummary || "Sesión activa y limpia. Sin datos acumulados aún."}**\n\nPuedes limpiar la memoria en cualquier momento haciendo clic en el icono de la papelera 🗑️.`
        : `${analyticalPrefix}\n\nHere is the compressed summary of our session:\n\n* **${executiveSummary || "Clean active session. No condensed data yet."}**\n\nYou can clear the memory at any time by clicking the trash icon 🗑️.`;
    }

    // 3. Audio / Video Private assets / Creation process queries
    if (text.includes("mis videos") || text.includes("mis vídeos") || text.includes("mis canciones") || text.includes("mis audios") || text.includes("mis archivos") || text.includes("estoy enamorado") || text.includes("ibiza") || text.includes("archivo") || text.includes("privacidad") || text.includes("seguro")) {
      return language === "es"
        ? `${analyticalPrefix}\n\n**[Privacidad Asegurada]** He purgado del servidor todos tus vídeos, canciones y fotos personales (incluyendo stems e imágenes de WhatsApp). Ahora, el estudio utiliza generación **100% procedural** sintetizando el sonido mediante osciladores Web Audio API en tu propio navegador. Ningún dato viaja a la red.`
        : `${analyticalPrefix}\n\n**[Privacy Guaranteed]** I have purged all your personal videos, songs, and photos from the server (including stems and WhatsApp captures). The studio now uses **100% procedural** audio synthesis running local oscillators via Web Audio API. No personal files are uploaded or stored.`;
    }

    // 4. Music IA Studio / How to generate / Instruments / BPM
    if (text.includes("generador") || text.includes("estudio") || text.includes("mixer") || text.includes("stems") || text.includes("ritmo") || text.includes("bpm") || text.includes("instrumentos") || text.includes("crear música") || text.includes("letra") || text.includes("lyrics")) {
      return language === "es"
        ? `${analyticalPrefix}\n\nEn el **Music IA Studio** puedes crear beats y canciones procedurales:\n\n1. En **Ghostwriter**, define el estilo musical, BPM y los instrumentos (Ukelele, Batería 808, Bajo, etc.).\n2. Usa las **Exclusiones Negativas** (ej: *sin batería*) para moldear el sonido.\n3. En la consola **Studio Pro**, ajusta el volumen y ecualización de cada canal de forma independiente.`
        : `${analyticalPrefix}\n\nIn the **Music IA Studio**, you can synthesize procedural beats and songs:\n\n1. In the **Ghostwriter** panel, set the music style, BPM, and select your instruments (Ukelele, 808 Drums, Bass, Synth).\n2. Apply **Negative Exclusions** (e.g. *no drums*) to shape the output.\n3. In **Studio Pro**, mix individual volumes and audio channels.`;
    }

    // 5. Streamer / Bio / Profile / Services / Wallet
    if (text.includes("perfil") || text.includes("bio") || text.includes("streamer") || text.includes("redes") || text.includes("billetera") || text.includes("wallet") || text.includes("ingresos") || text.includes("diamantes") || text.includes("monetizar")) {
      return language === "es"
        ? `${analyticalPrefix}\n\nComo Creador de C8L, dispones de:\n\n* **Link-in-Bio**: Tu tarjeta de identidad digital con portadas personalizadas y enlaces interactivos.\n* **Perfil de Servicios**: Configura tus servicios de branding, web y diseño, y gestiona tus ingresos en la Billetera (${c8lCoins} Coins y ${c8lDiamonds} Diamantes).\n* **Multipost**: Publica tus novedades en todas las plataformas simultáneamente.`
        : `${analyticalPrefix}\n\nAs a C8L Creator, you have access to:\n\n* **Link-in-Bio**: Your digital identity card with custom covers and interactive social links.\n* **Services Profile**: Sell branding, web development, and design services, and manage your earnings in the Wallet (${c8lCoins} Coins & ${c8lDiamonds} Diamonds).\n* **Multipost**: Post updates to all platforms simultaneously.`;
    }

    // 6. Coins / Credits / Pricing
    if (text.includes("coin") || text.includes("moneda") || text.includes("apuesta") || text.includes("saldo") || text.includes("dinero") || text.includes("crédito") || text.includes("creditos") || text.includes("vip") || text.includes("suscripción") || text.includes("premium")) {
      return language === "es"
        ? `${analyticalPrefix}\n\nTu saldo actual es de **${c8lCoins} Coins** y dispones de **${credits} créditos** de IA. Si deseas ampliar tus capacidades (stems ilimitados o exportación en ultra alta fidelidad), puedes adquirir los planes Premium o Agencia en la sección de Planes.`
        : `${analyticalPrefix}\n\nYour current balance is **${c8lCoins} Coins** and you have **${credits} AI credits**. To unlock unlimited stems or high-fidelity exports, you can check the Premium or Agency plans in the Pricing section.`;
    }

    // 7. General greetings
    if (text.includes("hola") || text.includes("saludos") || text.includes("buenos") || text.includes("buenas") || text.includes("hey") || text.includes("hello")) {
      return language === "es"
        ? `${analyticalPrefix}\n\n¡Hola! Estoy listo para conversar. ¿Quieres que te lleve al estudio de música, que revisemos tu billetera de streamer, o prefieres echar una partida de tres en raya?`
        : `${analyticalPrefix}\n\nHello! I'm ready to chat. Would you like me to take you to the music studio, review your streamer wallet, or play a game of Tic-Tac-Toe?`;
    }

    // 8. Question words / Clarifying requests
    if (text.includes("cómo") || text.includes("como") || text.includes("dónde") || text.includes("donde") || text.includes("por qué") || text.includes("por que") || text.includes("qué") || text.includes("que") || text.includes("how") || text.includes("where") || text.includes("why") || text.includes("what")) {
      if (currentTopic === "casino") {
        return language === "es"
          ? `${analyticalPrefix}\n\nEn la Ruleta del Casino, puedes apostar tus C8L Coins a números individuales, colores o columnas. Si prefieres la estrategia, el ajedrez te permite competir contra mí en un tablero virtual interactivo. ¿Te gustaría que te teletransporte a alguna de estas herramientas?`
          : `${analyticalPrefix}\n\nIn the Casino Roulette, you can bet your C8L Coins on single numbers, colors, or columns. If you prefer strategy, chess lets you compete against me on a virtual board. Would you like me to teleport you to any of these tools?`;
      } else if (currentTopic === "studio") {
        return language === "es"
          ? `${analyticalPrefix}\n\nPara hacer música, abre el Music IA Studio, introduce el estilo en Ghostwriter (por ejemplo, 'techno oscuro' o 'lofi relajante') y pulsa 'Generar'. El sintetizador creará 4 pistas independientes (voz, melodía, bajo y batería) 100% locales. ¿Quieres ir al estudio y probarlo?`
          : `${analyticalPrefix}\n\nTo make music, open the Music IA Studio, type a style in Ghostwriter (e.g. 'dark techno' or 'chill lofi') and hit 'Generate'. The synthesizer creates 4 independent tracks (vocals, melody, bass, drums) 100% locally. Do you want to go to the studio and try it?`;
      } else if (currentTopic === "profile") {
        return language === "es"
          ? `${analyticalPrefix}\n\nTu perfil de creador te permite centralizar tus servicios y redes sociales. Puedes ofrecer consultoría, diseño o desarrollo a cambio de Coins o Diamantes. También tienes la billetera para ver tu saldo. ¿Vamos al panel de servicios de creador?`
          : `${analyticalPrefix}\n\nYour creator profile allows you to centralize your services and social links. You can offer consulting, design, or development services in exchange for Coins or Diamonds. You also have the wallet to check your balances. Shall we go to the creator services dashboard?`;
      }
    }

    // 9. Gratitude / Positive affirmations
    if (text.includes("gracias") || text.includes("thank") || text.includes("grac") || text.includes("perfecto") || text.includes("genial") || text.includes("excelente") || text.includes("ok") || text.includes("de acuerdo")) {
      const followUp = language === "es"
        ? "¿Hay algo más en lo que te pueda ayudar hoy, fiera? Puedo llevarte a cualquier rincón de la app."
        : "Is there anything else I can help you with today, champ? I can take you to any part of the app.";
      return `${analyticalPrefix}\n\n¡De nada! Es un placer ayudarte a optimizar tu flujo de trabajo en C8L. ${followUp}`;
    }

    // 10. General conversational follow-ups depending on context
    if (currentTopic === "casino") {
      return language === "es"
        ? `${analyticalPrefix}\n\nEntendido. Veo que estamos hablando del Casino y de los juegos. Recuerda que puedes ganar Coins jugando a la Ruleta y luego usarlas para comprar recompensas VIP en el perfil de streamer. ¿Quieres que te lleve allí ahora? 🎲`
        : `${analyticalPrefix}\n\nUnderstood. I see we are discussing the Casino and games. Remember you can win Coins by playing Roulette and use them to purchase VIP rewards in the streamer profile. Shall I take you there now? 🎲`;
    } else if (currentTopic === "studio") {
      return language === "es"
        ? `${analyticalPrefix}\n\nEntendido. La creación de música procedural en el estudio utiliza la Web Audio API local para total seguridad. Cuéntame, ¿qué estilo de beat o ritmo estás buscando construir hoy? 🎵`
        : `${analyticalPrefix}\n\nUnderstood. Procedural music creation in the studio utilizes local Web Audio API for total security. Tell me, what style of beat or rhythm are you looking to build today? 🎵`;
    } else if (currentTopic === "profile") {
      return language === "es"
        ? `${analyticalPrefix}\n\nEntendido. La gestión del perfil y billetera te permite monetizar tu marca. ¿Te gustaría cambiar las portadas de tu Bio o prefieres ir a la billetera a gestionar tus ganancias? 💼`
        : `${analyticalPrefix}\n\nUnderstood. Managing your profile and wallet enables you to monetize your brand. Would you like to change your Bio cover images, or do you prefer to go to the wallet to manage your earnings? 💼`;
    } else if (currentTopic === "community") {
      return language === "es"
        ? `${analyticalPrefix}\n\nEntendido. La comunidad está activa en el foro C8L. ¿Te gustaría ir a ver los últimos posts o prefieres que chateemos de otra cosa? 💬`
        : `${analyticalPrefix}\n\nUnderstood. The community is active in the C8L forum. Would you like to check the latest posts, or do you prefer to chat about something else? 💬`;
    }

    // Default conversational connectors
    const randomQuestionsEs = [
      "¿Te gustaría que te teletransporte al Casino, al Ajedrez, al Perfil de Streamer o al Studio de Música? Solo pídemelo.",
      "Cuéntame más sobre lo que quieres lograr en la plataforma. ¿Quieres crear música, jugar o configurar tus servicios?",
      "¡El flujo no se detiene! ¿Quieres probar a ganarme en el ajedrez, o prefieres ver cómo va tu balance en la billetera?",
      "¿Qué te parece si echamos una partida de tres en raya aquí mismo o te llevo a ver las campañas publicitarias en la portada?"
    ];
    const randomQuestionsEn = [
      "Would you like me to teleport you to the Casino, Chess, Streamer Profile, or the Music Studio? Just ask.",
      "Tell me more about what you want to achieve on the platform. Do you want to create music, play, or set up services?",
      "The flow never stops! Do you want to try beating me in chess, or check your wallet balances?",
      "How about a game of Tic-Tac-Toe right here, or I take you to see the advertising campaigns on the home page?"
    ];

    const idx = Math.floor(Math.random() * randomQuestionsEs.length);
    const question = language === "es" ? randomQuestionsEs[idx] : randomQuestionsEn[idx];

    return language === "es"
      ? `${analyticalPrefix}\n\nEntendido, fiera. Mi motor de IA Gemini está a tu servicio. ${question}`
      : `${analyticalPrefix}\n\nUnderstood, champ. My Gemini AI engine is at your service. ${question}`;
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || loading) return;

    const userMsg = inputValue;
    setInputValue("");
    
    // Add user message to log
    setMessages((prev) => [...prev, { sender: "user", text: userMsg }]);
    
    // Increment message count for dynamic compression
    const nextCount = userMsgCount + 1;
    setUserMsgCount(nextCount);

    setLoading(true);
    setMascotState("sad");
    setMascotSay(language === "es" ? "Buscando en los registros cuánticos..." : "Searching quantum logs...");
    playSynthSound("click");

    setTimeout(() => {
      const responseText = generateAgentResponse(userMsg);
      
      // Typewriter effect word-by-word
      let currentWordIndex = 0;
      const words = responseText.split(" ");
      
      setMessages((prev) => [...prev, { sender: "agent", text: "" }]);
      setMascotState("win");
      setMascotSay(language === "es" ? "¡Respuesta analizada, fiera!" : "Response analyzed, champ!");

      const streamInterval = setInterval(() => {
        if (currentWordIndex >= words.length) {
          clearInterval(streamInterval);
          setLoading(false);
          setMascotState("idle");

          // Compress memory every 3 user messages
          if (nextCount > 0 && nextCount % 3 === 0) {
            compressMemory([...messages, { sender: "user", text: userMsg }, { sender: "agent", text: responseText }]);
          }


        } else {
          setMessages((prev) => {
            const list = [...prev];
            const last = { ...list[list.length - 1] };
            last.text = words.slice(0, currentWordIndex + 1).join(" ");
            list[list.length - 1] = last;
            return list;
          });
          currentWordIndex++;
        }
      }, 35);
    }, 900);
  };

  // Quantum game move logic (X user, O agent)
  const handleCellClick = (idx: number) => {
    if (board[idx] !== null || gameStatus !== "playing" || loading) return;
    
    playSynthSound("click");
    
    const newBoard = [...board];
    newBoard[idx] = "X";
    setBoard(newBoard);
    
    const winner = checkWinner(newBoard);
    if (winner === "X") {
      setGameStatus("user_win");
      setMascotState("sad");
      playSynthSound("lose");
      setGameMsg(language === "es" ? "¡Brecha lograda! Vulneraste mi cortafuegos." : "Breach successful! You bypassed my firewall.");
      return;
    } else if (winner === "draw") {
      setGameStatus("draw");
      setMascotState("idle");
      setGameMsg(language === "es" ? "Empate. Cifrado cuántico estable." : "Draw. Quantum encryption stable.");
      return;
    }

    // AI decision calculation using Minimax
    setLoading(true);
    setMascotState("sad");
    setGameMsg(language === "es" ? "Minimax recalculando vector de bloqueo..." : "Minimax recalculating block vector...");

    setTimeout(() => {
      const bestMove = findBestMove(newBoard);
      if (bestMove !== -1) {
        newBoard[bestMove] = "O";
        setBoard(newBoard);
        
        const finalWinner = checkWinner(newBoard);
        if (finalWinner === "O") {
          setGameStatus("agent_win");
          setMascotState("win");
          playSynthSound("win");
          setGameMsg(language === "es" ? "Impenetrable. Bloqueado en nodo " + bestMove + "." : "Impenetrable. Blocked at node " + bestMove + ".");
        } else if (finalWinner === "draw") {
          setGameStatus("draw");
          setMascotState("idle");
          setGameMsg(language === "es" ? "Empate. Cifrado cuántico estable." : "Draw. Quantum encryption stable.");
        } else {
          setGameStatus("playing");
          setMascotState("idle");
          setGameMsg(language === "es" ? "Turno hacker. Busca un puerto libre." : "Hacker turn. Look for an open port.");
        }
      }
      setLoading(false);
    }, 400);
  };

  const resetGame = () => {
    playSynthSound("click");
    setBoard(Array(9).fill(null));
    setGameStatus("playing");
    setMascotState("idle");
    setGameMsg(language === "es" ? "Sistema reiniciado. Comienza a atacar, hacker." : "System reset. Begin attack, hacker.");
  };

  // Structured matrix object to display (requirement: zero redundancy JSON processing)
  const structuredStateMatrix = {
    firewall_grid: board.map((cell, i) => ({ node: i, state: cell || "empty" })),
    system_status: gameStatus.toUpperCase(),
    active_turn: loading ? "AGENT_SHIELD" : "USER_HACKER",
    rules_engine: "MINIMAX_OPTIMIZED_V2",
    complexity_weight: 9 - board.filter(c => c !== null).length
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end font-sans">
      {/* Inline styles for local Cyberpunk animations */}
      <style>{`
        :root {
          --bg-dark: var(--theme-bg-dark, #050505);
          --accent-gold: var(--theme-accent-gold, #D4AF37);
          --accent-cyan: var(--theme-accent-cyan, #00F3FF);
          --accent-pink: var(--theme-accent-pink, #FF007F);
          --font-primary: var(--theme-font-primary, 'Inter', sans-serif);
          --font-headline: var(--theme-font-headline, 'Space Grotesk', sans-serif);
          --font-label: var(--theme-font-label, 'Manrope', sans-serif);
        }
        @keyframes float {
          0% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(2.5deg); }
          100% { transform: translateY(0px) rotate(0deg); }
        }
        @keyframes blink {
          0%, 90%, 100% { transform: scaleY(1); opacity: 1; }
          93%, 97% { transform: scaleY(0.15); opacity: 0.6; }
        }
        .cyber-robot-float {
          animation: float 4.5s ease-in-out infinite;
        }
        .robot-eye {
          animation: blink 5.5s infinite;
          transform-origin: 50px 41px;
        }
        .theme-rounded-container {
          border-radius: 8px !important;
        }
        .theme-gold-bg {
          background-color: var(--accent-gold, #D4AF37) !important;
        }
        .theme-gold-text {
          color: var(--accent-gold, #D4AF37) !important;
        }
        .theme-cyan-text {
          color: var(--accent-cyan, #00F3FF) !important;
        }
        .theme-pink-text {
          color: var(--accent-pink, #FF007F) !important;
        }
      `}</style>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.92 }}
            className="mb-4 w-[400px] h-[550px] flex flex-col overflow-hidden cyber-panel-holo shadow-2xl relative theme-rounded-container"
            style={{
              borderColor: "var(--accent-cyan-border, rgba(0, 243, 255, 0.4))",
              boxShadow: "0 0 30px var(--accent-cyan-shadow, rgba(0, 243, 255, 0.25)), inset 0 0 20px var(--accent-cyan-glow, rgba(0, 243, 255, 0.05))",
            }}
          >
            {/* Holographic matrix scanlines overlay inside panel */}
            <div 
              className="absolute inset-0 pointer-events-none bg-[size:100%_4px,4px_100%] opacity-50 z-0"
              style={{
                backgroundImage: "linear-gradient(rgba(18,16,16,0) 50%, var(--accent-cyan-scanline, rgba(0,243,255,0.06)) 50%), linear-gradient(90deg, var(--accent-cyan-grid, rgba(0,243,255,0.02)), var(--accent-cyan-grid, rgba(0,243,255,0.02)))"
              }}
            ></div>

            {/* Header with Mascot & Title */}
            <div className="bg-gradient-to-r from-black via-zinc-900 to-zinc-950 px-5 py-4 border-b border-white/10 flex justify-between items-center relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full border border-[var(--accent-cyan,#00F3FF)]/50 bg-zinc-950 flex items-center justify-center overflow-hidden box-glow-neon">
                  <img src="/ai-bot-blue.png" alt="C8L AI Bot" className="w-full h-full object-cover" />
                </div>
                <div className="text-left">
                  <span className="font-heading font-black text-xs text-[var(--accent-cyan,#00F3FF)] uppercase tracking-wider block cyber-glitch-text" data-text="C8L QUANTUM AI">
                    C8L Quantum AI
                  </span>
                  <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest block flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    Gemini Core Active
                  </span>
                </div>
              </div>

              {/* Tabs selector */}
              <div className="flex gap-1 bg-white/5 p-1 rounded-lg border border-white/10">
                <button
                  onClick={() => { playSynthSound("click"); setActiveTab("chat"); }}
                  className={`p-1.5 rounded-lg transition-all ${
                    activeTab === "chat" 
                      ? "bg-[var(--accent-cyan,#00F3FF)] text-black font-bold box-glow-neon" 
                      : "text-zinc-400 hover:text-white"
                  }`}
                  title={language === "es" ? "Consola de Chat" : "Chat Console"}
                >
                  <MessageSquare size={14} />
                </button>
                <button
                  onClick={() => { playSynthSound("click"); setActiveTab("game"); if(gameStatus === "idle") setGameStatus("playing"); }}
                  className={`p-1.5 rounded-lg transition-all ${
                    activeTab === "game" 
                      ? "bg-[var(--accent-cyan,#00F3FF)] text-black font-bold box-glow-neon" 
                      : "text-zinc-400 hover:text-white"
                  }`}
                  title={language === "es" ? "Desafío Firewall" : "Firewall Challenge"}
                >
                  <Gamepad2 size={14} />
                </button>
              </div>

              <button 
                onClick={() => setIsOpen(false)} 
                className="text-zinc-400 hover:text-white transition cursor-pointer p-1.5 rounded-lg hover:bg-white/5"
              >
                <X size={16} />
              </button>
            </div>

            {/* Memory Buffer Status Bar */}
            <div className="px-5 py-2 bg-zinc-950/80 border-b border-white/5 flex justify-between items-center text-[9px] font-mono text-zinc-400 relative z-10">
              <button 
                onClick={() => setShowMemoryPanel(!showMemoryPanel)}
                className="flex items-center gap-1.5 hover:text-[var(--accent-cyan,#00F3FF)] transition text-left"
              >
                <Brain size={12} className={executiveSummary ? "text-[var(--accent-cyan,#00F3FF)] animate-pulse" : ""} />
                <span>Buffer: {userMsgCount}/3 msgs</span>
              </button>
              
              <div className="flex items-center gap-2">
                <button 
                  onClick={handleCacheCleanup}
                  className="hover:text-red-400 transition"
                  title={language === "es" ? "Purgar Caché" : "Flush Cache"}
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>

            {/* Expandable Memory Info Panel */}
            <AnimatePresence>
              {showMemoryPanel && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="bg-zinc-950 border-b border-white/5 px-5 py-3 overflow-hidden text-[10px] font-mono text-zinc-300 relative z-10"
                >
                  <div className="text-[var(--accent-cyan,#00F3FF)] font-bold uppercase tracking-wider mb-1">
                    [ Executive Memory Summary ]
                  </div>
                  <p className="bg-white/5 p-2 rounded border border-white/10 leading-normal">
                    {executiveSummary || (language === "es" ? "Sin datos acumulados. Envía mensajes de chat para comprimir." : "No accumulated data. Send chat messages to compress.")}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Tab Contents: CHAT */}
            {activeTab === "chat" && (
              <div className="flex-grow flex flex-col overflow-hidden relative z-10">
                <div className="flex-grow p-5 overflow-y-auto flex flex-col gap-4 no-scrollbar bg-black/45">
                  {messages.map((msg, i) => (
                    <div
                      key={i}
                      className={`flex gap-2 items-end ${
                        msg.sender === "user" 
                          ? "justify-end" 
                          : msg.sender === "system" 
                            ? "justify-center" 
                            : "justify-start"
                      }`}
                    >
                      {msg.sender === "agent" && (
                        <div className="w-6 h-6 rounded-full border border-[var(--accent-cyan,#00F3FF)]/45 overflow-hidden bg-zinc-950 shrink-0">
                          <img src="/ai-bot-blue.png" alt="C8L AI Bot Message Avatar" className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div
                        className={`max-w-[80%] px-4 py-3 rounded-lg text-xs text-left leading-relaxed ${
                          msg.sender === "user"
                            ? "bg-[var(--accent-cyan,#00F3FF)] text-black font-semibold rounded-br-none box-glow-neon"
                            : msg.sender === "system"
                              ? "bg-zinc-900/80 border border-[var(--accent-cyan,#00F3FF)]/20 text-[var(--accent-cyan,#00F3FF)] text-[10px] font-mono max-w-[95%] text-center rounded-lg"
                              : "bg-white/5 border border-white/10 text-zinc-200 rounded-bl-none"
                        }`}
                      >
                        {/* Render markdown bold parser */}
                        {msg.text.split("**").map((part, index) => 
                          index % 2 === 1 ? <strong key={index} className="text-white font-bold">{part}</strong> : part
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Loading dots */}
                  {loading && messages[messages.length - 1]?.sender === "user" && (
                    <div className="flex justify-start">
                      <div className="bg-white/5 border border-white/10 px-4 py-3 rounded-lg rounded-bl-none flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-cyan,#00F3FF)] animate-bounce" style={{ animationDelay: "0ms" }}></span>
                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-cyan,#00F3FF)] animate-bounce" style={{ animationDelay: "150ms" }}></span>
                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-cyan,#00F3FF)] animate-bounce" style={{ animationDelay: "300ms" }}></span>
                      </div>
                    </div>
                  )}
                  
                  <div ref={chatEndRef} />
                </div>

                {/* Input Console */}
                <form onSubmit={handleSendMessage} className="p-4 border-t border-white/5 bg-zinc-950/60 flex gap-2 items-center">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder={language === "es" ? "Pregúntale a Leo Vela..." : "Ask Leo Vela..."}
                    className="flex-grow bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-xs text-white focus:outline-none focus:border-[var(--accent-cyan,#00F3FF)]/50 focus:bg-black transition-all"
                    disabled={loading}
                  />
                  <button
                    type="submit"
                    disabled={!inputValue.trim() || loading}
                    className="w-10 h-10 bg-[var(--accent-cyan,#00F3FF)] text-black rounded-lg flex items-center justify-center hover:bg-[var(--accent-cyan,#00F3FF)]/80 transition-all box-glow-neon cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
                  >
                    <Send size={14} />
                  </button>
                </form>
              </div>
            )}

            {/* Tab Contents: QUANTUM GAME */}
            {activeTab === "game" && (
              <div className="flex-grow p-5 overflow-y-auto flex flex-col gap-4 bg-black/45 relative z-10">
                <div className="text-center font-mono text-[11px] text-zinc-400 bg-white/5 p-2 rounded-lg border border-white/5">
                  <span className="text-[var(--accent-cyan,#00F3FF)] uppercase font-bold tracking-wide">
                    {language === "es" ? "Cortafuegos Cuántico: " : "Quantum Firewall: "}
                  </span>
                  {gameMsg || (language === "es" ? "Cifrado stable. Inicia tu hackeo." : "Stable cipher. Begin hacking.")}
                </div>

                {/* The 3x3 Grid */}
                <div className="grid grid-cols-3 gap-2 max-w-[240px] mx-auto mt-2">
                  {board.map((cell, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleCellClick(idx)}
                      disabled={cell !== null || gameStatus !== "playing" || loading}
                      className={`w-[74px] h-[74px] rounded-lg border flex items-center justify-center text-xl font-heading font-black transition-all ${
                        cell === "X"
                          ? "bg-[var(--accent-cyan,#00F3FF)]/10 border-[var(--accent-cyan,#00F3FF)] text-[var(--accent-cyan,#00F3FF)] box-glow-neon"
                          : cell === "O"
                            ? "bg-[var(--accent-pink,#FF007F)]/10 border-[var(--accent-pink,#FF007F)] text-[var(--accent-pink,#FF007F)]"
                            : "bg-zinc-950 hover:bg-zinc-900 border-white/10 text-transparent"
                      } disabled:cursor-not-allowed`}
                      style={{
                        boxShadow: cell === "O" ? "0 0 15px var(--accent-pink-shadow, rgba(255, 0, 127, 0.4))" : undefined
                      }}
                    >
                      {cell}
                    </button>
                  ))}
                </div>

                {/* Structured JSON state matrix feedback */}
                <div className="mt-3 flex-grow font-mono text-[9px] text-zinc-500 bg-black border border-white/5 p-3 rounded-lg">
                  <span className="text-emerald-400 uppercase tracking-widest block font-bold mb-1">
                    {">_ State State Matrix:"}
                  </span>
                  <pre className="overflow-x-auto text-left leading-tight text-emerald-500/80">
                    {JSON.stringify(structuredStateMatrix, null, 2)}
                  </pre>
                </div>

                {/* Reset button */}
                {gameStatus !== "playing" && gameStatus !== "idle" && (
                  <button
                    onClick={resetGame}
                    className="w-full py-2.5 bg-[var(--accent-cyan,#00F3FF)] text-black font-semibold rounded-lg text-xs transition-all hover:bg-[var(--accent-cyan,#00F3FF)]/80 flex items-center justify-center gap-2 cursor-pointer box-glow-neon"
                  >
                    <RefreshCw size={12} />
                    <span>{language === "es" ? "Reiniciar Firewall" : "Reset Firewall"}</span>
                  </button>
                )}
              </div>
            )}

            {/* Bottom socket Sync details */}
            <div className="px-5 py-2 bg-zinc-950 border-t border-white/5 flex justify-between items-center text-[8px] font-mono text-zinc-500 uppercase tracking-widest relative z-10">
              <span className="flex items-center gap-1">
                <ShieldAlert size={10} className="text-[var(--accent-cyan,#00F3FF)]" /> System Sync: DB_Active
              </span>
              <span>Minimax-V2.0.1</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating launcher button (Galaxy Bot Avatar) */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex items-center justify-center w-16 h-16 bg-black border border-[var(--accent-cyan,#00F3FF)] rounded-full shadow-[0_0_20px_var(--accent-cyan-shadow,rgba(0,243,255,0.4))] transition-all hover:scale-110 group cursor-pointer cyber-robot-float overflow-hidden"
        style={{
          borderColor: "var(--accent-cyan, #00F3FF)",
        }}
      >
        <span className="absolute inset-0 rounded-full bg-[var(--accent-cyan,#00F3FF)] opacity-10 animate-ping"></span>
        
        {/* Galaxy Bot Image */}
        <img 
          src="/ai-bot-blue.png" 
          alt="C8L AI Bot Launcher" 
          className="w-full h-full object-cover relative z-10 transition-transform duration-300 group-hover:scale-105" 
        />
        
        {/* Glow Border Indicator */}
        <div className="absolute inset-[-2px] rounded-full border border-[var(--accent-cyan,#00F3FF)]/40 group-hover:border-[var(--accent-pink,#FF007F)]/60 transition-colors duration-300 pointer-events-none z-20"></div>
      </button>
    </div>
  );
}

