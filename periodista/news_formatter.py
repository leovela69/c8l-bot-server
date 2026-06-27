# -*- coding: utf-8 -*-
"""
📰 PERIODISTA — Formateador de noticias para Telegram
Crea mensajes bonitos tipo flash informativo.
"""

import random
from datetime import datetime
from typing import List, Dict

from periodista.config import PROMO_LINKS, NEWS_CATEGORIES


def format_news_flash(analysis: Dict) -> str:
    """
    Formatea un flash informativo para enviar al grupo de Telegram.
    Incluye noticias reales + enlace promocional de C8L.
    """
    articles = analysis.get("articles", [])
    if not articles:
        return ""

    # Header
    now = datetime.utcnow()
    hora = now.strftime("%H:%M")
    fecha = now.strftime("%d/%m/%Y")

    msg = f"📰 <b>FLASH INFORMATIVO C8L</b> 📰\n"
    msg += f"<i>{fecha} — {hora} UTC</i>\n"
    msg += "━━━━━━━━━━━━━━━━━━━\n\n"

    # Agrupar por categoría
    by_category: Dict[str, List[Dict]] = {}
    for article in articles:
        cat_id = article.get("category_id", "general")
        if cat_id not in by_category:
            by_category[cat_id] = []
        by_category[cat_id].append(article)

    # Formatear por categoría
    for cat in NEWS_CATEGORIES:
        if cat["id"] in by_category:
            cat_articles = by_category[cat["id"]]
            msg += f"{cat['emoji']} <b>{cat['label']}</b>\n"

            for article in cat_articles[:2]:  # Max 2 por categoría
                summary = article.get("ai_summary", article["title"][:80])
                msg += f"• {summary}\n"

            msg += "\n"

    # Insight de la IA (si hay)
    if analysis.get("insights"):
        msg += f"💡 <i>{analysis['insights']}</i>\n\n"

    # Separador + Promo
    msg += "━━━━━━━━━━━━━━━━━━━\n"

    # Rotar entre los enlaces promocionales
    promo = random.choice(PROMO_LINKS)
    msg += f"{promo['emoji']} <b>{promo['text']}</b>\n"
    msg += f"→ {promo['url']}\n"

    # Segundo enlace (siempre mostrar los dos)
    other_promo = [p for p in PROMO_LINKS if p['url'] != promo['url']]
    if other_promo:
        p2 = other_promo[0]
        msg += f"{p2['emoji']} {p2['text']}\n"
        msg += f"→ {p2['url']}\n"

    msg += "━━━━━━━━━━━━━━━━━━━"

    return msg


def format_breaking_news(article: Dict) -> str:
    """
    Formato para noticia urgente / de última hora.
    """
    cat_emoji = article.get("category_emoji", "🔴")
    summary = article.get("ai_summary", article["title"])

    msg = f"🚨 <b>ÚLTIMA HORA</b> 🚨\n\n"
    msg += f"{cat_emoji} {summary}\n"

    if article.get("description"):
        msg += f"\n<i>{article['description'][:200]}</i>\n"

    if article.get("link"):
        msg += f"\n🔗 <a href=\"{article['link']}\">Leer más</a>\n"

    msg += "\n━━━━━━━━━━━━━━━━━━━\n"
    # Siempre los dos enlaces
    for promo in PROMO_LINKS:
        msg += f"{promo['emoji']} {promo['url']}\n"

    return msg


def format_question_post() -> str:
    """
    Genera una pregunta para engagement del grupo.
    Se envía de vez en cuando entre noticias.
    """
    questions = [
        "🤔 ¿Qué opinais de las noticias de hoy? ¿Algo os ha sorprendido?",
        "📊 ¿Cómo veis la economía este mes? ¿Mejor o peor que el anterior?",
        "⚽ ¿Qué resultado esperáis en el próximo partido importante?",
        "🔬 ¿Habéis probado alguna IA nueva últimamente? ¿Cuál os gusta más?",
        "🌍 Si pudierais cambiar UNA cosa del mundo ahora mismo, ¿qué sería?",
        "🎨 ¿Habéis probado el editor de diseño? → https://c8l-web8.vercel.app/",
        "🚀 ¿Ya probasteis C8L Generate? Cread con IA → https://c8l-web8.vercel.app/generate",
        "💰 ¿En qué crypto confiais más ahora mismo?",
        "🎵 ¿Qué estáis escuchando esta semana? Recomendad algo!",
        "🎰 ¿Cuál es vuestro juego favorito del C8L Casino? → https://c8l-casino.vercel.app/",
        "🎲 ¿Alguien ha conseguido racha en el Crash? Yo llegué a 5x → https://c8l-casino.vercel.app/",
        "🃏 Reto: ¿Quién consigue más fichas hoy en el Blackjack? → https://c8l-casino.vercel.app/",
    ]

    return random.choice(questions)


