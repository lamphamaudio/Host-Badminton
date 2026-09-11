import React, { createContext, useContext, useEffect, useState } from 'react'
import {
  claimGuestData,
  fetchCurrentHost,
  HostUpdatePayload,
  loginWithGoogle as apiLoginWithGoogle,
  logoutAuth,
  sendPhoneOTP as apiSendPhoneOTP,
  updateCurrentHost as apiUpdateCurrentHost,
  verifyPhoneOTP as apiVerifyPhoneOTP,
} from '../lib/api'
import {
  clearTokens,
  getAccessToken,
  getGuestHostId,
  getRefreshToken,
  getSavedProfile,
  HostProfile,
  setSavedProfile,
  setTokens,
} from '../lib/authStorage'
import { showToast } from '../lib/toast'

export interface AuthContextType {
  host: HostProfile | null
  isAuthenticated: boolean
  isLoading: boolean
  isLoginModalOpen: boolean
  openLoginModal: () => void
  closeLoginModal: () => void
  loginWithGoogle: (credentialToken: string) => Promise<void>
  sendPhoneOTP: (phone: string) => Promise<{ message: string; expires_in: number }>
  verifyPhoneOTP: (phone: string, code: string) => Promise<void>
  updateProfile: (data: HostUpdatePayload) => Promise<HostProfile>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [host, setHost] = useState<HostProfile | null>(() => getSavedProfile())
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false)

  const openLoginModal = () => setIsLoginModalOpen(true)
  const closeLoginModal = () => setIsLoginModalOpen(false)

  // Initialize and verify authentication state on mount
  useEffect(() => {
    let isMounted = true
    const initAuth = async () => {
      const accessToken = getAccessToken()
      if (accessToken) {
        try {
          const profile = await fetchCurrentHost()
          if (isMounted) {
            setHost(profile)
            setSavedProfile(profile)
          }
        } catch (err) {
          console.warn('Initial session validation failed', err)
          if (!getRefreshToken()) {
            if (isMounted) {
              setHost(null)
              setSavedProfile(null)
              clearTokens()
            }
          }
        }
      }
      if (isMounted) {
        setIsLoading(false)
      }
    }

    initAuth()
    return () => {
      isMounted = false
    }
  }, [])

  // Helper to handle post-login state and claim guest records
  const handleAuthSuccess = async (authHost: HostProfile, accessToken: string, refreshToken: string) => {
    setTokens(accessToken, refreshToken)
    setHost(authHost)
    setSavedProfile(authHost)
    setIsLoginModalOpen(false)

    // Attempt to migrate any guest venues or sessions
    try {
      const guestId = getGuestHostId()
      if (guestId && guestId !== authHost.id) {
        const claimRes = await claimGuestData(guestId)
        if (claimRes.claimed_venues > 0 || claimRes.claimed_sessions > 0) {
          showToast(
            `Đã đồng bộ ${claimRes.claimed_venues} sân và ${claimRes.claimed_sessions} trận đấu vào tài khoản`,
            'success'
          )
        }
      }
    } catch (e) {
      console.warn('Guest data claiming skipped or failed', e)
    }

    showToast(`Xin chào ${authHost.full_name}!`, 'success')
  }

  const loginWithGoogle = async (credentialToken: string) => {
    setIsLoading(true)
    try {
      const res = await apiLoginWithGoogle(credentialToken)
      await handleAuthSuccess(res.host, res.access_token, res.refresh_token)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Đăng nhập Google không thành công'
      showToast(message, 'error')
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const sendPhoneOTP = async (phone: string) => {
    try {
      return await apiSendPhoneOTP(phone)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Gửi mã OTP thất bại'
      showToast(message, 'error')
      throw err
    }
  }

  const verifyPhoneOTP = async (phone: string, code: string) => {
    setIsLoading(true)
    try {
      const res = await apiVerifyPhoneOTP(phone, code)
      await handleAuthSuccess(res.host, res.access_token, res.refresh_token)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Xác thực OTP thất bại'
      showToast(message, 'error')
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const updateProfile = async (data: HostUpdatePayload) => {
    try {
      const updated = await apiUpdateCurrentHost(data)
      setHost(updated)
      setSavedProfile(updated)
      showToast('Đã lưu thông tin hồ sơ và tài khoản nhận tiền', 'success')
      return updated
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Cập nhật thông tin thất bại'
      showToast(message, 'error')
      throw err
    }
  }

  const logout = async () => {
    const refreshToken = getRefreshToken()
    if (refreshToken) {
      try {
        await logoutAuth(refreshToken)
      } catch (e) {
        console.warn('Logout revocation error', e)
      }
    }
    clearTokens()
    setHost(null)
    setSavedProfile(null)
    showToast('Đã đăng xuất tài khoản', 'info')
  }

  return (
    <AuthContext.Provider
      value={{
        host,
        isAuthenticated: !!host,
        isLoading,
        isLoginModalOpen,
        openLoginModal,
        closeLoginModal,
        loginWithGoogle,
        sendPhoneOTP,
        verifyPhoneOTP,
        updateProfile,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
