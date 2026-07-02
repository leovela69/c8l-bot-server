"use client";
import React, { useState } from "react";
import { motion } from "framer-motion";

interface DynamicLogoWebGLProps {
  hovered?: boolean;
  size?: number;
  className?: string;
}

export default function DynamicLogoWebGL({ hovered = false, size = 180, className = "" }: DynamicLogoWebGLProps) {
  const [localHover, setLocalHover] = useState(false);
  const isHovered = hovered || localHover;

  // Animation speeds based on hover state
  const wingSpeed = isHovered ? "0.6s" : "2s";
  const heartSpeed = isHovered ? "0.5s" : "1.2s";
  const shimmerSpeed = isHovered ? "1.5s" : "4.0s";
  const glowIntensity = isHovered ? "brightness(1.4) drop-shadow(0 0 12px rgba(6, 182, 212, 0.9))" : "brightness(1.0) drop-shadow(0 0 5px rgba(6, 182, 212, 0.5))";
  const shieldScale = isHovered ? 1.08 : 1.0;

  return (
    <div 
      className={`relative select-none flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
      onMouseEnter={() => setLocalHover(true)}
      onMouseLeave={() => setLocalHover(false)}
    >
      {/* Inline styles for CSS keyframes and animations */}
      <style jsx>{`
        @keyframes shimmer {
          0% {
            background-position: -200% center;
          }
          100% {
            background-position: 200% center;
          }
        }
        @keyframes swayLeft {
          0%, 100% {
            transform: rotate(0deg);
          }
          50% {
            transform: rotate(-3deg);
          }
        }
        @keyframes swayRight {
          0%, 100% {
            transform: rotate(0deg);
          }
          50% {
            transform: rotate(3deg);
          }
        }
        @keyframes heartbeat {
          0%, 100% {
            transform: scale(1);
          }
          20% {
            transform: scale(1.12);
          }
          40% {
            transform: scale(0.98);
          }
          60% {
            transform: scale(1.06);
          }
        }
        @keyframes neonPulse {
          0%, 100% {
            opacity: 0.7;
            filter: drop-shadow(0 0 4px rgba(6, 182, 212, 0.5));
          }
          50% {
            opacity: 1;
            filter: drop-shadow(0 0 14px rgba(6, 182, 212, 0.95));
          }
        }
        
        .shimmer-shield {
          background: linear-gradient(
            120deg,
            #8a6f27 0%,
            #d4af37 25%,
            #fff3d4 50%,
            #d4af37 75%,
            #8a6f27 100%
          );
          background-size: 200% auto;
          animation: shimmer ${shimmerSpeed} linear infinite;
        }

        .wing-left-anim {
          transform-origin: 75px 90px;
          animation: swayLeft ${wingSpeed} ease-in-out infinite;
        }

        .wing-right-anim {
          transform-origin: 105px 90px;
          animation: swayRight ${wingSpeed} ease-in-out infinite;
        }

        .heart-anim {
          transform-origin: 90px 95px;
          animation: heartbeat ${heartSpeed} ease-in-out infinite;
        }

        .headphones-anim {
          transform-origin: 90px 95px;
          animation: heartbeat ${heartSpeed} ease-in-out infinite, neonPulse ${heartSpeed} ease-in-out infinite;
        }
      `}</style>

      {/* SVG Container */}
      <svg 
        viewBox="0 0 180 180" 
        className="w-full h-full relative z-10 transition-transform duration-500 ease-out"
        style={{ transform: `scale(${shieldScale})` }}
      >
        <defs>
          {/* Metallic Gold Gradients */}
          <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8a6f27" />
            <stop offset="30%" stopColor="#e5c158" />
            <stop offset="50%" stopColor="#fff3d4" />
            <stop offset="70%" stopColor="#d4af37" />
            <stop offset="100%" stopColor="#5c4410" />
          </linearGradient>
          
          <linearGradient id="shimmerGrad" x1="0%" y1="0%" x2="200%" y2="0%">
            <stop offset="0%" stopColor="#d4af37" stopOpacity="1" />
            <stop offset="25%" stopColor="#fff3d4" stopOpacity="1" />
            <stop offset="50%" stopColor="#d4af37" stopOpacity="1" />
            <stop offset="100%" stopColor="#8a6f27" stopOpacity="1" />
          </linearGradient>

          {/* Heart Red Gradient */}
          <radialGradient id="heartGrad" cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#ff4d4d" />
            <stop offset="70%" stopColor="#cc0000" />
            <stop offset="100%" stopColor="#7a0000" />
          </radialGradient>

          {/* Neon Blue Gradient */}
          <linearGradient id="neonBlue" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#22d3ee" />
            <stop offset="100%" stopColor="#0891b2" />
          </linearGradient>

          {/* Shadow filters for premium glows */}
          <filter id="goldGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* LAYER 1: OUTER GOLDEN SPIKES FRAME (Shield background) */}
        <g filter="url(#goldGlow)">
          {/* Outer spikes generated systematically */}
          {[...Array(24)].map((_, index) => {
            const angle = (index * 360) / 24;
            const r1 = 66; // Inner radius
            const r2 = isHovered ? 84 : 78; // Outer spike tip radius (grows on hover)
            const thickness = 6;
            
            const rad = (angle * Math.PI) / 180;
            const radLeft = ((angle - thickness) * Math.PI) / 180;
            const radRight = ((angle + thickness) * Math.PI) / 180;
            
            const x1 = 90 + r1 * Math.cos(radLeft);
            const y1 = 90 + r1 * Math.sin(radLeft);
            const x2 = 90 + r2 * Math.cos(rad);
            const y2 = 90 + r2 * Math.sin(rad);
            const x3 = 90 + r1 * Math.cos(radRight);
            const y3 = 90 + r1 * Math.sin(radRight);

            return (
              <path
                key={index}
                d={`M ${x1} ${y1} L ${x2} ${y2} L ${x3} ${y3} Z`}
                fill="url(#goldGrad)"
                className="transition-all duration-300"
                style={{ opacity: 0.95 }}
              />
            );
          })}
          {/* Inner ring background */}
          <circle 
            cx="90" 
            cy="90" 
            r="67" 
            fill="#08080a" 
            stroke="url(#goldGrad)" 
            strokeWidth="3.5"
            className="transition-all duration-300"
          />
        </g>

        {/* LAYER 2: ANGEL WINGS (Oscillating Left & Right) */}
        {/* Left Angel Wing */}
        <g className="wing-left-anim">
          <path
            d="M 75 90 C 50 80, 35 60, 22 75 C 16 82, 24 92, 32 95 C 40 98, 48 94, 58 98 C 45 102, 30 106, 26 114 C 24 118, 30 122, 38 120 C 48 118, 56 110, 66 110 C 54 116, 42 124, 40 130 C 38 134, 44 136, 50 132 C 58 126, 68 116, 75 110 Z"
            fill="url(#goldGrad)"
            opacity="0.88"
          />
        </g>

        {/* Right Angel Wing */}
        <g className="wing-right-anim">
          <path
            d="M 105 90 C 130 80, 145 60, 158 75 C 164 82, 156 92, 148 95 C 140 98, 132 94, 122 98 C 135 102, 150 106, 154 114 C 156 118, 150 122, 142 120 C 132 118, 124 110, 114 110 C 126 116, 138 124, 140 130 C 142 134, 136 136, 130 132 C 122 126, 112 116, 105 110 Z"
            fill="url(#goldGrad)"
            opacity="0.88"
          />
        </g>

        {/* LAYER 3: RED HEART (Pulsating) */}
        <path
          d="M 90 115 L 81 106 C 64 91, 52 80, 52 66 C 52 55, 60 47, 71 47 C 77 47, 83 50, 87 55 L 90 58 L 93 55 C 97 50, 103 47, 109 47 C 120 47, 128 55, 128 66 C 128 80, 116 91, 99 106 Z"
          fill="url(#heartGrad)"
          className="heart-anim cursor-pointer"
        />

        {/* LAYER 4: HEADPHONES (Neon cyan glows) */}
        <g 
          className="headphones-anim"
          style={{ filter: glowIntensity }}
        >
          {/* Headband arch */}
          <path
            d="M 64 74 A 32 32 0 0 1 116 74"
            fill="none"
            stroke="url(#neonBlue)"
            strokeWidth="4"
            strokeLinecap="round"
          />
          {/* Left Earcup */}
          <rect
            x="58"
            y="70"
            width="8"
            height="18"
            rx="4"
            fill="url(#neonBlue)"
          />
          {/* Right Earcup */}
          <rect
            x="114"
            y="70"
            width="8"
            height="18"
            rx="4"
            fill="url(#neonBlue)"
          />
          {/* Dynamic cyan neon cord highlights */}
          <circle cx="62" cy="79" r="2" fill="#ffffff" />
          <circle cx="118" cy="79" r="2" fill="#ffffff" />
        </g>
      </svg>

      {/* Composite overlay of the original background-removed official logo in the center */}
      <div 
        className="absolute rounded-full overflow-hidden flex items-center justify-center pointer-events-none"
        style={{
          width: size * 0.42,
          height: size * 0.42,
          zIndex: 15,
          top: "30%",
          left: "29%",
          background: "radial-gradient(circle, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0) 80%)"
        }}
      >
        <img 
          src="/logo.png" 
          alt="C8L Official Logo Center" 
          className={`w-[85%] h-[85%] object-contain transition-all duration-500 ${
            isHovered ? "scale-115 brightness-[1.25]" : "scale-100 brightness-[1.0]"
          }`}
          onError={(e) => {
            // Safe fallback if logo.png fails
            e.currentTarget.style.display = "none";
          }}
        />
      </div>

      {/* Shimmer sweep glass gloss layer behind/around central area */}
      <div 
        className="absolute rounded-full pointer-events-none border border-[var(--color-gold)]/20"
        style={{
          width: size * 0.74,
          height: size * 0.74,
          zIndex: 5,
          background: "linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0) 100%)",
          boxShadow: isHovered ? "inset 0 0 20px rgba(212, 175, 55, 0.15)" : "none"
        }}
      />
    </div>
  );
}
