# C8L Music IA Studio Design System

## 1. Intent and Direction
*   **Who is this human?** Music producers, content creators, and community gamers in the Corazones Locos (C8L) ecosystem who want to master music, engage in tracks showdowns (PK battles), and track coin/level telemetry in a high-octane gaming environment.
*   **What must they accomplish?** Master audio files, monitor live tracks performance, view active battles, manage their C8L Coins, and configure AI agent memory buffers.
*   **What does this feel like?** An immersive arcade cabinet meets terminal dashboard. Energetic, high-contrast, gaming-focused (Gamer/Cyberpunk), with thick-ink outlines (Cel-Shaded) and neon glow overrides. No quiet SaaS templates.

---

## 2. Token Architecture

### Color World (Primitives)
*   `--color-absolute-black`: `#000000` (Canvas and layout foundation)
*   `--color-dark-graphite`: `#0d0d0e` (Surface card background, deep panel fillings)
*   `--color-gold-chrome`: `#D4AF37` (Legendary tiers, headers, and jackpot statuses)
*   `--color-neon-red`: `#FF0055` (Health loss alerts, PK battle critical fire, pulse status)
*   `--color-neon-cyan`: `#00F3FF` (Main interactive actions, focus state, scanlines, digital tech elements)
*   `--color-dark-zinc`: `#1a1a1c` (Border default strokes, structural dividers)

### Spacing Scale
*   **Base Unit**: `8px`
*   `--space-xs`: `4px`
*   `--space-sm`: `8px`
*   `--space-md`: `16px`
*   `--space-lg`: `24px`
*   `--space-xl`: `32px`

### Typography Scale
*   `--font-headline`: `'Space Grotesk', sans-serif` (Aggressive tracking, bold geometric headers)
*   `--font-primary`: `'Inter', sans-serif` (Body readable text)
*   `--font-mono`: `'Courier New', monospace` (Telemetry numbers, state matrix feedback, log terminal)

---

## 3. Depth & Border Strategy
*   **Approach**: **Borders-only with Cel-Shaded Offset and Neon Shadows**.
*   **Panels/Cards**: Thick black solid borders (`3px solid #000000`) combined with hard neon drop shadows (`4px 4px 0px var(--neon-cyan)`) instead of smooth blur shadows.
*   **Elevation**:
    *   `Base`: `#000000` (Absolute background)
    *   `Level 1 (Panels)`: `#0d0d0e` (Flat dark surface)
    *   `Level 2 (Dropdowns / Overlays)`: `#151517` (High-contrast surface)
    *   `Inputs/Console`: `#050506` (Recessed dark console inputs)

---

## 4. Replaced Defaults
*   **Flat Cards** $\rightarrow$ Thick black border panels with dual-colored offsets (`#00F3FF` or `#FF0055`) and scanline filter layers.
*   **SaaS Sidebar** $\rightarrow$ Sci-Fi HUD Command Center. Radial gauge for system integrity and character level portraits.
*   **Standard Slider / Controls** $\rightarrow$ Frequency knob components and fighting game meter bars with yellow-to-cyan gradient steps.

---

## 5. Key Component Patterns

### Fighting Game Level Bar (Health/XP)
*   A stylized meter with split cells representing level or track power.
*   Outer wrap has thick black borders and sharp corners (`border-radius: 4px`).
*   Filled with segment steps running from neon red (`#FF0055`) to neon cyan (`#00F3FF`).

### Audio Waveform Vector
*   A cel-shaded vertical-bar music waveform.
*   Every bar has a solid black border and is filled with neon cyan or gold depending on frequency intensity.
*   Hovering zooms the hovered node with retro arcade cursor ticks (`[ ]`).

### Animated Fire Container
*   A CSS keyframe-animated flame container for highlighting high-tier battles or tracks with high coin multipliers.
*   Uses layered SVG flames animated with alternating skew, scale, and filter glow shifts.

### Interactive Stage Seats (Sillones)
*   A grid of interactive squares with thick black borders representing reservation seats.
*   Active speakers display a custom animated soundwave equalizer indicator floating above their avatar.
*   Clicking toggles seat occupancy and triggers local room log events.

### Arcade Slot Cabinet (Reels Panel)
*   A 3-reel display container with custom background grid scanlines and a glowing Jackpot badge.
*   Spins are simulated using fast cycle iterations of random symbols, finalizing with an RTP certified weight mapping.

### Web Audio Synthesizer Engine
*   Standard UI click and action sounds are replaced by real-time generated waves (sine, square, triangle, sawtooth) using envelope sweeps.
*   Enforces a zero static asset dependency for audio feedback.

### Neon Visual Overlays (Gift overlays)
*   Full-screen transparent overlays triggering customized framer-motion scaling transitions.
*   Panels display thick colored borders matching the primary tone of the active action, creating high-contrast depth.

### Custom YouTube-Style Video Player
*   Wraps `react-player` with type casting (`as any`) to bypass strict React 19/Next 16 prop type checking.
*   Features custom neon/gold styling (`bg-gold`, `border-gold`), interactive sliders (volume, progress), custom skip controls, and full-screen state management matching the cyberpunk HUD commands.

### Static Export Dynamic Params Wrapping (Server-Client Page Split)
*   Dynamic routes under static export (`output: "export"`) must define static param lists using `generateStaticParams()` at build time.
*   Because client components cannot export static parameter lists, the page must be split: a Server Component `page.tsx` that exports `generateStaticParams` and renders a Client Component (`*Client.tsx`) passing resolved props (like `id`).

### Cyberpunk Legal Tabs Container
*   A tabbed navigation panel for displaying legal documents (ToS, Privacy) using a cyberpunk console aesthetics.
*   The tab controls container uses a thick black border (`border-[3px] border-black`) and rounded edges (`rounded-2xl`) with a solid neon red shadow (`shadow-[4px_4px_0px_#FF0055]`).
*   Active tabs utilize neon red background (`bg-[#FF0055]`) with outer glows (`shadow-[0_0_10px_rgba(255,0,85,0.3)]`), while inactive tabs hover to full-white on dark backgrounds.
*   The document container has a hard cyan shadow (`shadow-[4px_4px_0px_#00F3FF]`), containing retro CRT scanlines (`bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.15)_50%)]`) to mimic physical display units.

### Sandbox Billing / Checkout HUD Card
*   A billing gateway mockup box mimicking a real credit card checkout screen.
*   The wrapper features a thick black border (`border-[3px] border-black`) and a high-contrast neon cyan shadow (`shadow-[4px_4px_0px_#00F3FF]`).
*   Features a warning bar utilizing amber alerts (`bg-amber-950/30 border border-amber-500/30`) to warn users that real money is not processed when `NEXT_PUBLIC_STRIPE_ACTIVATED` is false.
*   Presents invoice details and totals using monospace font typography (`font-mono`) to resemble invoice ledger logs.

