import { notFound } from 'next/navigation'
import Link from 'next/link'
import { requireAuth } from '@/lib/auth'
import { ChevronLeft, Car, TrendingUp, Handshake, Key } from 'lucide-react'
import { getVehicleWithProfit } from '@/lib/actions/vehicles'
import { formatBRL, formatDateFull, daysInStock, formatDaysInStock } from '@/lib/formatters'
import { Card } from '@/components/ui/Card'
import { TransactionItem } from '@/components/transactions/TransactionItem'
import { EditVehicleButton } from '@/components/vehicles/EditVehicleButton'
import { cn } from '@/lib/utils'

export const dynamic = 'force-dynamic'

const statusLabel = { in_stock: 'Em Estoque', sold: 'Vendido', archived: 'Arquivado' }

export default async function VehicleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAuth()
  const { id } = await params
  const vehicle = await getVehicleWithProfit(id)
  if (!vehicle) notFound()

  const hasSale = vehicle.sale_price !== null
  const isConsigned = vehicle.inventory_type === 'consigned'
  const days = vehicle.status === 'in_stock' ? daysInStock(vehicle.purchase_date) : null
  const profitColor = !hasSale ? 'text-ios-secondary'
    : vehicle.profit! >= 0 ? 'text-profit' : 'text-expense'

  const costLabel = isConsigned ? 'Repasse ao Dono' : 'Preço de Compra'
  const costValue = isConsigned
    ? (vehicle.owner_payout_amount ?? 0)
    : vehicle.purchase_price

  const rows = [
    { label: costLabel, value: formatBRL(costValue), color: 'text-expense' },
    { label: 'Despesas Vinculadas', value: formatBRL(vehicle.linked_expenses), color: 'text-expense' },
    { label: 'Custo Total', value: formatBRL(vehicle.total_cost), color: 'text-expense', bold: true },
    ...(hasSale
      ? [{ label: 'Preço de Venda', value: formatBRL(vehicle.sale_price!), color: 'text-profit', bold: true }]
      : []),
  ]

  const InventoryIcon = isConsigned ? Handshake : Key
  const inventoryLabel = isConsigned ? 'Consignado' : 'Próprio'
  const inventoryColor = isConsigned ? 'text-amber-600 bg-amber-50' : 'text-blue-600 bg-blue-50'

  return (
    <div className="px-4 pt-12 animate-page-enter">
      {/* Back */}
      <Link href="/veiculos" className="flex items-center gap-1 text-[14px] text-ios-secondary mb-5 pressable -ml-1">
        <ChevronLeft className="w-5 h-5" />
        Estoque
      </Link>

      {/* Hero */}
      <div className="bg-ios-primary rounded-3xl p-6 text-white mb-4">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <p className="text-[12px] text-white/50 uppercase tracking-wider">
                {statusLabel[vehicle.status]}
              </p>
              <span className={cn('text-[10px] font-medium px-2 py-0.5 rounded-md', inventoryColor)}>
                {inventoryLabel}
              </span>
            </div>
            <h1 className="text-[24px] font-bold">{vehicle.year} {vehicle.make}</h1>
            <p className="text-[20px] font-medium text-white/80">{vehicle.model}</p>
          </div>
          <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
            <InventoryIcon className="w-6 h-6 text-white/60" />
          </div>
        </div>

        <div className="mb-4">
          <EditVehicleButton vehicle={vehicle} />
        </div>

        <div className="flex items-center gap-2 flex-wrap mb-4">
          {vehicle.plate && (
            <div className="inline-flex px-3 py-1 bg-white/10 rounded-lg">
              <span className="text-[13px] font-mono text-white/80">{vehicle.plate}</span>
            </div>
          )}
          {days !== null && (
            <div className={cn(
              'inline-flex px-3 py-1 rounded-lg',
              days >= 60 ? 'bg-orange-400/20' : 'bg-white/10'
            )}>
              <span className={cn(
                'text-[12px] font-medium',
                days >= 60 ? 'text-orange-300' : 'text-white/70'
              )}>
                {formatDaysInStock(days)}
              </span>
            </div>
          )}
        </div>

        <div>
          <p className="text-[12px] text-white/50 mb-1">
            {hasSale ? 'Lucro Final' : 'Custo até agora'}
          </p>
          <p className={cn('text-[36px] font-bold tabular-nums', hasSale ? profitColor : 'text-taquinho')}>
            {hasSale
              ? `${vehicle.profit! >= 0 ? '+' : ''}${formatBRL(vehicle.profit!)}`
              : formatBRL(vehicle.total_cost)
            }
          </p>
          {hasSale && vehicle.profit_margin !== null && (
            <div className="flex items-center gap-1.5 mt-1">
              <TrendingUp className="w-3.5 h-3.5 text-white/40" />
              <span className="text-[12px] text-white/50">
                {vehicle.profit_margin.toFixed(1)}% de margem
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Profit breakdown */}
      <Card className="mb-4">
        <p className="text-[14px] font-semibold text-ios-primary mb-4">Detalhamento</p>

        {isConsigned && (
          <div className="bg-amber-50 border border-amber-100 rounded-xl px-3 py-2 mb-4">
            <p className="text-[11px] text-amber-600">
              Veículo consignado — o repasse ao dono é descontado do lucro da loja.
            </p>
          </div>
        )}

        <div className="space-y-3">
          {rows.map(row => (
            <div key={row.label} className="flex items-center justify-between">
              <span className="text-[13px] text-ios-secondary">{row.label}</span>
              <span className={cn(
                'text-[14px] tabular-nums',
                row.bold ? 'font-semibold' : 'font-medium',
                row.color
              )}>
                {row.value}
              </span>
            </div>
          ))}

          {hasSale && (
            <div className="border-t border-ios-border pt-3 flex items-center justify-between">
              <span className="text-[14px] font-semibold text-ios-primary">Lucro da Loja</span>
              <span className={cn('text-[16px] font-bold tabular-nums', profitColor)}>
                {vehicle.profit! >= 0 ? '+' : ''}{formatBRL(vehicle.profit!)}
              </span>
            </div>
          )}
        </div>
      </Card>

      {/* Info */}
      <Card className="mb-4">
        <p className="text-[14px] font-semibold text-ios-primary mb-3">Informações</p>
        <div className="space-y-2">
          <Row
            label={isConsigned ? 'Data de Entrada' : 'Data de Compra'}
            value={formatDateFull(vehicle.purchase_date)}
          />
          {vehicle.estimated_sale_price != null && (
            <Row label="Preço Estimado" value={formatBRL(vehicle.estimated_sale_price)} />
          )}
          {vehicle.notes && <Row label="Observações" value={vehicle.notes} />}
          {vehicle.receipt_url && (
            <div className="pt-2">
              <p className="text-[13px] text-ios-secondary mb-2">Comprovante</p>
              <a href={vehicle.receipt_url} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-xl bg-ios-fill">
                <img src={vehicle.receipt_url} alt="Comprovante do veículo" className="h-40 w-full object-cover" />
              </a>
            </div>
          )}
        </div>
      </Card>

      {/* Transactions (exclude vehicle_purchase from display — it's an internal accounting entry) */}
      {vehicle.transactions.filter(t => t.type !== 'vehicle_purchase').length > 0 && (
        <Card padding="none" className="mb-4">
          <p className="text-[14px] font-semibold text-ios-primary px-4 pt-4 pb-2">
            Transações ({vehicle.transactions.filter(t => t.type !== 'vehicle_purchase').length})
          </p>
          <div className="px-4 pb-2 divide-y divide-ios-border/50">
            {vehicle.transactions
              .filter(t => t.type !== 'vehicle_purchase')
              .map(tx => (
                <TransactionItem key={tx.id} tx={tx as never} showCategory />
              ))}
          </div>
        </Card>
      )}
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-[13px] text-ios-secondary flex-shrink-0">{label}</span>
      <span className="text-[13px] text-ios-primary text-right">{value}</span>
    </div>
  )
}
