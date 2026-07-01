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
# Handler de IMAGENES (con Visual Guide integrado)
# ---------------------------------------------------------------------------
async def handle_photo(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Procesa imagenes: si hay guía activa → guía visual, sino → análisis general."""
    if not update.message or not update.message.photo:
        return

    user = update.effective_user
    user_id = str(user.id)
    user_name = user.first_name or "Usuario"
    caption = update.message.caption or ""

    try:
        # Obtener la foto mas grande
        photo = update.message.photo[-1]
        file = await context.bot.get_file(photo.file_id)
        image_url = file.file_path  # URL directa de Telegram

        # Verificar si tiene Visual Guide activo
        from skills.visual_guide import get_visual_guide
        guide = get_visual_guide()

        if guide.is_active(user_id):
            # Modo guía visual — analiza y da instrucciones
            await update.message.reply_text("👁️ Analizando pantalla...")
            response = await guide.analyze_screenshot(
                image_url, user_id, caption=caption
            )
            if response:
                try:
                    await update.message.reply_text(response, parse_mode="Markdown")
                except Exception:
                    await update.message.reply_text(response)
            return

        # Modo normal — análisis general
        await update.message.reply_text("👁️ Analizando imagen...")
        analysis = await analyze_image(image_url, caption or "Describe esta imagen en detalle")

        if analysis:
            try:
                await update.message.reply_text(f"👁️ *Vision:*\n\n{analysis}", parse_mode="Markdown")
            except Exception:
                await update.message.reply_text(f"👁️ Vision:\n\n{analysis}")
        else:
            await update.message.reply_text("❌ No pude analizar la imagen.")

    except Exception as e:
        logger.error(f"Error procesando foto: {e}")
        await update.message.reply_text("⚡ Error analizando imagen.")


# ---------------------------------------------------------------------------
# Handler de CALLBACKS (botones inline)
# ---------------------------------------------------------------------------
async def handle_video(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Procesa videos y video notas: extrae audio + analiza frames."""
    if not update.message:
        return

    video = update.message.video or update.message.video_note or update.message.animation
    if not video:
        return

    user = update.effective_user
    user_name = user.first_name or "Usuario"

    await update.message.reply_text("🎬 Procesando video...")

    try:
        from skills.media_processor import get_media_processor
        mp = get_media_processor()

        # Descargar video
        file = await context.bot.get_file(video.file_id)
        tmp_path = tempfile.mktemp(suffix=".mp4")
        await file.download_to_drive(tmp_path)

        # Procesar
        result = await mp.process_video(tmp_path)

        # Limpiar
        try:
            os.unlink(tmp_path)
        except OSError:
            pass

        if result.success:
            response_parts = []
            if result.text:
                response_parts.append(f"🎤 *Transcripción:*\n_{result.text[:1500]}_")
            if result.analysis:
                response_parts.append(f"👁️ *Visual:*\n_{result.analysis[:500]}_")
            if result.duration_sec:
                response_parts.append(f"⏱️ Duración: {result.duration_sec:.0f}s")

            response = "\n\n".join(response_parts)
            try:
                await update.message.reply_text(response, parse_mode="Markdown")
            except Exception:
                await update.message.reply_text(response)
        else:
            await update.message.reply_text("❌ No pude procesar el video.")

    except Exception as e:
        logger.error(f"Error procesando video: {e}")
        await update.message.reply_text(f"⚡ Error procesando video: {type(e).__name__}")


async def handle_document(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Procesa documentos: PDF, Word, código, texto, etc."""
    if not update.message or not update.message.document:
        return

    doc = update.message.document
    user = update.effective_user
    filename = doc.file_name or "archivo"
    file_size_mb = (doc.file_size or 0) / (1024 * 1024)

    # Límite de tamaño (20MB)
    if file_size_mb > 20:
        await update.message.reply_text(
            f"❌ Archivo muy grande ({file_size_mb:.1f}MB). Máximo: 20MB.")
        return

    await update.message.reply_text(f"📄 Procesando _{filename}_...", parse_mode="Markdown")

    try:
        from skills.media_processor import get_media_processor
        mp = get_media_processor()

        # Descargar
        file = await context.bot.get_file(doc.file_id)
        ext = os.path.splitext(filename)[1].lower()
        tmp_path = tempfile.mktemp(suffix=ext)
        await file.download_to_drive(tmp_path)

        # Detectar si es audio/video disfrazado de documento
        if ext in mp.AUDIO_FORMATS:
            result = await mp.process_audio(tmp_path)
        elif ext in mp.VIDEO_FORMATS:
            result = await mp.process_video(tmp_path)
        else:
            result = await mp.process_document(tmp_path, filename)

        # Limpiar
        try:
            os.unlink(tmp_path)
        except OSError:
            pass

        if result.success and result.text:
            # Si es muy largo, resumir con LLM
            text = result.text
            if len(text) > 2000:
                # Resumir
                router = bot_state.router
                summary = router.quick(
                    prompt=f"Resume este documento en español (máximo 500 palabras):\n\n{text[:5000]}",
                    system="Eres un asistente que resume documentos de forma clara y concisa.",
                    max_tokens=600,
                )
                response = (
                    f"📄 *{filename}*\n"
                    f"📊 {result.metadata.get('chars', 0)} caracteres\n\n"
                    f"📝 *Resumen:*\n{summary}\n\n"
                    f"_Envía un mensaje preguntando sobre el contenido para más detalle._"
                )
            else:
                response = f"📄 *{filename}*\n\n```\n{text[:3500]}\n```"

            try:
                await update.message.reply_text(response, parse_mode="Markdown")
            except Exception:
                await update.message.reply_text(response[:4000])
        else:
            await update.message.reply_text(
                f"❌ No pude extraer texto de _{filename}_.\n"
                f"Formato: `{ext}`",
                parse_mode="Markdown",
            )

    except Exception as e:
        logger.error(f"Error procesando documento: {e}")
        await update.message.reply_text(f"⚡ Error procesando documento: {type(e).__name__}")


async def handle_sticker(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Procesa stickers: analiza con Vision."""
    if not update.message or not update.message.sticker:
        return

    sticker = update.message.sticker

    # Stickers animados/video — solo emoji
    if sticker.is_animated or sticker.is_video:
        emoji = sticker.emoji or "🎭"
        response = generate_response(
            f"[El usuario envió un sticker con emoji {emoji}]",
            str(update.effective_user.id),
            update.effective_user.first_name or "Usuario",
        )
        await update.message.reply_text(response)
        return

    # Sticker estático — analizar con Vision
    try:
        file = await context.bot.get_file(sticker.file_id)
        image_url = file.file_path

        analysis = await analyze_image(
            image_url,
            "Describe este sticker brevemente. ¿Qué expresa o comunica?"
        )

        if analysis:
            # Responder de forma conversacional
            response = generate_response(
                f"[Sticker que muestra: {analysis}]",
                str(update.effective_user.id),
                update.effective_user.first_name or "Usuario",
            )
            await update.message.reply_text(response)
        else:
            emoji = sticker.emoji or "🎭"
            await update.message.reply_text(f"{emoji}")

    except Exception as e:
        logger.error(f"Error procesando sticker: {e}")


async def handle_location(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Procesa ubicaciones: clima + info del lugar."""
    if not update.message or not update.message.location:
        return

    loc = update.message.location

    try:
        from skills.media_processor import get_media_processor
        mp = get_media_processor()

        result = await mp.process_location(loc.latitude, loc.longitude)

        if result.success:
            await update.message.reply_text(
                f"📍 *Ubicación recibida*\n\n{result.text}",
                parse_mode="Markdown",
            )
        else:
            await update.message.reply_text(
                f"📍 Ubicación: {loc.latitude}, {loc.longitude}")

    except Exception as e:
        logger.error(f"Error procesando ubicación: {e}")
        await update.message.reply_text(f"📍 Recibí tu ubicación: {loc.latitude}, {loc.longitude}")


# ---------------------------------------------------------------------------
# Handler de CALLBACKS (botones inline) [ORIGINAL]
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
# SEGURIDAD — Decorador admin-only
# ---------------------------------------------------------------------------
def admin_only(func):
    """Decorador que restringe un handler a solo el ADMIN."""
    async def wrapper(update: Update, context: ContextTypes.DEFAULT_TYPE):
        user_id = str(update.effective_user.id)
        if user_id != ADMIN_CHAT_ID:
            await update.message.reply_text(
                "⛔ *Acceso denegado*\n\nEsta operación requiere permisos de administrador.",
                parse_mode="Markdown",
            )
            logger.warning(f"⛔ Intento no autorizado de {user_id} en {func.__name__}")
            return
        return await func(update, context)
    wrapper.__name__ = func.__name__
    return wrapper


# ---------------------------------------------------------------------------
# HANDLERS DE GITHUB — /git
# ---------------------------------------------------------------------------
@admin_only
async def cmd_git(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """
    Handler para /git — Operaciones GitHub.

    Subcomandos:
        /git status       — Ver último commits y branches
        /git read <path>  — Leer un archivo
        /git ls [path]    — Listar archivos
        /git branches     — Listar branches
        /git commits      — Últimos commits
        /git repos        — Listar repos
        /git edit <path>  — Editar archivo (pide contenido después)
        /git pr list      — Listar PRs abiertos
        /git pr merge <n> — Mergear un PR
    """
    from integrations.github_ops import get_github

    gh = get_github()
    args = update.message.text.replace("/git", "").strip().split()

    if not args:
        await update.message.reply_text(
            "🐙 *GitHub Ops*\n\n"
            "Comandos:\n"
            "`/git status` — Resumen del repo\n"
            "`/git read <archivo>` — Leer archivo\n"
            "`/git ls [ruta]` — Listar directorio\n"
            "`/git branches` — Ver branches\n"
            "`/git commits` — Últimos commits\n"
            "`/git repos` — Listar repos\n"
            "`/git pr list` — PRs abiertas\n"
            "`/git pr merge <num>` — Mergear PR\n"
            "`/git edit <archivo>` — Editar (modo interactivo)\n\n"
            f"📂 Repo default: `{gh.default_owner}/{gh.default_repo}`",
            parse_mode="Markdown",
        )
        return

    subcmd = args[0].lower()

    # --- /git status ---
    if subcmd == "status":
        r = gh.get_last_commits(count=3)
        if r.success:
            commits_text = "\n".join(
                f"  `{c['sha']}` {c['message']}" for c in r.data["commits"]
            )
            await update.message.reply_text(
                f"🐙 *Repo Status*\n\n"
                f"📂 `{gh.default_owner}/{gh.default_repo}`\n\n"
                f"📝 *Últimos commits:*\n{commits_text}",
                parse_mode="Markdown",
            )
        else:
            await update.message.reply_text(f"❌ {r.message}")

    # --- /git read <path> ---
    elif subcmd == "read" and len(args) > 1:
        file_path = args[1]
        r = gh.read_file(path=file_path)
        if r.success and r.data.get("content"):
            content = r.data["content"]
            # Truncar si es muy largo
            if len(content) > 3000:
                content = content[:3000] + "\n\n... (truncado, archivo completo en GitHub)"
            await update.message.reply_text(
                f"📄 *{file_path}*\n\n```\n{content}\n```",
                parse_mode="Markdown",
            )
        elif r.success and r.data.get("type") == "directory":
            files = r.data["files"]
            file_list = "\n".join(f"  📁 {f}" for f in files[:30])
            await update.message.reply_text(
                f"📂 *{file_path or '/'}*\n\n{file_list}",
                parse_mode="Markdown",
            )
        else:
            await update.message.reply_text(f"❌ {r.message}")

    # --- /git ls [path] ---
    elif subcmd == "ls":
        path = args[1] if len(args) > 1 else ""
        r = gh.list_files(path=path)
        if r.success:
            if r.data.get("files"):
                files = r.data["files"]
                file_list = "\n".join(f"  • `{f}`" for f in files[:40])
                await update.message.reply_text(
                    f"📂 *{path or 'raíz'}* ({len(files)} items)\n\n{file_list}",
                    parse_mode="Markdown",
                )
            elif r.data.get("content"):
                await update.message.reply_text(f"📄 Es un archivo. Usa `/git read {path}`",
                    parse_mode="Markdown")
        else:
            await update.message.reply_text(f"❌ {r.message}")

    # --- /git branches ---
    elif subcmd == "branches":
        r = gh.list_branches()
        if r.success:
            branches = r.data["branches"]
            branch_list = "\n".join(
                f"  {'🟢' if b == 'main' else '🔀'} `{b}`" for b in branches
            )
            await update.message.reply_text(
                f"🌿 *Branches* ({len(branches)})\n\n{branch_list}",
                parse_mode="Markdown",
            )
        else:
            await update.message.reply_text(f"❌ {r.message}")

    # --- /git commits ---
    elif subcmd == "commits":
        count = int(args[1]) if len(args) > 1 and args[1].isdigit() else 5
        r = gh.get_last_commits(count=count)
        if r.success:
            commits = r.data["commits"]
            text = "\n".join(
                f"  `{c['sha']}` {c['date']} — {c['message']}" for c in commits
            )
            await update.message.reply_text(
                f"📝 *Últimos {len(commits)} commits*\n\n{text}",
                parse_mode="Markdown",
            )
        else:
            await update.message.reply_text(f"❌ {r.message}")

    # --- /git repos ---
    elif subcmd == "repos":
        r = gh.list_repos()
        if r.success:
            repos = r.data["repos"]
            text = "\n".join(
                f"  📦 `{rp['name']}` — {rp['description'] or 'sin desc'}"
                for rp in repos[:15]
            )
            await update.message.reply_text(
                f"📦 *Repos de {gh.default_owner}*\n\n{text}",
                parse_mode="Markdown",
            )
        else:
            await update.message.reply_text(f"❌ {r.message}")

    # --- /git pr list ---
    elif subcmd == "pr" and len(args) > 1 and args[1] == "list":
        r = gh.list_prs()
        if r.success:
            prs = r.data["prs"]
            if not prs:
                await update.message.reply_text("✅ No hay PRs abiertos.")
                return
            text = "\n".join(
                f"  🔀 #{p['number']} `{p['branch']}` — {p['title']}"
                for p in prs
            )
            await update.message.reply_text(
                f"🔀 *PRs abiertos*\n\n{text}",
                parse_mode="Markdown",
            )
        else:
            await update.message.reply_text(f"❌ {r.message}")

    # --- /git pr merge <number> ---
    elif subcmd == "pr" and len(args) > 2 and args[1] == "merge":
        try:
            pr_num = int(args[2])
        except ValueError:
            await update.message.reply_text("❌ Número de PR inválido")
            return
        r = gh.merge_pr(pr_num)
        if r.success:
            await update.message.reply_text(
                f"✅ *PR #{pr_num} mergeado!*\n\n{r.message}",
                parse_mode="Markdown",
            )
        else:
            await update.message.reply_text(f"❌ {r.message}")

    # --- /git edit <path> (modo simple — pasa contenido inline) ---
    elif subcmd == "edit" and len(args) > 1:
        file_path = args[1]
        # El contenido viene después del path en el mensaje
        full_text = update.message.text
        # Buscar contenido después del path
        content_start = full_text.find(file_path) + len(file_path)
        new_content = full_text[content_start:].strip()

        if not new_content:
            await update.message.reply_text(
                f"✏️ *Modo edición*\n\n"
                f"Para editar `{file_path}`, envía:\n"
                f"`/git edit {file_path} <contenido nuevo>`\n\n"
                f"O para edición completa con PR:\n"
                f"`/git fulledit {file_path}`\n"
                f"_(te pediré el contenido en el siguiente mensaje)_",
                parse_mode="Markdown",
            )
            return

        # Ejecutar edición completa (branch + edit + PR)
        await update.message.reply_text("⚡ Editando...")
        r = gh.full_edit(
            path=file_path,
            new_content=new_content,
            commit_message=f"⚡ Bot edit: {file_path}",
        )
        if r.success:
            url_text = f"\n🔗 {r.url}" if r.url else ""
            await update.message.reply_text(
                f"✅ *Edición completada*\n\n{r.message}{url_text}",
                parse_mode="Markdown",
            )
        else:
            await update.message.reply_text(f"❌ {r.message}")

    else:
        await update.message.reply_text(
            "❓ Subcomando no reconocido. Usa `/git` para ver opciones.",
            parse_mode="Markdown",
        )


# ---------------------------------------------------------------------------
# HANDLERS DE DEPLOY — /deploy
# ---------------------------------------------------------------------------
@admin_only
async def cmd_deploy(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """
    Handler para /deploy — Control de despliegues.

    Subcomandos:
        /deploy status    — Estado del servicio
        /deploy trigger   — Nuevo deploy
        /deploy restart   — Reiniciar servicio
        /deploy logs      — Últimos deploys
        /deploy env       — Ver variables de entorno
        /deploy env set KEY VALUE — Cambiar variable
        /deploy health    — Health check externo
    """
    from integrations.deploy_control import get_deploy_control

    dc = get_deploy_control()
    args = update.message.text.replace("/deploy", "").strip().split()

    if not args:
        await update.message.reply_text(
            "🚀 *Deploy Control*\n\n"
            "Comandos:\n"
            "`/deploy status` — Estado del servicio\n"
            "`/deploy trigger` — Nuevo deploy\n"
            "`/deploy restart` — Reiniciar\n"
            "`/deploy logs` — Historial de deploys\n"
            "`/deploy env` — Variables de entorno\n"
            "`/deploy env set KEY VALUE` — Cambiar variable\n"
            "`/deploy health` — Health check\n",
            parse_mode="Markdown",
        )
        return

    subcmd = args[0].lower()

    # --- /deploy status ---
    if subcmd == "status":
        await update.message.reply_text("📡 Consultando Render...")
        r = dc.get_service_status()
        await update.message.reply_text(
            r.message if r.success else f"❌ {r.message}",
            parse_mode="Markdown",
        )

    # --- /deploy trigger ---
    elif subcmd == "trigger":
        clear = "clear" in args
        await update.message.reply_text("🚀 Iniciando deploy...")
        r = dc.trigger_deploy(clear_cache=clear)
        await update.message.reply_text(
            r.message if r.success else f"❌ {r.message}",
            parse_mode="Markdown",
        )

    # --- /deploy restart ---
    elif subcmd == "restart":
        await update.message.reply_text("🔄 Reiniciando servicio...")
        r = dc.restart_service()
        await update.message.reply_text(
            r.message if r.success else f"❌ {r.message}",
            parse_mode="Markdown",
        )

    # --- /deploy logs ---
    elif subcmd == "logs":
        count = int(args[1]) if len(args) > 1 and args[1].isdigit() else 5
        r = dc.get_deploys(count=count)
        await update.message.reply_text(
            r.message if r.success else f"❌ {r.message}",
            parse_mode="Markdown",
        )

    # --- /deploy env ---
    elif subcmd == "env":
        if len(args) > 2 and args[1] == "set":
            # /deploy env set KEY VALUE
            key = args[2]
            value = " ".join(args[3:]) if len(args) > 3 else ""
            if not value:
                await update.message.reply_text(
                    "❌ Uso: `/deploy env set KEY VALUE`",
                    parse_mode="Markdown",
                )
                return
            r = dc.set_env_var(key, value)
            await update.message.reply_text(
                r.message if r.success else f"❌ {r.message}",
                parse_mode="Markdown",
            )
        else:
            r = dc.get_env_vars()
            await update.message.reply_text(
                r.message if r.success else f"❌ {r.message}",
                parse_mode="Markdown",
            )

    # --- /deploy health ---
    elif subcmd == "health":
        await update.message.reply_text("🏥 Verificando salud del bot...")
        r = dc.check_bot_health()
        await update.message.reply_text(
            r.message if r.success else f"{r.message}",
            parse_mode="Markdown",
        )

    else:
        await update.message.reply_text(
            "❓ Subcomando no reconocido. Usa `/deploy` para ver opciones.",
            parse_mode="Markdown",
        )


# ---------------------------------------------------------------------------
# HANDLER DE CÓDIGO INTELIGENTE — /code
# ---------------------------------------------------------------------------
@admin_only
async def cmd_code(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """
    Handler para /code — El bot genera código y lo pushea.

    Uso:
        /code agregar comando /fortuna al bot
        /code fix el error en casino/slot_engine.py
        /code crear archivo utils/helpers.py con funciones de formateo

    Flujo: LLM genera código → crea branch → edit → PR
    """
    from integrations.github_ops import get_github

    gh = get_github()
    router = bot_state.router
    text = update.message.text.replace("/code", "").strip()

    if not text:
        await update.message.reply_text(
            "💻 *Code Mode*\n\n"
            "Describeme qué código quieres y lo creo:\n\n"
            "`/code agregar comando /fortuna`\n"
            "`/code fix error en config.py`\n"
            "`/code crear utils/format.py`\n\n"
            "El bot:\n"
            "1️⃣ Analiza qué necesitas\n"
            "2️⃣ Genera el código\n"
            "3️⃣ Crea branch + commit + PR\n"
            "4️⃣ Te da el link para revisar",
            parse_mode="Markdown",
        )
        return

    await update.message.reply_text("🧠 Analizando tu petición...")

    # Paso 1: LLM analiza qué archivo crear/editar y genera código
    analysis_prompt = (
        f"El usuario quiere hacer este cambio en un bot de Telegram (Python):\n"
        f"\"{text}\"\n\n"
        f"El proyecto tiene esta estructura:\n"
        f"- telegram_antigravity.py (bot principal)\n"
        f"- api_router.py (router de APIs)\n"
        f"- nlp/intent_engine.py (motor de intenciones)\n"
        f"- config.py (configuración)\n"
        f"- casino/ (juegos)\n"
        f"- integrations/ (github, deploy)\n\n"
        f"Responde con un JSON:\n"
        f'{{"file": "ruta/archivo.py", "action": "create|edit", '
        f'"code": "código Python completo del archivo", '
        f'"commit_message": "mensaje del commit", '
        f'"explanation": "explicación breve"}}'
    )

    response = router.smart(
        prompt=analysis_prompt,
        system="Eres un programador experto en Python. Genera código limpio y funcional. Responde SOLO con JSON.",
        max_tokens=2048,
    )

    if not response:
        await update.message.reply_text("❌ No pude generar el código. Intenta de nuevo.")
        return

    # Paso 2: Parsear respuesta
    import json as json_mod
    try:
        # Buscar JSON en la respuesta
        start = response.find("{")
        end = response.rfind("}") + 1
        if start >= 0 and end > start:
            plan = json_mod.loads(response[start:end])
        else:
            raise ValueError("No se encontró JSON")
    except (json_mod.JSONDecodeError, ValueError):
        await update.message.reply_text(
            f"⚠️ *Análisis:*\n\n{response[:1000]}",
            parse_mode="Markdown",
        )
        return

    file_path = plan.get("file", "")
    code = plan.get("code", "")
    commit_msg = plan.get("commit_message", f"⚡ Code: {text[:50]}")
    explanation = plan.get("explanation", "")

    if not file_path or not code:
        await update.message.reply_text(
            f"⚠️ No pude determinar qué archivo crear/editar.\n\n"
            f"_Explicación: {explanation}_",
            parse_mode="Markdown",
        )
        return

    # Paso 3: Mostrar plan y ejecutar
    await update.message.reply_text(
        f"📋 *Plan:*\n\n"
        f"📄 Archivo: `{file_path}`\n"
        f"✏️ Acción: {plan.get('action', 'edit')}\n"
        f"💬 Commit: _{commit_msg}_\n"
        f"📝 {explanation}\n\n"
        f"⚡ Ejecutando...",
        parse_mode="Markdown",
    )

    # Paso 4: Full edit (branch → edit → PR)
    r = gh.full_edit(
        path=file_path,
        new_content=code,
        commit_message=commit_msg,
    )

    if r.success:
        url_text = f"\n\n🔗 [Ver PR]({r.url})" if r.url else ""
        await update.message.reply_text(
            f"✅ *Código desplegado!*\n\n{r.message}{url_text}",
            parse_mode="Markdown",
        )
    else:
        await update.message.reply_text(f"❌ Error: {r.message}")


# ---------------------------------------------------------------------------
# HANDLERS DE MEMORIA Y APRENDIZAJE — /learn, /memory, /evolve
# ---------------------------------------------------------------------------
@admin_only
async def cmd_learn(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """
    Handler para /learn — Enseñar al bot algo nuevo.

    Subcomandos:
        /learn <texto>       — Almacenar conocimiento
        /learn buscar <q>    — Buscar en memoria
        /learn stats         — Estadísticas de aprendizaje
        /learn feedback <+/-> — Dar feedback sobre última respuesta
    """
    from memory.vector_store import VectorStore
    from memory.learning_feedback import LearningFeedback

    vs = VectorStore()
    lf = LearningFeedback()
    text = update.message.text.replace("/learn", "").strip()

    if not text:
        await update.message.reply_text(
            "🧠 *Aprendizaje*\n\n"
            "Comandos:\n"
            "`/learn <texto>` — Enseñarme algo\n"
            "`/learn buscar <tema>` — Buscar en mi memoria\n"
            "`/learn stats` — Ver estadísticas\n"
            "`/learn feedback +` — Última respuesta fue buena\n"
            "`/learn feedback -` — Última respuesta fue mala\n\n"
            "Ejemplo: `/learn mi estilo favorito es cyberpunk neon`",
            parse_mode="Markdown",
        )
        return

    args = text.split()
    subcmd = args[0].lower() if args else ""

    # --- /learn stats ---
    if subcmd == "stats":
        summary = lf.get_learning_summary()
        vs_size = vs.size()
        categories = vs.get_categories()
        cat_text = "\n".join(f"  • {k}: {v}" for k, v in categories.items()) if categories else "  (vacío)"
        await update.message.reply_text(
            f"{summary}\n"
            f"🔍 *Vector Store:* {vs_size} entries\n"
            f"📂 Categorías:\n{cat_text}",
            parse_mode="Markdown",
        )
        return

    # --- /learn buscar <query> ---
    if subcmd == "buscar" and len(args) > 1:
        query = " ".join(args[1:])
        results = vs.search(query, limit=5, min_similarity=0.3)
        if results:
            result_text = "\n\n".join(
                f"  📌 _{r['text'][:150]}_\n  (similitud: {r['similarity']:.0%})"
                for r in results
            )
            await update.message.reply_text(
                f"🔍 *Resultados para:* _{query}_\n\n{result_text}",
                parse_mode="Markdown",
            )
        else:
            await update.message.reply_text(
                f"🔍 No encontré nada sobre _{query}_ en mi memoria.",
                parse_mode="Markdown",
            )
        return

    # --- /learn feedback +/- ---
    if subcmd == "feedback":
        fb_type = args[1] if len(args) > 1 else ""
        user_id = str(update.effective_user.id)
        session = bot_state.get_session(user_id)
        last_history = session["history"][-2:] if session["history"] else []

        if fb_type in ("+", "positivo", "bien", "good"):
            if last_history:
                lf.record_positive("general", "hermes", user_id=user_id)
            await update.message.reply_text("👍 Feedback positivo registrado. Aprendo!")
        elif fb_type in ("-", "negativo", "mal", "bad"):
            reason = " ".join(args[2:]) if len(args) > 2 else ""
            if last_history:
                lf.record_negative("general", "hermes", reason=reason, user_id=user_id)
            await update.message.reply_text("👎 Feedback negativo registrado. Mejoraré!")
        else:
            await update.message.reply_text("Uso: `/learn feedback +` o `/learn feedback -`",
                parse_mode="Markdown")
        return

    # --- /learn <texto> — Almacenar conocimiento ---
    knowledge = text
    user_id = str(update.effective_user.id)

    # Detectar categoría automáticamente
    category = "general"
    cat_keywords = {
        "preferencia": ["mi estilo", "me gusta", "prefiero", "favorito"],
        "regla": ["regla", "nunca", "siempre", "importante"],
        "dato": ["dato", "info", "sabes que", "recuerda que"],
        "proyecto": ["proyecto", "repo", "web", "bot"],
    }
    text_lower = knowledge.lower()
    for cat, keywords in cat_keywords.items():
        if any(kw in text_lower for kw in keywords):
            category = cat
            break

    entry_id = vs.add(knowledge, metadata={"user_id": user_id, "source": "telegram"}, category=category)
    vs.save()

    await update.message.reply_text(
        f"🧠 *Aprendido!*\n\n"
        f"📝 _{knowledge[:200]}_\n"
        f"📂 Categoría: {category}\n"
        f"🆔 ID: `{entry_id[:8]}`\n\n"
        f"Lo recordaré para futuras conversaciones.",
        parse_mode="Markdown",
    )


async def cmd_memory(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """
    Handler para /memory — Ver perfil y memoria del usuario.
    Accesible para todos (cada uno ve solo su perfil).
    """
    from memory.user_context import UserContextManager

    ucm = UserContextManager()
    user_id = str(update.effective_user.id)

    profile_text = ucm.get_profile_text(user_id)
    await update.message.reply_text(profile_text, parse_mode="Markdown")


@admin_only
async def cmd_evolve(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """
    Handler para /evolve — Auto-modificación del bot.

    Subcomandos:
        /evolve <instrucción>  — El bot se modifica a sí mismo
        /evolve stats          — Estadísticas del motor
        /evolve history        — Historial de modificaciones
    """
    from core.self_modify import get_self_modify

    engine = get_self_modify()
    text = update.message.text.replace("/evolve", "").strip()

    if not text:
        await update.message.reply_text(
            "🧬 *Self-Modify Engine*\n\n"
            "Comandos:\n"
            "`/evolve <instrucción>` — Auto-modificarme\n"
            "`/evolve stats` — Estadísticas\n"
            "`/evolve history` — Historial de cambios\n\n"
            "Ejemplo:\n"
            "`/evolve agregar comando /dado que tire un dado random`\n"
            "`/evolve crear skill de horóscopo diario`\n\n"
            "⚠️ Los cambios van a una branch con PR. Tú apruebas.",
            parse_mode="Markdown",
        )
        return

    args = text.split()
    subcmd = args[0].lower()

    # --- /evolve stats ---
    if subcmd == "stats":
        stats_text = engine.get_stats_text()
        await update.message.reply_text(stats_text, parse_mode="Markdown")
        return

    # --- /evolve history ---
    if subcmd == "history":
        history = engine.get_history(limit=5)
        if not history:
            await update.message.reply_text("📋 Sin historial de modificaciones aún.")
            return
        lines = []
        for h in history:
            icon = "✅" if h.get("success") else "❌"
            file = h.get("file", "?")
            branch = h.get("branch", "?")
            lines.append(f"  {icon} `{file}` → `{branch}`")
        await update.message.reply_text(
            f"📋 *Historial de auto-modificaciones:*\n\n" + "\n".join(lines),
            parse_mode="Markdown",
        )
        return

    # --- /evolve <instrucción> — Ejecutar auto-modificación ---
    instruction = text
    await update.message.reply_text(
        f"🧬 *Planificando modificación...*\n\n"
        f"📝 _{instruction[:200]}_",
        parse_mode="Markdown",
    )

    # Ejecutar flujo completo
    result = engine.full_modify(instruction, auto_approve=False)

    if result.success:
        pr_text = f"\n\n🔗 [Ver PR]({result.pr_url})" if result.pr_url else ""
        await update.message.reply_text(
            f"{result.message}{pr_text}",
            parse_mode="Markdown",
        )
    else:
        await update.message.reply_text(
            result.message,
            parse_mode="Markdown",
        )


# ---------------------------------------------------------------------------
# HANDLER DE WATCHDOG — /watchdog
# ---------------------------------------------------------------------------
@admin_only
async def cmd_watchdog(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """
    Handler para /watchdog — Monitoreo del sistema.

    Subcomandos:
        /watchdog          — Status del monitor
        /watchdog ping     — Ping al health endpoint
        /watchdog start    — Iniciar monitoreo continuo
        /watchdog stop     — Detener monitoreo
    """
    from watchdog.health_monitor import get_health_monitor

    monitor = get_health_monitor()
    args = update.message.text.replace("/watchdog", "").strip().split()
    subcmd = args[0].lower() if args else "status"

    if subcmd == "status" or not args:
        stats = monitor.get_stats_text()
        await update.message.reply_text(stats, parse_mode="Markdown")

    elif subcmd == "ping":
        await update.message.reply_text("🏥 Haciendo ping...")
        result = await monitor.check_health_external()
        if result.status == "ok":
            await update.message.reply_text(
                f"🟢 *Bot ALIVE*\n\n"
                f"⚡ Latencia: {result.response_time_ms:.0f}ms\n"
                f"📊 {result.details}",
                parse_mode="Markdown",
            )
        elif result.status == "slow":
            await update.message.reply_text(
                f"🟡 *Bot LENTO*\n\n"
                f"⚡ Latencia: {result.response_time_ms:.0f}ms",
                parse_mode="Markdown",
            )
        else:
            await update.message.reply_text(
                f"🔴 *Bot NO responde*\n\n"
                f"❌ Error: {result.error}\n\n"
                f"Usa `/deploy restart` para reiniciar.",
                parse_mode="Markdown",
            )

    elif subcmd == "start":
        if not monitor._running:
            # Iniciar en background
            asyncio.create_task(monitor.start_monitoring(bot=context.bot))
            await update.message.reply_text(
                f"👁️ *Monitoreo iniciado*\n\n"
                f"Ping cada {monitor.check_interval}s\n"
                f"Auto-restart tras {monitor.max_failures} fallos",
                parse_mode="Markdown",
            )
        else:
            await update.message.reply_text("👁️ El monitoreo ya está activo.")

    elif subcmd == "stop":
        monitor.stop()
        await update.message.reply_text("⏹️ Monitoreo detenido.")

    else:
        await update.message.reply_text(
            "👁️ Uso: `/watchdog`, `/watchdog ping`, `/watchdog start`, `/watchdog stop`",
            parse_mode="Markdown",
        )


# ---------------------------------------------------------------------------
# HANDLER DE GUÍA VISUAL — /guide
# ---------------------------------------------------------------------------
async def cmd_guide(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """
    Handler para /guide — Modo asistente visual paso a paso.

    Subcomandos:
        /guide <tarea>    — Iniciar guía con una tarea
        /guide stop       — Detener guía
        /guide status     — Estado de la sesión
        /guide ocr        — Leer texto de la próxima imagen
    """
    from skills.visual_guide import get_visual_guide

    guide = get_visual_guide()
    user_id = str(update.effective_user.id)
    text = update.message.text.replace("/guide", "").strip()

    if not text:
        is_active = guide.is_active(user_id)
        if is_active:
            session = guide.get_session(user_id)
            await update.message.reply_text(
                f"👁️ *Guía Visual ACTIVA*\n\n"
                f"📋 Tarea: _{session.task or 'General'}_\n"
                f"📸 Screenshots: {session.screenshots_analyzed}\n"
                f"✅ Pasos: {len(session.steps_completed)}\n\n"
                f"Envíame un screenshot y te guío.\n"
                f"Usa `/guide stop` para desactivar.",
                parse_mode="Markdown",
            )
        else:
            await update.message.reply_text(
                "👁️ *Guía Visual*\n\n"
                "Te guío paso a paso con screenshots.\n\n"
                "Comandos:\n"
                "`/guide <tarea>` — Iniciar (ej: _configurar Render_)\n"
                "`/guide stop` — Detener\n"
                "`/guide status` — Ver sesión\n\n"
                "Ejemplo:\n"
                "`/guide configurar las variables de entorno en Render`\n\n"
                "Después envíame screenshots y te digo qué hacer.",
                parse_mode="Markdown",
            )
        return

    args = text.split()
    subcmd = args[0].lower()

    # --- /guide stop ---
    if subcmd == "stop":
        msg = guide.stop_session(user_id)
        await update.message.reply_text(msg)
        return

    # --- /guide status ---
    if subcmd == "status":
        if guide.is_active(user_id):
            session = guide.get_session(user_id)
            steps_text = "\n".join(f"  ✅ {s}" for s in session.steps_completed[-5:]) or "  (ninguno)"
            await update.message.reply_text(
                f"👁️ *Sesión activa*\n\n"
                f"📋 Tarea: _{session.task}_\n"
                f"📸 Screenshots: {session.screenshots_analyzed}\n"
                f"📝 Pasos completados:\n{steps_text}",
                parse_mode="Markdown",
            )
        else:
            await update.message.reply_text("❌ No hay guía activa. Usa `/guide <tarea>` para iniciar.",
                parse_mode="Markdown")
        return

    # --- /guide <tarea> — Iniciar sesión ---
    task = text
    msg = guide.start_session(user_id, task)
    await update.message.reply_text(msg, parse_mode="Markdown")


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

    # Comandos de sistema (admin-only)
    app.add_handler(CommandHandler("git", cmd_git))
    app.add_handler(CommandHandler("deploy", cmd_deploy))
    app.add_handler(CommandHandler("code", cmd_code))

    # Comandos de memoria y evolución
    app.add_handler(CommandHandler("learn", cmd_learn))
    app.add_handler(CommandHandler("memory", cmd_memory))
    app.add_handler(CommandHandler("memoria", cmd_memory))
    app.add_handler(CommandHandler("evolve", cmd_evolve))

    # Watchdog
    app.add_handler(CommandHandler("watchdog", cmd_watchdog))


# ---------------------------------------------------------------------------
# PREMIUM Y ADMIN PANEL — /premium, /admin
# ---------------------------------------------------------------------------
async def cmd_premium(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handler para /premium CODIGO — Cualquier usuario canjea código."""
    user = update.effective_user
    user_id = str(user.id)
    user_name = user.first_name or "Usuario"
    text = update.message.text.replace("/premium", "").strip()

    if not text:
        await update.message.reply_text(
            "🎫 *Código Premium*\n\n"
            "Usa: `/premium C8L-XXXX-XXXX`\n\n"
            "¿No tienes código? Contacta al admin.",
            parse_mode="Markdown",
        )
        return

    # Canjear código
    from premium_codes import PremiumCodeManager
    pm = PremiumCodeManager()
    result = pm.redeem_code(text, user_id, user_name)

    if result["success"]:
        await update.message.reply_text(
            f"🎉 *{result['message']}*\n\n"
            f"👑 Tier: {result['tier']}\n"
            f"📅 Duración: {result['duration_days']} días\n\n"
            f"¡Bienvenido al club premium, {user_name}! 🦁",
            parse_mode="Markdown",
        )
    else:
        await update.message.reply_text(f"❌ {result['message']}")


@admin_only
async def cmd_admin(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handler para /admin — Panel de administración completo."""
    from premium_codes import PremiumCodeManager
    from admin_panel import AdminPanel

    text = update.message.text.strip()
    user_id = str(update.effective_user.id)
    panel = AdminPanel(admin_id=user_id)
    pm = PremiumCodeManager()

    # --- /admin (resumen general) ---
    if text == "/admin":
        summary = panel.get_summary()
        await update.message.reply_text(summary, parse_mode="Markdown")

    # --- /admin_gencode [cantidad] ---
    elif text.startswith("/admin_gencode"):
        parts = text.split()
        count = int(parts[1]) if len(parts) > 1 and parts[1].isdigit() else 1
        days = int(parts[2]) if len(parts) > 2 and parts[2].isdigit() else 30

        codes = pm.generate_batch(count=count, duration_days=days)
        codes_text = "\n".join(f"  `{c}`" for c in codes)
        await update.message.reply_text(
            f"🎫 *{len(codes)} código(s) premium generados:*\n\n"
            f"{codes_text}\n\n"
            f"📅 Duración: {days} días\n"
            f"⏳ Expiran en 90 días si no se usan",
            parse_mode="Markdown",
        )

    # --- /admin_codes ---
    elif text.startswith("/admin_codes"):
        active = pm.get_active_codes()
        if not active:
            await update.message.reply_text("🎫 No hay códigos activos.")
            return
        lines = []
        for c in active[:20]:
            lines.append(f"  `{c['code']}` — {c['tier']} ({c['duration_days']}d) exp:{c['expires_at']}")
        await update.message.reply_text(
            f"🎫 *Códigos activos ({len(active)}):*\n\n" + "\n".join(lines),
            parse_mode="Markdown",
        )

    # --- /admin_set_premium USER_ID ---
    elif text.startswith("/admin_set_premium"):
        parts = text.split()
        if len(parts) < 2:
            await update.message.reply_text("Uso: `/admin_set_premium USER_ID`", parse_mode="Markdown")
            return
        target_id = parts[1]
        try:
            from suno_credits import SunoCreditsManager
            cm = SunoCreditsManager()
            cm.set_tier(target_id, "premium")
            await update.message.reply_text(f"👑 Usuario `{target_id}` ahora es Premium!", parse_mode="Markdown")
        except Exception as e:
            await update.message.reply_text(f"❌ Error: {e}")

    # --- /admin_users ---
    elif text.startswith("/admin_users"):
        try:
            from suno_credits import SunoCreditsManager
            cm = SunoCreditsManager()
            users = cm._data.get("users", {})
            total = len(users)
            premium_count = sum(1 for u in users.values() if u.get("tier") == "premium")
            users_text = "\n".join(
                f"  {'👑' if u.get('tier') == 'premium' else '👤'} "
                f"`{uid[:10]}` — {u.get('name', '?')} ({u.get('tier', 'free')})"
                for uid, u in list(users.items())[:20]
            )
            await update.message.reply_text(
                f"👥 *Usuarios* ({total} total, {premium_count} premium)\n\n{users_text}",
                parse_mode="Markdown",
            )
        except Exception as e:
            await update.message.reply_text(f"❌ Error: {e}")

    # --- /admin_billing ---
    elif text.startswith("/admin_billing"):
        try:
            from billing import get_billing
            billing = get_billing()
            report = billing.get_summary()
            await update.message.reply_text(report, parse_mode="Markdown")
        except Exception as e:
            await update.message.reply_text(f"🧾 Billing no configurado: {e}")

    # --- /admin_credits ---
    elif text.startswith("/admin_credits"):
        try:
            from musicapi_client import MusicAPIClient
            client = MusicAPIClient()
            credits = client.get_credits()
            await update.message.reply_text(
                f"🎵 *MusicAPI Credits:* {credits.get('credits', '?')}",
                parse_mode="Markdown",
            )
        except Exception as e:
            await update.message.reply_text(f"🎵 MusicAPI no disponible: {e}")

    else:
        await update.message.reply_text(
            "👑 *Admin Panel*\n\n"
            "`/admin` — Resumen general\n"
            "`/admin_gencode [N] [dias]` — Generar N códigos\n"
            "`/admin_codes` — Ver códigos activos\n"
            "`/admin_set_premium USER_ID` — Dar premium\n"
            "`/admin_users` — Ver usuarios\n"
            "`/admin_billing` — Facturación\n"
            "`/admin_credits` — Créditos MusicAPI",
            parse_mode="Markdown",
        )


# ---------------------------------------------------------------------------
# ECONOMÍA C8L — /wallet, /daily, /gift, /comprar, /tienda, /retirar
# ---------------------------------------------------------------------------
async def cmd_wallet(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handler para /wallet — Ver balance."""
    from economy.c8l_economy import get_c8l_economy
    eco = get_c8l_economy()
    user_id = str(update.effective_user.id)
    text = eco.get_balance_text(user_id)
    await update.message.reply_text(text, parse_mode="Markdown")


async def cmd_daily(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handler para /daily — Reclamar login diario."""
    from economy.c8l_economy import get_c8l_economy
    eco = get_c8l_economy()
    user_id = str(update.effective_user.id)
    result = eco.claim_daily_login(user_id)
    await update.message.reply_text(result["message"], parse_mode="Markdown")


async def cmd_gift(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handler para /regalo — Enviar regalo a otro usuario."""
    from economy.c8l_economy import get_c8l_economy
    eco = get_c8l_economy()
    user_id = str(update.effective_user.id)
    text = update.message.text.replace("/regalo", "").replace("/gift", "").strip()

    if not text:
        gifts_menu = eco._get_gifts_menu()
        await update.message.reply_text(
            f"🎁 *Enviar Regalo*\n\n"
            f"Uso: `/regalo [nombre_regalo] [user_id]`\n\n"
            f"{gifts_menu}",
            parse_mode="Markdown",
        )
        return

    args = text.split()
    if len(args) < 2:
        await update.message.reply_text(
            "Uso: `/regalo [nombre_regalo] [user_id]`\nEj: `/regalo leon 123456789`",
            parse_mode="Markdown",
        )
        return

    gift_name = args[0].lower()
    receiver_id = args[1]

    result = eco.send_gift(user_id, receiver_id, gift_name)
    await update.message.reply_text(result["message"], parse_mode="Markdown")


async def cmd_buy(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handler para /comprar — Comprar pack de coins."""
    from economy.c8l_economy import get_c8l_economy
    eco = get_c8l_economy()
    user_id = str(update.effective_user.id)
    text = update.message.text.replace("/comprar", "").strip()

    if not text:
        packs = eco.get_packs_text()
        await update.message.reply_text(packs, parse_mode="Markdown")
        return

    pack_name = text.lower().split()[0]
    result = eco.purchase_coins(user_id, pack_name)
    await update.message.reply_text(result["message"], parse_mode="Markdown")


async def cmd_shop(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handler para /tienda — Ver tienda completa."""
    from economy.c8l_economy import get_c8l_economy
    eco = get_c8l_economy()
    packs = eco.get_packs_text()
    gifts = eco._get_gifts_menu()
    await update.message.reply_text(
        f"🏪 *Tienda C8L*\n\n{packs}\n\n{'─'*30}\n\n{gifts}",
        parse_mode="Markdown",
    )


async def cmd_withdraw(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handler para /retirar — Retirar diamantes."""
    from economy.c8l_economy import get_c8l_economy
    eco = get_c8l_economy()
    user_id = str(update.effective_user.id)
    text = update.message.text.replace("/retirar", "").strip()

    if not text or not text.isdigit():
        w = eco.get_wallet(user_id)
        await update.message.reply_text(
            f"💎 *Retirar Diamantes*\n\n"
            f"Tus diamantes: {w['diamonds']} 💎\n"
            f"Mínimo retiro: 1,000 💎 = $15 USD\n\n"
            f"Uso: `/retirar 1000`\n\n"
            f"_Ratio: 1,000 💎 = $15 USD_",
            parse_mode="Markdown",
        )
        return

    amount = int(text)
    result = eco.withdraw_diamonds(user_id, amount)
    await update.message.reply_text(result["message"], parse_mode="Markdown")

    # Visual Guide
    app.add_handler(CommandHandler("guide", cmd_guide))

    # Premium y Admin Panel
    app.add_handler(CommandHandler("premium", cmd_premium))
    app.add_handler(CommandHandler("admin", cmd_admin))
    app.add_handler(CommandHandler("admin_users", cmd_admin))
    app.add_handler(CommandHandler("admin_gencode", cmd_admin))
    app.add_handler(CommandHandler("admin_codes", cmd_admin))
    app.add_handler(CommandHandler("admin_set_premium", cmd_admin))
    app.add_handler(CommandHandler("admin_billing", cmd_admin))
    app.add_handler(CommandHandler("admin_credits", cmd_admin))

    # Economía C8L
    app.add_handler(CommandHandler("wallet", cmd_wallet))
    app.add_handler(CommandHandler("saldo", cmd_wallet))
    app.add_handler(CommandHandler("daily", cmd_daily))
    app.add_handler(CommandHandler("regalo", cmd_gift))
    app.add_handler(CommandHandler("gift", cmd_gift))
    app.add_handler(CommandHandler("comprar", cmd_buy))
    app.add_handler(CommandHandler("tienda", cmd_shop))
    app.add_handler(CommandHandler("retirar", cmd_withdraw))

    # Mensajes de texto (catch-all)
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_message))

    # Audio / Notas de voz
    app.add_handler(MessageHandler(filters.VOICE | filters.AUDIO, handle_voice))

    # Fotos
    app.add_handler(MessageHandler(filters.PHOTO, handle_photo))

    # Videos y video notas
    app.add_handler(MessageHandler(
        filters.VIDEO | filters.VIDEO_NOTE | filters.ANIMATION, handle_video))

    # Documentos
    app.add_handler(MessageHandler(filters.Document.ALL, handle_document))

    # Stickers
    app.add_handler(MessageHandler(filters.Sticker.ALL, handle_sticker))

    # Ubicación
    app.add_handler(MessageHandler(filters.LOCATION, handle_location))

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
