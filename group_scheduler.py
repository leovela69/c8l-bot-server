# -*- coding: utf-8 -*-
"""
🏛️ C8L AGENCY — SCHEDULER DE GRUPO
Envia mensajes automaticos al grupo Corazones Locos cada 4 horas.
Rota entre los 4 pilares: tareas, musica, motivacion, web.
"""

import threading
import time
import logging
import random

logger = logging.getLogger("c8l.scheduler")

# Intervalo entre mensajes (en segundos)
# 4 horas = 14400 segundos
# Para testing: 60 segundos
INTERVAL_SECONDS = 4 * 60 * 60  # 4 horas

# Variacion aleatoria (+/- 30 min) para que no sea predecible
JITTER_SECONDS = 30 * 60


class GroupScheduler:
    """Scheduler que envia mensajes rotativos al grupo de Telegram."""

    def __init__(self, broadcast_fn):
        """
        Args:
            broadcast_fn: funcion que envia mensaje al grupo (text, parse_mode)
        """
        self.broadcast_fn = broadcast_fn
        self._running = False
        self._thread = None
        self._message_index = 0
        logger.info("📅 GroupScheduler inicializado")

    def start(self):
        """Inicia el scheduler en un thread daemon."""
        if self._running:
            logger.warning("Scheduler ya esta corriendo")
            return
        self._running = True
        self._thread = threading.Thread(target=self._loop, daemon=True)
        self._thread.start()
        logger.info(f"📅 Scheduler activo — mensajes cada ~{INTERVAL_SECONDS // 3600}h")

    def stop(self):
        """Detiene el scheduler."""
        self._running = False
        logger.info("📅 Scheduler detenido")

    def _loop(self):
        """Loop principal del scheduler."""
        from group_personality import get_next_scheduled_message

        # Esperar 5 minutos antes del primer mensaje (dar tiempo a que el bot arranque)
        time.sleep(300)

        while self._running:
            try:
                # Obtener siguiente mensaje rotativo
                message = get_next_scheduled_message()
                
                # Enviar al grupo
                ok = self.broadcast_fn(message, "HTML")
                if ok:
                    logger.info(f"📅 Mensaje programado enviado al grupo")
                else:
                    logger.warning("📅 No se pudo enviar mensaje programado")

            except Exception as e:
                logger.error(f"📅 Error en scheduler: {e}")

            # Esperar intervalo + jitter aleatorio
            jitter = random.randint(-JITTER_SECONDS, JITTER_SECONDS)
            wait_time = max(INTERVAL_SECONDS + jitter, 60)  # minimo 1 minuto
            time.sleep(wait_time)

    def send_now(self, category=None):
        """Envia un mensaje inmediatamente (para testing o comando manual)."""
        from group_personality import get_random_auto_message
        message = get_random_auto_message(category)
        return self.broadcast_fn(message, "HTML")
