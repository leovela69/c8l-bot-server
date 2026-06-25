// ==================== SISTEMA DE CRÉDITOS C8L ====================
// Admin (Leo Vela) = 9999 créditos fijos (infinitos)
// Usuarios normales = empiezan en 0, ganan con tareas

export const ADMIN_EMAILS = ['rufinoleon30@gmail.com', 'leovela69@gmail.com']
export const ADMIN_NAMES = ['Leo Vela', 'leovela69', 'LeoVela']
export const ADMIN_CREDITS = 9999

// Tareas disponibles para ganar créditos
export interface Task {
  id: string
  title: string
  description: string
  reward: number
  icon: string
  type: 'daily' | 'weekly' | 'one_time' | 'social'
  action?: string // URL o acción al completar
}

export const TASKS: Task[] = [
  // Diarias
  { id: 'daily_login', title: 'Iniciar sesión diaria', description: 'Entra a C8L cada día', reward: 10, icon: '🔑', type: 'daily' },
  { id: 'daily_watch', title: 'Ver 3 videos', description: 'Reproduce 3 videos completos en C8L TV', reward: 15, icon: '📺', type: 'daily' },
  { id: 'daily_like', title: 'Dar 5 likes', description: 'Dale like a 5 videos o comentarios', reward: 5, icon: '👍', type: 'daily' },
  { id: 'daily_comment', title: 'Comentar un video', description: 'Deja un comentario en cualquier video', reward: 10, icon: '💬', type: 'daily' },
  // Semanales
  { id: 'weekly_upload', title: 'Subir un video', description: 'Sube tu propio contenido a C8L TV', reward: 100, icon: '🎬', type: 'weekly' },
  { id: 'weekly_duet', title: 'Participar en un Duet', description: 'Completa un Duet Challenge', reward: 150, icon: '🎵', type: 'weekly' },
  { id: 'weekly_streak', title: 'Racha de 7 días', description: 'Inicia sesión 7 días seguidos', reward: 200, icon: '🔥', type: 'weekly' },
  // Una vez
  { id: 'first_video', title: 'Tu primer video', description: 'Sube tu primer video a la plataforma', reward: 500, icon: '🏆', type: 'one_time' },
  { id: 'first_duet', title: 'Primer Duet Challenge', description: 'Completa tu primer Duet', reward: 300, icon: '🎤', type: 'one_time' },
  { id: 'profile_complete', title: 'Perfil completo', description: 'Rellena todos los campos de tu perfil', reward: 100, icon: '👤', type: 'one_time' },
  { id: 'first_follower', title: 'Tu primer seguidor', description: 'Consigue que alguien te siga', reward: 50, icon: '🌟', type: 'one_time' },
  // Social
  { id: 'share_social', title: 'Compartir en redes', description: 'Comparte un video de C8L en tus redes sociales', reward: 25, icon: '📱', type: 'social' },
  { id: 'invite_friend', title: 'Invitar un amigo', description: 'Invita a un amigo que se registre en C8L', reward: 200, icon: '🤝', type: 'social' },
  { id: 'join_telegram', title: 'Unirte al grupo Telegram', description: 'Únete al grupo oficial de C8L en Telegram', reward: 50, icon: '✈️', type: 'social' },
]

// ============ LOCAL STORAGE HELPERS ============

export function isAdmin(userName?: string | null, email?: string | null): boolean {
  if (email && ADMIN_EMAILS.includes(email.toLowerCase())) return true
  if (userName && ADMIN_NAMES.some(n => n.toLowerCase() === userName.toLowerCase())) return true
  return false
}

export function getUserCredits(userId?: string | null, userName?: string | null, email?: string | null): number {
  // Admin siempre tiene 9999
  if (isAdmin(userName, email)) return ADMIN_CREDITS

  // Para usuarios normales, leer de localStorage
  if (typeof window === 'undefined') return 0
  const key = userId ? `c8l_credits_${userId}` : 'c8l_credits_guest'
  const stored = localStorage.getItem(key)
  return stored ? parseInt(stored, 10) : 0
}

