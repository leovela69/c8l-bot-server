import io, os, sys, logging, asyncio, threading, requests, json
from http.server import BaseHTTPRequestHandler, HTTPServer
from flask import Flask, request as flask_request, jsonify

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

def tg_typing(chat_id):
    requests.post(f"{TG_API}/sendChatAction", json={"chat_id": chat_id, "action": "typing"}, timeout=5)

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
        json={"model": GROQ_MODEL, "messages": messages, "temperature": 0.85, "max_tokens": 2048}, timeout=30)
    r.raise_for_status()
    return r.json()["choices"][0]["message"]["content"].strip()

def call_nvidia(prompt, system_prompt=""):
    headers = {"Authorization": f"Bearer {NVIDIA_API_KEY}", "Content-Type": "application/json"}
    messages = []
    if system_prompt:
        messages.append({"role": "system", "content": system_prompt})
    messages.append({"role": "user", "content": prompt})
    r = requests.post("https://integrate.api.nvidia.com/v1/chat/completions", headers=headers,
        json={"model": NVIDIA_MODEL, "messages": messages, "temperature": 0.85, "max_tokens": 2048, "stream": False}, timeout=60)
    r.raise_for_status()
    return r.json()["choices"][0]["message"]["content"].strip()

async def generate_text(prompt, system_prompt=""):
    try:
        result = call_groq(prompt, system_prompt)
        logger.info("OK Groq")
        return result
    except Exception as e:
        logger.warning(f"Groq fallo: {str(e)[:80]}")
    try:
        result = call_nvidia(prompt, system_prompt)
        logger.info("OK NVIDIA")
        return result
    except Exception as e:
        logger.warning(f"NVIDIA fallo: {str(e)[:80]}")
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

# --- WHATSAPP ---
WA_TOKEN = "EAAePXyOIVAEBR1cvJMs256N8i861mb1m018i7siw4cXJr3ZC9e26FJLwTxT51nzbzUQWnhLxS9xkoHq2Etrr86hVZBLx35GsxNxAiiGnH71NhcLuEreONJc1YQ2mDplFYhkLxUr4x3m5jZCB8WYX4IzN0y5QBSNHwgBouQhUTPpSkyfYfVZBOhmIKBaHanZBEzMi39iAIUFuXVdj6MpQegClDbhJndrp6tdZCUHFzVHlEuvkwyLfcvrnbjQEdOqvZC594sEnWZCpeGZAGqXJ4jvCcP8SJcV8jOjjvnsgZD"
WA_PHONE_ID = "1078712428668775"
WA_VERIFY = "c8l_leovela_2026"
WA_API = f"https://graph.facebook.com/v25.0/{WA_PHONE_ID}/messages"

def wa_send(phone, text):
    headers = {"Authorization": f"Bearer {WA_TOKEN}", "Content-Type": "application/json"}
    while text:
        chunk = text[:4096]
        requests.post(WA_API, headers=headers, json={"messaging_product": "whatsapp", "to": phone, "type": "text", "text": {"body": chunk}}, timeout=10)
        text = text[4096:]

wa_app = Flask(__name__)

@wa_app.route("/webhook", methods=["GET"])
def wa_verify():
    token = flask_request.args.get("hub.verify_token")
    challenge = flask_request.args.get("hub.challenge")
    if token == WA_VERIFY:
        return challenge, 200
    return "Forbidden", 403

@wa_app.route("/webhook", methods=["POST"])
def wa_receive():
    data = flask_request.get_json()
    try:
        messages = data.get("entry", [{}])[0].get("changes", [{}])[0].get("value", {}).get("messages", [])
        if not messages or messages[0].get("type") != "text":
            return jsonify({"ok": True}), 200
        phone = messages[0]["from"]
        text = messages[0]["text"]["body"]
        name = data.get("entry", [{}])[0].get("changes", [{}])[0].get("value", {}).get("contacts", [{}])[0].get("profile", {}).get("name", "Usuario")
        logger.info(f"WA [{name}] ({phone}): {text[:80]}")
        reply = run_async(process_message(text, int(phone[-10:]), name))
        wa_send(phone, reply if reply else "Error temporal.")
    except Exception as e:
        logger.error(f"WA error: {e}")
    return jsonify({"ok": True}), 200

@wa_app.route("/", methods=["GET"])
def wa_health():
    return jsonify({"status": "healthy"}), 200

def run_whatsapp():
    logger.info("WhatsApp webhook en puerto 5000")
    wa_app.run(host="0.0.0.0", port=5000, debug=False)

# --- MAIN ---
def main():
    from telebot import TeleBot
    logger.info("Iniciando @leon_leo_bot (Groq + NVIDIA + WhatsApp)...")

    try:
        requests.post(f"{TG_API}/deleteWebhook", json={"drop_pending_updates": True}, timeout=10)
    except:
        pass

    # WhatsApp en background
    threading.Thread(target=run_whatsapp, daemon=True).start()

    bot = TeleBot(TELEGRAM_BOT_TOKEN)

    try:
        bot.send_message(int(ADMIN_CHAT_ID), "Bot ACTIVO\nGroq + NVIDIA + WhatsApp")
    except:
        pass

    @bot.message_handler(commands=["start"])
    def cmd_start(msg):
        bot.reply_to(msg, f"Hola {msg.from_user.first_name}! Soy Leo de C8L Agency. Escribeme lo que necesites.")

    @bot.message_handler(commands=["clear"])
    def cmd_clear(msg):
        _history.pop(msg.chat.id, None)
        bot.reply_to(msg, "Historial limpiado.")

    @bot.message_handler(func=lambda m: True, content_types=["text"])
    def handle_msg(msg):
        tg_typing(msg.chat.id)
        try:
            reply = run_async(process_message(msg.text, msg.chat.id, msg.from_user.first_name or "Usuario"))
            if reply:
                tg_send(msg.chat.id, reply)
            else:
                tg_send(msg.chat.id, "Error temporal. Intentalo en 30 segundos.")
        except Exception as e:
            tg_send(msg.chat.id, f"Error: {str(e)[:200]}")

    logger.info("@leon_leo_bot POLLING + WhatsApp webhook Listo")
    bot.infinity_polling(timeout=30, long_polling_timeout=25)

if __name__ == "__main__":
    main()
