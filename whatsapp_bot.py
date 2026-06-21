# -*- coding: utf-8 -*-
"""
@leon_leo_bot — Bot de Telegram para C8L Agency.
Proveedores: DeepSeek V4 Pro (NVIDIA) → Gemini 3.5 Flash → Gemini Key2
Imágenes: HuggingFace SDXL
"""

import io
import os
import sys
import logging
import asyncio
import threading
import requests
import json
from http.server import BaseHTTPRequestHandler, HTTPServer

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from config import (
    TELEGRAM_BOT_TOKEN,
    ADMIN_CHAT_ID,
    BOT_NAME,
    SYSTEM_PROMPT,
    MAX_HISTORY_PER_USER,
    PORT,
    NVIDIA_API_KEY,
    NVIDIA_BASE_URL,
    NVIDIA_MODEL,
    GEMINI_API_KEY,
    GEMINI_API_KEY_2,
    GEMINI_MODEL,
    HUGGINGFACE_TOKEN,
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
# Async loop
# ---------------------------------------------------------------------------
_loop = asyncio.new_event_loop()
threading.Thread(target=_loop.run_forever, daemon=True, name="async-loop").start()


def run_async(coro):
    future = asyncio.run_coroutine_threadsafe(coro, _loop)
    return future.result(timeout=120)


# ---------------------------------------------------------------------------
# Telegram API
# ---------------------------------------------------------------------------
TG_API = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}"


def tg_send(chat_id, text):
    """Envía texto. Si es largo, divide en chunks."""
    while text:
        chunk = text[:4096]
        requests.post(f"{TG_API}/sendMessage", json={"chat_id": chat_id, "text": chunk}, timeout=10)
        text = text[4096:]


def tg_send_photo(chat_id, photo_bytes, caption=""):
    files = {"photo": ("image.png", io.BytesIO(photo_bytes), "image/png")}
    data = {"chat_id": chat_id, "caption": caption[:1024]}
    requests.post(f"{TG_API}/sendPhoto", data=data, files=files, timeout=30)


def tg_send_document(chat_id, doc_bytes, filename, caption=""):
    files = {"document": (filename, io.BytesIO(doc_bytes), "application/octet-stream")}
    data = {"chat_id": chat_id, "caption": caption[:1024]}
    requests.post(f"{TG_API}/sendDocument", data=data, files=files, timeout=30)


def tg_typing(chat_id):
    requests.post(f"{TG_API}/sendChatAction", json={"chat_id": chat_id, "action": "typing"}, timeout=5)


# ---------------------------------------------------------------------------
# Chat history
# ---------------------------------------------------------------------------
_history = {}


def get_history(chat_id):
    return _history.setdefault(chat_id, [])


def add_history(chat_id, role, text):
    h = get_history(chat_id)
    h.append({"role": role, "text": text})
    if len(h) > MAX_HISTORY_PER_USER * 2:
        _history[chat_id] = h[-MAX_HISTORY_PER_USER:]


# ---------------------------------------------------------------------------
# AI Providers — Cadena de failover
# ---------------------------------------------------------------------------

def call_nvidia(prompt, system_prompt=""):
    """DeepSeek V4 Pro via NVIDIA — modelo principal."""
    headers = {
        "Authorization": f"Bearer {NVIDIA_API_KEY}",
        "Content-Type": "application/json",
    }
    messages = []
    if system_prompt:
        messages.append({"role": "system", "content": system_prompt})
    messages.append({"role": "user", "content": prompt})

    payload = {
        "model": NVIDIA_MODEL,
        "messages": messages,
        "temperature": 0.85,
        "top_p": 0.95,
        "max_tokens": 2048,
        "extra_body": {"chat_template_kwargs": {"thinking": False}},
        "stream": False,
    }

    r = requests.post(
        f"{NVIDIA_BASE_URL}/chat/completions",
        headers=headers,
        json=payload,
        timeout=60,
    )
    r.raise_for_status()
    data = r.json()
    return data["choices"][0]["message"]["content"].strip()


def call_gemini(prompt, system_prompt="", api_key=None):
    """Gemini 3.5 Flash — backup."""
    from google import genai
    from google.genai import types

    key = api_key or GEMINI_API_KEY
    client = genai.Client(api_key=key)

    full_prompt = f"{system_prompt}\n\n{prompt}" if system_prompt else prompt

    response = client.models.generate_content(
        model=GEMINI_MODEL,
        contents=full_prompt,
        config=types.GenerateContentConfig(
            temperature=0.85,
            max_output_tokens=2048,
        ),
    )
    return response.text.strip()


async def generate_text(prompt, system_prompt=""):
    """
    Cadena de failover:
    DeepSeek V4 Pro (NVIDIA) → Gemini Key1 → Gemini Key2
    """
    # 1. DeepSeek V4 Pro (principal)
    try:
        result = call_nvidia(prompt, system_prompt)
        logger.info("✅ Respuesta de DeepSeek V4 Pro")
        return result
    except Exception as e:
        logger.warning(f"⚠️ NVIDIA/DeepSeek falló: {str(e)[:100]}")

    # 2. Gemini Key 1
    try:
        result = call_gemini(prompt, system_prompt, GEMINI_API_KEY)
        logger.info("✅ Respuesta de Gemini (key1)")
        return result
    except Exception as e:
        logger.warning(f"⚠️ Gemini key1 falló: {str(e)[:100]}")

    # 3. Gemini Key 2
    try:
        result = call_gemini(prompt, system_prompt, GEMINI_API_KEY_2)
        logger.info("✅ Respuesta de Gemini (key2)")
        return result
    except Exception as e:
        logger.error(f"❌ Gemini key2 falló: {str(e)[:100]}")

    return None


