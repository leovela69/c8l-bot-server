# -*- coding: utf-8 -*-
"""
🎬 FFMPEG TOOLS — Herramientas de video/audio con FFmpeg
Solo funciona en VPS (Hostinger) donde FFmpeg está instalado.

Capacidades:
1. Unir clips de video (multi-escena)
2. Agregar música/audio a video
3. Agregar subtítulos
4. Convertir formatos (MP4↔GIF↔WebM)
5. Recortar/redimensionar video
6. Extraer audio de video
7. Crear video desde imágenes (slideshow)
"""

import logging
import os
import io
import subprocess
import tempfile
import time

logger = logging.getLogger("c8l.ffmpeg")


def is_ffmpeg_available():
    """Verifica si FFmpeg está instalado."""
    try:
        result = subprocess.run(["ffmpeg", "-version"],
                              capture_output=True, timeout=5)
        return result.returncode == 0
    except:
        return False


def join_videos(video_clips, output_format="mp4"):
    """
    Une múltiples clips de video en uno solo.

    Args:
        video_clips: Lista de bytes de videos MP4
        output_format: "mp4" o "gif"

    Returns:
        bytes del video final o None si falla
    """
    if not video_clips or len(video_clips) < 2:
        return video_clips[0] if video_clips else None

    try:
        tmp_dir = tempfile.mkdtemp(prefix="c8l_join_")
        input_files = []

        # Guardar cada clip como archivo temporal
        for i, clip_bytes in enumerate(video_clips):
            clip_path = os.path.join(tmp_dir, f"clip_{i:03d}.mp4")
            with open(clip_path, "wb") as f:
                f.write(clip_bytes)
            input_files.append(clip_path)

        # Crear archivo de lista para FFmpeg concat
        list_path = os.path.join(tmp_dir, "filelist.txt")
        with open(list_path, "w") as f:
            for fp in input_files:
                f.write(f"file '{fp}'\n")

        # Unir con FFmpeg
        output_path = os.path.join(tmp_dir, f"joined.{output_format}")

        cmd = [
            "ffmpeg", "-y",
            "-f", "concat", "-safe", "0",
            "-i", list_path,
            "-c", "copy",  # Sin re-encoding (rápido)
            "-movflags", "+faststart",
            output_path
        ]

        result = subprocess.run(cmd, capture_output=True, timeout=120)

        if result.returncode == 0 and os.path.exists(output_path):
            with open(output_path, "rb") as f:
                output_bytes = f.read()
            logger.info(f"Videos unidos: {len(video_clips)} clips → {len(output_bytes)} bytes")
            _cleanup_dir(tmp_dir)
            return output_bytes
        else:
            # Si copy falla, intentar con re-encoding
            cmd2 = [
                "ffmpeg", "-y",
                "-f", "concat", "-safe", "0",
                "-i", list_path,
                "-c:v", "libx264", "-preset", "fast",
                "-c:a", "aac",
                "-movflags", "+faststart",
                output_path
            ]
            result2 = subprocess.run(cmd2, capture_output=True, timeout=180)
            if result2.returncode == 0 and os.path.exists(output_path):
                with open(output_path, "rb") as f:
                    output_bytes = f.read()
                _cleanup_dir(tmp_dir)
                return output_bytes

        logger.warning(f"FFmpeg join failed: {result.stderr.decode()[:200]}")
        _cleanup_dir(tmp_dir)

    except Exception as e:
        logger.error(f"join_videos error: {e}")
    return None


