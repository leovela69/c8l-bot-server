"""
🎭 FACE STUDIO TELEGRAM HANDLER
=================================
Comandos:
  /face animar     + foto → Video animado (LivePortrait)
  /face swap       + 2 fotos → Face swap
  /face lipsync    + foto + audio → Lip sync
  /face mejorar    + foto → HD restore (GFPGAN)
  /face edad <N>   + foto → Cambiar edad
  /face expresion  + foto → Cambiar expresión
  /face help       → Ayuda
  /face status     → Estado
"""

import logging
from typing import Dict, Optional

logger = logging.getLogger("c8l.face_studio.telegram")


# Lazy-load
_studio = None


def _get_studio():
    global _studio
    if _studio is None:
        from face_studio.engine import FaceStudio
        _studio = FaceStudio()
    return _studio


def parse_face_command(text: str) -> Dict:
    """Parsea el comando /face"""
    text = text.strip()
    for prefix in ['/face', '/rostro', '/cara']:
        if text.lower().startswith(prefix):
            text = text[len(prefix):].strip()
            break

    if not text:
        return {'action': 'help'}

    lower = text.lower()

    if lower in ('help', 'ayuda', '?'):
        return {'action': 'help'}
    if lower in ('status', 'estado'):
        return {'action': 'status'}
    if lower.startswith('animar') or lower.startswith('animate'):
        return {'action': 'animate'}
    if lower.startswith('swap') or lower.startswith('cambiar'):
        return {'action': 'swap'}
    if lower.startswith('lipsync') or lower.startswith('lip') or lower.startswith('sync'):
        method = 'latentsync'
        if 'muse' in lower:
            method = 'musetalk'
        elif 'wav' in lower:
            method = 'wav2lip'
        elif 'sad' in lower:
            method = 'sadtalker'
        return {'action': 'lipsync', 'method': method}
    if lower.startswith('mejorar') or lower.startswith('enhance') or lower.startswith('hd'):
        return {'action': 'enhance'}
    if lower.startswith('edad') or lower.startswith('age'):
        # Extraer número
        import re
        age_match = re.search(r'(\d+)', lower)
        target_age = int(age_match.group(1)) if age_match else 70
        return {'action': 'age', 'target_age': target_age}
    if lower.startswith('expresion') or lower.startswith('expression'):
        expr = 'smile'
        for e in ['smile', 'sad', 'angry', 'surprised', 'wink', 'neutral']:
            if e in lower:
                expr = e
                break
        return {'action': 'expression', 'expression': expr}

    return {'action': 'help'}


