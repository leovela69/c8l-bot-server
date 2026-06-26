# -*- coding: utf-8 -*-
"""
🎵 SUNO CREDITS MANAGER — Control de uso por usuario
Gestiona cuotas, limites y permisos de generacion de musica.

Sistema:
  - Admin (Leo): ilimitado
  - Premium users: 20 generaciones/dia
  - Free users: 3 generaciones/dia
  - Cooldown: 2 min entre generaciones (anti-spam)

Cada generacion Suno consume ~5 creditos de la cuenta.
Leo tiene ~2500 creditos/mes (Premium Pro).
"""

import json
import os
import time
import logging
from typing import Dict, Optional
from datetime import datetime, timedelta

logger = logging.getLogger("c8l.suno_credits")

# Paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")
CREDITS_FILE = os.path.join(DATA_DIR, "suno_user_credits.json")

os.makedirs(DATA_DIR, exist_ok=True)


class UserTier:
    ADMIN = "admin"          # Ilimitado (Leo)
    PREMIUM = "premium"      # 20/dia
    FREE = "free"            # 1/dia


# Configuracion de limites
TIER_LIMITS = {
    UserTier.ADMIN: {
        "daily_limit": 999,
        "cooldown_seconds": 0,
        "features": ["generate", "extend", "remix", "lyrics", "stems", "feed", "concat"],
    },
    UserTier.PREMIUM: {
        "daily_limit": 5,
        "cooldown_seconds": 60,  # 1 min entre generaciones
        "features": ["generate", "extend", "remix", "lyrics", "stems", "feed"],
    },
    UserTier.FREE: {
        "daily_limit": 1,
        "cooldown_seconds": 120,  # 2 min entre generaciones
        "features": ["generate", "lyrics"],  # Solo generar y letras
    },
}

# Admin IDs (Leo)
ADMIN_IDS = ["1970956749", "admin", "leo"]


class SunoCreditsManager:
    """Gestiona creditos y cuotas de Suno por usuario."""

    def __init__(self):
        self._data = self._load()

    def _load(self) -> dict:
        """Carga datos de creditos desde archivo."""
        if os.path.exists(CREDITS_FILE):
            try:
                with open(CREDITS_FILE, 'r') as f:
                    return json.load(f)
            except Exception:
                pass
        return {"users": {}, "total_generations": 0, "last_reset": ""}

    def _save(self):
        """Guarda datos de creditos."""
        try:
            with open(CREDITS_FILE, 'w') as f:
                json.dump(self._data, f, indent=2, ensure_ascii=False)
        except Exception as e:
            logger.error(f"Error guardando credits: {e}")

    def _get_user(self, user_id: str) -> dict:
        """Obtiene o crea registro de usuario."""
        user_id = str(user_id)
        if user_id not in self._data["users"]:
            self._data["users"][user_id] = {
                "tier": UserTier.ADMIN if user_id in ADMIN_IDS else UserTier.FREE,
                "daily_count": 0,
                "total_count": 0,
                "last_generation": 0,
                "last_reset_date": "",
                "name": "",
            }
        return self._data["users"][user_id]

    def _reset_daily_if_needed(self, user: dict):
        """Resetea el contador diario si es un nuevo dia."""
        today = datetime.now().strftime("%Y-%m-%d")
        if user.get("last_reset_date") != today:
            user["daily_count"] = 0
            user["last_reset_date"] = today

    def can_generate(self, user_id: str, feature: str = "generate") -> Dict:
        """
        Verifica si el usuario puede generar.

        Returns:
            {"allowed": True/False, "reason": "...", "remaining": N}
        """
        user_id = str(user_id)
        user = self._get_user(user_id)
        self._reset_daily_if_needed(user)

        tier = user["tier"]
        limits = TIER_LIMITS[tier]

        # Check feature access
        if feature not in limits["features"]:
            return {
                "allowed": False,
                "reason": f"Tu plan ({tier}) no incluye '{feature}'. Upgrade a Premium.",
                "remaining": 0,
            }

        # Check daily limit
        if user["daily_count"] >= limits["daily_limit"]:
            return {
                "allowed": False,
                "reason": f"Limite diario alcanzado ({limits['daily_limit']}/{limits['daily_limit']}). Vuelve manana.",
                "remaining": 0,
            }

        # Check cooldown
        cooldown = limits["cooldown_seconds"]
        if cooldown > 0:
            elapsed = time.time() - user.get("last_generation", 0)
            if elapsed < cooldown:
                wait = int(cooldown - elapsed)
                return {
                    "allowed": False,
                    "reason": f"Espera {wait}s antes de generar otra vez.",
                    "remaining": limits["daily_limit"] - user["daily_count"],
                }

        remaining = limits["daily_limit"] - user["daily_count"]
        return {
            "allowed": True,
            "reason": "OK",
            "remaining": remaining,
        }

    def record_generation(self, user_id: str, feature: str = "generate", track_count: int = 1):
        """Registra una generacion exitosa."""
        user_id = str(user_id)
        user = self._get_user(user_id)
        self._reset_daily_if_needed(user)

        user["daily_count"] += 1
        user["total_count"] += track_count
        user["last_generation"] = time.time()
        self._data["total_generations"] += track_count
        self._save()

        logger.info(f"🎵 Credits: user={user_id} gen={user['daily_count']}/{TIER_LIMITS[user['tier']]['daily_limit']} total={user['total_count']}")

    def set_tier(self, user_id: str, tier: str):
        """Cambia el tier de un usuario (admin only)."""
        user = self._get_user(str(user_id))
        if tier in [UserTier.ADMIN, UserTier.PREMIUM, UserTier.FREE]:
            user["tier"] = tier
            self._save()

    def set_name(self, user_id: str, name: str):
        """Guarda el nombre del usuario."""
        user = self._get_user(str(user_id))
        user["name"] = name
        self._save()

    def get_stats(self, user_id: str) -> dict:
        """Obtiene estadisticas del usuario."""
        user = self._get_user(str(user_id))
        self._reset_daily_if_needed(user)
        tier = user["tier"]
        limits = TIER_LIMITS[tier]
        return {
            "user_id": user_id,
            "tier": tier,
            "daily_used": user["daily_count"],
            "daily_limit": limits["daily_limit"],
            "daily_remaining": limits["daily_limit"] - user["daily_count"],
            "total_generations": user["total_count"],
            "features": limits["features"],
            "cooldown": limits["cooldown_seconds"],
        }

    def get_global_stats(self) -> dict:
        """Estadisticas globales del sistema."""
        total_users = len(self._data["users"])
        total_gens = self._data.get("total_generations", 0)
        premium_users = sum(1 for u in self._data["users"].values() if u.get("tier") == UserTier.PREMIUM)
        return {
            "total_users": total_users,
            "premium_users": premium_users,
            "total_generations": total_gens,
        }

    def upgrade_user(self, user_id: str) -> str:
        """Upgrade a premium (llamado por admin o por compra)."""
        self.set_tier(user_id, UserTier.PREMIUM)
        return f"✅ Usuario {user_id} upgradeado a Premium (20 gen/dia)"


# Singleton global
suno_credits = SunoCreditsManager()
