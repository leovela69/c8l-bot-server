# -*- coding: utf-8 -*-
"""
📡 EVENT EMITTER — Publicador de Eventos al Enjambre ANTIGRAVITY
=================================================================
Registra eventos del ecosistema para que AION, Cerebros y otros bots
puedan reaccionar. Cada acción importante se publica como evento.
Soporte para Redis (Upstash) o archivo JSON local.
"""

import os
import json
import logging
from typing import Dict, List, Optional
from datetime import datetime

logger = logging.getLogger("c8l.event_emitter")

# Intentar Redis (Upstash)
REDIS_URL = os.environ.get("UPSTASH_REDIS_URL", "")
USE_REDIS = False
redis_client = None

if REDIS_URL:
    try:
        import redis
        redis_client = redis.from_url(REDIS_URL)
        USE_REDIS = True
        logger.info("EventEmitter: Usando Redis (Upstash)")
    except ImportError:
        pass

# Local fallback
LOCAL_EVENTS_FILE = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "data", "ecosystem_events.json"
)



class EventEmitter:
    """
    Publica eventos al enjambre C8L.
    Los eventos permiten coordinación asíncrona entre bots.
    """

    # Tipos de eventos
    EVENT_TYPES = [
        "user_action",      # Usuario hizo algo (jugar, crear, comprar)
        "economy_tx",       # Transacción económica
        "error_detected",   # Error en algún módulo
        "bot_health",       # Estado de salud de un bot
        "achievement",      # Usuario desbloqueó logro
        "system_alert",     # Alerta del sistema
        "feedback",         # Feedback del usuario
        "proactive_trigger", # Disparo de acción proactiva
    ]

    def __init__(self):
        self._local_events: List[Dict] = []
        self._max_local = 1000

    async def emit(self, event_type: str, data: Dict,
                    source: str = "leon", user_id: str = "") -> str:
        """
        Publica un evento al enjambre.
        
        Args:
            event_type: Tipo de evento (ver EVENT_TYPES)
            data: Datos del evento
            source: Bot que emite el evento
            user_id: Usuario relacionado (si aplica)
        """
        event = {
            "id": f"evt_{datetime.now().strftime('%Y%m%d%H%M%S%f')}",
            "type": event_type,
            "source": source,
            "user_id": user_id,
            "data": data,
            "timestamp": datetime.now().isoformat(),
            "processed": False,
        }

        # Publicar en Redis si disponible
        if USE_REDIS and redis_client:
            try:
                redis_client.xadd(
                    "c8l:events",
                    {"event": json.dumps(event, ensure_ascii=False)},
                    maxlen=5000
                )
            except Exception as e:
                logger.warning(f"Redis emit failed: {e}")
                self._store_local(event)
        else:
            self._store_local(event)

        logger.debug(f"Event emitted: {event_type} from {source}")
        return event["id"]

    async def get_recent_events(self, event_type: str = None,
                                  limit: int = 50) -> List[Dict]:
        """Obtiene eventos recientes (para que otros bots los lean)."""
        if USE_REDIS and redis_client:
            try:
                raw = redis_client.xrevrange("c8l:events", count=limit)
                events = []
                for _, fields in raw:
                    evt = json.loads(fields.get(b"event", b"{}"))
                    if event_type and evt.get("type") != event_type:
                        continue
                    events.append(evt)
                return events
            except:
                pass

        # Local fallback
        events = self._load_local()
        if event_type:
            events = [e for e in events if e.get("type") == event_type]
        return events[-limit:]

    async def get_user_events(self, user_id: str, limit: int = 20) -> List[Dict]:
        """Obtiene eventos de un usuario específico."""
        events = await self.get_recent_events(limit=200)
        user_events = [e for e in events if e.get("user_id") == user_id]
        return user_events[-limit:]

    def _store_local(self, event: Dict):
        """Almacena evento localmente."""
        self._local_events.append(event)
        if len(self._local_events) > self._max_local:
            self._local_events = self._local_events[-self._max_local:]
        # Persistir cada 10 eventos
        if len(self._local_events) % 10 == 0:
            self._save_local()

    def _save_local(self):
        """Guarda eventos en disco."""
        try:
            with open(LOCAL_EVENTS_FILE, "w", encoding="utf-8") as f:
                json.dump(self._local_events[-500:], f, ensure_ascii=False, indent=2)
        except Exception as e:
            logger.error(f"Error guardando eventos: {e}")

    def _load_local(self) -> List[Dict]:
        """Carga eventos de disco."""
        if os.path.exists(LOCAL_EVENTS_FILE):
            try:
                with open(LOCAL_EVENTS_FILE, "r", encoding="utf-8") as f:
                    return json.load(f)
            except:
                pass
        return []
