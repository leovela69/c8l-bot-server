"""
☁️ COMFYUI CLOUD API — Proveedor PREMIUM con bloqueo de admin
================================================================
Integra ComfyUI Cloud (cloud.comfy.org) como proveedor de video premium.

⚠️ REGLA CRÍTICA DE SEGURIDAD:
   NADIE puede usar este proveedor sin permiso EXPLÍCITO de Leo (ADMIN).
   El admin debe activar manualmente con /premium enable [chat_id].
   Sin activación = BLOQUEADO. Sin excepciones.

Pricing: $20-100/mes (créditos por uso de GPU)
Hardware: RTX 6000 Pro 96GB VRAM
API: REST asíncrona compatible con ComfyUI local
Modelos: 900+ pre-instalados (Wan 2.2, HunyuanVideo, etc.)

Docs: https://docs.comfy.org/development/cloud/overview
"""

import os
import json
import asyncio
import logging
from typing import Dict, List, Optional, Set
from datetime import datetime

logger = logging.getLogger("c8l.film.comfyui_cloud")

try:
    import aiohttp
    AIOHTTP_AVAILABLE = True
except ImportError:
    AIOHTTP_AVAILABLE = False



# ==================================================================
# 🔒 ADMIN GATE — BLOQUEO DE ACCESO A PAGO
# ==================================================================

class PremiumAdminGate:
    """
    🔒 BLOQUEO DE SEGURIDAD — Solo Leo puede activar proveedores de pago.
    
    REGLAS:
    1. Por defecto TODO está BLOQUEADO
    2. Solo el ADMIN_CHAT_ID puede activar/desactivar
    3. Se puede autorizar por usuario específico
    4. Log de todos los intentos de acceso
    5. Sin autorización explícita = RECHAZADO SIEMPRE
    
    Comandos (solo admin):
        /premium enable [chat_id]  — Autoriza un usuario
        /premium disable [chat_id] — Revoca autorización
        /premium status            — Ver quién tiene acceso
        /premium lock              — Bloquear TODO acceso premium
    """

    def __init__(self):
        self.admin_chat_id = os.environ.get("ADMIN_CHAT_ID", "")
        self.authorized_users: Set[str] = set()
        self.global_lock = True  # BLOQUEADO por defecto
        self.access_log: List[Dict] = []
        self._load_state()

    def _load_state(self) -> None:
        """Carga estado de autorizaciones desde disco"""
        state_path = self._state_path()
        if os.path.exists(state_path):
            try:
                with open(state_path, 'r') as f:
                    state = json.load(f)
                self.authorized_users = set(state.get('authorized_users', []))
                self.global_lock = state.get('global_lock', True)
            except Exception:
                pass

    def _save_state(self) -> None:
        """Persiste estado a disco"""
        state_path = self._state_path()
        os.makedirs(os.path.dirname(state_path), exist_ok=True)
        try:
            with open(state_path, 'w') as f:
                json.dump({
                    'authorized_users': list(self.authorized_users),
                    'global_lock': self.global_lock,
                    'updated_at': datetime.now().isoformat()
                }, f, indent=2)
        except Exception as e:
            logger.error(f"Error guardando estado premium: {e}")

    def _state_path(self) -> str:
        base = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        return os.path.join(base, "data", "premium_gate.json")


    def is_admin(self, chat_id: str) -> bool:
        """Verifica si un chat_id es el admin"""
        return str(chat_id) == str(self.admin_chat_id)

    def check_access(self, chat_id: str, action: str = "generate") -> Dict:
        """
        🔒 VERIFICA ACCESO — Retorna si el usuario puede usar premium.
        
        Returns:
            {'allowed': bool, 'reason': str}
        """
        chat_id = str(chat_id)
        
        # Log del intento
        self.access_log.append({
            'chat_id': chat_id,
            'action': action,
            'timestamp': datetime.now().isoformat(),
            'is_admin': self.is_admin(chat_id)
        })
        
        # Mantener log limitado
        if len(self.access_log) > 500:
            self.access_log = self.access_log[-500:]

        # Admin siempre tiene acceso
        if self.is_admin(chat_id):
            return {'allowed': True, 'reason': 'Admin access'}
        
        # Global lock activo = nadie más puede
        if self.global_lock:
            logger.warning(f"🔒 Acceso premium DENEGADO a {chat_id}: global lock activo")
            return {
                'allowed': False,
                'reason': '🔒 Acceso premium BLOQUEADO. Solo el admin puede activarlo. '
                          'Contacta al administrador.'
            }
        
        # Verificar si está en la lista de autorizados
        if chat_id in self.authorized_users:
            return {'allowed': True, 'reason': 'Authorized by admin'}
        
        # No autorizado
        logger.warning(f"🔒 Acceso premium DENEGADO a {chat_id}: no autorizado")
        return {
            'allowed': False,
            'reason': '🔒 No tienes autorización para usar proveedores premium. '
                      'Solo el admin puede otorgar acceso.'
        }

    def authorize_user(self, admin_chat_id: str, target_chat_id: str) -> Dict:
        """Admin autoriza a un usuario para usar premium"""
        if not self.is_admin(admin_chat_id):
            return {'success': False, 'error': '❌ Solo el admin puede autorizar usuarios.'}
        
        self.authorized_users.add(str(target_chat_id))
        self.global_lock = False  # Desbloquear si se autoriza alguien
        self._save_state()
        logger.info(f"✅ Admin autorizó a {target_chat_id} para premium")
        return {'success': True, 'message': f'✅ Usuario {target_chat_id} autorizado para premium.'}

    def revoke_user(self, admin_chat_id: str, target_chat_id: str) -> Dict:
        """Admin revoca acceso premium de un usuario"""
        if not self.is_admin(admin_chat_id):
            return {'success': False, 'error': '❌ Solo el admin puede revocar acceso.'}
        
        self.authorized_users.discard(str(target_chat_id))
        self._save_state()
        logger.info(f"🚫 Admin revocó acceso premium de {target_chat_id}")
        return {'success': True, 'message': f'🚫 Acceso premium revocado para {target_chat_id}.'}

    def lock_all(self, admin_chat_id: str) -> Dict:
        """Admin bloquea TODO acceso premium (emergencia)"""
        if not self.is_admin(admin_chat_id):
            return {'success': False, 'error': '❌ Solo el admin puede bloquear.'}
        
        self.global_lock = True
        self._save_state()
        logger.info("🔒 GLOBAL LOCK activado — todo acceso premium bloqueado")
        return {'success': True, 'message': '🔒 Todo acceso premium BLOQUEADO.'}

    def unlock(self, admin_chat_id: str) -> Dict:
        """Admin desbloquea acceso premium"""
        if not self.is_admin(admin_chat_id):
            return {'success': False, 'error': '❌ Solo el admin puede desbloquear.'}
        
        self.global_lock = False
        self._save_state()
        return {'success': True, 'message': '🔓 Acceso premium desbloqueado para autorizados.'}

    def get_status(self, admin_chat_id: str) -> Dict:
        """Estado del sistema premium (solo admin)"""
        if not self.is_admin(admin_chat_id):
            return {'error': '❌ Solo el admin puede ver el estado.'}
        
        return {
            'global_lock': self.global_lock,
            'authorized_users': list(self.authorized_users),
            'total_authorized': len(self.authorized_users),
            'recent_access_attempts': self.access_log[-10:]
        }



