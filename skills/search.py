# -*- coding: utf-8 -*-
"""
🔍 SEARCH SKILL — Búsqueda Web Inteligente
=============================================
Motor de búsqueda usando APIs gratuitas.
- DuckDuckGo Instant Answers (sin key)
- Fallback: scraping ligero
"""

import requests
import logging
from typing import Optional, List, Dict

logger = logging.getLogger("c8l.skills.search")


class SearchSkill:
    """Skill de búsqueda web ultraligero."""

    DDG_API = "https://api.duckduckgo.com/"

    def __init__(self):
        self.search_count = 0

    def search(self, query: str, limit: int = 5) -> Optional[str]:
        """
        Busca información en la web.

        Args:
            query: Término de búsqueda
            limit: Máximo de resultados

        Returns:
            Resultados formateados
        """
        results = self._duckduckgo_search(query)
        if results:
            self.search_count += 1
            return self._format_results(query, results[:limit])

        return f"🔍 No encontré resultados para: {query}"

    def instant_answer(self, query: str) -> Optional[str]:
        """Respuesta instantánea de DuckDuckGo."""
        try:
            params = {
                "q": query,
                "format": "json",
                "no_html": 1,
                "skip_disambig": 1,
            }
            r = requests.get(self.DDG_API, params=params, timeout=10)
            if r.status_code == 200:
                data = r.json()
                # Abstract (respuesta directa)
                abstract = data.get("AbstractText", "")
                if abstract:
                    source = data.get("AbstractSource", "")
                    url = data.get("AbstractURL", "")
                    text = f"🔍 *{query}*\n\n{abstract[:500]}"
                    if source:
                        text += f"\n\n📖 Fuente: {source}"
                    return text
        except Exception as e:
            logger.warning(f"DDG instant answer error: {e}")
        return None

    def _duckduckgo_search(self, query: str) -> List[Dict]:
        """Busca en DuckDuckGo."""
        try:
            params = {
                "q": query,
                "format": "json",
                "no_html": 1,
            }
            r = requests.get(self.DDG_API, params=params, timeout=10)
            if r.status_code == 200:
                data = r.json()
                results = []

                # Related topics
                for topic in data.get("RelatedTopics", [])[:8]:
                    if "Text" in topic:
                        results.append({
                            "title": topic.get("Text", "")[:80],
                            "url": topic.get("FirstURL", ""),
                            "snippet": topic.get("Text", "")[:200],
                        })

                return results
        except Exception as e:
            logger.warning(f"DDG search error: {e}")
        return []

    def _format_results(self, query: str, results: List[Dict]) -> str:
        """Formatea resultados de búsqueda."""
        text = f"🔍 *Resultados para:* {query}\n\n"
        for i, r in enumerate(results, 1):
            title = r.get("title", "Sin título")[:60]
            snippet = r.get("snippet", "")[:120]
            text += f"{i}. *{title}*\n"
            if snippet:
                text += f"   {snippet}\n"
            text += "\n"
        return text