async def handle_face_command(text: str, chat_id: str,
                               image_bytes: bytes = None,
                               audio_bytes: bytes = None,
                               target_image_bytes: bytes = None,
                               send_fn=None, typing_fn=None,
                               photo_fn=None, video_fn=None,
                               doc_fn=None) -> Dict:
    """Handler principal para /face"""
    parsed = parse_face_command(text)
    action = parsed['action']

    studio = _get_studio()

    if action == 'help':
        if send_fn:
            send_fn(chat_id, studio.get_skills_text())
        return {'status': 'ok', 'action': 'help'}

    elif action == 'status':
        status = studio.get_status()
        text_status = (
            "🎭 *FACE STUDIO STATUS*\n\n"
            f"🔧 HF Token: {'✅' if status['hf_token_configured'] else '❌'}\n"
            f"📊 Generaciones: {status['generation_count']}\n"
            f"💰 Costo: {status['monthly_cost']}\n\n"
            f"🛠️ Skills:\n" +
            "\n".join(f"  • {s}" for s in status['available_skills'])
        )
        if send_fn:
            send_fn(chat_id, text_status)
        return {'status': 'ok'}

    elif action == 'animate':
        if not image_bytes:
            if send_fn:
                send_fn(chat_id, "📷 Envía una foto de un rostro para animarlo.")
            return {'status': 'waiting', 'waiting_for': 'image'}
        if typing_fn:
            typing_fn(chat_id)
        if send_fn:
            send_fn(chat_id, "🎬 Animando retrato con LivePortrait...")
        result = await studio.animate_portrait(image_bytes)
        return await _send_result(result, chat_id, send_fn, video_fn, doc_fn)

    elif action == 'swap':
        if not image_bytes or not target_image_bytes:
            if send_fn:
                send_fn(chat_id, "📷 Necesito 2 fotos: rostro origen + imagen destino.")
            return {'status': 'waiting', 'waiting_for': '2_images'}
        if typing_fn:
            typing_fn(chat_id)
        if send_fn:
            send_fn(chat_id, "🔄 Haciendo face swap...")
        result = await studio.face_swap(image_bytes, target_image_bytes)
        return await _send_result(result, chat_id, send_fn, photo_fn, doc_fn)

    elif action == 'lipsync':
        if not image_bytes or not audio_bytes:
            if send_fn:
                send_fn(chat_id, "📷🎵 Necesito una foto + un audio para lip sync.")
            return {'status': 'waiting', 'waiting_for': 'image_and_audio'}
        if typing_fn:
            typing_fn(chat_id)
        method = parsed.get('method', 'latentsync')
        if send_fn:
            send_fn(chat_id, f"🗣️ Sincronizando labios ({method})...")
        result = await studio.lip_sync(image_bytes, audio_bytes, method)
        return await _send_result(result, chat_id, send_fn, video_fn, doc_fn)

    elif action == 'enhance':
        if not image_bytes:
            if send_fn:
                send_fn(chat_id, "📷 Envía una foto para mejorar el rostro.")
            return {'status': 'waiting', 'waiting_for': 'image'}
        if typing_fn:
            typing_fn(chat_id)
        if send_fn:
            send_fn(chat_id, "✨ Mejorando rostro con GFPGAN...")
        result = await studio.enhance_face(image_bytes)
        return await _send_result(result, chat_id, send_fn, photo_fn, doc_fn)

    elif action == 'age':
        if not image_bytes:
            if send_fn:
                send_fn(chat_id, "📷 Envía una foto para cambiar la edad.")
            return {'status': 'waiting', 'waiting_for': 'image'}
        if typing_fn:
            typing_fn(chat_id)
        age = parsed.get('target_age', 70)
        if send_fn:
            send_fn(chat_id, f"👴 Cambiando edad a {age} años...")
        result = await studio.change_age(image_bytes, age)
        return await _send_result(result, chat_id, send_fn, photo_fn, doc_fn)

    elif action == 'expression':
        if not image_bytes:
            if send_fn:
                send_fn(chat_id, "📷 Envía una foto para cambiar la expresión.")
            return {'status': 'waiting', 'waiting_for': 'image'}
        if typing_fn:
            typing_fn(chat_id)
        expr = parsed.get('expression', 'smile')
        if send_fn:
            send_fn(chat_id, f"😊 Cambiando expresión a: {expr}...")
        result = await studio.change_expression(image_bytes, expr)
        return await _send_result(result, chat_id, send_fn, photo_fn, doc_fn)

    return {'status': 'error', 'error': 'Acción no reconocida'}


async def _send_result(result: Dict, chat_id: str,
                        send_fn, media_fn, doc_fn) -> Dict:
    """Envía el resultado al usuario"""
    if result.get('status') != 'success':
        if send_fn:
            send_fn(chat_id, f"❌ Error: {result.get('error', 'Unknown')[:200]}")
        return result

    # Si tiene bytes, enviar como media
    content = result.get('bytes')
    url = result.get('url')

    if content and media_fn:
        task = result.get('task', 'face')
        if task in ('animate', 'lipsync'):
            # Es video
            media_fn(chat_id, content, f"face_{task}.mp4",
                    f"🎭 {task.title()} — Face Studio")
        else:
            # Es imagen
            media_fn(chat_id, content, f"🎭 {task.title()}")
    elif url and send_fn:
        send_fn(chat_id, f"🎭 Resultado: {url}")
    elif send_fn:
        send_fn(chat_id, "✅ Procesado pero no pude enviar el resultado.")

    return {'status': 'ok', 'task': result.get('task')}
