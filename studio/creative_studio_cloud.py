# creative_studio_cloud.py — ESTUDIO CREATIVO C8L (100% Cloud)
# Deploy: Hostinger VPS | Puerto: 8084
# APIs: Canva + Adobe + Kling AI + Stable Diffusion + FFmpeg
import os
import io
import json
import base64
import subprocess
import logging
from datetime import datetime

import requests
from PIL import Image, ImageDraw, ImageFont
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS

# === CONFIGURACIÓN ===
app = Flask(__name__)
CORS(app)
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Variables de entorno (configurar en Hostinger)
CANVA_API_KEY = os.getenv("CANVA_API_KEY", "")
ADOBE_API_KEY = os.getenv("ADOBE_API_KEY", "")
KLING_API_KEY = os.getenv("KLING_API_KEY", "")
STABILITY_API_KEY = os.getenv("STABILITY_API_KEY", "")
HF_API_KEY = os.getenv("HF_API_KEY", "")
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY", "")

# Directorio de salida en el servidor
OUTPUT_DIR = os.getenv("OUTPUT_DIR", "/home/ubuntu/outputs")
os.makedirs(OUTPUT_DIR, exist_ok=True)

# URL base del servidor (para devolver URLs completas)
BASE_URL = os.getenv("BASE_URL", "https://studio.c8l.com")



# ================================================================
# 1. DISEÑO — CANVA API (50 requests/mes gratis)
# ================================================================

@app.route("/api/canva/design", methods=["POST"])
def canva_design():
    """Crea un diseño usando Canva API."""
    try:
        data = request.json
        tipo = data.get("tipo", "poster")
        texto = data.get("texto", "C8L Studio")
        colores = data.get("colores", {})

        templates = {
            "poster": "poster_template_001",
            "instagram": "ig_post_template_001",
            "story": "ig_story_template_001",
            "youtube": "yt_thumbnail_template_001",
            "logo": "logo_template_001",
            "banner": "banner_template_001",
        }
        template_id = data.get("template_id") or templates.get(tipo, "generic")

        if CANVA_API_KEY:
            headers = {
                "Authorization": f"Bearer {CANVA_API_KEY}",
                "Content-Type": "application/json",
            }
            payload = {
                "template_id": template_id,
                "customizations": {"text": texto, "colors": colores},
                "format": "png",
            }
            resp = requests.post(
                "https://api.canva.com/rest/v1/designs",
                headers=headers, json=payload, timeout=30,
            )
            if resp.status_code in (200, 201):
                result = resp.json()
                return jsonify({
                    "success": True,
                    "source": "canva",
                    "design_id": result.get("id"),
                    "url": result.get("url"),
                })

        # Fallback: diseño local con PIL
        return jsonify(_diseno_local(tipo, texto, colores))

    except Exception as e:
        logger.error(f"Error Canva: {e}")
        return jsonify({"success": False, "error": str(e)}), 500



