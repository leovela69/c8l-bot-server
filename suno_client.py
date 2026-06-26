# -*- coding: utf-8 -*-
"""
🎵 SUNO CLIENT — Generador de Musica Real para C8L Studio
Conecta con Suno AI Premium via cookie/session token.
Genera canciones completas con voz usando la cuenta de Leo.

AUTO-REFRESH: El token JWT expira cada 60 min. Este cliente
lo renueva automáticamente via Clerk sin intervención manual.
"""

import requests
import time
import os
import json
import logging
import re
import threading
from typing import List, Dict, Any, Optional

logger = logging.getLogger("c8l.suno")


class SunoConfig:
    BASE_URL = "https://studio-api.prod.suno.com"
    GENERATE_ENDPOINT = "/api/generate/v2-web/"
    FEED_ENDPOINT = "/api/feed/v2"
    CREDITS_ENDPOINT = "/api/billing/info/"
    CLERK_BASE = "https://clerk.suno.com"
    # Clerk token refresh endpoint (sesiones activas)
    CLERK_TOKEN_ENDPOINT = "/v1/client/sessions/{sid}/tokens?_clerk_js_version=5"
    # Intervalo de refresh (50 min — el token dura 60)
    TOKEN_REFRESH_INTERVAL = 50 * 60


class SunoTrack:
    """Representa una cancion generada por Suno."""

    def __init__(self, data: Dict[str, Any]):
        self.id = data.get("id", "")
        self.status = data.get("status", "unknown")
        self.title = data.get("title", "Sin titulo")
        self.audio_url = data.get("audio_url", "")
        self.image_url = data.get("image_url", "")
        self.image_large_url = data.get("image_large_url", "")
        self.video_url = data.get("video_url", "")
        self.created_at = data.get("created_at", "")
        self.metadata = data.get("metadata", {})
        self.duration = data.get("metadata", {}).get("duration", None)
        self.tags = data.get("metadata", {}).get("tags", "")
        self.prompt = data.get("metadata", {}).get("prompt", "")

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "status": self.status,
            "title": self.title,
            "audio_url": self.audio_url,
            "image_url": self.image_url,
            "image_large_url": self.image_large_url,
            "video_url": self.video_url,
            "created_at": self.created_at,
            "duration": self.duration,
            "tags": self.tags,
        }

    def __repr__(self) -> str:
        return f"SunoTrack(id='{self.id[:8]}...', title='{self.title}', status='{self.status}')"


