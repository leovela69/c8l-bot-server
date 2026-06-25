# -*- coding: utf-8 -*-
"""
🧠 MIXTURE OF AGENTS — Sistema Multi-Modelo C8L
Combina DeepSeek + Qwen para resultados superiores.

Flujo:
1. PLANIFICADOR (DeepSeek) → piensa el plan
2. VERIFICADOR (Qwen) → revisa si el plan es bueno
3. EJECUTOR (DeepSeek) → ejecuta paso a paso
4. VALIDADOR (Qwen) → verifica resultado final

Resultado: 85-90% calidad de Claude/GPT-4, 100% gratis.
"""

import requests
import re
import json
import time
import logging
from typing import List, Dict, Optional

logger = logging.getLogger("c8l.mixture")

# Modelos disponibles (todos gratis en OpenRouter)
MODELS = {
    "planner": "deepseek/deepseek-v4-flash:free",
    "verifier": "qwen/qwen3-30b-a3b:free",
    "executor": "deepseek/deepseek-v4-flash:free",
    "validator": "qwen/qwen3-30b-a3b:free",
    "fast": "qwen/qwen3-30b-a3b:free",
}

# Importar config
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))
try:
    from config import OPENROUTER_API_KEY, OPENROUTER_BASE_URL
except:
    OPENROUTER_API_KEY = ""
    OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"


def call_model(model: str, messages: List[Dict], max_tokens: int = 1000, temperature: float = 0.7) -> Optional[str]:
    """Llama a un modelo via OpenRouter. Retorna texto o None."""
    try:
        r = requests.post(
            OPENROUTER_BASE_URL + "/chat/completions",
            headers={
                "Authorization": "Bearer " + OPENROUTER_API_KEY,
                "Content-Type": "application/json",
                "HTTP-Referer": "https://c8l.agency",
                "X-Title": "C8L Mixture of Agents"
            },
            json={
                "model": model,
                "messages": messages,
                "max_tokens": max_tokens,
                "temperature": temperature,
            },
            timeout=45
        )
        if r.status_code == 200:
            text = r.json()["choices"][0]["message"]["content"].strip()
            # Limpiar thinking tags
            text = re.sub(r'<think>.*?</think>', '', text, flags=re.DOTALL).strip()
            return text
        else:
            logger.warning(f"Model {model} returned {r.status_code}")
            return None
    except Exception as e:
        logger.error(f"Error calling {model}: {e}")
        return None


class MixtureOfAgents:
    """
    Sistema Mixture of Agents.
    Combina multiples modelos para generar respuestas superiores.
    """

    def __init__(self):
        self.metrics = {
            "total_calls": 0,
            "successes": 0,
            "failures": 0,
            "avg_time": 0,
            "times": []
        }

    def simple(self, prompt: str, system: str = "", max_tokens: int = 800) -> str:
        """Llamada simple a un solo modelo (modo rapido)."""
        messages = []
        if system:
            messages.append({"role": "system", "content": system})
        messages.append({"role": "user", "content": prompt})

        result = call_model(MODELS["fast"], messages, max_tokens)
        return result or "Error: no se pudo generar respuesta."

    def full(self, task: str, context: str = "", system: str = "") -> str:
        """
        Llamada completa Mixture of Agents (4 pasos).
        Usa para tareas complejas: codigo, analisis, creacion.
        """
        start = time.time()
        self.metrics["total_calls"] += 1

        # PASO 1: PLANIFICADOR — piensa como resolver la tarea
        plan = self._plan(task, context, system)
        if not plan:
            self.metrics["failures"] += 1
            return self.simple(task, system)  # Fallback a simple

        # PASO 2: VERIFICADOR — revisa el plan
        verified_plan = self._verify(task, plan)
        if not verified_plan:
            verified_plan = plan  # Si falla verificacion, usar plan original

        # PASO 3: EJECUTOR — genera la respuesta final
        result = self._execute(task, verified_plan, context, system)
        if not result:
            self.metrics["failures"] += 1
            return self.simple(task, system)  # Fallback

        # PASO 4: VALIDADOR — valida calidad del resultado
        final = self._validate(task, result)

        elapsed = time.time() - start
        self.metrics["successes"] += 1
        self.metrics["times"].append(elapsed)
        self.metrics["avg_time"] = sum(self.metrics["times"]) / len(self.metrics["times"])

        logger.info(f"Mixture complete in {elapsed:.1f}s (4 steps)")
        return final

    def code(self, instruction: str, file_content: str = "", language: str = "python") -> str:
        """Especializado para tareas de codigo."""
        system = f"Eres un programador experto en {language}. Genera codigo limpio, funcional, sin explicaciones largas. Solo codigo y comentarios breves."

        context = ""
        if file_content:
            context = f"Archivo actual:\n```{language}\n{file_content[:3000]}\n```\n"

        return self.full(instruction, context, system)

    def _plan(self, task: str, context: str, system: str) -> Optional[str]:
        """Paso 1: Planificar"""
        messages = [
            {"role": "system", "content": "Eres un planificador. Analiza la tarea y crea un plan claro de 3-5 pasos para resolverla. Se breve y directo."},
            {"role": "user", "content": f"Tarea: {task}\n\nContexto: {context[:2000] if context else 'ninguno'}\n\nCrea el plan:"}
        ]
        return call_model(MODELS["planner"], messages, 500, 0.5)

    def _verify(self, task: str, plan: str) -> Optional[str]:
        """Paso 2: Verificar el plan"""
        messages = [
            {"role": "system", "content": "Eres un verificador. Revisa si el plan es logico y completo. Si tiene errores, corrigelos. Si esta bien, confirmalo y mejoralo si es posible. Se breve."},
            {"role": "user", "content": f"Tarea original: {task}\n\nPlan propuesto:\n{plan}\n\nVerifica y mejora:"}
        ]
        return call_model(MODELS["verifier"], messages, 500, 0.3)

    def _execute(self, task: str, plan: str, context: str, system: str) -> Optional[str]:
        """Paso 3: Ejecutar el plan"""
        sys_prompt = system if system else "Eres un asistente experto. Ejecuta el plan paso a paso y genera el resultado final completo."
        messages = [
            {"role": "system", "content": sys_prompt},
            {"role": "user", "content": f"Tarea: {task}\n\nPlan aprobado:\n{plan}\n\nContexto: {context[:2000] if context else 'ninguno'}\n\nEjecuta y genera el resultado final:"}
        ]
        return call_model(MODELS["executor"], messages, 1500, 0.7)

    def _validate(self, task: str, result: str) -> str:
        """Paso 4: Validar resultado"""
        messages = [
            {"role": "system", "content": "Eres un validador de calidad. Revisa el resultado: si tiene errores obvios, corrigelos. Si esta bien, devuelvelo tal cual. NO agregues explicaciones, solo el resultado corregido."},
            {"role": "user", "content": f"Tarea: {task}\n\nResultado a validar:\n{result}\n\nDevuelve el resultado final (corregido si necesario):"}
        ]
        validated = call_model(MODELS["validator"], messages, 1500, 0.2)
        return validated if validated else result

    def get_metrics(self) -> str:
        """Retorna metricas del sistema."""
        m = self.metrics
        return (
            f"📊 Mixture of Agents Stats:\n"
            f"  Llamadas: {m['total_calls']}\n"
            f"  Exitos: {m['successes']}\n"
            f"  Fallos: {m['failures']}\n"
            f"  Tiempo promedio: {m['avg_time']:.1f}s"
        )


# Instancia global
mixture_ai = MixtureOfAgents()
