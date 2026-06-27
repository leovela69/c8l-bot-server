# -*- coding: utf-8 -*-
"""
📰 PERIODISTA — Sistema de memoria / aprendizaje
Guarda conocimiento del mundo para que Zeus y Minerva lo usen.
El bot se vuelve más inteligente cada día.
"""

import os
import json
from datetime import datetime, timedelta
from typing import Dict, List, Optional

from periodista.config import (
    KNOWLEDGE_DIR, WORLD_NEWS_FILE, ECONOMY_FILE,
    TRENDS_FILE, PATTERNS_FILE, MAX_STORED_NEWS, MAX_PATTERNS,
)


def _ensure_dirs():
    """Crea directorios si no existen."""
    os.makedirs(KNOWLEDGE_DIR, exist_ok=True)


def _load_json(filepath: str) -> List | Dict:
    """Carga un archivo JSON o retorna estructura vacía."""
    _ensure_dirs()
    if os.path.exists(filepath):
        try:
            with open(filepath, "r", encoding="utf-8") as f:
                return json.load(f)
        except (json.JSONDecodeError, IOError):
            pass
    return []


def _save_json(filepath: str, data):
    """Guarda datos en archivo JSON."""
    _ensure_dirs()
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


# ===========================================================================
# GUARDAR NOTICIAS
# ===========================================================================

def save_news(articles: List[Dict]):
    """
    Guarda noticias en el archivo de conocimiento del mundo.
    Mantiene máximo MAX_STORED_NEWS entradas (las más viejas se borran).
    """
    stored = _load_json(WORLD_NEWS_FILE)
    if not isinstance(stored, list):
        stored = []

    for article in articles:
        entry = {
            "title": article.get("ai_summary") or article.get("title", ""),
            "category": article.get("category_id", "general"),
            "source": article.get("source", ""),
            "importance": article.get("importance", 5),
            "key_data": article.get("key_data", []),
            "timestamp": article.get("fetched_at") or datetime.utcnow().isoformat(),
        }
        stored.append(entry)

    # Limitar tamaño
    if len(stored) > MAX_STORED_NEWS:
        stored = stored[-MAX_STORED_NEWS:]

    _save_json(WORLD_NEWS_FILE, stored)


# ===========================================================================
# GUARDAR TENDENCIAS
# ===========================================================================

def save_trends(trending_topics: List[str]):
    """
    Guarda tendencias detectadas. Acumula conteo para detectar
    temas que se repiten (el bot detecta patrones).
    """
    trends = _load_json(TRENDS_FILE)
    if not isinstance(trends, dict):
        trends = {"topics": {}, "last_updated": ""}

    today = datetime.utcnow().strftime("%Y-%m-%d")

    for topic in trending_topics:
        topic_lower = topic.lower().strip()
        if topic_lower in trends["topics"]:
            trends["topics"][topic_lower]["count"] += 1
            trends["topics"][topic_lower]["last_seen"] = today
        else:
            trends["topics"][topic_lower] = {
                "count": 1,
                "first_seen": today,
                "last_seen": today,
            }

    trends["last_updated"] = datetime.utcnow().isoformat()

    # Limpiar trends viejos (más de 30 días sin aparecer)
    cutoff = (datetime.utcnow() - timedelta(days=30)).strftime("%Y-%m-%d")
    trends["topics"] = {
        k: v for k, v in trends["topics"].items()
        if v["last_seen"] >= cutoff
    }

    _save_json(TRENDS_FILE, trends)


# ===========================================================================
# GUARDAR PATRONES APRENDIDOS
# ===========================================================================

def save_patterns(patterns: List[str]):
    """
    Guarda patrones/conexiones que la IA detectó entre noticias.
    Estos patrones alimentan la evolución autónoma del bot.
    """
    if not patterns:
        return

    stored = _load_json(PATTERNS_FILE)
    if not isinstance(stored, list):
        stored = []

    for pattern in patterns:
        stored.append({
            "pattern": pattern,
            "detected_at": datetime.utcnow().isoformat(),
        })

    # Limitar
    if len(stored) > MAX_PATTERNS:
        stored = stored[-MAX_PATTERNS:]

    _save_json(PATTERNS_FILE, stored)


# ===========================================================================
# GUARDAR DATOS ECONÓMICOS
# ===========================================================================

def save_economy_data(learnings: Dict):
    """
    Guarda datos económicos relevantes para tracking.
    """
    economy = _load_json(ECONOMY_FILE)
    if not isinstance(economy, dict):
        economy = {"entries": [], "last_updated": ""}

    # Extraer facts de economía
    econ_facts = [
        f for f in learnings.get("facts", [])
        if f.get("category") == "economia"
    ]

    if econ_facts:
        economy["entries"].append({
            "date": datetime.utcnow().isoformat(),
            "facts": [f["fact"] for f in econ_facts],
        })

        # Limitar a últimos 100 entries
        if len(economy["entries"]) > 100:
            economy["entries"] = economy["entries"][-100:]

    economy["last_updated"] = datetime.utcnow().isoformat()
    _save_json(ECONOMY_FILE, economy)


# ===========================================================================
# GUARDAR TODO (función principal)
# ===========================================================================

def store_learnings(analysis: Dict, learnings: Dict):
    """
    Función principal: guarda TODO lo aprendido de un ciclo de noticias.
    Llamada por el scheduler después de cada fetch + análisis.
    """
    articles = analysis.get("articles", [])

    # 1. Guardar noticias
    save_news(articles)

    # 2. Guardar tendencias
    save_trends(learnings.get("trends", []) + analysis.get("trending_topics", []))

    # 3. Guardar patrones
    save_patterns(analysis.get("patterns", []))

    # 4. Guardar datos económicos
    save_economy_data(learnings)


# ===========================================================================
# CONSULTAR MEMORIA (para Zeus/Minerva)
# ===========================================================================

def get_recent_knowledge(max_items: int = 20) -> Dict:
    """
    Retorna conocimiento reciente para que Zeus/Minerva lo use
    en conversaciones. Esto hace al bot más inteligente.
    """
    news = _load_json(WORLD_NEWS_FILE)
    trends = _load_json(TRENDS_FILE)
    patterns = _load_json(PATTERNS_FILE)

    recent_news = news[-max_items:] if isinstance(news, list) else []
    top_trends = []
    if isinstance(trends, dict):
        sorted_topics = sorted(
            trends.get("topics", {}).items(),
            key=lambda x: x[1]["count"],
            reverse=True
        )
        top_trends = [t[0] for t in sorted_topics[:10]]

    recent_patterns = []
    if isinstance(patterns, list):
        recent_patterns = [p["pattern"] for p in patterns[-5:]]

    return {
        "recent_news": recent_news,
        "trending_topics": top_trends,
        "patterns": recent_patterns,
        "knowledge_size": len(news) if isinstance(news, list) else 0,
    }
