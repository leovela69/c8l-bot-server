# -*- coding: utf-8 -*-
"""
📰 PERIODISTA — Scheduler automático
Se ejecuta cada X horas y publica noticias en el grupo de Telegram.
"""

import asyncio
import aiohttp
import os
import random
from datetime import datetime
from typing import Optional

from periodista.config import (
    PUBLISH_INTERVAL_HOURS, MAX_NEWS_PER_FLASH,
    ACTIVE_HOURS_START, ACTIVE_HOURS_END,
)
from periodista.news_fetcher import fetch_top_news
from periodista.news_analyzer import analyze_news_with_ai, extract_learnings
from periodista.news_formatter import format_news_flash, format_question_post
from periodista.news_memory import store_learnings, get_recent_knowledge


# ---------------------------------------------------------------------------
# TELEGRAM SEND
# ---------------------------------------------------------------------------

async def send_telegram_message(text: str, chat_id: str = "") -> bool:
    """Envía mensaje al grupo de Telegram."""
    bot_token = os.environ.get("TELEGRAM_BOT_TOKEN", "")
    if not chat_id:
        chat_id = os.environ.get("GROUP_CHAT_ID", "")

    if not bot_token or not chat_id:
        print("[PERIODISTA] No hay TELEGRAM_BOT_TOKEN o GROUP_CHAT_ID configurado")
        return False

    url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
    payload = {
        "chat_id": chat_id,
        "text": text,
        "parse_mode": "HTML",
        "disable_web_page_preview": True,
    }

    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(url, json=payload, timeout=aiohttp.ClientTimeout(total=15)) as resp:
                if resp.status == 200:
                    print(f"[PERIODISTA] Flash enviado al grupo {chat_id}")
                    return True
                else:
                    error = await resp.text()
                    print(f"[PERIODISTA] Error enviando: {resp.status} — {error[:200]}")
                    return False
    except Exception as e:
        print(f"[PERIODISTA] Error de conexión: {e}")
        return False


# ---------------------------------------------------------------------------
# CICLO DE NOTICIAS
# ---------------------------------------------------------------------------

async def run_news_cycle():
    """
    Un ciclo completo:
    1. Buscar noticias
    2. Analizar con IA
    3. Guardar en memoria (aprendizaje)
    4. Formatear y publicar en Telegram
    """
    print(f"[PERIODISTA] Iniciando ciclo de noticias — {datetime.utcnow().isoformat()}")

    # 1. Buscar noticias reales
    articles = await fetch_top_news(max_total=MAX_NEWS_PER_FLASH)

    if not articles:
        print("[PERIODISTA] No se encontraron noticias en este ciclo")
        return

    print(f"[PERIODISTA] {len(articles)} noticias encontradas")

    # 2. Analizar con IA (resúmenes, importancia, patrones)
    analysis = await analyze_news_with_ai(articles)

    # 3. Extraer aprendizajes y guardar en memoria
    learnings = extract_learnings(analysis)
    store_learnings(analysis, learnings)
    print(f"[PERIODISTA] Conocimiento guardado — {len(learnings.get('facts', []))} hechos aprendidos")

    # 4. Formatear flash informativo
    flash_message = format_news_flash(analysis)

    if flash_message:
        # 5. Enviar al grupo
        success = await send_telegram_message(flash_message)
        if success:
            print("[PERIODISTA] Flash publicado exitosamente")
        else:
            print("[PERIODISTA] Fallo al publicar flash")

    # 6. De vez en cuando (20% de probabilidad), enviar pregunta de engagement
    if random.random() < 0.2:
        await asyncio.sleep(60)  # Esperar 1 minuto
        question = format_question_post()
        await send_telegram_message(question)
        print("[PERIODISTA] Pregunta de engagement enviada")


# ---------------------------------------------------------------------------
# SCHEDULER LOOP
# ---------------------------------------------------------------------------

async def periodista_loop():
    """
    Loop principal del periodista.
    Se ejecuta cada PUBLISH_INTERVAL_HOURS horas.
    Solo publica en horario activo (8:00-23:00).
    """
    print(f"[PERIODISTA] 📰 Activado — Publicará cada {PUBLISH_INTERVAL_HOURS}h")
    print(f"[PERIODISTA] Horario activo: {ACTIVE_HOURS_START}:00 - {ACTIVE_HOURS_END}:00 UTC")

    # Esperar 2 minutos al arrancar (dar tiempo al bot principal)
    await asyncio.sleep(120)

    # Primer ciclo inmediato
    hour = datetime.utcnow().hour
    if ACTIVE_HOURS_START <= hour <= ACTIVE_HOURS_END:
        try:
            await run_news_cycle()
        except Exception as e:
            print(f"[PERIODISTA] Error en primer ciclo: {e}")

    # Loop infinito
    while True:
        # Esperar intervalo
        wait_seconds = PUBLISH_INTERVAL_HOURS * 3600
        # Añadir variación aleatoria (±30 min) para que no sea predecible
        variation = random.randint(-1800, 1800)
        actual_wait = max(3600, wait_seconds + variation)  # Mínimo 1h

        await asyncio.sleep(actual_wait)

        # Verificar horario activo
        hour = datetime.utcnow().hour
        if not (ACTIVE_HOURS_START <= hour <= ACTIVE_HOURS_END):
            print(f"[PERIODISTA] Fuera de horario activo ({hour}:00). Esperando...")
            continue

        # Ejecutar ciclo
        try:
            await run_news_cycle()
        except Exception as e:
            print(f"[PERIODISTA] Error en ciclo: {e}")
            # No crashear, seguir en el siguiente ciclo


# ---------------------------------------------------------------------------
# FUNCIÓN PARA INTEGRAR CON EL BOT
# ---------------------------------------------------------------------------

def start_periodista(loop: Optional[asyncio.AbstractEventLoop] = None):
    """
    Arranca el periodista como tarea asyncio.
    Llamar desde whatsapp_bot.py al iniciar el bot.
    """
    if loop is None:
        loop = asyncio.get_event_loop()

    loop.create_task(periodista_loop())
    print("[PERIODISTA] 📰 Tarea del periodista creada")
