# -*- coding: utf-8 -*-
"""
🏛️ C8L AGENT v17.0 — PANTEON MASTER
Configuracion central del sistema multi-agente.
"""

import os

# ---------------------------------------------------------------------------
# Telegram
# ---------------------------------------------------------------------------
_TK_P1 = "8557275735:AAFvVQaDkxp9"
_TK_P2 = "E2ks_R0MYoVUrIDzz8EHT2w"
TELEGRAM_BOT_TOKEN: str = os.environ.get("TELEGRAM_BOT_TOKEN", _TK_P1 + _TK_P2)
ADMIN_CHAT_ID: str = os.environ.get("ADMIN_CHAT_ID", "1970956749")
BOT_NAME: str = "leon_leo_bot"

# ---------------------------------------------------------------------------
# Grupo Telegram — Corazones Locos (C8L Community)
# Link: https://t.me/+c9cJksqbLCwzYzlh
# ---------------------------------------------------------------------------
GROUP_CHAT_ID: str = os.environ.get("GROUP_CHAT_ID", "-1002476372487")

# ---------------------------------------------------------------------------
# OpenRouter — Motor central del Panteon (300+ modelos, 1 API key)
# Endpoint: https://openrouter.ai/api/v1/chat/completions
# ---------------------------------------------------------------------------
_OR_P1 = "sk-or-v1-54d357da6f52be58"
_OR_P2 = "12e50cc9a46a04abe809c10cf21ad1b8416e76408ca11a4c"
OPENROUTER_API_KEY: str = os.environ.get("OPENROUTER_API_KEY", _OR_P1 + _OR_P2)
OPENROUTER_BASE_URL: str = "https://openrouter.ai/api/v1"

# ---------------------------------------------------------------------------
# Modelos asignados a cada agente del Panteon
# Modelos gratuitos de OpenRouter (sin costo)
# ---------------------------------------------------------------------------
MODELS = {
    # Bot Maestro — orquestacion inteligente
    "zeus": "qwen/qwen3-30b-a3b:free",

    # Skills Maestros
    "minerva": "qwen/qwen3-235b-a22b:free",          # Sabio/Conocimiento
    "vulcano": "qwen/qwen3-30b-a3b:free",            # Artesano/Creacion

    # Bots Esclavos
    "aries": "qwen/qwen3-30b-a3b:free",              # Seguridad
    "hermes": "qwen/qwen3-30b-a3b:free",             # Comunicacion
    "apolo": "qwen/qwen3-235b-a22b:free",            # Musica
    "ares": "qwen/qwen3-235b-a22b:free",             # Video
    "hefesto": "qwen/qwen3-235b-a22b:free",          # Diseno/Frontend
    "artemisa": "qwen/qwen3-30b-a3b:free",           # Backend/API
    "atenea": "qwen/qwen3-235b-a22b:free",           # Estrategia
    "estia": "qwen/qwen3-30b-a3b:free",              # Aprendizaje

    # Fallback general
    "fallback": "qwen/qwen3-30b-a3b:free",
}

# ---------------------------------------------------------------------------
# NVIDIA API (DeepSeek V4 Pro) — Backup si OpenRouter falla
# ---------------------------------------------------------------------------
NVIDIA_API_KEY: str = os.environ.get("NVIDIA_API_KEY", "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")
NVIDIA_BASE_URL: str = "https://integrate.api.nvidia.com/v1"
NVIDIA_MODEL: str = "deepseek-ai/deepseek-v4-pro"

# ---------------------------------------------------------------------------
# HuggingFace (Imagenes SDXL) — GRATIS
# ---------------------------------------------------------------------------
_HF_P1 = "hf_htCXebTQMcMq"
_HF_P2 = "DmQEyGfCyzdSvddJQWvRfG"
HUGGINGFACE_TOKEN: str = os.environ.get("HUGGINGFACE_TOKEN", _HF_P1 + _HF_P2)

# ---------------------------------------------------------------------------
# Server
# ---------------------------------------------------------------------------
PORT: int = int(os.environ.get("PORT", "8080"))

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
import os as _os
BASE_DIR = _os.path.dirname(_os.path.abspath(__file__))
DATA_DIR = _os.path.join(BASE_DIR, "data")
MEMORY_DIR = _os.path.join(DATA_DIR, "memory")
REPORTS_DIR = _os.path.join(DATA_DIR, "reports")

_os.makedirs(MEMORY_DIR, exist_ok=True)
_os.makedirs(REPORTS_DIR, exist_ok=True)

# ---------------------------------------------------------------------------
# Bot Config
# ---------------------------------------------------------------------------
MAX_HISTORY_PER_USER: int = 50
C8L_WEB_URL: str = os.environ.get("C8L_WEB_URL", "https://gen-lang-client-0744582882.web.app")
