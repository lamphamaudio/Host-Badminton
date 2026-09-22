import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors select-none',
  {
    variants: {
      variant: {
        default: 'border border-accent/30 bg-accent/10 text-accent',
        paid: 'border border-accent/30 bg-accent/10 text-accent font-semibold',
        pending: 'border border-warn/30 bg-warn/10 text-warn font-semibold',
        unpaid: 'border border-danger/30 bg-danger/10 text-danger font-semibold',
        member: 'border border-info/30 bg-info/10 text-info font-semibold',
        secondary: 'border border-line bg-raised text-fg',
        outline: 'border border-line bg-surface text-fg',
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
              ? 'bg-volt'
              : variant === 'pending'
                ? 'bg-warn'
                : variant === 'unpaid'
                  ? 'bg-danger'
                  : variant === 'member'
                    ? 'bg-info'
                    : 'bg-fg-subtle'
          )}
        />
      )}
      {children}
    </div>
  )
}

export { Badge, badgeVariants }
