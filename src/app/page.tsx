"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/feed");
  }, [router]);

  return (
    <div className="bg-[#030303] text-white min-h-screen flex flex-col justify-center items-center font-sans">
      <div className="w-8 h-8 border-t-2 border-[#D4AF37] rounded-full animate-spin mb-4"></div>
      <span className="text-zinc-500 font-mono text-xs uppercase tracking-widest animate-pulse">Cargando C8L TV...</span>
    </div>
  );
}
