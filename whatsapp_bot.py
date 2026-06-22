# -*- coding: utf-8 -*-
"""
🏛️ C8L AGENT v17.0 — PANTEON MASTER
@leon_leo_bot — Bot principal de Telegram

Arquitectura: 1 Bot Maestro (Zeus) + 2 Skills Maestros (Minerva, Vulcano)
              + 8 Bots Esclavos (Aries, Hermes, Apolo, Ares, Hefesto, Artemisa, Atenea, Estia)

Motor: OpenRouter (DeepSeek V3 + Qwen3) — 100% gratuito
"""

import io, os, sys, logging, threading, requests, json, time
from http.server import BaseHTTPRequestHandler, HTTPServer
from datetime import datetime

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from config import *

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s - %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger("c8l.main")

# ---------------------------------------------------------------------------
# Import Panteon
# ---------------------------------------------------------------------------
from pantheon.zeus import analyze_intent, get_status_report
from pantheon.minerva import Minerva
from pantheon.vulcano import Vulcano
from pantheon.slaves.hermes_bot import Hermes
from pantheon.slaves.apolo import Apolo
from pantheon.slaves.ares import Ares
from pantheon.slaves.aries import Aries
from pantheon.slaves.hefesto import Hefesto
from pantheon.slaves.artemisa import Artemisa
from pantheon.slaves.atenea import Atenea
from pantheon.slaves.estia import Estia

# ---------------------------------------------------------------------------
# Inicializar agentes
# ---------------------------------------------------------------------------
minerva = Minerva()
vulcano = Vulcano()
hermes = Hermes()
apolo = Apolo()
ares_bot = Ares()
aries = Aries()
hefesto = Hefesto()
artemisa = Artemisa()
atenea = Atenea()
estia = Estia()

logger.info("🏛️ Panteon inicializado — 11 agentes activos")


# ---------------------------------------------------------------------------
# Telegram helpers
# ---------------------------------------------------------------------------
TG_API = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}"


def tg_send(chat_id, text, parse_mode=None):
    """Envia mensaje de texto (auto-split si >4096)."""
    while text:
        payload = {"chat_id": chat_id, "text": text[:4096]}
        if parse_mode:
            payload["parse_mode"] = parse_mode
        try:
            requests.post(f"{TG_API}/sendMessage", json=payload, timeout=10)
        except:
            pass
        text = text[4096:]


def tg_send_photo(chat_id, photo_bytes, caption=""):
    """Envia foto."""
    files = {"photo": ("image.jpg", io.BytesIO(photo_bytes), "image/jpeg")}
    data = {"chat_id": chat_id, "caption": caption[:1024]}
    requests.post(f"{TG_API}/sendPhoto", data=data, files=files, timeout=30)


def tg_send_document(chat_id, doc_bytes, filename, caption=""):
    """Envia documento/archivo."""
    files = {"document": (filename, io.BytesIO(doc_bytes), "application/octet-stream")}
    data = {"chat_id": chat_id, "caption": caption[:1024]}
    requests.post(f"{TG_API}/sendDocument", data=data, files=files, timeout=30)


def tg_typing(chat_id):
    """Muestra 'escribiendo...'"""
    try:
        requests.post(f"{TG_API}/sendChatAction", json={"chat_id": chat_id, "action": "typing"}, timeout=5)
    except:
        pass


def tg_upload_action(chat_id):
    """Muestra 'subiendo foto...'"""
    try:
        requests.post(f"{TG_API}/sendChatAction", json={"chat_id": chat_id, "action": "upload_photo"}, timeout=5)
    except:
        pass


def tg_doc_action(chat_id):
    """Muestra 'subiendo documento...'"""
    try:
        requests.post(f"{TG_API}/sendChatAction", json={"chat_id": chat_id, "action": "upload_document"}, timeout=5)
    except:
        pass


# ---------------------------------------------------------------------------
# History (conversacion)
# ---------------------------------------------------------------------------
_history = {}


def get_history(chat_id):
    return _history.setdefault(chat_id, [])


def add_history(chat_id, role, text):
    h = get_history(chat_id)
    h.append({"role": role, "text": text})
    if len(h) > MAX_HISTORY_PER_USER * 2:
        _history[chat_id] = h[-MAX_HISTORY_PER_USER:]


