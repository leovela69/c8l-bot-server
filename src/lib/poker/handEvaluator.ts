// lib/poker/handEvaluator.ts

export interface PokerHandResult {
  rankName: string;
  rankValue: number; // 1 to 10
  score: number; // calculated score for comparisons
  description: string;
}

const RANK_ORDER: Record<string, number> = {
  "2": 2, "3": 3, "4": 4, "5": 5, "6": 6, "7": 7, "8": 8, "9": 9,
  "10": 10, "J": 11, "Q": 12, "K": 13, "A": 14
};

const HAND_NAMES = [
  "High Card",       // 1
  "One Pair",        // 2
  "Two Pair",        // 3
  "Three of a Kind", // 4
  "Straight",        // 5
  "Flush",           // 6
  "Full House",      // 7
  "Four of a Kind",  // 8
  "Straight Flush",  // 9
  "Royal Flush"      // 10
];

// Helper to evaluate a 5-card hand
function evaluate5CardHand(cards: { rank: string; suit: string }[], isShortDeck = false): { rankValue: number; tieBreakers: number[] } {
  const values = cards.map(c => RANK_ORDER[c.rank]).sort((a, b) => b - a);
  const suits = cards.map(c => c.suit);
  
  const isFlush = suits.every(s => s === suits[0]);
  
  // Check for straight
  let isStraight = false;
  let straightHigh = 0;
  
  // Check standard straight
  const uniqueValues = Array.from(new Set(values));
  if (uniqueValues.length === 5) {
    if (uniqueValues[0] - uniqueValues[4] === 4) {
      isStraight = true;
      straightHigh = uniqueValues[0];
    } else if (
      !isShortDeck &&
      uniqueValues[0] === 14 && // Ace
      uniqueValues[1] === 5 &&
      uniqueValues[2] === 4 &&
      uniqueValues[3] === 3 &&
      uniqueValues[4] === 2
    ) {
      isStraight = true;
      straightHigh = 5; // Ace plays as low
    } else if (
      isShortDeck &&
      uniqueValues[0] === 14 && // Ace
      uniqueValues[1] === 9 &&
      uniqueValues[2] === 8 &&
      uniqueValues[3] === 7 &&
      uniqueValues[4] === 6
    ) {
      isStraight = true;
      straightHigh = 9; // A-6-7-8-9 straight, 9 is high
    }
  }

  // Count frequencies
  const counts: Record<number, number> = {};
  for (const val of values) {
    counts[val] = (counts[val] || 0) + 1;
  }
  
  const freq = Object.entries(counts)
    .map(([val, count]) => ({ val: Number(val), count }))
    .sort((a, b) => b.count - a.count || b.val - a.val);

  // Royal Flush
  if (isFlush && isStraight && straightHigh === 14) {
    return { rankValue: 10, tieBreakers: [14] };
  }
  
  // Straight Flush
  if (isFlush && isStraight) {
    return { rankValue: 9, tieBreakers: [straightHigh] };
  }
  
  if (!freq || freq.length === 0) {
    return { rankValue: 1, tieBreakers: [] };
  }

  // Four of a Kind
  if (freq[0].count === 4) {
    return { rankValue: 8, tieBreakers: [freq[0].val, freq[1]?.val || 0] };
  }
  
  // Full House & Flush swap for Short Deck
  if (isShortDeck) {
    if (isFlush) {
      return { rankValue: 7, tieBreakers: values };
    }
    if (freq[0].count === 3 && freq[1] && freq[1].count === 2) {
      return { rankValue: 6, tieBreakers: [freq[0].val, freq[1].val] };
    }
  } else {
    if (freq[0].count === 3 && freq[1] && freq[1].count === 2) {
      return { rankValue: 7, tieBreakers: [freq[0].val, freq[1].val] };
    }
    if (isFlush) {
      return { rankValue: 6, tieBreakers: values };
    }
  }
  
  // Straight
  if (isStraight) {
    return { rankValue: 5, tieBreakers: [straightHigh] };
  }
  
  // Three of a Kind
  if (freq[0].count === 3) {
    return { rankValue: 4, tieBreakers: [freq[0].val, freq[1]?.val || 0, freq[2]?.val || 0] };
  }
  
  // Two Pair
  if (freq[0].count === 2 && freq[1] && freq[1].count === 2) {
    return { rankValue: 3, tieBreakers: [freq[0].val, freq[1].val, freq[2]?.val || 0] };
  }
  
  // One Pair
  if (freq[0].count === 2) {
    return { rankValue: 2, tieBreakers: [freq[0].val, freq[1]?.val || 0, freq[2]?.val || 0, freq[3]?.val || 0] };
  }
  
  // High Card
  return { rankValue: 1, tieBreakers: values };
}

