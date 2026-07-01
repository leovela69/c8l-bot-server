# -*- coding: utf-8 -*-
"""
🎰 C8L CASINO — MOTOR DE TRAGAPERRAS "EL LEÓN DORADO"
Motor RNG con tabla de pagos, features especiales, jackpot progresivo.

Características:
- 5 carretes × 3 filas
- 20 líneas de pago
- Símbolos: León, Wild, Scatter, A, K, Q, J, 10
- Features: Giros Gratis, Modo Rugido (multiplicador), Jackpot Global
- RTP objetivo: 96.5%
"""

import random
import time
import hashlib
from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass, field
from enum import Enum


# ============================================================
# SÍMBOLOS
# ============================================================

class Symbol(Enum):
    LEON = "leon"           # Símbolo de mayor valor
    WILD = "wild"           # Sustituye a todos excepto Scatter
    SCATTER = "scatter"     # Activa Giros Gratis
    ACE = "A"              # Valor alto
    KING = "K"             # Valor medio-alto
    QUEEN = "Q"            # Valor medio
    JACK = "J"             # Valor medio-bajo
    TEN = "10"             # Valor bajo


# Pesos de aparición en los carretes (controlan RTP)
# Mayor peso = más frecuente
REEL_WEIGHTS = {
    Symbol.LEON:    [3, 3, 3, 3, 3],     # Raro pero presente
    Symbol.WILD:    [2, 3, 3, 3, 2],     # Más frecuente en centrales
    Symbol.SCATTER: [2, 2, 2, 2, 2],     # Uniforme
    Symbol.ACE:     [5, 5, 5, 5, 5],     # Frecuente
    Symbol.KING:    [6, 6, 6, 6, 6],     # Más frecuente
    Symbol.QUEEN:   [7, 7, 7, 7, 7],     # Común
    Symbol.JACK:    [8, 8, 8, 8, 8],     # Muy común
    Symbol.TEN:     [9, 9, 9, 9, 9],     # Más común
}

# Tabla de pagos (multiplicador × apuesta por línea)
# {símbolo: {cantidad_en_línea: multiplicador}}
PAYTABLE = {
    Symbol.LEON:    {5: 500, 4: 100, 3: 25},
    Symbol.WILD:    {5: 1000, 4: 200, 3: 50},  # Wild paga más
    Symbol.ACE:     {5: 50, 4: 15, 3: 5},
    Symbol.KING:    {5: 40, 4: 12, 3: 4},
    Symbol.QUEEN:   {5: 30, 4: 10, 3: 3},
    Symbol.JACK:    {5: 20, 4: 8, 3: 2},
    Symbol.TEN:     {5: 15, 4: 5, 3: 2},
}

# Scatter paga por total en pantalla (no necesita línea)
SCATTER_PAYS = {5: 100, 4: 20, 3: 5}

# 20 líneas de pago (posiciones [fila] para cada carrete)
# Filas: 0=arriba, 1=centro, 2=abajo
PAYLINES = [
    [1, 1, 1, 1, 1],  # Línea 1: Centro horizontal
    [0, 0, 0, 0, 0],  # Línea 2: Arriba horizontal
    [2, 2, 2, 2, 2],  # Línea 3: Abajo horizontal
    [0, 1, 2, 1, 0],  # Línea 4: V invertida
    [2, 1, 0, 1, 2],  # Línea 5: V
    [0, 0, 1, 2, 2],  # Línea 6: Diagonal descendente
    [2, 2, 1, 0, 0],  # Línea 7: Diagonal ascendente
    [1, 0, 0, 0, 1],  # Línea 8: Arco arriba
    [1, 2, 2, 2, 1],  # Línea 9: Arco abajo
    [0, 1, 1, 1, 0],  # Línea 10: Suave arriba
    [2, 1, 1, 1, 2],  # Línea 11: Suave abajo
    [1, 0, 1, 2, 1],  # Línea 12: Zigzag
    [1, 2, 1, 0, 1],  # Línea 13: Zigzag inverso
    [0, 0, 1, 0, 0],  # Línea 14: Pico centro
    [2, 2, 1, 2, 2],  # Línea 15: Valle centro
    [0, 1, 0, 1, 0],  # Línea 16: Ondulación arriba
    [2, 1, 2, 1, 2],  # Línea 17: Ondulación abajo
    [1, 0, 1, 0, 1],  # Línea 18: Zigzag superior
    [1, 2, 1, 2, 1],  # Línea 19: Zigzag inferior
    [0, 1, 2, 2, 1],  # Línea 20: Escalera
]


# ============================================================
# CONFIGURACIÓN DE FEATURES
# ============================================================

FREE_SPINS_TRIGGER = 3          # Scatters necesarios para activar
FREE_SPINS_BASE = 10            # Giros gratis base
FREE_SPINS_EXTRA_4 = 15        # Con 4 scatters
FREE_SPINS_EXTRA_5 = 25        # Con 5 scatters

