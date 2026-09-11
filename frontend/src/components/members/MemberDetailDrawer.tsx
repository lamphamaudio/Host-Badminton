import React, { useEffect, useState } from 'react'
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
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/lib/toast'
import type { DebtRecord, Member, MemberDetail } from '@/lib/api'
import { formatSessionDateTime, formatVND } from '@/lib/formatters'
import { loadCalculatorState } from '@/lib/storage'
import { findBankByBin, generateVietQRQuicklink } from '@/lib/vietqr'
import {
  Calendar,
  Clock,
  Copy,
  Edit2,
  MessageSquare,
  Phone,
  QrCode,
  Receipt,
  Trash2,
  TrendingDown,
  User,
  UserCheck,
} from 'lucide-react'

interface MemberDetailDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  member: Member | null
  onGetDetails: (id: string) => Promise<MemberDetail>
  onEdit: (member: Member) => void
  onDelete: (member: Member) => void
  onOpenSettle: (member: Member) => void
}

export const MemberDetailDrawer: React.FC<MemberDetailDrawerProps> = ({
  open,
  onOpenChange,
  member,
  onGetDetails,
  onEdit,
  onDelete,
  onOpenSettle,
}) => {
  const { host } = useAuth()
  const { success } = useToast()
  const [details, setDetails] = useState<MemberDetail | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [copiedReminder, setCopiedReminder] = useState<boolean>(false)
  const [showQrPreview, setShowQrPreview] = useState<boolean>(false)

  useEffect(() => {
    if (member && open) {
      setIsLoading(true)
      onGetDetails(member.id)
        .then((data) => {
          setDetails(data)
        })
        .catch((err) => {
          console.error('Failed to fetch member details', err)
        })
        .finally(() => {
          setIsLoading(false)
        })
    } else {
      setDetails(null)
      setShowQrPreview(false)
      setCopiedReminder(false)
    }
  }, [member, open, onGetDetails])

  if (!member) return null

  // Bank profile for VietQR reminder
  const savedState = loadCalculatorState()
  const bankBin = host?.bank_bin || savedState.bankProfile.bankBin || '970422'
  const bankAccount =
    host?.bank_account_number || savedState.bankProfile.accountNumber || ''
  const bankAccountName =
    host?.bank_account_name || savedState.bankProfile.accountName || ''
  const bankInfo = findBankByBin(bankBin)
  const bankName = bankInfo?.shortName || 'Ngân hàng'

  const totalDebt = details ? details.total_debt : member.total_debt
  const vietQrUrl = generateVietQRQuicklink({
    bankBin,
    accountNumber: bankAccount,
    accountName: bankAccountName,
    amount: totalDebt > 0 ? totalDebt : undefined,
    memo: `TIEN SAN ${member.name.toUpperCase()}`,
  })

  // Pre-filled formatted reminder message
  const reminderMessage = `Chào ${member.name}, bạn còn khoản tiền sân cầu lông chưa thanh toán là ${formatVND(totalDebt)}.
Nhờ bạn chuyển khoản qua:
- STK: ${bankAccount || 'Chưa cài STK'}
- Ngân hàng: ${bankName}
- Tên chủ TK: ${bankAccountName || 'Chủ sân'}
- Nội dung: TIEN SAN ${member.name}
${vietQrUrl ? `Link quét QR: ${vietQrUrl}` : ''}
Cảm ơn bạn!`.trim()

  const handleCopyReminder = async () => {
    try {
      await navigator.clipboard.writeText(reminderMessage)
      setCopiedReminder(true)
      success('Đã sao chép lời nhắc!', 'Bạn có thể dán vào tin nhắn Zalo hoặc SMS.')
      setTimeout(() => setCopiedReminder(false), 2500)
    } catch {
      // Fallback
    }
  }

  const getStatusBadge = (status: DebtRecord['status']) => {
    switch (status) {
      case 'settled':
        return (
          <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            Đã thanh toán
          </span>
        )
      case 'partially_paid':
        return (
          <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
            Trả 1 phần
          </span>
        )
      case 'forgiven':
        return (
          <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-slate-700/50 text-slate-300 border border-slate-600">
            Đã miễn nợ
          </span>
        )
      default:
        return (
          <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
            Chưa trả
          </span>
        )
    }
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[92vh] bg-slate-900 border-t border-slate-800 text-slate-100">
        <DrawerHeader className="text-left pb-2">
          <div className="flex items-start justify-between gap-3">
            <div>
              <DrawerTitle className="flex items-center gap-2 text-xl font-bold text-white">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm ${
                    member.gender === 'female'
                      ? 'bg-pink-500/20 text-pink-400 border border-pink-500/30'
                      : 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                  }`}
                >
                  {member.name.charAt(0).toUpperCase()}
                </div>
                <span>{member.name}</span>
              </DrawerTitle>
              <DrawerDescription className="text-xs text-slate-400 flex items-center gap-2 mt-1">
                {member.gender === 'female' ? (
                  <span className="text-pink-400 flex items-center gap-1">
                    <UserCheck className="w-3.5 h-3.5" /> Nữ
                  </span>
                ) : (
                  <span className="text-sky-400 flex items-center gap-1">
                    <User className="w-3.5 h-3.5" /> Nam
                  </span>
                )}
                {member.phone && (
                  <a
                    href={`tel:${member.phone}`}
                    className="flex items-center gap-1 text-slate-300 hover:text-emerald-400"
                  >
                    <Phone className="w-3 h-3 text-slate-500" />
                    <span>{member.phone}</span>
                  </a>
                )}
                {!member.is_active && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700">
                    Tạm ngưng
                  </span>
                )}
              </DrawerDescription>
            </div>

            {/* Settle Action Button if has debt */}
            {totalDebt > 0 && (
              <Button
                size="sm"
                onClick={() => onOpenSettle(member)}
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shrink-0 shadow-lg shadow-emerald-950/40"
              >
                <Receipt className="w-3.5 h-3.5 mr-1" />
                Thu nợ
              </Button>
            )}
          </div>
        </DrawerHeader>

        <div className="p-4 space-y-4 overflow-y-auto max-h-[calc(92vh-140px)]">
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
              <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                <Calendar className="w-3.5 h-3.5 text-teal-400" />
                <span>Số trận đã chơi</span>
              </div>
              <div className="text-xl font-bold text-white">
                {isLoading ? '...' : details?.attended_sessions_count ?? 0}
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
              <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                <TrendingDown
                  className={`w-3.5 h-3.5 ${totalDebt > 0 ? 'text-rose-400' : 'text-emerald-400'}`}
                />
                <span>Tổng nợ còn lại</span>
              </div>
              <div
                className={`text-xl font-bold ${
                  totalDebt > 0 ? 'text-rose-400' : 'text-emerald-400'
                }`}
              >
                {formatVND(totalDebt)}
              </div>
            </div>
          </div>

          {/* VietQR Debt Reminder Section (AC-6) */}
          {totalDebt > 0 && (
            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-emerald-950/30 to-teal-950/20 border border-emerald-800/40 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <MessageSquare className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-bold text-emerald-200">
                    Lời nhắc thanh toán VietQR
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowQrPreview(!showQrPreview)}
                    className="h-7 px-2 text-[11px] text-emerald-400 hover:bg-emerald-900/30"
                  >
                    <QrCode className="w-3.5 h-3.5 mr-1" />
                    {showQrPreview ? 'Ẩn mã QR' : 'Xem QR'}
                  </Button>

                  <Button
                    type="button"
                    size="sm"
                    onClick={handleCopyReminder}
                    className="h-7 px-2.5 text-[11px] bg-emerald-600 hover:bg-emerald-500 text-white font-medium shadow-sm"
                  >
                    <Copy className="w-3 h-3 mr-1" />
                    {copiedReminder ? 'Đã sao chép' : 'Sao chép tin nhắn'}
                  </Button>
                </div>
              </div>

              {/* Message preview snippet */}
              <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-[11px] text-slate-300 font-mono whitespace-pre-line select-all leading-relaxed">
                {reminderMessage}
              </div>

              {/* VietQR Image Preview */}
              {showQrPreview && vietQrUrl && (
                <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-white text-slate-900 text-center animate-in fade-in zoom-in-95 duration-200">
                  <img
                    src={vietQrUrl}
                    alt={`VietQR ${member.name}`}
                    className="w-48 h-48 object-contain rounded-lg"
                  />
                  <div className="text-xs font-bold mt-1 text-slate-800">
                    {formatVND(totalDebt)}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    {bankAccount} • {bankAccountName}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Member Default Note */}
          {member.default_note && (
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs">
              <span className="text-slate-400 font-medium">Ghi chú: </span>
              <span className="text-slate-200">{member.default_note}</span>
            </div>
          )}

          {/* Chronological Debt Ledger (AC-4) */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Receipt className="w-3.5 h-3.5 text-slate-400" />
              Lịch sử ghi nợ & thanh toán ({details?.debt_records.length ?? 0})
            </h4>

            {isLoading ? (
              <div className="py-6 text-center text-xs text-slate-500">
                Đang tải lịch sử ghi nợ...
              </div>
            ) : !details?.debt_records || details.debt_records.length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-center text-xs text-slate-500">
                Chưa có khoản nợ nào được ghi nhận.
              </div>
            ) : (
              <div className="space-y-2">
                {details.debt_records.map((debt) => (
                  <div
                    key={debt.id}
                    className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-200 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-500" />
                        {formatSessionDateTime(debt.created_at)}
                      </span>
                      {getStatusBadge(debt.status)}
                    </div>

                    <div className="flex items-center justify-between text-slate-400">
                      <span>Phải thu:</span>
                      <span className="font-bold text-slate-200">
                        {formatVND(debt.amount_owed)}
                      </span>
                    </div>

                    {debt.amount_paid > 0 && (
                      <div className="flex items-center justify-between text-slate-400">
                        <span>Đã trả:</span>
                        <span className="font-semibold text-emerald-400">
                          {formatVND(debt.amount_paid)}
                        </span>
                      </div>
                    )}

                    {debt.note && (
                      <div className="text-[11px] text-slate-400 bg-slate-900/80 p-1.5 rounded border border-slate-800/80">
                        {debt.note}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DrawerFooter className="px-4 py-3 border-t border-slate-800 flex flex-row gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onEdit(member)}
            className="flex-1 border-slate-700 text-slate-300 hover:bg-slate-800 text-xs"
          >
            <Edit2 className="w-3.5 h-3.5 mr-1" />
            Chỉnh sửa
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onDelete(member)}
            className="px-3 text-rose-400 hover:bg-rose-950/30 text-xs"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>

          <DrawerClose asChild>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="flex-1 border-slate-700 text-slate-400 hover:bg-slate-800 text-xs"
            >
              Đóng
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
