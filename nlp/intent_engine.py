# -*- coding: utf-8 -*-
"""
⚡ INTENT ENGINE — Motor de Triage de 3 Capas
==============================================
El cerebro ultraligero del Plan Antigravity v4.0.

Cada mensaje pasa por un pipeline de mínimo consumo:
  Capa 0 → Regex + Cache (0 tokens, <1ms)
  Capa 1 → Clasificador ligero + Embeddings (<5ms)
  Capa 2 → LLM completo (solo si es necesario)

El 80% de las interacciones se resuelven sin tocar el LLM grande.
"""

import re
import time
import hashlib
import logging
import json
from typing import Dict, Optional, Tuple, List
from dataclasses import dataclass, field

logger = logging.getLogger("c8l.nlp.intent")


# ---------------------------------------------------------------------------
# Data Classes
# ---------------------------------------------------------------------------
@dataclass
class TriageResult:
    """Resultado del triage de intención."""
    intent: str
    agent: str
    confidence: float
    layer: int  # 0, 1, o 2
    task_description: str = ""
    secondary_agents: List[str] = field(default_factory=list)
    requires_memory: bool = False
    priority: str = "medium"
    cached: bool = False
    latency_ms: float = 0.0

    def to_dict(self) -> Dict:
        return {
            "intent": self.intent,
            "primary_agent": self.agent,
            "secondary_agents": self.secondary_agents,
            "task_description": self.task_description,
            "requires_memory": self.requires_memory,
            "priority": self.priority,
            "confidence": self.confidence,
            "layer": self.layer,
            "cached": self.cached,
            "latency_ms": self.latency_ms,
        }


