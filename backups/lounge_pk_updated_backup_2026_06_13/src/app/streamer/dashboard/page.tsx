'use client';
import DashboardDemo from '@/components/sections/DashboardDemo';

export default function StreamerDashboardPage() {
  return (
    <div className="min-h-screen bg-black text-white p-6">
      <h1 className="text-3xl font-black text-[var(--color-neon-blue)] mb-6">
        STREAMER DASHBOARD
      </h1>
      <DashboardDemo />
    </div>
  );
}