# ==================================================================
# ☁️ COMFYUI CLOUD VIDEO API
# ==================================================================

class ComfyUICloudAPI:
    """
    ComfyUI Cloud — Proveedor PREMIUM de video con IA.
    
    🔒 PROTEGIDO por PremiumAdminGate — requiere autorización explícita.
    
    Capacidades:
    - Text to Video (Wan 2.2, HunyuanVideo, LTX, etc.)
    - Image to Video con consistencia de personajes
    - Workflows personalizados (el que Leo compartió)
    - 900+ modelos pre-instalados
    - GPU: RTX 6000 Pro 96GB VRAM
    
    API Base: https://cloud.comfy.org
    Auth: X-API-Key header
    """

    def __init__(self):
        self.api_key = os.environ.get("COMFYUI_CLOUD_API_KEY", "")
        self.base_url = "https://cloud.comfy.org"
        self.gate = PremiumAdminGate()
        self.shared_workflow_id = os.environ.get(
            "COMFYUI_SHARED_WORKFLOW", "773d308ebcf0"
        )
        self.stats = {'success': 0, 'fail': 0, 'blocked': 0}
        self.job_history: List[Dict] = []

    def is_configured(self) -> bool:
        """Verifica si la API key está configurada"""
        return bool(self.api_key)

    async def generate(self, params: Dict, chat_id: str = "") -> Dict:
        """
        Genera video via ComfyUI Cloud.
        
        🔒 REQUIERE: Autorización del admin via PremiumAdminGate.
        
        Args:
            params: {'prompt': str, 'duration': int, 'workflow': str, ...}
            chat_id: ID del usuario que solicita (para verificar permisos)
            
        Returns:
            Dict con resultado o error de acceso
        """
        # 🔒 VERIFICAR ACCESO
        access = self.gate.check_access(chat_id, "comfyui_cloud_generate")
        if not access['allowed']:
            self.stats['blocked'] += 1
            return {
                'status': 'blocked',
                'error': access['reason'],
                'provider': 'comfyui_cloud',
                'cost': 0
            }
        
        # Verificar configuración
        if not self.is_configured():
            return {
                'status': 'error',
                'error': 'ComfyUI Cloud API key no configurada. '
                         'Set COMFYUI_CLOUD_API_KEY en variables de entorno.',
                'provider': 'comfyui_cloud'
            }

        # Ejecutar workflow
        try:
            result = await self._submit_workflow(params)
            self.stats['success'] += 1
            return result
        except Exception as e:
            self.stats['fail'] += 1
            logger.error(f"ComfyUI Cloud error: {e}")
            return {
                'status': 'error',
                'error': str(e),
                'provider': 'comfyui_cloud'
            }


    async def _submit_workflow(self, params: Dict) -> Dict:
        """Envía workflow a ComfyUI Cloud y espera resultado"""
        headers = {
            'X-API-Key': self.api_key,
            'Content-Type': 'application/json'
        }
        
        # Construir workflow payload
        workflow = self._build_workflow(params)
        
        async with aiohttp.ClientSession() as session:
            # Paso 1: Enviar workflow
            async with session.post(
                f"{self.base_url}/api/prompt",
                headers=headers,
                json={'prompt': workflow},
                timeout=aiohttp.ClientTimeout(total=30)
            ) as r:
                if r.status != 200:
                    error_text = await r.text()
                    raise Exception(f"Submit error {r.status}: {error_text[:200]}")
                data = await r.json()
                prompt_id = data.get('prompt_id')
            
            if not prompt_id:
                raise Exception("No prompt_id recibido")
            
            # Paso 2: Polling hasta completar (max 10 min)
            result = await self._poll_job(session, headers, prompt_id)
            return result

    async def _poll_job(self, session, headers: Dict, prompt_id: str,
                         timeout: int = 600) -> Dict:
        """Polling del job hasta que complete o falle"""
        poll_url = f"{self.base_url}/api/history/{prompt_id}"
        start = datetime.now()
        
        while (datetime.now() - start).total_seconds() < timeout:
            await asyncio.sleep(5)  # Poll cada 5 segundos
            
            async with session.get(poll_url, headers=headers) as r:
                if r.status == 200:
                    data = await r.json()
                    job_data = data.get(prompt_id, {})
                    status = job_data.get('status', {})
                    
                    if status.get('completed'):
                        # Job completado — extraer outputs
                        outputs = job_data.get('outputs', {})
                        video_url = self._extract_video_url(outputs, prompt_id)
                        
                        self.job_history.append({
                            'prompt_id': prompt_id,
                            'status': 'completed',
                            'timestamp': datetime.now().isoformat()
                        })
                        
                        return {
                            'status': 'success',
                            'url': video_url,
                            'prompt_id': prompt_id,
                            'provider': 'comfyui_cloud',
                            'quality': 'premium',
                            'cost': 'credits'
                        }
                    
                    elif status.get('status_str') == 'failed':
                        raise Exception(f"Job failed: {status.get('messages', '')}")
                    
                    # Aún en progreso...
                    continue
                elif r.status == 404:
                    # Job aún no registrado, esperar
                    continue
                else:
                    raise Exception(f"Poll error: {r.status}")
        
        raise Exception(f"Timeout: job {prompt_id} no completó en {timeout}s")


    def _build_workflow(self, params: Dict) -> Dict:
        """
        Construye el workflow JSON para ComfyUI Cloud.
        Soporta text-to-video con Wan 2.2 por defecto.
        """
        prompt_text = params.get('prompt', '')
        duration = params.get('duration', 5)
        width = params.get('width', 1280)
        height = params.get('height', 720)
        
        # Workflow básico de text-to-video con Wan 2.2
        # Basado en el formato API de ComfyUI
        workflow = {
            "1": {
                "class_type": "CheckpointLoaderSimple",
                "inputs": {
                    "ckpt_name": "wan2.2_t2v_720p.safetensors"
                }
            },
            "2": {
                "class_type": "CLIPTextEncode",
                "inputs": {
                    "text": prompt_text,
                    "clip": ["1", 1]
                }
            },
            "3": {
                "class_type": "CLIPTextEncode",
                "inputs": {
                    "text": "blurry, low quality, distorted, ugly, bad anatomy",
                    "clip": ["1", 1]
                }
            },
            "4": {
                "class_type": "EmptyLatentVideo",
                "inputs": {
                    "width": width,
                    "height": height,
                    "length": min(duration * 18, 81),  # frames (18fps)
                    "batch_size": 1
                }
            },
            "5": {
                "class_type": "KSampler",
                "inputs": {
                    "model": ["1", 0],
                    "positive": ["2", 0],
                    "negative": ["3", 0],
                    "latent_image": ["4", 0],
                    "seed": params.get('seed', 42),
                    "steps": 4,
                    "cfg": 1.0,
                    "sampler_name": "euler",
                    "scheduler": "normal",
                    "denoise": 1.0
                }
            },
            "6": {
                "class_type": "VAEDecode",
                "inputs": {
                    "samples": ["5", 0],
                    "vae": ["1", 2]
                }
            },
            "7": {
                "class_type": "VHS_VideoCombine",
                "inputs": {
                    "images": ["6", 0],
                    "frame_rate": 18,
                    "loop_count": 0,
                    "filename_prefix": "c8l_film",
                    "format": "video/h264-mp4",
                    "save_output": True
                }
            }
        }
        
        return workflow

    def _extract_video_url(self, outputs: Dict, prompt_id: str) -> Optional[str]:
        """Extrae URL del video de los outputs del job"""
        # Buscar nodos de salida que tengan video
        for node_id, node_output in outputs.items():
            # Videos generados por VHS_VideoCombine
            if 'gifs' in node_output:
                for gif in node_output['gifs']:
                    filename = gif.get('filename', '')
                    subfolder = gif.get('subfolder', '')
                    return (f"{self.base_url}/api/view?"
                            f"filename={filename}&subfolder={subfolder}"
                            f"&type=output")
            # Imágenes/videos en formato estándar
            if 'images' in node_output:
                for img in node_output['images']:
                    filename = img.get('filename', '')
                    subfolder = img.get('subfolder', '')
                    return (f"{self.base_url}/api/view?"
                            f"filename={filename}&subfolder={subfolder}"
                            f"&type=output")
        return None


    async def run_shared_workflow(self, params: Dict, chat_id: str = "") -> Dict:
        """
        Ejecuta el workflow compartido de Leo (773d308ebcf0).
        
        🔒 REQUIERE: Autorización del admin.
        """
        access = self.gate.check_access(chat_id, "comfyui_shared_workflow")
        if not access['allowed']:
            self.stats['blocked'] += 1
            return {'status': 'blocked', 'error': access['reason']}
        
        if not self.is_configured():
            return {'status': 'error', 'error': 'API key no configurada'}
        
        # Para workflows compartidos, se envía el workflow_id
        headers = {
            'X-API-Key': self.api_key,
            'Content-Type': 'application/json'
        }
        
        try:
            async with aiohttp.ClientSession() as session:
                payload = {
                    'workflow_id': self.shared_workflow_id,
                    'inputs': params
                }
                async with session.post(
                    f"{self.base_url}/api/prompt",
                    headers=headers,
                    json=payload,
                    timeout=aiohttp.ClientTimeout(total=30)
                ) as r:
                    if r.status == 200:
                        data = await r.json()
                        prompt_id = data.get('prompt_id')
                        result = await self._poll_job(session, headers, prompt_id)
                        self.stats['success'] += 1
                        return result
                    raise Exception(f"Shared workflow error: {r.status}")
        except Exception as e:
            self.stats['fail'] += 1
            return {'status': 'error', 'error': str(e), 'provider': 'comfyui_cloud'}

    def get_status(self) -> Dict:
        """Estado del proveedor ComfyUI Cloud"""
        return {
            'provider': 'comfyui_cloud',
            'configured': self.is_configured(),
            'type': 'PREMIUM (de pago)',
            'admin_locked': self.gate.global_lock,
            'authorized_users': len(self.gate.authorized_users),
            'stats': self.stats,
            'shared_workflow': self.shared_workflow_id,
            'hardware': 'RTX 6000 Pro 96GB VRAM',
            'models': '900+ pre-installed',
            'pricing': '$20-100/mes (créditos)',
            'warning': '🔒 REQUIERE PERMISO DEL ADMIN PARA USAR'
        }
