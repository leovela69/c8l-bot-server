# -*- coding: utf-8 -*-
"""
👁️ VISION — Procesamiento Visual Ultraligero
==============================================
- Análisis de imágenes con Groq Vision
- Detección de objetos (modelo tiny)
- Upscaling con Real-ESRGAN (Replicate)
- Reconocimiento de texto en imágenes
"""

import logging
import base64
import requests
from typing import Optional, Dict, List

logger = logging.getLogger("c8l.nlp.vision")


class VisionProcessor:
    """
    Procesador visual ultraligero.
    Redimensiona antes de enviar para minimizar costes.
    """

    MAX_IMAGE_SIZE = 1024  # Máximo lado en px antes de enviar
    SUPPORTED_FORMATS = ["jpg", "jpeg", "png", "webp", "gif"]

    def __init__(self):
        self.analysis_count = 0

    async def analyze_image(self, image_bytes: bytes,
                            prompt: str = "Describe esta imagen en detalle",
                            language: str = "es") -> Optional[str]:
        """
        Analiza una imagen con Groq Vision (Llama 3.2 Vision).

        Args:
            image_bytes: Bytes de la imagen
            prompt: Pregunta sobre la imagen
            language: Idioma de la respuesta

        Returns:
            Descripción/análisis de la imagen
        """
        from config import GROQ_API_KEY

        if not GROQ_API_KEY:
            return None

        try:
            # Redimensionar si es necesario
            image_bytes = self._resize_if_needed(image_bytes)

            # Encode a base64
            b64_image = base64.b64encode(image_bytes).decode("utf-8")

            headers = {
                "Authorization": f"Bearer {GROQ_API_KEY}",
                "Content-Type": "application/json",
            }

            payload = {
                "model": "llama-3.2-90b-vision-preview",
                "messages": [
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": f"{prompt}. Responde en {language}."},
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/jpeg;base64,{b64_image}"
                                },
                            },
                        ],
                    }
                ],
                "temperature": 0.5,
                "max_tokens": 1024,
            }

            response = requests.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers=headers,
                json=payload,
                timeout=30,
            )

            if response.status_code == 200:
                data = response.json()
                text = data["choices"][0]["message"]["content"]
                self.analysis_count += 1
                logger.info(f"👁️ Vision análisis OK: {len(text)} chars")
                return text
            else:
                logger.warning(f"Vision error: {response.status_code}")
                return None

        except Exception as e:
            logger.error(f"Vision analysis error: {e}")
            return None

    async def extract_text_ocr(self, image_bytes: bytes) -> Optional[str]:
        """
        Extrae texto de una imagen usando OCR.space (gratuito).
        Soporta PDF también.
        """
        try:
            b64_image = base64.b64encode(image_bytes).decode("utf-8")

            payload = {
                "base64Image": f"data:image/png;base64,{b64_image}",
                "language": "spa",
                "isOverlayRequired": False,
                "OCREngine": 2,
            }

            response = requests.post(
                "https://api.ocr.space/parse/image",
                data=payload,
                headers={"apikey": "helloworld"},  # Free API key
                timeout=20,
            )

            if response.status_code == 200:
                data = response.json()
                if data.get("ParsedResults"):
                    text = data["ParsedResults"][0].get("ParsedText", "")
                    if text.strip():
                        logger.info(f"📖 OCR OK: {len(text)} chars")
                        return text.strip()

        except Exception as e:
            logger.error(f"OCR error: {e}")

        return None

    def _resize_if_needed(self, image_bytes: bytes) -> bytes:
        """Redimensiona imagen si excede MAX_IMAGE_SIZE."""
        try:
            from PIL import Image
            import io

            img = Image.open(io.BytesIO(image_bytes))
            w, h = img.size

            if max(w, h) > self.MAX_IMAGE_SIZE:
                ratio = self.MAX_IMAGE_SIZE / max(w, h)
                new_size = (int(w * ratio), int(h * ratio))
                img = img.resize(new_size, Image.LANCZOS)

                # Convertir a JPEG para menor tamaño
                buffer = io.BytesIO()
                if img.mode == "RGBA":
                    img = img.convert("RGB")
                img.save(buffer, format="JPEG", quality=85)
                return buffer.getvalue()

        except Exception as e:
            logger.debug(f"Resize skipped: {e}")

        return image_bytes

    def get_stats(self) -> Dict:
        return {"analyses": self.analysis_count}
