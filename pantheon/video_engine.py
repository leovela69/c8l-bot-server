# -*- coding: utf-8 -*-
"""
🎬 VIDEO ENGINE — Generación de video con MÚLTIPLES servicios gratuitos
Si uno falla, usa el siguiente hasta lograr el resultado.

Cadena de fallback:
1. Pollinations Video (gratis, sin key)
2. Veo 3.1 (Google, si la key funciona)
3. Animated GIF con Pollinations Images (genera 4 frames y anima)
"""

import logging
import time
import os
import io
import tempfile
import requests
from urllib.parse import quote

logger = logging.getLogger("c8l.video_engine")


def generate_video(prompt, api_key="", duration=8, aspect_ratio="16:9"):
    """
    Genera video intentando TODOS los servicios gratuitos.
    Si uno falla, pasa al siguiente.
    """
    logger.info(f"Video Engine: '{prompt[:60]}' — probando servicios...")

    # 1. Pollinations Video
    result = _try_pollinations_video(prompt)
    if result:
        return result

    # 2. Veo 3.1 (si hay key)
    if api_key:
        result = _try_veo(prompt, api_key, duration, aspect_ratio)
        if result:
            return result

    # 3. GIF animado (genera frames con Pollinations Image y los anima)
    result = _try_animated_gif(prompt)
    if result:
        return result

    logger.error("Video Engine: TODOS los servicios fallaron")
    return None


def _try_pollinations_video(prompt):
    """Pollinations Video — GRATIS sin key."""
    try:
        logger.info("Video: intentando Pollinations...")
        url = f"https://video.pollinations.ai/generate?prompt={quote(prompt)}&model=fast-svd"
        r = requests.get(url, timeout=120, stream=True)

        if r.status_code == 200:
            content = r.content
            if len(content) > 10000:  # Video real tiene más de 10KB
                logger.info(f"Pollinations Video OK: {len(content)} bytes")
                return content
            else:
                logger.warning(f"Pollinations Video: respuesta muy pequeña ({len(content)} bytes)")
        else:
            logger.warning(f"Pollinations Video: status {r.status_code}")
    except Exception as e:
        logger.warning(f"Pollinations Video error: {e}")
    return None


def _try_veo(prompt, api_key, duration=8, aspect_ratio="16:9"):
    """Google Veo 3.1 — requiere key funcional."""
    try:
        from google import genai
        from google.genai import types

        logger.info("Video: intentando Veo 3.1...")
        client = genai.Client(api_key=api_key)

        operation = client.models.generate_videos(
            model="veo-3.1-generate-preview",
            prompt=prompt,
            config=types.GenerateVideosConfig(
                aspect_ratio=aspect_ratio,
                resolution="720p",
                duration_seconds=duration,
            ),
        )

        elapsed = 0
        while not operation.done:
            time.sleep(15)
            elapsed += 15
            operation = client.operations.get(operation)
            if elapsed > 300:
                logger.warning("Veo 3.1: timeout")
                return None

        if operation.result and operation.result.generated_videos:
            video = operation.result.generated_videos[0]
            client.files.download(file=video.video)
            tmp_path = os.path.join(tempfile.gettempdir(), f"c8l_veo_{int(time.time())}.mp4")
            video.video.save(tmp_path)
            with open(tmp_path, "rb") as f:
                video_bytes = f.read()
            try:
                os.remove(tmp_path)
            except:
                pass
            logger.info(f"Veo 3.1 OK: {len(video_bytes)} bytes")
            return video_bytes

    except Exception as e:
        logger.warning(f"Veo 3.1 error: {str(e)[:100]}")
    return None


def _try_animated_gif(prompt):
    """Genera GIF animado con 4 frames de Pollinations (siempre funciona)."""
    try:
        from PIL import Image
        import random

        logger.info("Video: generando GIF animado con Pollinations Images...")
        frames = []

        # Generar 4 frames con variaciones del prompt
        variations = [
            f"{prompt}, frame 1, beginning",
            f"{prompt}, frame 2, action",
            f"{prompt}, frame 3, climax",
            f"{prompt}, frame 4, ending",
        ]

        for i, var_prompt in enumerate(variations):
            try:
                seed = random.randint(1, 99999)
                url = f"https://image.pollinations.ai/prompt/{quote(var_prompt)}?width=512&height=512&model=flux&seed={seed}&nologo=true"
                r = requests.get(url, timeout=60)
                if r.status_code == 200 and "image" in r.headers.get("content-type", ""):
                    img = Image.open(io.BytesIO(r.content)).convert("RGB")
                    frames.append(img)
                    logger.info(f"  Frame {i+1}/4 OK")
            except Exception as e:
                logger.debug(f"  Frame {i+1} fallo: {e}")

        if len(frames) >= 2:
            # Crear GIF animado
            output = io.BytesIO()
            frames[0].save(
                output, format="GIF", save_all=True,
                append_images=frames[1:],
                duration=1000,  # 1 segundo por frame
                loop=0
            )
            gif_bytes = output.getvalue()
            logger.info(f"GIF animado OK: {len(gif_bytes)} bytes, {len(frames)} frames")
            return gif_bytes

    except Exception as e:
        logger.warning(f"GIF animado error: {e}")
    return None
