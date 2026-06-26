# -*- coding: utf-8 -*-
"""
🎵 LYRIA 3 CLIENT — Google AI Music Generation (GRATIS, sin CAPTCHA)
Reemplazo de Suno cuando el CAPTCHA bloquea la generación.

Lyria 3 (Google):
  - Genera canciones completas con vocales, letras, instrumentos
  - 44.1 kHz stereo, alta calidad
  - API REST simple: solo necesita GEMINI_API_KEY
  - SIN cookies, SIN CAPTCHA, SIN expiración
  - Modelos: lyria-3-clip-preview (30s), lyria-3-pro-preview (2+ min)

Uso:
    from lyria_client import LyriaClient
    client = LyriaClient()
    result = client.generate("reggaeton flamenco sobre una noche en Ibiza")
    # result = {"success": True, "audio_bytes": b"...", "lyrics": "...", "title": "..."}
"""

import os
import sys
import json
import time
import base64
import logging
import requests
from typing import Dict, Any, Optional, List

logger = logging.getLogger("c8l.lyria")

# API Config
GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/interactions"


class LyriaClient:
    """
    Google Lyria 3 — Generador de música con IA.
    100% gratis con API key de Gemini. Sin CAPTCHA.
    """

    def __init__(self, api_key: str = None):
        """
        Args:
            api_key: Google AI API key. Si no se pasa, intenta obtenerla de config.py o env.
        """
        self.api_key = api_key or self._get_api_key()
        if not self.api_key:
            raise ValueError("Se necesita GEMINI_API_KEY para usar Lyria 3")
        logger.info("🎵 Lyria 3 Client inicializado (Google AI)")

    def _get_api_key(self) -> Optional[str]:
        """Obtiene API key de múltiples fuentes."""
        # 1. Environment variable
        key = os.environ.get("GEMINI_API_KEY", "")
        if key and key.startswith("AI"):
            return key

        # 2. config.py
        try:
            sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
            from config import GEMINI_API_KEY
            if GEMINI_API_KEY and len(GEMINI_API_KEY) > 20:
                return GEMINI_API_KEY
        except ImportError:
            pass

        return None

    # ===== GENERATE: Canción completa =====

    def generate(
        self,
        prompt: str,
        model: str = "lyria-3-pro-preview",
        instrumental: bool = False,
        timeout: int = 180,
    ) -> Dict[str, Any]:
        """
        Genera una canción completa con Lyria 3.

        Args:
            prompt: Descripción de la canción (estilo, letra, mood, BPM, etc.)
            model: "lyria-3-pro-preview" (canción completa) o "lyria-3-clip-preview" (30s)
            instrumental: Si True, agrega "Instrumental only, no vocals" al prompt
            timeout: Tiempo máximo de espera en segundos

        Returns:
            {
                "success": True/False,
                "audio_bytes": bytes (MP3),
                "lyrics": str,
                "title": str (extraído de las lyrics),
                "model": str,
                "error": str (si falla),
            }
        """
        if instrumental and "instrumental" not in prompt.lower():
            prompt += ". Instrumental only, no vocals."

        logger.info(f"🎵 Lyria 3: Generando con '{prompt[:60]}...' model={model}")

        payload = {
            "model": model,
            "input": prompt,
        }

        headers = {
            "Content-Type": "application/json",
            "x-goog-api-key": self.api_key,
        }

        try:
            response = requests.post(
                GEMINI_API_URL,
                json=payload,
                headers=headers,
                timeout=timeout,
            )

            if response.status_code != 200:
                error_msg = response.text[:200]
                logger.error(f"🎵 Lyria error {response.status_code}: {error_msg}")
                return {
                    "success": False,
                    "audio_bytes": None,
                    "lyrics": "",
                    "title": "",
                    "model": model,
                    "error": f"HTTP {response.status_code}: {error_msg}",
                }

            data = response.json()
            return self._parse_response(data, model)

        except requests.exceptions.Timeout:
            return {"success": False, "audio_bytes": None, "lyrics": "", "title": "",
                    "model": model, "error": f"Timeout ({timeout}s) — la canción tardó demasiado"}
        except Exception as e:
            logger.error(f"🎵 Lyria error: {e}")
            return {"success": False, "audio_bytes": None, "lyrics": "", "title": "",
                    "model": model, "error": str(e)}

    def _parse_response(self, data: dict, model: str) -> Dict[str, Any]:
        """Parsea la respuesta de Lyria 3 (steps con audio + text)."""
        audio_bytes = None
        lyrics_parts = []

        steps = data.get("steps", [])
        for step in steps:
            if step.get("type") == "model_output":
                for block in step.get("content", []):
                    if block.get("type") == "audio":
                        # Audio en base64
                        audio_data = block.get("data", "")
                        if audio_data:
                            audio_bytes = base64.b64decode(audio_data)
                    elif block.get("type") == "text":
                        text = block.get("text", "")
                        if text:
                            lyrics_parts.append(text)

        # También comprobar output_audio y output_text directos
        if not audio_bytes:
            out_audio = data.get("output_audio", {})
            if out_audio and out_audio.get("data"):
                audio_bytes = base64.b64decode(out_audio["data"])

        if not lyrics_parts:
            out_text = data.get("output_text", "")
            if out_text:
                lyrics_parts.append(out_text)

        lyrics = "\n".join(lyrics_parts)
        title = self._extract_title(lyrics)

        if audio_bytes:
            logger.info(f"🎵 Lyria 3: ✅ Generado! {len(audio_bytes)} bytes, title='{title}'")
            return {
                "success": True,
                "audio_bytes": audio_bytes,
                "lyrics": lyrics,
                "title": title or "C8L Track",
                "model": model,
                "error": "",
            }
        else:
            logger.error("🎵 Lyria 3: No se recibió audio en la respuesta")
            return {
                "success": False,
                "audio_bytes": None,
                "lyrics": lyrics,
                "title": "",
                "model": model,
                "error": "No audio in response",
            }

    def _extract_title(self, lyrics: str) -> str:
        """Intenta extraer un título de las lyrics."""
        if not lyrics:
            return ""
        # Buscar línea con "Title:" o primera línea no vacía
        for line in lyrics.split("\n"):
            line = line.strip()
            if line.lower().startswith("title:"):
                return line.split(":", 1)[1].strip().strip('"')
            if line.startswith("#"):
                return line.lstrip("#").strip()
        # Fallback: primera línea que no sea un tag
        for line in lyrics.split("\n"):
            line = line.strip()
            if line and not line.startswith("[") and not line.startswith("{"):
                return line[:50]
        return ""

    # ===== GENERATE CLIP: 30 segundos =====

    def generate_clip(self, prompt: str, instrumental: bool = False) -> Dict[str, Any]:
        """Genera un clip de 30 segundos (más rápido)."""
        return self.generate(prompt, model="lyria-3-clip-preview", instrumental=instrumental, timeout=60)

    # ===== GENERATE FULL SONG: Canción completa =====

    def generate_full_song(self, prompt: str, instrumental: bool = False) -> Dict[str, Any]:
        """Genera una canción completa de ~2 minutos."""
        return self.generate(prompt, model="lyria-3-pro-preview", instrumental=instrumental, timeout=180)

    # ===== SEND TO TELEGRAM =====

    def send_to_telegram(
        self,
        chat_id: str,
        audio_bytes: bytes,
        title: str = "C8L Track",
        caption: str = "",
        bot_token: str = None,
    ) -> Dict[str, Any]:
        """Envía audio generado a Telegram."""
        if not bot_token:
            try:
                from config import TELEGRAM_BOT_TOKEN
                bot_token = TELEGRAM_BOT_TOKEN
            except ImportError:
                return {"success": False, "error": "No Telegram bot token"}

        if not caption:
            caption = f"🎵 *{title}*\n🤖 Generado con Google Lyria 3 × C8L Agency"

        try:
            url = f"https://api.telegram.org/bot{bot_token}/sendAudio"
            files = {"audio": (f"{title}.mp3", audio_bytes, "audio/mpeg")}
            data = {
                "chat_id": chat_id,
                "caption": caption,
                "parse_mode": "Markdown",
                "title": title,
            }
            response = requests.post(url, files=files, data=data, timeout=60)
            result = response.json()

            if result.get("ok"):
                logger.info(f"✅ Audio enviado a Telegram: {title}")
                return {"success": True, "message_id": result["result"]["message_id"]}
            else:
                return {"success": False, "error": result.get("description", "Telegram error")}
        except Exception as e:
            return {"success": False, "error": str(e)}

    # ===== COMBO: Generate + Send =====

    def create_and_send(
        self,
        chat_id: str,
        prompt: str,
        instrumental: bool = False,
        bot_token: str = None,
        model: str = "lyria-3-pro-preview",
    ) -> Dict[str, Any]:
        """Genera una canción y la envía directamente a Telegram."""
        result = self.generate(prompt, model=model, instrumental=instrumental)

        if not result["success"]:
            return result

        tg_result = self.send_to_telegram(
            chat_id=chat_id,
            audio_bytes=result["audio_bytes"],
            title=result["title"],
            bot_token=bot_token,
        )

        return {**result, "telegram_sent": tg_result.get("success", False)}
