#!/bin/bash
# ============================================================
#  C8L BOT SERVER — Script de arranque PRODUCCION
#  Uso: bash start.sh
#
#  Prioridad de tunnel:
#    1. Named tunnel (api.c8lagency.com) — si está configurado
#    2. Quick tunnel (random URL) — fallback
#
#  Hace:
#    1. Mata procesos anteriores
#    2. Arranca el bot Python
#    3. Arranca cloudflared (named o quick)
#    4. Registra la URL en el bot
#    5. Muestra resumen
# ============================================================

BOT_DIR="$(cd "$(dirname "$0")" && pwd)"
BOT_PORT=8080
LOG_BOT="$BOT_DIR/bot.log"
LOG_TUNNEL="$BOT_DIR/tunnel.log"
NAMED_DOMAIN="api.c8lagency.com"
TUNNEL_NAME="c8l-bot"

echo ""
echo "============================================================"
echo "  🏛️  C8L BOT SERVER — Iniciando (Produccion)"
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

echo "⏳ Esperando que el bot arranque (10s)..."
sleep 10

if curl -sf "http://localhost:$BOT_PORT/" > /dev/null 2>&1; then
    echo "✅ Bot en linea en puerto $BOT_PORT"
else
    echo "⚠️  Bot tardando en arrancar, continuando..."
fi

# 3. Arrancar tunnel
echo ""
echo "🌐 Iniciando tunnel Cloudflare..."

# Verificar si hay un named tunnel configurado
TUNNEL_URL=""
USE_NAMED=false

if cloudflared tunnel list 2>/dev/null | grep -q "$TUNNEL_NAME"; then
    echo "   📌 Named tunnel '$TUNNEL_NAME' encontrado → usando $NAMED_DOMAIN"
    USE_NAMED=true
    nohup cloudflared tunnel run "$TUNNEL_NAME" > "$LOG_TUNNEL" 2>&1 &
    TUNNEL_PID=$!
    TUNNEL_URL="https://$NAMED_DOMAIN"
    echo "   PID del tunnel: $TUNNEL_PID"
    sleep 5
else
    echo "   ⚡ Usando Quick tunnel (URL aleatoria)..."
    echo "   💡 Para URL fija, ejecuta: bash setup_tunnel.sh"
    nohup cloudflared tunnel --url "http://localhost:$BOT_PORT" > "$LOG_TUNNEL" 2>&1 &
    TUNNEL_PID=$!
    echo "   PID del tunnel: $TUNNEL_PID"

    echo "⏳ Esperando URL del tunnel (30s)..."
    for i in $(seq 1 30); do
        sleep 1
        TUNNEL_URL=$(grep -oP 'https://[a-z0-9-]+\.trycloudflare\.com' "$LOG_TUNNEL" 2>/dev/null | head -1)
        if [ -n "$TUNNEL_URL" ]; then
            break
        fi
    done
fi

if [ -z "$TUNNEL_URL" ]; then
    echo "❌ No se pudo establecer tunnel."
    echo "   Revisa: tail -f $LOG_TUNNEL"
    echo "   Bot sigue activo en http://localhost:$BOT_PORT"
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
    echo "⚠️  No se pudo registrar via API."
fi

# 5. Resumen
echo ""
echo "============================================================"
echo "  ✅ TODO EN LINEA — C8L Bot Server"
echo "============================================================"
echo ""
echo "  🤖 Bot:    http://localhost:$BOT_PORT"
echo "  🌐 Tunnel: $TUNNEL_URL"
if [ "$USE_NAMED" = true ]; then
echo "  📌 Tipo:   PERMANENTE (named tunnel)"
echo "             La URL NUNCA cambia. Frontend configurado."
else
echo "  ⚡ Tipo:   Quick (temporal — cambia cada reinicio)"
echo "             Para URL fija: bash setup_tunnel.sh"
fi
echo ""
echo "  📄 Logs:"
echo "     tail -f $LOG_BOT"
echo "     tail -f $LOG_TUNNEL"
echo ""
echo "  🎵 Suno API: $TUNNEL_URL/api/suno/generate"
echo "  📚 Suno Library: $TUNNEL_URL/api/suno/feed"
echo "  💰 Suno Credits: $TUNNEL_URL/api/suno/credits"
echo "============================================================"
