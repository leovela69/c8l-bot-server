# -*- coding: utf-8 -*-
"""
🛠️ TOOLS — Herramientas rápidas del bot
QR codes, traducción, resumen, stickers, programar mensajes.
"""

import io
import logging
import requests
import time
import json
import threading
from PIL import Image, ImageDraw
from openrouter_client import call_openrouter
from config import MEMORY_DIR
import os

logger = logging.getLogger("c8l.tools")

# ---------------------------------------------------------------------------
# QR CODE GENERATOR
# ---------------------------------------------------------------------------
def generate_qr(data, size=400):
    """Genera QR code como imagen PNG."""
    try:
        # Usar API gratuita de QR
        url = f"https://api.qrserver.com/v1/create-qr-code/?size={size}x{size}&data={requests.utils.quote(data)}&bgcolor=0a0a0a&color=cc00ff"
        r = requests.get(url, timeout=15)
        if r.status_code == 200 and "image" in r.headers.get("content-type", ""):
            return r.content
    except Exception as e:
        logger.warning(f"QR API error: {e}")

    # Fallback: QR simple con otra API
    try:
        url2 = f"https://chart.googleapis.com/chart?cht=qr&chs={size}x{size}&chl={requests.utils.quote(data)}"
        r = requests.get(url2, timeout=15)
        if r.status_code == 200:
            return r.content
    except:
        pass
    return None


# ---------------------------------------------------------------------------
# TRADUCTOR
# ---------------------------------------------------------------------------
def translate_text(text, target_langs=None):
    """Traduce texto a múltiples idiomas usando DeepSeek."""
    if not target_langs:
        target_langs = ["English", "French", "Portuguese", "Italian", "German"]

    prompt = f"""Translate this text to the following languages. 
Format: one line per language with emoji flag.

Text: "{text}"

Languages: {', '.join(target_langs)}

Format example:
🇺🇸 English: [translation]
🇫🇷 French: [translation]
etc.

Only output the translations, nothing else."""

    result = call_openrouter(prompt, "You are a professional translator. Output only translations.",
                            agent_name="hermes", temperature=0.3, max_tokens=500)
    return result


# ---------------------------------------------------------------------------
# RESUMIR URLs
# ---------------------------------------------------------------------------
def summarize_url(url):
    """Resume el contenido de una URL."""
    try:
        # Obtener contenido de la página
        headers = {"User-Agent": "Mozilla/5.0 (compatible; C8LBot/1.0)"}
        r = requests.get(url, headers=headers, timeout=15)
        if r.status_code != 200:
            return "❌ No pude acceder a esa URL."

        # Extraer texto (simplificado)
        from html.parser import HTMLParser
        class TextExtractor(HTMLParser):
            def __init__(self):
                super().__init__()
                self.text = []
                self.skip = False
            def handle_starttag(self, tag, attrs):
                if tag in ['script', 'style', 'nav', 'footer']:
                    self.skip = True
            def handle_endtag(self, tag):
                if tag in ['script', 'style', 'nav', 'footer']:
                    self.skip = False
            def handle_data(self, data):
                if not self.skip:
                    self.text.append(data.strip())

        parser = TextExtractor()
        parser.feed(r.text)
        page_text = " ".join([t for t in parser.text if len(t) > 10])[:3000]

        if len(page_text) < 50:
            return "❌ No encontré contenido útil en esa página."

        # Resumir con IA
        prompt = f"Resume este contenido en 3-5 puntos clave en español:\n\n{page_text}"
        summary = call_openrouter(prompt, "Eres un asistente que resume textos de forma concisa en español.",
                                  agent_name="minerva", temperature=0.3, max_tokens=500)
        return summary or "❌ No pude generar el resumen."

    except Exception as e:
        return f"❌ Error: {str(e)[:100]}"


# ---------------------------------------------------------------------------
# SISTEMA DE NIVELES/XP
# ---------------------------------------------------------------------------
LEVELS_FILE = os.path.join(MEMORY_DIR, "levels.json")

