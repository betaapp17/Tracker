import { Suspense } from 'react'
import { requireAuth } from '@/lib/auth'
import { getDashboardStats } from '@/lib/actions/dashboard'
import { getVehicles, getVehiclesWithProfitBatch } from '@/lib/actions/vehicles'
import { currentMonthISO, formatBRL, formatMonthYear } from '@/lib/formatters'
import { Card } from '@/components/ui/Card'
import { MonthlyTrend } from '@/components/home/MonthlyTrend'
import { SpendingByCategory } from '@/components/home/SpendingByCategory'
import { MonthFilter } from '@/components/ui/MonthFilter'
import { TrendingUp, TrendingDown, Car, DollarSign } from 'lucide-react'
import { cn } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export default async function RelatoriosPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>
}) {
  await requireAuth()
  const params = await searchParams
  const month = params.month ?? currentMonthISO()

  const [stats, vehicles] = await Promise.all([
    getDashboardStats(month),
    getVehicles('sold'),
  ])

  const vehiclesWithProfit = await getVehiclesWithProfitBatch(vehicles.slice(0, 10))

  const profitableVehicles = vehiclesWithProfit.filter(v => v.profit !== null && v.profit! > 0)
  const avgMargin = profitableVehicles.length > 0
    ? profitableVehicles.reduce((s, v) => s + (v.profit_margin ?? 0), 0) / profitableVehicles.length
    : 0

  return (
    <div className="px-4 pt-12 animate-page-enter">
      <div className="mb-5">
        <h1 className="text-[28px] font-bold text-ios-primary">Relatórios</h1>
        <p className="text-[14px] text-ios-secondary capitalize">{formatMonthYear(month)}</p>
      </div>

      {/* Month selector */}
      <div className="mb-5">
        <Suspense fallback={null}>
          <MonthFilter value={month} />
        </Suspense>
      </div>

      {/* Summary grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {[
          {
            label: 'Vendas Brutas',
            value: formatBRL(stats.gross_sales),
            icon: TrendingUp,
            color: 'text-profit',
            bg: 'bg-green-50',
          },
          {
            label: 'Despesas Operacionais',
            value: formatBRL(stats.operating_expenses),
            icon: TrendingDown,
            color: 'text-expense',
            bg: 'bg-red-50',
          },
          {
            label: 'Carros Vendidos',
            value: `${stats.cars_sold}`,
            icon: Car,
            color: 'text-ios-primary',
            bg: 'bg-gray-100',
          },
          {
            label: 'Margem Média',
            value: `${avgMargin.toFixed(1)}%`,
            icon: DollarSign,
            color: 'text-taquinho',
            bg: 'bg-yellow-50',
          },
        ].map(item => (
          <Card key={item.label} className="space-y-3">
            <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center', item.bg)}>
              <item.icon className={cn('w-5 h-5', item.color)} />
            </div>
            <div>
              <p className="text-[20px] font-bold tabular-nums text-ios-primary">{item.value}</p>
              <p className="text-[11px] text-ios-secondary">{item.label}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Net profit banner */}
      <div className={cn(
        'rounded-2xl p-4 mb-4 flex items-center justify-between',
        stats.gross_profit >= 0 ? 'bg-green-50' : 'bg-red-50'
      )}>
        <div>
          <p className="text-[12px] font-medium text-ios-secondary uppercase tracking-wider">Lucro do Mês</p>
          <p className={cn(
            'text-[28px] font-bold tabular-nums mt-1',
            stats.gross_profit >= 0 ? 'text-profit' : 'text-expense'
          )}>
            {stats.gross_profit >= 0 ? '+' : ''}{formatBRL(stats.gross_profit)}
          </p>
        </div>
        <div className={cn(
          'text-[28px]',
          stats.gross_profit >= 0 ? 'text-profit' : 'text-expense'
        )}>
          {stats.gross_profit >= 0 ? '🟢' : '🔴'}
        </div>
      </div>

      {/* Spending by category */}
      <div className="mb-4">
        <SpendingByCategory
          categories={stats.expenses_by_category}
          total={stats.operating_expenses}
        />
      </div>

      {/* Vehicle profit table */}
      {vehiclesWithProfit.length > 0 && (
        <Card padding="none" className="mb-4">
          <p className="text-[14px] font-semibold text-ios-primary px-4 pt-4 pb-2">
            Lucro por Veículo
          </p>
          <div className="divide-y divide-ios-border/50">
            {vehiclesWithProfit.map(v => (
              <div key={v.id} className="flex items-center gap-3 px-4 py-3">
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-ios-primary truncate">
                    {v.year} {v.make} {v.model}
                  </p>
                  <p className="text-[11px] text-ios-tertiary">
                    Custo: {formatBRL(v.total_cost)}
                  </p>
                </div>
                <div className="text-right">
                  {v.profit !== null ? (
                    <>
                      <p className={cn(
                        'text-[14px] font-semibold tabular-nums',
                        v.profit >= 0 ? 'text-profit' : 'text-expense'
                      )}>
                        {v.profit >= 0 ? '+' : ''}{formatBRL(v.profit)}
                      </p>
                      {v.profit_margin !== null && (
                        <p className="text-[11px] text-ios-tertiary">
                          {v.profit_margin.toFixed(1)}%
                        </p>
                      )}
                    </>
                  ) : (
                    <span className="text-[12px] text-ios-tertiary">Em estoque</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Trend chart */}
      <MonthlyTrend data={stats.monthly_trend} />
    </div>
  )
}
