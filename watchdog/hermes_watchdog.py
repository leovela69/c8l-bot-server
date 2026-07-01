# -*- coding: utf-8 -*-
"""
⚡ HERMES WATCHDOG — Bot secundario que mantiene vivo al principal
===================================================================
Hermes es un bot de Telegram independiente que:
- Corre en un worker separado (Render Background Worker o segundo servicio)
- Hace ping al bot principal cada 5 minutos
- Si el bot principal no responde 3 veces → lo reinicia via Render API
- Notifica al admin de cualquier incidencia
- Puede ejecutar comandos de emergencia

Hermes es ULTRA-LIGERO: no usa LLM, no tiene NLP, solo monitorea.
Consumo: ~20MB RAM, 0 tokens IA.

Para activar Hermes necesitas:
1. Crear un segundo bot en @BotFather (hermes_c8l_bot)
2. Poner HERMES_BOT_TOKEN en env vars
3. Correr: python watchdog/hermes_watchdog.py

Autor: C8L Agency / Leo
"""

import os
import sys
import time
import logging
import asyncio
from typing import Optional

logger = logging.getLogger("c8l.watchdog.hermes")
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [HERMES] %(levelname)s: %(message)s",
)


class HermesWatchdog:
    """
    ⚡ Bot secundario ultra-ligero que vigila al principal.

    Solo responde a comandos del admin y monitorea la salud del bot principal.
    """

    def __init__(self):
        self.token = os.environ.get("HERMES_BOT_TOKEN", "")
        self.admin_id = os.environ.get("ADMIN_CHAT_ID", "")
        self.health_url = os.environ.get(
            "BOT_HEALTH_URL", "https://c8l-bot-server-1.onrender.com/health"
        )
        self.render_api_key = os.environ.get("RENDER_API_KEY", "")
        self.render_service_id = os.environ.get("RENDER_SERVICE_ID", "")
        self.check_interval = int(os.environ.get("HERMES_CHECK_INTERVAL", "300"))
        self.max_failures = 3

        self._consecutive_failures = 0
        self._total_checks = 0
        self._total_restarts = 0
        self._start_time = time.time()

    async def ping_main_bot(self) -> bool:
        """Hace ping al bot principal. Retorna True si está vivo."""
        import httpx

        try:
            async with httpx.AsyncClient(timeout=15) as client:
                resp = await client.get(self.health_url)
                if resp.status_code == 200:
                    return True
                return False
        except Exception:
            return False

    async def restart_main_bot(self) -> bool:
        """Reinicia el bot principal via Render API."""
        import httpx

        if not self.render_api_key or not self.render_service_id:
            logger.error("No hay Render API key/service ID")
            return False

        try:
            url = f"https://api.render.com/v1/services/{self.render_service_id}/restart"
            headers = {
                "Authorization": f"Bearer {self.render_api_key}",
                "Accept": "application/json",
            }
            async with httpx.AsyncClient(timeout=30) as client:
                resp = await client.post(url, headers=headers)
                if resp.status_code < 400:
                    self._total_restarts += 1
                    return True
                return False
        except Exception as e:
            logger.error(f"Error reiniciando: {e}")
            return False

    async def monitor_loop(self, bot=None):
        """Loop principal de monitoreo."""
        logger.info(f"👁️ Hermes Watchdog activo — ping cada {self.check_interval}s")

        while True:
            try:
                self._total_checks += 1
                alive = await self.ping_main_bot()

                if alive:
                    self._consecutive_failures = 0
                    logger.debug("✅ Bot principal alive")
                else:
                    self._consecutive_failures += 1
                    logger.warning(
                        f"❌ Bot no responde ({self._consecutive_failures}/{self.max_failures})"
                    )

                    if self._consecutive_failures >= self.max_failures:
                        logger.error("🚨 Bot caído! Reiniciando...")

                        # Alertar admin
                        if bot and self.admin_id:
                            try:
                                await bot.send_message(
                                    chat_id=self.admin_id,
                                    text=(
                                        "🚨 *HERMES ALERTA*\n\n"
                                        "❌ Bot principal NO responde\n"
                                        f"📊 {self._consecutive_failures} fallos consecutivos\n"
                                        "🔄 Ejecutando auto-restart..."
                                    ),
                                    parse_mode="Markdown",
                                )
                            except Exception:
                                pass

                        # Reiniciar
                        restarted = await self.restart_main_bot()

                        if restarted and bot and self.admin_id:
                            try:
                                await bot.send_message(
                                    chat_id=self.admin_id,
                                    text="✅ *Restart ejecutado.* Bot vuelve en ~30s.",
                                    parse_mode="Markdown",
                                )
                            except Exception:
                                pass

                        self._consecutive_failures = 0
                        await asyncio.sleep(60)  # Esperar 60s después de restart

                await asyncio.sleep(self.check_interval)

            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error en monitor loop: {e}")
                await asyncio.sleep(60)

    def get_stats_text(self) -> str:
        uptime = (time.time() - self._start_time) / 3600
        status = "🟢 VIGILANDO" if self._consecutive_failures == 0 else "🔴 ALERTA"
        return (
            f"🛡️ *Hermes Watchdog*\n\n"
            f"{status}\n"
            f"⏱️ Activo: {uptime:.1f}h\n"
            f"📊 Checks: {self._total_checks}\n"
            f"🔄 Restarts: {self._total_restarts}\n"
            f"🔴 Fallos: {self._consecutive_failures}/{self.max_failures}\n"
            f"⏰ Intervalo: {self.check_interval}s"
        )