// Parse card string like "A♥️", "10♠️", "Kh" etc
export function parseCard(cardStr: string): { rank: string; suit: string } {
  // Normalize suits
  let suit = "";
  if (cardStr.includes("♥️")) suit = "H";
  else if (cardStr.includes("♦️")) suit = "D";
  else if (cardStr.includes("♣️")) suit = "C";
  else if (cardStr.includes("♠️")) suit = "S";
  else {
    // Fallbacks
    const s = cardStr.slice(-1).toLowerCase();
    if (s === "h" || s === "♥") suit = "H";
    else if (s === "d" || s === "♦") suit = "D";
    else if (s === "c" || s === "♣") suit = "C";
    else if (s === "s" || s === "♠") suit = "S";
  }

  let rank = cardStr.replace(/[♥️♦️♣️♠️hhddecss♥♦♣♠]/g, "");
  return { rank, suit };
}

// Get all subsets of size k from array
function combinations<T>(arr: T[], k: number): T[][] {
  if (k === 0) return [[]];
  if (arr.length === 0) return [];
  const head = arr[0];
  const tail = arr.slice(1);
  const withHead = combinations(tail, k - 1).map(c => [head, ...c]);
  const withoutHead = combinations(tail, k);
  return [...withHead, ...withoutHead];
}