def add_audio_to_video(video_bytes, audio_bytes, volume=0.8):
    """
    Agrega pista de audio a un video.

    Args:
        video_bytes: Video MP4
        audio_bytes: Audio MP3/WAV
        volume: Volumen del audio (0.0-1.0)

    Returns:
        bytes del video con audio o None
    """
    try:
        tmp_dir = tempfile.mkdtemp(prefix="c8l_audio_")
        video_path = os.path.join(tmp_dir, "video.mp4")
        audio_path = os.path.join(tmp_dir, "audio.mp3")
        output_path = os.path.join(tmp_dir, "output.mp4")

        with open(video_path, "wb") as f:
            f.write(video_bytes)
        with open(audio_path, "wb") as f:
            f.write(audio_bytes)

        cmd = [
            "ffmpeg", "-y",
            "-i", video_path,
            "-i", audio_path,
            "-filter_complex",
            f"[1:a]volume={volume}[a1];[0:a][a1]amix=inputs=2:duration=shortest[aout]",
            "-map", "0:v", "-map", "[aout]",
            "-c:v", "copy", "-c:a", "aac",
            "-shortest",
            "-movflags", "+faststart",
            output_path
        ]

        # Si el video no tiene audio, simplificar
        result = subprocess.run(cmd, capture_output=True, timeout=120)

        if result.returncode != 0:
            # Video sin audio original — solo agregar el nuevo
            cmd2 = [
                "ffmpeg", "-y",
                "-i", video_path,
                "-i", audio_path,
                "-map", "0:v", "-map", "1:a",
                "-c:v", "copy", "-c:a", "aac",
                "-shortest",
                "-movflags", "+faststart",
                output_path
            ]
            result = subprocess.run(cmd2, capture_output=True, timeout=120)

        if result.returncode == 0 and os.path.exists(output_path):
            with open(output_path, "rb") as f:
                output_bytes = f.read()
            logger.info(f"Audio agregado: {len(output_bytes)} bytes")
            _cleanup_dir(tmp_dir)
            return output_bytes

        logger.warning(f"add_audio failed: {result.stderr.decode()[:200]}")
        _cleanup_dir(tmp_dir)

    except Exception as e:
        logger.error(f"add_audio error: {e}")
    return None


def add_subtitles(video_bytes, subtitles_text, font_size=24):
    """
    Agrega subtítulos quemados (hardcoded) a un video.

    Args:
        video_bytes: Video MP4
        subtitles_text: Texto de los subtítulos
        font_size: Tamaño de fuente

    Returns:
        bytes del video con subtítulos
    """
    try:
        tmp_dir = tempfile.mkdtemp(prefix="c8l_subs_")
        video_path = os.path.join(tmp_dir, "video.mp4")
        srt_path = os.path.join(tmp_dir, "subs.srt")
        output_path = os.path.join(tmp_dir, "output.mp4")

        with open(video_path, "wb") as f:
            f.write(video_bytes)

        # Crear SRT simple (texto dividido en segmentos de 3 seg)
        _create_srt(srt_path, subtitles_text)

        cmd = [
            "ffmpeg", "-y",
            "-i", video_path,
            "-vf", f"subtitles={srt_path}:force_style='FontSize={font_size},PrimaryColour=&HFFFFFF,OutlineColour=&H000000,Outline=2'",
            "-c:v", "libx264", "-preset", "fast",
            "-c:a", "copy",
            "-movflags", "+faststart",
            output_path
        ]

        result = subprocess.run(cmd, capture_output=True, timeout=120)

        if result.returncode == 0 and os.path.exists(output_path):
            with open(output_path, "rb") as f:
                output_bytes = f.read()
            _cleanup_dir(tmp_dir)
            return output_bytes

        logger.warning(f"subtitles failed: {result.stderr.decode()[:200]}")
        _cleanup_dir(tmp_dir)

    except Exception as e:
        logger.error(f"add_subtitles error: {e}")
    return None


def video_to_gif(video_bytes, fps=10, width=480):
    """Convierte video MP4 a GIF animado."""
    try:
        tmp_dir = tempfile.mkdtemp(prefix="c8l_gif_")
        video_path = os.path.join(tmp_dir, "video.mp4")
        output_path = os.path.join(tmp_dir, "output.gif")

        with open(video_path, "wb") as f:
            f.write(video_bytes)

        cmd = [
            "ffmpeg", "-y",
            "-i", video_path,
            "-vf", f"fps={fps},scale={width}:-1:flags=lanczos",
            "-loop", "0",
            output_path
        ]

        result = subprocess.run(cmd, capture_output=True, timeout=60)

        if result.returncode == 0 and os.path.exists(output_path):
            with open(output_path, "rb") as f:
                return f.read()

        _cleanup_dir(tmp_dir)
    except Exception as e:
        logger.error(f"video_to_gif error: {e}")
    return None


