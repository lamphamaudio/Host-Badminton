import React, { useEffect, useRef, useState } from 'react'
import { ArrowRight, Check, ChevronDown, Copy, Minus, Plus, X } from 'lucide-react'
import { calculateSessionSplit } from '@/lib/calculator'
import { formatVND, parseVND } from '@/lib/formatters'
import { FlipAmount } from '@/components/brand/FlipAmount'
import { ShuttleMark } from '@/components/brand/ShuttleMark'
import { CourtCanvas } from './CourtCanvas'

interface LandingPageViewProps {
  onEnterApp: () => void
  onOpenLogin: () => void
  isAuthenticated?: boolean
  hostName?: string | null
}

type SectionId = 'bang-tinh' | 'tinh-nang' | 'hoi-dap'

const NAV_ITEMS: Array<[SectionId, string]> = [
  ['bang-tinh', 'Bảng tính'],
  ['tinh-nang', 'Tính năng'],
  ['hoi-dap', 'Hỏi đáp'],
]

const PANEL =
  'rounded-3xl border border-white/10 bg-[#0b0f13]/75 backdrop-blur-md shadow-[0_30px_80px_-40px_rgba(0,0,0,0.9)]'
const FIELD =
  'h-12 min-h-[48px] w-full rounded-xl border border-white/12 bg-white/[0.04] px-4 text-base font-mono tabular-nums font-bold text-[#e8ece9] placeholder:text-white/25 outline-none transition-colors focus:border-[#c8ff3d]/70 focus:bg-white/[0.07]'

function scrollToSection(id: SectionId) {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  document.getElementById(id)?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth' })
}

function MoneyField({
  label,
  value,
  onChange,
}: {
  label: string
  value: number
  onChange: (value: number) => void
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/50">
        {label}
      </span>
      <span className="relative flex items-center">
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={value > 0 ? formatVND(value, false) : ''}
          onChange={(e) => onChange(parseVND(e.target.value))}
          placeholder="0"
          className={`${FIELD} pr-16`}
        />
        {value > 0 && (
          <button
            type="button"
            onClick={() => onChange(0)}
            className="absolute right-9 flex h-8 w-8 items-center justify-center rounded-full text-white/40 hover:text-white/80 cursor-pointer"
            aria-label={`Xoá ${label.toLowerCase()}`}
          >
            <X className="h-4 w-4" />
          </button>
        )}
        <span className="pointer-events-none absolute right-3.5 text-xs font-bold text-white/40">
          đ
        </span>
      </span>
    </label>
  )
}

