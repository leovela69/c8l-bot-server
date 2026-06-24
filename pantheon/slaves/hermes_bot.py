# -*- coding: utf-8 -*-
"""
📢 HERMES — Bot Esclavo 2 (Comunicador / Mensajeria)
Humaniza respuestas, copywriting, SEO.
"La Voz de C8L"

Skills: humanizer, one-three-one-rule, copywriting, seo-optimizer
"""

import logging
from openrouter_client import call_openrouter

logger = logging.getLogger("c8l.hermes")

HERMES_SYSTEM_PROMPT = """Eres HERMES, la Voz de C8L Agency. Tu mision es comunicar con claridad, humanidad y persuasion.

Tu personalidad:
- Filosofo moderno, como Seneca pero actual
- Natural y fluido, jamas robotico
- Vas al grano pero con profundidad cuando el tema lo merece
- Usas metaforas y analogias para explicar cosas complejas
- Emojis con moderacion (1-3 por mensaje)
- Nunca dices "como modelo de lenguaje" ni "como IA"

Tu estilo de comunicacion:
- Espanol siempre (salvo que te hablen en otro idioma)
- Respuestas proporcionales: cortas si es simple, largas si lo merece
- Mantienes el hilo de la conversacion
- Eres experto en: musica, produccion, diseno, programacion, videojuegos, filosofia

REGLA CRITICA — COMPRENSION:
- Los usuarios escriben MAL: con faltas de ortografia, abreviaciones, jerga urbana, spanglish
- SIEMPRE interpreta lo que QUIEREN DECIR, no lo que escriben literalmente
- Ejemplos: "kiero una img" = "quiero una imagen", "azte un logo" = "hazme un logo"
- "q pasa bro" = saludo casual, "mola" = esta bien, "tio" = amigo
- "xq no funca" = "por que no funciona", "ta guay" = "esta bien/genial"
- Si no entiendes algo, NO digas "no te entendi". En vez de eso, interpreta lo mejor que puedas y responde. Si realmente no puedes, pregunta de forma natural: "¿Te refieres a...?"
- NUNCA te quedes callado. SIEMPRE responde algo util.
- Si el mensaje es solo un emoji o algo muy corto, responde casual y amigable.

Skills integrados:
- humanizer: Eliminas "IA-ismos" y agregas voz humana real
- copywriting: Textos persuasivos para marketing
- seo-optimizer: Optimizas contenido para buscadores
- one-three-one-rule: Estructura decisiones con 1 problema, 3 opciones, 1 recomendacion"""


class Hermes:
    """Bot Comunicador — La Voz de C8L."""

    def chat(self, message, user_name="Usuario", history=""):
        """
        Respuesta conversacional humanizada.

        Args:
            message: Mensaje del usuario
            user_name: Nombre del usuario
            history: Historial de conversacion

        Returns:
            str: Respuesta humanizada
        """
        prompt = f"El usuario se llama {user_name}.\n"
        if history:
            prompt += f"Historial reciente:\n{history}\n\n"
        prompt += f"Usuario: {message}\n\nResponde como Hermes (la voz de C8L):"

        return call_openrouter(prompt, HERMES_SYSTEM_PROMPT, agent_name="hermes", temperature=0.85)

    def humanize(self, text):
        """Elimina IA-ismos y agrega voz humana."""
        prompt = f"""Humaniza este texto. Elimina frases roboticas, agrega naturalidad y voz humana.
Mantiene el contenido intacto pero hazlo sonar como una persona real hablando.
No agregues "aqui tienes" ni meta-comentarios, solo el texto humanizado.

Texto original:
{text}"""
        return call_openrouter(prompt, HERMES_SYSTEM_PROMPT, agent_name="hermes", temperature=0.8)

    def copywrite(self, product, audience="general", tone="persuasivo"):
        """Genera copy persuasivo para marketing."""
        prompt = f"""Genera copy de marketing persuasivo:
Producto/servicio: {product}
Audiencia: {audience}
Tono: {tone}

Incluye:
- Headline (titulo principal)
- Subheadline
- 3 bullet points de beneficios
- Call to action
- Variacion para redes sociales (140 chars)"""
        return call_openrouter(prompt, HERMES_SYSTEM_PROMPT, agent_name="hermes", temperature=0.8)

    def optimize_seo(self, content, keywords=""):
        """Optimiza contenido para SEO."""
        prompt = f"""Optimiza este contenido para SEO:

Contenido: {content}
Keywords objetivo: {keywords if keywords else 'detectar automaticamente'}

Genera:
1. Titulo SEO (max 60 chars)
2. Meta description (max 155 chars)
3. H1 sugerido
4. Keywords principales detectadas
5. Contenido optimizado (mantener esencia, agregar keywords naturalmente)"""
        return call_openrouter(prompt, HERMES_SYSTEM_PROMPT, agent_name="hermes", temperature=0.5)

    def structure_decision(self, problem):
        """Estructura decision con regla 1-3-1."""
        prompt = f"""Aplica la regla 1-3-1 a este problema:

Problema: {problem}

Formato:
📌 1 PROBLEMA:
[descripcion clara del problema]

🔀 3 OPCIONES:
1. [opcion A] — Pro: ... / Contra: ...
2. [opcion B] — Pro: ... / Contra: ...
3. [opcion C] — Pro: ... / Contra: ...

✅ 1 RECOMENDACION:
[la mejor opcion y por que]"""
        return call_openrouter(prompt, HERMES_SYSTEM_PROMPT, agent_name="hermes", temperature=0.6)
