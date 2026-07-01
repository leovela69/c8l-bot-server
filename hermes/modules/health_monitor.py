# -*- coding: utf-8 -*-
"""
⚡ HERMES — Monitor de Salud de Bot 1 (leon_leo_bot)
Detecta si el bot principal se cae y toma el control como backup.
"""

import time
import threading
import requests
import logging
from config import ADMIN_CHAT_ID, GROUP_CHAT_ID, TELEGRAM_BOT_TOKEN

logger = logging.getLogger("hermes.health")

# Token del bot principal para verificar su estado
ZEUS_TOKEN = os.environ.get("TELEGRAM_BOT_TOKEN", "")
CHECK_INTERVAL = 120  # Verificar cada 2 minutos
MAX_FAILURES = 3  # Despues de 3 fallos = declarar caida


class HealthMonitor:
    """
    Monitorea la salud de leon_leo_bot.
    Si se cae, Hermes toma el control como backup.
    """

    def __init__(self, bot):
        self.bot = bot  # Instancia del bot Hermes
        self.running = False
        self.thread = None
        self.consecutive_failures = 0
        self.zeus_is_down = False
        self.last_check = 0

    def start(self):
        """Inicia el monitor en background."""
        self.running = True
        self.thread = threading.Thread(target=self._run, daemon=True)
        self.thread.start()
        logger.info("HealthMonitor iniciado — vigilando a Zeus (leon_leo_bot)")

    def stop(self):
        self.running = False

    def _check_zeus(self) -> bool:
        """Hace ping a leon_leo_bot via API de Telegram."""
        try:
            url = f"https://api.telegram.org/bot{ZEUS_TOKEN}/getMe"
            r = requests.get(url, timeout=10)
            if r.status_code == 200:
                data = r.json()
                return data.get("ok", False)
            return False
        except:
            return False

    def _run(self):
        """Loop principal del monitor."""
        # Esperar 60s antes de empezar a chequear
        time.sleep(60)

        while self.running:
            try:
                is_alive = self._check_zeus()
                self.last_check = time.time()

                if is_alive:
                    # Zeus esta bien
                    if self.zeus_is_down:
                        # Estaba caido, ahora volvio!
                        self._zeus_recovered()
                    self.consecutive_failures = 0
                    self.zeus_is_down = False
                else:
                    # Zeus no responde
                    self.consecutive_failures += 1
                    logger.warning(f"Zeus no responde ({self.consecutive_failures}/{MAX_FAILURES})")

                    if self.consecutive_failures >= MAX_FAILURES and not self.zeus_is_down:
                        self._zeus_down()

            except Exception as e:
                logger.error(f"HealthMonitor error: {e}")

            time.sleep(CHECK_INTERVAL)

    def _zeus_down(self):
        """Zeus se ha caido — Hermes toma el control."""
        self.zeus_is_down = True
        logger.critical("ZEUS (leon_leo_bot) CAIDO — Hermes toma el control")

        # Avisar al admin
        try:
            self.bot.send_message(
                ADMIN_CHAT_ID,
                "🚨 *ALERTA: Zeus (leon_leo_bot) no responde!*\n\n"
                "Hermes ha tomado el control como backup.\n"
                "Estoy atendiendo al grupo mientras Zeus se recupera.\n\n"
                "Si necesitas reiniciar Zeus manualmente:\n"
                "`cd ~/c8l-bot-server && python3 whatsapp_bot.py`"
            )
        except:
            pass

        # Avisar al grupo
        try:
            self.bot.send_message(
                GROUP_CHAT_ID,
                "⚡ *Hermes al mando*\n\n"
                "Zeus esta descansando. Yo me encargo de todo.\n"
                "Habladme directamente — estoy aqui para la familia C8L.\n\n"
                "_Hermes entrega. Siempre._"
            )
        except:
            pass

    def _zeus_recovered(self):
        """Zeus ha vuelto — Hermes se retira."""
        self.zeus_is_down = False
        self.consecutive_failures = 0
        logger.info("Zeus ha vuelto — Hermes se retira a segundo plano")

        # Avisar al admin
        try:
            self.bot.send_message(
                ADMIN_CHAT_ID,
                "✅ *Zeus (leon_leo_bot) ha vuelto!*\n\n"
                "Hermes se retira a segundo plano.\n"
                "Todo bajo control."
            )
        except:
            pass

        # Avisar al grupo
        try:
            self.bot.send_message(
                GROUP_CHAT_ID,
                "✅ Zeus ha vuelto. Todo bajo control.\n"
                "_Hermes se retira. Buen trabajo, familia._"
            )
        except:
            pass

    def get_status(self) -> str:
        """Retorna estado actual del monitor."""
        if self.zeus_is_down:
            return "🔴 Zeus CAIDO — Hermes en control"
        elif self.consecutive_failures > 0:
            return f"🟡 Zeus inestable ({self.consecutive_failures} fallos)"
        else:
            return "🟢 Zeus online — Hermes en espera"
