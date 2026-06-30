# -*- coding: utf-8 -*-
"""
🔊 TTS — Text-to-Speech Ultraligero
=====================================
Motor de síntesis de voz gratuito con edge-tts.
Sin límites, 200+ voces, neural voices de Microsoft.
"""

import logging
import tempfile
import os
from typing import Optional, Dict, List

logger = logging.getLogger("c8l.nlp.tts")


# Voces populares por idioma
VOICES = {
    "es": {
        "default": "es-MX-DaliaNeural",
        "male": "es-MX-JorgeNeural",
        "female": "es-MX-DaliaNeural",
        "spain_male": "es-ES-AlvaroNeural",
        "spain_female": "es-ES-ElviraNeural",
    },
    "en": {
        "default": "en-US-JennyNeural",
        "male": "en-US-GuyNeural",
        "female": "en-US-JennyNeural",
    },
    "fr": {"default": "fr-FR-DeniseNeural"},
    "pt": {"default": "pt-BR-FranciscaNeural"},
    "de": {"default": "de-DE-KatjaNeural"},
    "it": {"default": "it-IT-ElsaNeural"},
    "ja": {"default": "ja-JP-NanamiNeural"},
    "zh": {"default": "zh-CN-XiaoxiaoNeural"},
}


class TTSEngine:
    """Motor TTS gratuito con edge-tts."""

    def __init__(self):
        self.generated_count = 0
        self._cache: Dict[str, bytes] = {}  # Cache de frases comunes
        self.cache_max = 50

    async def generate(self, text: str, voice: str = None,
                       language: str = "es",
                       rate: str = "+0%",
                       pitch: str = "+0Hz") -> Optional[bytes]:
        """
        Genera audio desde texto.

        Args:
            text: Texto a sintetizar (max 2000 chars)
            voice: Voz específica o None para default
            language: Idioma para selección automática de voz
            rate: Velocidad ("+20%", "-10%", etc.)
            pitch: Tono ("+5Hz", "-3Hz", etc.)

        Returns:
            Bytes MP3 o None si falla
        """
        if not text or not text.strip():
            return None

        text = text[:2000]  # Limitar

        # Seleccionar voz
        if not voice:
            lang_voices = VOICES.get(language, VOICES["es"])
            voice = lang_voices.get("default", "es-MX-DaliaNeural")

        # Check cache para frases comunes
        cache_key = f"{voice}:{text[:100]}"
        if cache_key in self._cache:
            return self._cache[cache_key]

        try:
            import edge_tts

            communicate = edge_tts.Communicate(
                text, voice, rate=rate, pitch=pitch
            )

            with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as tmp:
                tmp_path = tmp.name

            await communicate.save(tmp_path)

            with open(tmp_path, "rb") as f:
                audio_bytes = f.read()

            os.unlink(tmp_path)

            if audio_bytes and len(audio_bytes) > 100:
                self.generated_count += 1
                # Cachear frases cortas
                if len(text) < 100:
                    self._cache[cache_key] = audio_bytes
                    if len(self._cache) > self.cache_max:
                        # Eliminar la más antigua
                        first_key = next(iter(self._cache))
                        del self._cache[first_key]
                return audio_bytes

        except ImportError:
            logger.error("edge-tts no instalado. pip install edge-tts")
        except Exception as e:
            logger.error(f"TTS generation error: {e}")

        return None

    async def list_voices(self, language: str = "es") -> List[Dict]:
        """Lista voces disponibles para un idioma."""
        try:
            import edge_tts
            voices = await edge_tts.list_voices()
            filtered = [v for v in voices if v["Locale"].startswith(language)]
            return [
                {"name": v["ShortName"], "gender": v["Gender"],
                 "locale": v["Locale"]}
                for v in filtered
            ]
        except Exception:
            return []

    def get_stats(self) -> Dict:
        return {
            "generated": self.generated_count,
            "cached_phrases": len(self._cache),
        }