def get_history_text(chat_id, limit=20):
    """Historial como texto para contexto."""
    history = get_history(chat_id)
    return "\n".join(
        f"{'Usuario' if m['role'] == 'user' else 'Leo'}: {m['text']}"
        for m in history[-limit:]
    )


# ---------------------------------------------------------------------------
# PDF Generator
# ---------------------------------------------------------------------------
import re

def _strip_emojis(text):
    """Elimina emojis y caracteres no-ASCII problematicos para PDF."""
    # Eliminar emojis (rangos Unicode de emojis)
    emoji_pattern = re.compile(
        "["
        "\U0001F600-\U0001F64F"  # emoticons
        "\U0001F300-\U0001F5FF"  # symbols & pictographs
        "\U0001F680-\U0001F6FF"  # transport & map
        "\U0001F1E0-\U0001F1FF"  # flags
        "\U00002702-\U000027B0"  # dingbats
        "\U000024C2-\U0001F251"  # misc
        "\U0001f926-\U0001f937"
        "\U00010000-\U0010ffff"
        "\u2640-\u2642"
        "\u2600-\u2B55"
        "\u200d"
        "\u23cf"
        "\u23e9"
        "\u231a"
        "\ufe0f"
        "\u3030"
        "]+", flags=re.UNICODE
    )
    return emoji_pattern.sub("", text)


def generate_pdf(content, title="Documento C8L"):
    """Genera PDF real con fpdf2. Limpia emojis automaticamente."""
    try:
        from fpdf import FPDF
        from fpdf.enums import XPos, YPos

        # Limpiar emojis del contenido y titulo
        content = _strip_emojis(content)
        title = _strip_emojis(title)

        pdf = FPDF()
        pdf.add_page()
        pdf.set_auto_page_break(auto=True, margin=15)

        pdf.set_font("Helvetica", "B", 18)
        pdf.cell(0, 12, title, new_x=XPos.LMARGIN, new_y=YPos.NEXT, align="C")
        pdf.ln(5)
        pdf.set_font("Helvetica", "I", 10)
        pdf.cell(0, 8, f"C8L Agency - {datetime.now().strftime('%d/%m/%Y %H:%M')}",
                 new_x=XPos.LMARGIN, new_y=YPos.NEXT, align="C")
        pdf.ln(10)
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

        pdf.ln(10)
        pdf.set_font("Helvetica", "I", 9)
        pdf.cell(0, 8, "Generado por @leon_leo_bot - C8L Agency",
                 new_x=XPos.LMARGIN, new_y=YPos.NEXT, align="C")
        return pdf.output()
    except Exception as e:
        # Fallback: enviar como texto plano si PDF falla
        logger.warning(f"PDF generation failed: {e}")
        header = f"{'='*50}\n  {title}\n  C8L Agency\n{'='*50}\n\n"
        return (header + content).encode("utf-8")


