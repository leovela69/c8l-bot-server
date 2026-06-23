/**
 * C8L Bot v2.0 — Sistema de Vigilancia Inteligente
 * Detecta spam, flood, multicuentas, comportamiento sospechoso
 * Reporta automáticamente al Control Center
 */

import { addReport, generateId, getUsers } from '../controlCenter/store'
import { addBloqueo, calcularFechaFin, NORMAS } from '../controlCenter/normas'

// === CONFIGURACIÓN ===
const CONFIG = {
  // Flood: máximo X mensajes en Y segundos
  floodMaxMessages: 5,
  floodWindowSeconds: 10,

  // Spam: mensajes repetidos
  spamRepeatThreshold: 3, // mismo mensaje 3 veces = spam

  // Rate limit: máximo mensajes por minuto
  rateLimitPerMinute: 20,

  // Longitud sospechosa
  suspiciousLongMessage: 2000, // +2000 chars = posible copypaste spam

  // Multicuenta: misma IP/fingerprint en poco tiempo
  multiAccountWindowMinutes: 5,
}

// === TIPOS ===
interface UserActivity {
  username: string
  messages: { content: string; timestamp: number }[]
  warnings: number
  lastWarningTime: number
  fingerprint: string // sessionStorage ID para detectar multicuenta
  sectionsVisited: string[]
  firstSeenAt: number
}

interface VigilanceResult {
  allowed: boolean
  reason?: string
  severity?: 'low' | 'medium' | 'high' | 'critical'
  action?: 'warn' | 'mute' | 'block' | 'none'
  reportMessage?: string
}

// === STORAGE ===
const STORAGE_KEY = 'c8l_vigilancia'

function getActivityMap(): Record<string, UserActivity> {
  if (typeof window === 'undefined') return {}
  const data = localStorage.getItem(STORAGE_KEY)
  return data ? JSON.parse(data) : {}
}

function saveActivityMap(map: Record<string, UserActivity>): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map))
}

function getUserActivity(username: string): UserActivity {
  const map = getActivityMap()
  if (!map[username]) {
    map[username] = {
      username,
      messages: [],
      warnings: 0,
      lastWarningTime: 0,
      fingerprint: getFingerprint(),
      sectionsVisited: [],
      firstSeenAt: Date.now(),
    }
    saveActivityMap(map)
  }
  return map[username]
}

function updateUserActivity(username: string, activity: UserActivity): void {
  const map = getActivityMap()
  map[username] = activity
  saveActivityMap(map)
}

function getFingerprint(): string {
  if (typeof window === 'undefined') return 'server'
  let fp = sessionStorage.getItem('c8l_fp')
  if (!fp) {
    fp = generateId() + '_' + navigator.userAgent.slice(0, 20)
    sessionStorage.setItem('c8l_fp', fp)
  }
  return fp
}

// === CHECKS ===

/**
 * CHECK 1: Flood — demasiados mensajes en poco tiempo
 */
function checkFlood(activity: UserActivity): VigilanceResult | null {
  const now = Date.now()
  const recentMessages = activity.messages.filter(
    m => (now - m.timestamp) < CONFIG.floodWindowSeconds * 1000
  )

  if (recentMessages.length >= CONFIG.floodMaxMessages) {
    return {
      allowed: false,
      reason: `Flood detectado: ${recentMessages.length} mensajes en ${CONFIG.floodWindowSeconds}s`,
      severity: 'medium',
      action: 'mute',
      reportMessage: `🚨 FLOOD: @${activity.username} envió ${recentMessages.length} mensajes en ${CONFIG.floodWindowSeconds}s`
    }
  }
  return null
}

/**
 * CHECK 2: Spam — mismo mensaje repetido
 */
function checkSpam(activity: UserActivity, newMessage: string): VigilanceResult | null {
  const recentSameMessages = activity.messages
    .slice(-10)
    .filter(m => m.content.toLowerCase() === newMessage.toLowerCase())

  if (recentSameMessages.length >= CONFIG.spamRepeatThreshold) {
    return {
      allowed: false,
      reason: `Spam detectado: mensaje repetido ${recentSameMessages.length + 1} veces`,
      severity: 'medium',
      action: 'warn',
      reportMessage: `🚨 SPAM: @${activity.username} repitió "${newMessage.slice(0, 50)}" ${recentSameMessages.length + 1} veces`
    }
  }
  return null
}

