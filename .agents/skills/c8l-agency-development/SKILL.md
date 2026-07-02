---
name: c8l-agency-development
description: Guidelines and context for maintaining, developing, and extending the C8L Agency web ecosystem, including virtual rooms, custom synthesizers, and casino integrations.
---

# C8L Agency Development Skill

Use this skill to guide the development, testing, and continuous learning of future AI agents working on the C8L Agency ecosystem.

---

## 1. Project Domain & Context

C8L Agency is a high-octane gaming and music production platform built for producers, creators, and gamers. The economy operates using virtual currency:
*   **C8L Coins:** The primary currency used for wagering in the Casino, voting on tracks in PK Showdowns, and purchasing virtual gifts.
*   **Stars & Creator XP:** Awarded to users and agents when they receive gifts or perform mastering actions. Each 1000 XP levels up the user.

---

## 2. Technology Stack & Directory Structure

The application is built on:
*   **Vite + React + TypeScript + Vanilla CSS**
*   **Supabase:** Auth and profile database client.
*   **Web Audio API:** Real-time synthesizer engine for interactive sound effects.
*   **Framer Motion:** Custom overlays, neon lights, and slot reel transitions.

### Directory Mapping
*   `src/context/AppContext.tsx`: Unifies auth, currency state, logging, and active views.
*   `src/components/ui/`: Contains modular React components:
    *   `AIAgentWidget.tsx`: Gemini interaction bot and Minimax firewall game.
    *   `CyberpunkDashboard.tsx`: Audio mastering deck and PK Showdown interface.
    *   `VirtualRoom.tsx`: Interactive 2D stage with seat reservations and Gift integration.
    *   `GiftSystem.tsx`: Virtual items with synthesizer audio and neon visual triggers.
    *   `SlotMachine.tsx`: Retro arcade slot cabinet with simulated RTP math.
    *   `LionMascot.tsx`: Core SVG avatar representing the C8L Mascot.

---

## 3. Style Guide & Visual Tokens

Always adhere to the gamer/cyberpunk cel-shaded design tokens defined in `.interface-design/system.md`:
*   **Colors:**
    *   `--color-absolute-black`: `#000000` (Canvas background)
    *   `--color-dark-graphite`: `#0d0d0e` (Cards and panels)
    *   `--color-gold-chrome`: `#D4AF37` (Jackpots and headers)
    *   `--color-neon-red`: `#FF0055` (Pink/red accents, bets, health meters)
    *   `--color-neon-cyan`: `#00F3FF` (Main interactive actions and links)
*   **Typography:**
    *   Headings: `Space Grotesk`, sans-serif (Bold, tracking-wider)
    *   Body: `Inter`, sans-serif
    *   Monospace/Telemetry: `Courier New`, monospace
*   **Shadows:** Thick black borders (`3px solid #000000`) with offset solid neon drop shadows (`4px 4px 0px var(--neon-cyan)`) instead of blurred shadows.

---

## 4. Key Implementation Patterns

### Web Audio API Synthesizer Pattern
Never use external static MP3 files for system feedback. Synthesize sound in real-time:
```typescript
const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
const osc = ctx.createOscillator();
const gain = ctx.createGain();

osc.type = "sine"; // or sawtooth, square, triangle
osc.frequency.setValueAtTime(startingFreq, ctx.currentTime);
osc.frequency.exponentialRampToValueAtTime(targetFreq, ctx.currentTime + duration);

gain.gain.setValueAtTime(volume, ctx.currentTime);
gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + duration);

osc.connect(gain);
gain.connect(ctx.destination);
osc.start();
osc.stop(ctx.currentTime + duration);
```

### Simulated RTP Payout Pattern (Casino Slots)
The slot machine must maintain a target RTP (~96.5%). Ponder your arrays before evaluating matches:
*   Cherry: 35% probability (Recovers 0.5x bet)
*   Lion: 1.5% probability (Awards current Jackpot)
*   Check matching rows (`s1 === s2 && s2 === s3`) for jackpot release and double coincidences (`s1 === s2 || s2 === s3`) for minor payouts.

---

## 5. Learning & Continuous Optimization

Future agents should read and update this skill structure to log new core capabilities:
1.  **Read Active Trends:** Parse `src/data/market_trend.json` dynamically to adapt UI landing banners.
2.  **Verify Code Quality:** Always run validation using `npm run build` after modifying component state.
3.  **Supabase Syncing:** Extend client schemas in `src/lib/supabase.ts` when migrating mock profiles to real PostgreSQL tables.
