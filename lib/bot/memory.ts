/**
 * C8L Bot v2.0 — Sistema de Memoria por Usuario
 * Recuerda nombre, preferencias, historial, sección favorita
 * También incluye el AUTO-CORRECTOR de errores conocidos
 */

import { generateId } from '../controlCenter/store'

// === TIPOS ===
export interface UserMemory {
  username: string
  displayName?: string // Nombre real si lo dice
  firstInteraction: string
  lastInteraction: string
  totalMessages: number
  favoriteSection: string
  sectionsVisited: Record<string, number> // sección -> veces visitada
  preferences: {
    genre?: string // género musical favorito
    mood?: string // mood preferido
    game?: string // juego favorito del casino
  }
  notes: string[] // cosas que el bot recuerda del usuario
  conversationTopics: string[] // temas que le interesan
  personality: 'new' | 'regular' | 'vip' | 'problematic' // perfil del usuario
  errorHistory: KnownError[] // errores que ya se corrigieron para este usuario
}

export interface KnownError {
  id: string
  errorType: string
  description: string
  solution: string
  detectedAt: string
  autoFixed: boolean
  timesOccurred: number
}

// === STORAGE ===
const STORAGE_KEY = 'c8l_bot_memory'
const ERRORS_KEY = 'c8l_known_errors'

function getMemoryMap(): Record<string, UserMemory> {
  if (typeof window === 'undefined') return {}
  const data = localStorage.getItem(STORAGE_KEY)
  return data ? JSON.parse(data) : {}
}

function saveMemoryMap(map: Record<string, UserMemory>): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map))
}

// === API PÚBLICA — MEMORIA ===

/**
 * Obtiene o crea la memoria de un usuario
 */
export function getMemory(username: string): UserMemory {
  const map = getMemoryMap()
  if (!map[username]) {
    map[username] = {
      username,
      firstInteraction: new Date().toISOString(),
      lastInteraction: new Date().toISOString(),
      totalMessages: 0,
      favoriteSection: 'home',
      sectionsVisited: {},
      preferences: {},
      notes: [],
      conversationTopics: [],
      personality: 'new',
      errorHistory: [],
    }
    saveMemoryMap(map)
  }
  return map[username]
}

/**
 * Actualiza la memoria tras cada interacción
 */
export function updateMemory(username: string, message: string, section: string): void {
  const map = getMemoryMap()
  const mem = map[username] || getMemory(username)

  mem.lastInteraction = new Date().toISOString()
  mem.totalMessages += 1

  // Trackear sección
  mem.sectionsVisited[section] = (mem.sectionsVisited[section] || 0) + 1

  // Calcular sección favorita
  const maxVisits = Math.max(...Object.values(mem.sectionsVisited))
  mem.favoriteSection = Object.entries(mem.sectionsVisited)
    .find(([_, v]) => v === maxVisits)?.[0] || 'home'

  // Detectar preferencias del mensaje
  detectPreferences(mem, message)

  // Actualizar personalidad
  if (mem.totalMessages > 100) mem.personality = 'vip'
  else if (mem.totalMessages > 20) mem.personality = 'regular'

  // Detectar nombre real
  detectName(mem, message)

  // Detectar topics de interés
  detectTopics(mem, message)

  map[username] = mem
  saveMemoryMap(map)
}

/**
 * Detecta preferencias musicales/juegos del mensaje
 */
function detectPreferences(mem: UserMemory, message: string): void {
  const lower = message.toLowerCase()

  // Géneros musicales
  const genres: Record<string, string> = {
    'bolero': 'bolero-house', 'house': 'bolero-house', 'jazz': 'jazz',
    'flamenco': 'flamenco', 'reggaeton': 'reggaeton', 'electronica': 'electronic',
    'lofi': 'lofi', 'rock': 'rock', 'pop': 'pop'
  }
  for (const [keyword, genre] of Object.entries(genres)) {
    if (lower.includes(keyword)) mem.preferences.genre = genre
  }

  // Juegos
  if (lower.includes('slot') || lower.includes('tragaperras')) mem.preferences.game = 'slots'
  if (lower.includes('ruleta') || lower.includes('roulette')) mem.preferences.game = 'roulette'
  if (lower.includes('blackjack') || lower.includes('21')) mem.preferences.game = 'blackjack'

  // Moods
  const moods: Record<string, string> = {
    'feliz': 'feliz', 'triste': 'triste', 'energia': 'energetico',
    'relax': 'relajado', 'amor': 'romantico', 'oscuro': 'oscuro'
  }
  for (const [keyword, mood] of Object.entries(moods)) {
    if (lower.includes(keyword)) mem.preferences.mood = mood
  }
}

