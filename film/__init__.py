"""
🎬 C8L Film Production — Productora de Cine IA
================================================
Pipeline completo de producción cinematográfica:

Módulos:
- video_api: 5 proveedores de video con fallback automático
- skills: Producer, Director, Editor, Motion Graphics, Music
- pipeline: Pipeline completo de producción end-to-end
"""

from film.video_api import VideoAPI
from film.skills import (
    ProducerSkill, DirectorSkill, EditorSkill,
    MotionGraphicsSkill, MusicProducerSkill
)
from film.pipeline import FilmPipeline

__all__ = [
    'VideoAPI',
    'ProducerSkill', 'DirectorSkill', 'EditorSkill',
    'MotionGraphicsSkill', 'MusicProducerSkill',
    'FilmPipeline'
]

__version__ = "1.0.0"
