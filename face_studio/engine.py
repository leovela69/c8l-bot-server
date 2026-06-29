"""
🎭 FACE STUDIO ENGINE — Motor principal
=========================================
Integra todos los skills de face via HuggingFace Spaces API.

Todos los modelos son gratuitos vía HuggingFace Inference API
o Gradio Client (para Spaces).
"""

import os
import io
import logging
import tempfile
import asyncio
from typing import Dict, List, Optional
from datetime import datetime

logger = logging.getLogger("c8l.face_studio")

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FACE_DIR = os.path.join(BASE_DIR, "data", "faces")
os.makedirs(FACE_DIR, exist_ok=True)

# HuggingFace Spaces endpoints (todos gratuitos)
HF_SPACES = {
    'liveportrait': 'KwaiVGI/LivePortrait',
    'face_fusion': 'FaceFusion/FaceFusion',
    'gfpgan': 'Xintao/GFPGAN',
    'latentsync': 'LatentSync/LatentSync',
    'musetalk': 'TMElyralab/MuseTalk',
    'wav2lip': 'Wav2Lip/Wav2Lip',
    'sadtalker': 'vinthony/SadTalker',
    'face_age': 'hysts/age-estimation',
}

try:
    import aiohttp
    AIOHTTP = True
except ImportError:
    AIOHTTP = False


