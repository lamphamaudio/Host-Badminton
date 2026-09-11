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
    <div className="min-h-screen bg-[#090d16] text-[#f8fafc] flex justify-center selection:bg-emerald-500 selection:text-slate-950 font-sans">
      {/* Background Decorative Ambient Glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-emerald-500/10 blur-[140px] rounded-full" />
        <div className="absolute top-1/2 -right-40 w-[400px] h-[400px] bg-lime-500/10 blur-[120px] rounded-full" />
        <div className="absolute -bottom-40 -left-20 w-[400px] h-[400px] bg-teal-500/10 blur-[130px] rounded-full" />
      </div>

      {/* Centered Mobile Container */}
      <div className="w-full max-w-md min-h-screen flex flex-col bg-[#090d16] border-x border-[#1e293b]/60 shadow-2xl relative">
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
