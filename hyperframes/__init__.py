"""
🎬 C8L Hyperframes Integration
================================
Motor de renderizado HTML→MP4 usando HeyGen Hyperframes.

Convierte composiciones HTML con animaciones seekable en videos MP4
determinísticos. Integrado con el bot de Telegram para crear videos
desde comandos de texto.

Módulos:
- engine: Motor principal de renderizado (CLI wrapper)
- templates: Plantillas pre-construidas para videos rápidos
- telegram_handler: Comandos de Telegram para el bot
"""

from hyperframes.engine import HyperframesEngine
from hyperframes.templates import VideoTemplates, get_template

__all__ = [
    'HyperframesEngine',
    'VideoTemplates',
    'get_template',
]

__version__ = "1.0.0"
