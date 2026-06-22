# -*- coding: utf-8 -*-
"""
🧬 ESTIA — Bot Esclavo 8 (Aprendizaje / Evolucion)
Aprende de cada interaccion y evoluciona el sistema.
"La Memoria Viva de C8L"

Skills: honcho, blackbox, plan
"""

import logging
import json
import os
import time
from config import MEMORY_DIR

logger = logging.getLogger("c8l.estia")



INTERACTIONS_FILE = os.path.join(MEMORY_DIR, "estia_interactions.json")
LEARNINGS_FILE = os.path.join(MEMORY_DIR, "estia_learnings.json")
USER_PROFILES_FILE = os.path.join(MEMORY_DIR, "estia_users.json")


class Estia:
    """Bot de Aprendizaje — Memoria Viva del sistema."""

    def __init__(self):
        self.interactions = self._load_json(INTERACTIONS_FILE, [])
        self.learnings = self._load_json(LEARNINGS_FILE, [])
        self.user_profiles = self._load_json(USER_PROFILES_FILE, {})

    def record_interaction(self, user_id, user_name, message, intent, agent_used, success=True):
        """Registra una interaccion para aprendizaje futuro."""
        interaction = {
            "timestamp": time.time(),
            "time_human": time.strftime("%Y-%m-%d %H:%M"),
            "user_id": str(user_id),
            "user_name": user_name,
            "message_preview": message[:100],
            "intent": intent,
            "agent_used": agent_used,
            "success": success
        }
        self.interactions.append(interaction)
        # Mantener ultimas 500 interacciones
        if len(self.interactions) > 500:
            self.interactions = self.interactions[-500:]
        self._save_json(INTERACTIONS_FILE, self.interactions)

        # Actualizar perfil del usuario
        self._update_user_profile(user_id, user_name, intent)

    def _update_user_profile(self, user_id, user_name, intent):
        """Actualiza perfil del usuario con sus preferencias."""
        uid = str(user_id)
        if uid not in self.user_profiles:
            self.user_profiles[uid] = {
                "name": user_name,
                "first_seen": time.time(),
                "total_interactions": 0,
                "intents": {},
                "favorite_agents": {},
            }

        profile = self.user_profiles[uid]
        profile["name"] = user_name
        profile["total_interactions"] = profile.get("total_interactions", 0) + 1
        profile["last_seen"] = time.time()

        # Contar intents
        intents = profile.get("intents", {})
        intents[intent] = intents.get(intent, 0) + 1
        profile["intents"] = intents

        self._save_json(USER_PROFILES_FILE, self.user_profiles)

    def learn(self, lesson):
        """Registra un aprendizaje explicito."""
        learning = {
            "timestamp": time.time(),
            "time_human": time.strftime("%Y-%m-%d %H:%M"),
            "lesson": lesson
        }
        self.learnings.append(learning)
        if len(self.learnings) > 200:
            self.learnings = self.learnings[-200:]
        self._save_json(LEARNINGS_FILE, self.learnings)
        return f"🧬 Aprendizaje registrado: {lesson[:80]}"

    def get_user_profile(self, user_id):
        """Obtiene perfil de un usuario."""
        return self.user_profiles.get(str(user_id), None)

    def get_stats(self):
        """Genera estadisticas del sistema."""
        total = len(self.interactions)
        users = len(self.user_profiles)
        recent = [i for i in self.interactions if time.time() - i["timestamp"] < 86400]

        # Agentes mas usados
        agent_counts = {}
        for i in self.interactions[-100:]:
            a = i.get("agent_used", "unknown")
            agent_counts[a] = agent_counts.get(a, 0) + 1
        top_agents = sorted(agent_counts.items(), key=lambda x: x[1], reverse=True)[:5]

        # Intents mas comunes
        intent_counts = {}
        for i in self.interactions[-100:]:
            intent = i.get("intent", "unknown")
            intent_counts[intent] = intent_counts.get(intent, 0) + 1
        top_intents = sorted(intent_counts.items(), key=lambda x: x[1], reverse=True)[:5]

        report = f"🧬 *ESTIA — Estadisticas del Sistema*\n\n"
        report += f"📊 Total interacciones: {total}\n"
        report += f"👥 Usuarios unicos: {users}\n"
        report += f"📅 Ultimas 24h: {len(recent)}\n"
        report += f"📚 Aprendizajes: {len(self.learnings)}\n\n"

        if top_agents:
            report += "🤖 *Agentes mas usados:*\n"
            for agent, count in top_agents:
                report += f"  • {agent}: {count}\n"

        if top_intents:
            report += "\n🎯 *Intents mas comunes:*\n"
            for intent, count in top_intents:
                report += f"  • {intent}: {count}\n"

        return report

    def get_evolution_report(self):
        """Genera reporte de evolucion del sistema."""
        report = "🧬 *Evolucion del Sistema C8L*\n\n"

        if self.learnings:
            report += "📚 *Ultimos aprendizajes:*\n"
            for l in self.learnings[-5:]:
                report += f"  • [{l['time_human']}] {l['lesson'][:80]}\n"
        else:
            report += "📚 Sin aprendizajes registrados aun.\n"

        report += f"\n📈 *Actividad:*\n"
        report += f"  • Interacciones totales: {len(self.interactions)}\n"
        report += f"  • Usuarios: {len(self.user_profiles)}\n"

        return report

    # --- Utilidades JSON ---

    def _load_json(self, filepath, default):
        try:
            if os.path.exists(filepath):
                with open(filepath, "r", encoding="utf-8") as f:
                    return json.load(f)
        except:
            pass
        return default

    def _save_json(self, filepath, data):
        try:
            with open(filepath, "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
        except Exception as e:
            logger.error(f"Error guardando {filepath}: {e}")
