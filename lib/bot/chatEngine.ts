/**
 * C8L Bot v2.0 — Motor de Chat Principal
 * Integra: Comandos + Misiones + Vigilancia + Memoria + IA
 * Flujo: Vigilancia → Comandos → Misiones → Memoria → IA
 */

import { OPENROUTER_CONFIG } from '../firebase/config'
import { addReport, generateId, addMessage } from '../controlCenter/store'
import { processCommand, CommandResult } from './commands'
import { formatMissionsMessage, trackProgress } from './missions'
import { analyzeMessage, getWarningMessage } from './vigilancia'
import { updateMemory, getPersonalContext, getMemorySummary } from './memory'
import { grantXP, registerDailyLogin, formatLevelProfile, formatRankingMessage } from './levels'

const SYSTEM_PROMPT = `Eres el Bot Oficial de C8L Agency — "Corazones Locos Family".
Tu personalidad: filósofo moderno, cercano, con humor inteligente. Hablas en español.
Eres breve pero con sustancia. Máximo 3-4 frases por respuesta.

TU ROL:
- Asistente oficial de la plataforma C8L Agency
- Policía de normas de la comunidad
- Guía de los usuarios por la web
- Informador al Control Center de cada acción

SECCIONES DE LA WEB:
- Casino Quantum: Slots, Ruleta, Blackjack (coins virtuales, RTP certificado)
- Estudio Musical: Creación de música con IA (Bolero-House es el género estrella)
- Karaoke: Cantar con medidores de tono y energía
- Lives: Streaming en directo con regalos
- Bandos: Familias/clanes con guerras y ranking
- C8L TV: 8 videos de contenido (música, tutoriales, gaming)
- Monedero: Wallet con C8L Coins, Diamantes y BID
- Control Center: Panel admin (solo staff)

COMANDOS QUE EL USUARIO PUEDE USAR:
casino, estudio, karaoke, tv, bandos, lives, monedero, perfil, misión, ranking, ayuda, normas

Si el usuario no usa un comando, conversa normalmente con personalidad filosófica.
Nunca reveles que eres una IA o un modelo de lenguaje. Eres "El Bot de C8L".`

export interface ChatResponse {
  message: string
  action?: 'navigate' | 'mission' | 'profile' | 'ranking' | 'help' | 'admin' | 'none'
  navigateTo?: string
  moderation?: {
    flagged: boolean
    reason?: string
    severity?: 'low' | 'medium' | 'high'
  }
}

/**
 * Punto de entrada principal — procesa un mensaje del usuario
 */
