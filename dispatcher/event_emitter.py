# -*- coding: utf-8 -*-
"""
📡 EVENT EMITTER — Bus de Eventos del Enjambre
================================================
Sistema pub/sub ligero para comunicación entre componentes.

Permite:
- Notificar al enjambre de acciones completadas
- Logging distribuido sin acoplamiento
- Métricas en tiempo real
- Triggers para tareas automáticas
- Comunicación entre bots sin dependencias directas
"""

import time
import logging
import threading
from typing import Dict, List, Callable, Any
from collections import defaultdict, deque

logger = logging.getLogger("c8l.dispatcher.events")


class EventEmitter:
    """
    📡 Bus de eventos ultraligero.
    Sin dependencias externas (no requiere Redis para empezar).

    En producción se puede conectar a Redis Streams o
    Upstash Redis para eventos distribuidos.
    """

    def __init__(self, max_history: int = 500):
        self._listeners: Dict[str, List[Callable]] = defaultdict(list)
        self._history: deque = deque(maxlen=max_history)
        self._lock = threading.Lock()
        self.emit_count = 0

        # Métricas por tipo de evento
        self._event_counts: Dict[str, int] = defaultdict(int)

    def on(self, event_type: str, callback: Callable):
        """
        Registra un listener para un tipo de evento.

        Args:
            event_type: Tipo de evento (ej: "dispatch_ok", "user_new")
            callback: Función a llamar cuando se emite el evento
        """
        with self._lock:
            self._listeners[event_type].append(callback)
            logger.debug(f"📡 Listener registered: {event_type}")

    def off(self, event_type: str, callback: Callable):
        """Elimina un listener."""
        with self._lock:
            if event_type in self._listeners:
                self._listeners[event_type] = [
                    cb for cb in self._listeners[event_type]
                    if cb != callback
                ]

    def emit(self, event_type: str, data: Dict = None):
        """
        Emite un evento a todos los listeners registrados.

        Args:
            event_type: Tipo de evento
            data: Datos del evento
        """
        self.emit_count += 1
        self._event_counts[event_type] += 1

        event = {
            "type": event_type,
            "data": data or {},
            "timestamp": time.time(),
            "id": self.emit_count,
        }

        # Guardar en historial
        self._history.append(event)

        # Notificar listeners (non-blocking)
        listeners = self._listeners.get(event_type, [])
        wildcard_listeners = self._listeners.get("*", [])
        all_listeners = listeners + wildcard_listeners

        for callback in all_listeners:
            try:
                callback(event)
            except Exception as e:
                logger.warning(f"Event listener error ({event_type}): {e}")

    def emit_async(self, event_type: str, data: Dict = None):
        """Emite evento en un thread separado (non-blocking)."""
        thread = threading.Thread(
            target=self.emit,
            args=(event_type, data),
            daemon=True
        )
        thread.start()

    def get_history(self, event_type: str = None,
                    limit: int = 50) -> List[Dict]:
        """
        Obtiene historial de eventos.

        Args:
            event_type: Filtrar por tipo (None = todos)
            limit: Máximo de eventos a devolver
        """
        if event_type:
            filtered = [e for e in self._history if e["type"] == event_type]
            return list(filtered)[-limit:]
        return list(self._history)[-limit:]

    def get_stats(self) -> Dict:
        """Estadísticas del bus de eventos."""
        return {
            "total_emitted": self.emit_count,
            "event_types": dict(self._event_counts),
            "listeners_count": {
                k: len(v) for k, v in self._listeners.items()
            },
            "history_size": len(self._history),
        }

    def get_stats_text(self) -> str:
        """Texto legible de estadísticas."""
        s = self.get_stats()
        top_events = sorted(
            s["event_types"].items(),
            key=lambda x: x[1],
            reverse=True
        )[:5]
        events_text = "\n".join(
            f"  • {name}: {count}" for name, count in top_events
        )
        return (
            f"📡 *Event Emitter Stats*\n\n"
            f"📊 Total eventos: {s['total_emitted']}\n"
            f"🔗 Listeners: {sum(s['listeners_count'].values())}\n"
            f"📋 Historial: {s['history_size']} eventos\n\n"
            f"🔝 Top eventos:\n{events_text}"
        )


# ---------------------------------------------------------------------------
# Eventos predefinidos del ecosistema
# ---------------------------------------------------------------------------
class Events:
    """Constantes de tipos de evento del ecosistema."""
    # Dispatch
    DISPATCH_OK = "dispatch_ok"
    DISPATCH_FAIL = "dispatch_fail"
    FALLBACK_USED = "fallback_used"

    # Usuarios
    USER_NEW = "user_new"
    USER_LEVEL_UP = "user_level_up"
    USER_ACTIVE = "user_active"

    # Contenido
    CONTENT_CREATED = "content_created"
    IMAGE_GENERATED = "image_generated"
    MUSIC_GENERATED = "music_generated"
    VIDEO_GENERATED = "video_generated"

    # Sistema
    SYSTEM_ERROR = "system_error"
    SYSTEM_HEALTH = "system_health"
    API_QUOTA_LOW = "api_quota_low"
    CACHE_HIT = "cache_hit"

    # Enjambre
    SWARM_TASK_ASSIGNED = "swarm_task_assigned"
    SWARM_TASK_COMPLETED = "swarm_task_completed"
    SWARM_ALERT = "swarm_alert"

    # Aprendizaje
    LEARNING_NEW = "learning_new"
    FEEDBACK_RECEIVED = "feedback_received"
    MODEL_RETRAINED = "model_retrained"
