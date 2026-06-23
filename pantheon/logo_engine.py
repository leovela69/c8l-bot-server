# -*- coding: utf-8 -*-
"""
🎨 LOGO ENGINE — Motor universal de logos y texto para C8L
Genera cualquier combinacion de texto + estilo + geometria + dimension.

Flujo:
1. IA genera fondo/emblema sin texto
2. Python (Pillow) superpone texto PERFECTO con el estilo pedido
3. Resultado: logo profesional con letras impecables

Soporta:
- Cualquier texto: C8L, C8L AGENCY, C8L TV, C8L RECORDS, lo que sea
- Cualquier estilo: neon, gold, ice, fire, chrome, minimal, retro, etc
- Cualquier geometria: circular, hexagonal, triangular, diamond, shield, etc
- Cualquier dimension: banner, cuadrado, vertical, icono, portada
"""

import io
import logging
import math
import os
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageEnhance

logger = logging.getLogger("c8l.logo_engine")

# ---------------------------------------------------------------------------
# FUENTES — Usamos las del sistema + descargadas
# ---------------------------------------------------------------------------
FONT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "fonts")
os.makedirs(FONT_DIR, exist_ok=True)

def _get_font(style="bold", size=80):
    """Obtiene la mejor fuente disponible para el estilo."""
    # Intentar fuentes del sistema en orden de preferencia
    font_paths = {
        "bold": [
            "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
            "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
            "/usr/share/fonts/dejavu/DejaVuSans-Bold.ttf",
        ],
        "regular": [
            "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
            "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
            "/usr/share/fonts/dejavu/DejaVuSans.ttf",
        ],
        "mono": [
            "/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf",
            "/usr/share/fonts/truetype/liberation/LiberationMono-Bold.ttf",
            "/usr/share/fonts/dejavu/DejaVuSansMono-Bold.ttf",
        ],
    }

    paths = font_paths.get(style, font_paths["bold"])
    for path in paths:
        if os.path.exists(path):
            try:
                return ImageFont.truetype(path, size)
            except:
                continue

    # Fallback: fuente default de Pillow
    try:
        return ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", size)
    except:
        return ImageFont.load_default()


# ---------------------------------------------------------------------------
# ESTILOS DE TEXTO — Cada uno aplica efectos diferentes
# ---------------------------------------------------------------------------

def _apply_neon_glow(draw, img, text, position, font, color=(200, 0, 255)):
    """Texto con efecto neon/glow."""
    x, y = position
    # Capas de glow (de mas borroso a mas definido)
    glow_layers = [
        (color[0], color[1], color[2], 30),   # Outer glow
        (color[0], color[1], color[2], 60),
        (color[0], color[1], color[2], 100),
        (color[0], color[1], color[2], 180),
        (255, 255, 255, 255),                   # Core blanco
    ]
    offsets = [4, 3, 2, 1, 0]

    for i, (r, g, b, a) in enumerate(glow_layers):
        offset = offsets[i]
        # Dibujar en varias posiciones para simular glow
        for dx in range(-offset, offset + 1):
            for dy in range(-offset, offset + 1):
                if dx*dx + dy*dy <= offset*offset:
                    draw.text((x + dx, y + dy), text, font=font, fill=(r, g, b, a))


def _apply_gold_metallic(draw, text, position, font):
    """Texto con efecto dorado metalico."""
    x, y = position
    # Sombra
    draw.text((x + 3, y + 3), text, font=font, fill=(40, 30, 0, 200))
    # Borde oscuro
    for dx in [-1, 0, 1]:
        for dy in [-1, 0, 1]:
            draw.text((x + dx, y + dy), text, font=font, fill=(120, 80, 0, 255))
    # Texto dorado
    draw.text((x, y), text, font=font, fill=(255, 215, 0, 255))
    # Highlight
    draw.text((x, y - 1), text, font=font, fill=(255, 240, 150, 100))


def _apply_chrome(draw, text, position, font):
    """Texto con efecto chrome/plateado."""
    x, y = position
    draw.text((x + 2, y + 2), text, font=font, fill=(30, 30, 30, 200))
    for dx in [-1, 0, 1]:
        for dy in [-1, 0, 1]:
            draw.text((x + dx, y + dy), text, font=font, fill=(100, 100, 110, 255))
    draw.text((x, y), text, font=font, fill=(200, 210, 220, 255))
    draw.text((x, y - 1), text, font=font, fill=(240, 245, 255, 80))


