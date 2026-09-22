import React from 'react'
import { Sliders, Sparkles, Clock, HeartHandshake, ShieldCheck } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { SplitMode, EarlyLeaverConfig } from '@/lib/calculator'
import { MoneyInput } from '@/components/ui/money-input'
import { Stepper } from '@/components/ui/stepper'
import { formatVND } from '@/lib/formatters'

interface SplitModeSelectorProps {
  splitMode: SplitMode
  onSplitModeChange: (mode: SplitMode) => void
  femaleDiscount: number
  onFemaleDiscountChange: (val: number) => void
  fixedFemaleFee: number
  onFixedFemaleFeeChange: (val: number) => void
  earlyLeaverConfig: EarlyLeaverConfig
  onEarlyLeaverConfigChange: (cfg: EarlyLeaverConfig) => void
  totalParticipants: number
  totalShuttleCount: number
}

const DISCOUNT_PRESETS = [5000, 10000, 15000, 20000]
const FIXED_FEE_PRESETS = [20000, 30000, 40000, 50000]

export const SplitModeSelector: React.FC<SplitModeSelectorProps> = ({
  splitMode,
  onSplitModeChange,
  femaleDiscount,
  onFemaleDiscountChange,
  fixedFemaleFee,
  onFixedFemaleFeeChange,
  earlyLeaverConfig,
  onEarlyLeaverConfigChange,
  totalParticipants,
  totalShuttleCount,
}) => {
  const modes: { id: SplitMode; label: string; icon: React.ReactNode; desc: string }[] = [
    {
      id: 'even',
      label: 'Chia đều',
      icon: <ShieldCheck className="w-3.5 h-3.5" />,
      desc: 'Tất cả thành viên chia đều tổng chi phí',
    },
    {
      id: 'fixed_female_discount',
      label: 'Giảm giá Nữ',
      icon: <HeartHandshake className="w-3.5 h-3.5" />,
      desc: 'Nữ được giảm bớt một số tiền cố định',
    },
    {
      id: 'fixed_female',
      label: 'Nữ cố định',
      icon: <Sparkles className="w-3.5 h-3.5" />,
      desc: 'Nữ đóng số tiền cố định, Nam gánh phần còn lại',
    },
    {
      id: 'multi_stage',
      label: 'Về sớm (2 hiệp)',
      icon: <Clock className="w-3.5 h-3.5" />,
      desc: 'Người về sớm chỉ trả hiệp 1 (thời gian + cầu hiệp 1)',
    },
  ]

  return (
    <Card className="border-line bg-surface shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10 text-accent border border-accent/30">
            <Sliders className="h-4 w-4" />
          </div>
          <CardTitle className="text-base font-bold text-fg">Cách chia tiền</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Mode Selector Tabs / Grid */}
        <div className="grid grid-cols-2 gap-2">
          {modes.map((m) => {
            const isActive = splitMode === m.id
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => onSplitModeChange(m.id)}
                className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  isActive
                    ? 'border-accent bg-volt text-ink shadow-sm'
                    : 'border-line bg-raised/60 text-fg-muted hover:border-line-strong hover:bg-raised/60 hover:text-fg'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs">
                  <span className={isActive ? 'text-ink' : 'text-fg-muted'}>{m.icon}</span>
                  <span>{m.label}</span>
                </div>
                <p className={`text-[10px] mt-1 leading-tight ${isActive ? 'text-fg-subtle' : 'text-fg-muted'}`}>
                  {m.desc}
                </p>
              </button>
            )
          })}
        </div>

        {/* Dynamic Parameter Settings */}
        {splitMode === 'fixed_female_discount' && (
          <div className="space-y-2 rounded-xl bg-raised/90 p-3 border border-line animate-in fade-in-50 duration-200">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold text-fg">
                Mức giảm giá cho Nữ (VND)
              </label>
              <span className="font-mono text-xs text-danger font-bold tabular-nums">
                -{formatVND(femaleDiscount)}
              </span>
            </div>
            <MoneyInput
              value={femaleDiscount}
              onChangeValue={onFemaleDiscountChange}
              quickIncrements={DISCOUNT_PRESETS}
              placeholder="10.000"
            />
          </div>
        )}

        {splitMode === 'fixed_female' && (
          <div className="space-y-2 rounded-xl bg-raised/90 p-3 border border-line animate-in fade-in-50 duration-200">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold text-fg">
                Tiền cố định cho mỗi Nữ (VND)
              </label>
              <span className="font-mono text-xs text-danger font-bold tabular-nums">
                {formatVND(fixedFemaleFee)} / người
              </span>
            </div>
            <MoneyInput
              value={fixedFemaleFee}
              onChangeValue={onFixedFemaleFeeChange}
              quickIncrements={FIXED_FEE_PRESETS}
              placeholder="30.000"
            />
          </div>
        )}

        {splitMode === 'multi_stage' && (
          <div className="space-y-3.5 rounded-xl bg-raised/90 p-3.5 border border-line animate-in fade-in-50 duration-200">
            <div className="text-xs font-bold text-warn">Cấu hình 2 hiệp & Người về sớm</div>

            {/* Early Leaver Count */}
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-fg">Số người về sớm</div>
                <div className="text-[10px] text-fg-muted">Chỉ chơi hiệp 1</div>
              </div>
              <Stepper
                value={earlyLeaverConfig.count}
                onChangeValue={(cnt: number) =>
                  onEarlyLeaverConfigChange({ ...earlyLeaverConfig, count: cnt })
                }
                min={0}
                max={Math.max(0, totalParticipants - 1)}
                step={1}
                size="sm"
              />
            </div>

            {/* Stage 1 Duration Ratio */}
            <div className="space-y-1.5 pt-1 border-t border-line">
              <div className="flex justify-between text-xs">
                <span className="text-fg font-medium">Thời lượng hiệp 1</span>
                <span className="font-semibold text-accent">
                  {Math.round(earlyLeaverConfig.stage1Ratio * 100)}% thời gian sân
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { ratio: 0.33, label: '1/3 giờ' },
                  { ratio: 0.5, label: '1/2 giờ (50%)' },
                  { ratio: 0.67, label: '2/3 giờ' },
                ].map((item) => (
                  <button
                    key={item.ratio}
                    type="button"
                    onClick={() =>
                      onEarlyLeaverConfigChange({
                        ...earlyLeaverConfig,
                        stage1Ratio: item.ratio,
                      })
                    }
                    className={`py-1.5 text-[11px] font-semibold rounded-lg border transition-colors cursor-pointer ${
                      Math.abs(earlyLeaverConfig.stage1Ratio - item.ratio) < 0.05
                        ? 'border-accent bg-volt text-ink shadow-xs'
                        : 'border-line bg-surface text-fg-muted hover:border-line-strong hover:text-fg'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Stage 1 Shuttlecocks */}
            <div className="flex items-center justify-between pt-1 border-t border-line">
              <div>
                <div className="text-xs font-semibold text-fg">Số cầu hiệp 1 đã dùng</div>
                <div className="text-[10px] text-fg-muted">
                  Tổng buổi dùng {totalShuttleCount} quả
                </div>
              </div>
              <Stepper
                value={earlyLeaverConfig.stage1Shuttlecocks ?? Math.ceil(totalShuttleCount / 2)}
                onChangeValue={(cnt: number) =>
                  onEarlyLeaverConfigChange({
                    ...earlyLeaverConfig,
                    stage1Shuttlecocks: cnt,
                  })
                }
                min={0}
                max={totalShuttleCount}
                step={1}
                size="sm"
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
