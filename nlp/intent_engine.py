# -*- coding: utf-8 -*-
"""
🧠 INTENT ENGINE — Motor de Comprensión ANTIGRAVITY
=====================================================
Pipeline de 3 capas para clasificar intenciones:
- Capa 0: Caché + regex (0 tokens, <1ms)
- Capa 1: Modelo ligero/embeddings (pocos tokens, <100ms)
- Capa 2: LLM completo Groq (solo si es necesario, <2s)

Devuelve JSON con: intent, entities, sentiment, needs_clarification
"""

import os
import re
import json
import hashlib
import logging
from typing import Dict, Optional, List
from datetime import datetime

logger = logging.getLogger("c8l.intent_engine")

# ---------------------------------------------------------------------------
# Configuración
# ---------------------------------------------------------------------------
GROQ_API_KEY = os.environ.get("GROQ_API_KEY", "")
GROQ_BASE_URL = "https://api.groq.com/openai/v1"
GROQ_MODEL_LIGHT = "llama-3.1-8b-instant"  # Rápido para clasificación
GROQ_MODEL_HEAVY = "llama-3.3-70b-versatile"  # Completo para ambigüedad

# ---------------------------------------------------------------------------
# Intenciones soportadas
# ---------------------------------------------------------------------------
INTENTS = {
    "jugar_slot": "El usuario quiere jugar a las tragaperras/slot",
    "jugar_chess": "El usuario quiere jugar ajedrez",
    "jugar_general": "El usuario quiere jugar algo sin especificar",
    "consultar_saldo": "El usuario quiere ver su balance/coins/diamonds",
    "retirar": "El usuario quiere retirar diamonds a dinero real",
    "convertir": "El usuario quiere convertir coins a diamonds",
    "bono_diario": "El usuario quiere reclamar su bono diario",
    "crear_imagen": "El usuario quiere generar una imagen con IA",
    "crear_video": "El usuario quiere generar un video con IA",
    "crear_musica": "El usuario quiere generar música con IA",
    "editar_cara": "El usuario quiere usar Face Studio (swap, enhance)",
    "editar_clip": "El usuario quiere editar un video/clip",
    "buscar_info": "El usuario pregunta algo sobre el mundo (clima, noticias, crypto)",
    "clima": "El usuario pregunta por el clima/tiempo",
    "traducir": "El usuario quiere traducir algo",
    "recordatorio": "El usuario quiere establecer un recordatorio",
    "resumen_semanal": "El usuario pide un resumen de su actividad",
    "ranking": "El usuario quiere ver el ranking de streamers",
    "ayuda": "El usuario necesita ayuda o no sabe qué hacer",
    "saludo": "El usuario saluda o inicia conversación",
    "despedida": "El usuario se despide",
    "feedback": "El usuario corrige al bot o da feedback",
    "desconocido": "No se puede determinar la intención",
}

# ---------------------------------------------------------------------------
# CAPA 0: Regex + Caché (instantáneo, 0 tokens)
# ---------------------------------------------------------------------------

