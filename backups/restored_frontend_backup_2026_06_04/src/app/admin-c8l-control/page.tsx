"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ShieldCheck, Lock, Users, DollarSign, Database, Search, 
  ArrowLeft, Download, Plus, Trash2, Ban, ShieldAlert,
  Terminal as TerminalIcon, BarChart2, CheckCircle, RefreshCw, X, Play,
  ToggleLeft, ToggleRight
} from "lucide-react";
import { useApp } from "../../context/AppContext";

// Interfaces
interface UserRecord {
  uid: string;
  avatar: string;
  registeredAt: string;
  handle: string;
  email: string;
  country: string;
  device: string;
  songsGenerated: number;
  tokens: number;
  banned: boolean;
  logs: string[];
}

interface TransactionRecord {
  txid: string;
  timestamp: string;
  uid: string;
  plan: string;
  amount: number;
  gateway: string;
  renewal: string;
}

interface TelemetryRecord {
  uid: string;
  styles: string[];
  avgTime: string;
  failRate: string;
  section: string;
  remixRatio: string;
}

// Initial Mock Datasets
const INITIAL_USERS: UserRecord[] = [
  {
    uid: "c8l-u-001",
    avatar: "https://api.dicebear.com/7.x/pixel-art/svg?seed=hacker",
    registeredAt: "2026-05-01 10:15:32",
    handle: "@netrunner_09",
    email: "netrunner_09@c8l.app",
    country: "España",
    device: "Android Mobile",
    songsGenerated: 45,
    tokens: 240,
    banned: false,
    logs: ["Conexión desde IP 84.120.12.3", "Generación Salsa Cuántica (Exclusiones: sin piano)", "Transacción Stripe exitosa: Pro Plan"]
  },
  {
    uid: "c8l-u-002",
    avatar: "https://api.dicebear.com/7.x/pixel-art/svg?seed=leo",
    registeredAt: "2026-05-02 08:30:11",
    handle: "@leo_vela39",
    email: "leo_vela39@c8l-agency.com",
    country: "Andorra",
    device: "Web Desktop",
    songsGenerated: 312,
    tokens: 9999,
    banned: false,
    logs: ["Inició sesión como C8L_OWNER", "Acuñación de tokens completada: +5000", "Cambio de rol de usuario c8l-u-005 a BASIC"]
  },
  {
    uid: "c8l-u-003",
    avatar: "https://api.dicebear.com/7.x/pixel-art/svg?seed=sacha",
    registeredAt: "2026-05-12 14:32:00",
    handle: "@sacha_l",
    email: "sacha@c8l-agency.com",
    country: "España",
    device: "Android Tablet",
    songsGenerated: 8,
    tokens: 50,
    banned: false,
    logs: ["Creado perfil de servicios", "Bounty reclamado: +120 Coins"]
  },
  {
    uid: "c8l-u-004",
    avatar: "https://api.dicebear.com/7.x/pixel-art/svg?seed=shiva",
    registeredAt: "2026-05-20 18:04:15",
    handle: "@shiva_noise",
    email: "shiva@domain.com",
    country: "México",
    device: "Android Mobile",
    songsGenerated: 120,
    tokens: 15,
    banned: false,
    logs: ["Error de API en generación de rock", "Consumo excesivo de créditos"]
  },
  {
    uid: "c8l-u-005",
    avatar: "https://api.dicebear.com/7.x/pixel-art/svg?seed=ghost",
    registeredAt: "2026-05-22 09:12:44",
    handle: "@ghost_writer",
    email: "ghost@secureshell.io",
    country: "EE.UU.",
    device: "Web Desktop",
    songsGenerated: 0,
    tokens: 0,
    banned: true,
    logs: ["IP bloqueada por fuerza bruta en /admin", "Intento de descifrado no autorizado"]
  },
  {
    uid: "c8l-u-006",
    avatar: "https://api.dicebear.com/7.x/pixel-art/svg?seed=chill",
    registeredAt: "2026-05-24 23:45:01",
    handle: "@chill_beats",
    email: "chill@lofi.net",
    country: "Japón",
    device: "Web Desktop",
    songsGenerated: 15,
    tokens: 120,
    banned: false,
    logs: ["Reproducción Soundboard: Lofi Loop", "Canje VIP completado"]
  },
  {
    uid: "c8l-u-007",
    avatar: "https://api.dicebear.com/7.x/pixel-art/svg?seed=flamenco",
    registeredAt: "2026-05-28 11:20:00",
    handle: "@flamenco_c8l",
    email: "flamenco@c8l.app",
    country: "España",
    device: "Android Tablet",
    songsGenerated: 62,
    tokens: 380,
    banned: false,
    logs: ["Estudio Pro: Ecualización baja activada", "Generación de Flamenco Cuántico"]
  }
];

const INITIAL_TRANSACTIONS: TransactionRecord[] = [
  {
    txid: "TX-9281-ST",
    timestamp: "2026-05-30 19:40:12",
    uid: "c8l-u-001",
    plan: "Pro Plan",
    amount: 19.99,
    gateway: "Stripe Success",
    renewal: "2026-06-30"
  },
  {
    txid: "TX-9102-PP",
    timestamp: "2026-05-28 11:20:00",
    uid: "c8l-u-003",
    plan: "Token Pack",
    amount: 9.99,
    gateway: "PayPal Success",
    renewal: "N/A"
  },
  {
    txid: "TX-8839-ST",
    timestamp: "2026-05-26 15:45:33",
    uid: "c8l-u-004",
    plan: "Premier Plan",
    amount: 39.99,
    gateway: "Stripe Success",
    renewal: "2026-06-26"
  },
  {
    txid: "TX-8721-ST",
    timestamp: "2026-05-25 21:05:44",
    uid: "c8l-u-006",
    plan: "Pro Plan",
    amount: 19.99,
    gateway: "Stripe Success",
    renewal: "2026-06-25"
  },
  {
    txid: "TX-8500-PP",
    timestamp: "2026-05-24 10:12:05",
    uid: "c8l-u-007",
    plan: "Pro Plan",
    amount: 19.99,
    gateway: "PayPal Success",
    renewal: "2026-06-24"
  }
];

