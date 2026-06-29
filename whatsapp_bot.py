# -*- coding: utf-8 -*-
"""
🏛️ C8L AGENT v17.0 — PANTEON MASTER
@leon_leo_bot — Bot principal de Telegram

Arquitectura: 1 Bot Maestro (Zeus) + 2 Skills Maestros (Minerva, Vulcano)
              + 8 Bots Esclavos (Aries, Hermes, Apolo, Ares, Hefesto, Artemisa, Atenea, Estia)

Motor: OpenRouter (DeepSeek V3 + Qwen3) — 100% gratuito
"""

import io, os, sys, logging, threading, requests, json, time, traceback
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

# Import Evolution Engine
from pantheon.evolution import evolution

# Import Smart Memory + Tools
from pantheon.smart_memory import smart_memory
from pantheon.tools import (
    generate_qr, translate_text, summarize_url,
    levels, get_trivia_question, schedule_message,
    generate_dj_prompt, generate_playlist,
    generate_social_post, get_shop_text,
    get_pending_scheduled
)

# Import Auto-Repair Engine
from pantheon.auto_repair import auto_repair, auto_capture

# Import Hermes Watchdog (reanimador + puente con Sayan)
try:
    from hermes_watchdog import hermes_watchdog
    hermes_watchdog.start()
    logger.info("📢 Hermes Watchdog activo — vigilando + puente Sayan")
except Exception as _hw_err:
    logger.warning(f"⚠️ Hermes Watchdog no pudo arrancar: {_hw_err}")

# Import Suno Auto-Healer (arranca monitoreo de token en background)
try:
    from suno_auto_healer import start_healer
    _suno_healer = start_healer()
    logger.info("🔄 Suno Auto-Healer iniciado en background")
except Exception as _healer_err:
    logger.warning(f"⚠️ Suno Auto-Healer no pudo arrancar: {_healer_err}")
    _suno_healer = None

# Import Hyperframes Video Engine (HTML → MP4)
try:
    from hyperframes.telegram_handler import handle_video_command, is_video_intent, get_video_prompt_from_text
    from hyperframes.engine import HyperframesEngine
    _hyperframes_engine = HyperframesEngine()
    _hyperframes_available = True
    logger.info("🎬 Hyperframes Engine cargado")
except Exception as _hf_err:
    logger.warning(f"⚠️ Hyperframes no disponible: {_hf_err}")
    _hyperframes_available = False
    _hyperframes_engine = None

# Import SkillScan Security Scanner
try:
    from skillscan.telegram_handler import handle_scan_command
    _skillscan_available = True
    logger.info("🛡️ SkillScan Security Scanner cargado")
except Exception as _ss_err:
    logger.warning(f"⚠️ SkillScan no disponible: {_ss_err}")
    _skillscan_available = False

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

# Descargar fuentes para el Logo Engine
try:
    from install_fonts import download_fonts
    download_fonts()
    logger.info("🎨 Fuentes del Logo Engine actualizadas")
except Exception as e:
    logger.warning(f"No pude descargar fuentes: {e}")


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


def tg_send_video(chat_id, video_bytes, filename="video.mp4", caption=""):
    """Envia video MP4 o GIF animado."""
    mime = "video/mp4" if filename.endswith(".mp4") else "image/gif"
    files = {"video": (filename, io.BytesIO(video_bytes), mime)}
    data = {"chat_id": chat_id, "caption": caption[:1024]}
    try:
        r = requests.post(f"{TG_API}/sendVideo", data=data, files=files, timeout=120)
        if r.status_code != 200:
            logger.warning(f"sendVideo fallo ({r.status_code}), enviando como documento...")
            # Fallback: enviar como documento si es muy grande
            files2 = {"document": (filename, io.BytesIO(video_bytes), mime)}
            requests.post(f"{TG_API}/sendDocument", data=data, files=files2, timeout=120)
    except Exception as e:
        logger.warning(f"tg_send_video error: {e}")


def tg_send_animation(chat_id, gif_bytes, caption=""):
    """Envia GIF animado como animacion."""
    files = {"animation": ("animation.gif", io.BytesIO(gif_bytes), "image/gif")}
    data = {"chat_id": chat_id, "caption": caption[:1024]}
    try:
        requests.post(f"{TG_API}/sendAnimation", data=data, files=files, timeout=60)
    except Exception as e:
        logger.warning(f"tg_send_animation error: {e}")


def tg_video_action(chat_id):
    """Muestra 'subiendo video...'"""
    try:
        requests.post(f"{TG_API}/sendChatAction", json={"chat_id": chat_id, "action": "upload_video"}, timeout=5)
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

# Memoria de ultima imagen generada por chat (para edicion)
_last_image = {}  # {chat_id: {"bytes": b"...", "prompt": "..."}}


def get_history(chat_id):
    return _history.setdefault(chat_id, [])


def save_last_image(chat_id, image_bytes, prompt=""):
    """Guarda la ultima imagen generada para edicion posterior."""
    _last_image[chat_id] = {"bytes": image_bytes, "prompt": prompt}


def get_last_image(chat_id):
    """Recupera la ultima imagen generada para este chat."""
    return _last_image.get(chat_id)


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
    """Genera PDF real con fpdf2. Limpia emojis y corta lineas largas."""
    try:
        from fpdf import FPDF
        from fpdf.enums import XPos, YPos

        # Limpiar emojis del contenido y titulo
        content = _strip_emojis(content)
        title = _strip_emojis(title)

        # Cortar palabras muy largas (>50 chars) que rompen el PDF
        import re
        content = re.sub(r'(\S{50,})', lambda m: ' '.join([m.group(0)[i:i+50] for i in range(0, len(m.group(0)), 50)]), content)

        pdf = FPDF()
        pdf.add_page()
        pdf.set_auto_page_break(auto=True, margin=15)

        pdf.set_font("Helvetica", "B", 18)
        safe_title = title[:80] if len(title) > 80 else title
        pdf.cell(0, 12, safe_title, new_x=XPos.LMARGIN, new_y=YPos.NEXT, align="C")
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
                safe_line = line.lstrip("# ")[:200]
                pdf.multi_cell(0, 7, safe_line)
                pdf.set_font("Helvetica", "", 11)
                pdf.ln(2)
            else:
                safe_line = line[:500] if len(line) > 500 else line
                pdf.multi_cell(0, 6, safe_line)

        pdf.ln(10)
        pdf.set_font("Helvetica", "I", 9)
        pdf.cell(0, 8, "Generado por @leon_leo_bot - C8L Agency",
                 new_x=XPos.LMARGIN, new_y=YPos.NEXT, align="C")
        return pdf.output()
    except Exception as e:
        # Fallback: generar PDF minimo con solo el texto
        logger.warning(f"PDF generation failed: {e}")
        try:
            from fpdf import FPDF
            pdf = FPDF()
            pdf.add_page()
            pdf.set_font("Helvetica", "", 10)
            safe_content = re.sub(r'[^\x20-\x7E\n]', '', content)[:3000]
            for line in safe_content.split("\n"):
                pdf.multi_cell(0, 5, line[:150])
            return pdf.output()
        except:
            return b"%PDF-1.4 empty"


