# -*- coding: utf-8 -*-
"""
🔐 MASTER KEYS — Sistema de seguridad critico
===============================================
Solo Leo (ADMIN) puede:
- Matar el bot (kill switch)
- Cambiar configuracion critica
- Dar premium a streamers
- Acceder a comandos destructivos

Requiere MASTER_PASSWORD para operaciones criticas.
El password se configura en env vars de Render.

Autor: C8L Agency / Leo
"""

import os
import hashlib
import time
import logging
from typing import Optional, Dict

logger = logging.getLogger("c8l.security")


ADMIN_CHAT_ID = os.environ.get("ADMIN_CHAT_ID", "1970956749")
MASTER_PASSWORD_HASH = os.environ.get("MASTER_PASSWORD_HASH", "")
MASTER_PASSWORD_RAW = os.environ.get("MASTER_PASSWORD", "")


class MasterSecurity:
    """
    🔐 Seguridad maestra del bot.

    Funciones protegidas con doble verificacion:
    1. Ser admin (ADMIN_CHAT_ID)
    2. Proporcionar MASTER_PASSWORD

    Operaciones protegidas:
    - Kill switch (apagar bot)
    - Cambiar system prompt
    - Resetear economia
    - Eliminar datos de usuarios
    - Cambiar configuracion de APIs
    """

    def __init__(self):
        self._failed_attempts: Dict[str, list] = {}
        self._lockout_until: Dict[str, float] = {}
        self._action_log: list = []

    def is_admin(self, user_id: str) -> bool:
        """Verifica si es el admin."""
        return str(user_id) == ADMIN_CHAT_ID

    def verify_password(self, password: str, user_id: str) -> bool:
        """Verifica master password con proteccion anti-brute-force."""
        user_id = str(user_id)

        # Check lockout
        if user_id in self._lockout_until:
            if time.time() < self._lockout_until[user_id]:
                remaining = int(self._lockout_until[user_id] - time.time())
                logger.warning(f"🔒 User {user_id} locked out ({remaining}s)")
                return False
            else:
                del self._lockout_until[user_id]
                self._failed_attempts.pop(user_id, None)

        # Verify
        correct = False
        if MASTER_PASSWORD_HASH:
            pw_hash = hashlib.sha256(password.encode()).hexdigest()
            correct = pw_hash == MASTER_PASSWORD_HASH
        elif MASTER_PASSWORD_RAW:
            correct = password == MASTER_PASSWORD_RAW

        if correct:
            self._failed_attempts.pop(user_id, None)
            self._log_action(user_id, "password_verified", True)
            return True
        else:
            # Track failed attempts
            if user_id not in self._failed_attempts:
                self._failed_attempts[user_id] = []
            self._failed_attempts[user_id].append(time.time())

            # Lockout after 3 failed attempts (5 min)
            if len(self._failed_attempts[user_id]) >= 3:
                self._lockout_until[user_id] = time.time() + 300
                logger.error(f"🚨 LOCKOUT: {user_id} — 3 intentos fallidos")

            self._log_action(user_id, "password_failed", False)
            return False


    def authorize_critical(self, user_id: str, password: str) -> Dict:
        """
        Autoriza una operacion critica.
        Requiere: ser admin + password correcta.
        """
        if not self.is_admin(user_id):
            self._log_action(user_id, "unauthorized_attempt", False)
            return {
                "authorized": False,
                "reason": "No eres admin.",
            }

        if not self.verify_password(password, user_id):
            attempts = len(self._failed_attempts.get(str(user_id), []))
            locked = str(user_id) in self._lockout_until
            return {
                "authorized": False,
                "reason": (
                    "🔒 Bloqueado por 5 minutos (demasiados intentos)."
                    if locked else
                    f"❌ Password incorrecta ({attempts}/3 intentos)."
                ),
            }

        return {"authorized": True, "reason": "OK"}

    def _log_action(self, user_id: str, action: str, success: bool):
        """Registra accion en log de seguridad."""
        entry = {
            "user_id": user_id,
            "action": action,
            "success": success,
            "timestamp": time.time(),
        }
        self._action_log.append(entry)
        if len(self._action_log) > 100:
            self._action_log = self._action_log[-100:]

        if not success:
            logger.warning(f"🔐 Security: {action} by {user_id} — DENIED")

    def get_security_log(self, limit: int = 10) -> str:
        """Muestra log de seguridad."""
        if not self._action_log:
            return "🔐 Sin actividad de seguridad registrada."

        lines = ["🔐 *Log de Seguridad:*\n"]
        for entry in self._action_log[-limit:]:
            icon = "✅" if entry["success"] else "❌"
            ts = time.strftime("%H:%M:%S", time.localtime(entry["timestamp"]))
            lines.append(f"  {icon} `{ts}` {entry['action']} ({entry['user_id'][:6]})")
        return "\n".join(lines)


# ---------------------------------------------------------------------------
# Singleton
# ---------------------------------------------------------------------------
_security_instance: Optional[MasterSecurity] = None


def get_security() -> MasterSecurity:
    global _security_instance
    if _security_instance is None:
        _security_instance = MasterSecurity()
    return _security_instance
