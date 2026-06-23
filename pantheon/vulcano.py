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
import base64
from openrouter_client import call_openrouter
from config import HUGGINGFACE_TOKEN, GEMINI_API_KEY, GEMINI_IMAGE_URL

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
        if any(kw in t for kw in ["cancion", "musica", "beat", "letra", "suno", "udio", "prompt musical", "compone"]):
            return "music"
        elif any(kw in t for kw in ["video", "clip", "animacion", "storyboard", "cortometraje"]):
            return "video"
        elif any(kw in t for kw in ["imagen", "foto", "dibuja", "ilustra", "logo", "banner", "render",
                                     "3d", "retrato", "paisaje", "diseña", "disena", "genera",
                                     "crea una", "hazme", "pintame", "wallpaper", "fondo",
                                     "personaje", "mascota", "avatar", "icono", "poster",
                                     "portada", "thumbnail", "meme", "sticker", "comic",
                                     "concept art", "arte"]):
            return "image"
        elif any(kw in t for kw in ["landing", "pagina web", "web", "diseño web", "diseno web"]):
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
        """Genera imagen usando Nano Banana (Gemini 2.5 Flash Image) como motor principal.
        Fallback: Pollinations + HuggingFace."""
        # Paso 1: Detectar estilo especifico
        style = self._detect_image_style(prompt)
        logger.info(f"Vulcano: estilo detectado = {style} | peticion: {prompt[:80]}")

        # Paso 2: Intentar con Gemini (Nano Banana) — MEJOR CALIDAD
        image_bytes = self._generate_image_gemini(prompt)
        if image_bytes:
            logger.info(f"Vulcano: imagen generada con Gemini OK ({len(image_bytes)} bytes)")
            return {"type": "image", "content": image_bytes, "caption": f"🎨 {prompt[:100]}"}

        # Paso 3: Fallback a Pollinations (necesita prompt en ingles MEJORADO)
        logger.info("Vulcano: Gemini fallo, usando Pollinations como fallback...")

        # SIEMPRE usar el enhancer para Pollinations (no entiende español)
        enhanced_prompt = self._enhance_image_prompt(prompt, style)
        logger.info(f"Vulcano prompt mejorado [{style}]: {enhanced_prompt[:200]}")

        if not enhanced_prompt or len(enhanced_prompt) < 30:
            enhanced_prompt = self._local_prompt_enhance(prompt, style)

        image_bytes = self._generate_image_pollinations(enhanced_prompt, style)
        if not image_bytes:
            image_bytes = self._generate_image_huggingface(enhanced_prompt)

        if image_bytes:
            return {"type": "image", "content": image_bytes, "caption": f"🎨 {prompt[:100]}"}
        return {"type": "error", "content": "No pude generar la imagen. Intenta con otra descripcion."}

    def _generate_image_gemini(self, prompt):
        """Genera imagen con Gemini 2.5 Flash Image (Nano Banana).
        Entiende español, 500 imgs/dia gratis, calidad superior."""
        try:
            # Agregar contexto de marca si menciona C8L
            c8l_context = ""
            if any(kw in prompt.lower() for kw in ["c8l", "c.8.l", "corazones locos"]):
                c8l_context = " C8L Agency is a music brand. Generate a professional LOGO, EMBLEM or SHIELD design (not a character portrait). Style: dark background, neon purple and gold accents, lion silhouette integrated into geometric emblem, futuristic cyberpunk branding, centered composition."

            headers = {"Content-Type": "application/json"}
            payload = {
                "contents": [
                    {
                        "parts": [
                            {"text": f"Generate a high quality image of: {prompt}.{c8l_context} Do not include any text or watermarks in the image."}
                        ]
                    }
                ],
                "generationConfig": {
                    "responseModalities": ["IMAGE", "TEXT"]
                }
            }

            url = f"{GEMINI_IMAGE_URL}?key={GEMINI_API_KEY}"
            logger.info(f"Gemini Image: llamando API con prompt: {prompt[:80]}")
            r = requests.post(url, headers=headers, json=payload, timeout=90)

            if r.status_code == 200:
                data = r.json()
                # Extraer imagen de la respuesta
                candidates = data.get("candidates", [])
                for candidate in candidates:
                    parts = candidate.get("content", {}).get("parts", [])
                    for part in parts:
                        if "inlineData" in part:
                            img_data = part["inlineData"]
                            if "image" in img_data.get("mimeType", ""):
                                img_bytes = base64.b64decode(img_data["data"])
                                logger.info(f"Gemini Image OK: {len(img_bytes)} bytes")
                                return img_bytes
                # Si no hay inlineData, tal vez respondio con texto solamente
                logger.warning(f"Gemini: respuesta sin imagen. Candidates: {len(candidates)}")
                if candidates:
                    parts = candidates[0].get("content", {}).get("parts", [])
                    for part in parts:
                        if "text" in part:
                            logger.warning(f"Gemini respondio texto: {part['text'][:100]}")
            else:
                error_msg = ""
                try:
                    error_data = r.json()
                    error_msg = error_data.get("error", {}).get("message", r.text[:200])
                except:
                    error_msg = r.text[:200]
                logger.warning(f"Gemini Image fallo: {r.status_code} — {error_msg}")

        except Exception as e:
            logger.warning(f"Gemini Image error: {e}")
        return None

    def edit_image_gemini(self, image_bytes, instruction):
        """Edita una imagen existente con Gemini (image-to-image).
        Envía la imagen original + instrucción de edición."""
        try:
            img_base64 = base64.b64encode(image_bytes).decode("utf-8")

            headers = {"Content-Type": "application/json"}
            payload = {
                "contents": [
                    {
                        "parts": [
                            {
                                "inlineData": {
                                    "mimeType": "image/jpeg",
                                    "data": img_base64
                                }
                            },
                            {"text": f"Edit this image: {instruction}. Return the modified image."}
                        ]
                    }
                ],
                "generationConfig": {
                    "responseModalities": ["IMAGE", "TEXT"]
                }
            }

            url = f"{GEMINI_IMAGE_URL}?key={GEMINI_API_KEY}"
            logger.info(f"Gemini Edit: {instruction[:80]}")
            r = requests.post(url, headers=headers, json=payload, timeout=90)

            if r.status_code == 200:
                data = r.json()
                candidates = data.get("candidates", [])
                for candidate in candidates:
                    parts = candidate.get("content", {}).get("parts", [])
                    for part in parts:
                        if "inlineData" in part:
                            img_data = part["inlineData"]
                            if "image" in img_data.get("mimeType", ""):
                                edited = base64.b64decode(img_data["data"])
                                logger.info(f"Gemini Edit OK: {len(edited)} bytes")
                                return edited
                logger.warning("Gemini Edit: respuesta sin imagen editada")
            else:
                logger.warning(f"Gemini Edit fallo: {r.status_code}")

        except Exception as e:
            logger.warning(f"Gemini Edit error: {e}")
        return None

    def _detect_image_style(self, prompt):
        """Detecta el estilo visual que el usuario quiere."""
        t = prompt.lower()
        # C8L Agency = siempre logo/escudo/insignia
        if any(kw in t for kw in ["c8l", "c.8.l", "corazones locos"]):
            return "logo"
        if any(kw in t for kw in ["3d", "render", "blender", "cinema 4d", "octane", "unreal",
                                    "tridimensional", "cgi", "modelado", "sculpt"]):
            return "3d"
        elif any(kw in t for kw in ["anime", "manga", "japones", "japonés", "otaku", "kawaii",
                                     "chibi", "shonen", "seinen"]):
            return "anime"
        elif any(kw in t for kw in ["pixel", "pixel art", "retro", "8bit", "16bit", "8 bit", "16 bit",
                                     "gameboy", "nes", "snes"]):
            return "pixel"
        elif any(kw in t for kw in ["realista", "fotorealista", "foto", "fotografía", "fotografia",
                                     "realistic", "hiperrealista", "retrato real", "como foto"]):
            return "photorealistic"
        elif any(kw in t for kw in ["logo", "logotipo", "marca", "brand", "icono", "emblema",
                                     "insignia", "escudo"]):
            return "logo"
        elif any(kw in t for kw in ["pintura", "oleo", "óleo", "acuarela", "painting", "oil",
                                     "impresionista", "van gogh", "monet", "renacentista"]):
            return "painting"
        elif any(kw in t for kw in ["cartoon", "caricatura", "dibujo animado", "disney",
                                     "pixar", "animado"]):
            return "cartoon"
        elif any(kw in t for kw in ["cyberpunk", "neon", "futurista", "sci-fi", "scifi"]):
            return "cyberpunk"
        elif any(kw in t for kw in ["dark", "horror", "terror", "gotico", "gótico", "oscuro", "siniestro"]):
            return "dark"
        elif any(kw in t for kw in ["minimalista", "minimal", "simple", "flat", "clean"]):
            return "minimal"
        elif any(kw in t for kw in ["watercolor", "acuarela", "pastel", "suave", "dreamy"]):
            return "watercolor"
        elif any(kw in t for kw in ["comic", "marvel", "dc", "superheroe", "superhero"]):
            return "comic"
        elif any(kw in t for kw in ["isometric", "isometrico", "isométrico"]):
            return "isometric"
        elif any(kw in t for kw in ["concept art", "concept", "arte conceptual"]):
            return "concept_art"
        return "digital_art"

    def _enhance_image_prompt(self, user_prompt, style="digital_art"):
        """Usa IA para convertir la peticion del usuario en un prompt profesional en ingles."""

        # Instrucciones especificas por estilo
        style_instructions = {
            "3d": """IMPORTANT - The user wants 3D RENDER style. You MUST include these terms:
- "3D render, CGI, octane render, cinema 4d, blender cycles"
- Add: volumetric lighting, subsurface scattering, ambient occlusion, ray tracing
- Mention materials: glossy, metallic, glass, matte, subsurface
- Add depth of field and realistic shadows
- End with: "unreal engine 5, octane render, 3d art, highly detailed, 8k"
""",
            "anime": """IMPORTANT - The user wants ANIME style. Include:
- "anime style, manga art, cel shading, vibrant colors"
- Reference: studio ghibli, makoto shinkai, or similar aesthetic
- Add: clean linework, expressive eyes, dynamic pose
- End with: "anime key visual, detailed illustration, pixiv trending"
""",
            "pixel": """IMPORTANT - The user wants PIXEL ART style. Include:
- "pixel art, 16-bit, retro gaming aesthetic"
- Add: limited color palette, crisp pixels, no anti-aliasing
- End with: "pixel perfect, retro game art, nostalgic"
""",
            "photorealistic": """IMPORTANT - The user wants PHOTOREALISTIC style. Include:
- "photorealistic, DSLR photography, 85mm lens"
- Add: natural lighting, bokeh, shallow depth of field
- Mention camera settings when relevant
- End with: "hyperrealistic, RAW photo, film grain, professional photography"
""",
            "logo": """IMPORTANT - The user wants a LOGO/BRAND design. Include:
- "logo design, vector art, clean minimalist"
- Add: simple shapes, scalable, centered on solid background
- Mention: flat design, modern branding, geometric
- End with: "professional logo, brand identity, clean vector, white background"
""",
            "painting": """IMPORTANT - The user wants PAINTING style. Include:
- "oil painting, fine art, masterpiece, canvas texture"
- Add: visible brushstrokes, rich color palette, classical composition
- End with: "museum quality, art gallery, fine art print"
""",
            "cartoon": """IMPORTANT - The user wants CARTOON style. Include:
- "cartoon style, vibrant colors, exaggerated proportions"
- Add: bold outlines, playful, dynamic composition
- End with: "illustration, colorful cartoon, character design"
""",
            "cyberpunk": """IMPORTANT - The user wants CYBERPUNK/FUTURISTIC style. Include:
- "cyberpunk aesthetic, neon lights, futuristic city"
- Add: rain-slicked streets, holographic displays, dark atmosphere with neon accents
- Colors: electric blue, hot pink, purple, cyan glow
- End with: "cyberpunk 2077 style, blade runner aesthetic, neon noir, highly detailed, 8k"
""",
            "dark": """IMPORTANT - The user wants DARK/HORROR style. Include:
- "dark gothic atmosphere, dramatic shadows, horror aesthetic"
- Add: moody lighting, fog, desaturated colors with red/purple accents
- Mood: ominous, mysterious, unsettling
- End with: "dark fantasy art, gothic horror, cinematic lighting, highly detailed"
""",
            "minimal": """IMPORTANT - The user wants MINIMALIST style. Include:
- "minimalist design, clean lines, negative space"
- Add: simple geometric shapes, limited color palette, elegant
- End with: "minimalist art, clean design, modern aesthetic, flat design"
""",
            "watercolor": """IMPORTANT - The user wants WATERCOLOR style. Include:
- "watercolor painting, soft washes, wet on wet technique"
- Add: paper texture, bleeding colors, delicate, pastel palette
- End with: "watercolor illustration, dreamy, soft art, traditional media"
""",
            "comic": """IMPORTANT - The user wants COMIC BOOK style. Include:
- "comic book art, bold ink lines, dynamic action"
- Add: halftone dots, speech bubble style, dramatic poses
- End with: "comic book cover, Marvel style, dynamic illustration, ink and color"
""",
            "isometric": """IMPORTANT - The user wants ISOMETRIC style. Include:
- "isometric view, 3D isometric illustration, geometric precision"
- Add: clean edges, flat shading, architectural perspective
- End with: "isometric art, low poly, clean vector isometric, detailed"
""",
            "concept_art": """IMPORTANT - The user wants CONCEPT ART style. Include:
- "concept art, digital painting, cinematic composition"
- Add: atmospheric perspective, painterly brushwork, mood lighting
- End with: "concept art, artstation trending, professional illustration, cinematic"
""",
            "digital_art": """Style: high quality digital art. Interpret the subject matter and add the most fitting visual style.
End with: "highly detailed, professional quality, beautiful lighting, 8k resolution"
"""
        }

        style_note = style_instructions.get(style, style_instructions["digital_art"])

        enhancer_system = f"""You are an expert image prompt engineer for AI image generators (Stable Diffusion, Flux, Midjourney).

Your job: Take the user's request (in any language) and transform it into a detailed, professional image generation prompt in ENGLISH.

CONTEXT - C8L Agency:
C8L Agency (also written as "C.8.L" or "Corazones Locos") is a music production and technology company. When the user mentions "C8L", "C.8.L", or "C8L Agency" and asks for an IMAGE, they want a LOGO, EMBLEM, INSIGNIA or SHIELD design — NOT a portrait or character. Their brand aesthetic is: dark background, neon purple/magenta/gold accents, futuristic emblem design, lion silhouette integrated into logo, music/DJ culture symbols, cyberpunk-inspired. Generate it as a professional logo/emblem/shield design centered on dark background.

{style_note}

CRITICAL RULES:
- Output ONLY the enhanced prompt text, nothing else (no explanations, no quotes, no labels, no "Output:", no "Here is")
- Always write in English
- FAITHFULLY represent what the user asked for — do NOT invent a different subject
- If user says "dragon", the image MUST be about a dragon. If user says "car", it MUST be a car.
- Add specific details: lighting, composition, camera angle, atmosphere, colors
- Keep it under 150 words
- Stay faithful to the user's core idea — do NOT change the SUBJECT
- Never include readable text/words in the prompt
- Be SPECIFIC and VISUAL — describe what you SEE, not abstract concepts
- The FIRST sentence must describe the EXACT subject the user requested"""

        try:
            result = call_openrouter(
                prompt=f"Create an image prompt for: {user_prompt}",
                system_prompt=enhancer_system,
                agent_name="vulcano",
                temperature=0.7,
                max_tokens=250
            )
            if result and len(result.strip()) > 10:
                # Limpiar: quitar comillas, markdown, etc.
                cleaned = result.strip().strip('"').strip("'").strip("`")
                if cleaned.startswith("```"):
                    cleaned = cleaned.split("\n", 1)[-1].rsplit("```", 1)[0]
                # Quitar etiquetas tipo "Output:" o "Prompt:" si las pone
                for prefix in ["Output:", "Prompt:", "Enhanced:", "Result:"]:
                    if cleaned.startswith(prefix):
                        cleaned = cleaned[len(prefix):].strip()
                return cleaned
        except Exception as e:
            logger.warning(f"Prompt enhancer fallo: {e}")

        # Fallback LOCAL inteligente (sin IA) — para cuando el rate limit pega
        return self._local_prompt_enhance(user_prompt, style)

    def _local_prompt_enhance(self, prompt, style="digital_art"):
        """Fallback: mejora el prompt sin usar IA cuando hay rate limit."""
        # Traducciones basicas comunes
        translations = {
            "leon": "lion", "gato": "cat", "perro": "dog", "dragon": "dragon",
            "ciudad": "city", "bosque": "forest", "montaña": "mountain", "montana": "mountain",
            "oceano": "ocean", "espacio": "space", "noche": "night", "dia": "day",
            "fuego": "fire", "agua": "water", "cielo": "sky", "tierra": "earth",
            "guerrero": "warrior", "mago": "wizard", "robot": "robot", "alien": "alien",
            "mujer": "woman", "hombre": "man", "niño": "child", "nina": "girl",
            "coche": "car", "nave": "spaceship", "castillo": "castle", "torre": "tower",
            "flores": "flowers", "arbol": "tree", "sol": "sun", "luna": "moon",
            "musica": "music", "guitarra": "guitar", "corona": "crown", "trono": "throne",
            "alas": "wings", "espada": "sword", "escudo": "shield", "armadura": "armor",
            "casa": "house", "edificio": "building", "puente": "bridge", "rio": "river",
            "lobo": "wolf", "aguila": "eagle", "serpiente": "snake", "fenix": "phoenix",
            "demonio": "demon", "angel": "angel", "dios": "god", "diosa": "goddess",
            "oro": "gold", "plata": "silver", "cristal": "crystal", "diamante": "diamond",
            "monstruo": "monster", "criatura": "creature", "bestia": "beast",
            "planeta": "planet", "galaxia": "galaxy", "estrella": "star",
            "samurai": "samurai", "ninja": "ninja", "pirata": "pirate", "vikingo": "viking",
            "crea": "", "genera": "", "hazme": "", "quiero": "", "dame": "", "damer": "",
            "una imagen de": "", "un": "a", "una": "a", "con": "with", "en": "in",
            "sobre": "on top of", "debajo": "below", "grande": "large", "pequeño": "small",
            "volando": "flying", "corriendo": "running", "peleando": "fighting",
            "brillante": "glowing", "oscuro": "dark", "epico": "epic", "gigante": "giant",
            "c.8.l": "C8L Agency professional logo emblem shield design, lion silhouette, neon purple gold, dark background, centered, futuristic branding",
            "c8l": "C8L Agency professional logo emblem shield design, lion silhouette, neon purple gold, dark background, centered, futuristic branding",
        }

        # Traducir palabras conocidas
        result = prompt.lower()
        for es, en in translations.items():
            result = result.replace(es, en)

        # Agregar estilo segun tipo
        style_suffixes = {
            "3d": ", 3D render, octane render, volumetric lighting, CGI, unreal engine 5, highly detailed, 8k",
            "anime": ", anime style, vibrant colors, detailed illustration, studio ghibli aesthetic, anime key visual",
            "pixel": ", pixel art, 16-bit style, retro gaming, limited palette, pixel perfect",
            "photorealistic": ", photorealistic, DSLR photo, natural lighting, 85mm lens, hyperrealistic, 8k",
            "logo": ", logo design, minimalist vector, clean design, centered, white background, professional branding",
            "painting": ", oil painting style, fine art, visible brushstrokes, masterpiece, canvas texture",
            "cartoon": ", cartoon style, vibrant colors, bold outlines, playful illustration",
            "cyberpunk": ", cyberpunk aesthetic, neon lights, futuristic, electric blue and pink, blade runner style, 8k",
            "dark": ", dark gothic atmosphere, dramatic shadows, horror aesthetic, moody lighting, dark fantasy",
            "minimal": ", minimalist design, clean lines, negative space, simple elegant, flat design",
            "watercolor": ", watercolor painting, soft washes, pastel palette, paper texture, dreamy",
            "comic": ", comic book art, bold ink lines, dynamic action, halftone dots, Marvel style",
            "isometric": ", isometric view, 3D isometric illustration, geometric precision, clean edges",
            "concept_art": ", concept art, digital painting, cinematic composition, artstation trending",
            "digital_art": ", digital art, highly detailed, professional quality, beautiful lighting, 8k resolution",
        }

        suffix = style_suffixes.get(style, style_suffixes["digital_art"])
        return result + suffix

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

    def _generate_image_pollinations(self, prompt, style="digital_art"):
        """Genera imagen con Pollinations.ai (gratis, modelo Flux).
        Ajusta parametros segun el estilo detectado."""
        try:
            from urllib.parse import quote
            import random

            # Configuracion por estilo
            width, height = 1024, 1024
            model = "flux"  # Flux da mejor calidad que el default

            if style == "pixel":
                width, height = 512, 512
            elif style == "logo":
                width, height = 1024, 1024
            elif style in ("3d", "photorealistic"):
                width, height = 1024, 1024

            # Seed aleatorio para evitar cache y repeticiones
            seed = random.randint(1, 999999)

            url = f"https://image.pollinations.ai/prompt/{quote(prompt)}?width={width}&height={height}&model={model}&nologo=true&seed={seed}"
            logger.info(f"Pollinations URL: {url[:200]}...")
            r = requests.get(url, timeout=120)  # Timeout amplio para renders complejos
            if r.status_code == 200 and "image" in r.headers.get("content-type", ""):
                logger.info(f"Pollinations OK: {len(r.content)} bytes")
                return r.content
            else:
                logger.warning(f"Pollinations fallo: status={r.status_code}")
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
                headers=headers, json=payload, timeout=120
            )
            if r.status_code == 200 and "image" in r.headers.get("content-type", ""):
                return r.content
            # Si el modelo esta cargando, esperar e intentar una vez mas
            if r.status_code == 503:
                logger.info("HuggingFace: modelo cargando, esperando 10s...")
                time.sleep(10)
                r = requests.post(
                    "https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0",
                    headers=headers, json=payload, timeout=120
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
