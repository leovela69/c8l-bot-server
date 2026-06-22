# -*- coding: utf-8 -*-
"""
Clase base para todos los bots del equipo C8L.
Cada bot hereda de aquí y tiene: nombre, función, logging, reportes.
"""

import logging
import time
import json
import os

REPORTS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "reports")
LOGS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "logs")
MEMORY_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "memory")

os.makedirs(REPORTS_DIR, exist_ok=True)
os.makedirs(LOGS_DIR, exist_ok=True)
os.makedirs(MEMORY_DIR, exist_ok=True)


class BotBase:
    """Clase base para todos los bots del equipo."""

    def __init__(self, name: str, role: str):
        self.name = name
        self.role = role
        self.logger = logging.getLogger(f"c8l.{name.lower()}")
        self.logger.info(f"🤖 {name} ({role}) inicializado")

    async def run(self) -> dict:
        """Ejecuta la tarea principal del bot. Override en subclases."""
        raise NotImplementedError

    def report(self, status: str, message: str, data: dict = None) -> dict:
        """Genera un informe estándar."""
        report = {
            "bot": self.name,
            "role": self.role,
            "status": status,  # "ok", "warning", "error", "critical"
            "message": message,
            "data": data or {},
            "timestamp": time.time(),
            "time_human": time.strftime("%Y-%m-%d %H:%M:%S"),
        }

        # Guardar en disco
        filename = f"{self.name.lower()}_{int(time.time())}.json"
        filepath = os.path.join(REPORTS_DIR, filename)
        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(report, f, ensure_ascii=False, indent=2)

        self.logger.info(f"📋 {self.name} → [{status.upper()}] {message}")
        return report

    def load_memory(self, key: str, default=None):
        """Carga un valor de la memoria persistente."""
        filepath = os.path.join(MEMORY_DIR, f"{self.name.lower()}.json")
        try:
            if os.path.exists(filepath):
                with open(filepath, "r") as f:
                    data = json.load(f)
                return data.get(key, default)
        except:
            pass
        return default

    def save_memory(self, key: str, value):
        """Guarda un valor en la memoria persistente."""
        filepath = os.path.join(MEMORY_DIR, f"{self.name.lower()}.json")
        data = {}
        try:
            if os.path.exists(filepath):
                with open(filepath, "r") as f:
                    data = json.load(f)
        except:
            pass
        data[key] = value
        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
