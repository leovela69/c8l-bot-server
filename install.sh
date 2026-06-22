#!/bin/bash
# ============================================================
# 🚀 INSTALADOR C8L BOT TEAM — Un solo comando
# ============================================================
# Uso: curl -sSL https://raw.githubusercontent.com/leovela69/c8l-bot-server/main/install.sh | bash
# O:   bash install.sh
# ============================================================

echo "🦁 C8L Bot Team — Instalación"
echo "================================"

# Matar procesos viejos del bot
echo "🔧 Matando bots viejos..."
pkill -f "python.*bot" 2>/dev/null
pkill -f "python.*whatsapp" 2>/dev/null
pkill -f "python.*aion" 2>/dev/null
sleep 2

# Directorio de instalación
INSTALL_DIR="/root/c8l-bot-server"

# Descargar/actualizar código
if [ -d "$INSTALL_DIR" ]; then
    echo "📥 Actualizando código..."
    cd "$INSTALL_DIR"
    git pull origin main
else
    echo "📥 Descargando código..."
    cd /root
    git clone https://github.com/leovela69/c8l-bot-server.git
    cd "$INSTALL_DIR"
fi

# Instalar dependencias
echo "📦 Instalando dependencias..."
pip install -r requirements.txt -q

# Crear directorios de datos
mkdir -p data/{logs,reports,memory}

# Eliminar webhook viejo (mata bot fantasma)
echo "🔧 Limpiando webhooks..."
python3 -c "
import requests
from config import TELEGRAM_BOT_TOKEN
r = requests.post(f'https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/deleteWebhook', json={'drop_pending_updates': True}, timeout=10)
print(f'   deleteWebhook: {r.json().get(\"description\", \"ok\")}')
" 2>/dev/null

# Arrancar bot principal
echo "🚀 Arrancando bot de Telegram..."
nohup python3 whatsapp_bot.py > data/logs/bot.log 2>&1 &
BOT_PID=$!
echo "   PID: $BOT_PID"

# Arrancar AION (monitor)
echo "👑 Arrancando AION (monitor cada 5 min)..."
nohup python3 aion_cron.py > data/logs/aion.log 2>&1 &
AION_PID=$!
echo "   PID: $AION_PID"

# Guardar PIDs
echo "$BOT_PID" > data/bot.pid
echo "$AION_PID" > data/aion.pid

echo ""
echo "================================"
echo "✅ ¡TODO INSTALADO!"
echo ""
echo "🤖 Bot Telegram:  PID $BOT_PID"
echo "👑 AION Monitor:  PID $AION_PID"
echo ""
echo "📋 Logs:"
echo "   tail -f data/logs/bot.log"
echo "   tail -f data/logs/aion.log"
echo ""
echo "🛑 Para parar todo:"
echo "   kill $BOT_PID $AION_PID"
echo "================================"
