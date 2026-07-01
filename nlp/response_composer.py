# -*- coding: utf-8 -*-
"""
🎨 RESPONSE COMPOSER — Compositor de Respuestas Ultraligero
============================================================
Compone respuestas optimizadas antes de enviarlas al usuario.
- Compresión de contexto
- Streaming-ready
- Formato adaptativo (texto, markdown, HTML)
"""

import logging
import time
from typing import Dict, Optional, List

logger = logging.getLogger("c8l.nlp.composer")


class ResponseComposer:
    """
    Compone y optimiza respuestas antes de enviarlas.
    Reduce tokens inyectando solo contexto relevante.
    """

    # Límites de contexto por capa
    MAX_HISTORY_TOKENS_L1 = 200   # Capa 1: mínimo contexto
    MAX_HISTORY_TOKENS_L2 = 800   # Capa 2: contexto moderado
    MAX_MEMORY_ITEMS = 3          # Máximo ítems de memoria a inyectar

    def __init__(self):
        self.response_count = 0

    def compose_prompt(self, user_message: str, intent_layer: int,
                       history: List[Dict] = None,
                       user_memory: str = "",
                       system_prompt: str = "") -> str:
        """
        Compone el prompt optimizado según la capa de resolución.

        Capa 0: No necesita prompt (respuesta directa)
        Capa 1: Prompt mínimo (solo mensaje + intent)
        Capa 2: Prompt completo pero comprimido
        """
        if intent_layer == 0:
            return user_message

        if intent_layer == 1:
            # Contexto mínimo
            parts = []
            if user_memory:
                # Solo las últimas 3 líneas de memoria
                mem_lines = user_memory.strip().split("\n")[-self.MAX_MEMORY_ITEMS:]
                parts.append("\n".join(mem_lines))
            parts.append(f"Usuario: {user_message}")
            return "\n".join(parts)

        # Capa 2: Contexto completo pero comprimido
        parts = []
        if system_prompt:
            parts.append(system_prompt)
        if user_memory:
            parts.append(f"[CONTEXTO]: {self._compress_memory(user_memory)}")
        if history:
            compressed_history = self._compress_history(history)
            if compressed_history:
                parts.append(f"[HISTORIAL RECIENTE]:\n{compressed_history}")
        parts.append(f"Usuario: {user_message}")
        return "\n\n".join(parts)

    def format_response(self, text: str, format_type: str = "telegram") -> str:
        """
        Formatea la respuesta para el canal de salida.
        """
        if not text:
            return "..."

        if format_type == "telegram":
            # Limpiar markdown excesivo para Telegram
            text = self._clean_for_telegram(text)
        elif format_type == "html":
            text = self._to_html(text)

        self.response_count += 1
        return text

    def _compress_memory(self, memory: str) -> str:
        """Comprime la memoria a lo esencial."""
        lines = memory.strip().split("\n")
        # Solo las líneas que tienen info útil
        relevant = [l for l in lines if l.strip() and not l.startswith("[")]
        return "\n".join(relevant[-self.MAX_MEMORY_ITEMS:])

    def _compress_history(self, history: List[Dict],
                          max_entries: int = 5) -> str:
        """Comprime historial a los últimos N intercambios."""
        if not history:
            return ""
        recent = history[-max_entries:]
        lines = []
        for msg in recent:
            role = "U" if msg.get("role") == "user" else "B"
            text = msg.get("text", "")[:100]
            lines.append(f"{role}: {text}")
        return "\n".join(lines)

    def _clean_for_telegram(self, text: str) -> str:
        """Limpia formato para Telegram."""
        # Limitar longitud
        if len(text) > 4000:
            text = text[:3950] + "\n\n[...continuará]"
        return text

    def _to_html(self, text: str) -> str:
        """Convierte a HTML para Telegram."""
        import re
        # Bold
        text = re.sub(r'\*\*(.*?)\*\*', r'<b>\1</b>', text)
        text = re.sub(r'\*(.*?)\*', r'<i>\1</i>', text)
        # Code
        text = re.sub(r'`(.*?)`', r'<code>\1</code>', text)
        return text
