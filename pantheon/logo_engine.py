# -*- coding: utf-8 -*-
"""
🎨 LOGO ENGINE v2 — Motor universal de logos dinámicos para C8L
Genera cualquier combinacion de texto + estilo + geometria + fondo dinámico.

Mejoras v2:
- Fondos dinámicos con partículas, gradientes radiales, texturas
- Difuminación/blur gaussiano en capas
- Profundidad con múltiples capas alpha
- Más fuentes (30+ tipografías de Google Fonts)
- Efectos de texto avanzados con glow suave
- Partículas aleatorias de fondo
"""

import io
import logging
import math
import os
import random
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageEnhance

logger = logging.getLogger("c8l.logo_engine")

FONT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "fonts")
os.makedirs(FONT_DIR, exist_ok=True)



# ---------------------------------------------------------------------------
# FUENTES
# ---------------------------------------------------------------------------
def _get_font(style="futurista", size=80):
    """Obtiene la mejor fuente disponible para el estilo."""
    font_preferences = {
        "futurista": ["Orbitron-Bold", "Orbitron-Black", "Exo2-Bold", "Audiowide-Regular"],
        "tech": ["Exo2-Black", "Orbitron-Bold", "FiraCode-Bold", "JetBrainsMono-Bold"],
        "bold": ["BebasNeue-Regular", "Anton-Regular", "Montserrat-Black", "Poppins-Black"],
        "impacto": ["BlackOpsOne-Regular", "Bungee-Regular", "Anton-Regular", "Teko-Bold"],
        "elegante": ["Montserrat-Bold", "Poppins-Bold", "Raleway-Black", "Oswald-Bold"],
        "gaming": ["PressStart2P-Regular", "Silkscreen-Bold", "VT323-Regular"],
        "pixel": ["PressStart2P-Regular", "VT323-Regular", "Silkscreen-Bold"],
        "display": ["Righteous-Regular", "RussoOne-Regular", "Staatliches-Regular", "Bangers-Regular"],
        "graffiti": ["PermanentMarker-Regular", "RockSalt-Regular", "Bangers-Regular"],
        "condensada": ["Barlow-Black", "Oswald-Bold", "Teko-Bold", "BebasNeue-Regular"],
        "mono": ["FiraCode-Bold", "JetBrainsMono-Bold"],
        "militar": ["BlackOpsOne-Regular", "Staatliches-Regular", "Teko-Bold"],
        "retro": ["PressStart2P-Regular", "Bungee-Regular", "Righteous-Regular"],
        "decorativo": ["Bungee-Shade", "Bungee-Regular", "Bangers-Regular"],
        "script": ["PermanentMarker-Regular", "RockSalt-Regular"],
        "regular": ["Montserrat-Bold", "Poppins-Bold"],
    }
    preferred = font_preferences.get(style, font_preferences["futurista"])
    for font_name in preferred:
        path = os.path.join(FONT_DIR, f"{font_name}.ttf")
        if os.path.exists(path):
            try:
                return ImageFont.truetype(path, size)
            except:
                continue
    # Fallback: cualquier fuente descargada
    if os.path.exists(FONT_DIR):
        for f in sorted(os.listdir(FONT_DIR)):
            if f.endswith(".ttf"):
                try:
                    return ImageFont.truetype(os.path.join(FONT_DIR, f), size)
                except:
                    continue
    # Sistema
    for p in ["/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
              "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf"]:
        if os.path.exists(p):
            try:
                return ImageFont.truetype(p, size)
            except:
                continue
    return ImageFont.load_default()