export function setUserCredits(credits: number, userId?: string | null): void {
  if (typeof window === 'undefined') return
  const key = userId ? `c8l_credits_${userId}` : 'c8l_credits_guest'
  localStorage.setItem(key, credits.toString())
}

export function addCredits(amount: number, userId?: string | null, userName?: string | null, email?: string | null): number {
  // Admin no necesita ganar créditos
  if (isAdmin(userName, email)) return ADMIN_CREDITS

  const current = getUserCredits(userId, userName, email)
  const newTotal = current + amount
  setUserCredits(newTotal, userId)
  return newTotal
}

export function spendCredits(amount: number, userId?: string | null, userName?: string | null, email?: string | null): { success: boolean; remaining: number } {
  // Admin siempre puede gastar
  if (isAdmin(userName, email)) return { success: true, remaining: ADMIN_CREDITS }

  const current = getUserCredits(userId, userName, email)
  if (current < amount) return { success: false, remaining: current }
  const newTotal = current - amount
  setUserCredits(newTotal, userId)
  return { success: true, remaining: newTotal }
}

// ============ TASK COMPLETION ============

export function getCompletedTasks(userId?: string | null): string[] {
  if (typeof window === 'undefined') return []
  const key = userId ? `c8l_tasks_${userId}` : 'c8l_tasks_guest'
  const stored = localStorage.getItem(key)
  return stored ? JSON.parse(stored) : []
}

export function completeTask(taskId: string, userId?: string | null, userName?: string | null, email?: string | null): { success: boolean; reward: number; newCredits: number } {
  const task = TASKS.find(t => t.id === taskId)
  if (!task) return { success: false, reward: 0, newCredits: getUserCredits(userId, userName, email) }

  // Check if already completed (for one_time tasks)
  const completed = getCompletedTasks(userId)
  if (task.type === 'one_time' && completed.includes(taskId)) {
    return { success: false, reward: 0, newCredits: getUserCredits(userId, userName, email) }
  }

  // Daily tasks: check if completed today
  if (task.type === 'daily') {
    const todayKey = `${taskId}_${new Date().toDateString()}`
    if (completed.includes(todayKey)) {
      return { success: false, reward: 0, newCredits: getUserCredits(userId, userName, email) }
    }
    completed.push(todayKey)
  } else {
    completed.push(taskId)
  }

  // Save completed tasks
  if (typeof window !== 'undefined') {
    const key = userId ? `c8l_tasks_${userId}` : 'c8l_tasks_guest'
    localStorage.setItem(key, JSON.stringify(completed))
  }

  // Add credits
  const newCredits = addCredits(task.reward, userId, userName, email)
  return { success: true, reward: task.reward, newCredits }
}

export function getDailyStreak(userId?: string | null): number {
  if (typeof window === 'undefined') return 0
  const key = userId ? `c8l_streak_${userId}` : 'c8l_streak_guest'
  const stored = localStorage.getItem(key)
  if (!stored) return 0
  const data = JSON.parse(stored)
  const lastLogin = new Date(data.lastLogin)
  const today = new Date()
  const diffDays = Math.floor((today.getTime() - lastLogin.getTime()) / (1000 * 60 * 60 * 24))
  if (diffDays > 1) return 0 // Streak broken
  return data.streak || 0
}

export function updateDailyStreak(userId?: string | null): number {
  if (typeof window === 'undefined') return 0
  const key = userId ? `c8l_streak_${userId}` : 'c8l_streak_guest'
  const stored = localStorage.getItem(key)
  const today = new Date().toDateString()

  if (!stored) {
    localStorage.setItem(key, JSON.stringify({ streak: 1, lastLogin: today }))
    return 1
  }

  const data = JSON.parse(stored)
  if (data.lastLogin === today) return data.streak // Already logged in today

  const lastLogin = new Date(data.lastLogin)
  const todayDate = new Date()
  const diffDays = Math.floor((todayDate.getTime() - lastLogin.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDays === 1) {
    const newStreak = (data.streak || 0) + 1
    localStorage.setItem(key, JSON.stringify({ streak: newStreak, lastLogin: today }))
    return newStreak
  } else {
    localStorage.setItem(key, JSON.stringify({ streak: 1, lastLogin: today }))
    return 1
  }
}
