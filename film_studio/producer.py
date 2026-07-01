# -*- coding: utf-8 -*-
"""
🎬 FILM STUDIO — Productor de cine con sirvientes especializados
====================================================================
Pipeline real (nada simulado) para producir peliculas/documentales
narrados de larga duracion, 100% gratis e ilimitado:

  Guionista (LLM) → outline → sirvientes de escena (en paralelo:
  dialogo con voces por personaje, imagen, ambiente sonoro, Ken Burns)
  → Montador (ffmpeg: concatena todo en un solo MP4)

No usa "video IA" generativo (eso cuesta dinero por segundo y no
puede ser gratis/ilimitado para 60 min) — usa imagenes IA animadas
con paneo/zoom cinematografico (Ken Burns) + narracion real (Edge TTS,
gratis e ilimitado) + ambiente sonoro procedural (ffmpeg, gratis).

Autor: C8L Agency / Leo
"""

import os
import re
import json
import time
import shutil
import asyncio
import logging
import tempfile
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from dataclasses import dataclass, field
from typing import Optional, Dict, List, Any

logger = logging.getLogger("c8l.film_studio")

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUTPUT_DIR = os.path.join(BASE_DIR, "data", "films")
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Resolucion/bitrate pensados para minimizar peso (pediste que pese menos)
# manteniendo calidad decente para contenido de paneo lento sobre imagenes.
VIDEO_WIDTH = 960
VIDEO_HEIGHT = 540
FPS = 24
CRF = 30  # mas alto = mas compresion = menos peso

# Voces Edge TTS en español, para variedad de personajes (gratis, ilimitado)
VOICE_POOL = [
    "es-MX-JorgeNeural", "es-MX-DaliaNeural",
    "es-ES-AlvaroNeural", "es-ES-ElviraNeural",
    "es-AR-TomasNeural", "es-AR-ElenaNeural",
    "es-CO-GonzaloNeural", "es-CO-SalomeNeural",
]
NARRATOR_VOICE = "es-MX-JorgeNeural"

AMBIENT_PRESETS = {
    # ffmpeg anoisesrc solo acepta: white, pink, brown, blue, violet, velvet
    "viento": ("pink", 0.05),
    "lluvia": ("pink", 0.08),
    "ciudad": ("brown", 0.05),
    "bosque": ("pink", 0.03),
    "tormenta": ("white", 0.10),
    "silencio": None,
}

WORDS_PER_SECOND = 2.3  # ritmo de habla promedio para estimar duracion


@dataclass
class Line:
    speaker: str
    voice: str
    text: str


@dataclass
class Scene:
    index: int
    title: str
    lines: List[Line]
    visual_prompt: str
    ambient: str = "silencio"
    clip_path: str = ""
    duration_sec: float = 0.0
    error: str = ""


@dataclass
class FilmResult:
    success: bool
    message: str
    title: str = ""
    path: Optional[str] = None
    duration_sec: float = 0.0
    size_mb: float = 0.0
    scenes: List[Scene] = field(default_factory=list)