/**
 * CHECK 3: Rate Limit — demasiados mensajes por minuto
 */
function checkRateLimit(activity: UserActivity): VigilanceResult | null {
  const oneMinuteAgo = Date.now() - 60000
  const messagesLastMinute = activity.messages.filter(m => m.timestamp > oneMinuteAgo)

  if (messagesLastMinute.length >= CONFIG.rateLimitPerMinute) {
    return {
      allowed: false,
      reason: `Rate limit: ${messagesLastMinute.length} mensajes/minuto (max: ${CONFIG.rateLimitPerMinute})`,
      severity: 'high',
      action: 'mute',
      reportMessage: `🚨 RATE LIMIT: @${activity.username} superó ${CONFIG.rateLimitPerMinute} msg/min (tiene ${messagesLastMinute.length})`
    }
  }
  return null
}

/**
 * CHECK 4: Mensaje sospechosamente largo (copypaste spam)
 */
function checkSuspiciousLength(message: string, username: string): VigilanceResult | null {
  if (message.length > CONFIG.suspiciousLongMessage) {
    return {
      allowed: false,
      reason: `Mensaje demasiado largo (${message.length} chars)`,
      severity: 'low',
      action: 'warn',
      reportMessage: `⚠️ MSG LARGO: @${username} envió mensaje de ${message.length} caracteres (posible copypaste)`
    }
  }
  return null
}

/**
 * CHECK 5: Multicuenta — mismo fingerprint, diferente username
 */
function checkMultiAccount(username: string): VigilanceResult | null {
  const map = getActivityMap()
  const currentFp = getFingerprint()

  const sameFingerprint = Object.values(map).filter(
    a => a.fingerprint === currentFp && a.username !== username
  )

  if (sameFingerprint.length > 0) {
    const otherAccounts = sameFingerprint.map(a => `@${a.username}`).join(', ')
    return {
      allowed: true, // Permitir pero reportar
      reason: `Posible multicuenta detectada`,
      severity: 'high',
      action: 'none',
      reportMessage: `🚨 MULTICUENTA: @${username} comparte dispositivo con ${otherAccounts}`
    }
  }
  return null
}

/**
 * CHECK 6: Patrones de contenido peligroso
 */
