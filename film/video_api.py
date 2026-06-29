"""
🎬 VIDEO API — 5 Proveedores con Fallback Automático
=====================================================
Proveedores:
1. Agnes AI (principal)
2. Free-Scene (multi-escena)
3. Pixelrelay (multi-proveedor)
4. Jimeng (imagen→video)
5. Replicate (backup)
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
    FREE_SCENE = "free_scene"
    PIXELRELAY = "pixelrelay"
    JIMENG = "jimeng"
    REPLICATE = "replicate"



class VideoAPI:
    """API unificada para generación de video con fallback"""

    def __init__(self):
        self.providers = {
            VideoProvider.AGNES: AgnesVideoAPI(),
            VideoProvider.FREE_SCENE: FreeSceneVideoAPI(),
            VideoProvider.PIXELRELAY: PixelRelayVideoAPI(),
            VideoProvider.JIMENG: JimengVideoAPI(),
            VideoProvider.REPLICATE: ReplicateVideoAPI()
        }
        self.current_provider = VideoProvider.AGNES
        self.fallback_order = [
            VideoProvider.FREE_SCENE,
            VideoProvider.PIXELRELAY,
            VideoProvider.JIMENG,
            VideoProvider.REPLICATE
        ]
        self.history = []

    async def generate_video(self, params: Dict) -> Dict:
        """Genera video con fallback automático"""
        # Intentar proveedor principal
        try:
            result = await self.providers[self.current_provider].generate(params)
            self._record(self.current_provider, params, result)
            return result
        except Exception as e:
            logger.warning(f"Error {self.current_provider.value}: {e}")

            # Fallback
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

            raise Exception("Todos los proveedores fallaron")

    async def generate_from_image(self, image_url: str, prompt: str) -> Dict:
        return await self.generate_video({
            'type': 'image_to_video', 'image_url': image_url,
            'prompt': prompt, 'duration': 5, 'ratio': '16:9'
        })

    async def generate_from_images(self, image_urls: List[str], prompt: str) -> Dict:
        return await self.generate_video({
            'type': 'multi_image_to_video', 'image_urls': image_urls,
            'prompt': prompt, 'duration': 10, 'ratio': '16:9'
        })

    def _record(self, provider, params, result, fallback=False):
        self.history.append({
            'provider': provider.value, 'params': params,
            'result': result, 'fallback': fallback,
            'timestamp': datetime.now().isoformat()
        })
        if len(self.history) > 100:
            self.history = self.history[-100:]



# ============================================
# PROVEEDOR 1: AGNES AI
# ============================================

class AgnesVideoAPI:
    """Agnes AI — Video generativo gratuito"""

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
        headers = {'Authorization': f'Bearer {self.api_key}', 'Content-Type': 'application/json'}
        payload = {
            'model': self.model, 'prompt': params.get('prompt'),
            'duration': params.get('duration', 5),
            'ratio': params.get('ratio', '16:9'), 'fps': params.get('fps', 24)
        }
        async with aiohttp.ClientSession() as session:
            async with session.post(f"{self.base_url}/videos", headers=headers, json=payload) as r:
                if r.status == 200:
                    data = await r.json()
                    return {'url': data.get('video_url'), 'id': data.get('id'),
                            'duration': data.get('duration'), 'provider': 'agnes'}
                raise Exception(f"Agnes error: {r.status}")

    async def _image_to_video(self, params: Dict) -> Dict:
        headers = {'Authorization': f'Bearer {self.api_key}', 'Content-Type': 'application/json'}
        payload = {'model': self.model, 'image_url': params.get('image_url'),
                   'prompt': params.get('prompt', 'animate'), 'duration': params.get('duration', 5)}
        async with aiohttp.ClientSession() as session:
            async with session.post(f"{self.base_url}/videos/image-to-video", headers=headers, json=payload) as r:
                if r.status == 200:
                    data = await r.json()
                    return {'url': data.get('video_url'), 'id': data.get('id'), 'provider': 'agnes'}
                raise Exception(f"Agnes i2v error: {r.status}")

    async def _multi_image(self, params: Dict) -> Dict:
        headers = {'Authorization': f'Bearer {self.api_key}', 'Content-Type': 'application/json'}
        payload = {'model': self.model, 'image_urls': params.get('image_urls', []),
                   'prompt': params.get('prompt'), 'duration': params.get('duration', 10)}
        async with aiohttp.ClientSession() as session:
            async with session.post(f"{self.base_url}/videos/multi-image-to-video", headers=headers, json=payload) as r:
                if r.status == 200:
                    data = await r.json()
                    return {'url': data.get('video_url'), 'id': data.get('id'), 'provider': 'agnes'}
                raise Exception(f"Agnes multi error: {r.status}")



# ============================================
# PROVEEDOR 2: FREE-SCENE
# ============================================

class FreeSceneVideoAPI:
    """Free-Scene — Películas multi-escena"""

    def __init__(self):
        self.base_url = "https://api.free-scene.ai/v1"
        self.api_key = os.getenv('FREE_SCENE_API_KEY', '')

    async def generate(self, params: Dict) -> Dict:
        if params.get('type') == 'multi_scene':
            return await self._movie(params)
        return await self._scene(params)

    async def _movie(self, params: Dict) -> Dict:
        headers = {'Authorization': f'Bearer {self.api_key}', 'Content-Type': 'application/json'}
        payload = {'prompt': params.get('prompt'), 'scenes': params.get('scenes', 5),
                   'style': params.get('style', 'cinematic'), 'duration': params.get('duration', 4)}
        async with aiohttp.ClientSession() as session:
            async with session.post(f"{self.base_url}/movies", headers=headers, json=payload) as r:
                if r.status == 200:
                    data = await r.json()
                    return {'url': data.get('video_url'), 'scenes': data.get('scenes', []), 'provider': 'free_scene'}
                raise Exception(f"Free-scene movie error: {r.status}")

    async def _scene(self, params: Dict) -> Dict:
        headers = {'Authorization': f'Bearer {self.api_key}', 'Content-Type': 'application/json'}
        payload = {'prompt': params.get('prompt'), 'style': params.get('style', 'cinematic'),
                   'duration': params.get('duration', 4)}
        async with aiohttp.ClientSession() as session:
            async with session.post(f"{self.base_url}/scenes", headers=headers, json=payload) as r:
                if r.status == 200:
                    data = await r.json()
                    return {'url': data.get('video_url'), 'id': data.get('id'), 'provider': 'free_scene'}
                raise Exception(f"Free-scene error: {r.status}")


# ============================================
# PROVEEDOR 3: PIXELRELAY
# ============================================

class PixelRelayVideoAPI:
    """Pixelrelay — Multi-proveedor con failover"""

    def __init__(self):
        self.base_url = os.getenv('PIXELRELAY_URL', 'http://localhost:8000')
        self.api_key = os.getenv('PIXELRELAY_API_KEY', '')

    async def generate(self, params: Dict) -> Dict:
        headers = {'Authorization': f'Bearer {self.api_key}', 'Content-Type': 'application/json'}
        payload = {'prompt': params.get('prompt'), 'model': params.get('model', 'flux-1.1-pro'),
                   'providers': ['fal', 'replicate'], 'duration': params.get('duration', 5)}
        async with aiohttp.ClientSession() as session:
            async with session.post(f"{self.base_url}/v1/generate", headers=headers, json=payload) as r:
                if r.status == 200:
                    data = await r.json()
                    return {'url': data.get('video_url'), 'id': data.get('id'), 'provider': 'pixelrelay'}
                raise Exception(f"Pixelrelay error: {r.status}")


# ============================================
# PROVEEDOR 4: JIMENG
# ============================================

class JimengVideoAPI:
    """Jimeng — Video desde imágenes (Seedance 2.0)"""

    def __init__(self):
        self.base_url = "https://api.jimeng.ai/v1"
        self.api_key = os.getenv('JIMENG_API_KEY', '')

    async def generate(self, params: Dict) -> Dict:
        if params.get('image_url'):
            return await self._i2v(params)
        elif params.get('image_urls'):
            return await self._multi(params)
        return await self._t2v(params)

    async def _t2v(self, params: Dict) -> Dict:
        headers = {'Authorization': f'Bearer {self.api_key}'}
        payload = {'model': 'jimeng-video-3.5-pro', 'prompt': params.get('prompt'),
                   'duration': params.get('duration', 5)}
        async with aiohttp.ClientSession() as session:
            async with session.post(f"{self.base_url}/videos/text-to-video", headers=headers, json=payload) as r:
                if r.status == 200:
                    data = await r.json()
                    return {'url': data.get('video_url'), 'provider': 'jimeng'}
                raise Exception(f"Jimeng t2v error: {r.status}")

    async def _i2v(self, params: Dict) -> Dict:
        headers = {'Authorization': f'Bearer {self.api_key}'}
        payload = {'model': 'seedance-2.0', 'image_url': params.get('image_url'),
                   'prompt': params.get('prompt', 'animate'), 'duration': params.get('duration', 5)}
        async with aiohttp.ClientSession() as session:
            async with session.post(f"{self.base_url}/videos/image-to-video", headers=headers, json=payload) as r:
                if r.status == 200:
                    data = await r.json()
                    return {'url': data.get('video_url'), 'provider': 'jimeng'}
                raise Exception(f"Jimeng i2v error: {r.status}")

    async def _multi(self, params: Dict) -> Dict:
        headers = {'Authorization': f'Bearer {self.api_key}'}
        payload = {'model': 'seedance-2.0', 'image_urls': params.get('image_urls'),
                   'prompt': params.get('prompt'), 'duration': params.get('duration', 10)}
        async with aiohttp.ClientSession() as session:
            async with session.post(f"{self.base_url}/videos/multi-image-to-video", headers=headers, json=payload) as r:
                if r.status == 200:
                    data = await r.json()
                    return {'url': data.get('video_url'), 'provider': 'jimeng'}
                raise Exception(f"Jimeng multi error: {r.status}")


# ============================================
# PROVEEDOR 5: REPLICATE (Backup)
# ============================================

class ReplicateVideoAPI:
    """Replicate — Stable Video Diffusion / Zeroscope"""

    def __init__(self):
        self.api_key = os.getenv('REPLICATE_API_KEY', '')
        self.base_url = "https://api.replicate.com/v1"
        self.model = "stability-ai/stable-video-diffusion:3f0457e4619daac51203dedb472816fd4af51f3149fa7a9e0b5ffcf1b8172438"

    async def generate(self, params: Dict) -> Dict:
        headers = {'Authorization': f'Token {self.api_key}', 'Content-Type': 'application/json'}
        payload = {'version': self.model, 'input': {
            'prompt': params.get('prompt'), 'num_frames': params.get('duration', 5) * 6,
            'fps': 24, 'width': 1024, 'height': 576
        }}
        if params.get('image_url'):
            payload['input']['input_image'] = params['image_url']

        async with aiohttp.ClientSession() as session:
            async with session.post(f"{self.base_url}/predictions", headers=headers, json=payload) as r:
                if r.status == 201:
                    data = await r.json()
                    pid = data.get('id')
                    # Poll for completion
                    for _ in range(60):
                        async with session.get(f"{self.base_url}/predictions/{pid}", headers=headers) as sr:
                            sd = await sr.json()
                            if sd.get('status') == 'succeeded':
                                return {'url': sd.get('output'), 'id': pid, 'provider': 'replicate'}
                            elif sd.get('status') == 'failed':
                                raise Exception(f"Replicate failed: {sd.get('error')}")
                            await asyncio.sleep(3)
                    raise Exception("Replicate timeout")
                raise Exception(f"Replicate error: {r.status}")
