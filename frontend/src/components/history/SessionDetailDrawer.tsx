import React, { useState } from 'react'
import { BillCardPreview } from '@/components/bill/bill-card-preview'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import type { SessionDetailResponse } from '@/lib/api'
import {
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  RotateCcw,
  Users,
  XCircle,
} from 'lucide-react'
import { findBankByBin, generateVietQRQuicklink } from '@/lib/vietqr'
import type { SplitMode } from '@/lib/calculator'

interface SessionDetailDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  session: SessionDetailResponse | null
  onReplayInCalculator: (session: SessionDetailResponse) => void
}

export const SessionDetailDrawer: React.FC<SessionDetailDrawerProps> = ({
  open,
  onOpenChange,
  session,
  onReplayInCalculator,
}) => {
  const [activeTab, setActiveTab] = useState<'details' | 'qr'>('details')

  if (!session) return null

  const formattedDate = new Date(session.session_date).toLocaleDateString('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })

  // Format participant breakdown for VietQR card replay
  const maleCount = session.participants.filter((p) => p.gender === 'male').length
  const femaleCount = session.participants.filter((p) => p.gender === 'female').length
  const paidCount = session.participants.filter((p) => p.is_paid).length
  const maleSample = session.participants.find((p) => p.gender === 'male')
  const femaleSample = session.participants.find((p) => p.gender === 'female')

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[92vh] bg-surface border-t border-line text-fg shadow-2xl">
        <DrawerHeader className="text-left pb-2">
          <div className="pr-8">
            <div>
              <DrawerTitle className="text-lg font-bold text-fg flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/10 text-accent border border-accent/30">
                  <Calendar className="w-4 h-4" />
                </div>
                <span>{formattedDate}</span>
              </DrawerTitle>
              <DrawerDescription asChild>
                <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 mt-1 text-sm text-fg-muted">
                {session.venue_name ? (
                  <span className="flex items-center gap-1 text-fg font-medium">
                    <Building2 className="w-3.5 h-3.5 text-fg-subtle" />
                    {session.venue_name}
                  </span>
                ) : (
                  <span>Chưa gán sân</span>
                )}
                {session.start_time && (
                  <span className="flex items-center gap-1 text-fg-subtle">
                    <Clock className="w-3.5 h-3.5" />
                    {session.start_time.slice(0, 5)}
                    {session.end_time ? ` - ${session.end_time.slice(0, 5)}` : ''}
                  </span>
                )}
                <Badge
                  variant={session.status === 'completed' ? 'paid' : 'outline'}
                  size="sm"
                  className="whitespace-nowrap"
                >
                  {session.status === 'completed' ? 'Hoàn thành' : session.status}
                </Badge>
                </div>
              </DrawerDescription>
            </div>
          </div>

          {/* Tab Switcher */}
          <div className="flex p-1 bg-raised rounded-xl border border-line mt-3">
            <button
              type="button"
              onClick={() => setActiveTab('details')}
              className={`flex-1 min-h-[44px] whitespace-nowrap text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                activeTab === 'details'
                  ? 'bg-surface text-fg shadow-xs'
                  : 'text-fg-muted hover:text-fg'
              }`}
            >
              Chi tiết
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('qr')}
              className={`flex-1 min-h-[44px] whitespace-nowrap text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'qr'
                  ? 'bg-surface text-fg shadow-xs'
                  : 'text-fg-muted hover:text-fg'
              }`}
            >
              Hóa đơn VietQR
            </button>
          </div>
        </DrawerHeader>

        <div className="p-4 space-y-4 overflow-y-auto overflow-x-hidden max-h-[60vh]">
          {activeTab === 'details' ? (
            <>
              {/* Financial Summary */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-3 rounded-xl bg-raised border border-line">
                  <span className="text-xs text-fg-muted font-medium">Tổng chi phí</span>
                  <p className="text-lg font-bold text-fg tabular-nums mt-0.5">
                    {session.total_expenses.toLocaleString('vi-VN')} đ
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-raised border border-line">
                  <span className="text-xs text-fg-muted font-medium">Tiền sân</span>
                  <p className="text-base font-semibold text-fg tabular-nums mt-0.5">
                    {session.court_fee.toLocaleString('vi-VN')} đ
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-raised border border-line">
                  <span className="text-xs text-fg-muted font-medium">Tiền cầu</span>
                  <p className="text-base font-semibold text-fg tabular-nums mt-0.5">
                    {session.shuttlecock_fee.toLocaleString('vi-VN')} đ
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-raised border border-line">
                  <span className="text-xs text-fg-muted font-medium">Người tham gia</span>
                  <p className="text-base font-semibold text-fg flex items-center gap-1 mt-0.5">
                    <Users className="w-4 h-4 text-fg-subtle" />
                    {session.participants.length} người
                  </p>
                </div>
              </div>

              {/* Extra Expenses Breakdown */}
              {session.expenses.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-fg-muted uppercase tracking-wider">
                    Chi phí phát sinh khác
                  </h4>
                  <div className="space-y-1.5">
                    {session.expenses.map((exp, idx) => (
                      <div
                        key={exp.id || idx}
                        className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-raised border border-line"
                      >
                        <span className="text-fg">
                          {exp.item_name} ({exp.quantity}x)
                        </span>
                        <span className="font-semibold text-fg tabular-nums">
                          {exp.total_amount.toLocaleString('vi-VN')} đ
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Participants List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-fg-muted uppercase tracking-wider">
                    Danh sách người chơi ({paidCount}/{session.participants.length} đã trả)
                  </h4>
                </div>

                <div className="space-y-1.5">
                  {session.participants.map((part, idx) => (
                    <div
                      key={part.id || idx}
                      className="flex items-center justify-between p-2.5 rounded-lg bg-raised border border-line text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                            part.gender === 'female'
                              ? 'bg-female/10 text-female border border-female/30'
                              : 'bg-info/10 text-info border border-info/30'
                          }`}
                        >
                          {part.gender === 'female' ? 'Nữ' : 'Nam'}
                        </div>
                        <div>
                          <span className="font-medium text-fg">
                            {part.display_name}
                          </span>
                          {part.play_stage !== 'full' && (
                            <span className="ml-1.5 text-[10px] text-warn bg-warn/10 px-1 py-0.5 rounded font-medium">
                              {part.play_stage === 'early_leaver' ? 'Về sớm' : 'Đến trễ'}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-2">
                        <span className="whitespace-nowrap font-bold text-fg tabular-nums">
                          {part.calculated_fee.toLocaleString('vi-VN')} đ
                        </span>
                        {part.is_paid ? (
                          <CheckCircle2 className="w-4 h-4 text-accent" />
                        ) : (
                          <XCircle className="w-4 h-4 text-fg-subtle" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            /* VietQR Replay Container */
            <div className="space-y-3">
              <BillCardPreview
                data={{
                  venueName: session.venue_name || 'Sân Cầu Lông',
                  sessionDate: session.session_date,
                  splitMode: (session.gender_split_mode as SplitMode) || 'even',
                  maleCount,
                  femaleCount,
                  maleFee: maleSample?.calculated_fee || 0,
                  femaleFee: femaleSample?.calculated_fee || 0,
                  courtFee: session.court_fee,
                  shuttleFee: session.shuttlecock_fee,
                  shuttleCount: session.shuttlecock_count || undefined,
                  totalAmount: session.total_expenses,
                  bankName: session.bank_bin ? findBankByBin(session.bank_bin)?.shortName || 'MB Bank' : 'MB Bank',
                  accountNumber: session.bank_account_number || '',
                  accountName: session.bank_account_name || '',
                  transferContent: session.vietqr_memo || 'TIEN SAN CAU LONG',
                  qrImageUrl: session.bank_bin && session.bank_account_number
                    ? generateVietQRQuicklink({
                        bankBin: session.bank_bin,
                        accountNumber: session.bank_account_number,
                        accountName: session.bank_account_name || undefined,
                        amount: maleSample?.calculated_fee || session.total_expenses,
                        memo: session.vietqr_memo || 'TIEN SAN CAU LONG',
                      })
                    : undefined,
                }}
              />
            </div>
          )}
        </div>

        <DrawerFooter className="pt-3 border-t border-line flex flex-row gap-3">
          <DrawerClose asChild>
            <Button variant="outline" className="flex-1">
              Đóng
            </Button>
          </DrawerClose>
          <Button
            onClick={() => {
              onReplayInCalculator(session)
              onOpenChange(false)
            }}
            className="flex-1 bg-volt hover:bg-volt-hover text-ink font-medium flex items-center justify-center gap-1.5"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Nạp vào máy tính</span>
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
