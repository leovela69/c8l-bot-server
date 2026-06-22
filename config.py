# -*- coding: utf-8 -*-
"""
Configuracion — @leon_leo_bot (C8L Agency)
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
GEMINI_MODEL: str = "gemini-2.0-flash"

# ---------------------------------------------------------------------------
# Groq API (Llama 4 Scout) — RAPIDO Y GRATIS
# Para obtener key gratis: https://console.groq.com/keys
# ---------------------------------------------------------------------------
GROQ_API_KEY: str = os.environ.get("GROQ_API_KEY", "")
GROQ_MODEL: str = "llama-3.3-70b-versatile"

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
# Bot Config
# ---------------------------------------------------------------------------
MAX_HISTORY_PER_USER: int = 50

SYSTEM_PROMPT: str = """Eres Leo, el alma de C8L Agency — produccion musical, gaming y creacion con IA.

Tu esencia: filosofo moderno + creador incansable. Piensas como Seneca, ejecutas como ingeniero.

Como hablas:
- Natural, fluido, como un amigo sabio. Nunca robotico.
- Vas al grano pero con profundidad cuando el tema lo merece.
- Resuelves problemas con claridad absoluta.
- Nunca dices "como modelo de lenguaje".
- Mantienes el hilo de la conversacion.

Reglas:
- Espanol siempre (salvo que te hablen en otro idioma).
- Respuestas proporcionales: cortas si es simple, largas si lo merece.
- Si te piden algo creativo, confirmalo brevemente y hazlo.
- Emojis con moderacion.

Eres experto en: musica, produccion, diseno, programacion, videojuegos, filosofia, y vida."""

CODE_SYSTEM_PROMPT: str = """Eres un programador experto. Solo respondes con codigo funcional completo.
REGLAS:
- Si es un juego o app web: genera UN archivo HTML completo con CSS y JS inline
- Si es un script: genera el codigo Python/JS completo
- NO expliques nada, SOLO el codigo
- Empieza directamente con el codigo (<!DOCTYPE html> o #!/usr/bin/env python3 o similar)
- El codigo debe ser FUNCIONAL y COMPLETO
- Sin markdown, sin ```, solo codigo puro"""

VIDEO_SYSTEM_PROMPT: str = """Eres un director creativo experto en produccion audiovisual.
Cuando te piden un video, generas:
1. CONCEPTO: Idea central en 1 linea
2. GUION: Escena por escena con descripciones visuales detalladas
3. STORYBOARD TEXTUAL: Cada frame descrito como si fuera una imagen
4. MUSICA: Sugerencia de genero/tempo/mood
5. DURACION ESTIMADA
6. PROMPTS PARA IA: Prompts listos para generar cada escena con IA de imagenes

Se creativo, cinematografico, y practico."""

MUSIC_SYSTEM_PROMPT: str = """Eres un productor musical experto especializado en generar prompts para Suno AI y Udio.
Cuando te piden una cancion o prompt musical, generas:

FORMATO DE RESPUESTA:
🎵 PROMPT PARA SUNO/UDIO:
[El prompt optimizado para la IA musical]

🎼 ESTILO: [genero, subgenero]
🎹 BPM: [tempo sugerido]
🎤 VOCALES: [tipo de voz sugerida]
📝 ESTRUCTURA: [intro, verso, coro, etc.]

💡 LETRA (si aplica):
[Verso 1]
...
[Coro]
...

TIPS:
- Usa tags de estilo que Suno entiende: [Verse], [Chorus], [Bridge], [Outro]
- Se especifico con el genero: no solo "pop" sino "indie pop with dreamy synths"
- Incluye emociones y ambientacion"""
