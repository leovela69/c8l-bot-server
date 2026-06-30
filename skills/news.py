# -*- coding: utf-8 -*-
"""
📰 NEWS SKILL — Noticias en Tiempo Real
=========================================
APIs gratuitas para noticias:
- GNews API (100 req/día gratis)
- Fallback: DuckDuckGo News
"""

import requests
import logging
from typing import Optional, List, Dict

logger = logging.getLogger("c8l.skills.news")


class NewsSkill:
    """Skill de noticias ultraligero."""

    DDG_NEWS = "https://api.duckduckgo.com/"
    GNEWS_URL = "https://gnews.io/api/v4"

    CATEGORIES = {
        "general": "general",
        "tech": "technology",
        "tecnologia": "technology",
        "deportes": "sports",
        "sports": "sports",
        "ciencia": "science",
        "science": "science",
        "salud": "health",
        "negocios": "business",
        "entretenimiento": "entertainment",
    }

    def __init__(self):
        self.query_count = 0

    def get_news(self, topic: str = "general",
                 country: str = "mx",
                 limit: int = 5) -> Optional[str]:
        """
        Obtiene noticias recientes.

        Args:
            topic: Tema o categoría
            country: País (mx, es, us, etc.)
            limit: Máximo de noticias
        """
        # Intentar GNews si hay API key
        news = self._gnews_search(topic, country, limit)
        if news:
            self.query_count += 1
            return self._format_news(topic, news)

        # Fallback: DuckDuckGo
        news = self._ddg_news(topic, limit)
        if news:
            self.query_count += 1
            return self._format_news(topic, news)

        return f"📰 No encontré noticias sobre: {topic}"

    def _gnews_search(self, topic: str, country: str,
                      limit: int) -> List[Dict]:
        """Busca noticias en GNews."""
        try:
            import os
            api_key = os.environ.get("GNEWS_API_KEY", "")
            if not api_key:
                return []

            category = self.CATEGORIES.get(topic.lower())
            if category:
                url = f"{self.GNEWS_URL}/top-headlines"
                params = {
                    "token": api_key,
                    "lang": "es",
                    "country": country,
                    "category": category,
                    "max": limit,
                }
            else:
                url = f"{self.GNEWS_URL}/search"
                params = {
                    "token": api_key,
                    "q": topic,
                    "lang": "es",
                    "max": limit,
                }

            r = requests.get(url, params=params, timeout=10)
            if r.status_code == 200:
                articles = r.json().get("articles", [])
                return [
                    {
                        "title": a.get("title", ""),
                        "source": a.get("source", {}).get("name", ""),
                        "url": a.get("url", ""),
                        "snippet": a.get("description", "")[:150],
                    }
                    for a in articles
                ]
        except Exception as e:
            logger.warning(f"GNews error: {e}")
        return []

    def _ddg_news(self, topic: str, limit: int) -> List[Dict]:
        """Busca noticias en DuckDuckGo."""
        try:
            params = {"q": f"{topic} noticias", "format": "json"}
            r = requests.get(self.DDG_NEWS, params=params, timeout=10)
            if r.status_code == 200:
                data = r.json()
                results = []
                for t in data.get("RelatedTopics", [])[:limit]:
                    if "Text" in t:
                        results.append({
                            "title": t["Text"][:80],
                            "url": t.get("FirstURL", ""),
                            "snippet": t["Text"][:150],
                            "source": "DuckDuckGo",
                        })
                return results
        except Exception as e:
            logger.warning(f"DDG news error: {e}")
        return []

    def _format_news(self, topic: str, news: List[Dict]) -> str:
        """Formatea noticias."""
        text = f"📰 *Noticias: {topic.title()}*\n\n"
        for i, n in enumerate(news, 1):
            title = n.get("title", "Sin título")
            source = n.get("source", "")
            snippet = n.get("snippet", "")
            text += f"{i}. *{title}*\n"
            if source:
                text += f"   📌 {source}\n"
            if snippet:
                text += f"   {snippet}\n"
            text += "\n"
        return text
