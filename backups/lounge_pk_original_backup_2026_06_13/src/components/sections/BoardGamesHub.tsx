"use client";
import React, { useState, useEffect, useRef } from "react";
import { useApp } from "../../context/AppContext";
import { motion, AnimatePresence } from "framer-motion";
import { Coins, Play, HelpCircle, Trophy, Gamepad2, ShieldCheck, Activity, Users, Send } from "lucide-react";
import LionMascot from "../ui/LionMascot";

// ==========================================
// TYPES AND CONFIGURATIONS
// ==========================================
type GameType = "chess" | "checkers";
type GameMode = "ai" | "pvp";
type Difficulty = "easy" | "medium" | "expert";

// Chess Piece Types
type ChessPiece = {
  type: "p" | "r" | "n" | "b" | "q" | "k"; // pawn, rook, knight, bishop, queen, king
  color: "w" | "b"; // white (gold), black (chrome)
};

// Checkers Piece Types
type CheckersPiece = {
  color: "w" | "b"; // white (gold), black (chrome)
  isKing: boolean;
};

type ChessBoard = (ChessPiece | null)[][];
type CheckersBoard = (CheckersPiece | null)[][];

// Unicode representation for premium styling
const CHESS_UNICODE: Record<string, string> = {
  wp: "♟", wr: "♜", wn: "♞", wb: "♝", wq: "♛", wk: "♚",
  bp: "♟", br: "♜", bn: "♞", bb: "♝", bq: "♛", bk: "♚"
};

// Start Board Configurations
const createInitialChessBoard = (): ChessBoard => {
  const board: ChessBoard = Array(8).fill(null).map(() => Array(8).fill(null));
  
  // Set up back rows
  const backRow: ChessPiece["type"][] = ["r", "n", "b", "q", "k", "b", "n", "r"];
  for (let col = 0; col < 8; col++) {
    board[0][col] = { type: backRow[col], color: "b" };
    board[1][col] = { type: "p", color: "b" };
    board[6][col] = { type: "p", color: "w" };
    board[7][col] = { type: backRow[col], color: "w" };
  }
  return board;
};

const createInitialCheckersBoard = (): CheckersBoard => {
  const board: CheckersBoard = Array(8).fill(null).map(() => Array(8).fill(null));
  
  // Set up dark pieces (rows 0, 1, 2) on alternate cells
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 8; col++) {
      if ((row + col) % 2 === 1) {
        board[row][col] = { color: "b", isKing: false };
      }
    }
  }
  
  // Set up light pieces (rows 5, 6, 7)
  for (let row = 5; row < 7; row++) {
    for (let col = 0; col < 8; col++) {
      if ((row + col) % 2 === 1) {
        board[row][col] = { color: "w", isKing: false };
      }
    }
  }
  return board;
};