function PlayerStepper({
  label,
  value,
  min,
  onChange,
}: {
  label: string
  value: number
  min: number
  onChange: (value: number) => void
}) {
  const buttonClass =
    'flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05] text-[#e8ece9] transition active:scale-90 disabled:opacity-30 disabled:pointer-events-none cursor-pointer hover:bg-white/10'
  return (
    <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] p-2 pl-4">
      <span className="text-sm font-bold text-[#e8ece9]">{label}</span>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          className={buttonClass}
          aria-label={`Bớt 1 ${label}`}
        >
          <Minus className="h-4 w-4" />
        </button>
        <span className="w-9 text-center font-mono text-lg font-extrabold tabular-nums text-[#e8ece9]">
          {value}
        </span>
        <button
          type="button"
          onClick={() => onChange(value + 1)}
          className={buttonClass}
          aria-label={`Thêm 1 ${label}`}
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

const BEFORE_AFTER: Array<{ before: string; after: string }> = [
  {
    before: 'Cộng tiền sân, tiền cầu bằng máy tính điện thoại',
    after: 'Nhập vài con số, kết quả hiện ngay',
  },
  {
    before: 'Trừ phần các bạn nữ rồi chia lẻ từng đồng',
    after: 'Nữ cố định, Nam chia đều, làm tròn lên hàng nghìn',
  },
  {
    before: 'Nhắn số tài khoản cho từng người',
    after: 'Một mã VietQR điền sẵn số tiền và nội dung',
  },
  {
    before: 'Cố nhớ ai chưa chuyển khoản đến tuần sau',
    after: 'Sổ nợ tự trừ dần từ buổi cũ nhất',
  },
]

const RALLY_STOPS: Array<{ title: string; body: string }> = [
  {
    title: 'Chia tiền',
    body: 'Chia đều, nữ cố định hoặc giảm giá cho nữ. Mỗi người làm tròn lên 1.000 đ cho dễ chuyển khoản.',
  },
  {
    title: 'VietQR',
    body: 'Mã Napas247 cho 19 ngân hàng, điền sẵn số tiền và nội dung. Quét là xong, không gõ nhầm số.',
  },
  {
    title: 'Sổ nợ',
    body: 'Ai chưa trả được ghi theo từng buổi. Trả tới đâu, trừ từ buổi cũ nhất tới đó.',
  },
  {
    title: 'Mất sóng vẫn chạy',
    body: 'Sân trong hẻm yếu 4G? Buổi chơi được lưu trên máy và tự gửi lên khi có mạng lại.',
  },
]

const FAQS: Array<{ q: string; a: string }> = [
  {
    q: 'Người chơi có cần cài ứng dụng không?',
    a: 'Không. Người chơi chỉ cần quét mã VietQR bằng ứng dụng ngân hàng họ đang dùng; số tiền và nội dung đã điền sẵn.',
  },
  {
    q: 'Ở sân mất mạng thì sao?',
    a: 'Bảng tính vẫn chạy trên máy. Buổi chơi được lưu tạm và tự đồng bộ lên tài khoản khi điện thoại có mạng trở lại.',
  },
  {
    q: 'Đổi điện thoại có mất dữ liệu không?',
    a: 'Khi đăng nhập bằng số điện thoại hoặc Google, danh sách sân, lịch sử buổi chơi và sổ nợ được lưu trên tài khoản của bạn.',
  },
]

export const LandingPageView: React.FC<LandingPageViewProps> = ({
  onEnterApp,
  onOpenLogin,
  isAuthenticated = false,
  hostName,
}) => {
  const [courtFee, setCourtFee] = useState(170000)
  const [shuttleCount, setShuttleCount] = useState(4)
  const [shuttlePrice, setShuttlePrice] = useState(25000)
  const [maleCount, setMaleCount] = useState(5)
  const [femaleCount, setFemaleCount] = useState(3)
  const [fixedFemaleFee, setFixedFemaleFee] = useState(30000)
  const [copiedBill, setCopiedBill] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(0)
  const progressRef = useRef<HTMLDivElement>(null)

  // Females pay a fixed fee and males split the remainder; no fixed fee means an even split
  const split = calculateSessionSplit({
    courtFee,
    shuttlecockCount: shuttleCount,
    shuttlecockUnitPrice: shuttlePrice,
    maleCount,
    femaleCount,
    splitMode: fixedFemaleFee > 0 ? 'fixed_female' : 'even',
    fixedFemaleFee,
  })

  // Top progress bar is driven straight from scroll to avoid re-rendering on every frame
  useEffect(() => {
    const update = () => {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight
      const ratio = scrollable > 0 ? window.scrollY / scrollable : 0
      if (progressRef.current) progressRef.current.style.transform = `scaleX(${ratio})`
    }
    update()
    window.addEventListener('scroll', update, { passive: true })
    return () => window.removeEventListener('scroll', update)
  }, [])

  const handleCopyBill = () => {
    const lines = [
      '🏸 BILL CẦU LÔNG',
      `• Tiền sân: ${formatVND(courtFee)}`,
      `• Tiền cầu: ${shuttleCount} quả × ${formatVND(shuttlePrice)} = ${formatVND(split.shuttlecockFee)}`,
      `• Tổng: ${formatVND(split.totalExpenses)} (${maleCount} Nam, ${femaleCount} Nữ)`,
      maleCount > 0 ? `👉 Nam: ${formatVND(split.maleFee)}/người` : null,
      femaleCount > 0 ? `👉 Nữ: ${formatVND(split.femaleFee)}/người` : null,
    ]
    navigator.clipboard?.writeText?.(lines.filter(Boolean).join('\n'))
    setCopiedBill(true)
    setTimeout(() => setCopiedBill(false), 2000)
  }

  const scoreRows = [
    { label: 'Nam', count: maleCount, fee: split.maleFee },
    { label: 'Nữ', count: femaleCount, fee: split.femaleFee },
  ]

  return (
    <div data-theme="dark" className="relative min-h-screen bg-[#05070a] text-[#e8ece9] selection:bg-[#c8ff3d] selection:text-[#05070a]">
      <CourtCanvas />
      {/* Portrait screens frame the hero shuttle behind body copy, so dim the scene there */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 bg-[#05070a]/45 md:bg-transparent" />

      {/* Scroll progress */}
      <div className="fixed inset-x-0 top-0 z-50 h-[2px] bg-white/5">
        <div
          ref={progressRef}
          className="h-full origin-left scale-x-0 bg-[#c8ff3d]"
        />
      </div>

      {/* Top bar */}
      <header className="fixed inset-x-0 top-0 z-40 border-b border-white/5 bg-[#05070a]/70 pt-[env(safe-area-inset-top,0px)] backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6 md:py-4">
          <div className="flex items-center gap-2.5">
            <ShuttleMark className="h-8 w-8 text-[#e8ece9]" />
            <div className="leading-tight">
              <span className="block whitespace-nowrap text-sm font-extrabold tracking-tight">Host Badminton</span>
              <span className="flex items-center gap-1.5 whitespace-nowrap text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45">
                <span className="h-1.5 w-1.5 rounded-full bg-[#c8ff3d]" />
                Sân đang mở
              </span>
            </div>
          </div>

          <nav className="hidden items-center gap-1 md:flex" aria-label="Điều hướng trang">
            {NAV_ITEMS.map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => scrollToSection(id)}
                className="rounded-full px-4 py-2 text-sm font-medium text-white/60 transition-colors hover:bg-white/5 hover:text-white cursor-pointer"
              >
                {label}
              </button>
            ))}
          </nav>

          <button
            type="button"
            onClick={isAuthenticated ? onEnterApp : onOpenLogin}
            className="min-h-[44px] max-w-[45vw] truncate whitespace-nowrap rounded-full border border-white/15 bg-[#05070a]/60 px-4 text-sm font-semibold backdrop-blur transition-colors hover:border-white/35 cursor-pointer"
          >
            {isAuthenticated && hostName ? `Xin chào, ${hostName}` : 'Đăng nhập'}
          </button>
        </div>

        {/* Phones have no room beside the brand, so the section links get their own row */}
        <nav className="grid grid-cols-3 gap-1 px-4 pb-2 md:hidden" aria-label="Điều hướng trang">
          {NAV_ITEMS.map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => scrollToSection(id)}
              className="min-h-[44px] rounded-xl bg-white/[0.04] text-[13px] font-semibold text-white/70 transition-colors active:bg-white/10 hover:text-white cursor-pointer"
            >
              {label}
            </button>
          ))}
        </nav>
      </header>

      <main className="relative z-10 [&_h1]:[text-shadow:0_2px_28px_rgba(5,7,10,0.85)] [&_h2]:[text-shadow:0_2px_28px_rgba(5,7,10,0.85)]">
        {/* Hero */}
        <section className="relative flex min-h-[100svh] items-end px-4 pb-10 pt-40 sm:px-6 sm:pb-16 md:pt-28">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#05070a] via-[#05070a]/40 to-transparent" />
          <div className="relative mx-auto grid w-full max-w-6xl items-end gap-8 lg:grid-cols-[1.25fr_1fr]">
            <div className="motion-safe:animate-[fadeUp_0.9s_ease-out_both]">
              <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-[#c8ff3d]">
                Cho chủ sân & trưởng nhóm cầu lông phong trào
              </p>
              <h1 className="text-[clamp(2.6rem,7vw,5.2rem)] font-extrabold leading-[0.98] tracking-[-0.035em]">
                Hết giờ sân.
                <br />
                <span className="text-white/45">Bill đã sẵn sàng.</span>
              </h1>
              <p className="mt-6 max-w-xl text-base leading-relaxed text-white/65 sm:text-lg">
                Nhập tiền sân, tiền cầu và số người chơi. Host Badminton tính phần của Nam và Nữ,
                tạo mã VietQR gửi nhóm Zalo và ghi lại ai còn nợ.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={onEnterApp}
                  className="flex min-h-[52px] items-center gap-2 rounded-full bg-[#c8ff3d] px-6 text-base font-bold text-[#05070a] transition active:scale-95 hover:bg-[#d6ff6b] cursor-pointer"
                >
                  Vào sân ngay
                  <ArrowRight className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={() => scrollToSection('bang-tinh')}
                  className="min-h-[52px] rounded-full border border-white/20 px-6 text-base font-semibold text-[#e8ece9] transition hover:border-white/45 cursor-pointer"
                >
                  Thử chia một buổi
                </button>
              </div>
            </div>

            {/* Live scoreboard teaser, mirrors the calculator below */}
            <div className={`${PANEL} p-5 sm:p-6 motion-safe:animate-[fadeUp_0.9s_0.15s_ease-out_both]`}>
              <div className="flex items-center justify-between border-b border-white/10 pb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-white/45">
                <span>Bảng điểm · tối nay</span>
                <span className="font-mono">{maleCount + femaleCount} người</span>
              </div>
              <div className="divide-y divide-white/5">
                {scoreRows.map((row) => (
                  <div key={row.label} className="flex items-center justify-between gap-3 py-3.5">
                    <div>
                      <span className="block text-sm font-bold">{row.label}</span>
                      <span className="font-mono text-xs text-white/45">× {row.count}</span>
                    </div>
                    <FlipAmount value={row.count > 0 ? row.fee : 0} muted={row.count === 0} />
                  </div>
                ))}
              </div>
              <p className="border-t border-white/10 pt-3 font-mono text-[11px] text-white/45">
                Tổng {formatVND(split.totalExpenses)} · làm tròn lên 1.000 đ
              </p>
            </div>
          </div>
        </section>

        {/* Before / after */}
        <section className="px-4 py-20 sm:px-6 sm:py-28">
          <div className="mx-auto max-w-6xl">
            <h2 className="max-w-3xl text-[clamp(2rem,4.5vw,3.4rem)] font-extrabold leading-[1.05] tracking-[-0.03em]">
              Cuối buổi, người cầm sổ luôn là người mệt nhất.
            </h2>
            <div className={`${PANEL} mt-10 overflow-hidden`}>
              <div className="hidden grid-cols-2 border-b border-white/10 text-[11px] font-bold uppercase tracking-[0.18em] sm:grid">
                <span className="px-6 py-4 text-white/40">Trước đây</span>
                <span className="border-l border-white/10 px-6 py-4 text-[#c8ff3d]">
                  Với Host Badminton
                </span>
              </div>
              {BEFORE_AFTER.map((row) => (
                <div
                  key={row.before}
                  className="grid gap-2 border-b border-white/5 px-5 py-5 last:border-b-0 sm:grid-cols-2 sm:gap-0 sm:p-0"
                >
                  <p className="flex items-start gap-3 text-sm text-white/45 line-through decoration-white/20 sm:px-6 sm:py-5">
                    <X className="mt-0.5 h-4 w-4 shrink-0 text-white/30" />
                    {row.before}
                  </p>
                  <p className="flex items-start gap-3 text-sm font-semibold sm:border-l sm:border-white/10 sm:px-6 sm:py-5">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#c8ff3d]" />
                    {row.after}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Calculator */}
        <section id="bang-tinh" className="scroll-mt-36 md:scroll-mt-20 px-4 py-20 sm:px-6 sm:py-28">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-[clamp(2rem,4.5vw,3.4rem)] font-extrabold tracking-[-0.03em]">
              Thử chia một buổi.
            </h2>
            <p className="mt-3 max-w-xl text-white/55">
              Số liệu mẫu của một buổi 2 tiếng. Sửa ô nào, bảng điểm cập nhật ngay.
            </p>

            <div className={`${PANEL} mt-10 grid lg:grid-cols-[1.2fr_1fr]`}>
              <div className="space-y-5 p-5 sm:p-8">
                <MoneyField label="Tiền thuê sân" value={courtFee} onChange={setCourtFee} />

                <div className="grid grid-cols-[6.5rem_1fr] gap-3">
                  <label className="flex flex-col gap-1.5">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/50">
                      Số quả cầu
                    </span>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={shuttleCount > 0 ? String(shuttleCount) : ''}
                      onChange={(e) => setShuttleCount(Number(e.target.value.replace(/\D/g, '')))}
                      placeholder="0"
                      className={FIELD}
                    />
                  </label>
                  <MoneyField label="Giá mỗi quả" value={shuttlePrice} onChange={setShuttlePrice} />
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <PlayerStepper label="Nam" value={maleCount} min={0} onChange={setMaleCount} />
                  <PlayerStepper label="Nữ" value={femaleCount} min={0} onChange={setFemaleCount} />
                </div>

                <div>
                  <MoneyField
                    label="Tiền nữ cố định / người"
                    value={fixedFemaleFee}
                    onChange={setFixedFemaleFee}
                  />
                  <p className="mt-2 text-xs text-white/45">
                    {fixedFemaleFee > 0
                      ? 'Nam chia đều phần còn lại.'
                      : 'Để trống: cả nhóm chia đều.'}
                  </p>
                </div>
              </div>

              <div className="flex flex-col justify-between gap-6 border-t border-white/10 bg-black/25 p-5 sm:p-8 lg:border-l lg:border-t-0">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/45">
                    Mỗi người thanh toán
                  </span>
                  <div className="mt-4 space-y-5">
                    {scoreRows.map((row) => (
                      <div key={row.label}>
                        <div className="mb-2 flex items-baseline justify-between text-sm">
                          <span className="font-bold">{row.label}</span>
                          <span className="font-mono text-xs text-white/45">{row.count} người</span>
                        </div>
                        {row.count > 0 ? (
                          <FlipAmount value={row.fee} />
                        ) : (
                          <span className="font-mono text-sm text-white/30">Không có người chơi</span>
                        )}
                      </div>
                    ))}
                  </div>
                  <dl className="mt-6 space-y-1.5 border-t border-white/10 pt-4 font-mono text-xs">
                    <div className="flex justify-between">
                      <dt className="text-white/45">Tổng chi phí</dt>
                      <dd className="font-bold">{formatVND(split.totalExpenses)}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-white/45">Tổng thu về</dt>
                      <dd className="font-bold">{formatVND(split.totalCollected)}</dd>
                    </div>
                  </dl>
                </div>

                <div className="grid gap-2">
                  <button
                    type="button"
                    onClick={handleCopyBill}
                    className="flex min-h-[48px] items-center justify-center gap-2 rounded-xl border border-white/15 text-sm font-semibold transition hover:border-white/35 cursor-pointer"
                  >
                    {copiedBill ? (
                      <>
                        <Check className="h-4 w-4 text-[#c8ff3d]" /> Đã sao chép bill
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" /> Sao chép bill gửi Zalo
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={onEnterApp}
                    className="flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-[#c8ff3d] text-sm font-bold text-[#05070a] transition hover:bg-[#d6ff6b] cursor-pointer"
                  >
                    Mở bàn tính đầy đủ <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features along a shuttle trajectory */}
        <section id="tinh-nang" className="scroll-mt-36 md:scroll-mt-20 px-4 py-20 sm:px-6 sm:py-28">
          <div className="mx-auto max-w-6xl">
            <h2 className="max-w-3xl text-[clamp(2rem,4.5vw,3.4rem)] font-extrabold leading-[1.05] tracking-[-0.03em]">
              Một đường cầu, bốn việc xong xuôi.
            </h2>

            <div className="relative mt-14">
              <svg
                viewBox="0 0 1000 120"
                preserveAspectRatio="none"
                className="absolute inset-x-0 top-0 hidden h-28 w-full lg:block"
                aria-hidden="true"
              >
                <path
                  d="M 20 110 Q 500 -70 980 110"
                  fill="none"
                  stroke="#c8ff3d"
                  strokeOpacity="0.55"
                  strokeWidth="2"
                  strokeDasharray="2 10"
                  strokeLinecap="round"
                />
              </svg>
              <ol className="relative grid gap-4 border-l border-dashed border-white/15 pl-6 lg:grid-cols-4 lg:border-l-0 lg:pl-0 lg:pt-32">
                {RALLY_STOPS.map((stop, index) => (
                  <li key={stop.title} className={`${PANEL} relative p-6`}>
                    <span className="absolute -left-[31px] top-7 h-3 w-3 rounded-full bg-[#c8ff3d] ring-4 ring-[#05070a] lg:hidden" />
                    <span className="font-mono text-xs font-bold text-[#c8ff3d]">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <h3 className="mt-3 text-lg font-extrabold tracking-tight">{stop.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-white/55">{stop.body}</p>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="hoi-dap" className="scroll-mt-36 md:scroll-mt-20 px-4 py-20 sm:px-6 sm:py-28">
          <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1fr_1.4fr]">
            <h2 className="text-[clamp(2rem,4.5vw,3.4rem)] font-extrabold leading-[1.05] tracking-[-0.03em]">
              Hỏi nhanh, đáp gọn.
            </h2>
            <div className={`${PANEL} divide-y divide-white/10`}>
              {FAQS.map((faq, index) => {
                const isOpen = openFaq === index
                return (
                  <div key={faq.q}>
                    <button
                      type="button"
                      onClick={() => setOpenFaq(isOpen ? null : index)}
                      aria-expanded={isOpen}
                      className="flex min-h-[56px] w-full items-center justify-between gap-4 px-6 py-4 text-left font-semibold cursor-pointer"
                    >
                      {faq.q}
                      <ChevronDown
                        className={`h-5 w-5 shrink-0 text-white/45 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                      />
                    </button>
                    {isOpen && (
                      <p className="px-6 pb-5 text-sm leading-relaxed text-white/55">{faq.a}</p>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* Closing call to action */}
        <section className="px-4 pb-12 pt-20 sm:px-6 sm:pt-28">
          <div className={`${PANEL} mx-auto max-w-6xl p-8 text-center sm:p-14`}>
            <h2 className="text-[clamp(2.2rem,5.5vw,4rem)] font-extrabold leading-[1.02] tracking-[-0.035em]">
              Tối nay ai cầm sổ?
              <br />
              <span className="text-[#c8ff3d]">Để app lo.</span>
            </h2>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={onEnterApp}
                className="flex min-h-[52px] items-center gap-2 rounded-full bg-[#c8ff3d] px-6 text-base font-bold text-[#05070a] transition active:scale-95 hover:bg-[#d6ff6b] cursor-pointer"
              >
                Bắt đầu buổi chơi <ArrowRight className="h-5 w-5" />
              </button>
              {!isAuthenticated && (
                <button
                  type="button"
                  onClick={onOpenLogin}
                  className="min-h-[52px] rounded-full border border-white/20 px-6 text-base font-semibold transition hover:border-white/45 cursor-pointer"
                >
                  Đăng nhập chủ sân
                </button>
              )}
            </div>
          </div>

          <footer className="mx-auto mt-12 flex max-w-6xl flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-6 pb-[env(safe-area-inset-bottom,0px)] text-xs text-white/40">
            <span className="flex items-center gap-2">
              <ShuttleMark className="h-5 w-5 text-white/60" />
              © 2026 Host Badminton · Trợ lý tính tiền cho chủ sân cầu lông
            </span>
          </footer>
        </section>
      </main>
    </div>
  )
}
