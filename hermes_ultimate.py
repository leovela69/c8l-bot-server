#!/usr/bin/env python3
"""
📢 HERMES ULTIMATE — Bot de Control Remoto POTENCIADO AL MAXIMO
=================================================================
Version mejorada con:
- Cerebro IA (OpenRouter gratuito)
- Memoria persistente (Atlas)
- Ejecucion de comandos shell
- Docker, Git, Logs
- Auto-reconexion si pierde conexion
- Generacion de PDFs
- Descarga de archivos
- Respuestas inteligentes
"""
import subprocess
import logging
import json
import os
import time
import asyncio
from datetime import datetime
from telegram import Update, InputFile
from telegram.ext import (
    Application, CommandHandler, MessageHandler,
    filters, ContextTypes
)

# ===== CONFIG =====
TOKEN = os.environ.get("HERMES_BOT_TOKEN", "")
OPENROUTER_KEY = os.environ.get("OPENROUTER_API_KEY", "")
MEMORY_FILE = os.path.expanduser("~/hermes_memory.json")
LOG_FILE = os.path.expanduser("~/hermes_commands.log")
CMD_TIMEOUT = 60
MAX_OUTPUT = 3500

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s"
)
logger = logging.getLogger("hermes")



# ===== ATLAS — Memoria Persistente =====

class Atlas:
    """Memoria persistente para Hermes."""

    def __init__(self):
        self.data = self._load()

    def remember(self, key: str, value: str):
        self.data["memories"][key] = {
            "value": value,
            "timestamp": datetime.now().isoformat()
        }
        self._save()

    def recall(self, key: str) -> str:
        entry = self.data["memories"].get(key)
        if entry:
            return entry["value"]
        return None

    def search(self, query: str) -> list:
        results = []
        for key, entry in self.data["memories"].items():
            if query.lower() in key.lower() or query.lower() in entry["value"].lower():
                results.append(f"[{key}]: {entry['value'][:100]}")
        return results

    def log_cmd(self, user: str, command: str, output: str, success: bool):
        entry = {
            "time": datetime.now().isoformat(),
            "user": user,
            "cmd": command,
            "output": output[:200],
            "ok": success
        }
        self.data["history"].append(entry)
        if len(self.data["history"]) > 500:
            self.data["history"] = self.data["history"][-500:]
        self._save()

    def get_history(self, n: int = 10) -> list:
        return self.data["history"][-n:]

    def get_stats(self) -> dict:
        total = len(self.data["history"])
        ok = sum(1 for h in self.data["history"] if h.get("ok"))
        return {
            "total_commands": total,
            "success": ok,
            "failed": total - ok,
            "memories": len(self.data["memories"])
        }

    def _load(self) -> dict:
        if os.path.exists(MEMORY_FILE):
            try:
                with open(MEMORY_FILE, "r") as f:
                    return json.load(f)
            except:
                pass
        return {"memories": {}, "history": []}

    def _save(self):
        with open(MEMORY_FILE, "w") as f:
            json.dump(self.data, f, ensure_ascii=False, indent=2)


atlas = Atlas()



# ===== CEREBRO IA (OpenRouter) =====

import httpx

async def think(prompt: str, context: str = "") -> str:
    """Hermes piensa usando OpenRouter (gratis)."""
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            r = await client.post(
                "https://openrouter.ai/api/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {OPENROUTER_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": "deepseek/deepseek-v4-flash:free",
                    "messages": [
                        {"role": "system", "content": (
                            "Eres HERMES, un asistente de servidor VPS. "
                            "Respondes en espanol, breve y tecnico. "
                            "Puedes ejecutar comandos shell. "
                            "Si te piden algo que requiere un comando, "
                            "sugiere el comando exacto."
                        )},
                        {"role": "user", "content": f"{context}\n\n{prompt}" if context else prompt}
                    ],
                    "temperature": 0.7,
                    "max_tokens": 1000
                }
            )
            if r.status_code == 200:
                data = r.json()
                return data["choices"][0]["message"]["content"]
    except Exception as e:
        logger.error(f"Think error: {e}")
    return None



