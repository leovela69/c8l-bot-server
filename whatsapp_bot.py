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

# Import Group System
from group_personality import GROUP_SYSTEM_PROMPT, COMUNICADO_PROMPT, get_random_auto_message
from group_scheduler import GroupScheduler

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

logger.info("🏛️ Panteon inicializado — 11 agentes + Guardian activos")


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
# BROADCAST AL GRUPO — Corazones Locos
# ---------------------------------------------------------------------------
def broadcast_to_group(text, parse_mode="HTML"):
    """Envia mensaje al grupo de Telegram (Corazones Locos).
    Solo funciona si GROUP_CHAT_ID esta configurado."""
    from config import GROUP_CHAT_ID
    if not GROUP_CHAT_ID:
        logger.debug("Broadcast ignorado: GROUP_CHAT_ID no configurado")
        return False
    try:
        payload = {"chat_id": GROUP_CHAT_ID, "text": text[:4096], "parse_mode": parse_mode}
        r = requests.post(f"{TG_API}/sendMessage", json=payload, timeout=10)
        if r.status_code == 200:
            logger.info(f"📢 Broadcast al grupo OK")
            return True
        else:
            logger.warning(f"Broadcast fallo: {r.status_code} — {r.text[:100]}")
            return False
    except Exception as e:
        logger.warning(f"Broadcast error: {e}")
        return False


def broadcast_level_up(user_name, new_level, level_name):
    """Notifica al grupo cuando un usuario sube de nivel."""
    text = (
        f"⬆️ <b>LEVEL UP!</b>\n\n"
        f"🎮 <b>{user_name}</b> alcanzó nivel {new_level}!\n"
        f"🏅 Rango: <i>{level_name}</i>\n\n"
        f"🏛️ <i>C8L Agency — Panteón</i>"
    )
    broadcast_to_group(text)


def broadcast_new_member(user_name):
    """Notifica al grupo cuando se registra un nuevo miembro."""
    text = (
        f"🆕 <b>NUEVO MIEMBRO!</b>\n\n"
        f"👋 <b>{user_name}</b> se unió a C8L Agency!\n"
        f"Bienvenido al Panteón 🏛️\n\n"
        f"<i>Escribe /start para comenzar</i>"
    )
    broadcast_to_group(text)


def broadcast_content_created(user_name, content_type, description=""):
    """Notifica al grupo cuando se crea contenido nuevo."""
    icons = {"musica": "🎵", "video": "🎬", "imagen": "🖼️", "codigo": "💻", "articulo": "📝"}
    icon = icons.get(content_type, "✨")
    text = (
        f"{icon} <b>NUEVO CONTENIDO!</b>\n\n"
        f"👤 <b>{user_name}</b> creó: {content_type}\n"
        f"{f'📌 {description[:100]}' if description else ''}\n\n"
        f"🏛️ <i>C8L Agency — Creadores</i>"
    )
    broadcast_to_group(text)


