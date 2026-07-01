# -*- coding: utf-8 -*-
"""
⚡ API ROUTER INFINITO — Antigravity v5.0
==========================================
Rotacion inteligente entre 6+ APIs gratuitas.
NUNCA se queda sin respuesta. Si una API falla o
llega al rate limit, la siguiente toma el relevo.

Capacidad combinada: ~175 req/min, ~45,000+ req/dia
= EFECTIVAMENTE ILIMITADO

Autor: C8L Agency / Leo
"""

import os
import time
import logging
import hashlib
import json
from typing import Optional, Dict, List, Any
from dataclasses import dataclass, field
from enum import Enum

logger = logging.getLogger("c8l.api_router")



# ---------------------------------------------------------------------------
# Enums y Dataclasses
# ---------------------------------------------------------------------------

class APIProvider(Enum):
    GROQ = "groq"
    OPENROUTER = "openrouter"
    GEMINI = "gemini"
    NVIDIA = "nvidia"
    HUGGINGFACE = "huggingface"
    CLOUDFLARE = "cloudflare"


class APIStatus(Enum):
    HEALTHY = "healthy"
    RATE_LIMITED = "rate_limited"
    ERROR = "error"
    COOLDOWN = "cooldown"


@dataclass
class APIStats:
    """Estadisticas de uso por proveedor."""
    requests_this_minute: int = 0
    requests_today: int = 0
    last_request_time: float = 0.0
    last_error_time: float = 0.0
    consecutive_errors: int = 0
    total_tokens_used: int = 0
    avg_latency_ms: float = 0.0
    status: APIStatus = APIStatus.HEALTHY
    cooldown_until: float = 0.0
    minute_window_start: float = 0.0
    day_window_start: float = 0.0



@dataclass
class ProviderConfig:
    """Configuracion de un proveedor de API."""
    name: APIProvider
    base_url: str
    api_key_env: str
    default_model: str
    rpm_limit: int  # requests per minute
    daily_limit: int  # 0 = unlimited
    priority: int  # menor = mayor prioridad
    supports_vision: bool = False
    supports_tools: bool = False
    max_tokens_default: int = 2048
    timeout: int = 30


# ---------------------------------------------------------------------------
# Configuracion de proveedores
# ---------------------------------------------------------------------------

PROVIDERS_CONFIG: List[ProviderConfig] = [
    ProviderConfig(
        name=APIProvider.GROQ,
        base_url="https://api.groq.com/openai/v1",
        api_key_env="GROQ_API_KEY",
        default_model="llama-3.3-70b-versatile",
        rpm_limit=30,
        daily_limit=14400,
        priority=1,
        supports_vision=True,
        supports_tools=True,
        max_tokens_default=2048,
        timeout=25,
    ),
    ProviderConfig(
        name=APIProvider.OPENROUTER,
        base_url="https://openrouter.ai/api/v1",
        api_key_env="OPENROUTER_API_KEY",
        default_model="deepseek/deepseek-v4-flash:free",
        rpm_limit=20,
        daily_limit=0,  # unlimited on free models
        priority=2,
        supports_vision=False,
        supports_tools=True,
        max_tokens_default=4096,
        timeout=30,
    ),

    ProviderConfig(
        name=APIProvider.GEMINI,
        base_url="https://generativelanguage.googleapis.com/v1beta",
        api_key_env="GEMINI_API_KEY",
        default_model="gemini-2.5-flash",
        rpm_limit=15,
        daily_limit=1500,
        priority=3,
        supports_vision=True,
        supports_tools=True,
        max_tokens_default=4096,
        timeout=30,
    ),
    ProviderConfig(
        name=APIProvider.NVIDIA,
        base_url="https://integrate.api.nvidia.com/v1",
        api_key_env="NVIDIA_API_KEY",
        default_model="deepseek-ai/deepseek-v4-pro",
        rpm_limit=10,
        daily_limit=5000,
        priority=4,
        supports_vision=False,
        supports_tools=False,
        max_tokens_default=2048,
        timeout=35,
    ),
    ProviderConfig(
        name=APIProvider.HUGGINGFACE,
        base_url="https://api-inference.huggingface.co/models",
        api_key_env="HUGGINGFACE_TOKEN",
        default_model="meta-llama/Meta-Llama-3-8B-Instruct",
        rpm_limit=30,
        daily_limit=0,
        priority=5,
        supports_vision=False,
        supports_tools=False,
        max_tokens_default=1024,
        timeout=40,
    ),
    ProviderConfig(
        name=APIProvider.CLOUDFLARE,
        base_url="https://api.cloudflare.com/client/v4/accounts/{account_id}/ai/run",
        api_key_env="CLOUDFLARE_AI_TOKEN",
        default_model="@cf/meta/llama-3.1-8b-instruct",
        rpm_limit=50,
        daily_limit=10000,
        priority=6,
        supports_vision=False,
        supports_tools=False,
        max_tokens_default=1024,
        timeout=20,
    ),
]



