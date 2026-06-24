#!/bin/bash
# ===========================================================================
# 🏛️ C8L BOT — SCRIPT DE INSTALACION AUTOMATICA PARA VPS
# ===========================================================================
# Este script instala TODO lo necesario para correr el bot en un VPS limpio.
# Solo copia y pega este comando en la terminal SSH del VPS:
#
#   curl -sSL https://raw.githubusercontent.com/leovela69/c8l-bot-server/main/deploy_vps.sh | bash
#
# O si ya clonaste el repo:
#   chmod +x deploy_vps.sh && ./deploy_vps.sh
#
# Requisitos: Ubuntu 22.04/24.04 (lo que viene por defecto en Hostinger VPS)
# ===========================================================================

set -e

echo "=========================================="
echo "  🏛️ C8L BOT — INSTALACION VPS"
echo "=========================================="
echo ""

# ---------------------------------------------------------------------------
# 1. ACTUALIZAR SISTEMA
# ---------------------------------------------------------------------------
echo "📦 [1/8] Actualizando sistema..."
apt update -y && apt upgrade -y

# ---------------------------------------------------------------------------
# 2. INSTALAR DEPENDENCIAS DEL SISTEMA
# ---------------------------------------------------------------------------
echo "🔧 [2/8] Instalando dependencias del sistema..."
apt install -y \
    python3 \
    python3-venv \
    python3-pip \
    ffmpeg \
    git \
    curl \
    wget \
    supervisor \
    fonts-liberation \
    fonts-dejavu \
    fontconfig \
    libmagic1 \
    imagemagick

# Verificar instalaciones
echo "   Python: $(python3 --version)"
echo "   FFmpeg: $(ffmpeg -version 2>&1 | head -1)"
echo "   Git: $(git --version)"

# ---------------------------------------------------------------------------
# 3. CREAR DIRECTORIO DE TRABAJO
# ---------------------------------------------------------------------------
echo "📁 [3/8] Creando directorio de trabajo..."
BOT_DIR="/opt/c8l-bot"
mkdir -p $BOT_DIR
cd $BOT_DIR

# ---------------------------------------------------------------------------
# 4. CLONAR O ACTUALIZAR REPOSITORIO
# ---------------------------------------------------------------------------
echo "📥 [4/8] Descargando codigo del bot..."
if [ -d "$BOT_DIR/.git" ]; then
    echo "   Repo existe, actualizando..."
    git pull origin main
else
    # Limpiar directorio si tiene archivos viejos
    rm -rf $BOT_DIR/*
    git clone https://github.com/leovela69/c8l-bot-server.git .
fi

# ---------------------------------------------------------------------------
# 5. CREAR ENTORNO VIRTUAL E INSTALAR DEPENDENCIAS PYTHON
# ---------------------------------------------------------------------------
echo "🐍 [5/8] Configurando Python..."
python3 -m venv venv
source venv/bin/activate

# Instalar dependencias
pip install --upgrade pip
pip install -r requirements.txt

# Instalar extras para VPS (que no iban en Render por peso)
pip install rembg[cpu] onnxruntime fpdf2

echo "   Paquetes instalados: $(pip list 2>/dev/null | wc -l)"

# ---------------------------------------------------------------------------
# 6. CREAR DIRECTORIOS DE DATOS
# ---------------------------------------------------------------------------
echo "📂 [6/8] Creando directorios de datos..."
mkdir -p data/memory data/reports data/pages data/videos

# ---------------------------------------------------------------------------
# 7. CONFIGURAR SUPERVISOR (mantiene bot vivo 24/7)
# ---------------------------------------------------------------------------
echo "⚙️ [7/8] Configurando servicio 24/7..."
cat > /etc/supervisor/conf.d/c8l-bot.conf << 'EOF'
[program:c8l-bot]
command=/opt/c8l-bot/venv/bin/python /opt/c8l-bot/whatsapp_bot.py
directory=/opt/c8l-bot
user=root
autostart=true
autorestart=true
startretries=10
startsecs=10
redirect_stderr=true
stdout_logfile=/var/log/c8l-bot.log
stdout_logfile_maxbytes=10MB
stdout_logfile_backups=3
environment=HOME="/root",PATH="/opt/c8l-bot/venv/bin:%(ENV_PATH)s"
stopwaitsecs=30
killasgroup=true
EOF

# Recargar supervisor
supervisorctl reread
supervisorctl update

# ---------------------------------------------------------------------------
# 8. ARRANCAR BOT
# ---------------------------------------------------------------------------
echo "🚀 [8/8] Arrancando bot..."
supervisorctl restart c8l-bot

# Esperar 5 segundos y verificar
sleep 5
if supervisorctl status c8l-bot | grep -q "RUNNING"; then
    echo ""
    echo "=========================================="
    echo "  ✅ BOT INSTALADO Y CORRIENDO!"
    echo "=========================================="
    echo ""
    echo "  📍 Directorio: /opt/c8l-bot"
    echo "  📋 Logs: /var/log/c8l-bot.log"
    echo "  🔄 Reiniciar: supervisorctl restart c8l-bot"
    echo "  🛑 Parar: supervisorctl stop c8l-bot"
    echo "  📊 Status: supervisorctl status c8l-bot"
    echo "  📜 Ver logs: tail -f /var/log/c8l-bot.log"
    echo ""
    echo "  🎬 VIDEO ENGINE: 12 motores activos"
    echo "  🎨 DESIGN STUDIO: 9 herramientas"
    echo "  🖼️ REMBG: Quitar fondos sin watermark"
    echo "  🎵 FFMPEG: Edicion de video/audio"
    echo ""
    echo "  💡 Para actualizar el bot:"
    echo "     cd /opt/c8l-bot && git pull && supervisorctl restart c8l-bot"
    echo ""
else
    echo ""
    echo "⚠️ El bot no arrancó. Revisa los logs:"
    echo "   tail -50 /var/log/c8l-bot.log"
    echo ""
    supervisorctl status c8l-bot
fi
