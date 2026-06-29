"""
🎬 FILM PIPELINE — Pipeline completo de producción
====================================================
Orquesta: guión → presupuesto → shot list → storyboard →
  generación de clips → música → edición → color → títulos → final
"""

import asyncio
import logging
from typing import Dict, List
from datetime import datetime

from film.skills import (
    ProducerSkill, DirectorSkill, EditorSkill,
    MotionGraphicsSkill, MusicProducerSkill
)
from film.video_api import VideoAPI

logger = logging.getLogger("c8l.film.pipeline")



class FilmPipeline:
    """Pipeline completo de producción cinematográfica"""

    def __init__(self):
        self.producer = ProducerSkill()
        self.director = DirectorSkill()
        self.editor = EditorSkill()
        self.motion = MotionGraphicsSkill()
        self.music = MusicProducerSkill()
        self.video_api = VideoAPI()
        self.projects = []

    async def produce_film(self, idea: str, style: str = "cinematic",
                           num_scenes: int = 5) -> Dict:
        """Pipeline completo: idea → película"""
        logger.info(f"🎬 Producción iniciada: {idea[:50]}...")

        # 1. PRE-PRODUCCIÓN
        script = await self.producer.create_script(idea)
        budget = await self.producer.calculate_budget(script)
        schedule = await self.producer.create_schedule(script)

        # 2. DIRECCIÓN
        shots = await self.director.create_shot_list(script)
        storyboard = await self.director.create_storyboard(shots)

        # 3. GENERACIÓN DE CLIPS
        clips = []
        for i, frame in enumerate(storyboard):
            try:
                result = await self.video_api.generate_video({
                    'prompt': frame['prompt'],
                    'duration': shots[i].get('duration', 10),
                    'ratio': '16:9'
                })
                clips.append({
                    'shot_id': frame['shot_id'],
                    'url': result.get('url'),
                    'duration': shots[i].get('duration', 10),
                    'provider': result.get('provider')
                })
            except Exception as e:
                logger.warning(f"Clip {i+1} falló: {e}")
                clips.append({
                    'shot_id': frame['shot_id'],
                    'url': None, 'duration': shots[i].get('duration', 10),
                    'error': str(e)
                })

        # 4. MÚSICA
        emotion = shots[0].get('emotion', 'dramatic') if shots else 'dramatic'
        total_dur = sum(c.get('duration', 0) for c in clips)
        score = await self.music.create_score(emotion, total_dur)

        # 5. POST-PRODUCCIÓN
        titles = await self.motion.create_titles(script['title'], style)
        timeline = await self.editor.edit_video(clips, score.get('url', ''), style)
        timeline = await self.editor.color_grade(timeline)
        timeline = await self.editor.add_titles(timeline, [titles])

        # RESULTADO
        project = {
            'id': datetime.now().strftime('%Y%m%d_%H%M%S'),
            'title': script['title'],
            'idea': idea, 'style': style,
            'script': script, 'budget': budget, 'schedule': schedule,
            'shots': shots, 'storyboard': storyboard,
            'clips': clips, 'score': score, 'titles': titles,
            'timeline': timeline,
            'duration': total_dur,
            'clips_generated': len([c for c in clips if c.get('url')]),
            'clips_failed': len([c for c in clips if not c.get('url')]),
            'timestamp': datetime.now().isoformat()
        }
        self.projects.append(project)
        logger.info(f"✅ Producción completada: {script['title']} ({total_dur}s)")
        return project

    async def produce_music_video(self, song_title: str, style: str = "neon") -> Dict:
        """Produce videoclip para una canción"""
        return await self.produce_film(
            f"Videoclip para '{song_title}' con estilo visual {style}",
            style=style, num_scenes=8
        )

    async def produce_promo(self, product: str, duration: int = 30) -> Dict:
        """Produce video promocional corto"""
        return await self.produce_film(
            f"Promo de {product}: impactante, moderno, atractivo",
            style="modern", num_scenes=max(3, duration // 10)
        )

    def list_projects(self) -> List[Dict]:
        return [{'id': p['id'], 'title': p['title'],
                 'duration': p['duration'], 'timestamp': p['timestamp']}
                for p in self.projects]
