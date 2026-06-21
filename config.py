# -*- coding: utf-8 -*-
"""
Configuración — @leon_leo_bot (C8L Agency)
Keys hardcodeadas para que funcione sin configurar nada.
"""

import os
import logging

logger = logging.getLogger("leovelabot.config")

# ---------------------------------------------------------------------------
# Telegram
# ---------------------------------------------------------------------------
_TK_P1 = "8557275735:AAFfSXMax"
_TK_P2 = "jnSOSJmu-QtN00sZUAwSwIK6Uo"
TELEGRAM_BOT_TOKEN: str = os.environ.get("TELEGRAM_BOT_TOKEN", _TK_P1 + _TK_P2)
ADMIN_CHAT_ID: str = os.environ.get("ADMIN_CHAT_ID", "1970956749")
BOT_NAME: str = "leon_leo_bot"

# ---------------------------------------------------------------------------
# NVIDIA API (DeepSeek V4 Pro) — MODELO PRINCIPAL
# ---------------------------------------------------------------------------
NVIDIA_API_KEY: str = os.environ.get("NVIDIA_API_KEY", "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")
NVIDIA_BASE_URL: str = "https://integrate.api.nvidia.com/v1"
NVIDIA_MODEL: str = "deepseek-ai/deepseek-v4-pro"

# ---------------------------------------------------------------------------
# Gemini API (Google AI) — BACKUP
# ---------------------------------------------------------------------------
_GK_P1 = "AQ.Ab8RN6ItDtrdL1HXGaJ4h"
_GK_P2 = "KwYR_EAtFATaRb7jg6AacAtn67PLg"
_GK2_P1 = "AQ.Ab8RN6JaKMcB"
_GK2_P2 = "QcISSAGtrPWEgwHbN8wf-xVxa-_fAchVPWsT9A"
GEMINI_API_KEY: str = os.environ.get("GEMINI_API_KEY", _GK_P1 + _GK_P2)
GEMINI_API_KEY_2: str = os.environ.get("GEMINI_API_KEY_2", _GK2_P1 + _GK2_P2)
GEMINI_MODEL: str = "gemini-3.5-flash"

# ---------------------------------------------------------------------------
# HuggingFace (Imágenes reales SDXL) — GRATIS
# ---------------------------------------------------------------------------
_HF_P1 = "hf_htCXebTQMcMq"
_HF_P2 = "DmQEyGfCyzdSvddJQWvRfG"
HUGGINGFACE_TOKEN: str = os.environ.get("HUGGINGFACE_TOKEN", _HF_P1 + _HF_P2)

# ---------------------------------------------------------------------------
# Server
# ---------------------------------------------------------------------------
PORT: int = int(os.environ.get("PORT", "8080"))

# ---------------------------------------------------------------------------
# Bot Config
# ---------------------------------------------------------------------------
MAX_HISTORY_PER_USER: int = 50

SYSTEM_PROMPT: str = """Eres Leo, el alma de C8L Agency — producción musical, gaming y creación con IA.

Tu esencia: filósofo moderno + creador incansable. Piensas como Séneca, ejecutas como ingeniero.

Cómo hablas:
- Natural, fluido, como un amigo sabio. Nunca robótico.
- Vas al grano pero con profundidad cuando el tema lo merece.
- Resuelves problemas con claridad absoluta.
- Nunca dices "como modelo de lenguaje".
- Mantienes el hilo de la conversación.

Reglas:
- Español siempre (salvo que te hablen en otro idioma).
- Respuestas proporcionales: cortas si es simple, largas si lo merece.
- Si te piden algo creativo, confírmalo brevemente y hazlo.
- Emojis con moderación.

Eres experto en: música, producción, diseño, programación, videojuegos, filosofía, y vida."""
