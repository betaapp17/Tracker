'use server'

import { createServiceClient } from '@/lib/supabase/service'
import { getCurrentUser } from '@/lib/auth'
import type { IntegrityIssue } from '@/lib/types'

export async function getIntegrityChecks(): Promise<IntegrityIssue[]> {
  const supabase = createServiceClient()
  const user = await getCurrentUser()
  if (!user) return []

  const issues: IntegrityIssue[] = []

  const [soldRes, saleTxsRes, zeroPriceRes] = await Promise.all([
    supabase
      .from('vehicles')
      .select('id, make, model, year')
      .eq('user_id', user.id)
      .eq('status', 'sold'),
    supabase
      .from('transactions')
      .select('id, vehicle_id, amount')
      .eq('user_id', user.id)
      .eq('type', 'sale'),
    supabase
      .from('vehicles')
      .select('id, make, model, year')
      .eq('user_id', user.id)
      .eq('inventory_type', 'owned')
      .lte('purchase_price', 0)
      .neq('status', 'archived'),
  ])

  const soldVehicles = soldRes.data ?? []
  const saleTxs     = saleTxsRes.data ?? []
  const zeroPrice   = zeroPriceRes.data ?? []

  // Check 1: sold vehicle with no matching sale transaction
  const saleVehicleIds = new Set(saleTxs.map(t => t.vehicle_id).filter(Boolean))
  const soldWithNoTx = soldVehicles.filter(v => !saleVehicleIds.has(v.id))
  if (soldWithNoTx.length > 0) {
    const names = soldWithNoTx.slice(0, 3).map(v => `${v.year} ${v.make} ${v.model}`).join(' · ')
    issues.push({
      type: 'sold_no_transaction',
      label: `${soldWithNoTx.length} veículo${soldWithNoTx.length > 1 ? 's' : ''} vendido${soldWithNoTx.length > 1 ? 's' : ''} sem transação de venda`,
      detail: names + (soldWithNoTx.length > 3 ? ` +${soldWithNoTx.length - 3} mais` : ''),
      severity: 'error',
      count: soldWithNoTx.length,
    })
  }

  // Check 2: sale transaction with no vehicle linked
  const orphanSales = saleTxs.filter(t => !t.vehicle_id)
  if (orphanSales.length > 0) {
    issues.push({
      type: 'transaction_no_vehicle',
      label: `${orphanSales.length} venda${orphanSales.length > 1 ? 's' : ''} sem veículo vinculado`,
      detail: 'Transação de venda sem carro associado — o lucro não será calculado.',
      severity: 'error',
      count: orphanSales.length,
    })
  }

  // Check 3: owned vehicle with purchase price R$0 (likely entry mistake)
  if (zeroPrice.length > 0) {
    const names = zeroPrice.slice(0, 3).map(v => `${v.year} ${v.make} ${v.model}`).join(' · ')
    issues.push({
      type: 'zero_price',
      label: `${zeroPrice.length} veículo${zeroPrice.length > 1 ? 's' : ''} com preço de compra R$0`,
      detail: names + (zeroPrice.length > 3 ? ` +${zeroPrice.length - 3} mais` : ''),
      severity: 'warning',
      count: zeroPrice.length,
    })
  }

  // Check 4: count mismatch (only if checks 1 & 2 didn't already explain it)
  if (soldWithNoTx.length === 0 && orphanSales.length === 0) {
    const diff = saleTxs.length - soldVehicles.length
    if (diff !== 0) {
      issues.push({
        type: 'count_mismatch',
        label: 'Inconsistência nas contagens',
        detail: `${soldVehicles.length} veículos com status Vendido, mas ${saleTxs.length} transações de venda.`,
        severity: 'warning',
        count: Math.abs(diff),
      })
    }
  }

  return issues
}
