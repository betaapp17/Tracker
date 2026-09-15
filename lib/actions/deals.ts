'use server'

import { revalidatePath } from 'next/cache'
import { createServiceClient } from '@/lib/supabase/service'
import { requirePermission } from '@/lib/auth'
import type { PaymentMethod } from '@/lib/types'

export type TradeInVehicleInput = { make: string; model: string; year: number; plate: string; value: number; notes?: string }
export type AddDealInput = {
  outgoing_vehicle_id: string
  sale_price: number
  date: string
  payment_method: PaymentMethod | null
  notes: string
  receipt_url: string | null
  trade_in?: TradeInVehicleInput | null
}

export async function addDeal(input: AddDealInput) {
  const user = await requirePermission('record_sales')
  const supabase = createServiceClient()
  if (input.sale_price < 0) throw new Error('Valor de venda inválido.')
  const tradeValue = input.trade_in?.value ?? 0
  if (tradeValue < 0) throw new Error('Valor da troca inválido.')
  const difference = input.sale_price - tradeValue
  const cashReceived = Math.max(difference, 0)
  const cashPaid = Math.max(-difference, 0)

  const { data: sold, error: soldErr } = await supabase.from('vehicles')
    .update({ status: 'sold', updated_at: new Date().toISOString() })
    .eq('id', input.outgoing_vehicle_id).eq('user_id', user.id).eq('status', 'in_stock').select('id')
  if (soldErr) throw new Error(soldErr.message)
  if (!sold?.length) throw new Error('Veículo já foi vendido ou não encontrado.')

  let incomingVehicleId: string | null = null
  let dealId: string | null = null
  let saleTransactionId: string | null = null
  let purchaseTransactionId: string | null = null
  let adjustmentTransactionId: string | null = null

  try {
    if (input.trade_in) {
      const { data: incoming, error } = await supabase.from('vehicles').insert({
        user_id: user.id, inventory_type: 'owned', make: input.trade_in.make.trim(), model: input.trade_in.model.trim(),
        year: input.trade_in.year, plate: input.trade_in.plate.trim() || null, purchase_price: tradeValue,
        purchase_date: input.date, status: 'in_stock', notes: input.trade_in.notes?.trim() || `Recebido em troca na venda ${input.outgoing_vehicle_id}`,
      }).select('id').single()
      if (error) throw error
      incomingVehicleId = incoming.id
    }

    const dealType = input.trade_in ? (cashReceived === 0 && cashPaid === 0 ? 'exchange' : 'trade_in') : 'cash_sale'
    const { data: deal, error: dealErr } = await supabase.from('vehicle_deals').insert({
      user_id: user.id, outgoing_vehicle_id: input.outgoing_vehicle_id, incoming_vehicle_id: incomingVehicleId,
      deal_type: dealType, sale_price: input.sale_price, trade_in_value: tradeValue, cash_received: cashReceived,
      cash_paid: cashPaid, payment_method: (cashReceived > 0 || cashPaid > 0) ? input.payment_method : null,
      date: input.date, notes: input.notes.trim() || null, receipt_url: input.receipt_url,
    }).select('id').single()
    if (dealErr) throw dealErr
    dealId = deal.id

    const { data: saleTx, error: saleErr } = await supabase.from('transactions').insert({
      user_id: user.id, type: 'sale', amount: input.sale_price, vehicle_id: input.outgoing_vehicle_id,
      date: input.date, payment_method: input.payment_method, notes: input.notes.trim() || null,
      description: input.trade_in ? 'Venda de veículo com troca' : 'Venda de veículo', receipt_url: input.receipt_url,
    }).select('id').single()
    if (saleErr) throw saleErr
    saleTransactionId = saleTx.id

    if (incomingVehicleId && tradeValue > 0) {
      const { data: purchaseTx, error: purchaseErr } = await supabase.from('transactions').insert({
        user_id: user.id, type: 'vehicle_purchase', amount: tradeValue, vehicle_id: incomingVehicleId,
        date: input.date, description: `Veículo recebido em troca: ${input.trade_in!.year} ${input.trade_in!.make} ${input.trade_in!.model}`,
        notes: `Aquisição vinculada à venda ${input.outgoing_vehicle_id}`,
      }).select('id').single()
      if (purchaseErr) throw purchaseErr
      purchaseTransactionId = purchaseTx.id
    }

    if (cashPaid > 0) {
      const { data: adjustmentTx, error: adjustmentErr } = await supabase.from('transactions').insert({
        user_id: user.id, type: 'adjustment', amount: cashPaid, vehicle_id: input.outgoing_vehicle_id,
        date: input.date, payment_method: input.payment_method, description: 'Troco pago ao cliente em troca de veículo', notes: input.notes.trim() || null,
      }).select('id').single()
      if (adjustmentErr) throw adjustmentErr
      adjustmentTransactionId = adjustmentTx.id
    }
  } catch (error) {
    if (adjustmentTransactionId) await supabase.from('transactions').delete().eq('id', adjustmentTransactionId).eq('user_id', user.id)
    if (purchaseTransactionId) await supabase.from('transactions').delete().eq('id', purchaseTransactionId).eq('user_id', user.id)
    if (saleTransactionId) await supabase.from('transactions').delete().eq('id', saleTransactionId).eq('user_id', user.id)
    if (dealId) await supabase.from('vehicle_deals').delete().eq('id', dealId).eq('user_id', user.id)
    if (incomingVehicleId) await supabase.from('vehicles').delete().eq('id', incomingVehicleId).eq('user_id', user.id)
    await supabase.from('vehicles').update({ status: 'in_stock', updated_at: new Date().toISOString() }).eq('id', input.outgoing_vehicle_id).eq('user_id', user.id)
    throw new Error(error instanceof Error ? error.message : 'Erro ao registrar negociação.')
  }

  for (const path of ['/inicio', '/transacoes', '/relatorios', '/veiculos']) revalidatePath(path)
  return { trade_in_vehicle_id: incomingVehicleId, cash_received: cashReceived, cash_paid: cashPaid }
}
