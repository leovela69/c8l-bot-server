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
OLLAMA_URL = os.environ.get("OLLAMA_URL", "http://localhost:11434")
OLLAMA_MODEL = os.environ.get("OLLAMA_MODEL", "llama3.2")
USE_OLLAMA = os.environ.get("USE_OLLAMA", "true").lower() == "true"
MEMORY_FILE = os.path.expanduser("~/hermes_memory.json")
LOG_FILE = os.path.expanduser("~/hermes_commands.log")
CMD_TIMEOUT = 60
MAX_OUTPUT = 3500
WORKSPACE = os.environ.get("HERMES_WORKSPACE", os.path.expanduser("~"))

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



# ===== CEREBRO IA (Ollama local + OpenRouter fallback) =====

import httpx

async def think(prompt: str, context: str = "") -> str:
    """Hermes piensa usando Ollama (local) o OpenRouter (remoto)."""
    
    system_msg = (
        "Eres HERMES, un asistente que controla la PC de Leo. "
        "Respondes en español, breve y técnico. "
        "Puedes ejecutar comandos shell y editar archivos. "
        "Si te piden modificar código, genera el contenido exacto. "
        "Si necesitas un comando, sugiere el comando exacto. "
        "Siempre explica qué vas a hacer antes de hacerlo."
    )
    
    full_prompt = f"{context}\n\n{prompt}" if context else prompt
    
    # Intentar Ollama local primero
    if USE_OLLAMA:
        result = await _think_ollama(full_prompt, system_msg)
        if result:
            return result
    
    # Fallback: OpenRouter
    if OPENROUTER_KEY:
        result = await _think_openrouter(full_prompt, system_msg)
        if result:
            return result
    
    return None


async def _think_ollama(prompt: str, system: str) -> str:
    """Llama a Ollama local."""
    try:
        async with httpx.AsyncClient(timeout=120) as client:
            r = await client.post(
                f"{OLLAMA_URL}/api/chat",
                json={
                    "model": OLLAMA_MODEL,
                    "messages": [
                        {"role": "system", "content": system},
                        {"role": "user", "content": prompt}
                    ],
                    "stream": False
                }
            )
            if r.status_code == 200:
                data = r.json()
                return data.get("message", {}).get("content", "")
    except Exception as e:
        logger.warning(f"Ollama error (fallback a OpenRouter): {e}")
    return None


async def _think_openrouter(prompt: str, system: str) -> str:
    """Fallback a OpenRouter."""
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
                        {"role": "system", "content": system},
                        {"role": "user", "content": prompt}
                    ],
                    "temperature": 0.7,
                    "max_tokens": 2000
                }
            )
            if r.status_code == 200:
                data = r.json()
                return data["choices"][0]["message"]["content"]
    except Exception as e:
        logger.error(f"OpenRouter error: {e}")
    return None


# ===== EDITOR DE ARCHIVOS =====

def read_file_content(filepath: str) -> dict:
    """Lee un archivo del PC."""
    path = os.path.expanduser(filepath)
    if not os.path.exists(path):
        return {"ok": False, "output": f"No existe: {filepath}"}
    try:
        with open(path, "r", encoding="utf-8") as f:
            content = f.read()
        if len(content) > 10000:
            content = content[:10000] + "\n...(truncado a 10KB)"
        return {"ok": True, "output": content}
    except Exception as e:
        return {"ok": False, "output": f"Error leyendo: {e}"}


def write_file_content(filepath: str, content: str) -> dict:
    """Escribe/sobrescribe un archivo en el PC."""
    path = os.path.expanduser(filepath)
    try:
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, "w", encoding="utf-8") as f:
            f.write(content)
        return {"ok": True, "output": f"Archivo guardado: {path} ({len(content)} chars)"}
    except Exception as e:
        return {"ok": False, "output": f"Error escribiendo: {e}"}


def edit_file_lines(filepath: str, start_line: int, end_line: int, new_content: str) -> dict:
    """Edita líneas específicas de un archivo."""
    path = os.path.expanduser(filepath)
    if not os.path.exists(path):
        return {"ok": False, "output": f"No existe: {filepath}"}
    try:
        with open(path, "r", encoding="utf-8") as f:
            lines = f.readlines()
        
        # Reemplazar líneas
        new_lines = new_content.split("\n")
        lines[start_line-1:end_line] = [l + "\n" for l in new_lines]
        
        with open(path, "w", encoding="utf-8") as f:
            f.writelines(lines)
        
        return {"ok": True, "output": f"Editado {filepath}: líneas {start_line}-{end_line} reemplazadas"}
    except Exception as e:
        return {"ok": False, "output": f"Error editando: {e}"}


