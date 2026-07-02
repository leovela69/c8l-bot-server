// Ruleta Europea - Motor del juego
// Orden de los números en la rueda europea (sentido horario)
export const WHEEL_NUMBERS = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10,
  5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26,
];

// Números rojos en la ruleta europea
export const RED_NUMBERS = [
  1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36,
];

// Números negros
export const BLACK_NUMBERS = [
  2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 28, 29, 31, 33, 35,
];

export type BetType =
  | "straight" // Pleno (1 número) - paga 35:1
  | "split" // Caballo (2 números) - paga 17:1
  | "street" // Transversal (3 números) - paga 11:1
  | "corner" // Cuadro (4 números) - paga 8:1
  | "six_line" // Seisena (6 números) - paga 5:1
  | "column" // Columna (12 números) - paga 2:1
  | "dozen" // Docena (12 números) - paga 2:1
  | "red" // Rojo (18 números) - paga 1:1
  | "black" // Negro (18 números) - paga 1:1
  | "even" // Par (18 números) - paga 1:1
  | "odd" // Impar (18 números) - paga 1:1
  | "low" // 1-18 (18 números) - paga 1:1
  | "high"; // 19-36 (18 números) - paga 1:1

export interface Bet {
  type: BetType;
  numbers: number[];
  amount: number;
}

export interface SpinResult {
  number: number;
  color: "red" | "black" | "green";
  wheelPosition: number; // Índice en WHEEL_NUMBERS
  totalWin: number;
  betsResults: {
    bet: Bet;
    won: boolean;
    payout: number;
  }[];
}

// Payouts por tipo de apuesta
const PAYOUTS: Record<BetType, number> = {
  straight: 35,
  split: 17,
  street: 11,
  corner: 8,
  six_line: 5,
  column: 2,
  dozen: 2,
  red: 1,
  black: 1,
  even: 1,
  odd: 1,
  low: 1,
  high: 1,
};

export function getNumberColor(n: number): "red" | "black" | "green" {
  if (n === 0) return "green";
  if (RED_NUMBERS.includes(n)) return "red";
  return "black";
}

export function spinWheel(): number {
  // Genera un número aleatorio entre 0 y 36
  return Math.floor(Math.random() * 37);
}

export function getWheelPosition(number: number): number {
  return WHEEL_NUMBERS.indexOf(number);
}

export function evaluateBet(bet: Bet, result: number): { won: boolean; payout: number } {
  const won = bet.numbers.includes(result);
  // Payout includes the original bet amount returned + winnings
  // If lost, payout is 0 (bet is forfeit)
  const payout = won ? bet.amount * PAYOUTS[bet.type] + bet.amount : 0;
  return { won, payout };
}

export function evaluateAllBets(bets: Bet[], result: number): SpinResult {
  const color = getNumberColor(result);
  const wheelPosition = getWheelPosition(result);

  const betsResults = bets.map((bet) => {
    const { won, payout } = evaluateBet(bet, result);
    return { bet, won, payout };
  });

  const totalWin = betsResults.reduce((sum, r) => sum + r.payout, 0);

  return {
    number: result,
    color,
    wheelPosition,
    totalWin,
    betsResults,
  };
}

// Helpers para crear apuestas específicas
export function createStraightBet(number: number, amount: number): Bet {
  return { type: "straight", numbers: [number], amount };
}

export function createRedBet(amount: number): Bet {
  return { type: "red", numbers: RED_NUMBERS, amount };
}

export function createBlackBet(amount: number): Bet {
  return { type: "black", numbers: BLACK_NUMBERS, amount };
}

export function createEvenBet(amount: number): Bet {
  return {
    type: "even",
    numbers: Array.from({ length: 36 }, (_, i) => i + 1).filter((n) => n % 2 === 0),
    amount,
  };
}

export function createOddBet(amount: number): Bet {
  return {
    type: "odd",
    numbers: Array.from({ length: 36 }, (_, i) => i + 1).filter((n) => n % 2 !== 0),
    amount,
  };
}

export function createLowBet(amount: number): Bet {
  return {
    type: "low",
    numbers: Array.from({ length: 18 }, (_, i) => i + 1),
    amount,
  };
}

export function createHighBet(amount: number): Bet {
  return {
    type: "high",
    numbers: Array.from({ length: 18 }, (_, i) => i + 19),
    amount,
  };
}

export function createDozenBet(dozen: 1 | 2 | 3, amount: number): Bet {
  const start = (dozen - 1) * 12 + 1;
  return {
    type: "dozen",
    numbers: Array.from({ length: 12 }, (_, i) => start + i),
    amount,
  };
}

export function createColumnBet(column: 1 | 2 | 3, amount: number): Bet {
  // Columna 1: 1,4,7,10... Columna 2: 2,5,8,11... Columna 3: 3,6,9,12...
  return {
    type: "column",
    numbers: Array.from({ length: 12 }, (_, i) => column + i * 3),
    amount,
  };
}
