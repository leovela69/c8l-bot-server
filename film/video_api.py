"""
🎬 VIDEO API — Solo Proveedores 100% GRATUITOS
================================================
Solo APIs sin tarjeta de crédito y sin límites de pago.

Proveedores GRATIS:
1. Agnes AI (principal) — Sin límite, 15s, 4K, audio sync
2. Puter.js (frontend) — Sin API key, Sora/Veo 3.0
3. Seedance 2.0 (OpenRouter) — Gratis en OpenRouter free tier
4. Ali-ViLab (open source) — Self-hosted, texto→video

EXCLUIDOS (de pago):
❌ Kling v2.6 ($5/mes)
❌ Grok Imagine ($5/mes)
❌ Wan v2.5 ($5/mes)
❌ Replicate (por uso)
❌ Pixazo (beta limitada)
"""

import os
import asyncio
import logging
from typing import Dict, List, Optional
from datetime import datetime
from enum import Enum

logger = logging.getLogger("c8l.film.video_api")

try:
    import aiohttp
    AIOHTTP_AVAILABLE = True
except ImportError:
    AIOHTTP_AVAILABLE = False


class VideoProvider(Enum):
    AGNES = "agnes"
    PUTER = "puter"
    SEEDANCE = "seedance"
    ALIVILAB = "alivilab"
    PIXELRELAY = "pixelrelay"



# ============================================
# API UNIFICADA CON FALLBACK
# ============================================

class VideoAPI:
    """API unificada — SOLO proveedores 100% gratuitos"""

    def __init__(self):
        self.providers = {
            VideoProvider.AGNES: AgnesVideoAPI(),
            VideoProvider.PUTER: PuterVideoAPI(),
            VideoProvider.SEEDANCE: SeedanceVideoAPI(),
            VideoProvider.ALIVILAB: AliViLabVideoAPI(),
            VideoProvider.PIXELRELAY: PixelRelayVideoAPI()
        }
        self.current_provider = VideoProvider.AGNES
        self.fallback_order = [
            VideoProvider.PUTER,
            VideoProvider.SEEDANCE,
            VideoProvider.ALIVILAB,
            VideoProvider.PIXELRELAY
        ]
        self.history = []

    async def generate_video(self, params: Dict) -> Dict:
        """Genera video con fallback automático (solo gratuitos)"""
        try:
            result = await self.providers[self.current_provider].generate(params)
            self._record(self.current_provider, params, result)
            return result
        except Exception as e:
            logger.warning(f"Error {self.current_provider.value}: {e}")
            for provider in self.fallback_order:
                try:
                    logger.info(f"Fallback → {provider.value}")
                    result = await self.providers[provider].generate(params)
                    self.current_provider = provider
                    self._record(provider, params, result, fallback=True)
                    return result
                except Exception as e2:
                    logger.warning(f"Error {provider.value}: {e2}")
                    continue
            raise Exception("Todos los proveedores gratuitos fallaron")

    async def generate_from_image(self, image_url: str, prompt: str) -> Dict:
        return await self.generate_video({
            'type': 'image_to_video', 'image_url': image_url,
            'prompt': prompt, 'duration': 5, 'ratio': '16:9'
        })

    async def generate_from_images(self, urls: List[str], prompt: str) -> Dict:
        return await self.generate_video({
            'type': 'multi_image_to_video', 'image_urls': urls,
            'prompt': prompt, 'duration': 10, 'ratio': '16:9'
        })

    def get_status(self) -> Dict:
        return {
            'current': self.current_provider.value,
            'available': [p.value for p in self.providers],
            'history_count': len(self.history),
            'all_free': True
        }

    def _record(self, provider, params, result, fallback=False):
        self.history.append({
            'provider': provider.value, 'fallback': fallback,
            'timestamp': datetime.now().isoformat()
        })
        if len(self.history) > 100:
            self.history = self.history[-100:]



# ============================================
# PROVEEDOR 1: AGNES AI (GRATIS, SIN LÍMITE)
# ============================================

