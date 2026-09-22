import { useEffect, useState } from 'react'
import { Home, LogIn, Moon, Sun } from 'lucide-react'
import { LoginSheet } from '@/components/auth/LoginSheet'
import { CalculatorScreen } from '@/components/calculator/CalculatorScreen'
import { CourtManagementView } from '@/components/courts/CourtManagementView'
import { SessionHistoryView } from '@/components/history/SessionHistoryView'
import { LandingPageView } from '@/components/landing/LandingPageView'
import { type NavTabId } from '@/components/layout/bottom-nav'
import { MobileAppShell } from '@/components/layout/mobile-app-shell'
import { MemberManagementView } from '@/components/members/MemberManagementView'
import { ProfileSettingsView } from '@/components/settings/ProfileSettingsView'
import { TechniqueView } from '@/components/technique/TechniqueView'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { AuthProvider, useAuth } from '@/context/AuthContext'
import type { SessionDetailResponse } from '@/lib/api'
import { syncOfflineQueue } from '@/lib/offlineQueue'
import { useTheme } from '@/lib/theme'
import { ToastProvider, useToast } from '@/lib/toast'

function AppContent() {
  const [viewMode, setViewMode] = useState<'landing' | 'app'>('landing')
  const [activeTab, setActiveTab] = useState<NavTabId>('calculator')
  const [replaySession, setReplaySession] = useState<SessionDetailResponse | null>(null)
  const { success } = useToast()
  const { resolved: theme, toggle: toggleTheme } = useTheme()
  const { host, isAuthenticated, isLoginModalOpen, openLoginModal, closeLoginModal } = useAuth()

  // Auto transition to app if user logs in
  useEffect(() => {
    if (isAuthenticated) {
      setViewMode('app')
    }
  }, [isAuthenticated])

  // Listen for online events to automatically sync queued offline sessions
  useEffect(() => {
    const handleOnline = async () => {
      await syncOfflineQueue((count) => {
        success(
          'Đã đồng bộ dữ liệu',
          `Đã tự động gửi ${count} buổi chơi lưu ngoại tuyến lên máy chủ.`
        )
      })
    }

    window.addEventListener('online', handleOnline)
    // Attempt initial sync on load if online
    if (navigator.onLine) {
      handleOnline()
    }
    return () => {
      window.removeEventListener('online', handleOnline)
    }
  }, [success])

  const handleReplayInCalculator = (session: SessionDetailResponse) => {
    setReplaySession(session)
    setActiveTab('calculator')
  }

  const getInitials = (name: string) => {
    if (!name) return 'HB'
    const parts = name.trim().split(' ')
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }

  return (
    <>
      {viewMode === 'landing' ? (
        <LandingPageView
          onEnterApp={() => setViewMode('app')}
          onOpenLogin={openLoginModal}
          isAuthenticated={isAuthenticated}
          hostName={host?.full_name}
        />
      ) : (
        <MobileAppShell
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onLogoClick={() => setViewMode('landing')}
          headerTitle="Host Badminton"
          headerRight={
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={toggleTheme}
                className="flex h-11 w-11 items-center justify-center rounded-xl bg-surface hover:bg-raised text-fg-muted hover:text-fg transition-colors border border-line"
                aria-label={theme === 'dark' ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'}
                title={theme === 'dark' ? 'Giao diện sáng' : 'Giao diện tối'}
              >
                {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>

              <button
                type="button"
                onClick={() => setViewMode('landing')}
                className="flex h-11 w-11 items-center justify-center rounded-xl bg-surface hover:bg-raised text-fg-muted hover:text-fg transition-colors border border-line"
                aria-label="Về trang giới thiệu"
                title="Về trang giới thiệu"
              >
                <Home className="w-4 h-4" />
              </button>

              {isAuthenticated && host ? (
                <button
                  type="button"
                  onClick={() => setActiveTab('settings')}
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-surface hover:bg-raised transition-colors border border-line"
                  aria-label="Quản lý hồ sơ"
                  title="Quản lý hồ sơ"
                >
                  <Avatar className="h-7 w-7 border border-line">
                    {host.avatar_url ? (
                      <AvatarImage src={host.avatar_url} alt={host.full_name} />
                    ) : null}
                    <AvatarFallback className="bg-raised text-fg text-[10px] font-bold">
                      {getInitials(host.full_name)}
                    </AvatarFallback>
                  </Avatar>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={openLoginModal}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-volt hover:bg-volt-hover text-ink text-xs font-medium transition-all shadow-xs active:scale-95"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Đăng nhập</span>
                </button>
              )}
            </div>
          }
        >
          {activeTab === 'calculator' && (
            <CalculatorScreen
              initialReplaySession={replaySession}
              onClearReplaySession={() => setReplaySession(null)}
              onSavedToHistory={() => {
                // Optional callback
              }}
            />
          )}

          {activeTab === 'sessions' && (
            <div className="max-w-lg mx-auto w-full px-4 pt-2">
              <SessionHistoryView
                onReplayInCalculator={handleReplayInCalculator}
                onNavigateToCalculator={() => setActiveTab('calculator')}
              />
            </div>
          )}

          {activeTab === 'courts' && (
            <div className="max-w-lg mx-auto w-full px-4 pt-2">
              <CourtManagementView />
            </div>
          )}

          {activeTab === 'members' && (
            <div className="max-w-lg mx-auto w-full px-4 pt-2">
              <MemberManagementView />
            </div>
          )}

          {activeTab === 'technique' && (
            <div className="max-w-lg mx-auto w-full px-4 pt-2">
              <TechniqueView />
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="max-w-lg mx-auto w-full px-4 pt-2">
              <ProfileSettingsView />
            </div>
          )}
        </MobileAppShell>
      )}

      {/* Global Login Sheet */}
      <LoginSheet open={isLoginModalOpen} onOpenChange={closeLoginModal} />
    </>
  )
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ToastProvider>
  )
}
