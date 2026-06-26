# -*- coding: utf-8 -*-
"""
🔄 SUNO AUTO-HEALER v1.0 — Sistema de Auto-Reparación de Token/Cookie
Monitorea la salud del token de Suno y lo repara automáticamente.

Niveles de recuperación:
  1. JWT expirado → Refresh via Clerk (automático, cada 50 min)
  2. Clerk session expirado → Reintenta con backoff exponencial
  3. Cookie completa expirada → Notifica a Leo con instrucciones claras
  4. API caída/timeout → Retry inteligente con aprendizaje

Se ejecuta como daemon thread dentro del bot principal.
También integra con ErrorLearner para registrar y aprender de fallos.

Uso:
    from suno_auto_healer import SunoAutoHealer, get_healer
    healer = get_healer()
    healer.start()  # Arranca monitoreo en background
    
    # Verificar salud antes de generar:
    health = healer.check_health()
    if health["status"] == "healthy":
        # Generar normalmente
    elif health["status"] == "degraded":
        # Token puede fallar pronto
    elif health["status"] == "dead":
        # Leo necesita renovar cookie manualmente
"""

import time
import threading
import logging
import json
import os
import base64
from typing import Dict, Optional, Any
from datetime import datetime, timedelta

logger = logging.getLogger("c8l.suno_healer")

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")
HEALER_STATE_FILE = os.path.join(DATA_DIR, "suno_healer_state.json")

os.makedirs(DATA_DIR, exist_ok=True)


class HealthStatus:
    HEALTHY = "healthy"         # Todo funciona, token fresco
    DEGRADED = "degraded"       # Token pronto a expirar o refresh inestable
    RECOVERING = "recovering"   # Intentando reparar
    DEAD = "dead"               # Cookie expirada, necesita intervención manual


