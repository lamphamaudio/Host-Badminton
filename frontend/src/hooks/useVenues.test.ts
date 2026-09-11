import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'
import { useVenues } from './useVenues'
import * as api from '@/lib/api'

describe('useVenues hook', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  // covers: AC-1
  it('loads venues on mount and supports add, edit, remove', async () => {
    const mockVenues: api.Venue[] = [
      {
        id: 'v1',
        host_id: 'h1',
        name: 'Sân Kỳ Hòa',
        default_court_rate: 140000,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ]

    vi.spyOn(api, 'fetchVenues').mockResolvedValue(mockVenues)
    const createSpy = vi.spyOn(api, 'createVenue').mockResolvedValue({
      id: 'v2',
      host_id: 'h1',
      name: 'Sân Lan Anh',
      default_court_rate: 160000,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    const updateSpy = vi.spyOn(api, 'updateVenue').mockResolvedValue({
      id: 'v1',
      host_id: 'h1',
      name: 'Sân Kỳ Hòa Updated',
      default_court_rate: 150000,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    const deleteSpy = vi.spyOn(api, 'deleteVenue').mockResolvedValue({
      id: 'v1',
      host_id: 'h1',
      name: 'Sân Kỳ Hòa',
      is_active: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })

    const { result } = renderHook(() => useVenues(false))

    expect(result.current.isLoading).toBe(true)

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
      expect(result.current.venues.length).toBe(1)
    })

    // Test addVenue
    await act(async () => {
      await result.current.addVenue({ name: 'Sân Lan Anh', default_court_rate: 160000 })
    })
    expect(createSpy).toHaveBeenCalled()
    expect(result.current.venues.length).toBe(2)

    // Test editVenue
    await act(async () => {
      await result.current.editVenue('v1', { name: 'Sân Kỳ Hòa Updated' })
    })
    expect(updateSpy).toHaveBeenCalled()
    expect(result.current.venues.find((v) => v.id === 'v1')?.name).toBe('Sân Kỳ Hòa Updated')

    // Test removeVenue
    await act(async () => {
      await result.current.removeVenue('v1')
    })
    expect(deleteSpy).toHaveBeenCalled()
    expect(result.current.venues.find((v) => v.id === 'v1')).toBeUndefined()
  })
})
