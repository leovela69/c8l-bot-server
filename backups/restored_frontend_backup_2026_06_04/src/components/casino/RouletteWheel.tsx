// components/casino/RouletteWheel.tsx
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const NUMBERS = [
  { value: 0, color: 'green', label: '0' },
  { value: 1, color: 'red', label: '1' }, { value: 2, color: 'black', label: '2' },
  { value: 3, color: 'red', label: '3' }, { value: 4, color: 'black', label: '4' },
  { value: 5, color: 'red', label: '5' }, { value: 6, color: 'black', label: '6' },
  { value: 7, color: 'red', label: '7' }, { value: 8, color: 'black', label: '8' },
  { value: 9, color: 'red', label: '9' }, { value: 10, color: 'black', label: '10' },
  { value: 11, color: 'black', label: '11' }, { value: 12, color: 'red', label: '12' },
  { value: 13, color: 'black', label: '13' }, { value: 14, color: 'red', label: '14' },
  { value: 15, color: 'black', label: '15' }, { value: 16, color: 'red', label: '16' },
  { value: 17, color: 'black', label: '17' }, { value: 18, color: 'red', label: '18' },
  { value: 19, color: 'red', label: '19' }, { value: 20, color: 'black', label: '20' },
  { value: 21, color: 'red', label: '21' }, { value: 22, color: 'black', label: '22' },
  { value: 23, color: 'red', label: '23' }, { value: 24, color: 'black', label: '24' },
  { value: 25, color: 'red', label: '25' }, { value: 26, color: 'black', label: '26' },
  { value: 27, color: 'red', label: '27' }, { value: 28, color: 'black', label: '28' },
  { value: 29, color: 'black', label: '29' }, { value: 30, color: 'red', label: '30' },
  { value: 31, color: 'black', label: '31' }, { value: 32, color: 'red', label: '32' },
  { value: 33, color: 'black', label: '33' }, { value: 34, color: 'red', label: '34' },
  { value: 35, color: 'black', label: '35' }, { value: 36, color: 'red', label: '36' }
];

const BET_OPTIONS = [
  { id: 'red', label: '🔴 ROJO', payout: 2, color: 'red' },
  { id: 'black', label: '⚫ NEGRO', payout: 2, color: 'black' },
  { id: 'odd', label: '🎲 IMPAR', payout: 2 },
  { id: 'even', label: '🎲 PAR', payout: 2 },
  { id: '1-12', label: '📊 1ra DOCENA', payout: 3 },
  { id: '13-24', label: '📊 2da DOCENA', payout: 3 },
  { id: '25-36', label: '📊 3ra DOCENA', payout: 3 }
];

interface RouletteProps {
  userCoins: number;
  setUserCoins: React.Dispatch<React.SetStateAction<number>>;
  onWin?: (amount: number) => void;
}

