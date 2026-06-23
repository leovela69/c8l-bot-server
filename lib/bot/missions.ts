/**
 * C8L Bot v2.0 — Sistema de Misiones Diarias
 * El bot asigna tareas y recompensa con C8L Coins
 */

import { generateId } from '../controlCenter/store'

export interface Mission {
  id: string
  title: string
  description: string
  reward: number
  section: string
  type: 'daily' | 'weekly' | 'special'
  difficulty: 'easy' | 'medium' | 'hard'
  emoji: string
}

export interface UserMissionProgress {
  oddsOnGoodDay: string
  missionId: string
  completed: boolean
  claimedReward: boolean
  progress: number // 0-100
  assignedAt: string
  completedAt?: string
}

// Pool de misiones disponibles (se asignan aleatoriamente)
const MISSION_POOL: Omit<Mission, 'id'>[] = [
  // DAILY — Fáciles
  { title: 'Explorador', description: 'Visita 3 secciones diferentes de C8L', reward: 50, section: 'general', type: 'daily', difficulty: 'easy', emoji: '🗺️' },
  { title: 'Cinéfilo', description: 'Mira 2 videos en C8L TV', reward: 30, section: 'tv', type: 'daily', difficulty: 'easy', emoji: '📺' },
  { title: 'Jugador', description: 'Juega 5 partidas en el Casino', reward: 40, section: 'casino', type: 'daily', difficulty: 'easy', emoji: '🎰' },
  { title: 'Social', description: 'Envía 10 mensajes al bot', reward: 25, section: 'chat', type: 'daily', difficulty: 'easy', emoji: '💬' },
  { title: 'Cantante', description: 'Canta 1 canción en el Karaoke', reward: 50, section: 'karaoke', type: 'daily', difficulty: 'easy', emoji: '🎤' },
  { title: 'Productor Novato', description: 'Genera 1 canción en el Estudio', reward: 60, section: 'studio', type: 'daily', difficulty: 'easy', emoji: '🎵' },

  // DAILY — Medias
  { title: 'Maratonista', description: 'Mira los 8 videos de C8L TV', reward: 100, section: 'tv', type: 'daily', difficulty: 'medium', emoji: '🏃' },
  { title: 'High Roller', description: 'Gana 500+ coins en una sesión de Casino', reward: 150, section: 'casino', type: 'daily', difficulty: 'medium', emoji: '💎' },
  { title: 'Compositor', description: 'Genera 3 canciones en el Estudio', reward: 120, section: 'studio', type: 'daily', difficulty: 'medium', emoji: '🎼' },
  { title: 'Guerrero', description: 'Participa en una guerra de Bandos', reward: 100, section: 'bandos', type: 'daily', difficulty: 'medium', emoji: '⚔️' },

  // WEEKLY — Difíciles
  { title: 'Leyenda C8L', description: 'Completa 5 misiones diarias en una semana', reward: 500, section: 'general', type: 'weekly', difficulty: 'hard', emoji: '🏆' },
  { title: 'Rey del Casino', description: 'Acumula 5000 coins en Casino esta semana', reward: 750, section: 'casino', type: 'weekly', difficulty: 'hard', emoji: '👑' },
  { title: 'Artista Completo', description: 'Crea 10 canciones esta semana', reward: 600, section: 'studio', type: 'weekly', difficulty: 'hard', emoji: '🌟' },

  // SPECIAL
  { title: 'Primera Vez', description: 'Regístrate en C8L (ya completada si tienes cuenta)', reward: 100, section: 'registro', type: 'special', difficulty: 'easy', emoji: '🎉' },
  { title: 'Reclutador', description: 'Invita a un amigo a C8L', reward: 200, section: 'general', type: 'special', difficulty: 'medium', emoji: '🤝' },
]

const STORAGE_KEY = 'c8l_user_missions'

// === GET/SET Missions por usuario ===
function getUserMissions(username: string): { missions: Mission[]; progress: UserMissionProgress[] } {
  if (typeof window === 'undefined') return { missions: [], progress: [] }
  const data = localStorage.getItem(`${STORAGE_KEY}_${username}`)
  if (data) {
    const parsed = JSON.parse(data)
    // Check if missions are from today
    const today = new Date().toDateString()
    if (parsed.date === today) return parsed
  }
  // Assign new daily missions
  return assignDailyMissions(username)
}

