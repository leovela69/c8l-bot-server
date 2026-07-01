# -*- coding: utf-8 -*-
"""
🔄 FALLBACK CHAIN — Cadena de Recuperación Inteligente
=======================================================
Cuando un agente falla, esta cadena intenta alternativas.

Orden de fallback:
1. Agente secundario (del TriageResult)
2. Hermes (conversador universal)
3. Respuesta genérica con contexto
4. Mensaje de error amigable
"""

import logging
import time
from typing import Dict, Optional, Callable, List

logger = logging.getLogger("c8l.dispatcher.fallback")


class FallbackChain:
    """
    Cadena de fallback inteligente.
    Nunca deja al usuario sin respuesta.
    """

    def __init__(self):
        self._handlers: Dict[str, Callable] = {}
        self._generic_handler: Optional[Callable] = None
        self.fallback_count = 0
        self.chain_depth_stats: Dict[int, int] = {}  # depth → count

    def register_handler(self, name: str, handler: Callable, priority: int = 5):
        """
        Registra un handler de fallback.

        Args:
            name: Nombre identificador
            handler: Callable que recibe (message, chat_id, user_name, user_context)
            priority: Prioridad (1=más alta, 10=más baja)
        """
        self._handlers[name] = {"handler": handler, "priority": priority}

    def set_generic_handler(self, handler: Callable):
        """Handler genérico de último recurso."""
        self._generic_handler = handler

    def execute(self, message: str, chat_id: str = "",
                user_name: str = "", user_context: str = "",
                original_agent: str = "") -> Optional[str]:
        """
        Ejecuta la cadena de fallback hasta obtener respuesta.

        Returns:
            Respuesta del primer handler que funcione, o None
        """
        self.fallback_count += 1
        depth = 0

        # Ordenar handlers por prioridad
        sorted_handlers = sorted(
            self._handlers.items(),
            key=lambda x: x[1]["priority"]
        )

        for name, config in sorted_handlers:
            depth += 1
            try:
                handler = config["handler"]
                response = handler(
                    message=message,
                    chat_id=chat_id,
                    user_name=user_name,
                    user_context=user_context,
                )
                if response and str(response).strip():
                    logger.info(f"🔄 Fallback OK via '{name}' (depth={depth})")
                    self.chain_depth_stats[depth] = \
                        self.chain_depth_stats.get(depth, 0) + 1
                    return str(response)
            except Exception as e:
                logger.warning(f"Fallback '{name}' failed: {e}")
                continue

        # Último recurso: handler genérico
        if self._generic_handler:
            depth += 1
            try:
                response = self._generic_handler(
                    message=message,
                    chat_id=chat_id,
                    user_name=user_name,
                    user_context=user_context,
                )
                if response:
                    self.chain_depth_stats[depth] = \
                        self.chain_depth_stats.get(depth, 0) + 1
                    return str(response)
            except Exception as e:
                logger.error(f"Generic fallback failed: {e}")

        # Respuesta de emergencia
        return self._emergency_response(user_name)

    def _emergency_response(self, user_name: str = "") -> str:
        """Respuesta de emergencia cuando todo falla."""
        name = user_name or "amigo"
        return (
            f"🔄 {name}, estoy procesando tu mensaje pero mis sistemas "
            f"están algo saturados. Dame un momento y vuelve a intentar.\n\n"
            f"💡 Tip: Si necesitas algo específico, intenta ser más directo "
            f"(ej: '/imagen un león', '/musica reggaeton')"
        )

    def get_stats(self) -> Dict:
        return {
            "total_fallbacks": self.fallback_count,
            "handlers_count": len(self._handlers),
            "depth_distribution": self.chain_depth_stats,
        }
