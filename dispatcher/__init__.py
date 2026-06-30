# -*- coding: utf-8 -*-
"""
🚀 DISPATCHER Module — Plan Antigravity v4.0
Router ultraligero que conecta el Intent Engine con los agentes.

Flujo: Mensaje → IntentEngine → Dispatcher → Agente → Respuesta
"""

from dispatcher.dispatcher import UltraDispatcher
from dispatcher.fallback_chain import FallbackChain
from dispatcher.event_emitter import EventEmitter

__all__ = ["UltraDispatcher", "FallbackChain", "EventEmitter"]
