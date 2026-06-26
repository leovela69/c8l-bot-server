# -*- coding: utf-8 -*-
"""
🧠 ERROR LEARNER v1.0 — Sistema de Aprendizaje Autónomo de Errores
Los bots registran errores, aprenden soluciones, y las aplican sin Leo.

Flujo:
  1. Bot encuentra un error → lo registra con contexto
  2. ErrorLearner busca si ya tiene una solución aprendida
  3. Si la tiene → la aplica automáticamente
  4. Si no → intenta soluciones genéricas (retry, refresh, fallback)
  5. Si funciona → guarda la solución para el futuro
  6. Si todo falla → notifica a Leo con contexto completo

Base de conocimiento se guarda en: data/knowledge/error_solutions.json
"""

import json
import os
import time
import logging
import traceback
from typing import Dict, Optional, Callable, Any, List
from datetime import datetime

logger = logging.getLogger("c8l.error_learner")

# Paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")
KNOWLEDGE_DIR = os.path.join(DATA_DIR, "knowledge")
SOLUTIONS_FILE = os.path.join(KNOWLEDGE_DIR, "error_solutions.json")
ERROR_LOG_FILE = os.path.join(KNOWLEDGE_DIR, "error_history.json")

os.makedirs(KNOWLEDGE_DIR, exist_ok=True)


class ErrorCategory:
    """Categorías de errores para clasificación."""
    AUTH = "auth"               # Token expirado, 401, 403
    RATE_LIMIT = "rate_limit"  # 429, too many requests
    NETWORK = "network"        # Timeout, DNS, connection refused
    API_ERROR = "api_error"    # 500, respuesta inesperada
    CREDITS = "credits"        # Sin créditos, cuota excedida
    INVALID = "invalid"        # Parámetros inválidos, 400
    UNKNOWN = "unknown"        # No clasificado


class ErrorSolution:
    """Representa una solución aprendida."""

    def __init__(self, data: dict):
        self.error_pattern = data.get("error_pattern", "")
        self.category = data.get("category", ErrorCategory.UNKNOWN)
        self.solution_type = data.get("solution_type", "")  # retry, refresh_token, fallback, etc
        self.solution_params = data.get("solution_params", {})
        self.success_count = data.get("success_count", 0)
        self.fail_count = data.get("fail_count", 0)
        self.last_used = data.get("last_used", "")
        self.learned_from = data.get("learned_from", "")  # qué bot lo aprendió
        self.description = data.get("description", "")

    @property
    def confidence(self) -> float:
        """Confianza en la solución (0-1)."""
        total = self.success_count + self.fail_count
        if total == 0:
            return 0.5  # Neutral para soluciones nuevas
        return self.success_count / total

    def to_dict(self) -> dict:
        return {
            "error_pattern": self.error_pattern,
            "category": self.category,
            "solution_type": self.solution_type,
            "solution_params": self.solution_params,
            "success_count": self.success_count,
            "fail_count": self.fail_count,
            "last_used": self.last_used,
            "learned_from": self.learned_from,
            "description": self.description,
        }


