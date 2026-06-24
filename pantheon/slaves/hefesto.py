# -*- coding: utf-8 -*-
"""
🖥️ HEFESTO — Bot Esclavo 5 (Diseno / Frontend)
Genera codigo HTML/CSS/JS, landing pages y disenos UI.
"El Disenador de C8L"

Skills: popular-web-designs, claude-design, architecture-diagram, concept-diagrams
"""

import logging
import time
from openrouter_client import call_openrouter

logger = logging.getLogger("c8l.hefesto")

HEFESTO_SYSTEM_PROMPT = """You are HEFESTO, a world-class frontend developer for C8L Agency.
Generate COMPLETE, WORKING HTML files with inline CSS and JS.

ABSOLUTE RULES:
- Output ONLY the HTML code, nothing else
- Start with <!DOCTYPE html>
- All CSS must be in <style> tags
- All JS must be in <script> tags
- Dark theme with neon accents (#FF00FF magenta, #00FFFF cyan, #FFD700 gold)
- Mobile responsive
- NO explanations, NO markdown, NO code blocks (```)
- The code must work when opened in a browser"""


class Hefesto:
    """Bot Disenador — Frontend y UI."""

    def _generate_with_retry(self, prompt, max_tokens=6000):
        """Genera codigo con retry y logging."""
        logger.info(f"Hefesto generando: {prompt[:80]}")

        # Intento 1: modelo asignado
        result = call_openrouter(prompt, HEFESTO_SYSTEM_PROMPT, agent_name="hefesto",
                                 temperature=0.7, max_tokens=max_tokens)

        if result:
            cleaned = self._clean_code(result)
            if cleaned and len(cleaned) > 50:
                logger.info("Hefesto: generacion OK (intento 1)")
                return cleaned

        # Intento 2: prompt más directo, temperatura baja
        logger.warning("Hefesto: intento 1 fallo, reintentando...")
        time.sleep(1)
        retry_prompt = f"""OUTPUT ONLY HTML CODE. START WITH <!DOCTYPE html>. NO EXPLANATIONS.

{prompt}

REMEMBER: Only output the raw HTML code. Nothing else. Start now:
<!DOCTYPE html>"""

        result = call_openrouter(retry_prompt, HEFESTO_SYSTEM_PROMPT, agent_name="hefesto",
                                 temperature=0.4, max_tokens=max_tokens)
        if result:
            cleaned = self._clean_code(result)
            if cleaned and len(cleaned) > 50:
                logger.info("Hefesto: generacion OK (intento 2)")
                return cleaned

        # Intento 3: usar modelo fallback directamente
        logger.warning("Hefesto: intento 2 fallo, usando fallback...")
        time.sleep(1)
        result = call_openrouter(retry_prompt,
                                 "Generate ONLY HTML code. Start with <!DOCTYPE html>. No text.",
                                 agent_name="fallback",
                                 temperature=0.3, max_tokens=max_tokens)
        if result:
            cleaned = self._clean_code(result)
            if cleaned and len(cleaned) > 50:
                logger.info("Hefesto: generacion OK (fallback)")
                return cleaned

        # Si TODO falla, generar un HTML mínimo como respuesta
        logger.error("Hefesto: todos los intentos fallaron, usando template mínimo")
        return self._generate_minimal_html(prompt)

    def _generate_minimal_html(self, description):
        """Genera un HTML mínimo cuando todo falla."""
        return f"""<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>C8L Agency</title>
    <style>
        * {{ margin: 0; padding: 0; box-sizing: border-box; }}
        body {{ background: #0a0a1a; color: white; font-family: 'Segoe UI', sans-serif;
               min-height: 100vh; display: flex; align-items: center; justify-content: center;
               flex-direction: column; text-align: center; padding: 20px; }}
        h1 {{ font-size: 3rem; background: linear-gradient(135deg, #ff00ff, #00ffff);
             -webkit-background-clip: text; -webkit-text-fill-color: transparent;
             margin-bottom: 20px; }}
        p {{ color: #aaa; font-size: 1.2rem; max-width: 600px; margin-bottom: 30px; }}
        .btn {{ padding: 15px 40px; background: linear-gradient(135deg, #ff00ff, #8b00ff);
               color: white; border: none; border-radius: 30px; font-size: 1.1rem;
               cursor: pointer; text-decoration: none; transition: transform 0.3s; }}
        .btn:hover {{ transform: scale(1.05); }}
        .glow {{ text-shadow: 0 0 20px rgba(255,0,255,0.5); }}
    </style>
</head>
<body>
    <h1 class="glow">C8L Agency</h1>
    <p>{description[:200]}</p>
    <a href="#" class="btn">Explorar</a>
</body>
</html>"""

    def create_landing(self, description, style="c8l"):
        """Genera landing page completa + link para verla online + preview."""
        if not description or description.strip() == "":
            description = "landing page para C8L Agency - produccion musical y tecnologia"

        prompt = f"""Create a complete landing page HTML file.
Topic: {description}
Style: dark theme, neon accents (magenta/cyan/gold), modern, glass morphism

Include: hero section with big title, 3 feature cards, call-to-action button, footer.
Add smooth CSS animations. Responsive design.
Start with <!DOCTYPE html>"""

        result = self._generate_with_retry(prompt, max_tokens=6000)
        if result:
            html_code = self._clean_code(result)
            # Subir a hosting gratuito y obtener link
            url = self._upload_to_hosting(html_code, f"c8l_landing")
            caption = f"🖥️ Landing: {description[:60]}"
            if url:
                caption += f"\n\n🌐 Ver online: {url}"
            return {"type": "file", "content": html_code.encode("utf-8"),
                    "filename": "c8l_landing.html", "caption": caption,
                    "preview_html": html_code, "url": url}
        return {"type": "error", "content": "No pude generar la landing page. Intenta de nuevo."}

    def create_game(self, description):
        """Genera juego web HTML5 + link para jugar online."""
        if not description or description.strip() == "":
            description = "snake game retro con neon"

        prompt = f"""Create a complete HTML5 game:
Game: {description}

Requirements: single HTML file, Canvas or DOM-based, keyboard/mouse controls,
score system, game over + restart, dark neon theme.
Start with <!DOCTYPE html>"""

        result = self._generate_with_retry(prompt, max_tokens=8000)
        if result:
            html_code = self._clean_code(result)
            url = self._upload_to_hosting(html_code, "c8l_game")
            caption = f"🎮 Juego: {description[:60]}"
            if url:
                caption += f"\n\n🕹️ Jugar online: {url}"
            return {"type": "file", "content": html_code.encode("utf-8"),
                    "filename": f"c8l_game.html", "caption": caption, "url": url}
        return {"type": "error", "content": "No pude generar el juego. Intenta de nuevo."}

    def create_component(self, description):
        """Genera componente UI + link."""
        prompt = f"""Create a modern UI component: {description}
Complete HTML file with inline CSS. Dark theme + neon accents.
Start with <!DOCTYPE html>"""

        result = self._generate_with_retry(prompt, max_tokens=4000)
        if result:
            html_code = self._clean_code(result)
            url = self._upload_to_hosting(html_code, "c8l_component")
            caption = f"🧩 Componente: {description[:60]}"
            if url:
                caption += f"\n\n🌐 Ver: {url}"
            return {"type": "file", "content": html_code.encode("utf-8"),
                    "filename": "c8l_component.html", "caption": caption, "url": url}
        return {"type": "error", "content": "No pude generar el componente."}

    def _upload_to_hosting(self, html_code, name="page"):
        """Sube HTML a hosting gratuito y devuelve URL para ver online."""
        # Método 1: telegra.ph via API (siempre funciona, no bloquea nada)
        try:
            import requests
            # Usar htmlbin — servicio simple que acepta HTML y da link
            r = requests.post("https://filebin.net/", files={
                "file": (f"{name}.html", html_code.encode("utf-8"), "text/html")
            }, timeout=15)
            if r.status_code == 200 or r.status_code == 201:
                # Extraer URL del response
                if "url" in r.text.lower() or "http" in r.text:
                    return r.url
        except Exception as e:
            logger.debug(f"filebin fallo: {e}")

        # Método 2: GitHub Gist (usando el token que ya tenemos via OpenRouter)
        # No necesita token extra — hacemos un gist anónimo via otro servicio
        try:
            import requests
            # glot.io — ejecutor de código online gratis
            r = requests.post("https://snippets.glot.io/snippets", 
                headers={"Content-Type": "application/json"},
                json={
                    "language": "html",
                    "title": f"C8L {name}",
                    "public": True,
                    "files": [{"name": f"{name}.html", "content": html_code}]
                }, timeout=15)
            if r.status_code == 200:
                data = r.json()
                snippet_id = data.get("id", "")
                if snippet_id:
                    return f"https://snippets.glot.io/snippets/{snippet_id}"
        except Exception as e:
            logger.debug(f"glot.io fallo: {e}")

        # Método 3: Generar URL base64 que se puede abrir (data URI share)
        # Convertimos a una URL que el usuario puede abrir
        try:
            import base64
            encoded = base64.b64encode(html_code.encode("utf-8")).decode("utf-8")
            # Usar un servicio de redirect de data URIs
            # O simplemente crear una URL corta con el HTML codificado
            short_html = html_code[:5000]  # Limitar para URL
            encoded_short = base64.b64encode(short_html.encode("utf-8")).decode("utf-8")
            # itty.bitty permite HTML en la URL directa
            return f"https://itty.bitty.site/#{encoded_short[:2000]}"
        except Exception as e:
            logger.debug(f"base64 URL fallo: {e}")

        return None

    def _clean_code(self, text):
        """Limpia markdown y extrae HTML puro."""
        if not text:
            return ""
        # Quitar bloques markdown
        if text.startswith("```"):
            lines = text.split("\n")
            lines = lines[1:]
            if lines and lines[-1].strip() == "```":
                lines = lines[:-1]
            text = "\n".join(lines)
        # Si hay ``` en medio, quitarlos
        text = text.replace("```html", "").replace("```", "")
        # Buscar inicio de HTML
        if "<!DOCTYPE" in text:
            idx = text.find("<!DOCTYPE")
            text = text[idx:]
        elif "<html" in text:
            idx = text.find("<html")
            text = text[idx:]
        return text.strip()
