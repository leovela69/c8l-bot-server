# -*- coding: utf-8 -*-
"""
⏰ TASK SCHEDULER — Planificador de Tareas Autónomas
=====================================================
Ejecuta tareas periódicas del enjambre:
- Healthchecks cada 1 min
- Monitoreo de APIs cada 5 min
- Limpieza de cache cada 6 horas
- Recordatorios de usuarios
- Aprendizaje nocturno cada 24h
"""

import time
import threading
import logging
from typing import Dict, List, Callable, Optional
from datetime import datetime

logger = logging.getLogger("c8l.automation.scheduler")


class ScheduledTask:
    """Una tarea programada."""

    def __init__(self, name: str, callback: Callable,
                 interval_seconds: int, enabled: bool = True):
        self.name = name
        self.callback = callback
        self.interval = interval_seconds
        self.enabled = enabled
        self.last_run = 0
        self.run_count = 0
        self.errors = 0
        self.last_error = ""

    def is_due(self) -> bool:
        """¿Es momento de ejecutar?"""
        if not self.enabled:
            return False
        return time.time() - self.last_run >= self.interval

    def execute(self):
        """Ejecuta la tarea."""
        try:
            self.callback()
            self.last_run = time.time()
            self.run_count += 1
        except Exception as e:
            self.errors += 1
            self.last_error = str(e)[:100]
            logger.warning(f"Task '{self.name}' error: {e}")


class TaskScheduler:
    """
    Planificador ultraligero de tareas periódicas.
    Corre en un thread separado sin bloquear el bot.
    """

    def __init__(self):
        self._tasks: Dict[str, ScheduledTask] = {}
        self._running = False
        self._thread: Optional[threading.Thread] = None
        self._check_interval = 10  # Revisar cada 10 segundos

    def add_task(self, name: str, callback: Callable,
                 interval_seconds: int, enabled: bool = True):
        """Registra una tarea periódica."""
        self._tasks[name] = ScheduledTask(
            name, callback, interval_seconds, enabled
        )
        logger.info(f"⏰ Task registered: {name} (every {interval_seconds}s)")

    def remove_task(self, name: str):
        """Elimina una tarea."""
        if name in self._tasks:
            del self._tasks[name]

    def start(self):
        """Inicia el scheduler en background."""
        if self._running:
            return
        self._running = True
        self._thread = threading.Thread(target=self._loop, daemon=True)
        self._thread.start()
        logger.info("⏰ TaskScheduler started")

    def stop(self):
        """Detiene el scheduler."""
        self._running = False
        if self._thread:
            self._thread.join(timeout=5)
        logger.info("⏰ TaskScheduler stopped")

    def _loop(self):
        """Loop principal del scheduler."""
        while self._running:
            for task in self._tasks.values():
                if task.is_due():
                    task.execute()
            time.sleep(self._check_interval)

    def get_status(self) -> str:
        """Estado de todas las tareas."""
        text = "⏰ *Scheduler Status*\n\n"
        for name, task in self._tasks.items():
            status = "✅" if task.enabled else "⏸️"
            last = datetime.fromtimestamp(task.last_run).strftime(
                "%H:%M:%S") if task.last_run else "nunca"
            text += (
                f"{status} *{name}*\n"
                f"   Runs: {task.run_count} | "
                f"Errors: {task.errors} | "
                f"Last: {last}\n"
            )
        return text
