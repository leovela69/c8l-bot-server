# -*- coding: utf-8 -*-
"""
🌙 NIGHTLY LEARN — Aprendizaje Nocturno
=========================================
Proceso que corre cada 24h para:
- Analizar feedback del día
- Identificar intenciones débiles
- Actualizar el clasificador
- Generar resúmenes
- Limpiar datos obsoletos
"""

import time
import logging
from typing import Dict

logger = logging.getLogger("c8l.automation.nightly")


class NightlyLearner:
    """
    Motor de aprendizaje nocturno.
    Corre una vez al día (preferiblemente de madrugada).
    """

    def __init__(self):
        self.last_run = 0
        self.runs_completed = 0

    def run(self) -> Dict:
        """
        Ejecuta el proceso completo de aprendizaje nocturno.

        Returns:
            Reporte del proceso
        """
        start = time.time()
        report = {
            "timestamp": start,
            "actions": [],
            "errors": [],
        }

        # 1. Analizar feedback del día
        try:
            feedback_result = self._analyze_feedback()
            report["actions"].append(
                f"Feedback analizado: {feedback_result}"
            )
        except Exception as e:
            report["errors"].append(f"Feedback: {e}")

        # 2. Identificar intenciones débiles
        try:
            weak = self._identify_weak_intents()
            if weak:
                report["actions"].append(
                    f"Intenciones débiles: {', '.join(weak)}"
                )
        except Exception as e:
            report["errors"].append(f"Weak intents: {e}")

        # 3. Limpiar datos obsoletos
        try:
            cleaned = self._cleanup_old_data()
            report["actions"].append(f"Limpieza: {cleaned}")
        except Exception as e:
            report["errors"].append(f"Cleanup: {e}")

        # 4. Generar resumen del día
        try:
            summary = self._generate_daily_summary()
            report["summary"] = summary
        except Exception as e:
            report["errors"].append(f"Summary: {e}")

        self.last_run = time.time()
        self.runs_completed += 1
        report["duration_seconds"] = time.time() - start

        logger.info(
            f"🌙 Nightly learn completed: "
            f"{len(report['actions'])} actions, "
            f"{len(report['errors'])} errors"
        )

        return report

    def _analyze_feedback(self) -> str:
        """Analiza el feedback recibido hoy."""
        try:
            from memory.learning_feedback import LearningFeedback
            feedback = LearningFeedback()
            weak = feedback.get_weak_intents()
            return f"{len(weak)} intenciones necesitan mejora"
        except Exception:
            return "sin datos de feedback"

    def _identify_weak_intents(self):
        """Identifica intenciones con baja precisión."""
        try:
            from memory.learning_feedback import LearningFeedback
            feedback = LearningFeedback()
            return feedback.get_weak_intents(threshold=0.6)
        except Exception:
            return []

    def _cleanup_old_data(self) -> str:
        """Limpia datos viejos."""
        import os
        import json
        from config import DATA_DIR

        cleaned = 0
        # Limpiar reportes viejos (>7 días)
        reports_dir = os.path.join(DATA_DIR, "reports")
        if os.path.exists(reports_dir):
            now = time.time()
            for f in os.listdir(reports_dir):
                fp = os.path.join(reports_dir, f)
                if os.path.isfile(fp):
                    age = now - os.path.getmtime(fp)
                    if age > 7 * 24 * 3600:
                        os.remove(fp)
                        cleaned += 1

        return f"{cleaned} archivos eliminados"

    def _generate_daily_summary(self) -> str:
        """Genera resumen del día."""
        return (
            f"🌙 Resumen nocturno completado. "
            f"Run #{self.runs_completed + 1}"
        )
