# -*- coding: utf-8 -*-
"""
🏛️ C8L AGENT v17.0 — PANTEON MASTER
Configuracion central del sistema multi-agente.
SEGURO: Todas las keys se leen de variables de entorno.
"""

import os

# ---------------------------------------------------------------------------
# Telegram
# ---------------------------------------------------------------------------
TELEGRAM_BOT_TOKEN: str = os.environ.get("TELEGRAM_BOT_TOKEN", "")
ADMIN_CHAT_ID: str = os.environ.get("ADMIN_CHAT_ID", "")
BOT_NAME: str = os.environ.get("BOT_NAME", "leon_leo_bot")

# ---------------------------------------------------------------------------
# Grupo Telegram — Corazones Locos (C8L Community)
# ---------------------------------------------------------------------------
GROUP_CHAT_ID: str = os.environ.get("GROUP_CHAT_ID", "")

# ---------------------------------------------------------------------------
# Google AI Studio — Gemini 2.5 Flash Image
# ---------------------------------------------------------------------------
GEMINI_API_KEY: str = os.environ.get("GEMINI_API_KEY", "")
GEMINI_ENABLED: bool = os.environ.get("GEMINI_ENABLED", "false").lower() == "true"
GEMINI_IMAGE_MODEL: str = "gemini-2.5-flash-image"
GEMINI_IMAGE_URL: str = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_IMAGE_MODEL}:generateContent"

# ---------------------------------------------------------------------------
# GROQ — Motor principal del Panteon (GRATIS, ultra rapido)
# Endpoint: https://api.groq.com/openai/v1/chat/completions
# Modelos: llama-3.3-70b-versatile, mixtral-8x7b-32768, gemma2-9b-it
# ---------------------------------------------------------------------------
GROQ_API_KEY: str = os.environ.get("GROQ_API_KEY", "")
GROQ_BASE_URL: str = "https://api.groq.com/openai/v1"

# ---------------------------------------------------------------------------
# OpenRouter — BACKUP
# ---------------------------------------------------------------------------
OPENROUTER_API_KEY: str = os.environ.get("OPENROUTER_API_KEY", "")
OPENROUTER_BASE_URL: str = "https://openrouter.ai/api/v1"

# ---------------------------------------------------------------------------
# Modelos asignados a cada agente del Panteon
# ---------------------------------------------------------------------------
MODELS = {
    # Bot Maestro
    "zeus": "llama-3.3-70b-versatile",
    # Skills Maestros
    "minerva": "llama-3.3-70b-versatile",
    "vulcano": "llama-3.3-70b-versatile",
    # Bots Esclavos
    "aries": "gemma2-9b-it",
    "hermes": "llama-3.3-70b-versatile",
    "apolo": "llama-3.3-70b-versatile",
    "ares": "llama-3.3-70b-versatile",
    "hefesto": "llama-3.3-70b-versatile",
    "artemisa": "llama-3.3-70b-versatile",
    "atenea": "llama-3.3-70b-versatile",
    "estia": "gemma2-9b-it",
    # Fallback
    "fallback": "mixtral-8x7b-32768",
}

# ---------------------------------------------------------------------------
# Mixture of Agents — Sistema multi-modelo para tareas complejas
# ---------------------------------------------------------------------------
MIXTURE_MODELS = {
    "planner": "deepseek/deepseek-v4-flash:free",
    "verifier": "qwen/qwen3-30b-a3b:free",
    "executor": "deepseek/deepseek-v4-flash:free",
    "validator": "qwen/qwen3-30b-a3b:free",
    "fast": "qwen/qwen3-30b-a3b:free",
}
MIXTURE_ENABLED: bool = os.environ.get("MIXTURE_ENABLED", "true").lower() == "true"

# ---------------------------------------------------------------------------
# NVIDIA API (DeepSeek V4 Pro) — Backup
# ---------------------------------------------------------------------------
NVIDIA_API_KEY: str = os.environ.get("NVIDIA_API_KEY", "")
NVIDIA_BASE_URL: str = "https://integrate.api.nvidia.com/v1"
NVIDIA_MODEL: str = "deepseek-ai/deepseek-v4-pro"

