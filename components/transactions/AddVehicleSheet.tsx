'use client'

import { useState, useTransition } from 'react'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { Input } from '@/components/ui/Input'
import { CurrencyInput } from '@/components/ui/CurrencyInput'
import { ReceiptInput } from '@/components/ui/ReceiptInput'
import { Button } from '@/components/ui/Button'
import { addVehicle } from '@/lib/actions/transactions'
import { parseCurrencyInput } from '@/lib/currency'
import { todayISO } from '@/lib/formatters'
import { uploadReceipt } from '@/lib/receipts'
import { cn } from '@/lib/utils'

type InventoryType = 'owned' | 'consigned'

const emptyForm = {
  make: '',
  model: '',
  year: new Date().getFullYear().toString(),
  plate: '',
  purchase_price: '',
  owner_payout_amount: '',
  estimated_sale_price: '',
  purchase_date: todayISO(),
  notes: '',
}

export function AddVehicleSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [pending, startTransition] = useTransition()
  const [inventoryType, setInventoryType] = useState<InventoryType>('owned')
  const [receiptFile, setReceiptFile] = useState<File | null>(null)
  const [form, setForm] = useState(emptyForm)

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = () => {
    const isOwned = inventoryType === 'owned'
    const purchase_price = isOwned ? parseCurrencyInput(form.purchase_price) : 0
    const owner_payout = isOwned ? null : parseCurrencyInput(form.owner_payout_amount)
    const estimated = parseCurrencyInput(form.estimated_sale_price)

    if (!form.make || !form.model) return
    if (isOwned && purchase_price <= 0) return
    if (!isOwned && (owner_payout === null || owner_payout < 0)) return

    startTransition(async () => {
      try {
        const receiptUrl = receiptFile ? await uploadReceipt(receiptFile) : null
        await addVehicle({
          inventory_type: inventoryType,
          make: form.make,
          model: form.model,
          year: Number(form.year),
          plate: form.plate,
          purchase_price,
          owner_payout_amount: owner_payout,
          estimated_sale_price: estimated > 0 ? estimated : null,
          purchase_date: form.purchase_date,
          notes: form.notes,
          receipt_url: receiptUrl,
        })
        setForm(emptyForm)
        setReceiptFile(null)
        setInventoryType('owned')
        onClose()
      } catch { /* ignore */ }
    })
  }

  return (
    <BottomSheet open={open} onClose={onClose} title="Adicionar Veículo">
      <div className="space-y-4 pb-6">

        {/* Inventory type toggle */}
        <div className="flex bg-ios-fill rounded-xl p-1 gap-1">
          {(['owned', 'consigned'] as const).map(type => (
            <button
              key={type}
              onClick={() => setInventoryType(type)}
              className={cn(
                'flex-1 py-2 rounded-lg text-[14px] font-medium transition-all',
                inventoryType === type
                  ? 'bg-white shadow-sm text-ios-primary'
                  : 'text-ios-secondary'
              )}
            >
              {type === 'owned' ? 'Próprio' : 'Consignado'}
            </button>
          ))}
        </div>

        {inventoryType === 'consigned' && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
            <p className="text-[12px] text-amber-700 font-medium">Veículo Consignado</p>
            <p className="text-[11px] text-amber-600 mt-0.5">
              O veículo pertence ao dono. A loja recebe o markup/comissão na venda.
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Marca"
            placeholder="Toyota"
            value={form.make}
            onChange={e => set('make', e.target.value)}
          />
          <Input
            label="Modelo"
            placeholder="Corolla"
            value={form.model}
            onChange={e => set('model', e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Ano"
            type="number"
            placeholder="2022"
            value={form.year}
            onChange={e => set('year', e.target.value)}
          />
          <Input
            label="Placa (opcional)"
            placeholder="ABC-1234"
            value={form.plate}
            onChange={e => set('plate', e.target.value.toUpperCase())}
          />
        </div>

        {inventoryType === 'owned' ? (
          <CurrencyInput
            label="Preço de Compra (R$)"
            value={form.purchase_price}
            onChange={value => set('purchase_price', value)}
          />
        ) : (
          <CurrencyInput
            label="Repasse ao Dono (R$)"
            value={form.owner_payout_amount}
            onChange={value => set('owner_payout_amount', value)}
          />
        )}

        <CurrencyInput
          label="Preço Estimado de Venda (R$)"
          value={form.estimated_sale_price}
          onChange={value => set('estimated_sale_price', value)}
        />

        <Input
          label={inventoryType === 'owned' ? 'Data de Compra' : 'Data de Entrada'}
          type="date"
          value={form.purchase_date}
          onChange={e => set('purchase_date', e.target.value)}
        />

        <Input
          label="Observações (opcional)"
          placeholder="Procedência, condições..."
          value={form.notes}
          onChange={e => set('notes', e.target.value)}
        />

        <ReceiptInput
          file={receiptFile}
          onFileChange={setReceiptFile}
        />

        <Button onClick={handleSubmit} loading={pending} className="bg-ios-primary text-white mt-2">
          {inventoryType === 'owned' ? 'Adicionar ao Estoque' : 'Registrar Consignado'}
        </Button>
      </div>
    </BottomSheet>
  )
}
