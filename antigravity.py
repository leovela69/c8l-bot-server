# -*- coding: utf-8 -*-
"""
⚡ ANTIGRAVITY v4.0 — Sistema de Integración Principal
========================================================
Conecta el motor de triage de 3 capas con el ecosistema existente.

Este módulo se importa desde whatsapp_bot.py y reemplaza el
dispatch directo a Zeus con el pipeline ultraligero:

  Mensaje → IntentEngine → Dispatcher → Agente → Respuesta

El 80% de las interacciones NO tocan el LLM grande.
"""

import logging
import time
from typing import Dict, Optional

logger = logging.getLogger("c8l.antigravity")

# ---------------------------------------------------------------------------
# Importar módulos v4.0
# ---------------------------------------------------------------------------
from nlp.intent_engine import IntentEngine
from nlp.response_composer import ResponseComposer
from nlp.audio_processor import AudioProcessor
from dispatcher.dispatcher import UltraDispatcher
from dispatcher.fallback_chain import FallbackChain
from dispatcher.event_emitter import EventEmitter, Events
from memory.user_context import UserContextManager
from memory.summarizer import ConversationSummarizer
from memory.learning_feedback import LearningFeedback
from memory.vector_store import VectorStore
from automation.scheduler import TaskScheduler
from automation.proactive import ProactiveEngine
from automation.auto_healing import AutoHealer


