'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { supabase } from '@/lib/supabase/client'

interface User {
  id: string
  email: string
  name: string
  avatar?: string
  provider?: string
}

interface AuthContextType {
  user: User | null
  isAgeVerified: boolean
  isLoading: boolean
  verifyAge: (birthDate: Date) => boolean
  loginWithGoogle: () => Promise<void>
  loginWithDiscord: () => Promise<void>
  loginWithEmail: (email: string, password: string) => Promise<void>
  signUpWithEmail: (email: string, password: string, name: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  // IMPORTANTE: Inicializar como TRUE si ya está en localStorage
  // Así NUNCA se muestra el age gate si ya lo pasaste antes
  const [isAgeVerified, setIsAgeVerified] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('c8l_age_verified') === 'true'
    }
    return false
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Double-check localStorage on mount (por si el estado inicial no lo cogió)
    const ageVerified = localStorage.getItem('c8l_age_verified')
    if (ageVerified === 'true') {
      setIsAgeVerified(true)
    }

    // Check Supabase session
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          setUser({
            id: session.user.id,
            email: session.user.email || '',
            name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'Usuario',
            avatar: session.user.user_metadata?.avatar_url,
            provider: session.user.app_metadata?.provider
          })
        }
      } catch (error) {
        console.error('Error checking session:', error)
      } finally {
        setIsLoading(false)
      }
    }

    checkSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'Usuario',
          avatar: session.user.user_metadata?.avatar_url,
          provider: session.user.app_metadata?.provider
        })
      } else {
        setUser(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const verifyAge = (birthDate: Date): boolean => {
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    
    if (age >= 18) {
      // Guardar en localStorage para que NUNCA vuelva a salir
      localStorage.setItem('c8l_age_verified', 'true')
      localStorage.setItem('c8l_age_verified_date', new Date().toISOString())
      setIsAgeVerified(true)
      return true
    }
    return false
  }

  const loginWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin }
    })
  }

  const loginWithDiscord = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'discord',
      options: { redirectTo: window.location.origin }
    })
  }

  const loginWithEmail = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  const signUpWithEmail = async (email: string, password: string, name: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } }
    })
    if (error) throw error
  }

  const logout = () => {
    supabase.auth.signOut()
    setUser(null)
    // NO borramos c8l_age_verified al hacer logout
    // Solo se borra la sesión, pero la edad ya está verificada
  }

  return (
    <AuthContext.Provider value={{
      user, isAgeVerified, isLoading,
      verifyAge, loginWithGoogle, loginWithDiscord,
      loginWithEmail, signUpWithEmail, logout
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
