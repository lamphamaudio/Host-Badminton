import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-150 outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] cursor-pointer select-none',
  {
    variants: {
      variant: {
        default:
          'bg-volt text-ink hover:bg-volt-hover shadow-sm font-bold',
        secondary: 'bg-raised text-fg hover:bg-line-strong border border-line',
        accent:
          'bg-volt text-ink hover:bg-volt-hover shadow-sm font-bold',
        outline:
          'border border-line-strong bg-surface text-fg hover:bg-raised shadow-sm',
        ghost: 'text-fg-muted hover:bg-raised hover:text-fg',
        destructive: 'bg-danger text-canvas hover:bg-danger/85 shadow-sm',
      },
      size: {
        default: 'h-11 min-h-[44px] px-4 py-2 text-sm',
        sm: 'h-9 min-h-[36px] rounded-lg px-3 text-xs',
        lg: 'h-12 min-h-[48px] rounded-xl px-6 text-base font-bold',
        icon: 'h-11 w-11 min-h-[44px] min-w-[44px] rounded-xl p-0',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
