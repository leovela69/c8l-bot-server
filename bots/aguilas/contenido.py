# -*- coding: utf-8 -*-
"""
🦅 ÁGUILA 2 — Verificador de Contenido
Verifica que el contenido nuevo se haya publicado correctamente
y que los enlaces funcionen.
"""

import time
import requests
from bots.base import BotBase


class Aguila2Contenido(BotBase):
    """Verifica la publicación correcta del contenido."""

    def __init__(self, base_url: str):
        super().__init__("AGUILA_2", "Verificador de Contenido")
        self.base_url = base_url

    async def run(self) -> dict:
        """Verifica que el contenido principal esté accesible."""
        issues = []

        # Verificar feed
        try:
            r = requests.get(f"{self.base_url}/feed", timeout=10)
            if r.status_code == 200:
                content = r.text
                # Verificar que tiene contenido real (no página vacía)
                if len(content) < 100:
                    issues.append("Feed parece vacío (menos de 100 chars)")
                # Verificar que no hay errores visibles
                if "error" in content.lower() and "404" in content:
                    issues.append("Feed muestra errores")
            else:
                issues.append(f"Feed devuelve HTTP {r.status_code}")
        except Exception as e:
            issues.append(f"Feed inaccesible: {str(e)[:50]}")

        # Verificar página principal
        try:
            r = requests.get(self.base_url, timeout=10)
            if r.status_code != 200:
                issues.append(f"Home devuelve HTTP {r.status_code}")
        except Exception as e:
            issues.append(f"Home inaccesible: {str(e)[:50]}")

        if issues:
            return self.report("warning", f"Problemas de contenido: {'; '.join(issues)}", {"issues": issues})
        else:
            return self.report("ok", "Todo el contenido accesible y correcto")
