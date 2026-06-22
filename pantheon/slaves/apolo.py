# -*- coding: utf-8 -*-
"""
🎵 APOLO — Bot Esclavo 3 (Musica / Audio)
Genera, mezcla y procesa musica y audio.
"El Musico de C8L"

Skills: songwriting-and-ai-music, comfyui, inference-sh-cli
"""

import logging
from openrouter_client import call_openrouter

logger = logging.getLogger("c8l.apolo")

APOLO_SYSTEM_PROMPT = """Eres APOLO, el Musico de C8L Agency. Experto en composicion musical, especialmente en el genero Bolero-House.

Contexto C8L Agency:
- Genero principal: Bolero-House (fusion de bolero romantico con house electronico)
- BPM tipico: 110-120
- Instrumentos clave: ukelele, maracas, sintetizadores analogicos, bass house
- Vocales: suaves, melancolicas, con reverb
- Estetica: romanticismo nocturno, luces de neon, intimidad urbana

Tu expertise:
- Composicion de letras y melodias
- Estructura musical (intro, verso, coro, bridge, outro)
- Produccion musical (BPM, key, instrumentacion)
- Prompts optimizados para Suno AI y Udio
- Teoria musical aplicada
- Mezcla y masterizacion (conceptual)

Tu estilo:
- Apasionado por la musica
- Tecnico pero accesible
- Siempre sugieres cosas que se pueden producir realmente
- Usas terminologia musical correcta
- Das prompts listos para copiar y pegar en Suno/Udio"""

SUNO_PROMPT_TEMPLATE = """Genera una cancion completa para producir en Suno AI / Udio.

FORMATO OBLIGATORIO:

🎵 *{titulo}*
🎼 Genero: {genero}
🎹 BPM: {bpm} | Key: {key}
🎤 Vocales: {tipo_voz}

📝 LETRA:

[Intro]
{instrucciones_musicales}

[Verse 1]
{letra_verso1}

[Chorus]
{letra_coro}

[Verse 2]
{letra_verso2}

[Bridge]
{letra_bridge}

[Chorus]
{letra_coro_repite}

[Outro]
{instrucciones_outro}

🎛️ PROMPT PARA SUNO (copiar y pegar):
{prompt_suno_optimizado}

💡 NOTAS DE PRODUCCION:
{notas_tecnicas}"""


class Apolo:
    """Bot Musico — Composicion y produccion musical."""

    def compose(self, request, style="bolero-house"):
        """
        Compone una cancion completa.

        Args:
            request: Descripcion de lo que quiere el usuario
            style: Estilo musical (default: bolero-house)

        Returns:
            str: Cancion completa con letra, estructura y prompts
        """
        prompt = f"""Compone una cancion completa basada en esto:
Peticion: {request}
Estilo: {style}

{SUNO_PROMPT_TEMPLATE}

Rellena TODOS los campos con contenido real y creativo."""

        return call_openrouter(prompt, APOLO_SYSTEM_PROMPT, agent_name="apolo", temperature=0.85, max_tokens=4096)

    def generate_prompt_suno(self, description, genre="bolero-house", bpm=115):
        """Genera solo el prompt optimizado para Suno/Udio."""
        prompt = f"""Genera SOLO un prompt optimizado para Suno AI. 
Descripcion: {description}
Genero: {genre}
BPM: {bpm}

El prompt debe incluir tags de estilo, mood, instrumentos, y estructura.
Formato: solo el prompt listo para copiar y pegar, sin explicaciones adicionales."""

        return call_openrouter(prompt, APOLO_SYSTEM_PROMPT, agent_name="apolo", temperature=0.8, max_tokens=1000)

    def analyze_music(self, description):
        """Analiza una pieza musical o estilo."""
        prompt = f"""Analiza musicalmente: {description}

Incluye:
- Genero y subgenero
- BPM estimado
- Tonalidad probable
- Instrumentacion
- Estructura
- Influencias
- Como reproducirlo en produccion"""

        return call_openrouter(prompt, APOLO_SYSTEM_PROMPT, agent_name="apolo", temperature=0.6)

    def suggest_remix(self, original, target_style="bolero-house"):
        """Sugiere como remixear una cancion al estilo C8L."""
        prompt = f"""Sugiere como remixear/adaptar esto al estilo {target_style}:
Original: {original}

Incluye:
- BPM target
- Cambios de instrumentacion
- Elementos a mantener del original
- Elementos nuevos a agregar
- Prompt para Suno con el remix"""

        return call_openrouter(prompt, APOLO_SYSTEM_PROMPT, agent_name="apolo", temperature=0.8)