class AntigravitySystem:
    """
    ⚡ Sistema Antigravity v4.0
    Orquesta todos los módulos nuevos en un pipeline unificado.
    """

    def __init__(self):
        logger.info("⚡ Inicializando Antigravity v4.0...")

        # NLP
        self.intent_engine = IntentEngine()
        self.composer = ResponseComposer()
        self.audio = AudioProcessor()

        # Dispatcher
        self.dispatcher = UltraDispatcher()
        self.fallback_chain = FallbackChain()
        self.events = EventEmitter()

        # Memory
        self.user_context = UserContextManager()
        self.summarizer = ConversationSummarizer()
        self.feedback = LearningFeedback()
        self.vector_store = VectorStore()

        # Automation
        self.scheduler = TaskScheduler()
        self.proactive = ProactiveEngine()
        self.healer = AutoHealer()

        # Configurar
        self._setup_dispatcher()
        self._setup_fallback()
        self._setup_scheduler()
        self._setup_event_listeners()

        self._initialized = True
        logger.info("⚡ Antigravity v4.0 ONLINE — 3 capas activas")

    def process_message(self, text: str, chat_id: str,
                        user_name: str = "Usuario",
                        user_id: str = "",
                        extra_data: Dict = None) -> Optional[str]:
        """
        🚀 Punto de entrada principal del pipeline v4.0.

        Flujo:
        1. Obtener contexto de usuario
        2. Triage de intención (3 capas)
        3. Dispatch al agente correcto
        4. Actualizar memoria
        5. Emitir eventos

        Args:
            text: Mensaje del usuario
            chat_id: ID del chat
            user_name: Nombre del usuario
            user_id: ID del usuario
            extra_data: Datos adicionales (fotos, audios, etc.)

        Returns:
            Respuesta del bot o None si debe manejarse externamente
        """
        start = time.time()
        uid = user_id or chat_id

        # 1. Contexto del usuario
        user_ctx = self.user_context.get_context_for_prompt(uid)
        emotion = self.user_context.detect_emotion(text)

        # 2. Triage de intención
        triage = self.intent_engine.analyze(
            text=text,
            chat_id=chat_id,
            user_name=user_name,
            user_context=user_ctx,
        )

        # 3. Dispatch
        result = self.dispatcher.dispatch(
            triage_result=triage,
            message=text,
            chat_id=chat_id,
            user_name=user_name,
            user_context=user_ctx,
            extra_data=extra_data,
        )

        # 4. Actualizar memoria
        self.user_context.update_from_message(
            user_id=uid,
            user_name=user_name,
            message=text,
            intent=triage.intent,
            agent=triage.agent,
            emotion=emotion,
        )

        # 5. Si hay respuesta, registrar
        if result.success and result.response:
            self.user_context.add_bot_response(uid, result.response, result.agent_used)
            self.proactive.record_action(uid, triage.intent)

            # Feedback positivo implícito
            self.feedback.record_positive(triage.intent, triage.agent, text, uid)

            # Emitir evento
            self.events.emit(Events.DISPATCH_OK, {
                "user_id": uid,
                "intent": triage.intent,
                "agent": result.agent_used,
                "layer": triage.layer,
                "latency_ms": (time.time() - start) * 1000,
            })

            return result.response

        # Dispatch falló
        self.events.emit(Events.DISPATCH_FAIL, {
            "user_id": uid,
            "intent": triage.intent,
            "error": result.error,
        })

        # Reportar error al healer
        if result.error:
            self.healer.report_error(
                error_type=f"dispatch_{triage.agent}",
                error_msg=result.error,
            )

        return result.response if result.response else None

    def should_handle(self, text: str) -> bool:
        """
        ¿Debería Antigravity manejar este mensaje?
        Retorna True para la mayoría, False para comandos
        que el bot principal maneja directamente.
        """
        from config import ANTIGRAVITY_ENABLED, TRIAGE_3LAYER_ENABLED
        if not ANTIGRAVITY_ENABLED or not TRIAGE_3LAYER_ENABLED:
            return False

        # No interceptar comandos con handlers específicos ya registrados
        skip_commands = {
            "/musica_suno", "/video_largo", "/film", "/hyperframes",
            "/scan_security", "/admin", "/chess",
        }
        cmd = text.strip().split()[0].lower() if text.strip() else ""
        if cmd in skip_commands:
            return False

        return True

    def get_suggestion(self, user_id: str) -> Optional[str]:
        """Obtiene sugerencia proactiva para el usuario."""
        from config import PROACTIVE_ENABLED
        if not PROACTIVE_ENABLED:
            return None
        return self.proactive.get_suggestion(user_id)

    def get_full_stats(self) -> str:
        """Genera reporte completo del sistema v4.0."""
        intent_stats = self.intent_engine.get_stats_text()
        dispatcher_stats = self.dispatcher.get_stats_text()
        events_stats = self.events.get_stats_text()
        healing_stats = self.healer.get_health_report()
        learning_stats = self.feedback.get_learning_summary()

        return (
            f"⚡ *ANTIGRAVITY v4.0 — Status*\n\n"
            f"{'='*30}\n\n"
            f"{intent_stats}\n\n"
            f"{'='*30}\n\n"
            f"{dispatcher_stats}\n\n"
            f"{'='*30}\n\n"
            f"{events_stats}\n\n"
            f"{'='*30}\n\n"
            f"{healing_stats}\n\n"
            f"{'='*30}\n\n"
            f"{learning_stats}"
        )

    # -----------------------------------------------------------------------
    # Setup interno
    # -----------------------------------------------------------------------

    def _setup_dispatcher(self):
        """Registra los agentes del Panteón en el dispatcher."""
        self.dispatcher.set_fallback_chain(self.fallback_chain)
        self.dispatcher.set_event_emitter(self.events)

        # Registrar handlers de agentes existentes
        # Estos wrappean las funciones del Panteón actual
        agent_handlers = {
            "hermes": self._handle_hermes,
            "vulcano": self._handle_creative,
            "apolo": self._handle_creative,
            "ares": self._handle_creative,
            "hefesto": self._handle_creative,
            "artemisa": self._handle_creative,
            "minerva": self._handle_knowledge,
            "atenea": self._handle_knowledge,
            "aries": self._handle_diagnostic,
            "estia": self._handle_learning,
        }

        for agent_name, handler in agent_handlers.items():
            self.dispatcher.register_agent(agent_name, handler)

        # Registrar intent handlers directos (Capa 0 — sin agente)
        self._register_skill_handlers()

    def _setup_fallback(self):
        """Configura la cadena de fallback."""
        # Prioridad 1: Hermes (conversador universal)
        self.fallback_chain.register_handler(
            "hermes_fallback", self._hermes_fallback, priority=1
        )
        # Prioridad 2: Respuesta genérica LLM
        self.fallback_chain.register_handler(
            "llm_generic", self._llm_generic_fallback, priority=5
        )

    def _setup_scheduler(self):
        """Configura tareas periódicas."""
        from config import SCHEDULER_ENABLED
        if not SCHEDULER_ENABLED:
            return

        # Guardar vector store cada 30 min
        self.scheduler.add_task(
            "save_vectors", self.vector_store.save, 1800
        )
        # Guardar contextos cada 15 min
        self.scheduler.add_task(
            "save_contexts", self.user_context.save_all, 900
        )
        # Iniciar scheduler
        self.scheduler.start()

    def _setup_event_listeners(self):
        """Configura listeners del bus de eventos."""
        # Log de errores
        self.events.on(Events.SYSTEM_ERROR, lambda e: logger.error(
            f"System error: {e.get('data', {})}"
        ))

    def _register_skill_handlers(self):
        """Registra handlers directos para skills (bypass agentes)."""
        from skills.weather import WeatherSkill
        from skills.crypto import CryptoSkill
        from skills.translate import TranslateSkill
        from skills.calculator import CalculatorSkill
        from skills.reminders import RemindersSkill

        weather = WeatherSkill()
        crypto = CryptoSkill()
        translate = TranslateSkill()
        calculator = CalculatorSkill()
        reminders = RemindersSkill()

        # Registrar como intent handlers directos
        self.dispatcher.register_intent(
            "comando_clima",
            lambda **kw: weather.get_weather(kw.get("message", "").replace("/clima", "").strip() or "México")
        )
        self.dispatcher.register_intent(
            "comando_crypto",
            lambda **kw: crypto.get_price(kw.get("message", "").replace("/crypto", "").strip() or "bitcoin")
        )
        self.dispatcher.register_intent(
            "comando_traducir",
            lambda **kw: translate.translate(kw.get("message", "").replace("/traducir", "").strip())
        )
        self.dispatcher.register_intent(
            "comando_calcular",
            lambda **kw: calculator.calculate(kw.get("message", "").replace("/calcular", "").strip())
        )
        self.dispatcher.register_intent(
            "comando_recordar",
            lambda **kw: reminders.create(kw.get("chat_id", ""), kw.get("message", ""))
        )

    # -----------------------------------------------------------------------
    # Agent Handlers (wrappers del Panteón existente)
    # -----------------------------------------------------------------------

    def _handle_hermes(self, **kwargs) -> Optional[str]:
        """Handler para Hermes (conversación)."""
        try:
            from openrouter_client import call_openrouter
            message = kwargs.get("message", "")
            user_name = kwargs.get("user_name", "Usuario")
            user_context = kwargs.get("user_context", "")

            system_prompt = (
                f"Eres Leo, asistente de C8L Agency. Hablas casual, "
                f"divertido y directo. Usa emojis con moderación.\n"
                f"{user_context}"
            )
            response = call_openrouter(
                message, system_prompt,
                agent_name="hermes", temperature=0.85, max_tokens=1024
            )
            return response
        except Exception as e:
            logger.error(f"Hermes handler error: {e}")
            return None

    def _handle_creative(self, **kwargs) -> Optional[str]:
        """Handler para agentes creativos (Vulcano, Apolo, Ares, etc.)."""
        # Delega al sistema existente del Panteón
        # Retorna None para que el bot principal lo maneje
        return None

    def _handle_knowledge(self, **kwargs) -> Optional[str]:
        """Handler para Minerva/Atenea (investigación/estrategia)."""
        try:
            from openrouter_client import call_openrouter
            message = kwargs.get("message", "")
            task = kwargs.get("task_description", message)
            user_context = kwargs.get("user_context", "")

            system_prompt = (
                f"Eres un investigador experto de C8L Agency. "
                f"Responde de forma clara, estructurada y útil.\n"
                f"{user_context}"
            )
            response = call_openrouter(
                task, system_prompt,
                agent_name="minerva", temperature=0.7, max_tokens=2048
            )
            return response
        except Exception:
            return None

    def _handle_diagnostic(self, **kwargs) -> Optional[str]:
        """Handler para Aries (diagnóstico)."""
        return None  # Delega al bot principal

    def _handle_learning(self, **kwargs) -> Optional[str]:
        """Handler para Estia (aprendizaje)."""
        return None  # Se maneja internamente

    def _hermes_fallback(self, **kwargs) -> Optional[str]:
        """Fallback con Hermes."""
        return self._handle_hermes(**kwargs)

    def _llm_generic_fallback(self, **kwargs) -> Optional[str]:
        """Fallback genérico con LLM."""
        try:
            from openrouter_client import call_openrouter
            message = kwargs.get("message", "")
            response = call_openrouter(
                message,
                "Responde de forma breve y útil.",
                agent_name="fallback",
                temperature=0.8,
                max_tokens=512,
            )
            return response
        except Exception:
            return None


# ---------------------------------------------------------------------------
# Instancia global (singleton)
# ---------------------------------------------------------------------------
_antigravity_instance: Optional[AntigravitySystem] = None


def get_antigravity() -> AntigravitySystem:
    """Obtiene la instancia del sistema Antigravity."""
    global _antigravity_instance
    if _antigravity_instance is None:
        _antigravity_instance = AntigravitySystem()
    return _antigravity_instance


def antigravity_process(text: str, chat_id: str,
                        user_name: str = "Usuario",
                        user_id: str = "",
                        extra_data: Dict = None) -> Optional[str]:
    """
    ⚡ Función de conveniencia para procesar mensajes.
    Importar y llamar desde whatsapp_bot.py.

    Returns:
        Respuesta si Antigravity la maneja, None si debe delegarse
        al sistema anterior.
    """
    try:
        system = get_antigravity()
        if not system.should_handle(text):
            return None
        return system.process_message(text, chat_id, user_name, user_id, extra_data)
    except Exception as e:
        logger.error(f"Antigravity error: {e}")
        return None
