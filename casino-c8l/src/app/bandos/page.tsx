'use client';
import { useState } from 'react';
import { FactionList } from '@/components/factions/FactionList';
import { FactionTasks } from '@/components/factions/FactionTasks';
import { FactionBattle } from '@/components/factions/FactionBattle';
import { UserWallet } from '@/components/wallet/UserWallet';
import { UserBackpack } from '@/components/backpack/UserBackpack';

export default function BandosPage() {
  const [selectedFaction, setSelectedFaction] = useState(null);
  const [activeTab, setActiveTab] = useState('members');

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <FactionList userId="usuario-id" onSelectFaction={setSelectedFaction} />
        </div>
        <div className="lg:col-span-2 space-y-6">
          {selectedFaction && (
            <>
              <div className="flex gap-2 border-b border-gray-800 pb-2 flex-wrap">
                {['members', 'tasks', 'battles', 'wallet', 'backpack'].map(tab => (
                  <button key={tab} onClick={() => setActiveTab(tab)}
                    className={`px-4 py-2 rounded-lg font-bold transition ${
                      activeTab === tab ? 'bg-c8l-gold text-black' : 'text-gray-400 hover:text-white'
                    }`}>
                    {tab === 'members' && '👥 Miembros'}
                    {tab === 'tasks' && '📋 Tareas'}
                    {tab === 'battles' && '⚔️ Batallas'}
                    {tab === 'wallet' && '💰 Monedero'}
                    {tab === 'backpack' && '🎒 Mochila'}
                  </button>
                ))}
              </div>
              {activeTab === 'tasks' && <FactionTasks factionId={selectedFaction} userId="usuario-id" />}
              {activeTab === 'battles' && <FactionBattle factionId={selectedFaction} userId="usuario-id" />}
              {activeTab === 'wallet' && <UserWallet userId="usuario-id" />}
              {activeTab === 'backpack' && <UserBackpack userId="usuario-id" />}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