# ---------------------------------------------------------------------------
# DISPATCH — Ejecuta la accion del agente asignado por Zeus
# ---------------------------------------------------------------------------
def dispatch_to_agent(intent_data, text, chat_id, user_name):
    """
    Ejecuta la tarea en el agente correcto segun la decision de Zeus.
    Errores se capturan automáticamente para auto-repair.
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

            # Registrar generación para auto-evolución
            evolution.record_generation(chat_id, text, "vulcano", "creation")

            # Detectar si quiere EDITAR la ultima imagen
            edit_keywords = ["mejora", "cambia", "edita", "modifica", "corrige", "arregla",
                            "hazla", "ponle", "quitale", "aclara", "oscurece", "voltea",
                            "rota", "agranda", "achica", "mas grande", "mas pequeño",
                            "mas oscuro", "mas claro", "otro color", "sin fondo"]
            is_edit = any(kw in text.lower() for kw in edit_keywords)
            last_img = get_last_image(chat_id)

            if is_edit and last_img:
                tg_send(chat_id, "🎨 Editando imagen anterior...")
                edited = vulcano.edit_image_gemini(last_img["bytes"], text)
                if edited:
                    save_last_image(chat_id, edited, text)
                    tg_send_photo(chat_id, edited, caption=f"✅ {text[:100]}")
                else:
                    tg_send(chat_id, "⚠️ No pude editar. Generando nueva...")
                    result = vulcano.create(text)
                    _send_creation_result(chat_id, result)
                    if result and result.get("type") == "image":
                        save_last_image(chat_id, result["content"], text)
            else:
                result = vulcano.create(text)
                _send_creation_result(chat_id, result)
                # Guardar imagen si se genero una
                if result and result.get("type") == "image":
                    save_last_image(chat_id, result["content"], text)

        elif agent == "apolo":
            # Musica — Genera MUSICA REAL con Suno AI Premium via Bridge
            tg_typing(chat_id)

            # Detectar modo
            t_lower = text.lower()
            has_structure = any(tag in text for tag in ["[Verse", "[Chorus", "[Bridge", "[Intro", "[Outro"])
            is_instrumental = any(kw in t_lower for kw in ["instrumental", "sin voz", "beat", "pista"])

            mode = "custom" if has_structure else "simple"

            def _gen_apolo():
                try:
                    from suno_bot_bridge import get_suno_bridge
                    bridge = get_suno_bridge("APOLO")

                    result = bridge.create_and_send(
                        chat_id=str(chat_id),
                        prompt=text,
                        title="C8L Creation" if has_structure else "",
                        tags="",
                        user_id=str(chat_id),
                        mode=mode,
                        instrumental=is_instrumental,
                        bot_name="APOLO",
                        bot_token=TELEGRAM_BOT_TOKEN,
                        send_status_updates=True,
                    )

                    if result["success"]:
                        remaining = result.get("credits_remaining", "?")
                        tg_send(chat_id,
                            f"✅ {result['count']} canción(es) generada(s)!\n"
                            f"💰 Restantes hoy: {remaining}")
                        broadcast_content_created(user_name, "musica_suno", text[:60])
                        _send_feedback_buttons(chat_id)

                    # Registrar para auto-evolución
                    evolution.record_generation(chat_id, text, "apolo", "musica")

                except Exception as e:
                    logger.error(f"Apolo/Suno bridge error: {e}")
                    tg_send(chat_id, f"❌ Error: {str(e)[:150]}")

            threading.Thread(target=_gen_apolo, daemon=True).start()

        elif agent == "ares":
            # Video — detectar si es mejor usar Hyperframes (HTML→MP4) o Ares (AI video gen)
            t_lower = text.lower()
            use_hyperframes = _hyperframes_available and any(kw in t_lower for kw in [
                'html', 'hyperframe', 'template', 'animación html', 'render html',
                'motion graphic', 'tipografía', 'kinetic', 'intro animado',
                'promo animada', 'stats video', 'logo animado'
            ])

            if use_hyperframes:
                # Usar Hyperframes para videos basados en HTML/templates
                tg_typing(chat_id)
                tg_send(chat_id, "🎬 Generando video con Hyperframes Engine...")

                def _hf_dispatch():
                    try:
                        import asyncio
                        loop = asyncio.new_event_loop()
                        asyncio.set_event_loop(loop)
                        result = loop.run_until_complete(
                            handle_video_command(
                                text=text, chat_id=chat_id, user_name=user_name,
                                send_fn=tg_send, typing_fn=tg_typing,
                                video_fn=tg_send_video, video_action_fn=tg_video_action
                            )
                        )
                        loop.close()
                        if result.get('status') == 'ok':
                            _send_feedback_buttons(chat_id)
                    except Exception as e:
                        logger.error(f"Hyperframes dispatch error: {e}")
                        tg_send(chat_id, f"❌ Error Hyperframes: {str(e)[:150]}")

                threading.Thread(target=_hf_dispatch, daemon=True).start()
            else:
                # Video estándar con Ares (AI video generation)
                tg_typing(chat_id)
                tg_send(chat_id, "🎬 Generando video con IA... (puede tardar 1-3 min)")
                tg_video_action(chat_id)

                # Registrar para auto-evolución
                evolution.record_generation(chat_id, text, "ares", "video")

                result = ares_bot.process(text, user_name)
                if result:
                    rtype = result.get("type", "error")
                    if rtype == "video":
                        # Video real generado — enviar como video MP4/GIF
                        tg_video_action(chat_id)
                        video_bytes = result["content"]
                        filename = result.get("filename", "c8l_video.mp4")
                        caption = result.get("caption", "🎬 Video generado por ARES")
                        fmt = result.get("format", "mp4")

                        if fmt == "gif":
                            tg_send_animation(chat_id, video_bytes, caption=caption)
                        else:
                            tg_send_video(chat_id, video_bytes, filename=filename, caption=caption)
                        _send_feedback_buttons(chat_id)

                    elif rtype == "text":
                        # Guion/storyboard o fallback texto
                        content = result["content"]
                        if len(content) > 3000:
                            pdf_bytes = generate_pdf(content, f"Video: {text[:40]}")
                            tg_send_document(chat_id, pdf_bytes, "video_c8l.pdf",
                                             caption=f"🎬 {text[:60]}")
                        else:
                            tg_send(chat_id, content)
                        _send_feedback_buttons(chat_id)

                    elif rtype == "error":
                        tg_send(chat_id, result.get("content", "❌ Error generando video."))
                    else:
                        tg_send(chat_id, str(result.get("content", "Resultado no reconocido")))
                else:
                    tg_send(chat_id, "❌ No pude generar el video. Intenta de nuevo en unos minutos.")

        elif agent == "hefesto":
            # Diseno / Codigo / Juegos
            tg_typing(chat_id)
            tg_send(chat_id, "🖥️ Hefesto generando...")
            t = text.lower()
            if any(kw in t for kw in ["juego", "game", "snake", "tetris", "pong"]):
                result = hefesto.create_game(text)
            elif any(kw in t for kw in ["landing", "pagina", "web"]):
                result = hefesto.create_landing(text)
            else:
                result = hefesto.create_component(text)

            # Enviar resultado + link
            if result and result.get("type") == "file":
                tg_doc_action(chat_id)
                caption = result.get("caption", "")
                tg_send_document(chat_id, result["content"], result.get("filename", "code.html"), caption=caption)
                # Mandar link para abrir
                url = result.get("url", "")
                if url:
                    tg_send(chat_id, f"🌐 *Abrir en navegador:*\n{url}", parse_mode="Markdown")
                _send_feedback_buttons(chat_id)
            elif result:
                _send_creation_result(chat_id, result)
            else:
                tg_send(chat_id, "❌ No pude generar el código.")

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
        # Auto-repair: capturar error
        auto_repair.capture_error(
            error_type=type(e).__name__,
            error_msg=str(e),
            file_path="whatsapp_bot.py",
            function_name=f"dispatch_to_agent/{agent}",
            code_context=f"agent={agent}, text={text[:50]}",
            full_traceback=traceback.format_exc()
        )

    # Registrar en Estia (aprendizaje)
    try:
        estia.record_interaction(chat_id, user_name, text, intent, agent)
    except:
        pass


# ---------------------------------------------------------------------------
# Helper: enviar resultado de creacion (file/image/text/error)
# ---------------------------------------------------------------------------
def _send_creation_result(chat_id, result):
    """Envia el resultado de una creacion al chat + botones 👍👎."""
    if not result:
        tg_send(chat_id, "❌ Error en la creacion.")
        return

    rtype = result.get("type", "error")

    if rtype == "text":
        tg_send(chat_id, result["content"])
        _send_feedback_buttons(chat_id)
    elif rtype == "image":
        tg_upload_action(chat_id)
        tg_send_photo(chat_id, result["content"], caption=result.get("caption", ""))
        _send_feedback_buttons(chat_id)
    elif rtype == "file":
        tg_doc_action(chat_id)
        tg_send_document(chat_id, result["content"], result.get("filename", "archivo.txt"),
                         caption=result.get("caption", ""))
        _send_feedback_buttons(chat_id)
    elif rtype == "error":
        tg_send(chat_id, f"❌ {result.get('content', 'Error desconocido')}")
    else:
        tg_send(chat_id, str(result.get("content", "Resultado no reconocido")))


def _send_feedback_buttons(chat_id):
    """Envía botones 👍👎 para feedback de auto-evolución."""
    try:
        keyboard = {
            "inline_keyboard": [
                [
                    {"text": "👍 Me gusta", "callback_data": "feedback_positive"},
                    {"text": "👎 No es lo que pedí", "callback_data": "feedback_negative"},
                ]
            ]
        }
        payload = {
            "chat_id": chat_id,
            "text": "¿Qué te pareció? Tu feedback ayuda al bot a evolucionar 🧬",
            "reply_markup": json.dumps(keyboard)
        }
        requests.post(f"{TG_API}/sendMessage", json=payload, timeout=10)
    except:
        pass


# ---------------------------------------------------------------------------
# Health check server + WhatsApp Webhook + Páginas HTML
# ---------------------------------------------------------------------------
# Almacén en memoria de páginas generadas (no se pierde mientras el bot viva)
_generated_pages = {}  # {page_id: html_content}

# URL actual del tunnel Cloudflare (se actualiza via POST /api/set-tunnel-url)
_tunnel_url = os.environ.get("TUNNEL_URL", "")


class HealthHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        # --- Tunnel URL discovery endpoint ---
        if self.path == "/api/tunnel-url":
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(json.dumps({
                "tunnel_url": _tunnel_url,
                "available": bool(_tunnel_url)
            }).encode())
            return

        # Servir páginas HTML generadas por Hefesto (desde memoria)
        if self.path.startswith("/pages/"):
            page_id = self.path.replace("/pages/", "").split("?")[0].split("/")[0]

            # Buscar en memoria primero
            if page_id in _generated_pages:
                self.send_response(200)
                self.send_header("Content-Type", "text/html; charset=utf-8")
                self.send_header("Access-Control-Allow-Origin", "*")
                self.end_headers()
                self.wfile.write(_generated_pages[page_id].encode("utf-8"))
                return

            # Buscar en disco como fallback
            pages_dir = os.path.join(BASE_DIR, "data", "pages")
            page_path = os.path.join(pages_dir, f"{page_id}.html")
            if os.path.exists(page_path):
                self.send_response(200)
                self.send_header("Content-Type", "text/html; charset=utf-8")
                self.send_header("Access-Control-Allow-Origin", "*")
                self.end_headers()
                with open(page_path, "r", encoding="utf-8") as f:
                    content = f.read()
                    _generated_pages[page_id] = content  # Cachear en memoria
                    self.wfile.write(content.encode("utf-8"))
                return

            # No encontrada
            self.send_response(404)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.end_headers()
            self.wfile.write(
                b"<!DOCTYPE html><html><head><style>body{background:#0a0a1a;color:white;font-family:sans-serif;"
                b"display:flex;align-items:center;justify-content:center;height:100vh;}"
                b"h1{color:#ff00ff;}</style></head><body><h1>Pagina expirada</h1>"
                b"<p>Genera una nueva con /crear_landing</p></body></html>"
            )
            return

        # WhatsApp webhook verification
        if "/webhook" in self.path:
            from urllib.parse import urlparse, parse_qs
            parsed = urlparse(self.path)
            params = parse_qs(parsed.query)
            flat_params = {k: v[0] for k, v in params.items()}

            logger.info(f"Webhook GET: {flat_params}")

            mode = flat_params.get("hub.mode", "")
            token = flat_params.get("hub.verify_token", "")
            challenge = flat_params.get("hub.challenge", "")

            if mode == "subscribe" and token == "c8l_verify_2024":
                logger.info(f"✅ WhatsApp webhook verificado! Challenge: {challenge}")
                self.send_response(200)
                self.send_header("Content-Type", "text/plain")
                self.end_headers()
                self.wfile.write(challenge.encode())
                return
            else:
                logger.warning(f"❌ Webhook verification failed: mode={mode}, token={token}")

        # Normal health check
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        info = {"status": "healthy", "bot": BOT_NAME, "version": "17.0",
                "architecture": "PANTEON_MASTER", "agents": 11, "time": time.time(),
                "whatsapp": True}
        self.wfile.write(json.dumps(info).encode())

    def do_POST(self):
        # --- Actualizar tunnel URL (llamado por start.sh al arrancar cloudflared) ---
        if self.path == "/api/set-tunnel-url":
            global _tunnel_url
            try:
                body = self._read_body()
                new_url = body.get("url", "").strip().rstrip("/")
                if new_url.startswith("https://"):
                    _tunnel_url = new_url
                    logger.info(f"🌐 Tunnel URL actualizada: {_tunnel_url}")
                    self._send_json(200, {"success": True, "tunnel_url": _tunnel_url})
                else:
                    self._send_json(400, {"success": False, "error": "URL debe ser https://"})
            except Exception as e:
                self._send_json(500, {"success": False, "error": str(e)})
            return

        # --- SUNO API ENDPOINTS (para C8L Studio Web) ---
        if self.path == "/api/suno/generate":
            self._handle_suno_generate()
            return

        if self.path == "/api/suno/credits":
            self._handle_suno_credits()
            return

        if self.path == "/api/suno/status":
            self._handle_suno_status()
            return

        if self.path == "/api/suno/extend":
            self._handle_suno_extend()
            return

        if self.path == "/api/suno/remix":
            self._handle_suno_remix()
            return

        if self.path == "/api/suno/concat":
            self._handle_suno_concat()
            return

        if self.path == "/api/suno/lyrics":
            self._handle_suno_lyrics()
            return

        if self.path == "/api/suno/stems":
            self._handle_suno_stems()
            return

        if self.path == "/api/suno/feed":
            self._handle_suno_feed()
            return

        if self.path == "/api/suno/user-stats":
            self._handle_suno_user_stats()
            return

        # WhatsApp incoming messages
        if "/webhook" in self.path:
            content_length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(content_length)

            # Responder INMEDIATAMENTE (Meta requiere 200 en <5s)
            self.send_response(200)
            self.send_header("Content-Type", "text/plain")
            self.end_headers()
            self.wfile.write(b"OK")

            # Procesar en background
            try:
                data = json.loads(body)
                logger.info(f"Webhook POST recibido: {json.dumps(data)[:200]}")
                threading.Thread(
                    target=_handle_whatsapp_message, args=(data,), daemon=True
                ).start()
            except Exception as e:
                logger.error(f"Webhook POST error: {e}")
            return

        self.send_response(404)
        self.end_headers()

    def log_message(self, fmt, *args):
        return

    # --- CORS preflight ---
    def do_OPTIONS(self):
        """Handle CORS preflight requests from C8L Studio."""
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.send_header("Access-Control-Max-Age", "86400")
        self.end_headers()

    # --- SUNO API HANDLERS ---
    def _send_json(self, status_code, data):
        """Helper: envia JSON con CORS headers."""
        self.send_response(status_code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(json.dumps(data, ensure_ascii=False).encode("utf-8"))

    def _read_body(self):
        """Lee el body del POST request."""
        content_length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(content_length)
        return json.loads(body) if body else {}

    def _handle_suno_generate(self):
        """
        POST /api/suno/generate
        Body: {
            "mode": "simple" | "custom",
            "prompt": "descripcion o letra",
            "title": "titulo (solo custom)",
            "tags": "estilo (solo custom)",
            "instrumental": false
        }
        Response: { "success": true, "tracks": [...], "count": N }
        
        Motor: MusicAPI.ai (Sonic v4.5) — canciones completas con vocales
        Fallback: MusicGen local (beats instrumentales)
        """
        try:
            body = self._read_body()
            mode = body.get("mode", "simple")
            prompt = body.get("prompt", "")
            title = body.get("title", "C8L Creation")
            tags = body.get("tags", "")
            instrumental = body.get("instrumental", False)

            if not prompt:
                self._send_json(400, {"success": False, "error": "prompt es obligatorio"})
                return

            logger.info(f"🎵 [WEB API] Generando: mode={mode}, title={title}")

            # Usar MusicAPI.ai como motor principal
            from musicapi_client import MusicAPIClient
            client = MusicAPIClient()

            result = client.generate(
                prompt=prompt,
                title=title,
                tags=tags,
                custom_mode=(mode == "custom"),
                instrumental=instrumental,
                model="sonic-v4-5",
            )

            if result.get("success"):
                logger.info(f"🎵 [WEB API] Éxito! {result['count']} tracks generados")
                self._send_json(200, result)
            else:
                # Fallback a MusicGen local
                logger.warning(f"🎵 [WEB API] MusicAPI falló: {result.get('error')}, probando MusicGen local...")
                try:
                    from lyria_client import LyriaClient
                    local_client = LyriaClient()
                    local_result = local_client.generate(
                        prompt=f"{prompt}. Style: {tags}" if tags else prompt,
                        instrumental=instrumental,
                    )
                    if local_result.get("success"):
                        # Convertir a formato compatible con la web
                        import time as _time
                        track = {
                            "id": f"musicgen_{int(_time.time())}",
                            "title": local_result.get("title", title),
                            "audio_url": "",
                            "tags": tags,
                            "lyrics": "",
                            "duration": local_result.get("duration"),
                            "model_name": "musicgen-small",
                            "status": "complete",
                        }
                        self._send_json(200, {"success": True, "tracks": [track], "count": 1})
                    else:
                        self._send_json(500, {"success": False, "error": local_result.get("error", "Error en generación")})
                except Exception as fallback_err:
                    self._send_json(500, {"success": False, "error": result.get("error", str(fallback_err))})

        except Exception as e:
            error_msg = str(e)
            logger.error(f"🎵 [WEB API] Error: {error_msg}")
            self._send_json(500, {"success": False, "error": error_msg})

    def _handle_suno_credits(self):
        """
        POST /api/suno/credits
        Response: { "credits_left": N, "monthly_limit": N, ... }
        """
        try:
            from musicapi_client import MusicAPIClient
            client = MusicAPIClient()
            credits = client.get_credits()
            credits_left = credits.get("credits", 0)
            self._send_json(200, {
                "success": True,
                "credits_left": credits_left,
                "monthly_limit": 500,
                "monthly_usage": 500 - credits_left,
                "engine": "musicapi",
            })
        except Exception as e:
            self._send_json(500, {"success": False, "error": str(e)})

    def _handle_suno_status(self):
        """
        POST /api/suno/status
        Body: { "ids": ["clip-id-1", "clip-id-2"] }
        Response: { "tracks": [...] }
        """
        try:
            body = self._read_body()
            ids = body.get("ids", [])
            if not ids:
                self._send_json(400, {"success": False, "error": "ids es obligatorio"})
                return

            from suno_client import SunoClient
            client = SunoClient()
            tracks = client.get_tracks(ids)
            self._send_json(200, {
                "success": True,
                "tracks": [t.to_dict() for t in tracks],
            })
        except Exception as e:
            self._send_json(500, {"success": False, "error": str(e)})

    def _handle_suno_extend(self):
        """
        POST /api/suno/extend
        Body: { "audio_id": "...", "prompt": "...", "continue_at": 30, "tags": "...", "title": "..." }
        """
        try:
            body = self._read_body()
            audio_id = body.get("audio_id", "")
            if not audio_id:
                self._send_json(400, {"success": False, "error": "audio_id es obligatorio"})
                return

            from suno_client import SunoClient
            client = SunoClient()
            tracks = client.extend(
                audio_id=audio_id,
                prompt=body.get("prompt", ""),
                continue_at=body.get("continue_at", None),
                tags=body.get("tags", ""),
                title=body.get("title", ""),
            )
            self._send_json(200, {
                "success": True,
                "tracks": [t.to_dict() for t in tracks],
                "count": len(tracks),
            })
        except Exception as e:
            self._send_json(500, {"success": False, "error": str(e)})

    def _handle_suno_remix(self):
        """
        POST /api/suno/remix
        Body: { "audio_id": "...", "prompt": "...", "tags": "new style", "title": "..." }
        """
        try:
            body = self._read_body()
            audio_id = body.get("audio_id", "")
            if not audio_id:
                self._send_json(400, {"success": False, "error": "audio_id es obligatorio"})
                return

            from suno_client import SunoClient
            client = SunoClient()
            tracks = client.remix(
                audio_id=audio_id,
                prompt=body.get("prompt", ""),
                tags=body.get("tags", ""),
                title=body.get("title", ""),
            )
            self._send_json(200, {
                "success": True,
                "tracks": [t.to_dict() for t in tracks],
                "count": len(tracks),
            })
        except Exception as e:
            self._send_json(500, {"success": False, "error": str(e)})

    def _handle_suno_concat(self):
        """
        POST /api/suno/concat
        Body: { "clip_id": "..." }
        """
        try:
            body = self._read_body()
            clip_id = body.get("clip_id", "")
            if not clip_id:
                self._send_json(400, {"success": False, "error": "clip_id es obligatorio"})
                return

            from suno_client import SunoClient
            client = SunoClient()
            track = client.concat(clip_id=clip_id)
            self._send_json(200, {
                "success": True,
                "track": track.to_dict(),
            })
        except Exception as e:
            self._send_json(500, {"success": False, "error": str(e)})

    def _handle_suno_lyrics(self):
        """
        POST /api/suno/lyrics
        Body: { "prompt": "description for lyrics" }
        Genera letras con IA usando Groq (gratis, rápido)
        """
        try:
            body = self._read_body()
            prompt = body.get("prompt", "")
            if not prompt:
                self._send_json(400, {"success": False, "error": "prompt es obligatorio"})
                return

            logger.info(f"🎵 [WEB API] Generando letras: {prompt[:50]}...")

            # Usar Groq para generar letras (gratis y rápido)
            from openrouter_client import call_groq
            system_prompt = """Eres un letrista profesional de música. Genera letras de canción con estructura clara.