def list_files(directory: str = ".", pattern: str = "*") -> dict:
    """Lista archivos de un directorio."""
    import glob
    path = os.path.expanduser(directory)
    try:
        if pattern == "*":
            items = os.listdir(path)
            items.sort()
            output = "\n".join(items[:50])
        else:
            matches = glob.glob(os.path.join(path, pattern))
            output = "\n".join([os.path.basename(m) for m in matches[:50]])
        return {"ok": True, "output": output or "(vacío)"}
    except Exception as e:
        return {"ok": False, "output": f"Error: {e}"}



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
    """Mensajes libres — Hermes piensa y actúa."""
    text = update.message.text
    user = update.effective_user.first_name
    
    # Si parece un comando directo, ejecutar
    if text.startswith("$ ") or text.startswith("sudo "):
        command = text.lstrip("$ ")
        result = execute(command)
        atlas.log_cmd(user, command, result["output"], result["ok"])
        icon = "✅" if result["ok"] else "❌"
        await update.message.reply_text(f"{icon} `{command}`\n\n{result['output']}", parse_mode="Markdown")
        return

    # Detectar intención de editar archivos
    text_lower = text.lower()
    
    # Leer archivo
    if any(x in text_lower for x in ["lee el archivo", "muestra el archivo", "abre el archivo", "cat ", "ver archivo"]):
        # Extraer path
        filepath = _extract_filepath(text)
        if filepath:
            result = read_file_content(filepath)
            icon = "📄" if result["ok"] else "❌"
            await update.message.reply_text(f"{icon} {filepath}\n\n```\n{result['output'][:3500]}\n```", parse_mode="Markdown")
            return

    # Listar archivos
    if any(x in text_lower for x in ["lista archivos", "ls ", "dir ", "que archivos hay"]):
        directory = _extract_filepath(text) or WORKSPACE
        result = list_files(directory)
        await update.message.reply_text(f"📁 {directory}\n\n{result['output']}")
        return

    # Para todo lo demás: pensar con Ollama/OpenRouter
    # Incluir info del workspace actual
    context = f"Workspace: {WORKSPACE}\nOS: {os.name}\nUser: {user}"
    response = await think(text, context)
    
    if response:
        # Si la IA sugiere un comando, preguntar si ejecutar
        if "```" in response and any(x in response.lower() for x in ["ejecuta", "corre", "run", "comando"]):
            await update.message.reply_text(response + "\n\n_Envía el comando con $ para ejecutarlo_", parse_mode="Markdown")
        else:
            await update.message.reply_text(response)
    else:
        await update.message.reply_text("⚠️ No pude procesar. Usa /cmd [comando] o /ask [pregunta]")


