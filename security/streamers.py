# -*- coding: utf-8 -*-
"""
👑 STREAMERS PREMIUM — Solo Leo da premium a sus streamers C8L
================================================================
Sistema exclusivo para gestionar streamers de C8L Agency.
Solo el admin puede agregar/remover streamers.

Funciones:
- /admin_streamer add USER_ID NOMBRE — Agregar streamer premium
- /admin_streamer remove USER_ID — Quitar premium
- /admin_streamer list — Ver todos los streamers

Los streamers reciben:
- Tier "streamer" (superior a premium normal)
- 5,000 coins de bienvenida
- Badge 🎬 en su perfil
- Acceso a funciones exclusivas
- Revenue share de diamantes mejorado

Autor: C8L Agency / Leo
"""

import os
import json
import time
import logging
from typing import Optional, Dict, List
from datetime import datetime

logger = logging.getLogger("c8l.security.streamers")

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "data")
STREAMERS_FILE = os.path.join(DATA_DIR, "c8l_streamers.json")

os.makedirs(DATA_DIR, exist_ok=True)



class StreamerManager:
    """
    👑 Gestiona streamers premium de C8L.
    Solo Leo puede agregar/remover.
    """

    def __init__(self):
        self._data = self._load()

    def _load(self) -> Dict:
        if os.path.exists(STREAMERS_FILE):
            try:
                with open(STREAMERS_FILE, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception:
                pass
        return {"streamers": {}, "total_added": 0, "total_removed": 0}

    def _save(self):
        try:
            with open(STREAMERS_FILE, "w", encoding="utf-8") as f:
                json.dump(self._data, f, ensure_ascii=False, indent=2)
        except Exception as e:
            logger.error(f"Error guardando streamers: {e}")

    def add_streamer(self, user_id: str, name: str = "",
                     note: str = "") -> Dict:
        """Agrega un streamer al programa premium C8L."""
        user_id = str(user_id)

        if user_id in self._data["streamers"]:
            return {
                "success": False,
                "message": f"⚠️ `{user_id}` ya es streamer C8L.",
            }

        self._data["streamers"][user_id] = {
            "name": name or f"Streamer_{user_id[:6]}",
            "added_at": datetime.now().isoformat(),
            "added_by": "admin",
            "note": note,
            "tier": "streamer",
            "badge": "🎬",
            "welcome_coins": 5000,
            "active": True,
            "total_diamonds_earned": 0,
        }
        self._data["total_added"] += 1
        self._save()

        # Dar coins de bienvenida
        try:
            from economy.c8l_economy import get_c8l_economy
            eco = get_c8l_economy()
            w = eco.get_wallet(user_id)
            w["coins_free"] += 5000
            w["tier"] = "streamer"
            eco._save()
        except Exception as e:
            logger.error(f"Error dando coins a streamer: {e}")

        logger.info(f"👑 Streamer agregado: {name} ({user_id})")
        return {
            "success": True,
            "message": (
                f"👑 *Streamer C8L agregado!*\n\n"
                f"🎬 Nombre: {name}\n"
                f"🆔 ID: `{user_id}`\n"
                f"🎒 +5,000 coins de bienvenida\n"
                f"👑 Tier: streamer\n"
                f"🏷️ Badge: 🎬\n\n"
                f"_El streamer ahora tiene acceso premium completo._"
            ),
        }

    def remove_streamer(self, user_id: str) -> Dict:
        """Remueve un streamer del programa."""
        user_id = str(user_id)

        if user_id not in self._data["streamers"]:
            return {"success": False, "message": f"❌ `{user_id}` no es streamer."}

        name = self._data["streamers"][user_id]["name"]
        self._data["streamers"][user_id]["active"] = False
        self._data["total_removed"] += 1
        self._save()

        # Cambiar tier a free
        try:
            from economy.c8l_economy import get_c8l_economy
            eco = get_c8l_economy()
            w = eco.get_wallet(user_id)
            w["tier"] = "free"
            eco._save()
        except Exception:
            pass

        return {
            "success": True,
            "message": f"✅ Streamer *{name}* (`{user_id}`) removido del programa.",
        }


    def is_streamer(self, user_id: str) -> bool:
        """Verifica si un usuario es streamer activo."""
        user_id = str(user_id)
        if user_id in self._data["streamers"]:
            return self._data["streamers"][user_id].get("active", False)
        return False

    def get_streamer(self, user_id: str) -> Optional[Dict]:
        """Obtiene info de un streamer."""
        return self._data["streamers"].get(str(user_id))

    def list_streamers(self) -> List[Dict]:
        """Lista todos los streamers activos."""
        active = []
        for uid, data in self._data["streamers"].items():
            if data.get("active", False):
                active.append({
                    "user_id": uid,
                    "name": data["name"],
                    "badge": data.get("badge", "🎬"),
                    "added_at": data["added_at"][:10],
                    "diamonds": data.get("total_diamonds_earned", 0),
                })
        return active

    def get_stats(self) -> str:
        """Estadísticas del programa de streamers."""
        active = [s for s in self._data["streamers"].values() if s.get("active")]
        total_diamonds = sum(s.get("total_diamonds_earned", 0) for s in active)
        return (
            f"👑 *Programa Streamers C8L*\n\n"
            f"🎬 Streamers activos: {len(active)}\n"
            f"📊 Total agregados: {self._data['total_added']}\n"
            f"❌ Total removidos: {self._data['total_removed']}\n"
            f"💎 Diamantes generados: {total_diamonds:,}"
        )


# ---------------------------------------------------------------------------
# Singleton
# ---------------------------------------------------------------------------
_streamer_instance: Optional[StreamerManager] = None


def get_streamer_manager() -> StreamerManager:
    global _streamer_instance
    if _streamer_instance is None:
        _streamer_instance = StreamerManager()
    return _streamer_instance