def _diseno_local(tipo, texto, colores):
    """Fallback: diseño con PIL cuando Canva no disponible."""
    sizes = {
        "poster": (1920, 1080), "instagram": (1080, 1080),
        "story": (1080, 1920), "youtube": (1280, 720),
        "logo": (500, 500), "banner": (1500, 500),
    }
    w, h = sizes.get(tipo, (1080, 1080))
    bg = colores.get("fondo", "#0a0a12")
    fg = colores.get("texto", "#7b2ffc")

    img = Image.new("RGB", (w, h), bg)
    draw = ImageDraw.Draw(img)
    try:
        font = ImageFont.truetype(
            "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 60
        )
    except Exception:
        font = ImageFont.load_default()

    bbox = draw.textbbox((0, 0), texto, font=font)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    draw.text(((w - tw) // 2, (h - th) // 2), texto, fill=fg, font=font)

    filename = f"design_{tipo}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.png"
    path = os.path.join(OUTPUT_DIR, filename)
    img.save(path)

    return {
        "success": True, "source": "local_fallback",
        "url": f"{BASE_URL}/outputs/{filename}",
    }


# ================================================================
# 2. EDICIÓN — ADOBE EXPRESS API (100 requests/mes gratis)
# ================================================================

@app.route("/api/adobe/edit", methods=["POST"])
def adobe_edit():
    """Edita imagen con Adobe Express API."""
    try:
        data = request.json
        imagen_url = data.get("imagen_url")
        operacion = data.get("operacion", "recortar")
        params = data.get("params", {})

        if not imagen_url:
            return jsonify({"success": False, "error": "imagen_url requerida"}), 400

        # Descargar imagen
        img_data = requests.get(imagen_url, timeout=15).content

        # Intentar Adobe API
        if ADOBE_API_KEY and operacion == "remove_bg":
            headers = {
                "Authorization": f"Bearer {ADOBE_API_KEY}",
                "x-api-key": ADOBE_API_KEY,
                "Content-Type": "application/json",
            }
            payload = {
                "input": {"href": imagen_url, "storage": "external"},
                "output": {"storage": "external", "type": "image/png"},
            }
            resp = requests.post(
                "https://image.adobe.io/v2/sensei/cutout",
                headers=headers, json=payload, timeout=60,
            )
            if resp.status_code in (200, 201, 202):
                result = resp.json()
                return jsonify({
                    "success": True, "source": "adobe",
                    "url": result.get("output", {}).get("href", ""),
                })

        # Procesamiento local con PIL
        return jsonify(_editar_local(img_data, operacion, params))

    except Exception as e:
        logger.error(f"Error Adobe edit: {e}")
        return jsonify({"success": False, "error": str(e)}), 500



def _editar_local(img_data, operacion, params):
    """Edición local con PIL (fallback ilimitado)."""
    img = Image.open(io.BytesIO(img_data))

    if operacion == "recortar":
        x, y = params.get("x", 0), params.get("y", 0)
        w = params.get("width", img.width)
        h = params.get("height", img.height)
        img = img.crop((x, y, x + w, y + h))

    elif operacion == "redimensionar":
        w = params.get("width", 1080)
        h = params.get("height", 1080)
        img = img.resize((w, h), Image.LANCZOS)

    elif operacion == "filtro":
        from PIL import ImageFilter
        filtros = {
            "blur": ImageFilter.BLUR,
            "sharpen": ImageFilter.SHARPEN,
            "contour": ImageFilter.CONTOUR,
            "emboss": ImageFilter.EMBOSS,
            "detail": ImageFilter.DETAIL,
        }
        f = params.get("filtro", "blur")
        img = img.filter(filtros.get(f, ImageFilter.BLUR))

    elif operacion == "texto":
        draw = ImageDraw.Draw(img)
        texto = params.get("texto", "C8L")
        x, y = params.get("x", 10), params.get("y", 10)
        color = params.get("color", "white")
        size = params.get("size", 30)
        try:
            font = ImageFont.truetype(
                "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", size
            )
        except Exception:
            font = ImageFont.load_default()
        draw.text((x, y), texto, fill=color, font=font)

    elif operacion == "rotate":
        angle = params.get("angle", 90)
        img = img.rotate(angle, expand=True)

    elif operacion == "flip":
        direction = params.get("direction", "horizontal")
        from PIL import ImageOps
        if direction == "horizontal":
            img = ImageOps.mirror(img)
        else:
            img = ImageOps.flip(img)

    filename = f"edit_{operacion}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.png"
    path = os.path.join(OUTPUT_DIR, filename)
    img.save(path)

    return {
        "success": True, "source": "local",
        "url": f"{BASE_URL}/outputs/{filename}",
        "operacion": operacion,
    }



# ================================================================
# 3. IMAGEN IA — Stability AI + Hugging Face (GRATIS)
# ================================================================

@app.route("/api/ai/image", methods=["POST"])
def generate_image():
    """Genera imagen con IA. Prioridad: Stability → HuggingFace → Placeholder."""
    try:
        data = request.json
        prompt = data.get("prompt", "Paisaje futurista C8L")
        style = data.get("style", "realistic")
        width = data.get("width", 1024)
        height = data.get("height", 1024)

        # Enriquecer prompt con estilo
        styles = {
            "realistic": "photorealistic, 8k, ultra detailed, professional",
            "anime": "anime style, detailed, vibrant, studio quality",
            "3d": "3D render, octane render, volumetric lighting",
            "cinematic": "cinematic, film grain, dramatic lighting, movie still",
            "pixel_art": "pixel art, 16-bit, retro game style",
            "painting": "oil painting, classical art, masterpiece",
            "neon": "neon lights, cyberpunk, glowing, futuristic",
            "logo": "professional logo, vector, clean, modern",
        }
        full_prompt = f"{prompt}, {styles.get(style, '')}"

        # 1) Intentar Stability AI
        if STABILITY_API_KEY:
            result = _imagen_stability(full_prompt, width, height)
            if result.get("success"):
                return jsonify(result)

        # 2) Intentar Hugging Face (gratis)
        if HF_API_KEY:
            result = _imagen_huggingface(full_prompt, width, height)
            if result.get("success"):
                return jsonify(result)

        # 3) Placeholder
        return jsonify(_imagen_placeholder(prompt))

    except Exception as e:
        logger.error(f"Error imagen IA: {e}")
        return jsonify({"success": False, "error": str(e)}), 500


def _imagen_stability(prompt, width, height):
    """Genera con Stability AI API."""
    headers = {
        "Authorization": f"Bearer {STABILITY_API_KEY}",
        "Content-Type": "application/json",
        "Accept": "application/json",
    }
    payload = {
        "text_prompts": [{"text": prompt, "weight": 1}],
        "cfg_scale": 7, "width": width, "height": height,
        "samples": 1, "steps": 30,
    }
    try:
        resp = requests.post(
            "https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image",
            headers=headers, json=payload, timeout=60,
        )
        if resp.status_code == 200:
            img_b64 = resp.json()["artifacts"][0]["base64"]
            img_bytes = base64.b64decode(img_b64)
            filename = f"ai_stab_{datetime.now().strftime('%Y%m%d_%H%M%S')}.png"
            path = os.path.join(OUTPUT_DIR, filename)
            with open(path, "wb") as f:
                f.write(img_bytes)
            return {
                "success": True, "source": "stability_ai",
                "url": f"{BASE_URL}/outputs/{filename}", "prompt": prompt,
            }
    except Exception as e:
        logger.warning(f"Stability error: {e}")
    return {"success": False}



def _imagen_huggingface(prompt, width, height):
    """Genera con HuggingFace Inference API (GRATIS ~200 req/hora)."""
    models = [
        "black-forest-labs/FLUX.1-schnell",
        "stabilityai/stable-diffusion-xl-base-1.0",
        "Lykon/dreamshaper-xl-v2-turbo",
    ]
    headers = {"Authorization": f"Bearer {HF_API_KEY}"}

    for model in models:
        try:
            payload = {"inputs": prompt, "parameters": {"width": width, "height": height}}
            resp = requests.post(
                f"https://api-inference.huggingface.co/models/{model}",
                headers=headers, json=payload, timeout=120,
            )
            if resp.status_code == 200:
                filename = f"ai_hf_{datetime.now().strftime('%Y%m%d_%H%M%S')}.png"
                path = os.path.join(OUTPUT_DIR, filename)
                with open(path, "wb") as f:
                    f.write(resp.content)
                return {
                    "success": True, "source": "huggingface", "model": model,
                    "url": f"{BASE_URL}/outputs/{filename}", "prompt": prompt,
                }
            elif resp.status_code == 503:
                continue  # Modelo cargando, siguiente
        except Exception:
            continue
    return {"success": False, "error": "Ningún modelo HF disponible"}


def _imagen_placeholder(prompt):
    """Placeholder visual cuando no hay API disponible."""
    img = Image.new("RGB", (800, 600), "#1a1a2e")
    draw = ImageDraw.Draw(img)
    try:
        font = ImageFont.truetype(
            "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 20
        )
    except Exception:
        font = ImageFont.load_default()

    lines = [prompt[i:i + 40] for i in range(0, len(prompt), 40)]
    y = 100
    for line in lines[:5]:
        draw.text((50, y), line, fill="#7b2ffc", font=font)
        y += 30
    draw.text((50, y + 30), "⚠ Configura HF_API_KEY para IA real", fill="#ff2e7d", font=font)

    filename = f"placeholder_{datetime.now().strftime('%Y%m%d_%H%M%S')}.png"
    path = os.path.join(OUTPUT_DIR, filename)
    img.save(path)
    return {
        "success": True, "source": "placeholder",
        "url": f"{BASE_URL}/outputs/{filename}", "prompt": prompt,
    }



# ================================================================
# 4. VIDEO IA — Kling AI + FFmpeg
# ================================================================

@app.route("/api/ai/video", methods=["POST"])
def generate_video():
    """Genera video con IA. Prioridad: Kling AI → HuggingFace → FFmpeg."""
    try:
        data = request.json
        prompt = data.get("prompt", "Escena épica C8L")
        duration = data.get("duration", 5)
        style = data.get("style", "cinematic")

        # 1) Intentar Kling AI (5 videos/día gratis)
        if KLING_API_KEY:
            result = _video_kling(prompt, duration, style)
            if result.get("success"):
                return jsonify(result)

        # 2) Intentar HuggingFace text-to-video
        if HF_API_KEY:
            result = _video_huggingface(prompt)
            if result.get("success"):
                return jsonify(result)

        # 3) Fallback: FFmpeg con imagen generada
        return jsonify(_video_ffmpeg(prompt, duration))

    except Exception as e:
        logger.error(f"Error video IA: {e}")
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/api/ai/video/status", methods=["POST"])
def video_status():
    """Consulta estado de un video de Kling AI (es async)."""
    data = request.json
    task_id = data.get("task_id")
    if not task_id or not KLING_API_KEY:
        return jsonify({"success": False, "error": "task_id y KLING_API_KEY requeridos"})

    headers = {"Authorization": f"Bearer {KLING_API_KEY}"}
    try:
        resp = requests.get(
            f"https://api.klingai.com/v1/videos/{task_id}",
            headers=headers, timeout=30,
        )
        if resp.status_code == 200:
            d = resp.json().get("data", {})
            return jsonify({
                "success": True, "status": d.get("status"),
                "url": d.get("video_url", ""), "progress": d.get("progress", 0),
            })
    except Exception as e:
        return jsonify({"success": False, "error": str(e)})
    return jsonify({"success": False})


def _video_kling(prompt, duration, style):
    """Genera video con Kling AI API."""
    headers = {
        "Authorization": f"Bearer {KLING_API_KEY}",
        "Content-Type": "application/json",
    }
    payload = {
        "prompt": prompt, "duration": str(duration),
        "aspect_ratio": "9:16", "model": "kling-v1",
    }
    try:
        resp = requests.post(
            "https://api.klingai.com/v1/videos/text2video",
            headers=headers, json=payload, timeout=120,
        )
        if resp.status_code in (200, 201):
            data = resp.json()
            task_id = data.get("data", {}).get("task_id", "")
            return {
                "success": True, "source": "kling_ai",
                "task_id": task_id, "status": "processing",
                "message": "Video generándose. Usa /api/ai/video/status para consultar.",
            }
    except Exception as e:
        logger.warning(f"Kling error: {e}")
    return {"success": False}



def _video_huggingface(prompt):
    """Genera video con HuggingFace text-to-video."""
    headers = {"Authorization": f"Bearer {HF_API_KEY}"}
    models = [
        "ali-vilab/text-to-video-ms-1.7b",
        "ByteDance/AnimateDiff-Lightning",
    ]
    for model in models:
        try:
            payload = {"inputs": prompt}
            resp = requests.post(
                f"https://api-inference.huggingface.co/models/{model}",
                headers=headers, json=payload, timeout=180,
            )
            if resp.status_code == 200:
                filename = f"video_hf_{datetime.now().strftime('%Y%m%d_%H%M%S')}.mp4"
                path = os.path.join(OUTPUT_DIR, filename)
                with open(path, "wb") as f:
                    f.write(resp.content)
                return {
                    "success": True, "source": "huggingface", "model": model,
                    "url": f"{BASE_URL}/outputs/{filename}",
                }
        except Exception:
            continue
    return {"success": False}


def _video_ffmpeg(prompt, duration):
    """Genera video placeholder con FFmpeg (imagen + ken burns)."""
    # Generar imagen base
    img_result = _imagen_placeholder(prompt)
    img_path = os.path.join(
        OUTPUT_DIR, os.path.basename(img_result["url"].split("/")[-1])
    )

    filename = f"video_{datetime.now().strftime('%Y%m%d_%H%M%S')}.mp4"
    path = os.path.join(OUTPUT_DIR, filename)

    # Ken Burns effect (zoom lento)
    cmd = [
        "ffmpeg", "-y", "-loop", "1", "-i", img_path,
        "-vf", f"scale=1920:1080,zoompan=z='min(zoom+0.001,1.3)':d={duration*25}:s=1280x720",
        "-c:v", "libx264", "-t", str(duration),
        "-pix_fmt", "yuv420p", path,
    ]
    try:
        subprocess.run(cmd, check=True, capture_output=True, timeout=60)
        return {
            "success": True, "source": "ffmpeg",
            "url": f"{BASE_URL}/outputs/{filename}",
        }
    except Exception as e:
        logger.error(f"FFmpeg error: {e}")
        return {"success": False, "error": str(e)}



# ================================================================
# 5. AUTOMATIZACIÓN — Google Flow / n8n style
# ================================================================

@app.route("/api/flow/contenido", methods=["POST"])
def flow_contenido():
    """Flujo automatizado: genera imagen + texto para contenido."""
    try:
        data = request.json
        prompt = data.get("prompt", "")
        plataforma = data.get("plataforma", "instagram")

        # Generar imagen
        with app.test_request_context(json={"prompt": prompt, "style": "cinematic"}):
            img_resp = generate_image()
            img_data = img_resp.get_json()

        # Generar texto descriptivo (placeholder, integrar con Gemini/DeepSeek)
        texto = f"🎨 {prompt}\n\n#C8L #AI #Creative"

        return jsonify({
            "success": True, "source": "flow",
            "imagen": img_data, "texto": texto,
            "plataforma": plataforma,
            "timestamp": datetime.now().isoformat(),
        })
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/api/flow/batch", methods=["POST"])
def flow_batch():
    """Genera contenido en batch (múltiples imágenes/diseños)."""
    try:
        data = request.json
        prompts = data.get("prompts", [])
        style = data.get("style", "realistic")
        results = []

        for prompt in prompts[:10]:  # Máximo 10 por batch
            with app.test_request_context(json={"prompt": prompt, "style": style}):
                resp = generate_image()
                results.append(resp.get_json())

        return jsonify({
            "success": True, "count": len(results),
            "results": results,
        })
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


# ================================================================
# 6. EXPORTACIÓN — FFmpeg
# ================================================================

@app.route("/api/export", methods=["POST"])
def export_file():
    """Exporta archivo a diferentes formatos."""
    try:
        data = request.json
        archivo = data.get("archivo")
        formato = data.get("formato", "png")

        if not archivo:
            return jsonify({"success": False, "error": "archivo requerido"}), 400

        input_path = os.path.join(OUTPUT_DIR, os.path.basename(archivo))
        if not os.path.exists(input_path):
            return jsonify({"success": False, "error": "Archivo no encontrado"}), 404

        filename = f"export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.{formato}"
        output_path = os.path.join(OUTPUT_DIR, filename)

        if formato in ("png", "jpg", "jpeg"):
            cmd = ["ffmpeg", "-y", "-i", input_path, output_path]
        elif formato == "gif":
            cmd = ["ffmpeg", "-y", "-i", input_path, "-vf", "fps=10,scale=480:-1", output_path]
        elif formato == "mp4":
            cmd = ["ffmpeg", "-y", "-i", input_path, "-c:v", "libx264", "-crf", "23", output_path]
        elif formato == "webp":
            cmd = ["ffmpeg", "-y", "-i", input_path, "-quality", "80", output_path]
        else:
            return jsonify({"success": False, "error": f"Formato {formato} no soportado"})

        subprocess.run(cmd, check=True, capture_output=True, timeout=60)

        return jsonify({
            "success": True,
            "url": f"{BASE_URL}/outputs/{filename}",
            "formato": formato,
        })
    except Exception as e:
        logger.error(f"Error export: {e}")
        return jsonify({"success": False, "error": str(e)}), 500



# ================================================================
# 7. SERVIDOR DE ARCHIVOS + ESTADO
# ================================================================

@app.route("/outputs/<path:filename>")
def serve_file(filename):
    """Sirve archivos generados."""
    path = os.path.join(OUTPUT_DIR, filename)
    if os.path.exists(path):
        return send_file(path)
    return jsonify({"error": "Archivo no encontrado"}), 404


@app.route("/api/status", methods=["GET"])
def status():
    """Estado del Estudio Creativo."""
    output_files = os.listdir(OUTPUT_DIR) if os.path.exists(OUTPUT_DIR) else []
    return jsonify({
        "status": "online",
        "version": "1.0.0",
        "server": "C8L Creative Studio Cloud",
        "tools": {
            "canva": bool(CANVA_API_KEY),
            "adobe": bool(ADOBE_API_KEY),
            "kling_ai": bool(KLING_API_KEY),
            "stability_ai": bool(STABILITY_API_KEY),
            "huggingface": bool(HF_API_KEY),
            "ffmpeg": True,  # Siempre disponible
        },
        "outputs_count": len(output_files),
        "timestamp": datetime.now().isoformat(),
    })


@app.route("/api/cleanup", methods=["POST"])
def cleanup():
    """Limpia archivos antiguos (más de 24h)."""
    import time
    count = 0
    now = time.time()
    for f in os.listdir(OUTPUT_DIR):
        path = os.path.join(OUTPUT_DIR, f)
        if os.path.isfile(path) and (now - os.path.getmtime(path)) > 86400:
            os.remove(path)
            count += 1
    return jsonify({"success": True, "deleted": count})


# ================================================================
# 8. INICIO DEL SERVIDOR
# ================================================================

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8084))
    logger.info(f"🎨 C8L Creative Studio arrancando en puerto {port}")
    logger.info(f"📁 Output dir: {OUTPUT_DIR}")
    logger.info(f"🔑 APIs activas: Canva={bool(CANVA_API_KEY)}, "
                f"Adobe={bool(ADOBE_API_KEY)}, Kling={bool(KLING_API_KEY)}, "
                f"Stability={bool(STABILITY_API_KEY)}, HF={bool(HF_API_KEY)}")
    app.run(host="0.0.0.0", port=port, debug=False)
