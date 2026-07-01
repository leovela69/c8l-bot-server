# -*- coding: utf-8 -*-
"""
⚡ HEALTH MONITOR — Monitoreo continuo del bot
================================================
Sistema de vigilancia que:
- Hace ping al health endpoint cada N minutos
- Detecta caídas y lentitud
- Triggerea auto-restart si el bot no responde
- Envía alertas al admin via Telegram
- Mantiene historial de uptime

Corre como tarea en background dentro del bot principal.
Si el bot cae completamente, Hermes (bot secundario) lo reanima.

Autor: C8L Agency / Leo
"""

import os
import time
import logging
import asyncio
from typing import Optional, Dict, List, Any
from dataclasses import dataclass, field

logger = logging.getLogger("c8l.watchdog.health")


@dataclass
class HealthCheck:
    """Resultado de un health check."""
    timestamp: float
    status: str  # "ok", "slow", "down", "error"
    response_time_ms: float = 0.0
    error: str = ""
    details: Dict = field(default_factory=dict)


class HealthMonitor:
    """
    ⚡ Monitor de salud del bot.

    Funcionalidades:
    - Ping interno (verifica que los sistemas respondan)
    - Ping externo (verifica el health endpoint HTTP)
    - Alertas automáticas al admin
    - Auto-restart via Render API
    - Historial de uptime
    """

    def __init__(self):
        self.health_url = os.environ.get(
            "BOT_HEALTH_URL", "https://c8l-bot-server-1.onrender.com/health"
        )
        self.admin_chat_id = os.environ.get("ADMIN_CHAT_ID", "")
        self.check_interval = int(os.environ.get("HEALTH_CHECK_INTERVAL", "300"))  # 5 min
        self.max_failures = int(os.environ.get("HEALTH_MAX_FAILURES", "3"))

        self._history: List[HealthCheck] = []
        self._consecutive_failures = 0
        self._total_checks = 0
        self._total_failures = 0
        self._total_restarts = 0
        self._start_time = time.time()
        self._running = False
        self._last_alert_time = 0.0

    async def check_health_external(self) -> HealthCheck:
        """Verifica el endpoint de salud HTTP del bot."""
        import httpx

        start = time.time()
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                resp = await client.get(self.health_url)
                response_time = (time.time() - start) * 1000

                if resp.status_code == 200:
                    data = resp.json()
                    status = "ok" if response_time < 5000 else "slow"
                    return HealthCheck(
                        timestamp=time.time(),
                        status=status,
                        response_time_ms=response_time,
                        details=data,
                    )
                else:
                    return HealthCheck(
                        timestamp=time.time(),
                        status="error",
                        response_time_ms=response_time,
                        error=f"HTTP {resp.status_code}",
                    )
        except httpx.TimeoutException:
            return HealthCheck(
                timestamp=time.time(),
                status="down",
                response_time_ms=(time.time() - start) * 1000,
                error="Timeout (>10s)",
            )
        except Exception as e:
            return HealthCheck(
                timestamp=time.time(),
                status="down",
                response_time_ms=(time.time() - start) * 1000,
                error=str(e),
            )

    def check_health_internal(self) -> HealthCheck:
        """Verifica los sistemas internos del bot."""
        checks = {}
        overall_ok = True

        # 1. API Router
        try:
            from api_router import get_router
            router = get_router()
            active = len(router._providers)
            checks["api_router"] = f"{active} providers"
            if active == 0:
                overall_ok = False
        except Exception as e:
            checks["api_router"] = f"ERROR: {e}"
            overall_ok = False

        # 2. Intent Engine
        try:
            from nlp.intent_engine import IntentEngine
            engine = IntentEngine()
            checks["intent_engine"] = "OK"
        except Exception as e:
            checks["intent_engine"] = f"ERROR: {e}"
            overall_ok = False

        # 3. Memoria
        try:
            from memory.vector_store import VectorStore
            vs = VectorStore()
            checks["memory"] = f"{vs.size()} entries"
        except Exception as e:
            checks["memory"] = f"ERROR: {e}"

        return HealthCheck(
            timestamp=time.time(),
            status="ok" if overall_ok else "error",
            details=checks,
        )

    async def trigger_restart(self) -> bool:
        """Triggerea un restart via Render API."""
        try:
            from integrations.deploy_control import get_deploy_control
            dc = get_deploy_control()
            result = dc.restart_service()
            if result.success:
                self._total_restarts += 1
                logger.warning("🔄 Auto-restart triggerado!")
                return True
            return False
        except Exception as e:
            logger.error(f"Error en auto-restart: {e}")
            return False

    async def send_alert(self, message: str, bot=None):
        """Envía alerta al admin."""
        now = time.time()
        # No spamear: máximo 1 alerta cada 5 minutos
        if now - self._last_alert_time < 300:
            return

        self._last_alert_time = now

        if bot and self.admin_chat_id:
            try:
                await bot.send_message(
                    chat_id=self.admin_chat_id,
                    text=message,
                    parse_mode="Markdown",
                )
            except Exception as e:
                logger.error(f"Error enviando alerta: {e}")

    async def run_check_cycle(self, bot=None):
        """Ejecuta un ciclo de verificación."""
        self._total_checks += 1

        # Check externo
        result = await self.check_health_external()
        self._history.append(result)

        # Mantener solo últimas 100 entradas
        if len(self._history) > 100:
            self._history = self._history[-100:]

        if result.status in ("ok", "slow"):
            self._consecutive_failures = 0
            if result.status == "slow":
                logger.warning(f"⚠️ Bot lento: {result.response_time_ms:.0f}ms")
        else:
            self._consecutive_failures += 1
            self._total_failures += 1
            logger.error(
                f"❌ Health check FAILED ({self._consecutive_failures}/"
                f"{self.max_failures}): {result.error}"
            )

            # Si supera el máximo de fallos → auto-restart
            if self._consecutive_failures >= self.max_failures:
                alert_msg = (
                    f"🚨 *ALERTA: Bot caído*\n\n"
                    f"❌ {self._consecutive_failures} checks consecutivos fallidos\n"
                    f"📡 Error: {result.error}\n"
                    f"🔄 Intentando auto-restart...\n"
                    f"⏱️ {time.strftime('%H:%M:%S')}"
                )
                await self.send_alert(alert_msg, bot)

                restarted = await self.trigger_restart()
                if restarted:
                    await self.send_alert(
                        "🔄 *Auto-restart ejecutado*\n\n"
                        "El bot debería volver en ~30 segundos.",
                        bot,
                    )
                    self._consecutive_failures = 0
                else:
                    await self.send_alert(
                        "❌ *Auto-restart FALLÓ*\n\n"
                        "Intervención manual necesaria.\n"
                        "Usa `/deploy restart` o revisa Render.",
                        bot,
                    )

    async def start_monitoring(self, bot=None):
        """Inicia el loop de monitoreo continuo."""
        self._running = True
        logger.info(f"👁️ Health Monitor iniciado (cada {self.check_interval}s)")

        while self._running:
            try:
                await self.run_check_cycle(bot)
                await asyncio.sleep(self.check_interval)
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error en health monitor: {e}")
                await asyncio.sleep(60)

    def stop(self):
        """Detiene el monitoreo."""
        self._running = False

    # -------------------------------------------------------------------
    # Stats
    # -------------------------------------------------------------------

    def get_uptime_pct(self) -> float:
        """Calcula el porcentaje de uptime."""
        if not self._history:
            return 100.0
        ok_count = sum(1 for h in self._history if h.status in ("ok", "slow"))
        return (ok_count / len(self._history)) * 100

    def get_avg_response_time(self) -> float:
        """Latencia promedio del health endpoint."""
        times = [h.response_time_ms for h in self._history if h.response_time_ms > 0]
        return sum(times) / len(times) if times else 0.0

    def get_stats(self) -> Dict[str, Any]:
        uptime_hours = (time.time() - self._start_time) / 3600
        return {
            "uptime_hours": round(uptime_hours, 1),
            "total_checks": self._total_checks,
            "total_failures": self._total_failures,
            "total_restarts": self._total_restarts,
            "consecutive_failures": self._consecutive_failures,
            "uptime_pct": round(self.get_uptime_pct(), 1),
            "avg_response_ms": round(self.get_avg_response_time(), 0),
            "history_size": len(self._history),
        }

    def get_stats_text(self) -> str:
        s = self.get_stats()
        status_icon = "🟢" if s["consecutive_failures"] == 0 else "🔴"
        return (
            f"👁️ *Health Monitor*\n\n"
            f"{status_icon} Estado: {'ONLINE' if s['consecutive_failures'] == 0 else 'PROBLEMAS'}\n"
            f"⏱️ Monitoreo: {s['uptime_hours']}h\n"
            f"📊 Checks: {s['total_checks']}\n"
            f"✅ Uptime: {s['uptime_pct']}%\n"
            f"⚡ Latencia: {s['avg_response_ms']}ms avg\n"
            f"❌ Fallos: {s['total_failures']}\n"
            f"🔄 Auto-restarts: {s['total_restarts']}\n"
            f"🔴 Fallos consecutivos: {s['consecutive_failures']}/{self.max_failures}"
        )


# ---------------------------------------------------------------------------
# Singleton
# ---------------------------------------------------------------------------
_monitor_instance: Optional[HealthMonitor] = None


def get_health_monitor() -> HealthMonitor:
    """Obtiene la instancia global del Health Monitor."""
    global _monitor_instance
    if _monitor_instance is None:
        _monitor_instance = HealthMonitor()
    return _monitor_instance
