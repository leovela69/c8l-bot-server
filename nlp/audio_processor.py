# -*- coding: utf-8 -*-
"""
🎙️ AUDIO PROCESSOR — Transcripción y Comprensión de Audio ANTIGRAVITY
=======================================================================
Convierte notas de voz y audios en texto usando Groq Whisper API.
Soporta multiidioma, detección automática de idioma, y compresión previa.
"""

import os
import io
import logging
import tempfile
from typing import Dict, Optional

logger = logging.getLogger("c8l.audio_processor")

GROQ_API_KEY = os.environ.get("GROQ_API_KEY", "")
GROQ_WHISPER_URL = "https://api.groq.com/openai/v1/audio/transcriptions"
WHISPER_MODEL = "whisper-large-v3"

# Límites
MAX_AUDIO_SIZE_MB = 25
SUPPORTED_FORMATS = [".mp3", ".mp4", ".mpeg", ".mpga", ".m4a", ".wav", ".webm", ".ogg", ".oga"]


class AudioProcessor:
    """
    Procesa audio del usuario:
    1. Recibe archivo de audio (Telegram voice/audio)
    2. Valida formato y tamaño
    3. Envía a Groq Whisper
    4. Devuelve transcripción + metadata
    """

    def __init__(self):
        self.supported_formats = SUPPORTED_FORMATS

    async def transcribe(self, audio_data: bytes, filename: str = "audio.ogg",
                          language: str = None) -> Dict:
        """
        Transcribe audio a texto.
        
        Args:
            audio_data: Bytes del archivo de audio
            filename: Nombre del archivo (para determinar formato)
            language: Código de idioma (es, en, etc.) o None para auto-detect
            
        Returns:
            {
                "success": bool,
                "text": str,
                "language": str,
                "duration_seconds": float,
                "error": str (si hay error)
            }
        """
        if not GROQ_API_KEY:
            return {"success": False, "text": "", "error": "GROQ_API_KEY no configurada"}

        # Validar tamaño
        size_mb = len(audio_data) / (1024 * 1024)
        if size_mb > MAX_AUDIO_SIZE_MB:
            return {
                "success": False,
                "text": "",
                "error": f"Audio demasiado grande ({size_mb:.1f}MB). Máximo: {MAX_AUDIO_SIZE_MB}MB"
            }

        # Validar formato
        ext = os.path.splitext(filename)[1].lower()
        if ext not in SUPPORTED_FORMATS:
            # Intentar como ogg (formato por defecto de Telegram voice)
            filename = "audio.ogg"

        try:
            result = await self._call_whisper(audio_data, filename, language)
            return result
        except Exception as e:
            logger.error(f"Error transcribiendo audio: {e}")
            return {"success": False, "text": "", "error": str(e)}

    async def transcribe_from_telegram(self, bot, file_id: str,
                                         language: str = None) -> Dict:
        """
        Descarga y transcribe un audio directamente de Telegram.
        
        Args:
            bot: Instancia del bot de Telegram (python-telegram-bot)
            file_id: ID del archivo en Telegram
            language: Código de idioma o None
        """
        try:
            # Descargar archivo de Telegram
            file = await bot.get_file(file_id)
            audio_bytes = await file.download_as_bytearray()

            # Determinar extensión
            file_path = file.file_path or "audio.ogg"
            filename = os.path.basename(file_path)

            return await self.transcribe(bytes(audio_bytes), filename, language)

        except Exception as e:
            logger.error(f"Error descargando audio de Telegram: {e}")
            return {"success": False, "text": "", "error": f"Error descargando: {e}"}

    async def _call_whisper(self, audio_data: bytes, filename: str,
                              language: str = None) -> Dict:
        """Llama a Groq Whisper API para transcripción."""
        import aiohttp

        headers = {
            "Authorization": f"Bearer {GROQ_API_KEY}",
        }

        # Construir form data
        form = aiohttp.FormData()
        form.add_field("file", audio_data, filename=filename,
                       content_type="audio/ogg")
        form.add_field("model", WHISPER_MODEL)
        form.add_field("response_format", "verbose_json")

        if language:
            form.add_field("language", language)

        async with aiohttp.ClientSession() as session:
            async with session.post(
                GROQ_WHISPER_URL,
                headers=headers,
                data=form,
                timeout=aiohttp.ClientTimeout(total=60)
            ) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    return {
                        "success": True,
                        "text": data.get("text", "").strip(),
                        "language": data.get("language", "unknown"),
                        "duration_seconds": data.get("duration", 0),
                        "segments": data.get("segments", []),
                    }
                else:
                    error = await resp.text()
                    logger.error(f"Whisper API error {resp.status}: {error[:200]}")
                    return {
                        "success": False,
                        "text": "",
                        "error": f"API error {resp.status}: {error[:100]}"
                    }

    def is_audio_message(self, message) -> bool:
        """Detecta si un mensaje de Telegram contiene audio."""
        return bool(
            getattr(message, 'voice', None) or
            getattr(message, 'audio', None) or
            getattr(message, 'video_note', None)
        )

    def get_file_id(self, message) -> Optional[str]:
        """Extrae el file_id del mensaje de audio."""
        if getattr(message, 'voice', None):
            return message.voice.file_id
        elif getattr(message, 'audio', None):
            return message.audio.file_id
        elif getattr(message, 'video_note', None):
            return message.video_note.file_id
        return None
