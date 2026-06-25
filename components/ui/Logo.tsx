'use client'

interface LogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  showText?: boolean
  className?: string
}

const SIZES = {
  xs: 'w-6 h-6',
  sm: 'w-8 h-8',
  md: 'w-12 h-12',
  lg: 'w-16 h-16',
  xl: 'w-24 h-24',
  '2xl': 'w-32 h-32',
}

export default function Logo({ size = 'md', showText = false, className = '' }: LogoProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <img
        src="/images/logo-c8l.png"
        alt="C8L Corazones Locos Agency"
        className={`${SIZES[size]} rounded-full object-cover shadow-lg shadow-c8l-gold/20 border-2 border-c8l-gold/40`}
      />
      {showText && (
        <div>
          <h1 className="text-sm font-outfit font-bold text-white leading-none">C8L AGENCY</h1>
          <p className="text-[9px] text-c8l-gold leading-none mt-0.5">Corazones Locos</p>
        </div>
      )}
    </div>
  )
}
