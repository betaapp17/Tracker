import { formatBRL, formatDate } from '@/lib/formatters'
import type { Transaction } from '@/lib/types'
import { TrendingDown, DollarSign, Car, SlidersHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'

const typeConfig = {
  expense:          { label: 'Despesa',  sign: '-', color: 'text-expense',  bgColor: 'bg-red-50',    Icon: TrendingDown },
  sale:             { label: 'Venda',    sign: '+', color: 'text-profit',   bgColor: 'bg-green-50',  Icon: DollarSign },
  vehicle_purchase: { label: 'Compra',   sign: '-', color: 'text-ios-secondary', bgColor: 'bg-gray-100', Icon: Car },
  adjustment:       { label: 'Ajuste',   sign: '±', color: 'text-warning',  bgColor: 'bg-orange-50', Icon: SlidersHorizontal },
}

interface Props {
  tx: Transaction
  showCategory?: boolean
}

export function TransactionItem({ tx, showCategory = true }: Props) {
  const config = typeConfig[tx.type] ?? typeConfig.expense
  const { label, sign, color, bgColor, Icon } = config

  const displayName = tx.description
    || (tx.vehicle ? `${tx.vehicle.year} ${(tx.vehicle as {make:string}).make} ${(tx.vehicle as {model:string}).model}` : null)
    || tx.category?.name
    || label

  return (
    <div className="flex items-center gap-3 py-3">
      {/* Icon */}
      <div className={cn('w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0', bgColor)}>
        <Icon className={cn('w-4 h-4', color)} />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-medium text-ios-primary truncate">{displayName}</p>
        <div className="flex items-center gap-1.5 mt-0.5">
          {showCategory && tx.category && (
            <span className="text-[11px] text-ios-tertiary">{tx.category.name} · </span>
          )}
          <span className="text-[11px] text-ios-tertiary">{formatDate(tx.date)}</span>
        </div>
      </div>

      {/* Amount */}
      <div className="flex-shrink-0">
        <span className={cn('text-[15px] font-semibold tabular-nums', color)}>
          {sign}{formatBRL(Number(tx.amount))}
        </span>
      </div>
    </div>
  )
}
