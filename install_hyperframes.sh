#!/bin/bash
# ===========================================================================
# 🎬 INSTALL HYPERFRAMES — Script de instalación para c8l-bot-server
# ===========================================================================
# Instala Node.js 22+, FFmpeg, y Hyperframes CLI
# Uso: chmod +x install_hyperframes.sh && ./install_hyperframes.sh
# ===========================================================================

set -e

echo "🎬 ============================================"
echo "   C8L HYPERFRAMES INSTALLER"
echo "   Motor de Video HTML → MP4"
echo "============================================"
echo ""

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

ok() { echo -e "${GREEN}✅ $1${NC}"; }
warn() { echo -e "${YELLOW}⚠️  $1${NC}"; }
fail() { echo -e "${RED}❌ $1${NC}"; }

# ===========================================================================
# 1. Verificar/Instalar Node.js 22+
# ===========================================================================
echo "📦 [1/4] Verificando Node.js..."

if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version | sed 's/v//' | cut -d. -f1)
    if [ "$NODE_VERSION" -ge 22 ]; then
        ok "Node.js v$(node --version) encontrado"
    else
        warn "Node.js v$(node --version) es menor a 22. Actualizando..."
        # Instalar Node.js 22 via NodeSource
        if command -v apt-get &> /dev/null; then
            curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
            sudo apt-get install -y nodejs
        elif command -v dnf &> /dev/null; then
            curl -fsSL https://rpm.nodesource.com/setup_22.x | sudo bash -
            sudo dnf install -y nodejs
        else
            warn "No pude instalar Node.js automáticamente."
            echo "   Instala manualmente: https://nodejs.org/en/download"
        fi
    fi
else
    echo "   Node.js no encontrado. Instalando v22..."
    if command -v apt-get &> /dev/null; then
        curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
        sudo apt-get install -y nodejs
    elif command -v brew &> /dev/null; then
        brew install node@22
    else
        fail "No pude instalar Node.js. Instálalo manualmente."
        echo "   https://nodejs.org/en/download"
    fi
fi

# Verificar
if command -v node &> /dev/null; then
    ok "Node.js $(node --version) listo"
else
    fail "Node.js no disponible después de la instalación"
fi

# ===========================================================================
# 2. Verificar/Instalar FFmpeg
# ===========================================================================
echo ""
echo "📦 [2/4] Verificando FFmpeg..."

if command -v ffmpeg &> /dev/null; then
    FFMPEG_V=$(ffmpeg -version 2>&1 | head -1 | awk '{print $3}')
    ok "FFmpeg $FFMPEG_V encontrado"
else
    echo "   FFmpeg no encontrado. Instalando..."
    if command -v apt-get &> /dev/null; then
        sudo apt-get update && sudo apt-get install -y ffmpeg
    elif command -v brew &> /dev/null; then
        brew install ffmpeg
    elif command -v dnf &> /dev/null; then
        sudo dnf install -y ffmpeg
    else
        fail "No pude instalar FFmpeg. Instálalo manualmente."
    fi
fi

if command -v ffmpeg &> /dev/null; then
    ok "FFmpeg listo"
else
    warn "FFmpeg no disponible — el render usará fallback limitado"
fi

# ===========================================================================
# 3. Instalar Hyperframes CLI
# ===========================================================================
echo ""
echo "📦 [3/4] Instalando Hyperframes CLI..."

if command -v npx &> /dev/null; then
    # Instalar globalmente para que esté disponible
    npm install -g hyperframes 2>/dev/null || {
        warn "No pude instalar globalmente, usando npx..."
        npx hyperframes --version 2>/dev/null || {
            warn "Hyperframes se ejecutará via npx bajo demanda"
        }
    }
    ok "Hyperframes CLI disponible"
else
    warn "npx no disponible — instala Node.js primero"
fi

# ===========================================================================
# 4. Crear directorios necesarios
# ===========================================================================
echo ""
echo "📦 [4/4] Creando directorios..."

mkdir -p data/videos
mkdir -p data/videos/temp
mkdir -p data/videos/rendered

ok "Directorios creados: data/videos/"

# ===========================================================================
# RESUMEN
# ===========================================================================
echo ""
echo "🎬 ============================================"
echo "   INSTALACIÓN COMPLETADA"
echo "============================================"
echo ""
echo "   Requisitos:"
if command -v node &> /dev/null; then
    echo -e "   ${GREEN}✅ Node.js $(node --version)${NC}"
else
    echo -e "   ${RED}❌ Node.js${NC}"
fi
if command -v ffmpeg &> /dev/null; then
    echo -e "   ${GREEN}✅ FFmpeg${NC}"
else
    echo -e "   ${RED}❌ FFmpeg${NC}"
fi
if command -v npx &> /dev/null; then
    echo -e "   ${GREEN}✅ npx (Hyperframes CLI)${NC}"
else
    echo -e "   ${RED}❌ npx${NC}"
fi
echo ""
echo "   Uso en el bot:"
echo "   /video <descripción>    — Generar video con IA"
echo "   /video templates        — Ver plantillas"
echo "   /video neon Mi Texto    — Atajo rápido"
echo ""
echo "   Variables de entorno (opcionales):"
echo "   HYPERFRAMES_ENABLED=true"
echo "   HYPERFRAMES_WIDTH=1920"
echo "   HYPERFRAMES_HEIGHT=1080"
echo "   HYPERFRAMES_FPS=30"
echo ""
echo "🚀 ¡Listo para crear videos!"
