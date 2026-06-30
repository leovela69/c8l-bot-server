# -*- coding: utf-8 -*-
"""
🧠 USER CONTEXT — Perfil y Preferencias del Usuario ANTIGRAVITY
=================================================================
Gestiona el perfil persistente de cada usuario:
- Nombre, idioma, zona horaria
- Personalidad preferida del bot
- Historial de intenciones
- Estado emocional reciente
- Preferencias de juego
"""

import os
import json
import logging
from typing import Dict, Optional, List
from datetime import datetime

logger = logging.getLogger("c8l.user_context")

# Intenta usar Supabase; si no, almacena en JSON local
try:
    from supabase import create_client
    SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
    SUPABASE_KEY = os.environ.get("SUPABASE_KEY", "")
    if SUPABASE_URL and "placeholder" not in SUPABASE_URL:
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
        USE_SUPABASE = True
    else:
        supabase = None
        USE_SUPABASE = False
except ImportError:
    supabase = None
    USE_SUPABASE = False

# Almacenamiento local como fallback
LOCAL_CONTEXT_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "data", "user_contexts"
)
os.makedirs(LOCAL_CONTEXT_DIR, exist_ok=True)


class UserContext:
    """
    Gestiona el contexto persistente de cada usuario.
    Almacena perfil, preferencias, historial y mood.
    """

    DEFAULT_PROFILE = {
        "user_id": "",
        "name": "",
        "language": "es",
        "timezone": "Europe/Madrid",
        "persona": "amigable",  # amigable, formal, bromista, mentor
        "favorite_games": [],
        "mood_history": [],  # últimos 10 estados emocionales
        "intent_history": [],  # últimas 20 intenciones
        "total_interactions": 0,
        "first_seen": "",
        "last_seen": "",
        "preferences": {
            "notifications": True,
            "daily_bonus_reminder": True,
            "weekly_summary": True,
            "tts_responses": False,  # responder con audio
        },
        "achievements": [],
        "level": 1,
        "xp": 0,
    }

    def __init__(self):
        self._cache: Dict[str, Dict] = {}

    async def get_profile(self, user_id: str) -> Dict:
        """Obtiene el perfil completo de un usuario."""
        # Cache primero
        if user_id in self._cache:
            return self._cache[user_id]

        profile = None

        # Intentar Supabase
        if USE_SUPABASE:
            try:
                resp = supabase.table("user_profiles").select("*").eq("user_id", user_id).execute()
                if resp.data:
                    profile = resp.data[0]
            except Exception as e:
                logger.warning(f"Error leyendo perfil de Supabase: {e}")

        # Fallback a JSON local
        if not profile:
            profile = self._load_local(user_id)

        # Si no existe, crear nuevo
        if not profile:
            profile = self._create_profile(user_id)

        # Actualizar caché
        self._cache[user_id] = profile
        return profile

    async def update_profile(self, user_id: str, updates: Dict) -> Dict:
        """Actualiza campos del perfil."""
        profile = await self.get_profile(user_id)
        profile.update(updates)
        profile["last_seen"] = datetime.now().isoformat()

        # Persistir
        await self._save(user_id, profile)
        self._cache[user_id] = profile
        return profile

    async def record_interaction(self, user_id: str, intent: str, sentiment: str):
        """Registra una interacción (para aprendizaje de hábitos)."""
        profile = await self.get_profile(user_id)

        # Actualizar contadores
        profile["total_interactions"] = profile.get("total_interactions", 0) + 1
        profile["last_seen"] = datetime.now().isoformat()

        # Historial de intenciones (últimas 20)
        intent_history = profile.get("intent_history", [])
        intent_history.append({
            "intent": intent,
            "timestamp": datetime.now().isoformat(),
        })
        if len(intent_history) > 20:
            intent_history = intent_history[-20:]
        profile["intent_history"] = intent_history

        # Historial de mood (últimos 10)
        mood_history = profile.get("mood_history", [])
        mood_history.append({
            "sentiment": sentiment,
            "timestamp": datetime.now().isoformat(),
        })
        if len(mood_history) > 10:
            mood_history = mood_history[-10:]
        profile["mood_history"] = mood_history

        # XP por interacción
        profile["xp"] = profile.get("xp", 0) + 5
        # Level up cada 500 XP
        new_level = (profile["xp"] // 500) + 1
        if new_level > profile.get("level", 1):
            profile["level"] = new_level
            logger.info(f"User {user_id} subió a nivel {new_level}!")

        await self._save(user_id, profile)
        self._cache[user_id] = profile

    async def get_recent_context(self, user_id: str, limit: int = 5) -> List[Dict]:
        """Obtiene las últimas interacciones para inyectar como contexto."""
        profile = await self.get_profile(user_id)
        return profile.get("intent_history", [])[-limit:]

    async def get_dominant_mood(self, user_id: str) -> str:
        """Obtiene el mood dominante reciente."""
        profile = await self.get_profile(user_id)
        moods = profile.get("mood_history", [])
        if not moods:
            return "neutro"

        # Contar sentimientos
        counts = {}
        for m in moods[-5:]:
            s = m.get("sentiment", "neutro")
            counts[s] = counts.get(s, 0) + 1

        return max(counts, key=counts.get)

    def _create_profile(self, user_id: str) -> Dict:
        """Crea un perfil nuevo."""
        profile = self.DEFAULT_PROFILE.copy()
        profile["user_id"] = user_id
        profile["first_seen"] = datetime.now().isoformat()
        profile["last_seen"] = datetime.now().isoformat()
        profile["preferences"] = self.DEFAULT_PROFILE["preferences"].copy()

        # Guardar localmente
        self._save_local(user_id, profile)
        return profile

    async def _save(self, user_id: str, profile: Dict):
        """Guarda perfil en Supabase o local."""
        if USE_SUPABASE:
            try:
                supabase.table("user_profiles").upsert(profile).execute()
            except Exception as e:
                logger.warning(f"Error guardando en Supabase: {e}")
                self._save_local(user_id, profile)
        else:
            self._save_local(user_id, profile)

    def _load_local(self, user_id: str) -> Optional[Dict]:
        """Carga perfil de archivo JSON local."""
        filepath = os.path.join(LOCAL_CONTEXT_DIR, f"{user_id}.json")
        if os.path.exists(filepath):
            try:
                with open(filepath, "r", encoding="utf-8") as f:
                    return json.load(f)
            except:
                pass
        return None

    def _save_local(self, user_id: str, profile: Dict):
        """Guarda perfil en archivo JSON local."""
        filepath = os.path.join(LOCAL_CONTEXT_DIR, f"{user_id}.json")
        try:
            with open(filepath, "w", encoding="utf-8") as f:
                json.dump(profile, f, ensure_ascii=False, indent=2)
        except Exception as e:
            logger.error(f"Error guardando perfil local: {e}")
