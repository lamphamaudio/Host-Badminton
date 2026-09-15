import React, { useState } from 'react'
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
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100">
              <Users className="w-4 h-4" />
            </div>
            <span>Thành Viên & Sổ Nợ</span>
          </h1>
          <p className="text-xs text-slate-500">
            Quản lý người chơi quen thuộc và theo dõi công nợ (FIFO)
          </p>
        </div>
        <Button
          onClick={handleOpenCreate}
          className="bg-slate-900 hover:bg-slate-800 text-white font-medium text-sm flex items-center gap-1.5 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm người</span>
        </Button>
      </div>

      {/* Aggregate Debt Stats Card */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3.5 rounded-2xl bg-white border border-slate-200 flex items-center gap-3 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-slate-500">Tổng thành viên</div>
            <div className="text-lg font-bold text-slate-900 tabular-nums">{members.length} người</div>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-white border border-slate-200 flex items-center gap-3 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center shrink-0">
            <TrendingDown className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-slate-500">
              Tổng tiền nợ ({membersWithDebtCount})
            </div>
            <div
              className={`text-lg font-bold tabular-nums ${
                totalRosterDebt > 0 ? 'text-rose-600' : 'text-emerald-700'
              }`}
            >
              {formatVND(totalRosterDebt)}
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Tìm theo tên hoặc số điện thoại..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-white border-slate-200 text-slate-900"
          />
        </div>

        {/* Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <button
            type="button"
            onClick={() => {
              setActiveOnly(false)
              setFilterDebtOnly(false)
            }}
            className={`px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
              !activeOnly && !filterDebtOnly
                ? 'bg-slate-900 border-slate-900 text-white font-semibold'
                : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-900'
            }`}
          >
            Tất cả ({members.length})
          </button>

          <button
            type="button"
            onClick={() => {
              setFilterDebtOnly(true)
            }}
            className={`px-3 py-1.5 rounded-xl border transition-all flex items-center gap-1.5 cursor-pointer ${
              filterDebtOnly
                ? 'bg-rose-50 border-rose-300 text-rose-800 font-semibold'
                : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-900'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <span>Còn nợ ({membersWithDebtCount})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveOnly(!activeOnly)
              setFilterDebtOnly(false)
            }}
            className={`px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
              activeOnly && !filterDebtOnly
                ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-semibold'
                : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-900'
            }`}
          >
            Đang hoạt động
          </button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="p-3 text-sm text-rose-800 bg-rose-50 border border-rose-200 rounded-xl">
          {error}
        </div>
      )}

      {/* Members Roster List */}
      <div className="space-y-2.5">
        {isLoading && members.length === 0 ? (
          <div className="py-12 text-center text-sm text-slate-500">
            Đang tải danh sách thành viên...
          </div>
        ) : filteredMembers.length === 0 ? (
          <Card className="border-slate-200 bg-slate-50 text-center py-10">
            <CardContent className="space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-200/70 flex items-center justify-center mx-auto text-slate-500">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  {searchQuery || filterDebtOnly
                    ? 'Không tìm thấy thành viên phù hợp'
                    : 'Chưa có thành viên nào trong danh sách'}
                </h3>
                <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                  {searchQuery || filterDebtOnly
                    ? 'Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm.'
                    : 'Thêm người chơi thường xuyên để chọn nhanh khi tính tiền và theo dõi nợ tự động.'}
                </p>
              </div>
              {!searchQuery && !filterDebtOnly && (
                <Button
                  onClick={handleOpenCreate}
                  size="sm"
                  className="bg-slate-900 hover:bg-slate-800 text-white text-xs mt-2"
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
                className="p-3.5 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 active:scale-[0.99] transition-all cursor-pointer flex items-center justify-between gap-3 shadow-xs"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* Avatar Icon */}
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${
                      member.gender === 'female'
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : 'bg-sky-50 text-sky-700 border border-sky-200'
                    }`}
                  >
                    {member.name.charAt(0).toUpperCase()}
                  </div>

                  {/* Name and Phone */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-900 truncate">
                        {member.name}
                      </span>
                      {!member.is_active && (
                        <span className="text-[9px] px-1 py-0.2 rounded bg-slate-100 text-slate-500 border border-slate-200">
                          Tạm ngưng
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                      {member.phone ? (
                        <span className="flex items-center gap-1 text-slate-600">
                          <Phone className="w-3 h-3 text-slate-400" />
                          {member.phone}
                        </span>
                      ) : (
                        <span className="text-slate-400">Chưa có SĐT</span>
                      )}
                      {member.default_note && (
                        <span className="truncate max-w-[120px] text-slate-500 text-[11px]">
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
                      <div className="text-xs font-bold text-rose-600 tabular-nums">
                        {formatVND(member.total_debt)}
                      </div>
                      <span className="text-[10px] font-semibold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded-full border border-rose-200">
                        Còn nợ
                      </span>
                    </div>
                  ) : (
                    <span className="text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
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
