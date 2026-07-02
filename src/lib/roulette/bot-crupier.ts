// C8L Bot Crupier - IA de la casa
import { Bet, SpinResult, createStraightBet, createRedBet, createBlackBet, createDozenBet, getNumberColor } from "./roulette-engine";

export interface BotPlayer {
  id: string;
  name: string;
  avatar: string;
  balance: number;
  currentBets: Bet[];
  isHouse: boolean;
  mood: "neutral" | "happy" | "sad" | "excited";
  lastMessage: string;
}

export interface ChatMessage {
  id: string;
  sender: string;
  senderAvatar: string;
  text: string;
  timestamp: number;
  isSystem: boolean;
  isBot: boolean;
}

// Frases del crupier Leon
const CRUPIER_PHRASES = {
  welcome: [
    "Bienvenidos a la mesa de C8L Casino. Hagan sus apuestas.",
    "La mesa esta abierta. Buena suerte a todos.",
    "Damas y caballeros, la ruleta les espera.",
  ],
  spinning: [
    "No va mas! La bola esta en juego.",
    "Rien ne va plus! Girandooo...",
    "La rueda gira... que la suerte les acompane.",
    "No mas apuestas. Vamos alla!",
  ],
  result: {
    red: (n: number) => [
      `${n} Rojo. Los rojos ganan!`,
      `Ha salido el ${n}, color ROJO.`,
      `Rojo ${n}! Felicidades a los ganadores.`,
    ],
    black: (n: number) => [
      `${n} Negro. Suerte para los negros!`,
      `Ha salido el ${n}, color NEGRO.`,
      `Negro ${n}! A cobrar senores.`,
    ],
    green: (n: number) => [
      `ZERO! La casa agradece.`,
      `Ha salido el ${n}! El verde manda.`,
      `Cero! Increible jugada del destino.`,
    ],
  },
  bigWin: [
    "ENORME! Que jugada maestra!",
    "La casa se inclina ante usted!",
    "Vaya golpe! El casino tiembla!",
  ],
  botBetting: [
    "Hmm... voy con el rojo esta vez.",
    "Mi instinto me dice negro.",
    "La docena 2 me llama...",
    "Pleno al 17, mi numero de la suerte.",
    "Voy conservador, par esta vez.",
  ],
  botWin: [
    "JA! Lo sabia!",
    "Mi algoritmo no falla!",
    "La suerte de la casa!",
  ],
  botLose: [
    "Vaya... la proxima sera.",
    "El azar es caprichoso...",
    "Incluso la casa pierde a veces.",
  ],
};

// Bot players pool
const BOT_NAMES = [
  { name: "Leon C8L", avatar: "🦁", isHouse: true },
  { name: "Maria_77", avatar: "👩", isHouse: false },
  { name: "ElRey_Bets", avatar: "👑", isHouse: false },
  { name: "LuckyAna", avatar: "🍀", isHouse: false },
  { name: "Poker_Pro", avatar: "🃏", isHouse: false },
];

function randomPick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 10);
}

export function createBotPlayers(count: number = 3): BotPlayer[] {
  const selected = [BOT_NAMES[0]]; // Always include Leon (house)
  const others = BOT_NAMES.slice(1).sort(() => Math.random() - 0.5).slice(0, count - 1);
  selected.push(...others);

  return selected.map((bot) => ({
    id: generateId(),
    name: bot.name,
    avatar: bot.avatar,
    balance: bot.isHouse ? 999999 : 50000 + Math.floor(Math.random() * 100000),
    currentBets: [],
    isHouse: bot.isHouse,
    mood: "neutral" as const,
    lastMessage: "",
  }));
}

