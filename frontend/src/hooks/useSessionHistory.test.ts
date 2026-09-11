import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'
import { useSessionHistory } from './useSessionHistory'
import * as api from '@/lib/api'

describe('useSessionHistory hook', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  // covers: AC-4, AC-5
  it('loads sessions on mount and updates filters', async () => {
    const mockSessions: api.SessionSummary[] = [
      {
        id: 's1',
        host_id: 'h1',
        venue_name: 'Sân Kỳ Hòa',
        session_date: '2026-09-10',
        status: 'completed',
        court_fee: 140000,
        shuttlecock_fee: 50000,
        total_expenses: 190000,
        gender_split_mode: 'equal',
        is_multi_stage: false,
        stage1_cost: 0,
        stage2_cost: 0,
        participant_count: 4,
        paid_count: 2,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ]

    const fetchSpy = vi.spyOn(api, 'fetchSessions').mockResolvedValue({
      items: mockSessions,
      total_count: 1,
      total_revenue: 190000,
      total_participants: 4,
      limit: 20,
      offset: 0,
    })

    const { result } = renderHook(() => useSessionHistory())

    expect(result.current.isLoading).toBe(true)

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
      expect(result.current.sessions.length).toBe(1)
      expect(result.current.totalRevenue).toBe(190000)
      expect(result.current.totalParticipants).toBe(4)
    })

    // Test filter update
    act(() => {
      result.current.updateFilters({ startDate: '2026-09-01' })
    })

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.objectContaining({ startDate: '2026-09-01' })
      )
    })
  })
})
