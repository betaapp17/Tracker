'use client'

import { useState, useEffect, useTransition } from 'react'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { Input, Select } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { addExpense, getCategories } from '@/lib/actions/transactions'
import { getVehicles } from '@/lib/actions/vehicles'
import { todayISO } from '@/lib/formatters'
import type { TransactionCategory, Vehicle } from '@/lib/types'

export function AddExpenseSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [pending, startTransition] = useTransition()
  const [categories, setCategories] = useState<TransactionCategory[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [form, setForm] = useState({
    amount: '',
    category_id: '',
    description: '',
    date: todayISO(),
    payment_method: 'pix',
    vehicle_id: '',
    notes: '',
  })

  useEffect(() => {
    if (!open) return
    getCategories().then(c => setCategories(c.filter(x => x.type === 'expense')))
    getVehicles('in_stock').then(setVehicles)
  }, [open])

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = () => {
    if (!form.amount || Number(form.amount) <= 0) return
    startTransition(async () => {
      try {
        await addExpense({
          amount: Number(form.amount),
          category_id: form.category_id || null,
          description: form.description,
          date: form.date,
          payment_method: form.payment_method as never,
          vehicle_id: form.vehicle_id || null,
          notes: form.notes,
        })
        setForm({ amount: '', category_id: '', description: '', date: todayISO(), payment_method: 'pix', vehicle_id: '', notes: '' })
        onClose()
      } catch { /* ignore */ }
    })
  }

  return (
    <BottomSheet open={open} onClose={onClose} title="Nova Despesa">
      <div className="space-y-4 pb-6">
        <Input
          label="Valor (R$)"
          type="number"
          inputMode="decimal"
          placeholder="0,00"
          value={form.amount}
          onChange={e => set('amount', e.target.value)}
        />

        <Select label="Categoria" value={form.category_id} onChange={e => set('category_id', e.target.value)}>
          <option value="">Selecionar categoria</option>
          {categories.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </Select>

        <Input
          label="Descrição"
          placeholder="Ex: Revisão do Corolla"
          value={form.description}
          onChange={e => set('description', e.target.value)}
        />

        <Input
          label="Data"
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

        {vehicles.length > 0 && (
          <Select label="Vincular Veículo (opcional)" value={form.vehicle_id} onChange={e => set('vehicle_id', e.target.value)}>
            <option value="">Sem vínculo</option>
            {vehicles.map(v => (
              <option key={v.id} value={v.id}>{v.year} {v.make} {v.model}</option>
            ))}
          </Select>
        )}

        <Input
          label="Observações (opcional)"
          placeholder="Detalhes adicionais"
          value={form.notes}
          onChange={e => set('notes', e.target.value)}
        />

        <Button
          onClick={handleSubmit}
          loading={pending}
          className="bg-expense text-white mt-2"
        >
          Registrar Despesa
        </Button>
      </div>
    </BottomSheet>
  )
}
