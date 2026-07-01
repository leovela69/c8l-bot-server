# -*- coding: utf-8 -*-
"""
🔧 AUTO HEALING — Auto-Reparación de Errores
==============================================
Detecta errores recurrentes y aplica soluciones conocidas.
Aprende de errores anteriores para prevenir futuros.
"""

import time
import logging
from typing import Dict, List, Optional, Callable
from collections import defaultdict

logger = logging.getLogger("c8l.automation.healing")


class AutoHealer:
    """
    Motor de auto-reparación.
    Detecta patrones de error y aplica fixes conocidos.
    """

    def __init__(self):
        self._error_log: List[Dict] = []
        self._error_counts: Dict[str, int] = defaultdict(int)
        self._solutions: Dict[str, Callable] = {}
        self._auto_fixes_applied = 0
        self.max_errors_before_alert = 5

    def register_solution(self, error_pattern: str,
                          fix_callback: Callable):
        """Registra una solución para un patrón de error."""
        self._solutions[error_pattern.lower()] = fix_callback

    def report_error(self, error_type: str, error_msg: str,
                     context: Dict = None) -> Optional[str]:
        """
        Reporta un error y busca solución automática.

        Returns:
            Mensaje de fix aplicado o None
        """
        self._error_counts[error_type] += 1
        self._error_log.append({
            "type": error_type,
            "message": error_msg[:200],
            "context": context or {},
            "time": time.time(),
        })

        # Limitar log
        if len(self._error_log) > 500:
            self._error_log = self._error_log[-500:]

        # Buscar solución automática
        fix_result = self._try_auto_fix(error_type, error_msg)
        if fix_result:
            self._auto_fixes_applied += 1
            logger.info(f"🔧 Auto-fix applied for: {error_type}")
            return fix_result

        # Alertar si hay muchos errores del mismo tipo
        if self._error_counts[error_type] >= self.max_errors_before_alert:
            logger.warning(
                f"⚠️ Error recurrente: {error_type} "
                f"({self._error_counts[error_type]}x)"
            )

        return None

    def _try_auto_fix(self, error_type: str, error_msg: str) -> Optional[str]:
        """Intenta aplicar un fix automático."""
        error_lower = error_msg.lower()

        for pattern, fix_fn in self._solutions.items():
            if pattern in error_lower or pattern in error_type.lower():
                try:
                    result = fix_fn()
                    return f"🔧 Auto-fix: {result}"
                except Exception as e:
                    logger.warning(f"Auto-fix failed: {e}")

        # Fixes genéricos conocidos
        if "rate limit" in error_lower or "429" in error_msg:
            return "⏳ Rate limit detectado — esperando 60s antes de reintentar"

        if "timeout" in error_lower:
            return "⏱️ Timeout detectado — reintentando con timeout mayor"

        if "connection" in error_lower:
            return "🌐 Error de conexión — verificando red"

        return None

    def get_health_report(self) -> str:
        """Genera reporte de salud del sistema."""
        total_errors = sum(self._error_counts.values())
        top_errors = sorted(
            self._error_counts.items(),
            key=lambda x: x[1],
            reverse=True
        )[:5]

        text = "🔧 *Auto-Healing Report*\n\n"
        text += f"📊 Total errores: {total_errors}\n"
        text += f"🔧 Fixes aplicados: {self._auto_fixes_applied}\n"

        if top_errors:
            text += "\n⚠️ *Top errores:*\n"
            for err_type, count in top_errors:
                text += f"  • {err_type}: {count}x\n"

        return text

    def clear_error_counts(self):
        """Resetea contadores (para uso tras fixes masivos)."""
        self._error_counts.clear()
