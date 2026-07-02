"use client";

import React, { useState, useEffect } from "react";
import WatchClient from "./WatchClient";

export default function WatchPage() {
  const [videoId, setVideoId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const v = params.get("v") || "mock-1";
      setVideoId(v);
    }
  }, []);

  if (!videoId) {
    return (
      <div className="min-h-screen bg-[#030303] text-white flex flex-col items-center justify-center font-mono">
        <div className="w-10 h-10 border-t-2 border-[#00F3FF] rounded-full animate-spin"></div>
        <span className="text-zinc-500 text-xs uppercase tracking-widest mt-4">
          Cargando reproductor de video...
        </span>
      </div>
    );
  }

  return <WatchClient id={videoId} />;
}
