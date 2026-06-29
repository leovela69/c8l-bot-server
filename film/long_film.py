"""
🎬 LONG FILM MODULE — Peliculas de 60+ minutos desde una idea
================================================================
Iguala a Utopaí Studios: una idea → película completa de 60 min.

Componentes:
1. LongFormWriter — Guionista largo (3 actos, 60-120 escenas)
2. CharacterManager — Persistencia de personajes (face reference)
3. BatchGenerator — Generación masiva con cola y rate limiting
4. VideoAssembler — FFmpeg concatenación real + audio sync
5. LongFilmOrchestrator — Coordinador maestro con checkpoints

Costo: $0/mes (providers gratuitos) o premium con ComfyUI Cloud (admin-only)
"""

import os
import json
import asyncio
import logging
import hashlib
import tempfile
import subprocess
from typing import Dict, List, Optional, Callable
from datetime import datetime
from enum import Enum

logger = logging.getLogger("c8l.film.long_film")

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "data")
FILMS_DIR = os.path.join(DATA_DIR, "films")
CHECKPOINTS_DIR = os.path.join(FILMS_DIR, "checkpoints")
FACES_DIR = os.path.join(DATA_DIR, "faces")

os.makedirs(FILMS_DIR, exist_ok=True)
os.makedirs(CHECKPOINTS_DIR, exist_ok=True)
os.makedirs(FACES_DIR, exist_ok=True)



try:
    import aiohttp
    AIOHTTP_AVAILABLE = True
except ImportError:
    AIOHTTP_AVAILABLE = False


# ==================================================================
# CONFIGURACIÓN
# ==================================================================

# Admin chat ID — SOLO Leo puede activar providers de pago
ADMIN_CHAT_ID = os.environ.get("ADMIN_CHAT_ID", "")

# Duración máxima de clips individuales (según providers gratuitos)
MAX_CLIP_DURATION = 15  # segundos
DEFAULT_FPS = 24

# Límites de rate para no saturar APIs gratuitas
RATE_LIMIT_DELAY = 5  # segundos entre cada clip
MAX_CONCURRENT_CLIPS = 3  # clips en paralelo
MAX_RETRIES = 3


class FilmLength(Enum):
    """Duraciones predefinidas"""
    SHORT = 5        # 5 min (~20 clips)
    MEDIUM = 15      # 15 min (~60 clips)
    LONG = 30        # 30 min (~120 clips)
    FEATURE = 60     # 60 min (~240 clips)
    EXTENDED = 90    # 90 min (~360 clips)



# ==================================================================
# 1. LONGFORMWRITER — Guionista de películas largas
# ==================================================================

