"""
🎨 PERCHANCE — Generador de Imágenes 100% Gratis
==================================================
Sin API key, sin tarjeta, sin límites conocidos.
80+ estilos disponibles, hasta 32 imágenes por lote.

URL: https://perchance.org/ai-text-to-image-generator

Integración via web scraping del endpoint interno.
"""

import os
import re
import asyncio
import logging
from typing import Dict, List, Optional
from datetime import datetime
from urllib.parse import quote

logger = logging.getLogger("c8l.film.perchance")

try:
    import aiohttp
    AIOHTTP_AVAILABLE = True
except ImportError:
    AIOHTTP_AVAILABLE = False


# ==================================================================
# ESTILOS DISPONIBLES (80+)
# ==================================================================

PERCHANCE_STYLES = {
    # Arte
    'painted': 'Painted',
    'oil_painting': 'Oil Painting',
    'watercolor': 'Watercolor',
    'pixel_art': 'Pixel Art',
    'crayon': 'Crayon Drawing',
    'digital_painting': 'Digital Painting',
    'concept_art': 'Concept Art',
    'realism': 'Oil Painting - Realism',
    # Anime
    'anime': 'Anime',
    'anime_screencap': 'Anime Screencap',
    'cute_anime': 'Cute Anime',
    'soft_anime': 'Soft Anime',
    '3d_anime': '3D Anime',
    # Fotografía
    'photo': 'Photo',
    'professional_photo': 'Professional Photo',
    'cinematic': 'Cinematic',
    'vintage_photo': 'Vintage Photo',
    '1990s_photo': '1990s Photo',
    '1980s_photo': '1980s Photo',
    # Cómic
    'vintage_comic': 'Vintage Comic',
    'franco_belgian': 'Franco-Belgian Comic',
    'tintin': 'Tintin Comic',
    # Fantasy
    'fantasy_painting': 'Fantasy Painting',
    'fantasy_landscape': 'Fantasy Landscape',
    'fantasy_map': 'Fantasy World Map',
    # 3D
    '3d_isometric': '3D Isometric Icon',
    'cute_3d': 'Cute 3D Icon',
    '3d_character': '3D Character',
    # Especial
    'mtg_card': 'MTG Card',
    'tattoo': 'Tattoo Design',
    'claymation': 'Claymation',
    'disney': 'Disney Character',
    'yugioh': 'YuGiOh Art',
    'casual': 'Casual',
    'sticker': 'Sticker',
    'logo': 'Logo',
    # Extras
    'dark_fantasy': 'Dark Fantasy',
    'steampunk': 'Steampunk',
    'cyberpunk': 'Cyberpunk',
    'vaporwave': 'Vaporwave',
    'minimalist': 'Minimalist',
    'abstract': 'Abstract',
    'surreal': 'Surreal',
    'pop_art': 'Pop Art',
    'sketch': 'Sketch',
    'ink': 'Ink Drawing',
}

SHAPES = ['square', 'portrait', 'landscape']
MAX_BATCH = 32


