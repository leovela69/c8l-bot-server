import { NextResponse } from "next/server";
import { spinWheel, evaluateAllBets, Bet } from "@/lib/roulette-engine";
import { ECONOMY_CONFIG } from "@/lib/economy";

// POST /api/game/spin
// Body: { bets: Bet[], balance: number }
// Returns: { result: SpinResult, newBalance: number }
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { bets, balance } = body as { bets: Bet[]; balance: number };

    // Validate bets
    if (!bets || bets.length === 0) {
      return NextResponse.json(
        { error: "No bets placed" },
        { status: 400 }
      );
    }

    const totalBetAmount = bets.reduce((sum, b) => sum + b.amount, 0);

    // Validate bet limits
    if (totalBetAmount < ECONOMY_CONFIG.MIN_BET) {
      return NextResponse.json(
        { error: "Bet below minimum" },
        { status: 400 }
      );
    }

    if (totalBetAmount > ECONOMY_CONFIG.MAX_BET) {
      return NextResponse.json(
        { error: "Bet exceeds maximum" },
        { status: 400 }
      );
    }

    if (totalBetAmount > balance) {
      return NextResponse.json(
        { error: "Insufficient balance" },
        { status: 400 }
      );
    }

    // Spin the wheel (server-side randomness)
    const resultNumber = spinWheel();
    const spinResult = evaluateAllBets(bets, resultNumber);

    // Calculate new balance
    const newBalance = balance - totalBetAmount + spinResult.totalWin;

    return NextResponse.json({
      result: spinResult,
      newBalance,
      totalBet: totalBetAmount,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
