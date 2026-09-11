import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  HostProfile,
  setTokens,
} from './authStorage'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'

export interface HealthResponse {
  status: string
  app_name: string
  version: string
  timestamp: string
}

export interface Venue {
  id: string
  host_id: string
  name: string
  address?: string | null
  court_number?: string | null
  default_court_rate?: number | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface VenueCreate {
  name: string
  address?: string | null
  court_number?: string | null
  default_court_rate?: number | null
  is_active?: boolean
}

export interface VenueUpdate {
  name?: string
  address?: string | null
  court_number?: string | null
  default_court_rate?: number | null
  is_active?: boolean
}

export interface SessionExpenseItem {
  id?: string
  category: string
  item_name: string
  quantity: number
  unit_price: number
  total_amount: number
  created_at?: string
}

export interface SessionParticipantItem {
  id?: string
  member_id?: string | null
  display_name: string
  gender: 'male' | 'female'
  play_stage: 'full' | 'early_leaver' | 'stayer' | 'custom'
  custom_fee_override?: number | null
  calculated_fee: number
  is_paid: boolean
  paid_amount?: number
  payment_method?: string | null
  paid_at?: string | null
  note?: string | null
  created_at?: string
  updated_at?: string
}

export interface SessionCreatePayload {
  venue_id?: string | null
  session_date: string
  start_time?: string | null
  end_time?: string | null
  status?: string
  court_fee: number
  shuttlecock_fee: number
  shuttlecock_count?: number | null
  shuttlecock_unit_price?: number | null
  total_expenses: number
  gender_split_mode: string
  fixed_female_fee?: number | null
  fixed_male_fee?: number | null
  is_multi_stage?: boolean
  stage1_cost?: number
  stage2_cost?: number
  bank_bin?: string | null
  bank_account_number?: string | null
  bank_account_name?: string | null
  vietqr_memo?: string | null
  note?: string | null
  expenses: SessionExpenseItem[]
  participants: SessionParticipantItem[]
}

export interface SessionSummary {
  id: string
  host_id: string
  venue_id?: string | null
  venue_name?: string | null
  session_date: string
  start_time?: string | null
  end_time?: string | null
  status: string
  court_fee: number
  shuttlecock_fee: number
  shuttlecock_count?: number | null
  shuttlecock_unit_price?: number | null
  total_expenses: number
  gender_split_mode: string
  fixed_female_fee?: number | null
  fixed_male_fee?: number | null
  is_multi_stage: boolean
  stage1_cost: number
  stage2_cost: number
  bank_bin?: string | null
  bank_account_number?: string | null
  bank_account_name?: string | null
  vietqr_memo?: string | null
  note?: string | null
  participant_count: number
  paid_count: number
  created_at: string
  updated_at: string
}

export interface SessionListResponse {
  items: SessionSummary[]
  total_count: number
  total_revenue: number
  total_participants: number
  limit: number
  offset: number
}

export interface SessionDetailResponse extends SessionSummary {
  expenses: SessionExpenseItem[]
  participants: SessionParticipantItem[]
}

export interface AuthTokens {
  access_token: string
  refresh_token: string
  token_type: string
  expires_in: number
}

export interface AuthResponse extends AuthTokens {
  host: HostProfile
}

export interface HostUpdatePayload {
  full_name?: string
  phone?: string | null
  email?: string | null
  avatar_url?: string | null
  bank_bin?: string | null
  bank_name?: string | null
  bank_account_number?: string | null
  bank_account_name?: string | null
}

export interface ClaimGuestDataResponse {
  claimed_venues: number
  claimed_sessions: number
}

let isRefreshing = false
let refreshSubscribers: ((token: string) => void)[] = []

function onRefreshed(token: string) {
  refreshSubscribers.forEach((cb) => cb(token))
  refreshSubscribers = []
}

/**
 * Enhanced fetch client with Authorization header attachment and silent token refresh.
 */
export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`
  const headers = new Headers(options.headers || {})

  const accessToken = getAccessToken()
  if (accessToken && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${accessToken}`)
  }
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json')
  }

  const response = await fetch(url, { ...options, headers })

  if (response.status === 401 && getRefreshToken() && !endpoint.includes('/auth/refresh')) {
    if (!isRefreshing) {
      isRefreshing = true
      try {
        const refreshToken = getRefreshToken()!
        const refreshRes = await fetch(`${API_BASE_URL}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh_token: refreshToken }),
        })

        if (!refreshRes.ok) {
          clearTokens()
          isRefreshing = false
          throw new Error('Session expired. Please log in again.')
        }

        const tokenData: AuthTokens = await refreshRes.json()
        setTokens(tokenData.access_token, tokenData.refresh_token)
        isRefreshing = false
        onRefreshed(tokenData.access_token)

        // Retry initial request with new access token
        headers.set('Authorization', `Bearer ${tokenData.access_token}`)
        const retryRes = await fetch(url, { ...options, headers })
        if (!retryRes.ok) {
          throw new Error(`HTTP error status: ${retryRes.status}`)
        }
        if (retryRes.status === 204) return {} as T
        return retryRes.json()
      } catch (err) {
        isRefreshing = false
        clearTokens()
        throw err
      }
    } else {
      // Queue requests while token refresh is in progress
      return new Promise<T>((resolve, reject) => {
        refreshSubscribers.push(async (newToken: string) => {
          try {
            headers.set('Authorization', `Bearer ${newToken}`)
            const retryRes = await fetch(url, { ...options, headers })
            if (!retryRes.ok) {
              throw new Error(`HTTP error status: ${retryRes.status}`)
            }
            if (retryRes.status === 204) {
              resolve({} as T)
            } else {
              resolve(await retryRes.json())
            }
          } catch (e) {
            reject(e)
          }
        })
      })
    }
  }

  if (!response.ok) {
    let errorDetail = `HTTP error status: ${response.status}`
    try {
      const errJson = await response.json()
      if (errJson?.detail) {
        errorDetail = typeof errJson.detail === 'string' ? errJson.detail : JSON.stringify(errJson.detail)
      }
    } catch {
      // ignore
    }
    throw new Error(errorDetail)
  }

  if (response.status === 204) {
    return {} as T
  }

  return response.json()
}

// --- Health API ---
export async function checkBackendHealth(): Promise<HealthResponse> {
  return apiFetch<HealthResponse>('/health')
}

// --- Auth API ---
export async function loginWithGoogle(credentialToken: string): Promise<AuthResponse> {
  return apiFetch<AuthResponse>('/auth/google', {
    method: 'POST',
    body: JSON.stringify({ credential_token: credentialToken }),
  })
}

export async function sendPhoneOTP(phone: string): Promise<{ message: string; expires_in: number }> {
  return apiFetch<{ message: string; expires_in: number }>('/auth/phone/send-otp', {
    method: 'POST',
    body: JSON.stringify({ phone }),
  })
}

export async function verifyPhoneOTP(phone: string, code: string): Promise<AuthResponse> {
  return apiFetch<AuthResponse>('/auth/phone/verify-otp', {
    method: 'POST',
    body: JSON.stringify({ phone, code }),
  })
}

export async function refreshTokens(refreshToken: string): Promise<AuthTokens> {
  return apiFetch<AuthTokens>('/auth/refresh', {
    method: 'POST',
    body: JSON.stringify({ refresh_token: refreshToken }),
  })
}

export async function fetchCurrentHost(): Promise<HostProfile> {
  return apiFetch<HostProfile>('/auth/me')
}

export async function updateCurrentHost(data: HostUpdatePayload): Promise<HostProfile> {
  return apiFetch<HostProfile>('/auth/me', {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export async function claimGuestData(guestHostId: string): Promise<ClaimGuestDataResponse> {
  return apiFetch<ClaimGuestDataResponse>('/auth/claim-guest-data', {
    method: 'POST',
    body: JSON.stringify({ guest_host_id: guestHostId }),
  })
}

export async function logoutAuth(refreshToken: string): Promise<void> {
  await apiFetch<void>('/auth/logout', {
    method: 'POST',
    body: JSON.stringify({ refresh_token: refreshToken }),
  })
}

// --- Venues API ---
export async function fetchVenues(includeInactive = false): Promise<Venue[]> {
  return apiFetch<Venue[]>(`/venues?include_inactive=${includeInactive}`)
}

export async function createVenue(data: VenueCreate): Promise<Venue> {
  return apiFetch<Venue>('/venues', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateVenue(id: string, data: VenueUpdate): Promise<Venue> {
  return apiFetch<Venue>(`/venues/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export async function deleteVenue(id: string): Promise<Venue> {
  return apiFetch<Venue>(`/venues/${id}`, {
    method: 'DELETE',
  })
}

// --- Sessions API ---
export async function fetchSessions(params?: {
  limit?: number
  offset?: number
  startDate?: string
  endDate?: string
  venueId?: string
  status?: string
}): Promise<SessionListResponse> {
  const query = new URLSearchParams()
  if (params?.limit !== undefined) query.set('limit', String(params.limit))
  if (params?.offset !== undefined) query.set('offset', String(params.offset))
  if (params?.startDate) query.set('start_date', params.startDate)
  if (params?.endDate) query.set('end_date', params.endDate)
  if (params?.venueId) query.set('venue_id', params.venueId)
  if (params?.status) query.set('status', params.status)

  return apiFetch<SessionListResponse>(`/sessions?${query.toString()}`)
}

export async function createSession(data: SessionCreatePayload): Promise<SessionDetailResponse> {
  return apiFetch<SessionDetailResponse>('/sessions', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function fetchSessionDetail(id: string): Promise<SessionDetailResponse> {
  return apiFetch<SessionDetailResponse>(`/sessions/${id}`)
}

export async function deleteSession(id: string): Promise<void> {
  return apiFetch<void>(`/sessions/${id}`, {
    method: 'DELETE',
  })
}

// --- Members & Debt API Types & Endpoints ---
export interface Member {
  id: string
  host_id: string
  name: string
  phone?: string | null
  gender: 'male' | 'female'
  default_note?: string | null
  total_debt: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface MemberCreate {
  name: string
  phone?: string | null
  gender: 'male' | 'female'
  default_note?: string | null
  is_active?: boolean
}

export interface MemberUpdate {
  name?: string
  phone?: string | null
  gender?: 'male' | 'female'
  default_note?: string | null
  is_active?: boolean
}

export interface DebtRecord {
  id: string
  host_id: string
  member_id: string
  session_id?: string | null
  amount_owed: number
  amount_paid: number
  status: 'unpaid' | 'partially_paid' | 'settled' | 'forgiven'
  settled_at?: string | null
  note?: string | null
  created_at: string
  updated_at: string
}

export interface MemberDetail extends Member {
  attended_sessions_count: number
  debt_records: DebtRecord[]
}

export interface SettleDebtRequest {
  amount: number
  note?: string | null
  forgive_remainder?: boolean
}

export interface SettleDebtResponse {
  member_id: string
  settled_amount: number
  remaining_debt: number
  settled_records_count: number
  note?: string | null
}

export async function fetchMembers(params?: {
  search?: string
  activeOnly?: boolean
}): Promise<Member[]> {
  const query = new URLSearchParams()
  if (params?.search) query.set('search', params.search)
  if (params?.activeOnly !== undefined) query.set('active_only', String(params.activeOnly))
  const qs = query.toString()
  return apiFetch<Member[]>(`/members${qs ? `?${qs}` : ''}`)
}

export async function createMember(data: MemberCreate): Promise<Member> {
  return apiFetch<Member>('/members', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function fetchMemberDetail(id: string): Promise<MemberDetail> {
  return apiFetch<MemberDetail>(`/members/${id}`)
}

export async function updateMember(id: string, data: MemberUpdate): Promise<Member> {
  return apiFetch<Member>(`/members/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export async function deleteMember(id: string): Promise<void> {
  return apiFetch<void>(`/members/${id}`, {
    method: 'DELETE',
  })
}

export async function fetchMemberDebts(
  memberId: string,
  status?: string,
  limit?: number
): Promise<DebtRecord[]> {
  const query = new URLSearchParams()
  if (status) query.set('status', status)
  if (limit) query.set('limit', String(limit))
  const qs = query.toString()
  return apiFetch<DebtRecord[]>(`/members/${memberId}/debts${qs ? `?${qs}` : ''}`)
}

export async function settleMemberDebt(
  memberId: string,
  data: SettleDebtRequest
): Promise<SettleDebtResponse> {
  return apiFetch<SettleDebtResponse>(`/members/${memberId}/settle`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function fetchDebtRecords(params?: {
  status?: string
  memberId?: string
  limit?: number
  offset?: number
}): Promise<DebtRecord[]> {
  const query = new URLSearchParams()
  if (params?.status) query.set('status', params.status)
  if (params?.memberId) query.set('member_id', params.memberId)
  if (params?.limit !== undefined) query.set('limit', String(params.limit))
  if (params?.offset !== undefined) query.set('offset', String(params.offset))
  const qs = query.toString()
  return apiFetch<DebtRecord[]>(`/debt-records${qs ? `?${qs}` : ''}`)
}
