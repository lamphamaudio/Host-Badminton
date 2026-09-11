import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'
import { useMembers } from './useMembers'
import * as api from '@/lib/api'

describe('useMembers hook', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  // covers: AC-1, AC-5
  it('loads members on mount and supports add, edit, remove, and settle debt', async () => {
    const mockMembers: api.Member[] = [
      {
        id: 'm1',
        host_id: 'h1',
        name: 'Nguyễn Văn A',
        phone: '0901234567',
        gender: 'male',
        default_note: 'Đánh đôi',
        total_debt: 100000,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ]

    vi.spyOn(api, 'fetchMembers').mockResolvedValue(mockMembers)

    const createSpy = vi.spyOn(api, 'createMember').mockResolvedValue({
      id: 'm2',
      host_id: 'h1',
      name: 'Trần Thị B',
      phone: '0912345678',
      gender: 'female',
      total_debt: 0,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })

    const updateSpy = vi.spyOn(api, 'updateMember').mockResolvedValue({
      id: 'm1',
      host_id: 'h1',
      name: 'Nguyễn Văn A (Pro)',
      phone: '0901234567',
      gender: 'male',
      total_debt: 100000,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })

    const deleteSpy = vi.spyOn(api, 'deleteMember').mockResolvedValue()

    const settleSpy = vi.spyOn(api, 'settleMemberDebt').mockResolvedValue({
      member_id: 'm1',
      settled_amount: 100000,
      remaining_debt: 0,
      settled_records_count: 1,
      note: 'Chuyển khoản VietQR',
    })

    const { result } = renderHook(() => useMembers(false))

    expect(result.current.isLoading).toBe(true)

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
      expect(result.current.members.length).toBe(1)
    })

    // Test addMember
    await act(async () => {
      await result.current.addMember({
        name: 'Trần Thị B',
        phone: '0912345678',
        gender: 'female',
      })
    })
    expect(createSpy).toHaveBeenCalled()
    expect(result.current.members.length).toBe(2)

    // Test editMember
    await act(async () => {
      await result.current.editMember('m1', { name: 'Nguyễn Văn A (Pro)' })
    })
    expect(updateSpy).toHaveBeenCalled()
    expect(result.current.members.find((m) => m.id === 'm1')?.name).toBe('Nguyễn Văn A (Pro)')

    // Test settleDebt
    await act(async () => {
      await result.current.settleDebt('m1', { amount: 100000, note: 'Chuyển khoản VietQR' })
    })
    expect(settleSpy).toHaveBeenCalled()
    expect(result.current.members.find((m) => m.id === 'm1')?.total_debt).toBe(0)

    // Test removeMember
    await act(async () => {
      await result.current.removeMember('m1')
    })
    expect(deleteSpy).toHaveBeenCalled()
    expect(result.current.members.find((m) => m.id === 'm1')).toBeUndefined()
  })
})
