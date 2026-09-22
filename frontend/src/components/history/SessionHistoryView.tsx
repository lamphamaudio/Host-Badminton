import React, { useState } from 'react'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useSessionHistory } from '@/hooks/useSessionHistory'
import { useVenues } from '@/hooks/useVenues'
import { formatVND } from '@/lib/formatters'
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
      <PageHeader
        title="Lịch sử"
        description="Các buổi đã tính tiền, mở lại bill và đối soát."
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            aria-expanded={showFilters}
            className={`h-11 min-h-[44px] px-3.5 text-sm flex items-center gap-1.5 ${
              filters.startDate || filters.endDate || filters.venueId
                ? 'border-accent text-accent font-semibold'
                : 'border-line text-fg-muted'
            }`}
          >
            <Filter className="w-4 h-4" />
            <span>Lọc</span>
          </Button>
        }
      />

      {/* Summary Statistics Banner */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Số buổi', value: String(totalCount), accent: false },
          {
            label: 'Tổng chi',
            value:
              totalRevenue >= 1_000_000
                ? `${(totalRevenue / 1_000_000).toFixed(1)}Tr`
                : formatVND(totalRevenue),
            accent: true,
          },
          { label: 'Lượt chơi', value: String(totalParticipants), accent: false },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-line bg-surface px-2 py-3 text-center">
            <span className="block whitespace-nowrap text-[11px] font-medium text-fg-muted">
              {stat.label}
            </span>
            <span
              className={`mt-0.5 block whitespace-nowrap text-[15px] font-bold tabular-nums ${
                stat.accent ? 'text-accent' : 'text-fg'
              }`}
            >
              {stat.value}
            </span>
          </div>
        ))}
      </div>

      {/* Filter Controls Accordion */}
      {showFilters && (
        <Card className="bg-raised border-line p-3 space-y-3 shadow-xs">
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-fg-muted">Từ ngày</label>
              <Input
                type="date"
                value={filters.startDate || ''}
                onChange={(e) => updateFilters({ startDate: e.target.value || undefined })}
                className="h-8 text-xs bg-surface border-line"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-fg-muted">Đến ngày</label>
              <Input
                type="date"
                value={filters.endDate || ''}
                onChange={(e) => updateFilters({ endDate: e.target.value || undefined })}
                className="h-8 text-xs bg-surface border-line"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-medium text-fg-muted">Sân cầu lông</label>
            <select
              value={filters.venueId || ''}
              onChange={(e) => updateFilters({ venueId: e.target.value || undefined })}
              className="w-full h-8 text-xs rounded-md bg-surface border border-line px-2 text-fg"
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
              className="w-full text-xs text-fg-muted hover:text-fg h-7"
            >
              Xóa bộ lọc
            </Button>
          )}
        </Card>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-3 text-sm text-danger bg-danger/10 border border-danger/30 rounded-xl">
          {error}
        </div>
      )}

      {/* Loading Skeleton */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="bg-surface border-line animate-pulse shadow-sm">
              <CardContent className="p-4 h-24" />
            </Card>
          ))}
        </div>
      ) : sessions.length === 0 ? (
        /* Empty State */
        <Card className="bg-raised border-line border-dashed text-center p-8">
          <CardContent className="flex flex-col items-center justify-center space-y-3 p-0">
            <div className="w-12 h-12 rounded-full bg-line-strong/70 flex items-center justify-center text-fg-muted">
              <History className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-fg">
                {filters.startDate || filters.endDate || filters.venueId
                  ? 'Không tìm thấy buổi chơi phù hợp bộ lọc'
                  : 'Chưa có buổi chơi nào được lưu'}
              </p>
              <p className="text-xs text-fg-muted max-w-xs">
                Khi bạn tính tiền buổi chơi, bấm "Lưu buổi chơi" để lưu vào nhật ký này.
              </p>
            </div>
            <Button
              onClick={onNavigateToCalculator}
              variant="outline"
              className="mt-2 text-fg border-line-strong hover:bg-raised"
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
                className={`bg-surface border-line hover:border-line-strong transition-all cursor-pointer shadow-sm active:scale-[0.99] ${
                  loadingDetailId === s.id ? 'opacity-60 pointer-events-none' : ''
                }`}
              >
                <CardContent className="p-4 space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-fg flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-fg-subtle" />
                          {formattedDate}
                        </span>
                      </div>
                      {s.venue_name && (
                        <span className="text-xs text-fg-muted flex items-center gap-1">
                          <Building2 className="w-3 h-3 text-fg-subtle" />
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
                        className="h-7 w-7 p-0 text-fg-subtle hover:text-danger hover:bg-danger/10"
                        title="Xóa buổi chơi"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                      <ChevronRight className="w-4 h-4 text-fg-subtle" />
                    </div>
                  </div>

                  <div className="pt-2 border-t border-line flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 text-fg-muted">
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-fg-subtle" />
                        {s.participant_count} người
                      </span>
                      {s.paid_count > 0 && (
                        <span className="text-accent text-[11px] font-semibold bg-accent/10 border border-accent/30 px-1.5 py-0.5 rounded">
                          {s.paid_count}/{s.participant_count} đã trả
                        </span>
                      )}
                    </div>

                    <div className="text-right">
                      <span className="font-bold text-fg text-sm tabular-nums">
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
