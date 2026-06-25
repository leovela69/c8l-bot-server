import os, sys, logging, threading, telebot
from http.server import BaseHTTPRequestHandler, HTTPServer

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from config import *
from modules.ai_chat import chat, chat_with_search, clear_history
from modules.images import generate_image, get_styles_text, STYLES
from modules.moderation import check_message, get_mod_stats
from modules.scheduler import AutoPublisher, ReminderChecker, add_reminder, get_auto_message

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s", handlers=[logging.StreamHandler(sys.stdout)])
logger = logging.getLogger("hermes")

bot = telebot.TeleBot(TELEGRAM_BOT_TOKEN, parse_mode="Markdown")

@bot.message_handler(commands=['start', 'help'])
def cmd_start(message):
    bot.reply_to(message, "*HERMES C8L — El Obrero del Panteon*\n\n/imagen [estilo] [prompt] - Genero imagenes\n/chat [pregunta] - Chat IA\n/buscar [tema] - Busco info\n/recordar [min] [texto] - Recordatorio\n/stats - Estadisticas\n/estilos - Estilos de imagen\n/publicar [texto] - Publicar en grupo (admin)\n/reset - Borrar memoria\n\nO escribeme directo.\n_Hermes entrega. Siempre._")

@bot.message_handler(commands=['estilos'])
def cmd_styles(message):
    bot.reply_to(message, get_styles_text())

@bot.message_handler(commands=['imagen', 'img'])
def cmd_image(message):
    args = message.text.split(maxsplit=2)
    if len(args) < 2:
        bot.reply_to(message, "Uso: /imagen [estilo] [descripcion]\nEjemplo: /imagen flux dragon neon")
        return
    style = "flux"
    if len(args) >= 3 and args[1].lower() in STYLES:
        style = args[1].lower()
        prompt = args[2]
    else:
        prompt = " ".join(args[1:])
    wait = bot.reply_to(message, f"Generando con estilo {style}...")
    result = generate_image(prompt, style)
    if result:
        bot.delete_message(message.chat.id, wait.message_id)
        bot.send_photo(message.chat.id, result, caption=f"*{prompt[:80]}*\nEstilo: {style}", reply_to_message_id=message.message_id)
    else:
        bot.edit_message_text("No pude generar la imagen. Intenta otro prompt.", message.chat.id, wait.message_id)

@bot.message_handler(commands=['chat', 'ask'])
def cmd_chat(message):
    args = message.text.split(maxsplit=1)
    if len(args) < 2:
        bot.reply_to(message, "Uso: /chat [tu pregunta]")
        return
    reply = chat(message.from_user.id, args[1], message.from_user.username or "user")
    bot.reply_to(message, reply)

@bot.message_handler(commands=['buscar', 'search'])
def cmd_search(message):
    args = message.text.split(maxsplit=1)
    if len(args) < 2:
        bot.reply_to(message, "Uso: /buscar [tema]")
        return
    reply = chat_with_search(message.from_user.id, args[1], message.from_user.username or "user")
    bot.reply_to(message, reply)

@bot.message_handler(commands=['recordar'])
def cmd_reminder(message):
    args = message.text.split(maxsplit=2)
    if len(args) < 3:
        bot.reply_to(message, "Uso: /recordar [minutos] [texto]")
        return
    try:
        mins = int(args[1])
    except:
        bot.reply_to(message, "Primer argumento debe ser minutos.")
        return
    add_reminder(message.from_user.id, message.from_user.username or "user", args[2], mins)
    bot.reply_to(message, f"Recordatorio en {mins} minutos: {args[2]}")

@bot.message_handler(commands=['reset'])
def cmd_reset(message):
    clear_history(message.from_user.id)
    bot.reply_to(message, "Memoria limpia.")

@bot.message_handler(commands=['publicar'])
def cmd_publish(message):
    if str(message.from_user.id) != ADMIN_CHAT_ID:
        return
    args = message.text.split(maxsplit=1)
    if len(args) < 2:
        bot.reply_to(message, "Uso: /publicar [texto]")
        return
    try:
        bot.send_message(GROUP_CHAT_ID, args[1])
        bot.reply_to(message, "Publicado.")
    except Exception as e:
        bot.reply_to(message, f"Error: {e}")

@bot.message_handler(commands=['stats'])
def cmd_stats(message):
    bot.reply_to(message, f"Hermes online. Mod stats: {get_mod_stats()}")

@bot.message_handler(func=lambda m: m.chat.type in ['group', 'supergroup'], content_types=['text'])
def handle_group(message):
    action, details = check_message(message)
    if action == 'ban':
        try:
            bot.ban_chat_member(message.chat.id, details["user_id"])
            bot.reply_to(message, f"Baneado @{details['username']}: {details['reason']}")
        except:
            pass
    elif action == 'warn':
        bot.reply_to(message, f"@{details['username']}: {details['reason']}")
    elif action == 'delete':
        try:
            bot.delete_message(message.chat.id, message.message_id)
        except:
            pass
    if message.text and ("@hermes_c8l_bot" in message.text.lower() or "hermes" in message.text.lower()):
        clean = message.text.replace("@hermes_c8l_bot", "").strip()
        if clean:
            reply = chat(message.from_user.id, clean, message.from_user.username or "user", fast=True)
            bot.reply_to(message, reply)

@bot.message_handler(func=lambda m: m.chat.type == 'private', content_types=['text'])
def handle_private(message):
    reply = chat_with_search(message.from_user.id, message.text, message.from_user.username or "user")
    bot.reply_to(message, reply)

class HealthHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.end_headers()
        self.wfile.write(b'{"status":"ok","bot":"hermes"}')
    def log_message(self, *a):
        pass

def main():
    logger.info("HERMES C8L Bot v1.0 iniciando...")
    threading.Thread(target=lambda: HTTPServer(("0.0.0.0", PORT), HealthHandler).serve_forever(), daemon=True).start()
    try:
        bot.delete_webhook(drop_pending_updates=True)
    except:
        pass
    AutoPublisher(bot).start()
    ReminderChecker(bot).start()
    try:
        bot.send_message(ADMIN_CHAT_ID, "Hermes C8L online! Listo para trabajar.")
    except:
        pass
    logger.info("Hermes polling activo...")
    bot.infinity_polling(timeout=30, long_polling_timeout=30)

if __name__ == "__main__":
    main()
