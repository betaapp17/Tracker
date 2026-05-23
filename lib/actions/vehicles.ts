'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth'
import type { VehicleStatus, VehicleWithProfit } from '@/lib/types'

export interface UpdateVehicleInput {
  id: string
  make: string
  model: string
  year: number
  plate: string
  purchase_price: number
  purchase_date: string
  status: VehicleStatus
  notes: string
  receipt_url: string | null
}

export async function getVehicles(status?: VehicleStatus) {
  const supabase = await createClient()
  const user = await getCurrentUser()
  if (!user) return []

  let query = supabase
    .from('vehicles')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (status) query = query.eq('status', status)

  const { data } = await query
  return data ?? []
}

export async function getVehicleWithProfit(id: string): Promise<VehicleWithProfit | null> {
  const supabase = await createClient()
  const user = await getCurrentUser()
  if (!user) return null

  const { data: vehicle } = await supabase
    .from('vehicles')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!vehicle) return null

  const { data: txs } = await supabase
    .from('transactions')
    .select('*, category:transaction_categories(*)')
    .eq('vehicle_id', id)
    .eq('user_id', user.id)
    .order('date', { ascending: false })

  const transactions = txs ?? []

  const sale = transactions.find(t => t.type === 'sale')
  const sale_price = sale ? Number(sale.amount) : null

  const linked_expenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((s, t) => s + Number(t.amount), 0)

  const total_cost = Number(vehicle.purchase_price) + linked_expenses

  const profit = sale_price !== null ? sale_price - total_cost : null
  const profit_margin =
    sale_price && sale_price > 0 ? ((profit ?? 0) / sale_price) * 100 : null

  return {
    ...vehicle,
    sale_price,
    linked_expenses,
    total_cost,
    profit,
    profit_margin,
    transactions,
  }
}

export async function updateVehicleStatus(id: string, status: VehicleStatus) {
  const supabase = await createClient()
  const user = await getCurrentUser()
  if (!user) throw new Error('Unauthorized')

  await supabase
    .from('vehicles')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', user.id)

  revalidatePath('/', 'layout')
}

export async function updateVehicle(input: UpdateVehicleInput) {
  const supabase = await createClient()
  const user = await getCurrentUser()
  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase
    .from('vehicles')
    .update({
      make: input.make,
      model: input.model,
      year: input.year,
      plate: input.plate || null,
      purchase_price: input.purchase_price,
      purchase_date: input.purchase_date,
      status: input.status,
      notes: input.notes || null,
      receipt_url: input.receipt_url,
      updated_at: new Date().toISOString(),
    })
    .eq('id', input.id)
    .eq('user_id', user.id)

  if (error) throw new Error(error.message)

  await supabase
    .from('transactions')
    .update({
      amount: input.purchase_price,
      date: input.purchase_date,
      description: `Compra: ${input.year} ${input.make} ${input.model}`,
      notes: input.notes || null,
      receipt_url: input.receipt_url,
      updated_at: new Date().toISOString(),
    })
    .eq('vehicle_id', input.id)
    .eq('type', 'vehicle_purchase')
    .eq('user_id', user.id)

  revalidatePath('/', 'layout')
}

export async function deleteVehicle(id: string) {
  const supabase = await createClient()
  const user = await getCurrentUser()
  if (!user) throw new Error('Unauthorized')

  await supabase.from('vehicles').delete().eq('id', id).eq('user_id', user.id)
  revalidatePath('/', 'layout')
}
