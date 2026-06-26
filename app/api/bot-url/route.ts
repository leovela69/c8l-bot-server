import { NextResponse } from 'next/server'

/**
 * GET /api/bot-url
 *
 * Proxy server-side que consulta el bot VPS para obtener la URL actual del tunnel.
 * Resuelve el problema de Mixed Content: el frontend (HTTPS Vercel) no puede
 * llamar directamente a http://VPS-IP:8080 desde el browser.
 * Este endpoint corre en el servidor de Vercel (Node.js), donde HTTP está permitido.
 *
 * El bot siempre expone GET /api/tunnel-url que devuelve su URL de tunnel actual.
 * La URL del VPS se configura via SUNO_VPS_URL (variable privada en Vercel, no NEXT_PUBLIC_).
 *
 * Variables de entorno necesarias (en Vercel):
 *   SUNO_VPS_URL = http://168.231.101.139:8080   (IP y puerto del VPS, sin slash final)
 *
 * Flujo:
 *   1. Si NEXT_PUBLIC_SUNO_API_URL está configurado → devuelve esa URL directamente
 *   2. Si no → llama a SUNO_VPS_URL/api/tunnel-url para obtener la URL del tunnel actual
 *   3. Si ambos fallan → devuelve error 503
 */
export async function GET() {
  // 1. Si hay una URL estática configurada, usarla directamente
  const staticUrl = process.env.NEXT_PUBLIC_SUNO_API_URL
  if (staticUrl) {
    return NextResponse.json({ tunnel_url: staticUrl, source: 'env' })
  }

  // 2. Intentar auto-descubrir desde el VPS via server-side fetch
  const vpsUrl = process.env.SUNO_VPS_URL || 'http://168.231.101.139:8080'

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 5000) // 5s timeout

    const res = await fetch(`${vpsUrl}/api/tunnel-url`, {
      signal: controller.signal,
      cache: 'no-store',
    })
    clearTimeout(timeout)

    if (res.ok) {
      const data = await res.json()
      if (data.tunnel_url && data.available) {
        return NextResponse.json({
          tunnel_url: data.tunnel_url,
          source: 'auto-discovered',
        })
      }
    }
  } catch (err) {
    console.error('[bot-url] No se pudo contactar el VPS:', err)
  }

  // 3. Fallback: devolver error claro
  return NextResponse.json(
    {
      tunnel_url: null,
      available: false,
      error:
        'No se pudo contactar el servidor. Configura NEXT_PUBLIC_SUNO_API_URL en Vercel o reinicia el VPS con start.sh',
    },
    { status: 503 }
  )
}
