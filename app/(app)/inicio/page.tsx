import { Suspense } from 'react'
import { parseDateRange } from '@/lib/dateRange'
import { currentMonthISO } from '@/lib/formatters'
import { getDashboardStats, getRecentTransactions } from '@/lib/actions/dashboard'
import { getVehicles, getVehiclesWithProfitBatch } from '@/lib/actions/vehicles'
import { HeroMetric } from '@/components/home/HeroMetric'
import { MetricsGrid } from '@/components/home/MetricsGrid'
import { ProfitBreakdownCard } from '@/components/home/ProfitBreakdownCard'
import { SpendingByCategory } from '@/components/home/SpendingByCategory'
import { RecentTransactions } from '@/components/home/RecentTransactions'
import { VehicleProfitCard } from '@/components/home/VehicleProfitCard'
import { MonthlyTrend } from '@/components/home/MonthlyTrend'
import { requireAuth } from '@/lib/auth'
import { Card } from '@/components/ui/Card'
import { AlertTriangle, Car } from 'lucide-react'

export const dynamic = 'force-dynamic'

type LoadFailure = {
  source: string
  message: string
}

async function DashboardContent() {
  const user = await requireAuth()
  const month = currentMonthISO()
  const { from, to } = parseDateRange({})

  const results = await Promise.allSettled([
    getDashboardStats(from, to),
    getRecentTransactions(5),
    getVehicles(),
  ])

  const failures: LoadFailure[] = []

  if (results[0].status === 'rejected') {
    failures.push({
      source: 'dashboard',
      message: results[0].reason instanceof Error ? results[0].reason.message : String(results[0].reason),
    })
  }
  if (results[1].status === 'rejected') {
    failures.push({
      source: 'transactions',
      message: results[1].reason instanceof Error ? results[1].reason.message : String(results[1].reason),
    })
  }
  if (results[2].status === 'rejected') {
    failures.push({
      source: 'vehicles',
      message: results[2].reason instanceof Error ? results[2].reason.message : String(results[2].reason),
    })
  }

  if (failures.length > 0) {
    console.error('Dashboard preview load failure', failures)

    return (
      <div className="px-4 pt-12 animate-page-enter">
        <Card className="space-y-3 border border-amber-200 bg-amber-50">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-700" />
            <h1 className="text-[17px] font-bold text-ios-primary">Falha ao carregar o painel</h1>
          </div>
          <p className="text-[13px] text-ios-secondary">
            O login funcionou, mas uma consulta do painel falhou neste ambiente de preview.
          </p>
          <div className="space-y-2">
            {failures.map(failure => (
              <div key={failure.source} className="rounded-xl bg-white/80 px-3 py-2">
                <p className="text-[12px] font-semibold text-ios-primary">{failure.source}</p>
                <p className="text-[11px] text-ios-secondary break-words">{failure.message}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    )
  }

  const stats = results[0].status === 'fulfilled' ? results[0].value : null
  const recentTxs = results[1].status === 'fulfilled' ? results[1].value : []
  const vehicles = results[2].status === 'fulfilled' ? results[2].value : []

  // Employee view: inventory summary + recent activity only
  if (!stats) {
    const inStock = vehicles.filter(v => v.status === 'in_stock')
    return (
      <div className="px-4 pt-12 space-y-4 animate-page-enter">
        <div className="mb-2">
          <h1 className="text-[26px] font-bold text-ios-primary">Olá, {user.name}</h1>
          <p className="text-[14px] text-ios-secondary">{month}</p>
        </div>

        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-ios-fill flex items-center justify-center flex-shrink-0">
            <Car className="w-6 h-6 text-ios-primary" />
          </div>
          <div>
            <p className="text-[22px] font-bold text-ios-primary">{inStock.length}</p>
            <p className="text-[13px] text-ios-secondary">
              {inStock.length === 1 ? 'carro em estoque' : 'carros em estoque'}
            </p>
          </div>
        </Card>

        <RecentTransactions transactions={recentTxs as never} />
      </div>
    )
  }

  let vehicleProfit = [] as Awaited<ReturnType<typeof getVehiclesWithProfitBatch>>
  try {
    vehicleProfit = await getVehiclesWithProfitBatch(vehicles.slice(0, 6))
  } catch (error) {
    console.error('Vehicle profit preview load failure', error)
  }

  const hasVehicleProfit = stats.consignment_profit !== 0 || stats.owned_profit !== 0

  return (
    <div className="px-4 pt-12 space-y-4 animate-page-enter">
      <HeroMetric value={stats.gross_profit} label="Lucro do Mês" month={month} />
      <MetricsGrid
        grossSales={stats.gross_sales}
        operatingExpenses={stats.operating_expenses}
        carsSold={stats.cars_sold}
        avgProfitPerCar={stats.avg_profit_per_car}
      />
      {hasVehicleProfit && (
        <ProfitBreakdownCard
          consignmentProfit={stats.consignment_profit}
          ownedProfit={stats.owned_profit}
        />
      )}
      <SpendingByCategory categories={stats.expenses_by_category} total={stats.operating_expenses} />
      <RecentTransactions transactions={recentTxs as never} />
      <VehicleProfitCard vehicles={vehicleProfit} />
      <MonthlyTrend data={stats.monthly_trend} />
    </div>
  )
}

export default function InicioPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardContent />
    </Suspense>
  )
}

function DashboardSkeleton() {
  return (
    <div className="px-4 pt-12 space-y-4 animate-pulse">
      <div className="h-36 rounded-3xl bg-gray-200" />
      <div className="grid grid-cols-2 gap-3">
        {[...Array(4)].map((_, i) => <div key={i} className="h-24 rounded-2xl bg-gray-200" />)}
      </div>
      <div className="h-32 rounded-2xl bg-gray-200" />
      <div className="h-48 rounded-2xl bg-gray-200" />
      <div className="h-64 rounded-2xl bg-gray-200" />
    </div>
  )
}
