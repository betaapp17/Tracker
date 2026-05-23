'use client'

import { useState, useEffect, useTransition } from 'react'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { Input, Select } from '@/components/ui/Input'
import { CurrencyInput } from '@/components/ui/CurrencyInput'
import { ReceiptInput } from '@/components/ui/ReceiptInput'
import { Button } from '@/components/ui/Button'
import { addSale } from '@/lib/actions/transactions'
import { getVehicles } from '@/lib/actions/vehicles'
import { parseCurrencyInput } from '@/lib/currency'
import { todayISO } from '@/lib/formatters'
import { uploadReceipt } from '@/lib/receipts'
import type { Vehicle } from '@/lib/types'

export function AddSaleSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [pending, startTransition] = useTransition()
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [receiptFile, setReceiptFile] = useState<File | null>(null)
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
    const amount = parseCurrencyInput(form.amount)
    if (!form.vehicle_id || !form.amount || amount <= 0) return
    startTransition(async () => {
      try {
        const receiptUrl = receiptFile ? await uploadReceipt(receiptFile) : null
        await addSale({
          vehicle_id: form.vehicle_id,
          amount,
          date: form.date,
          payment_method: form.payment_method as never,
          notes: form.notes,
          receipt_url: receiptUrl,
        })
        setForm({ vehicle_id: '', amount: '', date: todayISO(), payment_method: 'pix', notes: '' })
        setReceiptFile(null)
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

        <CurrencyInput
          label="Preço de Venda (R$)"
          value={form.amount}
          onChange={value => set('amount', value)}
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

        <ReceiptInput
          file={receiptFile}
          onFileChange={setReceiptFile}
        />

        <Button onClick={handleSubmit} loading={pending} className="bg-profit text-white mt-2">
          Confirmar Venda
        </Button>
      </div>
    </BottomSheet>
  )
}
