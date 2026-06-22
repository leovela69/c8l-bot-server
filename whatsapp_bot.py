# -*- coding: utf-8 -*-
"""
@leon_leo_bot — Bot principal de C8L Agency
Funciones: Chat, Imagenes, Video (guiones), Codigo, PDF, Prompts musicales, AION
"""

import io, os, sys, logging, asyncio, threading, requests, json, time
from http.server import BaseHTTPRequestHandler, HTTPServer
from datetime import datetime

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from config import *

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s - %(message)s", handlers=[logging.StreamHandler(sys.stdout)])
logger = logging.getLogger("leovelabot")

# ---------------------------------------------------------------------------
# Async loop
# ---------------------------------------------------------------------------
_loop = asyncio.new_event_loop()
threading.Thread(target=_loop.run_forever, daemon=True).start()

def run_async(coro):
    return asyncio.run_coroutine_threadsafe(coro, _loop).result(timeout=120)

# ---------------------------------------------------------------------------
# Telegram helpers
# ---------------------------------------------------------------------------
TG_API = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}"

def tg_send(chat_id, text, parse_mode=None):
    while text:
        payload = {"chat_id": chat_id, "text": text[:4096]}
        if parse_mode:
            payload["parse_mode"] = parse_mode
        requests.post(f"{TG_API}/sendMessage", json=payload, timeout=10)
        text = text[4096:]

def tg_send_photo(chat_id, photo_bytes, caption=""):
    files = {"photo": ("image.jpg", io.BytesIO(photo_bytes), "image/jpeg")}
    data = {"chat_id": chat_id, "caption": caption[:1024]}
    requests.post(f"{TG_API}/sendPhoto", data=data, files=files, timeout=30)

def tg_send_document(chat_id, doc_bytes, filename, caption=""):
    files = {"document": (filename, io.BytesIO(doc_bytes), "application/octet-stream")}
    data = {"chat_id": chat_id, "caption": caption[:1024]}
    requests.post(f"{TG_API}/sendDocument", data=data, files=files, timeout=30)

def tg_typing(chat_id):
    requests.post(f"{TG_API}/sendChatAction", json={"chat_id": chat_id, "action": "typing"}, timeout=5)

def tg_upload_action(chat_id):
    requests.post(f"{TG_API}/sendChatAction", json={"chat_id": chat_id, "action": "upload_photo"}, timeout=5)

def tg_doc_action(chat_id):
    requests.post(f"{TG_API}/sendChatAction", json={"chat_id": chat_id, "action": "upload_document"}, timeout=5)

# ---------------------------------------------------------------------------
# History
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
# LLM Providers (cascading fallback)
# ---------------------------------------------------------------------------

def call_nvidia(prompt, system_prompt=""):
    """NVIDIA DeepSeek V4 Pro — modelo principal."""
    headers = {"Authorization": f"Bearer {NVIDIA_API_KEY}", "Content-Type": "application/json"}
    messages = []
    if system_prompt:
        messages.append({"role": "system", "content": system_prompt})
    messages.append({"role": "user", "content": prompt})
    r = requests.post(f"{NVIDIA_BASE_URL}/chat/completions", headers=headers,
        json={"model": NVIDIA_MODEL, "messages": messages, "temperature": 0.85, "max_tokens": 4096, "stream": False}, timeout=60)
    r.raise_for_status()
    return r.json()["choices"][0]["message"]["content"].strip()


def call_gemini(prompt, system_prompt=""):
    """Google Gemini — backup."""
    for key in [GEMINI_API_KEY, GEMINI_API_KEY_2]:
        if not key:
            continue
        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent?key={key}"
            parts = []
            if system_prompt:
                parts.append({"text": f"SISTEMA: {system_prompt}\n\nUSUARIO: {prompt}"})
            else:
                parts.append({"text": prompt})
            payload = {"contents": [{"parts": parts}], "generationConfig": {"temperature": 0.85, "maxOutputTokens": 4096}}
            r = requests.post(url, json=payload, timeout=60)
            r.raise_for_status()
            data = r.json()
            return data["candidates"][0]["content"]["parts"][0]["text"].strip()
        except Exception as e:
            logger.warning(f"Gemini key failed: {str(e)[:60]}")
            continue
    raise Exception("All Gemini keys failed")


