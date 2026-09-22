import React, { useState } from 'react'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useToast } from '@/lib/toast'
import { useMembers } from '@/hooks/useMembers'
import type { Member, MemberCreate, MemberUpdate, SettleDebtRequest } from '@/lib/api'
import { formatVND } from '@/lib/formatters'
import {
  Phone,
  Plus,
  Search,
  TrendingDown,
  Users,
} from 'lucide-react'
import { MemberDetailDrawer } from './MemberDetailDrawer'
import { MemberFormDrawer } from './MemberFormDrawer'
import { SettleDebtModal } from './SettleDebtModal'

export const MemberManagementView: React.FC = () => {
  const {
    members,
    isLoading,
    error,
    searchQuery,
    setSearchQuery,
    activeOnly,
    setActiveOnly,
    addMember,
    editMember,
    removeMember,
    settleDebt,
    getMemberDetails,
  } = useMembers(false)

  const { success, error: toastError } = useToast()

  const [filterDebtOnly, setFilterDebtOnly] = useState<boolean>(false)
  const [isFormDrawerOpen, setIsFormDrawerOpen] = useState<boolean>(false)
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState<boolean>(false)
  const [isSettleModalOpen, setIsSettleModalOpen] = useState<boolean>(false)

  const [selectedMember, setSelectedMember] = useState<Member | null>(null)
  const [memberToEdit, setMemberToEdit] = useState<Member | null>(null)

  // Filtered members by search, active, and debt filters
  const filteredMembers = members.filter((m) => {
    if (activeOnly && !m.is_active) return false
    if (filterDebtOnly && m.total_debt <= 0) return false
    return true
  })

  // Aggregated total debt across active list
  const totalRosterDebt = members.reduce((sum, m) => sum + (m.total_debt || 0), 0)
  const membersWithDebtCount = members.filter((m) => m.total_debt > 0).length

  const handleOpenCreate = () => {
    setMemberToEdit(null)
    setIsFormDrawerOpen(true)
  }

  const handleOpenEdit = (member: Member) => {
    setMemberToEdit(member)
    setIsDetailDrawerOpen(false)
    setIsFormDrawerOpen(true)
  }

  const handleOpenDetail = (member: Member) => {
    setSelectedMember(member)
    setIsDetailDrawerOpen(true)
  }

  const handleOpenSettle = (member: Member) => {
    setSelectedMember(member)
    setIsSettleModalOpen(true)
  }

  const handleSaveMember = async (data: MemberCreate | MemberUpdate) => {
    try {
      if (memberToEdit) {
        await editMember(memberToEdit.id, data)
        success('Cập nhật thành công', `Đã cập nhật thông tin thành viên ${data.name || ''}`)
      } else {
        await addMember(data as MemberCreate)
        success('Thêm thành viên thành công', `Đã thêm ${data.name} vào danh sách`)
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi khi lưu thành viên'
      toastError('Không thể lưu', msg)
      throw err
    }
  }

  const handleDeleteMember = async (member: Member) => {
    if (window.confirm(`Bạn có chắc muốn xóa thành viên "${member.name}" cùng toàn bộ lịch sử ghi nợ?`)) {
      try {
        await removeMember(member.id)
        setIsDetailDrawerOpen(false)
        success('Đã xóa thành viên', `Đã xóa ${member.name}`)
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Lỗi khi xóa thành viên'
        toastError('Không thể xóa', msg)
      }
    }
  }

  const handleSettleDebt = async (memberId: string, data: SettleDebtRequest) => {
    try {
      const res = await settleDebt(memberId, data)
      success(
        'Đã ghi nhận thanh toán!',
        `Đã khấu trừ ${formatVND(res.settled_amount)}. Nợ còn lại: ${formatVND(res.remaining_debt)}`
      )
      // Refresh selected member state if detail is open
      if (selectedMember && selectedMember.id === memberId) {
        setSelectedMember((prev) => (prev ? { ...prev, total_debt: res.remaining_debt } : null))
      }
      return res
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi ghi nhận thanh toán'
      toastError('Không thể thanh toán', msg)
      throw err
    }
  }

  return (
    <div className="space-y-4 pb-20">
      {/* Header & Stats Banner */}
      <PageHeader
        title="Thành viên"
        description="Người chơi quen và sổ nợ, trả tới đâu trừ từ buổi cũ nhất."
        actions={
          <Button
            onClick={handleOpenCreate}
            className="h-11 min-h-[44px] bg-volt hover:bg-volt-hover text-ink font-semibold text-sm flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm</span>
          </Button>
        }
      />

      {/* Aggregate Debt Stats Card */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-line bg-surface p-3.5">
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-fg-muted whitespace-nowrap">
            <Users className="h-3.5 w-3.5 shrink-0" />
            Thành viên
          </div>
          <div className="mt-1.5 text-xl font-extrabold tabular-nums text-fg whitespace-nowrap">
            {members.length} <span className="text-sm font-semibold text-fg-muted">người</span>
          </div>
        </div>

        <div className="rounded-2xl border border-line bg-surface p-3.5">
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-fg-muted whitespace-nowrap">
            <TrendingDown className="h-3.5 w-3.5 shrink-0 text-danger" />
            Đang nợ · {membersWithDebtCount} người
          </div>
          <div
            className={`mt-1.5 text-xl font-extrabold tabular-nums whitespace-nowrap ${
              totalRosterDebt > 0 ? 'text-danger' : 'text-accent'
            }`}
          >
            {formatVND(totalRosterDebt)}
          </div>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-fg-subtle" />
          <Input
            placeholder="Tìm theo tên hoặc số điện thoại..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-surface border-line text-fg"
          />
        </div>

        {/* Filter Chips */}
        <div className="no-scrollbar -mx-4 flex items-center gap-2 overflow-x-auto px-4 text-xs">
          <button
            type="button"
            onClick={() => {
              setActiveOnly(false)
              setFilterDebtOnly(false)
            }}
            className={`min-h-[44px] shrink-0 whitespace-nowrap px-3.5 rounded-xl border transition-all cursor-pointer ${
              !activeOnly && !filterDebtOnly
                ? 'bg-volt border-accent text-ink font-semibold'
                : 'bg-surface border-line text-fg-muted hover:border-line-strong hover:text-fg'
            }`}
          >
            Tất cả ({members.length})
          </button>

          <button
            type="button"
            onClick={() => {
              setFilterDebtOnly(true)
            }}
            className={`min-h-[44px] shrink-0 whitespace-nowrap px-3.5 rounded-xl border transition-all flex items-center gap-1.5 cursor-pointer ${
              filterDebtOnly
                ? 'bg-danger/10 border-danger/30 text-danger font-semibold'
                : 'bg-surface border-line text-fg-muted hover:border-line-strong hover:text-fg'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-danger" />
            <span>Còn nợ ({membersWithDebtCount})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveOnly(!activeOnly)
              setFilterDebtOnly(false)
            }}
            className={`min-h-[44px] shrink-0 whitespace-nowrap px-3.5 rounded-xl border transition-all cursor-pointer ${
              activeOnly && !filterDebtOnly
                ? 'bg-accent/10 border-accent/30 text-accent font-semibold'
                : 'bg-surface border-line text-fg-muted hover:border-line-strong hover:text-fg'
            }`}
          >
            Hoạt động
          </button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="p-3 text-sm text-danger bg-danger/10 border border-danger/30 rounded-xl">
          {error}
        </div>
      )}

      {/* Members Roster List */}
      <div className="space-y-2.5">
        {isLoading && members.length === 0 ? (
          <div className="py-12 text-center text-sm text-fg-muted">
            Đang tải danh sách thành viên...
          </div>
        ) : filteredMembers.length === 0 ? (
          <Card className="border-line bg-raised text-center py-10">
            <CardContent className="space-y-3">
              <div className="w-12 h-12 rounded-full bg-line-strong/70 flex items-center justify-center mx-auto text-fg-muted">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-fg">
                  {searchQuery || filterDebtOnly
                    ? 'Không tìm thấy thành viên phù hợp'
                    : 'Chưa có thành viên nào trong danh sách'}
                </h3>
                <p className="text-xs text-fg-muted mt-1 max-w-xs mx-auto">
                  {searchQuery || filterDebtOnly
                    ? 'Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm.'
                    : 'Thêm người chơi thường xuyên để chọn nhanh khi tính tiền và theo dõi nợ tự động.'}
                </p>
              </div>
              {!searchQuery && !filterDebtOnly && (
                <Button
                  onClick={handleOpenCreate}
                  size="sm"
                  className="bg-volt hover:bg-volt-hover text-ink text-xs mt-2"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Thêm thành viên đầu tiên
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          filteredMembers.map((member) => {
            const hasDebt = member.total_debt > 0

            return (
              <div
                key={member.id}
                onClick={() => handleOpenDetail(member)}
                className="p-3.5 rounded-2xl bg-surface border border-line hover:border-line-strong active:scale-[0.99] transition-all cursor-pointer flex items-center justify-between gap-3 shadow-xs"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* Avatar Icon */}
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${
                      member.gender === 'female'
                        ? 'bg-female/10 text-female border border-female/30'
                        : 'bg-info/10 text-info border border-info/30'
                    }`}
                  >
                    {member.name.charAt(0).toUpperCase()}
                  </div>

                  {/* Name and Phone */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-fg line-clamp-2 break-words">
                        {member.name}
                      </span>
                      {!member.is_active && (
                        <span className="text-[9px] px-1 py-0.2 rounded bg-raised text-fg-muted border border-line">
                          Tạm ngưng
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-xs text-fg-muted mt-0.5">
                      {member.phone ? (
                        <span className="flex items-center gap-1 text-fg-muted">
                          <Phone className="w-3 h-3 text-fg-subtle" />
                          {member.phone}
                        </span>
                      ) : (
                        <span className="text-fg-subtle">Chưa có SĐT</span>
                      )}
                      {member.default_note && (
                        <span className="truncate max-w-[120px] text-fg-muted text-[11px]">
                          • {member.default_note}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Debt Badge & Settle Quick Trigger */}
                <div className="flex items-center gap-2 shrink-0">
                  {hasDebt ? (
                    <div className="text-right">
                      <div className="text-xs font-bold text-danger tabular-nums">
                        {formatVND(member.total_debt)}
                      </div>
                      <span className="text-[10px] font-semibold text-danger bg-danger/10 px-1.5 py-0.5 rounded-full border border-danger/30">
                        Còn nợ
                      </span>
                    </div>
                  ) : (
                    <span className="text-[11px] font-medium text-fg-muted bg-raised px-2 py-0.5 rounded-full border border-line">
                      0 đ
                    </span>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Drawers & Modals */}
      <MemberFormDrawer
        open={isFormDrawerOpen}
        onOpenChange={setIsFormDrawerOpen}
        memberToEdit={memberToEdit}
        onSave={handleSaveMember}
      />

      <MemberDetailDrawer
        open={isDetailDrawerOpen}
        onOpenChange={setIsDetailDrawerOpen}
        member={selectedMember}
        onGetDetails={getMemberDetails}
        onEdit={handleOpenEdit}
        onDelete={handleDeleteMember}
        onOpenSettle={(m) => {
          setIsDetailDrawerOpen(false)
          handleOpenSettle(m)
        }}
      />

      <SettleDebtModal
        open={isSettleModalOpen}
        onOpenChange={setIsSettleModalOpen}
        member={selectedMember}
        onSettle={handleSettleDebt}
      />
    </div>
  )
}
