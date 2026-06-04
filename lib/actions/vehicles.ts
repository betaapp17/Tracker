'use server'

import { revalidatePath } from 'next/cache'
import { createServiceClient } from '@/lib/supabase/service'
import { getCurrentUser } from '@/lib/auth'
import { can } from '@/lib/permissions'
import { deleteReceiptByPublicUrl } from '@/lib/receipts'
import type { InventoryType, VehicleStatus, VehicleWithProfit, InventoryStats } from '@/lib/types'

export interface UpdateVehicleInput {
  id: string
  make: string
  model: string
  year: number
  plate: string
  inventory_type: InventoryType
  purchase_price: number
  owner_payout_amount: number | null
  commission_rate: number | null
  estimated_sale_price: number | null
  purchase_date: string
  status: VehicleStatus
  notes: string
  receipt_url: string | null
}

export async function getVehicles(status?: VehicleStatus) {
  const supabase = createServiceClient()
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
  const supabase = createServiceClient()
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

  const expenseTxs = transactions.filter(t => t.type === 'expense')
  const linked_expenses = expenseTxs.reduce((s, t) => s + Number(t.amount), 0)
  const owner_prep_expenses = expenseTxs
    .filter(t => t.is_owner_prep)
    .reduce((s, t) => s + Number(t.amount), 0)
  // Only dealer's own costs reduce profit; owner prep is reimbursed by the car owner
  const dealer_expenses = linked_expenses - owner_prep_expenses

  const isConsigned = vehicle.inventory_type === 'consigned'
  const costBasis = isConsigned
    ? Number(vehicle.owner_payout_amount ?? 0)
    : Number(vehicle.purchase_price)
  const commission = isConsigned
    ? Number(vehicle.owner_payout_amount ?? 0) * Number(vehicle.commission_rate ?? 0)
    : 0

  const total_cost = costBasis + dealer_expenses
  const profit = sale_price !== null ? sale_price - total_cost + commission : null
  const profit_margin =
    sale_price && sale_price > 0 ? ((profit ?? 0) / sale_price) * 100 : null

  return {
    ...vehicle,
    inventory_type: vehicle.inventory_type ?? 'owned',
    sale_price,
    linked_expenses,
    owner_prep_expenses,
    commission,
    total_cost,
    profit,
    profit_margin,
    transactions,
  }
}

export async function getInventoryStats(): Promise<InventoryStats> {
  const supabase = createServiceClient()
  const user = await getCurrentUser()

  const empty: InventoryStats = {
    cars_in_stock: 0, owned_count: 0, consigned_count: 0,
    total_invested: 0, owned_value: 0, consigned_value: 0,
    total_market_value: 0, potential_profit: 0, missing_estimate_count: 0,
  }
  if (!user) return empty

  const { data: vehicles } = await supabase
    .from('vehicles')
    .select('*')
    .eq('user_id', user.id)
    .eq('status', 'in_stock')

  if (!vehicles || vehicles.length === 0) return empty

  const vehicleIds = vehicles.map(v => v.id)

  const { data: expenses } = await supabase
    .from('transactions')
    .select('vehicle_id, amount')
    .eq('user_id', user.id)
    .eq('type', 'expense')
    .in('vehicle_id', vehicleIds)

  const expenseMap = new Map<string, number>()
  for (const exp of expenses ?? []) {
    if (!exp.vehicle_id) continue
    expenseMap.set(exp.vehicle_id, (expenseMap.get(exp.vehicle_id) ?? 0) + Number(exp.amount))
  }

  const owned = vehicles.filter(v => (v.inventory_type ?? 'owned') === 'owned')
  const consigned = vehicles.filter(v => v.inventory_type === 'consigned')

  let owned_value = 0
  let total_market_value = 0
  let potential_profit = 0
  let missing_estimate_count = 0

  for (const v of owned) {
    const linked = expenseMap.get(v.id) ?? 0
    const cost = Number(v.purchase_price) + linked
    owned_value += cost

    if (v.estimated_sale_price) {
      const estPrice = Number(v.estimated_sale_price)
      total_market_value += estPrice
      potential_profit += estPrice - cost
    } else {
      total_market_value += cost
      missing_estimate_count++
    }
  }

  let consigned_value = 0
  for (const v of consigned) {
    const linked = expenseMap.get(v.id) ?? 0
    const payout = Number(v.owner_payout_amount ?? 0)
    const commission = payout * Number(v.commission_rate ?? 0)
    consigned_value += payout

    if (v.estimated_sale_price) {
      const estPrice = Number(v.estimated_sale_price)
      total_market_value += estPrice
      potential_profit += estPrice - payout - linked + commission
    } else {
      missing_estimate_count++
    }
  }

  return {
    cars_in_stock: vehicles.length,
    owned_count: owned.length,
    consigned_count: consigned.length,
    total_invested: owned_value,
    owned_value,
    consigned_value,
    total_market_value,
    potential_profit,
    missing_estimate_count,
  }
}

