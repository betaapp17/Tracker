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

  const [{ data: expenseTxs }, { data: adjustmentTxs }, { data: saleTxs }] = await Promise.all([
    supabase.from('transactions')
      .select('*, category:transaction_categories(*)')
      .eq('user_id', user.id).eq('type', 'expense').eq('is_owner_prep', false)
      .gte('date', from).lte('date', to).order('date', { ascending: false }),
    supabase.from('transactions')
      .select('id, amount, description, vehicle_id, date')
      .eq('user_id', user.id).eq('type', 'adjustment').gte('date', from).lte('date', to),
    supabase.from('transactions')
      .select('amount, vehicle_id, vehicle:vehicles(id, inventory_type, purchase_price, owner_payout_amount, commission_rate)')
      .eq('user_id', user.id).eq('type', 'sale').gte('date', from).lte('date', to),
  ])

  const expenses = expenseTxs ?? []
  const adjustments = adjustmentTxs ?? []
  const sales = saleTxs ?? []
  const gross_sales = sales.reduce((s, t) => s + Number(t.amount), 0)
  const generalOperatingExpenses = expenses.filter(t => !t.vehicle_id).reduce((s, t) => s + Number(t.amount), 0)
  const dealer_paid_trade_differences = adjustments.reduce((s, t) => s + Number(t.amount), 0)
  const operating_expenses = generalOperatingExpenses + dealer_paid_trade_differences
  const cars_sold = sales.length

  const soldVehicleIds = sales.map(t => t.vehicle_id).filter(Boolean) as string[]
  const vehicleExpenseMap = new Map<string, number>()
  if (soldVehicleIds.length > 0) {
    const { data: linkedExps } = await supabase.from('transactions')
      .select('vehicle_id, amount').eq('user_id', user.id).eq('type', 'expense').eq('is_owner_prep', false).in('vehicle_id', soldVehicleIds)
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

  const gross_profit = (owned_profit + consignment_profit) - operating_expenses
  const avg_profit_per_car = cars_sold > 0 ? gross_profit / cars_sold : 0

  const catMap = new Map<string, { name: string; category_id: string | null; amount: number; color: string; icon: string }>()
  for (const t of expenses.filter(t => !t.vehicle_id)) {
    const key = t.category?.name ?? 'Outros'
    const existing = catMap.get(key)
    if (existing) existing.amount += Number(t.amount)
    else catMap.set(key, {
      name: key,
      category_id: t.category?.id ?? null,
      amount: Number(t.amount),
      color: t.category?.color ?? '#8E8E93',
      icon: t.category?.icon ?? 'tag',
    })
  }

  if (dealer_paid_trade_differences > 0) {
    catMap.set('Diferença paga em troca', {
      name: 'Diferença paga em troca', category_id: null, amount: dealer_paid_trade_differences,
      color: '#FF453A', icon: 'repeat-2',
    })
  }

  const currentMonth = new Date().toISOString().slice(0, 7)
  const monthly_trend = await getMonthlyTrend(supabase, user.id, currentMonth)

  return {
    gross_sales,
    operating_expenses,
    dealer_paid_trade_differences,
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

async function getMonthlyTrend(supabase: ReturnType<typeof createServiceClient>, userId: string, currentMonth: string) {
  const months: Array<{ month: string; sales: number; expenses: number; profit: number }> = []
  const current = new Date(currentMonth + '-01T00:00:00')

  for (let i = 5; i >= 0; i--) {
    const d = new Date(current.getFullYear(), current.getMonth() - i, 1)
    const m = d.toISOString().slice(0, 7)
    const start = `${m}-01`
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().slice(0, 10)

    const { data: monthSales } = await supabase.from('transactions')
      .select('amount, vehicle_id, vehicle:vehicles(inventory_type, purchase_price, owner_payout_amount, commission_rate)')
      .eq('user_id', userId).eq('type', 'sale').gte('date', start).lte('date', end)

    const { data: monthExpenses } = await supabase.from('transactions')
      .select('type, amount, vehicle_id, is_owner_prep').eq('user_id', userId).in('type', ['expense', 'adjustment']).gte('date', start).lte('date', end)

    const sales = (monthSales ?? []).reduce((s, t) => s + Number(t.amount), 0)
    const generalExpenses = (monthExpenses ?? []).filter(t => t.type === 'expense' && !t.vehicle_id && !t.is_owner_prep).reduce((s, t) => s + Number(t.amount), 0)
    const adjustments = (monthExpenses ?? []).filter(t => t.type === 'adjustment').reduce((s, t) => s + Number(t.amount), 0)

    const vehicleIds = (monthSales ?? []).map(t => t.vehicle_id).filter(Boolean) as string[]
    const vehicleExpenseMap = new Map<string, number>()
    if (vehicleIds.length) {
      const { data: linked } = await supabase.from('transactions')
        .select('vehicle_id, amount').eq('user_id', userId).eq('type', 'expense').eq('is_owner_prep', false).in('vehicle_id', vehicleIds)
      for (const exp of linked ?? []) if (exp.vehicle_id) vehicleExpenseMap.set(exp.vehicle_id, (vehicleExpenseMap.get(exp.vehicle_id) ?? 0) + Number(exp.amount))
    }

    let vehicleProfit = 0
    for (const sale of monthSales ?? []) {
      const vehicle = Array.isArray(sale.vehicle) ? sale.vehicle[0] : sale.vehicle
      if (!vehicle) continue
      const linked = sale.vehicle_id ? (vehicleExpenseMap.get(sale.vehicle_id) ?? 0) : 0
      if (vehicle.inventory_type === 'consigned') {
        const payout = Number(vehicle.owner_payout_amount ?? 0)
        const commission = payout * Number(vehicle.commission_rate ?? 0)
        vehicleProfit += Number(sale.amount) - payout - linked + commission
      } else {
        vehicleProfit += Number(sale.amount) - Number(vehicle.purchase_price) - linked
      }
    }

    const expenses = generalExpenses + adjustments
    const profit = vehicleProfit - expenses
    months.push({ month: m, sales, expenses, profit })
  }

  return months
}

export async function getRecentTransactions(limit = 10) {
  const supabase = createServiceClient()
  const user = await getCurrentUser()
  if (!user) return []
  const { data } = await supabase.from('transactions')
    .select('*, category:transaction_categories(*), vehicle:vehicles(make, model, year)')
    .eq('user_id', user.id).neq('type', 'vehicle_purchase')
    .order('date', { ascending: false }).order('created_at', { ascending: false }).limit(limit)
  return data ?? []
}