# Patrones regex para intenciones obvias
REGEX_PATTERNS = {
    "jugar_slot": [
        r"\b(slot|tragaperras|tragaperra|máquina|maquina|tirar|girar|spin)\b",
        r"^/slot",
    ],
    "jugar_chess": [
        r"\b(ajedrez|chess|partida.*ajedrez|jugar.*chess)\b",
        r"^/chess",
    ],
    "consultar_saldo": [
        r"\b(saldo|balance|coins?|diamonds?|monedas?|fichas?|cuánt[oa]s? tengo)\b",
        r"^/(saldo|balance|wallet)",
    ],
    "retirar": [
        r"\b(retirar|withdraw|retiro|cobrar|sacar.*dinero|sacar.*euros?)\b",
        r"^/retirar",
    ],
    "convertir": [
        r"\b(convertir|cambiar.*coins?.*diamond|canjear)\b",
        r"^/convertir",
    ],
    "bono_diario": [
        r"\b(bono|bonus|diario|daily|reclamar|claim)\b",
        r"^/(bono|daily|bonus)",
    ],
    "crear_imagen": [
        r"\b(imagen|foto|picture|dibuja|genera.*imagen|crea.*imagen|diseña)\b",
        r"^/(imagen|image|draw)",
    ],
    "crear_video": [
        r"\b(video|vídeo|clip|anima|genera.*video|crea.*video)\b",
        r"^/(video|clip)",
    ],
    "crear_musica": [
        r"\b(música|musica|canción|cancion|beat|instrumental|genera.*música)\b",
        r"^/(musica|music|song)",
    ],
    "clima": [
        r"\b(clima|tiempo|temperatura|llueve|lloverá|pronóstico|weather)\b",
        r"^/(clima|weather)",
    ],
    "ranking": [
        r"\b(ranking|clasificación|top|mejores|streamers?)\b",
        r"^/ranking",
    ],
    "ayuda": [
        r"\b(ayuda|help|no sé|no entiendo|qué puedo|cómo funciona)\b",
        r"^/(help|ayuda|start)",
    ],
    "saludo": [
        r"^(hola|hey|buenas|hi|hello|qué tal|buenos días|buenas tardes|buenas noches)[\s!.]*$",
    ],
    "despedida": [
        r"^(adiós|adios|bye|chao|hasta luego|nos vemos|me voy)[\s!.]*$",
    ],
}

# Caché en memoria (TTL gestionado externamente si se necesita Redis)
_response_cache: Dict[str, Dict] = {}
CACHE_MAX_SIZE = 500


