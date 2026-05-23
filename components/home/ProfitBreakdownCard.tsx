import { formatBRL } from '@/lib/formatters'
import { Card } from '@/components/ui/Card'
import { cn } from '@/lib/utils'
import { Handshake, Key } from 'lucide-react'

interface Props {
  consignmentProfit: number
  ownedProfit: number
}

export function ProfitBreakdownCard({ consignmentProfit, ownedProfit }: Props) {
  return (
    <Card>
      <p className="text-[14px] font-semibold text-ios-primary">Lucro por Tipo de Veículo</p>
      <p className="text-[11px] text-ios-tertiary mb-4">Lucro realizado nos carros vendidos este mês</p>
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-amber-50 rounded-2xl p-4">
          <div className="w-8 h-8 bg-amber-100 rounded-xl flex items-center justify-center mb-3">
            <Handshake className="w-4 h-4 text-amber-600" />
          </div>
          <p className={cn(
            'text-[18px] font-bold tabular-nums leading-tight',
            consignmentProfit >= 0 ? 'text-profit' : 'text-expense'
          )}>
            {consignmentProfit >= 0 ? '+' : ''}{formatBRL(consignmentProfit)}
          </p>
          <p className="text-[11px] text-ios-secondary mt-1">Consignados</p>
        </div>

        <div className="bg-blue-50 rounded-2xl p-4">
          <div className="w-8 h-8 bg-blue-100 rounded-xl flex items-center justify-center mb-3">
            <Key className="w-4 h-4 text-blue-600" />
          </div>
          <p className={cn(
            'text-[18px] font-bold tabular-nums leading-tight',
            ownedProfit >= 0 ? 'text-profit' : 'text-expense'
          )}>
            {ownedProfit >= 0 ? '+' : ''}{formatBRL(ownedProfit)}
          </p>
          <p className="text-[11px] text-ios-secondary mt-1">Próprios</p>
        </div>
      </div>
    </Card>
  )
}
