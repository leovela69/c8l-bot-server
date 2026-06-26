# -*- coding: utf-8 -*-
"""
🎵 MUSIC CLIENT — MusicGen Local (Meta AI, 100% GRATIS, sin límites)
Genera música directamente en el VPS sin API key, sin CAPTCHA, sin nada.

MusicGen (Meta/Facebook):
  - Modelo: facebook/musicgen-small (corre en CPU con 2GB RAM)
  - Genera instrumentales de alta calidad desde texto
  - 32kHz, mono, WAV/MP3
  - 100% local, 100% gratis, sin API, sin límites
  - Tarda ~60-90s en CPU para generar ~10s de audio

Uso:
    from lyria_client import LyriaClient
    client = LyriaClient()
    result = client.generate("reggaeton flamenco beat, energetic, 100 BPM")
    # result = {"success": True, "audio_bytes": b"...(wav)...", "title": "..."}
"""

import os
import sys
import io
import time
import logging
import numpy as np
from typing import Dict, Any, Optional

logger = logging.getLogger("c8l.music")

# Singleton del pipeline (evitar recargar modelo en cada generación)
_musicgen_pipeline = None


def _get_pipeline():
    """Carga MusicGen una sola vez y lo cachea en memoria."""
    global _musicgen_pipeline
    if _musicgen_pipeline is None:
        logger.info("🎵 Cargando MusicGen-small (primera vez tarda ~10s)...")
        from transformers import pipeline
        _musicgen_pipeline = pipeline(
            'text-to-audio',
            model='facebook/musicgen-small',
            device='cpu',
        )
        logger.info("🎵 MusicGen-small cargado y listo!")
    return _musicgen_pipeline


class LyriaClient:
    """
    Generador de música local con MusicGen (Meta AI).
    100% gratis, sin API key, sin CAPTCHA, sin límites.
    Genera instrumentales de calidad desde descripciones de texto.
    """

    def __init__(self, api_key: str = None):
        """No necesita API key — corre local."""
        # api_key se acepta por compatibilidad pero no se usa
        logger.info("🎵 Music Client inicializado (MusicGen Local)")

    # ===== GENERATE =====

    def generate(
        self,
        prompt: str,
        model: str = "musicgen-small",
        instrumental: bool = False,
        timeout: int = 300,
        max_tokens: int = 1024,
    ) -> Dict[str, Any]:
        """
        Genera música con MusicGen local.

        Args:
            prompt: Descripción del audio ("reggaeton flamenco beat, 100 BPM")
            model: Ignorado (siempre usa musicgen-small)
            instrumental: Ignorado (MusicGen solo genera instrumentales)
            timeout: No usado (corre síncrono)
            max_tokens: Controla duración (~256=5s, ~512=10s, ~1024=20s, ~1500=30s)

        Returns:
            {"success": True/False, "audio_bytes": bytes (WAV), "title": str, ...}
        """
        logger.info(f"🎵 MusicGen: Generando '{prompt[:60]}...' (tokens={max_tokens})")
        start_time = time.time()

        try:
            gen = _get_pipeline()

            # Generar audio
            result = gen(
                prompt,
                forward_params={'max_new_tokens': max_tokens},
            )

            # Extraer audio (array 1D float32)
            audio = np.array(result['audio']).flatten().astype(np.float32)
            sample_rate = result['sampling_rate']
            duration = len(audio) / sample_rate

            # Convertir a WAV bytes
            import scipy.io.wavfile
            wav_buffer = io.BytesIO()
            scipy.io.wavfile.write(wav_buffer, rate=sample_rate, data=audio)
            wav_bytes = wav_buffer.getvalue()

            elapsed = time.time() - start_time
            title = self._generate_title(prompt)

            logger.info(f"🎵 ✅ MusicGen generó: {len(wav_bytes)//1024}KB, {duration:.1f}s, en {elapsed:.0f}s")

            return {
                "success": True,
                "audio_bytes": wav_bytes,
                "lyrics": "",
                "title": title,
                "model": "musicgen-small",
                "duration": duration,
                "error": "",
            }

        except Exception as e:
            elapsed = time.time() - start_time
            logger.error(f"🎵 ❌ MusicGen error ({elapsed:.0f}s): {e}")
            return {
                "success": False,
                "audio_bytes": None,
                "lyrics": "",
                "title": "",
                "model": "musicgen-small",
                "error": str(e),
            }

    def _generate_title(self, prompt: str) -> str:
        """Genera un título a partir del prompt."""
        words = prompt.split()
        skip = {"a", "an", "the", "un", "una", "el", "la", "los", "las", "de",
                "del", "en", "con", "sobre", "para", "beat", "bpm", "style"}
        title_words = [w for w in words[:8] if w.lower() not in skip][:4]
        return " ".join(title_words).title() if title_words else "C8L Beat"

    # ===== SHORTCUTS =====

    def generate_clip(self, prompt: str, instrumental: bool = False) -> Dict[str, Any]:
        """Genera un clip corto (~10s)."""
        return self.generate(prompt, max_tokens=512)

    def generate_full_song(self, prompt: str, instrumental: bool = False) -> Dict[str, Any]:
        """Genera un track largo (~30s)."""
        return self.generate(prompt, max_tokens=1500)

    # ===== SEND TO TELEGRAM =====

    def send_to_telegram(
        self,
        chat_id: str,
        audio_bytes: bytes,
        title: str = "C8L Beat",
        caption: str = "",
        bot_token: str = None,
    ) -> Dict[str, Any]:
        """Envía audio generado a Telegram como documento de audio."""
        import requests as req

        if not bot_token:
            try:
                from config import TELEGRAM_BOT_TOKEN
                bot_token = TELEGRAM_BOT_TOKEN
            except ImportError:
                return {"success": False, "error": "No Telegram bot token"}

        if not caption:
            caption = f"🎵 *{title}*\n🤖 Generado con MusicGen AI × C8L Agency"

        try:
            url = f"https://api.telegram.org/bot{bot_token}/sendAudio"
            files = {"audio": (f"{title}.wav", audio_bytes, "audio/wav")}
            data = {
                "chat_id": chat_id,
                "caption": caption,
                "parse_mode": "Markdown",
                "title": title,
            }
            response = req.post(url, files=files, data=data, timeout=60)
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
        model: str = "musicgen-small",
    ) -> Dict[str, Any]:
        """Genera música y la envía directamente a Telegram."""
        result = self.generate(prompt, max_tokens=1024)

        if not result["success"]:
            return result

        tg_result = self.send_to_telegram(
            chat_id=chat_id,
            audio_bytes=result["audio_bytes"],
            title=result["title"],
            bot_token=bot_token,
        )

        return {**result, "telegram_sent": tg_result.get("success", False)}
