"""
🎬 C8L Film Production — Productora de Cine IA
================================================
Pipeline completo de producción cinematográfica:

Módulos:
- video_api: 7 proveedores gratuitos + 2 premium (admin-locked) con fallback
- skills: Producer, Director, Editor, Motion Graphics, Music
- pipeline: Pipeline completo de producción end-to-end
- long_film: Películas de 60+ minutos desde una sola idea
- comfyui_cloud: Proveedor premium ComfyUI Cloud (🔒 admin-only)
- higgsfield_api: Proveedor premium Higgsfield AI — 30+ modelos (🔒 admin-only)
"""

from film.video_api import VideoAPI, VideoProvider
from film.skills import (
    ProducerSkill, DirectorSkill, EditorSkill,
    MotionGraphicsSkill, MusicProducerSkill
)
from film.pipeline import FilmPipeline
from film.long_film import (
    LongFormWriter, CharacterManager, BatchGenerator,
    VideoAssembler, LongFilmOrchestrator, FilmLength
)
from film.comfyui_cloud import ComfyUICloudAPI, PremiumAdminGate
from film.higgsfield_api import HiggsfieldAPI

__all__ = [
    # Video API
    'VideoAPI', 'VideoProvider',
    # Skills
    'ProducerSkill', 'DirectorSkill', 'EditorSkill',
    'MotionGraphicsSkill', 'MusicProducerSkill',
    # Pipelines
    'FilmPipeline',
    # Long Film (60+ min)
    'LongFormWriter', 'CharacterManager', 'BatchGenerator',
    'VideoAssembler', 'LongFilmOrchestrator', 'FilmLength',
    # Premium (🔒 admin-only)
    'ComfyUICloudAPI', 'PremiumAdminGate',
    'HiggsfieldAPI',
]

__version__ = "2.1.0"
