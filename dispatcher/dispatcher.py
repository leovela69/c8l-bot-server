# -*- coding: utf-8 -*-
"""
🚀 DISPATCHER — Router Inteligente de Intenciones ANTIGRAVITY
==============================================================
Conecta la intención clasificada con el handler/módulo correcto.
Cada intención tiene un handler que ejecuta la acción y devuelve resultado.
"""

import logging
from typing import Dict, Callable, Optional, Any

logger = logging.getLogger("c8l.dispatcher")


class Dispatcher:
    """
    Router central del bot.
    Recibe una intención clasificada → ejecuta el handler apropiado → devuelve resultado.
    """

    def __init__(self):
        self._handlers: Dict[str, Callable] = {}
        self._register_default_handlers()

    def register(self, intent: str, handler: Callable):
        """Registra un handler para una intención."""
        self._handlers[intent] = handler
        logger.debug(f"Handler registrado: {intent}")

    async def dispatch(self, classification: Dict, user_id: str = "") -> Dict:
        """
        Despacha la intención al handler correcto.
        
        Args:
            classification: Resultado del IntentEngine.classify()
            user_id: ID del usuario
            
        Returns:
            {
                "success": bool,
                "intent": str,
                "action_result": dict,
                "handler_used": str,
                "error": str (si hay)
            }
        """
        intent = classification.get("intent", "desconocido")
        entities = classification.get("entities", {})
        needs_clarification = classification.get("needs_clarification", False)

        # Si necesita clarificación, devolver pregunta
        if needs_clarification:
            return {
                "success": True,
                "intent": intent,
                "action_result": {"needs_clarification": True},
                "handler_used": "clarification",
            }

        # Buscar handler
        handler = self._handlers.get(intent)
        if not handler:
            handler = self._handlers.get("desconocido", self._handler_unknown)

        # Ejecutar handler
        try:
            result = await handler(user_id=user_id, entities=entities, classification=classification)
            return {
                "success": True,
                "intent": intent,
                "action_result": result,
                "handler_used": intent,
            }
        except Exception as e:
            logger.error(f"Error en handler '{intent}': {e}")
            return {
                "success": False,
                "intent": intent,
                "action_result": {"error": str(e)},
                "handler_used": intent,
                "error": str(e),
            }

    # ===================================================================
    # Handlers por defecto
    # ===================================================================

    def _register_default_handlers(self):
        """Registra los handlers por defecto del sistema."""
        self._handlers = {
            # Economía
            "consultar_saldo": self._handler_saldo,
            "bono_diario": self._handler_bono_diario,
            "convertir": self._handler_convertir,
            "retirar": self._handler_retirar,
            # Juegos
            "jugar_slot": self._handler_slot,
            "jugar_chess": self._handler_chess,
            "jugar_general": self._handler_jugar_general,
            # Creación
            "crear_imagen": self._handler_crear_imagen,
            "crear_video": self._handler_crear_video,
            "crear_musica": self._handler_crear_musica,
            "editar_cara": self._handler_face_studio,
            "editar_clip": self._handler_clip_studio,
            # Info
            "buscar_info": self._handler_buscar,
            "clima": self._handler_clima,
            "traducir": self._handler_traducir,
            "ranking": self._handler_ranking,
            # Utilidades
            "recordatorio": self._handler_recordatorio,
            "resumen_semanal": self._handler_resumen,
            # Social
            "saludo": self._handler_noop,
            "despedida": self._handler_noop,
            "ayuda": self._handler_noop,
            "feedback": self._handler_feedback,
            # Fallback
            "desconocido": self._handler_unknown,
        }

    # --- ECONOMÍA ---

    async def _handler_saldo(self, user_id: str, entities: Dict, **kwargs) -> Dict:
        """Consulta el saldo del usuario."""
        try:
            from economy.economy import EconomySystem
            eco = EconomySystem()
            balance = eco.get_balance(user_id)
            return balance
        except Exception as e:
            return {"success": False, "error": f"Error consultando saldo: {e}"}

    async def _handler_bono_diario(self, user_id: str, entities: Dict, **kwargs) -> Dict:
        """Reclama el bono diario."""
        try:
            from economy.economy import EconomySystem
            eco = EconomySystem()
            return eco.claim_daily_bonus(user_id)
        except Exception as e:
            return {"success": False, "error": f"Error reclamando bono: {e}"}

    async def _handler_convertir(self, user_id: str, entities: Dict, **kwargs) -> Dict:
        """Convierte coins a diamonds."""
        cantidad = entities.get("cantidad", 100)
        try:
            from economy.economy import EconomySystem
            eco = EconomySystem()
            return eco.convert_coins_to_diamonds(user_id, cantidad)
        except Exception as e:
            return {"success": False, "error": f"Error convirtiendo: {e}"}

    async def _handler_retirar(self, user_id: str, entities: Dict, **kwargs) -> Dict:
        """Solicita retiro de diamonds."""
        cantidad = entities.get("cantidad", 0)
        if cantidad <= 0:
            return {"success": False, "error": "Dime cuántos diamonds quieres retirar."}
        try:
            from economy.economy import EconomySystem
            eco = EconomySystem()
            return eco.request_withdrawal(
                user_id, cantidad,
                method=entities.get("method", "paypal"),
                email=entities.get("email", "")
            )
        except Exception as e:
            return {"success": False, "error": f"Error en retiro: {e}"}

    # --- JUEGOS ---

    async def _handler_slot(self, user_id: str, entities: Dict, **kwargs) -> Dict:
        """Juega al slot."""
        bet = entities.get("cantidad", 10)
        try:
            from casino.slot_engine import SlotEngine
            engine = SlotEngine()
            result = engine.spin(user_id, bet)
            return result
        except Exception as e:
            return {"success": False, "error": f"Error en slot: {e}"}

    async def _handler_chess(self, user_id: str, entities: Dict, **kwargs) -> Dict:
        """Inicia partida de ajedrez."""
        return {
            "success": True,
            "message": "♟️ Partida de ajedrez lista. Usa /chess para empezar.",
            "game": "chess"
        }

    async def _handler_jugar_general(self, user_id: str, entities: Dict, **kwargs) -> Dict:
        """El usuario quiere jugar pero no dice qué."""
        return {
            "success": True,
            "needs_clarification": True,
            "message": "🎮 ¿A qué quieres jugar?\n\n🎰 Slot\n♟️ Ajedrez\n\nDime cuál."
        }

    # --- CREACIÓN ---

    async def _handler_crear_imagen(self, user_id: str, entities: Dict, **kwargs) -> Dict:
        """Genera una imagen."""
        prompt = kwargs.get("classification", {}).get("raw_text", "")
        return {
            "success": True,
            "action": "create_image",
            "prompt": prompt,
            "message": "🎨 Generando imagen... Un momento."
        }

    async def _handler_crear_video(self, user_id: str, entities: Dict, **kwargs) -> Dict:
        """Genera un video."""
        prompt = kwargs.get("classification", {}).get("raw_text", "")
        return {
            "success": True,
            "action": "create_video",
            "prompt": prompt,
            "message": "🎬 Generando video... Esto puede tardar unos minutos."
        }

    async def _handler_crear_musica(self, user_id: str, entities: Dict, **kwargs) -> Dict:
        """Genera música."""
        prompt = kwargs.get("classification", {}).get("raw_text", "")
        return {
            "success": True,
            "action": "create_music",
            "prompt": prompt,
            "message": "🎵 Componiendo... Dame un momento."
        }

    async def _handler_face_studio(self, user_id: str, entities: Dict, **kwargs) -> Dict:
        """Face Studio - edición facial."""
        return {
            "success": True,
            "action": "face_studio",
            "message": "📸 Face Studio listo. Envíame la foto que quieres editar."
        }

    async def _handler_clip_studio(self, user_id: str, entities: Dict, **kwargs) -> Dict:
        """Clip Studio - edición de video."""
        return {
            "success": True,
            "action": "clip_studio",
            "message": "🎞️ Clip Studio listo. Envíame el video que quieres editar."
        }

    # --- INFORMACIÓN ---

    async def _handler_buscar(self, user_id: str, entities: Dict, **kwargs) -> Dict:
        """Busca información."""
        query = kwargs.get("classification", {}).get("raw_text", "")
        return {
            "success": True,
            "action": "search",
            "query": query,
            "message": "🔍 Buscando..."
        }

    async def _handler_clima(self, user_id: str, entities: Dict, **kwargs) -> Dict:
        """Consulta el clima."""
        ciudad = entities.get("ciudad", "Madrid")
        return {
            "success": True,
            "action": "weather",
            "city": ciudad,
            "message": f"🌤️ Consultando clima en {ciudad}..."
        }

    async def _handler_traducir(self, user_id: str, entities: Dict, **kwargs) -> Dict:
        """Traduce texto."""
        text = kwargs.get("classification", {}).get("raw_text", "")
        return {
            "success": True,
            "action": "translate",
            "text": text,
            "message": "🌐 Traduciendo..."
        }

    async def _handler_ranking(self, user_id: str, entities: Dict, **kwargs) -> Dict:
        """Muestra ranking."""
        return {
            "success": True,
            "action": "ranking",
            "message": "🏆 Cargando ranking..."
        }

    # --- UTILIDADES ---

    async def _handler_recordatorio(self, user_id: str, entities: Dict, **kwargs) -> Dict:
        """Crea un recordatorio."""
        text = kwargs.get("classification", {}).get("raw_text", "")
        return {
            "success": True,
            "action": "reminder",
            "text": text,
            "message": "⏰ Recordatorio guardado."
        }

    async def _handler_resumen(self, user_id: str, entities: Dict, **kwargs) -> Dict:
        """Genera resumen semanal."""
        return {
            "success": True,
            "action": "weekly_summary",
            "message": "📊 Generando tu resumen semanal..."
        }

    # --- SOCIAL / NOOP ---

    async def _handler_noop(self, user_id: str, entities: Dict, **kwargs) -> Dict:
        """No requiere acción (saludo, despedida, ayuda). ResponseComposer se encarga."""
        return {}

    async def _handler_feedback(self, user_id: str, entities: Dict, **kwargs) -> Dict:
        """El usuario da feedback o corrige al bot."""
        text = kwargs.get("classification", {}).get("raw_text", "")
        return {
            "success": True,
            "action": "feedback_recorded",
            "feedback": text,
            "message": "📝 Gracias por el feedback. Lo aprendo para la próxima."
        }

    async def _handler_unknown(self, user_id: str, entities: Dict, **kwargs) -> Dict:
        """Intención no reconocida."""
        return {
            "success": True,
            "needs_clarification": True,
            "message": "🤔 No estoy seguro de qué necesitas. ¿Puedes decírmelo de otra forma?"
        }
