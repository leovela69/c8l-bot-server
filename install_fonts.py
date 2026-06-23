# -*- coding: utf-8 -*-
"""
Descarga fuentes de Google Fonts al iniciar (una vez).
Se ejecuta en el Dockerfile o al arrancar el bot.
"""
import os
import requests
import logging

logger = logging.getLogger("c8l.fonts")

FONTS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "fonts")
os.makedirs(FONTS_DIR, exist_ok=True)

# Google Fonts CDN — URLs directas de fuentes TTF
# Organizadas por categoria/estilo
FONTS_TO_DOWNLOAD = {
    # --- FUTURISTA / TECH ---
    "Orbitron-Bold": "https://github.com/google/fonts/raw/main/ofl/orbitron/static/Orbitron-Bold.ttf",
    "Orbitron-Black": "https://github.com/google/fonts/raw/main/ofl/orbitron/static/Orbitron-Black.ttf",
    "Exo2-Bold": "https://github.com/google/fonts/raw/main/ofl/exo2/static/Exo2-Bold.ttf",
    "Exo2-Black": "https://github.com/google/fonts/raw/main/ofl/exo2/static/Exo2-Black.ttf",
    "Rajdhani-Bold": "https://github.com/nicholasdunbar/Rajdhani/raw/master/fonts/ttf/Rajdhani-Bold.ttf",
    "Audiowide-Regular": "https://github.com/google/fonts/raw/main/ofl/audiowide/Audiowide-Regular.ttf",
    "TechnoRace": "https://github.com/google/fonts/raw/main/ofl/sharptechno/SharpTechno-Regular.ttf",

    # --- BOLD / IMPACTO ---
    "BebasNeue-Regular": "https://github.com/google/fonts/raw/main/ofl/bebasneue/BebasNeue-Regular.ttf",
    "Anton-Regular": "https://github.com/google/fonts/raw/main/ofl/anton/Anton-Regular.ttf",
    "BlackOpsOne-Regular": "https://github.com/google/fonts/raw/main/ofl/blackopsone/BlackOpsOne-Regular.ttf",
    "Bungee-Regular": "https://github.com/google/fonts/raw/main/ofl/bungee/Bungee-Regular.ttf",
    "Teko-Bold": "https://github.com/google/fonts/raw/main/ofl/teko/static/Teko-Bold.ttf",

    # --- ELEGANTE / MODERNO ---
    "Montserrat-Bold": "https://github.com/google/fonts/raw/main/ofl/montserrat/static/Montserrat-Bold.ttf",
    "Montserrat-Black": "https://github.com/google/fonts/raw/main/ofl/montserrat/static/Montserrat-Black.ttf",
    "Poppins-Bold": "https://github.com/google/fonts/raw/main/ofl/poppins/Poppins-Bold.ttf",
    "Poppins-Black": "https://github.com/google/fonts/raw/main/ofl/poppins/Poppins-Black.ttf",
    "Oswald-Bold": "https://github.com/google/fonts/raw/main/ofl/oswald/static/Oswald-Bold.ttf",
    "Raleway-Black": "https://github.com/google/fonts/raw/main/ofl/raleway/static/Raleway-Black.ttf",

    # --- GAMING / ARCADE ---
    "PressStart2P-Regular": "https://github.com/google/fonts/raw/main/ofl/pressstart2p/PressStart2P-Regular.ttf",
    "VT323-Regular": "https://github.com/google/fonts/raw/main/ofl/vt323/VT323-Regular.ttf",
    "Silkscreen-Bold": "https://github.com/google/fonts/raw/main/ofl/silkscreen/Silkscreen-Bold.ttf",

    # --- DISPLAY / DECORATIVO ---
    "Righteous-Regular": "https://github.com/google/fonts/raw/main/ofl/righteous/Righteous-Regular.ttf",
    "RussoOne-Regular": "https://github.com/google/fonts/raw/main/ofl/russoone/RussoOne-Regular.ttf",
    "Staatliches-Regular": "https://github.com/google/fonts/raw/main/ofl/staatliches/Staatliches-Regular.ttf",
    "Bungee-Shade": "https://github.com/google/fonts/raw/main/ofl/bungeeshade/BungeeShade-Regular.ttf",
    "Bangers-Regular": "https://github.com/google/fonts/raw/main/ofl/bangers/Bangers-Regular.ttf",

    # --- CONDENSADA / NARROW ---
    "OswaldBold": "https://github.com/google/fonts/raw/main/ofl/oswald/static/Oswald-Bold.ttf",
    "Barlow-Black": "https://github.com/google/fonts/raw/main/ofl/barlowcondensed/static/BarlowCondensed-Black.ttf",

    # --- HANDWRITING / SCRIPT ---
    "PermanentMarker-Regular": "https://github.com/google/fonts/raw/main/apache/permanentmarker/PermanentMarker-Regular.ttf",
    "RockSalt-Regular": "https://github.com/google/fonts/raw/main/apache/rocksalt/RockSalt-Regular.ttf",

    # --- MONO / CODIGO ---
    "FiraCode-Bold": "https://github.com/google/fonts/raw/main/ofl/firacode/static/FiraCode-Bold.ttf",
    "JetBrainsMono-Bold": "https://github.com/google/fonts/raw/main/ofl/jetbrainsmono/static/JetBrainsMono-Bold.ttf",
}


def download_fonts():
    """Descarga todas las fuentes que falten."""
    downloaded = 0
    failed = 0

    for name, url in FONTS_TO_DOWNLOAD.items():
        filepath = os.path.join(FONTS_DIR, f"{name}.ttf")
        if os.path.exists(filepath):
            continue

        try:
            r = requests.get(url, timeout=30)
            if r.status_code == 200 and len(r.content) > 1000:
                with open(filepath, "wb") as f:
                    f.write(r.content)
                downloaded += 1
            else:
                failed += 1
        except Exception as e:
            failed += 1
            logger.debug(f"Font {name} fallo: {e}")

    if downloaded > 0:
        logger.info(f"Fuentes descargadas: {downloaded} nuevas, {failed} fallidas")
    return downloaded


def get_available_fonts():
    """Lista todas las fuentes disponibles."""
    fonts = []
    # Fuentes descargadas
    if os.path.exists(FONTS_DIR):
        for f in os.listdir(FONTS_DIR):
            if f.endswith(".ttf"):
                fonts.append(os.path.join(FONTS_DIR, f))
    # Fuentes del sistema
    system_paths = [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
    ]
    for p in system_paths:
        if os.path.exists(p):
            fonts.append(p)
    return fonts


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    download_fonts()
    print(f"Fuentes disponibles: {len(get_available_fonts())}")
