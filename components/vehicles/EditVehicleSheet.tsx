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
import type { VehicleWithProfit, VehicleStatus } from '@/lib/types'

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
    purchase_price: currencyInputFromNumber(vehicle.purchase_price),
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
      purchase_price: currencyInputFromNumber(vehicle.purchase_price),
      purchase_date: vehicle.purchase_date,
      status: vehicle.status,
      notes: vehicle.notes ?? '',
    })
  }, [open, vehicle])

  const set = (key: string, value: string) => {
    setForm(current => ({ ...current, [key]: value }))
  }

  const handleSave = () => {
    const purchasePrice = parseCurrencyInput(form.purchase_price)
    if (!form.make || !form.model || purchasePrice <= 0) return

    startTransition(async () => {
      try {
        const uploadedReceiptUrl = receiptFile ? await uploadReceipt(receiptFile) : receiptUrl

        await updateVehicle({
          id: vehicle.id,
          make: form.make,
          model: form.model,
          year: Number(form.year),
          plate: form.plate,
          purchase_price: purchasePrice,
          purchase_date: form.purchase_date,
          status: form.status as VehicleStatus,
          notes: form.notes,
          receipt_url: uploadedReceiptUrl,
        })

        onClose()
      } catch {
        // Keep the sheet open so the user can retry.
      }
    })
  }

  return (
    <BottomSheet open={open} onClose={onClose} title="Editar Veículo">
      <div className="space-y-4 pb-6">
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Marca"
            value={form.make}
            onChange={event => set('make', event.target.value)}
          />
          <Input
            label="Modelo"
            value={form.model}
            onChange={event => set('model', event.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Ano"
            type="number"
            value={form.year}
            onChange={event => set('year', event.target.value)}
          />
          <Input
            label="Placa"
            value={form.plate}
            onChange={event => set('plate', event.target.value.toUpperCase())}
          />
        </div>

        <CurrencyInput
          label="Preço de Compra (R$)"
          value={form.purchase_price}
          onChange={value => set('purchase_price', value)}
        />

        <Input
          label="Data de Compra"
          type="date"
          value={form.purchase_date}
          onChange={event => set('purchase_date', event.target.value)}
        />

        <Select label="Status" value={form.status} onChange={event => set('status', event.target.value)}>
          <option value="in_stock">Em estoque</option>
          <option value="sold">Vendido</option>
          <option value="archived">Arquivado</option>
        </Select>

        <Input
          label="Observações"
          value={form.notes}
          onChange={event => set('notes', event.target.value)}
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
