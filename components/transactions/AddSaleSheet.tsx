'use client'

import { useState, useEffect, useRef, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { Input, Select } from '@/components/ui/Input'
import { CurrencyInput } from '@/components/ui/CurrencyInput'
import { ReceiptInput } from '@/components/ui/ReceiptInput'
import { Button } from '@/components/ui/Button'
import { addSale } from '@/lib/actions/transactions'
import { getVehicles } from '@/lib/actions/vehicles'
import { parseCurrencyInput } from '@/lib/currency'
import { todayISO, formatBRL } from '@/lib/formatters'
import { uploadReceipt } from '@/lib/receipts'
import type { Vehicle } from '@/lib/types'

export function AddSaleSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [receiptFile, setReceiptFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const submittingRef = useRef(false)
  const [form, setForm] = useState({
    vehicle_id: '',
    amount: '',
    date: todayISO(),
    payment_method: 'pix',
    notes: '',
  })

  useEffect(() => {
    if (!open) return
    setError(null)
    submittingRef.current = false
    getVehicles('in_stock').then(setVehicles)
  }, [open])

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const selectedVehicle = vehicles.find(v => v.id === form.vehicle_id) ?? null
  const isConsigned = selectedVehicle?.inventory_type === 'consigned'

  const handleSubmit = () => {
    const amount = parseCurrencyInput(form.amount)
    if (!form.vehicle_id || !form.amount || amount <= 0 || submittingRef.current || pending) return
    submittingRef.current = true
    setError(null)
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
        router.refresh()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao registrar venda. Tente novamente.')
        submittingRef.current = false
      }
    })
  }

  return (
    <BottomSheet open={open} onClose={onClose} title="Registrar Venda">
      <div className="space-y-4 pb-6">
        <Select label="Veículo" value={form.vehicle_id} onChange={e => set('vehicle_id', e.target.value)}>
          <option value="">Selecionar veículo</option>
          {vehicles.map(v => (
            <option key={v.id} value={v.id}>
              {v.year} {v.make} {v.model}{v.inventory_type === 'consigned' ? ' · Consignado' : ''}
            </option>
          ))}
        </Select>

        {vehicles.length === 0 && (
          <p className="text-[13px] text-ios-secondary text-center py-2">
            Nenhum veículo em estoque
          </p>
        )}

        {isConsigned && selectedVehicle?.owner_payout_amount != null && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
            <p className="text-[12px] text-amber-700 font-medium">Veículo Consignado</p>
            <p className="text-[12px] text-amber-600 mt-0.5">
              Repasse ao dono: <span className="font-semibold">{formatBRL(selectedVehicle.owner_payout_amount)}</span>
            </p>
          </div>
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

        {error && (
          <p className="text-[13px] text-expense text-center">{error}</p>
        )}

        <Button onClick={handleSubmit} loading={pending} className="bg-profit text-white mt-2">
          Confirmar Venda
        </Button>
      </div>
    </BottomSheet>
  )
}
