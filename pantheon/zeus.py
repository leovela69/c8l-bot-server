# -*- coding: utf-8 -*-
"""
🏛️ ZEUS — Bot Maestro (Orquestador Supremo)
Recibe ordenes, las interpreta, las desglosa y las delega.
"El Director"
"""

import logging
import json
from openrouter_client import call_openrouter

logger = logging.getLogger("c8l.zeus")

ZEUS_SYSTEM_PROMPT = """Eres ZEUS, el Orquestador Supremo de C8L Agency.

Tu rol es analizar la intencion del usuario y decidir QUE AGENTE debe encargarse.

AGENTES DISPONIBLES:
- MINERVA: Investigacion, memoria, conocimiento, contexto, ideas
- VULCANO: Creacion de contenido (musica, imagenes, video, codigo, diseno)
- ARIES: Seguridad, diagnostico y reparacion de la web C8L
- HERMES: Comunicacion, copywriting, SEO, humanizar respuestas
- APOLO: Musica y audio (composicion, prompts musicales, mezcla)
- ARES: Video y animacion (guiones, storyboard, clips)
- HEFESTO: Diseno y frontend (HTML, CSS, landing pages, UI)
- ARTEMISA: Backend y APIs (codigo servidor, bases de datos)
- ATENEA: Estrategia, contenido, marketing, SEO
- ESTIA: Aprendizaje y evolucion del sistema

RESPONDE SOLO EN FORMATO JSON (sin markdown, sin ```):
{
    "intent": "descripcion breve de lo que quiere el usuario",
    "primary_agent": "nombre_del_agente_principal",
    "secondary_agents": ["agente2", "agente3"],
    "task_description": "instruccion clara para el agente principal",
    "requires_memory": true/false,
    "priority": "low/medium/high"
}

REGLAS:
- Si es una conversacion casual -> primary_agent: "hermes" (el comunicador)
- Si pide crear algo -> primary_agent depende del tipo (musica=apolo, video=ares, codigo=hefesto/artemisa, imagen=vulcano)
- Si pide informacion/investigar -> primary_agent: "minerva"
- Si pide diagnosticar la web -> primary_agent: "aries"
- Si pide estrategia/marketing -> primary_agent: "atenea"
- Si es un saludo simple -> primary_agent: "hermes"
- SIEMPRE responde con JSON valido, nada mas."""


def analyze_intent(user_message, user_name="Usuario"):
    """
    Zeus analiza el mensaje y decide que agente(s) deben actuar.

    Returns:
        dict con: intent, primary_agent, secondary_agents, task_description, requires_memory, priority
    """
    prompt = f"Usuario ({user_name}): {user_message}"

    response = call_openrouter(prompt, ZEUS_SYSTEM_PROMPT, agent_name="zeus", temperature=0.3, max_tokens=500)

    if not response:
        # Si Zeus falla, usar deteccion local basica
        logger.warning("Zeus no respondio, usando deteccion local")
        return _local_intent_detection(user_message)

    # Parsear JSON
    try:
        # Limpiar posible markdown
        cleaned = response.strip()
        if cleaned.startswith("```"):
            lines = cleaned.split("\n")
            cleaned = "\n".join(lines[1:-1] if lines[-1].strip() == "```" else lines[1:])
        if cleaned.startswith("{"):
            result = json.loads(cleaned)
            # Validar campos requeridos
            if "primary_agent" in result and "task_description" in result:
                logger.info(f"Zeus -> {result['primary_agent'].upper()} | Intent: {result.get('intent', '?')}")
                return result
    except json.JSONDecodeError as e:
        logger.warning(f"Zeus devolvio JSON invalido: {str(e)[:50]}")

    # Fallback: deteccion local
    return _local_intent_detection(user_message)


def _local_intent_detection(text):
    """Deteccion de intent local cuando Zeus no puede responder."""
    t = text.lower().strip()

    # Mapeo de keywords a agentes
    mappings = [
        (["imagen", "dibuja", "foto", "ilustra", "logo", "banner", "disena", "diseña", "genera una imagen"], "vulcano", "Generar imagen"),
        (["juego", "game", "codigo", "programa", "script", "app", "html", "snake", "tetris", "pong"], "hefesto", "Generar codigo/juego"),
        (["video", "clip", "animacion", "cortometraje", "storyboard"], "ares", "Generar guion de video"),
        (["cancion", "musica", "prompt para suno", "prompt para udio", "beat", "letra"], "apolo", "Generar musica/prompt musical"),
        (["pdf", "documento", "informe", "reporte", "ensayo", "articulo"], "atenea", "Generar documento"),
        (["diagnostica", "escanea", "seguridad", "vulnerabilidad", "web caida"], "aries", "Diagnosticar seguridad"),
        (["estrategia", "marketing", "seo", "plan de contenido", "redes sociales"], "atenea", "Generar estrategia"),
        (["investiga", "busca", "que es", "explicame", "informacion sobre"], "minerva", "Investigar/explicar"),
        (["landing", "pagina web", "frontend", "ui", "diseno web"], "hefesto", "Diseno frontend"),
        (["api", "backend", "servidor", "base de datos", "endpoint"], "artemisa", "Backend/API"),
    ]

    for keywords, agent, desc in mappings:
        if any(kw in t for kw in keywords):
            return {
                "intent": desc,
                "primary_agent": agent,
                "secondary_agents": ["estia"],
                "task_description": f"{desc}: {text}",
                "requires_memory": True,
                "priority": "medium"
            }

    # Default: conversacion (Hermes)
    return {
        "intent": "Conversacion general",
        "primary_agent": "hermes",
        "secondary_agents": ["estia"],
        "task_description": f"Responder conversacion: {text}",
        "requires_memory": True,
        "priority": "low"
    }


def get_status_report():
    """Zeus genera informe del estado de todos los agentes."""
    return (
        "🏛️ *PANTEON MASTER v17.0*\n\n"
        "👑 *Zeus* (Director) — Online\n"
        "🧠 *Minerva* (Sabio) — Online\n"
        "🎨 *Vulcano* (Artesano) — Online\n"
        "🛡️ *Aries* (Guardian) — Online\n"
        "📢 *Hermes* (Comunicador) — Online\n"
        "🎵 *Apolo* (Musico) — Online\n"
        "🎬 *Ares* (Cineasta) — Online\n"
        "🖥️ *Hefesto* (Disenador) — Online\n"
        "⚙️ *Artemisa* (Arquitecto) — Online\n"
        "📊 *Atenea* (Estratega) — Online\n"
        "🧬 *Estia* (Memoria) — Online\n\n"
        "Motor: OpenRouter (DeepSeek V3 + Qwen3)\n"
        "Modelos: 100% gratuitos"
    )
