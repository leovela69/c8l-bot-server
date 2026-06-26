# -*- coding: utf-8 -*-
"""
🎵 SUNO BOT BRIDGE v1.0 — Puente entre Bots y SunoClient
Permite que CUALQUIER bot del ecosistema C8L use Suno para crear contenido real.

Features:
  - Generar canciones (custom lyrics + simple description)
  - Extender tracks existentes
  - Remix de tracks
  - Generar letras con IA
  - Separar stems (vocal/instrumental)
  - Auto-healing: refresh token, retry, backoff
  - Error learning: aprende de errores y aplica soluciones
  - Telegram delivery: envía audio directamente al chat
  - Control de créditos por usuario

Uso desde cualquier bot:
    from suno_bot_bridge import SunoBotBridge

    bridge = SunoBotBridge()
    result = bridge.create_song(
        prompt="Un reggaeton sobre el verano en Madrid",
        title="Verano Loco",
        tags="reggaeton, latin trap, 100 BPM",
        user_id="1970956749",
        bot_name="APOLO"
    )
    if result["success"]:
        audio_url = result["tracks"][0]["audio_url"]
        # Enviar por Telegram...
"""

import time
import logging
import os
import json
import requests
from typing import Dict, List, Any, Optional, Callable
from datetime import datetime

logger = logging.getLogger("c8l.suno_bridge")

# Paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))


