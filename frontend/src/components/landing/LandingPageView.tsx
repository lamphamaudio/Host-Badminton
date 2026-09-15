/* Hallmark · pre-emit critique: P5 H5 E5 S5 R5 V5 */
/* Hallmark · genre: modern-minimal · macrostructure: Workbench · theme: modern-minimal · enrichment: none (interactive studio) · nav: N5 Floating pill · footer: Ft5 Statement */

import React, { useState } from 'react'
import {
  ArrowRight,
  Calculator,
  Check,
  ChevronDown,
  Copy,
  LogIn,
  QrCode,
  Receipt,
  Users,
  Wifi,
  Zap,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatVND } from '@/lib/formatters'

interface LandingPageViewProps {
  onEnterApp: () => void
  onOpenLogin: () => void
  isAuthenticated?: boolean
  hostName?: string | null
}

export const LandingPageView: React.FC<LandingPageViewProps> = ({
  onEnterApp,
  onOpenLogin,
  isAuthenticated = false,
  hostName,
}) => {
  // Interactive mini calculator studio state
  const [courtFee, setCourtFee] = useState(160000)
  const [shuttleCount, setShuttleCount] = useState(4)
  const [maleCount, setMaleCount] = useState(5)
  const [femaleCount, setFemaleCount] = useState(3)
  const [hasEarlyLeaverMode, setHasEarlyLeaverMode] = useState(false)
  const [copiedBill, setCopiedBill] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  const shuttleFee = shuttleCount * 25000
  const totalCost = courtFee + shuttleFee
  const totalPlayers = Math.max(1, maleCount + femaleCount)

  // Split calculation
  const feePerPersonStandard = Math.round(totalCost / totalPlayers / 1000) * 1000

  // 2-stage split approximation:
  // Stage 1 (1h with early leavers): 50% cost split across all players
  // Stage 2 (1h remaining): 50% cost split across remaining stayers
  const stayers = Math.max(1, totalPlayers - 1)
  const stage1PerPerson = Math.round((totalCost * 0.5) / totalPlayers / 1000) * 1000
  const stage2PerPerson = Math.round((totalCost * 0.5) / stayers / 1000) * 1000
  const earlyLeaverFee = stage1PerPerson
  const stayerFee = stage1PerPerson + stage2PerPerson

  const handleCopyDemoBill = () => {
    const text = `🏸 BILL CẦU LÔNG (HOST BADMINTON)\n━━━━━━━━━━━━━━━━━━━━\n• Tiền sân (2h): ${formatVND(courtFee)}\n• Tiền cầu (${shuttleCount} quả): ${formatVND(shuttleFee)}\n• Tổng chi phí: ${formatVND(totalCost)}\n• Sĩ số: ${totalPlayers} người (${maleCount} Nam, ${femaleCount} Nữ)\n────────────────────\n👉 Mỗi người: ${formatVND(feePerPersonStandard)}\n💳 VietQR Napas247: Quét mã chuyển khoản trực tiếp`
    navigator.clipboard?.writeText?.(text)
    setCopiedBill(true)
    setTimeout(() => setCopiedBill(false), 2000)
  }

  const faqs = [
    {
      q: 'Host Badminton có thu phí sử dụng không?',
      a: 'Hoàn toàn miễn phí 100% dành cho tất cả các chủ sân, trưởng nhóm và người tổ chức cầu lông phong trào tại Việt Nam. Không thu bất kỳ khoản phí nào và không chèn quảng cáo.',
    },
    {
      q: 'Tôi có bắt buộc phải đăng nhập để tính tiền không?',
      a: 'Không bắt buộc. Bạn có thể bấm "Bắt đầu tính tiền ngay" để tính toán trực tiếp trên sân ở chế độ Khách (Guest). Khi đăng nhập, hệ thống sẽ tự động lưu trữ danh sách sân, lịch sử buổi chơi và sổ nợ thành viên.',
    },
    {
      q: 'Mã VietQR được tạo ra như thế nào?',
      a: 'Hệ thống tự động sinh mã VietQR Quicklink chuẩn Napas 247 liên kết với hơn 50 ngân hàng Việt Nam. Tiền được chuyển trực tiếp vào tài khoản ngân hàng của Host mà không qua bất kỳ trung gian nào.',
    },
    {
      q: 'Tính năng chia tiền người về sớm hiệp 1 hoạt động ra sao?',
      a: 'Bộ tính tiền phân bổ chi phí thành 2 giai đoạn (Giai đoạn 1 cho toàn bộ người chơi, Giai đoạn 2 chỉ cho những người ở lại trọn buổi). Điều này đảm bảo công bằng tuyệt đối cho người bận việc về trước.',
    },
    {
      q: 'Nếu sân cầu lông bị mất sóng hoặc mất mạng internet thì sao?',
      a: 'Host Badminton hoạt động theo cơ chế Offline First (PWA). Mọi tính toán và lưu phiên đều chạy trực tiếp trên trình duyệt của bạn và tự động đồng bộ khi có kết nối trở lại.',
    },
  ]

  return (
    <div className="min-h-screen bg-[#fafbfc] text-slate-900 selection:bg-emerald-100 selection:text-emerald-900 overflow-x-clip font-['Plus_Jakarta_Sans',sans-serif] antialiased">
      {/* 1. Tally-Style Floating Pill Navigation */}
      <header className="sticky top-3 z-50 w-full px-4 sm:px-6">
        <div className="max-w-5xl mx-auto h-14 rounded-full bg-white/90 border border-slate-200/90 backdrop-blur-md px-5 flex items-center justify-between shadow-[0_2px_15px_rgba(0,0,0,0.04)]">
          <div
            className="flex items-center gap-2.5 cursor-pointer select-none"
            onClick={onEnterApp}
          >
            <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center text-white font-bold text-xs">
              <Zap className="w-4 h-4 text-emerald-400 fill-emerald-400" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold tracking-tight text-slate-900">
                Host Badminton
              </span>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold border border-slate-200">
                v1.0
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-7 text-xs font-medium text-slate-600">
            <a href="#workbench" className="hover:text-slate-900 transition-colors">
              Bảng tính thử
            </a>
            <a href="#features" className="hover:text-slate-900 transition-colors">
              Tính năng
            </a>
            <a href="#workflow" className="hover:text-slate-900 transition-colors">
              Quy trình
            </a>
            <a href="#faq" className="hover:text-slate-900 transition-colors">
              Hỏi đáp
            </a>
          </nav>

          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <Button
                onClick={onEnterApp}
                className="h-8 px-3.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <span>Vào ứng dụng</span>
                {hostName ? (
                  <span className="text-slate-300">({hostName.split(' ')[0]})</span>
                ) : null}
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            ) : (
              <>
                <Button
                  variant="ghost"
                  onClick={onOpenLogin}
                  className="h-8 px-3 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-full font-medium cursor-pointer"
                >
                  <LogIn className="w-3.5 h-3.5 mr-1 text-slate-700" />
                  Đăng nhập
                </Button>
                <Button
                  onClick={onEnterApp}
                  className="h-8 px-3.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1 cursor-pointer shadow-sm"
                >
                  <span>Dùng ngay</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* 2. Asymmetric Modern-Minimal Hero Section */}
      <section className="pt-14 pb-12 md:pt-20 md:pb-16 px-4 sm:px-6 max-w-5xl mx-auto">
        <div className="space-y-5 max-w-3xl">
          <div className="inline-flex items-center gap-2 text-xs font-medium text-slate-500 bg-slate-100/80 px-3 py-1 rounded-full border border-slate-200/60">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span>Dành riêng cho chủ sân & trưởng nhóm cầu lông phong trào</span>
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.12]">
            Tính tiền sân & Thu nợ nhóm <br />
            <span className="text-slate-500 font-bold">Chính xác trong 5 giây.</span>
          </h1>

          <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl">
            Đơn giản như soạn thảo tài liệu. Không còn chia lẻ tiền cầu, quên ai nợ ai hay nhầm người
            về sớm. Mở trình duyệt, kéo số liệu, có ngay thẻ VietQR Napas247 gửi vào nhóm Zalo.
          </p>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
            <Button
              size="lg"
              onClick={onEnterApp}
              className="h-12 px-7 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md cursor-pointer active:translate-y-0.5 transition-transform"
            >
              <Calculator className="w-4 h-4" />
              <span>Bắt đầu tính tiền ngay</span>
              <ArrowRight className="w-4 h-4" />
            </Button>

            <Button
              size="lg"
              variant="outline"
              onClick={onOpenLogin}
              className="h-12 px-6 rounded-full border-slate-300 bg-white hover:bg-slate-50 text-slate-800 font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer shadow-sm"
            >
              <LogIn className="w-4 h-4 text-slate-600" />
              <span>Đăng nhập chủ sân</span>
            </Button>
          </div>

          {/* Minimal Feature Anchors */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-4 text-xs font-medium text-slate-500">
            <div className="flex items-center gap-1.5">
              <Check className="w-4 h-4 text-emerald-600" />
              <span className="text-slate-800 font-semibold">Mã VietQR</span> tự động
            </div>
            <div className="flex items-center gap-1.5">
              <Check className="w-4 h-4 text-emerald-600" />
              <span className="text-slate-800 font-semibold">Sổ nợ FIFO</span> minh bạch
            </div>
            <div className="flex items-center gap-1.5">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>Chia 2 chặng người về sớm</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>100% Offline Ready</span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Tally-Style Interactive Workbench (Document Studio) */}
      <section id="workbench" className="py-10 px-4 sm:px-6 max-w-5xl mx-auto">
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-[0_8px_30px_rgba(0,0,0,0.04)] overflow-hidden">
          {/* Studio Header Bar */}
          <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50/50">
            <div className="flex items-center gap-2.5">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-300"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-slate-300"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-slate-300"></span>
              </div>
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono">
                Bảng điều khiển giả lập
              </span>
            </div>
            <span className="text-xs text-slate-500 font-mono">
              Trực tiếp trên trình duyệt · Real-time Studio
            </span>
          </div>

          {/* Studio Body: Interactive Inputs (Left) + Live VietQR Slip (Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-100">
            {/* Left: Direct Parameters Controls */}
            <div className="lg:col-span-7 p-6 sm:p-8 space-y-6">
              <div>
                <div className="flex justify-between items-baseline mb-2">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                    1. Tiền thuê sân (2 giờ)
                  </span>
                  <span className="text-sm font-mono font-bold text-slate-900">
                    {formatVND(courtFee)}
                  </span>
                </div>
                <input
                  type="range"
                  min={80000}
                  max={300000}
                  step={10000}
                  value={courtFee}
                  onChange={(e) => setCourtFee(Number(e.target.value))}
                  className="w-full accent-slate-900 cursor-pointer h-2 bg-slate-100 rounded-lg"
                />
              </div>

              <div>
                <div className="flex justify-between items-baseline mb-2">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                    2. Cầu lông sử dụng (25.000đ/quả)
                  </span>
                  <span className="text-sm font-mono font-bold text-slate-900">
                    {shuttleCount} quả · {formatVND(shuttleFee)}
                  </span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={12}
                  step={1}
                  value={shuttleCount}
                  onChange={(e) => setShuttleCount(Number(e.target.value))}
                  className="w-full accent-slate-900 cursor-pointer h-2 bg-slate-100 rounded-lg"
                />
              </div>

              {/* Stepper Counters for Players */}
              <div>
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-2">
                  3. Số lượng người tham gia ({totalPlayers} người)
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">Nam</span>
                      <span className="text-[11px] text-slate-500">{maleCount} người</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
                      <button
                        type="button"
                        onClick={() => setMaleCount(Math.max(1, maleCount - 1))}
                        className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold text-xs flex items-center justify-center cursor-pointer"
                      >
                        -
                      </button>
                      <span className="font-mono font-bold text-xs w-6 text-center text-slate-900">
                        {maleCount}
                      </span>
                      <button
                        type="button"
                        onClick={() => setMaleCount(maleCount + 1)}
                        className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold text-xs flex items-center justify-center cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">Nữ</span>
                      <span className="text-[11px] text-slate-500">{femaleCount} người</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
                      <button
                        type="button"
                        onClick={() => setFemaleCount(Math.max(0, femaleCount - 1))}
                        className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold text-xs flex items-center justify-center cursor-pointer"
                      >
                        -
                      </button>
                      <span className="font-mono font-bold text-xs w-6 text-center text-slate-900">
                        {femaleCount}
                      </span>
                      <button
                        type="button"
                        onClick={() => setFemaleCount(femaleCount + 1)}
                        className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold text-xs flex items-center justify-center cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2-stage toggle */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-800 block">
                    Phân bổ 2 chặng (người về sớm)
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {hasEarlyLeaverMode
                      ? '1 người rời sân sau 1h, những người còn lại chơi 2h'
                      : 'Chia đều số tiền cho toàn bộ người chơi'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setHasEarlyLeaverMode(!hasEarlyLeaverMode)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold cursor-pointer transition-colors ${
                    hasEarlyLeaverMode
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                  }`}
                >
                  {hasEarlyLeaverMode ? 'Bật 2 chặng' : 'Chia đều'}
                </button>
              </div>
            </div>

            {/* Right: Live Realistic VietQR Payment Slip */}
            <div className="lg:col-span-5 p-6 sm:p-8 bg-slate-50/40 flex flex-col justify-between space-y-5">
              <div className="space-y-4">
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm text-center space-y-3">
                  <div className="flex items-center justify-between text-[11px] font-mono font-bold text-slate-500 border-b border-slate-100 pb-2">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      VIETQR · NAPAS247
                    </span>
                    <span>MB BANK</span>
                  </div>

                  <div className="w-28 h-28 mx-auto bg-slate-900 p-2.5 rounded-xl flex items-center justify-center shadow-inner">
                    <QrCode className="w-24 h-24 text-white" />
                  </div>

                  <div>
                    <span className="text-[11px] text-slate-500 uppercase tracking-wider block font-medium">
                      Mỗi người thanh toán
                    </span>
                    {hasEarlyLeaverMode ? (
                      <div className="space-y-0.5 mt-1">
                        <div className="text-sm font-mono font-bold text-slate-900">
                          Về sớm (1h): {formatVND(earlyLeaverFee)}
                        </div>
                        <div className="text-base font-mono font-black text-slate-900">
                          Ở lại (2h): {formatVND(stayerFee)}
                        </div>
                      </div>
                    ) : (
                      <div className="text-2xl font-mono font-black text-slate-900 tracking-tight mt-0.5">
                        {formatVND(feePerPersonStandard)}
                      </div>
                    )}
                    <span className="text-[11px] font-mono text-slate-400 block mt-1">
                      Nội dung: CAULONG {maleCount + femaleCount}N
                    </span>
                  </div>
                </div>

                <div className="text-xs text-slate-500 space-y-1 leading-relaxed">
                  <p>• Tổng chi phí buổi: <strong className="text-slate-800 font-mono">{formatVND(totalCost)}</strong></p>
                  <p>• Người chơi mở app ngân hàng quét mã, số tiền & nội dung tự điền chính xác.</p>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyDemoBill}
                  className="w-full h-9 rounded-xl border-slate-300 bg-white hover:bg-slate-100 text-slate-800 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                >
                  {copiedBill ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span className="text-emerald-700">Đã sao chép nội dung bill</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-slate-600" />
                      <span>Sao chép bill gửi Zalo</span>
                    </>
                  )}
                </Button>

                <Button
                  size="sm"
                  onClick={onEnterApp}
                  className="w-full h-9 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>Mở bàn tính chính thức</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Tally-Style Document Blocks Feature Stories */}
      <section id="features" className="py-14 px-4 sm:px-6 max-w-5xl mx-auto space-y-12">
        <div className="max-w-2xl">
          <span className="text-xs font-mono uppercase tracking-wider text-slate-500 font-bold block mb-1">
            Được thiết kế cho Host cầu lông
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Tất cả những gì bạn cần sau mỗi trận đấu.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Feature 1 */}
          <div className="p-7 rounded-3xl bg-white border border-slate-200/90 shadow-[0_4px_20px_rgba(0,0,0,0.02)] space-y-3">
            <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-900">
              <QrCode className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Mã VietQR Napas247 tự động</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Tạo mã QR kèm số tiền lẻ chính xác đến từng nghìn đồng. Người chơi quét 1 chạm, tiền về
              thẳng tài khoản ngân hàng của Host mà không cần thông qua ví trung gian.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="p-7 rounded-3xl bg-white border border-slate-200/90 shadow-[0_4px_20px_rgba(0,0,0,0.02)] space-y-3">
            <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-900">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Công thức chia 2 chặng công bằng</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Tự động tính tiền cho người chỉ chơi hiệp 1 và người ở lại trọn buổi. Xóa tan tranh cãi,
              đảm bảo mọi người đều vui vẻ và minh bạch về chi phí.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="p-7 rounded-3xl bg-white border border-slate-200/90 shadow-[0_4px_20px_rgba(0,0,0,0.02)] space-y-3">
            <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-900">
              <Receipt className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Sổ nợ FIFO & Lịch sử buổi chơi</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Ghi nhận thành viên chuyển thiếu hoặc nợ tuần trước. Khi thành viên thanh toán, hệ thống
              tự động trừ nợ theo thứ tự thời gian vào sổ kế toán.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="p-7 rounded-3xl bg-white border border-slate-200/90 shadow-[0_4px_20px_rgba(0,0,0,0.02)] space-y-3">
            <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-900">
              <Wifi className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Offline First · Chạy tốt khi mất mạng</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Sân nằm ở tầng hầm hoặc góc khuất không có sóng 4G? Bạn vẫn mở app và tính tiền bình
              thường. Dữ liệu sẽ tự động đồng bộ lên đám mây khi có kết nối trở lại.
            </p>
          </div>
        </div>
      </section>

      {/* 5. Minimalist 3-Step Workflow Section */}
      <section id="workflow" className="py-14 bg-white border-y border-slate-200/80">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="max-w-2xl mb-10">
            <span className="text-xs font-mono uppercase tracking-wider text-slate-500 font-bold block mb-1">
              3 bước đơn giản
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Vận hành trơn tru trong 30 giây
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="text-xs font-mono font-bold text-slate-400">01 /</div>
              <h3 className="text-sm font-bold text-slate-900">Nhập thông số trên sân</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Nhập số giờ sân, số quả cầu đã dùng và danh sách người chơi nam/nữ.
              </p>
            </div>

            <div className="space-y-2">
              <div className="text-xs font-mono font-bold text-slate-400">02 /</div>
              <h3 className="text-sm font-bold text-slate-900">Kiểm tra phân bổ chi phí</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Hệ thống áp dụng công thức làm tròn và phân chia chặng người về sớm hoàn toàn tự động.
              </p>
            </div>

            <div className="space-y-2">
              <div className="text-xs font-mono font-bold text-slate-400">03 /</div>
              <h3 className="text-sm font-bold text-slate-900">Gửi VietQR vào nhóm</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Cho mọi người quét QR trực tiếp hoặc sao chép văn bản bill gửi vào nhóm Zalo / Messenger.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. FAQ Section (Tally-Style Clean Borderless Accordion) */}
      <section id="faq" className="py-14 px-4 sm:px-6 max-w-3xl mx-auto">
        <div className="mb-8">
          <span className="text-xs font-mono uppercase tracking-wider text-slate-500 font-bold block mb-1">
            Giải đáp thắc mắc
          </span>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Câu hỏi thường gặp
          </h2>
        </div>

        <div className="divide-y divide-slate-200">
          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx
            return (
              <div key={idx} className="py-4 transition-colors">
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full text-left flex items-center justify-between text-sm font-bold text-slate-900 hover:text-slate-700 cursor-pointer"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 text-slate-900' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="pt-2.5 text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {faq.a}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </section>

      {/* 7. Final Clean CTA Section */}
      <section className="py-16 bg-slate-900 text-white text-center px-4">
        <div className="max-w-xl mx-auto space-y-4">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Sẵn sàng cho buổi cầu lông tối nay?
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Dùng thử ngay bộ tính tiền chia theo sân, chia theo cầu và tạo mã VietQR hoàn toàn miễn
            phí.
          </p>
          <div className="pt-2">
            <Button
              size="lg"
              onClick={onEnterApp}
              className="h-12 px-8 rounded-full bg-white hover:bg-slate-100 text-slate-900 font-bold text-sm inline-flex items-center gap-2 cursor-pointer shadow-lg active:translate-y-0.5 transition-transform"
            >
              <Calculator className="w-4 h-4" />
              <span>Mở ứng dụng tính tiền ngay</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* 8. Minimalist Statement Footer */}
      <footer className="py-8 px-4 sm:px-6 border-t border-slate-200 bg-white text-slate-500 text-xs">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900">🏸 Host Badminton</span>
            <span>·</span>
            <span>Nền tảng miễn phí cho cộng đồng cầu lông phong trào Việt Nam</span>
          </div>

          <div className="text-[11px] font-mono text-slate-400">
            © 2026 Host Badminton · Mobile First & Offline Ready
          </div>
        </div>
      </footer>
    </div>
  )
}
