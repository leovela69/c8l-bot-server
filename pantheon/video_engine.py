# -*- coding: utf-8 -*-
"""
🎬 VIDEO ENGINE — Generación de video con Veo 3.1
Usa la misma API key de Google AI Studio que las imágenes.
10 videos gratis/mes. 8 segundos, 720p, con audio generado.
"""

import logging
import time
import os
import tempfile

logger = logging.getLogger("c8l.video_engine")


def generate_video(prompt, api_key, duration=8, aspect_ratio="16:9"):
    """
    Genera un video con Pollinations (GRATIS, sin key).
    Fallback a Veo 3.1 si la key de Google funciona.

    Returns:
        bytes del video MP4, o None si falla
    """
    # Método 1: Pollinations Video (GRATIS, sin key)
    try:
        import requests
        from urllib.parse import quote

        logger.info(f"Pollinations Video: generando '{prompt[:60]}'...")
        video_url = f"https://video.pollinations.ai/generate?prompt={quote(prompt)}&model=fast-svd"

        r = requests.get(video_url, timeout=120)
        if r.status_code == 200 and ("video" in r.headers.get("content-type", "") or len(r.content) > 10000):
            logger.info(f"Pollinations Video OK: {len(r.content)} bytes")
            return r.content
        else:
            logger.warning(f"Pollinations Video: status={r.status_code}")
    except Exception as e:
        logger.warning(f"Pollinations Video error: {e}")

    # Método 2: Veo 3.1 (requiere key Google funcional)
    try:
        from google import genai
        from google.genai import types

        client = genai.Client(api_key=api_key)

        logger.info(f"Veo 3.1: intentando con key...")

        operation = client.models.generate_videos(
            model="veo-3.1-generate-preview",
            prompt=prompt,
            config=types.GenerateVideosConfig(
                aspect_ratio=aspect_ratio,
                resolution="720p",
                duration_seconds=duration,
            ),
        )

        max_wait = 360
        elapsed = 0
        while not operation.done:
            time.sleep(15)
            elapsed += 15
            operation = client.operations.get(operation)
            if elapsed > max_wait:
                logger.warning("Veo 3.1: timeout")
                return None

        if operation.result and operation.result.generated_videos:
            video = operation.result.generated_videos[0]
            client.files.download(file=video.video)
            tmp_path = os.path.join(tempfile.gettempdir(), f"c8l_video_{int(time.time())}.mp4")
            video.video.save(tmp_path)
            with open(tmp_path, "rb") as f:
                video_bytes = f.read()
            try:
                os.remove(tmp_path)
            except:
                pass
            return video_bytes

    except Exception as e:
        logger.warning(f"Veo 3.1 error: {str(e)[:100]}")

    return None
