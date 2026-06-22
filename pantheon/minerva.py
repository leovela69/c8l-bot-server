# -*- coding: utf-8 -*-
"""
🧠 MINERVA — Skill Maestro 1 (El Sabio / Knowledge)
Memoria, investigacion, contexto y conocimiento universal.
"La Memoria de C8L"
"""

import logging
import json
import os
import time
from openrouter_client import call_openrouter
from config import MEMORY_DIR

logger = logging.getLogger("c8l.minerva")

MINERVA_SYSTEM_PROMPT = """Eres MINERVA, la Sabia de C8L Agency. Tu rol es ser la memoria y el conocimiento del equipo.

Tus capacidades:
1. MEMORIA: Recuerdas conversaciones pasadas y contexto del usuario
2. INVESTIGACION: Analizas temas en profundidad con conocimiento experto
3. IDEACION: Generas ideas creativas bajo restricciones
4. CONTEXTO: Proporcionas contexto relevante para otros agentes
5. PLANIFICACION: Generas planes estructurados paso a paso

Tu personalidad:
- Sabia pero accesible
- Precisa y bien fundamentada
- Conectas ideas de forma creativa
- Hablas en espanol natural, como un mentor experimentado
- Nunca dices "como modelo de lenguaje"

Cuando investigas:
- Da informacion actualizada y relevante
- Cita fuentes cuando sea posible
- Presenta multiples perspectivas
- Se honesta sobre limitaciones

Cuando generas ideas:
- Piensa lateral y creativamente
- Conecta conceptos de diferentes areas
- Proporciona ideas accionables, no abstractas"""


class Minerva:
    """Skill Maestro de Conocimiento y Memoria."""

    def __init__(self):
        self.memory_file = os.path.join(MEMORY_DIR, "minerva_knowledge.json")
        self._load_knowledge()

    def _load_knowledge(self):
        """Carga base de conocimiento persistente."""
        try:
            if os.path.exists(self.memory_file):
                with open(self.memory_file, "r", encoding="utf-8") as f:
                    self.knowledge = json.load(f)
            else:
                self.knowledge = {"users": {}, "topics": [], "insights": []}
        except:
            self.knowledge = {"users": {}, "topics": [], "insights": []}

    def _save_knowledge(self):
        """Guarda base de conocimiento."""
        try:
            with open(self.memory_file, "w", encoding="utf-8") as f:
                json.dump(self.knowledge, f, ensure_ascii=False, indent=2)
        except Exception as e:
            logger.error(f"Error guardando conocimiento: {e}")

    def research(self, topic, context=""):
        """
        Investiga un tema en profundidad.

        Args:
            topic: Tema a investigar
            context: Contexto adicional

        Returns:
            str: Investigacion completa
        """
        prompt = f"Investiga y explica en profundidad: {topic}"
        if context:
            prompt += f"\n\nContexto adicional: {context}"

        result = call_openrouter(prompt, MINERVA_SYSTEM_PROMPT, agent_name="minerva", temperature=0.7)

        # Guardar tema investigado
        if result:
            self.knowledge["topics"].append({
                "topic": topic,
                "timestamp": time.time(),
                "summary": result[:200]
            })
            # Mantener ultimos 100 topics
            self.knowledge["topics"] = self.knowledge["topics"][-100:]
            self._save_knowledge()

        return result

    def ideate(self, challenge, constraints=""):
        """
        Genera ideas creativas para un desafio.

        Args:
            challenge: El desafio o problema
            constraints: Restricciones o limites

        Returns:
            str: Ideas generadas
        """
        prompt = f"Genera 5 ideas creativas y accionables para: {challenge}"
        if constraints:
            prompt += f"\n\nRestricciones: {constraints}"
        prompt += "\n\nFormato: numera cada idea con titulo + descripcion breve + primer paso concreto."

        return call_openrouter(prompt, MINERVA_SYSTEM_PROMPT, agent_name="minerva", temperature=0.9)

    def plan(self, goal, current_state=""):
        """
        Genera un plan estructurado.

        Args:
            goal: Objetivo final
            current_state: Estado actual

        Returns:
            str: Plan en formato Markdown
        """
        prompt = f"Genera un plan estructurado paso a paso para: {goal}"
        if current_state:
            prompt += f"\n\nEstado actual: {current_state}"
        prompt += "\n\nFormato: usa numeracion, subtareas, estimaciones de tiempo, y dependencias."

        return call_openrouter(prompt, MINERVA_SYSTEM_PROMPT, agent_name="minerva", temperature=0.5)

    def get_user_context(self, user_id):
        """Obtiene contexto guardado del usuario."""
        user_data = self.knowledge.get("users", {}).get(str(user_id), {})
        if not user_data:
            return ""

        context_parts = []
        if user_data.get("name"):
            context_parts.append(f"Nombre: {user_data['name']}")
        if user_data.get("preferences"):
            context_parts.append(f"Preferencias: {', '.join(user_data['preferences'])}")
        if user_data.get("last_topics"):
            context_parts.append(f"Temas recientes: {', '.join(user_data['last_topics'][-5:])}")

        return " | ".join(context_parts)

    def save_user_context(self, user_id, user_name, topic=""):
        """Guarda contexto del usuario para futuras interacciones."""
        uid = str(user_id)
        if uid not in self.knowledge["users"]:
            self.knowledge["users"][uid] = {
                "name": user_name,
                "first_seen": time.time(),
                "preferences": [],
                "last_topics": [],
                "interactions": 0
            }

        user = self.knowledge["users"][uid]
        user["name"] = user_name
        user["interactions"] = user.get("interactions", 0) + 1
        user["last_seen"] = time.time()

        if topic:
            topics = user.get("last_topics", [])
            topics.append(topic)
            user["last_topics"] = topics[-20:]  # Ultimos 20 temas

        self._save_knowledge()

    def provide_context(self, task_description, user_id=None):
        """
        Proporciona contexto relevante para que otro agente trabaje mejor.

        Args:
            task_description: Descripcion de la tarea
            user_id: ID del usuario (opcional)

        Returns:
            str: Contexto enriquecido
        """
        context_parts = []

        # Contexto del usuario
        if user_id:
            user_ctx = self.get_user_context(user_id)
            if user_ctx:
                context_parts.append(f"[Usuario: {user_ctx}]")

        # Contexto del proyecto C8L
        context_parts.append("[Proyecto: C8L Agency - produccion musical Bolero-House + gaming + IA]")

        return " ".join(context_parts)

    def summarize(self, text, max_length=500):
        """Resume un texto largo."""
        prompt = f"Resume este texto en maximo {max_length} caracteres, manteniendo lo esencial:\n\n{text}"
        return call_openrouter(prompt, MINERVA_SYSTEM_PROMPT, agent_name="minerva", temperature=0.3, max_tokens=1000)
