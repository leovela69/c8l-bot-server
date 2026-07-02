"use client";
import React, { useState, useEffect } from "react";
import { useApp } from "../../context/AppContext";
import { Monitor, Tablet, Smartphone, RotateCcw } from "lucide-react";
import { usePathname } from "next/navigation";

interface DeviceSimulatorProps {
  children: React.ReactNode;
}

export default function DeviceSimulator({ children }: DeviceSimulatorProps) {
  const { deviceFormat, setDeviceFormat } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  // Reset scroll on the main scroll container and window when path changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const mainContainer = document.querySelector(".scroll-container");
      if (mainContainer) {
        mainContainer.scrollTop = 0;
      }
      window.scrollTo(0, 0);
    }
  }, [pathname]);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || deviceFormat === "unset") {
    // If layout is unset or client is not mounted yet, render children directly
    return <>{children}</>;
  }

  const isDark = true; // Default to dark aesthetic for cyberpunk theme

  return (
    <div className={`min-h-screen transition-colors duration-500 w-full flex flex-col justify-between ${
      deviceFormat === "pc" 
        ? "bg-[#030303]" 
        : "bg-gradient-to-br from-[#0b0c10] via-[#050608] to-[#120e17] justify-center items-center py-16 px-4"
    }`}>
      {/* Floating Collapsible Viewport Simulator Controller Bubble (Left Side) */}
      <div className="fixed left-4 top-1/2 -translate-y-1/2 z-[99999] flex items-center select-none font-mono">
        {/* Toggle Bubble Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`w-12 h-12 rounded-full border-2 bg-black/95 backdrop-blur-md flex items-center justify-center cursor-pointer transition-all duration-300 z-10 ${
            isOpen 
              ? "border-[#00F3FF] shadow-[0_0_20px_rgba(0,243,255,0.4)] text-[#00F3FF]" 
              : "border-[#00F3FF]/40 text-[#00F3FF]/70 hover:border-[#00F3FF] hover:text-[#00F3FF] hover:shadow-[0_0_15px_rgba(0,243,255,0.25)]"
          }`}
          title={isOpen ? "Cerrar simulador" : "Cambiar formato de pantalla (PC, Tablet, Móvil)"}
        >
          {deviceFormat === "pc" ? (
            <Monitor size={18} />
          ) : deviceFormat === "tablet" ? (
            <Tablet size={18} />
          ) : (
            <Smartphone size={18} />
          )}
          
          {/* Pulsing notification circle when closed */}
          {!isOpen && (
            <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border border-black animate-ping"></span>
          )}
        </button>

        {/* Collapsible Panel */}
        <div className={`ml-3 flex flex-col gap-1.5 p-2 px-3 border-2 border-[#00F3FF]/30 bg-black/95 backdrop-blur-md rounded-2xl shadow-[0_0_25px_rgba(0,243,255,0.25)] text-[10px] transition-all duration-300 origin-left ${
          isOpen 
            ? "scale-100 opacity-100 pointer-events-auto" 
            : "scale-75 opacity-0 pointer-events-none w-0 h-0 overflow-hidden ml-0 border-none shadow-none"
        }`}>
          <span className="text-[#00F3FF] font-black uppercase tracking-widest text-[8px] border-b border-[#00F3FF]/20 pb-1 mb-1 text-center">
            VISTA C8L
          </span>
          
          <button
            onClick={() => setDeviceFormat("pc")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer font-bold w-full ${
              deviceFormat === "pc" 
                ? "bg-[#00F3FF] text-black shadow-[0_0_10px_rgba(0,243,255,0.4)]" 
                : "text-zinc-400 hover:text-white hover:bg-zinc-900"
            }`}
            title="Ver formato PC (Pantalla Completa)"
          >
            <Monitor size={12} />
            <span>PC</span>
          </button>

          <button
            onClick={() => setDeviceFormat("tablet")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer font-bold w-full ${
              deviceFormat === "tablet" 
                ? "bg-[#D4AF37] text-black shadow-[0_0_10px_rgba(212,175,55,0.4)]" 
                : "text-zinc-400 hover:text-white hover:bg-zinc-900"
            }`}
            title="Ver formato Tablet (Simulador 4:3)"
          >
            <Tablet size={12} />
            <span>Tablet</span>
          </button>

          <button
            onClick={() => setDeviceFormat("phone")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer font-bold w-full ${
              deviceFormat === "phone" 
                ? "bg-[#FF007F] text-white shadow-[0_0_10px_rgba(255,0,127,0.4)]" 
                : "text-zinc-400 hover:text-white hover:bg-zinc-900"
            }`}
            title="Ver formato Teléfono (Simulador 9:19.5)"
          >
            <Smartphone size={12} />
            <span>Móvil</span>
          </button>

          <div className="h-[1px] bg-zinc-800 my-1"></div>

          <button
            onClick={() => setDeviceFormat("unset")}
            className="text-red-500 hover:text-red-400 hover:bg-red-500/10 flex items-center justify-center gap-1 py-1.5 rounded-lg transition-all cursor-pointer font-bold"
            title="Reiniciar selección de entrada"
          >
            <RotateCcw size={11} />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Screen Frame Wrapping */}
      {deviceFormat === "pc" ? (
        <div className="w-full flex-grow flex flex-col">
          {children}
        </div>
      ) : deviceFormat === "tablet" ? (
        /* TABLET DEVICE MOCKUP WRAPPER */
        <div className="relative w-full max-w-[850px] aspect-[4/3] border-[14px] border-zinc-900 rounded-[28px] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.95)] bg-[#030303] overflow-hidden flex flex-col group transition-all duration-500 ring-2 ring-[#D4AF37]/20 hover:ring-[#D4AF37]/50 max-h-[80vh] my-auto">
          {/* Top bezel camera */}
          <div className="absolute top-[6px] left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-zinc-800 z-50"></div>
          {/* Scrollable screen */}
          <div className="w-full h-full overflow-y-auto overflow-x-hidden relative scroll-container flex flex-col" style={{ transform: "translate3d(0,0,0)" }}>
            {children}
          </div>
        </div>
      ) : (
        /* PHONE DEVICE MOCKUP WRAPPER */
        <div className="relative w-full max-w-[390px] aspect-[9/19] border-[12px] border-zinc-950 rounded-[44px] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.95)] bg-[#030303] overflow-hidden flex flex-col group transition-all duration-500 ring-2 ring-[#FF007F]/20 hover:ring-[#FF007F]/50 max-h-[82vh] my-auto">
          {/* Phone speaker notch */}
          <div className="absolute top-[4px] left-1/2 -translate-x-1/2 w-24 h-5 bg-zinc-950 rounded-b-xl z-[999] flex items-center justify-center">
            <div className="w-8 h-1 bg-zinc-800 rounded-full mb-1"></div>
            <div className="w-2 h-2 bg-zinc-900 rounded-full mb-1 absolute right-3"></div>
          </div>
          {/* Scrollable screen */}
          <div className="w-full h-full overflow-y-auto overflow-x-hidden relative scrollbar-none pt-4 flex flex-col flex-grow" style={{ transform: "translate3d(0,0,0)" }}>
            {children}
          </div>
          {/* Home indicator bar at bottom bezel */}
          <div className="absolute bottom-[4px] left-1/2 -translate-x-1/2 w-28 h-1 bg-zinc-800 rounded-full z-50"></div>
        </div>
      )}
    </div>
  );
}