# ===== EJECUCION DE COMANDOS =====

BLOCKED = ["rm -rf /", "rm -rf /*", "mkfs", "shutdown", "reboot",
           "halt", "poweroff", ":(){ :|:& };:", "> /dev/sda"]


def execute(command: str, cwd: str = None) -> dict:
    """Ejecuta comando shell de forma segura."""
    for b in BLOCKED:
        if b in command.lower():
            return {"ok": False, "output": f"BLOQUEADO: {command}"}
    try:
        r = subprocess.run(
            command, shell=True, capture_output=True,
            text=True, timeout=CMD_TIMEOUT,
            cwd=cwd or os.path.expanduser("~")
        )
        output = (r.stdout + r.stderr).strip() or "(sin output)"
        if len(output) > MAX_OUTPUT:
            output = output[:MAX_OUTPUT] + "\n...(truncado)"
        return {"ok": r.returncode == 0, "output": output}
    except subprocess.TimeoutExpired:
        return {"ok": False, "output": f"Timeout ({CMD_TIMEOUT}s)"}
    except Exception as e:
        return {"ok": False, "output": f"Error: {e}"}



# ===== HANDLERS DE TELEGRAM =====

async def cmd_start(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text(
        "📢 *HERMES ULTIMATE* — Control Total\n\n"
        "*Comandos:*\n"
        "/cmd [comando] — Ejecutar shell\n"
        "/status — Estado del servidor\n"
        "/docker [cmd] — Docker\n"
        "/git [cmd] — Git\n"
        "/logs [archivo] — Ver logs\n"
        "/pdf [archivo.md] — Generar PDF\n"
        "/file [path] — Descargar archivo\n"
        "/memory [buscar/guardar] — Memoria\n"
        "/history — Ultimos comandos\n"
        "/ask [pregunta] — Preguntar a la IA\n"
        "/install [paquete] — Instalar\n\n"
        "O escribe naturalmente y te ayudo.",
        parse_mode="Markdown"
    )


async def cmd_cmd(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    command = update.message.text[5:].strip()
    if not command:
        await update.message.reply_text("Uso: /cmd uptime")
        return
    user = update.effective_user.first_name
    logger.info(f"CMD [{user}]: {command}")
    result = execute(command)
    atlas.log_cmd(user, command, result["output"], result["ok"])
    icon = "✅" if result["ok"] else "❌"
    await update.message.reply_text(f"{icon} `{command}`\n\n{result['output']}")


async def cmd_status(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    r = execute("uptime && echo '---' && free -h | head -3 && echo '---' && df -h / | tail -1 && echo '---' && docker ps --format '{{.Names}}: {{.Status}}' 2>/dev/null || echo 'Docker: no running'")
    stats = atlas.get_stats()
    await update.message.reply_text(
        f"📊 *HERMES STATUS*\n\n"
        f"```\n{r['output']}\n```\n\n"
        f"📝 Comandos: {stats['total_commands']} ({stats['success']} ok, {stats['failed']} fail)\n"
        f"🧠 Memorias: {stats['memories']}",
        parse_mode="Markdown"
    )


async def cmd_docker(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    docker_cmd = update.message.text[8:].strip() or "ps"
    result = execute(f"docker {docker_cmd}")
    await update.message.reply_text(f"🐳 docker {docker_cmd}\n\n{result['output']}")


async def cmd_git(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    git_cmd = update.message.text[5:].strip() or "status"
    result = execute(f"git {git_cmd}")
    await update.message.reply_text(f"📦 git {git_cmd}\n\n{result['output']}")


async def cmd_logs(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    target = update.message.text[6:].strip() or "/var/log/syslog"
    result = execute(f"tail -30 {target}")
    await update.message.reply_text(f"📄 {target}\n\n{result['output']}")


async def cmd_install(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    pkg = update.message.text[9:].strip()
    if not pkg:
        await update.message.reply_text("Uso: /install pandoc")
        return
    result = execute(f"apt install -y {pkg} 2>&1 | tail -5")
    await update.message.reply_text(f"📦 install {pkg}\n\n{result['output']}")


async def cmd_pdf(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    """Genera PDF desde un archivo .md"""
    target = update.message.text[5:].strip()
    if not target:
        await update.message.reply_text("Uso: /pdf DOSSIER_SESION_29JUN2026.md")
        return

    # Buscar el archivo
    paths_to_try = [
        target,
        os.path.expanduser(f"~/{target}"),
        os.path.expanduser(f"~/hermes-vps/{target}"),
    ]
    found = None
    for p in paths_to_try:
        if os.path.exists(p):
            found = p
            break

    if not found:
        await update.message.reply_text(f"Archivo no encontrado: {target}")
        return

    await update.message.reply_text("⏳ Generando PDF...")
    output_pdf = os.path.expanduser(f"~/output.pdf")
    output_html = os.path.expanduser(f"~/output.html")

    # Intentar con pandoc
    result = execute(f"pandoc '{found}' -o '{output_pdf}' 2>&1")
    if result["ok"] and os.path.exists(output_pdf):
        with open(output_pdf, "rb") as f:
            await update.message.reply_document(
                document=InputFile(f, filename=target.replace(".md", ".pdf")),
                caption="📄 PDF generado por Hermes"
            )
        return

    # Fallback: HTML
    result = execute(f"pandoc '{found}' -o '{output_html}' --standalone 2>&1")
    if result["ok"] and os.path.exists(output_html):
        # Intentar wkhtmltopdf
        result2 = execute(f"wkhtmltopdf '{output_html}' '{output_pdf}' 2>&1")
        if result2["ok"] and os.path.exists(output_pdf):
            with open(output_pdf, "rb") as f:
                await update.message.reply_document(
                    document=InputFile(f, filename=target.replace(".md", ".pdf")),
                    caption="📄 PDF generado por Hermes"
                )
            return

    # Fallback: enviar como HTML
    if os.path.exists(output_html):
        with open(output_html, "rb") as f:
            await update.message.reply_document(
                document=InputFile(f, filename=target.replace(".md", ".html")),
                caption="📄 HTML (instala pandoc+texlive para PDF)"
            )
    else:
        await update.message.reply_text(f"Error generando PDF: {result['output']}")


async def cmd_file(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    """Descarga un archivo del servidor."""
    target = update.message.text[6:].strip()
    if not target:
        await update.message.reply_text("Uso: /file /root/archivo.txt")
        return
    path = os.path.expanduser(target)
    if not os.path.exists(path):
        await update.message.reply_text(f"No existe: {target}")
        return
    size = os.path.getsize(path)
    if size > 50_000_000:
        await update.message.reply_text(f"Archivo muy grande ({size//1024//1024}MB). Max 50MB.")
        return
    try:
        with open(path, "rb") as f:
            await update.message.reply_document(
                document=InputFile(f, filename=os.path.basename(path)),
                caption=f"📁 {target} ({size//1024}KB)"
            )
    except Exception as e:
        await update.message.reply_text(f"Error: {e}")


async def cmd_memory(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    """Memoria persistente."""
    args = update.message.text[8:].strip()
    if not args:
        stats = atlas.get_stats()
        await update.message.reply_text(
            f"🧠 *Memoria Atlas*\n\n"
            f"Memorias: {stats['memories']}\n"
            f"Comandos: {stats['total_commands']}\n\n"
            f"Uso:\n"
            f"/memory guardar [clave] [valor]\n"
            f"/memory buscar [texto]\n"
            f"/memory ver [clave]",
            parse_mode="Markdown"
        )
        return

    parts = args.split(" ", 2)
    action = parts[0].lower()

    if action == "guardar" and len(parts) >= 3:
        atlas.remember(parts[1], parts[2])
        await update.message.reply_text(f"💾 Guardado: [{parts[1]}] = {parts[2]}")
    elif action == "buscar" and len(parts) >= 2:
        results = atlas.search(parts[1])
        if results:
            await update.message.reply_text("🔍 Resultados:\n" + "\n".join(results[:10]))
        else:
            await update.message.reply_text("Sin resultados.")
    elif action == "ver" and len(parts) >= 2:
        value = atlas.recall(parts[1])
        if value:
            await update.message.reply_text(f"🧠 [{parts[1]}]: {value}")
        else:
            await update.message.reply_text(f"No encontrado: {parts[1]}")
    else:
        await update.message.reply_text("Uso: /memory guardar|buscar|ver [args]")


async def cmd_history(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    """Ultimos comandos ejecutados."""
    history = atlas.get_history(10)
    if not history:
        await update.message.reply_text("Sin historial.")
        return
    text = "📜 *Ultimos comandos:*\n\n"
    for h in history:
        icon = "✅" if h.get("ok") else "❌"
        text += f"{icon} `{h['cmd']}`\n"
    await update.message.reply_text(text, parse_mode="Markdown")


async def cmd_ask(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    """Pregunta a la IA."""
    question = update.message.text[5:].strip()
    if not question:
        await update.message.reply_text("Uso: /ask como reinicio docker?")
        return
    # Contexto del sistema
    stats = atlas.get_stats()
    context = f"VPS Ubuntu 24.04. {stats['total_commands']} comandos ejecutados. Docker y Git disponibles."
    response = await think(question, context)
    if response:
        await update.message.reply_text(response)
    else:
        await update.message.reply_text("No pude pensar. Intenta de nuevo.")


async def handle_message(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    """Mensajes libres — Hermes piensa y responde."""
    text = update.message.text
    # Si parece un comando, ejecutar directo
    if text.startswith("$ ") or text.startswith("sudo "):
        command = text.lstrip("$ ")
        result = execute(command)
        user = update.effective_user.first_name
        atlas.log_cmd(user, command, result["output"], result["ok"])
        icon = "✅" if result["ok"] else "❌"
        await update.message.reply_text(f"{icon} `{command}`\n\n{result['output']}")
        return

    # Sino, pensar con IA
    response = await think(text)
    if response:
        await update.message.reply_text(response)
    else:
        await update.message.reply_text("Usa /cmd [comando] o /ask [pregunta]")



# ===== MAIN =====

def main():
    print("=" * 50)
    print("  📢 HERMES ULTIMATE — Control Total")
    print("  🧠 Cerebro IA: DeepSeek V4 Flash (gratis)")
    print("  💾 Memoria: Atlas persistente")
    print("  🔧 Shell: timeout 60s, bloqueados peligrosos")
    print("=" * 50)

    app = Application.builder().token(TOKEN).build()

    # Comandos
    app.add_handler(CommandHandler("start", cmd_start))
    app.add_handler(CommandHandler("help", cmd_start))
    app.add_handler(CommandHandler("cmd", cmd_cmd))
    app.add_handler(CommandHandler("status", cmd_status))
    app.add_handler(CommandHandler("docker", cmd_docker))
    app.add_handler(CommandHandler("git", cmd_git))
    app.add_handler(CommandHandler("logs", cmd_logs))
    app.add_handler(CommandHandler("install", cmd_install))
    app.add_handler(CommandHandler("pdf", cmd_pdf))
    app.add_handler(CommandHandler("file", cmd_file))
    app.add_handler(CommandHandler("memory", cmd_memory))
    app.add_handler(CommandHandler("history", cmd_history))
    app.add_handler(CommandHandler("ask", cmd_ask))

    # Mensajes libres
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_message))

    print("✅ HERMES ULTIMATE ONLINE")
    app.run_polling(drop_pending_updates=True)


if __name__ == "__main__":
    main()