# ---------------------------------------------------------------------------
# DISPATCH — Ejecuta la accion del agente asignado por Zeus
# ---------------------------------------------------------------------------
def dispatch_to_agent(intent_data, text, chat_id, user_name):
    """
    Ejecuta la tarea en el agente correcto segun la decision de Zeus.

    Args:
        intent_data: dict de Zeus con primary_agent, task_description, etc.
        text: mensaje original del usuario
        chat_id: ID del chat
        user_name: nombre del usuario

    Returns:
        None (envia respuesta directamente por Telegram)
    """
    agent = intent_data.get("primary_agent", "hermes")
    task = intent_data.get("task_description", text)
    intent = intent_data.get("intent", "chat")

    logger.info(f"  Dispatch -> {agent.upper()} | Task: {task[:60]}")

    try:
        if agent == "hermes":
            # Chat conversacional
            history_text = get_history_text(chat_id)
            reply = hermes.chat(text, user_name, history_text)
            if reply:
                add_history(chat_id, "user", text)
                add_history(chat_id, "assistant", reply)
                tg_send(chat_id, reply)
            else:
                tg_send(chat_id, "🔄 Error temporal. Intenta en unos segundos.")

        elif agent == "vulcano":
            # Creacion general (detecta tipo automaticamente)
            tg_typing(chat_id)
            result = vulcano.create(text)
            _send_creation_result(chat_id, result)

        elif agent == "apolo":
            # Musica
            tg_typing(chat_id)
            tg_send(chat_id, "🎵 Componiendo...")
            reply = apolo.compose(text)
            if reply:
                add_history(chat_id, "user", text)
                add_history(chat_id, "assistant", reply)
                tg_send(chat_id, reply)
            else:
                tg_send(chat_id, "❌ No pude generar la musica.")

        elif agent == "ares":
            # Video
            tg_typing(chat_id)
            tg_send(chat_id, "🎬 Creando guion y storyboard...")
            reply = ares_bot.create_script(text)
            if reply:
                if len(reply) > 3000:
                    pdf_bytes = generate_pdf(reply, f"Guion: {text[:40]}")
                    tg_send_document(chat_id, pdf_bytes, "guion_c8l.pdf",
                                     caption=f"🎬 Guion: {text[:60]}")
                else:
                    tg_send(chat_id, reply)
                # Bonus: imagen de primera escena
                tg_upload_action(chat_id)
                img = vulcano._generate_image_pollinations(f"cinematic scene: {text}")
                if img:
                    tg_send_photo(chat_id, img, caption="🎥 Preview escena 1")
            else:
                tg_send(chat_id, "❌ No pude generar el guion.")

        elif agent == "hefesto":
            # Diseno / Codigo / Juegos
            tg_typing(chat_id)
            tg_send(chat_id, "🖥️ Generando...")
            t = text.lower()
            if any(kw in t for kw in ["juego", "game", "snake", "tetris", "pong"]):
                result = hefesto.create_game(text)
            elif any(kw in t for kw in ["landing", "pagina", "web"]):
                result = hefesto.create_landing(text)
            else:
                result = hefesto.create_component(text)
            _send_creation_result(chat_id, result)

        elif agent == "artemisa":
            # Backend / API
            tg_typing(chat_id)
            tg_send(chat_id, "⚙️ Generando...")
            t = text.lower()
            if any(kw in t for kw in ["api", "endpoint", "rest"]):
                result = artemisa.create_api(text)
            else:
                result = artemisa.create_script(text)
            _send_creation_result(chat_id, result)

        elif agent == "atenea":
            # Estrategia / PDF / Articulos
            tg_typing(chat_id)
            t = text.lower()
            if any(kw in t for kw in ["pdf", "documento", "informe", "reporte"]):
                tg_send(chat_id, "📄 Generando documento...")
                content = atenea.generate_pdf_content(text)
                if content:
                    title = text[:50].replace("pdf", "").replace("documento", "").strip()
                    pdf_bytes = generate_pdf(content, title.title() or "Documento C8L")
                    ext = "pdf" if pdf_bytes[:4] == b"%PDF" else "txt"
                    tg_send_document(chat_id, pdf_bytes, f"c8l_documento.{ext}",
                                     caption=f"📄 {title.title()}")
                else:
                    tg_send(chat_id, "❌ No pude generar el documento.")
            elif any(kw in t for kw in ["estrategia", "marketing", "plan"]):
                tg_send(chat_id, "📊 Generando estrategia...")
                reply = atenea.create_strategy(text)
                if reply:
                    tg_send(chat_id, reply)
                else:
                    tg_send(chat_id, "❌ No pude generar la estrategia.")
            else:
                tg_send(chat_id, "📝 Generando articulo...")
                reply = atenea.create_article(text)
                if reply:
                    tg_send(chat_id, reply)
                else:
                    tg_send(chat_id, "❌ No pude generar el articulo.")

        elif agent == "aries":
            # Seguridad / Diagnostico
            tg_typing(chat_id)
            tg_send(chat_id, "🛡️ Escaneando...")
            reply = aries.diagnose()
            tg_send(chat_id, reply, parse_mode="Markdown")

        elif agent == "minerva":
            # Investigacion / Conocimiento
            tg_typing(chat_id)
            reply = minerva.research(text)
            if reply:
                add_history(chat_id, "user", text)
                add_history(chat_id, "assistant", reply)
                tg_send(chat_id, reply)
            else:
                tg_send(chat_id, "❌ No pude investigar eso.")

        elif agent == "estia":
            # Aprendizaje
            lesson = text.replace("/aprender", "").strip()
            if lesson:
                result = estia.learn(lesson)
                tg_send(chat_id, result)
            else:
                tg_send(chat_id, estia.get_stats())

        else:
            # Fallback a Hermes (chat)
            history_text = get_history_text(chat_id)
            reply = hermes.chat(text, user_name, history_text)
            if reply:
                add_history(chat_id, "user", text)
                add_history(chat_id, "assistant", reply)
                tg_send(chat_id, reply)
            else:
                tg_send(chat_id, "🔄 Error temporal.")

    except Exception as e:
        logger.error(f"Error en dispatch [{agent}]: {e}", exc_info=True)
        tg_send(chat_id, f"⚠️ Error en {agent}: {str(e)[:150]}")

    # Registrar en Estia (aprendizaje)
    try:
        estia.record_interaction(chat_id, user_name, text, intent, agent)
    except:
        pass


