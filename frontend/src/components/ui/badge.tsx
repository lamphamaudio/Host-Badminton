import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors select-none',
  {
    variants: {
      variant: {
        default: 'border border-emerald-500/30 bg-emerald-950/60 text-emerald-400',
        paid: 'border border-emerald-500/40 bg-emerald-500/10 text-emerald-400 font-bold',
        pending: 'border border-amber-500/40 bg-amber-500/10 text-amber-400 font-bold',
        unpaid: 'border border-red-500/40 bg-red-500/10 text-red-400 font-bold',
        member: 'border border-sky-500/40 bg-sky-500/10 text-sky-400 font-bold',
        secondary: 'border border-[#334155] bg-[#182338] text-slate-300',
        outline: 'border border-[#334155] text-slate-300',
      },
      size: {
        default: 'h-6 text-xs px-2.5',
        sm: 'h-5 text-[10px] px-2',
        lg: 'h-7 text-sm px-3',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {
  dot?: boolean
}

function Badge({ className, variant, size, dot, children, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, size }), className)} {...props}>
      {dot && (
        <span
          className={cn(
            'w-1.5 h-1.5 rounded-full shrink-0',
            variant === 'paid' || variant === 'default'
              ? 'bg-emerald-400'
              : variant === 'pending'
                ? 'bg-amber-400'
                : variant === 'unpaid'
                  ? 'bg-red-400'
                  : variant === 'member'
                    ? 'bg-sky-400'
                    : 'bg-slate-400'
          )}
        />
      )}
      {children}
    </div>
  )
}

export { Badge, badgeVariants }
