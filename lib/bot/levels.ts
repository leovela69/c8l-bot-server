/**
 * C8L Bot v2.0 — Sistema de Niveles y XP
 * Gamificación: los usuarios suben de nivel hablando, completando misiones,
 * jugando, creando música. Cada nivel desbloquea algo.
 */

import { generateId, addReport, getUsers, updateUser } from '../controlCenter/store'

// === CONFIGURACIÓN DE NIVELES ===

export interface Level {
  level: number
  name: string
  emoji: string
  xpRequired: number
  color: string
  unlock: string // Qué desbloquea
}

export const LEVELS: Level[] = [
  { level: 1,  name: 'Novato',         emoji: '🌱', xpRequired: 0,     color: 'gray',   unlock: 'Acceso básico a la plataforma' },
  { level: 2,  name: 'Aprendiz',       emoji: '📘', xpRequired: 100,   color: 'blue',   unlock: '+50 coins de bienvenida' },
  { level: 3,  name: 'Explorador',     emoji: '🧭', xpRequired: 300,   color: 'green',  unlock: 'Acceso a misiones medias' },
  { level: 4,  name: 'Artista',        emoji: '🎨', xpRequired: 600,   color: 'purple', unlock: 'Efectos extra en Estudio Musical' },
  { level: 5,  name: 'Guerrero',       emoji: '⚔️', xpRequired: 1000,  color: 'orange', unlock: 'Puede crear un Bando' },
  { level: 6,  name: 'Veterano',       emoji: '🛡️', xpRequired: 1500,  color: 'cyan',   unlock: 'Badge exclusivo + 200 coins' },
  { level: 7,  name: 'Maestro',        emoji: '🎓', xpRequired: 2500,  color: 'gold',   unlock: 'Acceso a misiones difíciles' },
  { level: 8,  name: 'Élite',          emoji: '💎', xpRequired: 4000,  color: 'pink',   unlock: 'Multiplicador x2 en coins del Casino' },
  { level: 9,  name: 'Leyenda',        emoji: '🌟', xpRequired: 6000,  color: 'gold',   unlock: 'Avatar exclusivo + rol especial' },
  { level: 10, name: 'Dios del Panteón', emoji: '👑', xpRequired: 10000, color: 'gold', unlock: 'Acceso al Control Center (solo lectura) + 1000 coins' },
]

// === XP POR ACCIONES ===

export interface XPAction {
  action: string
  xp: number
  description: string
  cooldown?: number // segundos entre ganancias de la misma acción
}

export const XP_ACTIONS: XPAction[] = [
  // Chat
  { action: 'send_message',     xp: 2,   description: 'Enviar un mensaje',          cooldown: 5 },
  { action: 'use_command',      xp: 5,   description: 'Usar un comando del bot',    cooldown: 10 },
  
  // Casino
  { action: 'play_slots',       xp: 8,   description: 'Jugar una partida de Slots',  cooldown: 30 },
  { action: 'play_roulette',    xp: 10,  description: 'Jugar a la Ruleta',           cooldown: 30 },
  { action: 'play_blackjack',   xp: 12,  description: 'Jugar al Blackjack',          cooldown: 30 },
  { action: 'win_jackpot',      xp: 100, description: 'Ganar un Jackpot',            cooldown: 0 },
  
  // Estudio
  { action: 'generate_song',    xp: 25,  description: 'Generar una canción',         cooldown: 60 },
  { action: 'publish_song',     xp: 50,  description: 'Publicar en C8L TV',          cooldown: 300 },
  
  // Karaoke
  { action: 'sing_song',        xp: 20,  description: 'Cantar una canción',          cooldown: 60 },
  { action: 'high_score',       xp: 40,  description: 'Superar tu récord',           cooldown: 0 },
  
  // TV
  { action: 'watch_video',      xp: 5,   description: 'Ver un video',                cooldown: 15 },
  { action: 'watch_all_videos', xp: 50,  description: 'Ver los 8 videos',            cooldown: 3600 },
  
  // Bandos
  { action: 'join_bando',       xp: 30,  description: 'Unirse a un Bando',           cooldown: 0 },
  { action: 'win_war',          xp: 75,  description: 'Ganar una guerra',            cooldown: 0 },
  
  // Misiones
  { action: 'complete_mission', xp: 35,  description: 'Completar una misión',        cooldown: 0 },
  { action: 'claim_reward',     xp: 10,  description: 'Reclamar recompensa',         cooldown: 0 },
  
  // Social
  { action: 'daily_login',      xp: 15,  description: 'Login diario',                cooldown: 86400 },
  { action: 'visit_section',    xp: 3,   description: 'Visitar una sección',         cooldown: 60 },
  
  // Especial
  { action: 'first_message',    xp: 50,  description: 'Primer mensaje (bienvenida)', cooldown: 0 },
  { action: 'report_user',      xp: 20,  description: 'Reportar comportamiento',     cooldown: 300 },
]

