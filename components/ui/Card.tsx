import { cn } from '@/lib/utils'

interface CardProps {
  children: React.ReactNode
  className?: string
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

export function Card({ children, className, padding = 'md' }: CardProps) {
  const paddings = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-5',
  }
  return (
    <div className={cn(
      'bg-white rounded-2xl shadow-card',
      paddings[padding],
      className
    )}>
      {children}
    </div>
  )
}