# ---------------------------------------------------------------------------
# FONDOS DINAMICOS — No estáticos, con partículas y profundidad
# ---------------------------------------------------------------------------
def _generate_dynamic_background(width, height, color=(200, 0, 255), bg_style="nebula"):
    """Genera un fondo dinámico con profundidad, no plano/estático."""
    img = Image.new("RGBA", (width, height), (5, 2, 15, 255))
    draw = ImageDraw.Draw(img)

    if bg_style == "nebula":
        # Nebulosa: manchas de color difuminadas
        for _ in range(8):
            cx = random.randint(0, width)
            cy = random.randint(0, height)
            r = random.randint(100, 400)
            c = (color[0] // 4, color[1] // 4, color[2] // 4, random.randint(20, 60))
            draw.ellipse([cx-r, cy-r, cx+r, cy+r], fill=c)
        # Blur fuerte para difuminar
        img = img.filter(ImageFilter.GaussianBlur(radius=40))
        draw = ImageDraw.Draw(img)
        # Estrellas/partículas
        for _ in range(150):
            x = random.randint(0, width)
            y = random.randint(0, height)
            s = random.randint(1, 3)
            alpha = random.randint(80, 255)
            draw.ellipse([x, y, x+s, y+s], fill=(255, 255, 255, alpha))

    elif bg_style == "particles":
        # Partículas flotantes con glow
        for _ in range(60):
            x = random.randint(0, width)
            y = random.randint(0, height)
            r = random.randint(2, 15)
            alpha = random.randint(40, 150)
            c = (color[0], color[1], color[2], alpha)
            draw.ellipse([x-r, y-r, x+r, y+r], fill=c)
        img = img.filter(ImageFilter.GaussianBlur(radius=8))
        draw = ImageDraw.Draw(img)
        # Particulas nítidas encima
        for _ in range(30):
            x = random.randint(0, width)
            y = random.randint(0, height)
            s = random.randint(1, 4)
            draw.ellipse([x, y, x+s, y+s], fill=(255, 255, 255, 200))

    elif bg_style == "gradient_radial":
        # Gradiente radial desde el centro
        max_r = int(math.sqrt(width**2 + height**2) / 2)
        for r in range(max_r, 0, -3):
            ratio = r / max_r
            c = (int(color[0] * (1-ratio) * 0.3),
                 int(color[1] * (1-ratio) * 0.3),
                 int(color[2] * (1-ratio) * 0.3), 255)
            draw.ellipse([width//2-r, height//2-r, width//2+r, height//2+r], fill=c)

    elif bg_style == "lines":
        # Líneas diagonales con glow
        for i in range(-height, width + height, 40):
            alpha = random.randint(20, 80)
            w = random.randint(1, 3)
            draw.line([(i, 0), (i + height, height)],
                     fill=(color[0], color[1], color[2], alpha), width=w)
        img = img.filter(ImageFilter.GaussianBlur(radius=3))

    elif bg_style == "grid":
        # Grid futurista
        spacing = 60
        for x in range(0, width, spacing):
            draw.line([(x, 0), (x, height)], fill=(color[0]//4, color[1]//4, color[2]//4, 60), width=1)
        for y in range(0, height, spacing):
            draw.line([(0, y), (width, y)], fill=(color[0]//4, color[1]//4, color[2]//4, 60), width=1)
        # Puntos en intersecciones
        for x in range(0, width, spacing):
            for y in range(0, height, spacing):
                if random.random() > 0.7:
                    draw.ellipse([x-2, y-2, x+2, y+2], fill=(color[0], color[1], color[2], 100))
        img = img.filter(ImageFilter.GaussianBlur(radius=1))

    elif bg_style == "smoke":
        # Humo/niebla
        for _ in range(12):
            cx = random.randint(-100, width+100)
            cy = random.randint(-100, height+100)
            r = random.randint(150, 500)
            alpha = random.randint(10, 40)
            draw.ellipse([cx-r, cy-r, cx+r, cy+r],
                        fill=(color[0]//3, color[1]//3, color[2]//3, alpha))
        img = img.filter(ImageFilter.GaussianBlur(radius=60))

    return img



# ---------------------------------------------------------------------------
# EFECTOS DE TEXTO AVANZADOS — Con difuminación y profundidad
# ---------------------------------------------------------------------------
def _render_text_with_effects(img, text, position, font, style="neon", color=(200, 0, 255)):
    """Renderiza texto con efectos avanzados usando capas y blur."""
    width, height = img.size
    x, y = position

    if style == "neon":
        # Capa de glow difuminado (blur gaussiano)
        glow_layer = Image.new("RGBA", (width, height), (0, 0, 0, 0))
        glow_draw = ImageDraw.Draw(glow_layer)
        glow_draw.text((x, y), text, font=font, fill=(color[0], color[1], color[2], 200))
        glow_blurred = glow_layer.filter(ImageFilter.GaussianBlur(radius=12))
        img = Image.alpha_composite(img, glow_blurred)
        # Segunda capa menos difuminada
        glow2 = Image.new("RGBA", (width, height), (0, 0, 0, 0))
        glow2_draw = ImageDraw.Draw(glow2)
        glow2_draw.text((x, y), text, font=font, fill=(color[0], color[1], color[2], 255))
        glow2_blurred = glow2.filter(ImageFilter.GaussianBlur(radius=5))
        img = Image.alpha_composite(img, glow2_blurred)
        # Texto nítido core
        sharp = Image.new("RGBA", (width, height), (0, 0, 0, 0))
        sharp_draw = ImageDraw.Draw(sharp)
        sharp_draw.text((x, y), text, font=font, fill=(255, 255, 255, 255))
        img = Image.alpha_composite(img, sharp)

    elif style == "gold":
        # Sombra difuminada
        shadow = Image.new("RGBA", (width, height), (0, 0, 0, 0))
        shadow_draw = ImageDraw.Draw(shadow)
        shadow_draw.text((x+4, y+4), text, font=font, fill=(40, 30, 0, 180))
        shadow = shadow.filter(ImageFilter.GaussianBlur(radius=4))
        img = Image.alpha_composite(img, shadow)
        # Texto dorado con borde
        txt = Image.new("RGBA", (width, height), (0, 0, 0, 0))
        txt_draw = ImageDraw.Draw(txt)
        for dx in [-2, -1, 0, 1, 2]:
            for dy in [-2, -1, 0, 1, 2]:
                txt_draw.text((x+dx, y+dy), text, font=font, fill=(120, 80, 0, 255))
        txt_draw.text((x, y), text, font=font, fill=(255, 215, 0, 255))
        txt_draw.text((x, y-1), text, font=font, fill=(255, 245, 180, 120))
        img = Image.alpha_composite(img, txt)

    elif style == "chrome":
        shadow = Image.new("RGBA", (width, height), (0, 0, 0, 0))
        shadow_draw = ImageDraw.Draw(shadow)
        shadow_draw.text((x+3, y+3), text, font=font, fill=(0, 0, 0, 150))
        shadow = shadow.filter(ImageFilter.GaussianBlur(radius=5))
        img = Image.alpha_composite(img, shadow)
        txt = Image.new("RGBA", (width, height), (0, 0, 0, 0))
        txt_draw = ImageDraw.Draw(txt)
        for dx in [-1, 0, 1]:
            for dy in [-1, 0, 1]:
                txt_draw.text((x+dx, y+dy), text, font=font, fill=(80, 85, 95, 255))
        txt_draw.text((x, y), text, font=font, fill=(200, 210, 225, 255))
        txt_draw.text((x, y-1), text, font=font, fill=(240, 245, 255, 100))
        img = Image.alpha_composite(img, txt)

    elif style == "fire":
        # Glow naranja difuminado
        glow = Image.new("RGBA", (width, height), (0, 0, 0, 0))
        glow_draw = ImageDraw.Draw(glow)
        glow_draw.text((x, y), text, font=font, fill=(255, 80, 0, 200))
        glow = glow.filter(ImageFilter.GaussianBlur(radius=10))
        img = Image.alpha_composite(img, glow)
        txt = Image.new("RGBA", (width, height), (0, 0, 0, 0))
        txt_draw = ImageDraw.Draw(txt)
        txt_draw.text((x, y+2), text, font=font, fill=(255, 60, 0, 200))
        txt_draw.text((x, y), text, font=font, fill=(255, 180, 0, 255))
        txt_draw.text((x, y-1), text, font=font, fill=(255, 240, 100, 150))
        img = Image.alpha_composite(img, txt)

    elif style == "ice":
        glow = Image.new("RGBA", (width, height), (0, 0, 0, 0))
        glow_draw = ImageDraw.Draw(glow)
        glow_draw.text((x, y), text, font=font, fill=(0, 150, 255, 180))
        glow = glow.filter(ImageFilter.GaussianBlur(radius=10))
        img = Image.alpha_composite(img, glow)
        txt = Image.new("RGBA", (width, height), (0, 0, 0, 0))
        txt_draw = ImageDraw.Draw(txt)
        txt_draw.text((x, y), text, font=font, fill=(150, 220, 255, 255))
        txt_draw.text((x, y-1), text, font=font, fill=(220, 245, 255, 120))
        img = Image.alpha_composite(img, txt)

    elif style == "3d":
        # Sombra 3D con profundidad real
        for i in range(10, 0, -1):
            layer = Image.new("RGBA", (width, height), (0, 0, 0, 0))
            layer_draw = ImageDraw.Draw(layer)
            alpha = max(30, 180 - i * 15)
            layer_draw.text((x+i, y+i), text, font=font, fill=(0, 0, 0, alpha))
            img = Image.alpha_composite(img, layer)
        txt = Image.new("RGBA", (width, height), (0, 0, 0, 0))
        txt_draw = ImageDraw.Draw(txt)
        txt_draw.text((x, y), text, font=font, fill=(color[0], color[1], color[2], 255))
        img = Image.alpha_composite(img, txt)

    elif style == "retro":
        # Efecto chromatic aberration (retro/synthwave)
        r_layer = Image.new("RGBA", (width, height), (0, 0, 0, 0))
        ImageDraw.Draw(r_layer).text((x+3, y+3), text, font=font, fill=(0, 255, 255, 120))
        r_layer = r_layer.filter(ImageFilter.GaussianBlur(radius=2))
        img = Image.alpha_composite(img, r_layer)
        b_layer = Image.new("RGBA", (width, height), (0, 0, 0, 0))
        ImageDraw.Draw(b_layer).text((x-2, y-2), text, font=font, fill=(255, 0, 255, 120))
        b_layer = b_layer.filter(ImageFilter.GaussianBlur(radius=2))
        img = Image.alpha_composite(img, b_layer)
        txt = Image.new("RGBA", (width, height), (0, 0, 0, 0))
        ImageDraw.Draw(txt).text((x, y), text, font=font, fill=(255, 255, 255, 255))
        img = Image.alpha_composite(img, txt)

    elif style == "gradient":
        # Gradiente horizontal en el texto
        bbox = font.getbbox(text)
        tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
        mask = Image.new("L", (width, height), 0)
        ImageDraw.Draw(mask).text((x, y), text, font=font, fill=255)
        gradient = Image.new("RGBA", (width, height), (0, 0, 0, 0))
        for i in range(tw):
            ratio = i / max(tw, 1)
            r = int(color[0] * (1-ratio) + 0 * ratio)
            g = int(color[1] * (1-ratio) + 200 * ratio)
            b = int(color[2] * (1-ratio) + 255 * ratio)
            for j in range(height):
                if x + i < width and mask.getpixel((x + i, j)) > 0:
                    gradient.putpixel((x + i, j), (r, g, b, 255))
        img = Image.alpha_composite(img, gradient)

    else:  # minimal
        txt = Image.new("RGBA", (width, height), (0, 0, 0, 0))
        ImageDraw.Draw(txt).text((x, y), text, font=font, fill=(255, 255, 255, 255))
        img = Image.alpha_composite(img, txt)

    return img



# ---------------------------------------------------------------------------
# GEOMETRIAS
# ---------------------------------------------------------------------------
def _draw_geometry(draw, img_size, geometry="none", color=(200, 0, 255, 150)):
    """Dibuja geometria de fondo/marco."""
    w, h = img_size
    cx, cy = w // 2, h // 2
    r = min(w, h) // 3

    if geometry == "circle":
        draw.ellipse([cx-r, cy-r, cx+r, cy+r], outline=color, width=3)
    elif geometry == "double_circle":
        draw.ellipse([cx-r, cy-r, cx+r, cy+r], outline=color, width=3)
        draw.ellipse([cx-r-20, cy-r-20, cx+r+20, cy+r+20], outline=color[:3]+(80,), width=2)
    elif geometry == "hexagon":
        pts = [(cx + r*math.cos(math.radians(60*i-30)), cy + r*math.sin(math.radians(60*i-30))) for i in range(6)]
        draw.polygon(pts, outline=color, width=4)
    elif geometry == "diamond":
        draw.polygon([(cx, cy-r), (cx+r, cy), (cx, cy+r), (cx-r, cy)], outline=color, width=4)
    elif geometry == "triangle":
        draw.polygon([(cx, cy-r), (cx+r, cy+r), (cx-r, cy+r)], outline=color, width=4)
    elif geometry == "shield":
        pts = [(cx-r, cy-r), (cx+r, cy-r), (cx+r, cy+r//2), (cx, cy+r), (cx-r, cy+r//2)]
        draw.polygon(pts, outline=color, width=4)
    elif geometry == "pentagon":
        pts = [(cx + r*math.cos(math.radians(72*i-90)), cy + r*math.sin(math.radians(72*i-90))) for i in range(5)]
        draw.polygon(pts, outline=color, width=4)
    elif geometry == "octagon":
        pts = [(cx + r*math.cos(math.radians(45*i)), cy + r*math.sin(math.radians(45*i))) for i in range(8)]
        draw.polygon(pts, outline=color, width=4)
    elif geometry == "star":
        pts = []
        for i in range(10):
            angle = math.radians(36*i - 90)
            rv = r if i % 2 == 0 else r // 2
            pts.append((cx + rv*math.cos(angle), cy + rv*math.sin(angle)))
        draw.polygon(pts, outline=color, width=3)
    elif geometry == "square":
        draw.rectangle([cx-r, cy-r, cx+r, cy+r], outline=color, width=4)
    elif geometry == "rounded_square":
        draw.rounded_rectangle([cx-r, cy-r, cx+r, cy+r], radius=25, outline=color, width=4)



# ---------------------------------------------------------------------------
# DETECCION DE PARAMETROS
# ---------------------------------------------------------------------------
def detect_text_from_prompt(prompt):
    """Extrae el texto que el usuario quiere en el logo."""
    import re
    t = prompt.upper()
    patterns = [
        r'C\.?8\.?L\.?\s*(AGENCY|TV|RECORDS|MUSIC|STUDIO|GAMING|RADIO|BEATS|LIVE|PRO|MEDIA|FILMS|LABS|SHOP|STORE|NET|DIGITAL|SPORTS|FASHION|ART|SOUND|CREW|GANG|WORLD|NATION|EMPIRE|KINGDOM)',
        r'C\.?8\.?L\.?',
    ]
    for pattern in patterns:
        match = re.search(pattern, t)
        if match:
            return match.group(0).replace(".", "").strip()
    quoted = re.findall(r'"([^"]+)"', prompt)
    if quoted:
        return quoted[0].upper()
    return "C8L"


def detect_style_from_prompt(prompt):
    """Detecta el estilo de texto deseado."""
    t = prompt.lower()
    if any(kw in t for kw in ["neon", "glow", "brillo"]): return "neon"
    elif any(kw in t for kw in ["gold", "dorado", "oro"]): return "gold"
    elif any(kw in t for kw in ["chrome", "plata", "plateado"]): return "chrome"
    elif any(kw in t for kw in ["fuego", "fire", "llama"]): return "fire"
    elif any(kw in t for kw in ["hielo", "ice", "cristal", "frozen"]): return "ice"
    elif any(kw in t for kw in ["3d", "tridimensional", "relieve"]): return "3d"
    elif any(kw in t for kw in ["retro", "synthwave", "80s", "vaporwave"]): return "retro"
    elif any(kw in t for kw in ["minimal", "minimalista", "simple"]): return "minimal"
    elif any(kw in t for kw in ["gradient", "gradiente", "degradado"]): return "gradient"
    return "neon"


def detect_geometry_from_prompt(prompt):
    """Detecta la geometria deseada."""
    t = prompt.lower()
    if any(kw in t for kw in ["circulo", "circular"]): return "double_circle"
    elif any(kw in t for kw in ["hexagono", "hexagonal"]): return "hexagon"
    elif any(kw in t for kw in ["diamante", "diamond", "rombo"]): return "diamond"
    elif any(kw in t for kw in ["triangulo", "triangle"]): return "triangle"
    elif any(kw in t for kw in ["escudo", "shield", "insignia"]): return "shield"
    elif any(kw in t for kw in ["pentagono"]): return "pentagon"
    elif any(kw in t for kw in ["octagono", "octagon"]): return "octagon"
    elif any(kw in t for kw in ["estrella", "star"]): return "star"
    elif any(kw in t for kw in ["cuadrado", "square"]): return "rounded_square"
    elif any(kw in t for kw in ["poligono", "polygon", "geometr"]): return "hexagon"
    return "none"


def detect_font_style_from_prompt(prompt):
    """Detecta la tipografia deseada."""
    t = prompt.lower()
    if any(kw in t for kw in ["futurista", "futuristic", "cyber", "tech", "espacial"]): return "futurista"
    elif any(kw in t for kw in ["pixel", "pixelado", "8bit", "arcade"]): return "pixel"
    elif any(kw in t for kw in ["gaming", "gamer", "esport"]): return "gaming"
    elif any(kw in t for kw in ["elegante", "elegant", "lujo", "luxury", "premium"]): return "elegante"
    elif any(kw in t for kw in ["impacto", "impact", "heavy", "brutal"]): return "impacto"
    elif any(kw in t for kw in ["graffiti", "urban", "street", "spray"]): return "graffiti"
    elif any(kw in t for kw in ["militar", "army", "war", "tactical"]): return "militar"
    elif any(kw in t for kw in ["codigo", "code", "hacker", "matrix"]): return "mono"
    elif any(kw in t for kw in ["display", "decorativo", "fancy"]): return "display"
    elif any(kw in t for kw in ["condensada", "narrow", "slim"]): return "condensada"
    elif any(kw in t for kw in ["retro", "vintage", "80s"]): return "retro"
    elif any(kw in t for kw in ["bold", "gordo", "grueso"]): return "bold"
    return "futurista"


def detect_neon_color_from_prompt(prompt):
    """Detecta color."""
    t = prompt.lower()
    if any(kw in t for kw in ["rojo", "red"]): return (255, 30, 30)
    elif any(kw in t for kw in ["azul", "blue", "cyan"]): return (0, 200, 255)
    elif any(kw in t for kw in ["verde", "green"]): return (0, 255, 100)
    elif any(kw in t for kw in ["rosa", "pink", "magenta"]): return (255, 0, 200)
    elif any(kw in t for kw in ["dorado", "gold", "amarillo"]): return (255, 200, 0)
    elif any(kw in t for kw in ["blanco", "white"]): return (255, 255, 255)
    elif any(kw in t for kw in ["naranja", "orange"]): return (255, 140, 0)
    return (200, 0, 255)


def detect_bg_style_from_prompt(prompt):
    """Detecta estilo de fondo dinámico."""
    t = prompt.lower()
    if any(kw in t for kw in ["nebula", "espacio", "galaxia", "space"]): return "nebula"
    elif any(kw in t for kw in ["particulas", "particles", "flotante"]): return "particles"
    elif any(kw in t for kw in ["lineas", "lines", "rayas"]): return "lines"
    elif any(kw in t for kw in ["grid", "matrix", "cuadricula"]): return "grid"
    elif any(kw in t for kw in ["humo", "smoke", "niebla", "fog"]): return "smoke"
    # Aleatorio si no especifica
    return random.choice(["nebula", "particles", "smoke", "gradient_radial"])


def detect_dimensions_from_prompt(prompt):
    """Detecta dimensiones deseadas."""
    t = prompt.lower()
    if any(kw in t for kw in ["banner", "horizontal"]): return (1200, 400)
    elif any(kw in t for kw in ["vertical", "story"]): return (600, 1080)
    elif any(kw in t for kw in ["icono", "icon", "mini"]): return (512, 512)
    elif any(kw in t for kw in ["portada", "cover", "header"]): return (1500, 500)
    elif any(kw in t for kw in ["poster", "cartel"]): return (800, 1200)
    return (1024, 1024)



# ---------------------------------------------------------------------------
# GENERADORES PRINCIPALES
# ---------------------------------------------------------------------------
def generate_logo_overlay(background_bytes, prompt):
    """Toma imagen de fondo (IA) y superpone texto perfecto con efectos."""
    try:
        bg = Image.open(io.BytesIO(background_bytes)).convert("RGBA")
        width, height = bg.size

        text = detect_text_from_prompt(prompt)
        style = detect_style_from_prompt(prompt)
        geometry = detect_geometry_from_prompt(prompt)
        color = detect_neon_color_from_prompt(prompt)
        font_style = detect_font_style_from_prompt(prompt)

        # Geometria sobre el fondo
        if geometry != "none":
            geo_layer = Image.new("RGBA", (width, height), (0, 0, 0, 0))
            geo_draw = ImageDraw.Draw(geo_layer)
            _draw_geometry(geo_draw, (width, height), geometry, color + (150,))
            # Difuminar ligeramente la geometria
            geo_layer = geo_layer.filter(ImageFilter.GaussianBlur(radius=1))
            bg = Image.alpha_composite(bg, geo_layer)

        # Calcular fuente
        max_fs = min(width, height) // 4
        font_size = min(max_fs, int(width * 0.75 / max(len(text), 1) * 1.5))
        font_size = max(font_size, 40)
        font = _get_font(font_style, font_size)

        # Posicion centrada (un poco abajo)
        bbox = font.getbbox(text)
        tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
        x = (width - tw) // 2
        y = (height - th) // 2 + height // 8

        # Aplicar texto con efectos
        result = _render_text_with_effects(bg, text, (x, y), font, style, color)

        output = io.BytesIO()
        result.convert("RGB").save(output, format="PNG", quality=95)
        return output.getvalue()
    except Exception as e:
        logger.error(f"Logo overlay error: {e}", exc_info=True)
        return None


def generate_logo_standalone(prompt):
    """Genera logo completo con fondo dinámico + geometría + texto."""
    try:
        dimensions = detect_dimensions_from_prompt(prompt)
        width, height = dimensions

        text = detect_text_from_prompt(prompt)
        style = detect_style_from_prompt(prompt)
        geometry = detect_geometry_from_prompt(prompt)
        color = detect_neon_color_from_prompt(prompt)
        font_style = detect_font_style_from_prompt(prompt)
        bg_style = detect_bg_style_from_prompt(prompt)

        # Fondo dinámico (NO estático)
        img = _generate_dynamic_background(width, height, color, bg_style)

        # Geometria
        if geometry == "none":
            geometry = "double_circle"
        geo_layer = Image.new("RGBA", (width, height), (0, 0, 0, 0))
        geo_draw = ImageDraw.Draw(geo_layer)
        _draw_geometry(geo_draw, (width, height), geometry, color + (180,))
        geo_layer = geo_layer.filter(ImageFilter.GaussianBlur(radius=1))
        img = Image.alpha_composite(img, geo_layer)

        # Fuente
        max_fs = min(width, height) // 3
        font_size = min(max_fs, int(width * 0.7 / max(len(text), 1) * 1.5))
        font_size = max(font_size, 40)
        font = _get_font(font_style, font_size)

        # Posicion
        bbox = font.getbbox(text)
        tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
        x = (width - tw) // 2
        y = (height - th) // 2

        # Texto con efectos
        img = _render_text_with_effects(img, text, (x, y), font, style, color)

        output = io.BytesIO()
        img.convert("RGB").save(output, format="PNG", quality=95)
        return output.getvalue()
    except Exception as e:
        logger.error(f"Logo standalone error: {e}", exc_info=True)
        return None
