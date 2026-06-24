'use client'

import { useAuth } from '@/lib/auth/context'
import AgeGate from '@/components/auth/AgeGate'

/**
 * AuthGate - Componente global que protege TODA la app.
 * Solo se muestra UNA vez al inicio:
 * 1. Verificacion de edad (dia/mes/año)
 * 2. Pantalla de registro (Google, Facebook, etc.)
 * 3. Una vez verificado → acceso total a toda la web
 * 
 * NO se vuelve a mostrar al cambiar de pestaña porque
 * el estado se guarda en localStorage + contexto global.
 */
export default function AuthGate({ children }: { children: React.ReactNode }) {
  const { isAgeVerified, isLoading } = useAuth()

  // Pantalla de carga
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0A0A0A]">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-c8l-gold to-c8l-purple flex items-center justify-center animate-pulse">
            <span className="text-xl font-black">C8L</span>
          </div>
          <p className="text-gray-400 text-sm">Cargando...</p>
        </div>
      </div>
    )
  }

  // Si NO ha verificado edad → mostrar AgeGate (que incluye el flujo de registro)
  if (!isAgeVerified) {
    return <AgeGate />
  }

  // Ya verificado → mostrar la web completa
  return <>{children}</>
}
