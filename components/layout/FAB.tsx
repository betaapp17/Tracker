'use client'

import { useState } from 'react'
import { Plus, X, DollarSign, Car, TrendingDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { AddExpenseSheet } from '@/components/transactions/AddExpenseSheet'
import { AddSaleSheet } from '@/components/transactions/AddSaleSheet'
import { AddVehicleSheet } from '@/components/transactions/AddVehicleSheet'

type Sheet = 'expense' | 'sale' | 'vehicle' | null

export function FAB() {
  const [open, setOpen] = useState(false)
  const [sheet, setSheet] = useState<Sheet>(null)

  const openSheet = (s: Sheet) => {
    setOpen(false)
    setSheet(s)
  }

  const actions = [
    { label: 'Despesa', icon: TrendingDown, color: 'bg-expense', action: () => openSheet('expense') },
    { label: 'Venda',   icon: DollarSign,   color: 'bg-profit',  action: () => openSheet('sale') },
    { label: 'Veículo', icon: Car,          color: 'bg-ios-primary', action: () => openSheet('vehicle') },
  ]

  return (
    <>
      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/20"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Action bubbles */}
      <div className={cn(
        'fixed right-5 z-40 flex flex-col-reverse items-end gap-3 transition-all duration-200',
        'bottom-[calc(var(--bottom-nav-height)+env(safe-area-inset-bottom,0px)+16px)]',
      )}>
        {actions.map(({ label, icon: Icon, color, action }, i) => (
          <div
            key={label}
            className={cn(
              'flex items-center gap-3 transition-all duration-200',
              open ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
            )}
            style={{ transitionDelay: open ? `${i * 40}ms` : '0ms' }}
          >
            <span className="text-[13px] font-semibold text-ios-primary bg-white rounded-xl px-3 py-1.5 shadow-card">
              {label}
            </span>
            <button
              onClick={action}
              className={cn(
                'w-12 h-12 rounded-full flex items-center justify-center shadow-fab pressable',
                color
              )}
              aria-label={label}
            >
              <Icon className="w-5 h-5 text-white" />
            </button>
          </div>
        ))}

        {/* Main FAB */}
        <button
          onClick={() => setOpen(v => !v)}
          className={cn(
            'w-14 h-14 rounded-full bg-taquinho shadow-fab pressable',
            'flex items-center justify-center transition-transform duration-200',
            open && 'rotate-45'
          )}
          aria-label={open ? 'Fechar' : 'Adicionar'}
        >
          {open
            ? <X className="w-6 h-6 text-ios-primary" />
            : <Plus className="w-6 h-6 text-ios-primary" strokeWidth={2.5} />
          }
        </button>
      </div>

      {/* Sheets */}
      <AddExpenseSheet open={sheet === 'expense'} onClose={() => setSheet(null)} />
      <AddSaleSheet    open={sheet === 'sale'}    onClose={() => setSheet(null)} />
      <AddVehicleSheet open={sheet === 'vehicle'} onClose={() => setSheet(null)} />
    </>
  )
}
