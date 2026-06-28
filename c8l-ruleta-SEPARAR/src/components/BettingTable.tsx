"use client";

import { useGameStore } from "@/store/game-store";
import {
  getNumberColor,
  createStraightBet,
  createRedBet,
  createBlackBet,
  createEvenBet,
  createOddBet,
  createLowBet,
  createHighBet,
  createDozenBet,
  createColumnBet,
} from "@/lib/roulette-engine";

export default function BettingTable() {
  const { phase, selectedChipValue, placeBet } = useGameStore();
  const isActive = phase === "betting";

  const handleNumberClick = (num: number) => {
    if (!isActive) return;
    placeBet(createStraightBet(num, selectedChipValue));
  };

  const handleSpecialBet = (type: string) => {
    if (!isActive) return;
    switch (type) {
      case "red":
        placeBet(createRedBet(selectedChipValue));
        break;
      case "black":
        placeBet(createBlackBet(selectedChipValue));
        break;
      case "even":
        placeBet(createEvenBet(selectedChipValue));
        break;
      case "odd":
        placeBet(createOddBet(selectedChipValue));
        break;
      case "low":
        placeBet(createLowBet(selectedChipValue));
        break;
      case "high":
        placeBet(createHighBet(selectedChipValue));
        break;
      case "dozen1":
        placeBet(createDozenBet(1, selectedChipValue));
        break;
      case "dozen2":
        placeBet(createDozenBet(2, selectedChipValue));
        break;
      case "dozen3":
        placeBet(createDozenBet(3, selectedChipValue));
        break;
      case "col1":
        placeBet(createColumnBet(1, selectedChipValue));
        break;
      case "col2":
        placeBet(createColumnBet(2, selectedChipValue));
        break;
      case "col3":
        placeBet(createColumnBet(3, selectedChipValue));
        break;
    }
  };

  const getCellBg = (num: number) => {
    const color = getNumberColor(num);
    if (color === "red") return "bg-casino-red hover:bg-red-700";
    if (color === "black") return "bg-casino-black hover:bg-gray-800";
    return "bg-casino-green hover:bg-green-700";
  };

  // Build 3 rows x 12 columns grid (numbers 1-36)
  const rows = [
    [3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36],
    [2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35],
    [1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34],
  ];

  return (
    <div className={`w-full ${!isActive ? "opacity-60 pointer-events-none" : ""}`}>
      <div className="gold-border rounded-lg p-3 felt-texture">
        {/* Main number grid */}
        <div className="flex gap-0.5">
          {/* Zero */}
          <div className="flex flex-col justify-center mr-0.5">
            <button
              onClick={() => handleNumberClick(0)}
              className="number-cell w-12 h-full bg-casino-green rounded-l-lg
                         flex items-center justify-center gold-border-thin
                         text-white font-bold text-xl font-numbers"
            >
              0
            </button>
          </div>

          {/* Numbers grid */}
          <div className="flex-1">
            <div className="grid grid-rows-3 gap-0.5">
              {rows.map((row, rowIdx) => (
                <div key={rowIdx} className="grid grid-cols-12 gap-0.5">
                  {row.map((num) => (
                    <button
                      key={num}
                      onClick={() => handleNumberClick(num)}
                      className={`number-cell h-11 flex items-center justify-center
                                  rounded-sm gold-border-thin text-white font-bold 
                                  text-sm font-numbers ${getCellBg(num)}`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              ))}
            </div>

            {/* Dozens row */}
            <div className="grid grid-cols-3 gap-0.5 mt-1">
              <button
                onClick={() => handleSpecialBet("dozen1")}
                className="number-cell h-9 bg-casino-feltDark rounded-sm gold-border-thin
                           text-casino-gold font-game text-xs flex items-center justify-center"
              >
                1st 12
              </button>
              <button
                onClick={() => handleSpecialBet("dozen2")}
                className="number-cell h-9 bg-casino-feltDark rounded-sm gold-border-thin
                           text-casino-gold font-game text-xs flex items-center justify-center"
              >
                2nd 12
              </button>
              <button
                onClick={() => handleSpecialBet("dozen3")}
                className="number-cell h-9 bg-casino-feltDark rounded-sm gold-border-thin
                           text-casino-gold font-game text-xs flex items-center justify-center"
              >
                3rd 12
              </button>
            </div>

            {/* Outside bets row */}
            <div className="grid grid-cols-6 gap-0.5 mt-1">
              <button
                onClick={() => handleSpecialBet("low")}
                className="number-cell h-9 bg-casino-feltDark rounded-sm gold-border-thin
                           text-white font-game text-xs flex items-center justify-center"
              >
                1 A 18
              </button>
              <button
                onClick={() => handleSpecialBet("even")}
                className="number-cell h-9 bg-casino-feltDark rounded-sm gold-border-thin
                           text-white font-game text-xs flex items-center justify-center"
              >
                PAR
              </button>
              <button
                onClick={() => handleSpecialBet("red")}
                className="number-cell h-9 bg-casino-feltDark rounded-sm gold-border-thin
                           flex items-center justify-center"
              >
                <div className="w-5 h-5 bg-red-700 rotate-45 border border-casino-gold/50" />
              </button>
              <button
                onClick={() => handleSpecialBet("black")}
                className="number-cell h-9 bg-casino-feltDark rounded-sm gold-border-thin
                           flex items-center justify-center"
              >
                <div className="w-5 h-5 bg-gray-900 rotate-45 border border-casino-gold/50" />
              </button>
              <button
                onClick={() => handleSpecialBet("odd")}
                className="number-cell h-9 bg-casino-feltDark rounded-sm gold-border-thin
                           text-white font-game text-xs flex items-center justify-center"
              >
                IMPAR
              </button>
              <button
                onClick={() => handleSpecialBet("high")}
                className="number-cell h-9 bg-casino-feltDark rounded-sm gold-border-thin
                           text-white font-game text-xs flex items-center justify-center"
              >
                19 A 36
              </button>
            </div>
          </div>

          {/* Column bets (2 A 1) */}
          <div className="flex flex-col gap-0.5 ml-0.5">
            {[3, 2, 1].map((col) => (
              <button
                key={col}
                onClick={() => handleSpecialBet(`col${col}` as string)}
                className="number-cell flex-1 w-10 bg-casino-feltDark rounded-r-sm
                           gold-border-thin text-casino-gold font-game text-[10px]
                           flex items-center justify-center leading-tight"
              >
                2A1
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
