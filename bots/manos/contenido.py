# -*- coding: utf-8 -*-
"""
🛠️ MANO 2 — Creador de Contenido Musical Autónomo
Usa SunoBotBridge para crear contenido REAL con Suno AI.
Puede:
  - Crear canciones bajo demanda
  - Crear contenido programado (cron)
  - Reparar/regenerar contenido fallido
  - Publicar en Telegram automáticamente
  - Aprender de errores y mejorar

Flujo autónomo:
  1. AION le asigna una tarea de contenido
  2. Mano2 genera con Suno via Bridge (auto-healing incluido)
  3. Envía resultado a Telegram (grupo o chat)
  4. Registra éxito/fallo para aprendizaje
"""

import time
import logging
import os
from typing import Dict, Any, Optional

from bots.base import BotBase

logger = logging.getLogger("c8l.mano2")


class Mano2Contenido(BotBase):
    """
    Creador de contenido musical autónomo.
    Usa Suno AI para generar canciones reales y publicarlas.
    """

    def __init__(self):
        super().__init__("MANO_2", "Creador de Contenido Musical")
        self._bridge = None

    @property
    def bridge(self):
        """SunoBotBridge lazy-loaded (evita imports circulares al inicializar)."""
        if self._bridge is None:
            try:
                import sys
                sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
                from suno_bot_bridge import SunoBotBridge
                self._bridge = SunoBotBridge(bot_name="MANO_2")
            except Exception as e:
                logger.error(f"❌ No se pudo inicializar SunoBotBridge: {e}")
                self._bridge = None
        return self._bridge

    # ===== TAREA PRINCIPAL: fix (llamada por AION) =====

    async def fix(self, task: dict) -> dict:
        """
        Resuelve una tarea de contenido asignada por AION.

        task puede tener:
          - action: "create_song", "fix_content", "regenerate", "remix", "schedule_content"
          - description: descripción/prompt para la canción
          - title: título (opcional)
          - tags: estilos (opcional)
          - chat_id: dónde enviar (opcional, default: grupo)
          - audio_id: para extend/remix (opcional)
        """
        action = task.get("action", "unknown")
        description = task.get("description", "")

        self.logger.info(f"🛠️ MANO_2 ejecutando: {action} — {description[:60]}")

        if action == "create_song":
            return await self._handle_create_song(task)
        elif action == "fix_content":
            return await self._handle_fix_content(task)
        elif action == "regenerate":
            return await self._handle_regenerate(task)
        elif action == "remix":
            return await self._handle_remix(task)
        elif action == "extend":
            return await self._handle_extend(task)
        elif action == "generate_lyrics":
            return await self._handle_lyrics(task)
        elif action == "schedule_content":
            return await self._handle_scheduled_content(task)
        else:
            return self.report(
                "warning",
                f"Acción desconocida: {action}. Documentada para revisión.",
                {"task": task, "requires_human": True},
            )

    # ===== CREAR CANCIÓN =====

    async def _handle_create_song(self, task: dict) -> dict:
        """Crea una canción con Suno y opcionalmente la envía por Telegram."""
        if not self.bridge:
            return self.report("error", "SunoBotBridge no disponible", {"task": task})

        prompt = task.get("description", "")
        title = task.get("title", "")
        tags = task.get("tags", "")
        chat_id = task.get("chat_id", "")
        user_id = task.get("user_id", "admin")
        mode = task.get("mode", "simple")
        instrumental = task.get("instrumental", False)

        if not prompt:
            return self.report("error", "Sin prompt/descripción para generar", {"task": task})

        # Detectar si tiene estructura de letras
        has_structure = any(tag in prompt for tag in ["[Verse", "[Chorus", "[Bridge", "[Intro", "[Outro"])
        if has_structure:
            mode = "custom"

        self.logger.info(f"🎵 Generando: '{title or prompt[:40]}...' mode={mode}")

        # Si hay chat_id, usar create_and_send (genera + envía)
        if chat_id:
            try:
                from config import TELEGRAM_BOT_TOKEN
                bot_token = TELEGRAM_BOT_TOKEN
            except ImportError:
                bot_token = None

            if bot_token:
                result = self.bridge.create_and_send(
                    chat_id=str(chat_id),
                    prompt=prompt,
                    title=title,
                    tags=tags,
                    user_id=str(user_id),
                    mode=mode,
                    instrumental=instrumental,
                    bot_name="MANO_2",
                    bot_token=bot_token,
                    send_status_updates=True,
                )
            else:
                result = self.bridge.create_song(
                    prompt=prompt, title=title, tags=tags,
                    user_id=str(user_id), mode=mode,
                    instrumental=instrumental, bot_name="MANO_2"
                )
        else:
            # Solo generar (sin enviar)
            result = self.bridge.create_song(
                prompt=prompt, title=title, tags=tags,
                user_id=str(user_id), mode=mode,
                instrumental=instrumental, bot_name="MANO_2"
            )

        if result.get("success"):
            count = result.get("count", 0)
            tracks = result.get("tracks", [])
            track_ids = [t.get("id", "?") for t in tracks]

            # Guardar en memoria para referencia futura
            history = self.load_memory("created_tracks", [])
            for t in tracks:
                history.append({
                    "id": t.get("id"),
                    "title": t.get("title"),
                    "audio_url": t.get("audio_url"),
                    "created_at": time.strftime("%Y-%m-%d %H:%M:%S"),
                    "prompt": prompt[:100],
                })
            # Mantener últimos 50
            self.save_memory("created_tracks", history[-50:])

            return self.report(
                "ok",
                f"🎵 {count} canción(es) generada(s): {', '.join(t.get('title', '?') for t in tracks)}",
                {"tracks": track_ids, "count": count, "sent_to": chat_id or "none"},
            )
        else:
            error = result.get("error", "Error desconocido")
            return self.report(
                "error",
                f"❌ Fallo al generar: {error}",
                {"task": task, "error": error},
            )

    # ===== REGENERAR CONTENIDO FALLIDO =====

    async def _handle_regenerate(self, task: dict) -> dict:
        """Reintenta generar contenido que falló previamente."""
        # Usar el mismo flujo que create_song pero con contexto de retry
        task["action"] = "create_song"
        self.logger.info(f"🔄 Regenerando contenido fallido...")
        return await self._handle_create_song(task)

    # ===== FIX CONTENIDO =====

    async def _handle_fix_content(self, task: dict) -> dict:
        """Intenta reparar problemas de contenido."""
        problem = task.get("description", "")
        problem_type = task.get("problem_type", "unknown")

        self.logger.info(f"🔧 Reparando contenido: {problem[:60]}")

        # Si es un track con problemas de audio, intentar regenerar
        audio_id = task.get("audio_id", "")
        if audio_id and self.bridge:
            # Verificar estado del track
            try:
                from suno_client import SunoClient
                client = SunoClient()
                tracks = client.get_tracks([audio_id])
                if tracks and tracks[0].status == "complete" and tracks[0].audio_url:
                    return self.report("ok", "Track ya está completo y funcional", {"audio_id": audio_id})
            except Exception:
                pass

            # Si no está completo, regenerar
            task["action"] = "create_song"
            return await self._handle_create_song(task)

        return self.report(
            "warning",
            f"Contenido documentado para revisión: {problem[:80]}",
            {"task": task, "action_taken": "documented"},
        )

    # ===== REMIX =====

    async def _handle_remix(self, task: dict) -> dict:
        """Remixa un track existente."""
        if not self.bridge:
            return self.report("error", "SunoBotBridge no disponible", {"task": task})

        audio_id = task.get("audio_id", "")
        tags = task.get("tags", "")
        prompt = task.get("description", "")
        title = task.get("title", "")
        chat_id = task.get("chat_id", "")
        user_id = task.get("user_id", "admin")

        if not audio_id:
            return self.report("error", "Se necesita audio_id para remix", {"task": task})

        result = self.bridge.remix_track(
            audio_id=audio_id, tags=tags, prompt=prompt,
            title=title, user_id=str(user_id), bot_name="MANO_2"
        )

        if result.get("success"):
            # Enviar a Telegram si hay chat_id
            if chat_id and result.get("tracks"):
                try:
                    from config import TELEGRAM_BOT_TOKEN
                    self.bridge.send_to_telegram(
                        chat_id=str(chat_id),
                        track_data=result["tracks"][0],
                        caption=f"🎵 *Remix generado*\n🎨 {tags[:60]}\n🏛️ C8L Agency × Suno AI",
                        bot_token=TELEGRAM_BOT_TOKEN,
                    )
                except Exception as e:
                    self.logger.warning(f"No se pudo enviar remix a Telegram: {e}")

            return self.report("ok", f"Remix creado: {result['count']} versiones", {"tracks": result["tracks"]})
        return self.report("error", f"Remix falló: {result.get('error')}", {"task": task})

    # ===== EXTEND =====

    async def _handle_extend(self, task: dict) -> dict:
        """Extiende un track existente."""
        if not self.bridge:
            return self.report("error", "SunoBotBridge no disponible", {"task": task})

        audio_id = task.get("audio_id", "")
        prompt = task.get("description", "")
        continue_at = task.get("continue_at", None)
        tags = task.get("tags", "")
        title = task.get("title", "")
        user_id = task.get("user_id", "admin")

        if not audio_id:
            return self.report("error", "Se necesita audio_id para extend", {"task": task})

        result = self.bridge.extend_track(
            audio_id=audio_id, prompt=prompt, continue_at=continue_at,
            tags=tags, title=title, user_id=str(user_id), bot_name="MANO_2"
        )

        if result.get("success"):
            return self.report("ok", f"Track extendido: {result['count']} clips", {"tracks": result["tracks"]})
        return self.report("error", f"Extend falló: {result.get('error')}", {"task": task})

    # ===== LYRICS =====

    async def _handle_lyrics(self, task: dict) -> dict:
        """Genera letras con IA."""
        if not self.bridge:
            return self.report("error", "SunoBotBridge no disponible", {"task": task})

        prompt = task.get("description", "")
        user_id = task.get("user_id", "admin")

        if not prompt:
            return self.report("error", "Se necesita descripción para generar letras", {"task": task})

        result = self.bridge.generate_lyrics(prompt=prompt, user_id=str(user_id), bot_name="MANO_2")

        if result.get("success"):
            return self.report("ok", f"Letras generadas: '{result.get('title', '')}'",
                             {"title": result["title"], "text": result["text"]})
        return self.report("error", f"Letras fallaron: {result.get('error')}", {"task": task})

    # ===== CONTENIDO PROGRAMADO =====

    async def _handle_scheduled_content(self, task: dict) -> dict:
        """
        Genera contenido programado (llamado por cron/AION).
        Crea una canción con un tema del día y la publica en el grupo.
        """
        if not self.bridge:
            return self.report("error", "SunoBotBridge no disponible", {"task": task})

        # Temas rotatorios para contenido diario
        daily_themes = [
            {"prompt": "bolero house romántico nocturno, piano elegante, 122 BPM", "tags": "bolero house, romantic, piano, deep bass"},
            {"prompt": "reggaeton flamenco fusión con palmas y guitarra española", "tags": "reggaeton, flamenco, latin, 95 BPM"},
            {"prompt": "lo-fi hip hop para estudiar con lluvia de fondo", "tags": "lo-fi, hip hop, chill, rain sounds, study"},
            {"prompt": "trap latino oscuro con 808 y melodía triste", "tags": "trap, latin, dark, 808, melody"},
            {"prompt": "house progresivo con sintetizadores épicos y breakdown", "tags": "progressive house, synths, epic, 128 BPM"},
            {"prompt": "R&B moderno con voces suaves y beat nocturno", "tags": "rnb, modern, smooth, nighttime"},
            {"prompt": "dembow dominicano con flow rápido y energía", "tags": "dembow, dominican, fast flow, energy"},
        ]

        import datetime
        day_index = datetime.datetime.now().weekday()  # 0=Lunes
        theme = daily_themes[day_index % len(daily_themes)]

        # Verificar si ya se generó hoy
        last_scheduled = self.load_memory("last_scheduled_date", "")
        today = datetime.datetime.now().strftime("%Y-%m-%d")
        if last_scheduled == today:
            return self.report("ok", "Ya se generó contenido programado hoy", {"skipped": True})

        # Generar
        try:
            from config import GROUP_CHAT_ID, TELEGRAM_BOT_TOKEN
        except ImportError:
            GROUP_CHAT_ID = ""
            TELEGRAM_BOT_TOKEN = ""

        chat_id = task.get("chat_id", GROUP_CHAT_ID)

        result = self.bridge.create_song(
            prompt=theme["prompt"],
            title=f"C8L Daily #{day_index + 1}",
            tags=theme["tags"],
            user_id="admin",
            mode="simple",
            bot_name="MANO_2",
        )

        if result.get("success") and result.get("tracks"):
            # Enviar al grupo si hay token
            if chat_id and TELEGRAM_BOT_TOKEN:
                best_track = result["tracks"][0]
                self.bridge.send_to_telegram(
                    chat_id=str(chat_id),
                    track_data=best_track,
                    caption=(
                        f"🎵 *C8L Daily — Track del día*\n"
                        f"🎨 {theme['tags']}\n"
                        f"🤖 Generado automáticamente por MANO_2\n"
                        f"🏛️ C8L Agency × Suno AI"
                    ),
                    bot_token=TELEGRAM_BOT_TOKEN,
                )

            self.save_memory("last_scheduled_date", today)
            return self.report("ok", f"Contenido diario publicado: {result['tracks'][0].get('title', '?')}",
                             {"track": result["tracks"][0], "theme": theme})
        else:
            return self.report("error", f"Contenido diario falló: {result.get('error', '?')}",
                             {"theme": theme})

    # ===== UTILITY: Obtener últimos tracks creados =====

    def get_recent_tracks(self, limit: int = 10) -> list:
        """Devuelve los últimos tracks creados por este bot."""
        history = self.load_memory("created_tracks", [])
        return history[-limit:]

    # ===== UTILITY: Estado del bot =====

    def get_status(self) -> dict:
        """Estado actual del bot Mano2."""
        recent = self.get_recent_tracks(5)
        bridge_ok = self.bridge is not None

        return {
            "name": self.name,
            "role": self.role,
            "bridge_available": bridge_ok,
            "recent_tracks_count": len(self.load_memory("created_tracks", [])),
            "last_scheduled": self.load_memory("last_scheduled_date", "nunca"),
            "recent_tracks": [{"title": t.get("title"), "created_at": t.get("created_at")} for t in recent],
        }
