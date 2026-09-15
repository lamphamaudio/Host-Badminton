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
    <div className="min-h-screen bg-[#fafbfc] text-[#0f172a] flex justify-center selection:bg-emerald-100 selection:text-emerald-900 font-sans">
      {/* Centered Mobile Container */}
      <div className="w-full max-w-md min-h-screen flex flex-col bg-white border-x border-slate-200/80 shadow-[0_0_30px_rgba(0,0,0,0.03)] relative">
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
