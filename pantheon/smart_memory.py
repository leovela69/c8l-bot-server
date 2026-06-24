# -*- coding: utf-8 -*-
"""
🧠 SMART MEMORY — Memoria inteligente de conversación
Recuerda gustos, estilo, preferencias y contexto de cada usuario.
No empieza de cero cada vez.
"""

import json
import os
import time
import logging
from config import MEMORY_DIR

logger = logging.getLogger("c8l.smart_memory")

USER_MEMORY_FILE = os.path.join(MEMORY_DIR, "user_memories.json")


class SmartMemory:
    """Memoria persistente por usuario."""

    def __init__(self):
        self.memories = self._load()

    def get_user_context(self, user_id, user_name=""):
        """Genera contexto de memoria para inyectar en conversaciones."""
        uid = str(user_id)
        mem = self.memories.get(uid)
        if not mem:
            return ""

        context = f"\n[MEMORIA DEL USUARIO {mem.get('name', user_name)}]:\n"
        if mem.get("preferences"):
            context += f"- Preferencias: {', '.join(mem['preferences'][-5:])}\n"
        if mem.get("style"):
            context += f"- Estilo favorito: {mem['style']}\n"
        if mem.get("topics"):
            context += f"- Temas frecuentes: {', '.join(mem['topics'][-5:])}\n"
        if mem.get("last_request"):
            context += f"- Último pedido: {mem['last_request'][:80]}\n"
        if mem.get("notes"):
            context += f"- Notas: {'; '.join(mem['notes'][-3:])}\n"
        return context

    def update_from_interaction(self, user_id, user_name, message, intent="", agent=""):
        """Actualiza memoria basada en la interacción."""
        uid = str(user_id)
        if uid not in self.memories:
            self.memories[uid] = {
                "name": user_name,
                "first_seen": time.time(),
                "preferences": [],
                "topics": [],
                "style": "",
                "notes": [],
                "last_request": "",
                "interaction_count": 0,
            }

        mem = self.memories[uid]
        mem["name"] = user_name
        mem["last_seen"] = time.time()
        mem["last_request"] = message[:200]
        mem["interaction_count"] = mem.get("interaction_count", 0) + 1

        # Extraer temas
        topic = self._extract_topic(message)
        if topic and topic not in mem["topics"][-10:]:
            mem["topics"].append(topic)
            if len(mem["topics"]) > 20:
                mem["topics"] = mem["topics"][-20:]

        # Detectar preferencias de estilo
        style = self._detect_style_preference(message)
        if style:
            mem["style"] = style

        # Detectar preferencias explícitas
        pref = self._detect_preference(message)
        if pref and pref not in mem["preferences"][-10:]:
            mem["preferences"].append(pref)
            if len(mem["preferences"]) > 15:
                mem["preferences"] = mem["preferences"][-15:]

        self._save()

    def add_note(self, user_id, note):
        """Añade nota manual a la memoria del usuario."""
        uid = str(user_id)
        if uid not in self.memories:
            self.memories[uid] = {"name": "", "notes": [], "preferences": [],
                                   "topics": [], "style": "", "last_request": "",
                                   "interaction_count": 0, "first_seen": time.time()}
        self.memories[uid]["notes"].append(note[:200])
        if len(self.memories[uid]["notes"]) > 10:
            self.memories[uid]["notes"] = self.memories[uid]["notes"][-10:]
        self._save()

    def get_user_profile_text(self, user_id):
        """Genera texto de perfil para mostrar al usuario."""
        uid = str(user_id)
        mem = self.memories.get(uid)
        if not mem:
            return "🧠 No tengo memorias tuyas aún. Usa el bot y te iré conociendo."

        text = f"🧠 *Memoria de {mem.get('name', 'Usuario')}*\n\n"
        text += f"📅 Primera vez: {time.strftime('%d/%m/%Y', time.localtime(mem.get('first_seen', 0)))}\n"
        text += f"💬 Interacciones: {mem.get('interaction_count', 0)}\n"
        if mem.get("style"):
            text += f"🎨 Estilo favorito: {mem['style']}\n"
        if mem.get("topics"):
            text += f"📌 Temas: {', '.join(mem['topics'][-5:])}\n"
        if mem.get("preferences"):
            text += f"⭐ Preferencias: {', '.join(mem['preferences'][-5:])}\n"
        if mem.get("notes"):
            text += f"\n📝 Notas:\n"
            for note in mem["notes"][-5:]:
                text += f"  • {note}\n"
        return text

    def _extract_topic(self, message):
        """Extrae tema principal del mensaje."""
        t = message.lower()
        topics_map = {
            "musica": ["musica", "cancion", "beat", "suno", "udio", "dj", "mezcla"],
            "imagen": ["imagen", "foto", "logo", "diseño", "banner", "3d"],
            "video": ["video", "clip", "animacion"],
            "codigo": ["codigo", "programa", "app", "web", "juego", "game"],
            "estrategia": ["marketing", "estrategia", "seo", "redes"],
            "ajedrez": ["ajedrez", "chess", "partida"],
        }
        for topic, keywords in topics_map.items():
            if any(kw in t for kw in keywords):
                return topic
        return ""

    def _detect_style_preference(self, message):
        """Detecta preferencia de estilo visual."""
        t = message.lower()
        styles = {
            "neon/cyberpunk": ["neon", "cyberpunk", "futurista"],
            "3D realista": ["3d", "realista", "render"],
            "anime": ["anime", "manga"],
            "minimalista": ["minimal", "simple", "limpio"],
            "dark/gótico": ["dark", "oscuro", "gotico"],
            "retro": ["retro", "vintage", "80s"],
        }
        for style, keywords in styles.items():
            if any(kw in t for kw in keywords):
                return style
        return ""

    def _detect_preference(self, message):
        """Detecta preferencias explícitas."""
        t = message.lower()
        if "me gusta" in t or "prefiero" in t or "quiero" in t:
            # Extraer lo que viene después
            for trigger in ["me gusta", "prefiero", "quiero"]:
                if trigger in t:
                    idx = t.find(trigger) + len(trigger)
                    pref = message[idx:idx+50].strip()
                    if len(pref) > 3:
                        return pref
        return ""

    def _load(self):
        try:
            if os.path.exists(USER_MEMORY_FILE):
                with open(USER_MEMORY_FILE, "r", encoding="utf-8") as f:
                    return json.load(f)
        except:
            pass
        return {}

    def _save(self):
        try:
            with open(USER_MEMORY_FILE, "w", encoding="utf-8") as f:
                json.dump(self.memories, f, ensure_ascii=False, indent=2)
        except Exception as e:
            logger.error(f"Error guardando memorias: {e}")


# Instancia global
smart_memory = SmartMemory()