# ---------------------------------------------------------------------------
# Process message
# ---------------------------------------------------------------------------
async def process_message(text, chat_id, user_name):
    history = get_history(chat_id)
    history_text = "\n".join(
        f"{'Usuario' if m['role'] == 'user' else 'Leo'}: {m['text']}"
        for m in history[-MAX_HISTORY_PER_USER:]
    )

    prompt = f"""El usuario se llama {user_name}.

{"Historial:" if history_text else ""}
{history_text}

Usuario: {text}

Leo:"""

    reply = await generate_text(prompt, SYSTEM_PROMPT)

    if reply:
        add_history(chat_id, "user", text)
        add_history(chat_id, "assistant", reply)

    return reply


# ---------------------------------------------------------------------------
# Generate image (HuggingFace SDXL)
# ---------------------------------------------------------------------------
async def generate_image(prompt):
    try:
        headers = {"Authorization": f"Bearer {HUGGINGFACE_TOKEN}"}
        payload = {"inputs": f"{prompt}, high quality, detailed, vibrant colors, 4k, cyberpunk"}
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
# Health check
# ---------------------------------------------------------------------------
class HealthHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps({"status": "healthy", "bot": BOT_NAME}).encode())

    def log_message(self, fmt, *args):
        return


def start_health():
    HTTPServer(("0.0.0.0", PORT), HealthHandler).serve_forever()


# ---------------------------------------------------------------------------
# MAIN
# ---------------------------------------------------------------------------
def main():
    from telebot import TeleBot

    logger.info("🦁 Iniciando @leon_leo_bot...")
    logger.info(f"   Proveedores: DeepSeek V4 Pro → Gemini 3.5 Flash")
    logger.info(f"   Imágenes: HuggingFace SDXL")

    # Eliminar webhook (mata al bot fantasma)
    try:
        r = requests.post(
            f"{TG_API}/deleteWebhook",
            json={"drop_pending_updates": True},
            timeout=10,
        )
        logger.info(f"🔧 deleteWebhook: {r.json().get('description', 'ok')}")
    except Exception as e:
        logger.warning(f"deleteWebhook error: {e}")

    # Health check en background
    threading.Thread(target=start_health, daemon=True).start()

    # Crear bot
    bot = TeleBot(TELEGRAM_BOT_TOKEN)

    # Notificar admin
    try:
        bot.send_message(
            int(ADMIN_CHAT_ID),
            "🦁✅ Bot ACTIVO\n\n🧠 DeepSeek V4 Pro (principal)\n💎 Gemini 3.5 Flash (backup)\n🎨 HuggingFace SDXL (imágenes)"
        )
    except Exception as e:
        logger.warning(f"Admin notify error: {e}")

    # --- Handlers ---

    @bot.message_handler(commands=["start"])
    def cmd_start(msg):
        name = msg.from_user.first_name or "amigo"
        bot.reply_to(msg, (
            f"🦁 ¡Hola {name}! Soy Leo de C8L Agency.\n\n"
            "Puedo:\n"
            "🎨 Crear imágenes — \"dibuja un león\"\n"
            "💻 Programar — \"crea un juego Snake\"\n"
            "💬 Conversar — pregúntame lo que quieras\n\n"
            "Solo escríbeme. 🚀"
        ))

    @bot.message_handler(commands=["help"])
    def cmd_help(msg):
        bot.reply_to(msg, "🦁 /start /help /clear /status\n\nO simplemente escríbeme.")

    @bot.message_handler(commands=["clear"])
    def cmd_clear(msg):
        _history.pop(msg.chat.id, None)
        bot.reply_to(msg, "🧹 Historial limpiado.")

    @bot.message_handler(commands=["status"])
    def cmd_status(msg):
        bot.reply_to(msg, (
            "🔧 *Estado del bot:*\n\n"
            "🧠 Principal: DeepSeek V4 Pro (NVIDIA)\n"
            "💎 Backup: Gemini 3.5 Flash\n"
            "🎨 Imágenes: HuggingFace SDXL\n"
            f"📊 Historial: {len(_history)} usuarios activos"
        ), parse_mode="Markdown")

    @bot.message_handler(func=lambda m: True, content_types=["text"])
    def handle_msg(msg):
        chat_id = msg.chat.id
        user_name = msg.from_user.first_name or "Usuario"
        text = msg.text

        logger.info(f"📩 [{user_name}] ({chat_id}): {text[:80]}")
        tg_typing(chat_id)

        # Detectar imagen
        img_kw = ["dibuja", "genera imagen", "genera una imagen", "crea imagen",
                   "diseña", "logo", "banner", "foto", "picture", "draw", "imagen de"]
        wants_image = any(kw in text.lower() for kw in img_kw)

        try:
            if wants_image:
                image_data = run_async(generate_image(text))
                if image_data:
                    tg_send_photo(chat_id, image_data, caption=f"🎨 {text[:100]}")
                    return
                # Fallback: descripción
                reply = run_async(process_message(
                    f"Describe visualmente cómo se vería esta imagen: {text}. Sé detallado.",
                    chat_id, user_name
                ))
            else:
                reply = run_async(process_message(text, chat_id, user_name))

            if reply:
                tg_send(chat_id, reply)
            else:
                tg_send(chat_id, "❌ Todos los modelos fallaron. Inténtalo en 30 segundos.")

        except Exception as e:
            logger.error(f"Error: {e}", exc_info=True)
            tg_send(chat_id, f"❌ Error: {str(e)[:200]}")

    # Arrancar polling
    logger.info(f"🚀 @{BOT_NAME} — POLLING — Listo")
    bot.infinity_polling(timeout=30, long_polling_timeout=25, allowed_updates=["message"])


if __name__ == "__main__":
    main()
