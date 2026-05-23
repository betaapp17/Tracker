'use client'

import { Card } from '@/components/ui/Card'
import { monthLabel } from '@/lib/formatters'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts'

interface DataPoint {
  month: string
  sales: number
  expenses: number
  profit: number
}

interface Props {
  data: DataPoint[]
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number; name: string }[]; label?: string }) => {
  if (!active || !payload?.length) return null
  const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact', maximumFractionDigits: 0 }).format(v)

  return (
    <div className="bg-white rounded-xl shadow-card-lg p-3 text-[12px] min-w-[120px]">
      <p className="font-semibold text-ios-primary mb-2">{label}</p>
      {payload.map(p => (
        <div key={p.name} className="flex justify-between gap-4">
          <span className="text-ios-secondary">{p.name}</span>
          <span className="font-medium text-ios-primary">{fmt(p.value)}</span>
        </div>
      ))}
    </div>
  )
}

export function MonthlyTrend({ data }: Props) {
  const chartData = data.map(d => ({
    name: monthLabel(d.month),
    Vendas: d.sales,
    Gastos: d.expenses,
    Lucro: d.profit,
  }))

  return (
    <Card>
      <p className="text-[15px] font-semibold text-ios-primary mb-4">Tendência Mensal</p>
      <div className="h-44">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="gradSales" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#30D158" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#30D158" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradExpenses" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#FF453A" stopOpacity={0.12} />
                <stop offset="95%" stopColor="#FF453A" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E5EA" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#AEAEB2' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: '#AEAEB2' }} axisLine={false} tickLine={false} tickFormatter={v => `${Math.round(v / 1000)}k`} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="Vendas"  stroke="#30D158" strokeWidth={2} fill="url(#gradSales)" dot={false} />
            <Area type="monotone" dataKey="Gastos"  stroke="#FF453A" strokeWidth={2} fill="url(#gradExpenses)" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}
