import os, sys, logging, threading, telebot
from http.server import BaseHTTPRequestHandler, HTTPServer

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from config import *
from modules.ai_chat import chat, chat_with_search, clear_history
from modules.images import generate_image, get_styles_text, STYLES
from modules.moderation import check_message, get_mod_stats
from modules.scheduler import AutoPublisher, ReminderChecker, add_reminder, get_auto_message
from modules.health_monitor import HealthMonitor
from modules.premium import PremiumManager
from modules.apolo import Apolo
from modules.api_server import start_api_server, set_handlers
from modules.guardian import Guardian

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

# === COMANDOS DE SEGURIDAD (GUARDIAN) ===

@bot.message_handler(commands=['seguridad', 'security'])
def cmd_security(message):
    """Solo Leo puede ver el reporte de seguridad."""
    guardian = Guardian(bot)
    if not guardian.is_owner(message.from_user.id):
        guardian.reject_unauthorized(message)
        return
    bot.reply_to(message, guardian.get_security_report())

@bot.message_handler(commands=['shutdown', 'apagar', 'kill'])
def cmd_shutdown(message):
    """Solo Leo con contrasena puede apagar."""
    guardian = Guardian(bot)
    if not guardian.is_owner(message.from_user.id):
        guardian.reject_unauthorized(message)
        return
    args = message.text.split()
    if len(args) >= 2 and guardian.verify_master_password(args[-1]):
        bot.reply_to(message, "🔌 Apagando Hermes... Hasta pronto, jefe.")
        import sys
        sys.exit(0)
    else:
        bot.reply_to(message, "🔐 Necesitas la contrasena maestra.\nUso: `/shutdown [contrasena]`")

@bot.message_handler(commands=['premium_code', 'generar_codigo'])
def cmd_premium_code(message):
    """Solo Leo puede generar codigos premium."""
    guardian = Guardian(bot)
    if not guardian.is_owner(message.from_user.id):
        guardian.reject_unauthorized(message)
        return
    premium = PremiumManager()
    code = premium.generate_code(created_by="admin", max_uses=1, days_valid=30)
    bot.reply_to(message, f"👑 *Codigo Premium creado:*\n\n`{code}`\n\nComparte este codigo con tu streamer.\nValido 30 dias, 1 uso.")

@bot.message_handler(commands=['finanzas', 'reporte'])
def cmd_finanzas(message):
    """Solo Leo ve las finanzas."""
    guardian = Guardian(bot)
    if not guardian.is_owner(message.from_user.id):
        guardian.reject_unauthorized(message)
        return
    apolo = Apolo()
    bot.reply_to(message, apolo.get_daily_report())

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
    logger.info("HERMES C8L Bot v2.0 iniciando...")
    threading.Thread(target=lambda: HTTPServer(("0.0.0.0", PORT), HealthHandler).serve_forever(), daemon=True).start()

    # Inicializar modulos
    premium = PremiumManager()
    apolo = Apolo()
    guardian = Guardian(bot)

    # Iniciar API server (puerto 8081) para la web
    set_handlers(bot, chat_with_search, generate_image, premium, apolo)
    start_api_server()

    try:
        bot.delete_webhook(drop_pending_updates=True)
    except:
        pass
    AutoPublisher(bot).start()
    ReminderChecker(bot).start()
    HealthMonitor(bot).start()
    try:
        bot.send_message(ADMIN_CHAT_ID, "⚡ *Hermes C8L v2.0 online!*\n\n🌐 API: puerto 8081\n👑 Premium: activo\n🏦 Apolo: activo\n🛡️ Guardian: protegiendo a Zeus\n⚡ HealthMonitor: vigilando Zeus\n\n_Hermes entrega. Siempre._")
    except:
        pass
    logger.info("Hermes polling activo...")
    bot.infinity_polling(timeout=30, long_polling_timeout=30)

if __name__ == "__main__":
    main()
