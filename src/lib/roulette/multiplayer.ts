// C8L Multiplayer System - BroadcastChannel for same-origin + localStorage sync
// For external players: uses a polling-based sync via localStorage

export interface RemotePlayer {
  id: string;
  name: string;
  avatar: string;
  balance: number;
  joinedAt: number;
  lastSeen: number;
  currentBets: { type: string; amount: number; numbers: number[] }[];
}

export interface RoomState {
  players: RemotePlayer[];
  currentRound: number;
  lastResult: number | null;
  phase: "waiting" | "betting" | "spinning" | "result";
}

const ROOM_KEY = "c8l-ruleta-room";
const PLAYER_TTL = 30000; // 30s timeout for inactive players

function generatePlayerId(): string {
  return "p_" + Math.random().toString(36).substring(2, 10);
}

function getRandomName(): string {
  const names = [
    "Jugador_" + Math.floor(Math.random() * 999),
    "Lucky" + Math.floor(Math.random() * 99),
    "High_Roller",
    "Apostador_X",
    "El_Vivo",
    "Casino_Fan",
    "RuletaMaster",
    "Golden_" + Math.floor(Math.random() * 99),
  ];
  return names[Math.floor(Math.random() * names.length)];
}

function getRandomAvatar(): string {
  const avatars = ["🎰", "🃏", "💎", "🎲", "🌟", "⚡", "🔥", "👑"];
  return avatars[Math.floor(Math.random() * avatars.length)];
}

export function createLocalPlayer(name?: string): RemotePlayer {
  return {
    id: generatePlayerId(),
    name: name || getRandomName(),
    avatar: getRandomAvatar(),
    balance: 152450,
    joinedAt: Date.now(),
    lastSeen: Date.now(),
    currentBets: [],
  };
}

export function getRoomState(): RoomState {
  try {
    const raw = localStorage.getItem(ROOM_KEY);
    if (!raw) return createEmptyRoom();
    const room = JSON.parse(raw) as RoomState;
    // Clean stale players
    room.players = room.players.filter(p => Date.now() - p.lastSeen < PLAYER_TTL);
    return room;
  } catch {
    return createEmptyRoom();
  }
}

export function createEmptyRoom(): RoomState {
  return {
    players: [],
    currentRound: 0,
    lastResult: null,
    phase: "waiting",
  };
}

export function joinRoom(player: RemotePlayer): RoomState {
  const room = getRoomState();
  // Remove if already exists
  room.players = room.players.filter(p => p.id !== player.id);
  room.players.push(player);
  saveRoom(room);
  return room;
}

export function updatePlayerInRoom(player: RemotePlayer): void {
  const room = getRoomState();
  const idx = room.players.findIndex(p => p.id === player.id);
  if (idx >= 0) {
    room.players[idx] = { ...player, lastSeen: Date.now() };
  } else {
    room.players.push({ ...player, lastSeen: Date.now() });
  }
  saveRoom(room);
}

export function leaveRoom(playerId: string): void {
  const room = getRoomState();
  room.players = room.players.filter(p => p.id !== playerId);
  saveRoom(room);
}

export function updateRoomPhase(phase: RoomState["phase"], result?: number): void {
  const room = getRoomState();
  room.phase = phase;
  if (result !== undefined) {
    room.lastResult = result;
    room.currentRound++;
  }
  saveRoom(room);
}

function saveRoom(room: RoomState): void {
  try {
    localStorage.setItem(ROOM_KEY, JSON.stringify(room));
    // Dispatch storage event for other tabs
    window.dispatchEvent(new StorageEvent("storage", {
      key: ROOM_KEY,
      newValue: JSON.stringify(room),
    }));
  } catch {}
}

// Hook-style polling for room updates
export function subscribeToRoom(callback: (room: RoomState) => void): () => void {
  const handler = (e: StorageEvent) => {
    if (e.key === ROOM_KEY && e.newValue) {
      try {
        callback(JSON.parse(e.newValue));
      } catch {}
    }
  };
  window.addEventListener("storage", handler);
  
  // Also poll every 2s for same-tab updates
  const interval = setInterval(() => {
    callback(getRoomState());
  }, 2000);

  return () => {
    window.removeEventListener("storage", handler);
    clearInterval(interval);
  };
}
