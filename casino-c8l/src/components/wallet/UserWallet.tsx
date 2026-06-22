'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { motion } from 'framer-motion';

export function UserWallet({ userId }) {
  const [wallet, setWallet] = useState({ coins: 0, diamonds: 0 });
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState(0);
  const [withdrawMethod, setWithdrawMethod] = useState('bank');

  useEffect(() => { loadWallet(); loadTransactions(); }, [userId]);

  const loadWallet = async () => {
    const { data } = await supabase.from('user_wallets').select('*').eq('user_id', userId).single();
    if (data) setWallet(data);
    setLoading(false);
  };

  const loadTransactions = async () => {
    const { data } = await supabase.from('wallet_transactions').select('*')
      .eq('user_id', userId).order('created_at', { ascending: false }).limit(20);
    setTransactions(data || []);
  };

  const requestWithdrawal = async () => {
    if (withdrawAmount > wallet.diamonds) { alert('Saldo insuficiente'); return; }
    await supabase.from('withdrawal_requests').insert({
      user_id: userId, amount: withdrawAmount,
      currency_type: 'diamond', method: withdrawMethod,
      account_details: { account: 'Por confirmar' }
    });
    alert('Solicitud de retiro enviada. Será procesada en 24-48 horas.');
    setShowWithdraw(false); loadWallet();
  };

  const convertCoinsToDiamonds = async (amount) => {
    if (amount > wallet.coins) { alert('Saldo insuficiente'); return; }
    const diamonds = Math.floor(amount / 100);
    await supabase.rpc('convert_coins_to_diamonds', {
      p_user_id: userId, p_coins_amount: amount, p_diamonds_amount: diamonds
    });
    loadWallet(); loadTransactions();
  };


  return (
    <div className="bg-gradient-to-br from-black to-purple-900/30 p-6 rounded-2xl border-2 border-c8l-gold shadow-[0_0_30px_rgba(212,175,55,0.3)]">
      <h2 className="text-2xl font-black text-c8l-gold mb-4 text-center">💰 MONEDERO C8L</h2>
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-black/50 p-4 rounded-lg border border-c8l-gold/30 text-center">
          <div className="text-3xl">🪙</div>
          <div className="text-2xl font-bold text-c8l-gold">{wallet.coins.toLocaleString()}</div>
          <div className="text-xs text-gray-400">Coins</div>
          <button onClick={() => convertCoinsToDiamonds(100)}
            className="mt-2 px-3 py-1 bg-c8l-gold/20 text-c8l-gold border border-c8l-gold rounded-lg text-xs">
            Convertir 100→1 💎
          </button>
        </div>
        <div className="bg-black/50 p-4 rounded-lg border border-purple-500/30 text-center">
          <div className="text-3xl">💎</div>
          <div className="text-2xl font-bold text-purple-400">{wallet.diamonds.toLocaleString()}</div>
          <div className="text-xs text-gray-400">Diamantes</div>
          <button onClick={() => setShowWithdraw(true)}
            className="mt-2 px-3 py-1 bg-purple-500/20 text-purple-400 border border-purple-500 rounded-lg text-xs">
            Retirar 💎
          </button>
        </div>
      </div>

      <div className="bg-black/50 p-4 rounded-lg border border-c8l-gold/30">
        <h3 className="text-sm font-bold text-c8l-gold mb-2">📊 Últimos Movimientos</h3>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {transactions.map(tx => (
            <div key={tx.id} className="flex justify-between items-center text-sm border-b border-gray-800 pb-2">
              <div className="flex items-center gap-2">
                <span className={tx.type === 'earn' ? 'text-green-500' : 'text-red-500'}>
                  {tx.type === 'earn' ? '↓' : '↑'}
                </span>
                <span className="text-gray-400">{tx.description}</span>
              </div>
              <div className={`font-bold ${tx.type === 'earn' ? 'text-green-500' : 'text-red-500'}`}>
                {tx.type === 'earn' ? '+' : '-'}{tx.amount} {tx.currency_type === 'coin' ? '🪙' : '💎'}
              </div>
            </div>
          ))}
        </div>
      </div>

      {showWithdraw && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border-4 border-c8l-gold p-6 rounded-2xl max-w-md w-full">
            <h3 className="text-xl font-bold text-c8l-gold mb-4">Retirar Diamantes</h3>
            <div className="mb-4">
              <label className="text-sm text-gray-400">Cantidad</label>
              <input type="number" value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(Number(e.target.value))}
                className="w-full bg-black border border-gray-700 rounded-lg px-4 py-2 text-white" placeholder="0" />
            </div>
            <div className="mb-4">
              <label className="text-sm text-gray-400">Método</label>
              <select value={withdrawMethod} onChange={(e) => setWithdrawMethod(e.target.value)}
                className="w-full bg-black border border-gray-700 rounded-lg px-4 py-2 text-white">
                <option value="bank">Transferencia Bancaria</option>
                <option value="paypal">PayPal</option>
                <option value="crypto">Criptomoneda</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button onClick={requestWithdrawal}
                className="flex-1 py-2 bg-c8l-gold text-black font-bold rounded-lg">Solicitar Retiro</button>
              <button onClick={() => setShowWithdraw(false)}
                className="px-4 py-2 bg-gray-700 text-white rounded-lg">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