LEVEL_TITLES = {
    1: "🆕 Novato",
    2: "⭐ Aprendiz",
    3: "⭐⭐ Explorador",
    5: "🌟 Creador",
    8: "🌟🌟 Artista",
    10: "💎 Veterano",
    15: "💎💎 Maestro",
    20: "👑 Leyenda",
    30: "🏛️ Dios del Panteón",
    50: "🌌 Trascendente",
}

XP_PER_ACTION = {
    "message": 5,
    "image": 15,
    "video": 25,
    "music": 20,
    "code": 20,
    "game": 10,
    "feedback": 5,
    "daily_bonus": 50,
}


class LevelSystem:
    """Sistema de niveles y XP."""

    def __init__(self):
        self.data = self._load()

    def add_xp(self, user_id, user_name, action="message"):
        """Añade XP al usuario. Retorna (level_up, new_level, title) o None."""
        uid = str(user_id)
        xp_gain = XP_PER_ACTION.get(action, 5)

        if uid not in self.data:
            self.data[uid] = {"name": user_name, "xp": 0, "level": 1,
                             "coins": 0, "last_daily": 0, "achievements": []}

        user = self.data[uid]
        user["name"] = user_name
        old_level = user["level"]
        user["xp"] += xp_gain
        user["coins"] += xp_gain // 2

        # Calcular nuevo nivel (cada 100 XP = 1 nivel)
        new_level = (user["xp"] // 100) + 1
        user["level"] = new_level

        self._save()

        if new_level > old_level:
            title = self._get_title(new_level)
            return (True, new_level, title)
        return None

    def get_profile(self, user_id):
        """Obtiene perfil del usuario."""
        uid = str(user_id)
        user = self.data.get(uid, {"name": "?", "xp": 0, "level": 1, "coins": 0})
        title = self._get_title(user["level"])
        next_level_xp = user["level"] * 100
        progress = user["xp"] % 100

        text = f"📊 *Perfil de {user['name']}*\n\n"
        text += f"🏅 Nivel: {user['level']} — {title}\n"
        text += f"⚡ XP: {user['xp']} ({progress}/100 para siguiente nivel)\n"
        text += f"💰 C8L Coins: {user.get('coins', 0)}\n"
        text += f"📈 Progreso: {'█' * (progress // 10)}{'░' * (10 - progress // 10)} {progress}%\n"
        return text

    def get_ranking(self, top=10):
        """Top usuarios por XP."""
        sorted_users = sorted(self.data.items(), key=lambda x: x[1].get("xp", 0), reverse=True)
        text = "🏆 *RANKING C8L*\n\n"
        medals = ["🥇", "🥈", "🥉"]
        for i, (uid, user) in enumerate(sorted_users[:top]):
            medal = medals[i] if i < 3 else f"#{i+1}"
            title = self._get_title(user["level"])
            text += f"{medal} *{user['name']}* — Lv.{user['level']} ({user['xp']} XP)\n"
            text += f"    {title} | 💰 {user.get('coins', 0)} coins\n"
        return text

    def claim_daily(self, user_id, user_name):
        """Reclama bonus diario."""
        uid = str(user_id)
        if uid not in self.data:
            self.data[uid] = {"name": user_name, "xp": 0, "level": 1,
                             "coins": 0, "last_daily": 0, "achievements": []}

        user = self.data[uid]
        now = time.time()
        last = user.get("last_daily", 0)

        if now - last < 86400:  # 24h
            remaining = int(86400 - (now - last))
            hours = remaining // 3600
            mins = (remaining % 3600) // 60
            return f"⏰ Ya reclamaste tu bonus hoy. Vuelve en {hours}h {mins}m."

        bonus = XP_PER_ACTION["daily_bonus"]
        user["xp"] += bonus
        user["coins"] += bonus
        user["last_daily"] = now
        user["level"] = (user["xp"] // 100) + 1
        self._save()
        return f"🎁 *Bonus diario reclamado!*\n+{bonus} XP | +{bonus} C8L Coins\n\nTotal: {user['xp']} XP | 💰 {user['coins']} coins"

    def _get_title(self, level):
        """Obtiene título para un nivel."""
        title = "🆕 Novato"
        for lvl, t in sorted(LEVEL_TITLES.items()):
            if level >= lvl:
                title = t
        return title

    def _load(self):
        try:
            if os.path.exists(LEVELS_FILE):
                with open(LEVELS_FILE, "r", encoding="utf-8") as f:
                    return json.load(f)
        except:
            pass
        return {}

    def _save(self):
        try:
            with open(LEVELS_FILE, "w", encoding="utf-8") as f:
                json.dump(self.data, f, ensure_ascii=False, indent=2)
        except Exception as e:
            logger.error(f"Error guardando levels: {e}")


# ---------------------------------------------------------------------------
# MINI-JUEGOS
# ---------------------------------------------------------------------------
TRIVIA_QUESTIONS = [
    {"q": "¿Qué género musical fusiona C8L Agency?", "a": "Bolero-House", "options": ["Reggaeton", "Bolero-House", "Trap", "Techno"]},
    {"q": "¿Cuál es el animal emblema de C8L?", "a": "León", "options": ["Águila", "León", "Lobo", "Dragón"]},
    {"q": "¿Qué color neon identifica a C8L?", "a": "Púrpura", "options": ["Rojo", "Verde", "Púrpura", "Naranja"]},
    {"q": "¿Qué BPM tiene el Bolero-House?", "a": "115", "options": ["90", "115", "128", "140"]},
    {"q": "¿Qué significa C8L?", "a": "Corazones Locos", "options": ["Cool 8 Life", "Corazones Locos", "Create 8 Live", "Code 8 Labs"]},
    {"q": "¿Quién es el director del Panteón?", "a": "Zeus", "options": ["Apolo", "Ares", "Zeus", "Hermes"]},
    {"q": "¿Qué agente genera imágenes?", "a": "Vulcano", "options": ["Ares", "Vulcano", "Hefesto", "Artemisa"]},
    {"q": "¿Cuántos agentes tiene el Panteón?", "a": "11", "options": ["5", "8", "11", "15"]},
    {"q": "¿Qué modelo de IA usa el bot para texto?", "a": "DeepSeek", "options": ["GPT-4", "DeepSeek", "Claude", "Llama"]},
    {"q": "¿Cuál es el agente de música?", "a": "Apolo", "options": ["Hermes", "Apolo", "Ares", "Atenea"]},
]

import random

def get_trivia_question():
    """Obtiene una pregunta random de trivia."""
    q = random.choice(TRIVIA_QUESTIONS)
    shuffled = q["options"][:]
    random.shuffle(shuffled)
    return q["q"], q["a"], shuffled


# ---------------------------------------------------------------------------
# PROGRAMAR MENSAJES
# ---------------------------------------------------------------------------
SCHEDULED_FILE = os.path.join(MEMORY_DIR, "scheduled_messages.json")

_scheduled_messages = []


def schedule_message(chat_id, hour, minute, text, sender_name="Admin"):
    """Programa un mensaje para una hora específica."""
    msg = {
        "chat_id": str(chat_id),
        "hour": hour,
        "minute": minute,
        "text": text,
        "sender": sender_name,
        "created": time.time(),
        "sent": False,
    }
    _scheduled_messages.append(msg)
    _save_scheduled()
    return True


def get_pending_scheduled():
    """Obtiene mensajes que deben enviarse ahora."""
    import time as t
    now = t.localtime()
    current_h = now.tm_hour
    current_m = now.tm_min

    to_send = []
    for msg in _scheduled_messages:
        if not msg["sent"] and msg["hour"] == current_h and msg["minute"] == current_m:
            msg["sent"] = True
            to_send.append(msg)

    if to_send:
        _save_scheduled()
    return to_send


def _save_scheduled():
    try:
        with open(SCHEDULED_FILE, "w", encoding="utf-8") as f:
            json.dump(_scheduled_messages, f, ensure_ascii=False, indent=2)
    except:
        pass


# ---------------------------------------------------------------------------
# MODO DJ
# ---------------------------------------------------------------------------
def generate_dj_prompt(genre="Bolero-House", mood="energetic", bpm=115):
    """Genera prompt optimizado para Suno/Udio."""
    prompt = f"""Generate a music production prompt optimized for Suno AI:

Genre: {genre}
Mood: {mood}
BPM: {bpm}

Format:
🎵 SUNO PROMPT:
[the prompt to paste in Suno, in English, detailed with instruments, vocals, structure]

🎛️ SETTINGS:
- Genre tag: [tag]
- BPM: {bpm}
- Duration: 3:30
- Vocals: [type]

💡 PRODUCTION NOTES:
[2-3 tips for the mix]"""

    result = call_openrouter(prompt, "You are a music production expert. Generate Suno AI prompts.",
                            agent_name="apolo", temperature=0.8, max_tokens=500)
    return result


def generate_playlist(theme="fiesta nocturna", count=10):
    """Genera playlist recomendada."""
    prompt = f"Genera una playlist de {count} canciones para: {theme}. Formato: número. Artista - Canción (Género). Solo la lista, sin explicaciones."
    result = call_openrouter(prompt, "Eres un DJ experto. Genera playlists variadas y relevantes.",
                            agent_name="apolo", temperature=0.9, max_tokens=400)
    return result


# ---------------------------------------------------------------------------
# AGENTE REDES SOCIALES
# ---------------------------------------------------------------------------
def generate_social_post(topic, platform="instagram"):
    """Genera post optimizado para redes sociales."""
    platforms_config = {
        "instagram": {"max_chars": 2200, "hashtags": 20, "emoji": True, "style": "visual, storytelling"},
        "tiktok": {"max_chars": 300, "hashtags": 5, "emoji": True, "style": "hook, short, viral"},
        "twitter": {"max_chars": 280, "hashtags": 3, "emoji": True, "style": "punchy, controversial"},
        "linkedin": {"max_chars": 3000, "hashtags": 5, "emoji": False, "style": "professional, value"},
    }

    config = platforms_config.get(platform, platforms_config["instagram"])

    prompt = f"""Generate a {platform} post about: {topic}

Rules:
- Max {config['max_chars']} characters
- Include {config['hashtags']} relevant hashtags
- Style: {config['style']}
- {'Use emojis' if config['emoji'] else 'No emojis'}
- Write in Spanish
- Include a call to action
- For C8L Agency brand (music production + tech)

Output ONLY the post text ready to copy-paste."""

    result = call_openrouter(prompt, f"You are a {platform} content expert for music brands.",
                            agent_name="atenea", temperature=0.9, max_tokens=500)
    return result


# ---------------------------------------------------------------------------
# C8L COINS / MONETIZACIÓN
# ---------------------------------------------------------------------------
COINS_FILE = os.path.join(MEMORY_DIR, "coins_shop.json")

SHOP_ITEMS = {
    "custom_title": {"name": "🏷️ Título Personalizado", "price": 500, "desc": "Elige tu título en el ranking"},
    "priority_gen": {"name": "⚡ Generación Prioritaria", "price": 200, "desc": "Tu próxima generación va primero"},
    "extra_image": {"name": "🖼️ Pack 5 Imágenes Extra", "price": 300, "desc": "5 generaciones bonus"},
    "vip_badge": {"name": "💎 Badge VIP", "price": 1000, "desc": "Badge especial en tu perfil"},
    "custom_emoji": {"name": "😎 Emoji Personalizado", "price": 150, "desc": "Emoji junto a tu nombre"},
    "shoutout": {"name": "📢 Shoutout en Grupo", "price": 250, "desc": "El bot te menciona en el grupo"},
}


def get_shop_text():
    """Genera texto de la tienda."""
    text = "🛒 *TIENDA C8L*\n\n"
    text += "Gasta tus C8L Coins en items exclusivos:\n\n"
    for item_id, item in SHOP_ITEMS.items():
        text += f"{item['name']} — 💰 {item['price']} coins\n"
        text += f"   _{item['desc']}_\n\n"
    text += "Uso: /comprar [item]\n"
    text += "Gana coins: usa el bot, da feedback, reclama /daily"
    return text


# Instancia global de niveles
levels = LevelSystem()