export function generateBotBets(bot: BotPlayer, chipValues: number[]): Bet[] {
  const bets: Bet[] = [];
  const numBets = bot.isHouse ? 2 + Math.floor(Math.random() * 3) : 1 + Math.floor(Math.random() * 2);
  const chip = chipValues[Math.floor(Math.random() * chipValues.length)];

  for (let i = 0; i < numBets; i++) {
    const roll = Math.random();
    if (roll < 0.3) {
      bets.push(createStraightBet(Math.floor(Math.random() * 37), chip));
    } else if (roll < 0.5) {
      bets.push(createRedBet(chip));
    } else if (roll < 0.7) {
      bets.push(createBlackBet(chip));
    } else {
      bets.push(createDozenBet((Math.floor(Math.random() * 3) + 1) as 1 | 2 | 3, chip));
    }
  }

  return bets;
}

export function getCrupierMessage(event: "welcome" | "spinning" | "bigWin"): string {
  return randomPick(CRUPIER_PHRASES[event]);
}

export function getCrupierResultMessage(number: number): string {
  const color = getNumberColor(number);
  const phrases = CRUPIER_PHRASES.result[color](number);
  return randomPick(phrases);
}

export function getBotBettingMessage(): string {
  return randomPick(CRUPIER_PHRASES.botBetting);
}

export function getBotReactionMessage(won: boolean): string {
  return won ? randomPick(CRUPIER_PHRASES.botWin) : randomPick(CRUPIER_PHRASES.botLose);
}

export function createSystemMessage(text: string): ChatMessage {
  return {
    id: generateId(),
    sender: "Sistema",
    senderAvatar: "🎰",
    text,
    timestamp: Date.now(),
    isSystem: true,
    isBot: false,
  };
}

export function createBotMessage(bot: BotPlayer, text: string): ChatMessage {
  return {
    id: generateId(),
    sender: bot.name,
    senderAvatar: bot.avatar,
    text,
    timestamp: Date.now(),
    isSystem: false,
    isBot: true,
  };
}

export function createPlayerMessage(text: string): ChatMessage {
  return {
    id: generateId(),
    sender: "Tu",
    senderAvatar: "🎲",
    text,
    timestamp: Date.now(),
    isSystem: false,
    isBot: false,
  };
}



// Narración automática de jugadas - el bot explica qué pasó
export function getNarrationMessage(bets: Bet[], result: SpinResult): string | null {
  if (bets.length === 0) return null;

  const totalBet = bets.reduce((sum, b) => sum + b.amount, 0);
  const winners = result.betsResults.filter(r => r.won);
  const losers = result.betsResults.filter(r => !r.won);

  // Describe the bets placed
  const betDescriptions: string[] = [];
  const typeCounts: Record<string, number> = {};
  bets.forEach(b => {
    typeCounts[b.type] = (typeCounts[b.type] || 0) + 1;
  });

  const typeLabels: Record<string, string> = {
    straight: "pleno",
    split: "caballo",
    street: "transversal",
    corner: "cuadro",
    six_line: "seisena",
    column: "columna",
    dozen: "docena",
    red: "rojo",
    black: "negro",
    even: "par",
    odd: "impar",
    low: "1-18",
    high: "19-36",
  };

  Object.entries(typeCounts).forEach(([type, count]) => {
    const label = typeLabels[type] || type;
    if (count > 1) {
      betDescriptions.push(`${count}x ${label}`);
    } else {
      betDescriptions.push(label);
    }
  });

  const betSummary = betDescriptions.join(", ");

  if (result.totalWin > 0) {
    const profit = result.totalWin - totalBet;
    if (profit > 5000) {
      return `📊 Jugada: ${betSummary} por ${totalBet.toLocaleString()}. GANANCIA BRUTAL: +${result.totalWin.toLocaleString()} fichas! Beneficio neto: +${profit.toLocaleString()}. Que jugada maestra!`;
    }
    return `📊 Aposto ${totalBet.toLocaleString()} en ${betSummary}. Gano ${result.totalWin.toLocaleString()} fichas (+${profit.toLocaleString()} neto). Buena lectura!`;
  } else {
    return `📊 Aposto ${totalBet.toLocaleString()} en ${betSummary}. No hubo suerte esta vez. -${totalBet.toLocaleString()} fichas. La proxima sera!`;
  }
}