MODO_RUGIDO_MULTIPLIERS = [2, 3, 5, 8, 10]  # Multiplicadores posibles
MODO_RUGIDO_CHANCE = 0.05      # 5% de chance por giro ganador

JACKPOT_CONTRIBUTION = 0.01    # 1% de cada apuesta va al jackpot
JACKPOT_BASE = 1_000_000       # Jackpot inicial
JACKPOT_TRIGGER_CHANCE = 0.0001  # 0.01% de chance por giro


# ============================================================
# MOTOR PRINCIPAL
# ============================================================

@dataclass
class SpinResult:
    """Resultado de un giro."""
    grid: List[List[str]]               # Grid 5×3 con nombres de símbolos
    wins: List[Dict]                     # Lista de ganancias por línea
    total_win: int                       # Ganancia total
    scatter_count: int                   # Número de scatters
    free_spins_triggered: bool           # Si se activaron giros gratis
    free_spins_awarded: int             # Cantidad de giros gratis
    modo_rugido: bool                   # Si se activó modo rugido
    multiplier: int                     # Multiplicador activo
    jackpot_won: bool                   # Si ganó el jackpot
    jackpot_amount: int                 # Cantidad del jackpot ganado
    bet_per_line: int                   # Apuesta por línea
    total_bet: int                      # Apuesta total
    rng_seed: str                       # Semilla RNG para verificación


