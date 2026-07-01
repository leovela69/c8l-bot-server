# -*- coding: utf-8 -*-
"""
🚀 ULTRA DISPATCHER — Router Ultraligero v4.0
===============================================
Reemplaza el dispatch directo a Zeus con un sistema de 3 capas.

Responsabilidades:
- Recibe el TriageResult del IntentEngine
- Rutea al agente correcto
- Gestiona fallbacks si el agente falla
- Emite eventos para el enjambre
- Mide latencia y rendimiento

El 80% de las interacciones NO tocan el LLM grande.
"""

import time
import logging
import traceback
from typing import Dict, Optional, Callable, Any, Tuple
from dataclasses import dataclass, field

logger = logging.getLogger("c8l.dispatcher")


@dataclass
class DispatchResult:
    """Resultado de un dispatch."""
    success: bool
    response: str = ""
    agent_used: str = ""
    fallback_used: bool = False
    latency_ms: float = 0.0
    error: str = ""
    metadata: Dict = field(default_factory=dict)


class UltraDispatcher:
    """
    🚀 Router ultraligero del Plan Antigravity v4.0.

    Flujo:
    1. Recibe TriageResult del IntentEngine
    2. Busca el handler registrado para el agente
    3. Ejecuta el handler con el contexto mínimo necesario
    4. Si falla → FallbackChain
    5. Emite evento al EventEmitter

    Optimizaciones:
    - Los agentes se registran como callables (no se instancian todos)
    - Lazy loading de agentes pesados
    - Pool de handlers con cooldown por rate limit
    """

    def __init__(self):
        # Registry de handlers por agente
        self._handlers: Dict[str, Callable] = {}
        # Registry de handlers por intención específica (bypass agent)
        self._intent_handlers: Dict[str, Callable] = {}
        # Stats
        self.stats = {
            "total_dispatches": 0,
            "successful": 0,
            "fallbacks": 0,
            "errors": 0,
            "avg_latency_ms": 0.0,
        }
        # Fallback chain
        self._fallback_chain = None
        # Event emitter
        self._event_emitter = None
        # Cooldowns por agente (anti rate-limit)
        self._last_call: Dict[str, float] = {}
        self._min_interval: Dict[str, float] = {}

    def register_agent(self, agent_name: str, handler: Callable,
                       min_interval: float = 0.0):
        """
        Registra un handler para un agente.

        Args:
            agent_name: Nombre del agente (ej: "vulcano", "hermes")
            handler: Función/callable que procesa el mensaje
            min_interval: Mínimo intervalo entre llamadas (rate limit)
        """
        self._handlers[agent_name.lower()] = handler
        if min_interval > 0:
            self._min_interval[agent_name.lower()] = min_interval
        logger.debug(f"📌 Registered agent: {agent_name}")

    def register_intent(self, intent_name: str, handler: Callable):
        """
        Registra un handler directo para una intención específica.
        Bypass del agente — para respuestas instantáneas (Capa 0).
        """
        self._intent_handlers[intent_name.lower()] = handler

    def set_fallback_chain(self, chain):
        """Configura la cadena de fallback."""
        self._fallback_chain = chain

    def set_event_emitter(self, emitter):
        """Configura el emisor de eventos."""
        self._event_emitter = emitter

    def dispatch(self, triage_result, message: str,
                 chat_id: str = "", user_name: str = "",
                 user_context: str = "",
                 extra_data: Dict = None) -> DispatchResult:
        """
        Despacha un mensaje al agente correcto.

        Args:
            triage_result: TriageResult del IntentEngine
            message: Mensaje original del usuario
            chat_id: ID del chat
            user_name: Nombre del usuario
            user_context: Contexto de memoria
            extra_data: Datos extra (imágenes, audio, etc.)

        Returns:
            DispatchResult con la respuesta
        """
        start_time = time.time()
        self.stats["total_dispatches"] += 1

        intent = triage_result.intent
        agent = triage_result.agent.lower()

        # 1. Intentar handler de intención directa (más rápido)
        if intent in self._intent_handlers:
            try:
                response = self._intent_handlers[intent](
                    message=message,
                    chat_id=chat_id,
                    user_name=user_name,
                )
                if response:
                    latency = (time.time() - start_time) * 1000
                    self.stats["successful"] += 1
                    self._emit_event("dispatch_ok", agent, intent, latency)
                    return DispatchResult(
                        success=True,
                        response=response,
                        agent_used=f"intent:{intent}",
                        latency_ms=latency,
                    )
            except Exception as e:
                logger.warning(f"Intent handler {intent} failed: {e}")

        # 2. Buscar handler del agente
        handler = self._handlers.get(agent)
        if not handler:
            # Agente no registrado → fallback
            logger.warning(f"Agente '{agent}' no registrado, usando fallback")
            return self._try_fallback(message, chat_id, user_name,
                                      user_context, triage_result, start_time)

        # 3. Rate limit check
        if not self._check_rate_limit(agent):
            logger.warning(f"Rate limit hit for {agent}")
            return self._try_fallback(message, chat_id, user_name,
                                      user_context, triage_result, start_time)

        # 4. Ejecutar handler
        try:
            response = handler(
                message=message,
                chat_id=chat_id,
                user_name=user_name,
                user_context=user_context,
                task_description=triage_result.task_description,
                extra_data=extra_data or {},
            )

            if response and str(response).strip():
                latency = (time.time() - start_time) * 1000
                self.stats["successful"] += 1
                self._update_avg_latency(latency)
                self._emit_event("dispatch_ok", agent, intent, latency)
                return DispatchResult(
                    success=True,
                    response=str(response),
                    agent_used=agent,
                    latency_ms=latency,
                )
            else:
                # Respuesta vacía → fallback
                logger.warning(f"Agent {agent} returned empty response")
                return self._try_fallback(message, chat_id, user_name,
                                          user_context, triage_result, start_time)

        except Exception as e:
            logger.error(f"Agent {agent} error: {e}\n{traceback.format_exc()}")
            self.stats["errors"] += 1
            return self._try_fallback(message, chat_id, user_name,
                                      user_context, triage_result, start_time)

    def _try_fallback(self, message, chat_id, user_name,
                      user_context, triage_result, start_time) -> DispatchResult:
        """Intenta la cadena de fallback."""
        if self._fallback_chain:
            try:
                response = self._fallback_chain.execute(
                    message=message,
                    chat_id=chat_id,
                    user_name=user_name,
                    user_context=user_context,
                    original_agent=triage_result.agent,
                )
                if response:
                    latency = (time.time() - start_time) * 1000
                    self.stats["fallbacks"] += 1
                    self._emit_event("fallback_used", triage_result.agent,
                                     triage_result.intent, latency)
                    return DispatchResult(
                        success=True,
                        response=response,
                        agent_used="fallback",
                        fallback_used=True,
                        latency_ms=latency,
                    )
            except Exception as e:
                logger.error(f"Fallback chain error: {e}")

        # Todo falló
        latency = (time.time() - start_time) * 1000
        self.stats["errors"] += 1
        return DispatchResult(
            success=False,
            response="⚠️ Estoy teniendo problemas para procesar tu mensaje. "
                     "Intenta de nuevo en unos segundos.",
            agent_used="none",
            latency_ms=latency,
            error="All handlers failed",
        )

    def _check_rate_limit(self, agent: str) -> bool:
        """Verifica rate limit del agente."""
        min_interval = self._min_interval.get(agent, 0)
        if min_interval <= 0:
            return True
        last = self._last_call.get(agent, 0)
        now = time.time()
        if now - last < min_interval:
            return False
        self._last_call[agent] = now
        return True

    def _update_avg_latency(self, latency_ms: float):
        """Actualiza latencia promedio."""
        total = self.stats["total_dispatches"]
        prev = self.stats["avg_latency_ms"]
        self.stats["avg_latency_ms"] = (prev * (total - 1) + latency_ms) / total

    def _emit_event(self, event_type: str, agent: str,
                    intent: str, latency: float):
        """Emite evento si hay emitter configurado."""
        if self._event_emitter:
            try:
                self._event_emitter.emit(event_type, {
                    "agent": agent,
                    "intent": intent,
                    "latency_ms": latency,
                    "timestamp": time.time(),
                })
            except Exception:
                pass

    def get_stats(self) -> Dict:
        """Estadísticas del dispatcher."""
        total = max(self.stats["total_dispatches"], 1)
        return {
            **self.stats,
            "success_rate": round(self.stats["successful"] / total * 100, 1),
            "fallback_rate": round(self.stats["fallbacks"] / total * 100, 1),
            "error_rate": round(self.stats["errors"] / total * 100, 1),
            "registered_agents": list(self._handlers.keys()),
            "registered_intents": list(self._intent_handlers.keys()),
        }

    def get_stats_text(self) -> str:
        """Texto legible de stats."""
        s = self.get_stats()
        return (
            f"🚀 *Ultra Dispatcher Stats*\n\n"
            f"📊 Total dispatches: {s['total_dispatches']}\n"
            f"✅ Éxito: {s['success_rate']}%\n"
            f"🔄 Fallbacks: {s['fallback_rate']}%\n"
            f"❌ Errores: {s['error_rate']}%\n"
            f"⏱️ Latencia promedio: {s['avg_latency_ms']:.1f}ms\n"
            f"🤖 Agentes: {len(s['registered_agents'])}\n"
            f"⚡ Intents directos: {len(s['registered_intents'])}"
        )
