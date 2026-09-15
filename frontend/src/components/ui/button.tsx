import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-150 outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] cursor-pointer select-none',
  {
    variants: {
      variant: {
        default:
          'bg-slate-900 text-white hover:bg-slate-800 shadow-sm font-bold',
        secondary: 'bg-slate-100 text-slate-800 hover:bg-slate-200 border border-slate-200/80',
        accent:
          'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm font-bold',
        outline:
          'border border-slate-300 bg-white text-slate-800 hover:bg-slate-50 shadow-sm',
        ghost: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
        destructive: 'bg-red-600 text-white hover:bg-red-700 shadow-sm',
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
