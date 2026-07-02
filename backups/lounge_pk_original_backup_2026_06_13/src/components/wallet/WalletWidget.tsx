// components/wallet/WalletWidget.tsx
import { Coins, Star, TrendingUp, ArrowRightLeft, ShoppingBag } from 'lucide-react';

interface WalletWidgetProps {
  coinBalance: number;
  starBalance: number;
  bidBalance: number;
}

export function WalletWidget({ coinBalance, starBalance, bidBalance }: WalletWidgetProps) {
    return (
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 w-full max-w-sm shadow-xl">
            <h3 className="text-white font-bold text-lg mb-3">💰 Monedero C8L</h3>

            <div className="space-y-3">
                {/* Saldo en Coins */}
                <div className="flex justify-between items-center p-2 bg-black/40 rounded-lg">
                    <div className="flex items-center gap-2">
                        <Coins className="text-[#D4AF37]" size={20} />
                        <span className="text-gray-300">Coins</span>
                    </div>
                    <span className="text-white font-mono font-bold">{coinBalance.toLocaleString()}</span>
                </div>

                {/* Saldo en Estrellas */}
                <div className="flex justify-between items-center p-2 bg-black/40 rounded-lg">
                    <div className="flex items-center gap-2">
                        <Star className="text-[#00F3FF]" size={20} />
                        <span className="text-gray-300">Estrellas</span>
                    </div>
                    <span className="text-white font-mono font-bold">{starBalance.toLocaleString()}</span>
                </div>

                {/* Saldo en Bidcoins - Destacado */}
                <div className="flex justify-between items-center p-2 bg-gradient-to-r from-[#D4AF37]/10 to-transparent border border-[#D4AF37]/30 rounded-lg">
                    <div className="flex items-center gap-2">
                        <TrendingUp className="text-[#D4AF37]" size={20} />
                        <span className="text-white font-bold">Bidcoins (BID)</span>
                    </div>
                    <span className="text-[#D4AF37] font-mono font-bold text-lg">{bidBalance.toLocaleString()}</span>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-4">
                <button className="flex items-center justify-center gap-2 bg-[#00F3FF] hover:bg-[#00F3FF]/80 text-black font-bold py-2 px-3 rounded-lg transition-all">
                    <ArrowRightLeft size={16} /> Convertir
                </button>
                <button className="flex items-center justify-center gap-2 bg-[#D4AF37] hover:bg-[#D4AF37]/80 text-black font-bold py-2 px-3 rounded-lg transition-all">
                    <ShoppingBag size={16} /> Tienda BID
                </button>
            </div>
        </div>
    );
}