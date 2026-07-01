# -*- coding: utf-8 -*-
"""
🎰 C8L CASINO — API REST
Endpoints para el juego de tragaperras El León Dorado.
Se integra con el sistema económico existente.
"""

import json
import logging
import os
import sys
from datetime import datetime
from typing import Optional

from aiohttp import web

# Add parent to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from .slot_engine import SlotEngine

logger = logging.getLogger(__name__)

# Motor global del slot
slot_engine = SlotEngine()

# Estado de sesiones de giros gratis (en producción usar Redis)
free_spin_sessions = {}


async def handle_spin(request: web.Request) -> web.Response:
    """
    POST /api/casino/spin
    Body: {user_id, bet_per_line, num_lines, currency: "chips"|"credits"}
    """
    try:
        data = await request.json()
        user_id = data.get('user_id')
        bet_per_line = int(data.get('bet_per_line', 250))
        num_lines = int(data.get('num_lines', 20))
        currency = data.get('currency', 'chips')  # chips (gratis) o credits (real)

        if not user_id:
            return web.json_response({'error': 'user_id requerido'}, status=400)

        if bet_per_line < 10 or bet_per_line > 5000:
            return web.json_response({'error': 'Apuesta fuera de rango (10-5000)'}, status=400)

        if num_lines < 1 or num_lines > 20:
            return web.json_response({'error': 'Líneas fuera de rango (1-20)'}, status=400)

        total_bet = bet_per_line * num_lines

        # Verificar si tiene giros gratis activos
        session = free_spin_sessions.get(user_id)
        is_free_spin = False
        active_multiplier = 1

        if session and session['remaining'] > 0:
            is_free_spin = True
            active_multiplier = session.get('multiplier', 1)
            session['remaining'] -= 1
            if session['remaining'] == 0:
                del free_spin_sessions[user_id]

        # TODO: En producción, verificar balance con economy system
        # if not is_free_spin:
        #     from economy.economy import EconomySystem
        #     eco = EconomySystem()
        #     if currency == 'chips':
        #         balance = eco.get_balance(user_id)
        #         if balance['casino_chips'] < total_bet:
        #             return web.json_response({'error': 'Saldo insuficiente'}, status=402)
        #         eco.casino_result(user_id, total_bet, 0, 'slot_leon_dorado')

        # Ejecutar giro
        result = slot_engine.spin(
            user_id=user_id,
            bet_per_line=bet_per_line,
            num_lines=num_lines,
            is_free_spin=is_free_spin,
            active_multiplier=active_multiplier
        )

        # Guardar sesión de giros gratis si se activaron
        if result.free_spins_triggered:
            if user_id in free_spin_sessions:
                free_spin_sessions[user_id]['remaining'] += result.free_spins_awarded
            else:
                free_spin_sessions[user_id] = {
                    'remaining': result.free_spins_awarded,
                    'multiplier': result.multiplier if result.modo_rugido else 1,
                    'total_awarded': result.free_spins_awarded,
                    'total_won': 0,
                }

        # TODO: En producción, acreditar ganancias
        # if result.total_win > 0:
        #     eco.casino_result(user_id, 0, result.total_win, 'slot_leon_dorado')

        # Construir respuesta
        response = {
            'success': True,
            'grid': result.grid,
            'wins': result.wins,
            'total_win': result.total_win,
            'total_bet': result.total_bet,
            'scatter_count': result.scatter_count,
            'free_spins': {
                'triggered': result.free_spins_triggered,
                'awarded': result.free_spins_awarded,
                'remaining': free_spin_sessions.get(user_id, {}).get('remaining', 0),
            },
            'modo_rugido': {
                'active': result.modo_rugido,
                'multiplier': result.multiplier,
            },
            'jackpot': {
                'won': result.jackpot_won,
                'amount': result.jackpot_amount,
                'current': slot_engine.get_jackpot(),
            },
            'is_free_spin': is_free_spin,
            'rng_seed': result.rng_seed,
            'timestamp': datetime.now().isoformat(),
        }

        return web.json_response(response)

    except Exception as e:
        logger.error(f"Error en spin: {e}", exc_info=True)
        return web.json_response({'error': str(e)}, status=500)


