// lib/poker/handEvaluator.ts
// Orden de fuerza de manos (de mayor a menor)
const HAND_RANKS = {
  'Royal Flush': 10,
  'Straight Flush': 9,
  'Four of a Kind': 8,
  'Full House': 7,
  'Flush': 6,
  'Straight': 5,
  'Three of a Kind': 4,
  'Two Pair': 3,
  'One Pair': 2,
  'High Card': 1
};

export function evaluateHand(cards: string[]): { rank: string, value: number } {
  // Implementación simplificada (puedes usar librería como poker-evaluator)
  // 1. Extraer valores y palos
  const values = cards.map(c => c[0]);
  const suits = cards.map(c => c[1]);
  
  // 2. Verificar escalera real
  const isRoyal = values.includes('A') && values.includes('K') && 
                  values.includes('Q') && values.includes('J') && values.includes('10');
  const isFlush = suits.every(s => s === suits[0]);
  
  if (isRoyal && isFlush) return { rank: 'Royal Flush', value: 10 };
  if (isFlush) return { rank: 'Flush', value: 6 };
  
  // ... resto de evaluaciones
  
  return { rank: 'High Card', value: 1 };
}