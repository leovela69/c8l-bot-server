"use client";
import React, { useState, useEffect, useRef } from "react";
import { useApp } from "../../context/AppContext";
import LionMascot from "../ui/LionMascot";
import { motion, AnimatePresence } from "framer-motion";
import { Coins, Play, Trophy, AlertTriangle } from "lucide-react";
import { casinoSounds, playTone } from "../../lib/audio/casinoSounds";
import { type F1Circuit, pickRandomCircuit } from "../../data/f1Circuits";
import { type F1Incident, resolveIncident } from "../../data/f1Incidents";

interface Car {
  id: number;
  name: string;
  color: string;
  angle: number;
  speed: number;
  multiplier: number;
  skiddingFrames: number;
  laps: number;
  finished: boolean;
  finishTime?: number;
  retired: boolean; // true when eliminated by incident
}

const CARS_CONFIG = [
  { id: 1, name: "C8L Racing Gold",  color: "#D4AF37", speed: 0.024 },
  { id: 2, name: "Ferrari Team Red", color: "#EF4444", speed: 0.023 },
  { id: 3, name: "Cyber Mercedes",   color: "#10B981", speed: 0.022 },
  { id: 4, name: "Red Bull Hype",    color: "#3B82F6", speed: 0.025 },
  { id: 5, name: "Aston Neon",       color: "#84CC16", speed: 0.021 },
  { id: 6, name: "Alpine Alpine",    color: "#EC4899", speed: 0.020 },
];

// ─── Helper: build a closed track path for urban/technical layouts ──────────
type TrackWaypoints = { cx: number; cy: number; rx: number; ry: number };

interface SkidMark {
  x: number;
  y: number;
  heading: number;
  opacity: number;
}

