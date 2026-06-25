'use client'

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'
import { useAuth } from '@/lib/auth/context'
import {
  getUserCredits, addCredits, spendCredits, isAdmin,
  completeTask, getCompletedTasks, getDailyStreak, updateDailyStreak,
  TASKS, Task, ADMIN_CREDITS
} from './store'

interface CreditsContextType {
  credits: number
  isAdminUser: boolean
  streak: number
  tasks: Task[]
  completedTaskIds: string[]
  earnCredits: (taskId: string) => { success: boolean; reward: number }
  useCredits: (amount: number) => boolean
  refreshCredits: () => void
}

const CreditsContext = createContext<CreditsContextType | null>(null)

export function CreditsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [credits, setCredits] = useState(0)
  const [isAdminUser, setIsAdminUser] = useState(false)
  const [streak, setStreak] = useState(0)
  const [completedTaskIds, setCompletedTaskIds] = useState<string[]>([])

  const refreshCredits = useCallback(() => {
    const admin = isAdmin(user?.name, user?.email)
    setIsAdminUser(admin)
    setCredits(admin ? ADMIN_CREDITS : getUserCredits(user?.id, user?.name, user?.email))
    setStreak(getDailyStreak(user?.id))
    setCompletedTaskIds(getCompletedTasks(user?.id))
  }, [user])

  useEffect(() => {
    refreshCredits()
    // Update daily streak on mount
    if (typeof window !== 'undefined') {
      updateDailyStreak(user?.id)
    }
  }, [refreshCredits, user])

  const earnCredits = (taskId: string) => {
    const result = completeTask(taskId, user?.id, user?.name, user?.email)
    if (result.success) {
      setCredits(result.newCredits)
      setCompletedTaskIds(getCompletedTasks(user?.id))
    }
    return { success: result.success, reward: result.reward }
  }

  const useCredits = (amount: number): boolean => {
    const result = spendCredits(amount, user?.id, user?.name, user?.email)
    if (result.success) {
      setCredits(result.remaining)
    }
    return result.success
  }

  return (
    <CreditsContext.Provider value={{
      credits, isAdminUser, streak, tasks: TASKS, completedTaskIds,
      earnCredits, useCredits, refreshCredits
    }}>
      {children}
    </CreditsContext.Provider>
  )
}

export function useCredits() {
  const context = useContext(CreditsContext)
  if (!context) throw new Error('useCredits must be used within CreditsProvider')
  return context
}
