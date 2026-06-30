# -*- coding: utf-8 -*-
"""
📖 OCR — Reconocimiento Óptico de Caracteres
==============================================
Extrae texto de imágenes y PDFs usando servicios gratuitos.
- OCR.space (API gratuita, soporta PDF)
- Fallback: Groq Vision como OCR
"""

import logging
import base64
import requests
from typing import Optional, Dict

logger = logging.getLogger("c8l.nlp.ocr")


class OCREngine:
    """
    Motor OCR ultraligero usando servicios gratuitos.
    """

    # API gratuita de OCR.space
    OCR_SPACE_URL = "https://api.ocr.space/parse/image"
    OCR_SPACE_KEY = "helloworld"  # Key gratuita pública

    SUPPORTED_LANGUAGES = {
        "es": "spa", "en": "eng", "fr": "fre", "de": "ger",
        "it": "ita", "pt": "por", "ja": "jpn", "zh": "chs",
        "ar": "ara", "ru": "rus", "ko": "kor",
    }

    def __init__(self):
        self.extraction_count = 0

    async def extract_text(self, image_bytes: bytes,
                           language: str = "es",
                           is_pdf: bool = False) -> Optional[str]:
        """
        Extrae texto de imagen o PDF.

        Args:
            image_bytes: Bytes de la imagen/PDF
            language: Idioma del texto
            is_pdf: Si es un archivo PDF

        Returns:
            Texto extraído o None
        """
        # Intentar OCR.space primero
        text = await self._ocr_space(image_bytes, language, is_pdf)
        if text:
            self.extraction_count += 1
            return text

        # Fallback: Groq Vision
        if not is_pdf:
            text = await self._groq_vision_ocr(image_bytes)
            if text:
                self.extraction_count += 1
                return text

        return None

    async def _ocr_space(self, image_bytes: bytes,
                         language: str = "es",
                         is_pdf: bool = False) -> Optional[str]:
        """Usa OCR.space API gratuita."""
        try:
            b64 = base64.b64encode(image_bytes).decode("utf-8")
            mime = "application/pdf" if is_pdf else "image/png"

            payload = {
                "base64Image": f"data:{mime};base64,{b64}",
                "language": self.SUPPORTED_LANGUAGES.get(language, "spa"),
                "isOverlayRequired": False,
                "OCREngine": 2,  # Motor más preciso
                "isTable": True,  # Detectar tablas
            }

            response = requests.post(
                self.OCR_SPACE_URL,
                data=payload,
                headers={"apikey": self.OCR_SPACE_KEY},
                timeout=25,
            )

            if response.status_code == 200:
                data = response.json()
                if data.get("ParsedResults"):
                    texts = []
                    for result in data["ParsedResults"]:
                        text = result.get("ParsedText", "").strip()
                        if text:
                            texts.append(text)
                    if texts:
                        return "\n\n".join(texts)

        except Exception as e:
            logger.warning(f"OCR.space error: {e}")

        return None

    async def _groq_vision_ocr(self, image_bytes: bytes) -> Optional[str]:
        """Usa Groq Vision como OCR de respaldo."""
        from config import GROQ_API_KEY

        if not GROQ_API_KEY:
            return None

        try:
            b64 = base64.b64encode(image_bytes).decode("utf-8")

            headers = {
                "Authorization": f"Bearer {GROQ_API_KEY}",
                "Content-Type": "application/json",
            }

            payload = {
                "model": "llama-3.2-11b-vision-preview",
                "messages": [
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "text",
                                "text": "Extrae TODO el texto visible en esta imagen. "
                                        "Transcribe exactamente lo que ves, manteniendo "
                                        "el formato y estructura. Solo devuelve el texto, "
                                        "sin explicaciones adicionales.",
                            },
                            {
                                "type": "image_url",
                                "image_url": {"url": f"data:image/jpeg;base64,{b64}"},
                            },
                        ],
                    }
                ],
                "temperature": 0.1,
                "max_tokens": 2048,
            }

            response = requests.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers=headers,
                json=payload,
                timeout=30,
            )

            if response.status_code == 200:
                data = response.json()
                text = data["choices"][0]["message"]["content"].strip()
                if text and len(text) > 5:
                    return text

        except Exception as e:
            logger.warning(f"Groq Vision OCR error: {e}")

        return None

    def get_stats(self) -> Dict:
        return {"extractions": self.extraction_count}