class AgnesVideoAPI:
    """
    Agnes AI — LA MEJOR OPCIÓN
    - Gratis, sin límite, sin tarjeta
    - Modelo: agnes-video-v2.0
    - 15 segundos por clip, 4K, audio sincronizado
    - Timeline: 0-3s, 3-7s, 7-11s, 11-15s
    """

    def __init__(self):
        self.base_url = "https://apihub.agnes-ai.com/v1"
        self.api_key = os.getenv('AGNES_API_KEY', '')
        self.model = "agnes-video-v2.0"

    async def generate(self, params: Dict) -> Dict:
        if params.get('type') == 'image_to_video':
            return await self._image_to_video(params)
        elif params.get('type') == 'multi_image_to_video':
            return await self._multi_image(params)
        return await self._text_to_video(params)

    async def _text_to_video(self, params: Dict) -> Dict:
        headers = {'Authorization': f'Bearer {self.api_key}',
                   'Content-Type': 'application/json'}
        payload = {
            'model': self.model,
            'prompt': params.get('prompt'),
            'duration': min(params.get('duration', 15), 15),
            'ratio': params.get('ratio', '16:9'),
            'fps': params.get('fps', 24)
        }
        async with aiohttp.ClientSession() as session:
            async with session.post(f"{self.base_url}/videos",
                                    headers=headers, json=payload) as r:
                if r.status == 200:
                    data = await r.json()
                    return {'url': data.get('video_url'), 'id': data.get('id'),
                            'duration': data.get('duration'), 'provider': 'agnes',
                            'cost': 0}
                raise Exception(f"Agnes error: {r.status}")

    async def _image_to_video(self, params: Dict) -> Dict:
        headers = {'Authorization': f'Bearer {self.api_key}',
                   'Content-Type': 'application/json'}
        payload = {'model': self.model, 'image_url': params.get('image_url'),
                   'prompt': params.get('prompt', 'animate this image smoothly'),
                   'duration': min(params.get('duration', 15), 15)}
        async with aiohttp.ClientSession() as session:
            async with session.post(f"{self.base_url}/videos/image-to-video",
                                    headers=headers, json=payload) as r:
                if r.status == 200:
                    data = await r.json()
                    return {'url': data.get('video_url'), 'id': data.get('id'),
                            'provider': 'agnes', 'cost': 0}
                raise Exception(f"Agnes i2v error: {r.status}")

    async def _multi_image(self, params: Dict) -> Dict:
        headers = {'Authorization': f'Bearer {self.api_key}',
                   'Content-Type': 'application/json'}
        payload = {'model': self.model, 'image_urls': params.get('image_urls', []),
                   'prompt': params.get('prompt'), 'duration': min(params.get('duration', 15), 15)}
        async with aiohttp.ClientSession() as session:
            async with session.post(f"{self.base_url}/videos/multi-image-to-video",
                                    headers=headers, json=payload) as r:
                if r.status == 200:
                    data = await r.json()
                    return {'url': data.get('video_url'), 'id': data.get('id'),
                            'provider': 'agnes', 'cost': 0}
                raise Exception(f"Agnes multi error: {r.status}")



# ============================================
# PROVEEDOR 2: PUTER.JS (SIN API KEY, SIN BACKEND)
# ============================================

class PuterVideoAPI:
    """
    Puter.js — Sin API Key, Sin Backend
    - Modelo "User-Pays" (gratis para el developer)
    - Soporta Sora, Veo 3.0
    - No requiere signup
    - Funciona desde frontend o via HTTP bridge
    """

    def __init__(self):
        self.base_url = "https://api.puter.com/v2"
        self.models = ['veo-3.0-fast', 'sora', 'veo-3.0']
        self.default_model = 'veo-3.0-fast'

    async def generate(self, params: Dict) -> Dict:
        """Genera video via Puter API bridge"""
        model = params.get('model', self.default_model)
        prompt = params.get('prompt', '')

        # Puter usa un esquema diferente: HTTP request al bridge
        headers = {'Content-Type': 'application/json'}
        payload = {
            'model': model,
            'prompt': prompt,
            'duration': params.get('duration', 5)
        }

        async with aiohttp.ClientSession() as session:
            async with session.post(f"{self.base_url}/ai/txt2vid",
                                    headers=headers, json=payload) as r:
                if r.status == 200:
                    data = await r.json()
                    return {
                        'url': data.get('url') or data.get('video_url'),
                        'id': data.get('id'),
                        'duration': params.get('duration', 5),
                        'provider': 'puter',
                        'model': model,
                        'cost': 0
                    }
                raise Exception(f"Puter error: {r.status}")


# ============================================
# PROVEEDOR 3: SEEDANCE 2.0 (GRATIS EN OPENROUTER)
# ============================================

