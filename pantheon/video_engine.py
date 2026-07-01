# -*- coding: utf-8 -*-
"""
🎬 VIDEO ENGINE v3.0 — Multi-Motor Inteligente
Genera videos REALES usando Pollinations API (gen.pollinations.ai)

Modelos disponibles (TODOS GRATUITOS sin key):
- veo: Google Veo (alta calidad, 4-8s) — MEJOR para cinematico
- seedance-pro: ByteDance (alta calidad, 2-10s) — MEJOR para movimiento
- seedance-2.0: ByteDance v2 (4-15s) — MEJOR para duracion larga
- wan: Alibaba Wan (2-15s, con audio) — MEJOR para audio integrado
- wan-fast: Wan rapido (2-15s) — MEJOR balance velocidad/calidad
- wan-pro: Wan premium (2-15s) — Alta calidad
- wan-pro-1080p: Wan 1080p — MEJOR resolucion
- grok-video-pro: xAI Grok Video — Creativo/artistico
- ltx-2: LTX Video (rapido) — MEJOR para prototipos rapidos
- nova-reel: Amazon Nova (6-120s) — MEJOR para videos largos
- p-video-720p: Video general 720p
- p-video-1080p: Video general 1080p

Estrategia:
1. Zeus/Ares analiza el prompt y decide el MEJOR modelo
2. Si falla → intenta con el siguiente en la cadena de fallback
3. Si todo falla → genera GIF animado con frames de imagen
4. SIEMPRE entrega algo al usuario
"""

import logging
import time
import io
import os
import random
import requests
import threading
from urllib.parse import quote

logger = logging.getLogger("c8l.video_engine")

# Import API keys
try:
    from config import POLLINATIONS_API_KEY_P, HUGGINGFACE_TOKEN, AGNES_API_KEY
except ImportError:
    POLLINATIONS_API_KEY_P = ""
    HUGGINGFACE_TOKEN = ""
    AGNES_API_KEY = ""

# ---------------------------------------------------------------------------
# CONFIGURACION DE MODELOS
# ---------------------------------------------------------------------------

# Modelos ordenados por prioridad/calidad
VIDEO_MODELS = {
    "wan-fast": {
        "name": "Wan Fast",
        "description": "Rapido y bueno, con audio",
        "duration_range": (2, 15),
        "default_duration": 5,
        "has_audio": True,
        "best_for": ["general", "musica", "rapido"],
        "quality": 7,
        "speed": 9,
    },
    "veo": {
        "name": "Google Veo",
        "description": "Maxima calidad cinematica",
        "duration_range": (4, 8),
        "default_duration": 6,
        "has_audio": True,
        "best_for": ["cinematico", "profesional", "alta_calidad", "paisaje"],
        "quality": 10,
        "speed": 4,
    },
    "seedance-pro": {
        "name": "Seedance Pro",
        "description": "Excelente movimiento y dinamismo",
        "duration_range": (2, 10),
        "default_duration": 5,
        "has_audio": False,
        "best_for": ["movimiento", "danza", "accion", "dinamico"],
        "quality": 9,
        "speed": 6,
    },
    "seedance-2.0": {
        "name": "Seedance 2.0",
        "description": "Videos mas largos con calidad",
        "duration_range": (4, 15),
        "default_duration": 8,
        "has_audio": False,
        "best_for": ["largo", "narrativo", "historia"],
        "quality": 8,
        "speed": 5,
    },
    "wan": {
        "name": "Wan Standard",
        "description": "Balanceado con audio incluido",
        "duration_range": (2, 15),
        "default_duration": 5,
        "has_audio": True,
        "best_for": ["audio", "sonido", "musica", "general"],
        "quality": 7,
        "speed": 7,
    },
    "wan-pro": {
        "name": "Wan Pro",
        "description": "Alta calidad con audio",
        "duration_range": (2, 15),
        "default_duration": 6,
        "has_audio": True,
        "best_for": ["premium", "alta_calidad", "profesional"],
        "quality": 9,
        "speed": 5,
    },
    "wan-pro-1080p": {
        "name": "Wan Pro 1080p",
        "description": "Maxima resolucion 1080p",
        "duration_range": (2, 15),
        "default_duration": 5,
        "has_audio": True,
        "best_for": ["hd", "1080p", "alta_resolucion", "profesional"],
        "quality": 9,
        "speed": 4,
    },
    "grok-video-pro": {
        "name": "Grok Video Pro",
        "description": "Creativo y artistico (xAI)",
        "duration_range": (4, 8),
        "default_duration": 5,
        "has_audio": False,
        "best_for": ["creativo", "artistico", "abstracto", "experimental"],
        "quality": 8,
        "speed": 6,
    },
    "ltx-2": {
        "name": "LTX Video 2",
        "description": "Ultra rapido para prototipos",
        "duration_range": (3, 8),
        "default_duration": 4,
        "has_audio": False,
        "best_for": ["rapido", "prototipo", "test", "preview"],
        "quality": 6,
        "speed": 10,
    },
    "nova-reel": {
        "name": "Amazon Nova Reel",
        "description": "Videos largos hasta 2 min",
        "duration_range": (6, 120),
        "default_duration": 12,
        "has_audio": False,
        "best_for": ["largo", "narrativo", "documental", "presentacion"],
        "quality": 7,
        "speed": 3,
    },
    "p-video-720p": {
        "name": "P-Video 720p",
        "description": "Video general 720p",
        "duration_range": (3, 10),
        "default_duration": 5,
        "has_audio": False,
        "best_for": ["general", "fallback"],
        "quality": 6,
        "speed": 7,
    },
    "p-video-1080p": {
        "name": "P-Video 1080p",
        "description": "Video general 1080p",
        "duration_range": (3, 10),
        "default_duration": 5,
        "has_audio": False,
        "best_for": ["general", "hd", "fallback"],
        "quality": 7,
        "speed": 6,
    },
}

