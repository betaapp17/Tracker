import { cn } from '@/lib/utils'
import { forwardRef } from 'react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, children, className, disabled, ...props }, ref) => {
    const base = 'inline-flex items-center justify-center font-semibold rounded-xl pressable transition-all'
    const variants = {
      primary: 'bg-ios-primary text-white',
      secondary: 'bg-ios-fill text-ios-primary',
      ghost: 'text-ios-primary hover:bg-ios-fill',
      danger: 'bg-expense text-white',
    }
    const sizes = {
      sm: 'px-3 py-2 text-[13px] gap-1.5',
      md: 'px-4 py-3 text-[15px] gap-2 w-full',
      lg: 'px-5 py-4 text-[17px] gap-2 w-full',
    }

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(base, variants[variant], sizes[size], (disabled || loading) && 'opacity-50', className)}
        {...props}
      >
        {loading && (
          <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
        )}
        {children}
      </button>
    )
  }
)
Button.displayName = 'Button'