# ---------------------------------------------------------------------------
# HuggingFace (Imagenes SDXL) — GRATIS
# ---------------------------------------------------------------------------
HUGGINGFACE_TOKEN: str = os.environ.get("HUGGINGFACE_TOKEN", "")

# ---------------------------------------------------------------------------
# WhatsApp Cloud API (Meta)
# ---------------------------------------------------------------------------
WHATSAPP_TOKEN: str = os.environ.get("WHATSAPP_TOKEN", "")
WHATSAPP_PHONE_ID: str = os.environ.get("WHATSAPP_PHONE_ID", "")
WHATSAPP_BUSINESS_ID: str = os.environ.get("WHATSAPP_BUSINESS_ID", "")
WHATSAPP_VERIFY_TOKEN: str = os.environ.get("WHATSAPP_VERIFY_TOKEN", "c8l_verify_2024")
WHATSAPP_API_URL: str = f"https://graph.facebook.com/v21.0/{WHATSAPP_PHONE_ID}/messages"

# ---------------------------------------------------------------------------
# Suno AI — Generacion de Musica
# Cookie se configura via variable de entorno SUNO_COOKIE
# Se renueva cada ~7 dias. Si da 401, sacar nueva cookie de suno.com
# ---------------------------------------------------------------------------
SUNO_COOKIE: str = os.environ.get("SUNO_COOKIE", "")

# ---------------------------------------------------------------------------
# MusicAPI.ai — Generacion de musica con vocales (API key)
# ---------------------------------------------------------------------------
MUSICAPI_KEY: str = os.environ.get("MUSICAPI_KEY", "")

# ---------------------------------------------------------------------------
# Server
# ---------------------------------------------------------------------------
PORT: int = int(os.environ.get("PORT", "8080"))

# ---------------------------------------------------------------------------
# Pollinations API — Video + Imagen
# ---------------------------------------------------------------------------
POLLINATIONS_API_KEY_P: str = os.environ.get("POLLINATIONS_API_KEY", "")
POLLINATIONS_BASE_URL: str = "https://gen.pollinations.ai"
POLLINATIONS_VIDEO_URL: str = f"{POLLINATIONS_BASE_URL}/video"
POLLINATIONS_IMAGE_URL: str = f"{POLLINATIONS_BASE_URL}/image"
POLLINATIONS_EDIT_URL: str = f"{POLLINATIONS_BASE_URL}/v1/images/edits"

# ---------------------------------------------------------------------------
# Design Studio — APIs gratuitas de edicion de imagen
# ---------------------------------------------------------------------------
PHOTOROOM_API_KEY: str = os.environ.get("PHOTOROOM_API_KEY", "")
PHOTOROOM_API_URL: str = "https://image-api.photoroom.com/v2/edit"

REMOVEBG_API_KEY: str = os.environ.get("REMOVEBG_API_KEY", "")
REMOVEBG_API_URL: str = "https://api.remove.bg/v1.0/removebg"

IMAGE_UPSCALE_URL: str = "https://image-upscaling.net"

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
import os as _os
BASE_DIR = _os.path.dirname(_os.path.abspath(__file__))
DATA_DIR = _os.path.join(BASE_DIR, "data")
MEMORY_DIR = _os.path.join(DATA_DIR, "memory")
PAGES_DIR = _os.path.join(DATA_DIR, "pages")
REPORTS_DIR = _os.path.join(DATA_DIR, "reports")

_os.makedirs(MEMORY_DIR, exist_ok=True)
_os.makedirs(REPORTS_DIR, exist_ok=True)

# ---------------------------------------------------------------------------
# Bot Config
# ---------------------------------------------------------------------------
MAX_HISTORY_PER_USER: int = 50
C8L_WEB_URL: str = os.environ.get("C8L_WEB_URL", "https://c8l-agency.vercel.app")

# ---------------------------------------------------------------------------
# Hermes Bot (backup/obrero)
# ---------------------------------------------------------------------------
HERMES_BOT_TOKEN: str = os.environ.get("HERMES_BOT_TOKEN", "")
HERMES_BOT_NAME: str = "hermes_c8l_bot"
HERMES_PORT: int = int(os.environ.get("HERMES_PORT", "8081"))
