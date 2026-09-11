import * as React from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatVND, parseVND } from '@/lib/formatters'

export interface MoneyInputProps {
  value: number
  onChangeValue: (value: number) => void
  label?: string
  placeholder?: string
  quickIncrements?: number[]
  className?: string
  disabled?: boolean
}

export function MoneyInput({
  value,
  onChangeValue,
  label,
  placeholder = '0',
  quickIncrements = [10_000, 50_000, 100_000, 200_000],
  className,
  disabled = false,
}: MoneyInputProps) {
  const displayValue = value > 0 ? formatVND(value, false) : ''

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value
    const parsed = parseVND(raw)
    onChangeValue(parsed)
  }

  const handleAddAmount = (increment: number) => {
    if (disabled) return
    const nextVal = (value || 0) + increment
    onChangeValue(nextVal)
  }

  const handleClear = () => {
    if (disabled) return
    onChangeValue(0)
  }

  return (
    <div className={cn('flex flex-col gap-2 w-full', className)}>
      {label && (
        <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center justify-between">
          <span>{label}</span>
          {value > 0 && (
            <span className="text-emerald-400 font-mono tabular-nums font-bold">
              {formatVND(value)}
            </span>
          )}
        </label>
      )}

      <div className="relative flex items-center">
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={displayValue}
          onChange={handleInputChange}
          placeholder={placeholder}
          disabled={disabled}
          className="flex h-12 min-h-[48px] w-full rounded-xl border border-[#1e293b] bg-[#111927] pl-4 pr-16 py-2 text-base font-mono tabular-nums font-bold text-slate-100 placeholder:text-slate-600 outline-none transition-all duration-150 focus:border-emerald-500/80 focus:ring-2 focus:ring-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-50"
        />
        <div className="absolute right-3 flex items-center gap-1.5">
          {value > 0 && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 text-slate-400 hover:text-slate-200 hover:bg-[#182338] rounded-full transition-colors"
              title="Xóa số tiền"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <span className="text-xs font-bold text-emerald-400 select-none">VNĐ</span>
        </div>
      </div>

      {/* Quick Increment Chips */}
      {quickIncrements.length > 0 && !disabled && (
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {quickIncrements.map((inc) => (
            <button
              key={inc}
              type="button"
              onClick={() => handleAddAmount(inc)}
              className="h-8 min-h-[32px] px-2.5 rounded-lg bg-[#182338] border border-[#1e293b] text-xs font-mono font-semibold text-slate-300 hover:text-emerald-400 hover:border-emerald-500/40 hover:bg-[#22314e] active:scale-95 transition-all select-none cursor-pointer shrink-0"
            >
              +{inc >= 1_000_000 ? `${inc / 1_000_000}M` : `${inc / 1_000}k`}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