def main():
    """Punto de entrada para Hermes como bot independiente."""
    try:
        from telegram import Update
        from telegram.ext import Application, CommandHandler, ContextTypes
    except ImportError:
        logger.error("pip install python-telegram-bot")
        sys.exit(1)

    token = os.environ.get("HERMES_BOT_TOKEN", "")
    admin_id = os.environ.get("ADMIN_CHAT_ID", "")

    if not token:
        logger.error("❌ HERMES_BOT_TOKEN no configurado")
        sys.exit(1)

    watchdog = HermesWatchdog()

    # --- Handlers ---
    async def cmd_status(update: Update, context: ContextTypes.DEFAULT_TYPE):
        if str(update.effective_user.id) != admin_id:
            return
        # Ping al bot principal
        alive = await watchdog.ping_main_bot()
        bot_status = "🟢 ONLINE" if alive else "🔴 OFFLINE"
        text = (
            f"{watchdog.get_stats_text()}\n\n"
            f"📡 Bot principal: {bot_status}"
        )
        await update.message.reply_text(text, parse_mode="Markdown")

    async def cmd_restart(update: Update, context: ContextTypes.DEFAULT_TYPE):
        if str(update.effective_user.id) != admin_id:
            return
        await update.message.reply_text("🔄 Reiniciando bot principal...")
        success = await watchdog.restart_main_bot()
        if success:
            await update.message.reply_text("✅ Restart enviado. Espera ~30s.")
        else:
            await update.message.reply_text("❌ No se pudo reiniciar. Revisa Render.")

    async def cmd_ping(update: Update, context: ContextTypes.DEFAULT_TYPE):
        if str(update.effective_user.id) != admin_id:
            return
        alive = await watchdog.ping_main_bot()
        if alive:
            await update.message.reply_text("🟢 Bot principal ALIVE")
        else:
            await update.message.reply_text("🔴 Bot principal NO responde")

    # --- Setup ---
    app = Application.builder().token(token).build()
    app.add_handler(CommandHandler("status", cmd_status))
    app.add_handler(CommandHandler("restart", cmd_restart))
    app.add_handler(CommandHandler("ping", cmd_ping))

    logger.info("🛡️ HERMES WATCHDOG ONLINE")
    logger.info(f"   Admin: {admin_id}")
    logger.info(f"   Health URL: {watchdog.health_url}")
    logger.info(f"   Check interval: {watchdog.check_interval}s")

    # Correr monitor + bot en paralelo
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)

    async def start_all():
        await app.initialize()
        await app.start()
        await app.updater.start_polling(drop_pending_updates=True)

        # Notificar inicio
        if admin_id:
            try:
                await app.bot.send_message(
                    chat_id=admin_id,
                    text="🛡️ *Hermes Watchdog ONLINE*\nVigilando al bot principal...",
                    parse_mode="Markdown",
                )
            except Exception:
                pass

        # Iniciar monitor
        await watchdog.monitor_loop(bot=app.bot)

    try:
        loop.run_until_complete(start_all())
    except (KeyboardInterrupt, SystemExit):
        logger.info("🛡️ Hermes apagado")


if __name__ == "__main__":
    main()