// === TIPOS ===

export interface UserXP {
  username: string
  totalXP: number
  level: number
  xpToNextLevel: number
  xpProgress: number // 0-100%
  lastActions: Record<string, number> // action -> timestamp (para cooldown)
  history: { action: string; xp: number; timestamp: string }[]
  streak: number // días consecutivos
  lastLoginDate: string
  achievements: string[] // IDs de logros desbloqueados
}

// === STORAGE ===

const STORAGE_KEY = 'c8l_user_xp'

function getXPMap(): Record<string, UserXP> {
  if (typeof window === 'undefined') return {}
  const data = localStorage.getItem(STORAGE_KEY)
  return data ? JSON.parse(data) : {}
}

function saveXPMap(map: Record<string, UserXP>): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map))
}

// === API PÚBLICA ===

/**
 * Obtiene los datos de XP de un usuario (crea si no existe)
 */
export function getUserXP(username: string): UserXP {
  const map = getXPMap()
  if (!map[username]) {
    map[username] = {
      username,
      totalXP: 0,
      level: 1,
      xpToNextLevel: LEVELS[1].xpRequired,
      xpProgress: 0,
      lastActions: {},
      history: [],
      streak: 0,
      lastLoginDate: '',
      achievements: [],
    }
    saveXPMap(map)
  }
  return map[username]
}

/**
 * Otorga XP por una acción — Retorna info del resultado
 */
export function grantXP(username: string, actionName: string): {
  xpGained: number
  totalXP: number
  leveledUp: boolean
  newLevel?: Level
  message: string
} {
  const map = getXPMap()
  const userXP = map[username] || getUserXP(username)
  
  // Buscar la acción
  const action = XP_ACTIONS.find(a => a.action === actionName)
  if (!action) {
    return { xpGained: 0, totalXP: userXP.totalXP, leveledUp: false, message: '' }
  }

  // Check cooldown
  if (action.cooldown && action.cooldown > 0) {
    const lastTime = userXP.lastActions[actionName] || 0
    const elapsed = (Date.now() - lastTime) / 1000
    if (elapsed < action.cooldown) {
      return { xpGained: 0, totalXP: userXP.totalXP, leveledUp: false, message: '' }
    }
  }

  // Aplicar XP
  const xpGained = action.xp
  userXP.totalXP += xpGained
  userXP.lastActions[actionName] = Date.now()
  
  // Historial (max 100)
  userXP.history.push({ action: actionName, xp: xpGained, timestamp: new Date().toISOString() })
  if (userXP.history.length > 100) userXP.history = userXP.history.slice(-100)

  // Check level up
  const oldLevel = userXP.level
  const newLevel = calculateLevel(userXP.totalXP)
  const leveledUp = newLevel.level > oldLevel

  userXP.level = newLevel.level
  
  // Calcular progreso hacia siguiente nivel
  const nextLevel = LEVELS.find(l => l.level === newLevel.level + 1)
  if (nextLevel) {
    userXP.xpToNextLevel = nextLevel.xpRequired
    const prevXP = newLevel.xpRequired
    const needed = nextLevel.xpRequired - prevXP
    const current = userXP.totalXP - prevXP
    userXP.xpProgress = Math.min(100, Math.round((current / needed) * 100))
  } else {
    userXP.xpToNextLevel = 0
    userXP.xpProgress = 100
  }

  // Guardar
  map[username] = userXP
  saveXPMap(map)

  // Mensaje
  let message = ''
  if (leveledUp) {
    message = `\n\n🎉 **¡LEVEL UP!** ${newLevel.emoji} Nivel ${newLevel.level}: ${newLevel.name}\n🔓 Desbloqueado: ${newLevel.unlock}`
    
    // Reportar al Control Center
    addReport({
      id: generateId(),
      type: 'user_activity',
      severity: 'info',
      message: `🎉 @${username} subió a Nivel ${newLevel.level} (${newLevel.name}) — XP total: ${userXP.totalXP}`,
      userId: username,
      username,
      section: 'Niveles',
      timestamp: new Date().toISOString(),
      resolved: true,
    })

    // Broadcast al grupo de Telegram
    import('./groupBroadcast').then(({ broadcastLevelUp }) => {
      broadcastLevelUp(username, newLevel.level, newLevel.name, newLevel.emoji)
    }).catch(() => {})

    // Dar coins bonus por level up
    const bonusCoins = newLevel.level * 25
    // TODO: Sumar coins al usuario cuando tengamos el sistema conectado
  }

  return {
    xpGained,
    totalXP: userXP.totalXP,
    leveledUp,
    newLevel: leveledUp ? newLevel : undefined,
    message,
  }
}

