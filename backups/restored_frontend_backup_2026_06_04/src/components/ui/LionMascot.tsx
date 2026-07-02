"use client";
import React from "react";
import { motion } from "framer-motion";

interface LionMascotProps {
  state?: "idle" | "dance" | "win" | "sad" | "cinema" | "celebrate";
  className?: string;
  size?: number;
}

export default function LionMascot({ state = "idle", className = "", size = 200 }: LionMascotProps) {
  // Define animations based on state
  const bodyVariants: any = {
    idle: {
      y: [0, -4, 0],
      transition: { duration: 3, repeat: Infinity, ease: "easeInOut" }
    },
    dance: {
      y: [0, -15, 0, -10, 0],
      rotate: [0, -5, 5, -5, 0],
      transition: { duration: 1.2, repeat: Infinity, ease: "easeInOut" }
    },
    win: {
      scale: [1, 1.05, 1],
      y: [0, -8, 0],
      transition: { duration: 0.8, repeat: Infinity }
    },
    sad: {
      y: [0, 2, 0],
      scaleY: 0.98,
      transition: { duration: 4, repeat: Infinity, ease: "easeInOut" }
    },
    cinema: {
      y: [0, -2, 0],
      rotate: [0, 0.5, -0.5, 0],
      transition: { duration: 2, repeat: Infinity, ease: "easeInOut" }
    },
    celebrate: {
      scale: [1, 1.12, 0.96, 1.1, 1],
      y: [0, -16, 4, -10, 0],
      rotate: [0, 8, -8, 4, 0],
      transition: { duration: 1.5, repeat: Infinity }
    }
  };

  const hatVariants: any = {
    idle: {
      rotate: [-5, -7, -5],
      y: [0, -1, 0],
      transition: { duration: 3, repeat: Infinity, ease: "easeInOut" }
    },
    dance: {
      rotate: [-5, 10, -15, 10, -5],
      y: [0, -6, 0],
      transition: { duration: 1.2, repeat: Infinity }
    },
    win: {
      y: [0, -10, 0],
      rotate: [-5, -20, 10, -5],
      transition: { duration: 0.8, repeat: Infinity }
    },
    sad: {
      y: [3, 4, 3],
      rotate: [-15, -18, -15],
      transition: { duration: 4, repeat: Infinity, ease: "easeInOut" }
    },
    cinema: {
      rotate: [-5, -6, -5],
      y: [0, -0.5, 0],
      transition: { duration: 2, repeat: Infinity, ease: "easeInOut" }
    },
    celebrate: {
      y: [0, -20, 0],
      rotate: [-5, 30, -30, -5],
      transition: { duration: 1.5, repeat: Infinity }
    }
  };

  const caneVariants: any = {
    idle: {
      rotate: [0, 2, 0],
      transition: { duration: 4, repeat: Infinity, ease: "easeInOut" }
    },
    dance: {
      rotate: [0, 45, 90, 180, 360],
      x: [0, 5, -5, 0],
      transition: { duration: 1.2, repeat: Infinity, ease: "linear" }
    },
    win: {
      y: [-2, 4, -2],
      rotate: [-5, 5, -5],
      transition: { duration: 0.8, repeat: Infinity }
    },
    sad: {
      rotate: [-10, -12, -10],
      transition: { duration: 3, repeat: Infinity }
    },
    cinema: {
      rotate: [0, 0],
      scale: 0,
      opacity: 0,
      transition: { duration: 0.3 }
    },
    celebrate: {
      rotate: [0, 180, 360, 540, 720],
      x: [0, 8, -8, 0],
      y: [0, -15, 0],
      transition: { duration: 1.5, repeat: Infinity, ease: "easeInOut" }
    }
  };

  const eyesVariants: any = {
    idle: {
      scaleY: [1, 1, 0.1, 1, 1, 1],
      transition: { duration: 4, repeat: Infinity }
    },
    dance: {
      scaleY: [1, 1, 1, 1],
      scale: 1.1,
    },
    win: {
      scaleY: [1, 0.9, 1],
      scale: 1.15,
      transition: { duration: 0.4, repeat: Infinity }
    },
    sad: {
      scaleY: 0.6,
      y: 1.5,
    },
    cinema: {
      scaleY: [1, 1, 0.1, 1, 1, 1],
      scale: 1,
      transition: { duration: 4, repeat: Infinity }
    },
    celebrate: {
      scaleY: [1, 0.2, 1],
      scale: 1.3,
      transition: { duration: 0.5, repeat: Infinity }
    }
  };

  return (
    <div className={`relative flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
      
      {/* Coin spray animation overlay when winning */}
      {state === "win" && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
          {[...Array(6)].map((_, i) => (
            <motion.svg
              key={i}
              className="absolute w-4 h-4 text-[var(--accent-gold,#D4AF37)]"
              viewBox="0 0 24 24"
              initial={{ 
                x: size / 2 - 8, 
                y: size / 2, 
                opacity: 1, 
                scale: 0.5 
              }}
              animate={{ 
                x: [size / 2 - 8, size / 2 + (Math.random() * 80 - 40), size / 2 + (Math.random() * 140 - 70)],
                y: [size / 2, size / 2 - (Math.random() * 60 + 40), size],
                opacity: [1, 1, 0],
                scale: [0.5, 1.2, 0.6],
                rotate: [0, 360]
              }}
              transition={{ 
                duration: 1 + Math.random() * 0.8, 
                repeat: Infinity, 
                delay: i * 0.25 
              }}
            >
              <circle cx="12" cy="12" r="10" fill="var(--accent-gold,#D4AF37)" stroke="var(--accent-gold-dark,#9A7B1C)" strokeWidth="1" />
              <path d="M12 6v12M9 9h6M9 15h6" stroke="#000" strokeWidth="1.5" strokeLinecap="round" />
            </motion.svg>
          ))}
        </div>
      )}
 
      {/* Confetti & Gold Stars overlay when celebrating epic/legendary gifts */}
      {state === "celebrate" && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
          {/* Confetti particles */}
          {[...Array(15)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 rounded-full"
              style={{
                backgroundColor: i % 3 === 0 ? "var(--accent-gold,#D4AF37)" : i % 3 === 1 ? "var(--accent-cyan,#00F3FF)" : "var(--accent-pink,#FF007F)",
                left: `${30 + Math.random() * 40}%`,
                top: "70%"
              }}
              animate={{
                y: [0, -110 - Math.random() * 50, -20],
                x: [0, (Math.random() - 0.5) * 60, (Math.random() - 0.5) * 90],
                opacity: [1, 1, 0],
                scale: [0.5, 1.4, 0.5],
                rotate: [0, 360 + Math.random() * 360]
              }}
              transition={{
                duration: 1.4 + Math.random() * 0.8,
                repeat: Infinity,
                delay: i * 0.08
              }}
            />
          ))}
          {/* Star particles */}
          {[...Array(8)].map((_, i) => (
            <motion.svg
              key={`star-${i}`}
              className="absolute w-4 h-4 text-[var(--accent-gold,#D4AF37)]"
              viewBox="0 0 24 24"
              fill="var(--accent-gold,#D4AF37)"
              initial={{ 
                x: size / 2 - 8, 
                y: size / 2 - 10, 
                opacity: 1, 
                scale: 0.2 
              }}
              animate={{ 
                x: [size / 2 - 8, size / 2 + (Math.random() * 100 - 50), size / 2 + (Math.random() * 160 - 80)],
                y: [size / 2 - 10, size / 2 - (Math.random() * 70 + 50), size],
                opacity: [1, 1, 0],
                scale: [0.2, 1.4, 0.4],
                rotate: [0, 720]
              }}
              transition={{ 
                duration: 1.1 + Math.random() * 0.6, 
                repeat: Infinity, 
                delay: i * 0.15 
              }}
            >
              <polygon points="12,2 15,9 22,9 17,14 19,21 12,17 5,21 7,14 2,9 9,9" />
            </motion.svg>
          ))}
        </div>
      )}

      {/* SVG Canvas for the Mascot */}
      <svg
        viewBox="0 0 200 220"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full select-none"
      >
        {/* Glow behind character */}
        <circle cx="100" cy="110" r="70" fill={state === "win" ? "var(--accent-gold-shadow, rgba(212,175,55,0.15))" : state === "dance" ? "var(--accent-cyan-shadow, rgba(0,243,255,0.08))" : "var(--accent-gold-shadow-dim, rgba(212,175,55,0.04))"} className="animate-pulse" />

        {/* Shadow base */}
        <ellipse cx="100" cy="205" rx="45" ry="7" fill="rgba(0,0,0,0.5)" />

        {/* LION GROUP WITH CORE PHYSICS */}
        <motion.g
          variants={bodyVariants}
          animate={state}
          initial="idle"
          className="origin-bottom"
        >
          {/* Back Mane */}
          <path
            d="M50 110C50 70 70 45 100 45C130 45 150 70 150 110C150 150 130 170 100 170C70 170 50 150 50 110Z"
            fill="var(--accent-gold, #D4AF37)"
            stroke="var(--accent-gold-dark, #9A7B1C)"
            strokeWidth="3"
          />
          {/* Dark luxury highlights on mane */}
          <path d="M62 75C70 60 85 53 100 53C115 53 130 60 138 75" stroke="var(--surface-dim, #050505)" strokeWidth="4" strokeLinecap="round" opacity="0.3" />
          <path d="M53 110C53 135 68 152 90 158" stroke="var(--surface-dim, #050505)" strokeWidth="4" strokeLinecap="round" opacity="0.3" />

          {/* Ears */}
          <circle cx="60" cy="65" r="18" fill="var(--accent-gold, #D4AF37)" stroke="var(--accent-gold-dark, #9A7B1C)" strokeWidth="2" />
          <circle cx="60" cy="65" r="10" fill="var(--surface-dim, #050505)" />
          
          <circle cx="140" cy="65" r="18" fill="var(--accent-gold, #D4AF37)" stroke="var(--accent-gold-dark, #9A7B1C)" strokeWidth="2" />
          <circle cx="140" cy="65" r="10" fill="var(--surface-dim, #050505)" />

          {/* Body - Tuxedo (Esmoquin) */}
          <path
            d="M75 150C75 140 80 130 100 130C120 130 125 140 125 150V195H75V150Z"
            fill="var(--surface-dim, #050505)"
            stroke="var(--surface-container, #201f1f)"
            strokeWidth="2"
          />
          
          {/* White Shirt V-Neck */}
          <path d="M90 130L100 150L110 130Z" fill="#FFFFFF" />

          {/* Golden Bowtie */}
          <path d="M92 133L100 138L108 133L105 141L108 144L100 142L92 144L95 141Z" fill="var(--accent-gold, #D4AF37)" />
          <circle cx="100" cy="139" r="2.5" fill="#FFFFFF" />

          {/* Lapels (Solapas) */}
          <path d="M78 135L92 153L86 175" stroke="var(--accent-gold, #D4AF37)" strokeWidth="2" strokeLinecap="round" />
          <path d="M122 135L108 153L114 175" stroke="var(--accent-gold, #D4AF37)" strokeWidth="2" strokeLinecap="round" />

          {/* Lion Head */}
          <circle cx="100" cy="105" r="42" fill="var(--accent-gold-bright, #E6C25E)" stroke="var(--accent-gold-muted, #B89433)" strokeWidth="2" />
          
          {/* Muzzle (Hocico) */}
          <ellipse cx="100" cy="120" rx="16" ry="10" fill="var(--accent-gold-soft, #FFF3D4)" />
          
          {/* Nose */}
          <polygon points="95,114 105,114 100,120" fill="var(--surface-dim, #050505)" />
          
          {/* Mouth line */}
          <path d="M100 120V125C98 127 96 128 94 127M100 125C102 127 104 128 106 127" stroke="var(--surface-dim, #050505)" strokeWidth="1.5" strokeLinecap="round" />

          {/* Blushing cheeks */}
          <ellipse cx="72" cy="118" rx="6" ry="4" fill="var(--accent-pink, #FF007F)" opacity={state === "win" ? "0.6" : "0.3"} />
          <ellipse cx="128" cy="118" rx="6" ry="4" fill="var(--accent-pink, #FF007F)" opacity={state === "win" ? "0.6" : "0.3"} />

          {/* Interactive Eyes */}
          <motion.g variants={eyesVariants} animate={state} className="origin-center">
            {/* Left Eye */}
            <circle cx="82" cy="98" r="8" fill="var(--surface-dim, #050505)" />
            <circle cx="80" cy="95" r="3" fill="#FFFFFF" />
            <circle cx="84" cy="100" r="1" fill="#FFFFFF" />

            {/* Right Eye */}
            <circle cx="118" cy="98" r="8" fill="var(--surface-dim, #050505)" />
            <circle cx="120" cy="95" r="3" fill="#FFFFFF" />
            <circle cx="116" cy="100" r="1" fill="#FFFFFF" />
          </motion.g>

          {/* Eyebrows */}
          <motion.path 
            d={state === "sad" ? "M75 88C78 92 86 91 88 89" : "M75 88C78 86 86 86 88 88"} 
            stroke="var(--accent-gold-dark, #9A7B1C)" 
            strokeWidth="2.5" 
            strokeLinecap="round" 
          />
          <motion.path 
            d={state === "sad" ? "M125 88C122 92 114 91 112 89" : "M125 88C122 86 114 86 112 88"} 
            stroke="var(--accent-gold-dark, #9A7B1C)" 
            strokeWidth="2.5" 
            strokeLinecap="round" 
          />

          {/* Whiskers (Bigotes) */}
          <line x1="68" y1="120" x2="52" y2="120" stroke="var(--accent-gold-muted, #B89433)" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="69" y1="125" x2="55" y2="128" stroke="var(--accent-gold-muted, #B89433)" strokeWidth="1.5" strokeLinecap="round" />
          
          <line x1="132" y1="120" x2="148" y2="120" stroke="var(--accent-gold-muted, #B89433)" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="131" y1="125" x2="145" y2="128" stroke="var(--accent-gold-muted, #B89433)" strokeWidth="1.5" strokeLinecap="round" />

          {/* Sombrero de Copa Inclinado (Tilted Top Hat) */}
          <motion.g
            variants={hatVariants}
            animate={state}
            className="origin-bottom-right"
            style={{ x: 6, y: -2 }}
          >
            {/* Hat Band */}
            <path d="M72 66L116 57L119 62L75 71Z" fill="var(--accent-gold, #D4AF37)" />
            {/* Hat Body */}
            <path
              d="M74 65L79 26C80 23 83 20 87 20H108C111 20 114 23 115 26L115 57L74 65Z"
              fill="var(--surface-dim, #050505)"
              stroke="var(--surface-container, #201f1f)"
              strokeWidth="1.5"
            />
            {/* Golden Buckle on Hat */}
            <rect x="91" y="55" width="8" height="9" rx="1" fill="var(--accent-gold, #D4AF37)" transform="rotate(-11 91 55)" />
            <rect x="93" y="57" width="4" height="5" fill="var(--surface-dim, #050505)" transform="rotate(-11 93 57)" />
            {/* Hat Brim (Ala del sombrero) */}
            <ellipse cx="95" cy="65" rx="27" ry="5" fill="var(--surface-dim, #050505)" stroke="var(--surface-container, #201f1f)" strokeWidth="1" transform="rotate(-11 95 65)" />
          </motion.g>

          {/* Arms */}
          {/* Left Arm holding cane */}
          <path d="M75 160C62 165 58 175 60 185" stroke="var(--surface-dim, #050505)" strokeWidth="11" strokeLinecap="round" />
          <circle cx="60" cy="186" r="6" fill="var(--accent-gold-bright, #E6C25E)" />

          {/* Right Arm waving or resting */}
          {state === "win" ? (
            // Waving
            <motion.path 
              d="M125 160C138 152 148 140 148 130" 
              stroke="var(--surface-dim, #050505)" 
              strokeWidth="11" 
              strokeLinecap="round"
              animate={{ rotate: [0, 15, -15, 0] }}
              transition={{ repeat: Infinity, duration: 0.6 }}
              className="origin-left"
            />
          ) : (
            // Resting
            <path d="M125 160C138 165 142 175 140 185" stroke="var(--surface-dim, #050505)" strokeWidth="11" strokeLinecap="round" />
          )}
          <circle cx={state === "win" ? 148 : 140} cy={state === "win" ? 126 : 186} r="6" fill="var(--accent-gold-bright, #E6C25E)" />

        </motion.g>

        {/* GOLDEN CANE (Bastón de oro) */}
        <motion.g
          variants={caneVariants}
          animate={state}
          initial="idle"
          className="origin-bottom"
          style={{ x: -28, y: 35 }}
        >
          {/* Cane Shaft */}
          <line x1="85" y1="110" x2="85" y2="200" stroke="var(--accent-gold, #D4AF37)" strokeWidth="3.5" strokeLinecap="round" />
          {/* Cane Tip */}
          <line x1="85" y1="200" x2="85" y2="204" stroke="var(--surface-dim, #050505)" strokeWidth="4.5" strokeLinecap="round" />
          {/* Tilted Handle */}
          <path d="M85 110C85 102 74 102 74 110" fill="none" stroke="var(--accent-gold, #D4AF37)" strokeWidth="4" strokeLinecap="round" />
          
          {/* Micro-leoncito carved on the tip handles */}
          <circle cx="85" cy="108" r="4.5" fill="var(--accent-gold-muted, #B89433)" />
          <circle cx="81.5" cy="104.5" r="1.5" fill="var(--accent-gold, #D4AF37)" />
          <circle cx="88.5" cy="104.5" r="1.5" fill="var(--accent-gold, #D4AF37)" />
        </motion.g>

        {/* CINEMA ACCESSORIES (Clapperboard & Popcorn Box) */}
        <motion.g
          initial={{ opacity: 0, scale: 0 }}
          animate={state === "cinema" ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0 }}
          transition={{ duration: 0.4 }}
          style={{ originX: "100px", originY: "110px" }}
        >
          {/* Clapperboard on the left (x ~ 45, y ~ 165) */}
          <g transform="translate(25, 155) rotate(-10)">
            {/* Board Base */}
            <rect x="0" y="8" width="36" height="28" rx="2" fill="var(--surface-container, #201f1f)" stroke="#333" strokeWidth="1" />
            {/* Clapper stick base (hinge) */}
            <rect x="0" y="0" width="36" height="8" fill="#111" />
            <line x1="6" y1="0" x2="12" y2="8" stroke="#FFF" strokeWidth="2.5" />
            <line x1="16" y1="0" x2="22" y2="8" stroke="#FFF" strokeWidth="2.5" />
            <line x1="26" y1="0" x2="32" y2="8" stroke="#FFF" strokeWidth="2.5" />
            
            {/* Clapper top arm (open state) */}
            <g transform="translate(0, 0) rotate(-20 origin 0 8)">
              <rect x="0" y="-8" width="36" height="8" fill="#111" />
              <line x1="6" y1="-8" x2="12" y2="0" stroke="#FFF" strokeWidth="2.5" />
              <line x1="16" y1="-8" x2="22" y2="0" stroke="#FFF" strokeWidth="2.5" />
              <line x1="26" y1="-8" x2="32" y2="0" stroke="#FFF" strokeWidth="2.5" />
            </g>
            
            {/* Board chalk markings */}
            <text x="6" y="20" fill="#FFF" fontSize="6" fontFamily="monospace" fontWeight="bold">C8L DIR</text>
            <text x="6" y="30" fill="var(--accent-gold, #D4AF37)" fontSize="5" fontFamily="monospace" fontWeight="bold">SCENE 1</text>
            <text x="24" y="30" fill="#FFF" fontSize="5" fontFamily="monospace" fontWeight="bold">TK 1</text>
          </g>

          {/* Popcorn box on the right (x ~ 130, y ~ 165) */}
          <g transform="translate(130, 160)">
            {/* Box Backing */}
            <path d="M 0,12 L 20,12 L 16,35 L 4,35 Z" fill="#FFF" stroke="#222" strokeWidth="0.5" />
            {/* Red stripes */}
            <path d="M 3,12 L 6,12 L 6,35 L 4,35 Z" fill="var(--accent-pink, #FF007F)" />
            <path d="M 9,12 L 12,12 L 11,35 L 9,35 Z" fill="var(--accent-pink, #FF007F)" />
            <path d="M 14,12 L 17,12 L 15,35 L 14,35 Z" fill="var(--accent-pink, #FF007F)" />
            
            {/* Popcorn container rim shadow */}
            <rect x="0" y="10" width="20" height="2.5" fill="var(--accent-gold-muted, #B89433)" rx="0.5" opacity="0.3" />

            {/* Popcorn Kernels (stacked circles) */}
            <circle cx="4" cy="9" r="4.5" fill="#FFE066" />
            <circle cx="10" cy="7" r="5" fill="#FFEC99" />
            <circle cx="16" cy="9" r="4" fill="#FFE066" />
            <circle cx="7" cy="5" r="4.5" fill="#FFF3BF" />
            <circle cx="13" cy="5" r="4.5" fill="#FFF3BF" />
            
            {/* Popcorn details */}
            <circle cx="10" cy="8" r="1.5" fill="#FFC93C" opacity="0.6" />
            <circle cx="5" cy="10" r="1.2" fill="#FFC93C" opacity="0.6" />
            <circle cx="15" cy="9" r="1.2" fill="#FFC93C" opacity="0.6" />
            <circle cx="8" cy="6" r="1.2" fill="#FFD43B" opacity="0.8" />
            <circle cx="12" cy="6" r="1.2" fill="#FFD43B" opacity="0.8" />
            
            {/* "POPCORN" label in center */}
            <rect x="3" y="19" width="14" height="6" fill="#000" rx="1" opacity="0.8" />
            <text x="4" y="24" fill="var(--accent-gold, #D4AF37)" fontSize="4.5" fontFamily="sans-serif" fontWeight="bold">C8L</text>
          </g>
        </motion.g>

      </svg>
    </div>
  );
}
