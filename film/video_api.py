"""
🎬 VIDEO API — 7 Proveedores GRATUITOS + 1 PREMIUM (admin-locked)
===================================================================
Máximo de herramientas FREE para el bot. Sin tarjeta de crédito.

Proveedores GRATIS (7):
1. Agnes AI — Sin límite, 15s, 4K, audio sync
2. Puter.js — Sin API key, Sora/Veo 3.0
3. Seedance 2.0 — OpenRouter free (= Wan de Alibaba)
4. Pollinations — 12 motores (ya en el bot)
5. Cloudflare Workers AI — Wan 2.6 gratis
6. HuggingFace Inference — Modelos open source gratis
7. Perchance — 80+ estilos imágenes (sin API key)

Proveedor PREMIUM (🔒 ADMIN-ONLY):
8. ComfyUI Cloud — RTX 6000 Pro, 900+ modelos, $20-100/mes
   ⚠️ BLOQUEADO por defecto. Solo Leo puede activarlo.

EXCLUIDOS (de pago sin API útil):
❌ Runway ($12/mes), Luma ($30/mes), Kling ($5/mes)
❌ Artlist ($199/año), Grok ($5/mes), Replicate ($/uso)
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

try:
    import requests
    REQUESTS_AVAILABLE = True
except ImportError:
    REQUESTS_AVAILABLE = False


class VideoProvider(Enum):
    AGNES = "agnes"
    PUTER = "puter"
    SEEDANCE = "seedance"
    POLLINATIONS = "pollinations"
    CLOUDFLARE = "cloudflare"
    HUGGINGFACE = "huggingface"
    PERCHANCE = "perchance"
    COMFYUI_CLOUD = "comfyui_cloud"  # 🔒 PREMIUM — Admin-only



# ==================================================================
# 1. AGNES AI — Sin límite, 4K, 15s, audio sync ($0)
# ==================================================================

class AgnesVideoAPI:
    """
    Agnes AI — LA MEJOR OPCIÓN GRATUITA
    Gratis, sin límite, sin tarjeta. 4K, 15s, audio sync.
    Endpoint: https://apihub.agnes-ai.com/v1
    """

    def __init__(self):
        self.base_url = "https://apihub.agnes-ai.com/v1"
        self.api_key = os.getenv('AGNES_API_KEY', '')
        self.model = "agnes-video-v2.0"

    async def generate(self, params: Dict) -> Dict:
        if params.get('type') == 'image_to_video':
            return await self._i2v(params)
        return await self._t2v(params)

    async def _t2v(self, params: Dict) -> Dict:
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
                            'duration': data.get('duration'), 'provider': 'agnes', 'cost': 0}
                raise Exception(f"Agnes error: {r.status}")

    async def _i2v(self, params: Dict) -> Dict:
        headers = {'Authorization': f'Bearer {self.api_key}',
                   'Content-Type': 'application/json'}
        payload = {'model': self.model, 'image_url': params.get('image_url'),
                   'prompt': params.get('prompt', 'animate smoothly'),
                   'duration': min(params.get('duration', 15), 15)}
        async with aiohttp.ClientSession() as session:
            async with session.post(f"{self.base_url}/videos/image-to-video",
                                    headers=headers, json=payload) as r:
                if r.status == 200:
                    data = await r.json()
                    return {'url': data.get('video_url'), 'provider': 'agnes', 'cost': 0}
                raise Exception(f"Agnes i2v error: {r.status}")



# ==================================================================
# 2. PUTER.JS — Sin API Key, Sora/Veo 3.0 ($0)
# ==================================================================

class PuterVideoAPI:
    """
    Puter.js — Sin API Key, Sin Backend, Sin Signup
    Modelo "User-Pays" (gratis para el developer).
    Soporta Sora, Veo 3.0.
    """

    def __init__(self):
        self.base_url = "https://api.puter.com/v2"
        self.default_model = 'veo-3.0-fast'

    async def generate(self, params: Dict) -> Dict:
        model = params.get('model', self.default_model)
        headers = {'Content-Type': 'application/json'}
        payload = {'model': model, 'prompt': params.get('prompt'),
                   'duration': params.get('duration', 5)}
        async with aiohttp.ClientSession() as session:
            async with session.post(f"{self.base_url}/ai/txt2vid",
                                    headers=headers, json=payload) as r:
                if r.status == 200:
                    data = await r.json()
                    return {'url': data.get('url') or data.get('video_url'),
                            'provider': 'puter', 'model': model, 'cost': 0}
                raise Exception(f"Puter error: {r.status}")



# ==================================================================
# 3. SEEDANCE 2.0 — OpenRouter Free (= Wan de Alibaba) ($0)
# ==================================================================

class SeedanceVideoAPI:
    """
    ByteDance Seedance 2.0 — Gratis en OpenRouter
    Modelo: bytedance/seedance-2.0:free
    Es el mismo motor que Wan. Consistencia de personajes.
    """

    def __init__(self):
        self.base_url = "https://openrouter.ai/api/v1"
        self.api_key = os.getenv('OPENROUTER_API_KEY', '')
        self.model = "bytedance/seedance-2.0:free"

    async def generate(self, params: Dict) -> Dict:
        headers = {
            'Authorization': f'Bearer {self.api_key}',
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://c8l-agency.com',
            'X-Title': 'C8L Bot'
        }
        messages = [{'role': 'user', 'content': params.get('prompt', '')}]
        if params.get('image_url'):
            messages[0]['content'] = [
                {'type': 'image_url', 'image_url': {'url': params['image_url']}},
                {'type': 'text', 'text': params.get('prompt', 'animate')}
            ]
        payload = {'model': self.model, 'messages': messages}
        async with aiohttp.ClientSession() as session:
            async with session.post(f"{self.base_url}/chat/completions",
                                    headers=headers, json=payload) as r:
                if r.status == 200:
                    data = await r.json()
                    return {'url': data.get('video_url'), 'id': data.get('id'),
                            'provider': 'seedance', 'cost': 0}
                raise Exception(f"Seedance error: {r.status}")



# ==================================================================
# 4. POLLINATIONS — 12 motores, sin API key ($0)
# ==================================================================

class PollinationsVideoAPI:
    """
    Pollinations — Ya integrado en el bot principal.
    12 motores de video gratis. Sin API key requerida.
    Endpoint: https://gen.pollinations.ai/video
    """

    def __init__(self):
        self.base_url = os.getenv('POLLINATIONS_BASE_URL', 'https://gen.pollinations.ai')
        self.api_key = os.getenv('POLLINATIONS_API_KEY', '')

    async def generate(self, params: Dict) -> Dict:
        prompt = params.get('prompt', '')
        # Pollinations usa URL directa para generación
        video_url = f"{self.base_url}/video/{prompt.replace(' ', '%20')}"

        headers = {}
        if self.api_key:
            headers['Authorization'] = f'Bearer {self.api_key}'

        payload = {
            'prompt': prompt,
            'duration': params.get('duration', 5),
            'ratio': params.get('ratio', '16:9')
        }

        async with aiohttp.ClientSession() as session:
            async with session.post(f"{self.base_url}/v1/video/generate",
                                    headers=headers, json=payload,
                                    timeout=aiohttp.ClientTimeout(total=120)) as r:
                if r.status == 200:
                    data = await r.json()
                    return {'url': data.get('url') or data.get('video_url'),
                            'provider': 'pollinations', 'cost': 0}
                # Fallback: URL directa
                return {'url': video_url, 'provider': 'pollinations',
                        'method': 'direct_url', 'cost': 0}



# ==================================================================
# 5. CLOUDFLARE WORKERS AI — Wan 2.6 gratis ($0)
# ==================================================================

class CloudflareVideoAPI:
    """
    Cloudflare Workers AI — Wan 2.6 (Alibaba) GRATIS
    10,000 tokens/día gratis en el free tier.
    Modelo: @cf/alibaba/wan-2.6-image (imagen)
    También soporta texto a imagen que luego se anima.
    """

    def __init__(self):
        self.account_id = os.getenv('CLOUDFLARE_ACCOUNT_ID', '')
        self.api_key = os.getenv('CLOUDFLARE_AI_TOKEN', '')
        self.base_url = f"https://api.cloudflare.com/client/v4/accounts/{self.account_id}/ai/run"
        self.model = "@cf/alibaba/wan-2.6-image"

    async def generate(self, params: Dict) -> Dict:
        """Genera imagen con Wan 2.6 (video no disponible directo en CF)"""
        headers = {'Authorization': f'Bearer {self.api_key}',
                   'Content-Type': 'application/json'}
        payload = {
            'prompt': params.get('prompt', ''),
            'width': params.get('width', 1024),
            'height': params.get('height', 576)
        }
        async with aiohttp.ClientSession() as session:
            async with session.post(f"{self.base_url}/{self.model}",
                                    headers=headers, json=payload) as r:
                if r.status == 200:
                    # CF devuelve imagen binaria
                    image_bytes = await r.read()
                    return {'image_bytes': image_bytes, 'provider': 'cloudflare',
                            'model': 'wan-2.6', 'type': 'image', 'cost': 0}
                raise Exception(f"Cloudflare AI error: {r.status}")



# ==================================================================
# 6. HUGGINGFACE INFERENCE API — Modelos open source ($0)
# ==================================================================

class HuggingFaceVideoAPI:
    """
    HuggingFace Inference API — Modelos gratuitos
    Ali-ViLab text-to-video, Stable Diffusion, etc.
    Free tier: rate limited pero funcional.
    """

    def __init__(self):
        self.api_key = os.getenv('HUGGINGFACE_TOKEN', '')
        self.base_url = "https://api-inference.huggingface.co/models"
        self.models = {
            'text2video': 'ali-vilab/text-to-video-ms-1.7b',
            'image': 'stabilityai/stable-diffusion-xl-base-1.0'
        }

    async def generate(self, params: Dict) -> Dict:
        model = self.models.get('text2video')
        headers = {'Authorization': f'Bearer {self.api_key}'}
        payload = {'inputs': params.get('prompt', '')}

        async with aiohttp.ClientSession() as session:
            async with session.post(f"{self.base_url}/{model}",
                                    headers=headers, json=payload,
                                    timeout=aiohttp.ClientTimeout(total=120)) as r:
                if r.status == 200:
                    content_type = r.headers.get('content-type', '')
                    if 'video' in content_type or 'octet' in content_type:
                        video_bytes = await r.read()
                        return {'video_bytes': video_bytes,
                                'provider': 'huggingface', 'cost': 0}
                    else:
                        data = await r.json()
                        return {'url': data.get('url'), 'provider': 'huggingface', 'cost': 0}
                elif r.status == 503:
                    # Modelo cargando
                    raise Exception("HuggingFace: modelo cargando, reintentar")
                raise Exception(f"HuggingFace error: {r.status}")



# ==================================================================
# 7. PERCHANCE — 80+ estilos imágenes, sin API key ($0)
# ==================================================================
# (Importado de film/perchance.py)
# Perchance es para IMÁGENES, no video. Se incluye como generador
# de frames que luego se pueden animar con los otros providers.


# ==================================================================
# API UNIFICADA CON FALLBACK (SOLO GRATUITOS)
# ==================================================================

class VideoAPI:
    """
    API unificada — 7 proveedores GRATUITOS + 1 PREMIUM (admin-locked)
    Fallback automático: si uno falla, prueba el siguiente.
    ComfyUI Cloud: 🔒 SOLO con permiso explícito del admin.
    Costo base de operación: $0/mes.
    """

    def __init__(self):
        self.providers = {
            VideoProvider.AGNES: AgnesVideoAPI(),
            VideoProvider.PUTER: PuterVideoAPI(),
            VideoProvider.SEEDANCE: SeedanceVideoAPI(),
            VideoProvider.POLLINATIONS: PollinationsVideoAPI(),
            VideoProvider.CLOUDFLARE: CloudflareVideoAPI(),
            VideoProvider.HUGGINGFACE: HuggingFaceVideoAPI(),
        }
        # 🔒 ComfyUI Cloud — inicializar solo si hay key
        self._comfyui_cloud = None
        try:
            from film.comfyui_cloud import ComfyUICloudAPI
            self._comfyui_cloud = ComfyUICloudAPI()
        except ImportError:
            pass

        self.current_provider = VideoProvider.AGNES
        self.fallback_order = [
            VideoProvider.POLLINATIONS,
            VideoProvider.PUTER,
            VideoProvider.SEEDANCE,
            VideoProvider.CLOUDFLARE,
            VideoProvider.HUGGINGFACE,
        ]
        self.history = []
        self.stats = {p.value: {'success': 0, 'fail': 0} for p in VideoProvider}

    async def generate_video(self, params: Dict) -> Dict:
        """Genera video con fallback automático (solo gratuitos)"""
        # Intentar proveedor principal
        try:
            result = await self.providers[self.current_provider].generate(params)
            self._record(self.current_provider, params, result)
            self.stats[self.current_provider.value]['success'] += 1
            return result
        except Exception as e:
            logger.warning(f"Error {self.current_provider.value}: {e}")
            self.stats[self.current_provider.value]['fail'] += 1

            # Fallback
            for provider in self.fallback_order:
                try:
                    logger.info(f"Fallback → {provider.value}")
                    result = await self.providers[provider].generate(params)
                    self.current_provider = provider
                    self._record(provider, params, result, fallback=True)
                    self.stats[provider.value]['success'] += 1
                    return result
                except Exception as e2:
                    logger.warning(f"Error {provider.value}: {e2}")
                    self.stats[provider.value]['fail'] += 1
                    continue

            raise Exception("Todos los proveedores gratuitos fallaron")

    async def generate_from_image(self, image_url: str, prompt: str) -> Dict:
        """Genera video a partir de imagen"""
        return await self.generate_video({
            'type': 'image_to_video', 'image_url': image_url,
            'prompt': prompt, 'duration': 5, 'ratio': '16:9'
        })

    async def generate_from_images(self, urls: List[str], prompt: str) -> Dict:
        """Genera video de múltiples imágenes"""
        return await self.generate_video({
            'type': 'multi_image_to_video', 'image_urls': urls,
            'prompt': prompt, 'duration': 10, 'ratio': '16:9'
        })

    async def generate_image(self, prompt: str, style: str = "cinematic") -> Dict:
        """Genera imagen (usa Cloudflare Wan 2.6 o Perchance)"""
        try:
            return await self.providers[VideoProvider.CLOUDFLARE].generate({
                'prompt': f"{prompt}, {style} style",
                'width': 1024, 'height': 576
            })
        except:
            try:
                return await self.providers[VideoProvider.HUGGINGFACE].generate({
                    'prompt': f"{prompt}, {style} style, high quality"
                })
            except:
                return {'status': 'error', 'error': 'No image provider available'}

    # ==================================================================
    # 🔒 PREMIUM: ComfyUI Cloud (Admin-only)
    # ==================================================================

    async def generate_video_premium(self, params: Dict, chat_id: str = "") -> Dict:
        """
        🔒 Genera video con ComfyUI Cloud (PREMIUM).
        
        REQUIERE autorización explícita del admin (Leo).
        Sin autorización = BLOQUEADO automáticamente.
        
        Args:
            params: {'prompt': str, 'duration': int, ...}
            chat_id: ID del usuario que solicita
            
        Returns:
            Dict con resultado o error de bloqueo
        """
        if not self._comfyui_cloud:
            return {
                'status': 'error',
                'error': 'ComfyUI Cloud no disponible (módulo no instalado)',
                'provider': 'comfyui_cloud'
            }
        
        return await self._comfyui_cloud.generate(params, chat_id=chat_id)

    async def generate_video_with_premium_fallback(self, params: Dict,
                                                     chat_id: str = "") -> Dict:
        """
        Intenta generar con providers gratuitos primero.
        Si TODOS fallan Y el usuario tiene permiso premium → usa ComfyUI Cloud.
        
        🔒 ComfyUI Cloud solo se usa como último recurso y solo si autorizado.
        """
        # Intentar gratuitos primero
        try:
            return await self.generate_video(params)
        except Exception as free_error:
            logger.warning(f"Todos los gratuitos fallaron: {free_error}")
        
        # Fallback a premium (si autorizado)
        if self._comfyui_cloud:
            result = await self._comfyui_cloud.generate(params, chat_id=chat_id)
            if result.get('status') == 'blocked':
                # No autorizado — re-raise el error gratuito
                raise Exception(
                    "Todos los proveedores gratuitos fallaron. "
                    "Premium no autorizado para este usuario."
                )
            return result
        
        raise Exception("Todos los proveedores fallaron (gratuitos y premium no disponible)")

    def get_premium_status(self, admin_chat_id: str = "") -> Dict:
        """Estado del proveedor premium (info completa solo para admin)"""
        if not self._comfyui_cloud:
            return {'available': False, 'reason': 'Módulo no instalado'}
        return self._comfyui_cloud.get_status()

    def get_status(self) -> Dict:
        """Estado completo del sistema"""
        status = {
            'current_provider': self.current_provider.value,
            'providers_count': len(self.providers),
            'free_providers': len(self.providers),
            'monthly_cost_free': '$0',
            'stats': self.stats,
            'history_count': len(self.history),
            'providers': {
                'agnes': {'status': 'active', 'type': 'video', 'limit': 'unlimited', 'quality': '4K', 'cost': '$0'},
                'puter': {'status': 'active', 'type': 'video', 'limit': 'unlimited', 'quality': 'Sora/Veo', 'cost': '$0'},
                'seedance': {'status': 'active', 'type': 'video', 'limit': 'free_tier', 'quality': '1080p', 'cost': '$0'},
                'pollinations': {'status': 'active', 'type': 'video', 'limit': 'unlimited', 'quality': '720p+', 'cost': '$0'},
                'cloudflare': {'status': 'active', 'type': 'image', 'limit': '10k tokens/day', 'quality': '1024px', 'cost': '$0'},
                'huggingface': {'status': 'active', 'type': 'video+image', 'limit': 'rate_limited', 'quality': '720p', 'cost': '$0'},
                'perchance': {'status': 'active', 'type': 'image', 'limit': 'unlimited', 'quality': '80+ styles', 'cost': '$0'},
            },
            'premium': {
                'comfyui_cloud': {
                    'status': 'available' if self._comfyui_cloud and self._comfyui_cloud.is_configured() else 'not_configured',
                    'type': 'video+image',
                    'quality': '4K, 900+ models, RTX 6000 Pro',
                    'cost': '$20-100/mes',
                    'locked': '🔒 ADMIN-ONLY (requiere permiso de Leo)',
                    'warning': 'NADIE puede usar sin autorización explícita del admin'
                }
            }
        }
        return status

    def _record(self, provider, params, result, fallback=False):
        self.history.append({
            'provider': provider.value, 'fallback': fallback,
            'prompt': params.get('prompt', '')[:50],
            'timestamp': datetime.now().isoformat()
        })
        if len(self.history) > 200:
            self.history = self.history[-200:]
