# -*- coding: utf-8 -*-
"""
🎵 SUNO CLIENT v2.0 — Full Suno Premium Integration for C8L
Account: rufinoleon30@gmail.com (Premium)

Features:
  - Generate (custom lyrics + simple description)
  - Extend / Continue from timestamp
  - Concat (merge extensions into one track)
  - Remix (restyle existing track)
  - Generate Lyrics (AI lyrics without audio)
  - Stem Separation (vocals + instrumental)
  - Get Feed / Library
  - Credits info
  - AUTO-REFRESH: Token JWT renewed every 50 min via Clerk
"""

import requests
import time
import os
import json
import logging
import re
import threading
import base64
from typing import List, Dict, Any, Optional

logger = logging.getLogger("c8l.suno")



class SunoConfig:
    """Suno API configuration — production endpoints."""
    BASE_URL = "https://studio-api.prod.suno.com"
    # Generation
    GENERATE_ENDPOINT = "/api/generate/v2-web/"
    # Feed / Track info
    FEED_ENDPOINT = "/api/feed/v2"
    FEED_ALL_ENDPOINT = "/api/feed/"
    # Billing
    CREDITS_ENDPOINT = "/api/billing/info/"
    # Lyrics generation (no audio)
    LYRICS_ENDPOINT = "/api/generate/lyrics/"
    LYRICS_STATUS_ENDPOINT = "/api/generate/lyrics/{gen_id}"
    # Stems (vocal/instrumental separation)
    STEMS_ENDPOINT = "/api/generate/stems/"
    # Concat (merge extended clips)
    CONCAT_ENDPOINT = "/api/generate/concat/"
    # Clerk auth
    CLERK_BASE = "https://clerk.suno.com"
    CLERK_TOKEN_ENDPOINT = "/v1/client/sessions/{sid}/tokens"
    TOKEN_REFRESH_INTERVAL = 50 * 60  # 50 min (token lasts 60)
    # Models
    MODELS = {
        "v3.5": "chirp-v3-5",
        "v4": "chirp-v4",
        "v4.5": "chirp-v4-5",
        "v5": "chirp-v5",
    }
    DEFAULT_MODEL = "chirp-v4"



class SunoTrack:
    """Represents a Suno-generated song/clip."""

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
        self.tags = data.get("metadata", {}).get("tags", "") or data.get("tags", "")
        self.prompt = data.get("metadata", {}).get("prompt", "") or data.get("prompt", "")
        self.lyrics = data.get("metadata", {}).get("prompt", "") or data.get("lyric", "")
        self.model_name = data.get("model_name", "")
        self.type = data.get("type", "gen")
        # Extension-specific
        self.continue_at = data.get("metadata", {}).get("continue_at", None)
        self.concat_url = data.get("metadata", {}).get("concat_url", "")
        # Stems
        self.stem_from_id = data.get("stem_from_id", "")

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
            "lyrics": self.lyrics,
            "model_name": self.model_name,
            "type": self.type,
        }

    def __repr__(self) -> str:
        return f"SunoTrack(id='{self.id[:8]}...', title='{self.title}', status='{self.status}')"



class SunoLyrics:
    """Represents AI-generated lyrics (no audio)."""

    def __init__(self, data: Dict[str, Any]):
        self.id = data.get("id", "")
        self.title = data.get("title", "")
        self.text = data.get("text", "")
        self.status = data.get("status", "")

    def to_dict(self) -> dict:
        return {"id": self.id, "title": self.title, "text": self.text, "status": self.status}

    def __repr__(self) -> str:
        return f"SunoLyrics(title='{self.title}', len={len(self.text)})"



