#!/bin/bash
# ============================================================
#  C8L BOT SERVER — Script de arranque con tunnel auto-config
#  Uso: bash start.sh
#  Hace:
#    1. Mata procesos anteriores
#    2. Arranca el bot Python
#    3. Arranca cloudflared y captura la URL nueva
#    4. Registra la URL en el bot via API interna
#    5. Muestra la URL final para copiarla si se necesita
# ============================================================

BOT_DIR="$(cd "$(dirname "$0")" && pwd)"
BOT_PORT=8080
LOG_BOT="$BOT_DIR/bot.log"
LOG_TUNNEL="$BOT_DIR/tunnel.log"

echo ""
echo "============================================================"
echo "  🏛️  C8L BOT SERVER — Iniciando..."
echo "============================================================"

# 1. Matar procesos anteriores
echo "🔴 Deteniendo procesos anteriores..."
pkill -f "whatsapp_bot.py" 2>/dev/null
pkill -f "cloudflared" 2>/dev/null
sleep 2

# 2. Arrancar el bot
echo "🤖 Arrancando C8L Bot..."
cd "$BOT_DIR"
nohup python3 whatsapp_bot.py > "$LOG_BOT" 2>&1 &
BOT_PID=$!
echo "   PID del bot: $BOT_PID"

# Esperar a que el bot esté listo
echo "⏳ Esperando que el bot arranque (10s)..."
sleep 10

# Verificar que el bot está vivo
if curl -sf "http://localhost:$BOT_PORT/" > /dev/null 2>&1; then
    echo "✅ Bot en línea en puerto $BOT_PORT"
else
    echo "⚠️  Bot tardando en arrancar, continuando igualmente..."
fi

# 3. Arrancar cloudflared y capturar URL
echo ""
echo "🌐 Iniciando tunnel Cloudflare..."
nohup cloudflared tunnel --url "http://localhost:$BOT_PORT" > "$LOG_TUNNEL" 2>&1 &
TUNNEL_PID=$!
echo "   PID del tunnel: $TUNNEL_PID"

# Esperar a que el tunnel genere la URL (hasta 30s)
echo "⏳ Esperando URL del tunnel (30s)..."
TUNNEL_URL=""
for i in $(seq 1 30); do
    sleep 1
    TUNNEL_URL=$(grep -oP 'https://[a-z0-9-]+\.trycloudflare\.com' "$LOG_TUNNEL" 2>/dev/null | head -1)
    if [ -n "$TUNNEL_URL" ]; then
        break
    fi
done

if [ -z "$TUNNEL_URL" ]; then
    echo "❌ No se pudo capturar la URL del tunnel."
    echo "   Revisa $LOG_TUNNEL para más info."
    echo ""
    echo "   El bot sigue activo en http://localhost:$BOT_PORT"
    echo "   Puedes lanzar cloudflared manualmente y copiar la URL."
    exit 1
fi

echo "✅ Tunnel activo: $TUNNEL_URL"

# 4. Registrar la URL nueva en el bot
echo ""
echo "📡 Registrando tunnel URL en el bot..."
RESPONSE=$(curl -sf -X POST "http://localhost:$BOT_PORT/api/set-tunnel-url" \
    -H "Content-Type: application/json" \
    -d "{\"url\": \"$TUNNEL_URL\"}" 2>&1)

if echo "$RESPONSE" | grep -q '"success": true'; then
    echo "✅ URL registrada correctamente en el bot."
else
    echo "⚠️  No se pudo registrar via API (el bot la sabrá igualmente al reiniciar)."
    echo "   Respuesta: $RESPONSE"
fi

# 5. Mostrar resumen
echo ""
echo "============================================================"
echo "  ✅ TODO EN LÍNEA"
echo "============================================================"
echo ""
echo "  🤖 Bot:    http://localhost:$BOT_PORT"
echo "  🌐 Tunnel: $TUNNEL_URL"
echo ""
echo "  📋 Para el frontend (Vercel), usa esta variable:"
echo "     NEXT_PUBLIC_SUNO_API_URL=$TUNNEL_URL"
echo ""
echo "  🔍 El frontend también la descubre automáticamente"
echo "     llamando a: $TUNNEL_URL/api/tunnel-url"
echo ""
echo "  📄 Logs:"
echo "     tail -f $LOG_BOT"
echo "     tail -f $LOG_TUNNEL"
echo "============================================================"
