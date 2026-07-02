'use client';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { casinoSounds } from '../../lib/audio/casinoSounds';
import confetti from 'canvas-confetti';

const ROULETTE_NUMBERS = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10,
  5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26
];

const RED_NUMBERS = [
  1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36
];

interface Props {
  onSpinEnd: (winningNumber: number) => void;
  isSpinning: boolean;
  winningNumber: number | null;
}

export function C8LRoulette({ onSpinEnd, isSpinning, winningNumber }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rotation, setRotation] = useState(0);
  const [showWinEffect, setShowWinEffect] = useState(false);
  const isSpinningRef = useRef(false);

  const drawRoulette = (ctx: CanvasRenderingContext2D, angle: number) => {
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = width * 0.44;
    const sliceAngle = (2 * Math.PI) / 37;

    ctx.clearRect(0, 0, width, height);
    
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(angle);

    for (let i = 0; i < 37; i++) {
      const num = ROULETTE_NUMBERS[i];
      const startAngle = i * sliceAngle - sliceAngle / 2;
      const endAngle = startAngle + sliceAngle;

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, radius, startAngle, endAngle);
      
      // C8L custom color palette
      let sliceColor = '#8A2BE2'; // Neon Purple
      if (num === 0) {
        sliceColor = '#D4AF37'; // Golden 0
      } else if (RED_NUMBERS.includes(num)) {
        sliceColor = '#FF0055'; // Neon Pink/Red
      }
      ctx.fillStyle = sliceColor;
      ctx.fill();

      // Slices divider borders
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Slices labels with neon glow match
      ctx.save();
      ctx.rotate(i * sliceAngle);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = `bold ${radius * 0.082}px 'Space Grotesk', sans-serif`;
      ctx.shadowBlur = 8;
      ctx.shadowColor = sliceColor;
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText(num.toString(), radius * 0.82, 0);
      ctx.restore();
    }

    // Outer wheel border ring (gorgeous metallic chrome gradient)
    const bezelGrad = ctx.createRadialGradient(0, 0, radius - 15, 0, 0, radius + 4);
    bezelGrad.addColorStop(0, '#101012');
    bezelGrad.addColorStop(0.2, '#2c2c35');
    bezelGrad.addColorStop(0.4, '#D4AF37'); // Chrome gold highlights
    bezelGrad.addColorStop(0.6, '#ffffff');
    bezelGrad.addColorStop(0.8, '#D4AF37');
    bezelGrad.addColorStop(1, '#000000');
    
    ctx.beginPath();
    ctx.arc(0, 0, radius + 2, 0, Math.PI * 2);
    ctx.strokeStyle = bezelGrad;
    ctx.lineWidth = 12;
    ctx.stroke();

    // Inner ring line (Neon Cyan border)
    ctx.beginPath();
    ctx.arc(0, 0, radius - 15, 0, Math.PI * 2);
    ctx.strokeStyle = '#00F3FF';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Center hub (metallic graphite)
    const hubGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, radius * 0.35);
    hubGrad.addColorStop(0, '#252528');
    hubGrad.addColorStop(0.7, '#0d0d0e');
    hubGrad.addColorStop(1, '#000000');
    
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.35, 0, 2 * Math.PI);
    ctx.fillStyle = hubGrad;
    ctx.fill();
    ctx.strokeStyle = '#D4AF37';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Center C8L logo text (shining gold)
    ctx.save();
    ctx.fillStyle = '#D4AF37';
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#D4AF37';
    ctx.font = `bold ${radius * 0.11}px 'Space Grotesk', sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('C8L', 0, -2);
    ctx.restore();
    
    ctx.restore();

    // Draw ball rolling on inner track
    if (isSpinning || winningNumber !== null) {
      let ballAngle = 0;
      if (isSpinning) {
        // Procedural ball rolling animation opposite to the wheel rotation
        ballAngle = -angle * 2.2 + Math.sin(Date.now() * 0.005) * 0.5;
      } else if (winningNumber !== null) {
        // Positioned exactly in the winning pocket
        const numIdx = ROULETTE_NUMBERS.indexOf(winningNumber);
        const sliceAngle = (2 * Math.PI) / 37;
        ballAngle = numIdx * sliceAngle + angle;
      }

      const ballDist = radius * 0.62;
      const ballX = Math.cos(ballAngle) * ballDist;
      const ballY = Math.sin(ballAngle) * ballDist;

      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.beginPath();
      ctx.arc(ballX, ballY, 7, 0, Math.PI * 2);
      ctx.fillStyle = '#FFFFFF';
      ctx.shadowBlur = 15;
      ctx.shadowColor = '#00F3FF'; // Neon cyan shadow for high contrast
      ctx.fill();
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();
    }

    // Fixed Top Pointer (arcade pin style)
    ctx.beginPath();
    ctx.moveTo(centerX, centerY - radius - 10);
    ctx.lineTo(centerX - 14, centerY - radius + 15);
    ctx.lineTo(centerX + 14, centerY - radius + 15);
    ctx.closePath();
    ctx.fillStyle = '#00F3FF'; // Neon Cyan
    ctx.fill();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2.5;
    ctx.stroke();
    
    // Pointer light
    ctx.beginPath();
    ctx.arc(centerX, centerY - radius + 3, 3.5, 0, Math.PI * 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.shadowBlur = 6;
    ctx.shadowColor = '#00F3FF';
    ctx.fill();
  };

  useEffect(() => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    drawRoulette(ctx, rotation);
  }, [rotation]);

  // Handle spin completion triggers
  useEffect(() => {
    if (winningNumber !== null && !isSpinning && !isSpinningRef.current) {
      setShowWinEffect(true);
      casinoSounds.playWin();
      
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#D4AF37', '#8A2BE2', '#FF0055', '#00F3FF']
      });

      if (navigator.vibrate) {
        navigator.vibrate(200);
      }
      
      setTimeout(() => setShowWinEffect(false), 3000);
    }
  }, [winningNumber, isSpinning]);

  // Handle spin animation
  useEffect(() => {
    if (isSpinning && winningNumber !== null) {
      isSpinningRef.current = true;
      
      const numIdx = ROULETTE_NUMBERS.indexOf(winningNumber);
      const sliceAngle = (Math.PI * 2) / 37;
      const targetAngle = -Math.PI / 2 - (numIdx * sliceAngle);
      
      const extraSpins = 4 + Math.floor(Math.random() * 3);
      const startRotation = rotation % (Math.PI * 2);
      const endRotation = startRotation + (extraSpins * Math.PI * 2) + (targetAngle - startRotation);
      
      let startTime: number | null = null;
      const duration = 3000;

      // Play procedurally synthesized rolling clicking sounds
      casinoSounds.playRouletteSpin(duration / 1000);

      const animate = (timestamp: number) => {
        if (!startTime) startTime = timestamp;
        const elapsed = timestamp - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        const easedProgress = 1 - Math.pow(1 - progress, 3);
        const currentRotation = startRotation + (endRotation - startRotation) * easedProgress;
        
        setRotation(currentRotation);

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          isSpinningRef.current = false;
          onSpinEnd(winningNumber);
        }
      };

      requestAnimationFrame(animate);
    }
  }, [isSpinning, winningNumber]);

  return (
    <div className="relative flex flex-col items-center w-full">
      {/* Telemetry HUD Panel */}
      <div className="w-full max-w-[320px] bg-black/80 border-[3px] border-black rounded-2xl p-4 mb-4 font-mono text-[9px] text-[#00F3FF] shadow-[4px_4px_0px_#00F3FF] flex flex-col gap-1 z-10 select-none border-t-[#00F3FF] border-l-[#00F3FF]">
        <div className="flex justify-between border-b border-[#00F3FF]/20 pb-1.5 font-bold">
          <span>📡 TELEMETRÍA DE GIRO QUANTUM</span>
          <span className={isSpinning ? "animate-pulse text-emerald-400" : "text-zinc-500"}>
            {isSpinning ? "● MEDIDOR ACTIVO" : "● EN ESPERA"}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2 mt-1.5 text-left">
          <div>
            <span className="text-zinc-500">VELOCIDAD:</span>{" "}
            <span className="text-white font-bold">{isSpinning ? "41.9 rad/s" : "0.0 rad/s"}</span>
          </div>
          <div>
            <span className="text-zinc-500">BOLA RPM:</span>{" "}
            <span className="text-white font-bold">{isSpinning ? "174 RPM" : "0 RPM"}</span>
          </div>
          <div>
            <span className="text-zinc-500">CALIENTES:</span>{" "}
            <span className="text-[#D4AF37] font-bold">0, 32, 17</span>
          </div>
          <div>
            <span className="text-zinc-500">ÚLTIMOS:</span>{" "}
            <span className="text-[#FF0055] font-bold">{winningNumber !== null ? `${winningNumber}, 15, 32, 4` : "15, 32, 4, 0"}</span>
          </div>
        </div>
      </div>

      <div className="relative p-3 border-[3px] border-black rounded-full bg-[#0d0d0e] shadow-[6px_6px_0px_#D4AF37] z-10 transition-all hover:scale-[1.01]">
        <canvas
          ref={canvasRef}
          width={600}
          height={600}
          className="w-full aspect-square max-w-[280px] md:max-w-[320px] mx-auto rounded-full border-[3px] border-black"
        />
      </div>

      <AnimatePresence>
        {showWinEffect && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className="fixed inset-0 pointer-events-none flex items-center justify-center z-[150] bg-black/35 backdrop-blur-xs"
          >
            <div className="text-6xl font-black text-[#D4AF37] drop-shadow-[0_0_20px_#D4AF37] tracking-wider uppercase font-heading animate-pulse text-glow-gold border-[3px] border-black bg-black p-4 px-8 shadow-[6px_6px_0px_#FF0055]">
              ¡WINNER!
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
