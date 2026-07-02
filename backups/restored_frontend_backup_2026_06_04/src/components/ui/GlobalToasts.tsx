"use client";
import { useApp } from "../../context/AppContext";

export default function GlobalToasts() {
  const { toasts, dismissToast } = useApp();

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto p-4 rounded-xl shadow-xl flex items-center justify-between border backdrop-blur-md transition-all duration-300 ${
            toast.type === "success"
              ? "bg-emerald-950/80 border-emerald-500/30 text-emerald-400"
              : toast.type === "error"
              ? "bg-red-950/80 border-red-500/30 text-red-400"
              : "bg-zinc-950/80 border-zinc-500/30 text-zinc-300"
          }`}
          style={{
            boxShadow: toast.type === "success" ? "0 0 15px rgba(16, 185, 129, 0.1)" : "none",
          }}
        >
          <span className="text-sm font-sans font-medium">{toast.message}</span>
          <button
            onClick={() => dismissToast(toast.id)}
            className="ml-4 text-zinc-400 hover:text-zinc-200 transition-colors text-xs font-bold font-mono"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
