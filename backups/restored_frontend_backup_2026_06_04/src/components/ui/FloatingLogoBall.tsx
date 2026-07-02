"use client";
import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, HelpCircle } from "lucide-react";

export default function FloatingLogoBall() {
  const ballRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  
  // Physics parameters using refs to avoid re-renders at 60fps
  const stateRef = useRef({
    x: 100,
    y: 150,
    vx: 1.5,
    vy: 1.2,
    radius: 35,
    lastTime: 0
  });

  useEffect(() => {
    if (!visible) return;

    // Set initial position randomly inside viewport
    if (typeof window !== "undefined") {
      stateRef.current.x = Math.random() * (window.innerWidth - 100) + 50;
      stateRef.current.y = Math.random() * (window.innerHeight - 100) + 50;
      // Random velocity
      stateRef.current.vx = (Math.random() * 2 + 1) * (Math.random() > 0.5 ? 1 : -1);
      stateRef.current.vy = (Math.random() * 2 + 1) * (Math.random() > 0.5 ? 1 : -1);
    }

    let animationFrameId: number;

    const updatePhysics = (timestamp: number) => {
      const ball = ballRef.current;
      if (!ball) {
        animationFrameId = requestAnimationFrame(updatePhysics);
        return;
      }

      const state = stateRef.current;
      const width = window.innerWidth;
      const height = window.innerHeight;
      const diameter = state.radius * 2;

      // Update position
      state.x += state.vx;
      state.y += state.vy;

      // Boundary Collisions with Bounce
      if (state.x <= 0) {
        state.x = 0;
        state.vx *= -1; // reverse X velocity
      } else if (state.x >= width - diameter) {
        state.x = width - diameter;
        state.vx *= -1;
      }

      if (state.y <= 0) {
        state.y = 0;
        state.vy *= -1; // reverse Y velocity
      } else if (state.y >= height - diameter) {
        state.y = height - diameter;
        state.vy *= -1;
      }

      // Apply coordinates directly to DOM style for high performance
      ball.style.transform = `translate3d(${state.x}px, ${state.y}px, 0)`;

      animationFrameId = requestAnimationFrame(updatePhysics);
    };

    animationFrameId = requestAnimationFrame(updatePhysics);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [visible]);

  // Push ball away on hover (impulse physics)
  const handleMouseMove = (e: React.MouseEvent) => {
    const state = stateRef.current;
    const centerX = state.x + state.radius;
    const centerY = state.y + state.radius;

    // Calculate distance from cursor to ball center
    const dx = centerX - e.clientX;
    const dy = centerY - e.clientY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // If mouse gets very close, push it
    if (distance < 70) {
      setIsHovered(true);
      // Normalized direction vector from cursor to center
      const pushX = dx / (distance || 1);
      const pushY = dy / (distance || 1);
      
      // Add acceleration impulse
      state.vx = pushX * 6;
      state.vy = pushY * 6;
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    // Smoothly decelerate back to normal speed after hover push
    setTimeout(() => {
      const state = stateRef.current;
      const speed = Math.sqrt(state.vx * state.vx + state.vy * state.vy);
      const targetSpeed = 2;
      if (speed > targetSpeed) {
        state.vx = (state.vx / speed) * targetSpeed;
        state.vy = (state.vy / speed) * targetSpeed;
      }
    }, 400);
  };

  const handleBallClick = () => {
    const state = stateRef.current;
    // Launch impulse in random direction on click
    const angle = Math.random() * Math.PI * 2;
    state.vx = Math.cos(angle) * 12;
    state.vy = Math.sin(angle) * 12;
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          ref={ballRef}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onClick={handleBallClick}
          className="fixed top-0 left-0 z-[90] cursor-grab active:cursor-grabbing group select-none pointer-events-auto"
          style={{
            width: stateRef.current.radius * 2,
            height: stateRef.current.radius * 2,
            willChange: "transform"
          }}
        >
          {/* Stress Ball Body (Cyber-Luxury design: radial metallic gold gradient) */}
          <div 
            className={`w-full h-full rounded-full border-2 flex items-center justify-center relative shadow-2xl transition-all duration-300 ${
              isHovered 
                ? "border-[var(--color-gold)] scale-110 box-glow-gold" 
                : "border-[var(--color-gold)]/40 bg-gradient-to-br from-[#FFF3D4] via-[#D4AF37] to-[#806010]"
            }`}
          >
            {/* Glossy overlay effect */}
            <div className="absolute top-1 left-1.5 w-1/2 h-1/3 bg-white/20 rounded-full blur-[1px]"></div>
            
            {/* C8L Logo representation */}
            <span className="font-heading font-black text-xs text-black tracking-tighter drop-shadow-[0_1px_2px_rgba(255,255,255,0.4)]">
              C8L
            </span>

            {/* Small delete hover handler */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setVisible(false);
              }}
              className="absolute -top-1 -right-1 bg-black/80 hover:bg-black text-zinc-400 hover:text-white border border-white/10 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer"
            >
              <X size={10} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