export async function sendChatMessage(
  userMessage: string,
  username: string,
  section: string,
  history: { role: string; content: string }[] = []
): Promise<ChatResponse> {

  // ═══════════════════════════════════════
  // PASO 1: VIGILANCIA — ¿Está permitido?
  // ═══════════════════════════════════════
  const vigilanceResult = analyzeMessage(userMessage, username, section)

  if (!vigilanceResult.allowed) {
    const warningMsg = getWarningMessage(vigilanceResult)
    return {
      message: warningMsg,
      moderation: {
        flagged: true,
        reason: vigilanceResult.reason,
        severity: vigilanceResult.severity as 'low' | 'medium' | 'high'
      }
    }
  }

  // ═══════════════════════════════════════
  // PASO 2: COMANDOS — ¿Es un comando directo?
  // ═══════════════════════════════════════
  const commandResult = processCommand(userMessage, username)

  if (commandResult) {
    // Si pidió misiones, generar el listado
    if (commandResult.action === 'mission') {
      const missionsMsg = formatMissionsMessage(username)
      grantXP(username, 'use_command')
      return {
        message: missionsMsg,
        action: 'mission',
      }
    }

    // Si pidió ranking, generar con XP real
    if (commandResult.action === 'ranking') {
      const rankingMsg = formatRankingMessage()
      grantXP(username, 'use_command')
      return {
        message: rankingMsg,
        action: 'ranking',
      }
    }

    // Si pidió su nivel/XP
    if (commandResult.action === 'profile') {
      const levelProfile = formatLevelProfile(username)
      grantXP(username, 'use_command')
      return {
        message: levelProfile,
        action: 'profile',
      }
    }

    // Si pidió perfil, incluir nivel
    if (commandResult.action === 'navigate' && commandResult.navigateTo === '/registro') {
      const levelProfile = formatLevelProfile(username)
      grantXP(username, 'use_command')
      return {
        message: `👤 Tu perfil, @${username}:\n\n${levelProfile}\n\n👉 Te llevo a tu cuenta...`,
        action: 'navigate',
        navigateTo: '/registro',
      }
    }

    // Track progress en misiones por visitar secciones
    if (commandResult.navigateTo) {
      trackProgress(username, commandResult.navigateTo.replace('/', '') || 'home')
      grantXP(username, 'visit_section')
    }

    // XP por usar comando
    grantXP(username, 'use_command')

    // Actualizar memoria
    updateMemory(username, userMessage, section)

    return {
      message: commandResult.message,
      action: commandResult.action,
      navigateTo: commandResult.navigateTo,
    }
  }

  // ═══════════════════════════════════════
  // PASO 3: MEMORIA — Actualizar y obtener contexto
  // ═══════════════════════════════════════
  updateMemory(username, userMessage, section)
  trackProgress(username, section.toLowerCase())
  const personalContext = getPersonalContext(username)

  // XP por enviar mensaje + login diario
  const xpResult = grantXP(username, 'send_message')
  const loginResult = registerDailyLogin(username)

  // ═══════════════════════════════════════
  // PASO 4: IA — Respuesta inteligente con contexto
  // ═══════════════════════════════════════
  try {
    const messages = [
      { role: 'system', content: SYSTEM_PROMPT + `\n\nCONTEXTO DEL USUARIO: ${personalContext}` },
      ...history.slice(-10),
      { role: 'user', content: `[${username} en ${section}]: ${userMessage}` }
    ]

    const response = await fetch(`${OPENROUTER_CONFIG.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENROUTER_CONFIG.apiKey}`,
        'HTTP-Referer': 'https://gen-lang-client-0744582882.web.app',
        'X-Title': 'C8L Agency Bot v2',
      },
      body: JSON.stringify({
        model: OPENROUTER_CONFIG.model,
        messages,
        max_tokens: 300,
        temperature: 0.85,
      })
    })

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`)
    }

    const data = await response.json()
    let botMessage = data.choices?.[0]?.message?.content || ''

    // Limpiar respuesta (quitar thinking tags si Qwen los mete)
    botMessage = botMessage.replace(/<think>[\s\S]*?<\/think>/g, '').trim()

    if (!botMessage) {
      botMessage = '🤖 Hmm, dame un segundo...'
    }

    // Append level up message if happened
    if (xpResult.leveledUp && xpResult.message) {
      botMessage += xpResult.message
    }
    // Append daily login if first time today
    if (loginResult.bonusXP > 0) {
      botMessage += `\n\n${loginResult.message}`
    }

    return {
      message: botMessage,
      action: 'none',
    }
  } catch (error) {
    console.error('Chat engine error:', error)
    // Fallback inteligente basado en sección
    const fallback = getFallbackResponse(section, username)
    return {
      message: fallback,
      action: 'none',
    }
  }
}

/**
 * Respuestas fallback inteligentes si la API falla
 */
function getFallbackResponse(section: string, username: string): string {
  const fallbacks: Record<string, string[]> = {
    'Casino': [
      '🎰 La suerte es cuestión de perspectiva. ¿Quieres probar en Slots, Ruleta o Blackjack?',
      '🎰 El casino te espera. Recuerda: juega con cabeza, no con el corazón.',
    ],
    'Estudio': [
      '🎵 La música es el lenguaje del alma. ¿Qué quieres crear hoy?',
      '🎵 Bolero-House, Jazz, Rock... cada género cuenta una historia diferente.',
    ],
    'C8L TV': [
      '📺 8 videos esperándote. Navega con ⏮ ⏭ o elige uno del grid.',
      '📺 Contenido fresco cada día. ¿Qué te apetece ver?',
    ],
    'Home': [
      `🤖 Bienvenido a C8L, @${username}. Un universo de entretenimiento te espera. Escribe "ayuda" para ver qué puedo hacer.`,
      '🤖 C8L Agency — donde la música, el juego y la comunidad se encuentran.',
    ],
  }

  const options = fallbacks[section] || fallbacks['Home']
  return options[Math.floor(Math.random() * options.length)]
}
