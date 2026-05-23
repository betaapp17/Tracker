'use client'

import { useState, useEffect, useTransition } from 'react'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { Input, Select } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { addSale } from '@/lib/actions/transactions'
import { getVehicles } from '@/lib/actions/vehicles'
import { todayISO } from '@/lib/formatters'
import type { Vehicle } from '@/lib/types'

export function AddSaleSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [pending, startTransition] = useTransition()
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [form, setForm] = useState({
    vehicle_id: '',
    amount: '',
    date: todayISO(),
    payment_method: 'pix',
    notes: '',
  })

  useEffect(() => {
    if (!open) return
    getVehicles('in_stock').then(setVehicles)
  }, [open])

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = () => {
    if (!form.vehicle_id || !form.amount || Number(form.amount) <= 0) return
    startTransition(async () => {
      try {
        await addSale({
          vehicle_id: form.vehicle_id,
          amount: Number(form.amount),
          date: form.date,
          payment_method: form.payment_method as never,
          notes: form.notes,
        })
        setForm({ vehicle_id: '', amount: '', date: todayISO(), payment_method: 'pix', notes: '' })
        onClose()
      } catch { /* ignore */ }
    })
  }

  return (
    <BottomSheet open={open} onClose={onClose} title="Registrar Venda">
      <div className="space-y-4 pb-6">
        <Select label="Veículo" value={form.vehicle_id} onChange={e => set('vehicle_id', e.target.value)}>
          <option value="">Selecionar veículo</option>
          {vehicles.map(v => (
            <option key={v.id} value={v.id}>{v.year} {v.make} {v.model}</option>
          ))}
        </Select>

        {vehicles.length === 0 && (
          <p className="text-[13px] text-ios-secondary text-center py-2">
            Nenhum veículo em estoque
          </p>
        )}

        <Input
          label="Preço de Venda (R$)"
          type="number"
          inputMode="decimal"
          placeholder="0,00"
          value={form.amount}
          onChange={e => set('amount', e.target.value)}
        />

        <Input
          label="Data da Venda"
          type="date"
          value={form.date}
          onChange={e => set('date', e.target.value)}
        />

        <Select label="Forma de Pagamento" value={form.payment_method} onChange={e => set('payment_method', e.target.value)}>
          <option value="pix">PIX</option>
          <option value="cash">Dinheiro</option>
          <option value="card">Cartão</option>
          <option value="transfer">Transferência</option>
          <option value="financing">Financiamento</option>
        </Select>

        <Input
          label="Observações (opcional)"
          placeholder="Nome do comprador, detalhes..."
          value={form.notes}
          onChange={e => set('notes', e.target.value)}
        />

        <Button onClick={handleSubmit} loading={pending} className="bg-profit text-white mt-2">
          Confirmar Venda
        </Button>
      </div>
    </BottomSheet>
  )
}
