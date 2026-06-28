// Sistema de Economía - Free-to-Play con retención
export const ECONOMY_CONFIG = {
  INITIAL_BALANCE: 152450, // Saldo inicial de cortesía
  MIN_BET: 50,
  MAX_BET: 5000,
  DAILY_BONUS: 25000, // Bono diario
  BANKRUPTCY_RECOVERY: 10000, // Fichas de recuperación por bancarrota
  RECOVERY_COOLDOWN_MS: 60 * 60 * 1000, // 1 hora para reclamar recuperación
  DAILY_BONUS_COOLDOWN_MS: 24 * 60 * 60 * 1000, // 24 horas entre bonos
  BANKRUPTCY_THRESHOLD: 50, // Se considera bancarrota si tiene menos que la apuesta mínima
};

export interface PlayerState {
  balance: number;
  totalBet: number;
  totalWon: number;
  totalLost: number;
  spinsCount: number;
  history: HistoryEntry[];
  lastDailyBonus: number | null; // timestamp
  lastRecovery: number | null; // timestamp
  createdAt: number;
}

export interface HistoryEntry {
  number: number;
  color: "red" | "black" | "green";
  timestamp: number;
}

export function createNewPlayer(): PlayerState {
  return {
    balance: ECONOMY_CONFIG.INITIAL_BALANCE,
    totalBet: 0,
    totalWon: 0,
    totalLost: 0,
    spinsCount: 0,
    history: [],
    lastDailyBonus: null,
    lastRecovery: null,
    createdAt: Date.now(),
  };
}

export function isBankrupt(state: PlayerState): boolean {
  return state.balance < ECONOMY_CONFIG.BANKRUPTCY_THRESHOLD;
}

export function canClaimDailyBonus(state: PlayerState): boolean {
  if (!state.lastDailyBonus) return true;
  return Date.now() - state.lastDailyBonus >= ECONOMY_CONFIG.DAILY_BONUS_COOLDOWN_MS;
}

export function canClaimRecovery(state: PlayerState): boolean {
  if (!isBankrupt(state)) return false;
  if (!state.lastRecovery) return true;
  return Date.now() - state.lastRecovery >= ECONOMY_CONFIG.RECOVERY_COOLDOWN_MS;
}

export function getRecoveryCooldownRemaining(state: PlayerState): number {
  if (!state.lastRecovery) return 0;
  const elapsed = Date.now() - state.lastRecovery;
  const remaining = ECONOMY_CONFIG.RECOVERY_COOLDOWN_MS - elapsed;
  return Math.max(0, remaining);
}

export function getDailyBonusCooldownRemaining(state: PlayerState): number {
  if (!state.lastDailyBonus) return 0;
  const elapsed = Date.now() - state.lastDailyBonus;
  const remaining = ECONOMY_CONFIG.DAILY_BONUS_COOLDOWN_MS - elapsed;
  return Math.max(0, remaining);
}

export function claimDailyBonus(state: PlayerState): PlayerState {
  if (!canClaimDailyBonus(state)) return state;
  return {
    ...state,
    balance: state.balance + ECONOMY_CONFIG.DAILY_BONUS,
    lastDailyBonus: Date.now(),
  };
}

export function claimRecovery(state: PlayerState): PlayerState {
  if (!canClaimRecovery(state)) return state;
  return {
    ...state,
    balance: state.balance + ECONOMY_CONFIG.BANKRUPTCY_RECOVERY,
    lastRecovery: Date.now(),
  };
}

export function formatBalance(amount: number): string {
  return amount.toLocaleString("es-ES");
}

export function formatCooldown(ms: number): string {
  const totalSeconds = Math.ceil(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
}
