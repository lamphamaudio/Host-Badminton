import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useSessionHistory } from '@/hooks/useSessionHistory'
import { useVenues } from '@/hooks/useVenues'
import {
  fetchSessionDetail,
  type SessionDetailResponse,
  type SessionSummary,
} from '@/lib/api'
import {
  Building2,
  Calendar,
  ChevronRight,
  Filter,
  History,
  Trash2,
  Users,
} from 'lucide-react'
import { SessionDetailDrawer } from './SessionDetailDrawer'

interface SessionHistoryViewProps {
  onReplayInCalculator: (session: SessionDetailResponse) => void
  onNavigateToCalculator: () => void
}

export const SessionHistoryView: React.FC<SessionHistoryViewProps> = ({
  onReplayInCalculator,
  onNavigateToCalculator,
}) => {
  const {
    sessions,
    totalCount,
    totalRevenue,
    totalParticipants,
    filters,
    updateFilters,
    isLoading,
    error,
    removeSession,
  } = useSessionHistory()
  const { venues } = useVenues(true)

  const [selectedSessionDetail, setSelectedSessionDetail] =
    useState<SessionDetailResponse | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [loadingDetailId, setLoadingDetailId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)

  const handleSelectSession = async (sessionSummary: SessionSummary) => {
    setLoadingDetailId(sessionSummary.id)
    try {
      const detail = await fetchSessionDetail(sessionSummary.id)
      setSelectedSessionDetail(detail)
      setIsDrawerOpen(true)
    } catch (err) {
      alert('Không thể tải chi tiết buổi chơi. Vui lòng thử lại!')
    } finally {
      setLoadingDetailId(null)
    }
  }

  const handleDelete = async (e: React.MouseEvent, session: SessionSummary) => {
    e.stopPropagation()
    const formatted = new Date(session.session_date).toLocaleDateString('vi-VN')
    if (window.confirm(`Bạn có chắc muốn xóa lịch sử buổi chơi ngày ${formatted}?`)) {
      setDeletingId(session.id)
      try {
        await removeSession(session.id)
      } finally {
        setDeletingId(null)
      }
    }
  }

  return (
    <div className="space-y-4 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100">
              <History className="w-4 h-4" />
            </div>
            <span>Lịch Sử Buổi Chơi</span>
          </h1>
          <p className="text-xs text-slate-500">
            Xem lại các buổi đã tính tiền, sao chép QR và đối soát
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
          className={`text-xs flex items-center gap-1.5 ${
            filters.startDate || filters.endDate || filters.venueId
              ? 'border-slate-900 text-slate-900 font-semibold'
              : 'border-slate-200 text-slate-600'
          }`}
        >
          <Filter className="w-3.5 h-3.5" />
          <span>Bộ lọc</span>
        </Button>
      </div>

      {/* Summary Statistics Banner */}
      <div className="grid grid-cols-3 gap-2">
        <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-xs text-center">
          <span className="text-[11px] text-slate-500 font-medium block">
            Tổng buổi
          </span>
          <span className="text-base font-bold text-slate-900 block mt-0.5 tabular-nums">
            {totalCount}
          </span>
        </div>

        <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-xs text-center">
          <span className="text-[11px] text-slate-500 font-medium block">
            Tổng chi phí
          </span>
          <span className="text-base font-bold text-emerald-700 block mt-0.5 truncate tabular-nums">
            {totalRevenue >= 1_000_000
              ? `${(totalRevenue / 1_000_000).toFixed(1)}Tr`
              : `${totalRevenue.toLocaleString('vi-VN')} đ`}
          </span>
        </div>

        <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-xs text-center">
          <span className="text-[11px] text-slate-500 font-medium block">
            Lượt người chơi
          </span>
          <span className="text-base font-bold text-slate-900 block mt-0.5 tabular-nums">
            {totalParticipants}
          </span>
        </div>
      </div>

      {/* Filter Controls Accordion */}
      {showFilters && (
        <Card className="bg-slate-50 border-slate-200 p-3 space-y-3 shadow-xs">
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-slate-600">Từ ngày</label>
              <Input
                type="date"
                value={filters.startDate || ''}
                onChange={(e) => updateFilters({ startDate: e.target.value || undefined })}
                className="h-8 text-xs bg-white border-slate-200"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-slate-600">Đến ngày</label>
              <Input
                type="date"
                value={filters.endDate || ''}
                onChange={(e) => updateFilters({ endDate: e.target.value || undefined })}
                className="h-8 text-xs bg-white border-slate-200"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-medium text-slate-600">Sân cầu lông</label>
            <select
              value={filters.venueId || ''}
              onChange={(e) => updateFilters({ venueId: e.target.value || undefined })}
              className="w-full h-8 text-xs rounded-md bg-white border border-slate-200 px-2 text-slate-800"
            >
              <option value="">Tất cả các sân</option>
              {venues.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
          </div>

          {(filters.startDate || filters.endDate || filters.venueId) && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => updateFilters({ startDate: undefined, endDate: undefined, venueId: undefined })}
              className="w-full text-xs text-slate-500 hover:text-slate-900 h-7"
            >
              Xóa bộ lọc
            </Button>
          )}
        </Card>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-3 text-sm text-rose-800 bg-rose-50 border border-rose-200 rounded-xl">
          {error}
        </div>
      )}

      {/* Loading Skeleton */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="bg-white border-slate-200 animate-pulse shadow-sm">
              <CardContent className="p-4 h-24" />
            </Card>
          ))}
        </div>
      ) : sessions.length === 0 ? (
        /* Empty State */
        <Card className="bg-slate-50 border-slate-200 border-dashed text-center p-8">
          <CardContent className="flex flex-col items-center justify-center space-y-3 p-0">
            <div className="w-12 h-12 rounded-full bg-slate-200/70 flex items-center justify-center text-slate-500">
              <History className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-slate-900">
                {filters.startDate || filters.endDate || filters.venueId
                  ? 'Không tìm thấy buổi chơi phù hợp bộ lọc'
                  : 'Chưa có buổi chơi nào được lưu'}
              </p>
              <p className="text-xs text-slate-500 max-w-xs">
                Khi bạn tính tiền buổi chơi, bấm "Lưu buổi chơi" để lưu vào nhật ký này.
              </p>
            </div>
            <Button
              onClick={onNavigateToCalculator}
              variant="outline"
              className="mt-2 text-slate-900 border-slate-300 hover:bg-slate-100"
            >
              Đi đến máy tính chia tiền
            </Button>
          </CardContent>
        </Card>
      ) : (
        /* Sessions List */
        <div className="space-y-3">
          {sessions.map((s) => {
            const formattedDate = new Date(s.session_date).toLocaleDateString('vi-VN', {
              weekday: 'short',
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
            })

            return (
              <Card
                key={s.id}
                onClick={() => handleSelectSession(s)}
                className={`bg-white border-slate-200 hover:border-slate-300 transition-all cursor-pointer shadow-sm active:scale-[0.99] ${
                  loadingDetailId === s.id ? 'opacity-60 pointer-events-none' : ''
                }`}
              >
                <CardContent className="p-4 space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-slate-900 flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {formattedDate}
                        </span>
                      </div>
                      {s.venue_name && (
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <Building2 className="w-3 h-3 text-slate-400" />
                          {s.venue_name}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={deletingId === s.id}
                        onClick={(e) => handleDelete(e, s)}
                        className="h-7 w-7 p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                        title="Xóa buổi chơi"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 text-slate-500">
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        {s.participant_count} người
                      </span>
                      {s.paid_count > 0 && (
                        <span className="text-emerald-800 text-[11px] font-semibold bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                          {s.paid_count}/{s.participant_count} đã trả
                        </span>
                      )}
                    </div>

                    <div className="text-right">
                      <span className="font-bold text-slate-900 text-sm tabular-nums">
                        {s.total_expenses.toLocaleString('vi-VN')} đ
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Session Detail & VietQR Replay Drawer */}
      <SessionDetailDrawer
        open={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
        session={selectedSessionDetail}
        onReplayInCalculator={onReplayInCalculator}
      />
    </div>
  )
}
