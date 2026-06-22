# -*- coding: utf-8 -*-
"""
🦅 ÁGUILA 3 — Scanner de Seguridad
Escanea en busca de enlaces rotos, errores 404
o cambios sospechosos.
"""

import time
import requests
import re
from bots.base import BotBase


class Aguila3Seguridad(BotBase):
    """Escanea la web en busca de problemas de seguridad."""

    def __init__(self, base_url: str):
        super().__init__("AGUILA_3", "Scanner de Seguridad")
        self.base_url = base_url

    async def run(self) -> dict:
        """Escanea la web en busca de problemas."""
        issues = []

        # Verificar HTTPS
        try:
            r = requests.get(self.base_url, timeout=10, allow_redirects=False)
            if not self.base_url.startswith("https"):
                issues.append("Web no usa HTTPS")
        except Exception as e:
            issues.append(f"No se puede conectar: {str(e)[:50]}")
            return self.report("error", f"Web inaccesible: {str(e)[:100]}", {"issues": issues})

        # Verificar headers de seguridad
        try:
            r = requests.get(self.base_url, timeout=10)
            headers = r.headers

            security_headers = {
                "X-Content-Type-Options": "nosniff",
                "X-Frame-Options": None,  # Solo verificar presencia
            }

            missing_headers = []
            for header, expected in security_headers.items():
                if header not in headers:
                    missing_headers.append(header)

            if missing_headers:
                issues.append(f"Headers de seguridad faltantes: {', '.join(missing_headers)}")

        except Exception as e:
            issues.append(f"Error verificando headers: {str(e)[:50]}")

        # Verificar que no hay errores expuestos
        try:
            r = requests.get(f"{self.base_url}/nonexistent-page-test-404", timeout=10)
            if r.status_code == 200:
                # Debería dar 404, si da 200 puede ser un problema
                issues.append("Páginas inexistentes no devuelven 404 (posible exposición)")
        except:
            pass

        # Guardar historial
        scan_history = self.load_memory("security_scans", [])
        scan_history.append({"timestamp": time.time(), "issues": len(issues)})
        if len(scan_history) > 50:
            scan_history = scan_history[-50:]
        self.save_memory("security_scans", scan_history)

        if issues:
            return self.report("warning", f"Seguridad: {len(issues)} observaciones", {"issues": issues})
        else:
            return self.report("ok", "Sin problemas de seguridad detectados")