def _apply_fire(draw, text, position, font):
    """Texto con efecto fuego."""
    x, y = position
    draw.text((x + 2, y + 2), text, font=font, fill=(80, 0, 0, 200))
    draw.text((x, y + 1), text, font=font, fill=(255, 60, 0, 200))
    draw.text((x, y), text, font=font, fill=(255, 150, 0, 255))
    draw.text((x, y - 1), text, font=font, fill=(255, 220, 50, 150))


def _apply_ice(draw, text, position, font):
    """Texto con efecto hielo/cristal."""
    x, y = position
    draw.text((x + 2, y + 2), text, font=font, fill=(0, 20, 60, 200))
    for dx in [-1, 0, 1]:
        for dy in [-1, 0, 1]:
            draw.text((x + dx, y + dy), text, font=font, fill=(0, 100, 180, 255))
    draw.text((x, y), text, font=font, fill=(150, 220, 255, 255))
    draw.text((x, y - 1), text, font=font, fill=(220, 240, 255, 100))


def _apply_outline(draw, text, position, font, text_color=(255, 255, 255), outline_color=(0, 0, 0)):
    """Texto con outline grueso."""
    x, y = position
    # Outline
    for dx in range(-3, 4):
        for dy in range(-3, 4):
            draw.text((x + dx, y + dy), text, font=font, fill=outline_color + (255,))
    # Texto principal
    draw.text((x, y), text, font=font, fill=text_color + (255,))


def _apply_shadow_3d(draw, text, position, font, color=(255, 255, 255)):
    """Texto con efecto 3D (sombra desplazada)."""
    x, y = position
    # Sombra 3D
    for i in range(8, 0, -1):
        alpha = int(200 - i * 20)
        draw.text((x + i, y + i), text, font=font, fill=(0, 0, 0, max(alpha, 30)))
    draw.text((x, y), text, font=font, fill=color + (255,))


def _apply_minimal(draw, text, position, font):
    """Texto minimalista blanco limpio."""
    x, y = position
    draw.text((x, y), text, font=font, fill=(255, 255, 255, 255))


def _apply_retro(draw, text, position, font):
    """Texto estilo retro/synthwave."""
    x, y = position
    # Sombra cyan
    draw.text((x + 3, y + 3), text, font=font, fill=(0, 255, 255, 150))
    # Sombra magenta
    draw.text((x - 2, y - 2), text, font=font, fill=(255, 0, 255, 150))
    # Texto blanco
    draw.text((x, y), text, font=font, fill=(255, 255, 255, 255))


def _apply_gradient_text(draw, img, text, position, font, color1=(255, 0, 200), color2=(0, 200, 255)):
    """Texto con gradiente de color."""
    x, y = position
    # Crear imagen temporal para el texto
    bbox = font.getbbox(text)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]

    txt_img = Image.new("RGBA", (tw + 20, th + 20), (0, 0, 0, 0))
    txt_draw = ImageDraw.Draw(txt_img)
    txt_draw.text((10, 10), text, font=font, fill=(255, 255, 255, 255))

    # Crear gradiente
    gradient = Image.new("RGBA", txt_img.size, (0, 0, 0, 0))
    for i in range(tw + 20):
        ratio = i / (tw + 20)
        r = int(color1[0] * (1 - ratio) + color2[0] * ratio)
        g = int(color1[1] * (1 - ratio) + color2[1] * ratio)
        b = int(color1[2] * (1 - ratio) + color2[2] * ratio)
        for j in range(th + 20):
            if txt_img.getpixel((i, j))[3] > 0:
                gradient.putpixel((i, j), (r, g, b, 255))

    img.paste(gradient, (x - 10, y - 10), gradient)


# ---------------------------------------------------------------------------
# GEOMETRIAS — Formas de fondo/marco
# ---------------------------------------------------------------------------