# ---------------------------------------------------------------------------
# Helper: enviar resultado de creacion (file/image/text/error)
# ---------------------------------------------------------------------------
def _send_creation_result(chat_id, result):
    """Envia el resultado de una creacion al chat."""
    if not result:
        tg_send(chat_id, "❌ Error en la creacion.")
        return

    rtype = result.get("type", "error")

    if rtype == "text":
        tg_send(chat_id, result["content"])
    elif rtype == "image":
        tg_upload_action(chat_id)
        tg_send_photo(chat_id, result["content"], caption=result.get("caption", ""))
    elif rtype == "file":
        tg_doc_action(chat_id)
        tg_send_document(chat_id, result["content"], result.get("filename", "archivo.txt"),
                         caption=result.get("caption", ""))
    elif rtype == "error":
        tg_send(chat_id, f"❌ {result.get('content', 'Error desconocido')}")
    else:
        tg_send(chat_id, str(result.get("content", "Resultado no reconocido")))


# ---------------------------------------------------------------------------
# Health check server
# ---------------------------------------------------------------------------
class HealthHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        info = {"status": "healthy", "bot": BOT_NAME, "version": "17.0",
                "architecture": "PANTEON_MASTER", "agents": 11, "time": time.time()}
        self.wfile.write(json.dumps(info).encode())

    def log_message(self, fmt, *args):
        return


