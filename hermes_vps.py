# -*- coding: utf-8 -*-
"""
📢 HERMES VPS — Bot que controla tu servidor desde Telegram
==============================================================
Corre en tu VPS Hostinger. Recibe órdenes de:
- Tú (ADMIN) via Telegram
- @leon_leo_bot via HTTP API
- @Sayanyin_Bot via HTTP API

Funciones:
- Ejecutar comandos shell (/cmd)
- Controlar Docker (/docker)
- Git operations (/git)
- Ver logs (/logs)
- Instalar paquetes (/install)
- Health check API para Leon/Sayan

Seguridad:
- SOLO ADMIN puede ejecutar comandos via Telegram
- API protegida con BRIDGE_SECRET
- Comandos peligrosos BLOQUEADOS
- Timeout 30s por comando
- Log de TODO lo que se ejecuta
"""

import os
import sys
import time
import json
import logging
import subprocess
import threading
from http.server import BaseHTTPRequestHandler, HTTPServer
from datetime import datetime

# ===== CONFIG =====
HERMES_TOKEN = os.environ.get("HERMES_BOT_TOKEN", "")
ADMIN_CHAT_ID = os.environ.get("ADMIN_CHAT_ID", "")
BRIDGE_SECRET = os.environ.get("BRIDGE_SECRET", "")
API_PORT = int(os.environ.get("HERMES_PORT", "9090"))
MAX_OUTPUT = 3500  # Max chars en respuesta Telegram
CMD_TIMEOUT = 30   # Segundos max por comando

# IDs autorizados para dar órdenes via API
AUTHORIZED_BOTS = ["leon_leo_bot", "sayanyin_bot", "admin"]

# Comandos BLOQUEADOS (peligrosos)
BLOCKED_COMMANDS = [
    "rm -rf /", "rm -rf /*", "mkfs", "dd if=",
    "shutdown", "reboot", "halt", "poweroff",
    "passwd", "userdel", "deluser",
    "> /dev/sda", "chmod -R 777 /",
    ":(){ :|:& };:",  # fork bomb
]

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger("hermes.vps")



# ===== LOG DE COMANDOS =====
CMD_LOG_FILE = os.path.expanduser("~/hermes_cmd_log.json")
cmd_log = []


def log_command(user: str, command: str, output: str, success: bool):
    """Registra cada comando ejecutado."""
    entry = {
        "timestamp": datetime.now().isoformat(),
        "user": user,
        "command": command,
        "output": output[:500],
        "success": success
    }
    cmd_log.append(entry)
    if len(cmd_log) > 200:
        cmd_log.pop(0)
    try:
        with open(CMD_LOG_FILE, "w") as f:
            json.dump(cmd_log[-50:], f, ensure_ascii=False, indent=2)
    except:
        pass


# ===== EJECUTAR COMANDOS =====

def is_blocked(command: str) -> bool:
    """Verifica si un comando está bloqueado."""
    cmd_lower = command.lower().strip()
    for blocked in BLOCKED_COMMANDS:
        if blocked in cmd_lower:
            return True
    return False


def execute_command(command: str, cwd: str = None) -> dict:
    """Ejecuta un comando shell de forma segura."""
    if is_blocked(command):
        return {
            "success": False,
            "output": f"🚫 BLOQUEADO: Comando peligroso detectado.\n`{command}`"
        }

    try:
        result = subprocess.run(
            command, shell=True, capture_output=True,
            text=True, timeout=CMD_TIMEOUT,
            cwd=cwd or os.path.expanduser("~")
        )
        output = result.stdout + result.stderr
        output = output.strip()

        if len(output) > MAX_OUTPUT:
            output = output[:MAX_OUTPUT] + "\n\n... (truncado)"

        return {
            "success": result.returncode == 0,
            "output": output or "(sin output)",
            "return_code": result.returncode
        }
    except subprocess.TimeoutExpired:
        return {"success": False, "output": f"⏰ Timeout ({CMD_TIMEOUT}s)"}
    except Exception as e:
        return {"success": False, "output": f"❌ Error: {str(e)[:200]}"}



# ===== TELEGRAM BOT =====

import requests

TG_API = f"https://api.telegram.org/bot{HERMES_TOKEN}"


