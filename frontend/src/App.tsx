import { useEffect, useState } from 'react'
import { Home, LogIn } from 'lucide-react'
import { LoginSheet } from '@/components/auth/LoginSheet'
import { CalculatorScreen } from '@/components/calculator/CalculatorScreen'
import { CourtManagementView } from '@/components/courts/CourtManagementView'
import { SessionHistoryView } from '@/components/history/SessionHistoryView'
import { LandingPageView } from '@/components/landing/LandingPageView'
import { type NavTabId } from '@/components/layout/bottom-nav'
import { MobileAppShell } from '@/components/layout/mobile-app-shell'
import { MemberManagementView } from '@/components/members/MemberManagementView'
import { ProfileSettingsView } from '@/components/settings/ProfileSettingsView'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { AuthProvider, useAuth } from '@/context/AuthContext'
import type { SessionDetailResponse } from '@/lib/api'
import { syncOfflineQueue } from '@/lib/offlineQueue'
import { ToastProvider, useToast } from '@/lib/toast'

function AppContent() {
  const [viewMode, setViewMode] = useState<'landing' | 'app'>('landing')
  const [activeTab, setActiveTab] = useState<NavTabId>('calculator')
  const [replaySession, setReplaySession] = useState<SessionDetailResponse | null>(null)
  const { success } = useToast()
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
          headerSubtitle={
            activeTab === 'calculator'
              ? 'Tính tiền sân & Tạo VietQR'
              : activeTab === 'sessions'
                ? 'Lịch sử buổi chơi'
                : activeTab === 'courts'
                  ? 'Quản lý sân cầu lông'
                  : activeTab === 'members'
                    ? 'Thành viên & Sổ nợ'
                    : 'Hồ sơ & Tài khoản VietQR'
          }
          headerRight={
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setViewMode('landing')}
                className="p-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors border border-slate-700/80"
                title="Về trang giới thiệu"
              >
                <Home className="w-4 h-4" />
              </button>

              {isAuthenticated && host ? (
                <button
                  type="button"
                  onClick={() => setActiveTab('settings')}
                  className="flex items-center gap-1.5 p-1 rounded-full bg-slate-800/80 hover:bg-slate-700 transition-colors border border-slate-700"
                  title="Quản lý hồ sơ"
                >
                  <Avatar className="h-7 w-7 border border-emerald-500/40">
                    {host.avatar_url ? (
                      <AvatarImage src={host.avatar_url} alt={host.full_name} />
                    ) : null}
                    <AvatarFallback className="bg-emerald-950 text-emerald-400 text-[10px] font-bold">
                      {getInitials(host.full_name)}
                    </AvatarFallback>
                  </Avatar>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={openLoginModal}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold transition-all shadow-sm active:scale-95"
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
