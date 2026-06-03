import { Suspense } from 'react'
import { requireAuth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getDashboardStats } from '@/lib/actions/dashboard'
import { getIntegrityChecks } from '@/lib/actions/integrity'
import { getVehicles, getVehiclesWithProfitBatch } from '@/lib/actions/vehicles'
import { getTransactions } from '@/lib/actions/transactions'
import { formatBRL } from '@/lib/formatters'
import { parseDateRange } from '@/lib/dateRange'
import { Card } from '@/components/ui/Card'
import { MonthlyTrend } from '@/components/home/MonthlyTrend'
import { SpendingByCategory } from '@/components/home/SpendingByCategory'
import { ReconciliationCard } from '@/components/home/ReconciliationCard'
import { IntegrityCard } from '@/components/home/IntegrityCard'
import { DateRangeFilter } from '@/components/ui/DateRangeFilter'
import { TransactionItem } from '@/components/transactions/TransactionItem'
import { TrendingUp, TrendingDown, Car, DollarSign, ChevronLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export default async function RelatoriosPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string; from?: string; to?: string; cat_id?: string; cat_name?: string }>
}) {
  const user = await requireAuth()
  if (user.role !== 'owner') redirect('/inicio')
  const params = await searchParams
  const dateRange = parseDateRange(params)

  const catId = params.cat_id
  const catName = params.cat_name

  const [stats, vehicles, integrityIssues] = await Promise.all([
    getDashboardStats(dateRange.from, dateRange.to),
    getVehicles('sold'),
    getIntegrityChecks(),
  ])
  if (!stats) redirect('/inicio')

  // Fetch category transactions when drilling into a category
  let categoryTransactions: Awaited<ReturnType<typeof getTransactions>>['data'] = []
  if (catId) {
    const resolvedCategoryId = catId === '__none__' ? null : catId
    const { data } = await getTransactions({
      type: 'expense',
      from: dateRange.from,
      to: dateRange.to,
      category_id: resolvedCategoryId,
      limit: 200,
    })
    categoryTransactions = data
  }

  const vehiclesWithProfit = await getVehiclesWithProfitBatch(vehicles.slice(0, 10))

  // Period gross margin: vehicle profits as a % of gross sales, respects date filter
  const periodVehicleProfit = stats.owned_profit + stats.consignment_profit
  const avgMargin = stats.gross_sales > 0 ? (periodVehicleProfit / stats.gross_sales) * 100 : 0

  return (
    <div className="px-4 pt-12 pb-8 animate-page-enter">
      <div className="mb-5">
        <h1 className="text-[28px] font-bold text-ios-primary">Relatórios</h1>
        <p className="text-[14px] text-ios-secondary capitalize">{dateRange.label}</p>
      </div>

      <div className="mb-5">
        <Suspense fallback={null}>
          <DateRangeFilter preset={dateRange.preset} from={dateRange.from} to={dateRange.to} />
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
            label: 'Despesas Gerais',
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
            label: 'Margem Bruta',
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

      {/* Profit banner */}
      <div className={cn(
        'rounded-2xl p-4 mb-4 flex items-center justify-between',
        stats.gross_profit >= 0 ? 'bg-green-50' : 'bg-red-50'
      )}>
        <div>
          <p className="text-[12px] font-medium text-ios-secondary uppercase tracking-wider">Lucro do Período</p>
          <p className={cn(
            'text-[28px] font-bold tabular-nums mt-1',
            stats.gross_profit >= 0 ? 'text-profit' : 'text-expense'
          )}>
            {stats.gross_profit >= 0 ? '+' : ''}{formatBRL(stats.gross_profit)}
          </p>
        </div>
        <div className="text-[28px]">
          {stats.gross_profit >= 0 ? '🟢' : '🔴'}
        </div>
      </div>

      {/* Reconciliation waterfall */}
      <div className="mb-4">
        <ReconciliationCard stats={stats} />
      </div>

      {/* Spending by category */}
      <div className="mb-4">
        <Suspense fallback={null}>
          <SpendingByCategory
            categories={stats.expenses_by_category}
            total={stats.operating_expenses}
            drillDown
          />
        </Suspense>
      </div>

      {/* Category drilldown */}
      {catId && catName && (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-3">
            <Link
              href={`/relatorios?range=${dateRange.preset}${dateRange.preset === 'custom' ? `&from=${dateRange.from}&to=${dateRange.to}` : ''}`}
              className="flex items-center gap-1 text-[13px] text-ios-secondary pressable"
            >
              <ChevronLeft className="w-4 h-4" />
              Categorias
            </Link>
            <span className="text-ios-tertiary text-[13px]">/</span>
            <span className="text-[13px] font-semibold text-ios-primary">{catName}</span>
          </div>

          {categoryTransactions.length === 0 ? (
            <Card>
              <p className="text-[13px] text-ios-secondary text-center py-4">
                Nenhuma despesa nesta categoria no período.
              </p>
            </Card>
          ) : (
            <Card padding="none">
              <p className="text-[13px] font-semibold text-ios-primary px-4 pt-4 pb-2">
                {catName} · {categoryTransactions.length} lançamento{categoryTransactions.length !== 1 ? 's' : ''}
              </p>
              <div className="px-4 pb-2 divide-y divide-ios-border/50">
                {categoryTransactions.map(tx => (
                  <TransactionItem key={tx.id} tx={tx as never} showCategory={false} />
                ))}
              </div>
            </Card>
          )}
        </div>
      )}

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

      {/* Monthly trend — always shows last 6 months for context */}
      <div className="mb-4">
        <MonthlyTrend data={stats.monthly_trend} />
      </div>

      {/* Data integrity checks */}
      <IntegrityCard issues={integrityIssues} />
    </div>
  )
}
