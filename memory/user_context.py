# -*- coding: utf-8 -*-
"""
🧠 USER CONTEXT — Gestor de Contexto de Usuario Avanzado
=========================================================
Evolución de SmartMemory: más inteligente, más eficiente.

- Perfil emocional del usuario (urgencia, tono)
- Historial comprimido (resúmenes, no mensajes raw)
- Preferencias aprendidas automáticamente
- Contexto de sesión vs contexto persistente
- Inyección mínima al prompt (solo lo relevante)
"""

import json
import os
import time
import logging
import hashlib
from typing import Dict, List, Optional, Any
from collections import defaultdict

logger = logging.getLogger("c8l.memory.context")


class UserContextManager:
    """
    Gestor de contexto de usuario enriquecido.
    Combina sesión actual + memoria persistente + perfil emocional.
    """

    def __init__(self, memory_dir: str = None):
        from config import MEMORY_DIR
        self.memory_dir = memory_dir or MEMORY_DIR
        self._contexts: Dict[str, Dict] = {}  # En memoria (sesión)
        self._persistent: Dict[str, Dict] = self._load_all()  # Disco
        self._session_history: Dict[str, List[Dict]] = defaultdict(list)

    def get_context_for_prompt(self, user_id: str, max_tokens: int = 200) -> str:
        """
        Genera contexto optimizado para inyectar en el prompt.
        Solo incluye info relevante, comprimida.

        Args:
            user_id: ID del usuario
            max_tokens: Límite aproximado de tokens

        Returns:
            Texto de contexto comprimido
        """
        uid = str(user_id)
        profile = self._persistent.get(uid, {})
        session = self._contexts.get(uid, {})

        if not profile and not session:
            return ""

        parts = []

        # Nombre y nivel
        name = profile.get("name", "")
        if name:
            parts.append(f"Usuario: {name}")

        # Estado emocional actual
        emotion = session.get("current_emotion", "")
        if emotion:
            parts.append(f"Estado: {emotion}")

        # Preferencias top (máx 3)
        prefs = profile.get("preferences", [])
        if prefs:
            parts.append(f"Gustos: {', '.join(prefs[-3:])}")

        # Estilo
        style = profile.get("style", "")
        if style:
            parts.append(f"Estilo: {style}")

        # Último tema
        last_topic = session.get("last_topic", "") or profile.get("last_topic", "")
        if last_topic:
            parts.append(f"Tema actual: {last_topic}")

        # Resumen de sesión (si hay)
        session_summary = session.get("session_summary", "")
        if session_summary:
            parts.append(f"Sesión: {session_summary[:100]}")

        context = " | ".join(parts)

        # Truncar si excede tokens aprox (1 token ≈ 4 chars)
        max_chars = max_tokens * 4
        if len(context) > max_chars:
            context = context[:max_chars]

        return f"[CTX: {context}]" if context else ""

    def update_from_message(self, user_id: str, user_name: str,
                            message: str, intent: str = "",
                            agent: str = "", emotion: str = ""):
        """
        Actualiza contexto basado en el mensaje actual.
        Ligero — no hace cómputo pesado.
        """
        uid = str(user_id)

        # Inicializar si es nuevo
        if uid not in self._persistent:
            self._persistent[uid] = {
                "name": user_name,
                "first_seen": time.time(),
                "interactions": 0,
                "preferences": [],
                "topics": [],
                "style": "",
                "notes": [],
                "last_topic": "",
            }

        profile = self._persistent[uid]
        profile["name"] = user_name
        profile["last_seen"] = time.time()
        profile["interactions"] = profile.get("interactions", 0) + 1

        # Contexto de sesión
        if uid not in self._contexts:
            self._contexts[uid] = {
                "session_start": time.time(),
                "messages_count": 0,
            }

        session = self._contexts[uid]
        session["messages_count"] = session.get("messages_count", 0) + 1
        session["last_message"] = message[:200]
        session["last_intent"] = intent
        session["last_agent"] = agent

        if emotion:
            session["current_emotion"] = emotion

        # Detectar topic
        topic = self._extract_topic(message)
        if topic:
            session["last_topic"] = topic
            profile["last_topic"] = topic
            if topic not in profile.get("topics", [])[-15:]:
                profile.setdefault("topics", []).append(topic)

        # Detectar preferencias
        pref = self._detect_preference(message)
        if pref:
            prefs = profile.setdefault("preferences", [])
            if pref not in prefs[-10:]:
                prefs.append(pref)
                if len(prefs) > 20:
                    profile["preferences"] = prefs[-20:]

        # Guardar historial de sesión
        self._session_history[uid].append({
            "role": "user",
            "text": message[:300],
            "time": time.time(),
            "intent": intent,
        })

        # Persist cada 5 interacciones
        if profile["interactions"] % 5 == 0:
            self._save_user(uid)

    def add_bot_response(self, user_id: str, response: str, agent: str = ""):
        """Registra respuesta del bot en el historial de sesión."""
        uid = str(user_id)
        self._session_history[uid].append({
            "role": "assistant",
            "text": response[:300],
            "time": time.time(),
            "agent": agent,
        })

    def get_session_history(self, user_id: str, limit: int = 10) -> List[Dict]:
        """Obtiene historial de la sesión actual."""
        uid = str(user_id)
        return self._session_history.get(uid, [])[-limit:]

    def get_profile(self, user_id: str) -> Dict:
        """Obtiene perfil completo del usuario."""
        return self._persistent.get(str(user_id), {})

    def get_profile_text(self, user_id: str) -> str:
        """Genera texto de perfil para mostrar al usuario."""
        profile = self.get_profile(user_id)
        if not profile:
            return "🧠 No te conozco aún. Escríbeme y te iré conociendo."

        name = profile.get("name", "Usuario")
        interactions = profile.get("interactions", 0)
        topics = profile.get("topics", [])[-5:]
        prefs = profile.get("preferences", [])[-5:]
        style = profile.get("style", "")

        text = f"🧠 *Perfil de {name}*\n\n"
        text += f"💬 Interacciones: {interactions}\n"
        if style:
            text += f"🎨 Estilo: {style}\n"
        if topics:
            text += f"📌 Temas: {', '.join(topics)}\n"
        if prefs:
            text += f"⭐ Gustos: {', '.join(prefs)}\n"
        return text

    def detect_emotion(self, text: str) -> str:
        """
        Detección de emoción/urgencia ultraligera (sin modelo).
        Basada en patrones del texto.
        """
        t = text.lower()

        # Urgencia
        urgency_words = ["urgente", "rapido", "rápido", "ya", "ahora",
                         "ayuda", "help", "sos", "emergencia"]
        if any(w in t for w in urgency_words):
            return "urgente"

        # Frustración
        frustration = ["no funciona", "no sirve", "mierda", "carajo",
                       "odio", "basura", "malo", "horrible"]
        if any(w in t for w in frustration):
            return "frustrado"

        # Entusiasmo
        enthusiasm = ["genial", "increíble", "wow", "brutal", "crack",
                      "perfecto", "me encanta", "🔥", "💯"]
        if any(w in t for w in enthusiasm):
            return "entusiasmado"

        # Curiosidad
        curiosity = ["?", "cómo", "como", "por qué", "porque",
                     "qué es", "que es"]
        if any(w in t for w in curiosity):
            return "curioso"

        return "neutral"

    def _extract_topic(self, message: str) -> str:
        """Extrae tema del mensaje (ligero, sin modelo)."""
        t = message.lower()
        topics_map = {
            "musica": ["musica", "canción", "beat", "suno", "track"],
            "imagen": ["imagen", "foto", "logo", "diseño", "banner"],
            "video": ["video", "clip", "animación", "película"],
            "codigo": ["codigo", "programa", "app", "web", "juego"],
            "estrategia": ["marketing", "estrategia", "seo", "redes"],
            "crypto": ["bitcoin", "crypto", "ethereum", "token"],
            "ajedrez": ["ajedrez", "chess", "partida"],
        }
        for topic, keywords in topics_map.items():
            if any(kw in t for kw in keywords):
                return topic
        return ""

    def _detect_preference(self, message: str) -> str:
        """Detecta preferencias explícitas."""
        t = message.lower()
        triggers = ["me gusta", "prefiero", "quiero", "amo", "me encanta"]
        for trigger in triggers:
            if trigger in t:
                idx = t.find(trigger) + len(trigger)
                pref = message[idx:idx + 50].strip()
                if len(pref) > 3:
                    return pref[:40]
        return ""

    def _load_all(self) -> Dict:
        """Carga todas las memorias de disco."""
        filepath = os.path.join(self.memory_dir, "user_contexts_v4.json")
        try:
            if os.path.exists(filepath):
                with open(filepath, "r", encoding="utf-8") as f:
                    return json.load(f)
        except Exception as e:
            logger.warning(f"Error loading contexts: {e}")
        return {}

    def _save_user(self, user_id: str):
        """Guarda el perfil de un usuario."""
        filepath = os.path.join(self.memory_dir, "user_contexts_v4.json")
        try:
            with open(filepath, "w", encoding="utf-8") as f:
                json.dump(self._persistent, f, ensure_ascii=False, indent=2)
        except Exception as e:
            logger.error(f"Error saving context: {e}")

    def save_all(self):
        """Guarda todos los perfiles (para shutdown)."""
        self._save_user("")  # Guarda todo el dict