export default function FormulaGame() {
  const { language, c8lCoins, placeCasinoBet, awardCasinoWin, showNotification, user } = useApp();

  const [betAmount, setBetAmount]       = useState<number>(50);
  const [selectedCarId, setSelectedCarId] = useState<number>(1);
  const [cars, setCars]                 = useState<Car[]>([]);
  const [isRacing, setIsRacing]         = useState(false);
  const [raceFinished, setRaceFinished] = useState(false);
  const [winner, setWinner]             = useState<Car | null>(null);
  const [winnings, setWinnings]         = useState<number | null>(null);
  const [logs, setLogs]                 = useState<string[]>([]);
  const [mascotState, setMascotState]   = useState<"idle" | "dance" | "win" | "sad">("idle");

  // ── Circuit & Incident state ──────────────────────────────────────────────
  const [activeCircuit, setActiveCircuit]   = useState<F1Circuit | null>(null);
  const [activeIncident, setActiveIncident] = useState<F1Incident | null>(null);
  const [safetyCar, setSafetyCar]           = useState(false);
  const [retiredCarId, setRetiredCarId]     = useState<number | null>(null);
  const [incidentVisible, setIncidentVisible] = useState(false);

  const canvasRef            = useRef<HTMLCanvasElement>(null);
  const raceRef              = useRef<boolean>(false);
  const animationFrameIdRef  = useRef<number | null>(null);
  const carsStateRef         = useRef<Car[]>([]);
  const safetyCarFramesRef   = useRef<number>(0);
  const incidentFiredRef     = useRef<boolean>(false);
  const incidentTriggerRef   = useRef<number>(0); // frame index to fire incident
  const frameCountRef        = useRef<number>(0);
  const retiredCarIdRef      = useRef<number | null>(null);

  // ── Audio refs ────────────────────────────────────────────────────────────
  const engineOscRef   = useRef<OscillatorNode | null>(null);
  const engineGainRef  = useRef<GainNode | null>(null);
  const audioCtxRef    = useRef<AudioContext | null>(null);
  const lastGearRef    = useRef<number>(1);

  const skidMarksRef = useRef<SkidMark[]>([]);

  // ── AudioContext helper ───────────────────────────────────────────────────
  const getAudioContext = (): AudioContext | null => {
    if (typeof window === "undefined") return null;
    try {
      const Cls = window.AudioContext || (window as any).webkitAudioContext;
      if (!Cls) return null;
      if (!audioCtxRef.current) audioCtxRef.current = new Cls();
      if (audioCtxRef.current.state === "suspended") audioCtxRef.current.resume();
      return audioCtxRef.current;
    } catch (e) {
      return null;
    }
  };

  // ── Telemetry ─────────────────────────────────────────────────────────────
  const getEngineTelemetry = (car: Car) => {
    if (!car) return { gear: 1, rpm: 1000, speedKmh: 0 };
    const currentSpeed = car.speed * car.multiplier;
    const speedKmh = Math.floor(currentSpeed * 12000);
    let gear = 1, rpm = 1000;
    if      (speedKmh < 60)  { gear = 1; rpm = 1000 + (speedKmh / 60) * 8000; }
    else if (speedKmh < 110) { gear = 2; rpm = 4000 + ((speedKmh - 60) / 50) * 6000; }
    else if (speedKmh < 160) { gear = 3; rpm = 5000 + ((speedKmh - 110) / 50) * 5500; }
    else if (speedKmh < 210) { gear = 4; rpm = 6000 + ((speedKmh - 160) / 50) * 5000; }
    else if (speedKmh < 260) { gear = 5; rpm = 7000 + ((speedKmh - 210) / 50) * 4500; }
    else                     { gear = 6; rpm = 8000 + ((speedKmh - 260) / 60) * 4000; }
    if (car.skiddingFrames > 0) { rpm = 9500 + (Math.floor(Date.now() / 50) % 2 === 0 ? 1500 : 0); gear = Math.max(1, gear - 1); }
    return { gear, rpm: Math.floor(rpm), speedKmh };
  };

  // ── Engine Sound ─────────────────────────────────────────────────────────
  const startEngineSound = () => {
    try {
      const ctx = getAudioContext(); if (!ctx) return;
      stopEngineSound();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(100, ctx.currentTime);
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(500, ctx.currentTime);
      gain.gain.setValueAtTime(0.015, ctx.currentTime);
      osc.connect(filter); filter.connect(gain); gain.connect(ctx.destination);
      osc.start();
      engineOscRef.current = osc;
      engineGainRef.current = gain;
    } catch (e) { console.warn("Failed to start F1 engine sound:", e); }
  };

  const stopEngineSound = () => {
    if (engineOscRef.current) { try { engineOscRef.current.stop(); } catch (e) {} engineOscRef.current.disconnect(); engineOscRef.current = null; }
    if (engineGainRef.current) { engineGainRef.current.disconnect(); engineGainRef.current = null; }
  };

  // ── Shift Lights ─────────────────────────────────────────────────────────
  const renderShiftLights = (rpm: number) => {
    const total = 10;
    const lit   = Math.min(total, Math.floor((rpm / 12000) * total));
    return (
      <div className="flex justify-center gap-1.5 py-2 px-4 bg-black border-2 border-zinc-800 rounded-xl mb-2 shadow-[4px_4px_0px_#000000]">
        {Array.from({ length: total }).map((_, i) => {
          const isLit = i < lit;
          let cls = "bg-zinc-800";
          if (isLit) {
            if (i < 5) cls = "bg-emerald-500 shadow-[0_0_8px_#10B981]";
            else if (i < 8) cls = "bg-amber-500 shadow-[0_0_8px_#F59E0B]";
            else cls = "bg-rose-500 shadow-[0_0_8px_#EF4444] animate-pulse";
          }
          return <div key={i} className={`w-3 h-3 rounded-full transition-all duration-75 border border-black/50 ${cls}`} />;
        })}
      </div>
    );
  };

  // ── Standings ────────────────────────────────────────────────────────────
  const getCarStandings = () =>
    [...cars]
      .filter(c => !c.retired)
      .sort((a, b) => {
        const sA = a.laps * 2 * Math.PI + (a.angle + Math.PI / 2);
        const sB = b.laps * 2 * Math.PI + (b.angle + Math.PI / 2);
        return sB - sA;
      });

  // ── Odds ────────────────────────────────────────────────────────────────
  const getOdds = (carId: number) => {
    switch (carId) {
      case 4: return 2.2; case 1: return 2.8; case 2: return 3.5;
      case 3: return 4.0; case 5: return 5.5; case 6: return 7.0;
      default: return 3.0;
    }
  };

  // ── Track Dimensions helper ───────────────────────────────────────────────
  const getTrackDims = () => {
    const w = canvasRef.current?.width || 480;
    const h = canvasRef.current?.height || 300;
    return { w, h, cx: w / 2, cy: h / 2, rx: w * 0.4, ry: h * 0.35 };
  };

  // ─────────────────────────────────────────────────────────────────────────
  // CANVAS DRAW — 3 geometry renderers
  // ─────────────────────────────────────────────────────────────────────────
  const drawTrack = (circuit?: F1Circuit | null) => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d"); if (!ctx) return;
    const circ = circuit ?? activeCircuit;

    const { w, h, cx, cy } = getTrackDims();
    ctx.clearRect(0, 0, w, h);

    const geom = circ?.geometria ?? "oval";
    if (geom === "oval")      drawOval(ctx, w, h, cx, cy, circ);
    else if (geom === "urban") drawUrban(ctx, w, h, cx, cy, circ);
    else                       drawTechnical(ctx, w, h, cx, cy, circ);

    // Skid marks (shared)
    ctx.lineWidth = 2.5;
    skidMarksRef.current.forEach(mark => {
      ctx.save();
      ctx.translate(mark.x, mark.y);
      ctx.rotate(mark.heading);
      ctx.strokeStyle = `rgba(0,0,0,${mark.opacity * 0.35})`;
      ctx.beginPath(); ctx.moveTo(-5, -4); ctx.lineTo(5, -4);
      ctx.moveTo(-5, 4);  ctx.lineTo(5, 4);
      ctx.stroke(); ctx.restore();
    });
    skidMarksRef.current = skidMarksRef.current
      .map(m => ({ ...m, opacity: m.opacity - 0.008 }))
      .filter(m => m.opacity > 0);

    // Draw cars
    drawCars(ctx, circ);

    // Safety Car overlay (amber flashing tint)
    if (safetyCar) {
      ctx.save();
      ctx.fillStyle = `rgba(251,191,36,${0.04 + 0.03 * Math.sin(Date.now() / 150)})`;
      ctx.fillRect(0, 0, w, h);
      ctx.restore();
    }
  };

  // ── Oval ─────────────────────────────────────────────────────────────────
  const drawOval = (
    ctx: CanvasRenderingContext2D,
    w: number, h: number, cx: number, cy: number,
    circ: F1Circuit | null | undefined,
  ) => {
    const rx = w * 0.4, ry = h * 0.35;
    const trackC  = circ?.trackColor  ?? "#16161a";
    const innerC  = circ?.innerColor  ?? "#0A0A0C";
    const accentC = circ?.accentColor ?? "#00F3FF";

    // Asphalt
    ctx.beginPath(); ctx.ellipse(cx, cy, rx + 16, ry + 16, 0, 0, Math.PI * 2);
    ctx.fillStyle = trackC; ctx.fill();
    ctx.strokeStyle = "#2E2E38"; ctx.lineWidth = 3; ctx.stroke();
    // Infield
    ctx.beginPath(); ctx.ellipse(cx, cy, rx - 16, ry - 16, 0, 0, Math.PI * 2);
    ctx.fillStyle = innerC; ctx.fill();
    ctx.strokeStyle = "#2E2E38"; ctx.lineWidth = 3; ctx.stroke();
    // Lane line
    ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.strokeStyle = `${accentC}26`; ctx.setLineDash([8, 12]); ctx.lineWidth = 1.5; ctx.stroke();
    ctx.setLineDash([]);
    // Finish line
    drawFinishLine(ctx, cx, cy - ry - 16, cx, cy - ry + 16);
    // Climate overlay
    drawClimateOverlay(ctx, w, h, circ);
  };

  // ── Urban S-curve ────────────────────────────────────────────────────────
  const drawUrban = (
    ctx: CanvasRenderingContext2D,
    w: number, h: number, cx: number, cy: number,
    circ: F1Circuit | null | undefined,
  ) => {
    const trackC  = circ?.trackColor  ?? "#1a1610";
    const innerC  = circ?.innerColor  ?? "#0e0b06";
    const accentC = circ?.accentColor ?? "#D4AF37";
    const tw = 22; // track half-width

    // Build urban path (rectangle with rounded corners, slightly irregular)
    const mx = cx, my = cy;
    const pw = w * 0.76, ph = h * 0.70;
    const x0 = mx - pw / 2, x1 = mx + pw / 2;
    const y0 = my - ph / 2, y1 = my + ph / 2;
    const r = 38;

    const buildRect = (extra: number) => {
      ctx.beginPath();
      ctx.moveTo(x0 + r, y0 - extra);
      ctx.lineTo(x1 - r, y0 - extra);
      ctx.quadraticCurveTo(x1 + extra, y0 - extra, x1 + extra, y0 + r);
      ctx.lineTo(x1 + extra, y1 - r);
      ctx.quadraticCurveTo(x1 + extra, y1 + extra, x1 - r, y1 + extra);
      // Chicane bulge on the bottom straight
      ctx.lineTo(mx + 30, y1 + extra);
      ctx.quadraticCurveTo(mx, y1 + extra + 18, mx - 30, y1 + extra);
      ctx.lineTo(x0 + r, y1 + extra);
      ctx.quadraticCurveTo(x0 - extra, y1 + extra, x0 - extra, y1 - r);
      ctx.lineTo(x0 - extra, y0 + r);
      ctx.quadraticCurveTo(x0 - extra, y0 - extra, x0 + r, y0 - extra);
      ctx.closePath();
    };

    buildRect(tw); ctx.fillStyle = trackC; ctx.fill();
    buildRect(-tw); ctx.fillStyle = innerC; ctx.fill();

    // Lane dashes
    buildRect(0);
    ctx.strokeStyle = `${accentC}30`; ctx.setLineDash([10, 14]); ctx.lineWidth = 1.5; ctx.stroke();
    ctx.setLineDash([]);

    // Finish line on top straight
    drawFinishLine(ctx, mx, y0 - tw, mx, y0 + tw);
    drawClimateOverlay(ctx, w, h, circ);
  };

  // ── Technical (hairpin) ───────────────────────────────────────────────────
  const drawTechnical = (
    ctx: CanvasRenderingContext2D,
    w: number, h: number, cx: number, cy: number,
    circ: F1Circuit | null | undefined,
  ) => {
    const trackC  = circ?.trackColor  ?? "#10160e";
    const innerC  = circ?.innerColor  ?? "#080c06";
    const accentC = circ?.accentColor ?? "#84CC16";
    const tw = 20;

    // Outer track shape: like an upside-down keyhole (oval + hairpin at bottom)
    const rx = w * 0.34, ry = h * 0.28;
    const hairpinY = cy + ry + 18;

    const buildTech = (ext: number) => {
      ctx.beginPath();
      ctx.arc(cx, cy - 14, rx + ext, Math.PI, 0); // top semi-circle
      ctx.lineTo(cx + rx + ext, hairpinY);          // right straight
      ctx.arc(cx, hairpinY, rx + ext, 0, Math.PI); // bottom hairpin
      ctx.lineTo(cx - rx - ext, cy - 14);           // left straight
      ctx.closePath();
    };

    buildTech(tw); ctx.fillStyle = trackC; ctx.fill();
    buildTech(-tw); ctx.fillStyle = innerC; ctx.fill();

    buildTech(0);
    ctx.strokeStyle = `${accentC}28`; ctx.setLineDash([8, 12]); ctx.lineWidth = 1.5; ctx.stroke();
    ctx.setLineDash([]);

    // Hairpin marker
    ctx.beginPath();
    ctx.arc(cx, hairpinY, 5, 0, Math.PI * 2);
    ctx.fillStyle = accentC; ctx.fill();

    // Finish line on top straight
    drawFinishLine(ctx, cx, cy - 14 - rx - tw, cx, cy - 14 - rx + tw);
    drawClimateOverlay(ctx, w, h, circ);
  };

  // ── Climate overlays ─────────────────────────────────────────────────────
  const drawClimateOverlay = (
    ctx: CanvasRenderingContext2D,
    w: number, h: number,
    circ: F1Circuit | null | undefined,
  ) => {
    if (!circ) return;
    const t = Date.now();

    if (circ.clima === "Lluvia") {
      ctx.save();
      ctx.strokeStyle = "rgba(147,197,253,0.18)";
      ctx.lineWidth = 1;
      for (let i = 0; i < 24; i++) {
        const rx2 = ((t / 3 + i * 42) % w);
        const ry2 = ((t / 4 + i * 31) % h);
        ctx.beginPath();
        ctx.moveTo(rx2, ry2);
        ctx.lineTo(rx2 - 2, ry2 + 8);
        ctx.stroke();
      }
      ctx.restore();
    }

    if (circ.clima === "Nocturno") {
      ctx.save();
      ctx.fillStyle = "rgba(0,0,0,0.28)";
      ctx.fillRect(0, 0, w, h);
      // Neon headlight spots on track
      const gradient = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w * 0.3);
      gradient.addColorStop(0, "rgba(255,255,220,0.06)");
      gradient.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = gradient; ctx.fillRect(0, 0, w, h);
      ctx.restore();
    }

    if (circ.clima === "Neon") {
      ctx.save();
      const pulse = 0.04 + 0.02 * Math.sin(t / 300);
      ctx.strokeStyle = `rgba(${hexToRgb(circ.accentColor)},${pulse})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(w / 2, h / 2, w * 0.48, h * 0.44, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  };

  const hexToRgb = (hex: string): string => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `${r},${g},${b}`;
  };

  // ── Finish line ──────────────────────────────────────────────────────────
  const drawFinishLine = (
    ctx: CanvasRenderingContext2D,
    x1: number, y1: number, x2: number, y2: number,
  ) => {
    ctx.strokeStyle = "#FFFFFF"; ctx.lineWidth = 4; ctx.setLineDash([]);
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    ctx.strokeStyle = "#000000"; ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    ctx.setLineDash([]);
  };

  // ── Car position on each geometry ────────────────────────────────────────
  const getCarPosition = (car: Car, circ: F1Circuit | null | undefined) => {
    const { w, h, cx, cy } = getTrackDims();
    const geom = circ?.geometria ?? "oval";

    if (geom === "oval") {
      const rx = w * 0.4, ry = h * 0.35;
      const x = cx + rx * Math.cos(car.angle);
      const y = cy + ry * Math.sin(car.angle);
      const heading = Math.atan2(ry * Math.cos(car.angle), -rx * Math.sin(car.angle));
      return { x, y, heading };
    }

    if (geom === "urban") {
      return getPositionOnUrbanPath(car.angle, cx, cy, w, h);
    }

    // technical
    return getPositionOnTechnicalPath(car.angle, cx, cy, w, h);
  };

  // Urban path parametric (t in [0, 2π])
  const getPositionOnUrbanPath = (angle: number, cx: number, cy: number, w: number, h: number) => {
    const pw = w * 0.76, ph = h * 0.70;
    const x0 = cx - pw / 2, x1 = cx + pw / 2;
    const y0 = cy - ph / 2, y1 = cy + ph / 2;
    const r = 38;

    // Perimeter: top, right, bottom (with chicane), left — normalised to [0,1]
    const perim = 2 * (pw - 2 * r) + 2 * (ph - 2 * r) + 2 * Math.PI * r + 60;
    const t = ((angle + Math.PI / 2) / (2 * Math.PI) + 1) % 1;
    const dist = t * perim;

    const seg1 = pw - 2 * r; // top straight
    const arc1 = Math.PI / 2 * r;
    const seg2 = ph - 2 * r; // right straight
    const arc2 = Math.PI / 2 * r;
    const seg3 = pw - 2 * r; // bottom straight
    const arc3 = Math.PI / 2 * r;
    const seg4 = ph - 2 * r; // left straight

    let x = 0, y = 0, heading = 0;

    if (dist < seg1) {
      x = x0 + r + dist; y = y0; heading = 0;
    } else if (dist < seg1 + arc1) {
      const a = (dist - seg1) / r - Math.PI / 2;
      x = x1 - r + r * Math.cos(a); y = y0 + r + r * Math.sin(a); heading = a + Math.PI / 2;
    } else if (dist < seg1 + arc1 + seg2) {
      x = x1; y = y0 + r + (dist - seg1 - arc1); heading = Math.PI / 2;
    } else if (dist < seg1 + arc1 + seg2 + arc2) {
      const a = (dist - seg1 - arc1 - seg2) / r;
      x = x1 - r + r * Math.cos(a); y = y1 - r + r * Math.sin(a); heading = a + Math.PI / 2;
    } else if (dist < seg1 + arc1 + seg2 + arc2 + seg3) {
      x = x1 - r - (dist - seg1 - arc1 - seg2 - arc2); y = y1; heading = Math.PI;
    } else if (dist < seg1 + arc1 + seg2 + arc2 + seg3 + arc3) {
      const a = Math.PI + (dist - seg1 - arc1 - seg2 - arc2 - seg3) / r;
      x = x0 + r + r * Math.cos(a); y = y1 - r + r * Math.sin(a); heading = a + Math.PI / 2;
    } else {
      x = x0; y = y1 - r - (dist - seg1 - arc1 - seg2 - arc2 - seg3 - arc3); heading = -Math.PI / 2;
    }

    return { x, y, heading };
  };

  // Technical path parametric
  const getPositionOnTechnicalPath = (angle: number, cx: number, cy: number, w: number, h: number) => {
    const rx = w * 0.34, ry = h * 0.28;
    const hairpinY = cy + ry + 18;
    const topCy = cy - 14;

    const t = ((angle + Math.PI / 2) / (2 * Math.PI) + 1) % 1;
    const topArcLen = Math.PI * rx;
    const rightLen  = hairpinY - topCy;
    const bottomArcLen = Math.PI * rx;
    const leftLen   = hairpinY - topCy;
    const perim = topArcLen + rightLen + bottomArcLen + leftLen;
    const dist  = t * perim;

    let x = 0, y = 0, heading = 0;

    if (dist < topArcLen) {
      const a = Math.PI + (dist / rx);
      x = cx + rx * Math.cos(a); y = topCy + rx * 0 + ry * Math.sin(a - Math.PI) * 0; // semi-circle top
      x = cx + rx * Math.cos(a); y = topCy + Math.abs(ry * 0.6) * Math.sin(a - Math.PI);
      heading = a + Math.PI / 2;
    } else if (dist < topArcLen + rightLen) {
      x = cx + rx; y = topCy + (dist - topArcLen); heading = Math.PI / 2;
    } else if (dist < topArcLen + rightLen + bottomArcLen) {
      const a = (dist - topArcLen - rightLen) / rx;
      x = cx + rx * Math.cos(a); y = hairpinY + rx * 0.3 * Math.sin(a); heading = a + Math.PI / 2;
    } else {
      x = cx - rx; y = hairpinY - (dist - topArcLen - rightLen - bottomArcLen); heading = -Math.PI / 2;
    }

    return { x, y, heading };
  };

  // ── Draw Cars ─────────────────────────────────────────────────────────────
  const drawCars = (ctx: CanvasRenderingContext2D, circ: F1Circuit | null | undefined) => {
    const currentCars = carsStateRef.current;
    currentCars.forEach(car => {
      if (car.retired) return;
      const { x, y, heading } = getCarPosition(car, circ);

      if (car.skiddingFrames > 0) {
        skidMarksRef.current.push({ x, y, heading, opacity: 1.0 });
      }

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(heading);

      // Exhaust particles
      if (isRacing && !car.finished) {
        ctx.beginPath();
        ctx.arc(-16, (Math.random() - 0.5) * 4, 3 + Math.random() * 3, 0, Math.PI * 2);
        ctx.fillStyle = Math.random() > 0.4 ? "#FF0055" : "#00F3FF";
        ctx.fill();
      }

      // Skid smoke
      if (car.skiddingFrames > 0) {
        ctx.beginPath();
        ctx.arc(-18, -4, 5 + Math.random() * 4, 0, Math.PI * 2);
        ctx.arc(-18, 4, 5 + Math.random() * 4, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(220,220,220,0.4)"; ctx.fill();
        ctx.fillStyle = "#FF69B4";
        ctx.fillRect(-15 + (Math.random() - 0.5) * 8, -6, 2, 2);
        ctx.fillRect(-15 + (Math.random() - 0.5) * 8, 4, 2, 2);
      }

      // Car body
      ctx.lineWidth = 1.5; ctx.strokeStyle = "#000000";
      ctx.fillStyle = car.color;
      ctx.fillRect(-12, -4, 24, 8); ctx.strokeRect(-12, -4, 24, 8);
      // Nose
      ctx.beginPath(); ctx.moveTo(12, -2.5); ctx.lineTo(19, 0); ctx.lineTo(12, 2.5);
      ctx.closePath(); ctx.fillStyle = car.color; ctx.fill(); ctx.stroke();
      // Front wing
      ctx.fillStyle = "#121214"; ctx.fillRect(16, -8, 3, 16); ctx.strokeRect(16, -8, 3, 16);
      // Rear wing
      ctx.fillStyle = "#121214"; ctx.fillRect(-15, -6, 3, 12); ctx.strokeRect(-15, -6, 3, 12);
      // Side pods
      ctx.fillStyle = car.color;
      ctx.fillRect(-4, -6, 11, 2); ctx.strokeRect(-4, -6, 11, 2);
      ctx.fillRect(-4, 4, 11, 2);  ctx.strokeRect(-4, 4, 11, 2);
      // Wheels
      ctx.fillStyle = "#09090b";
      ctx.fillRect(7, -8.5, 5.5, 3.5); ctx.strokeRect(7, -8.5, 5.5, 3.5);
      ctx.fillRect(7, 5, 5.5, 3.5);    ctx.strokeRect(7, 5, 5.5, 3.5);
      ctx.fillRect(-11, -9.5, 6.5, 4.5); ctx.strokeRect(-11, -9.5, 6.5, 4.5);
      ctx.fillRect(-11, 5, 6.5, 4.5);    ctx.strokeRect(-11, 5, 6.5, 4.5);
      // Helmet
      ctx.beginPath(); ctx.arc(0, 0, 3, 0, Math.PI * 2);
      ctx.fillStyle = "#FFFFFF"; ctx.fill(); ctx.stroke();
      ctx.fillStyle = "#121214"; ctx.fillRect(1, -1.5, 2, 3);

      ctx.restore();
    });
  };

  // ─────────────────────────────────────────────────────────────────────────
  // RACE INIT
  // ─────────────────────────────────────────────────────────────────────────
  const initializeRace = () => {
    const initialized = CARS_CONFIG.map(c => ({
      ...c,
      angle: -Math.PI / 2 - c.id * 0.05,
      multiplier: 1.0,
      skiddingFrames: 0,
      laps: 0,
      finished: false,
      retired: false,
    })) as Car[];

    setCars(initialized);
    carsStateRef.current = initialized;
    skidMarksRef.current = [];
    setWinner(null);
    setRaceFinished(false);
    setWinnings(null);
    setActiveCircuit(null);
    setActiveIncident(null);
    setSafetyCar(false);
    setRetiredCarId(null);
    setIncidentVisible(false);
    retiredCarIdRef.current = null;
    safetyCarFramesRef.current = 0;
    incidentFiredRef.current = false;
    frameCountRef.current = 0;
    setLogs([language === "es" ? "🏁 Coches en la parrilla de salida." : "🏁 Cars aligned on grid."]);
    setMascotState("idle");

    setTimeout(() => drawTrack(null), 100);
  };

  useEffect(() => {
    initializeRace();
    return () => {
      if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current);
      stopEngineSound();
      audioCtxRef.current?.close().catch(() => {});
    };
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // START RACE
  // ─────────────────────────────────────────────────────────────────────────
  const handleStartRace = async () => {
    if (isRacing) return;
    if (c8lCoins < betAmount) {
      showNotification(
        language === "es" ? "Monedas C8L insuficientes para apostar en la F1." : "Insufficient C8L Coins to bet on F1.",
        "error",
      );
      return;
    }

    const success = await placeCasinoBet(betAmount);
    if (!success) return;

    // ── Pick circuit & incident ───────────────────────────────────────────
    const circuit  = pickRandomCircuit();
    const incident = resolveIncident();

    setActiveCircuit(circuit);
    setActiveIncident(incident);
    setIsRacing(true);
    raceRef.current = true;
    setMascotState("sad");
    setLogs([
      language === "es"
        ? `🏟️ Circuito: ${circuit.nombre} | ${circuit.ambientLabel} | Dif: ${circuit.dificultad}`
        : `🏟️ Circuit: ${circuit.nombre} | ${circuit.ambientLabel} | Diff: ${circuit.dificultad}`,
      language === "es" ? "🟢 Semáforo en VERDE: ¡ARRANCA LA CARRERA!" : "🟢 GREEN LIGHT: THE RACE IS ON!",
    ]);
    casinoSounds.playSlotSpin(2.0);
    lastGearRef.current = 1;
    skidMarksRef.current = [];
    incidentFiredRef.current = false;
    safetyCarFramesRef.current = 0;
    frameCountRef.current = 0;

    // Schedule incident trigger at a random frame between 30% and 70% of expected race duration
    const expectedFrames = Math.round((circuit.laps * 2 * Math.PI) / (0.023 * circuit.speedMod) / 1) | 400;
    incidentTriggerRef.current = Math.floor(expectedFrames * (0.3 + Math.random() * 0.4));

    startEngineSound();

    // Reset cars with circuit speed modifier
    const initialized = CARS_CONFIG.map(c => ({
      ...c,
      speed: c.speed * circuit.speedMod,
      angle: -Math.PI / 2 - c.id * 0.05,
      multiplier: 1.0,
      skiddingFrames: 0,
      laps: 0,
      finished: false,
      retired: false,
    })) as Car[];
    carsStateRef.current = initialized;
    setCars(initialized);

    const winningCars: Car[] = [];
    const startTimestamp = Date.now();
    let safetyCarActive = false;
    let retiredId: number | null = null;

    const loop = async () => {
      if (!raceRef.current) return;

      frameCountRef.current++;
      const frame = frameCountRef.current;

      // ── Fire incident at trigger frame ─────────────────────────────────
      if (!incidentFiredRef.current && incident.tipo !== "LIMPIO" && frame >= incidentTriggerRef.current) {
        incidentFiredRef.current = true;

        // Pick a random car to affect (not the selected one if possible)
        const eligibleCars = carsStateRef.current.filter(c => !c.finished && !c.retired);
        const victim = eligibleCars.length > 0
          ? eligibleCars[Math.floor(Math.random() * eligibleCars.length)]
          : null;

        if (victim && incident.eliminaAfectado) {
          retiredId = victim.id;
          retiredCarIdRef.current = victim.id;
          setRetiredCarId(victim.id);
          carsStateRef.current = carsStateRef.current.map(c =>
            c.id === victim.id ? { ...c, retired: true, finished: true } : c,
          );
        }

        if (incident.requiereSafetyCar) {
          safetyCarActive = true;
          safetyCarFramesRef.current = incident.durationFrames;
          setSafetyCar(true);
        }

        const desc = language === "es" ? incident.descripcion.es : incident.descripcion.en;
        const victimName = victim ? victim.name : "";
        setLogs(prev => [
          ...prev,
          `${desc}${victimName ? ` (${victimName})` : ""}`,
        ].slice(-8));
        setIncidentVisible(true);
        setTimeout(() => setIncidentVisible(false), 4500);

        playTone(90, "sawtooth", 0.15, 0, 0.6);
      }

      // ── Safety Car countdown ───────────────────────────────────────────
      if (safetyCarActive && safetyCarFramesRef.current > 0) {
        safetyCarFramesRef.current--;
        if (safetyCarFramesRef.current === 0) {
          safetyCarActive = false;
          setSafetyCar(false);
          setLogs(prev => [...prev, language === "es"
            ? "🟢 Safety Car entrando a boxes — ¡Carrera reanudada!"
            : "🟢 Safety Car in — Race resumed!"].slice(-8));
        }
      }

      const safetyMod = safetyCarActive ? incident.speedPenalty : 1.0;

      let allFinished = true;
      const updated = carsStateRef.current.map(car => {
        if (car.finished || car.retired) return car;
        allFinished = false;

        const { x, y, heading } = getCarPosition(car, circuit);

        // Skid logic — uses circuit's skidChance
        let multiplier = car.multiplier;
        let skiddingFrames = car.skiddingFrames;

        if (skiddingFrames > 0) {
          skiddingFrames--;
          skidMarksRef.current.push({ x, y, heading, opacity: 1.0 });
          if (skiddingFrames === 0) {
            multiplier = 1.0;
            setLogs(prev => [...prev, `${car.name} ${language === "es" ? "se recupera" : "recovers"}`].slice(-8));
          }
        } else if (Math.random() < circuit.skidChance) {
          skiddingFrames = 45;
          multiplier = 0.25;
          setMascotState("sad");
          setLogs(prev => [...prev, `🚨 ${car.name} ${language === "es" ? "¡DERRAPAZO!" : "SKID!"}`].slice(-8));
          skidMarksRef.current.push({ x, y, heading, opacity: 1.0 });
        }

        const speedStep = car.speed * multiplier * safetyMod;
        const newAngle = car.angle + speedStep;

        const lapAngle = newAngle + Math.PI / 2;
        const targetLap = Math.floor(lapAngle / (Math.PI * 2));
        let laps = car.laps;
        if (targetLap > car.laps) {
          laps = targetLap;
          if (laps < circuit.laps) {
            setLogs(prev => [...prev, `🏁 ${car.name}: ${language === "es" ? "Vuelta" : "Lap"} ${laps} / ${circuit.laps}`].slice(-8));
          }
        }

        const finished = laps >= circuit.laps;
        if (finished) {
          const time = Date.now() - startTimestamp;
          const done = { ...car, angle: -Math.PI / 2, laps: circuit.laps, finished: true, finishTime: time };
          winningCars.push(done);
          return done;
        }

        return { ...car, angle: newAngle, multiplier, skiddingFrames, laps };
      });

      carsStateRef.current = updated;
      setCars(updated);
      drawTrack(circuit);

      // Engine pitch update
      const selectedCar = updated.find(c => c.id === selectedCarId);
      if (selectedCar && engineOscRef.current && audioCtxRef.current) {
        const tel = getEngineTelemetry(selectedCar);
        const targetFreq = 100 + ((tel.rpm - 1000) / 11000) * 380;
        const now = audioCtxRef.current.currentTime;
        engineOscRef.current.frequency.setTargetAtTime(targetFreq, now, 0.05);
        if (engineGainRef.current) {
          const vol = safetyCarActive ? 0.008 : 0.012 + (tel.rpm / 12000) * 0.018;
          engineGainRef.current.gain.setTargetAtTime(vol, now, 0.05);
        }
        if (tel.gear !== lastGearRef.current) {
          const prev = lastGearRef.current;
          lastGearRef.current = tel.gear;
          if (tel.gear > prev) playTone(160, "triangle", 0.06, 0, 0.04);
        }
      }

      // ── Race end ────────────────────────────────────────────────────────
      if (allFinished) {
        raceRef.current = false;
        setIsRacing(false);
        setRaceFinished(true);
        setSafetyCar(false);
        stopEngineSound();

        // Filter out retired cars from eligible winners
        const eligible = [...winningCars].filter(c => !c.retired && c.id !== retiredCarIdRef.current);
        const sorted   = eligible.sort((a, b) => (a.finishTime ?? 999999) - (b.finishTime ?? 999999));
        const winCar   = sorted[0] ?? winningCars[0];
        setWinner(winCar);

        const won  = winCar.id === selectedCarId && !winCar.retired;
        const odds = getOdds(winCar.id);

        if (won) {
          const payout = Math.floor(betAmount * odds);
          await awardCasinoWin(payout);
          setWinnings(payout);
          setMascotState("win");
          casinoSounds.playWin();
          window.dispatchEvent(new Event("c8l-screen-shake"));
          showNotification(
            language === "es"
              ? `🏆 ¡Victoria! ${winCar.name} ganó en ${circuit.nombre}. +${payout} Coins`
              : `🏆 Victory! ${winCar.name} won at ${circuit.nombre}. +${payout} Coins`,
            "success",
          );
        } else {
          setWinnings(0);
          setMascotState("sad");
          showNotification(
            language === "es"
              ? `Derrota. Ganador: ${winCar.name} (${circuit.nombre}).`
              : `Loss. Winner: ${winCar.name} at ${circuit.nombre}.`,
            "error",
          );
        }

        import("../../utils/analytics").then(({ logActivity }) => {
          if (user) {
            logActivity(
              user.uid,
              user.email || "",
              user.displayName || "Streamer",
              "casino_f1",
              `Apostó ${betAmount} al Coche F1 "${CARS_CONFIG.find(c => c.id === selectedCarId)?.name}" en ${circuit.nombre}. Incidente: ${incident.tipo}. Ganador: ${winCar.name} (x${odds}). ${won ? `Ganó ${Math.floor(betAmount * odds)}` : "Perdió"}`,
            );
          }
        }).catch(() => {});
        return;
      }

      if (raceRef.current) {
        animationFrameIdRef.current = requestAnimationFrame(loop);
      }
    };

    animationFrameIdRef.current = requestAnimationFrame(loop);
  };

  // ── Derived state ─────────────────────────────────────────────────────────
  const selectedCar = cars.find(c => c.id === selectedCarId);
  const telemetry   = selectedCar ? getEngineTelemetry(selectedCar) : { gear: 1, rpm: 1000, speedKmh: 0 };

  const getTeamStats = (id: number) => {
    switch (id) {
      case 1: return { speed: "★★★★☆", weight: "740kg", stability: language === "es" ? "Alta" : "High" };
      case 2: return { speed: "★★★★☆", weight: "745kg", stability: language === "es" ? "Media" : "Medium" };
      case 3: return { speed: "★★★★☆", weight: "746kg", stability: language === "es" ? "Alta" : "High" };
      case 4: return { speed: "★★★★★", weight: "738kg", stability: language === "es" ? "Media" : "Medium" };
      case 5: return { speed: "★★★☆☆", weight: "750kg", stability: language === "es" ? "Alta" : "High" };
      case 6: return { speed: "★★★☆☆", weight: "752kg", stability: language === "es" ? "Media" : "Medium" };
      default: return { speed: "★★★☆☆", weight: "745kg", stability: "Medium" };
    }
  };

  // ── Incident type colour ──────────────────────────────────────────────────
  const incidentBannerColor = (tipo: string) => {
    switch (tipo) {
      case "ACCIDENTE":  return { bg: "#3B0008", border: "#FF0055", text: "#FF0055" };
      case "AVERÍA":     return { bg: "#2D1A00", border: "#F59E0B", text: "#FCD34D" };
      case "PINCHAZO":  return { bg: "#3B0008", border: "#EF4444", text: "#FCA5A5" };
      case "SAFETY_CAR": return { bg: "#1F1700", border: "#FBBF24", text: "#FDE68A" };
      default:           return { bg: "#001A0E", border: "#10B981", text: "#6EE7B7" };
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch max-w-5xl mx-auto">

      {/* ── LEFT — Canvas + Telemetry ─────────────────────────────────── */}
      <div className="lg:col-span-7 flex flex-col gap-4">

        {renderShiftLights(telemetry.rpm)}

        <div className="border-[3px] border-black bg-black rounded-3xl p-5 relative shadow-[6px_6px_0px_#00F3FF] flex flex-col gap-4 font-mono overflow-hidden c8l-scanlines">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,_rgba(0,243,255,0.02)_50%)] bg-[size:100%_4px] pointer-events-none" />

          {/* Telemetry header */}
          <div className="flex justify-between items-center text-[10px] text-zinc-400 uppercase tracking-widest border-b border-white/10 pb-2 z-10 font-bold">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#00F3FF] animate-pulse shadow-[0_0_6px_#00F3FF]" />
              🏎️ Live Telemetry Feed
            </span>
            <span className="text-zinc-500 truncate max-w-[180px]">
              {activeCircuit
                ? `${activeCircuit.ambientLabel} · ${activeCircuit.nombre} · ${activeCircuit.laps}L`
                : "Track: Select & Start"}
            </span>
          </div>

          {/* Canvas */}
          <div className="relative z-10">
            <canvas
              ref={canvasRef}
              width={480}
              height={300}
              className="w-full block bg-[#050507] rounded-xl border border-white/5 aspect-[480/300]"
            />

            {/* Incident Banner overlay */}
            <AnimatePresence>
              {incidentVisible && activeIncident && (
                <motion.div
                  key="incident-banner"
                  initial={{ opacity: 0, y: -20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.97 }}
                  transition={{ type: "spring", stiffness: 300, damping: 22 }}
                  className="absolute top-3 left-3 right-3 z-20 rounded-xl border-2 p-3 font-mono text-[11px] font-bold uppercase tracking-wide shadow-lg"
                  style={{
                    backgroundColor: incidentBannerColor(activeIncident.tipo).bg,
                    borderColor:     incidentBannerColor(activeIncident.tipo).border,
                    color:           incidentBannerColor(activeIncident.tipo).text,
                  }}
                >
                  <div className="flex items-center gap-2">
                    <span className="animate-pulse">⚡</span>
                    <span className="truncate">
                      {language === "es" ? activeIncident.descripcion.es : activeIncident.descripcion.en}
                    </span>
                  </div>
                  {activeIncident.requiereSafetyCar && (
                    <div className="mt-1 text-[9px] text-amber-400 font-black tracking-widest animate-pulse">
                      🚗 SAFETY CAR DEPLOYED
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Safety Car bar */}
            <AnimatePresence>
              {safetyCar && (
                <motion.div
                  key="sc-bar"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute bottom-2 left-2 right-2 z-20 rounded-lg border border-amber-500/50 bg-amber-950/80 px-3 py-1.5 flex items-center gap-2 font-mono text-[10px] text-amber-300 font-bold uppercase tracking-widest"
                >
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  Safety Car — Velocidades Neutralizadas
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* HUD Telemetry row */}
          <div className="grid grid-cols-3 gap-3 bg-zinc-950/90 border-3 border-black rounded-xl p-3.5 relative z-10 shadow-[4px_4px_0px_rgba(0,243,255,0.25)]">
            <div className="flex flex-col gap-0.5 justify-center pl-2">
              <span className="text-[9px] uppercase tracking-wider text-zinc-500 font-bold">Velocity</span>
              <div className="flex items-baseline gap-1 text-[#00F3FF] text-glow-neon font-black font-heading text-xl">
                <span>{safetyCar ? Math.floor(telemetry.speedKmh * 0.38) : telemetry.speedKmh}</span>
                <span className="text-[9px] text-zinc-500">KM/H</span>
              </div>
            </div>
            <div className="flex flex-col gap-0.5 items-center justify-center border-x border-zinc-850">
              <span className="text-[9px] uppercase tracking-wider text-zinc-500 font-bold">Gear Box</span>
              {selectedCar?.skiddingFrames && selectedCar.skiddingFrames > 0 ? (
                <div className="px-2.5 py-0.5 bg-rose-950/80 border border-rose-500/50 rounded text-rose-500 text-[10px] font-black animate-pulse uppercase tracking-wider">Skid</div>
              ) : safetyCar ? (
                <div className="px-2.5 py-0.5 bg-amber-950/80 border border-amber-500/50 rounded text-amber-400 text-[10px] font-black animate-pulse uppercase tracking-wider">SC</div>
              ) : (
                <div className="flex items-center justify-center font-heading font-black text-xl text-white bg-zinc-800 border-2 border-black rounded px-3 shadow-[2px_2px_0px_#000000]">
                  G{telemetry.gear}
                </div>
              )}
            </div>
            <div className="flex flex-col gap-0.5 justify-center items-end pr-2">
              <span className="text-[9px] uppercase tracking-wider text-zinc-500 font-bold">Engine RPM</span>
              <div className="flex items-baseline gap-0.5 font-bold font-mono text-sm text-zinc-300">
                <span className={telemetry.rpm > 9500 && !safetyCar ? "text-rose-500 animate-pulse font-black" : ""}>{telemetry.rpm}</span>
                <span className="text-[8px] text-zinc-600 font-normal">/ 12K</span>
              </div>
            </div>
          </div>

          {/* Race Logs */}
          <div className="bg-[#050506] border-3 border-black rounded-xl p-3 h-[75px] overflow-y-auto font-mono text-[9px] text-zinc-500 flex flex-col gap-1 text-left no-scrollbar relative z-10 shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)]">
            {logs.map((log, i) => (
              <p key={i} className={i === logs.length - 1 ? "text-[var(--color-gold)] font-bold" : ""}>
                ▶ {log}
              </p>
            ))}
          </div>
        </div>

        {/* Live Standings */}
        {isRacing && (
          <div className="border-[3px] border-black bg-[#0d0d0e]/95 p-4 rounded-2xl shadow-[4px_4px_0px_#00F3FF] flex flex-col gap-2 text-left font-mono">
            <h4 className="text-[10px] text-zinc-400 font-black uppercase tracking-wider border-b border-zinc-800 pb-1.5 mb-1 flex justify-between">
              <span>📊 Race Standings Tower</span>
              <span className="text-[#00F3FF] animate-pulse">Live</span>
            </h4>
            <div className="grid grid-cols-2 gap-2 text-[10px]">
              {getCarStandings().map((car, idx) => (
                <div key={car.id} className="flex items-center gap-2 bg-black/60 border border-zinc-800/60 p-1.5 rounded-lg justify-between">
                  <div className="flex items-center gap-1.5 truncate max-w-[130px]">
                    <span className="text-zinc-500 font-bold">P{idx + 1}</span>
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: car.color }} />
                    <span className="text-zinc-300 font-bold truncate">{car.name}</span>
                  </div>
                  <div className="flex items-center gap-1 font-bold">
                    <span className="text-zinc-500">L{car.laps}/{activeCircuit?.laps ?? 3}</span>
                    {car.skiddingFrames > 0 && <span className="text-rose-500 text-[8px] animate-pulse font-black">⚡ SKID</span>}
                  </div>
                </div>
              ))}
              {/* Show retired cars */}
              {cars.filter(c => c.retired).map(car => (
                <div key={`ret-${car.id}`} className="flex items-center gap-2 bg-rose-950/30 border border-rose-900/60 p-1.5 rounded-lg justify-between opacity-60">
                  <div className="flex items-center gap-1.5 truncate max-w-[130px]">
                    <span className="text-rose-700 font-bold">DNF</span>
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: car.color }} />
                    <span className="text-rose-700 font-bold truncate line-through">{car.name}</span>
                  </div>
                  <span className="text-rose-700 text-[8px] font-black">OUT</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── RIGHT — Bets Console ─────────────────────────────────────────── */}
      <div className="lg:col-span-5 border-[3px] border-black bg-[#0d0d0e]/95 p-6 rounded-3xl shadow-[6px_6px_0px_#D4AF37] flex flex-col justify-between h-full text-left c8l-scanlines relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,_rgba(212,175,55,0.02)_50%)] bg-[size:100%_4px] pointer-events-none" />

        <div className="flex flex-col gap-6 relative z-10">
          <div className="border-b border-white/10 pb-4 mb-2 flex justify-between items-center">
            <div>
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block">18 Circuits · Incident Engine v2</span>
              <h3 className="font-heading font-black text-2xl text-[var(--color-gold)] text-glow-gold uppercase tracking-wider">
                Micro Racing F1
              </h3>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black border-[3px] border-black text-xs font-mono text-[#D4AF37] shadow-[3px_3px_0px_#D4AF37] text-glow-gold font-bold">
              <Coins size={14} />
              <span>{c8lCoins} Coins</span>
            </div>
          </div>

          {/* Mascot */}
          <div className="flex justify-center h-[120px] items-end">
            <LionMascot state={mascotState} size={110} />
          </div>

          {/* Pre-race controls */}
          {!isRacing && !raceFinished && (
            <div className="flex flex-col gap-4">
              {/* Bet Amount */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                  {language === "es" ? "Monedas a Apostar" : "Coins to Bet"}
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[10, 50, 100, 200].map(amt => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setBetAmount(amt)}
                      className={`py-2 rounded-xl text-xs font-mono font-bold transition-all border-2 border-black cursor-pointer ${
                        betAmount === amt
                          ? "bg-[var(--color-gold)] text-black shadow-[3px_3px_0px_#000000]"
                          : "bg-white/5 border-zinc-800 text-zinc-400 hover:text-white"
                      }`}
                    >
                      {amt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Car Selector */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                  {language === "es" ? "Elige tu Escudería" : "Select Your F1 Team"}
                </label>
                <select
                  value={selectedCarId}
                  onChange={e => setSelectedCarId(Number(e.target.value))}
                  className="w-full p-3.5 bg-black border-2 border-black rounded-xl text-white outline-none focus:border-[var(--color-gold)] transition text-xs cursor-pointer shadow-[3px_3px_0px_#000000]"
                >
                  {CARS_CONFIG.map(car => (
                    <option key={car.id} value={car.id} className="bg-black text-white">
                      {car.name} (x{getOdds(car.id)} cuota)
                    </option>
                  ))}
                </select>
              </div>

              {/* Team Stats */}
              <div className="bg-black/60 border-2 border-zinc-850 rounded-xl p-3 flex flex-col gap-2 text-[10px] font-mono">
                <div className="flex justify-between items-center">
                  <span className="text-zinc-500 font-bold uppercase tracking-wider">Team Specs</span>
                  <span className="px-2 py-0.5 bg-[var(--color-gold)]/10 text-[var(--color-gold)] rounded font-bold">
                    ODDS x{getOdds(selectedCarId)}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center mt-1">
                  {[
                    { label: "Speed", value: getTeamStats(selectedCarId).speed },
                    { label: "Weight", value: getTeamStats(selectedCarId).weight },
                    { label: "Stability", value: getTeamStats(selectedCarId).stability },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-zinc-950 p-1.5 rounded border border-zinc-900">
                      <span className="text-[8px] text-zinc-500 block uppercase">{label}</span>
                      <strong className="text-[var(--color-gold)] block mt-0.5">{value}</strong>
                    </div>
                  ))}
                </div>
              </div>

              {/* Circuit Surprise badge */}
              <div className="flex items-center gap-2 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-[10px] font-mono text-zinc-500">
                <span className="text-lg">🎲</span>
                <span>
                  {language === "es"
                    ? "El circuito se sorteará al iniciar — 18 pistas disponibles"
                    : "Circuit revealed on start — 18 tracks available"}
                </span>
              </div>
            </div>
          )}

          {/* Active race status */}
          {isRacing && activeCircuit && (
            <div className="p-4 rounded-2xl bg-zinc-950 border-2 border-black text-center font-mono shadow-[4px_4px_0px_#000000] flex flex-col gap-2">
              <span className="text-[10px] text-[#D4AF37] text-glow-gold uppercase tracking-widest block animate-pulse">
                🚥 Gran Premio en marcha ({activeCircuit.laps} Vueltas)
              </span>
              <div
                className="text-[11px] font-bold px-2 py-1 rounded-lg border"
                style={{ color: activeCircuit.accentColor, borderColor: `${activeCircuit.accentColor}44`, backgroundColor: `${activeCircuit.accentColor}0f` }}
              >
                {activeCircuit.ambientLabel} {activeCircuit.nombre} · {activeCircuit.dificultad}
              </div>
              <strong className="text-sm text-white block">APOSTADO: {betAmount} Coins</strong>
            </div>
          )}

          {/* Winner panel */}
          {raceFinished && winner && activeCircuit && (
            <div className="p-4 rounded-2xl bg-zinc-950 border-2 border-black text-center shadow-[4px_4px_0px_#000000] flex flex-col gap-2">
              <span className="text-[9px] text-zinc-500 uppercase tracking-widest block">
                {activeCircuit.nombre} — Primer Puesto
              </span>
              <strong className="text-base text-emerald-400 text-glow-neon block font-heading uppercase">🏆 {winner.name}</strong>
              {activeIncident && activeIncident.tipo !== "LIMPIO" && (
                <span className="text-[9px] font-mono" style={{ color: incidentBannerColor(activeIncident.tipo).text }}>
                  Incidente: {activeIncident.tipo}
                  {retiredCarId && ` — ${CARS_CONFIG.find(c => c.id === retiredCarId)?.name} DNF`}
                </span>
              )}
              <button
                onClick={initializeRace}
                className="mt-2 text-xs font-black text-[var(--color-gold)] underline hover:text-white block mx-auto cursor-pointer uppercase tracking-widest"
              >
                {language === "es" ? "Siguiente carrera" : "Prepare next race"}
              </button>
            </div>
          )}
        </div>

        {/* CTA button */}
        <div className="border-t border-white/10 pt-6 mt-8 relative z-10">
          {!isRacing && !raceFinished && (
            <button
              onClick={handleStartRace}
              className="w-full py-4 bg-[var(--color-gold)] text-black font-heading font-black text-xs uppercase tracking-widest rounded-xl hover:bg-[var(--color-gold-light)] transition-colors shadow-[3px_3px_0px_#000000] border-2 border-black cursor-pointer flex items-center justify-center gap-2"
            >
              <Play size={14} />
              <span>{language === "es" ? "APOSTAR E INICIAR GP" : "BET & START GRAND PRIX"}</span>
            </button>
          )}
          {isRacing && (
            <div className="w-full py-4 bg-zinc-900 border-2 border-black text-zinc-500 rounded-xl text-xs font-bold uppercase tracking-widest font-mono text-center">
              🚥 {safetyCar ? "SAFETY CAR en pista..." : "Compitiendo en Pista..."}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
