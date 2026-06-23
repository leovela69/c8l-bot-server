/**
 * C8L Bot Chat Engine — Connects to OpenRouter API
 * Handles web chat with Gemini-style responses
 * Also acts as police/moderator for the community
 */

import { OPENROUTER_CONFIG } from '../firebase/config'
import { addReport, generateId } from '../controlCenter/store'

const SYSTEM_PROMPT = `Eres el Bot Oficial de C8L Agency — "Corazones Locos Family".
Tu personalidad: filosófo moderno, cercano, con humor inteligente. Hablas en español.

TU ROL:
- Asistente oficial de la plataforma C8L Agency
- Policía de normas de la comunidad
- Vigilante de comportamiento
- Informador al Control Center

NORMAS DE LA COMUNIDAD QUE VIGILAS:
1. No insultos ni odio
2. No spam ni publicidad externa
3. No contenido +18 sin verificación
4. Respeto entre usuarios
5. No trampas en casino
6. No suplantación de identidad
7. No compartir datos personales de otros

SECCIONES DE LA WEB:
- Casino Quantum: Slots, Ruleta, Blackjack (coins virtuales)
- Estudio Musical: Creación de música con IA
- Karaoke: Cantar con medidores en tiempo real
- Lives: Streaming en directo
- Bandos: Familias/clanes con guerras
- C8L TV: Videos de contenido
- Monedero: Wallet de C8L Coins

Siempre responde con brevedad y estilo. Si detectas comportamiento sospechoso, reporta al Control Center.
Si preguntan por música, recomienda el Estudio. Si preguntan por juegos, manda al Casino.
Firma: 🤖 C8L Bot`

// Words that trigger moderation
const BANNED_WORDS = ['hack', 'trampa', 'cheat', 'exploit', 'piratear', 'robar']
const WARNING_WORDS = ['puta', 'mierda', 'joder', 'cabron', 'gilipollas', 'idiota', 'imbecil']

export interface ChatResponse {
  message: string
  moderation?: {
    flagged: boolean
    reason?: string
    severity?: 'low' | 'medium' | 'high'
  }
}

export async function sendChatMessage(
  userMessage: string,
  username: string,
  section: string,
  history: { role: string; content: string }[] = []
): Promise<ChatResponse> {
  // === MODERATION CHECK ===
  const lowerMsg = userMessage.toLowerCase()
  
  // Check for banned content
  const hasBanned = BANNED_WORDS.some(w => lowerMsg.includes(w))
  const hasWarning = WARNING_WORDS.some(w => lowerMsg.includes(w))
  
  if (hasBanned) {
    // Report to Control Center
    addReport({
      id: generateId(),
      type: 'infraction',
      severity: 'high',
      message: `Usuario @${username} intentó contenido prohibido: "${userMessage.slice(0, 100)}"`,
      userId: username,
      username,
      section,
      timestamp: new Date().toISOString(),
      resolved: false,
    })
    return {
      message: '🚫 Ese tipo de contenido no está permitido aquí. Tu mensaje ha sido reportado al equipo de moderación. Recuerda: C8L es una comunidad de respeto.',
      moderation: { flagged: true, reason: 'Contenido prohibido', severity: 'high' }
    }
  }
  
  if (hasWarning) {
    addReport({
      id: generateId(),
      type: 'warning',
      severity: 'medium',
      message: `Lenguaje inapropiado de @${username}: "${userMessage.slice(0, 100)}"`,
      userId: username,
      username,
      section,
      timestamp: new Date().toISOString(),
      resolved: false,
    })
  }

  // === AI RESPONSE ===
  try {
    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...history.slice(-10), // Last 10 messages for context
      { role: 'user', content: `[${username} en ${section}]: ${userMessage}` }
    ]

    const response = await fetch(`${OPENROUTER_CONFIG.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENROUTER_CONFIG.apiKey}`,
        'HTTP-Referer': 'https://gen-lang-client-0744582882.web.app',
        'X-Title': 'C8L Agency Bot',
      },
      body: JSON.stringify({
        model: OPENROUTER_CONFIG.model,
        messages,
        max_tokens: 500,
        temperature: 0.8,
      })
    })

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`)
    }

    const data = await response.json()
    const botMessage = data.choices?.[0]?.message?.content || 'Estoy procesando... intenta de nuevo.'

    // Report the interaction
    addReport({
      id: generateId(),
      type: 'action',
      severity: 'info',
      message: `Chat con @${username} en ${section}: "${userMessage.slice(0, 50)}..."`,
      userId: username,
      username,
      section,
      timestamp: new Date().toISOString(),
      resolved: true,
    })

    return {
      message: botMessage,
      moderation: hasWarning ? { flagged: true, reason: 'Lenguaje inapropiado', severity: 'low' } : undefined
    }
  } catch (error) {
    console.error('Chat engine error:', error)
    // Fallback response
    return {
      message: '🤖 Estoy teniendo un momento de reflexión filosófica... Dame un segundo e intenta de nuevo. Si persiste, el equipo técnico ya fue notificado.',
      moderation: undefined
    }
  }
}
