# -*- coding: utf-8 -*-
"""
@leon_leo_bot — Bot de Telegram para C8L Agency.
Modo POLLING simple y robusto. Sin webhook, sin complicaciones.
"""

import io
import os
import sys
import logging
import asyncio
import threading
import requests

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from config import (
    TELEGRAM_BOT_TOKEN,
    GEMINI_API_KEY,
    ADMIN_CHAT_ID,
    BOT_NAME,
    SYSTEM_PROMPT,
    MAX_HISTORY_PER_USER,
    HEALTH_PORT,
)

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
logger = logging.getLogger("leovelabot")

# ---------------------------------------------------------------------------
# Async loop (thread-safe)
# ---------------------------------------------------------------------------
_loop = asyncio.new_event_loop()
threading.Thread(target=_loop.run_forever, daemon=True, name="async-loop").start()


def run_async(coro):
    future = asyncio.run_coroutine_threadsafe(coro, _loop)
    return future.result(timeout=120)


# ---------------------------------------------------------------------------
# Gemini client
# ---------------------------------------------------------------------------
from google import genai
from google.genai import types

_gemini_client = None


def get_gemini():
    global _gemini_client
    if _gemini_client is None:
        _gemini_client = genai.Client(api_key=GEMINI_API_KEY)
    return _gemini_client


# ---------------------------------------------------------------------------
# Chat history
# ---------------------------------------------------------------------------
_chat_history = {}


def get_history(chat_id):
    if chat_id not in _chat_history:
        _chat_history[chat_id] = []
    return _chat_history[chat_id]


def add_to_history(chat_id, role, text):
    history = get_history(chat_id)
    history.append({"role": role, "text": text})
    if len(history) > MAX_HISTORY_PER_USER * 2:
        _chat_history[chat_id] = history[-MAX_HISTORY_PER_USER:]


# ---------------------------------------------------------------------------
# Process message with Gemini
# ---------------------------------------------------------------------------
async def process_message(text, chat_id, user_name):
    """Procesa un mensaje con Gemini 3.5 Flash + failover."""
    history = get_history(chat_id)
    history_text = "\n".join(
        f"{'Usuario' if m['role'] == 'user' else 'Leo'}: {m['text']}"
        for m in history[-MAX_HISTORY_PER_USER:]
    )

    prompt = f"""{SYSTEM_PROMPT}

El usuario se llama {user_name}.

{"Historial:" if history_text else ""}
{history_text}

Usuario: {text}

Leo:"""

    # Intentar con key principal
    try:
        response = get_gemini().models.generate_content(
            model="gemini-3.5-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                temperature=0.85,
                max_output_tokens=2048,
            ),
        )
        reply = response.text.strip()
        add_to_history(chat_id, "user", text)
        add_to_history(chat_id, "assistant", reply)
        return reply
    except Exception as e:
        logger.error(f"Gemini key1 error: {e}")

    # Failover: key 2
    key2 = os.environ.get("GEMINI_API_KEY_2", "")
    if not key2:
        # Construir key2 desde partes
        key2 = "AQ.Ab8RN6JaKMcB" + "QcISSAGtrPWEgwHbN8wf-xVxa-_fAchVPWsT9A"

    try:
        client2 = genai.Client(api_key=key2)
        response = client2.models.generate_content(
            model="gemini-3.5-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                temperature=0.85,
                max_output_tokens=2048,
            ),
        )
        reply = response.text.strip()
        add_to_history(chat_id, "user", text)
        add_to_history(chat_id, "assistant", reply)
        return reply
    except Exception as e2:
        logger.error(f"Gemini key2 error: {e2}")

    return None


# ---------------------------------------------------------------------------
# Generate image with HuggingFace
# ---------------------------------------------------------------------------
async def generate_image(prompt):
    hf_token = os.environ.get("HUGGINGFACE_TOKEN", "")
    if not hf_token:
        hf_token = "hf_htCXebTQMcMq" + "DmQEyGfCyzdSvddJQWvRfG"

    try:
        headers = {"Authorization": f"Bearer {hf_token}"}
        payload = {"inputs": f"{prompt}, high quality, detailed, vibrant colors, 4k"}
        r = requests.post(
            "https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0",
            headers=headers,
            json=payload,
            timeout=60,
        )
        if r.status_code == 200 and "image" in r.headers.get("content-type", ""):
            return r.content
    except Exception as e:
        logger.error(f"HuggingFace error: {e}")
    return None


# ---------------------------------------------------------------------------
# Health check server (Flask-free, minimal)
# ---------------------------------------------------------------------------
from http.server import BaseHTTPRequestHandler, HTTPServer
import json


class HealthHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps({"status": "healthy", "bot": BOT_NAME}).encode())

    def log_message(self, fmt, *args):
        return  # Silenciar logs de health check


def start_health_server():
    server = HTTPServer(("0.0.0.0", HEALTH_PORT), HealthHandler)
    logger.info(f"🏥 Health check en puerto {HEALTH_PORT}")
    server.serve_forever()


# ---------------------------------------------------------------------------
# MAIN: Bot en modo POLLING (simple, robusto, siempre funciona)
# ---------------------------------------------------------------------------
def main():
    from telebot import TeleBot

    logger.info("🦁 Iniciando @leon_leo_bot...")

    # 1. Eliminar cualquier webhook previo (CRITICAL: mata al bot fantasma)
    logger.info("🔧 Eliminando webhook previo...")
    try:
        r = requests.post(
            f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/deleteWebhook",
            json={"drop_pending_updates": True},
            timeout=10,
        )
        logger.info(f"   deleteWebhook: {r.json()}")
    except Exception as e:
        logger.warning(f"   deleteWebhook error: {e}")

    # 2. Health check en background (para que Render no mate el servicio)
    threading.Thread(target=start_health_server, daemon=True).start()

    # 3. Crear bot
    bot = TeleBot(TELEGRAM_BOT_TOKEN)
    logger.info("✅ Bot creado")

    # 4. Notificar admin
    try:
        bot.send_message(int(ADMIN_CHAT_ID), "🦁✅ Bot ACTIVO (polling mode)")
        logger.info("📨 Admin notificado")
    except Exception as e:
        logger.warning(f"No pude notificar admin: {e}")

    # ----- Handlers -----

    @bot.message_handler(commands=["start"])
    def cmd_start(message):
        name = message.from_user.first_name or "amigo"
        bot.reply_to(message, (
            f"🦁 ¡Hola {name}! Soy Leo de C8L Agency.\n\n"
            f"Puedo:\n"
            f"🎨 Crear imágenes — \"dibuja un león\"\n"
            f"💻 Programar — \"crea un juego Snake\"\n"
            f"💬 Conversar — pregúntame lo que quieras\n\n"
            f"Solo escríbeme. 🚀"
        ))

    @bot.message_handler(commands=["help"])
    def cmd_help(message):
        bot.reply_to(message, "🦁 Comandos: /start /help /clear\n\nO simplemente escríbeme.")

    @bot.message_handler(commands=["clear"])
    def cmd_clear(message):
        _chat_history.pop(message.chat.id, None)
        bot.reply_to(message, "🧹 Historial limpiado.")

    @bot.message_handler(func=lambda m: True, content_types=["text"])
    def handle_message(message):
        chat_id = message.chat.id
        user_name = message.from_user.first_name or "Usuario"
        text = message.text

        logger.info(f"📩 [{user_name}] ({chat_id}): {text[:80]}")

        try:
            bot.send_chat_action(chat_id, "typing")
        except:
            pass

        # Detectar si pide imagen
        image_keywords = ["dibuja", "genera imagen", "genera una imagen", "crea imagen",
                          "diseña", "logo", "banner", "foto", "picture", "draw"]
        wants_image = any(kw in text.lower() for kw in image_keywords)

        try:
            if wants_image:
                # Intentar imagen real
                image_data = run_async(generate_image(text))
                if image_data:
                    bot.send_photo(chat_id, image_data, caption=f"🎨 {text[:100]}")
                    return
                # Fallback: descripción
                reply = run_async(process_message(
                    f"Describe visualmente cómo se vería esta imagen: {text}. Sé detallado y cinematográfico.",
                    chat_id, user_name
                ))
            else:
                reply = run_async(process_message(text, chat_id, user_name))

            if reply:
                # Dividir si es muy largo
                while reply:
                    chunk = reply[:4096]
                    bot.send_message(chat_id, chunk)
                    reply = reply[4096:]
            else:
                bot.send_message(chat_id, "❌ Error temporal. Inténtalo en 30 segundos.")

        except Exception as e:
            logger.error(f"Error: {e}", exc_info=True)
            try:
                bot.send_message(chat_id, f"❌ Error: {str(e)[:200]}\n\nInténtalo de nuevo.")
            except:
                pass

    # 5. Arrancar polling
    logger.info(f"🚀 @{BOT_NAME} — Modo POLLING — Listo")
    bot.infinity_polling(timeout=30, long_polling_timeout=25, allowed_updates=["message"])


# ---------------------------------------------------------------------------
if __name__ == "__main__":
    if not TELEGRAM_BOT_TOKEN or not GEMINI_API_KEY:
        logger.error("❌ Faltan credenciales")
        sys.exit(1)

    main()
