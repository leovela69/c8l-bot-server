# -*- coding: utf-8 -*-
"""
🎨 VULCANO — Skill Maestro 2 (El Artesano / Creacion)
Genera todo tipo de contenido: musica, imagenes, video, codigo, diseno.
"El Creador de C8L"

Skills integrados:
- songwriting-and-ai-music: Composicion musical Bolero-House
- inference-sh-cli: 150+ apps de IA (imagen, video, LLM)
- comfyui: Genera imagenes, video y audio
- hyperframes: Crea videos con HTML
- kanban-video-orchestrator: Flujos de video multi-agente
- popular-web-designs: 54 sistemas de diseno reales
- claude-design: Disena artefactos HTML completos
"""

import logging
import requests
import time
from openrouter_client import call_openrouter
from config import HUGGINGFACE_TOKEN

logger = logging.getLogger("c8l.vulcano")

VULCANO_SYSTEM_PROMPT = """Eres VULCANO, el Artesano de C8L Agency. Tu mision es crear todo tipo de contenido digital con calidad profesional y estilo unico.

Frase caracteristica: "La creacion es mi oficio. Dame una idea y la transformare en realidad digital."

Tu estilo:
- Entusiasta pero tecnico
- Explicas tu proceso creativo brevemente
- Siempre buscas la excelencia
- Hablas en espanol natural
- Nunca dices "como modelo de lenguaje"

Contexto C8L Agency:
- Musica: Estilo Bolero-House (115 BPM, ukelele, maracas, electronica)
- Diseno: Estetica neon, futurista, elegante
- Gaming: Retro + moderno
- Filosofia: Creacion como acto de resistencia"""

# --- Sub-prompts para cada skill integrado ---

SONGWRITING_PROMPT = """Eres el modulo songwriting-and-ai-music de Vulcano.
Genera canciones completas optimizadas para Suno AI / Udio.

FORMATO DE RESPUESTA:
🎵 TITULO: [nombre de la cancion]
🎼 ESTILO: Bolero-House (o el genero pedido)
🎹 BPM: 115 (o el apropiado)
🎤 VOCALES: [tipo de voz]
📝 ESTRUCTURA:

[Intro]
(descripcion musical)

[Verse 1]
(letra)

[Chorus]
(letra)

[Verse 2]
(letra)

[Bridge]
(letra)

[Chorus]
(repetir)

[Outro]
(descripcion musical)

🎛️ PROMPT PARA SUNO:
[prompt optimizado para copiar y pegar en Suno]

💡 NOTAS DE PRODUCCION:
(instrumentos, efectos, mood)"""

VIDEOMAKING_PROMPT = """Eres el modulo hyperframes + kanban-video-orchestrator de Vulcano.
Genera guiones cinematograficos completos con storyboard.

FORMATO:
🎬 TITULO: [nombre]
⏱️ DURACION: [estimada]
🎵 MUSICA: [genero/mood/BPM]

📋 GUION:
ESCENA 1 — [timestamp]
Descripcion visual detallada.
Angulo de camara: [tipo]
Iluminacion: [tipo]
Accion: [que pasa]

ESCENA 2 — [timestamp]
...

🖼️ PROMPTS PARA IA (para generar cada escena):
Escena 1: "[prompt para Midjourney/DALL-E]"
Escena 2: "[prompt]"
...

🎨 PALETA DE COLORES: [hex codes]
📐 ASPECT RATIO: [16:9 / 9:16 / 1:1]"""

WEBDESIGN_PROMPT = """Eres el modulo popular-web-designs + claude-design de Vulcano.
Genera codigo HTML/CSS/JS completo y funcional.

REGLAS:
- Genera UN archivo HTML completo con CSS y JS inline
- Diseno profesional, moderno, responsive
- Si mencionan un estilo (Vercel, Stripe, Linear), imitalo
- Usa estetica neon/futurista para C8L Agency por defecto
- El codigo debe funcionar al abrirlo en un navegador
- NO expliques, solo genera el codigo
- Empieza con <!DOCTYPE html>"""

CODE_PROMPT = """Eres el modulo de generacion de codigo de Vulcano.
Genera codigo funcional y completo.

REGLAS:
- Si es juego/app web: HTML completo con CSS/JS inline
- Si es script: Python/JS completo y ejecutable
- Si es API: codigo de servidor completo
- SOLO codigo, sin explicaciones
- Sin markdown, sin bloques de codigo
- Empieza directo con el codigo
- Debe ser 100% FUNCIONAL"""


