# -*- coding: utf-8 -*-
"""
C8L Chess Master — Motor de IA con 6 niveles
Usa python-chess para validacion + minimax con evaluacion posicional
"""
import chess
import random

# Valores de piezas
PIECE_VALUES = {chess.PAWN: 100, chess.KNIGHT: 320, chess.BISHOP: 330, chess.ROOK: 500, chess.QUEEN: 900, chess.KING: 20000}

# Tablas de posicion (simplificadas)
PAWN_TABLE = [0,0,0,0,0,0,0,0, 50,50,50,50,50,50,50,50, 10,10,20,30,30,20,10,10, 5,5,10,25,25,10,5,5, 0,0,0,20,20,0,0,0, 5,-5,-10,0,0,-10,-5,5, 5,10,10,-20,-20,10,10,5, 0,0,0,0,0,0,0,0]
KNIGHT_TABLE = [-50,-40,-30,-30,-30,-30,-40,-50, -40,-20,0,0,0,0,-20,-40, -30,0,10,15,15,10,0,-30, -30,5,15,20,20,15,5,-30, -30,0,15,20,20,15,0,-30, -30,5,10,15,15,10,5,-30, -40,-20,0,5,5,0,-20,-40, -50,-40,-30,-30,-30,-30,-40,-50]

DEPTHS = {1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6}
NOISE = {1: 0.5, 2: 0.3, 3: 0.15, 4: 0.05, 5: 0.0, 6: 0.0}

LEVEL_NAMES = {
    1: "Novato", 2: "Aprendiz", 3: "Experto",
    4: "Maestro", 5: "Gran Maestro", 6: "Dios Bot"
}

STYLES = {
    'balanced': 'Equilibrado',
    'aggressive': 'Agresivo',
    'defensive': 'Defensivo',
    'tactical': 'Tactico',
    'chaotic': 'Caotico',
}


class ChessAI:
    """Motor de IA para C8L Chess Master con 6 niveles."""

    def __init__(self, level=3, style='balanced'):
        self.level = min(6, max(1, level))
        self.style = style
        self.depth = DEPTHS[self.level]
        self.noise = NOISE[self.level]

    def evaluate_board(self, board):
        """Evaluacion posicional del tablero."""
        if board.is_checkmate():
            return -99999 if board.turn == chess.WHITE else 99999
        if board.is_stalemate() or board.is_insufficient_material():
            return 0

        score = 0
        for square in chess.SQUARES:
            piece = board.piece_at(square)
            if piece is None:
                continue
            value = PIECE_VALUES.get(piece.piece_type, 0)

            # Bonus posicional para peones y caballos
            if piece.piece_type == chess.PAWN:
                idx = square if piece.color == chess.WHITE else chess.square_mirror(square)
                value += PAWN_TABLE[idx] * 0.1
            elif piece.piece_type == chess.KNIGHT:
                idx = square if piece.color == chess.WHITE else chess.square_mirror(square)
                value += KNIGHT_TABLE[idx] * 0.1

            # Bonus por estilo
            if self.style == 'aggressive' and piece.piece_type in (chess.QUEEN, chess.KNIGHT):
                value *= 1.1
            elif self.style == 'defensive' and piece.piece_type in (chess.ROOK, chess.PAWN):
                value *= 1.1

            if piece.color == chess.WHITE:
                score += value
            else:
                score -= value

        # Bonus por movilidad
        score += len(list(board.legal_moves)) * 2 * (1 if board.turn == chess.WHITE else -1)
        # Bonus por control central
        center = [chess.D4, chess.D5, chess.E4, chess.E5]
        for sq in center:
            if board.piece_at(sq) and board.piece_at(sq).color == chess.WHITE:
                score += 15

        return score

    def minimax(self, board, depth, alpha, beta, maximizing):
        """Minimax con poda alfa-beta."""
        if depth == 0 or board.is_game_over():
            return self.evaluate_board(board)

        if maximizing:
            max_eval = float('-inf')
            for move in board.legal_moves:
                board.push(move)
                eval_score = self.minimax(board, depth - 1, alpha, beta, False)
                board.pop()
                max_eval = max(max_eval, eval_score)
                alpha = max(alpha, eval_score)
                if beta <= alpha:
                    break
            return max_eval
        else:
            min_eval = float('inf')
            for move in board.legal_moves:
                board.push(move)
                eval_score = self.minimax(board, depth - 1, alpha, beta, True)
                board.pop()
                min_eval = min(min_eval, eval_score)
                beta = min(beta, eval_score)
                if beta <= alpha:
                    break
            return min_eval

    def get_best_move(self, board):
        """Obtiene el mejor movimiento segun nivel y estilo."""
        legal_moves = list(board.legal_moves)
        if not legal_moves:
            return None

        # Evaluar todos los movimientos
        scored = []
        maximizing = board.turn == chess.WHITE

        for move in legal_moves:
            board.push(move)
            score = self.minimax(board, self.depth - 1, float('-inf'), float('inf'), not maximizing)
            board.pop()
            scored.append((move, score))

        # Ordenar (mejor primero para blancas, peor para negras)
        scored.sort(key=lambda x: x[1], reverse=maximizing)

        # Aplicar ruido (niveles bajos cometen errores)
        if random.random() < self.noise and len(scored) > 2:
            # Elegir entre los top N movimientos con algo de ruido
            n = min(5, len(scored))
            idx = random.randint(0, n - 1)
            return scored[idx][0]

        # Estilo caotico: aleatorio entre top 3
        if self.style == 'chaotic' and len(scored) > 2:
            return random.choice(scored[:3])[0]

        return scored[0][0]

    def get_level_info(self):
        """Info del nivel actual."""
        return {
            'level': self.level,
            'name': LEVEL_NAMES[self.level],
            'style': STYLES.get(self.style, 'Equilibrado'),
            'depth': self.depth,
        }
