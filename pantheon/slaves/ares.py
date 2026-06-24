# -*- coding: utf-8 -*-
"""
🎬 ARES v3.0 — Bot Esclavo 4 (Video / Animacion / Director de Cine)
Genera videos REALES con IA + guiones + storyboards.
"El Cineasta de C8L"

NUEVO: Genera videos reales usando VideoEngine (Pollinations Multi-Motor)
+ Google Veo/Flow via Gemini API como motor premium.

Flujo:
1. Usuario pide video → Ares analiza qué tipo de video quiere
2. Si es "hazme un video de X" → genera VIDEO REAL con VideoEngine
3. Si es "guion/script/storyboard" → genera guion cinematográfico
4. Si video falla → ofrece guion + preview imagen como alternativa
"""

import logging
import time
from openrouter_client import call_openrouter
from pantheon.video_engine import video_engine, VIDEO_MODELS

logger = logging.getLogger("c8l.ares")

ARES_SYSTEM_PROMPT = """Eres ARES, el Cineasta de C8L Agency. Experto en produccion audiovisual, videoclips y animacion.

Tu expertise:
- Direccion cinematografica (angulos, iluminacion, composicion)
- Guion y storyboard
- Videoclips musicales (especialmente para Bolero-House)
- Motion graphics y animacion
- Color grading y estetica visual
- Generacion de video con IA (Veo, Seedance, Wan, etc)

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
- Practico: todo lo que propones es producible
- Cuando generas video real, describes brevemente lo que creaste"""