class SunoClient:
    """
    Full Suno Premium Client — All features.
    Account: rufinoleon30@gmail.com
    AUTO-REFRESH: Renews JWT every 50 min via Clerk.

    Capabilities:
      - generate() / generate_simple() / generate_custom()
      - extend() — continue a track from a timestamp
      - concat() — merge extended clips into one
      - remix() — restyle an existing track
      - generate_lyrics() — AI lyrics without audio
      - get_stems() — vocal/instrumental separation
      - get_tracks() / get_feed() — library access
      - get_credits() — billing info
    """

    def __init__(self, cookie: str = None):
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
            "User-Agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/130.0.0.0 Safari/537.36"
            ),
        })

        if self.bearer_token:
            self.session.headers["Authorization"] = f"Bearer {self.bearer_token}"
            logger.info("🎵 Suno Client v2.0 inicializado con Bearer token")
        else:
            self.session.headers["Cookie"] = cookie
            logger.info("🎵 Suno Client v2.0 inicializado con cookie directa")

        # Auto-refresh setup
        if self._client_token and self._session_id:
            self._try_refresh_token()
            self._start_auto_refresh()
            logger.info(f"🔄 Auto-refresh activado (cada 50 min)")
        else:
            logger.warning("⚠️ No se pudo activar auto-refresh (falta __client o session_id)")


    # ===== AUTH / TOKEN MANAGEMENT =====

    def _extract_client_token(self, cookie: str) -> Optional[str]:
        """Extract __client token from Clerk cookie (needed for refresh)."""
        match = re.search(r'__client=([^;]+)', cookie)
        if match and len(match.group(1)) > 50:
            return match.group(1)
        return None

    def _extract_session_id(self, cookie: str) -> Optional[str]:
        """Extract Clerk session ID."""
        match = re.search(r'clerk_active_context=(session_[^;:&\s]+)', cookie)
        if match:
            return match.group(1)
        # Fallback: from JWT payload
        if self.bearer_token:
            try:
                parts = self.bearer_token.split('.')
                payload = parts[1] + '=' * (4 - len(parts[1]) % 4)
                data = json.loads(base64.urlsafe_b64decode(payload))
                return data.get("sid", "")
            except Exception:
                pass
        return None

    def _extract_bearer_token(self, cookie: str) -> Optional[str]:
        """Extract JWT from __session cookie."""
        patterns = [
            r'__session=([^;]+)',
            r'__session_Jnxw-muT=([^;]+)',
            r'__session_U9tcbTPE=([^;]+)',
        ]
        for pattern in patterns:
            match = re.search(pattern, cookie)
            if match:
                token = match.group(1)
                if token.count('.') >= 2 and len(token) > 100:
                    return token
        return None

    def _try_refresh_token(self) -> bool:
        """Refresh JWT via Clerk. Returns True on success."""
        if not self._client_token or not self._session_id:
            return False
        with self._refresh_lock:
            try:
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
                    if new_jwt and new_jwt.count('.') >= 2:
                        self.bearer_token = new_jwt
                        self.session.headers["Authorization"] = f"Bearer {new_jwt}"
                        self._last_refresh = time.time()
                        logger.info("🔄 Token Suno renovado exitosamente!")
                        return True
                elif response.status_code == 401:
                    logger.error("🔄 __client token expirado. Re-login necesario en suno.com")
                else:
                    logger.warning(f"🔄 Refresh falló: HTTP {response.status_code}")
            except Exception as e:
                logger.warning(f"🔄 Error en auto-refresh: {e}")
        return False

    def _start_auto_refresh(self):
        """Start daemon thread that refreshes token every 50 min."""
        def _loop():
            while True:
                time.sleep(SunoConfig.TOKEN_REFRESH_INTERVAL)
                self._try_refresh_token()
        t = threading.Thread(target=_loop, daemon=True, name="suno-token-refresh")
        t.start()


    # ===== HTTP REQUEST LAYER =====

    def _request(self, method: str, endpoint: str, **kwargs) -> Any:
        """Make request to Suno API. Auto-retries on 401."""
        url = SunoConfig.BASE_URL + endpoint
        try:
            response = self.session.request(method, url, timeout=30, **kwargs)
            response.raise_for_status()
            return response.json() if response.content else None
        except requests.exceptions.HTTPError as e:
            if e.response.status_code == 401:
                logger.info("🔄 Token expirado — intentando refresh...")
                if self._try_refresh_token():
                    response = self.session.request(method, url, timeout=30, **kwargs)
                    response.raise_for_status()
                    return response.json() if response.content else None
                raise Exception(
                    "SUNO_TOKEN_EXPIRED: No se pudo renovar. "
                    "Re-login en suno.com con rufinoleon30@gmail.com y copiar cookie."
                )
            raise
        except requests.exceptions.RequestException as e:
            logger.error(f"Request Error: {str(e)[:100]}")
            raise


    # ===== GENERATE (main creation) =====

    def generate(
        self,
        prompt: str,
        title: str = "",
        tags: str = "",
        is_custom: bool = True,
        make_instrumental: bool = False,
        wait_audio: bool = True,
        model: str = None,
        timeout: int = 120,
        continue_clip_id: str = None,
        continue_at: float = 0,
    ) -> List[SunoTrack]:
        """
        Generate a song on Suno.

        Args:
            prompt: Lyrics (if is_custom) or description (if not is_custom)
            title: Song title (custom mode only)
            tags: Style tags (e.g. "reggaeton, bolero house, 120 BPM")
            is_custom: True=custom lyrics mode, False=description mode
            make_instrumental: True for instrumental only
            wait_audio: Wait until audio is ready
            model: Suno model (chirp-v4, chirp-v4-5, chirp-v5)
            timeout: Max wait time in seconds
            continue_clip_id: Clip ID to extend from (for extend feature)
            continue_at: Timestamp to continue from (seconds)

        Returns:
            List of SunoTrack (normally 2 variations)
        """
        model = model or SunoConfig.DEFAULT_MODEL
        logger.info(f"🎵 Generando: '{title or prompt[:30]}...' model={model}")

        if is_custom:
            payload = {
                "prompt": prompt,
                "tags": tags,
                "title": title or "C8L Creation",
                "mv": model,
                "generation_type": "TEXT",
                "make_instrumental": make_instrumental,
                "continue_clip_id": continue_clip_id,
                "continue_at": continue_at,
                "task": None,
            }
        else:
            payload = {
                "gpt_description_prompt": prompt,
                "mv": model,
                "make_instrumental": make_instrumental,
                "generation_type": "TEXT",
                "continue_clip_id": continue_clip_id,
                "continue_at": continue_at,
                "task": None,
            }

        headers = dict(self.session.headers)
        headers["Content-Type"] = "text/plain;charset=UTF-8"

        response = self.session.post(
            SunoConfig.BASE_URL + SunoConfig.GENERATE_ENDPOINT,
            data=json.dumps(payload),
            headers=headers,
            timeout=30,
        )
        response.raise_for_status()
        data = response.json()

        clips = data.get("clips", [])
        if not clips:
            raise Exception("Suno no devolvio clips. Verifica creditos o token.")

        clip_ids = [clip["id"] for clip in clips]
        logger.info(f"🎵 Clips creados: {clip_ids}")

        if not wait_audio:
            return [SunoTrack(clip) for clip in clips]

        return self._poll_completion(clip_ids, timeout=timeout)


    # ===== EXTEND (continue a track from timestamp) =====

    def extend(
        self,
        audio_id: str,
        prompt: str = "",
        continue_at: float = None,
        tags: str = "",
        title: str = "",
        model: str = None,
        wait_audio: bool = True,
        timeout: int = 120,
    ) -> List[SunoTrack]:
        """
        Extend an existing track from a specific timestamp.

        Args:
            audio_id: ID of the existing clip to extend
            prompt: New lyrics for the extension (optional)
            continue_at: Timestamp in seconds to branch from (None = end)
            tags: Style tags (inherits from original if empty)
            title: Title for the extension
            model: Suno model to use

        Returns:
            List of SunoTrack with the extension clips
        """
        model = model or SunoConfig.DEFAULT_MODEL
        logger.info(f"🎵 Extendiendo clip {audio_id[:8]}... desde {continue_at}s")

        payload = {
            "prompt": prompt,
            "tags": tags,
            "title": title or "",
            "mv": model,
            "generation_type": "TEXT",
            "make_instrumental": False,
            "continue_clip_id": audio_id,
            "continue_at": continue_at if continue_at is not None else 0,
            "task": None,
        }

        headers = dict(self.session.headers)
        headers["Content-Type"] = "text/plain;charset=UTF-8"

        response = self.session.post(
            SunoConfig.BASE_URL + SunoConfig.GENERATE_ENDPOINT,
            data=json.dumps(payload),
            headers=headers,
            timeout=30,
        )
        response.raise_for_status()
        data = response.json()

        clips = data.get("clips", [])
        if not clips:
            raise Exception("No se generaron clips de extension.")

        clip_ids = [clip["id"] for clip in clips]
        logger.info(f"🎵 Extension clips: {clip_ids}")

        if not wait_audio:
            return [SunoTrack(clip) for clip in clips]
        return self._poll_completion(clip_ids, timeout=timeout)


    # ===== CONCAT (merge extended clips into one) =====

    def concat(self, clip_id: str, timeout: int = 60) -> SunoTrack:
        """
        Concatenate an extended clip with its parent into a single complete song.

        Args:
            clip_id: ID of the final extension clip (Suno traces lineage automatically)
            timeout: Max wait time

        Returns:
            Single SunoTrack with the full merged song
        """
        logger.info(f"🎵 Concatenando clip {clip_id[:8]}...")

        payload = {"clip_id": clip_id}

        data = self._request("POST", SunoConfig.CONCAT_ENDPOINT, json=payload)
        if not data:
            raise Exception("Concat no devolvio resultado.")

        # Poll until complete
        concat_id = data.get("id", clip_id)
        start = time.time()
        while time.time() - start < timeout:
            tracks = self.get_tracks([concat_id])
            if tracks and tracks[0].status == "complete":
                logger.info(f"🎵 Concat completo! {tracks[0].audio_url}")
                return tracks[0]
            time.sleep(5)

        raise TimeoutError(f"Timeout ({timeout}s) esperando concat")

    # ===== REMIX (restyle existing track) =====

    def remix(
        self,
        audio_id: str,
        prompt: str = "",
        tags: str = "",
        title: str = "",
        model: str = None,
        wait_audio: bool = True,
        timeout: int = 120,
    ) -> List[SunoTrack]:
        """
        Remix an existing track — keep the melody/structure but change style.

        Args:
            audio_id: ID of the track to remix
            prompt: New lyrics or description
            tags: New style tags (e.g. "jazz, lo-fi, chill")
            title: New title
            model: Model to use

        Returns:
            List of SunoTrack with remixed versions
        """
        model = model or SunoConfig.DEFAULT_MODEL
        logger.info(f"🎵 Remixando clip {audio_id[:8]}... estilo: {tags[:30]}")

        payload = {
            "prompt": prompt,
            "tags": tags,
            "title": title or "Remix",
            "mv": model,
            "generation_type": "TEXT",
            "make_instrumental": False,
            "continue_clip_id": audio_id,
            "continue_at": 0,
            "task": "remix",
        }

        headers = dict(self.session.headers)
        headers["Content-Type"] = "text/plain;charset=UTF-8"

        response = self.session.post(
            SunoConfig.BASE_URL + SunoConfig.GENERATE_ENDPOINT,
            data=json.dumps(payload),
            headers=headers,
            timeout=30,
        )
        response.raise_for_status()
        data = response.json()

        clips = data.get("clips", [])
        if not clips:
            raise Exception("No se generaron clips de remix.")

        clip_ids = [clip["id"] for clip in clips]
        if not wait_audio:
            return [SunoTrack(clip) for clip in clips]
        return self._poll_completion(clip_ids, timeout=timeout)


    # ===== GENERATE LYRICS (AI lyrics, no audio) =====

    def generate_lyrics(self, prompt: str, timeout: int = 30) -> SunoLyrics:
        """
        Generate AI lyrics from a description (no audio created).
        Use result with generate_custom() to turn lyrics into a song.

        Args:
            prompt: Description/theme for lyrics
                    e.g. "A reggaeton song about a liar ex-girlfriend"

        Returns:
            SunoLyrics with title and structured text
        """
        logger.info(f"🎵 Generando lyrics: '{prompt[:40]}...'")

        payload = {"prompt": prompt}
        data = self._request("POST", SunoConfig.LYRICS_ENDPOINT, json=payload)

        if not data:
            raise Exception("Lyrics generation failed — no response")

        gen_id = data.get("id", "")
        if not gen_id:
            # Direct response with lyrics
            return SunoLyrics(data)

        # Poll for completion
        start = time.time()
        while time.time() - start < timeout:
            status_url = SunoConfig.LYRICS_STATUS_ENDPOINT.format(gen_id=gen_id)
            result = self._request("GET", status_url)
            if result and result.get("status") == "complete":
                return SunoLyrics(result)
            time.sleep(2)

        raise TimeoutError(f"Timeout ({timeout}s) esperando lyrics")

    # ===== STEMS (vocal/instrumental separation) =====

    def get_stems(self, audio_id: str, timeout: int = 120) -> List[SunoTrack]:
        """
        Separate a track into vocal and instrumental stems.
        Useful for karaoke, remixing, or production.

        Args:
            audio_id: ID of the song to separate

        Returns:
            List of SunoTrack: [vocals_track, instrumental_track]
        """
        logger.info(f"🎵 Separando stems de clip {audio_id[:8]}...")

        payload = {"clip_id": audio_id}
        data = self._request("POST", SunoConfig.STEMS_ENDPOINT, json=payload)

        if not data:
            raise Exception("Stems generation failed — no response")

        # Data could be a list of stem clips or a dict with id
        if isinstance(data, list):
            stems = data
        else:
            # Need to poll
            stem_ids = [data.get("id", audio_id)]
            start = time.time()
            while time.time() - start < timeout:
                tracks = self.get_tracks(stem_ids)
                if all(t.status == "complete" for t in tracks):
                    return tracks
                time.sleep(5)
            raise TimeoutError(f"Timeout ({timeout}s) esperando stems")

        return [SunoTrack(s) for s in stems]


    # ===== FEED / LIBRARY =====

    def get_feed(self, page: int = 0, limit: int = 20) -> List[SunoTrack]:
        """
        Get your Suno library/feed (all your generated songs).

        Args:
            page: Page number (0-indexed)
            limit: Tracks per page

        Returns:
            List of SunoTrack from your library
        """
        params = {"page": page, "page_size": limit}
        data = self._request("GET", SunoConfig.FEED_ALL_ENDPOINT, params=params)

        if isinstance(data, list):
            return [SunoTrack(item) for item in data]
        clips = data.get("clips", data.get("songs", []))
        return [SunoTrack(item) for item in clips if isinstance(item, dict)]

    def get_tracks(self, ids: List[str]) -> List[SunoTrack]:
        """Get status/info of specific tracks by ID."""
        if not ids:
            return []
        id_string = ",".join(ids)
        data = self._request("GET", SunoConfig.FEED_ENDPOINT, params={"ids": id_string})
        clips = data.get("clips", data) if isinstance(data, dict) else data
        if isinstance(clips, list):
            return [SunoTrack(item) for item in clips if isinstance(item, dict)]
        return []

    def get_credits(self) -> dict:
        """Get billing/credits info for the account."""
        try:
            data = self._request("GET", SunoConfig.CREDITS_ENDPOINT)
            return {
                "credits_left": data.get("total_credits_left", 0),
                "monthly_limit": data.get("monthly_limit", 0),
                "monthly_usage": data.get("monthly_usage", 0),
                "period": data.get("period", ""),
                "plan": data.get("subscription_type", "premium"),
            }
        except Exception as e:
            return {"credits_left": -1, "error": str(e)}


    # ===== POLLING HELPER =====

    def _poll_completion(self, ids: List[str], timeout: int = 120, interval: int = 5) -> List[SunoTrack]:
        """Wait for tracks to complete generation."""
        start_time = time.time()
        while time.time() - start_time < timeout:
            tracks = self.get_tracks(ids)
            completed = [t for t in tracks if t.status == "complete"]
            streaming = [t for t in tracks if t.status == "streaming"]
            failed = [t for t in tracks if t.status in ("error", "failed")]

            if failed:
                raise Exception(f"Suno error: {failed[0].metadata}")

            if len(completed) == len(ids):
                logger.info(f"🎵 Listo! {len(completed)} tracks completos")
                return completed

            if streaming:
                ready = [t for t in streaming if t.audio_url]
                if len(ready) == len(ids):
                    return ready

            time.sleep(interval)

        raise TimeoutError(f"Timeout ({timeout}s) esperando generacion")

    # ===== CONVENIENCE METHODS =====

    def generate_simple(self, description: str, instrumental: bool = False, model: str = None) -> List[SunoTrack]:
        """Generate music from a simple description. Suno picks lyrics/style/title."""
        return self.generate(
            prompt=description,
            is_custom=False,
            make_instrumental=instrumental,
            wait_audio=True,
            model=model,
        )

    def generate_custom(
        self, lyrics: str, style: str, title: str = "C8L Creation",
        instrumental: bool = False, model: str = None
    ) -> List[SunoTrack]:
        """Generate music with custom lyrics and style tags."""
        return self.generate(
            prompt=lyrics,
            title=title,
            tags=style,
            is_custom=True,
            make_instrumental=instrumental,
            wait_audio=True,
            model=model,
        )

    def generate_instrumental(self, description: str, model: str = None) -> List[SunoTrack]:
        """Generate instrumental-only track from description."""
        return self.generate(
            prompt=description,
            is_custom=False,
            make_instrumental=True,
            wait_audio=True,
            model=model,
        )


# ---------------------------------------------------------------------------
# Quick test
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    client = SunoClient()
    credits = client.get_credits()
    print(f"🎵 Suno Client v2.0 — Credits: {credits}")
    print(f"   Account: rufinoleon30@gmail.com")
    print(f"   Features: generate, extend, remix, concat, lyrics, stems, feed")
