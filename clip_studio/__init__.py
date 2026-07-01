"""
✂️ C8L Clip Studio — Video Repurposing (OpusClip alternativa gratis)
=====================================================================
Convierte videos largos en clips cortos virales para TikTok/Reels/Shorts.

Flujo:
  Video largo → Whisper transcribe → LLM detecta mejores momentos →
  FFmpeg corta → Subtítulos → Reframe vertical → Clips listos

Capacidades:
- Detectar momentos virales (hook detection)
- Cortar clips automáticamente (15-60s)
- Subtítulos animados
- Reframe vertical (9:16) desde horizontal
- Virality score por clip
- Multi-clip (5-10 clips de un video largo)

Todo gratis: Whisper + FFmpeg + LLM (Groq)
"""

from clip_studio.engine import ClipStudio

__all__ = ['ClipStudio']
__version__ = "1.0.0"
