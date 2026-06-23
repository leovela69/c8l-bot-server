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
    Genera un video con Veo 3.1 via Google AI Studio.

    Args:
        prompt: Descripción del video
        api_key: API key de Google AI Studio
        duration: Duración en segundos (5 o 8)
        aspect_ratio: "16:9" o "9:16"

    Returns:
        bytes del video MP4, o None si falla
    """
    try:
        from google import genai
        from google.genai import types

        client = genai.Client(api_key=api_key)

        logger.info(f"Veo 3.1: generando video '{prompt[:80]}'...")

        # Configurar generación
        operation = client.models.generate_videos(
            model="veo-3.1-generate-preview",
            prompt=prompt,
            config=types.GenerateVideosConfig(
                aspect_ratio=aspect_ratio,
                resolution="720p",
                duration_seconds=duration,
            ),
        )

        # Esperar a que termine (puede tardar 2-5 minutos)
        max_wait = 360  # 6 minutos máximo
        elapsed = 0
        while not operation.done:
            time.sleep(15)
            elapsed += 15
            operation = client.operations.get(operation)
            if elapsed > max_wait:
                logger.warning("Veo 3.1: timeout (>6 min)")
                return None
            if elapsed % 60 == 0:
                logger.info(f"Veo 3.1: esperando... ({elapsed}s)")

        logger.info(f"Veo 3.1: video generado en {elapsed}s")

        # Descargar el video
        if operation.result and operation.result.generated_videos:
            video = operation.result.generated_videos[0]
            client.files.download(file=video.video)

            # Guardar temporalmente para leer los bytes
            tmp_path = os.path.join(tempfile.gettempdir(), f"c8l_video_{int(time.time())}.mp4")
            video.video.save(tmp_path)

            with open(tmp_path, "rb") as f:
                video_bytes = f.read()

            # Limpiar archivo temporal
            try:
                os.remove(tmp_path)
            except:
                pass

            logger.info(f"Veo 3.1: video descargado ({len(video_bytes)} bytes)")
            return video_bytes
        else:
            logger.warning("Veo 3.1: sin videos en el resultado")
            return None

    except ImportError:
        logger.error("Veo 3.1: google-genai no instalado")
        return None
    except Exception as e:
        error_msg = str(e)
        logger.error(f"Veo 3.1 error: {error_msg[:200]}")
        return None