# ---------------------------------------------------------------------------
# MAIN — Telegram Bot con los 12 comandos del Panteon
# ---------------------------------------------------------------------------
def main():
    from telebot import TeleBot

    logger.info("=" * 60)
    logger.info("  🏛️ C8L AGENT v17.0 — PANTEON MASTER")
    logger.info("  @leon_leo_bot — C8L Agency")
    logger.info("=" * 60)
    logger.info("  👑 Zeus (Director) — Online")
    logger.info("  🧠 Minerva (Sabio) — Online")
    logger.info("  🎨 Vulcano (Artesano) — Online")
    logger.info("  🛡️ Aries (Guardian) — Online")
    logger.info("  📢 Hermes (Comunicador) — Online")
    logger.info("  🎵 Apolo (Musico) — Online")
    logger.info("  🎬 Ares (Cineasta) — Online")
    logger.info("  🖥️ Hefesto (Disenador) — Online")
    logger.info("  ⚙️ Artemisa (Arquitecto) — Online")
    logger.info("  📊 Atenea (Estratega) — Online")
    logger.info("  🧬 Estia (Memoria) — Online")
    logger.info("=" * 60)
    logger.info(f"  Motor: OpenRouter (DeepSeek V3 + Qwen3)")
    logger.info(f"  Health: puerto {PORT}")
    logger.info("=" * 60)

    # Limpiar webhook viejo
    try:
        requests.post(f"{TG_API}/deleteWebhook", json={"drop_pending_updates": True}, timeout=10)
    except:
        pass

    # Health check
    threading.Thread(
        target=lambda: HTTPServer(("0.0.0.0", PORT), HealthHandler).serve_forever(),
        daemon=True
    ).start()

    bot = TeleBot(TELEGRAM_BOT_TOKEN)

    # Notificar admin
    try:
        bot.send_message(int(ADMIN_CHAT_ID),
            "🏛️ *PANTEON MASTER v17.0* — ACTIVO\n\n"
            "11 agentes operativos:\n"
            "👑 Zeus | 🧠 Minerva | 🎨 Vulcano\n"
            "🛡️ Aries | 📢 Hermes | 🎵 Apolo\n"
            "🎬 Ares | 🖥️ Hefesto | ⚙️ Artemisa\n"
            "📊 Atenea | 🧬 Estia\n\n"
            "Motor: OpenRouter (gratuito)\n"
            "Comandos: /help",
            parse_mode="Markdown")
    except Exception as e:
        logger.warning(f"No pude notificar admin: {e}")

    # === COMANDOS ===

    @bot.message_handler(commands=["start"])
    def cmd_start(msg):
        bot.reply_to(msg,
            f"🏛️ *PANTEON MASTER v17.0*\n\n"
            f"Hola {msg.from_user.first_name}! Soy el sistema multi-agente de C8L Agency.\n\n"
            "Tengo 11 agentes especializados. Solo dime que necesitas "
            "y Zeus (mi director) asignara al mejor agente:\n\n"
            "🎵 Musica → Apolo\n"
            "🎬 Video → Ares\n"
            "🖼️ Imagenes → Vulcano\n"
            "🖥️ Codigo/Juegos → Hefesto\n"
            "📄 Documentos → Atenea\n"
            "🛡️ Seguridad → Aries\n"
            "💬 Chat → Hermes\n\n"
            "Usa /help para ver todos los comandos.",
            parse_mode="Markdown")

    @bot.message_handler(commands=["help"])
    def cmd_help(msg):
        bot.reply_to(msg,
            "📚 *Comandos del Panteon:*\n\n"
            "/crear\\_musica [tema] — Componer cancion\n"
            "/crear\\_video [concepto] — Guion + storyboard\n"
            "/crear\\_imagen [descripcion] — Generar imagen\n"
            "/crear\\_landing [descripcion] — Landing page\n"
            "/crear\\_api [descripcion] — API backend\n"
            "/crear\\_articulo [tema] — Articulo SEO\n"
            "/diagnosticar — Escanear web C8L\n"
            "/aprender [leccion] — Registrar aprendizaje\n"
            "/estado — Estado de todos los agentes\n"
            "/informe — Informe de actividad\n"
            "/evolucion — Evolucion del sistema\n"
            "/clear — Limpiar historial\n\n"
            "O simplemente escribe lo que necesitas "
            "y Zeus lo asignara automaticamente.",
            parse_mode="Markdown")

    @bot.message_handler(commands=["estado", "status"])
    def cmd_estado(msg):
        tg_send(msg.chat.id, get_status_report(), parse_mode="Markdown")

    @bot.message_handler(commands=["clear"])
    def cmd_clear(msg):
        _history.pop(msg.chat.id, None)
        bot.reply_to(msg, "🗑️ Historial limpiado.")

    @bot.message_handler(commands=["diagnosticar"])
    def cmd_diagnosticar(msg):
        tg_typing(msg.chat.id)
        tg_send(msg.chat.id, "🛡️ Aries escaneando...")
        report = aries.diagnose()
        tg_send(msg.chat.id, report, parse_mode="Markdown")

    @bot.message_handler(commands=["informe"])
    def cmd_informe(msg):
        tg_send(msg.chat.id, estia.get_stats(), parse_mode="Markdown")

    @bot.message_handler(commands=["evolucion"])
    def cmd_evolucion(msg):
        tg_send(msg.chat.id, estia.get_evolution_report(), parse_mode="Markdown")

    @bot.message_handler(commands=["aprender"])
    def cmd_aprender(msg):
        lesson = msg.text.replace("/aprender", "").strip()
        if lesson:
            result = estia.learn(lesson)
            bot.reply_to(msg, result)
        else:
            bot.reply_to(msg, "Uso: /aprender [leccion a recordar]")

    @bot.message_handler(commands=["crear_musica"])
    def cmd_musica(msg):
        tema = msg.text.replace("/crear_musica", "").strip()
        if not tema:
            tema = "Bolero-House sobre el amor en la era digital"
        tg_typing(msg.chat.id)
        tg_send(msg.chat.id, "🎵 Apolo componiendo...")
        reply = apolo.compose(tema)
        if reply:
            tg_send(msg.chat.id, reply)
        else:
            tg_send(msg.chat.id, "❌ No pude componer la cancion.")
        estia.record_interaction(msg.chat.id, msg.from_user.first_name, tema, "musica", "apolo")

    @bot.message_handler(commands=["crear_video"])
    def cmd_video(msg):
        tema = msg.text.replace("/crear_video", "").strip()
        if not tema:
            tema = "Videoclip para cancion Bolero-House nocturna"
        tg_typing(msg.chat.id)
        tg_send(msg.chat.id, "🎬 Ares creando guion...")
        reply = ares_bot.create_script(tema)
        if reply:
            if len(reply) > 3000:
                pdf_bytes = generate_pdf(reply, f"Guion: {tema[:40]}")
                tg_send_document(msg.chat.id, pdf_bytes, "guion_c8l.pdf", caption=f"🎬 {tema[:60]}")
            else:
                tg_send(msg.chat.id, reply)
        else:
            tg_send(msg.chat.id, "❌ No pude crear el guion.")
        estia.record_interaction(msg.chat.id, msg.from_user.first_name, tema, "video", "ares")

    @bot.message_handler(commands=["crear_imagen"])
    def cmd_imagen(msg):
        desc = msg.text.replace("/crear_imagen", "").strip()
        if not desc:
            desc = "leon dorado en escenario de neon, estilo cyberpunk"
        tg_upload_action(msg.chat.id)
        tg_send(msg.chat.id, "🎨 Vulcano generando imagen...")
        result = vulcano.create(desc, creation_type="image")
        _send_creation_result(msg.chat.id, result)
        estia.record_interaction(msg.chat.id, msg.from_user.first_name, desc, "imagen", "vulcano")

    @bot.message_handler(commands=["crear_landing"])
    def cmd_landing(msg):
        desc = msg.text.replace("/crear_landing", "").strip()
        if not desc:
            desc = "landing page para C8L Agency estilo neon futurista"
        tg_typing(msg.chat.id)
        tg_send(msg.chat.id, "🖥️ Hefesto disenando...")
        result = hefesto.create_landing(desc)
        _send_creation_result(msg.chat.id, result)
        estia.record_interaction(msg.chat.id, msg.from_user.first_name, desc, "landing", "hefesto")

    @bot.message_handler(commands=["crear_api"])
    def cmd_api(msg):
        desc = msg.text.replace("/crear_api", "").strip()
        if not desc:
            desc = "API REST para gestionar canciones con CRUD"
        tg_typing(msg.chat.id)
        tg_send(msg.chat.id, "⚙️ Artemisa construyendo...")
        result = artemisa.create_api(desc)
        _send_creation_result(msg.chat.id, result)
        estia.record_interaction(msg.chat.id, msg.from_user.first_name, desc, "api", "artemisa")

    @bot.message_handler(commands=["crear_articulo"])
    def cmd_articulo(msg):
        tema = msg.text.replace("/crear_articulo", "").strip()
        if not tema:
            tema = "El futuro de la produccion musical con IA"
        tg_typing(msg.chat.id)
        tg_send(msg.chat.id, "📝 Atenea redactando...")
        reply = atenea.create_article(tema)
        if reply:
            tg_send(msg.chat.id, reply)
        else:
            tg_send(msg.chat.id, "❌ No pude crear el articulo.")
        estia.record_interaction(msg.chat.id, msg.from_user.first_name, tema, "articulo", "atenea")

    # === MENSAJE LIBRE (Zeus orquesta) ===

    @bot.message_handler(func=lambda m: True, content_types=["text"])
    def handle_msg(msg):
        chat_id = msg.chat.id
        user_name = msg.from_user.first_name or "Usuario"
        text = msg.text

        logger.info(f"[{user_name}] ({chat_id}): {text[:80]}")
        tg_typing(chat_id)

        # Zeus analiza y decide
        intent_data = analyze_intent(text, user_name)
        logger.info(f"  Zeus -> {intent_data.get('primary_agent', '?').upper()}")

        # Dispatch al agente correcto
        dispatch_to_agent(intent_data, text, chat_id, user_name)

    # === START POLLING ===
    logger.info("🏛️ PANTEON MASTER — POLLING activo")
    bot.infinity_polling(timeout=30, long_polling_timeout=25)


if __name__ == "__main__":
    main()
