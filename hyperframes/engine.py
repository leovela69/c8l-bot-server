"""
🎬 HYPERFRAMES ENGINE — Motor de renderizado HTML→MP4
=====================================================
Wrapper Python que orquesta el CLI de Hyperframes (Node.js)
para renderizar composiciones HTML en videos MP4.

Flujo:
1. Recibe HTML (string o template)
2. Crea proyecto temporal con estructura Hyperframes
3. Ejecuta `npx hyperframes render` 
4. Devuelve bytes del MP4 resultante
5. Limpia archivos temporales

Requisitos en el servidor:
- Node.js 22+
- FFmpeg
- npx (viene con Node.js)
"""

import os
import json
import shutil
import asyncio
import logging
import tempfile
import subprocess
from typing import Dict, Optional, Tuple
from datetime import datetime

logger = logging.getLogger("c8l.hyperframes")

# Directorio base para proyectos de video
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VIDEOS_DIR = os.path.join(BASE_DIR, "data", "videos")
os.makedirs(VIDEOS_DIR, exist_ok=True)


class HyperframesEngine:
    """
    Motor de renderizado Hyperframes.
    Convierte HTML + CSS + animaciones en video MP4.
    """

    def __init__(self):
        self.render_count = 0
        self.last_render = None
        self.errors = []
        self._node_available = None
        self._ffmpeg_available = None

    # ------------------------------------------------------------------
    # Health checks
    # ------------------------------------------------------------------

    def check_node(self) -> bool:
        """Verifica que Node.js 22+ está disponible"""
        if self._node_available is not None:
            return self._node_available
        try:
            result = subprocess.run(
                ["node", "--version"],
                capture_output=True, text=True, timeout=10
            )
            version = result.stdout.strip().lstrip('v')
            major = int(version.split('.')[0])
            self._node_available = major >= 22
            if not self._node_available:
                logger.warning(f"Node.js {version} encontrado, se requiere 22+")
            return self._node_available
        except Exception as e:
            logger.error(f"Node.js no disponible: {e}")
            self._node_available = False
            return False

    def check_ffmpeg(self) -> bool:
        """Verifica que FFmpeg está disponible"""
        if self._ffmpeg_available is not None:
            return self._ffmpeg_available
        try:
            result = subprocess.run(
                ["ffmpeg", "-version"],
                capture_output=True, text=True, timeout=10
            )
            self._ffmpeg_available = result.returncode == 0
            return self._ffmpeg_available
        except Exception as e:
            logger.error(f"FFmpeg no disponible: {e}")
            self._ffmpeg_available = False
            return False

    def check_requirements(self) -> Dict:
        """Verifica todos los requisitos del sistema"""
        return {
            'node': self.check_node(),
            'ffmpeg': self.check_ffmpeg(),
            'ready': self.check_node() and self.check_ffmpeg()
        }

    # ------------------------------------------------------------------
    # Renderizado principal
    # ------------------------------------------------------------------

    async def render_html(
        self,
        html_content: str,
        width: int = 1920,
        height: int = 1080,
        fps: int = 30,
        output_name: str = None
    ) -> Dict:
        """
        Renderiza HTML a MP4.

        Args:
            html_content: HTML completo de la composición
            width: Ancho del video (default 1920)
            height: Alto del video (default 1080)
            fps: Frames por segundo (default 30)
            output_name: Nombre del archivo de salida (opcional)

        Returns:
            Dict con status, video_bytes, path, duration, etc.
        """
        # Verificar requisitos
        reqs = self.check_requirements()
        if not reqs['ready']:
            missing = [k for k, v in reqs.items() if k != 'ready' and not v]
            return {
                'status': 'error',
                'error': f"Requisitos faltantes: {', '.join(missing)}",
                'missing': missing
            }

        # Crear directorio temporal para el proyecto
        project_dir = tempfile.mkdtemp(prefix="c8l_hf_")

        try:
            # Escribir el HTML
            index_path = os.path.join(project_dir, "index.html")
            with open(index_path, "w", encoding="utf-8") as f:
                f.write(html_content)

            # Crear hyperframes.config.json
            config = {
                "width": width,
                "height": height,
                "fps": fps,
                "format": "mp4"
            }
            config_path = os.path.join(project_dir, "hyperframes.config.json")
            with open(config_path, "w") as f:
                json.dump(config, f, indent=2)

            # Ejecutar render
            output_filename = output_name or f"c8l_video_{int(datetime.now().timestamp())}.mp4"
            output_path = os.path.join(project_dir, output_filename)

            # Comando de renderizado
            cmd = [
                "npx", "hyperframes", "render",
                "--input", index_path,
                "--output", output_path,
                "--width", str(width),
                "--height", str(height),
                "--fps", str(fps)
            ]

            logger.info(f"🎬 Renderizando: {' '.join(cmd)}")

            # Ejecutar asíncronamente
            process = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
                cwd=project_dir
            )

            stdout, stderr = await asyncio.wait_for(
                process.communicate(),
                timeout=300  # 5 minutos máximo
            )

            if process.returncode != 0:
                error_msg = stderr.decode('utf-8', errors='replace')
                logger.error(f"Render failed: {error_msg}")

                # Intentar fallback con método alternativo
                fallback_result = await self._fallback_render(
                    html_content, width, height, fps, project_dir, output_path
                )
                if fallback_result:
                    return fallback_result

                return {
                    'status': 'error',
                    'error': f"Render falló: {error_msg[:500]}",
                    'stdout': stdout.decode('utf-8', errors='replace')[:500]
                }

            # Leer el video resultante
            if os.path.exists(output_path):
                with open(output_path, "rb") as f:
                    video_bytes = f.read()

                # Copiar a directorio permanente
                permanent_path = os.path.join(VIDEOS_DIR, output_filename)
                shutil.copy2(output_path, permanent_path)

                self.render_count += 1
                self.last_render = datetime.now().isoformat()

                logger.info(f"✅ Video renderizado: {len(video_bytes)} bytes")

                return {
                    'status': 'success',
                    'video_bytes': video_bytes,
                    'path': permanent_path,
                    'filename': output_filename,
                    'size_mb': round(len(video_bytes) / 1024 / 1024, 2),
                    'width': width,
                    'height': height,
                    'fps': fps
                }
            else:
                return {
                    'status': 'error',
                    'error': 'Archivo de salida no encontrado después del render'
                }

        except asyncio.TimeoutError:
            return {
                'status': 'error',
                'error': 'Timeout: el renderizado tardó más de 5 minutos'
            }
        except Exception as e:
            logger.error(f"Error en render: {e}", exc_info=True)
            self.errors.append({
                'error': str(e),
                'timestamp': datetime.now().isoformat()
            })
            return {
                'status': 'error',
                'error': str(e)
            }
        finally:
            # Limpiar directorio temporal
            try:
                shutil.rmtree(project_dir, ignore_errors=True)
            except:
                pass

    # ------------------------------------------------------------------
    # Fallback: render con puppeteer + ffmpeg directo
    # ------------------------------------------------------------------

    async def _fallback_render(
        self,
        html_content: str,
        width: int,
        height: int,
        fps: int,
        project_dir: str,
        output_path: str
    ) -> Optional[Dict]:
        """
        Método alternativo de renderizado usando puppeteer-screenshot + ffmpeg.
        Se usa cuando npx hyperframes render no está disponible.
        """
        try:
            # Intentar con playwright o puppeteer directo
            # Este es un fallback simplificado que captura frames
            logger.info("🔄 Intentando render fallback con FFmpeg directo...")

            # Crear un video simple con FFmpeg desde la imagen del HTML
            # Primero crear screenshot con wkhtmltoimage si está disponible
            index_path = os.path.join(project_dir, "index.html")
            screenshot_path = os.path.join(project_dir, "frame.png")

            # Intentar wkhtmltoimage
            try:
                cmd_screenshot = [
                    "wkhtmltoimage",
                    "--width", str(width),
                    "--height", str(height),
                    "--quality", "95",
                    index_path,
                    screenshot_path
                ]
                proc = await asyncio.create_subprocess_exec(
                    *cmd_screenshot,
                    stdout=asyncio.subprocess.PIPE,
                    stderr=asyncio.subprocess.PIPE
                )
                await asyncio.wait_for(proc.communicate(), timeout=30)
            except:
                # Si wkhtmltoimage no está, intentar con chromium
                try:
                    cmd_chrome = [
                        "chromium-browser", "--headless", "--disable-gpu",
                        f"--window-size={width},{height}",
                        f"--screenshot={screenshot_path}",
                        f"file://{index_path}"
                    ]
                    proc = await asyncio.create_subprocess_exec(
                        *cmd_chrome,
                        stdout=asyncio.subprocess.PIPE,
                        stderr=asyncio.subprocess.PIPE
                    )
                    await asyncio.wait_for(proc.communicate(), timeout=30)
                except:
                    return None

            if not os.path.exists(screenshot_path):
                return None

            # Crear video de 5 segundos desde la imagen con FFmpeg
            duration = self._extract_duration(html_content) or 5
            cmd_ffmpeg = [
                "ffmpeg", "-y",
                "-loop", "1",
                "-i", screenshot_path,
                "-c:v", "libx264",
                "-t", str(duration),
                "-pix_fmt", "yuv420p",
                "-vf", f"scale={width}:{height}",
                "-r", str(fps),
                output_path
            ]

            proc = await asyncio.create_subprocess_exec(
                *cmd_ffmpeg,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            await asyncio.wait_for(proc.communicate(), timeout=60)

            if os.path.exists(output_path):
                with open(output_path, "rb") as f:
                    video_bytes = f.read()

                output_filename = os.path.basename(output_path)
                permanent_path = os.path.join(VIDEOS_DIR, output_filename)
                shutil.copy2(output_path, permanent_path)

                self.render_count += 1
                self.last_render = datetime.now().isoformat()

                return {
                    'status': 'success',
                    'video_bytes': video_bytes,
                    'path': permanent_path,
                    'filename': output_filename,
                    'size_mb': round(len(video_bytes) / 1024 / 1024, 2),
                    'width': width,
                    'height': height,
                    'fps': fps,
                    'method': 'fallback_ffmpeg'
                }

        except Exception as e:
            logger.warning(f"Fallback render también falló: {e}")

        return None

    # ------------------------------------------------------------------
    # Render desde template
    # ------------------------------------------------------------------

    async def render_template(
        self,
        template_name: str,
        variables: Dict = None,
        width: int = 1920,
        height: int = 1080,
        fps: int = 30
    ) -> Dict:
        """
        Renderiza un template pre-construido con variables.

        Args:
            template_name: Nombre del template (ej: "product_launch")
            variables: Dict con variables para sustituir en el template
            width/height/fps: Configuración de video
        """
        from hyperframes.templates import get_template

        template = get_template(template_name)
        if not template:
            return {
                'status': 'error',
                'error': f'Template "{template_name}" no encontrado'
            }

        # Inyectar variables en el HTML
        html = template['html']
        if variables:
            for key, value in variables.items():
                html = html.replace(f"{{{{{key}}}}}", str(value))
                html = html.replace(f"${{{key}}}", str(value))

        return await self.render_html(html, width=width, height=height, fps=fps)

    # ------------------------------------------------------------------
    # Generar HTML con IA
    # ------------------------------------------------------------------

    async def generate_and_render(
        self,
        prompt: str,
        style: str = "modern",
        duration: int = 10,
        width: int = 1920,
        height: int = 1080
    ) -> Dict:
        """
        Genera HTML con IA basado en un prompt y lo renderiza.

        Args:
            prompt: Descripción del video deseado
            style: Estilo visual (modern, neon, minimal, bold, elegant)
            duration: Duración en segundos
            width/height: Dimensiones
        """
        # Generar HTML usando el LLM del sistema
        html = await self._generate_html_with_ai(prompt, style, duration, width, height)

        if not html:
            return {
                'status': 'error',
                'error': 'No se pudo generar el HTML del video'
            }

        return await self.render_html(html, width=width, height=height)

    async def _generate_html_with_ai(
        self,
        prompt: str,
        style: str,
        duration: int,
        width: int,
        height: int
    ) -> Optional[str]:
        """Genera HTML de composición Hyperframes usando la IA del sistema"""
        try:
            import requests as req
            from config import GROQ_API_KEY, GROQ_BASE_URL

            system_prompt = self._get_html_generation_prompt(style, duration, width, height)

            response = req.post(
                f"{GROQ_BASE_URL}/chat/completions",
                headers={
                    "Authorization": f"Bearer {GROQ_API_KEY}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "llama-3.3-70b-versatile",
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": f"Crea un video para: {prompt}"}
                    ],
                    "temperature": 0.7,
                    "max_tokens": 4000
                },
                timeout=60
            )

            if response.status_code == 200:
                data = response.json()
                content = data['choices'][0]['message']['content']

                # Extraer HTML del response
                html = self._extract_html(content)
                return html

        except Exception as e:
            logger.error(f"Error generando HTML con IA: {e}")

        return None

    def _get_html_generation_prompt(
        self, style: str, duration: int, width: int, height: int
    ) -> str:
        """Prompt del sistema para generar HTML de video Hyperframes"""
        return f"""Eres un experto en crear composiciones de video HTML para Hyperframes.
Hyperframes convierte HTML con atributos data-* en video MP4.

REGLAS DE HYPERFRAMES:
- El contenedor raíz usa: data-composition-id, data-start="0", data-width="{width}", data-height="{height}"
- Cada elemento visible usa class="clip" + data-start (segundos) + data-duration (segundos) + data-track-index
- Las animaciones deben ser seekable (GSAP con timeline pausada)
- Registrar timelines en window.__timelines = {{}}; window.__timelines.COMPOSITION_ID = tl;
- Duración total del video: {duration} segundos
- Usa GSAP desde CDN: https://cdn.jsdelivr.net/npm/gsap@3/dist/gsap.min.js

ESTILO: {style}
- modern: limpio, sans-serif, gradientes suaves, transiciones elegantes
- neon: fondo oscuro, colores brillantes, glows, estilo cyberpunk
- minimal: blanco y negro, tipografía grande, mucho espacio
- bold: colores fuertes, texto grande, impactante
- elegant: dorado, serif, cinematográfico

RESPONDE SOLO CON EL HTML COMPLETO. Sin explicaciones. Sin markdown.
El HTML debe ser un archivo completo válido con <!DOCTYPE html>.
Incluye estilos inline o en <style>.
Incluye GSAP para animaciones seekable.
Asegura que todos los clips tengan data-start, data-duration, data-track-index.
"""

    # ------------------------------------------------------------------
    # Utilidades
    # ------------------------------------------------------------------

    def _extract_html(self, text: str) -> Optional[str]:
        """Extrae HTML de una respuesta que puede contener markdown"""
        # Si ya es HTML puro
        if text.strip().startswith('<!DOCTYPE') or text.strip().startswith('<html'):
            return text.strip()

        # Buscar en bloques de código
        import re
        html_blocks = re.findall(r'```html?\s*\n(.*?)```', text, re.DOTALL)
        if html_blocks:
            return html_blocks[0].strip()

        # Buscar entre tags HTML
        match = re.search(r'(<!DOCTYPE.*?</html>)', text, re.DOTALL | re.IGNORECASE)
        if match:
            return match.group(1)

        return None

    def _extract_duration(self, html: str) -> Optional[int]:
        """Extrae la duración total del video del HTML"""
        import re
        # Buscar data-duration máximo
        durations = re.findall(r'data-duration="(\d+(?:\.\d+)?)"', html)
        starts = re.findall(r'data-start="(\d+(?:\.\d+)?)"', html)

        if durations and starts:
            max_end = max(
                float(s) + float(d)
                for s, d in zip(starts, durations)
            )
            return int(max_end) + 1

        return None

    def get_status(self) -> Dict:
        """Estado del motor"""
        reqs = self.check_requirements()
        return {
            'engine': 'hyperframes',
            'version': '1.0.0',
            'render_count': self.render_count,
            'last_render': self.last_render,
            'requirements': reqs,
            'errors_count': len(self.errors),
            'videos_dir': VIDEOS_DIR
        }
