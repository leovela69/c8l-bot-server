# -*- coding: utf-8 -*-
"""
📰 PERIODISTA — Configuración
"""

# ---------------------------------------------------------------------------
# ENLACES A PROMOCIONAR (rotan en cada flash)
# ---------------------------------------------------------------------------
PROMO_LINKS = [
    {
        "text": "🚀 C8L Generate — Crea con IA (imágenes, código, contenido)",
        "url": "https://c8l-web8.vercel.app/generate",
        "emoji": "🚀",
    },
    {
        "text": "🎨 Editor de diseño GRATIS estilo Canva",
        "url": "https://c8l-web8.vercel.app/",
        "emoji": "🎨",
    },
    {
        "text": "🌐 C8L Agency — Plataforma oficial",
        "url": "https://gen-lang-client-0744582882.web.app/feed/",
        "emoji": "🌐",
    },
    {
        "text": "🎰 C8L CASINO — 6 juegos + KUKIS (Crash, Ruleta, Slots, Plinko, Mines)",
        "url": "https://raw.githack.com/leovela69/c8l-bot-server/main/kukis/c8l_casino_kukis.html",
        "emoji": "🎰",
    },
]

# ---------------------------------------------------------------------------
# CATEGORÍAS DE NOTICIAS
# ---------------------------------------------------------------------------
NEWS_CATEGORIES = [
    {"id": "geopolitica", "emoji": "🌍", "label": "GEOPOLÍTICA", "keywords": ["guerra", "conflicto", "diplomacia", "OTAN", "ONU", "tratado"]},
    {"id": "economia", "emoji": "💰", "label": "ECONOMÍA", "keywords": ["bitcoin", "bolsa", "inflación", "PIB", "banco central", "crypto", "mercados"]},
    {"id": "catastrofes", "emoji": "🌋", "label": "CATÁSTROFES", "keywords": ["terremoto", "tsunami", "huracán", "inundación", "volcán", "incendio"]},
    {"id": "deportes", "emoji": "⚽", "label": "DEPORTES", "keywords": ["fútbol", "NBA", "Olimpiadas", "Champions", "Mundial", "fichaje"]},
    {"id": "tecnologia", "emoji": "🔬", "label": "TECNOLOGÍA", "keywords": ["IA", "inteligencia artificial", "Apple", "Google", "Tesla", "robot"]},
    {"id": "entretenimiento", "emoji": "🎬", "label": "ENTRETENIMIENTO", "keywords": ["película", "serie", "música", "Netflix", "concierto", "estreno"]},
]

# ---------------------------------------------------------------------------
# FRECUENCIA DE PUBLICACIÓN
# ---------------------------------------------------------------------------
# Cada cuántas horas publica un flash de noticias
PUBLISH_INTERVAL_HOURS = 4

# Máximo de noticias por flash
MAX_NEWS_PER_FLASH = 6

# Horario activo (no publicar de madrugada)
ACTIVE_HOURS_START = 8   # 8:00 AM
ACTIVE_HOURS_END = 23    # 11:00 PM

# ---------------------------------------------------------------------------
# FUENTES RSS GRATUITAS
# ---------------------------------------------------------------------------
RSS_FEEDS = [
    # Español
    {"url": "https://feeds.elpais.com/mrss-s/pages/ep/site/elpais.com/portada", "lang": "es", "source": "El País"},
    {"url": "https://e00-elmundo.uecdn.es/elmundo/rss/portada.xml", "lang": "es", "source": "El Mundo"},
    {"url": "https://www.20minutos.es/rss/", "lang": "es", "source": "20 Minutos"},
    {"url": "https://rss.nytimes.com/services/xml/rss/nyt/World.xml", "lang": "en", "source": "NYT World"},
    {"url": "https://feeds.bbci.co.uk/news/world/rss.xml", "lang": "en", "source": "BBC World"},
    # Tecnología
    {"url": "https://feeds.feedburner.com/TechCrunch/", "lang": "en", "source": "TechCrunch"},
    # Economía
    {"url": "https://www.coindesk.com/arc/outboundfeeds/rss/", "lang": "en", "source": "CoinDesk"},
    # Deportes
    {"url": "https://e00-marca.uecdn.es/rss/portada.xml", "lang": "es", "source": "Marca"},
]

# ---------------------------------------------------------------------------
# MEMORIA / APRENDIZAJE
# ---------------------------------------------------------------------------
KNOWLEDGE_DIR = "data/knowledge"
WORLD_NEWS_FILE = "data/knowledge/world_news.json"
ECONOMY_FILE = "data/knowledge/economy_tracker.json"
TRENDS_FILE = "data/knowledge/trends.json"
PATTERNS_FILE = "data/knowledge/learned_patterns.json"

# Máximo de noticias a guardar en memoria (las más viejas se borran)
MAX_STORED_NEWS = 500
MAX_PATTERNS = 100
