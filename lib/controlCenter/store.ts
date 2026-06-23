/**
 * C8L Control Center — In-Memory Store (persists in localStorage)
 * Central state management for the entire platform
 */

import { User, BotReport, ChatMessage, SystemStats, VideoContent } from './types'

const STORAGE_KEYS = {
  users: 'c8l_users',
  reports: 'c8l_reports',
  messages: 'c8l_messages',
  session: 'c8l_session',
}

// ===== USERS =====
export function getUsers(): User[] {
  if (typeof window === 'undefined') return []
  const data = localStorage.getItem(STORAGE_KEYS.users)
  if (!data) {
    // Initialize with default users
    const defaults: User[] = [
      { id: 'owner-1', username: 'leovela', role: 'owner', createdAt: '2026-06-20', lastActive: new Date().toISOString(), status: 'active', warnings: 0, coins: 999999 },
      { id: 'bot-1', username: 'c8l_bot', role: 'bot', createdAt: '2026-06-20', lastActive: new Date().toISOString(), status: 'active', warnings: 0, coins: 0 },
    ]
    localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(defaults))
    return defaults
  }
  return JSON.parse(data)
}

export function addUser(user: User): void {
  const users = getUsers()
  users.push(user)
  localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(users))
}

export function updateUser(id: string, updates: Partial<User>): void {
  const users = getUsers()
  const idx = users.findIndex(u => u.id === id)
  if (idx >= 0) {
    users[idx] = { ...users[idx], ...updates }
    localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(users))
  }
}

// ===== REPORTS =====
export function getReports(): BotReport[] {
  if (typeof window === 'undefined') return []
  const data = localStorage.getItem(STORAGE_KEYS.reports)
  return data ? JSON.parse(data) : []
}

export function addReport(report: BotReport): void {
  const reports = getReports()
  reports.unshift(report) // newest first
  // Keep max 500 reports
  if (reports.length > 500) reports.length = 500
  localStorage.setItem(STORAGE_KEYS.reports, JSON.stringify(reports))
}

export function resolveReport(id: string): void {
  const reports = getReports()
  const idx = reports.findIndex(r => r.id === id)
  if (idx >= 0) {
    reports[idx].resolved = true
    localStorage.setItem(STORAGE_KEYS.reports, JSON.stringify(reports))
  }
}

// ===== MESSAGES =====
export function getMessages(): ChatMessage[] {
  if (typeof window === 'undefined') return []
  const data = localStorage.getItem(STORAGE_KEYS.messages)
  return data ? JSON.parse(data) : []
}

export function addMessage(msg: ChatMessage): void {
  const messages = getMessages()
  messages.push(msg)
  if (messages.length > 1000) messages.splice(0, messages.length - 1000)
  localStorage.setItem(STORAGE_KEYS.messages, JSON.stringify(messages))
}

// ===== SESSION =====
export function getSession(): { username: string; role: string } | null {
  if (typeof window === 'undefined') return null
  const data = localStorage.getItem(STORAGE_KEYS.session)
  return data ? JSON.parse(data) : null
}

export function setSession(username: string, role: string): void {
  localStorage.setItem(STORAGE_KEYS.session, JSON.stringify({ username, role }))
}

export function clearSession(): void {
  localStorage.removeItem(STORAGE_KEYS.session)
}

// ===== STATS =====
export function getStats(): SystemStats {
  const users = getUsers()
  const reports = getReports()
  const messages = getMessages()
  return {
    totalUsers: users.length,
    activeNow: Math.min(users.length, Math.floor(Math.random() * 5) + 1),
    totalMessages: messages.length,
    totalReports: reports.length,
    infractions: reports.filter(r => r.type === 'infraction').length,
    uptime: '99.7%',
    botStatus: 'online',
  }
}

// ===== GENERATE REPORT ID =====
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}
