# -*- coding: utf-8 -*-
"""
🎯 SKILLS Module — Plan Antigravity v4.0
Habilidades modulares del ecosistema.
Cada skill es independiente, ligero y usa APIs 100% gratuitas.

Skills disponibles:
- weather: Clima por ubicación (Open-Meteo + Nominatim)
- news: Noticias en tiempo real (web scraping)
- crypto: Precios de criptomonedas (CoinGecko)
- search: Búsqueda web inteligente
- translate: Traducción (LibreTranslate)
- calculator: Calculadora científica (sympy)
- qr_reader: Lectura/generación de QR
- reminders: Recordatorios naturales
- web_browser: Automatización web (Playwright)
- music_video: Generación de videos musicales (FreeBeat AI)
"""

from skills.weather import WeatherSkill
from skills.crypto import CryptoSkill
from skills.translate import TranslateSkill
from skills.calculator import CalculatorSkill
from skills.reminders import RemindersSkill
from skills.search import SearchSkill

__all__ = [
    "WeatherSkill",
    "CryptoSkill",
    "TranslateSkill",
    "CalculatorSkill",
    "RemindersSkill",
    "SearchSkill",
]
