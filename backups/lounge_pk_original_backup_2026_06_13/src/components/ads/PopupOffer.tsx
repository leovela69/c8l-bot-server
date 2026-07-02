// components/ads/PopupOffer.tsx
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Gift, Zap, Crown, Timer } from 'lucide-react';

interface PopupOfferProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: () => void;
  offerData?: {
    title: string;
    description: string;
    coins: number;
    bonusCoins: number;
    price: number;
    timerSeconds?: number;
    icon: string;
  };
}

const DEFAULT_OFFER = {
  title: '🔥 OFERTA RELÁMPAGO 🔥',
  description: '¡Solo por hoy! Duplica tus coins al recargar',
  coins: 5000,
  bonusCoins: 5000,
  price: 25,
  timerSeconds: 3600, // 1 hora
  icon: '⚡'
};

export function PopupOffer({ isOpen, onClose, onAccept, offerData = DEFAULT_OFFER }: PopupOfferProps) {
  const [timeLeft, setTimeLeft] = useState(offerData.timerSeconds || 3600);
  const [isClosing, setIsClosing] = useState(false);

  // Timer倒计时
  useEffect(() => {
    if (!isOpen) return;
    
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsClosing(true);
          setTimeout(() => {
            onClose();
            setIsClosing(false);
          }, 3000);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, onClose]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAccept = () => {
    onAccept();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && !isClosing && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.8, y: 50, rotateX: -15 }}
            animate={{ scale: 1, y: 0, rotateX: 0 }}
            exit={{ scale: 0.8, y: 50, rotateX: -15 }}
            className="relative max-w-md w-full border-4 border-[#D4AF37] bg-gradient-to-b from-[#0d0d0e] to-black shadow-[20px_20px_0px_#000]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Botón cerrar */}
            <button
              onClick={onClose}
              className="absolute top-2 right-2 w-8 h-8 bg-black border-2 border-gray-700 text-white hover:border-[#FF0055] transition-all z-10"
            >
              <X size={16} className="mx-auto" />
            </button>

            {/* Header con animación */}
            <div className="text-center pt-8 pb-4 border-b-2 border-gray-800">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
                transition={{ duration: 0.5, repeat: Infinity }}
                className="text-7xl mb-3"
              >
                {offerData.icon}
              </motion.div>
              <h2 className="text-2xl font-black text-[#D4AF37]">{offerData.title}</h2>
              <p className="text-sm text-gray-400 mt-1">{offerData.description}</p>
            </div>

            {/* Contenido de la oferta */}
            <div className="p-6">
              {/* Timer */}
              <div className="bg-black p-3 text-center mb-6 border-2 border-[#FF0055]">
                <div className="flex items-center justify-center gap-2 text-[#FF0055] text-sm font-mono mb-1">
                  <Timer size={16} />
                  <span>TIEMPO RESTANTE</span>
                </div>
                <div className="text-3xl font-mono font-black text-white">
                  {formatTime(timeLeft)}
                </div>
              </div>

              {/* Paquete destacado */}
              <div className="bg-gradient-to-r from-[#D4AF37]/20 to-transparent p-4 mb-6 border-l-4 border-[#D4AF37]">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-xs text-gray-400">PAQUETE ESPECIAL</div>
                    <div className="text-2xl font-black text-white">
                      {offerData.coins.toLocaleString()} + {offerData.bonusCoins.toLocaleString()}
                    </div>
                    <div className="text-xs text-green-400">BONUS {offerData.bonusCoins.toLocaleString()} COINS</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-400">PRECIO</div>
                    <div className="text-3xl font-black text-[#D4AF37]">${offerData.price}</div>
                    <div className="text-xs text-gray-500 line-through">${(offerData.price * 2)} USD</div>
                  </div>
                </div>
              </div>

              {/* Beneficios adicionales */}
              <div className="space-y-2 mb-6">
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <Gift size={14} className="text-[#D4AF37]" />
                  <span>• 5 Giros gratis en Slots Olimpo</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <Zap size={14} className="text-[#00F3FF]" />
                  <span>• Multiplicador x2 por 24 horas</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <Crown size={14} className="text-[#D4AF37]" />
                  <span>• Badge exclusivo "Leyenda C8L"</span>
                </div>
              </div>

              {/* Botones de acción */}
              <div className="flex gap-3">
                <button
                  onClick={handleAccept}
                  className="flex-1 py-4 bg-[#D4AF37] text-black font-black text-lg border-2 border-black shadow-[4px_4px_0px_#000] hover:scale-[1.02] transition-all"
                >
                  APROVECHAR OFERTA
                </button>
                <button
                  onClick={onClose}
                  className="px-6 py-4 bg-gray-800 text-white font-mono text-sm hover:bg-gray-700 transition-all"
                >
                  AHORA NO
                </button>
              </div>

              <p className="text-center text-[10px] text-gray-600 mt-4">
                Oferta válida solo por {Math.floor((offerData.timerSeconds || 3600) / 60)} minutos. Sujeto a términos y condiciones.
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}