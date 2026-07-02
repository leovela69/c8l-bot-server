// components/poker/PokerTable.tsx
interface PokerTableProps {
  gameState: {
    communityCards: string[];
    pot: number;
    playerCards: string[];
    playerCoins: number;
    currentBet: number;
  };
  onAction: (action: string, amount?: number) => void;
}

export function PokerTable({ gameState, onAction }: PokerTableProps) {
  return (
    <div className="relative bg-green-900 rounded-2xl p-8 border-4 border-black">
      {/* La mesa */}
      <div className="relative h-[400px]">
        
        {/* Cartas comunitarias (centro) */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex gap-2">
          {gameState.communityCards.map((card, i) => (
            <PlayingCard key={i} card={card} faceUp={true} />
          ))}
        </div>
        
        {/* Bote (centro abajo) */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black px-4 py-1 border-2 border-[#D4AF37]">
          <span className="text-[#D4AF37] font-mono text-sm">
            BOTE: {gameState.pot} COINS
          </span>
        </div>
        
        {/* Jugador actual (abajo) - el streamer o viewer */}
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 mb-12">
          <div className="bg-black p-3 rounded-lg border-2 border-[#00F3FF]">
            <div className="flex gap-1 mb-2">
              {gameState.playerCards.map((card, i) => (
                <PlayingCard key={i} card={card} faceUp={true} />
              ))}
            </div>
            <div className="text-center text-white text-sm">
              TUS COINS: {gameState.playerCoins}
            </div>
          </div>
        </div>
        
        {/* Botones de acción */}
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 mb-[-60px] flex gap-3">
          <button 
            onClick={() => onAction('fold')}
            className="bg-red-600 text-white px-6 py-2 border-2 border-black font-mono"
          >
            FOLD
          </button>
          <button 
            onClick={() => onAction('call')}
            className="bg-gray-700 text-white px-6 py-2 border-2 border-black font-mono"
          >
            CALL ({gameState.currentBet})
          </button>
          <button 
            onClick={() => onAction('raise', gameState.currentBet * 2)}
            className="bg-[#00F3FF] text-black px-6 py-2 border-2 border-black font-mono"
          >
            RAISE
          </button>
        </div>
        
      </div>
    </div>
  );
}

interface PlayingCardProps {
  card: string;
  faceUp: boolean;
}

// Componente de carta individual
function PlayingCard({ card, faceUp }: PlayingCardProps) {
  if (!faceUp) {
    return <div className="w-16 h-24 bg-gradient-to-b from-blue-800 to-blue-900 rounded-lg border-2 border-white shadow-md" />;
  }
  
  // Extraer el palo (último carácter) y el valor (el resto)
  const suit = card.slice(-1);
  const value = card.slice(0, -1);
  const suitColors: Record<string, string> = { 
    '♥️': 'text-red-500', 
    '♦️': 'text-red-500', 
    '♣️': 'text-black', 
    '♠️': 'text-black' 
  };
  const colorClass = suitColors[suit] || 'text-black';
  
  return (
    <div className="w-16 h-24 bg-white rounded-lg border-2 border-black shadow-md relative">
      <div className={`absolute top-1 left-1 text-xl font-bold ${colorClass}`}>{value}</div>
      <div className={`absolute bottom-1 right-1 text-xl font-bold ${colorClass} transform rotate-180`}>{value}</div>
      <div className="absolute inset-0 flex items-center justify-center text-4xl">{suit}</div>
    </div>
  );
}