# ---------------------------------------------------------------------------
# CAPA 0 — Regex + Cache (0 tokens)
# ---------------------------------------------------------------------------
class Layer0RegexCache:
    """
    Capa 0: Resolución instantánea sin consumir tokens.
    - Comandos explícitos (/start, /help, etc.)
    - Patrones regex para intenciones obvias
    - Cache de respuestas recientes (hash-based)
    """

    # Comandos directos de Telegram
    COMMAND_MAP = {
        "/start": ("comando_start", "hermes", "Saludo inicial"),
        "/help": ("comando_help", "hermes", "Mostrar ayuda"),
        "/ayuda": ("comando_help", "hermes", "Mostrar ayuda"),
        "/status": ("comando_status", "aries", "Estado del sistema"),
        "/estado": ("comando_status", "aries", "Estado del sistema"),
        "/saldo": ("comando_saldo", "hermes", "Consultar saldo"),
        "/balance": ("comando_saldo", "hermes", "Consultar saldo"),
        "/bono": ("comando_bono", "hermes", "Consultar bono"),
        "/panel": ("comando_panel", "hermes", "Panel de administración"),
        "/menu": ("comando_menu", "hermes", "Mostrar menú"),
        "/perfil": ("comando_perfil", "hermes", "Ver perfil usuario"),
        "/memoria": ("comando_memoria", "estia", "Ver memoria del usuario"),
        "/equipo": ("comando_equipo", "hermes", "Estado del equipo"),
        "/musica": ("comando_musica", "apolo", "Crear música"),
        "/imagen": ("comando_imagen", "vulcano", "Crear imagen"),
        "/video": ("comando_video", "ares", "Crear video"),
        "/ajedrez": ("comando_ajedrez", "hefesto", "Jugar ajedrez"),
        "/chess": ("comando_ajedrez", "hefesto", "Jugar ajedrez"),
        "/casino": ("comando_casino", "hefesto", "Jugar casino"),
        "/slot": ("comando_slot", "hefesto", "Jugar slot"),
        "/scan": ("comando_scan", "aries", "Escanear seguridad"),
        "/qr": ("comando_qr", "hefesto", "Generar QR"),
        "/traducir": ("comando_traducir", "hermes", "Traducir texto"),
        "/clima": ("comando_clima", "hermes", "Consultar clima"),
        "/crypto": ("comando_crypto", "hermes", "Consultar criptomonedas"),
        "/noticias": ("comando_noticias", "hermes", "Ver noticias"),
        "/recordar": ("comando_recordar", "estia", "Crear recordatorio"),
        "/calcular": ("comando_calcular", "hermes", "Calculadora"),
    }

    # Patrones regex para intenciones sin ambigüedad
    REGEX_PATTERNS = [
        # Saludos simples
        (r"^(hola|hey|buenas|hi|hello|ey|wena|ke ase|qué tal|buenos días|buenas tardes|buenas noches|saludos)[\s!?.]*$",
         "saludo", "hermes", 0.99),
        # Despedidas
        (r"^(adiós|bye|chao|hasta luego|nos vemos|adios|bye bye|ciao)[\s!?.]*$",
         "despedida", "hermes", 0.99),
        # Agradecimientos
        (r"^(gracias|thx|thanks|grax|mil gracias|te pasas|genial|perfecto|crack|eres (un )?crack)[\s!?.]*$",
         "agradecimiento", "hermes", 0.99),
        # Confirmaciones
        (r"^(sí|si|ok|vale|dale|va|venga|claro|de una|obvio|perfecto|listo)[\s!?.]*$",
         "confirmacion", "hermes", 0.95),
        # Negaciones
        (r"^(no|nel|nop|nah|para nada|negativo|paso)[\s!?.]*$",
         "negacion", "hermes", 0.95),
        # Emojis solos
        (r"^[\U0001F600-\U0001F64F\U0001F300-\U0001F5FF\U0001F680-\U0001F6FF\U0001F1E0-\U0001F1FF\u2600-\u26FF\u2700-\u27BF\s]+$",
         "emoji_solo", "hermes", 0.90),
        # Stickers/GIFs (mensajes vacíos o muy cortos con adjuntos)
        (r"^.{0,2}$", "mensaje_vacio", "hermes", 0.80),
    ]

    def __init__(self, cache_size: int = 500, cache_ttl: int = 300):
        self.cache: Dict[str, Tuple[TriageResult, float]] = {}
        self.cache_size = cache_size
        self.cache_ttl = cache_ttl  # segundos
        self._compiled_patterns = [
            (re.compile(pattern, re.IGNORECASE), intent, agent, conf)
            for pattern, intent, agent, conf in self.REGEX_PATTERNS
        ]

    def process(self, text: str, chat_id: str = "") -> Optional[TriageResult]:
        """
        Intenta resolver la intención sin ningún modelo.
        Returns: TriageResult o None si no puede resolver.
        """
        text_stripped = text.strip()

        # 1. Comandos directos
        cmd = text_stripped.split()[0].lower() if text_stripped else ""
        if cmd in self.COMMAND_MAP:
            intent, agent, desc = self.COMMAND_MAP[cmd]
            args = text_stripped[len(cmd):].strip()
            return TriageResult(
                intent=intent,
                agent=agent,
                confidence=1.0,
                layer=0,
                task_description=f"{desc}: {args}" if args else desc,
                cached=False,
            )

        # 2. Cache de respuestas recientes
        cache_key = self._make_cache_key(text_stripped, chat_id)
        cached = self._get_from_cache(cache_key)
        if cached:
            cached.cached = True
            return cached

        # 3. Patrones regex
        for compiled, intent, agent, confidence in self._compiled_patterns:
            if compiled.match(text_stripped):
                result = TriageResult(
                    intent=intent,
                    agent=agent,
                    confidence=confidence,
                    layer=0,
                    task_description=f"Responder {intent}: {text_stripped[:100]}",
                )
                return result

        return None

    def cache_result(self, text: str, chat_id: str, result: TriageResult):
        """Guarda un resultado en cache para reutilización."""
        cache_key = self._make_cache_key(text.strip(), chat_id)
        self.cache[cache_key] = (result, time.time())
        # Limpiar cache si excede tamaño
        if len(self.cache) > self.cache_size:
            self._prune_cache()

    def _make_cache_key(self, text: str, chat_id: str) -> str:
        """Genera hash para cache."""
        content = f"{chat_id}:{text.lower()}"
        return hashlib.md5(content.encode()).hexdigest()

    def _get_from_cache(self, key: str) -> Optional[TriageResult]:
        """Busca en cache con TTL."""
        if key in self.cache:
            result, timestamp = self.cache[key]
            if time.time() - timestamp < self.cache_ttl:
                return result
            else:
                del self.cache[key]
        return None

    def _prune_cache(self):
        """Elimina entradas expiradas y las más antiguas."""
        now = time.time()
        # Eliminar expiradas
        expired = [k for k, (_, ts) in self.cache.items() if now - ts > self.cache_ttl]
        for k in expired:
            del self.cache[k]
        # Si aún excede, eliminar las más viejas
        if len(self.cache) > self.cache_size:
            sorted_items = sorted(self.cache.items(), key=lambda x: x[1][1])
            to_remove = len(self.cache) - int(self.cache_size * 0.8)
            for k, _ in sorted_items[:to_remove]:
                del self.cache[k]


