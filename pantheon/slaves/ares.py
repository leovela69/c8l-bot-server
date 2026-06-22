# -*- coding: utf-8 -*-
"""
🎬 ARES — Bot Esclavo 4 (Video / Animacion)
Genera videoclips, animaciones y contenido visual.
"El Cineasta de C8L"

Skills: hyperframes, kanban-video-orchestrator, inference-sh-cli, comfyui
"""

import logging
from openrouter_client import call_openrouter

logger = logging.getLogger("c8l.ares")

ARES_SYSTEM_PROMPT = """Eres ARES, el Cineasta de C8L Agency. Experto en produccion audiovisual, videoclips y animacion.

Tu expertise:
- Direccion cinematografica (angulos, iluminacion, composicion)
- Guion y storyboard
- Videoclips musicales (especialmente para Bolero-House)
- Motion graphics y animacion
- Color grading y estetica visual
- Produccion con IA (prompts para generacion de video/imagen)

Estetica C8L:
- Neon y luces urbanas
- Noches cinematograficas
- Romanticismo visual
- Colores: azul profundo, magenta, dorado, negro
- Texturas: humo, reflejos, agua

Tu estilo:
- Cinematografico y visual
- Describes escenas como un director
- Siempre incluyes prompts para generar cada escena con IA
- Practico: todo lo que propones es producible"""


class Ares:
    """Bot Cineasta — Video y animacion."""

    def create_script(self, concept):
        """
        Crea guion cinematografico completo.

        Args:
            concept: Concepto del video

        Returns:
            str: Guion completo con storyboard
        """
        prompt = f"""Crea un guion cinematografico completo para: {concept}

FORMATO:

🎬 *TITULO*
⏱️ Duracion: [estimada]
🎨 Estetica: [paleta, mood]
🎵 Musica: [genero, BPM, mood]

📋 GUION ESCENA POR ESCENA:

ESCENA 1 — [00:00-00:15]
📍 Locacion: [donde]
📷 Camara: [tipo de plano, movimiento]
💡 Iluminacion: [tipo, color]
🎭 Accion: [que pasa]
🖼️ Prompt IA: "[prompt para generar esta escena]"

ESCENA 2 — [00:15-00:30]
...

🎨 PALETA DE COLORES: [hex codes]
📐 FORMATO: [16:9 / 9:16 / 1:1]
🎵 SYNC MUSICAL: [como sincronizar con la musica]

💡 NOTAS DE PRODUCCION:
[consejos para la produccion real]"""

        return call_openrouter(prompt, ARES_SYSTEM_PROMPT, agent_name="ares", temperature=0.8, max_tokens=6000)

    def create_storyboard(self, script_summary):
        """Genera storyboard visual (prompts para cada frame)."""
        prompt = f"""Genera un storyboard de 6-8 frames para: {script_summary}

Para cada frame genera:
1. Numero de frame
2. Descripcion visual detallada
3. Prompt para generar la imagen con IA (Midjourney/DALL-E style)
4. Tipo de plano (close-up, wide, medium)
5. Transicion al siguiente frame"""

        return call_openrouter(prompt, ARES_SYSTEM_PROMPT, agent_name="ares", temperature=0.8, max_tokens=4000)

    def suggest_visual_style(self, music_description):
        """Sugiere estilo visual para una cancion."""
        prompt = f"""Sugiere un estilo visual completo para este contenido musical: {music_description}

Incluye:
- Paleta de colores (hex)
- Referencias visuales (peliculas, artistas)
- Tipo de animacion/video recomendado
- Mood board conceptual (describe 5 imagenes)
- Formato recomendado (vertical/horizontal)"""

        return call_openrouter(prompt, ARES_SYSTEM_PROMPT, agent_name="ares", temperature=0.8)
