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
          <div className="absolute left-3.5 flex items-center pointer-events-none text-fg-subtle">
            {leftIcon}
          </div>
        )}
        <input
          type={type}
          className={cn(
            'flex h-11 min-h-[44px] w-full rounded-xl border border-line bg-surface px-3.5 py-2 text-sm text-fg placeholder:text-fg-subtle outline-none transition-all duration-150 focus:border-accent focus:ring-2 focus:ring-accent/10 disabled:cursor-not-allowed disabled:opacity-50 shadow-sm',
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