function saveUserMissions(username: string, data: any): void {
  localStorage.setItem(`${STORAGE_KEY}_${username}`, JSON.stringify({
    ...data,
    date: new Date().toDateString()
  }))
}

// === ASSIGN MISSIONS ===
function assignDailyMissions(username: string): { missions: Mission[]; progress: UserMissionProgress[] } {
  // Pick 3 daily + 1 weekly
  const dailies = MISSION_POOL.filter(m => m.type === 'daily')
  const weeklies = MISSION_POOL.filter(m => m.type === 'weekly')

  const shuffledDaily = dailies.sort(() => Math.random() - 0.5).slice(0, 3)
  const weeklyMission = weeklies[Math.floor(Math.random() * weeklies.length)]

  const selectedMissions = [...shuffledDaily, weeklyMission]

  const missions: Mission[] = selectedMissions.map(m => ({
    ...m,
    id: generateId()
  }))

  const progress: UserMissionProgress[] = missions.map(m => ({
    oddsOnGoodDay: '',
    missionId: m.id,
    completed: false,
    claimedReward: false,
    progress: 0,
    assignedAt: new Date().toISOString()
  }))

  const data = { missions, progress }
  saveUserMissions(username, data)
  return data
}

// === PUBLIC API ===

/**
 * Obtiene las misiones del usuario con su progreso
 */
export function getMissions(username: string): { missions: Mission[]; progress: UserMissionProgress[] } {
  return getUserMissions(username)
}

/**
 * Registra progreso en una misión (por sección visitada o acción)
 */
export function trackProgress(username: string, section: string): void {
  const data = getUserMissions(username)
  let changed = false

  data.missions.forEach((mission, idx) => {
    if (mission.section === section || mission.section === 'general' || mission.section === 'chat') {
      const prog = data.progress[idx]
      if (!prog.completed) {
        prog.progress = Math.min(100, prog.progress + 25) // +25% por acción
        if (prog.progress >= 100) {
          prog.completed = true
          prog.completedAt = new Date().toISOString()
        }
        changed = true
      }
    }
  })

  if (changed) saveUserMissions(username, data)
}

/**
 * Reclama la recompensa de una misión completada
 * Retorna los coins ganados o 0 si no se puede reclamar
 */
export function claimReward(username: string, missionId: string): number {
  const data = getUserMissions(username)
  const idx = data.missions.findIndex(m => m.id === missionId)
  if (idx === -1) return 0

  const prog = data.progress[idx]
  if (!prog.completed || prog.claimedReward) return 0

  prog.claimedReward = true
  saveUserMissions(username, data)
  return data.missions[idx].reward
}

/**
 * Formatea las misiones para mostrar en el chat
 */
export function formatMissionsMessage(username: string): string {
  const { missions, progress } = getMissions(username)

  if (missions.length === 0) {
    return '🎯 No tienes misiones asignadas. ¡Vuelve mañana!'
  }

  let msg = '🎯 **Tus Misiones de Hoy:**\n\n'

  missions.forEach((m, i) => {
    const p = progress[i]
    const status = p.claimedReward ? '✅' : p.completed ? '🎁' : '⏳'
    const bar = getProgressBar(p.progress)

    msg += `${status} ${m.emoji} **${m.title}**\n`
    msg += `   ${m.description}\n`
    msg += `   ${bar} ${p.progress}%\n`
    msg += `   🎁 Recompensa: ${m.reward} C8L Coins`
    if (p.completed && !p.claimedReward) msg += ' ← ¡RECLAMAR!'
    msg += '\n\n'
  })

  const completedCount = progress.filter(p => p.completed).length
  msg += `📊 Completadas: ${completedCount}/${missions.length}`

  return msg
}

function getProgressBar(percent: number): string {
  const filled = Math.round(percent / 10)
  const empty = 10 - filled
  return '█'.repeat(filled) + '░'.repeat(empty)
}
