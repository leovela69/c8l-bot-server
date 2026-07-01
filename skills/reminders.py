# -*- coding: utf-8 -*-
"""
⏰ REMINDERS SKILL — Recordatorios Inteligentes
=================================================
Extrae fecha/hora del lenguaje natural.
Persiste en JSON y el scheduler los ejecuta.
"""

import re
import time
import json
import os
import logging
from typing import Dict, List, Optional
from datetime import datetime, timedelta

logger = logging.getLogger("c8l.skills.reminders")


class RemindersSkill:
    """Skill de recordatorios con parsing de fecha natural."""

    def __init__(self, data_dir: str = None):
        from config import DATA_DIR
        self.data_dir = data_dir or DATA_DIR
        self._path = os.path.join(self.data_dir, "reminders.json")
        self._reminders = self._load()

    def create(self, user_id: str, text: str) -> str:
        """
        Crea un recordatorio desde texto natural.

        Ejemplos:
        - "recuérdame llamar a mamá a las 6"
        - "recordatorio mañana comprar pan"
        - "en 30 minutos revisar el horno"
        """
        parsed = self._parse_time(text)
        reminder_text = self._extract_reminder_text(text)

        if not reminder_text:
            reminder_text = text

        reminder = {
            "id": f"rem_{int(time.time())}_{user_id[-4:]}",
            "user_id": str(user_id),
            "text": reminder_text[:200],
            "created_at": time.time(),
            "trigger_at": parsed["timestamp"],
            "triggered": False,
        }

        self._reminders.append(reminder)
        self._save()

        # Formatear confirmación
        when = parsed["human_readable"]
        return (
            f"⏰ *Recordatorio creado*\n\n"
            f"📝 {reminder_text}\n"
            f"🕐 Cuándo: {when}\n\n"
            f"Te avisaré cuando sea el momento. ✅"
        )

    def get_pending(self, user_id: str = None) -> List[Dict]:
        """Obtiene recordatorios pendientes."""
        now = time.time()
        pending = [
            r for r in self._reminders
            if not r.get("triggered")
            and r.get("trigger_at", 0) > now
            and (user_id is None or r.get("user_id") == str(user_id))
        ]
        return sorted(pending, key=lambda x: x.get("trigger_at", 0))

    def get_due(self) -> List[Dict]:
        """Obtiene recordatorios que ya deben dispararse."""
        now = time.time()
        due = [
            r for r in self._reminders
            if not r.get("triggered")
            and r.get("trigger_at", 0) <= now
        ]
        return due

    def mark_triggered(self, reminder_id: str):
        """Marca un recordatorio como disparado."""
        for r in self._reminders:
            if r.get("id") == reminder_id:
                r["triggered"] = True
                r["triggered_at"] = time.time()
                break
        self._save()

    def list_user_reminders(self, user_id: str) -> str:
        """Lista recordatorios de un usuario."""
        pending = self.get_pending(user_id)
        if not pending:
            return "⏰ No tienes recordatorios pendientes."

        text = "⏰ *Tus recordatorios:*\n\n"
        for i, r in enumerate(pending[:10], 1):
            dt = datetime.fromtimestamp(r["trigger_at"])
            when = dt.strftime("%d/%m %H:%M")
            text += f"{i}. {r['text'][:50]} — 🕐 {when}\n"
        return text

    def _parse_time(self, text: str) -> Dict:
        """
        Extrae fecha/hora del texto natural.
        Retorna timestamp y descripción legible.
        """
        now = datetime.now()
        text_lower = text.lower()

        # "en X minutos/horas"
        m = re.search(r'en (\d+)\s*(min|minutos?|h|horas?)', text_lower)
        if m:
            amount = int(m.group(1))
            unit = m.group(2)
            if "min" in unit:
                target = now + timedelta(minutes=amount)
            else:
                target = now + timedelta(hours=amount)
            return {
                "timestamp": target.timestamp(),
                "human_readable": f"En {amount} {'minutos' if 'min' in unit else 'horas'}",
            }

        # "a las X" (hoy o mañana)
        m = re.search(r'a las? (\d{1,2})(?::(\d{2}))?', text_lower)
        if m:
            hour = int(m.group(1))
            minute = int(m.group(2) or 0)
            target = now.replace(hour=hour, minute=minute, second=0)
            if target < now:
                target += timedelta(days=1)
            when = target.strftime("%d/%m a las %H:%M")
            return {"timestamp": target.timestamp(), "human_readable": when}

        # "mañana"
        if "mañana" in text_lower or "manana" in text_lower:
            target = now + timedelta(days=1)
            target = target.replace(hour=9, minute=0, second=0)
            return {
                "timestamp": target.timestamp(),
                "human_readable": "Mañana a las 9:00",
            }

        # "pasado mañana"
        if "pasado" in text_lower:
            target = now + timedelta(days=2)
            target = target.replace(hour=9, minute=0, second=0)
            return {
                "timestamp": target.timestamp(),
                "human_readable": "Pasado mañana a las 9:00",
            }

        # Default: en 1 hora
        target = now + timedelta(hours=1)
        return {
            "timestamp": target.timestamp(),
            "human_readable": "En 1 hora",
        }

    def _extract_reminder_text(self, text: str) -> str:
        """Extrae el texto del recordatorio (quita palabras de tiempo)."""
        # Eliminar comandos y palabras temporales
        removals = [
            r'/recordar\s*', r'recuérdame\s*', r'recordatorio\s*',
            r'en \d+ (min|minutos?|h|horas?)\s*',
            r'a las? \d{1,2}(:\d{2})?\s*',
            r'mañana\s*', r'pasado mañana\s*',
        ]
        result = text
        for pattern in removals:
            result = re.sub(pattern, '', result, flags=re.IGNORECASE)
        return result.strip() or text

    def _load(self) -> List[Dict]:
        try:
            if os.path.exists(self._path):
                with open(self._path, "r", encoding="utf-8") as f:
                    return json.load(f)
        except Exception:
            pass
        return []

    def _save(self):
        try:
            os.makedirs(os.path.dirname(self._path), exist_ok=True)
            with open(self._path, "w", encoding="utf-8") as f:
                json.dump(self._reminders, f, ensure_ascii=False, indent=2)
        except Exception as e:
            logger.error(f"Reminders save error: {e}")
