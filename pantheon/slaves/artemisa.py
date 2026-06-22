# -*- coding: utf-8 -*-
"""
⚙️ ARTEMISA — Bot Esclavo 6 (Backend / API)
Genera APIs, bases de datos y logica de backend.
"El Arquitecto de C8L"

Skills: inference-sh-cli, docker-management, github-pr-workflow
"""

import logging
from openrouter_client import call_openrouter

logger = logging.getLogger("c8l.artemisa")

ARTEMISA_SYSTEM_PROMPT = """Eres ARTEMISA, el Arquitecto de C8L Agency. Experto en backend, APIs y arquitectura de software.

Tu expertise:
- Python (Flask, FastAPI, Django)
- Node.js (Express, Fastify)
- APIs REST y GraphQL
- Bases de datos (PostgreSQL, MongoDB, Redis)
- Docker y contenedores
- Arquitectura de microservicios
- CI/CD y DevOps

Tu estilo:
- Codigo limpio y bien documentado
- Siempre incluyes manejo de errores
- Seguridad por defecto
- Escalable desde el inicio

REGLAS AL GENERAR CODIGO:
- Codigo completo y funcional
- Con comentarios explicativos
- Incluye requirements.txt o package.json si aplica
- Manejo de errores robusto
- Sin markdown wrapping, solo codigo"""



class Artemisa:
    """Bot Arquitecto — Backend y APIs."""

    def create_api(self, description, framework="fastapi"):
        """Genera API completa."""
        prompt = f"""Genera una API completa:
Descripcion: {description}
Framework: {framework}

Incluye:
- Estructura completa del proyecto
- Endpoints con CRUD
- Modelos de datos
- Manejo de errores
- Documentacion inline

SOLO codigo funcional."""

        result = call_openrouter(prompt, ARTEMISA_SYSTEM_PROMPT,
                                 agent_name="artemisa", temperature=0.5, max_tokens=6000)
        if result:
            code = self._clean_code(result)
            return {"type": "file", "content": code.encode("utf-8"),
                    "filename": "c8l_api.py", "caption": f"⚙️ API: {description[:60]}"}
        return {"type": "error", "content": "No pude generar la API."}

    def create_script(self, description):
        """Genera script de backend."""
        prompt = f"""Genera un script Python completo y funcional:
{description}

SOLO codigo, sin explicaciones."""

        result = call_openrouter(prompt, ARTEMISA_SYSTEM_PROMPT,
                                 agent_name="artemisa", temperature=0.5, max_tokens=4000)
        if result:
            code = self._clean_code(result)
            return {"type": "file", "content": code.encode("utf-8"),
                    "filename": "c8l_script.py", "caption": f"⚙️ Script: {description[:60]}"}
        return {"type": "error", "content": "No pude generar el script."}

    def explain_architecture(self, system_description):
        """Explica o sugiere arquitectura para un sistema."""
        prompt = f"""Sugiere arquitectura para: {system_description}

Incluye:
- Diagrama textual de componentes
- Tecnologias recomendadas
- Flujo de datos
- Escalabilidad
- Consideraciones de seguridad"""

        return call_openrouter(prompt, ARTEMISA_SYSTEM_PROMPT,
                               agent_name="artemisa", temperature=0.6)

    def _clean_code(self, text):
        if text.startswith("```"):
            lines = text.split("\n")
            lines = lines[1:]
            if lines and lines[-1].strip() == "```":
                lines = lines[:-1]
            return "\n".join(lines)
        return text
