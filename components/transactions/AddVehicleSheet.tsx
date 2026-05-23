'use client'

import { useState, useTransition } from 'react'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { addVehiclePurchase } from '@/lib/actions/transactions'
import { todayISO } from '@/lib/formatters'

export function AddVehicleSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [pending, startTransition] = useTransition()
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
    if (!form.make || !form.model || !form.purchase_price) return
    startTransition(async () => {
      try {
        await addVehiclePurchase({
          make: form.make,
          model: form.model,
          year: Number(form.year),
          plate: form.plate,
          purchase_price: Number(form.purchase_price),
          purchase_date: form.purchase_date,
          notes: form.notes,
        })
        setForm({
          make: '', model: '', year: new Date().getFullYear().toString(),
          plate: '', purchase_price: '', purchase_date: todayISO(), notes: '',
        })
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

        <Input
          label="Preço de Compra (R$)"
          type="number"
          inputMode="decimal"
          placeholder="0,00"
          value={form.purchase_price}
          onChange={e => set('purchase_price', e.target.value)}
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

        <Button onClick={handleSubmit} loading={pending} className="bg-ios-primary text-white mt-2">
          Adicionar ao Estoque
        </Button>
      </div>
    </BottomSheet>
  )
}
