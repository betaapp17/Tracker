'use client'

import { useEffect, useState, useTransition } from 'react'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { Button } from '@/components/ui/Button'
import { CurrencyInput } from '@/components/ui/CurrencyInput'
import { Input, Select } from '@/components/ui/Input'
import { ReceiptInput } from '@/components/ui/ReceiptInput'
import { updateVehicle } from '@/lib/actions/vehicles'
import { currencyInputFromNumber, parseCurrencyInput } from '@/lib/currency'
import { uploadReceipt } from '@/lib/receipts'
import { cn } from '@/lib/utils'
import type { VehicleWithProfit, VehicleStatus, InventoryType } from '@/lib/types'

interface EditVehicleSheetProps {
  vehicle: VehicleWithProfit
  open: boolean
  onClose: () => void
}

export function EditVehicleSheet({ vehicle, open, onClose }: EditVehicleSheetProps) {
  const [pending, startTransition] = useTransition()
  const [receiptFile, setReceiptFile] = useState<File | null>(null)
  const [receiptUrl, setReceiptUrl] = useState(vehicle.receipt_url)
  const [form, setForm] = useState({
    make: vehicle.make,
    model: vehicle.model,
    year: String(vehicle.year),
    plate: vehicle.plate ?? '',
    inventory_type: (vehicle.inventory_type ?? 'owned') as InventoryType,
    purchase_price: currencyInputFromNumber(vehicle.purchase_price),
    owner_payout_amount: currencyInputFromNumber(vehicle.owner_payout_amount ?? 0),
    estimated_sale_price: currencyInputFromNumber(vehicle.estimated_sale_price ?? 0),
    purchase_date: vehicle.purchase_date,
    status: vehicle.status,
    notes: vehicle.notes ?? '',
  })

  useEffect(() => {
    if (!open) return
    setReceiptFile(null)
    setReceiptUrl(vehicle.receipt_url)
    setForm({
      make: vehicle.make,
      model: vehicle.model,
      year: String(vehicle.year),
      plate: vehicle.plate ?? '',
      inventory_type: (vehicle.inventory_type ?? 'owned') as InventoryType,
      purchase_price: currencyInputFromNumber(vehicle.purchase_price),
      owner_payout_amount: currencyInputFromNumber(vehicle.owner_payout_amount ?? 0),
      estimated_sale_price: currencyInputFromNumber(vehicle.estimated_sale_price ?? 0),
      purchase_date: vehicle.purchase_date,
      status: vehicle.status,
      notes: vehicle.notes ?? '',
    })
  }, [open, vehicle])

  const set = (key: string, value: string) => setForm(current => ({ ...current, [key]: value }))

  const isConsigned = form.inventory_type === 'consigned'

  const handleSave = () => {
    const purchase_price = isConsigned ? 0 : parseCurrencyInput(form.purchase_price)
    const owner_payout = isConsigned ? parseCurrencyInput(form.owner_payout_amount) : null
    const estimated = parseCurrencyInput(form.estimated_sale_price)

    if (!form.make || !form.model) return
    if (!isConsigned && purchase_price <= 0) return

    startTransition(async () => {
      try {
        const uploadedReceiptUrl = receiptFile ? await uploadReceipt(receiptFile) : receiptUrl

        await updateVehicle({
          id: vehicle.id,
          make: form.make,
          model: form.model,
          year: Number(form.year),
          plate: form.plate,
          inventory_type: form.inventory_type,
          purchase_price,
          owner_payout_amount: owner_payout,
          estimated_sale_price: estimated > 0 ? estimated : null,
          purchase_date: form.purchase_date,
          status: form.status as VehicleStatus,
          notes: form.notes,
          receipt_url: uploadedReceiptUrl,
        })

        onClose()
      } catch {
        // Keep sheet open on error
      }
    })
  }

  return (
    <BottomSheet open={open} onClose={onClose} title="Editar Veículo">
      <div className="space-y-4 pb-6">

        {/* Inventory type toggle */}
        <div className="flex bg-ios-fill rounded-xl p-1 gap-1">
          {(['owned', 'consigned'] as const).map(type => (
            <button
              key={type}
              onClick={() => set('inventory_type', type)}
              className={cn(
                'flex-1 py-2 rounded-lg text-[14px] font-medium transition-all',
                form.inventory_type === type
                  ? 'bg-white shadow-sm text-ios-primary'
                  : 'text-ios-secondary'
              )}
            >
              {type === 'owned' ? 'Próprio' : 'Consignado'}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input label="Marca" value={form.make} onChange={e => set('make', e.target.value)} />
          <Input label="Modelo" value={form.model} onChange={e => set('model', e.target.value)} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input label="Ano" type="number" value={form.year} onChange={e => set('year', e.target.value)} />
          <Input label="Placa" value={form.plate} onChange={e => set('plate', e.target.value.toUpperCase())} />
        </div>

        {isConsigned ? (
          <CurrencyInput
            label="Repasse ao Dono (R$)"
            value={form.owner_payout_amount}
            onChange={value => set('owner_payout_amount', value)}
          />
        ) : (
          <CurrencyInput
            label="Preço de Compra (R$)"
            value={form.purchase_price}
            onChange={value => set('purchase_price', value)}
          />
        )}

        <CurrencyInput
          label="Preço Estimado de Venda (R$)"
          value={form.estimated_sale_price}
          onChange={value => set('estimated_sale_price', value)}
        />

        <Input
          label={isConsigned ? 'Data de Entrada' : 'Data de Compra'}
          type="date"
          value={form.purchase_date}
          onChange={e => set('purchase_date', e.target.value)}
        />

        <Select label="Status" value={form.status} onChange={e => set('status', e.target.value)}>
          <option value="in_stock">Em estoque</option>
          <option value="sold">Vendido</option>
          <option value="archived">Arquivado</option>
        </Select>

        <Input
          label="Observações"
          value={form.notes}
          onChange={e => set('notes', e.target.value)}
        />

        <ReceiptInput
          receiptUrl={receiptUrl ?? undefined}
          file={receiptFile}
          onFileChange={setReceiptFile}
          onRemoveReceipt={() => setReceiptUrl(null)}
        />

        <Button onClick={handleSave} loading={pending}>
          Salvar Alterações
        </Button>
      </div>
    </BottomSheet>
  )
}
