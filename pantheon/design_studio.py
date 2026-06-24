# -*- coding: utf-8 -*-
"""
🎨 DESIGN STUDIO v1.0 — Motor de Diseño Multi-Herramienta
Integra TODAS las APIs gratuitas de edición de imagen + Canvas web propio.

APIs integradas (TODAS GRATIS):
1. Pollinations Kontext — Edición con texto (cambiar fondos, estilos, objetos)
2. Pollinations GPT-Image — Edición avanzada con IA
3. Gemini Image Edit — Editar fotos con instrucciones
4. Rembg (local) — Quitar fondo sin API externa
5. Pillow (local) — Filtros, recorte, texto, efectos
6. Canvas Web — Editor visual HTML5 interactivo

Flujo:
- Usuario envía foto + instrucción → DesignStudio decide qué herramienta usar
- Si pide editar → usa Kontext/Gemini/GPT-Image
- Si pide quitar fondo → usa rembg local o Pollinations
- Si pide filtros/ajustes → usa Pillow local
- Si pide canvas/editor → genera link al editor web
"""

import logging
import io
import os
import time
import uuid
import base64
import requests
from urllib.parse import quote

logger = logging.getLogger("c8l.design_studio")


# ---------------------------------------------------------------------------
# HERRAMIENTAS DISPONIBLES
# ---------------------------------------------------------------------------

DESIGN_TOOLS = {
    "remove_bg": {
        "name": "Quitar Fondo",
        "description": "Elimina el fondo de cualquier imagen",
        "keywords": ["fondo", "background", "quitar fondo", "sin fondo", "transparente",
                     "recortar", "remove bg", "cutout", "silueta"],
        "engine": "rembg_local",  # Primero local, fallback a Pollinations
    },
    "edit_ai": {
        "name": "Edición con IA",
        "description": "Edita fotos con instrucciones de texto",
        "keywords": ["cambia", "edita", "modifica", "pon", "quita", "agrega",
                     "reemplaza", "transforma", "convierte", "hazlo", "ponle",
                     "cambiale", "edit", "change", "replace", "add", "remove"],
        "engine": "pollinations_kontext",
    },
    "upscale": {
        "name": "Mejorar Calidad",
        "description": "Aumenta resolución y nitidez",
        "keywords": ["mejorar", "calidad", "resolucion", "nitidez", "upscale",
                     "enhance", "hd", "4k", "agrandar", "ampliar", "sharpen"],
        "engine": "pillow_enhance",
    },
    "filters": {
        "name": "Filtros y Efectos",
        "description": "Aplica filtros tipo Instagram",
        "keywords": ["filtro", "efecto", "blanco y negro", "sepia", "vintage",
                     "brillo", "contraste", "saturacion", "blur", "sharpen",
                     "neon", "retro", "oscurecer", "aclarar", "invertir"],
        "engine": "pillow_filters",
    },
    "text_overlay": {
        "name": "Agregar Texto",
        "description": "Pone texto sobre la imagen",
        "keywords": ["texto", "escribe", "letras", "titulo", "watermark",
                     "marca de agua", "firma", "text", "write", "caption"],
        "engine": "pillow_text",
    },
    "crop_resize": {
        "name": "Recortar / Redimensionar",
        "description": "Corta o cambia tamaño de la imagen",
        "keywords": ["recortar", "cortar", "crop", "resize", "tamano",
                     "cuadrado", "circular", "redondo", "rotar", "voltear"],
        "engine": "pillow_crop",
    },
    "collage": {
        "name": "Collage",
        "description": "Combina varias imágenes en una",
        "keywords": ["collage", "combinar", "juntar", "grid", "mosaico",
                     "lado a lado", "antes despues", "comparar"],
        "engine": "pillow_collage",
    },
    "canvas": {
        "name": "Canvas Editor",
        "description": "Abre editor visual interactivo en el navegador",
        "keywords": ["canvas", "editor", "photoshop", "diseñar", "disena",
                     "panel", "herramienta", "abrir editor", "capcut",
                     "photolab", "photoroom", "canva"],
        "engine": "canvas_web",
    },
    "style_transfer": {
        "name": "Cambiar Estilo",
        "description": "Transforma el estilo artístico de la foto",
        "keywords": ["estilo", "style", "anime", "cartoon", "pintura",
                     "oil painting", "acuarela", "pixel art", "comic",
                     "como si fuera", "al estilo de", "convertir a"],
        "engine": "pollinations_style",
    },
}



