/**
 * C8L Control Center — Types
 */

export interface User {
  id: string
  username: string
  role: 'owner' | 'bot' | 'admin' | 'moderator' | 'user'
  createdAt: string
  lastActive: string
  status: 'active' | 'banned' | 'warned' | 'suspended'
  warnings: number
  coins: number
}

export interface BotReport {
  id: string
  type: 'action' | 'warning' | 'error' | 'infraction' | 'system' | 'user_activity'
  severity: 'info' | 'low' | 'medium' | 'high' | 'critical'
  message: string
  userId?: string
  username?: string
  section: string
  timestamp: string
  resolved: boolean
}

export interface ChatMessage {
  id: string
  role: 'user' | 'bot' | 'system'
  content: string
  username: string
  timestamp: string
  section: string
}

export interface SystemStats {
  totalUsers: number
  activeNow: number
  totalMessages: number
  totalReports: number
  infractions: number
  uptime: string
  botStatus: 'online' | 'offline' | 'busy'
}

export interface VideoContent {
  id: string
  title: string
  description: string
  author: string
  url: string
  thumbnail: string
  duration: string
  views: number
  likes: number
  category: string
  uploadedAt: string
}
