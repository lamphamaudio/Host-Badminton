import { cn } from '@/lib/utils'
import { formatVND } from '@/lib/formatters'

export interface FlipAmountProps {
  value: number
  muted?: boolean
  size?: 'md' | 'lg'
  className?: string
}

/** Amount rendered as umpire-scoreboard flip tiles, e.g. 36.000 -> [3][6].[0][0][0] đ. */
export function FlipAmount({ value, muted = false, size = 'md', className }: FlipAmountProps) {
  const text = formatVND(value, false)
  const tile =
    size === 'lg'
      ? 'h-11 w-7 text-2xl sm:h-12 sm:w-8 sm:text-[1.7rem]'
      : 'h-9 w-6 text-lg sm:h-11 sm:w-7 sm:text-2xl'

  return (
    <span className={cn('inline-flex items-center gap-[3px]', className)} aria-label={formatVND(value)}>
      {text.split('').map((char, index) =>
        /\d/.test(char) ? (
          <span
            key={index}
            aria-hidden="true"
            className={cn(
              'relative flex items-center justify-center rounded-md bg-raised font-mono font-extrabold tabular-nums shadow-[inset_0_-1px_0_rgba(255,255,255,0.06)] after:absolute after:inset-x-0 after:top-1/2 after:h-px after:bg-line',
              tile,
              muted ? 'text-fg/40' : 'text-fg'
            )}
          >
            {char}
          </span>
        ) : (
          <span key={index} aria-hidden="true" className="px-px font-mono text-lg text-fg-subtle">
            {char}
          </span>
        )
      )}
      <span aria-hidden="true" className="ml-1 font-mono text-xs font-bold text-fg-subtle">
        đ
      </span>
    </span>
  )
}