def format_casino_launch_announcement() -> str:
    """
    Formato especial para anunciar el lanzamiento de C8L Casino.
    Se usa una sola vez o cuando el admin lo invoque.
    """
    now = datetime.utcnow()
    fecha = now.strftime("%d/%m/%Y")

    msg = (
        "🎰🎰🎰 <b>NUEVO LANZAMIENTO</b> 🎰🎰🎰\n"
        "━━━━━━━━━━━━━━━━━━━\n\n"
        "📰 <b>FLASH ESPECIAL — C8L AGENCY</b>\n"
        f"<i>{fecha}</i>\n\n"
        "🎲 <b>C8L CASINO ya está ONLINE!</b>\n\n"
        "El casino más completo de la comunidad acaba de abrir sus puertas:\n\n"
        "👉 <b>https://c8l-casino.vercel.app/</b>\n\n"
        "🃏 <b>26 JUEGOS PREMIUM incluidos:</b>\n"
        "• 🃏 Blackjack, Poker Texas, Baccarat, Video Poker\n"
        "• 🎡 Ruleta Europea y Americana, Craps, Sic Bo\n"
        "• 🍒 5 Slots temáticos (Egipto, Espacio, Frutas, Jackpot...)\n"
        "• 💣 Mines, Plinko, Crash, Tower, Dice\n"
        "• 👑 Keno, Bingo, Wheel of Fortune, Scratch Cards, Hi-Lo\n"
        "• ⚡ Coin Flip, Dragon Tiger, Casino War\n\n"
        "🏆 <b>Sistema completo:</b>\n"
        "• 10,000 fichas GRATIS al empezar\n"
        "• Niveles VIP (Bronze → Diamond)\n"
        "• Bonus diario\n"
        "• Rankings y estadísticas\n"
        "• Sin dinero real — diversión pura\n\n"
        "━━━━━━━━━━━━━━━━━━━\n"
        "🔥 <b>JUEGA AHORA:</b>\n"
        "→ https://c8l-casino.vercel.app/\n\n"
        "🚀 <b>C8L Generate — Crea con IA:</b>\n"
        "→ https://c8l-web8.vercel.app/generate\n\n"
        "🎨 <b>Editor de diseño:</b>\n"
        "→ https://c8l-web8.vercel.app/\n"
        "━━━━━━━━━━━━━━━━━━━\n\n"
        "La casa SIEMPRE gana... pero nosotros SOMOS la casa. 🏛️\n"
        "<i>— C8L Agency | Panteón de Dioses</i>"
    )

    return msg


def format_launch_announcement() -> str:
    """
    Formato especial para anunciar el lanzamiento de C8L Generate.
    Se usa una sola vez o cuando el admin lo invoque.
    """
    now = datetime.utcnow()
    fecha = now.strftime("%d/%m/%Y")

    msg = (
        "🚀🚀🚀 <b>LANZAMIENTO OFICIAL</b> 🚀🚀🚀\n"
        "━━━━━━━━━━━━━━━━━━━\n\n"
        "📰 <b>FLASH ESPECIAL — C8L AGENCY</b>\n"
        f"<i>{fecha}</i>\n\n"
        "🧠 <b>C8L GENERATE ya está ONLINE!</b>\n\n"
        "Acabamos de lanzar nuestra plataforma de creación con Inteligencia Artificial:\n\n"
        "👉 <b>https://c8l-web8.vercel.app/generate</b>\n\n"
        "🎨 <b>¿Qué podéis hacer?</b>\n"
        "• Generar imágenes con IA\n"
        "• Crear código al instante\n"
        "• Producir contenido creativo\n"
        "• Herramientas profesionales GRATIS\n\n"
        "⚡ <b>¿Por qué es diferente?</b>\n"
        "• Hecho POR C8L, PARA C8L\n"
        "• Sin límites absurdos\n"
        "• Interfaz limpia y rápida\n"
        "• IA de última generación\n\n"
        "━━━━━━━━━━━━━━━━━━━\n"
        "🔥 <b>Probadlo AHORA:</b>\n"
        "→ https://c8l-web8.vercel.app/generate\n\n"
        "🎨 <b>Editor de diseño:</b>\n"
        "→ https://c8l-web8.vercel.app/\n"
        "━━━━━━━━━━━━━━━━━━━\n\n"
        "El futuro de la creación es NUESTRO. 🏛️\n"
        "<i>— C8L Agency | Panteón de Dioses</i>"
    )

    return msg
