import React from 'react'
import { Building2, Calculator, CalendarDays, Settings, Users } from 'lucide-react'
import { cn } from '@/lib/utils'

export type NavTabId = 'calculator' | 'sessions' | 'courts' | 'members' | 'settings'

export interface NavTabItem {
  id: NavTabId
  label: string
  icon: React.ElementType
  badgeCount?: number
}

export const DEFAULT_NAV_TABS: NavTabItem[] = [
  {
    id: 'calculator',
    label: 'Tính tiền',
    icon: Calculator,
  },
  {
    id: 'sessions',
    label: 'Lịch sử',
    icon: CalendarDays,
  },
  {
    id: 'courts',
    label: 'Sân bãi',
    icon: Building2,
  },
  {
    id: 'members',
    label: 'Thành viên',
    icon: Users,
  },
  {
    id: 'settings',
    label: 'Cài đặt',
    icon: Settings,
  },
]

export interface BottomNavProps {
  activeTab: NavTabId
  onTabChange: (tabId: NavTabId) => void
  tabs?: NavTabItem[]
  className?: string
}

export function BottomNav({
  activeTab,
  onTabChange,
  tabs = DEFAULT_NAV_TABS,
  className,
}: BottomNavProps) {
  return (
    <nav
      className={cn(
        'fixed bottom-0 left-0 right-0 z-40 bg-[#090d16]/95 backdrop-blur-lg border-t border-[#1e293b] px-2 py-1.5 pb-safe flex items-center justify-around max-w-lg mx-auto transition-all',
        className
      )}
      aria-label="Bottom Navigation"
    >
      {tabs.map((tab) => {
        const Icon = tab.icon
        const isActive = activeTab === tab.id

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className={cn(
              'relative flex flex-col items-center justify-center flex-1 py-1 min-h-[48px] rounded-xl transition-all duration-150 select-none cursor-pointer group outline-none',
              isActive ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
            )}
            aria-current={isActive ? 'page' : undefined}
          >
            {/* Active Pill Indicator */}
            {isActive && (
              <span className="absolute -top-1.5 w-8 h-1 bg-gradient-to-r from-emerald-400 to-lime-400 rounded-full shadow-sm shadow-emerald-400/50 animate-in fade-in zoom-in-75 duration-150" />
            )}

            <div className="relative flex items-center justify-center">
              <Icon
                className={cn(
                  'w-5 h-5 transition-transform duration-150',
                  isActive ? 'scale-110 stroke-[2.5]' : 'group-hover:scale-105'
                )}
              />
              {tab.badgeCount !== undefined && tab.badgeCount > 0 && (
                <span className="absolute -top-1.5 -right-2 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white shadow-sm">
                  {tab.badgeCount}
                </span>
              )}
            </div>

            <span className="text-[10px] mt-1 leading-tight tracking-tight">{tab.label}</span>
          </button>
        )
      })}
    </nav>
  )
}
