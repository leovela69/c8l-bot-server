# -*- coding: utf-8 -*-
"""
⚔️ ARES — Worker Ejecutor
Ejecuta comandos del sistema (con seguridad), deploy, restart.
"""

import os
import subprocess
import logging
from typing import Tuple

logger = logging.getLogger("c8l.ares")

PROJECT_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Lista blanca de comandos permitidos
ALLOWED_COMMANDS = [
    "git pull",
    "git status",
    "git log",
    "git diff",
    "git add",
    "git commit",
    "pip install",
    "pip list",
    "python3 -c",
    "ls",
    "cat",
    "head",
    "tail",
    "wc",
    "grep",
    "find",
    "ps aux",
    "systemctl status",
    "npm install",
    "npm run build",
    "npx next build",
]

# Comandos PROHIBIDOS (nunca ejecutar)
BLOCKED_COMMANDS = [
    "rm -rf /",
    "rm -rf ~",
    "rm -rf .",
    "sudo",
    "chmod 777",
    "dd if=",
    "mkfs",
    "kill -9 1",
    "shutdown",
    "reboot",
    "passwd",
    "curl | bash",
    "wget | bash",
]


class Ares:
    """Worker que ejecuta comandos del sistema con seguridad."""

    def __init__(self):
        self.name = "Ares"
        self.status = "active"
        self.history = []

    def is_safe(self, command: str) -> Tuple[bool, str]:
        """Verifica si un comando es seguro de ejecutar."""
        cmd_lower = command.lower().strip()

        # Verificar prohibidos
        for blocked in BLOCKED_COMMANDS:
            if blocked in cmd_lower:
                return False, f"Comando prohibido: contiene '{blocked}'"

        # Verificar permitidos
        for allowed in ALLOWED_COMMANDS:
            if cmd_lower.startswith(allowed):
                return True, "OK"

        return False, f"Comando no en lista blanca. Permitidos: git, pip, ls, cat, grep, find, npm"

    def execute(self, command: str, timeout: int = 30) -> str:
        """Ejecuta un comando si es seguro."""
        safe, reason = self.is_safe(command)
        if not safe:
            logger.warning(f"Comando rechazado: {command} — {reason}")
            return f"❌ RECHAZADO: {reason}"

        try:
            result = subprocess.run(
                command,
                shell=True,
                capture_output=True,
                text=True,
                timeout=timeout,
                cwd=PROJECT_DIR
            )

            output = result.stdout[:2000] if result.stdout else ""
            error = result.stderr[:500] if result.stderr else ""

            self.history.append({
                "command": command,
                "exit_code": result.returncode,
                "success": result.returncode == 0
            })

            if result.returncode == 0:
                return output if output else "✅ Ejecutado sin output."
            else:
                return f"⚠️ Exit code {result.returncode}\n{error}\n{output}"

        except subprocess.TimeoutExpired:
            return f"⏰ Timeout ({timeout}s). Comando cancelado."
        except Exception as e:
            return f"❌ Error: {e}"

    def git_pull(self) -> str:
        """Hace git pull del proyecto."""
        return self.execute("git pull")

    def git_status(self) -> str:
        """Muestra git status."""
        return self.execute("git status")

    def restart_bot(self) -> str:
        """Reinicia el bot (mata proceso viejo, inicia nuevo)."""
        # Buscar proceso del bot
        ps_output = self.execute("ps aux | grep whatsapp_bot.py | grep -v grep")
        if "whatsapp_bot" in ps_output:
            # Hay un proceso corriendo — intentar restart suave
            return "⚠️ Bot corriendo. Usa el deploy manual para reiniciar de forma segura."
        return "Bot no detectado corriendo."

    def deploy(self) -> str:
        """Hace deploy: git pull + restart."""
        pull = self.git_pull()
        if "Already up to date" in pull or "Fast-forward" in pull:
            return f"✅ Deploy:\n{pull}"
        elif "error" in pull.lower() or "fatal" in pull.lower():
            return f"❌ Error en pull:\n{pull}"
        return f"Deploy resultado:\n{pull}"

    def get_history(self) -> str:
        """Retorna historial de comandos."""
        if not self.history:
            return "Sin historial."
        lines = []
        for h in self.history[-10:]:
            icon = "✅" if h["success"] else "❌"
            lines.append(f"{icon} {h['command']}")
        return "\n".join(lines)
