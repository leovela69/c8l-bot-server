# -*- coding: utf-8 -*-
"""
📰 PERIODISTA — Buscador de noticias
Obtiene noticias reales de fuentes RSS gratuitas.
"""

import asyncio
import aiohttp
import xml.etree.ElementTree as ET
from datetime import datetime, timedelta
from typing import List, Dict, Optional
import re
import html

from periodista.config import RSS_FEEDS, NEWS_CATEGORIES


async def fetch_rss_feed(session: aiohttp.ClientSession, feed: Dict) -> List[Dict]:
    """Obtiene noticias de un feed RSS."""
    articles = []
    try:
        async with session.get(feed["url"], timeout=aiohttp.ClientTimeout(total=15)) as resp:
            if resp.status != 200:
                return []
            text = await resp.text()

        root = ET.fromstring(text)

        # Buscar items (RSS 2.0 o Atom)
        items = root.findall(".//item") or root.findall(".//{http://www.w3.org/2005/Atom}entry")

        for item in items[:10]:  # Max 10 por feed
            title = ""
            description = ""
            link = ""
            pub_date = ""

            # RSS 2.0
            title_el = item.find("title")
            desc_el = item.find("description")
            link_el = item.find("link")
            date_el = item.find("pubDate")

            # Atom
            if title_el is None:
                title_el = item.find("{http://www.w3.org/2005/Atom}title")
            if link_el is None:
                link_el = item.find("{http://www.w3.org/2005/Atom}link")
                if link_el is not None:
                    link = link_el.get("href", "")
            if desc_el is None:
                desc_el = item.find("{http://www.w3.org/2005/Atom}summary")

            if title_el is not None and title_el.text:
                title = html.unescape(title_el.text.strip())
            if desc_el is not None and desc_el.text:
                description = html.unescape(re.sub(r'<[^>]+>', '', desc_el.text.strip()))[:200]
            if link_el is not None and link_el.text:
                link = link_el.text.strip()
            if date_el is not None and date_el.text:
                pub_date = date_el.text.strip()

            if title:
                articles.append({
                    "title": title,
                    "description": description,
                    "link": link,
                    "source": feed["source"],
                    "lang": feed["lang"],
                    "pub_date": pub_date,
                    "fetched_at": datetime.utcnow().isoformat(),
                })

    except Exception as e:
        # Silencioso — si un feed falla, seguimos con los demás
        pass

    return articles


def categorize_article(article: Dict) -> Optional[str]:
    """Asigna categoría a un artículo basado en keywords."""
    text = f"{article['title']} {article['description']}".lower()

    for cat in NEWS_CATEGORIES:
        for keyword in cat["keywords"]:
            if keyword.lower() in text:
                return cat["id"]

    return None


async def fetch_all_news() -> Dict[str, List[Dict]]:
    """
    Obtiene noticias de todas las fuentes y las categoriza.
    Retorna dict: {categoria_id: [articulos]}
    """
    all_articles = []

    async with aiohttp.ClientSession() as session:
        tasks = [fetch_rss_feed(session, feed) for feed in RSS_FEEDS]
        results = await asyncio.gather(*tasks, return_exceptions=True)

        for result in results:
            if isinstance(result, list):
                all_articles.extend(result)

    # Categorizar
    categorized: Dict[str, List[Dict]] = {}
    for article in all_articles:
        category = categorize_article(article)
        if category:
            if category not in categorized:
                categorized[category] = []
            categorized[category].append(article)

    # Deduplicar por título similar (primeras 50 chars)
    for cat_id in categorized:
        seen_titles = set()
        unique = []
        for article in categorized[cat_id]:
            key = article["title"][:50].lower()
            if key not in seen_titles:
                seen_titles.add(key)
                unique.append(article)
        categorized[cat_id] = unique[:5]  # Max 5 por categoría

    return categorized


async def fetch_top_news(max_total: int = 6) -> List[Dict]:
    """
    Obtiene las noticias más relevantes (1-2 de cada categoría).
    Retorna lista plana de artículos con su categoría asignada.
    """
    categorized = await fetch_all_news()

    top_news = []
    # Tomar 1 noticia de cada categoría que tenga resultados
    for cat in NEWS_CATEGORIES:
        if cat["id"] in categorized and categorized[cat["id"]]:
            article = categorized[cat["id"]][0]
            article["category_id"] = cat["id"]
            article["category_emoji"] = cat["emoji"]
            article["category_label"] = cat["label"]
            top_news.append(article)

            if len(top_news) >= max_total:
                break

    return top_news
