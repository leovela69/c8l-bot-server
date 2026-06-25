'use client'

import { ReactNode } from 'react'
import { AuthProvider } from '@/lib/auth/context'
import { CreditsProvider } from '@/lib/credits/context'

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <CreditsProvider>
        {children}
      </CreditsProvider>
    </AuthProvider>
  )
}