def call_groq(prompt, system_prompt=""):
    """Groq Llama — rapido y gratis (si hay key)."""
    if not GROQ_API_KEY:
        raise Exception("No Groq API key configured")
    headers = {"Authorization": f"Bearer {GROQ_API_KEY}", "Content-Type": "application/json"}
    messages = []
    if system_prompt:
        messages.append({"role": "system", "content": system_prompt})
    messages.append({"role": "user", "content": prompt})
    r = requests.post("https://api.groq.com/openai/v1/chat/completions", headers=headers,
        json={"model": GROQ_MODEL, "messages": messages, "temperature": 0.85, "max_tokens": 4096}, timeout=30)
    r.raise_for_status()
    return r.json()["choices"][0]["message"]["content"].strip()


def generate_text(prompt, system_prompt=""):
    """Genera texto con cascada: NVIDIA -> Gemini -> Groq."""
    errors = []
    # 1. NVIDIA (principal)
    try:
        return call_nvidia(prompt, system_prompt)
    except Exception as e:
        errors.append(f"NVIDIA: {str(e)[:60]}")
        logger.warning(errors[-1])

    # 2. Gemini (backup)
    try:
        return call_gemini(prompt, system_prompt)
    except Exception as e:
        errors.append(f"Gemini: {str(e)[:60]}")
        logger.warning(errors[-1])

    # 3. Groq (si hay key)
    try:
        return call_groq(prompt, system_prompt)
    except Exception as e:
        errors.append(f"Groq: {str(e)[:60]}")
        logger.warning(errors[-1])

    logger.error(f"ALL LLMs FAILED: {errors}")
    return None


# ---------------------------------------------------------------------------
# CHAT
# ---------------------------------------------------------------------------
def process_chat(text, chat_id, user_name):
    """Procesa mensaje de chat con historial."""
    history = get_history(chat_id)
    ht = "\n".join(f"{'Usuario' if m['role']=='user' else 'Leo'}: {m['text']}" for m in history[-20:])
    prompt = f"El usuario se llama {user_name}.\n"
    if ht:
        prompt += f"Historial reciente:\n{ht}\n\n"
    prompt += f"Usuario: {text}\n\nLeo:"

    reply = generate_text(prompt, SYSTEM_PROMPT)
    if reply:
        add_history(chat_id, "user", text)
        add_history(chat_id, "assistant", reply)
    return reply


# ---------------------------------------------------------------------------
# IMAGENES
# ---------------------------------------------------------------------------
def generate_image(prompt):
    """Genera imagen con Pollinations.ai (gratis, sin API key)."""
    try:
        from urllib.parse import quote
        enhanced = f"high quality, detailed, professional: {prompt}"
        url = f"https://image.pollinations.ai/prompt/{quote(enhanced)}?width=1024&height=1024&nologo=true"
        r = requests.get(url, timeout=90)
        if r.status_code == 200 and "image" in r.headers.get("content-type", ""):
            return r.content
    except Exception as e:
        logger.error(f"Pollinations error: {e}")

    # Fallback: HuggingFace SDXL
    try:
        headers = {"Authorization": f"Bearer {HUGGINGFACE_TOKEN}"}
        payload = {"inputs": prompt}
        r = requests.post("https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0",
            headers=headers, json=payload, timeout=90)
        if r.status_code == 200 and "image" in r.headers.get("content-type", ""):
            return r.content
    except Exception as e:
        logger.error(f"HuggingFace error: {e}")

    return None


# ---------------------------------------------------------------------------
# CODIGO
# ---------------------------------------------------------------------------
def generate_code(prompt):
    """Genera codigo funcional y lo devuelve listo para archivo."""
    code_prompt = f"""Genera SOLO codigo basado en esta peticion: {prompt}

REGLAS:
- Si es un juego o app web: genera UN archivo HTML completo con CSS y JS inline
- Si es un script: genera el codigo Python/JS completo
- NO expliques nada, SOLO el codigo
- Empieza directamente con el codigo
- El codigo debe ser FUNCIONAL y COMPLETO
- Sin markdown, sin bloques de codigo, solo codigo puro"""

    code = generate_text(code_prompt, CODE_SYSTEM_PROMPT)
    if not code:
        return None

    # Limpiar markdown si el modelo lo agrego
    if code.startswith("```"):
        lines = code.split("\n")
        lines = lines[1:]
        if lines and lines[-1].strip() == "```":
            lines = lines[:-1]
        code = "\n".join(lines)

    return code


