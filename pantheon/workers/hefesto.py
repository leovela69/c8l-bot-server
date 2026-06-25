# -*- coding: utf-8 -*-
"""
🔨 HEFESTO — Worker Creador/Escritor
Genera codigo, escribe archivos, crea contenido.
"""

import os
import logging
from typing import Optional
from pantheon.mixture import mixture_ai

logger = logging.getLogger("c8l.hefesto")

PROJECT_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


class Hefesto:
    """Worker que crea y escribe."""

    def __init__(self):
        self.name = "Hefesto"
        self.status = "active"

    def generate_code(self, instruction: str, file_content: str = "", language: str = "python") -> str:
        """Genera codigo usando Mixture of Agents."""
        return mixture_ai.code(instruction, file_content, language)

    def fix_code(self, filepath: str, error_msg: str) -> str:
        """Lee un archivo, entiende el error, genera el fix."""
        full_path = os.path.join(PROJECT_DIR, filepath)
        if not os.path.exists(full_path):
            return f"Archivo {filepath} no existe."

        with open(full_path, "r", encoding="utf-8", errors="ignore") as f:
            content = f.read()

        if len(content) > 5000:
            content = content[:5000] + "\n...[truncado]..."

        result = mixture_ai.full(
            f"Arregla este error en el archivo {filepath}:\nError: {error_msg}",
            context=f"Codigo actual:\n```\n{content}\n```",
            system="Eres un programador experto. Genera SOLO el codigo corregido completo del archivo. Sin explicaciones."
        )
        return result

    def write_file(self, filepath: str, content: str) -> bool:
        """Escribe contenido en un archivo (con seguridad)."""
        full_path = os.path.join(PROJECT_DIR, filepath)

        # Seguridad: no escribir fuera del proyecto
        if ".." in filepath or filepath.startswith("/"):
            logger.warning(f"Intento de escritura fuera del proyecto: {filepath}")
            return False

        # Crear directorio si no existe
        dir_path = os.path.dirname(full_path)
        if dir_path and not os.path.exists(dir_path):
            os.makedirs(dir_path, exist_ok=True)

        try:
            with open(full_path, "w", encoding="utf-8") as f:
                f.write(content)
            logger.info(f"Hefesto escribio: {filepath}")
            return True
        except Exception as e:
            logger.error(f"Error writing {filepath}: {e}")
            return False

    def create_module(self, name: str, description: str) -> str:
        """Crea un modulo Python completo."""
        code = mixture_ai.code(
            f"Crea un modulo Python llamado {name} que haga: {description}. Incluye docstring, imports, y funciones principales.",
            language="python"
        )
        return code

    def improve_code(self, filepath: str) -> str:
        """Lee un archivo y sugiere mejoras."""
        full_path = os.path.join(PROJECT_DIR, filepath)
        if not os.path.exists(full_path):
            return f"Archivo {filepath} no existe."

        with open(full_path, "r", encoding="utf-8", errors="ignore") as f:
            content = f.read()

        if len(content) > 4000:
            content = content[:4000]

        result = mixture_ai.simple(
            f"Analiza este codigo y sugiere 3 mejoras concretas (rendimiento, seguridad, legibilidad):\n```\n{content}\n```",
            system="Eres un code reviewer experto. Se breve y practico."
        )
        return result