# ---------------------------------------------------------------------------
# CLASE PRINCIPAL
# ---------------------------------------------------------------------------

class DesignStudio:
    """
    Motor de diseño inteligente multi-herramienta.
    Recibe imagen + instrucción y decide qué tool usar.
    """

    def __init__(self):
        self.edits_count = 0
        self.canvas_sessions = {}

    def process(self, instruction, image_bytes=None, chat_id=None):
        """
        Punto de entrada principal.

        Args:
            instruction: Qué quiere hacer el usuario
            image_bytes: Imagen a editar (None si quiere canvas vacío)
            chat_id: ID del chat (para generar link de canvas)

        Returns:
            dict: {"type": "image"|"text"|"link", "content": ..., "caption": ...}
        """
        tool = self._detect_tool(instruction)
        logger.info(f"DesignStudio: tool={tool} | instrucción: {instruction[:80]}")

        if tool == "canvas":
            return self._open_canvas(instruction, image_bytes, chat_id)
        elif tool == "remove_bg":
            return self._remove_background(image_bytes, instruction)
        elif tool == "edit_ai":
            return self._edit_with_ai(image_bytes, instruction)
        elif tool == "upscale":
            return self._upscale_image(image_bytes)
        elif tool == "filters":
            return self._apply_filter(image_bytes, instruction)
        elif tool == "text_overlay":
            return self._add_text(image_bytes, instruction)
        elif tool == "crop_resize":
            return self._crop_resize(image_bytes, instruction)
        elif tool == "style_transfer":
            return self._style_transfer(image_bytes, instruction)
        elif tool == "collage":
            return self._create_collage(image_bytes, instruction)
        else:
            # Default: edición IA
            if image_bytes:
                return self._edit_with_ai(image_bytes, instruction)
            else:
                return self._open_canvas(instruction, None, chat_id)

    def _detect_tool(self, instruction):
        """Detecta qué herramienta usar basado en la instrucción."""
        t = instruction.lower()
        best_tool = None
        best_score = 0

        for tool_id, info in DESIGN_TOOLS.items():
            score = sum(1 for kw in info["keywords"] if kw in t)
            if score > best_score:
                best_score = score
                best_tool = tool_id

        return best_tool or "edit_ai"



    # ---------------------------------------------------------------------------
    # TOOL: QUITAR FONDO
    # ---------------------------------------------------------------------------

    def _remove_background(self, image_bytes, instruction=""):
        """Quita fondo usando rembg local → fallback Pollinations."""
        if not image_bytes:
            return {"type": "error", "content": "Envía una foto para quitarle el fondo."}

        # Intento 1: rembg local (mejor calidad, sin internet)
        result = self._rembg_local(image_bytes)
        if result:
            return {"type": "image", "content": result,
                    "caption": "✅ Fondo eliminado (rembg)"}

        # Intento 2: Pollinations Kontext (edición con texto)
        result = self._pollinations_edit(image_bytes,
                                         "Remove the background completely, make it transparent white")
        if result:
            return {"type": "image", "content": result,
                    "caption": "✅ Fondo eliminado (IA)"}

        # Intento 3: Gemini edit
        result = self._gemini_edit(image_bytes, "Remove the background, white background only")
        if result:
            return {"type": "image", "content": result,
                    "caption": "✅ Fondo eliminado (Gemini)"}

        return {"type": "error", "content": "❌ No pude quitar el fondo. Intenta con otra foto."}

    def _rembg_local(self, image_bytes):
        """Quita fondo con rembg (procesamiento local)."""
        try:
            from rembg import remove
            output = remove(image_bytes)
            if output and len(output) > 1000:
                logger.info(f"rembg OK: {len(output)} bytes")
                return output
        except ImportError:
            logger.debug("rembg no instalado, usando fallback")
        except Exception as e:
            logger.warning(f"rembg error: {e}")
        return None



    # ---------------------------------------------------------------------------
    # TOOL: EDICION CON IA (Pollinations Kontext + Gemini)
    # ---------------------------------------------------------------------------

    def _edit_with_ai(self, image_bytes, instruction):
        """Edita imagen con IA usando texto como instrucción."""
        if not image_bytes:
            return {"type": "error", "content": "Envía una foto para editarla."}

        # Traducir instrucción a inglés para mejor resultado
        en_instruction = self._translate_instruction(instruction)

        # Intento 1: Pollinations Kontext (mejor para ediciones precisas)
        result = self._pollinations_edit(image_bytes, en_instruction)
        if result:
            self.edits_count += 1
            return {"type": "image", "content": result,
                    "caption": f"✅ Editado: {instruction[:80]}"}

        # Intento 2: Gemini Image Edit
        result = self._gemini_edit(image_bytes, en_instruction)
        if result:
            self.edits_count += 1
            return {"type": "image", "content": result,
                    "caption": f"✅ Editado: {instruction[:80]}"}

        return {"type": "error",
                "content": "❌ No pude editar la imagen. Intenta con otra instrucción."}

    def _pollinations_edit(self, image_bytes, prompt):
        """Edita imagen con Pollinations Kontext (GRATIS)."""
        try:
            from config import POLLINATIONS_EDIT_URL

            # Subir imagen a Pollinations primero
            img_base64 = base64.b64encode(image_bytes).decode("utf-8")

            # Usar endpoint de edición de imágenes
            headers = {"Content-Type": "application/json"}
            payload = {
                "prompt": prompt,
                "model": "kontext",
                "image": [f"data:image/jpeg;base64,{img_base64}"],
                "size": "1024x1024",
                "response_format": "b64_json",
            }

            r = requests.post(POLLINATIONS_EDIT_URL, headers=headers,
                            json=payload, timeout=90)

            if r.status_code == 200:
                data = r.json()
                if data.get("data") and data["data"][0].get("b64_json"):
                    img_data = base64.b64decode(data["data"][0]["b64_json"])
                    logger.info(f"Pollinations Kontext edit OK: {len(img_data)} bytes")
                    return img_data
            else:
                logger.warning(f"Pollinations edit: status {r.status_code}")
        except Exception as e:
            logger.warning(f"Pollinations edit error: {e}")
        return None

    def _gemini_edit(self, image_bytes, instruction):
        """Edita imagen con Gemini (google-genai SDK)."""
        try:
            from config import GEMINI_API_KEY, GEMINI_IMAGE_URL

            img_base64 = base64.b64encode(image_bytes).decode("utf-8")
            headers = {"Content-Type": "application/json"}
            payload = {
                "contents": [{
                    "parts": [
                        {"inlineData": {"mimeType": "image/jpeg", "data": img_base64}},
                        {"text": f"Edit this image: {instruction}. Return the modified image."}
                    ]
                }],
                "generationConfig": {"responseModalities": ["IMAGE", "TEXT"]}
            }
            url = f"{GEMINI_IMAGE_URL}?key={GEMINI_API_KEY}"
            r = requests.post(url, headers=headers, json=payload, timeout=90)

            if r.status_code == 200:
                data = r.json()
                for candidate in data.get("candidates", []):
                    for part in candidate.get("content", {}).get("parts", []):
                        if "inlineData" in part:
                            if "image" in part["inlineData"].get("mimeType", ""):
                                return base64.b64decode(part["inlineData"]["data"])
        except Exception as e:
            logger.warning(f"Gemini edit error: {e}")
        return None



    # ---------------------------------------------------------------------------
    # TOOL: FILTROS Y EFECTOS (Pillow local)
    # ---------------------------------------------------------------------------

    def _apply_filter(self, image_bytes, instruction):
        """Aplica filtros con Pillow (todo local, gratis)."""
        if not image_bytes:
            return {"type": "error", "content": "Envía una foto para aplicar filtros."}
        try:
            from PIL import Image, ImageFilter, ImageEnhance, ImageOps

            img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
            t = instruction.lower()

            if any(kw in t for kw in ["blanco y negro", "b&w", "grayscale", "gris"]):
                img = ImageOps.grayscale(img).convert("RGB")
                caption = "⚫⚪ Blanco y negro"
            elif any(kw in t for kw in ["sepia", "vintage", "antiguo"]):
                img = self._sepia_filter(img)
                caption = "📜 Sepia/Vintage"
            elif any(kw in t for kw in ["neon", "glow", "brillo neon"]):
                img = self._neon_filter(img)
                caption = "💜 Neon Glow"
            elif any(kw in t for kw in ["blur", "desenfoque", "borroso"]):
                img = img.filter(ImageFilter.GaussianBlur(radius=5))
                caption = "🌫️ Desenfoque"
            elif any(kw in t for kw in ["sharpen", "nitidez", "enfocar"]):
                img = img.filter(ImageFilter.SHARPEN)
                caption = "🔍 Nitidez aumentada"
            elif any(kw in t for kw in ["brillo", "bright", "aclarar", "claro"]):
                img = ImageEnhance.Brightness(img).enhance(1.4)
                caption = "☀️ Brillo aumentado"
            elif any(kw in t for kw in ["oscuro", "dark", "oscurecer"]):
                img = ImageEnhance.Brightness(img).enhance(0.6)
                caption = "🌙 Oscurecido"
            elif any(kw in t for kw in ["contraste", "contrast"]):
                img = ImageEnhance.Contrast(img).enhance(1.5)
                caption = "🎯 Contraste aumentado"
            elif any(kw in t for kw in ["saturacion", "saturar", "vivido", "colorido"]):
                img = ImageEnhance.Color(img).enhance(1.6)
                caption = "🌈 Saturación aumentada"
            elif any(kw in t for kw in ["invertir", "negativo", "invert"]):
                img = ImageOps.invert(img)
                caption = "🔄 Colores invertidos"
            elif any(kw in t for kw in ["espejo", "mirror", "voltear", "flip"]):
                img = ImageOps.mirror(img)
                caption = "🪞 Volteado horizontal"
            elif any(kw in t for kw in ["retro", "80s", "synthwave"]):
                img = self._retro_filter(img)
                caption = "🕹️ Retro/Synthwave"
            elif any(kw in t for kw in ["emboss", "relieve", "grabado"]):
                img = img.filter(ImageFilter.EMBOSS)
                caption = "🏛️ Efecto relieve"
            elif any(kw in t for kw in ["contorno", "edge", "bordes", "lineas"]):
                img = img.filter(ImageFilter.FIND_EDGES)
                caption = "✏️ Detección de bordes"
            else:
                # Default: auto-enhance
                img = ImageEnhance.Contrast(img).enhance(1.2)
                img = ImageEnhance.Color(img).enhance(1.2)
                img = img.filter(ImageFilter.SHARPEN)
                caption = "✨ Auto-mejorado"

            output = io.BytesIO()
            img.save(output, format="PNG", quality=95)
            self.edits_count += 1
            return {"type": "image", "content": output.getvalue(), "caption": caption}

        except Exception as e:
            logger.warning(f"Filter error: {e}")
            return {"type": "error", "content": f"❌ Error aplicando filtro: {e}"}

    def _sepia_filter(self, img):
        """Filtro sepia."""
        from PIL import ImageOps
        gray = ImageOps.grayscale(img)
        sepia = Image.merge("RGB", (
            gray.point(lambda x: min(255, int(x * 1.2))),
            gray.point(lambda x: int(x * 1.0)),
            gray.point(lambda x: int(x * 0.8)),
        ))
        return sepia

    def _neon_filter(self, img):
        """Filtro neon/glow."""
        from PIL import ImageEnhance, ImageFilter
        img = ImageEnhance.Color(img).enhance(2.0)
        img = ImageEnhance.Contrast(img).enhance(1.5)
        img = ImageEnhance.Brightness(img).enhance(0.8)
        return img

    def _retro_filter(self, img):
        """Filtro retro/synthwave."""
        from PIL import ImageEnhance
        img = ImageEnhance.Color(img).enhance(1.8)
        img = ImageEnhance.Contrast(img).enhance(1.3)
        # Tint púrpura/magenta
        r, g, b = img.split()
        r = r.point(lambda x: min(255, int(x * 1.1)))
        b = b.point(lambda x: min(255, int(x * 1.2)))
        return Image.merge("RGB", (r, g, b))



    # ---------------------------------------------------------------------------
    # TOOL: MEJORAR CALIDAD / UPSCALE
    # ---------------------------------------------------------------------------

    def _upscale_image(self, image_bytes):
        """Mejora calidad/resolución con Pillow (2x upscale + sharpen)."""
        if not image_bytes:
            return {"type": "error", "content": "Envía una foto para mejorar."}
        try:
            from PIL import Image, ImageFilter, ImageEnhance

            img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
            w, h = img.size

            # Upscale 2x con LANCZOS (mejor calidad)
            new_size = (min(w * 2, 4096), min(h * 2, 4096))
            img = img.resize(new_size, Image.LANCZOS)

            # Sharpen
            img = img.filter(ImageFilter.SHARPEN)
            img = ImageEnhance.Contrast(img).enhance(1.1)

            output = io.BytesIO()
            img.save(output, format="PNG", quality=95)
            self.edits_count += 1
            return {"type": "image", "content": output.getvalue(),
                    "caption": f"✅ Mejorada: {w}x{h} → {new_size[0]}x{new_size[1]}"}

        except Exception as e:
            return {"type": "error", "content": f"❌ Error mejorando: {e}"}

    # ---------------------------------------------------------------------------
    # TOOL: AGREGAR TEXTO
    # ---------------------------------------------------------------------------

    def _add_text(self, image_bytes, instruction):
        """Agrega texto sobre la imagen."""
        if not image_bytes:
            return {"type": "error", "content": "Envía una foto para agregar texto."}
        try:
            from PIL import Image, ImageDraw, ImageFont, ImageFilter

            img = Image.open(io.BytesIO(image_bytes)).convert("RGBA")
            w, h = img.size

            # Extraer texto de la instrucción
            text = self._extract_text_from_instruction(instruction)
            if not text:
                text = "C8L"

            # Fuente
            font_size = max(w // 15, 30)
            try:
                from pantheon.logo_engine import _get_font
                font = _get_font("futurista", font_size)
            except:
                font = ImageFont.load_default()

            # Posición centrada abajo
            bbox = font.getbbox(text)
            tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
            x = (w - tw) // 2
            y = h - th - 40

            # Sombra + texto
            overlay = Image.new("RGBA", (w, h), (0, 0, 0, 0))
            draw = ImageDraw.Draw(overlay)
            # Sombra
            draw.text((x + 2, y + 2), text, font=font, fill=(0, 0, 0, 180))
            # Texto blanco
            draw.text((x, y), text, font=font, fill=(255, 255, 255, 255))

            img = Image.alpha_composite(img, overlay)
            output = io.BytesIO()
            img.convert("RGB").save(output, format="PNG", quality=95)
            self.edits_count += 1
            return {"type": "image", "content": output.getvalue(),
                    "caption": f"✅ Texto agregado: '{text}'"}

        except Exception as e:
            return {"type": "error", "content": f"❌ Error: {e}"}

    def _extract_text_from_instruction(self, instruction):
        """Extrae el texto que el usuario quiere poner."""
        import re
        # Buscar texto entre comillas
        match = re.search(r'["\'](.+?)["\']', instruction)
        if match:
            return match.group(1)
        # Buscar después de "que diga" / "escribe" / "pon"
        patterns = [r'que diga\s+(.+)', r'escribe\s+(.+)', r'pon\s+(.+)',
                   r'texto\s+(.+)', r'titulo\s+(.+)']
        for pat in patterns:
            match = re.search(pat, instruction, re.IGNORECASE)
            if match:
                return match.group(1).strip()[:50]
        return None



    # ---------------------------------------------------------------------------
    # TOOL: RECORTAR / REDIMENSIONAR
    # ---------------------------------------------------------------------------

    def _crop_resize(self, image_bytes, instruction):
        """Recorta o redimensiona imagen."""
        if not image_bytes:
            return {"type": "error", "content": "Envía una foto para recortar."}
        try:
            from PIL import Image, ImageOps

            img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
            t = instruction.lower()

            if any(kw in t for kw in ["cuadrado", "square", "1:1"]):
                img = ImageOps.fit(img, (1024, 1024), Image.LANCZOS)
                caption = "✅ Recortado: cuadrado 1:1"
            elif any(kw in t for kw in ["vertical", "9:16", "story", "reel"]):
                img = ImageOps.fit(img, (720, 1280), Image.LANCZOS)
                caption = "✅ Recortado: vertical 9:16"
            elif any(kw in t for kw in ["horizontal", "16:9", "youtube"]):
                img = ImageOps.fit(img, (1280, 720), Image.LANCZOS)
                caption = "✅ Recortado: horizontal 16:9"
            elif any(kw in t for kw in ["rotar", "rotate", "girar"]):
                img = img.rotate(90, expand=True)
                caption = "✅ Rotada 90°"
            elif any(kw in t for kw in ["voltear", "flip", "espejo"]):
                img = ImageOps.mirror(img)
                caption = "✅ Volteada"
            elif any(kw in t for kw in ["circular", "circulo", "redondo"]):
                img = self._make_circular(img)
                caption = "✅ Recorte circular"
            else:
                # Auto: cuadrado centrado
                img = ImageOps.fit(img, (1024, 1024), Image.LANCZOS)
                caption = "✅ Recortado automático (cuadrado)"

            output = io.BytesIO()
            img.save(output, format="PNG", quality=95)
            self.edits_count += 1
            return {"type": "image", "content": output.getvalue(), "caption": caption}

        except Exception as e:
            return {"type": "error", "content": f"❌ Error recortando: {e}"}

    def _make_circular(self, img):
        """Crea recorte circular."""
        from PIL import Image, ImageDraw
        size = min(img.size)
        img = ImageOps.fit(img, (size, size), Image.LANCZOS)
        mask = Image.new("L", (size, size), 0)
        draw = ImageDraw.Draw(mask)
        draw.ellipse((0, 0, size, size), fill=255)
        result = Image.new("RGBA", (size, size), (0, 0, 0, 0))
        result.paste(img, mask=mask)
        return result

    # ---------------------------------------------------------------------------
    # TOOL: STYLE TRANSFER (Pollinations con modelo de estilo)
    # ---------------------------------------------------------------------------

    def _style_transfer(self, image_bytes, instruction):
        """Transforma estilo artístico con IA."""
        if not image_bytes:
            return {"type": "error", "content": "Envía una foto para cambiar estilo."}

        # Detectar estilo deseado
        style = self._detect_style(instruction)
        prompt = f"Transform this image into {style} style, maintain the same composition and subject"

        # Usar Pollinations Kontext o Gemini
        result = self._pollinations_edit(image_bytes, prompt)
        if result:
            self.edits_count += 1
            return {"type": "image", "content": result,
                    "caption": f"🎨 Estilo aplicado: {style}"}

        result = self._gemini_edit(image_bytes, prompt)
        if result:
            self.edits_count += 1
            return {"type": "image", "content": result,
                    "caption": f"🎨 Estilo aplicado: {style}"}

        return {"type": "error", "content": "❌ No pude cambiar el estilo."}

    def _detect_style(self, instruction):
        """Detecta estilo artístico de la instrucción."""
        t = instruction.lower()
        styles = {
            "anime": ["anime", "manga", "japones"],
            "oil painting": ["pintura", "oleo", "painting"],
            "watercolor": ["acuarela", "watercolor"],
            "pixel art": ["pixel", "8bit", "retro"],
            "cartoon": ["cartoon", "caricatura", "animado"],
            "cyberpunk neon": ["cyberpunk", "neon", "futurista"],
            "pencil sketch": ["dibujo", "lapiz", "sketch", "boceto"],
            "comic book": ["comic", "marvel", "dc"],
            "impressionist": ["impresionista", "monet", "van gogh"],
            "pop art": ["pop art", "warhol", "andy"],
            "minimalist": ["minimalista", "minimal", "simple"],
            "dark gothic": ["gotico", "dark", "oscuro"],
            "vaporwave": ["vaporwave", "aesthetic", "retro 80s"],
            "studio ghibli": ["ghibli", "miyazaki"],
        }
        for style_name, keywords in styles.items():
            if any(kw in t for kw in keywords):
                return style_name
        return "artistic digital painting"



    # ---------------------------------------------------------------------------
    # TOOL: COLLAGE
    # ---------------------------------------------------------------------------

    def _create_collage(self, image_bytes, instruction):
        """Crea collage (placeholder — necesita múltiples imágenes)."""
        return {"type": "text",
                "content": ("📸 Para crear un collage, envíame varias fotos una por una "
                           "y luego escribe 'collage' para combinarlas.\n\n"
                           "O usa el Canvas Editor para diseño libre: escribe 'abrir canvas'")}

    # ---------------------------------------------------------------------------
    # TOOL: CANVAS WEB (Editor visual interactivo)
    # ---------------------------------------------------------------------------

    def _open_canvas(self, instruction, image_bytes=None, chat_id=None):
        """
        Genera un link al Canvas Editor web.
        Si hay imagen, la precarga en el editor.
        """
        page_id = f"canvas_{uuid.uuid4().hex[:8]}"

        # Si hay imagen, guardarla para que el canvas la cargue
        image_data_url = ""
        if image_bytes:
            img_b64 = base64.b64encode(image_bytes).decode("utf-8")
            image_data_url = f"data:image/jpeg;base64,{img_b64}"

        # Generar la página del canvas
        from pantheon.canvas_page import generate_canvas_html
        html = generate_canvas_html(page_id, image_data_url)

        # Guardar en memoria para servir via HTTP
        from config import BASE_DIR, PAGES_DIR
        os.makedirs(PAGES_DIR, exist_ok=True)
        page_path = os.path.join(PAGES_DIR, f"{page_id}.html")
        with open(page_path, "w", encoding="utf-8") as f:
            f.write(html)

        # Construir URL (usa el servicio de Render)
        render_url = os.environ.get("RENDER_EXTERNAL_URL", "")
        if render_url:
            canvas_url = f"{render_url}/pages/{page_id}"
        else:
            canvas_url = f"http://localhost:8080/pages/{page_id}"

        return {
            "type": "link",
            "content": canvas_url,
            "caption": (
                "🎨 **DESIGN CANVAS ABIERTO**\n\n"
                "Tu editor de fotos está listo:\n"
                f"🔗 {canvas_url}\n\n"
                "✅ Herramientas incluidas:\n"
                "• Filtros (B&W, Sepia, Neon, Vintage...)\n"
                "• Recortar / Rotar / Voltear\n"
                "• Agregar texto y stickers\n"
                "• Dibujar a mano libre\n"
                "• Ajustar brillo/contraste/saturación\n"
                "• Quitar fondo con IA\n"
                "• Descargar resultado HD\n\n"
                "💡 100% gratis, sin cuenta, sin watermark"
            ),
            "page_id": page_id,
        }

    # ---------------------------------------------------------------------------
    # UTILIDADES
    # ---------------------------------------------------------------------------

    def _translate_instruction(self, instruction):
        """Traduce instrucción de edición al inglés."""
        translations = {
            "quita el fondo": "remove the background",
            "cambia el fondo": "change the background to",
            "pon fondo": "add background",
            "hazla mas clara": "make it brighter",
            "hazla mas oscura": "make it darker",
            "agrega texto": "add text",
            "quita el texto": "remove all text",
            "hazla blanco y negro": "convert to black and white",
            "mejora la calidad": "enhance quality and sharpness",
            "cambia los colores": "change the color palette",
            "ponle filtro": "apply artistic filter",
            "hazla mas grande": "upscale and enhance",
            "recorta": "crop to focus on main subject",
            "quita la persona": "remove the person",
            "agrega una persona": "add a person",
            "cambia la ropa": "change the clothing to",
            "ponle lentes": "add sunglasses",
            "hazla anime": "convert to anime style",
            "hazla cartoon": "convert to cartoon style",
        }
        t = instruction.lower()
        for es, en in translations.items():
            if es in t:
                return t.replace(es, en)
        # Si no encuentra traducción directa, devolver con prefijo
        return f"Edit this image: {instruction}"

    def get_tools_list(self):
        """Lista herramientas disponibles para mostrar al usuario."""
        lines = ["🎨 **DESIGN STUDIO — Herramientas:**\n"]
        for tool_id, info in DESIGN_TOOLS.items():
            lines.append(f"• **{info['name']}** — {info['description']}")
        lines.append("\n💡 Envía una foto + instrucción, o escribe 'abrir canvas'")
        return "\n".join(lines)

    def get_stats(self):
        """Estadísticas."""
        return f"🎨 Design Studio: {self.edits_count} ediciones realizadas"


# ---------------------------------------------------------------------------
# INSTANCIA GLOBAL
# ---------------------------------------------------------------------------
design_studio = DesignStudio()
