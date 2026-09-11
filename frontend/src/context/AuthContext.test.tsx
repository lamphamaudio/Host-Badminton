import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthProvider, useAuth } from './AuthContext'
import * as api from '../lib/api'
import { clearTokens, getAccessToken, getRefreshToken, type HostProfile } from '../lib/authStorage'

describe('AuthContext and AuthProvider', () => {
  beforeEach(() => {
    localStorage.clear()
    clearTokens()
    vi.restoreAllMocks()
  })

  it('initializes with unauthenticated guest state when no tokens exist', async () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: ({ children }) => <AuthProvider>{children}</AuthProvider>,
    })

    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.host).toBeNull()
  })

  it('authenticates successfully with Google and sets tokens', async () => {
    const mockHost: HostProfile = {
      id: 'host-uuid-1',
      full_name: 'Nguyễn Văn Google',
      email: 'host@gmail.com',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    vi.spyOn(api, 'loginWithGoogle').mockResolvedValueOnce({
      access_token: 'test-access-token-123',
      refresh_token: 'test-refresh-token-456',
      token_type: 'bearer',
      expires_in: 1800,
      host: mockHost,
    })

    vi.spyOn(api, 'claimGuestData').mockResolvedValueOnce({
      claimed_venues: 2,
      claimed_sessions: 3,
    })

    const { result } = renderHook(() => useAuth(), {
      wrapper: ({ children }) => <AuthProvider>{children}</AuthProvider>,
    })

    await act(async () => {
      await result.current.loginWithGoogle('mock-credential-token')
    })

    expect(result.current.isAuthenticated).toBe(true)
    expect(result.current.host?.full_name).toBe('Nguyễn Văn Google')
    expect(getAccessToken()).toBe('test-access-token-123')
    expect(getRefreshToken()).toBe('test-refresh-token-456')
  })

  it('authenticates with Phone OTP and logs out cleanly', async () => {
    const mockHost: HostProfile = {
      id: 'host-uuid-phone',
      full_name: 'Host 4321',
      phone: '0987654321',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    vi.spyOn(api, 'verifyPhoneOTP').mockResolvedValueOnce({
      access_token: 'phone-access-token',
      refresh_token: 'phone-refresh-token',
      token_type: 'bearer',
      expires_in: 1800,
      host: mockHost,
    })

    vi.spyOn(api, 'logoutAuth').mockResolvedValueOnce()

    const { result } = renderHook(() => useAuth(), {
      wrapper: ({ children }) => <AuthProvider>{children}</AuthProvider>,
    })

    await act(async () => {
      await result.current.verifyPhoneOTP('0987654321', '123456')
    })

    expect(result.current.isAuthenticated).toBe(true)
    expect(result.current.host?.phone).toBe('0987654321')

    await act(async () => {
      await result.current.logout()
    })

    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.host).toBeNull()
    expect(getAccessToken()).toBeNull()
    expect(getRefreshToken()).toBeNull()
  })
})
