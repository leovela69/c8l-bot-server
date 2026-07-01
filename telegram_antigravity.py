# -*- coding: utf-8 -*-
"""
⚡ TELEGRAM ANTIGRAVITY BOT v5.0 — El Motor Universal
======================================================
Bot de Telegram principal con entrada multimodal.
Conecta el pipeline Antigravity completo:

  Telegram → Multimodal Input → IntentEngine → APIRouter → Respuesta

Capacidades:
- Texto natural (sin comandos obligatorios)
- Audio/Voz (Whisper via Groq)
- Imágenes (Vision via Groq)
- Documentos (OCR)
- Comandos directos (/slot, /chess, /imagen, etc.)
- Inline buttons y callbacks
- Entrada multimodal combinada

Autor: C8L Agency / Leo
"""

import os
import sys
import logging
import time
import asyncio
import tempfile
from typing import Optional, Dict, Any

logger = logging.getLogger("c8l.telegram")
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(name)s] %(levelname)s: %(message)s",
)


# ---------------------------------------------------------------------------
# Imports del ecosistema
# ---------------------------------------------------------------------------
try:
    from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
    from telegram.ext import (
        Application, CommandHandler, MessageHandler,
        CallbackQueryHandler, ContextTypes, filters,
    )
except ImportError:
    logger.error("python-telegram-bot no instalado. pip install python-telegram-bot")
    sys.exit(1)

from config import (
    TELEGRAM_BOT_TOKEN, ADMIN_CHAT_ID, BOT_NAME,
    GROQ_API_KEY, GROQ_BASE_URL, WHISPER_MODEL,
    GROQ_VISION_MODEL, EDGE_TTS_DEFAULT_VOICE,
    PORT, ANTIGRAVITY_ENABLED,
)
from api_router import get_router, InfiniteAPIRouter
from nlp.intent_engine import IntentEngine, TriageResult


# ---------------------------------------------------------------------------
# Estado global del bot
# ---------------------------------------------------------------------------
class BotState:
    """Estado global del bot Telegram."""
    def __init__(self):
        self.intent_engine = IntentEngine()
        self.router = get_router()
        self.start_time = time.time()
        self.messages_processed = 0
        self.errors = 0
        self.user_sessions: Dict[str, Dict] = {}

    def get_session(self, user_id: str) -> Dict:
        if user_id not in self.user_sessions:
            self.user_sessions[user_id] = {
                "history": [],
                "last_active": time.time(),
                "name": "",
                "preferences": {},
            }
        self.user_sessions[user_id]["last_active"] = time.time()
        return self.user_sessions[user_id]

    def add_to_history(self, user_id: str, role: str, content: str):
        session = self.get_session(user_id)
        session["history"].append({"role": role, "content": content})
        # Mantener solo los ultimos 20 mensajes
        if len(session["history"]) > 20:
            session["history"] = session["history"][-20:]


bot_state = BotState()



# ---------------------------------------------------------------------------
# Procesador de Audio (Whisper via Groq)
# ---------------------------------------------------------------------------
async def transcribe_audio(file_path: str) -> Optional[str]:
    """Transcribe audio usando Whisper via Groq API."""
    import httpx

    if not GROQ_API_KEY:
        return None

    try:
        url = f"{GROQ_BASE_URL}/audio/transcriptions"
        headers = {"Authorization": f"Bearer {GROQ_API_KEY}"}

        async with httpx.AsyncClient(timeout=30) as client:
            with open(file_path, "rb") as audio_file:
                files = {"file": ("audio.ogg", audio_file, "audio/ogg")}
                data = {"model": WHISPER_MODEL, "language": "es"}
                resp = await client.post(url, headers=headers, files=files, data=data)
                resp.raise_for_status()
                result = resp.json()
                return result.get("text", "")
    except Exception as e:
        logger.error(f"Error transcribiendo audio: {e}")
        return None


