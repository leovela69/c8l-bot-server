# -*- coding: utf-8 -*-
"""
C8L Chess Master — Sistema de Skins y renderizado visual
"""
import chess

# Skins de piezas disponibles
SKINS = {
    'default': {
        'name': 'Clasico',
        'white': {chess.KING: '♔', chess.QUEEN: '♕', chess.ROOK: '♖', chess.BISHOP: '♗', chess.KNIGHT: '♘', chess.PAWN: '♙'},
        'black': {chess.KING: '♚', chess.QUEEN: '♛', chess.ROOK: '♜', chess.BISHOP: '♝', chess.KNIGHT: '♞', chess.PAWN: '♟'},
    },
    'c8l': {
        'name': 'C8L Corazones Locos',
        'white': {chess.KING: '👑', chess.QUEEN: '👸', chess.ROOK: '🏰', chess.BISHOP: '🧙', chess.KNIGHT: '🐴', chess.PAWN: '⚪'},
        'black': {chess.KING: '💀', chess.QUEEN: '👹', chess.ROOK: '🗼', chess.BISHOP: '🧛', chess.KNIGHT: '🐲', chess.PAWN: '⚫'},
    },
    'neon': {
        'name': 'Neon Ghost',
        'white': {chess.KING: '🔮', chess.QUEEN: '💜', chess.ROOK: '🟣', chess.BISHOP: '🔯', chess.KNIGHT: '🦄', chess.PAWN: '💠'},
        'black': {chess.KING: '🖤', chess.QUEEN: '🌑', chess.ROOK: '⬛', chess.BISHOP: '🔳', chess.KNIGHT: '🐍', chess.PAWN: '◼️'},
    },
    'fire': {
        'name': 'Fuego Infernal',
        'white': {chess.KING: '🔥', chess.QUEEN: '💥', chess.ROOK: '🌋', chess.BISHOP: '☄️', chess.KNIGHT: '🐉', chess.PAWN: '🔸'},
        'black': {chess.KING: '❄️', chess.QUEEN: '💎', chess.ROOK: '🧊', chess.BISHOP: '🌊', chess.KNIGHT: '🐋', chess.PAWN: '🔹'},
    },
}

# Piezas con nombre de streamer/miembro
PIECE_NAMES = {
    chess.KING: {'name': 'EL JEFE', 'streamer': '@C8L_Ceo'},
    chess.QUEEN: {'name': 'LA DIVA', 'streamer': '@LunaC8L'},
    chess.BISHOP: {'name': 'EL ESTRATEGA', 'streamer': '@Masters8L'},
    chess.KNIGHT: {'name': 'EL LOCO', 'streamer': '@CrazyRider'},
    chess.ROOK: {'name': 'EL BASTION', 'streamer': '@WallC8L'},
    chess.PAWN: {'name': 'EL FAN', 'streamer': 'Comunidad'},
}


def get_piece_emoji(piece, skin='default'):
    """Obtiene el emoji de una pieza segun el skin."""
    s = SKINS.get(skin, SKINS['default'])
    color_key = 'white' if piece.color == chess.WHITE else 'black'
    return s[color_key].get(piece.piece_type, '?')


def get_board_text(board, skin='default', perspective=chess.WHITE):
    """Renderiza el tablero completo como texto con emojis."""
    s = SKINS.get(skin, SKINS['default'])
    light_sq = '⬜'
    dark_sq = '⬛'

    lines = []
    lines.append("  a  b  c  d  e  f  g  h")

    ranks = range(7, -1, -1) if perspective == chess.WHITE else range(8)

    for rank in ranks:
        row = f"{rank + 1} "
        for file in range(8):
            square = chess.square(file, rank)
            piece = board.piece_at(square)
            if piece:
                row += get_piece_emoji(piece, skin) + " "
            else:
                # Alternating squares
                if (rank + file) % 2 == 0:
                    row += dark_sq + " " if skin != 'default' else "·  "
                else:
                    row += light_sq + " " if skin != 'default' else "·  "
        row += f" {rank + 1}"
        lines.append(row)

    lines.append("  a  b  c  d  e  f  g  h")
    return "\n".join(lines)


def get_available_skins():
    """Lista de skins disponibles."""
    return [(k, v['name']) for k, v in SKINS.items()]
