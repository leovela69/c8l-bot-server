// components/ads/RechargePanel.tsx (versión con MercadoPago)
'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CreditCard, Smartphone, Building, Banknote, ArrowRight, Zap, Shield } from 'lucide-react';

export interface RechargePackage {
  id: string;
  name: string;
  coins: number;
  bonusCoins: number;
  priceARS: number;
  priceUSD: number;
  priceMXN: number;
  pricePEN: number;
  popular?: boolean;
  bestDeal?: boolean;
  color: string;
}

export const RECHARGE_PACKAGES: RechargePackage[] = [
  {
    id: 'starter',
    name: 'STARTER',
    coins: 500,
    bonusCoins: 50,
    priceARS: 1500,
    priceUSD: 5,
    priceMXN: 90,
    pricePEN: 18,
    color: '#00F3FF',
    popular: true
  },
  {
    id: 'pro',
    name: 'PRO',
    coins: 1200,
    bonusCoins: 200,
    priceARS: 3500,
    priceUSD: 10,
    priceMXN: 200,
    pricePEN: 40,
    color: '#D4AF37',
    bestDeal: true
  },
  {
    id: 'legendary',
    name: 'LEGENDARY',
    coins: 3000,
    bonusCoins: 800,
    priceARS: 8000,
    priceUSD: 25,
    priceMXN: 480,
    pricePEN: 95,
    color: '#FF0055'
  },
  {
    id: 'divine',
    name: 'DIVINE',
    coins: 7500,
    bonusCoins: 2500,
    priceARS: 18000,
    priceUSD: 50,
    priceMXN: 1000,
    pricePEN: 200,
    color: '#9B59B6'
  },
  {
    id: 'immortal',
    name: 'IMMORTAL',
    coins: 20000,
    bonusCoins: 10000,
    priceARS: 45000,
    priceUSD: 120,
    priceMXN: 2500,
    pricePEN: 500,
    color: '#D4AF37'
  }
];

type Currency = 'ARS' | 'USD' | 'MXN' | 'PEN';

interface RechargePanelProps {
  userCoins: number;
  onRecharge: (packageId: string, amount: number, currency: Currency) => Promise<void>;
  isOpen: boolean;
  onClose: () => void;
}

