"""
🎼 MUSIC SCORE TELEGRAM HANDLER
=================================
Comandos:
  /partitura              — Genera partitura de la última canción
  /partitura <url>        — Transcribe audio de URL a partitura
  /partitura estilos      — Muestra formatos disponibles
  /partitura status       — Estado del generador
"""

import os
import asyncio
import logging
from typing import Dict

logger = logging.getLogger("c8l.music_score.telegram")



# Lazy-load instances
_transcriber = None
_generator = None


def _get_transcriber():
    global _transcriber
    if _transcriber is None:
        from music_score.transcriber import AudioTranscriber
        _transcriber = AudioTranscriber()
    return _transcriber


def _get_generator():
    global _generator
    if _generator is None:
        from music_score.notation import ScoreGenerator
        _generator = ScoreGenerator()
    return _generator


async def handle_score_command(text: str, chat_id: str,
                               audio_bytes: bytes = None,
                               audio_path: str = None,
                               send_fn=None, typing_fn=None,
                               doc_fn=None) -> Dict:
    """
    Handler principal para /partitura.

    Args:
        text: Texto del comando
        chat_id: Chat ID
        audio_bytes: Bytes del audio (si el usuario envió archivo)
        audio_path: Ruta al audio (si ya está en disco)
        send_fn: Función para enviar texto
        typing_fn: Función para mostrar typing
        doc_fn: Función para enviar documento (chat_id, bytes, filename, caption)
    """
    # Parsear comando
    cmd = text.strip()
    for prefix in ['/partitura', '/score', '/sheet']:
        if cmd.lower().startswith(prefix):
            cmd = cmd[len(prefix):].strip()
            break

    if cmd.lower() in ('help', 'ayuda', '?'):
        return await _handle_help(send_fn, chat_id)
    if cmd.lower() in ('status', 'estado'):
        return await _handle_status(send_fn, chat_id)

    # Si hay audio, transcribir y generar partitura
    if audio_bytes or audio_path:
        return await _handle_transcribe(
            audio_bytes, audio_path, cmd or "Mi Canción",
            chat_id, send_fn, typing_fn, doc_fn
        )

    # Si no hay audio, mostrar ayuda
    if send_fn:
        send_fn(chat_id,
                "🎼 *Generador de Partituras*\n\n"
                "Envíame un audio/canción y te devuelvo la partitura.\n\n"
                "💡 *Opciones:*\n"
                "• Envía un audio MP3/WAV → te doy la partitura\n"
                "• Responde a un audio con /partitura\n"
                "• Después de /musica, pide /partitura\n\n"
                "📋 Formatos de salida: PDF, MusicXML, MIDI")
    return {'status': 'ok', 'action': 'help'}



async def _handle_transcribe(audio_bytes, audio_path, title,
                              chat_id, send_fn, typing_fn, doc_fn) -> Dict:
    """Transcribe audio y genera partitura"""
    if send_fn:
        send_fn(chat_id, "🎼 Transcribiendo audio a partitura...\n"
                         "⏱️ Esto puede tardar 15-30 segundos.")
    if typing_fn:
        typing_fn(chat_id)

    transcriber = _get_transcriber()
    generator = _get_generator()

    # Paso 1: Audio → MIDI
    if audio_bytes:
        midi_result = transcriber.transcribe_from_bytes(audio_bytes)
    elif audio_path:
        midi_result = transcriber.transcribe(audio_path)
    else:
        return {'status': 'error', 'error': 'No audio provided'}

    if midi_result.get('status') != 'success':
        if send_fn:
            send_fn(chat_id, f"❌ Error transcribiendo: {midi_result.get('error', '?')[:200]}")
        return midi_result

    midi_path = midi_result['midi_path']
    notes_count = midi_result.get('notes_count', 0)

    if send_fn:
        send_fn(chat_id, f"✅ Transcripción completada: {notes_count} notas detectadas\n"
                         f"🎹 Generando partitura PDF...")
    if typing_fn:
        typing_fn(chat_id)

    # Paso 2: MIDI → Partitura PDF
    score_result = generator.generate_from_midi(midi_path, title=title)

    if score_result.get('status') != 'success':
        # Intentar con las notas directamente
        notes = midi_result.get('notes', [])
        if notes:
            score_result = generator.generate_from_notes(notes, title=title)

    if score_result.get('status') != 'success':
        if send_fn:
            send_fn(chat_id, f"❌ Error generando partitura: {score_result.get('error', '?')[:200]}")
        return score_result

    # Paso 3: Enviar resultado
    score_bytes = score_result.get('bytes')
    score_format = score_result.get('format', 'pdf')
    filename = f"partitura_{title[:20].replace(' ', '_')}.{score_format}"

    caption = (
        f"🎼 *{title}*\n"
        f"📝 {notes_count} notas | "
        f"{score_result.get('measures', '?')} compases\n"
        f"🎹 Método: {score_result.get('method', '?')}\n"
        f"📦 {score_result.get('size_kb', 0)} KB"
    )

    if doc_fn and score_bytes:
        doc_fn(chat_id, score_bytes, filename, caption)

    # También enviar MIDI
    if doc_fn and os.path.exists(midi_path):
        with open(midi_path, 'rb') as f:
            midi_bytes = f.read()
        midi_filename = f"midi_{title[:20].replace(' ', '_')}.mid"
        doc_fn(chat_id, midi_bytes, midi_filename,
               f"🎵 MIDI — {notes_count} notas")

    return {
        'status': 'ok',
        'score_path': score_result.get('path'),
        'midi_path': midi_path,
        'notes': notes_count,
        'format': score_format
    }


async def _handle_help(send_fn, chat_id) -> Dict:
    text = (
        "🎼 *GENERADOR DE PARTITURAS*\n\n"
        "Convierte audio en partituras profesionales.\n\n"
        "📋 *Comandos:*\n"
        "• Envía audio → responde con /partitura\n"
        "• `/partitura status` — Estado del motor\n\n"
        "🎵 *Flujo automático:*\n"
        "Cuando Apolo genera una canción con /musica,\n"
        "pide `/partitura` y te da el PDF de la canción.\n\n"
        "📦 *Formatos de salida:*\n"
        "• PDF — Partitura visual\n"
        "• MIDI — Para editores musicales\n"
        "• MusicXML — Para Finale, Sibelius, MuseScore\n\n"
        "🔧 *Motor:* Basic Pitch (Spotify) + music21 + LilyPond"
    )
    if send_fn:
        send_fn(chat_id, text)
    return {'status': 'ok'}


async def _handle_status(send_fn, chat_id) -> Dict:
    transcriber = _get_transcriber()
    generator = _get_generator()

    bp = "✅" if transcriber.check_basic_pitch() else "❌"
    m21 = "✅" if generator.check_music21() else "❌"
    ly = "✅" if generator.check_lilypond() else "❌"

    text = (
        "🎼 *SCORE GENERATOR STATUS*\n\n"
        f"🎵 Basic Pitch (Spotify): {bp}\n"
        f"📝 music21: {m21}\n"
        f"🎹 LilyPond: {ly}\n\n"
        f"📊 Transcripciones: {transcriber.transcription_count}\n"
        f"📄 Partituras generadas: {generator.generation_count}\n\n"
        "💡 Sin Basic Pitch usa librosa (fallback)\n"
        "💡 Sin LilyPond genera PDF con texto"
    )
    if send_fn:
        send_fn(chat_id, text)
    return {'status': 'ok'}
