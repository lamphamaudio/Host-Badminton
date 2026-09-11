/**
 * Storage helpers for authentication tokens, host profile, and guest ID.
 */

export const ACCESS_TOKEN_KEY = 'host_badminton_access_token'
export const REFRESH_TOKEN_KEY = 'host_badminton_refresh_token'
export const HOST_PROFILE_KEY = 'host_badminton_host_profile'
export const GUEST_HOST_ID_KEY = 'host_badminton_guest_host_id'

export interface HostProfile {
  id: string
  full_name: string
  phone?: string | null
  email?: string | null
  avatar_url?: string | null
  bank_bin?: string | null
  bank_name?: string | null
  bank_account_number?: string | null
  bank_account_name?: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(ACCESS_TOKEN_KEY)
}

export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(REFRESH_TOKEN_KEY)
}

export function setTokens(accessToken: string, refreshToken: string): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken)
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
}

export function clearTokens(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
  localStorage.removeItem(HOST_PROFILE_KEY)
}

export function getSavedProfile(): HostProfile | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(HOST_PROFILE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function setSavedProfile(profile: HostProfile | null): void {
  if (typeof window === 'undefined') return
  if (profile) {
    localStorage.setItem(HOST_PROFILE_KEY, JSON.stringify(profile))
  } else {
    localStorage.removeItem(HOST_PROFILE_KEY)
  }
}

export function getGuestHostId(): string {
  if (typeof window === 'undefined') return '00000000-0000-0000-0000-000000000000'
  let id = localStorage.getItem(GUEST_HOST_ID_KEY)
  if (!id) {
    id = crypto.randomUUID ? crypto.randomUUID() : `guest-${Date.now()}`
    localStorage.setItem(GUEST_HOST_ID_KEY, id)
  }
  return id
}
