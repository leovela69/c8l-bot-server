# -*- coding: utf-8 -*-
"""
⚡ VISUAL GUIDE — Asistente visual paso a paso
================================================
El bot analiza screenshots y guía al usuario como un tutor.

Capacidades:
- Analiza interfaces (webs, apps, terminales)
- Detecta texto con OCR
- Da instrucciones paso a paso
- Mantiene contexto de la tarea entre screenshots
- Reconoce errores y sugiere soluciones

Motor: Groq Vision 90B (gratis)
Backup: Gemini Vision (gratis)

Autor: C8L Agency / Leo
"""

import os
import time
import logging
from typing import Optional, Dict, List, Any
from dataclasses import dataclass, field

logger = logging.getLogger("c8l.skills.visual_guide")


@dataclass
class GuideSession:
    """Sesión de guía visual activa."""
    user_id: str
    task: str = ""  # Qué está intentando hacer el usuario
    steps_completed: List[str] = field(default_factory=list)
    screenshots_analyzed: int = 0
    context: str = ""  # Contexto acumulado
    started_at: float = field(default_factory=time.time)
    active: bool = True


class VisualGuide:
    """
    ⚡ Asistente Visual — Analiza pantallas y guía paso a paso.

    Uso:
        guide = VisualGuide()
        guide.start_session(user_id, "configurar variables en Render")
        response = await guide.analyze_screenshot(image_url, user_id)
    """

    GUIDE_SYSTEM_PROMPT = """Eres un asistente visual experto. El usuario te envía screenshots de su pantalla y tú:

1. IDENTIFICAS qué está viendo (interfaz, app, terminal, error, etc.)
2. DESCRIBES brevemente qué hay en la pantalla
3. DAS INSTRUCCIONES claras de qué hacer a continuación

REGLAS:
- Habla en español casual pero claro
- Usa negritas para lo importante: **click aquí**, **escribe esto**
- Numera los pasos si hay varios
- Si ves un error, explica qué significa y cómo solucionarlo
- Si ves un menú, di exactamente qué opción seleccionar
- Si ves un formulario, di qué escribir en cada campo
- Sé específico: no digas "busca la opción", di "click en **Environment** en el menú izquierdo"
- Si no puedes leer algo por la calidad de la imagen, dilo honestamente

CONTEXTO DE LA TAREA ACTUAL:
{task_context}

PASOS YA COMPLETADOS:
{steps_done}"""

    DETECT_SYSTEM_PROMPT = """Analiza esta captura de pantalla y responde con un JSON:
{{
    "type": "interface|terminal|error|code|document|photo|other",
    "platform": "telegram|render|github|vercel|browser|desktop|mobile|unknown",
    "main_action": "qué acción principal puede hacer el usuario aquí",
    "elements_visible": ["lista de elementos importantes visibles"],
    "has_error": true/false,
    "error_text": "texto del error si hay uno"
}}

Responde SOLO con el JSON."""

    def __init__(self):
        self._sessions: Dict[str, GuideSession] = {}
        self._stats = {
            "screenshots_analyzed": 0,
            "sessions_started": 0,
            "guides_given": 0,
        }

    def start_session(self, user_id: str, task: str = "") -> str:
        """Inicia una sesión de guía visual."""
        self._sessions[user_id] = GuideSession(
            user_id=user_id,
            task=task,
        )
        self._stats["sessions_started"] += 1
        return (
            f"👁️ *Modo Guía Visual activado*\n\n"
            f"📋 Tarea: _{task or 'General'}_\n\n"
            f"Envíame screenshots y te guío paso a paso.\n"
            f"Usa `/guide stop` para desactivar."
        )

    def stop_session(self, user_id: str) -> str:
        """Detiene la sesión de guía."""
        if user_id in self._sessions:
            session = self._sessions[user_id]
            session.active = False
            steps = len(session.steps_completed)
            del self._sessions[user_id]
            return f"⏹️ Guía visual desactivada. ({steps} pasos completados)"
        return "⏹️ No había guía activa."

    def is_active(self, user_id: str) -> bool:
        """Verifica si el usuario tiene guía activa."""
        return user_id in self._sessions and self._sessions[user_id].active

    def get_session(self, user_id: str) -> Optional[GuideSession]:
        return self._sessions.get(user_id)

    async def analyze_screenshot(
        self, image_url: str, user_id: str,
        caption: str = "", bot_context: str = ""
    ) -> str:
        """
        Analiza un screenshot y da instrucciones.

        Args:
            image_url: URL de la imagen (de Telegram)
            user_id: ID del usuario
            caption: Texto que acompaña la imagen
            bot_context: Contexto adicional del bot

        Returns:
            Respuesta con instrucciones paso a paso
        """
        self._stats["screenshots_analyzed"] += 1

        session = self._sessions.get(user_id)
        if session:
            session.screenshots_analyzed += 1

        # Construir contexto
        task_context = ""
        steps_done = "Ninguno aún"

        if session:
            task_context = f"Tarea: {session.task}\nContexto previo: {session.context[-500:]}"
            if session.steps_completed:
                steps_done = "\n".join(f"✅ {s}" for s in session.steps_completed[-5:])

        if caption:
            task_context += f"\nEl usuario dice: {caption}"

        # Llamar a Vision
        system_prompt = self.GUIDE_SYSTEM_PROMPT.format(
            task_context=task_context or "No especificada",
            steps_done=steps_done,
        )

        response = await self._call_vision(image_url, system_prompt)

        if response:
            self._stats["guides_given"] += 1
            # Actualizar contexto de la sesión
            if session:
                session.context += f"\nScreenshot {session.screenshots_analyzed}: {response[:200]}"
                # Agregar como paso completado si parece que avanzó
                if caption:
                    session.steps_completed.append(caption[:100])
            return response

        return "❌ No pude analizar la imagen. Intenta con mejor calidad o más zoom."

    async def detect_screen_type(self, image_url: str) -> Optional[Dict]:
        """Detecta qué tipo de pantalla es (interfaz, error, etc.)."""
        response = await self._call_vision(image_url, self.DETECT_SYSTEM_PROMPT)
        if response:
            try:
                import json
                start = response.find("{")
                end = response.rfind("}") + 1
                if start >= 0 and end > start:
                    return json.loads(response[start:end])
            except (ValueError, Exception):
                pass
        return None

    async def analyze_error(self, image_url: str, user_id: str = "") -> str:
        """Analiza específicamente un error en pantalla."""
        error_prompt = (
            "Esta imagen muestra un ERROR. Analiza:\n"
            "1. ¿Cuál es el error exacto?\n"
            "2. ¿Qué lo causó probablemente?\n"
            "3. ¿Cómo se soluciona? (pasos concretos)\n\n"
            "Responde en español, directo y accionable."
        )
        response = await self._call_vision(image_url, error_prompt)
        return response or "❌ No pude analizar el error."

    async def read_text_from_image(self, image_url: str) -> str:
        """OCR — Lee texto de una imagen."""
        ocr_prompt = (
            "Lee TODO el texto visible en esta imagen. "
            "Transcribe el texto exactamente como aparece, "
            "manteniendo el formato y estructura. "
            "Si hay código, transcríbelo completo."
        )
        response = await self._call_vision(image_url, ocr_prompt)
        return response or ""

    async def _call_vision(self, image_url: str, system_prompt: str) -> Optional[str]:
        """Llama a Groq Vision o Gemini Vision."""
        import httpx

        groq_key = os.environ.get("GROQ_API_KEY", "")
        groq_model = os.environ.get("GROQ_VISION_MODEL", "llama-3.2-90b-vision-preview")

        if groq_key:
            try:
                url = f"{os.environ.get('GROQ_BASE_URL', 'https://api.groq.com/openai/v1')}/chat/completions"
                headers = {
                    "Authorization": f"Bearer {groq_key}",
                    "Content-Type": "application/json",
                }
                payload = {
                    "model": groq_model,
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": [
                            {"type": "image_url", "image_url": {"url": image_url}},
                            {"type": "text", "text": "Analiza esta imagen y guíame."},
                        ]},
                    ],
                    "max_tokens": 1024,
                    "temperature": 0.3,
                }

                async with httpx.AsyncClient(timeout=30) as client:
                    resp = await client.post(url, headers=headers, json=payload)
                    resp.raise_for_status()
                    data = resp.json()
                    return data["choices"][0]["message"]["content"]
            except Exception as e:
                logger.error(f"Vision error (Groq): {e}")

        # Fallback: Gemini Vision
        gemini_key = os.environ.get("GEMINI_API_KEY", "")
        if gemini_key:
            try:
                url = (
                    f"https://generativelanguage.googleapis.com/v1beta/"
                    f"models/gemini-2.5-flash:generateContent?key={gemini_key}"
                )
                payload = {
                    "contents": [{
                        "parts": [
                            {"text": f"{system_prompt}\n\nAnaliza esta imagen:"},
                            {"inline_data": {"mime_type": "image/jpeg",
                                             "data": await self._download_image_base64(image_url)}},
                        ]
                    }],
                    "generationConfig": {"maxOutputTokens": 1024},
                }
                async with httpx.AsyncClient(timeout=30) as client:
                    resp = await client.post(url, json=payload)
                    resp.raise_for_status()
                    data = resp.json()
                    candidates = data.get("candidates", [])
                    if candidates:
                        parts = candidates[0].get("content", {}).get("parts", [])
                        if parts:
                            return parts[0].get("text", "")
            except Exception as e:
                logger.error(f"Vision error (Gemini): {e}")

        return None

    async def _download_image_base64(self, url: str) -> str:
        """Descarga imagen y la convierte a base64."""
        import httpx
        import base64

        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.get(url)
            resp.raise_for_status()
            return base64.b64encode(resp.content).decode()

    # -------------------------------------------------------------------
    # Stats
    # -------------------------------------------------------------------

    def get_stats(self) -> Dict[str, Any]:
        return {
            **self._stats,
            "active_sessions": len(self._sessions),
        }

    def get_stats_text(self) -> str:
        s = self._stats
        return (
            f"👁️ *Visual Guide*\n"
            f"📸 Screenshots analizados: {s['screenshots_analyzed']}\n"
            f"🎯 Sesiones iniciadas: {s['sessions_started']}\n"
            f"📝 Guías dadas: {s['guides_given']}\n"
            f"👥 Sesiones activas: {len(self._sessions)}"
        )


# ---------------------------------------------------------------------------
# Singleton
# ---------------------------------------------------------------------------
_guide_instance: Optional[VisualGuide] = None


def get_visual_guide() -> VisualGuide:
    """Obtiene la instancia global del Visual Guide."""
    global _guide_instance
    if _guide_instance is None:
        _guide_instance = VisualGuide()
    return _guide_instance
