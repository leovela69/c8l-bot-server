# -*- coding: utf-8 -*-
"""
📝 SUMMARIZER — Resumen Automático de Conversaciones
=====================================================
Comprime historial de conversación para reducir tokens en prompts.

Estrategias:
1. Extractivo: Selecciona las frases más importantes
2. LLM: Usa modelo pequeño para resumir (Groq 1B)
3. Sliding window: Mantiene los últimos N + resumen de anteriores
"""

import time
import logging
from typing import Dict, List, Optional

logger = logging.getLogger("c8l.memory.summarizer")


class ConversationSummarizer:
    """
    Resumidor de conversaciones ultraligero.
    Reduce historial largo a contexto mínimo útil.
    """

    MAX_MESSAGES_BEFORE_SUMMARY = 10  # Resumir después de N mensajes
    SUMMARY_MAX_LENGTH = 200  # Chars del resumen

    def __init__(self):
        self._summaries: Dict[str, str] = {}  # chat_id → summary
        self._message_counts: Dict[str, int] = {}
        self.summary_count = 0

    def should_summarize(self, chat_id: str, message_count: int) -> bool:
        """¿Es momento de resumir?"""
        return message_count >= self.MAX_MESSAGES_BEFORE_SUMMARY

    def summarize_history(self, messages: List[Dict],
                          chat_id: str = "") -> str:
        """
        Resume una lista de mensajes a un párrafo corto.
        Usa estrategia extractiva (sin LLM) para velocidad.

        Args:
            messages: Lista de {"role": "user/assistant", "text": "..."}
            chat_id: ID del chat para cachear

        Returns:
            Resumen comprimido
        """
        if not messages:
            return ""

        # Estrategia extractiva: tomar las partes más informativas
        user_messages = [m["text"] for m in messages if m.get("role") == "user"]
        bot_messages = [m["text"] for m in messages if m.get("role") == "assistant"]

        # Extraer temas principales del usuario
        topics = self._extract_key_phrases(user_messages)

        # Extraer acciones del bot
        actions = self._extract_actions(bot_messages)

        # Componer resumen
        parts = []
        if topics:
            parts.append(f"Temas: {', '.join(topics[:5])}")
        if actions:
            parts.append(f"Acciones: {', '.join(actions[:3])}")

        summary = ". ".join(parts)

        # Truncar
        if len(summary) > self.SUMMARY_MAX_LENGTH:
            summary = summary[:self.SUMMARY_MAX_LENGTH - 3] + "..."

        # Cachear
        if chat_id:
            self._summaries[chat_id] = summary
            self.summary_count += 1

        return summary

    def get_compressed_context(self, chat_id: str,
                               recent_messages: List[Dict],
                               keep_last: int = 3) -> str:
        """
        Obtiene contexto comprimido: resumen + últimos N mensajes.
        Esto es lo que se inyecta al prompt del LLM.

        Args:
            chat_id: ID del chat
            recent_messages: Mensajes recientes
            keep_last: Cuántos mensajes mantener completos

        Returns:
            Contexto comprimido listo para inyectar
        """
        parts = []

        # Añadir resumen previo si existe
        prev_summary = self._summaries.get(chat_id)
        if prev_summary:
            parts.append(f"[Resumen previo: {prev_summary}]")

        # Últimos N mensajes completos
        last_messages = recent_messages[-keep_last:] if recent_messages else []
        for msg in last_messages:
            role = "U" if msg.get("role") == "user" else "B"
            text = msg.get("text", "")[:150]
            parts.append(f"{role}: {text}")

        return "\n".join(parts)

    def _extract_key_phrases(self, messages: List[str]) -> List[str]:
        """Extrae frases clave de los mensajes del usuario."""
        # Combinar todos los mensajes
        all_text = " ".join(messages).lower()
        words = all_text.split()

        # Contar palabras significativas (>3 chars, no stopwords)
        stopwords = {
            "que", "para", "por", "con", "una", "uno", "del", "los", "las",
            "este", "esta", "pero", "como", "más", "muy", "bien", "hace",
            "tiene", "puede", "algo", "todo", "nada", "otro", "quiero",
            "necesito", "favor", "gracias", "hola", "puedes",
        }

        word_freq = {}
        for word in words:
            if len(word) > 3 and word not in stopwords:
                word_freq[word] = word_freq.get(word, 0) + 1

        # Top palabras por frecuencia
        sorted_words = sorted(word_freq.items(), key=lambda x: x[1], reverse=True)
        return [word for word, _ in sorted_words[:7]]

    def _extract_actions(self, messages: List[str]) -> List[str]:
        """Extrae acciones realizadas por el bot."""
        actions = []
        action_indicators = {
            "generé": "generar",
            "creé": "crear",
            "busqué": "buscar",
            "traduje": "traducir",
            "analicé": "analizar",
            "imagen": "crear imagen",
            "música": "crear música",
            "video": "crear video",
        }

        for msg in messages[-5:]:  # Solo últimos 5
            msg_lower = msg.lower()
            for indicator, action in action_indicators.items():
                if indicator in msg_lower and action not in actions:
                    actions.append(action)
                    break

        return actions

    def get_stats(self) -> Dict:
        return {
            "summaries_generated": self.summary_count,
            "active_summaries": len(self._summaries),
        }
