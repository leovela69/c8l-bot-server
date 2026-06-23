# -*- coding: utf-8 -*-
"""
🛡️ C8L GUARDIAN — Sistema de Sanciones y Moderacion
Bot de moderacion con 4 niveles de bloqueo + base legal RGPD/LOPD.
"""

import logging
import json
import os
import time
from datetime import datetime, timedelta

logger = logging.getLogger("c8l.guardian")

from config import DATA_DIR

SANCTIONS_FILE = os.path.join(DATA_DIR, "sanctions.json")
WARNINGS_FILE = os.path.join(DATA_DIR, "warnings.json")
MODERATION_LOG_FILE = os.path.join(DATA_DIR, "moderation_log.json")

SANCTION_TEXTS = {
    "3d": {
        "emoji": "\U0001f535",
        "duration_hours": 72,
        "duration_text": "3 dias (72 horas)",
        "legal_basis": "Articulo 6.1.f) RGPD (Interes legitimo)",
        "review": False, "appeal": True,
        "message": (
            "\U0001f535 *SANCION LEVE — 3 DIAS*\n\n"
            "De acuerdo con el Art. 6.1.f) del RGPD y la LO 3/2018, "
            "C8L Agency procede a la suspension temporal por 3 dias.\n\n"
            "*Motivo:* {reason}\n*Inicio:* {start_date}\n*Fin:* {end_date}\n\n"
            "*DERECHOS:*\n"
            "\u2022 Acceso (Art.15) \u2022 Rectificacion (Art.16) \u2022 Supresion (Art.17)\n"
            "\u2022 Apelacion: moderacion@c8l.agency (48h)\n\n"
            "\U0001f916 C8L Guardian"
        ),
    },
    "7d": {
        "emoji": "\U0001f7e1",
        "duration_hours": 168,
        "duration_text": "7 dias (168 horas)",
        "legal_basis": "Art. 6.1.f RGPD + Art. 173.1 CP",
        "review": True, "appeal": True,
        "message": (
            "\U0001f7e1 *SANCION MEDIA — 7 DIAS*\n\n"
            "Conforme al Art. 6.1.f) RGPD y Art. 173.1 CP, "
            "se procede a la suspension por 7 dias.\n\n"
            "*Motivo:* {reason}\n*Inicio:* {start_date}\n*Fin:* {end_date}\n\n"
            "*DERECHOS (RGPD):*\n"
            "\u2022 Acceso (Art.15) \u2022 Rectificacion (Art.16) \u2022 Supresion (Art.17)\n"
            "\u2022 Oposicion (Art.21) \u2022 Apelacion: moderacion@c8l.agency (48h)\n"
            "\u2022 Reclamacion AEPD: www.aepd.es\n\n"
            "\u26a0\ufe0f Revision por moderador humano en 48h.\n\U0001f916 C8L Guardian"
        ),
    },
    "30d": {
        "emoji": "\U0001f7e0",
        "duration_hours": 720,
        "duration_text": "30 dias (720 horas)",
        "legal_basis": "Art. 6.1.f RGPD + Arts. 169, 173, 184, 510 CP",
        "review": True, "appeal": True,
        "message": (
            "\U0001f7e0 *SANCION GRAVE — 30 DIAS*\n\n"
            "Conforme al Art. 6.1.f) RGPD y Arts. 169, 173, 184, 510 CP, "
            "se procede a la suspension por 30 dias.\n\n"
            "*Motivo:* {reason}\n*Inicio:* {start_date}\n*Fin:* {end_date}\n\n"
            "*DERECHOS (RGPD):*\n"
            "\u2022 Acceso (Art.15) \u2022 Rectificacion (Art.16) \u2022 Supresion (Art.17)\n"
            "\u2022 Oposicion (Art.21) \u2022 Intervencion humana (Art.22)\n"
            "\u2022 Apelacion: moderacion@c8l.agency (48h)\n"
            "\u2022 Reclamacion AEPD: www.aepd.es\n\n"
            "\u26a0\ufe0f Dos infracciones graves = bloqueo permanente.\n\U0001f916 C8L Guardian"
        ),
    },
    "perm": {
        "emoji": "\U0001f534",
        "duration_hours": -1,
        "duration_text": "PERMANENTE",
        "legal_basis": "Art. 6.1.f RGPD + Arts. 169, 173, 197, 248, 401, 510 CP",
        "review": True, "appeal": False,
        "message": (
            "\U0001f534 *BLOQUEO PERMANENTE*\n\n"
            "Conforme al Art. 6.1.f) RGPD y Arts. 169, 173, 197, 248, 401, 510 CP, "
            "se procede a la suspension DEFINITIVA.\n\n"
            "*Motivo:* {reason}\n*Fecha:* {start_date}\n*Duracion:* PERMANENTE\n\n"
            "*DERECHOS (RGPD):*\n"
            "\u2022 Acceso (Art.15) \u2022 Rectificacion (Art.16) \u2022 Supresion (Art.17)\n"
            "\u2022 Oposicion (Art.21) \u2022 Intervencion humana (Art.22)\n"
            "\u2022 Reclamacion AEPD: www.aepd.es\n"
            "\u2022 Tutela judicial (Art. 24 CE)\n\n"
            "\u26a0\ufe0f NO PROCEDE APELACION\n\U0001f916 C8L Guardian"
        ),
    },
}

