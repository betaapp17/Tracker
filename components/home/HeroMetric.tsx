import { formatBRL } from '@/lib/formatters'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  value: number
  label: string
  month: string
}

export function HeroMetric({ value, label, month }: Props) {
  const isPositive = value > 0
  const isNegative = value < 0
  const Icon = isPositive ? TrendingUp : isNegative ? TrendingDown : Minus

  const monthLabel = new Date(month + '-02').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

  return (
    <div className="bg-ios-primary rounded-3xl p-6 text-white relative overflow-hidden">
      {/* Decorative glow */}
      <div className="absolute -top-8 -right-8 w-40 h-40 bg-taquinho/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-12 -left-4 w-32 h-32 bg-white/5 rounded-full blur-2xl pointer-events-none" />

      <div className="relative">
        <div className="flex items-center justify-between mb-1">
          <p className="text-[12px] font-medium text-white/60 uppercase tracking-wider">{label}</p>
          <span className="text-[11px] text-white/50 capitalize">{monthLabel}</span>
        </div>

        <div className="flex items-end gap-3 mt-3">
          <div className={cn(
            'text-[42px] font-bold tabular-nums leading-none tracking-tight',
            isPositive ? 'text-taquinho' : isNegative ? 'text-expense/90' : 'text-white'
          )}>
            {formatBRL(value)}
          </div>
        </div>

        <div className="flex items-center gap-1.5 mt-3">
          <div className={cn(
            'w-6 h-6 rounded-full flex items-center justify-center',
            isPositive ? 'bg-profit/20' : isNegative ? 'bg-expense/20' : 'bg-white/10'
          )}>
            <Icon className={cn(
              'w-3.5 h-3.5',
              isPositive ? 'text-profit' : isNegative ? 'text-expense' : 'text-white/60'
            )} />
          </div>
          <span className="text-[12px] text-white/60">
            {isPositive ? 'Resultado positivo' : isNegative ? 'Resultado negativo' : 'Sem resultado'}
          </span>
        </div>
      </div>
    </div>
  )
}
