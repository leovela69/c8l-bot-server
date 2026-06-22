import io, os, sys, logging, asyncio, threading, requests, json
from http.server import BaseHTTPRequestHandler, HTTPServer
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from config import *

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s - %(message)s", handlers=[logging.StreamHandler(sys.stdout)])
logger = logging.getLogger("leovelabot")

_loop = asyncio.new_event_loop()
threading.Thread(target=_loop.run_forever, daemon=True).start()

def run_async(coro):
    return asyncio.run_coroutine_threadsafe(coro, _loop).result(timeout=120)

TG_API = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}"

def tg_send(chat_id, text):
    while text:
        requests.post(f"{TG_API}/sendMessage", json={"chat_id": chat_id, "text": text[:4096]}, timeout=10)
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

_history = {}

def get_history(chat_id):
    return _history.setdefault(chat_id, [])

def add_history(chat_id, role, text):
    h = get_history(chat_id)
    h.append({"role": role, "text": text})
    if len(h) > MAX_HISTORY_PER_USER * 2:
        _history[chat_id] = h[-MAX_HISTORY_PER_USER:]

def call_groq(prompt, system_prompt=""):
    headers = {"Authorization": f"Bearer {GROQ_API_KEY}", "Content-Type": "application/json"}
    messages = []
    if system_prompt:
        messages.append({"role": "system", "content": system_prompt})
    messages.append({"role": "user", "content": prompt})
    r = requests.post("https://api.groq.com/openai/v1/chat/completions", headers=headers,
        json={"model": GROQ_MODEL, "messages": messages, "temperature": 0.85, "max_tokens": 4096}, timeout=30)
    r.raise_for_status()
    return r.json()["choices"][0]["message"]["content"].strip()

def call_nvidia(prompt, system_prompt=""):
    headers = {"Authorization": f"Bearer {NVIDIA_API_KEY}", "Content-Type": "application/json"}
    messages = []
    if system_prompt:
        messages.append({"role": "system", "content": system_prompt})
    messages.append({"role": "user", "content": prompt})
    r = requests.post("https://integrate.api.nvidia.com/v1/chat/completions", headers=headers,
        json={"model": NVIDIA_MODEL, "messages": messages, "temperature": 0.85, "max_tokens": 4096, "stream": False}, timeout=60)
    r.raise_for_status()
    return r.json()["choices"][0]["message"]["content"].strip()

async def generate_text(prompt, system_prompt=""):
    try:
        return call_groq(prompt, system_prompt)
    except Exception as e:
        logger.warning(f"Groq: {str(e)[:60]}")
    try:
        return call_nvidia(prompt, system_prompt)
    except Exception as e:
        logger.warning(f"NVIDIA: {str(e)[:60]}")
    return None

async def process_message(text, chat_id, user_name):
    history = get_history(chat_id)
    ht = "\n".join(f"{'Usuario' if m['role']=='user' else 'Leo'}: {m['text']}" for m in history[-MAX_HISTORY_PER_USER:])
    prompt = f"El usuario se llama {user_name}.\n{'Historial:' if ht else ''}\n{ht}\n\nUsuario: {text}\n\nLeo:"
    reply = await generate_text(prompt, SYSTEM_PROMPT)
    if reply:
        add_history(chat_id, "user", text)
        add_history(chat_id, "assistant", reply)
    return reply

def generate_image(prompt):
    """Genera imagen real con Pollinations.ai (gratis, sin API key)."""
    try:
        from urllib.parse import quote
        url = f"https://image.pollinations.ai/prompt/{quote(prompt)}"
        r = requests.get(url, timeout=60)
        if r.status_code == 200 and "image" in r.headers.get("content-type", ""):
            return r.content
    except Exception as e:
        logger.error(f"Pollinations error: {e}")
    return None

def generate_code(prompt):
    """Genera codigo real y lo devuelve como archivo."""
    code_prompt = f"""Genera SOLO codigo basado en esta peticion: {prompt}

REGLAS:
- Si es un juego o app web: genera UN archivo HTML completo con CSS y JS inline
- Si es un script: genera el codigo Python/JS completo
- NO expliques nada, SOLO el codigo
- Empieza directamente con el codigo (<!DOCTYPE html> o #!/usr/bin/env python3)
- El codigo debe ser FUNCIONAL y COMPLETO"""
    try:
        code = call_groq(code_prompt, "Eres un programador experto. Solo respondes con codigo funcional completo. Sin explicaciones.")
        if code.startswith("```"):
            lines = code.split("\n")
            code = "\n".join(lines[1:-1]) if lines[-1].strip() == "```" else "\n".join(lines[1:])
        return code
    except Exception as e:
        logger.error(f"Code gen error: {e}")
    return None