# ---------------------------------------------------------------------------
# VIDEO (guion + storyboard)
# ---------------------------------------------------------------------------
def generate_video_script(prompt):
    """Genera guion cinematografico completo con storyboard textual."""
    video_prompt = f"""Crea un guion completo para este video: {prompt}

Incluye:
1. CONCEPTO (1 linea)
2. DURACION ESTIMADA
3. GUION escena por escena (con tiempos)
4. STORYBOARD TEXTUAL: describe cada frame como imagen
5. MUSICA sugerida (genero, BPM, mood)
6. PROMPTS PARA IA: prompts listos para generar cada escena con Midjourney/DALL-E

Se cinematografico y detallado."""

    return generate_text(video_prompt, VIDEO_SYSTEM_PROMPT)


# ---------------------------------------------------------------------------
# PDF
# ---------------------------------------------------------------------------
def generate_pdf(content, title="Documento C8L"):
    """Genera un PDF real con formato usando fpdf2."""
    try:
        from fpdf import FPDF
        from fpdf.enums import XPos, YPos

        pdf = FPDF()
        pdf.add_page()
        pdf.set_auto_page_break(auto=True, margin=15)

        # Titulo
        pdf.set_font("Helvetica", "B", 18)
        pdf.cell(0, 12, title, new_x=XPos.LMARGIN, new_y=YPos.NEXT, align="C")
        pdf.ln(5)

        # Fecha
        pdf.set_font("Helvetica", "I", 10)
        pdf.cell(0, 8, f"C8L Agency - {datetime.now().strftime('%d/%m/%Y %H:%M')}", new_x=XPos.LMARGIN, new_y=YPos.NEXT, align="C")
        pdf.ln(10)

        # Contenido
        pdf.set_font("Helvetica", "", 11)
        for line in content.split("\n"):
            line = line.strip()
            if not line:
                pdf.ln(4)
            elif line.startswith("#") or (len(line) > 3 and line.isupper()):
                pdf.set_font("Helvetica", "B", 13)
                pdf.multi_cell(0, 7, line.lstrip("# "))
                pdf.set_font("Helvetica", "", 11)
                pdf.ln(2)
            else:
                pdf.multi_cell(0, 6, line)

        # Footer
        pdf.ln(10)
        pdf.set_font("Helvetica", "I", 9)
        pdf.cell(0, 8, "Generado por @leon_leo_bot - C8L Agency", new_x=XPos.LMARGIN, new_y=YPos.NEXT, align="C")

        return pdf.output()
    except ImportError:
        # Si no hay fpdf2, generar formato texto enriquecido
        logger.warning("fpdf2 no disponible, generando TXT")
        header = f"{'='*60}\n  {title}\n  C8L Agency - {datetime.now().strftime('%d/%m/%Y %H:%M')}\n{'='*60}\n\n"
        footer = f"\n\n{'='*60}\nGenerado por @leon_leo_bot - C8L Agency\n{'='*60}"
        return (header + content + footer).encode("utf-8")


# ---------------------------------------------------------------------------
# PROMPTS MUSICALES
# ---------------------------------------------------------------------------
def generate_music_prompt(prompt):
    """Genera prompt optimizado para Suno/Udio."""
    music_prompt = f"""El usuario quiere crear esta cancion/musica: {prompt}

Genera un prompt completo y optimizado para Suno AI o Udio, incluyendo:
- El prompt principal (optimizado para la IA musical)
- Estilo/genero especifico
- BPM sugerido
- Tipo de voz
- Estructura (verso, coro, bridge, etc.)
- Letra completa si aplica (con tags [Verse], [Chorus], etc.)
- Tips para mejores resultados"""

    return generate_text(music_prompt, MUSIC_SYSTEM_PROMPT)


