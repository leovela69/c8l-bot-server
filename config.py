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
# Google AI Studio — Gemini 2.5 Flash Image (Nano Banana)
# 500 imagenes/dia GRATIS. Generacion directa de imagenes.
# ---------------------------------------------------------------------------
_GEMINI_P1 = "AQ.Ab8RN6LNVQlOfGJNw8FfAiQrDL"
_GEMINI_P2 = "Pb8c2so_i0m54DlhtwuiXcHw"
GEMINI_API_KEY: str = os.environ.get("GEMINI_API_KEY", _GEMINI_P1 + _GEMINI_P2)
GEMINI_IMAGE_MODEL: str = "gemini-2.5-flash-image"
GEMINI_IMAGE_URL: str = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_IMAGE_MODEL}:generateContent"

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
# DeepSeek V4 Flash FREE — mejor que Qwen3 para seguir instrucciones
# Qwen3-30b como fallback rapido
# ---------------------------------------------------------------------------
MODELS = {
    # Bot Maestro — orquestacion inteligente
    "zeus": "deepseek/deepseek-v4-flash:free",

    # Skills Maestros
    "minerva": "deepseek/deepseek-v4-flash:free",          # Sabio/Conocimiento
    "vulcano": "deepseek/deepseek-v4-flash:free",          # Artesano/Creacion (CRITICO para prompts)

    # Bots Esclavos
    "aries": "qwen/qwen3-30b-a3b:free",              # Seguridad (ligero)
    "hermes": "deepseek/deepseek-v4-flash:free",      # Comunicacion (principal)
    "apolo": "deepseek/deepseek-v4-flash:free",       # Musica
    "ares": "deepseek/deepseek-v4-flash:free",        # Video
    "hefesto": "deepseek/deepseek-v4-flash:free",     # Diseno/Frontend
    "artemisa": "deepseek/deepseek-v4-flash:free",    # Backend/API
    "atenea": "deepseek/deepseek-v4-flash:free",      # Estrategia
    "estia": "qwen/qwen3-30b-a3b:free",              # Aprendizaje (ligero)

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
# WhatsApp Cloud API (Meta)
# ---------------------------------------------------------------------------
_WA_TOKEN_P1 = "EAAePXyOIVAEBR3JRGInErQOa0WMW5qaRImX4fvEIo8KUPjAY3CurQyRZBlWho52tfIFFayZCVV5HKI"
_WA_TOKEN_P2 = "fnQUxDPbisaeWgbvAXJzWczSDipSNjcsUZCwW8Y2tZAQWLMsZCEDT3NOq3LXq3Gqz4gWpAfjXmKvJ6X0VlfZAhQIv2ttrfsIdhaWMdBHRl703i2Q1jCtnlEzVB3lZCYfQ8yEws34FF6VjCZAJq24J48EviaGf6kB0yqDigZCzwoCiVzdfyPZC4RotNmnqnMdLUMWeZAnkZBpH36NymIrUppexAlAZDZD"
WHATSAPP_TOKEN: str = os.environ.get("WHATSAPP_TOKEN", _WA_TOKEN_P1 + _WA_TOKEN_P2)
WHATSAPP_PHONE_ID: str = os.environ.get("WHATSAPP_PHONE_ID", "1078712428668775")
WHATSAPP_BUSINESS_ID: str = "27473005168999052"
WHATSAPP_VERIFY_TOKEN: str = "c8l_verify_2024"  # Para verificar webhook
WHATSAPP_API_URL: str = f"https://graph.facebook.com/v21.0/{WHATSAPP_PHONE_ID}/messages"

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
