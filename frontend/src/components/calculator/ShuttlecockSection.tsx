import React from 'react'
import { CircleDot } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Stepper } from '@/components/ui/stepper'
import { MoneyInput } from '@/components/ui/money-input'
import { formatVND } from '@/lib/formatters'

interface ShuttlecockSectionProps {
  shuttlecockCount: number
  onShuttlecockCountChange: (count: number) => void
  unitPrice: number
  onUnitPriceChange: (price: number) => void
}

const UNIT_PRICE_PRESETS = [18000, 20000, 22000, 25000, 28000]

export const ShuttlecockSection: React.FC<ShuttlecockSectionProps> = ({
  shuttlecockCount,
  onShuttlecockCountChange,
  unitPrice,
  onUnitPriceChange,
}) => {
  const totalShuttleFee = shuttlecockCount * unitPrice

  return (
    <Card className="border-slate-800 bg-slate-900/90 shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-lime-500/10 text-lime-400">
              <CircleDot className="h-4 w-4" />
            </div>
            <CardTitle className="text-base font-bold text-white">Tiền cầu lông</CardTitle>
          </div>
          <span className="font-mono text-sm font-extrabold text-lime-400">
            {formatVND(totalShuttleFee)}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Shuttlecock Count */}
        <div className="flex items-center justify-between rounded-xl bg-slate-950/60 p-3 border border-slate-800">
          <div>
            <div className="text-xs font-semibold text-slate-200">Số lượng cầu đã dùng</div>
            <div className="text-[11px] text-slate-500">Đơn vị: Quả</div>
          </div>
          <Stepper
            value={shuttlecockCount}
            onChangeValue={onShuttlecockCountChange}
            min={0}
            max={50}
            step={1}
            size="default"
          />
        </div>

        {/* Unit Price */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-xs font-semibold text-slate-300">Đơn giá mỗi quả (VND)</label>
            <span className="font-mono text-xs text-slate-400">{formatVND(unitPrice)} / quả</span>
          </div>
          <MoneyInput
            value={unitPrice}
            onChangeValue={onUnitPriceChange}
            quickIncrements={UNIT_PRICE_PRESETS}
            placeholder="20.000"
          />
        </div>
      </CardContent>
    </Card>
  )
}