class Ares:
    """Bot Cineasta — Video real + guiones + storyboards."""

    def __init__(self):
        self.videos_generated = 0
        self.scripts_generated = 0

    # ---------------------------------------------------------------------------
    # PUNTO DE ENTRADA PRINCIPAL
    # ---------------------------------------------------------------------------

    def process(self, text, user_name=""):
        """
        Punto de entrada inteligente. Decide si generar video real o guion.

        Returns:
            dict: {"type": "video"|"text"|"error", "content": bytes|str, ...}
        """
        action = self._detect_action(text)
        logger.info(f"Ares: accion detectada = {action} | texto: {text[:80]}")

        if action == "generate_video":
            return self.generate_real_video(text)
        elif action == "script":
            return self.create_script_result(text)
        elif action == "storyboard":
            return self.create_storyboard_result(text)
        elif action == "models":
            return {"type": "text", "content": self.list_video_models()}
        else:
            # Default: intentar generar video real
            return self.generate_real_video(text)

    def _detect_action(self, text):
        """Detecta qué quiere el usuario."""
        t = text.lower()

        # Si pide explicitamente guion/script
        if any(kw in t for kw in ["guion", "guión", "script", "storyboard",
                                    "escenas", "escaleta"]):
            if any(kw in t for kw in ["genera video", "hazme video", "crea video",
                                       "quiero video", "video de"]):
                return "generate_video"
            return "script"

        # Si pide ver modelos
        if any(kw in t for kw in ["modelos", "models", "motores", "engines",
                                    "que modelos", "lista modelos"]):
            return "models"

        # Default: generar video real
        return "generate_video"

    # ---------------------------------------------------------------------------
    # GENERACION DE VIDEO REAL
    # ---------------------------------------------------------------------------

    def generate_real_video(self, prompt, duration=None, aspect_ratio="16:9",
                            preferred_model=None, with_audio=None):
        """
        Genera un video REAL usando el VideoEngine multi-motor.

        Args:
            prompt: Descripcion del video
            duration: Segundos (None = auto)
            aspect_ratio: "16:9" o "9:16"
            preferred_model: Modelo especifico (None = auto)
            with_audio: Incluir audio (None = auto)

        Returns:
            dict: {
                "type": "video",
                "content": bytes (MP4 o GIF),
                "format": "mp4"|"gif",
                "caption": str,
                "model_used": str,
                "duration": int,
                "has_audio": bool,
            }
            O dict con type="error" si falla todo.
        """
        logger.info(f"🎬 Ares generando video REAL: {prompt[:80]}")

        # Detectar parametros del prompt
        if not duration:
            duration = self._detect_duration(prompt)
        if not aspect_ratio:
            aspect_ratio = self._detect_aspect_ratio(prompt)
        if with_audio is None:
            with_audio = self._detect_audio_need(prompt)
        if not preferred_model:
            preferred_model = self._detect_preferred_model(prompt)

        # Generar con VideoEngine
        result = video_engine.generate(
            prompt=prompt,
            preferred_model=preferred_model,
            duration=duration,
            aspect_ratio=aspect_ratio,
            with_audio=with_audio,
        )

        if result:
            self.videos_generated += 1
            fmt = result["format"]
            model_name = result["model_name"]
            dur = result["duration"]
            attempts = result["attempts"]
            has_audio = result["has_audio"]

            audio_text = "🔊 Con audio" if has_audio else "🔇 Sin audio"
            caption = (
                f"🎬 Video generado por ARES\n"
                f"🎥 Motor: {model_name}\n"
                f"⏱️ Duración: {dur}s | {audio_text}\n"
                f"📐 Formato: {aspect_ratio}\n"
                f"🔄 Intentos: {attempts}"
            )

            filename = f"c8l_video_{int(time.time())}.{fmt}"

            return {
                "type": "video",
                "content": result["video_bytes"],
                "format": fmt,
                "filename": filename,
                "caption": caption,
                "model_used": result["model_used"],
                "model_name": model_name,
                "duration": dur,
                "has_audio": has_audio,
                "attempts": attempts,
            }
        else:
            # Video fallo — ofrecer guion como alternativa
            logger.warning("Ares: VideoEngine fallo, ofreciendo guion como alternativa")
            script = self.create_script(prompt)
            if script:
                return {
                    "type": "text",
                    "content": (
                        "⚠️ Los motores de video están saturados en este momento.\n"
                        "Te genero el guion cinematográfico para que lo uses cuando se liberen:\n\n"
                        f"{script}\n\n"
                        "💡 Intenta de nuevo en unos minutos con /video"
                    ),
                }
            return {
                "type": "error",
                "content": "❌ No pude generar el video. Los motores están saturados. Intenta en unos minutos.",
            }

    # ---------------------------------------------------------------------------
    # DETECCION INTELIGENTE DE PARAMETROS
    # ---------------------------------------------------------------------------

    def _detect_duration(self, prompt):
        """Detecta duración deseada del prompt."""
        t = prompt.lower()

        # Duraciones explícitas
        import re
        dur_match = re.search(r'(\d+)\s*(?:seg|sec|segundos|seconds|s\b)', t)
        if dur_match:
            dur = int(dur_match.group(1))
            return max(2, min(dur, 30))  # Clamp 2-30s

        # Keywords
        if any(kw in t for kw in ["corto", "short", "rapido", "quick", "clip", "preview"]):
            return 4
        if any(kw in t for kw in ["largo", "long", "completo", "full", "historia"]):
            return 12
        if any(kw in t for kw in ["medio", "normal"]):
            return 6

        return None  # Dejar que el modelo decida

    def _detect_aspect_ratio(self, prompt):
        """Detecta aspect ratio del prompt."""
        t = prompt.lower()

        if any(kw in t for kw in ["vertical", "9:16", "reel", "story", "stories",
                                    "tiktok", "shorts", "instagram"]):
            return "9:16"
        if any(kw in t for kw in ["horizontal", "16:9", "cine", "cinema",
                                    "landscape", "widescreen", "youtube"]):
            return "16:9"
        if any(kw in t for kw in ["cuadrado", "square", "1:1"]):
            return "1:1"

        return "16:9"  # Default cinematico

    def _detect_audio_need(self, prompt):
        """Detecta si el usuario quiere audio."""
        t = prompt.lower()
        if any(kw in t for kw in ["con musica", "con sonido", "con audio",
                                    "con voz", "que hable", "que cante",
                                    "with audio", "with music", "with sound"]):
            return True
        if any(kw in t for kw in ["sin sonido", "sin audio", "mudo", "mute",
                                    "silencio", "silent"]):
            return False
        return None  # Auto-detectar

    def _detect_preferred_model(self, prompt):
        """Detecta si el usuario pidió un modelo específico."""
        t = prompt.lower()

        # Modelos explícitos
        for model_id in VIDEO_MODELS:
            if model_id in t:
                return model_id

        # Keywords → modelo
        if any(kw in t for kw in ["veo", "google", "flow"]):
            return "veo"
        if any(kw in t for kw in ["seedance", "bytedance", "baile", "dance"]):
            return "seedance-pro"
        if any(kw in t for kw in ["wan", "alibaba"]):
            return "wan-fast"
        if any(kw in t for kw in ["grok", "xai"]):
            return "grok-video-pro"
        if any(kw in t for kw in ["rapido", "fast", "quick"]):
            return "ltx-2"
        if any(kw in t for kw in ["largo", "long", "nova", "amazon"]):
            return "nova-reel"

        return None  # Auto-seleccion inteligente

    # ---------------------------------------------------------------------------
    # GUIONES Y STORYBOARDS (funcionalidad original mejorada)
    # ---------------------------------------------------------------------------

    def create_script(self, concept):
        """
        Crea guion cinematográfico completo.
        (Funcionalidad original mantenida)
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
🖼️ Prompt IA: "[prompt para generar esta escena con video IA]"

ESCENA 2 — [00:15-00:30]
...

🎨 PALETA DE COLORES: [hex codes]
📐 FORMATO: [16:9 / 9:16 / 1:1]
🎵 SYNC MUSICAL: [como sincronizar con la musica]

💡 NOTAS DE PRODUCCION:
[consejos para la produccion real]

🤖 MODELOS RECOMENDADOS:
[que motor de video IA usar para cada escena: veo, seedance, wan, etc]"""

        self.scripts_generated += 1
        return call_openrouter(prompt, ARES_SYSTEM_PROMPT, agent_name="ares",
                              temperature=0.8, max_tokens=6000)

    def create_script_result(self, concept):
        """Wrapper que devuelve dict compatible con dispatch."""
        script = self.create_script(concept)
        if script:
            return {"type": "text", "content": script, "caption": "🎬 Guion cinematográfico"}
        return {"type": "error", "content": "❌ No pude generar el guion."}

    def create_storyboard(self, script_summary):
        """Genera storyboard visual (prompts para cada frame)."""
        prompt = f"""Genera un storyboard de 6-8 frames para: {script_summary}

Para cada frame genera:
1. Numero de frame
2. Descripcion visual detallada
3. Prompt para generar el VIDEO con IA (optimizado para Pollinations/Veo/Seedance)
4. Tipo de plano (close-up, wide, medium)
5. Transicion al siguiente frame
6. Modelo recomendado: veo (cinematico), seedance (movimiento), wan (audio), ltx-2 (rapido)"""

        return call_openrouter(prompt, ARES_SYSTEM_PROMPT, agent_name="ares",
                              temperature=0.8, max_tokens=4000)

    def create_storyboard_result(self, text):
        """Wrapper que devuelve dict."""
        result = self.create_storyboard(text)
        if result:
            return {"type": "text", "content": result}
        return {"type": "error", "content": "❌ No pude generar el storyboard."}

    def suggest_visual_style(self, music_description):
        """Sugiere estilo visual para una cancion."""
        prompt = f"""Sugiere un estilo visual completo para este contenido musical: {music_description}

Incluye:
- Paleta de colores (hex)
- Referencias visuales (peliculas, artistas)
- Tipo de video recomendado y motor IA (veo, seedance, wan)
- Mood board conceptual (describe 5 escenas)
- Formato recomendado (vertical/horizontal)
- Duracion recomendada por escena"""

        return call_openrouter(prompt, ARES_SYSTEM_PROMPT, agent_name="ares",
                              temperature=0.8)

    # ---------------------------------------------------------------------------
    # UTILIDADES
    # ---------------------------------------------------------------------------

    def list_video_models(self):
        """Lista modelos disponibles para el usuario."""
        return video_engine.list_models()

    def get_stats(self):
        """Estadísticas del agente."""
        return (
            f"🎬 **ARES — Estadísticas**\n\n"
            f"🎥 Videos generados: {self.videos_generated}\n"
            f"📝 Guiones escritos: {self.scripts_generated}\n"
            f"🤖 Motor: VideoEngine v3.0\n"
            f"📊 Modelos disponibles: {len(VIDEO_MODELS)}\n"
            f"🏆 Último motor usado: {video_engine.last_model_used or 'Ninguno aún'}"
        )
