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
          <h1 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
            <History className="w-5 h-5 text-emerald-400" />
            Lịch Sử Buổi Chơi
          </h1>
          <p className="text-xs text-zinc-400">
            Xem lại các buổi đã tính tiền, sao chép QR và đối soát
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
          className={`text-xs flex items-center gap-1.5 ${
            filters.startDate || filters.endDate || filters.venueId
              ? 'border-emerald-500 text-emerald-400'
              : 'border-zinc-800 text-zinc-400'
          }`}
        >
          <Filter className="w-3.5 h-3.5" />
          <span>Bộ lọc</span>
        </Button>
      </div>

      {/* Summary Statistics Banner */}
      <div className="grid grid-cols-3 gap-2">
        <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800/80 shadow-sm text-center">
          <span className="text-[11px] text-zinc-400 font-medium block">
            Tổng buổi
          </span>
          <span className="text-base font-bold text-zinc-100 block mt-0.5">
            {totalCount}
          </span>
        </div>

        <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800/80 shadow-sm text-center">
          <span className="text-[11px] text-zinc-400 font-medium block">
            Tổng chi phí
          </span>
          <span className="text-base font-bold text-emerald-400 block mt-0.5 truncate">
            {totalRevenue >= 1_000_000
              ? `${(totalRevenue / 1_000_000).toFixed(1)}Tr`
              : `${totalRevenue.toLocaleString('vi-VN')} đ`}
          </span>
        </div>

        <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800/80 shadow-sm text-center">
          <span className="text-[11px] text-zinc-400 font-medium block">
            Lượt người chơi
          </span>
          <span className="text-base font-bold text-zinc-100 block mt-0.5">
            {totalParticipants}
          </span>
        </div>
      </div>

      {/* Filter Controls Accordion */}
      {showFilters && (
        <Card className="bg-zinc-900/90 border-zinc-800 p-3 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-zinc-400">Từ ngày</label>
              <Input
                type="date"
                value={filters.startDate || ''}
                onChange={(e) => updateFilters({ startDate: e.target.value || undefined })}
                className="h-8 text-xs bg-zinc-950 border-zinc-800"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-zinc-400">Đến ngày</label>
              <Input
                type="date"
                value={filters.endDate || ''}
                onChange={(e) => updateFilters({ endDate: e.target.value || undefined })}
                className="h-8 text-xs bg-zinc-950 border-zinc-800"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-medium text-zinc-400">Sân cầu lông</label>
            <select
              value={filters.venueId || ''}
              onChange={(e) => updateFilters({ venueId: e.target.value || undefined })}
              className="w-full h-8 text-xs rounded-md bg-zinc-950 border border-zinc-800 px-2 text-zinc-200"
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
              className="w-full text-xs text-zinc-400 hover:text-zinc-200 h-7"
            >
              Xóa bộ lọc
            </Button>
          )}
        </Card>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-3 text-sm text-red-400 bg-red-950/30 border border-red-900 rounded-lg">
          {error}
        </div>
      )}

      {/* Loading Skeleton */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="bg-zinc-900/50 border-zinc-800 animate-pulse">
              <CardContent className="p-4 h-24" />
            </Card>
          ))}
        </div>
      ) : sessions.length === 0 ? (
        /* Empty State */
        <Card className="bg-zinc-900/40 border-zinc-800 border-dashed text-center p-8">
          <CardContent className="flex flex-col items-center justify-center space-y-3 p-0">
            <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400">
              <History className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-zinc-200">
                {filters.startDate || filters.endDate || filters.venueId
                  ? 'Không tìm thấy buổi chơi phù hợp bộ lọc'
                  : 'Chưa có buổi chơi nào được lưu'}
              </p>
              <p className="text-xs text-zinc-400 max-w-xs">
                Khi bạn tính tiền buổi chơi, bấm "Lưu buổi chơi" để lưu vào nhật ký này.
              </p>
            </div>
            <Button
              onClick={onNavigateToCalculator}
              variant="outline"
              className="mt-2 text-emerald-400 border-emerald-800/60 hover:bg-emerald-950/30"
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
                className={`bg-zinc-900/80 border-zinc-800 hover:border-zinc-700 transition-all cursor-pointer shadow-sm active:scale-[0.99] ${
                  loadingDetailId === s.id ? 'opacity-60 pointer-events-none' : ''
                }`}
              >
                <CardContent className="p-4 space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-zinc-100 flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                          {formattedDate}
                        </span>
                      </div>
                      {s.venue_name && (
                        <span className="text-xs text-zinc-400 flex items-center gap-1">
                          <Building2 className="w-3 h-3 text-zinc-500" />
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
                        className="h-7 w-7 p-0 text-zinc-500 hover:text-red-400 hover:bg-red-950/30"
                        title="Xóa buổi chơi"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                      <ChevronRight className="w-4 h-4 text-zinc-500" />
                    </div>
                  </div>

                  <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 text-zinc-400">
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-zinc-500" />
                        {s.participant_count} người
                      </span>
                      {s.paid_count > 0 && (
                        <span className="text-emerald-400/90 text-[11px] font-medium bg-emerald-950/40 px-1.5 py-0.5 rounded">
                          {s.paid_count}/{s.participant_count} đã trả
                        </span>
                      )}
                    </div>

                    <div className="text-right">
                      <span className="font-bold text-emerald-400 text-sm">
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
