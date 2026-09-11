/* Hallmark · pre-emit critique: P5 H5 E5 S5 R5 V5 */
/* Hallmark · macrostructure: Bento Grid · theme: Sport · enrichment: none (interactive demo) · nav: N5 Floating pill · footer: Ft5 Statement */

import React, { useState } from 'react'
import {
  ArrowRight,
  Calculator,
  Check,
  ChevronDown,
  Clock,
  Copy,
  CreditCard,
  Database,
  LogIn,
  MapPin,
  QrCode,
  Receipt,
  Sparkles,
  User,
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
  // Interactive mini calculator preview state
  const [courtFee, setCourtFee] = useState(160000)
  const [shuttleCount, setShuttleCount] = useState(4)
  const [maleCount, setMaleCount] = useState(5)
  const [femaleCount, setFemaleCount] = useState(3)
  const [earlyLeavers, setEarlyLeavers] = useState(1)
  const [hasEarlyLeaverMode, setHasEarlyLeaverMode] = useState(false)
  const [copiedBill, setCopiedBill] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  const shuttleFee = shuttleCount * 25000
  const totalCost = courtFee + shuttleFee
  const totalPlayers = Math.max(1, maleCount + femaleCount)

  // Split calculations
  const feePerPersonStandard = Math.round(totalCost / totalPlayers / 1000) * 1000

  // 2-stage split approximation for demo:
  // Stage 1 (1h with early leavers): 50% cost split across all players
  // Stage 2 (1h remaining): 50% cost split across remaining players
  const stayers = Math.max(1, totalPlayers - (hasEarlyLeaverMode ? earlyLeavers : 0))
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
      a: 'Hoàn toàn miễn phí 100% dành cho tất cả các chủ sân, trưởng nhóm và người tổ chức cầu lông phong trào tại Việt Nam. Không có phí ẩn và không giới hạn số lượng buổi tính.',
    },
    {
      q: 'Tôi có bắt buộc phải đăng nhập để tính tiền không?',
      a: 'Không bắt buộc. Bạn có thể bấm "Bắt đầu tính tiền ngay" để dùng trực tiếp trên sân ở chế độ Khách (Guest). Khi đăng nhập, hệ thống sẽ tự động lưu trữ danh sách sân, lịch sử buổi chơi và sổ nợ thành viên.',
    },
    {
      q: 'Mã VietQR được tạo ra như thế nào?',
      a: 'Hệ thống tự động sinh mã VietQR Quicklink chuẩn Napas 247 liên kết với hơn 50 ngân hàng Việt Nam. Tiền được chuyển trực tiếp vào tài khoản ngân hàng của Host mà không qua trung gian.',
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
    <div className="min-h-screen bg-[#090d16] text-slate-100 selection:bg-emerald-500/20 selection:text-emerald-300 overflow-x-clip font-sans antialiased">
      {/* 1. Hallmark Floating Pill Navigation (Archetype N5) */}
      <header className="sticky top-3 z-50 w-full px-4 sm:px-6">
        <div className="max-w-5xl mx-auto h-14 rounded-2xl bg-[#111927]/90 border border-slate-800 backdrop-blur-md px-4 flex items-center justify-between shadow-2xl shadow-black/40">
          <div
            className="flex items-center gap-2.5 cursor-pointer select-none"
            onClick={onEnterApp}
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold">
              <Zap className="w-4 h-4" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold tracking-tight text-white">Host Badminton</span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                v1.0
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-slate-400">
            <a href="#features" className="hover:text-emerald-400 transition-colors">
              Tính năng
            </a>
            <a href="#demo" className="hover:text-emerald-400 transition-colors">
              Bảng tính thử
            </a>
            <a href="#workflow" className="hover:text-emerald-400 transition-colors">
              Quy trình
            </a>
            <a href="#faq" className="hover:text-emerald-400 transition-colors">
              Hỏi đáp
            </a>
          </nav>

          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <Button
                onClick={onEnterApp}
                className="h-8 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-md shadow-emerald-950/40"
              >
                <span>Vào ứng dụng</span>
                {hostName ? (
                  <span className="text-emerald-200">({hostName.split(' ')[0]})</span>
                ) : null}
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            ) : (
              <>
                <Button
                  variant="ghost"
                  onClick={onOpenLogin}
                  className="h-8 px-2.5 text-xs text-slate-300 hover:text-white hover:bg-slate-800 font-medium cursor-pointer"
                >
                  <LogIn className="w-3.5 h-3.5 mr-1 text-emerald-400" />
                  Đăng nhập
                </Button>
                <Button
                  onClick={onEnterApp}
                  className="h-8 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1 cursor-pointer shadow-md shadow-emerald-950/40"
                >
                  <span>Dùng ngay</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* 2. Hero Section · Structural Focus */}
      <section className="pt-12 pb-14 md:pt-18 md:pb-20 px-4 sm:px-6 max-w-5xl mx-auto">
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#111927] border border-emerald-500/30 text-emerald-400 text-xs font-medium">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>Dành riêng cho chủ sân & trưởng nhóm cầu lông phong trào</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Tính tiền sân & Thu nợ nhóm <br />
            <span className="text-emerald-400">Chính xác trong 5 giây</span>
          </h1>

          <p className="text-sm sm:text-base text-slate-400 leading-relaxed max-w-2xl mx-auto">
            Không còn nhẩm tính tiền lẻ, ghi chép sổ tay hay nhầm lẫn người về sớm. Tự động xuất mã
            VietQR Napas247, chia đều theo nam nữ và theo dõi công nợ thành viên chuẩn xác ngay trên
            sân.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3">
            <Button
              size="lg"
              onClick={onEnterApp}
              className="w-full sm:w-auto h-11 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50 cursor-pointer active:translate-y-0.5 transition-transform"
            >
              <Calculator className="w-4 h-4" />
              <span>Bắt đầu tính tiền ngay</span>
              <ArrowRight className="w-4 h-4" />
            </Button>

            <Button
              size="lg"
              variant="outline"
              onClick={onOpenLogin}
              className="w-full sm:w-auto h-11 px-5 rounded-xl border-slate-700 bg-[#111927] hover:bg-slate-800 text-slate-200 font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogIn className="w-4 h-4 text-emerald-400" />
              <span>Đăng nhập chủ sân</span>
            </Button>
          </div>

          {/* Value Proof Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-6 text-left">
            <div className="p-3 rounded-xl bg-[#111927] border border-slate-800 flex items-center gap-2.5">
              <QrCode className="w-4 h-4 text-emerald-400 shrink-0" />
              <div className="text-[11px] leading-tight text-slate-300">
                <span className="font-bold text-white block">Mã VietQR</span>
                Chuyển khoản 1 chạm
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#111927] border border-slate-800 flex items-center gap-2.5">
              <Users className="w-4 h-4 text-emerald-400 shrink-0" />
              <div className="text-[11px] leading-tight text-slate-300">
                <span className="font-bold text-white block">Chia nam / nữ</span>
                Tính người về sớm
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#111927] border border-slate-800 flex items-center gap-2.5">
              <Receipt className="w-4 h-4 text-emerald-400 shrink-0" />
              <div className="text-[11px] leading-tight text-slate-300">
                <span className="font-bold text-white block">Sổ nợ FIFO</span>
                Theo dõi & nhắc nợ
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#111927] border border-slate-800 flex items-center gap-2.5">
              <Wifi className="w-4 h-4 text-emerald-400 shrink-0" />
              <div className="text-[11px] leading-tight text-slate-300">
                <span className="font-bold text-white block">Offline First</span>
                Mất mạng vẫn dùng tốt
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Macrostructure 01 · Bento Grid with Live Interactive Playground */}
      <section id="demo" className="py-12 px-4 sm:px-6 max-w-5xl mx-auto">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-slate-800 pb-4">
          <div>
            <div className="text-xs font-mono uppercase tracking-wider text-emerald-400 font-semibold mb-1">
              Bento Grid · Kiến trúc chức năng
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white">
              Trực quan hóa buổi chơi của bạn
            </h2>
          </div>
          <div className="text-xs text-slate-400">
            Thử nghiệm công cụ tính và xem thẻ VietQR tự động cập nhật
          </div>
        </div>

        {/* Bento Irregular Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4" id="features">
          {/* Tile 1: 2x2 Large Interactive Calculator Sandbox */}
          <div className="md:col-span-2 rounded-2xl bg-[#111927] border border-slate-800 p-5 sm:p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <Calculator className="w-4 h-4" /> Bảng điều khiển giả lập
              </span>
              <span className="text-[11px] text-slate-400 font-mono">Chế độ tương tác tức thì</span>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <div className="flex justify-between text-slate-300 mb-1 font-medium">
                  <span>Tiền thuê sân (2 giờ):</span>
                  <span className="font-mono font-bold text-emerald-400">{formatVND(courtFee)}</span>
                </div>
                <input
                  type="range"
                  min={80000}
                  max={300000}
                  step={10000}
                  value={courtFee}
                  onChange={(e) => setCourtFee(Number(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                />
              </div>

              <div>
                <div className="flex justify-between text-slate-300 mb-1 font-medium">
                  <span>Số quả cầu sử dụng (25.000đ/quả):</span>
                  <span className="font-mono font-bold text-emerald-400">
                    {shuttleCount} quả ({formatVND(shuttleFee)})
                  </span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={12}
                  step={1}
                  value={shuttleCount}
                  onChange={(e) => setShuttleCount(Number(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                />
              </div>

              {/* Steppers for Players */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="p-3 rounded-xl bg-[#090d16] border border-slate-800">
                  <div className="text-[11px] text-slate-400 flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-emerald-400" /> Nam
                    </span>
                    <span className="font-mono text-slate-300">{maleCount} người</span>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => setMaleCount(Math.max(1, maleCount - 1))}
                      className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm cursor-pointer"
                    >
                      -
                    </button>
                    <span className="font-mono font-bold text-sm text-center flex-1">{maleCount}</span>
                    <button
                      type="button"
                      onClick={() => setMaleCount(maleCount + 1)}
                      className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[#090d16] border border-slate-800">
                  <div className="text-[11px] text-slate-400 flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-lime-400" /> Nữ
                    </span>
                    <span className="font-mono text-slate-300">{femaleCount} người</span>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => setFemaleCount(Math.max(0, femaleCount - 1))}
                      className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm cursor-pointer"
                    >
                      -
                    </button>
                    <span className="font-mono font-bold text-sm text-center flex-1">{femaleCount}</span>
                    <button
                      type="button"
                      onClick={() => setFemaleCount(femaleCount + 1)}
                      className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* Early leavers toggle */}
              <div className="p-3 rounded-xl bg-[#090d16] border border-slate-800 flex items-center justify-between">
                <div className="text-[11px]">
                  <span className="font-semibold text-white block">Chia 2 chặng (người về sớm)</span>
                  <span className="text-slate-400 text-[10px]">
                    {hasEarlyLeaverMode
                      ? `${earlyLeavers} người chơi 1h, ${stayers} người chơi 2h`
                      : 'Chia đều cho tất cả mọi người'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setHasEarlyLeaverMode(!hasEarlyLeaverMode)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                    hasEarlyLeaverMode
                      ? 'bg-emerald-500 text-slate-950 font-bold'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {hasEarlyLeaverMode ? 'Bật 2 chặng' : 'Chia đều'}
                </button>
              </div>

              {/* Live result calculation box */}
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-emerald-400 block font-medium">
                    Mỗi người thanh toán ({totalPlayers} người):
                  </span>
                  {hasEarlyLeaverMode ? (
                    <div className="text-xs font-mono font-bold text-white mt-0.5">
                      Về sớm: <span className="text-emerald-300">{formatVND(earlyLeaverFee)}</span> · Ở
                      lại: <span className="text-emerald-300">{formatVND(stayerFee)}</span>
                    </div>
                  ) : (
                    <div className="text-lg font-mono font-black text-white">
                      {formatVND(feePerPersonStandard)}
                    </div>
                  )}
                </div>
                <Button
                  size="sm"
                  onClick={onEnterApp}
                  className="h-8 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold cursor-pointer"
                >
                  Mở trên sân
                </Button>
              </div>
            </div>
          </div>

          {/* Tile 2: 1x2 Tall VietQR Live Bill Card */}
          <div className="rounded-2xl bg-[#111927] border border-slate-800 p-5 flex flex-col justify-between shadow-xl">
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <QrCode className="w-4 h-4" /> Thẻ VietQR
                </span>
                <span className="text-[10px] font-mono text-slate-400">Napas247 Quicklink</span>
              </div>

              {/* QR Mockup with high contrast */}
              <div className="p-3 rounded-xl bg-white text-slate-950 text-center space-y-2">
                <div className="flex items-center justify-between text-[10px] font-bold text-slate-600 border-b border-slate-200 pb-1 font-mono">
                  <span>VIETQR · NAPAS247</span>
                  <span>MB BANK</span>
                </div>
                <div className="w-28 h-28 mx-auto bg-slate-950 p-2 rounded-lg flex items-center justify-center">
                  <QrCode className="w-24 h-24 text-white" />
                </div>
                <div className="text-[11px] leading-tight">
                  <span className="font-mono font-extrabold text-slate-950 block text-xs">
                    {formatVND(hasEarlyLeaverMode ? stayerFee : feePerPersonStandard)}
                  </span>
                  <span className="text-[10px] text-slate-600 font-mono">
                    ND: CAULONG {maleCount + femaleCount}N
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-slate-400 leading-normal">
                Mỗi người chơi chỉ cần mở app ngân hàng quét mã, số tiền và nội dung chuyển khoản tự
                điền 100%.
              </p>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyDemoBill}
              className="w-full h-8 text-xs border-slate-700 bg-[#090d16] hover:bg-slate-800 text-slate-200 font-medium flex items-center justify-center gap-1.5 mt-3 cursor-pointer"
            >
              {copiedBill ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Đã chép nội dung bill</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  <span>Sao chép bill gửi Zalo</span>
                </>
              )}
            </Button>
          </div>

          {/* Tile 3: 1x1 Court & Venue Directory */}
          <div className="rounded-2xl bg-[#111927] border border-slate-800 p-5 space-y-2.5 shadow-xl">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <MapPin className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-white">Quản lý danh sách sân</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Lưu sẵn thông tin sân quen, đơn giá thuê mỗi giờ để tự động điền trong một chạm khi
              bước vào sân.
            </p>
          </div>

          {/* Tile 4: 1x1 FIFO Debt Ledger */}
          <div className="rounded-2xl bg-[#111927] border border-slate-800 p-5 space-y-2.5 shadow-xl">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Receipt className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-white">Sổ nợ thành viên FIFO</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Ghi nhận ai chuyển thiếu, ai nợ từ tuần trước. Tự động khấu trừ theo thứ tự thời gian
              khi thành viên thanh toán.
            </p>
          </div>

          {/* Tile 5: 1x1 Offline PWA Support */}
          <div className="rounded-2xl bg-[#111927] border border-slate-800 p-5 space-y-2.5 shadow-xl">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Database className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-white">Hoạt động Offline 100%</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Sân nằm ở tầng hầm hoặc góc khuất mất sóng 4G? Dữ liệu vẫn tính toán và lưu cục bộ, tự
              đồng bộ khi có mạng.
            </p>
          </div>
        </div>
      </section>

      {/* 4. Workflow Section · 3 Disciplined Steps */}
      <section id="workflow" className="py-12 bg-[#0d1320] border-y border-slate-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center space-y-1 mb-8">
            <div className="text-xs font-mono uppercase tracking-wider text-emerald-400 font-semibold">
              Quy trình 3 bước
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white">
              Vận hành trơn tru ngay tại sân cầu
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-[#111927] border border-slate-800 space-y-2">
              <div className="text-xs font-mono font-bold text-emerald-400">BƯỚC 01</div>
              <h3 className="text-sm font-bold text-white">Nhập thông số buổi chơi</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Nhập số giờ sân, số quả cầu đã dùng và danh sách người chơi (hoặc số lượng nam/nữ).
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#111927] border border-slate-800 space-y-2">
              <div className="text-xs font-mono font-bold text-emerald-400">BƯỚC 02</div>
              <h3 className="text-sm font-bold text-white">Kiểm tra chia tiền tự động</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Hệ thống áp dụng công thức làm tròn và phân chia chặng người về sớm hoàn toàn minh
                bạch.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#111927] border border-slate-800 space-y-2">
              <div className="text-xs font-mono font-bold text-emerald-400">BƯỚC 03</div>
              <h3 className="text-sm font-bold text-white">Gửi thẻ VietQR vào nhóm</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Đưa mã QR cho mọi người quét tại chỗ hoặc sao chép văn bản bill gửi vào nhóm Zalo /
                Messenger.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. FAQ Section (Conversational Accordion) */}
      <section id="faq" className="py-12 px-4 sm:px-6 max-w-3xl mx-auto">
        <div className="text-center space-y-1 mb-8">
          <div className="text-xs font-mono uppercase tracking-wider text-emerald-400 font-semibold">
            Giải đáp thắc mắc
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white">Câu hỏi thường gặp</h2>
        </div>

        <div className="space-y-2.5">
          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx
            return (
              <div
                key={idx}
                className="rounded-xl bg-[#111927] border border-slate-800 overflow-hidden transition-colors"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full px-4 py-3.5 text-left flex items-center justify-between text-xs sm:text-sm font-semibold text-slate-200 hover:text-white cursor-pointer"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 text-emerald-400' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-4 pb-3.5 text-xs text-slate-400 leading-relaxed border-t border-slate-800/60 pt-2.5">
                    {faq.a}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </section>

      {/* 6. Final CTA Strip */}
      <section className="py-12 bg-[#0d1320] border-t border-slate-800 text-center px-4">
        <div className="max-w-xl mx-auto space-y-3">
          <h2 className="text-xl sm:text-2xl font-bold text-white">
            Sẵn sàng cho buổi cầu lông tối nay?
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Dùng thử ngay bộ tính tiền chia theo sân, chia theo cầu và tạo mã VietQR hoàn toàn miễn
            phí.
          </p>
          <div className="pt-2">
            <Button
              size="lg"
              onClick={onEnterApp}
              className="h-11 px-7 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm inline-flex items-center gap-2 shadow-lg shadow-emerald-950/60 cursor-pointer"
            >
              <Calculator className="w-4 h-4" />
              <span>Mở ứng dụng tính tiền ngay</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* 7. Hallmark Statement Footer (Archetype Ft5) */}
      <footer className="py-8 px-4 sm:px-6 border-t border-slate-800/80 bg-[#090d16] text-slate-400 text-xs">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold text-[10px]">
              <Zap className="w-3 h-3" />
            </div>
            <span className="font-bold text-slate-200">Host Badminton</span>
            <span className="text-slate-600">·</span>
            <span>Nền tảng miễn phí cho cộng đồng cầu lông phong trào Việt Nam</span>
          </div>

          <div className="text-[11px] text-slate-400 font-mono">
            © 2026 Host Badminton · Mobile First & Offline Ready
          </div>
        </div>
      </footer>
    </div>
  )
}
