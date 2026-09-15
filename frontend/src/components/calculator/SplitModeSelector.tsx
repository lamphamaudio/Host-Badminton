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
    <Card className="border-slate-200/90 bg-white shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100">
            <Sliders className="h-4 w-4" />
          </div>
          <CardTitle className="text-base font-bold text-slate-900">Cách chia tiền</CardTitle>
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
                    ? 'border-slate-900 bg-slate-900 text-white shadow-sm'
                    : 'border-slate-200 bg-slate-50/60 text-slate-600 hover:border-slate-300 hover:bg-slate-100/60 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs">
                  <span className={isActive ? 'text-emerald-400' : 'text-slate-500'}>{m.icon}</span>
                  <span>{m.label}</span>
                </div>
                <p className={`text-[10px] mt-1 leading-tight ${isActive ? 'text-slate-300' : 'text-slate-500'}`}>
                  {m.desc}
                </p>
              </button>
            )
          })}
        </div>

        {/* Dynamic Parameter Settings */}
        {splitMode === 'fixed_female_discount' && (
          <div className="space-y-2 rounded-xl bg-slate-50/90 p-3 border border-slate-200/80 animate-in fade-in-50 duration-200">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold text-slate-700">
                Mức giảm giá cho Nữ (VND)
              </label>
              <span className="font-mono text-xs text-rose-700 font-bold tabular-nums">
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
          <div className="space-y-2 rounded-xl bg-slate-50/90 p-3 border border-slate-200/80 animate-in fade-in-50 duration-200">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold text-slate-700">
                Tiền cố định cho mỗi Nữ (VND)
              </label>
              <span className="font-mono text-xs text-rose-700 font-bold tabular-nums">
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
          <div className="space-y-3.5 rounded-xl bg-slate-50/90 p-3.5 border border-slate-200/80 animate-in fade-in-50 duration-200">
            <div className="text-xs font-bold text-amber-800">Cấu hình 2 hiệp & Người về sớm</div>

            {/* Early Leaver Count */}
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-slate-800">Số người về sớm</div>
                <div className="text-[10px] text-slate-500">Chỉ chơi hiệp 1</div>
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
            <div className="space-y-1.5 pt-1 border-t border-slate-200">
              <div className="flex justify-between text-xs">
                <span className="text-slate-700 font-medium">Thời lượng hiệp 1</span>
                <span className="font-semibold text-emerald-700">
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
                        ? 'border-slate-900 bg-slate-900 text-white shadow-xs'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Stage 1 Shuttlecocks */}
            <div className="flex items-center justify-between pt-1 border-t border-slate-200">
              <div>
                <div className="text-xs font-semibold text-slate-800">Số cầu hiệp 1 đã dùng</div>
                <div className="text-[10px] text-slate-500">
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
