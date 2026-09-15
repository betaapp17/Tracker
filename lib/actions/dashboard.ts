'use server'

import { createServiceClient } from '@/lib/supabase/service'
import { getCurrentUser } from '@/lib/auth'
import { can } from '@/lib/permissions'
import type { DashboardStats } from '@/lib/types'

export async function getDashboardStats(from: string, to: string): Promise<DashboardStats | null> {
  const supabase = createServiceClient()
  const user = await getCurrentUser()
  if (!user) throw new Error('Unauthorized')

  if (!can(user.role, 'view_financials', user.permissions)) return null

  const { data: expenseTxs } = await supabase
    .from('transactions')
    .select('*, category:transaction_categories(*)')
    .eq('user_id', user.id)
    .eq('type', 'expense')
    .eq('is_owner_prep', false)
    .gte('date', from)
    .lte('date', to)
    .order('date', { ascending: false })

  // Dealer-paid cash differences on a trade are stored as adjustment transactions.
  // They are real cash outflows and must reduce the result for the period.
  const { data: adjustmentTxs } = await supabase
    .from('transactions')
    .select('id, amount, description, vehicle_id, date')
    .eq('user_id', user.id)
    .eq('type', 'adjustment')
    .gte('date', from)
    .lte('date', to)

  const { data: saleTxs } = await supabase
    .from('transactions')
    .select('amount, vehicle_id, vehicle:vehicles(id, inventory_type, purchase_price, owner_payout_amount, commission_rate)')
    .eq('user_id', user.id)
    .eq('type', 'sale')
    .gte('date', from)
    .lte('date', to)

  const expenses = expenseTxs ?? []
  const adjustments = adjustmentTxs ?? []
  const sales = saleTxs ?? []

  const gross_sales = sales.reduce((s, t) => s + Number(t.amount), 0)

  const generalOperatingExpenses = expenses
    .filter(t => !t.vehicle_id)
    .reduce((s, t) => s + Number(t.amount), 0)

  const dealerPaidTradeDifferences = adjustments.reduce((s, t) => s + Number(t.amount), 0)
  const operating_expenses = generalOperatingExpenses + dealerPaidTradeDifferences
  const cars_sold = sales.length

  const soldVehicleIds = sales.map(t => t.vehicle_id).filter(Boolean) as string[]
  const vehicleExpenseMap = new Map<string, number>()

  if (soldVehicleIds.length > 0) {
    const { data: linkedExps } = await supabase
      .from('transactions')
      .select('vehicle_id, amount')
      .eq('user_id', user.id)
      .eq('type', 'expense')
      .eq('is_owner_prep', false)
      .in('vehicle_id', soldVehicleIds)

    for (const exp of linkedExps ?? []) {
      if (!exp.vehicle_id) continue
      vehicleExpenseMap.set(exp.vehicle_id, (vehicleExpenseMap.get(exp.vehicle_id) ?? 0) + Number(exp.amount))
    }
  }

  let consignment_profit = 0
  let owned_profit = 0
  let acquisition_cost = 0
  let vehicle_expenses_in_cogs = 0
  let total_commissions = 0

  for (const sale of sales) {
    const vehicle = Array.isArray(sale.vehicle) ? sale.vehicle[0] : sale.vehicle
    if (!vehicle) continue

    const saleAmount = Number(sale.amount)
    const linkedExp = sale.vehicle_id ? (vehicleExpenseMap.get(sale.vehicle_id) ?? 0) : 0
    vehicle_expenses_in_cogs += linkedExp

    if (vehicle.inventory_type === 'consigned') {
      const payout = Number(vehicle.owner_payout_amount ?? 0)
      const commission = payout * Number((vehicle as { commission_rate?: number }).commission_rate ?? 0)
      acquisition_cost += payout
      total_commissions += commission
      consignment_profit += saleAmount - payout - linkedExp + commission
    } else {
      acquisition_cost += Number(vehicle.purchase_price)
      owned_profit += saleAmount - Number(vehicle.purchase_price) - linkedExp
    }
  }

  // Vehicle profit is calculated from the full negotiated sale value. The incoming
  // trade-in becomes a separate inventory asset at its negotiated acquisition basis.
  // Any cash paid by the dealership on top of that trade is a separate period outflow.
  const gross_profit = (owned_profit + consignment_profit) - operating_expenses
  const avg_profit_per_car = cars_sold > 0
    ? ((owned_profit + consignment_profit) - dealerPaidTradeDifferences) / cars_sold
    : 0

  const catMap = new Map<string, { name: string; category_id: string | null; amount: number; color: string; icon: string }>()

  for (const t of expenses.filter(t => !t.vehicle_id)) {
    const key = t.category?.name ?? 'Outros'
    const existing = catMap.get(key)
    if (existing) {
      existing.amount += Number(t.amount)
    } else {
      catMap.set(key, {
        name: key,
        category_id: t.category?.id ?? null,
        amount: Number(t.amount),
        color: t.category?.color ?? '#8E8E93',
        icon: t.category?.icon ?? 'tag',
      })
    }
  }

  if (dealerPaidTradeDifferences > 0) {
    catMap.set('Diferença paga em troca', {
      name: 'Diferença paga em troca',
      category_id: null,
      amount: dealerPaidTradeDifferences,
      color: '#FF453A',
      icon: 'repeat-2',
    })
  }

  const currentMonth = new Date().toISOString().slice(0, 7)
  const monthly_trend = await getMonthlyTrend(supabase, user.id, currentMonth)

  return {
    gross_sales,
    operating_expenses,
    cars_sold,
    gross_profit,
    consignment_profit,
    owned_profit,
    avg_profit_per_car,
    expenses_by_category: Array.from(catMap.values()).sort((a, b) => b.amount - a.amount),
    monthly_trend,
    acquisition_cost,
    vehicle_expenses_in_cogs,
    total_commissions,
  }
}

async function getMonthlyTrend(
  supabase: ReturnType<typeof createServiceClient>,
  userId: string,
  currentMonth: string
) {
  const months: Array<{ month: string; sales: number; expenses: number; profit: number }> = []
  const current = new Date(currentMonth + '-01T00:00:00')

  for (let i = 5; i >= 0; i--) {
    const d = new Date(current.getFullYear(), current.getMonth() - i, 1)
    const m = d.toISOString().slice(0, 7)
    const start = `${m}-01`
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().slice(0, 10)

    const { data: txs } = await supabase
      .from('transactions')
      .select('type, amount')
      .eq('user_id', userId)
      .gte('date', start)
      .lte('date', end)

    const list = txs ?? []
    const sales = list
      .filter(t => t.type === 'sale')
      .reduce((s, t) => s + Number(t.amount), 0)

    // Do not include vehicle_purchase here: incoming trade-ins are inventory assets,
    // not period expenses. Adjustment transactions are dealer-paid trade differences.
    const expenses = list
      .filter(t => t.type === 'expense' || t.type === 'adjustment')
      .reduce((s, t) => s + Number(t.amount), 0)

    months.push({ month: m, sales, expenses, profit: sales - expenses })
  }

  return months
}

export async function getRecentTransactions(limit = 10) {
  const supabase = createServiceClient()
  const user = await getCurrentUser()
  if (!user) return []

  const { data } = await supabase
    .from('transactions')
    .select('*, category:transaction_categories(*), vehicle:vehicles(make, model, year)')
    .eq('user_id', user.id)
    .neq('type', 'vehicle_purchase')
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(limit)

  return data ?? []
}