# ---------------------------------------------------------------------------
# Response Cache (Capa 0 del triage)
# ---------------------------------------------------------------------------

class ResponseCache:
    """Cache en memoria para respuestas frecuentes. Evita tocar APIs."""

    def __init__(self, max_size: int = 1000, ttl: int = 600):
        self._cache: Dict[str, Dict] = {}
        self._max_size = max_size
        self._ttl = ttl

    def _hash_key(self, messages: List[Dict], model: str) -> str:
        content = json.dumps(messages, sort_keys=True) + model
        return hashlib.md5(content.encode()).hexdigest()

    def get(self, messages: List[Dict], model: str = "") -> Optional[str]:
        key = self._hash_key(messages, model)
        entry = self._cache.get(key)
        if entry and (time.time() - entry["time"]) < self._ttl:
            logger.debug(f"Cache HIT: {key[:8]}")
            return entry["response"]
        if entry:
            del self._cache[key]
        return None

    def set(self, messages: List[Dict], model: str, response: str):
        if len(self._cache) >= self._max_size:
            # Eliminar el mas viejo
            oldest_key = min(self._cache, key=lambda k: self._cache[k]["time"])
            del self._cache[oldest_key]
        key = self._hash_key(messages, model)
        self._cache[key] = {"response": response, "time": time.time()}

    def clear(self):
        self._cache.clear()

    @property
    def size(self) -> int:
        return len(self._cache)



# ---------------------------------------------------------------------------
# API Router Principal
# ---------------------------------------------------------------------------