async def handle_voice(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    """Notas de voz — transcribe con Whisper y ejecuta."""
    import requests as req
    from config import GROQ_API_KEY
    
    voice = update.message.voice or update.message.audio
    if not voice:
        return
    
    user = update.effective_user.first_name
    logger.info(f"[VOZ] [{user}]: audio recibido")
    
    try:
        # Descargar audio
        file = await ctx.bot.get_file(voice.file_id)
        audio_bytes = await file.download_as_bytearray()
        
        # Transcribir con Groq Whisper
        if not GROQ_API_KEY:
            # Fallback: usar Ollama si no hay Groq
            await update.message.reply_text("⚠️ Sin GROQ_API_KEY para Whisper. Escribe en texto.")
            return
        
        import tempfile
        with tempfile.NamedTemporaryFile(suffix=".ogg", delete=False) as tmp:
            tmp.write(bytes(audio_bytes))
            tmp_path = tmp.name
        
        headers = {"Authorization": f"Bearer {GROQ_API_KEY}"}
        with open(tmp_path, "rb") as audio_file:
            files = {"file": ("voice.ogg", audio_file)}
            data = {"model": "whisper-large-v3-turbo", "language": "es", "response_format": "text"}
            r = req.post("https://api.groq.com/openai/v1/audio/transcriptions",
                        headers=headers, files=files, data=data, timeout=30)
        
        os.unlink(tmp_path)
        
        if r.status_code != 200:
            await update.message.reply_text("❌ Error transcribiendo audio.")
            return
        
        text = r.text.strip()
        if not text:
            await update.message.reply_text("❌ No entendí el audio.")
            return
        
        # Mostrar qué entendió
        await update.message.reply_text(f"🎤 _{text}_", parse_mode="Markdown")
        
        # Procesar como mensaje normal
        update.message.text = text
        await handle_message(update, ctx)
        
    except Exception as e:
        logger.error(f"Voice error: {e}")
        await update.message.reply_text(f"❌ Error: {e}")


# === Comandos de edición de archivos ===

async def cmd_read(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    """Lee un archivo. Uso: /read config.py"""
    filepath = update.message.text[6:].strip()
    if not filepath:
        await update.message.reply_text("Uso: /read config.py")
        return
    result = read_file_content(filepath)
    icon = "📄" if result["ok"] else "❌"
    output = result["output"][:3500]
    await update.message.reply_text(f"{icon} `{filepath}`\n\n```\n{output}\n```", parse_mode="Markdown")


async def cmd_write(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    """Escribe un archivo. Uso: /write path.py\ncontenido..."""
    parts = update.message.text[7:].strip().split("\n", 1)
    if len(parts) < 2:
        await update.message.reply_text("Uso:\n/write archivo.py\ncontenido aquí...")
        return
    filepath = parts[0].strip()
    content = parts[1]
    result = write_file_content(filepath, content)
    icon = "✅" if result["ok"] else "❌"
    await update.message.reply_text(f"{icon} {result['output']}")


async def cmd_edit(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    """Edita con IA. Uso: /edit config.py cambia el puerto a 9090"""
    args = update.message.text[6:].strip()
    if not args:
        await update.message.reply_text("Uso: /edit archivo.py [instrucción de qué cambiar]")
        return
    
    parts = args.split(" ", 1)
    filepath = parts[0]
    instruction = parts[1] if len(parts) > 1 else "mejora este archivo"
    
    # Leer archivo actual
    file_content = read_file_content(filepath)
    if not file_content["ok"]:
        await update.message.reply_text(f"❌ {file_content['output']}")
        return
    
    await update.message.reply_text(f"🧠 Analizando `{filepath}` con IA...", parse_mode="Markdown")
    
    # Pedir a la IA que edite
    prompt = (
        f"Necesito que edites este archivo: {filepath}\n"
        f"Instrucción: {instruction}\n\n"
        f"Contenido actual:\n```\n{file_content['output'][:8000]}\n```\n\n"
        f"Responde SOLO con el contenido nuevo del archivo completo, sin explicaciones. "
        f"Sin bloques de código markdown, solo el contenido puro."
    )
    
    new_content = await think(prompt)
    
    if not new_content:
        await update.message.reply_text("❌ La IA no pudo generar el cambio.")
        return
    
    # Limpiar respuesta (quitar ``` si la IA los pone)
    new_content = new_content.strip()
    if new_content.startswith("```"):
        lines = new_content.split("\n")
        # Quitar primera y última línea si son ```
        if lines[0].startswith("```"):
            lines = lines[1:]
        if lines and lines[-1].strip() == "```":
            lines = lines[:-1]
        new_content = "\n".join(lines)
    
    # Guardar
    result = write_file_content(filepath, new_content)
    if result["ok"]:
        await update.message.reply_text(
            f"✅ Archivo editado: `{filepath}`\n"
            f"📝 {len(new_content)} caracteres escritos\n"
            f"💡 Instrucción: _{instruction}_",
            parse_mode="Markdown"
        )
    else:
        await update.message.reply_text(f"❌ {result['output']}")


async def cmd_ls(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    """Lista archivos. Uso: /ls [directorio]"""
    directory = update.message.text[4:].strip() or WORKSPACE
    result = list_files(directory)
    await update.message.reply_text(f"📁 `{directory}`\n\n{result['output']}", parse_mode="Markdown")


def _extract_filepath(text: str) -> str:
    """Intenta extraer un path de archivo del texto."""
    import re
    # Buscar paths con extensión
    match = re.search(r'[/\\~]?[\w./\\-]+\.\w+', text)
    if match:
        return match.group(0)
    # Buscar paths con /
    match = re.search(r'[/\\~][\w./\\-]+', text)
    if match:
        return match.group(0)
    return ""



# ===== MAIN =====

def main():
    print("=" * 50)
    print("  📢 HERMES ULTIMATE — Control Total")
    print("  🧠 Cerebro IA: Ollama local + OpenRouter backup")
    print(f"  🦙 Ollama: {OLLAMA_URL} ({OLLAMA_MODEL})")
    print("  💾 Memoria: Atlas persistente")
    print("  🔧 Shell: timeout 60s, bloqueados peligrosos")
    print("  ✏️ Editor: lee/escribe/edita archivos con IA")
    print("  🎤 Voz: Whisper → acción")
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
    app.add_handler(CommandHandler("read", cmd_read))
    app.add_handler(CommandHandler("write", cmd_write))
    app.add_handler(CommandHandler("edit", cmd_edit))
    app.add_handler(CommandHandler("ls", cmd_ls))

    # Voz
    app.add_handler(MessageHandler(filters.VOICE | filters.AUDIO, handle_voice))

    # Mensajes libres
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_message))

    print("✅ HERMES ULTIMATE ONLINE")
    app.run_polling(drop_pending_updates=True)


if __name__ == "__main__":
    main()
