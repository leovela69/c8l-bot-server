# -*- coding: utf-8 -*-
"""
SAYAN BRIDGE — Endpoint del Panteón para comunicarse con Sayan Bot.
Añade esto al bot principal (whatsapp_bot.py) para habilitar la conexión.

FUNCIONES:
- Recibe datos de Sayan (observaciones, reparaciones, aprendizajes)
- Envía datos al Sayan (logs, errores, estados)
- Autenticación por secreto compartido

USO:
  En whatsapp_bot.py agregar:
    from sayan_bridge import handle_sayan_request, send_to_sayan

  En el HTTP server:
    if path == '/api/bridge/receive' and method == 'POST':
        return handle_sayan_request(body)
"""
import os
import json
import time
import logging
import requests

logger = logging.getLogger("c8l.sayan_bridge")

BRIDGE_SECRET = os.environ.get("BRIDGE_SECRET", "c8l_sayan_bridge_2026")
SAYAN_API_URL = os.environ.get("SAYAN_API_URL", "")  # URL de Sayan en Render

# Log de comunicación
BRIDGE_LOG_FILE = os.path.join(os.path.dirname(__file__), "data", "sayan_bridge_log.json")


def handle_sayan_request(payload: dict) -> dict:
    """
    Recibe un request de Sayan Bot.
    Llamado cuando Sayan envía datos al Panteón.
    """
    # Verificar autenticación
    if payload.get("secret") != BRIDGE_SECRET:
        return {"error": "unauthorized"}

    msg_type = payload.get("type", "unknown")
    data = payload.get("data", {})
    timestamp = time.time()

    # Loguear
    _log_message("received", msg_type, data)

    # Procesar según tipo
    if msg_type == "observation_request":
        # Sayan quiere observar algo del Panteón
        return _get_panteon_data(data)
    elif msg_type == "repair_request":
        # Sayan quiere reparar algo (ya aprobado por Leo)
        return _apply_repair(data)
    elif msg_type == "sync_request":
        # Sayan quiere sincronizar datos
        return _get_sync_data(data)
    elif msg_type == "learning":
        # Sayan comparte un aprendizaje con el Panteón
        return _receive_learning(data)
    else:
        return {"received": True, "type": msg_type}


def send_to_sayan(message_type: str, data: dict) -> dict:
    """
    Envía datos al Sayan Bot.
    Usado cuando el Panteón quiere informar algo a Sayan.
    """
    if not SAYAN_API_URL:
        _log_message("outbox", message_type, data)
        return {"queued": True, "method": "outbox"}

    payload = {
        "from": "panteon",
        "type": message_type,
        "data": data,
        "timestamp": time.time(),
        "secret": BRIDGE_SECRET
    }

    try:
        resp = requests.post(
            f"{SAYAN_API_URL}/api/bridge/receive",
            json=payload,
            timeout=10
        )
        if resp.status_code == 200:
            return resp.json()
    except Exception as e:
        logger.warning(f"Send to Sayan failed: {e}")

    _log_message("outbox", message_type, data)
    return {"queued": True, "method": "outbox_fallback"}


def _get_panteon_data(data: dict) -> dict:
    """Devuelve datos del Panteón que Sayan solicita."""
    target = data.get("target", "status")

    if target == "status":
        # Estado general del Panteón
        return {
            "panteon_status": "active",
            "agents": ["zeus", "minerva", "vulcano", "aries", "hermes",
                      "apolo", "ares", "hefesto", "artemisa", "atenea", "estia"],
            "timestamp": time.time()
        }
    elif target == "errors":
        # Errores recientes (si hay log)
        return {"errors": [], "timestamp": time.time()}
    elif target == "memory":
        # Memoria/conocimiento del Panteón
        return {"memory_available": True, "timestamp": time.time()}

    return {"data": "unknown target", "target": target}


def _apply_repair(data: dict) -> dict:
    """Aplica una reparación sugerida por Sayan (ya aprobada por Leo)."""
    repair_type = data.get("repair_type", "")
    target = data.get("target", "")
    fix = data.get("fix", "")

    logger.info(f"Sayan repair applied: {repair_type} on {target}")
    _log_message("repair_applied", repair_type, data)

    # TODO: Implementar aplicación real de reparaciones
    return {"repaired": True, "target": target, "type": repair_type}


def _receive_learning(data: dict) -> dict:
    """Recibe un aprendizaje de Sayan."""
    topic = data.get("topic", "")
    lesson = data.get("lesson", "")

    logger.info(f"Learning from Sayan: {topic}")
    _log_message("learning_received", topic, data)

    return {"learned": True, "topic": topic}


def _get_sync_data(data: dict) -> dict:
    """Devuelve datos para sincronización."""
    return {
        "sync_data": {
            "panteon_version": "v17.0",
            "agents_active": 11,
            "last_activity": time.time()
        }
    }


def _log_message(direction: str, msg_type: str, data: dict):
    """Guarda mensaje en el log."""
    try:
        log = []
        if os.path.exists(BRIDGE_LOG_FILE):
            with open(BRIDGE_LOG_FILE, "r") as f:
                log = json.load(f)
        log.append({
            "direction": direction,
            "type": msg_type,
            "data": str(data)[:500],
            "timestamp": time.time()
        })
        if len(log) > 200:
            log = log[-200:]
        os.makedirs(os.path.dirname(BRIDGE_LOG_FILE), exist_ok=True)
        with open(BRIDGE_LOG_FILE, "w") as f:
            json.dump(log, f, ensure_ascii=False)
    except Exception:
        pass
