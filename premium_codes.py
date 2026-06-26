# -*- coding: utf-8 -*-
"""
🎫 PREMIUM CODES — Sistema de códigos de invitación
Leo genera códigos, los usuarios los canjean para obtener Premium.

Comandos Telegram:
  /premium CODIGO        — Usuario canjea un código
  /generar_codigo        — Solo Leo: genera un código nuevo
  /mis_codigos           — Solo Leo: lista códigos activos
  /premium_user ID       — Solo Leo: da premium directo a un user

Los códigos son de un solo uso y expiran en 30 días.
"""

import json
import os
import time
import random
import string
import logging
from typing import Dict, Optional, List
from datetime import datetime, timedelta

logger = logging.getLogger("c8l.premium_codes")

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")
CODES_FILE = os.path.join(DATA_DIR, "premium_codes.json")

os.makedirs(DATA_DIR, exist_ok=True)


class PremiumCodeManager:
    """Gestiona códigos de invitación Premium."""

    def __init__(self):
        self._data = self._load()

    def _load(self) -> dict:
        if os.path.exists(CODES_FILE):
            try:
                with open(CODES_FILE, 'r', encoding='utf-8') as f:
                    return json.load(f)
            except Exception:
                pass
        return {"codes": {}, "redeemed_history": [], "total_generated": 0}

    def _save(self):
        try:
            with open(CODES_FILE, 'w', encoding='utf-8') as f:
                json.dump(self._data, f, ensure_ascii=False, indent=2)
        except Exception as e:
            logger.error(f"Error guardando codes: {e}")

    # ===== GENERAR CÓDIGO =====

    def generate_code(
        self,
        duration_days: int = 30,
        tier: str = "premium",
        created_by: str = "admin",
        note: str = "",
    ) -> str:
        """
        Genera un nuevo código de invitación.

        Args:
            duration_days: Días que dura el premium tras canjear
            tier: Tier que otorga ("premium")
            created_by: Quién lo creó
            note: Nota opcional

        Returns:
            El código generado (ej: "C8L-ABCD-1234")
        """
        code = self._make_code()

        self._data["codes"][code] = {
            "tier": tier,
            "duration_days": duration_days,
            "created_at": datetime.now().isoformat(),
            "expires_at": (datetime.now() + timedelta(days=90)).isoformat(),  # Código expira en 90 días si no se usa
            "created_by": created_by,
            "note": note,
            "used": False,
            "used_by": None,
            "used_at": None,
        }
        self._data["total_generated"] += 1
        self._save()

        logger.info(f"🎫 Código generado: {code} (premium {duration_days} días)")
        return code

    def generate_batch(self, count: int = 5, duration_days: int = 30) -> List[str]:
        """Genera múltiples códigos."""
        codes = []
        for _ in range(count):
            codes.append(self.generate_code(duration_days=duration_days))
        return codes

    def _make_code(self) -> str:
        """Genera un código tipo C8L-XXXX-XXXX."""
        chars = string.ascii_uppercase + string.digits
        part1 = ''.join(random.choices(chars, k=4))
        part2 = ''.join(random.choices(chars, k=4))
        code = f"C8L-{part1}-{part2}"
        # Verificar que no existe
        if code in self._data["codes"]:
            return self._make_code()
        return code

    # ===== CANJEAR CÓDIGO =====

    def redeem_code(self, code: str, user_id: str, user_name: str = "") -> Dict:
        """
        Canjea un código de invitación.

        Args:
            code: El código a canjear
            user_id: ID del usuario que canjea
            user_name: Nombre del usuario

        Returns:
            {"success": bool, "message": str, "tier": str, "duration_days": int}
        """
        code = code.upper().strip()

        # Verificar si existe
        if code not in self._data["codes"]:
            return {"success": False, "message": "Código inválido. Verifica que lo escribiste bien."}

        code_data = self._data["codes"][code]

        # Verificar si ya fue usado
        if code_data["used"]:
            return {"success": False, "message": "Este código ya fue usado."}

        # Verificar si expiró
        expires_at = datetime.fromisoformat(code_data["expires_at"])
        if datetime.now() > expires_at:
            return {"success": False, "message": "Este código ha expirado."}

        # ¡Canjear!
        code_data["used"] = True
        code_data["used_by"] = str(user_id)
        code_data["used_by_name"] = user_name
        code_data["used_at"] = datetime.now().isoformat()

        # Registrar en historial
        self._data["redeemed_history"].append({
            "code": code,
            "user_id": str(user_id),
            "user_name": user_name,
            "tier": code_data["tier"],
            "duration_days": code_data["duration_days"],
            "redeemed_at": datetime.now().isoformat(),
        })
        self._save()

        # Activar premium en el sistema de créditos
        try:
            from suno_credits import SunoCreditsManager
            cm = SunoCreditsManager()
            cm.set_tier(str(user_id), code_data["tier"])
            cm.set_name(str(user_id), user_name)
        except Exception as e:
            logger.error(f"Error activando tier: {e}")

        logger.info(f"🎫 Código canjeado: {code} por user={user_id} ({user_name})")

        return {
            "success": True,
            "message": f"¡Premium activado! Tienes {code_data['duration_days']} días de C8L Premium.",
            "tier": code_data["tier"],
            "duration_days": code_data["duration_days"],
        }

    # ===== CONSULTAR =====

    def get_active_codes(self) -> List[dict]:
        """Lista códigos activos (no usados, no expirados)."""
        active = []
        now = datetime.now()
        for code, data in self._data["codes"].items():
            if not data["used"]:
                expires = datetime.fromisoformat(data["expires_at"])
                if now < expires:
                    active.append({
                        "code": code,
                        "tier": data["tier"],
                        "duration_days": data["duration_days"],
                        "created_at": data["created_at"][:10],
                        "expires_at": data["expires_at"][:10],
                        "note": data.get("note", ""),
                    })
        return active

    def get_redeemed_history(self, limit: int = 20) -> List[dict]:
        """Historial de códigos canjeados."""
        return self._data["redeemed_history"][-limit:]

    def get_stats(self) -> dict:
        """Estadísticas de códigos."""
        total = self._data["total_generated"]
        used = sum(1 for c in self._data["codes"].values() if c["used"])
        active = len(self.get_active_codes())
        return {
            "total_generated": total,
            "total_used": used,
            "active_codes": active,
            "redeemed_users": len(set(h["user_id"] for h in self._data["redeemed_history"])),
        }


# Singleton
_manager: Optional[PremiumCodeManager] = None


def get_premium_manager() -> PremiumCodeManager:
    global _manager
    if _manager is None:
        _manager = PremiumCodeManager()
    return _manager
