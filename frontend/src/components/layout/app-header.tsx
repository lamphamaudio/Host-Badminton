import React from 'react'
import { Zap } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface AppHeaderProps {
  title?: string
  subtitle?: string
  rightElement?: React.ReactNode
  showLogo?: boolean
  onLogoClick?: () => void
  className?: string
}

export function AppHeader({
  title = 'Host Badminton',
  subtitle = 'Court Host Assistant',
  rightElement,
  showLogo = true,
  onLogoClick,
  className,
}: AppHeaderProps) {
  return (
    <header
      className={cn(
        'sticky top-0 z-40 w-full border-b border-[#1e293b]/80 bg-[#090d16]/90 backdrop-blur-md px-4 py-3 pt-safe flex items-center justify-between',
        className
      )}
    >
      <div
        className={cn(
          'flex items-center gap-2.5',
          onLogoClick ? 'cursor-pointer hover:opacity-90 transition-opacity' : ''
        )}
        onClick={onLogoClick}
      >
        {showLogo && (
          <div className="w-9 h-9 min-w-[36px] rounded-xl bg-gradient-to-tr from-emerald-500 to-lime-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Zap className="w-5 h-5 text-slate-950 stroke-[2.5]" />
          </div>
        )}
        <div className="flex flex-col">
          <h1 className="font-bold text-base leading-tight tracking-tight text-white line-clamp-1">
            {title}
          </h1>
          {subtitle && (
            <span className="text-[11px] font-medium text-emerald-400 leading-none">
              {subtitle}
            </span>
          )}
        </div>
      </div>

      {rightElement && <div className="flex items-center gap-1.5">{rightElement}</div>}
    </header>
  )
}