class SunoBotBridge:
    """
    Puente robusto entre los bots y Suno.
    Maneja: errores, retries, token refresh, créditos, y Telegram delivery.
    """

    def __init__(self, bot_name: str = "BRIDGE"):
        self.bot_name = bot_name
        self._client = None
        self._credits_manager = None
        self._error_learner = None
        self._telegram_bot = None

    # ===== LAZY INIT (evita imports circulares) =====

    @property
    def client(self):
        """SunoClient lazy-loaded."""
        if self._client is None:
            from suno_client import SunoClient
            self._client = SunoClient()
        return self._client

    @property
    def credits_manager(self):
        """Credits manager lazy-loaded."""
        if self._credits_manager is None:
            from suno_credits import SunoCreditsManager
            self._credits_manager = SunoCreditsManager()
        return self._credits_manager

    @property
    def error_learner(self):
        """Error learner lazy-loaded."""
        if self._error_learner is None:
            from error_learner import get_error_learner
            self._error_learner = get_error_learner()
        return self._error_learner

    # ===== MAIN: Crear Canción =====

    def create_song(
        self,
        prompt: str,
        title: str = "",
        tags: str = "",
        user_id: str = "admin",
        mode: str = "custom",
        instrumental: bool = False,
        model: str = None,
        bot_name: str = None,
    ) -> Dict[str, Any]:
        """
        Crea una canción con Suno — método principal.

        Args:
            prompt: Letra (modo custom) o descripción (modo simple)
            title: Título de la canción
            tags: Estilos/tags ("reggaeton, bolero house, 120 BPM")
            user_id: ID del usuario que solicita
            mode: "custom" (con letras) o "simple" (descripción)
            instrumental: True para instrumental sin voz
            model: Modelo Suno (chirp-v4, chirp-v4-5, chirp-v5)
            bot_name: Nombre del bot que solicita

        Returns:
            {
                "success": True/False,
                "tracks": [{"id", "title", "audio_url", "duration", ...}],
                "count": N,
                "error": "" (si success=False),
                "credits_remaining": N,
            }
        """
        bot_name = bot_name or self.bot_name
        logger.info(f"🎵 [{bot_name}] Creando canción: '{title or prompt[:30]}...' para user={user_id}")

        # 1. Verificar créditos
        credit_check = self.credits_manager.can_generate(user_id, "generate")
        if not credit_check["allowed"]:
            logger.warning(f"🎵 [{bot_name}] Créditos insuficientes: {credit_check['reason']}")
            return {
                "success": False,
                "tracks": [],
                "count": 0,
                "error": credit_check["reason"],
                "credits_remaining": credit_check["remaining"],
            }

        # 2. Sanitizar inputs
        prompt = self._sanitize_text(prompt)
        title = self._sanitize_text(title) or "C8L Creation"
        tags = self._sanitize_text(tags)

        # 3. Generar con auto-healing
        def _do_generate():
            if mode == "custom":
                return self.client.generate(
                    prompt=prompt,
                    title=title,
                    tags=tags,
                    is_custom=True,
                    make_instrumental=instrumental,
                    model=model,
                    wait_audio=True,
                    timeout=180,
                )
            else:
                return self.client.generate(
                    prompt=prompt,
                    is_custom=False,
                    make_instrumental=instrumental,
                    model=model,
                    wait_audio=True,
                    timeout=180,
                )

        result = self._execute_with_healing(_do_generate, bot_name)

        if result["success"]:
            tracks = result["result"]
            track_dicts = [t.to_dict() for t in tracks]

            # Registrar generación en créditos
            self.credits_manager.record_generation(user_id, "generate", len(tracks))

            logger.info(f"🎵 [{bot_name}] ✅ {len(tracks)} tracks generados para user={user_id}")
            return {
                "success": True,
                "tracks": track_dicts,
                "count": len(tracks),
                "error": "",
                "credits_remaining": credit_check["remaining"] - 1,
            }
        else:
            logger.error(f"🎵 [{bot_name}] ❌ Fallo: {result.get('error', 'unknown')}")
            return {
                "success": False,
                "tracks": [],
                "count": 0,
                "error": result.get("error", "Error desconocido al generar"),
                "credits_remaining": credit_check["remaining"],
            }

    # ===== EXTEND: Extender track =====

    def extend_track(
        self,
        audio_id: str,
        prompt: str = "",
        continue_at: float = None,
        tags: str = "",
        title: str = "",
        user_id: str = "admin",
        bot_name: str = None,
    ) -> Dict[str, Any]:
        """Extiende un track existente desde un timestamp."""
        bot_name = bot_name or self.bot_name

        credit_check = self.credits_manager.can_generate(user_id, "extend")
        if not credit_check["allowed"]:
            return {"success": False, "tracks": [], "count": 0, "error": credit_check["reason"]}

        def _do_extend():
            return self.client.extend(
                audio_id=audio_id,
                prompt=prompt,
                continue_at=continue_at,
                tags=tags,
                title=title,
                wait_audio=True,
                timeout=180,
            )

        result = self._execute_with_healing(_do_extend, bot_name)

        if result["success"]:
            tracks = result["result"]
            self.credits_manager.record_generation(user_id, "extend", len(tracks))
            return {"success": True, "tracks": [t.to_dict() for t in tracks], "count": len(tracks), "error": ""}
        return {"success": False, "tracks": [], "count": 0, "error": result.get("error", "Error al extender")}

    # ===== REMIX: Remixar track =====

    def remix_track(
        self,
        audio_id: str,
        tags: str = "",
        prompt: str = "",
        title: str = "",
        user_id: str = "admin",
        bot_name: str = None,
    ) -> Dict[str, Any]:
        """Remixa un track existente con nuevo estilo."""
        bot_name = bot_name or self.bot_name

        credit_check = self.credits_manager.can_generate(user_id, "remix")
        if not credit_check["allowed"]:
            return {"success": False, "tracks": [], "count": 0, "error": credit_check["reason"]}

        def _do_remix():
            return self.client.remix(
                audio_id=audio_id,
                prompt=prompt,
                tags=tags,
                title=title,
                wait_audio=True,
                timeout=180,
            )

        result = self._execute_with_healing(_do_remix, bot_name)

        if result["success"]:
            tracks = result["result"]
            self.credits_manager.record_generation(user_id, "remix", len(tracks))
            return {"success": True, "tracks": [t.to_dict() for t in tracks], "count": len(tracks), "error": ""}
        return {"success": False, "tracks": [], "count": 0, "error": result.get("error", "Error en remix")}

    # ===== LYRICS: Generar letras IA =====

    def generate_lyrics(
        self,
        prompt: str,
        user_id: str = "admin",
        bot_name: str = None,
    ) -> Dict[str, Any]:
        """Genera letras con IA (sin audio)."""
        bot_name = bot_name or self.bot_name

        credit_check = self.credits_manager.can_generate(user_id, "lyrics")
        if not credit_check["allowed"]:
            return {"success": False, "error": credit_check["reason"]}

        def _do_lyrics():
            return self.client.generate_lyrics(prompt=prompt)

        result = self._execute_with_healing(_do_lyrics, bot_name)

        if result["success"]:
            lyrics = result["result"]
            return {"success": True, "title": lyrics.title, "text": lyrics.text, "error": ""}
        return {"success": False, "title": "", "text": "", "error": result.get("error", "Error generando letras")}

    # ===== STEMS: Separar vocal/instrumental =====

    def get_stems(
        self,
        audio_id: str,
        user_id: str = "admin",
        bot_name: str = None,
    ) -> Dict[str, Any]:
        """Separa vocals e instrumental de un track."""
        bot_name = bot_name or self.bot_name

        credit_check = self.credits_manager.can_generate(user_id, "stems")
        if not credit_check["allowed"]:
            return {"success": False, "stems": [], "error": credit_check["reason"]}

        def _do_stems():
            return self.client.get_stems(audio_id=audio_id)

        result = self._execute_with_healing(_do_stems, bot_name)

        if result["success"]:
            stems = result["result"]
            return {"success": True, "stems": [t.to_dict() for t in stems], "count": len(stems), "error": ""}
        return {"success": False, "stems": [], "count": 0, "error": result.get("error", "Error en stems")}

    # ===== FEED: Obtener biblioteca =====

    def get_library(self, page: int = 0, limit: int = 20) -> Dict[str, Any]:
        """Obtiene la biblioteca de tracks del usuario Suno."""
        def _do_feed():
            return self.client.get_feed(page=page, limit=limit)

        result = self._execute_with_healing(_do_feed, self.bot_name)

        if result["success"]:
            tracks = result["result"]
            return {"success": True, "tracks": [t.to_dict() for t in tracks], "count": len(tracks)}
        return {"success": False, "tracks": [], "count": 0, "error": result.get("error", "")}

    # ===== CREDITS: Info de créditos Suno =====

    def get_suno_credits(self) -> Dict[str, Any]:
        """Obtiene info de créditos de la cuenta Suno."""
        def _do_credits():
            return self.client.get_credits()

        result = self._execute_with_healing(_do_credits, self.bot_name)

        if result["success"]:
            return {"success": True, **result["result"]}
        return {"success": False, "error": result.get("error", "")}

    # ===== TELEGRAM: Enviar audio a un chat =====

    def send_to_telegram(
        self,
        chat_id: str,
        track_data: dict,
        caption: str = "",
        bot_token: str = None,
    ) -> Dict[str, Any]:
        """
        Descarga y envía un audio de Suno a un chat de Telegram.

        Args:
            chat_id: ID del chat de Telegram
            track_data: Dict con al menos "audio_url" y "title"
            caption: Texto del mensaje
            bot_token: Token del bot (usa el principal si no se especifica)

        Returns:
            {"success": bool, "message_id": int}
        """
        if not bot_token:
            try:
                from config import TELEGRAM_BOT_TOKEN
                bot_token = TELEGRAM_BOT_TOKEN
            except ImportError:
                # Intentar construirlo desde las partes
                try:
                    from config import _BOT_TOKEN_P1, _BOT_TOKEN_P2
                    bot_token = _BOT_TOKEN_P1 + _BOT_TOKEN_P2
                except ImportError:
                    return {"success": False, "error": "No se encontró token de Telegram"}

        audio_url = track_data.get("audio_url", "")
        title = track_data.get("title", "C8L Track")
        duration = track_data.get("duration", None)

        if not audio_url:
            return {"success": False, "error": "No hay audio_url en el track"}

        if not caption:
            tags = track_data.get("tags", "")
            caption = f"🎵 *{title}*\n"
            if tags:
                caption += f"🎨 Estilo: {tags[:80]}\n"
            if duration:
                mins = int(duration) // 60
                secs = int(duration) % 60
                caption += f"⏱ Duración: {mins}:{secs:02d}\n"
            caption += f"\n🏛️ Creado con C8L Agency × Suno AI"

        try:
            # Descargar audio
            logger.info(f"📥 Descargando audio: {audio_url[:60]}...")
            audio_response = requests.get(audio_url, timeout=60)
            audio_response.raise_for_status()
            audio_bytes = audio_response.content

            # Enviar a Telegram
            logger.info(f"📤 Enviando a Telegram chat={chat_id}...")
            tg_url = f"https://api.telegram.org/bot{bot_token}/sendAudio"

            files = {"audio": (f"{title}.mp3", audio_bytes, "audio/mpeg")}
            data = {
                "chat_id": chat_id,
                "caption": caption,
                "parse_mode": "Markdown",
                "title": title,
            }
            if duration:
                data["duration"] = int(duration)

            response = requests.post(tg_url, files=files, data=data, timeout=60)
            result = response.json()

            if result.get("ok"):
                msg_id = result["result"]["message_id"]
                logger.info(f"✅ Audio enviado a Telegram! msg_id={msg_id}")
                return {"success": True, "message_id": msg_id}
            else:
                error = result.get("description", "Error de Telegram")
                logger.error(f"❌ Telegram error: {error}")
                return {"success": False, "error": error}

        except Exception as e:
            logger.error(f"❌ Error enviando a Telegram: {e}")
            return {"success": False, "error": str(e)}

    # ===== COMBO: Crear + Enviar a Telegram =====

    def create_and_send(
        self,
        chat_id: str,
        prompt: str,
        title: str = "",
        tags: str = "",
        user_id: str = "admin",
        mode: str = "custom",
        instrumental: bool = False,
        bot_name: str = None,
        bot_token: str = None,
        send_status_updates: bool = True,
    ) -> Dict[str, Any]:
        """
        Flujo completo: Genera con Suno + Envía por Telegram.
        Este es el método que los bots deben usar para crear y compartir contenido.

        Args:
            chat_id: Chat de Telegram destino
            prompt: Letra o descripción
            title: Título
            tags: Estilos
            user_id: ID del usuario
            mode: "custom" o "simple"
            instrumental: Sin voz
            bot_name: Nombre del bot
            bot_token: Token de Telegram (opcional)
            send_status_updates: Enviar mensajes de estado ("Generando...", etc.)

        Returns:
            {"success": bool, "tracks": [...], "telegram_sent": bool}
        """
        bot_name = bot_name or self.bot_name

        # Enviar estado si se pide
        if send_status_updates and bot_token:
            self._send_telegram_text(
                chat_id, f"🎵 Generando: *{title or 'canción'}*...\n⏳ Esto toma ~60-90 segundos",
                bot_token
            )

        # Crear canción
        result = self.create_song(
            prompt=prompt,
            title=title,
            tags=tags,
            user_id=user_id,
            mode=mode,
            instrumental=instrumental,
            bot_name=bot_name,
        )

        if not result["success"]:
            if send_status_updates and bot_token:
                self._send_telegram_text(
                    chat_id, f"❌ Error: {result['error']}", bot_token
                )
            return {**result, "telegram_sent": False}

        # Enviar primer track (el mejor)
        telegram_sent = False
        if result["tracks"]:
            best_track = result["tracks"][0]
            tg_result = self.send_to_telegram(
                chat_id=chat_id,
                track_data=best_track,
                bot_token=bot_token,
            )
            telegram_sent = tg_result.get("success", False)

            # Si hay segundo track (variación), enviarla también
            if len(result["tracks"]) > 1:
                second_track = result["tracks"][1]
                second_track["title"] = f"{second_track.get('title', title)} (Variación)"
                self.send_to_telegram(
                    chat_id=chat_id,
                    track_data=second_track,
                    caption=f"🎵 *Variación alternativa*\n🏛️ C8L Agency × Suno AI",
                    bot_token=bot_token,
                )

        return {**result, "telegram_sent": telegram_sent}

    # ===== INTERNAL: Auto-healing execution =====

    def _execute_with_healing(self, func: Callable, bot_name: str) -> Dict[str, Any]:
        """
        Ejecuta una función con auto-healing:
        1. Intenta ejecutar
        2. Si falla → busca solución en ErrorLearner
        3. Aplica solución (refresh, retry, backoff)
        4. Registra resultado para aprendizaje
        5. Informa al AutoHealer del resultado
        """
        try:
            result = func()
            # Registrar éxito en healer
            try:
                from suno_auto_healer import get_healer
                get_healer().record_api_success()
            except Exception:
                pass
            return {"success": True, "result": result}
        except Exception as first_error:
            logger.warning(f"🧠 [{bot_name}] Error inicial: {first_error}")

            # Registrar fallo en healer
            try:
                from suno_auto_healer import get_healer
                get_healer().record_api_failure(str(first_error))
            except Exception:
                pass

            # Buscar solución aprendida
            solution = self.error_learner.find_solution(first_error)

            if solution:
                logger.info(f"🧠 [{bot_name}] Solución encontrada: {solution.description} (confianza: {solution.confidence:.0%})")

                # Aplicar solución
                healing_result = self.error_learner.apply_solution(
                    solution=solution,
                    retry_func=func,
                    context={"suno_client": self.client},
                )

                # Registrar resultado para aprendizaje
                solution_key = next(
                    (k for k, v in self.error_learner._solutions.items() if v == solution),
                    "unknown"
                )
                self.error_learner.record_outcome(
                    first_error, solution_key, healing_result["success"], bot_name
                )

                if healing_result["success"]:
                    logger.info(f"🧠 [{bot_name}] ✅ Auto-healed! Acción: {healing_result['action_taken']}")
                    try:
                        from suno_auto_healer import get_healer
                        get_healer().record_api_success()
                    except Exception:
                        pass
                    return {"success": True, "result": healing_result["result"]}
                else:
                    logger.error(f"🧠 [{bot_name}] ❌ Auto-healing falló: {healing_result['action_taken']}")
                    return {"success": False, "error": str(first_error), "healing_attempted": True}
            else:
                # Sin solución conocida — intentar retry básico
                logger.warning(f"🧠 [{bot_name}] Sin solución conocida, intentando retry básico...")
                time.sleep(5)
                try:
                    result = func()
                    # Si funciona, aprender la solución!
                    self.error_learner.learn_new_solution(
                        error_pattern=self._extract_error_pattern(first_error),
                        category=self.error_learner.classify_error(first_error),
                        solution_type="retry_with_delay",
                        solution_params={"wait_seconds": 5, "max_retries": 1},
                        description=f"Retry simple de 5s resolvió: {str(first_error)[:60]}",
                        learned_from=bot_name,
                    )
                    try:
                        from suno_auto_healer import get_healer
                        get_healer().record_api_success()
                    except Exception:
                        pass
                    return {"success": True, "result": result}
                except Exception as second_error:
                    logger.error(f"🧠 [{bot_name}] ❌ Retry básico también falló: {second_error}")
                    return {"success": False, "error": str(first_error)}

    def _extract_error_pattern(self, error: Exception) -> str:
        """Extrae un patrón regex del error para futuro matching."""
        error_str = str(error)
        # Extraer código de status si hay
        import re
        status_match = re.search(r'\b(4\d{2}|5\d{2})\b', error_str)
        if status_match:
            return status_match.group(0)
        # Extraer palabras clave
        keywords = re.findall(r'[A-Z_]{3,}', error_str)
        if keywords:
            return "|".join(keywords[:3])
        return error_str[:50].replace(" ", ".")

    # ===== INTERNAL: Telegram helpers =====

    def _send_telegram_text(self, chat_id: str, text: str, bot_token: str):
        """Envía un mensaje de texto simple a Telegram."""
        try:
            url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
            requests.post(url, json={
                "chat_id": chat_id,
                "text": text,
                "parse_mode": "Markdown",
            }, timeout=10)
        except Exception:
            pass  # No bloquear por fallos de notificación

    # ===== INTERNAL: Sanitización =====

    def _sanitize_text(self, text: str) -> str:
        """Limpia texto para evitar errores de API."""
        if not text:
            return ""
        # Quitar caracteres nulos y de control
        text = text.replace("\x00", "").strip()
        # Limitar longitud (Suno tiene límites)
        if len(text) > 3000:
            text = text[:3000]
        return text

    # ===== STATUS: Info del bridge =====

    def get_status(self) -> dict:
        """Estado completo del bridge."""
        try:
            credits = self.get_suno_credits()
        except Exception:
            credits = {"success": False, "error": "No se pudo obtener"}

        learner_stats = self.error_learner.get_stats()
        notifications = self.error_learner.get_pending_notifications()

        return {
            "bridge_version": "1.0",
            "bot_name": self.bot_name,
            "suno_credits": credits,
            "error_learner": learner_stats,
            "pending_notifications": notifications,
            "timestamp": datetime.now().isoformat(),
        }


# ===== Singleton para uso rápido =====
_bridge_instance: Optional[SunoBotBridge] = None


def get_suno_bridge(bot_name: str = "C8L") -> SunoBotBridge:
    """Obtiene instancia global del bridge."""
    global _bridge_instance
    if _bridge_instance is None:
        _bridge_instance = SunoBotBridge(bot_name=bot_name)
    return _bridge_instance
