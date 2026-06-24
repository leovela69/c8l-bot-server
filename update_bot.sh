#!/bin/bash
# ===========================================================================
# 🔄 C8L BOT — ACTUALIZAR BOT (ejecutar cuando hay cambios en GitHub)
# ===========================================================================
# Uso: ./update_bot.sh
# ===========================================================================

echo "🔄 Actualizando C8L Bot..."
cd /opt/c8l-bot

# Descargar cambios
git pull origin main

# Activar entorno virtual
source venv/bin/activate

# Actualizar dependencias si cambiaron
pip install -r requirements.txt -q

# Reiniciar bot
supervisorctl restart c8l-bot

# Esperar y verificar
sleep 3
if supervisorctl status c8l-bot | grep -q "RUNNING"; then
    echo "✅ Bot actualizado y corriendo!"
    echo "📜 Ultimas lineas del log:"
    tail -5 /var/log/c8l-bot.log
else
    echo "❌ Error al reiniciar. Logs:"
    tail -20 /var/log/c8l-bot.log
fi
