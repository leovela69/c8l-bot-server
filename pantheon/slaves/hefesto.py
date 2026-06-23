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
        if result and result.strip().startswith("<!") or (result and "<html" in result[:200].lower()):
            logger.info("Hefesto: generacion OK")
            return result

        # Si el resultado no empieza con HTML, puede ser que el modelo hablo en vez de generar
        if result and len(result) > 100:
            # Intentar extraer HTML de la respuesta
            if "<!DOCTYPE" in result or "<html" in result:
                idx = result.find("<!DOCTYPE")
                if idx == -1:
                    idx = result.find("<html")
                if idx > 0:
                    logger.info("Hefesto: extrayendo HTML de respuesta mixta")
                    return result[idx:]

        # Intento 2: retry con prompt mas enfatico
        logger.warning("Hefesto: primer intento fallo, reintentando...")
        time.sleep(1)
        retry_prompt = f"IMPORTANT: Output ONLY raw HTML code. No text, no explanations.\n\n{prompt}"
        result = call_openrouter(retry_prompt, HEFESTO_SYSTEM_PROMPT, agent_name="hefesto",
                                 temperature=0.5, max_tokens=max_tokens)
        if result:
            cleaned = self._clean_code(result)
            if cleaned and len(cleaned) > 50:
                return cleaned

        logger.error("Hefesto: todos los intentos fallaron")
        return None

    def create_landing(self, description, style="c8l"):
        """Genera landing page completa."""
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
            return {"type": "file", "content": self._clean_code(result).encode("utf-8"),
                    "filename": "c8l_landing.html", "caption": f"🖥️ Landing: {description[:60]}"}
        return {"type": "error", "content": "No pude generar la landing page. Intenta de nuevo en unos segundos."}

    def create_game(self, description):
        """Genera juego web HTML5."""
        if not description or description.strip() == "":
            description = "snake game retro con neon"

        prompt = f"""Create a complete HTML5 game:
Game: {description}

Requirements: single HTML file, Canvas or DOM-based, keyboard/mouse controls,
score system, game over + restart, dark neon theme.
Start with <!DOCTYPE html>"""

        result = self._generate_with_retry(prompt, max_tokens=8000)
        if result:
            return {"type": "file", "content": self._clean_code(result).encode("utf-8"),
                    "filename": f"c8l_game.html", "caption": f"🎮 Juego: {description[:60]}"}
        return {"type": "error", "content": "No pude generar el juego. Intenta de nuevo en unos segundos."}

    def create_component(self, description):
        """Genera componente UI aislado."""
        prompt = f"""Create a modern UI component: {description}
Complete HTML file with inline CSS. Dark theme + neon accents.
Start with <!DOCTYPE html>"""

        result = self._generate_with_retry(prompt, max_tokens=4000)
        if result:
            return {"type": "file", "content": self._clean_code(result).encode("utf-8"),
                    "filename": "c8l_component.html", "caption": f"🧩 Componente: {description[:60]}"}
        return {"type": "error", "content": "No pude generar el componente."}

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
