# -*- coding: utf-8 -*-
"""
🛡️ GUARDIAN — Proteccion absoluta de Bot 1 (leon_leo_bot)
Solo Leo Vela (ADMIN_CHAT_ID) tiene control total.
Nadie mas puede apagar, reiniciar, o modificar al bot.

4 CAPAS DE SEGURIDAD:
1. Solo tu ID puede ejecutar comandos admin
2. Si alguien intenta hacerse admin -> te avisa y lo bloquea
3. El bot NO obedece a nadie mas aunque digan "soy el admin"
4. Contrasena maestra para comandos criticos (apagar, borrar)
"""

import time
import json
import os
import logging
from config import ADMIN_CHAT_ID, DATA_DIR

logger = logging.getLogger("hermes.guardian")

INTRUDERS_FILE = os.path.join(DATA_DIR, "intruders.json")
MASTER_PASSWORD = "C8L_ZEUS_2026"  # Contrasena para apagar/borrar


class Guardian:
    """Protege a Bot 1. Solo Leo manda."""

    def __init__(self, bot):
        self.bot = bot
        self.intruders = self._load_intruders()
        self.blocked_users = set()
        self.failed_attempts = {}

    def _load_intruders(self):
        try:
            if os.path.exists(INTRUDERS_FILE):
                with open(INTRUDERS_FILE, "r") as f:
                    return json.load(f)
        except:
            pass
        return []

    def _save_intruders(self):
        with open(INTRUDERS_FILE, "w") as f:
            json.dump(self.intruders, f, indent=2)

    # === CAPA 1: Verificar identidad ===

    def is_owner(self, user_id):
        """Solo Leo Vela es el dueno."""
        return str(user_id) == ADMIN_CHAT_ID

    def verify_admin(self, user_id, username="unknown"):
        """
        Verifica si alguien tiene privilegios admin.
        Si NO es Leo -> registrar intento y alertar.
        """
        if self.is_owner(user_id):
            return True

        # INTRUSO DETECTADO
        self._register_intrusion(user_id, username)
        return False

    # === CAPA 2: Alertar de intrusos ===

    def _register_intrusion(self, user_id, username):
        """Registra intento de acceso no autorizado."""
        uid = str(user_id)

        intrusion = {
            "user_id": uid,
            "username": username,
            "timestamp": time.time(),
            "date": time.strftime("%Y-%m-%d %H:%M:%S")
        }
        self.intruders.append(intrusion)
        self._save_intruders()

        # Contar intentos
        if uid not in self.failed_attempts:
            self.failed_attempts[uid] = 0
        self.failed_attempts[uid] += 1

        # Alertar a Leo
        try:
            self.bot.send_message(
                ADMIN_CHAT_ID,
                f"🚨 *ALERTA DE SEGURIDAD*\n\n"
                f"Alguien intento acceder como admin:\n"
                f"👤 Usuario: @{username}\n"
                f"🆔 ID: {uid}\n"
                f"⏰ Hora: {intrusion['date']}\n"
                f"❌ Intentos: {self.failed_attempts[uid]}\n\n"
                f"{'🔒 BLOQUEADO automaticamente (3+ intentos)' if self.failed_attempts[uid] >= 3 else '⚠️ Vigilando...'}"
            )
        except:
            pass

        # Bloquear despues de 3 intentos
        if self.failed_attempts[uid] >= 3:
            self.blocked_users.add(uid)
            logger.warning(f"Usuario {username} ({uid}) BLOQUEADO por intentos de admin")

    # === CAPA 3: Rechazar ordenes de no-admin ===

    def reject_unauthorized(self, message):
        """
        Responde a intentos de usar comandos admin por no-admin.
        Retorna True si fue rechazado (no es admin).
        """
        user_id = message.from_user.id
        username = message.from_user.username or message.from_user.first_name or "unknown"

        if self.is_owner(user_id):
            return False  # Es Leo, permitir

        # Es un intruso
        self._register_intrusion(user_id, username)

        # Si esta bloqueado, ni responder
        if str(user_id) in self.blocked_users:
            return True

        # Responder con rechazo
        try:
            self.bot.reply_to(
                message,
                "🛡️ *Acceso denegado.*\n\n"
                "Solo mi creador tiene privilegios sobre mi.\n"
                "Este intento ha sido registrado.\n\n"
                "_Hermes protege. Siempre._"
            )
        except:
            pass

        return True

    # === CAPA 4: Contrasena maestra para criticos ===

    def verify_master_password(self, password):
        """Verifica contrasena maestra para acciones criticas."""
        return password == MASTER_PASSWORD

    def require_password(self, message, action="accion critica"):
        """
        Pide contrasena para acciones criticas.
        Retorna True si la contrasena es correcta.
        """
        if not self.is_owner(message.from_user.id):
            self.reject_unauthorized(message)
            return False

        # Es Leo pero necesita contrasena
        text = message.text.strip()
        parts = text.split(maxsplit=2)

        if len(parts) >= 3 and self.verify_master_password(parts[-1]):
            return True

        # Pedir contrasena
        try:
            self.bot.reply_to(
                message,
                f"🔐 *{action}* requiere contrasena maestra.\n\n"
                f"Uso: `/{parts[0][1:] if parts else 'comando'} {MASTER_PASSWORD}`\n\n"
                f"_Solo tu conoces esta clave, jefe._"
            )
        except:
            pass

        return False

    # === COMANDOS ADMIN PROTEGIDOS ===

    def get_security_report(self):
        """Reporte de seguridad."""
        total_intrusions = len(self.intruders)
        blocked = len(self.blocked_users)
        recent = self.intruders[-5:] if self.intruders else []

        report = (
            f"🛡️ *GUARDIAN — Reporte de Seguridad*\n\n"
            f"🚨 Intrusiones totales: {total_intrusions}\n"
            f"🔒 Usuarios bloqueados: {blocked}\n\n"
        )

        if recent:
            report += "*Ultimos intentos:*\n"
            for i in recent:
                report += f"  • @{i['username']} — {i['date']}\n"
        else:
            report += "✅ Sin intrusiones registradas.\n"

        report += f"\n🔑 Contrasena maestra: activa\n"
        report += f"👑 Admin: {ADMIN_CHAT_ID}\n"
        report += f"\n_Hermes protege a Zeus. Nadie mas manda._"

        return report

    def change_master_password(self, old_pass, new_pass):
        """Cambia la contrasena maestra (solo Leo)."""
        global MASTER_PASSWORD
        if old_pass == MASTER_PASSWORD:
            MASTER_PASSWORD = new_pass
            logger.info("Contrasena maestra cambiada")
            return True
        return False
