"use client";
import { useEffect, useRef } from "react";

export default function PremiumEffects() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Detect touch device
    const touch = window.matchMedia('(pointer: coarse)').matches;
    if (touch) return;

    const cursor = cursorRef.current;
    const dot = dotRef.current;
    if (!cursor || !dot) return;

    let mouseX = 0;
    let mouseY = 0;
    let cursorX = 0;
    let cursorY = 0;
    let isHidden = true;

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      
      // Update dot instantly
      dot.style.left = `${mouseX}px`;
      dot.style.top = `${mouseY}px`;
      
      if (isHidden) {
        cursor.style.opacity = "1";
        dot.style.opacity = "1";
        isHidden = false;
      }
    };

    const handleMouseLeave = () => {
      cursor.style.opacity = "0";
      dot.style.opacity = "0";
      isHidden = true;
    };

    window.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseleave", handleMouseLeave);

    // Smooth follow loop
    let animId: number;
    const followMouse = () => {
      const dx = mouseX - cursorX;
      const dy = mouseY - cursorY;
      cursorX += dx * 0.15;
      cursorY += dy * 0.15;
      
      cursor.style.left = `${cursorX}px`;
      cursor.style.top = `${cursorY}px`;
      
      animId = requestAnimationFrame(followMouse);
    };
    followMouse();

    // Hover listeners
    const handleMouseEnter = () => cursor.classList.add("hover");
    const handleMouseLeaveInteractive = () => cursor.classList.remove("hover");

    const addHoverListeners = () => {
      const interactives = document.querySelectorAll('a, button, input, textarea, select, [role="button"]');
      interactives.forEach(el => {
        el.removeEventListener('mouseenter', handleMouseEnter);
        el.removeEventListener('mouseleave', handleMouseLeaveInteractive);
        el.addEventListener('mouseenter', handleMouseEnter);
        el.addEventListener('mouseleave', handleMouseLeaveInteractive);
      });
    };

    addHoverListeners();
    const observer = new MutationObserver(addHoverListeners);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
      cancelAnimationFrame(animId);
      observer.disconnect();
    };
  }, []);

  return (
    <>
      {/* Noise Overlay */}
      <div className="noise-overlay" />

      {/* Animated Digital Grid Background */}
      <div className="digital-grid-animated" />

      {/* Hologram Scanline */}
      <div className="hologram-scanline" />

      {/* Premium Custom Cursor */}
      <div
        ref={cursorRef}
        className="custom-cursor opacity-0"
        style={{
          position: "fixed",
          transform: "translate(-50%, -50%)",
          pointerEvents: "none",
          zIndex: 10000,
          transition: "width 0.3s, height 0.3s, background-color 0.3s, border-color 0.3s, opacity 0.3s",
        }}
      />
      <div
        ref={dotRef}
        className="custom-cursor-dot opacity-0"
        style={{
          position: "fixed",
          transform: "translate(-50%, -50%)",
          pointerEvents: "none",
          zIndex: 10001,
          transition: "opacity 0.3s",
        }}
      />
    </>
  );
}