def broadcast_announcement(title, message):
    """Envía un anuncio general al grupo."""
    text = (
        f"📢 <b>{title}</b>\n\n"
        f"{message}\n\n"
        f"🏛️ <i>C8L Agency</i>"
    )
    broadcast_to_group(text)


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
            # Pasar el texto original del usuario para que el prompt enhancer lo interprete completo
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

    # Scheduler de mensajes automaticos al grupo
    scheduler = GroupScheduler(broadcast_to_group)
    scheduler.start()
    logger.info("📅 Scheduler de grupo activo — mensajes cada ~4h")

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

    # Enviar foto de saludo al grupo
    def _send_startup_photo():
        """Genera y envia una imagen de saludo al grupo al arrancar."""
        try:
            from config import GROUP_CHAT_ID
            if not GROUP_CHAT_ID:
                return
            time.sleep(5)  # Esperar a que todo este listo
            logger.info("📸 Generando imagen de saludo para el grupo...")
            greeting_prompt = "Epic futuristic pantheon temple with neon lights and digital energy, cyberpunk style, a glowing lion emblem at the center, text-free, dramatic cinematic lighting, purple and gold color scheme, digital art, highly detailed, 8k resolution"
            img = vulcano._generate_image_pollinations(greeting_prompt, "cyberpunk")
            if img:
                caption = (
                    "🏛️ <b>C8L AGENCY — PANTEÓN ACTIVO</b>\n\n"
                    "✅ 11 agentes listos para servir.\n"
                    "🎨 Vulcano ahora genera imágenes PRO en cualquier estilo:\n"
                    "• 3D, Anime, Pixel Art, Fotorealista\n"
                    "• Logo, Pintura, Cyberpunk, Comic\n"
                    "• Y mucho más...\n\n"
                    "Escribe: <i>imagen [lo que quieras]</i>\n"
                    "O usa: /crear_imagen [descripción]\n\n"
                    "🔥 <i>@leon_leo_bot — C8L Agency v17.0</i>"
                )
                files = {"photo": ("saludo.jpg", io.BytesIO(img), "image/jpeg")}
                data = {"chat_id": GROUP_CHAT_ID, "caption": caption, "parse_mode": "HTML"}
                requests.post(f"{TG_API}/sendPhoto", data=data, files=files, timeout=30)
                logger.info("📸 Foto de saludo enviada al grupo!")
            else:
                # Si no se pudo generar imagen, al menos enviar texto
                broadcast_to_group(
                    "🏛️ <b>C8L AGENCY — PANTEÓN ACTIVO</b>\n\n"
                    "✅ 11 agentes operativos.\n"
                    "🎨 Nuevo: imágenes PRO en cualquier estilo (3D, anime, realista...)\n\n"
                    "Escribe: <i>imagen [lo que quieras]</i>\n\n"
                    "🔥 <i>@leon_leo_bot — v17.0</i>"
                )
        except Exception as e:
            logger.warning(f"No pude enviar foto de saludo al grupo: {e}")

    threading.Thread(target=_send_startup_photo, daemon=True).start()

    # === COMANDOS ===

    @bot.message_handler(commands=["start"])
    def cmd_start(msg):
        user_name = msg.from_user.first_name
        bot.reply_to(msg,
            f"🏛️ *PANTEON MASTER v17.0*\n\n"
            f"Hola {user_name}! Soy el sistema multi-agente de C8L Agency.\n\n"
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
        # Broadcast: nuevo miembro
        broadcast_new_member(user_name)

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

    @bot.message_handler(commands=["groupid"])
    def cmd_groupid(msg):
        """Muestra el ID del chat actual y lo guarda si es grupo."""
        import config as cfg
        chat_id = msg.chat.id
        chat_type = msg.chat.type
        chat_title = msg.chat.title or "Privado"

        # Si es grupo, guardar automaticamente
        if 'group' in chat_type:
            cfg.GROUP_CHAT_ID = str(chat_id)
            bot.reply_to(msg,
                f"✅ *Grupo detectado y guardado!*\n\n"
                f"ID: `{chat_id}`\n"
                f"Titulo: {chat_title}\n\n"
                f"El bot ahora enviará broadcasts aquí automáticamente.\n"
                f"🏛️ C8L Agency conectado!",
                parse_mode="Markdown")
            # Enviar mensaje de confirmacion al grupo
            broadcast_to_group(
                f"🏛️ <b>C8L AGENCY — BOT CONECTADO</b>\n\n"
                f"✅ El Panteón está activo en este grupo.\n"
                f"Aquí llegarán las notificaciones de:\n"
                f"⬆️ Level ups\n"
                f"🆕 Nuevos miembros\n"
                f"✨ Contenido creado\n"
                f"📢 Anuncios\n\n"
                f"<i>@leon_leo_bot — 11 agentes a tu servicio</i>"
            )
        else:
            bot.reply_to(msg,
                f"📋 *Info del chat:*\n\n"
                f"ID: `{chat_id}`\n"
                f"Tipo: {chat_type}\n\n"
                f"⚠️ Este es un chat privado. Usa este comando en el grupo.",
                parse_mode="Markdown")

    @bot.message_handler(commands=["anunciar"])
    def cmd_anunciar(msg):
        """Admin: envía un anuncio al grupo. Uso: /anunciar [mensaje]"""
        if not _is_admin(msg):
            return bot.reply_to(msg, "🚫 Solo el admin puede hacer anuncios.")
        texto = msg.text.replace("/anunciar", "").strip()
        if not texto:
            return bot.reply_to(msg, "Uso: /anunciar [tu mensaje para el grupo]")
        ok = broadcast_announcement("ANUNCIO", texto)
        if ok:
            bot.reply_to(msg, "✅ Anuncio enviado al grupo!")
        else:
            bot.reply_to(msg, "❌ No pude enviar. ¿El bot está en el grupo? Usa /groupid en el grupo primero.")

    @bot.message_handler(commands=["comunicado"])
    def cmd_comunicado(msg):
        """Admin: genera comunicado estilo Leo Vela con IA. Uso: /comunicado [tema] [pilar]"""
        if not _is_admin(msg):
            return bot.reply_to(msg, "🚫 Solo el admin.")
        parts = msg.text.replace("/comunicado", "").strip()
        if not parts:
            return bot.reply_to(msg,
                "📡 *Uso:* /comunicado [tema]\n\n"
                "Ejemplos:\n"
                "• /comunicado productividad\n"
                "• /comunicado musica experimental\n"
                "• /comunicado motivacion lunes\n"
                "• /comunicado web registro\n\n"
                "O usa /comunicado random para uno aleatorio.",
                parse_mode="Markdown")

        if parts.lower() == "random":
            # Enviar mensaje aleatorio predefinido
            message = get_random_auto_message()
            ok = broadcast_to_group(message, "HTML")
            if ok:
                bot.reply_to(msg, "✅ Comunicado random enviado al grupo!")
            else:
                bot.reply_to(msg, "❌ No pude enviar.")
            return

        # Detectar pilar
        pilar = "motivacion"
        for p in ["tareas", "musica", "motivacion", "web"]:
            if p in parts.lower():
                pilar = p
                break

        # Generar con IA
        tg_typing(msg.chat.id)
        bot.reply_to(msg, f"📡 Generando comunicado ({pilar})...")

        from openrouter_client import call_openrouter
        prompt = COMUNICADO_PROMPT.format(tema=parts, pilar=pilar)
        reply = call_openrouter(
            prompt=prompt,
            system_prompt="Eres el generador de comunicados de C8L Agency.",
            agent_name="hermes",
            temperature=0.9
        )
        if reply:
            ok = broadcast_to_group(reply, "HTML")
            if ok:
                bot.reply_to(msg, f"✅ Comunicado enviado al grupo!\n\nPreview:\n{reply[:200]}...")
            else:
                # Si falla HTML, intentar sin parse_mode
                ok2 = broadcast_to_group(reply, None)
                if ok2:
                    bot.reply_to(msg, "✅ Comunicado enviado (texto plano).")
                else:
                    bot.reply_to(msg, f"❌ No pude enviar al grupo. Preview:\n\n{reply[:500]}")
        else:
            bot.reply_to(msg, "❌ No pude generar el comunicado. Intenta con /comunicado random")

    @bot.message_handler(commands=["grupo_msg"])
    def cmd_grupo_msg(msg):
        """Admin: envía mensaje predefinido por categoría. Uso: /grupo_msg tareas|musica|motivacion|web"""
        if not _is_admin(msg):
            return bot.reply_to(msg, "🚫 Solo el admin.")
        cat = msg.text.replace("/grupo_msg", "").strip().lower()
        if cat not in ["tareas", "musica", "motivacion", "web"]:
            return bot.reply_to(msg, "Uso: /grupo_msg tareas|musica|motivacion|web")
        message = get_random_auto_message(cat)
        ok = broadcast_to_group(message, "HTML")
        if ok:
            bot.reply_to(msg, f"✅ Mensaje de {cat} enviado al grupo!")
        else:
            bot.reply_to(msg, "❌ No pude enviar.")

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
        if reply:
            broadcast_content_created(msg.from_user.first_name, "musica", tema)

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
        if reply:
            broadcast_content_created(msg.from_user.first_name, "video", tema)

    @bot.message_handler(commands=["crear_imagen"])
    def cmd_imagen(msg):
        desc = msg.text.replace("/crear_imagen", "").strip()
        if not desc:
            desc = "leon dorado en escenario de neon, estilo cyberpunk"
        tg_upload_action(msg.chat.id)
        tg_send(msg.chat.id, "🎨 Vulcano interpretando tu idea y generando imagen...")
        result = vulcano.create(desc, creation_type="image")
        _send_creation_result(msg.chat.id, result)
        estia.record_interaction(msg.chat.id, msg.from_user.first_name, desc, "imagen", "vulcano")
        if result and result.get("type") == "image":
            broadcast_content_created(msg.from_user.first_name, "imagen", desc)

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
        chat_type = msg.chat.type

        # En GRUPOS: solo responder si mencionan al bot o hacen reply a un mensaje del bot
        if 'group' in chat_type:
            is_mention = f"@{BOT_NAME}" in text.lower() or "@leon_leo_bot" in text.lower()
            is_reply_to_bot = (msg.reply_to_message and
                               msg.reply_to_message.from_user and
                               msg.reply_to_message.from_user.username == BOT_NAME)
            if not is_mention and not is_reply_to_bot:
                return  # No responder a mensajes normales del grupo

            # Limpiar la mencion del texto
            text = text.replace(f"@{BOT_NAME}", "").replace("@leon_leo_bot", "").strip()
            if not text:
                text = "hola"

            # En grupo: usar personalidad villano empoderado
            logger.info(f"[GRUPO] [{user_name}]: {text[:80]}")
            tg_typing(chat_id)
            _respond_in_group(chat_id, text, user_name)
            return

        # En PRIVADO: flujo normal con Zeus
        logger.info(f"[{user_name}] ({chat_id}): {text[:80]}")
        tg_typing(chat_id)

        # Zeus analiza y decide
        intent_data = analyze_intent(text, user_name)
        logger.info(f"  Zeus -> {intent_data.get('primary_agent', '?').upper()}")

        # Dispatch al agente correcto
        dispatch_to_agent(intent_data, text, chat_id, user_name)


    def _respond_in_group(chat_id, text, user_name):
        """Responde en el grupo usando la personalidad del villano empoderado."""
        from openrouter_client import call_openrouter
        try:
            reply = call_openrouter(
                prompt=f"{user_name} dice en el grupo: {text}",
                system_prompt=GROUP_SYSTEM_PROMPT,
                agent_name="hermes",
                temperature=0.9
            )
            if reply:
                tg_send(chat_id, reply)
            else:
                tg_send(chat_id, "Rakata! 🎧 Error temporal, criaturas. Volved a intentarlo. (Boom!)")
        except Exception as e:
            logger.error(f"Error respondiendo en grupo: {e}")
            tg_send(chat_id, "⚡ El Panteon recarga energia... un momento.")

    # === START POLLING ===
    logger.info("🏛️ PANTEON MASTER — POLLING activo")
    bot.infinity_polling(timeout=30, long_polling_timeout=25)


if __name__ == "__main__":
    main()
