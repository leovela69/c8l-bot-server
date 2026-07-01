# -*- coding: utf-8 -*-
"""
🌐 TRANSLATE SKILL — Traducción Multi-idioma
==============================================
APIs gratuitas:
- MyMemory API (sin key, 1000 palabras/día)
- Fallback: Groq LLM para traducciones complejas
"""

import requests
import logging
from typing import Optional, Dict

logger = logging.getLogger("c8l.skills.translate")


class TranslateSkill:
    """Skill de traducción ultraligero."""

    MYMEMORY_URL = "https://api.mymemory.translated.net/get"

    LANGUAGES = {
        "español": "es", "es": "es", "spanish": "es",
        "inglés": "en", "en": "en", "english": "en", "ingles": "en",
        "francés": "fr", "fr": "fr", "french": "fr", "frances": "fr",
        "portugués": "pt", "pt": "pt", "portuguese": "pt",
        "alemán": "de", "de": "de", "german": "de", "aleman": "de",
        "italiano": "it", "it": "it", "italian": "it",
        "japonés": "ja", "ja": "ja", "japanese": "ja", "japones": "ja",
        "chino": "zh", "zh": "zh", "chinese": "zh",
        "coreano": "ko", "ko": "ko", "korean": "ko",
        "ruso": "ru", "ru": "ru", "russian": "ru",
        "árabe": "ar", "ar": "ar", "arabic": "ar", "arabe": "ar",
    }

    def __init__(self):
        self.translation_count = 0

    def translate(self, text: str, target: str = "en",
                  source: str = "es") -> Optional[str]:
        """
        Traduce texto.

        Args:
            text: Texto a traducir (max 500 chars)
            target: Idioma destino
            source: Idioma origen

        Returns:
            Texto formateado con la traducción
        """
        # Resolver nombres de idioma a códigos
        target_code = self.LANGUAGES.get(target.lower(), target.lower())
        source_code = self.LANGUAGES.get(source.lower(), source.lower())

        text = text[:500]

        # Intentar MyMemory
        translated = self._mymemory_translate(text, source_code, target_code)

        if translated:
            self.translation_count += 1
            lang_name = self._get_lang_name(target_code)
            return (
                f"🌐 *Traducción a {lang_name}:*\n\n"
                f"📝 Original: {text}\n\n"
                f"✅ Traducción: {translated}"
            )

        # Fallback: Groq LLM
        translated = self._llm_translate(text, target_code)
        if translated:
            self.translation_count += 1
            lang_name = self._get_lang_name(target_code)
            return (
                f"🌐 *Traducción a {lang_name}:*\n\n"
                f"📝 Original: {text}\n\n"
                f"✅ Traducción: {translated}"
            )

        return f"❌ No pude traducir el texto. Intenta de nuevo."

    def detect_target_language(self, message: str) -> str:
        """Detecta idioma destino del mensaje del usuario."""
        msg_lower = message.lower()
        for lang_name, code in self.LANGUAGES.items():
            if f"a {lang_name}" in msg_lower or f"al {lang_name}" in msg_lower:
                return code
            if f"en {lang_name}" in msg_lower:
                return code
            if f"to {lang_name}" in msg_lower:
                return code
        # Default: si el texto parece español, traducir a inglés
        return "en"

    def _mymemory_translate(self, text: str, source: str,
                            target: str) -> Optional[str]:
        """Traduce con MyMemory API (gratuita)."""
        try:
            params = {
                "q": text,
                "langpair": f"{source}|{target}",
            }
            r = requests.get(self.MYMEMORY_URL, params=params, timeout=10)
            if r.status_code == 200:
                data = r.json()
                if data.get("responseStatus") == 200:
                    translated = data["responseData"]["translatedText"]
                    if translated and translated.lower() != text.lower():
                        return translated
        except Exception as e:
            logger.warning(f"MyMemory error: {e}")
        return None

    def _llm_translate(self, text: str, target: str) -> Optional[str]:
        """Traduce con Groq LLM como fallback."""
        try:
            from openrouter_client import call_openrouter
            lang_name = self._get_lang_name(target)
            prompt = (
                f"Traduce el siguiente texto a {lang_name}. "
                f"Solo devuelve la traducción, sin explicaciones:\n\n{text}"
            )
            result = call_openrouter(prompt, agent_name="hermes",
                                    temperature=0.3, max_tokens=500)
            return result if result else None
        except Exception:
            return None

    def _get_lang_name(self, code: str) -> str:
        """Obtiene nombre de idioma desde código."""
        names = {
            "es": "Español", "en": "Inglés", "fr": "Francés",
            "pt": "Portugués", "de": "Alemán", "it": "Italiano",
            "ja": "Japonés", "zh": "Chino", "ko": "Coreano",
            "ru": "Ruso", "ar": "Árabe",
        }
        return names.get(code, code.upper())
