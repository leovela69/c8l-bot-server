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

      {/* Render the Lion Mascot Image with Animations */}
      <motion.img
        src="/lion-mascot.png"
        alt="C8L Lion Mascot"
        variants={bodyVariants}
        animate={state}
        className="w-full h-full object-cover rounded-full border-2 border-zinc-800/40 bg-zinc-950/20 shadow-lg"
        style={{ originX: 0.5, originY: 0.5 }}
      />
      
    </div>
  );
}
