'use client'

import { useState, useTransition } from 'react'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { Input } from '@/components/ui/Input'
import { CurrencyInput } from '@/components/ui/CurrencyInput'
import { ReceiptInput } from '@/components/ui/ReceiptInput'
import { Button } from '@/components/ui/Button'
import { addVehiclePurchase } from '@/lib/actions/transactions'
import { parseCurrencyInput } from '@/lib/currency'
import { todayISO } from '@/lib/formatters'
import { uploadReceipt } from '@/lib/receipts'

export function AddVehicleSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [pending, startTransition] = useTransition()
  const [receiptFile, setReceiptFile] = useState<File | null>(null)
  const [form, setForm] = useState({
    make: '',
    model: '',
    year: new Date().getFullYear().toString(),
    plate: '',
    purchase_price: '',
    purchase_date: todayISO(),
    notes: '',
  })

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = () => {
    const purchasePrice = parseCurrencyInput(form.purchase_price)
    if (!form.make || !form.model || !form.purchase_price || purchasePrice <= 0) return
    startTransition(async () => {
      try {
        const receiptUrl = receiptFile ? await uploadReceipt(receiptFile) : null
        await addVehiclePurchase({
          make: form.make,
          model: form.model,
          year: Number(form.year),
          plate: form.plate,
          purchase_price: purchasePrice,
          purchase_date: form.purchase_date,
          notes: form.notes,
          receipt_url: receiptUrl,
        })
        setForm({
          make: '', model: '', year: new Date().getFullYear().toString(),
          plate: '', purchase_price: '', purchase_date: todayISO(), notes: '',
        })
        setReceiptFile(null)
        onClose()
      } catch { /* ignore */ }
    })
  }

  return (
    <BottomSheet open={open} onClose={onClose} title="Comprar Veículo">
      <div className="space-y-4 pb-6">
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

        <CurrencyInput
          label="Preço de Compra (R$)"
          value={form.purchase_price}
          onChange={value => set('purchase_price', value)}
        />

        <Input
          label="Data de Compra"
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
          Adicionar ao Estoque
        </Button>
      </div>
    </BottomSheet>
  )
}
