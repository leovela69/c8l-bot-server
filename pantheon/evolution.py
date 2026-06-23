# -*- coding: utf-8 -*-
"""
🧬 EVOLUTION ENGINE — Sistema de auto-evolución del bot
El bot aprende de feedback (👍👎) y mejora automáticamente.

Flujo:
1. Bot genera contenido (imagen, texto, etc)
2. Muestra botones 👍👎
3. Si 👎: guarda qué se pidió y qué falló
4. Próxima vez que pidan algo similar: usa la lección aprendida
5. Auto-genera reglas nuevas periódicamente

Archivos:
- data/memory/evolution_feedback.json — historial de 👍👎
- data/memory/evolution_rules.json — reglas aprendidas
- data/memory/evolution_stats.json — estadísticas
"""

import json
import os
import time
import logging
from config import MEMORY_DIR

logger = logging.getLogger("c8l.evolution")

FEEDBACK_FILE = os.path.join(MEMORY_DIR, "evolution_feedback.json")
RULES_FILE = os.path.join(MEMORY_DIR, "evolution_rules.json")
STATS_FILE = os.path.join(MEMORY_DIR, "evolution_stats.json")


class EvolutionEngine:
    """Motor de auto-evolución basado en feedback."""

    def __init__(self):
        self.feedback = self._load(FEEDBACK_FILE, [])
        self.rules = self._load(RULES_FILE, [])
        self.stats = self._load(STATS_FILE, {
            "total_positive": 0,
            "total_negative": 0,
            "total_generations": 0,
            "rules_created": 0,
            "last_evolution": 0,
        })

    # ------------------------------------------------------------------
    # FEEDBACK
    # ------------------------------------------------------------------

    def record_generation(self, chat_id, prompt, agent, result_type):
        """Registra que se generó algo (antes del feedback)."""
        entry = {
            "id": f"{chat_id}_{int(time.time())}",
            "timestamp": time.time(),
            "chat_id": str(chat_id),
            "prompt": prompt[:200],
            "agent": agent,
            "result_type": result_type,
            "feedback": None,  # Se llena cuando el usuario da 👍👎
            "feedback_text": None,
        }
        self.feedback.append(entry)
        self.stats["total_generations"] += 1

        # Mantener últimos 1000
        if len(self.feedback) > 1000:
            self.feedback = self.feedback[-1000:]

        self._save(FEEDBACK_FILE, self.feedback)
        self._save(STATS_FILE, self.stats)
        return entry["id"]

    def record_feedback(self, chat_id, is_positive, feedback_text=""):
        """Registra feedback 👍👎 para la última generación del usuario."""
        # Buscar última generación de este chat sin feedback
        for entry in reversed(self.feedback):
            if entry["chat_id"] == str(chat_id) and entry["feedback"] is None:
                entry["feedback"] = "positive" if is_positive else "negative"
                entry["feedback_text"] = feedback_text
                entry["feedback_time"] = time.time()

                if is_positive:
                    self.stats["total_positive"] += 1
                else:
                    self.stats["total_negative"] += 1
                    # Si es negativo, intentar crear regla
                    self._try_create_rule(entry)

                self._save(FEEDBACK_FILE, self.feedback)
                self._save(STATS_FILE, self.stats)
                return True
        return False

    # ------------------------------------------------------------------
    # REGLAS AUTO-GENERADAS
    # ------------------------------------------------------------------

    def _try_create_rule(self, negative_entry):
        """Intenta crear una regla a partir de feedback negativo."""
        prompt = negative_entry["prompt"].lower()
        agent = negative_entry["agent"]
        feedback_text = negative_entry.get("feedback_text", "")

        # Buscar patrones repetidos de error
        similar_negatives = [
            f for f in self.feedback
            if f["feedback"] == "negative"
            and f["agent"] == agent
            and self._similarity(f["prompt"].lower(), prompt) > 0.3
        ]

        # Si hay 2+ errores similares, crear regla
        if len(similar_negatives) >= 2:
            rule = {
                "id": f"rule_{int(time.time())}",
                "created": time.time(),
                "trigger_keywords": self._extract_keywords(prompt),
                "agent": agent,
                "problem": f"Users got bad results when asking for: {prompt[:100]}",
                "solution": feedback_text or "Needs better prompt interpretation",
                "times_applied": 0,
                "examples_negative": [e["prompt"][:100] for e in similar_negatives[-3:]],
            }

            # No duplicar reglas similares
            for existing in self.rules:
                if self._similarity(
                    " ".join(existing["trigger_keywords"]),
                    " ".join(rule["trigger_keywords"])
                ) > 0.5:
                    return  # Ya existe una regla similar

            self.rules.append(rule)
            self.stats["rules_created"] += 1
            self._save(RULES_FILE, self.rules)
            self._save(STATS_FILE, self.stats)
            logger.info(f"🧬 Nueva regla creada: {rule['trigger_keywords']}")

    def get_relevant_rules(self, prompt, agent=""):
        """Obtiene reglas relevantes para un prompt dado."""
        relevant = []
        prompt_lower = prompt.lower()

        for rule in self.rules:
            # Verificar si algún keyword de la regla está en el prompt
            keywords = rule.get("trigger_keywords", [])
            if any(kw in prompt_lower for kw in keywords):
                if not agent or rule.get("agent", "") == agent:
                    relevant.append(rule)
                    rule["times_applied"] = rule.get("times_applied", 0) + 1

        if relevant:
            self._save(RULES_FILE, self.rules)

        return relevant

    def get_evolution_context(self, prompt, agent=""):
        """Genera contexto extra basado en reglas aprendidas.
        Esto se inyecta en los prompts del bot para mejorarlo."""
        rules = self.get_relevant_rules(prompt, agent)
        if not rules:
            return ""

        context = "\n[LEARNED RULES - Apply these based on past feedback]:\n"
        for rule in rules[:3]:  # Max 3 reglas
            context += f"- Problem: {rule['problem'][:80]}\n"
            context += f"  Solution: {rule['solution'][:80]}\n"
        return context

    # ------------------------------------------------------------------
    # ESTADÍSTICAS
    # ------------------------------------------------------------------

    def get_stats_report(self):
        """Genera reporte de evolución."""
        total = self.stats.get("total_generations", 0)
        pos = self.stats.get("total_positive", 0)
        neg = self.stats.get("total_negative", 0)
        rules = len(self.rules)
        rated = pos + neg

        satisfaction = (pos / rated * 100) if rated > 0 else 0

        report = "🧬 *AUTO-EVOLUCIÓN — Estado*\n\n"
        report += f"📊 Generaciones totales: {total}\n"
        report += f"👍 Positivos: {pos}\n"
        report += f"👎 Negativos: {neg}\n"
        report += f"📈 Satisfacción: {satisfaction:.0f}%\n"
        report += f"🧠 Reglas aprendidas: {rules}\n\n"

        if self.rules:
            report += "*Últimas reglas aprendidas:*\n"
            for rule in self.rules[-5:]:
                kws = ", ".join(rule["trigger_keywords"][:3])
                report += f"  • [{kws}]: {rule['solution'][:50]}\n"

        # Agentes con más errores
        agent_errors = {}
        for f in self.feedback:
            if f["feedback"] == "negative":
                a = f.get("agent", "?")
                agent_errors[a] = agent_errors.get(a, 0) + 1
        if agent_errors:
            report += "\n*Agentes que más fallan:*\n"
            for agent, count in sorted(agent_errors.items(), key=lambda x: x[1], reverse=True)[:3]:
                report += f"  • {agent}: {count} errores\n"

        return report

    def get_satisfaction_rate(self):
        """Retorna porcentaje de satisfacción."""
        pos = self.stats.get("total_positive", 0)
        neg = self.stats.get("total_negative", 0)
        total = pos + neg
        if total == 0:
            return 100
        return int(pos / total * 100)

    # ------------------------------------------------------------------
    # UTILIDADES
    # ------------------------------------------------------------------

    def _extract_keywords(self, text):
        """Extrae keywords significativas de un texto."""
        # Palabras a ignorar
        stopwords = {"de", "la", "el", "en", "un", "una", "con", "para", "por",
                    "que", "los", "las", "del", "al", "es", "y", "o", "a",
                    "imagen", "crear", "dame", "quiero", "haz", "hazme", "genera",
                    "me", "mi", "tu", "se", "no", "si", "como", "mas", "muy"}
        words = text.lower().split()
        keywords = [w for w in words if w not in stopwords and len(w) > 2]
        return keywords[:5]  # Max 5 keywords

    def _similarity(self, text1, text2):
        """Similitud simple basada en palabras compartidas."""
        words1 = set(text1.lower().split())
        words2 = set(text2.lower().split())
        if not words1 or not words2:
            return 0
        intersection = words1 & words2
        union = words1 | words2
        return len(intersection) / len(union)

    def _load(self, filepath, default):
        try:
            if os.path.exists(filepath):
                with open(filepath, "r", encoding="utf-8") as f:
                    return json.load(f)
        except:
            pass
        return default

    def _save(self, filepath, data):
        try:
            with open(filepath, "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
        except Exception as e:
            logger.error(f"Error guardando {filepath}: {e}")


# Instancia global
evolution = EvolutionEngine()
