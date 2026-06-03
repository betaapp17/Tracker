'use client'

import { useState } from 'react'
import { formatBRL, formatDate } from '@/lib/formatters'
import type { Transaction } from '@/lib/types'
import { TrendingDown, DollarSign, Car, SlidersHorizontal, Pencil, Image } from 'lucide-react'
import { cn } from '@/lib/utils'
import { EditTransactionSheet } from '@/components/transactions/EditTransactionSheet'

const typeConfig = {
  expense:          { label: 'Despesa',  sign: '-', color: 'text-expense',  bgColor: 'bg-red-50',    Icon: TrendingDown },
  sale:             { label: 'Venda',    sign: '+', color: 'text-profit',   bgColor: 'bg-green-50',  Icon: DollarSign },
  vehicle_purchase: { label: 'Compra',   sign: '-', color: 'text-ios-secondary', bgColor: 'bg-gray-100', Icon: Car },
  adjustment:       { label: 'Ajuste',   sign: '±', color: 'text-warning',  bgColor: 'bg-orange-50', Icon: SlidersHorizontal },
}

interface Props {
  tx: Transaction
  showCategory?: boolean
}

export function TransactionItem({ tx, showCategory = true }: Props) {
  const [editing, setEditing] = useState(false)
  // Lazy-mount: only insert the sheet into the DOM after the first tap.
  // Without this, 100 transactions = 100 BottomSheet instances each with
  // willChange:transform pre-allocating a GPU layer → iOS kills the process on scroll.
  const [sheetMounted, setSheetMounted] = useState(false)
  const config = typeConfig[tx.type] ?? typeConfig.expense
  const { label, sign, color, bgColor, Icon } = config

  const displayName = tx.description
    || (tx.vehicle ? `${tx.vehicle.year} ${(tx.vehicle as {make:string}).make} ${(tx.vehicle as {model:string}).model}` : null)
    || tx.category?.name
    || label

  return (
    <>
      <div className="flex items-center gap-3 py-3">
        {/* Icon */}
        <div className={cn('w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0', bgColor)}>
          <Icon className={cn('w-4 h-4', color)} />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="text-[14px] font-medium text-ios-primary truncate">{displayName}</p>
            {tx.is_owner_prep && (
              <span className="flex-shrink-0 text-[10px] font-semibold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded-md">
                Reembolsado
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            {showCategory && tx.category && (
              <span className="text-[11px] text-ios-tertiary">{tx.category.name} · </span>
            )}
            <span className="text-[11px] text-ios-tertiary">{formatDate(tx.date)}</span>
            {tx.receipt_url && <Image className="w-3 h-3 text-ios-tertiary" />}
          </div>
        </div>

        {/* Amount */}
        <div className="flex-shrink-0 text-right">
          <span className={cn('text-[15px] font-semibold tabular-nums', color)}>
            {sign}{formatBRL(Number(tx.amount))}
          </span>
        </div>

        <button
          onClick={() => { setSheetMounted(true); setEditing(true) }}
          className="w-8 h-8 rounded-full bg-ios-fill flex items-center justify-center pressable flex-shrink-0"
          aria-label="Editar transação"
        >
          <Pencil className="w-4 h-4 text-ios-secondary" />
        </button>
      </div>

      {sheetMounted && (
        <EditTransactionSheet
          transaction={tx}
          open={editing}
          onClose={() => setEditing(false)}
        />
      )}
    </>
  )
}