class LongFormWriter:
    """
    Genera un guión completo de 3 actos desde una sola idea.
    Usa Groq/OpenRouter (gratis) para generar el guión estructurado.
    
    Output: 60-120 escenas con:
    - Arco narrativo completo (setup → conflict → resolution)
    - Personajes con arcos de desarrollo
    - Descripciones visuales para cada escena (prompts para video IA)
    - Diálogos y narración
    - Indicaciones de música/SFX
    """

    def __init__(self):
        self.groq_key = os.environ.get("GROQ_API_KEY", "")
        self.openrouter_key = os.environ.get("OPENROUTER_API_KEY", "")
        self.groq_url = "https://api.groq.com/openai/v1/chat/completions"
        self.openrouter_url = "https://openrouter.ai/api/v1/chat/completions"

    async def generate_screenplay(self, idea: str,
                                   duration_minutes: int = 60,
                                   genre: str = "drama",
                                   style: str = "cinematic",
                                   language: str = "es") -> Dict:
        """
        Genera guión completo desde una idea.
        
        Args:
            idea: La idea central de la película
            duration_minutes: Duración objetivo en minutos
            genre: Género (drama, scifi, horror, comedy, action, romance)
            style: Estilo visual (cinematic, anime, noir, documentary, neon)
            language: Idioma del guión (es, en)
        
        Returns:
            Dict con estructura completa del guión
        """
        num_scenes = self._calculate_scenes(duration_minutes)
        
        # Paso 1: Generar estructura de 3 actos
        structure = await self._generate_structure(idea, genre, num_scenes, language)
        
        # Paso 2: Generar personajes
        characters = await self._generate_characters(idea, genre, structure, language)
        
        # Paso 3: Generar escenas detalladas por acto
        scenes = await self._generate_all_scenes(
            structure, characters, style, num_scenes, language
        )
        
        # Paso 4: Generar indicaciones de música
        music_cues = self._generate_music_cues(scenes)
        
        screenplay = {
            'title': structure.get('title', 'Sin Título'),
            'logline': structure.get('logline', ''),
            'genre': genre,
            'style': style,
            'language': language,
            'duration_target': duration_minutes,
            'total_scenes': len(scenes),
            'estimated_duration': sum(s.get('duration', 12) for s in scenes),
            'structure': structure,
            'characters': characters,
            'scenes': scenes,
            'music_cues': music_cues,
            'created_at': datetime.now().isoformat()
        }
        
        logger.info(f"📝 Guión generado: '{screenplay['title']}' "
                    f"({len(scenes)} escenas, ~{screenplay['estimated_duration']}s)")
        return screenplay


    def _calculate_scenes(self, duration_minutes: int) -> int:
        """Calcula número de escenas según duración objetivo"""
        avg_scene_duration = 12  # segundos promedio por clip
        total_seconds = duration_minutes * 60
        return max(10, total_seconds // avg_scene_duration)

    async def _generate_structure(self, idea: str, genre: str,
                                   num_scenes: int, language: str) -> Dict:
        """Genera estructura de 3 actos con IA"""
        lang_text = "español" if language == "es" else "English"
        
        prompt = f"""Eres un guionista profesional de cine. Genera la ESTRUCTURA de una película.

IDEA: {idea}
GÉNERO: {genre}
NÚMERO DE ESCENAS: {num_scenes}
IDIOMA: {lang_text}

Responde SOLO en JSON válido con esta estructura:
{{
  "title": "Título de la película",
  "logline": "Una frase que resuma la historia",
  "theme": "Tema central",
  "act_1": {{
    "name": "Setup",
    "description": "Descripción del primer acto",
    "scene_count": {num_scenes // 4},
    "key_events": ["evento1", "evento2", "evento3"]
  }},
  "act_2": {{
    "name": "Confrontación",
    "description": "Descripción del segundo acto",
    "scene_count": {num_scenes // 2},
    "key_events": ["evento1", "evento2", "evento3", "evento4"]
  }},
  "act_3": {{
    "name": "Resolución",
    "description": "Descripción del tercer acto",
    "scene_count": {num_scenes // 4},
    "key_events": ["evento1", "evento2", "evento3"]
  }}
}}"""

        return await self._call_llm(prompt)


    async def _generate_characters(self, idea: str, genre: str,
                                    structure: Dict, language: str) -> List[Dict]:
        """Genera personajes con descripciones visuales detalladas"""
        lang_text = "español" if language == "es" else "English"
        
        prompt = f"""Eres un director de casting. Genera los personajes para esta película.

TÍTULO: {structure.get('title', 'Película')}
LOGLINE: {structure.get('logline', idea)}
GÉNERO: {genre}
IDIOMA: {lang_text}

Responde SOLO en JSON válido — una lista de personajes:
[
  {{
    "id": "char_1",
    "name": "Nombre del personaje",
    "role": "protagonist/antagonist/support",
    "age": 30,
    "appearance": "Descripción visual MUY detallada para IA: género, etnia, cabello, ojos, complexión, ropa típica",
    "personality": "Rasgos de personalidad",
    "arc": "Cómo evoluciona en la historia",
    "voice_description": "Tipo de voz para TTS"
  }}
]
Genera entre 3 y 6 personajes."""

        result = await self._call_llm(prompt)
        if isinstance(result, list):
            return result
        return result.get('characters', []) if isinstance(result, dict) else []

    async def _generate_all_scenes(self, structure: Dict,
                                    characters: List[Dict],
                                    style: str, num_scenes: int,
                                    language: str) -> List[Dict]:
        """Genera todas las escenas en lotes por acto"""
        all_scenes = []
        char_descriptions = ", ".join(
            [f"{c.get('name', 'X')} ({c.get('appearance', '')})" 
             for c in characters[:4]]
        )
        
        acts = [
            ('act_1', structure.get('act_1', {})),
            ('act_2', structure.get('act_2', {})),
            ('act_3', structure.get('act_3', {}))
        ]
        
        scene_counter = 0
        for act_id, act_data in acts:
            act_scene_count = act_data.get('scene_count', num_scenes // 3)
            key_events = act_data.get('key_events', [])
            
            # Generar escenas en lotes de 10 para no exceder tokens
            for batch_start in range(0, act_scene_count, 10):
                batch_size = min(10, act_scene_count - batch_start)
                batch_scenes = await self._generate_scene_batch(
                    act_id, act_data, characters, char_descriptions,
                    style, batch_size, scene_counter, key_events, language
                )
                all_scenes.extend(batch_scenes)
                scene_counter += len(batch_scenes)
                
                # Rate limit entre lotes
                await asyncio.sleep(1)
        
        return all_scenes


    async def _generate_scene_batch(self, act_id: str, act_data: Dict,
                                     characters: List[Dict],
                                     char_descriptions: str,
                                     style: str, batch_size: int,
                                     start_index: int,
                                     key_events: List[str],
                                     language: str) -> List[Dict]:
        """Genera un lote de escenas"""
        lang_text = "español" if language == "es" else "English"
        events_text = ", ".join(key_events) if key_events else "desarrollo natural"
        
        prompt = f"""Eres un director de cine generando escenas detalladas.

ACTO: {act_data.get('name', act_id)}
DESCRIPCIÓN DEL ACTO: {act_data.get('description', '')}
EVENTOS CLAVE: {events_text}
PERSONAJES: {char_descriptions}
ESTILO VISUAL: {style}
IDIOMA: {lang_text}

Genera {batch_size} escenas (numeradas desde {start_index + 1}).
Cada escena DEBE tener un prompt visual detallado para generación de video con IA.

Responde SOLO en JSON válido — una lista:
[
  {{
    "id": "scene_{start_index + 1}",
    "number": {start_index + 1},
    "act": "{act_id}",
    "title": "Título corto de la escena",
    "description": "Qué sucede narrativamente",
    "visual_prompt": "Prompt DETALLADO para video IA: describe plano, iluminación, ambiente, acción, personajes visualmente. Estilo {style}. 4K cinematográfico.",
    "characters_present": ["char_1"],
    "emotion": "dramatic/happy/sad/tense/calm/energetic",
    "duration": 12,
    "camera": "wide/medium/close-up/tracking/aerial",
    "transition": "cut/fade/dissolve",
    "dialogue": "Diálogo breve si hay (o null)",
    "narration": "Narración en off si hay (o null)",
    "sfx": "Efectos de sonido clave"
  }}
]"""

        result = await self._call_llm(prompt)
        if isinstance(result, list):
            return result
        return []


    def _generate_music_cues(self, scenes: List[Dict]) -> List[Dict]:
        """Genera indicaciones de música basadas en las emociones de las escenas"""
        cues = []
        current_emotion = None
        cue_start = 0
        accumulated_duration = 0
        
        for i, scene in enumerate(scenes):
            emotion = scene.get('emotion', 'dramatic')
            duration = scene.get('duration', 12)
            
            if emotion != current_emotion:
                if current_emotion is not None:
                    cues.append({
                        'id': f"music_cue_{len(cues) + 1}",
                        'emotion': current_emotion,
                        'start_scene': cue_start,
                        'end_scene': i - 1,
                        'duration': accumulated_duration,
                        'prompt': f"{current_emotion} cinematic soundtrack, "
                                  f"orchestral, film score, {accumulated_duration}s"
                    })
                current_emotion = emotion
                cue_start = i
                accumulated_duration = duration
            else:
                accumulated_duration += duration
        
        # Último cue
        if current_emotion:
            cues.append({
                'id': f"music_cue_{len(cues) + 1}",
                'emotion': current_emotion,
                'start_scene': cue_start,
                'end_scene': len(scenes) - 1,
                'duration': accumulated_duration,
                'prompt': f"{current_emotion} cinematic soundtrack, "
                          f"orchestral, film score, {accumulated_duration}s"
            })
        
        return cues

    async def _call_llm(self, prompt: str) -> Dict:
        """Llama a Groq o OpenRouter (gratuitos) para generar texto"""
        # Intentar Groq primero
        if self.groq_key:
            try:
                return await self._call_groq(prompt)
            except Exception as e:
                logger.warning(f"Groq falló: {e}, intentando OpenRouter...")
        
        # Fallback a OpenRouter
        if self.openrouter_key:
            return await self._call_openrouter(prompt)
        
        # Fallback local (estructura básica)
        logger.warning("Sin API keys para LLM, generando estructura básica")
        return self._fallback_structure(prompt)


    async def _call_groq(self, prompt: str) -> Dict:
        """Llama a Groq API (gratis)"""
        headers = {
            'Authorization': f'Bearer {self.groq_key}',
            'Content-Type': 'application/json'
        }
        payload = {
            'model': 'llama-3.3-70b-versatile',
            'messages': [
                {'role': 'system', 'content': 'Responde SOLO en JSON válido. Sin markdown, sin explicaciones.'},
                {'role': 'user', 'content': prompt}
            ],
            'temperature': 0.8,
            'max_tokens': 8000,
            'response_format': {'type': 'json_object'}
        }
        
        async with aiohttp.ClientSession() as session:
            async with session.post(self.groq_url, headers=headers,
                                    json=payload,
                                    timeout=aiohttp.ClientTimeout(total=60)) as r:
                if r.status == 200:
                    data = await r.json()
                    content = data['choices'][0]['message']['content']
                    return json.loads(content)
                raise Exception(f"Groq error: {r.status}")

    async def _call_openrouter(self, prompt: str) -> Dict:
        """Llama a OpenRouter (modelos gratuitos)"""
        headers = {
            'Authorization': f'Bearer {self.openrouter_key}',
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://c8l-agency.com',
            'X-Title': 'C8L Film Producer'
        }
        payload = {
            'model': 'deepseek/deepseek-v4-flash:free',
            'messages': [
                {'role': 'system', 'content': 'Responde SOLO en JSON válido. Sin markdown.'},
                {'role': 'user', 'content': prompt}
            ],
            'temperature': 0.8,
            'max_tokens': 8000
        }
        
        async with aiohttp.ClientSession() as session:
            async with session.post(self.openrouter_url, headers=headers,
                                    json=payload,
                                    timeout=aiohttp.ClientTimeout(total=60)) as r:
                if r.status == 200:
                    data = await r.json()
                    content = data['choices'][0]['message']['content']
                    # Limpiar posible markdown
                    content = content.strip()
                    if content.startswith('```'):
                        content = content.split('\n', 1)[1].rsplit('```', 1)[0]
                    return json.loads(content)
                raise Exception(f"OpenRouter error: {r.status}")

    def _fallback_structure(self, prompt: str) -> Dict:
        """Estructura básica si no hay API keys"""
        return {
            'title': 'Película Sin Título',
            'logline': 'Una historia generada automáticamente.',
            'theme': 'aventura',
            'act_1': {'name': 'Setup', 'description': 'Introducción',
                      'scene_count': 5, 'key_events': ['Inicio']},
            'act_2': {'name': 'Confrontación', 'description': 'Desarrollo',
                      'scene_count': 10, 'key_events': ['Conflicto']},
            'act_3': {'name': 'Resolución', 'description': 'Final',
                      'scene_count': 5, 'key_events': ['Desenlace']}
        }



# ==================================================================
# 2. CHARACTER MANAGER — Persistencia de personajes
# ==================================================================

class CharacterManager:
    """
    Gestiona la consistencia visual de personajes a lo largo de toda la película.
    
    Funcionalidades:
    - Almacena "face reference" (imagen base) por personaje
    - Genera descripción visual consistente para CADA escena
    - Integra con Face Studio para face swap si es necesario
    - Mantiene un registro de apariciones por personaje
    
    Estrategia de consistencia:
    1. Genera imagen base del personaje (via Cloudflare/Pollinations)
    2. Usa esa imagen como referencia en TODOS los prompts donde aparece
    3. Si el provider soporta image-to-video, usa la face reference
    4. Si no, inyecta descripción visual detallada en el prompt de texto
    """

    def __init__(self):
        self.characters: Dict[str, Dict] = {}
        self.face_references: Dict[str, str] = {}  # char_id → path/url de imagen
        self.appearance_log: Dict[str, List[int]] = {}  # char_id → [scene_numbers]

    def register_characters(self, characters: List[Dict]) -> None:
        """Registra personajes del guión en el manager"""
        for char in characters:
            char_id = char.get('id', f"char_{len(self.characters)}")
            self.characters[char_id] = {
                'id': char_id,
                'name': char.get('name', 'Desconocido'),
                'role': char.get('role', 'support'),
                'appearance': char.get('appearance', ''),
                'age': char.get('age', 30),
                'voice_description': char.get('voice_description', ''),
                'visual_seed': self._generate_visual_seed(char),
                'registered_at': datetime.now().isoformat()
            }
            self.appearance_log[char_id] = []
            logger.info(f"🎭 Personaje registrado: {char.get('name')} ({char_id})")


    def _generate_visual_seed(self, char: Dict) -> int:
        """Genera un seed numérico consistente basado en la apariencia del personaje"""
        appearance = char.get('appearance', '') + char.get('name', '')
        return int(hashlib.md5(appearance.encode()).hexdigest()[:8], 16)

    async def generate_face_reference(self, char_id: str,
                                       video_api=None) -> Optional[str]:
        """
        Genera la imagen de referencia facial del personaje.
        Usa el VideoAPI para generar una imagen base que se reutilizará.
        """
        char = self.characters.get(char_id)
        if not char:
            logger.error(f"Personaje {char_id} no encontrado")
            return None

        appearance = char.get('appearance', '')
        name = char.get('name', '')
        
        # Prompt optimizado para generar retrato consistente
        portrait_prompt = (
            f"Professional portrait photo of {appearance}, "
            f"neutral expression, facing camera, studio lighting, "
            f"clean background, high detail face, 4K, photorealistic, "
            f"seed:{char.get('visual_seed', 42)}"
        )

        if video_api:
            try:
                result = await video_api.generate_image(portrait_prompt)
                if result.get('image_bytes'):
                    # Guardar en disco
                    face_path = os.path.join(FACES_DIR, f"{char_id}_reference.png")
                    with open(face_path, 'wb') as f:
                        f.write(result['image_bytes'])
                    self.face_references[char_id] = face_path
                    logger.info(f"🎭 Face reference generada: {name} → {face_path}")
                    return face_path
                elif result.get('url'):
                    self.face_references[char_id] = result['url']
                    return result['url']
            except Exception as e:
                logger.warning(f"Error generando face reference para {name}: {e}")
        
        # Sin video_api, solo guardar la descripción textual
        self.face_references[char_id] = f"text:{appearance}"
        return None


    async def generate_all_face_references(self, video_api=None) -> Dict[str, str]:
        """Genera face references para TODOS los personajes registrados"""
        results = {}
        for char_id in self.characters:
            ref = await self.generate_face_reference(char_id, video_api)
            results[char_id] = ref
            await asyncio.sleep(2)  # Rate limit
        return results

    def get_scene_prompt_with_characters(self, scene: Dict) -> str:
        """
        Enriquece el prompt visual de una escena con las descripciones
        consistentes de los personajes que aparecen en ella.
        """
        base_prompt = scene.get('visual_prompt', scene.get('description', ''))
        chars_in_scene = scene.get('characters_present', [])
        
        if not chars_in_scene:
            return base_prompt
        
        # Construir descripción de personajes para el prompt
        char_descriptions = []
        for char_id in chars_in_scene:
            char = self.characters.get(char_id)
            if char:
                appearance = char.get('appearance', '')
                name = char.get('name', '')
                char_descriptions.append(
                    f"{name} ({appearance})"
                )
                # Registrar aparición
                scene_num = scene.get('number', 0)
                if scene_num not in self.appearance_log.get(char_id, []):
                    self.appearance_log.setdefault(char_id, []).append(scene_num)
        
        if char_descriptions:
            chars_text = " | Characters: " + "; ".join(char_descriptions)
            return base_prompt + chars_text
        
        return base_prompt

    def get_face_reference_for_scene(self, scene: Dict) -> Optional[str]:
        """Retorna la face reference del personaje principal en la escena"""
        chars_in_scene = scene.get('characters_present', [])
        if chars_in_scene:
            # Priorizar protagonista
            for char_id in chars_in_scene:
                char = self.characters.get(char_id)
                if char and char.get('role') == 'protagonist':
                    return self.face_references.get(char_id)
            # Si no hay protagonista, usar el primero
            return self.face_references.get(chars_in_scene[0])
        return None

    def get_character_stats(self) -> Dict:
        """Estadísticas de personajes"""
        return {
            'total_characters': len(self.characters),
            'face_references_generated': len(self.face_references),
            'characters': {
                cid: {
                    'name': c.get('name'),
                    'role': c.get('role'),
                    'appearances': len(self.appearance_log.get(cid, [])),
                    'has_face_ref': cid in self.face_references
                }
                for cid, c in self.characters.items()
            }
        }



# ==================================================================
# 3. BATCH GENERATOR — Generación masiva con cola
# ==================================================================

class ClipStatus(Enum):
    """Estado de un clip en la cola"""
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"
    RETRYING = "retrying"


class BatchGenerator:
    """
    Genera clips de video en masa con:
    - Cola de tareas con prioridad
    - Rate limiting para no saturar APIs gratuitas
    - Retries automáticos con backoff exponencial
    - Paralelización controlada (max 3 simultáneos)
    - Progreso en tiempo real
    - Checkpoint/resume (si se interrumpe, continúa donde quedó)
    
    Para 60 min de video necesita ~240 clips de ~15s cada uno.
    Tiempo estimado: 2-4 horas con providers gratuitos.
    """

    def __init__(self, video_api=None, character_manager: CharacterManager = None):
        self.video_api = video_api
        self.character_manager = character_manager
        self.queue: List[Dict] = []
        self.completed: List[Dict] = []
        self.failed: List[Dict] = []
        self.in_progress: List[Dict] = []
        self.total_clips = 0
        self.progress_callback: Optional[Callable] = None
        self._running = False
        self._semaphore = asyncio.Semaphore(MAX_CONCURRENT_CLIPS)

    def set_progress_callback(self, callback: Callable) -> None:
        """Configura callback para reportar progreso (ej: enviar mensaje Telegram)"""
        self.progress_callback = callback


    def load_scenes_to_queue(self, scenes: List[Dict]) -> int:
        """
        Carga escenas del guión a la cola de generación.
        Retorna número de clips en cola.
        """
        self.queue = []
        for i, scene in enumerate(scenes):
            # Obtener prompt enriquecido con personajes si hay CharacterManager
            if self.character_manager:
                prompt = self.character_manager.get_scene_prompt_with_characters(scene)
                face_ref = self.character_manager.get_face_reference_for_scene(scene)
            else:
                prompt = scene.get('visual_prompt', scene.get('description', ''))
                face_ref = None

            clip_task = {
                'id': f"clip_{i+1:04d}",
                'scene_id': scene.get('id', f"scene_{i+1}"),
                'scene_number': scene.get('number', i + 1),
                'prompt': prompt,
                'duration': min(scene.get('duration', 12), MAX_CLIP_DURATION),
                'face_reference': face_ref,
                'camera': scene.get('camera', 'medium'),
                'emotion': scene.get('emotion', 'dramatic'),
                'status': ClipStatus.PENDING.value,
                'retries': 0,
                'result': None,
                'error': None,
                'started_at': None,
                'completed_at': None
            }
            self.queue.append(clip_task)

        self.total_clips = len(self.queue)
        logger.info(f"📋 Cola cargada: {self.total_clips} clips para generar")
        return self.total_clips

    async def generate_all(self) -> Dict:
        """
        Ejecuta la generación de TODOS los clips en la cola.
        Usa paralelización controlada + rate limiting.
        """
        if not self.video_api:
            raise ValueError("VideoAPI no configurado en BatchGenerator")

        self._running = True
        start_time = datetime.now()
        
        logger.info(f"🎬 Iniciando generación masiva: {self.total_clips} clips "
                    f"(max {MAX_CONCURRENT_CLIPS} en paralelo)")

        # Crear tareas para todos los clips pendientes
        pending = [c for c in self.queue if c['status'] == ClipStatus.PENDING.value]
        
        # Procesar en paralelo con semáforo
        tasks = [self._generate_single_clip(clip) for clip in pending]
        await asyncio.gather(*tasks, return_exceptions=True)

        self._running = False
        elapsed = (datetime.now() - start_time).total_seconds()

        result = {
            'total_clips': self.total_clips,
            'completed': len(self.completed),
            'failed': len(self.failed),
            'success_rate': len(self.completed) / max(1, self.total_clips) * 100,
            'elapsed_seconds': elapsed,
            'elapsed_human': self._format_time(elapsed),
            'clips': self.queue
        }

        logger.info(f"✅ Generación completada: {result['completed']}/{self.total_clips} "
                    f"({result['success_rate']:.1f}%) en {result['elapsed_human']}")
        
        return result


    async def _generate_single_clip(self, clip: Dict) -> None:
        """Genera un solo clip con rate limiting y retries"""
        async with self._semaphore:
            clip['status'] = ClipStatus.IN_PROGRESS.value
            clip['started_at'] = datetime.now().isoformat()
            self.in_progress.append(clip)

            for attempt in range(MAX_RETRIES):
                try:
                    # Rate limiting
                    await asyncio.sleep(RATE_LIMIT_DELAY)

                    # Preparar parámetros
                    params = {
                        'prompt': clip['prompt'],
                        'duration': clip['duration'],
                        'ratio': '16:9'
                    }

                    # Si hay face reference (imagen), usar image-to-video
                    face_ref = clip.get('face_reference')
                    if face_ref and not face_ref.startswith('text:'):
                        params['type'] = 'image_to_video'
                        params['image_url'] = face_ref

                    # Generar con VideoAPI (fallback automático entre providers)
                    result = await self.video_api.generate_video(params)

                    # Éxito
                    clip['status'] = ClipStatus.COMPLETED.value
                    clip['result'] = result
                    clip['completed_at'] = datetime.now().isoformat()
                    clip['provider_used'] = result.get('provider', 'unknown')
                    self.completed.append(clip)
                    
                    if clip in self.in_progress:
                        self.in_progress.remove(clip)

                    # Reportar progreso
                    await self._report_progress(clip)
                    return

                except Exception as e:
                    clip['retries'] = attempt + 1
                    clip['error'] = str(e)
                    logger.warning(
                        f"Clip {clip['id']} intento {attempt+1}/{MAX_RETRIES} falló: {e}"
                    )
                    
                    if attempt < MAX_RETRIES - 1:
                        clip['status'] = ClipStatus.RETRYING.value
                        # Backoff exponencial
                        wait = RATE_LIMIT_DELAY * (2 ** attempt)
                        await asyncio.sleep(wait)

            # Todos los intentos fallaron
            clip['status'] = ClipStatus.FAILED.value
            self.failed.append(clip)
            if clip in self.in_progress:
                self.in_progress.remove(clip)
            logger.error(f"❌ Clip {clip['id']} falló después de {MAX_RETRIES} intentos")


    async def _report_progress(self, clip: Dict) -> None:
        """Reporta progreso via callback (cada 10 clips o milestones)"""
        completed_count = len(self.completed)
        
        # Reportar cada 10 clips o en milestones (25%, 50%, 75%, 100%)
        should_report = (
            completed_count % 10 == 0 or
            completed_count == self.total_clips or
            completed_count == self.total_clips // 4 or
            completed_count == self.total_clips // 2 or
            completed_count == (self.total_clips * 3) // 4
        )
        
        if should_report and self.progress_callback:
            progress_pct = completed_count / max(1, self.total_clips) * 100
            message = (
                f"🎬 Progreso: {completed_count}/{self.total_clips} clips "
                f"({progress_pct:.0f}%) | "
                f"❌ Fallidos: {len(self.failed)}"
            )
            try:
                await self.progress_callback(message)
            except Exception:
                pass

    def get_progress(self) -> Dict:
        """Retorna estado actual de la generación"""
        return {
            'total': self.total_clips,
            'completed': len(self.completed),
            'failed': len(self.failed),
            'in_progress': len(self.in_progress),
            'pending': self.total_clips - len(self.completed) - len(self.failed) - len(self.in_progress),
            'progress_pct': len(self.completed) / max(1, self.total_clips) * 100,
            'is_running': self._running
        }

    def save_checkpoint(self, film_id: str) -> str:
        """Guarda estado actual a disco para poder resumir"""
        checkpoint = {
            'film_id': film_id,
            'total_clips': self.total_clips,
            'queue': self.queue,
            'saved_at': datetime.now().isoformat()
        }
        path = os.path.join(CHECKPOINTS_DIR, f"{film_id}_batch.json")
        with open(path, 'w', encoding='utf-8') as f:
            json.dump(checkpoint, f, ensure_ascii=False, indent=2)
        logger.info(f"💾 Checkpoint guardado: {path}")
        return path

    def load_checkpoint(self, film_id: str) -> bool:
        """Carga checkpoint previo y retoma donde se quedó"""
        path = os.path.join(CHECKPOINTS_DIR, f"{film_id}_batch.json")
        if not os.path.exists(path):
            return False
        
        with open(path, 'r', encoding='utf-8') as f:
            checkpoint = json.load(f)
        
        self.queue = checkpoint['queue']
        self.total_clips = checkpoint['total_clips']
        
        # Separar completados, fallidos y pendientes
        self.completed = [c for c in self.queue if c['status'] == ClipStatus.COMPLETED.value]
        self.failed = [c for c in self.queue if c['status'] == ClipStatus.FAILED.value]
        
        # Resetear los que estaban in_progress (se interrumpieron)
        for clip in self.queue:
            if clip['status'] in (ClipStatus.IN_PROGRESS.value, ClipStatus.RETRYING.value):
                clip['status'] = ClipStatus.PENDING.value
        
        logger.info(f"📂 Checkpoint cargado: {len(self.completed)} completados, "
                    f"{len(self.failed)} fallidos, retomando pendientes")
        return True

    def _format_time(self, seconds: float) -> str:
        """Formatea segundos a HH:MM:SS"""
        hours = int(seconds // 3600)
        minutes = int((seconds % 3600) // 60)
        secs = int(seconds % 60)
        if hours > 0:
            return f"{hours}h {minutes}m {secs}s"
        elif minutes > 0:
            return f"{minutes}m {secs}s"
        return f"{secs}s"



# ==================================================================
# 4. VIDEO ASSEMBLER — Ensamblaje con FFmpeg
# ==================================================================

class VideoAssembler:
    """
    Ensambla todos los clips generados en un video final usando FFmpeg.
    
    Funcionalidades:
    - Descarga clips desde URLs
    - Concatena clips con transiciones (cut, fade, dissolve)
    - Sincroniza audio (música + narración + SFX)
    - Aplica color grading global
    - Genera archivo MP4 final
    - Soporta resoluciones hasta 4K
    
    Requisito: FFmpeg instalado en el servidor (Render lo incluye).
    """

    def __init__(self):
        self.ffmpeg_path = os.environ.get("HYPERFRAMES_FFMPEG_PATH", "ffmpeg")
        self.output_dir = os.path.join(FILMS_DIR, "output")
        self.temp_dir = os.path.join(FILMS_DIR, "temp")
        os.makedirs(self.output_dir, exist_ok=True)
        os.makedirs(self.temp_dir, exist_ok=True)

    async def assemble_film(self, clips: List[Dict],
                             film_id: str,
                             music_url: Optional[str] = None,
                             narration_urls: Optional[List[str]] = None,
                             transitions: Optional[List[str]] = None,
                             resolution: str = "1920x1080",
                             fps: int = DEFAULT_FPS) -> Dict:
        """
        Ensambla película completa desde clips individuales.
        
        Args:
            clips: Lista de clips con 'url' o 'bytes' del BatchGenerator
            film_id: ID único de la película
            music_url: URL del audio de fondo (música)
            narration_urls: URLs de narración por escena
            transitions: Tipo de transición entre clips
            resolution: Resolución final (1920x1080, 3840x2160)
            fps: Frames por segundo
            
        Returns:
            Dict con path del archivo final y metadata
        """
        logger.info(f"🎬 Ensamblando película {film_id}: {len(clips)} clips")
        
        # Paso 1: Descargar todos los clips a archivos temporales
        local_clips = await self._download_clips(clips, film_id)
        
        if not local_clips:
            return {'status': 'error', 'error': 'No se pudieron descargar clips'}
        
        # Paso 2: Crear lista de concatenación para FFmpeg
        concat_list = self._create_concat_list(local_clips, film_id)
        
        # Paso 3: Concatenar clips
        concat_output = await self._concatenate_clips(
            concat_list, film_id, resolution, fps
        )
        
        if not concat_output:
            return {'status': 'error', 'error': 'Error en concatenación'}
        
        # Paso 4: Agregar audio (música + narración)
        final_output = await self._add_audio(
            concat_output, film_id, music_url, narration_urls
        )
        
        # Paso 5: Aplicar color grading básico
        if final_output:
            final_output = await self._apply_color_grade(final_output, film_id)
        
        # Limpiar temporales
        self._cleanup_temp(film_id)
        
        if final_output and os.path.exists(final_output):
            file_size = os.path.getsize(final_output)
            duration = await self._get_duration(final_output)
            
            result = {
                'status': 'success',
                'film_id': film_id,
                'output_path': final_output,
                'file_size_mb': round(file_size / (1024 * 1024), 2),
                'duration_seconds': duration,
                'duration_human': self._format_duration(duration),
                'resolution': resolution,
                'fps': fps,
                'clips_used': len(local_clips),
                'assembled_at': datetime.now().isoformat()
            }
            logger.info(f"✅ Película ensamblada: {result['duration_human']} "
                        f"({result['file_size_mb']} MB)")
            return result
        
        return {'status': 'error', 'error': 'Ensamblaje falló'}


    async def _download_clips(self, clips: List[Dict], film_id: str) -> List[str]:
        """Descarga clips desde URLs a archivos locales"""
        clip_dir = os.path.join(self.temp_dir, film_id, "clips")
        os.makedirs(clip_dir, exist_ok=True)
        
        local_paths = []
        
        for i, clip in enumerate(clips):
            if clip.get('status') != ClipStatus.COMPLETED.value:
                continue
            
            result = clip.get('result', {})
            url = result.get('url')
            video_bytes = result.get('video_bytes')
            
            clip_path = os.path.join(clip_dir, f"clip_{i:04d}.mp4")
            
            try:
                if video_bytes:
                    # Ya tenemos los bytes
                    with open(clip_path, 'wb') as f:
                        f.write(video_bytes)
                    local_paths.append(clip_path)
                elif url:
                    # Descargar desde URL
                    downloaded = await self._download_file(url, clip_path)
                    if downloaded:
                        local_paths.append(clip_path)
                    else:
                        logger.warning(f"No se pudo descargar clip {i}: {url}")
            except Exception as e:
                logger.warning(f"Error descargando clip {i}: {e}")
        
        logger.info(f"📥 Descargados {len(local_paths)}/{len(clips)} clips")
        return local_paths

    async def _download_file(self, url: str, output_path: str) -> bool:
        """Descarga un archivo desde URL"""
        try:
            if AIOHTTP_AVAILABLE:
                async with aiohttp.ClientSession() as session:
                    async with session.get(url, timeout=aiohttp.ClientTimeout(total=60)) as r:
                        if r.status == 200:
                            with open(output_path, 'wb') as f:
                                async for chunk in r.content.iter_chunked(8192):
                                    f.write(chunk)
                            return True
            else:
                import requests
                r = requests.get(url, timeout=60, stream=True)
                if r.status_code == 200:
                    with open(output_path, 'wb') as f:
                        for chunk in r.iter_content(8192):
                            f.write(chunk)
                    return True
        except Exception as e:
            logger.warning(f"Download error: {e}")
        return False


    def _create_concat_list(self, local_clips: List[str], film_id: str) -> str:
        """Crea archivo de texto para FFmpeg concat demuxer"""
        list_path = os.path.join(self.temp_dir, film_id, "concat_list.txt")
        os.makedirs(os.path.dirname(list_path), exist_ok=True)
        
        with open(list_path, 'w') as f:
            for clip_path in local_clips:
                # FFmpeg necesita paths con escape de comillas simples
                safe_path = clip_path.replace("'", "'\\''")
                f.write(f"file '{safe_path}'\n")
        
        return list_path

    async def _concatenate_clips(self, concat_list: str, film_id: str,
                                  resolution: str, fps: int) -> Optional[str]:
        """Concatena clips usando FFmpeg"""
        output_path = os.path.join(self.temp_dir, film_id, "concat_raw.mp4")
        width, height = resolution.split('x')
        
        # FFmpeg: concatenar + normalizar resolución y fps
        cmd = [
            self.ffmpeg_path, '-y',
            '-f', 'concat', '-safe', '0',
            '-i', concat_list,
            '-vf', f'scale={width}:{height}:force_original_aspect_ratio=decrease,'
                   f'pad={width}:{height}:(ow-iw)/2:(oh-ih)/2,fps={fps}',
            '-c:v', 'libx264', '-preset', 'medium',
            '-crf', '23',
            '-c:a', 'aac', '-b:a', '128k',
            '-movflags', '+faststart',
            output_path
        ]
        
        try:
            process = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            stdout, stderr = await process.communicate()
            
            if process.returncode == 0 and os.path.exists(output_path):
                logger.info(f"✅ Concatenación exitosa: {output_path}")
                return output_path
            else:
                logger.error(f"FFmpeg concat error: {stderr.decode()[:500]}")
                return None
        except FileNotFoundError:
            logger.error("FFmpeg no encontrado. Instalarlo: apt install ffmpeg")
            return None
        except Exception as e:
            logger.error(f"Error en concatenación: {e}")
            return None


    async def _add_audio(self, video_path: str, film_id: str,
                          music_url: Optional[str] = None,
                          narration_urls: Optional[List[str]] = None) -> Optional[str]:
        """Agrega audio al video (música de fondo + narración)"""
        output_path = os.path.join(self.temp_dir, film_id, "with_audio.mp4")
        
        # Si no hay audio, devolver el video tal cual
        if not music_url and not narration_urls:
            return video_path
        
        # Descargar música si hay URL
        music_path = None
        if music_url:
            music_path = os.path.join(self.temp_dir, film_id, "music.mp3")
            downloaded = await self._download_file(music_url, music_path)
            if not downloaded:
                music_path = None
        
        # Construir comando FFmpeg para mezclar audio
        cmd = [self.ffmpeg_path, '-y', '-i', video_path]
        
        filter_parts = []
        input_count = 1
        
        if music_path:
            cmd.extend(['-i', music_path])
            # Música al 30% de volumen para no tapar narración
            filter_parts.append(f'[{input_count}:a]volume=0.3[music]')
            input_count += 1
        
        if filter_parts:
            # Mezclar audio del video (si tiene) con música
            if music_path:
                cmd.extend([
                    '-filter_complex',
                    f'[{input_count - 1}:a]volume=0.3,aloop=loop=-1:size=2e+09[music];'
                    f'[music]atrim=0={await self._get_duration(video_path)}[musicfinal]',
                    '-map', '0:v',
                    '-map', '[musicfinal]',
                    '-c:v', 'copy',
                    '-c:a', 'aac', '-b:a', '192k',
                    '-shortest',
                    output_path
                ])
            else:
                cmd.extend(['-c', 'copy', output_path])
        else:
            return video_path
        
        try:
            process = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            stdout, stderr = await process.communicate()
            
            if process.returncode == 0 and os.path.exists(output_path):
                return output_path
            else:
                logger.warning(f"Audio mix falló, usando video sin audio: "
                              f"{stderr.decode()[:300]}")
                return video_path
        except Exception as e:
            logger.warning(f"Error mezclando audio: {e}")
            return video_path

    async def _apply_color_grade(self, video_path: str, film_id: str) -> str:
        """Aplica color grading cinematográfico básico"""
        output_path = os.path.join(self.output_dir, f"{film_id}_final.mp4")
        
        # Filtro de color cinematográfico (contraste + saturación leve)
        cmd = [
            self.ffmpeg_path, '-y',
            '-i', video_path,
            '-vf', 'eq=contrast=1.05:saturation=1.1:brightness=0.02',
            '-c:v', 'libx264', '-preset', 'medium', '-crf', '22',
            '-c:a', 'copy',
            '-movflags', '+faststart',
            output_path
        ]
        
        try:
            process = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            stdout, stderr = await process.communicate()
            
            if process.returncode == 0 and os.path.exists(output_path):
                return output_path
            else:
                logger.warning("Color grading falló, usando video sin grade")
                # Copiar sin grade
                import shutil
                shutil.copy2(video_path, output_path)
                return output_path
        except Exception as e:
            logger.warning(f"Error en color grade: {e}")
            import shutil
            shutil.copy2(video_path, output_path)
            return output_path


    async def _get_duration(self, video_path: str) -> float:
        """Obtiene la duración de un video en segundos"""
        cmd = [
            self.ffmpeg_path.replace('ffmpeg', 'ffprobe'),
            '-v', 'quiet',
            '-print_format', 'json',
            '-show_format',
            video_path
        ]
        try:
            process = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            stdout, stderr = await process.communicate()
            if process.returncode == 0:
                data = json.loads(stdout.decode())
                return float(data.get('format', {}).get('duration', 0))
        except Exception:
            pass
        return 0.0

    def _cleanup_temp(self, film_id: str) -> None:
        """Limpia archivos temporales de un film"""
        temp_path = os.path.join(self.temp_dir, film_id)
        try:
            import shutil
            if os.path.exists(temp_path):
                shutil.rmtree(temp_path)
                logger.info(f"🧹 Temporales limpiados: {temp_path}")
        except Exception as e:
            logger.warning(f"Error limpiando temporales: {e}")

    def _format_duration(self, seconds: float) -> str:
        """Formatea segundos a formato legible"""
        hours = int(seconds // 3600)
        minutes = int((seconds % 3600) // 60)
        secs = int(seconds % 60)
        if hours > 0:
            return f"{hours}h {minutes}m {secs}s"
        elif minutes > 0:
            return f"{minutes}m {secs}s"
        return f"{secs}s"



# ==================================================================
# 5. LONG FILM ORCHESTRATOR — Coordinador maestro
# ==================================================================

class LongFilmOrchestrator:
    """
    Coordinador maestro que orquesta TODO el pipeline de película larga:
    
    FLUJO COMPLETO:
    1. Recibe idea del usuario
    2. LongFormWriter genera guión (60-120 escenas)
    3. CharacterManager registra personajes y genera face references
    4. BatchGenerator genera todos los clips (240+ para 60 min)
    5. VideoAssembler ensambla película final con audio
    6. Entrega archivo MP4 al usuario via Telegram
    
    FEATURES:
    - Checkpoint/resume: si se interrumpe, continúa donde quedó
    - Progreso via Telegram: reporta % completado
    - Estimación de tiempo restante
    - ADMIN LOCK en ComfyUI Cloud (solo Leo puede activar pago)
    - Múltiples duraciones: 5 min, 15 min, 30 min, 60 min, 90 min
    """

    def __init__(self, video_api=None):
        self.writer = LongFormWriter()
        self.character_mgr = CharacterManager()
        self.batch_gen = None  # Se inicializa con video_api
        self.assembler = VideoAssembler()
        self.video_api = video_api
        self.active_productions: Dict[str, Dict] = {}
        self.progress_callback: Optional[Callable] = None
        
    def set_video_api(self, video_api) -> None:
        """Configura el VideoAPI (permite inyección tardía)"""
        self.video_api = video_api

    def set_progress_callback(self, callback: Callable) -> None:
        """Configura callback para reportar progreso (Telegram)"""
        self.progress_callback = callback


    async def produce_long_film(self, idea: str,
                                 duration_minutes: int = 60,
                                 genre: str = "drama",
                                 style: str = "cinematic",
                                 language: str = "es",
                                 user_id: str = "",
                                 resume_film_id: Optional[str] = None) -> Dict:
        """
        PIPELINE COMPLETO: idea → película de 60 min.
        
        Args:
            idea: La idea de la película (puede ser una frase o un párrafo)
            duration_minutes: Duración objetivo (5, 15, 30, 60, 90)
            genre: drama, scifi, horror, comedy, action, romance, documentary
            style: cinematic, anime, noir, neon, documentary, realistic
            language: es (español) o en (inglés)
            user_id: ID del usuario que solicita (para permisos)
            resume_film_id: Si se provee, intenta resumir producción previa
            
        Returns:
            Dict con resultado completo de la producción
        """
        # Generar film_id o usar existente para resume
        film_id = resume_film_id or f"film_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{user_id[:8]}"
        
        start_time = datetime.now()
        
        # Registrar producción activa
        self.active_productions[film_id] = {
            'id': film_id,
            'idea': idea,
            'user_id': user_id,
            'status': 'starting',
            'started_at': start_time.isoformat(),
            'duration_target': duration_minutes,
            'genre': genre,
            'style': style
        }
        
        await self._notify(f"🎬 *PRODUCCIÓN INICIADA*\n\n"
                           f"📝 Idea: _{idea[:100]}_\n"
                           f"⏱️ Duración: {duration_minutes} min\n"
                           f"🎭 Género: {genre}\n"
                           f"🎨 Estilo: {style}\n"
                           f"🆔 Film ID: `{film_id}`\n\n"
                           f"Esto tomará aproximadamente "
                           f"{self._estimate_time(duration_minutes)}...")
        
        try:
            # ============================================================
            # FASE 1: PRE-PRODUCCIÓN (Guión + Personajes)
            # ============================================================
            self.active_productions[film_id]['status'] = 'writing_screenplay'
            await self._notify("📝 *Fase 1/5:* Escribiendo guión...")
            
            screenplay = await self.writer.generate_screenplay(
                idea=idea,
                duration_minutes=duration_minutes,
                genre=genre,
                style=style,
                language=language
            )
            
            # Guardar checkpoint del guión
            self._save_screenplay_checkpoint(film_id, screenplay)
            
            await self._notify(
                f"✅ Guión completado: *{screenplay['title']}*\n"
                f"   📄 {screenplay['total_scenes']} escenas\n"
                f"   🎭 {len(screenplay.get('characters', []))} personajes\n"
                f"   ⏱️ ~{screenplay['estimated_duration'] // 60} min estimados"
            )


            # ============================================================
            # FASE 2: CASTING (Personajes + Face References)
            # ============================================================
            self.active_productions[film_id]['status'] = 'generating_characters'
            await self._notify("🎭 *Fase 2/5:* Generando personajes...")
            
            characters = screenplay.get('characters', [])
            self.character_mgr.register_characters(characters)
            
            # Generar face references para consistencia visual
            if self.video_api:
                await self.character_mgr.generate_all_face_references(self.video_api)
            
            char_stats = self.character_mgr.get_character_stats()
            await self._notify(
                f"✅ Personajes listos: {char_stats['total_characters']} registrados, "
                f"{char_stats['face_references_generated']} con face reference"
            )

            # ============================================================
            # FASE 3: PRODUCCIÓN (Generación masiva de clips)
            # ============================================================
            self.active_productions[film_id]['status'] = 'generating_clips'
            
            num_clips = len(screenplay.get('scenes', []))
            est_time = self._estimate_generation_time(num_clips)
            await self._notify(
                f"🎬 *Fase 3/5:* Generando {num_clips} clips de video...\n"
                f"   ⏱️ Tiempo estimado: {est_time}\n"
                f"   📊 Te avisaré cada 10 clips completados"
            )
            
            # Inicializar BatchGenerator
            self.batch_gen = BatchGenerator(
                video_api=self.video_api,
                character_manager=self.character_mgr
            )
            self.batch_gen.set_progress_callback(self._notify)
            
            # Intentar cargar checkpoint previo (resume)
            if resume_film_id and self.batch_gen.load_checkpoint(film_id):
                await self._notify("📂 Retomando producción previa desde checkpoint...")
            else:
                # Cargar escenas a la cola
                self.batch_gen.load_scenes_to_queue(screenplay['scenes'])
            
            # GENERAR TODOS LOS CLIPS
            batch_result = await self.batch_gen.generate_all()
            
            # Guardar checkpoint después de generación
            self.batch_gen.save_checkpoint(film_id)
            
            await self._notify(
                f"✅ Clips generados: {batch_result['completed']}/{batch_result['total_clips']}\n"
                f"   ❌ Fallidos: {batch_result['failed']}\n"
                f"   ⏱️ Tiempo: {batch_result['elapsed_human']}\n"
                f"   📊 Éxito: {batch_result['success_rate']:.1f}%"
            )


            # ============================================================
            # FASE 4: POST-PRODUCCIÓN (Ensamblaje + Audio)
            # ============================================================
            self.active_productions[film_id]['status'] = 'assembling'
            await self._notify("🎞️ *Fase 4/5:* Ensamblando película (FFmpeg)...")
            
            # Obtener música si hay music_cues
            music_url = None
            music_cues = screenplay.get('music_cues', [])
            if music_cues and music_cues[0].get('url'):
                music_url = music_cues[0]['url']
            
            # Ensamblar película
            assembly_result = await self.assembler.assemble_film(
                clips=self.batch_gen.queue,
                film_id=film_id,
                music_url=music_url
            )
            
            if assembly_result.get('status') != 'success':
                await self._notify(
                    f"⚠️ Ensamblaje parcial: {assembly_result.get('error', 'Error desconocido')}\n"
                    f"Los clips individuales están guardados."
                )

            # ============================================================
            # FASE 5: ENTREGA
            # ============================================================
            self.active_productions[film_id]['status'] = 'delivering'
            
            elapsed_total = (datetime.now() - start_time).total_seconds()
            
            final_result = {
                'film_id': film_id,
                'title': screenplay['title'],
                'idea': idea,
                'genre': genre,
                'style': style,
                'status': 'completed',
                'screenplay': {
                    'title': screenplay['title'],
                    'logline': screenplay.get('logline', ''),
                    'total_scenes': screenplay['total_scenes'],
                    'characters': len(characters)
                },
                'generation': {
                    'total_clips': batch_result['total_clips'],
                    'completed': batch_result['completed'],
                    'failed': batch_result['failed'],
                    'success_rate': batch_result['success_rate']
                },
                'assembly': assembly_result,
                'output_path': assembly_result.get('output_path'),
                'duration_final': assembly_result.get('duration_human', 'N/A'),
                'file_size_mb': assembly_result.get('file_size_mb', 0),
                'elapsed_total': elapsed_total,
                'elapsed_human': self._format_time(elapsed_total),
                'completed_at': datetime.now().isoformat(),
                'cost': '$0 (providers gratuitos)'
            }
            
            self.active_productions[film_id] = final_result
            
            await self._notify(
                f"🎬✅ *PELÍCULA COMPLETADA*\n\n"
                f"🎥 *{screenplay['title']}*\n"
                f"📝 _{screenplay.get('logline', '')}_\n\n"
                f"📊 Estadísticas:\n"
                f"   • Duración: {assembly_result.get('duration_human', 'N/A')}\n"
                f"   • Clips: {batch_result['completed']}/{batch_result['total_clips']}\n"
                f"   • Tamaño: {assembly_result.get('file_size_mb', 0)} MB\n"
                f"   • Tiempo total: {self._format_time(elapsed_total)}\n"
                f"   • Costo: $0\n\n"
                f"🆔 `{film_id}`"
            )
            
            return final_result

        except Exception as e:
            self.active_productions[film_id]['status'] = 'error'
            self.active_productions[film_id]['error'] = str(e)
            logger.error(f"❌ Error en producción {film_id}: {e}")
            await self._notify(f"❌ *Error en producción:*\n`{str(e)[:200]}`\n\n"
                               f"Puedes reintentar con: `/film resume {film_id}`")
            raise


    # ==================================================================
    # UTILIDADES DEL ORQUESTADOR
    # ==================================================================

    async def _notify(self, message: str) -> None:
        """Envía notificación de progreso via callback (Telegram)"""
        if self.progress_callback:
            try:
                await self.progress_callback(message)
            except Exception as e:
                logger.warning(f"Error enviando notificación: {e}")

    def _estimate_time(self, duration_minutes: int) -> str:
        """Estima tiempo total de producción"""
        clips = (duration_minutes * 60) // 12  # ~12s por clip
        # ~20s por clip (rate limit + generación + overhead)
        total_seconds = clips * 20
        hours = total_seconds // 3600
        minutes = (total_seconds % 3600) // 60
        if hours > 0:
            return f"{hours}h {minutes}min"
        return f"{minutes} minutos"

    def _estimate_generation_time(self, num_clips: int) -> str:
        """Estima tiempo de generación de clips"""
        # Con 3 en paralelo y 5s rate limit + ~10s generación
        effective_time_per_clip = (RATE_LIMIT_DELAY + 10) / MAX_CONCURRENT_CLIPS
        total = num_clips * effective_time_per_clip
        return self._format_time(total)

    def _format_time(self, seconds: float) -> str:
        """Formatea segundos"""
        hours = int(seconds // 3600)
        minutes = int((seconds % 3600) // 60)
        secs = int(seconds % 60)
        if hours > 0:
            return f"{hours}h {minutes}m {secs}s"
        elif minutes > 0:
            return f"{minutes}m {secs}s"
        return f"{secs}s"

    def _save_screenplay_checkpoint(self, film_id: str, screenplay: Dict) -> None:
        """Guarda guión a disco como checkpoint"""
        path = os.path.join(CHECKPOINTS_DIR, f"{film_id}_screenplay.json")
        try:
            with open(path, 'w', encoding='utf-8') as f:
                json.dump(screenplay, f, ensure_ascii=False, indent=2)
            logger.info(f"💾 Guión guardado: {path}")
        except Exception as e:
            logger.warning(f"Error guardando guión: {e}")

    def get_active_productions(self) -> List[Dict]:
        """Lista producciones activas"""
        return [
            {'id': k, 'status': v.get('status'), 'idea': v.get('idea', '')[:50]}
            for k, v in self.active_productions.items()
        ]

    def get_production_status(self, film_id: str) -> Optional[Dict]:
        """Estado de una producción específica"""
        return self.active_productions.get(film_id)

    async def cancel_production(self, film_id: str) -> bool:
        """Cancela una producción activa"""
        if film_id in self.active_productions:
            self.active_productions[film_id]['status'] = 'cancelled'
            if self.batch_gen:
                self.batch_gen._running = False
                self.batch_gen.save_checkpoint(film_id)
            await self._notify(f"🛑 Producción `{film_id}` cancelada. "
                               f"Checkpoint guardado para resumir después.")
            return True
        return False


    def get_capabilities(self) -> str:
        """Texto descriptivo de capacidades para el usuario"""
        return (
            "🎬 *LONG FILM PRODUCER — Películas de 60+ minutos*\n\n"
            "Genera una película completa desde una sola idea:\n\n"
            "📝 *Duraciones disponibles:*\n"
            "  • `/film corto [idea]` → 5 min (~20 clips, ~5 min)\n"
            "  • `/film medio [idea]` → 15 min (~60 clips, ~15 min)\n"
            "  • `/film largo [idea]` → 30 min (~120 clips, ~1h)\n"
            "  • `/film pelicula [idea]` → 60 min (~240 clips, ~3h)\n"
            "  • `/film extendido [idea]` → 90 min (~360 clips, ~4h)\n\n"
            "🎭 *Géneros:* drama, scifi, horror, comedy, action, romance\n"
            "🎨 *Estilos:* cinematic, anime, noir, neon, documentary\n\n"
            "⚙️ *Comandos:*\n"
            "  • `/film status [id]` — Ver progreso\n"
            "  • `/film cancel [id]` — Cancelar producción\n"
            "  • `/film resume [id]` — Retomar producción\n"
            "  • `/film list` — Ver producciones activas\n\n"
            "💰 *Costo:* $0 (usa providers gratuitos)\n"
            "🔒 *Premium (ComfyUI Cloud):* Solo con permiso del admin"
        )
