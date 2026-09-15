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
      <DrawerContent className="max-h-[92vh] bg-white border-t border-slate-200 text-slate-900 shadow-2xl">
        <DrawerHeader className="text-left pb-2">
          <div className="flex items-start justify-between gap-2">
            <div>
              <DrawerTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100">
                  <Calendar className="w-4 h-4" />
                </div>
                <span>{formattedDate}</span>
              </DrawerTitle>
              <DrawerDescription className="flex items-center gap-2 mt-1 text-slate-500">
                {session.venue_name ? (
                  <span className="flex items-center gap-1 text-slate-700 font-medium">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    {session.venue_name}
                  </span>
                ) : (
                  <span>Chưa gán sân</span>
                )}
                {session.start_time && (
                  <span className="flex items-center gap-1 text-slate-400">
                    <Clock className="w-3.5 h-3.5" />
                    {session.start_time.slice(0, 5)}
                    {session.end_time ? ` - ${session.end_time.slice(0, 5)}` : ''}
                  </span>
                )}
              </DrawerDescription>
            </div>
            <Badge
              variant={session.status === 'completed' ? 'paid' : 'outline'}
              className="capitalize"
            >
              {session.status === 'completed' ? 'Hoàn thành' : session.status}
            </Badge>
          </div>

          {/* Tab Switcher */}
          <div className="flex p-1 bg-slate-100 rounded-xl border border-slate-200 mt-3">
            <button
              type="button"
              onClick={() => setActiveTab('details')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                activeTab === 'details'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Chi tiết chi phí & Người chơi
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('qr')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'qr'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Xem hóa đơn VietQR
            </button>
          </div>
        </DrawerHeader>

        <div className="p-4 space-y-4 overflow-y-auto max-h-[60vh]">
          {activeTab === 'details' ? (
            <>
              {/* Financial Summary */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-xs text-slate-500 font-medium">Tổng chi phí</span>
                  <p className="text-lg font-bold text-slate-900 tabular-nums mt-0.5">
                    {session.total_expenses.toLocaleString('vi-VN')} đ
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-xs text-slate-500 font-medium">Tiền sân</span>
                  <p className="text-base font-semibold text-slate-800 tabular-nums mt-0.5">
                    {session.court_fee.toLocaleString('vi-VN')} đ
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-xs text-slate-500 font-medium">Tiền cầu</span>
                  <p className="text-base font-semibold text-slate-800 tabular-nums mt-0.5">
                    {session.shuttlecock_fee.toLocaleString('vi-VN')} đ
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-xs text-slate-500 font-medium">Người tham gia</span>
                  <p className="text-base font-semibold text-slate-800 flex items-center gap-1 mt-0.5">
                    <Users className="w-4 h-4 text-slate-400" />
                    {session.participants.length} người
                  </p>
                </div>
              </div>

              {/* Extra Expenses Breakdown */}
              {session.expenses.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Chi phí phát sinh khác
                  </h4>
                  <div className="space-y-1.5">
                    {session.expenses.map((exp, idx) => (
                      <div
                        key={exp.id || idx}
                        className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-slate-50 border border-slate-200"
                      >
                        <span className="text-slate-700">
                          {exp.item_name} ({exp.quantity}x)
                        </span>
                        <span className="font-semibold text-slate-900 tabular-nums">
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
                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Danh sách người chơi ({paidCount}/{session.participants.length} đã trả)
                  </h4>
                </div>

                <div className="space-y-1.5">
                  {session.participants.map((part, idx) => (
                    <div
                      key={part.id || idx}
                      className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                            part.gender === 'female'
                              ? 'bg-rose-100 text-rose-700 border border-rose-200'
                              : 'bg-sky-100 text-sky-700 border border-sky-200'
                          }`}
                        >
                          {part.gender === 'female' ? 'Nữ' : 'Nam'}
                        </div>
                        <div>
                          <span className="font-medium text-slate-900">
                            {part.display_name}
                          </span>
                          {part.play_stage !== 'full' && (
                            <span className="ml-1.5 text-[10px] text-amber-800 bg-amber-100 px-1 py-0.5 rounded font-medium">
                              {part.play_stage === 'early_leaver' ? 'Về sớm' : 'Đến trễ'}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 tabular-nums">
                          {part.calculated_fee.toLocaleString('vi-VN')} đ
                        </span>
                        {part.is_paid ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <XCircle className="w-4 h-4 text-slate-300" />
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

        <DrawerFooter className="pt-3 border-t border-slate-200 flex flex-row gap-3">
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
            className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-medium flex items-center justify-center gap-1.5"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Nạp vào máy tính</span>
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
