"""
🎭 HIGGSFIELD AI — Proveedor PREMIUM #9 (Admin-Locked)
=========================================================
Integra Higgsfield AI como proveedor de video/imagen premium.
30+ modelos: Sora 2, Veo 3.1, Kling 3.0, Seedance 2.0, Wan 2.7, etc.

⚠️ REGLA CRÍTICA DE SEGURIDAD:
   NADIE puede usar este proveedor sin permiso EXPLÍCITO de Leo (ADMIN).
   Sin activación = BLOQUEADO. Sin excepciones.

Endpoint MCP: https://mcp.higgsfield.ai/mcp
Auth: Bearer token (HIGGSFIELD_TOKEN en env vars)
Pricing: $15-129/mes (créditos por modelo)

Modelos de Video:
- kling3: Kling 3.0 (mejor calidad, consistencia de personajes)
- veo3: Google Veo 3.1 (cinematográfico 4K)
- sora2-video: OpenAI Sora 2 (física realista, 4/8/12s)
- seedance: Seedance 2.0 (lip-sync + audio nativo)
- wan2-6: Wan 2.7 (rápido, open-source)
- kling2-5-turbo: Kling 2.5 Turbo (iteración rápida)
- grok: Grok Video (xAI)
- image2video: Foto → video 5s

Modelos de Imagen:
- nano-banana-2: Nano Banana Pro (texto perfecto, 4K)
- soul-v2: Soul 2.0 (fotorrealismo editorial)
- openai-hazel: GPT Image 2 (4K)
"""

import os
import json
import asyncio
import logging
from typing import Dict, List, Optional
from datetime import datetime

logger = logging.getLogger("c8l.film.higgsfield")


try:
    import aiohttp
    AIOHTTP_AVAILABLE = True
except ImportError:
    AIOHTTP_AVAILABLE = False


# ==================================================================
# MODELOS DISPONIBLES
# ==================================================================

VIDEO_MODELS = {
    'kling3': {
        'name': 'Kling 3.0',
        'id': 'kling3',
        'features': 'Best quality, character consistency, sound, 720p/1080p',
        'max_duration': 10,
        'strengths': 'character consistency, multi-shot, stylized storytelling'
    },
    'veo3': {
        'name': 'Veo 3.1',
        'id': 'veo3',
        'features': 'Google DeepMind, cinematic 4K, broadcast-grade',
        'max_duration': 8,
        'strengths': 'cinematic, atmospheric, outdoor scenes'
    },
    'sora2': {
        'name': 'Sora 2',
        'id': 'sora2-video',
        'features': 'OpenAI, physics simulation, 4/8/12s',
        'max_duration': 12,
        'strengths': 'physics, object permanence, realism'
    },
    'seedance': {
        'name': 'Seedance 2.0',
        'id': 'seedance',
        'features': 'ByteDance, lip-sync + SFX + audio in one pass',
        'max_duration': 10,
        'strengths': 'lip-sync, audio, UGC spokesperson'
    },
    'wan': {
        'name': 'Wan 2.7',
        'id': 'wan2-6',
        'features': 'Fast, open-source, good for iteration',
        'max_duration': 5,
        'strengths': 'speed, iteration, restyling footage'
    },
    'kling-turbo': {
        'name': 'Kling 2.5 Turbo',
        'id': 'kling2-5-turbo',
        'features': 'Fast iteration, unlimited on plan',
        'max_duration': 5,
        'strengths': 'fast drafts, variants, cheap'
    },
    'grok': {
        'name': 'Grok Video',
        'id': 'grok',
        'features': 'xAI video model',
        'max_duration': 5,
        'strengths': 'general purpose'
    },
    'hailuo': {
        'name': 'MiniMax Hailuo 02',
        'id': 'hailuo',
        'features': 'Character animation specialist',
        'max_duration': 5,
        'strengths': 'character animation, short-form'
    },
    'image2video': {
        'name': 'Image to Video',
        'id': 'image2video',
        'features': 'Converts any still to 5s motion clip',
        'max_duration': 5,
        'strengths': 'animate existing images'
    },
}

