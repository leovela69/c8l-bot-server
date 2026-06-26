# -*- coding: utf-8 -*-
"""
🎵 MUSICAPI CLIENT — Generación de música profesional con vocales
API: musicapi.ai — Modelo Sonic (misma calidad que Suno, sin CAPTCHA)

Features:
  - Canciones completas con vocales y letras
  - Modelos: sonic-v4-5, sonic-v5, sonic-v5-5
  - Custom mode (tus letras) o AI mode (describe y genera)
  - ~60-90 seg de generación
  - Sin CAPTCHA, sin cookies, solo API key

Uso:
    from musicapi_client import MusicAPIClient
    client = MusicAPIClient("tu_api_key")
    result = client.generate("reggaeton flamenco sobre una noche en Ibiza")
"""

import os
import sys
import time
import json
import logging
import requests
from typing import Dict, Any, Optional, List

logger = logging.getLogger("c8l.musicapi")

MUSICAPI_BASE = "https://api.musicapi.ai/api/v1"


class MusicAPIClient:
    """Cliente para MusicAPI.ai — música profesional con vocales."""

    def __init__(self, api_key: str = None):
        self.api_key = api_key or self._get_api_key()
        if not self.api_key:
            raise ValueError("Se necesita MUSICAPI_KEY")
        logger.info("🎵 MusicAPI Client inicializado")

    def _get_api_key(self) -> Optional[str]:
        """Obtiene API key."""
        key = os.environ.get("MUSICAPI_KEY", "")
        if key:
            return key
        try:
            sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
            from config import MUSICAPI_KEY
            return MUSICAPI_KEY
        except (ImportError, AttributeError):
            pass
        return None

    def _headers(self) -> dict:
        return {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

    # ===== GENERATE =====

    def generate(
        self,
        prompt: str,
        title: str = "",
        tags: str = "",
        custom_mode: bool = False,
        instrumental: bool = False,
        model: str = "sonic-v4-5",
        timeout: int = 180,
    ) -> Dict[str, Any]:
        """
        Genera una canción completa.

        Args:
            prompt: Letra (custom_mode=True) o descripción (custom_mode=False)
            title: Título (solo custom_mode)
            tags: Estilos ("reggaeton, flamenco, 100 BPM")
            custom_mode: True=tus letras, False=IA genera todo
            instrumental: Sin vocales
            model: sonic-v4-5, sonic-v5, sonic-v5-5
            timeout: Máximo espera

        Returns:
            {"success": bool, "tracks": [...], "count": N, "error": str}
        """
        has_structure = any(tag in prompt for tag in ["[Verse", "[Chorus", "[Bridge", "[Intro"])
        if has_structure:
            custom_mode = True

        if custom_mode:
            payload = {
                "custom_mode": True,
                "mv": model,
                "title": title or "C8L Track",
                "tags": tags or "latin, modern",
                "prompt": prompt,
                "make_instrumental": instrumental,
            }
        else:
            payload = {
                "custom_mode": False,
                "mv": model,
                "gpt_description_prompt": prompt,
                "make_instrumental": instrumental,
            }

        logger.info(f"🎵 MusicAPI: Generando '{prompt[:50]}...' model={model}")

        try:
            # 1. Crear tarea
            resp = requests.post(
                f"{MUSICAPI_BASE}/sonic/create",
                json=payload,
                headers=self._headers(),
                timeout=30,
            )

            if resp.status_code != 200:
                error = resp.text[:200]
                logger.error(f"🎵 MusicAPI create error {resp.status_code}: {error}")
                return {"success": False, "tracks": [], "count": 0, "error": f"HTTP {resp.status_code}: {error}"}

            data = resp.json()
            task_id = data.get("task_id", "")
            if not task_id:
                return {"success": False, "tracks": [], "count": 0, "error": "No task_id en respuesta"}

            logger.info(f"🎵 MusicAPI: Task creado: {task_id}")

            # 2. Poll hasta completar
            tracks = self._poll_task(task_id, timeout)
            if tracks:
                logger.info(f"🎵 ✅ MusicAPI: {len(tracks)} tracks generados!")
                return {"success": True, "tracks": tracks, "count": len(tracks), "error": ""}
            else:
                return {"success": False, "tracks": [], "count": 0, "error": "Timeout o fallo en generación"}

        except Exception as e:
            logger.error(f"🎵 MusicAPI error: {e}")
            return {"success": False, "tracks": [], "count": 0, "error": str(e)}

    def _poll_task(self, task_id: str, timeout: int = 180) -> Optional[List[dict]]:
        """Poll hasta que la tarea termine."""
        start = time.time()
        while time.time() - start < timeout:
            time.sleep(15)  # Esperar 15s entre polls
            try:
                resp = requests.get(
                    f"{MUSICAPI_BASE}/sonic/task/{task_id}",
                    headers=self._headers(),
                    timeout=15,
                )
                if resp.status_code != 200:
                    continue

                data = resp.json()

                # Check si es error "not ready"
                if data.get("type") == "not_ready":
                    continue

                # Check si hay clips
                clips = data.get("data", [])
                if not clips:
                    continue

                # Verificar si alguno está completo
                all_done = all(c.get("state") in ("succeeded", "complete", "streaming") for c in clips)
                any_audio = any(c.get("audio_url") for c in clips)

                if all_done or any_audio:
                    # Convertir a formato estándar
                    tracks = []
                    for clip in clips:
                        if clip.get("audio_url"):
                            tracks.append({
                                "id": clip.get("clip_id", ""),
                                "title": clip.get("title", "C8L Track"),
                                "audio_url": clip.get("audio_url", ""),
                                "image_url": clip.get("image_url", ""),
                                "lyrics": clip.get("lyrics", ""),
                                "tags": clip.get("tags", ""),
                                "duration": clip.get("duration"),
                                "model_name": clip.get("mv", model if 'model' in dir() else "sonic"),
                                "status": "complete",
                            })
                    if tracks:
                        return tracks

                # Si todavía "running", seguir esperando
                if any(c.get("state") == "running" for c in clips):
                    continue

            except Exception as e:
                logger.warning(f"🎵 Poll error: {e}")
                continue

        logger.warning(f"🎵 MusicAPI timeout ({timeout}s)")
        return None

    # ===== CREDITS =====

    def get_credits(self) -> dict:
        """Obtiene créditos restantes."""
        try:
            resp = requests.get(f"{MUSICAPI_BASE}/get-credits", headers=self._headers(), timeout=10)
            return resp.json()
        except Exception:
            return {"credits": -1}

    # ===== SEND TO TELEGRAM =====

    def send_to_telegram(
        self,
        chat_id: str,
        track: dict,
        bot_token: str = None,
    ) -> Dict[str, Any]:
        """Descarga y envía un track a Telegram."""
        if not bot_token:
            try:
                from config import TELEGRAM_BOT_TOKEN
                bot_token = TELEGRAM_BOT_TOKEN
            except ImportError:
                return {"success": False, "error": "No bot token"}

        audio_url = track.get("audio_url", "")
        title = track.get("title", "C8L Track")
        lyrics = track.get("lyrics", "")

        if not audio_url:
            return {"success": False, "error": "No audio_url"}

        try:
            # Descargar audio
            audio_resp = requests.get(audio_url, timeout=60)
            if audio_resp.status_code != 200:
                return {"success": False, "error": f"Download failed: {audio_resp.status_code}"}

            audio_bytes = audio_resp.content

            # Caption con letras (recortadas)
            caption = f"🎵 *{title}*\n"
            if track.get("tags"):
                caption += f"🎨 {track['tags'][:80]}\n"
            caption += f"\n🏛️ C8L Agency × AI Music"

            # Enviar
            url = f"https://api.telegram.org/bot{bot_token}/sendAudio"
            files = {"audio": (f"{title}.mp3", audio_bytes, "audio/mpeg")}
            data = {"chat_id": chat_id, "caption": caption, "parse_mode": "Markdown", "title": title}

            resp = requests.post(url, files=files, data=data, timeout=60)
            result = resp.json()

            if result.get("ok"):
                return {"success": True, "message_id": result["result"]["message_id"]}
            return {"success": False, "error": result.get("description", "Telegram error")}

        except Exception as e:
            return {"success": False, "error": str(e)}
