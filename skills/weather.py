# -*- coding: utf-8 -*-
"""
🌤️ WEATHER SKILL — Clima por Ubicación (100% Gratuito)
========================================================
APIs usadas:
- Open-Meteo: Pronóstico sin API key (ilimitado)
- OpenStreetMap Nominatim: Geocodificación sin API key
"""

import requests
import logging
from typing import Dict, Optional, Tuple

logger = logging.getLogger("c8l.skills.weather")


class WeatherSkill:
    """Skill de clima ultraligero. Sin API keys."""

    GEOCODE_URL = "https://nominatim.openstreetmap.org/search"
    WEATHER_URL = "https://api.open-meteo.com/v1/forecast"

    # Iconos según WMO weather codes
    WMO_ICONS = {
        0: "☀️", 1: "🌤️", 2: "⛅", 3: "☁️",
        45: "🌫️", 48: "🌫️",
        51: "🌦️", 53: "🌦️", 55: "🌧️",
        61: "🌧️", 63: "🌧️", 65: "🌧️",
        71: "🌨️", 73: "🌨️", 75: "❄️",
        80: "🌧️", 81: "🌧️", 82: "⛈️",
        95: "⛈️", 96: "⛈️", 99: "⛈️",
    }

    WMO_DESCRIPTIONS = {
        0: "Despejado", 1: "Mayormente despejado",
        2: "Parcialmente nublado", 3: "Nublado",
        45: "Niebla", 48: "Niebla helada",
        51: "Llovizna ligera", 53: "Llovizna", 55: "Llovizna intensa",
        61: "Lluvia ligera", 63: "Lluvia", 65: "Lluvia intensa",
        71: "Nieve ligera", 73: "Nieve", 75: "Nieve intensa",
        80: "Chubascos", 81: "Chubascos moderados", 82: "Chubascos fuertes",
        95: "Tormenta", 96: "Tormenta con granizo", 99: "Tormenta severa",
    }

    def __init__(self):
        self.query_count = 0

    def get_weather(self, location: str) -> Optional[str]:
        """
        Obtiene el clima para una ubicación.

        Args:
            location: Nombre de ciudad/lugar

        Returns:
            Texto formateado con el pronóstico
        """
        # 1. Geocodificar
        coords = self._geocode(location)
        if not coords:
            return f"❌ No pude encontrar la ubicación: {location}"

        lat, lon, display_name = coords

        # 2. Obtener clima
        weather = self._fetch_weather(lat, lon)
        if not weather:
            return f"❌ Error obteniendo clima para {display_name}"

        self.query_count += 1

        # 3. Formatear respuesta
        return self._format_response(weather, display_name)

    def _geocode(self, location: str) -> Optional[Tuple[float, float, str]]:
        """Geocodifica una ubicación con Nominatim."""
        try:
            params = {
                "q": location,
                "format": "json",
                "limit": 1,
                "accept-language": "es",
            }
            headers = {"User-Agent": "C8L-Bot/1.0"}
            r = requests.get(self.GEOCODE_URL, params=params,
                           headers=headers, timeout=10)
            if r.status_code == 200 and r.json():
                data = r.json()[0]
                return (
                    float(data["lat"]),
                    float(data["lon"]),
                    data.get("display_name", location).split(",")[0],
                )
        except Exception as e:
            logger.warning(f"Geocode error: {e}")
        return None

    def _fetch_weather(self, lat: float, lon: float) -> Optional[Dict]:
        """Obtiene datos meteorológicos de Open-Meteo."""
        try:
            params = {
                "latitude": lat,
                "longitude": lon,
                "current": "temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,apparent_temperature",
                "daily": "temperature_2m_max,temperature_2m_min,weather_code,precipitation_sum",
                "timezone": "auto",
                "forecast_days": 3,
            }
            r = requests.get(self.WEATHER_URL, params=params, timeout=10)
            if r.status_code == 200:
                return r.json()
        except Exception as e:
            logger.warning(f"Weather fetch error: {e}")
        return None

    def _format_response(self, data: Dict, location: str) -> str:
        """Formatea la respuesta del clima."""
        current = data.get("current", {})
        daily = data.get("daily", {})

        temp = current.get("temperature_2m", "?")
        feels_like = current.get("apparent_temperature", "?")
        humidity = current.get("relative_humidity_2m", "?")
        wind = current.get("wind_speed_10m", "?")
        code = current.get("weather_code", 0)

        icon = self.WMO_ICONS.get(code, "🌡️")
        desc = self.WMO_DESCRIPTIONS.get(code, "Desconocido")

        text = f"{icon} *Clima en {location}*\n\n"
        text += f"🌡️ Temperatura: {temp}°C\n"
        text += f"🤔 Sensación: {feels_like}°C\n"
        text += f"💧 Humedad: {humidity}%\n"
        text += f"💨 Viento: {wind} km/h\n"
        text += f"📋 Estado: {desc}\n"

        # Pronóstico 3 días
        if daily and daily.get("time"):
            text += "\n📅 *Próximos días:*\n"
            for i in range(min(3, len(daily["time"]))):
                day = daily["time"][i]
                t_max = daily["temperature_2m_max"][i]
                t_min = daily["temperature_2m_min"][i]
                d_code = daily["weather_code"][i]
                d_icon = self.WMO_ICONS.get(d_code, "🌡️")
                rain = daily.get("precipitation_sum", [0])[i]
                text += f"  {d_icon} {day}: {t_min}° / {t_max}°"
                if rain > 0:
                    text += f" 🌧️{rain}mm"
                text += "\n"

        return text
