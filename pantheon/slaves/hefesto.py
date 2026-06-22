# -*- coding: utf-8 -*-
"""
🖥️ HEFESTO — Bot Esclavo 5 (Diseno / Frontend)
Genera codigo HTML/CSS/JS, landing pages y disenos UI.
"El Disenador de C8L"

Skills: popular-web-designs, claude-design, architecture-diagram, concept-diagrams
"""

import logging
from openrouter_client import call_openrouter

logger = logging.getLogger("c8l.hefesto")

HEFESTO_SYSTEM_PROMPT = """Eres HEFESTO, el Disenador de C8L Agency. Experto en frontend, UI/UX y diseno web.

Tu expertise:
- HTML5, CSS3, JavaScript moderno
- Diseno responsivo (mobile-first)
- 54 sistemas de diseno reales (Stripe, Linear, Vercel, Notion, etc.)
- Landing pages de alta conversion
- Animaciones CSS y efectos visuales
- Juegos web (HTML5 Canvas, CSS games)
- Prototipos interactivos

Estetica C8L Agency:
- Tema oscuro con acentos neon (magenta #FF00FF, cyan #00FFFF, dorado #FFD700)
- Tipografia: moderna, sans-serif, bold
- Gradientes sutiles
- Glass morphism + neon glow
- Animaciones suaves

REGLAS AL GENERAR CODIGO:
- SIEMPRE genera UN archivo HTML completo con CSS y JS inline
- El codigo debe funcionar al abrirlo en un navegador
- Responsive design (funciona en movil y desktop)
- NO expliques nada, solo genera el codigo
- Empieza con <!DOCTYPE html>
- Sin markdown, sin bloques de codigo ``` """


class Hefesto:
    """Bot Disenador — Frontend y UI."""

    def create_landing(self, description, style="c8l"):
        """Genera landing page completa."""
        prompt = f"""Genera una landing page profesional completa:
Descripcion: {description}
Estilo: {style}

Debe incluir:
- Hero section con titulo impactante
- Features/beneficios
- Call to action
- Footer
- Responsive design
- Animaciones CSS sutiles
- Tema oscuro con acentos neon (estilo C8L)

SOLO el codigo HTML completo, sin explicaciones."""

        result = call_openrouter(prompt, HEFESTO_SYSTEM_PROMPT, agent_name="hefesto", temperature=0.7, max_tokens=8000)
        if result:
            return {"type": "file", "content": self._clean_code(result).encode("utf-8"),
                    "filename": "c8l_landing.html", "caption": f"🖥️ Landing: {description[:60]}"}
        return {"type": "error", "content": "No pude generar la landing page."}

    def create_game(self, description):
        """Genera juego web HTML5."""
        prompt = f"""Genera un juego web completo en HTML5:
Juego: {description}

REQUISITOS:
- UN archivo HTML con CSS y JS inline
- Canvas o DOM-based
- Controles: teclado y/o mouse
- Score system
- Game over y restart
- Visualmente atractivo (tema neon/oscuro)
- Responsive

SOLO codigo, sin explicaciones."""

        result = call_openrouter(prompt, HEFESTO_SYSTEM_PROMPT, agent_name="hefesto", temperature=0.7, max_tokens=8000)
        if result:
            return {"type": "file", "content": self._clean_code(result).encode("utf-8"),
                    "filename": f"c8l_game.html", "caption": f"🎮 Juego: {description[:60]}"}
        return {"type": "error", "content": "No pude generar el juego."}

    def create_component(self, description):
        """Genera componente UI aislado."""
        prompt = f"""Genera un componente UI moderno: {description}

HTML completo con CSS inline. Estilo: dark theme + neon accents.
SOLO codigo."""

        result = call_openrouter(prompt, HEFESTO_SYSTEM_PROMPT, agent_name="hefesto", temperature=0.7, max_tokens=4000)
        if result:
            return {"type": "file", "content": self._clean_code(result).encode("utf-8"),
                    "filename": "c8l_component.html", "caption": f"🧩 Componente: {description[:60]}"}
        return {"type": "error", "content": "No pude generar el componente."}

    def _clean_code(self, text):
        """Limpia markdown."""
        if text.startswith("```"):
            lines = text.split("\n")
            lines = lines[1:]
            if lines and lines[-1].strip() == "```":
                lines = lines[:-1]
            return "\n".join(lines)
        return text
