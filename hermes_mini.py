#!/usr/bin/env python3
"""HERMES VPS MINI - Control remoto via Telegram"""
import subprocess
import logging
from telegram import Update
from telegram.ext import Application, CommandHandler, MessageHandler, filters, ContextTypes

TOKEN = "8863835955:AAEYZ8HegFWPxND_RqKDM4a7Iy6_qRcZssI"
logging.basicConfig(level=logging.INFO)


async def cmd_start(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text(
        "HERMES VPS ONLINE\n\n"
        "/cmd [comando] - ejecutar\n"
        "/status - estado servidor\n"
        "/docker [cmd] - docker\n"
        "/git [cmd] - git"
    )


async def cmd_cmd(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    command = update.message.text[5:].strip()
    if not command:
        await update.message.reply_text("Uso: /cmd uptime")
        return
    try:
        r = subprocess.run(command, shell=True, capture_output=True, text=True, timeout=30)
        output = (r.stdout + r.stderr).strip() or "(sin output)"
        if len(output) > 3500:
            output = output[:3500] + "\n...(truncado)"
        icon = "OK" if r.returncode == 0 else "ERROR"
        await update.message.reply_text(f"[{icon}] {command}\n\n{output}")
    except subprocess.TimeoutExpired:
        await update.message.reply_text("Timeout (30s)")
    except Exception as e:
        await update.message.reply_text(f"Error: {e}")


async def cmd_status(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    r = subprocess.run(
        "uptime && echo '---' && free -h | head -3 && echo '---' && df -h / | tail -1",
        shell=True, capture_output=True, text=True, timeout=10
    )
    await update.message.reply_text(f"ESTADO:\n{r.stdout or 'error'}")


async def cmd_docker(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    docker_cmd = update.message.text[8:].strip() or "ps"
    r = subprocess.run(f"docker {docker_cmd}", shell=True, capture_output=True, text=True, timeout=30)
    output = (r.stdout + r.stderr).strip() or "(sin output)"
    if len(output) > 3500:
        output = output[:3500]
    await update.message.reply_text(f"docker {docker_cmd}\n\n{output}")


async def cmd_git(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    git_cmd = update.message.text[5:].strip() or "status"
    r = subprocess.run(f"git {git_cmd}", shell=True, capture_output=True, text=True, timeout=30)
    output = (r.stdout + r.stderr).strip() or "(sin output)"
    if len(output) > 3500:
        output = output[:3500]
    await update.message.reply_text(f"git {git_cmd}\n\n{output}")


async def msg(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text("Usa /cmd [comando] o /status")


print("HERMES MINI ONLINE")
app = Application.builder().token(TOKEN).build()
app.add_handler(CommandHandler("start", cmd_start))
app.add_handler(CommandHandler("cmd", cmd_cmd))
app.add_handler(CommandHandler("status", cmd_status))
app.add_handler(CommandHandler("docker", cmd_docker))
app.add_handler(CommandHandler("git", cmd_git))
app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, msg))
app.run_polling(drop_pending_updates=True)
