import { useCallback, useEffect, useState } from 'react'
import {
  createMember,
  deleteMember,
  fetchMemberDetail,
  fetchMembers,
  settleMemberDebt,
  updateMember,
  type Member,
  type MemberCreate,
  type MemberDetail,
  type MemberUpdate,
  type SettleDebtRequest,
  type SettleDebtResponse,
} from '@/lib/api'

export function useMembers(initialActiveOnly = true) {
  const [members, setMembers] = useState<Member[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [activeOnly, setActiveOnly] = useState<boolean>(initialActiveOnly)

  const loadMembers = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await fetchMembers({
        search: searchQuery.trim() || undefined,
        activeOnly: activeOnly,
      })
      setMembers(data)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Lỗi tải danh sách thành viên'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }, [searchQuery, activeOnly])

  useEffect(() => {
    loadMembers()
  }, [loadMembers])

  const addMember = async (memberData: MemberCreate): Promise<Member> => {
    const created = await createMember(memberData)
    setMembers((prev) => [created, ...prev])
    return created
  }

  const editMember = async (id: string, memberData: MemberUpdate): Promise<Member> => {
    const updated = await updateMember(id, memberData)
    setMembers((prev) => prev.map((m) => (m.id === id ? updated : m)))
    return updated
  }

  const removeMember = async (id: string): Promise<void> => {
    await deleteMember(id)
    setMembers((prev) => prev.filter((m) => m.id !== id))
  }

  const settleDebt = async (
    memberId: string,
    data: SettleDebtRequest
  ): Promise<SettleDebtResponse> => {
    const result = await settleMemberDebt(memberId, data)
    setMembers((prev) =>
      prev.map((m) => (m.id === memberId ? { ...m, total_debt: result.remaining_debt } : m))
    )
    return result
  }

  const getMemberDetails = async (id: string): Promise<MemberDetail> => {
    return fetchMemberDetail(id)
  }

  return {
    members,
    isLoading,
    error,
    searchQuery,
    setSearchQuery,
    activeOnly,
    setActiveOnly,
    refetch: loadMembers,
    addMember,
    editMember,
    removeMember,
    settleDebt,
    getMemberDetails,
  }
}