export async function getVehiclesWithProfitBatch(
  vehicles: Awaited<ReturnType<typeof getVehicles>>
): Promise<VehicleWithProfit[]> {
  if (vehicles.length === 0) return []

  const supabase = createServiceClient()
  const user = await getCurrentUser()
  if (!user) return []

  const vehicleIds = vehicles.map(v => v.id)
  const { data: txs } = await supabase
    .from('transactions')
    .select('*, category:transaction_categories(*)')
    .eq('user_id', user.id)
    .in('vehicle_id', vehicleIds)
    .order('date', { ascending: false })

  const allTxs = txs ?? []

  return vehicles.map(vehicle => {
    const transactions = allTxs.filter(t => t.vehicle_id === vehicle.id)
    const sale = transactions.find(t => t.type === 'sale')
    const sale_price = sale ? Number(sale.amount) : null
    const expenseTxs = transactions.filter(t => t.type === 'expense')
    const linked_expenses = expenseTxs.reduce((s, t) => s + Number(t.amount), 0)
    const owner_prep_expenses = expenseTxs
      .filter(t => t.is_owner_prep)
      .reduce((s, t) => s + Number(t.amount), 0)
    const dealer_expenses = linked_expenses - owner_prep_expenses
    const isConsigned = vehicle.inventory_type === 'consigned'
    const costBasis = isConsigned
      ? Number(vehicle.owner_payout_amount ?? 0)
      : Number(vehicle.purchase_price)
    const commission = isConsigned
      ? Number(vehicle.owner_payout_amount ?? 0) * Number(vehicle.commission_rate ?? 0)
      : 0
    const total_cost = costBasis + dealer_expenses
    const profit = sale_price !== null ? sale_price - total_cost + commission : null
    const profit_margin =
      sale_price && sale_price > 0 ? ((profit ?? 0) / sale_price) * 100 : null
    return {
      ...vehicle,
      inventory_type: (vehicle.inventory_type ?? 'owned') as VehicleWithProfit['inventory_type'],
      sale_price,
      linked_expenses,
      owner_prep_expenses,
      commission,
      total_cost,
      profit,
      profit_margin,
      transactions,
    }
  })
}

export async function updateVehicleStatus(id: string, status: VehicleStatus) {
  const supabase = createServiceClient()
  const user = await getCurrentUser()
  if (!user) throw new Error('Unauthorized')

  await supabase
    .from('vehicles')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', user.id)

  revalidatePath('/inicio')
  revalidatePath('/veiculos')
}

export async function updateVehicle(input: UpdateVehicleInput) {
  const supabase = createServiceClient()
  const user = await getCurrentUser()
  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase
    .from('vehicles')
    .update({
      make: input.make,
      model: input.model,
      year: input.year,
      plate: input.plate || null,
      inventory_type: input.inventory_type,
      purchase_price: input.purchase_price,
      owner_payout_amount: input.owner_payout_amount,
      commission_rate: input.commission_rate,
      estimated_sale_price: input.estimated_sale_price,
      purchase_date: input.purchase_date,
      status: input.status,
      notes: input.notes || null,
      receipt_url: input.receipt_url,
      updated_at: new Date().toISOString(),
    })
    .eq('id', input.id)
    .eq('user_id', user.id)

  if (error) throw new Error(error.message)

  if (input.inventory_type === 'owned') {
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
  }

  revalidatePath('/inicio')
  revalidatePath('/veiculos')
}

export async function updateVehicleContract(id: string, contract_url: string | null) {
  const supabase = createServiceClient()
  const user = await getCurrentUser()
  if (!user) throw new Error('Unauthorized')

  const { data: vehicle, error: lookupError } = await supabase
    .from('vehicles')
    .select('contract_url')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (lookupError) throw new Error(lookupError.message)

  const previousContractUrl = vehicle.contract_url

  const { error } = await supabase
    .from('vehicles')
    .update({ contract_url, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    if (contract_url && contract_url !== previousContractUrl) {
      await deleteReceiptByPublicUrl(contract_url).catch(console.error)
    }
    throw new Error(error.message)
  }

  if (previousContractUrl && previousContractUrl !== contract_url) {
    await deleteReceiptByPublicUrl(previousContractUrl).catch(console.error)
  }

  revalidatePath(`/veiculos/${id}`)
  revalidatePath('/veiculos')
}

export async function deleteVehicle(id: string) {
  const supabase = createServiceClient()
  const user = await getCurrentUser()
  if (!user) throw new Error('Unauthorized')
  if (!can(user.role, 'delete_vehicles')) throw new Error('Sem permissão para excluir veículos.')

  await supabase.from('vehicles').delete().eq('id', id).eq('user_id', user.id)
  revalidatePath('/inicio')
  revalidatePath('/veiculos')
}