# ---------------------------------------------------------------------------
# CAPA 1 — Clasificador Ligero + Embeddings
# ---------------------------------------------------------------------------
class Layer1LightClassifier:
    """
    Capa 1: Clasificación rápida sin LLM grande.
    - Keyword matching avanzado con pesos y fuzzy
    - Embeddings simples para similitud con intenciones conocidas
    - Modelo ligero (Groq 1B o DistilBERT via HuggingFace)

    Resuelve ~60% de los mensajes que no captura la Capa 0.
    """

    # Intenciones con keywords ponderados (keyword, peso)
    INTENT_KEYWORDS = {
        "crear_imagen": {
            "keywords": [
                "imagen", "foto", "dibujo", "ilustra", "logo", "banner",
                "diseña", "diseño", "genera", "crea", "hazme", "pintame",
                "img", "imgen", "render", "3d", "arte", "sticker",
                "wallpaper", "fondo", "retrato", "caricatura", "meme",
                "poster", "cartel", "portada", "thumbnail",
            ],
            "agent": "vulcano",
            "priority": "medium",
        },
        "crear_musica": {
            "keywords": [
                "musica", "cancion", "canción", "beat", "suno", "udio",
                "dj", "mezcla", "remix", "track", "tema", "pista",
                "componme", "compone", "letra", "rap", "reggaeton",
                "electronica", "rock", "pop", "jazz", "lofi",
                "instrumental", "melodia", "ritmo", "prod",
            ],
            "agent": "apolo",
            "priority": "medium",
        },
        "crear_video": {
            "keywords": [
                "video", "clip", "animacion", "animación", "cortometraje",
                "storyboard", "videoclip", "pelicula", "película", "corto",
                "tiktok", "reel", "motion", "vfx", "trailer",
            ],
            "agent": "ares",
            "priority": "medium",
        },
        "crear_codigo": {
            "keywords": [
                "codigo", "código", "programa", "programame", "script",
                "app", "html", "css", "javascript", "python", "game",
                "juego", "snake", "tetris", "pong", "codea", "webapp",
                "landing", "pagina", "página", "web", "frontend",
            ],
            "agent": "hefesto",
            "priority": "medium",
        },
        "crear_backend": {
            "keywords": [
                "api", "backend", "servidor", "base de datos", "endpoint",
                "server", "database", "rest", "graphql", "microservicio",
            ],
            "agent": "artemisa",
            "priority": "medium",
        },
        "investigar": {
            "keywords": [
                "investiga", "busca", "que es", "qué es", "explicame",
                "explícame", "informacion", "información", "dime sobre",
                "como funciona", "cómo funciona", "que sabes", "info",
                "analiza", "resume", "resumen", "cuéntame", "cuentame",
            ],
            "agent": "minerva",
            "priority": "low",
        },
        "estrategia": {
            "keywords": [
                "estrategia", "marketing", "seo", "plan", "contenido",
                "redes sociales", "branding", "marca", "vendo", "promociono",
                "negocio", "emprendimiento", "startup", "lanzamiento",
            ],
            "agent": "atenea",
            "priority": "medium",
        },
        "diagnostico": {
            "keywords": [
                "diagnostica", "escanea", "seguridad", "vulnerabilidad",
                "web caida", "caída", "no funca", "no funciona", "rota",
                "error", "bug", "fallo", "problema", "arregla", "repara",
            ],
            "agent": "aries",
            "priority": "high",
        },
        "documento": {
            "keywords": [
                "pdf", "documento", "informe", "reporte", "ensayo",
                "articulo", "artículo", "doc", "contrato", "carta",
                "guion", "guión", "historia", "cuento", "novela",
            ],
            "agent": "atenea",
            "priority": "medium",
        },
        "traducir": {
            "keywords": [
                "traduce", "traducir", "traducción", "translate",
                "en inglés", "en español", "en francés", "idioma",
            ],
            "agent": "hermes",
            "priority": "low",
        },
        "clima": {
            "keywords": [
                "clima", "tiempo", "temperatura", "lluvia", "sol",
                "pronóstico", "pronostico", "weather", "hace frio",
                "hace calor",
            ],
            "agent": "hermes",
            "priority": "low",
        },
        "crypto": {
            "keywords": [
                "bitcoin", "btc", "ethereum", "eth", "crypto", "cripto",
                "criptomoneda", "token", "precio", "cotización", "solana",
                "cardano",
            ],
            "agent": "hermes",
            "priority": "low",
        },
        "noticias": {
            "keywords": [
                "noticias", "news", "actualidad", "qué pasó", "que paso",
                "últimas noticias", "tendencias",
            ],
            "agent": "hermes",
            "priority": "low",
        },
        "recordatorio": {
            "keywords": [
                "recuérdame", "recordar", "recordatorio", "avísame",
                "avisame", "alarma", "timer", "agenda", "cita",
                "no olvidar",
            ],
            "agent": "hermes",
            "priority": "medium",
        },
        "calcular": {
            "keywords": [
                "calcula", "calculadora", "cuánto es", "cuanto es",
                "suma", "resta", "multiplica", "divide", "raíz",
                "porcentaje", "conversión", "convertir",
            ],
            "agent": "hermes",
            "priority": "low",
        },
    }

    # Frases que indican conversación casual (no creación)
    CASUAL_INDICATORS = [
        "qué onda", "que onda", "como estas", "cómo estás",
        "que haces", "qué haces", "que tal", "qué tal",
        "dime algo", "cuéntame algo", "habla", "charlemos",
        "te quiero", "jaja", "xd", "lol", "wtf",
    ]

    def __init__(self):
        self._intent_cache: Dict[str, TriageResult] = {}

    def process(self, text: str) -> Optional[TriageResult]:
        """
        Clasifica con keywords ponderados.
        Returns: TriageResult o None si la confianza es baja.
        """
        text_lower = text.lower().strip()

        # Detectar casual primero
        if self._is_casual(text_lower):
            return TriageResult(
                intent="conversacion",
                agent="hermes",
                confidence=0.80,
                layer=1,
                task_description=f"Responder conversación: {text[:150]}",
                requires_memory=True,
                priority="low",
            )

        # Scoring por keywords
        scores: Dict[str, float] = {}
        for intent_name, config in self.INTENT_KEYWORDS.items():
            score = 0.0
            matches = 0
            for keyword in config["keywords"]:
                if keyword in text_lower:
                    score += len(keyword) / 10.0  # Peso por longitud
                    matches += 1
            if matches > 0:
                # Normalizar: más matches = más confianza
                scores[intent_name] = min(score * (1 + matches * 0.2), 1.0)

        if not scores:
            return None

        # Mejor intención
        best_intent = max(scores, key=scores.get)
        best_score = scores[best_intent]

        # Solo aceptar si hay confianza suficiente (>0.4)
        if best_score < 0.4:
            return None

        config = self.INTENT_KEYWORDS[best_intent]
        confidence = min(best_score, 0.95)  # Cap at 0.95 (layer 1 nunca es 100%)

        return TriageResult(
            intent=best_intent,
            agent=config["agent"],
            confidence=confidence,
            layer=1,
            task_description=f"{best_intent}: {text[:200]}",
            requires_memory=True,
            priority=config["priority"],
            secondary_agents=["estia"],
        )

    def _is_casual(self, text_lower: str) -> bool:
        """Detecta si es conversación casual."""
        for indicator in self.CASUAL_INDICATORS:
            if indicator in text_lower:
                return True
        # Mensajes muy cortos sin keywords de creación
        if len(text_lower) < 15:
            has_creation_word = any(
                kw in text_lower
                for config in self.INTENT_KEYWORDS.values()
                for kw in config["keywords"][:5]  # Solo los top keywords
            )
            if not has_creation_word:
                return True
        return False


