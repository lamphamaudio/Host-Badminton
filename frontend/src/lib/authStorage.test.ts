import { beforeEach, describe, expect, it } from 'vitest'
import {
  ACCESS_TOKEN_KEY,
  clearTokens,
  getAccessToken,
  getGuestHostId,
  getRefreshToken,
  getSavedProfile,
  GUEST_HOST_ID_KEY,
  HOST_PROFILE_KEY,
  REFRESH_TOKEN_KEY,
  setSavedProfile,
  setTokens,
  type HostProfile,
} from './authStorage'

describe('authStorage helper functions', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('manages access and refresh tokens correctly in local storage', () => {
    expect(getAccessToken()).toBeNull()
    expect(getRefreshToken()).toBeNull()

    setTokens('access-token-xyz', 'refresh-token-abc')
    expect(getAccessToken()).toBe('access-token-xyz')
    expect(getRefreshToken()).toBe('refresh-token-abc')
    expect(localStorage.getItem(ACCESS_TOKEN_KEY)).toBe('access-token-xyz')
    expect(localStorage.getItem(REFRESH_TOKEN_KEY)).toBe('refresh-token-abc')

    clearTokens()
    expect(getAccessToken()).toBeNull()
    expect(getRefreshToken()).toBeNull()
    expect(localStorage.getItem(ACCESS_TOKEN_KEY)).toBeNull()
    expect(localStorage.getItem(REFRESH_TOKEN_KEY)).toBeNull()
  })

  it('manages host profile storage and safely handles invalid json', () => {
    expect(getSavedProfile()).toBeNull()

    const mockProfile: HostProfile = {
      id: 'host-123',
      full_name: 'Nguyen Van Host',
      phone: '0987654321',
      email: 'host@example.com',
      avatar_url: 'https://example.com/avatar.png',
      bank_bin: '970436',
      bank_name: 'Vietcombank',
      bank_account_number: '1234567890',
      bank_account_name: 'NGUYEN VAN HOST',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    setSavedProfile(mockProfile)
    expect(getSavedProfile()).toEqual(mockProfile)

    setSavedProfile(null)
    expect(getSavedProfile()).toBeNull()
    expect(localStorage.getItem(HOST_PROFILE_KEY)).toBeNull()

    // Test corrupted JSON in localStorage
    localStorage.setItem(HOST_PROFILE_KEY, '{invalid-json')
    expect(getSavedProfile()).toBeNull()
  })

  it('generates, persists, and reuses a unique guest host id', () => {
    expect(localStorage.getItem(GUEST_HOST_ID_KEY)).toBeNull()

    const guestId1 = getGuestHostId()
    expect(guestId1).toBeTruthy()
    expect(typeof guestId1).toBe('string')
    expect(localStorage.getItem(GUEST_HOST_ID_KEY)).toBe(guestId1)

    // Second call should return the exact same persisted guest id
    const guestId2 = getGuestHostId()
    expect(guestId2).toBe(guestId1)
  })
})