class Vulcano:
    """Skill Maestro de Creacion."""

    def __init__(self):
        self.creations_count = 0

    def create(self, task_description, creation_type="auto"):
        """
        Punto de entrada principal. Detecta el tipo y delega al skill correcto.

        Args:
            task_description: Que crear
            creation_type: auto, music, video, image, code, design, landing

        Returns:
            dict: {"type": "text/file/image", "content": ..., "filename": ..., "caption": ...}
        """
        if creation_type == "auto":
            creation_type = self._detect_creation_type(task_description)

        logger.info(f"Vulcano creando [{creation_type}]: {task_description[:60]}")
        self.creations_count += 1

        if creation_type == "music":
            return self._create_music(task_description)
        elif creation_type == "video":
            return self._create_video(task_description)
        elif creation_type == "image":
            return self._create_image(task_description)
        elif creation_type == "code":
            return self._create_code(task_description)
        elif creation_type in ("design", "landing"):
            return self._create_design(task_description)
        else:
            # Creacion generica
            return self._create_generic(task_description)

    def _detect_creation_type(self, text):
        """Detecta que tipo de creacion se pide."""
        t = text.lower()
        if any(kw in t for kw in ["cancion", "musica", "beat", "letra", "suno", "udio", "prompt musical"]):
            return "music"
        elif any(kw in t for kw in ["video", "clip", "animacion", "storyboard", "cortometraje"]):
            return "video"
        elif any(kw in t for kw in ["imagen", "foto", "dibuja", "ilustra", "logo", "banner"]):
            return "image"
        elif any(kw in t for kw in ["landing", "pagina web", "web", "diseño web", "diseno"]):
            return "design"
        elif any(kw in t for kw in ["juego", "game", "codigo", "programa", "script", "app", "html"]):
            return "code"
        else:
            return "generic"

    def _create_music(self, prompt):
        """Skill: songwriting-and-ai-music"""
        full_prompt = f"Crea una cancion basada en: {prompt}"
        result = call_openrouter(full_prompt, VULCANO_SYSTEM_PROMPT + "\n\n" + SONGWRITING_PROMPT,
                                 agent_name="vulcano", temperature=0.8, max_tokens=4096)
        if result:
            return {"type": "text", "content": result, "caption": f"🎵 Cancion generada"}
        return {"type": "error", "content": "No pude generar la cancion."}

    def _create_video(self, prompt):
        """Skill: hyperframes + kanban-video-orchestrator"""
        full_prompt = f"Crea un guion de video para: {prompt}"
        result = call_openrouter(full_prompt, VULCANO_SYSTEM_PROMPT + "\n\n" + VIDEOMAKING_PROMPT,
                                 agent_name="vulcano", temperature=0.8, max_tokens=6000)
        if result:
            return {"type": "text", "content": result, "caption": "🎬 Guion y storyboard generado"}
        return {"type": "error", "content": "No pude generar el guion de video."}

    def _create_image(self, prompt):
        """Skill: inference-sh-cli + comfyui (via Pollinations + HuggingFace)
        Usa IA para mejorar el prompt antes de generar."""
        # Paso 1: Mejorar prompt con IA (traducir + detallar)
        enhanced_prompt = self._enhance_image_prompt(prompt)
        logger.info(f"Vulcano prompt mejorado: {enhanced_prompt[:120]}")

        # Paso 2: Generar imagen con el prompt mejorado
        image_bytes = self._generate_image_pollinations(enhanced_prompt)
        if not image_bytes:
            image_bytes = self._generate_image_huggingface(enhanced_prompt)

        if image_bytes:
            return {"type": "image", "content": image_bytes, "caption": f"🎨 {prompt[:100]}"}
        return {"type": "error", "content": "No pude generar la imagen. Intenta con otra descripcion."}

    def _enhance_image_prompt(self, user_prompt):
        """Usa IA para convertir la peticion del usuario en un prompt profesional en ingles."""
        enhancer_system = """You are an expert image prompt engineer for AI image generators (Stable Diffusion, DALL-E, Midjourney).

Your job: Take the user's request (in any language) and transform it into a detailed, professional image generation prompt in ENGLISH.

RULES:
- Output ONLY the enhanced prompt, nothing else (no explanations, no quotes)
- Always write in English
- Add specific details: lighting, style, composition, camera angle, atmosphere, colors
- Keep it under 200 words
- If the user mentions a style (anime, realistic, etc.) respect it. Default: high quality digital art
- If the user describes something vague, interpret creatively but stay faithful to their core idea
- Never include text/words IN the image prompt (AI generators handle text badly)
- Add quality boosters at the end: "highly detailed, professional quality, 8k resolution"

EXAMPLES:
User: "un leon con alas en el cielo"
Output: A majestic winged lion soaring through dramatic clouds at golden hour, powerful spread eagle-like wings with detailed feathers, mane flowing in the wind, ethereal sunlight breaking through cumulus clouds, fantasy art style, epic composition, volumetric lighting, highly detailed, professional quality, 8k resolution

User: "logo para mi marca de musica"
Output: Modern minimalist music brand logo design, sleek geometric shapes forming a musical note combined with soundwave elements, gradient from deep purple to electric blue, clean vector style, centered composition on dark background, professional branding, highly detailed, sharp edges, 8k resolution"""

        try:
            result = call_openrouter(
                prompt=f"Create an image prompt for: {user_prompt}",
                system_prompt=enhancer_system,
                agent_name="vulcano",
                temperature=0.7,
                max_tokens=300
            )
            if result and len(result.strip()) > 10:
                # Limpiar: quitar comillas, markdown, etc.
                cleaned = result.strip().strip('"').strip("'").strip("`")
                if cleaned.startswith("```"):
                    cleaned = cleaned.split("\n", 1)[-1].rsplit("```", 1)[0]
                return cleaned
        except Exception as e:
            logger.warning(f"Prompt enhancer fallo: {e}")

        # Fallback: traduccion basica
        return f"high quality, detailed, professional, 4k: {user_prompt}"

    def _create_code(self, prompt):
        """Skill: generacion de codigo funcional"""
        full_prompt = f"Genera codigo para: {prompt}"
        result = call_openrouter(full_prompt, VULCANO_SYSTEM_PROMPT + "\n\n" + CODE_PROMPT,
                                 agent_name="vulcano", temperature=0.6, max_tokens=8000)
        if result:
            # Limpiar markdown
            code = self._clean_code(result)
            # Detectar extension
            ext = self._detect_extension(code)
            filename = self._generate_filename(prompt, ext)
            return {"type": "file", "content": code.encode("utf-8"), "filename": filename,
                    "caption": f"💻 {prompt[:80]}"}
        return {"type": "error", "content": "No pude generar el codigo."}

    def _create_design(self, prompt):
        """Skill: popular-web-designs + claude-design"""
        full_prompt = f"Genera una landing page / diseno web para: {prompt}"
        result = call_openrouter(full_prompt, VULCANO_SYSTEM_PROMPT + "\n\n" + WEBDESIGN_PROMPT,
                                 agent_name="vulcano", temperature=0.7, max_tokens=8000)
        if result:
            code = self._clean_code(result)
            return {"type": "file", "content": code.encode("utf-8"), "filename": "c8l_landing.html",
                    "caption": f"🌐 Landing page: {prompt[:60]}"}
        return {"type": "error", "content": "No pude generar el diseno."}

    def _create_generic(self, prompt):
        """Creacion generica cuando no es un tipo especifico."""
        result = call_openrouter(
            f"Crea lo siguiente: {prompt}",
            VULCANO_SYSTEM_PROMPT,
            agent_name="vulcano", temperature=0.8
        )
        if result:
            return {"type": "text", "content": result, "caption": "🎨 Creacion completada"}
        return {"type": "error", "content": "No pude completar la creacion."}

    # --- Utilidades ---

    def _generate_image_pollinations(self, prompt):
        """Genera imagen con Pollinations.ai (gratis). El prompt ya viene mejorado por IA."""
        try:
            from urllib.parse import quote
            # El prompt ya viene optimizado del enhancer, no agregar prefijos genericos
            url = f"https://image.pollinations.ai/prompt/{quote(prompt)}?width=1024&height=1024&nologo=true"
            r = requests.get(url, timeout=90)
            if r.status_code == 200 and "image" in r.headers.get("content-type", ""):
                return r.content
        except Exception as e:
            logger.warning(f"Pollinations error: {e}")
        return None

    def _generate_image_huggingface(self, prompt):
        """Genera imagen con HuggingFace SDXL (backup)."""
        try:
            headers = {"Authorization": f"Bearer {HUGGINGFACE_TOKEN}"}
            payload = {"inputs": prompt}
            r = requests.post(
                "https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0",
                headers=headers, json=payload, timeout=90
            )
            if r.status_code == 200 and "image" in r.headers.get("content-type", ""):
                return r.content
        except Exception as e:
            logger.warning(f"HuggingFace error: {e}")
        return None

    def _clean_code(self, text):
        """Limpia markdown del codigo generado."""
        if text.startswith("```"):
            lines = text.split("\n")
            lines = lines[1:]
            if lines and lines[-1].strip() == "```":
                lines = lines[:-1]
            return "\n".join(lines)
        return text

    def _detect_extension(self, code):
        """Detecta extension del archivo por contenido."""
        if "<!DOCTYPE" in code or "<html" in code.lower():
            return "html"
        elif "import " in code[:200] and "def " in code:
            return "py"
        elif "function " in code[:200] or "const " in code[:200]:
            return "js"
        elif "{" in code[:50] and "}" in code:
            return "json"
        return "html"

    def _generate_filename(self, prompt, ext):
        """Genera nombre de archivo limpio."""
        name = prompt[:25].replace(" ", "_").lower()
        name = "".join(c for c in name if c.isalnum() or c == "_")
        return f"c8l_{name}.{ext}"