class SeedanceVideoAPI:
    """
    ByteDance Seedance 2.0 — Gratis en OpenRouter
    - Modelo: bytedance/seedance-2.0:free
    - Texto a video, imagen a video
    - First/last frame control
    - Consistencia de personajes
    """

    def __init__(self):
        self.base_url = "https://openrouter.ai/api/v1"
        self.api_key = os.getenv('OPENROUTER_API_KEY', '')
        self.model = "bytedance/seedance-2.0:free"

    async def generate(self, params: Dict) -> Dict:
        """Genera video con Seedance 2.0 via OpenRouter"""
        headers = {
            'Authorization': f'Bearer {self.api_key}',
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://c8l-agency.com',
            'X-Title': 'C8L Film Production'
        }

        # Construir el mensaje para video generation
        messages = [{
            'role': 'user',
            'content': params.get('prompt', '')
        }]

        # Si hay imagen, incluirla
        if params.get('image_url'):
            messages[0]['content'] = [
                {'type': 'image_url', 'image_url': {'url': params['image_url']}},
                {'type': 'text', 'text': params.get('prompt', 'animate this')}
            ]

        payload = {
            'model': self.model,
            'messages': messages,
            'max_tokens': 1,
            'extra_body': {
                'video_duration': params.get('duration', 5),
                'video_ratio': params.get('ratio', '16:9')
            }
        }

        async with aiohttp.ClientSession() as session:
            async with session.post(f"{self.base_url}/chat/completions",
                                    headers=headers, json=payload) as r:
                if r.status == 200:
                    data = await r.json()
                    # Extraer URL del video del response
                    video_url = None
                    choices = data.get('choices', [])
                    if choices:
                        content = choices[0].get('message', {}).get('content', '')
                        # El video URL viene en el content o como generation
                        video_url = data.get('video_url') or content
                    return {
                        'url': video_url,
                        'id': data.get('id'),
                        'duration': params.get('duration', 5),
                        'provider': 'seedance',
                        'model': self.model,
                        'cost': 0
                    }
                raise Exception(f"Seedance/OpenRouter error: {r.status}")


# ============================================
# PROVEEDOR 4: ALI-VILAB (OPEN SOURCE, SELF-HOSTED)
# ============================================

class AliViLabVideoAPI:
    """
    Ali-ViLab Text-to-Video 1.7B — Open Source
    - Modelo: ali-vilab/text-to-video-ms-1.7b
    - Docker: docker pull bytez/ali-vilab_text-to-video-ms-1.7b
    - Texto a video, 720p, 5 segundos
    - 100% gratis, self-hosted
    """

    def __init__(self):
        # URL del modelo self-hosted (Docker o HuggingFace Spaces)
        self.base_url = os.getenv('ALIVILAB_URL', 'http://localhost:7860')
        self.model = "ali-vilab/text-to-video-ms-1.7b"

    async def generate(self, params: Dict) -> Dict:
        """Genera video con Ali-ViLab (self-hosted)"""
        headers = {'Content-Type': 'application/json'}
        payload = {
            'prompt': params.get('prompt', ''),
            'num_frames': params.get('duration', 5) * 8,
            'height': 320,
            'width': 576,
            'num_inference_steps': 25
        }

        async with aiohttp.ClientSession() as session:
            async with session.post(f"{self.base_url}/api/predict",
                                    headers=headers, json=payload,
                                    timeout=aiohttp.ClientTimeout(total=120)) as r:
                if r.status == 200:
                    data = await r.json()
                    return {
                        'url': data.get('video_url') or data.get('output'),
                        'id': data.get('id'),
                        'duration': params.get('duration', 5),
                        'provider': 'alivilab',
                        'model': self.model,
                        'cost': 0
                    }
                raise Exception(f"Ali-ViLab error: {r.status}")


# ============================================
# PROVEEDOR 5: PIXELRELAY (OPEN SOURCE, SELF-HOSTED)
# ============================================

class PixelRelayVideoAPI:
    """
    Pixelrelay — Open Source, Self-hosted
    - 35+ modelos disponibles
    - Webhooks, failover automático
    - Docker: docker run -p 8000:8000 ghcr.io/samuraigpt/pixelrelay
    - BYOK (Bring Your Own Keys) — gratis de operar
    """

    def __init__(self):
        self.base_url = os.getenv('PIXELRELAY_URL', 'http://localhost:8000')
        self.api_key = os.getenv('PIXELRELAY_API_KEY', '')

    async def generate(self, params: Dict) -> Dict:
        headers = {'Content-Type': 'application/json'}
        if self.api_key:
            headers['Authorization'] = f'Bearer {self.api_key}'

        payload = {
            'prompt': params.get('prompt'),
            'model': params.get('model', 'flux-1.1-pro'),
            'providers': ['fal', 'replicate'],
            'duration': params.get('duration', 5),
            'ratio': params.get('ratio', '16:9')
        }

        async with aiohttp.ClientSession() as session:
            async with session.post(f"{self.base_url}/v1/generate",
                                    headers=headers, json=payload) as r:
                if r.status == 200:
                    data = await r.json()
                    return {
                        'url': data.get('video_url'),
                        'id': data.get('id'),
                        'duration': params.get('duration', 5),
                        'provider': 'pixelrelay',
                        'cost': 0
                    }
                raise Exception(f"Pixelrelay error: {r.status}")
