'use client'

import { useCredits } from '@/lib/credits/context'

interface CreditsDisplayProps {
  showLabel?: boolean
  className?: string
}

export default function CreditsDisplay({ showLabel = false, className = '' }: CreditsDisplayProps) {
  const { credits, isAdminUser } = useCredits()

  return (
    <div className={`flex items-center gap-1.5 bg-gray-800/60 rounded-full px-3 py-1.5 ${className}`}>
      <span className="text-c8l-gold text-xs">🪙</span>
      <span className={`text-xs font-bold ${isAdminUser ? 'text-c8l-gold' : 'text-white'}`}>
        {credits.toLocaleString()}
      </span>
      {showLabel && <span className="text-[9px] text-gray-500">C8L</span>}
      {isAdminUser && <span className="text-[8px] text-c8l-gold">👑</span>}
    </div>
  )
}
