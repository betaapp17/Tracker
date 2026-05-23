import { Suspense } from 'react'
import { currentMonthISO } from '@/lib/formatters'
import { getDashboardStats, getRecentTransactions } from '@/lib/actions/dashboard'
import { getVehicles, getVehicleWithProfit } from '@/lib/actions/vehicles'
import { HeroMetric } from '@/components/home/HeroMetric'
import { MetricsGrid } from '@/components/home/MetricsGrid'
import { SpendingByCategory } from '@/components/home/SpendingByCategory'
import { RecentTransactions } from '@/components/home/RecentTransactions'
import { VehicleProfitCard } from '@/components/home/VehicleProfitCard'
import { MonthlyTrend } from '@/components/home/MonthlyTrend'
import type { VehicleWithProfit } from '@/lib/types'

export const dynamic = 'force-dynamic'

async function DashboardContent() {
  const month = currentMonthISO()

  const [stats, recentTxs, vehicles] = await Promise.all([
    getDashboardStats(month),
    getRecentTransactions(5),
    getVehicles(),
  ])

  const vehicleProfit: VehicleWithProfit[] = await Promise.all(
    vehicles.slice(0, 6).map(v => getVehicleWithProfit(v.id))
  ).then(results => results.filter(Boolean) as VehicleWithProfit[])

  return (
    <div className="px-4 pt-12 space-y-4">
      <HeroMetric value={stats.net_profit} label="Lucro Líquido" month={month} />
      <MetricsGrid
        grossSales={stats.gross_sales}
        totalExpenses={stats.total_expenses}
        carsSold={stats.cars_sold}
        avgProfitPerCar={stats.avg_profit_per_car}
      />
      <SpendingByCategory categories={stats.expenses_by_category} total={stats.total_expenses} />
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
      <div className="h-48 rounded-2xl bg-gray-200" />
      <div className="h-64 rounded-2xl bg-gray-200" />
    </div>
  )
}