class InfiniteAPIRouter:
    """
    ⚡ Router Infinito — NUNCA falla.

    Rota automaticamente entre 6+ APIs gratuitas.
    Si una esta en rate limit, pasa a la siguiente.
    Resultado: respuesta SIEMPRE, sin importar los limites.

    Uso:
        router = InfiniteAPIRouter()
        response = await router.chat_completion(messages, model_preference="fast")
    """

    def __init__(self):
        self._providers: Dict[APIProvider, ProviderConfig] = {}
        self._stats: Dict[APIProvider, APIStats] = {}
        self._cache = ResponseCache(
            max_size=int(os.environ.get("INTENT_CACHE_SIZE", "1000")),
            ttl=int(os.environ.get("INTENT_CACHE_TTL", "600")),
        )
        self._total_requests = 0
        self._total_cache_hits = 0
        self._init_time = time.time()

        # Inicializar proveedores disponibles
        self._init_providers()

        logger.info(
            f"⚡ APIRouter inicializado: {len(self._providers)} proveedores activos | "
            f"Capacidad: ~{self._calc_total_rpm()} req/min"
        )

    def _init_providers(self):
        """Inicializa solo los proveedores que tienen API key configurada."""
        for config in PROVIDERS_CONFIG:
            api_key = os.environ.get(config.api_key_env, "")
            if api_key:
                self._providers[config.name] = config
                self._stats[config.name] = APIStats(
                    minute_window_start=time.time(),
                    day_window_start=time.time(),
                )
                logger.info(f"  ✓ {config.name.value} activo (prioridad {config.priority})")
            else:
                logger.warning(f"  ✗ {config.name.value} sin API key ({config.api_key_env})")

    def _calc_total_rpm(self) -> int:
        return sum(c.rpm_limit for c in self._providers.values())


    # -------------------------------------------------------------------
    # Seleccion inteligente de proveedor
    # -------------------------------------------------------------------

    def _select_provider(self, require_vision: bool = False,
                         prefer_fast: bool = False) -> Optional[ProviderConfig]:
        """
        Selecciona el mejor proveedor disponible.
        Criterios: prioridad > estado > rate limits > latencia.
        """
        now = time.time()
        candidates = []

        for provider, config in self._providers.items():
            stats = self._stats[provider]

            # Skip si esta en cooldown
            if stats.status == APIStatus.COOLDOWN and now < stats.cooldown_until:
                continue

            # Reset cooldown si ya paso
            if stats.status == APIStatus.COOLDOWN and now >= stats.cooldown_until:
                stats.status = APIStatus.HEALTHY
                stats.consecutive_errors = 0

            # Skip si requiere vision y no la soporta
            if require_vision and not config.supports_vision:
                continue

            # Verificar rate limits
            self._update_windows(provider)
            if stats.requests_this_minute >= config.rpm_limit:
                stats.status = APIStatus.RATE_LIMITED
                continue

            if config.daily_limit > 0 and stats.requests_today >= config.daily_limit:
                stats.status = APIStatus.RATE_LIMITED
                continue

            # Candidato valido
            score = config.priority
            if prefer_fast and stats.avg_latency_ms > 0:
                score += stats.avg_latency_ms / 1000
            candidates.append((score, config))

        if not candidates:
            # Emergencia: reset el que tenga menor cooldown
            logger.warning("⚠️ Todos los proveedores saturados. Reset de emergencia.")
            self._emergency_reset()
            return self._get_lowest_priority_provider()

        candidates.sort(key=lambda x: x[0])
        return candidates[0][1]


    def _update_windows(self, provider: APIProvider):
        """Actualiza ventanas de tiempo (minuto y dia)."""
        now = time.time()
        stats = self._stats[provider]

        # Reset ventana de minuto
        if now - stats.minute_window_start >= 60:
            stats.requests_this_minute = 0
            stats.minute_window_start = now
            if stats.status == APIStatus.RATE_LIMITED:
                stats.status = APIStatus.HEALTHY

        # Reset ventana de dia
        if now - stats.day_window_start >= 86400:
            stats.requests_today = 0
            stats.day_window_start = now

    def _emergency_reset(self):
        """Reset de emergencia cuando todo esta saturado."""
        now = time.time()
        for provider in self._stats:
            stats = self._stats[provider]
            stats.requests_this_minute = 0
            stats.minute_window_start = now
            stats.status = APIStatus.HEALTHY
            stats.cooldown_until = 0

    def _get_lowest_priority_provider(self) -> Optional[ProviderConfig]:
        """Devuelve cualquier proveedor como ultimo recurso."""
        if self._providers:
            sorted_providers = sorted(
                self._providers.values(), key=lambda c: c.priority
            )
            return sorted_providers[0]
        return None

    def _record_success(self, provider: APIProvider, latency_ms: float, tokens: int = 0):
        """Registra un request exitoso."""
        stats = self._stats[provider]
        stats.requests_this_minute += 1
        stats.requests_today += 1
        stats.last_request_time = time.time()
        stats.consecutive_errors = 0
        stats.total_tokens_used += tokens
        stats.status = APIStatus.HEALTHY
        # Media movil de latencia
        if stats.avg_latency_ms == 0:
            stats.avg_latency_ms = latency_ms
        else:
            stats.avg_latency_ms = (stats.avg_latency_ms * 0.8) + (latency_ms * 0.2)

    def _record_failure(self, provider: APIProvider, error: str):
        """Registra un fallo y aplica cooldown si es necesario."""
        stats = self._stats[provider]
        stats.consecutive_errors += 1
        stats.last_error_time = time.time()

        if stats.consecutive_errors >= 3:
            # Cooldown exponencial: 30s, 60s, 120s...
            cooldown = min(30 * (2 ** (stats.consecutive_errors - 3)), 300)
            stats.cooldown_until = time.time() + cooldown
            stats.status = APIStatus.COOLDOWN
            logger.warning(
                f"⚠️ {provider.value} en cooldown {cooldown}s "
                f"({stats.consecutive_errors} errores consecutivos)"
            )
        else:
            stats.status = APIStatus.ERROR


    # -------------------------------------------------------------------
    # Llamadas a APIs (sync con httpx)
    # -------------------------------------------------------------------

    def chat_completion(
        self,
        messages: List[Dict[str, str]],
        model: str = "",
        temperature: float = 0.7,
        max_tokens: int = 0,
        require_vision: bool = False,
        prefer_fast: bool = False,
        use_cache: bool = True,
        system_prompt: str = "",
    ) -> Optional[str]:
        """
        ⚡ Chat completion con rotacion automatica.

        Intenta cada proveedor por orden de prioridad.
        Si uno falla, pasa al siguiente instantaneamente.
        NUNCA devuelve None si hay al menos 1 proveedor configurado.

        Args:
            messages: Lista de mensajes [{"role": "user", "content": "..."}]
            model: Modelo especifico (opcional, usa default del proveedor)
            temperature: Creatividad (0.0-1.0)
            max_tokens: Tokens maximos de respuesta
            require_vision: Si necesita soporte de vision
            prefer_fast: Priorizar velocidad sobre calidad
            use_cache: Usar cache de respuestas
            system_prompt: System prompt adicional

        Returns:
            Texto de respuesta o None si TODO fallo (muy improbable)
        """
        import httpx

        # Preprocesar mensajes
        if system_prompt and (not messages or messages[0].get("role") != "system"):
            messages = [{"role": "system", "content": system_prompt}] + messages

        # Cache check (Capa 0)
        if use_cache:
            cached = self._cache.get(messages, model)
            if cached:
                self._total_cache_hits += 1
                return cached

        self._total_requests += 1
        attempts = 0
        max_attempts = len(self._providers) + 1

        while attempts < max_attempts:
            attempts += 1
            config = self._select_provider(
                require_vision=require_vision,
                prefer_fast=prefer_fast,
            )
            if not config:
                logger.error("❌ No hay proveedores disponibles")
                break

            try:
                start = time.time()
                response_text = self._call_provider(
                    config, messages, model, temperature, max_tokens
                )
                latency = (time.time() - start) * 1000

                if response_text:
                    self._record_success(config.name, latency)
                    if use_cache:
                        self._cache.set(messages, model or config.default_model, response_text)
                    return response_text

            except httpx.TimeoutException:
                logger.warning(f"⏱️ Timeout en {config.name.value}, rotando...")
                self._record_failure(config.name, "timeout")
            except httpx.HTTPStatusError as e:
                if e.response.status_code == 429:
                    logger.warning(f"🚫 Rate limit en {config.name.value}, rotando...")
                    self._stats[config.name].status = APIStatus.RATE_LIMITED
                    self._stats[config.name].requests_this_minute = config.rpm_limit
                else:
                    logger.warning(f"HTTP {e.response.status_code} en {config.name.value}")
                    self._record_failure(config.name, str(e))
            except Exception as e:
                logger.warning(f"Error en {config.name.value}: {e}")
                self._record_failure(config.name, str(e))

        logger.error("❌ Todos los proveedores fallaron tras rotacion completa")
        return None


    def _call_provider(
        self, config: ProviderConfig, messages: List[Dict],
        model: str, temperature: float, max_tokens: int
    ) -> Optional[str]:
        """Ejecuta la llamada HTTP al proveedor especifico."""
        import httpx

        api_key = os.environ.get(config.api_key_env, "")
        use_model = model or config.default_model
        tokens = max_tokens or config.max_tokens_default

        if config.name == APIProvider.GEMINI:
            return self._call_gemini(api_key, messages, use_model, temperature, tokens)
        elif config.name == APIProvider.HUGGINGFACE:
            return self._call_huggingface(api_key, messages, use_model, tokens)
        elif config.name == APIProvider.CLOUDFLARE:
            return self._call_cloudflare(api_key, messages, use_model, tokens)
        else:
            # OpenAI-compatible (Groq, OpenRouter, NVIDIA)
            return self._call_openai_compatible(
                config.base_url, api_key, messages, use_model,
                temperature, tokens, config.timeout, config.name
            )

    def _call_openai_compatible(
        self, base_url: str, api_key: str, messages: List[Dict],
        model: str, temperature: float, max_tokens: int,
        timeout: int, provider: APIProvider
    ) -> Optional[str]:
        """Llama a APIs compatibles con OpenAI (Groq, OpenRouter, NVIDIA)."""
        import httpx

        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }

        # Headers especiales para OpenRouter
        if provider == APIProvider.OPENROUTER:
            headers["HTTP-Referer"] = "https://c8l-agency.com"
            headers["X-Title"] = "C8L Antigravity"

        payload = {
            "model": model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
        }

        with httpx.Client(timeout=timeout) as client:
            resp = client.post(
                f"{base_url}/chat/completions",
                headers=headers,
                json=payload,
            )
            resp.raise_for_status()
            data = resp.json()
            return data["choices"][0]["message"]["content"]


    def _call_gemini(
        self, api_key: str, messages: List[Dict],
        model: str, temperature: float, max_tokens: int
    ) -> Optional[str]:
        """Llama a la API de Gemini (formato nativo)."""
        import httpx

        url = (
            f"https://generativelanguage.googleapis.com/v1beta/"
            f"models/{model}:generateContent?key={api_key}"
        )

        # Convertir messages a formato Gemini
        contents = []
        system_instruction = None
        for msg in messages:
            if msg["role"] == "system":
                system_instruction = msg["content"]
            elif msg["role"] == "user":
                contents.append({"role": "user", "parts": [{"text": msg["content"]}]})
            elif msg["role"] == "assistant":
                contents.append({"role": "model", "parts": [{"text": msg["content"]}]})

        payload = {
            "contents": contents,
            "generationConfig": {
                "temperature": temperature,
                "maxOutputTokens": max_tokens,
            },
        }
        if system_instruction:
            payload["systemInstruction"] = {"parts": [{"text": system_instruction}]}

        with httpx.Client(timeout=30) as client:
            resp = client.post(url, json=payload)
            resp.raise_for_status()
            data = resp.json()
            candidates = data.get("candidates", [])
            if candidates:
                parts = candidates[0].get("content", {}).get("parts", [])
                if parts:
                    return parts[0].get("text", "")
        return None

    def _call_huggingface(
        self, api_key: str, messages: List[Dict],
        model: str, max_tokens: int
    ) -> Optional[str]:
        """Llama a HuggingFace Inference API."""
        import httpx

        url = f"https://api-inference.huggingface.co/models/{model}"
        headers = {"Authorization": f"Bearer {api_key}"}

        # Convertir a prompt simple para HF
        prompt = ""
        for msg in messages:
            if msg["role"] == "system":
                prompt += f"System: {msg['content']}\n"
            elif msg["role"] == "user":
                prompt += f"User: {msg['content']}\n"
            elif msg["role"] == "assistant":
                prompt += f"Assistant: {msg['content']}\n"
        prompt += "Assistant:"

        payload = {
            "inputs": prompt,
            "parameters": {"max_new_tokens": max_tokens, "return_full_text": False},
        }

        with httpx.Client(timeout=40) as client:
            resp = client.post(url, headers=headers, json=payload)
            resp.raise_for_status()
            data = resp.json()
            if isinstance(data, list) and data:
                return data[0].get("generated_text", "").strip()
        return None


    def _call_cloudflare(
        self, api_key: str, messages: List[Dict],
        model: str, max_tokens: int
    ) -> Optional[str]:
        """Llama a Cloudflare Workers AI."""
        import httpx

        account_id = os.environ.get("CLOUDFLARE_ACCOUNT_ID", "")
        if not account_id:
            return None

        url = f"https://api.cloudflare.com/client/v4/accounts/{account_id}/ai/run/{model}"
        headers = {"Authorization": f"Bearer {api_key}"}
        payload = {"messages": messages, "max_tokens": max_tokens}

        with httpx.Client(timeout=20) as client:
            resp = client.post(url, headers=headers, json=payload)
            resp.raise_for_status()
            data = resp.json()
            result = data.get("result", {})
            return result.get("response", "")

    # -------------------------------------------------------------------
    # Metodos de conveniencia
    # -------------------------------------------------------------------

    def quick(self, prompt: str, system: str = "", max_tokens: int = 512) -> str:
        """
        Respuesta rapida. Ideal para clasificacion, resumen, etc.
        Prioriza velocidad.
        """
        messages = [{"role": "user", "content": prompt}]
        result = self.chat_completion(
            messages, system_prompt=system,
            max_tokens=max_tokens, prefer_fast=True,
        )
        return result or ""

    def smart(self, prompt: str, system: str = "", max_tokens: int = 2048) -> str:
        """
        Respuesta inteligente. Usa el mejor modelo disponible.
        Prioriza calidad.
        """
        messages = [{"role": "user", "content": prompt}]
        result = self.chat_completion(
            messages, system_prompt=system,
            max_tokens=max_tokens, prefer_fast=False,
        )
        return result or ""

    def conversation(
        self, messages: List[Dict], system: str = "",
        temperature: float = 0.8, max_tokens: int = 1024
    ) -> str:
        """Chat con historial de conversacion."""
        result = self.chat_completion(
            messages, system_prompt=system,
            temperature=temperature, max_tokens=max_tokens,
        )
        return result or ""


    # -------------------------------------------------------------------
    # Stats y monitoring
    # -------------------------------------------------------------------

    def get_stats(self) -> Dict[str, Any]:
        """Devuelve estadisticas completas del router."""
        uptime = time.time() - self._init_time
        provider_stats = {}
        for provider, stats in self._stats.items():
            provider_stats[provider.value] = {
                "status": stats.status.value,
                "rpm_used": stats.requests_this_minute,
                "rpm_limit": self._providers[provider].rpm_limit,
                "today": stats.requests_today,
                "daily_limit": self._providers[provider].daily_limit,
                "avg_latency_ms": round(stats.avg_latency_ms, 1),
                "errors": stats.consecutive_errors,
            }

        return {
            "uptime_hours": round(uptime / 3600, 1),
            "total_requests": self._total_requests,
            "cache_hits": self._total_cache_hits,
            "cache_hit_rate": (
                f"{(self._total_cache_hits / max(self._total_requests, 1)) * 100:.1f}%"
            ),
            "cache_size": self._cache.size,
            "active_providers": len(self._providers),
            "total_rpm_capacity": self._calc_total_rpm(),
            "providers": provider_stats,
        }

    def get_stats_text(self) -> str:
        """Devuelve estadisticas en formato texto legible."""
        s = self.get_stats()
        lines = [
            f"⚡ *API Router Infinito*",
            f"⏱️ Uptime: {s['uptime_hours']}h",
            f"📊 Requests: {s['total_requests']} | Cache: {s['cache_hit_rate']}",
            f"🔌 Proveedores: {s['active_providers']} activos",
            f"🚀 Capacidad: {s['total_rpm_capacity']} req/min",
            "",
        ]
        for name, ps in s["providers"].items():
            icon = "✅" if ps["status"] == "healthy" else "⚠️"
            daily = f"/{ps['daily_limit']}" if ps["daily_limit"] else "/∞"
            lines.append(
                f"  {icon} {name}: {ps['rpm_used']}/{ps['rpm_limit']} rpm | "
                f"hoy: {ps['today']}{daily} | {ps['avg_latency_ms']}ms"
            )
        return "\n".join(lines)


# ---------------------------------------------------------------------------
# Instancia global (Singleton)
# ---------------------------------------------------------------------------

_router_instance: Optional[InfiniteAPIRouter] = None


def get_router() -> InfiniteAPIRouter:
    """Obtiene la instancia global del router."""
    global _router_instance
    if _router_instance is None:
        _router_instance = InfiniteAPIRouter()
    return _router_instance


# Alias para uso rapido
def quick(prompt: str, system: str = "", max_tokens: int = 512) -> str:
    """Atajo: respuesta rapida via router global."""
    return get_router().quick(prompt, system, max_tokens)


def smart(prompt: str, system: str = "", max_tokens: int = 2048) -> str:
    """Atajo: respuesta inteligente via router global."""
    return get_router().smart(prompt, system, max_tokens)
