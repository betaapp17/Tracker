'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { Button } from '@/components/ui/Button'
import { CurrencyInput } from '@/components/ui/CurrencyInput'
import { Input, Select } from '@/components/ui/Input'
import { ReceiptInput } from '@/components/ui/ReceiptInput'
import { updateVehicle, deleteVehicle } from '@/lib/actions/vehicles'
import { currencyInputFromNumber, parseCurrencyInput } from '@/lib/currency'
import { uploadReceipt } from '@/lib/receipts'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import { cn } from '@/lib/utils'
import type { VehicleWithProfit, VehicleStatus, InventoryType } from '@/lib/types'

interface EditVehicleSheetProps {
  vehicle: VehicleWithProfit
  open: boolean
  onClose: () => void
}

export function EditVehicleSheet({ vehicle, open, onClose }: EditVehicleSheetProps) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [deletePending, startDeleteTransition] = useTransition()
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [receiptFile, setReceiptFile] = useState<File | null>(null)
  const [receiptUrl, setReceiptUrl] = useState(vehicle.receipt_url)
  const [hasCommission, setHasCommission] = useState(!!vehicle.commission_rate)
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
    setHasCommission(!!vehicle.commission_rate)
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

  const handleDelete = () => {
    startDeleteTransition(async () => {
      try {
        await deleteVehicle(vehicle.id)
        setConfirmDelete(false)
        onClose()
        router.refresh()
      } catch { /* ignore */ }
    })
  }

  const linkedCount = vehicle.transactions.filter(t => t.type !== 'vehicle_purchase').length

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
          commission_rate: isConsigned && hasCommission ? 0.05 : null,
          estimated_sale_price: estimated > 0 ? estimated : null,
          purchase_date: form.purchase_date,
          status: form.status as VehicleStatus,
          notes: form.notes,
          receipt_url: uploadedReceiptUrl,
        })

        onClose()
        router.refresh()
      } catch {
        // Keep sheet open on error
      }
    })
  }

  return (
    <>
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

        {isConsigned && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
            <button
              onClick={() => setHasCommission(v => !v)}
              className="w-full flex items-center justify-between"
            >
              <span className="text-[13px] text-amber-700 font-medium">Comissão 5% sobre repasse</span>
              <div className={cn(
                'w-11 h-6 rounded-full transition-colors relative',
                hasCommission ? 'bg-amber-500' : 'bg-amber-200'
              )}>
                <div className={cn(
                  'absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform',
                  hasCommission ? 'translate-x-5' : 'translate-x-0.5'
                )} />
              </div>
            </button>
            {hasCommission && (
              <p className="text-[11px] text-amber-600 mt-2">
                Comissão calculada automaticamente: 5% do valor do repasse ao dono.
              </p>
            )}
          </div>
        )}

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

        <button
          onClick={() => setConfirmDelete(true)}
          className="w-full py-3 text-[14px] font-medium text-expense text-center pressable mt-1"
        >
          Excluir veículo
        </button>
      </div>
    </BottomSheet>

    <ConfirmModal
      open={confirmDelete}
      onClose={() => setConfirmDelete(false)}
      onConfirm={handleDelete}
      loading={deletePending}
      title="Excluir veículo?"
      message={`${vehicle.year} ${vehicle.make} ${vehicle.model} será removido permanentemente.`}
      warning={
        linkedCount > 0
          ? `Este veículo tem ${linkedCount} transação${linkedCount > 1 ? 'ões' : ''} vinculada${linkedCount > 1 ? 's' : ''} (despesas ou vendas). Elas serão desvinculadas do veículo, mas não excluídas.`
          : undefined
      }
      confirmLabel="Sim, excluir veículo"
    />
    </>
  )
}
