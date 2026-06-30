# -*- coding: utf-8 -*-
"""
📚 LEARNING FEEDBACK — Aprendizaje por Retroalimentación
=========================================================
El bot aprende de cada interacción:
- Qué respuestas gustaron (positivo)
- Qué respuestas fallaron (negativo)
- Patrones de uso por hora/día
- Intenciones que necesitan mejorar
"""

import json
import os
import time
import logging
from typing import Dict, List, Optional
from collections import defaultdict

logger = logging.getLogger("c8l.memory.learning")


class LearningFeedback:
    """
    Motor de aprendizaje por feedback.
    Almacena señales positivas/negativas para mejorar.
    """

    def __init__(self, data_dir: str = None):
        from config import DATA_DIR
        self.data_dir = data_dir or DATA_DIR
        self._feedback_path = os.path.join(
            self.data_dir, "learning_feedback.json"
        )
        self._data = self._load()

    def record_positive(self, intent: str, agent: str,
                        message: str = "", user_id: str = ""):
        """Registra feedback positivo."""
        self._record("positive", intent, agent, message, user_id)

    def record_negative(self, intent: str, agent: str,
                        message: str = "", reason: str = "",
                        user_id: str = ""):
        """Registra feedback negativo."""
        self._record("negative", intent, agent, message, user_id, reason)

    def record_correction(self, original_intent: str,
                          correct_intent: str, message: str):
        """Registra una corrección de intención."""
        corrections = self._data.setdefault("corrections", [])
        corrections.append({
            "original": original_intent,
            "correct": correct_intent,
            "message": message[:200],
            "time": time.time(),
        })
        if len(corrections) > 500:
            self._data["corrections"] = corrections[-500:]
        self._save()

    def get_intent_accuracy(self, intent: str) -> float:
        """Calcula la precisión de una intención basada en feedback."""
        stats = self._data.get("intent_stats", {}).get(intent, {})
        pos = stats.get("positive", 0)
        neg = stats.get("negative", 0)
        total = pos + neg
        if total == 0:
            return 1.0
        return pos / total

    def get_weak_intents(self, threshold: float = 0.7) -> List[str]:
        """Intenciones con accuracy baja que necesitan mejorar."""
        weak = []
        for intent, stats in self._data.get("intent_stats", {}).items():
            accuracy = self.get_intent_accuracy(intent)
            if accuracy < threshold:
                weak.append(intent)
        return weak

    def get_learning_summary(self) -> str:
        """Resumen del aprendizaje acumulado."""
        total_pos = sum(
            s.get("positive", 0)
            for s in self._data.get("intent_stats", {}).values()
        )
        total_neg = sum(
            s.get("negative", 0)
            for s in self._data.get("intent_stats", {}).values()
        )
        corrections = len(self._data.get("corrections", []))
        weak = self.get_weak_intents()

        text = f"📚 *Aprendizaje del Sistema*\n\n"
        text += f"👍 Feedback positivo: {total_pos}\n"
        text += f"👎 Feedback negativo: {total_neg}\n"
        text += f"🔄 Correcciones: {corrections}\n"
        if weak:
            text += f"⚠️ Intenciones débiles: {', '.join(weak)}\n"
        return text

    def _record(self, feedback_type: str, intent: str, agent: str,
                message: str = "", user_id: str = "", reason: str = ""):
        """Registra un feedback."""
        stats = self._data.setdefault("intent_stats", {})
        intent_stats = stats.setdefault(intent, {
            "positive": 0, "negative": 0
        })
        intent_stats[feedback_type] = intent_stats.get(feedback_type, 0) + 1

        # Log detallado
        log = self._data.setdefault("log", [])
        log.append({
            "type": feedback_type,
            "intent": intent,
            "agent": agent,
            "message": message[:100],
            "reason": reason,
            "user_id": user_id,
            "time": time.time(),
        })
        if len(log) > 1000:
            self._data["log"] = log[-1000:]

        self._save()

    def _load(self) -> Dict:
        try:
            if os.path.exists(self._feedback_path):
                with open(self._feedback_path, "r", encoding="utf-8") as f:
                    return json.load(f)
        except Exception as e:
            logger.warning(f"Learning feedback load error: {e}")
        return {}

    def _save(self):
        try:
            os.makedirs(os.path.dirname(self._feedback_path), exist_ok=True)
            with open(self._feedback_path, "w", encoding="utf-8") as f:
                json.dump(self._data, f, ensure_ascii=False, indent=2)
        except Exception as e:
            logger.error(f"Learning feedback save error: {e}")