# Cadena de fallback (modelos rapidos primero para Render)
FALLBACK_CHAIN = [
    "ltx-2", "wan-fast", "p-video-720p", "wan",
    "seedance-pro", "veo", "seedance-2.0",
    "grok-video-pro", "wan-pro", "p-video-1080p", "nova-reel"
]

# Pollinations API base
POLLINATIONS_VIDEO_URL = "https://gen.pollinations.ai/video"


# ---------------------------------------------------------------------------
# CLASE PRINCIPAL
# ---------------------------------------------------------------------------

class VideoEngine:
    """
    Motor de video inteligente multi-modelo.
    Analiza el prompt, elige el mejor modelo, genera el video.
    Si falla, intenta con el siguiente hasta entregar resultado.
    """

    def __init__(self):
        self.generations_count = 0
        self.last_model_used = None
        self.last_generation_time = 0

    def generate(self, prompt, preferred_model=None, duration=None,
                 aspect_ratio="16:9", image_url=None, with_audio=None):
        """
        Genera un video a partir de un prompt.

        Args:
            prompt: Descripcion del video a generar
            preferred_model: Modelo preferido (None = auto-seleccion)
            duration: Duracion en segundos (None = auto)
            aspect_ratio: "16:9" o "9:16"
            image_url: URL de imagen para Image-to-Video (opcional)
            with_audio: True/False/None(auto) — generar audio

        Returns:
            dict: {
                "video_bytes": bytes,  # El video MP4
                "model_used": str,     # Que modelo lo genero
                "duration": int,       # Duracion real
                "format": "mp4"|"gif", # Formato del archivo
                "has_audio": bool,     # Si incluye audio
                "attempts": int,       # Cuantos intentos necesito
            }
            O None si todo fallo.
        """
        logger.info(f"🎬 VideoEngine: '{prompt[:80]}' | model={preferred_model} | dur={duration}")

        # 1. Mejorar prompt para generacion de video
        enhanced_prompt = self._enhance_video_prompt(prompt)

        # ============================================================
        # AGNES AI — Motor PRINCIPAL (gratis, ilimitado, sin censura)
        # ============================================================
        logger.info("  🎬 Intentando Agnes AI (gratis, ilimitado)...")
        agnes_bytes = self._try_agnes(enhanced_prompt, duration)
        if agnes_bytes:
            self.generations_count += 1
            self.last_model_used = "agnes"
            self.last_generation_time = time.time()
            return {
                "video_bytes": agnes_bytes,
                "model_used": "agnes",
                "model_name": "Agnes AI v2.0",
                "duration": duration or 5,
                "format": "mp4",
                "has_audio": True,
                "attempts": 1,
            }

        # 2. Determinar modelo optimo si no se especifico
        if preferred_model and preferred_model in VIDEO_MODELS:
            model_order = [preferred_model] + [m for m in FALLBACK_CHAIN if m != preferred_model]
        else:
            model_order = self._select_best_models(prompt, with_audio)

        # 3. Intentar cada modelo en orden
        attempts = 0
        for model_id in model_order:
            attempts += 1
            model_info = VIDEO_MODELS[model_id]

            # Calcular duracion optima para este modelo
            model_duration = self._get_optimal_duration(duration, model_info)

            # Determinar si pedir audio
            request_audio = False
            if model_info["has_audio"]:
                if with_audio is True:
                    request_audio = True
                elif with_audio is None:
                    # Auto: si el prompt menciona sonido/musica, activar
                    request_audio = self._wants_audio(prompt)

            logger.info(f"  Intento {attempts}: {model_info['name']} ({model_id}) | {model_duration}s | audio={request_audio}")

            video_bytes = self._call_pollinations(
                prompt=enhanced_prompt,
                model=model_id,
                duration=model_duration,
                aspect_ratio=aspect_ratio,
                image_url=image_url,
                audio=request_audio,
            )

            if video_bytes == "AUTH_REQUIRED":
                # Pollinations ahora requiere API key — skip TODOS los modelos
                logger.warning("  🔒 Pollinations requiere API key — saltando directo a fallbacks")
                break

            if video_bytes:
                self.generations_count += 1
                self.last_model_used = model_id
                self.last_generation_time = time.time()

                logger.info(f"  ✅ Video generado con {model_info['name']} ({len(video_bytes)} bytes, {attempts} intentos)")
                return {
                    "video_bytes": video_bytes,
                    "model_used": model_id,
                    "model_name": model_info["name"],
                    "duration": model_duration,
                    "format": "mp4",
                    "has_audio": request_audio and model_info["has_audio"],
                    "attempts": attempts,
                }
            else:
                logger.warning(f"  ❌ {model_info['name']} fallo, siguiente...")

        # 4. Intentar HuggingFace (gratis, ilimitado)
        logger.info("  🤗 Intentando HuggingFace Inference (gratis)...")
        hf_bytes = self._try_huggingface_video(enhanced_prompt)
        if hf_bytes:
            self.generations_count += 1
            return {
                "video_bytes": hf_bytes,
                "model_used": "huggingface",
                "model_name": "HuggingFace LTX/Wan",
                "duration": 5,
                "format": "mp4",
                "has_audio": False,
                "attempts": attempts + 1,
            }

        # 5. Slideshow MP4 con FFmpeg (SIEMPRE funciona, rápido)
        logger.info("  📸 Generando slideshow MP4 (imágenes paralelas + FFmpeg)...")
        slide_bytes = self._generate_slideshow_mp4(enhanced_prompt)
        if slide_bytes:
            self.generations_count += 1
            fmt = "mp4" if slide_bytes[:4] != b"GIF8" else "gif"
            return {
                "video_bytes": slide_bytes,
                "model_used": "slideshow_ffmpeg",
                "model_name": "Slideshow Cinematico",
                "duration": 8,
                "format": fmt,
                "has_audio": False,
                "attempts": attempts + 2,
            }

        logger.error("  💀 VideoEngine: TODOS los metodos fallaron")
        return None

    # ---------------------------------------------------------------------------
    # SELECCION INTELIGENTE DE MODELO
    # ---------------------------------------------------------------------------

    def _select_best_models(self, prompt, with_audio=None):
        """
        Analiza el prompt y devuelve la lista de modelos ordenada
        del mejor al peor para esta peticion especifica.
        """
        t = prompt.lower()
        scores = {}

        for model_id, info in VIDEO_MODELS.items():
            score = info["quality"] * 2 + info["speed"]  # Base: calidad pesa mas

            # Bonus por match con "best_for"
            for tag in info["best_for"]:
                if tag in t:
                    score += 15

            # Bonus contextuales
            if any(kw in t for kw in ["rapido", "quick", "fast", "preview", "test"]):
                score += info["speed"] * 2

            if any(kw in t for kw in ["cinematico", "cine", "pelicula", "film", "cinematic",
                                       "profesional", "premium", "calidad"]):
                score += info["quality"] * 2

            if any(kw in t for kw in ["baile", "danza", "dance", "movimiento", "accion",
                                       "correr", "saltar", "pelea", "fight"]):
                if "seedance" in model_id:
                    score += 20

            if any(kw in t for kw in ["musica", "music", "cancion", "sonido", "audio",
                                       "ritmo", "beat", "bolero"]):
                if info["has_audio"]:
                    score += 15

            if any(kw in t for kw in ["largo", "long", "historia", "narrativa", "documental"]):
                max_dur = info["duration_range"][1]
                score += min(max_dur, 30)  # Bonus por duracion maxima

            if any(kw in t for kw in ["hd", "1080", "alta resolucion", "high res"]):
                if "1080" in model_id or "pro" in model_id:
                    score += 15

            if any(kw in t for kw in ["abstracto", "arte", "artistico", "experimental",
                                       "creativo", "surrealista"]):
                if "grok" in model_id:
                    score += 20

            if any(kw in t for kw in ["paisaje", "landscape", "naturaleza", "nature",
                                       "atardecer", "sunset", "oceano", "montaña"]):
                if model_id == "veo":
                    score += 15

            # Si el usuario pidio audio explicitamente
            if with_audio is True and info["has_audio"]:
                score += 20
            elif with_audio is True and not info["has_audio"]:
                score -= 30  # Penalizar modelos sin audio si se pidio

            scores[model_id] = score

        # Ordenar de mayor a menor score
        sorted_models = sorted(scores.keys(), key=lambda m: scores[m], reverse=True)
        logger.info(f"  Ranking modelos: {[(m, scores[m]) for m in sorted_models[:5]]}")
        return sorted_models

    def _get_optimal_duration(self, requested_duration, model_info):
        """Calcula la duracion optima respetando limites del modelo."""
        min_dur, max_dur = model_info["duration_range"]

        if requested_duration:
            # Clamp al rango del modelo
            return max(min_dur, min(requested_duration, max_dur))
        else:
            return model_info["default_duration"]

    def _wants_audio(self, prompt):
        """Detecta si el usuario quiere audio en el video."""
        t = prompt.lower()
        audio_keywords = ["musica", "music", "sonido", "sound", "audio",
                         "cancion", "song", "ritmo", "beat", "voz", "voice",
                         "habla", "speak", "canta", "sing", "bolero",
                         "con sonido", "con audio", "con musica"]
        return any(kw in t for kw in audio_keywords)

    # ---------------------------------------------------------------------------
    # ENHANCER DE PROMPTS PARA VIDEO
    # ---------------------------------------------------------------------------

    def _enhance_video_prompt(self, prompt):
        """
        Mejora el prompt del usuario para generacion de video.
        Traduce a ingles si esta en español y agrega descriptores cinematicos.
        """
        t = prompt.lower()

        # Si ya esta en ingles (tiene palabras clave en ingles), no traducir mucho
        english_indicators = ["the", "and", "with", "create", "make", "generate",
                            "scene", "video", "animation", "cinematic"]
        is_english = sum(1 for w in english_indicators if w in t) >= 2

        if is_english:
            enhanced = prompt
        else:
            # Traducir conceptos clave español → ingles
            enhanced = self._translate_prompt(prompt)

        # Agregar descriptores cinematicos si no los tiene
        if not any(kw in enhanced.lower() for kw in ["cinematic", "4k", "hd", "realistic",
                                                      "professional", "smooth", "dynamic"]):
            enhanced += ", cinematic quality, smooth motion, professional lighting"

        # Limpiar
        enhanced = enhanced.strip()
        if len(enhanced) > 500:
            enhanced = enhanced[:500]

        return enhanced

    def _translate_prompt(self, prompt):
        """Traduccion basica español → ingles para prompts de video."""
        # Diccionario de traduccion rapida para conceptos comunes
        translations = {
            "gato": "cat", "perro": "dog", "persona": "person",
            "hombre": "man", "mujer": "woman", "niño": "child",
            "ciudad": "city", "playa": "beach", "montaña": "mountain",
            "oceano": "ocean", "bosque": "forest", "desierto": "desert",
            "espacio": "space", "galaxia": "galaxy", "luna": "moon",
            "sol": "sun", "estrella": "star", "noche": "night",
            "dia": "day", "atardecer": "sunset", "amanecer": "sunrise",
            "lluvia": "rain", "nieve": "snow", "fuego": "fire",
            "agua": "water", "viento": "wind", "tormenta": "storm",
            "carro": "car", "avion": "airplane", "barco": "ship",
            "robot": "robot", "dragon": "dragon", "leon": "lion",
            "aguila": "eagle", "lobo": "wolf", "caballo": "horse",
            "bailando": "dancing", "corriendo": "running",
            "volando": "flying", "nadando": "swimming",
            "caminando": "walking", "peleando": "fighting",
            "cantando": "singing", "tocando": "playing music",
            "cocinando": "cooking", "pintando": "painting",
            "explotar": "exploding", "caer": "falling",
            "hermoso": "beautiful", "oscuro": "dark",
            "brillante": "bright", "magico": "magical",
            "epico": "epic", "dramatico": "dramatic",
            "tranquilo": "peaceful", "misterioso": "mysterious",
            "futurista": "futuristic", "retro": "retro",
            "neon": "neon", "dorado": "golden",
            "cinematico": "cinematic", "lento": "slow motion",
            "rapido": "fast", "camara lenta": "slow motion",
            "primer plano": "close up", "plano general": "wide shot",
            "timelapse": "timelapse", "drone": "aerial drone shot",
            "bajo el agua": "underwater", "en el cielo": "in the sky",
            "hazme": "create", "genera": "generate", "crea": "create",
            "un video de": "a video of", "video de": "video of",
            "quiero": "I want", "dame": "give me",
            "con musica": "with music", "con sonido": "with sound",
        }

        result = prompt
        for es, en in translations.items():
            if es in result.lower():
                # Reemplazar manteniendo el caso general
                import re
                result = re.sub(re.escape(es), en, result, flags=re.IGNORECASE)

        return result

    # ---------------------------------------------------------------------------
    # LLAMADA A POLLINATIONS API
    # ---------------------------------------------------------------------------

    def _call_pollinations(self, prompt, model, duration, aspect_ratio="16:9",
                           image_url=None, audio=False):
        """
        Llama a la API de Pollinations para generar video.

        Endpoint: GET https://gen.pollinations.ai/video/{prompt}
        Params: model, duration, aspectRatio, audio, image, width, height
        NOTA: NO enviar seed ni width/height custom → causa 401 sin API key
        """
        try:
            # Codificar prompt para URL
            encoded_prompt = quote(prompt, safe='')

            # Construir URL
            url = f"{POLLINATIONS_VIDEO_URL}/{encoded_prompt}"

            # Parametros MINIMOS (sin seed, sin width/height custom)
            params = {
                "model": model,
                "duration": duration,
            }

            # Siempre enviar key (ahora es obligatoria)
            if POLLINATIONS_API_KEY_P:
                params["key"] = POLLINATIONS_API_KEY_P

            # Audio (solo para modelos que lo soportan)
            if audio:
                params["audio"] = "true"

            # Image-to-Video (si se proporciona imagen de referencia)
            if image_url:
                params["image"] = image_url

            logger.info(f"  Pollinations API: model={model}, dur={duration}s, aspect={aspect_ratio}")

            # Timeout: 120s en Render Free (el servicio puede morir con más)
            timeout = 120

            r = requests.get(url, params=params, timeout=timeout, stream=True)

            if r.status_code == 200:
                content_type = r.headers.get("content-type", "")
                if "video" in content_type or "octet-stream" in content_type:
                    # Leer todo el contenido
                    video_bytes = b""
                    for chunk in r.iter_content(chunk_size=1024 * 1024):  # 1MB chunks
                        video_bytes += chunk

                    if len(video_bytes) > 50000:  # Video real > 50KB
                        logger.info(f"  ✅ Pollinations OK: {len(video_bytes)} bytes ({model})")
                        return video_bytes
                    else:
                        logger.warning(f"  Pollinations: respuesta muy pequeña ({len(video_bytes)} bytes)")
                        return None
                else:
                    logger.warning(f"  Pollinations: content-type inesperado: {content_type}")
                    # Puede ser un error JSON
                    try:
                        error_data = r.json()
                        logger.warning(f"  Pollinations error: {error_data}")
                    except:
                        pass
                    return None
            elif r.status_code == 401:
                logger.warning(f"  Pollinations 401: modelo {model} requiere API key")
                return "AUTH_REQUIRED"
            elif r.status_code == 402:
                logger.warning(f"  Pollinations 402: balance agotado para {model}")
                return None
            elif r.status_code == 422:
                logger.warning(f"  Pollinations 422: prompt rechazado o parametros invalidos")
                return None
            elif r.status_code == 429:
                logger.warning(f"  Pollinations 429: rate limited, esperando...")
                time.sleep(10)
                return None
            elif r.status_code == 503:
                logger.warning(f"  Pollinations 503: servicio no disponible temporalmente")
                return None
            else:
                logger.warning(f"  Pollinations: status {r.status_code}")
                return None

        except requests.Timeout:
            logger.warning(f"  Pollinations timeout ({model}) — video tardo demasiado")
            return None
        except Exception as e:
            logger.warning(f"  Pollinations error ({model}): {str(e)[:150]}")
            return None

    # ---------------------------------------------------------------------------
    # FALLBACK: GIF ANIMADO
    # ---------------------------------------------------------------------------

    def _generate_animated_gif(self, prompt):
        """
        Ultimo recurso: genera GIF animado con 4-6 frames de Pollinations Images.
        La API de IMAGENES sí funciona sin key (a diferencia de video).
        """
        try:
            from PIL import Image

            logger.info("  Generando GIF animado (fallback)...")
            frames = []

            # Generar 4 frames con variaciones
            frame_prompts = [
                f"{prompt}, establishing shot, beginning of sequence",
                f"{prompt}, action building, dynamic composition",
                f"{prompt}, peak moment, dramatic lighting",
                f"{prompt}, resolution, cinematic ending",
            ]

            for i, frame_prompt in enumerate(frame_prompts):
                try:
                    encoded = quote(frame_prompt, safe='')
                    # URL de IMAGEN (funciona sin key, sin seed)
                    url = f"https://gen.pollinations.ai/image/{encoded}?width=640&height=360&model=flux&nologo=true"

                    r = requests.get(url, timeout=60)
                    if r.status_code == 200:
                        ct = r.headers.get("content-type", "")
                        if "image" in ct:
                            img = Image.open(io.BytesIO(r.content)).convert("RGB")
                            frames.append(img)
                            logger.info(f"    Frame {i+1}/4 OK")
                    else:
                        logger.debug(f"    Frame {i+1} status: {r.status_code}")
                except Exception as e:
                    logger.debug(f"    Frame {i+1} fallo: {e}")

            if len(frames) >= 2:
                output = io.BytesIO()
                frames[0].save(
                    output, format="GIF", save_all=True,
                    append_images=frames[1:],
                    duration=1200,  # 1.2s por frame
                    loop=0
                )
                gif_bytes = output.getvalue()
                logger.info(f"  GIF OK: {len(gif_bytes)} bytes, {len(frames)} frames")
                return gif_bytes

        except ImportError:
            logger.warning("  GIF fallback requiere Pillow (PIL)")
        except Exception as e:
            logger.warning(f"  GIF fallback error: {e}")
        return None

    # ---------------------------------------------------------------------------
    # MOTOR 0: AGNES AI (GRATIS, ILIMITADO, SIN CENSURA) — PRIMARIO
    # ---------------------------------------------------------------------------

    def _try_agnes(self, prompt, duration=None):
        """
        Genera video con Agnes AI — GRATIS, ilimitado, sin censura.
        API asíncrona: submit → poll → download.
        """
        if not AGNES_API_KEY:
            return None

        dur = duration or 5
        headers = {
            "Authorization": f"Bearer {AGNES_API_KEY}",
            "Content-Type": "application/json"
        }

        try:
            # 1. Submit video generation
            payload = {
                "model": "agnes-video-v2.0",
                "prompt": prompt,
                "duration": min(dur, 15),
            }
            r = requests.post("https://apihub.agnes-ai.com/v1/videos",
                            headers=headers, json=payload, timeout=30)

            if r.status_code not in (200, 201):
                logger.warning(f"  Agnes submit error: {r.status_code}")
                return None

            data = r.json()
            task_id = data.get("task_id") or data.get("id")
            if not task_id:
                logger.warning(f"  Agnes: no task_id in response")
                return None

            logger.info(f"  Agnes: video queued (task={task_id})")

            # 2. Poll for completion (max 60s)
            for _ in range(12):  # 12 * 5s = 60s
                time.sleep(5)
                poll_r = requests.get(
                    f"https://apihub.agnes-ai.com/v1/videos/{task_id}",
                    headers=headers, timeout=15
                )
                if poll_r.status_code != 200:
                    continue

                status_data = poll_r.json()
                status = status_data.get("status", "")

                if status == "completed":
                    # 3. Download video
                    video_url = status_data.get("video_url") or status_data.get("url")
                    if video_url:
                        video_r = requests.get(video_url, timeout=60)
                        if video_r.status_code == 200 and len(video_r.content) > 50000:
                            logger.info(f"  ✅ Agnes video OK: {len(video_r.content)} bytes")
                            return video_r.content
                    # Try getting from result field
                    result = status_data.get("result", {})
                    if isinstance(result, dict):
                        video_url = result.get("video_url") or result.get("url")
                        if video_url:
                            video_r = requests.get(video_url, timeout=60)
                            if video_r.status_code == 200 and len(video_r.content) > 50000:
                                logger.info(f"  ✅ Agnes video OK: {len(video_r.content)} bytes")
                                return video_r.content
                    logger.warning("  Agnes: completed but no video URL found")
                    return None

                elif status == "failed":
                    error = status_data.get("error", "Unknown")
                    logger.warning(f"  Agnes failed: {error}")
                    return None

                # Still processing...
                progress = status_data.get("progress", 0)
                if progress > 0:
                    logger.info(f"  Agnes: {progress}% ...")

            logger.warning("  Agnes: timeout (60s) — cola lenta, intentando fallbacks")
            return None

        except Exception as e:
            logger.warning(f"  Agnes error: {str(e)[:100]}")
            return None

    # ---------------------------------------------------------------------------
    # MOTOR 2: HUGGINGFACE (GRATIS, ILIMITADO)
    # ---------------------------------------------------------------------------

    def _try_huggingface_video(self, prompt):
        """Genera video con HuggingFace Inference API (gratis con token)."""
        if not HUGGINGFACE_TOKEN:
            return None

        models = ["Lightricks/LTX-Video", "Wan-AI/Wan2.1-T2V-1.3B"]
        for model in models:
            try:
                logger.info(f"  HuggingFace: {model}...")
                url = f"https://api-inference.huggingface.co/models/{model}"
                headers = {"Authorization": f"Bearer {HUGGINGFACE_TOKEN}"}
                r = requests.post(url, headers=headers, json={"inputs": prompt}, timeout=120)
                if r.status_code == 200 and len(r.content) > 50000:
                    logger.info(f"  ✅ HuggingFace OK: {len(r.content)} bytes")
                    return r.content
            except:
                pass
        return None

    # ---------------------------------------------------------------------------
    # MOTOR 3: SLIDESHOW MP4 (ILIMITADO, RÁPIDO, SIEMPRE FUNCIONA)
    # ---------------------------------------------------------------------------

    def _generate_slideshow_mp4(self, prompt):
        """
        Video MP4 real: 4 imágenes en PARALELO + FFmpeg con transiciones.
        Imágenes de Pollinations = GRATIS ILIMITADO.
        SIEMPRE funciona. Tarda ~20-40 seg.
        """
        import subprocess
        import tempfile

        # Generar 4 frames EN PARALELO
        frame_prompts = [
            f"{prompt}, wide establishing shot, cinematic lighting, 4k",
            f"{prompt}, medium shot, action, dynamic angle, cinematic",
            f"{prompt}, close up, dramatic moment, detailed, cinematic",
            f"{prompt}, wide shot, resolution, golden hour, cinematic ending",
        ]

        frames = [None] * 4
        threads = []

        def _fetch(idx, fp):
            try:
                encoded = quote(fp, safe='')
                url = f"https://gen.pollinations.ai/image/{encoded}?width=1280&height=720&model=flux&nologo=true"
                r = requests.get(url, timeout=45)
                if r.status_code == 200 and "image" in r.headers.get("content-type", ""):
                    frames[idx] = r.content
                    logger.info(f"    Frame {idx+1}/4 OK")
            except:
                pass

        for i, fp in enumerate(frame_prompts):
            t = threading.Thread(target=_fetch, args=(i, fp))
            threads.append(t)
            t.start()

        for t in threads:
            t.join(timeout=50)

        valid = [f for f in frames if f]
        if len(valid) < 2:
            return self._generate_animated_gif(prompt)

        # FFmpeg: unir frames en video MP4
        tmp_dir = tempfile.mkdtemp(prefix="c8l_")
        try:
            for i, fb in enumerate(valid):
                with open(os.path.join(tmp_dir, f"f_{i:03d}.jpg"), "wb") as f:
                    f.write(fb)

            out = os.path.join(tmp_dir, "out.mp4")
            cmd = ["ffmpeg", "-y", "-framerate", "0.5",
                   "-i", os.path.join(tmp_dir, "f_%03d.jpg"),
                   "-c:v", "libx264", "-preset", "fast", "-pix_fmt", "yuv420p",
                   "-vf", "fps=24,scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2",
                   "-movflags", "+faststart", out]

            res = subprocess.run(cmd, capture_output=True, timeout=30)
            if res.returncode == 0 and os.path.exists(out):
                with open(out, "rb") as f:
                    video_bytes = f.read()
                if len(video_bytes) > 5000:
                    import shutil; shutil.rmtree(tmp_dir, ignore_errors=True)
                    logger.info(f"  ✅ Slideshow MP4: {len(video_bytes)} bytes")
                    return video_bytes

            import shutil; shutil.rmtree(tmp_dir, ignore_errors=True)
        except Exception as e:
            logger.warning(f"  Slideshow error: {e}")
            try:
                import shutil; shutil.rmtree(tmp_dir, ignore_errors=True)
            except: pass

        return self._generate_animated_gif(prompt)

    # ---------------------------------------------------------------------------
    # UTILIDADES
    # ---------------------------------------------------------------------------

    def get_status(self):
        """Devuelve estado del engine."""
        return {
            "total_generations": self.generations_count,
            "last_model": self.last_model_used,
            "last_time": self.last_generation_time,
            "models_available": len(VIDEO_MODELS),
        }

    def list_models(self):
        """Lista todos los modelos disponibles con info."""
        lines = ["🎬 **MODELOS DE VIDEO DISPONIBLES:**\n"]
        for model_id, info in VIDEO_MODELS.items():
            audio_icon = "🔊" if info["has_audio"] else "🔇"
            dur = f"{info['duration_range'][0]}-{info['duration_range'][1]}s"
            lines.append(
                f"• **{info['name']}** ({model_id})\n"
                f"  {info['description']} | {dur} | {audio_icon}\n"
                f"  Calidad: {'⭐' * min(info['quality'], 10)} | Velocidad: {'⚡' * min(info['speed'], 10)}\n"
            )
        return "\n".join(lines)


# ---------------------------------------------------------------------------
# INSTANCIA GLOBAL
# ---------------------------------------------------------------------------
video_engine = VideoEngine()


# ---------------------------------------------------------------------------
# FUNCION LEGACY (compatibilidad con codigo existente)
# ---------------------------------------------------------------------------
def generate_video(prompt, api_key="", duration=8, aspect_ratio="16:9"):
    """
    Funcion legacy — llama al nuevo VideoEngine.
    Mantiene compatibilidad con codigo que ya usaba generate_video().
    """
    result = video_engine.generate(
        prompt=prompt,
        duration=duration,
        aspect_ratio=aspect_ratio,
        with_audio=True,
    )
    if result:
        return result["video_bytes"]
    return None
