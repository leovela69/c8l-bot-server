'use client'

import { useAuth } from '@/lib/auth/context'
import AgeGate from '@/components/auth/AgeGate'
import Logo from '@/components/ui/Logo'

/**
 * AuthGate - Componente global que protege TODA la app.
 * Solo se muestra UNA vez al inicio.
 * NO se vuelve a mostrar al cambiar de pestaña porque
 * el estado se guarda en localStorage + contexto global.
 */
export default function AuthGate({ children }: { children: React.ReactNode }) {
  const { isAgeVerified, isLoading } = useAuth()

  // Pantalla de carga con logo C8L
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0A0A0A]">
        <div className="text-center">
          <Logo size="2xl" className="justify-center mb-4 animate-pulse" />
          <p className="text-gray-400 text-sm mt-4">Cargando C8L Agency...</p>
        </div>
      </div>
    )
  }

  // Si NO ha verificado edad → mostrar AgeGate
  if (!isAgeVerified) {
    return <AgeGate />
  }

  // Ya verificado → mostrar la web completa
  return <>{children}</>
}
