# -*- coding: utf-8 -*-
"""
🧠 CEREBRO 2 — Analista de Contenido
Evalúa el rendimiento del contenido y sugiere mejoras.
"""

import time
from bots.base import BotBase


class Cerebro2Contenido(BotBase):
    """Analiza rendimiento del contenido y sugiere temas futuros."""

    def __init__(self):
        super().__init__("CEREBRO_2", "Analista de Contenido")

    async def analyze(self, incidents: list) -> dict:
        """Analiza problemas de contenido y sugiere acciones."""
        content_issues = [
            i for i in incidents
            if "contenido" in i.get("bot", "").lower()
               or "content" in str(i.get("data", "")).lower()
        ]

        tasks = []
        for issue in content_issues:
            issues_list = issue.get("data", {}).get("issues", [])
            for problem in issues_list:
                tasks.append({
                    "type": "content",
                    "priority": "medium",
                    "description": problem,
                    "action": "fix_content",
                })

        # Guardar tendencias
        trends = self.load_memory("content_trends", [])
        trends.append({
            "timestamp": time.time(),
            "issues_count": len(content_issues),
        })
        if len(trends) > 100:
            trends = trends[-100:]
        self.save_memory("content_trends", trends)

        return self.report(
            "ok",
            f"Análisis de contenido: {len(tasks)} tareas de mejora",
            {"tasks": tasks},
        )
