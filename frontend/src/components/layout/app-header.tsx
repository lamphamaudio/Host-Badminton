import React from 'react'
import { ShuttleMark } from '@/components/brand/ShuttleMark'
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
  subtitle,
  rightElement,
  showLogo = true,
  onLogoClick,
  className,
}: AppHeaderProps) {
  return (
    <header
      className={cn(
        'sticky top-0 z-40 w-full border-b border-line bg-canvas/80 backdrop-blur-md px-4 py-3 pt-safe flex items-center justify-between',
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
          <ShuttleMark className="h-8 w-8 min-w-[32px] text-fg" />
        )}
        <div className="flex flex-col">
          <h1 className="font-bold text-sm leading-tight tracking-tight text-fg line-clamp-1">
            {title}
          </h1>
          {subtitle && (
            <span className="text-[11px] font-medium text-fg-muted leading-none">
              {subtitle}
            </span>
          )}
        </div>
      </div>

      {rightElement && <div className="flex items-center gap-1.5">{rightElement}</div>}
    </header>
  )
}