WARNING_MESSAGE = (
    "\u26a0\ufe0f *ADVERTENCIA — C8L Agency*\n\n"
    "Usuario: {user_name}\nMotivo: {reason}\n"
    "Advertencias: {count}/3\nFecha: {date}\n\n"
    "3 advertencias = sancion automatica 3 dias.\n\U0001f916 C8L Guardian"
)


class Guardian:
    def __init__(self):
        self.sanctions = self._load_json(SANCTIONS_FILE, {})
        self.warnings = self._load_json(WARNINGS_FILE, {})
        self.mod_log = self._load_json(MODERATION_LOG_FILE, [])
        self._cleanup_expired()

    def _load_json(self, filepath, default):
        try:
            if os.path.exists(filepath):
                with open(filepath, "r", encoding="utf-8") as f:
                    return json.load(f)
        except:
            pass
        return default

    def _save_json(self, filepath, data):
        try:
            os.makedirs(os.path.dirname(filepath), exist_ok=True)
            with open(filepath, "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
        except Exception as e:
            logger.error(f"Error guardando {filepath}: {e}")

    def _save_all(self):
        self._save_json(SANCTIONS_FILE, self.sanctions)
        self._save_json(WARNINGS_FILE, self.warnings)
        self._save_json(MODERATION_LOG_FILE, self.mod_log)

    def _cleanup_expired(self):
        now = time.time()
        expired = [uid for uid, s in self.sanctions.items()
                   if s.get("expires_at", -1) > 0 and s["expires_at"] < now]
        for uid in expired:
            del self.sanctions[uid]
        if expired:
            self._save_json(SANCTIONS_FILE, self.sanctions)

    def warn_user(self, user_id, user_name, reason, admin_name="Admin"):
        uid = str(user_id)
        if uid not in self.warnings:
            self.warnings[uid] = {"user_name": user_name, "count": 0, "history": []}
        self.warnings[uid]["count"] += 1
        self.warnings[uid]["history"].append({
            "reason": reason, "date": datetime.now().strftime("%d/%m/%Y %H:%M"), "admin": admin_name
        })
        count = self.warnings[uid]["count"]
        self._log_action("warn", uid, user_name, reason, admin_name)
        self._save_all()

        auto_ban = False
        if count >= 3:
            auto_ban = True
            self.ban_user(user_id, user_name, "3d", "3 advertencias acumuladas", "C8L Guardian")
            self.warnings[uid]["count"] = 0
            self._save_all()

        msg = WARNING_MESSAGE.format(user_name=user_name, reason=reason, count=count,
                                     date=datetime.now().strftime("%d/%m/%Y %H:%M"))
        return {"success": True, "message": msg, "warning_count": count, "auto_ban": auto_ban}

    def ban_user(self, user_id, user_name, duration, reason, admin_name="Admin"):
        uid = str(user_id)
        if duration not in SANCTION_TEXTS:
            return {"success": False, "message": f"Duracion invalida: {duration}. Usa: 3d, 7d, 30d, perm"}
        template = SANCTION_TEXTS[duration]
        now = datetime.now()
        start_date = now.strftime("%d/%m/%Y %H:%M")
        if duration == "perm":
            end_date = "PERMANENTE"
            expires_at = -1
        else:
            end_dt = now + timedelta(hours=template["duration_hours"])
            end_date = end_dt.strftime("%d/%m/%Y %H:%M")
            expires_at = end_dt.timestamp()

        sanction_data = {
            "user_id": uid, "user_name": user_name, "duration": duration,
            "duration_text": template["duration_text"], "reason": reason,
            "start_date": start_date, "end_date": end_date, "expires_at": expires_at,
            "legal_basis": template["legal_basis"], "admin": admin_name,
            "created_at": time.time()
        }
        self.sanctions[uid] = sanction_data
        self._log_action("ban", uid, user_name, f"[{duration}] {reason}", admin_name)
        self._save_all()

        msg = template["message"].format(reason=reason, start_date=start_date, end_date=end_date)
        return {"success": True, "message": msg, "sanction_data": sanction_data}

    def unban_user(self, user_id, admin_name="Admin"):
        uid = str(user_id)
        if uid not in self.sanctions:
            return {"success": False, "message": f"Usuario {uid} no tiene sanciones activas."}
        sanction = self.sanctions.pop(uid)
        self._log_action("unban", uid, sanction.get("user_name", "?"), "Desbloqueado", admin_name)
        self._save_all()
        return {"success": True, "message": f"\u2705 *Desbloqueado:* {sanction.get('user_name', uid)}\nAdmin: {admin_name}"}

    def is_banned(self, user_id):
        uid = str(user_id)
        self._cleanup_expired()
        if uid in self.sanctions:
            return {"banned": True, "sanction_data": self.sanctions[uid]}
        return {"banned": False}

    def get_ban_list(self):
        self._cleanup_expired()
        if not self.sanctions:
            return "\u2705 *No hay sanciones activas.*"
        msg = "\U0001f6ab *SANCIONES ACTIVAS*\n\n"
        for uid, s in self.sanctions.items():
            msg += f"{SANCTION_TEXTS.get(s.get('duration','3d'),{}).get('emoji','')} *{s.get('user_name','?')}* — {s.get('duration_text','?')}\n   Motivo: {s.get('reason','?')}\n   Fin: {s.get('end_date','?')}\n\n"
        return msg + f"Total: {len(self.sanctions)}\n\U0001f916 C8L Guardian"

    def get_user_infractions(self, user_id):
        uid = str(user_id)
        w = self.warnings.get(uid, {"count": 0, "history": []})
        ban = self.sanctions.get(uid)
        msg = f"\U0001f4cb *Historial de {w.get('user_name', uid)}*\n\n"
        if ban:
            msg += f"\U0001f6ab BAN ACTIVO: {ban.get('duration_text','?')}\n"
        msg += f"\u26a0\ufe0f Warnings: {w['count']}/3\n"
        for h in w.get("history", [])[-5:]:
            msg += f"  - [{h.get('date','')}] {h.get('reason','')}\n"
        return msg

    def _log_action(self, action, user_id, user_name, reason, admin):
        self.mod_log.append({
            "action": action, "user_id": user_id, "user_name": user_name,
            "reason": reason, "admin": admin, "date": datetime.now().strftime("%d/%m/%Y %H:%M:%S")
        })
        if len(self.mod_log) > 500:
            self.mod_log = self.mod_log[-500:]

    def get_mod_log(self, limit=10):
        if not self.mod_log:
            return "\U0001f4cb *Log vacio.*"
        msg = "\U0001f4cb *Log de moderacion:*\n\n"
        icons = {"warn": "\u26a0\ufe0f", "ban": "\U0001f6ab", "unban": "\u2705"}
        for e in self.mod_log[-limit:]:
            msg += f"{icons.get(e['action'],'')} {e['action'].upper()} | {e.get('user_name','?')} | {e.get('reason','')[:40]}\n"
        return msg
