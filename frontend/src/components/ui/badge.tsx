import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors select-none',
  {
    variants: {
      variant: {
        default: 'border border-emerald-200 bg-emerald-50 text-emerald-800',
        paid: 'border border-emerald-200 bg-emerald-50 text-emerald-800 font-semibold',
        pending: 'border border-amber-200 bg-amber-50 text-amber-800 font-semibold',
        unpaid: 'border border-red-200 bg-red-50 text-red-800 font-semibold',
        member: 'border border-sky-200 bg-sky-50 text-sky-800 font-semibold',
        secondary: 'border border-slate-200 bg-slate-100 text-slate-700',
        outline: 'border border-slate-200 bg-white text-slate-700',
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
              ? 'bg-emerald-600'
              : variant === 'pending'
                ? 'bg-amber-600'
                : variant === 'unpaid'
                  ? 'bg-red-600'
                  : variant === 'member'
                    ? 'bg-sky-600'
                    : 'bg-slate-500'
          )}
        />
      )}
      {children}
    </div>
  )
}

export { Badge, badgeVariants }