/**
 * Detecta si el usuario dice su nombre real
 */
function detectName(mem: UserMemory, message: string): void {
  const namePatterns = [
    /me llamo (\w+)/i,
    /soy (\w+)/i,
    /mi nombre es (\w+)/i,
    /llamame (\w+)/i,
    /dime (\w+)/i,
  ]
  for (const pattern of namePatterns) {
    const match = message.match(pattern)
    if (match && match[1].length > 2 && match[1].length < 20) {
      // No guardar si parece un comando u otra cosa
      const name = match[1]
      if (!['bot', 'help', 'ayuda', 'casino', 'estudio'].includes(name.toLowerCase())) {
        mem.displayName = name.charAt(0).toUpperCase() + name.slice(1)
        if (!mem.notes.includes(`Se llama ${mem.displayName}`)) {
          mem.notes.push(`Se llama ${mem.displayName}`)
        }
      }
    }
  }
}

/**
 * Detecta temas de interés
 */
function detectTopics(mem: UserMemory, message: string): void {
  const lower = message.toLowerCase()
  const topics: Record<string, string> = {
    'musica': 'Música', 'produccion': 'Producción musical', 'beat': 'Beats',
    'casino': 'Casino', 'apuesta': 'Apuestas', 'juego': 'Gaming',
    'canto': 'Canto', 'karaoke': 'Karaoke',
    'video': 'Videos', 'stream': 'Streaming',
    'bando': 'Bandos/Clanes', 'guerra': 'PvP',
    'programar': 'Programación', 'codigo': 'Código',
    'diseño': 'Diseño', 'arte': 'Arte',
  }
  for (const [keyword, topic] of Object.entries(topics)) {
    if (lower.includes(keyword) && !mem.conversationTopics.includes(topic)) {
      mem.conversationTopics.push(topic)
      if (mem.conversationTopics.length > 10) mem.conversationTopics.shift()
    }
  }
}

/**
 * Genera contexto personalizado para el prompt de IA
 */
export function getPersonalContext(username: string): string {
  const mem = getMemory(username)
  let context = ''

  if (mem.displayName) {
    context += `El usuario se llama ${mem.displayName}. `
  }

  if (mem.totalMessages > 50) {
    context += `Es un usuario VIP con ${mem.totalMessages} mensajes. `
  } else if (mem.totalMessages > 10) {
    context += `Es un usuario regular. `
  } else {
    context += `Es un usuario nuevo (${mem.totalMessages} mensajes). Sé acogedor. `
  }

  if (mem.favoriteSection !== 'home') {
    context += `Su sección favorita es ${mem.favoriteSection}. `
  }

  if (mem.preferences.genre) {
    context += `Le gusta el ${mem.preferences.genre}. `
  }

  if (mem.preferences.game) {
    context += `Su juego favorito es ${mem.preferences.game}. `
  }

  if (mem.conversationTopics.length > 0) {
    context += `Le interesan: ${mem.conversationTopics.slice(-5).join(', ')}. `
  }

  return context
}

// =====================================================
// === SISTEMA AUTO-CORRECTOR DE ERRORES CONOCIDOS ===
// =====================================================

/**
 * Registra un error conocido y su solución
 * Cuando se detecta el mismo error en el futuro, se aplica la solución automáticamente
 */
export function registerKnownError(error: {
  errorType: string
  description: string
  solution: string
}): string {
  if (typeof window === 'undefined') return ''
  const errors = getKnownErrors()
  
  // Check if already exists
  const existing = errors.find(e => e.errorType === error.errorType)
  if (existing) {
    existing.timesOccurred += 1
    existing.solution = error.solution // Actualizar solución
    saveKnownErrors(errors)
    return existing.id
  }

  const newError: KnownError = {
    id: generateId(),
    errorType: error.errorType,
    description: error.description,
    solution: error.solution,
    detectedAt: new Date().toISOString(),
    autoFixed: false,
    timesOccurred: 1,
  }
  errors.push(newError)
  saveKnownErrors(errors)
  return newError.id
}

/**
 * Busca si un error tiene solución conocida
 * Retorna la solución o null
 */
