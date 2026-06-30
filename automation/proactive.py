# -*- coding: utf-8 -*-
"""
🔮 PROACTIVE ENGINE — Motor de Acciones Proactivas
====================================================
El bot anticipa necesidades del usuario basándose en:
- Historial de interacciones
- Hora del día
- Patrones de uso
- Eventos detectados
"""

import time
import logging
from typing import Dict, List, Optional
from collections import defaultdict

logger = logging.getLogger("c8l.automation.proactive")


class ProactiveEngine:
    """
    Motor de predicción proactiva.
    Sugiere acciones antes de que el usuario las pida.
    """

    def __init__(self):
        self._user_patterns: Dict[str, Dict] = defaultdict(
            lambda: {"actions": [], "times": [], "frequencies": {}}
        )
        self.suggestion_count = 0

    def record_action(self, user_id: str, action: str,
                      intent: str = ""):
        """Registra una acción del usuario para aprender patrones."""
        uid = str(user_id)
        now = time.time()
        hour = time.localtime(now).tm_hour

        pattern = self._user_patterns[uid]
        pattern["actions"].append({
            "action": action,
            "intent": intent,
            "hour": hour,
            "time": now,
        })

        # Limitar historial
        if len(pattern["actions"]) > 200:
            pattern["actions"] = pattern["actions"][-200:]

        # Actualizar frecuencias
        freq = pattern["frequencies"]
        freq[action] = freq.get(action, 0) + 1

    def get_suggestion(self, user_id: str) -> Optional[str]:
        """
        Genera una sugerencia proactiva basada en patrones.

        Returns:
            Texto de sugerencia o None si no hay predicción
        """
        uid = str(user_id)
        pattern = self._user_patterns.get(uid)
        if not pattern or not pattern.get("actions"):
            return None

        # Hora actual
        current_hour = time.localtime().tm_hour

        # Buscar acciones frecuentes a esta hora
        hour_actions = [
            a["action"] for a in pattern["actions"]
            if a.get("hour") == current_hour
        ]

        if not hour_actions:
            return None

        # Acción más frecuente a esta hora
        action_counts = {}
        for a in hour_actions:
            action_counts[a] = action_counts.get(a, 0) + 1

        top_action = max(action_counts, key=action_counts.get)
        count = action_counts[top_action]

        # Solo sugerir si hay suficientes repeticiones (>3)
        if count >= 3:
            self.suggestion_count += 1
            return self._format_suggestion(top_action, count)

        return None

    def get_next_likely_action(self, user_id: str,
                               last_action: str) -> Optional[str]:
        """Predice la siguiente acción probable."""
        uid = str(user_id)
        pattern = self._user_patterns.get(uid)
        if not pattern:
            return None

        # Buscar acciones que siguen a last_action
        actions = pattern["actions"]
        next_actions = []
        for i in range(len(actions) - 1):
            if actions[i].get("action") == last_action:
                next_actions.append(actions[i + 1].get("action"))

        if not next_actions:
            return None

        # Más frecuente
        counts = {}
        for a in next_actions:
            counts[a] = counts.get(a, 0) + 1

        return max(counts, key=counts.get)

    def _format_suggestion(self, action: str, frequency: int) -> str:
        """Formatea la sugerencia."""
        suggestions = {
            "crear_imagen": "🎨 ¿Quieres crear una imagen? Sueles hacerlo a esta hora.",
            "crear_musica": "🎵 ¿Componemos algo? Es tu hora creativa habitual.",
            "crypto": "💰 ¿Revisamos las cryptos? Sueles consultarlas ahora.",
            "clima": "🌤️ ¿Quieres saber el clima de hoy?",
            "noticias": "📰 ¿Te muestro las noticias del día?",
        }
        return suggestions.get(action,
                              f"💡 Sugerencia: {action} (lo haces {frequency}x a esta hora)")

    def get_stats(self) -> Dict:
        return {
            "tracked_users": len(self._user_patterns),
            "suggestions_made": self.suggestion_count,
        }