# ---------------------------------------------------------------------------
# INTENT DETECTION
# ---------------------------------------------------------------------------
def detect_intent(text):
    """Detecta que quiere el usuario: image, code, video, pdf, prompt, status, chat."""
    t = text.lower().strip()

    # Comandos directos
    if t in ["/status", "/aion", "/equipo"]:
        return "status"

    img_kw = ["imagen", "dibuja", "genera imagen", "foto", "picture", "draw",
              "ilustra", "retrato", "logo", "banner", "disena", "diseña",
              "genera una imagen", "crea una imagen", "hazme una imagen",
              "genera un logo", "haz un dibujo"]
    code_kw = ["juego", "game", "codigo", "programa", "script", "app", "html",
               "snake", "tetris", "web", "pagina", "crea un juego", "programa un",
               "haz un juego", "genera codigo", "crea una app", "pong", "flappy"]
    video_kw = ["video", "clip", "animacion", "cortometraje", "guion para video",
                "storyboard", "crea un video", "haz un video"]
    pdf_kw = ["pdf", "documento", "informe", "reporte", "genera un pdf",
              "hazme un documento", "crea un informe", "ensayo", "articulo formal"]
    prompt_kw = ["prompt para suno", "prompt para udio", "cancion", "letra de",
                 "crea una cancion", "escribe una cancion", "genera musica",
                 "prompt musical", "haz un beat", "crea un tema"]

    if any(kw in t for kw in img_kw):
        return "image"
    elif any(kw in t for kw in code_kw):
        return "code"
    elif any(kw in t for kw in video_kw):
        return "video"
    elif any(kw in t for kw in pdf_kw):
        return "pdf"
    elif any(kw in t for kw in prompt_kw):
        return "prompt"
    else:
        return "chat"


# ---------------------------------------------------------------------------
# AION STATUS
# ---------------------------------------------------------------------------
def get_aion_status():
    """Obtiene el estado del sistema AION."""
    try:
        from bots.aion.coordinator import AION
        aion = AION()
        report = aion.get_telegram_report()
        return report
    except Exception as e:
        return (
            f"👑 AION Status:\n\n"
            f"✅ Bot activo y funcionando\n"
            f"🤖 Modelo: {NVIDIA_MODEL}\n"
            f"🖼️ Imagenes: Pollinations.ai + HuggingFace\n"
            f"💻 Codigo: Generacion de archivos\n"
            f"🎬 Video: Guiones + Storyboard\n"
            f"📄 PDF: Documentos con formato\n"
            f"🎵 Musica: Prompts para Suno/Udio\n\n"
            f"⏰ {datetime.now().strftime('%d/%m/%Y %H:%M')}"
        )


# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------
class HealthHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps({"status": "healthy", "bot": BOT_NAME, "time": time.time()}).encode())
    def log_message(self, fmt, *args): return


