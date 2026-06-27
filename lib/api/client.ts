/**
 * C8L API Client — Conexion Frontend ↔ Backend
 * 
 * Conecta la web (Vercel) con el bot server (Render.com)
 * Maneja auto-discovery de URL y fallbacks
 */

// URL del backend - se configura en Vercel Environment Variables
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://c8l-bot-server.onrender.com'

interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
}

/**
 * Fetch wrapper con manejo de errores y retry
 */
async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${endpoint}`

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    if (!response.ok) {
      return {
        success: false,
        error: `Error ${response.status}: ${response.statusText}`,
      }
    }

    const data = await response.json()
    return { success: true, data }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error de conexion',
    }
  }
}

// ============ ENDPOINTS PUBLICOS ============

/** Verificar que el backend esta online */
export async function checkHealth() {
  return apiCall<{ status: string; version: string }>('/')
}

/** Generar musica via Suno */
export async function generateMusic(params: {
  prompt: string
  style?: string
  voice?: string
}) {
  return apiCall<{ task_id: string; status: string }>('/api/suno/generate', {
    method: 'POST',
    body: JSON.stringify(params),
  })
}

/** Obtener feed de canciones */
export async function getMusicFeed() {
  return apiCall<{ songs: Array<{ id: string; title: string; url: string }> }>('/api/suno/feed')
}

/** Obtener creditos Suno */
export async function getSunoCredits() {
  return apiCall<{ credits: number; total: number }>('/api/suno/credits')
}

/** Generar imagen */
export async function generateImage(prompt: string, model?: string) {
  return apiCall<{ url: string }>('/api/image/generate', {
    method: 'POST',
    body: JSON.stringify({ prompt, model: model || 'flux' }),
  })
}

/** Generar video */
export async function generateVideo(prompt: string, model?: string, duration?: number) {
  return apiCall<{ url: string; task_id: string }>('/api/video/generate', {
    method: 'POST',
    body: JSON.stringify({ prompt, model: model || 'wan-fast', duration: duration || 5 }),
  })
}

/** Chat con el bot IA */
export async function chatWithBot(message: string, userId?: string) {
  return apiCall<{ reply: string; agent: string }>('/api/chat', {
    method: 'POST',
    body: JSON.stringify({ message, user_id: userId }),
  })
}

/** Obtener estado del sistema */
export async function getSystemStatus() {
  return apiCall<{
    bots_active: number
    uptime: string
    version: string
    services: Record<string, boolean>
  }>('/api/status')
}

export { API_BASE_URL }
export default apiCall