def detect_intent(text):
    """Detecta que quiere el usuario: image, code, video, pdf, chat."""
    t = text.lower()
    img_kw = ["imagen", "dibuja", "genera imagen", "foto", "picture", "draw", "ilustra", "retrato", "logo", "banner", "disena", "diseña"]
    code_kw = ["juego", "game", "codigo", "programa", "script", "app", "html", "snake", "tetris", "web", "pagina"]
    video_kw = ["video", "clip", "animacion"]
    pdf_kw = ["pdf", "documento", "informe", "reporte"]
    prompt_kw = ["prompt para suno", "prompt para", "cancion", "letra de"]

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

class HealthHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps({"status": "healthy"}).encode())
    def log_message(self, fmt, *args): return

def main():
    from telebot import TeleBot
    logger.info("Iniciando @leon_leo_bot...")
    logger.info("  Chat: Groq + NVIDIA")
    logger.info("  Imagenes: Pollinations.ai")
    logger.info("  Codigo: Groq (archivos reales)")

    try:
        requests.post(f"{TG_API}/deleteWebhook", json={"drop_pending_updates": True}, timeout=10)
    except: pass

    threading.Thread(target=lambda: HTTPServer(("0.0.0.0", PORT), HealthHandler).serve_forever(), daemon=True).start()

    bot = TeleBot(TELEGRAM_BOT_TOKEN)

    try:
        bot.send_message(int(ADMIN_CHAT_ID), "Bot ACTIVO\nChat: Groq\nImagenes: Pollinations\nCodigo: archivos reales")
    except: pass

    @bot.message_handler(commands=["start"])
    def cmd_start(msg):
        bot.reply_to(msg, f"Hola {msg.from_user.first_name}! Soy Leo de C8L Agency.\n\nPuedo:\n- Crear IMAGENES reales\n- Generar CODIGO/JUEGOS (archivos)\n- Conversar sobre cualquier tema\n\nEscribeme lo que necesites.")

    @bot.message_handler(commands=["clear"])
    def cmd_clear(msg):
        _history.pop(msg.chat.id, None)
        bot.reply_to(msg, "Historial limpiado.")

    @bot.message_handler(func=lambda m: True, content_types=["text"])
    def handle_msg(msg):
        chat_id = msg.chat.id
        user_name = msg.from_user.first_name or "Usuario"
        text = msg.text
        logger.info(f"[{user_name}] ({chat_id}): {text[:80]}")

        intent = detect_intent(text)
        logger.info(f"  Intent: {intent}")

        try:
            if intent == "image":
                tg_upload_action(chat_id)
                img = generate_image(text)
                if img:
                    tg_send_photo(chat_id, img, caption=f"🎨 {text[:100]}")
                else:
                    tg_send(chat_id, "No pude generar la imagen. Intenta con otra descripcion.")
                return

            elif intent == "code":
                tg_typing(chat_id)
                code = generate_code(text)
                if code:
                    ext = "html" if "<!DOCTYPE" in code or "<html" in code else "py"
                    filename = f"c8l_codigo.{ext}"
                    tg_send_document(chat_id, code.encode("utf-8"), filename, caption=f"💻 {text[:100]}")
                else:
                    tg_send(chat_id, "No pude generar el codigo. Intenta de nuevo.")
                return

            elif intent == "video":
                tg_typing(chat_id)
                tg_send(chat_id, "🎬 Los videos requieren mas tiempo. Por ahora puedo generarte el guion y storyboard. Quieres que lo haga?")
                return

            elif intent == "pdf":
                tg_typing(chat_id)
                content = run_async(generate_text(f"Genera el contenido completo para un documento sobre: {text}", SYSTEM_PROMPT))
                if content:
                    tg_send_document(chat_id, content.encode("utf-8"), "documento_c8l.txt", caption=f"📄 {text[:100]}")
                else:
                    tg_send(chat_id, "No pude generar el documento.")
                return

            else:
                tg_typing(chat_id)
                reply = run_async(process_message(text, chat_id, user_name))
                if reply:
                    tg_send(chat_id, reply)
                else:
                    tg_send(chat_id, "Error temporal. Intentalo en 30 segundos.")

        except Exception as e:
            logger.error(f"Error: {e}")
            tg_send(chat_id, f"Error: {str(e)[:200]}")

    logger.info("@leon_leo_bot POLLING Listo")
    bot.infinity_polling(timeout=30, long_polling_timeout=25)

if __name__ == "__main__":
    main()
