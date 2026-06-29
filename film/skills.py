"""
🎬 FILM PRODUCTION SKILLS
===========================
5 skills especializados para producción cinematográfica:
1. ProducerSkill - Guión, presupuesto, cronograma
2. DirectorSkill - Shot list, storyboard, composición
3. EditorSkill - Timeline, color grading, títulos
4. MotionGraphicsSkill - Animaciones, lower thirds, VFX
5. MusicProducerSkill - Banda sonora, SFX, estructura
"""

import random
from typing import Dict, List
from datetime import datetime


class ProducerSkill:
    """Productor — Guión, presupuesto, cronograma"""

    async def create_script(self, idea: str, genre: str = "drama") -> Dict:
        scenes = self._gen_scenes(idea, 5)
        return {
            'title': self._gen_title(idea),
            'genre': genre,
            'logline': f"Una historia sobre {idea[:50]} que cambiará tu perspectiva.",
            'scenes': scenes,
            'characters': self._gen_characters(3),
            'duration': sum(s['duration'] for s in scenes)
        }

    async def calculate_budget(self, script: Dict) -> Dict:
        dur = script.get('duration', 60)
        scenes = len(script.get('scenes', []))
        costs = {'crew': dur * 2.5, 'equipment': scenes * 50,
                 'locations': scenes * 30, 'post': dur * 3,
                 'music': dur * 1.5, 'contingency': dur * 1.0}
        return {'total': round(sum(costs.values()), 2), 'breakdown': costs}

    async def create_schedule(self, script: Dict) -> Dict:
        n = len(script.get('scenes', []))
        return {'pre_production': n * 0.5, 'production': n * 2,
                'post_production': n * 1.5, 'total_days': n * 4}

    def _gen_title(self, idea: str) -> str:
        titles = ["El Último Viaje", "Sueño Digital", "Corazones en Red",
                  "El Eco del Tiempo", "Luz en la Oscuridad", "Neon Dreams"]
        return random.choice(titles)

    def _gen_scenes(self, idea: str, count: int) -> List[Dict]:
        return [{'id': f"scene_{i+1}", 'title': f"Escena {i+1}",
                 'description': f"{idea[:30]} — momento {i+1}",
                 'duration': random.randint(8, 15),
                 'location': f"Localización {i+1}"} for i in range(count)]

    def _gen_characters(self, count: int) -> List[Dict]:
        names = ["Alex", "Luna", "Marco", "Zara", "Rey"]
        return [{'id': f"char_{i}", 'name': names[i % len(names)],
                 'role': ['protagonist', 'antagonist', 'support'][i % 3]}
                for i in range(count)]


class DirectorSkill:
    """Director — Visión creativa y planos"""

    SHOTS = ['wide', 'medium', 'close-up', 'extreme-close-up', 'over-shoulder']
    MOVES = ['static', 'pan', 'tilt', 'dolly', 'tracking', 'crane', 'handheld']
    COMPS = ['centered', 'rule_of_thirds', 'leading_lines', 'symmetrical', 'diagonal']
    EMOTIONS = ['dramatic', 'happy', 'melancholic', 'suspense', 'calm', 'energetic']

    async def create_shot_list(self, script: Dict) -> List[Dict]:
        shots = []
        for i, scene in enumerate(script.get('scenes', [])):
            shots.append({
                'id': f"shot_{i+1}", 'scene_id': scene['id'],
                'shot_type': self.SHOTS[i % len(self.SHOTS)],
                'camera_movement': self.MOVES[i % len(self.MOVES)],
                'composition': self.COMPS[i % len(self.COMPS)],
                'emotion': self.EMOTIONS[i % len(self.EMOTIONS)],
                'duration': scene.get('duration', 10),
                'description': f"Plano {i+1}: {scene.get('description', '')}"
            })
        return shots

    async def create_storyboard(self, shots: List[Dict]) -> List[Dict]:
        return [{
            'shot_id': s['id'],
            'visual': f"{s['shot_type']} shot, {s['camera_movement']}, {s['emotion']}",
            'prompt': f"{s['description']}, {s['shot_type']} shot, {s['camera_movement']} camera, "
                      f"{s['emotion']} mood, cinematic lighting, 4k, film grain"
        } for s in shots]


