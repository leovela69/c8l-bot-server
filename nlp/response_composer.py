# -*- coding: utf-8 -*-
"""
✨ RESPONSE COMPOSER — Generador de Respuestas Naturales ANTIGRAVITY
=====================================================================
Transforma resultados de acciones en respuestas naturales, cálidas y útiles.
Adapta el tono según el sentimiento del usuario y su personalidad preferida.
"""

import os
import logging
from typing import Dict, Optional, List

logger = logging.getLogger("c8l.response_composer")

GROQ_API_KEY = os.environ.get("GROQ_API_KEY", "")
GROQ_BASE_URL = "https://api.groq.com/openai/v1"
GROQ_MODEL = "llama-3.3-70b-versatile"

# Respuestas rápidas predefinidas (Capa 0 - sin LLM)
QUICK_RESPONSES = {
    "saludo": [
        "¡Hola! 👋 ¿En qué te puedo ayudar hoy?",
        "¡Hey! 🔥 Listo para lo que necesites.",
        "¡Buenas! 💫 ¿Qué hacemos hoy?",
    ],
    "despedida": [
        "¡Hasta pronto! 👋 Aquí estaré cuando vuelvas.",
        "¡Nos vemos! 🚀 Que vaya genial.",
        "¡Chao! 💪 Recuerda que tu bono diario se renueva a las 00:00.",
    ],
    "ayuda": [
        "🎯 Aquí tienes lo que puedo hacer:\n\n"
        "🎰 **Juegos**: slot, ajedrez\n"
        "💰 **Economía**: saldo, retirar, convertir, bono diario\n"
        "🎨 **Crear**: imágenes, videos, música\n"
        "🌍 **Info**: clima, noticias, crypto\n"
        "📊 **Perfil**: ranking, resumen semanal\n\n"
        "Solo dime qué necesitas, en tus propias palabras. 💬",
    ],
}


