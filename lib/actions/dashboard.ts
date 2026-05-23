'use server'

import { createClient } from '@/lib/supabase/server'
import type { DashboardStats } from '@/lib/types'

export async function getDashboardStats(month: string): Promise<DashboardStats> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const startDate = `${month}-01`
  const endDate = new Date(new Date(startDate).getFullYear(), new Date(startDate).getMonth() + 1, 0)
    .toISOString().slice(0, 10)

  // All transactions for the month
  const { data: txs } = await supabase
    .from('transactions')
    .select('*, category:transaction_categories(*)')
    .eq('user_id', user.id)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: false })

  const transactions = txs ?? []

  const gross_sales = transactions
    .filter(t => t.type === 'sale')
    .reduce((s, t) => s + Number(t.amount), 0)

  const total_expenses = transactions
    .filter(t => t.type === 'expense' || t.type === 'vehicle_purchase')
    .reduce((s, t) => s + Number(t.amount), 0)

  const net_profit = gross_sales - total_expenses

  const cars_sold = transactions.filter(t => t.type === 'sale').length

  const avg_profit_per_car = cars_sold > 0 ? net_profit / cars_sold : 0

  // Expenses by category
  const catMap = new Map<string, { name: string; amount: number; color: string; icon: string }>()
  for (const t of transactions) {
    if (t.type !== 'expense') continue
    const key = t.category?.name ?? 'Outros'
    const existing = catMap.get(key)
    if (existing) {
      existing.amount += Number(t.amount)
    } else {
      catMap.set(key, {
        name: key,
        amount: Number(t.amount),
        color: t.category?.color ?? '#8E8E93',
        icon: t.category?.icon ?? 'tag',
      })
    }
  }
  const expenses_by_category = Array.from(catMap.values())
    .sort((a, b) => b.amount - a.amount)

  // Monthly trend — last 6 months
  const monthly_trend = await getMonthlyTrend(supabase, user.id, month)

  return {
    net_profit,
    gross_sales,
    total_expenses,
    cars_sold,
    avg_profit_per_car,
    expenses_by_category,
    monthly_trend,
  }
}

async function getMonthlyTrend(
  supabase: Awaited<ReturnType<typeof createClient>>,
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
    const sales = list.filter(t => t.type === 'sale').reduce((s, t) => s + Number(t.amount), 0)
    const expenses = list
      .filter(t => t.type === 'expense' || t.type === 'vehicle_purchase')
      .reduce((s, t) => s + Number(t.amount), 0)

    months.push({ month: m, sales, expenses, profit: sales - expenses })
  }

  return months
}

export async function getRecentTransactions(limit = 10) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from('transactions')
    .select('*, category:transaction_categories(*), vehicle:vehicles(make, model, year)')
    .eq('user_id', user.id)
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(limit)

  return data ?? []
}