# ---------------------------------------------------------------------------
# MAIN
# ---------------------------------------------------------------------------
def main():
    from telebot import TeleBot

    logger.info("=" * 50)
    logger.info("  @leon_leo_bot — C8L Agency")
    logger.info("=" * 50)
    logger.info(f"  Chat: NVIDIA ({NVIDIA_MODEL}) + Gemini backup")
    logger.info(f"  Imagenes: Pollinations.ai + HuggingFace")
    logger.info(f"  Codigo: Archivos reales (HTML/Python)")
    logger.info(f"  Video: Guiones + Storyboard")
    logger.info(f"  PDF: Documentos con formato")
    logger.info(f"  Musica: Prompts para Suno/Udio")
    logger.info(f"  AION: Sistema de monitoreo")
    logger.info("=" * 50)

    # Limpiar webhook viejo
    try:
        requests.post(f"{TG_API}/deleteWebhook", json={"drop_pending_updates": True}, timeout=10)
    except:
        pass

    # Health check server
    threading.Thread(target=lambda: HTTPServer(("0.0.0.0", PORT), HealthHandler).serve_forever(), daemon=True).start()
    logger.info(f"Health check en puerto {PORT}")

    bot = TeleBot(TELEGRAM_BOT_TOKEN)

    # Notificar admin
    try:
        bot.send_message(int(ADMIN_CHAT_ID),
            "🚀 Bot ACTIVO — C8L Agency\n\n"
            "Funciones operativas:\n"
            "💬 Chat inteligente\n"
            "🖼️ Imagenes (Pollinations + HF)\n"
            "💻 Codigo/Juegos (archivos)\n"
            "🎬 Video (guiones completos)\n"
            "📄 PDF (documentos reales)\n"
            "🎵 Prompts musicales (Suno/Udio)\n"
            "👑 /status — Estado del sistema\n"
            "🗑️ /clear — Limpiar historial")
    except Exception as e:
        logger.warning(f"No pude notificar admin: {e}")

    # === HANDLERS ===

    @bot.message_handler(commands=["start"])
    def cmd_start(msg):
        bot.reply_to(msg,
            f"👋 Hola {msg.from_user.first_name}! Soy Leo de C8L Agency.\n\n"
            "Puedo hacer:\n"
            "🖼️ *Imagenes* — \"genera una imagen de...\"\n"
            "💻 *Codigo/Juegos* — \"crea un juego snake\"\n"
            "🎬 *Video* — \"haz un video de...\"\n"
            "📄 *PDF* — \"genera un informe sobre...\"\n"
            "🎵 *Musica* — \"crea una cancion de...\"\n"
            "💬 *Chat* — preguntame lo que quieras\n\n"
            "Comandos:\n"
            "/status — Estado del sistema\n"
            "/clear — Limpiar historial\n\n"
            "Escribeme lo que necesites! 🎯",
            parse_mode="Markdown")

    @bot.message_handler(commands=["clear"])
    def cmd_clear(msg):
        _history.pop(msg.chat.id, None)
        bot.reply_to(msg, "🗑️ Historial limpiado. Empecemos de nuevo!")

    @bot.message_handler(commands=["status", "aion"])
    def cmd_status(msg):
        tg_typing(msg.chat.id)
        status = get_aion_status()
        bot.reply_to(msg, status)

    @bot.message_handler(commands=["help"])
    def cmd_help(msg):
        bot.reply_to(msg,
            "📚 *Guia rapida:*\n\n"
            "🖼️ Imagenes:\n"
            "  • \"genera una imagen de un atardecer\"\n"
            "  • \"dibuja un logo futurista\"\n\n"
            "💻 Codigo:\n"
            "  • \"crea un juego snake en HTML\"\n"
            "  • \"programa un script de calculadora\"\n\n"
            "🎬 Video:\n"
            "  • \"haz un video de un producto tech\"\n"
            "  • \"crea un storyboard para un corto\"\n\n"
            "📄 PDF:\n"
            "  • \"genera un informe sobre IA\"\n"
            "  • \"crea un documento sobre marketing\"\n\n"
            "🎵 Musica:\n"
            "  • \"crea una cancion de reggaeton\"\n"
            "  • \"prompt para suno estilo bolero house\"\n\n"
            "💬 Cualquier otra cosa = conversacion!",
            parse_mode="Markdown")

    @bot.message_handler(func=lambda m: True, content_types=["text"])
    def handle_msg(msg):
        chat_id = msg.chat.id
        user_name = msg.from_user.first_name or "Usuario"
        text = msg.text
        logger.info(f"[{user_name}] ({chat_id}): {text[:80]}")

        intent = detect_intent(text)
        logger.info(f"  Intent: {intent}")

        try:
            # ---- IMAGENES ----
            if intent == "image":
                tg_upload_action(chat_id)
                tg_send(chat_id, "🎨 Generando imagen...")
                img = generate_image(text)
                if img:
                    tg_send_photo(chat_id, img, caption=f"🎨 {text[:100]}")
                else:
                    tg_send(chat_id, "❌ No pude generar la imagen. Intenta con otra descripcion.")
                return

            # ---- CODIGO ----
            elif intent == "code":
                tg_typing(chat_id)
                tg_send(chat_id, "💻 Generando codigo...")
                code = generate_code(text)
                if code:
                    # Detectar extension
                    if "<!DOCTYPE" in code or "<html" in code.lower():
                        ext = "html"
                    elif "import " in code[:100] and "def " in code:
                        ext = "py"
                    elif "function " in code or "const " in code or "let " in code:
                        ext = "js"
                    else:
                        ext = "html"

                    filename = f"c8l_{text[:20].replace(' ', '_').lower()}.{ext}"
                    filename = "".join(c for c in filename if c.isalnum() or c in "._-")
                    tg_send_document(chat_id, code.encode("utf-8"), filename,
                        caption=f"💻 {text[:100]}\n\nAbre el archivo para usarlo!")
                else:
                    tg_send(chat_id, "❌ No pude generar el codigo. Intenta de nuevo.")
                return

            # ---- VIDEO ----
            elif intent == "video":
                tg_typing(chat_id)
                tg_send(chat_id, "🎬 Creando guion y storyboard...")
                script = generate_video_script(text)
                if script:
                    # Enviar como mensaje (si es corto) o como documento
                    if len(script) > 3000:
                        try:
                            pdf_bytes = generate_pdf(script, f"Guion: {text[:40]}")
                            tg_send_document(chat_id, pdf_bytes, f"guion_c8l.pdf",
                                caption=f"🎬 Guion completo: {text[:80]}")
                        except:
                            tg_send_document(chat_id, script.encode("utf-8"), "guion_c8l.txt",
                                caption=f"🎬 Guion: {text[:80]}")
                    else:
                        tg_send(chat_id, f"🎬 GUION Y STORYBOARD\n\n{script}")

                    # Bonus: generar imagen de la primera escena
                    tg_upload_action(chat_id)
                    scene_img = generate_image(f"cinematic scene, film still: {text}")
                    if scene_img:
                        tg_send_photo(chat_id, scene_img, caption="🎥 Preview de la primera escena")
                else:
                    tg_send(chat_id, "❌ No pude generar el guion. Intenta de nuevo.")
                return

            # ---- PDF ----
            elif intent == "pdf":
                tg_typing(chat_id)
                tg_send(chat_id, "📄 Generando documento...")
                content = generate_text(
                    f"Genera un documento profesional completo sobre: {text}\n\n"
                    "Incluye: titulo, introduccion, desarrollo con secciones, conclusion. "
                    "Formato claro con titulos en MAYUSCULAS. Minimo 500 palabras.",
                    SYSTEM_PROMPT
                )
                if content:
                    tg_doc_action(chat_id)
                    title = text.replace("pdf", "").replace("documento", "").replace("informe", "").strip()[:50]
                    if not title:
                        title = "Documento C8L"
                    pdf_bytes = generate_pdf(content, title.title())
                    ext = "pdf" if isinstance(pdf_bytes, bytes) and pdf_bytes[:4] == b"%PDF" else "txt"
                    if isinstance(pdf_bytes, bytearray):
                        ext = "pdf" if pdf_bytes[:4] == b"%PDF" else "txt"
                    tg_send_document(chat_id, pdf_bytes, f"documento_c8l.{ext}",
                        caption=f"📄 {title.title()}\n\nGenerado por C8L Agency")
                else:
                    tg_send(chat_id, "❌ No pude generar el documento. Intenta de nuevo.")
                return

            # ---- PROMPTS MUSICALES ----
            elif intent == "prompt":
                tg_typing(chat_id)
                tg_send(chat_id, "🎵 Creando prompt musical...")
                music = generate_music_prompt(text)
                if music:
                    tg_send(chat_id, music)
                    add_history(chat_id, "user", text)
                    add_history(chat_id, "assistant", music)
                else:
                    tg_send(chat_id, "❌ No pude generar el prompt musical. Intenta de nuevo.")
                return

            # ---- STATUS ----
            elif intent == "status":
                status = get_aion_status()
                tg_send(chat_id, status)
                return

            # ---- CHAT ----
            else:
                tg_typing(chat_id)
                reply = process_chat(text, chat_id, user_name)
                if reply:
                    tg_send(chat_id, reply)
                else:
                    tg_send(chat_id, "🔄 Error temporal. Intentalo en 30 segundos.")

        except Exception as e:
            logger.error(f"Error procesando mensaje: {e}", exc_info=True)
            tg_send(chat_id, f"⚠️ Error: {str(e)[:200]}\n\nIntenta de nuevo en unos segundos.")

    logger.info("🚀 @leon_leo_bot POLLING — Listo para recibir mensajes")
    bot.infinity_polling(timeout=30, long_polling_timeout=25)


if __name__ == "__main__":
    main()