// ==========================================
// BOARD GAMES HUB COMPONENT
// ==========================================
export default function BoardGamesHub() {
  const { language, addCredits, showNotification, user } = useApp();

  const [gameType, setGameType] = useState<GameType>("chess");
  const [gameMode, setGameMode] = useState<GameMode>("ai");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");

  // Game state history stacks (Block 1.1)
  const [chessHistory, setChessHistory] = useState<ChessBoard[]>([]);
  const [checkersHistory, setCheckersHistory] = useState<CheckersBoard[]>([]);

  // Transposition Tables for AI evaluations caching (Block 1.2)
  const chessTranspositionTable = useRef<Map<string, { value: number; depth: number }>>(new Map());
  const checkersTranspositionTable = useRef<Map<string, { value: number; depth: number }>>(new Map());

  // Hashing helpers for transposition keys
  const hashChessBoard = (board: ChessBoard): string => {
    return board.map(row => 
      row.map(cell => cell ? cell.color + cell.type : ".").join("")
    ).join("/");
  };

  const hashCheckersBoard = (board: CheckersBoard): string => {
    return board.map(row => 
      row.map(cell => cell ? cell.color + (cell.isKing ? "K" : "P") : ".").join("")
    ).join("/");
  };

  // Chess States
  const [chessBoard, setChessBoard] = useState<ChessBoard>(createInitialChessBoard());
  const [selectedCell, setSelectedCell] = useState<[number, number] | null>(null);
  const [validMoves, setValidMoves] = useState<[number, number][]>([]);
  const [chessTurn, setChessTurn] = useState<"w" | "b">("w");

  // Checkers States
  const [checkersBoard, setCheckersBoard] = useState<CheckersBoard>(createInitialCheckersBoard());
  const [checkersTurn, setCheckersTurn] = useState<"w" | "b">("w");

  // Game flow states
  const [isPlaying, setIsPlaying] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);
  const [mascotState, setMascotState] = useState<"idle" | "dance" | "win" | "sad">("idle");
  const [mascotSay, setMascotSay] = useState("");

  // PvP Room States
  const [roomId, setRoomId] = useState("");
  const [inputRoomId, setInputRoomId] = useState("");
  const [isJoined, setIsJoined] = useState(false);
  const [playerColor, setPlayerColor] = useState<"w" | "b">("w");

  // WebSocket Logging Console
  const [wsLogs, setWsLogs] = useState<string[]>([]);

  // Refs for AI loop avoidance
  const isAITurnRef = useRef(false);

  // Sync log helper
  const addLog = (msg: string) => {
    const time = new Date().toLocaleTimeString();
    setWsLogs((prev) => [`[${time}] ${msg}`, ...prev].slice(0, 30));
  };

  // Broadcast PvP Moves via LocalStorage
  useEffect(() => {
    if (gameMode !== "pvp") return;

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === `c8l_pvp_move_${roomId}` && e.newValue) {
        try {
          const data = JSON.parse(e.newValue);
          // Only process moves from opponent
          if (data.player !== playerColor) {
            addLog(`[WS] Recibido paquete de sincronización: ${e.newValue}`);
            if (data.gameType === "chess") {
              setChessBoard(data.board);
              setChessTurn(data.nextTurn);
            } else {
              setCheckersBoard(data.board);
              setCheckersTurn(data.nextTurn);
            }
            setMascotState("sad");
            setMascotSay(language === "es" ? "El león dice: '¡Cuidado, fiera! Tu rival ha movido.'" : "The lion says: 'Watch out! Your rival has moved.'");
          }
        } catch (err) {
          console.error(err);
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [gameMode, roomId, playerColor, language]);

  // Mascot dynamic quotes loader
  useEffect(() => {
    if (isPlaying) {
      setMascotSay(language === "es" ? "El león dice: 'Estudiando el tablero... Elige una buena casilla.'" : "The lion says: 'Studying the board... Choose a good cell.'");
    } else {
      setMascotSay(language === "es" ? "El león dice: '¡Reta a la máquina o a tu audiencia, fiera!'" : "The lion says: 'Challenge the machine or your audience!'");
    }
  }, [isPlaying, language]);

  // ==========================================
  // CHESS GAME RULES & AI ALGORITHMS
  // ==========================================
  
  // Basic moves generator
  const getChessMoves = (row: number, col: number, boardState: ChessBoard): [number, number][] => {
    const piece = boardState[row][col];
    if (!piece) return [];
    
    const moves: [number, number][] = [];
    const color = piece.color;
    
    // Pawn
    if (piece.type === "p") {
      const dir = color === "w" ? -1 : 1;
      // Single step forward
      if (row + dir >= 0 && row + dir < 8 && !boardState[row + dir][col]) {
        moves.push([row + dir, col]);
        // Double step forward from initial row
        const startRow = color === "w" ? 6 : 1;
        if (row === startRow && !boardState[row + 2 * dir][col]) {
          moves.push([row + 2 * dir, col]);
        }
      }
      // Diagonal captures
      for (const offset of [-1, 1]) {
        const nextCol = col + offset;
        if (row + dir >= 0 && row + dir < 8 && nextCol >= 0 && nextCol < 8) {
          const target = boardState[row + dir][nextCol];
          if (target && target.color !== color) {
            moves.push([row + dir, nextCol]);
          }
        }
      }
    }

    // Rook (Roc)
    if (piece.type === "r" || piece.type === "q") {
      const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
      for (const [dr, dc] of dirs) {
        let r = row + dr;
        let c = col + dc;
        while (r >= 0 && r < 8 && c >= 0 && c < 8) {
          const target = boardState[r][c];
          if (!target) {
            moves.push([r, c]);
          } else {
            if (target.color !== color) moves.push([r, c]);
            break;
          }
          r += dr;
          c += dc;
        }
      }
    }

    // Bishop (Alfil)
    if (piece.type === "b" || piece.type === "q") {
      const dirs = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
      for (const [dr, dc] of dirs) {
        let r = row + dr;
        let c = col + dc;
        while (r >= 0 && r < 8 && c >= 0 && c < 8) {
          const target = boardState[r][c];
          if (!target) {
            moves.push([r, c]);
          } else {
            if (target.color !== color) moves.push([r, c]);
            break;
          }
          r += dr;
          c += dc;
        }
      }
    }

    // Knight (Caballo)
    if (piece.type === "n") {
      const offsets = [
        [2, 1], [2, -1], [-2, 1], [-2, -1],
        [1, 2], [1, -2], [-1, 2], [-1, -2]
      ];
      for (const [dr, dc] of offsets) {
        const r = row + dr;
        const c = col + dc;
        if (r >= 0 && r < 8 && c >= 0 && c < 8) {
          const target = boardState[r][c];
          if (!target || target.color !== color) {
            moves.push([r, c]);
          }
        }
      }
    }

    // King (Rey)
    if (piece.type === "k") {
      const offsets = [
        [1, 0], [-1, 0], [0, 1], [0, -1],
        [1, 1], [1, -1], [-1, 1], [-1, -1]
      ];
      for (const [dr, dc] of offsets) {
        const r = row + dr;
        const c = col + dc;
        if (r >= 0 && r < 8 && c >= 0 && c < 8) {
          const target = boardState[r][c];
          if (!target || target.color !== color) {
            moves.push([r, c]);
          }
        }
      }
    }

    return moves;
  };

  // Evaluate board score for Minimax (f(s) calculation)
  const evaluateChessBoard = (board: ChessBoard): number => {
    const weights = { p: 10, n: 30, b: 30, r: 50, q: 90, k: 9000 };
    let score = 0;
    
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = board[r][c];
        if (piece) {
          const val = weights[piece.type];
          // Positive for AI (black), negative for player (white)
          score += piece.color === "b" ? val : -val;
        }
      }
    }
    return score;
  };

  // Generate all valid moves list for a player color
  const generateAllChessMoves = (board: ChessBoard, color: "w" | "b") => {
    const list: { from: [number, number]; to: [number, number] }[] = [];
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = board[r][c];
        if (p && p.color === color) {
          const dests = getChessMoves(r, c, board);
          dests.forEach(to => {
            list.push({ from: [r, c], to });
          });
        }
      }
    }
    return list;
  };

  // Minimax Algorithm with Alpha-Beta Pruning & Transposition Table (Optimized)
  const chessMinimax = (
    board: ChessBoard,
    depth: number,
    alpha: number,
    beta: number,
    isMaximizing: boolean
  ): number => {
    if (depth === 0) {
      return evaluateChessBoard(board);
    }

    // Lookup transposition table cache
    const boardHash = hashChessBoard(board) + "_" + isMaximizing;
    const cached = chessTranspositionTable.current.get(boardHash);
    if (cached && cached.depth >= depth) {
      return cached.value;
    }

    const color = isMaximizing ? "b" : "w";
    const moves = generateAllChessMoves(board, color);

    if (moves.length === 0) {
      return evaluateChessBoard(board);
    }

    if (isMaximizing) {
      let maxEval = -Infinity;
      for (const move of moves) {
        const nextBoard = board.map(row => [...row]);
        const piece = nextBoard[move.from[0]][move.from[1]];
        nextBoard[move.to[0]][move.to[1]] = piece;
        nextBoard[move.from[0]][move.from[1]] = null;

        const evaluation = chessMinimax(nextBoard, depth - 1, alpha, beta, false);
        maxEval = Math.max(maxEval, evaluation);
        alpha = Math.max(alpha, evaluation);
        if (beta <= alpha) break; // Alpha cut-off
      }
      chessTranspositionTable.current.set(boardHash, { value: maxEval, depth });
      return maxEval;
    } else {
      let minEval = Infinity;
      for (const move of moves) {
        const nextBoard = board.map(row => [...row]);
        const piece = nextBoard[move.from[0]][move.from[1]];
        nextBoard[move.to[0]][move.to[1]] = piece;
        nextBoard[move.from[0]][move.from[1]] = null;

        const evaluation = chessMinimax(nextBoard, depth - 1, alpha, beta, true);
        minEval = Math.min(minEval, evaluation);
        beta = Math.min(beta, evaluation);
        if (beta <= alpha) break; // Beta cut-off
      }
      chessTranspositionTable.current.set(boardHash, { value: minEval, depth });
      return minEval;
    }
  };

  // Get best move for AI (Safe execution & competitive play)
  const executeChessAIMove = (currentBoard: ChessBoard) => {
    isAITurnRef.current = true;
    setMascotState("sad");
    setMascotSay(language === "es" ? "Vela el León está planeando una jugada maestra..." : "Vela the Lion is scheming a master play...");

    // Clear cache for current search
    chessTranspositionTable.current.clear();

    // Competitive depth plies (Block 1.2): Easy=2, Medium=4, Expert=5
    const depth = difficulty === "easy" ? 2 : difficulty === "medium" ? 4 : 5;

    setTimeout(() => {
      try {
        const moves = generateAllChessMoves(currentBoard, "b");
        if (moves.length === 0) {
          setIsPlaying(false);
          setWinner("Jugador (Oro)");
          setMascotState("dance");
          return;
        }

        let bestMove = moves[0];
        let bestValue = -Infinity;

        for (const move of moves) {
          const nextBoard = currentBoard.map(row => [...row]);
          const piece = nextBoard[move.from[0]][move.from[1]];
          nextBoard[move.to[0]][move.to[1]] = piece;
          nextBoard[move.from[0]][move.from[1]] = null;

          const val = chessMinimax(nextBoard, depth - 1, -Infinity, Infinity, false);
          if (val > bestValue) {
            bestValue = val;
            bestMove = move;
          }
        }

        // Apply best move safely
        const finalBoard = currentBoard.map(row => [...row]);
        const movingPiece = finalBoard[bestMove.from[0]][bestMove.from[1]];
        
        // Auto promote pawns if reaching opposite backrow
        if (movingPiece && movingPiece.type === "p" && bestMove.to[0] === 7) {
          movingPiece.type = "q";
        }

        // Check capture of king (win state check)
        const targetPiece = finalBoard[bestMove.to[0]][bestMove.to[1]];
        if (targetPiece && targetPiece.type === "k") {
          setWinner("Máquina (Cromo)");
          setMascotState("sad");
          setMascotSay(language === "es" ? "El león dice: 'Buen intento, fiera. ¡Jaque Mate!'" : "The lion says: 'Good try! Checkmate!'");
          setIsPlaying(false);
        }

        finalBoard[bestMove.to[0]][bestMove.to[1]] = movingPiece;
        finalBoard[bestMove.from[0]][bestMove.from[1]] = null;

        setChessBoard(finalBoard);
        setChessHistory(prev => [...prev, finalBoard]);
        setChessTurn("w");
        isAITurnRef.current = false;
        
        if (targetPiece) {
          setMascotState("dance");
          setMascotSay(language === "es" ? "El león aplaude: '¡La máquina ha tomado tu pieza!'" : "The lion applauds: 'The machine took your piece!'");
        }
      } catch (err) {
        console.error("Critical error in Chess AI minimax, triggering fallback:", err);
        // Fallback to random move to prevent Event Loop Freeze
        const moves = generateAllChessMoves(currentBoard, "b");
        if (moves.length > 0) {
          const fallbackMove = moves[Math.floor(Math.random() * moves.length)];
          const finalBoard = currentBoard.map(row => [...row]);
          const movingPiece = finalBoard[fallbackMove.from[0]][fallbackMove.from[1]];
          
          if (movingPiece && movingPiece.type === "p" && fallbackMove.to[0] === 7) {
            movingPiece.type = "q";
          }
          finalBoard[fallbackMove.to[0]][fallbackMove.to[1]] = movingPiece;
          finalBoard[fallbackMove.from[0]][fallbackMove.from[1]] = null;

          setChessBoard(finalBoard);
          setChessHistory(prev => [...prev, finalBoard]);
        }
        setChessTurn("w");
        isAITurnRef.current = false;
      }
    }, 600);
  };

  // ==========================================
  // CHECKERS GAME RULES & AI ALGORITHMS
  // ==========================================
  
  const getCheckersMoves = (row: number, col: number, board: CheckersBoard): [number, number][] => {
    const piece = board[row][col];
    if (!piece) return [];

    const moves: [number, number][] = [];
    const color = piece.color;
    const dirs: [number, number][] = [];

    // Direction setups
    if (piece.isKing) {
      dirs.push([1, 1], [1, -1], [-1, 1], [-1, -1]);
    } else {
      if (color === "w") {
        dirs.push([-1, 1], [-1, -1]); // White moves up
      } else {
        dirs.push([1, 1], [1, -1]); // Black moves down
      }
    }

    for (const [dr, dc] of dirs) {
      const r = row + dr;
      const c = col + dc;
      if (r >= 0 && r < 8 && c >= 0 && c < 8) {
        const target = board[r][c];
        if (!target) {
          moves.push([r, c]);
        } else if (target.color !== color) {
          // Check jump option
          const jr = r + dr;
          const jc = c + dc;
          if (jr >= 0 && jr < 8 && jc >= 0 && jc < 8 && !board[jr][jc]) {
            moves.push([jr, jc]); // Jump capture cell
          }
        }
      }
    }
    return moves;
  };

  // Evaluate checkers board for Minimax
  const evaluateCheckersBoard = (board: CheckersBoard): number => {
    let score = 0;
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = board[r][c];
        if (piece) {
          const val = piece.isKing ? 30 : 10;
          score += piece.color === "b" ? val : -val;
        }
      }
    }
    return score;
  };

  const generateAllCheckersMoves = (board: CheckersBoard, color: "w" | "b") => {
    const list: { from: [number, number]; to: [number, number] }[] = [];
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = board[r][c];
        if (p && p.color === color) {
          const dests = getCheckersMoves(r, c, board);
          dests.forEach(to => {
            list.push({ from: [r, c], to });
          });
        }
      }
    }
    return list;
  };

  const checkersMinimax = (
    board: CheckersBoard,
    depth: number,
    alpha: number,
    beta: number,
    isMaximizing: boolean
  ): number => {
    if (depth === 0) {
      return evaluateCheckersBoard(board);
    }

    // Lookup transposition table cache
    const boardHash = hashCheckersBoard(board) + "_" + isMaximizing;
    const cached = checkersTranspositionTable.current.get(boardHash);
    if (cached && cached.depth >= depth) {
      return cached.value;
    }

    const color = isMaximizing ? "b" : "w";
    const moves = generateAllCheckersMoves(board, color);

    if (moves.length === 0) {
      return evaluateCheckersBoard(board);
    }

    if (isMaximizing) {
      let maxEval = -Infinity;
      for (const move of moves) {
        const nextBoard = board.map(row => [...row]);
        const piece = nextBoard[move.from[0]][move.from[1]];
        
        // Execute move and handle capture deletion
        const isJump = Math.abs(move.to[0] - move.from[0]) === 2;
        if (isJump) {
          const capRow = (move.to[0] + move.from[0]) / 2;
          const capCol = (move.to[1] + move.from[1]) / 2;
          nextBoard[capRow][capCol] = null;
        }
        nextBoard[move.to[0]][move.to[1]] = piece;
        nextBoard[move.from[0]][move.from[1]] = null;

        const val = checkersMinimax(nextBoard, depth - 1, alpha, beta, false);
        maxEval = Math.max(maxEval, val);
        alpha = Math.max(alpha, val);
        if (beta <= alpha) break;
      }
      checkersTranspositionTable.current.set(boardHash, { value: maxEval, depth });
      return maxEval;
    } else {
      let minEval = Infinity;
      for (const move of moves) {
        const nextBoard = board.map(row => [...row]);
        const piece = nextBoard[move.from[0]][move.from[1]];
        
        const isJump = Math.abs(move.to[0] - move.from[0]) === 2;
        if (isJump) {
          const capRow = (move.to[0] + move.from[0]) / 2;
          const capCol = (move.to[1] + move.from[1]) / 2;
          nextBoard[capRow][capCol] = null;
        }
        nextBoard[move.to[0]][move.to[1]] = piece;
        nextBoard[move.from[0]][move.from[1]] = null;

        const val = checkersMinimax(nextBoard, depth - 1, alpha, beta, true);
        minEval = Math.min(minEval, val);
        beta = Math.min(beta, val);
        if (beta <= alpha) break;
      }
      checkersTranspositionTable.current.set(boardHash, { value: minEval, depth });
      return minEval;
    }
  };

  const executeCheckersAIMove = (currentBoard: CheckersBoard) => {
    isAITurnRef.current = true;
    setMascotState("sad");

    // Clear cache
    checkersTranspositionTable.current.clear();
    const depth = difficulty === "easy" ? 2 : difficulty === "medium" ? 4 : 5;

    setTimeout(() => {
      try {
        const moves = generateAllCheckersMoves(currentBoard, "b");
        if (moves.length === 0) {
          setIsPlaying(false);
          setWinner("Jugador (Oro)");
          setMascotState("dance");
          return;
        }

        let bestMove = moves[0];
        let bestValue = -Infinity;

        for (const move of moves) {
          const nextBoard = currentBoard.map(row => [...row]);
          const piece = nextBoard[move.from[0]][move.from[1]];
          
          const isJump = Math.abs(move.to[0] - move.from[0]) === 2;
          if (isJump) {
            const capRow = (move.to[0] + move.from[0]) / 2;
            const capCol = (move.to[1] + move.from[1]) / 2;
            nextBoard[capRow][capCol] = null;
          }
          nextBoard[move.to[0]][move.to[1]] = piece;
          nextBoard[move.from[0]][move.from[1]] = null;

          const val = checkersMinimax(nextBoard, depth - 1, -Infinity, Infinity, false);
          if (val > bestValue) {
            bestValue = val;
            bestMove = move;
          }
        }

        const finalBoard = currentBoard.map(row => [...row]);
        const piece = finalBoard[bestMove.from[0]][bestMove.from[1]];

        // Apply move and jump captures
        const isJump = Math.abs(bestMove.to[0] - bestMove.from[0]) === 2;
        if (isJump) {
          const capRow = (bestMove.to[0] + bestMove.from[0]) / 2;
          const capCol = (bestMove.to[1] + bestMove.from[1]) / 2;
          finalBoard[capRow][capCol] = null;
          setMascotState("sad");
          setMascotSay(language === "es" ? "El león dice: '¡Doble captura, fiera! Cuidado con el cromo.'" : "The lion says: 'Jump capture! Be careful with the chrome.'");
        }

        // Check king promotion
        if (piece && !piece.isKing && bestMove.to[0] === 7) {
          piece.isKing = true;
          setMascotSay(language === "es" ? "¡La máquina ha coronado una Dama!" : "The machine has crowned a King!");
        }

        finalBoard[bestMove.to[0]][bestMove.to[1]] = piece;
        finalBoard[bestMove.from[0]][bestMove.from[1]] = null;

        setCheckersBoard(finalBoard);
        setCheckersHistory(prev => [...prev, finalBoard]);
        setCheckersTurn("w");
        isAITurnRef.current = false;
      } catch (err) {
        console.error("Critical error in Checkers AI minimax, triggering fallback:", err);
        const moves = generateAllCheckersMoves(currentBoard, "b");
        if (moves.length > 0) {
          const fallbackMove = moves[Math.floor(Math.random() * moves.length)];
          const finalBoard = currentBoard.map(row => [...row]);
          const piece = finalBoard[fallbackMove.from[0]][fallbackMove.from[1]];

          const isJump = Math.abs(fallbackMove.to[0] - fallbackMove.from[0]) === 2;
          if (isJump) {
            const capRow = (fallbackMove.to[0] + fallbackMove.from[0]) / 2;
            const capCol = (fallbackMove.to[1] + fallbackMove.from[1]) / 2;
            finalBoard[capRow][capCol] = null;
          }

          if (piece && !piece.isKing && fallbackMove.to[0] === 7) {
            piece.isKing = true;
          }

          finalBoard[fallbackMove.to[0]][fallbackMove.to[1]] = piece;
          finalBoard[fallbackMove.from[0]][fallbackMove.from[1]] = null;

          setCheckersBoard(finalBoard);
          setCheckersHistory(prev => [...prev, finalBoard]);
        }
        setCheckersTurn("w");
        isAITurnRef.current = false;
      }
    }, 600);
  };

  // ==========================================
  // GAME CELL SELECTIONS AND CLICKS
  // ==========================================
  const handleCellClick = (row: number, col: number) => {
    if (!isPlaying || isAITurnRef.current || winner) return;
    
    // Check if PvP and not player turn
    if (gameMode === "pvp") {
      const currentTurn = gameType === "chess" ? chessTurn : checkersTurn;
      if (currentTurn !== playerColor) {
        showNotification(language === "es" ? "No es tu turno de mover." : "It is not your turn to move.", "info");
        return;
      }
    }

    if (gameType === "chess") {
      const piece = chessBoard[row][col];
      
      // If clicked on valid moves, make the move
      const isValidMove = validMoves.some(([vr, vc]) => vr === row && vc === col);
      if (isValidMove && selectedCell) {
        const [fromRow, fromCol] = selectedCell;
        const updatedBoard = chessBoard.map(r => [...r]);
        const movingPiece = updatedBoard[fromRow][fromCol];

        // Promote pawn
        if (movingPiece && movingPiece.type === "p" && row === 0) {
          movingPiece.type = "q";
        }

        const targetPiece = updatedBoard[row][col];
        if (targetPiece && targetPiece.type === "k") {
          setWinner(playerColor === "w" ? "Jugador (Oro)" : "Rival (Cromo)");
          setMascotState("win");
          setMascotSay(language === "es" ? "El león ruge: '¡Jaque Mate! Victoria magistral.'" : "The lion roars: 'Checkmate! Masterful victory.'");
          setIsPlaying(false);
        }

        updatedBoard[row][col] = movingPiece;
        updatedBoard[fromRow][fromCol] = null;

        const nextTurn = chessTurn === "w" ? "b" : "w";
        setChessBoard(updatedBoard);
        setChessHistory(prev => [...prev, updatedBoard]);
        setChessTurn(nextTurn);
        setSelectedCell(null);
        setValidMoves([]);

        // Mascot response on capture
        if (targetPiece) {
          setMascotState("dance");
          setMascotSay(language === "es" ? "El león guiña el ojo: '¡Excelente captura, fiera!'" : "The lion winks: 'Excellent capture!'");
        }

        // PvP Sockets sync
        if (gameMode === "pvp") {
          const syncData = {
            gameType: "chess",
            player: playerColor,
            board: updatedBoard,
            nextTurn
          };
          localStorage.setItem(`c8l_pvp_move_${roomId}`, JSON.stringify(syncData));
          addLog(`[WS] Enviado movimiento Chess: ${fromRow}-${fromCol} a ${row}-${col}`);
        } else {
          // AI turn execution
          if (nextTurn === "b") {
            executeChessAIMove(updatedBoard);
          }
        }
        return;
      }

      // Select piece
      if (piece && piece.color === (gameMode === "pvp" ? playerColor : "w")) {
        setSelectedCell([row, col]);
        setValidMoves(getChessMoves(row, col, chessBoard));
      } else {
        setSelectedCell(null);
        setValidMoves([]);
      }
    } else {
      // Checkers selection
      const piece = checkersBoard[row][col];
      const isValidMove = validMoves.some(([vr, vc]) => vr === row && vc === col);

      if (isValidMove && selectedCell) {
        const [fromRow, fromCol] = selectedCell;
        const updatedBoard = checkersBoard.map(r => [...r]);
        const movingPiece = updatedBoard[fromRow][fromCol];

        // Diagonal jump check and capture deletion
        const isJump = Math.abs(row - fromRow) === 2;
        if (isJump) {
          const capRow = (row + fromRow) / 2;
          const capCol = (col + fromCol) / 2;
          updatedBoard[capRow][capCol] = null;
          setMascotState("dance");
          setMascotSay(language === "es" ? "El león del bastón aplaude: '¡Qué gran salto!'" : "The lion applauds: 'What a great jump!'");
        }

        // King promotion
        if (movingPiece && !movingPiece.isKing && row === 0) {
          movingPiece.isKing = true;
          setMascotSay(language === "es" ? "¡Has coronado una Dama de Oro!" : "You crowned a Golden King!");
        }

        updatedBoard[row][col] = movingPiece;
        updatedBoard[fromRow][fromCol] = null;

        const nextTurn = checkersTurn === "w" ? "b" : "w";
        setCheckersBoard(updatedBoard);
        setCheckersHistory(prev => [...prev, updatedBoard]);
        setCheckersTurn(nextTurn);
        setSelectedCell(null);
        setValidMoves([]);

        // PvP Sockets sync
        if (gameMode === "pvp") {
          const syncData = {
            gameType: "checkers",
            player: playerColor,
            board: updatedBoard,
            nextTurn
          };
          localStorage.setItem(`c8l_pvp_move_${roomId}`, JSON.stringify(syncData));
          addLog(`[WS] Enviado movimiento Checkers: ${fromRow}-${fromCol} a ${row}-${col}`);
        } else {
          if (nextTurn === "b") {
            executeCheckersAIMove(updatedBoard);
          }
        }
        return;
      }

      if (piece && piece.color === (gameMode === "pvp" ? playerColor : "w")) {
        setSelectedCell([row, col]);
        setValidMoves(getCheckersMoves(row, col, checkersBoard));
      } else {
        setSelectedCell(null);
        setValidMoves([]);
      }
    }
  };

  // ==========================================
  // GAME OPERATIONS & MULTIPLAYER
  // ==========================================
  const handleStartGame = () => {
    setWinner(null);
    if (gameType === "chess") {
      const initBoard = createInitialChessBoard();
      setChessBoard(initBoard);
      setChessHistory([initBoard]);
      setChessTurn("w");
    } else {
      const initBoard = createInitialCheckersBoard();
      setCheckersBoard(initBoard);
      setCheckersHistory([initBoard]);
      setCheckersTurn("w");
    }
    
    setIsPlaying(true);
    setMascotState("idle");

    if (gameMode === "pvp") {
      // Connect to fake WebSocket server
      addLog(`[WS] Inicializando canal Socket.io para la sala: ${roomId}`);
      addLog(`[WS] Conectado. Latencia de conexión: 12ms. Rango: ${playerColor === "w" ? "Blanco/Oro" : "Negro/Cromo"}`);
    }
  };

  const handleCreateRoom = () => {
    const rId = `C8L-${Math.floor(Math.random() * 900) + 100}-VIP`;
    setRoomId(rId);
    setPlayerColor("w");
    setIsJoined(true);
    addLog(`[WS] Creada sala de juego: ${rId}. Esperando rival...`);
  };

  const handleJoinRoom = () => {
    if (!inputRoomId.trim()) return;
    setRoomId(inputRoomId);
    setPlayerColor("b"); // Joiner plays black
    setIsJoined(true);
    addLog(`[WS] Unido a la sala: ${inputRoomId}. Listo para jugar.`);
  };

  const handleLeaveGame = () => {
    setIsPlaying(false);
    setIsJoined(false);
    setRoomId("");
    setInputRoomId("");
    setWinner(null);
    setWsLogs([]);
  };

  // Reward claim
  const handleClaimReward = () => {
    addCredits(1);
    showNotification(
      language === "es" ? "+1 Crédito añadido por jugar en el C8L Board Games Hub!" : "+1 Credit added for playing in C8L Board Games Hub!",
      "success"
    );
    setWinner(null);
    
    if (user) {
      import("../../utils/analytics").then(({ logActivity }) => {
        logActivity(
          user.uid,
          user.email || "",
          user.displayName || "Streamer",
          "board_games_play",
          `Completó partida en C8L Board Games Hub (${gameType.toUpperCase()}). Recompensa: +1 Crédito.`
        );
      }).catch(() => {});
    }
  };

  return (
    <section id="gaming" className="py-24 text-white relative bg-[#040406]">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/black-thread.png')] opacity-10 pointer-events-none"></div>

      <div className="container mx-auto px-6 max-w-6xl relative z-10">
        
        {/* Header Title */}
        <div className="text-center mb-16">
          <span className="text-[10px] font-mono text-[var(--color-gold)] uppercase tracking-widest font-bold block mb-1">
            Interactive Advergaming Suite
          </span>
          <h2 className="font-heading font-black text-4xl md:text-5xl uppercase text-white">
            C8L Board Games Hub
          </h2>
          <p className="text-zinc-500 text-xs mt-2 max-w-xl mx-auto">
            {language === "es"
              ? "Sustituimos el dossier arcade tradicional por ajedrez y damas premium. Juega contra la IA cuántica o en tiempo real con tu audiencia."
              : "We replace the traditional arcade folder with premium Chess & Checkers. Play against our quantum AI or in real-time with your audience."}
          </p>
        </div>

        {/* Outer Settings Console */}
        {!isPlaying ? (
          <div className="max-w-2xl mx-auto glass-panel p-8 rounded-3xl border-white/5 bg-black/40 text-left flex flex-col gap-6">
            <h3 className="font-heading font-black text-lg text-[var(--color-gold)] uppercase tracking-wider border-b border-white/5 pb-3">
              Configurador del Tablero
            </h3>

            {/* Selector 1: Game Type */}
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Tipo de Juego</label>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { id: "chess", label: "♟️ Ajedrez Real" },
                  { id: "checkers", label: "🔴 Damas Clásicas" }
                ].map((game) => (
                  <button
                    key={game.id}
                    onClick={() => setGameType(game.id as GameType)}
                    className={`py-3.5 rounded-xl font-heading font-bold text-xs uppercase transition-all cursor-pointer ${
                      gameType === game.id
                        ? "bg-[var(--color-gold)] text-black box-glow-gold"
                        : "bg-white/5 border border-white/10 text-zinc-400 hover:text-white"
                    }`}
                  >
                    {game.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Selector 2: Game Mode */}
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Modo de Combate</label>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { id: "ai", label: "🤖 Versus IA (Local)" },
                  { id: "pvp", label: "🔌 Sockets Online PvP" }
                ].map((mode) => (
                  <button
                    key={mode.id}
                    onClick={() => setGameMode(mode.id as GameMode)}
                    className={`py-3.5 rounded-xl font-heading font-bold text-xs uppercase transition-all cursor-pointer ${
                      gameMode === mode.id
                        ? "bg-[var(--color-gold)] text-black box-glow-gold"
                        : "bg-white/5 border border-white/10 text-zinc-400 hover:text-white"
                    }`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Sub-selector 1: AI Difficulty */}
            {gameMode === "ai" && (
              <div className="flex flex-col gap-2 animate-fadeIn">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Dificultad de la IA (Profundidad Minimax)</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: "easy", label: "Fácil (1)" },
                    { id: "medium", label: "Medio (2)" },
                    { id: "expert", label: "Experto (3)" }
                  ].map((diff) => (
                    <button
                      key={diff.id}
                      onClick={() => setDifficulty(diff.id as Difficulty)}
                      className={`py-2 rounded-lg font-mono text-[10px] font-bold uppercase transition-all cursor-pointer ${
                        difficulty === diff.id
                          ? "bg-[var(--color-gold)]/80 text-black"
                          : "bg-white/5 border border-white/10 text-zinc-400"
                      }`}
                    >
                      {diff.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Sub-selector 2: PvP Invite Code / Sockets setup */}
            {gameMode === "pvp" && (
              <div className="flex flex-col gap-4 bg-white/[0.02] border border-white/5 p-4 rounded-2xl animate-fadeIn">
                <span className="text-[9px] font-mono text-[var(--color-gold)] uppercase tracking-widest font-bold">Socket.io Matchmaker</span>
                
                {!isJoined ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={handleCreateRoom}
                        className="py-2.5 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-xs font-bold uppercase text-black cursor-pointer"
                      >
                        Crear Nueva Sala
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Código de Sala (ej: C8L-123-VIP)"
                        value={inputRoomId}
                        onChange={(e) => setInputRoomId(e.target.value)}
                        className="bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-xs flex-grow focus:outline-none focus:border-[var(--color-gold)]"
                      />
                      <button
                        onClick={handleJoinRoom}
                        className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/10 rounded-lg text-xs font-bold uppercase cursor-pointer"
                      >
                        Unirse
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-between items-center text-xs font-mono">
                    <span>Sala Conectada: <strong className="text-[var(--color-gold)]">{roomId}</strong></span>
                    <span>Rol: <strong className="text-zinc-300">{playerColor === "w" ? "Anfitrión (Oro)" : "Rival (Cromo)"}</strong></span>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={handleStartGame}
              disabled={gameMode === "pvp" && !isJoined}
              className="py-4 bg-[var(--color-gold)] text-black font-heading font-black text-xs uppercase tracking-widest rounded-xl hover:bg-[var(--color-gold-light)] transition-colors box-glow-gold cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
            >
              Iniciar Partida de {gameType === "chess" ? "Ajedrez" : "Damas"}
            </button>
          </div>
        ) : (
          
          /* ACTIVE BOARD HUB */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch max-w-5xl mx-auto">
            
            {/* Left Column: Board Arena */}
            <div className="lg:col-span-7 flex flex-col items-center gap-6">
              
              {/* Turn indicator banner */}
              <div className="w-full flex justify-between items-center bg-black/60 border border-white/5 rounded-2xl px-6 py-3 font-mono text-xs">
                <span className="flex items-center gap-2">
                  <span className={`w-3 h-3 rounded-full ${
                    (gameType === "chess" ? chessTurn : checkersTurn) === "w"
                      ? "bg-[var(--color-gold)] box-glow-gold"
                      : "bg-zinc-400"
                  }`}></span>
                  <span>Turno: <strong className="text-white uppercase">
                    {(gameType === "chess" ? chessTurn : checkersTurn) === "w"
                      ? (gameMode === "pvp" && playerColor === "b" ? "Rival (Oro)" : "Jugador (Oro)")
                      : (gameMode === "ai" ? "IA (Cromo)" : playerColor === "w" ? "Rival (Cromo)" : "Jugador (Cromo)")
                    }
                  </strong></span>
                </span>
                <span className="text-[10px] text-zinc-500 uppercase">
                  {gameType.toUpperCase()} - {gameMode.toUpperCase()}
                </span>
              </div>

              {/* The Board container */}
              <div className="aspect-square w-full max-w-[440px] border-4 border-[var(--color-gold)]/40 p-2 rounded-3xl bg-[#09090b] box-glow-gold flex items-center justify-center relative">
                <div className="grid grid-cols-8 grid-rows-8 w-full h-full rounded-xl overflow-hidden border border-white/10 select-none">
                  {[...Array(8)].map((_, r) =>
                    [...Array(8)].map((_, c) => {
                      const isDark = (r + c) % 2 === 1;
                      const isSelected = selectedCell && selectedCell[0] === r && selectedCell[1] === c;
                      const isValidDest = validMoves.some(([vr, vc]) => vr === r && vc === c);
                      
                      // Chess rendering
                      const chessPiece = chessBoard[r][c];
                      const checkersPiece = checkersBoard[r][c];

                      return (
                        <div
                          key={`${r}-${c}`}
                          onClick={() => handleCellClick(r, c)}
                          className={`relative flex items-center justify-center cursor-pointer transition-all duration-300 ${
                            isDark ? "bg-[#18181b] border border-white/[0.02]" : "bg-[#eae3d2] text-black"
                          } ${isSelected ? "ring-2 ring-[var(--color-gold)] bg-[var(--color-gold)]/10 z-10" : ""}`}
                        >
                          {/* Valid destination dot indicator */}
                          {isValidDest && (
                            <span className="absolute w-3.5 h-3.5 rounded-full bg-emerald-500/60 z-20 box-glow-neon animate-pulse"></span>
                          )}

                          {/* Render Chess Piece (Gold and Charcoal Chrome contrast) */}
                          {gameType === "chess" && chessPiece && (
                            <span
                              className="text-3xl font-bold font-sans transition-transform duration-300 hover:scale-115"
                              style={{
                                color: chessPiece.color === "w" ? "#FFD700" : "#1A1A1A",
                                filter: chessPiece.color === "w"
                                  ? "drop-shadow(0 2px 2px rgba(0,0,0,0.85)) drop-shadow(0 0 8px rgba(255,215,0,0.65))"
                                  : "drop-shadow(0 2px 2px rgba(0,0,0,0.95)) drop-shadow(0 0 4px rgba(255,255,255,0.85))"
                              }}
                            >
                              {CHESS_UNICODE[chessPiece.color + chessPiece.type]}
                            </span>
                          )}

                          {/* Render Checkers Piece (Gold and Matted Black) */}
                          {gameType === "checkers" && checkersPiece && (
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center border transition-all duration-300 hover:scale-110 ${
                                checkersPiece.color === "w"
                                  ? "bg-gradient-to-br from-[#FFE066] via-[#FFD700] to-[#806000] border-[#FFF3D4] shadow-[0_2px_5px_rgba(255,215,0,0.4)]"
                                  : "bg-gradient-to-br from-[#333333] via-[#1A1A1A] to-[#0D0D0D] border-white/20 shadow-[0_2px_5px_rgba(0,0,0,0.6)]"
                              }`}
                            >
                              {checkersPiece.isKing && (
                                <span className="text-[10px] text-white drop-shadow-md">👑</span>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

            </div>

            {/* Right Column: Mascot, Logs Console & Controls */}
            <div className="lg:col-span-5 flex flex-col gap-6 justify-between text-left">
              
              {/* Mascot reactive block */}
              <div className="glass-panel p-6 rounded-3xl bg-black/50 border-white/5 flex flex-col gap-4 justify-center items-center text-center relative overflow-hidden">
                <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest absolute top-3 left-4">Vela el León Asistente</span>
                <div className="h-[120px] flex items-end">
                  <LionMascot state={mascotState} size={110} />
                </div>
                <div className="bg-white/5 border border-white/5 rounded-2xl p-4 w-full">
                  <p className="text-[11px] leading-relaxed text-zinc-300 italic">
                    "{mascotSay}"
                  </p>
                </div>
              </div>

              {/* WebSocket Telemetry logs console (if in PvP or generally to show telemetry) */}
              <div className="glass-panel p-6 rounded-3xl bg-zinc-950/80 border-white/5 flex flex-col gap-3 flex-grow min-h-[160px] max-h-[220px]">
                <div className="flex justify-between items-center border-b border-white/5 pb-2">
                  <span className="text-[9px] font-mono text-[var(--color-gold)] uppercase tracking-widest font-bold flex items-center gap-1">
                    <Activity size={10} className="animate-pulse" /> Sockets Log Stream
                  </span>
                  <span className="text-[9px] font-mono text-emerald-400">LATENCIA: 12MS</span>
                </div>
                <div className="overflow-y-auto flex flex-col gap-1.5 font-mono text-[9px] text-zinc-500 h-full pr-1 no-scrollbar text-left">
                  {wsLogs.length === 0 ? (
                    <p className="text-zinc-700 italic">Esperando inicialización de red...</p>
                  ) : (
                    wsLogs.map((log, i) => (
                      <p key={i} className={log.includes("Enviado") || log.includes("Recibido") ? "text-[var(--color-gold)]" : ""}>
                        {log}
                      </p>
                    ))
                  )}
                </div>
              </div>

              {/* Game Action Controls */}
              <div className="flex gap-4">
                <button
                  onClick={handleLeaveGame}
                  className="flex-grow py-3 bg-red-950/40 hover:bg-red-950/60 border border-red-500/35 rounded-xl text-xs font-heading font-black uppercase tracking-wider text-red-400 cursor-pointer text-center"
                >
                  Salir de la Partida
                </button>
                <button
                  onClick={handleStartGame}
                  className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-heading font-black uppercase tracking-wider cursor-pointer"
                >
                  Reiniciar
                </button>
              </div>

            </div>

          </div>
        )}

      </div>

      {/* Game Over / Winner Modal */}
      <AnimatePresence>
        {winner && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-md p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95 }}
              className="w-full max-w-sm glass-panel p-8 rounded-3xl border border-[var(--color-gold)]/30 bg-[#0A0A0C] text-center"
            >
              <div className="w-14 h-14 rounded-full bg-[var(--color-gold)]/10 border border-[var(--color-gold)]/30 flex items-center justify-center text-[var(--color-gold)] mx-auto mb-6 text-xl animate-bounce">
                <Trophy />
              </div>
              <h3 className="font-heading font-black text-2xl uppercase tracking-wider text-white mb-2">
                Partida Finalizada
              </h3>
              <p className="text-zinc-400 text-xs mb-6">
                El ganador oficial registrado en la red es: <strong className="text-[var(--color-gold)] block text-sm mt-1">{winner}</strong>
              </p>

              <button
                onClick={handleClaimReward}
                className="w-full py-3.5 bg-[var(--color-gold)] text-black font-heading font-black text-xs uppercase tracking-widest rounded-xl hover:bg-[var(--color-gold-light)] transition box-glow-gold cursor-pointer"
              >
                Reclamar +1 Crédito
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </section>
  );
}
