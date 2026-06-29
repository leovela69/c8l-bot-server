"""
✂️ CLIP STUDIO TELEGRAM HANDLER
=================================
Comandos:
  /clip + video → Genera clips virales
  /clip 3       → Solo 3 clips
  /clip neon    → Estilo neón de subtítulos
  /clip status  → Estado del motor
"""

import os
import asyncio
import logging
import tempfile
from typing import Dict

logger = logging.getLogger("c8l.clip_studio.telegram")

_studio = None

def _get_studio():
    global _studio
    if _studio is None:
        from clip_studio.engine import ClipStudio
        _studio = ClipStudio()
    return _studio


async def handle_clip_command(text: str, chat_id: str,
                              video_bytes: bytes = None,
                              video_path: str = None,
                              send_fn=None, typing_fn=None,
                              video_fn=None) -> Dict:
    """Handler principal para /clip"""
    cmd = text.strip()
    for prefix in ['/clip', '/clips', '/cortar']:
        if cmd.lower().startswith(prefix):
            cmd = cmd[len(prefix):].strip()
            break

    if cmd.lower() in ('help', 'ayuda', '?'):
        return _help(send_fn, chat_id)
    if cmd.lower() in ('status', 'estado'):
        return _status(send_fn, chat_id)

    if not video_bytes and not video_path:
        if send_fn:
            send_fn(chat_id,
                "✂️ *CLIP STUDIO*\n\n"
                "Envía un video largo y te devuelvo los "
                "mejores clips para TikTok/Reels.\n\n"
                "💡 Responde a un video con /clip")
        return {'status': 'waiting'}

    # Parsear opciones
    num_clips = 5
    style = 'bold'
    import re
    n_match = re.search(r'(\d+)', cmd)
    if n_match:
        num_clips = min(int(n_match.group(1)), 10)
    for s in ['neon', 'minimal', 'bold']:
        if s in cmd.lower():
            style = s

    # Guardar video si viene en bytes
    if video_bytes and not video_path:
        tmp = tempfile.NamedTemporaryFile(
            suffix='.mp4', delete=False, dir='/tmp')
        tmp.write(video_bytes)
        tmp.close()
        video_path = tmp.name

    if send_fn:
        send_fn(chat_id,
            f"✂️ Procesando video...\n"
            f"🎯 Clips: {num_clips} | Estilo: {style}\n"
            f"⏱️ Esto tarda 1-3 minutos.")
    if typing_fn:
        typing_fn(chat_id)

    studio = _get_studio()
    result = await studio.process_video(
        video_path, num_clips=num_clips,
        style=style, add_captions=True,
        reframe_vertical=True
    )

    if result.get('status') != 'success':
        if send_fn:
            send_fn(chat_id, f"❌ Error: {result.get('error')}")
        return result

    clips = result.get('clips', [])
    if send_fn:
        send_fn(chat_id,
            f"✅ {len(clips)} clips generados!\n"
            f"📊 Enviando por orden de viralidad...")

    for clip in clips:
        if video_fn and clip.get('bytes'):
            caption = (
                f"✂️ Clip #{clip['clip_num']} | "
                f"⭐ Virality: {clip.get('virality_score', 0)}/100\n"
                f"🎣 Hook: {clip.get('hook', '')[:50]}\n"
                f"📐 {'9:16' if clip.get('reframed') else '16:9'}"
            )
            video_fn(chat_id, clip['bytes'],
                    clip.get('filename', 'clip.mp4'), caption)

    return {'status': 'ok', 'clips': len(clips)}


def _help(send_fn, chat_id) -> Dict:
    if send_fn:
        send_fn(chat_id,
            "✂️ *CLIP STUDIO — OpusClip gratis*\n\n"
            "Convierte videos largos en clips virales.\n\n"
            "📋 *Uso:*\n"
            "• Envía video → responde con /clip\n"
            "• `/clip 3` → Solo 3 clips\n"
            "• `/clip neon` → Subtítulos neón\n"
            "• `/clip 5 minimal` → 5 clips minimalistas\n\n"
            "🎯 *Qué hace:*\n"
            "• Transcribe el video (Whisper)\n"
            "• Detecta momentos virales (IA)\n"
            "• Corta los mejores clips\n"
            "• Añade subtítulos animados\n"
            "• Reframe a vertical (9:16)\n\n"
            "🔧 Motor: Whisper + FFmpeg + Groq LLM\n"
            "💰 Costo: $0")
    return {'status': 'ok'}


def _status(send_fn, chat_id) -> Dict:
    studio = _get_studio()
    s = studio.get_status()
    if send_fn:
        send_fn(chat_id,
            f"✂️ *CLIP STUDIO STATUS*\n\n"
            f"{'✅' if s['ffmpeg'] else '❌'} FFmpeg\n"
            f"{'✅' if s['groq'] else '❌'} Groq (Whisper + LLM)\n"
            f"📊 Clips generados: {s['clip_count']}\n"
            f"💰 Costo: {s['cost']}")
    return {'status': 'ok'}
