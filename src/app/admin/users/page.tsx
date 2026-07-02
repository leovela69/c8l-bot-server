// app/admin/users/page.tsx
'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Search, Ban, CheckCircle, Shield } from 'lucide-react';

export default function UsersManagement() {
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    let query = supabase.from('users').select('id, email, name, role, coins, level, last_active, is_active');
    if (search) query = query.ilike('name', `%${search}%`);
    const { data } = await query.order('created_at', { ascending: false }).limit(50);
    setUsers(data || []);
  }

  async function toggleBan(userId: string, currentStatus: boolean) {
    await supabase.from('users').update({ is_active: !currentStatus }).eq('id', userId);
    loadUsers();
  }

  async function changeRole(userId: string, newRole: string) {
    await supabase.from('users').update({ role: newRole }).eq('id', userId);
    loadUsers();
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-black text-[#D4AF37]">Usuarios</h1>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Buscar usuario..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && loadUsers()}
            className="pl-9 pr-3 py-1.5 bg-gray-900 border border-gray-700 rounded-lg text-sm"
          />
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-800">
            <tr className="text-left text-gray-500">
              <th className="pb-2">Nombre</th>
              <th className="pb-2">Email</th>
              <th className="pb-2">Rol</th>
              <th className="pb-2">Coins</th>
              <th className="pb-2">Nivel</th>
              <th className="pb-2">Estado</th>
              <th className="pb-2">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id} className="border-b border-gray-800">
                <td className="py-3 font-medium">{user.name}</td>
                <td className="py-3 text-gray-400">{user.email}</td>
                <td className="py-3">
                  <select value={user.role} onChange={(e) => changeRole(user.id, e.target.value)} className="bg-black border border-gray-700 rounded px-2 py-1 text-xs">
                    <option value="user">Usuario</option>
                    <option value="moderator">Moderador</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>
                <td className="py-3">{user.coins}</td>
                <td className="py-3">{user.level}</td>
                <td className="py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs ${user.is_active ? 'bg-green-600' : 'bg-red-600'}`}>
                    {user.is_active ? 'Activo' : 'Bloqueado'}
                  </span>
                </td>
                <td className="py-3">
                  <button onClick={() => toggleBan(user.id, user.is_active)} className="p-1 hover:text-[#D4AF37]">
                    {user.is_active ? <Ban size={16} /> : <CheckCircle size={16} />}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}