class ResponseComposer:
    """
    Genera respuestas naturales adaptadas al usuario.
    
    Pipeline:
    1. Si hay respuesta rápida predefinida → usar directamente
    2. Si el resultado es simple → formato template
    3. Si es complejo o emocional → LLM genera respuesta
    """

    def __init__(self):
        self.persona_default = "amigable"

    async def compose(self, intent: str, action_result: Dict,
                       user_context: Dict = None, sentiment: str = "neutro") -> str:
        """
        Genera la respuesta final para el usuario.
        
        Args:
            intent: La intención clasificada
            action_result: Resultado de ejecutar la acción
            user_context: Contexto del usuario (nombre, preferencias, etc.)
            sentiment: Sentimiento detectado del usuario
            
        Returns:
            Texto de la respuesta para enviar al usuario
        """
        # Capa 0: Respuestas rápidas
        if intent in QUICK_RESPONSES and not action_result:
            import random
            return random.choice(QUICK_RESPONSES[intent])

        # Capa 1: Templates para resultados simples
        template_response = self._try_template(intent, action_result)
        if template_response:
            return template_response

        # Capa 2: LLM para respuestas complejas
        return await self._generate_with_llm(intent, action_result, user_context, sentiment)

    def _try_template(self, intent: str, result: Dict) -> Optional[str]:
        """Intenta generar respuesta con template (sin LLM)."""
        if not result:
            return None

        success = result.get("success", True)
        error = result.get("error", "")

        # Templates por intención
        if intent == "consultar_saldo":
            if success:
                coins = result.get("coins", 0)
                diamonds = result.get("diamonds", 0)
                chips = result.get("casino_chips", 0)
                return (
                    f"💰 **Tu saldo:**\n\n"
                    f"🪙 Coins: **{coins:,}**\n"
                    f"💎 Diamonds: **{diamonds:,}**\n"
                    f"🎰 Fichas casino: **{chips:,}**\n\n"
                    f"¿Qué quieres hacer?"
                )

        elif intent == "bono_diario":
            if success:
                earned = result.get("earned", 50)
                new_balance = result.get("new_balance", 0)
                return (
                    f"🎁 ¡Bono diario reclamado!\n\n"
                    f"+{earned} coins 🪙\n"
                    f"Nuevo saldo: **{new_balance:,}** coins\n\n"
                    f"¡Vuelve mañana para más!"
                )
            else:
                return f"⏰ {error}"

        elif intent == "jugar_slot":
            if success:
                net = result.get("net", 0)
                new_chips = result.get("new_chips", 0)
                if net > 0:
                    return f"🎰 ¡GANASTE! +{net} fichas 🎉\nSaldo: {new_chips:,} fichas"
                elif net < 0:
                    return f"🎰 Perdiste {abs(net)} fichas 😅\nSaldo: {new_chips:,} fichas\n¡Inténtalo de nuevo!"
                else:
                    return f"🎰 Empate. Saldo: {new_chips:,} fichas"

        elif intent == "convertir":
            if success:
                coins_used = result.get("coins_used", 0)
                diamonds_received = result.get("diamonds_received", 0)
                return (
                    f"💱 ¡Conversión exitosa!\n\n"
                    f"🪙 -{coins_used} coins\n"
                    f"💎 +{diamonds_received} diamonds\n\n"
                    f"Nuevo saldo: {result.get('new_coins', 0):,} coins | {result.get('new_diamonds', 0):,} diamonds"
                )
            else:
                return f"❌ {error}"

        elif intent == "retirar":
            if success:
                net_eur = result.get("net_eur", 0)
                hold_until = result.get("hold_until", "")[:10]
                return (
                    f"💸 ¡Retiro solicitado!\n\n"
                    f"💎 Diamonds usados: {result.get('diamonds_used', 0)}\n"
                    f"💶 Recibirás: **{net_eur:.2f}€**\n"
                    f"📅 Disponible: {hold_until}\n\n"
                    f"Te notificaré cuando se procese."
                )
            else:
                return f"❌ {error}"

        # Si no hay template, devolver None para que pase al LLM
        return None

    async def _generate_with_llm(self, intent: str, action_result: Dict,
                                    user_context: Dict = None, sentiment: str = "neutro") -> str:
        """Genera respuesta compleja con LLM."""
        if not GROQ_API_KEY:
            # Fallback sin LLM
            if action_result.get("success") is False:
                return f"❌ {action_result.get('error', 'Ha ocurrido un error')}"
            return "✅ Hecho. ¿Algo más?"

        # Construir prompt
        user_name = (user_context or {}).get("name", "amigo")
        persona = (user_context or {}).get("persona", self.persona_default)

        tone_instruction = {
            "positivo": "El usuario está contento. Sé entusiasta y celebra con él.",
            "negativo": "El usuario está frustrado o triste. Sé empático, cálido y ofrece ayuda.",
            "neutro": "Sé amigable y directo.",
        }.get(sentiment, "Sé amigable.")

        prompt = f"""Eres Leon, el asistente personal de {user_name} en la plataforma C8L Agency.
Tu personalidad es: {persona} (amigable, listo, con un toque de humor).
{tone_instruction}

El usuario pidió algo con intención "{intent}" y este es el resultado de la acción:
{action_result}

Genera una respuesta CORTA (máx 3 líneas), natural y útil. Usa emojis con moderación.
Si el resultado fue exitoso, confirma y sugiere algo relacionado.
Si falló, explica el error de forma amable y ofrece alternativa.
NO repitas datos técnicos innecesarios. Habla como un amigo que ayuda."""

        try:
            import aiohttp
            headers = {
                "Authorization": f"Bearer {GROQ_API_KEY}",
                "Content-Type": "application/json",
            }
            payload = {
                "model": GROQ_MODEL,
                "messages": [{"role": "user", "content": prompt}],
                "max_tokens": 150,
                "temperature": 0.7,
            }
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    f"{GROQ_BASE_URL}/chat/completions",
                    headers=headers,
                    json=payload,
                    timeout=aiohttp.ClientTimeout(total=8)
                ) as resp:
                    if resp.status == 200:
                        data = await resp.json()
                        return data["choices"][0]["message"]["content"].strip()

        except Exception as e:
            logger.error(f"Error generando respuesta con LLM: {e}")

        # Fallback final
        if action_result.get("success") is False:
            return f"❌ {action_result.get('error', 'Error inesperado')}"
        return "✅ Listo. ¿Necesitas algo más?"
