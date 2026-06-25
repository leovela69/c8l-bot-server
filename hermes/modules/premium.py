# -*- coding: utf-8 -*-
"""
👑 HERMES — Sistema Premium
Gestiona enlaces de invitacion, verificacion de usuarios premium,
y niveles de acceso (gratis/VIP/premium/admin).
"""

import json
import os
import time
import secrets
import logging
from config import DATA_DIR, ADMIN_CHAT_ID

logger = logging.getLogger("hermes.premium")

PREMIUM_FILE = os.path.join(DATA_DIR, "premium.json")
CODES_FILE = os.path.join(DATA_DIR, "invite_codes.json")


class PremiumManager:
    """Gestiona el sistema premium de C8L."""

    def __init__(self):
        self.users = self._load(PREMIUM_FILE, {})
        self.codes = self._load(CODES_FILE, {})

    def _load(self, filepath, default):
        try:
            if os.path.exists(filepath):
                with open(filepath, "r") as f:
                    return json.load(f)
        except:
            pass
        return default

    def _save_users(self):
        with open(PREMIUM_FILE, "w") as f:
            json.dump(self.users, f, indent=2)

    def _save_codes(self):
        with open(CODES_FILE, "w") as f:
            json.dump(self.codes, f, indent=2)

    # === CODIGOS DE INVITACION ===

    def generate_code(self, created_by="admin", max_uses=1, days_valid=30):
        """Genera un codigo de invitacion premium."""
        code = "C8L-" + secrets.token_hex(4).upper()
        self.codes[code] = {
            "created_by": created_by,
            "created_at": time.time(),
            "expires_at": time.time() + (days_valid * 86400),
            "max_uses": max_uses,
            "uses": 0,
            "users": [],
            "active": True
        }
        self._save_codes()
        logger.info(f"Codigo premium creado: {code} (max_uses={max_uses}, days={days_valid})")
        return code

    def verify_code(self, code):
        """Verifica si un codigo es valido."""
        if code not in self.codes:
            return False
        info = self.codes[code]
        if not info["active"]:
            return False
        if info["uses"] >= info["max_uses"]:
            return False
        if time.time() > info["expires_at"]:
            info["active"] = False
            self._save_codes()
            return False
        return True

    def activate_user(self, user_id, code):
        """Activa premium para un usuario con un codigo."""
        uid = str(user_id)
        if code not in self.codes:
            return False

        info = self.codes[code]
        info["uses"] += 1
        info["users"].append(uid)
        if info["uses"] >= info["max_uses"]:
            info["active"] = False
        self._save_codes()

        # Registrar usuario como premium
        self.users[uid] = {
            "level": "premium",
            "activated_at": time.time(),
            "expires_at": info["expires_at"],
            "code_used": code,
            "active": True
        }
        self._save_users()
        logger.info(f"Usuario {uid} activado como premium con codigo {code}")
        return True

    # === VERIFICACION DE USUARIOS ===

    def is_premium(self, user_id):
        """Verifica si un usuario es premium."""
        uid = str(user_id)
        # Admin siempre es premium
        if uid == ADMIN_CHAT_ID:
            return True
        if uid not in self.users:
            return False
        info = self.users[uid]
        if not info["active"]:
            return False
        if time.time() > info["expires_at"]:
            info["active"] = False
            self._save_users()
            return False
        return True

    def get_level(self, user_id):
        """Retorna el nivel de un usuario: free/vip/premium/admin."""
        uid = str(user_id)
        if uid == ADMIN_CHAT_ID:
            return "admin"
        if uid in self.users and self.users[uid]["active"]:
            if time.time() <= self.users[uid]["expires_at"]:
                return self.users[uid]["level"]
        return "free"

    def get_all_premium_users(self):
        """Retorna lista de todos los usuarios premium activos."""
        active = []
        for uid, info in self.users.items():
            if info["active"] and time.time() <= info["expires_at"]:
                active.append({"user_id": uid, "level": info["level"], "expires": info["expires_at"]})
        return active

    def revoke_user(self, user_id):
        """Revoca el premium de un usuario."""
        uid = str(user_id)
        if uid in self.users:
            self.users[uid]["active"] = False
            self._save_users()
            return True
        return False

    def get_all_codes(self):
        """Retorna todos los codigos (para admin)."""
        return self.codes

    def get_stats(self):
        """Estadisticas del sistema premium."""
        total_codes = len(self.codes)
        active_codes = sum(1 for c in self.codes.values() if c["active"])
        total_premium = len(self.get_all_premium_users())
        return {
            "total_codes": total_codes,
            "active_codes": active_codes,
            "total_premium_users": total_premium
        }