// Evaluates the best 5-card hand from up to 7 cards (or up to 9 for Omaha)
export function evaluateBestHand(
  pocketAndCommunityCards: string[],
  gameMode: "texas" | "omaha" | "shortdeck" = "texas",
  pocketCount: number = gameMode === "omaha" ? 4 : 2
): PokerHandResult {
  const isShortDeck = gameMode === "shortdeck";

  if (pocketAndCommunityCards.length < 5) {
    const parsed = pocketAndCommunityCards.map(c => parseCard(c));
    const evalResult = evaluate5CardHand(parsed, isShortDeck);
    let score = evalResult.rankValue * 100000000;
    for (let i = 0; i < evalResult.tieBreakers.length; i++) {
      score += evalResult.tieBreakers[i] * Math.pow(15, 4 - i);
    }
    const rankName = isShortDeck && evalResult.rankValue === 7 ? "Flush" : (isShortDeck && evalResult.rankValue === 6 ? "Full House" : HAND_NAMES[evalResult.rankValue - 1]);
    return {
      rankName,
      rankValue: evalResult.rankValue,
      score,
      description: getHandDescription(rankName, evalResult.tieBreakers)
    };
  }

  const parsedHole = pocketAndCommunityCards.slice(0, pocketCount).map(c => parseCard(c));
  const parsedComm = pocketAndCommunityCards.slice(pocketCount).map(c => parseCard(c));

  let all5CardCombos: { rank: string; suit: string }[][] = [];

  if (gameMode === "omaha") {
    // Omaha PLO: Exactly 2 cards from hole, exactly 3 cards from community
    const holeCombos = combinations(parsedHole, 2);
    const commCombos = combinations(parsedComm, Math.min(3, parsedComm.length));
    
    for (const hComb of holeCombos) {
      for (const cComb of commCombos) {
        all5CardCombos.push([...hComb, ...cComb]);
      }
    }
  } else {
    // Texas Hold'em or Short Deck: Any combination of 5 from all cards
    const allParsed = [...parsedHole, ...parsedComm];
    all5CardCombos = combinations(allParsed, 5);
  }

  let bestHand: { rankValue: number; tieBreakers: number[] } | null = null;

  for (const combo of all5CardCombos) {
    if (combo.length < 5) continue;
    
    const evalResult = evaluate5CardHand(combo, isShortDeck);
    if (!bestHand) {
      bestHand = evalResult;
    } else {
      // Compare rank values
      if (evalResult.rankValue > bestHand.rankValue) {
        bestHand = evalResult;
      } else if (evalResult.rankValue === bestHand.rankValue) {
        // Compare tie-breakers one by one
        for (let i = 0; i < evalResult.tieBreakers.length; i++) {
          if (evalResult.tieBreakers[i] > bestHand.tieBreakers[i]) {
            bestHand = evalResult;
            break;
          } else if (evalResult.tieBreakers[i] < bestHand.tieBreakers[i]) {
            break;
          }
        }
      }
    }
  }

  if (!bestHand) {
    const allParsed = [...parsedHole, ...parsedComm];
    const evalResult = evaluate5CardHand(allParsed.slice(0, 5), isShortDeck);
    let score = evalResult.rankValue * 100000000;
    for (let i = 0; i < evalResult.tieBreakers.length; i++) {
      score += evalResult.tieBreakers[i] * Math.pow(15, 4 - i);
    }
    const rankName = isShortDeck && evalResult.rankValue === 7 ? "Flush" : (isShortDeck && evalResult.rankValue === 6 ? "Full House" : HAND_NAMES[evalResult.rankValue - 1]);
    return {
      rankName,
      rankValue: evalResult.rankValue,
      score,
      description: getHandDescription(rankName, evalResult.tieBreakers)
    };
  }

  let score = bestHand.rankValue * 100000000;
  for (let i = 0; i < bestHand.tieBreakers.length; i++) {
    score += bestHand.tieBreakers[i] * Math.pow(15, 4 - i);
  }

  let rankName = "";
  if (isShortDeck) {
    if (bestHand.rankValue === 7) {
      rankName = "Flush";
    } else if (bestHand.rankValue === 6) {
      rankName = "Full House";
    } else {
      rankName = HAND_NAMES[bestHand.rankValue - 1];
    }
  } else {
    rankName = HAND_NAMES[bestHand.rankValue - 1];
  }

  const description = getHandDescription(rankName, bestHand.tieBreakers);

  return {
    rankName,
    rankValue: bestHand.rankValue,
    score,
    description
  };
}

function getHandDescription(rankName: string, tieBreakers: number[]): string {
  const getCardName = (val: number) => {
    if (val === 14) return "As";
    if (val === 13) return "Rey";
    if (val === 12) return "Dama";
    if (val === 11) return "Jota";
    return val.toString();
  };

  switch (rankName) {
    case "Royal Flush":
      return "Escalera Real de Color";
    case "Straight Flush":
      return `Escalera de Color al ${getCardName(tieBreakers[0])}`;
    case "Four of a Kind":
      return `Póker de ${getCardName(tieBreakers[0])}s`;
    case "Full House":
      return `Full de ${getCardName(tieBreakers[0])}s y ${getCardName(tieBreakers[1])}s`;
    case "Flush":
      return `Color con ${getCardName(tieBreakers[0])} alto`;
    case "Straight":
      return `Escalera al ${getCardName(tieBreakers[0])}`;
    case "Three of a Kind":
      return `Tercia de ${getCardName(tieBreakers[0])}s`;
    case "Two Pair":
      return `Doble Par de ${getCardName(tieBreakers[0])}s y ${getCardName(tieBreakers[1])}s`;
    case "One Pair":
      return `Pareja de ${getCardName(tieBreakers[0])}s`;
    default:
      return `Carta Alta ${getCardName(tieBreakers[0])}`;
  }
}