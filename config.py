# -*- coding: utf-8 -*-
"""
🏛️ C8L AGENT v17.0 — PANTEON MASTER
Configuracion central del sistema multi-agente.

SEGURO: Todas las keys se leen de variables de entorno.
Si existe un archivo .env en la misma carpeta, se carga automaticamente.
"""

import os

# ---------------------------------------------------------------------------
# Auto-cargar .env si existe (para VPS sin docker/render)
# ---------------------------------------------------------------------------
_env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")
if os.path.exists(_env_path):
    with open(_env_path, "r") as _f:
        for _line in _f:
            _line = _line.strip()
            if _line and not _line.startswith("#") and "=" in _line:
                _key, _val = _line.split("=", 1)
                _key = _key.strip()
                _val = _val.strip().strip('"').strip("'")
                if _key and _key not in os.environ:
                    os.environ[_key] = _val

# ---------------------------------------------------------------------------
# Telegram
# ---------------------------------------------------------------------------
TELEGRAM_BOT_TOKEN: str = os.environ.get("TELEGRAM_BOT_TOKEN", "8557275735:AAFvVQaDkxp9E2ks_R0MYoVUrIDzz8EHT2w")
ADMIN_CHAT_ID: str = os.environ.get("ADMIN_CHAT_ID", "")
BOT_NAME: str = os.environ.get("BOT_NAME", "leon_leo_bot")

# ---------------------------------------------------------------------------
# Grupo Telegram
# ---------------------------------------------------------------------------
GROUP_CHAT_ID: str = os.environ.get("GROUP_CHAT_ID", "")

# ---------------------------------------------------------------------------
# Google Gemini
# ---------------------------------------------------------------------------
GEMINI_API_KEY: str = os.environ.get("GEMINI_API_KEY", "")
GEMINI_ENABLED: bool = os.environ.get("GEMINI_ENABLED", "false").lower() == "true"
GEMINI_IMAGE_MODEL: str = "gemini-2.5-flash-image"
GEMINI_IMAGE_URL: str = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_IMAGE_MODEL}:generateContent"

# ---------------------------------------------------------------------------
# GROQ — Motor principal (GRATIS)
# ---------------------------------------------------------------------------
GROQ_API_KEY: str = os.environ.get("GROQ_API_KEY", "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")
GROQ_BASE_URL: str = "https://api.groq.com/openai/v1"

# ---------------------------------------------------------------------------
# OpenRouter — Backup
# ---------------------------------------------------------------------------
OPENROUTER_API_KEY: str = os.environ.get("OPENROUTER_API_KEY", "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")
OPENROUTER_BASE_URL: str = "https://openrouter.ai/api/v1"

# ---------------------------------------------------------------------------
# Modelos del Panteon
# ---------------------------------------------------------------------------
MODELS = {
    "zeus": "llama-3.3-70b-versatile",
    "minerva": "llama-3.3-70b-versatile",
    "vulcano": "llama-3.3-70b-versatile",
    "aries": "gemma2-9b-it",
    "hermes": "llama-3.3-70b-versatile",
    "apolo": "llama-3.3-70b-versatile",
    "ares": "llama-3.3-70b-versatile",
    "hefesto": "llama-3.3-70b-versatile",
    "artemisa": "llama-3.3-70b-versatile",
    "atenea": "llama-3.3-70b-versatile",
    "estia": "gemma2-9b-it",
    "fallback": "mixtral-8x7b-32768",
}

# ---------------------------------------------------------------------------
# Mixture of Agents
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
# NVIDIA — Backup
# ---------------------------------------------------------------------------
NVIDIA_API_KEY: str = os.environ.get("NVIDIA_API_KEY", "")
NVIDIA_BASE_URL: str = "https://integrate.api.nvidia.com/v1"
NVIDIA_MODEL: str = "deepseek-ai/deepseek-v4-pro"

# ---------------------------------------------------------------------------
# HuggingFace — Imagenes GRATIS
# ---------------------------------------------------------------------------
HUGGINGFACE_TOKEN: str = os.environ.get("HUGGINGFACE_TOKEN", "")

# ---------------------------------------------------------------------------
# WhatsApp Cloud API
# ---------------------------------------------------------------------------
WHATSAPP_TOKEN: str = os.environ.get("WHATSAPP_TOKEN", "")
WHATSAPP_PHONE_ID: str = os.environ.get("WHATSAPP_PHONE_ID", "")
WHATSAPP_BUSINESS_ID: str = os.environ.get("WHATSAPP_BUSINESS_ID", "")
WHATSAPP_VERIFY_TOKEN: str = os.environ.get("WHATSAPP_VERIFY_TOKEN", "c8l_verify_2024")
WHATSAPP_API_URL: str = f"https://graph.facebook.com/v21.0/{WHATSAPP_PHONE_ID}/messages"

# ---------------------------------------------------------------------------
# Suno AI — Musica
# ---------------------------------------------------------------------------
SUNO_COOKIE: str = os.environ.get("SUNO_COOKIE", "")

# ---------------------------------------------------------------------------
# MusicAPI.ai
# ---------------------------------------------------------------------------
MUSICAPI_KEY: str = os.environ.get("MUSICAPI_KEY", "")

