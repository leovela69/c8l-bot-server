# -*- coding: utf-8 -*-
"""
👑 AION Cron — Ejecuta el ciclo de monitoreo cada 5 minutos.
Arrancarlo como servicio separado o junto al bot principal.

Uso:
    python aion_cron.py

O en background:
    nohup python aion_cron.py > aion.log 2>&1 &
"""

import asyncio
import time
import logging
import sys
import os
import requests

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from config import TELEGRAM_BOT_TOKEN, ADMIN_CHAT_ID
from bots.aion.coordinator import AION

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
logger = logging.getLogger("c8l.aion_cron")

# Intervalo entre ciclos (5 minutos)
INTERVAL_SECONDS = 300


def notify_telegram(message: str):
    """Envía mensaje al admin por Telegram."""
    if not ADMIN_CHAT_ID:
        return
    try:
        url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
        requests.post(url, json={"chat_id": ADMIN_CHAT_ID, "text": message}, timeout=10)
    except:
        pass


async def run_cycle(aion: AION):
    """Ejecuta un ciclo de AION."""
    try:
        result = await aion.run()
        logger.info(f"👑 Ciclo completado: {result.get('message', 'OK')}")

        # Solo notificar si hay problemas
        summary = result.get("data", {})
        if summary.get("errors", 0) > 0 or summary.get("warnings", 0) > 2:
            telegram_msg = aion.get_telegram_report()
            notify_telegram(telegram_msg)

    except Exception as e:
        logger.error(f"❌ Error en ciclo AION: {e}", exc_info=True)
        notify_telegram(f"❌ AION error: {str(e)[:200]}")


def main():
    logger.info("👑 AION Cron iniciado — ciclo cada 5 minutos")
    notify_telegram("👑 AION activado — monitoreando C8L Agency 24/7")

    aion = AION()

    while True:
        asyncio.run(run_cycle(aion))
        logger.info(f"💤 Siguiente ciclo en {INTERVAL_SECONDS}s...")
        time.sleep(INTERVAL_SECONDS)


if __name__ == "__main__":
    main()