Usa tags como [Verse 1], [Chorus], [Verse 2], [Bridge], [Outro].
Las letras deben ser creativas, emotivas y en el estilo que el usuario pida.
Responde SOLO con las letras, sin explicaciones."""

            lyrics_text = call_groq(
                f"Escribe las letras para una canción: {prompt}",
                system_prompt=system_prompt,
                model="llama-3.3-70b-versatile"
            )

            if lyrics_text:
                # Extraer título (primera línea o generar uno)
                lines = lyrics_text.strip().split("\n")
                title = ""
                for line in lines:
                    clean = line.strip().strip("#").strip()
                    if clean and not clean.startswith("["):
                        title = clean[:50]
                        break
                if not title:
                    title = f"Canción: {prompt[:30]}"

                self._send_json(200, {
                    "success": True,
                    "title": title,
                    "text": lyrics_text,
                    "status": "complete",
                })
            else:
                self._send_json(500, {"success": False, "error": "No se pudieron generar letras"})

        except Exception as e:
            self._send_json(500, {"success": False, "error": str(e)})

    def _handle_suno_stems(self):
        """
        POST /api/suno/stems
        Body: { "audio_id": "..." }
        """
        try:
            body = self._read_body()
            audio_id = body.get("audio_id", "")
            if not audio_id:
                self._send_json(400, {"success": False, "error": "audio_id es obligatorio"})
                return

            from suno_client import SunoClient
            client = SunoClient()
            stems = client.get_stems(audio_id=audio_id)
            self._send_json(200, {
                "success": True,
                "stems": [s.to_dict() for s in stems],
                "count": len(stems),
            })
        except Exception as e:
            self._send_json(500, {"success": False, "error": str(e)})

    def _handle_suno_feed(self):
        """
        POST /api/suno/feed
        Body: { "page": 0, "limit": 20 }
        """
        try:
            body = self._read_body()
            page = body.get("page", 0)
            limit = body.get("limit", 20)

            from suno_client import SunoClient
            client = SunoClient()
            tracks = client.get_feed(page=page, limit=limit)
            self._send_json(200, {
                "success": True,
                "tracks": [t.to_dict() for t in tracks],
                "count": len(tracks),
            })
        except Exception as e:
            self._send_json(500, {"success": False, "error": str(e)})

    def _handle_suno_user_stats(self):
        """
        POST /api/suno/user-stats
        Body: { "user_id": "web_user" }
        Response: { tier, daily_used, daily_limit, features, ... }
        """
        try:
            body = self._read_body()
            user_id = body.get("user_id", "web_user")

            from suno_credits import suno_credits
            stats = suno_credits.get_stats(user_id)
            global_stats = suno_credits.get_global_stats()
            self._send_json(200, {
                "success": True,
                **stats,
                "global": global_stats,
            })
        except Exception as e:
            self._send_json(500, {"success": False, "error": str(e)})


def _handle_whatsapp_message(data):
    """Procesa mensaje de WhatsApp en background."""
    try:
        from whatsapp_handler import wa_send_text, wa_send_image
        from pantheon.zeus import analyze_intent

        # Extraer mensaje del webhook de Meta
        entry = data.get("entry", [])
        if not entry:
            return
        changes = entry[0].get("changes", [])
        if not changes:
            return
        value = changes[0].get("value", {})
        messages = value.get("messages", [])
        if not messages:
            return  # Es un status update, no un mensaje

        msg = messages[0]
        msg_type = msg.get("type", "")
        from_number = msg.get("from", "")

        # Nombre del contacto
        contacts = value.get("contacts", [])
        user_name = "Usuario"
        if contacts:
            user_name = contacts[0].get("profile", {}).get("name", "Usuario")

        logger.info(f"[WA] [{user_name}] ({from_number}): type={msg_type}")

        if msg_type == "text":
            text = msg.get("text", {}).get("body", "")
            if not text:
                return

            logger.info(f"[WA] Mensaje: {text[:80]}")

            # Procesar con Zeus
            intent_data = analyze_intent(text, user_name)
            agent = intent_data.get("primary_agent", "hermes")
            logger.info(f"[WA] Zeus -> {agent}")

            # Dispatch
            if agent == "vulcano":
                wa_send_text(from_number, "🎨 Generando...")
                result = vulcano.create(text)
                if result and result.get("type") == "image":
                    wa_send_image(from_number, result["content"], caption=result.get("caption", ""))
                elif result and result.get("type") == "text":
                    wa_send_text(from_number, result["content"])
                else:
                    wa_send_text(from_number, "❌ No pude generar el contenido.")

            elif agent == "apolo":
                wa_send_text(from_number, "🎵 Componiendo...")
                reply = apolo.compose(text)
                wa_send_text(from_number, reply or "❌ No pude componer.")

            elif agent == "minerva":
                reply = minerva.research(text)
                wa_send_text(from_number, reply or "❌ No encontré información.")

            elif agent == "atenea":
                reply = atenea.create_article(text)
                wa_send_text(from_number, reply or "❌ No pude generar.")

            elif agent == "hefesto":
                wa_send_text(from_number, "🖥️ Generando código...")
                result = hefesto.create_landing(text) if "landing" in text.lower() else hefesto.create_component(text)
                if result and result.get("type") == "text":
                    wa_send_text(from_number, result["content"])
                elif result and result.get("type") == "file":
                    wa_send_text(from_number, f"💻 Código generado:\n\n{result['content'].decode('utf-8')[:3000]}")
                else:
                    wa_send_text(from_number, "❌ No pude generar.")

            else:
                # Default: Hermes (chat)
                history_text = get_history_text(from_number)
                reply = hermes.chat(text, user_name, history_text)
                if reply:
                    add_history(from_number, "user", text)
                    add_history(from_number, "assistant", reply)
                    wa_send_text(from_number, reply)
                else:
                    wa_send_text(from_number, "🔄 Error temporal. Intenta de nuevo.")

        elif msg_type == "image":
            caption = msg.get("image", {}).get("caption", "")
            wa_send_text(from_number, f"📸 Recibí tu imagen. {caption or 'Dime qué quieres que haga con ella.'}")

        else:
            wa_send_text(from_number, "📱 Escríbeme en texto. ¿Qué necesitas?")

    except Exception as e:
        logger.error(f"WA handler error: {e}", exc_info=True)
        try:
            from whatsapp_handler import wa_send_text
            if from_number:
                wa_send_text(from_number, f"⚠️ Error procesando tu mensaje. Intenta de nuevo.")
        except:
            pass


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

    # Health check + WhatsApp webhook
    threading.Thread(
        target=lambda: HTTPServer(("0.0.0.0", PORT), HealthHandler).serve_forever(),
        daemon=True
    ).start()

    # Keep-alive: ping cada 5 min para que Render no duerma el servicio
    def _keep_alive():
        import time as t
        while True:
            try:
                requests.get(f"https://c8l-bot-server.onrender.com/", timeout=10)
            except:
                pass
            t.sleep(300)  # Cada 5 minutos

    threading.Thread(target=_keep_alive, daemon=True).start()
    logger.info("💓 Keep-alive activo (ping cada 5 min)")

    # Scheduler de mensajes automaticos al grupo
    scheduler = GroupScheduler(broadcast_to_group)
    scheduler.start()
    logger.info("📅 Scheduler de grupo activo — mensajes cada ~4h")

    # Auto-Repair: el bot se auto-corrige cada 6 horas
    auto_repair.start_scheduler(interval_hours=6)
    logger.info("🔧 Auto-repair activo — ciclo cada 6h")

    # 📰 Periodista: noticias reales + aprendizaje autónomo
    try:
        import asyncio
        from periodista.scheduler import periodista_loop

        def _run_periodista():
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            loop.run_until_complete(periodista_loop())

        threading.Thread(target=_run_periodista, daemon=True).start()
        logger.info("📰 Periodista activo — noticias cada ~4h + aprendizaje")
    except Exception as e:
        logger.warning(f"📰 Periodista no pudo arrancar: {e}")

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

    @bot.message_handler(commands=["lanzamiento"])
    def cmd_lanzamiento(msg):
        """Admin: anuncia el lanzamiento de C8L Generate al grupo. Funciona en privado y en grupo."""
        if not _is_admin(msg):
            return bot.reply_to(msg, "🚫 Solo el admin puede hacer lanzamientos.")
        from periodista.news_formatter import format_launch_announcement
        announcement = format_launch_announcement()
        
        chat_type = msg.chat.type
        if 'group' in chat_type:
            # Si se ejecuta en el grupo, enviar directamente ahí
            try:
                bot.send_message(msg.chat.id, announcement, parse_mode="HTML")
                bot.reply_to(msg, "🚀✅ ¡Anuncio de C8L Generate publicado!")
            except Exception as e:
                bot.reply_to(msg, f"❌ Error: {e}")
        else:
            # Desde privado: intentar broadcast al grupo
            ok = broadcast_to_group(announcement, "HTML")
            if ok:
                bot.reply_to(msg, "🚀✅ ¡Anuncio de lanzamiento de C8L Generate enviado al grupo!")
            else:
                # Si no hay GROUP_CHAT_ID, decir qué hacer
                bot.reply_to(msg, 
                    "❌ No pude enviar al grupo.\n\n"
                    "💡 Solución: escribe /groupid en el grupo para registrarlo, "
                    "o escribe /lanzamiento directamente en el grupo.")

    @bot.message_handler(commands=["casino_anuncio", "anuncio_casino"])
    def cmd_casino_anuncio(msg):
        """Admin: anuncia C8L Casino + KUKIS al grupo."""
        if not _is_admin(msg):
            return bot.reply_to(msg, "🚫 Solo el admin.")
        from periodista.news_formatter import format_casino_announcement
        announcement = format_casino_announcement()

        chat_type = msg.chat.type
        if 'group' in chat_type:
            try:
                bot.send_message(msg.chat.id, announcement, parse_mode="HTML")
                bot.reply_to(msg, "🎰✅ ¡Anuncio de C8L Casino + KUKIS publicado!")
            except Exception as e:
                bot.reply_to(msg, f"❌ Error: {e}")
        else:
            ok = broadcast_to_group(announcement, "HTML")
            if ok:
                bot.reply_to(msg, "🎰✅ ¡Anuncio de C8L Casino enviado al grupo!")
            else:
                bot.reply_to(msg,
                    "❌ No pude enviar al grupo.\n\n"
                    "💡 Escribe /casino_anuncio directamente en el grupo, "
                    "o registra el grupo con /groupid primero.")

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
        """
        /crear_musica [descripción o letras]
        Genera MUSICA REAL con Suno AI Premium via SunoBotBridge.
        Auto-healing + error learning + envío directo de audio.
        """
        tema = msg.text.replace("/crear_musica", "").strip()
        if not tema:
            bot.reply_to(msg,
                "🎵 *Crear Música con Suno AI*\n\n"
                "Uso: /crear_musica [descripción o letra]\n\n"
                "Ejemplos:\n"
                "• /crear_musica reggaeton sobre el verano en Ibiza\n"
                "• /crear_musica bolero house romántico nocturno 120 BPM\n"
                "• /crear_musica [Verse]\\nEn la noche te busco...\\n[Chorus]\\nBaila conmigo\n\n"
                "🎹 Para instrumental: /crear_musica instrumental trap beat oscuro\n"
                "⏱ Tarda ~60-90 segundos. Te envío el audio directo.",
                parse_mode="Markdown")
            return

        tg_typing(msg.chat.id)
        user_id = str(msg.chat.id)
        user_name = msg.from_user.first_name if msg.from_user else "User"

        # Detectar modo
        t_lower = tema.lower()
        has_structure = any(tag in tema for tag in ["[Verse", "[Chorus", "[Bridge", "[Intro", "[Outro"])
        is_instrumental = any(kw in t_lower for kw in ["instrumental", "sin voz", "beat", "pista"])

        # Determinar modo y tags
        if has_structure:
            mode = "custom"
            title = "C8L Creation"
            tags = ""
        else:
            mode = "simple"
            title = ""
            tags = ""

        # Ejecutar en thread para no bloquear
        def _generate():
            try:
                from suno_bot_bridge import get_suno_bridge
                bridge = get_suno_bridge("APOLO")

                result = bridge.create_and_send(
                    chat_id=user_id,
                    prompt=tema,
                    title=title,
                    tags=tags,
                    user_id=user_id,
                    mode=mode,
                    instrumental=is_instrumental,
                    bot_name="APOLO",
                    bot_token=TELEGRAM_BOT_TOKEN,
                    send_status_updates=True,
                )

                if result["success"]:
                    count = result.get("count", 0)
                    remaining = result.get("credits_remaining", "?")
                    import random
                    success_msgs = [
                        f"😈 *Listo, desagradecido*\n🎵 {count} track(s) de puro veneno musical\n💰 Te quedan {remaining} antes de que te corte el grifo\n🖤 No digas que nunca hice nada por ti",
                        f"🦹 *Otra obra maestra que no merecías*\n🔊 {count} pieza(s) del villano más talentoso del game\n💰 {remaining} oportunidades más de molestarme\n😏 De nada. Ahora largo",
                        f"💀 *¿Ves? Soy malo pero cumplo*\n🎧 {count} track(s) — mejor que lo que harías en tu vida\n💰 Restantes: {remaining}\n🖤 C8L Agency — Hacemos hits, no amigos",
                        f"😏 *Toma, anda. Gratis porque soy así de crack*\n🔥 {count} temazo(s) servido(s) en bandeja\n💰 {remaining} generaciones y ya no te conozco\n🦹 El antihéroe del beat ha hablado",
                    ]
                    tg_send(msg.chat.id, random.choice(success_msgs))
                    broadcast_content_created(user_name, "musica_ai", tema[:60])
                    _send_feedback_buttons(msg.chat.id)
                # Si falla, el bridge ya envió el error por Telegram

                estia.record_interaction(msg.chat.id, user_name, tema, "musica_suno", "apolo")

            except Exception as e:
                logger.error(f"cmd_musica error: {e}")
                tg_send(msg.chat.id, f"❌ Error inesperado: {str(e)[:150]}")

        threading.Thread(target=_generate, daemon=True).start()

    @bot.message_handler(commands=["crear_video"])
    def cmd_video(msg):
        tema = msg.text.replace("/crear_video", "").strip()
        if not tema:
            tema = "Videoclip para cancion Bolero-House nocturna"
        tg_typing(msg.chat.id)
        tg_send(msg.chat.id, "🎬 Generando video con IA... (puede tardar 1-3 min)")
        tg_video_action(msg.chat.id)

        # Generar video REAL con VideoEngine multi-motor
        def _gen():
            try:
                result = ares_bot.process(tema, msg.from_user.first_name)
                if result and result.get("type") == "video":
                    tg_video_action(msg.chat.id)
                    video_bytes = result["content"]
                    filename = result.get("filename", "c8l_video.mp4")
                    caption = result.get("caption", "🎬 Video generado")
                    fmt = result.get("format", "mp4")
                    if fmt == "gif":
                        tg_send_animation(msg.chat.id, video_bytes, caption=caption)
                    else:
                        tg_send_video(msg.chat.id, video_bytes, filename=filename, caption=caption)
                    _send_feedback_buttons(msg.chat.id)
                    broadcast_content_created(msg.from_user.first_name, "video", tema)
                elif result and result.get("type") == "text":
                    # Video falló, se generó guión. NO enviar PDF — dar mensaje claro
                    tg_send(msg.chat.id,
                        "⚠️ Los motores de video están saturados ahora.\n"
                        "Intenta de nuevo en 1-2 minutos con /crear_video\n\n"
                        "💡 Tip: Prueba prompts más simples en inglés:\n"
                        "`/crear_video a golden lion walking through neon city at night`")
                else:
                    tg_send(msg.chat.id, "❌ No pude generar el video. Intenta de nuevo en unos minutos.")
            except Exception as e:
                logger.error(f"cmd_video error: {e}")
                tg_send(msg.chat.id, f"❌ Error generando video: {str(e)[:100]}")
            estia.record_interaction(msg.chat.id, msg.from_user.first_name, tema, "video", "ares")

        threading.Thread(target=_gen, daemon=True).start()

    @bot.message_handler(commands=["video"])
    def cmd_video_ia(msg):
        """Genera video REAL con IA (VideoEngine Multi-Motor)."""
        desc = msg.text.replace("/video", "").strip()
        if not desc:
            bot.reply_to(msg,
                "🎬 *Generador de Video IA (Multi-Motor)*\n\n"
                "Uso: /video [descripción del video]\n\n"
                "Ejemplos:\n"
                "• /video león dorado rugiendo en Times Square de noche\n"
                "• /video olas del mar al atardecer en cámara lenta\n"
                "• /video logotipo C8L girando en el espacio con neon\n"
                "• /video DJ mezclando música en club con luces neon\n\n"
                "🤖 Motores: Veo, Seedance, Wan, LTX, Nova Reel\n"
                "⏱️ Tarda 1-3 minutos. Hasta 15 seg con audio.\n"
                "💰 100% GRATIS — sin límites.",
                parse_mode="Markdown")
            return

        tg_typing(msg.chat.id)
        tg_send(msg.chat.id,
            f"🎬 *Generando video con IA...*\n\n"
            f"📝 Prompt: {desc[:100]}\n"
            f"⏱️ Esto tarda 1-3 minutos. Te aviso cuando esté listo.\n"
            f"🤖 Probando 12 motores hasta encontrar el mejor...",
            parse_mode="Markdown")

        # Generar video en un thread para no bloquear el bot
        def _generate_and_send():
            try:
                result = ares_bot.process(desc, msg.from_user.first_name)

                if result and result.get("type") == "video":
                    video_bytes = result["content"]
                    filename = result.get("filename", "c8l_video.mp4")
                    caption = result.get("caption", f"🎬 {desc[:80]}")
                    fmt = result.get("format", "mp4")

                    if fmt == "gif":
                        tg_send_animation(msg.chat.id, video_bytes, caption=caption)
                    else:
                        tg_send_video(msg.chat.id, video_bytes, filename=filename, caption=caption)

                    logger.info(f"Video enviado: {len(video_bytes)} bytes")
                    _send_feedback_buttons(msg.chat.id)
                    estia.record_interaction(msg.chat.id, msg.from_user.first_name, desc, "video_ia", "ares")
                    broadcast_content_created(msg.from_user.first_name, "video", desc)

                elif result and result.get("type") == "text":
                    content = result["content"]
                    if len(content) > 3000:
                        pdf_bytes = generate_pdf(content, f"Video: {desc[:40]}")
                        tg_send_document(msg.chat.id, pdf_bytes, "video_c8l.pdf", caption=f"🎬 {desc[:60]}")
                    else:
                        tg_send(msg.chat.id, content)

                else:
                    tg_send(msg.chat.id,
                        "❌ No pude generar el video. Posibles causas:\n"
                        "• Todos los motores saturados\n"
                        "• Prompt muy largo o complejo\n"
                        "• Error temporal\n\n"
                        "💡 Intenta con otra descripción o en unos minutos.")

            except Exception as e:
                logger.error(f"Error generando video: {e}")
                tg_send(msg.chat.id, f"❌ Error: {str(e)[:150]}")

        threading.Thread(target=_generate_and_send, daemon=True).start()

    # ---------------------------------------------------------------------------
    # /hf — Hyperframes Video (HTML → MP4 con templates y IA)
    # ---------------------------------------------------------------------------
    @bot.message_handler(commands=["hf", "hyperframes"])
    def cmd_hyperframes(msg):
        """Genera video HTML→MP4 con Hyperframes Engine."""
        if not _hyperframes_available:
            bot.reply_to(msg, "⚠️ Hyperframes no está disponible en este momento.")
            return

        text = msg.text
        for prefix in ["/hf", "/hyperframes"]:
            if text.startswith(prefix):
                text = text[len(prefix):].strip()
                break

        chat_id = msg.chat.id
        user_name = msg.from_user.first_name if msg.from_user else "User"

        def _render():
            try:
                import asyncio
                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)

                result = loop.run_until_complete(
                    handle_video_command(
                        text=text,
                        chat_id=chat_id,
                        user_name=user_name,
                        send_fn=tg_send,
                        typing_fn=tg_typing,
                        video_fn=tg_send_video,
                        video_action_fn=tg_video_action
                    )
                )
                loop.close()

                if result.get('status') == 'ok':
                    _send_feedback_buttons(chat_id)
                    estia.record_interaction(chat_id, user_name, text, "hyperframes", "hyperframes")

            except Exception as e:
                logger.error(f"Error Hyperframes: {e}")
                tg_send(chat_id, f"❌ Error en Hyperframes: {str(e)[:150]}")

        threading.Thread(target=_render, daemon=True).start()

    # ---------------------------------------------------------------------------
    # /scan — SkillScan Security Scanner (Auto-auditoría + escáner externo)
    # ---------------------------------------------------------------------------
    @bot.message_handler(commands=["scan", "escanear", "audit"])
    def cmd_scan(msg):
        """Escanea el bot o URLs externas en busca de vulnerabilidades."""
        if not _skillscan_available:
            bot.reply_to(msg, "⚠️ SkillScan no está disponible en este momento.")
            return

        text = msg.text
        chat_id = msg.chat.id

        def _run_scan():
            try:
                import asyncio
                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)

                result = loop.run_until_complete(
                    handle_scan_command(
                        text=text,
                        chat_id=chat_id,
                        send_fn=tg_send,
                        typing_fn=tg_typing
                    )
                )
                loop.close()

            except Exception as e:
                logger.error(f"Error SkillScan: {e}")
                tg_send(chat_id, f"❌ Error en escáner: {str(e)[:150]}")

        threading.Thread(target=_run_scan, daemon=True).start()

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
        if result and result.get("type") == "file":
            tg_doc_action(msg.chat.id)
            caption = result.get("caption", "")
            tg_send_document(msg.chat.id, result["content"], result.get("filename", "c8l_landing.html"), caption=caption)
            url = result.get("url", "")
            if url:
                tg_send(msg.chat.id, f"🌐 *Abrir en navegador:*\n{url}", parse_mode="Markdown")
            # Preview visual
            try:
                preview_prompt = f"screenshot of a modern dark website with neon purple accents, {desc[:50]}, web design mockup, browser window, highly detailed"
                preview_img = vulcano._generate_image_pollinations(preview_prompt, "digital_art")
                if preview_img:
                    tg_send_photo(msg.chat.id, preview_img, caption="👁️ Preview visual")
            except:
                pass
            _send_feedback_buttons(msg.chat.id)
        else:
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

    # === COMANDOS DE KUKIS (Juego de Cartas de Investigación Dulce) ===

    @bot.message_handler(commands=["kukis"])
    def cmd_kukis(msg):
        """Inicia partida de Kukis. Uso: /kukis"""
        from kukis.kukis_game import start_game as kukis_start, get_game as kukis_get, end_game as kukis_end

        chat_id = msg.chat.id
        # Si ya hay partida activa
        game = kukis_get(chat_id)
        if game:
            tg_send(chat_id, game.get_full_display(), parse_mode="Markdown")
            return

        # Nueva partida
        player_name = msg.from_user.first_name if msg.from_user else "Investigador"
        game = kukis_start(chat_id, player_name, msg.from_user.id)

        reply = (
            "🍪🔍 *KUKIS — Agencia de Investigación Dulce* 🔍🍪\n\n"
            "¡Bienvenido, detective! Tu misión: resolver misterios\n"
            "usando cartas de personajes, objetos y eventos.\n\n"
            f"🍪 Chips: {game.balance}\n"
            f"🦄 Cargas Unicornio: {game.unicorn_charges}\n"
            f"🃏 Cartas en mano: {len(game.hand)}\n\n"
            "━━━━━━━━━━━━━━━━━━━━━━━━\n"
        )
        reply += game.get_case_info() + "\n\n"
        reply += game.get_hand_info() + "\n\n"
        reply += (
            "━━━━━━━━━━━━━━━━━━━━━━━━\n"
            "*CÓMO JUGAR:*\n"
            "1️⃣ /kukis\\_pista [n] — Coloca carta n como pista\n"
            "2️⃣ Coloca 3 pistas (1 Personaje + 1 Objeto + 1 Evento = Sinergia!)\n"
            "3️⃣ /investigar — Resuelve el caso\n\n"
            "*OTROS COMANDOS:*\n"
            "🃏 /kukis\\_mano — Ver tus cartas\n"
            "📋 /kukis\\_caso — Nuevo caso\n"
            "🦄 /kukis\\_unicornio — Roba 2 cartas extra\n"
            "📊 /kukis\\_perfil — Tu perfil\n"
            "🏆 /kukis\\_ranking — Top investigadores\n"
            "🚪 /kukis\\_salir — Terminar partida"
        )
        tg_send(chat_id, reply, parse_mode="Markdown")
        levels.add_xp(msg.from_user.id, msg.from_user.first_name, "game")

    @bot.message_handler(commands=["kukis_pista"])
    def cmd_kukis_pista(msg):
        """Coloca una carta como pista. Uso: /kukis_pista 3"""
        from kukis.kukis_game import get_game as kukis_get
        chat_id = msg.chat.id
        game = kukis_get(chat_id)
        if not game:
            return bot.reply_to(msg, "🍪 No tienes partida activa. Usa /kukis para empezar.")

        text = msg.text.replace("/kukis_pista", "").strip()
        if not text:
            bot.reply_to(msg, "Uso: /kukis\\_pista [número]\nEj: /kukis\\_pista 3\n\n" + game.get_hand_info(),
                        parse_mode="Markdown")
            return

        try:
            index = int(text)
        except ValueError:
            return bot.reply_to(msg, "❌ Usa un número. Ej: /kukis\\_pista 2", parse_mode="Markdown")

        ok, result = game.place_clue(index)
        tg_send(chat_id, result, parse_mode="Markdown")

    @bot.message_handler(commands=["investigar"])
    def cmd_investigar(msg):
        """Resuelve el caso con las 3 pistas colocadas."""
        from kukis.kukis_game import get_game as kukis_get
        from kukis.kukis_ranking import update_after_case, record_unicorn_use

        chat_id = msg.chat.id
        game = kukis_get(chat_id)
        if not game:
            return bot.reply_to(msg, "🍪 No tienes partida activa. Usa /kukis para empezar.")

        tg_typing(chat_id)
        success, result = game.investigate()

        # Actualizar ranking si se intentó investigar (se cobraron chips)
        if "RESULTADO" in result:
            synergy = "Sinergia" in result
            chips_won = 0
            if success:
                # Extraer recompensa del caso
                chips_won = game.current_case['reward'] if game.current_case else 0
            from kukis.kukis_ranking import update_after_case
            stats, achievements = update_after_case(
                msg.from_user.id,
                msg.from_user.first_name,
                success,
                game.current_case['difficulty'] if game.current_case else 3,
                chips_won,
                synergy
            )
            # Recargar unicornio cada 2 casos
            game.recharge_unicorn()

            # Mostrar logros
            if achievements:
                result += "\n\n🏆 *¡LOGROS DESBLOQUEADOS!*\n"
                for ach in achievements:
                    result += f"  {ach['icon']} {ach['name']} (+{ach['coins']} C8L)\n"

        tg_send(chat_id, result, parse_mode="Markdown")
        levels.add_xp(msg.from_user.id, msg.from_user.first_name, "game")

    @bot.message_handler(commands=["kukis_mano"])
    def cmd_kukis_mano(msg):
        """Muestra las cartas en tu mano."""
        from kukis.kukis_game import get_game as kukis_get
        game = kukis_get(msg.chat.id)
        if not game:
            return bot.reply_to(msg, "🍪 No tienes partida activa. Usa /kukis para empezar.")
        tg_send(msg.chat.id, game.get_hand_info(), parse_mode="Markdown")

    @bot.message_handler(commands=["kukis_caso"])
    def cmd_kukis_caso(msg):
        """Genera un nuevo caso de investigación."""
        from kukis.kukis_game import get_game as kukis_get
        chat_id = msg.chat.id
        game = kukis_get(chat_id)
        if not game:
            return bot.reply_to(msg, "🍪 No tienes partida activa. Usa /kukis para empezar.")
        game.new_case()
        reply = "📋 *¡NUEVO CASO ASIGNADO!*\n\n" + game.get_case_info()
        reply += "\n\n" + game.get_hand_info()
        tg_send(chat_id, reply, parse_mode="Markdown")

    @bot.message_handler(commands=["kukis_unicornio"])
    def cmd_kukis_unicornio(msg):
        """Usa poder unicornio para robar 2 cartas extra."""
        from kukis.kukis_game import get_game as kukis_get
        from kukis.kukis_ranking import record_unicorn_use
        chat_id = msg.chat.id
        game = kukis_get(chat_id)
        if not game:
            return bot.reply_to(msg, "🍪 No tienes partida activa. Usa /kukis para empezar.")
        ok, result = game.use_unicorn_power()
        if ok:
            record_unicorn_use(msg.from_user.id)
        tg_send(chat_id, result, parse_mode="Markdown")

    @bot.message_handler(commands=["kukis_perfil"])
    def cmd_kukis_perfil(msg):
        """Muestra tu perfil de investigador Kukis."""
        from kukis.kukis_ranking import get_player_profile
        tg_send(msg.chat.id, get_player_profile(msg.from_user.id), parse_mode="Markdown")

    @bot.message_handler(commands=["kukis_ranking"])
    def cmd_kukis_ranking(msg):
        """Top investigadores de Kukis."""
        from kukis.kukis_ranking import get_kukis_ranking
        tg_send(msg.chat.id, get_kukis_ranking(), parse_mode="Markdown")

    @bot.message_handler(commands=["kukis_salir"])
    def cmd_kukis_salir(msg):
        """Termina la partida de Kukis."""
        from kukis.kukis_game import get_game as kukis_get, end_game as kukis_end
        chat_id = msg.chat.id
        game = kukis_get(chat_id)
        if not game:
            return bot.reply_to(msg, "🍪 No hay partida activa de Kukis.")
        kukis_end(chat_id)
        tg_send(chat_id,
            f"🍪 *Partida de Kukis terminada*\n\n"
            f"📋 Casos resueltos: {game.cases_resolved}\n"
            f"🍪 Chips ganados: {game.total_chips_won}\n\n"
            f"¡Hasta la próxima, detective! Usa /kukis para jugar de nuevo.",
            parse_mode="Markdown")

    # === COMANDOS DE GAME DESIGNER (C8L Game Architect 3D/4D) ===

    @bot.message_handler(commands=["gamebot"])
    def cmd_gamebot(msg):
        """Bot de diseño de videojuegos 3D/4D. Uso: /gamebot [descripción del juego]"""
        from game_designer.game_bot import get_game_bot
        gbot = get_game_bot()
        text = msg.text.replace("/gamebot", "").strip()

        if not text:
            # Sin argumento: mostrar bienvenida
            tg_send(msg.chat.id, gbot.get_welcome(), parse_mode="Markdown")
            return

        # Con descripción: generar juego con IA
        tg_typing(msg.chat.id)
        tg_send(msg.chat.id, "🎮 *Diseñando tu juego...*\n\n🔺 Generando polígonos y mundos...", parse_mode="Markdown")

        from openrouter_client import call_openrouter
        prompt = gbot.generate_game_prompt(text)
        result = call_openrouter(
            prompt=prompt,
            system_prompt=gbot.get_system_prompt(),
            agent_name="gamebot",
            temperature=0.8
        )

        if result and "<!DOCTYPE" in result:
            # Extraer solo el HTML
            start = result.find("<!DOCTYPE")
            end = result.rfind("</html>") + len("</html>")
            if end > start:
                game_html = result[start:end]
            else:
                game_html = result[start:]

            # Guardar
            game_name = text[:30] if text else "custom_game"
            filepath, filename = gbot.save_game(msg.from_user.id, game_html, game_name)

            # Enviar como documento
            try:
                with open(filepath, 'rb') as f:
                    bot.send_document(
                        msg.chat.id, f,
                        caption=(
                            f"🎮 *Tu juego está listo!*\n\n"
                            f"📁 {filename}\n"
                            f"🕹️ Ábrelo en un navegador para jugar\n\n"
                            f"💡 Controles: WASD + Mouse + Space\n"
                            f"📐 Motor: WebGL 3D/4D Polygon Engine"
                        ),
                        parse_mode="Markdown"
                    )
            except Exception as e:
                tg_send(msg.chat.id, f"✅ Juego generado pero no pude enviarlo como archivo.\n\nError: {e}")
        elif result:
            # La IA respondió pero no es HTML puro
            tg_send(msg.chat.id, f"🎮 *Respuesta del Game Architect:*\n\n{result[:3000]}", parse_mode="Markdown")
        else:
            tg_send(msg.chat.id, "❌ No pude generar el juego. Intenta con otra descripción.")

        levels.add_xp(msg.from_user.id, msg.from_user.first_name, "game")

    @bot.message_handler(commands=["gamebot_demo"])
    def cmd_gamebot_demo(msg):
        """Muestra info de la demo 3D/4D jugable."""
        from game_designer.game_bot import get_game_bot
        tg_send(msg.chat.id, get_game_bot().get_demo_info(), parse_mode="Markdown")

    @bot.message_handler(commands=["gamebot_templates"])
    def cmd_gamebot_templates(msg):
        """Lista plantillas de juegos disponibles."""
        from game_designer.game_bot import get_game_bot
        tg_send(msg.chat.id, get_game_bot().get_templates_list(), parse_mode="Markdown")

    @bot.message_handler(commands=["gamebot_crear"])
    def cmd_gamebot_crear(msg):
        """Genera juego desde plantilla. Uso: /gamebot_crear [número]"""
        from game_designer.game_bot import get_game_bot
        gbot = get_game_bot()
        text = msg.text.replace("/gamebot_crear", "").strip()

        if not text:
            tg_send(msg.chat.id, gbot.get_templates_list(), parse_mode="Markdown")
            return

        try:
            idx = int(text) - 1
            if 0 <= idx < len(gbot.templates):
                template = gbot.templates[idx]
                # Redirigir al generador con la descripción de la plantilla
                fake_request = (
                    f"Crea un juego tipo '{template['name']}': {template['desc']}. "
                    f"Dimensiones: {template['dimensions']}. "
                    f"Estilo: polígonos neón sobre fondo oscuro."
                )
                tg_typing(msg.chat.id)
                tg_send(msg.chat.id,
                    f"🎮 Generando: {template['emoji']} *{template['name']}*\n"
                    f"📐 {template['dimensions']} | {'⭐'*template['complexity']}\n\n"
                    f"⏳ Esto puede tardar 30-60 segundos...",
                    parse_mode="Markdown")

                from openrouter_client import call_openrouter
                prompt = gbot.generate_game_prompt(fake_request)
                result = call_openrouter(
                    prompt=prompt,
                    system_prompt=gbot.get_system_prompt(),
                    agent_name="gamebot",
                    temperature=0.8
                )

                if result and "<!DOCTYPE" in result:
                    start = result.find("<!DOCTYPE")
                    end = result.rfind("</html>") + len("</html>")
                    game_html = result[start:end] if end > start else result[start:]
                    filepath, filename = gbot.save_game(msg.from_user.id, game_html, template['name'])
                    try:
                        with open(filepath, 'rb') as f:
                            bot.send_document(msg.chat.id, f,
                                caption=f"🎮 *{template['emoji']} {template['name']}*\n\n📁 Ábrelo en tu navegador para jugar!",
                                parse_mode="Markdown")
                    except Exception as e:
                        tg_send(msg.chat.id, f"✅ Generado pero error al enviar: {e}")
                else:
                    tg_send(msg.chat.id, "❌ No pude generar ese juego. Intenta de nuevo.")
            else:
                tg_send(msg.chat.id, f"❌ Número inválido. Hay {len(gbot.templates)} plantillas.")
        except ValueError:
            tg_send(msg.chat.id, "❌ Usa un número. Ej: /gamebot\\_crear 1", parse_mode="Markdown")

    # === CALLBACK: Botones 👍👎 (Auto-Evolución) ===

    @bot.callback_query_handler(func=lambda call: call.data.startswith("feedback_"))
    def handle_feedback(call):
        """Procesa feedback 👍👎 para auto-evolución."""
        chat_id = call.message.chat.id
        is_positive = call.data == "feedback_positive"

        # Registrar feedback
        evolution.record_feedback(chat_id, is_positive)

        # Responder al usuario
        if is_positive:
            bot.answer_callback_query(call.id, "👍 Gracias! El bot aprende de ti.")
            try:
                bot.edit_message_text(
                    "👍 *Feedback registrado* — Seguiré haciéndolo así 🧬",
                    chat_id=chat_id,
                    message_id=call.message.message_id,
                    parse_mode="Markdown"
                )
            except:
                pass
        else:
            bot.answer_callback_query(call.id, "👎 Entendido. Aprenderé de esto.")
            try:
                bot.edit_message_text(
                    "👎 *Feedback registrado* — Mejoraré la próxima vez 🧬\n\n"
                    "💡 Tip: describe con más detalle lo que quieres para mejores resultados.",
                    chat_id=chat_id,
                    message_id=call.message.message_id,
                    parse_mode="Markdown"
                )
            except:
                pass

    # === COMANDO /evolucion mejorado ===

    @bot.message_handler(commands=["evolucion"])
    def cmd_evolucion(msg):
        tg_send(msg.chat.id, evolution.get_stats_report(), parse_mode="Markdown")

    # === NUEVOS COMANDOS: Tools, Niveles, DJ, Social, Tienda ===

    @bot.message_handler(commands=["qr"])
    def cmd_qr(msg):
        """Genera QR code. Uso: /qr [url o texto]"""
        data = msg.text.replace("/qr", "").strip()
        if not data:
            return bot.reply_to(msg, "Uso: /qr [url o texto]\nEjemplo: /qr https://c8lagency.com")
        tg_typing(msg.chat.id)
        qr_bytes = generate_qr(data)
        if qr_bytes:
            tg_send_photo(msg.chat.id, qr_bytes, caption=f"📱 QR: {data[:50]}")
        else:
            tg_send(msg.chat.id, "❌ No pude generar el QR.")
        levels.add_xp(msg.from_user.id, msg.from_user.first_name, "message")

    @bot.message_handler(commands=["traducir", "translate"])
    def cmd_traducir(msg):
        """Traduce texto. Uso: /traducir [texto]"""
        text = msg.text.replace("/traducir", "").replace("/translate", "").strip()
        if not text:
            return bot.reply_to(msg, "Uso: /traducir [texto]\nEjemplo: /traducir hola mundo")
        tg_typing(msg.chat.id)
        result = translate_text(text)
        if result:
            tg_send(msg.chat.id, f"🌍 *Traducción:*\n\n{result}", parse_mode="Markdown")
        else:
            tg_send(msg.chat.id, "❌ No pude traducir.")
        levels.add_xp(msg.from_user.id, msg.from_user.first_name, "message")

    @bot.message_handler(commands=["resumir", "summary"])
    def cmd_resumir(msg):
        """Resume una URL. Uso: /resumir [url]"""
        url = msg.text.replace("/resumir", "").replace("/summary", "").strip()
        if not url or not url.startswith("http"):
            return bot.reply_to(msg, "Uso: /resumir [url]\nEjemplo: /resumir https://articulo.com")
        tg_typing(msg.chat.id)
        tg_send(msg.chat.id, "📖 Leyendo y resumiendo...")
        result = summarize_url(url)
        tg_send(msg.chat.id, f"📋 *Resumen:*\n\n{result}", parse_mode="Markdown")
        levels.add_xp(msg.from_user.id, msg.from_user.first_name, "message")

    @bot.message_handler(commands=["nivel", "level", "perfil", "profile"])
    def cmd_nivel(msg):
        """Muestra tu nivel y XP."""
        tg_send(msg.chat.id, levels.get_profile(msg.from_user.id), parse_mode="Markdown")

    @bot.message_handler(commands=["ranking", "top"])
    def cmd_ranking(msg):
        """Muestra el ranking de usuarios."""
        tg_send(msg.chat.id, levels.get_ranking(), parse_mode="Markdown")

    @bot.message_handler(commands=["daily", "bonus"])
    def cmd_daily(msg):
        """Reclama bonus diario de XP y coins."""
        result = levels.claim_daily(msg.from_user.id, msg.from_user.first_name)
        bot.reply_to(msg, result, parse_mode="Markdown")

    @bot.message_handler(commands=["tienda", "shop"])
    def cmd_tienda(msg):
        """Muestra la tienda de C8L Coins."""
        tg_send(msg.chat.id, get_shop_text(), parse_mode="Markdown")

    @bot.message_handler(commands=["trivia", "quiz"])
    def cmd_trivia(msg):
        """Mini-juego de trivia C8L."""
        question, answer, options = get_trivia_question()
        keyboard = {"inline_keyboard": [
            [{"text": opt, "callback_data": f"trivia_{opt}_{answer}"} for opt in options[:2]],
            [{"text": opt, "callback_data": f"trivia_{opt}_{answer}"} for opt in options[2:]],
        ]}
        payload = {
            "chat_id": msg.chat.id,
            "text": f"🎮 *TRIVIA C8L*\n\n{question}",
            "reply_markup": json.dumps(keyboard),
            "parse_mode": "Markdown"
        }
        requests.post(f"{TG_API}/sendMessage", json=payload, timeout=10)

    @bot.callback_query_handler(func=lambda call: call.data.startswith("trivia_"))
    def handle_trivia(call):
        """Procesa respuesta de trivia."""
        parts = call.data.split("_", 2)
        if len(parts) >= 3:
            selected = parts[1]
            correct = parts[2]
            if selected == correct:
                bot.answer_callback_query(call.id, "✅ ¡Correcto! +10 XP")
                levels.add_xp(call.from_user.id, call.from_user.first_name, "game")
                try:
                    bot.edit_message_text(
                        f"✅ *¡Correcto!* La respuesta era: {correct}\n+10 XP 🎮",
                        chat_id=call.message.chat.id,
                        message_id=call.message.message_id,
                        parse_mode="Markdown")
                except: pass
            else:
                bot.answer_callback_query(call.id, f"❌ Incorrecto. Era: {correct}")
                try:
                    bot.edit_message_text(
                        f"❌ Incorrecto. La respuesta era: *{correct}*\n\nIntenta con /trivia",
                        chat_id=call.message.chat.id,
                        message_id=call.message.message_id,
                        parse_mode="Markdown")
                except: pass

    @bot.message_handler(commands=["dj", "playlist"])
    def cmd_dj(msg):
        """Modo DJ. Uso: /dj [tema] o /playlist [tema]"""
        tema = msg.text.replace("/dj", "").replace("/playlist", "").strip()
        if not tema:
            tema = "fiesta nocturna bolero-house"
        tg_typing(msg.chat.id)
        if "playlist" in msg.text:
            result = generate_playlist(tema)
            if result:
                tg_send(msg.chat.id, f"🎧 *Playlist: {tema}*\n\n{result}", parse_mode="Markdown")
            else:
                tg_send(msg.chat.id, "❌ No pude generar la playlist.")
        else:
            result = generate_dj_prompt(genre=tema)
            if result:
                tg_send(msg.chat.id, result)
            else:
                tg_send(msg.chat.id, "❌ No pude generar el prompt DJ.")
        levels.add_xp(msg.from_user.id, msg.from_user.first_name, "music")

    @bot.message_handler(commands=["post", "social"])
    def cmd_social(msg):
        """Genera post para redes. Uso: /post [tema] [plataforma]"""
        text = msg.text.replace("/post", "").replace("/social", "").strip()
        if not text:
            return bot.reply_to(msg,
                "📱 *Generador de Posts*\n\n"
                "Uso: /post [tema]\n\n"
                "Ejemplos:\n"
                "• /post nuevo single de C8L\n"
                "• /post tips de producción musical\n"
                "• /post motivación lunes\n\n"
                "Genera para Instagram por defecto.",
                parse_mode="Markdown")
        # Detectar plataforma
        platform = "instagram"
        for p in ["tiktok", "twitter", "linkedin"]:
            if p in text.lower():
                platform = p
                text = text.lower().replace(p, "").strip()
                break
        tg_typing(msg.chat.id)
        result = generate_social_post(text, platform)
        if result:
            tg_send(msg.chat.id, f"📱 *Post para {platform.title()}:*\n\n{result}", parse_mode="Markdown")
        else:
            tg_send(msg.chat.id, "❌ No pude generar el post.")
        levels.add_xp(msg.from_user.id, msg.from_user.first_name, "message")

    @bot.message_handler(commands=["programar", "schedule"])
    def cmd_programar(msg):
        """Programa mensaje. Uso: /programar HH:MM mensaje"""
        if not _is_admin(msg):
            return bot.reply_to(msg, "🚫 Solo el admin puede programar mensajes.")
        text = msg.text.replace("/programar", "").replace("/schedule", "").strip()
        if not text or ":" not in text.split()[0]:
            return bot.reply_to(msg, "Uso: /programar 08:30 Buenos días Corazones Locos!")
        parts = text.split(" ", 1)
        time_str = parts[0]
        message = parts[1] if len(parts) > 1 else "📢 Mensaje programado de C8L"
        try:
            h, m = map(int, time_str.split(":"))
            schedule_message(msg.chat.id, h, m, message, msg.from_user.first_name)
            bot.reply_to(msg, f"✅ Mensaje programado para las {h:02d}:{m:02d}\n📝 {message[:50]}...")
        except:
            bot.reply_to(msg, "❌ Formato inválido. Usa: /programar 14:30 tu mensaje aquí")

    @bot.message_handler(commands=["memoria", "memory"])
    def cmd_memoria(msg):
        """Muestra tu perfil de memoria."""
        tg_send(msg.chat.id, smart_memory.get_user_profile_text(msg.from_user.id), parse_mode="Markdown")

    @bot.message_handler(commands=["autorepair", "repair"])
    def cmd_autorepair(msg):
        """Muestra estado del sistema de auto-reparación."""
        tg_send(msg.chat.id, auto_repair.get_report(), parse_mode="Markdown")

    @bot.message_handler(commands=["fixnow"])
    def cmd_fixnow(msg):
        """Admin: fuerza un ciclo de auto-reparación ahora."""
        if not _is_admin(msg):
            return bot.reply_to(msg, "🚫 Solo el admin.")
        tg_typing(msg.chat.id)
        tg_send(msg.chat.id, "🔧 Ejecutando ciclo de auto-reparación...")
        result = auto_repair.run_repair_cycle()
        if result:
            tg_send(msg.chat.id,
                f"✅ *Fix aplicado!*\n\n"
                f"Error: `{result['error_type']}`\n"
                f"Fix: {result.get('fix_applied', '')[:200]}",
                parse_mode="Markdown")
        else:
            tg_send(msg.chat.id, "ℹ️ No hay errores que necesiten fix (o límite diario alcanzado).")

    @bot.message_handler(commands=["recordar", "remember"])
    def cmd_recordar(msg):
        """Guarda una nota en tu memoria. Uso: /recordar [nota]"""
        note = msg.text.replace("/recordar", "").replace("/remember", "").strip()
        if not note:
            return bot.reply_to(msg, "Uso: /recordar [algo que quieras que recuerde]\nEjemplo: /recordar me gusta el estilo cyberpunk")
        smart_memory.add_note(msg.from_user.id, note)
        bot.reply_to(msg, f"🧠 Recordado: _{note[:80]}_", parse_mode="Markdown")

    # === HANDLER DE FOTOS — Edicion de imagenes con Gemini ===

    @bot.message_handler(content_types=["photo"])
    def handle_photo(msg):
        """Cuando el usuario manda una foto con texto, edita la imagen con Gemini."""
        chat_id = msg.chat.id
        user_name = msg.from_user.first_name or "Usuario"
        caption = msg.caption or ""
        chat_type = msg.chat.type

        # En grupos: solo si mencionan al bot
        if 'group' in chat_type:
            is_mention = f"@{BOT_NAME}" in caption.lower() or "@leon_leo_bot" in caption.lower()
            is_reply_to_bot = (msg.reply_to_message and
                               msg.reply_to_message.from_user and
                               msg.reply_to_message.from_user.username == BOT_NAME)
            if not is_mention and not is_reply_to_bot:
                return
            caption = caption.replace(f"@{BOT_NAME}", "").replace("@leon_leo_bot", "").strip()

        if not caption:
            caption = "mejora esta imagen, hazla mas profesional y detallada"

        logger.info(f"[FOTO] [{user_name}]: {caption[:80]}")
        tg_typing(chat_id)
        tg_send(chat_id, "🎨 Editando imagen con Gemini...")

        # Descargar la foto del usuario
        try:
            file_id = msg.photo[-1].file_id  # Mejor resolucion
            file_info = bot.get_file(file_id)
            downloaded = bot.download_file(file_info.file_path)

            # Editar con Gemini
            edited = vulcano.edit_image_gemini(downloaded, caption)
            if edited:
                save_last_image(chat_id, edited, caption)
                tg_send_photo(chat_id, edited, caption=f"✅ {caption[:100]}")
            else:
                # Si falla la edicion, intentar generar nueva basada en la descripcion
                tg_send(chat_id, "⚠️ No pude editar. Generando nueva imagen basada en tu instrucción...")
                result = vulcano.create(caption, creation_type="image")
                if result and result.get("type") == "image":
                    save_last_image(chat_id, result["content"], caption)
                    tg_send_photo(chat_id, result["content"], caption=f"🎨 {caption[:100]}")
                else:
                    tg_send(chat_id, "❌ No pude procesar la imagen. Intenta de nuevo.")
        except Exception as e:
            logger.error(f"Error procesando foto: {e}")
            tg_send(chat_id, "❌ Error al procesar la foto.")

    # === MENSAJE LIBRE (Zeus orquesta) ===

    @bot.message_handler(func=lambda m: m.text and not m.text.startswith('/'), content_types=["text"])
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

        # Actualizar memoria inteligente
        smart_memory.update_from_interaction(msg.from_user.id, user_name, text)

        # XP por mensaje
        levels.add_xp(msg.from_user.id, user_name, "message")

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
