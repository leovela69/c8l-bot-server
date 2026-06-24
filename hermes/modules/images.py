import requests, io, logging
from config import POLLINATIONS_API_KEY, POLLINATIONS_BASE_URL, HUGGINGFACE_TOKEN
logger = logging.getLogger("hermes.images")

STYLES = {"flux": "Realista HD", "seedream5": "Artistico", "gptimage": "Creativo", "zimage": "Rapido"}

def generate_image(prompt, style="flux"):
    try:
        url = POLLINATIONS_BASE_URL + "/image/" + requests.utils.quote(prompt)
        r = requests.get(url, params={"model": style, "width": 1024, "height": 1024, "key": POLLINATIONS_API_KEY, "nologo": "true"}, timeout=60)
        if r.status_code == 200 and len(r.content) > 1000:
            return io.BytesIO(r.content)
    except:
        pass
    try:
        r = requests.post("https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0", headers={"Authorization": "Bearer " + HUGGINGFACE_TOKEN}, json={"inputs": prompt}, timeout=60)
        if r.status_code == 200 and len(r.content) > 1000:
            return io.BytesIO(r.content)
    except:
        pass
    return None

def get_styles_text():
    lines = ["Estilos disponibles:\n"]
    for k, v in STYLES.items():
        lines.append(f"  {k} - {v}")
    lines.append("\nUsa: /imagen [estilo] [prompt]")
    return "\n".join(lines)