async def handle_game_info(request: web.Request) -> web.Response:
    """GET /api/casino/info — Información del juego."""
    info = slot_engine.get_game_info()
    info['paytable'] = slot_engine.get_paytable_info()
    return web.json_response(info)


async def handle_jackpot(request: web.Request) -> web.Response:
    """GET /api/casino/jackpot — Jackpot actual."""
    return web.json_response({
        'jackpot': slot_engine.get_jackpot(),
        'timestamp': datetime.now().isoformat(),
    })


async def handle_balance(request: web.Request) -> web.Response:
    """
    GET /api/casino/balance?user_id=xxx
    Retorna balance del usuario para el casino.
    """
    user_id = request.query.get('user_id')
    if not user_id:
        return web.json_response({'error': 'user_id requerido'}, status=400)

    # TODO: Conectar con economy real
    # eco = EconomySystem()
    # balance = eco.get_balance(user_id)

    # Mock para desarrollo
    balance = {
        'user_id': user_id,
        'credits': 152_450_000,
        'chips': 8_250,
        'vip_level': 10,
        'free_spins_remaining': free_spin_sessions.get(user_id, {}).get('remaining', 0),
    }

    return web.json_response(balance)


async def handle_auto_spin(request: web.Request) -> web.Response:
    """
    POST /api/casino/auto-spin
    Body: {user_id, bet_per_line, num_lines, spins_count, stop_on_feature}
    Ejecuta múltiples giros automáticos.
    """
    try:
        data = await request.json()
        user_id = data.get('user_id')
        bet_per_line = int(data.get('bet_per_line', 250))
        num_lines = int(data.get('num_lines', 20))
        spins_count = min(int(data.get('spins_count', 10)), 100)
        stop_on_feature = data.get('stop_on_feature', True)

        results = []
        total_bet_all = 0
        total_win_all = 0

        for i in range(spins_count):
            result = slot_engine.spin(user_id, bet_per_line, num_lines)
            total_bet_all += result.total_bet
            total_win_all += result.total_win

            results.append({
                'spin': i + 1,
                'grid': result.grid,
                'total_win': result.total_win,
                'wins': result.wins,
                'free_spins_triggered': result.free_spins_triggered,
                'modo_rugido': result.modo_rugido,
            })

            # Parar si hay feature activada
            if stop_on_feature and (result.free_spins_triggered or result.jackpot_won):
                break

        return web.json_response({
            'success': True,
            'spins_executed': len(results),
            'total_bet': total_bet_all,
            'total_win': total_win_all,
            'net': total_win_all - total_bet_all,
            'results': results,
        })

    except Exception as e:
        logger.error(f"Error en auto-spin: {e}")
        return web.json_response({'error': str(e)}, status=500)


def setup_casino_routes(app: web.Application):
    """Registra las rutas del casino en la app."""
    app.router.add_post('/api/casino/spin', handle_spin)
    app.router.add_post('/api/casino/auto-spin', handle_auto_spin)
    app.router.add_get('/api/casino/info', handle_game_info)
    app.router.add_get('/api/casino/jackpot', handle_jackpot)
    app.router.add_get('/api/casino/balance', handle_balance)

    # Servir archivos estáticos del frontend
    casino_web_path = os.path.join(os.path.dirname(__file__), 'web')
    if os.path.exists(casino_web_path):
        app.router.add_static('/casino/', casino_web_path, name='casino_static')
        # Ruta principal del casino
        app.router.add_get('/casino', lambda r: web.FileResponse(
            os.path.join(casino_web_path, 'index.html')
        ))

    logger.info("🎰 C8L Casino routes registered")
