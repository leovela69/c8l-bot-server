# -*- coding: utf-8 -*-
"""
🧠 CEREBRO 1 — Analista de Datos
Cruza datos de rendimiento, errores y tráfico para detectar patrones.
"""

import time
from bots.base import BotBase


class Cerebro1Datos(BotBase):
    """Analiza patrones en los informes de las Águilas."""

    def __init__(self):
        super().__init__("CEREBRO_1", "Analista de Datos")

    async def analyze(self, incidents: list) -> dict:
        """Analiza los incidentes reportados por las Águilas."""
        tasks = []

        for incident in incidents:
            status = incident.get("status", "unknown")
            bot_name = incident.get("bot", "unknown")
            data = incident.get("data", {})

            # Clasificar por tipo
            if "rendimiento" in bot_name.lower() or "slow" in str(data).lower():
                # Problema de rendimiento
                slow_pages = data.get("slow_pages", [])
                if slow_pages:
                    tasks.append({
                        "type": "code",
                        "priority": "high" if status == "critical" else "medium",
                        "description": f"Páginas lentas: {', '.join(slow_pages)}",
                        "action": "optimize_performance",
                        "data": data,
                    })

            elif "seguridad" in bot_name.lower():
                # Problema de seguridad
                issues = data.get("issues", [])
                if issues:
                    tasks.append({
                        "type": "code",
                        "priority": "high",
                        "description": f"Problemas de seguridad: {'; '.join(issues[:3])}",
                        "action": "fix_security",
                        "data": data,
                    })

            elif "contenido" in bot_name.lower():
                # Problema de contenido
                issues = data.get("issues", [])
                if issues:
                    tasks.append({
                        "type": "content",
                        "priority": "medium",
                        "description": f"Problemas de contenido: {'; '.join(issues[:3])}",
                        "action": "fix_content",
                        "data": data,
                    })

        # Guardar análisis
        self.save_memory("last_analysis", {
            "timestamp": time.time(),
            "incidents_received": len(incidents),
            "tasks_generated": len(tasks),
        })

        return self.report(
            "ok" if not tasks else "warning",
            f"Análisis completo: {len(tasks)} tareas generadas de {len(incidents)} incidentes",
            {"tasks": tasks},
        )
