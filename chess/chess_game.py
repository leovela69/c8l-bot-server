# -*- coding: utf-8 -*-
"""
C8L Chess Master — Gestion de partidas
"""
import chess
import time
from chess.chess_ai import ChessAI
from chess.chess_skins import get_board_text

# Partidas activas {chat_id: ChessGame}
active_games = {}


class ChessGame:
    """Una partida de ajedrez activa."""

    def __init__(self, chat_id, player_name, level=3, style='balanced', color='white'):
        self.chat_id = chat_id
        self.player_name = player_name
        self.board = chess.Board()
        self.ai = ChessAI(level=level, style=style)
        self.player_color = chess.WHITE if color == 'white' else chess.BLACK
        self.started_at = time.time()
        self.moves_history = []
        self.result = None

    def is_player_turn(self):
        return self.board.turn == self.player_color

    def make_player_move(self, move_str):
        """Intenta hacer un movimiento del jugador. Retorna (exito, mensaje)."""
        try:
            move = self.board.parse_san(move_str)
        except ValueError:
            try:
                move = self.board.parse_uci(move_str)
            except ValueError:
                return False, f"Movimiento invalido: '{move_str}'. Usa notacion como e4, Nf3, O-O"

        if move not in self.board.legal_moves:
            return False, f"Movimiento ilegal: '{move_str}'. Movimientos legales: {self._legal_moves_str()}"

        self.board.push(move)
        self.moves_history.append(move.uci())
        return True, f"Tu: {self.board.san(move) if hasattr(self.board, 'san') else move.uci()}"

    def make_ai_move(self):
        """La IA hace su movimiento. Retorna el movimiento."""
        move = self.ai.get_best_move(self.board)
        if move is None:
            return None
        san = self.board.san(move)
        self.board.push(move)
        self.moves_history.append(move.uci())
        return san

    def get_status(self):
        """Estado actual del juego."""
        if self.board.is_checkmate():
            winner = "Negras" if self.board.turn == chess.WHITE else "Blancas"
            if (winner == "Blancas" and self.player_color == chess.WHITE) or \
               (winner == "Negras" and self.player_color == chess.BLACK):
                self.result = 'win'
                return 'checkmate_win'
            else:
                self.result = 'loss'
                return 'checkmate_loss'
        if self.board.is_stalemate():
            self.result = 'draw'
            return 'stalemate'
        if self.board.is_insufficient_material():
            self.result = 'draw'
            return 'insufficient'
        if self.board.is_check():
            return 'check'
        return 'ongoing'

    def get_board_display(self, skin='default'):
        """Renderiza el tablero como texto."""
        return get_board_text(self.board, skin, self.player_color)

    def get_pgn(self):
        """Exporta la partida en PGN."""
        game_board = chess.Board()
        moves_san = []
        for uci in self.moves_history:
            move = chess.Move.from_uci(uci)
            moves_san.append(game_board.san(move))
            game_board.push(move)
        pgn = ""
        for i in range(0, len(moves_san), 2):
            move_num = i // 2 + 1
            pgn += f"{move_num}. {moves_san[i]} "
            if i + 1 < len(moves_san):
                pgn += f"{moves_san[i+1]} "
        return pgn.strip()

    def _legal_moves_str(self):
        """Lista de movimientos legales (primeros 10)."""
        moves = [self.board.san(m) for m in list(self.board.legal_moves)[:10]]
        return ", ".join(moves) + ("..." if len(list(self.board.legal_moves)) > 10 else "")


def start_game(chat_id, player_name, level=3, style='balanced', color='white'):
    """Inicia una nueva partida."""
    game = ChessGame(chat_id, player_name, level, style, color)
    active_games[chat_id] = game
    return game


def get_game(chat_id):
    """Obtiene la partida activa."""
    return active_games.get(chat_id)


def end_game(chat_id):
    """Termina la partida activa."""
    return active_games.pop(chat_id, None)
