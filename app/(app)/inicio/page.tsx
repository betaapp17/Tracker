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
import { Car } from 'lucide-react'
import type { VehicleWithProfit } from '@/lib/types'

export const dynamic = 'force-dynamic'

async function DashboardContent() {
  const user = await requireAuth()
  const month = currentMonthISO()
  const { from, to } = parseDateRange({})

  const [stats, recentTxs, vehicles] = await Promise.all([
    getDashboardStats(from, to),
    getRecentTransactions(5),
    getVehicles(),
  ])

  // Employee view: inventory summary + recent activity only
  if (!stats) {
    const inStock = vehicles.filter(v => v.status === 'in_stock')
    return (
      <div className="px-4 pt-12 space-y-4 animate-page-enter">
        <div className="mb-2">
          <h1 className="text-[26px] font-bold text-ios-primary">Olá, {user.name}</h1>
          <p className="text-[14px] text-ios-secondary">{month}</p>
        </div>

        {/* Inventory summary */}
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

  // Owner view: full dashboard
  const vehicleProfit = await getVehiclesWithProfitBatch(vehicles.slice(0, 6))
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