export function RechargePanel({ userCoins, onRecharge, isOpen, onClose }: RechargePanelProps) {
  const [selectedPackage, setSelectedPackage] = useState<RechargePackage | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currency, setCurrency] = useState<Currency>('USD');

  const getPrice = (pkg: RechargePackage) => {
    switch(currency) {
      case 'ARS': return pkg.priceARS;
      case 'MXN': return pkg.priceMXN;
      case 'PEN': return pkg.pricePEN;
      default: return pkg.priceUSD;
    }
  };

  const getCurrencySymbol = () => {
    switch(currency) {
      case 'ARS': return '$';
      case 'MXN': return '$';
      case 'PEN': return 'S/';
      default: return '$';
    }
  };

  const getTotalCoins = (pkg: RechargePackage) => {
    return pkg.coins + pkg.bonusCoins;
  };

  const handleRecharge = async () => {
    if (!selectedPackage) return;
    setIsProcessing(true);
    try {
      await onRecharge(selectedPackage.id, getPrice(selectedPackage), currency);
      setSelectedPackage(null);
      setTimeout(() => onClose(), 2000);
    } catch (error) {
      console.error('Error en recarga:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, y: 50 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 50 }}
            className="bg-[#0d0d0e] border-4 border-[#D4AF37] max-w-5xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 bg-[#0d0d0e] border-b-4 border-black p-4 flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-black text-[#D4AF37] flex items-center gap-2">
                  <span>💰</span> RECARGAR COINS
                </h2>
                <p className="text-xs text-gray-500">
                  Tu saldo actual: <span className="text-[#D4AF37] font-bold">{userCoins.toLocaleString()} COINS</span>
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-10 h-10 bg-black border-2 border-gray-700 text-white hover:border-[#FF0055] transition-all"
              >
                ✕
              </button>
            </div>

            <div className="p-6">
              {/* Selector de moneda */}
              <div className="flex justify-center gap-3 mb-6">
                {[
                  { code: 'USD', label: '🇺🇸 USD', flag: '🇺🇸' },
                  { code: 'ARS', label: '🇦🇷 ARS', flag: '🇦🇷' },
                  { code: 'MXN', label: '🇲🇽 MXN', flag: '🇲🇽' },
                  { code: 'PEN', label: '🇵🇪 PEN', flag: '🇵🇪' }
                ].map(curr => (
                  <button
                    key={curr.code}
                    onClick={() => setCurrency(curr.code as Currency)}
                    className={`px-4 py-2 border-2 font-mono transition-all ${
                      currency === curr.code
                        ? 'border-[#D4AF37] bg-[#D4AF37]/20 text-[#D4AF37]'
                        : 'border-gray-700 bg-black text-gray-400 hover:border-gray-500'
                    }`}
                  >
                    {curr.flag} {curr.label}
                  </button>
                ))}
              </div>

              {/* Grid de paquetes */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                {RECHARGE_PACKAGES.map((pkg) => (
                  <motion.div
                    key={pkg.id}
                    whileHover={{ scale: 1.02 }}
                    onClick={() => setSelectedPackage(pkg)}
                    className={`relative border-4 p-5 cursor-pointer transition-all ${
                      selectedPackage?.id === pkg.id
                        ? `border-[${pkg.color}] bg-[${pkg.color}]/10`
                        : 'border-gray-800 bg-black hover:border-gray-600'
                    }`}
                    style={{ borderColor: selectedPackage?.id === pkg.id ? pkg.color : '#333' }}
                  >
                    {pkg.popular && (
                      <div className="absolute -top-3 left-4 bg-[#00F3FF] text-black text-xs font-bold px-3 py-0.5 rounded-full">
                        🔥 POPULAR
                      </div>
                    )}
                    {pkg.bestDeal && (
                      <div className="absolute -top-3 right-4 bg-[#D4AF37] text-black text-xs font-bold px-3 py-0.5 rounded-full">
                        ⭐ MEJOR OFERTA
                      </div>
                    )}
                    
                    <div className="text-center">
                      <div className="text-4xl mb-2">
                        {pkg.id === 'starter' && '🎯'}
                        {pkg.id === 'pro' && '⚡'}
                        {pkg.id === 'legendary' && '👑'}
                        {pkg.id === 'divine' && '💎'}
                        {pkg.id === 'immortal' && '🌟'}
                      </div>
                      <h3 className="text-xl font-black" style={{ color: pkg.color }}>{pkg.name}</h3>
                      <div className="text-3xl font-black text-[#D4AF37] mt-2">
                        {getTotalCoins(pkg).toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-500">COINS TOTALES</div>
                      {pkg.bonusCoins > 0 && (
                        <div className="text-xs text-green-400 mt-1">🎁 +{pkg.bonusCoins} BONUS</div>
                      )}
                      <div className="text-xl font-bold text-white mt-3">
                        {getCurrencySymbol()}{getPrice(pkg)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {currency} {currency === 'ARS' ? '(impuestos incluidos)' : ''}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Métodos de pago - MercadoPago */}
              <div className="border-t-2 border-gray-800 pt-6 mb-6">
                <h3 className="text-sm font-mono text-[#D4AF37] mb-3 flex items-center gap-2">
                  <Shield size={16} /> PAGO 100% SEGURO VÍA MERCADOPAGO
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { id: 'card', name: 'Tarjeta de Crédito', icon: <CreditCard size={20} /> },
                    { id: 'debit', name: 'Tarjeta de Débito', icon: <Smartphone size={20} /> },
                    { id: 'rapipago', name: 'Rapipago / Pago Fácil', icon: <Building size={20} /> },
                    { id: 'transfer', name: 'Transferencia', icon: <Banknote size={20} /> }
                  ].map(method => (
                    <div key={method.id} className="bg-black border border-gray-700 p-3 text-center text-gray-400 text-xs">
                      {method.icon}
                      <div className="mt-1">{method.name}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Botón de confirmación */}
              {selectedPackage && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-black p-4 border-2 border-[#D4AF37]"
                >
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <div className="text-sm text-gray-400">Vas a recibir:</div>
                      <div className="text-2xl font-black text-[#D4AF37]">
                        {getTotalCoins(selectedPackage).toLocaleString()} COINS
                      </div>
                      {selectedPackage.bonusCoins > 0 && (
                        <div className="text-xs text-green-400">🎁 Incluye {selectedPackage.bonusCoins} de bonus</div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-400">Total a pagar:</div>
                      <div className="text-2xl font-black text-white">
                        {getCurrencySymbol()}{getPrice(selectedPackage)} {currency}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={handleRecharge}
                    disabled={isProcessing}
                    className="w-full py-4 bg-[#D4AF37] text-black font-black text-lg border-2 border-black shadow-[4px_4px_0px_#000] disabled:opacity-50 transition-all hover:scale-[1.02] flex items-center justify-center gap-2"
                  >
                    {isProcessing ? (
                      '⏳ PROCESANDO...'
                    ) : (
                      <>
                        PAGAR CON MERCADOPAGO <ArrowRight size={18} />
                      </>
                    )}
                  </button>
                  <p className="text-center text-[10px] text-gray-600 mt-3">
                    🔒 Pago seguro. Los coins se acreditan instantáneamente.
                  </p>
                </motion.div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}