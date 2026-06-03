'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { Input } from '@/components/ui/Input'
import { CurrencyInput } from '@/components/ui/CurrencyInput'
import { ReceiptInput } from '@/components/ui/ReceiptInput'
import { Button } from '@/components/ui/Button'
import { addVehicle } from '@/lib/actions/transactions'
import { parseCurrencyInput } from '@/lib/currency'
import { todayISO } from '@/lib/formatters'
import { uploadReceipt } from '@/lib/receipts'
import { cn } from '@/lib/utils'
import { useSafeSubmit } from '@/lib/hooks/useSafeSubmit'

type InventoryType = 'owned' | 'consigned'

const emptyForm = {
  make: '',
  model: '',
  year: new Date().getFullYear().toString(),
  plate: '',
  purchase_price: '',
  owner_payout_amount: '',
  estimated_sale_price: '',
  purchase_date: todayISO(),
  notes: '',
}

export function AddVehicleSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter()
  const { saving, run } = useSafeSubmit()
  const [inventoryType, setInventoryType] = useState<InventoryType>('owned')
  const [hasCommission, setHasCommission] = useState(false)
  const [receiptFile, setReceiptFile] = useState<File | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState<string | null>(null)

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = () => {
    const isOwned = inventoryType === 'owned'
    const purchase_price = isOwned ? parseCurrencyInput(form.purchase_price) : 0
    const owner_payout = isOwned ? null : parseCurrencyInput(form.owner_payout_amount)
    const estimated = parseCurrencyInput(form.estimated_sale_price)

    if (!form.make || !form.model) return
    if (isOwned && purchase_price <= 0) return
    if (!isOwned && (owner_payout === null || owner_payout < 0)) return

    setError(null)
    run(
      async () => {
        const receiptUrl = receiptFile ? await uploadReceipt(receiptFile) : null
        await addVehicle({
          inventory_type: inventoryType,
          make: form.make,
          model: form.model,
          year: Number(form.year),
          plate: form.plate,
          purchase_price,
          owner_payout_amount: owner_payout,
          commission_rate: !isOwned && hasCommission ? 0.05 : null,
          estimated_sale_price: estimated > 0 ? estimated : null,
          purchase_date: form.purchase_date,
          notes: form.notes,
          receipt_url: receiptUrl,
        })
        setForm(emptyForm)
        setReceiptFile(null)
        setInventoryType('owned')
        setHasCommission(false)
        onClose()
        router.refresh()
      },
      reason => setError(
        reason === 'timeout'
          ? 'Tempo limite atingido. Verifique sua conexão e tente novamente.'
          : 'Conexão interrompida. Toque em Salvar novamente.'
      )
    ).catch(err => {
      setError(err instanceof Error ? err.message : 'Erro ao adicionar veículo. Tente novamente.')
    })
  }

  return (
    <BottomSheet open={open} onClose={onClose} title="Adicionar Veículo">
      <div className="space-y-4 pb-6">

        {/* Inventory type toggle */}
        <div className="flex bg-ios-fill rounded-xl p-1 gap-1">
          {(['owned', 'consigned'] as const).map(type => (
            <button
              key={type}
              onClick={() => { setInventoryType(type); setHasCommission(false) }}
              className={cn(
                'flex-1 py-2 rounded-lg text-[14px] font-medium transition-all',
                inventoryType === type
                  ? 'bg-white shadow-sm text-ios-primary'
                  : 'text-ios-secondary'
              )}
            >
              {type === 'owned' ? 'Próprio' : 'Consignado'}
            </button>
          ))}
        </div>

        {inventoryType === 'consigned' && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 space-y-3">
            <div>
              <p className="text-[12px] text-amber-700 font-medium">Veículo Consignado</p>
              <p className="text-[11px] text-amber-600 mt-0.5">
                O veículo pertence ao dono. A loja recebe o markup/comissão na venda.
              </p>
            </div>
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
              <p className="text-[11px] text-amber-600">
                A comissão será calculada automaticamente: 5% do valor do repasse ao dono.
              </p>
            )}
          </div>
        )}

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

        {inventoryType === 'owned' ? (
          <CurrencyInput
            label="Preço de Compra (R$)"
            value={form.purchase_price}
            onChange={value => set('purchase_price', value)}
          />
        ) : (
          <CurrencyInput
            label="Repasse ao Dono (R$)"
            value={form.owner_payout_amount}
            onChange={value => set('owner_payout_amount', value)}
          />
        )}

        <CurrencyInput
          label="Preço Estimado de Venda (R$)"
          value={form.estimated_sale_price}
          onChange={value => set('estimated_sale_price', value)}
        />

        <Input
          label={inventoryType === 'owned' ? 'Data de Compra' : 'Data de Entrada'}
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

        {error && (
          <p className="text-[13px] text-expense text-center">{error}</p>
        )}

        <Button onClick={handleSubmit} loading={saving} className="bg-ios-primary text-white mt-2">
          {inventoryType === 'owned' ? 'Adicionar ao Estoque' : 'Registrar Consignado'}
        </Button>
      </div>
    </BottomSheet>
  )
}
