# -*- coding: utf-8 -*-
"""
🍪 KUKIS — Motor del Juego de Cartas
Gestión de partidas activas, mecánicas de investigación y combate.
"""
import random
import time
from kukis.kukis_cards import get_random_hand, get_card_display, get_hand_display, get_card_by_index
from kukis.kukis_cases import get_random_case, get_case_display

# Partidas activas {chat_id: KukisGame}
active_games = {}


class KukisGame:
    """Una partida activa de Kukis."""

    def __init__(self, chat_id, player_name, player_id):
        self.chat_id = chat_id
        self.player_name = player_name
        self.player_id = player_id
        self.started_at = time.time()

        # Estado del juego
        self.balance = 500  # Chips iniciales
        self.hand = get_random_hand(6)
        self.current_case = None
        self.clues_placed = []  # Cartas colocadas como pistas (max 3)
        self.cases_resolved = 0
        self.cases_failed = 0
        self.unicorn_charges = 3
        self.total_chips_won = 0
        self.total_chips_spent = 0

        # Empezar con un caso
        self.new_case()

    def new_case(self):
        """Genera un nuevo caso de investigación."""
        self.current_case = get_random_case()
        self.clues_placed = []
        # Repartir nueva mano si quedan pocas cartas
        if len(self.hand) < 3:
            self.hand = get_random_hand(6)
        return self.current_case

    def get_status(self):
        """Estado completo del juego."""
        lines = [
            f"🍪 *KUKIS — Investigación Dulce*\n",
            f"👤 Investigador: *{self.player_name}*",
            f"🍪 Chips: *{self.balance}*",
            f"🦄 Cargas Unicornio: {self.unicorn_charges}",
            f"📋 Casos resueltos: {self.cases_resolved}",
            f"🃏 Cartas en mano: {len(self.hand)}",
            f"🔎 Pistas colocadas: {len(self.clues_placed)}/3",
        ]
        if self.clues_placed:
            placed_power = sum(c['power'] for c in self.clues_placed)
            lines.append(f"⚡ Poder acumulado: {placed_power}")
        return "\n".join(lines)

    def get_case_info(self):
        """Info del caso actual."""
        if not self.current_case:
            return "❌ No hay caso activo. Usa /kukis_caso para uno nuevo."
        return get_case_display(self.current_case)

    def get_hand_info(self):
        """Muestra la mano del jugador."""
        return get_hand_display(self.hand)

    def place_clue(self, card_index):
        """Coloca una carta de la mano como pista."""
        if not self.current_case:
            return False, "❌ No hay caso activo. Usa /kukis\\_caso para empezar."
        if len(self.clues_placed) >= 3:
            return False, "⚠️ Ya tienes 3 pistas colocadas. Usa /investigar para resolver."

        card = get_card_by_index(self.hand, card_index)
        if not card:
            return False, f"❌ Carta #{card_index} no existe. Tienes {len(self.hand)} cartas."

        # Mover carta de la mano a pistas
        self.clues_placed.append(card)
        self.hand.remove(card)

        placed_text = f"✅ *{card['emoji']} {card['name']}* colocada como pista #{len(self.clues_placed)}\n"
        placed_text += f"   ⚡ Poder: {card['power']} | 🎯 {card['ability']}\n\n"
        placed_text += self._get_clues_summary()

        return True, placed_text

    def investigate(self):
        """Intenta resolver el caso con las pistas colocadas."""
        if not self.current_case:
            return False, "❌ No hay caso activo."
        if len(self.clues_placed) < 3:
            return False, (
                f"🔍 Necesitas 3 pistas para investigar.\n"
                f"Tienes: {len(self.clues_placed)}/3\n\n"
                f"Usa /kukis\\_pista [número] para colocar cartas."
            )
        if self.balance < 50:
            return False, "🍪 Necesitas al menos 50 Chips para investigar."

        # Coste de investigación
        self.balance -= 50
        self.total_chips_spent += 50

        # Calcular poder total
        total_power = sum(c['power'] for c in self.clues_placed)

        # Bonificación por sinergia (1 de cada tipo = +3)
        types = set(c['type'] for c in self.clues_placed)
        synergy_bonus = 3 if len(types) == 3 else 0
        final_power = total_power + synergy_bonus

        # Dificultad requerida
        required = self.current_case['difficulty'] * 3
        villain = self.current_case['villain']
        villain_emoji = self.current_case['villain_emoji']

        result_text = f"🔍 *RESULTADO DE INVESTIGACIÓN*\n\n"
        result_text += f"⚡ Tu poder: {total_power}"
        if synergy_bonus:
            result_text += f" + {synergy_bonus} (¡Sinergia! 🌈)"
        result_text += f" = *{final_power}*\n"
        result_text += f"🎯 Necesario: *{required}*\n"
        result_text += f"⚔️ Villano: {villain_emoji} {villain}\n\n"

        if final_power >= required:
            # ¡CASO RESUELTO!
            reward = self.current_case['reward']
            self.balance += reward
            self.total_chips_won += reward
            self.cases_resolved += 1

            # Bonus por poder extra
            excess = final_power - required
            bonus = excess * 10
            if bonus > 0:
                self.balance += bonus
                self.total_chips_won += bonus

            result_text += (
                f"🎉🎉🎉 *¡CASO RESUELTO!* 🎉🎉🎉\n\n"
                f"🏆 ¡{villain_emoji} {villain} ha sido derrotado!\n"
                f"🍪 Recompensa: +{reward} Chips"
            )
            if bonus:
                result_text += f"\n⭐ Bonus por poder extra: +{bonus} Chips"
            result_text += f"\n💰 Balance: {self.balance} Chips"
            result_text += f"\n\n📋 Usa /kukis\\_caso para un nuevo misterio"

            success = True
        else:
            # Combate dulce — 40% chance de ganar si falla
            combat_result = self._sweet_combat(final_power, required)
            result_text += combat_result['text']
            success = combat_result['won']

        # Limpiar para el siguiente caso
        self.clues_placed = []
        return success, result_text

    def _sweet_combat(self, player_power, required):
        """Combate dulce cuando no se alcanza el poder necesario."""
        # Probabilidad basada en cuán cerca estás
        ratio = player_power / required
        win_chance = min(0.6, ratio * 0.5)  # Max 60% si estás justo por debajo

        if random.random() < win_chance:
            # Victoria parcial
            partial_reward = int(self.current_case['reward'] * 0.5)
            self.balance += partial_reward
            self.total_chips_won += partial_reward
            self.cases_resolved += 1

            return {
                'won': True,
                'text': (
                    f"⚔️ *¡COMBATE DULCE!*\n\n"
                    f"🌪️ Tu equipo lucha con todas sus fuerzas...\n"
                    f"💥 ¡VICTORIA por combate!\n\n"
                    f"🍪 Recompensa parcial: +{partial_reward} Chips\n"
                    f"💰 Balance: {self.balance} Chips\n\n"
                    f"📋 Usa /kukis\\_caso para un nuevo misterio"
                )
            }
        else:
            # Derrota
            self.cases_failed += 1
            villain = self.current_case['villain']
            return {
                'won': False,
                'text': (
                    f"⚔️ *¡COMBATE DULCE!*\n\n"
                    f"🌪️ Tu equipo lucha con todas sus fuerzas...\n"
                    f"💔 *DERROTA...* {villain} ha escapado.\n\n"
                    f"😢 Perdiste 50 Chips de investigación.\n"
                    f"💰 Balance: {self.balance} Chips\n\n"
                    f"💡 Tip: Necesitabas {required - player_power} más de poder.\n"
                    f"🦄 Usa /kukis\\_unicornio para robar cartas extra.\n"
                    f"📋 Usa /kukis\\_caso para intentar otro caso"
                )
            }

    def use_unicorn_power(self):
        """Usa la habilidad especial Unicornio — Roba 2 cartas extra."""
        if self.unicorn_charges <= 0:
            return False, (
                "🦄 ¡Sin cargas de poder Unicornio!\n"
                "Resuelve más casos para recargar.\n"
                f"(Se recarga 1 cada 2 casos resueltos)"
            )

        self.unicorn_charges -= 1
        new_cards = get_random_hand(2)
        self.hand.extend(new_cards)

        text = (
            f"🦄✨ *¡PODER UNICORNIO ACTIVADO!* ✨🦄\n\n"
            f"Robas 2 cartas nuevas:\n"
        )
        for card in new_cards:
            text += f"  • {card['emoji']} {card['name']} (⚡{card['power']})\n"
        text += f"\n🃏 Cartas en mano: {len(self.hand)}"
        text += f"\n🦄 Cargas restantes: {self.unicorn_charges}"

        return True, text

    def recharge_unicorn(self):
        """Recarga una carga unicornio (llamar cada 2 casos resueltos)."""
        if self.cases_resolved > 0 and self.cases_resolved % 2 == 0:
            self.unicorn_charges = min(5, self.unicorn_charges + 1)

    def _get_clues_summary(self):
        """Resumen de pistas colocadas."""
        if not self.clues_placed:
            return "🔎 Pistas: 0/3 — Usa /kukis\\_pista [número]"
        lines = [f"🔎 *PISTAS ({len(self.clues_placed)}/3):*"]
        total = 0
        for i, card in enumerate(self.clues_placed, 1):
            lines.append(f"  {i}. {card['emoji']} {card['name']} (⚡{card['power']})")
            total += card['power']
        lines.append(f"\n⚡ Poder acumulado: {total}")
        if len(self.clues_placed) < 3:
            lines.append(f"🎯 Falta{' 1 pista' if len(self.clues_placed) == 2 else 'n pistas'} más")
        else:
            # Sinergia check
            types = set(c['type'] for c in self.clues_placed)
            if len(types) == 3:
                lines.append(f"🌈 ¡SINERGIA! +3 bonus (Personaje+Objeto+Evento)")
            lines.append(f"\n✅ ¡Listo! Usa /investigar para resolver el caso")
        return "\n".join(lines)

    def get_full_display(self):
        """Vista completa del juego (caso + mano + pistas)."""
        parts = [self.get_status(), ""]
        if self.current_case:
            parts.append(self.get_case_info())
            parts.append("")
        parts.append(self._get_clues_summary())
        return "\n".join(parts)


# ============================================================
# FUNCIONES DE GESTIÓN DE PARTIDAS (como chess)
# ============================================================

def start_game(chat_id, player_name, player_id):
    """Inicia una nueva partida de Kukis."""
    game = KukisGame(chat_id, player_name, player_id)
    active_games[chat_id] = game
    return game


def get_game(chat_id):
    """Obtiene la partida activa."""
    return active_games.get(chat_id)


def end_game(chat_id):
    """Termina la partida activa."""
    return active_games.pop(chat_id, None)
