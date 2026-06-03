import { formatBRL } from '@/lib/formatters'
import { Card } from '@/components/ui/Card'
import { cn } from '@/lib/utils'
import { CheckCircle2 } from 'lucide-react'
import type { DashboardStats } from '@/lib/types'

export function ReconciliationCard({ stats }: { stats: DashboardStats }) {
  const vehicleGrossProfit = stats.owned_profit + stats.consignment_profit

  // Cross-check: recompute gross_profit from waterfall and verify it matches
  const waterfallCheck = stats.gross_sales
    - stats.acquisition_cost
    - stats.vehicle_expenses_in_cogs
    + stats.total_commissions
    - stats.operating_expenses
  const isConsistent = Math.abs(waterfallCheck - stats.gross_profit) < 0.01

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-[14px] font-semibold text-ios-primary">Conferência do Período</p>
          <p className="text-[11px] text-ios-tertiary mt-0.5">Rastreamento completo do lucro</p>
        </div>
        <div className={cn(
          'flex items-center gap-1.5 px-2.5 py-1 rounded-full',
          isConsistent ? 'bg-green-50' : 'bg-red-50'
        )}>
          <CheckCircle2 className={cn('w-3.5 h-3.5', isConsistent ? 'text-profit' : 'text-expense')} />
          <span className={cn('text-[11px] font-medium', isConsistent ? 'text-profit' : 'text-expense')}>
            {isConsistent ? 'Conferido' : 'Divergência'}
          </span>
        </div>
      </div>

      <div className="space-y-0">
        <WaterfallRow label="Vendas Brutas" value={stats.gross_sales} sign="+" positive />
        <WaterfallRow label="Custo de Aquisição" value={stats.acquisition_cost} sign="−" indent />
        {stats.vehicle_expenses_in_cogs > 0 && (
          <WaterfallRow label="Despesas dos Veículos" value={stats.vehicle_expenses_in_cogs} sign="−" indent />
        )}
        {stats.total_commissions > 0 && (
          <WaterfallRow label="Comissões (consignados)" value={stats.total_commissions} sign="+" positive indent />
        )}

        <Divider />

        <WaterfallRow
          label="Lucro Bruto dos Veículos"
          value={vehicleGrossProfit}
          sign="="
          bold
          positive={vehicleGrossProfit >= 0}
        />

        {stats.operating_expenses > 0 && (
          <WaterfallRow label="Despesas Gerais" value={stats.operating_expenses} sign="−" indent />
        )}

        <Divider />

        <WaterfallRow
          label="Lucro Líquido do Período"
          value={stats.gross_profit}
          sign="="
          bold
          positive={stats.gross_profit >= 0}
          highlight
        />
      </div>
    </Card>
  )
}

function WaterfallRow({
  label,
  value,
  sign,
  positive = false,
  indent = false,
  bold = false,
  highlight = false,
}: {
  label: string
  value: number
  sign: string
  positive?: boolean
  indent?: boolean
  bold?: boolean
  highlight?: boolean
}) {
  const valueColor = highlight
    ? (positive ? 'text-profit' : 'text-expense')
    : positive
      ? 'text-profit'
      : 'text-ios-primary'

  return (
    <div className={cn(
      'flex items-center justify-between py-2',
      highlight && 'mt-1'
    )}>
      <div className="flex items-center gap-2 min-w-0">
        <span className={cn('text-[12px] font-mono w-4 text-center flex-shrink-0', positive ? 'text-profit' : 'text-expense')}>
          {sign}
        </span>
        <span className={cn(
          'text-[13px] truncate',
          indent ? 'text-ios-secondary' : 'text-ios-primary',
          bold && 'font-semibold'
        )}>
          {label}
        </span>
      </div>
      <span className={cn(
        'text-[13px] tabular-nums flex-shrink-0 ml-3',
        bold ? 'font-bold text-[14px]' : 'font-medium',
        valueColor
      )}>
        {formatBRL(value)}
      </span>
    </div>
  )
}

function Divider() {
  return <div className="border-t border-ios-border/60 my-1" />
}
