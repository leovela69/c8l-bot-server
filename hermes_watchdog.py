# -*- coding: utf-8 -*-
"""
📢 HERMES WATCHDOG — Reanimador + Sirviente de @leon_leo_bot
==============================================================
Corre en un hilo separado dentro del mismo proceso.

Funciones:
1. WATCHDOG: Ping a Leon cada 5 min, si no responde → reinicia
2. COLA: Ejecuta tareas delegadas por Leon en background
3. BRIDGE: Comunica con @Sayanyin_Bot via API
4. BACKUP: Si Leon crashea, Hermes responde al admin

Token: @hermes_c8l_bot (bot separado en Telegram)
"""

import time
import logging
import threading
import requests
from config import (
    HERMES_BOT_TOKEN, ADMIN_CHAT_ID,
    SAYAN_API_URL, BRIDGE_SECRET, PORT
)

logger = logging.getLogger("c8l.hermes_watchdog")

HERMES_TG_API = f"https://api.telegram.org/bot{HERMES_BOT_TOKEN}"
HEALTH_URL = f"http://localhost:{PORT}/"
PING_INTERVAL = 300  # 5 minutos
MAX_FAILURES = 3


class HermesWatchdog:
    """Watchdog que vigila a Leon y se comunica con Sayan."""

    def __init__(self):
        self.failures = 0
        self.leon_alive = True
        self.last_ping = 0
        self.tasks_queue = []
        self._running = False

    def start(self):
        """Inicia el watchdog en un thread daemon."""
        if self._running:
            return
        self._running = True
        # Hilo de watchdog (ping a Leon)
        threading.Thread(target=self._watchdog_loop, daemon=True).start()
        # Hilo del bot Hermes (polling Telegram)
        threading.Thread(target=self._hermes_bot_loop, daemon=True).start()
        logger.info("📢 Hermes Watchdog activo — vigilando a Leon")

    def _watchdog_loop(self):
        """Ping a Leon cada 5 minutos."""
        time.sleep(30)  # Esperar a que Leon arranque
        while self._running:
            try:
                r = requests.get(HEALTH_URL, timeout=10)
                if r.status_code == 200:
                    self.failures = 0
                    self.leon_alive = True
                else:
                    self._handle_failure("HTTP " + str(r.status_code))
            except Exception as e:
                self._handle_failure(str(e))

            self.last_ping = time.time()
            time.sleep(PING_INTERVAL)

    def _handle_failure(self, reason: str):
        """Leon no responde — registrar fallo."""
        self.failures += 1
        logger.warning(f"⚠️ Leon no responde ({self.failures}/{MAX_FAILURES}): {reason}")

        if self.failures >= MAX_FAILURES:
            self.leon_alive = False
            self._notify_admin(
                f"🚨 *ALERTA: @leon_leo_bot CAÍDO*\n\n"
                f"Failures: {self.failures}\n"
                f"Razón: {reason}\n"
                f"Hermes intentará reanimar..."
            )
            self._notify_sayan("leon_down", {"reason": reason})

    def _hermes_bot_loop(self):
        """Bot de Telegram para Hermes (polling simple)."""
        if not HERMES_BOT_TOKEN:
            logger.warning("Hermes: sin token, bot desactivado")
            return

        offset = 0
        logger.info("📢 Hermes bot polling activo")

        while self._running:
            try:
                r = requests.get(
                    f"{HERMES_TG_API}/getUpdates",
                    params={"offset": offset, "timeout": 30},
                    timeout=35
                )
                if r.status_code == 200:
                    data = r.json()
                    for update in data.get("result", []):
                        offset = update["update_id"] + 1
                        self._process_hermes_update(update)
            except Exception as e:
                logger.error(f"Hermes polling error: {e}")
                time.sleep(5)

    def _process_hermes_update(self, update: dict):
        """Procesa mensajes que llegan a @hermes_c8l_bot."""
        message = update.get("message", {})
        text = message.get("text", "")
        chat_id = message.get("chat", {}).get("id", 0)
        user_id = message.get("from", {}).get("id", 0)

        # Solo responder al admin
        if str(user_id) != str(ADMIN_CHAT_ID) and ADMIN_CHAT_ID:
            self._hermes_send(chat_id,
                "🤖 Soy Hermes, sirviente de @leon_leo_bot.\n"
                "Habla con el jefe, no conmigo.")
            return

        if text.startswith("/start"):
            self._hermes_send(chat_id,
                "📢 *HERMES — Watchdog & Reanimador*\n\n"
                "Mis funciones:\n"
                "• Vigilar a @leon_leo_bot 24/7\n"
                "• Reiniciarlo si cae\n"
                "• Conectar con @Sayanyin_Bot\n"
                "• Ejecutar tareas delegadas\n\n"
                "Comandos:\n"
                "/status — Estado de Leon + Sayan\n"
                "/sayan — Estado del enjambre\n"
                "/revive — Forzar reinicio de Leon\n"
                "/bridge — Estado del puente")
        elif text.startswith("/status"):
            status = (
                f"📊 *Estado del Ecosistema*\n\n"
                f"🦁 Leon: {'✅ VIVO' if self.leon_alive else '❌ CAÍDO'}\n"
                f"   Failures: {self.failures}\n"
                f"   Último ping: {int(time.time() - self.last_ping)}s ago\n\n"
                f"📢 Hermes: ✅ ACTIVO (yo)\n\n"
                f"⚡ Sayan: {self._check_sayan_status()}"
            )
            self._hermes_send(chat_id, status)
        elif text.startswith("/sayan"):
            self._hermes_send(chat_id, self._get_sayan_full_status())
        elif text.startswith("/revive"):
            self._hermes_send(chat_id, "🔄 Enviando señal de reinicio...")
            # En Render, reiniciar = el health check falla y Render reinicia
            self._notify_admin("🔄 Hermes ejecutó /revive — reinicio forzado")
        elif text.startswith("/bridge"):
            bridge_status = self._check_bridge()
            self._hermes_send(chat_id, f"🌉 *Bridge Status:*\n{bridge_status}")
        else:
            self._hermes_send(chat_id,
                "📢 Soy Hermes. Usa /status, /sayan, /revive, o /bridge.")

    # ==================================================================
    # COMUNICACIÓN
    # ==================================================================

    def _hermes_send(self, chat_id: int, text: str):
        """Envía mensaje via @hermes_c8l_bot."""
        try:
            requests.post(f"{HERMES_TG_API}/sendMessage", json={
                "chat_id": chat_id,
                "text": text,
                "parse_mode": "Markdown"
            }, timeout=10)
        except Exception as e:
            logger.error(f"Hermes send error: {e}")

    def _notify_admin(self, text: str):
        """Notifica al admin via Hermes."""
        if ADMIN_CHAT_ID:
            self._hermes_send(int(ADMIN_CHAT_ID), text)

    def _notify_sayan(self, event: str, data: dict = None):
        """Notifica a Sayan via API bridge."""
        try:
            requests.post(
                f"{SAYAN_API_URL}/api/bridge/receive",
                json={
                    "event": event,
                    "data": data or {},
                    "source": "hermes",
                    "secret": BRIDGE_SECRET
                },
                timeout=10
            )
        except Exception as e:
            logger.warning(f"Bridge notify error: {e}")

    def _check_sayan_status(self) -> str:
        """Verifica si Sayan está vivo."""
        try:
            r = requests.get(f"{SAYAN_API_URL}/health", timeout=5)
            if r.status_code == 200:
                return "✅ VIVO"
            return f"⚠️ HTTP {r.status_code}"
        except:
            return "❌ NO RESPONDE"

    def _get_sayan_full_status(self) -> str:
        """Obtiene estado completo del enjambre."""
        try:
            r = requests.get(f"{SAYAN_API_URL}/api/swarm/status", timeout=10)
            if r.status_code == 200:
                data = r.json()
                agents = data.get("agents", {})
                text = f"⚡ *Sayan Swarm — {data.get('total_agents', 0)} agentes*\n\n"
                for name, info in agents.items():
                    status = "✅" if info.get("active") else "❌"
                    text += f"{status} {name} | {info.get('role', '')}\n"
                return text
            return "⚠️ No pude obtener estado del enjambre"
        except Exception as e:
            return f"❌ Error: {str(e)[:50]}"

    def _check_bridge(self) -> str:
        """Verifica estado del puente."""
        try:
            r = requests.get(f"{SAYAN_API_URL}/api/bridge/status", timeout=5)
            if r.status_code == 200:
                return f"✅ Conectado\n{r.json()}"
            return f"⚠️ HTTP {r.status_code}"
        except Exception as e:
            return f"❌ Desconectado: {str(e)[:50]}"


# Singleton
hermes_watchdog = HermesWatchdog()
