'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth'
import type { TransactionType, PaymentMethod } from '@/lib/types'

export interface AddExpenseInput {
  amount: number
  category_id: string | null
  description: string
  date: string
  payment_method: PaymentMethod
  vehicle_id: string | null
  notes: string
  receipt_url: string | null
}

export interface AddSaleInput {
  vehicle_id: string
  amount: number
  date: string
  payment_method: PaymentMethod
  notes: string
  receipt_url: string | null
}

export interface AddVehiclePurchaseInput {
  make: string
  model: string
  year: number
  plate: string
  purchase_price: number
  purchase_date: string
  notes: string
  receipt_url: string | null
}

export interface UpdateTransactionInput {
  id: string
  amount: number
  category_id: string | null
  description: string
  date: string
  payment_method: PaymentMethod | null
  vehicle_id: string | null
  notes: string
  receipt_url: string | null
}

export async function addExpense(input: AddExpenseInput) {
  const supabase = await createClient()
  const user = await getCurrentUser()
  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase.from('transactions').insert({
    user_id: user.id,
    type: 'expense' as TransactionType,
    amount: input.amount,
    category_id: input.category_id,
    description: input.description || null,
    date: input.date,
    payment_method: input.payment_method,
    vehicle_id: input.vehicle_id,
    notes: input.notes || null,
    receipt_url: input.receipt_url,
  })

  if (error) throw new Error(error.message)
  revalidatePath('/', 'layout')
}

export async function addSale(input: AddSaleInput) {
  const supabase = await createClient()
  const user = await getCurrentUser()
  if (!user) throw new Error('Unauthorized')

  const { error: txError } = await supabase.from('transactions').insert({
    user_id: user.id,
    type: 'sale' as TransactionType,
    amount: input.amount,
    vehicle_id: input.vehicle_id,
    date: input.date,
    payment_method: input.payment_method,
    notes: input.notes || null,
    description: 'Venda de veículo',
    receipt_url: input.receipt_url,
  })

  if (txError) throw new Error(txError.message)

  // Mark vehicle as sold
  await supabase
    .from('vehicles')
    .update({ status: 'sold', updated_at: new Date().toISOString() })
    .eq('id', input.vehicle_id)
    .eq('user_id', user.id)

  revalidatePath('/', 'layout')
}

export async function addVehiclePurchase(input: AddVehiclePurchaseInput) {
  const supabase = await createClient()
  const user = await getCurrentUser()
  if (!user) throw new Error('Unauthorized')

  // Insert vehicle record
  const { data: vehicle, error: vErr } = await supabase
    .from('vehicles')
    .insert({
      user_id: user.id,
      make: input.make,
      model: input.model,
      year: input.year,
      plate: input.plate || null,
      purchase_price: input.purchase_price,
      purchase_date: input.purchase_date,
      notes: input.notes || null,
      receipt_url: input.receipt_url,
      status: 'in_stock',
    })
    .select()
    .single()

  if (vErr) throw new Error(vErr.message)

  // Insert vehicle_purchase transaction
  await supabase.from('transactions').insert({
    user_id: user.id,
    type: 'vehicle_purchase' as TransactionType,
    amount: input.purchase_price,
    vehicle_id: vehicle.id,
    date: input.purchase_date,
    description: `Compra: ${input.year} ${input.make} ${input.model}`,
    notes: input.notes || null,
    receipt_url: input.receipt_url,
  })

  revalidatePath('/', 'layout')
}

export async function updateTransaction(input: UpdateTransactionInput) {
  const supabase = await createClient()
  const user = await getCurrentUser()
  if (!user) throw new Error('Unauthorized')

  const { data: existing, error: existingError } = await supabase
    .from('transactions')
    .select('id, type, vehicle_id')
    .eq('id', input.id)
    .eq('user_id', user.id)
    .single()

  if (existingError) throw new Error(existingError.message)

  const { error } = await supabase
    .from('transactions')
    .update({
      amount: input.amount,
      category_id: input.category_id,
      description: input.description || null,
      date: input.date,
      payment_method: input.payment_method,
      vehicle_id: input.vehicle_id,
      notes: input.notes || null,
      receipt_url: input.receipt_url,
      updated_at: new Date().toISOString(),
    })
    .eq('id', input.id)
    .eq('user_id', user.id)

  if (error) throw new Error(error.message)

  if (existing.type === 'vehicle_purchase' && existing.vehicle_id) {
    await supabase
      .from('vehicles')
      .update({
        purchase_price: input.amount,
        purchase_date: input.date,
        notes: input.notes || null,
        receipt_url: input.receipt_url,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.vehicle_id)
      .eq('user_id', user.id)
  }

  if (existing.type === 'sale' && input.vehicle_id) {
    await supabase
      .from('vehicles')
      .update({ status: 'sold', updated_at: new Date().toISOString() })
      .eq('id', input.vehicle_id)
      .eq('user_id', user.id)
  }

  revalidatePath('/', 'layout')
}

export async function deleteTransaction(id: string) {
  const supabase = await createClient()
  const user = await getCurrentUser()
  if (!user) throw new Error('Unauthorized')

  await supabase.from('transactions').delete().eq('id', id).eq('user_id', user.id)
  revalidatePath('/', 'layout')
}

export async function getTransactions(filters?: {
  type?: TransactionType
  month?: string
  vehicle_id?: string
  limit?: number
  offset?: number
}) {
  const supabase = await createClient()
  const user = await getCurrentUser()
  if (!user) return { data: [], count: 0 }

  let query = supabase
    .from('transactions')
    .select('*, category:transaction_categories(*), vehicle:vehicles(id, make, model, year)', { count: 'exact' })
    .eq('user_id', user.id)
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })

  if (filters?.type) query = query.eq('type', filters.type)
  if (filters?.vehicle_id) query = query.eq('vehicle_id', filters.vehicle_id)
  if (filters?.month) {
    const start = `${filters.month}-01`
    const end = new Date(
      new Date(start).getFullYear(),
      new Date(start).getMonth() + 1, 0
    ).toISOString().slice(0, 10)
    query = query.gte('date', start).lte('date', end)
  }
  if (filters?.limit) query = query.limit(filters.limit)
  if (filters?.offset) query = query.range(filters.offset, (filters.offset + (filters.limit ?? 20)) - 1)

  const { data, count } = await query
  return { data: data ?? [], count: count ?? 0 }
}

export async function getCategories() {
  const supabase = await createClient()
  const user = await getCurrentUser()
  if (!user) return []

  const { data } = await supabase
    .from('transaction_categories')
    .select('*')
    .eq('user_id', user.id)
    .order('name')

  return data ?? []
}
