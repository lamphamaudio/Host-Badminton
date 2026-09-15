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
        'sticky top-0 z-40 w-full border-b border-slate-200/90 bg-white/90 backdrop-blur-md px-4 py-3 pt-safe flex items-center justify-between shadow-[0_1px_3px_rgba(0,0,0,0.02)]',
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
          <div className="w-8 h-8 min-w-[32px] rounded-xl bg-slate-900 flex items-center justify-center shadow-sm">
            <Zap className="w-4 h-4 text-emerald-400 fill-emerald-400" />
          </div>
        )}
        <div className="flex flex-col">
          <h1 className="font-bold text-sm leading-tight tracking-tight text-slate-900 line-clamp-1">
            {title}
          </h1>
          {subtitle && (
            <span className="text-[11px] font-medium text-slate-500 leading-none">
              {subtitle}
            </span>
          )}
        </div>
      </div>

      {rightElement && <div className="flex items-center gap-1.5">{rightElement}</div>}
    </header>
  )
}
