'use client'

/**
 * C8L API Hooks — React hooks para conectar con el backend
 * Uso: import { useApi, useHealth } from '@/lib/api/hooks'
 */

import { useState, useEffect, useCallback } from 'react'
import {
  checkHealth,
  generateMusic,
  getMusicFeed,
  getSunoCredits,
  generateImage,
  generateVideo,
  chatWithBot,
  getSystemStatus,
  API_BASE_URL,
} from './client'

// ============ HEALTH CHECK ============

export function useHealth() {
  const [online, setOnline] = useState<boolean | null>(null)
  const [version, setVersion] = useState<string>('')

  useEffect(() => {
    checkHealth().then(res => {
      setOnline(res.success)
      if (res.data) setVersion(res.data.version || '')
    })
  }, [])

  return { online, version, apiUrl: API_BASE_URL }
}

// ============ MUSIC GENERATION ============

export function useMusicGeneration() {
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [taskId, setTaskId] = useState<string | null>(null)

  const generate = useCallback(async (prompt: string, style?: string, voice?: string) => {
    setGenerating(true)
    setError(null)
    const res = await generateMusic({ prompt, style, voice })
    setGenerating(false)

    if (res.success && res.data) {
      setTaskId(res.data.task_id)
      return res.data
    } else {
      setError(res.error || 'Error generando música')
      return null
    }
  }, [])

  return { generate, generating, error, taskId }
}

// ============ MUSIC FEED ============

export function useMusicFeed() {
  const [songs, setSongs] = useState<Array<{ id: string; title: string; url: string }>>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setLoading(true)
    const res = await getMusicFeed()
    if (res.success && res.data) {
      setSongs(res.data.songs || [])
    }
    setLoading(false)
  }, [])

  useEffect(() => { refresh() }, [refresh])

  return { songs, loading, refresh }
}

// ============ CREDITS ============

export function useCredits() {
  const [credits, setCredits] = useState<number>(0)
  const [total, setTotal] = useState<number>(0)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    const res = await getSunoCredits()
    if (res.success && res.data) {
      setCredits(res.data.credits)
      setTotal(res.data.total)
    }
    setLoading(false)
  }, [])

  useEffect(() => { refresh() }, [refresh])

  return { credits, total, loading, refresh }
}

// ============ IMAGE GENERATION ============

export function useImageGeneration() {
  const [generating, setGenerating] = useState(false)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const generate = useCallback(async (prompt: string, model?: string) => {
    setGenerating(true)
    setError(null)
    const res = await generateImage(prompt, model)
    setGenerating(false)

    if (res.success && res.data) {
      setImageUrl(res.data.url)
      return res.data.url
    } else {
      setError(res.error || 'Error generando imagen')
      return null
    }
  }, [])

  return { generate, generating, imageUrl, error }
}

// ============ VIDEO GENERATION ============

export function useVideoGeneration() {
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generate = useCallback(async (prompt: string, model?: string, duration?: number) => {
    setGenerating(true)
    setError(null)
    const res = await generateVideo(prompt, model, duration)
    setGenerating(false)

    if (res.success && res.data) {
      return res.data
    } else {
      setError(res.error || 'Error generando video')
      return null
    }
  }, [])

  return { generate, generating, error }
}

// ============ CHAT BOT ============

export function useChatBot() {
  const [loading, setLoading] = useState(false)

  const send = useCallback(async (message: string, userId?: string) => {
    setLoading(true)
    const res = await chatWithBot(message, userId)
    setLoading(false)

    if (res.success && res.data) {
      return res.data
    }
    return { reply: '⚠️ Error de conexión', agent: 'system' }
  }, [])

  return { send, loading }
}

// ============ SYSTEM STATUS ============

export function useSystemStatus() {
  const [status, setStatus] = useState<{
    bots_active: number
    uptime: string
    version: string
    services: Record<string, boolean>
  } | null>(null)

  useEffect(() => {
    getSystemStatus().then(res => {
      if (res.success && res.data) {
        setStatus(res.data)
      }
    })
  }, [])

  return status
}
