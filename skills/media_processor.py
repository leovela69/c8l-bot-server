# -*- coding: utf-8 -*-
"""
⚡ MEDIA PROCESSOR — Procesador Universal de Media
====================================================
Convierte CUALQUIER formato de Telegram a texto procesable:
- Audio/Voz → Texto (Whisper)
- Video → Frames + Audio → Análisis + Transcripción
- Documentos → Texto extraído
- Stickers/GIFs → Análisis visual
- Ubicación → Info geográfica

Todo se normaliza a texto para pasar al IntentEngine.

Autor: C8L Agency / Leo
"""

import os
import time
import logging
import tempfile
import asyncio
from typing import Optional, Dict, List, Any, Tuple
from dataclasses import dataclass

logger = logging.getLogger("c8l.skills.media")


@dataclass
class MediaResult:
    """Resultado del procesamiento de media."""
    success: bool
    text: str  # Texto extraído/transcrito
    analysis: str = ""  # Análisis visual si aplica
    media_type: str = ""  # audio, video, document, image, sticker, location
    duration_sec: float = 0.0
    file_size_kb: float = 0.0
    metadata: Dict = None

    def __post_init__(self):
        if self.metadata is None:
            self.metadata = {}


class MediaProcessor:
    """
    ⚡ Procesador Universal — Todo formato → Texto inteligente.

    Uso:
        mp = MediaProcessor()
        result = await mp.process_audio(file_path)
        result = await mp.process_video(file_path)
        result = await mp.process_document(file_path, filename)
    """

    # Formatos soportados
    AUDIO_FORMATS = {".ogg", ".mp3", ".wav", ".m4a", ".flac", ".opus", ".aac"}
    VIDEO_FORMATS = {".mp4", ".avi", ".mkv", ".mov", ".webm", ".3gp"}
    DOC_FORMATS = {".pdf", ".docx", ".doc", ".txt", ".md", ".csv", ".json", ".py", ".js", ".html", ".xml"}
    IMAGE_FORMATS = {".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp"}

    def __init__(self):
        self.groq_key = os.environ.get("GROQ_API_KEY", "")
        self.groq_base = os.environ.get("GROQ_BASE_URL", "https://api.groq.com/openai/v1")
        self.whisper_model = os.environ.get("WHISPER_MODEL", "whisper-large-v3-turbo")
        self.vision_model = os.environ.get("GROQ_VISION_MODEL", "llama-3.2-90b-vision-preview")
        self._stats = {
            "audios_processed": 0,
            "videos_processed": 0,
            "documents_processed": 0,
            "images_processed": 0,
            "errors": 0,
        }

    # ===================================================================
    # AUDIO — Transcripción con Whisper
    # ===================================================================

    async def process_audio(self, file_path: str,
                            language: str = "es") -> MediaResult:
        """
        Transcribe audio a texto usando Whisper via Groq.

        Soporta: .ogg, .mp3, .wav, .m4a, .flac, .opus, .aac
        """
        if not self.groq_key:
            return MediaResult(success=False, text="", media_type="audio",
                             analysis="❌ GROQ_API_KEY no configurada")

        try:
            import httpx

            url = f"{self.groq_base}/audio/transcriptions"
            headers = {"Authorization": f"Bearer {self.groq_key}"}

            # Detectar formato
            ext = os.path.splitext(file_path)[1].lower() or ".ogg"
            mime_types = {
                ".ogg": "audio/ogg", ".mp3": "audio/mpeg",
                ".wav": "audio/wav", ".m4a": "audio/m4a",
                ".flac": "audio/flac", ".opus": "audio/opus",
            }
            mime = mime_types.get(ext, "audio/ogg")

            file_size = os.path.getsize(file_path) / 1024  # KB

            async with httpx.AsyncClient(timeout=60) as client:
                with open(file_path, "rb") as audio_file:
                    files = {"file": (f"audio{ext}", audio_file, mime)}
                    data = {
                        "model": self.whisper_model,
                        "language": language,
                        "response_format": "verbose_json",
                    }
                    resp = await client.post(url, headers=headers, files=files, data=data)
                    resp.raise_for_status()
                    result = resp.json()

                    text = result.get("text", "")
                    duration = result.get("duration", 0.0)

                    self._stats["audios_processed"] += 1

                    return MediaResult(
                        success=bool(text),
                        text=text,
                        media_type="audio",
                        duration_sec=duration,
                        file_size_kb=file_size,
                        metadata={
                            "language": result.get("language", language),
                            "segments": len(result.get("segments", [])),
                        },
                    )

        except Exception as e:
            self._stats["errors"] += 1
            logger.error(f"Error procesando audio: {e}")
            return MediaResult(success=False, text="", media_type="audio",
                             analysis=f"Error: {e}")

    # ===================================================================
    # VIDEO — Extraer audio + frames clave
    # ===================================================================

    async def process_video(self, file_path: str,
                            extract_frames: int = 3) -> MediaResult:
        """
        Procesa video: extrae audio (transcribe) + frames clave (analiza).

        Usa FFmpeg para extraer audio y frames.
        """
        results = {
            "transcription": "",
            "frame_analyses": [],
            "duration": 0.0,
        }

        try:
            file_size = os.path.getsize(file_path) / 1024

            # 1. Extraer audio del video
            audio_path = tempfile.mktemp(suffix=".ogg")
            proc = await asyncio.create_subprocess_exec(
                "ffmpeg", "-i", file_path, "-vn", "-acodec", "libopus",
                "-y", audio_path,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
            )
            await proc.wait()

            # Transcribir audio si se extrajo correctamente
            if os.path.exists(audio_path) and os.path.getsize(audio_path) > 100:
                audio_result = await self.process_audio(audio_path)
                if audio_result.success:
                    results["transcription"] = audio_result.text
                    results["duration"] = audio_result.duration_sec

            # Limpiar
            try:
                os.unlink(audio_path)
            except OSError:
                pass

            # 2. Extraer frames clave
            frames_dir = tempfile.mkdtemp()
            # Obtener duración
            probe_proc = await asyncio.create_subprocess_exec(
                "ffprobe", "-v", "error", "-show_entries",
                "format=duration", "-of", "csv=p=0", file_path,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
            )
            stdout, _ = await probe_proc.communicate()
            try:
                duration = float(stdout.decode().strip())
                results["duration"] = duration
            except (ValueError, TypeError):
                duration = 10.0

            # Extraer N frames distribuidos
            interval = max(duration / (extract_frames + 1), 1)
            frame_paths = []
            for i in range(extract_frames):
                timestamp = interval * (i + 1)
                frame_path = os.path.join(frames_dir, f"frame_{i}.jpg")
                proc = await asyncio.create_subprocess_exec(
                    "ffmpeg", "-ss", str(timestamp), "-i", file_path,
                    "-vframes", "1", "-q:v", "2", "-y", frame_path,
                    stdout=asyncio.subprocess.PIPE,
                    stderr=asyncio.subprocess.PIPE,
                )
                await proc.wait()
                if os.path.exists(frame_path):
                    frame_paths.append(frame_path)

            # 3. Analizar primer frame con Vision (los demás solo si es necesario)
            if frame_paths:
                frame_analysis = await self._analyze_frame(frame_paths[0])
                if frame_analysis:
                    results["frame_analyses"].append(frame_analysis)

            # Limpiar frames
            for fp in frame_paths:
                try:
                    os.unlink(fp)
                except OSError:
                    pass
            try:
                os.rmdir(frames_dir)
            except OSError:
                pass

            self._stats["videos_processed"] += 1

            # Construir texto combinado
            text_parts = []
            if results["transcription"]:
                text_parts.append(f"🎤 Audio: {results['transcription']}")
            if results["frame_analyses"]:
                text_parts.append(f"👁️ Visual: {results['frame_analyses'][0]}")

            combined_text = "\n".join(text_parts) if text_parts else ""

            return MediaResult(
                success=bool(combined_text),
                text=results["transcription"],
                analysis=results["frame_analyses"][0] if results["frame_analyses"] else "",
                media_type="video",
                duration_sec=results["duration"],
                file_size_kb=file_size,
                metadata={
                    "frames_extracted": len(frame_paths),
                    "has_audio": bool(results["transcription"]),
                },
            )

        except Exception as e:
            self._stats["errors"] += 1
            logger.error(f"Error procesando video: {e}")
            return MediaResult(success=False, text="", media_type="video",
                             analysis=f"Error: {e}")

    async def _analyze_frame(self, frame_path: str) -> Optional[str]:
        """Analiza un frame con Vision (convierte a base64)."""
        import httpx
        import base64

        if not self.groq_key:
            return None

        try:
            with open(frame_path, "rb") as f:
                img_b64 = base64.b64encode(f.read()).decode()

            url = f"{self.groq_base}/chat/completions"
            headers = {
                "Authorization": f"Bearer {self.groq_key}",
                "Content-Type": "application/json",
            }
            payload = {
                "model": self.vision_model,
                "messages": [{
                    "role": "user",
                    "content": [
                        {"type": "text", "text": "Describe brevemente qué se ve en este frame de video (1-2 frases)."},
                        {"type": "image_url", "image_url": {
                            "url": f"data:image/jpeg;base64,{img_b64}"}},
                    ],
                }],
                "max_tokens": 200,
            }

            async with httpx.AsyncClient(timeout=20) as client:
                resp = await client.post(url, headers=headers, json=payload)
                resp.raise_for_status()
                data = resp.json()
                return data["choices"][0]["message"]["content"]
        except Exception as e:
            logger.error(f"Error analizando frame: {e}")
            return None

    # ===================================================================
    # DOCUMENTOS — Extracción de texto
    # ===================================================================

    async def process_document(self, file_path: str,
                               filename: str = "") -> MediaResult:
        """
        Extrae texto de documentos.

        Soporta: PDF, TXT, MD, CSV, JSON, Python, JS, HTML, XML, DOCX
        """
        ext = os.path.splitext(filename or file_path)[1].lower()
        file_size = os.path.getsize(file_path) / 1024

        try:
            text = ""

            # --- PDF ---
            if ext == ".pdf":
                text = await self._extract_pdf(file_path)

            # --- Text-based files ---
            elif ext in (".txt", ".md", ".csv", ".json", ".py", ".js",
                         ".html", ".xml", ".yaml", ".yml", ".toml",
                         ".sh", ".bat", ".css", ".sql", ".log"):
                with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                    text = f.read()

            # --- DOCX ---
            elif ext in (".docx", ".doc"):
                text = await self._extract_docx(file_path)

            # --- Fallback: intentar leer como texto ---
            else:
                try:
                    with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                        text = f.read()
                except Exception:
                    text = ""

            # Truncar si es muy largo
            if len(text) > 10000:
                text = text[:10000] + "\n\n... (truncado, archivo muy largo)"

            self._stats["documents_processed"] += 1

            return MediaResult(
                success=bool(text),
                text=text,
                media_type="document",
                file_size_kb=file_size,
                metadata={
                    "filename": filename,
                    "extension": ext,
                    "chars": len(text),
                },
            )

        except Exception as e:
            self._stats["errors"] += 1
            logger.error(f"Error procesando documento: {e}")
            return MediaResult(success=False, text="", media_type="document",
                             analysis=f"Error: {e}")

    async def _extract_pdf(self, file_path: str) -> str:
        """Extrae texto de PDF."""
        try:
            # Intentar con pdfplumber (más preciso)
            import pdfplumber
            text_parts = []
            with pdfplumber.open(file_path) as pdf:
                for page in pdf.pages[:20]:  # Máximo 20 páginas
                    page_text = page.extract_text()
                    if page_text:
                        text_parts.append(page_text)
            return "\n\n".join(text_parts)
        except ImportError:
            pass

        try:
            # Fallback: PyPDF2
            from PyPDF2 import PdfReader
            reader = PdfReader(file_path)
            text_parts = []
            for page in reader.pages[:20]:
                text = page.extract_text()
                if text:
                    text_parts.append(text)
            return "\n\n".join(text_parts)
        except ImportError:
            pass

        # Último fallback: leer bytes y buscar texto
        try:
            with open(file_path, "rb") as f:
                content = f.read()
            # Extraer strings legibles
            import re
            texts = re.findall(rb'[\x20-\x7E]{10,}', content)
            return "\n".join(t.decode() for t in texts[:100])
        except Exception:
            return ""

    async def _extract_docx(self, file_path: str) -> str:
        """Extrae texto de DOCX."""
        try:
            from docx import Document
            doc = Document(file_path)
            paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
            return "\n\n".join(paragraphs)
        except ImportError:
            # Fallback: leer como ZIP y extraer texto XML
            import zipfile
            import re
            try:
                with zipfile.ZipFile(file_path) as z:
                    with z.open("word/document.xml") as f:
                        content = f.read().decode()
                # Extraer texto entre tags
                texts = re.findall(r'<w:t[^>]*>([^<]+)</w:t>', content)
                return " ".join(texts)
            except Exception:
                return ""

    # ===================================================================
    # STICKERS / GIFs
    # ===================================================================

    async def process_sticker(self, file_path: str,
                              is_animated: bool = False) -> MediaResult:
        """Analiza sticker/GIF con Vision."""
        if is_animated:
            # Para stickers animados, solo describir tipo
            return MediaResult(
                success=True,
                text="[Sticker animado]",
                media_type="sticker",
                metadata={"animated": True},
            )

        # Sticker estático — analizar con Vision
        analysis = await self._analyze_frame(file_path)
        self._stats["images_processed"] += 1

        return MediaResult(
            success=bool(analysis),
            text=analysis or "[Sticker]",
            analysis=analysis or "",
            media_type="sticker",
            metadata={"animated": False},
        )

    # ===================================================================
    # UBICACIÓN
    # ===================================================================

    async def process_location(self, latitude: float,
                               longitude: float) -> MediaResult:
        """Procesa ubicación: obtiene info del lugar + clima."""
        import httpx

        try:
            # Reverse geocoding
            async with httpx.AsyncClient(timeout=10) as client:
                # Nominatim reverse
                geo_resp = await client.get(
                    "https://nominatim.openstreetmap.org/reverse",
                    params={"lat": latitude, "lon": longitude, "format": "json"},
                    headers={"User-Agent": "C8L-Bot/1.0"},
                )
                geo_data = geo_resp.json()
                place_name = geo_data.get("display_name", f"{latitude}, {longitude}")

                # Clima
                weather_resp = await client.get(
                    "https://api.open-meteo.com/v1/forecast",
                    params={
                        "latitude": latitude, "longitude": longitude,
                        "current_weather": "true",
                    },
                )
                weather = weather_resp.json().get("current_weather", {})
                temp = weather.get("temperature", "?")
                wind = weather.get("windspeed", "?")

            text = (
                f"📍 {place_name}\n"
                f"🌡️ {temp}°C | 💨 {wind} km/h"
            )

            return MediaResult(
                success=True,
                text=text,
                media_type="location",
                metadata={"lat": latitude, "lon": longitude, "place": place_name},
            )

        except Exception as e:
            return MediaResult(
                success=True,
                text=f"📍 Ubicación: {latitude}, {longitude}",
                media_type="location",
                analysis=f"Error obteniendo info: {e}",
            )

    # ===================================================================
    # STATS
    # ===================================================================

    def get_stats(self) -> Dict[str, Any]:
        return {**self._stats}

    def get_stats_text(self) -> str:
        s = self._stats
        total = sum(s.values()) - s["errors"]
        return (
            f"📦 *Media Processor*\n"
            f"🎤 Audios: {s['audios_processed']}\n"
            f"🎬 Videos: {s['videos_processed']}\n"
            f"📄 Documentos: {s['documents_processed']}\n"
            f"🖼️ Imágenes: {s['images_processed']}\n"
            f"📊 Total: {total}\n"
            f"❌ Errores: {s['errors']}"
        )


# ---------------------------------------------------------------------------
# Singleton
# ---------------------------------------------------------------------------
_processor_instance: Optional[MediaProcessor] = None


def get_media_processor() -> MediaProcessor:
    """Obtiene la instancia global del Media Processor."""
    global _processor_instance
    if _processor_instance is None:
        _processor_instance = MediaProcessor()
    return _processor_instance
