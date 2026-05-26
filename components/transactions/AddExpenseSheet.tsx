'use client'

import { useState, useEffect, useRef, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { Input, Select } from '@/components/ui/Input'
import { CurrencyInput } from '@/components/ui/CurrencyInput'
import { ReceiptInput } from '@/components/ui/ReceiptInput'
import { Button } from '@/components/ui/Button'
import { addExpense, getCategories } from '@/lib/actions/transactions'
import { getVehicles } from '@/lib/actions/vehicles'
import { parseCurrencyInput } from '@/lib/currency'
import { todayISO } from '@/lib/formatters'
import { uploadReceipt } from '@/lib/receipts'
import { cn } from '@/lib/utils'
import type { TransactionCategory, Vehicle } from '@/lib/types'

export function AddExpenseSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [categories, setCategories] = useState<TransactionCategory[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [error, setError] = useState<string | null>(null)
  const submittingRef = useRef(false)
  const [receiptFile, setReceiptFile] = useState<File | null>(null)
  const [isOwnerPrep, setIsOwnerPrep] = useState(false)
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
    setError(null)
    submittingRef.current = false
    getCategories().then(c => setCategories(c.filter(x => x.type === 'expense')))
    getVehicles('in_stock').then(setVehicles)
  }, [open])

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const selectedVehicle = vehicles.find(v => v.id === form.vehicle_id) ?? null
  const isConsignedVehicle = selectedVehicle?.inventory_type === 'consigned'

  const handleVehicleChange = (id: string) => {
    set('vehicle_id', id)
    setIsOwnerPrep(false)
  }

  const handleSubmit = () => {
    const amount = parseCurrencyInput(form.amount)
    if (!form.amount || amount <= 0 || submittingRef.current || pending) return
    submittingRef.current = true
    setError(null)
    startTransition(async () => {
      try {
        const receiptUrl = receiptFile ? await uploadReceipt(receiptFile) : null
        await addExpense({
          amount,
          category_id: form.category_id || null,
          description: form.description,
          date: form.date,
          payment_method: form.payment_method as never,
          vehicle_id: form.vehicle_id || null,
          is_owner_prep: isConsignedVehicle && isOwnerPrep,
          notes: form.notes,
          receipt_url: receiptUrl,
        })
        setForm({ amount: '', category_id: '', description: '', date: todayISO(), payment_method: 'pix', vehicle_id: '', notes: '' })
        setReceiptFile(null)
        setIsOwnerPrep(false)
        onClose()
        router.refresh()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao salvar. Tente novamente.')
        submittingRef.current = false
      }
    })
  }

  return (
    <BottomSheet open={open} onClose={onClose} title="Nova Despesa">
      <div className="space-y-4 pb-6">
        <CurrencyInput
          label="Valor (R$)"
          value={form.amount}
          onChange={value => set('amount', value)}
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
          <Select label="Vincular Veículo (opcional)" value={form.vehicle_id} onChange={e => handleVehicleChange(e.target.value)}>
            <option value="">Sem vínculo</option>
            {vehicles.map(v => (
              <option key={v.id} value={v.id}>
                {v.year} {v.make} {v.model}{v.inventory_type === 'consigned' ? ' · Consignado' : ''}
              </option>
            ))}
          </Select>
        )}

        {isConsignedVehicle && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
            <button
              onClick={() => setIsOwnerPrep(v => !v)}
              className="w-full flex items-center justify-between"
            >
              <div>
                <p className="text-[13px] text-amber-700 font-medium text-left">Pago pelo dono (reembolso)</p>
                <p className="text-[11px] text-amber-600 mt-0.5 text-left">
                  Marque se o dono do carro pagou essa despesa e será reembolsado na venda.
                </p>
              </div>
              <div className={cn(
                'flex-shrink-0 ml-3 w-11 h-6 rounded-full transition-colors relative',
                isOwnerPrep ? 'bg-amber-500' : 'bg-amber-200'
              )}>
                <div className={cn(
                  'absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform',
                  isOwnerPrep ? 'translate-x-5' : 'translate-x-0.5'
                )} />
              </div>
            </button>
          </div>
        )}

        <Input
          label="Observações (opcional)"
          placeholder="Detalhes adicionais"
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
