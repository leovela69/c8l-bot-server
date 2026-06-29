"""
🎼 C8L Music Score Generator
==============================
Genera partituras (PDF/PNG) a partir de audio o MIDI.

Flujo:
  Audio (MP3/WAV) → Basic Pitch → MIDI → music21 → LilyPond → PDF

Módulos:
- transcriber: Audio → MIDI (usa Basic Pitch de Spotify)
- notation: MIDI → Partitura (usa music21 + LilyPond)
- telegram_handler: Comandos /partitura para el bot
"""

from music_score.notation import ScoreGenerator
from music_score.transcriber import AudioTranscriber

__all__ = ['ScoreGenerator', 'AudioTranscriber']
__version__ = "1.0.0"