const INITIAL_TELEMETRY: TelemetryRecord[] = [
  {
    uid: "c8l-u-001",
    styles: ["Salsa", "Reggaeton"],
    avgTime: "14.2s",
    failRate: "2.1%",
    section: "Workspace",
    remixRatio: "30% Remix / 70% New"
  },
  {
    uid: "c8l-u-002",
    styles: ["Synthwave", "Cyberpunk"],
    avgTime: "8.5s",
    failRate: "0.0%",
    section: "Library",
    remixRatio: "60% Remix / 40% New"
  },
  {
    uid: "c8l-u-003",
    styles: ["Lofi", "Jazz"],
    avgTime: "22.1s",
    failRate: "5.0%",
    section: "Explore",
    remixRatio: "10% Remix / 90% New"
  },
  {
    uid: "c8l-u-004",
    styles: ["Rock", "Metal"],
    avgTime: "18.3s",
    failRate: "8.4%",
    section: "Workspace",
    remixRatio: "45% Remix / 55% New"
  },
  {
    uid: "c8l-u-006",
    styles: ["Lofi", "Chill"],
    avgTime: "12.0s",
    failRate: "1.5%",
    section: "Explore",
    remixRatio: "0% Remix / 100% New"
  },
  {
    uid: "c8l-u-007",
    styles: ["Flamenco", "Bolero"],
    avgTime: "16.8s",
    failRate: "3.2%",
    section: "Workspace",
    remixRatio: "15% Remix / 85% New"
  }
];

const INITIAL_LOGS = [
  "[INFO] 2026-05-31 08:00:01 - AI Generation Success - 200 OK - 12.4s",
  "[DEBUG] 2026-05-31 08:00:15 - WebSocket connection request from user c8l-u-001",
  "[INFO] 2026-05-31 08:00:16 - Handshake completed - Client authenticated successfully",
  "[WARN] 2026-05-31 08:00:45 - Token depletion event on User ID: c8l-u-004",
  "[INFO] 2026-05-31 08:01:05 - Sync replica C8L_DB complete - 0ms replication drift",
  "[INFO] 2026-05-31 08:01:23 - Stripe webhook: payment_intent.succeeded (TX-9281-ST)",
  "[INFO] 2026-05-31 08:02:11 - User @netrunner_09 transitioned to Explore feed",
  "[WARN] 2026-05-31 08:02:50 - Delayed API response on speech synthesis microservice - 5.8s latency"
];