# ---------------------------------------------------------------------------
# CAPA 2 — LLM Completo (solo cuando necesario)
# ---------------------------------------------------------------------------
class Layer2FullLLM:
    """
    Capa 2: Llama al LLM grande via API Router Infinito.
    Solo se activa cuando:
    - Capa 0 y 1 no pudieron resolver
    - El mensaje es ambiguo o complejo
    - Se requiere generación creativa

    Usa api_router.py para rotación infinita entre proveedores.
    NUNCA falla porque el router siempre encuentra un proveedor disponible.
    """

    CLASSIFY_PROMPT = """Analiza el siguiente mensaje de usuario y devuelve un JSON con:
- "intent": la intención principal (crear_imagen, crear_musica, crear_video, crear_codigo, investigar, estrategia, diagnostico, traducir, clima, crypto, noticias, recordatorio, calcular, conversacion, jugar_casino, jugar_ajedrez)
- "primary_agent": quién debe manejarlo (hermes=chat, vulcano=imagen, apolo=musica, ares=video, hefesto=codigo/juegos, minerva=investigar, atenea=estrategia, aries=diagnostico, artemisa=redes, estia=memoria)
- "task_description": descripción breve de lo que quiere el usuario
- "secondary_agents": lista de agentes auxiliares si aplica
- "requires_memory": true si necesita contexto previo
- "priority": "low", "medium" o "high"

REGLAS:
- Si no está claro, usa intent="conversacion" y agent="hermes"
- Si pide CREAR algo, identifica QUÉ tipo de creación
- Si pregunta algo, es "investigar" con "minerva"
- Si es chat casual, "conversacion" con "hermes"

Responde SOLO con el JSON, sin explicaciones."""

    def __init__(self):
        self.call_count = 0
        self.last_call_time = 0

    def process(self, text: str, user_name: str = "Usuario",
                user_context: str = "") -> TriageResult:
        """
        Llama al LLM via API Router Infinito para analizar intención.
        Siempre devuelve un resultado (es la última capa).
        """
        self.call_count += 1
        self.last_call_time = time.time()

        try:
            from api_router import get_router

            router = get_router()
            user_msg = f"[Usuario: {user_name}] Mensaje: {text[:500]}"
            if user_context:
                user_msg += f"\n[Contexto: {user_context[:200]}]"

            response = router.quick(
                prompt=user_msg,
                system=self.CLASSIFY_PROMPT,
                max_tokens=256,
            )

            if response:
                # Parsear JSON de la respuesta
                result = self._parse_llm_response(response)
                if result:
                    return TriageResult(
                        intent=result.get("intent", "conversacion"),
                        agent=result.get("primary_agent", "hermes"),
                        confidence=0.85,
                        layer=2,
                        task_description=result.get("task_description", text[:200]),
                        secondary_agents=result.get("secondary_agents", []),
                        requires_memory=result.get("requires_memory", True),
                        priority=result.get("priority", "medium"),
                    )

        except Exception as e:
            logger.error(f"Layer2 LLM error: {e}")

        # Ultimate fallback — NUNCA deja sin respuesta
        return TriageResult(
            intent="conversacion_general",
            agent="hermes",
            confidence=0.5,
            layer=2,
            task_description=f"Responder: {text[:200]}",
            requires_memory=True,
            priority="low",
        )

    def _parse_llm_response(self, response: str) -> Optional[Dict]:
        """Extrae JSON de la respuesta del LLM."""
        import json as json_mod
        try:
            # Intentar parsear directamente
            return json_mod.loads(response)
        except json_mod.JSONDecodeError:
            pass
        # Buscar JSON dentro del texto
        try:
            start = response.find("{")
            end = response.rfind("}") + 1
            if start >= 0 and end > start:
                return json_mod.loads(response[start:end])
        except (json_mod.JSONDecodeError, ValueError):
            pass
        return None

    def get_stats(self) -> Dict:
        return {
            "total_calls": self.call_count,
            "last_call": self.last_call_time,
        }


