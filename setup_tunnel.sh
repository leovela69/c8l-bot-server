#!/bin/bash
# ============================================================
#  C8L BOT SERVER — Setup Cloudflare Named Tunnel (ONE TIME)
#  
#  Esto crea un tunnel PERMANENTE con URL fija:
#    api.c8lagency.com → localhost:8080
#
#  Solo hay que ejecutar UNA VEZ. Despues, start.sh lo usa.
#
#  Prerequisitos:
#    1. Tener cloudflared instalado
#    2. Tener el dominio c8lagency.com en Cloudflare
#    3. Estar logueado: cloudflared login
# ============================================================

set -e

TUNNEL_NAME="c8l-bot"
SUBDOMAIN="api.c8lagency.com"
BOT_PORT=8080

echo ""
echo "============================================================"
echo "  🌐 SETUP TUNNEL PERMANENTE — C8L Bot Server"
echo "============================================================"
echo ""

# 1. Login a Cloudflare (abre navegador para autorizar)
echo "📋 Paso 1: Login en Cloudflare..."
echo "   (Si ya estas logueado, esto se salta automaticamente)"
if [ ! -f ~/.cloudflared/cert.pem ]; then
    cloudflared login
    echo "✅ Login completado!"
else
    echo "✅ Ya estas logueado (cert.pem encontrado)"
fi

# 2. Crear tunnel con nombre fijo
echo ""
echo "📋 Paso 2: Creando tunnel '$TUNNEL_NAME'..."
EXISTING=$(cloudflared tunnel list | grep "$TUNNEL_NAME" || true)
if [ -n "$EXISTING" ]; then
    echo "✅ Tunnel '$TUNNEL_NAME' ya existe:"
    echo "   $EXISTING"
    TUNNEL_ID=$(echo "$EXISTING" | awk '{print $1}')
else
    cloudflared tunnel create "$TUNNEL_NAME"
    TUNNEL_ID=$(cloudflared tunnel list | grep "$TUNNEL_NAME" | awk '{print $1}')
    echo "✅ Tunnel creado! ID: $TUNNEL_ID"
fi

# 3. Crear DNS route (subdominio → tunnel)
echo ""
echo "📋 Paso 3: Configurando DNS ($SUBDOMAIN → tunnel)..."
cloudflared tunnel route dns "$TUNNEL_NAME" "$SUBDOMAIN" 2>/dev/null || echo "   (DNS ya configurado o error — verificar manualmente)"
echo "✅ DNS configurado: $SUBDOMAIN"

# 4. Crear archivo de configuracion
echo ""
echo "📋 Paso 4: Creando config..."
CONFIG_DIR="$HOME/.cloudflared"
CONFIG_FILE="$CONFIG_DIR/config.yml"

cat > "$CONFIG_FILE" << EOF
tunnel: $TUNNEL_ID
credentials-file: $CONFIG_DIR/${TUNNEL_ID}.json

ingress:
  - hostname: $SUBDOMAIN
    service: http://localhost:$BOT_PORT
    originRequest:
      noTLSVerify: true
  - service: http_status:404
EOF

echo "✅ Config guardada en: $CONFIG_FILE"
echo ""
echo "============================================================"
echo "  ✅ SETUP COMPLETO!"
echo "============================================================"
echo ""
echo "  Tunnel: $TUNNEL_NAME"
echo "  ID:     $TUNNEL_ID"
echo "  URL:    https://$SUBDOMAIN"
echo "  Config: $CONFIG_FILE"
echo ""
echo "  Ahora usa 'bash start.sh' para arrancar el bot."
echo "  El tunnel usara $SUBDOMAIN automaticamente."
echo ""
echo "  Para verificar: curl https://$SUBDOMAIN/"
echo "============================================================"
