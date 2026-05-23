import { cn } from '@/lib/utils'
import { forwardRef } from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helper?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helper, className, ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && (
          <label className="block text-[13px] font-medium text-ios-secondary">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={cn(
            'w-full px-4 py-3.5 rounded-xl border text-[15px] text-ios-primary',
            'bg-ios-fill border-transparent',
            'placeholder:text-ios-tertiary',
            'focus:outline-none focus:border-ios-primary focus:bg-white',
            'transition-colors duration-150',
            error && 'border-expense bg-red-50 focus:border-expense',
            className
          )}
          {...props}
        />
        {error && <p className="text-[12px] text-expense">{error}</p>}
        {helper && !error && <p className="text-[12px] text-ios-secondary">{helper}</p>}
      </div>
    )
  }
)
Input.displayName = 'Input'

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, className, children, ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && (
          <label className="block text-[13px] font-medium text-ios-secondary">
            {label}
          </label>
        )}
        <select
          ref={ref}
          className={cn(
            'w-full px-4 py-3.5 rounded-xl border text-[15px] text-ios-primary',
            'bg-ios-fill border-transparent appearance-none',
            'focus:outline-none focus:border-ios-primary focus:bg-white',
            'transition-colors duration-150',
            error && 'border-expense',
            className
          )}
          {...props}
        >
          {children}
        </select>
        {error && <p className="text-[12px] text-expense">{error}</p>}
      </div>
    )
  }
)
Select.displayName = 'Select'
