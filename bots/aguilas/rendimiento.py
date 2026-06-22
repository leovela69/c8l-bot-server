# -*- coding: utf-8 -*-
"""
🦅 ÁGUILA 1 — Monitor de Rendimiento
Mide tiempos de carga de las páginas clave.
Si algo tarda más de 2 segundos, alerta a AION.
"""

import time
import requests
from bots.base import BotBase


class Aguila1Rendimiento(BotBase):
    """Monitorea el rendimiento de las páginas principales."""

    def __init__(self, base_url: str):
        super().__init__("AGUILA_1", "Monitor de Rendimiento")
        self.base_url = base_url
        self.endpoints = [
            ("/", "Página principal"),
            ("/feed", "Feed"),
            ("/casino", "Casino"),
            ("/sala", "Sala"),
        ]
        self.threshold_seconds = 2.0

    async def run(self) -> dict:
        """Mide los tiempos de carga de cada endpoint."""
        results = []
        slow_pages = []

        for path, name in self.endpoints:
            url = f"{self.base_url}{path}"
            try:
                start = time.time()
                r = requests.get(url, timeout=10)
                elapsed = time.time() - start
                status_code = r.status_code

                result = {
                    "page": name,
                    "url": url,
                    "time_seconds": round(elapsed, 2),
                    "status_code": status_code,
                    "ok": elapsed < self.threshold_seconds and status_code == 200,
                }
                results.append(result)

                if elapsed >= self.threshold_seconds:
                    slow_pages.append(f"{name} ({elapsed:.1f}s)")

                if status_code != 200:
                    slow_pages.append(f"{name} (HTTP {status_code})")

            except requests.Timeout:
                results.append({"page": name, "url": url, "time_seconds": 10, "status_code": 0, "ok": False})
                slow_pages.append(f"{name} (TIMEOUT)")
            except Exception as e:
                results.append({"page": name, "url": url, "time_seconds": 0, "status_code": 0, "ok": False, "error": str(e)})
                slow_pages.append(f"{name} (ERROR: {str(e)[:50]})")

        # Guardar métricas históricas
        history = self.load_memory("performance_history", [])
        history.append({"timestamp": time.time(), "results": results})
        # Mantener últimas 100 mediciones
        if len(history) > 100:
            history = history[-100:]
        self.save_memory("performance_history", history)

        # Generar informe
        if slow_pages:
            return self.report(
                "warning",
                f"Páginas lentas/con error: {', '.join(slow_pages)}",
                {"results": results, "slow_pages": slow_pages},
            )
        else:
            return self.report(
                "ok",
                f"Todas las páginas responden en <{self.threshold_seconds}s",
                {"results": results},
            )