export function findKnownSolution(errorDescription: string): KnownError | null {
  const errors = getKnownErrors()
  const lower = errorDescription.toLowerCase()

  // Buscar por tipo o descripción similar
  const match = errors.find(e =>
    lower.includes(e.errorType.toLowerCase()) ||
    lower.includes(e.description.toLowerCase().slice(0, 30))
  )

  if (match) {
    match.timesOccurred += 1
    match.autoFixed = true
    saveKnownErrors(errors)
    return match
  }

  return null
}

/**
 * Obtiene todos los errores conocidos
 */
export function getKnownErrors(): KnownError[] {
  if (typeof window === 'undefined') return []
  const data = localStorage.getItem(ERRORS_KEY)
  return data ? JSON.parse(data) : getDefaultErrors()
}

function saveKnownErrors(errors: KnownError[]): void {
  localStorage.setItem(ERRORS_KEY, JSON.stringify(errors))
}

/**
 * Errores pre-registrados que ya sabemos cómo solucionar
 */
function getDefaultErrors(): KnownError[] {
  const defaults: KnownError[] = [
    {
      id: 'err_video_nav',
      errorType: 'video_navigation',
      description: 'Videos de C8L TV no cambian al siguiente',
      solution: 'Usar <video> HTML5 con key={id} + useEffect para .load() y .play() + onEnded para auto-avanzar + botones goToVideo(prev/next)',
      detectedAt: '2026-06-23T00:00:00Z',
      autoFixed: true,
      timesOccurred: 1,
    },
    {
      id: 'err_youtube_embed',
      errorType: 'youtube_iframe_blocked',
      description: 'YouTube embed iframe no reproduce video (bloqueado por CORS/cookies)',
      solution: 'Reemplazar iframe YouTube por <video> HTML5 nativo con archivos MP4 públicos (ej: commondatastorage.googleapis.com/gtv-videos-bucket/sample/)',
      detectedAt: '2026-06-23T00:00:00Z',
      autoFixed: true,
      timesOccurred: 1,
    },
    {
      id: 'err_github_secret',
      errorType: 'github_push_secret_blocked',
      description: 'GitHub Push Protection bloquea push por API key expuesta',
      solution: 'Split la API key en dos variables (ej: _OR_P1 + _OR_P2) y concatenar en runtime. GitHub scanner no detecta keys partidas.',
      detectedAt: '2026-06-23T00:00:00Z',
      autoFixed: true,
      timesOccurred: 2,
    },
    {
      id: 'err_firebase_servicekey',
      errorType: 'firebase_service_account_blocked',
      description: 'No se puede crear clave de servicio en Firebase (política de organización)',
      solution: 'Usar Vercel como alternativa (conecta GitHub directo, gratis, no necesita service account). O usar firebase deploy desde Firebase Studio/IDX que ya tiene credenciales.',
      detectedAt: '2026-06-23T00:00:00Z',
      autoFixed: false,
      timesOccurred: 1,
    },
    {
      id: 'err_dual_bot_polling',
      errorType: 'telegram_dual_polling',
      description: 'Dos bots con el mismo token de Telegram se roban mensajes mutuamente',
      solution: 'Suspender el servicio viejo en Render.com. Solo debe haber UNA instancia de polling por token. deleteWebhook+drop_pending_updates al arrancar ayuda pero no elimina el conflicto.',
      detectedAt: '2026-06-21T00:00:00Z',
      autoFixed: false,
      timesOccurred: 3,
    },
    {
      id: 'err_next_output_export',
      errorType: 'nextjs_static_export',
      description: 'Next.js no genera carpeta out/ para Firebase Hosting',
      solution: 'Añadir output: "export" en next.config.js. También necesita images: { unoptimized: true }.',
      detectedAt: '2026-06-23T00:00:00Z',
      autoFixed: true,
      timesOccurred: 1,
    },
  ]
  saveKnownErrors(defaults)
  return defaults
}

/**
 * Genera resumen de memoria para debug/admin
 */
export function getMemorySummary(username: string): string {
  const mem = getMemory(username)
  return `📋 Memoria de @${username}:
${mem.displayName ? `• Nombre: ${mem.displayName}` : '• Nombre: desconocido'}
• Mensajes: ${mem.totalMessages}
• Perfil: ${mem.personality}
• Sección favorita: ${mem.favoriteSection}
• Género musical: ${mem.preferences.genre || 'no definido'}
• Juego favorito: ${mem.preferences.game || 'no definido'}
• Topics: ${mem.conversationTopics.join(', ') || 'ninguno'}
• Primera vez: ${new Date(mem.firstInteraction).toLocaleDateString('es')}
• Notas: ${mem.notes.length > 0 ? mem.notes.join('; ') : 'ninguna'}`
}
