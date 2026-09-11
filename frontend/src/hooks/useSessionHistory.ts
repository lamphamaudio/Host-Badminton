import { useCallback, useEffect, useState } from 'react'
import {
  deleteSession,
  fetchSessions,
  type SessionListResponse,
  type SessionSummary,
} from '@/lib/api'

export interface SessionHistoryFilters {
  startDate?: string
  endDate?: string
  venueId?: string
  status?: string
}

export function useSessionHistory() {
  const [sessions, setSessions] = useState<SessionSummary[]>([])
  const [totalCount, setTotalCount] = useState<number>(0)
  const [totalRevenue, setTotalRevenue] = useState<number>(0)
  const [totalParticipants, setTotalParticipants] = useState<number>(0)
  const [limit] = useState<number>(20)
  const [offset, setOffset] = useState<number>(0)
  const [filters, setFilters] = useState<SessionHistoryFilters>({})
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const loadSessions = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data: SessionListResponse = await fetchSessions({
        limit,
        offset,
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
        venueId: filters.venueId || undefined,
        status: filters.status || undefined,
      })
      setSessions(data.items)
      setTotalCount(data.total_count)
      setTotalRevenue(data.total_revenue)
      setTotalParticipants(data.total_participants)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Lỗi tải lịch sử buổi chơi'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }, [limit, offset, filters])

  useEffect(() => {
    loadSessions()
  }, [loadSessions])

  const updateFilters = (newFilters: Partial<SessionHistoryFilters>) => {
    setOffset(0)
    setFilters((prev) => ({ ...prev, ...newFilters }))
  }

  const removeSessionItem = async (id: string) => {
    await deleteSession(id)
    setSessions((prev) => prev.filter((s) => s.id !== id))
    setTotalCount((prev) => Math.max(0, prev - 1))
  }

  return {
    sessions,
    totalCount,
    totalRevenue,
    totalParticipants,
    limit,
    offset,
    setOffset,
    filters,
    updateFilters,
    isLoading,
    error,
    refetch: loadSessions,
    removeSession: removeSessionItem,
  }
}
