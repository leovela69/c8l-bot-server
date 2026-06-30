# -*- coding: utf-8 -*-
"""
🧠 NLP Module — Plan Antigravity v4.0
Motor de procesamiento ultraligero con triage de 3 capas.

Capa 0: Regex + Cache (0 tokens)
Capa 1: Modelo ligero / Embeddings (pocos tokens)
Capa 2: LLM completo (solo cuando es necesario)
"""

from nlp.intent_engine import IntentEngine, TriageResult
from nlp.response_composer import ResponseComposer
from nlp.audio_processor import AudioProcessor

__all__ = ["IntentEngine", "TriageResult", "ResponseComposer", "AudioProcessor"]