class SunoAutoHealer:
    """
    Monitorea y repara automáticamente la conexión con Suno.
    Corre como daemon thread verificando salud cada 5 minutos.
    """

    def __init__(self):
        self._running = False
        self._thread: Optional[threading.Thread] = None
        self._lock = threading.Lock()
        self._state = self._load_state()
        self._client = None
        self._notified_admin = False

        # Configuración
        self.CHECK_INTERVAL = 300       # Verificar cada 5 minutos
        self.PROACTIVE_REFRESH = 2700   # Refrescar proactivamente a los 45 min (token dura 60)
        self.MAX_REFRESH_FAILURES = 5   # Tras 5 fallos de refresh, marcar como dead
        self.RECOVERY_BACKOFF = [30, 60, 120, 300, 600]  # Backoff para recovery

    @property
    def client(self):
        """SunoClient lazy-loaded."""
        if self._client is None:
            try:
                from suno_client import SunoClient
                self._client = SunoClient()
            except Exception as e:
                logger.error(f"❌ No se pudo crear SunoClient: {e}")
        return self._client

    # ===== STATE MANAGEMENT =====

    def _load_state(self) -> dict:
        """Carga estado persistido."""
        if os.path.exists(HEALER_STATE_FILE):
            try:
                with open(HEALER_STATE_FILE, 'r') as f:
                    return json.load(f)
            except Exception:
                pass
        return {
            "status": HealthStatus.HEALTHY,
            "last_check": 0,
            "last_successful_refresh": 0,
            "last_successful_generation": 0,
            "consecutive_refresh_failures": 0,
            "consecutive_api_failures": 0,
            "total_refreshes": 0,
            "total_failures": 0,
            "last_notification_sent": "",
            "token_expiry_estimate": 0,
        }

    def _save_state(self):
        """Persiste estado."""
        try:
            with open(HEALER_STATE_FILE, 'w') as f:
                json.dump(self._state, f, indent=2)
        except Exception as e:
            logger.warning(f"Error guardando healer state: {e}")

    # ===== HEALTH CHECK =====

    def check_health(self) -> Dict[str, Any]:
        """
        Verifica la salud actual de la conexión con Suno.
        
        Returns:
            {
                "status": "healthy|degraded|recovering|dead",
                "details": "...",
                "token_age_minutes": N,
                "can_generate": True/False,
                "recommendation": "..."
            }
        """
        with self._lock:
            result = {
                "status": HealthStatus.HEALTHY,
                "details": "",
                "token_age_minutes": 0,
                "can_generate": True,
                "recommendation": "",
            }

            # 1. Verificar si el client existe
            if not self.client:
                result["status"] = HealthStatus.DEAD
                result["details"] = "No se pudo inicializar SunoClient"
                result["can_generate"] = False
                result["recommendation"] = "Verificar config.py y SUNO_COOKIE"
                return result

            # 2. Verificar edad del token
            token_age = self._get_token_age_minutes()
            result["token_age_minutes"] = token_age

            if token_age > 55:
                # Token casi expirado (dura 60 min)
                result["status"] = HealthStatus.DEGRADED
                result["details"] = f"Token tiene {token_age:.0f} min (expira a los 60)"
                result["recommendation"] = "Refresh inmediato recomendado"
            elif token_age > 45:
                result["status"] = HealthStatus.DEGRADED
                result["details"] = f"Token tiene {token_age:.0f} min (refresh pronto)"

            # 3. Verificar fallos consecutivos
            if self._state["consecutive_refresh_failures"] >= self.MAX_REFRESH_FAILURES:
                result["status"] = HealthStatus.DEAD
                result["details"] = f"Refresh falló {self._state['consecutive_refresh_failures']} veces seguidas"
                result["can_generate"] = False
                result["recommendation"] = "Leo necesita renovar cookie en suno.com"

            elif self._state["consecutive_refresh_failures"] >= 2:
                result["status"] = HealthStatus.DEGRADED
                result["details"] = f"Refresh inestable ({self._state['consecutive_refresh_failures']} fallos)"
                result["recommendation"] = "Monitorear de cerca"

            # 4. Verificar API failures
            if self._state["consecutive_api_failures"] >= 3:
                result["status"] = HealthStatus.RECOVERING
                result["details"] = f"API con {self._state['consecutive_api_failures']} fallos consecutivos"
                result["can_generate"] = False

            self._state["last_check"] = time.time()
            self._state["status"] = result["status"]
            self._save_state()

            return result

    def _get_token_age_minutes(self) -> float:
        """Estima la edad del token JWT actual."""
        if not self.client or not self.client.bearer_token:
            return 999  # Sin token = muy viejo

        try:
            # Decodificar JWT para obtener 'iat' (issued at)
            parts = self.client.bearer_token.split('.')
            if len(parts) < 2:
                return 999

            payload = parts[1]
            # Agregar padding
            payload += '=' * (4 - len(payload) % 4)
            data = json.loads(base64.urlsafe_b64decode(payload))

            iat = data.get("iat", 0)
            exp = data.get("exp", 0)

            if iat:
                age_seconds = time.time() - iat
                return age_seconds / 60
            elif exp:
                # Si no hay iat, estimar desde exp (token dura 60 min)
                remaining = exp - time.time()
                return 60 - (remaining / 60)

        except Exception:
            pass

        # Fallback: usar último refresh exitoso
        last_refresh = self._state.get("last_successful_refresh", 0)
        if last_refresh:
            return (time.time() - last_refresh) / 60

        return 999

    # ===== PROACTIVE REFRESH =====

    def proactive_refresh(self) -> bool:
        """
        Refresca el token proactivamente ANTES de que expire.
        Llamado por el monitor cada 5 min si el token tiene > 45 min.
        """
        if not self.client:
            return False

        logger.info("🔄 Healer: Refresh proactivo...")

        try:
            success = self.client._try_refresh_token()

            if success:
                self._state["last_successful_refresh"] = time.time()
                self._state["consecutive_refresh_failures"] = 0
                self._state["total_refreshes"] += 1
                self._state["status"] = HealthStatus.HEALTHY
                self._notified_admin = False
                self._save_state()
                logger.info("🔄 ✅ Refresh proactivo exitoso!")
                return True
            else:
                self._state["consecutive_refresh_failures"] += 1
                self._state["total_failures"] += 1
                self._save_state()
                logger.warning(f"🔄 ⚠️ Refresh falló ({self._state['consecutive_refresh_failures']} consecutivos)")
                return False

        except Exception as e:
            self._state["consecutive_refresh_failures"] += 1
            self._state["total_failures"] += 1
            self._save_state()
            logger.error(f"🔄 ❌ Error en refresh proactivo: {e}")
            return False

    # ===== RECOVERY =====

    def attempt_recovery(self) -> bool:
        """
        Intenta recuperar la conexión con backoff.
        Se usa cuando hay múltiples fallos de refresh.
        """
        logger.info("🔧 Healer: Intentando recovery...")
        self._state["status"] = HealthStatus.RECOVERING
        self._save_state()

        failures = self._state["consecutive_refresh_failures"]
        backoff_idx = min(failures - 1, len(self.RECOVERY_BACKOFF) - 1)
        wait_time = self.RECOVERY_BACKOFF[backoff_idx]

        logger.info(f"🔧 Esperando {wait_time}s antes de reintentar (fallo #{failures})")
        time.sleep(wait_time)

        # Reintentar refresh
        success = self.proactive_refresh()

        if success:
            logger.info("🔧 ✅ Recovery exitoso!")
            self._state["status"] = HealthStatus.HEALTHY
            self._save_state()

            # Registrar en error_learner
            try:
                from error_learner import get_error_learner
                learner = get_error_learner()
                learner.learn_new_solution(
                    error_pattern=f"refresh_failed_{failures}_times",
                    category="auth",
                    solution_type="retry_with_delay",
                    solution_params={"wait_seconds": wait_time, "max_retries": 1},
                    description=f"Recovery tras {failures} fallos esperando {wait_time}s",
                    learned_from="HEALER",
                )
            except Exception:
                pass

            return True
        else:
            # Si superamos max failures, marcar como dead y notificar
            if self._state["consecutive_refresh_failures"] >= self.MAX_REFRESH_FAILURES:
                self._state["status"] = HealthStatus.DEAD
                self._save_state()
                self._notify_admin_if_needed()
                return False

            return False

    # ===== ADMIN NOTIFICATION =====

    def _notify_admin_if_needed(self):
        """Notifica a Leo que la cookie necesita renovación manual."""
        if self._notified_admin:
            return  # Ya se notificó, no spammear

        try:
            from config import TELEGRAM_BOT_TOKEN, ADMIN_CHAT_ID

            message = (
                "🚨 *SUNO AUTO-HEALER: Cookie Expirada*\n\n"
                "No se pudo renovar el token de Suno después de "
                f"{self._state['consecutive_refresh_failures']} intentos.\n\n"
                "🔧 *Para reparar:*\n"
                "1. Ve a https://suno.com e inicia sesión\n"
                "2. Abre DevTools (F12) → Console\n"
                "3. Ejecuta: `document.cookie`\n"
                "4. Copia TODO el resultado\n"
                "5. Actualiza `config.py` con la nueva cookie\n"
                "6. Reinicia el bot: `pkill -f whatsapp_bot.py && bash start.sh`\n\n"
                "⚠️ Mientras tanto, la generación de música está *desactivada*.\n"
                "La web seguirá funcionando si renuevas antes de que expire."
            )

            import requests
            url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
            requests.post(url, json={
                "chat_id": ADMIN_CHAT_ID,
                "text": message,
                "parse_mode": "Markdown",
            }, timeout=10)

            self._notified_admin = True
            self._state["last_notification_sent"] = datetime.now().isoformat()
            self._save_state()
            logger.warning("📢 Notificación enviada a Leo sobre cookie expirada")

        except Exception as e:
            logger.error(f"❌ No se pudo notificar a Leo: {e}")

    # ===== RECORD: API success/failure =====

    def record_api_success(self):
        """Registra una llamada API exitosa (llamado por el bridge tras generar)."""
        self._state["consecutive_api_failures"] = 0
        self._state["last_successful_generation"] = time.time()
        if self._state["status"] == HealthStatus.RECOVERING:
            self._state["status"] = HealthStatus.HEALTHY
        self._save_state()

    def record_api_failure(self, error: str = ""):
        """Registra un fallo de API."""
        self._state["consecutive_api_failures"] += 1

        # Si es error de auth, intentar refresh inmediato
        if "401" in error or "TOKEN_EXPIRED" in error or "Unauthorized" in error:
            logger.info("🔄 Healer: Error de auth detectado, intentando refresh inmediato...")
            self.proactive_refresh()

        self._save_state()

    # ===== MONITOR DAEMON =====

    def start(self):
        """Arranca el monitor daemon en background."""
        if self._running:
            logger.info("🔄 Healer ya está corriendo")
            return

        self._running = True
        self._thread = threading.Thread(target=self._monitor_loop, daemon=True, name="suno-healer")
        self._thread.start()
        logger.info("🔄 Suno Auto-Healer iniciado (check cada 5 min)")

    def stop(self):
        """Detiene el monitor."""
        self._running = False
        logger.info("🔄 Suno Auto-Healer detenido")

    def _monitor_loop(self):
        """Loop principal del monitor."""
        # Esperar 30s al inicio para que el bot se estabilice
        time.sleep(30)

        while self._running:
            try:
                health = self.check_health()
                status = health["status"]

                if status == HealthStatus.HEALTHY:
                    # Verificar si necesita refresh proactivo
                    token_age = health["token_age_minutes"]
                    if token_age >= 45:
                        self.proactive_refresh()

                elif status == HealthStatus.DEGRADED:
                    # Intentar refresh inmediato
                    self.proactive_refresh()

                elif status == HealthStatus.RECOVERING:
                    # Intentar recovery con backoff
                    self.attempt_recovery()

                elif status == HealthStatus.DEAD:
                    # Notificar admin (una vez) y esperar
                    self._notify_admin_if_needed()
                    # Intentar recovery cada 10 min por si Leo renovó
                    time.sleep(600)
                    self.proactive_refresh()

            except Exception as e:
                logger.error(f"🔄 Error en monitor loop: {e}")

            # Esperar para siguiente check
            time.sleep(self.CHECK_INTERVAL)

    # ===== STATUS =====

    def get_status(self) -> dict:
        """Estado completo del healer."""
        health = self.check_health()
        return {
            "healer_version": "1.0",
            "health": health,
            "state": {
                "total_refreshes": self._state["total_refreshes"],
                "total_failures": self._state["total_failures"],
                "consecutive_refresh_failures": self._state["consecutive_refresh_failures"],
                "consecutive_api_failures": self._state["consecutive_api_failures"],
                "last_successful_refresh": self._state["last_successful_refresh"],
                "last_successful_generation": self._state["last_successful_generation"],
                "last_notification_sent": self._state["last_notification_sent"],
            },
            "running": self._running,
            "timestamp": datetime.now().isoformat(),
        }


# ===== Singleton =====
_healer_instance: Optional[SunoAutoHealer] = None


def get_healer() -> SunoAutoHealer:
    """Obtiene la instancia global del healer."""
    global _healer_instance
    if _healer_instance is None:
        _healer_instance = SunoAutoHealer()
    return _healer_instance


def start_healer():
    """Inicia el healer (llamar desde el bot al arrancar)."""
    healer = get_healer()
    healer.start()
    return healer