class SlotEngine:
    """Motor de la tragaperras El León Dorado."""

    def __init__(self):
        self.jackpot_pool = JACKPOT_BASE
        self._rng = random.Random()

    def _generate_seed(self, user_id: str) -> str:
        """Genera semilla verificable basada en tiempo + usuario."""
        raw = f"{user_id}:{time.time_ns()}:{random.getrandbits(128)}"
        return hashlib.sha256(raw.encode()).hexdigest()[:16]

    def _weighted_random_symbol(self, reel_index: int, rng: random.Random) -> Symbol:
        """Selecciona símbolo aleatorio ponderado para un carrete."""
        symbols = list(REEL_WEIGHTS.keys())
        weights = [REEL_WEIGHTS[s][reel_index] for s in symbols]
        return rng.choices(symbols, weights=weights, k=1)[0]

    def _generate_grid(self, rng: random.Random) -> List[List[Symbol]]:
        """Genera grid 5×3 aleatorio."""
        grid = []
        for reel in range(5):
            column = []
            for row in range(3):
                symbol = self._weighted_random_symbol(reel, rng)
                column.append(symbol)
            grid.append(column)
        return grid

    def _check_payline(self, grid: List[List[Symbol]], payline: List[int]) -> Optional[Dict]:
        """Evalúa una línea de pago."""
        symbols_in_line = [grid[reel][payline[reel]] for reel in range(5)]

        # Determinar símbolo ganador (primer no-wild de izquierda a derecha)
        target_symbol = None
        for s in symbols_in_line:
            if s != Symbol.WILD and s != Symbol.SCATTER:
                target_symbol = s
                break

        if target_symbol is None:
            # Toda la línea es wild
            if all(s == Symbol.WILD for s in symbols_in_line):
                target_symbol = Symbol.WILD
            else:
                return None

        # Contar coincidencias consecutivas desde la izquierda
        count = 0
        for s in symbols_in_line:
            if s == target_symbol or s == Symbol.WILD:
                count += 1
            else:
                break

        # Verificar si hay pago
        if target_symbol in PAYTABLE and count >= 3:
            multiplier = PAYTABLE[target_symbol].get(count, 0)
            if multiplier > 0:
                return {
                    'symbol': target_symbol.value,
                    'count': count,
                    'multiplier': multiplier,
                    'positions': [(reel, payline[reel]) for reel in range(count)],
                    'wild_positions': [(reel, payline[reel]) for reel in range(count) if symbols_in_line[reel] == Symbol.WILD]
                }

        return None

    def _count_scatters(self, grid: List[List[Symbol]]) -> Tuple[int, List[Tuple[int, int]]]:
        """Cuenta scatters en toda la pantalla."""
        count = 0
        positions = []
        for reel in range(5):
            for row in range(3):
                if grid[reel][row] == Symbol.SCATTER:
                    count += 1
                    positions.append((reel, row))
        return count, positions

    def _check_modo_rugido(self, has_win: bool, rng: random.Random) -> Tuple[bool, int]:
        """Verifica si se activa el Modo Rugido."""
        if has_win and rng.random() < MODO_RUGIDO_CHANCE:
            multiplier = rng.choice(MODO_RUGIDO_MULTIPLIERS)
            return True, multiplier
        return False, 1

    def _check_jackpot(self, rng: random.Random) -> bool:
        """Verifica si se gana el jackpot."""
        return rng.random() < JACKPOT_TRIGGER_CHANCE

    def spin(self, user_id: str, bet_per_line: int, num_lines: int = 20,
             is_free_spin: bool = False, active_multiplier: int = 1) -> SpinResult:
        """
        Ejecuta un giro completo.
        
        Args:
            user_id: ID del usuario
            bet_per_line: Apuesta por línea
            num_lines: Número de líneas activas (1-20)
            is_free_spin: Si es un giro gratis (no cobra)
            active_multiplier: Multiplicador activo (modo rugido)
        
        Returns:
            SpinResult con todos los datos del giro
        """
        # Generar semilla y RNG
        seed = self._generate_seed(user_id)
        rng = random.Random(seed)

        total_bet = bet_per_line * num_lines if not is_free_spin else 0

        # Contribución al jackpot
        if not is_free_spin:
            self.jackpot_pool += int(total_bet * JACKPOT_CONTRIBUTION)

        # Generar grid
        grid = self._generate_grid(rng)

        # Evaluar todas las líneas de pago
        wins = []
        total_win = 0
        for i, payline in enumerate(PAYLINES[:num_lines]):
            result = self._check_payline(grid, payline)
            if result:
                line_win = result['multiplier'] * bet_per_line
                result['line'] = i + 1
                result['win'] = line_win
                wins.append(result)
                total_win += line_win

        # Evaluar Scatters
        scatter_count, scatter_positions = self._count_scatters(grid)
        free_spins_triggered = scatter_count >= FREE_SPINS_TRIGGER
        free_spins_awarded = 0

        if free_spins_triggered:
            if scatter_count >= 5:
                free_spins_awarded = FREE_SPINS_EXTRA_5
            elif scatter_count >= 4:
                free_spins_awarded = FREE_SPINS_EXTRA_4
            else:
                free_spins_awarded = FREE_SPINS_BASE

            # Scatter también paga
            scatter_pay = SCATTER_PAYS.get(scatter_count, 0)
            if scatter_pay > 0:
                scatter_win = scatter_pay * total_bet if total_bet > 0 else scatter_pay * bet_per_line * num_lines
                wins.append({
                    'symbol': 'scatter',
                    'count': scatter_count,
                    'multiplier': scatter_pay,
                    'win': scatter_win,
                    'positions': scatter_positions,
                    'line': 'scatter'
                })
                total_win += scatter_win

        # Modo Rugido
        modo_rugido, multiplier = self._check_modo_rugido(total_win > 0, rng)
        if modo_rugido:
            multiplier = max(multiplier, active_multiplier)
        else:
            multiplier = active_multiplier

        # Aplicar multiplicador
        total_win *= multiplier

        # Jackpot
        jackpot_won = self._check_jackpot(rng) if total_bet > 0 else False
        jackpot_amount = 0
        if jackpot_won:
            jackpot_amount = self.jackpot_pool
            self.jackpot_pool = JACKPOT_BASE  # Reset

        total_win += jackpot_amount

        # Convertir grid a formato serializable
        grid_str = [[s.value for s in col] for col in grid]

        return SpinResult(
            grid=grid_str,
            wins=wins,
            total_win=total_win,
            scatter_count=scatter_count,
            free_spins_triggered=free_spins_triggered,
            free_spins_awarded=free_spins_awarded,
            modo_rugido=modo_rugido,
            multiplier=multiplier,
            jackpot_won=jackpot_won,
            jackpot_amount=jackpot_amount,
            bet_per_line=bet_per_line,
            total_bet=total_bet,
            rng_seed=seed,
        )

    def get_jackpot(self) -> int:
        """Retorna el jackpot actual."""
        return self.jackpot_pool

    def get_paytable_info(self) -> Dict:
        """Retorna información de la tabla de pagos."""
        info = {}
        for symbol, pays in PAYTABLE.items():
            info[symbol.value] = pays
        info['scatter'] = SCATTER_PAYS
        return info

    def get_game_info(self) -> Dict:
        """Retorna información general del juego."""
        return {
            'name': 'El León Dorado',
            'brand': 'C8L Casino',
            'reels': 5,
            'rows': 3,
            'paylines': 20,
            'min_bet': 10,
            'max_bet': 5000,
            'bet_levels': [10, 25, 50, 100, 250, 500, 1000, 2500, 5000],
            'symbols': [s.value for s in Symbol],
            'features': [
                'Wild (sustituye todos excepto Scatter)',
                'Scatter (3+ activa Giros Gratis)',
                'Giros Gratis (10/15/25 con 3/4/5 Scatter)',
                'Modo Rugido (multiplicador x2-x10)',
                'Jackpot Global Progresivo'
            ],
            'rtp': 96.5,
            'jackpot': self.jackpot_pool
        }