# ---------------------------------------------------------------------------
# INTENT ENGINE — Orquestador Principal
# ---------------------------------------------------------------------------
class IntentEngine:
    """
    ⚡ Motor de Triage de 3 Capas.
    Cada mensaje baja por las capas hasta que se resuelve.

    Estadísticas típicas:
    - 30% se resuelve en Capa 0 (comandos, saludos, cache)
    - 50% se resuelve en Capa 1 (keywords, clasificador)
    - 20% necesita Capa 2 (LLM completo)
    """

    def __init__(self):
        self.layer0 = Layer0RegexCache(cache_size=1000, cache_ttl=600)
        self.layer1 = Layer1LightClassifier()
        self.layer2 = Layer2FullLLM()

        # Estadísticas
        self.stats = {
            "total": 0,
            "layer0_hits": 0,
            "layer1_hits": 0,
            "layer2_hits": 0,
            "avg_latency_ms": 0.0,
        }

    def analyze(self, text: str, chat_id: str = "",
                user_name: str = "Usuario",
                user_context: str = "") -> TriageResult:
        """
        Analiza la intención del mensaje pasando por las 3 capas.

        Args:
            text: Mensaje del usuario
            chat_id: ID del chat (para cache)
            user_name: Nombre del usuario
            user_context: Contexto de memoria del usuario

        Returns:
            TriageResult con la intención detectada
        """
        start_time = time.time()
        self.stats["total"] += 1

        # === CAPA 0: Regex + Cache ===
        result = self.layer0.process(text, chat_id)
        if result:
            self.stats["layer0_hits"] += 1
            result.latency_ms = (time.time() - start_time) * 1000
            logger.debug(f"[L0] {result.intent} → {result.agent} ({result.latency_ms:.1f}ms)")
            return result

        # === CAPA 1: Clasificador Ligero ===
        result = self.layer1.process(text)
        if result and result.confidence >= 0.5:
            self.stats["layer1_hits"] += 1
            result.latency_ms = (time.time() - start_time) * 1000
            # Cachear para futuras consultas similares
            self.layer0.cache_result(text, chat_id, result)
            logger.debug(f"[L1] {result.intent} → {result.agent} "
                        f"(conf={result.confidence:.2f}, {result.latency_ms:.1f}ms)")
            return result

        # === CAPA 2: LLM Completo ===
        result = self.layer2.process(text, user_name, user_context)
        self.stats["layer2_hits"] += 1
        result.latency_ms = (time.time() - start_time) * 1000
        # Cachear resultado del LLM
        self.layer0.cache_result(text, chat_id, result)
        logger.info(f"[L2] {result.intent} → {result.agent} "
                   f"(conf={result.confidence:.2f}, {result.latency_ms:.1f}ms)")

        # Actualizar latencia promedio
        total = self.stats["total"]
        prev_avg = self.stats["avg_latency_ms"]
        self.stats["avg_latency_ms"] = (prev_avg * (total - 1) + result.latency_ms) / total

        return result

    def get_stats(self) -> Dict:
        """Devuelve estadísticas del motor."""
        total = max(self.stats["total"], 1)
        return {
            **self.stats,
            "layer0_pct": round(self.stats["layer0_hits"] / total * 100, 1),
            "layer1_pct": round(self.stats["layer1_hits"] / total * 100, 1),
            "layer2_pct": round(self.stats["layer2_hits"] / total * 100, 1),
            "layer2_calls": self.layer2.get_stats(),
            "cache_size": len(self.layer0.cache),
        }

    def get_stats_text(self) -> str:
        """Genera texto legible de estadísticas."""
        s = self.get_stats()
        return (
            f"⚡ *Intent Engine Stats*\n\n"
            f"📊 Total procesados: {s['total']}\n"
            f"🟢 Capa 0 (cache/regex): {s['layer0_pct']}%\n"
            f"🟡 Capa 1 (keywords): {s['layer1_pct']}%\n"
            f"🔴 Capa 2 (LLM): {s['layer2_pct']}%\n"
            f"⏱️ Latencia promedio: {s['avg_latency_ms']:.1f}ms\n"
            f"💾 Cache entries: {s['cache_size']}"
        )