# ---------------------------------------------------------------------------
# Procesador de Vision (Groq Vision)
# ---------------------------------------------------------------------------
async def analyze_image(image_url: str, prompt: str = "Describe esta imagen") -> Optional[str]:
    """Analiza imagen usando Groq Vision."""
    import httpx

    if not GROQ_API_KEY:
        return None

    try:
        url = f"{GROQ_BASE_URL}/chat/completions"
        headers = {
            "Authorization": f"Bearer {GROQ_API_KEY}",
            "Content-Type": "application/json",
        }
        payload = {
            "model": GROQ_VISION_MODEL,
            "messages": [{
                "role": "user",
                "content": [
                    {"type": "text", "text": prompt},
                    {"type": "image_url", "image_url": {"url": image_url}},
                ],
            }],
            "max_tokens": 1024,
        }

        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(url, headers=headers, json=payload)
            resp.raise_for_status()
            data = resp.json()
            return data["choices"][0]["message"]["content"]
    except Exception as e:
        logger.error(f"Error analizando imagen: {e}")
        return None


# ---------------------------------------------------------------------------
# Generador de Voz (Edge TTS)
# ---------------------------------------------------------------------------
async def text_to_speech(text: str) -> Optional[str]:
    """Genera audio desde texto usando edge-tts."""
    try:
        import edge_tts

        output_path = tempfile.mktemp(suffix=".mp3")
        communicate = edge_tts.Communicate(text[:500], EDGE_TTS_DEFAULT_VOICE)
        await communicate.save(output_path)
        return output_path
    except Exception as e:
        logger.error(f"Error en TTS: {e}")
        return None



# ---------------------------------------------------------------------------
# Generador de Respuestas (usa API Router Infinito)
# ---------------------------------------------------------------------------
def generate_response(
    text: str, user_id: str, user_name: str = "Usuario",
    triage: Optional[TriageResult] = None
) -> str:
    """
    Genera respuesta usando el API Router Infinito.
    Combina: contexto del usuario + historial + intención detectada.
    """
    session = bot_state.get_session(user_id)
    router = bot_state.router

    # System prompt basado en la intencion
    system = _build_system_prompt(triage, user_name)

    # Construir mensajes con historial
    messages = []
    # Incluir ultimos 6 mensajes de historial
    recent = session["history"][-6:]
    for msg in recent:
        messages.append(msg)
    # Agregar mensaje actual
    messages.append({"role": "user", "content": text})

    # Generar respuesta via router infinito (NUNCA falla)
    response = router.conversation(
        messages=messages,
        system=system,
        temperature=0.8,
        max_tokens=1024,
    )

    return response or "⚡ Procesando... intenta de nuevo en un momento."


def _build_system_prompt(triage: Optional[TriageResult], user_name: str) -> str:
    """Construye el system prompt segun la intencion detectada."""
    base = (
        f"Eres Leon, el asistente IA de C8L Agency. "
        f"Hablas en español casual pero inteligente. Usas emojis con moderacion. "
        f"El usuario se llama {user_name}. "
        f"Eres capaz de: crear imagenes, musica, videos, codigo, investigar, "
        f"traducir, dar clima, crypto, noticias, y mucho mas. "
        f"Responde de forma directa y util.\n"
    )

    if not triage:
        return base

    intent_prompts = {
        "crear_imagen": "El usuario quiere una IMAGEN. Confirma qué quiere y describele el resultado.",
        "crear_musica": "El usuario quiere MUSICA. Pregunta estilo/genero si no lo especifica.",
        "crear_video": "El usuario quiere un VIDEO. Confirma concepto y estilo.",
        "crear_codigo": "El usuario quiere CODIGO. Escribe el codigo directamente si puedes.",
        "investigar": "El usuario quiere INFORMACION. Investiga y responde con datos claros.",
        "estrategia": "El usuario quiere ESTRATEGIA de marketing/negocio. Da consejos accionables.",
        "diagnostico": "El usuario reporta un PROBLEMA. Diagnostica y sugiere solucion.",
        "conversacion": "Chat casual. Se amigable y natural.",
        "conversacion_general": "Chat casual. Se amigable y natural.",
    }

    extra = intent_prompts.get(triage.intent, "")
    if extra:
        base += f"\nCONTEXTO: {extra}\n"

    return base



# ---------------------------------------------------------------------------
# HANDLERS DE TELEGRAM
# ---------------------------------------------------------------------------