class FaceStudio:
    """Motor principal del Face Studio"""

    def __init__(self):
        self.hf_token = os.getenv('HUGGINGFACE_TOKEN', '')
        self.generation_count = 0
        self.last_generation = None

    # ==================================================================
    # SKILL 1: LIVEPORTRAIT — Animar retratos
    # ==================================================================

    async def animate_portrait(self, source_image: bytes,
                                driving_video: bytes = None,
                                driving_audio: bytes = None) -> Dict:
        """
        Anima un retrato con LivePortrait.
        - source_image: foto del rostro (bytes)
        - driving_video: video con expresiones a copiar
        - driving_audio: audio para lip-sync
        """
        result = await self._call_hf_space(
            space='liveportrait',
            inputs={
                'source_image': source_image,
                'driving_video': driving_video,
                'driving_audio': driving_audio
            },
            task='animate'
        )
        return result

    # ==================================================================
    # SKILL 2: FACE SWAP — Cambiar rostros
    # ==================================================================

    async def face_swap(self, source_face: bytes,
                         target_image: bytes) -> Dict:
        """
        Cambia el rostro de source_face al target_image.
        Usa FaceFusion (open source, HuggingFace Space).
        """
        result = await self._call_hf_space(
            space='face_fusion',
            inputs={
                'source_face': source_face,
                'target_image': target_image
            },
            task='swap'
        )
        return result

    # ==================================================================
    # SKILL 3: LIP SYNC — Sincronizar labios
    # ==================================================================

    async def lip_sync(self, face_image: bytes,
                        audio: bytes,
                        method: str = "latentsync") -> Dict:
        """
        Sincroniza labios con audio.
        Métodos gratuitos:
        - latentsync: Mejor calidad (2026)
        - musetalk: Rápido, buena calidad
        - wav2lip: Clásico, más estable
        - sadtalker: Con movimiento de cabeza
        """
        space_map = {
            'latentsync': 'latentsync',
            'musetalk': 'musetalk',
            'wav2lip': 'wav2lip',
            'sadtalker': 'sadtalker'
        }
        space = space_map.get(method, 'latentsync')

        result = await self._call_hf_space(
            space=space,
            inputs={
                'face_image': face_image,
                'audio': audio
            },
            task='lipsync'
        )
        return result

    # ==================================================================
    # SKILL 4: FACE ENHANCE — Mejorar/restaurar rostros
    # ==================================================================

    async def enhance_face(self, image: bytes) -> Dict:
        """
        Mejora la calidad de un rostro (upscale, restaurar, deblur).
        Usa GFPGAN (Tencent, open source).
        """
        result = await self._call_hf_space(
            space='gfpgan',
            inputs={'image': image},
            task='enhance'
        )
        return result

    # ==================================================================
    # SKILL 5: FACE AGE — Envejecer/rejuvenecer
    # ==================================================================

    async def change_age(self, image: bytes,
                          target_age: int = 70) -> Dict:
        """
        Cambia la edad aparente de un rostro.
        target_age: 5 (niño), 20 (joven), 50 (adulto), 80 (anciano)
        """
        result = await self._call_hf_space(
            space='face_age',
            inputs={'image': image, 'target_age': target_age},
            task='age'
        )
        return result

    # ==================================================================
    # SKILL 6: FACE EXPRESSION — Cambiar expresiones
    # ==================================================================

    async def change_expression(self, image: bytes,
                                 expression: str = "smile") -> Dict:
        """
        Cambia la expresión facial.
        Expresiones: smile, sad, angry, surprised, wink, neutral
        """
        # Usar LivePortrait con driving presets
        expression_presets = {
            'smile': 'happy_template',
            'sad': 'sad_template',
            'angry': 'angry_template',
            'surprised': 'surprised_template',
            'wink': 'wink_template',
            'neutral': 'neutral_template'
        }
        preset = expression_presets.get(expression, 'smile_template')

        result = await self._call_hf_space(
            space='liveportrait',
            inputs={
                'source_image': image,
                'expression_preset': preset
            },
            task='expression'
        )
        return result

    # ==================================================================
    # MOTOR DE LLAMADAS A HUGGINGFACE SPACES
    # ==================================================================

    async def _call_hf_space(self, space: str, inputs: Dict,
                              task: str) -> Dict:
        """
        Llama a un HuggingFace Space via API.
        Soporta Gradio API y REST API.
        """
        space_name = HF_SPACES.get(space, space)
        api_url = f"https://{space_name.replace('/', '-')}.hf.space/api/predict"

        # Preparar archivos para upload
        headers = {}
        if self.hf_token:
            headers['Authorization'] = f'Bearer {self.hf_token}'

        try:
            if AIOHTTP:
                return await self._call_via_aiohttp(api_url, inputs, headers, task)
            else:
                return self._call_via_requests(api_url, inputs, headers, task)
        except Exception as e:
            logger.error(f"Face Studio [{task}] error: {e}")
            # Intentar API alternativa
            return await self._call_via_inference_api(space_name, inputs, task)

    async def _call_via_aiohttp(self, url: str, inputs: Dict,
                                 headers: Dict, task: str) -> Dict:
        """Llamada via aiohttp"""
        async with aiohttp.ClientSession() as session:
            # Preparar FormData para archivos
            data = aiohttp.FormData()

            for key, value in inputs.items():
                if isinstance(value, bytes):
                    data.add_field(key, value,
                                  filename=f'{key}.png',
                                  content_type='image/png')
                elif value is not None:
                    data.add_field(key, str(value))

            async with session.post(url, data=data, headers=headers,
                                    timeout=aiohttp.ClientTimeout(total=120)) as r:
                if r.status == 200:
                    content_type = r.headers.get('content-type', '')
                    if 'json' in content_type:
                        result = await r.json()
                        self.generation_count += 1
                        self.last_generation = datetime.now().isoformat()
                        return {
                            'status': 'success',
                            'task': task,
                            'url': result.get('data', [None])[0],
                            'provider': 'huggingface_space',
                            'cost': 0
                        }
                    else:
                        # Resultado binario (video/imagen)
                        content = await r.read()
                        self.generation_count += 1
                        self.last_generation = datetime.now().isoformat()
                        return {
                            'status': 'success',
                            'task': task,
                            'bytes': content,
                            'provider': 'huggingface_space',
                            'cost': 0
                        }
                else:
                    error = await r.text()
                    raise Exception(f"HF Space error {r.status}: {error[:200]}")

    def _call_via_requests(self, url: str, inputs: Dict,
                            headers: Dict, task: str) -> Dict:
        """Fallback con requests"""
        import requests

        files = {}
        data = {}

        for key, value in inputs.items():
            if isinstance(value, bytes):
                files[key] = (f'{key}.png', io.BytesIO(value), 'image/png')
            elif value is not None:
                data[key] = str(value)

        r = requests.post(url, files=files, data=data,
                         headers=headers, timeout=120)

        if r.status_code == 200:
            self.generation_count += 1
            self.last_generation = datetime.now().isoformat()
            content_type = r.headers.get('content-type', '')
            if 'json' in content_type:
                result = r.json()
                return {
                    'status': 'success',
                    'task': task,
                    'url': result.get('data', [None])[0],
                    'provider': 'huggingface_space',
                    'cost': 0
                }
            else:
                return {
                    'status': 'success',
                    'task': task,
                    'bytes': r.content,
                    'provider': 'huggingface_space',
                    'cost': 0
                }
        raise Exception(f"Request error {r.status_code}: {r.text[:200]}")

    async def _call_via_inference_api(self, model: str, inputs: Dict,
                                       task: str) -> Dict:
        """Fallback: HuggingFace Inference API directa"""
        api_url = f"https://api-inference.huggingface.co/models/{model}"
        headers = {}
        if self.hf_token:
            headers['Authorization'] = f'Bearer {self.hf_token}'

        # Buscar el primer input de bytes para enviar
        image_bytes = None
        for v in inputs.values():
            if isinstance(v, bytes):
                image_bytes = v
                break

        if not image_bytes:
            return {'status': 'error', 'error': 'No image input found'}

        async with aiohttp.ClientSession() as session:
            async with session.post(api_url, data=image_bytes,
                                    headers=headers,
                                    timeout=aiohttp.ClientTimeout(total=120)) as r:
                if r.status == 200:
                    content = await r.read()
                    self.generation_count += 1
                    return {
                        'status': 'success',
                        'task': task,
                        'bytes': content,
                        'provider': 'hf_inference',
                        'cost': 0
                    }
                raise Exception(f"HF Inference error: {r.status}")

    # ==================================================================
    # STATUS & UTILS
    # ==================================================================

    def get_status(self) -> Dict:
        return {
            'generation_count': self.generation_count,
            'last_generation': self.last_generation,
            'hf_token_configured': bool(self.hf_token),
            'available_skills': [
                'animate_portrait (LivePortrait)',
                'face_swap (FaceFusion)',
                'lip_sync (LatentSync/MuseTalk/Wav2Lip/SadTalker)',
                'enhance_face (GFPGAN)',
                'change_age',
                'change_expression'
            ],
            'all_free': True,
            'monthly_cost': '$0'
        }

    def get_skills_text(self) -> str:
        return (
            "🎭 *FACE STUDIO — Skills Disponibles:*\n\n"
            "1. 🎬 *Animar Retrato* — Foto → video animado\n"
            "   `/face animar` + envía foto\n\n"
            "2. 🔄 *Face Swap* — Cambiar rostros\n"
            "   `/face swap` + 2 fotos\n\n"
            "3. 🗣️ *Lip Sync* — Sincronizar labios\n"
            "   `/face lipsync` + foto + audio\n\n"
            "4. ✨ *Mejorar Rostro* — HD, restaurar\n"
            "   `/face mejorar` + foto\n\n"
            "5. 👴 *Cambiar Edad* — Envejecer/rejuvenecer\n"
            "   `/face edad 70` + foto\n\n"
            "6. 😊 *Expresión* — Sonreír, triste, etc.\n"
            "   `/face expresion smile` + foto\n\n"
            "🔧 *Motores:* LivePortrait, FaceFusion, LatentSync,\n"
            "   MuseTalk, Wav2Lip, SadTalker, GFPGAN\n"
            "💰 *Costo:* $0/mes — 100% gratuito"
        )
