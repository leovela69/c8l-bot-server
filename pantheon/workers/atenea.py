# -*- coding: utf-8 -*-
"""
📚 ATENEA — Worker Lectora/Analista
Lee archivos, analiza codigo, resume, busca info.
"""

import os
import logging
from typing import Optional
from pantheon.mixture import mixture_ai

logger = logging.getLogger("c8l.atenea")

# Directorio base del proyecto
PROJECT_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


class Atenea:
    """Worker que lee y analiza."""

    def __init__(self):
        self.name = "Atenea"
        self.status = "active"

    def read_file(self, filepath: str) -> Optional[str]:
        """Lee un archivo del proyecto."""
        full_path = os.path.join(PROJECT_DIR, filepath)
        if not os.path.exists(full_path):
            return None
        try:
            with open(full_path, "r", encoding="utf-8", errors="ignore") as f:
                return f.read()
        except Exception as e:
            logger.error(f"Error reading {filepath}: {e}")
            return None

    def list_files(self, directory: str = ".") -> list:
        """Lista archivos en un directorio."""
        full_path = os.path.join(PROJECT_DIR, directory)
        if not os.path.isdir(full_path):
            return []
        files = []
        for item in os.listdir(full_path):
            item_path = os.path.join(full_path, item)
            if os.path.isfile(item_path):
                files.append(item)
            elif os.path.isdir(item_path) and not item.startswith('.'):
                files.append(item + "/")
        return sorted(files)

    def analyze_file(self, filepath: str) -> str:
        """Lee un archivo y lo analiza con IA."""
        content = self.read_file(filepath)
        if not content:
            return f"No pude leer {filepath}"

        # Truncar si es muy largo
        if len(content) > 4000:
            content = content[:4000] + "\n...[truncado]..."

        result = mixture_ai.simple(
            f"Analiza este archivo y dame un resumen de: que hace, funciones principales, y si tiene errores obvios.\n\nArchivo: {filepath}\n```\n{content}\n```",
            system="Eres un analista de codigo experto. Se breve y directo."
        )
        return result

    def find_error(self, error_msg: str) -> str:
        """Busca la causa de un error en el proyecto."""
        # Listar archivos Python del proyecto
        py_files = []
        for root, dirs, files in os.walk(PROJECT_DIR):
            dirs[:] = [d for d in dirs if d not in ['.git', 'node_modules', '__pycache__', 'out', '.next']]
            for f in files:
                if f.endswith('.py'):
                    rel = os.path.relpath(os.path.join(root, f), PROJECT_DIR)
                    py_files.append(rel)

        result = mixture_ai.simple(
            f"Tengo este error: {error_msg}\n\nArchivos Python del proyecto: {py_files[:30]}\n\nDime en que archivo probablemente esta el error y como arreglarlo.",
            system="Eres un debugger experto. Identifica la causa del error y sugiere solucion."
        )
        return result

    def get_project_map(self) -> str:
        """Genera un mapa del proyecto."""
        structure = []
        for root, dirs, files in os.walk(PROJECT_DIR):
            dirs[:] = [d for d in dirs if d not in ['.git', 'node_modules', '__pycache__', 'out', '.next', 'data']]
            level = root.replace(PROJECT_DIR, '').count(os.sep)
            if level > 2:
                continue
            indent = '  ' * level
            folder = os.path.basename(root)
            structure.append(f"{indent}{folder}/")
            for f in files[:10]:
                structure.append(f"{indent}  {f}")
            if len(files) > 10:
                structure.append(f"{indent}  ...+{len(files)-10} mas")

        return "\n".join(structure[:80])