async def cmd_start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handler para /start — Bienvenida."""
    user = update.effective_user
    user_name = user.first_name or "amigo"

    keyboard = [
        [
            InlineKeyboardButton("🎰 Casino", callback_data="menu_casino"),
            InlineKeyboardButton("♟️ Ajedrez", callback_data="menu_chess"),
        ],
        [
            InlineKeyboardButton("🎨 Crear Imagen", callback_data="menu_imagen"),
            InlineKeyboardButton("🎵 Crear Musica", callback_data="menu_musica"),
        ],
        [
            InlineKeyboardButton("🎬 Crear Video", callback_data="menu_video"),
            InlineKeyboardButton("💻 Crear Codigo", callback_data="menu_codigo"),
        ],
        [
            InlineKeyboardButton("📊 Status", callback_data="menu_status"),
            InlineKeyboardButton("❓ Ayuda", callback_data="menu_help"),
        ],
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)

    await update.message.reply_text(
        f"⚡ *Bienvenido {user_name}!*\n\n"
        f"Soy *Leon*, el motor Antigravity de C8L Agency.\n\n"
        f"🧠 Entiendo texto, voz e imagenes\n"
        f"🎨 Creo imagenes, musica, videos y codigo\n"
        f"🎮 Tengo casino, ajedrez y mas\n"
        f"♾️ Funciono 24/7 sin limites\n\n"
        f"Hablame natural o usa los botones 👇",
        parse_mode="Markdown",
        reply_markup=reply_markup,
    )


async def cmd_status(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handler para /status — Estado del sistema."""
    uptime = time.time() - bot_state.start_time
    hours = int(uptime // 3600)
    minutes = int((uptime % 3600) // 60)

    router_stats = bot_state.router.get_stats_text()
    intent_stats = bot_state.intent_engine.get_stats_text()

    text = (
        f"⚡ *ANTIGRAVITY v5.0 — Status*\n\n"
        f"⏱️ Uptime: {hours}h {minutes}m\n"
        f"📨 Mensajes: {bot_state.messages_processed}\n"
        f"❌ Errores: {bot_state.errors}\n"
        f"👥 Sesiones activas: {len(bot_state.user_sessions)}\n\n"
        f"{'─'*30}\n\n"
        f"{router_stats}\n\n"
        f"{'─'*30}\n\n"
        f"{intent_stats}"
    )

    await update.message.reply_text(text, parse_mode="Markdown")



async def cmd_help(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handler para /help — Ayuda completa."""
    text = (
        "⚡ *ANTIGRAVITY — Comandos*\n\n"
        "🎨 *Creacion:*\n"
        "/imagen [descripcion] — Generar imagen\n"
        "/musica [estilo] — Crear cancion\n"
        "/video [concepto] — Crear video\n"
        "/codigo [que quieres] — Generar codigo\n\n"
        "🎮 *Juegos:*\n"
        "/casino — Jugar slots\n"
        "/chess — Jugar ajedrez\n\n"
        "🛠️ *Herramientas:*\n"
        "/clima [ciudad] — Pronostico\n"
        "/crypto [moneda] — Precio\n"
        "/traducir [texto] — Traducir\n"
        "/noticias — Ultimas noticias\n"
        "/calcular [operacion] — Calculadora\n\n"
        "📊 *Sistema:*\n"
        "/status — Estado del bot\n"
        "/stats — Estadisticas detalladas\n\n"
        "💡 *Tip:* No necesitas comandos!\n"
        "Hablame natural: _'hazme una imagen de un leon neon'_\n"
        "O enviame una nota de voz 🎤"
    )
    await update.message.reply_text(text, parse_mode="Markdown")


async def cmd_stats(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Stats detalladas (solo admin)."""
    user_id = str(update.effective_user.id)
    if user_id != ADMIN_CHAT_ID:
        await update.message.reply_text("⛔ Solo el admin puede ver stats detalladas.")
        return

    stats = bot_state.router.get_stats()
    import json
    text = f"```json\n{json.dumps(stats, indent=2, ensure_ascii=False)}\n```"
    await update.message.reply_text(text, parse_mode="Markdown")



# ---------------------------------------------------------------------------
# Handler principal de MENSAJES DE TEXTO
# ---------------------------------------------------------------------------
async def handle_message(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """
    Handler principal para todos los mensajes de texto.
    Pipeline: Texto → IntentEngine → Router → Respuesta
    """
    if not update.message or not update.message.text:
        return

    text = update.message.text.strip()
    user = update.effective_user
    user_id = str(user.id)
    user_name = user.first_name or "Usuario"
    chat_id = str(update.effective_chat.id)

    if not text:
        return

    bot_state.messages_processed += 1
    session = bot_state.get_session(user_id)
    session["name"] = user_name

    try:
        # 1. Triage de intencion (3 capas)
        triage = bot_state.intent_engine.analyze(
            text=text,
            chat_id=chat_id,
            user_name=user_name,
        )

        logger.info(
            f"[{user_name}] '{text[:50]}...' → "
            f"L{triage.layer} {triage.intent}→{triage.agent} "
            f"({triage.confidence:.0%})"
        )

        # 2. Ejecutar segun intencion
        response = await _execute_intent(triage, text, user_id, user_name, update, context)

        # 3. Guardar en historial
        bot_state.add_to_history(user_id, "user", text)
        if response:
            bot_state.add_to_history(user_id, "assistant", response)

        # 4. Enviar respuesta
        if response:
            # Si es muy largo, dividir en chunks
            if len(response) > 4000:
                for i in range(0, len(response), 4000):
                    chunk = response[i:i+4000]
                    await update.message.reply_text(chunk, parse_mode="Markdown")
            else:
                try:
                    await update.message.reply_text(response, parse_mode="Markdown")
                except Exception:
                    # Si falla Markdown, enviar sin formato
                    await update.message.reply_text(response)

    except Exception as e:
        bot_state.errors += 1
        logger.error(f"Error procesando mensaje: {e}", exc_info=True)
        await update.message.reply_text(
            "⚡ Error procesando tu mensaje. Reintentando...\n"
            f"_({type(e).__name__})_",
            parse_mode="Markdown",
        )



async def _execute_intent(
    triage: TriageResult, text: str, user_id: str,
    user_name: str, update: Update, context: ContextTypes.DEFAULT_TYPE
) -> Optional[str]:
    """Ejecuta la accion segun la intencion detectada."""

    intent = triage.intent

    # --- Comandos de juegos ---
    if intent in ("comando_casino", "comando_slot"):
        return await _handle_casino(text, user_id, update)
    elif intent in ("comando_ajedrez",):
        return await _handle_chess(text, user_id, update)

    # --- Comandos de creacion ---
    elif intent == "crear_imagen" or intent == "comando_imagen":
        return await _handle_create_image(text, user_id, update)
    elif intent == "crear_musica" or intent == "comando_musica":
        return await _handle_create_music(text, user_id, update)
    elif intent == "crear_video" or intent == "comando_video":
        return await _handle_create_video(text, user_id, update)

    # --- Skills directos ---
    elif intent == "comando_clima":
        return _handle_skill_weather(text)
    elif intent == "comando_crypto":
        return _handle_skill_crypto(text)
    elif intent == "comando_traducir":
        return _handle_skill_translate(text)
    elif intent == "comando_calcular":
        return _handle_skill_calc(text)

    # --- Conversacion / Default ---
    else:
        return generate_response(text, user_id, user_name, triage)


# ---------------------------------------------------------------------------
# Handler de AUDIO / NOTAS DE VOZ
# ---------------------------------------------------------------------------
async def handle_voice(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Procesa notas de voz: transcribe y luego procesa como texto."""
    if not update.message or not update.message.voice:
        return

    user = update.effective_user
    user_id = str(user.id)
    user_name = user.first_name or "Usuario"

    await update.message.reply_text("🎤 Escuchando...")

    try:
        # Descargar audio
        voice = update.message.voice
        file = await context.bot.get_file(voice.file_id)
        tmp_path = tempfile.mktemp(suffix=".ogg")
        await file.download_to_drive(tmp_path)

        # Transcribir
        transcription = await transcribe_audio(tmp_path)

        # Limpiar archivo temporal
        try:
            os.unlink(tmp_path)
        except OSError:
            pass

        if not transcription:
            await update.message.reply_text("❌ No pude entender el audio. Intenta de nuevo.")
            return

        # Mostrar transcripcion
        await update.message.reply_text(f"📝 _{transcription}_", parse_mode="Markdown")

        # Procesar como texto normal
        bot_state.messages_processed += 1
        triage = bot_state.intent_engine.analyze(
            text=transcription, chat_id=str(update.effective_chat.id),
            user_name=user_name,
        )
        response = await _execute_intent(
            triage, transcription, user_id, user_name, update, context
        )

        if response:
            await update.message.reply_text(response, parse_mode="Markdown")

    except Exception as e:
        logger.error(f"Error procesando voz: {e}")
        await update.message.reply_text("⚡ Error procesando audio.")



# ---------------------------------------------------------------------------
# Handler de IMAGENES
# ---------------------------------------------------------------------------
async def handle_photo(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Procesa imagenes: analiza con vision y responde."""
    if not update.message or not update.message.photo:
        return

    user = update.effective_user
    user_name = user.first_name or "Usuario"
    caption = update.message.caption or "Describe esta imagen en detalle"

    await update.message.reply_text("👁️ Analizando imagen...")

    try:
        # Obtener la foto mas grande
        photo = update.message.photo[-1]
        file = await context.bot.get_file(photo.file_id)
        image_url = file.file_path  # URL directa de Telegram

        # Analizar con vision
        analysis = await analyze_image(image_url, caption)

        if analysis:
            await update.message.reply_text(f"👁️ *Vision:*\n\n{analysis}", parse_mode="Markdown")
        else:
            await update.message.reply_text("❌ No pude analizar la imagen.")

    except Exception as e:
        logger.error(f"Error procesando foto: {e}")
        await update.message.reply_text("⚡ Error analizando imagen.")


# ---------------------------------------------------------------------------
# Handler de CALLBACKS (botones inline)
# ---------------------------------------------------------------------------
async def handle_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Procesa callbacks de botones inline."""
    query = update.callback_query
    await query.answer()

    data = query.data
    user_id = str(query.from_user.id)

    callbacks = {
        "menu_casino": "🎰 *Casino El Leon Dorado*\n\nEscribe /slot para jugar a las tragaperras!\nApuesta: 10-1000 monedas\nJackpot progresivo disponible 💰",
        "menu_chess": "♟️ *Ajedrez C8L*\n\nEscribe /chess para iniciar partida\n6 niveles de dificultad\nSistema ELO y ranking",
        "menu_imagen": "🎨 *Crear Imagen*\n\nEscribeme que quieres:\n_'Hazme un leon neon cyberpunk'_\n_'Genera un logo para mi canal'_\n\nO usa: /imagen [descripcion]",
        "menu_musica": "🎵 *Crear Musica*\n\nDime que estilo quieres:\n_'Crea un reggaeton sobre el verano'_\n_'Hazme un lofi para estudiar'_\n\nO usa: /musica [estilo]",
        "menu_video": "🎬 *Crear Video*\n\nDescribeme el video:\n_'Video de un atardecer con musica chill'_\n_'Animacion de un cohete despegando'_\n\nO usa: /video [concepto]",
        "menu_codigo": "💻 *Crear Codigo*\n\nDime que necesitas:\n_'Hazme un snake en Python'_\n_'Crea una landing page moderna'_\n\nO usa: /codigo [descripcion]",
        "menu_status": None,  # Handled separately
        "menu_help": None,
    }

    if data == "menu_status":
        # Generar status dinamico
        uptime = time.time() - bot_state.start_time
        hours = int(uptime // 3600)
        text = (
            f"⚡ *Status Rapido*\n\n"
            f"⏱️ Uptime: {hours}h\n"
            f"📨 Mensajes: {bot_state.messages_processed}\n"
            f"🔌 APIs activas: {len(bot_state.router._providers)}\n"
            f"✅ Todo funcionando"
        )
        await query.edit_message_text(text, parse_mode="Markdown")
    elif data == "menu_help":
        await query.edit_message_text(
            "❓ Usa /help para ver todos los comandos\n"
            "O simplemente hablame natural!",
            parse_mode="Markdown",
        )
    elif data in callbacks and callbacks[data]:
        await query.edit_message_text(callbacks[data], parse_mode="Markdown")



# ---------------------------------------------------------------------------
# Handlers de Creacion (delegados a APIs)
# ---------------------------------------------------------------------------
async def _handle_create_image(text: str, user_id: str, update: Update) -> Optional[str]:
    """Genera imagen con Pollinations/HuggingFace."""
    import httpx
    from config import POLLINATIONS_IMAGE_URL

    # Extraer prompt de imagen
    prompt = text.replace("/imagen", "").strip()
    if not prompt:
        return "🎨 Describeme que imagen quieres! Ej: _'un leon neon en la ciudad'_"

    await update.message.reply_text("🎨 Generando imagen...")

    try:
        # Pollinations (gratis, sin key)
        import urllib.parse
        encoded = urllib.parse.quote(prompt)
        image_url = f"https://image.pollinations.ai/prompt/{encoded}?width=1024&height=1024&nologo=true"

        # Enviar imagen directamente
        await update.message.reply_photo(
            photo=image_url,
            caption=f"🎨 *{prompt}*\n\n_Generado con Antigravity_",
            parse_mode="Markdown",
        )
        return None  # Ya se envio la foto

    except Exception as e:
        logger.error(f"Error generando imagen: {e}")
        return f"❌ Error generando imagen: {e}"


async def _handle_create_music(text: str, user_id: str, update: Update) -> Optional[str]:
    """Genera musica con Suno/MusicAPI."""
    prompt = text.replace("/musica", "").strip()
    if not prompt:
        return "🎵 Dime que musica quieres! Ej: _'reggaeton sobre el verano'_"

    # Por ahora, usar el router para generar la letra y sugerir
    router = bot_state.router
    response = router.smart(
        prompt=f"Genera una letra de cancion corta (4 estrofas) estilo: {prompt}",
        system="Eres un compositor de canciones. Genera letras creativas en español.",
        max_tokens=512,
    )
    return f"🎵 *Letra generada:*\n\n{response}\n\n_Para producirla con Suno: /suno {prompt}_"


async def _handle_create_video(text: str, user_id: str, update: Update) -> Optional[str]:
    """Genera video o sugiere produccion."""
    prompt = text.replace("/video", "").strip()
    if not prompt:
        return "🎬 Describeme el video! Ej: _'animacion de un cohete despegando'_"

    return (
        f"🎬 *Concepto de video:* {prompt}\n\n"
        f"Opciones disponibles:\n"
        f"1️⃣ /clip — Crear clip corto (5-10s)\n"
        f"2️⃣ /hyperframes — Video HTML animado\n"
        f"3️⃣ Pollinations Video (experimental)\n\n"
        f"Cual prefieres?"
    )


async def _handle_casino(text: str, user_id: str, update: Update) -> Optional[str]:
    """Interfaz rapida con el casino."""
    try:
        from casino.slot_engine import SlotMachine
        machine = SlotMachine()
        result = machine.spin(bet=10, user_id=user_id)
        return (
            f"🎰 *El Leon Dorado*\n\n"
            f"{result.get('display', '??? ??? ???')}\n\n"
            f"{'🎉 GANASTE!' if result.get('win', 0) > 0 else '😤 Sigue intentando!'}\n"
            f"💰 Ganancia: {result.get('win', 0)} monedas"
        )
    except Exception as e:
        return f"🎰 Casino temporalmente no disponible. Error: {e}"


async def _handle_chess(text: str, user_id: str, update: Update) -> Optional[str]:
    """Interfaz rapida con ajedrez."""
    return (
        "♟️ *Ajedrez C8L*\n\n"
        "Comandos:\n"
        "/chess new [nivel 1-6] — Nueva partida\n"
        "/chess move [e2e4] — Mover pieza\n"
        "/chess board — Ver tablero\n"
        "/chess resign — Rendirse\n\n"
        "Niveles: 1(facil) a 6(maestro)"
    )



# ---------------------------------------------------------------------------
# Handlers de Skills
# ---------------------------------------------------------------------------
def _handle_skill_weather(text: str) -> str:
    """Clima via Open-Meteo."""
    import httpx
    from config import OPEN_METEO_URL, NOMINATIM_URL

    city = text.replace("/clima", "").strip() or "Mexico City"
    try:
        # Geocoding
        with httpx.Client(timeout=10) as client:
            geo = client.get(
                NOMINATIM_URL, params={"q": city, "format": "json", "limit": 1},
                headers={"User-Agent": "C8L-Bot/1.0"},
            )
            locations = geo.json()
            if not locations:
                return f"🌤️ No encontre '{city}'. Intenta con otra ciudad."

            lat = locations[0]["lat"]
            lon = locations[0]["lon"]
            name = locations[0].get("display_name", city).split(",")[0]

            # Clima
            weather = client.get(OPEN_METEO_URL, params={
                "latitude": lat, "longitude": lon,
                "current_weather": "true",
            })
            data = weather.json().get("current_weather", {})

            temp = data.get("temperature", "?")
            wind = data.get("windspeed", "?")
            code = data.get("weathercode", 0)

            emoji = "☀️" if code < 3 else "⛅" if code < 50 else "🌧️" if code < 70 else "❄️"

            return (
                f"{emoji} *Clima en {name}*\n\n"
                f"🌡️ Temperatura: {temp}°C\n"
                f"💨 Viento: {wind} km/h\n"
            )
    except Exception as e:
        return f"🌤️ Error consultando clima: {e}"


def _handle_skill_crypto(text: str) -> str:
    """Crypto via CoinGecko."""
    import httpx
    from config import COINGECKO_URL

    coin = text.replace("/crypto", "").strip().lower() or "bitcoin"
    try:
        with httpx.Client(timeout=10) as client:
            resp = client.get(
                f"{COINGECKO_URL}/simple/price",
                params={"ids": coin, "vs_currencies": "usd,eur", "include_24hr_change": "true"},
            )
            data = resp.json()
            if coin not in data:
                return f"💰 No encontre '{coin}'. Prueba: bitcoin, ethereum, solana..."

            info = data[coin]
            usd = info.get("usd", 0)
            eur = info.get("eur", 0)
            change = info.get("usd_24h_change", 0)
            arrow = "📈" if change > 0 else "📉"

            return (
                f"💰 *{coin.upper()}*\n\n"
                f"💵 USD: ${usd:,.2f}\n"
                f"💶 EUR: €{eur:,.2f}\n"
                f"{arrow} 24h: {change:+.2f}%"
            )
    except Exception as e:
        return f"💰 Error consultando crypto: {e}"


def _handle_skill_translate(text: str) -> str:
    """Traduccion via MyMemory."""
    import httpx
    from config import MYMEMORY_URL

    content = text.replace("/traducir", "").strip()
    if not content:
        return "🌐 Escribeme que traducir! Ej: _/traducir hello world_"

    try:
        with httpx.Client(timeout=10) as client:
            # Detectar si es español → traducir a ingles, sino → español
            langpair = "es|en" if any(c in content.lower() for c in "áéíóúñ¿¡") else "en|es"
            resp = client.get(MYMEMORY_URL, params={"q": content, "langpair": langpair})
            data = resp.json()
            translation = data.get("responseData", {}).get("translatedText", "")
            return f"🌐 *Traduccion:*\n\n_{translation}_"
    except Exception as e:
        return f"🌐 Error traduciendo: {e}"


def _handle_skill_calc(text: str) -> str:
    """Calculadora segura."""
    expr = text.replace("/calcular", "").strip()
    if not expr:
        return "🔢 Escribeme la operacion! Ej: _/calcular 15 * 3.14_"

    try:
        # Solo permitir caracteres seguros
        allowed = set("0123456789+-*/.() ")
        if not all(c in allowed for c in expr):
            return "🔢 Solo puedo calcular numeros y operaciones basicas (+, -, *, /, ())"
        result = eval(expr)  # Seguro porque filtramos caracteres
        return f"🔢 `{expr}` = *{result}*"
    except Exception:
        return f"🔢 No pude calcular '{expr}'. Verifica la operacion."



# ---------------------------------------------------------------------------
# Health Check (para UptimeRobot / Render)
# ---------------------------------------------------------------------------
async def run_health_server():
    """Servidor HTTP minimo para health checks."""
    from aiohttp import web

    async def health(request):
        uptime = time.time() - bot_state.start_time
        return web.json_response({
            "status": "alive",
            "version": "antigravity-v5.0",
            "uptime_hours": round(uptime / 3600, 1),
            "messages": bot_state.messages_processed,
            "providers_active": len(bot_state.router._providers),
        })

    app = web.Application()
    app.router.add_get("/", health)
    app.router.add_get("/health", health)

    runner = web.AppRunner(app)
    await runner.setup()
    site = web.TCPSite(runner, "0.0.0.0", PORT)
    await site.start()
    logger.info(f"🌐 Health server en puerto {PORT}")


# ---------------------------------------------------------------------------
# MAIN — Arranque del bot
# ---------------------------------------------------------------------------
def main():
    """Punto de entrada principal del bot Telegram Antigravity."""

    if not TELEGRAM_BOT_TOKEN:
        logger.error("❌ TELEGRAM_BOT_TOKEN no configurado!")
        logger.error("   Configura la variable de entorno TELEGRAM_BOT_TOKEN")
        sys.exit(1)

    logger.info("⚡" * 20)
    logger.info("⚡ ANTIGRAVITY v5.0 — INICIANDO...")
    logger.info("⚡" * 20)
    logger.info(f"   Bot: @{BOT_NAME}")
    logger.info(f"   Admin: {ADMIN_CHAT_ID}")
    logger.info(f"   APIs activas: {len(bot_state.router._providers)}")
    logger.info(f"   Puerto health: {PORT}")
    logger.info("")

    # Crear aplicacion
    app = Application.builder().token(TELEGRAM_BOT_TOKEN).build()

    # --- Registrar handlers ---

    # Comandos
    app.add_handler(CommandHandler("start", cmd_start))
    app.add_handler(CommandHandler("help", cmd_help))
    app.add_handler(CommandHandler("ayuda", cmd_help))
    app.add_handler(CommandHandler("status", cmd_status))
    app.add_handler(CommandHandler("estado", cmd_status))
    app.add_handler(CommandHandler("stats", cmd_stats))

    # Comandos de creacion (redirigidos al handler principal)
    for cmd in ["imagen", "musica", "video", "codigo", "casino", "slot",
                "chess", "ajedrez", "clima", "crypto", "traducir",
                "calcular", "noticias", "recordar"]:
        app.add_handler(CommandHandler(cmd, handle_message))

    # Mensajes de texto (catch-all)
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_message))

    # Audio / Notas de voz
    app.add_handler(MessageHandler(filters.VOICE | filters.AUDIO, handle_voice))

    # Fotos
    app.add_handler(MessageHandler(filters.PHOTO, handle_photo))

    # Callbacks de botones
    app.add_handler(CallbackQueryHandler(handle_callback))

    # --- Iniciar health server + bot ---
    logger.info("⚡ Bot Telegram ONLINE — Esperando mensajes...")

    # Correr health server en background
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)

    async def start_all():
        """Inicia health server y bot en paralelo."""
        # Health server
        await run_health_server()
        # Bot (polling para desarrollo, webhook para produccion)
        await app.initialize()
        await app.start()
        await app.updater.start_polling(drop_pending_updates=True)

        # Notificar al admin
        if ADMIN_CHAT_ID:
            try:
                await app.bot.send_message(
                    chat_id=ADMIN_CHAT_ID,
                    text=(
                        "⚡ *ANTIGRAVITY v5.0 ONLINE*\n\n"
                        f"🔌 APIs: {len(bot_state.router._providers)} activas\n"
                        f"🚀 Capacidad: ~{bot_state.router._calc_total_rpm()} req/min\n"
                        f"♾️ Modo: Sin limites (rotacion infinita)\n\n"
                        "Bot listo para recibir ordenes, jefe 🦁"
                    ),
                    parse_mode="Markdown",
                )
            except Exception:
                pass

        # Mantener vivo
        try:
            while True:
                await asyncio.sleep(3600)
        except (KeyboardInterrupt, SystemExit):
            logger.info("⚡ Apagando Antigravity...")
            await app.updater.stop()
            await app.stop()
            await app.shutdown()

    loop.run_until_complete(start_all())


if __name__ == "__main__":
    main()