class SunoClient:
    """
    Cliente para generar musica via Suno AI Premium.
    AUTO-REFRESH: Renueva el token JWT automáticamente cada 50 min
    usando Clerk (el auth de Suno). Nunca más expira.
    """

    def __init__(self, cookie: str = None):
        """
        Inicializa el cliente Suno con auto-refresh de token.

        Args:
            cookie: Cookie completa de suno.com (document.cookie)
                    Si no se provee, usa SUNO_COOKIE de config.py
        """
        if cookie is None:
            from config import SUNO_COOKIE
            cookie = SUNO_COOKIE

        self.cookie = cookie
        self.bearer_token = self._extract_bearer_token(cookie)
        self._client_token = self._extract_client_token(cookie)
        self._session_id = self._extract_session_id(cookie)
        self._last_refresh = time.time()
        self._refresh_lock = threading.Lock()

        self.session = requests.Session()
        self.session.headers.update({
            "Accept": "*/*",
            "Accept-Language": "es-ES,es;q=0.9",
            "Origin": "https://suno.com",
            "Referer": "https://suno.com/",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
        })

        if self.bearer_token:
            self.session.headers["Authorization"] = f"Bearer {self.bearer_token}"
            logger.info("🎵 Suno Client inicializado con Bearer token")
        else:
            # Fallback: usar cookie directamente
            self.session.headers["Cookie"] = cookie
            logger.info("🎵 Suno Client inicializado con cookie directa")

        # Auto-refresh: intentar renovar ahora si el token ya expiró
        if self._client_token and self._session_id:
            self._try_refresh_token()
            # Iniciar thread de auto-refresh cada 50 min
            self._start_auto_refresh()
            logger.info(f"🔄 Auto-refresh activado (cada 50 min, session={self._session_id[:20]}...)")
        else:
            logger.warning("⚠️ No se pudo activar auto-refresh (falta __client o session_id)")

    def _extract_client_token(self, cookie: str) -> Optional[str]:
        """Extrae el __client token de Clerk (necesario para refresh)."""
        # __client es el token largo que Clerk usa para renovar sesiones
        match = re.search(r'__client=([^;]+)', cookie)
        if match:
            token = match.group(1)
            if len(token) > 50:
                return token
        return None

    def _extract_session_id(self, cookie: str) -> Optional[str]:
        """Extrae el session ID de Clerk."""
        # clerk_active_context=session_XXXXX o del JWT payload
        match = re.search(r'clerk_active_context=session_([^;:&\s]+)', cookie)
        if match:
            return "session_" + match.group(1)

        # Fallback: extraer del JWT si existe
        if self.bearer_token:
            try:
                import base64
                parts = self.bearer_token.split('.')
                payload = parts[1] + '=' * (4 - len(parts[1]) % 4)
                data = json.loads(base64.urlsafe_b64decode(payload))
                sid = data.get("sid", "")
                if sid:
                    return sid
            except:
                pass
        return None

    def _try_refresh_token(self):
        """Intenta renovar el JWT via Clerk. No lanza excepción si falla."""
        if not self._client_token or not self._session_id:
            return False

        with self._refresh_lock:
            try:
                # Clerk endpoint para renovar el token de una sesión activa
                url = f"{SunoConfig.CLERK_BASE}/v1/client/sessions/{self._session_id}/tokens"
                headers = {
                    "Accept": "*/*",
                    "Content-Type": "application/x-www-form-urlencoded",
                    "Origin": "https://suno.com",
                    "Referer": "https://suno.com/",
                    "Cookie": f"__client={self._client_token}",
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                }

                response = requests.post(url, headers=headers, timeout=15)

                if response.status_code == 200:
                    data = response.json()
                    new_jwt = data.get("jwt", "")
                    if not new_jwt:
                        # Algunos responses tienen estructura diferente
                        new_jwt = data.get("object") and data.get("jwt", "")

                    if new_jwt and new_jwt.count('.') >= 2:
                        self.bearer_token = new_jwt
                        self.session.headers["Authorization"] = f"Bearer {new_jwt}"
                        self._last_refresh = time.time()
                        logger.info("🔄 Token Suno renovado exitosamente!")
                        return True
                    else:
                        logger.warning(f"🔄 Refresh response sin JWT válido: {str(data)[:100]}")
                elif response.status_code == 401:
                    logger.error("🔄 __client token expirado. Necesita re-login manual en suno.com")
                else:
                    logger.warning(f"🔄 Refresh falló: HTTP {response.status_code} — {response.text[:100]}")

            except Exception as e:
                logger.warning(f"🔄 Error en auto-refresh: {e}")

        return False

    def _start_auto_refresh(self):
        """Inicia un thread daemon que renueva el token cada 50 minutos."""
        def _refresh_loop():
            while True:
                time.sleep(SunoConfig.TOKEN_REFRESH_INTERVAL)
                logger.info("🔄 Auto-refresh: renovando token Suno...")
                success = self._try_refresh_token()
                if not success:
                    logger.warning("🔄 Auto-refresh falló. El próximo request intentará de nuevo.")

        thread = threading.Thread(target=_refresh_loop, daemon=True, name="suno-token-refresh")
        thread.start()

    def _extract_bearer_token(self, cookie: str) -> Optional[str]:
        """Extrae el JWT token de __session o __session_Jnxw-muT de la cookie."""
        # Buscar __session= (sin sufijo, el principal)
        patterns = [
            r'__session=([^;]+)',
            r'__session_Jnxw-muT=([^;]+)',
            r'__session_U9tcbTPE=([^;]+)',
        ]

        for pattern in patterns:
            match = re.search(pattern, cookie)
            if match:
                token = match.group(1)
                # Verificar que es un JWT valido (tiene 3 partes separadas por .)
                if token.count('.') >= 2 and len(token) > 100:
                    logger.info(f"Token extraido de pattern: {pattern[:20]}...")
                    return token

        logger.warning("No se pudo extraer Bearer token de la cookie")
        return None

    def _request(self, method: str, endpoint: str, **kwargs) -> Any:
        """Hace una peticion a la API de Suno. Auto-renueva token si expira."""
        url = SunoConfig.BASE_URL + endpoint
        try:
            response = self.session.request(method, url, timeout=30, **kwargs)
            response.raise_for_status()
            return response.json() if response.content else None
        except requests.exceptions.HTTPError as e:
            logger.error(f"HTTP Error {e.response.status_code}: {e.response.text[:200]}")
            # Si es 401, intentar renovar token y reintentar UNA vez
            if e.response.status_code == 401:
                logger.info("🔄 Token expirado. Intentando auto-refresh...")
                if self._try_refresh_token():
                    # Reintentar con el token nuevo
                    try:
                        response = self.session.request(method, url, timeout=30, **kwargs)
                        response.raise_for_status()
                        return response.json() if response.content else None
                    except requests.exceptions.HTTPError as e2:
                        if e2.response.status_code == 401:
                            logger.error("🔄 Token renovado pero sigue fallando. __client expirado.")
                            raise Exception("SUNO_TOKEN_EXPIRED: El __client cookie expiró. Necesita re-login en suno.com y copiar cookie nueva.")
                        raise
                else:
                    raise Exception("SUNO_TOKEN_EXPIRED: No se pudo renovar. Re-login en suno.com y copiar cookie nueva.")
            raise
        except requests.exceptions.RequestException as e:
            logger.error(f"Request Error: {str(e)[:100]}")
            raise

    def get_credits(self) -> dict:
        """Obtiene info de creditos de la cuenta."""
        try:
            data = self._request("GET", SunoConfig.CREDITS_ENDPOINT)
            return {
                "credits_left": data.get("total_credits_left", 0),
                "monthly_limit": data.get("monthly_limit", 0),
                "monthly_usage": data.get("monthly_usage", 0),
                "period": data.get("period", ""),
            }
        except Exception as e:
            logger.error(f"Error obteniendo creditos: {e}")
            return {"credits_left": -1, "error": str(e)}

    def generate(
        self,
        prompt: str,
        title: str = "",
        tags: str = "",
        is_custom: bool = True,
        make_instrumental: bool = False,
        wait_audio: bool = True,
        model: str = "chirp-v4",
        timeout: int = 120,
    ) -> List[SunoTrack]:
        """
        Genera una cancion en Suno.

        Args:
            prompt: Si is_custom=True -> letras de la cancion
                    Si is_custom=False -> descripcion de la cancion
            title: Titulo de la cancion (solo si is_custom=True)
            tags: Estilo musical (ej: "reggaeton, bolero house, 120 BPM")
            is_custom: True=modo custom (letras), False=modo descripcion
            make_instrumental: True para generar solo instrumental
            wait_audio: Esperar a que el audio este listo
            model: Modelo de Suno a usar
            timeout: Tiempo maximo de espera en segundos

        Returns:
            Lista de SunoTrack con las canciones generadas (normalmente 2)
        """
        logger.info(f"🎵 Generando cancion: '{title or prompt[:30]}...'")

        # Construir payload
        if is_custom:
            payload = {
                "prompt": prompt,
                "tags": tags,
                "title": title or "C8L Creation",
                "mv": model,
                "generation_type": "TEXT",
                "make_instrumental": make_instrumental,
                "continue_clip_id": None,
                "continue_at": 0,
                "task": None,
            }
        else:
            payload = {
                "gpt_description_prompt": prompt,
                "mv": model,
                "make_instrumental": make_instrumental,
                "generation_type": "TEXT",
                "continue_clip_id": None,
                "continue_at": 0,
                "task": None,
            }

        # Enviar peticion de generacion
        headers = dict(self.session.headers)
        headers["Content-Type"] = "text/plain;charset=UTF-8"

        try:
            response = self.session.post(
                SunoConfig.BASE_URL + SunoConfig.GENERATE_ENDPOINT,
                data=json.dumps(payload),
                headers=headers,
                timeout=30,
            )
            response.raise_for_status()
            data = response.json()
        except Exception as e:
            logger.error(f"Error al generar: {e}")
            raise

        # Extraer clip IDs
        clips = data.get("clips", [])
        if not clips:
            logger.error(f"No se generaron clips. Response: {json.dumps(data)[:200]}")
            raise Exception("Suno no devolvio clips. Posible error de creditos o token.")

        clip_ids = [clip["id"] for clip in clips]
        logger.info(f"🎵 Clips creados: {clip_ids}")

        if not wait_audio:
            return [SunoTrack(clip) for clip in clips]

        # Polling hasta que esten listos
        return self._poll_completion(clip_ids, timeout=timeout)

    def _poll_completion(self, ids: List[str], timeout: int = 120, interval: int = 5) -> List[SunoTrack]:
        """Espera a que las canciones esten listas."""
        start_time = time.time()

        while time.time() - start_time < timeout:
            tracks = self.get_tracks(ids)
            completed = [t for t in tracks if t.status == "complete"]
            streaming = [t for t in tracks if t.status == "streaming"]
            failed = [t for t in tracks if t.status in ("error", "failed")]

            if failed:
                logger.error(f"Generacion fallida: {[t.id for t in failed]}")
                raise Exception(f"Suno error en generacion: {failed[0].metadata}")

            if len(completed) == len(ids):
                logger.info(f"🎵 Todas las canciones listas! ({len(completed)} tracks)")
                return completed

            # Si estan en streaming, ya tienen audio_url
            if streaming:
                ready = [t for t in streaming if t.audio_url]
                if len(ready) == len(ids):
                    logger.info(f"🎵 Canciones en streaming con audio disponible")
                    return ready

            status_str = f"complete={len(completed)}, streaming={len(streaming)}, pending={len(ids)-len(completed)-len(streaming)}"
            logger.info(f"⏳ Esperando... {status_str}")
            time.sleep(interval)

        raise TimeoutError(f"Timeout ({timeout}s) esperando generacion de Suno")

    def get_tracks(self, ids: List[str]) -> List[SunoTrack]:
        """Obtiene el estado actual de las canciones por ID."""
        if not ids:
            return []

        id_string = ",".join(ids)
        data = self._request("GET", SunoConfig.FEED_ENDPOINT, params={"ids": id_string})

        clips = data.get("clips", data) if isinstance(data, dict) else data
        if isinstance(clips, list):
            return [SunoTrack(item) for item in clips if isinstance(item, dict)]

        return []

    def generate_simple(self, description: str, instrumental: bool = False) -> List[SunoTrack]:
        """
        Genera musica con una descripcion simple (modo facil).
        Suno elige letra, estilo y titulo.

        Args:
            description: Ej: "Una cancion de reggaeton romantico para fiesta"
            instrumental: Si es solo instrumental

        Returns:
            Lista de SunoTrack
        """
        return self.generate(
            prompt=description,
            is_custom=False,
            make_instrumental=instrumental,
            wait_audio=True,
        )

    def generate_custom(
        self, lyrics: str, style: str, title: str = "C8L Creation", instrumental: bool = False
    ) -> List[SunoTrack]:
        """
        Genera musica con letra y estilo personalizados (modo avanzado).

        Args:
            lyrics: Letra completa con estructura [Verse], [Chorus], etc.
            style: Tags de estilo (ej: "reggaeton, bolero house, energetic, 120 BPM")
            title: Titulo de la cancion
            instrumental: Solo instrumental

        Returns:
            Lista de SunoTrack
        """
        return self.generate(
            prompt=lyrics,
            title=title,
            tags=style,
            is_custom=True,
            make_instrumental=instrumental,
            wait_audio=True,
        )


# ---------------------------------------------------------------------------
# Test rapido
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    client = SunoClient()
    credits = client.get_credits()
    print(f"Creditos: {credits}")
