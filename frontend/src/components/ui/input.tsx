import * as React from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  leftIcon?: React.ReactNode
  rightElement?: React.ReactNode
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, leftIcon, rightElement, ...props }, ref) => {
    return (
      <div className="relative flex items-center w-full">
        {leftIcon && (
          <div className="absolute left-3.5 flex items-center pointer-events-none text-slate-400">
            {leftIcon}
          </div>
        )}
        <input
          type={type}
          className={cn(
            'flex h-11 min-h-[44px] w-full rounded-xl border border-[#1e293b] bg-[#111927] px-3.5 py-2 text-sm text-slate-100 placeholder:text-slate-500 outline-none transition-all duration-150 focus:border-emerald-500/80 focus:ring-2 focus:ring-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-50',
            leftIcon && 'pl-10',
            rightElement && 'pr-12',
            className
          )}
          ref={ref}
          {...props}
        />
        {rightElement && <div className="absolute right-2.5 flex items-center">{rightElement}</div>}
      </div>
    )
  }
)
Input.displayName = 'Input'

export { Input }
