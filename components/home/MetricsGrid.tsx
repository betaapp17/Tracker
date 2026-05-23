import { formatBRL, formatBRLCompact } from '@/lib/formatters'
import { TrendingUp, TrendingDown, Car, DollarSign } from 'lucide-react'
import { Card } from '@/components/ui/Card'

interface Props {
  grossSales: number
  operatingExpenses: number
  carsSold: number
  avgProfitPerCar: number
}

export function MetricsGrid({ grossSales, operatingExpenses, carsSold, avgProfitPerCar }: Props) {
  const metrics = [
    {
      label: 'Vendas Brutas',
      value: formatBRLCompact(grossSales),
      full: formatBRL(grossSales),
      icon: TrendingUp,
      color: 'text-profit',
      bg: 'bg-green-50',
    },
    {
      label: 'Despesas Operacionais',
      value: formatBRLCompact(operatingExpenses),
      full: formatBRL(operatingExpenses),
      icon: TrendingDown,
      color: 'text-expense',
      bg: 'bg-red-50',
    },
    {
      label: 'Carros Vendidos',
      value: String(carsSold),
      full: `${carsSold} ${carsSold === 1 ? 'carro' : 'carros'}`,
      icon: Car,
      color: 'text-ios-primary',
      bg: 'bg-gray-100',
    },
    {
      label: 'Lucro Médio/Carro',
      value: formatBRLCompact(avgProfitPerCar),
      full: formatBRL(avgProfitPerCar),
      icon: DollarSign,
      color: avgProfitPerCar >= 0 ? 'text-profit' : 'text-expense',
      bg: avgProfitPerCar >= 0 ? 'bg-green-50' : 'bg-red-50',
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-3">
      {metrics.map(({ label, value, icon: Icon, color, bg }) => (
        <Card key={label} className="space-y-3">
          <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center`}>
            <Icon className={`w-4.5 h-4.5 ${color}`} />
          </div>
          <div>
            <p className="text-[22px] font-bold tabular-nums text-ios-primary leading-tight">{value}</p>
            <p className="text-[11px] text-ios-secondary mt-0.5">{label}</p>
          </div>
        </Card>
      ))}
    </div>
  )
}
