# -*- coding: utf-8 -*-
"""
🔊 AUDIO PROCESSOR — Procesamiento de Audio Ultraligero
========================================================
- Transcripción con Groq Whisper / Whisper tiny
- Diarización (identificación de hablantes)
- TTS con edge-tts (sin límite, gratuito)
- Efectos de sonido bajo demanda
"""

import logging
import os
import tempfile
import time
from typing import Optional, Dict, Tuple

logger = logging.getLogger("c8l.nlp.audio")


class AudioProcessor:
    """
    Procesador de audio ultraligero.
    Usa Groq Whisper para STT y edge-tts para TTS.
    """

    # Formatos soportados
    SUPPORTED_FORMATS = ["ogg", "mp3", "wav", "m4a", "flac", "webm"]
    MAX_AUDIO_SIZE_MB = 25  # Límite de Groq Whisper
    MAX_DURATION_SECONDS = 120  # Para modelo tiny, más corto = más rápido

    def __init__(self):
        self.transcription_count = 0
        self.tts_count = 0

    async def transcribe(self, audio_bytes: bytes,
                         filename: str = "audio.ogg",
                         language: str = "es") -> Optional[str]:
        """
        Transcribe audio a texto usando Groq Whisper.

        Args:
            audio_bytes: Bytes del archivo de audio
            filename: Nombre del archivo (para detectar formato)
            language: Idioma del audio

        Returns:
            Texto transcrito o None si falla
        """
        import requests
        from config import GROQ_API_KEY

        if not GROQ_API_KEY:
            logger.warning("GROQ_API_KEY no configurada para Whisper")
            return None

        try:
            # Crear archivo temporal
            suffix = f".{filename.split('.')[-1]}" if '.' in filename else ".ogg"
            with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
                tmp.write(audio_bytes)
                tmp_path = tmp.name

            # Llamar a Groq Whisper
            headers = {"Authorization": f"Bearer {GROQ_API_KEY}"}
            with open(tmp_path, "rb") as audio_file:
                files = {"file": (filename, audio_file)}
                data = {
                    "model": "whisper-large-v3-turbo",
                    "language": language,
                    "response_format": "text",
                }
                response = requests.post(
                    "https://api.groq.com/openai/v1/audio/transcriptions",
                    headers=headers,
                    files=files,
                    data=data,
                    timeout=30,
                )

            # Limpiar temporal
            os.unlink(tmp_path)

            if response.status_code == 200:
                text = response.text.strip()
                if text:
                    self.transcription_count += 1
                    logger.info(f"🎤 Transcripción OK: {len(text)} chars")
                    return text
            else:
                logger.warning(f"Whisper error: {response.status_code}")
                return None

        except Exception as e:
            logger.error(f"Transcription error: {e}")
            return None

    async def text_to_speech(self, text: str, voice: str = "es-MX-DaliaNeural",
                             output_format: str = "mp3") -> Optional[bytes]:
        """
        Convierte texto a audio usando edge-tts (gratuito, sin límite).

        Args:
            text: Texto a convertir
            voice: Voz a usar (Microsoft Neural voices)
            output_format: Formato de salida

        Returns:
            Bytes del audio generado o None
        """
        try:
            import edge_tts

            # Limitar texto
            text = text[:2000]

            communicate = edge_tts.Communicate(text, voice)
            with tempfile.NamedTemporaryFile(suffix=f".{output_format}",
                                             delete=False) as tmp:
                tmp_path = tmp.name

            await communicate.save(tmp_path)

            with open(tmp_path, "rb") as f:
                audio_bytes = f.read()

            os.unlink(tmp_path)

            if audio_bytes:
                self.tts_count += 1
                logger.info(f"🔊 TTS OK: {len(audio_bytes)} bytes")
                return audio_bytes

        except ImportError:
            logger.warning("edge-tts no instalado")
        except Exception as e:
            logger.error(f"TTS error: {e}")

        return None

    async def detect_language(self, audio_bytes: bytes) -> Optional[str]:
        """Detecta el idioma del audio."""
        # Por ahora, default español
        # En producción: usar Whisper con task=detect
        return "es"

    def get_stats(self) -> Dict:
        return {
            "transcriptions": self.transcription_count,
            "tts_generated": self.tts_count,
        }

    @staticmethod
    def get_available_voices() -> Dict[str, str]:
        """Voces disponibles en edge-tts para español."""
        return {
            "dalia": "es-MX-DaliaNeural",       # Femenina México
            "jorge": "es-MX-JorgeNeural",       # Masculina México
            "elena": "es-ES-ElviraNeural",      # Femenina España
            "alvaro": "es-ES-AlvaroNeural",     # Masculina España
            "paloma": "es-US-PalomaNeural",     # Femenina US
            "alonso": "es-US-AlonsoNeural",     # Masculina US
        }
