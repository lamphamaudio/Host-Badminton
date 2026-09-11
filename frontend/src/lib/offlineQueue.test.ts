import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  enqueueOfflineSession,
  getOfflineQueue,
  removeOfflineSessionAtIndex,
  syncOfflineQueue,
} from './offlineQueue'
import * as api from './api'

describe('offlineQueue utility', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  // covers: AC-8
  it('enqueues, retrieves, and removes offline sessions in localStorage', () => {
    const sessionPayload: api.SessionCreatePayload = {
      session_date: '2026-09-10',
      court_fee: 150000,
      shuttlecock_fee: 50000,
      total_expenses: 200000,
      gender_split_mode: 'equal',
      expenses: [],
      participants: [
        {
          display_name: 'Player 1',
          gender: 'male',
          play_stage: 'full',
          calculated_fee: 100000,
          is_paid: false,
        },
      ],
    }

    expect(getOfflineQueue()).toEqual([])

    enqueueOfflineSession(sessionPayload)
    expect(getOfflineQueue().length).toBe(1)
    expect(getOfflineQueue()[0].court_fee).toBe(150000)

    removeOfflineSessionAtIndex(0)
    expect(getOfflineQueue()).toEqual([])
  })

  // covers: AC-8
  it('syncs offline sessions when connection is available', async () => {
    const sessionPayload: api.SessionCreatePayload = {
      session_date: '2026-09-10',
      court_fee: 150000,
      shuttlecock_fee: 50000,
      total_expenses: 200000,
      gender_split_mode: 'equal',
      expenses: [],
      participants: [],
    }
    enqueueOfflineSession(sessionPayload)

    const createSpy = vi.spyOn(api, 'createSession').mockResolvedValue({
      id: 'mock-uuid',
      host_id: 'host-uuid',
      session_date: '2026-09-10',
      status: 'completed',
      court_fee: 150000,
      shuttlecock_fee: 50000,
      total_expenses: 200000,
      gender_split_mode: 'equal',
      is_multi_stage: false,
      stage1_cost: 0,
      stage2_cost: 0,
      participant_count: 0,
      paid_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      expenses: [],
      participants: [],
    })

    const onSynced = vi.fn()
    const result = await syncOfflineQueue(onSynced)

    expect(createSpy).toHaveBeenCalledTimes(1)
    expect(result.successCount).toBe(1)
    expect(result.failedCount).toBe(0)
    expect(onSynced).toHaveBeenCalledWith(1)
    expect(getOfflineQueue()).toEqual([])
  })
})
