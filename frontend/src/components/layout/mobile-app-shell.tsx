import React from 'react'
import { AppHeader } from './app-header'
import { BottomNav, type NavTabId } from './bottom-nav'
import { cn } from '@/lib/utils'

export interface MobileAppShellProps {
  children: React.ReactNode
  activeTab?: NavTabId
  onTabChange?: (tabId: NavTabId) => void
  headerTitle?: string
  headerSubtitle?: string
  headerRight?: React.ReactNode
  onLogoClick?: () => void
  showHeader?: boolean
  showBottomNav?: boolean
  className?: string
}

export function MobileAppShell({
  children,
  activeTab = 'calculator',
  onTabChange = () => {},
  headerTitle,
  headerSubtitle,
  headerRight,
  onLogoClick,
  showHeader = true,
  showBottomNav = true,
  className,
}: MobileAppShellProps) {
  return (
    <div className="min-h-screen bg-canvas text-fg flex justify-center selection:bg-volt selection:text-ink font-sans">
      {/* Centered Mobile Container */}
      <div className="w-full max-w-md min-h-screen flex flex-col bg-canvas border-x border-line relative">
        {showHeader && (
          <AppHeader
            title={headerTitle}
            subtitle={headerSubtitle}
            rightElement={headerRight}
            onLogoClick={onLogoClick}
          />
        )}

        <main className={cn('flex-1 p-4 pb-28', className)}>{children}</main>

        {showBottomNav && <BottomNav activeTab={activeTab} onTabChange={onTabChange} />}
      </div>
    </div>
  )
}
