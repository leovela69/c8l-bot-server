"use client";
import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ─── Audio Source ────────────────────────────────────────────────────────────
const AMBIENT_SRC = "/audio/casino-ambience.webm";

// ─── Component ──────────────────────────────────────────────────────────────
export default function AmbientPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.35);
  const [showControls, setShowControls] = useState(false);
  const [analyserData, setAnalyserData] = useState<number[]>(new Array(16).fill(0));
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const rafRef = useRef<number>(0);

  // Create the audio element once
  useEffect(() => {
    const audio = new Audio(AMBIENT_SRC);
    audio.loop = true;
    audio.volume = volume;
    audio.preload = "auto";
    audioRef.current = audio;

    return () => {
      audio.pause();
      audio.src = "";
      cancelAnimationFrame(rafRef.current);
      if (ctxRef.current && ctxRef.current.state !== "closed") {
        ctxRef.current.close();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Analyser visualizer loop
  const startAnalyser = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // Create AudioContext + AnalyserNode only once
    if (!ctxRef.current) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      ctxRef.current = new AudioContextClass();
    }
    const ctx = ctxRef.current;

    if (!sourceRef.current) {
      sourceRef.current = ctx.createMediaElementSource(audio);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      analyser.smoothingTimeConstant = 0.8;
      sourceRef.current.connect(analyser);
      analyser.connect(ctx.destination);
      analyserRef.current = analyser;
    }

    if (ctx.state === "suspended") ctx.resume();

    const tick = () => {
      const analyser = analyserRef.current;
      if (!analyser) return;
      const data = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(data);
      // Take first 16 bins, normalize 0-1
      setAnalyserData(Array.from(data.slice(0, 16)).map((v) => v / 255));
      rafRef.current = requestAnimationFrame(tick);
    };
    tick();
  }, []);

  // Toggle play/pause
  const togglePlay = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      cancelAnimationFrame(rafRef.current);
      setIsPlaying(false);
    } else {
      try {
        startAnalyser();
        await audio.play();
        setIsPlaying(true);
      } catch (err) {
        console.warn("AmbientPlayer: Autoplay blocked, user interaction required", err);
      }
    }
  }, [isPlaying, startAnalyser]);

  // Volume change
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  return (
    <div
      className="ambient-player-root"
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      {/* Main Toggle Button */}
      <button
        onClick={togglePlay}
        className="ambient-player-btn"
        aria-label={isPlaying ? "Pause ambient music" : "Play ambient music"}
        title={isPlaying ? "Pause ambient music" : "Play ambient music"}
      >
        {/* Spinning vinyl disc */}
        <div className={`ambient-vinyl ${isPlaying ? "ambient-vinyl--spinning" : ""}`}>
          {/* Grooves */}
          <div className="ambient-vinyl__groove ambient-vinyl__groove--1" />
          <div className="ambient-vinyl__groove ambient-vinyl__groove--2" />
          <div className="ambient-vinyl__groove ambient-vinyl__groove--3" />
          {/* Center label */}
          <div className="ambient-vinyl__label">
            {isPlaying ? (
              <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
                <rect x="5" y="4" width="4" height="16" rx="1" />
                <rect x="15" y="4" width="4" height="16" rx="1" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
                <polygon points="6,3 20,12 6,21" />
              </svg>
            )}
          </div>
        </div>

        {/* Frequency bars ring around button (only when playing) */}
        {isPlaying && (
          <div className="ambient-bars-ring">
            {analyserData.map((v, i) => (
              <div
                key={i}
                className="ambient-bar"
                style={{
                  transform: `rotate(${(i / 16) * 360}deg) translateY(-22px) scaleY(${0.3 + v * 0.7})`,
                  opacity: 0.4 + v * 0.6,
                }}
              />
            ))}
          </div>
        )}

        {/* Neon pulse ring */}
        {isPlaying && <div className="ambient-pulse-ring" />}
      </button>

      {/* Expanded Controls Panel */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0, x: 10, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 10, scale: 0.9 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="ambient-controls-panel"
          >
            <span className="ambient-controls-label">
              {isPlaying ? "♫ AMBIENT ON" : "♫ AMBIENT OFF"}
            </span>

            {/* Volume Slider */}
            <div className="ambient-volume-wrap">
              <svg viewBox="0 0 24 24" width="10" height="10" fill="currentColor" className="ambient-volume-icon">
                <path d="M3 9v6h4l5 5V4L7 9H3z" />
              </svg>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="ambient-volume-slider"
                aria-label="Volume"
              />
              <span className="ambient-volume-pct">{Math.round(volume * 100)}%</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Inline Styles (scoped to this component) */}
      <style>{`
        .ambient-player-root {
          position: fixed;
          bottom: 100px;
          right: 24px;
          z-index: 100;
          display: flex;
          align-items: center;
          gap: 8px;
          flex-direction: row-reverse;
        }

        .ambient-player-btn {
          position: relative;
          width: 52px;
          height: 52px;
          border-radius: 50%;
          background: radial-gradient(circle at 35% 35%, #1a1a1f 0%, #0a0a0c 100%);
          border: 2px solid rgba(212, 175, 55, 0.35);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: border-color 0.3s, box-shadow 0.3s;
          box-shadow: 0 0 12px rgba(212, 175, 55, 0.15), inset 0 0 8px rgba(0,0,0,0.6);
          outline: none;
          overflow: visible;
        }
        .ambient-player-btn:hover {
          border-color: rgba(212, 175, 55, 0.7);
          box-shadow: 0 0 20px rgba(212, 175, 55, 0.3), inset 0 0 8px rgba(0,0,0,0.6);
        }

        /* Vinyl Disc */
        .ambient-vinyl {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background: conic-gradient(
            from 0deg,
            #111 0deg, #1a1a1a 30deg, #0d0d0d 60deg,
            #181818 90deg, #0f0f0f 120deg, #1c1c1c 150deg,
            #111 180deg, #191919 210deg, #0e0e0e 240deg,
            #171717 270deg, #101010 300deg, #1b1b1b 330deg,
            #111 360deg
          );
          position: relative;
          transition: transform 0.3s;
        }
        .ambient-vinyl--spinning {
          animation: vinyl-spin 2.5s linear infinite;
        }
        @keyframes vinyl-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .ambient-vinyl__groove {
          position: absolute;
          border-radius: 50%;
          border: 1px solid rgba(255,255,255,0.06);
          top: 50%; left: 50%;
          transform: translate(-50%, -50%);
        }
        .ambient-vinyl__groove--1 { width: 90%; height: 90%; }
        .ambient-vinyl__groove--2 { width: 70%; height: 70%; }
        .ambient-vinyl__groove--3 { width: 50%; height: 50%; }

        .ambient-vinyl__label {
          position: absolute;
          top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          width: 14px; height: 14px;
          border-radius: 50%;
          background: #D4AF37;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #000;
          box-shadow: 0 0 6px rgba(212,175,55,0.5);
        }

        /* Frequency Bars Ring */
        .ambient-bars-ring {
          position: absolute;
          top: 50%; left: 50%;
          width: 0; height: 0;
          pointer-events: none;
        }
        .ambient-bar {
          position: absolute;
          width: 3px;
          height: 8px;
          background: #00F3FF;
          border-radius: 1px;
          transform-origin: center bottom;
          box-shadow: 0 0 4px rgba(0,243,255,0.5);
          transition: transform 0.08s ease-out, opacity 0.08s;
        }

        /* Pulse Ring */
        .ambient-pulse-ring {
          position: absolute;
          top: -4px; left: -4px;
          right: -4px; bottom: -4px;
          border-radius: 50%;
          border: 1px solid rgba(0,243,255,0.3);
          animation: ambient-pulse 2s ease-out infinite;
          pointer-events: none;
        }
        @keyframes ambient-pulse {
          0% { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(1.6); opacity: 0; }
        }

        /* Controls Panel */
        .ambient-controls-panel {
          background: rgba(10,10,12,0.92);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(212,175,55,0.25);
          border-radius: 14px;
          padding: 10px 14px;
          display: flex;
          flex-direction: column;
          gap: 6px;
          box-shadow: 0 0 20px rgba(0,0,0,0.6), 0 0 8px rgba(212,175,55,0.1);
          min-width: 150px;
        }

        .ambient-controls-label {
          font-family: 'Courier New', monospace;
          font-size: 9px;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: #D4AF37;
          font-weight: 700;
          text-shadow: 0 0 6px rgba(212,175,55,0.4);
        }

        .ambient-volume-wrap {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .ambient-volume-icon {
          color: rgba(255,255,255,0.4);
          flex-shrink: 0;
        }
        .ambient-volume-slider {
          flex: 1;
          height: 4px;
          -webkit-appearance: none;
          appearance: none;
          background: linear-gradient(to right, #D4AF37, #00F3FF);
          border-radius: 2px;
          outline: none;
          cursor: pointer;
        }
        .ambient-volume-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: #D4AF37;
          border: 2px solid #000;
          box-shadow: 0 0 6px rgba(212,175,55,0.5);
          cursor: pointer;
        }
        .ambient-volume-slider::-moz-range-thumb {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: #D4AF37;
          border: 2px solid #000;
          box-shadow: 0 0 6px rgba(212,175,55,0.5);
          cursor: pointer;
        }
        .ambient-volume-pct {
          font-family: 'Courier New', monospace;
          font-size: 9px;
          color: rgba(255,255,255,0.4);
          min-width: 28px;
          text-align: right;
        }

        /* Mobile adjustments */
        @media (max-width: 640px) {
          .ambient-player-root {
            bottom: 80px;
            right: 12px;
          }
          .ambient-player-btn {
            width: 44px;
            height: 44px;
          }
          .ambient-vinyl {
            width: 28px;
            height: 28px;
          }
        }
      `}</style>
    </div>
  );
}