def tg_send(chat_id, text, parse_mode="Markdown"):
    """Envía mensaje via Telegram."""
    # Split si es muy largo
    while text:
        chunk = text[:4096]
        try:
            requests.post(f"{TG_API}/sendMessage", json={
                "chat_id": chat_id,
                "text": chunk,
                "parse_mode": parse_mode
            }, timeout=10)
        except:
            pass
        text = text[4096:]


def is_admin(user_id) -> bool:
    """Solo el admin puede usar comandos."""
    if not ADMIN_CHAT_ID:
        return True  # Si no hay admin definido, permitir todo (primer uso)
    return str(user_id) == str(ADMIN_CHAT_ID)


def handle_telegram_update(update: dict):
    """Procesa un mensaje de Telegram."""
    message = update.get("message", {})
    text = message.get("text", "")
    chat_id = message.get("chat", {}).get("id", 0)
    user_id = message.get("from", {}).get("id", 0)
    user_name = message.get("from", {}).get("first_name", "?")

    if not text:
        return

    # Verificar permisos
    if not is_admin(user_id):
        tg_send(chat_id, "🔒 No autorizado. Solo el admin puede usar Hermes VPS.")
        return

    # Comandos
    if text.startswith("/start") or text.startswith("/help"):
        tg_send(chat_id, (
            "📢 *HERMES VPS — Control Remoto*\n\n"
            "Comandos:\n"
            "`/cmd [comando]` — Ejecutar shell\n"
            "`/docker ps` — Ver containers\n"
            "`/docker logs [name]` — Ver logs\n"
            "`/git pull` — Actualizar repos\n"
            "`/logs [archivo]` — Ver últimas líneas\n"
            "`/install [paquete]` — Instalar con pip/apt\n"
            "`/status` — Estado del servidor\n"
            "`/history` — Últimos comandos\n\n"
            "🔒 Solo tú (admin) puedes usarme."
        ))

    elif text.startswith("/cmd "):
        cmd = text[5:].strip()
        logger.info(f"CMD [{user_name}]: {cmd}")
        result = execute_command(cmd)
        icon = "✅" if result["success"] else "❌"
        tg_send(chat_id, f"{icon} `{cmd}`\n\n```\n{result['output']}\n```")
        log_command(user_name, cmd, result["output"], result["success"])

    elif text.startswith("/docker"):
        docker_cmd = text[7:].strip() or "ps"
        cmd = f"docker {docker_cmd}"
        result = execute_command(cmd)
        tg_send(chat_id, f"🐳 `{cmd}`\n\n```\n{result['output']}\n```")
        log_command(user_name, cmd, result["output"], result["success"])

    elif text.startswith("/git"):
        git_cmd = text[4:].strip() or "status"
        cmd = f"git {git_cmd}"
        result = execute_command(cmd)
        tg_send(chat_id, f"📦 `{cmd}`\n\n```\n{result['output']}\n```")
        log_command(user_name, cmd, result["output"], result["success"])

    elif text.startswith("/logs"):
        target = text[5:].strip() or "/var/log/syslog"
        cmd = f"tail -30 {target}"
        result = execute_command(cmd)
        tg_send(chat_id, f"📄 `{cmd}`\n\n```\n{result['output']}\n```")

    elif text.startswith("/install "):
        pkg = text[9:].strip()
        cmd = f"pip install {pkg}"
        result = execute_command(cmd)
        tg_send(chat_id, f"📦 `{cmd}`\n\n```\n{result['output']}\n```")
        log_command(user_name, cmd, result["output"], result["success"])

    elif text.startswith("/status"):
        cmds = ["uptime", "free -h | head -3", "df -h / | tail -1", "docker ps --format '{{.Names}}: {{.Status}}'"]
        output = "📊 *Estado del VPS:*\n\n"
        for c in cmds:
            r = execute_command(c)
            output += f"`{c}`\n```\n{r['output']}\n```\n"
        tg_send(chat_id, output)

    elif text.startswith("/history"):
        if cmd_log:
            output = "📜 *Últimos comandos:*\n\n"
            for entry in cmd_log[-10:]:
                icon = "✅" if entry["success"] else "❌"
                output += f"{icon} `{entry['command']}`\n"
            tg_send(chat_id, output)
        else:
            tg_send(chat_id, "Sin historial aún.")

    else:
        tg_send(chat_id, "Usa `/cmd [comando]` para ejecutar. `/help` para ver opciones.")



