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
from pantheon.slaves.guardian import Guardian
from pantheon.slaves.tv_publisher import TVPublisher

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
guardian = Guardian()
tv_publisher = TVPublisher()

logger.info("🏛️ Panteon inicializado — 12 agentes + Guardian + TVPublisher activos")


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
            "12 agentes operativos:\n"
            "👑 Zeus | 🧠 Minerva | 🎨 Vulcano\n"
            "🛡️ Aries | 📢 Hermes | 🎵 Apolo\n"
            "🎬 Ares | 🖥️ Hefesto | ⚙️ Artemisa\n"
            "📊 Atenea | 🧬 Estia | 📺 TVPublisher\n\n"
            "Motor: OpenRouter (gratuito)\n"
            "📺 C8L TV: Canal Oficial ACTIVO\n"
            "Comandos: /help | /publicar_tv | /llenar_tv",
            parse_mode="Markdown")
    except Exception as e:
        logger.warning(f"No pude notificar admin: {e}")

    # Auto-publicar contenido inicial en C8L TV (en background)
    def _auto_publish_tv():
        """Publica los 8 videos iniciales en C8L TV al arrancar."""
        time.sleep(5)  # Esperar a que el bot este estable
        try:
            logger.info("📺 Auto-publicando contenido inicial en C8L TV...")
            result = tv_publisher.publish_initial_content()
            logger.info(f"📺 Batch TV: {result['success']}/{result['total']} publicados")
        except Exception as e:
            logger.error(f"📺 Error en auto-publish TV: {e}")

    threading.Thread(target=_auto_publish_tv, daemon=True).start()

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
            "🎵 /crear\\_musica [tema] — Componer cancion\n"
            "🎬 /crear\\_video [concepto] — Guion + storyboard\n"
            "🖼️ /crear\\_imagen [descripcion] — Generar imagen\n"
            "🖥️ /crear\\_landing [descripcion] — Landing page\n"
            "⚙️ /crear\\_api [descripcion] — API backend\n"
            "📝 /crear\\_articulo [tema] — Articulo SEO\n"
            "🛡️ /diagnosticar — Escanear web C8L\n"
            "🧬 /aprender [leccion] — Registrar aprendizaje\n"
            "📊 /estado — Estado de todos los agentes\n"
            "📄 /informe — Informe de actividad\n"
            "🔄 /evolucion — Evolucion del sistema\n"
            "🗑️ /clear — Limpiar historial\n\n"
            "*📺 C8L TV (Canal Oficial):*\n"
            "/publicar\\_tv [tema] — Publicar en TV\n"
            "/llenar\\_tv — Subir 8 videos iniciales\n"
            "/tv\\_generar [tema] — Generar con IA y publicar\n"
            "/tv\\_stats — Stats del canal\n\n"
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

    # === COMANDOS DE MODERACION (C8L Guardian) ===

    def _is_admin(msg):
        return str(msg.from_user.id) == str(ADMIN_CHAT_ID)

    @bot.message_handler(commands=["warn"])
    def cmd_warn(msg):
        if not _is_admin(msg):
            return bot.reply_to(msg, "\U0001f6ab Solo el admin puede usar este comando.")
        if not msg.reply_to_message:
            return bot.reply_to(msg, "Uso: Responde al mensaje del usuario con /warn [motivo]")
        target = msg.reply_to_message.from_user
        reason = msg.text.replace("/warn", "").strip() or "Comportamiento inadecuado"
        result = guardian.warn_user(target.id, target.first_name, reason, msg.from_user.first_name)
        tg_send(msg.chat.id, result["message"], parse_mode="Markdown")
        if result.get("auto_ban"):
            tg_send(msg.chat.id, "\U0001f6a8 AUTO-BAN: 3 advertencias. Sancion 3 dias aplicada.", parse_mode="Markdown")

    @bot.message_handler(commands=["ban"])
    def cmd_ban(msg):
        if not _is_admin(msg):
            return bot.reply_to(msg, "\U0001f6ab Solo el admin puede usar este comando.")
        if not msg.reply_to_message:
            return bot.reply_to(msg, "Uso: Responde con /ban 3d|7d|30d|perm [motivo]")
        target = msg.reply_to_message.from_user
        if str(target.id) == str(ADMIN_CHAT_ID):
            return bot.reply_to(msg, "No puedes banearte a ti mismo.")
        parts = msg.text.replace("/ban", "").strip().split(None, 1)
        duration = parts[0] if parts else "3d"
        reason = parts[1] if len(parts) > 1 else "Infraccion de normas"
        if duration not in ["3d", "7d", "30d", "perm"]:
            return bot.reply_to(msg, f"Duracion invalida: {duration}. Usa: 3d, 7d, 30d, perm")
        result = guardian.ban_user(target.id, target.first_name, duration, reason, msg.from_user.first_name)
        if result["success"]:
            tg_send(msg.chat.id, result["message"], parse_mode="Markdown")
            try:
                tg_send(target.id, result["message"], parse_mode="Markdown")
            except: pass
            try:
                bot.restrict_chat_member(msg.chat.id, target.id,
                    until_date=int(time.time()) + (result["sanction_data"]["expires_at"] - time.time() if result["sanction_data"]["expires_at"] > 0 else 366*86400),
                    can_send_messages=False, can_send_media_messages=False, can_send_other_messages=False)
            except: pass

    @bot.message_handler(commands=["unban"])
    def cmd_unban(msg):
        if not _is_admin(msg):
            return bot.reply_to(msg, "\U0001f6ab Solo el admin.")
        if msg.reply_to_message:
            target_id = msg.reply_to_message.from_user.id
        else:
            parts = msg.text.replace("/unban", "").strip()
            if parts.isdigit():
                target_id = int(parts)
            else:
                return bot.reply_to(msg, "Uso: Responde o /unban [user_id]")
        result = guardian.unban_user(target_id, msg.from_user.first_name)
        tg_send(msg.chat.id, result["message"], parse_mode="Markdown")
        if result["success"]:
            try:
                bot.restrict_chat_member(msg.chat.id, target_id, can_send_messages=True, can_send_media_messages=True, can_send_other_messages=True)
            except: pass

    @bot.message_handler(commands=["banlist"])
    def cmd_banlist(msg):
        if not _is_admin(msg):
            return bot.reply_to(msg, "\U0001f6ab Solo el admin.")
        tg_send(msg.chat.id, guardian.get_ban_list(), parse_mode="Markdown")

    @bot.message_handler(commands=["infracciones"])
    def cmd_infracciones(msg):
        if not _is_admin(msg):
            return bot.reply_to(msg, "\U0001f6ab Solo el admin.")
        if msg.reply_to_message:
            target_id = msg.reply_to_message.from_user.id
        else:
            parts = msg.text.replace("/infracciones", "").strip()
            target_id = int(parts) if parts.isdigit() else msg.from_user.id
        tg_send(msg.chat.id, guardian.get_user_infractions(target_id), parse_mode="Markdown")

    @bot.message_handler(commands=["modlog"])
    def cmd_modlog(msg):
        if not _is_admin(msg):
            return bot.reply_to(msg, "\U0001f6ab Solo el admin.")
        tg_send(msg.chat.id, guardian.get_mod_log(), parse_mode="Markdown")

    # === Middleware: bloquear usuarios baneados ===
    @bot.message_handler(func=lambda m: guardian.is_banned(m.from_user.id)["banned"],
                         content_types=["text", "photo", "video", "audio", "document", "sticker"])
    def handle_banned(msg):
        ban = guardian.is_banned(msg.from_user.id)["sanction_data"]
        try:
            bot.reply_to(msg, f"\U0001f6ab Cuenta suspendida hasta: {ban.get('end_date','PERMANENTE')}\nContacto: moderacion@c8l.agency")
            bot.delete_message(msg.chat.id, msg.message_id)
        except: pass

    # === COMANDOS DE C8L TV (Canal Oficial del Bot) ===

    @bot.message_handler(commands=["publicar_tv", "tv_publish"])
    def cmd_publicar_tv(msg):
        """Publica contenido en C8L TV. Solo admin."""
        if not _is_admin(msg):
            return bot.reply_to(msg, "\U0001f6ab Solo el admin puede publicar en TV.")
        tema = msg.text.replace("/publicar_tv", "").replace("/tv_publish", "").strip()
        if not tema:
            bot.reply_to(msg, "📺 Generando contenido automatico para C8L TV...")
            result = tv_publisher.generate_and_publish()
        else:
            bot.reply_to(msg, f"📺 Publicando en C8L TV: {tema[:50]}...")
            result = tv_publisher.publish(
                title=tema[:60],
                description=f"Publicado manualmente por el admin",
                content_type="video",
                emoji="🎬"
            )
        if result["success"]:
            tg_send(msg.chat.id, f"✅ Publicado en C8L TV!\n\nID: {result.get('postId', 'N/A')}\n{result['message']}")
        else:
            tg_send(msg.chat.id, f"❌ Error: {result['message']}")

    @bot.message_handler(commands=["tv_batch", "llenar_tv"])
    def cmd_tv_batch(msg):
        """Publica los 8 videos iniciales en C8L TV. Solo admin."""
        if not _is_admin(msg):
            return bot.reply_to(msg, "\U0001f6ab Solo el admin.")
        bot.reply_to(msg, "📺 Subiendo 8 videos al canal oficial de C8L TV...\nEsto tarda unos segundos.")
        result = tv_publisher.publish_initial_content()
        tg_send(msg.chat.id,
            f"📺 *C8L TV — Batch completado*\n\n"
            f"✅ Exitosos: {result['success']}\n"
            f"❌ Fallidos: {result['failed']}\n"
            f"📊 Total: {result['total']}\n\n"
            f"El canal oficial ya tiene contenido!",
            parse_mode="Markdown")

    @bot.message_handler(commands=["tv_stats", "tv_estado"])
    def cmd_tv_stats(msg):
        """Ver estadisticas del canal de TV."""
        tg_send(msg.chat.id, tv_publisher.get_stats(), parse_mode="Markdown")

    @bot.message_handler(commands=["tv_generar"])
    def cmd_tv_generar(msg):
        """Genera contenido con IA y lo publica. Solo admin."""
        if not _is_admin(msg):
            return bot.reply_to(msg, "\U0001f6ab Solo el admin.")
        tema = msg.text.replace("/tv_generar", "").strip()
        bot.reply_to(msg, f"🤖 Generando contenido{'  sobre: ' + tema if tema else ' aleatorio'}...")
        result = tv_publisher.generate_and_publish(tema)
        if result["success"]:
            tg_send(msg.chat.id, f"✅ Video generado y publicado!\n{result['message']}")
        else:
            tg_send(msg.chat.id, f"❌ Fallo: {result['message']}")

    # === COMANDOS DE AJEDREZ (C8L Chess Master) ===

    @bot.message_handler(commands=["ajedrez", "chess"])
    def cmd_chess(msg):
        """Inicia partida de ajedrez. Uso: /ajedrez [nivel 1-6] [estilo]"""
        from chess.chess_game import start_game, get_game, end_game
        from chess.chess_ai import LEVEL_NAMES, STYLES
        from chess.chess_ranking import update_after_game

        chat_id = msg.chat.id
        # Si ya hay partida activa
        if get_game(chat_id):
            bot.reply_to(msg, "Ya tienes una partida activa. Usa /mover [movimiento] o /rendirse")
            return

        parts = msg.text.replace("/ajedrez", "").replace("/chess", "").strip().split()
        level = 3
        style = 'balanced'
        if parts:
            try:
                level = int(parts[0])
                level = max(1, min(6, level))
            except:
                pass
        if len(parts) > 1 and parts[1] in STYLES:
            style = parts[1]

        game = start_game(chat_id, msg.from_user.first_name, level, style)
        info = game.ai.get_level_info()

        reply = (
            f"♟️ *C8L CHESS MASTER*\n\n"
            f"Nivel: {info['level']} — {info['name']}\n"
            f"Estilo: {info['style']}\n"
            f"Tu: Blancas | IA: Negras\n\n"
            f"{game.get_board_display('c8l')}\n\n"
            f"Tu turno! Usa /mover [movimiento]\n"
            f"Ej: /mover e4, /mover Nf3, /mover O-O\n\n"
            f"Comandos: /mover | /rendirse | /tablero | /skin"
        )
        tg_send(chat_id, reply, parse_mode="Markdown")

    @bot.message_handler(commands=["mover", "move"])
    def cmd_move(msg):
        """Hace un movimiento. Uso: /mover e4"""
        from chess.chess_game import get_game, end_game
        from chess.chess_ranking import update_after_game

        chat_id = msg.chat.id
        game = get_game(chat_id)
        if not game:
            bot.reply_to(msg, "No tienes partida activa. Usa /ajedrez para empezar.")
            return

        move_str = msg.text.replace("/mover", "").replace("/move", "").strip()
        if not move_str:
            bot.reply_to(msg, "Uso: /mover e4\nMovimientos legales: " + game._legal_moves_str())
            return

        # Movimiento del jugador
        ok, result_msg = game.make_player_move(move_str)
        if not ok:
            bot.reply_to(msg, result_msg)
            return

        # Verificar estado
        status = game.get_status()
        if status in ('checkmate_win', 'stalemate', 'insufficient'):
            _handle_game_end(msg, game, status)
            return

        # Movimiento de la IA
        tg_typing(chat_id)
        ai_move = game.make_ai_move()
        if ai_move is None:
            _handle_game_end(msg, game, 'checkmate_win')
            return

        # Verificar estado post-IA
        status = game.get_status()
        if status in ('checkmate_loss', 'stalemate', 'insufficient'):
            _handle_game_end(msg, game, status)
            return

        check_text = " ⚠️ JAQUE!" if status == 'check' else ""
        reply = (
            f"♟️ Tu: {move_str} | IA: {ai_move}{check_text}\n\n"
            f"{game.get_board_display('c8l')}\n\n"
            f"Tu turno! /mover [movimiento]"
        )
        tg_send(chat_id, reply)

    @bot.message_handler(commands=["rendirse", "resign"])
    def cmd_resign(msg):
        from chess.chess_game import get_game, end_game
        from chess.chess_ranking import update_after_game
        chat_id = msg.chat.id
        game = get_game(chat_id)
        if not game:
            return bot.reply_to(msg, "No hay partida activa.")
        stats, achievements = update_after_game(msg.from_user.id, msg.from_user.first_name, 'loss', game.ai.level)
        end_game(chat_id)
        tg_send(chat_id, f"🏳️ Te has rendido.\nELO: {stats['elo']} ({'-' if stats['elo'] < 1200 else '+'})\n\nUsa /ajedrez para nueva partida.")

    @bot.message_handler(commands=["tablero", "board"])
    def cmd_board(msg):
        from chess.chess_game import get_game
        game = get_game(msg.chat.id)
        if not game:
            return bot.reply_to(msg, "No hay partida activa.")
        tg_send(msg.chat.id, game.get_board_display('c8l'))

    @bot.message_handler(commands=["ranking_chess", "rankingchess"])
    def cmd_ranking_chess(msg):
        from chess.chess_ranking import get_ranking_text
        tg_send(msg.chat.id, get_ranking_text(), parse_mode="Markdown")

    @bot.message_handler(commands=["elo"])
    def cmd_elo(msg):
        from chess.chess_ranking import get_player_stats
        stats = get_player_stats(msg.from_user.id)
        tg_send(msg.chat.id,
            f"📊 *Tu perfil Chess*\n\n"
            f"ELO: {stats['elo']} (peak: {stats['peak']})\n"
            f"Partidas: {stats['games']}\n"
            f"Victorias: {stats['wins']} | Derrotas: {stats['losses']} | Tablas: {stats['draws']}\n"
            f"Racha actual: {stats['streak']} | Max: {stats['max_streak']}\n\n"
            f"🤖 C8L Chess Master",
            parse_mode="Markdown")

    def _handle_game_end(msg, game, status):
        from chess.chess_game import end_game
        from chess.chess_ranking import update_after_game
        chat_id = msg.chat.id
        if status == 'checkmate_win':
            result = 'win'
            text = "🎉 *JAQUE MATE!* Ganaste!"
        elif status == 'checkmate_loss':
            result = 'loss'
            text = "💀 *JAQUE MATE.* La IA gano."
        else:
            result = 'draw'
            text = "🤝 *TABLAS.* Empate."

        stats, achievements = update_after_game(msg.from_user.id, msg.from_user.first_name, result, game.ai.level)
        elo_change = stats['elo'] - 1200  # Simplified
        pgn = game.get_pgn()
        end_game(chat_id)

        reply = (
            f"{text}\n\n"
            f"{game.get_board_display('c8l')}\n\n"
            f"📊 ELO: {stats['elo']} | Racha: {stats['streak']}\n"
            f"PGN: {pgn[:100]}{'...' if len(pgn) > 100 else ''}\n"
        )

        # Logros
        if achievements:
            reply += "\n🏆 *Logros desbloqueados:*\n"
            for ach in achievements:
                reply += f"  {ach['icon']} {ach['name']} (+{ach['coins']} C8L)\n"

        reply += "\n/ajedrez para nueva partida"
        tg_send(chat_id, reply, parse_mode="Markdown")

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
