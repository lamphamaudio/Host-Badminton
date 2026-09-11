import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-150 outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#090d16] disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] cursor-pointer select-none',
  {
    variants: {
      variant: {
        default:
          'bg-emerald-500 text-slate-950 hover:bg-emerald-400 shadow-lg shadow-emerald-500/20 font-bold',
        secondary: 'bg-[#182338] text-slate-100 hover:bg-[#22314e] border border-[#1e293b]',
        accent:
          'bg-lime-500 text-slate-950 hover:bg-lime-400 shadow-lg shadow-lime-500/20 font-bold',
        outline:
          'border border-[#334155] bg-transparent text-slate-200 hover:bg-[#182338] hover:text-white',
        ghost: 'text-slate-300 hover:bg-[#182338] hover:text-white',
        destructive: 'bg-red-600 text-white hover:bg-red-500 shadow-lg shadow-red-600/20',
      },
      size: {
        default: 'h-11 min-h-[44px] px-4 py-2 text-sm',
        sm: 'h-9 min-h-[36px] rounded-lg px-3 text-xs',
        lg: 'h-13 min-h-[50px] rounded-2xl px-6 text-base font-bold',
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