# ===== API HTTP — Para que Leon/Sayan envíen órdenes =====

class HermesAPIHandler(BaseHTTPRequestHandler):
    """API HTTP para recibir órdenes de Leon y Sayan."""

    def do_GET(self):
        if self.path == "/health" or self.path == "/":
            self._respond(200, {"status": "alive", "bot": "hermes_vps",
                                "uptime": time.time(), "commands_executed": len(cmd_log)})
        else:
            self._respond(404, {"error": "not found"})

    def do_POST(self):
        try:
            length = int(self.headers.get("Content-Length", 0))
            body = json.loads(self.rfile.read(length))
        except:
            self._respond(400, {"error": "invalid json"})
            return

        # Verificar secret
        if body.get("secret") != BRIDGE_SECRET:
            self._respond(403, {"error": "unauthorized"})
            return

        # Ejecutar comando
        if self.path == "/api/cmd":
            command = body.get("command", "")
            source = body.get("source", "unknown")
            cwd = body.get("cwd")

            if not command:
                self._respond(400, {"error": "no command"})
                return

            logger.info(f"API CMD [{source}]: {command}")
            result = execute_command(command, cwd=cwd)
            log_command(f"api:{source}", command, result["output"], result["success"])

            # Notificar al admin via Telegram
            icon = "✅" if result["success"] else "❌"
            if ADMIN_CHAT_ID:
                tg_send(int(ADMIN_CHAT_ID),
                    f"🤖 *Orden remota [{source}]:*\n"
                    f"{icon} `{command}`\n\n```\n{result['output'][:1000]}\n```")

            self._respond(200, result)

        elif self.path == "/api/status":
            r = execute_command("uptime && free -h | head -2 && docker ps --format '{{.Names}}: {{.Status}}'")
            self._respond(200, {"status": "alive", "system": r["output"]})

        elif self.path == "/api/revive_hermes":
            # Endpoint para que Sayan reanime a Hermes (self-restart)
            self._respond(200, {"status": "restarting"})
            # Restart after response
            threading.Thread(target=lambda: (time.sleep(1), os.execv(sys.executable, [sys.executable] + sys.argv)), daemon=True).start()

        else:
            self._respond(404, {"error": "unknown endpoint"})

    def _respond(self, code, data):
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())

    def log_message(self, format, *args):
        pass  # Silenciar logs HTTP


# ===== MAIN =====

def run_api_server():
    """Corre el API server en un thread."""
    server = HTTPServer(("0.0.0.0", API_PORT), HermesAPIHandler)
    logger.info(f"🌐 Hermes API en puerto {API_PORT}")
    server.serve_forever()


def run_telegram_polling():
    """Polling de Telegram (loop principal)."""
    offset = 0
    logger.info("📢 Hermes Telegram polling activo")

    while True:
        try:
            r = requests.get(
                f"{TG_API}/getUpdates",
                params={"offset": offset, "timeout": 30},
                timeout=35
            )
            if r.status_code == 200:
                for update in r.json().get("result", []):
                    offset = update["update_id"] + 1
                    handle_telegram_update(update)
        except Exception as e:
            logger.error(f"Polling error: {e}")
            time.sleep(5)


def main():
    print("=" * 50)
    print("  📢 HERMES VPS — Control Remoto")
    print(f"  Bot: @hermes_c8l_bot")
    print(f"  API: puerto {API_PORT}")
    print(f"  Admin: {ADMIN_CHAT_ID or 'no definido'}")
    print("=" * 50)

    if not HERMES_TOKEN:
        print("ERROR: HERMES_BOT_TOKEN no configurado")
        sys.exit(1)

    # API server en thread separado
    threading.Thread(target=run_api_server, daemon=True).start()

    # Notificar al admin que Hermes arrancó
    if ADMIN_CHAT_ID:
        tg_send(int(ADMIN_CHAT_ID),
            "📢 *HERMES VPS ONLINE*\n\n"
            "✅ Control remoto activo\n"
            f"🌐 API: puerto {API_PORT}\n"
            "🔒 Solo admin autorizado\n\n"
            "Usa `/cmd [comando]` para controlar el servidor.")

    # Telegram polling (bloquea)
    run_telegram_polling()


if __name__ == "__main__":
    main()
