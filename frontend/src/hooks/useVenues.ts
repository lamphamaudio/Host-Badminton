import { useCallback, useEffect, useState } from 'react'
import {
  createVenue,
  deleteVenue,
  fetchVenues,
  updateVenue,
  type Venue,
  type VenueCreate,
  type VenueUpdate,
} from '@/lib/api'

export function useVenues(includeInactive = false) {
  const [venues, setVenues] = useState<Venue[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const loadVenues = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await fetchVenues(includeInactive)
      setVenues(data)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Lỗi tải danh sách sân'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }, [includeInactive])

  useEffect(() => {
    loadVenues()
  }, [loadVenues])

  const addVenue = async (venueData: VenueCreate): Promise<Venue> => {
    const created = await createVenue(venueData)
    setVenues((prev) => [created, ...prev])
    return created
  }

  const editVenue = async (id: string, venueData: VenueUpdate): Promise<Venue> => {
    const updated = await updateVenue(id, venueData)
    setVenues((prev) => prev.map((v) => (v.id === id ? updated : v)))
    return updated
  }

  const removeVenue = async (id: string): Promise<Venue> => {
    const deactivated = await deleteVenue(id)
    if (!includeInactive) {
      setVenues((prev) => prev.filter((v) => v.id !== id))
    } else {
      setVenues((prev) => prev.map((v) => (v.id === id ? deactivated : v)))
    }
    return deactivated
  }

  return {
    venues,
    isLoading,
    error,
    refetch: loadVenues,
    addVenue,
    editVenue,
    removeVenue,
  }
}
