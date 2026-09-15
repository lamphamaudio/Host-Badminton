import React from 'react'
import {
  QrCode,
  Copy,
  Check,
  Share2,
  Sparkles,
  Building2,
  Download,
  Settings,
  Clock,
} from 'lucide-react'
import { toPng } from 'html-to-image'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatVND, formatSessionDateTime } from '@/lib/formatters'
import { useToast } from '@/lib/toast'
import { SplitMode } from '@/lib/calculator'

export interface BillSessionData {
  venueName: string
  courtNumber?: string
  sessionDate: Date | string
  splitMode: SplitMode
  maleCount: number
  femaleCount: number
  maleFee: number
  femaleFee: number
  earlyCount?: number
  stayCount?: number
  earlyFee?: number
  stayFee?: number
  courtFee: number
  shuttleFee: number
  shuttleCount?: number
  totalAmount: number
  fundBuffer?: number
  bankName: string
  accountNumber: string
  accountName: string
  transferContent: string
  qrImageUrl?: string
  offlineQrDataUrl?: string
}

export interface BillCardPreviewProps {
  data: BillSessionData
  className?: string
  onEditBank?: () => void
  onShare?: () => void
  onSaveSession?: () => void
  isSaving?: boolean
  isSaved?: boolean
}

export function BillCardPreview({
  data,
  className,
  onEditBank,
  onShare,
  onSaveSession,
  isSaving,
  isSaved,
}: BillCardPreviewProps) {

  const { success, error } = useToast()
  const [copied, setCopied] = React.useState(false)
  const [isExporting, setIsExporting] = React.useState(false)
  const [qrLoadFailed, setQrLoadFailed] = React.useState(false)

  const cardRef = React.useRef<HTMLDivElement>(null)

  const totalParticipants = data.maleCount + data.femaleCount

  const handleCopySummary = () => {
    let splitSummaryText: string
    if (data.splitMode === 'multi_stage' && data.earlyCount && data.earlyCount > 0) {
      splitSummaryText = `👥 CHIA TIỀN (2 HIỆP):
- Về sớm (${data.earlyCount} người): ${formatVND(data.earlyFee || 0)} / người
- Chơi hết (${data.stayCount || 0} người): ${formatVND(data.stayFee || 0)} / người`
    } else if (data.maleCount > 0 && data.femaleCount > 0 && data.maleFee !== data.femaleFee) {
      splitSummaryText = `👥 CHIA TIỀN:
- Nam (${data.maleCount} người): ${formatVND(data.maleFee)} / người
- Nữ (${data.femaleCount} người): ${formatVND(data.femaleFee)} / người`
    } else {
      splitSummaryText = `👥 CHIA TIỀN:
- Mỗi người (${totalParticipants} người): ${formatVND(data.maleFee || data.femaleFee)} / người`
    }

    const summaryText = `🏸 [HOST BADMINTON - HÓA ĐƠN TIỀN SÂN]
📍 Sân: ${data.venueName} ${data.courtNumber ? `(Sân ${data.courtNumber})` : ''}
⏰ Thời gian: ${formatSessionDateTime(data.sessionDate)}

💰 TỔNG CHI PHÍ: ${formatVND(data.totalAmount)}
- Tiền sân: ${formatVND(data.courtFee)}
- Tiền cầu (${data.shuttleCount || 0} quả): ${formatVND(data.shuttleFee)}

${splitSummaryText}

🏦 THÔNG TIN CHUYỂN KHOẢN:
- Ngân hàng: ${data.bankName}
- STK: ${data.accountNumber || 'Chưa nhập STK'}
- Chủ TK: ${data.accountName || 'Chưa nhập tên'}
- Nội dung: ${data.transferContent}

Cảm ơn mọi người đã tham gia buổi chơi! 🙌`

    navigator.clipboard.writeText(summaryText)
    setCopied(true)
    success('Đã sao chép hóa đơn', 'Nội dung đã sẵn sàng gửi qua Zalo / Messenger')
    setTimeout(() => setCopied(false), 2500)
  }

  const handleDownloadPng = async () => {
    if (!cardRef.current) return

    try {
      setIsExporting(true)
      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: '#ffffff',
      })

      const link = document.createElement('a')
      link.download = `bill-${data.venueName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.png`
      link.href = dataUrl
      link.click()
      success('Đã tải ảnh hóa đơn', 'Ảnh thẻ VietQR đã được lưu về máy')
    } catch (err) {
      console.error('Failed to export PNG:', err)
      error('Không thể xuất ảnh', 'Vui lòng chụp màn hình hoặc sao chép văn bản')
    } finally {
      setIsExporting(false)
    }
  }

  const qrImageSource =
    qrLoadFailed && data.offlineQrDataUrl
      ? data.offlineQrDataUrl
      : data.qrImageUrl || data.offlineQrDataUrl

  return (
    <div className={`flex flex-col gap-3 w-full ${className || ''}`}>
      {/* Bill Card Visual Container */}
      <div
        ref={cardRef}
        id="bill-card-capture"
        className="relative overflow-hidden bg-white border border-slate-900 p-5 rounded-3xl shadow-sm text-slate-900"
      >
        {/* Top Accent Line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-slate-900" />

        {/* Header Summary */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-800">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-base font-extrabold text-slate-900 tracking-tight leading-tight">
                {data.venueName}
              </h4>
              <p className="text-[11px] text-slate-500">
                {formatSessionDateTime(data.sessionDate)}
                {data.courtNumber && ` · Sân ${data.courtNumber}`}
              </p>
            </div>
          </div>
          <Badge variant="paid" size="sm" dot>
            {totalParticipants} người
          </Badge>
        </div>

        {/* Cost Breakdown Table */}
        <div className="py-4 space-y-2 text-xs border-b border-slate-200">
          <div className="flex justify-between text-slate-600">
            <span>Tiền sân</span>
            <span className="font-mono tabular-nums text-slate-900 font-medium">
              {formatVND(data.courtFee)}
            </span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>Tiền cầu ({data.shuttleCount || 0} quả)</span>
            <span className="font-mono tabular-nums text-slate-900 font-medium">
              {formatVND(data.shuttleFee)}
            </span>
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-slate-100 font-bold">
            <span className="text-slate-900 text-sm">Tổng cộng</span>
            <span className="font-mono tabular-nums text-emerald-700 text-base">
              {formatVND(data.totalAmount)}
            </span>
          </div>
        </div>

        {/* Player Splits Box */}
        {data.splitMode === 'multi_stage' && data.earlyCount && data.earlyCount > 0 ? (
          <div className="grid grid-cols-2 gap-2.5 my-4">
            <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-3 flex flex-col items-center text-center">
              <div className="flex items-center gap-1 text-[11px] font-semibold text-amber-800 uppercase tracking-wider">
                <Clock className="w-3 h-3" />
                <span>Về sớm ({data.earlyCount})</span>
              </div>
              <span className="font-mono tabular-nums text-lg font-extrabold text-amber-900 mt-0.5">
                {formatVND(data.earlyFee || 0)}
              </span>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 flex flex-col items-center text-center">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Chơi hết ({data.stayCount})
              </span>
              <span className="font-mono tabular-nums text-lg font-extrabold text-slate-900 mt-0.5">
                {formatVND(data.stayFee || 0)}
              </span>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2.5 my-4">
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 flex flex-col items-center text-center">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Nam ({data.maleCount})
              </span>
              <span className="font-mono tabular-nums text-lg font-extrabold text-slate-900 mt-0.5">
                {formatVND(data.maleFee)}
              </span>
            </div>
            <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-3 flex flex-col items-center text-center">
              <span className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider">
                Nữ ({data.femaleCount})
              </span>
              <span className="font-mono tabular-nums text-lg font-extrabold text-emerald-900 mt-0.5">
                {formatVND(data.femaleFee)}
              </span>
            </div>
          </div>
        )}

        {/* VietQR Bank Payment Box */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col items-center gap-3">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Quét VietQR để thanh toán</span>
            </div>
            {onEditBank && (
              <button
                type="button"
                onClick={onEditBank}
                className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
              >
                <Settings className="w-3 h-3" />
                <span>Đổi STK</span>
              </button>
            )}
          </div>

          {/* QR Code Frame */}
          <div className="w-44 h-44 bg-white p-2.5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-center">
            {qrImageSource ? (
              <img
                src={qrImageSource}
                alt="VietQR Payment Code"
                onError={() => setQrLoadFailed(true)}
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="w-full h-full border border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center text-slate-400 text-center p-2">
                <QrCode className="w-12 h-12 text-slate-800 mb-1" />
                <span className="text-[10px] font-semibold text-slate-600">
                  {data.bankName || 'Chưa chọn ngân hàng'}
                </span>
              </div>
            )}
          </div>

          {/* Account Details */}
          <div className="w-full text-center space-y-0.5 text-xs pt-1">
            <div className="font-mono font-bold text-slate-900 tracking-wider text-sm">
              {data.accountNumber || 'Chưa nhập số tài khoản'}
            </div>
            <div className="text-[11px] text-slate-500 uppercase font-semibold">
              {data.accountName || 'Chưa nhập tên chủ tài khoản'} · {data.bankName}
            </div>
            <div className="text-[10px] text-slate-700 font-mono pt-1">
              ND: {data.transferContent}
            </div>
          </div>
        </div>

        {/* Bottom Card Watermark */}
        <div className="text-center text-[10px] text-slate-400 pt-3 flex items-center justify-center gap-1">
          <span>Tạo bởi Host Badminton</span>
        </div>
      </div>

      {/* Save Session Action */}
      {onSaveSession && (
        <Button
          onClick={onSaveSession}
          disabled={isSaving || isSaved}
          className={`w-full h-11 font-bold rounded-2xl flex items-center justify-center gap-2 shadow-sm transition-all ${
            isSaved
              ? 'bg-emerald-50 border border-emerald-300 text-emerald-800 cursor-default'
              : 'bg-slate-900 hover:bg-slate-800 text-white'
          }`}
        >
          {isSaved ? (
            <>
              <Check className="w-4 h-4 text-emerald-600" />
              <span>Đã lưu vào lịch sử</span>
            </>
          ) : isSaving ? (
            <span>Đang lưu vào lịch sử...</span>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>Lưu buổi chơi vào lịch sử</span>
            </>
          )}
        </Button>
      )}

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-2">
        <Button onClick={handleCopySummary} variant="secondary" className="w-full">
          {copied ? (
            <>
              <Check className="w-4 h-4 text-emerald-600" />
              <span>Đã sao chép</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4 text-slate-500" />
              <span>Chép hóa đơn</span>
            </>
          )}
        </Button>

        <Button
          onClick={handleDownloadPng}
          variant="outline"
          className="w-full"
          disabled={isExporting}
        >
          {isExporting ? (
            <span>Đang tạo ảnh...</span>
          ) : (
            <>
              <Download className="w-4 h-4 text-slate-700" />
              <span>Tải ảnh bill</span>
            </>
          )}
        </Button>
      </div>

      {onShare && (
        <Button onClick={onShare} variant="outline" className="w-full">
          <Share2 className="w-4 h-4" />
          <span>Chia sẻ Zalo / Messenger</span>
        </Button>
      )}
    </div>
  )
}