class FilmProducer:
    """Estudio de produccion: guion -> escenas -> montaje final."""

    def __init__(self):
        self._pool = ThreadPoolExecutor(max_workers=6)
        # Pollinations rate-limita si se piden muchas imagenes a la vez
        self._image_semaphore = asyncio.Semaphore(2)

    # ------------------------------------------------------------------
    # FASE 1: GUIONISTA — outline + expansion de escenas
    # ------------------------------------------------------------------

    def _write_outline(self, idea: str, target_minutes: float) -> Dict:
        from api_router import get_router, APIProvider

        router = get_router()
        target_seconds = target_minutes * 60
        # ~90s por escena en promedio, min 2, max 40 escenas (limite razonable
        # de sirvientes en paralelo por produccion)
        num_scenes = max(2, min(40, round(target_seconds / 90)))

        prompt = f"""Eres el productor de una pelicula/documental narrado sobre:
"{idea}"

Escribe el OUTLINE (no el guion completo todavia) para {num_scenes} escenas,
duracion total objetivo: {target_minutes} minutos ({target_seconds:.0f}s).

Para cada escena da: titulo corto, resumen de 1-2 lineas de que pasa
(narracion y/o dialogo), y duracion objetivo en segundos (deben sumar
aprox {target_seconds:.0f}).

Responde SOLO con JSON:
{{"title": "Titulo de la produccion", "scenes": [
  {{"title": "...", "summary": "...", "duration_sec": 90, "characters": ["Narrador"]}}
]}}"""

        response = router.call_specific(
            provider=APIProvider.OPENROUTER,
            model="anthropic/claude-haiku-4.5",
            prompt=prompt,
            system="Eres un productor de cine/documentales experto en estructura narrativa. Responde SOLO con JSON valido.",
            max_tokens=2500,
        )
        data = self._parse_json(response)
        if not data or "scenes" not in data:
            # Fallback conservador: una sola escena narrada
            return {"title": idea[:60], "scenes": [
                {"title": idea[:40], "summary": idea, "duration_sec": min(target_seconds, 60),
                 "characters": ["Narrador"]}
            ]}
        return data

    def _expand_scene(self, outline_scene: Dict, idx: int, total: int) -> Scene:
        from api_router import get_router

        router = get_router()
        target_dur = outline_scene.get("duration_sec", 60)
        target_words = int(target_dur * WORDS_PER_SECOND)

        prompt = f"""Escena {idx+1}/{total} de una produccion narrada.
Titulo: {outline_scene.get('title', '')}
Resumen: {outline_scene.get('summary', '')}
Personajes disponibles: {outline_scene.get('characters', ['Narrador'])}
Extension objetivo: ~{target_words} palabras (para que dure ~{target_dur:.0f}s narrado).

Escribe el guion de ESTA escena. Si hay dialogo, marca cada linea con
"Personaje: texto". Si es solo narracion, usa "Narrador: texto".
Tambien indica el AMBIENTE sonoro de fondo (una palabra: viento, lluvia,
ciudad, bosque, tormenta o silencio) y una descripcion visual para generar
la imagen de fondo de la escena (en ingles, estilo cinematico).

Responde SOLO con JSON:
{{"lines": [{{"speaker": "Narrador", "text": "..."}}],
  "ambient": "silencio",
  "visual_prompt": "cinematic wide shot of ..."}}"""

        response = router.smart(
            prompt=prompt,
            system="Eres un guionista experto. Responde SOLO con JSON valido.",
            max_tokens=1500,
        )
        data = self._parse_json(response) or {}
        raw_lines = data.get("lines") or [{"speaker": "Narrador", "text": outline_scene.get("summary", "")}]

        speakers = {}
        lines = []
        for rl in raw_lines:
            speaker = str(rl.get("speaker", "Narrador")).strip() or "Narrador"
            text = str(rl.get("text", "")).strip()
            if not text:
                continue
            if speaker.lower() in ("narrador", "narrator"):
                voice = NARRATOR_VOICE
            else:
                if speaker not in speakers:
                    speakers[speaker] = VOICE_POOL[len(speakers) % len(VOICE_POOL)]
                voice = speakers[speaker]
            lines.append(Line(speaker=speaker, voice=voice, text=text))

        if not lines:
            lines = [Line(speaker="Narrador", voice=NARRATOR_VOICE,
                          text=outline_scene.get("summary", "..."))]

        ambient = str(data.get("ambient", "silencio")).strip().lower()
        if ambient not in AMBIENT_PRESETS:
            ambient = "silencio"

        visual_prompt = data.get("visual_prompt") or outline_scene.get("summary", "cinematic scene")

        return Scene(
            index=idx, title=outline_scene.get("title", f"Escena {idx+1}"),
            lines=lines, visual_prompt=visual_prompt, ambient=ambient,
        )

    # ------------------------------------------------------------------
    # FASE 2: SIRVIENTES DE ESCENA (en paralelo)
    # ------------------------------------------------------------------

    async def _tts_line(self, text: str, voice: str, out_path: str):
        import edge_tts
        communicate = edge_tts.Communicate(text[:2000], voice)
        await communicate.save(out_path)

    async def _probe_duration(self, path: str) -> float:
        proc = await asyncio.create_subprocess_exec(
            "ffprobe", "-v", "error", "-show_entries", "format=duration",
            "-of", "csv=p=0", path,
            stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE,
        )
        out, _ = await proc.communicate()
        try:
            return float(out.decode().strip())
        except ValueError:
            return 0.0

    async def _run_ffmpeg(self, args: List[str], timeout: int = 120) -> bool:
        proc = await asyncio.create_subprocess_exec(
            "ffmpeg", "-y", *args,
            stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE,
        )
        try:
            _, stderr = await asyncio.wait_for(proc.communicate(), timeout=timeout)
        except asyncio.TimeoutError:
            proc.kill()
            logger.error("ffmpeg timeout")
            return False
        if proc.returncode != 0:
            logger.error(f"ffmpeg fallo: {stderr.decode(errors='replace')[:500]}")
            return False
        return True

    def _fetch_image(self, prompt: str, out_path: str, retries: int = 4) -> bool:
        encoded = urllib.parse.quote(prompt[:400])
        url = f"https://image.pollinations.ai/prompt/{encoded}?width=1280&height=720&nologo=true"
        for attempt in range(retries):
            try:
                req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
                with urllib.request.urlopen(req, timeout=60) as r:
                    data = r.read()
                if len(data) > 1000:
                    with open(out_path, "wb") as f:
                        f.write(data)
                    return True
            except Exception as e:
                logger.warning(f"Fetch imagen intento {attempt+1}/{retries} fallo: {e}")
            time.sleep(3 * (attempt + 1))  # backoff creciente ante 429 rate-limit
        return False

    async def _produce_scene_clip(self, scene: Scene, workdir: str) -> Scene:
        try:
            # 1. TTS de cada linea (en paralelo entre lineas de la escena)
            line_paths = []
            for i, line in enumerate(scene.lines):
                p = os.path.join(workdir, f"s{scene.index}_line{i}.mp3")
                await self._tts_line(line.text, line.voice, p)
                line_paths.append(p)

            # 2. Concatenar lineas en una pista de narracion/dialogo
            narration_path = os.path.join(workdir, f"s{scene.index}_narration.mp3")
            if len(line_paths) == 1:
                shutil.copy2(line_paths[0], narration_path)
            else:
                list_path = os.path.join(workdir, f"s{scene.index}_lines.txt")
                with open(list_path, "w", encoding="utf-8") as f:
                    for p in line_paths:
                        f.write(f"file '{p}'\n")
                ok = await self._run_ffmpeg([
                    "-f", "concat", "-safe", "0", "-i", list_path,
                    "-c", "copy", narration_path,
                ])
                if not ok:
                    scene.error = "No se pudo unir el dialogo"
                    return scene

            duration = await self._probe_duration(narration_path)
            if duration <= 0:
                scene.error = "Audio de narracion invalido"
                return scene

            # 3. Ambiente + mezcla
            preset = AMBIENT_PRESETS.get(scene.ambient)
            audio_path = os.path.join(workdir, f"s{scene.index}_audio.mp3")
            if preset:
                color, amp = preset
                ok = await self._run_ffmpeg([
                    "-i", narration_path,
                    "-f", "lavfi", "-i", f"anoisesrc=color={color}:duration={duration:.2f}:amplitude={amp}",
                    "-filter_complex", "[0:a][1:a]amix=inputs=2:duration=first:dropout_transition=0[a]",
                    "-map", "[a]", "-t", f"{duration:.2f}", audio_path,
                ])
                if not ok:
                    shutil.copy2(narration_path, audio_path)
            else:
                shutil.copy2(narration_path, audio_path)

            # 4. Imagen de fondo (Pollinations, con limite de concurrencia)
            image_path = os.path.join(workdir, f"s{scene.index}_bg.jpg")
            async with self._image_semaphore:
                got_image = await asyncio.to_thread(self._fetch_image, scene.visual_prompt, image_path)
            if not got_image:
                scene.error = "No se pudo generar la imagen de fondo"
                return scene

            # 5. Ken Burns: imagen fija -> video con paneo/zoom lento
            clip_path = os.path.join(workdir, f"scene_{scene.index:03d}.mp4")
            frames = max(1, int(duration * FPS))
            zoompan = (
                f"scale=3000:-2,zoompan=z='min(zoom+0.0006,1.25)':"
                f"d={frames}:s={VIDEO_WIDTH}x{VIDEO_HEIGHT}:fps={FPS}"
            )
            ok = await self._run_ffmpeg([
                "-loop", "1", "-i", image_path, "-i", audio_path,
                "-filter_complex", f"[0:v]{zoompan}[v]",
                "-map", "[v]", "-map", "1:a",
                "-c:v", "libx264", "-crf", str(CRF), "-preset", "veryfast",
                "-c:a", "aac", "-b:a", "64k", "-ac", "1",
                "-t", f"{duration:.2f}", "-pix_fmt", "yuv420p",
                clip_path,
            ], timeout=180)

            if not ok or not os.path.exists(clip_path):
                scene.error = "No se pudo renderizar el clip de la escena"
                return scene

            scene.clip_path = clip_path
            scene.duration_sec = duration
            return scene

        except Exception as e:
            logger.error(f"Error produciendo escena {scene.index}: {e}", exc_info=True)
            scene.error = str(e)
            return scene

    # ------------------------------------------------------------------
    # FASE 3: MONTADOR — concatena todas las escenas
    # ------------------------------------------------------------------

    async def _assemble(self, scenes: List[Scene], workdir: str, slug: str) -> Optional[str]:
        ok_scenes = [s for s in scenes if s.clip_path and not s.error]
        if not ok_scenes:
            return None

        list_path = os.path.join(workdir, "concat_list.txt")
        with open(list_path, "w", encoding="utf-8") as f:
            for s in ok_scenes:
                f.write(f"file '{s.clip_path}'\n")

        out_path = os.path.join(OUTPUT_DIR, f"{slug}-{int(time.time())}.mp4")
        ok = await self._run_ffmpeg([
            "-f", "concat", "-safe", "0", "-i", list_path,
            "-c", "copy", out_path,
        ], timeout=300)
        return out_path if ok and os.path.exists(out_path) else None

    # ------------------------------------------------------------------
    # ORQUESTADOR PRINCIPAL
    # ------------------------------------------------------------------

    async def produce(self, idea: str, target_minutes: float = 3,
                       progress_cb=None) -> FilmResult:
        async def _progress(msg: str):
            if progress_cb:
                try:
                    await progress_cb(msg)
                except Exception:
                    pass

        outline = await asyncio.to_thread(self._write_outline, idea, target_minutes)
        title = outline.get("title", idea[:60])
        raw_scenes = outline.get("scenes", [])
        await _progress(f"📝 Guion listo: {len(raw_scenes)} escenas. Escribiendo dialogos...")

        # Expandir escenas en paralelo (sirvientes-guionistas)
        loop = asyncio.get_event_loop()
        expand_futures = [
            loop.run_in_executor(self._pool, self._expand_scene, s, i, len(raw_scenes))
            for i, s in enumerate(raw_scenes)
        ]
        scenes = list(await asyncio.gather(*expand_futures))

        await _progress(f"🎬 Produciendo {len(scenes)} escenas (voz, imagen, ambiente)...")

        workdir = tempfile.mkdtemp(prefix="c8l_film_")
        try:
            # Producir clips de escena en paralelo (sirvientes-productores)
            produced = await asyncio.gather(*[
                self._produce_scene_clip(s, workdir) for s in scenes
            ])

            failed = [s for s in produced if s.error]
            if failed:
                logger.warning(f"{len(failed)}/{len(produced)} escenas fallaron")

            await _progress("✂️ Montando la produccion final...")
            slug = re.sub(r"[^a-z0-9]+", "-", title.lower())[:40].strip("-") or "produccion"
            final_path = await self._assemble(produced, workdir, slug)

            if not final_path:
                return FilmResult(
                    success=False,
                    message="❌ No se pudo montar la produccion (todas las escenas fallaron).",
                    title=title, scenes=produced,
                )

            total_duration = sum(s.duration_sec for s in produced if not s.error)
            size_mb = os.path.getsize(final_path) / (1024 * 1024)

            ok_count = len([s for s in produced if not s.error])
            msg = (
                f"✅ *{title}*\n\n"
                f"🎬 Escenas: {ok_count}/{len(produced)}\n"
                f"⏱️ Duracion: {total_duration/60:.1f} min\n"
                f"💾 Peso: {size_mb:.1f} MB"
            )
            if failed:
                msg += f"\n⚠️ {len(failed)} escena(s) fallaron y se omitieron"

            return FilmResult(
                success=True, message=msg, title=title, path=final_path,
                duration_sec=total_duration, size_mb=size_mb, scenes=produced,
            )
        finally:
            shutil.rmtree(workdir, ignore_errors=True)

    # ------------------------------------------------------------------
    # UTILIDADES
    # ------------------------------------------------------------------

    def _parse_json(self, response: Optional[str]) -> Optional[Dict]:
        if not response:
            return None
        try:
            return json.loads(response)
        except (json.JSONDecodeError, TypeError):
            pass
        try:
            start = response.find("{")
            end = response.rfind("}") + 1
            if start >= 0 and end > start:
                return json.loads(response[start:end])
        except (json.JSONDecodeError, ValueError):
            pass
        return None


_producer_instance: Optional[FilmProducer] = None


def get_producer() -> FilmProducer:
    global _producer_instance
    if _producer_instance is None:
        _producer_instance = FilmProducer()
    return _producer_instance