IMAGE_MODELS = {
    'nano-banana': {
        'name': 'Nano Banana Pro',
        'id': 'nano-banana-2',
        'features': 'Perfect text rendering, 4K, reference images (up to 16)',
        'strengths': 'text on images, packaging, labels'
    },
    'soul': {
        'name': 'Soul 2.0',
        'id': 'soul-v2',
        'features': 'Editorial photorealism, 720p/1080p/2K',
        'strengths': 'photorealism, hero shots, lifestyle'
    },
    'gpt-image': {
        'name': 'GPT Image 2',
        'id': 'openai-hazel',
        'features': 'GPT-Image-1.5, text rendering, 4K',
        'strengths': 'illustration, text+image compositions'
    },
}



# ==================================================================
# 🔒 HIGGSFIELD API — Admin-Locked Provider
# ==================================================================

class HiggsfieldAPI:
    """
    Higgsfield AI — Proveedor PREMIUM #9.
    
    🔒 PROTEGIDO: Requiere autorización explícita del admin.
    
    Usa el endpoint REST de Higgsfield con Bearer token.
    El token se obtiene de la variable HIGGSFIELD_TOKEN.
    
    Workflow:
    1. generate_video/generate_image → retorna job_id
    2. wait_for_job(job_id) → polling hasta completar
    3. Resultado: URL del video/imagen generado
    """

    # Base URL del API de Higgsfield
    BASE_URL = "https://api.higgsfield.ai"
    MCP_URL = "https://mcp.higgsfield.ai"

    def __init__(self):
        self.token = os.environ.get("HIGGSFIELD_TOKEN", "")
        self.admin_chat_id = os.environ.get("ADMIN_CHAT_ID", "")
        self.global_lock = True  # 🔒 BLOQUEADO por defecto
        self.authorized_users: set = set()
        self.stats = {'success': 0, 'fail': 0, 'blocked': 0}
        self.job_history: List[Dict] = []
        self._load_auth_state()

    def is_configured(self) -> bool:
        """Verifica si el token está configurado"""
        return bool(self.token)

    def _get_headers(self) -> Dict:
        """Headers de autenticación"""
        return {
            'Authorization': f'Bearer {self.token}',
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }

    # ==================================================================
    # 🔒 CONTROL DE ACCESO
    # ==================================================================

    def _check_access(self, chat_id: str, action: str = "generate") -> Dict:
        """Verifica si el usuario tiene acceso premium"""
        chat_id = str(chat_id)

        # Admin siempre tiene acceso
        if chat_id == str(self.admin_chat_id):
            return {'allowed': True, 'reason': 'Admin access'}

        # Global lock
        if self.global_lock:
            logger.warning(f"🔒 Higgsfield BLOQUEADO para {chat_id}: global lock")
            return {
                'allowed': False,
                'reason': '🔒 Higgsfield AI está BLOQUEADO. '
                          'Solo el admin puede activarlo.'
            }

        # Lista de autorizados
        if chat_id in self.authorized_users:
            return {'allowed': True, 'reason': 'Authorized by admin'}

        return {
            'allowed': False,
            'reason': '🔒 No tienes autorización para Higgsfield. '
                      'Solo el admin puede otorgar acceso.'
        }

    def authorize_user(self, admin_id: str, target_id: str) -> Dict:
        """Admin autoriza a un usuario"""
        if str(admin_id) != str(self.admin_chat_id):
            return {'success': False, 'error': '❌ Solo el admin puede autorizar.'}
        self.authorized_users.add(str(target_id))
        self.global_lock = False
        self._save_auth_state()
        return {'success': True, 'message': f'✅ {target_id} autorizado para Higgsfield.'}

    def revoke_user(self, admin_id: str, target_id: str) -> Dict:
        """Admin revoca acceso"""
        if str(admin_id) != str(self.admin_chat_id):
            return {'success': False, 'error': '❌ Solo el admin puede revocar.'}
        self.authorized_users.discard(str(target_id))
        self._save_auth_state()
        return {'success': True, 'message': f'🚫 Acceso Higgsfield revocado para {target_id}.'}

    def lock_all(self, admin_id: str) -> Dict:
        """Admin bloquea todo acceso"""
        if str(admin_id) != str(self.admin_chat_id):
            return {'success': False, 'error': '❌ Solo el admin.'}
        self.global_lock = True
        self._save_auth_state()
        return {'success': True, 'message': '🔒 Higgsfield BLOQUEADO para todos.'}

    def unlock(self, admin_id: str) -> Dict:
        """Admin desbloquea"""
        if str(admin_id) != str(self.admin_chat_id):
            return {'success': False, 'error': '❌ Solo el admin.'}
        self.global_lock = False
        self._save_auth_state()
        return {'success': True, 'message': '🔓 Higgsfield desbloqueado para autorizados.'}



    # ==================================================================
    # GENERACIÓN DE VIDEO
    # ==================================================================

    async def generate_video(self, params: Dict, chat_id: str = "") -> Dict:
        """
        🔒 Genera video con Higgsfield (PREMIUM).
        
        Args:
            params: {
                'prompt': str,
                'model': str (default: 'kling3'),
                'duration': int (segundos, default: 5),
                'aspect_ratio': str ('16:9', '9:16', '1:1'),
                'quality': str ('standard', 'pro'),
                'image_url': str (opcional, para image2video),
                'start_frame_url': str (opcional),
                'end_frame_url': str (opcional),
            }
            chat_id: ID del usuario que solicita
            
        Returns:
            Dict con job_id o error
        """
        # 🔒 VERIFICAR ACCESO
        access = self._check_access(chat_id, "generate_video")
        if not access['allowed']:
            self.stats['blocked'] += 1
            return {'status': 'blocked', 'error': access['reason'],
                    'provider': 'higgsfield'}

        if not self.is_configured():
            return {'status': 'error',
                    'error': 'HIGGSFIELD_TOKEN no configurado.',
                    'provider': 'higgsfield'}

        # Preparar payload
        model_key = params.get('model', 'kling3')
        model_info = VIDEO_MODELS.get(model_key, VIDEO_MODELS['kling3'])
        model_id = model_info['id']

        payload = {
            'prompt': params.get('prompt', ''),
            'model': model_id,
            'aspect_ratio': params.get('aspect_ratio', '16:9'),
            'quality': params.get('quality', 'standard'),
        }

        # Duración (limitada por modelo)
        duration = min(
            params.get('duration', 5),
            model_info.get('max_duration', 10)
        )
        payload['duration'] = duration

        # Image to Video
        if params.get('image_url'):
            payload['image_url'] = params['image_url']
            payload['model'] = 'image2video'

        # Start/End frames (Kling 3.0)
        if params.get('start_frame_url'):
            payload['start_frame'] = params['start_frame_url']
        if params.get('end_frame_url'):
            payload['end_frame'] = params['end_frame_url']

        try:
            result = await self._post("/v1/video/generate", payload)
            
            if result.get('job_id'):
                self.job_history.append({
                    'job_id': result['job_id'],
                    'type': 'video',
                    'model': model_id,
                    'prompt': params.get('prompt', '')[:50],
                    'chat_id': chat_id,
                    'timestamp': datetime.now().isoformat()
                })
                return {
                    'status': 'queued',
                    'job_id': result['job_id'],
                    'model': model_id,
                    'provider': 'higgsfield',
                    'estimated_time': '30-180s'
                }
            else:
                raise Exception(f"No job_id: {result}")

        except Exception as e:
            self.stats['fail'] += 1
            logger.error(f"Higgsfield video error: {e}")
            return {'status': 'error', 'error': str(e),
                    'provider': 'higgsfield'}

    async def generate_image(self, params: Dict, chat_id: str = "") -> Dict:
        """
        🔒 Genera imagen con Higgsfield (PREMIUM).
        
        Args:
            params: {
                'prompt': str,
                'model': str (default: 'nano-banana'),
                'resolution': str ('1k', '2k', '4k'),
                'reference_images': List[str] (URLs, max 16),
            }
            chat_id: ID del usuario
        """
        access = self._check_access(chat_id, "generate_image")
        if not access['allowed']:
            self.stats['blocked'] += 1
            return {'status': 'blocked', 'error': access['reason'],
                    'provider': 'higgsfield'}

        if not self.is_configured():
            return {'status': 'error',
                    'error': 'HIGGSFIELD_TOKEN no configurado.',
                    'provider': 'higgsfield'}

        model_key = params.get('model', 'nano-banana')
        model_info = IMAGE_MODELS.get(model_key, IMAGE_MODELS['nano-banana'])
        model_id = model_info['id']

        payload = {
            'prompt': params.get('prompt', ''),
            'model': model_id,
            'resolution': params.get('resolution', '2k'),
        }

        # Reference images (Nano Banana soporta hasta 16)
        if params.get('reference_images'):
            payload['reference_images'] = params['reference_images'][:16]

        try:
            result = await self._post("/v1/image/generate", payload)
            
            if result.get('job_id'):
                self.job_history.append({
                    'job_id': result['job_id'],
                    'type': 'image',
                    'model': model_id,
                    'chat_id': chat_id,
                    'timestamp': datetime.now().isoformat()
                })
                return {
                    'status': 'queued',
                    'job_id': result['job_id'],
                    'model': model_id,
                    'provider': 'higgsfield',
                    'estimated_time': '5-30s'
                }
            else:
                raise Exception(f"No job_id: {result}")

        except Exception as e:
            self.stats['fail'] += 1
            logger.error(f"Higgsfield image error: {e}")
            return {'status': 'error', 'error': str(e),
                    'provider': 'higgsfield'}



    # ==================================================================
    # JOB MANAGEMENT (Polling, Status, Cancel)
    # ==================================================================

    async def wait_for_job(self, job_id: str, timeout: int = 300,
                            poll_interval: int = 5) -> Dict:
        """
        Polling de un job hasta que complete o falle.
        
        Args:
            job_id: ID del job retornado por generate_video/image
            timeout: Tiempo máximo de espera en segundos (default 5 min)
            poll_interval: Segundos entre cada poll (default 5s)
            
        Returns:
            Dict con URL del resultado o error
        """
        start = datetime.now()
        
        while (datetime.now() - start).total_seconds() < timeout:
            status = await self.get_job(job_id)
            
            job_status = status.get('status', '')
            
            if job_status == 'completed':
                self.stats['success'] += 1
                url = status.get('url') or status.get('result_url', '')
                return {
                    'status': 'success',
                    'job_id': job_id,
                    'url': url,
                    'provider': 'higgsfield',
                    'model': status.get('model', ''),
                    'cost': status.get('credits_used', 0)
                }
            elif job_status == 'failed':
                self.stats['fail'] += 1
                return {
                    'status': 'error',
                    'job_id': job_id,
                    'error': status.get('error', 'Job failed'),
                    'provider': 'higgsfield'
                }
            elif job_status == 'nsfw':
                return {
                    'status': 'error',
                    'job_id': job_id,
                    'error': 'Content flagged as NSFW',
                    'provider': 'higgsfield'
                }
            
            # Still in progress — wait and retry
            await asyncio.sleep(poll_interval)
        
        return {
            'status': 'timeout',
            'job_id': job_id,
            'error': f'Job no completó en {timeout}s. Puede seguir en proceso.',
            'provider': 'higgsfield'
        }

    async def get_job(self, job_id: str) -> Dict:
        """Consulta estado de un job sin polling"""
        try:
            result = await self._get(f"/v1/jobs/{job_id}")
            return result
        except Exception as e:
            return {'status': 'error', 'error': str(e)}

    async def list_jobs(self, limit: int = 20) -> List[Dict]:
        """Lista jobs recientes"""
        try:
            result = await self._get(f"/v1/jobs?limit={limit}")
            return result.get('jobs', [])
        except Exception as e:
            logger.error(f"Error listing jobs: {e}")
            return []

    async def cancel_job(self, job_id: str) -> Dict:
        """Cancela un job en progreso"""
        try:
            result = await self._delete(f"/v1/jobs/{job_id}")
            return {'status': 'cancelled', 'job_id': job_id}
        except Exception as e:
            return {'status': 'error', 'error': str(e)}

    async def get_credits(self) -> Dict:
        """Consulta balance de créditos de la cuenta"""
        try:
            result = await self._get("/v1/account/credits")
            return result
        except Exception as e:
            return {'status': 'error', 'error': str(e)}

    async def check_cost(self, model: str, params: Dict = None) -> Dict:
        """Estimación de costo en créditos antes de generar"""
        try:
            payload = {'model': model}
            if params:
                payload.update(params)
            result = await self._post("/v1/estimate-cost", payload)
            return result
        except Exception as e:
            return {'estimated_credits': 'unknown', 'error': str(e)}

    async def list_models(self) -> Dict:
        """Lista todos los modelos disponibles"""
        return {
            'video_models': VIDEO_MODELS,
            'image_models': IMAGE_MODELS,
            'total': len(VIDEO_MODELS) + len(IMAGE_MODELS)
        }



    # ==================================================================
    # GENERACIÓN COMPLETA (submit + wait) — Para uso en Film Pipeline
    # ==================================================================

    async def generate(self, params: Dict, chat_id: str = "") -> Dict:
        """
        Genera video/imagen y ESPERA el resultado.
        Interface compatible con VideoAPI para uso como proveedor.
        
        Args:
            params: {'prompt': str, 'duration': int, 'model': str, ...}
            chat_id: ID del usuario
            
        Returns:
            Dict con 'url' del resultado
        """
        # Determinar tipo de generación
        gen_type = params.get('type', 'video')
        
        if gen_type == 'image' or params.get('generate_image'):
            submit_result = await self.generate_image(params, chat_id)
        else:
            submit_result = await self.generate_video(params, chat_id)
        
        # Si fue bloqueado o error, retornar directo
        if submit_result.get('status') in ('blocked', 'error'):
            return submit_result
        
        # Esperar resultado
        job_id = submit_result.get('job_id')
        if not job_id:
            return submit_result
        
        # Polling hasta completar
        result = await self.wait_for_job(job_id)
        return result

    # ==================================================================
    # MÉTODOS DE SELECCIÓN INTELIGENTE DE MODELO
    # ==================================================================

    def recommend_model(self, task_description: str) -> str:
        """
        Recomienda el mejor modelo según la tarea.
        
        Args:
            task_description: Descripción de lo que se quiere generar
            
        Returns:
            ID del modelo recomendado
        """
        desc = task_description.lower()
        
        # Lip-sync / audio
        if any(w in desc for w in ['lip', 'hablar', 'voz', 'audio', 'speak', 'talk']):
            return 'seedance'
        
        # Física / realismo
        if any(w in desc for w in ['physics', 'física', 'water', 'liquid', 'pour']):
            return 'sora2'
        
        # Cinematográfico
        if any(w in desc for w in ['cinematic', 'cinemat', 'film', 'movie', '4k']):
            return 'veo3'
        
        # Personajes consistentes
        if any(w in desc for w in ['character', 'personaje', 'consistenc', 'face']):
            return 'kling3'
        
        # Rápido / draft
        if any(w in desc for w in ['fast', 'rápido', 'draft', 'test', 'preview']):
            return 'kling-turbo'
        
        # Animación
        if any(w in desc for w in ['anim', 'cartoon', 'motion']):
            return 'hailuo'
        
        # Default: Kling 3.0 (mejor balance calidad/costo)
        return 'kling3'



    # ==================================================================
    # HTTP CLIENT
    # ==================================================================

    async def _post(self, endpoint: str, payload: Dict) -> Dict:
        """POST request a Higgsfield API"""
        url = f"{self.BASE_URL}{endpoint}"
        headers = self._get_headers()

        if not AIOHTTP_AVAILABLE:
            return self._post_sync(url, payload, headers)

        async with aiohttp.ClientSession() as session:
            async with session.post(
                url, headers=headers, json=payload,
                timeout=aiohttp.ClientTimeout(total=30)
            ) as r:
                if r.status == 200 or r.status == 201:
                    return await r.json()
                elif r.status == 401:
                    raise Exception(
                        "Auth error 401: Token expirado o inválido. "
                        "Actualizar HIGGSFIELD_TOKEN."
                    )
                elif r.status == 402:
                    raise Exception("Sin créditos. Recargar en higgsfield.ai")
                elif r.status == 429:
                    raise Exception("Rate limit. Esperar y reintentar.")
                else:
                    error_text = await r.text()
                    raise Exception(f"HTTP {r.status}: {error_text[:200]}")

    async def _get(self, endpoint: str) -> Dict:
        """GET request a Higgsfield API"""
        url = f"{self.BASE_URL}{endpoint}"
        headers = self._get_headers()

        if not AIOHTTP_AVAILABLE:
            return self._get_sync(url, headers)

        async with aiohttp.ClientSession() as session:
            async with session.get(
                url, headers=headers,
                timeout=aiohttp.ClientTimeout(total=15)
            ) as r:
                if r.status == 200:
                    return await r.json()
                elif r.status == 401:
                    raise Exception("Auth error: Token expirado.")
                else:
                    error_text = await r.text()
                    raise Exception(f"HTTP {r.status}: {error_text[:200]}")

    async def _delete(self, endpoint: str) -> Dict:
        """DELETE request a Higgsfield API"""
        url = f"{self.BASE_URL}{endpoint}"
        headers = self._get_headers()

        async with aiohttp.ClientSession() as session:
            async with session.delete(
                url, headers=headers,
                timeout=aiohttp.ClientTimeout(total=15)
            ) as r:
                if r.status in (200, 204):
                    try:
                        return await r.json()
                    except:
                        return {'status': 'deleted'}
                else:
                    error_text = await r.text()
                    raise Exception(f"HTTP {r.status}: {error_text[:200]}")

    def _post_sync(self, url: str, payload: Dict, headers: Dict) -> Dict:
        """Fallback síncrono con requests"""
        import requests
        r = requests.post(url, headers=headers, json=payload, timeout=30)
        if r.status_code in (200, 201):
            return r.json()
        raise Exception(f"HTTP {r.status_code}: {r.text[:200]}")

    def _get_sync(self, url: str, headers: Dict) -> Dict:
        """Fallback síncrono con requests"""
        import requests
        r = requests.get(url, headers=headers, timeout=15)
        if r.status_code == 200:
            return r.json()
        raise Exception(f"HTTP {r.status_code}: {r.text[:200]}")



    # ==================================================================
    # STATE PERSISTENCE
    # ==================================================================

    def _state_path(self) -> str:
        base = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        return os.path.join(base, "data", "higgsfield_gate.json")

    def _load_auth_state(self) -> None:
        """Carga estado de autorizaciones desde disco"""
        path = self._state_path()
        if os.path.exists(path):
            try:
                with open(path, 'r') as f:
                    state = json.load(f)
                self.authorized_users = set(state.get('authorized_users', []))
                self.global_lock = state.get('global_lock', True)
            except Exception:
                pass

    def _save_auth_state(self) -> None:
        """Persiste estado a disco"""
        path = self._state_path()
        os.makedirs(os.path.dirname(path), exist_ok=True)
        try:
            with open(path, 'w') as f:
                json.dump({
                    'authorized_users': list(self.authorized_users),
                    'global_lock': self.global_lock,
                    'updated_at': datetime.now().isoformat()
                }, f, indent=2)
        except Exception as e:
            logger.error(f"Error guardando estado Higgsfield: {e}")

    # ==================================================================
    # STATUS & INFO
    # ==================================================================

    def get_status(self) -> Dict:
        """Estado completo del proveedor"""
        return {
            'provider': 'higgsfield',
            'configured': self.is_configured(),
            'type': 'PREMIUM (de pago)',
            'admin_locked': self.global_lock,
            'authorized_users': len(self.authorized_users),
            'stats': self.stats,
            'video_models': len(VIDEO_MODELS),
            'image_models': len(IMAGE_MODELS),
            'total_models': len(VIDEO_MODELS) + len(IMAGE_MODELS),
            'features': [
                'Kling 3.0 (character consistency)',
                'Veo 3.1 (cinematic 4K)',
                'Sora 2 (physics)',
                'Seedance 2.0 (lip-sync + audio)',
                'Soul 2.0 (photorealism)',
                'Nano Banana Pro (text rendering)',
            ],
            'pricing': '$15-129/mes',
            'warning': '🔒 REQUIERE PERMISO DEL ADMIN PARA USAR'
        }

    def get_help_text(self) -> str:
        """Texto de ayuda para el usuario"""
        return (
            "🎭 *HIGGSFIELD AI — Proveedor Premium #9*\n\n"
            "30+ modelos de video e imagen bajo un solo proveedor.\n\n"
            "🎬 *Modelos de Video:*\n"
            "  • `kling3` — Kling 3.0 (mejor calidad + personajes)\n"
            "  • `veo3` — Veo 3.1 (cinematográfico 4K)\n"
            "  • `sora2` — Sora 2 (física realista)\n"
            "  • `seedance` — Seedance 2.0 (lip-sync + audio)\n"
            "  • `wan` — Wan 2.7 (rápido)\n"
            "  • `kling-turbo` — Kling 2.5 Turbo (drafts)\n"
            "  • `grok` — Grok Video (xAI)\n"
            "  • `hailuo` — MiniMax (animación)\n"
            "  • `image2video` — Foto → video 5s\n\n"
            "🖼️ *Modelos de Imagen:*\n"
            "  • `nano-banana` — Nano Banana Pro (texto perfecto, 4K)\n"
            "  • `soul` — Soul 2.0 (fotorrealismo)\n"
            "  • `gpt-image` — GPT Image 2\n\n"
            "⚙️ *Uso:*\n"
            "  `/hf video [modelo] [prompt]`\n"
            "  `/hf image [modelo] [prompt]`\n"
            "  `/hf models` — Ver modelos\n"
            "  `/hf credits` — Ver créditos\n"
            "  `/hf status` — Estado del proveedor\n\n"
            "🔒 *Acceso:* Solo con permiso del admin\n"
            "💰 *Costo:* Créditos de plan Higgsfield"
        )