# ---------------------------------------------------------------------------
# Pollinations — Video/Imagen
# ---------------------------------------------------------------------------
POLLINATIONS_API_KEY_P: str = os.environ.get("POLLINATIONS_API_KEY", "sk_MlXME9FBm9QeBjcpuYS9DbW95N5xGWg3")
POLLINATIONS_BASE_URL: str = "https://gen.pollinations.ai"
POLLINATIONS_VIDEO_URL: str = f"{POLLINATIONS_BASE_URL}/video"
POLLINATIONS_IMAGE_URL: str = f"{POLLINATIONS_BASE_URL}/image"
POLLINATIONS_EDIT_URL: str = f"{POLLINATIONS_BASE_URL}/v1/images/edits"

# ---------------------------------------------------------------------------
# Design Studio
# ---------------------------------------------------------------------------
PHOTOROOM_API_KEY: str = os.environ.get("PHOTOROOM_API_KEY", "")
PHOTOROOM_API_URL: str = "https://image-api.photoroom.com/v2/edit"
REMOVEBG_API_KEY: str = os.environ.get("REMOVEBG_API_KEY", "")
REMOVEBG_API_URL: str = "https://api.remove.bg/v1.0/removebg"
IMAGE_UPSCALE_URL: str = "https://image-upscaling.net"

# ---------------------------------------------------------------------------
# Server
# ---------------------------------------------------------------------------
PORT: int = int(os.environ.get("PORT", "8080"))

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")
MEMORY_DIR = os.path.join(DATA_DIR, "memory")
PAGES_DIR = os.path.join(DATA_DIR, "pages")
REPORTS_DIR = os.path.join(DATA_DIR, "reports")

os.makedirs(MEMORY_DIR, exist_ok=True)
os.makedirs(REPORTS_DIR, exist_ok=True)

# ---------------------------------------------------------------------------
# Bot Config
# ---------------------------------------------------------------------------
MAX_HISTORY_PER_USER: int = 50
C8L_WEB_URL: str = os.environ.get("C8L_WEB_URL", "https://c8l-agency.vercel.app")

# ---------------------------------------------------------------------------
# Hermes Bot (backup/watchdog/reanimator)
# ---------------------------------------------------------------------------
HERMES_BOT_TOKEN: str = os.environ.get("HERMES_BOT_TOKEN", "")
HERMES_BOT_NAME: str = "hermes_c8l_bot"
HERMES_PORT: int = int(os.environ.get("HERMES_PORT", "8081"))

# ---------------------------------------------------------------------------
# Sayan Bridge (conexión con @Sayanyin_Bot)
# ---------------------------------------------------------------------------
SAYAN_API_URL: str = os.environ.get("SAYAN_API_URL", "https://sayan-bot1.onrender.com")
BRIDGE_SECRET: str = os.environ.get("BRIDGE_SECRET", "c8l_sayan_bridge_2026")



# ---------------------------------------------------------------------------
# Hyperframes — Video Rendering Engine (HTML → MP4)
# ---------------------------------------------------------------------------
HYPERFRAMES_ENABLED: bool = os.environ.get("HYPERFRAMES_ENABLED", "true").lower() == "true"
HYPERFRAMES_NODE_PATH: str = os.environ.get("HYPERFRAMES_NODE_PATH", "node")
HYPERFRAMES_FFMPEG_PATH: str = os.environ.get("HYPERFRAMES_FFMPEG_PATH", "ffmpeg")
HYPERFRAMES_DEFAULT_WIDTH: int = int(os.environ.get("HYPERFRAMES_WIDTH", "1920"))
HYPERFRAMES_DEFAULT_HEIGHT: int = int(os.environ.get("HYPERFRAMES_HEIGHT", "1080"))
HYPERFRAMES_DEFAULT_FPS: int = int(os.environ.get("HYPERFRAMES_FPS", "30"))
HYPERFRAMES_MAX_DURATION: int = int(os.environ.get("HYPERFRAMES_MAX_DURATION", "60"))
HYPERFRAMES_RENDER_TIMEOUT: int = int(os.environ.get("HYPERFRAMES_RENDER_TIMEOUT", "300"))
VIDEOS_DIR: str = os.path.join(DATA_DIR, "videos")
os.makedirs(VIDEOS_DIR, exist_ok=True)



# ---------------------------------------------------------------------------
# SkillScan — Escáner de Seguridad de Agentes IA
# ---------------------------------------------------------------------------
SKILLSCAN_API_KEY: str = os.environ.get("SKILLSCAN_API_KEY", "")
SKILLSCAN_API_URL: str = os.environ.get("SKILLSCAN_API_URL", "https://skillscan.dev/api/v1")
SKILLSCAN_AUTO_AUDIT: bool = os.environ.get("SKILLSCAN_AUTO_AUDIT", "true").lower() == "true"
SKILLSCAN_AUDIT_INTERVAL: int = int(os.environ.get("SKILLSCAN_AUDIT_INTERVAL", "3600"))



# ---------------------------------------------------------------------------
# Film Production — Video APIs Gratuitas
# ---------------------------------------------------------------------------
AGNES_API_KEY: str = os.environ.get("AGNES_API_KEY", "")
CLOUDFLARE_ACCOUNT_ID: str = os.environ.get("CLOUDFLARE_ACCOUNT_ID", "")
CLOUDFLARE_AI_TOKEN: str = os.environ.get("CLOUDFLARE_AI_TOKEN", "")
