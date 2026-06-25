# -*- coding: utf-8 -*-
"""
🛡️ SECURITY — Modulo de Seguridad del Panteon C8L
Protege el VPS de comandos peligrosos y accesos no autorizados.
"""

import os
import re
import logging
from typing import Tuple
from config import ADMIN_CHAT_ID

logger = logging.getLogger("c8l.security")

# Comandos PERMITIDOS (lista blanca)
ALLOWED_PREFIXES = [
    "git pull", "git status", "git log", "git diff", "git add", "git commit",
    "pip install", "pip list", "pip show",
    "python3 -c", "python3 -m",
    "ls", "cat", "head", "tail", "wc", "grep", "find",
    "ps aux", "ps -ef",
    "npm install", "npm run", "npx",
    "docker ps", "docker logs", "docker restart",
    "systemctl status",
    "df -h", "free -m", "uptime",
    "curl -s", "wget -q",
]

# Comandos PROHIBIDOS (lista negra absoluta)
BLOCKED_PATTERNS = [
    r"rm\s+-rf\s+/",
    r"rm\s+-rf\s+~",
    r"rm\s+-rf\s+\.",
    r"sudo\s+rm",
    r"chmod\s+777",
    r"dd\s+if=",
    r"mkfs",
    r"kill\s+-9\s+1\b",
    r"shutdown",
    r"reboot",
    r"passwd",
    r"curl.*\|\s*bash",
    r"wget.*\|\s*bash",
    r"eval\s*\(",
    r"exec\s*\(",
    r"__import__",
    r"os\.system",
    r"subprocess.*shell=True",
    r"\.\.\/\.\.\//",
    r"\/etc\/passwd",
    r"\/etc\/shadow",
]

# Archivos que NUNCA se pueden modificar
PROTECTED_FILES = [
    "/etc/passwd",
    "/etc/shadow",
    "/etc/sudoers",
    "/root/.ssh/",
    "/root/.bashrc",
]

# Directorios donde se puede escribir
ALLOWED_WRITE_DIRS = [
    "pantheon/",
    "hermes/",
    "data/",
    "modules/",
    "app/",
    "components/",
    "lib/",
]


def validate_command(command: str) -> Tuple[bool, str]:
    """
    Valida si un comando del sistema es seguro.
    Returns: (is_safe, reason)
    """
    cmd = command.strip().lower()

    # Check blocked patterns
    for pattern in BLOCKED_PATTERNS:
        if re.search(pattern, cmd, re.IGNORECASE):
            logger.warning(f"BLOCKED command: {command}")
            return False, f"Comando bloqueado por seguridad (patron: {pattern})"

    # Check allowed prefixes
    for prefix in ALLOWED_PREFIXES:
        if cmd.startswith(prefix.lower()):
            return True, "OK"

    return False, "Comando no autorizado. Solo se permiten: git, pip, ls, cat, grep, npm, docker status"


def validate_file_write(filepath: str) -> Tuple[bool, str]:
    """
    Valida si se puede escribir en un archivo.
    Returns: (is_safe, reason)
    """
    # No paths absolutos fuera del proyecto
    if filepath.startswith("/") and not filepath.startswith("/root/c8l-bot-server"):
        return False, "No se puede escribir fuera del proyecto"

    # No path traversal
    if ".." in filepath:
        return False, "Path traversal no permitido"

    # No archivos protegidos
    for protected in PROTECTED_FILES:
        if protected in filepath:
            return False, f"Archivo protegido: {protected}"

    # Verificar directorio permitido
    for allowed_dir in ALLOWED_WRITE_DIRS:
        if filepath.startswith(allowed_dir) or f"/{allowed_dir}" in filepath:
            return True, "OK"

    # Archivos en raiz del proyecto (config, bot principal)
    if "/" not in filepath or filepath.count("/") <= 1:
        return True, "OK"

    return False, "Directorio no autorizado para escritura"


def validate_admin(user_id: int) -> bool:
    """Verifica si el usuario es admin."""
    return str(user_id) == ADMIN_CHAT_ID


def sanitize_input(text: str) -> str:
    """Limpia texto de caracteres peligrosos para inyeccion."""
    # Remover backticks que podrian ejecutar comandos
    text = text.replace("`", "")
    # Remover pipes y redirects
    text = re.sub(r'[|><;$(){}]', '', text)
    return text


def rate_limit_check(user_id: int, action: str, limits: dict) -> Tuple[bool, str]:
    """
    Verifica rate limiting.
    limits = {"action_name": {"max": 10, "window": 60}}
    """
    import time
    key = f"{user_id}_{action}"

    if not hasattr(rate_limit_check, '_tracker'):
        rate_limit_check._tracker = {}

    tracker = rate_limit_check._tracker
    now = time.time()

    if key not in tracker:
        tracker[key] = []

    # Limpiar entradas viejas
    window = limits.get(action, {}).get("window", 60)
    tracker[key] = [t for t in tracker[key] if now - t < window]

    # Verificar limite
    max_allowed = limits.get(action, {}).get("max", 10)
    if len(tracker[key]) >= max_allowed:
        return False, f"Rate limit: max {max_allowed} por {window}s"

    tracker[key].append(now)
    return True, "OK"
