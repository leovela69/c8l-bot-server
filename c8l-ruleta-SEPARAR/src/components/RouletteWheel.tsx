"use client";

import { useEffect, useRef, useState } from "react";
import { WHEEL_NUMBERS, getNumberColor } from "@/lib/roulette-engine";
import { useGameStore } from "@/store/game-store";

export default function RouletteWheel() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const { phase, lastResult } = useGameStore();
  const [currentRotation, setCurrentRotation] = useState(0);
  const [ballAngle, setBallAngle] = useState(0);

  const WHEEL_SIZE = 320;
  const CENTER = WHEEL_SIZE / 2;
  const OUTER_RADIUS = CENTER - 10;
  const INNER_RADIUS = OUTER_RADIUS - 40;
  const BALL_RADIUS = OUTER_RADIUS - 15;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let rotation = currentRotation;
    let ballR = ballAngle;
    let speed = 0;
    let ballSpeed = 0;
    let spinStartTime = 0;
    let targetAngle = 0;

    if (phase === "spinning" && lastResult) {
      // Calculate target position
      const posIndex = WHEEL_NUMBERS.indexOf(lastResult.number);
      const segmentAngle = (2 * Math.PI) / 37;
      targetAngle = posIndex * segmentAngle;
      speed = 0.4;
      ballSpeed = -0.5;
      spinStartTime = Date.now();
    }

    function draw() {
      if (!ctx) return;
      ctx.clearRect(0, 0, WHEEL_SIZE, WHEEL_SIZE);

      // Outer wooden rim
      const rimGradient = ctx.createRadialGradient(
        CENTER, CENTER, OUTER_RADIUS - 5,
        CENTER, CENTER, OUTER_RADIUS + 5
      );
      rimGradient.addColorStop(0, "#6d4227");
      rimGradient.addColorStop(0.3, "#4a2c17");
      rimGradient.addColorStop(0.7, "#8b5e3c");
      rimGradient.addColorStop(1, "#3a1f0f");

      ctx.beginPath();
      ctx.arc(CENTER, CENTER, OUTER_RADIUS + 5, 0, Math.PI * 2);
      ctx.fillStyle = rimGradient;
      ctx.fill();

      // Inner background (dark)
      ctx.beginPath();
      ctx.arc(CENTER, CENTER, OUTER_RADIUS, 0, Math.PI * 2);
      ctx.fillStyle = "#1a1a1a";
      ctx.fill();

      // Draw segments
      const segmentAngle = (2 * Math.PI) / 37;

      for (let i = 0; i < 37; i++) {
        const num = WHEEL_NUMBERS[i];
        const color = getNumberColor(num);
        const startAngle = rotation + i * segmentAngle;
        const endAngle = startAngle + segmentAngle;

        // Segment fill
        ctx.beginPath();
        ctx.moveTo(CENTER, CENTER);
        ctx.arc(CENTER, CENTER, OUTER_RADIUS - 2, startAngle, endAngle);
        ctx.closePath();

        if (color === "red") ctx.fillStyle = "#c62828";
        else if (color === "black") ctx.fillStyle = "#212121";
        else ctx.fillStyle = "#2e7d32";

        ctx.fill();

        // Segment border
        ctx.strokeStyle = "rgba(201, 164, 53, 0.3)";
        ctx.lineWidth = 0.5;
        ctx.stroke();

        // Number text
        const textAngle = startAngle + segmentAngle / 2;
        const textRadius = OUTER_RADIUS - 22;
        const textX = CENTER + Math.cos(textAngle) * textRadius;
        const textY = CENTER + Math.sin(textAngle) * textRadius;

        ctx.save();
        ctx.translate(textX, textY);
        ctx.rotate(textAngle + Math.PI / 2);
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 10px 'Georgia', serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(num.toString(), 0, 0);
        ctx.restore();
      }

      // Inner circle (wooden center)
      const centerGradient = ctx.createRadialGradient(
        CENTER, CENTER, 0,
        CENTER, CENTER, INNER_RADIUS
      );
      centerGradient.addColorStop(0, "#5c3317");
      centerGradient.addColorStop(0.5, "#3a1f0f");
      centerGradient.addColorStop(1, "#2a150a");

      ctx.beginPath();
      ctx.arc(CENTER, CENTER, INNER_RADIUS, 0, Math.PI * 2);
      ctx.fillStyle = centerGradient;
      ctx.fill();

      // Gold center cone
      const coneGradient = ctx.createRadialGradient(
        CENTER - 5, CENTER - 5, 0,
        CENTER, CENTER, 20
      );
      coneGradient.addColorStop(0, "#e6c84d");
      coneGradient.addColorStop(0.5, "#c9a435");
      coneGradient.addColorStop(1, "#8b7023");

      ctx.beginPath();
      ctx.arc(CENTER, CENTER, 18, 0, Math.PI * 2);
      ctx.fillStyle = coneGradient;
      ctx.fill();

      // Gold cone highlight
      ctx.beginPath();
      ctx.arc(CENTER - 4, CENTER - 4, 6, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255, 255, 200, 0.4)";
      ctx.fill();

      // Ball
      if (phase === "spinning" || phase === "result") {
        const ballX = CENTER + Math.cos(ballR) * BALL_RADIUS;
        const ballY = CENTER + Math.sin(ballR) * BALL_RADIUS;

        // Ball shadow
        ctx.beginPath();
        ctx.arc(ballX + 2, ballY + 2, 6, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
        ctx.fill();

        // Ball
        const ballGradient = ctx.createRadialGradient(
          ballX - 2, ballY - 2, 0,
          ballX, ballY, 6
        );
        ballGradient.addColorStop(0, "#ffffff");
        ballGradient.addColorStop(0.4, "#e0e0e0");
        ballGradient.addColorStop(1, "#9e9e9e");

        ctx.beginPath();
        ctx.arc(ballX, ballY, 6, 0, Math.PI * 2);
        ctx.fillStyle = ballGradient;
        ctx.fill();
      }

      // Animation logic
      if (phase === "spinning") {
        const elapsed = (Date.now() - spinStartTime) / 1000;
        const duration = 3.5;

        if (elapsed < duration) {
          const progress = elapsed / duration;
          const easeOut = 1 - Math.pow(1 - progress, 3);

          rotation += speed * (1 - easeOut);
          ballR += ballSpeed * (1 - easeOut * 0.8);

          setCurrentRotation(rotation);
          setBallAngle(ballR);
        }
      }

      animationRef.current = requestAnimationFrame(draw);
    }

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [phase, lastResult]);

  return (
    <div className="relative flex items-center justify-center">
      {/* Outer glow */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-b from-amber-900/20 to-transparent blur-xl" />
      
      {/* Canvas */}
      <canvas
        ref={canvasRef}
        width={WHEEL_SIZE}
        height={WHEEL_SIZE}
        className="relative z-10 drop-shadow-2xl"
      />

      {/* Decorative gold ring */}
      <div
        className="absolute rounded-full border-2 border-casino-gold/40 z-20 pointer-events-none"
        style={{
          width: WHEEL_SIZE + 20,
          height: WHEEL_SIZE + 20,
          boxShadow: "0 0 20px rgba(201, 164, 53, 0.2)",
        }}
      />
    </div>
  );
}
