import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { SessionHistoryView } from './SessionHistoryView'
import * as api from '@/lib/api'

describe('SessionHistoryView component', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  // covers: AC-4, AC-5
  it('renders session summary stats and session list cards', async () => {
    const mockSessions: api.SessionSummary[] = [
      {
        id: 's1',
        host_id: 'h1',
        venue_name: 'Sân Kỳ Hòa',
        session_date: '2026-09-10',
        status: 'completed',
        court_fee: 150000,
        shuttlecock_fee: 60000,
        total_expenses: 210000,
        gender_split_mode: 'equal',
        is_multi_stage: false,
        stage1_cost: 0,
        stage2_cost: 0,
        participant_count: 6,
        paid_count: 4,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ]

    vi.spyOn(api, 'fetchSessions').mockResolvedValue({
      items: mockSessions,
      total_count: 1,
      total_revenue: 210000,
      total_participants: 6,
      limit: 20,
      offset: 0,
    })
    vi.spyOn(api, 'fetchVenues').mockResolvedValue([])

    render(
      <SessionHistoryView
        onReplayInCalculator={vi.fn()}
        onNavigateToCalculator={vi.fn()}
      />
    )

    expect(screen.getByText('Lịch Sử Buổi Chơi')).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText(/Sân Kỳ Hòa/)).toBeInTheDocument()
      expect(screen.getAllByText(/210\.000/).length).toBeGreaterThan(0)
      expect(screen.getByText(/đã trả/)).toBeInTheDocument()
    })
  })

  // covers: AC-6, AC-7
  it('opens session detail and triggers replay callback', async () => {
    const mockSessionSummary: api.SessionSummary = {
      id: 's1',
      host_id: 'h1',
      venue_name: 'Sân Kỳ Hòa',
      session_date: '2026-09-10',
      status: 'completed',
      court_fee: 150000,
      shuttlecock_fee: 60000,
      total_expenses: 210000,
      gender_split_mode: 'equal',
      is_multi_stage: false,
      stage1_cost: 0,
      stage2_cost: 0,
      participant_count: 2,
      paid_count: 2,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const mockDetail: api.SessionDetailResponse = {
      ...mockSessionSummary,
      expenses: [],
      participants: [
        {
          id: 'p1',
          display_name: 'Nam 1',
          gender: 'male',
          play_stage: 'full',
          calculated_fee: 105000,
          is_paid: true,
        },
        {
          id: 'p2',
          display_name: 'Nữ 1',
          gender: 'female',
          play_stage: 'full',
          calculated_fee: 105000,
          is_paid: true,
        },
      ],
    }

    vi.spyOn(api, 'fetchSessions').mockResolvedValue({
      items: [mockSessionSummary],
      total_count: 1,
      total_revenue: 210000,
      total_participants: 2,
      limit: 20,
      offset: 0,
    })
    vi.spyOn(api, 'fetchVenues').mockResolvedValue([])
    vi.spyOn(api, 'fetchSessionDetail').mockResolvedValue(mockDetail)

    const onReplayMock = vi.fn()

    render(
      <SessionHistoryView
        onReplayInCalculator={onReplayMock}
        onNavigateToCalculator={vi.fn()}
      />
    )

    await waitFor(() => {
      expect(screen.getByText(/Sân Kỳ Hòa/)).toBeInTheDocument()
    })

    // Click on session card to open detail
    fireEvent.click(screen.getByText(/Sân Kỳ Hòa/))

    await waitFor(() => {
      expect(screen.getByText('Nạp vào máy tính')).toBeInTheDocument()
    })

    // Click Replay in Calculator
    fireEvent.click(screen.getByText('Nạp vào máy tính'))
    expect(onReplayMock).toHaveBeenCalledWith(mockDetail)
  })
})
