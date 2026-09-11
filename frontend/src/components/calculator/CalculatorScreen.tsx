import React, { useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  CheckCircle2,
  CreditCard,
  QrCode,
  RotateCcw,
  Sparkles,
} from 'lucide-react'
import { BankSettingsModal } from './BankSettingsModal'
import { CourtFeeSection } from './CourtFeeSection'
import { PlayerCountSection } from './PlayerCountSection'
import { ShuttlecockSection } from './ShuttlecockSection'
import { SplitModeSelector } from './SplitModeSelector'
import { BillCardPreview, type BillSessionData } from '@/components/bill/bill-card-preview'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  calculateSessionSplit,
  type CalculatorInputs,
  type EarlyLeaverConfig,
  type SplitMode,
} from '@/lib/calculator'
import { formatVND } from '@/lib/formatters'
import {
  clearCalculatorState,
  DEFAULT_CALCULATOR_STATE,
  loadCalculatorState,
  saveCalculatorState,
  type SavedCalculatorState,
} from '@/lib/storage'
import { useToast } from '@/lib/toast'
import { findBankByBin, generateOfflineQRDataUrl, generateVietQRQuicklink } from '@/lib/vietqr'
import {
  createSession,
  type Member,
  type SessionCreatePayload,
  type SessionDetailResponse,
  type SessionParticipantItem,
  type Venue,
} from '@/lib/api'
import { useMembers } from '@/hooks/useMembers'
import { enqueueOfflineSession } from '@/lib/offlineQueue'

interface CalculatorScreenProps {
  initialReplaySession?: SessionDetailResponse | null
  onClearReplaySession?: () => void
  onSavedToHistory?: () => void
}

