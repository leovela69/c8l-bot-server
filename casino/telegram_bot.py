# -*- coding: utf-8 -*-
"""
🎰 C8L CASINO — Integración con Bot de Telegram
Comandos para jugar tragaperras directamente desde el chat.
"""

import logging
from typing import Optional

logger = logging.getLogger(__name__)

# Importar motor
from .slot_engine import SlotEngine, Symbol

# Instancia compartida
_engine = SlotEngine()

# Mapeo de símbolos a emojis para Telegram
SYMBOL_EMOJI = {
    'leon': '🦁',
    'wild': '❤️‍🔥',
    'scatter': '👑',
    'A': '🅰️',
    'K': '🔷',
    'Q': '💜',
    'J': '🃏',
    '10': '🔟',
}


def format_grid(grid: list) -> str:
    """Formatea el grid 5×3 para mostrar en Telegram."""
    lines = []
    for row in range(3):
        row_symbols = []
        for reel in range(5):
            sym_id = grid[reel][row]
            emoji = SYMBOL_EMOJI.get(sym_id, '❓')
            row_symbols.append(emoji)
        lines.append(' │ '.join(row_symbols))
    
    separator = '─' * 25
    return f"┌{separator}┐\n│ {lines[0]} │\n│ {lines[1]} │  ← Centro\n│ {lines[2]} │\n└{separator}┘"


def format_wins(wins: list) -> str:
    """Formatea las ganancias para mostrar."""
    if not wins:
        return "Sin ganancias este giro."
    
    text = "🏆 *GANANCIAS:*\n"
    for win in wins:
        emoji = SYMBOL_EMOJI.get(win['symbol'], '❓')
        text += f"  {emoji} ×{win['count']} → +{win['win']:,} (Línea {win['line']})\n"
    return text


async def cmd_slot_spin(user_id: str, bet: int = 250, lines: int = 20) -> dict:
    """
    Ejecuta un giro desde el bot de Telegram.
    
    Returns: dict con toda la info formateada para enviar
    """
    result = _engine.spin(
        user_id=str(user_id),
        bet_per_line=bet,
        num_lines=lines
    )
    
    # Formatear mensaje
    grid_text = format_grid(result.grid)
    wins_text = format_wins(result.wins)
    
    # Header
    header = "🎰 *C8L CASINO — EL LEÓN DORADO* 🦁\n\n"
    
    # Info de apuesta
    bet_info = f"💰 Apuesta: {bet} × {lines} líneas = *{result.total_bet:,}*\n\n"
    
    # Grid
    grid_section = f"```\n{grid_text}\n```\n\n"
    
    # Ganancias
    win_section = wins_text + "\n"
    
    # Total
    if result.total_win > 0:
        total_section = f"\n💎 *GANANCIA TOTAL: {result.total_win:,}*\n"
    else:
        total_section = "\n😤 Sin suerte... ¡Inténtalo de nuevo!\n"
    
    # Features especiales
    features = ""
    if result.free_spins_triggered:
        features += f"\n🌟 *¡GIROS GRATIS ACTIVADOS!* 🌟\n"
        features += f"   Has ganado *{result.free_spins_awarded}* giros gratis!\n"
    
    if result.modo_rugido:
        features += f"\n🦁🔥 *¡MODO RUGIDO ACTIVADO!* 🔥🦁\n"
        features += f"   Multiplicador: *×{result.multiplier}*\n"
    
    if result.jackpot_won:
        features += f"\n🎊🎊🎊 *¡¡¡JACKPOT!!!* 🎊🎊🎊\n"
        features += f"   Has ganado: *{result.jackpot_amount:,}* 🏆\n"
    
    # Jackpot info
    jackpot_info = f"\n🏅 Jackpot Global: *{_engine.get_jackpot():,}*"
    
    full_message = header + bet_info + grid_section + win_section + total_section + features + jackpot_info
    
    return {
        'message': full_message,
        'total_win': result.total_win,
        'total_bet': result.total_bet,
        'free_spins_triggered': result.free_spins_triggered,
        'free_spins_awarded': result.free_spins_awarded,
        'jackpot_won': result.jackpot_won,
        'modo_rugido': result.modo_rugido,
        'parse_mode': 'Markdown'
    }


async def cmd_slot_info() -> str:
    """Retorna información del juego."""
    info = _engine.get_game_info()
    
    text = "🎰 *C8L CASINO — EL LEÓN DORADO* 🦁\n\n"
    text += "📋 *INFORMACIÓN DEL JUEGO:*\n"
    text += f"  • Carretes: {info['reels']} × {info['rows']}\n"
    text += f"  • Líneas de pago: {info['paylines']}\n"
    text += f"  • RTP: {info['rtp']}%\n"
    text += f"  • Apuesta mín/máx: {info['min_bet']} - {info['max_bet']}\n\n"
    
    text += "🏆 *TABLA DE PAGOS (×apuesta):*\n"
    paytable = _engine.get_paytable_info()
    for sym_id, pays in paytable.items():
        emoji = SYMBOL_EMOJI.get(sym_id, '❓')
        pays_str = ' | '.join([f"×{count}={mult}" for count, mult in sorted(pays.items(), reverse=True)])
        text += f"  {emoji} {pays_str}\n"
    
    text += "\n⚡ *FEATURES:*\n"
    for feat in info['features']:
        text += f"  • {feat}\n"
    
    text += f"\n🏅 *Jackpot actual: {info['jackpot']:,}*"
    
    return text


async def cmd_slot_jackpot() -> str:
    """Muestra el jackpot actual."""
    jackpot = _engine.get_jackpot()
    return f"🏅 *JACKPOT GLOBAL C8L CASINO*\n\n💰 *{jackpot:,}* créditos\n\n🦁 ¡Juega para ganar el premio mayor!"


# ================================================================
# Registro de handlers para el bot principal
# ================================================================

def register_casino_handlers(app_or_bot):
    """
    Registra los comandos del casino en el bot.
    Compatible con python-telegram-bot o telebot.
    
    Comandos:
        /slot - Girar (apuesta por defecto)
        /slot 500 - Girar con apuesta 500 por línea
        /slotinfo - Info del juego
        /jackpot - Ver jackpot actual
    """
    # Este método se adaptará según el framework del bot
    logger.info("🎰 Casino handlers registered for Telegram bot")
    
    return {
        'commands': [
            {'command': 'slot', 'description': '🎰 Jugar tragaperras El León Dorado'},
            {'command': 'slotinfo', 'description': '📋 Info del juego y tabla de pagos'},
            {'command': 'jackpot', 'description': '🏅 Ver jackpot global actual'},
            {'command': 'casino', 'description': '🎮 Abrir C8L Casino en la web'},
        ]
    }
