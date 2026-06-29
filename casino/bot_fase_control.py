"""
CONTROL DE FASES DEL SLOT DESDE TELEGRAM
=========================================
Este módulo añade el comando /fase al bot para controlar
las fases de la máquina de slot en tiempo real via Firebase.

INSTALACIÓN:
1. pip install firebase-admin
2. Configurar variables de entorno (ver .env.example)
3. Importar y registrar los handlers en tu bot principal

COMANDOS:
  /fase 0       → Sequía (pocos premios, 15-20%)
  /fase 1       → Normal (premios moderados, 40-45%)
  /fase 2       → Extraordinaria (muchos premios, 75-80%)
  /fase auto    → Vuelve a rotación automática
  /fase estado  → Muestra la fase actual

SEGURIDAD:
  Solo el OWNER_ID puede usar este comando.
"""

import os
import firebase_admin
from firebase_admin import credentials, db

# ===== CONFIGURACIÓN (usa variables de entorno) =====
# Tu ID numérico de Telegram (SOLO tú puedes controlar las fases)
OWNER_ID = int(os.environ.get('TELEGRAM_OWNER_ID', '0'))

# Firebase service account JSON path
FIREBASE_CRED_PATH = os.environ.get('FIREBASE_CRED_PATH', 'firebase_service_account.json')

# Firebase database URL
FIREBASE_DB_URL = os.environ.get('FIREBASE_DB_URL', 'https://YOUR_PROJECT_ID-default-rtdb.firebaseio.com')

# ===== INICIALIZAR FIREBASE =====
_firebase_initialized = False

def init_firebase():
    global _firebase_initialized
    if _firebase_initialized:
        return True
    try:
        cred = credentials.Certificate(FIREBASE_CRED_PATH)
        firebase_admin.initialize_app(cred, {'databaseURL': FIREBASE_DB_URL})
        _firebase_initialized = True
        print("Firebase inicializado correctamente")
        return True
    except Exception as e:
        print(f"Error inicializando Firebase: {e}")
        return False


def set_phase(phase, duration=None):
    """Escribe la fase en Firebase Realtime Database."""
    if not init_firebase():
        return False
    try:
        ref = db.reference('slot_config')
        data = {'phase': phase}
        if duration:
            data['duration'] = duration
        ref.set(data)
        return True
    except Exception as e:
        print(f"Error escribiendo en Firebase: {e}")
        return False


def get_phase():
    """Lee la fase actual de Firebase."""
    if not init_firebase():
        return None
    try:
        ref = db.reference('slot_config')
        return ref.get()
    except Exception as e:
        print(f"Error leyendo Firebase: {e}")
        return None


# ===== HANDLER PARA EL BOT =====
# Adapta esto a tu framework de bot (python-telegram-bot, aiogram, etc.)

async def handle_fase_command(update, context):
    """
    Handler para el comando /fase.
    Úsalo con python-telegram-bot v20+:
      app.add_handler(CommandHandler("fase", handle_fase_command))
    """
    user_id = update.effective_user.id

    # SOLO el owner puede controlar las fases
    if user_id != OWNER_ID:
        await update.message.reply_text("No tienes permiso para usar este comando.")
        return

    args = context.args if context.args else []

    if not args:
        await update.message.reply_text(
            "Uso:\n"
            "/fase 0 → Sequía (pocos premios)\n"
            "/fase 1 → Normal (moderado)\n"
            "/fase 2 → Extraordinaria (muchos premios)\n"
            "/fase auto → Rotación automática\n"
            "/fase estado → Ver fase actual"
        )
        return

    cmd = args[0].lower()

    if cmd == 'estado':
        config = get_phase()
        if config:
            phase_names = {0: 'Sequía', 1: 'Normal', 2: 'Extraordinaria', 'auto': 'Automático'}
            phase = config.get('phase', 'auto')
            name = phase_names.get(phase, phase_names.get(int(phase) if str(phase).isdigit() else phase, '?'))
            await update.message.reply_text(f"Fase actual: {phase} ({name})")
        else:
            await update.message.reply_text("No se pudo leer la fase (¿Firebase configurado?)")
        return

    if cmd == 'auto':
        if set_phase('auto'):
            await update.message.reply_text("Fase: AUTOMÁTICA (rotación normal)")
        else:
            await update.message.reply_text("Error al cambiar fase")
        return

    if cmd in ('0', '1', '2'):
        phase_names = {0: 'Sequía', 1: 'Normal', 2: 'Extraordinaria'}
        phase = int(cmd)
        duration = int(args[1]) if len(args) > 1 else None
        if set_phase(phase, duration):
            msg = f"Fase cambiada: {phase} ({phase_names[phase]})"
            if duration:
                msg += f" por {duration} giros"
            await update.message.reply_text(msg)
        else:
            await update.message.reply_text("Error al cambiar fase")
        return

    await update.message.reply_text("Fase no válida. Usa: 0, 1, 2, auto, o estado")


# ===== EJEMPLO DE INTEGRACIÓN =====
"""
# En tu bot principal (main.py o similar):

from bot_fase_control import handle_fase_command
from telegram.ext import CommandHandler

# ... tu setup de bot ...
app.add_handler(CommandHandler("fase", handle_fase_command))
"""