export const CalculatorScreen: React.FC<CalculatorScreenProps> = ({
  initialReplaySession,
  onClearReplaySession,
  onSavedToHistory,
}) => {
  const { info, success, error: toastError } = useToast()

  // Load initial state from localStorage
  const [state, setState] = useState<SavedCalculatorState>(() => loadCalculatorState())
  const { members } = useMembers(true)
  const [selectedMembers, setSelectedMembers] = useState<Member[]>([])
  const [selectedVenueId, setSelectedVenueId] = useState<string | null>(null)
  const [bankModalOpen, setBankModalOpen] = useState(false)
  const [billDrawerOpen, setBillDrawerOpen] = useState(false)
  const [offlineQrDataUrl, setOfflineQrDataUrl] = useState<string>('')
  const [isSaving, setIsSaving] = useState(false)
  const [isSaved, setIsSaved] = useState(false)

  const handleToggleMember = (member: Member) => {
    const isAlreadySelected = selectedMembers.some((m) => m.id === member.id)
    if (isAlreadySelected) {
      setSelectedMembers((prev) => prev.filter((m) => m.id !== member.id))
      if (member.gender === 'female') {
        updateInputs({ femaleCount: Math.max(0, inputs.femaleCount - 1) })
      } else {
        updateInputs({ maleCount: Math.max(0, inputs.maleCount - 1) })
      }
    } else {
      setSelectedMembers((prev) => [...prev, member])
      if (member.gender === 'female') {
        updateInputs({ femaleCount: inputs.femaleCount + 1 })
      } else {
        updateInputs({ maleCount: inputs.maleCount + 1 })
      }
    }
  }

  // Handle replaying a past session
  useEffect(() => {
    if (initialReplaySession) {
      const pMale = initialReplaySession.participants.filter((p) => p.gender === 'male').length
      const pFemale = initialReplaySession.participants.filter((p) => p.gender === 'female').length
      setSelectedVenueId(initialReplaySession.venue_id || null)

      setState((prev) => ({
        ...prev,
        venueName: initialReplaySession.venue_name || prev.venueName,
        sessionDate: initialReplaySession.session_date,
        inputs: {
          ...prev.inputs,
          courtFee: initialReplaySession.court_fee,
          shuttlecockCount: initialReplaySession.shuttlecock_count || prev.inputs.shuttlecockCount,
          shuttlecockUnitPrice:
            initialReplaySession.shuttlecock_unit_price || prev.inputs.shuttlecockUnitPrice,
          maleCount: pMale || prev.inputs.maleCount,
          femaleCount: pFemale || prev.inputs.femaleCount,
          splitMode: (initialReplaySession.gender_split_mode as SplitMode) || prev.inputs.splitMode,
          fixedFemaleFee: initialReplaySession.fixed_female_fee || prev.inputs.fixedFemaleFee,
        },
      }))

      setIsSaved(false)
      info('Đã tải thông số từ lịch sử', 'Các giá trị tính toán đã được nạp vào máy tính')
      onClearReplaySession?.()
    }
  }, [initialReplaySession, onClearReplaySession, info])

  // Auto persist to localStorage on every change
  useEffect(() => {
    saveCalculatorState(state)
    setIsSaved(false)
  }, [state])

  const { inputs, bankProfile, venueName, sessionDate } = state

  // Real-time calculation
  const result = useMemo(() => {
    return calculateSessionSplit(inputs)
  }, [inputs])

  // Selected Bank info
  const currentBank = findBankByBin(bankProfile.bankBin) || {
    bin: bankProfile.bankBin,
    shortName: 'Ngân hàng',
    name: 'Ngân hàng',
  }

  // Generate VietQR Quicklink & Offline QR Data URL
  const qrImageUrl = useMemo(() => {
    return generateVietQRQuicklink({
      bankBin: bankProfile.bankBin,
      accountNumber: bankProfile.accountNumber,
      accountName: bankProfile.accountName,
      amount: result.maleFee || result.femaleFee || result.totalExpenses,
      memo: bankProfile.memo,
      template: 'compact2',
    })
  }, [bankProfile, result])

  useEffect(() => {
    let isMounted = true
    generateOfflineQRDataUrl({
      bankBin: bankProfile.bankBin,
      accountNumber: bankProfile.accountNumber,
      accountName: bankProfile.accountName,
      amount: result.maleFee || result.femaleFee || result.totalExpenses,
      memo: bankProfile.memo,
    }).then((url) => {
      if (isMounted) {
        setOfflineQrDataUrl(url)
      }
    })
    return () => {
      isMounted = false
    }
  }, [bankProfile, result])

  // Handler helpers
  const updateInputs = (patch: Partial<CalculatorInputs>) => {
    setState((prev) => ({
      ...prev,
      inputs: {
        ...prev.inputs,
        ...patch,
      },
    }))
  }

  const handleReset = () => {
    clearCalculatorState()
    setState(DEFAULT_CALCULATOR_STATE)
    setSelectedVenueId(null)
    setSelectedMembers([])
    setIsSaved(false)
    info('Đã đặt lại thông số', 'Các giá trị tính toán đã quay về mặc định')
  }

  const handleSaveSessionToHistory = async () => {
    setIsSaving(true)
    try {
      // Build participants array linking selected members
      const participants: SessionParticipantItem[] = []
      const selectedMaleMembers = selectedMembers.filter((m) => m.gender === 'male')
      const selectedFemaleMembers = selectedMembers.filter((m) => m.gender === 'female')

      // Add selected male members
      selectedMaleMembers.forEach((m) => {
        participants.push({
          member_id: m.id,
          display_name: m.name,
          gender: 'male',
          play_stage: 'full',
          calculated_fee: result.maleFee,
          is_paid: false,
        })
      })

      // Add remaining anonymous male players
      const anonymousMaleCount = Math.max(0, inputs.maleCount - selectedMaleMembers.length)
      for (let i = 1; i <= anonymousMaleCount; i++) {
        participants.push({
          display_name: `Nam ${selectedMaleMembers.length + i}`,
          gender: 'male',
          play_stage: 'full',
          calculated_fee: result.maleFee,
          is_paid: false,
        })
      }

      // Add selected female members
      selectedFemaleMembers.forEach((m) => {
        participants.push({
          member_id: m.id,
          display_name: m.name,
          gender: 'female',
          play_stage: 'full',
          calculated_fee: result.femaleFee,
          is_paid: false,
        })
      })

      // Add remaining anonymous female players
      const anonymousFemaleCount = Math.max(0, inputs.femaleCount - selectedFemaleMembers.length)
      for (let i = 1; i <= anonymousFemaleCount; i++) {
        participants.push({
          display_name: `Nữ ${selectedFemaleMembers.length + i}`,
          gender: 'female',
          play_stage: 'full',
          calculated_fee: result.femaleFee,
          is_paid: false,
        })
      }

      // Today's date in YYYY-MM-DD
      const dateStr =
        typeof sessionDate === 'string'
          ? sessionDate.slice(0, 10)
          : new Date(sessionDate).toISOString().slice(0, 10)

      const payload: SessionCreatePayload = {
        venue_id: selectedVenueId,
        session_date: dateStr,
        status: 'completed',
        court_fee: inputs.courtFee,
        shuttlecock_fee: result.shuttlecockFee,
        shuttlecock_count: inputs.shuttlecockCount,
        shuttlecock_unit_price: inputs.shuttlecockUnitPrice,
        total_expenses: result.totalExpenses,
        gender_split_mode: inputs.splitMode,
        fixed_female_fee: inputs.fixedFemaleFee || null,
        fixed_male_fee: null,
        is_multi_stage: inputs.splitMode === 'multi_stage',
        stage1_cost: result.earlyFee || 0,
        stage2_cost: result.stayFee || 0,
        bank_bin: bankProfile.bankBin || null,
        bank_account_number: bankProfile.accountNumber || null,
        bank_account_name: bankProfile.accountName || null,
        vietqr_memo: bankProfile.memo || null,
        expenses: [],
        participants,
      }

      if (navigator.onLine) {
        try {
          await createSession(payload)
          setIsSaved(true)
          success('Đã lưu buổi chơi!', 'Buổi chơi đã được lưu vào lịch sử.')
          onSavedToHistory?.()
        } catch {
          // If network failed despite onLine flag
          enqueueOfflineSession(payload)
          setIsSaved(true)
          info(
            'Đã lưu ngoại tuyến',
            'Không kết nối được máy chủ. Buổi chơi đã được lưu và sẽ tự động đồng bộ khi có mạng.'
          )
        }
      } else {
        enqueueOfflineSession(payload)
        setIsSaved(true)
        info(
          'Đã lưu ngoại tuyến',
          'Bạn đang offline. Buổi chơi đã được lưu vào hàng đợi và sẽ đồng bộ khi có mạng.'
        )
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể lưu buổi chơi'
      toastError('Lỗi khi lưu buổi chơi', msg)
    } finally {
      setIsSaving(false)
    }
  }

  const billSessionData: BillSessionData = {
    venueName,
    sessionDate,
    splitMode: inputs.splitMode,
    maleCount: inputs.maleCount,
    femaleCount: inputs.femaleCount,
    maleFee: result.maleFee,
    femaleFee: result.femaleFee,
    earlyCount: result.earlyCount,
    stayCount: result.stayCount,
    earlyFee: result.earlyFee,
    stayFee: result.stayFee,
    courtFee: result.courtFee,
    shuttleFee: result.shuttlecockFee,
    shuttleCount: inputs.shuttlecockCount,
    totalAmount: result.totalExpenses,
    fundBuffer: result.fundBuffer,
    bankName: currentBank.shortName,
    accountNumber: bankProfile.accountNumber,
    accountName: bankProfile.accountName,
    transferContent: bankProfile.memo,
    qrImageUrl,
    offlineQrDataUrl,
  }

  return (
    <div className="flex flex-col gap-4 pb-24 max-w-lg mx-auto w-full px-4 pt-2">
      {/* Top Action Bar */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <span>Tính tiền sân & VietQR</span>
            <Badge variant="paid" size="sm">
              Slice 2
            </Badge>
          </h2>
          <p className="text-xs text-slate-400">
            Chia đều, giảm giá nữ, về sớm & tạo QR thanh toán
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setBankModalOpen(true)}
            className="h-8 px-2 text-xs text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/40"
          >
            <CreditCard className="w-3.5 h-3.5 mr-1" />
            <span>STK VietQR</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="h-8 px-2 text-xs text-slate-400 hover:text-slate-200"
            title="Đặt lại thông số"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Warning banner if bank account not configured */}
      {!bankProfile.accountNumber && (
        <div
          onClick={() => setBankModalOpen(true)}
          className="flex items-center justify-between p-3 rounded-2xl bg-amber-950/40 border border-amber-500/30 text-amber-200 text-xs cursor-pointer hover:bg-amber-950/60 transition-colors"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Chưa cài STK ngân hàng. Nhấn để tạo mã VietQR</span>
          </div>
          <span className="font-semibold text-amber-400 underline shrink-0">Cài đặt</span>
        </div>
      )}

      {/* 1. Court Fee Section with Venue Selector */}
      <CourtFeeSection
        courtFee={inputs.courtFee}
        onCourtFeeChange={(val) => updateInputs({ courtFee: val })}
        venueName={venueName}
        onVenueNameChange={(name) => setState((prev) => ({ ...prev, venueName: name }))}
        selectedVenueId={selectedVenueId}
        onVenueSelect={(venue: Venue | null) => {
          setSelectedVenueId(venue ? venue.id : null)
        }}
      />

      {/* 2. Shuttlecock Section */}
      <ShuttlecockSection
        shuttlecockCount={inputs.shuttlecockCount}
        onShuttlecockCountChange={(cnt) => updateInputs({ shuttlecockCount: cnt })}
        unitPrice={inputs.shuttlecockUnitPrice}
        onUnitPriceChange={(price) => updateInputs({ shuttlecockUnitPrice: price })}
      />

      {/* 3. Player Counts with Member Quick-Pick */}
      <PlayerCountSection
        maleCount={inputs.maleCount}
        onMaleCountChange={(val) => updateInputs({ maleCount: val })}
        femaleCount={inputs.femaleCount}
        onFemaleCountChange={(val) => updateInputs({ femaleCount: val })}
        availableMembers={members}
        selectedMemberIds={selectedMembers.map((m) => m.id)}
        onToggleMember={handleToggleMember}
      />

      {/* 4. Split Mode & Parameters */}
      <SplitModeSelector
        splitMode={inputs.splitMode}
        onSplitModeChange={(mode: SplitMode) => updateInputs({ splitMode: mode })}
        femaleDiscount={inputs.femaleDiscount || 10000}
        onFemaleDiscountChange={(val) => updateInputs({ femaleDiscount: val })}
        fixedFemaleFee={inputs.fixedFemaleFee || 30000}
        onFixedFemaleFeeChange={(val) => updateInputs({ fixedFemaleFee: val })}
        earlyLeaverConfig={inputs.earlyLeaverConfig || { count: 0, stage1Ratio: 0.5 }}
        onEarlyLeaverConfigChange={(cfg: EarlyLeaverConfig) =>
          updateInputs({ earlyLeaverConfig: cfg })
        }
        totalParticipants={result.totalParticipants}
        totalShuttleCount={inputs.shuttlecockCount}
      />

      {/* 5. Live Calculation Summary Card */}
      <div className="rounded-3xl bg-gradient-to-b from-slate-900 via-slate-900/95 to-slate-950 border-2 border-emerald-500/40 p-4 shadow-xl shadow-emerald-500/10 space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Kết quả tính tiền tức thì</span>
          </div>
          <Badge variant="outline" size="sm">
            {result.totalParticipants} người · Tổng {formatVND(result.totalExpenses)}
          </Badge>
        </div>

        {/* Split fees grid */}
        {inputs.splitMode === 'multi_stage' && result.earlyCount && result.earlyCount > 0 ? (
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-slate-950/80 rounded-2xl p-2.5 border border-slate-800 text-center">
              <div className="text-[10px] text-amber-400 font-semibold uppercase">
                Về sớm ({result.earlyCount} người)
              </div>
              <div className="text-base font-black font-mono text-amber-300">
                {formatVND(result.earlyFee || 0)}
              </div>
            </div>
            <div className="bg-slate-950/80 rounded-2xl p-2.5 border border-slate-800 text-center">
              <div className="text-[10px] text-slate-400 font-semibold uppercase">
                Chơi hết ({result.stayCount} người)
              </div>
              <div className="text-base font-black font-mono text-white">
                {formatVND(result.stayFee || 0)}
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-slate-950/80 rounded-2xl p-2.5 border border-slate-800 text-center">
              <div className="text-[10px] text-slate-400 font-semibold uppercase">
                Nam ({result.maleCount} người)
              </div>
              <div className="text-base font-black font-mono text-white">
                {formatVND(result.maleFee)}
              </div>
            </div>
            <div className="bg-slate-950/80 rounded-2xl p-2.5 border border-slate-800 text-center">
              <div className="text-[10px] text-slate-400 font-semibold uppercase">
                Nữ ({result.femaleCount} người)
              </div>
              <div className="text-base font-black font-mono text-lime-400">
                {formatVND(result.femaleFee)}
              </div>
            </div>
          </div>
        )}

        {/* Buffer & collected info */}
        <div className="flex justify-between items-center text-[11px] text-slate-400 px-1 pt-1">
          <span>Thu về: {formatVND(result.totalCollected)}</span>
          <span className="text-emerald-400 font-medium">
            {result.fundBuffer > 0
              ? `Dư quỹ: +${formatVND(result.fundBuffer)}`
              : 'Vừa khớp chi phí'}
          </span>
        </div>
      </div>

      {/* Sticky Bottom Bill Card Launcher */}
      <div className="fixed bottom-16 left-0 right-0 p-3 bg-gradient-to-t from-slate-950 via-slate-950/95 to-transparent z-40 max-w-lg mx-auto">
        <Button
          size="lg"
          onClick={() => setBillDrawerOpen(true)}
          className="w-full h-12 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2"
        >
          <QrCode className="w-5 h-5" />
          <span>Xem hóa đơn & Lưu lịch sử</span>
        </Button>
      </div>

      {/* Bill Card Drawer / Sheet */}
      <Sheet open={billDrawerOpen} onOpenChange={setBillDrawerOpen}>
        <SheetContent
          side="bottom"
          className="max-h-[92vh] overflow-y-auto bg-slate-950 border-t border-slate-800 p-4 rounded-t-3xl"
        >
          <SheetHeader className="pb-3 text-left">
            <SheetTitle className="text-base font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Hóa đơn VietQR hoàn chỉnh</span>
            </SheetTitle>
            <SheetDescription className="text-xs text-slate-400">
              Quét mã QR để chuyển khoản hoặc lưu buổi chơi vào lịch sử
            </SheetDescription>
          </SheetHeader>

          <BillCardPreview
            data={billSessionData}
            onEditBank={() => {
              setBillDrawerOpen(false)
              setBankModalOpen(true)
            }}
            onSaveSession={handleSaveSessionToHistory}
            isSaving={isSaving}
            isSaved={isSaved}
          />
        </SheetContent>
      </Sheet>

      {/* Bank Settings Modal */}
      <BankSettingsModal
        open={bankModalOpen}
        onOpenChange={setBankModalOpen}
        bankProfile={bankProfile}
        onSaveBankProfile={(prof) => {
          setState((prev) => ({ ...prev, bankProfile: prof }))
        }}
      />
    </div>
  )
}
