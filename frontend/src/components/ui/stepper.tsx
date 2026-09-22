import { Minus, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface StepperProps {
  value: number
  onChangeValue: (value: number) => void
  min?: number
  max?: number
  step?: number
  label?: string
  unit?: string
  className?: string
  disabled?: boolean
  size?: 'default' | 'sm' | 'lg'
}

export function Stepper({
  value,
  onChangeValue,
  min = 0,
  max = 999,
  step = 1,
  label,
  unit,
  className,
  disabled = false,
  size = 'default',
}: StepperProps) {
  const handleDecrement = () => {
    if (disabled || value <= min) return
    onChangeValue(Math.max(min, value - step))
  }

  const handleIncrement = () => {
    if (disabled || value >= max) return
    onChangeValue(Math.min(max, value + step))
  }

  const isSmall = size === 'sm'
  const isLarge = size === 'lg'

  return (
    <div className={cn('flex items-center justify-between gap-3', className)}>
      {label && (
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-fg">{label}</span>
          {unit && <span className="text-xs text-fg-muted">{unit}</span>}
        </div>
      )}

      <div className="flex items-center gap-2 bg-raised border border-line rounded-2xl p-1">
        <button
          type="button"
          onClick={handleDecrement}
          disabled={disabled || value <= min}
          className={cn(
            'flex items-center justify-center rounded-xl bg-surface text-fg hover:text-fg hover:bg-raised border border-line shadow-sm active:scale-90 transition-all select-none disabled:opacity-40 disabled:pointer-events-none cursor-pointer',
            isSmall
              ? 'w-9 h-9 min-h-[36px]'
              : isLarge
                ? 'w-13 h-13 min-h-[52px]'
                : 'w-11 h-11 min-h-[44px]'
          )}
          aria-label="Giảm"
        >
          <Minus className={isSmall ? 'w-4 h-4' : 'w-5 h-5'} />
        </button>

        <div
          className={cn(
            'flex items-center justify-center font-mono tabular-nums font-extrabold text-fg select-none',
            isSmall
              ? 'min-w-[36px] text-base'
              : isLarge
                ? 'min-w-[60px] text-2xl'
                : 'min-w-[48px] text-lg'
          )}
        >
          {value}
        </div>

        <button
          type="button"
          onClick={handleIncrement}
          disabled={disabled || value >= max}
          className={cn(
            'flex items-center justify-center rounded-xl border border-accent/35 bg-accent/10 text-accent hover:bg-accent/20 active:scale-90 transition-all select-none disabled:opacity-40 disabled:pointer-events-none cursor-pointer',
            isSmall
              ? 'w-9 h-9 min-h-[36px]'
              : isLarge
                ? 'w-13 h-13 min-h-[52px]'
                : 'w-11 h-11 min-h-[44px]'
          )}
          aria-label="Tăng"
        >
          <Plus className={isSmall ? 'w-4 h-4' : 'w-5 h-5'} />
        </button>
      </div>
    </div>
  )
}
