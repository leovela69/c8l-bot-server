# -*- coding: utf-8 -*-
"""
📊 ATENEA — Bot Esclavo 7 (Estrategia / Contenido)
Genera estrategias de contenido, planes de marketing y SEO.
"La Estratega de C8L"

Skills: one-three-one-rule, copywriting, seo-optimizer, ideation
"""

import logging
from openrouter_client import call_openrouter

logger = logging.getLogger("c8l.atenea")

ATENEA_SYSTEM_PROMPT = """Eres ATENEA, la Estratega de C8L Agency. Experta en marketing digital, contenido y SEO.

Tu expertise:
- Marketing digital (redes sociales, email, contenido)
- SEO tecnico y de contenido
- Estrategia de marca
- Copywriting persuasivo
- Analisis de competencia
- Planificacion editorial
- Growth hacking

Contexto C8L Agency:
- Produccion musical Bolero-House
- Gaming y esports
- Creacion con IA
- Audiencia: creadores digitales, gamers, amantes de musica

Tu estilo:
- Estrategica y analitica
- Datos + creatividad
- Siempre accionable (nada abstracto)
- Formato claro con bullets y secciones"""



class Atenea:
    """Bot Estratega — Marketing y contenido."""

    def create_strategy(self, objective, platform="general"):
        """Genera estrategia de marketing/contenido."""
        prompt = f"""Genera estrategia completa para:
Objetivo: {objective}
Plataforma: {platform}

FORMATO:
🎯 OBJETIVO
[claro y medible]

📊 ANALISIS
- Audiencia target
- Competencia
- Oportunidades

📋 PLAN DE ACCION (30 dias)
Semana 1: ...
Semana 2: ...
Semana 3: ...
Semana 4: ...

📝 CONTENIDO SUGERIDO
- 5 ideas de posts/contenido

📈 METRICAS DE EXITO
- KPIs a medir
- Herramientas recomendadas

💡 QUICK WINS (acciones inmediatas)"""

        return call_openrouter(prompt, ATENEA_SYSTEM_PROMPT,
                               agent_name="atenea", temperature=0.7, max_tokens=4000)

    def create_article(self, topic, seo_focus=True):
        """Genera articulo SEO optimizado."""
        prompt = f"""Genera un articulo profesional{'  optimizado para SEO' if seo_focus else ''}:
Tema: {topic}

Incluye:
- Titulo SEO (max 60 chars)
- Meta description (max 155 chars)
- H1, H2, H3 estructurados
- Contenido minimo 800 palabras
- Keywords naturalmente integradas
- Call to action final
- Links internos sugeridos"""

        return call_openrouter(prompt, ATENEA_SYSTEM_PROMPT,
                               agent_name="atenea", temperature=0.7, max_tokens=6000)

    def generate_content_calendar(self, niche, days=7):
        """Genera calendario editorial."""
        prompt = f"""Genera calendario de contenido para {days} dias:
Nicho: {niche}

Para cada dia incluye:
- Tipo de contenido (post, reel, story, articulo)
- Titulo/tema
- Plataforma
- Hora sugerida de publicacion
- Hashtags (5-10)
- CTA sugerido"""

        return call_openrouter(prompt, ATENEA_SYSTEM_PROMPT,
                               agent_name="atenea", temperature=0.8)

    def analyze_competitor(self, competitor):
        """Analiza un competidor."""
        prompt = f"""Analiza como competidor: {competitor}

Incluye:
- Fortalezas
- Debilidades
- Estrategia de contenido que usan
- Oportunidades que no explotan
- Como C8L puede diferenciarse"""

        return call_openrouter(prompt, ATENEA_SYSTEM_PROMPT,
                               agent_name="atenea", temperature=0.6)

    def generate_pdf_content(self, topic):
        """Genera contenido profesional para PDF/documento."""
        prompt = f"""Genera un documento profesional completo:
Tema: {topic}

Formato:
- Titulo principal
- Introduccion
- 3-5 secciones con subtitulos en MAYUSCULAS
- Conclusion
- Minimo 600 palabras
- Tono profesional pero accesible"""

        return call_openrouter(prompt, ATENEA_SYSTEM_PROMPT,
                               agent_name="atenea", temperature=0.7, max_tokens=4000)
