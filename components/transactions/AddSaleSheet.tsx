'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { Input, Select } from '@/components/ui/Input'
import { CurrencyInput } from '@/components/ui/CurrencyInput'
import { ReceiptInput } from '@/components/ui/ReceiptInput'
import { Button } from '@/components/ui/Button'
import { addDeal } from '@/lib/actions/deals'
import { getVehicles } from '@/lib/actions/vehicles'
import { parseCurrencyInput } from '@/lib/currency'
import { todayISO, formatBRL } from '@/lib/formatters'
import { uploadReceipt } from '@/lib/receipts'
import { useSafeSubmit } from '@/lib/hooks/useSafeSubmit'
import type { Vehicle } from '@/lib/types'

export function AddSaleSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter(); const { saving, run } = useSafeSubmit()
  const [vehicles, setVehicles] = useState<Vehicle[]>([]); const [receiptFile, setReceiptFile] = useState<File | null>(null); const [error, setError] = useState<string | null>(null)
  const [hasTrade, setHasTrade] = useState(false)
  const [form, setForm] = useState({ vehicle_id: '', amount: '', date: todayISO(), payment_method: 'pix', notes: '', trade_make: '', trade_model: '', trade_year: '', trade_plate: '', trade_value: '' })
  useEffect(() => { if (open) { setError(null); getVehicles('in_stock').then(setVehicles) } }, [open])
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))
  const selectedVehicle = vehicles.find(v => v.id === form.vehicle_id) ?? null
  const saleValue = parseCurrencyInput(form.amount); const tradeValue = hasTrade ? parseCurrencyInput(form.trade_value) : 0; const difference = saleValue - tradeValue

  const handleSubmit = () => {
    if (!form.vehicle_id || saleValue <= 0) return
    if (hasTrade && (!form.trade_make.trim() || !form.trade_model.trim() || !form.trade_year || tradeValue <= 0)) { setError('Preencha os dados e o valor do veículo recebido na troca.'); return }
    setError(null)
    run(async () => {
      const receiptUrl = receiptFile ? await uploadReceipt(receiptFile) : null
      await addDeal({ outgoing_vehicle_id: form.vehicle_id, sale_price: saleValue, date: form.date, payment_method: form.payment_method as never, notes: form.notes, receipt_url: receiptUrl,
        trade_in: hasTrade ? { make: form.trade_make, model: form.trade_model, year: Number(form.trade_year), plate: form.trade_plate, value: tradeValue } : null })
      setForm({ vehicle_id: '', amount: '', date: todayISO(), payment_method: 'pix', notes: '', trade_make: '', trade_model: '', trade_year: '', trade_plate: '', trade_value: '' }); setHasTrade(false); setReceiptFile(null); onClose(); router.refresh()
    }, reason => setError(reason === 'timeout' ? 'Tempo limite atingido. Verifique sua conexão e tente novamente.' : 'Conexão interrompida. Toque em Salvar novamente.')).catch(err => setError(err instanceof Error ? err.message : 'Erro ao registrar venda.'))
  }

  return <BottomSheet open={open} onClose={onClose} title="Registrar Venda"><div className="space-y-4 pb-6">
    <Select label="Veículo vendido" value={form.vehicle_id} onChange={e => set('vehicle_id', e.target.value)}><option value="">Selecionar veículo</option>{vehicles.map(v => <option key={v.id} value={v.id}>{v.year} {v.make} {v.model}{v.inventory_type === 'consigned' ? ' · Consignado' : ''}</option>)}</Select>
    {selectedVehicle?.inventory_type === 'consigned' && selectedVehicle.owner_payout_amount != null && <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-[12px] text-amber-700">Veículo consignado · Repasse ao dono: <b>{formatBRL(selectedVehicle.owner_payout_amount)}</b></div>}
    <CurrencyInput label="Valor negociado / Preço de venda (R$)" value={form.amount} onChange={v => set('amount', v)} />
    <div className="rounded-xl border p-3"><label className="flex items-center gap-3 text-sm font-medium"><input type="checkbox" checked={hasTrade} onChange={e => setHasTrade(e.target.checked)} /> Cliente deu um veículo na troca</label></div>
    {hasTrade && <div className="space-y-3 rounded-xl border p-3"><p className="text-sm font-semibold">Veículo recebido</p><div className="grid grid-cols-2 gap-3"><Input label="Marca" value={form.trade_make} onChange={e => set('trade_make', e.target.value)} /><Input label="Modelo" value={form.trade_model} onChange={e => set('trade_model', e.target.value)} /><Input label="Ano" type="number" value={form.trade_year} onChange={e => set('trade_year', e.target.value)} /><Input label="Placa" value={form.trade_plate} onChange={e => set('trade_plate', e.target.value)} /></div><CurrencyInput label="Valor considerado na troca (R$)" value={form.trade_value} onChange={v => set('trade_value', v)} /></div>}
    {saleValue > 0 && <div className="rounded-xl bg-gray-50 p-4 text-sm space-y-1"><div className="flex justify-between"><span>Valor da venda</span><b>{formatBRL(saleValue)}</b></div>{hasTrade && <div className="flex justify-between"><span>Veículo recebido</span><span>- {formatBRL(tradeValue)}</span></div>}<div className="border-t pt-2 mt-2 flex justify-between font-semibold"><span>{difference > 0 ? 'Cliente paga' : difference < 0 ? 'Loja paga ao cliente' : 'Troca sem diferença'}</span><span>{formatBRL(Math.abs(difference))}</span></div></div>}
    <Input label="Data da Venda" type="date" value={form.date} onChange={e => set('date', e.target.value)} />
    {difference !== 0 && <Select label={difference < 0 ? 'Forma de pagamento da loja' : 'Forma de pagamento do cliente'} value={form.payment_method} onChange={e => set('payment_method', e.target.value)}><option value="pix">PIX</option><option value="cash">Dinheiro</option><option value="card">Cartão</option><option value="transfer">Transferência</option><option value="financing">Financiamento</option></Select>}
    <Input label="Observações (opcional)" placeholder="Nome do comprador, detalhes..." value={form.notes} onChange={e => set('notes', e.target.value)} /><ReceiptInput file={receiptFile} onFileChange={setReceiptFile} />
    {error && <p className="text-[13px] text-expense text-center">{error}</p>}<Button onClick={handleSubmit} loading={saving} className="bg-profit text-white mt-2">Confirmar Negociação</Button>
  </div></BottomSheet>
}