def images_to_video(image_list, duration_per_image=2, fps=24):
    """
    Crea video slideshow desde lista de imágenes.

    Args:
        image_list: Lista de bytes de imágenes
        duration_per_image: Segundos por imagen
        fps: Frames por segundo

    Returns:
        bytes del video MP4
    """
    try:
        tmp_dir = tempfile.mkdtemp(prefix="c8l_slide_")

        # Guardar imágenes
        for i, img_bytes in enumerate(image_list):
            img_path = os.path.join(tmp_dir, f"img_{i:03d}.png")
            with open(img_path, "wb") as f:
                f.write(img_bytes)

        output_path = os.path.join(tmp_dir, "slideshow.mp4")

        cmd = [
            "ffmpeg", "-y",
            "-framerate", f"1/{duration_per_image}",
            "-i", os.path.join(tmp_dir, "img_%03d.png"),
            "-c:v", "libx264", "-preset", "fast",
            "-pix_fmt", "yuv420p",
            "-vf", f"fps={fps},scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2",
            "-movflags", "+faststart",
            output_path
        ]

        result = subprocess.run(cmd, capture_output=True, timeout=60)

        if result.returncode == 0 and os.path.exists(output_path):
            with open(output_path, "rb") as f:
                output_bytes = f.read()
            _cleanup_dir(tmp_dir)
            return output_bytes

        logger.warning(f"slideshow failed: {result.stderr.decode()[:200]}")
        _cleanup_dir(tmp_dir)

    except Exception as e:
        logger.error(f"images_to_video error: {e}")
    return None


def extract_audio(video_bytes, format="mp3"):
    """Extrae audio de un video."""
    try:
        tmp_dir = tempfile.mkdtemp(prefix="c8l_extract_")
        video_path = os.path.join(tmp_dir, "video.mp4")
        output_path = os.path.join(tmp_dir, f"audio.{format}")

        with open(video_path, "wb") as f:
            f.write(video_bytes)

        cmd = [
            "ffmpeg", "-y",
            "-i", video_path,
            "-vn", "-acodec", "libmp3lame" if format == "mp3" else "copy",
            output_path
        ]

        result = subprocess.run(cmd, capture_output=True, timeout=60)

        if result.returncode == 0 and os.path.exists(output_path):
            with open(output_path, "rb") as f:
                return f.read()

        _cleanup_dir(tmp_dir)
    except Exception as e:
        logger.error(f"extract_audio error: {e}")
    return None


def get_video_info(video_bytes):
    """Obtiene duración y resolución de un video."""
    try:
        tmp_dir = tempfile.mkdtemp(prefix="c8l_info_")
        video_path = os.path.join(tmp_dir, "video.mp4")

        with open(video_path, "wb") as f:
            f.write(video_bytes)

        cmd = [
            "ffprobe", "-v", "quiet",
            "-print_format", "json",
            "-show_format", "-show_streams",
            video_path
        ]

        result = subprocess.run(cmd, capture_output=True, timeout=10)
        _cleanup_dir(tmp_dir)

        if result.returncode == 0:
            import json
            data = json.loads(result.stdout)
            duration = float(data.get("format", {}).get("duration", 0))
            streams = data.get("streams", [])
            width = height = 0
            for s in streams:
                if s.get("codec_type") == "video":
                    width = s.get("width", 0)
                    height = s.get("height", 0)
                    break
            return {"duration": duration, "width": width, "height": height}

    except Exception as e:
        logger.error(f"get_video_info error: {e}")
    return None


# ---------------------------------------------------------------------------
# UTILIDADES
# ---------------------------------------------------------------------------

def _create_srt(srt_path, text, segment_duration=3):
    """Crea archivo SRT dividiendo texto en segmentos."""
    words = text.split()
    words_per_segment = max(5, len(words) // 10)
    segments = []

    for i in range(0, len(words), words_per_segment):
        segment_text = " ".join(words[i:i + words_per_segment])
        segments.append(segment_text)

    with open(srt_path, "w", encoding="utf-8") as f:
        for i, seg in enumerate(segments):
            start = i * segment_duration
            end = start + segment_duration
            f.write(f"{i+1}\n")
            f.write(f"{_format_time(start)} --> {_format_time(end)}\n")
            f.write(f"{seg}\n\n")


def _format_time(seconds):
    """Formato SRT: HH:MM:SS,mmm"""
    h = int(seconds // 3600)
    m = int((seconds % 3600) // 60)
    s = int(seconds % 60)
    ms = int((seconds % 1) * 1000)
    return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"


def _cleanup_dir(tmp_dir):
    """Limpia directorio temporal."""
    try:
        import shutil
        shutil.rmtree(tmp_dir, ignore_errors=True)
    except:
        pass
