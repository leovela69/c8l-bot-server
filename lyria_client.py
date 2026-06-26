# -*- coding: utf-8 -*-
"""
🎵 MUSIC CLIENT — Generador de música con Pollinations AI (GRATIS con tu key)
Reemplazo de Suno cuando el CAPTCHA bloquea la generación.

Pollinations Audio/Music:
  - Modelos: elevenmusic, stable-audio-3-medium, stable-audio-3-large, acestep
  - Endpoint: GET /audio/{prompt}?model=elevenmusic
  - Usa tu POLLINATIONS_API_KEY que ya funciona para imágenes/video
  - SIN cookies, SIN CAPTCHA, SIN expiración

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

logger = logging.getLogger("c8l.music")

# Pollinations Audio API
POLLINATIONS_AUDIO_URL = "https://gen.pollinations.ai/audio"


class LyriaClient:
    """
    Generador de música via Pollinations AI.
    Usa la misma API key que ya funciona para imágenes/video.
    Modelos: elevenmusic, stable-audio-3-medium, stable-audio-3-large
    """

    def __init__(self, api_key: str = None):
        """
        Args:
            api_key: Pollinations API key. Si no se pasa, intenta obtenerla de config.py.
        """
        self.api_key = api_key or self._get_api_key()
        if not self.api_key:
            raise ValueError("Se necesita POLLINATIONS_API_KEY para generar música")
        logger.info("🎵 Music Client inicializado (Pollinations AI)")

    def _get_api_key(self) -> Optional[str]:
        """Obtiene API key de múltiples fuentes."""
        # 1. Environment variable
        key = os.environ.get("POLLINATIONS_API_KEY", "")
        if key:
            return key

        # 2. config.py
        try:
            sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
            from config import POLLINATIONS_API_KEY_P
            if POLLINATIONS_API_KEY_P:
                return POLLINATIONS_API_KEY_P
        except ImportError:
            pass

        return None

    # ===== GENERATE: Música con Pollinations =====

    def generate(
        self,
        prompt: str,
        model: str = "elevenmusic",
        instrumental: bool = False,
        timeout: int = 180,
    ) -> Dict[str, Any]:
        """
        Genera música con Pollinations AI.

        Args:
            prompt: Descripción de la canción
            model: "elevenmusic", "stable-audio-3-medium", "stable-audio-3-large", "acestep"
            instrumental: Si True, agrega "Instrumental only" al prompt
            timeout: Tiempo máximo

        Returns:
            {"success": True/False, "audio_bytes": bytes, "lyrics": str, "title": str, ...}
        """
        if instrumental and "instrumental" not in prompt.lower():
            prompt += ". Instrumental only, no vocals."

        logger.info(f"🎵 Pollinations Music: '{prompt[:60]}...' model={model}")

        # Pollinations audio endpoint: GET /audio/{text}?model=X
        import urllib.parse
        encoded_prompt = urllib.parse.quote(prompt)
        url = f"{POLLINATIONS_AUDIO_URL}/{encoded_prompt}"

        params = {"model": model}
        headers = {"Authorization": f"Bearer {self.api_key}"}

        try:
            response = requests.get(
                url,
                params=params,
                headers=headers,
                timeout=timeout,
            )

            if response.status_code == 200:
                content_type = response.headers.get("content-type", "")
                if "audio" in content_type or len(response.content) > 10000:
                    audio_bytes = response.content
                    title = self._generate_title(prompt)
                    logger.info(f"🎵 ✅ Música generada: {len(audio_bytes)} bytes, title='{title}'")
                    return {
                        "success": True,
                        "audio_bytes": audio_bytes,
                        "lyrics": "",
                        "title": title,
                        "model": model,
                        "error": "",
                    }
                else:
                    # La respuesta no es audio
                    return {
                        "success": False,
                        "audio_bytes": None,
                        "lyrics": "",
                        "title": "",
                        "model": model,
                        "error": f"Respuesta no es audio: {response.text[:200]}",
                    }
            else:
                error_msg = response.text[:200]
                logger.error(f"🎵 Pollinations error {response.status_code}: {error_msg}")

                # Si elevenmusic falla, probar stable-audio como fallback
                if model == "elevenmusic":
                    logger.info("🎵 Intentando con stable-audio-3-large...")
                    return self.generate(prompt, model="stable-audio-3-large", instrumental=instrumental, timeout=timeout)
                elif model == "stable-audio-3-large":
                    logger.info("🎵 Intentando con stable-audio-3-medium...")
                    return self.generate(prompt, model="stable-audio-3-medium", instrumental=instrumental, timeout=timeout)

                return {
                    "success": False,
                    "audio_bytes": None,
                    "lyrics": "",
                    "title": "",
                    "model": model,
                    "error": f"HTTP {response.status_code}: {error_msg}",
                }

        except requests.exceptions.Timeout:
            return {"success": False, "audio_bytes": None, "lyrics": "", "title": "",
                    "model": model, "error": f"Timeout ({timeout}s)"}
        except Exception as e:
            logger.error(f"🎵 Error: {e}")
            return {"success": False, "audio_bytes": None, "lyrics": "", "title": "",
                    "model": model, "error": str(e)}

    def _generate_title(self, prompt: str) -> str:
        """Genera un título a partir del prompt."""
        # Extraer las primeras palabras significativas
        words = prompt.split()
        if len(words) <= 4:
            return prompt.title()
        # Tomar primeras 4-5 palabras que no sean artículos
        skip = {"a", "an", "the", "un", "una", "el", "la", "los", "las", "de", "del", "en", "con", "sobre", "para"}
        title_words = [w for w in words[:8] if w.lower() not in skip][:4]
        return " ".join(title_words).title() if title_words else "C8L Track"

    # ===== SHORTCUTS =====

    def generate_clip(self, prompt: str, instrumental: bool = False) -> Dict[str, Any]:
        """Genera un clip corto con stable-audio."""
        return self.generate(prompt, model="stable-audio-3-medium", instrumental=instrumental, timeout=60)

    def generate_full_song(self, prompt: str, instrumental: bool = False) -> Dict[str, Any]:
        """Genera una canción completa con elevenmusic."""
        return self.generate(prompt, model="elevenmusic", instrumental=instrumental, timeout=180)

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
            caption = f"🎵 *{title}*\n🤖 Generado con C8L Agency AI Music"

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
        model: str = "elevenmusic",
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