class IntentEngine:
    """
    Motor de comprensión de 3 capas.
    Clasifica la intención del usuario con el mínimo cómputo posible.
    """

    def __init__(self):
        self.cache = _response_cache
        self._http_client = None

    async def classify(self, text: str, user_id: str = "", context: List[Dict] = None) -> Dict:
        """
        Pipeline principal de clasificación.
        
        Returns:
            {
                "intent": str,
                "entities": dict,
                "sentiment": str,  # "positivo", "negativo", "neutro"
                "confidence": float,  # 0.0 - 1.0
                "needs_clarification": bool,
                "layer_used": int,  # 0, 1 o 2
                "raw_text": str
            }
        """
        text_clean = text.strip().lower()
        
        if not text_clean:
            return self._build_result("desconocido", {}, "neutro", 0.0, True, 0, text)

        # ----- CAPA 0: Regex + Caché -----
        result = self._layer_0_regex_cache(text_clean, text)
        if result:
            logger.debug(f"Capa 0 resolvió: {result['intent']}")
            return result

        # ----- CAPA 1: Modelo ligero (Groq 8B) -----
        result = await self._layer_1_light_model(text_clean, text, user_id, context)
        if result and result.get("confidence", 0) > 0.7:
            logger.debug(f"Capa 1 resolvió: {result['intent']} (conf: {result['confidence']})")
            return result

        # ----- CAPA 2: LLM Completo (Groq 70B) -----
        result = await self._layer_2_full_llm(text, user_id, context)
        logger.debug(f"Capa 2 resolvió: {result['intent']}")
        return result

    # ===================================================================
    # CAPA 0: Regex + Caché
    # ===================================================================

    def _layer_0_regex_cache(self, text_clean: str, text_original: str) -> Optional[Dict]:
        """Resuelve intenciones obvias sin gastar tokens."""
        
        # 1. Verificar caché
        cache_key = hashlib.md5(text_clean.encode()).hexdigest()
        if cache_key in self.cache:
            cached = self.cache[cache_key]
            cached["layer_used"] = 0
            return cached

        # 2. Regex matching
        for intent, patterns in REGEX_PATTERNS.items():
            for pattern in patterns:
                if re.search(pattern, text_clean, re.IGNORECASE):
                    # Extraer entidades básicas
                    entities = self._extract_entities_regex(text_clean, intent)
                    result = self._build_result(
                        intent=intent,
                        entities=entities,
                        sentiment="neutro",
                        confidence=0.9,
                        needs_clarification=False,
                        layer_used=0,
                        raw_text=text_original
                    )
                    # Guardar en caché
                    self._cache_result(cache_key, result)
                    return result

        return None

    def _extract_entities_regex(self, text: str, intent: str) -> Dict:
        """Extrae entidades simples con regex."""
        entities = {}

        # Extraer números
        numbers = re.findall(r'\d+', text)
        if numbers:
            entities["cantidad"] = int(numbers[0])

        # Extraer moneda/tipo según intención
        if intent in ("retirar", "convertir"):
            if "diamond" in text:
                entities["moneda"] = "diamonds"
            elif "coin" in text:
                entities["moneda"] = "coins"

        return entities

    # ===================================================================
    # CAPA 1: Modelo Ligero
    # ===================================================================

    async def _layer_1_light_model(self, text_clean: str, text_original: str,
                                     user_id: str, context: List[Dict] = None) -> Optional[Dict]:
        """Usa Groq 8B para clasificación rápida."""
        if not GROQ_API_KEY:
            return None

        prompt = self._build_classification_prompt(text_original, context, light=True)

        try:
            response = await self._call_groq(prompt, model=GROQ_MODEL_LIGHT, max_tokens=200)
            parsed = self._parse_llm_response(response)
            if parsed:
                parsed["layer_used"] = 1
                parsed["raw_text"] = text_original
                # Cachear si confianza alta
                if parsed.get("confidence", 0) > 0.8:
                    cache_key = hashlib.md5(text_clean.encode()).hexdigest()
                    self._cache_result(cache_key, parsed)
                return parsed
        except Exception as e:
            logger.warning(f"Capa 1 falló: {e}")

        return None

    # ===================================================================
    # CAPA 2: LLM Completo
    # ===================================================================

    async def _layer_2_full_llm(self, text: str, user_id: str,
                                  context: List[Dict] = None) -> Dict:
        """Usa Groq 70B para intenciones complejas o ambiguas."""
        if not GROQ_API_KEY:
            return self._build_result("desconocido", {}, "neutro", 0.0, True, 2, text)

        prompt = self._build_classification_prompt(text, context, light=False)

        try:
            response = await self._call_groq(prompt, model=GROQ_MODEL_HEAVY, max_tokens=400)
            parsed = self._parse_llm_response(response)
            if parsed:
                parsed["layer_used"] = 2
                parsed["raw_text"] = text
                return parsed
        except Exception as e:
            logger.error(f"Capa 2 falló: {e}")

        return self._build_result("desconocido", {}, "neutro", 0.0, True, 2, text)

    # ===================================================================
    # Prompt Engineering
    # ===================================================================

    def _build_classification_prompt(self, text: str, context: List[Dict] = None,
                                       light: bool = True) -> str:
        """Construye el prompt de clasificación."""
        
        intents_list = "\n".join(f"- {k}: {v}" for k, v in INTENTS.items())

        context_str = ""
        if context:
            recent = context[-3:]  # Últimos 3 mensajes
            context_str = "\nContexto reciente:\n" + "\n".join(
                f"- [{m.get('role', 'user')}]: {m.get('text', '')[:100]}" for m in recent
            )

        if light:
            return f"""Clasifica la intención del siguiente mensaje de un usuario de una app de juegos, economía virtual y creación de contenido.

Intenciones posibles:
{intents_list}

Mensaje del usuario: "{text}"
{context_str}

Responde SOLO con JSON válido (sin markdown):
{{"intent": "nombre_intent", "entities": {{}}, "sentiment": "positivo|negativo|neutro", "confidence": 0.0-1.0, "needs_clarification": true|false}}"""
        else:
            return f"""Eres el motor de comprensión de Leon Leo Bot, un asistente de juegos, economía virtual y creación de contenido.

Tu trabajo es analizar el mensaje del usuario y determinar:
1. intent: La intención principal
2. entities: Valores extraídos (cantidades, nombres, fechas, etc.)
3. sentiment: Estado emocional del usuario
4. confidence: Tu nivel de certeza (0.0-1.0)
5. needs_clarification: Si necesitas preguntar algo para actuar

Intenciones disponibles:
{intents_list}

{context_str}

Mensaje del usuario: "{text}"

IMPORTANTE:
- Si el mensaje es ambiguo, pon needs_clarification=true y baja confidence
- Extrae TODAS las entidades posibles (cantidad, moneda, juego, fecha, idioma)
- Detecta el sentimiento real (frustrado, contento, curioso, aburrido)

Responde SOLO con JSON válido (sin markdown, sin explicaciones):
{{"intent": "nombre_intent", "entities": {{"key": "value"}}, "sentiment": "positivo|negativo|neutro", "confidence": 0.0-1.0, "needs_clarification": true|false}}"""

    # ===================================================================
    # Comunicación con Groq
    # ===================================================================

    async def _call_groq(self, prompt: str, model: str = GROQ_MODEL_LIGHT,
                           max_tokens: int = 200) -> str:
        """Llama a Groq API."""
        import aiohttp

        headers = {
            "Authorization": f"Bearer {GROQ_API_KEY}",
            "Content-Type": "application/json",
        }
        payload = {
            "model": model,
            "messages": [{"role": "user", "content": prompt}],
            "max_tokens": max_tokens,
            "temperature": 0.1,  # Determinístico para clasificación
        }

        async with aiohttp.ClientSession() as session:
            async with session.post(
                f"{GROQ_BASE_URL}/chat/completions",
                headers=headers,
                json=payload,
                timeout=aiohttp.ClientTimeout(total=10)
            ) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    return data["choices"][0]["message"]["content"]
                else:
                    error = await resp.text()
                    raise Exception(f"Groq API error {resp.status}: {error[:200]}")

    # ===================================================================
    # Parsing y helpers
    # ===================================================================

    def _parse_llm_response(self, response: str) -> Optional[Dict]:
        """Parsea la respuesta JSON del LLM."""
        try:
            # Limpiar posibles artefactos
            clean = response.strip()
            if clean.startswith("```"):
                clean = clean.split("\n", 1)[1] if "\n" in clean else clean[3:]
                clean = clean.rsplit("```", 1)[0]
            
            parsed = json.loads(clean)
            
            # Validar campos mínimos
            if "intent" not in parsed:
                return None
            
            # Normalizar
            return {
                "intent": parsed.get("intent", "desconocido"),
                "entities": parsed.get("entities", {}),
                "sentiment": parsed.get("sentiment", "neutro"),
                "confidence": float(parsed.get("confidence", 0.5)),
                "needs_clarification": bool(parsed.get("needs_clarification", False)),
                "layer_used": -1,
                "raw_text": "",
            }
        except (json.JSONDecodeError, ValueError, KeyError) as e:
            logger.warning(f"Error parseando respuesta LLM: {e} | Respuesta: {response[:200]}")
            return None

    def _build_result(self, intent: str, entities: Dict, sentiment: str,
                       confidence: float, needs_clarification: bool,
                       layer_used: int, raw_text: str) -> Dict:
        """Construye el resultado estándar."""
        return {
            "intent": intent,
            "entities": entities,
            "sentiment": sentiment,
            "confidence": confidence,
            "needs_clarification": needs_clarification,
            "layer_used": layer_used,
            "raw_text": raw_text,
            "timestamp": datetime.now().isoformat(),
        }

    def _cache_result(self, key: str, result: Dict):
        """Guarda resultado en caché con límite de tamaño."""
        if len(self.cache) >= CACHE_MAX_SIZE:
            # Eliminar primera entrada (FIFO simple)
            first_key = next(iter(self.cache))
            del self.cache[first_key]
        self.cache[key] = result

    def clear_cache(self):
        """Limpia la caché de respuestas."""
        self.cache.clear()
        logger.info("Caché de IntentEngine limpiada")
