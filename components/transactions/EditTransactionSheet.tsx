'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { Button } from '@/components/ui/Button'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import { CurrencyInput } from '@/components/ui/CurrencyInput'
import { Input, Select } from '@/components/ui/Input'
import { ReceiptInput } from '@/components/ui/ReceiptInput'
import { getCategories, updateTransaction, deleteTransaction } from '@/lib/actions/transactions'
import { getVehicles } from '@/lib/actions/vehicles'
import { currencyInputFromNumber, parseCurrencyInput } from '@/lib/currency'
import { uploadReceipt } from '@/lib/receipts'
import { cn } from '@/lib/utils'
import type { PaymentMethod, Transaction, TransactionCategory, Vehicle } from '@/lib/types'

interface EditTransactionSheetProps {
  transaction: Transaction
  open: boolean
  onClose: () => void
}

export function EditTransactionSheet({ transaction, open, onClose }: EditTransactionSheetProps) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [deletePending, startDeleteTransition] = useTransition()
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const submittingRef = useRef(false)
  const [categories, setCategories] = useState<TransactionCategory[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [receiptFile, setReceiptFile] = useState<File | null>(null)
  const [receiptUrl, setReceiptUrl] = useState(transaction.receipt_url)
  const [isOwnerPrep, setIsOwnerPrep] = useState(transaction.is_owner_prep ?? false)
  const [form, setForm] = useState({
    amount: currencyInputFromNumber(transaction.amount),
    category_id: transaction.category_id ?? '',
    description: transaction.description ?? '',
    date: transaction.date,
    payment_method: transaction.payment_method ?? 'pix',
    vehicle_id: transaction.vehicle_id ?? '',
    notes: transaction.notes ?? '',
  })

  useEffect(() => {
    if (!open) return

    setError(null)
    submittingRef.current = false
    setReceiptFile(null)
    setReceiptUrl(transaction.receipt_url)
    setIsOwnerPrep(transaction.is_owner_prep ?? false)
    setForm({
      amount: currencyInputFromNumber(transaction.amount),
      category_id: transaction.category_id ?? '',
      description: transaction.description ?? '',
      date: transaction.date,
      payment_method: transaction.payment_method ?? 'pix',
      vehicle_id: transaction.vehicle_id ?? '',
      notes: transaction.notes ?? '',
    })

    getCategories().then(items => setCategories(items.filter(x => x.type === 'expense')))
    getVehicles().then(setVehicles)
  }, [open, transaction])

  const set = (key: string, value: string) => {
    setForm(current => ({ ...current, [key]: value }))
  }

  const handleVehicleChange = (id: string) => {
    set('vehicle_id', id)
    setIsOwnerPrep(false)
  }

  const selectedVehicle = vehicles.find(v => v.id === form.vehicle_id) ?? null
  const isConsignedVehicle = selectedVehicle?.inventory_type === 'consigned'
  const showOwnerPrepToggle = transaction.type === 'expense' && isConsignedVehicle

  const handleSave = () => {
    const amount = parseCurrencyInput(form.amount)
    if (amount <= 0 || submittingRef.current || pending) return

    submittingRef.current = true
    setError(null)

    startTransition(async () => {
      try {
        const uploadedReceiptUrl = receiptFile ? await uploadReceipt(receiptFile) : receiptUrl

        await updateTransaction({
          id: transaction.id,
          amount,
          category_id: transaction.type === 'expense' ? (form.category_id || null) : null,
          description: form.description,
          date: form.date,
          payment_method: form.payment_method as PaymentMethod,
          vehicle_id: form.vehicle_id || null,
          is_owner_prep: showOwnerPrepToggle && isOwnerPrep,
          notes: form.notes,
          receipt_url: uploadedReceiptUrl,
        })

        onClose()
        router.refresh()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao salvar. Tente novamente.')
        submittingRef.current = false
      }
    })
  }

  const handleDelete = () => {
    startDeleteTransition(async () => {
      try {
        await deleteTransaction(transaction.id)
        setConfirmDelete(false)
        onClose()
        router.refresh()
      } catch { /* ignore */ }
    })
  }

  const typeLabels: Record<string, string> = {
    expense: 'despesa',
    sale: 'venda',
    vehicle_purchase: 'compra de veículo',
    adjustment: 'ajuste',
  }

  const showCategory = transaction.type === 'expense'
  const showVehicle = transaction.type !== 'adjustment'

  return (
    <>
    <BottomSheet open={open} onClose={onClose} title="Editar Transação">
      <div className="space-y-4 pb-6">
        <CurrencyInput
          label="Valor (R$)"
          value={form.amount}
          onChange={value => set('amount', value)}
        />

        {showCategory && (
          <Select label="Categoria" value={form.category_id} onChange={e => set('category_id', e.target.value)}>
            <option value="">Selecionar categoria</option>
            {categories.map(category => (
              <option key={category.id} value={category.id}>{category.name}</option>
            ))}
          </Select>
        )}

        {showVehicle && (
          <Select label="Veículo (opcional)" value={form.vehicle_id} onChange={e => handleVehicleChange(e.target.value)}>
            <option value="">Sem vínculo</option>
            {vehicles.map(vehicle => (
              <option key={vehicle.id} value={vehicle.id}>
                {vehicle.year} {vehicle.make} {vehicle.model}{vehicle.inventory_type === 'consigned' ? ' · Consignado' : ''}
              </option>
            ))}
          </Select>
        )}

        {showOwnerPrepToggle && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
            <button
              onClick={() => setIsOwnerPrep(v => !v)}
              className="w-full flex items-center justify-between"
            >
              <div>
                <p className="text-[13px] text-amber-700 font-medium text-left">Pago pelo dono (reembolso)</p>
                <p className="text-[11px] text-amber-600 mt-0.5 text-left">
                  O dono do carro pagou essa despesa e será reembolsado. Não reduz o lucro da loja.
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
          label="Descrição"
          placeholder="Descrição"
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

        <Input
          label="Observações (opcional)"
          placeholder="Detalhes adicionais"
          value={form.notes}
          onChange={e => set('notes', e.target.value)}
        />

        <ReceiptInput
          receiptUrl={receiptUrl ?? undefined}
          file={receiptFile}
          onFileChange={setReceiptFile}
          onRemoveReceipt={() => setReceiptUrl(null)}
        />

        {error && (
          <p className="text-[13px] text-expense text-center">{error}</p>
        )}

        <Button onClick={handleSave} loading={pending}>
          Salvar Alterações
        </Button>

        <button
          onClick={() => setConfirmDelete(true)}
          className="w-full py-3 text-[14px] font-medium text-expense text-center pressable mt-1"
        >
          Excluir {typeLabels[transaction.type] ?? 'transação'}
        </button>
      </div>
    </BottomSheet>

    <ConfirmModal
      open={confirmDelete}
      onClose={() => setConfirmDelete(false)}
      onConfirm={handleDelete}
      loading={deletePending}
      title="Excluir transação?"
      message={`Esta ${typeLabels[transaction.type] ?? 'transação'} de ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(transaction.amount))} será removida permanentemente.`}
      confirmLabel="Sim, excluir"
    />
    </>
  )
}
