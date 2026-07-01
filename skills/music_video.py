# -*- coding: utf-8 -*-
"""
🎬 MUSIC VIDEO SKILL — Generador de Videos Musicales con IA
=============================================================
Integración con FreeBeat AI (https://freebeat.ai)
+ Pollinations Video + proveedores existentes del ecosistema.

FreeBeat ofrece:
- Video de baile sincronizado al beat
- Video con letras (karaoke style)
- Videos musicales dirigidos por IA
- Soporte para links de SoundCloud, YouTube, Suno, Udio, TikTok

Este skill orquesta la generación de videos musicales
combinando múltiples proveedores gratuitos.
"""

import logging
import requests
import time
from typing import Optional, Dict, List

logger = logging.getLogger("c8l.skills.music_video")


class MusicVideoSkill:
    """
    Skill de generación de videos musicales.
    Combina FreeBeat AI + Pollinations + proveedores internos.
    """

    FREEBEAT_URL = "https://freebeat.ai"
    POLLINATIONS_VIDEO = "https://gen.pollinations.ai/video"

    # Estilos de video soportados
    STYLES = {
        "dance": "Video de baile sincronizado al beat",
        "lyrics": "Video con letras animadas (karaoke)",
        "cinematic": "Video musical cinematográfico",
        "abstract": "Visualización abstracta de audio",
        "anime": "Estilo anime/manga",
        "retro": "Estilo retro/synthwave",
        "3d": "Renderizado 3D",
        "minimal": "Minimalista/geometric",
    }

    # Plataformas de música soportadas
    SUPPORTED_PLATFORMS = [
        "soundcloud", "youtube", "suno", "udio",
        "tiktok", "spotify", "stable audio", "riffusion",
    ]

    def __init__(self):
        self.generation_count = 0

    def generate_music_video(self, prompt: str, style: str = "cinematic",
                             music_url: str = None,
                             duration: int = 15) -> Dict:
        """
        Genera un video musical con IA.

        Args:
            prompt: Descripción del video deseado
            style: Estilo visual (dance, lyrics, cinematic, etc.)
            music_url: URL de la canción (opcional)
            duration: Duración en segundos

        Returns:
            Dict con info del video generado o instrucciones
        """
        self.generation_count += 1

        # Detectar plataforma de música si hay URL
        platform = self._detect_platform(music_url) if music_url else None

        # Construir el request según el proveedor
        if music_url and platform:
            # FreeBeat AI es ideal para URLs de música
            result = self._generate_via_freebeat(prompt, style, music_url,
                                                  platform, duration)
        else:
            # Sin URL → usar Pollinations o proveedores internos
            result = self._generate_via_pollinations(prompt, style, duration)

        return result

    def get_styles(self) -> str:
        """Lista los estilos disponibles."""
        text = "🎬 *Estilos de Video Musical:*\n\n"
        for key, desc in self.STYLES.items():
            text += f"• `{key}` — {desc}\n"
        text += "\n💡 Usa: `/video musical [estilo] [descripción]`"
        return text

    def _generate_via_freebeat(self, prompt: str, style: str,
                               music_url: str, platform: str,
                               duration: int) -> Dict:
        """
        Genera video via FreeBeat AI.
        FreeBeat acepta links directos de música y genera el video.
        """
        # FreeBeat funciona como webapp — generamos instrucciones
        # para el usuario o usamos su API si hay endpoints públicos

        freebeat_link = (
            f"{self.FREEBEAT_URL}/es?"
            f"music_url={requests.utils.quote(music_url)}"
        )

        return {
            "success": True,
            "provider": "freebeat",
            "type": "redirect",
            "message": (
                f"🎬 *Video Musical con FreeBeat AI*\n\n"
                f"🎵 Plataforma detectada: {platform.title()}\n"
                f"🎨 Estilo: {self.STYLES.get(style, style)}\n"
                f"📝 Prompt: {prompt[:100]}\n\n"
                f"▶️ FreeBeat genera videos sincronizados al beat "
                f"automáticamente. Características:\n"
                f"• Sincronización BPM automática\n"
                f"• Cortes en los drops\n"
                f"• Personajes estables\n"
                f"• Letras sincronizadas\n\n"
                f"🔗 Generar: {freebeat_link}\n\n"
                f"💡 También puedo generar el video aquí con "
                f"Pollinations si prefieres control total."
            ),
            "url": freebeat_link,
            "style": style,
            "platform": platform,
        }

    def _generate_via_pollinations(self, prompt: str, style: str,
                                   duration: int) -> Dict:
        """Genera video via Pollinations (gratuito, sin límite)."""
        try:
            # Construir prompt enriquecido para video
            full_prompt = self._build_video_prompt(prompt, style)

            # Pollinations video endpoint
            params = {
                "prompt": full_prompt,
                "duration": min(duration, 15),
                "width": 1280,
                "height": 720,
            }

            # Intentar generar
            response = requests.post(
                self.POLLINATIONS_VIDEO,
                json=params,
                timeout=60,
            )

            if response.status_code == 200:
                return {
                    "success": True,
                    "provider": "pollinations",
                    "type": "video",
                    "video_bytes": response.content,
                    "message": (
                        f"🎬 Video musical generado!\n"
                        f"🎨 Estilo: {style}\n"
                        f"⏱️ Duración: {duration}s"
                    ),
                }
            else:
                logger.warning(f"Pollinations video error: {response.status_code}")

        except Exception as e:
            logger.error(f"Video generation error: {e}")

        # Fallback: dar instrucciones
        return {
            "success": False,
            "provider": "none",
            "type": "error",
            "message": (
                f"⚠️ No pude generar el video directamente.\n\n"
                f"💡 Alternativas gratuitas:\n"
                f"• FreeBeat AI: {self.FREEBEAT_URL}\n"
                f"• Puedes enviarme un link de tu canción "
                f"y te preparo el video con estilo {style}"
            ),
        }

    def _build_video_prompt(self, prompt: str, style: str) -> str:
        """Construye prompt optimizado para generación de video."""
        style_modifiers = {
            "dance": "dynamic dance choreography, synchronized movement, stage lighting",
            "lyrics": "text animation, kinetic typography, lyrics on screen",
            "cinematic": "cinematic shots, dramatic lighting, film quality",
            "abstract": "abstract visuals, audio reactive, geometric patterns",
            "anime": "anime style animation, manga aesthetic, vivid colors",
            "retro": "synthwave aesthetic, neon colors, 80s retro",
            "3d": "3D rendered, octane render, volumetric lighting",
            "minimal": "minimalist design, clean geometry, subtle movement",
        }

        modifier = style_modifiers.get(style, "music video")
        return f"{prompt}, {modifier}, music video, 4K quality"

    def _detect_platform(self, url: str) -> Optional[str]:
        """Detecta la plataforma de música desde la URL."""
        if not url:
            return None
        url_lower = url.lower()
        for platform in self.SUPPORTED_PLATFORMS:
            if platform in url_lower:
                return platform
        if "youtu" in url_lower:
            return "youtube"
        if "spotify" in url_lower:
            return "spotify"
        return "unknown"
