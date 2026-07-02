// app/admin/layout.tsx
'use client';
import { useSession } from '@/hooks/useSession';
import { redirect, usePathname } from 'next/navigation';
import { Shield, BarChart3, Settings, Flag, Users, Coins, Activity } from 'lucide-react';
import Link from 'next/link';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useSession();
  if (!isLoading && (!user || user.role !== 'admin')) redirect('/');

  return (
    <div className="flex min-h-screen bg-black">
      <aside className="w-64 border-r border-gray-800 p-4">
        <nav className="space-y-2">
          <AdminNavItem href="/admin" icon={<Activity size={18} />}>Dashboard</AdminNavItem>
          <AdminNavItem href="/admin/reports" icon={<Flag size={18} />}>Reportes</AdminNavItem>
          <AdminNavItem href="/admin/users" icon={<Users size={18} />}>Usuarios</AdminNavItem>
          <AdminNavItem href="/admin/economy" icon={<Coins size={18} />}>Economía</AdminNavItem>
          <AdminNavItem href="/admin/agents" icon={<Settings size={18} />}>Subagentes</AdminNavItem>
          <AdminNavItem href="/admin/analytics" icon={<BarChart3 size={18} />}>Analytics</AdminNavItem>
        </nav>
      </aside>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}

function AdminNavItem({ href, icon, children }: { href: string; icon: React.ReactNode; children: React.ReactNode }) {
  const pathname = usePathname();
  const isActive = pathname === href;
  return (
    <Link href={href} className={`flex items-center gap-3 px-3 py-2 rounded-lg font-bold text-sm transition-colors ${isActive ? 'bg-[#D4AF37] text-black' : 'text-gray-400 hover:text-white hover:bg-gray-900'}`}>
      {icon}
      <span>{children}</span>
    </Link>
  );
}