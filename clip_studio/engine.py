"""
✂️ CLIP STUDIO ENGINE
======================
Motor principal para video repurposing.
Alternativa 100% gratuita a OpusClip.

Usa: Whisper (transcripción), FFmpeg (corte/reframe),
     Groq/OpenRouter (análisis viral), ASS (subtítulos)
"""

import os
import json
import asyncio
import logging
import tempfile
import subprocess
from typing import Dict, List, Optional, Tuple
from datetime import datetime

logger = logging.getLogger("c8l.clip_studio")

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CLIPS_DIR = os.path.join(BASE_DIR, "data", "clips")
os.makedirs(CLIPS_DIR, exist_ok=True)



class ClipStudio:
    """
    Motor de video repurposing.
    Video largo → clips cortos virales con subtítulos.
    """

    def __init__(self):
        self.clip_count = 0
        self.last_clip = None

    # ==================================================================
    # PIPELINE PRINCIPAL
    # ==================================================================

    async def process_video(self, video_path: str,
                             num_clips: int = 5,
                             clip_length: Tuple[int, int] = (15, 60),
                             add_captions: bool = True,
                             reframe_vertical: bool = True,
                             style: str = "bold") -> Dict:
        """
        Pipeline completo: video largo → clips virales.

        Args:
            video_path: Ruta al video largo
            num_clips: Cuántos clips generar (default 5)
            clip_length: Tupla (min_seg, max_seg) duración
            add_captions: Añadir subtítulos animados
            reframe_vertical: Convertir a 9:16
            style: Estilo de subtítulos (bold, minimal, neon)

        Returns:
            Dict con lista de clips generados
        """
        logger.info(f"✂️ Procesando video: {video_path}")

        # 1. Transcribir con Whisper
        transcript = await self._transcribe(video_path)
        if not transcript.get('segments'):
            return {'status': 'error', 'error': 'No se pudo transcribir'}

        # 2. Analizar y detectar mejores momentos
        moments = await self._detect_viral_moments(
            transcript, num_clips, clip_length)

        # 3. Cortar clips con FFmpeg
        clips = []
        for i, moment in enumerate(moments):
            clip = await self._cut_clip(
                video_path, moment, i + 1,
                add_captions, reframe_vertical, style
            )
            if clip.get('status') == 'success':
                clips.append(clip)

        self.clip_count += len(clips)
        self.last_clip = datetime.now().isoformat()

        return {
            'status': 'success',
            'clips': clips,
            'total_clips': len(clips),
            'source_duration': transcript.get('duration', 0),
            'transcript_segments': len(transcript.get('segments', []))
        }

    # ==================================================================
    # 1. TRANSCRIPCIÓN (Whisper via Groq — GRATIS)
    # ==================================================================

    async def _transcribe(self, video_path: str) -> Dict:
        """Transcribe el video usando Whisper via Groq API (gratis)"""
        try:
            # Extraer audio del video
            audio_path = video_path.rsplit('.', 1)[0] + '_audio.wav'
            await self._extract_audio(video_path, audio_path)

            # Intentar Groq Whisper (gratis, rápido)
            result = await self._whisper_groq(audio_path)
            if result:
                return result

            # Fallback: Whisper local
            result = await self._whisper_local(audio_path)
            if result:
                return result

            # Último fallback: FFmpeg extraer timestamps
            return self._basic_audio_analysis(audio_path)

        except Exception as e:
            logger.error(f"Transcription error: {e}")
            return {'segments': [], 'error': str(e)}

    async def _extract_audio(self, video_path: str, audio_path: str):
        """Extrae audio del video con FFmpeg"""
        cmd = [
            'ffmpeg', '-y', '-i', video_path,
            '-vn', '-acodec', 'pcm_s16le',
            '-ar', '16000', '-ac', '1',
            audio_path
        ]
        proc = await asyncio.create_subprocess_exec(
            *cmd, stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        await asyncio.wait_for(proc.communicate(), timeout=120)

    async def _whisper_groq(self, audio_path: str) -> Optional[Dict]:
        """Transcripción con Whisper via Groq (gratis)"""
        try:
            import aiohttp
            groq_key = os.getenv('GROQ_API_KEY', '')
            if not groq_key:
                return None

            url = "https://api.groq.com/openai/v1/audio/transcriptions"
            headers = {'Authorization': f'Bearer {groq_key}'}

            # Leer archivo audio
            with open(audio_path, 'rb') as f:
                audio_data = f.read()

            # Si el archivo es muy grande, cortarlo a 25MB
            max_size = 25 * 1024 * 1024
            if len(audio_data) > max_size:
                audio_data = audio_data[:max_size]

            form = aiohttp.FormData()
            form.add_field('file', audio_data,
                          filename='audio.wav',
                          content_type='audio/wav')
            form.add_field('model', 'whisper-large-v3-turbo')
            form.add_field('response_format', 'verbose_json')
            form.add_field('timestamp_granularities[]', 'segment')

            async with aiohttp.ClientSession() as session:
                async with session.post(url, headers=headers,
                                        data=form,
                                        timeout=aiohttp.ClientTimeout(total=120)) as r:
                    if r.status == 200:
                        data = await r.json()
                        return {
                            'text': data.get('text', ''),
                            'segments': data.get('segments', []),
                            'duration': data.get('duration', 0),
                            'language': data.get('language', 'unknown'),
                            'method': 'groq_whisper'
                        }
                    return None
        except Exception as e:
            logger.warning(f"Groq Whisper failed: {e}")
            return None

    async def _whisper_local(self, audio_path: str) -> Optional[Dict]:
        """Transcripción con Whisper local (si está instalado)"""
        try:
            import whisper
            model = whisper.load_model("base")
            result = model.transcribe(audio_path)
            return {
                'text': result.get('text', ''),
                'segments': result.get('segments', []),
                'duration': result.get('duration', 0),
                'method': 'whisper_local'
            }
        except ImportError:
            return None

    def _basic_audio_analysis(self, audio_path: str) -> Dict:
        """Análisis básico sin Whisper (detectar silencios)"""
        try:
            # Usar FFmpeg para detectar silencios
            cmd = [
                'ffmpeg', '-i', audio_path,
                '-af', 'silencedetect=noise=-30dB:d=2',
                '-f', 'null', '-'
            ]
            result = subprocess.run(cmd, capture_output=True,
                                   text=True, timeout=60)
            # Parsear silencios del stderr
            import re
            silences = re.findall(
                r'silence_end: ([\d.]+)',
                result.stderr
            )
            # Crear segmentos entre silencios
            segments = []
            prev = 0
            for s in silences:
                end = float(s)
                if end - prev > 3:
                    segments.append({
                        'start': prev,
                        'end': end,
                        'text': f'[Segment {len(segments)+1}]'
                    })
                prev = end

            return {'segments': segments, 'method': 'silence_detect'}
        except:
            return {'segments': []}



    # ==================================================================
    # 2. DETECCIÓN DE MOMENTOS VIRALES (LLM — GRATIS via Groq)
    # ==================================================================

    async def _detect_viral_moments(self, transcript: Dict,
                                     num_clips: int,
                                     clip_length: Tuple[int, int]) -> List[Dict]:
        """
        Usa LLM para detectar los mejores momentos del video.
        Analiza el transcript y devuelve timestamps con score viral.
        """
        segments = transcript.get('segments', [])
        if not segments:
            return []

        # Construir contexto del transcript
        transcript_text = "\n".join(
            f"[{s.get('start', 0):.1f}s - {s.get('end', 0):.1f}s] {s.get('text', '')}"
            for s in segments
        )

        # Pedir al LLM que identifique momentos virales
        prompt = (
            f"Analiza este transcript de video y selecciona los {num_clips} "
            f"mejores momentos para clips de redes sociales "
            f"(entre {clip_length[0]} y {clip_length[1]} segundos cada uno).\n\n"
            f"TRANSCRIPT:\n{transcript_text[:4000]}\n\n"
            f"Para cada clip devuelve JSON con:\n"
            f"- start: segundo de inicio\n"
            f"- end: segundo de fin\n"
            f"- hook: frase gancho (primeras palabras)\n"
            f"- virality_score: 1-100 (qué tan viral será)\n"
            f"- reason: por qué es buen momento\n\n"
            f"Responde SOLO con un JSON array. Sin explicaciones."
        )

        moments = await self._call_llm(prompt)

        if not moments:
            # Fallback: dividir equitativamente
            moments = self._divide_evenly(segments, num_clips, clip_length)

        # Ordenar por virality score
        moments.sort(key=lambda x: x.get('virality_score', 0), reverse=True)
        return moments[:num_clips]

    async def _call_llm(self, prompt: str) -> Optional[List[Dict]]:
        """Llama al LLM (Groq gratis) para análisis"""
        try:
            import aiohttp
            groq_key = os.getenv('GROQ_API_KEY', '')
            if not groq_key:
                return None

            url = "https://api.groq.com/openai/v1/chat/completions"
            headers = {
                'Authorization': f'Bearer {groq_key}',
                'Content-Type': 'application/json'
            }
            payload = {
                'model': 'llama-3.3-70b-versatile',
                'messages': [{'role': 'user', 'content': prompt}],
                'temperature': 0.3,
                'max_tokens': 2000
            }

            async with aiohttp.ClientSession() as session:
                async with session.post(url, headers=headers,
                                        json=payload, timeout=30) as r:
                    if r.status == 200:
                        data = await r.json()
                        content = data['choices'][0]['message']['content']
                        # Parsear JSON
                        import re
                        json_match = re.search(r'\[.*\]', content, re.DOTALL)
                        if json_match:
                            return json.loads(json_match.group())
            return None
        except Exception as e:
            logger.warning(f"LLM call failed: {e}")
            return None

    def _divide_evenly(self, segments: List[Dict], num_clips: int,
                        clip_length: Tuple[int, int]) -> List[Dict]:
        """Fallback: divide el video equitativamente"""
        if not segments:
            return []

        total_dur = segments[-1].get('end', 60)
        interval = total_dur / num_clips
        target_len = (clip_length[0] + clip_length[1]) / 2

        moments = []
        for i in range(num_clips):
            start = i * interval
            end = min(start + target_len, total_dur)
            moments.append({
                'start': round(start, 1),
                'end': round(end, 1),
                'hook': f'Clip {i+1}',
                'virality_score': 50,
                'reason': 'División equitativa'
            })
        return moments



    # ==================================================================
    # 3. CORTAR + SUBTÍTULOS + REFRAME (FFmpeg — GRATIS)
    # ==================================================================

    async def _cut_clip(self, video_path: str, moment: Dict,
                         clip_num: int, add_captions: bool,
                         reframe: bool, style: str) -> Dict:
        """Corta un clip, añade subtítulos y reframe"""
        start = moment.get('start', 0)
        end = moment.get('end', start + 30)
        duration = end - start

        # Nombre del clip
        clip_name = f"clip_{clip_num}_{int(datetime.now().timestamp())}"
        clip_path = os.path.join(CLIPS_DIR, f"{clip_name}.mp4")

        try:
            # Construir filtros FFmpeg
            filters = []

            # Reframe a vertical (9:16)
            if reframe:
                filters.append(
                    "scale=1080:1920:force_original_aspect_ratio=increase,"
                    "crop=1080:1920"
                )

            # Subtítulos (estilo bold/neon/minimal)
            if add_captions and moment.get('hook'):
                subs_filter = self._generate_caption_filter(
                    moment.get('hook', ''), style)
                if subs_filter:
                    filters.append(subs_filter)

            # Construir comando FFmpeg
            filter_str = ','.join(filters) if filters else None

            cmd = ['ffmpeg', '-y',
                   '-ss', str(start),
                   '-i', video_path,
                   '-t', str(duration)]

            if filter_str:
                cmd.extend(['-vf', filter_str])

            cmd.extend([
                '-c:v', 'libx264',
                '-c:a', 'aac',
                '-preset', 'fast',
                '-crf', '23',
                clip_path
            ])

            proc = await asyncio.create_subprocess_exec(
                *cmd, stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            stdout, stderr = await asyncio.wait_for(
                proc.communicate(), timeout=120)

            if proc.returncode == 0 and os.path.exists(clip_path):
                with open(clip_path, 'rb') as f:
                    clip_bytes = f.read()

                return {
                    'status': 'success',
                    'clip_num': clip_num,
                    'path': clip_path,
                    'bytes': clip_bytes,
                    'filename': f"{clip_name}.mp4",
                    'start': start,
                    'end': end,
                    'duration': duration,
                    'hook': moment.get('hook', ''),
                    'virality_score': moment.get('virality_score', 0),
                    'reason': moment.get('reason', ''),
                    'reframed': reframe,
                    'captioned': add_captions,
                    'size_mb': round(len(clip_bytes) / 1024 / 1024, 2)
                }
            else:
                error = stderr.decode('utf-8', errors='replace')[:200]
                return {'status': 'error', 'error': f'FFmpeg: {error}',
                        'clip_num': clip_num}

        except asyncio.TimeoutError:
            return {'status': 'error', 'error': 'Timeout cortando clip',
                    'clip_num': clip_num}
        except Exception as e:
            return {'status': 'error', 'error': str(e),
                    'clip_num': clip_num}

    def _generate_caption_filter(self, text: str, style: str) -> str:
        """Genera filtro FFmpeg para subtítulos animados"""
        # Limitar texto
        text = text[:60].replace("'", "\\'").replace(":", "\\:")

        styles = {
            'bold': {
                'fontsize': 48,
                'fontcolor': 'white',
                'borderw': 3,
                'bordercolor': 'black',
                'font': 'Arial'
            },
            'neon': {
                'fontsize': 44,
                'fontcolor': '00FFFF',
                'borderw': 2,
                'bordercolor': '0088FF',
                'font': 'Arial'
            },
            'minimal': {
                'fontsize': 36,
                'fontcolor': 'white',
                'borderw': 1,
                'bordercolor': '333333',
                'font': 'Arial'
            }
        }

        s = styles.get(style, styles['bold'])

        return (
            f"drawtext=text='{text}':"
            f"fontsize={s['fontsize']}:"
            f"fontcolor={s['fontcolor']}:"
            f"borderw={s['borderw']}:"
            f"bordercolor={s['bordercolor']}:"
            f"x=(w-text_w)/2:y=h-th-80:"
            f"enable='between(t,0,5)'"
        )

    # ==================================================================
    # UTILIDADES
    # ==================================================================

    def get_status(self) -> Dict:
        return {
            'clip_count': self.clip_count,
            'last_clip': self.last_clip,
            'clips_dir': CLIPS_DIR,
            'ffmpeg': self._check_ffmpeg(),
            'groq': bool(os.getenv('GROQ_API_KEY')),
            'cost': '$0'
        }

    def _check_ffmpeg(self) -> bool:
        try:
            r = subprocess.run(['ffmpeg', '-version'],
                             capture_output=True, timeout=5)
            return r.returncode == 0
        except:
            return False