class ErrorLearner:
    """
    Sistema central de aprendizaje de errores.
    Los bots consultan aquí antes de rendirse.
    """

    def __init__(self):
        self._solutions = self._load_solutions()
        self._error_history = self._load_history()
        self._notification_queue: List[dict] = []

        # Soluciones base pre-cargadas (conocimiento innato)
        self._ensure_base_knowledge()

    def _load_solutions(self) -> Dict[str, ErrorSolution]:
        """Carga soluciones aprendidas."""
        solutions = {}
        if os.path.exists(SOLUTIONS_FILE):
            try:
                with open(SOLUTIONS_FILE, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                for key, val in data.items():
                    solutions[key] = ErrorSolution(val)
            except Exception as e:
                logger.warning(f"Error cargando solutions: {e}")
        return solutions

    def _load_history(self) -> list:
        """Carga historial de errores."""
        if os.path.exists(ERROR_LOG_FILE):
            try:
                with open(ERROR_LOG_FILE, 'r', encoding='utf-8') as f:
                    return json.load(f)
            except Exception:
                pass
        return []

    def _save_solutions(self):
        """Persiste las soluciones aprendidas."""
        try:
            data = {k: v.to_dict() for k, v in self._solutions.items()}
            with open(SOLUTIONS_FILE, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
        except Exception as e:
            logger.error(f"Error guardando solutions: {e}")

    def _save_history(self):
        """Guarda historial (últimos 500 errores)."""
        try:
            # Mantener solo últimos 500
            history = self._error_history[-500:]
            with open(ERROR_LOG_FILE, 'w', encoding='utf-8') as f:
                json.dump(history, f, ensure_ascii=False, indent=2)
        except Exception as e:
            logger.error(f"Error guardando history: {e}")

    def _ensure_base_knowledge(self):
        """Pre-carga conocimiento base sobre errores comunes."""
        base = {
            "suno_401": ErrorSolution({
                "error_pattern": "401|TOKEN_EXPIRED|Unauthorized",
                "category": ErrorCategory.AUTH,
                "solution_type": "refresh_token",
                "solution_params": {"method": "clerk_refresh", "max_retries": 3},
                "success_count": 10,
                "fail_count": 0,
                "description": "Token JWT expirado → Refrescar via Clerk",
                "learned_from": "base_knowledge",
            }),
            "suno_429": ErrorSolution({
                "error_pattern": "429|Too Many Requests|rate.limit",
                "category": ErrorCategory.RATE_LIMIT,
                "solution_type": "exponential_backoff",
                "solution_params": {"base_wait": 30, "max_wait": 300, "multiplier": 2},
                "success_count": 8,
                "fail_count": 1,
                "description": "Rate limit → Esperar con backoff exponencial",
                "learned_from": "base_knowledge",
            }),
            "suno_no_credits": ErrorSolution({
                "error_pattern": "creditos|credits|insufficient.*credit|no.*credits",
                "category": ErrorCategory.CREDITS,
                "solution_type": "notify_admin",
                "solution_params": {"message": "Sin creditos Suno. Necesita recarga.", "can_retry": False},
                "success_count": 5,
                "fail_count": 0,
                "description": "Sin créditos → Notificar a Leo, no reintentar",
                "learned_from": "base_knowledge",
            }),
            "network_timeout": ErrorSolution({
                "error_pattern": "timeout|Timeout|timed.out|ConnectTimeout",
                "category": ErrorCategory.NETWORK,
                "solution_type": "retry_with_delay",
                "solution_params": {"wait_seconds": 10, "max_retries": 3},
                "success_count": 12,
                "fail_count": 2,
                "description": "Timeout → Reintentar con delay de 10s",
                "learned_from": "base_knowledge",
            }),
            "network_dns": ErrorSolution({
                "error_pattern": "DNS|NameResolution|getaddrinfo|resolve",
                "category": ErrorCategory.NETWORK,
                "solution_type": "retry_with_delay",
                "solution_params": {"wait_seconds": 30, "max_retries": 2},
                "success_count": 3,
                "fail_count": 1,
                "description": "DNS no resuelve → Esperar 30s y reintentar (puede ser problema del VPS)",
                "learned_from": "base_knowledge",
            }),
            "suno_500": ErrorSolution({
                "error_pattern": "500|Internal.Server.Error|server.*error",
                "category": ErrorCategory.API_ERROR,
                "solution_type": "retry_with_delay",
                "solution_params": {"wait_seconds": 15, "max_retries": 2},
                "success_count": 4,
                "fail_count": 1,
                "description": "Error interno de Suno → Reintentar en 15s",
                "learned_from": "base_knowledge",
            }),
            "connection_refused": ErrorSolution({
                "error_pattern": "Connection.refused|ConnectionRefused|ECONNREFUSED",
                "category": ErrorCategory.NETWORK,
                "solution_type": "retry_with_delay",
                "solution_params": {"wait_seconds": 60, "max_retries": 2},
                "success_count": 2,
                "fail_count": 1,
                "description": "Conexión rechazada → Servicio caído, esperar 60s",
                "learned_from": "base_knowledge",
            }),
            "invalid_params": ErrorSolution({
                "error_pattern": "400|Bad.Request|invalid.*param|missing.*field",
                "category": ErrorCategory.INVALID,
                "solution_type": "fix_params",
                "solution_params": {"action": "sanitize_input"},
                "success_count": 6,
                "fail_count": 0,
                "description": "Parámetros inválidos → Sanitizar y reintentar",
                "learned_from": "base_knowledge",
            }),
        }

        for key, solution in base.items():
            if key not in self._solutions:
                self._solutions[key] = solution

        self._save_solutions()

    # ===== CORE: Clasificar Error =====

    def classify_error(self, error: Exception) -> str:
        """Clasifica un error en una categoría."""
        import re
        error_str = str(error).lower()

        patterns = {
            ErrorCategory.AUTH: r"401|403|unauthorized|forbidden|token.*expir|session.*invalid",
            ErrorCategory.RATE_LIMIT: r"429|too.many|rate.limit|quota",
            ErrorCategory.CREDITS: r"credit|credito|insufficient|no.*credit",
            ErrorCategory.NETWORK: r"timeout|dns|connection|network|resolve|refused",
            ErrorCategory.INVALID: r"400|bad.request|invalid|missing.*field|required",
            ErrorCategory.API_ERROR: r"500|502|503|504|internal.*error|server.*error",
        }

        for category, pattern in patterns.items():
            if re.search(pattern, error_str):
                return category

        return ErrorCategory.UNKNOWN

    # ===== CORE: Buscar Solución =====

    def find_solution(self, error: Exception) -> Optional[ErrorSolution]:
        """Busca una solución conocida para un error."""
        import re
        error_str = str(error)

        best_match: Optional[ErrorSolution] = None
        best_confidence = 0

        for key, solution in self._solutions.items():
            try:
                if re.search(solution.error_pattern, error_str, re.IGNORECASE):
                    if solution.confidence > best_confidence:
                        best_match = solution
                        best_confidence = solution.confidence
            except re.error:
                # Patrón regex inválido, comparar directamente
                if solution.error_pattern.lower() in error_str.lower():
                    if solution.confidence > best_confidence:
                        best_match = solution
                        best_confidence = solution.confidence

        return best_match

    # ===== CORE: Aplicar Solución =====

    def apply_solution(
        self,
        solution: ErrorSolution,
        retry_func: Callable,
        context: dict = None,
    ) -> Dict[str, Any]:
        """
        Aplica una solución aprendida.

        Args:
            solution: La solución a aplicar
            retry_func: Función a reintentar si la solución es un retry
            context: Contexto adicional (suno_client, etc.)

        Returns:
            {"success": bool, "result": Any, "action_taken": str}
        """
        context = context or {}
        solution_type = solution.solution_type
        params = solution.solution_params

        logger.info(f"🧠 Aplicando solución: {solution.description} (confianza: {solution.confidence:.0%})")

        try:
            if solution_type == "refresh_token":
                return self._apply_refresh_token(retry_func, context, params)

            elif solution_type == "retry_with_delay":
                return self._apply_retry_with_delay(retry_func, params)

            elif solution_type == "exponential_backoff":
                return self._apply_exponential_backoff(retry_func, params)

            elif solution_type == "notify_admin":
                return self._apply_notify_admin(params)

            elif solution_type == "fix_params":
                return self._apply_fix_params(retry_func, context, params)

            else:
                logger.warning(f"🧠 Tipo de solución desconocido: {solution_type}")
                return {"success": False, "result": None, "action_taken": "unknown_solution_type"}

        except Exception as e:
            logger.error(f"🧠 Error aplicando solución: {e}")
            return {"success": False, "result": None, "action_taken": f"solution_failed: {e}"}

    def _apply_refresh_token(self, retry_func, context, params) -> dict:
        """Refresca token y reintenta."""
        max_retries = params.get("max_retries", 3)
        suno_client = context.get("suno_client")

        if suno_client and hasattr(suno_client, '_try_refresh_token'):
            for attempt in range(max_retries):
                logger.info(f"🔄 Intento refresh token {attempt + 1}/{max_retries}")
                refreshed = suno_client._try_refresh_token()
                if refreshed:
                    try:
                        result = retry_func()
                        return {"success": True, "result": result, "action_taken": "token_refreshed"}
                    except Exception as e:
                        logger.warning(f"🔄 Retry tras refresh falló: {e}")
                        time.sleep(5)
                else:
                    time.sleep(10)

        return {"success": False, "result": None, "action_taken": "refresh_failed"}

    def _apply_retry_with_delay(self, retry_func, params) -> dict:
        """Reintenta con delay fijo."""
        wait = params.get("wait_seconds", 10)
        max_retries = params.get("max_retries", 3)

        for attempt in range(max_retries):
            logger.info(f"⏳ Esperando {wait}s antes de reintentar ({attempt + 1}/{max_retries})")
            time.sleep(wait)
            try:
                result = retry_func()
                return {"success": True, "result": result, "action_taken": f"retry_after_{wait}s"}
            except Exception as e:
                logger.warning(f"⏳ Retry {attempt + 1} falló: {e}")

        return {"success": False, "result": None, "action_taken": "all_retries_exhausted"}

    def _apply_exponential_backoff(self, retry_func, params) -> dict:
        """Reintenta con backoff exponencial."""
        base_wait = params.get("base_wait", 30)
        max_wait = params.get("max_wait", 300)
        multiplier = params.get("multiplier", 2)
        max_retries = params.get("max_retries", 4)

        wait = base_wait
        for attempt in range(max_retries):
            logger.info(f"⏳ Backoff: esperando {wait}s ({attempt + 1}/{max_retries})")
            time.sleep(wait)
            try:
                result = retry_func()
                return {"success": True, "result": result, "action_taken": f"backoff_retry_{attempt + 1}"}
            except Exception as e:
                logger.warning(f"⏳ Backoff retry {attempt + 1} falló: {e}")
                wait = min(wait * multiplier, max_wait)

        return {"success": False, "result": None, "action_taken": "backoff_exhausted"}

    def _apply_notify_admin(self, params) -> dict:
        """Notifica al admin (Leo) — no reintenta."""
        message = params.get("message", "Error sin solución automática")
        can_retry = params.get("can_retry", False)

        notification = {
            "type": "admin_notification",
            "message": message,
            "timestamp": datetime.now().isoformat(),
            "can_retry": can_retry,
        }
        self._notification_queue.append(notification)
        logger.warning(f"📢 Notificación para Leo: {message}")

        return {"success": False, "result": None, "action_taken": "admin_notified", "notification": notification}

    def _apply_fix_params(self, retry_func, context, params) -> dict:
        """Intenta sanitizar parámetros y reintentar."""
        # Por ahora, simplemente reintenta (el sanitizado se hace en el bridge)
        try:
            result = retry_func()
            return {"success": True, "result": result, "action_taken": "params_fixed"}
        except Exception as e:
            return {"success": False, "result": None, "action_taken": f"fix_params_failed: {e}"}

    # ===== LEARNING: Registrar resultado =====

    def record_outcome(self, error: Exception, solution_key: str, success: bool, bot_name: str = ""):
        """
        Registra si una solución funcionó o no.
        Esto es lo que hace que el sistema APRENDA.
        """
        if solution_key in self._solutions:
            sol = self._solutions[solution_key]
            if success:
                sol.success_count += 1
            else:
                sol.fail_count += 1
            sol.last_used = datetime.now().isoformat()
            self._save_solutions()

        # Registrar en historial
        entry = {
            "error": str(error)[:200],
            "category": self.classify_error(error),
            "solution_applied": solution_key,
            "success": success,
            "bot": bot_name,
            "timestamp": datetime.now().isoformat(),
        }
        self._error_history.append(entry)
        self._save_history()

        status = "✅" if success else "❌"
        logger.info(f"🧠 Learning: {status} solución '{solution_key}' para '{str(error)[:50]}' (bot: {bot_name})")

    # ===== LEARNING: Crear nueva solución =====

    def learn_new_solution(
        self,
        error_pattern: str,
        category: str,
        solution_type: str,
        solution_params: dict,
        description: str,
        learned_from: str = "auto",
    ) -> str:
        """
        Crea una nueva solución aprendida.
        Returns: key de la solución creada.
        """
        key = f"learned_{category}_{int(time.time())}"
        self._solutions[key] = ErrorSolution({
            "error_pattern": error_pattern,
            "category": category,
            "solution_type": solution_type,
            "solution_params": solution_params,
            "success_count": 1,  # Asumimos que funciona (se acaba de descubrir)
            "fail_count": 0,
            "description": description,
            "learned_from": learned_from,
        })
        self._save_solutions()
        logger.info(f"🧠 NUEVA solución aprendida: '{description}' (de: {learned_from})")
        return key

    # ===== NOTIFICATIONS: Cola de notificaciones para Leo =====

    def get_pending_notifications(self) -> List[dict]:
        """Devuelve notificaciones pendientes y las limpia."""
        notifications = list(self._notification_queue)
        self._notification_queue.clear()
        return notifications

    def get_stats(self) -> dict:
        """Estadísticas del sistema de aprendizaje."""
        total_solutions = len(self._solutions)
        high_confidence = sum(1 for s in self._solutions.values() if s.confidence > 0.8)
        total_errors = len(self._error_history)
        recent_errors = [e for e in self._error_history if
                        e.get("timestamp", "") > datetime.now().isoformat()[:10]]

        return {
            "total_solutions": total_solutions,
            "high_confidence_solutions": high_confidence,
            "total_errors_recorded": total_errors,
            "errors_today": len(recent_errors),
            "notification_queue": len(self._notification_queue),
        }

    # ===== GLOBAL MEMORY (para compartir estado entre módulos) =====

    def save_memory_global(self, key: str, value):
        """Guarda un valor en memoria global persistente (compartida entre bots)."""
        filepath = os.path.join(KNOWLEDGE_DIR, "global_memory.json")
        data = {}
        try:
            if os.path.exists(filepath):
                with open(filepath, 'r') as f:
                    data = json.load(f)
        except Exception:
            pass
        data[key] = value
        try:
            with open(filepath, 'w') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
        except Exception as e:
            logger.warning(f"Error guardando global memory: {e}")

    def load_memory_global(self, key: str, default=None):
        """Carga un valor de memoria global persistente."""
        filepath = os.path.join(KNOWLEDGE_DIR, "global_memory.json")
        try:
            if os.path.exists(filepath):
                with open(filepath, 'r') as f:
                    data = json.load(f)
                return data.get(key, default)
        except Exception:
            pass
        return default


# Singleton global
_learner_instance: Optional[ErrorLearner] = None


def get_error_learner() -> ErrorLearner:
    """Obtiene la instancia global del ErrorLearner."""
    global _learner_instance
    if _learner_instance is None:
        _learner_instance = ErrorLearner()
    return _learner_instance
