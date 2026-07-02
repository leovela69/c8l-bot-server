// components/wallet/WalletWidget.tsx
import React, { useState } from 'react';
import { Coins, Star, TrendingUp, ArrowRightLeft, ShoppingBag, Cpu, ShieldCheck } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export function WalletWidget() {
    const { c8lCoins, c8lDiamonds, bizcoinBalance, convertCoinsToBizcoins } = useApp();
    const [swapAmount, setSwapAmount] = useState<string>('150');
    const [showSwap, setShowSwap] = useState<boolean>(false);

    const handleSwap = (e: React.FormEvent) => {
        e.preventDefault();
        const amount = parseInt(swapAmount, 10);
        if (isNaN(amount) || amount < 150) return;
        const success = convertCoinsToBizcoins(amount);
        if (success) {
            setSwapAmount('150');
            setShowSwap(false);
        }
    };

    const bizcoinsToGet = Math.floor(parseInt(swapAmount || '0', 10) / 150);

    return (
        <div className="bg-[#131313] border border-zinc-800 rounded-3xl p-5 w-full max-w-sm shadow-2xl relative overflow-hidden">
            {/* Background cyber pattern */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,_rgba(0,243,255,0.01)_50%)] bg-[size:100%_4px] pointer-events-none" />

            <div className="relative z-10">
                <div className="flex justify-between items-center mb-4 pb-2 border-b border-zinc-800/60">
                    <h3 className="text-[#D4AF37] font-display font-black text-lg tracking-wider uppercase flex items-center gap-2">
                        <ShieldCheck size={20} className="text-[#D4AF37]" /> C8L SECURE VAULT
                    </h3>
                    <span className="text-[8px] font-mono text-zinc-500 uppercase">SYS_ACTIVE</span>
                </div>

                <div className="space-y-3">
                    {/* Saldo en Coins */}
                    <div className="flex justify-between items-center p-3 bg-zinc-950/60 border border-zinc-850 rounded-xl">
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-[#D4AF37]/10 flex items-center justify-center">
                                <Coins className="text-[#D4AF37]" size={18} />
                            </div>
                            <div>
                                <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">C8L Coins</span>
                                <span className="text-zinc-300 text-xs font-bold font-mono">COIN_NODE</span>
                            </div>
                        </div>
                        <span className="text-white font-mono font-black text-base">{c8lCoins.toLocaleString()}</span>
                    </div>

                    {/* Saldo en Diamantes */}
                    <div className="flex justify-between items-center p-3 bg-zinc-950/60 border border-zinc-850 rounded-xl">
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                                <Star className="text-[#00F3FF]" size={18} />
                            </div>
                            <div>
                                <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">C8L Diamonds</span>
                                <span className="text-zinc-300 text-xs font-bold font-mono">DIAMOND_NODE</span>
                            </div>
                        </div>
                        <span className="text-white font-mono font-black text-base">{c8lDiamonds.toLocaleString()}</span>
                    </div>

                    {/* Saldo en Bizcoin - Criptomoneda Premium */}
                    <div className="flex justify-between items-center p-3 bg-gradient-to-br from-purple-950/20 to-zinc-950 border border-purple-500/30 rounded-xl shadow-[0_0_15px_rgba(168,85,247,0.05)]">
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
                                <Cpu className="text-purple-400" size={18} />
                            </div>
                            <div>
                                <span className="text-[10px] text-purple-400 uppercase tracking-wider font-black block">C8L Bizcoin (BZCN)</span>
                                <span className="text-zinc-400 text-[9px] font-mono">DECENTRALIZED_CORE</span>
                            </div>
                        </div>
                        <div className="text-right">
                            <span className="text-purple-400 font-mono font-black text-lg block">{bizcoinBalance.toLocaleString()}</span>
                            <span className="text-[8px] text-zinc-500">BZCN</span>
                        </div>
                    </div>
                </div>

                {/* Swap Panel */}
                {showSwap && (
                    <form onSubmit={handleSwap} className="mt-4 p-3 bg-zinc-950 border border-zinc-800 rounded-2xl flex flex-col gap-2.5 animate-fadeIn">
                        <div className="flex justify-between text-[9px] text-zinc-400 font-bold uppercase tracking-wider">
                            <span>Intercambiar Coins a Bizcoin</span>
                            <span className="text-purple-400">Tasa: 150 Coins = 1 BZCN</span>
                        </div>
                        <div className="flex gap-2 items-center">
                            <input 
                                type="number" 
                                value={swapAmount}
                                onChange={(e) => setSwapAmount(e.target.value)}
                                min="150" 
                                step="150"
                                className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg py-1.5 px-3 text-xs text-white font-mono focus:ring-1 focus:ring-purple-500 outline-none"
                            />
                            <div className="text-zinc-500 text-xs">➡️</div>
                            <div className="bg-purple-950/40 border border-purple-500/20 rounded-lg py-1.5 px-3 text-xs text-purple-300 font-mono font-bold">
                                {bizcoinsToGet} BZCN
                            </div>
                        </div>
                        <button 
                            type="submit" 
                            disabled={parseInt(swapAmount, 10) > c8lCoins}
                            className="w-full py-2 bg-purple-600 hover:bg-purple-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white font-display font-black text-[10px] uppercase tracking-wider rounded-lg transition-all border border-purple-400/20"
                        >
                            CONFIRMAR SWAP
                        </button>
                    </form>
                )}

                <div className="grid grid-cols-2 gap-3 mt-4">
                    <button 
                        onClick={() => setShowSwap(!showSwap)}
                        className="flex items-center justify-center gap-2 bg-[#00F3FF] hover:bg-[#00F3FF]/80 text-black font-display font-black text-[10px] uppercase tracking-wider py-2.5 px-3 rounded-xl transition-all"
                    >
                        <ArrowRightLeft size={14} /> SWAP BZCN
                    </button>
                    <button className="flex items-center justify-center gap-2 bg-[#D4AF37] hover:bg-[#D4AF37]/80 text-black font-display font-black text-[10px] uppercase tracking-wider py-2.5 px-3 rounded-xl transition-all">
                        <ShoppingBag size={14} /> TIENDA VAULT
                    </button>
                </div>
            </div>
        </div>
    );
}