class PerchanceGenerator:
    """
    Generador de imágenes de Perchance.
    100% gratuito, sin API key, sin tarjeta.
    """

    def __init__(self):
        self.base_url = "https://perchance.org/ai-text-to-image-generator"
        self.styles = PERCHANCE_STYLES
        self.generation_count = 0
        self.last_generation = None

    async def generate(self, prompt: str, style: str = "cinematic",
                       shape: str = "square", count: int = 4) -> Dict:
        """
        Genera imágenes con Perchance.

        Args:
            prompt: Descripción de la imagen
            style: Estilo visual (ver PERCHANCE_STYLES)
            shape: square, portrait, landscape
            count: 2-32 imágenes

        Returns:
            Dict con URLs de imágenes generadas
        """
        # Validar parámetros
        if style not in self.styles and style not in self.styles.values():
            style = 'cinematic'
        if shape not in SHAPES:
            shape = 'square'
        count = min(max(count, 2), MAX_BATCH)

        # Resolver nombre de estilo
        style_name = self.styles.get(style, style)

        # Generar via endpoint interno
        result = await self._generate_internal(prompt, style_name, shape, count)

        self.generation_count += 1
        self.last_generation = datetime.now().isoformat()

        return result

    async def _generate_internal(self, prompt: str, style: str,
                                  shape: str, count: int) -> Dict:
        """Genera usando el endpoint interno de Perchance"""
        if not AIOHTTP_AVAILABLE:
            return {'status': 'error', 'error': 'aiohttp no disponible'}

        # Headers que simula un navegador
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'application/json, text/plain, */*',
            'Accept-Language': 'en-US,en;q=0.9,es;q=0.8',
            'Referer': self.base_url,
            'Origin': 'https://perchance.org'
        }

        # Construir URL con estado
        encoded_prompt = quote(prompt)
        state_url = (f"{self.base_url}"
                     f"#prompt={encoded_prompt}"
                     f"&style={quote(style)}"
                     f"&shape={shape}"
                     f"&count={count}")

        try:
            async with aiohttp.ClientSession() as session:
                # Paso 1: Cargar la página para obtener cookies/tokens
                async with session.get(self.base_url, headers=headers,
                                       timeout=aiohttp.ClientTimeout(total=30)) as r:
                    if r.status != 200:
                        raise Exception(f"Page load failed: {r.status}")
                    page_html = await r.text()

                # Paso 2: Extraer el endpoint de generación del HTML
                api_endpoint = self._extract_api_endpoint(page_html)

                if api_endpoint:
                    # Paso 3: Llamar al endpoint de generación
                    payload = {
                        'prompt': prompt,
                        'style': style,
                        'shape': shape,
                        'count': count
                    }

                    async with session.post(api_endpoint, json=payload,
                                            headers=headers,
                                            timeout=aiohttp.ClientTimeout(total=60)) as gen_r:
                        if gen_r.status == 200:
                            data = await gen_r.json()
                            images = data.get('images', [])
                            return {
                                'status': 'success',
                                'images': images,
                                'count': len(images),
                                'style': style,
                                'prompt': prompt,
                                'provider': 'perchance',
                                'cost': 0
                            }

                # Fallback: extraer imágenes del HTML directamente
                images = self._extract_images_from_html(page_html)
                if images:
                    return {
                        'status': 'success',
                        'images': images[:count],
                        'count': len(images[:count]),
                        'style': style,
                        'prompt': prompt,
                        'provider': 'perchance',
                        'method': 'html_scrape',
                        'cost': 0
                    }

                return {
                    'status': 'error',
                    'error': 'No se pudieron extraer imágenes',
                    'state_url': state_url
                }

        except asyncio.TimeoutError:
            return {'status': 'error', 'error': 'Timeout (60s)'}
        except Exception as e:
            logger.error(f"Perchance error: {e}")
            return {'status': 'error', 'error': str(e)}

    def _extract_api_endpoint(self, html: str) -> Optional[str]:
        """Extrae el endpoint API del JavaScript de la página"""
        # Buscar patrones de URL de API en el JS
        patterns = [
            r'["\']https?://[^"\']*api[^"\']*generate[^"\']*["\']',
            r'["\']https?://[^"\']*perchance[^"\']*api[^"\']*["\']',
            r'fetch\(["\']([^"\']+)["\']',
        ]
        for pattern in patterns:
            match = re.search(pattern, html)
            if match:
                url = match.group(0).strip('"\'')
                if 'generate' in url or 'api' in url:
                    return url
        return None

    def _extract_images_from_html(self, html: str) -> List[str]:
        """Extrae URLs de imágenes del HTML"""
        # Buscar todas las URLs de imágenes
        patterns = [
            r'(https://[^"\s]+\.(?:jpg|jpeg|png|webp))',
            r'src="(https://[^"]+\.(?:jpg|jpeg|png|webp))"',
            r'data-src="(https://[^"]+\.(?:jpg|jpeg|png|webp))"',
        ]
        images = set()
        for pattern in patterns:
            matches = re.findall(pattern, html)
            for match in matches:
                if 'perchance' in match or 'generated' in match:
                    images.add(match)
        return list(images)

    # ==================================================================
    # UTILIDADES
    # ==================================================================

    def get_styles(self) -> Dict[str, str]:
        """Retorna todos los estilos disponibles"""
        return self.styles.copy()

    def get_styles_by_category(self) -> Dict[str, List[str]]:
        """Retorna estilos agrupados por categoría"""
        return {
            'Arte': ['painted', 'oil_painting', 'watercolor', 'pixel_art',
                     'crayon', 'digital_painting', 'concept_art'],
            'Anime': ['anime', 'anime_screencap', 'cute_anime',
                      'soft_anime', '3d_anime'],
            'Fotografía': ['photo', 'professional_photo', 'cinematic',
                           'vintage_photo', '1990s_photo'],
            'Cómic': ['vintage_comic', 'franco_belgian', 'tintin'],
            'Fantasy': ['fantasy_painting', 'fantasy_landscape', 'fantasy_map'],
            '3D': ['3d_isometric', 'cute_3d', '3d_character'],
            'Especial': ['mtg_card', 'tattoo', 'claymation', 'disney',
                         'yugioh', 'sticker', 'logo'],
            'Estético': ['cyberpunk', 'steampunk', 'vaporwave',
                         'dark_fantasy', 'pop_art', 'minimalist']
        }

    def get_styles_text(self) -> str:
        """Texto formateado de estilos para mostrar al usuario"""
        categories = self.get_styles_by_category()
        lines = ["🎨 *ESTILOS DISPONIBLES (Perchance):*\n"]

        emoji_map = {
            'Arte': '🖼️', 'Anime': '🎌', 'Fotografía': '📷',
            'Cómic': '💬', 'Fantasy': '🧙', '3D': '🧊',
            'Especial': '✨', 'Estético': '🌈'
        }

        for cat, styles in categories.items():
            emoji = emoji_map.get(cat, '🎨')
            lines.append(f"{emoji} *{cat}:*")
            lines.append(f"  {', '.join(styles)}")
            lines.append("")

        lines.append("💡 Uso: /imagen <prompt> --estilo <nombre>")
        return "\n".join(lines)

    def get_status(self) -> Dict:
        """Estado del generador"""
        return {
            'provider': 'perchance',
            'total_generations': self.generation_count,
            'last_generation': self.last_generation,
            'styles_available': len(self.styles),
            'max_batch': MAX_BATCH,
            'cost': 0,
            'requires_api_key': False
        }