class EditorSkill:
    """Editor — Montaje y post-producción"""

    TRANSITIONS = ['cut', 'fade', 'dissolve', 'wipe', 'zoom', 'glitch']

    async def edit_video(self, clips: List[Dict], audio_url: str, style: str) -> Dict:
        return {
            'tracks': [
                {'type': 'video', 'clips': clips},
                {'type': 'audio', 'clips': [{'url': audio_url}]}
            ],
            'total_duration': sum(c.get('duration', 0) for c in clips),
            'transitions': [random.choice(self.TRANSITIONS) for _ in range(len(clips) - 1)],
            'style': style, 'fps': 24
        }

    async def color_grade(self, timeline: Dict) -> Dict:
        timeline['color'] = {'contrast': 1.1, 'saturation': 1.2,
                             'temperature': 0.0, 'lut': 'cinematic'}
        return timeline

    async def add_titles(self, video: Dict, titles: List[Dict]) -> Dict:
        video['titles'] = titles
        return video


class MotionGraphicsSkill:
    """Motion Graphics — Títulos y VFX"""

    ANIMS = {'modern': 'fade_scale', 'classic': 'fade', 'neon': 'glitch_glow', 'minimal': 'slide'}
    FONTS = {'modern': 'Outfit-Bold', 'classic': 'Lora', 'neon': 'Space-Grotesk', 'minimal': 'Inter'}
    COLORS = {'modern': '#D4AF37', 'classic': '#FFF', 'neon': '#00F3FF', 'minimal': '#FFF'}

    async def create_titles(self, text: str, style: str = 'modern', duration: int = 3) -> Dict:
        return {'text': text, 'style': style, 'duration': duration,
                'animation': self.ANIMS.get(style, 'fade'),
                'font': self.FONTS.get(style, 'Outfit-Bold'),
                'color': self.COLORS.get(style, '#D4AF37')}

    async def create_lower_third(self, name: str, role: str) -> Dict:
        return {'name': name, 'role': role, 'duration': 5, 'animation': 'slide_in_left'}

    async def create_effects(self, effects: List[str]) -> List[Dict]:
        return [{'type': e, 'intensity': 0.5} for e in effects]


class MusicProducerSkill:
    """Productor Musical — Banda sonora y SFX"""

    GENRES = {'dramatic': 'cinematic', 'happy': 'upbeat', 'melancholic': 'ambient',
              'suspense': 'tension', 'calm': 'ambient', 'energetic': 'electronic'}
    INSTRUMENTS = {'dramatic': ['piano', 'strings', 'drums'],
                   'happy': ['synth', 'guitar', 'drums'],
                   'melancholic': ['piano', 'cello'], 'suspense': ['synth', 'bass']}
    TEMPOS = {'dramatic': 90, 'happy': 120, 'melancholic': 70,
              'suspense': 110, 'calm': 60, 'energetic': 140}

    async def create_score(self, emotion: str, duration: int) -> Dict:
        return {
            'emotion': emotion, 'duration': duration,
            'genre': self.GENRES.get(emotion, 'cinematic'),
            'instruments': self.INSTRUMENTS.get(emotion, ['piano']),
            'tempo': self.TEMPOS.get(emotion, 90),
            'prompt': f"{self.GENRES.get(emotion, 'cinematic')} soundtrack, "
                      f"{emotion} mood, {self.TEMPOS.get(emotion, 90)} BPM, "
                      f"{', '.join(self.INSTRUMENTS.get(emotion, ['piano']))}"
        }

    async def create_sfx(self, scene_desc: str) -> List[Dict]:
        sfx = []
        keywords = {'explosion': ('boom', 0.8), 'water': ('splash', 0.5),
                    'door': ('creak', 0.3), 'wind': ('whoosh', 0.4),
                    'rain': ('rain_ambient', 0.6), 'steps': ('footsteps', 0.3)}
        for kw, (name, intensity) in keywords.items():
            if kw in scene_desc.lower():
                sfx.append({'type': name, 'intensity': intensity})
        return sfx
