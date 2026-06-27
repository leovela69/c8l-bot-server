# -*- coding: utf-8 -*-
"""
📰 PERIODISTA — Analizador de noticias con IA
Usa Groq/LLama para extraer datos clave y generar insights.
El bot APRENDE de cada noticia para misiones futuras.
"""

import os
import json
import aiohttp
from typing import List, Dict, Optional
from datetime import datetime

from periodista.config import NEWS_CATEGORIES


# Groq API config
GROQ_API_KEY = os.environ.get("GROQ_API_KEY", "")
GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"
GROQ_MODEL = "llama-3.3-70b-versatile"


async def analyze_news_with_ai(articles: List[Dict]) -> Dict:
    """
    Envía las noticias a la IA para:
    1. Resumir cada noticia en 1 línea (español)
    2. Extraer datos clave (cifras, nombres, tendencias)
    3. Detectar patrones o conexiones entre noticias
    4. Clasificar importancia (1-10)
    
    Retorna: {
        "summaries": [{title, summary, importance, key_data}],
        "patterns": [str],
        "insights": str,
    }
    """
    if not GROQ_API_KEY or not articles:
        # Sin IA, hacer resumen básico
        return _basic_analysis(articles)

    # Preparar contexto para la IA
    news_text = ""
    for i, article in enumerate(articles[:8], 1):
        news_text += f"{i}. [{article.get('category_label', 'General')}] {article['title']}\n"
        if article.get('description'):
            news_text += f"   {article['description'][:150]}\n"
        news_text += f"   Fuente: {article.get('source', 'N/A')}\n\n"

    prompt = f"""Eres el analista de noticias del bot C8L. Analiza estas noticias y responde en JSON.

NOTICIAS HOY:
{news_text}

Responde SOLO con este JSON (sin markdown, sin ```):
{{
  "summaries": [
    {{
      "index": 1,
      "summary": "resumen en 1 línea corta en español (máx 80 chars)",
      "importance": 7,
      "key_data": ["dato clave 1", "dato clave 2"]
    }}
  ],
  "patterns": ["patrón o conexión entre noticias si la hay"],
  "insights": "una frase sobre qué significa todo esto para el mundo hoy",
  "trending_topics": ["tema1", "tema2", "tema3"]
}}"""

    try:
        async with aiohttp.ClientSession() as session:
            headers = {
                "Authorization": f"Bearer {GROQ_API_KEY}",
                "Content-Type": "application/json",
            }
            payload = {
                "model": GROQ_MODEL,
                "messages": [
                    {"role": "system", "content": "Eres un analista de noticias. Responde SOLO en JSON válido, sin markdown."},
                    {"role": "user", "content": prompt},
                ],
                "temperature": 0.3,
                "max_tokens": 1500,
            }

            async with session.post(GROQ_URL, headers=headers, json=payload, timeout=aiohttp.ClientTimeout(total=30)) as resp:
                if resp.status != 200:
                    return _basic_analysis(articles)

                data = await resp.json()
                content = data["choices"][0]["message"]["content"].strip()

                # Limpiar posibles markdown wrappers
                if content.startswith("```"):
                    content = content.split("\n", 1)[1] if "\n" in content else content[3:]
                    if content.endswith("```"):
                        content = content[:-3]

                result = json.loads(content)

                # Merge con artículos originales
                for i, summary in enumerate(result.get("summaries", [])):
                    idx = summary.get("index", i + 1) - 1
                    if idx < len(articles):
                        articles[idx]["ai_summary"] = summary.get("summary", articles[idx]["title"])
                        articles[idx]["importance"] = summary.get("importance", 5)
                        articles[idx]["key_data"] = summary.get("key_data", [])

                return {
                    "articles": articles,
                    "patterns": result.get("patterns", []),
                    "insights": result.get("insights", ""),
                    "trending_topics": result.get("trending_topics", []),
                    "analyzed_at": datetime.utcnow().isoformat(),
                }

    except Exception as e:
        return _basic_analysis(articles)


def _basic_analysis(articles: List[Dict]) -> Dict:
    """Análisis básico sin IA (fallback)."""
    for article in articles:
        article["ai_summary"] = article["title"][:80]
        article["importance"] = 5
        article["key_data"] = []

    return {
        "articles": articles,
        "patterns": [],
        "insights": "",
        "trending_topics": [],
        "analyzed_at": datetime.utcnow().isoformat(),
    }


def extract_learnings(analysis: Dict) -> Dict:
    """
    Extrae lo que el bot debe APRENDER de este ciclo de noticias.
    Esto alimenta a Zeus, Minerva y el sistema de evolución.
    """
    learnings = {
        "timestamp": datetime.utcnow().isoformat(),
        "facts": [],         # Hechos concretos (cifras, nombres, eventos)
        "trends": [],        # Tendencias detectadas
        "world_state": {},   # Estado del mundo resumido
    }

    for article in analysis.get("articles", []):
        # Extraer hechos
        for data_point in article.get("key_data", []):
            learnings["facts"].append({
                "fact": data_point,
                "category": article.get("category_id", "general"),
                "source": article.get("source", ""),
                "date": article.get("fetched_at", ""),
            })

    # Tendencias
    learnings["trends"] = analysis.get("trending_topics", [])

    # Estado del mundo (resumen de alto nivel)
    if analysis.get("insights"):
        learnings["world_state"]["summary"] = analysis["insights"]

    # Patrones
    if analysis.get("patterns"):
        learnings["world_state"]["patterns"] = analysis["patterns"]

    return learnings
