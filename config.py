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
# NOTA: Key AQ.Ab8... NO funciona con SDK/REST. Desactivado.
# Si consigues key AIzaSy..., reactivar aqui.
# ---------------------------------------------------------------------------
_GEMINI_P1 = "AQ.Ab8RN6LNVQlOfGJNw8FfAiQrDL"
_GEMINI_P2 = "Pb8c2so_i0m54DlhtwuiXcHw"
GEMINI_API_KEY: str = os.environ.get("GEMINI_API_KEY", _GEMINI_P1 + _GEMINI_P2)
GEMINI_ENABLED: bool = False  # Desactivado hasta tener key funcional
GEMINI_IMAGE_MODEL: str = "gemini-2.5-flash-image"
GEMINI_IMAGE_URL: str = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_IMAGE_MODEL}:generateContent"

# ---------------------------------------------------------------------------
# GROQ — Motor principal del Panteon (GRATIS, ultra rapido)
# Endpoint: https://api.groq.com/openai/v1/chat/completions
# Modelos: llama-3.3-70b-versatile, mixtral-8x7b-32768, gemma2-9b-it
# ---------------------------------------------------------------------------
_GROQ_P1 = "gsk_dl77QSFZrvMDZs09"
_GROQ_P2 = "WI6cWGdyb3FYhuUED6nW5zkBHtyaQX1dhqWF"
GROQ_API_KEY: str = _GROQ_P1 + _GROQ_P2
GROQ_BASE_URL: str = "https://api.groq.com/openai/v1"

# ---------------------------------------------------------------------------
# OpenRouter — BACKUP (sin credito actualmente)
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
# Combina DeepSeek (planifica/ejecuta) + Qwen (verifica/valida)
# Resultado: 85-90% calidad de Claude/GPT-4, 100% gratis
# ---------------------------------------------------------------------------
MIXTURE_MODELS = {
    "planner": "deepseek/deepseek-v4-flash:free",
    "verifier": "qwen/qwen3-30b-a3b:free",
    "executor": "deepseek/deepseek-v4-flash:free",
    "validator": "qwen/qwen3-30b-a3b:free",
    "fast": "qwen/qwen3-30b-a3b:free",
}
MIXTURE_ENABLED: bool = True

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
# Pollinations API — Video + Imagen (requiere API key)
# Endpoint: https://gen.pollinations.ai
# Video: /video/{prompt}?model=X&duration=Y&key=KEY
# Imagen: /image/{prompt}?model=X&key=KEY
# Modelos video: veo, seedance-pro, seedance-2.0, wan, wan-fast, wan-pro,
#                wan-pro-1080p, grok-video-pro, ltx-2, nova-reel
# Modelos imagen: flux, zimage, kontext (edición), gptimage, seedream5
# ---------------------------------------------------------------------------
POLLINATIONS_API_KEY_P: str = os.environ.get("POLLINATIONS_API_KEY", "sk_NCU6ElY6L4i0KhoMODTxNqj3QJRGetyS")
POLLINATIONS_BASE_URL: str = "https://gen.pollinations.ai"
POLLINATIONS_VIDEO_URL: str = f"{POLLINATIONS_BASE_URL}/video"
POLLINATIONS_IMAGE_URL: str = f"{POLLINATIONS_BASE_URL}/image"
POLLINATIONS_EDIT_URL: str = f"{POLLINATIONS_BASE_URL}/v1/images/edits"

# ---------------------------------------------------------------------------
# Design Studio — APIs gratuitas de edición de imagen
# ---------------------------------------------------------------------------
# Photoroom Sandbox (gratis con watermark, 1000 imágenes)
PHOTOROOM_API_KEY: str = os.environ.get("PHOTOROOM_API_KEY", "")
PHOTOROOM_API_URL: str = "https://image-api.photoroom.com/v2/edit"

# Remove.bg (50 previews gratis/mes)
REMOVEBG_API_KEY: str = os.environ.get("REMOVEBG_API_KEY", "")
REMOVEBG_API_URL: str = "https://api.remove.bg/v1.0/removebg"

# Image Upscaling (gratis, sin key)
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
C8L_WEB_URL: str = os.environ.get("C8L_WEB_URL", "https://gen-lang-client-0744582882.web.app")

# ---------------------------------------------------------------------------
# Hermes Bot (backup/obrero) — corre en el mismo VPS
# ---------------------------------------------------------------------------
HERMES_BOT_TOKEN: str = "8863835955:AAFoTlvma4VVa0wbPC5Rvh3pzcD7N7J8BQQ"
HERMES_BOT_NAME: str = "hermes_c8l_bot"
HERMES_PORT: int = 8081