export function RouletteWheel({ userCoins, setUserCoins, onWin }: RouletteProps) {
  const [isSpinning, setIsSpinning] = useState(false);
  const [bets, setBets] = useState<Record<string, number>>({});
  const [betAmount, setBetAmount] = useState(50);
  const [result, setResult] = useState<{ winningNumber: number; winnings: number; winDetails: string[] } | null>(null);
  const [spinAngle, setSpinAngle] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);

  const placeBet = (betId: string | number) => {
    if (userCoins < betAmount) {
      alert('❌ Coins insuficientes');
      return;
    }
    
    const key = betId.toString();
    setBets(prev => ({
      ...prev,
      [key]: (prev[key] || 0) + betAmount
    }));
    setUserCoins(userCoins - betAmount);
  };

  const removeBet = (betId: string | number) => {
    const key = betId.toString();
    if (bets[key]) {
      setUserCoins(userCoins + bets[key]);
      const newBets = { ...bets };
      delete newBets[key];
      setBets(newBets);
    }
  };

  const spin = async () => {
    if (isSpinning || Object.keys(bets).length === 0) return;
    
    setIsSpinning(true);
    
    // Número ganador aleatorio (0-36)
    const randomIndex = Math.floor(Math.random() * 37);
    const winningSlot = NUMBERS[randomIndex];
    
    // Animación de giro
    const spins = 10 + Math.random() * 8;
    const finalAngle = 360 * spins + (randomIndex * (360 / 37));
    setSpinAngle(finalAngle);
    
    // Esperar animación
    await new Promise(resolve => setTimeout(resolve, 2500));
    
    // Calcular ganancias
    let winnings = 0;
    let winDetails: string[] = [];
    
    Object.entries(bets).forEach(([betId, amount]) => {
      let won = false;
      let multiplier = 0;
      
      switch(betId) {
        case 'red':
          if (winningSlot.color === 'red') { won = true; multiplier = 2; }
          break;
        case 'black':
          if (winningSlot.color === 'black') { won = true; multiplier = 2; }
          break;
        case 'odd':
          if (winningSlot.value % 2 === 1 && winningSlot.value !== 0) { won = true; multiplier = 2; }
          break;
        case 'even':
          if (winningSlot.value % 2 === 0 && winningSlot.value !== 0) { won = true; multiplier = 2; }
          break;
        case '1-12':
          if (winningSlot.value >= 1 && winningSlot.value <= 12) { won = true; multiplier = 3; }
          break;
        case '13-24':
          if (winningSlot.value >= 13 && winningSlot.value <= 24) { won = true; multiplier = 3; }
          break;
        case '25-36':
          if (winningSlot.value >= 25 && winningSlot.value <= 36) { won = true; multiplier = 3; }
          break;
        default:
          // Apuesta a número exacto
          if (parseInt(betId) === winningSlot.value) {
            won = true;
            multiplier = 36;
          }
      }
      
      if (won) {
        const winAmount = amount * multiplier;
        winnings += winAmount;
        winDetails.push(`${betId}: ${amount} → ${winAmount} (+${amount * (multiplier-1)})`);
      }
    });
    
    if (winnings > 0) {
      setUserCoins(userCoins + winnings);
      setShowConfetti(true);
      onWin?.(winnings);
      setTimeout(() => setShowConfetti(false), 3000);
    }
    
    setResult({ winningNumber: winningSlot.value, winnings, winDetails });
    
    // Limpiar apuestas después de mostrar resultado
    setTimeout(() => {
      setBets({});
      setResult(null);
      setIsSpinning(false);
    }, 4000);
  };

  return (
    <div className="border-4 border-black bg-[#0d0d0e] p-6 shadow-[8px_8px_0px_#D4AF37] relative">
      
      {/* Confetti overlay */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none z-50">
          {[...Array(50)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 rounded-full"
              style={{
                backgroundColor: ['#D4AF37', '#00F3FF', '#FF0055'][i % 3],
                left: `${Math.random() * 100}%`,
                top: '50%'
              }}
              animate={{
                y: [0, -Math.random() * 300 - 100, window.innerHeight],
                x: [0, (Math.random() - 0.5) * 100],
                rotate: [0, 360]
              }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          ))}
        </div>
      )}
      
      <h2 className="font-heading text-2xl font-black text-[#D4AF37] mb-4 flex items-center gap-2">
        <span>🎡</span> RUELTA C8L QUANTUM <span className="text-sm text-gray-500 ml-auto">RTP 97.3%</span>
      </h2>
      
      <div className="grid grid-cols-12 gap-6">
        
        {/* Ruleta visual */}
        <div className="col-span-12 md:col-span-5 flex justify-center">
          <div className="relative">
            <motion.div 
              className="relative w-64 h-64 rounded-full border-4 border-[#D4AF37] bg-black overflow-hidden shadow-lg"
              animate={{ rotate: spinAngle }}
              transition={{ duration: 2.5, ease: "easeOut" }}
            >
              <svg viewBox="0 0 200 200" className="w-full h-full">
                {NUMBERS.map((num, idx) => {
                  const angle = (idx * (360 / 37)) - 90;
                  const rad = (angle * Math.PI) / 180;
                  const x = 100 + 78 * Math.cos(rad);
                  const y = 100 + 78 * Math.sin(rad);
                  return (
                    <g key={num.value}>
                      <circle 
                        cx={x} 
                        cy={y} 
                        r="14" 
                        fill={num.color === 'red' ? '#FF0055' : num.color === 'black' ? '#1a1a1a' : '#00F3FF'}
                        stroke="#D4AF37"
                        strokeWidth="1.5"
                      />
                      <text x={x} y={y+4} textAnchor="middle" fill="white" fontSize="9" fontWeight="bold">
                        {num.label}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </motion.div>
            
            {/* Indicador de bola */}
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-2">
              <div className="w-5 h-5 bg-white rounded-full shadow-lg animate-bounce" />
            </div>
          </div>
        </div>
        
        {/* Tablero de apuestas */}
        <div className="col-span-12 md:col-span-7">
          
          {/* Selector de cantidad */}
          <div className="flex gap-2 mb-4">
            {[10, 25, 50, 100, 250, 500].map(amount => (
              <button
                key={amount}
                onClick={() => setBetAmount(amount)}
                className={`px-3 py-1 border-2 font-mono text-sm transition-all ${
                  betAmount === amount 
                    ? 'bg-[#D4AF37] text-black border-black' 
                    : 'bg-black text-[#D4AF37] border-[#D4AF37] hover:bg-[#D4AF37]/20'
                }`}
              >
                {amount}
              </button>
            ))}
          </div>
          
          {/* Apuestas principales */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            {BET_OPTIONS.map(bet => (
              <div key={bet.id} className="relative">
                <button
                  onClick={() => placeBet(bet.id)}
                  className={`w-full py-3 border-2 font-mono font-bold text-sm transition-all ${
                    bets[bet.id] 
                      ? 'bg-[#00F3FF] text-black border-black' 
                      : `bg-black text-white border-[#D4AF37] hover:bg-[#D4AF37]/20`
                  }`}
                >
                  {bet.label}
                </button>
                {bets[bet.id] && (
                  <button
                    onClick={() => removeBet(bet.id)}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-600 text-white rounded-full text-xs hover:bg-red-700"
                  >
                    ✕
                  </button>
                )}
                {bets[bet.id] && (
                  <div className="absolute -bottom-5 left-1/2 transform -translate-x-1/2 text-xs text-[#D4AF37] font-mono">
                    {bets[bet.id]} coins
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {/* Apuestas a números (grid 6x6) */}
          <div className="grid grid-cols-6 gap-1 mb-4 max-h-48 overflow-y-auto p-1">
            {NUMBERS.filter(n => n.value !== 0).map(num => (
              <div key={num.value} className="relative">
                <button
                  onClick={() => placeBet(num.value)}
                  className={`w-full py-2 text-sm font-bold border transition-all ${
                    bets[num.value] 
                      ? 'bg-[#00F3FF] text-black border-black' 
                      : `${num.color === 'red' ? 'bg-red-700' : 'bg-gray-800'} text-white border-[#D4AF37] hover:brightness-110`
                  }`}
                >
                  {num.value}
                </button>
                {bets[num.value] && (
                  <div className="absolute -top-2 -right-2 w-5 h-5 bg-red-600 text-white rounded-full text-xs flex items-center justify-center">
                    {bets[num.value]}
                  </div>
                )}
              </div>
            ))}
          </div>
          
          <button
            onClick={spin}
            disabled={isSpinning || Object.keys(bets).length === 0}
            className="w-full py-4 bg-gradient-to-r from-[#D4AF37] to-[#FFD700] text-black font-heading font-black text-xl border-2 border-black shadow-[4px_4px_0px_#000] disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-[1.02]"
          >
            {isSpinning ? '🎲 GIRANDO... 🎲' : '🎰 GIRAR RULETA'}
          </button>
        </div>
      </div>
      
      {/* Resultado */}
      <AnimatePresence>
        {result && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mt-6 p-4 bg-black border-2 border-[#D4AF37] text-center"
          >
            <div className="text-5xl font-black text-[#D4AF37] mb-2">{result.winningNumber}</div>
            {result.winnings > 0 ? (
              <>
                <div className="text-green-400 text-xl font-bold animate-pulse">
                  🎉 GANASTE {result.winnings} COINS 🎉
                </div>
                <div className="text-xs text-gray-400 mt-2 break-words">
                  {result.winDetails.join(' • ')}
                </div>
              </>
            ) : (
              <div className="text-red-400 text-lg">😢 SIN PREMIO. ¡PRUEBA OTRA VEZ!</div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Saldo actual */}
      <div className="mt-4 text-right text-sm font-mono text-gray-500">
        TU SALDO: <span className="text-[#D4AF37] font-bold">{userCoins} COINS</span>
      </div>
    </div>
  );
}