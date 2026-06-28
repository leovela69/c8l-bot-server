import { NextResponse } from "next/server";
import { ECONOMY_CONFIG } from "@/lib/economy";

// POST /api/game/bonus
// Body: { type: "daily" | "recovery", lastClaimed: number | null }
// Returns: { amount: number, newLastClaimed: number }
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, lastClaimed } = body as {
      type: "daily" | "recovery";
      lastClaimed: number | null;
    };

    const now = Date.now();

    if (type === "daily") {
      if (lastClaimed) {
        const elapsed = now - lastClaimed;
        if (elapsed < ECONOMY_CONFIG.DAILY_BONUS_COOLDOWN_MS) {
          const remaining = ECONOMY_CONFIG.DAILY_BONUS_COOLDOWN_MS - elapsed;
          return NextResponse.json(
            { error: "Cooldown active", remainingMs: remaining },
            { status: 429 }
          );
        }
      }

      return NextResponse.json({
        amount: ECONOMY_CONFIG.DAILY_BONUS,
        newLastClaimed: now,
        message: "Daily bonus claimed!",
      });
    }

    if (type === "recovery") {
      if (lastClaimed) {
        const elapsed = now - lastClaimed;
        if (elapsed < ECONOMY_CONFIG.RECOVERY_COOLDOWN_MS) {
          const remaining = ECONOMY_CONFIG.RECOVERY_COOLDOWN_MS - elapsed;
          return NextResponse.json(
            { error: "Cooldown active", remainingMs: remaining },
            { status: 429 }
          );
        }
      }

      return NextResponse.json({
        amount: ECONOMY_CONFIG.BANKRUPTCY_RECOVERY,
        newLastClaimed: now,
        message: "Recovery chips granted!",
      });
    }

    return NextResponse.json(
      { error: "Invalid bonus type" },
      { status: 400 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