/**
 * Registra login diario (streak + XP bonus)
 */
export function registerDailyLogin(username: string): {
  streak: number
  bonusXP: number
  message: string
} {
  const map = getXPMap()
  const userXP = map[username] || getUserXP(username)
  const today = new Date().toDateString()

  if (userXP.lastLoginDate === today) {
    return { streak: userXP.streak, bonusXP: 0, message: '' }
  }

  // Check if yesterday (streak)
  const yesterday = new Date(Date.now() - 86400000).toDateString()
  if (userXP.lastLoginDate === yesterday) {
    userXP.streak += 1
  } else if (userXP.lastLoginDate !== today) {
    userXP.streak = 1
  }

  userXP.lastLoginDate = today
  map[username] = userXP
  saveXPMap(map)

  // Grant daily login XP
  const result = grantXP(username, 'daily_login')

  // Streak bonus
  const streakBonus = Math.min(userXP.streak * 5, 50) // max 50 XP bonus por streak
  if (streakBonus > 0) {
    userXP.totalXP += streakBonus
    map[username] = userXP
    saveXPMap(map)
  }

  const totalBonus = result.xpGained + streakBonus
  let message = `🔥 Login diario: +${totalBonus} XP`
  if (userXP.streak > 1) {
    message += ` (racha de ${userXP.streak} días 🔥)`
  }

  return {
    streak: userXP.streak,
    bonusXP: totalBonus,
    message,
  }
}

/**
 * Calcula el nivel basado en XP total
 */
function calculateLevel(totalXP: number): Level {
  let currentLevel = LEVELS[0]
  for (const level of LEVELS) {
    if (totalXP >= level.xpRequired) {
      currentLevel = level
    } else {
      break
    }
  }
  return currentLevel
}

/**
 * Formatea el perfil de nivel para el chat
 */
export function formatLevelProfile(username: string): string {
  const userXP = getUserXP(username)
  const currentLevel = LEVELS.find(l => l.level === userXP.level) || LEVELS[0]
  const nextLevel = LEVELS.find(l => l.level === userXP.level + 1)

  const progressBar = getProgressBar(userXP.xpProgress)

  let msg = `${currentLevel.emoji} **Nivel ${currentLevel.level}: ${currentLevel.name}**\n\n`
  msg += `⭐ XP Total: ${userXP.totalXP.toLocaleString()}\n`
  msg += `${progressBar} ${userXP.xpProgress}%\n`
  
  if (nextLevel) {
    msg += `📈 Siguiente: ${nextLevel.emoji} ${nextLevel.name} (${nextLevel.xpRequired - userXP.totalXP} XP restantes)\n`
    msg += `🔓 Desbloquea: ${nextLevel.unlock}\n`
  } else {
    msg += `👑 ¡NIVEL MÁXIMO ALCANZADO!\n`
  }

  msg += `\n🔥 Racha: ${userXP.streak} días`
  
  // Últimas acciones
  if (userXP.history.length > 0) {
    msg += `\n\n📋 Última actividad:`
    userXP.history.slice(-3).forEach(h => {
      const actionInfo = XP_ACTIONS.find(a => a.action === h.action)
      msg += `\n  • ${actionInfo?.description || h.action} (+${h.xp} XP)`
    })
  }

  return msg
}

/**
 * Obtiene el ranking de usuarios por XP
 */
export function getXPRanking(limit: number = 10): { username: string; level: number; xp: number; emoji: string }[] {
  const map = getXPMap()
  return Object.values(map)
    .sort((a, b) => b.totalXP - a.totalXP)
    .slice(0, limit)
    .map(u => {
      const lvl = LEVELS.find(l => l.level === u.level) || LEVELS[0]
      return {
        username: u.username,
        level: u.level,
        xp: u.totalXP,
        emoji: lvl.emoji,
      }
    })
}

/**
 * Formatea el ranking para el chat
 */
export function formatRankingMessage(): string {
  const ranking = getXPRanking(10)

  if (ranking.length === 0) {
    return '🏆 **Ranking C8L**\n\nAún no hay usuarios en el ranking. ¡Sé el primero en subir de nivel!'
  }

  let msg = '🏆 **Ranking C8L — Top 10:**\n\n'
  const medals = ['🥇', '🥈', '🥉']

  ranking.forEach((user, i) => {
    const medal = medals[i] || `${i + 1}.`
    msg += `${medal} ${user.emoji} @${user.username} — Lv.${user.level} (${user.xp.toLocaleString()} XP)\n`
  })

  return msg
}

// === UTILS ===

function getProgressBar(percent: number): string {
  const filled = Math.round(percent / 10)
  const empty = 10 - filled
  return '▓'.repeat(filled) + '░'.repeat(empty)
}
