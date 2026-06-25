'use client'

import { useState } from 'react'

interface LogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  showText?: boolean
  className?: string
}

const SIZES: Record<string, { container: string; text: string; sub: string }> = {
  xs: { container: 'w-6 h-6', text: 'text-[6px]', sub: 'text-[4px]' },
  sm: { container: 'w-9 h-9', text: 'text-[8px]', sub: 'text-[5px]' },
  md: { container: 'w-12 h-12', text: 'text-[10px]', sub: 'text-[6px]' },
  lg: { container: 'w-16 h-16', text: 'text-sm', sub: 'text-[7px]' },
  xl: { container: 'w-24 h-24', text: 'text-xl', sub: 'text-[9px]' },
  '2xl': { container: 'w-32 h-32', text: 'text-3xl', sub: 'text-xs' },
}

/**
 * Logo C8L Agency - Componente reutilizable
 * Muestra /images/logo-c8l.jpg (el logotipo real subido por Leo)
 * Fallback CSS si la imagen no carga
 */
export default function Logo({ size = 'md', showText = false, className = '' }: LogoProps) {
  const [imgError, setImgError] = useState(false)
  const s = SIZES[size]

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {!imgError ? (
        <img
          src="/images/logo-c8l.jpg"
          alt="C8L Corazones Locos Agency"
          className={`${s.container} rounded-full object-cover shadow-lg shadow-c8l-gold/30 border-2 border-c8l-gold/50`}
          onError={() => setImgError(true)}
        />
      ) : (
        <div className={`${s.container} rounded-full relative overflow-hidden shadow-lg shadow-c8l-gold/30 border-2 border-c8l-gold/50 flex items-center justify-center bg-gradient-to-br from-amber-500 via-yellow-600 to-amber-800`}>
          <div className="absolute inset-[3px] rounded-full bg-gradient-to-br from-gray-900 to-black flex flex-col items-center justify-center">
            <span className={`${s.text} font-black bg-gradient-to-r from-c8l-gold via-yellow-400 to-c8l-gold bg-clip-text text-transparent leading-none`}>
              C8L
            </span>
            <span className={`${s.sub} text-red-500 leading-none mt-0.5`}>&#10084;</span>
          </div>
        </div>
      )}
      {showText && (
        <div>
          <h1 className="text-sm font-outfit font-bold text-white leading-none">C8L AGENCY</h1>
          <p className="text-[9px] text-c8l-gold leading-none mt-0.5">Corazones Locos</p>
        </div>
      )}
    </div>
  )
}