def _draw_geometry(draw, img_size, geometry="none", color=(200, 0, 255, 100)):
    """Dibuja geometria de fondo/marco."""
    w, h = img_size
    cx, cy = w // 2, h // 2

    if geometry == "circle":
        r = min(w, h) // 3
        draw.ellipse([cx - r, cy - r, cx + r, cy + r], outline=color, width=4)
    elif geometry == "double_circle":
        r1 = min(w, h) // 3
        r2 = r1 + 20
        draw.ellipse([cx - r1, cy - r1, cx + r1, cy + r1], outline=color, width=3)
        draw.ellipse([cx - r2, cy - r2, cx + r2, cy + r2], outline=color, width=2)
    elif geometry == "hexagon":
        r = min(w, h) // 3
        points = [(cx + r * math.cos(math.radians(60 * i - 30)),
                   cy + r * math.sin(math.radians(60 * i - 30))) for i in range(6)]
        draw.polygon(points, outline=color, width=4)
    elif geometry == "diamond":
        r = min(w, h) // 3
        points = [(cx, cy - r), (cx + r, cy), (cx, cy + r), (cx - r, cy)]
        draw.polygon(points, outline=color, width=4)
    elif geometry == "triangle":
        r = min(w, h) // 3
        points = [(cx, cy - r), (cx + r, cy + r), (cx - r, cy + r)]
        draw.polygon(points, outline=color, width=4)
    elif geometry == "shield":
        r = min(w, h) // 3
        points = [
            (cx - r, cy - r),
            (cx + r, cy - r),
            (cx + r, cy + r // 2),
            (cx, cy + r),
            (cx - r, cy + r // 2),
        ]
        draw.polygon(points, outline=color, width=4)
    elif geometry == "pentagon":
        r = min(w, h) // 3
        points = [(cx + r * math.cos(math.radians(72 * i - 90)),
                   cy + r * math.sin(math.radians(72 * i - 90))) for i in range(5)]
        draw.polygon(points, outline=color, width=4)
    elif geometry == "octagon":
        r = min(w, h) // 3
        points = [(cx + r * math.cos(math.radians(45 * i)),
                   cy + r * math.sin(math.radians(45 * i))) for i in range(8)]
        draw.polygon(points, outline=color, width=4)
    elif geometry == "star":
        r_outer = min(w, h) // 3
        r_inner = r_outer // 2
        points = []
        for i in range(10):
            angle = math.radians(36 * i - 90)
            r = r_outer if i % 2 == 0 else r_inner
            points.append((cx + r * math.cos(angle), cy + r * math.sin(angle)))
        draw.polygon(points, outline=color, width=3)
    elif geometry == "square":
        r = min(w, h) // 3
        draw.rectangle([cx - r, cy - r, cx + r, cy + r], outline=color, width=4)
    elif geometry == "rounded_square":
        r = min(w, h) // 3
        draw.rounded_rectangle([cx - r, cy - r, cx + r, cy + r], radius=20, outline=color, width=4)


# ---------------------------------------------------------------------------
# DETECCION DE PARAMETROS
# ---------------------------------------------------------------------------

def detect_text_from_prompt(prompt):
    """Extrae el texto que el usuario quiere en el logo."""
    t = prompt.upper()

    # Buscar patrones comunes
    # C8L + algo
    import re
    # Buscar "C8L XXX" o "C.8.L. XXX" o "C.8.L XXX"
    patterns = [
        r'C\.?8\.?L\.?\s*(AGENCY|TV|RECORDS|MUSIC|STUDIO|GAMING|RADIO|BEATS|LIVE|PRO|MEDIA|FILMS|LABS|SHOP|STORE|NET|DIGITAL)',
        r'C\.?8\.?L\.?',
    ]

    for pattern in patterns:
        match = re.search(pattern, t)
        if match:
            return match.group(0).replace(".", "").strip()

    # Si no encuentra patron, buscar texto entre comillas
    quoted = re.findall(r'"([^"]+)"', prompt)
    if quoted:
        return quoted[0].upper()

    # Default
    return "C8L"


def detect_style_from_prompt(prompt):
    """Detecta el estilo de texto deseado."""
    t = prompt.lower()
    if any(kw in t for kw in ["neon", "glow", "brillo", "brillante", "luz"]):
        return "neon"
    elif any(kw in t for kw in ["gold", "dorado", "oro", "golden", "metalico"]):
        return "gold"
    elif any(kw in t for kw in ["chrome", "plata", "plateado", "silver", "metal"]):
        return "chrome"
    elif any(kw in t for kw in ["fuego", "fire", "llama", "flame", "rojo"]):
        return "fire"
    elif any(kw in t for kw in ["hielo", "ice", "cristal", "frozen", "azul"]):
        return "ice"
    elif any(kw in t for kw in ["3d", "tridimensional", "profundidad", "relieve"]):
        return "3d"
    elif any(kw in t for kw in ["retro", "synthwave", "80s", "vaporwave"]):
        return "retro"
    elif any(kw in t for kw in ["minimal", "minimalista", "simple", "limpio", "clean"]):
        return "minimal"
    elif any(kw in t for kw in ["outline", "contorno", "borde"]):
        return "outline"
    elif any(kw in t for kw in ["gradient", "gradiente", "degradado", "rainbow"]):
        return "gradient"
    return "neon"  # Default: neon (identidad C8L)


def detect_geometry_from_prompt(prompt):
    """Detecta la geometria deseada."""
    t = prompt.lower()
    if any(kw in t for kw in ["circulo", "circular", "redondo", "circle"]):
        return "double_circle"
    elif any(kw in t for kw in ["hexagono", "hexagonal", "hex"]):
        return "hexagon"
    elif any(kw in t for kw in ["diamante", "diamond", "rombo"]):
        return "diamond"
    elif any(kw in t for kw in ["triangulo", "triangle", "triangular"]):
        return "triangle"
    elif any(kw in t for kw in ["escudo", "shield", "insignia"]):
        return "shield"
    elif any(kw in t for kw in ["pentagono", "pentagon"]):
        return "pentagon"
    elif any(kw in t for kw in ["octagono", "octagon", "octagonal"]):
        return "octagon"
    elif any(kw in t for kw in ["estrella", "star"]):
        return "star"
    elif any(kw in t for kw in ["cuadrado", "square", "cuadro"]):
        return "rounded_square"
    elif any(kw in t for kw in ["poligono", "polygon", "geometr"]):
        return "hexagon"  # Default geometrico
    return "none"  # Sin geometria por defecto


def detect_dimensions_from_prompt(prompt):
    """Detecta dimensiones deseadas."""
    t = prompt.lower()
    if any(kw in t for kw in ["banner", "horizontal", "panoram"]):
        return (1200, 400)
    elif any(kw in t for kw in ["vertical", "story", "stories", "portrait"]):
        return (600, 1080)
    elif any(kw in t for kw in ["icono", "icon", "favicon", "pequeno", "mini"]):
        return (512, 512)
    elif any(kw in t for kw in ["portada", "cover", "header"]):
        return (1500, 500)
    elif any(kw in t for kw in ["poster", "cartel", "afiche"]):
        return (800, 1200)
    return (1024, 1024)  # Default cuadrado


def detect_neon_color_from_prompt(prompt):
    """Detecta color del neon."""
    t = prompt.lower()
    if any(kw in t for kw in ["rojo", "red"]):
        return (255, 30, 30)
    elif any(kw in t for kw in ["azul", "blue", "cyan"]):
        return (0, 200, 255)
    elif any(kw in t for kw in ["verde", "green"]):
        return (0, 255, 100)
    elif any(kw in t for kw in ["rosa", "pink", "magenta"]):
        return (255, 0, 200)
    elif any(kw in t for kw in ["dorado", "gold", "amarillo", "yellow"]):
        return (255, 200, 0)
    elif any(kw in t for kw in ["blanco", "white"]):
        return (255, 255, 255)
    elif any(kw in t for kw in ["naranja", "orange"]):
        return (255, 140, 0)
    return (200, 0, 255)  # Default: purpura C8L


# ---------------------------------------------------------------------------
# GENERADOR PRINCIPAL
# ---------------------------------------------------------------------------

def generate_logo_overlay(background_bytes, prompt):
    """
    Toma una imagen de fondo (generada por IA) y le superpone texto perfecto.

    Args:
        background_bytes: bytes de la imagen de fondo
        prompt: prompt original del usuario (para detectar texto/estilo/geometria)

    Returns:
        bytes de la imagen final con texto superpuesto
    """
    try:
        # Abrir imagen de fondo
        bg = Image.open(io.BytesIO(background_bytes)).convert("RGBA")
        width, height = bg.size

        # Crear capa de overlay
        overlay = Image.new("RGBA", (width, height), (0, 0, 0, 0))
        draw = ImageDraw.Draw(overlay)

        # Detectar parametros
        text = detect_text_from_prompt(prompt)
        style = detect_style_from_prompt(prompt)
        geometry = detect_geometry_from_prompt(prompt)
        color = detect_neon_color_from_prompt(prompt)

        # Dibujar geometria
        if geometry != "none":
            _draw_geometry(draw, (width, height), geometry, color + (150,))

        # Calcular tamano de fuente (adaptivo al tamaño de imagen y largo del texto)
        max_font_size = min(width, height) // 4
        font_size = min(max_font_size, int(width * 0.8 / max(len(text), 1) * 1.5))
        font_size = max(font_size, 40)  # Minimo 40px
        font = _get_font("bold", font_size)

        # Calcular posicion centrada
        bbox = font.getbbox(text)
        tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
        x = (width - tw) // 2
        y = (height - th) // 2 + height // 6  # Un poco abajo del centro

        # Aplicar estilo de texto
        if style == "neon":
            _apply_neon_glow(draw, overlay, text, (x, y), font, color)
        elif style == "gold":
            _apply_gold_metallic(draw, text, (x, y), font)
        elif style == "chrome":
            _apply_chrome(draw, text, (x, y), font)
        elif style == "fire":
            _apply_fire(draw, text, (x, y), font)
        elif style == "ice":
            _apply_ice(draw, text, (x, y), font)
        elif style == "3d":
            _apply_shadow_3d(draw, text, (x, y), font, color)
        elif style == "retro":
            _apply_retro(draw, text, (x, y), font)
        elif style == "minimal":
            _apply_minimal(draw, text, (x, y), font)
        elif style == "outline":
            _apply_outline(draw, text, (x, y), font, (255, 255, 255), color)
        elif style == "gradient":
            _apply_gradient_text(draw, overlay, text, (x, y), font, color, (0, 200, 255))
        else:
            _apply_neon_glow(draw, overlay, text, (x, y), font, color)

        # Componer fondo + overlay
        result = Image.alpha_composite(bg, overlay)

        # Convertir a bytes JPEG
        output = io.BytesIO()
        result.convert("RGB").save(output, format="PNG", quality=95)
        return output.getvalue()

    except Exception as e:
        logger.error(f"Logo overlay error: {e}", exc_info=True)
        return None


def generate_logo_standalone(prompt):
    """
    Genera un logo completo SIN imagen de fondo (fondo negro con geometria + texto).
    Para cuando no se necesita imagen de fondo de IA.

    Args:
        prompt: prompt del usuario

    Returns:
        bytes de la imagen del logo
    """
    try:
        dimensions = detect_dimensions_from_prompt(prompt)
        width, height = dimensions

        # Crear fondo oscuro
        img = Image.new("RGBA", (width, height), (10, 5, 20, 255))
        draw = ImageDraw.Draw(img)

        # Detectar parametros
        text = detect_text_from_prompt(prompt)
        style = detect_style_from_prompt(prompt)
        geometry = detect_geometry_from_prompt(prompt)
        color = detect_neon_color_from_prompt(prompt)

        # Agregar un sutil gradiente radial al fondo
        for i in range(min(width, height) // 2):
            alpha = int(30 * (1 - i / (min(width, height) // 2)))
            draw.ellipse([width//2 - i, height//2 - i, width//2 + i, height//2 + i],
                        fill=(color[0] // 8, color[1] // 8, color[2] // 8, alpha))

        # Dibujar geometria
        if geometry == "none":
            geometry = "double_circle"  # Default para standalone
        _draw_geometry(draw, (width, height), geometry, color + (180,))

        # Calcular fuente
        max_font_size = min(width, height) // 4
        font_size = min(max_font_size, int(width * 0.7 / max(len(text), 1) * 1.5))
        font_size = max(font_size, 40)
        font = _get_font("bold", font_size)

        # Posicion centrada
        bbox = font.getbbox(text)
        tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
        x = (width - tw) // 2
        y = (height - th) // 2

        # Aplicar estilo
        if style == "neon":
            _apply_neon_glow(draw, img, text, (x, y), font, color)
        elif style == "gold":
            _apply_gold_metallic(draw, text, (x, y), font)
        elif style == "chrome":
            _apply_chrome(draw, text, (x, y), font)
        elif style == "fire":
            _apply_fire(draw, text, (x, y), font)
        elif style == "ice":
            _apply_ice(draw, text, (x, y), font)
        elif style == "3d":
            _apply_shadow_3d(draw, text, (x, y), font, color)
        elif style == "retro":
            _apply_retro(draw, text, (x, y), font)
        elif style == "minimal":
            _apply_minimal(draw, text, (x, y), font)
        elif style == "outline":
            _apply_outline(draw, text, (x, y), font, (255, 255, 255), color)
        elif style == "gradient":
            _apply_gradient_text(draw, img, text, (x, y), font, color, (0, 200, 255))
        else:
            _apply_neon_glow(draw, img, text, (x, y), font, color)

        # Convertir a bytes
        output = io.BytesIO()
        img.convert("RGB").save(output, format="PNG", quality=95)
        return output.getvalue()

    except Exception as e:
        logger.error(f"Logo standalone error: {e}", exc_info=True)
        return None
