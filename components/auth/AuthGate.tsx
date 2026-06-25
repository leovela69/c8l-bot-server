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
          <img
            src="/images/logo-c8l.png"
            alt="C8L Corazones Locos Agency"
            className="w-20 h-20 mx-auto mb-4 rounded-full object-cover shadow-xl shadow-c8l-gold/30 border-2 border-c8l-gold/50 animate-pulse"
          />
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