export default function AdminControlCenter() {
  const router = useRouter();
  const { showNotification } = useApp();

  // Authentication states
  const [authorized, setAuthorized] = useState<boolean>(false);
  const [ownerKey, setOwnerKey] = useState<string>("");
  const [authError, setAuthError] = useState<string>("");

  // Data states
  const [users, setUsers] = useState<UserRecord[]>(INITIAL_USERS);
  const [transactions, setTransactions] = useState<TransactionRecord[]>(INITIAL_TRANSACTIONS);
  const [telemetry, setTelemetry] = useState<TelemetryRecord[]>(INITIAL_TELEMETRY);
  const [terminalLogs, setTerminalLogs] = useState<string[]>(INITIAL_LOGS);

  // UI state
  const [activeTab, setActiveTab] = useState<"users" | "commerce" | "telemetry" | "subagents">("users");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Subagents states
  const [subagents, setSubagents] = useState([
    { id: "sa_1", name: "Monitoreo de Errores IA", type: "error", enabled: true, permissions: ["read_logs", "execute_reboot"], scope: "Todo el proyecto" },
    { id: "sa_2", name: "Optimizador de Memoria y Caché", type: "memory", enabled: true, permissions: ["flush_cache", "audio_gc"], scope: "Carpeta studio/ lounge/" },
    { id: "sa_3", name: "Moderador de Contenido C8L TV", type: "moderation", enabled: true, permissions: ["read_comments", "delete_comments"], scope: "Videos y Comentarios" },
    { id: "sa_4", name: "Agente de Auditoría Financiera", type: "finance", enabled: false, permissions: ["read_wallet", "write_ledger"], scope: "Casino y Stripe" },
  ]);

  // Edge Functions state
  const [edgeFunctions, setEdgeFunctions] = useState([
    { id: 'health-monitor', name: 'Health Monitor', emoji: '🩺', description: 'Verifica estado del backend y conexión a DB. Retorna latencia y conteo de usuarios.', loading: false, lastStatus: 'idle' as 'idle' | 'success' | 'error', lastResult: '' },
    { id: 'moderator-ai', name: 'Moderador IA', emoji: '🛡️', description: 'Analiza comentarios con Perspective API o heurísticas. Censura toxicidad automáticamente.', loading: false, lastStatus: 'idle' as 'idle' | 'success' | 'error', lastResult: '' },
    { id: 'economy-stabilizer', name: 'Economy Stabilizer', emoji: '⚖️', description: 'Ajusta recompensas de misiones basándose en ratio coins/stars de los últimos 7 días.', loading: false, lastStatus: 'idle' as 'idle' | 'success' | 'error', lastResult: '' },
    { id: 'dynamic-missions', name: 'Dynamic Missions', emoji: '🎯', description: 'Genera misiones automáticas según engagement bajo en comentarios, regalos o videos.', loading: false, lastStatus: 'idle' as 'idle' | 'success' | 'error', lastResult: '' },
    { id: 'competitor-scraper', name: 'Competitor Scraper', emoji: '🔍', description: 'Rastrea novedades de Suno AI, StarMaker y YouTube Music desde NewsAPI.', loading: false, lastStatus: 'idle' as 'idle' | 'success' | 'error', lastResult: '' },
    { id: 'news-trend-predictor', name: 'News Trend Predictor', emoji: '📈', description: 'Analiza sentimiento del mercado musical y ajusta precios y multiplicadores de eventos.', loading: false, lastStatus: 'idle' as 'idle' | 'success' | 'error', lastResult: '' },
  ]);
  const [edgeFnLogs, setEdgeFnLogs] = useState<string[]>([]);

  const handleFireEdgeFunction = async (fnId: string) => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl) {
      showNotification('NEXT_PUBLIC_SUPABASE_URL no está configurado.', 'error');
      return;
    }
    setEdgeFunctions(prev => prev.map(fn => fn.id === fnId ? { ...fn, loading: true } : fn));
    const startTs = new Date().toISOString().replace('T', ' ').substring(0, 19);
    try {
      const endpoint = `${supabaseUrl}/functions/v1/${fnId}`;
      const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${anonKey}`,
        },
        body: JSON.stringify({ trigger: 'manual', source: 'admin_panel' }),
      });
      const data = await res.json();
      const resultStr = JSON.stringify(data, null, 2);
      const status = res.ok ? 'success' : 'error';
      setEdgeFunctions(prev => prev.map(fn =>
        fn.id === fnId ? { ...fn, loading: false, lastStatus: status, lastResult: resultStr } : fn
      ));
      const logEntry = `[${startTs}] ${fnId} → ${res.ok ? 'SUCCESS' : 'ERROR'} (${res.status}) — ${res.ok ? (data.status || data.success || 'OK') : (data.error || 'Fallo')}`;
      setEdgeFnLogs(prev => [logEntry, ...prev].slice(0, 20));
      showNotification(res.ok ? `✓ ${fnId} ejecutado con éxito` : `✗ Error en ${fnId}`, res.ok ? 'success' : 'error');
    } catch (err: any) {
      setEdgeFunctions(prev => prev.map(fn =>
        fn.id === fnId ? { ...fn, loading: false, lastStatus: 'error', lastResult: err.message } : fn
      ));
      setEdgeFnLogs(prev => [`[${startTs}] ${fnId} → ERROR — ${err.message}`, ...prev].slice(0, 20));
      showNotification(`Error de red al llamar ${fnId}`, 'error');
    }
  };

  const [subagentLogs, setSubagentLogs] = useState<string[]>([
    "[sa_1] 2026-06-03 00:10:05 - Iniciando subagente de monitoreo de errores... Activo.",
    "[sa_2] 2026-06-03 00:10:15 - Limpieza preventiva del heap de Web Audio API: 144MB liberados.",
    "[sa_3] 2026-06-03 00:10:30 - Analizados 12 comentarios nuevos en watch/... Todos limpios.",
  ]);

  const handleToggleSubagent = (id: string) => {
    setSubagents(prev => prev.map(sa => {
      if (sa.id === id) {
        showNotification(
          sa.enabled ? `Desactivado subagente: ${sa.name}` : `Activado subagente: ${sa.name}`,
          sa.enabled ? "info" : "success"
        );
        return { ...sa, enabled: !sa.enabled };
      }
      return sa;
    }));
  };

  const handleRevokePermissions = (id: string) => {
    setSubagents(prev => prev.map(sa => {
      if (sa.id === id) {
        showNotification(`Permisos revocados para: ${sa.name}`, "error");
        return { ...sa, enabled: false, permissions: [] };
      }
      return sa;
    }));
  };
  
  // Advanced filters state
  const [countryFilter, setCountryFilter] = useState<string>("all");
  const [spendingFilter, setSpendingFilter] = useState<boolean>(false);
  const [inactiveFilter, setInactiveFilter] = useState<boolean>(false);

  // Modal / Detail states
  const [selectedUserLogs, setSelectedUserLogs] = useState<string[] | null>(null);
  const [selectedUserHandle, setSelectedUserHandle] = useState<string>("");
  const [editTokensUserId, setEditTokensUserId] = useState<string | null>(null);
  const [newTokensAmount, setNewTokensAmount] = useState<number>(0);

  const logsEndRef = useRef<HTMLDivElement>(null);

  // Authenticate owner credentials
  const handleOwnerLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (ownerKey === "C8L_OWNER_VIP_2026") {
      setAuthorized(true);
      setAuthError("");
      if (typeof window !== "undefined") {
        sessionStorage.setItem("c8l_owner_role", "C8L_OWNER");
      }
      showNotification("Control Center C.8.L. Autenticado y Cifrado", "success");
    } else {
      setAuthError("Clave de Propietario denegada. Intento registrado en logs de seguridad.");
      setOwnerKey("");
      showNotification("Fallo de autenticación Admin", "error");
    }
  };

  // Check role and session on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const isOwner = sessionStorage.getItem("c8l_owner_role") === "C8L_OWNER";
      if (isOwner) {
        setAuthorized(true);
      }
    }
  }, []);

  const handleLogout = () => {
    setAuthorized(false);
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("c8l_owner_role");
    }
    showNotification("Sesión administrativa finalizada", "info");
  };

  // Telemetry and Subagents log simulator
  useEffect(() => {
    if (!authorized) return;
    const interval = setInterval(() => {
      const logTypes = ["INFO", "WARN", "DEBUG"];
      const type = logTypes[Math.floor(Math.random() * logTypes.length)];
      const now = new Date().toISOString().replace("T", " ").substring(0, 19);
      
      let msg = "";
      if (type === "INFO") {
        const endpoints = ["AI Generation Success", "User authenticated", "Stripe payment sync"];
        const randEndpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
        msg = `[INFO] ${now} - ${randEndpoint} - 200 OK - ${(Math.random() * 12 + 1).toFixed(1)}s`;
      } else if (type === "WARN") {
        const warnings = [
          "Token depletion warning on User ID: c8l-u-004",
          "External Google TTS API delay - 4.1s",
          "CORS preflight request resolved after 800ms retry"
        ];
        msg = `[WARN] ${now} - ${warnings[Math.floor(Math.random() * warnings.length)]}`;
      } else {
        msg = `[DEBUG] ${now} - Sync heartbeat complete - memory heap limit safe at 144MB / 512MB`;
      }

      setTerminalLogs(prev => [...prev.slice(-30), msg]); // Keep last 30 logs

      // Simulate subagents logs
      const activeSa = subagents.filter(sa => sa.enabled);
      if (activeSa.length > 0) {
        const randSa = activeSa[Math.floor(Math.random() * activeSa.length)];
        let action = "";
        if (randSa.id === "sa_1") {
          action = "Escaneando estado de la compilación local... 0 errores detectados.";
        } else if (randSa.id === "sa_2") {
          action = "Recolector de basura de audio Web ejecutado. Caché optimizada al 100%.";
        } else if (randSa.id === "sa_3") {
          action = "Analizando texto en feed/ comentarios... Todos los comentarios limpios. Filtro IA activo.";
        } else if (randSa.id === "sa_4") {
          action = "Auditando transacciones de casino (tragamonedas) del ciclo actual... Sin anomalías.";
        }
        setSubagentLogs(prev => [...prev.slice(-15), `[${randSa.name}] ${now} - ${action}`]);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [authorized, subagents]);

  // Scroll logs terminal to bottom
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [terminalLogs]);

  // Financial calculations
  const totalRevenue = transactions.reduce((acc, t) => acc + t.amount, 0);
  const arrMock = totalRevenue * 12; 
  const conversionRate = "68.4%";
  const churnRate = "2.1%";

  // Tab Filtering & Query searches
  const filteredUsers = users.filter(user => {
    const searchMatch = 
      user.handle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.uid.toLowerCase().includes(searchQuery.toLowerCase());
    
    const countryMatch = countryFilter === "all" || user.country === countryFilter;
    const spendingMatch = !spendingFilter || user.tokens > 300;
    const inactiveMatch = !inactiveFilter || user.songsGenerated === 0;

    return searchMatch && countryMatch && spendingMatch && inactiveMatch;
  });

  const filteredTransactions = transactions.filter(t => {
    const searchMatch = 
      t.txid.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.uid.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.plan.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Find user record for advanced filters
    const user = users.find(u => u.uid === t.uid);
    const countryMatch = countryFilter === "all" || (user && user.country === countryFilter);
    const spendingMatch = !spendingFilter || t.amount >= 19.99;
    
    return searchMatch && countryMatch && spendingMatch;
  });

  const filteredTelemetry = telemetry.filter(tel => {
    const searchMatch = 
      tel.uid.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tel.section.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tel.styles.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));

    const user = users.find(u => u.uid === tel.uid);
    const countryMatch = countryFilter === "all" || (user && user.country === countryFilter);
    const spendingMatch = !spendingFilter || (user && user.tokens > 300);

    return searchMatch && countryMatch && spendingMatch;
  });

  // Unique countries list for filter dropdown
  const countries = Array.from(new Set(users.map(u => u.country)));

  // Actions
  const handleBanToggle = (uid: string) => {
    setUsers(prev => prev.map(u => {
      if (u.uid === uid) {
        const nextBanned = !u.banned;
        showNotification(
          nextBanned ? `Usuario ${u.handle} baneado de C8L` : `Usuario ${u.handle} restaurado`,
          nextBanned ? "error" : "success"
        );
        return { ...u, banned: nextBanned };
      }
      return u;
    }));
  };

  const handleUpdateTokens = () => {
    if (!editTokensUserId) return;
    setUsers(prev => prev.map(u => {
      if (u.uid === editTokensUserId) {
        showNotification(`Tokens de ${u.handle} modificados a: ${newTokensAmount}`, "success");
        return { ...u, tokens: newTokensAmount };
      }
      return u;
    }));
    setEditTokensUserId(null);
  };

  // CSV Exporter
  const handleExportCSV = () => {
    let dataToExport: any[] = [];
    let filename = "";

    if (activeTab === "users") {
      dataToExport = filteredUsers.map(u => ({
        UID: u.uid,
        Handle: u.handle,
        Email: u.email,
        RegistrationDate: u.registeredAt,
        Country: u.country,
        Device: u.device,
        SongsGenerated: u.songsGenerated,
        Tokens: u.tokens,
        Banned: u.banned ? "YES" : "NO"
      }));
      filename = "C8L_User_Registry.csv";
    } else if (activeTab === "commerce") {
      dataToExport = filteredTransactions.map(t => ({
        TransactionID: t.txid,
        Timestamp: t.timestamp,
        UserID: t.uid,
        Plan: t.plan,
        AmountUSD: t.amount,
        GatewayStatus: t.gateway,
        RenewalDate: t.renewal
      }));
      filename = "C8L_Commerce_Registry.csv";
    } else {
      dataToExport = filteredTelemetry.map(t => ({
        UserID: t.uid,
        MostUsedStyles: t.styles.join(" | "),
        AvgTimeWritingLyrics: t.avgTime,
        FailureRate: t.failRate,
        ActiveSection: t.section,
        RemixRatio: t.remixRatio
      }));
      filename = "C8L_Telemetry_Registry.csv";
    }

    if (dataToExport.length === 0) {
      showNotification("No hay datos disponibles para exportar con los filtros actuales.", "error");
      return;
    }

    const headers = Object.keys(dataToExport[0]);
    const csvContent = [
      headers.join(","),
      ...dataToExport.map(row => 
        headers.map(header => `"${String(row[header]).replace(/"/g, '""')}"`).join(",")
      )
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotification(`Archivo ${filename} exportado con éxito`, "success");
  };

  if (!authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#07070a] p-6 relative overflow-hidden font-sans">
        {/* Futuristic Background grid & scanlines */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,62,62,0.06),transparent_60%)] pointer-events-none" />
        <div className="absolute inset-0 bg-[size:100%_4px] opacity-15 pointer-events-none" style={{ backgroundImage: "linear-gradient(rgba(18,16,16,0) 50%, rgba(255,62,62,0.15) 50%)" }} />
        
        <motion.div 
          initial={{ opacity: 0, y: 25, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="w-full max-w-md bg-[#121216]/95 border border-red-650/30 rounded-3xl p-8 shadow-2xl relative z-10 text-center backdrop-blur-md"
        >
          <div className="w-16 h-16 rounded-full bg-red-950/20 border border-red-600 flex items-center justify-center mx-auto mb-6 shadow-[0_0_20px_rgba(239,68,68,0.25)]">
            <Lock className="text-red-500 animate-pulse" size={24} />
          </div>
          
          <h2 className="font-heading font-black text-2xl uppercase text-white mb-2 tracking-widest">
            C.8.L. Control Center
          </h2>
          <p className="text-zinc-500 text-xs mb-8 uppercase font-bold tracking-wider">
            Consola Restringida a Propietarios C8L
          </p>

          <form onSubmit={handleOwnerLogin} className="space-y-5">
            <div className="text-left flex flex-col gap-1.5">
              <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest pl-1">Identificador de Inferencia</label>
              <input 
                type="password"
                required
                value={ownerKey}
                onChange={(e) => setOwnerKey(e.target.value)}
                placeholder="C8L_OWNER_VIP_••••"
                className="w-full bg-[#0d0d10] border border-zinc-800 rounded-xl px-4 py-3 text-center text-white focus:outline-none focus:border-red-500 transition text-sm tracking-widest font-mono box-glow-cyber"
              />
            </div>
            {authError && (
              <p className="text-red-500 text-xs font-semibold animate-pulse">{authError}</p>
            )}
            <button 
              type="submit"
              className="w-full bg-red-600 text-white font-heading font-black text-xs py-3.5 rounded-xl uppercase tracking-widest hover:bg-red-500 transition shadow-[0_0_15px_rgba(239,68,68,0.35)] cursor-pointer"
            >
              Autenticar Shield Gate
            </button>
          </form>

          <Link 
            href="/"
            className="flex items-center justify-center gap-2 text-zinc-500 hover:text-white transition text-[10px] mt-8 uppercase font-mono tracking-wider font-bold"
          >
            <ArrowLeft size={12} />
            <span>Volver a C.8.L. Music</span>
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white font-sans pt-28 pb-20 relative bg-[#0a0a0c]">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,62,62,0.03),transparent_70%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[size:100%_4px] opacity-5 pointer-events-none" style={{ backgroundImage: "linear-gradient(rgba(18,16,16,0) 50%, rgba(255,62,62,0.1) 50%)" }} />

      <div className="container mx-auto px-6 max-w-7xl relative z-10">
        
        {/* Encrypted Session header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10 border-b border-zinc-800/40 pb-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-red-500 bg-red-500/10 border border-red-500/20 px-3.5 py-1.5 rounded-xl">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping"></span>
              <span className="font-bold uppercase tracking-widest text-[9px]">SESIÓN CIFRADA (C8L_OWNER)</span>
            </div>
            <h1 className="font-heading font-black text-2xl md:text-3xl uppercase tracking-wider mt-2 text-white">
              C.8.L. Control Center
            </h1>
          </div>

          <div className="flex gap-3 font-mono text-xs w-full md:w-auto">
            <button 
              onClick={handleLogout}
              className="flex-grow md:flex-grow-0 px-4 py-2.5 bg-red-950/40 hover:bg-red-950/60 border border-red-500/30 text-red-400 font-bold uppercase rounded-xl transition cursor-pointer"
            >
              Cerrar Consola
            </button>
            <Link 
              href="/studio"
              className="flex-grow md:flex-grow-0 px-4 py-2.5 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 font-bold uppercase rounded-xl text-center transition"
            >
              Regresar al Estudio
            </Link>
          </div>
        </header>

        {/* Dynamic Financial/Analytics Summary (TAB B metrics shown always at the top for Owner) */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
          {[
            { label: "Métrica Total ARR / MRR", value: `$${arrMock.toFixed(2)} / $${totalRevenue.toFixed(2)}`, desc: "Estimado comercial de plataforma", icon: <DollarSign size={18} />, color: "border-red-500/20 text-red-500" },
            { label: "Usuarios Activos", value: `${users.filter(u => !u.banned).length} / ${users.length}`, desc: "Baneados excluidos", icon: <Users size={18} />, color: "border-cyan-500/20 text-cyan-400" },
            { label: "Conversión de Pago (CR)", value: conversionRate, desc: "Suscripción Premium / Basic", icon: <BarChart2 size={18} />, color: "border-emerald-500/20 text-emerald-400" },
            { label: "Tasa de Cancelación (Churn)", value: churnRate, desc: "Pérdida mensual de streamers", icon: <ShieldAlert size={18} />, color: "border-purple-500/20 text-purple-400" }
          ].map((card, i) => (
            <div key={i} className="bg-[#121216] border border-zinc-800/60 p-6 rounded-2xl flex flex-col justify-between shadow-lg">
              <div className="flex justify-between items-start mb-4">
                <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">{card.label}</span>
                <span className={card.color}>{card.icon}</span>
              </div>
              <div>
                <h3 className="font-heading font-black text-xl md:text-2xl text-white font-mono">
                  {card.value}
                </h3>
                <span className="text-[9px] text-zinc-600 block mt-1">{card.desc}</span>
              </div>
            </div>
          ))}
        </section>

        {/* Tab selection & Search bar / filters */}
        <section className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4 mb-6">
          <div className="flex bg-[#0d0d10] border border-zinc-800/80 p-1 rounded-xl font-heading text-xs tracking-wider max-w-fit">
            <button
              onClick={() => { setActiveTab("users"); setSearchQuery(""); }}
              className={`px-4 py-2.5 rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === "users" ? "bg-red-600 text-white font-bold" : "text-zinc-500 hover:text-white"
              }`}
            >
              <Users size={14} />
              <span>Registro Usuarios</span>
            </button>
            <button
              onClick={() => { setActiveTab("commerce"); setSearchQuery(""); }}
              className={`px-4 py-2.5 rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === "commerce" ? "bg-red-600 text-white font-bold" : "text-zinc-500 hover:text-white"
              }`}
            >
              <DollarSign size={14} />
              <span>Finanzas</span>
            </button>
            <button
              onClick={() => { setActiveTab("telemetry"); setSearchQuery(""); }}
              className={`px-4 py-2.5 rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === "telemetry" ? "bg-red-600 text-white font-bold" : "text-zinc-500 hover:text-white"
              }`}
            >
              <Database size={14} />
              <span>Intelectualización (Telemetría)</span>
            </button>
            <button
              onClick={() => { setActiveTab("subagents"); setSearchQuery(""); }}
              className={`px-4 py-2.5 rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === "subagents" ? "bg-red-600 text-white font-bold" : "text-zinc-500 hover:text-white"
              }`}
            >
              <ShieldCheck size={14} />
              <span>Agentes Autónomos</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-3 flex-grow lg:justify-end">
            {/* Country Selector Dropdown */}
            <select
              value={countryFilter}
              onChange={(e) => setCountryFilter(e.target.value)}
              className="bg-[#0d0d10] border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-400 focus:outline-none focus:border-red-500"
            >
              <option value="all">Filtrar por País</option>
              {countries.map((c, idx) => (
                <option key={idx} value={c}>{c}</option>
              ))}
            </select>

            {/* High Spending toggle button */}
            <button
              onClick={() => setSpendingFilter(!spendingFilter)}
              className={`px-3 py-2 border rounded-xl text-xs font-bold font-mono transition ${
                spendingFilter 
                  ? "bg-red-950/40 text-red-500 border-red-500/50" 
                  : "bg-transparent text-zinc-400 border-zinc-800 hover:border-zinc-700"
              }`}
            >
              Gastadores VIP
            </button>

            {/* Inactive users toggle button */}
            <button
              onClick={() => setInactiveFilter(!inactiveFilter)}
              className={`px-3 py-2 border rounded-xl text-xs font-bold font-mono transition ${
                inactiveFilter 
                  ? "bg-red-950/40 text-red-500 border-red-500/50" 
                  : "bg-transparent text-zinc-400 border-zinc-800 hover:border-zinc-700"
              }`}
            >
              Inactivos (7 días)
            </button>

            {/* Global Search Bar */}
            <div className="relative min-w-[200px] flex-grow md:flex-grow-0">
              <Search className="absolute left-3.5 top-3 text-zinc-600" size={14} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Búsqueda global..."
                className="w-full bg-[#0d0d10] border border-zinc-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-red-500 font-mono"
              />
            </div>

            {/* CSV EXPORTER */}
            <button
              onClick={handleExportCSV}
              className="px-3.5 py-2.5 bg-zinc-800 border border-zinc-700 hover:bg-zinc-750 text-white font-mono text-xs uppercase tracking-wider font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer"
            >
              <Download size={14} />
              <span>Exportar CSV</span>
            </button>
          </div>
        </section>

        {/* Interactive Data Table Component */}
        <section className="bg-[#121216] border border-zinc-800/40 rounded-3xl overflow-hidden shadow-2xl p-4 mb-8">
          <div className="overflow-x-auto">
            
            {/* Tab A: User Registry Table */}
            {activeTab === "users" && (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-zinc-800 text-zinc-500 uppercase tracking-widest text-[9px]">
                    <th className="p-4">UUID</th>
                    <th className="p-4">Streamer/Handle</th>
                    <th className="p-4">Email</th>
                    <th className="p-4">Registro</th>
                    <th className="p-4">País (IP)</th>
                    <th className="p-4">Dispositivo</th>
                    <th className="p-4 text-center">Canciones</th>
                    <th className="p-4 text-center">Tokens C8L</th>
                    <th className="p-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50 font-medium">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="text-center py-12 text-zinc-500 font-mono">No users matched search criteria.</td>
                    </tr>
                  ) : (
                    filteredUsers.map((user, idx) => (
                      <tr key={user.uid} className={`hover:bg-zinc-900/30 transition-colors ${user.banned ? "bg-red-950/10 opacity-70" : ""}`}>
                        <td className="p-4 font-mono text-zinc-500">{user.uid}</td>
                        <td className="p-4 font-bold text-white flex items-center gap-2">
                          <img src={user.avatar} className="w-6 h-6 rounded bg-zinc-800" alt="avatar" />
                          <span className={user.banned ? "line-through text-zinc-500" : ""}>{user.handle}</span>
                          {user.banned && <span className="text-[8px] bg-red-650/20 text-red-500 border border-red-500/20 px-1 rounded">BANNED</span>}
                        </td>
                        <td className="p-4 font-mono text-zinc-400">{user.email}</td>
                        <td className="p-4 font-mono text-zinc-500">{user.registeredAt}</td>
                        <td className="p-4">{user.country}</td>
                        <td className="p-4 text-zinc-300 font-mono">{user.device}</td>
                        <td className="p-4 text-center font-bold text-white">{user.songsGenerated}</td>
                        <td className="p-4 text-center font-mono font-bold text-red-500">{user.tokens}</td>
                        <td className="p-4 text-right flex justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setEditTokensUserId(user.uid);
                              setNewTokensAmount(user.tokens);
                            }}
                            className="px-2 py-1 bg-zinc-850 hover:bg-zinc-800 border border-zinc-700/60 rounded text-[10px] font-bold text-zinc-300 cursor-pointer"
                          >
                            Tokens
                          </button>
                          <button
                            onClick={() => {
                              setSelectedUserLogs(user.logs);
                              setSelectedUserHandle(user.handle);
                            }}
                            className="px-2 py-1 bg-zinc-850 hover:bg-zinc-800 border border-zinc-700/60 rounded text-[10px] font-bold text-zinc-300 cursor-pointer"
                          >
                            Logs
                          </button>
                          <button
                            onClick={() => handleBanToggle(user.uid)}
                            className={`px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-wider cursor-pointer border transition ${
                              user.banned 
                                ? "bg-emerald-950/40 text-emerald-400 border-emerald-500/30 hover:bg-emerald-950/60" 
                                : "bg-red-950/40 text-red-500 border-red-500/30 hover:bg-red-950/60"
                            }`}
                          >
                            {user.banned ? "Restaurar" : "Banear"}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}

            {/* Tab B: Transactions Table */}
            {activeTab === "commerce" && (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-zinc-800 text-zinc-500 uppercase tracking-widest text-[9px]">
                    <th className="p-4">ID Transacción</th>
                    <th className="p-4">Timestamp</th>
                    <th className="p-4">User ID (UUID)</th>
                    <th className="p-4">Plan Comprado</th>
                    <th className="p-4 text-right">Precio ($)</th>
                    <th className="p-4">Pasarela de Pago</th>
                    <th className="p-4">Próxima Renovación</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50 font-medium font-mono">
                  {filteredTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-zinc-500 font-sans">No transactions recorded under this search query.</td>
                    </tr>
                  ) : (
                    filteredTransactions.map((tx) => (
                      <tr key={tx.txid} className="hover:bg-zinc-900/30 transition-colors">
                        <td className="p-4 font-bold text-white">{tx.txid}</td>
                        <td className="p-4 text-zinc-400">{tx.timestamp}</td>
                        <td className="p-4 text-zinc-500">{tx.uid}</td>
                        <td className="p-4 font-sans font-bold text-zinc-200">{tx.plan}</td>
                        <td className="p-4 text-right text-emerald-400 font-bold">${tx.amount.toFixed(2)}</td>
                        <td className="p-4"><span className="px-2 py-0.5 rounded bg-zinc-950 border border-white/5 text-[10px] text-zinc-400 font-semibold">{tx.gateway}</span></td>
                        <td className="p-4 text-zinc-400">{tx.renewal}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}

            {/* Tab C: Telemetry Table */}
            {activeTab === "telemetry" && (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-zinc-800 text-zinc-500 uppercase tracking-widest text-[9px]">
                    <th className="p-4">User ID (UUID)</th>
                    <th className="p-4">Géneros de Música Usados</th>
                    <th className="p-4 text-center">T. Medio Redacción Letras</th>
                    <th className="p-4 text-center">API Fallos de Inferencia</th>
                    <th className="p-4">Sección Activa</th>
                    <th className="p-4 text-right">Ratio Remix vs Nuevo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50 font-medium">
                  {filteredTelemetry.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-zinc-500 font-mono">No user telemetry matched search criteria.</td>
                    </tr>
                  ) : (
                    filteredTelemetry.map((tel) => (
                      <tr key={tel.uid} className="hover:bg-zinc-900/30 transition-colors font-mono">
                        <td className="p-4 text-zinc-500">{tel.uid}</td>
                        <td className="p-4 font-sans whitespace-nowrap">
                          {tel.styles.map((style, i) => (
                            <span key={i} className="mr-1.5 px-2 py-0.5 rounded bg-red-950/20 text-red-400 border border-red-500/10 text-[9px] font-bold uppercase">{style}</span>
                          ))}
                        </td>
                        <td className="p-4 text-center text-zinc-300">{tel.avgTime}</td>
                        <td className={`p-4 text-center font-bold ${parseFloat(tel.failRate) > 5 ? "text-red-500 animate-pulse" : "text-zinc-400"}`}>{tel.failRate}</td>
                        <td className="p-4 font-sans text-zinc-200">{tel.section}</td>
                        <td className="p-4 text-right text-zinc-400">{tel.remixRatio}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}

            {/* Tab D: Subagents Panel */}
            {activeTab === "subagents" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-left">
                  
                  {/* Toggles Panel */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-black text-[#D4AF37] uppercase tracking-wider mb-3 font-mono">PANEL DE CONTROL DE SUBAGENTES</h3>
                    <div className="space-y-3">
                      {subagents.map(sa => (
                        <div key={sa.id} className="bg-black/65 p-4 border border-zinc-800 rounded-2xl flex justify-between items-center transition-all hover:border-zinc-700">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white text-sm">{sa.name}</span>
                              {sa.enabled ? (
                                <span className="text-[8px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 px-1 rounded font-bold font-mono">ACTIVO</span>
                              ) : (
                                <span className="text-[8px] bg-red-500/20 text-red-500 border border-red-500/20 px-1 rounded font-bold font-mono">DESACTIVADO</span>
                              )}
                            </div>
                            <div className="text-[10px] text-zinc-400 mt-1 font-mono">Ámbito: <span className="text-zinc-200">{sa.scope}</span></div>
                            <div className="flex gap-1.5 flex-wrap mt-2">
                              {sa.permissions.length === 0 ? (
                                <span className="text-[8px] bg-red-950/20 border border-red-500/10 text-red-400 px-2 py-0.5 rounded font-mono font-bold uppercase">Sin Permisos</span>
                              ) : (
                                sa.permissions.map(perm => (
                                  <span key={perm} className="text-[8px] bg-zinc-800 border border-zinc-700 text-zinc-350 px-2 py-0.5 rounded font-mono uppercase">{perm}</span>
                                ))
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3 shrink-0">
                            {/* Toggle Button */}
                            <button
                              onClick={() => handleToggleSubagent(sa.id)}
                              className="text-zinc-450 hover:text-white cursor-pointer"
                              title={sa.enabled ? "Apagar Agente" : "Encender Agente"}
                            >
                              {sa.enabled ? (
                                <ToggleRight size={28} className="text-emerald-500" />
                              ) : (
                                <ToggleLeft size={28} className="text-zinc-600" />
                              )}
                            </button>
                            
                            {/* Revoke Permissions Button */}
                            {sa.permissions.length > 0 && (
                              <button
                                onClick={() => handleRevokePermissions(sa.id)}
                                className="px-2.5 py-1.5 bg-red-950/40 hover:bg-red-950/60 border border-red-500/30 text-red-400 text-[10px] font-black rounded-lg cursor-pointer transition-all uppercase font-mono"
                              >
                                Revocar
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Logs Registry Panel */}
                  <div className="flex flex-col h-[380px] bg-black/60 border border-zinc-850 p-4 rounded-2xl">
                    <h3 className="text-sm font-black text-[#D4AF37] uppercase tracking-wider mb-3 font-mono">REGISTRO DE ACTIVIDAD EN SEGUNDO PLANO</h3>
                    <div className="flex-1 bg-[#050508] border border-zinc-900 rounded-xl p-3 overflow-y-auto font-mono text-[9px] text-zinc-400 space-y-2 select-text">
                      {subagentLogs.map((log, idx) => (
                        <div key={idx} className="border-b border-zinc-900 pb-1.5 last:border-b-0 last:pb-0 leading-normal">
                          <span className="text-cyan-400 font-bold">SUBAGENT:</span> {log}
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

                {/* ── Edge Functions Dispatch Panel ── */}
                <div className="mt-6 border-t border-zinc-800/60 pt-6">
                  <h3 className="text-sm font-black text-[#00F3FF] uppercase tracking-wider mb-4 font-mono flex items-center gap-2">
                    <Play size={14} className="text-[#00F3FF]" />
                    SUPABASE EDGE FUNCTIONS — DESPACHO MANUAL
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {edgeFunctions.map(fn => (
                      <div key={fn.id} className="bg-[#080810] border border-zinc-800 rounded-2xl p-4 flex flex-col gap-3 hover:border-zinc-600 transition-all">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-lg">{fn.emoji}</span>
                              <span className="font-bold text-white text-xs">{fn.name}</span>
                            </div>
                            <p className="text-[9px] text-zinc-500 leading-relaxed">{fn.description}</p>
                          </div>
                          <span className={`text-[8px] px-1.5 py-0.5 rounded font-bold font-mono border uppercase shrink-0 ml-2 ${
                            fn.lastStatus === 'success' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                            fn.lastStatus === 'error' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                            'bg-zinc-800 text-zinc-500 border-zinc-700'
                          }`}>
                            {fn.lastStatus === 'success' ? '✓ OK' : fn.lastStatus === 'error' ? '✗ ERR' : '— IDLE'}
                          </span>
                        </div>
                        {fn.lastResult && (
                          <div className="bg-black/60 border border-zinc-900 rounded-lg p-2 font-mono text-[8px] text-zinc-400 max-h-20 overflow-y-auto">
                            {fn.lastResult}
                          </div>
                        )}
                        <button
                          onClick={() => handleFireEdgeFunction(fn.id)}
                          disabled={fn.loading}
                          className="w-full py-2 bg-[#00F3FF]/10 hover:bg-[#00F3FF]/20 border border-[#00F3FF]/30 text-[#00F3FF] text-[10px] font-black rounded-xl uppercase tracking-wider font-mono transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          {fn.loading ? (
                            <>
                              <RefreshCw size={10} className="animate-spin" />
                              Ejecutando...
                            </>
                          ) : (
                            <>
                              <Play size={10} />
                              Disparar Función
                            </>
                          )}
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Execution Log */}
                  {edgeFnLogs.length > 0 && (
                    <div className="mt-4 bg-[#050508] border border-zinc-900 rounded-xl p-4 max-h-48 overflow-y-auto">
                      <div className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider mb-2 font-bold">Historial de Ejecuciones</div>
                      {edgeFnLogs.map((log, i) => (
                        <div key={i} className={`text-[9px] font-mono py-1 border-b border-zinc-900 last:border-0 ${
                          log.includes('ERROR') ? 'text-red-400' : 'text-emerald-400'
                        }`}>
                          {log}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>
        </section>

        {/* Real-time Server Log Console (Virtual Terminal) */}
        <section className="bg-black border border-zinc-800/80 rounded-3xl p-6 shadow-2xl relative">
          <div className="flex justify-between items-center border-b border-zinc-800/80 pb-4 mb-4">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-red-500">
              <TerminalIcon size={16} />
              <span>TERMINAL DE TELEMETRÍA SERVIDOR - LOGS EN TIEMPO REAL</span>
            </div>
            
            <div className="flex items-center gap-4 text-[9px] font-mono text-zinc-500 uppercase">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500"></span>SYS: RUNNING</span>
              <span>DB CONNECTED</span>
            </div>
          </div>

          {/* Scrolling shell log text */}
          <div className="bg-[#050508] border border-zinc-900 rounded-2xl p-4 h-48 overflow-y-auto font-mono text-[10px] text-zinc-400 flex flex-col gap-1.5 pr-2 select-text">
            {terminalLogs.map((log, idx) => {
              let color = "text-zinc-400";
              if (log.includes("[WARN]")) color = "text-amber-500";
              if (log.includes("[INFO]")) color = "text-zinc-300";
              if (log.includes("[DEBUG]")) color = "text-zinc-500";
              
              return (
                <div key={idx} className={`${color} whitespace-pre-wrap leading-relaxed`}>
                  {log}
                </div>
              );
            })}
            <div ref={logsEndRef} />
          </div>
        </section>

      </div>

      {/* MODAL A: Activity Logs Viewer */}
      {selectedUserLogs && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-6 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-lg bg-[#121216] border border-zinc-800 rounded-3xl p-6 shadow-2xl relative"
          >
            <button 
              onClick={() => setSelectedUserLogs(null)}
              className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-900 transition cursor-pointer"
            >
              <X size={16} />
            </button>
            <h3 className="font-heading font-black text-sm uppercase text-white mb-4 tracking-wider flex items-center gap-1.5">
              <ShieldAlert className="text-red-500" size={16} />
              <span>Logs de Actividad: {selectedUserHandle}</span>
            </h3>
            
            <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-4 max-h-[300px] overflow-y-auto font-mono text-[10px] text-zinc-400 flex flex-col gap-2.5">
              {selectedUserLogs.map((log, i) => (
                <div key={i} className="border-b border-zinc-900 pb-2 last:border-b-0 last:pb-0">
                  <span className="text-red-500 font-bold">C8L_INTEL:</span> {log}
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      )}

      {/* MODAL B: Edit Token Balance */}
      {editTokensUserId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-6 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-sm bg-[#121216] border border-zinc-800 rounded-3xl p-6 shadow-2xl relative"
          >
            <button 
              onClick={() => setEditTokensUserId(null)}
              className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-900 transition cursor-pointer"
            >
              <X size={16} />
            </button>
            
            <h3 className="font-heading font-black text-sm uppercase text-white mb-4 tracking-wider">
              Modificar Balance de Tokens C8L
            </h3>
            
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1 text-left">
                <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest pl-1">Cantidad de Tokens</label>
                <input 
                  type="number" 
                  value={newTokensAmount} 
                  onChange={(e) => setNewTokensAmount(parseInt(e.target.value, 10) || 0)}
                  className="p-3 bg-[#0d0d10] border border-zinc-800 rounded-xl text-white font-mono text-center text-lg outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                />
              </div>

              <div className="flex gap-3 mt-2">
                <button
                  onClick={() => setEditTokensUserId(null)}
                  className="flex-grow py-2.5 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 rounded-xl text-xs uppercase font-mono font-bold transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleUpdateTokens}
                  className="flex-grow py-2.5 bg-red-650 hover:bg-red-600 text-white rounded-xl text-xs uppercase font-mono font-bold transition cursor-pointer shadow-[0_0_15px_rgba(239,68,68,0.25)]"
                >
                  Guardar
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

    </div>
  );
}
