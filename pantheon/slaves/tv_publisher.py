# -*- coding: utf-8 -*-
"""
📺 TV PUBLISHER — Bot Esclavo (Canal Oficial C8L TV)
Publica contenido como usuario oficial en C8L TV.
"El Broadcaster de C8L"

El bot es un usuario mas, pero con titulo OFICIAL de la aplicacion.
Sube videos, tutoriales, musica, gaming y lives al feed de C8L TV.
"""

import logging
import requests
import json
import time
from openrouter_client import call_openrouter
from config import C8L_WEB_URL, ADMIN_CHAT_ID, TELEGRAM_BOT_TOKEN

logger = logging.getLogger("c8l.tv_publisher")

# API endpoint para publicar en TV
TV_API_URL = f"{C8L_WEB_URL}/api/tv/publish"
BOT_SECRET = "c8l-bot-panteon-2024-oficial"

# Telegram API para notificar
TG_API = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}"


class TVPublisher:
    """
    Canal Oficial del Bot en C8L TV.
    Publica contenido como un usuario mas pero con badge OFICIAL.
    """

    def __init__(self):
        self.published_count = 0
        self.errors = []
        logger.info("📺 TVPublisher inicializado — Canal Oficial activo")

    def publish(self, title, description, content_type="video", emoji="📺", video_url="", notify_admin=True):
        """
        Publica un video/contenido en C8L TV.

        Args:
            title: Titulo del video
            description: Descripcion
            content_type: 'video' | 'music' | 'live' | 'tutorial' | 'gaming'
            emoji: Emoji representativo
            video_url: URL del video (si existe)
            notify_admin: Avisar al admin via Telegram

        Returns:
            dict con success, postId, message
        """
        try:
            payload = {
                "secret": BOT_SECRET,
                "title": title,
                "description": description,
                "type": content_type,
                "emoji": emoji,
                "videoUrl": video_url,
            }

            response = requests.post(TV_API_URL, json=payload, timeout=30)

            if response.status_code == 200:
                data = response.json()
                self.published_count += 1
                logger.info(f"📺 Publicado en TV: {title}")

                # Notificar al admin
                if notify_admin:
                    self._notify_admin(
                        f"📺 *Nuevo en C8L TV*\n\n"
                        f"*{title}*\n"
                        f"{description[:100]}\n\n"
                        f"Tipo: {content_type} {emoji}\n"
                        f"Post #{self.published_count}"
                    )

                return {"success": True, "postId": data.get("postId"), "message": f"Publicado: {title}"}
            else:
                error_msg = f"Error HTTP {response.status_code}: {response.text[:100]}"
                self.errors.append(error_msg)
                logger.error(f"📺 Error publicando: {error_msg}")

                # Avisar del fallo
                if notify_admin:
                    self._notify_admin(f"⚠️ *Error en C8L TV*\n\n{error_msg}\n\nIntentando: {title}")

                return {"success": False, "message": error_msg}

        except Exception as e:
            error_msg = f"Exception: {str(e)[:150]}"
            self.errors.append(error_msg)
            logger.error(f"📺 Exception publicando: {error_msg}")

            if notify_admin:
                self._notify_admin(f"🔴 *FALLO TV Publisher*\n\n{error_msg}")

            return {"success": False, "message": error_msg}

    def publish_batch(self, videos):
        """
        Publica multiples videos de una vez.

        Args:
            videos: Lista de dicts con title, description, type, emoji

        Returns:
            dict con total, success, failed, results
        """
        results = []
        success = 0
        failed = 0

        for i, video in enumerate(videos):
            # Publicar con pausa entre cada uno (no saturar)
            result = self.publish(
                title=video.get("title", f"Video #{i+1}"),
                description=video.get("description", ""),
                content_type=video.get("type", "video"),
                emoji=video.get("emoji", "📺"),
                video_url=video.get("videoUrl", ""),
                notify_admin=False  # No spam al admin, notificar resumen al final
            )

            if result["success"]:
                success += 1
            else:
                failed += 1
            results.append(result)

            # Pausa de 1 segundo entre publicaciones
            if i < len(videos) - 1:
                time.sleep(1)

        # Notificar resumen al admin
        self._notify_admin(
            f"📺 *Batch publicado en C8L TV*\n\n"
            f"✅ Exitosos: {success}\n"
            f"❌ Fallidos: {failed}\n"
            f"📊 Total: {len(videos)}\n\n"
            f"El canal oficial tiene ahora {self.published_count} publicaciones."
        )

        return {
            "total": len(videos),
            "success": success,
            "failed": failed,
            "results": results
        }

    def generate_and_publish(self, tema=""):
        """
        Usa IA para generar contenido y publicarlo automaticamente.

        Args:
            tema: Tema opcional. Si no se da, genera algo aleatorio de C8L.

        Returns:
            dict con el resultado
        """
        prompt = f"""Genera un video para el canal oficial de C8L TV (plataforma de musica Bolero-House + gaming).
{'Tema: ' + tema if tema else 'Elige un tema relevante: musica, tutorial, gaming, o behind the scenes.'}

Responde SOLO en JSON valido con este formato exacto:
{{
  "title": "titulo del video (max 60 chars)",
  "description": "descripcion corta (max 150 chars)",
  "type": "video|music|tutorial|gaming|live",
  "emoji": "un emoji"
}}"""

        response = call_openrouter(prompt, agent_name="hermes", temperature=0.9, max_tokens=200)

        if not response:
            return {"success": False, "message": "No pude generar contenido con IA"}

        try:
            # Limpiar response (a veces viene con markdown)
            clean = response.strip()
            if clean.startswith("```"):
                clean = clean.split("\n", 1)[1].rsplit("```", 1)[0]
            data = json.loads(clean)

            return self.publish(
                title=data.get("title", "Video C8L"),
                description=data.get("description", ""),
                content_type=data.get("type", "video"),
                emoji=data.get("emoji", "📺"),
            )
        except json.JSONDecodeError as e:
            logger.warning(f"📺 JSON invalido de IA: {response[:100]}")
            # Publicar con el texto raw como titulo
            return self.publish(
                title=response[:60],
                description="Generado por IA",
                content_type="video",
                emoji="🎬",
            )

    def get_initial_content(self):
        """
        Retorna los 8 videos iniciales que el bot debe publicar al arrancar.
        Contenido curado de C8L Agency.
        """
        return [
            {
                "title": "Bolero-House Session #1 — Noche de Neon",
                "description": "Primera sesion oficial de produccion Bolero-House. Ritmos latinos fusionados con beats electronicos.",
                "type": "music",
                "emoji": "🎵"
            },
            {
                "title": "C8L Agency — Trailer Oficial 2026",
                "description": "Bienvenidos a C8L Agency. Musica, gaming, comunidad. Todo en un solo lugar.",
                "type": "video",
                "emoji": "🎬"
            },
            {
                "title": "Tutorial: Como crear beats con IA en 5 minutos",
                "description": "Aprende a usar inteligencia artificial para producir musica profesional desde cero.",
                "type": "tutorial",
                "emoji": "📚"
            },
            {
                "title": "LIVE: Torneo Casino Champions — Final",
                "description": "La gran final del torneo. 32 jugadores, 1 campeon. Premio: 5000 C8L coins.",
                "type": "live",
                "emoji": "🔴"
            },
            {
                "title": "Gameplay: Jackpot x100 en Ruleta C8L",
                "description": "Momentos epicos de la ruleta. Alguien acaba de ganar x100 su apuesta.",
                "type": "gaming",
                "emoji": "🎮"
            },
            {
                "title": "Bolero-House Session #2 — Amanecer Digital",
                "description": "Segunda sesion. Vibes de amanecer con sintetizadores y guitarra latina.",
                "type": "music",
                "emoji": "🎵"
            },
            {
                "title": "Detras de Camaras: El equipo C8L Agency",
                "description": "Conoce al equipo detras de la plataforma. IA, musica y comunidad.",
                "type": "video",
                "emoji": "🎬"
            },
            {
                "title": "Tutorial: Gana C8L Coins — Guia Completa",
                "description": "Todo lo que necesitas saber para ganar monedas en la plataforma C8L.",
                "type": "tutorial",
                "emoji": "📚"
            },
        ]

    def publish_initial_content(self):
        """Publica los 8 videos iniciales del canal oficial."""
        videos = self.get_initial_content()
        return self.publish_batch(videos)

    def get_stats(self):
        """Retorna estadisticas del canal."""
        return (
            f"📺 *C8L TV — Canal Oficial*\n\n"
            f"📊 Videos publicados: {self.published_count}\n"
            f"❌ Errores: {len(self.errors)}\n"
            f"🤖 Publisher: @leon_leo_bot (OFICIAL)\n\n"
            f"{'Ultimo error: ' + self.errors[-1] if self.errors else '✅ Sin errores'}"
        )

    def _notify_admin(self, text):
        """Envia notificacion al admin via Telegram."""
        try:
            requests.post(
                f"{TG_API}/sendMessage",
                json={
                    "chat_id": ADMIN_CHAT_ID,
                    "text": text,
                    "parse_mode": "Markdown"
                },
                timeout=10
            )
        except Exception as e:
            logger.warning(f"📺 No pude notificar admin: {e}")