function checkDangerousContent(message: string, username: string): VigilanceResult | null {
  const lower = message.toLowerCase()

  // Links externos sospechosos
  const hasExternalLink = /(https?:\/\/(?!gen-lang-client|c8l|localhost)[^\s]+)/i.test(message)
  if (hasExternalLink) {
    return {
      allowed: true, // Permitir pero reportar
      reason: 'Enlace externo detectado',
      severity: 'low',
      action: 'none',
      reportMessage: `⚠️ LINK EXTERNO: @${username} compartió un enlace externo: "${message.slice(0, 100)}"`
    }
  }

  // Intentos de inyección / XSS
  if (/<script|javascript:|onerror|onclick|eval\(/i.test(message)) {
    return {
      allowed: false,
      reason: 'Intento de inyección de código detectado',
      severity: 'critical',
      action: 'block',
      reportMessage: `🔴 ATAQUE: @${username} intentó inyectar código: "${message.slice(0, 80)}"`
    }
  }

  // Phishing patterns
  if (/contraseña|password|tarjeta|bank|paypal|clave.*secreta/i.test(lower) &&
      /envia|mandame|comparte|dame/i.test(lower)) {
    return {
      allowed: false,
      reason: 'Posible intento de phishing',
      severity: 'high',
      action: 'block',
      reportMessage: `🔴 PHISHING: @${username} posible intento de phishing: "${message.slice(0, 100)}"`
    }
  }

  return null
}

// === API PÚBLICA ===

/**
 * Analiza un mensaje antes de procesarlo
 * Retorna si está permitido y qué acción tomar
 */
export function analyzeMessage(message: string, username: string, section: string): VigilanceResult {
  const activity = getUserActivity(username)

  // Ejecutar todos los checks en orden de severidad
  const checks = [
    checkDangerousContent(message, username),
    checkRateLimit(activity),
    checkFlood(activity),
    checkSpam(activity, message),
    checkSuspiciousLength(message, username),
    checkMultiAccount(username),
  ]

  // Registrar el mensaje en el historial
  activity.messages.push({ content: message, timestamp: Date.now() })
  // Mantener solo los últimos 50 mensajes
  if (activity.messages.length > 50) activity.messages = activity.messages.slice(-50)
  // Registrar sección
  if (!activity.sectionsVisited.includes(section)) {
    activity.sectionsVisited.push(section)
  }
  updateUserActivity(username, activity)

  // Evaluar resultados
  for (const result of checks) {
    if (result && !result.allowed) {
      // Acción según severidad
      handleViolation(username, result, activity)
      return result
    }
    if (result && result.allowed && result.reportMessage) {
      // Solo reportar, no bloquear
      addReport({
        id: generateId(),
        type: 'warning',
        severity: result.severity || 'low',
        message: result.reportMessage,
        userId: username,
        username,
        section,
        timestamp: new Date().toISOString(),
        resolved: false,
      })
    }
  }

  return { allowed: true }
}

/**
 * Maneja una violación detectada
 */
function handleViolation(username: string, result: VigilanceResult, activity: UserActivity): void {
  // Incrementar warnings
  activity.warnings += 1
  activity.lastWarningTime = Date.now()
  updateUserActivity(username, activity)

  // Reportar al Control Center
  addReport({
    id: generateId(),
    type: 'infraction',
    severity: result.severity || 'medium',
    message: result.reportMessage || result.reason || 'Violación detectada',
    userId: username,
    username,
    section: 'Vigilancia',
    timestamp: new Date().toISOString(),
    resolved: false,
  })

  // Auto-bloqueo si acumula 3+ warnings
  if (activity.warnings >= 3 && result.action === 'block') {
    addBloqueo({
      id: generateId(),
      userId: username,
      username,
      nivel: 'leve',
      normaViolada: 2, // Sin spam
      motivo: `Auto-bloqueo: ${activity.warnings} infracciones acumuladas. Última: ${result.reason}`,
      fechaInicio: new Date().toISOString(),
      fechaFin: calcularFechaFin('leve'),
      activo: true,
      ejecutadoPor: 'bot',
    })

    addReport({
      id: generateId(),
      type: 'system',
      severity: 'high',
      message: `🔒 AUTO-BLOQUEO: @${username} bloqueado 3 días por ${activity.warnings} infracciones`,
      userId: username,
      username,
      section: 'Vigilancia',
      timestamp: new Date().toISOString(),
      resolved: false,
    })
  }
}

/**
 * Obtiene estadísticas de vigilancia para el Control Center
 */
export function getVigilanceStats(): {
  totalMonitored: number
  totalWarnings: number
  suspiciousUsers: string[]
  multiAccountAlerts: number
} {
  const map = getActivityMap()
  const users = Object.values(map)

  return {
    totalMonitored: users.length,
    totalWarnings: users.reduce((sum, u) => sum + u.warnings, 0),
    suspiciousUsers: users.filter(u => u.warnings >= 2).map(u => u.username),
    multiAccountAlerts: 0, // Calculated on demand
  }
}

/**
 * Genera mensaje de advertencia para el usuario
 */
export function getWarningMessage(result: VigilanceResult): string {
  switch (result.action) {
    case 'block':
      return '🚫 **BLOQUEADO** — Tu cuenta ha sido suspendida por comportamiento peligroso. Si crees que es un error, contacta a moderación.'
    case 'mute':
      return '🔇 **SILENCIADO** — Estás enviando mensajes demasiado rápido. Espera unos segundos antes de escribir de nuevo.'
    case 'warn':
      return `⚠️ **AVISO** — ${result.reason}. Recuerda las normas de la comunidad. Acumular avisos puede resultar en bloqueo.`
    default:
      return '⚠️ Comportamiento detectado. Por favor, respeta las normas de la comunidad.'
  }
}
